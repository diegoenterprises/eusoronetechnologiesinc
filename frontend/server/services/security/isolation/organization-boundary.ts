/**
 * ORGANIZATION BOUNDARY ENFORCEMENT
 * Ensures users can only access data within their own organization.
 * Prevents Carrier A from seeing Carrier B's fleet, drivers, or loads.
 *
 * L2 (Organization) data isolation — the company firewall.
 */

import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

/**
 * Verify that a user belongs to a specific organization.
 * Used before granting access to L2 (Organization) resources.
 */
export async function verifyOrganizationMembership(
  userId: number | string,
  organizationId: number | string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const uid = Number(userId);
  const oid = Number(organizationId);

  try {
    // Check users table for direct company assignment
    const rows = await db.execute(
      sql`SELECT 1 FROM users WHERE id = ${uid} AND company_id = ${oid} LIMIT 1`
    );
    const found = Array.isArray(rows) && rows.length > 0 &&
      (Array.isArray(rows[0]) ? rows[0].length > 0 : true);
    return found;
  } catch {
    return false;
  }
}

/**
 * Require organization membership — throws if user is not a member.
 */
export async function requireOrganizationMembership(
  userId: number | string,
  organizationId: number | string
): Promise<void> {
  const isMember = await verifyOrganizationMembership(userId, organizationId);
  if (!isMember) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resource not found",
    });
  }
}

/**
 * Get the organization ID for a user. Returns null if user has no org.
 */
export async function getUserOrganizationId(
  userId: number | string
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(
      sql`SELECT company_id AS companyId FROM users WHERE id = ${Number(userId)} LIMIT 1`
    );
    const row = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;
    return row?.companyId ? Number(row.companyId) : null;
  } catch {
    return null;
  }
}

/**
 * Build a SQL filter that restricts results to a user's organization.
 * Use in queries that fetch L2 organization-level data (fleet, drivers, etc.).
 *
 * @param companyColumn - The column name that holds the company/org ID
 * @param organizationId - The user's organization ID
 */
export function orgBoundaryFilter(
  companyColumn: string,
  organizationId: number | string | null
): ReturnType<typeof sql> {
  if (!organizationId) {
    // No org — return impossible condition (fail closed)
    return sql`1 = 0`;
  }
  return sql`${sql.raw(companyColumn)} = ${Number(organizationId)}`;
}

/**
 * Verify that two users belong to the same organization.
 * Used for intra-company operations (e.g., carrier assigning a driver).
 */
export async function verifySameOrganization(
  userId1: number | string,
  userId2: number | string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const rows = await db.execute(
      sql`SELECT u1.company_id FROM users u1, users u2 
          WHERE u1.id = ${Number(userId1)} AND u2.id = ${Number(userId2)} 
          AND u1.company_id IS NOT NULL AND u1.company_id = u2.company_id 
          LIMIT 1`
    );
    return Array.isArray(rows) && rows.length > 0 &&
      (Array.isArray(rows[0]) ? rows[0].length > 0 : true);
  } catch {
    return false;
  }
}

/**
 * Get all user IDs belonging to an organization.
 * Used for broadcast notifications within an org.
 */
export async function getOrganizationMembers(
  organizationId: number | string
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(
      sql`SELECT id FROM users WHERE company_id = ${Number(organizationId)} AND status != 'deleted'`
    );
    const results = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];
    return results.map((r: any) => Number(r.id)).filter((id: number) => !isNaN(id));
  } catch {
    return [];
  }
}

/**
 * Check if a user is an admin/owner of their organization.
 * Required for certain org-level operations (adding members, deleting vehicles, etc.).
 */
export async function isOrganizationAdmin(
  userId: number | string,
  organizationId: number | string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const rows = await db.execute(
      sql`SELECT role FROM users 
          WHERE id = ${Number(userId)} AND company_id = ${Number(organizationId)} 
          AND role IN ('CATALYST', 'ADMIN', 'SUPER_ADMIN')
          LIMIT 1`
    );
    return Array.isArray(rows) && rows.length > 0 &&
      (Array.isArray(rows[0]) ? rows[0].length > 0 : true);
  } catch {
    return false;
  }
}
