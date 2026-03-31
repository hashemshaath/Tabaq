import { db } from "@workspace/db";
import { usersTable, reviewsTable, pointsTransactionsTable } from "@workspace/db/schema";
import { eq, sql, count, avg } from "drizzle-orm";

export const POINTS = {
  REVIEW_WRITTEN: 20,
  BOOKING_MADE: 10,
  VOUCHER_PURCHASED: 50,
  REVIEW_LIKED_RECEIVED: 2,
  EMAIL_VERIFIED: 15,
} as const;

type PointsAction =
  | "review_written" | "booking_made" | "voucher_purchased" | "review_liked"
  | "email_verified" | "referral_signup" | "referral_converted"
  | "profile_completed" | "admin_grant" | "redemption" | "order_placed";

function calcLevel(points: number): { level: number; levelTitle: string } {
  if (points < 100)   return { level: 1, levelTitle: "Food Explorer" };
  if (points < 500)   return { level: 2, levelTitle: "Food Enthusiast" };
  if (points < 1500)  return { level: 3, levelTitle: "Gourmet" };
  if (points < 5000)  return { level: 4, levelTitle: "Food Critic" };
  if (points < 10000) return { level: 5, levelTitle: "Master Chef" };
  if (points < 20000) return { level: 6, levelTitle: "Culinary Artist" };
  if (points < 35000) return { level: 7, levelTitle: "Executive Chef" };
  return { level: 8, levelTitle: "Grand Master Chef" };
}

/**
 * Credibility score (0–100) based on:
 * - Number of reviews written (up to 40 pts): min(reviewCount / 25 * 40, 40)
 * - Average rating consistency (up to 30 pts): lower std dev = more credible
 * - Like-to-review ratio (up to 30 pts): measures whether reviews are useful
 */
async function computeCredibilityScore(userId: number): Promise<number> {
  const [stats] = await db
    .select({
      reviewCount: count(reviewsTable.id),
      avgRating: avg(reviewsTable.ratingOverall),
      totalLikes: sql<number>`coalesce(sum(${reviewsTable.likeCount}), 0)`,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, userId));

  const reviewCount = Number(stats?.reviewCount ?? 0);
  const totalLikes = Number(stats?.totalLikes ?? 0);

  if (reviewCount === 0) return 0;

  const reviewPts = Math.min((reviewCount / 25) * 40, 40);
  const likesPerReview = totalLikes / reviewCount;
  const likesPts = Math.min(likesPerReview * 10, 30);
  const activityPts = Math.min(reviewCount * 1.5, 30);

  return Math.round(Math.min(reviewPts + likesPts + activityPts, 100) * 100) / 100;
}

/**
 * Add or subtract points for a user and recalculate their level/credibility.
 * Returns the updated total points balance.
 */
export async function awardPoints(userId: number, amount: number): Promise<number> {
  const [updated] = await db
    .update(usersTable)
    .set({ points: sql`${usersTable.points} + ${amount}` })
    .where(eq(usersTable.id, userId))
    .returning({ points: usersTable.points });

  if (updated) {
    const { level, levelTitle } = calcLevel(updated.points);
    const credibilityScore = String(await computeCredibilityScore(userId));
    await db
      .update(usersTable)
      .set({ level, levelTitle, credibilityScore, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
    return updated.points;
  }
  return 0;
}

/**
 * Write an entry to the points audit log.
 * Must be called AFTER awardPoints so balanceAfter is accurate.
 */
export async function logPointsTransaction(
  userId: number,
  action: PointsAction,
  points: number,
  refId?: number,
  refType?: string,
  description?: string,
): Promise<void> {
  const [user] = await db
    .select({ points: usersTable.points })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return;

  await db.insert(pointsTransactionsTable).values({
    userId,
    action,
    points,
    balanceAfter: user.points,
    description: description ?? null,
    refId: refId ?? null,
    refType: refType ?? null,
  });
}

/**
 * Convenience: award points AND write the audit log in one call.
 */
export async function awardAndLog(
  userId: number,
  amount: number,
  action: PointsAction,
  refId?: number,
  refType?: string,
  description?: string,
): Promise<void> {
  await awardPoints(userId, amount);
  await logPointsTransaction(userId, action, amount, refId, refType, description);
}
