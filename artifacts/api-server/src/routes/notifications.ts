import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable, bookingsTable, restaurantsTable,
  pointsTransactionsTable, offersTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

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

// GET /api/notifications — synthesize from real DB data for the current user
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const notifications: object[] = [];
    let notifId = 1;

    // 1. Recent bookings → booking_confirmed / cancelled notifications
    const recentBookings = await db
      .select({
        id: bookingsTable.id,
        referenceCode: bookingsTable.referenceCode,
        date: bookingsTable.date,
        time: bookingsTable.time,
        status: bookingsTable.status,
        guestCount: bookingsTable.guestCount,
        restaurantId: bookingsTable.restaurantId,
        createdAt: bookingsTable.createdAt,
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, userId))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(5);

    for (const booking of recentBookings) {
      const [rest] = await db
        .select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, booking.restaurantId));

      const restNameEn = rest?.nameEn ?? "the restaurant";
      const restNameAr = rest?.nameAr ?? "المطعم";
      const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
      const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

      if (booking.status === "confirmed") {
        notifications.push({
          id: notifId++,
          type: "booking",
          read: daysAgo > 0,
          time: createdAt.toISOString(),
          timeAgo: timeAgoAr(createdAt),
          titleEn: "Booking Confirmed",
          titleAr: "تم تأكيد الحجز",
          bodyEn: `Your table at ${restNameEn} for ${booking.guestCount} guests on ${booking.date} at ${booking.time} is confirmed.`,
          bodyAr: `تم تأكيد طاولتك في ${restNameAr} لـ ${booking.guestCount} أشخاص في ${booking.date} الساعة ${booking.time}.`,
          link: "/bookings",
          meta: { image: rest?.coverImageUrl ?? null },
        });
      } else if (booking.status === "cancelled") {
        notifications.push({
          id: notifId++,
          type: "system",
          read: true,
          time: createdAt.toISOString(),
          timeAgo: timeAgoAr(createdAt),
          titleEn: "Booking Cancelled",
          titleAr: "تم إلغاء الحجز",
          bodyEn: `Your booking at ${restNameEn} (${booking.referenceCode}) has been cancelled.`,
          bodyAr: `تم إلغاء حجزك في ${restNameAr} (${booking.referenceCode}).`,
          link: "/bookings",
          meta: { image: rest?.coverImageUrl ?? null },
        });
      } else if (booking.status === "pending") {
        notifications.push({
          id: notifId++,
          type: "booking",
          read: daysAgo > 0,
          time: createdAt.toISOString(),
          timeAgo: timeAgoAr(createdAt),
          titleEn: "Booking Request Received",
          titleAr: "تم استلام طلب الحجز",
          bodyEn: `We received your booking request at ${restNameEn} on ${booking.date}. Awaiting confirmation.`,
          bodyAr: `استلمنا طلب حجزك في ${restNameAr} بتاريخ ${booking.date}. بانتظار التأكيد.`,
          link: "/bookings",
          meta: { image: rest?.coverImageUrl ?? null },
        });
      }
    }

    // 2. Recent points transactions → points earned notifications
    const recentPoints = await db
      .select()
      .from(pointsTransactionsTable)
      .where(and(
        eq(pointsTransactionsTable.userId, userId),
      ))
      .orderBy(desc(pointsTransactionsTable.createdAt))
      .limit(5);

    for (const txn of recentPoints) {
      if (txn.points <= 0) continue;
      const createdAt = txn.createdAt ? new Date(txn.createdAt) : new Date();
      const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
      notifications.push({
        id: notifId++,
        type: "points",
        read: daysAgo > 0,
        time: createdAt.toISOString(),
        timeAgo: timeAgoAr(createdAt),
        titleEn: `+${txn.points} Points Earned!`,
        titleAr: `ربحت ${txn.points} نقطة!`,
        bodyEn: txn.description ?? `You earned ${txn.points} points.`,
        bodyAr: txn.description ?? `ربحت ${txn.points} نقطة.`,
        link: "/dashboard",
      });
    }

    // 3. One active approved offer → discovery notification
    const [latestOffer] = await db
      .select({
        id: offersTable.id,
        titleEn: offersTable.titleEn,
        titleAr: offersTable.titleAr,
        restaurantId: offersTable.restaurantId,
        validUntil: offersTable.validUntil,
      })
      .from(offersTable)
      .where(and(
        eq(offersTable.isActive, true),
        eq(offersTable.approvalStatus, "approved"),
      ))
      .orderBy(desc(offersTable.createdAt))
      .limit(1);

    if (latestOffer) {
      const [rest] = await db
        .select({ nameEn: restaurantsTable.nameEn, nameAr: restaurantsTable.nameAr, coverImageUrl: restaurantsTable.coverImageUrl })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, latestOffer.restaurantId));

      const untilDate = latestOffer.validUntil
        ? new Date(latestOffer.validUntil).toLocaleDateString("ar-SA", { month: "long", day: "numeric" })
        : "";
      const untilDateEn = latestOffer.validUntil
        ? new Date(latestOffer.validUntil).toLocaleDateString("en-US", { month: "long", day: "numeric" })
        : "";

      notifications.push({
        id: notifId++,
        type: "offer",
        read: false,
        time: new Date(Date.now() - 2 * 3600000).toISOString(),
        timeAgo: "2 ساعة",
        titleEn: `New Offer: ${latestOffer.titleEn}`,
        titleAr: `عرض جديد: ${latestOffer.titleAr}`,
        bodyEn: `Exclusive Tabaq offer at ${rest?.nameEn ?? ""}. Valid until ${untilDateEn}.`,
        bodyAr: `عرض حصري من طبق في ${rest?.nameAr ?? ""}. صالح حتى ${untilDate}.`,
        link: "/offers",
        meta: { image: rest?.coverImageUrl ?? null },
      });
    }

    // 4. Level achievement notification (static but personalised)
    const [u] = await db
      .select({ level: usersTable.level, levelTitle: usersTable.levelTitle })
      .from(usersTable).where(eq(usersTable.id, userId));

    if (u && (u.level ?? 1) >= 3) {
      notifications.push({
        id: notifId++,
        type: "achievement",
        read: true,
        time: new Date(Date.now() - 7 * 86400000).toISOString(),
        timeAgo: "7 أيام",
        titleEn: `🏅 Level ${u.level} Achieved: ${u.levelTitle}!`,
        titleAr: `🏅 وصلت للمستوى ${u.level}: ${u.levelTitle}!`,
        bodyEn: `Congratulations! You have reached Level ${u.level}. Keep exploring to unlock the next level.`,
        bodyAr: `تهانينا! وصلت للمستوى ${u.level}. واصل الاستكشاف لفتح المستوى التالي.`,
        link: "/dashboard",
      });
    }

    // Sort newest first
    const sorted = (notifications as any[]).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    res.json({ notifications: sorted, total: sorted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notifications");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch notifications" });
  }
});

export default router;
