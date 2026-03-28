import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { countriesTable, citiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/countries", async (req, res) => {
  try {
    const countries = await db.select().from(countriesTable).orderBy(countriesTable.nameEn);
    res.json(countries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch countries");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch countries" });
  }
});

router.get("/countries/:countryId/cities", async (req, res) => {
  try {
    const countryId = parseInt(req.params["countryId"] as string, 10);
    if (isNaN(countryId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid countryId" });
      return;
    }
    const cities = await db.select().from(citiesTable)
      .where(eq(citiesTable.countryId, countryId))
      .orderBy(citiesTable.nameEn);
    res.json(cities);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cities");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch cities" });
  }
});

export default router;
