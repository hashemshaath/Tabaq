/**
 * Membership Lifecycle State Machine
 *
 * All membership status changes must go through transitionMembershipStatus().
 * Direct DB updates bypass the audit trail and transition validation — never do that.
 *
 * Allowed transitions:
 *   pending    → active     (payment succeeded)
 *   pending    → cancelled  (user cancelled before first payment)
 *   active     → suspended  (payment failed after retries)
 *   active     → cancelled  (user requested cancellation)
 *   active     → expired    (end_date passed, no renewal)
 *   suspended  → active     (payment recovered)
 *   suspended  → cancelled  (user cancelled while suspended)
 *   suspended  → expired    (end_date passed while suspended)
 *   cancelled  → (terminal)
 *   expired    → (terminal)
 */

import { db } from "@workspace/db";
import { membershipsTable, membershipAuditLogTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { notifyAsync } from "./notify.js";

export type MembershipStatus = "pending" | "active" | "suspended" | "cancelled" | "expired";

const ALLOWED_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  pending:   ["active", "cancelled"],
  active:    ["suspended", "cancelled", "expired"],
  suspended: ["active", "cancelled", "expired"],
  cancelled: [],
  expired:   [],
};

export async function transitionMembershipStatus(
  membershipId: number,
  newStatus: MembershipStatus,
  reason?: string,
  actorId?: number,
): Promise<typeof membershipsTable.$inferSelect> {
  const [membership] = await db
    .select()
    .from(membershipsTable)
    .where(eq(membershipsTable.id, membershipId))
    .limit(1);

  if (!membership) {
    throw Object.assign(new Error(`Membership #${membershipId} not found`), { statusCode: 404 });
  }

  const currentStatus = membership.status as MembershipStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(
        `Invalid membership transition from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed from '${currentStatus}': [${allowed.join(", ") || "none — terminal state"}]`,
      ),
      { statusCode: 422, currentStatus, requestedStatus: newStatus, allowed },
    );
  }

  const now = new Date();
  const updatePayload: Record<string, unknown> = { status: newStatus, updatedAt: now };

  if (newStatus === "active" && !membership.startedAt) updatePayload["startedAt"] = now;
  if (newStatus === "cancelled") updatePayload["cancelledAt"] = now;
  if (newStatus === "suspended") updatePayload["suspendedAt"] = now;
  if (reason) updatePayload["cancellationReason"] = reason;

  const [updated] = await db
    .update(membershipsTable)
    .set(updatePayload)
    .where(eq(membershipsTable.id, membershipId))
    .returning();

  // Write immutable audit record — every field is passed explicitly so the record
  // is self-contained: entity_type, entity_uid, old_status, new_status, reason,
  // actor_uid, and a precise transition timestamp are all present on every row.
  await db.insert(membershipAuditLogTable).values({
    entityType:     "membership",
    membershipId,
    oldStatus:      currentStatus,
    newStatus,
    reason:         reason ?? null,
    actorId:        actorId ?? null,
    transitionedAt: now,
  });

  // Notify user of status change
  const userId = updated!.userId;
  if (newStatus === "active") {
    notifyAsync({
      userId,
      type: "membership_renewed",
      titleEn: `${updated!.plan === "elite" ? "Elite" : "Gourmet"} Membership Active`,
      titleAr: `اشتراك ${updated!.plan === "elite" ? "إيليت" : "جورميه"} مفعّل`,
      bodyEn: `Your ${updated!.plan} membership is now active.`,
      bodyAr: `اشتراكك في ${updated!.plan} أصبح نشطاً الآن.`,
      refId: membershipId,
      refType: "membership",
    });
  } else if (newStatus === "suspended") {
    notifyAsync({
      userId,
      type: "membership_failed",
      titleEn: "Membership Suspended",
      titleAr: "تم تعليق الاشتراك",
      bodyEn: "Your membership has been suspended due to a payment issue. Please update your payment method.",
      bodyAr: "تم تعليق اشتراكك بسبب مشكلة في الدفع. يرجى تحديث طريقة الدفع.",
      refId: membershipId,
      refType: "membership",
    });
  } else if (newStatus === "cancelled") {
    notifyAsync({
      userId,
      type: "membership_cancelled",
      titleEn: "Membership Cancelled",
      titleAr: "تم إلغاء الاشتراك",
      bodyEn: `Your membership has been cancelled.${reason ? " Reason: " + reason : ""}`,
      bodyAr: "تم إلغاء اشتراكك.",
      refId: membershipId,
      refType: "membership",
    });
  }

  return updated!;
}
