import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reviewsTable, reviewPhotosTable, reviewLikesTable, usersTable,
  restaurantsTable, dishesTable
} from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

async function enrichReview(review: any, userId: number) {
  const [user] = await db.select({
    nameEn: usersTable.nameEn,
    nameAr: usersTable.nameAr,
    avatarUrl: usersTable.avatarUrl,
    level: usersTable.level,
    levelTitle: usersTable.levelTitle,
  }).from(usersTable).where(eq(usersTable.id, review.userId));

  const photos = await db.select({ photoUrl: reviewPhotosTable.photoUrl })
    .from(reviewPhotosTable).where(eq(reviewPhotosTable.reviewId, review.id));

  const liked = await db.select({ id: reviewLikesTable.id })
    .from(reviewLikesTable)
    .where(and(eq(reviewLikesTable.reviewId, review.id), eq(reviewLikesTable.userId, userId)));

  return {
    ...review,
    userNameEn: user?.nameEn ?? "User",
    userNameAr: user?.nameAr ?? "مستخدم",
    userAvatarUrl: user?.avatarUrl ?? null,
    userLevel: user?.level ?? 1,
    userLevelTitle: user?.levelTitle ?? "Food Explorer",
    photoUrls: photos.map(p => p.photoUrl),
    isLiked: liked.length > 0,
  };
}

// List reviews
router.get("/reviews", async (req, res) => {
  try {
    const { restaurantId, dishId, userId, limit = "20", offset = "0" } = req.query;
    const conditions: any[] = [];
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

    const enriched = await Promise.all(reviews.map(r => enrichReview(r, 1)));
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
router.post("/reviews", async (req, res) => {
  try {
    const userId = 1; // TODO: from session
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

    const enriched = await enrichReview(review, userId);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "internal_error", message: "Failed to create review" });
  }
});

// Get review
router.get("/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId, 10);
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (!review) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }
    const enriched = await enrichReview(review, 1);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch review");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch review" });
  }
});

// Delete review
router.delete("/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId, 10);
    await db.delete(reviewPhotosTable).where(eq(reviewPhotosTable.reviewId, reviewId));
    await db.delete(reviewLikesTable).where(eq(reviewLikesTable.reviewId, reviewId));
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "internal_error", message: "Failed to delete review" });
  }
});

// Like review
router.post("/reviews/:reviewId/like", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId, 10);
    const userId = 1; // TODO: from session

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
