import {
  pgTable, serial, text, integer, boolean, timestamp,
  doublePrecision, pgEnum, numeric, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable } from "./countries";
import { usersTable } from "./users";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const experienceCategoryEnum = pgEnum("experience_category", [
  "heritage", "street_food", "fine_dining", "live_show", "cultural"
]);

export const experienceStatusEnum = pgEnum("experience_status", [
  "draft", "pending_approval", "active", "suspended"
]);

export const experienceBookingStatusEnum = pgEnum("experience_booking_status", [
  "pending", "confirmed", "cancelled", "completed", "no_show"
]);

export const experiencePaymentTypeEnum = pgEnum("experience_payment_type", [
  "deposit", "full"
]);

export const experiencePaymentStatusEnum = pgEnum("experience_payment_status", [
  "pending", "completed", "failed", "refunded"
]);

export const giftCardDesignEnum = pgEnum("gift_card_design", [
  "classic", "birthday", "anniversary", "celebration", "ramadan"
]);

export const giftStatusEnum = pgEnum("gift_status", [
  "sent", "redeemed", "expired"
]);

export const providerApplicationStatusEnum = pgEnum("provider_application_status", [
  "pending", "approved", "rejected"
]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "pending", "settled", "waived"
]);

// ─── Experience Providers (from Task #3 — provider dashboard table) ───────────

export const experienceProvidersTable = pgTable("experience_providers", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  userId: integer("user_id").references(() => usersTable.id),
  businessNameEn: text("business_name_en").notNull(),
  businessNameAr: text("business_name_ar"),
  businessType: text("business_type"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  city: text("city"),
  status: text("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewNotes: text("review_notes"),
  extraData: jsonb("extra_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Core Experiences ─────────────────────────────────────────────────────────

export const experiencesTable = pgTable("experiences", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  slug: text("slug"),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  category: text("category"),
  hostUserId: integer("host_user_id").references(() => usersTable.id),
  providerId: integer("provider_id").references(() => experienceProvidersTable.id),
  highlights: text("highlights").array(),
  tags: text("tags").array(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  address: text("address"),
  city: text("city"),
  cityId: integer("city_id").references(() => citiesTable.id),
  durationMinutes: integer("duration_minutes"),
  pricePerPerson: numeric("price_per_person", { precision: 10, scale: 2 }),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("SAR").notNull(),
  capacity: integer("capacity"),
  menuDetailsEn: text("menu_details_en"),
  menuDetailsAr: text("menu_details_ar"),
  rulesEn: text("rules_en"),
  rulesAr: text("rules_ar"),
  primaryImageUrl: text("primary_image_url"),
  galleryUrls: text("gallery_urls").array(),
  avgRating: doublePrecision("avg_rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  totalBookings: integer("total_bookings").default(0).notNull(),
  totalReviews: integer("total_reviews").default(0).notNull(),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Experience Images ────────────────────────────────────────────────────────

export const experienceImagesTable = pgTable("experience_images", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ─── Experience Slots ─────────────────────────────────────────────────────────

export const experienceSlotsTable = pgTable("experience_slots", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  capacity: integer("capacity"),
  remainingCapacity: integer("remaining_capacity"),
  capacityOverride: integer("capacity_override"),
  isActive: boolean("is_active").default(true).notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringDay: integer("recurring_day"),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  bookedCount: integer("booked_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Experience Bookings ──────────────────────────────────────────────────────

export const experienceBookingsTable = pgTable("experience_bookings", {
  id: serial("id").primaryKey(),
  referenceCode: text("reference_code").unique(),
  refCode: text("ref_code").unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  slotId: integer("slot_id").references(() => experienceSlotsTable.id),
  guestCount: integer("guest_count").default(1).notNull(),
  status: text("status").default("pending").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: numeric("deposit_paid", { precision: 10, scale: 2 }),
  isDepositPaid: boolean("is_deposit_paid").default(false).notNull(),
  isFullPaid: boolean("is_full_paid").default(false).notNull(),
  specialRequests: text("special_requests"),
  guestName: text("guest_name"),
  guestPhone: text("guest_phone"),
  guestEmail: text("guest_email"),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Experience Booking Payments ──────────────────────────────────────────────

export const experienceBookingPaymentsTable = pgTable("experience_booking_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => experienceBookingsTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: experiencePaymentTypeEnum("type").notNull(),
  status: experiencePaymentStatusEnum("status").default("pending").notNull(),
  paymentRef: text("payment_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Experience Reviews ───────────────────────────────────────────────────────

export const experienceReviewsTable = pgTable("experience_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  bookingId: integer("booking_id").references(() => experienceBookingsTable.id),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  ratingFood: numeric("rating_food", { precision: 3, scale: 2 }),
  ratingHospitality: numeric("rating_hospitality", { precision: 3, scale: 2 }),
  ratingAmbiance: numeric("rating_ambiance", { precision: 3, scale: 2 }),
  ratingValue: numeric("rating_value", { precision: 3, scale: 2 }),
  ratingOverall: numeric("rating_overall", { precision: 3, scale: 2 }),
  textEn: text("text_en"),
  textAr: text("text_ar"),
  providerResponseEn: text("provider_response_en"),
  providerResponseAr: text("provider_response_ar"),
  respondedAt: timestamp("responded_at"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Experience Review Photos ─────────────────────────────────────────────────

export const experienceReviewPhotosTable = pgTable("experience_review_photos", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => experienceReviewsTable.id),
  photoUrl: text("photo_url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

// ─── Experience Gifts ─────────────────────────────────────────────────────────

export const experienceGiftsTable = pgTable("experience_gifts", {
  id: serial("id").primaryKey(),
  senderUserId: integer("sender_user_id").notNull().references(() => usersTable.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  personalMessage: text("personal_message"),
  giftCardDesign: giftCardDesignEnum("gift_card_design").default("classic").notNull(),
  redeemCode: text("redeem_code").notNull().unique(),
  qrCodeUrl: text("qr_code_url"),
  status: giftStatusEnum("status").default("sent").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  redeemedAt: timestamp("redeemed_at"),
  redeemedByUserId: integer("redeemed_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Provider Applications ────────────────────────────────────────────────────

export const providerApplicationsTable = pgTable("provider_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  businessNameEn: text("business_name_en").notNull(),
  businessNameAr: text("business_name_ar").notNull(),
  businessType: text("business_type").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  status: providerApplicationStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByAdminId: integer("reviewed_by_admin_id").references(() => usersTable.id),
});

// ─── Providers ────────────────────────────────────────────────────────────────

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  applicationId: integer("application_id").references(() => providerApplicationsTable.id),
  businessNameEn: text("business_name_en").notNull(),
  businessNameAr: text("business_name_ar").notNull(),
  businessType: text("business_type").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Experience Settings ──────────────────────────────────────────────────────

export const experienceSettingsTable = pgTable("experience_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ─── Experience Commissions ───────────────────────────────────────────────────

export const experienceCommissionsTable = pgTable("experience_commissions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => experienceBookingsTable.id).unique(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: commissionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Zod Insert Schemas ───────────────────────────────────────────────────────

export const insertExperienceProviderSchema = createInsertSchema(experienceProvidersTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertExperienceSchema = createInsertSchema(experiencesTable).omit({
  id: true, refCode: true, createdAt: true, updatedAt: true, avgRating: true, reviewCount: true, totalBookings: true, totalReviews: true,
});
export const insertExperienceImageSchema = createInsertSchema(experienceImagesTable).omit({ id: true });
export const insertExperienceSlotSchema = createInsertSchema(experienceSlotsTable).omit({ id: true, createdAt: true, bookedCount: true });
export const insertExperienceBookingSchema = createInsertSchema(experienceBookingsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertExperienceBookingPaymentSchema = createInsertSchema(experienceBookingPaymentsTable).omit({
  id: true, createdAt: true,
});
export const insertExperienceReviewSchema = createInsertSchema(experienceReviewsTable).omit({
  id: true, createdAt: true, isVerified: true, rating: true,
});
export const insertExperienceReviewPhotoSchema = createInsertSchema(experienceReviewPhotosTable).omit({ id: true });
export const insertExperienceGiftSchema = createInsertSchema(experienceGiftsTable).omit({
  id: true, createdAt: true, redeemCode: true, qrCodeUrl: true, redeemedAt: true, redeemedByUserId: true,
});
export const insertProviderApplicationSchema = createInsertSchema(providerApplicationsTable).omit({
  id: true, status: true, adminNotes: true, submittedAt: true, reviewedAt: true, reviewedByAdminId: true,
});
export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true });

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type ExperienceProvider = typeof experienceProvidersTable.$inferSelect;
export type InsertExperienceProvider = z.infer<typeof insertExperienceProviderSchema>;
export type Experience = typeof experiencesTable.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type ExperienceImage = typeof experienceImagesTable.$inferSelect;
export type InsertExperienceImage = z.infer<typeof insertExperienceImageSchema>;
export type ExperienceSlot = typeof experienceSlotsTable.$inferSelect;
export type InsertExperienceSlot = z.infer<typeof insertExperienceSlotSchema>;
export type ExperienceBooking = typeof experienceBookingsTable.$inferSelect;
export type InsertExperienceBooking = z.infer<typeof insertExperienceBookingSchema>;
export type ExperienceBookingPayment = typeof experienceBookingPaymentsTable.$inferSelect;
export type InsertExperienceBookingPayment = z.infer<typeof insertExperienceBookingPaymentSchema>;
export type ExperienceReview = typeof experienceReviewsTable.$inferSelect;
export type InsertExperienceReview = z.infer<typeof insertExperienceReviewSchema>;
export type ExperienceReviewPhoto = typeof experienceReviewPhotosTable.$inferSelect;
export type ExperienceGift = typeof experienceGiftsTable.$inferSelect;
export type InsertExperienceGift = z.infer<typeof insertExperienceGiftSchema>;
export type ProviderApplication = typeof providerApplicationsTable.$inferSelect;
export type InsertProviderApplication = z.infer<typeof insertProviderApplicationSchema>;
export type Provider = typeof providersTable.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type ExperienceSetting = typeof experienceSettingsTable.$inferSelect;
export type ExperienceCommission = typeof experienceCommissionsTable.$inferSelect;
