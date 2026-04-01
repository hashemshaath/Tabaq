/**
 * Restaurant CRM + Analytics API
 * Provides restaurant owners with customer insights, reservation stats,
 * campaign performance, and engagement data.
 */
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable, restaurantsTable, usersTable,
  restaurantFollowsTable, reviewsTable, offersTable, campaignsTable,
} from "@workspace/db/schema";
import { eq, and, desc, count, sql, gte, lte, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// Helper: get start of N days ago
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/analytics/restaurant/:id/overview
// Full CRM overview for a restaurant owner
router.get("/analytics/restaurant/:id/overview", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    if (isNaN(restaurantId)) return res.status(400).json({ error: "invalid_id" });

    // Parallel fetch of key metrics
    const [
      totalBookingsResult,
      confirmedBookingsResult,
      cancelledBookingsResult,
      recentBookings,
      totalFollowersResult,
      reviewsData,
      activeCampaigns,
      bookingsByDay,
      repeatCustomers,
    ] = await Promise.all([
      // Total bookings all time
      db.select({ count: count() }).from(bookingsTable)
        .where(eq(bookingsTable.restaurantId, restaurantId)),

      // Confirmed bookings (30 days)
      db.select({ count: count() }).from(bookingsTable)
        .where(and(
          eq(bookingsTable.restaurantId, restaurantId),
          eq(bookingsTable.status, "confirmed"),
          gte(bookingsTable.createdAt, daysAgo(30)),
        )),

      // Cancelled bookings (30 days)
      db.select({ count: count() }).from(bookingsTable)
        .where(and(
          eq(bookingsTable.restaurantId, restaurantId),
          eq(bookingsTable.status, "cancelled"),
          gte(bookingsTable.createdAt, daysAgo(30)),
        )),

      // Recent 10 bookings with user details
      db.select({
        id: bookingsTable.id,
        referenceCode: bookingsTable.referenceCode,
        date: bookingsTable.date,
        time: bookingsTable.time,
        partySize: bookingsTable.partySize,
        status: bookingsTable.status,
        createdAt: bookingsTable.createdAt,
        userId: bookingsTable.userId,
        userName: usersTable.nameEn,
        userPhone: usersTable.phone,
        userEmail: usersTable.email,
        userLevel: usersTable.level,
        userLevelTitle: usersTable.levelTitle,
        userPoints: usersTable.points,
        userAvatarUrl: usersTable.avatarUrl,
      })
        .from(bookingsTable)
        .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .where(eq(bookingsTable.restaurantId, restaurantId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(10),

      // Total followers
      db.select({ count: count() }).from(restaurantFollowsTable)
        .where(eq(restaurantFollowsTable.restaurantId, restaurantId)),

      // Reviews stats
      db.select({
        count: count(),
        avgRating: sql<number>`round(avg(${reviewsTable.ratingOverall})::numeric, 2)`,
      })
        .from(reviewsTable)
        .where(eq(reviewsTable.restaurantId, restaurantId)),

      // Active campaigns
      db.select({
        id: campaignsTable.id,
        titleEn: campaignsTable.titleEn,
        titleAr: campaignsTable.titleAr,
        type: campaignsTable.type,
        status: campaignsTable.status,
        createdAt: campaignsTable.createdAt,
      })
        .from(campaignsTable)
        .where(and(
          eq(campaignsTable.restaurantId, restaurantId),
          inArray(campaignsTable.status, ["live", "approved"]),
        ))
        .orderBy(desc(campaignsTable.createdAt))
        .limit(5),

      // Bookings per day last 14 days (for chart)
      db.select({
        date: bookingsTable.date,
        count: count(),
      })
        .from(bookingsTable)
        .where(and(
          eq(bookingsTable.restaurantId, restaurantId),
          gte(bookingsTable.createdAt, daysAgo(14)),
        ))
        .groupBy(bookingsTable.date)
        .orderBy(bookingsTable.date),

      // Repeat customers: users with >1 booking
      db.select({
        userId: bookingsTable.userId,
        bookingCount: count(),
        userName: usersTable.nameEn,
        userAvatarUrl: usersTable.avatarUrl,
        userLevel: usersTable.level,
        userLevelTitle: usersTable.levelTitle,
      })
        .from(bookingsTable)
        .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .where(eq(bookingsTable.restaurantId, restaurantId))
        .groupBy(bookingsTable.userId, usersTable.nameEn, usersTable.avatarUrl, usersTable.level, usersTable.levelTitle)
        .having(sql`count(*) > 1`)
        .orderBy(sql`count(*) desc`)
        .limit(10),
    ]);

    // Follower breakdown by follow type
    const followersByType = await db.select({
      followType: restaurantFollowsTable.followType,
      count: count(),
    })
      .from(restaurantFollowsTable)
      .where(eq(restaurantFollowsTable.restaurantId, restaurantId))
      .groupBy(restaurantFollowsTable.followType);

    // Party size distribution
    const partySizes = await db.select({
      partySize: bookingsTable.partySize,
      count: count(),
    })
      .from(bookingsTable)
      .where(eq(bookingsTable.restaurantId, restaurantId))
      .groupBy(bookingsTable.partySize)
      .orderBy(bookingsTable.partySize);

    // Peak times (most popular booking hours)
    const peakTimes = await db.select({
      time: bookingsTable.time,
      count: count(),
    })
      .from(bookingsTable)
      .where(eq(bookingsTable.restaurantId, restaurantId))
      .groupBy(bookingsTable.time)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    const totalBookings = totalBookingsResult[0]?.count ?? 0;
    const confirmedBookings = confirmedBookingsResult[0]?.count ?? 0;
    const cancelledBookings = cancelledBookingsResult[0]?.count ?? 0;
    const pendingBookings = totalBookings - confirmedBookings - cancelledBookings;
    const totalFollowers = totalFollowersResult[0]?.count ?? 0;
    const reviewCount = reviewsData[0]?.count ?? 0;
    const avgRating = reviewsData[0]?.avgRating ?? 0;

    // Estimate revenue (150 SAR avg per person)
    const avgPerPerson = 150;
    const estimatedRevenue = confirmedBookings * avgPerPerson * 3; // avg 3 guests

    // KPIs
    const kpis = {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingBookings: Math.max(0, pendingBookings),
      cancellationRate: totalBookings > 0
        ? Math.round((cancelledBookings / totalBookings) * 100)
        : 0,
      totalFollowers,
      reviewCount,
      avgRating: Number(avgRating) || 0,
      repeatCustomerCount: repeatCustomers.length,
      estimatedRevenue,
      activeCampaignCount: activeCampaigns.length,
    };

    res.json({
      kpis,
      recentBookings,
      repeatCustomers,
      activeCampaigns,
      charts: {
        bookingsByDay,
        partySizes,
        peakTimes,
        followersByType,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch restaurant analytics");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/analytics/restaurant/:id/customers
// CRM customer list with segmentation
router.get("/analytics/restaurant/:id/customers", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    if (isNaN(restaurantId)) return res.status(400).json({ error: "invalid_id" });

    const segment = req.query.segment as string | undefined; // 'vip' | 'new' | 'repeat' | 'at_risk' | 'all'

    const customers = await db.select({
      userId: bookingsTable.userId,
      bookingCount: count(),
      lastBookingDate: sql<string>`max(${bookingsTable.date})`,
      userName: usersTable.nameEn,
      userAvatarUrl: usersTable.avatarUrl,
      userLevel: usersTable.level,
      userLevelTitle: usersTable.levelTitle,
      userPoints: usersTable.points,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
    })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(eq(bookingsTable.restaurantId, restaurantId))
      .groupBy(
        bookingsTable.userId, usersTable.nameEn, usersTable.avatarUrl,
        usersTable.level, usersTable.levelTitle, usersTable.points,
        usersTable.email, usersTable.phone,
      )
      .orderBy(sql`count(*) desc`)
      .limit(50);

    const today = new Date();
    const enriched = customers.map(c => {
      const bookings = c.bookingCount;
      const lastVisit = c.lastBookingDate ? new Date(c.lastBookingDate) : null;
      const daysSinceLastVisit = lastVisit
        ? Math.floor((today.getTime() - lastVisit.getTime()) / 86400000)
        : 999;

      let segment = "new";
      if (bookings >= 5) segment = "vip";
      else if (bookings >= 2) segment = "repeat";
      else if (daysSinceLastVisit > 60) segment = "at_risk";

      return { ...c, segment, daysSinceLastVisit };
    });

    const filtered = segment && segment !== "all"
      ? enriched.filter(c => c.segment === segment)
      : enriched;

    const segmentCounts = {
      vip: enriched.filter(c => c.segment === "vip").length,
      repeat: enriched.filter(c => c.segment === "repeat").length,
      new: enriched.filter(c => c.segment === "new").length,
      at_risk: enriched.filter(c => c.segment === "at_risk").length,
    };

    res.json({ customers: filtered, segmentCounts, total: filtered.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch customer CRM data");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
