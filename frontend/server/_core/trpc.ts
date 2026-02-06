import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { auditSecurity, AuditAction } from "./auditService";

// =============================================================================
// RBAC ROLE DEFINITIONS
// =============================================================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SHIPPER: 'SHIPPER',
  CARRIER: 'CARRIER',
  BROKER: 'BROKER',
  DRIVER: 'DRIVER',
  CATALYST: 'CATALYST',
  ESCORT: 'ESCORT',
  TERMINAL_MANAGER: 'TERMINAL_MANAGER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  SAFETY_MANAGER: 'SAFETY_MANAGER',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role hierarchy: higher roles inherit access from lower roles
const ROLE_HIERARCHY: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(ROLES),
  ADMIN: [
    ROLES.ADMIN, ROLES.SHIPPER, ROLES.CARRIER, ROLES.BROKER,
    ROLES.DRIVER, ROLES.CATALYST, ROLES.ESCORT, ROLES.TERMINAL_MANAGER,
    ROLES.COMPLIANCE_OFFICER, ROLES.SAFETY_MANAGER,
  ],
};

/**
 * Check if a user role has access to a required role.
 * SUPER_ADMIN and ADMIN have hierarchical access.
 */
function hasRoleAccess(userRole: string, requiredRoles: string[]): boolean {
  // Direct match
  if (requiredRoles.includes(userRole)) return true;
  // Hierarchy match
  const inherited = ROLE_HIERARCHY[userRole];
  if (inherited) {
    return requiredRoles.some(r => inherited.includes(r));
  }
  return false;
}

// =============================================================================
// tRPC INITIALIZATION
// =============================================================================

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// =============================================================================
// BASE AUTH MIDDLEWARE
// =============================================================================

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// =============================================================================
// ROLE-BASED PROCEDURES (RBAC)
// =============================================================================

/**
 * Factory: Create a procedure restricted to specific roles.
 * SUPER_ADMIN and ADMIN always have access via hierarchy.
 */
export function roleProcedure(...allowedRoles: string[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }

      if (!hasRoleAccess(ctx.user.role, allowedRoles)) {
        // Audit the RBAC violation
        auditSecurity(
          AuditAction.RBAC_VIOLATION,
          "rbac",
          {
            userId: (ctx.user as any).id,
            userRole: ctx.user.role,
            requiredRoles: allowedRoles,
            path: (ctx as any).path || "unknown",
          },
          ctx.req
        ).catch(() => {});

        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
        });
      }

      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    })
  );
}

// Pre-built role procedures for each user type
export const adminProcedure = roleProcedure(ROLES.ADMIN, ROLES.SUPER_ADMIN);
export const superAdminProcedure = roleProcedure(ROLES.SUPER_ADMIN);
export const shipperProcedure = roleProcedure(ROLES.SHIPPER);
export const carrierProcedure = roleProcedure(ROLES.CARRIER);
export const brokerProcedure = roleProcedure(ROLES.BROKER);
export const driverProcedure = roleProcedure(ROLES.DRIVER);
export const catalystProcedure = roleProcedure(ROLES.CATALYST);
export const escortProcedure = roleProcedure(ROLES.ESCORT);
export const terminalProcedure = roleProcedure(ROLES.TERMINAL_MANAGER);
export const complianceProcedure = roleProcedure(ROLES.COMPLIANCE_OFFICER);
export const safetyProcedure = roleProcedure(ROLES.SAFETY_MANAGER);

// Multi-role procedures for shared endpoints
export const shipperCarrierProcedure = roleProcedure(ROLES.SHIPPER, ROLES.CARRIER);
export const operationsProcedure = roleProcedure(ROLES.SHIPPER, ROLES.CARRIER, ROLES.BROKER, ROLES.CATALYST);
export const complianceSafetyProcedure = roleProcedure(ROLES.COMPLIANCE_OFFICER, ROLES.SAFETY_MANAGER);
