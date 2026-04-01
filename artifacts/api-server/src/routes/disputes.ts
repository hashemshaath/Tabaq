/**
 * Dispute Workflow Routes
 *
 * POST   /disputes                          — customer opens a dispute on a delivered order
 * GET    /disputes/:disputeUid              — get dispute by refCode (e.g. DSP-123) or numeric id
 * GET    /me/disputes                       — list current user's disputes
 * PUT    /disputes/:disputeUid/review       — staff: mark as under review
 * PUT    /disputes/:disputeUid/resolve      — staff: resolve with decision
 *
 * PATCH aliases for the PUT endpoints are also registered for backward compatibility.
 *
 * Note: all routes are mounted under /api (see app.ts).
 */

import { Router, type IRouter, type RequestHandler } from "express";
import { db } from "@workspace/db";
import {
  disputesTable, ordersTable, customerInvoicesTable,
} from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";
import { generateRefCode } from "../lib/refcode.js";
import { notifyAsync } from "../lib/notify.js";
import { processRefund } from "../lib/paymentGateway.js";
import { transitionOrderStatus } from "../lib/orderStatus.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a dispute by either its refCode (e.g. "DSP-1234") or its numeric id.
 * Always returns at most one dispute row.
 */
async function findDispute(uid: string) {
  const numericId = parseInt(uid, 10);
  const isNumeric = !Number.isNaN(numericId) && String(numericId) === uid;

  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(
      isNumeric
        ? or(eq(disputesTable.id, numericId), eq(disputesTable.refCode, uid))
        : eq(disputesTable.refCode, uid),
    )
    .limit(1);

  return dispute ?? null;
}

// ─── POST /disputes — customer opens a dispute ─────────────────────────────────

router.post("/disputes", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { orderNumber, reason, evidence } = req.body;

    if (!orderNumber || !reason) {
      return res.status(400).json({ error: "bad_request", message: "orderNumber and reason are required" });
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "not_found", message: "Order not found" });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You can only dispute your own orders" });
    }
    if (!["delivered", "completed"].includes(order.status)) {
      return res.status(422).json({
        error: "invalid_state",
        message: `Orders in '${order.status}' state cannot be disputed. Only delivered or completed orders are eligible.`,
      });
    }

    // Block duplicate open disputes
    const [existingDispute] = await db
      .select({ id: disputesTable.id, refCode: disputesTable.refCode, status: disputesTable.status })
      .from(disputesTable)
      .where(eq(disputesTable.orderNumber, orderNumber))
      .limit(1);

    if (existingDispute && !["resolved_refund", "resolved_no_refund"].includes(existingDispute.status)) {
      return res.status(409).json({
        error: "conflict",
        message: `A dispute already exists for this order (status: ${existingDispute.status})`,
        disputeUid: existingDispute.refCode,
        disputeId:  existingDispute.id,
      });
    }

    // Create dispute — include supplierId (the restaurant) for two-party visibility
    const [dispute] = await db
      .insert(disputesTable)
      .values({
        orderId:    order.id,
        orderNumber,
        customerId: userId,
        supplierId: order.restaurantId ?? null,
        reason,
        status:     "open",
        evidence:   evidence ?? [],
      })
      .returning();

    const refCode = generateRefCode("DSP", dispute!.id);
    const [withRef] = await db
      .update(disputesTable)
      .set({ refCode })
      .where(eq(disputesTable.id, dispute!.id))
      .returning();

    // Transition order to disputed.
    // transitionOrderStatus DISPUTED side effect checks for an existing dispute
    // record first, so no duplicate is created (idempotent).
    try {
      await transitionOrderStatus(orderNumber, "disputed", { actorId: userId, reason });
    } catch (err) {
      logger.warn({ err, orderNumber }, "Could not transition order to disputed (may already be in that state)");
    }

    notifyAsync({
      userId,
      type:    "dispute_opened",
      titleEn: "Dispute Opened",
      titleAr: "تم فتح نزاع",
      bodyEn:  `Your dispute for order ${orderNumber} has been received. Reference: ${refCode}. Our team will review it within 24 hours.`,
      bodyAr:  `تم استلام نزاعك للطلب ${orderNumber}. المرجع: ${refCode}. سيراجعه فريقنا خلال 24 ساعة.`,
      refId:   dispute!.id,
      refType: "dispute",
    });

    res.status(201).json({ dispute: withRef ?? dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to open dispute");
    res.status(500).json({ error: "internal_error", message: "Failed to open dispute" });
  }
});

// ─── GET /me/disputes — list current user's disputes ─────────────────────────

router.get("/me/disputes", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const disputes = await db
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.customerId, userId))
      .orderBy(desc(disputesTable.createdAt))
      .limit(50);

    res.json({ disputes });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user disputes");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── GET /disputes/:disputeUid — dispute details ──────────────────────────────

router.get("/disputes/:disputeUid", requireAuth, async (req, res) => {
  try {
    const uid     = req.params["disputeUid"] as string;
    const userId  = req.auth!.userId;
    const isAdmin = !!(req as any).auth?.isAdmin;

    const dispute = await findDispute(uid);
    if (!dispute) {
      return res.status(404).json({ error: "not_found", message: "Dispute not found" });
    }
    if (!isAdmin && dispute.customerId !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You may only view your own disputes" });
    }

    res.json({ dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dispute");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Review handler (shared between PUT and PATCH) ────────────────────────────

const handleReview: RequestHandler = async (req, res) => {
  try {
    const uid     = req.params["disputeUid"] as string;
    const dispute = await findDispute(uid);

    if (!dispute) {
      return res.status(404).json({ error: "not_found", message: "Dispute not found" });
    }
    if (dispute.status !== "open") {
      return res.status(422).json({
        error: "invalid_state",
        message: `Dispute is already '${dispute.status}' — only open disputes can be moved to under_review`,
      });
    }

    const [updated] = await db
      .update(disputesTable)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(eq(disputesTable.id, dispute.id))
      .returning();

    if (dispute.customerId) {
      notifyAsync({
        userId:  dispute.customerId,
        type:    "dispute_opened",
        titleEn: "Dispute Under Review",
        titleAr: "جاري مراجعة النزاع",
        bodyEn:  `Your dispute ${dispute.refCode} for order ${dispute.orderNumber} is now under review. We'll update you soon.`,
        bodyAr:  `نزاعك ${dispute.refCode} للطلب ${dispute.orderNumber} قيد المراجعة. سنُعلمك قريبًا.`,
        refId:   dispute.id,
        refType: "dispute",
      });
    }

    res.json({ dispute: updated });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to update dispute to under_review");
    res.status(500).json({ error: "internal_error" });
  }
};

// ─── Resolve handler (shared between PUT and PATCH) ───────────────────────────
// Body: { decision: 'REFUND' | 'NO_REFUND' | 'PARTIAL_REFUND', amount?, notes? }
//
// Flow:
//  1. Validates decision + dispute state
//  2. For REFUND/PARTIAL_REFUND: calls processRefund with gateway transactionId
//  3. Updates dispute record with resolution details
//  4. Transitions order: disputed → completed  (points award skipped — already awarded)
//  5. Notifies customer

const handleResolve: RequestHandler = async (req, res) => {
  try {
    const uid = req.params["disputeUid"] as string;
    const { decision, amount, notes } = req.body as {
      decision: "REFUND" | "NO_REFUND" | "PARTIAL_REFUND";
      amount?: number;
      notes?: string;
    };

    if (!decision || !["REFUND", "NO_REFUND", "PARTIAL_REFUND"].includes(decision)) {
      return res.status(400).json({
        error: "bad_request",
        message: "decision must be one of: REFUND, NO_REFUND, PARTIAL_REFUND",
      });
    }
    if (decision === "PARTIAL_REFUND" && (amount === undefined || amount <= 0)) {
      return res.status(400).json({
        error: "bad_request",
        message: "amount (positive number) is required for PARTIAL_REFUND",
      });
    }

    const dispute = await findDispute(uid);
    if (!dispute) {
      return res.status(404).json({ error: "not_found", message: "Dispute not found" });
    }
    if (!["open", "under_review"].includes(dispute.status)) {
      return res.status(422).json({
        error: "invalid_state",
        message: `Dispute is already '${dispute.status}' and cannot be resolved again`,
      });
    }

    const newStatus = decision === "NO_REFUND" ? "resolved_no_refund" : "resolved_refund";
    const now = new Date();

    // ── Gateway refund ────────────────────────────────────────────────────────
    let refundGatewayResponse: Record<string, unknown> | null = null;
    let actualRefundAmount = 0;

    if (decision !== "NO_REFUND" && dispute.orderId) {
      try {
        const [order] = await db
          .select({
            total:              ordersTable.total,
            currency:           ordersTable.currency,
            customerInvoiceRef: ordersTable.customerInvoiceRef,
          })
          .from(ordersTable)
          .where(eq(ordersTable.id, dispute.orderId))
          .limit(1);

        actualRefundAmount = decision === "PARTIAL_REFUND"
          ? (amount ?? 0)
          : Number(order?.total ?? 0);

        if (actualRefundAmount > 0) {
          // Fetch the gateway transactionId from the stored invoice response
          let transactionId: string | null = null;
          if (order?.customerInvoiceRef) {
            const [inv] = await db
              .select({ gatewayResponse: customerInvoicesTable.gatewayResponse })
              .from(customerInvoicesTable)
              .where(eq(customerInvoicesTable.refCode, order.customerInvoiceRef))
              .limit(1);

            const raw = inv?.gatewayResponse as Record<string, unknown> | undefined;
            transactionId = raw
              ? String(raw["transactionId"] ?? raw["id"] ?? "") || null
              : null;
          }

          const refundResult = await processRefund({
            transactionId: transactionId ?? `ORDER-${dispute.orderId}`,
            amount:        actualRefundAmount,
            currency:      order?.currency ?? "SAR",
            orderId:       String(dispute.orderId),
            reason:        notes ?? "Dispute resolved with refund",
          });

          refundGatewayResponse = refundResult.rawResponse ?? null;
          logger.info({ refundResult, disputeId: dispute.id }, "Dispute refund processed");

          if (dispute.customerId) {
            notifyAsync({
              userId:  dispute.customerId,
              type:    "refund_processed",
              titleEn: "Refund Processed",
              titleAr: "تمت معالجة الاسترداد",
              bodyEn:  `Your refund of ${actualRefundAmount} ${order?.currency ?? "SAR"} for order ${dispute.orderNumber} has been processed. It may take 3–5 business days.`,
              bodyAr:  `تمت معالجة استرداد ${actualRefundAmount} ريال للطلب ${dispute.orderNumber}. قد يستغرق ظهوره 3-5 أيام عمل.`,
              refId:   dispute.orderId,
              refType: "order",
              metadata: { refundId: refundResult.refundId, amount: actualRefundAmount, disputeId: dispute.id },
            });
          }
        }
      } catch (refundErr) {
        logger.warn({ refundErr, disputeId: dispute.id }, "Refund processing failed during dispute resolution — proceeding with status update");
      }
    }

    // ── Update dispute record ─────────────────────────────────────────────────
    const [updatedDispute] = await db
      .update(disputesTable)
      .set({
        status:          newStatus as any,
        resolutionNotes: notes ?? null,
        refundAmount:    decision !== "NO_REFUND" ? String(actualRefundAmount) : null,
        ...(refundGatewayResponse ? { gatewayResponse: refundGatewayResponse } : {}),
        resolvedBy:      (req as any).auth!.userId,
        resolvedAt:      now,
        updatedAt:       now,
      })
      .where(eq(disputesTable.id, dispute.id))
      .returning();

    // ── Transition order: disputed → completed ────────────────────────────────
    // Closes the loop on the order's state machine. The COMPLETED side effect in
    // transitionOrderStatus skips point awarding when coming from "disputed"
    // (points were already awarded when the order was first completed/delivered).
    if (dispute.orderNumber) {
      try {
        await transitionOrderStatus(dispute.orderNumber, "completed", {
          reason:  `Dispute ${dispute.refCode} resolved — decision: ${decision}.${notes ? " " + notes : ""}`,
          actorId: (req as any).auth!.userId,
        });
      } catch (err) {
        logger.warn({ err, orderNumber: dispute.orderNumber }, "Could not transition order from disputed to completed");
      }
    }

    // ── Notify customer of final outcome ──────────────────────────────────────
    if (dispute.customerId) {
      notifyAsync({
        userId:  dispute.customerId,
        type:    "dispute_resolved",
        titleEn: decision === "NO_REFUND" ? "Dispute Closed — No Refund" : "Dispute Resolved — Refund Approved",
        titleAr: decision === "NO_REFUND" ? "تم إغلاق النزاع — لا يوجد استرداد" : "تم حل النزاع — تمت الموافقة على الاسترداد",
        bodyEn:  decision === "NO_REFUND"
          ? `Your dispute ${dispute.refCode} for order ${dispute.orderNumber} has been reviewed. Decision: No refund.${notes ? " Note: " + notes : ""}`
          : `Your dispute ${dispute.refCode} for order ${dispute.orderNumber} has been resolved. Refund of ${actualRefundAmount} SAR approved.`,
        bodyAr:  decision === "NO_REFUND"
          ? `تم مراجعة نزاعك ${dispute.refCode} للطلب ${dispute.orderNumber}. القرار: لا يوجد استرداد.`
          : `تم حل نزاعك ${dispute.refCode} للطلب ${dispute.orderNumber}. تمت الموافقة على استرداد ${actualRefundAmount} ريال.`,
        refId:   dispute.id,
        refType: "dispute",
        metadata: { decision, refundAmount: actualRefundAmount, notes },
      });
    }

    res.json({ dispute: updatedDispute, decision });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to resolve dispute");
    res.status(500).json({ error: "internal_error" });
  }
};

// Register PUT (task spec) and PATCH (backward compat) for both mutating endpoints
router.put("/disputes/:disputeUid/review",   requireAdmin, handleReview);
router.patch("/disputes/:disputeUid/review", requireAdmin, handleReview);

router.put("/disputes/:disputeUid/resolve",   requireAdmin, handleResolve);
router.patch("/disputes/:disputeUid/resolve", requireAdmin, handleResolve);

export default router;
