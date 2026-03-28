import { db } from "@workspace/db";
import { usersTable, reviewsTable } from "@workspace/db/schema";
import { eq, sql, count, avg } from "drizzle-orm";

export const POINTS = {
  REVIEW_WRITTEN: 20,
  BOOKING_MADE: 10,
  VOUCHER_PURCHASED: 50,
  REVIEW_LIKED_RECEIVED: 2,
  EMAIL_VERIFIED: 15,
} as const;

function calcLevel(points: number): { level: number; levelTitle: string } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer" };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast" };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet" };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic" };
  return { level: 5, levelTitle: "Master Chef" };
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

export async function awardPoints(userId: number, amount: number): Promise<void> {
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
  }
}
