/**
 * APPLICATION-LEVEL RLS CONTEXT MIDDLEWARE
 * Since EusoTrip uses MySQL (which lacks native PostgreSQL-style RLS),
 * this middleware enforces row-level security at the application layer.
 *
 * On every authenticated request:
 *   1. Extract verified user from JWT (never trust client IDs)
 *   2. Resolve scope context (userId, companyId, linkedCompanyIds)
 *   3. Attach isolation context to tRPC ctx for use in all procedures
 *   4. Log the request in the audit trail
 *
 * SECURITY MIDDLEWARE CHAIN ORDER (per Security Architecture):
 *   Rate Limiter → JWT Validator → RLS Context → RBAC → Audit Logger
 */

import { TRPCError } from "@trpc/server";
import { resolveScopeContext } from "../services/security/rbac/scope-resolver";
import type { ScopeContext } from "../services/security/rbac/scope-resolver";

export interface IsolationContext {
  /** Verified user ID from JWT — NEVER from client input */
  userId: number;
  /** User's role from verified JWT */
  role: string;
  /** User's email from verified JWT */
  email: string;
  /** User's company/organization ID */
  companyId: number | null;
  /** Resolved scope context with linked companies */
  scope: ScopeContext;
  /** Whether MFA has been verified for this session */
  mfaVerified: boolean;
  /** Session ID for tracking */
  sessionId: string | null;
  /** Client IP for audit logging */
  clientIp: string;
}

/**
 * Build the isolation context from an authenticated tRPC context.
 * This is called by the RLS middleware on every authenticated request.
 */
export async function buildIsolationContext(
  user: { id: string | number; role: string; email: string; companyId?: string | number | null },
  req: any
): Promise<IsolationContext> {
  const userId = Number(user.id);
  if (isNaN(userId)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid user identity" });
  }

  const companyId = user.companyId ? Number(user.companyId) : null;

  // Resolve full scope context (includes linked companies from active loads)
  const scope = await resolveScopeContext(userId, user.role, companyId);

  // Extract client IP (handles proxies)
  const clientIp = getClientIp(req);

  return {
    userId,
    role: user.role,
    email: user.email,
    companyId,
    scope,
    mfaVerified: false, // Set by MFA middleware if applicable
    sessionId: null,     // Set by session middleware if applicable
    clientIp,
  };
}

/**
 * Extract the real client IP from the request, accounting for proxies.
 */
function getClientIp(req: any): string {
  if (!req) return "unknown";

  // Azure App Service sets X-Forwarded-For
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    const first = typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded[0];
    return first?.trim() || "unknown";
  }

  // Direct connection
  return req.socket?.remoteAddress || req.ip || "unknown";
}

/**
 * Validate that the isolation context is present and valid.
 * Use this as a guard in procedures that require isolation.
 */
export function requireIsolationContext(ctx: any): IsolationContext {
  if (!ctx.isolation) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Isolation context not initialized — security middleware chain error",
    });
  }
  return ctx.isolation as IsolationContext;
}
