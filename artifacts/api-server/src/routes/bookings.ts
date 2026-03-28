import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, restaurantsTable, openingHoursTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth } from "../middleware/requireAuth.js";
import { awardPoints, POINTS } from "../lib/points.js";

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
          status: "pending",
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
    await awardPoints(userId, POINTS.BOOKING_MADE);

    // Notification stubs: in production these trigger push/SMS/email events
    req.log.info({ bookingId: booking.id, userId, referenceCode }, "NOTIFY: booking confirmation — send to user");
    req.log.info({ bookingId: booking.id, restaurantId }, "NOTIFY: new reservation alert — send to restaurant");

    res.status(201).json({
      ...booking,
      restaurantNameEn: restaurant?.nameEn ?? "",
      restaurantNameAr: restaurant?.nameAr ?? "",
      restaurantCoverImageUrl: restaurant?.coverImageUrl ?? null,
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
    const { status } = req.body;

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
    if (status !== "cancelled" && !isRestaurantOwner && existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Not authorized to update this booking" });
      return;
    }
    if (["confirmed", "completed", "no_show"].includes(status) && !isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "Only restaurant owners can confirm, complete or mark no-show" });
      return;
    }

    const [booking] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    // Notification stubs
    if (status === "confirmed") {
      req.log.info({ bookingId, userId: existing.userId }, "NOTIFY: booking confirmed — send confirmation to user");
    } else if (status === "cancelled") {
      req.log.info({ bookingId, userId: existing.userId }, "NOTIFY: booking cancelled — send cancellation notice to user");
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

export default router;
