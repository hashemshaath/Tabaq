import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eventsTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, gte, sql, type SQL } from "drizzle-orm";

const router: IRouter = Router();

router.get("/events", async (req, res) => {
  try {
    const { restaurantId, cityId, from, limit = "20" } = req.query;
    const conditions: SQL[] = [eq(eventsTable.isActive, true)];
    if (restaurantId) conditions.push(eq(eventsTable.restaurantId, parseInt(restaurantId as string)));
    if (from) conditions.push(gte(eventsTable.eventDate, new Date(from as string)));
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));

    const events = await db.select({
      id: eventsTable.id,
      restaurantId: eventsTable.restaurantId,
      titleEn: eventsTable.titleEn,
      titleAr: eventsTable.titleAr,
      descriptionEn: eventsTable.descriptionEn,
      descriptionAr: eventsTable.descriptionAr,
      imageUrl: eventsTable.imageUrl,
      eventDate: eventsTable.eventDate,
      endDate: eventsTable.endDate,
      ticketPrice: eventsTable.ticketPrice,
      currency: eventsTable.currency,
      totalCapacity: eventsTable.totalCapacity,
      remainingCapacity: eventsTable.remainingCapacity,
      isActive: eventsTable.isActive,
      createdAt: eventsTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
    }).from(eventsTable)
      .innerJoin(restaurantsTable, eq(eventsTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .limit(parseInt(limit as string));

    res.json(events);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch events");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch events" });
  }
});

router.get("/events/:eventId", async (req, res) => {
  try {
    const eventId = parseInt(req.params["eventId"] as string, 10);
    const [event] = await db.select({
      id: eventsTable.id,
      restaurantId: eventsTable.restaurantId,
      titleEn: eventsTable.titleEn,
      titleAr: eventsTable.titleAr,
      descriptionEn: eventsTable.descriptionEn,
      descriptionAr: eventsTable.descriptionAr,
      imageUrl: eventsTable.imageUrl,
      eventDate: eventsTable.eventDate,
      endDate: eventsTable.endDate,
      ticketPrice: eventsTable.ticketPrice,
      currency: eventsTable.currency,
      totalCapacity: eventsTable.totalCapacity,
      remainingCapacity: eventsTable.remainingCapacity,
      isActive: eventsTable.isActive,
      createdAt: eventsTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
    }).from(eventsTable)
      .innerJoin(restaurantsTable, eq(eventsTable.restaurantId, restaurantsTable.id))
      .where(eq(eventsTable.id, eventId));
    if (!event) {
      res.status(404).json({ error: "not_found", message: "Event not found" });
      return;
    }
    res.json(event);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch event");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch event" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { restaurantId, titleEn, titleAr, eventDate, ...rest } = req.body;
    if (!restaurantId || !titleEn || !titleAr || !eventDate) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const [event] = await db.insert(eventsTable).values({
      restaurantId, titleEn, titleAr, eventDate: new Date(eventDate), ...rest,
    }).returning();
    res.status(201).json({ ...event, restaurantNameEn: "", restaurantNameAr: "" });
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "internal_error", message: "Failed to create event" });
  }
});

export default router;
