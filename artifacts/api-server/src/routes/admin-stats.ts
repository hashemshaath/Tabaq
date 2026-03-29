import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  restaurantsTable,
  bookingsTable,
  reviewsTable,
  offersTable,
  vouchersTable,
  platformModulesTable,
} from "@workspace/db/schema";
import { count, avg, sql, eq, desc } from "drizzle-orm";

const router = Router();

const DEFAULT_MODULES = [
  { moduleId: "reservations", nameEn: "Reservations Engine", description: "Table booking, availability management, and confirmation flows", isEnabled: true, version: "2.1.0", dependencies: "[]" },
  { moduleId: "reviews", nameEn: "Reviews & Ratings", description: "User reviews, rating aggregation, and moderation tools", isEnabled: true, version: "1.8.3", dependencies: "[]" },
  { moduleId: "vouchers", nameEn: "Vouchers & Offers", description: "Promo code generation, offer campaigns, and redemption tracking", isEnabled: true, version: "1.4.1", dependencies: "[]" },
  { moduleId: "leaderboard", nameEn: "Leaderboard & Points", description: "Gamification system, user levels, and diner rewards", isEnabled: true, version: "1.2.0", dependencies: '["reviews"]' },
  { moduleId: "referrals", nameEn: "Referral System", description: "User invite-a-friend program with points incentives", isEnabled: true, version: "1.0.0", dependencies: '["leaderboard"]' },
  { moduleId: "usernames", nameEn: "Username System", description: "Unique usernames with public profile pages at tabaq.co/username", isEnabled: true, version: "1.0.0", dependencies: "[]" },
  { moduleId: "blog", nameEn: "Blog & Content", description: "Editorial content management, food guides, and SEO articles", isEnabled: true, version: "1.0.5", dependencies: "[]" },
  { moduleId: "waitlist", nameEn: "Waitlist System", description: "Automated waitlist and SMS notification when tables become available", isEnabled: true, version: "1.0.1", dependencies: '["reservations"]' },
  { moduleId: "console", nameEn: "Business Console", description: "Restaurant owner dashboard, analytics, and management tools", isEnabled: true, version: "2.0.0", dependencies: "[]" },
];

async function ensureModulesSeeded() {
  const existing = await db.select({ moduleId: platformModulesTable.moduleId }).from(platformModulesTable);
  const existingIds = new Set(existing.map((m) => m.moduleId));
  const toInsert = DEFAULT_MODULES.filter((m) => !existingIds.has(m.moduleId));
  if (toInsert.length > 0) {
    await db.insert(platformModulesTable).values(toInsert);
  }
}

router.get("/admin/stats", async (req, res) => {
  try {
    const [[restaurantCount], [userCount], [bookingCount], [reviewStats], [offerCount], [voucherCount]] = await Promise.all([
      db.select({ count: count() }).from(restaurantsTable),
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(bookingsTable),
      db.select({ count: count(), avgRating: avg(reviewsTable.ratingOverall) }).from(reviewsTable),
      db.select({ count: count() }).from(offersTable).where(eq(offersTable.isActive, true)),
      db.select({ count: count() }).from(vouchersTable),
    ]);

    const recentRestaurants = await db
      .select({ id: restaurantsTable.id, nameEn: restaurantsTable.nameEn, cityId: restaurantsTable.cityId, avgRating: restaurantsTable.avgRating, reviewCount: restaurantsTable.reviewCount, isVerified: restaurantsTable.isVerified, createdAt: restaurantsTable.createdAt })
      .from(restaurantsTable)
      .orderBy(desc(restaurantsTable.createdAt))
      .limit(10);

    const recentUsers = await db
      .select({ id: usersTable.id, nameEn: usersTable.nameEn, email: usersTable.email, phone: usersTable.phone, points: usersTable.points, level: usersTable.level, levelTitle: usersTable.levelTitle, isVerified: usersTable.isVerified, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(20);

    res.json({
      stats: {
        totalRestaurants: Number(restaurantCount?.count ?? 0),
        totalUsers: Number(userCount?.count ?? 0),
        totalBookings: Number(bookingCount?.count ?? 0),
        totalReviews: Number(reviewStats?.count ?? 0),
        avgPlatformRating: Number(reviewStats?.avgRating ?? 0).toFixed(2),
        activeOffers: Number(offerCount?.count ?? 0),
        totalVouchers: Number(voucherCount?.count ?? 0),
      },
      recentRestaurants,
      recentUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/modules", async (req, res) => {
  try {
    await ensureModulesSeeded();
    const modules = await db
      .select()
      .from(platformModulesTable)
      .orderBy(platformModulesTable.moduleId);
    res.json({ modules });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/modules/:moduleId", async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { isEnabled } = req.body as { isEnabled: boolean };

    const [updated] = await db
      .update(platformModulesTable)
      .set({ isEnabled, updatedAt: new Date() })
      .where(eq(platformModulesTable.moduleId, moduleId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json({ module: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
