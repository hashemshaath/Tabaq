import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable, otpRequestsTable, userDevicesTable } from "@workspace/db/schema";
import { eq, and, isNull, gt, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
  hashOtp,
  REFRESH_TOKEN_EXPIRES_IN_MS,
} from "../lib/auth.js";

const router = Router();

const PASSCODE_BCRYPT_ROUNDS = 10;
const PASSCODE_MAX_AGE_DAYS = 90;
const PASSCODE_MAX_FAILED = 5;
const PASSCODE_LOCK_MINUTES = 10;

// ── Rate limiter: 10 attempts per minute keyed by user_uid ────────────────────
const passcodeLoginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  keyGenerator: (req) => {
    const body = req.body as Record<string, string>;
    return `passcode:${body.user_uid ?? req.ip ?? "unknown"}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many passcode attempts. Please wait a moment and try again.",
  skip: () => process.env["NODE_ENV"] === "test",
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req: import("express").Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}

function validatePasscode(passcode: string): { valid: boolean; reason?: string } {
  if (!/^\d{6}$/.test(passcode)) {
    return { valid: false, reason: "Passcode must be exactly 6 digits" };
  }
  if (/^(\d)\1{5}$/.test(passcode)) {
    return { valid: false, reason: "Passcode cannot be all the same digit (e.g. 111111)" };
  }
  const digits = passcode.split("").map(Number);
  const strictAsc = digits.every((d, i) => i === 0 || d === digits[i - 1]! + 1);
  const strictDesc = digits.every((d, i) => i === 0 || d === digits[i - 1]! - 1);
  if (strictAsc || strictDesc) {
    return { valid: false, reason: "Passcode cannot be sequential digits (e.g. 123456)" };
  }
  return { valid: true };
}

async function buildPasscodeTokens(
  user: typeof usersTable.$inferSelect,
  deviceInfo?: string,
) {
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    tokenHash,
    deviceInfo: deviceInfo ?? null,
    expiresAt,
  });

  const accessToken = signToken({
    sub: user.userUid ?? String(user.id),
    userId: user.id,
    role: user.isAdmin ? "admin" : user.isOwner ? "owner" : "user",
    phone: user.phone,
    email: user.email,
    isAdmin: user.isAdmin,
    isOwner: user.isOwner,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function upsertDevice(userId: number, fingerprint: string, deviceInfo?: string) {
  await db
    .insert(userDevicesTable)
    .values({ userId, deviceFingerprint: fingerprint, deviceInfo: deviceInfo ?? null })
    .onConflictDoUpdate({
      target: [userDevicesTable.userId, userDevicesTable.deviceFingerprint],
      set: { lastSeenAt: new Date(), deviceInfo: deviceInfo ?? null },
    });
}

// ── POST /auth/passcode/set ───────────────────────────────────────────────────
// Requires JWT. Sets (or replaces) the user's 6-digit passcode.
// Also registers the current device_fingerprint as a known device.

router.post("/auth/passcode/set", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { passcode, device_fingerprint, device_info } = req.body as {
      passcode?: string;
      device_fingerprint?: string;
      device_info?: string;
    };

    if (!passcode) {
      res.status(400).json({ error: "bad_request", message: "passcode is required" });
      return;
    }

    const pv = validatePasscode(passcode);
    if (!pv.valid) {
      res.status(400).json({ error: "INVALID_PASSCODE", message: pv.reason });
      return;
    }

    // User must have a verified phone number
    const [user] = await db
      .select({ id: usersTable.id, phone: usersTable.phone })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user?.phone) {
      res.status(403).json({
        error: "PHONE_REQUIRED",
        message: "A verified phone number is required to set a passcode.",
      });
      return;
    }

    const passcodeHash = await bcrypt.hash(passcode, PASSCODE_BCRYPT_ROUNDS);

    await db.update(usersTable).set({
      passcodeHash,
      passcodeSetAt: new Date(),
      passcodeFailedAttempts: 0,
      passcodeLockedUntil: null,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, userId));

    // Register device as known if fingerprint provided
    if (device_fingerprint) {
      await upsertDevice(userId, device_fingerprint, device_info);
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to set passcode");
    res.status(500).json({ error: "internal_error", message: "Failed to set passcode" });
  }
});

// ── POST /auth/passcode/login ─────────────────────────────────────────────────
// Public. Authenticates using user_uid + passcode + device_fingerprint.

router.post("/auth/passcode/login", passcodeLoginLimiter, async (req, res) => {
  try {
    const { user_uid, passcode, device_fingerprint } = req.body as {
      user_uid?: string;
      passcode?: string;
      device_fingerprint?: string;
    };

    if (!user_uid || !passcode || !device_fingerprint) {
      res.status(400).json({
        error: "bad_request",
        message: "user_uid, passcode, and device_fingerprint are required",
      });
      return;
    }

    // Basic format check
    if (!/^\d{6}$/.test(passcode)) {
      res.status(400).json({ error: "INVALID_PASSCODE", message: "Passcode must be exactly 6 digits" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.userUid, user_uid))
      .limit(1);

    // Constant-time dummy hash to prevent timing-based user enumeration
    const dummyHash = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";
    const hashToCompare = user?.passcodeHash ?? dummyHash;

    if (!user) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(401).json({ error: "invalid_credentials", message: "Invalid credentials" });
      return;
    }

    // Passcode lock check
    if (user.passcodeLockedUntil && user.passcodeLockedUntil > new Date()) {
      await bcrypt.compare(passcode, dummyHash);
      const retryAfter = Math.ceil((user.passcodeLockedUntil.getTime() - Date.now()) / 1000);
      res.status(403).json({
        error: "PASSCODE_LOCKED",
        message: "Passcode login temporarily locked due to too many failed attempts.",
        retry_after: retryAfter,
      });
      return;
    }

    // Must have a passcode set
    if (!user.passcodeHash) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(403).json({
        error: "PASSCODE_NOT_SET",
        message: "No passcode is set for this account. Please log in with your phone or email.",
      });
      return;
    }

    // Passcode must be fresh (set within last 90 days)
    if (!user.passcodeSetAt) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(403).json({ error: "PASSCODE_NOT_SET", message: "No passcode is set for this account." });
      return;
    }
    const ageDays = (Date.now() - user.passcodeSetAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > PASSCODE_MAX_AGE_DAYS) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(403).json({
        error: "PASSCODE_EXPIRED",
        message: "Your passcode has expired (90-day limit). Please log in with your phone and set a new passcode.",
      });
      return;
    }

    // User must have a verified phone
    if (!user.phone) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(403).json({
        error: "PHONE_REQUIRED",
        message: "Passcode login requires a verified phone number.",
      });
      return;
    }

    // Device must be a previously seen device
    const [knownDevice] = await db
      .select({ id: userDevicesTable.id })
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, user.id),
          eq(userDevicesTable.deviceFingerprint, device_fingerprint),
        ),
      )
      .limit(1);

    if (!knownDevice) {
      await bcrypt.compare(passcode, dummyHash);
      res.status(403).json({
        error: "UNKNOWN_DEVICE",
        message: "This device is not recognized. Please log in with your phone to register this device first.",
      });
      return;
    }

    // Compare passcode
    const match = await bcrypt.compare(passcode, hashToCompare);

    if (!match) {
      const newFailed = (user.passcodeFailedAttempts ?? 0) + 1;
      if (newFailed >= PASSCODE_MAX_FAILED) {
        const lockedUntil = new Date(Date.now() + PASSCODE_LOCK_MINUTES * 60 * 1000);
        await db.update(usersTable).set({
          passcodeFailedAttempts: newFailed,
          passcodeLockedUntil: lockedUntil,
          updatedAt: new Date(),
        }).where(eq(usersTable.id, user.id));
        res.status(403).json({
          error: "PASSCODE_LOCKED",
          message: `Passcode login locked for ${PASSCODE_LOCK_MINUTES} minutes after too many failed attempts.`,
          retry_after: PASSCODE_LOCK_MINUTES * 60,
        });
      } else {
        await db.update(usersTable).set({
          passcodeFailedAttempts: newFailed,
          updatedAt: new Date(),
        }).where(eq(usersTable.id, user.id));
        res.status(401).json({
          error: "invalid_credentials",
          message: "Incorrect passcode",
          attempts_remaining: PASSCODE_MAX_FAILED - newFailed,
        });
      }
      return;
    }

    // Success — reset failed counter, update device last_seen, issue tokens
    await Promise.all([
      db.update(usersTable).set({
        passcodeFailedAttempts: 0,
        passcodeLockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: getClientIp(req),
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id)),
      upsertDevice(user.id, device_fingerprint),
    ]);

    const deviceInfo = req.headers["user-agent"];
    const { accessToken, refreshToken } = await buildPasscodeTokens(
      user,
      typeof deviceInfo === "string" ? deviceInfo : undefined,
    );

    res.cookie("tabaq_token", accessToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] !== "development",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ token: accessToken, accessToken, refreshToken, user });
  } catch (err) {
    req.log.error({ err }, "Failed passcode login");
    res.status(500).json({ error: "internal_error", message: "Failed passcode login" });
  }
});

// ── POST /auth/passcode/reset ─────────────────────────────────────────────────
// "Forgot passcode" flow: verify phone OTP, then update passcode.

router.post("/auth/passcode/reset", async (req, res) => {
  try {
    const { user_uid, otp, new_passcode } = req.body as {
      user_uid?: string;
      otp?: string;
      new_passcode?: string;
    };

    if (!user_uid || !otp || !new_passcode) {
      res.status(400).json({
        error: "bad_request",
        message: "user_uid, otp, and new_passcode are required",
      });
      return;
    }

    const pv = validatePasscode(new_passcode);
    if (!pv.valid) {
      res.status(400).json({ error: "INVALID_PASSCODE", message: pv.reason });
      return;
    }

    // Find the user
    const [user] = await db
      .select({ id: usersTable.id, phone: usersTable.phone, passcodeHash: usersTable.passcodeHash })
      .from(usersTable)
      .where(eq(usersTable.userUid, user_uid))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    if (!user.phone) {
      res.status(403).json({
        error: "PHONE_REQUIRED",
        message: "A verified phone number is required to reset a passcode.",
      });
      return;
    }

    // Verify the OTP for this phone number
    const now = new Date();
    const submittedHash = hashOtp(otp);

    const [otpRow] = await db
      .select()
      .from(otpRequestsTable)
      .where(
        and(
          eq(otpRequestsTable.phone, user.phone),
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
    if (storedHash === "LEGACY" || storedHash !== submittedHash) {
      const newAttempts = (otpRow.attempts ?? 0) + 1;
      if (newAttempts >= 3) {
        await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otpRow.id));
        res.status(401).json({
          error: "otp_voided",
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

    // Mark OTP used
    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otpRow.id));

    // Update passcode
    const passcodeHash = await bcrypt.hash(new_passcode, PASSCODE_BCRYPT_ROUNDS);
    await db.update(usersTable).set({
      passcodeHash,
      passcodeSetAt: new Date(),
      passcodeFailedAttempts: 0,
      passcodeLockedUntil: null,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    res.json({ success: true, message: "Passcode updated successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to reset passcode");
    res.status(500).json({ error: "internal_error", message: "Failed to reset passcode" });
  }
});

// ── DELETE /auth/passcode ─────────────────────────────────────────────────────
// Requires JWT. Disables passcode login for the user.

router.delete("/auth/passcode", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    await db.update(usersTable).set({
      passcodeHash: null,
      passcodeSetAt: null,
      passcodeFailedAttempts: 0,
      passcodeLockedUntil: null,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, userId));

    res.json({ success: true, message: "Passcode disabled" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete passcode");
    res.status(500).json({ error: "internal_error", message: "Failed to delete passcode" });
  }
});

export default router;
