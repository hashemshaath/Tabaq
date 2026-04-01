/**
 * Dispute Workflow Routes
 *
 * POST   /disputes                     — customer opens a dispute on a delivered order
 * GET    /disputes/:id                 — get dispute details
 * GET    /me/disputes                  — list current user's disputes
 * PATCH  /disputes/:id/review          — staff: mark as under review
 * PATCH  /disputes/:id/resolve         — staff: resolve with decision
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { disputesTable, ordersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";
import { generateRefCode } from "../lib/refcode.js";
import { notifyAsync } from "../lib/notify.js";
import { processRefund } from "../lib/paymentGateway.js";
import { transitionOrderStatus } from "../lib/orderStatus.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// POST /disputes — customer opens a dispute
router.post("/disputes", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { orderNumber, reason, evidence } = req.body;

    if (!orderNumber || !reason) {
      return res.status(400).json({ error: "bad_request", message: "orderNumber and reason are required" });
    }

    // Verify order exists, belongs to user, and is in a disputable state
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

    // Check for an existing open dispute on this order
    const [existingDispute] = await db
      .select({ id: disputesTable.id, status: disputesTable.status })
      .from(disputesTable)
      .where(eq(disputesTable.orderNumber, orderNumber))
      .limit(1);

    if (existingDispute && !["resolved_refund", "resolved_no_refund"].includes(existingDispute.status)) {
      return res.status(409).json({
        error: "conflict",
        message: `A dispute already exists for this order (status: ${existingDispute.status})`,
        disputeId: existingDispute.id,
      });
    }

    // Create the dispute record
    const [dispute] = await db
      .insert(disputesTable)
      .values({
        orderId: order.id,
        orderNumber,
        customerId: userId,
        reason,
        status: "open",
        evidence: evidence ?? [],
      })
      .returning();

    const refCode = generateRefCode("DSP", dispute!.id);
    const [withRef] = await db
      .update(disputesTable)
      .set({ refCode })
      .where(eq(disputesTable.id, dispute!.id))
      .returning();

    // Transition order to disputed state
    try {
      await transitionOrderStatus(orderNumber, "disputed", { actorId: userId, reason });
    } catch (err) {
      logger.warn({ err, orderNumber }, "Could not transition order to disputed (may already be in terminal state)");
    }

    notifyAsync({
      userId,
      type: "dispute_opened",
      titleEn: "Dispute Opened",
      titleAr: "تم فتح نزاع",
      bodyEn: `Your dispute for order ${orderNumber} has been received. Reference: ${refCode}. Our team will review it within 24 hours.`,
      bodyAr: `تم استلام نزاعك للطلب ${orderNumber}. المرجع: ${refCode}. سيراجعه فريقنا خلال 24 ساعة.`,
      refId: dispute!.id,
      refType: "dispute",
    });

    res.status(201).json({ dispute: withRef ?? dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to open dispute");
    res.status(500).json({ error: "internal_error", message: "Failed to open dispute" });
  }
});

// GET /me/disputes — list current user's disputes
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

// GET /disputes/:id — dispute details (customer: own disputes; admin: any)
router.get("/disputes/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const userId = req.auth!.userId;
    const isAdmin = (req as any).auth?.isAdmin;

    const [dispute] = await db
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, id))
      .limit(1);

    if (!dispute) {
      return res.status(404).json({ error: "not_found" });
    }
    if (!isAdmin && dispute.customerId !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.json({ dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dispute");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /disputes/:id/review — admin: mark as under review
router.patch("/disputes/:id/review", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);

    const [dispute] = await db
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, id))
      .limit(1);

    if (!dispute) {
      return res.status(404).json({ error: "not_found" });
    }
    if (dispute.status !== "open") {
      return res.status(422).json({ error: "invalid_state", message: `Dispute is already '${dispute.status}'` });
    }

    const [updated] = await db
      .update(disputesTable)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(eq(disputesTable.id, id))
      .returning();

    if (dispute.customerId) {
      notifyAsync({
        userId: dispute.customerId,
        type: "dispute_opened",
        titleEn: "Dispute Under Review",
        titleAr: "جاري مراجعة النزاع",
        bodyEn: `Your dispute for order ${dispute.orderNumber} is now under review. We'll update you soon.`,
        bodyAr: `نزاعك للطلب ${dispute.orderNumber} قيد المراجعة. سنُعلمك قريبًا.`,
        refId: id,
        refType: "dispute",
      });
    }

    res.json({ dispute: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update dispute to under_review");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /disputes/:id/resolve — admin: resolve with decision
router.patch("/disputes/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { decision, amount, notes } = req.body as {
      decision: "REFUND" | "NO_REFUND" | "PARTIAL_REFUND";
      amount?: number;
      notes?: string;
    };

    if (!decision || !["REFUND", "NO_REFUND", "PARTIAL_REFUND"].includes(decision)) {
      return res.status(400).json({ error: "bad_request", message: "decision must be REFUND, NO_REFUND, or PARTIAL_REFUND" });
    }
    if (decision === "PARTIAL_REFUND" && !amount) {
      return res.status(400).json({ error: "bad_request", message: "amount is required for PARTIAL_REFUND" });
    }

    const [dispute] = await db
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, id))
      .limit(1);

    if (!dispute) {
      return res.status(404).json({ error: "not_found" });
    }
    if (!["open", "under_review"].includes(dispute.status)) {
      return res.status(422).json({ error: "invalid_state", message: `Dispute is already '${dispute.status}'` });
    }

    const newStatus = decision === "NO_REFUND" ? "resolved_no_refund" : "resolved_refund";
    const now = new Date();

    // Process refund if applicable — capture raw gateway response for audit storage
    let refundGatewayResponse: Record<string, unknown> | null = null;

    if (decision !== "NO_REFUND" && dispute.orderId) {
      try {
        const [order] = await db.select({ total: ordersTable.total }).from(ordersTable).where(eq(ordersTable.id, dispute.orderId)).limit(1);
        const refundAmount = decision === "PARTIAL_REFUND" ? (amount ?? 0) : Number(order?.total ?? 0);

        if (refundAmount > 0) {
          const refundResult = await processRefund({
            transactionId: `ORDER-${dispute.orderId}`,
            amount: refundAmount,
            reason: notes ?? "Dispute resolved with refund",
          });

          // Store raw gateway response — used for reconciliation and audit trail
          refundGatewayResponse = refundResult.rawResponse ?? null;

          logger.info({ refundResult, disputeId: id }, "Dispute refund processed");
        }
      } catch (refundErr) {
        logger.warn({ refundErr, disputeId: id }, "Refund processing failed during dispute resolution");
      }
    }

    const [updated] = await db
      .update(disputesTable)
      .set({
        status: newStatus as any,
        resolutionNotes: notes ?? null,
        refundAmount: decision !== "NO_REFUND" ? String(amount ?? 0) : null,
        // Persist the normalized + raw gateway response for audit and reconciliation
        ...(refundGatewayResponse ? { gatewayResponse: refundGatewayResponse } : {}),
        resolvedBy: req.auth!.userId,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(eq(disputesTable.id, id))
      .returning();

    if (dispute.customerId) {
      notifyAsync({
        userId: dispute.customerId,
        type: "dispute_resolved",
        titleEn: `Dispute ${decision === "NO_REFUND" ? "Closed" : "Resolved — Refund Approved"}`,
        titleAr: decision === "NO_REFUND" ? "تم إغلاق النزاع" : "تم حل النزاع — تمت الموافقة على الاسترداد",
        bodyEn: decision === "NO_REFUND"
          ? `Your dispute for order ${dispute.orderNumber} has been reviewed. Decision: No refund. ${notes ?? ""}`
          : `Your dispute for order ${dispute.orderNumber} has been resolved. Refund approved.${amount ? ` Amount: ${amount} SAR.` : ""}`,
        bodyAr: decision === "NO_REFUND"
          ? `تم مراجعة نزاعك للطلب ${dispute.orderNumber}. القرار: لا يوجد استرداد.`
          : `تم حل نزاعك للطلب ${dispute.orderNumber}. تمت الموافقة على الاسترداد.`,
        refId: id,
        refType: "dispute",
      });
    }

    res.json({ dispute: updated, decision });
  } catch (err) {
    req.log.error({ err }, "Failed to resolve dispute");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
