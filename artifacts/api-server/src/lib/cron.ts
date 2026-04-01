// Cron Job Scheduler
//
// All scheduled tasks are registered here and started by calling startCronJobs().
// Call startCronJobs() once from index.ts after the server starts listening.
//
// Overlap protection: an in-process Map tracks actively-running jobs.
// A job that is still running when the next tick fires is skipped with a warning log.
// This is reliable for a single-process Node.js server. For multi-instance deployments,
// replace the in-process lock with a DB advisory lock or distributed mutex.
//
// Schedule reference (node-cron):
//   "0 2 * * *"    -> daily at 02:00 UTC
//   "0 3 * * *"    -> daily at 03:00 UTC
//   "0 0 1 * *"    -> 1st of every month at 00:00 UTC
//   "0 */4 * * *"  -> every 4 hours
//   "0 */6 * * *"  -> every 6 hours

import cron from "node-cron";
import { db } from "@workspace/db";
import {
  usersTable, ordersTable, membershipsTable, cronLogsTable,
  pointsTransactionsTable,
} from "@workspace/db/schema";
import { and, eq, lt, sql, lte, gte, inArray } from "drizzle-orm";
import { logger } from "./logger.js";
import { transitionMembershipStatus } from "./membership.js";
import { notifyAsync } from "./notify.js";
import { initiatePayment } from "./paymentGateway.js";

// ─── Overlap / Parallel-Run Protection ────────────────────────────────────────
// Tracks job names that are currently executing. Prevents a slow job from
// starting a second concurrent instance when the next cron tick fires.

const runningJobs = new Map<string, Date>(); // jobName → startedAt

// ─── Job Runner Wrapper ───────────────────────────────────────────────────────

async function runJob(
  jobName: string,
  fn: () => Promise<number>,
): Promise<void> {
  // Overlap check: skip if a previous run is still active
  if (runningJobs.has(jobName)) {
    const since = runningJobs.get(jobName)!;
    logger.warn(
      { jobName, runningSince: since.toISOString() },
      `Cron SKIP: ${jobName} is still running from a previous tick (started ${since.toISOString()}) — skipping this tick`,
    );
    return;
  }

  const startedAt = new Date();
  runningJobs.set(jobName, startedAt);

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
  } finally {
    // Always release the lock — even if the job threw
    runningJobs.delete(jobName);
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

// ─── New: Failed Payment Retry ─────────────────────────────────────────────────
// Runs every 4 hours. Finds card-payment orders still in "placed" status (payment
// not confirmed) with fewer than 3 retry attempts, and re-initiates the payment.
//
// Retry cap: after 3 failed attempts the order is cancelled and the customer is
// notified to re-place with a different payment method.
//
// Window: only retries orders created within the last 48 hours that are at least
// 5 minutes old (to avoid racing with the initial payment flow).

const MAX_PAYMENT_RETRIES = 3;
const CARD_PAYMENT_METHODS = ["card", "apple_pay", "stc_pay"] as const;

async function jobFailedPaymentRetry(): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 h ago
  const windowEnd   = new Date(now.getTime() -  5 * 60 * 1000);       // 5 min ago

  // Find card-payment orders still in "placed" state with retries remaining
  const candidates = await db
    .select({
      id:               ordersTable.id,
      orderNumber:      ordersTable.orderNumber,
      userId:           ordersTable.userId,
      total:            ordersTable.total,
      currency:         ordersTable.currency,
      paymentRetryCount: ordersTable.paymentRetryCount,
    })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.status, "placed"),
        inArray(ordersTable.paymentMethod, [...CARD_PAYMENT_METHODS]),
        lt(ordersTable.paymentRetryCount, MAX_PAYMENT_RETRIES),
        gte(ordersTable.createdAt, windowStart),
        lte(ordersTable.createdAt, windowEnd),
      ),
    )
    .limit(50);

  let retried = 0;

  for (const order of candidates) {
    try {
      const result = await initiatePayment({
        amount:      parseFloat(order.total),
        currency:    order.currency,
        orderId:     String(order.id),
        description: `Retry #${order.paymentRetryCount + 1} for order ${order.orderNumber}`,
      });

      const newRetryCount = order.paymentRetryCount + 1;

      if (result.success) {
        // Payment went through — confirm the order and reset retry counter
        await db
          .update(ordersTable)
          .set({
            status:            "confirmed",
            paymentRetryCount: newRetryCount,
            updatedAt:         now,
          })
          .where(eq(ordersTable.id, order.id));

        if (order.userId) {
          notifyAsync({
            userId:  order.userId,
            type:    "payment_success",
            titleEn: "Payment Successful",
            titleAr: "تمت عملية الدفع بنجاح",
            bodyEn:  `Your payment for order ${order.orderNumber} was processed successfully on retry #${newRetryCount}.`,
            bodyAr:  `تمت معالجة دفعتك للطلب ${order.orderNumber} بنجاح في المحاولة رقم ${newRetryCount}.`,
            refId:   order.id,
            refType: "order",
          });
        }

        logger.info({ orderId: order.id, attempt: newRetryCount }, "Payment retry succeeded");
      } else {
        // Payment failed again — increment counter; cancel if cap reached
        const isFinal = newRetryCount >= MAX_PAYMENT_RETRIES;

        await db
          .update(ordersTable)
          .set({
            status:            isFinal ? "cancelled" : "placed",
            paymentRetryCount: newRetryCount,
            updatedAt:         now,
          })
          .where(eq(ordersTable.id, order.id));

        if (order.userId) {
          notifyAsync({
            userId:  order.userId,
            type:    "payment_failed",
            titleEn: isFinal ? "Order Cancelled — Payment Failed" : "Payment Retry Failed",
            titleAr: isFinal ? "تم إلغاء الطلب — فشل الدفع" : "فشلت إعادة محاولة الدفع",
            bodyEn:  isFinal
              ? `Your order ${order.orderNumber} has been cancelled after ${MAX_PAYMENT_RETRIES} failed payment attempts. Please re-place your order with a different payment method.`
              : `Payment retry #${newRetryCount} for order ${order.orderNumber} failed. We will try again automatically. Error: ${result.errorCode ?? "unknown"}.`,
            bodyAr:  isFinal
              ? `تم إلغاء طلبك ${order.orderNumber} بعد ${MAX_PAYMENT_RETRIES} محاولات دفع فاشلة. يرجى إعادة الطلب بطريقة دفع مختلفة.`
              : `فشلت إعادة محاولة الدفع #${newRetryCount} للطلب ${order.orderNumber}. سنحاول مرة أخرى تلقائيًا.`,
            refId:   order.id,
            refType: "order",
            metadata: { attempt: newRetryCount, errorCode: result.errorCode },
          });
        }

        logger.warn(
          { orderId: order.id, attempt: newRetryCount, isFinal, errorCode: result.errorCode },
          isFinal ? "Payment retry cap reached — order cancelled" : "Payment retry failed",
        );
      }

      retried++;
    } catch (err) {
      logger.error({ err, orderId: order.id }, "Unexpected error during payment retry — skipping order");
    }
  }

  return retried;
}

// ─── Scheduler Registration ───────────────────────────────────────────────────

const JOBS: Array<{ name: string; schedule: string; fn: () => Promise<number> }> = [
  { name: "points_expiry_check",          schedule: "0 2 * * *",   fn: jobPointsExpiryCheck },
  { name: "membership_auto_renewal",      schedule: "0 3 * * *",   fn: jobMembershipAutoRenewal },
  { name: "membership_expiry_warning",    schedule: "0 4 * * *",   fn: jobMembershipExpiryWarning },
  { name: "commission_batch_calculation", schedule: "0 5 1 * *",   fn: jobCommissionBatchCalculation },
  { name: "abandoned_order_cleanup",      schedule: "0 */6 * * *", fn: jobAbandonedOrderCleanup },
  { name: "failed_payment_retry",         schedule: "0 */4 * * *", fn: jobFailedPaymentRetry },
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
