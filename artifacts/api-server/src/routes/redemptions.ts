import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { redemptionsTable, vouchersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// POST /redemptions/redeem — redeem a voucher by code
router.post("/redeem", requireAuth, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const userId = req.auth!.userId;

    const [voucher] = await db.select().from(vouchersTable).where(eq(vouchersTable.code, code));
    if (!voucher) {
      res.status(404).json({ error: "not_found", message: "Voucher not found" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, voucher.restaurantId));
    if (!restaurant || restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Only restaurant owner can redeem" });
      return;
    }

    if (voucher.status !== "active" && voucher.status !== "partially_redeemed") {
      res.status(400).json({ error: "invalid_status", message: `Voucher is ${voucher.status}` });
      return;
    }

    const [redemption] = await db.transaction(async (tx) => {
      const redeemAmount = amount || voucher.value;
      
      const [r] = await tx.insert(redemptionsTable).values({
        voucherId: voucher.id,
        restaurantId: voucher.restaurantId,
        staffUserId: userId,
        method: "on_site",
        amountRedeemed: redeemAmount,
        createdAt: new Date(),
      }).returning();

      await tx.update(vouchersTable).set({
        status: "redeemed", // Simplified for now, could be partially_redeemed
        redeemedAt: new Date(),
      }).where(eq(vouchersTable.id, voucher.id));

      return [r];
    });

    res.status(201).json(redemption);
  } catch (err) {
    req.log.error({ err }, "Failed to redeem voucher");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /redemptions — list redemptions for merchant's restaurant
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    // Find restaurant owned by user
    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, userId));
    if (!restaurant) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const redemptions = await db.select({
      id: redemptionsTable.id,
      voucherId: redemptionsTable.voucherId,
      amountRedeemed: redemptionsTable.amountRedeemed,
      createdAt: redemptionsTable.createdAt,
      voucherCode: vouchersTable.code,
    })
    .from(redemptionsTable)
    .innerJoin(vouchersTable, eq(redemptionsTable.voucherId, vouchersTable.id))
    .where(eq(redemptionsTable.restaurantId, restaurant.id))
    .orderBy(sql`${redemptionsTable.createdAt} desc`);

    res.json(redemptions);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch redemptions");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
