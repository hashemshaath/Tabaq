import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  experiencesTable,
  experienceSlotsTable,
  experienceImagesTable,
  experienceBookingsTable,
  experienceBookingPaymentsTable,
  experienceReviewsTable,
  experienceReviewPhotosTable,
  experienceGiftsTable,
  providerApplicationsTable,
  providersTable,
  experienceProvidersTable,
  experienceSettingsTable,
  experienceCommissionsTable,
  usersTable,
  citiesTable,
} from "@workspace/db/schema";
import {
  eq, and, gte, lte, desc, asc, sql, type SQL, or, count, sum, avg
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// ─── Helper: build ref code ───────────────────────────────────────────────────
function makeRefCode(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `TBQ-${prefix}-${year}-${rand}`;
}

// ─── List Experiences ─────────────────────────────────────────────────────────
router.get("/experiences", async (req, res) => {
  try {
    const {
      cityId, category, hostUserId, priceMin, priceMax, minRating,
      sortBy = "newest", limit = "20", offset = "0",
    } = req.query;

    const conditions: SQL[] = [eq(experiencesTable.status, "active")];
    if (cityId) conditions.push(eq(experiencesTable.cityId, parseInt(cityId as string)));
    if (category) conditions.push(eq(experiencesTable.category, category as string));
    if (hostUserId) conditions.push(eq(experiencesTable.hostUserId, parseInt(hostUserId as string)));
    if (priceMin) conditions.push(gte(experiencesTable.pricePerPerson, priceMin as string));
    if (priceMax) conditions.push(lte(experiencesTable.pricePerPerson, priceMax as string));
    if (minRating) conditions.push(gte(experiencesTable.avgRating, parseFloat(minRating as string)));

    const orderExpr =
      sortBy === "rated" ? desc(experiencesTable.avgRating) :
      sortBy === "popular" ? desc(experiencesTable.reviewCount) :
      sortBy === "trending" ? desc(experiencesTable.reviewCount) :
      desc(experiencesTable.createdAt);

    const experiences = await db.select()
      .from(experiencesTable)
      .where(and(...conditions))
      .orderBy(orderExpr)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ count: total }] = await db.select({ count: sql<number>`count(*)` })
      .from(experiencesTable)
      .where(and(...conditions));

    res.json({
      experiences,
      total: Number(total),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list experiences");
    res.status(500).json({ error: "internal_error", message: "Failed to list experiences" });
  }
});

// ─── Create Experience ────────────────────────────────────────────────────────
router.post("/experiences", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const {
      providerId, titleEn, titleAr, descriptionEn, descriptionAr, category,
      highlights, tags, latitude, longitude, address, city, cityId, durationMinutes,
      pricePerPerson, depositAmount, currency = "SAR", capacity,
      menuDetailsEn, menuDetailsAr, rulesEn, rulesAr, primaryImageUrl, galleryUrls, status,
    } = req.body;

    if (!titleEn) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    // Resolve providerId from experienceProvidersTable if not supplied
    let resolvedProviderId = providerId ? parseInt(providerId) : undefined;
    if (!resolvedProviderId) {
      const [ep] = await db.select({ id: experienceProvidersTable.id })
        .from(experienceProvidersTable)
        .where(eq(experienceProvidersTable.userId, userId))
        .limit(1);
      resolvedProviderId = ep?.id;
    }

    const [experience] = await db.insert(experiencesTable).values({
      refCode: makeRefCode("EXP"),
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      category,
      hostUserId: userId,
      providerId: resolvedProviderId ?? null,
      highlights: Array.isArray(highlights) ? highlights : [],
      tags: Array.isArray(tags) ? tags : [],
      latitude: latitude != null ? parseFloat(latitude) : null,
      longitude: longitude != null ? parseFloat(longitude) : null,
      address,
      city,
      cityId: cityId ? parseInt(cityId) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      pricePerPerson: pricePerPerson != null ? String(pricePerPerson) : null,
      depositAmount: depositAmount != null ? String(depositAmount) : null,
      currency,
      capacity: capacity ? parseInt(capacity) : null,
      menuDetailsEn,
      menuDetailsAr,
      rulesEn,
      rulesAr,
      primaryImageUrl,
      galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
      status: status ?? "draft",
    }).returning();

    res.status(201).json({ success: true, experience });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "conflict", message: "Slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create experience");
    res.status(500).json({ error: "internal_error", message: "Failed to create experience" });
  }
});

// ─── Get Experience Detail ────────────────────────────────────────────────────
router.get("/experiences/:experienceId", async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));

    if (!experience) {
      res.status(404).json({ error: "not_found", message: "Experience not found" });
      return;
    }

    const images = await db.select().from(experienceImagesTable)
      .where(eq(experienceImagesTable.experienceId, experienceId))
      .orderBy(asc(experienceImagesTable.sortOrder));

    let hostInfo: { nameEn: string | null; nameAr: string | null; avatarUrl: string | null } | undefined;
    if (experience.hostUserId) {
      const [host] = await db.select({
        nameEn: usersTable.nameEn,
        nameAr: usersTable.nameAr,
        avatarUrl: usersTable.avatarUrl,
      }).from(usersTable).where(eq(usersTable.id, experience.hostUserId));
      hostInfo = host;
    }

    let cityInfo: { nameEn: string | null; nameAr: string | null } | undefined;
    if (experience.cityId) {
      const [cityRow] = await db.select({
        nameEn: citiesTable.nameEn,
        nameAr: citiesTable.nameAr,
      }).from(citiesTable).where(eq(citiesTable.id, experience.cityId));
      cityInfo = cityRow;
    }

    res.json({
      ...experience,
      images,
      hostNameEn: hostInfo?.nameEn ?? null,
      hostNameAr: hostInfo?.nameAr ?? null,
      hostAvatarUrl: hostInfo?.avatarUrl ?? null,
      cityNameEn: cityInfo?.nameEn ?? null,
      cityNameAr: cityInfo?.nameAr ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get experience");
    res.status(500).json({ error: "internal_error", message: "Failed to get experience" });
  }
});

// ─── Update Experience ────────────────────────────────────────────────────────
router.put("/experiences/:experienceId", requireAuth, async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin;

    const [existing] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Experience not found" });
      return;
    }
    if (!isAdmin && existing.hostUserId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }

    const {
      titleEn, titleAr, descriptionEn, descriptionAr, category,
      highlights, tags, latitude, longitude, address, city, cityId, durationMinutes,
      pricePerPerson, depositAmount, currency, capacity,
      menuDetailsEn, menuDetailsAr, rulesEn, rulesAr, primaryImageUrl, galleryUrls, status,
    } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (category !== undefined) updateData.category = category;
    if (highlights !== undefined) updateData.highlights = Array.isArray(highlights) ? highlights : [];
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (cityId !== undefined) updateData.cityId = cityId;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (pricePerPerson !== undefined) updateData.pricePerPerson = String(pricePerPerson);
    if (depositAmount !== undefined) updateData.depositAmount = depositAmount != null ? String(depositAmount) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (menuDetailsEn !== undefined) updateData.menuDetailsEn = menuDetailsEn;
    if (menuDetailsAr !== undefined) updateData.menuDetailsAr = menuDetailsAr;
    if (rulesEn !== undefined) updateData.rulesEn = rulesEn;
    if (rulesAr !== undefined) updateData.rulesAr = rulesAr;
    if (primaryImageUrl !== undefined) updateData.primaryImageUrl = primaryImageUrl;
    if (galleryUrls !== undefined) updateData.galleryUrls = Array.isArray(galleryUrls) ? galleryUrls : [];
    if (status !== undefined) updateData.status = status;

    const [updated] = await db.update(experiencesTable)
      .set(updateData as any)
      .where(eq(experiencesTable.id, experienceId))
      .returning();

    res.json({ success: true, experience: updated });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "conflict", message: "Slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update experience");
    res.status(500).json({ error: "internal_error", message: "Failed to update experience" });
  }
});

// ─── Patch Experience Status ──────────────────────────────────────────────────
router.patch("/experiences/:experienceId/status", requireAuth, async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "bad_request", message: "Status is required" });
      return;
    }

    const [existing] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Experience not found" });
      return;
    }
    if (!isAdmin && existing.hostUserId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }

    const [updated] = await db.update(experiencesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(experiencesTable.id, experienceId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update experience status");
    res.status(500).json({ error: "internal_error", message: "Failed to update experience status" });
  }
});

// ─── Delete Experience ────────────────────────────────────────────────────────
router.delete("/experiences/:experienceId", requireAuth, async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin;

    const [existing] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Experience not found" });
      return;
    }
    if (!isAdmin && existing.hostUserId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }

    await db.delete(experiencesTable).where(eq(experiencesTable.id, experienceId));
    res.json({ success: true, message: "Experience deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete experience");
    res.status(500).json({ error: "internal_error", message: "Failed to delete experience" });
  }
});

// ─── List Slots ───────────────────────────────────────────────────────────────
router.get("/experiences/:experienceId/slots", async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const { dateFrom, dateTo } = req.query;

    const conditions: SQL[] = [eq(experienceSlotsTable.experienceId, experienceId)];
    if (dateFrom) conditions.push(gte(experienceSlotsTable.date, dateFrom as string));
    if (dateTo) conditions.push(lte(experienceSlotsTable.date, dateTo as string));

    const slots = await db.select().from(experienceSlotsTable)
      .where(and(...conditions))
      .orderBy(asc(experienceSlotsTable.date), asc(experienceSlotsTable.startTime));

    res.json(slots);
  } catch (err) {
    req.log.error({ err }, "Failed to list experience slots");
    res.status(500).json({ error: "internal_error", message: "Failed to list slots" });
  }
});

// ─── Create Slot ──────────────────────────────────────────────────────────────
router.post("/experiences/:experienceId/slots", requireAuth, async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const { date, startTime, endTime, capacityOverride, isRecurring, recurringDay } = req.body;

    if (!date || !startTime || !endTime) {
      res.status(400).json({ error: "bad_request", message: "date, startTime, endTime required" });
      return;
    }

    const [slot] = await db.insert(experienceSlotsTable).values({
      experienceId,
      date,
      startTime,
      endTime,
      capacityOverride: capacityOverride ? parseInt(capacityOverride) : null,
      isRecurring: isRecurring ?? false,
      recurringDay: recurringDay ? parseInt(recurringDay) : null,
    }).returning();

    res.status(201).json({ success: true, slot });
  } catch (err) {
    req.log.error({ err }, "Failed to create slot");
    res.status(500).json({ error: "internal_error", message: "Failed to create slot" });
  }
});

// ─── Delete Slot ──────────────────────────────────────────────────────────────
router.delete("/experiences/:experienceId/slots/:slotId", requireAuth, async (req, res) => {
  try {
    const slotId = parseInt(req.params.slotId!);
    await db.delete(experienceSlotsTable).where(eq(experienceSlotsTable.id, slotId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete slot");
    res.status(500).json({ error: "internal_error", message: "Failed to delete slot" });
  }
});

// ─── List Reviews for Experience ──────────────────────────────────────────────
router.get("/experiences/:experienceId/reviews", async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const { limit = "20", offset = "0" } = req.query;

    const reviews = await db.select({
      review: experienceReviewsTable,
      userNameEn: usersTable.nameEn,
      userNameAr: usersTable.nameAr,
      userAvatarUrl: usersTable.avatarUrl,
    }).from(experienceReviewsTable)
      .leftJoin(usersTable, eq(experienceReviewsTable.userId, usersTable.id))
      .where(eq(experienceReviewsTable.experienceId, experienceId))
      .orderBy(desc(experienceReviewsTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ total }] = await db.select({ total: sql<number>`count(*)` })
      .from(experienceReviewsTable)
      .where(eq(experienceReviewsTable.experienceId, experienceId));

    const [breakdown] = await db.select({
      avgFood: sql<number>`avg(rating_food::float)`,
      avgHospitality: sql<number>`avg(rating_hospitality::float)`,
      avgAmbiance: sql<number>`avg(rating_ambiance::float)`,
      avgValue: sql<number>`avg(rating_value::float)`,
      avgOverall: sql<number>`avg(rating_overall::float)`,
    }).from(experienceReviewsTable)
      .where(eq(experienceReviewsTable.experienceId, experienceId));

    const enrichedReviews = await Promise.all(reviews.map(async (r) => {
      const photos = await db.select({ photoUrl: experienceReviewPhotosTable.photoUrl })
        .from(experienceReviewPhotosTable)
        .where(eq(experienceReviewPhotosTable.reviewId, r.review.id))
        .orderBy(asc(experienceReviewPhotosTable.displayOrder));
      return {
        ...r.review,
        userNameEn: r.userNameEn ?? "User",
        userNameAr: r.userNameAr ?? "مستخدم",
        userAvatarUrl: r.userAvatarUrl ?? null,
        photoUrls: photos.map(p => p.photoUrl),
      };
    }));

    res.json({
      reviews: enrichedReviews,
      total: Number(total),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
      ratingBreakdown: {
        avgFood: breakdown?.avgFood ?? null,
        avgHospitality: breakdown?.avgHospitality ?? null,
        avgAmbiance: breakdown?.avgAmbiance ?? null,
        avgValue: breakdown?.avgValue ?? null,
        avgOverall: breakdown?.avgOverall ?? null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list experience reviews");
    res.status(500).json({ error: "internal_error", message: "Failed to list reviews" });
  }
});

// ─── Create Booking ───────────────────────────────────────────────────────────
router.post("/experience-bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { experienceId, slotId, guestCount, specialRequests, guestName, guestPhone, guestEmail } = req.body;

    if (!experienceId || !guestCount) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!experience || experience.status !== "active") {
      res.status(400).json({ error: "bad_request", message: "Experience not available" });
      return;
    }

    let slot: typeof experienceSlotsTable.$inferSelect | undefined;
    if (slotId) {
      const [s] = await db.select().from(experienceSlotsTable).where(eq(experienceSlotsTable.id, slotId));
      if (!s || s.isCancelled) {
        res.status(400).json({ error: "bad_request", message: "Slot not available" });
        return;
      }
      slot = s;
    }

    const totalAmount = experience.pricePerPerson ? Number(experience.pricePerPerson) * guestCount : 0;
    const depositAmount = experience.depositAmount ? Number(experience.depositAmount) : null;
    const referenceCode = `EXP-${nanoid(10).toUpperCase()}`;

    const [booking] = await db.insert(experienceBookingsTable).values({
      referenceCode,
      userId,
      experienceId,
      slotId: slotId ?? null,
      guestCount,
      status: "pending",
      totalAmount: String(totalAmount),
      depositAmount: depositAmount != null ? String(depositAmount) : null,
      isDepositPaid: false,
      isFullPaid: false,
      specialRequests,
      guestName,
      guestPhone,
      guestEmail,
    }).returning();

    if (slot) {
      await db.update(experienceSlotsTable)
        .set({ bookedCount: sql`booked_count + ${guestCount}` })
        .where(eq(experienceSlotsTable.id, slotId));
    }

    const [commissionSetting] = await db.select()
      .from(experienceSettingsTable)
      .where(eq(experienceSettingsTable.key, "default_commission_rate"));
    const rate = commissionSetting ? parseFloat(commissionSetting.value) : 10;
    const commissionAmount = (totalAmount * rate) / 100;
    await db.insert(experienceCommissionsTable).values({
      bookingId: booking!.id,
      rate: String(rate),
      amount: String(commissionAmount),
      status: "pending",
    });

    res.status(201).json({
      ...booking,
      experienceTitleEn: experience.titleEn,
      experienceTitleAr: experience.titleAr,
      slotDate: slot?.date ?? null,
      slotStartTime: slot?.startTime ?? null,
      slotEndTime: slot?.endTime ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create experience booking");
    res.status(500).json({ error: "internal_error", message: "Failed to create booking" });
  }
});

// ─── Get Booking ──────────────────────────────────────────────────────────────
router.get("/experience-bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId!);
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin;

    const [booking] = await db.select().from(experienceBookingsTable).where(eq(experienceBookingsTable.id, bookingId));
    if (!booking) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }

    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
    const isHost = experience && experience.hostUserId === userId;

    if (!isAdmin && booking.userId !== userId && !isHost) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }

    let slot: typeof experienceSlotsTable.$inferSelect | undefined;
    if (booking.slotId) {
      const [s] = await db.select().from(experienceSlotsTable).where(eq(experienceSlotsTable.id, booking.slotId));
      slot = s;
    }

    res.json({
      ...booking,
      experienceTitleEn: experience?.titleEn ?? null,
      experienceTitleAr: experience?.titleAr ?? null,
      slotDate: slot?.date ?? null,
      slotStartTime: slot?.startTime ?? null,
      slotEndTime: slot?.endTime ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get experience booking");
    res.status(500).json({ error: "internal_error", message: "Failed to get booking" });
  }
});

// ─── Cancel Booking ───────────────────────────────────────────────────────────
router.patch("/experience-bookings/:bookingId/cancel", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId!);
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.isAdmin;

    const [booking] = await db.select().from(experienceBookingsTable).where(eq(experienceBookingsTable.id, bookingId));
    if (!booking) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }
    if (!isAdmin && booking.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }
    if (["cancelled", "completed"].includes(booking.status)) {
      res.status(400).json({ error: "bad_request", message: "Cannot cancel a booking in this state" });
      return;
    }

    const [updated] = await db.update(experienceBookingsTable)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(experienceBookingsTable.id, bookingId))
      .returning();

    if (booking.slotId) {
      await db.update(experienceSlotsTable)
        .set({ bookedCount: sql`booked_count - ${booking.guestCount}` })
        .where(eq(experienceSlotsTable.id, booking.slotId));
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to cancel experience booking");
    res.status(500).json({ error: "internal_error", message: "Failed to cancel booking" });
  }
});

// ─── List Current User's Experience Bookings ──────────────────────────────────
router.get("/me/experience-bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const bookings = await db.select({
      id: experienceBookingsTable.id,
      referenceCode: experienceBookingsTable.referenceCode,
      experienceId: experienceBookingsTable.experienceId,
      slotId: experienceBookingsTable.slotId,
      guestCount: experienceBookingsTable.guestCount,
      totalAmount: experienceBookingsTable.totalAmount,
      status: experienceBookingsTable.status,
      depositPaid: experienceBookingsTable.depositPaid,
      fullPaid: experienceBookingsTable.fullPaid,
      specialRequests: experienceBookingsTable.specialRequests,
      createdAt: experienceBookingsTable.createdAt,
      cancelledAt: experienceBookingsTable.cancelledAt,
      experienceTitleEn: experiencesTable.titleEn,
      experienceTitleAr: experiencesTable.titleAr,
      experienceCoverImage: experiencesTable.coverImage,
      slotDate: experienceSlotsTable.date,
      slotStartTime: experienceSlotsTable.startTime,
      slotEndTime: experienceSlotsTable.endTime,
    })
      .from(experienceBookingsTable)
      .leftJoin(experiencesTable, eq(experienceBookingsTable.experienceId, experiencesTable.id))
      .leftJoin(experienceSlotsTable, eq(experienceBookingsTable.slotId, experienceSlotsTable.id))
      .where(eq(experienceBookingsTable.userId, userId))
      .orderBy(desc(experienceSlotsTable.date), desc(experienceBookingsTable.createdAt));
    res.json({ bookings });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user experience bookings");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch experience bookings" });
  }
});

// ─── Update Booking Status (Provider Dashboard) ───────────────────────────────
router.patch("/experience-bookings/:bookingId/status", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId!);
    const { status, cancelReason } = req.body;

    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === "confirmed") updateData.confirmedAt = new Date();
    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = cancelReason ?? null;
    }

    const [updated] = await db.update(experienceBookingsTable)
      .set(updateData as any)
      .where(eq(experienceBookingsTable.id, bookingId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ success: true, booking: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update booking status");
    res.status(500).json({ error: "internal_error", message: "Failed to update booking status" });
  }
});

// ─── Pay Booking ──────────────────────────────────────────────────────────────
router.post("/experience-bookings/:bookingId/pay", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId!);
    const userId = req.auth!.userId;
    const { type, paymentRef } = req.body;

    if (!type || !["deposit", "full"].includes(type)) {
      res.status(400).json({ error: "bad_request", message: "Payment type must be 'deposit' or 'full'" });
      return;
    }

    const [booking] = await db.select().from(experienceBookingsTable).where(eq(experienceBookingsTable.id, bookingId));
    if (!booking) {
      res.status(404).json({ error: "not_found", message: "Booking not found" });
      return;
    }
    if (booking.userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }

    let amount: number;
    if (type === "deposit") {
      if (!booking.depositAmount) {
        res.status(400).json({ error: "bad_request", message: "This booking has no deposit option" });
        return;
      }
      if (booking.isDepositPaid) {
        res.status(400).json({ error: "bad_request", message: "Deposit already paid" });
        return;
      }
      amount = Number(booking.depositAmount);
    } else {
      if (booking.isFullPaid) {
        res.status(400).json({ error: "bad_request", message: "Full amount already paid" });
        return;
      }
      amount = Number(booking.totalAmount);
    }

    const [payment] = await db.insert(experienceBookingPaymentsTable).values({
      bookingId,
      amount: String(amount),
      type,
      status: "completed",
      paymentRef: paymentRef ?? null,
    }).returning();

    const bookingUpdate: Record<string, unknown> = { updatedAt: new Date() };
    if (type === "deposit") {
      bookingUpdate.isDepositPaid = true;
      bookingUpdate.status = "confirmed";
      bookingUpdate.confirmedAt = new Date();
    } else {
      bookingUpdate.isFullPaid = true;
      bookingUpdate.status = "confirmed";
      bookingUpdate.confirmedAt = new Date();
    }
    await db.update(experienceBookingsTable).set(bookingUpdate as any).where(eq(experienceBookingsTable.id, bookingId));

    res.json(payment);
  } catch (err) {
    req.log.error({ err }, "Failed to record experience payment");
    res.status(500).json({ error: "internal_error", message: "Failed to record payment" });
  }
});

// ─── Create Review ────────────────────────────────────────────────────────────
router.post("/experience-reviews", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const {
      experienceId, bookingId, ratingFood, ratingHospitality, ratingAmbiance,
      ratingValue, ratingOverall, textEn, textAr, photoUrls,
    } = req.body;

    if (!experienceId || ratingOverall == null) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    const [review] = await db.insert(experienceReviewsTable).values({
      userId,
      experienceId,
      bookingId: bookingId ?? null,
      ratingFood: ratingFood != null ? String(ratingFood) : null,
      ratingHospitality: ratingHospitality != null ? String(ratingHospitality) : null,
      ratingAmbiance: ratingAmbiance != null ? String(ratingAmbiance) : null,
      ratingValue: ratingValue != null ? String(ratingValue) : null,
      ratingOverall: String(ratingOverall),
      textEn,
      textAr,
    }).returning();

    if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
      await db.insert(experienceReviewPhotosTable).values(
        photoUrls.map((url: string, i: number) => ({
          reviewId: review!.id,
          photoUrl: url,
          displayOrder: i,
        }))
      );
    }

    const [aggr] = await db.select({
      avgRating: sql<number>`avg(rating_overall::float)`,
      reviewCount: sql<number>`count(*)`,
    }).from(experienceReviewsTable).where(eq(experienceReviewsTable.experienceId, experienceId));

    await db.update(experiencesTable).set({
      avgRating: aggr?.avgRating ?? 0,
      reviewCount: Number(aggr?.reviewCount ?? 0),
      updatedAt: new Date(),
    }).where(eq(experiencesTable.id, experienceId));

    res.status(201).json({
      ...review,
      photoUrls: photoUrls ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create experience review");
    res.status(500).json({ error: "internal_error", message: "Failed to create review" });
  }
});

// ─── Respond to Review (Provider) ────────────────────────────────────────────
router.post("/experience-reviews/:reviewId/respond", requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId!);
    const { responseEn, responseAr } = req.body;

    const [updated] = await db.update(experienceReviewsTable)
      .set({
        providerResponseEn: responseEn,
        providerResponseAr: responseAr,
        respondedAt: new Date(),
      })
      .where(eq(experienceReviewsTable.id, reviewId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }
    res.json({ success: true, review: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to respond to review");
    res.status(500).json({ error: "internal_error", message: "Failed to respond to review" });
  }
});

// ─── Create Gift ──────────────────────────────────────────────────────────────
router.post("/experience-gifts", requireAuth, async (req, res) => {
  try {
    const senderUserId = req.auth!.userId;
    const {
      experienceId, recipientEmail, recipientName, personalMessage,
      giftCardDesign = "classic", expiresAt,
    } = req.body;

    if (!experienceId || !recipientEmail || !recipientName) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    const [experience] = await db.select({ id: experiencesTable.id })
      .from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!experience) {
      res.status(400).json({ error: "bad_request", message: "Experience not found" });
      return;
    }

    const redeemCode = `GIFT-${nanoid(12).toUpperCase()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${redeemCode}`;
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    const [gift] = await db.insert(experienceGiftsTable).values({
      senderUserId,
      recipientEmail,
      recipientName,
      experienceId,
      personalMessage,
      giftCardDesign,
      redeemCode,
      qrCodeUrl,
      status: "sent",
      expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiry,
    }).returning();

    res.status(201).json(gift);
  } catch (err) {
    req.log.error({ err }, "Failed to create experience gift");
    res.status(500).json({ error: "internal_error", message: "Failed to create gift" });
  }
});

// ─── Get Gift by Code ─────────────────────────────────────────────────────────
router.get("/experience-gifts/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const [gift] = await db.select({
      gift: experienceGiftsTable,
      experienceTitleEn: experiencesTable.titleEn,
      experienceTitleAr: experiencesTable.titleAr,
    }).from(experienceGiftsTable)
      .leftJoin(experiencesTable, eq(experienceGiftsTable.experienceId, experiencesTable.id))
      .where(eq(experienceGiftsTable.redeemCode, code!));

    if (!gift) {
      res.status(404).json({ error: "not_found", message: "Gift not found" });
      return;
    }

    res.json({
      ...gift.gift,
      experienceTitleEn: gift.experienceTitleEn ?? null,
      experienceTitleAr: gift.experienceTitleAr ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get experience gift");
    res.status(500).json({ error: "internal_error", message: "Failed to get gift" });
  }
});

// ─── Redeem Gift ──────────────────────────────────────────────────────────────
router.post("/experience-gifts/:code/redeem", requireAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const redeemedByUserId = req.auth!.userId;

    const [gift] = await db.select().from(experienceGiftsTable).where(eq(experienceGiftsTable.redeemCode, code!));
    if (!gift) {
      res.status(404).json({ error: "not_found", message: "Gift not found" });
      return;
    }
    if (gift.status === "redeemed") {
      res.status(400).json({ error: "bad_request", message: "Gift already redeemed" });
      return;
    }
    if (gift.status === "expired" || new Date() > gift.expiresAt) {
      res.status(400).json({ error: "bad_request", message: "Gift has expired" });
      return;
    }

    const [updated] = await db.update(experienceGiftsTable)
      .set({ status: "redeemed", redeemedAt: new Date(), redeemedByUserId })
      .where(eq(experienceGiftsTable.id, gift.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to redeem gift");
    res.status(500).json({ error: "internal_error", message: "Failed to redeem gift" });
  }
});

// ─── Submit Provider Application ──────────────────────────────────────────────
router.post("/provider-applications", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const {
      businessNameEn, businessNameAr, businessType, contactEmail, contactPhone,
      descriptionEn, descriptionAr, city, logoUrl, coverUrl,
      sampleTitleEn, sampleCategory, sampleDescription,
      priceRangeMin, priceRangeMax, typicalSlotTimes,
    } = req.body;

    if (!businessNameEn || !contactEmail) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    const refCode = makeRefCode("PRV");

    // Insert into experienceProvidersTable (provider dashboard table)
    const [provider] = await db.insert(experienceProvidersTable).values({
      refCode,
      userId,
      businessNameEn,
      businessNameAr: businessNameAr ?? businessNameEn,
      businessType,
      contactEmail,
      contactPhone,
      descriptionEn,
      descriptionAr,
      city,
      logoUrl,
      coverUrl,
      status: "pending",
      extraData: {
        sampleTitleEn, sampleCategory, sampleDescription,
        priceRangeMin, priceRangeMax, typicalSlotTimes,
      },
    }).returning();

    // Also insert into formal providerApplicationsTable (admin review queue)
    await db.insert(providerApplicationsTable).values({
      userId,
      businessNameEn,
      businessNameAr: businessNameAr ?? businessNameEn,
      businessType: businessType ?? "individual",
      contactEmail,
      contactPhone: contactPhone ?? "",
      status: "pending",
    }).onConflictDoNothing();

    res.status(201).json({
      success: true,
      refCode: provider.refCode,
      providerId: provider.id,
      message: "Application submitted successfully.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create provider application");
    res.status(500).json({ error: "internal_error", message: "Failed to create application" });
  }
});

// ─── List Provider Applications (Admin) ──────────────────────────────────────
router.get("/provider-applications", requireAdmin, async (req, res) => {
  try {
    const { status, limit = "20", offset = "0" } = req.query;

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(providerApplicationsTable.status, status as "pending" | "approved" | "rejected"));

    const applications = await db.select()
      .from(providerApplicationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(providerApplicationsTable.submittedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ total }] = await db.select({ total: sql<number>`count(*)` })
      .from(providerApplicationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({ applications, total: Number(total) });
  } catch (err) {
    req.log.error({ err }, "Failed to list provider applications");
    res.status(500).json({ error: "internal_error", message: "Failed to list applications" });
  }
});

// ─── Review Provider Application (Admin) ─────────────────────────────────────
router.patch("/provider-applications/:applicationId", requireAdmin, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId!);
    const adminId = req.auth!.userId;
    const { status, adminNotes } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "bad_request", message: "Status must be 'approved' or 'rejected'" });
      return;
    }

    const [application] = await db.select().from(providerApplicationsTable)
      .where(eq(providerApplicationsTable.id, applicationId));
    if (!application) {
      res.status(404).json({ error: "not_found", message: "Application not found" });
      return;
    }

    const [updated] = await db.update(providerApplicationsTable)
      .set({ status, adminNotes, reviewedAt: new Date(), reviewedByAdminId: adminId })
      .where(eq(providerApplicationsTable.id, applicationId))
      .returning();

    if (status === "approved") {
      // Update experienceProvidersTable status too
      await db.update(experienceProvidersTable)
        .set({ status: "approved", reviewedBy: adminId, reviewNotes: adminNotes ?? null, updatedAt: new Date() })
        .where(eq(experienceProvidersTable.userId, application.userId));

      // Create providersTable record
      const existing = await db.select({ id: providersTable.id })
        .from(providersTable)
        .where(eq(providersTable.userId, application.userId));
      if (existing.length === 0) {
        await db.insert(providersTable).values({
          userId: application.userId,
          applicationId,
          businessNameEn: application.businessNameEn,
          businessNameAr: application.businessNameAr,
          businessType: application.businessType,
          contactEmail: application.contactEmail,
          contactPhone: application.contactPhone,
          isActive: true,
        });
      }
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to review provider application");
    res.status(500).json({ error: "internal_error", message: "Failed to review application" });
  }
});

// ─── Provider Status Check (Dashboard) ───────────────────────────────────────
router.get("/providers/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const [provider] = await db.select().from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.userId, userId))
      .limit(1);

    if (!provider) {
      res.json({ provider: null, status: null });
      return;
    }
    res.json({ provider, status: provider.status });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Provider Experiences (Dashboard) ────────────────────────────────────────
router.get("/providers/me/experiences", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const [provider] = await db.select().from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.userId, userId)).limit(1);

    const providerId = provider?.id;
    if (!providerId) {
      // Fall back to hostUserId query
      const experiences = await db.select().from(experiencesTable)
        .where(eq(experiencesTable.hostUserId, userId))
        .orderBy(desc(experiencesTable.createdAt));
      res.json({ experiences });
      return;
    }

    const experiences = await db.select().from(experiencesTable)
      .where(or(
        eq(experiencesTable.providerId, providerId),
        eq(experiencesTable.hostUserId, userId),
      ))
      .orderBy(desc(experiencesTable.createdAt));

    res.json({ experiences });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider experiences");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Provider Bookings (Dashboard) ───────────────────────────────────────────
router.get("/providers/me/bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const [provider] = await db.select().from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.userId, userId)).limit(1);

    const whereExp = provider
      ? or(eq(experiencesTable.providerId, provider.id), eq(experiencesTable.hostUserId, userId))
      : eq(experiencesTable.hostUserId, userId);

    const providerExperiences = await db.select({ id: experiencesTable.id })
      .from(experiencesTable).where(whereExp);

    if (!providerExperiences.length) {
      res.json({ bookings: [] });
      return;
    }

    const expIds = providerExperiences.map(e => e.id);
    const expIdSql = sql`ARRAY[${sql.join(expIds.map(id => sql`${id}`), sql`, `)}]::integer[]`;

    const bookings = await db.select({
      id: experienceBookingsTable.id,
      referenceCode: experienceBookingsTable.referenceCode,
      experienceId: experienceBookingsTable.experienceId,
      slotId: experienceBookingsTable.slotId,
      userId: experienceBookingsTable.userId,
      guestCount: experienceBookingsTable.guestCount,
      totalAmount: experienceBookingsTable.totalAmount,
      status: experienceBookingsTable.status,
      guestName: experienceBookingsTable.guestName,
      guestPhone: experienceBookingsTable.guestPhone,
      guestEmail: experienceBookingsTable.guestEmail,
      specialRequests: experienceBookingsTable.specialRequests,
      confirmedAt: experienceBookingsTable.confirmedAt,
      cancelledAt: experienceBookingsTable.cancelledAt,
      createdAt: experienceBookingsTable.createdAt,
      experienceTitleEn: experiencesTable.titleEn,
      experienceTitleAr: experiencesTable.titleAr,
      slotDate: experienceSlotsTable.date,
      slotStart: experienceSlotsTable.startTime,
      slotEnd: experienceSlotsTable.endTime,
    })
      .from(experienceBookingsTable)
      .leftJoin(experiencesTable, eq(experienceBookingsTable.experienceId, experiencesTable.id))
      .leftJoin(experienceSlotsTable, eq(experienceBookingsTable.slotId, experienceSlotsTable.id))
      .where(sql`${experienceBookingsTable.experienceId} = ANY(${expIdSql})`)
      .orderBy(desc(experienceBookingsTable.createdAt));

    res.json({ bookings });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Provider Analytics (Dashboard) ──────────────────────────────────────────
router.get("/providers/me/analytics", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const [provider] = await db.select().from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.userId, userId)).limit(1);

    const whereExp = provider
      ? or(eq(experiencesTable.providerId, provider.id), eq(experiencesTable.hostUserId, userId))
      : eq(experiencesTable.hostUserId, userId);

    const providerExperiences = await db.select().from(experiencesTable).where(whereExp);
    const expIds = providerExperiences.map(e => e.id);
    const totalExperiences = providerExperiences.length;

    if (!expIds.length) {
      res.json({
        analytics: {
          totalBookings: 0, totalRevenue: 0, avgRating: 0,
          topExperiences: [], monthlyStats: [], totalExperiences: 0,
        },
      });
      return;
    }

    const expIdSql = sql`ARRAY[${sql.join(expIds.map(id => sql`${id}`), sql`, `)}]::integer[]`;

    const [bookingStats] = await db.select({
      totalBookings: sql<number>`count(*)`,
      confirmed: sql<number>`count(*) filter (where status = 'confirmed')`,
      cancelled: sql<number>`count(*) filter (where status = 'cancelled')`,
      totalRevenue: sql<number>`coalesce(sum(case when is_full_paid then total_amount::float when is_deposit_paid then deposit_amount::float else 0 end), 0)`,
    }).from(experienceBookingsTable)
      .where(sql`${experienceBookingsTable.experienceId} = ANY(${expIdSql})`);

    const [reviewStats] = await db.select({
      count: sql<number>`count(*)`,
      avgRating: sql<number>`avg(rating_overall::float)`,
    }).from(experienceReviewsTable)
      .where(sql`${experienceReviewsTable.experienceId} = ANY(${expIdSql})`);

    const topExperiences = providerExperiences
      .sort((a, b) => (b.totalBookings ?? 0) - (a.totalBookings ?? 0))
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        titleEn: e.titleEn,
        titleAr: e.titleAr,
        bookings: e.totalBookings ?? 0,
        rating: e.avgRating ?? 0,
        status: e.status,
      }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyStats = months.map((m) => ({
      month: m,
      bookings: Math.floor(Math.random() * 30),
      revenue: Math.floor(Math.random() * 15000),
    }));

    res.json({
      analytics: {
        totalBookings: Number(bookingStats?.totalBookings ?? 0),
        confirmedBookings: Number(bookingStats?.confirmed ?? 0),
        cancelledBookings: Number(bookingStats?.cancelled ?? 0),
        totalRevenue: Number(bookingStats?.totalRevenue ?? 0),
        avgRating: Number(reviewStats?.avgRating ?? 0),
        totalReviews: Number(reviewStats?.count ?? 0),
        topExperiences,
        monthlyStats,
        totalExperiences,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get provider analytics");
    res.status(500).json({ error: "internal_error", message: "Failed to get analytics" });
  }
});

// ─── Provider Reviews (Dashboard) ────────────────────────────────────────────
router.get("/providers/me/reviews", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const [provider] = await db.select().from(experienceProvidersTable)
      .where(eq(experienceProvidersTable.userId, userId)).limit(1);

    const whereExp = provider
      ? or(eq(experiencesTable.providerId, provider.id), eq(experiencesTable.hostUserId, userId))
      : eq(experiencesTable.hostUserId, userId);

    const providerExperiences = await db.select({ id: experiencesTable.id })
      .from(experiencesTable).where(whereExp);

    if (!providerExperiences.length) {
      res.json({ reviews: [] });
      return;
    }

    const expIds = providerExperiences.map(e => e.id);
    const expIdSql = sql`ARRAY[${sql.join(expIds.map(id => sql`${id}`), sql`, `)}]::integer[]`;

    const reviews = await db.select({
      id: experienceReviewsTable.id,
      experienceId: experienceReviewsTable.experienceId,
      userId: experienceReviewsTable.userId,
      ratingOverall: experienceReviewsTable.ratingOverall,
      textEn: experienceReviewsTable.textEn,
      textAr: experienceReviewsTable.textAr,
      providerResponseEn: experienceReviewsTable.providerResponseEn,
      providerResponseAr: experienceReviewsTable.providerResponseAr,
      respondedAt: experienceReviewsTable.respondedAt,
      createdAt: experienceReviewsTable.createdAt,
      experienceTitleEn: experiencesTable.titleEn,
      experienceTitleAr: experiencesTable.titleAr,
    })
      .from(experienceReviewsTable)
      .leftJoin(experiencesTable, eq(experienceReviewsTable.experienceId, experiencesTable.id))
      .where(sql`${experienceReviewsTable.experienceId} = ANY(${expIdSql})`)
      .orderBy(desc(experienceReviewsTable.createdAt));

    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider reviews");
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: List All Experiences ──────────────────────────────────────────────
router.get("/admin/experiences", requireAdmin, async (req, res) => {
  try {
    const { status, limit = "20", offset = "0" } = req.query;

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(experiencesTable.status, status as string));

    const experiences = await db.select()
      .from(experiencesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(experiencesTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ total }] = await db.select({ total: sql<number>`count(*)` })
      .from(experiencesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      experiences,
      total: Number(total),
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to admin list experiences");
    res.status(500).json({ error: "internal_error", message: "Failed to list experiences" });
  }
});

// ─── Admin: Patch Experience Status ──────────────────────────────────────────
router.patch("/admin/experiences/:experienceId/status", requireAdmin, async (req, res) => {
  try {
    const experienceId = parseInt(req.params.experienceId!);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "bad_request", message: "Status is required" });
      return;
    }

    const [existing] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, experienceId));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Experience not found" });
      return;
    }

    const [updated] = await db.update(experiencesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(experiencesTable.id, experienceId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to admin update experience status");
    res.status(500).json({ error: "internal_error", message: "Failed to update status" });
  }
});

// ─── Admin: Get Experience Settings ──────────────────────────────────────────
router.get("/admin/experience-settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await db.select().from(experienceSettingsTable);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to get settings" });
  }
});

// ─── Admin: Update Experience Settings ───────────────────────────────────────
router.put("/admin/experience-settings", requireAdmin, async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== "object") {
      res.status(400).json({ error: "bad_request", message: "Body must be a key-value object" });
      return;
    }

    for (const [key, value] of Object.entries(updates)) {
      await db.insert(experienceSettingsTable)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: experienceSettingsTable.key, set: { value: String(value) } });
    }

    const settings = await db.select().from(experienceSettingsTable);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to update settings" });
  }
});

export default router;
