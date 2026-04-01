import { Router } from "express";
import { db } from "@workspace/db";
import { menuPackagesTable, menusTable, restaurantsTable, citiesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

const router = Router();

function genRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CAT-${ts}-${rand}`;
}

router.get("/catering/packages", async (req, res) => {
  try {
    const cityId = req.query["cityId"] ? parseInt(req.query["cityId"] as string) : undefined;
    const minGuests = req.query["minGuests"] ? parseInt(req.query["minGuests"] as string) : undefined;
    const maxBudget = req.query["maxBudget"] ? parseFloat(req.query["maxBudget"] as string) : undefined;
    const search = (req.query["search"] as string | undefined)?.toLowerCase();

    const rows = await db
      .select({
        id: menuPackagesTable.id,
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
        menuType: menusTable.type,
        restaurantId: restaurantsTable.id,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
        restaurantCityId: restaurantsTable.cityId,
      })
      .from(menuPackagesTable)
      .innerJoin(menusTable, eq(menuPackagesTable.menuId, menusTable.id))
      .innerJoin(restaurantsTable, eq(menusTable.restaurantId, restaurantsTable.id))
      .where(and(
        eq(menuPackagesTable.isActive, true),
        eq(restaurantsTable.isActive, true),
      ));

    let packages = rows;

    if (cityId) {
      packages = packages.filter(p => p.restaurantCityId === cityId);
    }
    if (minGuests) {
      packages = packages.filter(p => p.minGuests <= minGuests);
    }
    if (maxBudget) {
      packages = packages.filter(p => parseFloat(p.pricePerPerson) <= maxBudget);
    }
    if (search) {
      packages = packages.filter(p =>
        p.nameEn.toLowerCase().includes(search) ||
        (p.nameAr ?? '').includes(search) ||
        p.restaurantNameEn.toLowerCase().includes(search) ||
        (p.restaurantNameAr ?? '').includes(search)
      );
    }

    res.json({ packages, total: packages.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch catering packages");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch catering packages" });
  }
});

router.post("/catering/inquiries", async (req, res) => {
  try {
    const {
      packageId, restaurantId, name, phone, email,
      eventType, eventDate, guestCount, notes,
    } = req.body;

    if (!name || !phone || !email) {
      res.status(400).json({ error: "validation_error", message: "Name, phone and email are required" });
      return;
    }

    const referenceCode = genRef();

    req.log.info({
      referenceCode, packageId, restaurantId, name, phone, email,
      eventType, eventDate, guestCount, notes,
    }, "Catering inquiry received");

    res.status(201).json({
      success: true,
      referenceCode,
      message: "Your inquiry has been received. Our events team will contact you within 24 hours.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit catering inquiry");
    res.status(500).json({ error: "internal_error", message: "Failed to submit inquiry" });
  }
});

export default router;
