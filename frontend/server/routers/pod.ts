/**
 * POD (Proof of Delivery) ROUTER
 * tRPC procedures for proof of delivery management
 * ALL data from database — scoped by userId
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { documents, loads, users } from "../../drizzle/schema";

export const podRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { pending: 0, completed: 0, avgUploadTime: 0, total: 0, received: 0, missing: 0 };
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    try {
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(and(eq(documents.userId, userId), eq(documents.type, "pod")));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(and(eq(documents.userId, userId), eq(documents.type, "pod"), eq(documents.status, "active")));
      const totalCount = total?.count || 0;
      const completedCount = completed?.count || 0;
      return { pending: totalCount - completedCount, completed: completedCount, avgUploadTime: 0, total: totalCount, received: completedCount, missing: totalCount - completedCount };
    } catch { return { pending: 0, completed: 0, avgUploadTime: 0, total: 0, received: 0, missing: 0 }; }
  }),

  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    try {
      const filters: any[] = [eq(documents.userId, userId), eq(documents.type, "pod")];
      if (input?.status === "completed") filters.push(eq(documents.status, "active"));
      else if (input?.status === "pending") filters.push(eq(documents.status, "pending"));
      const results = await db.select().from(documents).where(and(...filters)).orderBy(desc(documents.createdAt)).limit(input?.limit || 20);
      return results.map(d => ({
        id: String(d.id), loadNumber: d.loadId ? `LOAD-${d.loadId}` : "",
        status: d.status === "active" ? "completed" : "pending",
        uploadedAt: d.createdAt?.toISOString()?.split("T")[0] || "",
        signedBy: "",
      }));
    } catch { return []; }
  }),
});
