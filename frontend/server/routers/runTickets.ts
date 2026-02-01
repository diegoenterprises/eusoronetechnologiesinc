/**
 * RUN TICKETS ROUTER
 * Backend support for run ticket/trip sheet management
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

export const runTicketsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      loadId: z.number().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) return [];
      
      // Return run tickets for the user
      return [
        {
          id: 1,
          ticketNumber: "RT-2026-001",
          loadId: 1,
          loadNumber: "LD-12345",
          status: "active",
          createdAt: new Date().toISOString(),
          completedAt: null,
          origin: "Chicago, IL",
          destination: "Dallas, TX",
          totalMiles: 920,
          totalFuel: 425.50,
          totalTolls: 45.00,
          totalExpenses: 520.50,
          driverNotes: null,
        },
        {
          id: 2,
          ticketNumber: "RT-2026-002",
          loadId: 2,
          loadNumber: "LD-12346",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date().toISOString(),
          origin: "Los Angeles, CA",
          destination: "Phoenix, AZ",
          totalMiles: 370,
          totalFuel: 180.00,
          totalTolls: 12.00,
          totalExpenses: 215.00,
          driverNotes: "Smooth delivery",
        },
      ].filter(t => !input.status || t.status === input.status);
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      total: 45,
      active: 3,
      completed: 38,
      pendingReview: 4,
      totalFuel: 12500,
      totalTolls: 890,
      totalExpenses: 15200,
      avgPerTrip: 337,
    };
  }),

  create: protectedProcedure
    .input(z.object({
      loadNumber: z.string(),
      loadId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticketNumber = `RT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      return {
        id: Date.now(),
        ticketNumber,
        loadNumber: input.loadNumber,
        status: "active",
        createdAt: new Date().toISOString(),
      };
    }),

  addExpense: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      type: z.string(),
      amount: z.number(),
      description: z.string().optional(),
      receiptUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: Date.now(),
        ...input,
        createdAt: new Date().toISOString(),
      };
    }),

  getExpenses: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      return [
        { id: 1, type: "fuel", amount: 245.50, description: "Pilot Flying J - I-35", createdAt: new Date().toISOString() },
        { id: 2, type: "toll", amount: 25.00, description: "IL Tollway", createdAt: new Date().toISOString() },
        { id: 3, type: "fuel", amount: 180.00, description: "Love's - Oklahoma City", createdAt: new Date().toISOString() },
        { id: 4, type: "toll", amount: 20.00, description: "TX Turnpike", createdAt: new Date().toISOString() },
      ];
    }),

  complete: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: input.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return {
        id: input.id,
        ticketNumber: `RT-2026-${String(input.id).padStart(3, '0')}`,
        loadId: 1,
        loadNumber: "LD-12345",
        status: "active",
        createdAt: new Date().toISOString(),
        completedAt: null,
        origin: "Chicago, IL",
        destination: "Dallas, TX",
        totalMiles: 920,
        totalFuel: 425.50,
        totalTolls: 45.00,
        totalExpenses: 520.50,
        driverNotes: null,
        expenses: [
          { id: 1, type: "fuel", amount: 245.50, description: "Pilot Flying J" },
          { id: 2, type: "toll", amount: 25.00, description: "IL Tollway" },
        ],
      };
    }),

  export: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      format: z.enum(["pdf", "csv"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        url: `/exports/run-ticket-${input.ticketId}.${input.format}`,
        fileName: `run-ticket-${input.ticketId}.${input.format}`,
      };
    }),
});
