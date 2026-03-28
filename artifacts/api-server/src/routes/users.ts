import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userFollowsTable, reviewsTable, bookingsTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, sql, desc, type SQL } from "drizzle-orm";

const router: IRouter = Router();

function calcLevel(points: number): { level: number; levelTitle: string; nextLevelPoints: number } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer", nextLevelPoints: 100 };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast", nextLevelPoints: 500 };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet", nextLevelPoints: 1500 };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic", nextLevelPoints: 5000 };
  return { level: 5, levelTitle: "Master Chef", nextLevelPoints: 10000 };
}

// Create user
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

// Get user profile
router.get("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
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

    res.json({
      user,
      reviewCount: Number(reviewCount[0]?.count ?? 0),
      bookingCount: Number(bookingCount[0]?.count ?? 0),
      followerCount: Number(followerCount[0]?.count ?? 0),
      followingCount: Number(followingCount[0]?.count ?? 0),
      isFollowing: false,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

// Update user
router.put("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const [user] = await db.update(usersTable)
      .set({ ...req.body, updatedAt: new Date() })
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

// Follow user
router.post("/users/:userId/follow", async (req, res) => {
  try {
    const followingId = parseInt(req.params.userId, 10);
    const followerId = 1; // TODO: from session
    await db.insert(userFollowsTable).values({ followerId, followingId }).onConflictDoNothing();
    const [cnt] = await db.select({ count: sql<number>`count(*)` })
      .from(userFollowsTable).where(eq(userFollowsTable.followingId, followingId));
    res.json({ isFollowing: true, followerCount: Number(cnt?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "Failed to follow user");
    res.status(500).json({ error: "internal_error", message: "Failed to follow user" });
  }
});

// Unfollow user
router.delete("/users/:userId/follow", async (req, res) => {
  try {
    const followingId = parseInt(req.params.userId, 10);
    const followerId = 1; // TODO: from session
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

// Get followers
router.get("/users/:userId/followers", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
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

// Get following
router.get("/users/:userId/following", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
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

// Get user reviews
router.get("/users/:userId/reviews", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const reviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.userId, userId))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews.map(r => ({
      ...r,
      userNameEn: "User", userNameAr: "مستخدم",
      userAvatarUrl: null, userLevel: 1, userLevelTitle: "Food Explorer",
      photoUrls: [], isLiked: false,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user reviews");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user reviews" });
  }
});

// Get user bookings
router.get("/users/:userId/bookings", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
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

// Get user leaderboard rank
router.get("/users/:userId/leaderboard-rank", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
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

// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = "20" } = req.query;
    const users = await db.select().from(usersTable)
      .orderBy(desc(usersTable.points))
      .limit(parseInt(limit as string));

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

export default router;
