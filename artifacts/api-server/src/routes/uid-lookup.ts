import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { uidRegistryTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/v1/uid/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      res.status(400).json({ error: "bad_request", message: "uid is required" });
      return;
    }

    const [record] = await db
      .select({ entityType: uidRegistryTable.entityType, status: uidRegistryTable.status })
      .from(uidRegistryTable)
      .where(eq(uidRegistryTable.uid, uid))
      .limit(1);

    if (!record) {
      res.status(404).json({ error: "not_found", message: "UID not found" });
      return;
    }

    res.json({ entity_type: record.entityType, status: record.status });
  } catch (err) {
    req.log.error({ err }, "Failed to lookup UID");
    res.status(500).json({ error: "internal_error", message: "Failed to lookup UID" });
  }
});

export default router;
