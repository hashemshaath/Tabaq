import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, restaurantsTable, vouchersTable } from "@workspace/db/schema";
import { count, eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/admin/offers", async (req, res) => {
  try {
    const offers = await db
      .select({
        id: offersTable.id,
        titleEn: offersTable.titleEn,
        titleAr: offersTable.titleAr,
        discountPercent: offersTable.discountPercent,
        originalPrice: offersTable.originalPrice,
        discountedPrice: offersTable.discountedPrice,
        currency: offersTable.currency,
        isActive: offersTable.isActive,
        validFrom: offersTable.validFrom,
        validUntil: offersTable.validUntil,
        totalCapacity: offersTable.totalCapacity,
        remainingCapacity: offersTable.remainingCapacity,
        createdAt: offersTable.createdAt,
        restaurantId: offersTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        cityId: restaurantsTable.cityId,
      })
      .from(offersTable)
      .leftJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .orderBy(desc(offersTable.createdAt));

    const voucherCounts = await db
      .select({
        offerId: vouchersTable.offerId,
        total: count(),
      })
      .from(vouchersTable)
      .groupBy(vouchersTable.offerId);

    const voucherMap = new Map(voucherCounts.map(v => [v.offerId, v.total]));

    const enriched = offers.map(o => ({
      ...o,
      redemptions: voucherMap.get(o.id) ?? 0,
    }));

    res.json({ offers: enriched, total: enriched.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/offers/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body as { isActive: boolean };

    const [updated] = await db
      .update(offersTable)
      .set({ isActive })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
