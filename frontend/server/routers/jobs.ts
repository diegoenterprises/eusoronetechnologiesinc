/**
 * JOBS ROUTER
 * tRPC procedures for driver job management
 * ALL data from database — loads assigned to current driver
 */

import { z } from "zod";
import { eq, and, or, desc, sql, gte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, payments } from "../../drizzle/schema";

function resolveUserId(ctxUser: any): number {
  return typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) || 0 : (ctxUser?.id || 0);
}

function mapLoadToJob(l: any) {
  const pickup = l.pickupLocation as any;
  const delivery = l.deliveryLocation as any;
  return {
    id: `JOB-${l.id}`, loadNumber: l.loadNumber || String(l.id), status: l.status,
    origin: pickup?.city ? `${pickup.city}, ${pickup.state || ""}` : "",
    destination: delivery?.city ? `${delivery.city}, ${delivery.state || ""}` : "",
    pickup: { location: pickup?.address || "", address: pickup ? `${pickup.address || ""}, ${pickup.city || ""}, ${pickup.state || ""}` : "", scheduledTime: l.pickupDate?.toISOString() || "", completed: ["delivered", "at_delivery", "en_route_delivery"].includes(l.status) },
    delivery: { location: delivery?.address || "", address: delivery ? `${delivery.address || ""}, ${delivery.city || ""}, ${delivery.state || ""}` : "", scheduledTime: l.deliveryDate?.toISOString() || "", completed: l.status === "delivered" },
    cargo: { description: l.commodity || "", unNumber: l.unNumber || "", hazClass: l.hazmatClass || "", weight: l.weight ? `${l.weight} ${l.weightUnit || "lbs"}` : "" },
    pay: Number(l.rate) || 0, miles: Number(l.distance) || 0, progress: l.status === "delivered" ? 100 : l.status === "in_transit" ? 50 : 0,
  };
}

export const jobsRouter = router({
  /**
   * Get current active job for driver — from loads table
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const userId = resolveUserId(ctx.user);
    try {
      const activeStatuses = ["assigned", "accepted", "en_route_pickup", "at_pickup", "loading", "in_transit", "en_route_delivery", "at_delivery", "unloading"];
      const [load] = await db.select().from(loads)
        .where(and(eq(loads.driverId, userId), sql`${loads.status} IN ('assigned','accepted','en_route_pickup','at_pickup','loading','in_transit','en_route_delivery','at_delivery','unloading')`))
        .orderBy(desc(loads.updatedAt)).limit(1);
      if (!load) return null;
      return mapLoadToJob(load);
    } catch { return null; }
  }),

  /**
   * Get all jobs for driver — from loads table
   */
  getAll: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = resolveUserId(ctx.user);
    try {
      const filters: any[] = [eq(loads.driverId, userId)];
      if (input?.status) filters.push(eq(loads.status, input.status as any));
      const results = await db.select().from(loads).where(and(...filters)).orderBy(desc(loads.updatedAt)).limit(input?.limit || 20);
      return results.map(mapLoadToJob);
    } catch { return []; }
  }),

  /**
   * Get job by ID — from loads table
   */
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const loadId = parseInt(input.id.replace("JOB-", ""), 10);
    try {
      const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) return null;
      return mapLoadToJob(load);
    } catch { return null; }
  }),

  /**
   * Accept a job — updates load status
   */
  accept: protectedProcedure.input(z.object({ jobId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const loadId = parseInt(input.jobId.replace("JOB-", ""), 10);
    const userId = resolveUserId(ctx.user);
    await db.update(loads).set({ status: "accepted" as any, driverId: userId }).where(eq(loads.id, loadId));
    return { success: true, jobId: input.jobId, acceptedAt: new Date().toISOString() };
  }),

  /**
   * Decline a job — updates load status back to posted
   */
  decline: protectedProcedure.input(z.object({ jobId: z.string(), reason: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const loadId = parseInt(input.jobId.replace("JOB-", ""), 10);
    await db.update(loads).set({ status: "posted" as any, driverId: null }).where(eq(loads.id, loadId));
    return { success: true, jobId: input.jobId, declinedAt: new Date().toISOString() };
  }),

  /**
   * Update job status — updates load status
   */
  updateStatus: protectedProcedure.input(z.object({ jobId: z.string(), status: z.string(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const loadId = parseInt(input.jobId.replace("JOB-", ""), 10);
    await db.update(loads).set({ status: input.status as any }).where(eq(loads.id, loadId));
    return { success: true, jobId: input.jobId, status: input.status, updatedAt: new Date().toISOString() };
  }),

  /**
   * Get job stats — computed from real data
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { active: 0, completed: 0, thisWeek: 0, earnings: 0 };
    const userId = resolveUserId(ctx.user);
    try {
      const [active] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.driverId, userId), sql`${loads.status} NOT IN ('delivered','cancelled')`));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, "delivered")));
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
      const [thisWeek] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, "delivered"), gte(loads.actualDeliveryDate, weekStart)));
      const [earnings] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL(10,2))), 0)` }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, "delivered")));
      return { active: active?.count || 0, completed: completed?.count || 0, thisWeek: thisWeek?.count || 0, earnings: earnings?.total || 0 };
    } catch { return { active: 0, completed: 0, thisWeek: 0, earnings: 0 }; }
  }),
});
