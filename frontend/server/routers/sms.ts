/**
 * SMS ROUTER
 * tRPC procedures for SMS messaging
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const smsRouter = router({
  getSettings: protectedProcedure.query(async () => ({
    enabled: true,
    defaultNumber: "+1234567890",
    provider: "twilio",
    monthlyLimit: 1000,
  })),

  getTemplates: protectedProcedure.query(async () => {
    // SMS templates require Twilio integration
    return [];
  }),

  toggleTemplate: protectedProcedure.input(z.object({ templateId: z.string(), active: z.boolean().optional(), enabled: z.boolean().optional() })).mutation(async ({ input }) => ({
    success: true,
    templateId: input.templateId,
    active: input.active ?? input.enabled,
  })),

  getLogs: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => {
    // SMS logs require Twilio integration
    return [];
  }),

  getUsage: protectedProcedure.query(async () => ({ sent: 0, delivered: 0, failed: 0, remaining: 0, costThisMonth: 0, sentThisMonth: 0, deliveryRate: 0 })),

  sendTest: protectedProcedure.input(z.object({ to: z.string().optional(), phoneNumber: z.string().optional(), message: z.string().optional() })).mutation(async ({ input }) => ({
    success: true,
    messageId: "msg_123",
    to: input.to || input.phoneNumber,
  })),
});
