/**
 * AUTH SERVICE
 * JWT-based authentication service for EusoTrip
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// Rate limiter — 10 attempts per 15 minutes per email
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkLoginRateLimit(email: string): void {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const maxAttempts = 10;

  const record = loginAttempts.get(email);
  if (record) {
    if (now - record.firstAttempt > window) {
      loginAttempts.set(email, { count: 1, firstAttempt: now });
    } else if (record.count >= maxAttempts) {
      const minutesLeft = Math.ceil((record.firstAttempt + window - now) / 60000);
      throw new Error(`Too many login attempts. Try again in ${minutesLeft} minutes.`);
    } else {
      record.count++;
    }
  } else {
    loginAttempts.set(email, { count: 1, firstAttempt: now });
  }

  // Cleanup old entries periodically
  if (loginAttempts.size > 1000) {
    for (const [key, val] of loginAttempts) {
      if (now - val.firstAttempt > window) loginAttempts.delete(key);
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "eusotrip-dev-secret-key-change-in-production");
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}
const TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
}

interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  companyId?: string;
}

export const authService = {
  /**
   * Create a session token for a user
   */
  createSessionToken(user: AuthUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  },

  /**
   * Verify a session token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Authenticate a request using Bearer token
   */
  async authenticateRequest(req: Request): Promise<AuthUser | null> {
    // 1. Check session cookie first (set by login mutation)
    const cookieToken = req.cookies?.[COOKIE_NAME];
    if (cookieToken) {
      const payload = this.verifyToken(cookieToken);
      if (payload) {
        return {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
        };
      }
    }

    // 2. Fall back to Bearer token header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = this.verifyToken(token);
      if (payload) {
        return {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
        };
      }
    }

    return null;
  },

  /**
   * Login with credentials (for development/testing)
   */
  async loginWithCredentials(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    // Rate limit check — block brute-force attempts
    checkLoginRateLimit(email);

    // Test accounts available in all environments (password-protected)
    const testUsers: Record<string, AuthUser> = {
      "diego": { id: "admin-diego", email: "diego@eusotrip.com", role: "SUPER_ADMIN", name: "Diego" },
      "diego@eusotrip.com": { id: "admin-diego", email: "diego@eusotrip.com", role: "SUPER_ADMIN", name: "Diego" },
      "shipper@eusotrip.com": { id: "shipper-1", email: "shipper@eusotrip.com", role: "SHIPPER", name: "Test Shipper" },
      "catalyst@eusotrip.com": { id: "catalyst-1", email: "catalyst@eusotrip.com", role: "CATALYST", name: "Test Catalyst" },
      "broker@eusotrip.com": { id: "broker-1", email: "broker@eusotrip.com", role: "BROKER", name: "Test Broker" },
      "driver@eusotrip.com": { id: "driver-1", email: "driver@eusotrip.com", role: "DRIVER", name: "Test Driver" },
      "dispatch@eusotrip.com": { id: "dispatch-1", email: "dispatch@eusotrip.com", role: "DISPATCH", name: "Test Dispatch" },
      "escort@eusotrip.com": { id: "escort-1", email: "escort@eusotrip.com", role: "ESCORT", name: "Test Escort" },
      "terminal@eusotrip.com": { id: "terminal-1", email: "terminal@eusotrip.com", role: "TERMINAL_MANAGER", name: "Test Terminal Manager" },
      "compliance@eusotrip.com": { id: "compliance-1", email: "compliance@eusotrip.com", role: "COMPLIANCE_OFFICER", name: "Test Compliance Officer" },
      "safety@eusotrip.com": { id: "safety-1", email: "safety@eusotrip.com", role: "SAFETY_MANAGER", name: "Test Safety Manager" },
      "admin@eusotrip.com": { id: "admin-1", email: "admin@eusotrip.com", role: "ADMIN", name: "Test Admin" },
      "superadmin@eusotrip.com": { id: "superadmin-1", email: "superadmin@eusotrip.com", role: "SUPER_ADMIN", name: "Super Admin" },
      "factoring@eusotrip.com": { id: "factoring-1", email: "factoring@eusotrip.com", role: "FACTORING", name: "Test Factoring" },
      // RAIL ROLES (6)
      "railshipper@eusotrip.com": { id: "railshipper-1", email: "railshipper@eusotrip.com", role: "RAIL_SHIPPER", name: "Test Rail Shipper" },
      "railcatalyst@eusotrip.com": { id: "railcatalyst-1", email: "railcatalyst@eusotrip.com", role: "RAIL_CATALYST", name: "Test Rail Catalyst" },
      "raildispatcher@eusotrip.com": { id: "raildispatcher-1", email: "raildispatcher@eusotrip.com", role: "RAIL_DISPATCHER", name: "Test Rail Dispatcher" },
      "railengineer@eusotrip.com": { id: "railengineer-1", email: "railengineer@eusotrip.com", role: "RAIL_ENGINEER", name: "Test Rail Engineer" },
      "railconductor@eusotrip.com": { id: "railconductor-1", email: "railconductor@eusotrip.com", role: "RAIL_CONDUCTOR", name: "Test Rail Conductor" },
      "railbroker@eusotrip.com": { id: "railbroker-1", email: "railbroker@eusotrip.com", role: "RAIL_BROKER", name: "Test Rail Broker" },
      // VESSEL/MARITIME ROLES (6)
      "vesselshipper@eusotrip.com": { id: "vesselshipper-1", email: "vesselshipper@eusotrip.com", role: "VESSEL_SHIPPER", name: "Test Vessel Shipper" },
      "vesseloperator@eusotrip.com": { id: "vesseloperator-1", email: "vesseloperator@eusotrip.com", role: "VESSEL_OPERATOR", name: "Test Vessel Operator" },
      "portmaster@eusotrip.com": { id: "portmaster-1", email: "portmaster@eusotrip.com", role: "PORT_MASTER", name: "Test Port Master" },
      "shipcaptain@eusotrip.com": { id: "shipcaptain-1", email: "shipcaptain@eusotrip.com", role: "SHIP_CAPTAIN", name: "Test Ship Captain" },
      "vesselbroker@eusotrip.com": { id: "vesselbroker-1", email: "vesselbroker@eusotrip.com", role: "VESSEL_BROKER", name: "Test Vessel Broker" },
      "customsbroker@eusotrip.com": { id: "customsbroker-1", email: "customsbroker@eusotrip.com", role: "CUSTOMS_BROKER", name: "Test Customs Broker" },
    };

    // Dev auth — requires NODE_ENV=development + ALLOW_DEV_AUTH=true + DEV_TEST_PASSWORD env var
    const DEV_TEST_PASSWORD = (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH === 'true')
      ? process.env.DEV_TEST_PASSWORD || null
      : null;

    // 1. Check database users first (registered users with bcrypt passwords)
    try {
      const db = await getDb();
      if (db) {
        const [dbUser] = await db.select({
          id: users.id, name: users.name, email: users.email,
          passwordHash: users.passwordHash, role: users.role,
          companyId: users.companyId, isActive: users.isActive,
        }).from(users).where(eq(users.email, email)).limit(1);
        if (dbUser && dbUser.passwordHash) {
          const valid = await bcrypt.compare(password, dbUser.passwordHash);
          if (valid) {
            // For test user emails, override DB role with test config role
            const testOverride = testUsers[email];
            const effectiveRole = testOverride ? testOverride.role : (dbUser.role || "SHIPPER");
            if (testOverride && dbUser.role !== testOverride.role) {
              logger.info(`[auth] DB login role override for test user ${email}: ${dbUser.role} -> ${testOverride.role}`);
              try { await db.update(users).set({ role: testOverride.role } as any).where(eq(users.id, dbUser.id)); } catch {}
            }
            const authUser: AuthUser = {
              id: String(dbUser.id),
              email: dbUser.email || email,
              role: effectiveRole,
              name: dbUser.name || "User",
              companyId: dbUser.companyId ? String(dbUser.companyId) : undefined,
            };
            logger.info(`[auth] DB login: ${email} role=${effectiveRole} dbId=${dbUser.id}`);
            const token = this.createSessionToken(authUser);
            return { user: authUser, token };
          }
          // If DB user exists but password mismatch AND this is a test user, reset their password
          if (DEV_TEST_PASSWORD && testUsers[email] && password === DEV_TEST_PASSWORD) {
            const newHash = await bcrypt.hash(DEV_TEST_PASSWORD, 10);
            const testCfg = testUsers[email];
            try {
              await db.update(users).set({ passwordHash: newHash, role: testCfg.role, isActive: true, isVerified: true } as any).where(eq(users.id, dbUser.id));
              logger.info(`[auth] Reset test user password & role: ${email} -> ${testCfg.role}`);
            } catch {}
            const authUser: AuthUser = {
              id: String(dbUser.id),
              email: dbUser.email || email,
              role: testCfg.role,
              name: dbUser.name || testCfg.name || "User",
              companyId: dbUser.companyId ? String(dbUser.companyId) : undefined,
            };
            const token = this.createSessionToken(authUser);
            return { user: authUser, token };
          }
        }
        // DB user exists but has NO passwordHash — if test user with correct password, set it
        if (DEV_TEST_PASSWORD && dbUser && !dbUser.passwordHash && testUsers[email] && password === DEV_TEST_PASSWORD) {
          const newHash = await bcrypt.hash(DEV_TEST_PASSWORD, 10);
          const testCfg = testUsers[email];
          try {
            await db.update(users).set({ passwordHash: newHash, loginMethod: "credentials", role: testCfg.role, isActive: true, isVerified: true } as any).where(eq(users.id, dbUser.id));
            logger.info(`[auth] Set password for existing test user: ${email} -> ${testCfg.role}`);
          } catch {}
          const authUser: AuthUser = {
            id: String(dbUser.id),
            email: dbUser.email || email,
            role: testCfg.role,
            name: dbUser.name || testCfg.name || "User",
            companyId: dbUser.companyId ? String(dbUser.companyId) : undefined,
          };
          const token = this.createSessionToken(authUser);
          return { user: authUser, token };
        }
      }
    } catch (err) {
      logger.warn("[auth] DB login check failed, falling back to test users:", err);
    }

    // 2. Fall back to test users
    const testUser = testUsers[email];
    if (!testUser) {
      return null;
    }
    
    if (DEV_TEST_PASSWORD && password === DEV_TEST_PASSWORD) {
      // Resolve test user to a real DB record so ctx.user.id is a real integer
      let resolvedUser: AuthUser = { ...testUser };
      try {
        const db = await getDb();
        if (db) {
          // Find or create the user in DB by email
          let [dbRow] = await db.select({
            id: users.id, name: users.name, email: users.email,
            role: users.role, companyId: users.companyId,
          }).from(users).where(eq(users.email, testUser.email)).limit(1);

          if (!dbRow) {
            // Create the user in DB with approved status
            const approvedMeta = JSON.stringify({ approvalStatus: "approved" });
            const hashedPw = await bcrypt.hash(DEV_TEST_PASSWORD, 10);
            const insertData: Record<string, any> = {
              email: testUser.email,
              name: testUser.name || "User",
              role: testUser.role,
              passwordHash: hashedPw,
              loginMethod: "credentials",
              isActive: true,
              isVerified: true,
              metadata: approvedMeta,
            };
            try {
              insertData.openId = testUser.id;
              await db.insert(users).values(insertData as any);
            } catch {
              delete insertData.openId;
              await db.insert(users).values(insertData as any);
            }
            const [newRow] = await db.select({
              id: users.id, name: users.name, email: users.email,
              role: users.role, companyId: users.companyId,
            }).from(users).where(eq(users.email, testUser.email)).limit(1);
            dbRow = newRow;
          } else {
            // Ensure existing test user is approved AND has correct role from test config
            try {
              const [metaRow] = await db.select({ id: users.id, metadata: users.metadata }).from(users).where(eq(users.id, dbRow.id)).limit(1);
              let meta: any = {};
              try { meta = metaRow?.metadata ? JSON.parse(metaRow.metadata as string) : {}; } catch {}
              const needsApproval = meta.approvalStatus !== "approved";
              const needsRoleSync = dbRow.role !== testUser.role;
              if (needsApproval || needsRoleSync) {
                meta.approvalStatus = "approved";
                const updates: any = { metadata: JSON.stringify(meta), isVerified: true };
                if (needsRoleSync) {
                  updates.role = testUser.role;
                  logger.info(`[auth] Syncing test user ${testUser.email} role: ${dbRow.role} -> ${testUser.role}`);
                }
                await db.update(users).set(updates).where(eq(users.id, dbRow.id));
                if (needsApproval) logger.info(`[auth] Auto-approved test user ${testUser.email}`);
              }
            } catch {}
          }

          if (dbRow) {
            // Always use testUser.role for test users (DB role may be stale)
            resolvedUser = {
              id: String(dbRow.id),
              email: dbRow.email || testUser.email,
              role: testUser.role,
              name: dbRow.name || testUser.name,
              companyId: dbRow.companyId ? String(dbRow.companyId) : undefined,
            };
            logger.info(`[auth] Test user resolved: ${testUser.email} role=${testUser.role} dbId=${dbRow.id}`);
          }
        }
      } catch (err) {
        logger.warn("[auth] Could not resolve test user to DB record:", err);
      }

      const token = this.createSessionToken(resolvedUser);
      return { user: resolvedUser, token };
    }

    return null;
  },
};

export type { AuthUser, TokenPayload };
