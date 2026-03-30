import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userFollowsTable, reviewsTable, bookingsTable, restaurantsTable, pointsTransactionsTable } from "@workspace/db/schema";
import { eq, and, sql, desc, gte, type SQL } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

function calcLevel(points: number): { level: number; levelTitle: string; nextLevelPoints: number } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer", nextLevelPoints: 100 };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast", nextLevelPoints: 500 };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet", nextLevelPoints: 1500 };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic", nextLevelPoints: 5000 };
  return { level: 5, levelTitle: "Master Chef", nextLevelPoints: 10000 };
}

router.post("/users", async (req, res) => {
  try {
    const { phone, email, nameEn, nameAr, preferredLanguage = "en", cityId } = req.body;
    const levelInfo = calcLevel(0);
    const [user] = await db.insert(usersTable).values({
      phone, email, nameEn, nameAr, preferredLanguage, cityId,
      level: levelInfo.level, levelTitle: levelInfo.levelTitle,
    }).returning();
    res.status(201).json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "internal_error", message: "Failed to create user" });
  }
});

router.get("/users/:userId", optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const [reviewCount, bookingCount, followerCount, followingCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(bookingsTable).where(eq(bookingsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(eq(userFollowsTable.followingId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(eq(userFollowsTable.followerId, userId)),
    ]);

    let isFollowing = false;
    const viewerId = req.auth?.userId;
    if (viewerId && viewerId !== userId) {
      const [follow] = await db.select({ id: userFollowsTable.id })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, userId)));
      isFollowing = !!follow;
    }

    res.json({
      user,
      reviewCount: Number(reviewCount[0]?.count ?? 0),
      bookingCount: Number(bookingCount[0]?.count ?? 0),
      followerCount: Number(followerCount[0]?.count ?? 0),
      followingCount: Number(followingCount[0]?.count ?? 0),
      isFollowing,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

router.put("/users/:userId", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    if (req.auth!.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Cannot update another user's profile" });
      return;
    }
    const { nameEn, nameAr, bio, avatarUrl, preferredLanguage, cityId } = req.body;
    const [user] = await db.update(usersTable)
      .set({ nameEn, nameAr, bio, avatarUrl, preferredLanguage, cityId, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "internal_error", message: "Failed to update user" });
  }
});

router.post("/users/:userId/follow", requireAuth, async (req, res) => {
  try {
    const followingId = parseInt(req.params["userId"] as string, 10);
    const followerId = req.auth!.userId;
    if (followerId === followingId) {
      res.status(400).json({ error: "bad_request", message: "Cannot follow yourself" });
      return;
    }
    await db.insert(userFollowsTable).values({ followerId, followingId }).onConflictDoNothing();
    const [cnt] = await db.select({ count: sql<number>`count(*)` })
      .from(userFollowsTable).where(eq(userFollowsTable.followingId, followingId));
    res.json({ isFollowing: true, followerCount: Number(cnt?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "Failed to follow user");
    res.status(500).json({ error: "internal_error", message: "Failed to follow user" });
  }
});

router.delete("/users/:userId/follow", requireAuth, async (req, res) => {
  try {
    const followingId = parseInt(req.params["userId"] as string, 10);
    const followerId = req.auth!.userId;
    await db.delete(userFollowsTable)
      .where(and(eq(userFollowsTable.followerId, followerId), eq(userFollowsTable.followingId, followingId)));
    const [cnt] = await db.select({ count: sql<number>`count(*)` })
      .from(userFollowsTable).where(eq(userFollowsTable.followingId, followingId));
    res.json({ isFollowing: false, followerCount: Number(cnt?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "Failed to unfollow user");
    res.status(500).json({ error: "internal_error", message: "Failed to unfollow user" });
  }
});

router.get("/users/:userId/followers", async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const followers = await db.select({
      id: usersTable.id,
      nameEn: usersTable.nameEn,
      nameAr: usersTable.nameAr,
      avatarUrl: usersTable.avatarUrl,
      isVerified: usersTable.isVerified,
      level: usersTable.level,
      levelTitle: usersTable.levelTitle,
    }).from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
      .where(eq(userFollowsTable.followingId, userId));

    const enriched = await Promise.all(followers.map(async (f) => {
      const [cnt] = await db.select({ count: sql<number>`count(*)` })
        .from(reviewsTable).where(eq(reviewsTable.userId, f.id));
      return { ...f, reviewCount: Number(cnt?.count ?? 0) };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch followers");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch followers" });
  }
});

router.get("/users/:userId/following", async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const following = await db.select({
      id: usersTable.id,
      nameEn: usersTable.nameEn,
      nameAr: usersTable.nameAr,
      avatarUrl: usersTable.avatarUrl,
      isVerified: usersTable.isVerified,
      level: usersTable.level,
      levelTitle: usersTable.levelTitle,
    }).from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followingId, usersTable.id))
      .where(eq(userFollowsTable.followerId, userId));

    const enriched = await Promise.all(following.map(async (f) => {
      const [cnt] = await db.select({ count: sql<number>`count(*)` })
        .from(reviewsTable).where(eq(reviewsTable.userId, f.id));
      return { ...f, reviewCount: Number(cnt?.count ?? 0) };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch following");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch following" });
  }
});

router.get("/users/:userId/reviews", async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const reviews = await db.select({
      id: reviewsTable.id,
      restaurantId: reviewsTable.restaurantId,
      dishId: reviewsTable.dishId,
      userId: reviewsTable.userId,
      ratingOverall: reviewsTable.ratingOverall,
      ratingFood: reviewsTable.ratingFood,
      ratingService: reviewsTable.ratingService,
      ratingAmbiance: reviewsTable.ratingAmbiance,
      textEn: reviewsTable.textEn,
      textAr: reviewsTable.textAr,
      visitDate: reviewsTable.visitDate,
      likeCount: reviewsTable.likeCount,
      createdAt: reviewsTable.createdAt,
      userNameEn: usersTable.nameEn,
      userNameAr: usersTable.nameAr,
      userAvatarUrl: usersTable.avatarUrl,
      userLevel: usersTable.level,
      userLevelTitle: usersTable.levelTitle,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .leftJoin(restaurantsTable, eq(reviewsTable.restaurantId, restaurantsTable.id))
      .where(eq(reviewsTable.userId, userId))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews.map(r => ({ ...r, photoUrls: [], isLiked: false })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user reviews");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user reviews" });
  }
});

router.get("/users/:userId/bookings", async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const { status } = req.query;
    const conditions: SQL[] = [eq(bookingsTable.userId, userId)];
    if (status === "upcoming") conditions.push(sql`${bookingsTable.date} >= CURRENT_DATE`);
    else if (status === "past") conditions.push(sql`${bookingsTable.date} < CURRENT_DATE`);
    else if (status === "cancelled") conditions.push(eq(bookingsTable.status, "cancelled"));

    const bookings = await db.select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      restaurantId: bookingsTable.restaurantId,
      date: bookingsTable.date,
      time: bookingsTable.time,
      partySize: bookingsTable.partySize,
      status: bookingsTable.status,
      occasionId: bookingsTable.occasionId,
      specialRequests: bookingsTable.specialRequests,
      referenceCode: bookingsTable.referenceCode,
      createdAt: bookingsTable.createdAt,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantCoverImageUrl: restaurantsTable.coverImageUrl,
    }).from(bookingsTable)
      .innerJoin(restaurantsTable, eq(bookingsTable.restaurantId, restaurantsTable.id))
      .where(and(...conditions))
      .orderBy(desc(bookingsTable.date));
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user bookings");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user bookings" });
  }
});

router.get("/users/:userId/leaderboard-rank", async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    const levelInfo = calcLevel(user.points);
    const [reviewCount] = await db.select({ count: sql<number>`count(*)` })
      .from(reviewsTable).where(eq(reviewsTable.userId, userId));
    const rankRows = await db.execute<{ rank: bigint }>(
      sql`SELECT COUNT(*) + 1 as rank FROM users WHERE points > ${user.points}`
    );
    const rankResult = rankRows.rows[0];
    res.json({
      userId,
      points: user.points,
      level: user.level,
      levelTitle: user.levelTitle,
      rank: Number(rankResult?.rank ?? 1),
      reviewCount: Number(reviewCount?.count ?? 0),
      nextLevelPoints: levelInfo.nextLevelPoints,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leaderboard rank");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch leaderboard rank" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = "20", period = "alltime" } = req.query;
    const lim = parseInt(limit as string);

    // Compute date cutoff for weekly/monthly periods
    const now = new Date();
    let cutoff: Date | null = null;
    if (period === "weekly") {
      cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else if (period === "monthly") {
      cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    }

    if (cutoff) {
      // For period-based rankings: rank users by their review count in the period
      const usersBase = await db.select().from(usersTable).limit(100);
      const enriched = await Promise.all(usersBase.map(async (u) => {
        const [periodCnt] = await db.select({ count: sql<number>`count(*)` })
          .from(reviewsTable)
          .where(and(eq(reviewsTable.userId, u.id), gte(reviewsTable.createdAt, cutoff!)));
        const [totalCnt] = await db.select({ count: sql<number>`count(*)` })
          .from(reviewsTable).where(eq(reviewsTable.userId, u.id));
        return {
          user: {
            id: u.id,
            nameEn: u.nameEn,
            nameAr: u.nameAr,
            avatarUrl: u.avatarUrl,
            isVerified: u.isVerified,
            level: u.level,
            levelTitle: u.levelTitle,
          },
          points: u.points,
          reviewCount: Number(totalCnt?.count ?? 0),
          periodReviewCount: Number(periodCnt?.count ?? 0),
        };
      }));

      // Sort by period review count desc, then by total points as tie-breaker
      const sorted = enriched
        .sort((a, b) => b.periodReviewCount - a.periodReviewCount || b.points - a.points)
        .filter((e) => e.periodReviewCount > 0 || e.points > 0)
        .slice(0, lim)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      res.json(sorted);
      return;
    }

    // All-time: rank by points (existing behavior)
    const users = await db.select().from(usersTable)
      .orderBy(desc(usersTable.points))
      .limit(lim);

    const enriched = await Promise.all(users.map(async (u, i) => {
      const [cnt] = await db.select({ count: sql<number>`count(*)` })
        .from(reviewsTable).where(eq(reviewsTable.userId, u.id));
      return {
        rank: i + 1,
        user: {
          id: u.id,
          nameEn: u.nameEn,
          nameAr: u.nameAr,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified,
          level: u.level,
          levelTitle: u.levelTitle,
          reviewCount: Number(cnt?.count ?? 0),
        },
        points: u.points,
        reviewCount: Number(cnt?.count ?? 0),
      };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch leaderboard" });
  }
});

// Activity feed — reviews + bookings for a user; only accessible by the user themselves
router.get("/users/:userId/activity", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    if (req.auth!.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Cannot view another user's activity feed" });
      return;
    }
    const { limit = "20", offset = "0" } = req.query;
    const lim = parseInt(limit as string);
    const off = parseInt(offset as string);

    const [reviewCountRow, bookingCountRow, reviews, bookings] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(bookingsTable).where(eq(bookingsTable.userId, userId)),
      db.select({
        id: reviewsTable.id,
        restaurantId: reviewsTable.restaurantId,
        ratingOverall: reviewsTable.ratingOverall,
        textEn: reviewsTable.textEn,
        textAr: reviewsTable.textAr,
        likeCount: reviewsTable.likeCount,
        createdAt: reviewsTable.createdAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
      }).from(reviewsTable)
        .leftJoin(restaurantsTable, eq(reviewsTable.restaurantId, restaurantsTable.id))
        .where(eq(reviewsTable.userId, userId))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(lim + off),
      db.select({
        id: bookingsTable.id,
        restaurantId: bookingsTable.restaurantId,
        date: bookingsTable.date,
        time: bookingsTable.time,
        partySize: bookingsTable.partySize,
        status: bookingsTable.status,
        referenceCode: bookingsTable.referenceCode,
        createdAt: bookingsTable.createdAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
      }).from(bookingsTable)
        .innerJoin(restaurantsTable, eq(bookingsTable.restaurantId, restaurantsTable.id))
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(lim + off),
    ]);

    const totalCount = Number(reviewCountRow[0]?.count ?? 0) + Number(bookingCountRow[0]?.count ?? 0);

    const reviewEvents = reviews.map(r => ({ type: "review" as const, createdAt: r.createdAt, data: r }));
    const bookingEvents = bookings.map(b => ({ type: "booking" as const, createdAt: b.createdAt, data: b }));

    const merged = [...reviewEvents, ...bookingEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(off, off + lim);

    res.json({ events: merged, total: totalCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user activity");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user activity" });
  }
});

// GET /me/points/history — points transaction history for current user
router.get("/me/points/history", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { limit = "50", offset = "0" } = req.query;

    const [user] = await db
      .select({ points: usersTable.points, level: usersTable.level, levelTitle: usersTable.levelTitle })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    const transactions = await db
      .select()
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.userId, userId))
      .orderBy(desc(pointsTransactionsTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.userId, userId));

    res.json({
      currentBalance: user?.points ?? 0,
      level: user?.level ?? 1,
      levelTitle: user?.levelTitle ?? "Food Explorer",
      transactions,
      total: Number(totalRow?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch points history");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch points history" });
  }
});

export default router;
