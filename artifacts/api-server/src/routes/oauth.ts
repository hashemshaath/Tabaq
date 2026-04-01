import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken, REFRESH_TOKEN_EXPIRES_IN_MS } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";
import crypto from "crypto";

export const oauthRouter = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function parseDeviceLabel(ua?: string): string {
  if (!ua) return "Unknown Device";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android.*mobile/i.test(ua)) return "Android Phone";
  if (/android/i.test(ua)) return "Android Tablet";
  if (/curl/i.test(ua)) return "curl / API client";
  if (/postman/i.test(ua)) return "Postman";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Browser";
}

async function buildOauthSession(
  user: typeof usersTable.$inferSelect,
  req: import("express").Request
) {
  const deviceInfo = parseDeviceLabel(req.headers["user-agent"]);
  const ipAddress  = getClientIp(req);

  const accessToken  = signToken({
    sub: String(user.id), userId: user.id,
    isAdmin: user.isAdmin, isOwner: user.isOwner,
    role: user.isAdmin ? "admin" : user.isOwner ? "owner" : "user",
  });
  const rawRefresh   = crypto.randomBytes(48).toString("hex");
  const tokenHash    = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt    = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

  await db.insert(refreshTokensTable).values({
    userId: user.id, tokenHash, deviceInfo, ipAddress,
    lastUsedAt: new Date(), expiresAt, isRevoked: false,
  });

  const { passwordHash, passcodeHash, passcodeFailedAttempts, passcodeLockedUntil, totpSecret, totpBackupCodes, ...safeUser } = user;
  return {
    accessToken,
    refreshToken: rawRefresh,
    user: { ...safeUser, hasPassword: !!passwordHash, hasPasscode: !!passcodeHash, hasTOTP: !!user.totpEnabledAt },
  };
}

/** Find or create a user from an OAuth provider payload. */
async function findOrCreateOauthUser(opts: {
  provider: "google" | "apple";
  providerId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const { provider, providerId, email, name, avatarUrl } = opts;
  const idCol = provider === "google" ? usersTable.googleId : usersTable.appleId;

  // 1. Look up by provider ID
  const [byProvider] = await db.select().from(usersTable).where(eq(idCol, providerId));
  if (byProvider) return { user: byProvider, isNew: false };

  // 2. Look up by email (link accounts)
  if (email) {
    const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (byEmail) {
      await db.update(usersTable)
        .set({ [provider === "google" ? "googleId" : "appleId"]: providerId, oauthProvider: provider })
        .where(eq(usersTable.id, byEmail.id));
      return { user: { ...byEmail, [provider === "google" ? "googleId" : "appleId"]: providerId }, isNew: false };
    }
  }

  // 3. Create new user
  const displayName = name ?? (email ? email.split("@")[0] : "User");
  const refCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const userUid = `u_${crypto.randomBytes(8).toString("hex")}`;
  const referralCode = crypto.randomBytes(5).toString("hex").toUpperCase();

  const [created] = await db.insert(usersTable).values({
    userUid, email: email ?? null,
    displayName, nameEn: displayName,
    avatarUrl: avatarUrl ?? null,
    refCode, referralCode,
    oauthProvider: provider,
    ...(provider === "google" ? { googleId: providerId } : { appleId: providerId }),
    isEmailVerified: !!email,
    preferredLanguage: "en",
    accountType: "basic",
  }).returning();

  return { user: created, isNew: true };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let googleClient: OAuth2Client | null = null;
if (GOOGLE_CLIENT_ID) googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /auth/oauth/google
 * Body: { id_token: string }
 */
oauthRouter.post("/auth/oauth/google", async (req, res) => {
  if (!googleClient) {
    res.status(503).json({ error: "google_disabled", message: "Google sign-in is not configured on this server." });
    return;
  }
  const { id_token } = req.body ?? {};
  if (!id_token || typeof id_token !== "string") {
    res.status(400).json({ error: "missing_token", message: "id_token is required." });
    return;
  }
  try {
    const ticket   = await googleClient.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID! });
    const payload  = ticket.getPayload();
    if (!payload?.sub) { res.status(401).json({ error: "invalid_token", message: "Invalid Google token." }); return; }

    const { user, isNew } = await findOrCreateOauthUser({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    });

    await logAudit({ actorId: user.id, action: isNew ? "OAUTH_REGISTER" : "OAUTH_LOGIN", ip: getClientIp(req), meta: { provider: "google" } });
    const session = await buildOauthSession(user, req);
    res.json({ ...session, isNewUser: isNew });
  } catch (err: any) {
    req.log?.error?.({ err }, "Google OAuth error");
    res.status(401).json({ error: "invalid_token", message: "Could not verify Google token." });
  }
});

// ─── Apple OAuth ──────────────────────────────────────────────────────────────

// Apple's public JWKS endpoint — we cache the keys to avoid hammering the endpoint
let appleKeysCache: { keys: any[]; fetchedAt: number } | null = null;

async function getApplePublicKey(kid: string): Promise<string | null> {
  const now = Date.now();
  if (!appleKeysCache || now - appleKeysCache.fetchedAt > 60 * 60 * 1000) {
    const r = await fetch("https://appleid.apple.com/auth/keys");
    const body = await r.json() as { keys: any[] };
    appleKeysCache = { keys: body.keys, fetchedAt: now };
  }
  const key = appleKeysCache.keys.find((k: any) => k.kid === kid);
  if (!key) return null;
  // Convert JWK to PEM using Node.js built-in
  const { KeyObject } = await import("node:crypto");
  const pubKey = crypto.createPublicKey({ key, format: "jwk" });
  return pubKey.export({ type: "spki", format: "pem" }) as string;
}

/**
 * POST /auth/oauth/apple
 * Body: { identity_token: string, user?: { name?: { firstName, lastName }, email? } }
 *   (Apple only sends name/email on first sign-in)
 */
oauthRouter.post("/auth/oauth/apple", async (req, res) => {
  const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
  if (!APPLE_CLIENT_ID) {
    res.status(503).json({ error: "apple_disabled", message: "Apple sign-in is not configured on this server." });
    return;
  }
  const { identity_token, user: appleUser } = req.body ?? {};
  if (!identity_token || typeof identity_token !== "string") {
    res.status(400).json({ error: "missing_token", message: "identity_token is required." });
    return;
  }
  try {
    // Decode header to get kid
    const [headerB64] = identity_token.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const pem = await getApplePublicKey(header.kid);
    if (!pem) { res.status(401).json({ error: "invalid_token", message: "Unknown Apple key." }); return; }

    const decoded = jwt.verify(identity_token, pem, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: APPLE_CLIENT_ID,
    }) as any;

    if (!decoded.sub) { res.status(401).json({ error: "invalid_token", message: "Invalid Apple token." }); return; }

    // Apple sends email only on first sign-in — appleUser object captures it
    const email  = decoded.email ?? appleUser?.email ?? null;
    const firstName  = appleUser?.name?.firstName ?? null;
    const lastName   = appleUser?.name?.lastName ?? null;
    const name = [firstName, lastName].filter(Boolean).join(" ") || null;

    const { user, isNew } = await findOrCreateOauthUser({
      provider: "apple",
      providerId: decoded.sub,
      email,
      name,
      avatarUrl: null,
    });

    await logAudit({ actorId: user.id, action: isNew ? "OAUTH_REGISTER" : "OAUTH_LOGIN", ip: getClientIp(req), meta: { provider: "apple" } });
    const session = await buildOauthSession(user, req);
    res.json({ ...session, isNewUser: isNew });
  } catch (err: any) {
    req.log?.error?.({ err }, "Apple OAuth error");
    res.status(401).json({ error: "invalid_token", message: "Could not verify Apple token." });
  }
});
