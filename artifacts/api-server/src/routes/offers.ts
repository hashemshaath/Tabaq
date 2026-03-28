import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { offersTable, vouchersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql, lte, gte, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { awardPoints, POINTS } from "../lib/points.js";

const router: IRouter = Router();

// List offers
router.get("/offers", async (req, res) => {
  try {
    const { restaurantId, cityId, active, limit = "20", offset = "0" } = req.query;
    const conditions: SQL[] = [];
    if (restaurantId) conditions.push(eq(offersTable.restaurantId, parseInt(restaurantId as string)));
    if (active === "true") {
      conditions.push(eq(offersTable.isActive, true));
      conditions.push(lte(offersTable.validFrom, new Date()));
      conditions.push(gte(offersTable.validUntil, new Date()));
    }
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));

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
      .orderBy(sql`${offersTable.validUntil} asc`)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(offersTable)
      .innerJoin(restaurantsTable, eq(offersTable.restaurantId, restaurantsTable.id))
      .where(conditions.length ? and(...conditions) : undefined);
    const [{ count }] = await countQuery;

    res.json({
      offers,
      total: Number(count ?? 0),
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
    const offerId = parseInt(req.params["offerId"] as string, 10);
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

// Create offer — restaurant owner only
router.post("/offers", requireAuth, async (req, res) => {
  try {
    const { restaurantId, titleEn, titleAr, originalPrice, validFrom, validUntil, ...rest } = req.body;
    if (!restaurantId || !titleEn || !titleAr || !originalPrice || !validFrom || !validUntil) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const userId = req.auth!.userId;
    // Verify caller owns the restaurant
    const [restaurant] = await db.select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl, ownerId: restaurantsTable.ownerId })
      .from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "Restaurant not found" });
      return;
    }
    if (restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You are not the owner of this restaurant" });
      return;
    }
    const [offer] = await db.insert(offersTable).values({
      restaurantId, titleEn, titleAr, originalPrice, validFrom: new Date(validFrom), validUntil: new Date(validUntil), ...rest,
    }).returning();
    res.status(201).json({ ...offer, restaurantNameEn: restaurant.nameEn ?? "", restaurantNameAr: restaurant.nameAr ?? "", restaurantCoverImageUrl: restaurant.coverImageUrl ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to create offer");
    res.status(500).json({ error: "internal_error", message: "Failed to create offer" });
  }
});

// List vouchers — auth required, users only see their own
router.get("/vouchers", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.auth!.userId;
    const conditions: SQL[] = [eq(vouchersTable.userId, userId)];
    if (status) conditions.push(eq(vouchersTable.status, status as 'active' | 'used' | 'expired'));

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
      giftRecipientPhone: vouchersTable.giftRecipientPhone,
      giftRecipientEmail: vouchersTable.giftRecipientEmail,
      redeemedAt: vouchersTable.redeemedAt,
      createdAt: vouchersTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(vouchersTable)
      .innerJoin(restaurantsTable, eq(vouchersTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .orderBy(sql`${vouchersTable.createdAt} desc`);
    res.json(vouchers);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch vouchers");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch vouchers" });
  }
});

// Purchase voucher — auth required
router.post("/vouchers", requireAuth, async (req, res) => {
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
    if (!offer.isActive) {
      res.status(400).json({ error: "bad_request", message: "This offer is no longer active" });
      return;
    }

    const now = new Date();
    if (offer.validFrom && now < offer.validFrom) {
      res.status(400).json({ error: "bad_request", message: "This offer has not started yet" });
      return;
    }
    if (offer.validUntil && now > offer.validUntil) {
      res.status(400).json({ error: "bad_request", message: "This offer has expired" });
      return;
    }

    const userId = req.auth!.userId;
    const code = `VCH-${nanoid(10).toUpperCase()}`;

    // Atomically decrement capacity — only proceed if remaining > 0
    if (offer.remainingCapacity !== null) {
      const updated = await db.update(offersTable)
        .set({ remainingCapacity: sql`${offersTable.remainingCapacity} - 1` })
        .where(and(eq(offersTable.id, offerId), sql`${offersTable.remainingCapacity} > 0`))
        .returning({ remainingCapacity: offersTable.remainingCapacity });
      if (updated.length === 0) {
        res.status(400).json({ error: "bad_request", message: "This offer is sold out" });
        return;
      }
    }

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

    // Award points for purchasing a voucher
    await awardPoints(userId, POINTS.VOUCHER_PURCHASED);

    // Notification stubs: in production these trigger push/SMS/email events
    req.log.info({ voucherId: voucher.id, userId, offerId }, "NOTIFY: voucher purchased — send confirmation to user");
    if (offer.validUntil) {
      req.log.info({ voucherId: voucher.id, validUntil: offer.validUntil }, "NOTIFY: schedule offer expiry reminder 24h before validUntil");
    }

    const [restaurant] = await db.select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl })
      .from(restaurantsTable).where(eq(restaurantsTable.id, offer.restaurantId));

    res.status(201).json({ ...voucher, restaurantNameEn: restaurant?.nameEn ?? "", restaurantNameAr: restaurant?.nameAr ?? "", restaurantCoverImageUrl: restaurant?.coverImageUrl ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to purchase voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to purchase voucher" });
  }
});

// Get voucher — auth required, owner only
router.get("/vouchers/:voucherId", requireAuth, async (req, res) => {
  try {
    const voucherId = parseInt(req.params["voucherId"] as string, 10);
    const userId = req.auth!.userId;
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
      giftRecipientPhone: vouchersTable.giftRecipientPhone,
      giftRecipientEmail: vouchersTable.giftRecipientEmail,
      redeemedAt: vouchersTable.redeemedAt,
      createdAt: vouchersTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(vouchersTable)
      .innerJoin(restaurantsTable, eq(vouchersTable.restaurantId, restaurantsTable.id))
      .where(eq(vouchersTable.id, voucherId));
    if (!voucher) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }
    if (voucher.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only view your own vouchers" });
      return;
    }
    res.json(voucher);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch voucher" });
  }
});

// Gift voucher — auth required, owner only
router.post("/vouchers/:voucherId/gift", requireAuth, async (req, res) => {
  try {
    const voucherId = parseInt(req.params["voucherId"] as string, 10);
    const userId = req.auth!.userId;
    const { recipientPhone, recipientEmail, giftMessage } = req.body;

    if (!recipientPhone && !recipientEmail) {
      res.status(400).json({ error: "bad_request", message: "Recipient phone or email is required" });
      return;
    }

    const [existing] = await db.select({ userId: vouchersTable.userId, status: vouchersTable.status })
      .from(vouchersTable).where(eq(vouchersTable.id, voucherId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only gift your own vouchers" });
      return;
    }
    if (existing.status !== "active") {
      res.status(400).json({ error: "bad_request", message: "Only active vouchers can be gifted" });
      return;
    }

    const [voucher] = await db.update(vouchersTable)
      .set({ isGift: true, giftRecipientPhone: recipientPhone ?? null, giftRecipientEmail: recipientEmail ?? null, giftMessage: giftMessage ?? null })
      .where(eq(vouchersTable.id, voucherId))
      .returning();

    const [restaurant] = await db.select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr })
      .from(restaurantsTable).where(eq(restaurantsTable.id, voucher.restaurantId));

    // Notification stub: in production, send gift notification to recipient via phone/email
    req.log.info({ voucherId, recipientPhone, recipientEmail }, "NOTIFY: gift voucher sent — deliver to recipient");

    res.json({ ...voucher, restaurantNameEn: restaurant?.nameEn ?? "", restaurantNameAr: restaurant?.nameAr ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to gift voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to gift voucher" });
  }
});

// Redeem voucher — auth required; called by restaurant staff at point-of-service
router.post("/vouchers/:voucherId/redeem", requireAuth, async (req, res) => {
  try {
    const voucherId = parseInt(req.params["voucherId"] as string, 10);
    const userId = req.auth!.userId;

    const [existing] = await db.select({
      id: vouchersTable.id,
      userId: vouchersTable.userId,
      restaurantId: vouchersTable.restaurantId,
      status: vouchersTable.status,
      validUntil: vouchersTable.validUntil,
    }).from(vouchersTable).where(eq(vouchersTable.id, voucherId));

    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }

    // Redemption is a restaurant-side (POS) action — only the restaurant owner can mark a voucher as used.
    // The customer presents the voucher code to the restaurant; the restaurant confirms/scans it.
    const [restaurant] = await db.select({ ownerId: restaurantsTable.ownerId })
      .from(restaurantsTable).where(eq(restaurantsTable.id, existing.restaurantId));

    const isRestaurantOwner = restaurant?.ownerId === userId;

    if (!isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "Only the restaurant owner can redeem vouchers" });
      return;
    }

    if (existing.status !== "active") {
      res.status(400).json({ error: "bad_request", message: `Voucher is already ${existing.status}` });
      return;
    }

    if (existing.validUntil && new Date() > existing.validUntil) {
      await db.update(vouchersTable).set({ status: "expired" }).where(eq(vouchersTable.id, voucherId));
      res.status(400).json({ error: "bad_request", message: "Voucher has expired" });
      return;
    }

    const [voucher] = await db.update(vouchersTable)
      .set({ status: "used", redeemedAt: new Date() })
      .where(and(eq(vouchersTable.id, voucherId), eq(vouchersTable.status, "active")))
      .returning();

    if (!voucher) {
      res.status(409).json({ error: "conflict", message: "Voucher was already redeemed" });
      return;
    }

    // Notification stub: in production, trigger an event to the notification service
    req.log.info({ voucherId, userId }, "NOTIFY: voucher redeemed — send confirmation to owner");

    res.json({ ...voucher, message: "Voucher successfully redeemed" });
  } catch (err) {
    req.log.error({ err }, "Failed to redeem voucher");
    res.status(500).json({ error: "internal_error", message: "Failed to redeem voucher" });
  }
});

export default router;
