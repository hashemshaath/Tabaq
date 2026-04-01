/**
 * Order Status State Machine
 *
 * Single function to transition order status with enforcement of allowed paths.
 * All status changes must go through transitionOrderStatus — never update directly.
 *
 * Allowed transitions:
 *   placed         → confirmed | cancelled
 *   confirmed      → preparing | cancelled
 *   preparing      → out_for_delivery | ready_for_pickup | cancelled
 *   out_for_delivery → delivered
 *   ready_for_pickup → delivered
 *   delivered      → completed | disputed
 *   completed      → disputed
 *   cancelled      → (terminal)
 *   disputed       → (terminal — resolved via dispute flow)
 */

import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { notifyAsync } from "./notify.js";
import { logger } from "./logger.js";

export type OrderStatus =
  | "placed" | "confirmed" | "preparing"
  | "out_for_delivery" | "ready_for_pickup"
  | "delivered" | "cancelled" | "completed" | "disputed";

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  placed:            ["confirmed", "cancelled"],
  confirmed:         ["preparing", "cancelled"],
  preparing:         ["out_for_delivery", "ready_for_pickup", "cancelled"],
  out_for_delivery:  ["delivered"],
  ready_for_pickup:  ["delivered"],
  delivered:         ["completed", "disputed"],
  completed:         ["disputed"],
  cancelled:         [],
  disputed:          [],
};

interface TransitionMeta {
  reason?: string;
  actorId?: number;
}

export async function transitionOrderStatus(
  orderNumber: string,
  newStatus: OrderStatus,
  meta?: TransitionMeta,
): Promise<typeof ordersTable.$inferSelect> {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    throw Object.assign(new Error(`Order '${orderNumber}' not found`), { statusCode: 404 });
  }

  const currentStatus = order.status as OrderStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition order '${orderNumber}' from '${currentStatus}' to '${newStatus}'`),
      { statusCode: 422, currentStatus, requestedStatus: newStatus, allowed },
    );
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(ordersTable.orderNumber, orderNumber))
    .returning();

  logger.info(
    { orderNumber, from: currentStatus, to: newStatus, actorId: meta?.actorId },
    `Order status transition: ${currentStatus} → ${newStatus}`,
  );

  // Side effects (non-blocking)
  const userId = order.userId;
  if (userId) {
    if (newStatus === "confirmed") {
      notifyAsync({
        userId,
        type: "order_confirmed",
        titleEn: "Order Confirmed",
        titleAr: "تم تأكيد الطلب",
        bodyEn: `Your order ${orderNumber} has been confirmed.`,
        bodyAr: `تم تأكيد طلبك ${orderNumber}.`,
        refId: order.id,
        refType: "order",
      });
    } else if (newStatus === "delivered" || newStatus === "completed") {
      notifyAsync({
        userId,
        type: "order_delivered",
        titleEn: "Order Delivered",
        titleAr: "تم توصيل الطلب",
        bodyEn: `Your order ${orderNumber} has been delivered. Enjoy!`,
        bodyAr: `تم توصيل طلبك ${orderNumber}. بالهناء والشفاء!`,
        refId: order.id,
        refType: "order",
      });
    } else if (newStatus === "cancelled") {
      notifyAsync({
        userId,
        type: "order_cancelled",
        titleEn: "Order Cancelled",
        titleAr: "تم إلغاء الطلب",
        bodyEn: `Your order ${orderNumber} has been cancelled.${meta?.reason ? " Reason: " + meta.reason : ""}`,
        bodyAr: `تم إلغاء طلبك ${orderNumber}.`,
        refId: order.id,
        refType: "order",
      });
    }
  }

  return updated!;
}
