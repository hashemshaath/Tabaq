import { pgTable, serial, text, integer, boolean, numeric, pgEnum, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";
import { usersTable } from "./users";

export const menuTypeEnum = pgEnum("menu_type", ["food", "drinks", "desserts", "set_menu", "buffet"]);

export const menusTable = pgTable("menus", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  type: menuTypeEnum("type").default("food").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const menuSectionsTable = pgTable("menu_sections", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").notNull().references(() => menusTable.id),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const dishesTable = pgTable("dishes", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  menuSectionId: integer("menu_section_id").references(() => menuSectionsTable.id),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("SAR").notNull(),
  imageUrl: text("image_url"),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }).default("0").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  popularityScore: numeric("popularity_score", { precision: 10, scale: 4 }).default("0").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  isHalal: boolean("is_halal").default(false).notNull(),
  isVegetarian: boolean("is_vegetarian").default(false).notNull(),
  isVegan: boolean("is_vegan").default(false).notNull(),
  isGlutenFree: boolean("is_gluten_free").default(false).notNull(),
  isDairyFree: boolean("is_dairy_free").default(false).notNull(),
  isNutFree: boolean("is_nut_free").default(false).notNull(),
  isHealthy: boolean("is_healthy").default(false).notNull(),
  isTabaqStar: boolean("is_tabaq_star").default(false).notNull(),
  isMostOrdered: boolean("is_most_ordered").default(false).notNull(),
  allergens: jsonb("allergens").$type<string[]>().default([]),
  spiceLevel: integer("spice_level").default(0),
  prepTimeMinutes: integer("prep_time_minutes"),
  calories: integer("calories"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storyStatusEnum = pgEnum("story_status", ["pending", "approved", "rejected"]);

export const restaurantStoriesTable = pgTable("restaurant_stories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  captionEn: text("caption_en"),
  captionAr: text("caption_ar"),
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
  mediaType: text("media_type").default("photo").notNull(),
  status: storyStatusEnum("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  viewCount: integer("view_count").default(0).notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
});

export const insertMenuSchema = createInsertSchema(menusTable).omit({ id: true });
export const insertMenuSectionSchema = createInsertSchema(menuSectionsTable).omit({ id: true });
export const insertDishSchema = createInsertSchema(dishesTable).omit({ id: true });
export const insertRestaurantStorySchema = createInsertSchema(restaurantStoriesTable).omit({ id: true, createdAt: true, approvedAt: true, viewCount: true, likeCount: true });

export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menusTable.$inferSelect;
export type InsertMenuSection = z.infer<typeof insertMenuSectionSchema>;
export type MenuSection = typeof menuSectionsTable.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishesTable.$inferSelect;
export type InsertRestaurantStory = z.infer<typeof insertRestaurantStorySchema>;
export type RestaurantStory = typeof restaurantStoriesTable.$inferSelect;
