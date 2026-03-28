import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, dishesTable, citiesTable, categoriesTable } from "@workspace/db/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, type = "all", cityId, limit = "20" } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "bad_request", message: "q parameter is required" });
      return;
    }
    const pattern = `%${q}%`;
    const lim = parseInt(limit as string);

    const [restaurants, dishes] = await Promise.all([
      (type === "all" || type === "restaurants") ? db.select({
        id: restaurantsTable.id,
        nameEn: restaurantsTable.nameEn,
        nameAr: restaurantsTable.nameAr,
        coverImageUrl: restaurantsTable.coverImageUrl,
        priceTier: restaurantsTable.priceTier,
        avgRating: restaurantsTable.avgRating,
        reviewCount: restaurantsTable.reviewCount,
        isVerified: restaurantsTable.isVerified,
        cityId: restaurantsTable.cityId,
      }).from(restaurantsTable)
        .where(and(
          eq(restaurantsTable.isActive, true),
          or(ilike(restaurantsTable.nameEn, pattern), ilike(restaurantsTable.nameAr, pattern))
        ))
        .limit(lim)
        : Promise.resolve([]),
      (type === "all" || type === "dishes") ? db.select({
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
        .where(or(ilike(dishesTable.nameEn, pattern), ilike(dishesTable.nameAr, pattern)))
        .limit(lim)
        : Promise.resolve([]),
    ]);

    res.json({
      restaurants: restaurants.map(r => ({ ...r, cuisineTypes: [] })),
      dishes,
      totalRestaurants: restaurants.length,
      totalDishes: dishes.length,
    });
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(500).json({ error: "internal_error", message: "Search failed" });
  }
});

router.get("/search/autocomplete", async (req, res) => {
  try {
    const { q, cityId } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "bad_request", message: "q parameter is required" });
      return;
    }
    const pattern = `%${q}%`;

    const [restaurants, dishes, cities] = await Promise.all([
      db.select({
        id: restaurantsTable.id,
        labelEn: restaurantsTable.nameEn,
        labelAr: restaurantsTable.nameAr,
        imageUrl: restaurantsTable.coverImageUrl,
      }).from(restaurantsTable)
        .where(and(
          eq(restaurantsTable.isActive, true),
          or(ilike(restaurantsTable.nameEn, pattern), ilike(restaurantsTable.nameAr, pattern))
        )).limit(4),
      db.select({
        id: dishesTable.id,
        labelEn: dishesTable.nameEn,
        labelAr: dishesTable.nameAr,
        imageUrl: dishesTable.imageUrl,
      }).from(dishesTable)
        .where(or(ilike(dishesTable.nameEn, pattern), ilike(dishesTable.nameAr, pattern)))
        .limit(4),
      db.select({
        id: citiesTable.id,
        labelEn: citiesTable.nameEn,
        labelAr: citiesTable.nameAr,
      }).from(citiesTable)
        .where(or(ilike(citiesTable.nameEn, pattern), ilike(citiesTable.nameAr, pattern)))
        .limit(3),
    ]);

    const suggestions = [
      ...restaurants.map(r => ({ type: "restaurant" as const, ...r })),
      ...dishes.map(d => ({ type: "dish" as const, ...d })),
      ...cities.map(c => ({ type: "city" as const, ...c, imageUrl: undefined })),
    ];

    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Autocomplete failed");
    res.status(500).json({ error: "internal_error", message: "Autocomplete failed" });
  }
});

export default router;
