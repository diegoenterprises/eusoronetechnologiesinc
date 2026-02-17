/**
 * SCOPE RESOLVER
 * Determines the effective scope of a user's permission check by resolving
 * OWN → COMPANY → LINKED → PLATFORM/SYSTEM relationships.
 *
 * The scope tells us WHOSE data the user can access:
 *   OWN:      Only data where ownerUserId === currentUser.id
 *   COMPANY:  Data belonging to anyone in currentUser.companyId
 *   LINKED:   Data from companies that have a business relationship
 *   PLATFORM: All data (admin-level access)
 *   SYSTEM:   System configuration data (super admin only)
 */

import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import type { Scope } from "./permissions";

export interface ScopeContext {
  userId: number;
  companyId: number | null;
  role: string;
  linkedCompanyIds: number[];
}

/**
 * Resolve the full scope context for a user.
 * This is called once per request and cached in the tRPC context.
 */
export async function resolveScopeContext(
  userId: number | string,
  role: string,
  companyId?: number | string | null
): Promise<ScopeContext> {
  const uid = Number(userId);
  const cid = companyId ? Number(companyId) : null;

  // For admin/super admin, linked companies aren't needed (they have PLATFORM scope)
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return { userId: uid, companyId: cid, role, linkedCompanyIds: [] };
  }

  // Resolve linked companies from active loads/agreements
  const linked = cid ? await resolveLinkedCompanies(uid, cid) : [];

  return { userId: uid, companyId: cid, role, linkedCompanyIds: linked };
}

/**
 * Check if a target resource falls within a user's scope.
 *
 * @param scope - The permission scope to check against
 * @param ctx - The user's scope context
 * @param targetOwnerId - The user ID of the resource's owner
 * @param targetCompanyId - The company ID that owns the resource
 */
export function isWithinScope(
  scope: Scope,
  ctx: ScopeContext,
  targetOwnerId?: number | null,
  targetCompanyId?: number | null
): boolean {
  switch (scope) {
    case "OWN":
      return targetOwnerId === ctx.userId;

    case "COMPANY":
      if (targetOwnerId === ctx.userId) return true;
      return ctx.companyId !== null && targetCompanyId === ctx.companyId;

    case "LINKED":
      if (targetOwnerId != null && targetOwnerId === ctx.userId) return true;
      if (ctx.companyId !== null && targetCompanyId != null && targetCompanyId === ctx.companyId) return true;
      return targetCompanyId != null && ctx.linkedCompanyIds.includes(targetCompanyId);

    case "PLATFORM":
      return ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";

    case "SYSTEM":
      return ctx.role === "SUPER_ADMIN";

    default:
      return false;
  }
}

/**
 * Build a SQL WHERE clause that enforces the given scope.
 * Use this in Drizzle queries to automatically filter by scope.
 *
 * @param scope - Permission scope
 * @param ctx - User's scope context
 * @param ownerColumn - DB column holding the owner user ID
 * @param companyColumn - DB column holding the company ID (optional)
 */
export function scopeFilter(
  scope: Scope,
  ctx: ScopeContext,
  ownerColumn: string,
  companyColumn?: string
): ReturnType<typeof sql> {
  switch (scope) {
    case "OWN":
      return sql`${sql.raw(ownerColumn)} = ${ctx.userId}`;

    case "COMPANY":
      if (ctx.companyId && companyColumn) {
        return sql`(${sql.raw(ownerColumn)} = ${ctx.userId} OR ${sql.raw(companyColumn)} = ${ctx.companyId})`;
      }
      return sql`${sql.raw(ownerColumn)} = ${ctx.userId}`;

    case "LINKED":
      if (ctx.linkedCompanyIds.length > 0 && companyColumn) {
        const linkedIds = ctx.linkedCompanyIds.join(",");
        if (ctx.companyId) {
          return sql`(${sql.raw(ownerColumn)} = ${ctx.userId} OR ${sql.raw(companyColumn)} = ${ctx.companyId} OR ${sql.raw(companyColumn)} IN (${sql.raw(linkedIds)}))`;
        }
        return sql`(${sql.raw(ownerColumn)} = ${ctx.userId} OR ${sql.raw(companyColumn)} IN (${sql.raw(linkedIds)}))`;
      }
      if (ctx.companyId && companyColumn) {
        return sql`(${sql.raw(ownerColumn)} = ${ctx.userId} OR ${sql.raw(companyColumn)} = ${ctx.companyId})`;
      }
      return sql`${sql.raw(ownerColumn)} = ${ctx.userId}`;

    case "PLATFORM":
    case "SYSTEM":
      return sql`1 = 1`;

    default:
      return sql`1 = 0`;
  }
}

// ─── Internal ───────────────────────────────────────────────────────────────

/**
 * Find all company IDs that have a business relationship with the user's company.
 * A relationship exists if there are active loads between the two companies.
 */
async function resolveLinkedCompanies(
  userId: number,
  companyId: number
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find companies that share active loads with this user's company
    const rows = await db.execute(
      sql`SELECT DISTINCT 
            CASE 
              WHEN shipper_company_id = ${companyId} THEN carrier_company_id
              WHEN carrier_company_id = ${companyId} THEN shipper_company_id
            END AS linkedCompanyId
          FROM loads
          WHERE (shipper_company_id = ${companyId} OR carrier_company_id = ${companyId})
            AND status NOT IN ('cancelled', 'deleted')
          HAVING linkedCompanyId IS NOT NULL
          LIMIT 100`
    );

    const results = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];
    return results
      .map((r: any) => Number(r.linkedCompanyId))
      .filter((id: number) => !isNaN(id) && id !== companyId);
  } catch {
    return [];
  }
}
