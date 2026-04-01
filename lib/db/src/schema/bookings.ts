import { pgTable, serial, integer, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";
import { occasionsTable } from "./categories";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", "confirmed", "cancelled", "completed", "no_show"
]);

export const tableTypeEnum = pgEnum("table_type", [
  "indoor", "outdoor", "vip", "window_seat"
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting", "notified", "confirmed", "expired"
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  partySize: integer("party_size").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  tableType: tableTypeEnum("table_type").default("indoor"),
  occasionId: integer("occasion_id").references(() => occasionsTable.id),
  specialRequests: text("special_requests"),
  preOrderItems: jsonb("pre_order_items").$type<Array<{ dishId: number; name: string; quantity: number; price: number }>>().default([]),
  referenceCode: text("reference_code").notNull().unique(),
  invoiceRef: text("invoice_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  partySize: integer("party_size").notNull(),
  tableType: tableTypeEnum("table_type").default("indoor"),
  status: waitlistStatusEnum("status").default("waiting").notNull(),
  position: integer("position").notNull(),
  notifiedAt: timestamp("notified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({ id: true, createdAt: true, notifiedAt: true });

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlistTable.$inferSelect;
