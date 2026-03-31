import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  userCheckInsTable, visitPlansTable, userRecommendationsTable,
  savedDishesTable, contentPrivacyTable, userBlocksTable,
  usersTable, restaurantsTable, dishesTable, verificationRequestsTable,
} from "@workspace/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// ── CHECK-INS ─────────────────────────────────────────────────────────────────

router.get("/me/checkins", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db
      .select({
        id: userCheckInsTable.id,
        restaurantId: userCheckInsTable.restaurantId,
        visitDate: userCheckInsTable.visitDate,
        visitTime: userCheckInsTable.visitTime,
        partySize: userCheckInsTable.partySize,
        notes: userCheckInsTable.notes,
        companionNames: userCheckInsTable.companionNames,
        isPublic: userCheckInsTable.isPublic,
        createdAt: userCheckInsTable.createdAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImage: restaurantsTable.coverImageUrl,
        restaurantCuisineEn: restaurantsTable.cuisineEn,
        restaurantCuisineAr: restaurantsTable.cuisineAr,
        restaurantCityEn: restaurantsTable.cityEn,
      })
      .from(userCheckInsTable)
      .leftJoin(restaurantsTable, eq(userCheckInsTable.restaurantId, restaurantsTable.id))
      .where(eq(userCheckInsTable.userId, userId))
      .orderBy(desc(userCheckInsTable.visitDate));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch check-ins");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/me/checkins", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, visitDate, visitTime, partySize, notes, companionNames, isPublic } = req.body;
    if (!restaurantId || !visitDate) {
      res.status(400).json({ error: "bad_request", message: "restaurantId and visitDate required" });
      return;
    }
    const [row] = await db.insert(userCheckInsTable).values({
      userId, restaurantId, visitDate, visitTime: visitTime || null,
      partySize: partySize || 1, notes: notes || null,
      companionNames: companionNames || null, isPublic: isPublic !== false,
    }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to create check-in");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/me/checkins/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(userCheckInsTable).where(and(eq(userCheckInsTable.id, id), eq(userCheckInsTable.userId, userId)));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete check-in");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── VISIT PLANS ───────────────────────────────────────────────────────────────

router.get("/me/plans", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db
      .select({
        id: visitPlansTable.id,
        restaurantId: visitPlansTable.restaurantId,
        title: visitPlansTable.title,
        plannedDate: visitPlansTable.plannedDate,
        notes: visitPlansTable.notes,
        priority: visitPlansTable.priority,
        status: visitPlansTable.status,
        themeLabel: visitPlansTable.themeLabel,
        reminderEnabled: visitPlansTable.reminderEnabled,
        createdAt: visitPlansTable.createdAt,
        updatedAt: visitPlansTable.updatedAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImage: restaurantsTable.coverImageUrl,
        restaurantCuisineEn: restaurantsTable.cuisineEn,
        restaurantCuisineAr: restaurantsTable.cuisineAr,
      })
      .from(visitPlansTable)
      .leftJoin(restaurantsTable, eq(visitPlansTable.restaurantId, restaurantsTable.id))
      .where(eq(visitPlansTable.userId, userId))
      .orderBy(desc(visitPlansTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch plans");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/me/plans", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, title, plannedDate, notes, priority, themeLabel, reminderEnabled } = req.body;
    if (!title) {
      res.status(400).json({ error: "bad_request", message: "title required" });
      return;
    }
    const [row] = await db.insert(visitPlansTable).values({
      userId, restaurantId: restaurantId || null, title,
      plannedDate: plannedDate || null, notes: notes || null,
      priority: priority || "medium", status: "active",
      themeLabel: themeLabel || null, reminderEnabled: !!reminderEnabled,
    }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to create plan");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/me/plans/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params["id"] as string, 10);
    const { title, plannedDate, notes, priority, status, themeLabel, reminderEnabled } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (plannedDate !== undefined) updates.plannedDate = plannedDate;
    if (notes !== undefined) updates.notes = notes;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (themeLabel !== undefined) updates.themeLabel = themeLabel;
    if (reminderEnabled !== undefined) updates.reminderEnabled = reminderEnabled;
    const [row] = await db.update(visitPlansTable).set(updates as any)
      .where(and(eq(visitPlansTable.id, id), eq(visitPlansTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to update plan");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/me/plans/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(visitPlansTable).where(and(eq(visitPlansTable.id, id), eq(visitPlansTable.userId, userId)));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete plan");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────

router.get("/me/recommendations", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db
      .select({
        id: userRecommendationsTable.id,
        restaurantId: userRecommendationsTable.restaurantId,
        dishId: userRecommendationsTable.dishId,
        noteEn: userRecommendationsTable.noteEn,
        noteAr: userRecommendationsTable.noteAr,
        isPublic: userRecommendationsTable.isPublic,
        createdAt: userRecommendationsTable.createdAt,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantCoverImage: restaurantsTable.coverImageUrl,
        restaurantCuisineEn: restaurantsTable.cuisineEn,
        dishNameEn: dishesTable.nameEn,
        dishNameAr: dishesTable.nameAr,
      })
      .from(userRecommendationsTable)
      .leftJoin(restaurantsTable, eq(userRecommendationsTable.restaurantId, restaurantsTable.id))
      .leftJoin(dishesTable, eq(userRecommendationsTable.dishId, dishesTable.id))
      .where(eq(userRecommendationsTable.userId, userId))
      .orderBy(desc(userRecommendationsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recommendations");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/me/recommendations", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, dishId, noteEn, noteAr, isPublic } = req.body;
    if (!restaurantId && !dishId) {
      res.status(400).json({ error: "bad_request", message: "restaurantId or dishId required" });
      return;
    }
    const [row] = await db.insert(userRecommendationsTable).values({
      userId, restaurantId: restaurantId || null, dishId: dishId || null,
      noteEn: noteEn || null, noteAr: noteAr || null, isPublic: isPublic !== false,
    }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to create recommendation");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/me/recommendations/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(userRecommendationsTable)
      .where(and(eq(userRecommendationsTable.id, id), eq(userRecommendationsTable.userId, userId)));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete recommendation");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── SAVED DISHES ──────────────────────────────────────────────────────────────

router.get("/me/saved-dishes", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db
      .select({
        id: savedDishesTable.id,
        dishId: savedDishesTable.dishId,
        createdAt: savedDishesTable.createdAt,
        dishNameEn: dishesTable.nameEn,
        dishNameAr: dishesTable.nameAr,
        dishImageUrl: dishesTable.imageUrl,
        dishPriceMin: dishesTable.priceMin,
        dishPriceMax: dishesTable.priceMax,
        dishCategory: dishesTable.categoryEn,
        restaurantId: dishesTable.restaurantId,
      })
      .from(savedDishesTable)
      .leftJoin(dishesTable, eq(savedDishesTable.dishId, dishesTable.id))
      .where(eq(savedDishesTable.userId, userId))
      .orderBy(desc(savedDishesTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved dishes");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/me/saved-dishes/:dishId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const dishId = parseInt(req.params["dishId"] as string, 10);
    await db.insert(savedDishesTable).values({ userId, dishId }).onConflictDoNothing();
    res.status(201).json({ saved: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save dish");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/me/saved-dishes/:dishId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const dishId = parseInt(req.params["dishId"] as string, 10);
    await db.delete(savedDishesTable).where(and(eq(savedDishesTable.userId, userId), eq(savedDishesTable.dishId, dishId)));
    res.json({ saved: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unsave dish");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── CONTENT PRIVACY ───────────────────────────────────────────────────────────

const CONTENT_TYPES = ["visits", "reviews", "favorites", "activity", "plans", "recommendations"] as const;
const DEFAULT_VISIBILITY = "public";

router.get("/me/content-privacy", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db.select().from(contentPrivacyTable).where(eq(contentPrivacyTable.userId, userId));
    const map: Record<string, string> = {};
    for (const ct of CONTENT_TYPES) { map[ct] = DEFAULT_VISIBILITY; }
    for (const row of rows) { map[row.contentType] = row.visibility; }
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch content privacy");
    res.status(500).json({ error: "internal_error" });
  }
});

router.put("/me/content-privacy", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const settings = req.body as Record<string, string>;
    const validVisibility = ["public", "followers", "only_me"];
    const updates: Array<{ userId: number; contentType: string; visibility: string; updatedAt: Date }> = [];
    for (const ct of CONTENT_TYPES) {
      if (settings[ct] && validVisibility.includes(settings[ct]!)) {
        updates.push({ userId, contentType: ct, visibility: settings[ct]!, updatedAt: new Date() });
      }
    }
    for (const update of updates) {
      await db.insert(contentPrivacyTable).values(update)
        .onConflictDoUpdate({
          target: [contentPrivacyTable.userId, contentPrivacyTable.contentType],
          set: { visibility: update.visibility, updatedAt: new Date() },
        });
    }
    const rows = await db.select().from(contentPrivacyTable).where(eq(contentPrivacyTable.userId, userId));
    const map: Record<string, string> = {};
    for (const ct of CONTENT_TYPES) { map[ct] = DEFAULT_VISIBILITY; }
    for (const row of rows) { map[row.contentType] = row.visibility; }
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to update content privacy");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── BLOCKED USERS ─────────────────────────────────────────────────────────────

router.get("/me/blocked-users", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db
      .select({
        id: userBlocksTable.id,
        blockedId: userBlocksTable.blockedId,
        createdAt: userBlocksTable.createdAt,
        nameEn: usersTable.nameEn,
        nameAr: usersTable.nameAr,
        avatarUrl: usersTable.avatarUrl,
        username: usersTable.username,
        levelTitle: usersTable.levelTitle,
      })
      .from(userBlocksTable)
      .leftJoin(usersTable, eq(userBlocksTable.blockedId, usersTable.id))
      .where(eq(userBlocksTable.blockerId, userId))
      .orderBy(desc(userBlocksTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blocked users");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── VERIFICATION REQUESTS ─────────────────────────────────────────────────────

router.get("/me/verification-request", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [req_] = await db
      .select()
      .from(verificationRequestsTable)
      .where(eq(verificationRequestsTable.userId, userId))
      .orderBy(desc(verificationRequestsTable.createdAt))
      .limit(1);
    res.json({ request: req_ ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch verification request");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/me/verification-request", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { method, noteFromUser } = req.body as { method: string; noteFromUser?: string };
    // Check if there's already a pending request
    const [existing] = await db
      .select({ id: verificationRequestsTable.id, status: verificationRequestsTable.status })
      .from(verificationRequestsTable)
      .where(eq(verificationRequestsTable.userId, userId))
      .orderBy(desc(verificationRequestsTable.createdAt))
      .limit(1);
    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "pending_request_exists", message: "You already have a pending verification request." });
    }
    const mockDocUrl = method === "document" ? `https://mock-docs.tabaq.sa/id-${userId}-${Date.now()}.pdf` : null;
    const [newReq] = await db
      .insert(verificationRequestsTable)
      .values({ userId, method, noteFromUser: noteFromUser ?? null, documentUrl: mockDocUrl, status: "pending" })
      .returning();
    res.status(201).json({ request: newReq, message: "Verification request submitted successfully." });
  } catch (err) {
    req.log.error({ err }, "Failed to submit verification request");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── ADMIN: Verification Requests ──────────────────────────────────────────────

router.get("/admin/verification-requests", requireAuth, async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    const baseQuery = db
      .select({
        id: verificationRequestsTable.id,
        userId: verificationRequestsTable.userId,
        method: verificationRequestsTable.method,
        status: verificationRequestsTable.status,
        noteFromUser: verificationRequestsTable.noteFromUser,
        noteFromAdmin: verificationRequestsTable.noteFromAdmin,
        documentUrl: verificationRequestsTable.documentUrl,
        createdAt: verificationRequestsTable.createdAt,
        reviewedAt: verificationRequestsTable.reviewedAt,
        userName: usersTable.nameEn,
        userNameAr: usersTable.nameAr,
        userUsername: usersTable.username,
        userAvatarUrl: usersTable.avatarUrl,
        userIsVerified: usersTable.isVerified,
      })
      .from(verificationRequestsTable)
      .leftJoin(usersTable, eq(verificationRequestsTable.userId, usersTable.id));
    const rows = await (status
      ? baseQuery.where(eq(verificationRequestsTable.status, status))
      : baseQuery
    ).orderBy(desc(verificationRequestsTable.createdAt));
    res.json({ requests: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch verification requests");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/admin/verification-requests/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { status, noteFromAdmin } = req.body as { status: "approved" | "rejected"; noteFromAdmin?: string };
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    const [updated] = await db
      .update(verificationRequestsTable)
      .set({ status, noteFromAdmin: noteFromAdmin ?? null, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(verificationRequestsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    // If approved, set user as verified
    if (status === "approved") {
      await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, updated.userId));
    }
    res.json({ request: updated, message: `Request ${status} successfully.` });
  } catch (err) {
    req.log.error({ err }, "Failed to review verification request");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
