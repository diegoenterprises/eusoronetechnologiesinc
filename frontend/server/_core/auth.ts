/**
 * EusoTrip In-House Authentication Service
 * Replaces Manus OAuth with JWT-based authentication
 */

import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export type UserInfo = {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId?: number;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

class AuthService {
  private getSessionSecret() {
    const secret = ENV.cookieSecret || "eusotrip-secret-key-change-in-production";
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a JWT session token for a user
   */
  async createSessionToken(
    user: { id: number; email: string; name: string; role: string },
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a JWT session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { userId, email, name, role } = payload as Record<string, unknown>;

      if (!isNonEmptyString(userId) || !isNonEmptyString(email)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        userId,
        email,
        name: name as string || "",
        role: role as string || "USER",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Parse cookies from request header
   */
  parseCookies(cookieHeader: string | undefined): Map<string, string> {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Authenticate a request and return user info
   */
  async authenticateRequest(req: Request): Promise<UserInfo | null> {
    // Check for test user header (development only)
    const testUserHeader = req.headers["x-test-user"];
    if (testUserHeader && process.env.NODE_ENV === "development") {
      try {
        const testUser = JSON.parse(testUserHeader as string);
        return {
          id: testUser.id || 1,
          email: testUser.email || "test@eusotrip.com",
          name: testUser.name || "Test User",
          role: testUser.role || "SHIPPER",
          companyId: testUser.companyId,
        };
      } catch {
        console.warn("[Auth] Invalid test user header");
      }
    }

    // Check session cookie
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    const session = await this.verifySession(sessionCookie);
    if (!session) {
      return null;
    }

    // Fetch full user from database
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        console.warn("[Auth] Database not available");
        return null;
      }

      const user = await db.getUserByEmail(session.email);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || "",
        name: user.name || "",
        role: user.role || "USER",
        companyId: user.companyId || undefined,
      };
    } catch (error) {
      console.error("[Auth] Error fetching user:", error);
      return null;
    }
  }

  /**
   * Login with email and password (for production use)
   */
  async loginWithCredentials(
    email: string,
    password: string
  ): Promise<{ user: UserInfo; token: string } | null> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new Error("Database not available");
      }

      // In production, verify password hash
      // For now, just find the user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // TODO: Add password verification in production
      // const isValid = await bcrypt.compare(password, user.passwordHash);
      // if (!isValid) return null;

      const token = await this.createSessionToken({
        id: user.id,
        email: user.email || "",
        name: user.name || "",
        role: user.role || "USER",
      });

      return {
        user: {
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          role: user.role || "USER",
          companyId: user.companyId || undefined,
        },
        token,
      };
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
