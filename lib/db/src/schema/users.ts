import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable } from "./countries";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(), // e.g. TBQ-USR-2026-000001
  phone: text("phone").unique(),
  email: text("email").unique(),
  username: text("username").unique(),
  nameEn: text("name_en"),
  nameAr: text("name_ar"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  points: integer("points").default(0).notNull(),
  credibilityScore: numeric("credibility_score", { precision: 5, scale: 2 }).default("0").notNull(),
  level: integer("level").default(1).notNull(),
  levelTitle: text("level_title").default("Food Explorer").notNull(),
  referralCode: text("referral_code").unique(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  cityId: integer("city_id").references(() => citiesTable.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isOwner: boolean("is_owner").default(false).notNull(),
  coverPhotoUrl: text("cover_photo_url"),
  location: text("location"),
  instagramUrl: text("instagram_url"),
  xUrl: text("x_url"),
  tiktokUrl: text("tiktok_url"),
  snapchatUrl: text("snapchat_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => usersTable.id),
  followingId: integer("following_id").notNull().references(() => usersTable.id),
  status: text("status").default("accepted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_follows_unique").on(t.followerId, t.followingId),
]);

export const userBlocksTable = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => usersTable.id),
  blockedId: integer("blocked_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_blocks_unique").on(t.blockerId, t.blockedId),
]);

export const otpRequestsTable = pgTable("otp_requests", {
  id: serial("id").primaryKey(),
  phone: text("phone"),
  email: text("email"),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerificationTokensTable = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification preferences per user per type
// notifType: 'booking_confirmed' | 'booking_cancelled' | 'new_follower' | 'new_review' | 'new_offer' | 'new_dish' | 'new_opening' | 'order_status' | 'points_earned'
// channels: 'in_app' | 'email' | 'sms' | 'push'
export const userNotificationPrefsTable = pgTable("user_notification_prefs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  notifType: text("notif_type").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  channels: text("channels").default("in_app").notNull(), // comma-separated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_notif_prefs_unique").on(t.userId, t.notifType),
]);

// User interests for personalization
// interestType: 'cuisine' | 'dish_type' | 'event' | 'opening' | 'offer'
export const userInterestsTable = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  interestType: text("interest_type").notNull(),
  value: text("value").notNull(), // e.g. 'italian', 'desserts', 'grills', 'events'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_interests_unique").on(t.userId, t.interestType, t.value),
]);

// Mute users or restaurants
export const userMutesTable = pgTable("user_mutes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  entityType: text("entity_type").notNull(), // 'user' | 'restaurant'
  entityId: integer("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_mutes_unique").on(t.userId, t.entityType, t.entityId),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, refCode: true, createdAt: true, updatedAt: true });
export const insertUserFollowSchema = createInsertSchema(userFollowsTable).omit({ id: true, createdAt: true });
export const insertUserBlockSchema = createInsertSchema(userBlocksTable).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type UserFollow = typeof userFollowsTable.$inferSelect;
export type UserBlock = typeof userBlocksTable.$inferSelect;
export type OtpRequest = typeof otpRequestsTable.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokensTable.$inferSelect;
export type UserNotificationPref = typeof userNotificationPrefsTable.$inferSelect;
export type UserInterest = typeof userInterestsTable.$inferSelect;
export type UserMute = typeof userMutesTable.$inferSelect;
