import {
  pgTable, serial, text, integer, boolean, timestamp,
  doublePrecision, pgEnum, uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable, countriesTable } from "./countries";
import { usersTable } from "./users";
import { categoriesTable, occasionsTable } from "./categories";

export const priceTierEnum = pgEnum("price_tier", ["budget", "mid", "upscale", "fine_dining"]);

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(), // e.g. TBQ-RST-2026-000001
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  slug: text("slug").notNull().unique(),
  coverImageUrl: text("cover_image_url"),
  logoUrl: text("logo_url"),
  priceTier: priceTierEnum("price_tier").default("mid").notNull(),
  avgRating: doublePrecision("avg_rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  followerCount: integer("follower_count").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  countryId: integer("country_id").notNull().references(() => countriesTable.id),
  address: text("address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  phone: text("phone"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),
  hasParking: boolean("has_parking").default(false).notNull(),
  hasOutdoorSeating: boolean("has_outdoor_seating").default(false).notNull(),
  hasPrivateRoom: boolean("has_private_room").default(false).notNull(),
  isHalal: boolean("is_halal").default(false).notNull(),
  ownerId: integer("owner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const restaurantCategoriesTable = pgTable("restaurant_categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
});

export const restaurantOccasionsTable = pgTable("restaurant_occasions", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  occasionId: integer("occasion_id").notNull().references(() => occasionsTable.id),
});

export const restaurantFollowsTable = pgTable("restaurant_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("restaurant_follows_unique").on(t.userId, t.restaurantId),
]);

export const openingHoursTable = pgTable("opening_hours", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  openTime: text("open_time"), // "09:00"
  closeTime: text("close_time"), // "23:00"
  isClosed: boolean("is_closed").default(false).notNull(),
});

export const userSavedRestaurantsTable = pgTable("user_saved_restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: 'cascade' }),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_saved_restaurants_unique").on(t.userId, t.restaurantId),
]);

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true, refCode: true, createdAt: true, updatedAt: true, avgRating: true, reviewCount: true, followerCount: true });
export const insertOpeningHourSchema = createInsertSchema(openingHoursTable).omit({ id: true });

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
export type InsertOpeningHour = z.infer<typeof insertOpeningHourSchema>;
export type OpeningHour = typeof openingHoursTable.$inferSelect;
export type UserSavedRestaurant = typeof userSavedRestaurantsTable.$inferSelect;
