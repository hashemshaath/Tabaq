import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const UID_ENTITY_TYPES = ["USER", "PROVIDER", "ADMIN", "SESSION"] as const;
export type UidEntityType = typeof UID_ENTITY_TYPES[number];

export const UID_STATUSES = ["active", "inactive", "suspended"] as const;
export type UidStatus = typeof UID_STATUSES[number];

export const uidRegistryTable = pgTable("uid_registry", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  entityType: text("entity_type").notNull().$type<UidEntityType>(),
  status: text("status").notNull().default("active").$type<UidStatus>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UidRegistry = typeof uidRegistryTable.$inferSelect;
export type InsertUidRegistry = typeof uidRegistryTable.$inferInsert;

export const uidRegistryEntityTypeSchema = z.enum(UID_ENTITY_TYPES);
export const uidRegistryStatusSchema = z.enum(UID_STATUSES);
