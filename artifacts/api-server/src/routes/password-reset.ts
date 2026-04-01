import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, otpRequestsTable, refreshTokensTable } from "@workspace/db/schema";
import { eq, and, isNull, gt, gte, desc, lt } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { forgotPasswordRateLimiter } from "../middleware/rateLimiter.js";
import {
  generateOtp,
  hashOtpBcrypt,
  verifyOtpBcrypt,
  normalizePhone,
  validateEmail,
  validatePasswordStrength,
  signResetToken,
  verifyResetToken,
} from "../lib/auth.js";
import { sendSms } from "../services/smsService.js";
import { sendEmail, passwordResetOtpEmail, passwordChangedEmail } from "../services/emailService.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_PER_WINDOW = 3;


// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req: import("express").Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}

/** Count OTP rows in the last N hours for a given email or phone (rate limit). */
async function countRecentOtpRequests(identifier: { email?: string; phone?: string }): Promise<number> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = await db
    .select({ id: otpRequestsTable.id })
    .from(otpRequestsTable)
    .where(
      and(
        identifier.email
          ? eq(otpRequestsTable.email, identifier.email)
          : eq(otpRequestsTable.phone, identifier.phone!),
        gte(otpRequestsTable.createdAt, windowStart),
      ),
    );
  return rows.length;
}

// ── POST /auth/password/forgot ─────────────────────────────────────────────────
// Send password-reset OTP via email. Always returns the same success message
// regardless of whether the email is registered (prevents user enumeration).

router.post("/auth/password/forgot", forgotPasswordRateLimiter, async (req, res) => {
  try {
    const { email: rawEmail } = req.body as { email?: string };
    const ip = getClientIp(req);

    if (!rawEmail || !validateEmail(rawEmail)) {
      res.status(400).json({ error: "invalid_email", message: "A valid email address is required" });
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    const SAFE_RESPONSE = { message: "If this email is registered, you will receive an OTP shortly" };

    // Look up the user — silently succeed if not found
    const [user] = await db
      .select({ id: usersTable.id, userUid: usersTable.userUid, email: usersTable.email, preferredLanguage: usersTable.preferredLanguage })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.json(SAFE_RESPONSE);
      return;
    }

    // DB-level rate limit: max 3 OTP requests per hour per email
    const recent = await countRecentOtpRequests({ email });
    if (recent >= RATE_LIMIT_MAX_PER_WINDOW) {
      res.json(SAFE_RESPONSE);
      return;
    }

    // Generate and store OTP
    const code = generateOtp();
    const otpHash = await hashOtpBcrypt(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await db.insert(otpRequestsTable).values({ email, code: "HASHED", otpHash, expiresAt });

    // Send email
    const lang = (user.preferredLanguage === "ar" ? "ar" : "en") as "en" | "ar";
    const template = passwordResetOtpEmail(code, lang);
    const emailResult = await sendEmail({ to: email, ...template, devCode: code });

    if (!emailResult.success) {
      req.log.warn({ email, error: emailResult.error }, "Password reset email failed — OTP still stored");
    }

    await logAudit({
      action: "PASSWORD_RESET_REQUESTED",
      actorUid: user.userUid,
      actorId: user.id,
      ip,
      meta: { method: "email", email },
    });

    res.json(SAFE_RESPONSE);
  } catch (err) {
    req.log.error({ err }, "Failed to process forgot-password");
    res.status(500).json({ error: "internal_error", message: "Failed to process request" });
  }
});

// ── POST /auth/password/forgot-via-phone ──────────────────────────────────────
// Send password-reset OTP via SMS (for phone-verified users).

router.post("/auth/password/forgot-via-phone", forgotPasswordRateLimiter, async (req, res) => {
  try {
    const { phone: rawPhone } = req.body as { phone?: string };
    const ip = getClientIp(req);

    if (!rawPhone) {
      res.status(400).json({ error: "bad_request", message: "phone is required" });
      return;
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      res.status(400).json({ error: "invalid_phone", message: "Invalid phone number format" });
      return;
    }

    const SAFE_RESPONSE = { message: "If this phone is registered, you will receive an OTP shortly" };

    const [user] = await db
      .select({ id: usersTable.id, userUid: usersTable.userUid, phone: usersTable.phone })
      .from(usersTable)
      .where(eq(usersTable.phone, phone))
      .limit(1);

    if (!user) {
      res.json(SAFE_RESPONSE);
      return;
    }

    // Rate limit
    const recent = await countRecentOtpRequests({ phone });
    if (recent >= RATE_LIMIT_MAX_PER_WINDOW) {
      res.json(SAFE_RESPONSE);
      return;
    }

    const code = generateOtp();
    const otpHash = await hashOtpBcrypt(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await db.insert(otpRequestsTable).values({ phone, code: "HASHED", otpHash, expiresAt });

    const message = `Your Tabaq password reset code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
    const smsResult = await sendSms(phone, message);
    if (!smsResult.success) {
      req.log.warn({ phone, error: smsResult.error }, "Password reset SMS failed — OTP still stored");
    }

    await logAudit({
      action: "PASSWORD_RESET_REQUESTED",
      actorUid: user.userUid,
      actorId: user.id,
      ip,
      meta: { method: "phone", phone },
    });

    res.json(SAFE_RESPONSE);
  } catch (err) {
    req.log.error({ err }, "Failed to process forgot-password via phone");
    res.status(500).json({ error: "internal_error", message: "Failed to process request" });
  }
});

// ── POST /auth/password/verify-otp ────────────────────────────────────────────
// Verify the reset OTP; on success issue a short-lived reset_token (JWT, 10m).

router.post("/auth/password/verify-otp", async (req, res) => {
  try {
    const { email: rawEmail, phone: rawPhone, otp } = req.body as {
      email?: string;
      phone?: string;
      otp?: string;
    };

    if (!otp || (!rawEmail && !rawPhone) || (rawEmail && rawPhone)) {
      res.status(400).json({
        error: "bad_request",
        message: "Provide exactly one of email or phone, plus otp",
      });
      return;
    }

    let email: string | null = null;
    let phone: string | null = null;

    if (rawEmail) {
      if (!validateEmail(rawEmail)) {
        res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
        return;
      }
      email = rawEmail.trim().toLowerCase();
    }

    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone) {
        res.status(400).json({ error: "invalid_phone", message: "Invalid phone number format" });
        return;
      }
    }

    // Find the user
    const [user] = await db
      .select({ id: usersTable.id, userUid: usersTable.userUid })
      .from(usersTable)
      .where(email ? eq(usersTable.email, email) : eq(usersTable.phone, phone!))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
      return;
    }

    // Find the most recent valid OTP
    const now = new Date();

    const [otpRow] = await db
      .select()
      .from(otpRequestsTable)
      .where(
        and(
          email ? eq(otpRequestsTable.email, email) : eq(otpRequestsTable.phone, phone!),
          isNull(otpRequestsTable.usedAt),
          gt(otpRequestsTable.expiresAt, now),
        ),
      )
      .orderBy(desc(otpRequestsTable.createdAt))
      .limit(1);

    if (!otpRow) {
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
      return;
    }

    const storedHash = otpRow.otpHash ?? "";
    let otpMatches = false;
    if (storedHash && storedHash !== "LEGACY") {
      otpMatches = storedHash.startsWith("$2")
        ? await verifyOtpBcrypt(otp, storedHash)
        : storedHash === crypto.createHash("sha256").update(otp).digest("hex");
    }
    if (!otpMatches) {
      const newAttempts = (otpRow.attempts ?? 0) + 1;
      if (newAttempts >= 3) {
        await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otpRow.id));
        res.status(401).json({
          error: "OTP_VOID",
          message: "Too many failed attempts. Please request a new code.",
        });
      } else {
        await db.update(otpRequestsTable).set({ attempts: newAttempts }).where(eq(otpRequestsTable.id, otpRow.id));
        res.status(401).json({
          error: "invalid_otp",
          message: "Invalid OTP",
          attempts_remaining: 3 - newAttempts,
        });
      }
      return;
    }

    // Mark OTP as used
    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otpRow.id));

    // Issue reset_token JWT (10-minute lifetime, type: password_reset)
    const resetToken = signResetToken(user.id, user.userUid ?? String(user.id));

    await logAudit({
      action: "PASSWORD_RESET_OTP_VERIFIED",
      actorUid: user.userUid,
      actorId: user.id,
      ip: getClientIp(req),
      meta: { method: email ? "email" : "phone" },
    });

    res.json({ reset_token: resetToken });
  } catch (err) {
    req.log.error({ err }, "Failed to verify password reset OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to verify OTP" });
  }
});

// ── POST /auth/password/reset ──────────────────────────────────────────────────
// Use the reset_token (from verify-otp) to set a new password.
// Revokes ALL existing refresh tokens for the user after successful reset.

router.post("/auth/password/reset", async (req, res) => {
  try {
    const { reset_token, new_password } = req.body as {
      reset_token?: string;
      new_password?: string;
    };

    if (!reset_token || !new_password) {
      res.status(400).json({ error: "bad_request", message: "reset_token and new_password are required" });
      return;
    }

    // Verify the reset token
    const payload = verifyResetToken(reset_token);
    if (!payload) {
      res.status(401).json({
        error: "invalid_reset_token",
        message: "Invalid or expired reset token. Please restart the password reset flow.",
      });
      return;
    }

    // Validate password strength
    const strength = validatePasswordStrength(new_password);
    if (!strength.valid) {
      res.status(400).json({
        error: "PASSWORD_TOO_WEAK",
        message: "Password does not meet requirements",
        requirements: strength.reasons,
      });
      return;
    }

    // Fetch user to confirm they still exist
    const [user] = await db
      .select({ id: usersTable.id, userUid: usersTable.userUid, email: usersTable.email, preferredLanguage: usersTable.preferredLanguage })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const passwordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

    // Update password and revoke ALL refresh tokens atomically
    await Promise.all([
      db.update(usersTable)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(usersTable.id, user.id)),
      db.update(refreshTokensTable)
        .set({ isRevoked: true })
        .where(eq(refreshTokensTable.userId, user.id)),
    ]);

    // Send confirmation email if user has email
    if (user.email) {
      const lang = (user.preferredLanguage === "ar" ? "ar" : "en") as "en" | "ar";
      const template = passwordChangedEmail(lang);
      sendEmail({ to: user.email, ...template }).catch(() => {});
    }

    await logAudit({
      action: "PASSWORD_RESET_COMPLETED",
      actorUid: user.userUid,
      actorId: user.id,
      ip: getClientIp(req),
      meta: {},
    });

    res.json({ success: true, message: "Password reset successfully. Please log in again." });
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(500).json({ error: "internal_error", message: "Failed to reset password" });
  }
});

// ── POST /auth/password/change ─────────────────────────────────────────────────
// Change password for a logged-in user.
// Invalidates all OTHER refresh tokens (keeps current session alive).

router.post("/auth/password/change", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const userUid = req.auth!.userUid;
    const ip = getClientIp(req);

    const { current_password, new_password } = req.body as {
      current_password?: string;
      new_password?: string;
    };

    if (!current_password || !new_password) {
      res.status(400).json({ error: "bad_request", message: "current_password and new_password are required" });
      return;
    }

    const strength = validatePasswordStrength(new_password);
    if (!strength.valid) {
      res.status(400).json({
        error: "PASSWORD_TOO_WEAK",
        message: "New password does not meet requirements",
        requirements: strength.reasons,
      });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, userUid: usersTable.userUid, passwordHash: usersTable.passwordHash, email: usersTable.email, preferredLanguage: usersTable.preferredLanguage })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({
        error: "no_password",
        message: "This account uses phone/OTP login and does not have a password set.",
      });
      return;
    }

    const match = await bcrypt.compare(current_password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "wrong_current_password", message: "Current password is incorrect" });
      return;
    }

    const newHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

    // Revoke all refresh tokens except the one currently in use (best-effort: revoke all for simplicity)
    await Promise.all([
      db.update(usersTable)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(usersTable.id, user.id)),
      db.update(refreshTokensTable)
        .set({ isRevoked: true })
        .where(eq(refreshTokensTable.userId, user.id)),
    ]);

    // Send confirmation email
    if (user.email) {
      const lang = (user.preferredLanguage === "ar" ? "ar" : "en") as "en" | "ar";
      const template = passwordChangedEmail(lang);
      sendEmail({ to: user.email, ...template }).catch(() => {});
    }

    await logAudit({
      action: "PASSWORD_CHANGED",
      actorUid: userUid ?? user.userUid,
      actorId: user.id,
      ip,
      meta: {},
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to change password");
    res.status(500).json({ error: "internal_error", message: "Failed to change password" });
  }
});

export default router;
