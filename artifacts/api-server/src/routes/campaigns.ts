import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, campaignOptionsTable, restaurantsTable, vouchersTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte, or, desc, asc, type SQL } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { nanoid } from "nanoid";

const router: IRouter = Router();

// GET /campaigns — list with status filter, category, city, type, sort
router.get("/campaigns", async (req, res) => {
  try {
    const { 
      status = "live", 
      categoryId, 
      cityId, 
      type, 
      sort = "newest",
      limit = "20",
      offset = "0"
    } = req.query;

    const conditions: SQL[] = [];
    
    if (status) conditions.push(eq(campaignsTable.status, status as string as any));
    if (cityId) conditions.push(eq(restaurantsTable.cityId, parseInt(cityId as string)));
    if (type) conditions.push(eq(campaignsTable.type, type as string as any));
    
    // category filter would require joining with a restaurant_categories table if it exists
    // for now we'll stick to the basic ones

    let orderBy: SQL;
    switch (sort) {
      case "best_value":
        orderBy = desc(sql`(SELECT MAX(discount_percent) FROM campaign_options WHERE campaign_id = ${campaignsTable.id})`);
        break;
      case "highest_rated":
        orderBy = desc(restaurantsTable.avgRating);
        break;
      case "best_sellers":
        orderBy = desc(sql`total_sold`);
        break;
      case "ending_soon":
        orderBy = asc(campaignsTable.validUntil);
        break;
      case "newest":
      default:
        orderBy = desc(campaignsTable.createdAt);
        break;
    }

    const campaigns = await db.select({
      id: campaignsTable.id,
      refCode: campaignsTable.refCode,
      restaurantId: campaignsTable.restaurantId,
      status: campaignsTable.status,
      type: campaignsTable.type,
      titleEn: campaignsTable.titleEn,
      titleAr: campaignsTable.titleAr,
      descriptionEn: campaignsTable.descriptionEn,
      descriptionAr: campaignsTable.descriptionAr,
      imageUrls: campaignsTable.imageUrls,
      validFrom: campaignsTable.validFrom,
      validUntil: campaignsTable.validUntil,
      restaurantNameEn: restaurantsTable.nameEn,
      restaurantNameAr: restaurantsTable.nameAr,
      restaurantRating: restaurantsTable.avgRating,
    })
    .from(campaignsTable)
    .innerJoin(restaurantsTable, eq(campaignsTable.restaurantId, restaurantsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(parseInt(limit as string))
    .offset(parseInt(offset as string));

    res.json(campaigns);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch campaigns");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /campaigns/:id — full detail with options
router.get("/campaigns/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    
    if (!campaign) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const options = await db.select().from(campaignOptionsTable).where(eq(campaignOptionsTable.campaignId, id));

    res.json({ ...campaign, options });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch campaign");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /campaigns — create (merchant, requires auth + restaurant ownership)
router.post("/campaigns", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { restaurantId, ...data } = req.body;

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    if (!restaurant || restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const [campaign] = await db.insert(campaignsTable).values({
      ...data,
      restaurantId,
      status: "draft",
    }).returning();

    const refCode = `TBQ-CMP-${new Date().getFullYear()}-${campaign.id.toString().padStart(6, "0")}`;
    await db.update(campaignsTable).set({ refCode }).where(eq(campaignsTable.id, campaign.id));

    res.status(201).json({ ...campaign, refCode });
  } catch (err) {
    req.log.error({ err }, "Failed to create campaign");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /campaigns/:id — update (draft/rejected only)
router.patch("/campaigns/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params.id as string);
    
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    if (!campaign) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, campaign.restaurantId));
    if (restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    if (campaign.status !== "draft" && campaign.status !== "rejected") {
      res.status(400).json({ error: "bad_request", message: "Only draft or rejected campaigns can be updated" });
      return;
    }

    const [updated] = await db.update(campaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(campaignsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update campaign");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /campaigns/:id/submit — submit for review
router.post("/campaigns/:id/submit", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params.id as string);
    
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    if (!campaign) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, campaign.restaurantId));
    if (restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const [updated] = await db.update(campaignsTable).set({ status: "submitted", updatedAt: new Date() }).where(eq(campaignsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to submit campaign");
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /campaigns/:id/status — pause/resume/end (merchant own campaigns)
router.patch("/campaigns/:id/status", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    if (!campaign) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, campaign.restaurantId));
    if (restaurant.ownerId !== userId) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    if (!["live", "paused", "ended"].includes(status)) {
       res.status(400).json({ error: "bad_request", message: "Invalid status" });
       return;
    }

    const [updated] = await db.update(campaignsTable).set({ status: status as any, updatedAt: new Date() }).where(eq(campaignsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update campaign status");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /campaigns/:id/purchase — purchase a campaign option
router.post("/campaigns/:id/purchase", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const campaignId = parseInt(req.params.id as string);
    const { optionId, promoCodeId } = req.body;

    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
    if (!campaign || campaign.status !== "live") {
      res.status(404).json({ error: "not_found", message: "Campaign not live" });
      return;
    }

    const [option] = await db.select().from(campaignOptionsTable).where(and(eq(campaignOptionsTable.id, optionId), eq(campaignOptionsTable.campaignId, campaignId)));
    if (!option || !option.isActive) {
      res.status(404).json({ error: "not_found", message: "Option not found or inactive" });
      return;
    }

    // Check caps
    if (option.initialCap && option.soldCount >= option.initialCap) {
      res.status(400).json({ error: "sold_out" });
      return;
    }

    const code = `VCH-${nanoid(10).toUpperCase()}`;
    const secureToken = nanoid(32);

    const [voucher] = await db.transaction(async (tx) => {
      // Update option counts
      await tx.update(campaignOptionsTable)
        .set({ 
          soldCount: sql`${campaignOptionsTable.soldCount} + 1`,
          monthlySoldCount: sql`${campaignOptionsTable.monthlySoldCount} + 1`,
          updatedAt: new Date() 
        })
        .where(eq(campaignOptionsTable.id, optionId));

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + option.validityDays);

      const [v] = await tx.insert(vouchersTable).values({
        code,
        secureToken,
        campaignId,
        campaignOptionId: optionId,
        userId,
        restaurantId: campaign.restaurantId,
        faceValue: option.originalPrice,
        purchasePrice: option.dealPrice,
        value: option.dealPrice, // current value
        status: "active",
        validFrom: new Date(),
        validUntil: validUntil,
        redemptionPeriodDays: option.validityDays,
        promoCodeId: promoCodeId || null,
      }).returning();
      
      return [v];
    });

    res.status(201).json(voucher);
  } catch (err) {
    req.log.error({ err }, "Failed to purchase campaign option");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
