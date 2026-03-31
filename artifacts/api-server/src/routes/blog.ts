import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { blogPostsTable, blogCategoriesTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// List blog categories
router.get("/blog/categories", async (_req, res) => {
  try {
    const categories = await db.select().from(blogCategoriesTable).orderBy(blogCategoriesTable.nameEn);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Create blog category (admin)
router.post("/blog/categories", requireAdmin, async (req, res) => {
  try {
    const { nameEn, nameAr, slug, descriptionEn, descriptionAr, color } = req.body;
    if (!nameEn || !nameAr || !slug) {
      return void res.status(400).json({ error: "bad_request", message: "nameEn, nameAr, slug required" });
    }
    const [cat] = await db.insert(blogCategoriesTable).values({ nameEn, nameAr, slug, descriptionEn, descriptionAr, color }).returning();
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// List blog posts (published only for public)
router.get("/blog/posts", async (req, res) => {
  try {
    const { categoryId, featured, limit = "12", offset = "0" } = req.query;
    const conditions = [eq(blogPostsTable.status, "published")];
    if (categoryId) conditions.push(eq(blogPostsTable.categoryId, parseInt(categoryId as string)));
    if (featured === "true") conditions.push(eq(blogPostsTable.isFeatured, true));

    const posts = await db.select({
      id: blogPostsTable.id,
      titleEn: blogPostsTable.titleEn,
      titleAr: blogPostsTable.titleAr,
      slug: blogPostsTable.slug,
      excerptEn: blogPostsTable.excerptEn,
      excerptAr: blogPostsTable.excerptAr,
      coverImageUrl: blogPostsTable.coverImageUrl,
      isFeatured: blogPostsTable.isFeatured,
      viewCount: blogPostsTable.viewCount,
      readTimeMinutes: blogPostsTable.readTimeMinutes,
      tags: blogPostsTable.tags,
      publishedAt: blogPostsTable.publishedAt,
      createdAt: blogPostsTable.createdAt,
      categoryId: blogPostsTable.categoryId,
      categoryNameEn: blogCategoriesTable.nameEn,
      categoryNameAr: blogCategoriesTable.nameAr,
      categoryColor: blogCategoriesTable.color,
      authorId: blogPostsTable.authorId,
      authorNameEn: usersTable.nameEn,
      authorNameAr: usersTable.nameAr,
      authorAvatarUrl: usersTable.avatarUrl,
    }).from(blogPostsTable)
      .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
      .leftJoin(usersTable, eq(blogPostsTable.authorId, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(blogPostsTable.publishedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(blogPostsTable)
      .where(and(...conditions));

    res.json({ posts, total: Number(total[0]?.count ?? 0) });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Get single blog post by slug
router.get("/blog/posts/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [post] = await db.select({
      id: blogPostsTable.id,
      titleEn: blogPostsTable.titleEn,
      titleAr: blogPostsTable.titleAr,
      slug: blogPostsTable.slug,
      excerptEn: blogPostsTable.excerptEn,
      excerptAr: blogPostsTable.excerptAr,
      contentEn: blogPostsTable.contentEn,
      contentAr: blogPostsTable.contentAr,
      coverImageUrl: blogPostsTable.coverImageUrl,
      isFeatured: blogPostsTable.isFeatured,
      viewCount: blogPostsTable.viewCount,
      readTimeMinutes: blogPostsTable.readTimeMinutes,
      tags: blogPostsTable.tags,
      metaTitleEn: blogPostsTable.metaTitleEn,
      metaTitleAr: blogPostsTable.metaTitleAr,
      metaDescriptionEn: blogPostsTable.metaDescriptionEn,
      metaDescriptionAr: blogPostsTable.metaDescriptionAr,
      publishedAt: blogPostsTable.publishedAt,
      createdAt: blogPostsTable.createdAt,
      categoryId: blogPostsTable.categoryId,
      categoryNameEn: blogCategoriesTable.nameEn,
      categoryNameAr: blogCategoriesTable.nameAr,
      categoryColor: blogCategoriesTable.color,
      authorId: blogPostsTable.authorId,
      authorNameEn: usersTable.nameEn,
      authorNameAr: usersTable.nameAr,
      authorAvatarUrl: usersTable.avatarUrl,
    }).from(blogPostsTable)
      .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
      .leftJoin(usersTable, eq(blogPostsTable.authorId, usersTable.id))
      .where(eq(blogPostsTable.slug, slug));

    if (!post) return void res.status(404).json({ error: "not_found" });

    // Increment view count
    await db.update(blogPostsTable)
      .set({ viewCount: sql`${blogPostsTable.viewCount} + 1` })
      .where(eq(blogPostsTable.id, post.id));

    // Related posts from same category
    const related = post.categoryId
      ? await db.select({
          id: blogPostsTable.id,
          titleEn: blogPostsTable.titleEn,
          titleAr: blogPostsTable.titleAr,
          slug: blogPostsTable.slug,
          coverImageUrl: blogPostsTable.coverImageUrl,
          readTimeMinutes: blogPostsTable.readTimeMinutes,
          publishedAt: blogPostsTable.publishedAt,
        }).from(blogPostsTable)
          .where(and(
            eq(blogPostsTable.categoryId, post.categoryId),
            eq(blogPostsTable.status, "published"),
            sql`${blogPostsTable.id} != ${post.id}`
          ))
          .orderBy(desc(blogPostsTable.publishedAt))
          .limit(3)
      : [];

    res.json({ post, related });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Create blog post (admin)
router.post("/blog/posts", requireAdmin, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { titleEn, titleAr, slug, excerptEn, excerptAr, contentEn, contentAr,
            coverImageUrl, categoryId, isFeatured, readTimeMinutes, tags,
            metaTitleEn, metaTitleAr, metaDescriptionEn, metaDescriptionAr, status } = req.body;
    if (!titleEn || !titleAr || !slug) {
      return void res.status(400).json({ error: "bad_request", message: "titleEn, titleAr, slug required" });
    }
    const publishedAt = status === "published" ? new Date() : null;
    const [post] = await db.insert(blogPostsTable).values({
      authorId: userId, titleEn, titleAr, slug, excerptEn, excerptAr,
      contentEn, contentAr, coverImageUrl, categoryId, isFeatured: isFeatured ?? false,
      readTimeMinutes: readTimeMinutes ?? 5, tags: tags ?? [],
      metaTitleEn, metaTitleAr, metaDescriptionEn, metaDescriptionAr,
      status: status ?? "draft", publishedAt,
    }).returning();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Update blog post (admin)
router.patch("/blog/posts/:id", requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params["id"] as string, 10);
    const allowedFields = [
      "titleEn", "titleAr", "slug", "excerptEn", "excerptAr", "contentEn", "contentAr",
      "coverImageUrl", "categoryId", "isFeatured", "readTimeMinutes", "tags", "status",
      "metaTitleEn", "metaTitleAr", "metaDescriptionEn", "metaDescriptionAr",
    ];
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    if (req.body.status === "published" && !req.body.publishedAt) {
      updateData["publishedAt"] = new Date();
    }
    const [updated] = await db.update(blogPostsTable).set(updateData).where(eq(blogPostsTable.id, postId)).returning();
    if (!updated) return void res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Delete blog post (admin)
router.delete("/blog/posts/:id", requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params["id"] as string, 10);
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, postId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// Admin: list all posts (including drafts)
router.get("/admin/blog/posts", requireAdmin, async (req, res) => {
  try {
    const { limit = "50", offset = "0" } = req.query;
    const posts = await db.select({
      id: blogPostsTable.id,
      titleEn: blogPostsTable.titleEn,
      titleAr: blogPostsTable.titleAr,
      slug: blogPostsTable.slug,
      status: blogPostsTable.status,
      isFeatured: blogPostsTable.isFeatured,
      viewCount: blogPostsTable.viewCount,
      publishedAt: blogPostsTable.publishedAt,
      createdAt: blogPostsTable.createdAt,
      categoryNameEn: blogCategoriesTable.nameEn,
      authorNameEn: usersTable.nameEn,
    }).from(blogPostsTable)
      .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
      .leftJoin(usersTable, eq(blogPostsTable.authorId, usersTable.id))
      .orderBy(desc(blogPostsTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
