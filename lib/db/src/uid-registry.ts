import { db } from "./index.js";
import { uidRegistryTable, type UidEntityType, type UidStatus } from "./schema/uid-registry.js";

export async function registerUid(
  uid: string,
  entityType: UidEntityType,
  status: UidStatus = "active",
): Promise<void> {
  await db.insert(uidRegistryTable).values({ uid, entityType, status }).onConflictDoNothing();
}

export type { UidEntityType, UidStatus };
