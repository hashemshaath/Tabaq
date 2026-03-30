import { pgTable, serial, integer, text, timestamp, boolean, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "live",
  "paused",
  "ended",
  "rejected",
]);

export const campaignTypeEnum = pgEnum("campaign_type", [
  "spend_credit",
  "item_voucher",
  "discount_deal",
]);

export const redemptionMethodEnum = pgEnum("redemption_method", [
  "on_site",
  "on_demand",
  "online",
]);

export const voucherStatusEnum = pgEnum("voucher_status", [
  "issued",
  "sold",
  "active",
  "reserved",
  "redeemed",
  "partially_redeemed",
  "refunded",
  "expired",
  "voided",
  "used",
]);

export const promoCodeTypeEnum = pgEnum("promo_code_type", [
  "percent",
  "fixed",
  "free_item",
]);

export const promoCodeFundingEnum = pgEnum("promo_code_funding", [
  "tabaq",
  "merchant",
  "partner",
  "hybrid",
]);

export const offerApprovalStatusEnum = pgEnum("offer_approval_status", [
  "pending",
  "approved",
  "rejected",
  "revision_requested",
]);

export const offerPaymentModelEnum = pgEnum("offer_payment_model", [
  "full_collection",
  "partial_collection",
  "direct_payment",
]);

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),

  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  status: campaignStatusEnum("status").default("draft").notNull(),
  type: campaignTypeEnum("type").notNull(),

  // Content
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  highlightsEn: jsonb("highlights_en").$type<string[]>().default([]),
  highlightsAr: jsonb("highlights_ar").$type<string[]>().default([]),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  coverImageIndex: integer("cover_image_index").default(0),

  // Fine print
  finePrint: text("fine_print"),
  finePrintTemplateIds: jsonb("fine_print_template_ids").$type<number[]>().default([]),

  // Redemption
  redemptionMethod: redemptionMethodEnum("redemption_method").default("on_site").notNull(),
  redemptionInstructionsEn: text("redemption_instructions_en"),
  redemptionInstructionsAr: text("redemption_instructions_ar"),
  requiresReservation: boolean("requires_reservation").default(false).notNull(),
  bookingPhone: text("booking_phone"),
  bookingWhatsapp: text("booking_whatsapp"),
  bookingLink: text("booking_link"),
  onlineRedemptionUrl: text("online_redemption_url"),

  // Schedule
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Rules
  maxPerUser: integer("max_per_user"),
  isHidden: boolean("is_hidden").default(false).notNull(),

  // Business info
  businessDescriptionEn: text("business_description_en"),
  businessDescriptionAr: text("business_description_ar"),
  websiteUrl: text("website_url"),
  proofOfPricingUrls: jsonb("proof_of_pricing_urls").$type<string[]>().default([]),
  proofOfPricingNotes: text("proof_of_pricing_notes"),

  // Admin
  adminNotes: text("admin_notes"),
  rejectionReasons: jsonb("rejection_reasons").$type<string[]>().default([]),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),
  commissionOverridePercent: numeric("commission_override_percent", { precision: 5, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Campaign Options ─────────────────────────────────────────────────────────

export const campaignOptionsTable = pgTable("campaign_options", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id),

  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  type: campaignTypeEnum("type").notNull(),

  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  dealPrice: numeric("deal_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),

  // Caps
  initialCap: integer("initial_cap"),
  monthlyCap: integer("monthly_cap"),
  soldCount: integer("sold_count").default(0).notNull(),
  redeemedCount: integer("redeemed_count").default(0).notNull(),
  refundedCount: integer("refunded_count").default(0).notNull(),
  monthlySoldCount: integer("monthly_sold_count").default(0).notNull(),
  monthlyCapResetAt: timestamp("monthly_cap_reset_at"),

  // Validity
  validityDays: integer("validity_days").default(60).notNull(),
  redemptionValidityDays: integer("redemption_validity_days"),

  // Commission
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),

  // State
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Fine Print Templates ─────────────────────────────────────────────────────

export const finePrintTemplatesTable = pgTable("fine_print_templates", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  textEn: text("text_en").notNull(),
  textAr: text("text_ar").notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Legacy Offers ────────────────────────────────────────────────────────────

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
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
  isActive: boolean("is_active").default(false).notNull(),
  approvalStatus: offerApprovalStatusEnum("approval_status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),
  commissionOverridePercent: numeric("commission_override_percent", { precision: 5, scale: 2 }),
  paymentModel: offerPaymentModelEnum("payment_model"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vouchers ─────────────────────────────────────────────────────────────────

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  code: text("code").notNull().unique(),

  // Link to campaign system
  campaignId: integer("campaign_id").references(() => campaignsTable.id),
  campaignOptionId: integer("campaign_option_id").references(() => campaignOptionsTable.id),

  // Link to legacy offer system
  offerId: integer("offer_id").references(() => offersTable.id),

  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),

  // Value
  faceValue: numeric("face_value", { precision: 10, scale: 2 }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),

  // Partial redemption
  redeemedAmount: numeric("redeemed_amount", { precision: 10, scale: 2 }).default("0"),
  remainingBalance: numeric("remaining_balance", { precision: 10, scale: 2 }),

  status: voucherStatusEnum("status").default("active").notNull(),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until").notNull(),
  redemptionPeriodDays: integer("redemption_period_days"),

  // Security
  secureToken: text("secure_token"),

  // Gift fields
  giftMessage: text("gift_message"),
  isGift: boolean("is_gift").default(false).notNull(),
  gifterUserId: integer("gifter_user_id").references(() => usersTable.id),
  recipientUserId: integer("recipient_user_id").references(() => usersTable.id),
  giftRecipientPhone: text("gift_recipient_phone"),
  giftRecipientEmail: text("gift_recipient_email"),
  giftDeliveryStatus: text("gift_delivery_status").default("pending"),
  giftScheduledAt: timestamp("gift_scheduled_at"),
  giftTheme: text("gift_theme"),

  // Redemption
  redeemedAt: timestamp("redeemed_at"),

  // Finance
  promoCodeId: integer("promo_code_id"),
  promoDiscountAmount: numeric("promo_discount_amount", { precision: 10, scale: 2 }),

  // Refund
  refundRequestedAt: timestamp("refund_requested_at"),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),

  type: promoCodeTypeEnum("type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),

  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Budget controls
  maxRedemptions: integer("max_redemptions"),
  maxPerUser: integer("max_per_user").default(1).notNull(),
  maxTotalDiscount: numeric("max_total_discount", { precision: 12, scale: 2 }),

  // Usage tracking
  usedCount: integer("used_count").default(0).notNull(),
  totalDiscountGiven: numeric("total_discount_given", { precision: 12, scale: 2 }).default("0").notNull(),

  // Eligibility
  minOrderValue: numeric("min_order_value", { precision: 10, scale: 2 }),
  newUsersOnly: boolean("new_users_only").default(false).notNull(),
  firstOrderOnly: boolean("first_order_only").default(false).notNull(),
  eligibleRestaurantIds: jsonb("eligible_restaurant_ids").$type<number[]>().default([]),
  eligibleCategoryIds: jsonb("eligible_category_ids").$type<number[]>().default([]),

  // Stacking
  allowStackWithVoucher: boolean("allow_stack_with_voucher").default(false).notNull(),
  allowStackWithOtherPromo: boolean("allow_stack_with_other_promo").default(false).notNull(),

  // Funding
  fundedBy: promoCodeFundingEnum("funded_by").default("tabaq").notNull(),
  merchantFundingSplit: numeric("merchant_funding_split", { precision: 5, scale: 2 }),
  tabaqFundingSplit: numeric("tabaq_funding_split", { precision: 5, scale: 2 }),

  // Distribution
  distributionChannel: text("distribution_channel").default("public"),

  // Audit
  createdById: integer("created_by_id").references(() => usersTable.id),
  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Promo Code Redemptions ────────────────────────────────────────────────────

export const promoCodeRedemptionsTable = pgTable("promo_code_redemptions", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").notNull().references(() => promoCodesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  voucherId: integer("voucher_id").references(() => vouchersTable.id),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Redemptions ──────────────────────────────────────────────────────────────

export const redemptionsTable = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),

  voucherId: integer("voucher_id").notNull().references(() => vouchersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),

  staffUserId: integer("staff_user_id").references(() => usersTable.id),
  method: redemptionMethodEnum("method").default("on_site").notNull(),

  amountRedeemed: numeric("amount_redeemed", { precision: 10, scale: 2 }),
  notes: text("notes"),
  staffBranch: text("staff_branch"),

  // Audit
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true,
  approvedById: true, approvedAt: true, adminNotes: true, rejectionReasons: true,
});
export const insertCampaignOptionSchema = createInsertSchema(campaignOptionsTable).omit({
  id: true, createdAt: true, updatedAt: true,
  soldCount: true, redeemedCount: true, refundedCount: true, monthlySoldCount: true,
});
export const insertOfferSchema = createInsertSchema(offersTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true,
  approvalStatus: true, adminNotes: true, approvedById: true, approvedAt: true,
});
export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({
  id: true, refCode: true, createdAt: true,
});
export const insertPromoCodeSchema = createInsertSchema(promoCodesTable).omit({
  id: true, createdAt: true, updatedAt: true,
  usedCount: true, totalDiscountGiven: true,
});
export const insertRedemptionSchema = createInsertSchema(redemptionsTable).omit({
  id: true, refCode: true, createdAt: true,
});
export const insertFinePrintTemplateSchema = createInsertSchema(finePrintTemplatesTable).omit({
  id: true, createdAt: true,
});

export type Campaign = typeof campaignsTable.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignOption = typeof campaignOptionsTable.$inferSelect;
export type InsertCampaignOption = z.infer<typeof insertCampaignOptionSchema>;
export type Offer = typeof offersTable.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type PromoCode = typeof promoCodesTable.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type Redemption = typeof redemptionsTable.$inferSelect;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type FinePrintTemplate = typeof finePrintTemplatesTable.$inferSelect;
