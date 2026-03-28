import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, otpRequestsTable, emailVerificationTokensTable } from "@workspace/db/schema";
import { eq, and, isNull, gt, desc, gte } from "drizzle-orm";
import { signToken, generateOtp, otpExpiresAt } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { awardPoints, POINTS } from "../lib/points.js";
import crypto from "crypto";

const router: IRouter = Router();

const IS_DEV = process.env["NODE_ENV"] !== "production";

function calcLevel(points: number): { level: number; levelTitle: string } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer" };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast" };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet" };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic" };
  return { level: 5, levelTitle: "Master Chef" };
}

const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OTP_RATE_LIMIT_MAX = 3;

router.post("/auth/request-otp", async (req, res) => {
  try {
    const { phone, email } = req.body as { phone?: string; email?: string };
    if (!phone && !email) {
      res.status(400).json({ error: "bad_request", message: "phone or email required" });
      return;
    }

    const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS);
    const recentCondition = phone
      ? and(eq(otpRequestsTable.phone, phone), gte(otpRequestsTable.createdAt, windowStart))
      : and(eq(otpRequestsTable.email, email!), gte(otpRequestsTable.createdAt, windowStart));
    const recent = await db.select({ id: otpRequestsTable.id }).from(otpRequestsTable).where(recentCondition);
    if (recent.length >= OTP_RATE_LIMIT_MAX) {
      res.status(429).json({ error: "rate_limited", message: "Too many OTP requests. Please wait a minute." });
      return;
    }

    const code = generateOtp();
    const expiresAt = otpExpiresAt();

    await db.insert(otpRequestsTable).values({
      phone: phone ?? null,
      email: email ?? null,
      code,
      expiresAt,
    });

    if (IS_DEV) {
      req.log.info({ code }, "DEV mode: OTP code (not sent via SMS)");
      res.json({ message: "OTP sent", devCode: code });
    } else {
      res.json({ message: "OTP sent" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to request OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to request OTP" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { phone, email, code, nameEn, nameAr, preferredLanguage = "en", cityId } = req.body as {
      phone?: string;
      email?: string;
      code: string;
      nameEn?: string;
      nameAr?: string;
      preferredLanguage?: string;
      cityId?: number;
    };

    if (!code || (!phone && !email)) {
      res.status(400).json({ error: "bad_request", message: "phone/email and code required" });
      return;
    }

    const now = new Date();
    const [otp] = await db.select().from(otpRequestsTable).where(
      and(
        phone ? eq(otpRequestsTable.phone, phone) : eq(otpRequestsTable.email, email!),
        eq(otpRequestsTable.code, code),
        isNull(otpRequestsTable.usedAt),
        gt(otpRequestsTable.expiresAt, now),
      )
    ).orderBy(desc(otpRequestsTable.createdAt)).limit(1);

    if (!otp) {
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
      return;
    }

    await db.update(otpRequestsTable)
      .set({ usedAt: now })
      .where(eq(otpRequestsTable.id, otp.id));

    let user = await db.select().from(usersTable).where(
      phone ? eq(usersTable.phone, phone) : eq(usersTable.email, email!)
    ).limit(1).then(rows => rows[0]);

    if (!user) {
      const levelInfo = calcLevel(0);
      const [created] = await db.insert(usersTable).values({
        phone: phone ?? null,
        email: email ?? null,
        nameEn: nameEn ?? null,
        nameAr: nameAr ?? null,
        preferredLanguage,
        cityId: cityId ?? null,
        level: levelInfo.level,
        levelTitle: levelInfo.levelTitle,
      }).returning();
      user = created!;
    }

    const token = signToken({ userId: user.id, phone: user.phone, email: user.email });

    res.cookie("tabaq_token", token, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  } catch (err) {
    req.log.error({ err }, "Failed to verify OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to verify OTP" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch /me");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

// Email verification — request a verification link (token-based)
router.post("/auth/verify-email/request", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, isEmailVerified: usersTable.isEmailVerified })
      .from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    if (user.isEmailVerified) {
      res.status(400).json({ error: "already_verified", message: "Email already verified" });
      return;
    }
    if (!user.email) {
      res.status(400).json({ error: "no_email", message: "No email address on account" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokensTable).values({ userId, token, expiresAt });

    const verifyUrl = `${process.env["APP_URL"] ?? "https://tabaq.app"}/verify-email?token=${token}`;

    req.log.info({ userId, verifyUrl }, "Email verification link generated");
    res.json({
      message: "Verification link generated",
      ...(IS_DEV ? { devVerifyUrl: verifyUrl, devToken: token } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to request email verification");
    res.status(500).json({ error: "internal_error", message: "Failed to request email verification" });
  }
});

// Email verification — confirm via token from the link
router.get("/auth/verify-email/confirm", async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ error: "bad_request", message: "token required" });
      return;
    }

    const now = new Date();
    const [record] = await db.select()
      .from(emailVerificationTokensTable)
      .where(
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

    await db.update(emailVerificationTokensTable)
      .set({ usedAt: now })
      .where(eq(emailVerificationTokensTable.id, record.id));

    const [user] = await db.update(usersTable)
      .set({ isEmailVerified: true, updatedAt: now })
      .where(eq(usersTable.id, record.userId))
      .returning({ id: usersTable.id, isEmailVerified: usersTable.isEmailVerified, points: usersTable.points });

    if (user) {
      await awardPoints(record.userId, POINTS.EMAIL_VERIFIED);
    }

    res.json({ message: "Email verified successfully", userId: record.userId });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm email verification");
    res.status(500).json({ error: "internal_error", message: "Failed to confirm email verification" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("tabaq_token");
  res.json({ message: "Logged out" });
});

export default router;
