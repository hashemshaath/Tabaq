import {
  pgTable, serial, integer, text, timestamp, pgEnum, numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const membershipStatusEnum = pgEnum("membership_status", [
  "pending", "active", "suspended", "cancelled", "expired",
]);

export const membershipPlanEnum = pgEnum("membership_plan", [
  "gourmet", "elite",
]);

export const membershipBillingEnum = pgEnum("membership_billing", [
  "monthly", "annual",
]);

export const membershipsTable = pgTable("memberships", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  plan: membershipPlanEnum("plan").notNull(),
  billing: membershipBillingEnum("billing").notNull(),
  status: membershipStatusEnum("status").default("pending").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),
  startedAt: timestamp("started_at"),
  endsAt: timestamp("ends_at"),
  renewsAt: timestamp("renews_at"),
  cancelledAt: timestamp("cancelled_at"),
  suspendedAt: timestamp("suspended_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipAuditLogTable = pgTable("membership_audit_log", {
  id: serial("id").primaryKey(),
  membershipId: integer("membership_id").notNull().references(() => membershipsTable.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  actorId: integer("actor_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMembershipSchema = createInsertSchema(membershipsTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true,
  cancelledAt: true, suspendedAt: true,
});

export type Membership = typeof membershipsTable.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type MembershipAuditLog = typeof membershipAuditLogTable.$inferSelect;
