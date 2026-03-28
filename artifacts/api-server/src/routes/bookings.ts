import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { awardPoints, POINTS } from "../lib/points.js";

const router: IRouter = Router();

// List bookings — auth required; non-admin users only see their own
router.get("/bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, status, from, to, limit = "20", offset = "0" } = req.query;
    const conditions: SQL[] = [eq(bookingsTable.userId, userId)];
    if (restaurantId) conditions.push(eq(bookingsTable.restaurantId, parseInt(restaurantId as string)));
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
    const referenceCode = `TBQ-${nanoid(8).toUpperCase()}`;

    const [booking] = await db.insert(bookingsTable).values({
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

    const [existing] = await db.select({ userId: bookingsTable.userId })
      .from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }

    // Users can only cancel their own bookings
    if (status === "cancelled" && existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only cancel your own bookings" });
      return;
    }
    // For non-cancellation status changes (confirm, complete, no_show) — owner check still applies for now
    if (status !== "cancelled" && existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Not authorized to update this booking" });
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

    const [restaurant] = await db.select().from(restaurantsTable)
      .where(eq(restaurantsTable.id, booking.restaurantId));
    res.json({
      ...booking,
      restaurantNameEn: restaurant?.nameEn ?? "",
      restaurantNameAr: restaurant?.nameAr ?? "",
      restaurantCoverImageUrl: restaurant?.coverImageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update booking");
    res.status(500).json({ error: "internal_error", message: "Failed to update booking" });
  }
});

export default router;
