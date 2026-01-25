/**
 * LEGAL ROUTER
 * tRPC procedures for legal documents and privacy
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const legalRouter = router({
  getTermsOfService: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: "2024-01-01",
    content: "Terms of Service content...",
    lastUpdated: "2024-01-01",
  })),

  getPrivacyPolicy: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: "2024-01-01",
    content: "Privacy Policy content...",
    lastUpdated: "2024-01-01",
  })),

  getCookiePolicy: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: "2024-01-01",
    content: "Cookie Policy content...",
    categories: ["essential", "analytics", "marketing"],
  })),

  getDataRetention: protectedProcedure.query(async () => ({
    retentionPeriod: "7 years",
    dataTypes: [{ type: "loads", retention: "7 years" }, { type: "messages", retention: "2 years" }],
  })),

  getMyDataSummary: protectedProcedure.query(async () => ({
    profile: true,
    loads: 150,
    messages: 450,
    documents: 25,
    lastExport: null,
  })),

  requestDataExport: protectedProcedure.mutation(async () => ({
    success: true,
    requestId: "export_123",
    estimatedCompletion: "24 hours",
  })),

  requestDataDeletion: protectedProcedure.input(z.object({ reason: z.string().optional() })).mutation(async () => ({
    success: true,
    requestId: "deletion_123",
    scheduledDate: "2025-02-23",
  })),

  updateCookiePreferences: protectedProcedure.input(z.object({
    essential: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  })).mutation(async ({ input }) => ({ success: true, preferences: input })),
});
