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

    // Use remainingBalance (current available balance) rather than the original face value.
    // A voucher with value=100 and remainingBalance=40 has 40 SAR available, not 100.
    const currentBalance = parseFloat(
      String(voucher.remainingBalance ?? voucher.value)
    );

    // amount_to_deduct = MIN(voucher_balance, order_total)
    // If caller omits `amount`, treat as "use whatever is left" (full current balance).
    const requested = amount ? Math.abs(parseFloat(String(amount))) : currentBalance;
    const amountToDeduct = Math.min(requested, currentBalance);

    // remaining_balance = current_balance - amount_to_deduct  (never goes below 0)
    const remainingBalance = Math.max(
      0,
      Math.round((currentBalance - amountToDeduct) * 100) / 100,
    );
    const isFullyRedeemed = remainingBalance === 0;

    const [redemption] = await db.transaction(async (tx) => {
      // Insert redemption record with both voucher_amount_used and voucher_remaining_after
      const [r] = await tx.insert(redemptionsTable).values({
        voucherId: voucher.id,
        restaurantId: voucher.restaurantId,
        staffUserId: userId,
        method: "on_site",
        amountRedeemed: amountToDeduct.toFixed(2),   // voucher_amount_used
        balanceAfter:   remainingBalance.toFixed(2),  // voucher_remaining_after
        createdAt: new Date(),
      }).returning();

      // Update voucher: remaining balance and status.
      // If remaining = 0  → "redeemed" (fully used).
      // If remaining > 0  → "partially_redeemed" (still active for future use).
      await tx.update(vouchersTable).set({
        redeemedAmount: sql`COALESCE(${vouchersTable.redeemedAmount}, 0) + ${amountToDeduct.toFixed(2)}`,
        remainingBalance: remainingBalance.toFixed(2),
        status: isFullyRedeemed ? "redeemed" : "partially_redeemed",
        redeemedAt: isFullyRedeemed ? new Date() : null,
      }).where(eq(vouchersTable.id, voucher.id));

      return [r];
    });

    res.status(201).json({
      ...redemption,
      voucherAmountUsed:      amountToDeduct.toFixed(2),
      voucherRemainingAfter:  remainingBalance.toFixed(2),
      voucherStatus: isFullyRedeemed ? "redeemed" : "partially_redeemed",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to redeem voucher");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /redemptions — list redemptions for merchant's restaurant
router.get("/redemptions", requireAuth, async (req, res) => {
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
