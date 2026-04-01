import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const providerAccountStatusEnum = pgEnum("provider_account_status", [
  "DRAFT",
  "PENDING_REVIEW",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
]);

export const providerStaffRoleEnum = pgEnum("provider_staff_role", [
  "OWNER",
  "MANAGER",
  "STAFF",
]);

export const providerStaffStatusEnum = pgEnum("provider_staff_status", [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
]);

export const providerAccountsTable = pgTable("provider_accounts", {
  id: serial("id").primaryKey(),
  providerUid: text("provider_uid").unique().notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique(),
  preferredContact: text("preferred_contact").notNull().default("email"),
  passwordHash: text("password_hash"),
  status: providerAccountStatusEnum("status").default("DRAFT").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  twoFaEnabled: boolean("two_fa_enabled").default(false).notNull(),
  businessName: text("business_name"),
  businessNameAr: text("business_name_ar"),
  businessType: text("business_type"),
  crNumber: text("cr_number"),
  vatNumber: text("vat_number"),
  businessAddress: text("business_address"),
  city: text("city"),
  country: text("country"),
  websiteUrl: text("website_url"),
  contactName: text("contact_name"),
  rejectionReason: text("rejection_reason"),
  suspensionReason: text("suspension_reason"),
  registrationStep: integer("registration_step").default(1).notNull(),
  failedLoginCount: integer("failed_login_count").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const providerAccountDocumentsTable = pgTable("provider_account_documents", {
  id: serial("id").primaryKey(),
  providerUid: text("provider_uid")
    .notNull()
    .references(() => providerAccountsTable.providerUid),
  crDocumentUrl: text("cr_document_url"),
  vatDocumentUrl: text("vat_document_url"),
  ownerIdUrl: text("owner_id_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const providerStaffTable = pgTable("provider_staff", {
  id: serial("id").primaryKey(),
  staffUid: text("staff_uid").unique().notNull(),
  providerUid: text("provider_uid")
    .notNull()
    .references(() => providerAccountsTable.providerUid),
  email: text("email").notNull(),
  nameEn: text("name_en"),
  passwordHash: text("password_hash"),
  role: providerStaffRoleEnum("role").notNull().default("STAFF"),
  status: providerStaffStatusEnum("status").notNull().default("INVITED"),
  inviteToken: text("invite_token").unique(),
  inviteTokenExpiresAt: timestamp("invite_token_expires_at"),
  invitedBy: text("invited_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ProviderAccount = typeof providerAccountsTable.$inferSelect;
export type InsertProviderAccount = typeof providerAccountsTable.$inferInsert;
export type ProviderAccountDocument = typeof providerAccountDocumentsTable.$inferSelect;
export type InsertProviderAccountDocument = typeof providerAccountDocumentsTable.$inferInsert;
export type ProviderStaff = typeof providerStaffTable.$inferSelect;
export type InsertProviderStaff = typeof providerStaffTable.$inferInsert;
