import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  restaurantsTable, restaurantCategoriesTable, restaurantOccasionsTable,
  restaurantFollowsTable, openingHoursTable, categoriesTable, occasionsTable,
  reviewsTable, offersTable, citiesTable, bookingsTable, userSavedRestaurantsTable
} from "@workspace/db/schema";
import { eq, and, gte, sql, inArray, count, asc, desc, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// List restaurants with filters
router.get("/restaurants", async (req, res) => {
  try {
    const {
      cityId, countryId, categoryId, occasionId, priceTier,
      minRating, featured, hasParking, hasOutdoorSeating, openNow,
      sortBy, limit = "20", offset = "0"
    } = req.query;

    let query = db.select({
      id: restaurantsTable.id,
      nameEn: restaurantsTable.nameEn,
      nameAr: restaurantsTable.nameAr,
      coverImageUrl: restaurantsTable.coverImageUrl,
      priceTier: restaurantsTable.priceTier,
      avgRating: restaurantsTable.avgRating,
      reviewCount: restaurantsTable.reviewCount,
      isVerified: restaurantsTable.isVerified,
      cityId: restaurantsTable.cityId,
      cityNameEn: citiesTable.nameEn,
      cityNameAr: citiesTable.nameAr,
    }).from(restaurantsTable)
      .leftJoin(citiesTable, eq(restaurantsTable.cityId, citiesTable.id))
      .$dynamic();

    const conditions: SQL[] = [eq(restaurantsTable.isActive, true)];
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));
    if (countryId) conditions.push(eq(restaurantsTable.countryId, parseInt(countryId as string)));
    if (priceTier) conditions.push(eq(restaurantsTable.priceTier, priceTier as 'budget' | 'mid' | 'upscale' | 'fine_dining'));
    if (minRating) conditions.push(gte(restaurantsTable.avgRating, parseFloat(minRating as string)));
    if (featured === "true") conditions.push(eq(restaurantsTable.isFeatured, true));
    if (hasParking === "true") conditions.push(eq(restaurantsTable.hasParking, true));
    if (hasOutdoorSeating === "true") conditions.push(eq(restaurantsTable.hasOutdoorSeating, true));
    if (openNow === "true") {
      // Use PostgreSQL server time in Asia/Riyadh timezone (UTC+3) for consistent GCC filtering
      const openRestaurantIds = await db
        .select({ restaurantId: openingHoursTable.restaurantId })
        .from(openingHoursTable)
        .where(and(
          eq(openingHoursTable.isClosed, false),
          sql`${openingHoursTable.dayOfWeek} = EXTRACT(DOW FROM NOW() AT TIME ZONE 'Asia/Riyadh')::integer`,
          sql`${openingHoursTable.openTime} IS NOT NULL`,
          sql`${openingHoursTable.closeTime} IS NOT NULL`,
          sql`${openingHoursTable.openTime} <= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'HH24:MI')`,
          sql`${openingHoursTable.closeTime} >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'HH24:MI')`,
        ));
      if (openRestaurantIds.length) {
        conditions.push(inArray(restaurantsTable.id, openRestaurantIds.map(r => r.restaurantId)));
      } else {
        conditions.push(sql`1 = 0`);
      }
    }

    if (categoryId) {
      const catRestaurantIds = await db
        .select({ restaurantId: restaurantCategoriesTable.restaurantId })
        .from(restaurantCategoriesTable)
        .where(eq(restaurantCategoriesTable.categoryId, parseInt(categoryId as string)));
      if (catRestaurantIds.length) {
        conditions.push(inArray(restaurantsTable.id, catRestaurantIds.map(r => r.restaurantId)));
      } else {
        conditions.push(sql`1 = 0`);
      }
    }

    if (occasionId) {
      const occRestaurantIds = await db
        .select({ restaurantId: restaurantOccasionsTable.restaurantId })
        .from(restaurantOccasionsTable)
        .where(eq(restaurantOccasionsTable.occasionId, parseInt(occasionId as string)));
      if (occRestaurantIds.length) {
        conditions.push(inArray(restaurantsTable.id, occRestaurantIds.map(r => r.restaurantId)));
      } else {
        conditions.push(sql`1 = 0`);
      }
    }

    const orderExpr = sortBy === "newest"
      ? desc(restaurantsTable.createdAt)
      : sortBy === "topRated"
      ? desc(restaurantsTable.avgRating)
      : sortBy === "featured"
      ? desc(restaurantsTable.isFeatured)
      : sortBy === "mostReviewed"
      ? desc(restaurantsTable.reviewCount)
      : desc(restaurantsTable.isFeatured);

    const restaurants = await query
      .where(and(...conditions))
      .orderBy(orderExpr)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(restaurantsTable)
      .where(and(...conditions));

    // Attach cuisine types
    const restaurantIds = restaurants.map(r => r.id);
    let cuisineMap: Record<number, string[]> = {};
    if (restaurantIds.length > 0) {
      const catJoins = await db.select({
        restaurantId: restaurantCategoriesTable.restaurantId,
        nameEn: categoriesTable.nameEn,
      }).from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(restaurantCategoriesTable.categoryId, categoriesTable.id))
        .where(inArray(restaurantCategoriesTable.restaurantId, restaurantIds));
      catJoins.forEach(c => {
        if (!cuisineMap[c.restaurantId]) cuisineMap[c.restaurantId] = [];
        cuisineMap[c.restaurantId].push(c.nameEn);
      });
    }

    res.json({
      restaurants: restaurants.map(r => ({ ...r, cuisineTypes: cuisineMap[r.id] || [] })),
      total: Number(total[0]?.count ?? 0),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurants");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch restaurants" });
  }
});

// Featured restaurants
router.get("/restaurants/featured", async (req, res) => {
  try {
    const { cityId, limit = "8" } = req.query;
    const conditions = [eq(restaurantsTable.isFeatured, true), eq(restaurantsTable.isActive, true)];
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));

    const restaurants = await db.select().from(restaurantsTable)
      .where(and(...conditions))
      .limit(parseInt(limit as string));

    const restaurantIds = restaurants.map(r => r.id);
    let cuisineMap: Record<number, string[]> = {};
    if (restaurantIds.length > 0) {
      const catJoins = await db.select({
        restaurantId: restaurantCategoriesTable.restaurantId,
        nameEn: categoriesTable.nameEn,
      }).from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(restaurantCategoriesTable.categoryId, categoriesTable.id))
        .where(inArray(restaurantCategoriesTable.restaurantId, restaurantIds));
      catJoins.forEach(c => {
        if (!cuisineMap[c.restaurantId]) cuisineMap[c.restaurantId] = [];
        cuisineMap[c.restaurantId].push(c.nameEn);
      });
    }

    res.json(restaurants.map(r => ({
      ...r,
      cuisineTypes: cuisineMap[r.id] || [],
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch featured restaurants");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch featured restaurants" });
  }
});

// Get restaurant detail
router.get("/restaurants/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    if (isNaN(restaurantId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid restaurantId" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurantId));
    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "Restaurant not found" });
      return;
    }

    const [categories, occasions, openingHours, recentReviews, activeOffers] = await Promise.all([
      db.select({ id: categoriesTable.id, nameEn: categoriesTable.nameEn, nameAr: categoriesTable.nameAr, icon: categoriesTable.icon, slug: categoriesTable.slug })
        .from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(restaurantCategoriesTable.categoryId, categoriesTable.id))
        .where(eq(restaurantCategoriesTable.restaurantId, restaurantId)),
      db.select({ id: occasionsTable.id, nameEn: occasionsTable.nameEn, nameAr: occasionsTable.nameAr, icon: occasionsTable.icon, slug: occasionsTable.slug })
        .from(restaurantOccasionsTable)
        .innerJoin(occasionsTable, eq(restaurantOccasionsTable.occasionId, occasionsTable.id))
        .where(eq(restaurantOccasionsTable.restaurantId, restaurantId)),
      db.select().from(openingHoursTable)
        .where(eq(openingHoursTable.restaurantId, restaurantId))
        .orderBy(openingHoursTable.dayOfWeek),
      db.select().from(reviewsTable)
        .where(eq(reviewsTable.restaurantId, restaurantId))
        .limit(5)
        .orderBy(sql`${reviewsTable.createdAt} desc`),
      db.select().from(offersTable)
        .where(and(eq(offersTable.restaurantId, restaurantId), eq(offersTable.isActive, true)))
        .limit(3),
    ]);

    const ratingBreakdown = {
      overall: Number(restaurant.avgRating) || 0,
      food: 0, service: 0, ambiance: 0, value: 0,
      count: restaurant.reviewCount,
    };

    res.json({
      restaurant,
      categories,
      occasions,
      openingHours,
      recentReviews: recentReviews.map(r => ({
        ...r,
        userNameEn: "User",
        userNameAr: "مستخدم",
        userAvatarUrl: null,
        userLevel: 1,
        userLevelTitle: "Food Explorer",
        photoUrls: [],
        likeCount: r.likeCount,
        isLiked: false,
      })),
      ratingBreakdown,
      isFollowing: false,
      activeOffers: activeOffers.map(o => ({
        ...o,
        restaurantNameEn: restaurant.nameEn,
        restaurantNameAr: restaurant.nameAr,
        restaurantCoverImageUrl: restaurant.coverImageUrl,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch restaurant" });
  }
});

// Create restaurant
router.post("/restaurants", async (req, res) => {
  try {
    const { nameEn, nameAr, priceTier, cityId, countryId, ...rest } = req.body;
    if (!nameEn || !nameAr || !priceTier || !cityId || !countryId) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const slug = `${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;
    const [restaurant] = await db.insert(restaurantsTable)
      .values({ nameEn, nameAr, slug, priceTier, cityId, countryId, ...rest })
      .returning();
    res.status(201).json(restaurant);
  } catch (err) {
    req.log.error({ err }, "Failed to create restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to create restaurant" });
  }
});

// Update restaurant
router.put("/restaurants/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const [restaurant] = await db.update(restaurantsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(restaurantsTable.id, restaurantId))
      .returning();
    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "Restaurant not found" });
      return;
    }
    res.json(restaurant);
  } catch (err) {
    req.log.error({ err }, "Failed to update restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to update restaurant" });
  }
});

// Follow / unfollow restaurant
router.post("/restaurants/:restaurantId/follow", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const userId = req.auth!.userId;
    const inserted = await db.insert(restaurantFollowsTable)
      .values({ userId, restaurantId })
      .onConflictDoNothing()
      .returning({ id: restaurantFollowsTable.id });
    if (inserted.length > 0) {
      await db.update(restaurantsTable)
        .set({ followerCount: sql`${restaurantsTable.followerCount} + 1` })
        .where(eq(restaurantsTable.id, restaurantId));
    }
    const [r] = await db.select({ followerCount: restaurantsTable.followerCount })
      .from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    res.json({ isFollowing: true, followerCount: r?.followerCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to follow restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to follow restaurant" });
  }
});

router.delete("/restaurants/:restaurantId/follow", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const userId = req.auth!.userId;
    const deleted = await db.delete(restaurantFollowsTable)
      .where(and(eq(restaurantFollowsTable.userId, userId), eq(restaurantFollowsTable.restaurantId, restaurantId)))
      .returning({ id: restaurantFollowsTable.id });
    if (deleted.length > 0) {
      await db.update(restaurantsTable)
        .set({ followerCount: sql`greatest(${restaurantsTable.followerCount} - 1, 0)` })
        .where(eq(restaurantsTable.id, restaurantId));
    }
    const [r] = await db.select({ followerCount: restaurantsTable.followerCount })
      .from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    res.json({ isFollowing: false, followerCount: r?.followerCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to unfollow restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to unfollow restaurant" });
  }
});

// Availability — derived from opening hours and existing bookings
router.get("/restaurants/:restaurantId/availability", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { date, partySize } = req.query;
    const requestedDate = date ? new Date(date as string) : new Date();
    const dayOfWeek = requestedDate.getDay();
    const requestedParty = partySize ? parseInt(partySize as string) : 2;
    const dateStr = requestedDate.toISOString().split("T")[0];

    const [hours] = await db.select()
      .from(openingHoursTable)
      .where(and(
        eq(openingHoursTable.restaurantId, restaurantId),
        eq(openingHoursTable.dayOfWeek, dayOfWeek),
      ));

    if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) {
      res.json({ date: dateStr, slots: [] });
      return;
    }

    const bookingsForDay = await db.select({
      time: bookingsTable.time,
      partySize: bookingsTable.partySize,
    }).from(bookingsTable).where(and(
      eq(bookingsTable.restaurantId, restaurantId),
      eq(bookingsTable.date, dateStr),
      sql`${bookingsTable.status} IN ('pending','confirmed')`,
    ));

    const bookedBySlot: Record<string, number> = {};
    for (const b of bookingsForDay) {
      const t = b.time ?? "";
      bookedBySlot[t] = (bookedBySlot[t] ?? 0) + (b.partySize ?? 0);
    }

    const [openH, openM] = hours.openTime.split(":").map(Number);
    const [closeH, closeM] = hours.closeTime.split(":").map(Number);
    const openMinutes = (openH ?? 0) * 60 + (openM ?? 0);
    const closeMinutes = (closeH ?? 0) * 60 + (closeM ?? 0);
    const SLOT_INTERVAL = 30;
    const SEAT_CAPACITY = 40;

    const slots: { time: string; available: boolean; remainingCapacity: number }[] = [];
    for (let m = openMinutes; m < closeMinutes; m += SLOT_INTERVAL) {
      const h = String(Math.floor(m / 60)).padStart(2, "0");
      const min = String(m % 60).padStart(2, "0");
      const time = `${h}:${min}`;
      const booked = bookedBySlot[time] ?? 0;
      const remaining = SEAT_CAPACITY - booked;
      slots.push({ time, available: remaining >= requestedParty, remainingCapacity: Math.max(remaining, 0) });
    }

    res.json({ date: dateStr, slots });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch availability");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch availability" });
  }
});

// Restaurant console: bookings for a restaurant (no user auth - restaurant-owner view)
router.get("/restaurants/:restaurantId/bookings", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { status, date, limit = "20", offset = "0" } = req.query as Record<string, string>;
    const conditions: SQL[] = [eq(bookingsTable.restaurantId, restaurantId)];
    if (status) conditions.push(eq(bookingsTable.status, status));
    if (date) conditions.push(eq(bookingsTable.date, date));
    const bookings = await db.select({
      id: bookingsTable.id,
      referenceCode: bookingsTable.referenceCode,
      date: bookingsTable.date,
      time: bookingsTable.time,
      partySize: bookingsTable.partySize,
      status: bookingsTable.status,
      specialRequests: bookingsTable.specialRequests,
      createdAt: bookingsTable.createdAt,
    }).from(bookingsTable)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(parseInt(limit)).offset(parseInt(offset));
    res.json({ bookings, total: bookings.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurant bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// Restaurant console stats
router.get("/restaurants/:restaurantId/stats", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const [restaurant] = await db.select({
      avgRating: restaurantsTable.avgRating,
      reviewCount: restaurantsTable.reviewCount,
    }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));

    const [bookingStats] = await db.select({
      totalBookings: count(bookingsTable.id),
      totalDiners: sql<number>`coalesce(sum(${bookingsTable.partySize}), 0)`,
    }).from(bookingsTable).where(eq(bookingsTable.restaurantId, restaurantId));

    res.json({
      avgRating: restaurant?.avgRating ?? '0',
      reviewCount: restaurant?.reviewCount ?? 0,
      totalBookings: bookingStats?.totalBookings ?? 0,
      totalDiners: Number(bookingStats?.totalDiners ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurant stats");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Saved / Bookmarked Restaurants ──────────────────────────────────────────

// GET /api/me/saved-restaurants
router.get("/me/saved-restaurants", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as number;
    const rows = await db
      .select({
        savedAt: userSavedRestaurantsTable.savedAt,
        id: restaurantsTable.id,
        nameEn: restaurantsTable.nameEn,
        nameAr: restaurantsTable.nameAr,
        slug: restaurantsTable.slug,
        coverImageUrl: restaurantsTable.coverImageUrl,
        avgRating: restaurantsTable.avgRating,
        priceTier: restaurantsTable.priceTier,
        cityId: restaurantsTable.cityId,
      })
      .from(userSavedRestaurantsTable)
      .innerJoin(restaurantsTable, eq(userSavedRestaurantsTable.restaurantId, restaurantsTable.id))
      .where(eq(userSavedRestaurantsTable.userId, userId))
      .orderBy(desc(userSavedRestaurantsTable.savedAt));
    res.json({ saved: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved restaurants");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /api/me/saved-restaurants/:restaurantId
router.post("/me/saved-restaurants/:restaurantId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as number;
    const restaurantId = Number(req.params.restaurantId);
    if (!restaurantId || isNaN(restaurantId)) return res.status(400).json({ error: "invalid_id" });
    const [restaurant] = await db.select({ id: restaurantsTable.id }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    if (!restaurant) return res.status(404).json({ error: "not_found" });
    await db.insert(userSavedRestaurantsTable).values({ userId, restaurantId }).onConflictDoNothing();
    res.json({ saved: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save restaurant");
    res.status(500).json({ error: "internal_error" });
  }
});

// DELETE /api/me/saved-restaurants/:restaurantId
router.delete("/me/saved-restaurants/:restaurantId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as number;
    const restaurantId = Number(req.params.restaurantId);
    if (!restaurantId || isNaN(restaurantId)) return res.status(400).json({ error: "invalid_id" });
    await db.delete(userSavedRestaurantsTable).where(
      and(eq(userSavedRestaurantsTable.userId, userId), eq(userSavedRestaurantsTable.restaurantId, restaurantId))
    );
    res.json({ saved: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unsave restaurant");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/me/saved-restaurants/:restaurantId — check if saved
router.get("/me/saved-restaurants/:restaurantId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as number;
    const restaurantId = Number(req.params.restaurantId);
    if (!restaurantId || isNaN(restaurantId)) return res.status(400).json({ error: "invalid_id" });
    const [row] = await db.select({ id: userSavedRestaurantsTable.id }).from(userSavedRestaurantsTable)
      .where(and(eq(userSavedRestaurantsTable.userId, userId), eq(userSavedRestaurantsTable.restaurantId, restaurantId)));
    res.json({ saved: !!row });
  } catch (err) {
    req.log.error({ err }, "Failed to check saved status");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
