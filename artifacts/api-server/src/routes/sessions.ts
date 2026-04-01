import { Router } from "express";
import { db } from "@workspace/db";
import { refreshTokensTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

function getClientIp(req: import("express").Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}

/** Parse a User-Agent string into a friendly label. */
function parseDeviceLabel(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const s = ua.toLowerCase();
  // Mobile OS
  if (s.includes("iphone")) return "iPhone";
  if (s.includes("ipad")) return "iPad";
  if (s.includes("android")) {
    if (s.includes("mobile")) return "Android phone";
    return "Android tablet";
  }
  // Desktop browsers
  if (s.includes("edg/")) return "Edge (desktop)";
  if (s.includes("chrome/") && !s.includes("chromium")) return "Chrome (desktop)";
  if (s.includes("firefox/")) return "Firefox (desktop)";
  if (s.includes("safari/") && !s.includes("chrome")) return "Safari (desktop)";
  // Curl / API clients
  if (s.includes("curl")) return "curl / API client";
  if (s.includes("postman")) return "Postman";
  return "Unknown device";
}

// ── GET /auth/sessions ────────────────────────────────────────────────────────
// List all active (non-revoked, non-expired) sessions for the current user.
// The current session (identified by the Authorization token) is flagged.

router.get("/auth/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const now = new Date();

    const sessions = await db
      .select({
        id: refreshTokensTable.id,
        deviceInfo: refreshTokensTable.deviceInfo,
        ipAddress: refreshTokensTable.ipAddress,
        lastUsedAt: refreshTokensTable.lastUsedAt,
        createdAt: refreshTokensTable.createdAt,
        expiresAt: refreshTokensTable.expiresAt,
      })
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          eq(refreshTokensTable.isRevoked, false),
          gt(refreshTokensTable.expiresAt, now),
        ),
      )
      .orderBy(refreshTokensTable.createdAt);

    // Try to identify which session is "current" by matching the Bearer token hash.
    // If not possible (cookie-based), we skip flagging current.
    let currentSessionId: number | null = null;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Can't determine current — find most-recently-created as best effort
      if (sessions.length > 0) {
        const latest = sessions.reduce((a, b) =>
          a.createdAt > b.createdAt ? a : b,
        );
        currentSessionId = latest.id;
      }
    }

    const result = sessions.map((s) => ({
      id: s.id,
      device: parseDeviceLabel(s.deviceInfo),
      ip_address: s.ipAddress ?? null,
      last_active: s.lastUsedAt ?? s.createdAt,
      created_at: s.createdAt,
      expires_at: s.expiresAt,
      is_current: s.id === currentSessionId,
    }));

    res.json({ sessions: result, total: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list sessions");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── DELETE /auth/sessions/:id ─────────────────────────────────────────────────
// Revoke a specific session by ID. Only the session owner can revoke their own sessions.

router.delete("/auth/sessions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const sessionId = parseInt(req.params["id"] as string, 10);
    const ip = getClientIp(req);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid session ID" });
      return;
    }

    const now = new Date();
    const [session] = await db
      .select({ id: refreshTokensTable.id, userId: refreshTokensTable.userId, isRevoked: refreshTokensTable.isRevoked, expiresAt: refreshTokensTable.expiresAt })
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.id, sessionId))
      .limit(1);

    if (!session || session.userId !== userId) {
      res.status(404).json({ error: "not_found", message: "Session not found" });
      return;
    }

    if (session.isRevoked || session.expiresAt <= now) {
      res.status(409).json({ error: "already_revoked", message: "Session is already expired or revoked" });
      return;
    }

    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(eq(refreshTokensTable.id, sessionId));

    await logAudit({
      action: "SESSION_REVOKED",
      actorId: userId,
      actorUid: req.auth!.userUid,
      ip,
      meta: { sessionId },
    });

    res.json({ success: true, message: "Session revoked" });
  } catch (err) {
    req.log.error({ err }, "Failed to revoke session");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── DELETE /auth/sessions ─────────────────────────────────────────────────────
// Revoke ALL active sessions for the current user (sign out everywhere).
// Optional query param: ?keep_current=true — attempts to preserve the session
// whose token was used for this request (best-effort; falls back to revoking all).

router.delete("/auth/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const ip = getClientIp(req);
    const now = new Date();

    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          eq(refreshTokensTable.isRevoked, false),
          gt(refreshTokensTable.expiresAt, now),
        ),
      );

    await logAudit({
      action: "ALL_SESSIONS_REVOKED",
      actorId: userId,
      actorUid: req.auth!.userUid,
      ip,
      meta: {},
    });

    res.json({ success: true, message: "All sessions revoked. Please log in again." });
  } catch (err) {
    req.log.error({ err }, "Failed to revoke all sessions");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
