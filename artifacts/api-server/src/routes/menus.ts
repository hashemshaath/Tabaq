import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { menusTable, menuSectionsTable, dishesTable, menuPackagesTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, inArray, gte, lte, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// Get menus for a restaurant
router.get("/restaurants/:restaurantId/menus", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    if (isNaN(restaurantId)) return void res.status(400).json({ error: "invalid_id", message: "Restaurant ID must be a number" });
    const menus = await db.select().from(menusTable)
      .where(eq(menusTable.restaurantId, restaurantId));

    const menusWithSections = await Promise.all(menus.map(async (menu) => {
      const sections = await db.select().from(menuSectionsTable)
        .where(eq(menuSectionsTable.menuId, menu.id))
        .orderBy(menuSectionsTable.displayOrder);

      const sectionsWithItems = await Promise.all(sections.map(async (section) => {
        const items = await db.select().from(dishesTable)
          .where(eq(dishesTable.menuSectionId, section.id));
        return { ...section, items };
      }));

      // Fetch packages for catering/buffet menus
      const packages = (menu.type === "catering" || menu.type === "buffet")
        ? await db.select().from(menuPackagesTable).where(eq(menuPackagesTable.menuId, menu.id))
        : [];

      return { ...menu, sections: sectionsWithItems, packages };
    }));

    res.json(menusWithSections);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch menus");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch menus" });
  }
});

// Create menu
router.post("/restaurants/:restaurantId/menus", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const [menu] = await db.insert(menusTable)
      .values({ ...req.body, restaurantId })
      .returning();
    res.status(201).json({ ...menu, sections: [], packages: [] });
  } catch (err) {
    req.log.error({ err }, "Failed to create menu");
    res.status(500).json({ error: "internal_error", message: "Failed to create menu" });
  }
});

// Update menu
router.patch("/menus/:menuId", requireAuth, async (req, res) => {
  try {
    const menuId = parseInt(req.params["menuId"] as string, 10);
    const { nameEn, nameAr, type, isActive, displayOrder } = req.body;
    const updateData: Record<string, unknown> = {};
    if (nameEn !== undefined) updateData["nameEn"] = nameEn;
    if (nameAr !== undefined) updateData["nameAr"] = nameAr;
    if (type !== undefined) updateData["type"] = type;
    if (isActive !== undefined) updateData["isActive"] = isActive;
    if (displayOrder !== undefined) updateData["displayOrder"] = displayOrder;
    const [updated] = await db.update(menusTable).set(updateData).where(eq(menusTable.id, menuId)).returning();
    if (!updated) return void res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update menu");
    res.status(500).json({ error: "internal_error", message: "Failed to update menu" });
  }
});

// Delete menu
router.delete("/menus/:menuId", requireAuth, async (req, res) => {
  try {
    const menuId = parseInt(req.params["menuId"] as string, 10);
    await db.delete(menusTable).where(eq(menusTable.id, menuId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete menu");
    res.status(500).json({ error: "internal_error", message: "Failed to delete menu" });
  }
});

// Create menu section
router.post("/menus/:menuId/sections", requireAuth, async (req, res) => {
  try {
    const menuId = parseInt(req.params["menuId"] as string, 10);
    const [section] = await db.insert(menuSectionsTable)
      .values({ ...req.body, menuId })
      .returning();
    res.status(201).json({ ...section, items: [] });
  } catch (err) {
    req.log.error({ err }, "Failed to create menu section");
    res.status(500).json({ error: "internal_error", message: "Failed to create menu section" });
  }
});

// Update menu section
router.patch("/menu-sections/:sectionId", requireAuth, async (req, res) => {
  try {
    const sectionId = parseInt(req.params["sectionId"] as string, 10);
    const { nameEn, nameAr, displayOrder } = req.body;
    const updateData: Record<string, unknown> = {};
    if (nameEn !== undefined) updateData["nameEn"] = nameEn;
    if (nameAr !== undefined) updateData["nameAr"] = nameAr;
    if (displayOrder !== undefined) updateData["displayOrder"] = displayOrder;
    const [updated] = await db.update(menuSectionsTable).set(updateData).where(eq(menuSectionsTable.id, sectionId)).returning();
    if (!updated) return void res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update section");
    res.status(500).json({ error: "internal_error", message: "Failed to update section" });
  }
});

// Delete menu section
router.delete("/menu-sections/:sectionId", requireAuth, async (req, res) => {
  try {
    const sectionId = parseInt(req.params["sectionId"] as string, 10);
    await db.delete(menuSectionsTable).where(eq(menuSectionsTable.id, sectionId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete section");
    res.status(500).json({ error: "internal_error", message: "Failed to delete section" });
  }
});

// Create dish in a menu section
router.post("/menu-sections/:sectionId/dishes", requireAuth, async (req, res) => {
  try {
    const sectionId = parseInt(req.params["sectionId"] as string, 10);
    if (isNaN(sectionId)) return void res.status(400).json({ error: "invalid_id" });

    const [section] = await db.select({ menuId: menuSectionsTable.menuId })
      .from(menuSectionsTable).where(eq(menuSectionsTable.id, sectionId));
    if (!section) return void res.status(404).json({ error: "not_found", message: "Section not found" });

    const allowedFields = [
      "nameEn", "nameAr", "descriptionEn", "descriptionAr", "price", "discountPercentage",
      "imageUrl", "galleryImages", "videoUrl", "isAvailable", "isHalal", "isVegetarian",
      "isVegan", "isGlutenFree", "isDairyFree", "isNutFree", "isHealthy",
      "isBestseller", "isChefChoice", "isNewItem", "allergens",
      "spiceLevel", "prepTimeMinutes", "calories",
    ];
    const dishData: Record<string, unknown> = { menuSectionId: sectionId };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) dishData[field] = req.body[field];
    }

    const [dish] = await db.insert(dishesTable).values(dishData as any).returning();
    res.status(201).json(dish);
  } catch (err) {
    req.log.error({ err }, "Failed to create dish");
    res.status(500).json({ error: "internal_error", message: "Failed to create dish" });
  }
});

// Update dish (admin)
router.patch("/dishes/:dishId", requireAuth, async (req, res) => {
  try {
    const dishId = parseInt(req.params["dishId"] as string, 10);
    const allowedFields = [
      "nameEn", "nameAr", "descriptionEn", "descriptionAr", "price", "discountPercentage",
      "imageUrl", "galleryImages", "videoUrl", "isAvailable", "isHalal", "isVegetarian",
      "isVegan", "isGlutenFree", "isDairyFree", "isNutFree", "isHealthy", "isTabaqStar",
      "isMostOrdered", "isBestseller", "isChefChoice", "isNewItem", "allergens",
      "spiceLevel", "prepTimeMinutes", "calories", "menuSectionId",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    const [updated] = await db.update(dishesTable).set(updateData).where(eq(dishesTable.id, dishId)).returning();
    if (!updated) return void res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update dish");
    res.status(500).json({ error: "internal_error", message: "Failed to update dish" });
  }
});

// Delete dish
router.delete("/dishes/:dishId", requireAuth, async (req, res) => {
  try {
    const dishId = parseInt(req.params["dishId"] as string, 10);
    await db.delete(dishesTable).where(eq(dishesTable.id, dishId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete dish");
    res.status(500).json({ error: "internal_error", message: "Failed to delete dish" });
  }
});

// ─── Catering Discovery ───────────────────────────────────────────────────────
// GET /api/catering/packages?cityId=9&minGuests=50&maxBudget=200&q=wedding
router.get("/catering/packages", async (req, res) => {
  try {
    const { cityId, minGuests, maxBudget, minBudget, q } = req.query;

    const menuTypes = ["catering", "buffet"] as const;

    const allMenus = await db
      .select({ id: menusTable.id, restaurantId: menusTable.restaurantId, type: menusTable.type })
      .from(menusTable)
      .where(inArray(menusTable.type, menuTypes as any));

    if (allMenus.length === 0) {
      res.json({ packages: [], total: 0 });
      return;
    }

    const menuIds = allMenus.map((m) => m.id);

    let pkgQuery = db
      .select({
        id: menuPackagesTable.id,
        menuId: menuPackagesTable.menuId,
        nameEn: menuPackagesTable.nameEn,
        nameAr: menuPackagesTable.nameAr,
        descriptionEn: menuPackagesTable.descriptionEn,
        descriptionAr: menuPackagesTable.descriptionAr,
        pricePerPerson: menuPackagesTable.pricePerPerson,
        minGuests: menuPackagesTable.minGuests,
        maxGuests: menuPackagesTable.maxGuests,
        currency: menuPackagesTable.currency,
        imageUrl: menuPackagesTable.imageUrl,
        includedDishes: menuPackagesTable.includedDishes,
        isActive: menuPackagesTable.isActive,
        restaurantId: menusTable.restaurantId,
        menuType: menusTable.type,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
        restaurantCityId: restaurantsTable.cityId,
      })
      .from(menuPackagesTable)
      .leftJoin(menusTable, eq(menuPackagesTable.menuId, menusTable.id))
      .leftJoin(restaurantsTable, eq(menusTable.restaurantId, restaurantsTable.id))
      .where(
        and(
          inArray(menuPackagesTable.menuId, menuIds),
          eq(menuPackagesTable.isActive, true),
        )
      )
      .orderBy(asc(menuPackagesTable.pricePerPerson)) as any;

    let packages: any[] = await pkgQuery;

    if (cityId) {
      packages = packages.filter((p: any) => p.restaurantCityId === parseInt(cityId as string, 10));
    }
    if (minGuests) {
      packages = packages.filter((p: any) => !p.maxGuests || p.maxGuests >= parseInt(minGuests as string, 10));
    }
    if (minBudget) {
      packages = packages.filter((p: any) => parseFloat(p.pricePerPerson) >= parseFloat(minBudget as string));
    }
    if (maxBudget) {
      packages = packages.filter((p: any) => parseFloat(p.pricePerPerson) <= parseFloat(maxBudget as string));
    }
    if (q) {
      const ql = (q as string).toLowerCase();
      packages = packages.filter((p: any) =>
        p.nameEn?.toLowerCase().includes(ql) ||
        p.nameAr?.includes(ql) ||
        p.restaurantNameEn?.toLowerCase().includes(ql) ||
        p.restaurantNameAr?.includes(ql) ||
        p.descriptionEn?.toLowerCase().includes(ql)
      );
    }

    res.json({ packages, total: packages.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch catering packages");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch catering packages" });
  }
});

// POST /api/catering/inquiries — submit a catering inquiry
router.post("/catering/inquiries", async (req, res) => {
  try {
    const { packageId, restaurantId, eventType, eventDate, guestCount, name, phone, email, notes } = req.body;
    if (!eventType || !guestCount || !name || !phone) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const referenceCode = `CAT-${Date.now().toString(36).toUpperCase()}`;
    res.status(201).json({
      success: true,
      referenceCode,
      message: "Your catering inquiry has been submitted. We will contact you within 24 hours.",
      messageAr: "تم تقديم طلب التواصل بنجاح. سنتواصل معك خلال 24 ساعة.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit catering inquiry");
    res.status(500).json({ error: "internal_error", message: "Failed to submit inquiry" });
  }
});

// Get catering packages for a menu
router.get("/menus/:menuId/packages", async (req, res) => {
  try {
    const menuId = parseInt(req.params["menuId"] as string, 10);
    const packages = await db.select().from(menuPackagesTable).where(eq(menuPackagesTable.menuId, menuId));
    res.json(packages);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch packages");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch packages" });
  }
});

// Create catering package
router.post("/menus/:menuId/packages", requireAuth, async (req, res) => {
  try {
    const menuId = parseInt(req.params["menuId"] as string, 10);
    const [pkg] = await db.insert(menuPackagesTable)
      .values({ ...req.body, menuId })
      .returning();
    res.status(201).json(pkg);
  } catch (err) {
    req.log.error({ err }, "Failed to create package");
    res.status(500).json({ error: "internal_error", message: "Failed to create package" });
  }
});

// Update catering package
router.patch("/menu-packages/:packageId", requireAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params["packageId"] as string, 10);
    const allowedFields = ["nameEn", "nameAr", "descriptionEn", "descriptionAr", "pricePerPerson", "minGuests", "maxGuests", "imageUrl", "includedDishes", "isActive"];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    const [updated] = await db.update(menuPackagesTable).set(updateData).where(eq(menuPackagesTable.id, packageId)).returning();
    if (!updated) return void res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update package");
    res.status(500).json({ error: "internal_error", message: "Failed to update package" });
  }
});

// Delete catering package
router.delete("/menu-packages/:packageId", requireAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params["packageId"] as string, 10);
    await db.delete(menuPackagesTable).where(eq(menuPackagesTable.id, packageId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete package");
    res.status(500).json({ error: "internal_error", message: "Failed to delete package" });
  }
});

export default router;
