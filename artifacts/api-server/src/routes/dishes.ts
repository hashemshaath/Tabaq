import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dishesTable, restaurantsTable, reviewsTable, restaurantCategoriesTable } from "@workspace/db/schema";
import { eq, and, sql, desc, inArray, type SQL } from "drizzle-orm";

const router: IRouter = Router();

// List dishes with filters
router.get("/dishes", async (req, res) => {
  try {
    const { restaurantId, categoryId, cityId, dietaryTag, sortBy = "rating", limit = "20", offset = "0" } = req.query;

    const conditions: SQL[] = [eq(dishesTable.isAvailable, true)];
    if (restaurantId) conditions.push(eq(dishesTable.restaurantId, parseInt(restaurantId as string)));
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));
    if (categoryId) {
      const catRestaurants = await db.select({ restaurantId: restaurantCategoriesTable.restaurantId })
        .from(restaurantCategoriesTable)
        .where(eq(restaurantCategoriesTable.categoryId, parseInt(categoryId as string)));
      if (catRestaurants.length) {
        conditions.push(inArray(dishesTable.restaurantId, catRestaurants.map(r => r.restaurantId)));
      } else {
        conditions.push(sql`1 = 0`);
      }
    }
    if (dietaryTag === "halal") conditions.push(eq(dishesTable.isHalal, true));
    else if (dietaryTag === "vegetarian") conditions.push(eq(dishesTable.isVegetarian, true));
    else if (dietaryTag === "vegan") conditions.push(eq(dishesTable.isVegan, true));
    else if (dietaryTag === "gluten_free") conditions.push(eq(dishesTable.isGlutenFree, true));

    const orderCol = sortBy === "popularity"
      ? desc(dishesTable.popularityScore)
      : sortBy === "newest"
      ? desc(dishesTable.createdAt)
      : desc(dishesTable.avgRating);

    const dishes = await db.select({
      id: dishesTable.id,
      nameEn: dishesTable.nameEn,
      nameAr: dishesTable.nameAr,
      imageUrl: dishesTable.imageUrl,
      price: dishesTable.price,
      currency: dishesTable.currency,
      avgRating: dishesTable.avgRating,
      reviewCount: dishesTable.reviewCount,
      restaurantId: dishesTable.restaurantId,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      cityId: restaurantsTable.cityId,
      isTabaqStar: dishesTable.isTabaqStar,
      isMostOrdered: dishesTable.isMostOrdered,
      spiceLevel: dishesTable.spiceLevel,
      prepTimeMinutes: dishesTable.prepTimeMinutes,
      isHalal: dishesTable.isHalal,
      isVegetarian: dishesTable.isVegetarian,
      allergens: dishesTable.allergens,
    }).from(dishesTable)
      .innerJoin(restaurantsTable, eq(dishesTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const needsRestaurantJoin = !!cityId;
    const totalQuery = needsRestaurantJoin
      ? db.select({ count: sql<number>`count(*)` })
          .from(dishesTable)
          .innerJoin(restaurantsTable, eq(dishesTable.restaurantId, restaurantsTable.id))
          .where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` })
          .from(dishesTable)
          .where(and(...conditions));
    const total = await totalQuery;

    res.json({
      dishes,
      total: Number(total[0]?.count ?? 0),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dishes");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch dishes" });
  }
});

// Trending dishes — ranked by computed quality score (rating weight + popularity + review volume)
router.get("/dishes/trending", async (req, res) => {
  try {
    const { cityId, limit = "8" } = req.query;

    const trendingConditions: SQL[] = [eq(dishesTable.isAvailable, true)];
    if (cityId) trendingConditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));

    // Quality score = rating weight + popularity bonus + log-review volume + recency decay bonus
    // Recency: dishes with reviews in the last 30 days get up to +15 pts, decaying by age
    const qualityScoreExpr = sql<number>`
      (COALESCE(${dishesTable.avgRating}::numeric, 0) * 20)
      + (COALESCE(${dishesTable.popularityScore}::numeric, 0) * 0.5)
      + (LN(COALESCE(${dishesTable.reviewCount}, 0) + 1) * 10)
      + COALESCE((
        SELECT GREATEST(0, 15 - EXTRACT(DAY FROM NOW() - MAX(r.created_at))::numeric * 0.5)
        FROM reviews r WHERE r.dish_id = ${dishesTable.id}
        AND r.created_at > NOW() - INTERVAL '30 days'
      ), 0)
    `;

    const dishes = await db.select({
      id: dishesTable.id,
      nameEn: dishesTable.nameEn,
      nameAr: dishesTable.nameAr,
      imageUrl: dishesTable.imageUrl,
      price: dishesTable.price,
      currency: dishesTable.currency,
      avgRating: dishesTable.avgRating,
      reviewCount: dishesTable.reviewCount,
      popularityScore: dishesTable.popularityScore,
      restaurantId: dishesTable.restaurantId,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      cityId: restaurantsTable.cityId,
      qualityScore: qualityScoreExpr,
    }).from(dishesTable)
      .innerJoin(restaurantsTable, eq(dishesTable.restaurantId, restaurantsTable.id))
      .where(and(...trendingConditions))
      .orderBy(desc(qualityScoreExpr))
      .limit(parseInt(limit as string));

    res.json(dishes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trending dishes");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch trending dishes" });
  }
});

// Tabaq Star dishes — highlighted by expert critics
router.get("/dishes/tabaq-stars", async (req, res) => {
  try {
    const { limit = "8" } = req.query;
    const dishes = await db.select({
      id: dishesTable.id,
      nameEn: dishesTable.nameEn,
      nameAr: dishesTable.nameAr,
      imageUrl: dishesTable.imageUrl,
      price: dishesTable.price,
      currency: dishesTable.currency,
      avgRating: dishesTable.avgRating,
      reviewCount: dishesTable.reviewCount,
      restaurantId: dishesTable.restaurantId,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      spiceLevel: dishesTable.spiceLevel,
      prepTimeMinutes: dishesTable.prepTimeMinutes,
      isHalal: dishesTable.isHalal,
      isVegetarian: dishesTable.isVegetarian,
      allergens: dishesTable.allergens,
    }).from(dishesTable)
      .innerJoin(restaurantsTable, eq(dishesTable.restaurantId, restaurantsTable.id))
      .where(and(eq(dishesTable.isTabaqStar, true), eq(dishesTable.isAvailable, true)))
      .orderBy(desc(dishesTable.avgRating))
      .limit(parseInt(limit as string));
    res.json(dishes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Tabaq Star dishes");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch Tabaq Star dishes" });
  }
});

// Get dish detail
router.get("/dishes/:dishId", async (req, res) => {
  try {
    const dishId = parseInt(req.params["dishId"] as string, 10);
    if (isNaN(dishId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid dishId" });
      return;
    }

    const [dish] = await db.select().from(dishesTable).where(eq(dishesTable.id, dishId));
    if (!dish) {
      res.status(404).json({ error: "not_found", message: "Dish not found" });
      return;
    }

    const [restaurant] = await db.select({
      id: restaurantsTable.id,
      nameEn: restaurantsTable.nameEn,
      nameAr: restaurantsTable.nameAr,
      coverImageUrl: restaurantsTable.coverImageUrl,
      priceTier: restaurantsTable.priceTier,
      avgRating: restaurantsTable.avgRating,
      reviewCount: restaurantsTable.reviewCount,
      isVerified: restaurantsTable.isVerified,
      cityId: restaurantsTable.cityId,
      cuisineTypes: sql<string[]>`'{}'::text[]`,
    }).from(restaurantsTable).where(eq(restaurantsTable.id, dish.restaurantId));

    const recentReviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.dishId, dishId))
      .limit(5)
      .orderBy(desc(reviewsTable.createdAt));

    const similarDishes = await db.select({
      id: dishesTable.id,
      nameEn: dishesTable.nameEn,
      nameAr: dishesTable.nameAr,
      imageUrl: dishesTable.imageUrl,
      price: dishesTable.price,
      currency: dishesTable.currency,
      avgRating: dishesTable.avgRating,
      reviewCount: dishesTable.reviewCount,
      restaurantId: dishesTable.restaurantId,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      cityId: restaurantsTable.cityId,
    }).from(dishesTable)
      .innerJoin(restaurantsTable, eq(dishesTable.restaurantId, restaurantsTable.id))
      .where(and(eq(dishesTable.restaurantId, dish.restaurantId), sql`${dishesTable.id} != ${dishId}`))
      .limit(4);

    res.json({
      dish,
      restaurant: restaurant || null,
      recentReviews: recentReviews.map(r => ({
        ...r,
        userNameEn: "User",
        userNameAr: "مستخدم",
        userAvatarUrl: null,
        userLevel: 1,
        userLevelTitle: "Food Explorer",
        photoUrls: [],
        isLiked: false,
      })),
      similarDishes,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dish");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch dish" });
  }
});

// Get restaurant dishes
router.get("/restaurants/:restaurantId/dishes", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const dishes = await db.select().from(dishesTable)
      .where(eq(dishesTable.restaurantId, restaurantId));
    res.json(dishes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurant dishes");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch restaurant dishes" });
  }
});

// Create dish
router.post("/restaurants/:restaurantId/dishes", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const [dish] = await db.insert(dishesTable)
      .values({ ...req.body, restaurantId })
      .returning();
    res.status(201).json(dish);
  } catch (err) {
    req.log.error({ err }, "Failed to create dish");
    res.status(500).json({ error: "internal_error", message: "Failed to create dish" });
  }
});

export default router;
