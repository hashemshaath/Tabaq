import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, restaurantsTable, promoCodesTable, promoCodeRedemptionsTable, usersTable,
} from "@workspace/db/schema";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { eq, desc, sql } from "drizzle-orm";
import { invoiceService } from "../services/invoiceService.js";
import { calculateTax } from "../lib/tax.js";
import { transitionOrderStatus } from "../lib/orderStatus.js";
import { awardPoints, logPointsTransaction } from "../lib/points.js";
import { notifyAsync } from "../lib/notify.js";

const router = Router();

// Points redemption rate: 100 points = 1 SAR (i.e. 1 point = 0.01 SAR)
const POINTS_PER_SAR = 100;

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TBQ-${ts}-${rnd}`;
}

// POST /orders — place an order
router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      subtotal,
      discountAmount,
      deliveryFee,
      currency,
      orderMode,
      paymentMethod,
      promoCode,
      customerName,
      customerPhone,
      deliveryAddress,
      notes,
      idempotencyKey,
      countryCode,
      pointsToRedeem,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "bad_request", message: "Items are required" });
    }
    if (!subtotal) {
      return res.status(400).json({ error: "bad_request", message: "subtotal is required" });
    }

    const userId = req.auth?.userId ?? null;

    // Idempotency: return existing order if the same key is re-submitted
    if (idempotencyKey) {
      const [existing] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing) {
        return res.status(200).json({ order: existing, idempotent: true });
      }
    }

    // FIX 11: Calculate VAT based on country (default SA = 15%)
    const effectiveCountry = countryCode ?? "SA";
    const baseSubtotal = Number(subtotal);
    const baseDiscount = Number(discountAmount ?? 0);
    const baseFee = Number(deliveryFee ?? 0);
    const baseNet = baseSubtotal - baseDiscount + baseFee;

    const tax = await calculateTax(effectiveCountry, baseNet);

    // FIX 7: Handle points as (partial) payment method
    let pointsUsedFinal = 0;
    let pointsMonetaryValue = 0;

    if (pointsToRedeem && userId && Number(pointsToRedeem) > 0) {
      const pointsRequested = Math.floor(Number(pointsToRedeem));

      // Verify user has enough points
      const [user] = await db.select({ points: usersTable.points })
        .from(usersTable).where(eq(usersTable.id, userId)).limit(1);

      const availablePoints = user?.points ?? 0;
      if (availablePoints < pointsRequested) {
        return res.status(400).json({
          error: "insufficient_points",
          message: `You have ${availablePoints} points but tried to redeem ${pointsRequested}`,
          available: availablePoints,
        });
      }

      pointsUsedFinal = pointsRequested;
      pointsMonetaryValue = Math.round((pointsRequested / POINTS_PER_SAR) * 100) / 100;
    }

    const totalBeforePoints = tax.totalWithTax;
    const finalTotal = Math.max(0, Math.round((totalBeforePoints - pointsMonetaryValue) * 100) / 100);

    const etaMinutes = orderMode === "delivery" ? 35 : orderMode === "pickup" ? 20 : 15;

    // Deduct points atomically before creating the order (prevents double-spending).
    // The WHERE clause acts as a conditional lock: the UPDATE only runs if the
    // current balance still covers the request. RETURNING confirms it happened.
    // If 0 rows are returned, a concurrent request drained the balance — we abort.
    if (pointsUsedFinal > 0 && userId) {
      const deducted = await db.update(usersTable)
        .set({
          points: sql`${usersTable.points} - ${pointsUsedFinal}`,
          updatedAt: new Date(),
        })
        .where(
          sql`${usersTable.id} = ${userId} AND ${usersTable.points} >= ${pointsUsedFinal}`
        )
        .returning({ id: usersTable.id });

      if (deducted.length === 0) {
        // The balance was sufficient when we checked, but a concurrent request consumed
        // it before our UPDATE ran. Return a clear error rather than silently proceeding.
        return res.status(409).json({
          error: "insufficient_points",
          message: "Points balance changed — please retry. Another transaction may have used them concurrently.",
        });
      }
    }

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber: generateOrderNumber(),
        idempotencyKey: idempotencyKey ?? null,
        userId,
        restaurantId: restaurantId ?? items[0]?.restaurantId ?? null,
        items,
        subtotal: String(baseSubtotal),
        discountAmount: String(baseDiscount),
        deliveryFee: String(baseFee),
        taxAmount: String(tax.taxAmount),
        taxRate: String(tax.rate),
        taxName: tax.taxName,
        countryCode: effectiveCountry,
        pointsUsed: pointsUsedFinal,
        pointsMonetaryValue: String(pointsMonetaryValue),
        total: String(finalTotal),
        currency: currency ?? "SAR",
        status: "placed",
        orderMode: orderMode ?? "delivery",
        paymentMethod: pointsUsedFinal > 0 && finalTotal === 0
          ? "points"
          : pointsUsedFinal > 0
          ? "hybrid"
          : (paymentMethod ?? "card"),
        promoCode: promoCode ?? null,
        customerName: customerName ?? null,
        customerPhone: customerPhone ?? null,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        estimatedMinutes: etaMinutes,
      })
      .returning();

    // Log points deduction transaction
    if (pointsUsedFinal > 0 && userId) {
      await logPointsTransaction(
        userId, "redemption", -pointsUsedFinal, order!.id, "order",
        `Redeemed ${pointsUsedFinal} pts (${pointsMonetaryValue} SAR) for order #${order!.id}`,
      ).catch(() => {});
    }

    // Create customer invoice, log financial transaction, award loyalty points
    let invoiceRef: string | null = null;
    try {
      const result = await invoiceService.processOrder({
        orderId: order!.id,
        userId,
        restaurantId: restaurantId ?? items[0]?.restaurantId ?? null,
        items: items.map((i: any) => ({
          nameEn: i.nameEn ?? "Item",
          nameAr: i.nameAr ?? "عنصر",
          qty: i.qty ?? 1,
          price: i.price ?? 0,
        })),
        subtotal: baseSubtotal,
        discountAmount: baseDiscount,
        deliveryFee: baseFee,
        taxAmount: tax.taxAmount,
        taxRate: tax.rate,
        taxName: tax.taxName,
        total: finalTotal,
        currency: currency ?? "SAR",
        // Use the computed method ("points" | "hybrid" | "card" | …) not the raw body value.
        // The invoice service uses this to decide whether to call the payment gateway and how.
        paymentMethod: order!.paymentMethod ?? "card",
        promoCode: promoCode ?? null,
        pointsUsed: pointsUsedFinal,
        pointsMonetaryValue,
      });
      invoiceRef = result.invoiceRef;

      // Persist invoice ref on the order
      await db
        .update(ordersTable)
        .set({ customerInvoiceRef: invoiceRef })
        .where(eq(ordersTable.id, order!.id));
    } catch (invoiceErr) {
      req.log.warn({ invoiceErr }, "Invoice/points processing failed for order");
    }

    // Persist promo code redemption after successful order confirmation.
    // Non-blocking: runs after response is sent via setImmediate.
    // Non-critical: any failure is logged but never surfaces to the caller.
    //
    // Implementation note:
    //   Step 1 is a single atomic UPDATE WHERE code = ? that increments usage_count
    //   in-place (SET used_count = used_count + 1) and returns the row id.
    //   This avoids the SELECT-then-UPDATE anti-pattern — no stale read possible.
    //   Step 2 inserts the redemption record using the id returned by Step 1,
    //   so no separate lookup query is needed.
    if (promoCode && userId) {
      const capturedOrderId = order!.id;
      const discountApplied = String(baseDiscount > 0 ? baseDiscount : 0);

      setImmediate(async () => {
        try {
          // Step 1: single atomic UPDATE — increments usage_count, returns id
          const [updated] = await db
            .update(promoCodesTable)
            .set({
              usedCount: sql`${promoCodesTable.usedCount} + 1`,
              totalDiscountGiven: sql`${promoCodesTable.totalDiscountGiven} + ${discountApplied}`,
              updatedAt: new Date(),
            })
            .where(eq(promoCodesTable.code, promoCode.toUpperCase()))
            .returning({ id: promoCodesTable.id });

          if (!updated) return; // code not found — nothing to record

          // Step 2: insert redemption record
          // Fields: coupon_uid (promoCodeId), user_uid (userId),
          //         discount_applied (discountAmount), redeemed_at = createdAt (defaultNow)
          await db.insert(promoCodeRedemptionsTable).values({
            promoCodeId: updated.id,
            userId,
            discountAmount: discountApplied,
          });
        } catch (promoErr) {
          req.log.warn(
            { promoErr, promoCode, orderId: capturedOrderId },
            "Promo code redemption persistence failed (non-critical)",
          );
        }
      });
    }

    // Trigger 1: Order confirmed — includes invoice ref so customer can access receipt
    if (userId) {
      notifyAsync({
        userId,
        type: "order_confirmed",
        titleEn: "Order Placed",
        titleAr: "تم تقديم الطلب",
        bodyEn: `Your order ${order!.orderNumber} has been placed. Estimated time: ${etaMinutes} mins.${invoiceRef ? ` Receipt: ${invoiceRef}.` : ""}`,
        bodyAr: `تم تقديم طلبك ${order!.orderNumber}. الوقت المتوقع: ${etaMinutes} دقيقة.${invoiceRef ? ` الفاتورة: ${invoiceRef}.` : ""}`,
        refId: order!.id,
        refType: "order",
        metadata: invoiceRef ? { invoiceRef } : undefined,
      });
    }

    res.status(201).json({
      order: {
        ...order,
        customerInvoiceRef: invoiceRef,
        tax: {
          taxName: tax.taxName,
          rate: tax.rate,
          taxAmount: tax.taxAmount,
          totalWithTax: tax.totalWithTax,
        },
        pointsUsed: pointsUsedFinal,
        pointsMonetaryValue,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "internal_error", message: "Failed to create order" });
  }
});

// GET /orders — list authenticated user's orders
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const orders = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        restaurantId: ordersTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
        items: ordersTable.items,
        subtotal: ordersTable.subtotal,
        discountAmount: ordersTable.discountAmount,
        deliveryFee: ordersTable.deliveryFee,
        taxAmount: ordersTable.taxAmount,
        taxRate: ordersTable.taxRate,
        taxName: ordersTable.taxName,
        pointsUsed: ordersTable.pointsUsed,
        pointsMonetaryValue: ordersTable.pointsMonetaryValue,
        total: ordersTable.total,
        currency: ordersTable.currency,
        status: ordersTable.status,
        orderMode: ordersTable.orderMode,
        paymentMethod: ordersTable.paymentMethod,
        promoCode: ordersTable.promoCode,
        customerName: ordersTable.customerName,
        customerPhone: ordersTable.customerPhone,
        deliveryAddress: ordersTable.deliveryAddress,
        notes: ordersTable.notes,
        estimatedMinutes: ordersTable.estimatedMinutes,
        customerInvoiceRef: ordersTable.customerInvoiceRef,
        createdAt: ordersTable.createdAt,
        updatedAt: ordersTable.updatedAt,
      })
      .from(ordersTable)
      .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt))
      .limit(50);

    res.json({ orders });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch orders");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch orders" });
  }
});

// GET /orders/:orderNumber — single order detail
router.get("/orders/:orderNumber", optionalAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const [row] = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        restaurantId: ordersTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
        items: ordersTable.items,
        subtotal: ordersTable.subtotal,
        discountAmount: ordersTable.discountAmount,
        deliveryFee: ordersTable.deliveryFee,
        taxAmount: ordersTable.taxAmount,
        taxRate: ordersTable.taxRate,
        taxName: ordersTable.taxName,
        pointsUsed: ordersTable.pointsUsed,
        pointsMonetaryValue: ordersTable.pointsMonetaryValue,
        total: ordersTable.total,
        currency: ordersTable.currency,
        status: ordersTable.status,
        orderMode: ordersTable.orderMode,
        paymentMethod: ordersTable.paymentMethod,
        promoCode: ordersTable.promoCode,
        customerName: ordersTable.customerName,
        customerPhone: ordersTable.customerPhone,
        deliveryAddress: ordersTable.deliveryAddress,
        notes: ordersTable.notes,
        estimatedMinutes: ordersTable.estimatedMinutes,
        customerInvoiceRef: ordersTable.customerInvoiceRef,
        createdAt: ordersTable.createdAt,
        updatedAt: ordersTable.updatedAt,
      })
      .from(ordersTable)
      .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!row) {
      return res.status(404).json({ error: "not_found", message: "Order not found" });
    }

    res.json({ order: row });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch order");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch order" });
  }
});

// FIX 9: PATCH /orders/:orderNumber/status — restaurant owner or admin transitions order status
router.patch("/orders/:orderNumber/status", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, reason } = req.body;
    const userId = req.auth!.userId;

    if (!status) {
      return res.status(400).json({ error: "bad_request", message: "status is required" });
    }

    // Verify caller is the restaurant owner or order owner (for cancellations).
    // Also fetch pointsUsed so we can refund them if the order is cancelled.
    const [order] = await db
      .select({
        id:          ordersTable.id,
        userId:      ordersTable.userId,
        restaurantId: ordersTable.restaurantId,
        status:      ordersTable.status,
        pointsUsed:  ordersTable.pointsUsed,
      })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "not_found", message: "Order not found" });
    }

    const isOrderOwner = order.userId === userId;
    let isRestaurantOwner = false;

    if (order.restaurantId) {
      const [restaurant] = await db.select({ ownerId: restaurantsTable.ownerId })
        .from(restaurantsTable).where(eq(restaurantsTable.id, order.restaurantId)).limit(1);
      isRestaurantOwner = restaurant?.ownerId === userId;
    }

    // Only restaurant owners can confirm/prepare/dispatch; order owners can only cancel
    if (status === "cancelled" && !isOrderOwner && !isRestaurantOwner) {
      return res.status(403).json({ error: "forbidden", message: "You can only cancel your own orders" });
    }
    if (status !== "cancelled" && !isRestaurantOwner) {
      return res.status(403).json({ error: "forbidden", message: "Only the restaurant owner can update order status" });
    }

    const updated = await transitionOrderStatus(orderNumber, status, { reason, actorId: userId });

    // Refund any points that were redeemed for this order.
    // Runs only once per cancellation because a second PATCH to "cancelled" would throw
    // a 422 invalid-transition before reaching here.
    if (status === "cancelled" && order.pointsUsed && order.pointsUsed > 0 && order.userId) {
      const pointsToRefund = order.pointsUsed;
      const monetary = Math.round((pointsToRefund / POINTS_PER_SAR) * 100) / 100;

      awardPoints(order.userId, pointsToRefund)
        .then(() =>
          logPointsTransaction(
            order.userId!,
            "admin_grant",
            pointsToRefund,
            order.id,
            "order",
            `Refund of ${pointsToRefund} pts (${monetary} SAR) for cancelled order ${orderNumber}`,
          ),
        )
        .catch((err) =>
          req.log.warn({ err, orderId: order.id }, "Points refund failed for cancelled order — manual reconciliation needed"),
        );
    }

    res.json({ order: updated });
  } catch (err: any) {
    if (err.statusCode === 404) return res.status(404).json({ error: "not_found", message: err.message });
    if (err.statusCode === 422) {
      return res.status(422).json({
        error: "invalid_transition",
        message: err.message,
        currentStatus: err.currentStatus,
        allowed: err.allowed,
      });
    }
    req.log.error({ err }, "Failed to update order status");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /orders/:orderNumber/invoice — retrieve the customer invoice for an order
router.get("/orders/:orderNumber/invoice", optionalAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const [order] = await db
      .select({ id: ordersTable.id, customerInvoiceRef: ordersTable.customerInvoiceRef, userId: ordersTable.userId })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "not_found", message: "Order not found" });
    }
    if (!order.customerInvoiceRef) {
      return res.status(404).json({ error: "not_found", message: "No invoice generated for this order yet" });
    }

    const invoice = await invoiceService.getByRef(order.customerInvoiceRef);
    if (!invoice) {
      return res.status(404).json({ error: "not_found", message: "Invoice not found" });
    }

    res.json({ invoice });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch order invoice");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch invoice" });
  }
});

// GET /me/invoices — all customer invoices for the authenticated user
router.get("/me/invoices", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const invoices = await invoiceService.getForUser(userId);
    res.json({ invoices });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user invoices");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch invoices" });
  }
});

// FIX 7: POST /me/points/redeem — redeem points as a standalone credit (before checkout)
router.post("/me/points/redeem", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { points } = req.body;

    if (!points || Number(points) <= 0) {
      return res.status(400).json({ error: "bad_request", message: "points must be a positive number" });
    }

    const pointsToRedeem = Math.floor(Number(points));

    const [user] = await db
      .select({ id: usersTable.id, points: usersTable.points })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    if (user.points < pointsToRedeem) {
      return res.status(400).json({
        error: "insufficient_points",
        message: `You have ${user.points} points but tried to redeem ${pointsToRedeem}`,
        available: user.points,
      });
    }

    const monetaryValue = Math.round((pointsToRedeem / POINTS_PER_SAR) * 100) / 100;

    // Atomic deduction
    const [updated] = await db
      .update(usersTable)
      .set({
        points: sql`${usersTable.points} - ${pointsToRedeem}`,
        updatedAt: new Date(),
      })
      .where(sql`${usersTable.id} = ${userId} AND ${usersTable.points} >= ${pointsToRedeem}`)
      .returning({ points: usersTable.points });

    if (!updated) {
      return res.status(409).json({ error: "conflict", message: "Points balance changed — please retry" });
    }

    await logPointsTransaction(
      userId, "redemption", -pointsToRedeem, undefined, undefined,
      `Redeemed ${pointsToRedeem} pts = ${monetaryValue} SAR credit`,
    ).catch(() => {});

    notifyAsync({
      userId,
      type: "points_redeemed",
      titleEn: "Points Redeemed",
      titleAr: "تم استرداد النقاط",
      bodyEn: `You redeemed ${pointsToRedeem} points for ${monetaryValue} SAR.`,
      bodyAr: `استرددت ${pointsToRedeem} نقطة بقيمة ${monetaryValue} ريال.`,
    });

    res.json({
      redeemed: pointsToRedeem,
      monetaryValue,
      currency: "SAR",
      remainingPoints: updated.points,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to redeem points");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
