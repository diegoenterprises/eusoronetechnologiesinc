/**
 * ACCESS CHECK SERVICE
 * The central authorization engine. Combines RBAC permissions with scope
 * resolution to determine if a user can perform an action on a resource.
 *
 * This is the runtime enforcement layer called by tRPC middleware.
 */

import { TRPCError } from "@trpc/server";
import type { Action, Resource, Scope } from "./permissions";
import { ROLE_PERMISSIONS } from "./role-permission-map";
import { resolveScopeContext, isWithinScope } from "./scope-resolver";
import type { ScopeContext } from "./scope-resolver";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../../_core/auditService";

export interface AccessCheckInput {
  userId: number | string;
  role: string;
  companyId?: number | string | null;
  action: Action;
  resource: Resource;
  targetOwnerId?: number | string | null;
  targetCompanyId?: number | string | null;
}

export interface AccessCheckResult {
  allowed: boolean;
  matchedScope: Scope | null;
  reason: string;
}

/**
 * Check if a user has permission to perform an action on a resource.
 * Returns a detailed result with the matched scope and reason.
 *
 * Does NOT throw — returns { allowed: false } for denied access.
 * Use `requireAccess()` for middleware that should throw on denial.
 */
export async function checkAccess(input: AccessCheckInput): Promise<AccessCheckResult> {
  const { userId, role, companyId, action, resource, targetOwnerId, targetCompanyId } = input;
  const uid = Number(userId);

  // 1. Look up all permissions for this role
  const rolePerms = (ROLE_PERMISSIONS as any)[role];
  if (!rolePerms) {
    return { allowed: false, matchedScope: null, reason: `Unknown role: ${role}` };
  }

  // 2. Find matching permissions (same action + resource)
  const matching = (rolePerms as Array<{ action: Action; resource: Resource; scope: Scope }>)
    .filter(p => p.action === action && p.resource === resource);

  if (matching.length === 0) {
    return {
      allowed: false,
      matchedScope: null,
      reason: `${role} does not have ${action} permission on ${resource}`,
    };
  }

  // 3. When NO target IDs are supplied the caller is using requireAccess as
  //    a permission gate ("does this role have action+resource?").
  //    Instance-level data isolation is enforced by the RLS / isolation
  //    middleware, so we grant access if the permission exists at any scope.
  //    When target IDs ARE supplied we do the full scope check.
  const hasTarget = targetOwnerId != null || targetCompanyId != null;

  if (!hasTarget) {
    // Permission exists (matching.length > 0) — grant at the widest scope found
    const widest = matching[0];
    return { allowed: true, matchedScope: widest.scope, reason: "Access granted (permission gate)" };
  }

  // 4. Full scope check — target IDs provided
  const scopeCtx = await resolveScopeContext(uid, role, companyId);
  const tOwnerId = targetOwnerId ? Number(targetOwnerId) : null;
  const tCompanyId = targetCompanyId ? Number(targetCompanyId) : null;

  for (const perm of matching) {
    if (isWithinScope(perm.scope, scopeCtx, tOwnerId, tCompanyId)) {
      return { allowed: true, matchedScope: perm.scope, reason: "Access granted" };
    }
  }

  return {
    allowed: false,
    matchedScope: null,
    reason: `${role} has ${action} on ${resource} but target is outside scope`,
  };
}

/**
 * Require access — throws FORBIDDEN if denied.
 * Use this in tRPC procedures for inline permission checks.
 *
 * Usage:
 *   await requireAccess({
 *     userId: ctx.user.id,
 *     role: ctx.user.role,
 *     companyId: ctx.user.companyId,
 *     action: "READ",
 *     resource: "LOAD",
 *     targetOwnerId: load.shipperId,
 *     targetCompanyId: load.shipperCompanyId,
 *   });
 */
export async function requireAccess(
  input: AccessCheckInput,
  req?: any
): Promise<void> {
  const result = await checkAccess(input);

  if (!result.allowed) {
    // Audit the denied access attempt (non-blocking)
    recordAuditEvent({
      userId: input.userId,
      action: AuditAction.PERMISSION_DENIED,
      category: AuditCategory.ACCESS,
      entityType: String(input.resource),
      metadata: {
        attemptedAction: input.action,
        resource: input.resource,
        role: input.role,
        reason: result.reason,
        targetOwnerId: input.targetOwnerId,
        targetCompanyId: input.targetCompanyId,
      },
      severity: "HIGH",
    }, req).catch(() => {});

    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied: ${result.reason}`,
    });
  }
}

/**
 * Quick boolean check — does this role have this permission at any scope?
 * Use for UI feature flags (e.g., show/hide buttons based on role).
 */
export function hasPermission(role: string, action: Action, resource: Resource): boolean {
  const rolePerms = (ROLE_PERMISSIONS as any)[role];
  if (!rolePerms) return false;
  return (rolePerms as Array<{ action: Action; resource: Resource; scope: Scope }>)
    .some(p => p.action === action && p.resource === resource);
}

/**
 * Get all permissions for a role (for sending to frontend).
 */
export function getPermissionsForRole(role: string): Array<{ action: Action; resource: Resource; scope: Scope }> {
  return (ROLE_PERMISSIONS as any)[role] || [];
}

/**
 * Get all resources a role can access with a specific action.
 */
export function getAccessibleResources(role: string, action: Action): Resource[] {
  const rolePerms = (ROLE_PERMISSIONS as any)[role];
  if (!rolePerms) return [];
  return Array.from(new Set(
    (rolePerms as Array<{ action: Action; resource: Resource; scope: Scope }>)
      .filter(p => p.action === action)
      .map(p => p.resource)
  ));
}
