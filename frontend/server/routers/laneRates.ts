/**
 * LANE RATES ROUTER
 * tRPC procedures for lane rate management
 */

import { z } from "zod";
import { sql, desc } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";

export const laneRatesRouter = router({
  list: protectedProcedure.input(z.object({ search: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const rows = await db.select().from(loads).where(sql`${loads.rate} > 0 AND ${loads.status} = 'delivered'`).orderBy(desc(loads.createdAt)).limit(input?.limit || 20);
      return rows.map(l => {
        const p = l.pickupLocation as any || {};
        const d = l.deliveryLocation as any || {};
        return { id: String(l.id), origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, distance: l.distance ? parseFloat(String(l.distance)) : 0, ratePerMile: (l.rate && l.distance) ? Math.round((parseFloat(String(l.rate)) / parseFloat(String(l.distance))) * 100) / 100 : 0 };
      });
    } catch (e) { return []; }
  }),

  getStats: protectedProcedure.query(async () => {
    const db = await getDb(); if (!db) return { totalLanes: 0, avgRate: 0, topLane: "" };
    try {
      const [stats] = await db.select({ count: sql<number>`count(*)`, avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(sql`${loads.rate} > 0`);
      return { totalLanes: stats?.count || 0, avgRate: Math.round(stats?.avg || 0), topLane: "" };
    } catch (e) { return { totalLanes: 0, avgRate: 0, topLane: "" }; }
  }),

  calculate: protectedProcedure.input(z.object({ origin: z.string(), destination: z.string() })).query(async ({ input }) => ({
    origin: input.origin, destination: input.destination, estimatedRate: 0, miles: 0,
  })),

  getSummary: protectedProcedure.query(async () => {
    const db = await getDb(); if (!db) return { totalLanes: 0, avgRate: 0, trending: "stable", rateChange: 0, avgMiles: 0 };
    try {
      const [stats] = await db.select({ count: sql<number>`count(*)`, avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`, avgMiles: sql<number>`COALESCE(AVG(CAST(${loads.distance} AS DECIMAL)), 0)` }).from(loads).where(sql`${loads.rate} > 0`);
      return { totalLanes: stats?.count || 0, avgRate: Math.round(stats?.avg || 0), trending: "stable", rateChange: 0, avgMiles: Math.round(stats?.avgMiles || 0) };
    } catch (e) { return { totalLanes: 0, avgRate: 0, trending: "stable", rateChange: 0, avgMiles: 0 }; }
  }),
  getTopLanes: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const rows = await db.select().from(loads).where(sql`${loads.rate} > 0 AND ${loads.status} = 'delivered'`).orderBy(sql`CAST(${loads.rate} AS DECIMAL) DESC`).limit(input?.limit || 10);
      return rows.map(l => {
        const p = l.pickupLocation as any || {};
        const d = l.deliveryLocation as any || {};
        return { origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, volume: 1 };
      });
    } catch (e) { return []; }
  }),
});
