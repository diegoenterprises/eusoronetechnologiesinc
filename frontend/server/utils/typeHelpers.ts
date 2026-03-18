/**
 * TYPE SAFETY HELPERS — Replace `as any` casts throughout the codebase
 *
 * BEFORE: const userId = (ctx.user as any)?.id;
 * AFTER:  const userId = getUserId(ctx);
 *
 * BEFORE: const pickup = l.pickupLocation as any || {};
 * AFTER:  const pickup = parseLocation(l.pickupLocation);
 *
 * BEFORE: const id = (result as any).insertId;
 * AFTER:  const id = getInsertId(result);
 */
import { TRPCError } from '@trpc/server';

/** Extract authenticated user ID (number) or throw UNAUTHORIZED */
export function getUserId(ctx: { user?: any }): number {
  const id = ctx.user?.id;
  if (id === undefined || id === null) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return typeof id === 'string' ? parseInt(id, 10) : Number(id);
}

/** Extract authenticated user role or throw */
export function getUserRole(ctx: { user?: any }): string {
  const role = ctx.user?.role;
  if (!role) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User role not found' });
  return String(role);
}

/** Extract company ID (nullable — not all users have a company) */
export function getCompanyId(ctx: { user?: any }): number | null {
  const id = ctx.user?.companyId;
  if (id === undefined || id === null) return null;
  return typeof id === 'string' ? parseInt(id, 10) : Number(id);
}

/** Safely parse JSON location column into typed object */
export function parseLocation(loc: unknown): { city?: string; state?: string; lat?: number; lng?: number; zipCode?: string } {
  if (!loc || typeof loc !== 'object') return {};
  const l = loc as Record<string, any>;
  return {
    city: typeof l.city === 'string' ? l.city : undefined,
    state: typeof l.state === 'string' ? l.state : undefined,
    lat: typeof l.lat === 'number' ? l.lat : typeof l.latitude === 'number' ? l.latitude : undefined,
    lng: typeof l.lng === 'number' ? l.lng : typeof l.longitude === 'number' ? l.longitude : undefined,
    zipCode: typeof l.zipCode === 'string' ? l.zipCode : typeof l.zip === 'string' ? l.zip : undefined,
  };
}

/** Extract insert ID from Drizzle MySQL result */
export function getInsertId(result: unknown): number {
  if (Array.isArray(result) && result[0]?.insertId != null) return Number(result[0].insertId);
  if (result && typeof result === 'object' && 'insertId' in result) return Number((result as any).insertId);
  return 0;
}

/** Safe number conversion from decimal/string DB column */
export function toNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') { const n = Number(val); return isNaN(n) ? fallback : n; }
  return fallback;
}

/** Safe boolean from DB (MySQL returns 0/1 for booleans) */
export function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 1 || val === '1' || val === 'true') return true;
  return false;
}
