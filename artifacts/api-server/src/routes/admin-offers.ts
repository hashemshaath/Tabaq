import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, restaurantsTable, vouchersTable, usersTable, campaignsTable, promoCodesTable } from "@workspace/db/schema";
import { count, eq, desc, sql, and, type SQL } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// GET /admin/campaigns — list all with approval status filter (protected by requireAuth)
router.get("/admin/campaigns", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(campaignsTable.status, status as string as any));

    const campaigns = await db.select({
      id: campaignsTable.id,
      refCode: campaignsTable.refCode,
      status: campaignsTable.status,
      type: campaignsTable.type,
      titleEn: campaignsTable.titleEn,
      titleAr: campaignsTable.titleAr,
      restaurantNameEn: restaurantsTable.nameEn,
      createdAt: campaignsTable.createdAt,
    })
    .from(campaignsTable)
    .innerJoin(restaurantsTable, eq(campaignsTable.restaurantId, restaurantsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${campaignsTable.createdAt} desc`);

    res.json(campaigns);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin campaigns");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /admin/campaigns/:id/review — approve/reject/request changes
router.patch("/admin/campaigns/:id/review", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, adminNotes, commissionOverridePercent } = req.body;
    const adminUserId = req.auth!.userId;

    if (!["approved", "live", "rejected", "under_review"].includes(status)) {
       res.status(400).json({ error: "bad_request" });
       return;
    }

    const [updated] = await db.update(campaignsTable).set({
      status,
      adminNotes,
      commissionOverridePercent,
      approvedById: status === "approved" || status === "live" ? adminUserId : undefined,
      approvedAt: status === "approved" || status === "live" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(campaignsTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to review campaign");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /admin/promo-codes — all promo codes
router.get("/admin/promo-codes", requireAuth, async (req, res) => {
  try {
    const codes = await db.select().from(promoCodesTable).orderBy(sql`${promoCodesTable.createdAt} desc`);
    res.json(codes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin promo codes");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /admin/settlement/create-batch — create settlement batch
router.post("/admin/settlement/create-batch", requireAuth, async (req, res) => {
  try {
    // This is a placeholder for a complex settlement logic
    res.json({ message: "Settlement batch creation not fully implemented" });
  } catch (err) {
     req.log.error({ err }, "Failed to create settlement batch");
     res.status(500).json({ error: "internal_error" });
  }
});

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

// Create offer on behalf of any restaurant (admin/console)
router.post("/admin/offers", async (req, res) => {
  try {
    const {
      restaurantId, titleEn, titleAr, descriptionEn, descriptionAr,
      imageUrl, discountPercent, originalPrice, discountedPrice, currency,
      validFrom, validUntil, totalCapacity
    } = req.body;

    if (!restaurantId || !titleEn || !titleAr || !originalPrice || !validFrom || !validUntil) {
      return res.status(400).json({ error: "bad_request", message: "Missing required fields: restaurantId, titleEn, titleAr, originalPrice, validFrom, validUntil" });
    }

    const [restaurant] = await db.select({ nameEn: restaurantsTable.nameEn })
      .from(restaurantsTable).where(eq(restaurantsTable.id, parseInt(restaurantId)));
    if (!restaurant) {
      return res.status(404).json({ error: "not_found", message: "Restaurant not found" });
    }

    const [offer] = await db.insert(offersTable).values({
      restaurantId: parseInt(restaurantId),
      titleEn,
      titleAr,
      descriptionEn: descriptionEn || null,
      descriptionAr: descriptionAr || null,
      imageUrl: imageUrl || null,
      discountPercent: discountPercent ? String(discountPercent) : null,
      originalPrice: String(originalPrice),
      discountedPrice: discountedPrice ? String(discountedPrice) : String(Math.round(parseFloat(originalPrice) * (1 - parseFloat(discountPercent || '0') / 100))),
      currency: currency || 'SAR',
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      totalCapacity: totalCapacity ? parseInt(totalCapacity) : null,
      remainingCapacity: totalCapacity ? parseInt(totalCapacity) : null,
      isActive: false,
      approvalStatus: "pending",
    }).returning();

    const refCode = `TBQ-OFR-${new Date().getFullYear()}-${offer.id.toString().padStart(6, "0")}`;
    const [withRef] = await db.update(offersTable).set({ refCode }).where(eq(offersTable.id, offer.id)).returning();

    res.status(201).json({ offer: withRef ?? offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// List offers for a specific restaurant (business console)
router.get("/admin/restaurants/:restaurantId/offers", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
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
        validFrom: offersTable.validFrom,
        validUntil: offersTable.validUntil,
        totalCapacity: offersTable.totalCapacity,
        remainingCapacity: offersTable.remainingCapacity,
        createdAt: offersTable.createdAt,
      })
      .from(offersTable)
      .where(eq(offersTable.restaurantId, restaurantId))
      .orderBy(desc(offersTable.createdAt));

    const offerIds = offers.map(o => o.id);
    let voucherMap = new Map<number, number>();
    if (offerIds.length > 0) {
      const voucherCounts = await db
        .select({ offerId: vouchersTable.offerId, total: count() })
        .from(vouchersTable)
        .groupBy(vouchersTable.offerId);
      for (const v of voucherCounts) {
        if (v.offerId !== null && offerIds.includes(v.offerId)) {
          voucherMap.set(v.offerId, Number(v.total));
        }
      }
    }
    const enriched = offers.map(o => ({ ...o, redemptions: voucherMap.get(o.id) ?? 0 }));

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
