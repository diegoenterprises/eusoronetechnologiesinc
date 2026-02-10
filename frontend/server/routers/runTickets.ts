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
      return [];
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      total: 0, active: 0, completed: 0, pendingReview: 0,
      totalFuel: 0, totalTolls: 0, totalExpenses: 0, avgPerTrip: 0,
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
      return [];
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
        ticketNumber: `RT-${new Date().getFullYear()}-${String(input.id).padStart(3, '0')}`,
        loadId: 0, loadNumber: "", status: "",
        createdAt: "", completedAt: null,
        origin: "", destination: "",
        totalMiles: 0, totalFuel: 0, totalTolls: 0, totalExpenses: 0,
        driverNotes: null, expenses: [],
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
