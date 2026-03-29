import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const userAddressesTable = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  labelAr: text("label_ar").default("البيت"),
  isDefault: boolean("is_default").default(false).notNull(),

  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  district: text("district"),
  city: text("city").notNull(),
  region: text("region"),
  postalCode: text("postal_code"),
  countryCode: text("country_code").notNull().default("SA"),

  nationalAddress: text("national_address"),
  buildingNumber: text("building_number"),
  additionalNumber: text("additional_number"),
  unitNumber: text("unit_number"),

  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),

  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserAddressSchema = createInsertSchema(userAddressesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectUserAddressSchema = createSelectSchema(userAddressesTable);

export type UserAddress = typeof userAddressesTable.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
