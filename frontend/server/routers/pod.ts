/**
 * POD (Proof of Delivery) ROUTER
 * tRPC procedures for proof of delivery management
 * ALL data from database — scoped by userId
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { documents, loads, users } from "../../drizzle/schema";

export const podRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || 'SHIPPER', companyId: (ctx.user as any)?.companyId, action: 'READ', resource: 'POD' }, (ctx as any).req);
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

  // ── getPODForLoad — fetch POD details for a specific load ──
  getPODForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [doc] = await db
          .select()
          .from(documents)
          .where(and(eq(documents.loadId, input.loadId), eq(documents.type, "pod")))
          .orderBy(desc(documents.createdAt))
          .limit(1);
        if (!doc) return null;

        // Parse metadata stored in fileUrl as JSON (base64 data + metadata)
        let meta: any = {};
        try { meta = JSON.parse(doc.fileUrl || "{}"); } catch { /* fileUrl may be a plain URL */ }

        // Get load for rejection reason (stored in holdReason when pod_rejected)
        const [load] = await db.select({ status: loads.status, holdReason: loads.holdReason }).from(loads).where(eq(loads.id, input.loadId));

        return {
          id: doc.id,
          loadId: input.loadId,
          receiverName: meta.receiverName || doc.name || "",
          photoBase64: meta.photoBase64 || null,
          signatureBase64: meta.signatureBase64 || null,
          notes: meta.notes || null,
          status: load?.status || doc.status,
          rejectionReason: load?.status === "pod_rejected" ? (load.holdReason || null) : null,
          createdAt: doc.createdAt?.toISOString() || "",
        };
      } catch { return null; }
    }),

  // ── submitPOD — driver submits proof of delivery after unloading ──
  submitPOD: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      photoBase64: z.string().optional(),
      signatureBase64: z.string().optional(),
      receiverName: z.string().min(1, "Receiver name is required"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);

      // Validate load exists and belongs to calling driver
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId));
      if (!load) throw new Error("Load not found");
      if (load.driverId !== userId) throw new Error("You are not the assigned driver for this load");
      if (load.status !== "unloaded" && load.status !== "pod_rejected") {
        throw new Error(`Cannot submit POD — load status is "${load.status}", expected "unloaded" or "pod_rejected"`);
      }

      // Store POD data in documents table
      const podMetadata = JSON.stringify({
        receiverName: input.receiverName,
        photoBase64: input.photoBase64 || null,
        signatureBase64: input.signatureBase64 || null,
        notes: input.notes || null,
        submittedAt: new Date().toISOString(),
      });

      await db.insert(documents).values({
        userId,
        loadId: input.loadId,
        type: "pod",
        name: `POD — ${input.receiverName}`,
        fileUrl: podMetadata,
        status: "pending",
      });

      // Transition load status to pod_pending
      await db.update(loads).set({
        status: "pod_pending",
        holdReason: null, // clear any previous rejection reason
      }).where(eq(loads.id, input.loadId));

      return { success: true };
    }),

  // ── approvePOD — shipper/admin/dispatch approves submitted POD ──
  approvePOD: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const userRole = (ctx.user as any)?.role || "";

      // Validate load exists
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId));
      if (!load) throw new Error("Load not found");

      // Authorization: must be shipper who owns the load, or ADMIN/DISPATCH
      const isShipper = load.shipperId === userId;
      const isPrivileged = ["ADMIN", "SUPER_ADMIN", "DISPATCH"].includes(userRole);
      if (!isShipper && !isPrivileged) {
        throw new Error("Not authorized to approve POD for this load");
      }

      if (load.status !== "pod_pending") {
        throw new Error(`Cannot approve POD — load status is "${load.status}", expected "pod_pending"`);
      }

      // Transition to delivered
      await db.update(loads).set({
        status: "delivered",
        actualDeliveryDate: new Date(),
      }).where(eq(loads.id, input.loadId));

      // Mark the POD document as active (completed)
      await db.update(documents).set({ status: "active" }).where(
        and(eq(documents.loadId, input.loadId), eq(documents.type, "pod"))
      );

      return { success: true };
    }),

  // ── rejectPOD — shipper/admin/dispatch rejects submitted POD ──
  rejectPOD: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      reason: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const userRole = (ctx.user as any)?.role || "";

      // Validate load exists
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId));
      if (!load) throw new Error("Load not found");

      // Authorization: must be shipper who owns the load, or ADMIN/DISPATCH
      const isShipper = load.shipperId === userId;
      const isPrivileged = ["ADMIN", "SUPER_ADMIN", "DISPATCH"].includes(userRole);
      if (!isShipper && !isPrivileged) {
        throw new Error("Not authorized to reject POD for this load");
      }

      if (load.status !== "pod_pending") {
        throw new Error(`Cannot reject POD — load status is "${load.status}", expected "pod_pending"`);
      }

      // Transition to pod_rejected, store reason in holdReason
      await db.update(loads).set({
        status: "pod_rejected",
        holdReason: input.reason,
      }).where(eq(loads.id, input.loadId));

      return { success: true };
    }),
});
