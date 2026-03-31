import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { promoCodesTable, promoCodeRedemptionsTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// GET /promo-codes — admin only list
router.get("/promo-codes", requireAdmin, async (req, res) => {
  try {
    const codes = await db.select().from(promoCodesTable).orderBy(sql`${promoCodesTable.createdAt} desc`);
    res.json(codes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch promo codes");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /promo-codes — admin create
router.post("/promo-codes", requireAdmin, async (req, res) => {
  try {
    const [code] = await db.insert(promoCodesTable).values({
      ...req.body,
      createdById: req.auth!.userId,
    }).returning();
    res.status(201).json(code);
  } catch (err) {
    req.log.error({ err }, "Failed to create promo code");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /promo-codes/:id — admin update
router.patch("/promo-codes/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [updated] = await db.update(promoCodesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(promoCodesTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update promo code");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /promo-codes/apply — validate and apply a promo code
router.post("/promo-codes/apply", requireAuth, async (req, res) => {
  try {
    const { code, orderValue, restaurantId } = req.body;
    const userId = req.auth!.userId;

    const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase()));
    
    if (!promo || !promo.isActive) {
      res.status(404).json({ error: "invalid_code", message: "Promo code not found or inactive" });
      return;
    }

    const now = new Date();
    if (now < promo.startAt || now > promo.endAt) {
      res.status(400).json({ error: "expired", message: "Promo code expired" });
      return;
    }

    if (promo.maxRedemptions && promo.usedCount >= promo.maxRedemptions) {
      res.status(400).json({ error: "limit_reached", message: "Promo code limit reached" });
      return;
    }

    if (promo.minOrderValue && parseFloat(orderValue) < parseFloat(promo.minOrderValue)) {
      res.status(400).json({ error: "min_value", message: `Minimum order value of ${promo.minOrderValue} required` });
      return;
    }

    // Check user redemptions
    const [userRedemptions] = await db.select({ count: sql<number>`count(*)` })
      .from(promoCodeRedemptionsTable)
      .where(and(eq(promoCodeRedemptionsTable.promoCodeId, promo.id), eq(promoCodeRedemptionsTable.userId, userId)));
    
    if (promo.maxPerUser && Number(userRedemptions.count) >= promo.maxPerUser) {
      res.status(400).json({ error: "user_limit", message: "You have already used this promo code" });
      return;
    }

    let discountAmount = 0;
    if (promo.type === "percent") {
      discountAmount = (parseFloat(orderValue) * parseFloat(promo.discountValue)) / 100;
      if (promo.maxTotalDiscount && discountAmount > parseFloat(promo.maxTotalDiscount)) {
        discountAmount = parseFloat(promo.maxTotalDiscount);
      }
    } else if (promo.type === "fixed") {
      discountAmount = parseFloat(promo.discountValue);
    }

    res.json({
      promoCodeId: promo.id,
      discountAmount,
      type: promo.type,
      code: promo.code
    });
  } catch (err) {
    req.log.error({ err }, "Failed to apply promo code");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
