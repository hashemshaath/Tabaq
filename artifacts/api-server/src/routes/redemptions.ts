import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { redemptionsTable, vouchersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// POST /redeem — redeem a voucher by code (FIX 3: partial balance handled correctly)
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

    // FIX 3: Correct partial redemption arithmetic
    const voucherBalance = parseFloat(String(voucher.value));
    const requested = amount ? Math.abs(parseFloat(String(amount))) : voucherBalance;
    const redeemAmount = Math.min(requested, voucherBalance);
    const remainingBalance = Math.max(0, Math.round((voucherBalance - redeemAmount) * 100) / 100);
    const isFullyRedeemed = remainingBalance === 0;

    const [redemption] = await db.transaction(async (tx) => {
      const [r] = await tx.insert(redemptionsTable).values({
        voucherId: voucher.id,
        restaurantId: voucher.restaurantId,
        staffUserId: userId,
        method: "on_site",
        amountRedeemed: String(redeemAmount.toFixed(2)),
        createdAt: new Date(),
      }).returning();

      // FIX 3: Update voucher with remaining balance and correct status
      await tx.update(vouchersTable).set({
        // Track cumulative redeemed amount
        redeemedAmount: sql`COALESCE(${vouchersTable.redeemedAmount}, 0) + ${redeemAmount.toFixed(2)}`,
        remainingBalance: String(remainingBalance.toFixed(2)),
        status: isFullyRedeemed ? "redeemed" : "partially_redeemed",
        redeemedAt: isFullyRedeemed ? new Date() : null,
      }).where(eq(vouchersTable.id, voucher.id));

      return [r];
    });

    res.status(201).json({
      ...redemption,
      amountRedeemed: redeemAmount.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
      voucherStatus: isFullyRedeemed ? "redeemed" : "partially_redeemed",
    });
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
