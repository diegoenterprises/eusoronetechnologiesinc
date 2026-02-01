/**
 * NEGOTIATIONS ROUTER
 * Backend support for load rate negotiations
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

export const negotiationsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      loadId: z.number().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const negotiations = [
        {
          id: 1,
          loadId: 101,
          loadNumber: "LD-78901",
          origin: "Atlanta, GA",
          destination: "Miami, FL",
          distance: 660,
          initialRate: 1850,
          currentOffer: 1650,
          counterOffer: 1750,
          status: "counter_offered",
          initiatedBy: "broker",
          otherParty: "ABC Logistics",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            { id: 1, sender: "ABC Logistics", type: "offer", amount: 1650, message: "Best rate we can offer", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, sender: "you", type: "counter", amount: 1750, message: "Need at least $1750 for this lane", createdAt: new Date().toISOString() },
          ],
        },
        {
          id: 2,
          loadId: 102,
          loadNumber: "LD-78902",
          origin: "Houston, TX",
          destination: "Denver, CO",
          distance: 1030,
          initialRate: 2800,
          currentOffer: 2600,
          counterOffer: null,
          status: "pending",
          initiatedBy: "carrier",
          otherParty: "XYZ Freight",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          messages: [
            { id: 3, sender: "you", type: "offer", amount: 2600, message: "Interested in this load", createdAt: new Date(Date.now() - 86400000).toISOString() },
          ],
        },
        {
          id: 3,
          loadId: 103,
          loadNumber: "LD-78903",
          origin: "Seattle, WA",
          destination: "Portland, OR",
          distance: 175,
          initialRate: 550,
          currentOffer: 525,
          counterOffer: null,
          status: "accepted",
          initiatedBy: "broker",
          otherParty: "Pacific Carriers",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          messages: [
            { id: 4, sender: "Pacific Carriers", type: "offer", amount: 500, message: "", createdAt: new Date(Date.now() - 172800000).toISOString() },
            { id: 5, sender: "you", type: "counter", amount: 525, message: "Can do $525", createdAt: new Date(Date.now() - 150000000).toISOString() },
            { id: 6, sender: "Pacific Carriers", type: "accept", amount: 525, message: "Deal!", createdAt: new Date(Date.now() - 86400000).toISOString() },
          ],
        },
      ];

      return negotiations.filter(n => !input.status || n.status === input.status || input.status === "active" && ["pending", "counter_offered"].includes(n.status));
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      active: 8,
      pending: 5,
      accepted: 42,
      rejected: 12,
      expired: 3,
      winRate: 78,
      avgSavings: 145,
      avgRounds: 2.3,
      totalNegotiated: 125000,
    };
  }),

  submitCounterOffer: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      amount: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: input.negotiationId,
        counterOffer: input.amount,
        status: "counter_offered",
        updatedAt: new Date().toISOString(),
      };
    }),

  accept: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: input.negotiationId,
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      };
    }),

  reject: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: input.negotiationId,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: Date.now(),
        negotiationId: input.negotiationId,
        sender: "you",
        type: "message",
        message: input.message,
        createdAt: new Date().toISOString(),
      };
    }),

  initiate: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      initialOffer: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: Date.now(),
        loadId: input.loadId,
        initialRate: input.initialOffer,
        currentOffer: input.initialOffer,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
    }),

  getHistory: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return [
        { id: 1, type: "offer", amount: 1850, sender: "broker", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 2, type: "counter", amount: 1650, sender: "carrier", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, type: "counter", amount: 1750, sender: "broker", createdAt: new Date().toISOString() },
      ];
    }),
});
