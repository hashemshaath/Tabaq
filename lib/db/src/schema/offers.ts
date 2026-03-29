import { pgTable, serial, integer, text, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";

export const voucherStatusEnum = pgEnum("voucher_status", ["active", "used", "expired"]);

export const offerApprovalStatusEnum = pgEnum("offer_approval_status", [
  "pending",            // submitted, awaiting admin review
  "approved",           // approved and can go live
  "rejected",           // rejected, offer cannot be activated
  "revision_requested", // admin asked for changes before approving
]);

export const offerPaymentModelEnum = pgEnum("offer_payment_model", [
  "full_collection",
  "partial_collection",
  "direct_payment",
]);

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(), // e.g. TBQ-OFR-2026-000001 (set after insert)
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  imageUrl: text("image_url"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("SAR").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  totalCapacity: integer("total_capacity"),
  remainingCapacity: integer("remaining_capacity"),
  isActive: boolean("is_active").default(false).notNull(), // stays false until approved

  // Admin approval workflow
  approvalStatus: offerApprovalStatusEnum("approval_status").default("pending").notNull(),
  adminNotes: text("admin_notes"), // admin feedback to the restaurant owner
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),

  // Commission override — if null, falls back to contract default
  commissionOverridePercent: numeric("commission_override_percent", { precision: 5, scale: 2 }),

  // Payment model for this specific offer — if null, falls back to contract default
  paymentModel: offerPaymentModelEnum("payment_model"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(), // e.g. TBQ-VCH-2026-000001
  code: text("code").notNull().unique(),
  offerId: integer("offer_id").references(() => offersTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),
  status: voucherStatusEnum("status").default("active").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  giftMessage: text("gift_message"),
  isGift: boolean("is_gift").default(false).notNull(),
  gifterUserId: integer("gifter_user_id").references(() => usersTable.id),
  recipientUserId: integer("recipient_user_id").references(() => usersTable.id),
  giftRecipientPhone: text("gift_recipient_phone"),
  giftRecipientEmail: text("gift_recipient_email"),
  giftDeliveryStatus: text("gift_delivery_status").default("pending"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true,
  approvalStatus: true, adminNotes: true, approvedById: true, approvedAt: true
});
export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({
  id: true, refCode: true, createdAt: true
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
