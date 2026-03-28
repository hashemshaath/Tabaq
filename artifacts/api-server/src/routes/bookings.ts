import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const router: IRouter = Router();

// List bookings
router.get("/bookings", async (req, res) => {
  try {
    const { restaurantId, status, from, to, limit = "20", offset = "0" } = req.query;
    const conditions: any[] = [];
    if (restaurantId) conditions.push(eq(bookingsTable.restaurantId, parseInt(restaurantId as string)));
    if (status) conditions.push(eq(bookingsTable.status, status as any));

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
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(sql`${bookingsTable.createdAt} desc`);

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(bookingsTable)
      .where(conditions.length ? and(...conditions) : undefined);

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
router.post("/bookings", async (req, res) => {
  try {
    const { restaurantId, date, time, partySize, occasionId, specialRequests } = req.body;
    if (!restaurantId || !date || !time || !partySize) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const userId = 1; // TODO: from session
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

// Get booking
router.get("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
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
    res.json(booking);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch booking" });
  }
});

// Update booking status
router.patch("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const { status } = req.body;
    const [booking] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookingsTable.id, bookingId))
      .returning();
    if (!booking) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
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
