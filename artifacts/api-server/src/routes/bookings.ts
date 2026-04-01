import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, restaurantsTable, openingHoursTable, waitlistTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte, type SQL, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth } from "../middleware/requireAuth.js";
import { awardAndLog, POINTS } from "../lib/points.js";
import { invoiceService } from "../services/invoiceService.js";
import { notifyAsync } from "../lib/notify.js";

const router: IRouter = Router();

// List bookings — auth required
// If restaurantId is provided and user owns that restaurant, return all bookings for it.
// Otherwise, return only the requesting user's own bookings.
router.get("/bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, status, from, to, limit = "20", offset = "0" } = req.query;
    const conditions: SQL[] = [];

    if (restaurantId) {
      const rid = parseInt(restaurantId as string);
      // Check if caller owns this restaurant
      const [restaurant] = await db.select({ ownerId: restaurantsTable.ownerId })
        .from(restaurantsTable).where(eq(restaurantsTable.id, rid));
      if (restaurant && restaurant.ownerId === userId) {
        // Restaurant owner: see all bookings for their venue
        conditions.push(eq(bookingsTable.restaurantId, rid));
      } else {
        // Other users: see only their own bookings for this restaurant
        conditions.push(eq(bookingsTable.userId, userId));
        conditions.push(eq(bookingsTable.restaurantId, rid));
      }
    } else {
      // No restaurantId filter: return only the caller's own bookings
      conditions.push(eq(bookingsTable.userId, userId));
    }

    if (status) conditions.push(eq(bookingsTable.status, status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'));
    if (from) conditions.push(gte(bookingsTable.date, from as string));
    if (to) conditions.push(lte(bookingsTable.date, to as string));

    const bookings = await db.select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      restaurantId: bookingsTable.restaurantId,
      date: bookingsTable.date,
      time: bookingsTable.time,
      partySize: bookingsTable.partySize,
      status: bookingsTable.status,
      occasionId: bookingsTable.occasionId,
      specialRequests: bookingsTable.specialRequests,
      referenceCode: bookingsTable.referenceCode,
      invoiceRef: bookingsTable.invoiceRef,
      createdAt: bookingsTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(bookingsTable)
      .innerJoin(restaurantsTable, eq(bookingsTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(sql`${bookingsTable.createdAt} desc`);

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(bookingsTable)
      .where(and(...conditions));

    res.json({
      bookings,
      total: Number(total[0]?.count ?? 0),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch bookings");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch bookings" });
  }
});

// Create booking
router.post("/bookings", requireAuth, async (req, res) => {
  try {
    const { restaurantId, date, time, partySize, occasionId, specialRequests } = req.body;
    if (!restaurantId || !date || !time || !partySize) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const userId = req.auth!.userId;

    // Server-side availability guard: check slot capacity atomically
    // Parse YYYY-MM-DD using local year/month/day to avoid timezone shift
    const [dateYear, dateMonth, dateDay] = (date as string).split('-').map(Number);
    const requestedDate = new Date(dateYear!, (dateMonth ?? 1) - 1, dateDay);
    const dayOfWeek = requestedDate.getDay(); // local day-of-week (0=Sun)
    const SEAT_CAPACITY = 40;

    const [hours] = await db.select()
      .from(openingHoursTable)
      .where(and(
        eq(openingHoursTable.restaurantId, restaurantId),
        eq(openingHoursTable.dayOfWeek, dayOfWeek),
      ));

    if (!hours || hours.isClosed) {
      res.status(400).json({ error: "bad_request", message: "Restaurant is closed on the requested date" });
      return;
    }

    // Validate requested time against opening hours window and 30-min slot alignment
    if (!hours.openTime || !hours.closeTime) {
      res.status(400).json({ error: "bad_request", message: "Restaurant hours not configured for this day" });
      return;
    }
    const [reqH, reqM] = (time as string).split(':').map(Number);
    const requestedMinutes = (reqH ?? 0) * 60 + (reqM ?? 0);

    if (reqM !== 0 && reqM !== 30) {
      res.status(400).json({ error: "bad_request", message: "Booking time must be on a 30-minute slot (e.g. 12:00 or 12:30)" });
      return;
    }

    const [openH, openM] = hours.openTime.split(':').map(Number);
    const [closeH, closeM] = hours.closeTime.split(':').map(Number);
    const openMinutes = (openH ?? 0) * 60 + (openM ?? 0);
    const closeMinutes = (closeH ?? 0) * 60 + (closeM ?? 0);

    if (requestedMinutes < openMinutes || requestedMinutes >= closeMinutes) {
      res.status(400).json({
        error: "bad_request",
        message: `Booking time must be between ${hours.openTime} and ${hours.closeTime}`,
      });
      return;
    }

    const referenceCode = `TBQ-${nanoid(8).toUpperCase()}`;

    // Acquire a per-slot advisory lock inside a transaction to prevent concurrent overbooking.
    // Lock key: hash of (restaurantId, date string, time string) → bigint via pg hashtext
    let booking: typeof bookingsTable.$inferSelect;
    try {
      const result = await db.transaction(async (tx) => {
        // Advisory lock scoped to this transaction (auto-released on commit/rollback)
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(
            hashtext(${`${restaurantId}:${date}:${time}`}::text)::bigint
          )
        `);

        // Re-count inside the lock
        const [{ bookedSeats }] = await tx.select({
          bookedSeats: sql<number>`COALESCE(SUM(${bookingsTable.partySize}), 0)`,
        }).from(bookingsTable).where(and(
          eq(bookingsTable.restaurantId, restaurantId),
          eq(bookingsTable.date, date),
          eq(bookingsTable.time, time),
          sql`${bookingsTable.status} IN ('pending','confirmed')`,
        ));

        const remaining = SEAT_CAPACITY - Number(bookedSeats);
        if (remaining < partySize) {
          throw Object.assign(new Error("no_capacity"), { remaining, statusCode: 409 });
        }

        const [created] = await tx.insert(bookingsTable).values({
          userId,
          restaurantId,
          date,
          time,
          partySize,
          occasionId,
          specialRequests,
          referenceCode,
          tableType: req.body.tableType ?? "indoor",
          preOrderItems: req.body.preOrderItems ?? [],
          status: "confirmed",
        }).returning();
        return created!;
      });
      booking = result;
    } catch (err) {
      if (err instanceof Error && err.message === "no_capacity") {
        const e = err as Error & { remaining: number };
        res.status(409).json({ error: "conflict", message: "No available seats for this time slot", remaining: e.remaining });
        return;
      }
      throw err;
    }

    const [restaurant] = await db.select().from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurantId));

    // Award points for making a booking
    await awardAndLog(userId, POINTS.BOOKING_MADE, "booking_made", booking.id, "booking",
      `Earned ${POINTS.BOOKING_MADE} pts for booking at restaurant #${restaurantId}`);

    // FIX 1: Generate customer invoice for this booking (bookings are free table reservations)
    let invoiceRef: string | null = null;
    try {
      const invoiceResult = await invoiceService.processBooking({
        bookingId: booking.id,
        userId,
        restaurantId,
        restaurantNameEn: restaurant?.nameEn ?? "",
        restaurantNameAr: restaurant?.nameAr ?? "",
        partySize,
        date,
        time,
        total: 0,
        currency: "SAR",
        paymentMethod: "free",
      });
      invoiceRef = invoiceResult.invoiceRef;

      // Store invoiceRef on the booking record
      if (invoiceRef) {
        await db.update(bookingsTable)
          .set({ invoiceRef })
          .where(eq(bookingsTable.id, booking.id));
      }
    } catch (invoiceErr) {
      req.log.warn({ invoiceErr }, "Booking invoice creation failed (non-critical)");
    }

    // FIX 5: Fire notification (non-blocking)
    notifyAsync({
      userId,
      type: "booking_confirmed",
      titleEn: "Booking Confirmed",
      titleAr: "تم تأكيد الحجز",
      bodyEn: `Your table at ${restaurant?.nameEn ?? "the restaurant"} for ${partySize} guests on ${date} at ${time} is confirmed. Reference: ${referenceCode}.`,
      bodyAr: `تم تأكيد طاولتك في ${restaurant?.nameAr ?? "المطعم"} لـ ${partySize} أشخاص في ${date} الساعة ${time}. المرجع: ${referenceCode}.`,
      refId: booking.id,
      refType: "booking",
    });

    // qrPayload is the canonical machine-readable content for the booking QR code.
    const qrPayload = `TABAQ:BOOKING:${booking.id}:${referenceCode}`;

    res.status(201).json({
      ...booking,
      invoiceRef,
      restaurantNameEn: restaurant?.nameEn ?? "",
      restaurantNameAr: restaurant?.nameAr ?? "",
      restaurantCoverImageUrl: restaurant?.coverImageUrl ?? null,
      qrPayload,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create booking");
    res.status(500).json({ error: "internal_error", message: "Failed to create booking" });
  }
});

// Get single booking — auth required, only owner can view
router.get("/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params["bookingId"] as string, 10);
    const userId = req.auth!.userId;

    const [booking] = await db.select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      restaurantId: bookingsTable.restaurantId,
      date: bookingsTable.date,
      time: bookingsTable.time,
      partySize: bookingsTable.partySize,
      status: bookingsTable.status,
      occasionId: bookingsTable.occasionId,
      specialRequests: bookingsTable.specialRequests,
      referenceCode: bookingsTable.referenceCode,
      invoiceRef: bookingsTable.invoiceRef,
      createdAt: bookingsTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(bookingsTable)
      .innerJoin(restaurantsTable, eq(bookingsTable.restaurantId, restaurantsTable.id))
      .where(eq(bookingsTable.id, bookingId));

    if (!booking) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }
    if (booking.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only view your own bookings" });
      return;
    }
    res.json(booking);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch booking" });
  }
});

// Update booking status — auth required, only owner can cancel; restaurant staff can confirm/complete
router.patch("/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params["bookingId"] as string, 10);
    const userId = req.auth!.userId;
    const { status, date, time, partySize } = req.body;

    const [existing] = await db.select({
      userId: bookingsTable.userId,
      restaurantId: bookingsTable.restaurantId,
    }).from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }

    // Check if the caller owns the restaurant this booking belongs to
    const [restaurant] = await db.select({ ownerId: restaurantsTable.ownerId })
      .from(restaurantsTable).where(eq(restaurantsTable.id, existing.restaurantId));
    const isRestaurantOwner = restaurant?.ownerId === userId;

    // Users can cancel their own bookings
    if (status === "cancelled" && existing.userId !== userId && !isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "You can only cancel your own bookings" });
      return;
    }
    // Only restaurant owners can confirm / complete / mark no_show
    if (status && status !== "cancelled" && !isRestaurantOwner && existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Not authorized to update this booking" });
      return;
    }
    if (status && ["confirmed", "completed", "no_show"].includes(status) && !isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "Only restaurant owners can confirm, complete or mark no-show" });
      return;
    }
    // Users can modify date/time/partySize of their own upcoming bookings
    if ((date || time || partySize) && existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only modify your own bookings" });
      return;
    }

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updatePayload["status"] = status;
    if (date) updatePayload["date"] = date;
    if (time) updatePayload["time"] = time;
    if (partySize) updatePayload["partySize"] = partySize;

    const [booking] = await db.update(bookingsTable)
      .set(updatePayload)
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    // FIX 5: Fire notifications (non-blocking)
    if (status === "confirmed" && existing.userId) {
      notifyAsync({
        userId: existing.userId,
        type: "booking_confirmed",
        titleEn: "Booking Confirmed",
        titleAr: "تم تأكيد الحجز",
        bodyEn: "Your booking has been confirmed by the restaurant.",
        bodyAr: "تم تأكيد حجزك من قِبل المطعم.",
        refId: bookingId,
        refType: "booking",
      });
    } else if (status === "cancelled" && existing.userId) {
      notifyAsync({
        userId: existing.userId,
        type: "booking_cancelled",
        titleEn: "Booking Cancelled",
        titleAr: "تم إلغاء الحجز",
        bodyEn: "Your booking has been cancelled.",
        bodyAr: "تم إلغاء حجزك.",
        refId: bookingId,
        refType: "booking",
      });
    }

    const [bookingRestaurant] = await db.select().from(restaurantsTable)
      .where(eq(restaurantsTable.id, booking.restaurantId));
    res.json({
      ...booking,
      restaurantNameEn: bookingRestaurant?.nameEn ?? "",
      restaurantNameAr: bookingRestaurant?.nameAr ?? "",
      restaurantCoverImageUrl: bookingRestaurant?.coverImageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update booking");
    res.status(500).json({ error: "internal_error", message: "Failed to update booking" });
  }
});

// Crowd prediction for a restaurant on a given date
router.get("/restaurants/:restaurantId/crowd-prediction", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { date } = req.query;
    if (!date) return void res.status(400).json({ error: "bad_request", message: "date required" });

    const SEAT_CAPACITY = 40;
    const slots = await db.select({
      time: bookingsTable.time,
      bookedSeats: sql<number>`COALESCE(SUM(${bookingsTable.partySize}), 0)`,
    }).from(bookingsTable)
      .where(and(
        eq(bookingsTable.restaurantId, restaurantId),
        eq(bookingsTable.date, date as string),
        sql`${bookingsTable.status} IN ('pending','confirmed')`,
      ))
      .groupBy(bookingsTable.time);

    const slotPredictions = slots.map(s => {
      const pct = Number(s.bookedSeats) / SEAT_CAPACITY;
      const level = pct >= 0.8 ? "busy" : pct >= 0.5 ? "moderate" : "quiet";
      return { time: s.time, bookedSeats: Number(s.bookedSeats), capacity: SEAT_CAPACITY, fillPercent: Math.round(pct * 100), level };
    });

    // Overall day prediction
    const totalBooked = slotPredictions.reduce((sum, s) => sum + s.bookedSeats, 0);
    const avgFill = slotPredictions.length ? totalBooked / (slotPredictions.length * SEAT_CAPACITY) : 0;
    const dayLevel = avgFill >= 0.75 ? "busy" : avgFill >= 0.4 ? "moderate" : "quiet";

    res.json({ date, dayLevel, fillPercent: Math.round(avgFill * 100), slots: slotPredictions });
  } catch (err) {
    req.log.error({ err }, "Failed to get crowd prediction");
    res.status(500).json({ error: "internal_error" });
  }
});

// Suggested booking times (AI-mock logic based on crowd data)
router.get("/restaurants/:restaurantId/suggested-times", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { date, partySize = "2" } = req.query;
    if (!date) return void res.status(400).json({ error: "bad_request", message: "date required" });

    const SEAT_CAPACITY = 40;
    const [hours] = await db.select().from(openingHoursTable)
      .where(and(
        eq(openingHoursTable.restaurantId, restaurantId),
      ));

    const openTime = hours?.openTime ?? "12:00";
    const closeTime = hours?.closeTime ?? "22:00";
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMin = (openH ?? 12) * 60 + (openM ?? 0);
    const closeMin = (closeH ?? 22) * 60 + (closeM ?? 0);

    // Generate all 30-min slots
    const allSlots: string[] = [];
    for (let m = openMin; m < closeMin; m += 30) {
      const h = Math.floor(m / 60).toString().padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      allSlots.push(`${h}:${min}`);
    }

    // Get booked seats per slot
    const booked = await db.select({
      time: bookingsTable.time,
      bookedSeats: sql<number>`COALESCE(SUM(${bookingsTable.partySize}), 0)`,
    }).from(bookingsTable)
      .where(and(
        eq(bookingsTable.restaurantId, restaurantId),
        eq(bookingsTable.date, date as string),
        sql`${bookingsTable.status} IN ('pending','confirmed')`,
      ))
      .groupBy(bookingsTable.time);

    const bookedMap = Object.fromEntries(booked.map(b => [b.time, Number(b.bookedSeats)]));
    const reqPartySize = parseInt(partySize as string, 10);

    const suggestions = allSlots
      .map(slot => {
        const seated = bookedMap[slot] ?? 0;
        const remaining = SEAT_CAPACITY - seated;
        const fillPct = seated / SEAT_CAPACITY;
        const available = remaining >= reqPartySize;
        const [h] = slot.split(":").map(Number);
        const idealBonus = (h ?? 0) >= 19 && (h ?? 0) <= 21 ? 20 : 0;
        const score = available ? Math.round((1 - fillPct) * 80 + idealBonus) : 0;
        return { time: slot, remaining, fillPercent: Math.round(fillPct * 100), available, score, isRecommended: score >= 80 };
      })
      .filter(s => s.available)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    res.json({ suggestions, date });
  } catch (err) {
    req.log.error({ err }, "Failed to get suggested times");
    res.status(500).json({ error: "internal_error" });
  }
});

// Get availability for a restaurant on a date
router.get("/restaurants/:restaurantId/availability", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { date } = req.query;
    if (!date) return void res.status(400).json({ error: "bad_request", message: "date required" });

    const SEAT_CAPACITY = 40;
    const [hours] = await db.select().from(openingHoursTable)
      .where(eq(openingHoursTable.restaurantId, restaurantId));

    if (!hours || hours.isClosed) {
      return void res.json({ slots: [], isClosed: true });
    }

    const openTime = hours.openTime ?? "12:00";
    const closeTime = hours.closeTime ?? "22:00";
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMin = (openH ?? 12) * 60 + (openM ?? 0);
    const closeMin = (closeH ?? 22) * 60 + (closeM ?? 0);

    const allSlots: string[] = [];
    for (let m = openMin; m < closeMin; m += 30) {
      const h = Math.floor(m / 60).toString().padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      allSlots.push(`${h}:${min}`);
    }

    const booked = await db.select({
      time: bookingsTable.time,
      bookedSeats: sql<number>`COALESCE(SUM(${bookingsTable.partySize}), 0)`,
    }).from(bookingsTable)
      .where(and(
        eq(bookingsTable.restaurantId, restaurantId),
        eq(bookingsTable.date, date as string),
        sql`${bookingsTable.status} IN ('pending','confirmed')`,
      ))
      .groupBy(bookingsTable.time);

    const bookedMap = Object.fromEntries(booked.map(b => [b.time, Number(b.bookedSeats)]));
    const slots = allSlots.map(slot => {
      const seated = bookedMap[slot] ?? 0;
      const remaining = SEAT_CAPACITY - seated;
      return { time: slot, remaining, capacity: SEAT_CAPACITY, available: remaining > 0 };
    });

    res.json({ slots, isClosed: false, openTime, closeTime });
  } catch (err) {
    req.log.error({ err }, "Failed to get availability");
    res.status(500).json({ error: "internal_error" });
  }
});

// Join waitlist
router.post("/waitlist", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, date, time, partySize, tableType } = req.body;
    if (!restaurantId || !date || !time || !partySize) {
      return void res.status(400).json({ error: "bad_request", message: "Missing required fields" });
    }

    // Get current waitlist position
    const [posResult] = await db.select({ cnt: sql<number>`count(*)` })
      .from(waitlistTable)
      .where(and(
        eq(waitlistTable.restaurantId, restaurantId),
        eq(waitlistTable.date, date),
        eq(waitlistTable.time, time),
        sql`${waitlistTable.status} = 'waiting'`,
      ));
    const position = Number(posResult?.cnt ?? 0) + 1;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const [entry] = await db.insert(waitlistTable).values({
      userId, restaurantId, date, time, partySize,
      tableType: tableType ?? "indoor",
      position, status: "waiting", expiresAt,
    }).returning();

    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to join waitlist");
    res.status(500).json({ error: "internal_error" });
  }
});

// Get user's waitlist entries
router.get("/waitlist", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const entries = await db.select({
      id: waitlistTable.id,
      restaurantId: waitlistTable.restaurantId,
      date: waitlistTable.date,
      time: waitlistTable.time,
      partySize: waitlistTable.partySize,
      tableType: waitlistTable.tableType,
      status: waitlistTable.status,
      position: waitlistTable.position,
      expiresAt: waitlistTable.expiresAt,
      createdAt: waitlistTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
    }).from(waitlistTable)
      .innerJoin(restaurantsTable, eq(waitlistTable.restaurantId, restaurantsTable.id))
      .where(eq(waitlistTable.userId, userId))
      .orderBy(waitlistTable.createdAt);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to get waitlist" );
    res.status(500).json({ error: "internal_error" });
  }
});

// Leave waitlist
router.delete("/waitlist/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const userId = req.auth!.userId;
    const [entry] = await db.select({ userId: waitlistTable.userId }).from(waitlistTable).where(eq(waitlistTable.id, id));
    if (!entry) return void res.status(404).json({ error: "not_found" });
    if (entry.userId !== userId) return void res.status(403).json({ error: "forbidden" });
    await db.delete(waitlistTable).where(eq(waitlistTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to leave waitlist");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
