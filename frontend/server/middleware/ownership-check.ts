/**
 * OWNERSHIP CHECK MIDDLEWARE
 * tRPC middleware that enforces ownership verification on resource access.
 *
 * This middleware sits in the security chain AFTER auth and RLS context,
 * providing automatic ownership verification for any procedure that
 * accesses a resource by ID.
 *
 * CRITICAL RULES (from EUSOTRIP_DATA_ISOLATION_ARCHITECTURE.md):
 *   1. NEVER trust client-provided user IDs
 *   2. Return NOT_FOUND (not FORBIDDEN) for unauthorized access
 *   3. Every query for user data MUST include ownership filter
 */

import { TRPCError } from "@trpc/server";
import { verifyOwnership } from "../services/security/isolation/ownership-verifier";
import type { ResourceType } from "../services/security/isolation/ownership-verifier";
import { requireAccess } from "../services/security/rbac/access-check";
import type { Action, Resource } from "../services/security/rbac/permissions";
import { recordAuditEvent, AuditAction, AuditCategory } from "../_core/auditService";

/**
 * Create a middleware function that verifies resource ownership.
 * Use in tRPC procedures that access a specific resource by ID.
 *
 * Usage:
 *   .use(ownershipMiddleware("wallet"))
 *   .input(z.object({ walletId: z.number() }))
 *   .query(async ({ ctx, input }) => {
 *     // At this point, ownership is already verified
 *     return getWallet(input.walletId);
 *   });
 */
export function createOwnershipCheck(
  resourceType: ResourceType,
  inputIdField: string = "id"
) {
  return async function ownershipCheck(opts: {
    ctx: any;
    next: (opts?: any) => Promise<any>;
    input: any;
    rawInput: any;
  }) {
    const { ctx, next, rawInput } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userId = ctx.user.id;
    const companyId = ctx.user.companyId || null;
    const resourceId = (rawInput as any)?.[inputIdField];

    if (resourceId) {
      try {
        await verifyOwnership(resourceType, resourceId, userId, companyId);
      } catch (err) {
        // Audit the failed access attempt
        recordAuditEvent({
          userId,
          action: AuditAction.UNAUTHORIZED_ACCESS,
          category: AuditCategory.SECURITY,
          entityType: resourceType,
          entityId: String(resourceId),
          metadata: {
            inputField: inputIdField,
            resourceType,
            role: ctx.user.role,
          },
          severity: "HIGH",
        }, ctx.req).catch(() => {});

        // Re-throw as NOT_FOUND to prevent existence leakage
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `${resourceType} not found`,
        });
      }
    }

    return next({ ctx });
  };
}

/**
 * Combined RBAC + Ownership check middleware.
 * Verifies both that the user has the right role/permission AND owns the resource.
 *
 * Usage:
 *   .use(rbacOwnershipCheck("READ", "WALLET", "wallet", "walletId"))
 */
export function createRbacOwnershipCheck(
  action: Action,
  resource: Resource,
  resourceType: ResourceType,
  inputIdField: string = "id"
) {
  return async function rbacOwnershipCheck(opts: {
    ctx: any;
    next: (opts?: any) => Promise<any>;
    input: any;
    rawInput: any;
  }) {
    const { ctx, next, rawInput } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userId = ctx.user.id;
    const role = ctx.user.role;
    const companyId = ctx.user.companyId || null;
    const resourceId = (rawInput as any)?.[inputIdField];

    // 1. RBAC permission check
    await requireAccess({
      userId,
      role,
      companyId,
      action,
      resource,
    }, ctx.req);

    // 2. Ownership verification (if resource ID is provided)
    if (resourceId) {
      try {
        await verifyOwnership(resourceType, resourceId, userId, companyId);
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `${resourceType} not found`,
        });
      }
    }

    return next({ ctx });
  };
}

/**
 * Middleware that strips any client-provided userId from input.
 * Forces all queries to use the verified session user ID instead.
 *
 * This is a critical IDOR prevention measure.
 */
export function stripClientUserId() {
  return async function stripUserId(opts: {
    ctx: any;
    next: (opts?: any) => Promise<any>;
    input: any;
    rawInput: any;
  }) {
    const { ctx, next, rawInput } = opts;

    if (rawInput && typeof rawInput === "object") {
      // Remove any client-provided userId fields
      const sanitized = { ...rawInput };
      delete sanitized.userId;
      delete sanitized.user_id;
      delete sanitized.ownerId;
      delete sanitized.owner_id;

      return next({
        ctx,
        rawInput: sanitized,
      });
    }

    return next({ ctx });
  };
}
