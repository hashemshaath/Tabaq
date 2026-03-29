import { Router } from "express";
import { db } from "@workspace/db";
import { referralConversionsTable, pointsTransactionsTable, usersTable } from "@workspace/db/schema";
import { count, sum, eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/admin/referrals", async (req, res) => {
  try {
    const [[totalReferrals], [converted], [pending]] = await Promise.all([
      db.select({ count: count() }).from(referralConversionsTable),
      db.select({ count: count() }).from(referralConversionsTable).where(eq(referralConversionsTable.status, "converted")),
      db.select({ count: count() }).from(referralConversionsTable).where(eq(referralConversionsTable.status, "pending")),
    ]);

    const [pointsStats] = await db
      .select({
        totalAwarded: sum(sql`CASE WHEN ${pointsTransactionsTable.points} > 0 THEN ${pointsTransactionsTable.points} ELSE 0 END`),
        totalRedeemed: sum(sql`CASE WHEN ${pointsTransactionsTable.points} < 0 THEN ABS(${pointsTransactionsTable.points}) ELSE 0 END`),
        totalTx: count(),
      })
      .from(pointsTransactionsTable);

    const topReferrers = await db
      .select({
        referrerId: referralConversionsTable.referrerId,
        nameEn: usersTable.nameEn,
        nameAr: usersTable.nameAr,
        email: usersTable.email,
        referralCount: count(),
        pointsEarned: sum(referralConversionsTable.referrerPointsEarned),
      })
      .from(referralConversionsTable)
      .leftJoin(usersTable, eq(referralConversionsTable.referrerId, usersTable.id))
      .groupBy(referralConversionsTable.referrerId, usersTable.nameEn, usersTable.nameAr, usersTable.email)
      .orderBy(desc(count()))
      .limit(10);

    const recentActivity = await db
      .select({
        id: referralConversionsTable.id,
        referralCode: referralConversionsTable.referralCode,
        status: referralConversionsTable.status,
        referrerPointsEarned: referralConversionsTable.referrerPointsEarned,
        referredPointsEarned: referralConversionsTable.referredPointsEarned,
        createdAt: referralConversionsTable.createdAt,
        convertedAt: referralConversionsTable.convertedAt,
      })
      .from(referralConversionsTable)
      .orderBy(desc(referralConversionsTable.createdAt))
      .limit(20);

    const conversionRate = Number(totalReferrals?.count ?? 0) > 0
      ? ((Number(converted?.count ?? 0) / Number(totalReferrals?.count ?? 1)) * 100).toFixed(1)
      : "0.0";

    res.json({
      stats: {
        totalReferrals: Number(totalReferrals?.count ?? 0),
        converted: Number(converted?.count ?? 0),
        pending: Number(pending?.count ?? 0),
        conversionRate,
        totalPointsAwarded: Number(pointsStats?.totalAwarded ?? 0),
        totalPointsRedeemed: Number(pointsStats?.totalRedeemed ?? 0),
        outstandingPoints: Number(pointsStats?.totalAwarded ?? 0) - Number(pointsStats?.totalRedeemed ?? 0),
        totalTransactions: Number(pointsStats?.totalTx ?? 0),
      },
      topReferrers,
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
