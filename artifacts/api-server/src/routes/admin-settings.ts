import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { platformSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// Default setting definitions — only non-secret keys are returned in plain GET
const SETTING_DEFAULTS: Array<{ key: string; value: string; category: string; isSecret: boolean }> = [
  // Demo Mode
  { key: "demo_mode",                 value: "false",   category: "general",    isSecret: false },
  // Analytics
  { key: "analytics.googleAnalyticsId",    value: "", category: "analytics", isSecret: false },
  { key: "analytics.googleTagManagerId",   value: "", category: "analytics", isSecret: false },
  { key: "analytics.metaPixelId",          value: "", category: "analytics", isSecret: false },
  // SMTP
  { key: "smtp.host",      value: "",      category: "smtp", isSecret: false },
  { key: "smtp.port",      value: "587",   category: "smtp", isSecret: false },
  { key: "smtp.email",     value: "",      category: "smtp", isSecret: false },
  { key: "smtp.password",  value: "",      category: "smtp", isSecret: true  },
  { key: "smtp.fromName",  value: "Tabaq", category: "smtp", isSecret: false },
  // SMS
  { key: "sms.provider",  value: "unifonic", category: "sms", isSecret: false },
  { key: "sms.senderId",  value: "TABAQ",    category: "sms", isSecret: false },
  { key: "sms.apiKey",    value: "",         category: "sms", isSecret: true  },
  // Firebase
  { key: "firebase.apiKey",           value: "", category: "firebase", isSecret: true  },
  { key: "firebase.authDomain",       value: "", category: "firebase", isSecret: false },
  { key: "firebase.projectId",        value: "", category: "firebase", isSecret: false },
  { key: "firebase.storageBucket",    value: "", category: "firebase", isSecret: false },
  { key: "firebase.messagingSenderId",value: "", category: "firebase", isSecret: false },
  { key: "firebase.appId",            value: "", category: "firebase", isSecret: true  },
  // SEO
  { key: "seo.metaTitle",       value: "Tabaq | طبق — Discover & Book the Best Restaurants", category: "seo", isSecret: false },
  { key: "seo.metaDescription", value: "Tabaq is the premium dining discovery and booking platform for Saudi Arabia and the Middle East.", category: "seo", isSecret: false },
  { key: "seo.keywords",        value: "restaurants, dining, booking, food, Saudi Arabia, Middle East, طبق, مطاعم", category: "seo", isSecret: false },
  { key: "seo.ogImage",         value: "", category: "seo", isSecret: false },
  { key: "seo.twitterHandle",   value: "@tabaqapp", category: "seo", isSecret: false },
  { key: "seo.canonicalDomain", value: "https://tabaq.sa", category: "seo", isSecret: false },
  // Maps
  { key: "maps.googleMapsApiKey", value: "", category: "maps", isSecret: true },
];

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
}

// ─── GET /api/admin/platform-settings ─────────────────────────────────────────
// Returns all platform settings, merging DB values with defaults.
// Secret values are masked unless ?reveal=1 is passed (admin only).
router.get("/admin/platform-settings", requirePermission("settings:read"), async (req, res) => {
  try {
    const reveal = req.query.reveal === "1";
    const dbRows = await db.select().from(platformSettingsTable);
    const dbMap = new Map(dbRows.map(r => [r.key, r]));

    const merged = SETTING_DEFAULTS.map(def => {
      const saved = dbMap.get(def.key);
      const rawValue = saved?.value ?? def.value;
      return {
        key: def.key,
        value: (def.isSecret && !reveal) ? maskSecret(rawValue) : rawValue,
        category: saved?.category ?? def.category,
        isSecret: def.isSecret,
        updatedAt: saved?.updatedAt ?? null,
      };
    });

    // Group by category for convenience
    const byCategory: Record<string, Record<string, string>> = {};
    for (const s of merged) {
      const [cat, field] = s.key.includes(".") ? s.key.split(".", 2) : ["general", s.key];
      if (!byCategory[cat]) byCategory[cat] = {};
      byCategory[cat][field] = s.value;
    }

    res.json({ settings: merged, grouped: byCategory });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── PUT /api/admin/platform-settings ─────────────────────────────────────────
// Upsert one or more settings.  Body: { settings: { [key]: value } }
router.put("/admin/platform-settings", requirePermission("settings:write"), async (req, res) => {
  try {
    const { settings } = req.body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return void res.status(400).json({ error: "settings object required" });
    }

    const validKeys = new Set(SETTING_DEFAULTS.map(d => d.key));
    const results: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (!validKeys.has(key)) continue;
      const def = SETTING_DEFAULTS.find(d => d.key === key)!;

      // If the submitted value looks like a mask, skip to avoid overwriting the real value
      if (def.isSecret && typeof value === "string" && /^\*+$/.test(value.replace(/^.{0,2}/, "").replace(/.{0,2}$/, ""))) {
        continue;
      }

      const existing = await db
        .select({ id: platformSettingsTable.id })
        .from(platformSettingsTable)
        .where(eq(platformSettingsTable.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(platformSettingsTable)
          .set({ value: String(value), updatedBy: null, updatedAt: new Date() })
          .where(eq(platformSettingsTable.key, key));
      } else {
        await db
          .insert(platformSettingsTable)
          .values({
            key,
            value: String(value),
            category: def.category,
            isSecret: def.isSecret,
            updatedBy: null,
          })
          .onConflictDoNothing();
      }
      results.push(key);
    }

    res.json({ success: true, updated: results });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── GET /api/platform-settings/public ────────────────────────────────────────
// Returns non-secret settings only — accessible without auth for the frontend.
router.get("/platform-settings/public", async (_req, res) => {
  try {
    const dbRows = await db.select().from(platformSettingsTable);
    const dbMap = new Map(dbRows.map(r => [r.key, r]));

    const publicSettings: Record<string, string> = {};
    for (const def of SETTING_DEFAULTS) {
      if (def.isSecret) continue;
      const saved = dbMap.get(def.key);
      publicSettings[def.key] = saved?.value ?? def.value;
    }

    res.json({ settings: publicSettings });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
