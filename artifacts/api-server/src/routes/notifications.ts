import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable, bookingsTable, restaurantsTable,
  pointsTransactionsTable, offersTable,
  userNotificationPrefsTable, userInterestsTable, userMutesTable,
} from "@workspace/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// All supported notification types with defaults
const NOTIF_TYPES = [
  { type: "booking_confirmed",  labelEn: "Booking Confirmed",      labelAr: "تأكيد الحجز",         defaultChannels: "in_app,email" },
  { type: "booking_cancelled",  labelEn: "Booking Cancelled",      labelAr: "إلغاء الحجز",         defaultChannels: "in_app,email" },
  { type: "new_follower",       labelEn: "New Follower",           labelAr: "متابع جديد",          defaultChannels: "in_app" },
  { type: "new_review",         labelEn: "New Review",             labelAr: "مراجعة جديدة",        defaultChannels: "in_app" },
  { type: "new_offer",          labelEn: "New Offer or Discount",  labelAr: "عرض أو خصم جديد",    defaultChannels: "in_app,push" },
  { type: "new_dish",           labelEn: "New Dish Added",         labelAr: "طبق جديد",            defaultChannels: "in_app" },
  { type: "new_opening",        labelEn: "New Restaurant Opening", labelAr: "افتتاح مطعم جديد",   defaultChannels: "in_app" },
  { type: "order_status",       labelEn: "Order Status Update",    labelAr: "تحديث حالة الطلب",   defaultChannels: "in_app,sms" },
  { type: "points_earned",      labelEn: "Points Earned",          labelAr: "نقاط مكتسبة",        defaultChannels: "in_app" },
  { type: "follow_request",     labelEn: "Follow Request",         labelAr: "طلب متابعة",          defaultChannels: "in_app" },
  { type: "promo_code",         labelEn: "Promo Code",             labelAr: "كود خصم",             defaultChannels: "in_app,email" },
  { type: "event_reminder",     labelEn: "Event Reminder",         labelAr: "تذكير بالحدث",       defaultChannels: "in_app,push" },
];

const INTEREST_GROUPS = {
  cuisine: ["Arabic", "Italian", "Japanese", "Indian", "Mexican", "French", "Chinese", "Mediterranean", "Turkish", "Korean"],
  dish_type: ["Grills", "Seafood", "Desserts", "Coffee", "Pasta", "Pizza", "Sushi", "Burgers", "Shawarma", "Salads"],
  event: ["Live Music", "Cooking Classes", "Tasting Events", "Cultural Nights", "Private Dining"],
  preference: ["New Openings", "Exclusive Offers", "Michelin Guide", "Halal Only", "Vegetarian Friendly"],
};

function timeAgoAr(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 1) return `${days} أيام`;
  if (days === 1) return "أمس";
  if (hours > 0) return `${hours} ساعة`;
  return `${Math.max(1, mins)} دقيقة`;
}

// ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────

// GET /api/notifications/preferences — get user's notification prefs (with defaults)
router.get("/notifications/preferences", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const existing = await db
      .select()
      .from(userNotificationPrefsTable)
      .where(eq(userNotificationPrefsTable.userId, userId));

    const existingMap = new Map(existing.map(p => [p.notifType, p]));

    const prefs = NOTIF_TYPES.map(nt => {
      const saved = existingMap.get(nt.type);
      return {
        notifType: nt.type,
        labelEn: nt.labelEn,
        labelAr: nt.labelAr,
        enabled: saved ? saved.enabled : true,
        channels: saved ? saved.channels.split(",").filter(Boolean) : nt.defaultChannels.split(","),
        availableChannels: ["in_app", "email", "sms", "push"],
      };
    });

    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notification preferences");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /api/notifications/preferences — update one or many preferences
router.patch("/notifications/preferences", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { updates } = req.body as {
      updates: { notifType: string; enabled?: boolean; channels?: string[] }[];
    };

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "updates must be an array" });
    }

    const validTypes = new Set(NOTIF_TYPES.map(n => n.type));

    for (const upd of updates) {
      if (!validTypes.has(upd.notifType)) continue;

      const setVal: Record<string, unknown> = { updatedAt: new Date() };
      if (upd.enabled !== undefined) setVal.enabled = upd.enabled;
      if (upd.channels !== undefined) setVal.channels = upd.channels.join(",");

      const existing = await db
        .select({ id: userNotificationPrefsTable.id })
        .from(userNotificationPrefsTable)
        .where(and(
          eq(userNotificationPrefsTable.userId, userId),
          eq(userNotificationPrefsTable.notifType, upd.notifType),
        ));

      if (existing.length > 0) {
        await db.update(userNotificationPrefsTable)
          .set(setVal)
          .where(and(
            eq(userNotificationPrefsTable.userId, userId),
            eq(userNotificationPrefsTable.notifType, upd.notifType),
          ));
      } else {
        const def = NOTIF_TYPES.find(n => n.type === upd.notifType)!;
        await db.insert(userNotificationPrefsTable).values({
          userId,
          notifType: upd.notifType,
          enabled: upd.enabled ?? true,
          channels: (upd.channels ?? def.defaultChannels.split(",")).join(","),
        }).onConflictDoNothing();
      }
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update notification preferences");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── USER INTERESTS ───────────────────────────────────────────────────────────

// GET /api/me/interests
router.get("/me/interests", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const saved = await db
      .select()
      .from(userInterestsTable)
      .where(eq(userInterestsTable.userId, userId));

    const selected: Record<string, string[]> = {};
    for (const row of saved) {
      if (!selected[row.interestType]) selected[row.interestType] = [];
      selected[row.interestType].push(row.value);
    }

    res.json({ interests: selected, groups: INTEREST_GROUPS });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch interests");
    res.status(500).json({ error: "internal_error" });
  }
});

// PUT /api/me/interests — replace all interests
router.put("/me/interests", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { interests } = req.body as { interests: Record<string, string[]> };

    if (!interests || typeof interests !== "object") {
      return res.status(400).json({ error: "interests object required" });
    }

    // Delete all existing and re-insert
    await db.delete(userInterestsTable).where(eq(userInterestsTable.userId, userId));

    const rows: { userId: number; interestType: string; value: string }[] = [];
    for (const [interestType, values] of Object.entries(interests)) {
      if (!Array.isArray(values)) continue;
      const validGroup = INTEREST_GROUPS[interestType as keyof typeof INTEREST_GROUPS];
      if (!validGroup) continue;
      for (const v of values) {
        if (typeof v === "string" && v.trim()) {
          rows.push({ userId, interestType, value: v.trim() });
        }
      }
    }

    if (rows.length > 0) {
      await db.insert(userInterestsTable).values(rows).onConflictDoNothing();
    }

    res.json({ success: true, count: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to update interests");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── MUTES ────────────────────────────────────────────────────────────────────

// GET /api/me/mutes
router.get("/me/mutes", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const mutes = await db
      .select()
      .from(userMutesTable)
      .where(eq(userMutesTable.userId, userId))
      .orderBy(desc(userMutesTable.createdAt));

    // Enrich restaurant mutes with names
    const restaurantMutes = mutes.filter(m => m.entityType === "restaurant");
    let restaurantNames: Record<number, { nameEn: string | null; nameAr: string | null }> = {};
    if (restaurantMutes.length > 0) {
      const rIds = restaurantMutes.map(m => m.entityId);
      const rests = await db
        .select({ id: restaurantsTable.id, nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr })
        .from(restaurantsTable)
        .where(inArray(restaurantsTable.id, rIds));
      for (const r of rests) restaurantNames[r.id] = { nameEn: r.nameEn, nameAr: r.nameAr };
    }

    // Enrich user mutes with names
    const userMutes = mutes.filter(m => m.entityType === "user");
    let userNames: Record<number, { nameEn: string | null; username: string | null }> = {};
    if (userMutes.length > 0) {
      const uIds = userMutes.map(m => m.entityId);
      const users = await db
        .select({ id: usersTable.id, nameEn: usersTable.nameEn, username: usersTable.username })
        .from(usersTable)
        .where(inArray(usersTable.id, uIds));
      for (const u of users) userNames[u.id] = { nameEn: u.nameEn, username: u.username };
    }

    const enriched = mutes.map(m => ({
      ...m,
      entityName: m.entityType === "restaurant"
        ? restaurantNames[m.entityId]?.nameEn ?? null
        : userNames[m.entityId]?.nameEn ?? null,
      entityUsername: m.entityType === "user"
        ? userNames[m.entityId]?.username ?? null
        : null,
    }));

    res.json({ mutes: enriched });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch mutes");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /api/me/mutes/:entityType/:entityId
router.post("/me/mutes/:entityType/:entityId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { entityType, entityId } = req.params;
    const eid = parseInt(entityId, 10);

    if (!["user", "restaurant"].includes(entityType) || isNaN(eid)) {
      return res.status(400).json({ error: "invalid entityType or entityId" });
    }

    await db.insert(userMutesTable).values({ userId, entityType, entityId: eid }).onConflictDoNothing();
    res.json({ success: true, muted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mute");
    res.status(500).json({ error: "internal_error" });
  }
});

// DELETE /api/me/mutes/:entityType/:entityId
router.delete("/me/mutes/:entityType/:entityId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { entityType, entityId } = req.params;
    const eid = parseInt(entityId, 10);

    await db.delete(userMutesTable).where(
      and(
        eq(userMutesTable.userId, userId),
        eq(userMutesTable.entityType, entityType),
        eq(userMutesTable.entityId, eid),
      )
    );
    res.json({ success: true, muted: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unmute");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── NOTIFICATIONS LIST (existing) ───────────────────────────────────────────

// GET /api/notifications/unread-count — fast unread count
router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    let count = 0;

    const recentBookings = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.userId, userId)))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(5);

    count += recentBookings.length;

    const [latestOffer] = await db.select({ id: offersTable.id }).from(offersTable)
      .where(and(eq(offersTable.isActive, true), eq(offersTable.approvalStatus, "approved")))
      .limit(1);
    if (latestOffer) count++;

    const recentPoints = await db.select({ id: pointsTransactionsTable.id })
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.userId, userId))
      .limit(3);
    count += recentPoints.length;

    res.json({ count: Math.min(count, 9) });
  } catch (err) {
    res.json({ count: 0 });
  }
});

// GET /api/notifications — synthesize from real DB data for the current user
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    // Check user's notification preferences to filter disabled types
    const prefs = await db
      .select()
      .from(userNotificationPrefsTable)
      .where(eq(userNotificationPrefsTable.userId, userId));
    const disabledTypes = new Set(prefs.filter(p => !p.enabled).map(p => p.notifType));

    const notifications: object[] = [];
    let notifId = 1;

    // 1. Recent bookings
    if (!disabledTypes.has("booking_confirmed") || !disabledTypes.has("booking_cancelled")) {
      const recentBookings = await db
        .select({
          id: bookingsTable.id,
          referenceCode: bookingsTable.referenceCode,
          date: bookingsTable.date,
          time: bookingsTable.time,
          status: bookingsTable.status,
          partySize: bookingsTable.partySize,
          restaurantId: bookingsTable.restaurantId,
          createdAt: bookingsTable.createdAt,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(5);

      for (const booking of recentBookings) {
        const isConfirmed = booking.status === "confirmed" && !disabledTypes.has("booking_confirmed");
        const isCancelled = booking.status === "cancelled" && !disabledTypes.has("booking_cancelled");
        const isPending = booking.status === "pending" && !disabledTypes.has("booking_confirmed");
        if (!isConfirmed && !isCancelled && !isPending) continue;

        const [rest] = await db
          .select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl })
          .from(restaurantsTable)
          .where(eq(restaurantsTable.id, booking.restaurantId));

        const restNameEn = rest?.nameEn ?? "the restaurant";
        const restNameAr = rest?.nameAr ?? "المطعم";
        const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
        const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

        if (isConfirmed) {
          notifications.push({
            id: notifId++, type: "booking", read: daysAgo > 0,
            time: createdAt.toISOString(), timeAgo: timeAgoAr(createdAt),
            titleEn: "Booking Confirmed", titleAr: "تم تأكيد الحجز",
            bodyEn: `Your table at ${restNameEn} for ${booking.partySize} guests on ${booking.date} at ${booking.time} is confirmed.`,
            bodyAr: `تم تأكيد طاولتك في ${restNameAr} لـ ${booking.partySize} أشخاص في ${booking.date} الساعة ${booking.time}.`,
            link: "/bookings", meta: { image: rest?.coverImageUrl ?? null },
          });
        } else if (isCancelled) {
          notifications.push({
            id: notifId++, type: "system", read: true,
            time: createdAt.toISOString(), timeAgo: timeAgoAr(createdAt),
            titleEn: "Booking Cancelled", titleAr: "تم إلغاء الحجز",
            bodyEn: `Your booking at ${restNameEn} (${booking.referenceCode}) has been cancelled.`,
            bodyAr: `تم إلغاء حجزك في ${restNameAr} (${booking.referenceCode}).`,
            link: "/bookings", meta: { image: rest?.coverImageUrl ?? null },
          });
        } else if (isPending) {
          notifications.push({
            id: notifId++, type: "booking", read: daysAgo > 0,
            time: createdAt.toISOString(), timeAgo: timeAgoAr(createdAt),
            titleEn: "Booking Request Received", titleAr: "تم استلام طلب الحجز",
            bodyEn: `We received your booking request at ${restNameEn} on ${booking.date}. Awaiting confirmation.`,
            bodyAr: `استلمنا طلب حجزك في ${restNameAr} بتاريخ ${booking.date}. بانتظار التأكيد.`,
            link: "/bookings", meta: { image: rest?.coverImageUrl ?? null },
          });
        }
      }
    }

    // 2. Recent points transactions
    if (!disabledTypes.has("points_earned")) {
      const recentPoints = await db
        .select()
        .from(pointsTransactionsTable)
        .where(eq(pointsTransactionsTable.userId, userId))
        .orderBy(desc(pointsTransactionsTable.createdAt))
        .limit(5);

      for (const txn of recentPoints) {
        if (txn.points <= 0) continue;
        const createdAt = txn.createdAt ? new Date(txn.createdAt) : new Date();
        const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
        notifications.push({
          id: notifId++, type: "points", read: daysAgo > 0,
          time: createdAt.toISOString(), timeAgo: timeAgoAr(createdAt),
          titleEn: `+${txn.points} Points Earned!`, titleAr: `ربحت ${txn.points} نقطة!`,
          bodyEn: txn.description ?? `You earned ${txn.points} points.`,
          bodyAr: txn.description ?? `ربحت ${txn.points} نقطة.`,
          link: "/dashboard",
        });
      }
    }

    // 3. Active offer notification
    if (!disabledTypes.has("new_offer")) {
      const [latestOffer] = await db
        .select({ id: offersTable.id, titleEn: offersTable.titleEn, titleAr: offersTable.titleAr, restaurantId: offersTable.restaurantId, validUntil: offersTable.validUntil })
        .from(offersTable)
        .where(and(eq(offersTable.isActive, true), eq(offersTable.approvalStatus, "approved")))
        .orderBy(desc(offersTable.createdAt))
        .limit(1);

      if (latestOffer) {
        const [rest] = await db
          .select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl })
          .from(restaurantsTable).where(eq(restaurantsTable.id, latestOffer.restaurantId));

        const untilDate = latestOffer.validUntil
          ? new Date(latestOffer.validUntil).toLocaleDateString("ar-SA", { month: "long", day: "numeric" }) : "";
        const untilDateEn = latestOffer.validUntil
          ? new Date(latestOffer.validUntil).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "";

        notifications.push({
          id: notifId++, type: "offer", read: false,
          time: new Date(Date.now() - 2 * 3600000).toISOString(), timeAgo: "2 ساعة",
          titleEn: `New Offer: ${latestOffer.titleEn}`, titleAr: `عرض جديد: ${latestOffer.titleAr}`,
          bodyEn: `Exclusive Tabaq offer at ${rest?.nameEn ?? ""}. Valid until ${untilDateEn}.`,
          bodyAr: `عرض حصري من طبق في ${rest?.nameAr ?? ""}. صالح حتى ${untilDate}.`,
          link: "/offers", meta: { image: rest?.coverImageUrl ?? null },
        });
      }
    }

    // 4. Level achievement
    if (!disabledTypes.has("points_earned")) {
      const [u] = await db
        .select({ level: usersTable.level, levelTitle: usersTable.levelTitle })
        .from(usersTable).where(eq(usersTable.id, userId));

      if (u && (u.level ?? 1) >= 3) {
        notifications.push({
          id: notifId++, type: "achievement", read: true,
          time: new Date(Date.now() - 7 * 86400000).toISOString(), timeAgo: "7 أيام",
          titleEn: `🏅 Level ${u.level} Achieved: ${u.levelTitle}!`,
          titleAr: `🏅 وصلت للمستوى ${u.level}: ${u.levelTitle}!`,
          bodyEn: `Congratulations! You have reached Level ${u.level}. Keep exploring to unlock the next level.`,
          bodyAr: `تهانينا! وصلت للمستوى ${u.level}. واصل الاستكشاف لفتح المستوى التالي.`,
          link: "/dashboard",
        });
      }
    }

    const sorted = (notifications as any[]).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    res.json({ notifications: sorted, total: sorted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notifications");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch notifications" });
  }
});

// ─── SSE NOTIFICATIONS STREAM ─────────────────────────────────────────────────
// GET /api/notifications/stream — Server-Sent Events for real-time push.
// Sends an initial snapshot of unread count, then pushes updates every 30s.
// Clients can also trigger a refresh by sending a GET with ?refresh=1.

const sseClients = new Map<number, Set<import("express").Response>>();

export function broadcastNotification(userId: number, payload: object): void {
  const clients = sseClients.get(userId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  for (const res of clients) {
    try { res.write(`data: ${data}\n\n`); } catch {}
  }
}

router.get("/notifications/stream", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);

  const sendHeartbeat = () => {
    try { res.write(": heartbeat\n\n"); } catch {}
  };

  // Send initial unread count immediately
  const sendCount = async () => {
    try {
      const recentBookings = await db
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(5);

      const [latestOffer] = await db
        .select({ id: offersTable.id })
        .from(offersTable)
        .where(and(eq(offersTable.isActive, true), eq(offersTable.approvalStatus, "approved")))
        .limit(1);

      const recentPoints = await db
        .select({ id: pointsTransactionsTable.id })
        .from(pointsTransactionsTable)
        .where(eq(pointsTransactionsTable.userId, userId))
        .limit(3);

      const count = Math.min(recentBookings.length + (latestOffer ? 1 : 0) + recentPoints.length, 9);
      try {
        res.write(`data: ${JSON.stringify({ type: "unread_count", count })}\n\n`);
      } catch {}
    } catch {}
  };

  await sendCount();

  const heartbeatInterval = setInterval(sendHeartbeat, 25_000);
  const refreshInterval = setInterval(sendCount, 30_000);

  const cleanup = () => {
    clearInterval(heartbeatInterval);
    clearInterval(refreshInterval);
    sseClients.get(userId)?.delete(res);
    if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
  res.on("finish", cleanup);
});

export default router;
