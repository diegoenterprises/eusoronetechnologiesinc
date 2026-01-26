/**
 * FUEL CARDS ROUTER
 * tRPC procedures for fuel card management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const fuelCardsRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "fc1", cardNumber: "****1234", driver: "Mike Johnson", status: "active", limit: 500, spent: 320 },
    { id: "fc2", cardNumber: "****5678", driver: "Sarah Williams", status: "active", limit: 500, spent: 180 },
  ]),

  getSummary: protectedProcedure.query(async () => ({
    totalCards: 25,
    activeCards: 22,
    totalSpent: 8500,
    monthlyLimit: 12500,
    topStation: "Pilot Flying J",
    monthlySpend: 8500,
    gallonsThisMonth: 2500,
  })),

  getRecentTransactions: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { id: "t1", cardId: "fc1", amount: 85.50, gallons: 25.2, station: "Pilot Flying J", date: "2025-01-23 08:30" },
    { id: "t2", cardId: "fc2", amount: 72.30, gallons: 21.5, station: "Love's", date: "2025-01-22 15:45" },
  ]),

  toggleStatus: protectedProcedure.input(z.object({ cardId: z.string(), active: z.boolean().optional(), status: z.string().optional() })).mutation(async ({ input }) => ({
    success: true,
    cardId: input.cardId,
    active: input.active,
  })),
});
