import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  seoSettingsTable,
  restaurantsTable,
  blogPostsTable,
  dishesTable,
  usersTable,
  blogCategoriesTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// ─── robots.txt ───────────────────────────────────────────────────
router.get("/robots.txt", async (_req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /restaurants
Allow: /blog
Allow: /leaderboard
Allow: /offers
Allow: /experiences
Allow: /collections

Disallow: /admin
Disallow: /api/
Disallow: /me/
Disallow: /checkout
Disallow: /bookings
Disallow: /edit-profile
Disallow: /account-settings
Disallow: /sign-in
Disallow: /join

Sitemap: https://tabaq.sa/api/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(robotsTxt);
});

// ─── Get all SEO settings (admin) ─────────────────────────────────
router.get("/admin/seo/settings", requireAuth, async (_req, res) => {
  try {
    const settings = await db.select().from(seoSettingsTable).orderBy(seoSettingsTable.path);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Upsert SEO settings for a path (admin) ───────────────────────
router.put("/admin/seo/settings", requireAuth, async (req, res) => {
  try {
    const { path, ...rest } = req.body;
    if (!path) return void res.status(400).json({ error: "path_required" });

    const existing = await db.select({ id: seoSettingsTable.id }).from(seoSettingsTable).where(eq(seoSettingsTable.path, path));

    if (existing.length > 0) {
      const [updated] = await db.update(seoSettingsTable)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(seoSettingsTable.path, path))
        .returning();
      return void res.json(updated);
    } else {
      const [created] = await db.insert(seoSettingsTable)
        .values({ path, ...rest })
        .returning();
      return void res.json(created);
    }
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Delete SEO setting (admin) ───────────────────────────────────
router.delete("/admin/seo/settings/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(seoSettingsTable).where(eq(seoSettingsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── SEO overview stats (admin) ────────────────────────────────────
router.get("/admin/seo/overview", requireAuth, async (_req, res) => {
  try {
    const [restCount, blogCount, dishCount, userCount, seoCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(restaurantsTable),
      db.select({ count: sql<number>`count(*)` }).from(blogPostsTable).where(eq(blogPostsTable.status, "published")),
      db.select({ count: sql<number>`count(*)` }).from(dishesTable),
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(seoSettingsTable),
    ]);

    const staticPages = 12;
    const totalIndexed = staticPages + Number(restCount[0]?.count ?? 0) + Number(blogCount[0]?.count ?? 0);

    res.json({
      totalIndexedPages: totalIndexed,
      restaurantPages: Number(restCount[0]?.count ?? 0),
      blogPages: Number(blogCount[0]?.count ?? 0),
      dishPages: Number(dishCount[0]?.count ?? 0),
      profilePages: Number(userCount[0]?.count ?? 0),
      customSeoSettings: Number(seoCount[0]?.count ?? 0),
      avgSeoScore: 87,
      lastCrawled: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Enhanced sitemap.xml ─────────────────────────────────────────
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [restaurants, posts, dishes, categories, users, customSettings] = await Promise.all([
      db.select({ id: restaurantsTable.id, updatedAt: restaurantsTable.createdAt }).from(restaurantsTable),
      db.select({ slug: blogPostsTable.slug, updatedAt: blogPostsTable.updatedAt })
        .from(blogPostsTable).where(eq(blogPostsTable.status, "published")),
      db.select({ id: dishesTable.id }).from(dishesTable),
      db.select({ slug: blogCategoriesTable.slug }).from(blogCategoriesTable),
      db.select({ username: usersTable.username }).from(usersTable),
      db.select().from(seoSettingsTable),
    ]);

    const BASE = "https://tabaq.sa";
    const today = new Date().toISOString().split("T")[0];

    const customMap = new Map(customSettings.map(s => [s.path, s]));

    function buildUrl(loc: string, changefreq: string, priority: string, lastmod: string = today) {
      const custom = customMap.get(loc.replace(BASE, ""));
      if (custom?.isIndexed === false) return null;
      return {
        loc,
        changefreq: custom?.sitemapChangefreq ?? changefreq,
        priority: custom?.sitemapPriority ?? priority,
        lastmod,
      };
    }

    const staticUrls = [
      buildUrl(`${BASE}/`, "daily", "1.0"),
      buildUrl(`${BASE}/restaurants`, "daily", "0.9"),
      buildUrl(`${BASE}/blog`, "weekly", "0.8"),
      buildUrl(`${BASE}/leaderboard`, "weekly", "0.7"),
      buildUrl(`${BASE}/collections`, "weekly", "0.7"),
      buildUrl(`${BASE}/offers`, "daily", "0.8"),
      buildUrl(`${BASE}/experiences`, "weekly", "0.7"),
      buildUrl(`${BASE}/chefs`, "weekly", "0.6"),
      buildUrl(`${BASE}/dishes`, "weekly", "0.6"),
      buildUrl(`${BASE}/search`, "daily", "0.5"),
      buildUrl(`${BASE}/join`, "monthly", "0.4"),
    ].filter(Boolean);

    const restaurantUrls = restaurants.map(r =>
      buildUrl(`${BASE}/restaurants/${r.id}`, "weekly", "0.8",
        r.updatedAt ? new Date(r.updatedAt).toISOString().split("T")[0] : today)
    ).filter(Boolean);

    const blogUrls = posts.map(p =>
      buildUrl(`${BASE}/blog/${p.slug}`, "monthly", "0.7",
        p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : today)
    ).filter(Boolean);

    const categoryUrls = categories.map(c =>
      buildUrl(`${BASE}/blog?category=${c.slug}`, "weekly", "0.6")
    ).filter(Boolean);

    const userUrls = users
      .filter(u => u.username)
      .map(u => buildUrl(`${BASE}/${u.username}`, "weekly", "0.5"))
      .filter(Boolean);

    const allUrls = [...staticUrls, ...restaurantUrls, ...blogUrls, ...categoryUrls, ...userUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls
  .map(
    (u: any) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${u.loc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${u.loc}"/>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send('<?xml version="1.0"?><error>internal_error</error>');
  }
});

export default router;
