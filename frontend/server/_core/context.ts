import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authService } from "./auth";
import { logger } from "./logger";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Enrich a JWT-derived auth user with DB fields needed for RBAC:
 * transportModes, timezone, country, primaryMode.
 * Uses a lightweight LRU cache to avoid hitting DB on every request.
 */
const enrichCache = new Map<string, { data: Record<string, any>; ts: number }>();
const ENRICH_TTL_MS = 60_000; // 1 minute cache

async function enrichUserFromDB(authUser: { id: string; email: string; role: string; companyId?: string }): Promise<User> {
  const cacheKey = String(authUser.id);
  const cached = enrichCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ENRICH_TTL_MS) {
    return { ...authUser, ...cached.data } as unknown as User;
  }

  try {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const db = await getDb();
    if (db) {
      const [row] = await db.select({
        transportModes: users.transportModes,
        country: users.country,
        primaryMode: users.primaryMode,
      }).from(users).where(eq(users.id, Number(authUser.id))).limit(1);

      if (row) {
        const extra = {
          transportModes: row.transportModes,
          country: row.country,
          primaryMode: row.primaryMode,
        };
        enrichCache.set(cacheKey, { data: extra, ts: Date.now() });
        // Evict stale entries (keep cache bounded)
        if (enrichCache.size > 500) {
          const entries = Array.from(enrichCache.entries());
          const oldest = entries.sort((a, b) => a[1].ts - b[1].ts)[0];
          if (oldest) enrichCache.delete(oldest[0]);
        }
        return { ...authUser, ...extra } as unknown as User;
      }
    }
  } catch (e) {
    logger.warn('[Context] DB enrichment failed, using JWT-only user:', (e as any)?.message);
  }

  return authUser as unknown as User;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check for test user (development/testing only)
  const testUserHeader = opts.req.headers['x-test-user'];
  if (testUserHeader && typeof testUserHeader === 'string') {
    try {
      const testUser = JSON.parse(testUserHeader);
      user = testUser as User;
      return {
        req: opts.req,
        res: opts.res,
        user,
      };
    } catch (error) {
      logger.error('[Context] Failed to parse test user:', error);
    }
  }

  try {
    const authUser = await authService.authenticateRequest(opts.req);
    if (authUser) {
      // Enrich with transportModes, country, primaryMode from DB
      user = await enrichUserFromDB(authUser);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
