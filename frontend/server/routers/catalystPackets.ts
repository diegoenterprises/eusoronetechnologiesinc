/**
 * CATALYST PACKETS ROUTER
 * tRPC procedures for catalyst packet management
 */

import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, documents, users } from "../../drizzle/schema";

export const catalystPacketsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const companyId = Number(ctx.user?.companyId) || 0;

        // Query onboarding/packet documents for the company
        const docs = await db
          .select({
            id: documents.id,
            name: documents.name,
            type: documents.type,
            status: documents.status,
            fileUrl: documents.fileUrl,
            expiryDate: documents.expiryDate,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .where(eq(documents.companyId, companyId))
          .limit(50);

        return docs.map(d => ({
          id: String(d.id),
          name: d.name,
          type: d.type,
          status: d.status || 'pending',
          fileUrl: d.fileUrl,
          expiryDate: d.expiryDate?.toISOString().split('T')[0] || null,
          createdAt: d.createdAt.toISOString(),
        }));
      } catch {
        return [];
      }
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, completed: 0, complete: 0, avgCompletion: 0 };

    try {
      const companyId = Number(ctx.user?.companyId) || 0;

      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(eq(documents.companyId, companyId));

      const [pending] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(eq(documents.companyId, companyId), eq(documents.status, 'pending')));

      const [completed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(eq(documents.companyId, companyId), eq(documents.status, 'active')));

      const totalCount = total?.count || 0;
      const completedCount = completed?.count || 0;
      const avgCompletion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        total: totalCount,
        pending: pending?.count || 0,
        completed: completedCount,
        complete: completedCount,
        avgCompletion,
      };
    } catch {
      return { total: 0, pending: 0, completed: 0, complete: 0, avgCompletion: 0 };
    }
  }),

  send: protectedProcedure
    .input(z.object({ catalystId: z.string().optional(), id: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, packetId: '' };

      try {
        const companyId = Number(input.catalystId || input.id || ctx.user?.companyId) || 0;

        // Insert a new pending document record as the packet
        const [result] = await db.insert(documents).values({
          companyId,
          type: 'onboarding_packet',
          name: 'Catalyst Onboarding Packet',
          fileUrl: '',
          status: 'pending',
        }).$returningId();

        return { success: true, packetId: `packet_${result.id}` };
      } catch {
        return { success: false, packetId: '' };
      }
    }),
});
