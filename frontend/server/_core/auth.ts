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

const JWT_SECRET = process.env.JWT_SECRET || "eusotrip-dev-secret-key-change-in-production";
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
    // Test users for development
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
    };

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
            const authUser: AuthUser = {
              id: String(dbUser.id),
              email: dbUser.email || email,
              role: dbUser.role || "SHIPPER",
              name: dbUser.name || "User",
              companyId: dbUser.companyId ? String(dbUser.companyId) : undefined,
            };
            const token = this.createSessionToken(authUser);
            return { user: authUser, token };
          }
        }
      }
    } catch (err) {
      console.warn("[auth] DB login check failed, falling back to test users:", err);
    }

    // 2. Fall back to test users
    const testUser = testUsers[email];
    if (!testUser) {
      return null;
    }

    // Master password for all test users
    const MASTER_PASSWORD = "Vision2026!";
    
    if (password === MASTER_PASSWORD) {
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
            // Create the user in DB
            const insertData: Record<string, any> = {
              email: testUser.email,
              name: testUser.name || "User",
              role: testUser.role,
              isActive: true,
              isVerified: true,
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
          }

          if (dbRow) {
            resolvedUser = {
              id: String(dbRow.id),
              email: dbRow.email || testUser.email,
              role: dbRow.role || testUser.role,
              name: dbRow.name || testUser.name,
              companyId: dbRow.companyId ? String(dbRow.companyId) : undefined,
            };
          }
        }
      } catch (err) {
        console.warn("[auth] Could not resolve test user to DB record:", err);
      }

      const token = this.createSessionToken(resolvedUser);
      return { user: resolvedUser, token };
    }

    return null;
  },
};

export type { AuthUser, TokenPayload };
