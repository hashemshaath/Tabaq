import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformModulesTable = pgTable("platform_modules", {
  id: serial("id").primaryKey(),
  moduleId: text("module_id").notNull().unique(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  version: text("version").default("1.0.0").notNull(),
  dependencies: text("dependencies").default("[]").notNull(),
  settings: text("settings").default("{}").notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlatformModuleSchema = createInsertSchema(platformModulesTable).omit({ id: true, createdAt: true });

export type PlatformModule = typeof platformModulesTable.$inferSelect;
export type InsertPlatformModule = z.infer<typeof insertPlatformModuleSchema>;
