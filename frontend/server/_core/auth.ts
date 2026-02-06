/**
 * AUTH SERVICE
 * JWT-based authentication service for EusoTrip
 */

import jwt from "jsonwebtoken";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";

const JWT_SECRET = process.env.JWT_SECRET || "eusotrip-dev-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
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
      "carrier@eusotrip.com": { id: "carrier-1", email: "carrier@eusotrip.com", role: "CARRIER", name: "Test Carrier" },
      "broker@eusotrip.com": { id: "broker-1", email: "broker@eusotrip.com", role: "BROKER", name: "Test Broker" },
      "driver@eusotrip.com": { id: "driver-1", email: "driver@eusotrip.com", role: "DRIVER", name: "Test Driver" },
      "catalyst@eusotrip.com": { id: "catalyst-1", email: "catalyst@eusotrip.com", role: "CATALYST", name: "Test Catalyst" },
      "escort@eusotrip.com": { id: "escort-1", email: "escort@eusotrip.com", role: "ESCORT", name: "Test Escort" },
      "terminal@eusotrip.com": { id: "terminal-1", email: "terminal@eusotrip.com", role: "TERMINAL_MANAGER", name: "Test Terminal Manager" },
      "compliance@eusotrip.com": { id: "compliance-1", email: "compliance@eusotrip.com", role: "COMPLIANCE_OFFICER", name: "Test Compliance Officer" },
      "safety@eusotrip.com": { id: "safety-1", email: "safety@eusotrip.com", role: "SAFETY_MANAGER", name: "Test Safety Manager" },
      "admin@eusotrip.com": { id: "admin-1", email: "admin@eusotrip.com", role: "ADMIN", name: "Test Admin" },
      "superadmin@eusotrip.com": { id: "superadmin-1", email: "superadmin@eusotrip.com", role: "SUPER_ADMIN", name: "Super Admin" },
    };

    const user = testUsers[email];
    if (!user) {
      return null;
    }

    // Master password for all test users
    const MASTER_PASSWORD = "Vision2026!";
    
    if (password === MASTER_PASSWORD) {
      const token = this.createSessionToken(user);
      return { user, token };
    }

    return null;
  },
};

export type { AuthUser, TokenPayload };
