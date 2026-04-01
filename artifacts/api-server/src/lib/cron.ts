// Cron Job Scheduler
//
// All scheduled tasks are registered here and started by calling startCronJobs().
// Call startCronJobs() once from index.ts after the server starts listening.
//
// Schedule reference (node-cron):
//   "0 2 * * *"    -> daily at 02:00 UTC
//   "0 3 * * *"    -> daily at 03:00 UTC
//   "0 0 1 * *"    -> 1st of every month at 00:00 UTC
//   "0 */6 * * *"  -> every 6 hours

import cron from "node-cron";
import { db } from "@workspace/db";
import {
  usersTable, ordersTable, membershipsTable, cronLogsTable,
  pointsTransactionsTable,
} from "@workspace/db/schema";
import { and, eq, lt, sql, lte } from "drizzle-orm";
import { logger } from "./logger.js";
import { transitionMembershipStatus } from "./membership.js";
import { notifyAsync } from "./notify.js";

// ─── Job Runner Wrapper ───────────────────────────────────────────────────────

async function runJob(
  jobName: string,
  fn: () => Promise<number>,
): Promise<void> {
  const startedAt = new Date();
  let logId: number | undefined;

  try {
    const [log] = await db.insert(cronLogsTable).values({
      jobName, status: "running", startedAt,
    }).returning();
    logId = log?.id;
  } catch {
    // Non-critical — continue even if log insert fails
  }

  logger.info({ jobName }, `Cron START: ${jobName}`);

  let recordsProcessed = 0;
  let errorMessage: string | undefined;

  try {
    recordsProcessed = await fn();
    logger.info({ jobName, recordsProcessed }, `Cron DONE: ${jobName}`);
  } catch (err) {
    errorMessage = String(err);
    logger.error({ jobName, err }, `Cron ERROR: ${jobName}`);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  if (logId) {
    await db.update(cronLogsTable).set({
      status: errorMessage ? "failed" : "completed",
      recordsProcessed,
      errorMessage: errorMessage ?? null,
      finishedAt,
      durationMs,
    }).where(eq(cronLogsTable.id, logId)).catch(() => {});
  }
}

// ─── Job Definitions ──────────────────────────────────────────────────────────

async function jobPointsExpiryCheck(): Promise<number> {
  // Points expiry: expire points older than 12 months for inactive users
  // Platform policy: points do not expire unless user is inactive for > 365 days
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const staleUsers = await db
    .select({ id: usersTable.id, points: usersTable.points })
    .from(usersTable)
    .where(
      and(
        lt(usersTable.updatedAt, cutoff),
        sql`${usersTable.points} > 0`,
      ),
    )
    .limit(200);

  for (const user of staleUsers) {
    notifyAsync({
      userId: user.id,
      type: "points_redeemed",
      titleEn: "Points Expiring Soon",
      titleAr: "نقاطك ستنتهي قريبًا",
      bodyEn: `You have ${user.points} points that will expire in 30 days. Use them before they expire!`,
      bodyAr: `لديك ${user.points} نقطة ستنتهي خلال 30 يومًا. استخدمها قبل انتهاء صلاحيتها!`,
    });
  }

  return staleUsers.length;
}

async function jobMembershipAutoRenewal(): Promise<number> {
  const now = new Date();
  let count = 0;

  const expiredMemberships = await db
    .select()
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.status, "active"),
        lte(membershipsTable.endsAt, now),
      ),
    )
    .limit(100);

  for (const membership of expiredMemberships) {
    try {
      await transitionMembershipStatus(membership.id, "expired", "End date reached");
      count++;

      // Trigger 5: Membership payment failed / auto-renewal could not complete.
      // In this simulated flow, expiry = renewal failure (no active payment method on file).
      notifyAsync({
        userId: membership.userId,
        type: "membership_failed",
        titleEn: "Membership Expired — Renewal Failed",
        titleAr: "انتهى الاشتراك — فشل التجديد",
        bodyEn: `Your ${membership.plan} membership has expired. Please update your payment method and renew to continue enjoying your benefits.`,
        bodyAr: `انتهت صلاحية اشتراكك في ${membership.plan}. يرجى تحديث طريقة الدفع وتجديد الاشتراك للاستمرار في الاستمتاع بمزاياك.`,
        refId: membership.id,
        refType: "membership",
      });
    } catch (err) {
      logger.warn({ err, membershipId: membership.id }, "Failed to expire membership");
    }
  }

  return count;
}

async function jobMembershipExpiryWarning(): Promise<number> {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  let count = 0;

  const expiringSoon = await db
    .select()
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.status, "active"),
        lte(membershipsTable.endsAt, threeDaysFromNow),
        sql`${membershipsTable.endsAt} > NOW()`,
      ),
    )
    .limit(100);

  for (const membership of expiringSoon) {
    notifyAsync({
      userId: membership.userId,
      type: "membership_expiring",
      titleEn: "Membership Expiring Soon",
      titleAr: "اشتراكك سينتهي قريبًا",
      bodyEn: `Your ${membership.plan} membership expires in 3 days. Renew to keep your benefits.`,
      bodyAr: `اشتراكك في ${membership.plan} سينتهي خلال 3 أيام. جدد اشتراكك للاحتفاظ بمزاياك.`,
      refId: membership.id,
      refType: "membership",
    });
    count++;
  }

  return count;
}

async function jobAbandonedOrderCleanup(): Promise<number> {
  // Cancel orders that have been "placed" for more than 30 minutes without confirmation
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const result = await db
    .update(ordersTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(ordersTable.status, "placed"),
        lt(ordersTable.createdAt, cutoff),
      ),
    )
    .returning({ id: ordersTable.id });

  if (result.length > 0) {
    logger.info({ count: result.length }, "Abandoned orders cleaned up");
  }

  return result.length;
}

async function jobCommissionBatchCalculation(): Promise<number> {
  // Placeholder: in production, aggregate pending transactions into monthly invoices
  logger.info("Commission batch calculation job ran (placeholder — wire settlement logic)");
  return 0;
}

// ─── Scheduler Registration ───────────────────────────────────────────────────

const JOBS: Array<{ name: string; schedule: string; fn: () => Promise<number> }> = [
  { name: "points_expiry_check",          schedule: "0 2 * * *",   fn: jobPointsExpiryCheck },
  { name: "membership_auto_renewal",      schedule: "0 3 * * *",   fn: jobMembershipAutoRenewal },
  { name: "membership_expiry_warning",    schedule: "0 4 * * *",   fn: jobMembershipExpiryWarning },
  { name: "commission_batch_calculation", schedule: "0 5 1 * *",   fn: jobCommissionBatchCalculation },
  { name: "abandoned_order_cleanup",      schedule: "0 */6 * * *", fn: jobAbandonedOrderCleanup },
];

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  for (const job of JOBS) {
    cron.schedule(job.schedule, () => {
      runJob(job.name, job.fn).catch((err) =>
        logger.error({ err, jobName: job.name }, "Cron job uncaught error"),
      );
    });
    logger.info({ jobName: job.name, schedule: job.schedule }, "Cron job registered");
  }

  logger.info({ count: JOBS.length }, "All cron jobs registered");
}
