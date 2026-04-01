import crypto from "crypto";
import { db, registerUid } from "@workspace/db";
import { refreshTokensTable } from "@workspace/db/schema";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_EXPIRES_IN_MS } from "./auth.js";

export function generateSessionUid(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `SES-${year}-${suffix}`;
}

export async function createSession(
  userId: number,
  options?: { deviceInfo?: string; ipAddress?: string },
): Promise<{ sessionUid: string; rawRefreshToken: string }> {
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
  const sessionUid = generateSessionUid();

  await db.insert(refreshTokensTable).values({
    userId,
    tokenHash,
    deviceInfo: options?.deviceInfo ?? null,
    ipAddress: options?.ipAddress ?? null,
    expiresAt,
  });

  await registerUid(sessionUid, "SESSION", "active");

  return { sessionUid, rawRefreshToken };
}
