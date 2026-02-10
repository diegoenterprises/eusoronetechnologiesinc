/**
 * REWARDS ROUTER
 * tRPC procedures for rewards and loyalty program
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

export const rewardsRouter = router({
  getSummary: protectedProcedure.query(async () => ({ points: 0, tier: "bronze", nextTier: "silver", pointsToNextTier: 0, lifetimeEarnings: 0, totalEarned: 0, redeemed: 0, rank: 0, nextTierPoints: 0, tierProgress: 0 })),

  getAvailable: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => []),
});
