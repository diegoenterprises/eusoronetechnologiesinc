import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { recordAuditEvent, auditSecurity, AuditCategory, AuditAction } from "./auditService";
import { encrypt, decrypt, hashForIndex, maskSSN, maskCDL, maskBankAccount, maskEIN } from "./encryption";
import { sanitizeForStorage, sanitizeLogMessage } from "./pciCompliance";

// =============================================================================
// RBAC ROLE DEFINITIONS
// =============================================================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SHIPPER: 'SHIPPER',
  CATALYST: 'CATALYST',
  BROKER: 'BROKER',
  DRIVER: 'DRIVER',
  DISPATCH: 'DISPATCH',
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
    ROLES.ADMIN, ROLES.SHIPPER, ROLES.CATALYST, ROLES.BROKER,
    ROLES.DRIVER, ROLES.DISPATCH, ROLES.ESCORT, ROLES.TERMINAL_MANAGER,
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
export const catalystProcedure = roleProcedure(ROLES.CATALYST);
export const brokerProcedure = roleProcedure(ROLES.BROKER);
export const driverProcedure = roleProcedure(ROLES.DRIVER);
export const dispatchProcedure = roleProcedure(ROLES.DISPATCH);
export const escortProcedure = roleProcedure(ROLES.ESCORT);
export const terminalProcedure = roleProcedure(ROLES.TERMINAL_MANAGER);
export const complianceProcedure = roleProcedure(ROLES.COMPLIANCE_OFFICER);
export const safetyProcedure = roleProcedure(ROLES.SAFETY_MANAGER);

// Multi-role procedures for shared endpoints
export const shipperCatalystProcedure = roleProcedure(ROLES.SHIPPER, ROLES.CATALYST);
export const operationsProcedure = roleProcedure(ROLES.SHIPPER, ROLES.CATALYST, ROLES.BROKER, ROLES.DISPATCH);
export const complianceSafetyProcedure = roleProcedure(ROLES.COMPLIANCE_OFFICER, ROLES.SAFETY_MANAGER);

// =============================================================================
// SOC 2 AUTO-AUDIT MIDDLEWARE (CC6.2, CC6.3, CC7.1)
// Records every tRPC call automatically to the audit log.
// Mutations → DATA_WRITE, Queries → DATA_READ, Errors → API_ERROR
// =============================================================================

const autoAudit = t.middleware(async opts => {
  const { ctx, next, type, path } = opts;
  const startTime = Date.now();
  const userId = ctx.user ? String((ctx.user as any).id || "unknown") : null;

  try {
    const result = await next();
    const duration = Date.now() - startTime;

    // Record successful operation (non-blocking)
    recordAuditEvent({
      userId,
      action: type === "mutation" ? AuditAction.RECORD_UPDATED : AuditAction.RECORD_VIEWED,
      category: type === "mutation" ? AuditCategory.DATA_WRITE : AuditCategory.DATA_READ,
      entityType: path,
      metadata: {
        procedure: path,
        type,
        durationMs: duration,
        userRole: ctx.user?.role || "anonymous",
      },
      severity: "LOW",
    }, ctx.req).catch(() => {});

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Record failed operation
    recordAuditEvent({
      userId,
      action: AuditAction.API_ERROR,
      category: AuditCategory.SYSTEM,
      entityType: path,
      metadata: {
        procedure: path,
        type,
        durationMs: duration,
        errorCode: error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR",
        errorMessage: error instanceof Error ? error.message.slice(0, 200) : "Unknown error",
        userRole: ctx.user?.role || "anonymous",
      },
      severity: error instanceof TRPCError && error.code === "FORBIDDEN" ? "HIGH" : "MEDIUM",
    }, ctx.req).catch(() => {});

    throw error;
  }
});

// =============================================================================
// AUDITED PROCEDURES — Auto-logged variants of every procedure
// Use these in routers for SOC 2 compliant automatic audit trails.
// =============================================================================

export const auditedPublicProcedure = t.procedure.use(autoAudit);
export const auditedProtectedProcedure = t.procedure.use(requireUser).use(autoAudit);
export const auditedAdminProcedure = roleProcedure(ROLES.ADMIN, ROLES.SUPER_ADMIN).use(autoAudit);
export const auditedSuperAdminProcedure = roleProcedure(ROLES.SUPER_ADMIN).use(autoAudit);

// Audited role-specific procedures
export const auditedShipperProcedure = roleProcedure(ROLES.SHIPPER).use(autoAudit);
export const auditedCatalystProcedure = roleProcedure(ROLES.CATALYST).use(autoAudit);
export const auditedBrokerProcedure = roleProcedure(ROLES.BROKER).use(autoAudit);
export const auditedDriverProcedure = roleProcedure(ROLES.DRIVER).use(autoAudit);
export const auditedDispatchProcedure = roleProcedure(ROLES.DISPATCH).use(autoAudit);
export const auditedEscortProcedure = roleProcedure(ROLES.ESCORT).use(autoAudit);
export const auditedTerminalProcedure = roleProcedure(ROLES.TERMINAL_MANAGER).use(autoAudit);
export const auditedComplianceProcedure = roleProcedure(ROLES.COMPLIANCE_OFFICER).use(autoAudit);
export const auditedSafetyProcedure = roleProcedure(ROLES.SAFETY_MANAGER).use(autoAudit);
export const auditedOperationsProcedure = roleProcedure(ROLES.SHIPPER, ROLES.CATALYST, ROLES.BROKER, ROLES.DISPATCH).use(autoAudit);

// =============================================================================
// SENSITIVE DATA ENCRYPTION HELPERS
// Re-exported from encryption.ts for convenient use in routers.
// Routers should call these when handling SSN, CDL, bank accounts, EIN, etc.
// =============================================================================

export const sensitiveData = {
  encrypt,
  decrypt,
  hashForIndex,
  mask: { ssn: maskSSN, cdl: maskCDL, bankAccount: maskBankAccount, ein: maskEIN },
};

// PCI sanitization re-exports for routers
export const pci = {
  sanitizeForStorage,
  sanitizeLogMessage,
};
