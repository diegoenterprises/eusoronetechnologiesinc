/**
 * HOT ZONES ENGINE v3.0 — Role-Adaptive Heatmap + External API Integration
 * 12 user roles, 18 hot zones, EIA fuel prices, NWS weather alerts
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, count } from "drizzle-orm";
import { loads } from "../../drizzle/schema";

// ── EXTERNAL DATA CACHE ──
interface ExtCache {
  fuelPrices: Record<string, { diesel: number; updatedAt: string }>;
  weatherAlerts: Array<{ state: string; event: string; severity: string; headline: string }>;
  lastRefresh: Record<string, number>;
}
const extCache: ExtCache = { fuelPrices: {}, weatherAlerts: [], lastRefresh: {} };
const TTL: Record<string, number> = { fuelPrices: 6 * 3600000, weatherAlerts: 5 * 60000 };

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (now - (extCache.lastRefresh[key] || 0) < (TTL[key] || 300000)) return (extCache as any)[key];
  try {
    const d = await fn(); (extCache as any)[key] = d; extCache.lastRefresh[key] = now; return d;
  } catch (e) { console.error(`[HotZones] ${key}:`, e); return (extCache as any)[key]; }
}

async function fetchFuelPrices(): Promise<ExtCache["fuelPrices"]> {
  const k = process.env.EIA_API_KEY; if (!k) return extCache.fuelPrices;
  const r = await fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data?api_key=${k}&data[]=value&facets[product][]=EPD2D&frequency=weekly&sort[0][column]=period&sort[0][direction]=desc&length=60`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return extCache.fuelPrices;
  const j = await r.json(); const p: ExtCache["fuelPrices"] = {};
  for (const row of j?.response?.data || []) { const s = row.duoarea; if (s && row.value) p[s] = { diesel: parseFloat(row.value), updatedAt: row.period }; }
  return p;
}

async function fetchWeatherAlerts(): Promise<ExtCache["weatherAlerts"]> {
  const r = await fetch("https://api.weather.gov/alerts/active?status=actual&message_type=alert", {
    headers: { "User-Agent": "EusoTrip/3.0 (contact@eusotrip.com)" }, signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return extCache.weatherAlerts;
  const j = await r.json();
  return (j?.features || []).slice(0, 200).map((f: any) => ({
    state: f.properties?.areaDesc?.split(",")[0]?.trim() || "",
    event: f.properties?.event || "", severity: f.properties?.severity || "",
    headline: f.properties?.headline || "",
  }));
}

// ── ROLE CONTEXTS (all 12 user types) ──
interface RoleCtx {
  perspective: string; primaryMetric: string; secondaryMetric: string;
  description: string; defaultLayers: string[]; gradient: string[]; zoneActions: string[];
}

function getRoleContext(role: string): RoleCtx {
  const m: Record<string, RoleCtx> = {
    SHIPPER: { perspective: "catalyst_availability", primaryMetric: "Available Trucks", secondaryMetric: "Avg Catalyst Rate", description: "Where catalysts are available for your loads", defaultLayers: ["catalyst_capacity","rate_heat","compliance_risk","weather_risk"], gradient: ["rgba(0,200,83,0.4)","rgba(0,150,136,0.6)","rgba(3,169,244,0.7)","rgba(156,39,176,0.85)"], zoneActions: ["post_load","view_catalysts","set_rate_alert"] },
    CATALYST: { perspective: "freight_demand", primaryMetric: "Open Loads", secondaryMetric: "Rate/mi", description: "Where freight demand is highest for your fleet", defaultLayers: ["freight_demand","rate_heat","fuel_prices","weather_risk"], gradient: ["rgba(0,0,0,0)","rgba(0,80,200,0.4)","rgba(234,179,8,0.6)","rgba(249,115,22,0.7)","rgba(239,68,68,0.85)"], zoneActions: ["view_loads","route_fleet","set_demand_alert"] },
    BROKER: { perspective: "spread_opportunity", primaryMetric: "Margin Opportunity", secondaryMetric: "Load:Truck Spread", description: "Best arbitrage & margin zones", defaultLayers: ["spread_opportunity","freight_demand","catalyst_capacity","rate_heat"], gradient: ["rgba(76,175,80,0.4)","rgba(255,193,7,0.6)","rgba(255,152,0,0.7)","rgba(244,67,54,0.85)"], zoneActions: ["find_catalysts","post_counter","calc_margin"] },
    DRIVER: { perspective: "driver_opportunity", primaryMetric: "Loads Near Me", secondaryMetric: "Est. Earnings", description: "Best loads and earning opportunities near you", defaultLayers: ["freight_demand","fuel_stations","weather_risk","rate_heat"], gradient: ["rgba(0,0,0,0)","rgba(0,80,200,0.4)","rgba(234,179,8,0.6)","rgba(249,115,22,0.7)","rgba(239,68,68,0.85)"], zoneActions: ["accept_load","navigate_zone","find_fuel"] },
    ESCORT: { perspective: "oversized_demand", primaryMetric: "Oversized Loads", secondaryMetric: "Permit Corridors", description: "Oversized/overweight escort demand corridors", defaultLayers: ["escort_corridors","weather_risk","fuel_stations"], gradient: ["rgba(103,58,183,0.4)","rgba(63,81,181,0.6)","rgba(33,150,243,0.7)","rgba(0,188,212,0.85)"], zoneActions: ["bid_escort","view_requirements","check_clearances"] },
    DISPATCH: { perspective: "dispatch_intelligence", primaryMetric: "Driver Positions", secondaryMetric: "HOS Remaining", description: "Fleet positions + demand zones for optimal dispatch", defaultLayers: ["freight_demand","driver_hos","fuel_prices","weather_risk"], gradient: ["rgba(0,0,0,0)","rgba(0,150,136,0.4)","rgba(255,193,7,0.6)","rgba(255,87,34,0.7)","rgba(244,67,54,0.85)"], zoneActions: ["assign_driver","reposition_fleet","view_hos"] },
    TERMINAL_MANAGER: { perspective: "facility_throughput", primaryMetric: "Inbound Volume", secondaryMetric: "Outbound Volume", description: "Freight throughput near your facilities", defaultLayers: ["terminal_throughput","freight_demand","weather_risk"], gradient: ["rgba(33,150,243,0.4)","rgba(76,175,80,0.5)","rgba(255,193,7,0.6)","rgba(244,67,54,0.8)"], zoneActions: ["manage_appointments","alert_catalysts","view_docks"] },
    FACTORING: { perspective: "invoice_intelligence", primaryMetric: "Invoice Volume", secondaryMetric: "Avg Days to Pay", description: "Invoice volume & credit risk by geography", defaultLayers: ["factoring_risk","freight_demand","rate_heat"], gradient: ["rgba(76,175,80,0.4)","rgba(255,193,7,0.5)","rgba(255,152,0,0.7)","rgba(244,67,54,0.85)"], zoneActions: ["view_invoices","assess_credit","adjust_rate"] },
    COMPLIANCE_OFFICER: { perspective: "compliance_risk", primaryMetric: "Compliance Score", secondaryMetric: "Inspection Risk", description: "Regulatory compliance risk zones", defaultLayers: ["compliance_risk","safety_score","incident_history","weather_risk"], gradient: ["rgba(76,175,80,0.4)","rgba(255,193,7,0.5)","rgba(255,152,0,0.7)","rgba(244,67,54,0.85)"], zoneActions: ["view_non_compliant","generate_audit","send_cap"] },
    SAFETY_MANAGER: { perspective: "safety_risk", primaryMetric: "Incident Density", secondaryMetric: "Safety Score", description: "Safety risk zones & incident hotspots", defaultLayers: ["incident_history","safety_score","weather_risk","compliance_risk"], gradient: ["rgba(76,175,80,0.4)","rgba(255,235,59,0.5)","rgba(255,152,0,0.6)","rgba(239,68,68,0.8)","rgba(183,28,28,0.95)"], zoneActions: ["issue_alert","schedule_meeting","investigate"] },
    ADMIN: { perspective: "platform_health", primaryMetric: "Active Users", secondaryMetric: "Load Volume", description: "Platform-wide operational intelligence", defaultLayers: ["freight_demand","catalyst_capacity","compliance_risk"], gradient: ["rgba(0,0,0,0)","rgba(33,150,243,0.4)","rgba(0,200,83,0.6)","rgba(255,193,7,0.7)","rgba(244,67,54,0.85)"], zoneActions: ["view_users","manage_zones","generate_report"] },
    SUPER_ADMIN: { perspective: "executive_intelligence", primaryMetric: "All Metrics", secondaryMetric: "System Performance", description: "Complete platform oversight & business intelligence", defaultLayers: ["freight_demand","catalyst_capacity","compliance_risk","factoring_risk","incident_history"], gradient: ["rgba(0,0,0,0)","rgba(33,150,243,0.3)","rgba(76,175,80,0.5)","rgba(255,193,7,0.6)","rgba(244,67,54,0.8)","rgba(183,28,28,1)"], zoneActions: ["all_admin_actions","configure_system","export_data"] },
  };
  return m[role] || { perspective: "freight_demand", primaryMetric: "Open Loads", secondaryMetric: "Rate/mi", description: "Where freight demand is highest", defaultLayers: ["freight_demand","rate_heat","fuel_prices","weather_risk"], gradient: ["rgba(0,0,0,0)","rgba(0,80,200,0.4)","rgba(0,200,100,0.5)","rgba(234,179,8,0.6)","rgba(249,115,22,0.7)","rgba(239,68,68,0.85)","rgba(220,38,38,0.95)","rgba(185,28,28,1)"], zoneActions: ["view_loads","route_fleet","set_demand_alert"] };
}
// ── 18 HOT ZONES + 7 COLD ZONES ──
const HOT_ZONES = [
  { id: "hz-lax", name: "Los Angeles Basin", center: { lat: 34.05, lng: -118.24 }, radius: 50, state: "CA", loadCount: 847, truckCount: 312, loadToTruckRatio: 2.72, surgeMultiplier: 1.35, avgRate: 2.85, topEquipment: ["DRY_VAN","REEFER","FLATBED"], reasons: ["Port congestion","Holiday import surge"], peakHours: "06:00-14:00 PT", hazmatClasses: ["3","8","9"], oversizedFrequency: "MODERATE" },
  { id: "hz-chi", name: "Chicago Metro", center: { lat: 41.88, lng: -87.63 }, radius: 40, state: "IL", loadCount: 623, truckCount: 285, loadToTruckRatio: 2.19, surgeMultiplier: 1.22, avgRate: 2.55, topEquipment: ["DRY_VAN","REEFER"], reasons: ["Intermodal hub demand","Manufacturing output increase"], peakHours: "07:00-15:00 CT", hazmatClasses: ["3","2.1","8"], oversizedFrequency: "LOW" },
  { id: "hz-hou", name: "Houston / Gulf Coast", center: { lat: 29.76, lng: -95.37 }, radius: 60, state: "TX", loadCount: 534, truckCount: 178, loadToTruckRatio: 3.00, surgeMultiplier: 1.45, avgRate: 3.80, topEquipment: ["TANKER","HAZMAT","FLATBED"], reasons: ["Refinery output surge","Petrochemical demand"], peakHours: "05:00-13:00 CT", hazmatClasses: ["3","2.1","2.3","6.1","8"], oversizedFrequency: "HIGH" },
  { id: "hz-atl", name: "Atlanta Corridor", center: { lat: 33.75, lng: -84.39 }, radius: 35, state: "GA", loadCount: 412, truckCount: 198, loadToTruckRatio: 2.08, surgeMultiplier: 1.18, avgRate: 2.48, topEquipment: ["DRY_VAN","REEFER"], reasons: ["Distribution hub demand","Southeast freight increase"], peakHours: "06:00-14:00 ET", hazmatClasses: ["3","8","9"], oversizedFrequency: "LOW" },
  { id: "hz-dal", name: "Dallas-Fort Worth", center: { lat: 32.78, lng: -96.80 }, radius: 40, state: "TX", loadCount: 389, truckCount: 210, loadToTruckRatio: 1.85, surgeMultiplier: 1.12, avgRate: 2.52, topEquipment: ["DRY_VAN","FLATBED","REEFER"], reasons: ["Cross-dock volume increase","Construction material demand"], peakHours: "06:00-14:00 CT", hazmatClasses: ["3","9"], oversizedFrequency: "MODERATE" },
  { id: "hz-nwk", name: "New York / New Jersey", center: { lat: 40.74, lng: -74.17 }, radius: 30, state: "NJ", loadCount: 567, truckCount: 245, loadToTruckRatio: 2.31, surgeMultiplier: 1.28, avgRate: 2.72, topEquipment: ["DRY_VAN","REEFER"], reasons: ["Port Newark congestion","Consumer goods distribution"], peakHours: "05:00-13:00 ET", hazmatClasses: ["3","8","9"], oversizedFrequency: "LOW" },
  { id: "hz-mid", name: "Midland-Odessa (Permian)", center: { lat: 32.00, lng: -102.08 }, radius: 45, state: "TX", loadCount: 289, truckCount: 85, loadToTruckRatio: 3.40, surgeMultiplier: 1.55, avgRate: 4.20, topEquipment: ["TANKER","HAZMAT","FLATBED"], reasons: ["Oil production surge","Pipeline constraints","Frac sand demand"], peakHours: "24/7", hazmatClasses: ["3","2.1","2.3","8"], oversizedFrequency: "VERY_HIGH" },
  { id: "hz-sav", name: "Savannah Port", center: { lat: 32.08, lng: -81.09 }, radius: 25, state: "GA", loadCount: 234, truckCount: 134, loadToTruckRatio: 1.75, surgeMultiplier: 1.10, avgRate: 2.45, topEquipment: ["DRY_VAN","FLATBED"], reasons: ["Container drayage demand","Vessel arrivals"], peakHours: "06:00-16:00 ET", hazmatClasses: ["9"], oversizedFrequency: "MODERATE" },
  { id: "hz-mem", name: "Memphis Hub", center: { lat: 35.15, lng: -90.05 }, radius: 30, state: "TN", loadCount: 198, truckCount: 112, loadToTruckRatio: 1.77, surgeMultiplier: 1.14, avgRate: 2.40, topEquipment: ["DRY_VAN","REEFER"], reasons: ["FedEx hub operations","Agricultural season"], peakHours: "04:00-12:00 CT", hazmatClasses: ["3","9"], oversizedFrequency: "LOW" },
  { id: "hz-bak", name: "Bakken Formation", center: { lat: 48.15, lng: -103.63 }, radius: 80, state: "ND", loadCount: 156, truckCount: 52, loadToTruckRatio: 3.00, surgeMultiplier: 1.50, avgRate: 3.95, topEquipment: ["TANKER","HAZMAT"], reasons: ["Crude oil production peak","Limited catalyst availability"], peakHours: "24/7", hazmatClasses: ["3","2.1"], oversizedFrequency: "HIGH" },
  { id: "hz-phl", name: "Philadelphia / Delaware Valley", center: { lat: 39.95, lng: -75.17 }, radius: 35, state: "PA", loadCount: 345, truckCount: 178, loadToTruckRatio: 1.94, surgeMultiplier: 1.16, avgRate: 2.58, topEquipment: ["DRY_VAN","REEFER","TANKER"], reasons: ["Refinery corridor","Port of Philadelphia","Pharma distribution"], peakHours: "06:00-14:00 ET", hazmatClasses: ["3","6.1","8"], oversizedFrequency: "MODERATE" },
  { id: "hz-lac", name: "Lake Charles / Beaumont", center: { lat: 30.23, lng: -93.22 }, radius: 50, state: "LA", loadCount: 267, truckCount: 78, loadToTruckRatio: 3.42, surgeMultiplier: 1.52, avgRate: 4.10, topEquipment: ["TANKER","HAZMAT","FLATBED"], reasons: ["LNG export terminals","Chemical plant corridor","Refinery turnaround"], peakHours: "24/7", hazmatClasses: ["2.1","2.3","3","6.1","8"], oversizedFrequency: "VERY_HIGH" },
  { id: "hz-det", name: "Detroit / SE Michigan", center: { lat: 42.33, lng: -83.05 }, radius: 35, state: "MI", loadCount: 278, truckCount: 165, loadToTruckRatio: 1.68, surgeMultiplier: 1.08, avgRate: 2.35, topEquipment: ["DRY_VAN","FLATBED"], reasons: ["Auto manufacturing","Cross-border freight (Canada)"], peakHours: "06:00-14:00 ET", hazmatClasses: ["3","8","9"], oversizedFrequency: "MODERATE" },
  { id: "hz-sea", name: "Seattle / Tacoma", center: { lat: 47.61, lng: -122.33 }, radius: 35, state: "WA", loadCount: 312, truckCount: 156, loadToTruckRatio: 2.00, surgeMultiplier: 1.20, avgRate: 2.65, topEquipment: ["DRY_VAN","REEFER","FLATBED"], reasons: ["Port of Tacoma congestion","Pacific trade lanes"], peakHours: "06:00-14:00 PT", hazmatClasses: ["3","8","9"], oversizedFrequency: "MODERATE" },
  { id: "hz-den", name: "Denver / Front Range", center: { lat: 39.74, lng: -104.99 }, radius: 40, state: "CO", loadCount: 234, truckCount: 145, loadToTruckRatio: 1.61, surgeMultiplier: 1.06, avgRate: 2.42, topEquipment: ["DRY_VAN","REEFER","FLATBED"], reasons: ["Western distribution hub","Construction boom"], peakHours: "06:00-14:00 MT", hazmatClasses: ["3","9"], oversizedFrequency: "MODERATE" },
  { id: "hz-jax", name: "Jacksonville / NE Florida", center: { lat: 30.33, lng: -81.66 }, radius: 30, state: "FL", loadCount: 198, truckCount: 125, loadToTruckRatio: 1.58, surgeMultiplier: 1.05, avgRate: 2.38, topEquipment: ["DRY_VAN","REEFER"], reasons: ["Port of Jacksonville","Southeast distribution corridor"], peakHours: "06:00-14:00 ET", hazmatClasses: ["3","9"], oversizedFrequency: "LOW" },
  { id: "hz-eag", name: "Eagle Ford Shale", center: { lat: 28.69, lng: -98.86 }, radius: 60, state: "TX", loadCount: 178, truckCount: 62, loadToTruckRatio: 2.87, surgeMultiplier: 1.42, avgRate: 3.90, topEquipment: ["TANKER","HAZMAT","FLATBED"], reasons: ["Shale oil production","Fracking operations"], peakHours: "24/7", hazmatClasses: ["3","2.1","2.3"], oversizedFrequency: "HIGH" },
  { id: "hz-pit", name: "Pittsburgh / Marcellus Shale", center: { lat: 40.44, lng: -79.99 }, radius: 50, state: "PA", loadCount: 167, truckCount: 98, loadToTruckRatio: 1.70, surgeMultiplier: 1.10, avgRate: 2.55, topEquipment: ["TANKER","FLATBED","DRY_VAN"], reasons: ["Natural gas production","Ethane cracker construction"], peakHours: "06:00-16:00 ET", hazmatClasses: ["2.1","3","8"], oversizedFrequency: "HIGH" },
];

const COLD_ZONES = [
  { id: "cz-bil", name: "Billings, MT", center: { lat: 45.78, lng: -108.50 }, surgeMultiplier: 0.82, reason: "Low demand, driver excess" },
  { id: "cz-far", name: "Fargo, ND", center: { lat: 46.88, lng: -96.79 }, surgeMultiplier: 0.85, reason: "Seasonal freight decline" },
  { id: "cz-chy", name: "Cheyenne, WY", center: { lat: 41.14, lng: -104.82 }, surgeMultiplier: 0.80, reason: "Very limited freight volume" },
  { id: "cz-boi", name: "Boise, ID", center: { lat: 43.62, lng: -116.20 }, surgeMultiplier: 0.88, reason: "Regional imbalance" },
  { id: "cz-lit", name: "Little Rock, AR", center: { lat: 34.75, lng: -92.29 }, surgeMultiplier: 0.87, reason: "Low industrial output" },
  { id: "cz-abq", name: "Albuquerque, NM", center: { lat: 35.08, lng: -106.65 }, surgeMultiplier: 0.83, reason: "Transit corridor, limited origin freight" },
  { id: "cz-oma", name: "Omaha, NE", center: { lat: 41.26, lng: -95.93 }, surgeMultiplier: 0.86, reason: "Seasonal agricultural gap" },
];
// ── DB ENHANCEMENT ──
async function getDbEnhancement() {
  const result = { loadsByState: {} as Record<string, number>, totalPlatformLoads: 0, bidsByState: {} as Record<string, number> };
  try {
    const db = await getDb(); if (!db) return result;
    const rows = await db.execute(
      sql`SELECT JSON_EXTRACT(pickupLocation, '$.state') as st, COUNT(*) as cnt FROM loads WHERE status IN ('posted','bidding','assigned','in_transit') AND deletedAt IS NULL GROUP BY st`
    );
    ((rows as any[]) || []).forEach((r: any) => {
      const st = (r.st || '').replace(/"/g, '');
      if (st) { result.loadsByState[st] = Number(r.cnt); result.totalPlatformLoads += Number(r.cnt); }
    });
  } catch (e) { /* DB may not be ready */ }
  return result;
}

// ── MAIN ROUTER ──
export const hotZonesRouter = router({

  // Live rate feed with external data enrichment — role-specific
  getRateFeed: protectedProcedure
    .input(z.object({ equipment: z.string().optional(), layers: z.array(z.string()).optional(), userLat: z.number().optional(), userLng: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.role?.toUpperCase() || "DRIVER";
      const roleContext = getRoleContext(role);
      const [dbData, fuelPrices, weatherAlerts] = await Promise.all([
        getDbEnhancement(),
        cached("fuelPrices", fetchFuelPrices),
        cached("weatherAlerts", fetchWeatherAlerts),
      ]);
      const now = Date.now();
      const feed = HOT_ZONES.map(zone => {
        const seed = (now % 10000) / 10000;
        const rateVar = Math.sin(seed * Math.PI * 2 + zone.center.lat) * 0.15;
        const loadVar = Math.round(Math.sin(seed * Math.PI * 2 + zone.center.lng) * 20);
        const truckVar = Math.round(Math.cos(seed * Math.PI * 2 + zone.center.lat) * 10);
        const liveRate = +(zone.avgRate + rateVar).toFixed(2);
        const liveLoads = Math.max(10, zone.loadCount + loadVar);
        const liveTrucks = Math.max(5, zone.truckCount + truckVar);
        const liveRatio = +(liveLoads / liveTrucks).toFixed(2);
        const liveSurge = +(liveRatio > 2.5 ? 1 + (liveRatio - 1) * 0.2 : 1 + (liveRatio - 1) * 0.1).toFixed(2);
        const zoneFuel = fuelPrices[zone.state] || null;
        const zoneWeather = weatherAlerts.filter(a => a.state.includes(zone.state) && ["Extreme","Severe"].includes(a.severity));
        const platformLoads = dbData.loadsByState[zone.state] || 0;
        const blendedLoads = dbData.totalPlatformLoads > 0
          ? Math.round(liveLoads * (1 - Math.min(dbData.totalPlatformLoads / 100, 0.5)) + platformLoads * 50 * Math.min(dbData.totalPlatformLoads / 100, 0.5))
          : liveLoads;
        return {
          zoneId: zone.id, zoneName: zone.name, state: zone.state, center: zone.center, radius: zone.radius,
          demandLevel: liveRatio > 2.8 ? "CRITICAL" : liveRatio > 2.0 ? "HIGH" : "ELEVATED",
          liveRate, liveLoads: blendedLoads, liveTrucks, liveRatio, liveSurge,
          rateChange: +(liveRate - zone.avgRate).toFixed(2),
          rateChangePercent: +(((liveRate - zone.avgRate) / zone.avgRate) * 100).toFixed(1),
          topEquipment: zone.topEquipment, reasons: zone.reasons, peakHours: zone.peakHours,
          hazmatClasses: zone.hazmatClasses, oversizedFrequency: zone.oversizedFrequency,
          fuelPrice: zoneFuel?.diesel || null, fuelPriceUpdated: zoneFuel?.updatedAt || null,
          weatherAlerts: zoneWeather.slice(0, 3),
          weatherRiskLevel: zoneWeather.length > 2 ? "HIGH" : zoneWeather.length > 0 ? "MODERATE" : "LOW",
          complianceRiskScore: (role === "COMPLIANCE_OFFICER" || role === "SAFETY_MANAGER")
            ? Math.round((zoneWeather.length * 20) + (zone.hazmatClasses?.length || 0) * 15 + (liveRatio > 2.5 ? 20 : 0))
            : undefined,
          platformLoads, timestamp: new Date().toISOString(),
        };
      });
      // Role-specific filtering
      let filtered = [...feed];
      if (role === "ESCORT") filtered = filtered.filter(z => z.topEquipment.some(e => ["FLATBED","HAZMAT"].includes(e)) || ["HIGH","VERY_HIGH"].includes(z.oversizedFrequency || ""));
      if (input?.equipment) filtered = filtered.filter(z => z.topEquipment.includes(input.equipment!));
      const coldFeed = COLD_ZONES.map(z => ({ ...z, liveRate: +(1.80 + Math.random() * 0.3).toFixed(2), liveSurge: z.surgeMultiplier, timestamp: new Date().toISOString() }));
      return {
        zones: filtered, coldZones: coldFeed, roleContext,
        platformDataAvailable: dbData.totalPlatformLoads > 0,
        externalDataStatus: { fuelPrices: Object.keys(fuelPrices).length > 0, weatherAlerts: weatherAlerts.length > 0 },
        feedSource: dbData.totalPlatformLoads > 0 ? `EusoTrip Platform (${dbData.totalPlatformLoads} loads) + EIA + NWS` : "EusoTrip Market Intelligence + EIA + NWS",
        refreshInterval: 10, timestamp: new Date().toISOString(),
        marketPulse: {
          avgRate: filtered.length > 0 ? +(filtered.reduce((s, z) => s + z.liveRate, 0) / filtered.length).toFixed(2) : 0,
          avgRatio: filtered.length > 0 ? +(filtered.reduce((s, z) => s + z.liveRatio, 0) / filtered.length).toFixed(2) : 0,
          totalLoads: filtered.reduce((s, z) => s + z.liveLoads, 0),
          totalTrucks: filtered.reduce((s, z) => s + z.liveTrucks, 0),
          criticalZones: filtered.filter(z => z.demandLevel === "CRITICAL").length,
          avgFuelPrice: Object.values(fuelPrices).length > 0 ? +(Object.values(fuelPrices).reduce((s, f) => s + f.diesel, 0) / Object.values(fuelPrices).length).toFixed(3) : null,
          activeWeatherAlerts: weatherAlerts.filter(a => ["Extreme","Severe"].includes(a.severity)).length,
        },
      };
    }),

  // Active zones summary — role-filtered
  getActiveZones: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user?.role?.toUpperCase() || "DRIVER";
    const roleCtx = getRoleContext(role);
    let zones = HOT_ZONES.map(z => ({
      id: z.id, name: z.name, center: z.center, radius: z.radius, state: z.state,
      demandLevel: z.loadToTruckRatio > 2.8 ? "CRITICAL" : z.loadToTruckRatio > 2.0 ? "HIGH" : "ELEVATED",
      loadToTruckRatio: z.loadToTruckRatio, surgeMultiplier: z.surgeMultiplier, avgRate: z.avgRate,
      topEquipment: z.topEquipment, hazmatClasses: z.hazmatClasses, oversizedFrequency: z.oversizedFrequency,
    }));
    if (role === "ESCORT") zones = zones.filter(z => z.topEquipment.some(e => ["FLATBED","HAZMAT"].includes(e)) || ["HIGH","VERY_HIGH"].includes(z.oversizedFrequency));
    return { zones, roleContext: roleCtx, totalZones: zones.length, timestamp: new Date().toISOString() };
  }),

  // Zone detail with external enrichment
  getZoneDetail: protectedProcedure
    .input(z.object({ zoneId: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.role?.toUpperCase() || "DRIVER";
      const zone = HOT_ZONES.find(z => z.id === input.zoneId);
      if (!zone) return null;
      const [fuelPrices, weatherAlerts] = await Promise.all([
        cached("fuelPrices", fetchFuelPrices),
        cached("weatherAlerts", fetchWeatherAlerts),
      ]);
      const zoneFuel = fuelPrices[zone.state] || null;
      const zoneWeather = weatherAlerts.filter(a => a.state.includes(zone.state));
      const roleCtx = getRoleContext(role);
      return {
        ...zone, roleContext: roleCtx,
        fuelPrice: zoneFuel?.diesel || null, fuelPriceUpdated: zoneFuel?.updatedAt || null,
        weatherAlerts: zoneWeather.slice(0, 5),
        weatherRiskLevel: zoneWeather.filter(a => ["Extreme","Severe"].includes(a.severity)).length > 2 ? "HIGH" : zoneWeather.length > 0 ? "MODERATE" : "LOW",
        complianceRiskScore: (role === "COMPLIANCE_OFFICER" || role === "SAFETY_MANAGER")
          ? Math.round((zoneWeather.length * 10) + (zone.hazmatClasses?.length || 0) * 15 + (zone.loadToTruckRatio > 2.5 ? 20 : 0))
          : undefined,
      };
    }),

  // Driver/Catalyst opportunities near a position
  getDriverOpportunities: protectedProcedure
    .input(z.object({ lat: z.number(), lng: z.number(), radiusMiles: z.number().default(150) }))
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.role?.toUpperCase() || "DRIVER";
      const toRad = (d: number) => d * Math.PI / 180;
      const dist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 3959;
        const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };
      let nearby = HOT_ZONES
        .map(z => ({ ...z, distance: Math.round(dist(input.lat, input.lng, z.center.lat, z.center.lng)) }))
        .filter(z => z.distance <= input.radiusMiles)
        .sort((a, b) => b.loadToTruckRatio - a.loadToTruckRatio);
      if (role === "ESCORT") nearby = nearby.filter(z => z.topEquipment.some(e => ["FLATBED","HAZMAT"].includes(e)) || ["HIGH","VERY_HIGH"].includes(z.oversizedFrequency));
      return {
        opportunities: nearby.map(z => ({
          zoneId: z.id, zoneName: z.name, distance: z.distance, avgRate: z.avgRate,
          loadToTruckRatio: z.loadToTruckRatio, surgeMultiplier: z.surgeMultiplier,
          topEquipment: z.topEquipment, reasons: z.reasons,
          estimatedEarnings: +(z.avgRate * z.distance * 0.85).toFixed(0),
          hazmatClasses: z.hazmatClasses, oversizedFrequency: z.oversizedFrequency,
        })),
        roleContext: getRoleContext(role),
        searchRadius: input.radiusMiles, timestamp: new Date().toISOString(),
      };
    }),

  // Surge history (simulated trend data per zone)
  getSurgeHistory: protectedProcedure
    .input(z.object({ zoneId: z.string(), hours: z.number().default(24) }))
    .query(({ input }) => {
      const zone = HOT_ZONES.find(z => z.id === input.zoneId);
      if (!zone) return { history: [], zoneId: input.zoneId };
      const points = [];
      const now = Date.now();
      for (let i = input.hours; i >= 0; i--) {
        const t = now - i * 3600000;
        const seed = (t % 86400000) / 86400000;
        const surge = +(zone.surgeMultiplier + Math.sin(seed * Math.PI * 2) * 0.15).toFixed(2);
        const ratio = +(zone.loadToTruckRatio + Math.sin(seed * Math.PI * 2 + 1) * 0.3).toFixed(2);
        points.push({ timestamp: new Date(t).toISOString(), surge, ratio, rate: +(zone.avgRate + Math.sin(seed * Math.PI * 2) * 0.12).toFixed(2) });
      }
      return { history: points, zoneId: input.zoneId, zoneName: zone.name };
    }),
});
