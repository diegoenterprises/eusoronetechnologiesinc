/**
 * MARKET ROUTER
 * tRPC procedures for market intelligence and rates
 */

import { z } from "zod";
import { sql, eq, desc, gte, and } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, vehicles } from "../../drizzle/schema";

export const marketRouter = router({
  /**
   * Get market intelligence for MarketIntelligence page
   */
  getIntelligence: protectedProcedure
    .input(z.object({ region: z.string().optional(), timeframe: z.string().optional() }).optional())
    .query(async () => {
      const db = await getDb(); if (!db) return { avgRate: 0, rateChange: 0, volume: 0, volumeChange: 0, capacityIndex: 0, demandIndex: 0, avgSpotRate: 0, loadToTruckRatio: 0, totalLoads: 0 };
      try {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const [current] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(gte(loads.createdAt, weekAgo));
        const [previous] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(and(gte(loads.createdAt, twoWeeksAgo), sql`${loads.createdAt} < ${weekAgo}`));
        const [totalLoads] = await db.select({ count: sql<number>`count(*)` }).from(loads);
        const [availableTrucks] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, 'available'));
        const curVol = current?.count || 0; const prevVol = previous?.count || 0;
        const volChange = prevVol > 0 ? Math.round(((curVol - prevVol) / prevVol) * 100 * 10) / 10 : 0;
        const curRate = Math.round(current?.avgRate || 0); const prevRate = Math.round(previous?.avgRate || 0);
        const rateChange = prevRate > 0 ? Math.round(((curRate - prevRate) / prevRate) * 100 * 10) / 10 : 0;
        const trucks = availableTrucks?.count || 1;
        return { avgRate: curRate, rateChange, volume: curVol, volumeChange: volChange, capacityIndex: trucks, demandIndex: curVol, avgSpotRate: curRate, loadToTruckRatio: trucks > 0 ? Math.round((curVol / trucks) * 10) / 10 : 0, totalLoads: totalLoads?.count || 0 };
      } catch (e) { console.error('[Market] getIntelligence error:', e); return { avgRate: 0, rateChange: 0, volume: 0, volumeChange: 0, capacityIndex: 0, demandIndex: 0, avgSpotRate: 0, loadToTruckRatio: 0, totalLoads: 0 }; }
    }),

  /**
   * Get market trends
   */
  getTrends: protectedProcedure
    .input(z.object({ region: z.string().optional(), timeframe: z.string().optional() }))
    .query(async () => {
      const db = await getDb(); if (!db) return [];
      try {
        const trends: Array<{ month: string; avgRate: number; volume: number }> = [];
        for (let i = 5; i >= 0; i--) {
          const start = new Date(); start.setMonth(start.getMonth() - i, 1); start.setHours(0, 0, 0, 0);
          const end = new Date(start); end.setMonth(end.getMonth() + 1);
          const [stats] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(and(gte(loads.createdAt, start), sql`${loads.createdAt} < ${end}`));
          trends.push({ month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), avgRate: Math.round(stats?.avgRate || 0), volume: stats?.count || 0 });
        }
        return trends;
      } catch (e) { return []; }
    }),

  /**
   * Get hot lanes
   */
  getHotLanes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        const rows = await db.select({ pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(gte(loads.createdAt, monthAgo)).groupBy(loads.pickupLocation, loads.deliveryLocation).orderBy(desc(sql`count(*)`)).limit(input.limit);
        return rows.map((r, idx) => {
          const p = r.pickupLocation as any || {}; const d = r.deliveryLocation as any || {};
          return { rank: idx + 1, origin: p.city && p.state ? `${p.city}, ${p.state}` : 'Unknown', destination: d.city && d.state ? `${d.city}, ${d.state}` : 'Unknown', volume: r.count || 0, avgRate: Math.round(r.avgRate || 0) };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get capacity by region
   */
  getCapacity: protectedProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async () => {
      const db = await getDb(); if (!db) return { available: 0, inUse: 0, utilization: 0, trend: 'stable', regions: [] };
      try {
        const [available] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, 'available'));
        const [inUse] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, 'in_use'));
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
        const totalCount = total?.count || 1;
        const utilization = totalCount > 0 ? Math.round(((inUse?.count || 0) / totalCount) * 100) : 0;
        return { available: available?.count || 0, inUse: inUse?.count || 0, utilization, trend: utilization > 75 ? 'tight' : utilization > 50 ? 'balanced' : 'loose', regions: [] };
      } catch (e) { return { available: 0, inUse: 0, utilization: 0, trend: 'stable', regions: [] }; }
    }),
});
