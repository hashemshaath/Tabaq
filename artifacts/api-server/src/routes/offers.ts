import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { offersTable, vouchersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const router: IRouter = Router();

// List offers
router.get("/offers", async (req, res) => {
  try {
    const { restaurantId, cityId, active, limit = "20", offset = "0" } = req.query;
    const conditions: any[] = [];
    if (restaurantId) conditions.push(eq(offersTable.restaurantId, parseInt(restaurantId as string)));
    if (active === "true") conditions.push(eq(offersTable.isActive, true));

    const offers = await db.select({
      id: offersTable.id,
      restaurantId: offersTable.restaurantId,
      titleEn: offersTable.titleEn,
      titleAr: offersTable.titleAr,
      descriptionEn: offersTable.descriptionEn,
      descriptionAr: offersTable.descriptionAr,
      imageUrl: offersTable.imageUrl,
      discountPercent: offersTable.discountPercent,
      originalPrice: offersTable.originalPrice,
      discountedPrice: offersTable.discountedPrice,
      currency: offersTable.currency,
      validFrom: offersTable.validFrom,
      validUntil: offersTable.validUntil,
      totalCapacity: offersTable.totalCapacity,
      remainingCapacity: offersTable.remainingCapacity,
      isActive: offersTable.isActive,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(offersTable)
      .innerJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(offersTable)
      .where(conditions.length ? and(...conditions) : undefined);

    res.json({
      offers,
      total: Number(total[0]?.count ?? 0),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch offers");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch offers" });
  }
});

// Get offer
router.get("/offers/:offerId", async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId, 10);
    const [offer] = await db.select({
      id: offersTable.id,
      restaurantId: offersTable.restaurantId,
      titleEn: offersTable.titleEn,
      titleAr: offersTable.titleAr,
      descriptionEn: offersTable.descriptionEn,
      descriptionAr: offersTable.descriptionAr,
      imageUrl: offersTable.imageUrl,
      discountPercent: offersTable.discountPercent,
      originalPrice: offersTable.originalPrice,
      discountedPrice: offersTable.discountedPrice,
      currency: offersTable.currency,
      validFrom: offersTable.validFrom,
      validUntil: offersTable.validUntil,
      totalCapacity: offersTable.totalCapacity,
      remainingCapacity: offersTable.remainingCapacity,
      isActive: offersTable.isActive,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(offersTable)
      .innerJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .where(eq(offersTable.id, offerId));

    if (!offer) {
      res.status(404).json({ error: "not_found", message: "Offer not found" });
      return;
    }
    res.json(offer);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch offer");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch offer" });
  }
});

// Create offer
router.post("/offers", async (req, res) => {
  try {
    const { restaurantId, titleEn, titleAr, originalPrice, validFrom, validUntil, ...rest } = req.body;
    if (!restaurantId || !titleEn || !titleAr || !originalPrice || !validFrom || !validUntil) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const [offer] = await db.insert(offersTable).values({
      restaurantId, titleEn, titleAr, originalPrice, validFrom: new Date(validFrom), validUntil: new Date(validUntil), ...rest,
    }).returning();
    res.status(201).json({ ...offer, restaurantNameEn: "", restaurantNameAr: "", restaurantCoverImageUrl: null });
  } catch (err) {
    req.log.error({ err }, "Failed to create offer");
    res.status(500).json({ error: "internal_error", message: "Failed to create offer" });
  }
});

// List vouchers
router.get("/vouchers", async (req, res) => {
  try {
    const { status } = req.query;
    const userId = 1; // TODO: from session
    const conditions: any[] = [eq(vouchersTable.userId, userId)];
    if (status) conditions.push(eq(vouchersTable.status, status as any));

    const vouchers = await db.select({
      id: vouchersTable.id,
      code: vouchersTable.code,
      offerId: vouchersTable.offerId,
      userId: vouchersTable.userId,
      restaurantId: vouchersTable.restaurantId,
      value: vouchersTable.value,
      currency: vouchersTable.currency,
      status: vouchersTable.status,
      validUntil: vouchersTable.validUntil,
      giftMessage: vouchersTable.giftMessage,
      isGift: vouchersTable.isGift,
      redeemedAt: vouchersTable.redeemedAt,
      createdAt: vouchersTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
    }).from(vouchersTable)
      .innerJoin(restaurantsTable, eq(vouchersTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions));
    res.json(vouchers);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch vouchers");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch vouchers" });
  }
});

// Purchase voucher
router.post("/vouchers", async (req, res) => {
  try {
    const { offerId } = req.body;
    if (!offerId) {
      res.status(400).json({ error: "bad_request", message: "offerId is required" });
      return;
    }
    const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, offerId));
    if (!offer) {
      res.status(404).json({ error: "not_found", message: "Offer not found" });
      return;
    }
    const userId = 1; // TODO: from session
    const code = `VCH-${nanoid(10).toUpperCase()}`;
    const [voucher] = await db.insert(vouchersTable).values({
      code,
      offerId,
      userId,
      restaurantId: offer.restaurantId,
      value: offer.discountedPrice ?? offer.originalPrice ?? "0",
      currency: offer.currency,
      validUntil: offer.validUntil,
      isGift: false,
      status: "active",
    }).returning();
    res.status(201).json({ ...voucher, restaurantNameEn: "", restaurantNameAr: "" });
  } catch (err) {
    req.log.error({ err }, "Failed to purchase voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to purchase voucher" });
  }
});

// Get voucher
router.get("/vouchers/:voucherId", async (req, res) => {
  try {
    const voucherId = parseInt(req.params.voucherId, 10);
    const [voucher] = await db.select({
      id: vouchersTable.id,
      code: vouchersTable.code,
      offerId: vouchersTable.offerId,
      userId: vouchersTable.userId,
      restaurantId: vouchersTable.restaurantId,
      value: vouchersTable.value,
      currency: vouchersTable.currency,
      status: vouchersTable.status,
      validUntil: vouchersTable.validUntil,
      giftMessage: vouchersTable.giftMessage,
      isGift: vouchersTable.isGift,
      redeemedAt: vouchersTable.redeemedAt,
      createdAt: vouchersTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
    }).from(vouchersTable)
      .innerJoin(restaurantsTable, eq(vouchersTable.restaurantId, restaurantsTable.id))
      .where(eq(vouchersTable.id, voucherId));
    if (!voucher) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }
    res.json(voucher);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch voucher" });
  }
});

// Gift voucher
router.post("/vouchers/:voucherId/gift", async (req, res) => {
  try {
    const voucherId = parseInt(req.params.voucherId, 10);
    const { recipientPhone, recipientEmail, giftMessage } = req.body;
    const [voucher] = await db.update(vouchersTable)
      .set({ isGift: true, giftRecipientPhone: recipientPhone, giftRecipientEmail: recipientEmail, giftMessage })
      .where(eq(vouchersTable.id, voucherId))
      .returning();
    if (!voucher) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }
    res.json({ ...voucher, restaurantNameEn: "", restaurantNameAr: "" });
  } catch (err) {
    req.log.error({ err }, "Failed to gift voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to gift voucher" });
  }
});

export default router;
