import { Router } from "express";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import { db } from "@workspace/db";
import { adminUsersTable, adminSessionsTable, auditLogTable } from "@workspace/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import {
  signAdminToken,
  signPartialToken,
  verifyPartialToken,
  generateAdmUid,
  generateSesUid,
  generateChallengeId,
  generateTotpSecret,
  getTotpSecretBase32,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  type AdminRole,
} from "../lib/admin-auth.js";
import { requirePermission } from "../middleware/requireAuth.js";

const router = Router();

const BCRYPT_ROUNDS = 12;
const ADMIN_SETUP_SECRET = process.env["ADMIN_SETUP_SECRET"];
const FAILED_LOGIN_MAX = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const TWO_FA_CHALLENGE_DURATION_MS = 5 * 60 * 1000;
const TWO_FA_MAX_ATTEMPTS = 3;

const GENERIC_AUTH_ERROR = { error: "unauthorized", message: "Invalid credentials" };

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket?.remoteAddress ?? "unknown";
}

function isIpAllowed(ip: string, allowlist: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  return allowlist.includes(ip);
}

async function writeAudit(admUid: string, action: string, ip: string, metadata?: Record<string, unknown>) {
  await db.insert(auditLogTable).values({ admUid, action, ip, metadata: metadata ?? null }).catch(() => {});
}

// ─── POST /api/v1/admin/auth/setup ────────────────────────────────────────────
// Creates the first SUPER_ADMIN. Disabled permanently once any admin exists.
router.post("/v1/admin/auth/setup", async (req, res) => {
  try {
    const { secret, email, password } = req.body as { secret?: string; email?: string; password?: string };

    if (!ADMIN_SETUP_SECRET) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    if (!secret || secret !== ADMIN_SETUP_SECRET) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const [existing] = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).limit(1);
    if (existing) {
      res.status(403).json({ error: "forbidden", message: "Setup already completed" });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ error: "bad_request", message: "email and password required" });
      return;
    }

    if (password.length < 12) {
      res.status(400).json({ error: "bad_request", message: "Password must be at least 12 characters" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const admUid = generateAdmUid();

    await db.insert(adminUsersTable).values({
      admUid,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN",
      status: "active",
    });

    await writeAudit(admUid, "admin.setup.create_super_admin", getClientIp(req));
    res.status(201).json({ message: "SUPER_ADMIN created successfully", admUid });
  } catch (err) {
    req.log.error({ err }, "Admin setup failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /api/v1/admin/auth/login ────────────────────────────────────────────
router.post("/v1/admin/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    const ip = getClientIp(req);

    if (!email || !password) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!admin) {
      await bcrypt.compare(password, "$2a$12$placeholder.hash.to.prevent.timing.attack.xxxxxxxxxxx");
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    if (!isIpAllowed(ip, admin.ipAllowlist ?? [])) {
      await writeAudit(admin.admUid, "admin.login.ip_blocked", ip);
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    if (admin.status !== "active") {
      await writeAudit(admin.admUid, "admin.login.account_inactive", ip);
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      const newCount = (admin.failedLoginCount ?? 0) + 1;
      const lockedUntil = newCount >= FAILED_LOGIN_MAX ? new Date(Date.now() + LOCK_DURATION_MS) : null;
      await db.update(adminUsersTable).set({
        failedLoginCount: newCount,
        ...(lockedUntil ? { lockedUntil } : {}),
        updatedAt: new Date(),
      }).where(eq(adminUsersTable.id, admin.id));
      await writeAudit(admin.admUid, "admin.login.failed_password", ip);
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    if (admin.twoFactorEnabled) {
      const challengeId = generateChallengeId();
      const expiresAt = new Date(Date.now() + TWO_FA_CHALLENGE_DURATION_MS);
      await db.update(adminUsersTable).set({
        pendingTwoFaChallenge: challengeId,
        pendingTwoFaAttempts: 0,
        pendingTwoFaExpiresAt: expiresAt,
        updatedAt: new Date(),
      }).where(eq(adminUsersTable.id, admin.id));

      const partialToken = signPartialToken(admin.admUid, challengeId);
      await writeAudit(admin.admUid, "admin.login.2fa_required", ip);
      res.json({ requires2fa: true, partialToken });
      return;
    }

    await db.update(adminUsersTable).set({
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, admin.id));

    const sesUid = generateSesUid();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const userAgent = req.headers["user-agent"] ?? null;

    await db.insert(adminSessionsTable).values({
      sesUid,
      admUid: admin.admUid,
      ip,
      userAgent,
      expiresAt,
    });

    const token = signAdminToken(admin.admUid, admin.role as AdminRole, sesUid);
    await writeAudit(admin.admUid, "admin.login.success", ip);

    res.json({ token, sessionId: sesUid, role: admin.role, admUid: admin.admUid });
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /api/v1/admin/auth/2fa/verify ───────────────────────────────────────
router.post("/v1/admin/auth/2fa/verify", async (req, res) => {
  try {
    const { partialToken, code } = req.body as { partialToken?: string; code?: string };
    const ip = getClientIp(req);

    if (!partialToken || !code) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const partial = verifyPartialToken(partialToken);
    if (!partial) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.admUid, partial.sub))
      .limit(1);

    if (!admin || !admin.twoFactorSecret) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    if (
      admin.pendingTwoFaChallenge !== partial.challenge_id ||
      !admin.pendingTwoFaExpiresAt ||
      admin.pendingTwoFaExpiresAt < new Date()
    ) {
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const attempts = admin.pendingTwoFaAttempts ?? 0;
    if (attempts >= TWO_FA_MAX_ATTEMPTS) {
      await db.update(adminUsersTable).set({
        pendingTwoFaChallenge: null,
        pendingTwoFaAttempts: 0,
        pendingTwoFaExpiresAt: null,
        updatedAt: new Date(),
      }).where(eq(adminUsersTable.id, admin.id));
      await writeAudit(admin.admUid, "admin.2fa.max_attempts_exceeded", ip);
      res.status(401).json(GENERIC_AUTH_ERROR);
      return;
    }

    const codeNormalized = code.replace(/\s/g, "");

    const totpValid = verifyTotp(admin.twoFactorSecret, codeNormalized, admin.email);
    if (!totpValid) {
      const backupCodes: string[] = (admin.backupCodes as string[]) ?? [];
      const codeHash = hashBackupCode(codeNormalized);
      const backupIndex = backupCodes.indexOf(codeHash);
      if (backupIndex === -1) {
        const newAttempts = attempts + 1;
        if (newAttempts >= TWO_FA_MAX_ATTEMPTS) {
          await db.update(adminUsersTable).set({
            pendingTwoFaChallenge: null,
            pendingTwoFaAttempts: 0,
            pendingTwoFaExpiresAt: null,
            updatedAt: new Date(),
          }).where(eq(adminUsersTable.id, admin.id));
          await writeAudit(admin.admUid, "admin.2fa.max_attempts_exceeded", ip);
          res.status(401).json(GENERIC_AUTH_ERROR);
          return;
        }
        await db.update(adminUsersTable).set({
          pendingTwoFaAttempts: newAttempts,
          updatedAt: new Date(),
        }).where(eq(adminUsersTable.id, admin.id));
        res.status(401).json({ error: "invalid_code", attemptsRemaining: TWO_FA_MAX_ATTEMPTS - newAttempts });
        return;
      }

      const updatedCodes = [...backupCodes];
      updatedCodes.splice(backupIndex, 1);
      await db.update(adminUsersTable).set({ backupCodes: updatedCodes, updatedAt: new Date() }).where(eq(adminUsersTable.id, admin.id));
      await writeAudit(admin.admUid, "admin.2fa.backup_code_used", ip);
    } else {
      await writeAudit(admin.admUid, "admin.2fa.totp_verified", ip);
    }

    await db.update(adminUsersTable).set({
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      pendingTwoFaChallenge: null,
      pendingTwoFaAttempts: 0,
      pendingTwoFaExpiresAt: null,
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, admin.id));

    const sesUid = generateSesUid();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const userAgent = req.headers["user-agent"] ?? null;

    await db.insert(adminSessionsTable).values({
      sesUid,
      admUid: admin.admUid,
      ip,
      userAgent,
      expiresAt,
    });

    const token = signAdminToken(admin.admUid, admin.role as AdminRole, sesUid);
    res.json({ token, sessionId: sesUid, role: admin.role, admUid: admin.admUid });
  } catch (err) {
    req.log.error({ err }, "2FA verify failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /api/v1/admin/auth/2fa/setup ────────────────────────────────────────
router.post("/v1/admin/auth/2fa/setup", requirePermission("admin:write"), async (req, res) => {
  try {
    const admUid = req.adminAuth!.admUid;

    const [admin] = await db
      .select({ email: adminUsersTable.email, twoFactorEnabled: adminUsersTable.twoFactorEnabled })
      .from(adminUsersTable)
      .where(eq(adminUsersTable.admUid, admUid))
      .limit(1);

    if (!admin) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const totp = generateTotpSecret();
    const secret = getTotpSecretBase32(totp);

    const totpWithLabel = new (totp.constructor as typeof OTPAuth.TOTP)({
      issuer: "Tabaq Admin",
      label: admin.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const otpauthUrl = totpWithLabel.toString();

    await db.update(adminUsersTable).set({
      twoFactorSecret: secret,
      twoFactorEnabled: false,
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.admUid, admUid));

    await writeAudit(admUid, "admin.2fa.setup_initiated", getClientIp(req));

    res.json({ secret, otpauthUrl });
  } catch (err) {
    req.log.error({ err }, "2FA setup failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /api/v1/admin/auth/2fa/confirm-setup ────────────────────────────────
router.post("/v1/admin/auth/2fa/confirm-setup", requirePermission("admin:write"), async (req, res) => {
  try {
    const admUid = req.adminAuth!.admUid;
    const { code } = req.body as { code?: string };
    const ip = getClientIp(req);

    if (!code) {
      res.status(400).json({ error: "bad_request", message: "code required" });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.admUid, admUid))
      .limit(1);

    if (!admin || !admin.twoFactorSecret) {
      res.status(400).json({ error: "bad_request", message: "2FA setup not initiated" });
      return;
    }

    const codeNormalized = code.replace(/\s/g, "");
    if (!verifyTotp(admin.twoFactorSecret, codeNormalized, admin.email)) {
      res.status(400).json({ error: "invalid_code", message: "Invalid TOTP code" });
      return;
    }

    const rawBackupCodes = generateBackupCodes();
    const hashedBackupCodes = rawBackupCodes.map(hashBackupCode);

    await db.update(adminUsersTable).set({
      twoFactorEnabled: true,
      backupCodes: hashedBackupCodes,
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.admUid, admUid));

    await writeAudit(admUid, "admin.2fa.enabled", ip);

    res.json({ message: "2FA enabled successfully", backupCodes: rawBackupCodes });
  } catch (err) {
    req.log.error({ err }, "2FA confirm-setup failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── GET /api/v1/admin/auth/sessions ──────────────────────────────────────────
router.get("/v1/admin/auth/sessions", requirePermission("sessions:manage"), async (req, res) => {
  try {
    const admUid = req.adminAuth!.admUid;
    const now = new Date();

    const sessions = await db
      .select()
      .from(adminSessionsTable)
      .where(
        and(
          eq(adminSessionsTable.admUid, admUid),
          isNull(adminSessionsTable.revokedAt),
          gt(adminSessionsTable.expiresAt, now),
        )
      );

    res.json({ sessions });
  } catch (err) {
    req.log.error({ err }, "List sessions failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── DELETE /api/v1/admin/auth/sessions/all ───────────────────────────────────
router.delete("/v1/admin/auth/sessions/all", requirePermission("sessions:manage"), async (req, res) => {
  try {
    const admUid = req.adminAuth!.admUid;
    const ip = getClientIp(req);
    const now = new Date();

    await db
      .update(adminSessionsTable)
      .set({ revokedAt: now })
      .where(
        and(
          eq(adminSessionsTable.admUid, admUid),
          isNull(adminSessionsTable.revokedAt),
        )
      );

    await writeAudit(admUid, "admin.sessions.revoke_all", ip);
    res.json({ message: "All sessions revoked" });
  } catch (err) {
    req.log.error({ err }, "Revoke all sessions failed");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── DELETE /api/v1/admin/auth/sessions/:sesUid ───────────────────────────────
router.delete("/v1/admin/auth/sessions/:sesUid", requirePermission("sessions:manage"), async (req, res) => {
  try {
    const admUid = req.adminAuth!.admUid;
    const sesUid = req.params["sesUid"] as string;
    const ip = getClientIp(req);

    const [session] = await db
      .select({ admUid: adminSessionsTable.admUid })
      .from(adminSessionsTable)
      .where(eq(adminSessionsTable.sesUid, sesUid))
      .limit(1);

    if (!session || session.admUid !== admUid) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    await db
      .update(adminSessionsTable)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessionsTable.sesUid, sesUid));

    await writeAudit(admUid, "admin.sessions.revoke", ip, { sesUid });
    res.json({ message: "Session revoked" });
  } catch (err) {
    req.log.error({ err }, "Revoke session failed");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
