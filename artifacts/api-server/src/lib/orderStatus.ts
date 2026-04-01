/**
 * Order Status State Machine
 *
 * ALL order status changes must go through transitionOrderStatus().
 * Direct DB updates bypass the audit trail, side effects, and transition
 * validation — never do that.
 *
 * Allowed transitions:
 *   placed          → confirmed | cancelled
 *   confirmed       → preparing | cancelled
 *   preparing       → out_for_delivery | ready_for_pickup | cancelled
 *   out_for_delivery → delivered
 *   ready_for_pickup → delivered
 *   delivered       → completed | disputed
 *   completed       → disputed
 *   cancelled       → (terminal)
 *   disputed        → (terminal — resolved via dispute flow)
 *
 * Side effects wired here (not in route handlers):
 *   CONFIRMED  → safety-net invoice creation if customerInvoiceRef is null
 *   COMPLETED  → loyalty points awarded (10 pts per 100 SAR of order total)
 *   CANCELLED  → points redeemed at checkout are refunded;
 *                card-payment orders trigger a gateway refund if a
 *                transactionId is available in the stored gateway response
 *
 * Every transition writes one immutable row to order_status_log.
 */

import { db } from "@workspace/db";
import {
  ordersTable, orderStatusLogTable, customerInvoicesTable, disputesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { notifyAsync } from "./notify.js";
import { logger } from "./logger.js";
import { awardPoints, logPointsTransaction } from "./points.js";
import { processRefund } from "./paymentGateway.js";
import { generateRefCode } from "./refcode.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "placed" | "confirmed" | "preparing"
  | "out_for_delivery" | "ready_for_pickup"
  | "delivered" | "cancelled" | "completed" | "disputed";

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  placed:           ["confirmed", "cancelled"],
  confirmed:        ["preparing", "cancelled"],
  preparing:        ["out_for_delivery", "ready_for_pickup", "cancelled"],
  out_for_delivery: ["delivered"],
  ready_for_pickup: ["delivered"],
  delivered:        ["completed", "disputed"],
  completed:        ["disputed"],
  cancelled:        [],
  // disputed exits to "completed" once the dispute is resolved — the resolve
  // endpoint sets the final dispute record status (resolved_refund / resolved_no_refund)
  // and then calls transitionOrderStatus to record the outcome on the order.
  disputed:         ["completed"],
};

export interface TransitionMeta {
  reason?:  string;
  actorId?: number;
}

// Points rate: 100 points = 1 SAR  (10 pts per 10 SAR = 10 pts / SAR)
// Earning rate: 10 pts per 100 SAR spent (= 0.1 pts / SAR)
const POINTS_PER_SAR_REDEEM = 100;  // used when refunding redeemed points
const POINTS_EARN_RATE      = 10;   // pts earned per 100 SAR spent (divisor)

// ─── Main Function ────────────────────────────────────────────────────────────

export async function transitionOrderStatus(
  orderNumber: string,
  newStatus:   OrderStatus,
  meta?:       TransitionMeta,
): Promise<typeof ordersTable.$inferSelect> {

  // 1. Fetch order — validates existence
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    throw Object.assign(
      new Error(`Order '${orderNumber}' not found`),
      { statusCode: 404 },
    );
  }

  // 2. Validate transition
  const currentStatus = order.status as OrderStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(
        `Cannot transition order '${orderNumber}' from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed from '${currentStatus}': [${allowed.join(", ") || "none — terminal state"}]`,
      ),
      { statusCode: 422, currentStatus, requestedStatus: newStatus, allowed },
    );
  }

  const transitionedAt = new Date();

  // 3. Persist new status
  const [updated] = await db
    .update(ordersTable)
    .set({ status: newStatus, updatedAt: transitionedAt })
    .where(eq(ordersTable.orderNumber, orderNumber))
    .returning();

  // 4. Write immutable audit log — every transition leaves a permanent record
  await db.insert(orderStatusLogTable).values({
    orderId:       order.id,
    orderNumber:   orderNumber,
    oldStatus:     currentStatus,
    newStatus,
    reason:        meta?.reason  ?? null,
    actorId:       meta?.actorId ?? null,
    transitionedAt,
  }).catch(err =>
    logger.error({ err, orderNumber }, "Failed to write order_status_log — transition succeeded but audit missing"),
  );

  logger.info(
    { orderNumber, from: currentStatus, to: newStatus, actorId: meta?.actorId },
    `Order status transition: ${currentStatus} → ${newStatus}`,
  );

  // 5. Non-blocking side effects
  sideEffects(order, updated!, currentStatus, newStatus, meta).catch(err =>
    logger.error({ err, orderNumber, newStatus }, "Order transition side-effect error"),
  );

  return updated!;
}

// ─── Side Effects ─────────────────────────────────────────────────────────────
// All run after the DB write is committed. Failures are logged but never bubble
// up to the caller — the transition has already succeeded.

async function sideEffects(
  order:         typeof ordersTable.$inferSelect,
  updated:       typeof ordersTable.$inferSelect,
  currentStatus: OrderStatus,   // status BEFORE the transition
  newStatus:     OrderStatus,
  meta?:         TransitionMeta,
): Promise<void> {

  const userId      = order.userId;
  const orderNumber = order.orderNumber;

  // ── Notifications ──────────────────────────────────────────────────────────

  if (userId) {
    if (newStatus === "confirmed") {
      notifyAsync({
        userId,
        type:    "order_confirmed",
        titleEn: "Order Confirmed",
        titleAr: "تم تأكيد الطلب",
        bodyEn:  `Your order ${orderNumber} has been confirmed and is being processed.`,
        bodyAr:  `تم تأكيد طلبك ${orderNumber} وجاري معالجته.`,
        refId:   order.id,
        refType: "order",
      });
    } else if (newStatus === "delivered") {
      notifyAsync({
        userId,
        type:    "order_delivered",
        titleEn: "Order Delivered",
        titleAr: "تم توصيل الطلب",
        bodyEn:  `Your order ${orderNumber} has been delivered. Enjoy your meal!`,
        bodyAr:  `تم توصيل طلبك ${orderNumber}. بالهناء والشفاء!`,
        refId:   order.id,
        refType: "order",
      });
    } else if (newStatus === "completed") {
      notifyAsync({
        userId,
        type:    "order_delivered",
        titleEn: "Order Completed",
        titleAr: "اكتمل الطلب",
        bodyEn:  `Your order ${orderNumber} is complete. Thank you for choosing Tabaq!`,
        bodyAr:  `اكتمل طلبك ${orderNumber}. شكراً لاختيارك طبق!`,
        refId:   order.id,
        refType: "order",
      });
    } else if (newStatus === "cancelled") {
      notifyAsync({
        userId,
        type:    "order_cancelled",
        titleEn: "Order Cancelled",
        titleAr: "تم إلغاء الطلب",
        bodyEn:  `Your order ${orderNumber} has been cancelled.${meta?.reason ? " Reason: " + meta.reason : ""}`,
        bodyAr:  `تم إلغاء طلبك ${orderNumber}.`,
        refId:   order.id,
        refType: "order",
      });
    }
  }

  // ── CONFIRMED: safety-net invoice creation ─────────────────────────────────
  // The normal path creates the invoice in POST /orders immediately.
  // If that failed (network error, DB contention, etc.) and the order was
  // later confirmed through the PATCH endpoint, this creates the missing invoice.

  if (newStatus === "confirmed" && !order.customerInvoiceRef) {
    try {
      // Lazy import to avoid module-level circular dependency risk
      const { invoiceService } = await import("../services/invoiceService.js");
      await invoiceService.createInvoiceIfMissing(order.id);
      logger.info({ orderId: order.id }, "Safety-net invoice created on CONFIRMED transition");
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "Safety-net invoice creation failed on CONFIRMED — manual action needed");
    }
  }

  // ── DISPUTED: auto-create dispute record if one does not exist yet ────────
  // Normally, POST /disputes creates the record before calling this function.
  // But if an admin or staff directly transitions an order to "disputed" via
  // PATCH /orders/:number/status, no dispute record would exist. This safety
  // net ensures a record is always created so the dispute workflow can proceed.

  if (newStatus === "disputed") {
    try {
      const [existing] = await db
        .select({ id: disputesTable.id })
        .from(disputesTable)
        .where(eq(disputesTable.orderId, order.id))
        .limit(1);

      if (!existing) {
        const [created] = await db
          .insert(disputesTable)
          .values({
            orderId:    order.id,
            orderNumber,
            customerId: userId ?? null,
            supplierId: order.restaurantId ?? null,
            reason:     meta?.reason ?? "Dispute opened by staff",
            status:     "open",
            evidence:   [],
          })
          .returning();

        if (created) {
          const refCode = generateRefCode("DSP", created.id);
          await db.update(disputesTable)
            .set({ refCode })
            .where(eq(disputesTable.id, created.id));
          logger.info({ orderId: order.id, disputeId: created.id, refCode }, "Auto-created dispute record on DISPUTED transition");
        }
      }
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "Auto-create dispute record failed on DISPUTED transition");
    }
  }

  // ── COMPLETED: award loyalty points ───────────────────────────────────────
  // Points are earned when the order is completed (received by the customer),
  // not when it is placed — this prevents earning points on orders that are
  // later cancelled. Rate: 10 pts per 100 SAR spent.
  //
  // Skip when transitioning from "disputed" — the order was already completed
  // before the dispute was raised, meaning points were already awarded.

  if (newStatus === "completed" && userId && currentStatus !== "disputed") {
    const orderTotal  = parseFloat(order.total);
    const pointsEarned = Math.max(1, Math.floor(orderTotal / POINTS_EARN_RATE));
    try {
      await awardPoints(userId, pointsEarned);
      await logPointsTransaction(
        userId, "order_completed", pointsEarned, order.id, "order",
        `Earned ${pointsEarned} pts for completed order ${orderNumber} (${orderTotal} ${order.currency})`,
      );
      logger.info({ orderId: order.id, pointsEarned }, "Loyalty points awarded on COMPLETED");
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "Points award on COMPLETED failed — manual reconciliation needed");
    }
  }

  // ── CANCELLED: refund redeemed points ─────────────────────────────────────
  // If the customer redeemed points at checkout, return them.

  if (newStatus === "cancelled" && userId && order.pointsUsed && order.pointsUsed > 0) {
    const pointsToRefund = order.pointsUsed;
    const monetary = Math.round((pointsToRefund / POINTS_PER_SAR_REDEEM) * 100) / 100;
    try {
      await awardPoints(userId, pointsToRefund);
      await logPointsTransaction(
        userId, "admin_grant", pointsToRefund, order.id, "order",
        `Refund of ${pointsToRefund} pts (${monetary} SAR) for cancelled order ${orderNumber}`,
      );
      logger.info({ orderId: order.id, pointsToRefund }, "Points refunded on CANCELLED");
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "Points refund on CANCELLED failed — manual reconciliation needed");
    }
  }

  // ── CANCELLED: trigger gateway refund ─────────────────────────────────────
  // For orders that were charged via card/gateway, issue a refund if we have
  // a transactionId in the stored gateway response.

  const REFUNDABLE_METHODS = new Set([
    "card", "credit_card", "debit_card", "online",
    "hyperpay", "stripe", "hybrid",
  ]);

  if (
    newStatus === "cancelled" &&
    order.paymentMethod &&
    REFUNDABLE_METHODS.has(order.paymentMethod.toLowerCase()) &&
    order.customerInvoiceRef
  ) {
    try {
      const [inv] = await db
        .select({ gatewayResponse: customerInvoicesTable.gatewayResponse })
        .from(customerInvoicesTable)
        .where(eq(customerInvoicesTable.refCode, order.customerInvoiceRef))
        .limit(1);

      const raw = inv?.gatewayResponse as Record<string, unknown> | undefined;
      // Gateway responses vary by provider; check the most common id fields
      const transactionId = raw
        ? String(raw["transactionId"] ?? raw["id"] ?? "")
        : "";

      if (transactionId) {
        const refundResult = await processRefund({
          transactionId,
          amount:    parseFloat(order.total),
          currency:  order.currency,
          orderId:   String(order.id),
          reason:    meta?.reason ?? "Order cancelled",
        });

        if (refundResult.success) {
          logger.info({ orderId: order.id, refundId: refundResult.refundId }, "Gateway refund issued for cancelled order");
        } else {
          logger.warn({ orderId: order.id }, "Gateway refund returned failure — manual action may be needed");
        }
      } else {
        logger.info({ orderId: order.id }, "CANCELLED: no gateway transactionId found — skipping refund");
      }
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "Gateway refund on CANCELLED failed — manual action needed");
    }
  }
}
