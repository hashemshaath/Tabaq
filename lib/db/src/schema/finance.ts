import {
  pgTable, serial, integer, text, timestamp, boolean, numeric, pgEnum, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";
import { offersTable, vouchersTable } from "./offers";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const contractStatusEnum = pgEnum("contract_status", [
  "draft", "active", "suspended", "terminated"
]);

export const paymentModelEnum = pgEnum("payment_model", [
  "full_collection",    // Tabaq collects full amount from user, settles with restaurant
  "partial_collection", // Tabaq collects partial amount upfront, rest paid directly to restaurant
  "direct_payment",     // User pays restaurant directly, Tabaq invoices commission separately
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "voucher_sale", "voucher_refund", "commission_charge",
  "settlement_payout", "adjustment", "platform_fee", "order",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending", "completed", "failed", "refunded", "disputed"
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "sent", "paid", "overdue", "disputed", "void"
]);

// ─── Contracts ────────────────────────────────────────────────────────────────
// Defines the commission agreement between Tabaq and each restaurant.

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").notNull().unique(), // e.g. TBQ-CTR-2026-000001

  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  status: contractStatusEnum("status").default("draft").notNull(),

  // Commission model
  paymentModel: paymentModelEnum("payment_model").default("full_collection").notNull(),
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }).default("15.00").notNull(),

  // For partial_collection: percentage Tabaq collects upfront from the user's payment
  partialCollectionPercent: numeric("partial_collection_percent", { precision: 5, scale: 2 }),

  // Settlement timing
  settlementDays: integer("settlement_days").default(7).notNull(), // days after transaction to pay restaurant

  // Contract validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Admin notes
  notes: text("notes"),
  internalNotes: text("internal_notes"), // admin-only

  // Approval trail
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Transactions ─────────────────────────────────────────────────────────────
// Full financial ledger: every monetary event is recorded here.

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").notNull().unique(), // e.g. TBQ-TXN-2026-000001

  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),

  // Amounts
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),     // what user paid
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),    // % taken by Tabaq
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),     // SAR taken by Tabaq
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),         // what restaurant receives
  currency: text("currency").default("SAR").notNull(),

  // Parties
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  userId: integer("user_id").references(() => usersTable.id), // customer who paid

  // Linked entities
  contractId: integer("contract_id").references(() => contractsTable.id),
  voucherId: integer("voucher_id").references(() => vouchersTable.id),
  offerId: integer("offer_id").references(() => offersTable.id),
  invoiceId: integer("invoice_id"), // populated when included in an invoice

  // Settlement
  paymentModel: paymentModelEnum("payment_model"),
  settlementDueDate: timestamp("settlement_due_date"),
  settledAt: timestamp("settled_at"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
// Periodic settlement statements sent to restaurant partners.

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").notNull().unique(), // e.g. TBQ-INV-2026-000001

  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  contractId: integer("contract_id").references(() => contractsTable.id),
  status: invoiceStatusEnum("status").default("draft").notNull(),

  // Period covered
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Aggregated financials
  totalGrossAmount: numeric("total_gross_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCommissionAmount: numeric("total_commission_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  totalNetAmount: numeric("total_net_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("SAR").notNull(),
  totalTransactions: integer("total_transactions").default(0).notNull(),

  // Payment
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Customer Invoices ─────────────────────────────────────────────────────────
// User-facing receipts generated for every paid transaction (orders, bookings, etc.)

export const customerInvoiceStatusEnum = pgEnum("customer_invoice_status", [
  "paid", "refunded", "void"
]);

export const customerInvoiceSourceEnum = pgEnum("customer_invoice_source", [
  "order", "booking", "voucher_purchase", "experience_booking", "membership"
]);

export const customerInvoicesTable = pgTable("customer_invoices", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").notNull().unique(), // TBQ-CINV-2026-000001

  userId: integer("user_id").references(() => usersTable.id),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),

  source: customerInvoiceSourceEnum("source").notNull(),
  orderId: integer("order_id"),
  bookingId: integer("booking_id"),

  lineItems: jsonb("line_items").$type<Array<{
    description: string;
    descriptionAr: string;
    qty: number;
    unitPrice: number;
    total: number;
  }>>().notNull().default([]),

  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  taxRate: numeric("tax_rate", { precision: 6, scale: 4 }).default("0"),
  taxName: text("tax_name").default("VAT"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),

  paymentMethod: text("payment_method"),
  promoCode: text("promo_code"),

  // Points redemption breakdown — populated when payment_method is 'points' or 'hybrid'
  pointsUsed: integer("points_used").default(0),
  pointsMonetaryValue: numeric("points_monetary_value", { precision: 12, scale: 2 }).default("0"),
  // Actual amount sent to the payment gateway (total minus points credit; 0 for points-only orders)
  remainingAmountCharged: numeric("remaining_amount_charged", { precision: 12, scale: 2 }).default("0"),

  // Raw response from the payment gateway (HyperPay, Stripe, etc.) at time of charge.
  // Stored verbatim for audit, reconciliation, and dispute evidence.
  gatewayResponse: jsonb("gateway_response").$type<Record<string, unknown>>(),

  status: customerInvoiceStatusEnum("status").default("paid").notNull(),
  paidAt: timestamp("paid_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Admin Messages ────────────────────────────────────────────────────────────
// Communication from Tabaq admin to restaurant owners (offer feedback, compliance, etc.)

export const adminMessagesTable = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").notNull().unique(), // e.g. TBQ-MSG-2026-000001

  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  adminUserId: integer("admin_user_id").references(() => usersTable.id),

  subject: text("subject").notNull(),
  body: text("body").notNull(),

  // Message category
  type: text("type").default("general").notNull(), // general | offer_feedback | contract | compliance | invoice

  // Optional related entities
  relatedOfferId: integer("related_offer_id").references(() => offersTable.id),
  relatedContractId: integer("related_contract_id").references(() => contractsTable.id),
  relatedInvoiceId: integer("related_invoice_id").references(() => invoicesTable.id),

  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const insertContractSchema = createInsertSchema(contractsTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true, approvedAt: true
});
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true, refCode: true, createdAt: true
});
export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true, paidAt: true
});
export const insertAdminMessageSchema = createInsertSchema(adminMessagesTable).omit({
  id: true, refCode: true, createdAt: true, readAt: true
});

export type Contract = typeof contractsTable.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type AdminMessage = typeof adminMessagesTable.$inferSelect;
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export const insertCustomerInvoiceSchema = createInsertSchema(customerInvoicesTable).omit({
  id: true, refCode: true, createdAt: true, paidAt: true
});
export type CustomerInvoice = typeof customerInvoicesTable.$inferSelect;
export type InsertCustomerInvoice = z.infer<typeof insertCustomerInvoiceSchema>;
