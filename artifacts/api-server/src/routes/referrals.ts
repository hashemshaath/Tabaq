import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  referralConversionsTable,
  pointsTransactionsTable,
} from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const REFERRAL_POINTS = {
  REFERRER: 100,
  REFERRED: 50,
};

function generateReferralCode(userId: number, name: string | null): string {
  const base = (name ?? "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6)
    .padEnd(3, "x");
  const suffix = (userId * 7919 + 1234).toString(36).toUpperCase().slice(0, 4);
  return `${base}${suffix}`.toUpperCase();
}

router.get("/me/referral", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) return res.status(404).json({ error: "User not found" });

    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode(userId, user.nameEn);
      await db
        .update(usersTable)
        .set({ referralCode, updatedAt: new Date() })
        .where(eq(usersTable.id, userId));
    }

    const conversions = await db
      .select({
        id: referralConversionsTable.id,
        status: referralConversionsTable.status,
        referredId: referralConversionsTable.referredId,
        referrerPointsEarned: referralConversionsTable.referrerPointsEarned,
        convertedAt: referralConversionsTable.convertedAt,
        createdAt: referralConversionsTable.createdAt,
      })
      .from(referralConversionsTable)
      .where(eq(referralConversionsTable.referrerId, userId))
      .orderBy(desc(referralConversionsTable.createdAt))
      .limit(50);

    const [stats] = await db
      .select({
        total: count(),
        converted: sql<number>`sum(case when ${referralConversionsTable.status} = 'converted' then 1 else 0 end)`,
        totalPointsEarned: sql<number>`coalesce(sum(${referralConversionsTable.referrerPointsEarned}), 0)`,
      })
      .from(referralConversionsTable)
      .where(eq(referralConversionsTable.referrerId, userId));

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://tabaq.co";

    res.json({
      referralCode,
      referralLink: `${baseUrl}/join?ref=${referralCode}`,
      stats: {
        invitesSent: Number(stats?.total ?? 0),
        converted: Number(stats?.converted ?? 0),
        totalPointsEarned: Number(stats?.totalPointsEarned ?? 0),
        pendingPoints: REFERRAL_POINTS.REFERRER,
      },
      conversions,
      pointsPerReferral: REFERRAL_POINTS.REFERRER,
      pointsForReferred: REFERRAL_POINTS.REFERRED,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/referrals/use", requireAuth, async (req, res) => {
  try {
    const { referralCode } = req.body as { referralCode: string };
    const newUserId = req.auth!.userId;

    if (!referralCode) {
      return res.status(400).json({ error: "referralCode is required" });
    }

    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.toUpperCase()));

    if (!referrer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    if (referrer.id === newUserId) {
      return res.status(400).json({ error: "Cannot use your own referral code" });
    }

    const existing = await db
      .select()
      .from(referralConversionsTable)
      .where(eq(referralConversionsTable.referredId, newUserId));

    if (existing.length > 0) {
      return res.status(409).json({ error: "User has already used a referral code" });
    }

    const [conversion] = await db
      .insert(referralConversionsTable)
      .values({
        referrerId: referrer.id,
        referredId: newUserId,
        referralCode: referralCode.toUpperCase(),
        status: "signed_up",
        pointsAwarded: true,
        referrerPointsEarned: REFERRAL_POINTS.REFERRER,
        referredPointsEarned: REFERRAL_POINTS.REFERRED,
      })
      .returning();

    await db
      .update(usersTable)
      .set({ points: sql`${usersTable.points} + ${REFERRAL_POINTS.REFERRER}`, updatedAt: new Date() })
      .where(eq(usersTable.id, referrer.id));

    await db
      .update(usersTable)
      .set({ points: sql`${usersTable.points} + ${REFERRAL_POINTS.REFERRED}`, updatedAt: new Date() })
      .where(eq(usersTable.id, newUserId));

    const [referrerUser] = await db.select().from(usersTable).where(eq(usersTable.id, referrer.id));
    await db.insert(pointsTransactionsTable).values({
      userId: referrer.id,
      action: "referral_converted",
      points: REFERRAL_POINTS.REFERRER,
      balanceAfter: referrerUser?.points ?? REFERRAL_POINTS.REFERRER,
      description: `Referral bonus: friend joined`,
    });

    const [newUser] = await db.select().from(usersTable).where(eq(usersTable.id, newUserId));
    await db.insert(pointsTransactionsTable).values({
      userId: newUserId,
      action: "referral_signup",
      points: REFERRAL_POINTS.REFERRED,
      balanceAfter: newUser?.points ?? REFERRAL_POINTS.REFERRED,
      description: `Welcome bonus: joined via referral`,
    });

    res.json({ success: true, conversion, referrerPoints: REFERRAL_POINTS.REFERRER, referredPoints: REFERRAL_POINTS.REFERRED });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me/points/history", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const limit = Math.min(Number(req.query.limit ?? 30), 100);

    const transactions = await db
      .select()
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.userId, userId))
      .orderBy(desc(pointsTransactionsTable.createdAt))
      .limit(limit);

    const [user] = await db
      .select({ points: usersTable.points, level: usersTable.level, levelTitle: usersTable.levelTitle })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    res.json({ transactions, currentBalance: user?.points ?? 0, level: user?.level ?? 1, levelTitle: user?.levelTitle ?? "Food Explorer" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
