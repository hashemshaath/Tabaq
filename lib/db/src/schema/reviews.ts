import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";
import { dishesTable } from "./menus";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  dishId: integer("dish_id").references(() => dishesTable.id),
  ratingOverall: numeric("rating_overall", { precision: 3, scale: 2 }).notNull(),
  ratingFood: numeric("rating_food", { precision: 3, scale: 2 }),
  ratingService: numeric("rating_service", { precision: 3, scale: 2 }),
  ratingAmbiance: numeric("rating_ambiance", { precision: 3, scale: 2 }),
  ratingValue: numeric("rating_value", { precision: 3, scale: 2 }),
  textEn: text("text_en"),
  textAr: text("text_ar"),
  likeCount: integer("like_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  visitDate: text("visit_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewPhotosTable = pgTable("review_photos", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviewsTable.id),
  photoUrl: text("photo_url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const reviewLikesTable = pgTable("review_likes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviewsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  isActive: boolean("is_active").default(true).notNull(),
  pointsAwarded: boolean("points_awarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewCommentsTable = pgTable("review_comments", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviewsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, likeCount: true, commentCount: true });
export const insertReviewPhotoSchema = createInsertSchema(reviewPhotosTable).omit({ id: true });
export const insertReviewLikeSchema = createInsertSchema(reviewLikesTable).omit({ id: true, createdAt: true });
export const insertReviewCommentSchema = createInsertSchema(reviewCommentsTable).omit({ id: true, createdAt: true });

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
export type InsertReviewPhoto = z.infer<typeof insertReviewPhotoSchema>;
export type ReviewPhoto = typeof reviewPhotosTable.$inferSelect;
export type InsertReviewComment = z.infer<typeof insertReviewCommentSchema>;
export type ReviewComment = typeof reviewCommentsTable.$inferSelect;
