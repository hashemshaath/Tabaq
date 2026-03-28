import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  icon: text("icon"),
  slug: text("slug").notNull().unique(),
});

export const occasionsTable = pgTable("occasions", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  icon: text("icon"),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true });
export const insertOccasionSchema = createInsertSchema(occasionsTable).omit({ id: true });

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
export type InsertOccasion = z.infer<typeof insertOccasionSchema>;
export type Occasion = typeof occasionsTable.$inferSelect;
