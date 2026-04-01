/**
 * Sentry — Backend Error Monitoring
 *
 * Initializes Sentry for the API server.
 * Disabled automatically when SENTRY_DSN is not set (dev-safe).
 *
 * This module must be imported at the very top of index.ts,
 * before any other imports, for proper instrumentation.
 */

import * as Sentry from "@sentry/node";
import { logger } from "./logger.js";

export function initSentry(): void {
  const dsn = process.env["SENTRY_DSN"];
  const environment = process.env["SENTRY_ENVIRONMENT"] ?? process.env["NODE_ENV"] ?? "development";
  const release = process.env["SENTRY_RELEASE"];

  if (!dsn) {
    logger.info("[sentry] SENTRY_DSN not set — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    // Only send 100% of events in production, 10% in staging, none in dev
    tracesSampleRate: environment === "production" ? 0.1 : environment === "staging" ? 0.05 : 0,
    // Ignore common non-actionable errors
    ignoreErrors: [
      "ECONNRESET",
      "EPIPE",
      "ECONNABORTED",
      "socket hang up",
    ],
    beforeSend(event) {
      // Strip sensitive data from request bodies before sending to Sentry
      if (event.request?.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        for (const sensitiveKey of ["password", "code", "otp", "token", "secret", "key"]) {
          if (sensitiveKey in data) {
            data[sensitiveKey] = "[REDACTED]";
          }
        }
      }
      return event;
    },
  });

  logger.info({ environment, release }, "[sentry] Error monitoring initialized");
}

/**
 * Capture an exception with optional extra context.
 * Safe to call even when Sentry is not initialized.
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!process.env["SENTRY_DSN"]) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(err);
  });
}

/**
 * Capture a non-fatal message.
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!process.env["SENTRY_DSN"]) return;
  Sentry.captureMessage(message, level);
}

export { Sentry };
