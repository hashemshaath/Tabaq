import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, restaurantsTable, vouchersTable, usersTable } from "@workspace/db/schema";
import { count, eq, desc, sql } from "drizzle-orm";

const router = Router();

// List all offers with approval status and voucher redemption counts
router.get("/admin/offers", async (req, res) => {
  try {
    const { approvalStatus } = req.query;

    const offers = await db
      .select({
        id: offersTable.id,
        refCode: offersTable.refCode,
        titleEn: offersTable.titleEn,
        titleAr: offersTable.titleAr,
        discountPercent: offersTable.discountPercent,
        originalPrice: offersTable.originalPrice,
        discountedPrice: offersTable.discountedPrice,
        currency: offersTable.currency,
        isActive: offersTable.isActive,
        approvalStatus: offersTable.approvalStatus,
        adminNotes: offersTable.adminNotes,
        approvedAt: offersTable.approvedAt,
        commissionOverridePercent: offersTable.commissionOverridePercent,
        paymentModel: offersTable.paymentModel,
        validFrom: offersTable.validFrom,
        validUntil: offersTable.validUntil,
        totalCapacity: offersTable.totalCapacity,
        remainingCapacity: offersTable.remainingCapacity,
        createdAt: offersTable.createdAt,
        restaurantId: offersTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantRefCode: restaurantsTable.refCode,
        cityId: restaurantsTable.cityId,
      })
      .from(offersTable)
      .leftJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .where(approvalStatus ? eq(offersTable.approvalStatus, approvalStatus as any) : undefined)
      .orderBy(desc(offersTable.createdAt));

    const voucherCounts = await db
      .select({ offerId: vouchersTable.offerId, total: count() })
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

// Toggle offer active/inactive (admin only)
router.patch("/admin/offers/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body as { isActive: boolean };

    // Can only activate approved offers
    const [existing] = await db.select({ approvalStatus: offersTable.approvalStatus })
      .from(offersTable).where(eq(offersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Offer not found" });

    if (isActive && existing.approvalStatus !== "approved") {
      return res.status(400).json({ error: "bad_request", message: "Only approved offers can be activated" });
    }

    const [updated] = await db
      .update(offersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Approve an offer — sets approvalStatus to approved and makes it active
router.patch("/admin/offers/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { commissionOverridePercent, paymentModel, adminNotes } = req.body;

    const [updated] = await db
      .update(offersTable)
      .set({
        approvalStatus: "approved",
        isActive: true,
        approvedAt: new Date(),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(commissionOverridePercent !== undefined && {
          commissionOverridePercent: commissionOverridePercent ? String(commissionOverridePercent) : null
        }),
        ...(paymentModel !== undefined && { paymentModel }),
        updatedAt: new Date(),
      })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Reject an offer — sets approvalStatus to rejected with admin notes
router.patch("/admin/offers/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNotes } = req.body;

    const [updated] = await db
      .update(offersTable)
      .set({
        approvalStatus: "rejected",
        isActive: false,
        adminNotes: adminNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Request revision — admin asks restaurant to modify the offer
router.patch("/admin/offers/:id/request-revision", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({ error: "bad_request", message: "adminNotes (revision instructions) are required" });
    }

    const [updated] = await db
      .update(offersTable)
      .set({
        approvalStatus: "revision_requested",
        isActive: false,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Edit offer (admin override — change price, commission, dates, etc.)
router.put("/admin/offers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      titleEn, titleAr, descriptionEn, descriptionAr, imageUrl,
      discountPercent, originalPrice, discountedPrice, currency,
      validFrom, validUntil, totalCapacity, remainingCapacity,
      commissionOverridePercent, paymentModel, adminNotes
    } = req.body;

    const [updated] = await db
      .update(offersTable)
      .set({
        ...(titleEn !== undefined && { titleEn }),
        ...(titleAr !== undefined && { titleAr }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(discountPercent !== undefined && { discountPercent: String(discountPercent) }),
        ...(originalPrice !== undefined && { originalPrice: String(originalPrice) }),
        ...(discountedPrice !== undefined && { discountedPrice: String(discountedPrice) }),
        ...(currency !== undefined && { currency }),
        ...(validFrom !== undefined && { validFrom: new Date(validFrom) }),
        ...(validUntil !== undefined && { validUntil: new Date(validUntil) }),
        ...(totalCapacity !== undefined && { totalCapacity }),
        ...(remainingCapacity !== undefined && { remainingCapacity }),
        ...(commissionOverridePercent !== undefined && {
          commissionOverridePercent: commissionOverridePercent ? String(commissionOverridePercent) : null
        }),
        ...(paymentModel !== undefined && { paymentModel: paymentModel || null }),
        ...(adminNotes !== undefined && { adminNotes }),
        updatedAt: new Date(),
      })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
