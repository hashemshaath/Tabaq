/**
 * Returns Routes
 *
 * Implements the post-delivery return flow for Tabaq orders:
 *
 *   POST /orders/:orderNumber/return
 *     — Customer requests a return.  Order must be "completed".
 *       Transitions to "return_requested".
 *
 *   POST /orders/:orderNumber/return/approve
 *     — Admin or restaurant owner approves the return.
 *       Body: { refundAmount?: number, reason?: string }
 *       Transitions to "returned" (side effects: credit note + proportional
 *       points deduction wired inside transitionOrderStatus).
 *
 *   POST /orders/:orderNumber/return/reject
 *     — Admin or restaurant owner rejects the return.
 *       Body: { reason?: string }
 *       Transitions back to "completed".
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { transitionOrderStatus } from "../lib/orderStatus.js";

const router = Router();

// ── POST /orders/:orderNumber/return ──────────────────────────────────────────
// Customer opens a return request. Only the order owner may do this.

router.post("/orders/:orderNumber/return", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId  = req.auth!.userId;
    const { reason } = req.body ?? {};

    const [order] = await db
      .select({
        id:          ordersTable.id,
        userId:      ordersTable.userId,
        restaurantId: ordersTable.restaurantId,
        status:      ordersTable.status,
      })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }

    if (order.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only request returns on your own orders" });
      return;
    }

    if (order.status !== "completed") {
      res.status(422).json({
        error:   "invalid_transition",
        message: `Cannot request a return — order is currently "${order.status}". Only completed orders can be returned.`,
      });
      return;
    }

    const updated = await transitionOrderStatus(orderNumber, "return_requested", {
      reason:  reason ?? "Customer return request",
      actorId: userId,
    });

    res.status(200).json({
      order:   updated,
      message: "Return request submitted. Our team will review it shortly.",
    });
  } catch (err: any) {
    if (err.statusCode === 422) {
      res.status(422).json({ error: "invalid_transition", message: err.message, allowedTransitions: err.allowedTransitions });
      return;
    }
    req.log.error({ err }, "Failed to submit return request");
    res.status(500).json({ error: "internal_error", message: "Failed to submit return request" });
  }
});

// ── POST /orders/:orderNumber/return/approve ──────────────────────────────────
// Admin or restaurant owner approves the return.
// Body: { refundAmount?: number, reason?: string }

router.post("/orders/:orderNumber/return/approve", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId  = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin === true;
    const { refundAmount, reason } = req.body ?? {};

    const [order] = await db
      .select({
        id:           ordersTable.id,
        userId:       ordersTable.userId,
        restaurantId: ordersTable.restaurantId,
        status:       ordersTable.status,
        total:        ordersTable.total,
      })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }

    let isRestaurantOwner = false;
    if (order.restaurantId) {
      const [restaurant] = await db
        .select({ ownerId: restaurantsTable.ownerId })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, order.restaurantId))
        .limit(1);
      isRestaurantOwner = restaurant?.ownerId === userId;
    }

    if (!isAdmin && !isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "Only an admin or the restaurant owner can approve returns" });
      return;
    }

    if (order.status !== "return_requested") {
      res.status(422).json({
        error:   "invalid_transition",
        message: `Cannot approve return — order is currently "${order.status}", not "return_requested".`,
      });
      return;
    }

    const orderTotal    = parseFloat(order.total);
    const resolvedAmount = refundAmount != null
      ? Math.min(parseFloat(String(refundAmount)), orderTotal)
      : orderTotal;

    if (resolvedAmount <= 0) {
      res.status(400).json({ error: "bad_request", message: "refundAmount must be greater than 0" });
      return;
    }

    const updated = await transitionOrderStatus(orderNumber, "returned", {
      reason:       reason ?? "Return approved",
      actorId:      userId,
      refundAmount: resolvedAmount,
    });

    res.status(200).json({
      order:        updated,
      refundAmount: resolvedAmount,
      message:      `Return approved. Credit note will be issued for ${resolvedAmount} ${order.total}.`,
    });
  } catch (err: any) {
    if (err.statusCode === 422) {
      res.status(422).json({ error: "invalid_transition", message: err.message, allowedTransitions: err.allowedTransitions });
      return;
    }
    req.log.error({ err }, "Failed to approve return");
    res.status(500).json({ error: "internal_error", message: "Failed to approve return" });
  }
});

// ── POST /orders/:orderNumber/return/reject ───────────────────────────────────
// Admin or restaurant owner rejects the return — order reverts to "completed".

router.post("/orders/:orderNumber/return/reject", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId  = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin === true;
    const { reason } = req.body ?? {};

    const [order] = await db
      .select({
        id:           ordersTable.id,
        restaurantId: ordersTable.restaurantId,
        status:       ordersTable.status,
      })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }

    let isRestaurantOwner = false;
    if (order.restaurantId) {
      const [restaurant] = await db
        .select({ ownerId: restaurantsTable.ownerId })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, order.restaurantId))
        .limit(1);
      isRestaurantOwner = restaurant?.ownerId === userId;
    }

    if (!isAdmin && !isRestaurantOwner) {
      res.status(403).json({ error: "forbidden", message: "Only an admin or the restaurant owner can reject returns" });
      return;
    }

    if (order.status !== "return_requested") {
      res.status(422).json({
        error:   "invalid_transition",
        message: `Cannot reject return — order is currently "${order.status}", not "return_requested".`,
      });
      return;
    }

    const updated = await transitionOrderStatus(orderNumber, "completed", {
      reason:  reason ?? "Return rejected — order restored to completed",
      actorId: userId,
    });

    res.status(200).json({
      order:   updated,
      message: "Return rejected. Order has been restored to completed status.",
    });
  } catch (err: any) {
    if (err.statusCode === 422) {
      res.status(422).json({ error: "invalid_transition", message: err.message, allowedTransitions: err.allowedTransitions });
      return;
    }
    req.log.error({ err }, "Failed to reject return");
    res.status(500).json({ error: "internal_error", message: "Failed to reject return" });
  }
});

export default router;
