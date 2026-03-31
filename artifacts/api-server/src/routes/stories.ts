import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantStoriesTable, usersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// List approved stories for a restaurant
router.get("/restaurants/:restaurantId/stories", optionalAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const { limit = "20", offset = "0" } = req.query;

    const stories = await db
      .select({
        id: restaurantStoriesTable.id,
        restaurantId: restaurantStoriesTable.restaurantId,
        userId: restaurantStoriesTable.userId,
        captionEn: restaurantStoriesTable.captionEn,
        captionAr: restaurantStoriesTable.captionAr,
        mediaUrls: restaurantStoriesTable.mediaUrls,
        mediaType: restaurantStoriesTable.mediaType,
        status: restaurantStoriesTable.status,
        viewCount: restaurantStoriesTable.viewCount,
        likeCount: restaurantStoriesTable.likeCount,
        createdAt: restaurantStoriesTable.createdAt,
        approvedAt: restaurantStoriesTable.approvedAt,
        userNameEn: usersTable.nameEn,
        userNameAr: usersTable.nameAr,
        userAvatarUrl: usersTable.avatarUrl,
        userLevelTitle: usersTable.levelTitle,
      })
      .from(restaurantStoriesTable)
      .leftJoin(usersTable, eq(restaurantStoriesTable.userId, usersTable.id))
      .where(
        and(
          eq(restaurantStoriesTable.restaurantId, restaurantId),
          eq(restaurantStoriesTable.status, "approved")
        )
      )
      .orderBy(desc(restaurantStoriesTable.approvedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(restaurantStoriesTable)
      .where(
        and(
          eq(restaurantStoriesTable.restaurantId, restaurantId),
          eq(restaurantStoriesTable.status, "approved")
        )
      );

    res.json({
      stories,
      total: Number(total[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stories");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stories" });
  }
});

// Submit a story (requires auth, goes into pending state)
router.post("/restaurants/:restaurantId/stories", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params["restaurantId"] as string, 10);
    const userId = req.auth!.userId;
    const { captionEn, captionAr, mediaUrls = [], mediaType = "photo" } = req.body;

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      res.status(400).json({ error: "bad_request", message: "At least one media URL is required" });
      return;
    }
    if (mediaUrls.length > 10) {
      res.status(400).json({ error: "bad_request", message: "Maximum 10 media items per story" });
      return;
    }

    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurantId));

    if (!restaurant) {
      res.status(404).json({ error: "not_found", message: "Restaurant not found" });
      return;
    }

    const [story] = await db
      .insert(restaurantStoriesTable)
      .values({
        restaurantId,
        userId,
        captionEn: captionEn || null,
        captionAr: captionAr || null,
        mediaUrls,
        mediaType,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      ...story,
      message: "Story submitted for review. It will appear once approved by Tabaq admin.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit story");
    res.status(500).json({ error: "internal_error", message: "Failed to submit story" });
  }
});

// Admin: list all pending stories
router.get("/admin/stories", requireAdmin, async (req, res) => {
  try {
    const { status = "pending", limit = "50", offset = "0" } = req.query;

    const stories = await db
      .select({
        id: restaurantStoriesTable.id,
        restaurantId: restaurantStoriesTable.restaurantId,
        userId: restaurantStoriesTable.userId,
        captionEn: restaurantStoriesTable.captionEn,
        captionAr: restaurantStoriesTable.captionAr,
        mediaUrls: restaurantStoriesTable.mediaUrls,
        mediaType: restaurantStoriesTable.mediaType,
        status: restaurantStoriesTable.status,
        adminNote: restaurantStoriesTable.adminNote,
        createdAt: restaurantStoriesTable.createdAt,
        userNameEn: usersTable.nameEn,
        userNameAr: usersTable.nameAr,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
      })
      .from(restaurantStoriesTable)
      .leftJoin(usersTable, eq(restaurantStoriesTable.userId, usersTable.id))
      .leftJoin(restaurantsTable, eq(restaurantStoriesTable.restaurantId, restaurantsTable.id))
      .where(eq(restaurantStoriesTable.status, status as "pending" | "approved" | "rejected"))
      .orderBy(desc(restaurantStoriesTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ stories });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin stories");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stories" });
  }
});

// Admin: approve or reject a story
router.patch("/admin/stories/:storyId", requireAdmin, async (req, res) => {
  try {
    const storyId = parseInt(req.params["storyId"] as string, 10);
    const { action, adminNote } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({ error: "bad_request", message: "action must be 'approve' or 'reject'" });
      return;
    }

    const [story] = await db
      .select({ id: restaurantStoriesTable.id })
      .from(restaurantStoriesTable)
      .where(eq(restaurantStoriesTable.id, storyId));

    if (!story) {
      res.status(404).json({ error: "not_found", message: "Story not found" });
      return;
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const [updated] = await db
      .update(restaurantStoriesTable)
      .set({
        status: newStatus,
        adminNote: adminNote || null,
        approvedAt: action === "approve" ? new Date() : null,
      })
      .where(eq(restaurantStoriesTable.id, storyId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update story");
    res.status(500).json({ error: "internal_error", message: "Failed to update story" });
  }
});

// GET /stories/recent — recent approved stories for the feed, grouped by restaurant
router.get("/stories/recent", optionalAuth, async (req, res) => {
  try {
    const { limit = "30" } = req.query;
    const stories = await db
      .select({
        id: restaurantStoriesTable.id,
        restaurantId: restaurantStoriesTable.restaurantId,
        userId: restaurantStoriesTable.userId,
        captionEn: restaurantStoriesTable.captionEn,
        captionAr: restaurantStoriesTable.captionAr,
        mediaUrls: restaurantStoriesTable.mediaUrls,
        mediaType: restaurantStoriesTable.mediaType,
        viewCount: restaurantStoriesTable.viewCount,
        likeCount: restaurantStoriesTable.likeCount,
        createdAt: restaurantStoriesTable.createdAt,
        userNameEn: usersTable.nameEn,
        userNameAr: usersTable.nameAr,
        userAvatarUrl: usersTable.avatarUrl,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantLogoUrl: restaurantsTable.logoUrl,
      })
      .from(restaurantStoriesTable)
      .leftJoin(usersTable, eq(restaurantStoriesTable.userId, usersTable.id))
      .leftJoin(restaurantsTable, eq(restaurantStoriesTable.restaurantId, restaurantsTable.id))
      .where(eq(restaurantStoriesTable.status, "approved"))
      .orderBy(desc(restaurantStoriesTable.approvedAt))
      .limit(parseInt(limit as string));
    res.json({ stories });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recent stories");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /users/:userId/stories — approved stories submitted by a specific user
router.get("/users/:userId/stories", optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params["userId"] as string, 10);
    const { limit = "20", offset = "0" } = req.query;
    const stories = await db
      .select({
        id: restaurantStoriesTable.id,
        restaurantId: restaurantStoriesTable.restaurantId,
        captionEn: restaurantStoriesTable.captionEn,
        captionAr: restaurantStoriesTable.captionAr,
        mediaUrls: restaurantStoriesTable.mediaUrls,
        mediaType: restaurantStoriesTable.mediaType,
        viewCount: restaurantStoriesTable.viewCount,
        likeCount: restaurantStoriesTable.likeCount,
        createdAt: restaurantStoriesTable.createdAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantLogoUrl: restaurantsTable.logoUrl,
      })
      .from(restaurantStoriesTable)
      .leftJoin(restaurantsTable, eq(restaurantStoriesTable.restaurantId, restaurantsTable.id))
      .where(and(
        eq(restaurantStoriesTable.userId, userId),
        eq(restaurantStoriesTable.status, "approved")
      ))
      .orderBy(desc(restaurantStoriesTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    res.json({ stories });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user stories");
    res.status(500).json({ error: "internal_error" });
  }
});

// Increment story view count
router.post("/stories/:storyId/view", optionalAuth, async (req, res) => {
  try {
    const storyId = parseInt(req.params["storyId"] as string, 10);
    await db
      .update(restaurantStoriesTable)
      .set({ viewCount: sql`${restaurantStoriesTable.viewCount} + 1` })
      .where(eq(restaurantStoriesTable.id, storyId));
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

export default router;
