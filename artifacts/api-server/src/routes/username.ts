import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const RESERVED_USERNAMES = new Set([
  "admin", "tabaq", "support", "help", "api", "app", "www", "mail",
  "restaurant", "restaurants", "user", "users", "profile", "settings",
  "dashboard", "console", "billing", "terms", "privacy", "about",
  "contact", "blog", "feed", "offers", "leaderboard", "bookings",
  "vouchers", "search", "discovery", "collections", "signin", "signup",
  "logout", "partners", "legal", "careers", "press", "media",
]);

function validateUsername(username: string): { valid: boolean; reason?: string } {
  if (!username) return { valid: false, reason: "Username is required" };
  if (username.length < 3) return { valid: false, reason: "Must be at least 3 characters" };
  if (username.length > 30) return { valid: false, reason: "Must be 30 characters or fewer" };
  if (!/^[a-zA-Z0-9_\.]+$/.test(username)) return { valid: false, reason: "Only letters, numbers, underscores, and dots allowed" };
  if (/^[_\.]/.test(username)) return { valid: false, reason: "Cannot start with underscore or dot" };
  if (/[_\.]$/.test(username)) return { valid: false, reason: "Cannot end with underscore or dot" };
  if (/[_\.]{2,}/.test(username)) return { valid: false, reason: "Cannot contain consecutive underscores or dots" };
  if (RESERVED_USERNAMES.has(username.toLowerCase())) return { valid: false, reason: "This username is reserved" };
  return { valid: true };
}

router.get("/username/check", async (req, res) => {
  try {
    const username = String(req.query.username ?? "").trim();
    const validation = validateUsername(username);
    if (!validation.valid) {
      return res.json({ available: false, reason: validation.reason });
    }

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase()));

    res.json({ available: !existing, reason: existing ? "Username is already taken" : null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/me/username", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { username } = req.body as { username: string };

    const trimmed = (username ?? "").trim().toLowerCase();
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, trimmed));

    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({ username: trimmed, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({ username: updated.username });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
