import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable } from "@workspace/db/schema";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { eq, desc } from "drizzle-orm";
import { invoiceService } from "../services/invoiceService.js";

const router = Router();

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
      total,
      currency,
      orderMode,
      paymentMethod,
      promoCode,
      customerName,
      customerPhone,
      deliveryAddress,
      notes,
      idempotencyKey,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "bad_request", message: "Items are required" });
    }
    if (!subtotal || !total) {
      return res.status(400).json({ error: "bad_request", message: "subtotal and total are required" });
    }

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

    const etaMinutes = orderMode === "delivery" ? 35 : orderMode === "pickup" ? 20 : 15;

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber: generateOrderNumber(),
        idempotencyKey: idempotencyKey ?? null,
        userId: req.auth?.userId ?? null,
        restaurantId: restaurantId ?? items[0]?.restaurantId ?? null,
        items,
        subtotal: String(subtotal),
        discountAmount: String(discountAmount ?? 0),
        deliveryFee: String(deliveryFee ?? 0),
        total: String(total),
        currency: currency ?? "SAR",
        status: "placed",
        orderMode: orderMode ?? "delivery",
        paymentMethod: paymentMethod ?? "card",
        promoCode: promoCode ?? null,
        customerName: customerName ?? null,
        customerPhone: customerPhone ?? null,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        estimatedMinutes: etaMinutes,
      })
      .returning();

    // Create customer invoice, log financial transaction, award loyalty points
    let invoiceRef: string | null = null;
    try {
      const result = await invoiceService.processOrder({
        orderId: order!.id,
        userId: req.auth?.userId ?? null,
        restaurantId: restaurantId ?? items[0]?.restaurantId ?? null,
        items: items.map((i: any) => ({
          nameEn: i.nameEn ?? "Item",
          nameAr: i.nameAr ?? "عنصر",
          qty: i.qty ?? 1,
          price: i.price ?? 0,
        })),
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount ?? 0),
        deliveryFee: Number(deliveryFee ?? 0),
        total: Number(total),
        currency: currency ?? "SAR",
        paymentMethod: paymentMethod ?? "card",
        promoCode: promoCode ?? null,
      });
      invoiceRef = result.invoiceRef;

      // Persist invoice ref on the order
      await db
        .update(ordersTable)
        .set({ customerInvoiceRef: invoiceRef })
        .where(eq(ordersTable.id, order!.id));
    } catch (invoiceErr) {
      // Non-critical: log but don't fail the order
      req.log.warn({ invoiceErr }, "Invoice/points processing failed for order");
    }

    res.status(201).json({ order: { ...order, customerInvoiceRef: invoiceRef } });
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

export default router;
