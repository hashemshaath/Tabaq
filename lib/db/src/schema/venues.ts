import { pgTable, serial, integer, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { restaurantsTable } from "./restaurants";

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id).notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  capacity: integer("capacity").notNull().default(0),
  minPartySize: integer("min_party_size").default(1),
  maxPartySize: integer("max_party_size"),
  isPrivate: boolean("is_private").default(false),
  imageUrl: text("image_url"),
  pricePerHour: numeric("price_per_hour", { precision: 10, scale: 2 }),
  currency: text("currency").default("SAR"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
