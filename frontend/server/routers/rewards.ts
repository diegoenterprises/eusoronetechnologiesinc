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
  getSummary: protectedProcedure.query(async () => ({
    points: 12500,
    tier: "gold",
    nextTier: "platinum",
    pointsToNextTier: 2500,
    lifetimeEarnings: 45000,
    totalEarned: 57500,
    redeemed: 12500,
    rank: 125,
    nextTierPoints: 15000,
    tierProgress: 83,
  })),

  getAvailable: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { id: "r1", name: "Fuel Discount", points: 1000, description: "$10 off fuel", category: "fuel" },
    { id: "r2", name: "Gift Card", points: 5000, description: "$50 Amazon gift card", category: "gift" },
  ]),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [
    { id: "h1", type: "earned", points: 500, description: "Completed load LOAD-45920", date: "2025-01-23" },
    { id: "h2", type: "redeemed", points: -1000, description: "Fuel discount", date: "2025-01-20" },
  ]),
});
