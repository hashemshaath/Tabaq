import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable, occasionsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.nameEn);
    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch categories");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch categories" });
  }
});

router.get("/occasions", async (req, res) => {
  try {
    const occasions = await db.select().from(occasionsTable).orderBy(occasionsTable.nameEn);
    res.json(occasions);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch occasions");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch occasions" });
  }
});

export default router;
