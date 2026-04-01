import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateUsername } from "../lib/auth.js";

const router = Router();

router.get("/username/check", async (req, res) => {
  try {
    const username = String(req.query.username ?? "").trim();
    const validation = validateUsername(username);
    if (!validation.valid) {
      return res.json({ available: false, reason: validation.reason });
    }

    const normalizedLower = username.toLowerCase();
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`LOWER(${usersTable.username}) = ${normalizedLower}`)
      .limit(1);

    res.json({ available: !existing, reason: existing ? "Username is already taken" : null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/me/username", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { username } = req.body as { username: string };

    const trimmed = (username ?? "").trim();
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const normalizedLower = trimmed.toLowerCase();

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`LOWER(${usersTable.username}) = ${normalizedLower}`)
      .limit(1);

    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({ username: normalizedLower, updatedAt: new Date() })
      .where(sql`${usersTable.id} = ${userId}`)
      .returning();

    res.json({ username: updated.username });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
