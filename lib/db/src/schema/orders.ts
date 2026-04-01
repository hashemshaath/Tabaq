import { pgTable, serial, integer, text, timestamp, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";

export const orderStatusEnum = pgEnum("order_status", [
  "placed", "confirmed", "preparing", "out_for_delivery", "ready_for_pickup",
  "delivered", "cancelled", "completed", "disputed",
]);

export const orderModeEnum = pgEnum("order_mode", [
  "delivery", "pickup", "dine_in",
]);

export const orderPaymentEnum = pgEnum("order_payment", [
  "card", "apple_pay", "stc_pay", "cash", "points", "hybrid",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  idempotencyKey: text("idempotency_key").unique(),
  userId: integer("user_id").references(() => usersTable.id),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  items: jsonb("items").$type<Array<{
    dishId: number;
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;
    currency: string;
    imageUrl?: string;
    restaurantId: number;
    restaurantNameEn: string;
    restaurantNameAr: string;
  }>>().default([]),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  taxRate: numeric("tax_rate", { precision: 6, scale: 4 }).default("0"),
  taxName: text("tax_name").default("VAT"),
  countryCode: text("country_code").default("SA"),
  pointsUsed: integer("points_used").default(0),
  pointsMonetaryValue: numeric("points_monetary_value", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),
  status: orderStatusEnum("status").default("placed").notNull(),
  orderMode: orderModeEnum("order_mode").default("delivery").notNull(),
  paymentMethod: orderPaymentEnum("payment_method").default("card").notNull(),
  promoCode: text("promo_code"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  estimatedMinutes: integer("estimated_minutes").default(35),
  customerInvoiceRef: text("customer_invoice_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
