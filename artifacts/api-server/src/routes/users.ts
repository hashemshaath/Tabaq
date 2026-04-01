import { Router, type IRouter } from "express";
import { db, registerUid } from "@workspace/db";
import { usersTable, userFollowsTable, userBlocksTable, reviewsTable, bookingsTable, restaurantsTable, pointsTransactionsTable } from "@workspace/db/schema";
import { eq, and, sql, desc, gte, ne, notExists, type SQL } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import crypto from "crypto";

const router: IRouter = Router();

function calcLevel(points: number): { level: number; levelTitle: string; nextLevelPoints: number } {
  if (points < 100) return { level: 1, levelTitle: "Food Explorer", nextLevelPoints: 100 };
  if (points < 500) return { level: 2, levelTitle: "Food Enthusiast", nextLevelPoints: 500 };
  if (points < 1500) return { level: 3, levelTitle: "Gourmet", nextLevelPoints: 1500 };
  if (points < 5000) return { level: 4, levelTitle: "Food Critic", nextLevelPoints: 5000 };
  return { level: 5, levelTitle: "Master Chef", nextLevelPoints: 10000 };
}

function generateUserUid(id: number): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `USR-${year}-${String(id).padStart(8, "0")}-${suffix}`;
}

router.post("/users", async (req, res) => {
  try {
    const { phone, email, nameEn, nameAr, preferredLanguage = "en", cityId } = req.body;
    const levelInfo = calcLevel(0);
    const [user] = await db.insert(usersTable).values({
      phone, email, nameEn, nameAr, preferredLanguage, cityId,
      level: levelInfo.level, levelTitle: levelInfo.levelTitle,
    }).returning();
    const uid = generateUserUid(user!.id);
    await db.update(usersTable).set({ userUid: uid }).where(eq(usersTable.id, user!.id));
    await registerUid(uid, "USER", "active");
    res.status(201).json({ ...user, userUid: uid });
  } catch (err) {
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "internal_error", message: "Failed to create user" });
  }
});

router.get("/users/suggested", optionalAuth, async (req, res) => {
  try {
    const viewerId = req.auth?.userId;
    const limit = parseInt((req.query.limit as string) ?? "6");

    let candidates = await db
      .select({
        id: usersTable.id,
        nameEn: usersTable.nameEn,
        nameAr: usersTable.nameAr,
        username: usersTable.username,
        avatarUrl: usersTable.avatarUrl,
        isVerified: usersTable.isVerified,
        level: usersTable.level,
        levelTitle: usersTable.levelTitle,
        points: usersTable.points,
        isPrivate: usersTable.isPrivate,
        reviewCount: sql<number>`(SELECT COUNT(*) FROM reviews WHERE reviews.user_id = ${usersTable.id})`,
      })
      .from(usersTable)
      .where(sql`name_en IS NOT NULL AND name_en != '' AND username IS NOT NULL`)
      .orderBy(desc(usersTable.points))
      .limit(50);

    if (viewerId) {
      candidates = candidates.filter(u => u.id !== viewerId);
      const followingRows = await db
        .select({ followingId: userFollowsTable.followingId })
        .from(userFollowsTable)
        .where(eq(userFollowsTable.followerId, viewerId));
      const followingSet = new Set(followingRows.map(r => r.followingId));
      candidates = candidates.filter(u => !followingSet.has(u.id));
    }

    res.json(candidates.slice(0, limit));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch suggested users");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch suggested users" });
  }
});

router.get("/users/by-username/:username", optionalAuth, async (req, res) => {
  try {
    const username = req.params["username"] as string;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const userId = user.id;
    const [reviewCount, bookingCount, followerCount, followingCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(bookingsTable).where(eq(bookingsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(and(eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'accepted'))),
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(and(eq(userFollowsTable.followerId, userId), eq(userFollowsTable.status, 'accepted'))),
    ]);

    let followStatus: 'none' | 'following' | 'pending' = 'none';
    let followsBack = false;
    const viewerId = req.auth?.userId;
    if (viewerId && viewerId !== userId) {
      const [viewerFollow, profileFollow] = await Promise.all([
        db.select({ id: userFollowsTable.id, status: userFollowsTable.status })
          .from(userFollowsTable)
          .where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, userId))),
        db.select({ id: userFollowsTable.id, status: userFollowsTable.status })
          .from(userFollowsTable)
          .where(and(eq(userFollowsTable.followerId, userId), eq(userFollowsTable.followingId, viewerId))),
      ]);
      if (viewerFollow[0]) followStatus = viewerFollow[0].status === 'pending' ? 'pending' : 'following';
      followsBack = !!profileFollow[0] && profileFollow[0].status === 'accepted';
    }

    res.json({
      user,
      reviewCount: Number(reviewCount[0]?.count ?? 0),
      bookingCount: Number(bookingCount[0]?.count ?? 0),
      followerCount: Number(followerCount[0]?.count ?? 0),
      followingCount: Number(followingCount[0]?.count ?? 0),
      isFollowing: followStatus === 'following',
      followStatus,
      followsBack,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user by username");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
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
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(and(eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'accepted'))),
      db.select({ count: sql<number>`count(*)` }).from(userFollowsTable).where(and(eq(userFollowsTable.followerId, userId), eq(userFollowsTable.status, 'accepted'))),
    ]);

    let followStatus: 'none' | 'following' | 'pending' = 'none';
    const viewerId = req.auth?.userId;
    if (viewerId && viewerId !== userId) {
      const [follow] = await db.select({ id: userFollowsTable.id, status: userFollowsTable.status })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, userId)));
      if (follow) {
        followStatus = follow.status === 'pending' ? 'pending' : 'following';
      }
    }

    res.json({
      user,
      reviewCount: Number(reviewCount[0]?.count ?? 0),
      bookingCount: Number(bookingCount[0]?.count ?? 0),
      followerCount: Number(followerCount[0]?.count ?? 0),
      followingCount: Number(followingCount[0]?.count ?? 0),
      isFollowing: followStatus === 'following',
      followStatus,
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
    const { nameEn, nameAr, bio, avatarUrl, preferredLanguage, cityId,
            coverPhotoUrl, location, instagramUrl, xUrl, tiktokUrl, snapchatUrl, websiteUrl } = req.body;
    const [user] = await db.update(usersTable)
      .set({ nameEn, nameAr, bio, avatarUrl, preferredLanguage, cityId,
             coverPhotoUrl, location, instagramUrl, xUrl, tiktokUrl, snapchatUrl, websiteUrl,
             updatedAt: new Date() })
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

    const [target] = await db.select({ isPrivate: usersTable.isPrivate }).from(usersTable).where(eq(usersTable.id, followingId));
    if (!target) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const status = target.isPrivate ? 'pending' : 'accepted';

    await db.insert(userFollowsTable).values({ followerId, followingId, status }).onConflictDoNothing();

    const [cnt] = await db.select({ count: sql<number>`count(*)` })
      .from(userFollowsTable).where(and(eq(userFollowsTable.followingId, followingId), eq(userFollowsTable.status, 'accepted')));
    res.json({ isFollowing: status === 'accepted', followStatus: status, followerCount: Number(cnt?.count ?? 0) });
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
      .from(userFollowsTable).where(and(eq(userFollowsTable.followingId, followingId), eq(userFollowsTable.status, 'accepted')));
    res.json({ isFollowing: false, followStatus: 'none', followerCount: Number(cnt?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "Failed to unfollow user");
    res.status(500).json({ error: "internal_error", message: "Failed to unfollow user" });
  }
});

// ─── GET /me/follow-requests — pending incoming requests for current user ─────
router.get("/me/follow-requests", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const requests = await db
      .select({
        id: userFollowsTable.id,
        followerId: userFollowsTable.followerId,
        createdAt: userFollowsTable.createdAt,
        nameEn: usersTable.nameEn,
        nameAr: usersTable.nameAr,
        avatarUrl: usersTable.avatarUrl,
        isVerified: usersTable.isVerified,
        levelTitle: usersTable.levelTitle,
      })
      .from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
      .where(and(eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'pending')));
    res.json(requests);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch follow requests");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch follow requests" });
  }
});

// ─── POST /me/follow-requests/:requesterId/accept ─────────────────────────────
router.post("/me/follow-requests/:requesterId/accept", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const requesterId = parseInt(req.params["requesterId"] as string, 10);
    await db
      .update(userFollowsTable)
      .set({ status: 'accepted' })
      .where(and(eq(userFollowsTable.followerId, requesterId), eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'pending')));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to accept follow request");
    res.status(500).json({ error: "internal_error", message: "Failed to accept follow request" });
  }
});

// ─── DELETE /me/follow-requests/:requesterId — reject or cancel ───────────────
router.delete("/me/follow-requests/:requesterId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const requesterId = parseInt(req.params["requesterId"] as string, 10);
    await db
      .delete(userFollowsTable)
      .where(and(eq(userFollowsTable.followerId, requesterId), eq(userFollowsTable.followingId, userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reject follow request");
    res.status(500).json({ error: "internal_error", message: "Failed to reject follow request" });
  }
});

// ─── PATCH /me/privacy — toggle isPrivate ────────────────────────────────────
router.patch("/me/privacy", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { isPrivate } = req.body as { isPrivate: boolean };
    const [updated] = await db
      .update(usersTable)
      .set({ isPrivate: !!isPrivate, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning({ isPrivate: usersTable.isPrivate });

    if (updated && !isPrivate) {
      await db
        .update(userFollowsTable)
        .set({ status: 'accepted' })
        .where(and(eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'pending')));
    }

    res.json({ isPrivate: updated?.isPrivate ?? false });
  } catch (err) {
    req.log.error({ err }, "Failed to update privacy");
    res.status(500).json({ error: "internal_error", message: "Failed to update privacy" });
  }
});

// ─── GET /me/privacy-settings ────────────────────────────────────────────────
router.get("/me/privacy-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select({ privacySettings: usersTable.privacySettings, notificationPrefs: usersTable.notificationPrefs })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "not_found" }); return; }
    res.json({
      privacySettings: user.privacySettings ?? {},
      notificationPrefs: user.notificationPrefs ?? {},
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch privacy settings");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── PATCH /me/privacy-settings ─────────────────────────────────────────────
router.patch("/me/privacy-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { privacySettings, notificationPrefs } = req.body as {
      privacySettings?: Record<string, unknown>;
      notificationPrefs?: Record<string, unknown>;
    };
    const [current] = await db.select({ privacySettings: usersTable.privacySettings, notificationPrefs: usersTable.notificationPrefs })
      .from(usersTable).where(eq(usersTable.id, userId));
    const merged: Record<string, unknown> = {};
    if (privacySettings !== undefined) merged.privacySettings = { ...(current?.privacySettings ?? {}), ...privacySettings };
    if (notificationPrefs !== undefined) merged.notificationPrefs = { ...(current?.notificationPrefs ?? {}), ...notificationPrefs };
    if (!Object.keys(merged).length) { res.status(400).json({ error: "bad_request", message: "Nothing to update" }); return; }
    const [updated] = await db.update(usersTable).set({ ...merged, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning({ privacySettings: usersTable.privacySettings, notificationPrefs: usersTable.notificationPrefs });
    res.json({ privacySettings: updated?.privacySettings ?? {}, notificationPrefs: updated?.notificationPrefs ?? {} });
  } catch (err) {
    req.log.error({ err }, "Failed to update privacy settings");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── POST /users/:userId/block ────────────────────────────────────────────────
router.post("/users/:userId/block", requireAuth, async (req, res) => {
  try {
    const blockerId = req.auth!.userId;
    const blockedId = parseInt(req.params["userId"] as string, 10);
    if (blockerId === blockedId) {
      res.status(400).json({ error: "bad_request", message: "Cannot block yourself" });
      return;
    }
    await db.insert(userBlocksTable).values({ blockerId, blockedId }).onConflictDoNothing();
    await db.delete(userFollowsTable).where(and(eq(userFollowsTable.followerId, blockerId), eq(userFollowsTable.followingId, blockedId)));
    await db.delete(userFollowsTable).where(and(eq(userFollowsTable.followerId, blockedId), eq(userFollowsTable.followingId, blockerId)));
    res.json({ isBlocked: true });
  } catch (err) {
    req.log.error({ err }, "Failed to block user");
    res.status(500).json({ error: "internal_error", message: "Failed to block user" });
  }
});

// ─── DELETE /users/:userId/block ──────────────────────────────────────────────
router.delete("/users/:userId/block", requireAuth, async (req, res) => {
  try {
    const blockerId = req.auth!.userId;
    const blockedId = parseInt(req.params["userId"] as string, 10);
    await db.delete(userBlocksTable).where(and(eq(userBlocksTable.blockerId, blockerId), eq(userBlocksTable.blockedId, blockedId)));
    res.json({ isBlocked: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unblock user");
    res.status(500).json({ error: "internal_error", message: "Failed to unblock user" });
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
      .where(and(eq(userFollowsTable.followingId, userId), eq(userFollowsTable.status, 'accepted')));

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
      .where(and(eq(userFollowsTable.followerId, userId), eq(userFollowsTable.status, 'accepted')));

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
            username: u.username,
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
          username: u.username,
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

// ─── GET /me/restaurant — get the restaurant owned by the logged-in user ─────
router.get("/me/restaurant", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, userId));
    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "No restaurant found for this owner" });
      return;
    }
    res.json({ restaurant });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch owner restaurant");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch restaurant" });
  }
});

// ─── PATCH /me/profile — update own profile fields ───────────────────────────
router.patch("/me/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { nameEn, nameAr, email, bio, avatarUrl, coverPhotoUrl, location,
            instagramUrl, xUrl, tiktokUrl, snapchatUrl, websiteUrl, accountType } = req.body as {
      nameEn?: string; nameAr?: string; email?: string; bio?: string; avatarUrl?: string;
      coverPhotoUrl?: string; location?: string;
      instagramUrl?: string; xUrl?: string; tiktokUrl?: string; snapchatUrl?: string; websiteUrl?: string;
      accountType?: string;
    };

    const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
    if (nameEn !== undefined) updateData.nameEn = nameEn.trim() || null;
    if (nameAr !== undefined) updateData.nameAr = nameAr.trim() || null;
    if (bio !== undefined) updateData.bio = bio.trim() || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim() || null;
    if (coverPhotoUrl !== undefined) updateData.coverPhotoUrl = coverPhotoUrl.trim() || null;
    if (location !== undefined) updateData.location = location.trim() || null;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl.trim() || null;
    if (xUrl !== undefined) updateData.xUrl = xUrl.trim() || null;
    if (tiktokUrl !== undefined) updateData.tiktokUrl = tiktokUrl.trim() || null;
    if (snapchatUrl !== undefined) updateData.snapchatUrl = snapchatUrl.trim() || null;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl.trim() || null;
    if (accountType !== undefined && ['basic', 'professional', 'chef'].includes(accountType)) {
      updateData.accountType = accountType;
    }
    if (email !== undefined) {
      const emailLower = email.trim().toLowerCase();
      if (emailLower && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
        return;
      }
      updateData.email = emailLower || null;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({ user: updated, message: "Profile updated successfully" });
  } catch (err: any) {
    if (err?.constraint === "users_email_unique") {
      res.status(409).json({ error: "email_taken", message: "That email is already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "internal_error", message: "Failed to update profile" });
  }
});

export default router;
