import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Redis as RedisType } from "ioredis";

let redisClient: RedisType | null = null;

const REDIS_URL = process.env["REDIS_URL"];
if (REDIS_URL) {
  try {
    const { Redis } = await import("ioredis");
    const client = new Redis(REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    client.on("error", () => {});
    redisClient = client;
  } catch {
    redisClient = null;
  }
}

async function slidingWindowCheck(
  client: RedisType,
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  const pipe = client.pipeline();
  pipe.zremrangebyscore(key, "-inf", windowStart);
  pipe.zadd(key, now, member);
  pipe.zcard(key);
  pipe.pexpire(key, windowMs);

  const results = await pipe.exec();
  const count = (results?.[2]?.[1] as number | null) ?? 0;
  return count <= max;
}

interface LimiterOptions {
  prefix: string;
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

function defaultKeyGenerator(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const ip = typeof fwd === "string" ? fwd.split(",")[0]!.trim() : (req.ip ?? "unknown");
  return ip;
}

function makeLimiter(options: LimiterOptions): RequestHandler {
  const { prefix, windowMs, max, message, keyGenerator, skip } = options;

  if (redisClient) {
    const client = redisClient;
    return async (req: Request, res: Response, next: NextFunction) => {
      if (skip?.(req)) return next();
      const key = `${prefix}${(keyGenerator ?? defaultKeyGenerator)(req)}`;
      try {
        const allowed = await slidingWindowCheck(client, key, windowMs, max);
        if (!allowed) {
          const retryAfter = Math.ceil(windowMs / 1000);
          res.setHeader("Retry-After", String(retryAfter));
          res.status(429).json({ error: "rate_limited", message, retry_after: retryAfter });
          return;
        }
      } catch {
      }
      next();
    };
  }

  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator ?? defaultKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: (_req: Request, res: Response) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "rate_limited", message, retry_after: retryAfter });
    },
    validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  });
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const authRateLimiter = makeLimiter({
  prefix: "rl:auth:",
  windowMs: envInt("RATE_LIMIT_AUTH_WINDOW_MS", 60_000),
  max: envInt("RATE_LIMIT_AUTH_MAX", 10),
  message: "Too many authentication attempts. Please wait a moment and try again.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const registerRateLimiter = makeLimiter({
  prefix: "rl:register:",
  windowMs: 60_000,
  max: 5,
  message: "Too many registration attempts. Please wait a moment and try again.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const loginRateLimiter = makeLimiter({
  prefix: "rl:login:",
  windowMs: 60_000,
  max: 10,
  message: "Too many login attempts. Please wait a moment and try again.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const otpRateLimiter = makeLimiter({
  prefix: "rl:otp:",
  windowMs: 60_000,
  max: 3,
  message: "Too many OTP requests. Please wait a moment and try again.",
  keyGenerator: (req: Request) => {
    const body = req.body as Record<string, string> | undefined;
    const identifier = body?.phone ?? body?.email;
    if (identifier) return identifier;
    return defaultKeyGenerator(req);
  },
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const forgotPasswordRateLimiter = makeLimiter({
  prefix: "rl:forgotpw:",
  windowMs: 60 * 60_000,
  max: 3,
  message: "Too many forgot-password requests. Please wait an hour and try again.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const paymentRateLimiter = makeLimiter({
  prefix: "rl:payment:",
  windowMs: envInt("RATE_LIMIT_PAYMENT_WINDOW_MS", 60_000),
  max: envInt("RATE_LIMIT_PAYMENT_MAX", 20),
  message: "Too many payment requests. Please slow down.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const searchRateLimiter = makeLimiter({
  prefix: "rl:search:",
  windowMs: envInt("RATE_LIMIT_SEARCH_WINDOW_MS", 60_000),
  max: envInt("RATE_LIMIT_SEARCH_MAX", 60),
  message: "Too many search requests. Please slow down.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const publicRateLimiter = makeLimiter({
  prefix: "rl:public:",
  windowMs: envInt("RATE_LIMIT_PUBLIC_WINDOW_MS", 60_000),
  max: envInt("RATE_LIMIT_PUBLIC_MAX", 200),
  message: "Too many requests. Please slow down.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});

export const aiRateLimiter = makeLimiter({
  prefix: "rl:ai:",
  windowMs: envInt("RATE_LIMIT_AI_WINDOW_MS", 60_000),
  max: envInt("RATE_LIMIT_AI_MAX", 10),
  message: "Too many AI requests. Please wait before generating more content.",
  skip: (req) => process.env["NODE_ENV"] === "test",
});
