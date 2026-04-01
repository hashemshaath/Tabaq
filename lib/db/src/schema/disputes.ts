import {
  pgTable, serial, integer, text, timestamp, pgEnum, jsonb, numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ordersTable } from "./orders";

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open", "under_review", "resolved_refund", "resolved_no_refund", "escalated",
]);

export const disputesTable = pgTable("disputes", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  orderId: integer("order_id").references(() => ordersTable.id),
  orderNumber: text("order_number"),
  customerId: integer("customer_id").references(() => usersTable.id),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").default("open").notNull(),
  evidence: jsonb("evidence")
    .$type<Array<{ type: string; url?: string; description: string }>>()
    .default([]),
  resolutionNotes: text("resolution_notes"),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  resolvedBy: integer("resolved_by").references(() => usersTable.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true,
  resolvedAt: true, resolvedBy: true, resolutionNotes: true, refundAmount: true,
});

export type Dispute = typeof disputesTable.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
