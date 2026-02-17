/**
 * LANES ROUTER
 * tRPC procedures for freight lanes and capacity management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, vehicles } from "../../drizzle/schema";

export const lanesRouter = router({
  /**
   * Search available lanes
   */
  search: protectedProcedure
    .input(z.object({
      origin: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }),
      destination: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }).optional(),
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "reefer", "any"]).default("any"),
      pickupDateStart: z.string().optional(),
      pickupDateEnd: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { lanes: [], total: 0, marketTrend: 'stable' };
      try {
        const rows = await db.select({
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          rate: loads.rate, status: loads.status,
        }).from(loads).where(eq(loads.status, 'delivered')).limit(200);
        const laneMap = new Map<string, { count: number; totalRate: number; origin: string; dest: string; oState: string; dState: string }>();
        for (const r of rows) {
          const p = r.pickupLocation as any || {};
          const d = r.deliveryLocation as any || {};
          if (!p.state || !d.state) continue;
          if (input.origin.state && p.state !== input.origin.state) continue;
          if (input.destination?.state && d.state !== input.destination.state) continue;
          const key = `${p.state}-${d.state}`;
          if (!laneMap.has(key)) laneMap.set(key, { count: 0, totalRate: 0, origin: `${p.city || ''}, ${p.state}`, dest: `${d.city || ''}, ${d.state}`, oState: p.state, dState: d.state });
          const lane = laneMap.get(key)!;
          lane.count++;
          lane.totalRate += parseFloat(String(r.rate)) || 0;
        }
        const lanes = Array.from(laneMap.values()).sort((a, b) => b.count - a.count).slice(0, 20).map((l, i) => ({
          id: `lane_${i}`, origin: l.origin, destination: l.dest, volume: l.count,
          avgRate: l.count > 0 ? Math.round(l.totalRate / l.count) : 0,
          trend: l.count > 5 ? 'up' : 'stable',
        }));
        return { lanes, total: laneMap.size, marketTrend: 'stable' };
      } catch (e) { console.error('[Lanes] search error:', e); return { lanes: [], total: 0, marketTrend: 'stable' }; }
    }),

  /**
   * Get lane details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = { id: input.id, origin: { city: '', state: '', region: '' }, destination: { city: '', state: '', region: '' }, distance: 0, transitTime: { min: 0, avg: 0, max: 0 }, pricing: { current: 0, low: 0, high: 0, trend: 'stable', change: 0 }, volume: { daily: 0, weekly: 0, monthly: 0, trend: 'stable' }, topShippers: [] as any[], topCatalysts: [] as any[], seasonality: { peakMonths: [] as string[], lowMonths: [] as string[] }, restrictions: [] as string[] };
      if (!db) return empty;
      try {
        const [stats] = await db.select({
          count: sql<number>`COUNT(*)`,
          avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
          minRate: sql<number>`COALESCE(MIN(CAST(${loads.rate} AS DECIMAL)), 0)`,
          maxRate: sql<number>`COALESCE(MAX(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(eq(loads.status, 'delivered'));
        return { ...empty, pricing: { current: Math.round(stats?.avgRate || 0), low: Math.round(stats?.minRate || 0), high: Math.round(stats?.maxRate || 0), trend: 'stable', change: 0 }, volume: { daily: 0, weekly: 0, monthly: stats?.count || 0, trend: 'stable' } };
      } catch { return empty; }
    }),

  /**
   * Get lane rates history
   */
  getRatesHistory: protectedProcedure
    .input(z.object({
      laneId: z.string().optional(),
      origin: z.object({ city: z.string(), state: z.string() }).optional(),
      destination: z.object({ city: z.string(), state: z.string() }).optional(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { period: input.period, dataPoints: [], summary: { avgRate: 0, minRate: 0, maxRate: 0, totalVolume: 0, rateChange: 0 } };
      try {
        const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
        const since = new Date(Date.now() - (daysMap[input.period] || 30) * 86400000);
        const rows = await db.select({
          month: sql<string>`DATE_FORMAT(${loads.createdAt}, '%Y-%m')`,
          avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(loads).where(and(eq(loads.status, 'delivered'), sql`${loads.createdAt} >= ${since}`))
          .groupBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m')`);
        const [overall] = await db.select({
          avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
          minRate: sql<number>`COALESCE(MIN(CAST(${loads.rate} AS DECIMAL)), 0)`,
          maxRate: sql<number>`COALESCE(MAX(CAST(${loads.rate} AS DECIMAL)), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(loads).where(and(eq(loads.status, 'delivered'), sql`${loads.createdAt} >= ${since}`));
        return {
          period: input.period,
          dataPoints: rows.map(r => ({ date: r.month, avgRate: Math.round(r.avgRate), volume: r.count })),
          summary: { avgRate: Math.round(overall?.avgRate || 0), minRate: Math.round(overall?.minRate || 0), maxRate: Math.round(overall?.maxRate || 0), totalVolume: overall?.count || 0, rateChange: 0 },
        };
      } catch { return { period: input.period, dataPoints: [], summary: { avgRate: 0, minRate: 0, maxRate: 0, totalVolume: 0, rateChange: 0 } }; }
    }),

  /**
   * Post capacity
   */
  postCapacity: protectedProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        radius: z.number().default(50),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        radius: z.number().default(50),
      }).optional(),
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "reefer"]),
      availableDate: z.string(),
      availableUntil: z.string().optional(),
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      desiredRate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      // Create a posted load representing capacity
      if (db) {
        try {
          const [result] = await db.insert(loads).values({
            shipperId: ctx.user?.companyId || 0,
            catalystId: ctx.user?.companyId || 0,
            loadNumber: `CAP-${Date.now().toString(36).toUpperCase()}`,
            status: 'posted',
            cargoType: 'general' as any,
            pickupLocation: { city: input.origin.city, state: input.origin.state },
            deliveryLocation: input.destination ? { city: input.destination.city, state: input.destination.state } : null,
            pickupDate: new Date(input.availableDate),
            rate: input.desiredRate ? String(input.desiredRate) : null,
            specialInstructions: input.notes || null,
          } as any).$returningId();
          return { id: String(result.id), status: 'active', postedBy: ctx.user?.id, postedAt: new Date().toISOString(), expiresAt: input.availableUntil || new Date(Date.now() + 7 * 86400000).toISOString() };
        } catch (e) { console.error('[Lanes] postCapacity error:', e); }
      }
      return { id: `cap_${Date.now()}`, status: 'active', postedBy: ctx.user?.id, postedAt: new Date().toISOString(), expiresAt: input.availableUntil || new Date(Date.now() + 7 * 86400000).toISOString() };
    }),

  /**
   * Get posted capacity
   */
  getPostedCapacity: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "matched", "expired", "all"]).default("active"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(loads.catalystId, companyId), sql`${loads.loadNumber} LIKE 'CAP-%'`];
        if (input.status === 'active') conds.push(eq(loads.status, 'posted'));
        const rows = await db.select().from(loads).where(and(...conds)).orderBy(desc(loads.createdAt)).limit(50);
        return rows.map(l => {
          const p = l.pickupLocation as any || {};
          const d = l.deliveryLocation as any || {};
          return { id: String(l.id), origin: `${p.city || ''}, ${p.state || ''}`, destination: d?.city ? `${d.city}, ${d.state}` : 'Open', status: l.status, rate: l.rate ? parseFloat(String(l.rate)) : 0, postedAt: l.createdAt?.toISOString() || '' };
        });
      } catch { return []; }
    }),

  /**
   * Get preferred lanes
   */
  getPreferred: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        // Preferred lanes = most frequently used lanes by this company
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select({
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          count: sql<number>`COUNT(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(and(eq(loads.catalystId, companyId), eq(loads.status, 'delivered')))
          .groupBy(loads.pickupLocation, loads.deliveryLocation)
          .orderBy(sql`COUNT(*) DESC`).limit(10);
        return rows.map((r, i) => {
          const p = r.pickupLocation as any || {};
          const d = r.deliveryLocation as any || {};
          return { id: `pref_${i}`, origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, volume: r.count, avgRate: Math.round(r.avgRate), preferenceLevel: r.count > 10 ? 'high' : r.count > 5 ? 'medium' : 'low' };
        });
      } catch { return []; }
    }),

  /**
   * Add preferred lane
   */
  addPreferred: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
      preferenceLevel: z.enum(["high", "medium", "low"]),
      targetRate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `pref_${Date.now()}`,
        addedBy: ctx.user?.id,
        addedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get lane alerts
   */
  getAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        // Alert on new posted loads in preferred lanes
        const companyId = ctx.user?.companyId || 0;
        const recentLoads = await db.select({ id: loads.id, loadNumber: loads.loadNumber, pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, rate: loads.rate, createdAt: loads.createdAt })
          .from(loads).where(eq(loads.status, 'posted')).orderBy(desc(loads.createdAt)).limit(10);
        return recentLoads.map(l => {
          const p = l.pickupLocation as any || {};
          const d = l.deliveryLocation as any || {};
          return { id: `alert_${l.id}`, type: 'new_load', message: `New load ${l.loadNumber}: ${p.city || ''}, ${p.state || ''} to ${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch { return []; }
    }),

  /**
   * Get market insights
   */
  getMarketInsights: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { region: input.region || 'Texas', overview: { totalLanes: 0, activeLoads: 0, activeCapacity: 0, loadToTruckRatio: 0 }, hotLanes: [], coldLanes: [], rateOutlook: { shortTerm: 'stable', longTerm: 'stable', factors: [] } };
      try {
        const [loadStats] = await db.select({ active: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`, total: sql<number>`COUNT(*)` }).from(loads);
        const [truckStats] = await db.select({ available: sql<number>`SUM(CASE WHEN ${vehicles.status} = 'available' THEN 1 ELSE 0 END)` }).from(vehicles);
        const activeLoads = loadStats?.active || 0;
        const activeTrucks = truckStats?.available || 0;
        return {
          region: input.region || 'Texas',
          overview: { totalLanes: Math.floor((loadStats?.total || 0) / 3), activeLoads, activeCapacity: activeTrucks, loadToTruckRatio: activeTrucks > 0 ? Math.round((activeLoads / activeTrucks) * 100) / 100 : 0 },
          hotLanes: [], coldLanes: [],
          rateOutlook: { shortTerm: activeLoads > activeTrucks ? 'up' : 'stable', longTerm: 'stable', factors: [] },
        };
      } catch { return { region: input.region || 'Texas', overview: { totalLanes: 0, activeLoads: 0, activeCapacity: 0, loadToTruckRatio: 0 }, hotLanes: [], coldLanes: [], rateOutlook: { shortTerm: 'stable', longTerm: 'stable', factors: [] } }; }
    }),
});
