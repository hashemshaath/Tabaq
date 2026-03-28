import { pgTable, serial, integer, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { restaurantsTable } from "./restaurants";
import { dishesTable } from "./menus";

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurantTagsTable = pgTable("restaurant_tags", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id).notNull(),
  tagId: integer("tag_id").references(() => tagsTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniq: unique().on(t.restaurantId, t.tagId),
}));

export const dishTagsTable = pgTable("dish_tags", {
  id: serial("id").primaryKey(),
  dishId: integer("dish_id").references(() => dishesTable.id).notNull(),
  tagId: integer("tag_id").references(() => tagsTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniq: unique().on(t.dishId, t.tagId),
}));
