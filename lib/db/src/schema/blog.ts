import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const blogPostStatusEnum = pgEnum("blog_post_status", ["draft", "published", "archived"]);

export const blogCategoriesTable = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  color: text("color").default("#e23744"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => usersTable.id),
  categoryId: integer("category_id").references(() => blogCategoriesTable.id),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  slug: text("slug").notNull().unique(),
  excerptEn: text("excerpt_en"),
  excerptAr: text("excerpt_ar"),
  contentEn: text("content_en"),
  contentAr: text("content_ar"),
  coverImageUrl: text("cover_image_url"),
  status: blogPostStatusEnum("status").default("draft").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  readTimeMinutes: integer("read_time_minutes").default(5),
  tags: jsonb("tags").$type<string[]>().default([]),
  metaTitleEn: text("meta_title_en"),
  metaTitleAr: text("meta_title_ar"),
  metaDescriptionEn: text("meta_description_en"),
  metaDescriptionAr: text("meta_description_ar"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategoriesTable).omit({ id: true, createdAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });

export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategoriesTable.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
