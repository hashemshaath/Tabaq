import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

export const POINTS = {
  REVIEW_WRITTEN: 20,
  BOOKING_MADE: 10,
  REVIEW_LIKED_RECEIVED: 2,
} as const;

function calcLevel(points: number): { level: number; levelTitle: string } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer" };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast" };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet" };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic" };
  return { level: 5, levelTitle: "Master Chef" };
}

export async function awardPoints(userId: number, amount: number): Promise<void> {
  const [updated] = await db
    .update(usersTable)
    .set({ points: sql`${usersTable.points} + ${amount}` })
    .where(eq(usersTable.id, userId))
    .returning({ points: usersTable.points });

  if (updated) {
    const { level, levelTitle } = calcLevel(updated.points);
    await db
      .update(usersTable)
      .set({ level, levelTitle, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }
}
