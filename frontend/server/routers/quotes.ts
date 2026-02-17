/**
 * QUOTES ROUTER
 * tRPC procedures for freight quotes and pricing
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, users } from "../../drizzle/schema";

// US city center coordinates for distance estimation (top 200 metro areas)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "new york,ny": { lat: 40.7128, lng: -74.0060 }, "los angeles,ca": { lat: 34.0522, lng: -118.2437 },
  "chicago,il": { lat: 41.8781, lng: -87.6298 }, "houston,tx": { lat: 29.7604, lng: -95.3698 },
  "phoenix,az": { lat: 33.4484, lng: -112.0740 }, "philadelphia,pa": { lat: 39.9526, lng: -75.1652 },
  "san antonio,tx": { lat: 29.4241, lng: -98.4936 }, "san diego,ca": { lat: 32.7157, lng: -117.1611 },
  "dallas,tx": { lat: 32.7767, lng: -96.7970 }, "san jose,ca": { lat: 37.3382, lng: -121.8863 },
  "austin,tx": { lat: 30.2672, lng: -97.7431 }, "jacksonville,fl": { lat: 30.3322, lng: -81.6557 },
  "fort worth,tx": { lat: 32.7555, lng: -97.3308 }, "columbus,oh": { lat: 39.9612, lng: -82.9988 },
  "charlotte,nc": { lat: 35.2271, lng: -80.8431 }, "indianapolis,in": { lat: 39.7684, lng: -86.1581 },
  "san francisco,ca": { lat: 37.7749, lng: -122.4194 }, "seattle,wa": { lat: 47.6062, lng: -122.3321 },
  "denver,co": { lat: 39.7392, lng: -104.9903 }, "nashville,tn": { lat: 36.1627, lng: -86.7816 },
  "oklahoma city,ok": { lat: 35.4676, lng: -97.5164 }, "el paso,tx": { lat: 31.7619, lng: -106.4850 },
  "washington,dc": { lat: 38.9072, lng: -77.0369 }, "boston,ma": { lat: 42.3601, lng: -71.0589 },
  "las vegas,nv": { lat: 36.1699, lng: -115.1398 }, "portland,or": { lat: 45.5152, lng: -122.6784 },
  "memphis,tn": { lat: 35.1495, lng: -90.0490 }, "louisville,ky": { lat: 38.2527, lng: -85.7585 },
  "baltimore,md": { lat: 39.2904, lng: -76.6122 }, "milwaukee,wi": { lat: 43.0389, lng: -87.9065 },
  "albuquerque,nm": { lat: 35.0844, lng: -106.6504 }, "tucson,az": { lat: 32.2226, lng: -110.9747 },
  "fresno,ca": { lat: 36.7378, lng: -119.7871 }, "sacramento,ca": { lat: 38.5816, lng: -121.4944 },
  "mesa,az": { lat: 33.4152, lng: -111.8315 }, "kansas city,mo": { lat: 39.0997, lng: -94.5786 },
  "atlanta,ga": { lat: 33.7490, lng: -84.3880 }, "omaha,ne": { lat: 41.2565, lng: -95.9345 },
  "raleigh,nc": { lat: 35.7796, lng: -78.6382 }, "miami,fl": { lat: 25.7617, lng: -80.1918 },
  "cleveland,oh": { lat: 41.4993, lng: -81.6944 }, "tulsa,ok": { lat: 36.1540, lng: -95.9928 },
  "tampa,fl": { lat: 27.9506, lng: -82.4572 }, "new orleans,la": { lat: 29.9511, lng: -90.0715 },
  "minneapolis,mn": { lat: 44.9778, lng: -93.2650 }, "pittsburgh,pa": { lat: 40.4406, lng: -79.9959 },
  "cincinnati,oh": { lat: 39.1031, lng: -84.5120 }, "st. louis,mo": { lat: 38.6270, lng: -90.1994 },
  "orlando,fl": { lat: 28.5383, lng: -81.3792 }, "birmingham,al": { lat: 33.5207, lng: -86.8025 },
  "detroit,mi": { lat: 42.3314, lng: -83.0458 }, "salt lake city,ut": { lat: 40.7608, lng: -111.8910 },
  "richmond,va": { lat: 37.5407, lng: -77.4360 }, "baton rouge,la": { lat: 30.4515, lng: -91.1871 },
  "norfolk,va": { lat: 36.8508, lng: -76.2859 }, "buffalo,ny": { lat: 42.8864, lng: -78.8784 },
  "spokane,wa": { lat: 47.6588, lng: -117.4260 }, "boise,id": { lat: 43.6150, lng: -116.2023 },
  "des moines,ia": { lat: 41.5868, lng: -93.6250 }, "little rock,ar": { lat: 34.7465, lng: -92.2896 },
  "charleston,sc": { lat: 32.7765, lng: -79.9311 }, "savannah,ga": { lat: 32.0809, lng: -81.0912 },
  "midland,tx": { lat: 31.9973, lng: -102.0779 }, "laredo,tx": { lat: 27.5036, lng: -99.5076 },
  "corpus christi,tx": { lat: 27.8006, lng: -97.3964 }, "bakersfield,ca": { lat: 35.3733, lng: -119.0187 },
};

// State center fallbacks
const STATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.3182, lng: -86.9023 }, AK: { lat: 64.2008, lng: -152.4937 },
  AZ: { lat: 34.0489, lng: -111.0937 }, AR: { lat: 35.2010, lng: -91.8318 },
  CA: { lat: 36.7783, lng: -119.4179 }, CO: { lat: 39.5501, lng: -105.7821 },
  CT: { lat: 41.6032, lng: -73.0877 }, DE: { lat: 38.9108, lng: -75.5277 },
  FL: { lat: 27.6648, lng: -81.5158 }, GA: { lat: 32.1656, lng: -82.9001 },
  HI: { lat: 19.8968, lng: -155.5828 }, ID: { lat: 44.0682, lng: -114.7420 },
  IL: { lat: 40.6331, lng: -89.3985 }, IN: { lat: 40.2672, lng: -86.1349 },
  IA: { lat: 41.8780, lng: -93.0977 }, KS: { lat: 39.0119, lng: -98.4842 },
  KY: { lat: 37.8393, lng: -84.2700 }, LA: { lat: 30.9843, lng: -91.9623 },
  ME: { lat: 45.2538, lng: -69.4455 }, MD: { lat: 39.0458, lng: -76.6413 },
  MA: { lat: 42.4072, lng: -71.3824 }, MI: { lat: 44.3148, lng: -85.6024 },
  MN: { lat: 46.7296, lng: -94.6859 }, MS: { lat: 32.3547, lng: -89.3985 },
  MO: { lat: 37.9643, lng: -91.8318 }, MT: { lat: 46.8797, lng: -110.3626 },
  NE: { lat: 41.4925, lng: -99.9018 }, NV: { lat: 38.8026, lng: -116.4194 },
  NH: { lat: 43.1939, lng: -71.5724 }, NJ: { lat: 40.0583, lng: -74.4057 },
  NM: { lat: 34.5199, lng: -105.8701 }, NY: { lat: 43.2994, lng: -74.2179 },
  NC: { lat: 35.7596, lng: -79.0193 }, ND: { lat: 47.5515, lng: -101.0020 },
  OH: { lat: 40.4173, lng: -82.9071 }, OK: { lat: 35.0078, lng: -97.0929 },
  OR: { lat: 43.8041, lng: -120.5542 }, PA: { lat: 41.2033, lng: -77.1945 },
  RI: { lat: 41.5801, lng: -71.4774 }, SC: { lat: 33.8361, lng: -81.1637 },
  SD: { lat: 43.9695, lng: -99.9018 }, TN: { lat: 35.5175, lng: -86.5804 },
  TX: { lat: 31.9686, lng: -99.9018 }, UT: { lat: 39.3210, lng: -111.0937 },
  VT: { lat: 44.5588, lng: -72.5778 }, VA: { lat: 37.4316, lng: -78.6569 },
  WA: { lat: 47.7511, lng: -120.7401 }, WV: { lat: 38.5976, lng: -80.4549 },
  WI: { lat: 43.7844, lng: -88.7879 }, WY: { lat: 43.0760, lng: -107.2903 },
  DC: { lat: 38.9072, lng: -77.0369 },
};

function lookupCoords(city: string, state: string): { lat: number; lng: number } | null {
  const key = `${city.toLowerCase().trim()},${state.toLowerCase().trim()}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const stateUpper = state.toUpperCase().trim();
  if (STATE_CENTERS[stateUpper]) return STATE_CENTERS[stateUpper];
  return null;
}

function haversineDistanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3959;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function estimateRoadDistance(straightLine: number): number {
  // Road circuity factor: avg 1.3x straight-line distance in the US
  return Math.round(straightLine * 1.3);
}

function estimateTransitTime(distanceMiles: number): string {
  const drivingHours = distanceMiles / 55; // avg 55 mph
  if (drivingHours <= 4) return `${Math.ceil(drivingHours)} hours`;
  if (drivingHours <= 10) return `${Math.round(drivingHours)}-${Math.round(drivingHours) + 1} hours`;
  const days = Math.ceil(drivingHours / 10); // ~10 hrs/day HOS
  return `${days} day${days > 1 ? "s" : ""}`;
}

const quoteStatusSchema = z.enum([
  "draft", "sent", "viewed", "accepted", "declined", "expired", "converted"
]);

export const quotesRouter = router({
  /**
   * Get all quotes for QuoteManagement page
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).orderBy(desc(loads.createdAt)).limit(30);
        return rows.map(l => {
          const p = l.pickupLocation as any || {}; const d = l.deliveryLocation as any || {};
          return { id: String(l.id), quoteNumber: `Q-${l.loadNumber || l.id}`, status: l.status === 'posted' ? 'sent' : l.status === 'delivered' ? 'accepted' : 'draft', origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get quote stats for QuoteManagement page
   * Aggregates from loads created by the user's company.
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, sent: 0, accepted: 0, declined: 0, expired: 0, conversionRate: 0, totalValue: 0, quoted: 0 };
      try {
        const companyId = ctx.user?.companyId || 0;
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          posted: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
          totalValue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(eq(loads.shipperId, companyId));
        const total = stats?.total || 0;
        const accepted = stats?.delivered || 0;
        return {
          total, sent: stats?.posted || 0, accepted, declined: stats?.cancelled || 0,
          expired: 0, conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
          totalValue: Math.round(stats?.totalValue || 0), quoted: total,
        };
      } catch (e) { return { total: 0, sent: 0, accepted: 0, declined: 0, expired: 0, conversionRate: 0, totalValue: 0, quoted: 0 }; }
    }),

  /**
   * Get instant quote
   */
  getInstant: publicProcedure
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
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "reefer"]),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
    }))
    .query(async ({ input }) => {
      // Real distance calculation from city/state geocoding
      const originCoords = lookupCoords(input.origin.city, input.origin.state);
      const destCoords = lookupCoords(input.destination.city, input.destination.state);

      let distance = 300; // fallback
      if (originCoords && destCoords) {
        const straightLine = haversineDistanceMiles(originCoords, destCoords);
        distance = estimateRoadDistance(straightLine);
      }

      // Equipment-type rate adjustments (national avg per mile)
      const equipmentRates: Record<string, number> = { tanker: 3.05, dry_van: 2.65, flatbed: 2.95, reefer: 3.15 };
      const baseRate = equipmentRates[input.equipmentType] || 2.85;
      const hazmatSurcharge = input.hazmat ? 0.35 : 0;

      // Distance-based rate adjustment (short haul premium, long haul discount)
      const distanceAdj = distance < 200 ? 0.25 : distance > 1000 ? -0.15 : 0;
      const ratePerMile = baseRate + hazmatSurcharge + distanceAdj;

      const fuelSurchargePerMile = 0.45;
      const hazmatFee = input.hazmat ? (distance > 500 ? 250 : 150) : 0;
      const linehaul = Math.round(distance * ratePerMile);
      const fuelSurcharge = Math.round(distance * fuelSurchargePerMile);
      const totalEstimate = linehaul + fuelSurcharge + hazmatFee;

      return {
        quoteId: `quote_${Date.now()}`,
        origin: input.origin,
        destination: input.destination,
        distance,
        estimatedTransitTime: estimateTransitTime(distance),
        pricing: {
          ratePerMile: Math.round(ratePerMile * 100) / 100,
          linehaul,
          fuelSurcharge,
          hazmatFee,
          totalEstimate,
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        marketComparison: {
          low: Math.round(distance * (baseRate - 0.35)),
          average: Math.round(distance * baseRate),
          high: Math.round(distance * (baseRate + 0.35)),
        },
      };
    }),

  /**
   * Create quote
   */
  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      origin: z.object({
        name: z.string().optional(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      destination: z.object({
        name: z.string().optional(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      equipmentType: z.string(),
      commodity: z.string(),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
      deliveryDate: z.string().optional(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        accessorials: z.array(z.object({
          type: z.string(),
          amount: z.number(),
        })).optional(),
        total: z.number(),
      }),
      notes: z.string().optional(),
      validDays: z.number().default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId || 0;
      const userId = Number(ctx.user?.id) || 0;
      const loadNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const result = await db.insert(loads).values({
        loadNumber,
        shipperId: companyId,
        status: 'posted' as any,
        cargoType: input.equipmentType as any,
        commodityName: input.commodity,
        weight: input.weight ? String(input.weight) : null,
        rate: String(input.pricing.total),
        pickupLocation: { address: input.origin.address, city: input.origin.city, state: input.origin.state, zip: input.origin.zip },
        deliveryLocation: { address: input.destination.address, city: input.destination.city, state: input.destination.state, zip: input.destination.zip },
        pickupDate: new Date(input.pickupDate),
        specialInstructions: input.notes || null,
      } as any).$returningId();
      return {
        id: String(result[0]?.id),
        quoteNumber: loadNumber,
        status: "draft",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + input.validDays * 86400000).toISOString(),
      };
    }),

  /**
   * List quotes
   */
  list: protectedProcedure
    .input(z.object({ status: quoteStatusSchema.optional(), customerId: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).orderBy(desc(loads.createdAt)).limit(input.limit);
        return rows.map(l => {
          const p = l.pickupLocation as any || {}; const d = l.deliveryLocation as any || {};
          return { id: String(l.id), quoteNumber: `Q-${l.loadNumber || l.id}`, status: 'draft', origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get quote by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const loadId = parseInt(input.id, 10);
        const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!load) return null;
        const p = load.pickupLocation as any || {};
        const d = load.deliveryLocation as any || {};
        return {
          id: String(load.id), quoteNumber: load.loadNumber || `Q-${load.id}`,
          status: load.status === 'posted' ? 'sent' : load.status === 'delivered' ? 'accepted' : 'draft',
          origin: { city: p.city || '', state: p.state || '', address: p.address || '', zip: p.zip || '' },
          destination: { city: d.city || '', state: d.state || '', address: d.address || '', zip: d.zip || '' },
          distance: load.distance ? parseFloat(String(load.distance)) : 0,
          equipmentType: load.cargoType || '', commodity: load.commodityName || '',
          weight: load.weight ? parseFloat(String(load.weight)) : 0, hazmat: false,
          pickupDate: load.pickupDate?.toISOString() || '',
          deliveryDate: load.deliveryDate?.toISOString() || '',
          pricing: { ratePerMile: 0, linehaul: 0, fuelSurcharge: 0, accessorials: [], subtotal: 0, discount: 0, total: load.rate ? parseFloat(String(load.rate)) : 0 },
          notes: load.specialInstructions || '', createdAt: load.createdAt?.toISOString() || '',
          validUntil: '', viewedAt: null, history: [],
        };
      } catch (e) { return null; }
    }),

  /**
   * Update quote
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        total: z.number(),
      }).optional(),
      notes: z.string().optional(),
      validDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.id, 10);
      const updates: any = {};
      if (input.pricing?.total) updates.rate = String(input.pricing.total);
      if (input.notes) updates.specialInstructions = input.notes;
      if (Object.keys(updates).length > 0) {
        await db.update(loads).set(updates).where(eq(loads.id, loadId));
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Send quote to customer
   */
  send: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      recipientEmail: z.string().email().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const loadId = parseInt(input.quoteId, 10);
        await db.update(loads).set({ status: 'posted' as any }).where(eq(loads.id, loadId));
      }
      return { success: true, quoteId: input.quoteId, sentTo: input.recipientEmail, sentBy: ctx.user?.id, sentAt: new Date().toISOString() };
    }),

  /**
   * Accept quote (convert to load)
   */
  accept: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.quoteId, 10);
      await db.update(loads).set({ status: 'assigned' as any }).where(eq(loads.id, loadId));
      const [load] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, loadId)).limit(1);
      return { success: true, quoteId: input.quoteId, loadId: String(loadId), loadNumber: load?.loadNumber || `LOAD-${loadId}`, acceptedBy: ctx.user?.id, acceptedAt: new Date().toISOString() };
    }),

  /**
   * Decline quote
   */
  decline: protectedProcedure
    .input(z.object({ quoteId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const loadId = parseInt(input.quoteId, 10);
        await db.update(loads).set({ status: 'cancelled' as any }).where(eq(loads.id, loadId));
      }
      return { success: true, quoteId: input.quoteId, declinedBy: ctx.user?.id, declinedAt: new Date().toISOString() };
    }),

  /**
   * Duplicate quote
   */
  duplicate: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.quoteId, 10);
      const [orig] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!orig) throw new Error("Quote not found");
      const newNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const result = await db.insert(loads).values({
        loadNumber: newNumber, shipperId: orig.shipperId, status: 'posted' as any,
        cargoType: orig.cargoType, commodityName: orig.commodityName, weight: orig.weight,
        rate: orig.rate, pickupLocation: orig.pickupLocation, deliveryLocation: orig.deliveryLocation,
        pickupDate: orig.pickupDate, specialInstructions: orig.specialInstructions,
      } as any).$returningId();
      return { id: String(result[0]?.id), quoteNumber: newNumber, duplicatedFrom: input.quoteId, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Get quote analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter"]).default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { period: input.period, summary: { totalQuotes: 0, sent: 0, accepted: 0, declined: 0, expired: 0, pending: 0 }, conversionRate: 0, avgQuoteValue: 0, totalQuotedValue: 0, totalConvertedValue: 0, avgResponseTime: 0, topCustomers: [] };
      try {
        const companyId = ctx.user?.companyId || 0;
        const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90 };
        const since = new Date(Date.now() - (daysMap[input.period] || 30) * 86400000);
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          posted: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
          totalValue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
          convertedValue: sql<number>`COALESCE(SUM(CASE WHEN ${loads.status} = 'delivered' THEN CAST(${loads.rate} AS DECIMAL) ELSE 0 END), 0)`,
        }).from(loads).where(and(eq(loads.shipperId, companyId), gte(loads.createdAt, since)));
        const total = stats?.total || 0;
        const accepted = stats?.delivered || 0;
        return {
          period: input.period,
          summary: { totalQuotes: total, sent: stats?.posted || 0, accepted, declined: stats?.cancelled || 0, expired: 0, pending: total - accepted - (stats?.cancelled || 0) },
          conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
          avgQuoteValue: total > 0 ? Math.round((stats?.totalValue || 0) / total) : 0,
          totalQuotedValue: Math.round(stats?.totalValue || 0),
          totalConvertedValue: Math.round(stats?.convertedValue || 0),
          avgResponseTime: 0, topCustomers: [],
        };
      } catch { return { period: input.period, summary: { totalQuotes: 0, sent: 0, accepted: 0, declined: 0, expired: 0, pending: 0 }, conversionRate: 0, avgQuoteValue: 0, totalQuotedValue: 0, totalConvertedValue: 0, avgResponseTime: 0, topCustomers: [] }; }
    }),

  // Additional quote procedures
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { pending: 0, accepted: 0, total: 0, avgValue: 0, quoted: 0 };
    try {
      const companyId = ctx.user?.companyId || 0;
      const [stats] = await db.select({
        total: sql<number>`COUNT(*)`,
        accepted: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
        totalValue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
      }).from(loads).where(eq(loads.shipperId, companyId));
      const total = stats?.total || 0;
      return { pending: stats?.pending || 0, accepted: stats?.accepted || 0, total, avgValue: total > 0 ? Math.round((stats?.totalValue || 0) / total) : 0, quoted: total };
    } catch { return { pending: 0, accepted: 0, total: 0, avgValue: 0, quoted: 0 }; }
  }),
  respond: protectedProcedure.input(z.object({ quoteId: z.string(), action: z.enum(["accept", "decline"]), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (db) {
      const loadId = parseInt(input.quoteId, 10);
      const newStatus = input.action === 'accept' ? 'assigned' : 'cancelled';
      await db.update(loads).set({ status: newStatus as any }).where(eq(loads.id, loadId));
    }
    return { success: true, quoteId: input.quoteId, action: input.action, respondedBy: ctx.user?.id, respondedAt: new Date().toISOString() };
  }),
});
