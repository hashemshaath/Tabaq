import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  code: text("code").notNull().unique(),
  flag: text("flag"),
});

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  countryId: integer("country_id").notNull().references(() => countriesTable.id),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

export const insertCountrySchema = createInsertSchema(countriesTable).omit({ id: true });
export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true });

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof citiesTable.$inferSelect;
