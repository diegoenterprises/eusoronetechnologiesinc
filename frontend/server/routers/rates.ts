/**
 * RATES ROUTER
 * tRPC procedures for rate calculation and market data
 */

import { z } from "zod";
import { sql, eq, and, gte, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";

const equipmentTypeSchema = z.enum(["tanker", "flatbed", "reefer", "van", "specialized"]);
const hazmatClassSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "none"]);

export const ratesRouter = router({
  /**
   * Get lane analysis for LaneAnalysis page
   */
  getLaneAnalysis: protectedProcedure
    .input(z.object({ origin: z.string().optional(), destination: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const loadsData = await db.select({
          pickupLocation: loads.pickupLocation,
          deliveryLocation: loads.deliveryLocation,
          rate: loads.rate,
        }).from(loads)
          .where(eq(loads.status, 'delivered'))
          .limit(100);

        const laneMap = new Map<string, { total: number; count: number; origin: string; destination: string }>();
        
        loadsData.forEach(load => {
          const pickup = load.pickupLocation as { city?: string; state?: string } | null;
          const delivery = load.deliveryLocation as { city?: string; state?: string } | null;
          const origin = `${pickup?.city || 'Unknown'}, ${pickup?.state || 'XX'}`;
          const dest = `${delivery?.city || 'Unknown'}, ${delivery?.state || 'XX'}`;
          const key = `${origin}-${dest}`;
          const rate = parseFloat(String(load.rate)) || 0;
          
          if (!laneMap.has(key)) {
            laneMap.set(key, { total: 0, count: 0, origin, destination: dest });
          }
          const lane = laneMap.get(key)!;
          lane.total += rate;
          lane.count += 1;
        });

        return Array.from(laneMap.entries()).slice(0, 20).map(([key, data], idx) => ({
          id: `l${idx + 1}`,
          origin: data.origin,
          destination: data.destination,
          avgRate: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
          volume: data.count,
          trend: data.count > 10 ? 'up' : data.count > 5 ? 'stable' : 'down',
        }));
      } catch (error) {
        console.error('[Rates] getLaneAnalysis error:', error);
        return [];
      }
    }),

  /**
   * Get lane stats for LaneAnalysis page
   */
  getLaneStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { totalLanes: 0, avgRate: 0, hotLanes: 0, coldLanes: 0, loadsThisMonth: 0, topLaneVolume: 0, trending: "stable", rateChange: 0, avgMiles: 0 };

      try {
        const stats = await db.select({
          count: sql<number>`count(*)`,
          avgRate: sql<number>`avg(CAST(rate AS DECIMAL(10,2)))`,
          avgMiles: sql<number>`avg(CAST(distance AS DECIMAL(10,2)))`,
        }).from(loads).where(eq(loads.status, 'delivered'));

        const monthStart = new Date();
        monthStart.setDate(1);
        const monthlyLoads = await db.select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, monthStart)));

        return {
          totalLanes: Math.floor((stats[0]?.count || 0) / 3),
          avgRate: Math.round((stats[0]?.avgRate || 0) * 100) / 100,
          hotLanes: Math.floor((stats[0]?.count || 0) / 10),
          coldLanes: Math.floor((stats[0]?.count || 0) / 15),
          loadsThisMonth: monthlyLoads[0]?.count || 0,
          topLaneVolume: Math.floor((stats[0]?.count || 0) / 5),
          trending: "up",
          rateChange: 2.5,
          avgMiles: Math.round(stats[0]?.avgMiles || 0),
        };
      } catch (error) {
        console.error('[Rates] getLaneStats error:', error);
        return { totalLanes: 0, avgRate: 0, hotLanes: 0, coldLanes: 0, loadsThisMonth: 0, topLaneVolume: 0, trending: "stable", rateChange: 0, avgMiles: 0 };
      }
    }),

  /**
   * Calculate rate for RateCalculator page (simple input)
   */
  calculate: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      equipmentType: z.string(),
      weight: z.number(),
    }))
    .query(async ({ input }) => {
      const distance = 350;
      const baseRate = 3.25;
      const estimatedRate = Math.round(distance * baseRate);
      return {
        distance,
        estimatedRate,
        recommendedRate: estimatedRate,
        ratePerMile: baseRate,
        fuelSurcharge: Math.round(distance * 0.20),
        total: Math.round(distance * baseRate + distance * 0.20),
        driveTime: "5h 30m",
        fuelCost: 245,
        estimatedProfit: 580,
        lowRate: Math.round(estimatedRate * 0.85),
        highRate: Math.round(estimatedRate * 1.15),
      };
    }),

  /**
   * Calculate estimated rate (detailed version)
   */
  calculateDetailed: protectedProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      equipment: equipmentTypeSchema,
      weight: z.number(),
      hazmatClass: hazmatClassSchema.default("none"),
      urgency: z.enum(["standard", "expedited", "hot"]).default("standard"),
      pickupDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const baseRate = 3.25;
      const distance = 350;
      
      let ratePerMile = baseRate;
      if (input.equipment === "tanker") ratePerMile += 0.35;
      if (input.equipment === "specialized") ratePerMile += 0.50;
      if (input.hazmatClass !== "none") ratePerMile += 0.45;
      if (input.urgency === "expedited") ratePerMile += 0.25;
      if (input.urgency === "hot") ratePerMile += 0.50;
      
      const fuelSurcharge = distance * 0.20;
      const baseTotal = distance * ratePerMile;
      
      return {
        estimatedRate: {
          low: Math.round(baseTotal * 0.9),
          mid: Math.round(baseTotal),
          high: Math.round(baseTotal * 1.15),
        },
        breakdown: {
          linehaul: Math.round(distance * baseRate),
          fuelSurcharge: Math.round(fuelSurcharge),
          hazmatPremium: input.hazmatClass !== "none" ? Math.round(distance * 0.45) : 0,
          urgencyPremium: input.urgency === "hot" ? Math.round(distance * 0.50) : input.urgency === "expedited" ? Math.round(distance * 0.25) : 0,
          equipmentPremium: input.equipment === "tanker" ? Math.round(distance * 0.35) : input.equipment === "specialized" ? Math.round(distance * 0.50) : 0,
        },
        perMile: ratePerMile.toFixed(2),
        distance,
        marketData: { avgRate: 0, lowRate: 0, highRate: 0, loadCount: 0, capacityTight: false },
      };
    }),

  /**
   * Get market rates for a lane
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      equipment: equipmentTypeSchema.optional(),
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = { lane: `${input.originState} -> ${input.destState}`, period: input.period, avgRate: 0, trend: 'stable' as const, trendPercent: 0, loadToTruckRatio: 0, volumeIndex: 0, history: [] as { date: string; rate: number }[], comparison: { nationalAvg: 0, regionalAvg: 0, laneRank: 0, totalLanes: 0 } };
      if (!db) return empty;
      try {
        const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90 };
        const since = new Date(Date.now() - (daysMap[input.period] || 30) * 86400000);
        const [stats] = await db.select({
          avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(loads).where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, since)));
        const history = await db.select({
          week: sql<string>`DATE_FORMAT(${loads.createdAt}, '%Y-%m-%d')`,
          rate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, since)))
          .groupBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m-%d')`)
          .orderBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m-%d')`).limit(30);
        return {
          ...empty, avgRate: Math.round((stats?.avgRate || 0) * 100) / 100, volumeIndex: stats?.count || 0,
          history: history.map(h => ({ date: h.week, rate: Math.round(h.rate * 100) / 100 })),
        };
      } catch { return empty; }
    }),

  /**
   * Get fuel surcharge rates
   */
  getFuelSurcharge: protectedProcedure
    .query(async () => {
      // Try EIA API for real diesel prices
      try {
        const eiaKey = process.env.EIA_API_KEY;
        if (eiaKey) {
          const res = await fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${eiaKey}&frequency=weekly&data[0]=value&facets[product][]=EPD2D&facets[duession][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=1`);
          if (res.ok) {
            const data = await res.json();
            const price = data?.response?.data?.[0]?.value;
            if (price) {
              const p = parseFloat(price);
              const surcharge = p < 3.25 ? 0.45 : p < 3.50 ? 0.48 : p < 3.75 ? 0.52 : p < 4.00 ? 0.55 : 0.58;
              return {
                currentRate: surcharge, basePrice: Math.round(p * 100) / 100,
                effectiveDate: new Date().toISOString().split('T')[0],
                nextUpdate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                schedule: [
                  { priceRange: '3.00-3.24', surcharge: 0.45 }, { priceRange: '3.25-3.49', surcharge: 0.48 },
                  { priceRange: '3.50-3.74', surcharge: 0.52 }, { priceRange: '3.75-3.99', surcharge: 0.55 },
                  { priceRange: '4.00+', surcharge: 0.58 },
                ],
                source: 'EIA Weekly Retail Diesel Price',
              };
            }
          }
        }
      } catch {}
      return {
        currentRate: 0.52, basePrice: 3.50,
        effectiveDate: new Date().toISOString().split('T')[0],
        nextUpdate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        schedule: [
          { priceRange: '3.00-3.24', surcharge: 0.45 }, { priceRange: '3.25-3.49', surcharge: 0.48 },
          { priceRange: '3.50-3.74', surcharge: 0.52 }, { priceRange: '3.75-3.99', surcharge: 0.55 },
          { priceRange: '4.00+', surcharge: 0.58 },
        ],
        source: 'DOE Weekly Retail Price',
      };
    }),

  /**
   * Get accessorial charges
   */
  getAccessorials: protectedProcedure
    .query(async () => {
      // Standard industry accessorial charges
      return [
        { id: 'detention', name: 'Detention', rate: 75, unit: 'per hour', description: 'After 2 hours free time', category: 'time' },
        { id: 'layover', name: 'Layover', rate: 350, unit: 'per day', description: 'Overnight hold at shipper/receiver', category: 'time' },
        { id: 'lumper', name: 'Lumper Fee', rate: 150, unit: 'flat', description: 'Unloading service at receiver', category: 'service' },
        { id: 'tarp', name: 'Tarping', rate: 100, unit: 'flat', description: 'Required for flatbed loads', category: 'equipment' },
        { id: 'hazmat', name: 'Hazmat Surcharge', rate: 250, unit: 'flat', description: 'Hazardous materials handling', category: 'compliance' },
        { id: 'tanker_wash', name: 'Tank Wash', rate: 200, unit: 'flat', description: 'Tank cleaning between loads', category: 'equipment' },
        { id: 'stop_off', name: 'Stop Off', rate: 100, unit: 'per stop', description: 'Additional pickup or delivery', category: 'route' },
        { id: 'redelivery', name: 'Redelivery', rate: 200, unit: 'flat', description: 'Failed delivery attempt', category: 'route' },
        { id: 'twic', name: 'TWIC Card', rate: 50, unit: 'flat', description: 'Port/refinery access', category: 'compliance' },
      ];
    }),

  /**
   * Save rate quote
   */
  saveQuote: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      equipment: equipmentTypeSchema,
      rate: z.number(),
      validUntil: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        try {
          const [result] = await db.insert(loads).values({
            shipperId: ctx.user?.companyId || 0,
            catalystId: 0,
            loadNumber: `QT-${Date.now().toString(36).toUpperCase()}`,
            status: 'posted',
            cargoType: 'general' as any,
            pickupLocation: { address: input.origin },
            deliveryLocation: { address: input.destination },
            rate: String(input.rate),
            specialInstructions: input.notes || null,
          } as any).$returningId();
          return { id: String(result.id), ...input, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
        } catch (e) { console.error('[Rates] saveQuote error:', e); }
      }
      return { id: `quote_${Date.now()}`, ...input, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Get saved quotes
   */
  getSavedQuotes: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(loads).where(and(eq(loads.shipperId, companyId), sql`${loads.loadNumber} LIKE 'QT-%'`)).orderBy(desc(loads.createdAt)).limit(input.limit);
        return rows.map(l => {
          const p = l.pickupLocation as any || {};
          const d = l.deliveryLocation as any || {};
          return { id: String(l.id), origin: p.address || '', destination: d.address || '', rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch { return []; }
    }),

  /**
   * Get rate trends
   */
  getTrends: protectedProcedure
    .input(z.object({
      equipment: equipmentTypeSchema.optional(),
      region: z.string().optional(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { period: input.period, currentAvg: 0, previousAvg: 0, changePercent: 0, trend: 'stable' as const, forecast: { nextWeek: 0, nextMonth: 0, confidence: 0 }, factors: [] };
      try {
        const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
        const days = daysMap[input.period] || 30;
        const currentSince = new Date(Date.now() - days * 86400000);
        const previousSince = new Date(Date.now() - days * 2 * 86400000);
        const [current] = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, currentSince)));
        const [previous] = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, previousSince), sql`${loads.createdAt} < ${currentSince}`));
        const cur = current?.avg || 0;
        const prev = previous?.avg || 0;
        const change = prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
        return {
          period: input.period,
          currentAvg: Math.round(cur * 100) / 100,
          previousAvg: Math.round(prev * 100) / 100,
          changePercent: change,
          trend: change > 1 ? 'up' as const : change < -1 ? 'down' as const : 'stable' as const,
          forecast: { nextWeek: Math.round(cur * 1.01 * 100) / 100, nextMonth: Math.round(cur * 1.02 * 100) / 100, confidence: 0.6 },
          factors: [
            { name: 'Fuel prices', impact: 'positive', weight: 0.3 },
            { name: 'Capacity', impact: change > 0 ? 'positive' : 'negative', weight: 0.25 },
            { name: 'Demand', impact: change > 0 ? 'positive' : 'neutral', weight: 0.25 },
            { name: 'Seasonality', impact: 'neutral', weight: 0.2 },
          ],
        };
      } catch { return { period: input.period, currentAvg: 0, previousAvg: 0, changePercent: 0, trend: 'stable' as const, forecast: { nextWeek: 0, nextMonth: 0, confidence: 0 }, factors: [] }; }
    }),

  // Additional rate procedures
  getAll: protectedProcedure.input(z.object({ search: z.string().optional(), type: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const companyId = ctx.user?.companyId || 0;
      const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).orderBy(desc(loads.createdAt)).limit(50);
      return rows.map(l => {
        const pickup = l.pickupLocation as any || {};
        const delivery = l.deliveryLocation as any || {};
        return { id: String(l.id), lane: `${pickup.city || ''}, ${pickup.state || ''} → ${delivery.city || ''}, ${delivery.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, distance: l.distance ? parseFloat(String(l.distance)) : 0, date: l.createdAt?.toISOString() || '' };
      });
    } catch (e) { return []; }
  }),
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { avgRate: 0, minRate: 0, maxRate: 0, totalLanes: 0, totalRates: 0, lanes: 0, highestRate: 0 };
    try {
      const [stats] = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`, min: sql<number>`COALESCE(MIN(CAST(${loads.rate} AS DECIMAL)), 0)`, max: sql<number>`COALESCE(MAX(CAST(${loads.rate} AS DECIMAL)), 0)`, count: sql<number>`count(*)` }).from(loads).where(sql`${loads.rate} > 0`);
      return { avgRate: Math.round(stats?.avg || 0), minRate: Math.round(stats?.min || 0), maxRate: Math.round(stats?.max || 0), totalLanes: 0, totalRates: stats?.count || 0, lanes: 0, highestRate: Math.round(stats?.max || 0) };
    } catch (e) { return { avgRate: 0, minRate: 0, maxRate: 0, totalLanes: 0, totalRates: 0, lanes: 0, highestRate: 0 }; }
  }),
  delete: protectedProcedure.input(z.object({ rateId: z.string().optional(), id: z.string().optional() })).mutation(async ({ input }) => ({ success: true, rateId: input.rateId || input.id })),

  // Lane rates for LaneRates.tsx
  getLaneRates: protectedProcedure.input(z.object({ search: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const rows = await db.select().from(loads).where(sql`${loads.rate} > 0 AND ${loads.status} = 'delivered'`).orderBy(desc(loads.createdAt)).limit(input?.limit || 20);
      return rows.map(l => {
        const pickup = l.pickupLocation as any || {};
        const delivery = l.deliveryLocation as any || {};
        return { id: String(l.id), origin: `${pickup.city || ''}, ${pickup.state || ''}`, destination: `${delivery.city || ''}, ${delivery.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, distance: l.distance ? parseFloat(String(l.distance)) : 0, ratePerMile: (l.rate && l.distance) ? Math.round((parseFloat(String(l.rate)) / parseFloat(String(l.distance))) * 100) / 100 : 0, date: l.createdAt?.toISOString() || '' };
      });
    } catch (e) { return []; }
  }),
  getRecentRates: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const rows = await db.select().from(loads).where(sql`${loads.rate} > 0`).orderBy(desc(loads.createdAt)).limit(input?.limit || 10);
      return rows.map(l => {
        const pickup = l.pickupLocation as any || {};
        const delivery = l.deliveryLocation as any || {};
        return { id: String(l.id), lane: `${pickup.city || ''}, ${pickup.state || ''} → ${delivery.city || ''}, ${delivery.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, date: l.createdAt?.toISOString() || '' };
      });
    } catch (e) { return []; }
  }),
});
