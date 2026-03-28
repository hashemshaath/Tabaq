import { pgTable, serial, text, integer, boolean, numeric, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

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
  calories: integer("calories"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMenuSchema = createInsertSchema(menusTable).omit({ id: true });
export const insertMenuSectionSchema = createInsertSchema(menuSectionsTable).omit({ id: true });
export const insertDishSchema = createInsertSchema(dishesTable).omit({ id: true });

export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menusTable.$inferSelect;
export type InsertMenuSection = z.infer<typeof insertMenuSectionSchema>;
export type MenuSection = typeof menuSectionsTable.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishesTable.$inferSelect;
