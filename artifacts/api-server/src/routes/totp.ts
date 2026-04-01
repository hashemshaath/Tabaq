import { Router } from "express";
import { generateSecret, verifySync, generateURI } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAuth.js";
import { signToken, verifyTempToken, signTempToken, REFRESH_TOKEN_EXPIRES_IN_MS } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

export const totpRouter = Router();

const SERVICE_NAME = "Tabaq";
const BCRYPT_COST = 10;
const BACKUP_CODE_COUNT = 10;

// ─── helpers ────────────────────────────────────────────────────────────────

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function parseDeviceLabel(ua?: string): string {
  if (!ua) return "Unknown Device";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android.*mobile/i.test(ua)) return "Android Phone";
  if (/android/i.test(ua)) return "Android Tablet";
  if (/curl/i.test(ua)) return "curl / API client";
  if (/postman/i.test(ua)) return "Postman";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Browser";
}

/** Generate N random backup codes and their bcrypt hashes. */
async function generateBackupCodes(): Promise<{ plain: string[]; hashed: string[] }> {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  const hashed = await Promise.all(plain.map(c => bcrypt.hash(c, BCRYPT_COST)));
  return { plain, hashed };
}

/** Try each backup code hash; return index of match or -1. */
async function matchBackupCode(input: string, hashes: string[]): Promise<number> {
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(input, hashes[i])) return i;
  }
  return -1;
}

async function buildFullSession(user: typeof usersTable.$inferSelect, req: import("express").Request) {
  const deviceInfo = parseDeviceLabel(req.headers["user-agent"]);
  const ipAddress  = getClientIp(req);
  const accessToken = signToken({
    sub: String(user.id), userId: user.id,
    isAdmin: user.isAdmin, isOwner: user.isOwner,
    role: user.isAdmin ? "admin" : user.isOwner ? "owner" : "user",
  });
  const rawRefresh = crypto.randomBytes(48).toString("hex");
  const tokenHash  = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt  = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

  await db.insert(refreshTokensTable).values({
    userId: user.id, tokenHash, deviceInfo, ipAddress,
    lastUsedAt: new Date(), expiresAt, isRevoked: false,
  });

  const { passwordHash, passcodeHash, passcodeFailedAttempts, passcodeLockedUntil, totpSecret, totpBackupCodes, ...safeUser } = user;
  return {
    accessToken,
    refreshToken: rawRefresh,
    user: { ...safeUser, hasPassword: !!passwordHash, hasPasscode: !!passcodeHash, hasTOTP: !!user.totpEnabledAt },
  };
}

// ─── POST /auth/totp/setup ────────────────────────────────────────────────────
// Generates a new TOTP secret and returns the QR code + manual key.
// Does NOT persist yet — caller must verify-setup to activate.

totpRouter.post("/auth/totp/setup", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    if (!user.isAdmin) { res.status(403).json({ error: "admin_only", message: "TOTP 2FA is for admin accounts only." }); return; }
    if (user.totpEnabledAt) {
      res.status(409).json({ error: "already_enabled", message: "TOTP is already enabled. Disable it first." });
      return;
    }

    const secret  = generateSecret();
    const label   = user.email ?? user.username ?? `admin-${user.id}`;
    const otpauthUrl = generateURI({ label, secret, issuer: SERVICE_NAME, strategy: "totp" });
    const qrDataUrl  = await QRCode.toDataURL(otpauthUrl);

    // Store the pending secret temporarily (overwrite any previous pending setup)
    // We use the totpSecret column as staging; only totpEnabledAt being set means it's active.
    await db.update(usersTable).set({ totpSecret: secret }).where(eq(usersTable.id, user.id));

    await logAudit({ actorId: user.id, action: "TOTP_SETUP_INITIATED", ip: getClientIp(req) });

    res.json({
      secret,           // for manual entry in authenticator app
      qr_code: qrDataUrl, // base64 PNG data URL for QR display
      otpauth_url: otpauthUrl,
    });
  } catch (err) {
    req.log.error({ err }, "TOTP setup error");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /auth/totp/verify-setup ────────────────────────────────────────────
// Body: { code: string }
// Verifies the first TOTP code and activates 2FA for the account.
// Returns backup codes (one-time display only).

totpRouter.post("/auth/totp/verify-setup", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    if (!user.isAdmin) { res.status(403).json({ error: "admin_only" }); return; }
    if (!user.totpSecret) { res.status(400).json({ error: "setup_required", message: "Call /auth/totp/setup first." }); return; }
    if (user.totpEnabledAt) { res.status(409).json({ error: "already_enabled" }); return; }

    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") { res.status(400).json({ error: "missing_code" }); return; }

    const valid = verifySync({ token: code.replace(/\s/g, ""), secret: user.totpSecret, strategy: "totp" });
    if (!valid) { res.status(401).json({ error: "invalid_code", message: "Incorrect code. Please check your authenticator app." }); return; }

    const { plain, hashed } = await generateBackupCodes();
    await db.update(usersTable).set({
      totpEnabledAt: new Date(),
      totpBackupCodes: hashed,
    }).where(eq(usersTable.id, user.id));

    await logAudit({ actorId: user.id, action: "TOTP_ENABLED", ip: getClientIp(req) });

    res.json({
      success: true,
      backup_codes: plain, // Show ONCE — user must save these
      message: "2FA is now active. Save your backup codes — they will not be shown again.",
    });
  } catch (err) {
    req.log.error({ err }, "TOTP verify-setup error");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /auth/totp/verify ───────────────────────────────────────────────────
// Body: { temp_token: string, code: string }  OR  { temp_token, backup_code: string }
// Completes login after TOTP gate. Returns full session tokens.

totpRouter.post("/auth/totp/verify", async (req, res) => {
  try {
    const { temp_token, code, backup_code } = req.body ?? {};
    if (!temp_token || typeof temp_token !== "string") {
      res.status(400).json({ error: "missing_temp_token" });
      return;
    }
    const parsed = verifyTempToken(temp_token);
    if (!parsed) {
      res.status(401).json({ error: "invalid_temp_token", message: "Expired or invalid MFA session. Please sign in again." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId));
    if (!user || !user.totpEnabledAt || !user.totpSecret) {
      res.status(401).json({ error: "totp_not_configured" });
      return;
    }

    let verified = false;

    if (backup_code && typeof backup_code === "string") {
      // Backup code path
      const codes = (user.totpBackupCodes as string[] | null) ?? [];
      const idx = await matchBackupCode(backup_code.replace(/[\s\-]/g, "").toUpperCase(), codes);
      if (idx === -1) {
        await logAudit({ actorId: user.id, action: "TOTP_LOGIN_FAILED", ip: getClientIp(req), meta: { method: "backup_code" } });
        res.status(401).json({ error: "invalid_backup_code", message: "Invalid backup code." });
        return;
      }
      // Consume the backup code (one-time use)
      const remaining = [...codes];
      remaining.splice(idx, 1);
      await db.update(usersTable).set({ totpBackupCodes: remaining }).where(eq(usersTable.id, user.id));
      await logAudit({ actorId: user.id, action: "TOTP_BACKUP_USED", ip: getClientIp(req), meta: { codesRemaining: remaining.length } });
      verified = true;
    } else if (code && typeof code === "string") {
      // Standard TOTP path
      verified = verifySync({ token: code.replace(/\s/g, ""), secret: user.totpSecret, strategy: "totp" });
      if (!verified) {
        await logAudit({ actorId: user.id, action: "TOTP_LOGIN_FAILED", ip: getClientIp(req) });
        res.status(401).json({ error: "invalid_code", message: "Incorrect code. Please try again." });
        return;
      }
      await logAudit({ actorId: user.id, action: "TOTP_LOGIN_SUCCESS", ip: getClientIp(req) });
    } else {
      res.status(400).json({ error: "missing_code", message: "Provide either code or backup_code." });
      return;
    }

    const session = await buildFullSession(user, req);
    res.cookie("tabaq_token", session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.json(session);
  } catch (err) {
    req.log.error({ err }, "TOTP verify error");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── DELETE /auth/totp ────────────────────────────────────────────────────────
// Body: { password: string }
// Disables TOTP 2FA. Requires the user's current password for confirmation.

totpRouter.delete("/auth/totp", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    if (!user.totpEnabledAt) { res.status(409).json({ error: "not_enabled", message: "TOTP is not enabled on this account." }); return; }

    const { password } = req.body ?? {};
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "password_required", message: "Current password is required to disable 2FA." });
      return;
    }
    if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "wrong_password", message: "Incorrect password." });
      return;
    }

    await db.update(usersTable).set({
      totpSecret: null, totpEnabledAt: null, totpBackupCodes: null,
    }).where(eq(usersTable.id, user.id));

    await logAudit({ actorId: user.id, action: "TOTP_DISABLED", ip: getClientIp(req) });

    res.json({ success: true, message: "Two-factor authentication has been disabled." });
  } catch (err) {
    req.log.error({ err }, "TOTP disable error");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── GET /auth/totp/status ────────────────────────────────────────────────────
// Returns current TOTP status for the authenticated user.

totpRouter.get("/auth/totp/status", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select({
      id: usersTable.id,
      isAdmin: usersTable.isAdmin,
      totpEnabledAt: usersTable.totpEnabledAt,
      totpBackupCodes: usersTable.totpBackupCodes,
    }).from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }

    const backupCodesCount = Array.isArray(user.totpBackupCodes) ? user.totpBackupCodes.length : 0;
    res.json({
      enabled: !!user.totpEnabledAt,
      enabled_at: user.totpEnabledAt ?? null,
      backup_codes_remaining: backupCodesCount,
    });
  } catch (err) {
    req.log.error({ err }, "TOTP status error");
    res.status(500).json({ error: "internal_error" });
  }
});
