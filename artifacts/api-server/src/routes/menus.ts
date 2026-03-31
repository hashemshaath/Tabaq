import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { menusTable, menuSectionsTable, dishesTable, menuPackagesTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
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
