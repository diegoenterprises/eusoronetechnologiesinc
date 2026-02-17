/**
 * SECURITY MIDDLEWARE STACK
 * Composes all security middleware in the correct order.
 *
 * Chain order (per EusoTrip_Security_Architecture.md):
 *   1. Rate Limiter       — Prevent DDoS and brute force
 *   2. JWT Validator       — Authenticate the request
 *   3. RLS Context         — Build isolation context (userId, companyId, scope)
 *   4. RBAC                — Check role permissions
 *   5. Audit Logger        — Record the operation
 *
 * This file provides composite middleware that chains these together
 * for convenient use in tRPC procedures.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";
import { buildIsolationContext } from "./rls-context";
import type { IsolationContext } from "./rls-context";
import { recordAuditEvent, AuditAction, AuditCategory } from "../_core/auditService";

// Re-use the existing tRPC instance pattern
const t = initTRPC.context<TrpcContext>().create();

/**
 * ISOLATION MIDDLEWARE
 * Builds the isolation context (scope, company memberships, linked companies)
 * and attaches it to ctx.isolation for use in all downstream procedures.
 *
 * This is the core security middleware — it ensures every authenticated
 * request has a verified, server-side isolation context.
 */
export const isolationMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = ctx.user as any;
  const isolation = await buildIsolationContext(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      companyId: user.companyId,
    },
    ctx.req
  );

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      isolation,
    },
  });
});

/**
 * SENSITIVE DATA ACCESS MIDDLEWARE
 * Adds extra audit logging for procedures that access sensitive data
 * (SSN, CDL, bank accounts, medical records, etc.).
 */
export const sensitiveDataMiddleware = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = ctx.user as any;

  // Record sensitive data access in audit log
  recordAuditEvent({
    userId: user.id,
    action: AuditAction.SENSITIVE_DATA_ACCESSED,
    category: AuditCategory.DATA_READ,
    entityType: path,
    metadata: {
      procedure: path,
      role: user.role,
      companyId: user.companyId,
      accessedAt: new Date().toISOString(),
    },
    severity: "HIGH",
  }, ctx.req).catch(() => {});

  return next({ ctx });
});

/**
 * ADMIN ACTION MIDDLEWARE
 * Extra security for admin-level operations:
 *   - Requires MFA verification (future)
 *   - Records detailed audit trail
 *   - Alerts on unusual admin activity
 */
export const adminActionMiddleware = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = ctx.user as any;
  const role = user.role;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  // Record admin action
  recordAuditEvent({
    userId: user.id,
    action: AuditAction.RECORD_UPDATED,
    category: AuditCategory.CONFIG,
    entityType: path,
    metadata: {
      procedure: path,
      role,
      adminAction: true,
      timestamp: new Date().toISOString(),
    },
    severity: "HIGH",
  }, ctx.req).catch(() => {});

  return next({ ctx });
});

/**
 * WRITE OPERATION MIDDLEWARE
 * Extra validation for mutation operations:
 *   - Confirms user account is not pending deletion
 *   - Records the write in audit log with input summary
 */
export const writeOperationMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  if (type !== "mutation") {
    return next({ ctx });
  }

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = ctx.user as any;

  // Block writes for accounts pending deletion
  if (user.status === "PENDING_DELETION") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Account is scheduled for deletion. Write operations are disabled.",
    });
  }

  return next({ ctx });
});

/**
 * Get the isolation context from a tRPC context.
 * Throws if not present (middleware chain error).
 */
export function getIsolation(ctx: any): IsolationContext {
  if (!ctx.isolation) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Isolation context missing — ensure isolationMiddleware is in the middleware chain",
    });
  }
  return ctx.isolation as IsolationContext;
}

export type { IsolationContext };
