/**
 * Rate Limiting Middleware
 *
 * Provides configurable rate limiting for different API route categories.
 * Uses in-memory store by default (suitable for single-instance deployments).
 * For multi-instance production deployments, swap the store for a Redis-backed
 * one using `rate-limit-redis` when REDIS_URL is available.
 *
 * All limits are configurable via environment variables — see .env.example.
 */

import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

function env(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Standard error response for rate-limited requests */
function rateLimitHandler(
  _req: unknown,
  res: {
    status: (c: number) => { json: (b: unknown) => void };
    setHeader: (name: string, value: string | number) => void;
    getHeader: (name: string) => string | number | string[] | undefined;
  },
  _next: unknown,
  options: { message: string; windowMs: number },
) {
  // Set Retry-After in seconds (derived from windowMs) so clients know when to retry
  const retryAfterSec = Math.ceil(options.windowMs / 1000);
  res.setHeader("Retry-After", retryAfterSec);
  res.status(429).json({
    error: "rate_limited",
    message: options.message,
    retry_after: retryAfterSec,
  });
}

/**
 * Auth / OTP endpoints — strictest limits.
 * 10 requests per 60s per IP (configurable).
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env("RATE_LIMIT_AUTH_WINDOW_MS", 60_000),
  max: env("RATE_LIMIT_AUTH_MAX", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please wait a moment and try again.",
  handler: rateLimitHandler as unknown as Parameters<typeof rateLimit>[0]["handler"],
  skip: () => process.env["NODE_ENV"] === "test",
});

/**
 * Payment / sensitive endpoints — tight limits.
 * 20 requests per 60s per IP.
 */
export const paymentRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env("RATE_LIMIT_PAYMENT_WINDOW_MS", 60_000),
  max: env("RATE_LIMIT_PAYMENT_MAX", 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many payment requests. Please slow down.",
  handler: rateLimitHandler as unknown as Parameters<typeof rateLimit>[0]["handler"],
  skip: () => process.env["NODE_ENV"] === "test",
});

/**
 * Search-heavy endpoints — moderate limits.
 * 60 requests per 60s per IP.
 */
export const searchRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env("RATE_LIMIT_SEARCH_WINDOW_MS", 60_000),
  max: env("RATE_LIMIT_SEARCH_MAX", 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many search requests. Please slow down.",
  handler: rateLimitHandler as unknown as Parameters<typeof rateLimit>[0]["handler"],
  skip: () => process.env["NODE_ENV"] === "test",
});

/**
 * General public API — permissive limits.
 * 200 requests per 60s per IP.
 */
export const publicRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env("RATE_LIMIT_PUBLIC_WINDOW_MS", 60_000),
  max: env("RATE_LIMIT_PUBLIC_MAX", 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please slow down.",
  handler: rateLimitHandler as unknown as Parameters<typeof rateLimit>[0]["handler"],
  skip: () => process.env["NODE_ENV"] === "test",
});

/**
 * AI / expensive endpoints — very tight limits to protect OpenAI costs.
 * 10 requests per 60s per IP.
 */
export const aiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env("RATE_LIMIT_AI_WINDOW_MS", 60_000),
  max: env("RATE_LIMIT_AI_MAX", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many AI requests. Please wait before generating more content.",
  handler: rateLimitHandler as unknown as Parameters<typeof rateLimit>[0]["handler"],
  skip: () => process.env["NODE_ENV"] === "test",
});
