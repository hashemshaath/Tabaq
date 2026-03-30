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
  points: integer("points").default(0).notNull(),
  credibilityScore: numeric("credibility_score", { precision: 5, scale: 2 }).default("0").notNull(),
  level: integer("level").default(1).notNull(),
  levelTitle: text("level_title").default("Food Explorer").notNull(),
  referralCode: text("referral_code").unique(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  cityId: integer("city_id").references(() => citiesTable.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isOwner: boolean("is_owner").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => usersTable.id),
  followingId: integer("following_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_follows_unique").on(t.followerId, t.followingId),
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

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, refCode: true, createdAt: true, updatedAt: true });
export const insertUserFollowSchema = createInsertSchema(userFollowsTable).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type UserFollow = typeof userFollowsTable.$inferSelect;
export type OtpRequest = typeof otpRequestsTable.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokensTable.$inferSelect;
