import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authService } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

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
      console.error('[Context] Failed to parse test user:', error);
    }
  }

  try {
    const authUser = await authService.authenticateRequest(opts.req);
    if (authUser) {
      user = authUser as unknown as User;
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
