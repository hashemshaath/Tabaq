import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable } from "@workspace/db/schema";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

function generateOrderNumber(): string {
  return `TBQ-${Math.floor(Math.random() * 900000 + 100000)}`;
}

router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      subtotal,
      deliveryFee,
      total,
      currency,
      orderMode,
      paymentMethod,
      customerName,
      customerPhone,
      deliveryAddress,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "bad_request", message: "Items are required" });
    }
    if (!subtotal || !total) {
      return res.status(400).json({ error: "bad_request", message: "subtotal and total are required" });
    }

    const etaMinutes = orderMode === "delivery" ? 35 : orderMode === "pickup" ? 20 : 15;

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber: generateOrderNumber(),
        userId: req.auth?.userId ?? null,
        restaurantId: restaurantId ?? items[0]?.restaurantId ?? null,
        items,
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee ?? 0),
        total: String(total),
        currency: currency ?? "SAR",
        status: "placed",
        orderMode: orderMode ?? "delivery",
        paymentMethod: paymentMethod ?? "card",
        customerName: customerName ?? null,
        customerPhone: customerPhone ?? null,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        estimatedMinutes: etaMinutes,
      })
      .returning();

    res.status(201).json({ order });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "internal_error", message: "Failed to create order" });
  }
});

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
        deliveryFee: ordersTable.deliveryFee,
        total: ordersTable.total,
        currency: ordersTable.currency,
        status: ordersTable.status,
        orderMode: ordersTable.orderMode,
        paymentMethod: ordersTable.paymentMethod,
        customerName: ordersTable.customerName,
        customerPhone: ordersTable.customerPhone,
        deliveryAddress: ordersTable.deliveryAddress,
        notes: ordersTable.notes,
        estimatedMinutes: ordersTable.estimatedMinutes,
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
        deliveryFee: ordersTable.deliveryFee,
        total: ordersTable.total,
        currency: ordersTable.currency,
        status: ordersTable.status,
        orderMode: ordersTable.orderMode,
        paymentMethod: ordersTable.paymentMethod,
        customerName: ordersTable.customerName,
        customerPhone: ordersTable.customerPhone,
        deliveryAddress: ordersTable.deliveryAddress,
        notes: ordersTable.notes,
        estimatedMinutes: ordersTable.estimatedMinutes,
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

export default router;
