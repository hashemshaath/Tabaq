import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { menusTable, menuSectionsTable, dishesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Get menus for a restaurant
router.get("/restaurants/:restaurantId/menus", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10);
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

      return { ...menu, sections: sectionsWithItems };
    }));

    res.json(menusWithSections);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch menus");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch menus" });
  }
});

// Create menu
router.post("/restaurants/:restaurantId/menus", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10);
    const [menu] = await db.insert(menusTable)
      .values({ ...req.body, restaurantId })
      .returning();
    res.status(201).json({ ...menu, sections: [] });
  } catch (err) {
    req.log.error({ err }, "Failed to create menu");
    res.status(500).json({ error: "internal_error", message: "Failed to create menu" });
  }
});

export default router;
