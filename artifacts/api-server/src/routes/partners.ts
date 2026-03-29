import { Router } from "express";
import { db } from "@workspace/db";
import { partnerApplicationsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

function genRefCode() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `TBQ-APP-${year}-${n}`;
}

router.post("/partner-applications", async (req, res) => {
  try {
    const {
      businessType, nameEn, nameAr, city, address, seatingCapacity,
      cuisines, description, phone, email, website,
      ownerName, ownerEmail, crNumber, plan, ...rest
    } = req.body;

    if (!nameEn || !phone || !email || !ownerName || !ownerEmail) {
      res.status(400).json({ error: "validation_error", message: "Required fields missing" });
      return;
    }

    const refCode = genRefCode();

    const [application] = await db.insert(partnerApplicationsTable).values({
      refCode,
      businessType,
      nameEn,
      nameAr,
      city,
      address,
      seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null,
      cuisines: Array.isArray(cuisines) ? cuisines : [],
      description,
      phone,
      email,
      website,
      ownerName,
      ownerEmail,
      crNumber,
      plan,
      extraData: rest,
      status: "pending",
    }).returning();

    res.status(201).json({
      success: true,
      refCode: application.refCode,
      applicationId: application.id,
      message: "Application submitted successfully. Our team will review it within 2-3 business days.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit partner application");
    res.status(500).json({ error: "internal_error", message: "Failed to submit application" });
  }
});

router.get("/admin/registrations", async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const apps = await db.select().from(partnerApplicationsTable)
      .where(status !== "all" ? eq(partnerApplicationsTable.status, status as string) : sql`1=1`)
      .orderBy(desc(partnerApplicationsTable.createdAt));
    res.json({ applications: apps, total: apps.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch partner applications");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch applications" });
  }
});

router.patch("/admin/registrations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { status, reviewNotes } = req.body;
    const [updated] = await db.update(partnerApplicationsTable)
      .set({ status, reviewNotes, updatedAt: new Date() })
      .where(eq(partnerApplicationsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update partner application");
    res.status(500).json({ error: "internal_error", message: "Failed to update application" });
  }
});

export default router;
