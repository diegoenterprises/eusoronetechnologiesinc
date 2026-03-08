/**
 * RBAC ADMIN ROUTER (Task 3.2.3: Multi-tenant RBAC Enhancements)
 * ═══════════════════════════════════════════════════════════════
 * Admin-facing procedures for managing and auditing RBAC:
 *   - View permissions for any role
 *   - Check access for a user/role/resource combo
 *   - List all roles and their permission counts
 *   - Audit access denials from audit log
 *   - Get effective permissions for a specific user (role + scope)
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, desc, sql, gte } from "drizzle-orm";
import {
  getPermissionsForRole,
  hasPermission,
  getAccessibleResources,
  checkAccess,
  ROLE_PERMISSIONS,
} from "../services/security/rbac";
import type { Action, Resource } from "../services/security/rbac";

const ALL_ROLES = [
  "DRIVER", "ESCORT", "CATALYST", "SHIPPER", "BROKER",
  "DISPATCH", "TERMINAL_MANAGER", "COMPLIANCE_OFFICER",
  "SAFETY_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN",
] as const;

export const rbacAdminRouter = router({
  /**
   * List all roles with permission counts and scope summary.
   */
  listRoles: protectedProcedure.query(() => {
    return ALL_ROLES.map(role => {
      const perms = getPermissionsForRole(role);
      const scopes = new Set(perms.map(p => p.scope));
      const resources = new Set(perms.map(p => p.resource));
      return {
        role,
        permissionCount: perms.length,
        scopes: Array.from(scopes),
        resourceCount: resources.size,
        tier: role === "SUPER_ADMIN" ? 6 : role === "ADMIN" ? 5
          : ["TERMINAL_MANAGER", "COMPLIANCE_OFFICER", "SAFETY_MANAGER"].includes(role) ? 4
          : ["CATALYST", "SHIPPER", "BROKER", "DISPATCH", "FACTORING"].includes(role) ? 3 : 2,
      };
    });
  }),

  /**
   * Get full permission matrix for a specific role.
   */
  getRolePermissions: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(({ input }) => {
      const perms = getPermissionsForRole(input.role);
      // Group by resource
      const grouped: Record<string, { actions: string[]; scope: string }[]> = {};
      for (const p of perms) {
        if (!grouped[p.resource]) grouped[p.resource] = [];
        grouped[p.resource].push({ actions: [p.action], scope: p.scope });
      }
      return {
        role: input.role,
        total: perms.length,
        permissions: perms,
        byResource: Object.entries(grouped).map(([resource, entries]) => ({
          resource,
          permissions: entries,
        })),
      };
    }),

  /**
   * Check if a specific role can perform an action on a resource.
   */
  checkPermission: protectedProcedure
    .input(z.object({
      role: z.string(),
      action: z.string(),
      resource: z.string(),
    }))
    .query(({ input }) => {
      const allowed = hasPermission(input.role, input.action as Action, input.resource as Resource);
      const perms = getPermissionsForRole(input.role)
        .filter(p => p.action === input.action && p.resource === input.resource);
      return {
        allowed,
        matchedPermissions: perms,
        role: input.role,
        action: input.action,
        resource: input.resource,
      };
    }),

  /**
   * Simulate an access check for a given user context.
   */
  simulateAccess: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.string(),
      companyId: z.number().optional(),
      action: z.string(),
      resource: z.string(),
      targetOwnerId: z.number().optional(),
      targetCompanyId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const result = await checkAccess({
        userId: input.userId,
        role: input.role,
        companyId: input.companyId,
        action: input.action as Action,
        resource: input.resource as Resource,
        targetOwnerId: input.targetOwnerId,
        targetCompanyId: input.targetCompanyId,
      });
      return {
        ...result,
        input: {
          userId: input.userId,
          role: input.role,
          companyId: input.companyId,
          action: input.action,
          resource: input.resource,
          targetOwnerId: input.targetOwnerId,
          targetCompanyId: input.targetCompanyId,
        },
      };
    }),

  /**
   * Get effective permissions for a specific user (resolves their role).
   */
  getUserPermissions: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { userId: input.userId, role: null, permissions: [], resourceCount: 0 };
      const [user] = await db.select({ role: users.role, companyId: users.companyId, name: users.name })
        .from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) return { userId: input.userId, role: null, permissions: [], resourceCount: 0 };
      const perms = getPermissionsForRole(user.role || "");
      return {
        userId: input.userId,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        permissions: perms,
        resourceCount: new Set(perms.map(p => p.resource)).size,
      };
    }),

  /**
   * Get recent access denial audit events.
   */
  getAccessDenials: protectedProcedure
    .input(z.object({ limit: z.number().default(50), lookbackHours: z.number().default(24) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const since = new Date(Date.now() - (input?.lookbackHours || 24) * 3600000);
        const rows = await db.execute(
          sql`SELECT user_id, action, entity_type, metadata, severity, created_at
              FROM audit_log
              WHERE action = 'PERMISSION_DENIED'
                AND created_at >= ${since}
              ORDER BY created_at DESC
              LIMIT ${input?.limit || 50}`
        );
        const results = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];
        return (results as any[]).map((r: any) => ({
          userId: r.user_id,
          action: r.action,
          entityType: r.entity_type,
          metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
          severity: r.severity,
          createdAt: r.created_at,
        }));
      } catch {
        return [];
      }
    }),

  /**
   * Role comparison — side-by-side permission diff between two roles.
   */
  compareRoles: protectedProcedure
    .input(z.object({ roleA: z.string(), roleB: z.string() }))
    .query(({ input }) => {
      const permsA = getPermissionsForRole(input.roleA);
      const permsB = getPermissionsForRole(input.roleB);
      const keyA = new Set(permsA.map(p => `${p.action}:${p.resource}:${p.scope}`));
      const keyB = new Set(permsB.map(p => `${p.action}:${p.resource}:${p.scope}`));

      const onlyA = permsA.filter(p => !keyB.has(`${p.action}:${p.resource}:${p.scope}`));
      const onlyB = permsB.filter(p => !keyA.has(`${p.action}:${p.resource}:${p.scope}`));
      const shared = permsA.filter(p => keyB.has(`${p.action}:${p.resource}:${p.scope}`));

      return {
        roleA: input.roleA,
        roleB: input.roleB,
        shared: shared.length,
        onlyInA: onlyA,
        onlyInB: onlyB,
        totalA: permsA.length,
        totalB: permsB.length,
      };
    }),
});
