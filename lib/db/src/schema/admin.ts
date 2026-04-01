import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  admUid: text("adm_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("VIEWER"),
  status: text("status").notNull().default("active"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  backupCodes: jsonb("backup_codes").$type<string[]>().default([]),
  ipAllowlist: jsonb("ip_allowlist").$type<string[]>().default([]),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  pendingTwoFaChallenge: text("pending_2fa_challenge"),
  pendingTwoFaAttempts: integer("pending_2fa_attempts").notNull().default(0),
  pendingTwoFaExpiresAt: timestamp("pending_2fa_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  sesUid: text("ses_uid").notNull().unique(),
  admUid: text("adm_uid").notNull().references(() => adminUsersTable.admUid, { onDelete: "cascade" }),
  ip: text("ip").notNull(),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  admUid: text("adm_uid").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityUid: text("entity_uid"),
  ip: text("ip"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type AdminSession = typeof adminSessionsTable.$inferSelect;
export type AuditLog = typeof auditLogTable.$inferSelect;
