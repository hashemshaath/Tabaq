/**
 * Membership Lifecycle Routes
 *
 * GET    /me/membership                 — get current user's active membership
 * POST   /memberships                   — create / subscribe to a membership plan
 * POST   /memberships/:id/cancel        — user cancels their own membership
 * PATCH  /memberships/:id/status        — admin: force status transition
 * GET    /memberships/:id/audit         — audit log for a membership (admin)
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  membershipsTable, membershipAuditLogTable, usersTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";
import { transitionMembershipStatus, type MembershipStatus } from "../lib/membership.js";
import { generateRefCode } from "../lib/refcode.js";
import { notifyAsync } from "../lib/notify.js";

const PLAN_PRICES: Record<string, Record<string, number>> = {
  gourmet: { monthly: 49, annual: 490 },
  elite:   { monthly: 99, annual: 990 },
};

const router: IRouter = Router();

// GET /me/membership — get current user's active or latest membership
router.get("/me/membership", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [membership] = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.userId, userId))
      .orderBy(desc(membershipsTable.createdAt))
      .limit(1);

    if (!membership) {
      return res.json({ membership: null });
    }
    res.json({ membership });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch membership");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /memberships — subscribe to a plan
router.post("/memberships", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { plan, billing } = req.body as { plan: "gourmet" | "elite"; billing: "monthly" | "annual" };

    if (!plan || !billing) {
      return res.status(400).json({ error: "bad_request", message: "plan and billing are required" });
    }
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ error: "bad_request", message: `Unknown plan '${plan}'. Valid plans: gourmet, elite` });
    }
    if (!["monthly", "annual"].includes(billing)) {
      return res.status(400).json({ error: "bad_request", message: "billing must be 'monthly' or 'annual'" });
    }

    // Check if user already has an active membership
    const [existing] = await db
      .select({ id: membershipsTable.id, status: membershipsTable.status })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, userId),
          eq(membershipsTable.status, "active"),
        ),
      )
      .limit(1);

    if (existing) {
      return res.status(409).json({ error: "conflict", message: "You already have an active membership", membershipId: existing.id });
    }

    const amount = PLAN_PRICES[plan]![billing]!;
    const now = new Date();
    const endsAt = billing === "annual"
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const renewsAt = endsAt;

    const [membership] = await db
      .insert(membershipsTable)
      .values({
        userId,
        plan: plan as any,
        billing: billing as any,
        status: "pending",
        amount: String(amount),
        currency: "SAR",
        endsAt,
        renewsAt,
      })
      .returning();

    const refCode = generateRefCode("MBR", membership!.id);
    const [withRef] = await db
      .update(membershipsTable)
      .set({ refCode })
      .where(eq(membershipsTable.id, membership!.id))
      .returning();

    // Auto-activate (in production, this happens after payment confirmation)
    const activated = await transitionMembershipStatus(membership!.id, "active", "Subscribed via API");

    // Trigger 4: Membership renewed/activated — confirmation with plan details
    notifyAsync({
      userId,
      type: "membership_renewed",
      titleEn: "Membership Activated",
      titleAr: "تم تفعيل الاشتراك",
      bodyEn: `Your ${plan} membership (${billing}) is now active. Valid until ${endsAt.toLocaleDateString("en-SA")}. Enjoy your benefits!`,
      bodyAr: `اشتراكك في ${plan} (${billing}) نشط الآن. صالح حتى ${endsAt.toLocaleDateString("ar-SA")}. استمتع بمزاياك!`,
      refId: membership!.id,
      refType: "membership",
      metadata: { plan, billing, amount, endsAt: endsAt.toISOString(), refCode },
    });

    // Sync goldPlan on users table
    await db.update(usersTable).set({
      goldPlan: plan,
      goldBilling: billing,
      goldSince: now,
      updatedAt: now,
    }).where(eq(usersTable.id, userId));

    res.status(201).json({ membership: activated });
  } catch (err) {
    req.log.error({ err }, "Failed to create membership");
    res.status(500).json({ error: "internal_error", message: "Failed to create membership" });
  }
});

// POST /memberships/:id/cancel — user cancels their membership
router.post("/memberships/:id/cancel", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const userId = req.auth!.userId;
    const { reason } = req.body;

    const [membership] = await db
      .select()
      .from(membershipsTable)
      .where(and(eq(membershipsTable.id, id), eq(membershipsTable.userId, userId)))
      .limit(1);

    if (!membership) {
      return res.status(404).json({ error: "not_found", message: "Membership not found" });
    }

    // No manual status guard here — transitionMembershipStatus enforces the allowed-transition
    // matrix and throws a 422 for invalid moves. The catch block below surfaces that to the caller.
    const cancelled = await transitionMembershipStatus(id, "cancelled", reason ?? "User requested cancellation", userId);

    // Clear goldPlan on users table
    await db.update(usersTable).set({ goldPlan: null, goldBilling: null, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    res.json({ membership: cancelled });
  } catch (err: any) {
    if (err.statusCode === 422) {
      return res.status(422).json({ error: "invalid_transition", message: err.message });
    }
    req.log.error({ err }, "Failed to cancel membership");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /memberships/:id/status — admin: force a status transition
router.patch("/memberships/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { status, reason } = req.body as { status: MembershipStatus; reason?: string };

    if (!status) {
      return res.status(400).json({ error: "bad_request", message: "status is required" });
    }

    const updated = await transitionMembershipStatus(id, status, reason, req.auth!.userId);
    res.json({ membership: updated });
  } catch (err: any) {
    if (err.statusCode === 404) return res.status(404).json({ error: "not_found", message: err.message });
    if (err.statusCode === 422) return res.status(422).json({ error: "invalid_transition", message: err.message, allowed: err.allowed });
    req.log.error({ err }, "Failed to update membership status");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /memberships/:id/audit — audit log (admin)
router.get("/memberships/:id/audit", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const log = await db
      .select()
      .from(membershipAuditLogTable)
      .where(eq(membershipAuditLogTable.membershipId, id))
      .orderBy(desc(membershipAuditLogTable.createdAt));

    res.json({ log });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch membership audit log");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
