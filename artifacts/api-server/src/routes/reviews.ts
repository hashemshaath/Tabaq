import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reviewsTable, reviewPhotosTable, reviewLikesTable, usersTable,
  restaurantsTable, dishesTable
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
  }).from(usersTable).where(eq(usersTable.id, review.userId));

  const photos = await db.select({ photoUrl: reviewPhotosTable.photoUrl })
    .from(reviewPhotosTable).where(eq(reviewPhotosTable.reviewId, review.id));

  let isLiked = false;
  if (viewerUserId) {
    const liked = await db.select({ id: reviewLikesTable.id })
      .from(reviewLikesTable)
      .where(and(eq(reviewLikesTable.reviewId, review.id), eq(reviewLikesTable.userId, viewerUserId)));
    isLiked = liked.length > 0;
  }

  return {
    ...review,
    userNameEn: user?.nameEn ?? "User",
    userNameAr: user?.nameAr ?? "مستخدم",
    userAvatarUrl: user?.avatarUrl ?? null,
    userLevel: user?.level ?? 1,
    userLevelTitle: user?.levelTitle ?? "Food Explorer",
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
    const [review] = await db.insert(reviewsTable)
      .values({ userId, restaurantId, dishId, ratingOverall, ...rest })
      .returning();

    if (photoUrls.length > 0) {
      await db.insert(reviewPhotosTable).values(
        photoUrls.map((url: string, i: number) => ({ reviewId: review.id, photoUrl: url, displayOrder: i }))
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

    const existing = await db.select().from(reviewLikesTable)
      .where(and(eq(reviewLikesTable.reviewId, reviewId), eq(reviewLikesTable.userId, userId)));

    let isLiked: boolean;
    if (existing.length > 0) {
      await db.delete(reviewLikesTable)
        .where(and(eq(reviewLikesTable.reviewId, reviewId), eq(reviewLikesTable.userId, userId)));
      await db.update(reviewsTable)
        .set({ likeCount: sql`greatest(${reviewsTable.likeCount} - 1, 0)` })
        .where(eq(reviewsTable.id, reviewId));
      isLiked = false;
    } else {
      await db.insert(reviewLikesTable).values({ reviewId, userId });
      await db.update(reviewsTable)
        .set({ likeCount: sql`${reviewsTable.likeCount} + 1` })
        .where(eq(reviewsTable.id, reviewId));
      // Award points to the review author for receiving a like
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

export default router;
