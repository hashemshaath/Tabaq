import { pgTable, serial, integer, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";
import { dishesTable } from "./menus";

// ── User Check-ins (Visited Places) ──────────────────────────────────────────
export const userCheckInsTable = pgTable("user_check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  visitDate: text("visit_date").notNull(), // "2026-03-25"
  visitTime: text("visit_time"), // "20:00"
  partySize: integer("party_size").default(1),
  notes: text("notes"),
  companionNames: text("companion_names"), // comma-separated names
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCheckInSchema = createInsertSchema(userCheckInsTable).omit({ id: true, createdAt: true });
export type CheckIn = typeof userCheckInsTable.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

// ── Visit Plans (Future Experiences) ─────────────────────────────────────────
export const visitPlansTable = pgTable("visit_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  title: text("title").notNull(),
  plannedDate: text("planned_date"), // "2026-05-10"
  notes: text("notes"),
  priority: text("priority").default("medium").notNull(), // "low"|"medium"|"high"
  status: text("status").default("active").notNull(), // "active"|"completed"|"cancelled"
  themeLabel: text("theme_label"), // e.g. "Dessert Week", "Date Night"
  reminderEnabled: boolean("reminder_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVisitPlanSchema = createInsertSchema(visitPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type VisitPlan = typeof visitPlansTable.$inferSelect;
export type InsertVisitPlan = z.infer<typeof insertVisitPlanSchema>;

// ── User Recommendations ──────────────────────────────────────────────────────
export const userRecommendationsTable = pgTable("user_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  dishId: integer("dish_id").references(() => dishesTable.id),
  noteEn: text("note_en"),
  noteAr: text("note_ar"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserRecommendationSchema = createInsertSchema(userRecommendationsTable).omit({ id: true, createdAt: true });
export type UserRecommendation = typeof userRecommendationsTable.$inferSelect;
export type InsertUserRecommendation = z.infer<typeof insertUserRecommendationSchema>;

// ── Saved Dishes (Favourite Dishes) ──────────────────────────────────────────
export const savedDishesTable = pgTable("saved_dishes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  dishId: integer("dish_id").notNull().references(() => dishesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("saved_dishes_unique").on(t.userId, t.dishId),
]);

export const insertSavedDishSchema = createInsertSchema(savedDishesTable).omit({ id: true, createdAt: true });
export type SavedDish = typeof savedDishesTable.$inferSelect;
export type InsertSavedDish = z.infer<typeof insertSavedDishSchema>;

// ── Per-content Privacy Settings ─────────────────────────────────────────────
// Visibility values: 'public' | 'followers' | 'only_me'
export const contentPrivacyTable = pgTable("content_privacy", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  contentType: text("content_type").notNull(), // 'visits'|'reviews'|'favorites'|'activity'|'plans'|'recommendations'
  visibility: text("visibility").default("public").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("content_privacy_unique").on(t.userId, t.contentType),
]);

export const insertContentPrivacySchema = createInsertSchema(contentPrivacyTable).omit({ id: true });
export type ContentPrivacy = typeof contentPrivacyTable.$inferSelect;
export type InsertContentPrivacy = z.infer<typeof insertContentPrivacySchema>;
