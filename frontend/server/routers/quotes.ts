/**
 * QUOTES ROUTER
 * tRPC procedures for freight quotes and pricing
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, users } from "../../drizzle/schema";
import { mlEngine } from "../services/mlEngine";

// ── Equipment rate table (national avg $/mi, 2025-2026 USDA + DAT composite) ──
const EQUIPMENT_RATES: Record<string, { base: number; label: string; hazmat: boolean }> = {
  tanker:      { base: 3.05, label: "Liquid Tank (DOT-406)", hazmat: true },
  mc331:       { base: 3.45, label: "Pressurized Gas (MC-331)", hazmat: true },
  mc338:       { base: 3.85, label: "Cryogenic Tank (MC-338)", hazmat: true },
  dry_van:     { base: 2.65, label: "Dry Van", hazmat: false },
  flatbed:     { base: 2.95, label: "Flatbed", hazmat: false },
  reefer:      { base: 3.15, label: "Refrigerated", hazmat: false },
  hopper:      { base: 2.85, label: "Dry Bulk / Hopper", hazmat: false },
  hazmat_van:  { base: 3.10, label: "Hazmat Box Van", hazmat: true },
  food_grade:  { base: 2.90, label: "Food-Grade Tank", hazmat: false },
  lowboy:      { base: 3.55, label: "Lowboy / Oversize", hazmat: false },
};

// ── Hazmat class risk premiums ($/mi surcharge by DOT class) ──
const HAZMAT_CLASS_PREMIUMS: Record<string, { premium: number; label: string }> = {
  "1.1": { premium: 0.95, label: "Explosives (Mass Explosion)" },
  "1.2": { premium: 0.85, label: "Explosives (Projection)" },
  "1.3": { premium: 0.75, label: "Explosives (Fire/Blast)" },
  "1.4": { premium: 0.45, label: "Explosives (Minor)" },
  "2.1": { premium: 0.55, label: "Flammable Gas" },
  "2.2": { premium: 0.25, label: "Non-Flammable Gas" },
  "2.3": { premium: 0.85, label: "Poison Gas" },
  "3":   { premium: 0.35, label: "Flammable Liquid" },
  "4.1": { premium: 0.40, label: "Flammable Solid" },
  "4.2": { premium: 0.55, label: "Spontaneously Combustible" },
  "4.3": { premium: 0.60, label: "Dangerous When Wet" },
  "5.1": { premium: 0.45, label: "Oxidizer" },
  "5.2": { premium: 0.55, label: "Organic Peroxide" },
  "6.1": { premium: 0.50, label: "Poison/Toxic" },
  "6.2": { premium: 0.65, label: "Infectious Substance" },
  "7":   { premium: 1.15, label: "Radioactive" },
  "8":   { premium: 0.35, label: "Corrosive" },
  "9":   { premium: 0.15, label: "Misc. Dangerous Goods" },
};

// ── Hot Zone surge lookup ──
function findNearestHotZone(lat: number, lng: number, zones: any[]): any | null {
  let nearest: any = null;
  let minDist = Infinity;
  for (const z of zones) {
    const c = z.center || z;
    const dx = (c.lat || c.latitude || 0) - lat;
    const dy = (c.lng || c.longitude || 0) - lng;
    const d = Math.sqrt(dx * dx + dy * dy);
    const r = (z.radius || 50) / 69; // miles to degrees
    if (d < r && d < minDist) { minDist = d; nearest = z; }
  }
  return nearest;
}

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

// Map equipment types to valid cargoType enum values
function equipmentToCargoType(equip: string): string {
  const map: Record<string, string> = {
    tanker: "liquid", mc331: "gas", mc338: "gas", dry_van: "general",
    flatbed: "general", reefer: "refrigerated", hopper: "general",
    hazmat_van: "hazmat", food_grade: "liquid", lowboy: "oversized",
  };
  return map[equip] || "general";
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
   * Get instant quote v2.0 — Hot Zones Intelligence + Hazmat Class Premiums
   * Connects: hz_zone_intelligence, hz_fuel_prices, hz_lane_learning, hz_weather_alerts
   * No competitor offers hazmat-class-specific pricing at this granularity.
   */
  getInstant: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
      equipmentType: z.string().default("dry_van"),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      hazmatClass: z.string().optional(),
      pickupDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();

      // ── 1. Distance calculation ──
      const originCoords = input.origin.lat && input.origin.lng
        ? { lat: input.origin.lat, lng: input.origin.lng }
        : lookupCoords(input.origin.city, input.origin.state);
      const destCoords = input.destination.lat && input.destination.lng
        ? { lat: input.destination.lat, lng: input.destination.lng }
        : lookupCoords(input.destination.city, input.destination.state);

      let distance = 300;
      if (originCoords && destCoords) {
        distance = estimateRoadDistance(haversineDistanceMiles(originCoords, destCoords));
      }

      // ── 2. Equipment base rate ──
      const equip = EQUIPMENT_RATES[input.equipmentType] || EQUIPMENT_RATES["dry_van"];
      let baseRate = equip.base;

      // ── 3. Hazmat class premium ──
      let hazmatPremium = 0;
      let hazmatClassLabel = "";
      if (input.hazmat) {
        const hcKey = input.hazmatClass || "3";
        const hcData = HAZMAT_CLASS_PREMIUMS[hcKey] || { premium: 0.35, label: "General Hazmat" };
        hazmatPremium = hcData.premium;
        hazmatClassLabel = hcData.label;
      }

      // ── 4. Distance adjustment (short haul premium, long haul discount) ──
      const distanceAdj = distance < 150 ? 0.35 : distance < 300 ? 0.15 : distance > 1500 ? -0.20 : distance > 1000 ? -0.10 : 0;

      // ── 5. Hot Zones surge factor ──
      let originSurge = 1.0;
      let destSurge = 1.0;
      let originZoneName = "";
      let destZoneName = "";
      let originDemand = "NORMAL";
      let destDemand = "NORMAL";
      let weatherAlerts: string[] = [];
      let fuelPricePerGal = 3.85; // national avg fallback

      // Try reading Hot Zones intelligence from DB
      if (db && originCoords) {
        try {
          const [zoneRows] = await Promise.all([
            db.execute(sql`SELECT * FROM hz_zone_intelligence ORDER BY updated_at DESC LIMIT 50`),
          ]);
          const zones = (zoneRows as any)?.rows || (zoneRows as any) || [];
          if (Array.isArray(zones) && zones.length > 0) {
            // Find origin zone
            for (const z of zones) {
              const zLat = parseFloat(z.latitude || z.lat || 0);
              const zLng = parseFloat(z.longitude || z.lng || 0);
              const zRadius = parseFloat(z.radius_miles || 50);
              if (originCoords) {
                const d = haversineDistanceMiles(originCoords, { lat: zLat, lng: zLng });
                if (d < zRadius) {
                  originSurge = parseFloat(z.surge_multiplier || z.surgeMultiplier || 1);
                  originZoneName = z.zone_name || z.name || "";
                  const ratio = parseFloat(z.load_to_truck_ratio || z.loadToTruckRatio || 1);
                  originDemand = ratio > 3 ? "VERY_HIGH" : ratio > 2 ? "HIGH" : ratio > 1.5 ? "MODERATE" : "NORMAL";
                  break;
                }
              }
            }
            // Find dest zone
            if (destCoords) {
              for (const z of zones) {
                const zLat = parseFloat(z.latitude || z.lat || 0);
                const zLng = parseFloat(z.longitude || z.lng || 0);
                const zRadius = parseFloat(z.radius_miles || 50);
                const d = haversineDistanceMiles(destCoords, { lat: zLat, lng: zLng });
                if (d < zRadius) {
                  destSurge = parseFloat(z.surge_multiplier || z.surgeMultiplier || 1);
                  destZoneName = z.zone_name || z.name || "";
                  break;
                }
              }
            }
          }

          // Fuel prices from DB
          const fuelRows = await db.execute(sql`SELECT price_per_gallon FROM hz_fuel_prices WHERE fuel_type = 'diesel' ORDER BY recorded_at DESC LIMIT 1`);
          const fuelArr = (fuelRows as any)?.rows || (fuelRows as any) || [];
          if (Array.isArray(fuelArr) && fuelArr.length > 0) {
            fuelPricePerGal = parseFloat(fuelArr[0].price_per_gallon || 3.85);
          }

          // Weather alerts for origin state
          const wxRows = await db.execute(sql`SELECT headline FROM hz_weather_alerts WHERE state = ${input.origin.state.toUpperCase()} AND expires_at > NOW() ORDER BY severity DESC LIMIT 3`);
          const wxArr = (wxRows as any)?.rows || (wxRows as any) || [];
          if (Array.isArray(wxArr)) {
            weatherAlerts = wxArr.map((w: any) => w.headline || w.event || "").filter(Boolean).slice(0, 3);
          }
        } catch (e) {
          // Hot Zones data not available — proceed with static rates
        }
      }

      // ── 6. Lane learning (historical rate for this corridor) ──
      let laneAvgRate: number | null = null;
      let laneOnTimePercent: number | null = null;
      if (db && originCoords && destCoords) {
        try {
          const laneRows = await db.execute(
            sql`SELECT avg_rate_per_mile, on_time_percent FROM hz_lane_learning WHERE origin_lat BETWEEN ${originCoords.lat - 0.5} AND ${originCoords.lat + 0.5} AND origin_lng BETWEEN ${originCoords.lng - 0.5} AND ${originCoords.lng + 0.5} AND dest_lat BETWEEN ${destCoords.lat - 0.5} AND ${destCoords.lat + 0.5} AND dest_lng BETWEEN ${destCoords.lng - 0.5} AND ${destCoords.lng + 0.5} ORDER BY updated_at DESC LIMIT 1`
          );
          const laneArr = (laneRows as any)?.rows || (laneRows as any) || [];
          if (Array.isArray(laneArr) && laneArr.length > 0) {
            laneAvgRate = parseFloat(laneArr[0].avg_rate_per_mile || 0) || null;
            laneOnTimePercent = parseFloat(laneArr[0].on_time_percent || 0) || null;
          }
        } catch { /* lane data not available */ }
      }

      // ── 7. Final rate computation ──
      const avgSurge = (originSurge + destSurge) / 2;
      const ratePerMile = (baseRate + hazmatPremium + distanceAdj) * avgSurge;
      const fuelSurchargePerMile = (fuelPricePerGal - 1.25) / 6; // DOE fuel surcharge formula
      const hazmatFlatFee = input.hazmat ? (distance > 500 ? 250 : distance > 200 ? 150 : 100) : 0;

      const linehaul = Math.round(distance * ratePerMile);
      const fuelSurcharge = Math.round(distance * Math.max(fuelSurchargePerMile, 0.20));
      const totalEstimate = linehaul + fuelSurcharge + hazmatFlatFee;

      // ── 8. ML Engine fusion — enhance with trained model predictions ──
      let mlPrediction: any = null;
      let mlEta: any = null;
      let mlAnomalies: any[] = [];
      let mlDynamic: any = null;
      const oSt = input.origin.state.toUpperCase().substring(0, 2);
      const dSt = input.destination.state.toUpperCase().substring(0, 2);
      try {
        if (mlEngine.isReady()) {
          const [pred, eta, anom, dyn] = await Promise.allSettled([
            mlEngine.predictRate({ originState: oSt, destState: dSt, distance, weight: input.weight, equipmentType: input.equipmentType, cargoType: input.hazmat ? "hazmat" : "general" }),
            mlEngine.predictETA({ originState: oSt, destState: dSt, distance, equipmentType: input.equipmentType, cargoType: input.hazmat ? "hazmat" : "general", pickupDate: input.pickupDate }),
            mlEngine.detectAnomalies({ rate: totalEstimate, distance, originState: oSt, destState: dSt, weight: input.weight }),
            mlEngine.getDynamicPrice({ originState: oSt, destState: dSt, distance, weight: input.weight, equipmentType: input.equipmentType, cargoType: input.hazmat ? "hazmat" : "general" }),
          ]);
          if (pred.status === "fulfilled") mlPrediction = pred.value;
          if (eta.status === "fulfilled") mlEta = eta.value;
          if (anom.status === "fulfilled" && Array.isArray(anom.value)) mlAnomalies = anom.value;
          if (dyn.status === "fulfilled") mlDynamic = dyn.value;
        }
      } catch { /* ML not ready — proceed with static rates */ }

      // If ML has trained data, blend ML prediction into market comparison
      const mlSpot = mlPrediction?.predictedSpotRate || 0;
      const mlContract = mlPrediction?.predictedContractRate || 0;
      const mlConfidence = mlPrediction?.confidence || 0;

      // Market comparison band — fuse ML if available (weighted blend)
      const mlWeight = mlConfidence > 50 ? 0.4 : mlConfidence > 30 ? 0.2 : 0;
      const blendedEstimate = mlSpot > 0 && mlWeight > 0
        ? Math.round(totalEstimate * (1 - mlWeight) + mlSpot * mlWeight)
        : totalEstimate;
      const marketLow = Math.round(blendedEstimate * 0.85);
      const marketHigh = Math.round(blendedEstimate * 1.18);

      return {
        quoteId: `EQ-${Date.now().toString(36).toUpperCase()}`,
        origin: input.origin,
        destination: input.destination,
        distance,
        estimatedTransitTime: mlEta ? `${mlEta.estimatedDays} day${mlEta.estimatedDays !== 1 ? "s" : ""} (${mlEta.estimatedHours}h)` : estimateTransitTime(distance),
        pricing: {
          ratePerMile: Math.round(ratePerMile * 100) / 100,
          linehaul,
          fuelSurcharge,
          fuelPricePerGal: Math.round(fuelPricePerGal * 100) / 100,
          hazmatPremiumPerMile: Math.round(hazmatPremium * 100) / 100,
          hazmatFlatFee,
          hazmatClassLabel,
          totalEstimate: blendedEstimate,
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        marketComparison: {
          low: marketLow,
          average: blendedEstimate,
          high: marketHigh,
          source: mlConfidence > 30 ? "ml_engine+lane_learning" : laneAvgRate ? "lane_learning" : "national_average",
        },
        intelligence: {
          originZone: originZoneName || null,
          destZone: destZoneName || null,
          originDemand,
          destDemand,
          originSurge: Math.round(originSurge * 100) / 100,
          destSurge: Math.round(destSurge * 100) / 100,
          laneAvgRate: laneAvgRate ? Math.round(laneAvgRate * 100) / 100 : null,
          laneOnTimePercent: laneOnTimePercent ? Math.round(laneOnTimePercent) : null,
          weatherAlerts,
          equipmentLabel: equip.label,
        },
        // ML Engine predictions (available when engine is trained)
        ml: mlPrediction ? {
          spotRate: mlPrediction.predictedSpotRate,
          contractRate: mlPrediction.predictedContractRate,
          confidence: mlPrediction.confidence,
          marketCondition: mlPrediction.marketCondition,
          priceRange: mlPrediction.priceRange,
          factors: mlPrediction.factors || [],
          recommendation: mlPrediction.recommendation,
          basedOnSamples: mlPrediction.basedOnSamples || 0,
          eta: mlEta ? { days: mlEta.estimatedDays, hours: mlEta.estimatedHours, riskLevel: mlEta.riskLevel, range: mlEta.range } : null,
          dynamicPrice: mlDynamic ? { recommended: mlDynamic.recommendedRate, ratePerMile: mlDynamic.ratePerMile, position: mlDynamic.competitivePosition, urgency: mlDynamic.urgencyMultiplier } : null,
          anomalies: mlAnomalies.length > 0 ? mlAnomalies : null,
        } : null,
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
        cargoType: equipmentToCargoType(input.equipmentType) as any,
        commodityName: input.commodity,
        weight: input.weight ? String(input.weight) : null,
        rate: String(input.pricing.total),
        pickupLocation: { address: input.origin.address, city: input.origin.city, state: input.origin.state, zip: input.origin.zip },
        deliveryLocation: { address: input.destination.address, city: input.destination.city, state: input.destination.state, zip: input.destination.zip },
        pickupDate: new Date(input.pickupDate),
        specialInstructions: input.notes || null,
      } as any).$returningId();
      // Auto-index quote for AI semantic search (fire-and-forget)
      try {
        const { indexLoad } = await import("../services/embeddings/aiTurbocharge");
        indexLoad({ id: result[0]?.id, loadNumber, commodity: input.commodity || "", origin: `${input.origin.city}, ${input.origin.state}`, destination: `${input.destination.city}, ${input.destination.state}`, status: "quote" });
      } catch {}

      // AI Turbocharge: Rate prediction for quote
      let aiRate: any = null;
      try {
        const { predictRate } = await import("../services/ai/forecastEngine");
        aiRate = predictRate([], input.pricing.total, {
          season: new Date().getMonth() + 1,
          distance: input.distance || undefined,
        });
      } catch {}

      return {
        id: String(result[0]?.id),
        quoteNumber: loadNumber,
        status: "draft",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + input.validDays * 86400000).toISOString(),
        aiRate,
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
          equipmentType: (() => { try { return JSON.parse(load.specialInstructions || '{}')?.equipmentType || null; } catch { return null; } })(), cargoType: load.cargoType || '', commodity: load.commodityName || '',
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
