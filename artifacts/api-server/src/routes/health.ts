import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// /api/healthz — simple ping (no DB check, used for fast liveness probes)
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// /api/health — full readiness check including DB connectivity
router.get("/health", async (req, res) => {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const dbLatencyMs = Date.now() - start;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      db: { status: "ok", latencyMs: dbLatencyMs },
      environment: process.env["NODE_ENV"] ?? "development",
    });
  } catch (err) {
    req.log.error({ err }, "Health check DB ping failed");
    res.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      db: { status: "error", error: "Database unreachable" },
    });
  }
});

export default router;
