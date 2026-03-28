import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reviewsTable, reviewPhotosTable, reviewLikesTable, reviewCommentsTable,
  usersTable, restaurantsTable, dishesTable
} from "@workspace/db/schema";
import { eq, and, sql, desc, type SQL } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";
import { awardPoints, POINTS } from "../lib/points.js";

const router: IRouter = Router();

type ReviewRow = typeof reviewsTable.$inferSelect;

async function enrichReview(review: ReviewRow, viewerUserId: number | null) {
  const [user] = await db.select({
    nameEn: usersTable.nameEn,
    nameAr: usersTable.nameAr,
    avatarUrl: usersTable.avatarUrl,
    level: usersTable.level,
    levelTitle: usersTable.levelTitle,
    credibilityScore: usersTable.credibilityScore,
  }).from(usersTable).where(eq(usersTable.id, review.userId));

  const photos = await db.select({ photoUrl: reviewPhotosTable.photoUrl })
    .from(reviewPhotosTable)
    .where(eq(reviewPhotosTable.reviewId, review.id))
    .orderBy(reviewPhotosTable.displayOrder);

  let isLiked = false;
  if (viewerUserId) {
    const [liked] = await db.select({ id: reviewLikesTable.id })
      .from(reviewLikesTable)
      .where(and(
        eq(reviewLikesTable.reviewId, review.id),
        eq(reviewLikesTable.userId, viewerUserId),
        eq(reviewLikesTable.isActive, true),
      ));
    isLiked = !!liked;
  }

  const isVerified = user?.credibilityScore !== null &&
    user?.credibilityScore !== undefined &&
    Number(user.credibilityScore) >= 70;

  return {
    ...review,
    userNameEn: user?.nameEn ?? "User",
    userNameAr: user?.nameAr ?? "مستخدم",
    userAvatarUrl: user?.avatarUrl ?? null,
    userLevel: user?.level ?? 1,
    userLevelTitle: user?.levelTitle ?? "Food Explorer",
    userIsVerified: isVerified,
    photoUrls: photos.map(p => p.photoUrl),
    isLiked,
  };
}

// List reviews
router.get("/reviews", optionalAuth, async (req, res) => {
  try {
    const { restaurantId, dishId, userId, limit = "20", offset = "0" } = req.query;
    const conditions: SQL[] = [];
    if (restaurantId) conditions.push(eq(reviewsTable.restaurantId, parseInt(restaurantId as string)));
    if (dishId) conditions.push(eq(reviewsTable.dishId, parseInt(dishId as string)));
    if (userId) conditions.push(eq(reviewsTable.userId, parseInt(userId as string)));

    const reviews = await db.select().from(reviewsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(reviewsTable.createdAt));

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(reviewsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const viewerUserId = req.auth?.userId ?? null;
    const enriched = await Promise.all(reviews.map(r => enrichReview(r, viewerUserId)));
    res.json({
      reviews: enriched,
      total: Number(total[0]?.count ?? 0),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reviews" });
  }
});

// Create review
router.post("/reviews", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, dishId, ratingOverall, photoUrls = [], ...rest } = req.body;
    if (!ratingOverall) {
      res.status(400).json({ error: "bad_request", message: "ratingOverall is required" });
      return;
    }

    // Prevent duplicate reviews for the same target
    if (restaurantId) {
      const [existing] = await db.select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.restaurantId, restaurantId)));
      if (existing) {
        res.status(409).json({ error: "conflict", message: "You have already reviewed this restaurant" });
        return;
      }
    }
    if (dishId) {
      const [existing] = await db.select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.dishId, dishId)));
      if (existing) {
        res.status(409).json({ error: "conflict", message: "You have already reviewed this dish" });
        return;
      }
    }

    const [review] = await db.insert(reviewsTable)
      .values({ userId, restaurantId, dishId, ratingOverall, ...rest })
      .returning();

    if (photoUrls.length > 0) {
      await db.insert(reviewPhotosTable).values(
        (photoUrls as string[]).map((url: string, i: number) => ({ reviewId: review.id, photoUrl: url, displayOrder: i }))
      );
    }

    // Update restaurant avg rating
    if (restaurantId) {
      await db.execute(sql`
        UPDATE restaurants SET
          avg_rating = (SELECT AVG(rating_overall::numeric) FROM reviews WHERE restaurant_id = ${restaurantId}),
          review_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = ${restaurantId}),
          updated_at = NOW()
        WHERE id = ${restaurantId}
      `);
    }

    // Award points to the reviewer
    await awardPoints(userId, POINTS.REVIEW_WRITTEN);

    const enriched = await enrichReview(review, userId);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "internal_error", message: "Failed to create review" });
  }
});

// Get single review
router.get("/reviews/:reviewId", optionalAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (!review) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }
    const viewerUserId = req.auth?.userId ?? null;
    const enriched = await enrichReview(review, viewerUserId);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch review");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch review" });
  }
});

// Delete review — only the owner can delete
router.delete("/reviews/:reviewId", requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const userId = req.auth!.userId;

    const [review] = await db.select({ userId: reviewsTable.userId, restaurantId: reviewsTable.restaurantId })
      .from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (!review) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }
    if (review.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only delete your own reviews" });
      return;
    }

    await db.delete(reviewPhotosTable).where(eq(reviewPhotosTable.reviewId, reviewId));
    await db.delete(reviewLikesTable).where(eq(reviewLikesTable.reviewId, reviewId));
    await db.delete(reviewCommentsTable).where(eq(reviewCommentsTable.reviewId, reviewId));
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));

    // Recompute restaurant avg rating
    if (review.restaurantId) {
      await db.execute(sql`
        UPDATE restaurants SET
          avg_rating = COALESCE((SELECT AVG(rating_overall::numeric) FROM reviews WHERE restaurant_id = ${review.restaurantId}), 0),
          review_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = ${review.restaurantId}),
          updated_at = NOW()
        WHERE id = ${review.restaurantId}
      `);
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "internal_error", message: "Failed to delete review" });
  }
});

// Like / unlike review
router.post("/reviews/:reviewId/like", requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const userId = req.auth!.userId;

    const [review] = await db.select({ userId: reviewsTable.userId })
      .from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (!review) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }

    const [existing] = await db.select({
      id: reviewLikesTable.id,
      isActive: reviewLikesTable.isActive,
      pointsAwarded: reviewLikesTable.pointsAwarded,
    }).from(reviewLikesTable)
      .where(and(eq(reviewLikesTable.reviewId, reviewId), eq(reviewLikesTable.userId, userId)));

    let isLiked: boolean;
    if (existing && existing.isActive) {
      await db.update(reviewLikesTable)
        .set({ isActive: false })
        .where(eq(reviewLikesTable.id, existing.id));
      await db.update(reviewsTable)
        .set({ likeCount: sql`greatest(${reviewsTable.likeCount} - 1, 0)` })
        .where(eq(reviewsTable.id, reviewId));
      isLiked = false;
    } else if (existing && !existing.isActive) {
      await db.update(reviewLikesTable)
        .set({ isActive: true })
        .where(eq(reviewLikesTable.id, existing.id));
      await db.update(reviewsTable)
        .set({ likeCount: sql`${reviewsTable.likeCount} + 1` })
        .where(eq(reviewsTable.id, reviewId));
      isLiked = true;
    } else {
      await db.insert(reviewLikesTable).values({
        reviewId,
        userId,
        isActive: true,
        pointsAwarded: true,
      });
      await db.update(reviewsTable)
        .set({ likeCount: sql`${reviewsTable.likeCount} + 1` })
        .where(eq(reviewsTable.id, reviewId));
      await awardPoints(review.userId, POINTS.REVIEW_LIKED_RECEIVED);
      isLiked = true;
    }

    const [updated] = await db.select({ likeCount: reviewsTable.likeCount })
      .from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    res.json({ isLiked, likeCount: updated?.likeCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to like review");
    res.status(500).json({ error: "internal_error", message: "Failed to like review" });
  }
});

// List comments on a review
router.get("/reviews/:reviewId/comments", optionalAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const comments = await db
      .select({
        id: reviewCommentsTable.id,
        reviewId: reviewCommentsTable.reviewId,
        userId: reviewCommentsTable.userId,
        text: reviewCommentsTable.text,
        createdAt: reviewCommentsTable.createdAt,
        userNameEn: usersTable.nameEn,
        userNameAr: usersTable.nameAr,
        userAvatarUrl: usersTable.avatarUrl,
        userLevelTitle: usersTable.levelTitle,
      })
      .from(reviewCommentsTable)
      .leftJoin(usersTable, eq(reviewCommentsTable.userId, usersTable.id))
      .where(eq(reviewCommentsTable.reviewId, reviewId))
      .orderBy(reviewCommentsTable.createdAt);

    res.json({ comments });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch comments");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch comments" });
  }
});

// Add a comment to a review
router.post("/reviews/:reviewId/comments", requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const userId = req.auth!.userId;
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "bad_request", message: "Comment text is required" });
      return;
    }
    if (text.length > 500) {
      res.status(400).json({ error: "bad_request", message: "Comment must be 500 characters or fewer" });
      return;
    }

    const [review] = await db.select({ id: reviewsTable.id })
      .from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (!review) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }

    const [comment] = await db.insert(reviewCommentsTable)
      .values({ reviewId, userId, text: text.trim() })
      .returning();

    // Increment comment count on review
    await db.update(reviewsTable)
      .set({ commentCount: sql`${reviewsTable.commentCount} + 1` })
      .where(eq(reviewsTable.id, reviewId));

    const [user] = await db.select({
      nameEn: usersTable.nameEn,
      nameAr: usersTable.nameAr,
      avatarUrl: usersTable.avatarUrl,
      levelTitle: usersTable.levelTitle,
    }).from(usersTable).where(eq(usersTable.id, userId));

    res.status(201).json({
      ...comment,
      userNameEn: user?.nameEn ?? "User",
      userNameAr: user?.nameAr ?? "مستخدم",
      userAvatarUrl: user?.avatarUrl ?? null,
      userLevelTitle: user?.levelTitle ?? "Food Explorer",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "internal_error", message: "Failed to add comment" });
  }
});

// Delete a comment — owner only
router.delete("/reviews/:reviewId/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params["reviewId"] as string, 10);
    const commentId = parseInt(req.params["commentId"] as string, 10);
    const userId = req.auth!.userId;

    const [comment] = await db.select({ userId: reviewCommentsTable.userId })
      .from(reviewCommentsTable)
      .where(and(eq(reviewCommentsTable.id, commentId), eq(reviewCommentsTable.reviewId, reviewId)));

    if (!comment) {
      res.status(404).json({ error: "not_found", message: "Comment not found" });
      return;
    }
    if (comment.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "You can only delete your own comments" });
      return;
    }

    await db.delete(reviewCommentsTable).where(eq(reviewCommentsTable.id, commentId));
    await db.update(reviewsTable)
      .set({ commentCount: sql`greatest(${reviewsTable.commentCount} - 1, 0)` })
      .where(eq(reviewsTable.id, reviewId));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete comment");
    res.status(500).json({ error: "internal_error", message: "Failed to delete comment" });
  }
});

// Social feed — reviews from followed users
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { limit = "20", offset = "0" } = req.query;
    const lim = parseInt(limit as string);
    const off = parseInt(offset as string);

    // Get reviews from users the current user follows + own reviews, most recent first
    const feedReviews = await db.execute<{
      id: number; user_id: number; restaurant_id: number | null; dish_id: number | null;
      rating_overall: string; rating_food: string | null; rating_service: string | null;
      rating_ambiance: string | null; rating_value: string | null;
      text_en: string | null; text_ar: string | null;
      like_count: number; comment_count: number; visit_date: string | null; created_at: Date;
    }>(sql`
      SELECT r.*
      FROM reviews r
      WHERE r.user_id = ${userId}
        OR r.user_id IN (
          SELECT following_id FROM user_follows WHERE follower_id = ${userId}
        )
      ORDER BY r.created_at DESC
      LIMIT ${lim} OFFSET ${off}
    `);

    const total = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text as count FROM reviews r
      WHERE r.user_id = ${userId}
        OR r.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ${userId})
    `);

    const enriched = await Promise.all(
      feedReviews.rows.map(row => {
        const review: ReviewRow = {
          id: row.id,
          userId: row.user_id,
          restaurantId: row.restaurant_id,
          dishId: row.dish_id,
          ratingOverall: row.rating_overall,
          ratingFood: row.rating_food,
          ratingService: row.rating_service,
          ratingAmbiance: row.rating_ambiance,
          ratingValue: row.rating_value,
          textEn: row.text_en,
          textAr: row.text_ar,
          likeCount: row.like_count,
          commentCount: row.comment_count,
          visitDate: row.visit_date,
          createdAt: row.created_at,
        };
        return enrichReview(review, userId);
      })
    );

    // Enrich with restaurant/dish names
    const enrichedWithTargets = await Promise.all(
      enriched.map(async (r) => {
        let restaurantNameEn: string | null = null;
        let restaurantNameAr: string | null = null;
        let dishNameEn: string | null = null;
        let dishNameAr: string | null = null;

        if (r.restaurantId) {
          const [rest] = await db.select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr })
            .from(restaurantsTable).where(eq(restaurantsTable.id, r.restaurantId));
          restaurantNameEn = rest?.nameEn ?? null;
          restaurantNameAr = rest?.nameAr ?? null;
        }
        if (r.dishId) {
          const [dish] = await db.select({ nameEn: dishesTable.nameEn, nameAr: dishesTable.nameAr })
            .from(dishesTable).where(eq(dishesTable.id, r.dishId));
          dishNameEn = dish?.nameEn ?? null;
          dishNameAr = dish?.nameAr ?? null;
        }

        return { ...r, restaurantNameEn, restaurantNameAr, dishNameEn, dishNameAr };
      })
    );

    res.json({
      reviews: enrichedWithTargets,
      total: Number(total.rows[0]?.count ?? 0),
      offset: off,
      limit: lim,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch feed");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch feed" });
  }
});

export default router;
