import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { logger } from "./logger.js";

export type AuditAction =
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_OTP_VERIFIED"
  | "PASSWORD_RESET_COMPLETED"
  | "PASSWORD_CHANGED"
  | "SESSION_REVOKED"
  | "ALL_SESSIONS_REVOKED";

interface AuditMeta {
  method?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export async function logAudit(opts: {
  action: AuditAction;
  actorUid?: string | null;
  actorId?: number | null;
  ip?: string;
  meta?: AuditMeta;
}): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      action: opts.action,
      actorUid: opts.actorUid ?? null,
      actorId: opts.actorId ?? null,
      ipAddress: opts.ip ?? null,
      meta: opts.meta ?? null,
    });
  } catch (err) {
    logger.warn({ err, action: opts.action }, "[audit] Failed to write audit log — non-fatal");
  }
}
