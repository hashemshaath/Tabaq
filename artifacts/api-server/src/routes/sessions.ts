import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { logAudit } from "../lib/audit.js";
import { requestLogger } from "../middleware/requestLogger.js";
import { inputSanitizer } from "../middleware/inputSanitizer.js";

const router = Router();

router.use(requestLogger);
router.use(inputSanitizer);

function getClientIp(req: import("express").Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}

// ── GET /auth/sessions ────────────────────────────────────────────────────────

router.get("/auth/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const now = new Date();

    const sessions = await db
      .select({
        sesUid: sessionsTable.sesUid,
        deviceName: sessionsTable.deviceName,
        deviceOs: sessionsTable.deviceOs,
        deviceFingerprint: sessionsTable.deviceFingerprint,
        ipAddress: sessionsTable.ipAddress,
        locationCountry: sessionsTable.locationCountry,
        locationCity: sessionsTable.locationCity,
        lastUsedAt: sessionsTable.lastUsedAt,
        createdAt: sessionsTable.createdAt,
        expiresAt: sessionsTable.expiresAt,
      })
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.userId, userId),
          eq(sessionsTable.isRevoked, false),
          gt(sessionsTable.expiresAt, now),
        ),
      )
      .orderBy(sessionsTable.createdAt);

    const currentSesUid = req.auth!.sesUid;
    const result = sessions.map((s) => ({
      uid: s.sesUid,
      device_name: s.deviceName ?? "Unknown device",
      device_os: s.deviceOs ?? "Unknown",
      ip_address: s.ipAddress ?? null,
      location_country: s.locationCountry ?? null,
      location_city: s.locationCity ?? null,
      last_active: s.lastUsedAt ?? s.createdAt,
      created_at: s.createdAt,
      expires_at: s.expiresAt,
      is_current: !!(currentSesUid && s.sesUid === currentSesUid),
    }));

    res.json({ sessions: result, total: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list sessions");
    res.status(500).json({ error: "internal_error" });
  }
});

// ── DELETE /auth/sessions/all ─────────────────────────────────────────────────

router.delete("/auth/sessions/all", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const ip = getClientIp(req);
    const now = new Date();

    await db
      .update(sessionsTable)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(
        and(
          eq(sessionsTable.userId, userId),
          eq(sessionsTable.isRevoked, false),
          gt(sessionsTable.expiresAt, now),
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

// ── DELETE /auth/sessions/:uid ────────────────────────────────────────────────

router.delete("/auth/sessions/:uid", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const sesUid = req.params["uid"] as string;
    const ip = getClientIp(req);

    if (!sesUid) {
      res.status(400).json({ error: "bad_request", message: "Invalid session UID" });
      return;
    }

    const now = new Date();
    const [session] = await db
      .select({ sesUid: sessionsTable.sesUid, userId: sessionsTable.userId, isRevoked: sessionsTable.isRevoked, expiresAt: sessionsTable.expiresAt })
      .from(sessionsTable)
      .where(eq(sessionsTable.sesUid, sesUid))
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
      .update(sessionsTable)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(eq(sessionsTable.sesUid, sesUid));

    await logAudit({
      action: "SESSION_REVOKED",
      actorId: userId,
      actorUid: req.auth!.userUid,
      ip,
      meta: { sesUid },
    });

    res.json({ success: true, message: "Session revoked" });
  } catch (err) {
    req.log.error({ err }, "Failed to revoke session");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
