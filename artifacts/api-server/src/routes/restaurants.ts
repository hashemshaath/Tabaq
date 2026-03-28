import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  restaurantsTable, restaurantCategoriesTable, restaurantOccasionsTable,
  restaurantFollowsTable, openingHoursTable, categoriesTable, occasionsTable,
  reviewsTable, offersTable, citiesTable
} from "@workspace/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

const router: IRouter = Router();

// List restaurants with filters
router.get("/restaurants", async (req, res) => {
  try {
    const {
      cityId, countryId, categoryId, occasionId, priceTier,
      minRating, featured, limit = "20", offset = "0"
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

    const conditions = [eq(restaurantsTable.isActive, true)];
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));
    if (countryId) conditions.push(eq(restaurantsTable.countryId, parseInt(countryId as string)));
    if (priceTier) conditions.push(eq(restaurantsTable.priceTier, priceTier as any));
    if (minRating) conditions.push(gte(restaurantsTable.avgRating, parseFloat(minRating as string)));
    if (featured === "true") conditions.push(eq(restaurantsTable.isFeatured, true));

    const restaurants = await query
      .where(and(...conditions))
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
    const restaurantId = parseInt(req.params.restaurantId, 10);
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
    const restaurantId = parseInt(req.params.restaurantId, 10);
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
router.post("/restaurants/:restaurantId/follow", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10);
    const userId = 1; // TODO: from session
    await db.insert(restaurantFollowsTable).values({ userId, restaurantId }).onConflictDoNothing();
    await db.update(restaurantsTable)
      .set({ followerCount: sql`${restaurantsTable.followerCount} + 1` })
      .where(eq(restaurantsTable.id, restaurantId));
    const [r] = await db.select({ followerCount: restaurantsTable.followerCount }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    res.json({ isFollowing: true, followerCount: r?.followerCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to follow restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to follow restaurant" });
  }
});

router.delete("/restaurants/:restaurantId/follow", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10);
    const userId = 1; // TODO: from session
    await db.delete(restaurantFollowsTable)
      .where(and(eq(restaurantFollowsTable.userId, userId), eq(restaurantFollowsTable.restaurantId, restaurantId)));
    await db.update(restaurantsTable)
      .set({ followerCount: sql`greatest(${restaurantsTable.followerCount} - 1, 0)` })
      .where(eq(restaurantsTable.id, restaurantId));
    const [r] = await db.select({ followerCount: restaurantsTable.followerCount }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    res.json({ isFollowing: false, followerCount: r?.followerCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to unfollow restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to unfollow restaurant" });
  }
});

// Availability
router.get("/restaurants/:restaurantId/availability", async (req, res) => {
  try {
    const { date, partySize } = req.query;
    const slots = [
      { time: "12:00", available: true, capacity: 4 },
      { time: "12:30", available: true, capacity: 4 },
      { time: "13:00", available: false, capacity: 0 },
      { time: "13:30", available: true, capacity: 6 },
      { time: "14:00", available: true, capacity: 4 },
      { time: "19:00", available: true, capacity: 8 },
      { time: "19:30", available: true, capacity: 6 },
      { time: "20:00", available: false, capacity: 0 },
      { time: "20:30", available: true, capacity: 4 },
      { time: "21:00", available: true, capacity: 4 },
    ];
    res.json({ date, slots });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch availability");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch availability" });
  }
});

export default router;
