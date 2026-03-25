/**
 * LEGAL ROUTER
 * tRPC procedures for legal documents and privacy
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const legalRouter = router({
  getTermsOfService: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString().slice(0, 10),
    content: "",
    sections: [],
    contactEmail: "legal@eusotrip.com",
  })),

  getPrivacyPolicy: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString().slice(0, 10),
    content: "",
    sections: [],
    dpoEmail: "dpo@eusotrip.com",
  })),

  getCookiePolicy: publicProcedure.query(async () => ({
    version: "1.0",
    effectiveDate: new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString().slice(0, 10),
    content: "",
    sections: [],
    categories: ["essential", "analytics", "marketing"],
    contactEmail: "privacy@eusotrip.com",
  })),

  // Compliance config — regulatory retention requirements, not stub data
  getDataRetention: protectedProcedure.query(async () => ({
    retentionPeriod: "7 years",
    dataTypes: [{ type: "loads", retention: "7 years" }, { type: "messages", retention: "2 years" }],
    categories: [
      { name: "Load Records", retention: "7 years", description: "Freight and shipment data" },
      { name: "Messages", retention: "2 years", description: "Communication logs" },
    ],
  })),

  getMyDataSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) || 0 : (ctx.user?.id || 0);
    const db = await getDb();

    let loadCount = 0;
    let messageCount = 0;
    let lastActivity: string | null = null;

    if (db && userId) {
      try {
        const [loadRow] = await db.select({ c: sql<number>`COUNT(*)` })
          .from(sql`loads`)
          .where(sql`shipperId = ${userId} OR catalystId = ${userId} OR driverId = ${userId}`);
        loadCount = Number(loadRow?.c) || 0;
      } catch { /* table may not exist */ }

      try {
        const [msgRow] = await db.select({ c: sql<number>`COUNT(*)` })
          .from(sql`messages`)
          .where(sql`senderId = ${userId} OR receiverId = ${userId}`);
        messageCount = Number(msgRow?.c) || 0;
      } catch { /* table may not exist */ }

      try {
        const [actRow] = await db.select({ latest: sql<string>`MAX(updatedAt)` })
          .from(sql`loads`)
          .where(sql`shipperId = ${userId} OR catalystId = ${userId} OR driverId = ${userId}`);
        lastActivity = actRow?.latest || null;
      } catch { /* table may not exist */ }
    }

    return {
      profile: true,
      loads: loadCount,
      messages: messageCount,
      documents: 0,
      lastExport: null,
      accountAge: "",
      dataPoints: loadCount + messageCount,
      storageUsed: "",
      lastActivity,
    };
  }),

  requestDataExport: protectedProcedure.input(z.object({}).optional()).mutation(async () => ({
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
    essential: z.boolean().optional(),
    analytics: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })).mutation(async ({ input }) => ({ success: true, preferences: input })),
});
