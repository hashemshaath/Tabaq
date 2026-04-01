import crypto from "crypto";
import { db, registerUid } from "@workspace/db";
import { sessionsTable, userDevicesTable } from "@workspace/db/schema";
import { signRefreshToken, hashRefreshToken, REFRESH_TOKEN_EXPIRES_IN_MS } from "./auth.js";
import { eq } from "drizzle-orm";

export function generateSessionUid(): string {
  const suffix = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `SES-${suffix}`;
}

export function computeDeviceFingerprint(userAgent: string | undefined, ip: string | undefined): string {
  const raw = `${userAgent ?? ""}|${ip ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function parseDeviceName(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const s = ua.toLowerCase();
  if (s.includes("iphone")) return "iPhone";
  if (s.includes("ipad")) return "iPad";
  if (s.includes("android")) {
    if (s.includes("mobile")) return "Android Phone";
    return "Android Tablet";
  }
  if (s.includes("edg/")) return "Edge (desktop)";
  if (s.includes("chrome/") && !s.includes("chromium")) return "Chrome (desktop)";
  if (s.includes("firefox/")) return "Firefox (desktop)";
  if (s.includes("safari/") && !s.includes("chrome")) return "Safari (desktop)";
  if (s.includes("curl")) return "curl / API client";
  if (s.includes("postman")) return "Postman";
  return "Unknown device";
}

export function parseDeviceOs(ua: string | null | undefined): string {
  if (!ua) return "Unknown";
  const s = ua.toLowerCase();
  if (s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("android")) return "Android";
  if (s.includes("windows nt")) return "Windows";
  if (s.includes("mac os x")) return "macOS";
  if (s.includes("linux")) return "Linux";
  return "Unknown";
}

export interface CreateSessionOptions {
  sesUid?: string;
  userUid?: string | null;
  deviceInfo?: string;
  ipAddress?: string;
  appVersion?: string;
  locationCountry?: string;
  locationCity?: string;
  userType?: string;
  flaggedSuspicious?: boolean;
}

export async function createSession(
  userId: number,
  options?: CreateSessionOptions,
): Promise<{ sessionUid: string; rawRefreshToken: string }> {
  const sesUid = options?.sesUid ?? generateSessionUid();
  const rawRefreshToken = signRefreshToken(sesUid, userId);
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

  const deviceFingerprint = computeDeviceFingerprint(options?.deviceInfo, options?.ipAddress);
  const deviceName = parseDeviceName(options?.deviceInfo);
  const deviceOs = parseDeviceOs(options?.deviceInfo);

  await db.insert(sessionsTable).values({
    sesUid,
    userId,
    userUid: options?.userUid ?? null,
    userType: options?.userType ?? "USER",
    refreshTokenHash: tokenHash,
    prevRefreshTokenHash: null,
    deviceFingerprint,
    deviceName,
    deviceOs,
    appVersion: options?.appVersion ?? null,
    ipAddress: options?.ipAddress ?? null,
    locationCountry: options?.locationCountry ?? null,
    locationCity: options?.locationCity ?? null,
    flaggedSuspicious: options?.flaggedSuspicious ?? false,
    expiresAt,
  });

  await db
    .insert(userDevicesTable)
    .values({
      userId,
      deviceFingerprint,
      deviceInfo: options?.deviceInfo ?? null,
    })
    .onConflictDoUpdate({
      target: [userDevicesTable.userId, userDevicesTable.deviceFingerprint],
      set: {
        lastSeenAt: new Date(),
        deviceInfo: options?.deviceInfo ?? null,
      },
    })
    .catch(() => {});

  await registerUid(sesUid, "SESSION", "active").catch(() => {});

  return { sessionUid: sesUid, rawRefreshToken };
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await db
    .update(sessionsTable)
    .set({ isRevoked: true, lastUsedAt: new Date() })
    .where(eq(sessionsTable.userId, userId));
}
