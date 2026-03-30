import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, dishesTable, citiesTable, venuesTable, categoriesTable, restaurantCategoriesTable } from "@workspace/db/schema";
import { eq, ilike, or, and, inArray, type SQL } from "drizzle-orm";

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
    const cityFilter = cityId ? parseInt(cityId as string) : null;

    const restaurantConditions: SQL[] = [
      eq(restaurantsTable.isActive, true),
      or(ilike(restaurantsTable.nameEn, pattern), ilike(restaurantsTable.nameAr, pattern))!,
    ];
    if (cityFilter) restaurantConditions.push(eq(restaurantsTable.cityId, cityFilter));

    const dishConditions: SQL[] = [
      or(ilike(dishesTable.nameEn, pattern), ilike(dishesTable.nameAr, pattern))!,
    ];
    if (cityFilter) dishConditions.push(eq(restaurantsTable.cityId, cityFilter));

    const venueConditions: SQL[] = [
      eq(venuesTable.isActive, true),
      or(ilike(venuesTable.nameEn, pattern), ilike(venuesTable.nameAr, pattern))!,
    ];

    const [restaurants, dishes, venues] = await Promise.all([
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
        .where(and(...restaurantConditions))
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
        .where(and(...dishConditions))
        .limit(lim)
        : Promise.resolve([]),

      (type === "all" || type === "venues") ? db.select({
        id: venuesTable.id,
        nameEn: venuesTable.nameEn,
        nameAr: venuesTable.nameAr,
        restaurantId: venuesTable.restaurantId,
        capacity: venuesTable.capacity,
        isPrivate: venuesTable.isPrivate,
        imageUrl: venuesTable.imageUrl,
        pricePerHour: venuesTable.pricePerHour,
        currency: venuesTable.currency,
      }).from(venuesTable)
        .where(and(...venueConditions))
        .limit(lim)
        : Promise.resolve([]),
    ]);

    // Attach cuisine types to search results
    const restaurantIds = restaurants.map(r => r.id);
    let cuisineMapEn: Record<number, string[]> = {};
    let cuisineMapAr: Record<number, string[]> = {};
    if (restaurantIds.length > 0) {
      const catJoins = await db.select({
        restaurantId: restaurantCategoriesTable.restaurantId,
        nameEn: categoriesTable.nameEn,
        nameAr: categoriesTable.nameAr,
      }).from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(restaurantCategoriesTable.categoryId, categoriesTable.id))
        .where(inArray(restaurantCategoriesTable.restaurantId, restaurantIds));
      catJoins.forEach(c => {
        if (!cuisineMapEn[c.restaurantId]) cuisineMapEn[c.restaurantId] = [];
        if (!cuisineMapAr[c.restaurantId]) cuisineMapAr[c.restaurantId] = [];
        cuisineMapEn[c.restaurantId].push(c.nameEn);
        cuisineMapAr[c.restaurantId].push(c.nameAr);
      });
    }

    res.json({
      restaurants: restaurants.map(r => ({ ...r, cuisineTypes: cuisineMapEn[r.id] || [], cuisineTypesAr: cuisineMapAr[r.id] || [] })),
      dishes,
      venues,
      totalRestaurants: restaurants.length,
      totalDishes: dishes.length,
      totalVenues: venues.length,
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
    const cityFilter = cityId ? parseInt(cityId as string) : null;

    const restaurantConditions: SQL[] = [
      eq(restaurantsTable.isActive, true),
      or(ilike(restaurantsTable.nameEn, pattern), ilike(restaurantsTable.nameAr, pattern))!,
    ];
    if (cityFilter) restaurantConditions.push(eq(restaurantsTable.cityId, cityFilter));

    const [restaurants, dishes, cities, categories] = await Promise.all([
      db.select({
        id: restaurantsTable.id,
        labelEn: restaurantsTable.nameEn,
        labelAr: restaurantsTable.nameAr,
        imageUrl: restaurantsTable.coverImageUrl,
      }).from(restaurantsTable)
        .where(and(...restaurantConditions))
        .limit(4),

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

      db.select({
        id: categoriesTable.id,
        labelEn: categoriesTable.nameEn,
        labelAr: categoriesTable.nameAr,
      }).from(categoriesTable)
        .where(or(ilike(categoriesTable.nameEn, pattern), ilike(categoriesTable.nameAr, pattern)))
        .limit(3),
    ]);

    const suggestions = [
      ...restaurants.map(r => ({ type: "restaurant" as const, ...r })),
      ...dishes.map(d => ({ type: "dish" as const, ...d })),
      ...cities.map(c => ({ type: "city" as const, ...c, imageUrl: undefined as string | undefined })),
      ...categories.map(c => ({ type: "category" as const, id: c.id, labelEn: c.labelEn, labelAr: c.labelAr, imageUrl: undefined as string | undefined })),
    ];

    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Autocomplete failed");
    res.status(500).json({ error: "internal_error", message: "Autocomplete failed" });
  }
});

export default router;
