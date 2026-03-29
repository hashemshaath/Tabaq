import { Router } from "express";
import { db } from "@workspace/db";
import { userAddressesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/me/addresses", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const addresses = await db
      .select()
      .from(userAddressesTable)
      .where(eq(userAddressesTable.userId, userId))
      .orderBy(userAddressesTable.isDefault, userAddressesTable.createdAt);
    res.json(addresses);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/me/addresses", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const body = req.body as {
      label?: string; labelAr?: string; isDefault?: boolean;
      addressLine1: string; addressLine2?: string; district?: string;
      city: string; region?: string; postalCode?: string; countryCode?: string;
      nationalAddress?: string; buildingNumber?: string; additionalNumber?: string;
      unitNumber?: string; contactName?: string; contactPhone?: string;
      latitude?: number; longitude?: number;
    };

    if (!body.addressLine1 || !body.city) {
      return res.status(400).json({ error: "Address line 1 and city are required" });
    }

    if (body.isDefault) {
      await db
        .update(userAddressesTable)
        .set({ isDefault: false })
        .where(eq(userAddressesTable.userId, userId));
    }

    const [created] = await db
      .insert(userAddressesTable)
      .values({ userId, ...body })
      .returning();

    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/me/addresses/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const addressId = parseInt(req.params.id);
    const body = req.body;

    const [existing] = await db
      .select()
      .from(userAddressesTable)
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)));

    if (!existing) return res.status(404).json({ error: "Address not found" });

    if (body.isDefault) {
      await db
        .update(userAddressesTable)
        .set({ isDefault: false })
        .where(eq(userAddressesTable.userId, userId));
    }

    const [updated] = await db
      .update(userAddressesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)))
      .returning();

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/me/addresses/:id/default", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const addressId = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(userAddressesTable)
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)));

    if (!existing) return res.status(404).json({ error: "Address not found" });

    await db
      .update(userAddressesTable)
      .set({ isDefault: false })
      .where(eq(userAddressesTable.userId, userId));

    const [updated] = await db
      .update(userAddressesTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)))
      .returning();

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/me/addresses/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const addressId = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(userAddressesTable)
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)));

    if (!existing) return res.status(404).json({ error: "Address not found" });

    await db
      .delete(userAddressesTable)
      .where(and(eq(userAddressesTable.id, addressId), eq(userAddressesTable.userId, userId)));

    if (existing.isDefault) {
      const remaining = await db
        .select()
        .from(userAddressesTable)
        .where(eq(userAddressesTable.userId, userId))
        .limit(1);
      if (remaining[0]) {
        await db
          .update(userAddressesTable)
          .set({ isDefault: true })
          .where(eq(userAddressesTable.id, remaining[0].id));
      }
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
