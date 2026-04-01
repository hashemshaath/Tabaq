import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
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

export const partnerApplicationsTable = pgTable("partner_applications", {
  id: serial("id").primaryKey(),
  refCode: text("ref_code").unique(),
  businessType: text("business_type"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar"),
  city: text("city"),
  address: text("address"),
  seatingCapacity: integer("seating_capacity"),
  cuisines: text("cuisines").array(),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  crNumber: text("cr_number"),
  plan: text("plan"),
  extraData: jsonb("extra_data"),
  status: text("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPartnerApplicationSchema = createInsertSchema(partnerApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type PartnerApplication = typeof partnerApplicationsTable.$inferSelect;
export type InsertPartnerApplication = z.infer<typeof insertPartnerApplicationSchema>;

// ─── Cron Job Execution Log ────────────────────────────────────────────────────
// Records every cron job run for monitoring and debugging.

export const cronLogsTable = pgTable("cron_logs", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull(),
  status: text("status").default("running").notNull(), // running | completed | failed
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  durationMs: integer("duration_ms"),
});

export type CronLog = typeof cronLogsTable.$inferSelect;
