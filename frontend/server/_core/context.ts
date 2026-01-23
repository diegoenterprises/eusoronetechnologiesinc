import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

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
  console.log('[Context] x-test-user header:', testUserHeader);
  if (testUserHeader && typeof testUserHeader === 'string') {
    try {
      const testUser = JSON.parse(testUserHeader);
      user = testUser as User;
      console.log('[Context] Using test user:', user);
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
    user = await sdk.authenticateRequest(opts.req);
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
