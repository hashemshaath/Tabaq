import { pgTable, serial, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taxConfigurationsTable = pgTable("tax_configurations", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull().unique(),
  taxName: text("tax_name").notNull().default("VAT"),
  taxRate: numeric("tax_rate", { precision: 6, scale: 4 }).notNull().default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaxConfigurationSchema = createInsertSchema(taxConfigurationsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type TaxConfiguration = typeof taxConfigurationsTable.$inferSelect;
export type InsertTaxConfiguration = z.infer<typeof insertTaxConfigurationSchema>;
