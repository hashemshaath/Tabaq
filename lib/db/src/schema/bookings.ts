import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";
import { occasionsTable } from "./categories";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", "confirmed", "cancelled", "completed", "no_show"
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  date: text("date").notNull(), // "2026-04-01"
  time: text("time").notNull(), // "19:00"
  partySize: integer("party_size").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  occasionId: integer("occasion_id").references(() => occasionsTable.id),
  specialRequests: text("special_requests"),
  referenceCode: text("reference_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
