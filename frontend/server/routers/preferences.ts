/**
 * PREFERENCES ROUTER
 * tRPC procedures for user preferences
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const preferencesRouter = router({
  get: protectedProcedure.query(async () => ({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    language: "en",
    timezone: "America/Chicago",
    theme: "dark",
    darkMode: true,
    compactMode: false,
    dateFormat: "MM/DD/YYYY",
    marketingEmails: false,
  })),

  update: protectedProcedure.input(z.object({ 
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    theme: z.string().optional(),
    darkMode: z.boolean().optional(),
    compactMode: z.boolean().optional(),
    dateFormat: z.string().optional(),
    marketingEmails: z.boolean().optional(),
  })).mutation(async ({ input }) => ({
    success: true,
  })),

  reset: protectedProcedure.mutation(async () => ({
    success: true,
  })),
});
