/**
 * Notification Service
 *
 * Provides a single `notify()` function that fires an in-app notification.
 * Currently stores events in the logger and is ready for real delivery channels
 * (FCM push, SendGrid email, Twilio SMS) — wire them in the TODO sections below.
 *
 * IMPORTANT: Always call with .catch() — never let it block or crash the main flow.
 * Example:
 *   notify({ userId, type: "booking_confirmed", ... })
 *     .catch((err) => logger.warn({ err }, "Notification failed (non-critical)"));
 */

import { logger } from "./logger.js";

export type NotifType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "order_confirmed"
  | "order_cancelled"
  | "order_delivered"
  | "payment_success"
  | "payment_failed"
  | "points_earned"
  | "points_redeemed"
  | "membership_renewed"
  | "membership_expiring"
  | "membership_failed"
  | "membership_cancelled"
  | "voucher_purchased"
  | "voucher_expiring"
  | "refund_processed"
  | "dispute_opened"
  | "dispute_resolved";

export interface NotifPayload {
  userId: number;
  type: NotifType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  refId?: number;
  refType?: string;
  metadata?: Record<string, unknown>;
}

export async function notify(payload: NotifPayload): Promise<void> {
  logger.info(
    {
      notif: {
        userId: payload.userId,
        type: payload.type,
        titleEn: payload.titleEn,
        refId: payload.refId,
        refType: payload.refType,
      },
    },
    `NOTIFY [${payload.type}] → user #${payload.userId}: ${payload.titleEn}`,
  );

  // TODO: resolve user's preferred channels from user_notification_prefs table
  // TODO: if channel includes 'push' → send via FCM / APNs
  // TODO: if channel includes 'email' → send via SendGrid / SES
  // TODO: if channel includes 'sms' → send via Twilio / Unifonic
}

export function notifyAsync(payload: NotifPayload): void {
  notify(payload).catch((err) =>
    logger.warn({ err, notifType: payload.type, userId: payload.userId }, "Notification delivery failed (non-critical)"),
  );
}
