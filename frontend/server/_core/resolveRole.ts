/**
 * Resolve the effective user role from the database.
 * Handles stale JWT tokens by doing a DB lookup as fallback.
 */
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function resolveUserRole(ctxUser: any): Promise<string> {
  const tokenRole = ctxUser?.role || "SHIPPER";

  // If the JWT already says admin, trust it
  if (ADMIN_ROLES.includes(tokenRole)) return tokenRole;

  // JWT says non-admin — double-check the DB in case the token is stale
  const email = ctxUser?.email;
  if (!email) return tokenRole;

  try {
    const db = await getDb();
    if (!db) return tokenRole;
    const [row] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (row?.role && ADMIN_ROLES.includes(row.role)) {
      console.log(`[resolveRole] JWT role=${tokenRole} but DB role=${row.role} for ${email} — using DB role`);
      return row.role;
    }
  } catch (err) {
    console.warn("[resolveRole] DB lookup failed, using JWT role:", err);
  }

  return tokenRole;
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}
