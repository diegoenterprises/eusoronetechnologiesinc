/**
 * SMS ROUTER
 * tRPC procedures for SMS messaging
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const smsRouter = router({
  getSettings: protectedProcedure.query(async () => ({
    enabled: true,
    defaultNumber: "+1234567890",
    provider: "twilio",
    monthlyLimit: 1000,
  })),

  getTemplates: protectedProcedure.query(async () => [
    { id: "t1", name: "Load Assigned", content: "Load {{loadNumber}} has been assigned to you.", active: true },
    { id: "t2", name: "Delivery Reminder", content: "Reminder: Delivery scheduled for {{time}}.", active: true },
  ]),

  toggleTemplate: protectedProcedure.input(z.object({ templateId: z.string(), active: z.boolean() })).mutation(async ({ input }) => ({
    success: true,
    templateId: input.templateId,
    active: input.active,
  })),

  getLogs: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [
    { id: "l1", to: "+1234567890", template: "Load Assigned", status: "delivered", sentAt: "2025-01-23 10:00" },
  ]),

  getUsage: protectedProcedure.query(async () => ({
    sent: 450,
    delivered: 445,
    failed: 5,
    remaining: 550,
    costThisMonth: 22.50,
  })),

  sendTest: protectedProcedure.input(z.object({ to: z.string(), message: z.string() })).mutation(async ({ input }) => ({
    success: true,
    messageId: "msg_123",
    to: input.to,
  })),
});
