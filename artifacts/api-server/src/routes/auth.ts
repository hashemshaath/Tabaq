import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, otpRequestsTable, emailVerificationTokensTable, refreshTokensTable } from "@workspace/db/schema";
import { eq, and, isNull, gt, desc, gte, sql } from "drizzle-orm";
import {
  signToken,
  signTempToken,
  generateOtp,
  hashOtpBcrypt,
  verifyOtpBcrypt,
  otpExpiresAt,
  generateRefreshToken,
  hashRefreshToken,
  normalizePhone,
  validateEmail,
  validatePasswordStrength,
  validateUsername,
  classifyIdentifier,
  REFRESH_TOKEN_EXPIRES_IN_MS,
} from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { sendOtp, isSmsDevMode } from "../services/smsService.js";
import { awardPoints, POINTS } from "../lib/points.js";
import crypto from "crypto";

const router: IRouter = Router();

const IS_DEV = process.env["NODE_ENV"] !== "production";
const BCRYPT_ROUNDS = 12;
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

async function buildTokens(user: typeof usersTable.$inferSelect, deviceInfo?: string, ipAddress?: string) {
  const uid = user.userUid ?? generateUserUid(user.id);
  const role: "admin" | "owner" | "user" = user.isAdmin ? "admin" : user.isOwner ? "owner" : "user";
  const accessToken = signToken({
    sub: uid,
    userId: user.id,
    role,
    phone: user.phone,
    email: user.email,
    isAdmin: user.isAdmin,
    isOwner: user.isOwner,
  });

  const rawRefresh = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    tokenHash,
    deviceInfo: deviceInfo ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt,
  });

  return { accessToken, refreshToken: rawRefresh };
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
router.post("/auth/register/phone", authRateLimiter, async (req, res) => {
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

router.post("/auth/request-otp", authRateLimiter, async (req, res) => {
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

router.post("/auth/verify-otp", authRateLimiter, async (req, res) => {
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
      if (newAttempts >= 3) {
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
          attemptsRemaining: 3 - newAttempts,
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
    const { accessToken, refreshToken } = await buildTokens(user, typeof deviceInfo === "string" ? deviceInfo : undefined, ip);

    res.cookie("tabaq_token", accessToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ token: accessToken, access_token: accessToken, refresh_token: refreshToken, user_uid: user.userUid, accessToken, refreshToken, user });
  } catch (err) {
    req.log.error({ err }, "Failed to verify OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to verify OTP" });
  }
});

// ── EMAIL + PASSWORD ──────────────────────────────────────────────────────────

router.post("/auth/register", authRateLimiter, async (req, res) => {
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
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

    res.status(201).json({
      message: "Account created. Please verify your email.",
      userId: user!.id,
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

router.post("/auth/login", authRateLimiter, async (req, res) => {
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
    const { accessToken, refreshToken } = await buildTokens(user, typeof deviceInfo === "string" ? deviceInfo : undefined, ip);

    res.cookie("tabaq_token", accessToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ token: accessToken, accessToken, refreshToken, user });
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

    // Also accept from Authorization header (Bearer <refreshToken>)
    const token = rawToken ?? req.headers["x-refresh-token"];
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "bad_request", message: "refreshToken is required" });
      return;
    }

    const tokenHash = hashRefreshToken(token);
    const now = new Date();

    // First look up the token regardless of revocation state — detect reuse attacks
    const [record] = await db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.tokenHash, tokenHash),
          gt(refreshTokensTable.expiresAt, now),
        )
      )
      .limit(1);

    if (!record) {
      res.status(401).json({ error: "invalid_refresh_token", message: "Refresh token is invalid or expired" });
      return;
    }

    // If this token was already used/revoked, it's a reuse attack — revoke all sessions
    if (record.isRevoked) {
      await db
        .update(refreshTokensTable)
        .set({ isRevoked: true })
        .where(eq(refreshTokensTable.userId, record.userId));
      res.status(401).json({ error: "TOKEN_REUSED", message: "Refresh token has already been used. All sessions have been revoked for security." });
      return;
    }

    // Revoke the old token (rotation) and stamp last_used_at
    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(eq(refreshTokensTable.id, record.id));

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, record.userId))
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

    const deviceInfo = record.deviceInfo ?? req.headers["user-agent"];
    const ip = getClientIp(req);
    const { accessToken, refreshToken: newRefreshToken } = await buildTokens(user, typeof deviceInfo === "string" ? deviceInfo : undefined, ip);

    res.cookie("tabaq_token", accessToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    req.log.error({ err }, "Failed to refresh token");
    res.status(500).json({ error: "internal_error", message: "Failed to refresh token" });
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

router.post("/auth/logout", async (req, res) => {
  // Revoke refresh token if supplied
  const rawToken = (req.body as { refreshToken?: string })?.refreshToken;
  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);
    await db.update(refreshTokensTable).set({ isRevoked: true }).where(eq(refreshTokensTable.tokenHash, tokenHash)).catch(() => {});
  }
  res.clearCookie("tabaq_token");
  res.json({ message: "Logged out" });
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
