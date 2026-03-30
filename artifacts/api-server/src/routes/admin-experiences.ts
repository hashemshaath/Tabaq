import { Router } from "express";
import { db } from "@workspace/db";
import {
  experienceProvidersTable,
  experiencesTable,
  experienceBookingsTable,
  experienceSettingsTable,
} from "@workspace/db/schema";
import { eq, desc, sql, and, gte, lte, type SQL } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth.js";

const router = Router();

router.use(/^\/admin\/experience/, requireAdmin);
router.use(/^\/provider-applications/, requireAdmin);

function genRefCode(prefix: string) {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `${prefix}-${year}-${n}`;
}

// ─── Provider Applications ───────────────────────────────────────────────────

// GET /provider-applications — list with optional status filter
router.get("/provider-applications", async (req, res) => {
  try {
    const { status } = req.query;
    const conditions: SQL[] = [];
    if (status && status !== "all") {
      conditions.push(eq(experienceProvidersTable.status, status as string));
    }
    const providers = await db
      .select()
      .from(experienceProvidersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(experienceProvidersTable.createdAt));
    res.json({ providers, total: providers.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider applications");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /provider-applications/:id
router.get("/provider-applications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [provider] = await db
      .select()
      .from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.id, id));
    if (!provider) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(provider);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider application");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /provider-applications/:id — approve or reject
router.patch("/provider-applications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { status, adminNote } = req.body;
    const adminUserId = req.auth!.userId;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "bad_request", message: "status must be approved or rejected" });
      return;
    }

    const [updated] = await db
      .update(experienceProvidersTable)
      .set({
        status,
        adminNote,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(experienceProvidersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update provider application");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Experiences Listings ────────────────────────────────────────────────────

// GET /admin/experiences — list with optional status filter
router.get("/admin/experiences", async (req, res) => {
  try {
    const { status } = req.query;
    const conditions: SQL[] = [];
    if (status && status !== "all") {
      conditions.push(eq(experiencesTable.status, status as string));
    }
    const rows = await db
      .select({
        id: experiencesTable.id,
        refCode: experiencesTable.refCode,
        titleEn: experiencesTable.titleEn,
        titleAr: experiencesTable.titleAr,
        categoryType: experiencesTable.categoryType,
        city: experiencesTable.city,
        pricePerPerson: experiencesTable.pricePerPerson,
        commissionPercent: experiencesTable.commissionPercent,
        status: experiencesTable.status,
        isPublished: experiencesTable.isPublished,
        adminNote: experiencesTable.adminNote,
        submittedAt: experiencesTable.submittedAt,
        createdAt: experiencesTable.createdAt,
        providerId: experiencesTable.providerId,
        providerName: experienceProvidersTable.businessNameEn,
      })
      .from(experiencesTable)
      .leftJoin(experienceProvidersTable, eq(experiencesTable.providerId, experienceProvidersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(experiencesTable.createdAt));
    res.json({ experiences: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin experiences");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /admin/experiences/:id
router.get("/admin/experiences/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [exp] = await db
      .select()
      .from(experiencesTable)
      .where(eq(experiencesTable.id, id));
    if (!exp) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(exp);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch experience");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /admin/experiences/:id/status — approve, suspend, reject
router.patch("/admin/experiences/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { status, adminNote } = req.body;
    const adminUserId = req.auth!.userId;

    const validStatuses = ["active", "suspended", "rejected", "pending_approval"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "bad_request", message: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const isPublished = status === "active";

    const [updated] = await db
      .update(experiencesTable)
      .set({
        status,
        adminNote,
        isPublished,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(experiencesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update experience status");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Experience Bookings ─────────────────────────────────────────────────────

// GET /admin/experience-bookings — all bookings
router.get("/admin/experience-bookings", async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const conditions: SQL[] = [];
    if (status && status !== "all") {
      conditions.push(eq(experienceBookingsTable.status, status as string));
    }
    if (dateFrom) {
      conditions.push(gte(experienceBookingsTable.scheduledDate, dateFrom as string));
    }
    if (dateTo) {
      conditions.push(lte(experienceBookingsTable.scheduledDate, dateTo as string));
    }

    const rows = await db
      .select({
        id: experienceBookingsTable.id,
        refCode: experienceBookingsTable.refCode,
        guestNameEn: experienceBookingsTable.guestNameEn,
        guestEmail: experienceBookingsTable.guestEmail,
        guestCount: experienceBookingsTable.guestCount,
        scheduledDate: experienceBookingsTable.scheduledDate,
        scheduledTime: experienceBookingsTable.scheduledTime,
        totalAmount: experienceBookingsTable.totalAmount,
        status: experienceBookingsTable.status,
        cancelReason: experienceBookingsTable.cancelReason,
        createdAt: experienceBookingsTable.createdAt,
        experienceId: experienceBookingsTable.experienceId,
        experienceTitleEn: experiencesTable.titleEn,
        providerId: experienceBookingsTable.providerId,
        providerName: experienceProvidersTable.businessNameEn,
      })
      .from(experienceBookingsTable)
      .leftJoin(experiencesTable, eq(experienceBookingsTable.experienceId, experiencesTable.id))
      .leftJoin(experienceProvidersTable, eq(experienceBookingsTable.providerId, experienceProvidersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(experienceBookingsTable.createdAt));

    res.json({ bookings: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch experience bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /admin/experience-bookings/:id/cancel
router.patch("/admin/experience-bookings/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { cancelReason } = req.body;
    const adminUserId = req.auth!.userId;

    const [updated] = await db
      .update(experienceBookingsTable)
      .set({
        status: "cancelled",
        cancelReason,
        cancelledBy: adminUserId,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(experienceBookingsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to cancel experience booking");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Experience Settings ─────────────────────────────────────────────────────

// GET /admin/experience-settings
router.get("/admin/experience-settings", async (req, res) => {
  try {
    const rows = await db.select().from(experienceSettingsTable).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(experienceSettingsTable).values({}).returning();
      res.json(created);
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch experience settings");
    res.status(500).json({ error: "internal_error" });
  }
});

// PUT /admin/experience-settings
router.put("/admin/experience-settings", async (req, res) => {
  try {
    const { moduleEnabled, defaultCommissionPercent, defaultDepositPercent, refundPolicyEn, refundPolicyAr } = req.body;
    const adminUserId = req.auth!.userId;

    const existing = await db.select().from(experienceSettingsTable).limit(1);

    if (existing.length === 0) {
      const [created] = await db
        .insert(experienceSettingsTable)
        .values({
          moduleEnabled,
          defaultCommissionPercent,
          defaultDepositPercent,
          refundPolicyEn,
          refundPolicyAr,
          updatedBy: adminUserId,
        })
        .returning();
      res.json(created);
      return;
    }

    const [updated] = await db
      .update(experienceSettingsTable)
      .set({
        moduleEnabled,
        defaultCommissionPercent,
        defaultDepositPercent,
        refundPolicyEn,
        refundPolicyAr,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(experienceSettingsTable.id, existing[0]!.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update experience settings");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
