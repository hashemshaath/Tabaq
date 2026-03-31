import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, blogPostsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [restaurants, posts] = await Promise.all([
      db.select({ id: restaurantsTable.id, nameEn: restaurantsTable.nameEn }).from(restaurantsTable),
      db.select({ slug: blogPostsTable.slug, updatedAt: blogPostsTable.updatedAt })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published")),
    ]);

    const BASE = "https://tabaq.sa";

    const today = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: `${BASE}/`, changefreq: "daily", priority: "1.0", lastmod: today },
      { loc: `${BASE}/restaurants`, changefreq: "daily", priority: "0.9", lastmod: today },
      { loc: `${BASE}/blog`, changefreq: "weekly", priority: "0.8", lastmod: today },
      { loc: `${BASE}/leaderboard`, changefreq: "weekly", priority: "0.7", lastmod: today },
      { loc: `${BASE}/collections`, changefreq: "weekly", priority: "0.7", lastmod: today },
      { loc: `${BASE}/offers`, changefreq: "daily", priority: "0.8", lastmod: today },
      { loc: `${BASE}/experiences`, changefreq: "weekly", priority: "0.7", lastmod: today },
    ];

    const restaurantUrls = restaurants.map(r => ({
      loc: `${BASE}/restaurant/${r.id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: today,
    }));

    const blogUrls = posts.map(p => ({
      loc: `${BASE}/blog/${p.slug}`,
      changefreq: "monthly",
      priority: "0.7",
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : today,
    }));

    const allUrls = [...staticUrls, ...restaurantUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("<?xml version=\"1.0\"?><error>internal_error</error>");
  }
});

export default router;
