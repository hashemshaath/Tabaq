import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, restaurantsTable, vouchersTable, campaignsTable, promoCodesTable, transactionsTable, contractsTable } from "@workspace/db/schema";
import { count, eq, desc, sql, and, gte, lte, sum, isNull, type SQL } from "drizzle-orm";
import { requirePermission } from "../middleware/requireAuth.js";

const router = Router();

// GET /admin/campaigns — list all with approval status filter
router.get("/admin/campaigns", requirePermission("offers:read"), async (req, res) => {
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
router.patch("/admin/campaigns/:id/review", requirePermission("offers:approve"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, adminNotes, commissionOverridePercent } = req.body;

    if (!["approved", "live", "rejected", "under_review"].includes(status)) {
       res.status(400).json({ error: "bad_request" });
       return;
    }

    const [updated] = await db.update(campaignsTable).set({
      status,
      adminNotes,
      commissionOverridePercent,
      approvedById: null,
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
router.get("/admin/promo-codes", requirePermission("offers:read"), async (req, res) => {
  try {
    const codes = await db.select().from(promoCodesTable).orderBy(sql`${promoCodesTable.createdAt} desc`);
    res.json(codes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin promo codes");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /admin/settlement/create-batch — create settlement batch
router.post("/admin/settlement/create-batch", requirePermission("finance:write"), async (req, res) => {
  try {
    const { periodStart, periodEnd, restaurantIds } = req.body;

    // Default to last 30 days if no period specified
    const endDate = periodEnd ? new Date(periodEnd) : new Date();
    const startDate = periodStart
      ? new Date(periodStart)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find redeemed vouchers within the period
    const conditions: SQL[] = [
      eq(vouchersTable.status, "redeemed"),
      gte(vouchersTable.redeemedAt as any, startDate),
      lte(vouchersTable.redeemedAt as any, endDate),
    ];

    if (restaurantIds?.length) {
      // filter by specific restaurants via join
    }

    const vouchers = await db
      .select({
        restaurantId: offersTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        voucherCount: count(vouchersTable.id),
        grossAmount: sum(vouchersTable.faceValue),
      })
      .from(vouchersTable)
      .innerJoin(offersTable, eq(vouchersTable.offerId, offersTable.id))
      .innerJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .groupBy(offersTable.restaurantId, restaurantsTable.nameEn, restaurantsTable.nameAr);

    if (vouchers.length === 0) {
      res.json({
        batchId: null,
        message: "No unsettled vouchers found for the specified period.",
        settlements: [],
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      });
      return;
    }

    // Default commission rate — 15% if no contract found
    const DEFAULT_COMMISSION = 15;
    const batchRef = `STL-${Date.now()}`;

    const settlements = await Promise.all(
      vouchers.map(async (row) => {
        // Look up active contract for commission rate
        const [contract] = await db
          .select({ commissionPercent: contractsTable.commissionPercent })
          .from(contractsTable)
          .where(
            and(
              eq(contractsTable.restaurantId, row.restaurantId!),
              eq(contractsTable.status, "active")
            )
          )
          .limit(1);

        const commissionPct = parseFloat(String(contract?.commissionPercent ?? DEFAULT_COMMISSION));
        const gross = parseFloat(String(row.grossAmount ?? 0));
        const commission = +(gross * commissionPct / 100).toFixed(2);
        const net = +(gross - commission).toFixed(2);

        // Insert a pending transaction record for this restaurant
        const [tx] = await db
          .insert(transactionsTable)
          .values({
            type: "settlement" as any,
            status: "pending" as any,
            grossAmount: String(gross),
            commissionPercent: String(commissionPct),
            commissionAmount: String(commission),
            netAmount: String(net),
            currency: "SAR",
            restaurantId: row.restaurantId!,
          })
          .returning({ id: transactionsTable.id });

        return {
          restaurantId: row.restaurantId,
          restaurantNameEn: row.restaurantNameEn,
          restaurantNameAr: row.restaurantNameAr,
          voucherCount: Number(row.voucherCount),
          grossAmount: gross,
          commissionPercent: commissionPct,
          commissionAmount: commission,
          netAmount: net,
          currency: "SAR",
          transactionId: tx.id,
        };
      })
    );

    const totalGross = settlements.reduce((s, r) => s + r.grossAmount, 0);
    const totalCommission = settlements.reduce((s, r) => s + r.commissionAmount, 0);
    const totalNet = settlements.reduce((s, r) => s + r.netAmount, 0);

    res.json({
      batchRef,
      status: "pending",
      settlements,
      restaurantCount: settlements.length,
      totalGross: +totalGross.toFixed(2),
      totalCommission: +totalCommission.toFixed(2),
      totalNet: +totalNet.toFixed(2),
      currency: "SAR",
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create settlement batch");
    res.status(500).json({ error: "internal_error", message: "Failed to create settlement batch" });
  }
});

// List all offers with approval status and voucher redemption counts
router.get("/admin/offers", requirePermission("offers:read"), async (req, res) => {
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
    req.log.error({ err }, "Failed to fetch admin offers");
    res.status(500).json({ error: "internal_error" });
  }
});

// Create offer on behalf of any restaurant (admin/console)
router.post("/admin/offers", requirePermission("offers:write"), async (req, res) => {
  try {
    const {
      restaurantId, titleEn, titleAr, descriptionEn, descriptionAr,
      imageUrl, discountPercent, originalPrice, discountedPrice, currency,
      validFrom, validUntil, totalCapacity
    } = req.body;

    if (!restaurantId || !titleEn || !titleAr || !originalPrice || !validFrom || !validUntil) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields: restaurantId, titleEn, titleAr, originalPrice, validFrom, validUntil" });
      return;
    }

    const [restaurant] = await db.select({ nameEn: restaurantsTable.nameEn })
      .from(restaurantsTable).where(eq(restaurantsTable.id, parseInt(restaurantId)));
    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "Restaurant not found" });
      return;
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
      discountedPrice: discountedPrice ? String(discountedPrice) : String(Math.round(parseFloat(originalPrice) * (1 - parseFloat(discountPercent || "0") / 100))),
      currency: currency || "SAR",
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      totalCapacity: totalCapacity ? parseInt(totalCapacity) : null,
      remainingCapacity: totalCapacity ? parseInt(totalCapacity) : null,
      isActive: false,
      approvalStatus: "pending",
    }).returning();

    const refCode = `TBQ-OFR-${new Date().getFullYear()}-${offer!.id.toString().padStart(6, "0")}`;
    const [withRef] = await db.update(offersTable).set({ refCode }).where(eq(offersTable.id, offer!.id)).returning();

    res.status(201).json({ offer: withRef ?? offer });
  } catch (err) {
    req.log.error({ err }, "Failed to create admin offer");
    res.status(500).json({ error: "internal_error" });
  }
});

// List offers for a specific restaurant (business console)
router.get("/admin/restaurants/:restaurantId/offers", requirePermission("offers:read"), async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId as string);
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
    const voucherMap = new Map<number, number>();
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
    req.log.error({ err }, "Failed to fetch restaurant offers");
    res.status(500).json({ error: "internal_error" });
  }
});

// Toggle offer active/inactive (admin only)
router.patch("/admin/offers/:id/toggle", requirePermission("offers:write"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { isActive } = req.body as { isActive: boolean };

    const [existing] = await db.select({ approvalStatus: offersTable.approvalStatus })
      .from(offersTable).where(eq(offersTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    if (isActive && existing.approvalStatus !== "approved") {
      res.status(400).json({ error: "bad_request", message: "Only approved offers can be activated" });
      return;
    }

    const [updated] = await db
      .update(offersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ offer: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to toggle offer");
    res.status(500).json({ error: "internal_error" });
  }
});

// Approve an offer — sets approvalStatus to approved and makes it active
router.patch("/admin/offers/:id/approve", requirePermission("offers:approve"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { commissionOverridePercent, paymentModel, adminNotes } = req.body;

    const [updated] = await db
      .update(offersTable)
      .set({
        approvalStatus: "approved",
        isActive: true,
        approvedAt: new Date(),
        approvedById: null,
        ...(adminNotes !== undefined && { adminNotes }),
        ...(commissionOverridePercent !== undefined && {
          commissionOverridePercent: commissionOverridePercent ? String(commissionOverridePercent) : null
        }),
        ...(paymentModel !== undefined && { paymentModel }),
        updatedAt: new Date(),
      })
      .where(eq(offersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ offer: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to approve offer");
    res.status(500).json({ error: "internal_error" });
  }
});

// Reject an offer — sets approvalStatus to rejected with admin notes
router.patch("/admin/offers/:id/reject", requirePermission("offers:approve"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
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

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ offer: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to reject offer");
    res.status(500).json({ error: "internal_error" });
  }
});

// Request revision — admin asks restaurant to modify the offer
router.patch("/admin/offers/:id/request-revision", requirePermission("offers:approve"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { adminNotes } = req.body;

    if (!adminNotes) {
      res.status(400).json({ error: "bad_request", message: "adminNotes (revision instructions) are required" });
      return;
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

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ offer: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to request revision");
    res.status(500).json({ error: "internal_error" });
  }
});

// Edit offer (admin override — change price, commission, dates, etc.)
router.put("/admin/offers/:id", requirePermission("offers:write"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
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

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ offer: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to edit offer");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
