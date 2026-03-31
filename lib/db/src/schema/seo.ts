import { pgTable, serial, text, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoSettingsTable = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  metaTitleEn: text("meta_title_en"),
  metaTitleAr: text("meta_title_ar"),
  metaDescriptionEn: text("meta_description_en"),
  metaDescriptionAr: text("meta_description_ar"),
  keywords: text("keywords"),
  isIndexed: boolean("is_indexed").default(true).notNull(),
  isFollowed: boolean("is_followed").default(true).notNull(),
  canonicalUrl: text("canonical_url"),
  sitemapPriority: numeric("sitemap_priority", { precision: 2, scale: 1 }).default("0.8"),
  sitemapChangefreq: text("sitemap_changefreq").default("weekly"),
  customJsonLd: jsonb("custom_json_ld"),
  ogImageUrl: text("og_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type SeoSettings = typeof seoSettingsTable.$inferSelect;
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
