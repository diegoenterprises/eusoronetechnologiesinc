/**
 * OWNERSHIP VERIFIER
 * Defense-in-depth ownership verification for all resource types.
 * Ensures no user can access, modify, or infer the existence of
 * another user's private data unless explicitly authorized.
 *
 * CRITICAL RULES:
 * 1. NEVER trust client-provided user IDs — always use ctx.userId
 * 2. Return NOT_FOUND (not FORBIDDEN) to prevent existence leakage
 * 3. Every query for user data MUST include ownership filter
 */

import { TRPCError } from "@trpc/server";
import { eq, and, or, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../../drizzle/schema";
import { PrivacyLevel, getClassification } from "./privacy-classifier";

export type ResourceType =
  | "wallet" | "walletTransaction" | "notification" | "session"
  | "userDocument" | "message" | "conversation"
  | "load" | "bid" | "invoice" | "agreement"
  | "vehicle" | "equipment" | "driver"
  | "bankAccount" | "paymentMethod"
  | "gpsBreadcrumb" | "geofenceEvent" | "geotag";

/**
 * Verify that a resource belongs to the requesting user.
 * Returns the resource if owned, throws NOT_FOUND otherwise.
 *
 * This is the CORE isolation primitive. Use it in every procedure
 * that accesses a resource by ID.
 */
export async function verifyOwnership(
  resourceType: ResourceType,
  resourceId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const classification = getClassification(resourceType);
  if (!classification) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unknown resource type" });
  }

  let exists = false;

  switch (classification.level) {
    case PrivacyLevel.L1_PRIVATE:
      exists = await checkDirectOwnership(db, resourceType, resourceId, userId);
      break;

    case PrivacyLevel.L2_ORGANIZATION:
      exists = await checkOrgOwnership(db, resourceType, resourceId, userId, organizationId);
      break;

    case PrivacyLevel.L3_RELATIONSHIP:
      exists = await checkRelationshipAccess(db, resourceType, resourceId, userId, organizationId);
      break;

    case PrivacyLevel.L4_PUBLIC:
      // Public resources — just verify existence
      exists = await checkExists(db, resourceType, resourceId);
      break;
  }

  if (!exists) {
    // CRITICAL: Return NOT_FOUND, not FORBIDDEN
    // This prevents attackers from confirming resource existence
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${resourceType} not found`,
    });
  }
}

/**
 * Build a safe WHERE clause checking ownership for a given resource type.
 * Returns a Drizzle SQL fragment that can be used in queries.
 *
 * Usage in routers:
 *   const where = ownershipFilter("wallet", ctx.user.id);
 *   const wallets = await db.select().from(walletsTable).where(where);
 */
export function ownershipFilter(
  resourceType: string,
  userId: number | string,
  organizationId?: number | string | null
): ReturnType<typeof sql> {
  const classification = getClassification(resourceType);
  if (!classification) {
    // Fail closed: if we don't know the classification, return impossible condition
    return sql`1 = 0`;
  }

  const uid = Number(userId);

  switch (classification.level) {
    case PrivacyLevel.L1_PRIVATE:
      return sql`${sql.raw(classification.ownerField)} = ${uid}`;

    case PrivacyLevel.L2_ORGANIZATION:
      if (organizationId && classification.orgField) {
        return sql`(${sql.raw(classification.ownerField)} = ${uid} OR ${sql.raw(classification.orgField)} = ${Number(organizationId)})`;
      }
      return sql`${sql.raw(classification.ownerField)} = ${uid}`;

    case PrivacyLevel.L3_RELATIONSHIP:
      if (classification.participantFields && classification.participantFields.length > 0) {
        const conditions = classification.participantFields
          .map(field => `${field} = ${uid}`)
          .join(" OR ");
        if (organizationId && classification.orgField) {
          return sql`(${sql.raw(conditions)} OR ${sql.raw(classification.orgField)} = ${Number(organizationId)})`;
        }
        return sql`(${sql.raw(conditions)})`;
      }
      return sql`${sql.raw(classification.ownerField)} = ${uid}`;

    case PrivacyLevel.L4_PUBLIC:
      return sql`1 = 1`;

    default:
      return sql`1 = 0`;
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function checkDirectOwnership(
  db: any,
  resourceType: ResourceType,
  resourceId: number | string,
  userId: number | string
): Promise<boolean> {
  const tableName = getTableName(resourceType);
  const ownerCol = getOwnerColumn(resourceType);

  try {
    const [row] = await db.execute(
      sql`SELECT 1 FROM ${sql.raw(tableName)} WHERE id = ${Number(resourceId)} AND ${sql.raw(ownerCol)} = ${Number(userId)} LIMIT 1`
    );
    return !!row;
  } catch {
    return false;
  }
}

async function checkOrgOwnership(
  db: any,
  resourceType: ResourceType,
  resourceId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<boolean> {
  const tableName = getTableName(resourceType);
  const classification = getClassification(resourceType);
  if (!classification) return false;

  try {
    if (organizationId && classification.orgField) {
      const [row] = await db.execute(
        sql`SELECT 1 FROM ${sql.raw(tableName)} WHERE id = ${Number(resourceId)} AND (${sql.raw(classification.ownerField)} = ${Number(userId)} OR ${sql.raw(classification.orgField)} = ${Number(organizationId)}) LIMIT 1`
      );
      return !!row;
    }

    const [row] = await db.execute(
      sql`SELECT 1 FROM ${sql.raw(tableName)} WHERE id = ${Number(resourceId)} AND ${sql.raw(classification.ownerField)} = ${Number(userId)} LIMIT 1`
    );
    return !!row;
  } catch {
    return false;
  }
}

async function checkRelationshipAccess(
  db: any,
  resourceType: ResourceType,
  resourceId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<boolean> {
  const tableName = getTableName(resourceType);
  const classification = getClassification(resourceType);
  if (!classification || !classification.participantFields) return false;

  try {
    const conditions = classification.participantFields
      .map(field => `${field} = ${Number(userId)}`)
      .join(" OR ");

    let query = `SELECT 1 FROM ${tableName} WHERE id = ${Number(resourceId)} AND (${conditions}`;
    if (organizationId && classification.orgField) {
      query += ` OR ${classification.orgField} = ${Number(organizationId)}`;
    }
    query += ") LIMIT 1";

    const [row] = await db.execute(sql.raw(query));
    return !!row;
  } catch {
    return false;
  }
}

async function checkExists(
  db: any,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<boolean> {
  const tableName = getTableName(resourceType);
  try {
    const [row] = await db.execute(
      sql`SELECT 1 FROM ${sql.raw(tableName)} WHERE id = ${Number(resourceId)} LIMIT 1`
    );
    return !!row;
  } catch {
    return false;
  }
}

/**
 * Map resource type to DB table name.
 */
function getTableName(resourceType: ResourceType): string {
  const map: Record<string, string> = {
    wallet: "wallets",
    walletTransaction: "wallet_transactions",
    notification: "notifications",
    session: "sessions",
    userDocument: "documents",
    message: "messages",
    conversation: "conversations",
    load: "loads",
    bid: "bids",
    invoice: "invoices",
    agreement: "agreements",
    vehicle: "vehicles",
    equipment: "equipment",
    driver: "drivers",
    bankAccount: "bank_accounts",
    paymentMethod: "payment_methods",
    gpsBreadcrumb: "gps_breadcrumbs",
    geofenceEvent: "geofence_events",
    geotag: "geotags",
  };
  return map[resourceType] || resourceType;
}

/**
 * Map resource type to owner column name.
 */
function getOwnerColumn(resourceType: ResourceType): string {
  const classification = getClassification(resourceType);
  return classification?.ownerField || "userId";
}

/**
 * Quick check: does a user own this specific resource?
 * Returns boolean (does NOT throw). Use for conditional logic.
 */
export async function isOwner(
  resourceType: ResourceType,
  resourceId: number | string,
  userId: number | string
): Promise<boolean> {
  try {
    await verifyOwnership(resourceType, resourceId, userId);
    return true;
  } catch {
    return false;
  }
}
