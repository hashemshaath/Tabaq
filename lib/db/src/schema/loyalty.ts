import { pgTable, serial, integer, text, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const pointsActionEnum = pgEnum("points_action", [
  "review_written",
  "booking_made",
  "voucher_purchased",
  "review_liked",
  "email_verified",
  "referral_signup",
  "referral_converted",
  "profile_completed",
  "admin_grant",
  "redemption",
  "order_placed",
  "order_completed",  // awarded (pending→redeemable) when order reaches COMPLETED
  "order_returned",   // deducted proportionally when return is approved
]);

export const pointsStatusEnum = pgEnum("points_status", [
  "pending",     // created at CONFIRMED; not yet counted in balance
  "redeemable",  // promoted at COMPLETED; counted in balance
  "expired",     // swept by cron (points_expiry_check)
  "cancelled",   // order cancelled before COMPLETED; no balance change
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "signed_up",
  "converted",
  "expired",
]);

export const pointsTransactionsTable = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  action: pointsActionEnum("action").notNull(),
  points: integer("points").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  refId: integer("ref_id"),
  refType: text("ref_type"),
  status: pointsStatusEnum("status").default("redeemable").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referralConversionsTable = pgTable("referral_conversions", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id),
  referredId: integer("referred_id").references(() => usersTable.id),
  referralCode: text("referral_code").notNull(),
  status: referralStatusEnum("status").default("pending").notNull(),
  pointsAwarded: boolean("points_awarded").default(false).notNull(),
  referrerPointsEarned: integer("referrer_points_earned").default(0).notNull(),
  referredPointsEarned: integer("referred_points_earned").default(0).notNull(),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactionsTable).omit({ id: true, createdAt: true });
export const insertReferralConversionSchema = createInsertSchema(referralConversionsTable).omit({ id: true, createdAt: true });

export type PointsTransaction = typeof pointsTransactionsTable.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type ReferralConversion = typeof referralConversionsTable.$inferSelect;
export type InsertReferralConversion = z.infer<typeof insertReferralConversionSchema>;
