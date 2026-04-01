import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, registerUid } from "@workspace/db";
import { usersTable, otpRequestsTable, emailVerificationTokensTable, refreshTokensTable, sessionsTable, userDevicesTable } from "@workspace/db/schema";
import { eq, and, isNull, gt, desc, gte, sql, or } from "drizzle-orm";
import {
  signToken,
  signTempToken,
  generateOtp,
  hashOtpBcrypt,
  verifyOtpBcrypt,
  otpExpiresAt,
  generateRefreshToken,
  hashRefreshToken,
  signRefreshToken,
  verifyRefreshToken,
  signSuspiciousToken,
  verifySuspiciousToken,
  normalizePhone,
  validateEmail,
  validatePasswordStrength,
  validateUsername,
  classifyIdentifier,
  REFRESH_TOKEN_EXPIRES_IN_MS,
  BCRYPT_SALT_ROUNDS,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
} from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authRateLimiter, loginRateLimiter, registerRateLimiter, otpRateLimiter, forgotPasswordRateLimiter } from "../middleware/rateLimiter.js";
import { requestLogger } from "../middleware/requestLogger.js";
import { inputSanitizer } from "../middleware/inputSanitizer.js";
import { sendOtp, isSmsDevMode } from "../services/smsService.js";
import { awardPoints, POINTS } from "../lib/points.js";
import { createSession, computeDeviceFingerprint, revokeAllUserSessions, generateSessionUid } from "../lib/session.js";
import { notifyAsync } from "../lib/notify.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";

const router: IRouter = Router();

router.use(requestLogger);
router.use(inputSanitizer);

const IS_DEV = process.env["NODE_ENV"] !== "production";
const FAILED_LOGIN_MAX = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function calcLevel(points: number): { level: number; levelTitle: string } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer" };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast" };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet" };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic" };
  return { level: 5, levelTitle: "Master Chef" };
}

function generateUserUid(id: number): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `USR-${year}-${timestamp}-${suffix}`;
}

interface BuildTokensOptions {
  deviceInfo?: string;
  ipAddress?: string;
  appVersion?: string;
  locationCountry?: string;
  locationCity?: string;
  skipSuspiciousCheck?: boolean;
}

class SuspiciousLoginError extends Error {
  constructor(public readonly tempToken: string) {
    super("Suspicious login detected: new country");
    this.name = "SuspiciousLoginError";
  }
}

const COUNTRY_TIMEZONES: Record<string, string> = {
  SA: "Asia/Riyadh",
  AE: "Asia/Dubai",
  KW: "Asia/Kuwait",
  BH: "Asia/Bahrain",
  QA: "Asia/Qatar",
  OM: "Asia/Muscat",
  JO: "Asia/Amman",
  EG: "Africa/Cairo",
  GB: "Europe/London",
  US: "America/New_York",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  TR: "Europe/Istanbul",
  IN: "Asia/Kolkata",
  PK: "Asia/Karachi",
  NG: "Africa/Lagos",
  MA: "Africa/Casablanca",
};

function getLocalHour(timezone: string): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).format(new Date());
    return parseInt(formatted, 10);
  } catch {
    return new Date().getUTCHours();
  }
}

async function checkSuspiciousLogin(
  userId: number,
  deviceFingerprint: string,
  locationCountry: string | undefined,
): Promise<{ isSuspiciousCountry: boolean; isNewDevice: boolean; isOffHours: boolean }> {
  const [lastSession] = await db
    .select({ locationCountry: sessionsTable.locationCountry, createdAt: sessionsTable.createdAt })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.isRevoked, false)))
    .orderBy(desc(sessionsTable.createdAt))
    .limit(1);

  const isSuspiciousCountry = !!(
    lastSession &&
    lastSession.locationCountry &&
    locationCountry &&
    lastSession.locationCountry !== locationCountry
  );

  const [existingDevice] = await db
    .select({ id: userDevicesTable.id })
    .from(userDevicesTable)
    .where(and(eq(userDevicesTable.userId, userId), eq(userDevicesTable.deviceFingerprint, deviceFingerprint)))
    .limit(1);

  const isNewDevice = !existingDevice;

  const timezone = locationCountry ? (COUNTRY_TIMEZONES[locationCountry] ?? null) : null;
  const localHour = timezone ? getLocalHour(timezone) : new Date().getUTCHours();
  const isCurrentlyOffHours = localHour >= 2 && localHour < 5;

  // Only flag off-hours if this is the user's FIRST off-hours login.
  // Check if any prior session was created during the 2–5am window in the user's timezone.
  let isOffHours = false;
  if (isCurrentlyOffHours) {
    if (timezone) {
      const [priorOffHours] = await db
        .select({ sesUid: sessionsTable.sesUid })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, userId),
            sql`EXTRACT(HOUR FROM (${sessionsTable.createdAt} AT TIME ZONE ${timezone})) >= 2`,
            sql`EXTRACT(HOUR FROM (${sessionsTable.createdAt} AT TIME ZONE ${timezone})) < 5`,
          ),
        )
        .limit(1);
      isOffHours = !priorOffHours;
    } else {
      // No timezone info — fall back to first-ever off-hours heuristic (UTC)
      const [priorOffHours] = await db
        .select({ sesUid: sessionsTable.sesUid })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, userId),
            sql`EXTRACT(HOUR FROM ${sessionsTable.createdAt}) >= 2`,
            sql`EXTRACT(HOUR FROM ${sessionsTable.createdAt}) < 5`,
          ),
        )
        .limit(1);
      isOffHours = !priorOffHours;
    }
  }

  return { isSuspiciousCountry, isNewDevice, isOffHours };
}

async function buildTokens(user: typeof usersTable.$inferSelect, options?: BuildTokensOptions) {
  const { deviceInfo, ipAddress, appVersion, locationCountry, locationCity } = options ?? {};

  let uid = user.userUid;
  if (!uid) {
    uid = generateUserUid(user.id);
    await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user.id));
    await registerUid(uid, "USER", "active");
  }

  const sesUid = generateSessionUid();
  const role: "admin" | "owner" | "user" = user.isAdmin ? "admin" : user.isOwner ? "owner" : "user";

  const deviceFingerprint = computeDeviceFingerprint(deviceInfo, ipAddress);

  let flaggedSuspicious = false;
  if (!options?.skipSuspiciousCheck) {
    const { isSuspiciousCountry, isNewDevice, isOffHours } = await checkSuspiciousLogin(
      user.id,
      deviceFingerprint,
      locationCountry,
    );

    if (isSuspiciousCountry) {
      notifyAsync({
        userId: user.id,
        type: "SUSPICIOUS_LOGIN",
        titleEn: "Suspicious Login Detected",
        titleAr: "تم اكتشاف دخول مريب",
        bodyEn: `A login was detected from a new country: ${locationCountry}. If this was not you, please secure your account.`,
        bodyAr: `تم اكتشاف دخول من دولة جديدة: ${locationCountry}. إذا لم تكن أنت، يرجى تأمين حسابك.`,
      });
      const tempToken = signSuspiciousToken(user.id, { deviceInfo, ipAddress, appVersion, locationCountry, locationCity });
      throw new SuspiciousLoginError(tempToken);
    }

    if (isNewDevice) {
      notifyAsync({
        userId: user.id,
        type: "NEW_DEVICE_LOGIN",
        titleEn: "New Device Login",
        titleAr: "تسجيل دخول من جهاز جديد",
        bodyEn: "A new device was used to log into your account. If this was not you, please secure your account.",
        bodyAr: "تم استخدام جهاز جديد لتسجيل الدخول إلى حسابك. إذا لم تكن أنت، يرجى تأمين حسابك.",
      });
    }

    if (isOffHours) {
      flaggedSuspicious = true;
    }
  }

  const accessToken = signToken({
    sub: uid,
    userId: user.id,
    sesUid,
    role,
    phone: user.phone,
    email: user.email,
    isAdmin: user.isAdmin,
    isOwner: user.isOwner,
  });

  const { rawRefreshToken } = await createSession(user.id, {
    sesUid,
    userUid: uid,
    deviceInfo,
    ipAddress,
    appVersion,
    locationCountry,
    locationCity,
    flaggedSuspicious,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function recordLoginSuccess(userId: number, ip: string) {
  await db.update(usersTable).set({
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    lastLoginIp: ip,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, userId));
}

async function recordLoginFailure(userId: number) {
  const [user] = await db
    .select({ failedLoginCount: usersTable.failedLoginCount })
    .from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;
  const newCount = (user.failedLoginCount ?? 0) + 1;
  const lockedUntil = newCount >= FAILED_LOGIN_MAX ? new Date(Date.now() + LOCK_DURATION_MS) : null;
  await db.update(usersTable).set({
    failedLoginCount: newCount,
    ...(lockedUntil ? { lockedUntil } : {}),
    updatedAt: new Date(),
  }).where(eq(usersTable.id, userId));
}

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket?.remoteAddress ?? "unknown";
}

// ── PHONE + OTP ───────────────────────────────────────────────────────────────

// Spec-aligned alias: POST /auth/register/phone → send OTP, returns { otp_sent: true }
router.post("/auth/register/phone", otpRateLimiter, async (req, res) => {
  try {
    const { phone: rawPhone } = req.body as { phone?: string };
    if (!rawPhone) {
      res.status(400).json({ error: "bad_request", message: "phone is required" });
      return;
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      res.status(400).json({
        error: "invalid_phone",
        message: "Invalid phone number. Use E.164 format e.g. +966501234567",
      });
      return;
    }

    const windowStart60s = new Date(Date.now() - 60 * 1000);
    const recent = await db.select({ id: otpRequestsTable.id }).from(otpRequestsTable).where(
      and(eq(otpRequestsTable.phone, phone), gte(otpRequestsTable.createdAt, windowStart60s))
    );
    if (recent.length >= 1) {
      res.status(429).json({
        error: "rate_limited",
        message: "Please wait 60 seconds before requesting a new code.",
      });
      return;
    }

    const code = generateOtp();
    const otpHash = await hashOtpBcrypt(code);
    const expiresAt = otpExpiresAt();

    await db.insert(otpRequestsTable).values({ phone, code: "HASHED", otpHash, expiresAt });

    const smsResult = await sendOtp(phone, code);
    if (!smsResult.success) {
      req.log.warn({ phone, error: smsResult.error }, "SMS send failed — OTP still stored in DB");
    }

    res.json({ otp_sent: true, ...(IS_DEV || isSmsDevMode() ? { devCode: code } : {}) });
  } catch (err) {
    req.log.error({ err }, "Failed to send registration OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to send OTP" });
  }
});

router.post("/auth/request-otp", otpRateLimiter, async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail } = req.body as { phone?: string; email?: string };
    if (!rawPhone && !rawEmail) {
      res.status(400).json({ error: "bad_request", message: "phone or email required" });
      return;
    }

    let phone: string | null = null;
    let email: string | null = null;

    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone) {
        res.status(400).json({
          error: "invalid_phone",
          message: "Invalid phone number. Use E.164 format e.g. +966501234567",
        });
        return;
      }
    }

    if (rawEmail) {
      if (!validateEmail(rawEmail)) {
        res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
        return;
      }
      email = rawEmail.trim().toLowerCase();
    }

    // Rate limit: max 1 resend per 60 seconds per identifier
    const windowStart60s = new Date(Date.now() - 60 * 1000);
    const recentCondition = phone
      ? and(eq(otpRequestsTable.phone, phone), gte(otpRequestsTable.createdAt, windowStart60s))
      : and(eq(otpRequestsTable.email, email!), gte(otpRequestsTable.createdAt, windowStart60s));
    const recent = await db.select({ id: otpRequestsTable.id }).from(otpRequestsTable).where(recentCondition);
    if (recent.length >= 1) {
      res.status(429).json({
        error: "rate_limited",
        message: "Please wait 60 seconds before requesting a new code. / انتظر 60 ثانية قبل طلب رمز جديد.",
      });
      return;
    }

    const code = generateOtp();
    const otpHash = await hashOtpBcrypt(code);
    const expiresAt = otpExpiresAt();

    await db.insert(otpRequestsTable).values({
      phone: phone ?? null,
      email: email ?? null,
      code: "HASHED",
      otpHash,
      expiresAt,
    });

    if (phone) {
      const smsResult = await sendOtp(phone, code);
      if (!smsResult.success) {
        req.log.warn({ phone, error: smsResult.error }, "SMS send failed — OTP still stored in DB");
      }
    }

    if (isSmsDevMode() || email) {
      req.log.info({ code, channel: phone ? "phone" : "email" }, "OTP generated (dev/email mode)");
      res.json({ message: "OTP sent", devCode: IS_DEV ? code : undefined });
    } else {
      res.json({ message: "OTP sent / تم إرسال رمز التحقق" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to request OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to request OTP" });
  }
});

router.post("/auth/verify-otp", otpRateLimiter, async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail, code, nameEn, nameAr, displayName, preferredLanguage = "en", cityId, username: rawUsername } = req.body as {
      phone?: string;
      email?: string;
      code: string;
      nameEn?: string;
      nameAr?: string;
      displayName?: string;
      preferredLanguage?: string;
      cityId?: number;
      username?: string;
    };

    if (!code || (!rawPhone && !rawEmail) || (rawPhone && rawEmail)) {
      res.status(400).json({ error: "bad_request", message: "Provide exactly one of phone or email, plus code" });
      return;
    }

    // Validate and normalize optional username
    let otpNormalizedUsername: string | null = null;
    if (rawUsername) {
      const uv = validateUsername(rawUsername);
      if (!uv.valid) {
        res.status(400).json({ error: "INVALID_USERNAME", message: uv.reason });
        return;
      }
      otpNormalizedUsername = rawUsername.trim().toLowerCase();
      const [existingUname] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(sql`LOWER(${usersTable.username}) = ${otpNormalizedUsername}`)
        .limit(1);
      if (existingUname) {
        res.status(409).json({ error: "USERNAME_TAKEN", message: "Username is already taken" });
        return;
      }
    }

    let phone: string | null = null;
    let email: string | null = null;

    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone) {
        res.status(400).json({ error: "invalid_phone", message: "Invalid phone number format" });
        return;
      }
    }

    if (rawEmail) {
      if (!validateEmail(rawEmail)) {
        res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
        return;
      }
      email = rawEmail.trim().toLowerCase();
    }

    const otpType: "phone" | "email" = phone ? "phone" : "email";
    const identifier = phone ?? email!;

    // Check for existing user account lock
    const existingUser = await db
      .select({ id: usersTable.id, lockedUntil: usersTable.lockedUntil, failedLoginCount: usersTable.failedLoginCount, userUid: usersTable.userUid, isAdmin: usersTable.isAdmin, isOwner: usersTable.isOwner, phone: usersTable.phone, email: usersTable.email })
      .from(usersTable)
      .where(phone ? eq(usersTable.phone, phone) : eq(usersTable.email, email!))
      .limit(1)
      .then(r => r[0]);

    if (existingUser?.lockedUntil && existingUser.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((existingUser.lockedUntil.getTime() - Date.now()) / 1000);
      res.status(403).json({
        error: "ACCOUNT_LOCKED",
        message: "Account temporarily locked due to too many failed attempts.",
        retry_after: retryAfter,
      });
      return;
    }

    const now = new Date();

    // Find the most recent valid (unexpired, unused) OTP
    const [otp] = await db.select().from(otpRequestsTable).where(
      and(
        phone ? eq(otpRequestsTable.phone, phone) : eq(otpRequestsTable.email, email!),
        isNull(otpRequestsTable.usedAt),
        gt(otpRequestsTable.expiresAt, now),
      )
    ).orderBy(desc(otpRequestsTable.createdAt)).limit(1);

    if (!otp) {
      if (existingUser) await recordLoginFailure(existingUser.id);
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
      return;
    }

    // Compare — bcrypt hash (new) or fall back to SHA-256 hash for legacy OTPs
    const storedHash = otp.otpHash ?? "";
    let hashMatch = false;
    if (storedHash && storedHash !== "LEGACY") {
      if (storedHash.startsWith("$2")) {
        hashMatch = await verifyOtpBcrypt(code, storedHash);
      } else {
        hashMatch = storedHash === crypto.createHash("sha256").update(code).digest("hex");
      }
    }

    if (!hashMatch) {
      // Increment attempts on this specific OTP row
      const newAttempts = (otp.attempts ?? 0) + 1;
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        // Void this OTP
        await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));
        if (existingUser) await recordLoginFailure(existingUser.id);
        res.status(401).json({
          error: "OTP_VOID",
          message: "Too many failed attempts. Please request a new code.",
        });
      } else {
        await db.update(otpRequestsTable).set({ attempts: newAttempts }).where(eq(otpRequestsTable.id, otp.id));
        if (existingUser) await recordLoginFailure(existingUser.id);
        res.status(401).json({
          error: "invalid_otp",
          message: "Invalid OTP",
          attemptsRemaining: OTP_MAX_ATTEMPTS - newAttempts,
        });
      }
      return;
    }

    // Mark OTP as used immediately (prevent replay)
    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));

    let user: typeof usersTable.$inferSelect;

    if (!existingUser) {
      const levelInfo = calcLevel(0);
      const [created] = await db.insert(usersTable).values({
        phone: phone ?? null,
        email: email ?? null,
        username: otpNormalizedUsername,
        displayName: displayName?.trim() ?? null,
        nameEn: nameEn ?? null,
        nameAr: nameAr ?? null,
        preferredLanguage,
        cityId: cityId ?? null,
        level: levelInfo.level,
        levelTitle: levelInfo.levelTitle,
        isEmailVerified: otpType === "email",
      }).returning();
      user = created!;
      // Backfill user_uid
      const uid = generateUserUid(user.id);
      await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user.id));
      user = { ...user, userUid: uid };
      await registerUid(uid, "USER", "active");
    } else {
      let updated = existingUser as unknown as typeof usersTable.$inferSelect;
      if (otpType === "email") {
        const [u] = await db.update(usersTable)
          .set({ isEmailVerified: true, updatedAt: new Date() })
          .where(eq(usersTable.id, existingUser.id))
          .returning();
        updated = u!;
      }
      user = updated;
    }

    const ip = getClientIp(req);
    await recordLoginSuccess(user.id, ip);

    const deviceInfo = req.headers["user-agent"] ?? undefined;
    const appVersion = req.headers["x-app-version"] as string | undefined;
    const locationCountry = req.headers["x-country-code"] as string | undefined;
    try {
      const { accessToken, refreshToken } = await buildTokens(user, {
        deviceInfo: typeof deviceInfo === "string" ? deviceInfo : undefined,
        ipAddress: ip,
        appVersion,
        locationCountry,
      });

      res.cookie("tabaq_token", accessToken, {
        httpOnly: true,
        secure: !IS_DEV,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.json({ token: accessToken, access_token: accessToken, refresh_token: refreshToken, user_uid: user.userUid, accessToken, refreshToken, user });
    } catch (tokenErr) {
      if (tokenErr instanceof SuspiciousLoginError) {
        const newOtpCode = generateOtp();
        const newOtpHash = await hashOtpBcrypt(newOtpCode);
        await db.insert(otpRequestsTable).values({
          phone: phone ?? null,
          email: email ?? null,
          otpHash: newOtpHash,
          expiresAt: otpExpiresAt(),
        });
        if (phone) sendOtp(phone, newOtpCode).catch(() => {});
        res.status(202).json({
          requires_otp: true,
          suspicious_reason: "new_country",
          temp_token: tokenErr.tempToken,
          ...(IS_DEV ? { devCode: newOtpCode } : {}),
        });
        return;
      }
      throw tokenErr;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to verify OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to verify OTP" });
  }
});

// ── EMAIL + PASSWORD ──────────────────────────────────────────────────────────

router.post("/auth/register", registerRateLimiter, async (req, res) => {
  try {
    const { email: rawEmail, password, nameEn, nameAr, displayName, preferredLanguage = "en", cityId, username: rawUsername } = req.body as {
      email?: string;
      password?: string;
      nameEn?: string;
      nameAr?: string;
      displayName?: string;
      preferredLanguage?: string;
      cityId?: number;
      username?: string;
    };

    if (!rawEmail || !password) {
      res.status(400).json({ error: "bad_request", message: "email and password are required" });
      return;
    }

    if (!validateEmail(rawEmail)) {
      res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      res.status(400).json({
        error: "PASSWORD_TOO_WEAK",
        message: "Password does not meet requirements",
        requirements: strength.reasons,
      });
      return;
    }

    const email = rawEmail.trim().toLowerCase();

    // Validate and normalize username if provided
    let normalizedUsername: string | null = null;
    if (rawUsername) {
      const uv = validateUsername(rawUsername);
      if (!uv.valid) {
        res.status(400).json({ error: "INVALID_USERNAME", message: uv.reason });
        return;
      }
      normalizedUsername = rawUsername.trim().toLowerCase();
      const [existingUname] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(sql`LOWER(${usersTable.username}) = ${normalizedUsername}`)
        .limit(1);
      if (existingUname) {
        res.status(409).json({ error: "USERNAME_TAKEN", message: "Username is already taken" });
        return;
      }
    }

    // App-level uniqueness check (gives a clear error before hitting DB constraint)
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "EMAIL_ALREADY_EXISTS", message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const levelInfo = calcLevel(0);

    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      username: normalizedUsername,
      displayName: displayName?.trim() ?? null,
      nameEn: nameEn ?? null,
      nameAr: nameAr ?? null,
      preferredLanguage,
      cityId: cityId ?? null,
      level: levelInfo.level,
      levelTitle: levelInfo.levelTitle,
      isEmailVerified: false,
    }).returning();

    const uid = generateUserUid(user!.id);
    await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user!.id));
    await registerUid(uid, "USER", "active");

    // Generate email verification OTP
    const code = generateOtp();
    const otpHash = await hashOtpBcrypt(code);
    await db.insert(otpRequestsTable).values({
      email,
      code: "HASHED",
      otpHash,
      expiresAt: otpExpiresAt(),
    });

    req.log.info({ userId: user!.id, email }, "Registration: email verification OTP generated");

    // Create session immediately so the client can act as an authenticated (unverified) user
    const registeredUser = { ...user!, userUid: uid };
    const tokens = await buildTokens(registeredUser, {
      deviceInfo: req.headers["x-device-info"] as string | undefined,
      ipAddress: req.ip,
      appVersion: req.headers["x-app-version"] as string | undefined,
      locationCountry: req.headers["x-country-code"] as string | undefined,
      locationCity: req.headers["x-city"] as string | undefined,
      skipSuspiciousCheck: true,
    });

    res.status(201).json({
      message: "Account created. Please verify your email.",
      userId: user!.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ...(IS_DEV ? { devEmailOtp: code } : {}),
    });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      res.status(409).json({ error: "EMAIL_ALREADY_EXISTS", message: "An account with this email already exists" });
      return;
    }
    req.log.error({ err }, "Failed to register");
    res.status(500).json({ error: "internal_error", message: "Failed to register" });
  }
});

router.post("/auth/login", loginRateLimiter, async (req, res) => {
  try {
    // Accept identifier (generic) or email (legacy field name) interchangeably
    const rawIdentifier: string = ((req.body as Record<string, unknown>).identifier as string)
      || ((req.body as Record<string, unknown>).email as string)
      || "";
    const { password } = req.body as { password?: string };

    if (!rawIdentifier || !password) {
      res.status(400).json({ error: "bad_request", message: "email (or username/phone) and password are required" });
      return;
    }

    const identifierType = classifyIdentifier(rawIdentifier);

    // Resolve user via one of three lookup strategies
    let user: typeof usersTable.$inferSelect | undefined;

    if (identifierType === "email") {
      if (!validateEmail(rawIdentifier)) {
        res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
        return;
      }
      const email = rawIdentifier.trim().toLowerCase();
      [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    } else if (identifierType === "phone") {
      const phone = normalizePhone(rawIdentifier.trim());
      if (!phone) {
        res.status(400).json({ error: "invalid_phone", message: "Invalid phone number format" });
        return;
      }
      [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);

    } else {
      // Username — case-insensitive lookup via the partial LOWER() index
      const username = rawIdentifier.trim().toLowerCase();
      [user] = await db.select().from(usersTable)
        .where(sql`LOWER(${usersTable.username}) = ${username}`)
        .limit(1);
    }

    // Always spend time on bcrypt to prevent timing attacks even if user not found
    const dummyHash = "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
    const hashToCompare = user?.passwordHash ?? dummyHash;

    if (!user) {
      await bcrypt.compare(password, dummyHash);
      res.status(401).json({ error: "invalid_credentials", message: "Invalid credentials" });
      return;
    }

    // Account lock check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await bcrypt.compare(password, dummyHash); // constant time
      const retryAfter = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      res.status(403).json({
        error: "ACCOUNT_LOCKED",
        message: "Account temporarily locked due to too many failed attempts.",
        retry_after: retryAfter,
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({
        error: "no_password",
        message: "This account uses phone/OTP login. Please sign in with your phone number.",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!passwordMatch) {
      await recordLoginFailure(user.id);
      res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        error: "email_not_verified",
        message: "Please verify your email before logging in.",
      });
      return;
    }

    const ip = getClientIp(req);
    await recordLoginSuccess(user.id, ip);

    // Admin TOTP gate — if TOTP is enabled for this user, issue a short-lived
    // temp token and require the client to complete MFA before getting full access.
    if (user.totpEnabledAt) {
      const tempToken = signTempToken(user.id);
      res.json({ requires_totp: true, temp_token: tempToken });
      return;
    }

    const deviceInfo = req.headers["user-agent"];
    const appVersion = req.headers["x-app-version"] as string | undefined;
    const locationCountry = req.headers["x-country-code"] as string | undefined;
    try {
      const { accessToken, refreshToken } = await buildTokens(user, {
        deviceInfo: typeof deviceInfo === "string" ? deviceInfo : undefined,
        ipAddress: ip,
        appVersion,
        locationCountry,
      });

      res.cookie("tabaq_token", accessToken, {
        httpOnly: true,
        secure: !IS_DEV,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.json({ token: accessToken, accessToken, refreshToken, user });
    } catch (tokenErr) {
      if (tokenErr instanceof SuspiciousLoginError) {
        const newOtpCode = generateOtp();
        const newOtpHash = await hashOtpBcrypt(newOtpCode);
        const userEmail = user.email;
        const userPhone = user.phone;
        await db.insert(otpRequestsTable).values({
          phone: userPhone ?? null,
          email: userEmail ?? null,
          otpHash: newOtpHash,
          expiresAt: otpExpiresAt(),
        });
        if (userPhone) sendOtp(userPhone, newOtpCode).catch(() => {});
        res.status(202).json({
          requires_otp: true,
          suspicious_reason: "new_country",
          temp_token: tokenErr.tempToken,
          ...(IS_DEV ? { devCode: newOtpCode } : {}),
        });
        return;
      }
      throw tokenErr;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(500).json({ error: "internal_error", message: "Failed to login" });
  }
});

// ── CHECK USERNAME AVAILABILITY ────────────────────────────────────────────────

router.post("/auth/check-username", async (req, res) => {
  try {
    const { username } = req.body as { username?: string };
    const trimmed = (username ?? "").trim();

    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      res.json({ available: false, reason: validation.reason });
      return;
    }

    const normalizedLower = trimmed.toLowerCase();
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`LOWER(${usersTable.username}) = ${normalizedLower}`)
      .limit(1);

    res.json({ available: !existing, reason: existing ? "Username is already taken" : null });
  } catch (err) {
    req.log.error({ err }, "Failed to check username");
    res.status(500).json({ error: "internal_error", message: "Failed to check username availability" });
  }
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────

router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken: rawToken } = req.body as { refreshToken?: string };

    const token = rawToken ?? req.headers["x-refresh-token"];
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "bad_request", message: "refreshToken is required" });
      return;
    }

    const jwtPayload = verifyRefreshToken(token);
    if (!jwtPayload) {
      res.status(401).json({ error: "invalid_refresh_token", message: "Refresh token signature is invalid" });
      return;
    }

    const tokenHash = hashRefreshToken(token);
    const now = new Date();

    // Primary lookup: find session by current refresh_token_hash
    const [sessionByCurrent] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.refreshTokenHash, tokenHash))
      .limit(1);

    if (sessionByCurrent) {
      // Cross-validate sesUid from JWT payload to catch any token/session mismatch
      if (sessionByCurrent.sesUid !== jwtPayload.sesUid) {
        await revokeAllUserSessions(jwtPayload.userId);
        res.status(401).json({ error: "TOKEN_REUSED", message: "Refresh token has already been used. All sessions have been revoked for security." });
        return;
      }

      // Session intentionally revoked (logout) — hash matches, session is revoked
      if (sessionByCurrent.isRevoked) {
        res.status(401).json({ error: "session_revoked", message: "Session has been revoked. Please log in again." });
        return;
      }

      // Valid session with matching hash — continue with rotation below using sessionByCurrent
    } else {
      // Hash not found as current — check if it's a previous hash (theft: already-rotated token replayed)
      const [sessionByPrev] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.prevRefreshTokenHash, tokenHash))
        .limit(1);

      if (sessionByPrev) {
        await revokeAllUserSessions(sessionByPrev.userId);
        res.status(401).json({ error: "TOKEN_REUSED", message: "Refresh token has already been used. All sessions have been revoked for security." });
        return;
      }

      // Hash found in neither current nor prev — older replay or session cleaned up
      await revokeAllUserSessions(jwtPayload.userId);
      res.status(401).json({ error: "TOKEN_REUSED", message: "Refresh token has already been used. All sessions have been revoked for security." });
      return;
    }

    const session = sessionByCurrent;

    if (session.expiresAt <= now) {
      res.status(401).json({ error: "invalid_refresh_token", message: "Refresh token has expired" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "user_not_found", message: "User not found" });
      return;
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      const retryAfter = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      res.status(403).json({ error: "ACCOUNT_LOCKED", message: "Account is locked", retry_after: retryAfter });
      return;
    }

    // Issue new access token using the SAME sesUid (session continuity)
    let uid = user.userUid;
    if (!uid) {
      uid = generateUserUid(user.id);
      await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user.id));
    }
    const role: "admin" | "owner" | "user" = user.isAdmin ? "admin" : user.isOwner ? "owner" : "user";
    const newAccessToken = signToken({
      sub: uid,
      userId: user.id,
      sesUid: session.sesUid,
      role,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
    });

    // Generate new refresh token (JWT) and rotate in-place
    const newRawRefreshToken = signRefreshToken(session.sesUid, user.id);
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

    await db
      .update(sessionsTable)
      .set({
        prevRefreshTokenHash: tokenHash,
        refreshTokenHash: newTokenHash,
        lastUsedAt: now,
        expiresAt: newExpiresAt,
        ipAddress: getClientIp(req),
      })
      .where(eq(sessionsTable.sesUid, session.sesUid));

    res.cookie("tabaq_token", newAccessToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRawRefreshToken });
  } catch (err) {
    req.log.error({ err }, "Failed to refresh token");
    res.status(500).json({ error: "internal_error", message: "Failed to refresh token" });
  }
});

// ── CONFIRM SUSPICIOUS LOGIN ───────────────────────────────────────────────────

router.post("/auth/confirm-suspicious", loginRateLimiter, async (req, res) => {
  try {
    const { temp_token: tempToken, code } = req.body as { temp_token?: string; code?: string };

    if (!tempToken || !code) {
      res.status(400).json({ error: "bad_request", message: "temp_token and code are required" });
      return;
    }

    const payload = verifySuspiciousToken(tempToken);
    if (!payload) {
      res.status(401).json({ error: "invalid_token", message: "Verification token is invalid or expired" });
      return;
    }

    const { userId, deviceInfo, ipAddress, appVersion, locationCountry, locationCity } = payload;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "user_not_found", message: "User not found" });
      return;
    }

    const now = new Date();

    const identifier = user.phone
      ? eq(otpRequestsTable.phone, user.phone)
      : user.email
        ? eq(otpRequestsTable.email, user.email)
        : null;

    if (!identifier) {
      res.status(400).json({ error: "no_identifier", message: "No phone or email on account" });
      return;
    }

    const [otp] = await db
      .select()
      .from(otpRequestsTable)
      .where(and(identifier, isNull(otpRequestsTable.usedAt), gt(otpRequestsTable.expiresAt, now)))
      .orderBy(desc(otpRequestsTable.createdAt))
      .limit(1);

    if (!otp) {
      res.status(401).json({ error: "invalid_otp", message: "Code is invalid or expired. Please request a new one." });
      return;
    }

    const storedHash = otp.otpHash ?? "";
    let hashMatch = false;
    if (storedHash.startsWith("$2")) {
      hashMatch = await verifyOtpBcrypt(code, storedHash);
    } else {
      hashMatch = storedHash === crypto.createHash("sha256").update(code).digest("hex");
    }

    if (!hashMatch) {
      const newAttempts = (otp.attempts ?? 0) + 1;
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));
        res.status(401).json({ error: "OTP_VOID", message: "Too many failed attempts. Please request a new code." });
      } else {
        await db.update(otpRequestsTable).set({ attempts: newAttempts }).where(eq(otpRequestsTable.id, otp.id));
        res.status(401).json({ error: "invalid_otp", message: "Invalid code", attemptsRemaining: OTP_MAX_ATTEMPTS - newAttempts });
      }
      return;
    }

    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));

    const { accessToken, refreshToken } = await buildTokens(user, {
      deviceInfo,
      ipAddress,
      appVersion,
      locationCountry,
      locationCity,
      skipSuspiciousCheck: true,
    });

    res.cookie("tabaq_token", accessToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_uid: user.userUid,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm suspicious login");
    res.status(500).json({ error: "internal_error", message: "Failed to confirm login" });
  }
});

// ── ME ────────────────────────────────────────────────────────────────────────

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    // Strip sensitive fields; expose computed boolean flags instead
    const { passwordHash, passcodeHash, passcodeFailedAttempts, passcodeLockedUntil, ...safeUser } = user;
    res.json({
      user: {
        ...safeUser,
        hasPassword: !!passwordHash,
        hasPasscode: !!passcodeHash,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch /me");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

// ── EMAIL VERIFICATION (token-link flow) ─────────────────────────────────────

router.post("/auth/verify-email/request", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, isEmailVerified: usersTable.isEmailVerified })
      .from(usersTable).where(eq(usersTable.id, userId));

    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    if (user.isEmailVerified) { res.status(400).json({ error: "already_verified", message: "Email already verified" }); return; }
    if (!user.email) { res.status(400).json({ error: "no_email", message: "No email address on account" }); return; }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailVerificationTokensTable).values({ userId, token, expiresAt });

    const verifyUrl = `${process.env["APP_URL"] ?? "https://tabaq.app"}/verify-email?token=${token}`;
    req.log.info({ userId }, "Email verification link generated");

    res.json({
      message: "Verification link generated",
      ...(IS_DEV ? { devVerifyUrl: verifyUrl, devToken: token } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to request email verification");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/auth/verify-email/confirm", async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) { res.status(400).json({ error: "bad_request", message: "token required" }); return; }

    const now = new Date();
    const [record] = await db.select().from(emailVerificationTokensTable).where(
      and(
        eq(emailVerificationTokensTable.token, token),
        isNull(emailVerificationTokensTable.usedAt),
        gt(emailVerificationTokensTable.expiresAt, now),
      )
    ).limit(1);

    if (!record) {
      res.status(400).json({ error: "invalid_token", message: "Invalid or expired verification link" });
      return;
    }

    await db.update(emailVerificationTokensTable).set({ usedAt: now }).where(eq(emailVerificationTokensTable.id, record.id));
    const [user] = await db.update(usersTable).set({ isEmailVerified: true, updatedAt: now })
      .where(eq(usersTable.id, record.userId))
      .returning({ id: usersTable.id, isEmailVerified: usersTable.isEmailVerified, points: usersTable.points });

    if (user) await awardPoints(record.userId, POINTS.EMAIL_VERIFIED);
    res.json({ message: "Email verified successfully", userId: record.userId });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm email verification");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────

router.post("/auth/logout", requireAuth, async (req, res) => {
  const sesUid = req.auth!.sesUid;
  if (sesUid) {
    await db
      .update(sessionsTable)
      .set({ isRevoked: true, lastUsedAt: new Date() })
      .where(eq(sessionsTable.sesUid, sesUid))
      .catch(() => {});
  }
  res.clearCookie("tabaq_token");
  res.json({ message: "Logged out" });
});

// ── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

router.post("/auth/oauth/google", authRateLimiter, async (req, res) => {
  try {
    const { id_token: idToken } = req.body as { id_token?: string };
    if (!idToken) {
      res.status(400).json({ error: "bad_request", message: "id_token is required" });
      return;
    }

    const clientId = process.env["GOOGLE_CLIENT_ID"];
    if (!clientId) {
      res.status(500).json({ error: "configuration_error", message: "Google OAuth is not configured" });
      return;
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: clientId });
    } catch {
      res.status(401).json({ error: "invalid_token", message: "Google ID token verification failed" });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ error: "invalid_token", message: "Empty token payload" });
      return;
    }

    const googleId = payload["sub"];
    if (!googleId) {
      res.status(401).json({ error: "invalid_token", message: "Missing sub claim in Google token" });
      return;
    }
    const email = payload["email"]?.trim().toLowerCase() ?? null;
    const emailVerified = payload["email_verified"] === true;
    const name = payload["name"] ?? null;
    const picture = payload["picture"] ?? null;

    // Lookup: by google_id first, then by verified email only
    let existingUser: typeof usersTable.$inferSelect | null = await db.select().from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1)
      .then((r: (typeof usersTable.$inferSelect)[]) => r[0] ?? null);

    // Email-based linking is only safe when Google has verified the email address
    if (!existingUser && email && emailVerified) {
      existingUser = await db.select().from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1)
        .then((r: (typeof usersTable.$inferSelect)[]) => r[0] ?? null);
    }

    const ip = getClientIp(req);
    const deviceInfo = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

    let user: typeof usersTable.$inferSelect;
    let isNewUser = false;

    if (existingUser) {
      // Link Google provider if not already linked
      const providers: string[] = (existingUser.authProviders as string[] | null) ?? [];
      const updatedProviders = providers.includes("google") ? providers : [...providers, "google"];
      const [updated] = await db.update(usersTable).set({
        googleId,
        authProviders: updatedProviders,
        profilePictureUrl: existingUser.profilePictureUrl ?? picture ?? null,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, existingUser.id)).returning();
      user = updated!;
      await recordLoginSuccess(user.id, ip);
    } else {
      // Create new user
      const levelInfo = calcLevel(0);
      const [created] = await db.insert(usersTable).values({
        email: email ?? null,
        googleId,
        displayName: name ?? null,
        profilePictureUrl: picture ?? null,
        authProviders: ["google"],
        isEmailVerified: true,
        level: levelInfo.level,
        levelTitle: levelInfo.levelTitle,
      }).returning();
      user = created!;
      const uid = generateUserUid(user.id);
      await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user.id));
      user = { ...user, userUid: uid };
      isNewUser = true;
    }

    const locationCountry = req.headers["x-country-code"] as string | undefined;
    const { accessToken, refreshToken } = await buildTokens(user, {
      deviceInfo: typeof deviceInfo === "string" ? deviceInfo : undefined,
      ipAddress: ip,
      locationCountry,
      skipSuspiciousCheck: isNewUser,
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_uid: user.userUid,
      is_new_user: isNewUser,
    });
  } catch (err) {
    req.log.error({ err }, "Google OAuth failed");
    res.status(500).json({ error: "internal_error", message: "Google OAuth authentication failed" });
  }
});

// ── APPLE SIGN-IN ─────────────────────────────────────────────────────────────

router.post("/auth/oauth/apple", authRateLimiter, async (req, res) => {
  try {
    // user_name and user_email are first-login metadata sent by Apple on device
    // user_email is accepted for completeness but is NOT used for identity lookups —
    // only the cryptographically verified token claim is trusted for account matching
    const { identity_token: identityToken, user_name: userName, user_email: _userEmail } = req.body as {
      identity_token?: string;
      user_name?: string;
      user_email?: string;
    };

    if (!identityToken) {
      res.status(400).json({ error: "bad_request", message: "identity_token is required" });
      return;
    }

    const clientId = process.env["APPLE_CLIENT_ID"];
    const teamId = process.env["APPLE_TEAM_ID"];
    const keyId = process.env["APPLE_KEY_ID"];
    const privateKey = process.env["APPLE_PRIVATE_KEY"];

    if (!clientId) {
      res.status(500).json({ error: "configuration_error", message: "Apple Sign-In is not configured" });
      return;
    }

    // For the mobile-first pattern, APPLE_CLIENT_ID is the only required config:
    // apple-signin-auth fetches Apple's public JWKS and verifies the token signature.
    // APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY enable server-to-server calls
    // (e.g. token revocation, transfer), but are not required for ID token verification.
    // They are included in .env.example for completeness and production hardening.
    const verifyOptions: Record<string, unknown> = {
      audience: clientId,
      ignoreExpiration: false,
    };
    if (teamId && keyId && privateKey) {
      verifyOptions["teamId"] = teamId;
      verifyOptions["keyId"] = keyId;
      verifyOptions["privateKey"] = privateKey.replace(/\\n/g, "\n");
    }

    let applePayload: { sub: string; email?: string };
    try {
      applePayload = await appleSignin.verifyIdToken(identityToken, verifyOptions) as { sub: string; email?: string };
    } catch {
      res.status(401).json({ error: "invalid_token", message: "Apple identity token verification failed" });
      return;
    }

    const appleId = applePayload.sub;
    if (!appleId) {
      res.status(401).json({ error: "invalid_token", message: "Missing sub claim in Apple token" });
      return;
    }
    // Only trust the email claim from the cryptographically verified token.
    // Apple only sends it on the very first login; subsequent logins omit it.
    const tokenEmail = applePayload.email ? applePayload.email.trim().toLowerCase() : null;

    // Lookup by apple_id (primary) then by token-verified email (secondary, only when present)
    let existingUser: typeof usersTable.$inferSelect | null = await db.select().from(usersTable)
      .where(eq(usersTable.appleId, appleId))
      .limit(1)
      .then((r: (typeof usersTable.$inferSelect)[]) => r[0] ?? null);

    if (!existingUser && tokenEmail) {
      existingUser = await db.select().from(usersTable)
        .where(eq(usersTable.email, tokenEmail))
        .limit(1)
        .then((r: (typeof usersTable.$inferSelect)[]) => r[0] ?? null);
    }

    const ip = getClientIp(req);
    const deviceInfo = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

    let user: typeof usersTable.$inferSelect;
    let isNewUser = false;

    if (existingUser) {
      // Link Apple provider if not already linked
      const providers: string[] = (existingUser.authProviders as string[] | null) ?? [];
      const updatedProviders = providers.includes("apple") ? providers : [...providers, "apple"];
      const [updated] = await db.update(usersTable).set({
        appleId,
        authProviders: updatedProviders,
        // Persist email from verified token if the account has none yet
        email: existingUser.email ?? tokenEmail,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, existingUser.id)).returning();
      user = updated!;
      await recordLoginSuccess(user.id, ip);
    } else {
      // Create new user — display name from body is metadata only, not identity
      const levelInfo = calcLevel(0);
      const displayName = userName?.trim() ?? null;
      const [created] = await db.insert(usersTable).values({
        email: tokenEmail,
        appleId,
        displayName,
        authProviders: ["apple"],
        isEmailVerified: true,
        level: levelInfo.level,
        levelTitle: levelInfo.levelTitle,
      }).returning();
      user = created!;
      const uid = generateUserUid(user.id);
      await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user.id));
      user = { ...user, userUid: uid };
      isNewUser = true;
    }

    const locationCountry = req.headers["x-country-code"] as string | undefined;
    const { accessToken, refreshToken } = await buildTokens(user, {
      deviceInfo: typeof deviceInfo === "string" ? deviceInfo : undefined,
      ipAddress: ip,
      locationCountry,
      skipSuspiciousCheck: isNewUser,
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_uid: user.userUid,
      is_new_user: isNewUser,
    });
  } catch (err) {
    req.log.error({ err }, "Apple Sign-In failed");
    res.status(500).json({ error: "internal_error", message: "Apple Sign-In authentication failed" });
  }
});

// ── MEMBERSHIP ────────────────────────────────────────────────────────────────

router.get("/auth/me/membership", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({ goldPlan: usersTable.goldPlan, goldBilling: usersTable.goldBilling, goldSince: usersTable.goldSince })
      .from(usersTable).where(eq(usersTable.id, req.auth!.userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ goldPlan: user.goldPlan ?? null, goldBilling: user.goldBilling ?? null, goldSince: user.goldSince ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch membership");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/auth/me/membership", requireAuth, async (req, res) => {
  try {
    const { plan, billing } = req.body as { plan?: string; billing?: string };
    const VALID_PLANS = ["gourmet", "elite", null, "explorer"];
    const VALID_BILLING = ["monthly", "annual", null];

    if (!VALID_PLANS.includes(plan ?? null)) { res.status(400).json({ error: "bad_request", message: "Invalid plan" }); return; }
    if (billing !== undefined && !VALID_BILLING.includes(billing ?? null)) { res.status(400).json({ error: "bad_request", message: "Invalid billing cycle" }); return; }

    const resolvedPlan = (plan === "explorer" || !plan) ? null : plan;
    const resolvedBilling = resolvedPlan ? (billing ?? "annual") : null;
    const resolvedSince = resolvedPlan ? new Date() : null;

    await db.update(usersTable).set({
      goldPlan: resolvedPlan,
      goldBilling: resolvedBilling,
      goldSince: resolvedSince,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, req.auth!.userId));

    res.json({ goldPlan: resolvedPlan, goldBilling: resolvedBilling, goldSince: resolvedSince });
  } catch (err) {
    req.log.error({ err }, "Failed to update membership");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
