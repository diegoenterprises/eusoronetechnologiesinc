/**
 * FUEL CARDS ROUTER
 * tRPC procedures for fuel card management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drivers } from "../../drizzle/schema";

export const fuelCardsRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => {
    // Fuel cards require a dedicated fuel_cards table
    return [];
  }),

  getSummary: protectedProcedure.query(async () => ({
    totalCards: 0, activeCards: 0, totalSpent: 0, monthlyLimit: 0,
    topStation: "", monthlySpend: 0, gallonsThisMonth: 0,
  })),

  getRecentTransactions: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => {
    // Fuel transactions require a dedicated fuel_transactions table
    return [];
  }),

  toggleStatus: protectedProcedure.input(z.object({ cardId: z.string(), active: z.boolean().optional(), status: z.string().optional() })).mutation(async ({ input }) => ({
    success: true,
    cardId: input.cardId,
    active: input.active,
  })),
});
