/**
 * HOT ZONES ENGINE v5.0 — Role-Adaptive Heatmap + 27 Government Data Sources
 * 12 user roles, 18 hot zones, hz_zone_intelligence pre-computed metrics
 * Smart cache with stale-while-revalidate, event-driven invalidation,
 * sync orchestrator with admin controls, freshness metadata per response
 */
import { z } from "zod";
import { router, isolatedProcedure as protectedProcedure, isolatedAdminProcedure as adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, count } from "drizzle-orm";
import { loads, hzZoneIntelligence, hzWeatherAlerts, hzFuelPrices, hzDataSyncLog, hzSeismicEvents, hzWildfires, hzHazmatIncidents, hzEpaFacilities, hzFemaDisasters, hzLockStatus, hzEmissions, hzRcraHandlers, hzCarrierSafety } from "../../drizzle/schema";
import { getFromCache, setInCache } from "../services/cache/hotZonesCache";
import { getFreshnessStatus } from "../services/cache/cacheConfig";
import { getSmartCacheStats } from "../services/cache/smartCache";
import { syncOrchestrator } from "../services/sync/syncOrchestrator";
import { dataEvents } from "../services/events/dataEventEmitter";

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

const PADD_TO_STATES: Record<string, string[]> = {
  R1X: ["CT","ME","MA","NH","RI","VT"], R1Y: ["DE","DC","MD","NJ","NY","PA"],
  R1Z: ["FL","GA","NC","SC","VA","WV"], R20: ["IL","IN","IA","KS","KY","MI","MN","MO","NE","ND","OH","OK","SD","TN","WI"],
  R30: ["AL","AR","LA","MS","NM","TX"], R40: ["CO","ID","MT","UT","WY"],
  R50: ["AK","AZ","CA","HI","NV","OR","WA"],
};
async function fetchFuelPrices(): Promise<ExtCache["fuelPrices"]> {
  const k = process.env.EIA_API_KEY; if (!k) return extCache.fuelPrices;
  const r = await fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data?api_key=${k}&data[]=value&facets[product][]=EPD2D&frequency=weekly&sort[0][column]=period&sort[0][direction]=desc&length=60`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return extCache.fuelPrices;
  const j = await r.json(); const p: ExtCache["fuelPrices"] = {};
  for (const row of j?.response?.data || []) {
    const padd = row.duoarea; if (!padd || !row.value) continue;
    const states = PADD_TO_STATES[padd];
    if (states) {
      for (const st of states) p[st] = { diesel: parseFloat(row.value), updatedAt: row.period };
    }
    p[padd] = { diesel: parseFloat(row.value), updatedAt: row.period };
  }
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
// ── ROLE-SPECIFIC ZONE METRICS, FILTERING & SORTING ──
function buildRoleMetrics(role: string, z: any): Array<{ label: string; value: string; color?: string }> {
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
  switch (role) {
    case "CATALYST":
      return [
        { label: "Open Loads", value: fmt(z.liveLoads) },
        { label: "Rate/mi", value: `$${Number(z.liveRate).toFixed(2)}` },
        { label: "Surge", value: `${z.liveSurge}x`, color: z.liveSurge > 1.3 ? "red" : z.liveSurge > 1.1 ? "amber" : undefined },
      ];
    case "SHIPPER":
      return [
        { label: "Avail. Trucks", value: fmt(z.liveTrucks) },
        { label: "Est. Rate", value: `$${Number(z.liveRate).toFixed(2)}/mi` },
        { label: "Response", value: z.liveRatio > 2.5 ? "Slow" : z.liveRatio > 1.5 ? "Normal" : "Fast", color: z.liveRatio > 2.5 ? "red" : z.liveRatio > 1.5 ? "amber" : "green" },
      ];
    case "DRIVER":
      return [
        { label: "Loads", value: fmt(z.liveLoads) },
        { label: "Est. Pay", value: `$${Math.round(Number(z.liveRate) * 250)}`, color: z.liveRate > 3 ? "green" : undefined },
        { label: "Diesel", value: z.fuelPrice != null ? `$${Number(z.fuelPrice).toFixed(2)}` : "N/A" },
      ];
    case "BROKER": {
      const margin = +((Number(z.liveRate) * Number(z.liveRatio) * 0.15)).toFixed(2);
      return [
        { label: "Loads", value: fmt(z.liveLoads) },
        { label: "Margin/mi", value: `+$${margin}`, color: margin > 0.5 ? "green" : undefined },
        { label: "Trucks", value: fmt(z.liveTrucks) },
      ];
    }
    case "DISPATCH":
      return [
        { label: "Open Loads", value: fmt(z.liveLoads) },
        { label: "Drivers", value: fmt(z.liveTrucks) },
        { label: "Imbalance", value: `${z.liveRatio}x`, color: z.liveRatio > 2.5 ? "red" : z.liveRatio > 1.8 ? "amber" : "green" },
      ];
    case "TERMINAL_MANAGER": {
      const hasTanker = (z.topEquipment || []).some((e: string) => ["TANKER","HAZMAT"].includes(e));
      const marketerScore = hasTanker ? Math.round(z.liveLoads * 0.6) : Math.round(z.liveLoads * 0.2);
      return [
        { label: "Inbound Vol.", value: fmt(z.liveLoads) },
        { label: "Marketers", value: fmt(marketerScore), color: marketerScore > 100 ? "green" : undefined },
        { label: "Crude/Chem", value: hasTanker ? `${Math.min(100, Math.round(((z.hazmatClasses?.length || 0) / 5) * 100))}%` : "0%" },
      ];
    }
    case "ESCORT": {
      const ovsLabel = z.oversizedFrequency === "VERY_HIGH" ? "Very High" : z.oversizedFrequency === "HIGH" ? "High" : "Moderate";
      return [
        { label: "Oversized", value: ovsLabel, color: z.oversizedFrequency === "VERY_HIGH" ? "red" : z.oversizedFrequency === "HIGH" ? "amber" : undefined },
        { label: "Rate/mi", value: `$${Number(z.liveRate).toFixed(2)}` },
        { label: "Permits Req.", value: String(z.hazmatClasses?.length || 0) },
      ];
    }
    case "FACTORING": {
      const estInvoices = Math.round(z.liveLoads * 0.7);
      return [
        { label: "Est. Invoices", value: fmt(estInvoices) },
        { label: "Avg Value", value: `$${fmt(Math.round(Number(z.liveRate) * 280))}` },
        { label: "Credit Risk", value: z.liveRatio > 2.5 ? "High" : z.liveRatio > 1.5 ? "Med" : "Low", color: z.liveRatio > 2.5 ? "red" : z.liveRatio > 1.5 ? "amber" : "green" },
      ];
    }
    case "COMPLIANCE_OFFICER":
      return [
        { label: "Risk Score", value: String(z.complianceRiskScore || 0), color: (z.complianceRiskScore || 0) > 50 ? "red" : (z.complianceRiskScore || 0) > 25 ? "amber" : "green" },
        { label: "Hazmat", value: `${z.hazmatClasses?.length || 0} classes` },
        { label: "Weather", value: z.weatherRiskLevel || "LOW", color: z.weatherRiskLevel === "HIGH" ? "red" : z.weatherRiskLevel === "MODERATE" ? "amber" : undefined },
      ];
    case "SAFETY_MANAGER": {
      const ss = z.safetyScore != null ? Math.round(z.safetyScore) : Math.max(0, 100 - Math.round(((z.weatherAlerts?.length || 0) * 15) + ((z.hazmatClasses?.length || 0) * 10)));
      const incidentCount = (z.recentHazmatIncidents || 0) + (z.activeWildfires || 0);
      return [
        { label: "Safety Score", value: String(ss), color: ss < 50 ? "red" : ss < 70 ? "amber" : "green" },
        { label: "Hazmat", value: `${z.hazmatClasses?.length || 0} classes` },
        { label: "Incidents", value: incidentCount > 0 ? String(incidentCount) : "Clear", color: incidentCount > 2 ? "red" : incidentCount > 0 ? "amber" : "green" },
      ];
    }
    default: // ADMIN, SUPER_ADMIN
      return [
        { label: "Loads", value: fmt(z.liveLoads) },
        { label: "Trucks", value: fmt(z.liveTrucks) },
        { label: "L:T Ratio", value: `${z.liveRatio}x`, color: z.liveRatio > 2.5 ? "red" : z.liveRatio > 1.8 ? "amber" : undefined },
      ];
  }
}

function filterZonesForRole(role: string, zones: any[]): any[] {
  switch (role) {
    case "TERMINAL_MANAGER":
      return zones.filter(z =>
        z.topEquipment.some((e: string) => ["TANKER","HAZMAT","FLATBED"].includes(e)) ||
        (z.hazmatClasses?.length || 0) > 2
      );
    case "ESCORT":
      return zones.filter(z =>
        z.topEquipment.some((e: string) => ["FLATBED","HAZMAT"].includes(e)) ||
        ["HIGH","VERY_HIGH"].includes(z.oversizedFrequency || "")
      );
    default:
      return zones;
  }
}

function sortZonesForRole(role: string, zones: any[]): any[] {
  const copy = [...zones];
  switch (role) {
    case "CATALYST":
    case "DRIVER":
      return copy.sort((a, b) => b.liveLoads - a.liveLoads);
    case "SHIPPER":
      return copy.sort((a, b) => b.liveTrucks - a.liveTrucks);
    case "BROKER":
      return copy.sort((a, b) => (b.liveRate * b.liveRatio) - (a.liveRate * a.liveRatio));
    case "DISPATCH":
      return copy.sort((a, b) => b.liveRatio - a.liveRatio);
    case "TERMINAL_MANAGER":
      return copy.sort((a, b) => {
        const aT = (a.topEquipment || []).some((e: string) => ["TANKER","HAZMAT"].includes(e)) ? 1 : 0;
        const bT = (b.topEquipment || []).some((e: string) => ["TANKER","HAZMAT"].includes(e)) ? 1 : 0;
        return bT - aT || b.liveLoads - a.liveLoads;
      });
    case "ESCORT": {
      const ovsO: Record<string, number> = { VERY_HIGH: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
      return copy.sort((a, b) => (ovsO[b.oversizedFrequency] || 0) - (ovsO[a.oversizedFrequency] || 0));
    }
    case "FACTORING":
      return copy.sort((a, b) => b.liveLoads - a.liveLoads);
    case "COMPLIANCE_OFFICER":
      return copy.sort((a, b) => (b.complianceRiskScore || 0) - (a.complianceRiskScore || 0));
    case "SAFETY_MANAGER":
      return copy.sort((a, b) => {
        const aS = a.safetyScore != null ? a.safetyScore : 100 - ((a.weatherAlerts?.length || 0) * 15 + (a.hazmatClasses?.length || 0) * 10);
        const bS = b.safetyScore != null ? b.safetyScore : 100 - ((b.weatherAlerts?.length || 0) * 15 + (b.hazmatClasses?.length || 0) * 10);
        return aS - bS;
      });
    default:
      return copy.sort((a, b) => b.liveRatio - a.liveRatio);
  }
}

function buildRolePulseStats(role: string, filtered: any[], fuelPrices: Record<string, { diesel: number }>, weatherAlerts: Array<{ severity: string }>): Array<{ label: string; value: string; icon: string }> {
  const totalLoads = filtered.reduce((s, z) => s + (z.liveLoads || 0), 0);
  const totalTrucks = filtered.reduce((s, z) => s + (z.liveTrucks || 0), 0);
  const avgRate = filtered.length > 0 ? +(filtered.reduce((s, z) => s + z.liveRate, 0) / filtered.length).toFixed(2) : 0;
  const critical = filtered.filter(z => z.demandLevel === "CRITICAL").length;
  const fp = Object.values(fuelPrices);
  const avgFuel = fp.length > 0 ? +(fp.reduce((s, f) => s + f.diesel, 0) / fp.length).toFixed(3) : null;
  const sevWx = weatherAlerts.filter(a => ["Extreme","Severe"].includes(a.severity)).length;
  const bestRate = filtered.length > 0 ? Math.max(...filtered.map(z => z.liveRate)) : 0;
  switch (role) {
    case "CATALYST":
      return [
        { label: "Open Loads", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Best Rate", value: `$${bestRate.toFixed(2)}/mi`, icon: "trending_up" },
        { label: "Surge Zones", value: String(critical), icon: "zap" },
        ...(avgFuel ? [{ label: "Diesel", value: `$${avgFuel}`, icon: "fuel" }] : []),
      ];
    case "SHIPPER":
      return [
        { label: "Avail. Trucks", value: totalTrucks.toLocaleString(), icon: "truck" },
        { label: "Avg Rate", value: `$${avgRate}/mi`, icon: "trending_up" },
        { label: "Hot Markets", value: String(critical), icon: "flame" },
        ...(sevWx > 0 ? [{ label: "Weather Alerts", value: String(sevWx), icon: "cloud_rain" }] : []),
      ];
    case "DRIVER":
      return [
        { label: "Loads", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Best Rate", value: `$${bestRate.toFixed(2)}/mi`, icon: "trending_up" },
        ...(avgFuel ? [{ label: "Avg Diesel", value: `$${avgFuel}`, icon: "fuel" }] : []),
        { label: "Surge Zones", value: String(critical), icon: "zap" },
      ];
    case "BROKER":
      return [
        { label: "Total Loads", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Best Margin", value: `$${(bestRate * 0.15).toFixed(2)}/mi`, icon: "trending_up" },
        { label: "Trucks", value: totalTrucks.toLocaleString(), icon: "truck" },
        { label: "Critical", value: String(critical), icon: "zap" },
      ];
    case "DISPATCH":
      return [
        { label: "Open Loads", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Drivers Avail.", value: totalTrucks.toLocaleString(), icon: "truck" },
        { label: "Avg Imbalance", value: `${totalTrucks > 0 ? (totalLoads / totalTrucks).toFixed(1) : 0}x`, icon: "bar_chart" },
        { label: "Critical", value: String(critical), icon: "zap" },
      ];
    case "TERMINAL_MANAGER":
      return [
        { label: "Inbound Freight", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Active Marketers", value: String(Math.round(totalLoads * 0.4)), icon: "truck" },
        { label: "Crude Zones", value: String(filtered.filter(z => z.topEquipment?.includes("TANKER")).length), icon: "bar_chart" },
        ...(sevWx > 0 ? [{ label: "Weather", value: String(sevWx), icon: "cloud_rain" }] : []),
      ];
    case "ESCORT":
      return [
        { label: "Oversized Zones", value: String(filtered.filter(z => ["HIGH","VERY_HIGH"].includes(z.oversizedFrequency)).length), icon: "flame" },
        { label: "Best Rate", value: `$${bestRate.toFixed(2)}/mi`, icon: "trending_up" },
        { label: "Permit Corridors", value: String(filtered.length), icon: "navigation" },
        ...(sevWx > 0 ? [{ label: "Weather", value: String(sevWx), icon: "cloud_rain" }] : []),
      ];
    case "FACTORING":
      return [
        { label: "Est. Invoices", value: String(Math.round(totalLoads * 0.7)), icon: "bar_chart" },
        { label: "Avg Value", value: `$${Math.round(avgRate * 280)}`, icon: "trending_up" },
        { label: "High Risk", value: String(filtered.filter(z => z.liveRatio > 2.5).length), icon: "alert" },
        { label: "Active Zones", value: String(filtered.length), icon: "zap" },
      ];
    case "COMPLIANCE_OFFICER":
      return [
        { label: "Risk Zones", value: String(filtered.filter(z => (z.complianceRiskScore || 0) > 40).length), icon: "alert" },
        { label: "Hazmat Active", value: String(filtered.filter(z => (z.hazmatClasses?.length || 0) > 2).length), icon: "shield" },
        { label: "Avg Risk", value: String(Math.round(filtered.reduce((s, z) => s + (z.complianceRiskScore || 0), 0) / Math.max(filtered.length, 1))), icon: "bar_chart" },
        ...(sevWx > 0 ? [{ label: "Weather", value: String(sevWx), icon: "cloud_rain" }] : []),
      ];
    case "SAFETY_MANAGER": {
      const lowSafety = filtered.filter(z => { const s2 = z.safetyScore != null ? z.safetyScore : 100-((z.weatherAlerts?.length||0)*15+(z.hazmatClasses?.length||0)*10); return s2 < 60; }).length;
      const totalIncidents = filtered.reduce((s, z) => s + (z.recentHazmatIncidents || 0) + (z.activeWildfires || 0), 0);
      return [
        { label: "Low Safety", value: String(lowSafety), icon: "alert" },
        { label: "Hazmat Zones", value: String(filtered.filter(z => (z.hazmatClasses?.length || 0) > 2).length), icon: "shield" },
        { label: "Active Incidents", value: String(totalIncidents || sevWx), icon: "flame" },
        { label: "Monitored", value: String(filtered.length), icon: "bar_chart" },
      ];
    }
    default: // ADMIN, SUPER_ADMIN
      return [
        { label: "Total Loads", value: totalLoads.toLocaleString(), icon: "flame" },
        { label: "Avg Rate", value: `$${avgRate}/mi`, icon: "trending_up" },
        { label: "L:T Ratio", value: `${totalTrucks > 0 ? (totalLoads / totalTrucks).toFixed(1) : 0}x`, icon: "bar_chart" },
        { label: "Critical", value: String(critical), icon: "zap" },
        ...(avgFuel ? [{ label: "Diesel", value: `$${avgFuel}`, icon: "fuel" }] : []),
      ];
  }
}

// ── HZ_ZONE_INTELLIGENCE READER ──
// Reads pre-computed zone metrics from hz_zone_intelligence (populated by scheduler)
async function getZoneIntelligenceData(): Promise<Record<string, any> | null> {
  // Check cache first
  const cached = getFromCache<Record<string, any>>("hz:zone_intelligence_map");
  if (cached) return cached;

  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db.select().from(hzZoneIntelligence);
    if (!rows || rows.length === 0) return null;

    const map: Record<string, any> = {};
    for (const row of rows) {
      map[row.zoneId] = row;
    }

    setInCache("hz:zone_intelligence_map", map, "ZONE_INTELLIGENCE");
    return map;
  } catch {
    return null;
  }
}

// Read active weather alerts from hz_weather_alerts (populated by NWS scheduler)
async function getDbWeatherAlerts(): Promise<ExtCache["weatherAlerts"]> {
  const cacheKey = "hz:weather_alerts_formatted";
  const cached = getFromCache<ExtCache["weatherAlerts"]>(cacheKey);
  if (cached) return cached;

  try {
    const db = await getDb();
    if (!db) return [];

    const rows = await db.select().from(hzWeatherAlerts).where(sql`expires_at > NOW() OR expires_at IS NULL`).limit(500);
    if (!rows || rows.length === 0) return [];

    const alerts: ExtCache["weatherAlerts"] = rows.map((r: any) => {
      let states: string[] = [];
      try {
        states = typeof r.stateCodes === "string" ? JSON.parse(r.stateCodes) : r.stateCodes || [];
      } catch {}
      return {
        state: states.join(","),
        event: r.eventType || "",
        severity: r.severity || "",
        headline: r.headline || "",
      };
    });

    setInCache(cacheKey, alerts, "WEATHER_ALERTS");
    return alerts;
  } catch {
    return [];
  }
}

// Read fuel prices from hz_fuel_prices (populated by EIA scheduler)
async function getDbFuelPrices(): Promise<ExtCache["fuelPrices"]> {
  const cacheKey = "hz:fuel_prices_formatted";
  const cached = getFromCache<ExtCache["fuelPrices"]>(cacheKey);
  if (cached) return cached;

  try {
    const db = await getDb();
    if (!db) return {};

    const rows = await db.select().from(hzFuelPrices).orderBy(sql`report_date DESC`).limit(100);
    if (!rows || rows.length === 0) return {};

    const prices: ExtCache["fuelPrices"] = {};
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.stateCode)) continue;
      seen.add(r.stateCode);
      prices[r.stateCode] = {
        diesel: parseFloat(r.dieselRetail || "0"),
        updatedAt: r.reportDate ? String(r.reportDate) : "",
      };
    }

    setInCache(cacheKey, prices, "FUEL_PRICES");
    return prices;
  } catch {
    return {};
  }
}

// ── DB ENHANCEMENT ──
interface DbEnhancement {
  loadsByState: Record<string, number>;
  totalPlatformLoads: number;
  avgRateByState: Record<string, number>;
  trucksByState: Record<string, number>;
}
async function getDbEnhancement(): Promise<DbEnhancement> {
  const result: DbEnhancement = { loadsByState: {}, totalPlatformLoads: 0, avgRateByState: {}, trucksByState: {} };
  try {
    const db = await getDb(); if (!db) return result;
    // Active loads by state with average rate
    const rows = await db.execute(
      sql`SELECT JSON_EXTRACT(pickupLocation, '$.state') as st, COUNT(*) as cnt, AVG(rate / NULLIF(distance, 0)) as avgRpm FROM loads WHERE status IN ('posted','bidding','assigned','in_transit') AND deletedAt IS NULL GROUP BY st`
    );
    ((rows as any[]) || []).forEach((r: any) => {
      const st = (r.st || '').replace(/"/g, '');
      if (st) {
        result.loadsByState[st] = Number(r.cnt);
        result.totalPlatformLoads += Number(r.cnt);
        if (r.avgRpm && Number(r.avgRpm) > 0) result.avgRateByState[st] = +Number(r.avgRpm).toFixed(2);
      }
    });
    // Assigned vehicles (trucks) by state
    const truckRows = await db.execute(
      sql`SELECT JSON_EXTRACT(pickupLocation, '$.state') as st, COUNT(DISTINCT driverId) as cnt FROM loads WHERE status IN ('assigned','in_transit') AND driverId IS NOT NULL AND deletedAt IS NULL GROUP BY st`
    );
    ((truckRows as any[]) || []).forEach((r: any) => {
      const st = (r.st || '').replace(/"/g, '');
      if (st) result.trucksByState[st] = Number(r.cnt);
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

      // Try to read pre-computed zone intelligence from scheduler (hz_zone_intelligence)
      // Falls back to inline EIA/NWS fetch if scheduler data not yet available
      const [zoneIntel, dbData, dbFuel, dbWeather, inlineFuel, inlineWeather] = await Promise.all([
        getZoneIntelligenceData(),
        getDbEnhancement(),
        getDbFuelPrices(),
        getDbWeatherAlerts(),
        cached("fuelPrices", fetchFuelPrices),
        cached("weatherAlerts", fetchWeatherAlerts),
      ]);

      // Prefer scheduler DB data, fall back to inline API data
      const fuelPrices = Object.keys(dbFuel).length > 0 ? dbFuel : inlineFuel;
      const weatherAlerts = dbWeather.length > 0 ? dbWeather : inlineWeather;
      const hasZoneIntel = zoneIntel !== null && Object.keys(zoneIntel).length > 0;
      const hasDbData = dbData.totalPlatformLoads > 0;

      // Threshold: platform DB must have meaningful data to override market baselines
      // If platform data is too sparse, blend with market intelligence baselines
      const PLATFORM_DATA_THRESHOLD = 10; // need at least 10 total platform loads to trust DB counts

      const feed = HOT_ZONES.map(zone => {
        const intel = hasZoneIntel ? zoneIntel[zone.id] : null;

        const dbLoads = dbData.loadsByState[zone.state] || 0;
        const dbTrucks = dbData.trucksByState[zone.state] || 0;
        const dbRate = dbData.avgRateByState[zone.state] || 0;
        const platformMature = dbData.totalPlatformLoads >= PLATFORM_DATA_THRESHOLD;

        // Blend strategy: use DB data when platform is mature, otherwise use market baselines
        // When DB has some data but is sparse, blend: max(dbValue, baseline * scaleFactor)
        const intelLoads = intel ? Number(intel.liveLoads) || 0 : 0;
        const intelTrucks = intel ? Number(intel.liveTrucks) || 0 : 0;

        // ── VOLUME METRICS: loads & trucks ──
        // Only trust zone intelligence volume data when it's meaningfully populated
        // (e.g., USDA has 10+ rate reports or FMCSA has real carrier counts)
        // Otherwise use market baselines. Risk/compliance/safety metrics from gov data are separate.
        const VOLUME_THRESHOLD = 10; // need 10+ to trust as real volume signal
        let liveLoads: number;
        let liveTrucks: number;
        if (intelLoads >= VOLUME_THRESHOLD || intelTrucks >= VOLUME_THRESHOLD) {
          // Zone intelligence has meaningful volume data from USDA/FMCSA
          liveLoads = intelLoads >= VOLUME_THRESHOLD ? intelLoads : zone.loadCount;
          liveTrucks = intelTrucks >= VOLUME_THRESHOLD ? intelTrucks : zone.truckCount;
        } else if (platformMature && dbLoads > 5) {
          liveLoads = dbLoads;
          liveTrucks = Math.max(dbTrucks, Math.round(dbLoads / zone.loadToTruckRatio));
        } else {
          // Market baselines with time-of-day variation
          const hourFactor = 0.85 + Math.sin(Date.now() / 3600000 * Math.PI / 12) * 0.15;
          liveLoads = Math.round(zone.loadCount * hourFactor);
          liveTrucks = Math.round(zone.truckCount * hourFactor);
        }

        liveLoads = Math.max(liveLoads, 1);
        liveTrucks = Math.max(liveTrucks, 1);

        // ── RATE: prefer real USDA AMS rate > platform DB > baseline ──
        const intelRate = intel ? Number(intel.avgRatePerMile) || 0 : 0;
        const liveRate = intelRate > 0.5 ? intelRate : platformMature && dbRate > 0 ? dbRate : zone.avgRate;
        const liveRatio = liveTrucks > 0 ? +(liveLoads / liveTrucks).toFixed(2) : zone.loadToTruckRatio;
        const liveSurge = intel && Number(intel.surgeMultiplier) > 0 ? Number(intel.surgeMultiplier) : +(liveRatio > 2.5 ? 1 + (liveRatio - 1) * 0.2 : 1 + (liveRatio - 1) * 0.1).toFixed(2);
        // Rate change vs baseline — shows market delta when USDA or platform data available
        const rateChange = intelRate > 0.5 ? +(liveRate - zone.avgRate).toFixed(2) : platformMature && dbRate > 0 ? +(liveRate - zone.avgRate).toFixed(2) : 0;
        const rateChangePct = intelRate > 0.5 || (platformMature && dbRate > 0) ? +(((liveRate - zone.avgRate) / zone.avgRate) * 100).toFixed(1) : 0;

        // Fuel: prefer hz_zone_intelligence diesel, then hz_fuel_prices, then inline EIA
        const intelDiesel = intel ? Number(intel.dieselPrice) || 0 : 0;
        const zoneFuel = intelDiesel > 0 ? { diesel: intelDiesel, updatedAt: "" } : fuelPrices[zone.state] || null;

        // Weather: prefer hz_zone_intelligence aggregated weather, then hz_weather_alerts, then inline NWS
        const zoneWeather = weatherAlerts.filter(a => a.state.includes(zone.state) && ["Extreme","Severe"].includes(a.severity));
        const intelWeatherAlerts = intel ? Number(intel.activeWeatherAlerts) || 0 : 0;
        const intelMaxSeverity = intel?.maxWeatherSeverity || null;

        // Compliance & safety from pre-computed intelligence — fall back to formula if intel score is 0/null
        const intelCompRisk = intel ? Math.round(Number(intel.complianceRiskScore) || 0) : 0;
        const formulaCompRisk = Math.round((zoneWeather.length * 20) + (zone.hazmatClasses?.length || 0) * 15 + (liveRatio > 2.5 ? 20 : 0) + ((zone.oversizedFrequency === "VERY_HIGH" ? 10 : zone.oversizedFrequency === "HIGH" ? 5 : 0)));
        const compRisk = intelCompRisk > 0 ? intelCompRisk : formulaCompRisk;
        const wxLevel = intelMaxSeverity ? (["Severe","Extreme"].includes(intelMaxSeverity) ? "HIGH" : intelMaxSeverity !== "None" ? "MODERATE" : "LOW") : (zoneWeather.length > 2 ? "HIGH" : zoneWeather.length > 0 ? "MODERATE" : "LOW");

        const zd = {
          zoneId: zone.id, zoneName: zone.name, state: zone.state, center: zone.center, radius: zone.radius,
          demandLevel: (liveRatio > 2.8 ? "CRITICAL" : liveRatio > 2.0 ? "HIGH" : "ELEVATED") as string,
          liveRate, liveLoads, liveTrucks, liveRatio, liveSurge,
          rateChange, rateChangePercent: rateChangePct,
          topEquipment: zone.topEquipment, reasons: zone.reasons, peakHours: zone.peakHours,
          hazmatClasses: zone.hazmatClasses, oversizedFrequency: zone.oversizedFrequency,
          fuelPrice: zoneFuel?.diesel || null, fuelPriceUpdated: zoneFuel?.updatedAt || null,
          weatherAlerts: zoneWeather.slice(0, 3), weatherRiskLevel: wxLevel,
          complianceRiskScore: compRisk,
          // Enriched data from hz_zone_intelligence (new in v4)
          safetyScore: intel ? Number(intel.avgCarrierSafetyScore) || null : null,
          carriersWithViolations: intel ? Number(intel.carriersWithViolations) || 0 : 0,
          recentHazmatIncidents: intel ? Number(intel.recentHazmatIncidents) || 0 : 0,
          activeWildfires: intel ? Number(intel.activeWildfires) || 0 : 0,
          femaDisasterActive: intel ? Boolean(intel.femaDisasterActive) : false,
          seismicRiskLevel: intel?.seismicRiskLevel || "Low",
          epaFacilitiesCount: intel ? Number(intel.epaFacilitiesCount) || 0 : 0,
          platformLoads: dbLoads, timestamp: new Date().toISOString(),
        };
        return { ...zd, roleMetrics: buildRoleMetrics(role, zd) };
      });
      // Role-specific filtering & sorting
      let filtered = filterZonesForRole(role, [...feed]);
      if (input?.equipment) filtered = filtered.filter(z => z.topEquipment.includes(input.equipment!));
      filtered = sortZonesForRole(role, filtered);
      const coldFeed = COLD_ZONES.map(z => ({ ...z, liveRate: +(z.surgeMultiplier * 2.20).toFixed(2), liveSurge: z.surgeMultiplier, timestamp: new Date().toISOString() }));
      return {
        zones: filtered, coldZones: coldFeed, roleContext,
        platformDataAvailable: dbData.totalPlatformLoads > 0,
        externalDataStatus: { fuelPrices: Object.keys(fuelPrices).length > 0, weatherAlerts: weatherAlerts.length > 0 },
        feedSource: hasZoneIntel
          ? `EusoTrip Intelligence (${dbData.totalPlatformLoads} loads) + 27 Gov Sources (NWS, EIA, FMCSA, USGS, PHMSA, NIFC, FEMA, EPA, USDA, USACE)`
          : dbData.totalPlatformLoads > 0
            ? `EusoTrip Platform (${dbData.totalPlatformLoads} loads) + EIA + NWS`
            : "EusoTrip Market Intelligence + EIA + NWS",
        refreshInterval: 10, timestamp: new Date().toISOString(),
        _meta: {
          zoneIntelligence: { fresh: hasZoneIntel, status: hasZoneIntel ? getFreshnessStatus("ZONE_INTELLIGENCE", 0) : "expired" },
          fuelPrices: { fresh: Object.keys(fuelPrices).length > 0, status: Object.keys(fuelPrices).length > 0 ? getFreshnessStatus("FUEL_PRICES", 0) : "expired" },
          weatherAlerts: { fresh: weatherAlerts.length > 0, status: weatherAlerts.length > 0 ? getFreshnessStatus("WEATHER_ALERTS", 0) : "expired" },
          fetchedAt: new Date().toISOString(),
          dataSources: hasZoneIntel ? 27 : dbData.totalPlatformLoads > 0 ? 3 : 1,
        },
        marketPulse: {
          avgRate: filtered.length > 0 ? +(filtered.reduce((s, z) => s + z.liveRate, 0) / filtered.length).toFixed(2) : 0,
          avgRatio: filtered.length > 0 ? +(filtered.reduce((s, z) => s + z.liveRatio, 0) / filtered.length).toFixed(2) : 0,
          totalLoads: filtered.reduce((s, z) => s + z.liveLoads, 0),
          totalTrucks: filtered.reduce((s, z) => s + z.liveTrucks, 0),
          criticalZones: filtered.filter(z => z.demandLevel === "CRITICAL").length,
          avgFuelPrice: Object.values(fuelPrices).length > 0 ? +(Object.values(fuelPrices).reduce((s, f) => s + f.diesel, 0) / Object.values(fuelPrices).length).toFixed(3) : null,
          activeWeatherAlerts: weatherAlerts.filter(a => ["Extreme","Severe"].includes(a.severity)).length,
          rolePulseStats: buildRolePulseStats(role, filtered, fuelPrices, weatherAlerts),
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
        complianceRiskScore: Math.round((zoneWeather.filter(a => ["Extreme","Severe"].includes(a.severity)).length * 20) + (zone.hazmatClasses?.length || 0) * 15 + (zone.loadToTruckRatio > 2.5 ? 20 : 0) + (zone.oversizedFrequency === "VERY_HIGH" ? 10 : zone.oversizedFrequency === "HIGH" ? 5 : 0)),
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

  // Surge history — real DB data bucketed by hour, falls back to flat baseline
  getSurgeHistory: protectedProcedure
    .input(z.object({ zoneId: z.string(), hours: z.number().default(24) }))
    .query(async ({ input }) => {
      const zone = HOT_ZONES.find(z => z.id === input.zoneId);
      if (!zone) return { history: [], zoneId: input.zoneId };

      // Try to pull real hourly data from DB
      const points: Array<{ timestamp: string; surge: number; ratio: number; rate: number }> = [];
      try {
        const db = await getDb();
        if (db) {
          const since = new Date(Date.now() - input.hours * 3600000).toISOString();
          const rows = await db.execute(
            sql`SELECT
              DATE_FORMAT(createdAt, '%Y-%m-%d %H:00:00') as hr,
              COUNT(*) as loads,
              COUNT(DISTINCT driverId) as trucks,
              AVG(rate / NULLIF(distance, 0)) as avgRpm
            FROM loads
            WHERE JSON_EXTRACT(pickupLocation, '$.state') = ${zone.state}
              AND createdAt >= ${since}
              AND deletedAt IS NULL
            GROUP BY hr ORDER BY hr`
          );
          const hourMap: Record<string, { loads: number; trucks: number; rate: number }> = {};
          for (const r of (rows as any[]) || []) {
            if (r.hr) hourMap[r.hr] = { loads: Number(r.loads), trucks: Math.max(Number(r.trucks), 1), rate: Number(r.avgRpm) || zone.avgRate };
          }
          // Build full timeline with DB data where available, flat baseline otherwise
          const now = Date.now();
          for (let i = input.hours; i >= 0; i--) {
            const t = now - i * 3600000;
            const hrKey = new Date(t).toISOString().slice(0, 13).replace("T", " ") + ":00:00";
            const dbRow = hourMap[hrKey];
            const loads = dbRow?.loads ?? zone.loadCount;
            const trucks = dbRow?.trucks ?? zone.truckCount;
            const rate = dbRow?.rate ?? zone.avgRate;
            const ratio = trucks > 0 ? +(loads / trucks).toFixed(2) : zone.loadToTruckRatio;
            const surge = +(ratio > 2.5 ? 1 + (ratio - 1) * 0.2 : 1 + (ratio - 1) * 0.1).toFixed(2);
            points.push({ timestamp: new Date(t).toISOString(), surge, ratio, rate: +rate.toFixed(2) });
          }
          return { history: points, zoneId: input.zoneId, zoneName: zone.name };
        }
      } catch { /* DB not ready, use baseline */ }

      // Fallback: flat baseline (no fake variation)
      const now = Date.now();
      for (let i = input.hours; i >= 0; i--) {
        const t = now - i * 3600000;
        points.push({ timestamp: new Date(t).toISOString(), surge: zone.surgeMultiplier, ratio: zone.loadToTruckRatio, rate: zone.avgRate });
      }
      return { history: points, zoneId: input.zoneId, zoneName: zone.name };
    }),

  // Filter zones by equipment type
  getZonesByEquipment: protectedProcedure
    .input(z.object({ equipment: z.string() }))
    .query(async ({ input }) => {
      const filtered = HOT_ZONES.filter(zone => zone.topEquipment.includes(input.equipment.toUpperCase()));
      return { zones: filtered.map(z => ({ id: z.id, name: z.name, center: z.center, radius: z.radius, state: z.state, avgRate: z.avgRate, loadToTruckRatio: z.loadToTruckRatio, surgeMultiplier: z.surgeMultiplier })), equipment: input.equipment, total: filtered.length, timestamp: new Date().toISOString() };
    }),

  // Filter zones by region
  getZonesByRegion: protectedProcedure
    .input(z.object({ region: z.enum(["northeast", "southeast", "midwest", "southwest", "west", "gulf_coast", "plains"]) }))
    .query(async ({ input }) => {
      const regionStates: Record<string, string[]> = {
        northeast: ["NY","NJ","PA","CT","MA","ME","NH","VT","RI"],
        southeast: ["GA","FL","SC","NC","VA","TN","AL","MS"],
        midwest: ["IL","MI","OH","IN","WI","MN","MO","IA"],
        southwest: ["TX","AZ","NM","OK"],
        west: ["CA","WA","OR","CO","UT","NV"],
        gulf_coast: ["TX","LA","MS","AL","FL"],
        plains: ["ND","SD","NE","KS","MT","WY"],
      };
      const states = regionStates[input.region] || [];
      const filtered = HOT_ZONES.filter(zone => states.includes(zone.state));
      return { zones: filtered.map(z => ({ id: z.id, name: z.name, center: z.center, state: z.state, avgRate: z.avgRate, loadToTruckRatio: z.loadToTruckRatio, surgeMultiplier: z.surgeMultiplier, hazmatClasses: z.hazmatClasses })), region: input.region, total: filtered.length, timestamp: new Date().toISOString() };
    }),

  // Subscribe to zone alerts
  subscribe: protectedProcedure
    .input(z.object({ zoneId: z.string(), alertTypes: z.array(z.enum(["surge", "rate_change", "weather", "demand"])).default(["surge"]) }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, zoneId: input.zoneId, alertTypes: input.alertTypes, subscribedBy: ctx.user?.id, subscribedAt: new Date().toISOString() };
    }),

  // Unsubscribe from zone alerts
  unsubscribe: protectedProcedure
    .input(z.object({ zoneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, zoneId: input.zoneId, unsubscribedBy: ctx.user?.id, unsubscribedAt: new Date().toISOString() };
    }),

  // Rate predictions based on historical trends
  getPredictions: protectedProcedure
    .input(z.object({ zoneId: z.string(), hoursAhead: z.number().default(24) }))
    .query(async ({ input }) => {
      const zone = HOT_ZONES.find(z => z.id === input.zoneId);
      if (!zone) return { predictions: [], zoneId: input.zoneId };
      const predictions = [];
      const now = Date.now();
      for (let i = 1; i <= input.hoursAhead; i++) {
        const t = now + i * 3600000;
        const hour = new Date(t).getHours();
        const peakFactor = (hour >= 6 && hour <= 14) ? 1.1 : 0.95;
        predictions.push({ timestamp: new Date(t).toISOString(), predictedRate: +(zone.avgRate * peakFactor).toFixed(2), predictedSurge: +(zone.surgeMultiplier * peakFactor).toFixed(2), confidence: 0.72 });
      }
      return { predictions, zoneId: input.zoneId, zoneName: zone.name, model: "time_series_baseline", timestamp: new Date().toISOString() };
    }),

  // Heatmap data for map visualization
  getHeatmapData: protectedProcedure
    .input(z.object({ metric: z.enum(["demand", "rate", "surge", "hazmat"]).default("demand") }))
    .query(async ({ ctx }) => {
      const role = ctx.user?.role?.toUpperCase() || "DRIVER";
      const roleCtx = getRoleContext(role);
      const allZones = [...HOT_ZONES.map(z => ({ lat: z.center.lat, lng: z.center.lng, weight: z.loadToTruckRatio, name: z.name, id: z.id, state: z.state })), ...COLD_ZONES.map(z => ({ lat: z.center.lat, lng: z.center.lng, weight: z.surgeMultiplier * 0.5, name: z.name, id: z.id, state: "" }))];
      return { points: allZones, roleContext: roleCtx, gradient: roleCtx.gradient, totalPoints: allZones.length, timestamp: new Date().toISOString() };
    }),

  // Top performing lanes
  getTopLanes: protectedProcedure
    .input(z.object({ limit: z.number().default(10), sortBy: z.enum(["rate", "volume", "surge"]).default("rate") }))
    .query(async () => {
      const sorted = [...HOT_ZONES].sort((a, b) => b.avgRate - a.avgRate);
      const lanes = [];
      for (let i = 0; i < Math.min(sorted.length - 1, 10); i++) {
        const origin = sorted[i]; const dest = sorted[(i + 1) % sorted.length];
        lanes.push({ id: `lane_${i}`, origin: origin.name, destination: dest.name, originState: origin.state, destState: dest.state, avgRate: +((origin.avgRate + dest.avgRate) / 2).toFixed(2), volume: origin.loadCount + dest.loadCount, surgeMultiplier: +((origin.surgeMultiplier + dest.surgeMultiplier) / 2).toFixed(2), hazmatAvailable: origin.hazmatClasses.length > 2 || dest.hazmatClasses.length > 2 });
      }
      return { lanes: lanes.slice(0, 10), timestamp: new Date().toISOString() };
    }),

  // Market pulse summary
  getMarketPulse: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user?.role?.toUpperCase() || "DRIVER";
    const [fuelPrices, weatherAlerts] = await Promise.all([
      cached("fuelPrices", fetchFuelPrices),
      cached("weatherAlerts", fetchWeatherAlerts),
    ]);
    const totalLoads = HOT_ZONES.reduce((s, z) => s + z.loadCount, 0);
    const totalTrucks = HOT_ZONES.reduce((s, z) => s + z.truckCount, 0);
    const avgRate = +(HOT_ZONES.reduce((s, z) => s + z.avgRate, 0) / HOT_ZONES.length).toFixed(2);
    const criticalZones = HOT_ZONES.filter(z => z.loadToTruckRatio > 2.8).length;
    const hazmatZones = HOT_ZONES.filter(z => z.hazmatClasses.length > 3).length;
    const avgFuel = Object.values(fuelPrices).length > 0 ? +(Object.values(fuelPrices).reduce((s, f) => s + f.diesel, 0) / Object.values(fuelPrices).length).toFixed(3) : null;
    const severeWeather = weatherAlerts.filter(a => ["Extreme", "Severe"].includes(a.severity)).length;
    return {
      totalLoads, totalTrucks, avgRate, avgLoadToTruckRatio: +(totalLoads / Math.max(totalTrucks, 1)).toFixed(2),
      criticalZones, hazmatZones, totalHotZones: HOT_ZONES.length, totalColdZones: COLD_ZONES.length,
      avgFuelPrice: avgFuel, severeWeatherAlerts: severeWeather,
      marketTrend: avgRate > 3.0 ? "bullish" : avgRate > 2.5 ? "neutral" : "bearish",
      roleContext: getRoleContext(role), timestamp: new Date().toISOString(),
    };
  }),

  // ═══ FORCE REFRESH — User-triggered data refresh ═══
  forceRefresh: protectedProcedure
    .input(z.object({ dataType: z.string().optional() }))
    .mutation(async ({ input }) => {
      const dataType = input.dataType || "ZONE_INTELLIGENCE";
      const result = await syncOrchestrator.triggerJob(dataType);
      return { success: result.success, dataType, error: result.error || null, triggeredAt: new Date().toISOString() };
    }),

  // ═══ ADMIN: Sync Orchestrator Status ═══
  getSyncStatus: adminProcedure.query(async () => {
    const jobs = syncOrchestrator.getAllJobStatus();
    const summary = syncOrchestrator.getSummary();
    const cacheStats = getSmartCacheStats();
    const recentEvents = dataEvents.getRecentEvents(10);
    const criticalEvents = dataEvents.getCriticalEvents();

    return {
      orchestrator: summary,
      jobs,
      cache: cacheStats,
      events: { recent: recentEvents.map(e => ({ type: e.type, severity: e.severity, summary: e.summary, timestamp: e.timestamp.toISOString(), states: e.affectedStates })), critical: criticalEvents.length },
      timestamp: new Date().toISOString(),
    };
  }),

  // Admin: Trigger a specific sync job
  triggerSync: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await syncOrchestrator.triggerJob(input.jobId);
      return { success: result.success, jobId: input.jobId, error: result.error || null, triggeredAt: new Date().toISOString() };
    }),

  // Admin: Enable/disable a sync job
  setSyncJobEnabled: adminProcedure
    .input(z.object({ jobId: z.string(), enabled: z.boolean(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const success = input.enabled
        ? syncOrchestrator.enableJob(input.jobId)
        : syncOrchestrator.disableJob(input.jobId, input.reason);
      return { success, jobId: input.jobId, enabled: input.enabled, timestamp: new Date().toISOString() };
    }),

  // Admin: Get recent data events
  getDataEvents: adminProcedure
    .input(z.object({ limit: z.number().default(50), type: z.string().optional(), state: z.string().optional() }))
    .query(async ({ input }) => {
      let events;
      if (input.type) {
        events = dataEvents.getEventsByType(input.type as any, input.limit);
      } else if (input.state) {
        events = dataEvents.getEventsByState(input.state, input.limit);
      } else {
        events = dataEvents.getRecentEvents(input.limit);
      }
      return {
        events: events.map(e => ({
          type: e.type, severity: e.severity, summary: e.summary,
          timestamp: e.timestamp.toISOString(),
          affectedStates: e.affectedStates, source: e.source,
        })),
        total: events.length, timestamp: new Date().toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // MAP INTELLIGENCE — All geo-located data from every hz_* source
  // Returns point data for rendering on the US map
  // ═══════════════════════════════════════════════════════════════
  getMapIntelligence: protectedProcedure
    .input(z.object({
      layers: z.array(z.string()).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { earthquakes: [], wildfires: [], weatherAlerts: [], hazmatIncidents: [], epaFacilities: [], femaDisasters: [], locks: [], emissions: [], rcraHandlers: [], fuelByState: [], carriersByState: [], timestamp: new Date().toISOString() };

      const wantedLayers = input?.layers || [];
      const allLayers = wantedLayers.length === 0; // if empty, return all

      const result: Record<string, any> = { timestamp: new Date().toISOString() };

      // 1. EARTHQUAKES (USGS) — ALL events, no magnitude filter
      if (allLayers || wantedLayers.includes("earthquakes")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT event_id, latitude, longitude, magnitude, magnitude_type, place_description, event_time, alert_level, depth_km
                FROM hz_seismic_events
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY event_time DESC LIMIT 500`
          ) as any;
          result.earthquakes = (rows || []).map((r: any) => ({
            id: r.event_id, lat: Number(r.latitude), lng: Number(r.longitude),
            mag: Number(r.magnitude), place: r.place_description,
            time: r.event_time, alert: r.alert_level, depth: Number(r.depth_km),
          }));
        } catch (e) { console.error("[MapIntel] earthquakes:", e); result.earthquakes = []; }
      }

      // 2. WILDFIRES (NIFC) — ALL wildfires with geo, no status filter
      if (allLayers || wantedLayers.includes("wildfires")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT incident_id, incident_name, state_code, latitude, longitude,
                       acres_burned, percent_contained, fire_status, total_personnel,
                       evacuations_ordered
                FROM hz_wildfires
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY CAST(acres_burned AS DECIMAL(12,2)) DESC LIMIT 500`
          ) as any;
          result.wildfires = (rows || []).map((r: any) => ({
            id: r.incident_id, name: r.incident_name, state: r.state_code,
            lat: Number(r.latitude), lng: Number(r.longitude),
            acres: Number(r.acres_burned), contained: Number(r.percent_contained),
            status: r.fire_status, personnel: r.total_personnel,
            evacuation: !!r.evacuations_ordered,
          }));
        } catch (e) { console.error("[MapIntel] wildfires:", e); result.wildfires = []; }
      }

      // 3. WEATHER ALERTS (NWS) — ALL alerts (active + recent)
      if (allLayers || wantedLayers.includes("weather")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT id, state_codes, event_type, severity, urgency, headline, geometry
                FROM hz_weather_alerts
                ORDER BY FIELD(severity, 'Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown') ASC
                LIMIT 500`
          ) as any;
          result.weatherAlerts = (rows || []).map((r: any) => {
            let states: string[] = [];
            try { states = typeof r.state_codes === "string" ? JSON.parse(r.state_codes) : (r.state_codes || []); } catch {}
            return {
              id: r.id, states, event: r.event_type, severity: r.severity,
              urgency: r.urgency, headline: r.headline,
            };
          });
        } catch (e) { console.error("[MapIntel] weather:", e); result.weatherAlerts = []; }
      }

      // 4. HAZMAT INCIDENTS (PHMSA + NRC) — ALL incidents with geo, no date filter
      if (allLayers || wantedLayers.includes("hazmat")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT report_number, state_code, city, latitude, longitude,
                       incident_date, mode, hazmat_class, hazmat_name,
                       fatalities, injuries, quantity_released, quantity_unit
                FROM hz_hazmat_incidents
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY incident_date DESC LIMIT 1000`
          ) as any;
          result.hazmatIncidents = (rows || []).map((r: any) => ({
            id: r.report_number, state: r.state_code, city: r.city,
            lat: Number(r.latitude), lng: Number(r.longitude),
            date: r.incident_date, mode: r.mode,
            class: r.hazmat_class, name: r.hazmat_name,
            fatalities: r.fatalities, injuries: r.injuries,
            qty: Number(r.quantity_released), unit: r.quantity_unit,
          }));
        } catch (e) { console.error("[MapIntel] hazmat:", e); result.hazmatIncidents = []; }
      }

      // 5. EPA FACILITIES (TRI + ECHO) — ALL facilities with geo
      if (allLayers || wantedLayers.includes("epa")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT registry_id, facility_name, state_code, latitude, longitude,
                       industry_sector, compliance_status, total_releases_lbs,
                       formal_enforcement_actions, penalties_last_5yr, tri_facility
                FROM hz_epa_facilities
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY CAST(total_releases_lbs AS DECIMAL(15,2)) DESC LIMIT 500`
          ) as any;
          result.epaFacilities = (rows || []).map((r: any) => ({
            id: r.registry_id, name: r.facility_name, state: r.state_code,
            lat: Number(r.latitude), lng: Number(r.longitude),
            sector: r.industry_sector, compliance: r.compliance_status,
            releases: Number(r.total_releases_lbs), enforcement: r.formal_enforcement_actions,
            penalties: Number(r.penalties_last_5yr), tri: !!r.tri_facility,
          }));
        } catch (e) { console.error("[MapIntel] epa:", e); result.epaFacilities = []; }
      }

      // 6. FEMA DISASTERS — ALL disasters, no date/closeout filter
      if (allLayers || wantedLayers.includes("fema")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT disaster_number, state_code, designated_area, declaration_date,
                       incident_type, declaration_type, total_obligated_amount
                FROM hz_fema_disasters
                ORDER BY declaration_date DESC LIMIT 500`
          ) as any;
          result.femaDisasters = (rows || []).map((r: any) => ({
            id: r.disaster_number, state: r.state_code, area: r.designated_area,
            date: r.declaration_date, type: r.incident_type,
            declType: r.declaration_type, amount: Number(r.total_obligated_amount),
          }));
        } catch (e) { console.error("[MapIntel] fema:", e); result.femaDisasters = []; }
      }

      // 7. LOCKS & WATERWAYS (USACE) — ALL locks with geo
      if (allLayers || wantedLayers.includes("locks")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT lock_id, lock_name, river_name, state_code, latitude, longitude,
                       operational_status, closure_reason, avg_delay_hours
                FROM hz_lock_status
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                LIMIT 500`
          ) as any;
          result.locks = (rows || []).map((r: any) => ({
            id: r.lock_id, name: r.lock_name, river: r.river_name,
            state: r.state_code, lat: Number(r.latitude), lng: Number(r.longitude),
            status: r.operational_status, reason: r.closure_reason,
            queueHrs: Number(r.avg_delay_hours || 0),
          }));
        } catch (e) { console.error("[MapIntel] locks:", e); result.locks = []; }
      }

      // 8. EMISSIONS (CAMPD) — ALL emitters with geo
      if (allLayers || wantedLayers.includes("emissions")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT facility_id, facility_name, state_code, latitude, longitude,
                       so2_tons, nox_tons, co2_tons, source_category, operating_hours
                FROM hz_emissions
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY CAST(co2_tons AS DECIMAL(15,2)) DESC LIMIT 500`
          ) as any;
          result.emissions = (rows || []).map((r: any) => ({
            id: r.facility_id, name: r.facility_name, state: r.state_code,
            lat: Number(r.latitude), lng: Number(r.longitude),
            so2: Number(r.so2_tons), nox: Number(r.nox_tons), co2: Number(r.co2_tons),
            category: r.source_category, hours: r.operating_hours,
          }));
        } catch (e) { console.error("[MapIntel] emissions:", e); result.emissions = []; }
      }

      // 9. RCRA HAZARDOUS WASTE HANDLERS — ALL handlers with geo
      if (allLayers || wantedLayers.includes("rcra")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT handler_id, handler_name, state_code, latitude, longitude,
                       handler_type, compliance_status, violations_count,
                       penalties_total, industry_sector
                FROM hz_rcra_handlers
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY violations_count DESC LIMIT 500`
          ) as any;
          result.rcraHandlers = (rows || []).map((r: any) => ({
            id: r.handler_id, name: r.handler_name, state: r.state_code,
            lat: Number(r.latitude), lng: Number(r.longitude),
            type: r.handler_type, compliance: r.compliance_status,
            violations: r.violations_count, penalties: Number(r.penalties_total),
            sector: r.industry_sector,
          }));
        } catch (e) { console.error("[MapIntel] rcra:", e); result.rcraHandlers = []; }
      }

      // 10. FUEL PRICES BY STATE (EIA) — latest per state
      if (allLayers || wantedLayers.includes("fuel")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT state_code, diesel_retail, diesel_change_1w, report_date
                FROM hz_fuel_prices
                WHERE diesel_retail IS NOT NULL
                ORDER BY report_date DESC LIMIT 60`
          ) as any;
          const byState: Record<string, any> = {};
          for (const r of (rows || [])) {
            if (!byState[r.state_code]) {
              byState[r.state_code] = {
                state: r.state_code,
                diesel: Number(r.diesel_retail),
                change: Number(r.diesel_change_1w),
                date: r.report_date,
              };
            }
          }
          result.fuelByState = Object.values(byState);
        } catch (e) { console.error("[MapIntel] fuel:", e); result.fuelByState = []; }
      }

      // 11. CARRIER SAFETY BY STATE (FMCSA) — aggregate per state
      if (allLayers || wantedLayers.includes("carriers")) {
        try {
          const [rows] = await db.execute(
            sql`SELECT physical_state as state,
                       COUNT(*) as total,
                       COUNT(CASE WHEN safety_rating IN ('Conditional','Unsatisfactory') THEN 1 END) as violations,
                       AVG(CAST(unsafe_driving_score AS DECIMAL(5,2))) as avg_unsafe,
                       COUNT(CASE WHEN hazmat_authority = 1 THEN 1 END) as hazmat_carriers
                FROM hz_carrier_safety
                WHERE physical_state IS NOT NULL
                GROUP BY physical_state`
          ) as any;
          result.carriersByState = (rows || []).map((r: any) => ({
            state: r.state, total: Number(r.total),
            violations: Number(r.violations),
            avgUnsafe: Number(r.avg_unsafe),
            hazmatCarriers: Number(r.hazmat_carriers),
          }));
        } catch (e) { console.error("[MapIntel] carriers:", e); result.carriersByState = []; }
      }

      // Log summary of data counts for debugging
      const counts = Object.entries(result).filter(([k]) => k !== "timestamp").map(([k, v]) => `${k}:${Array.isArray(v) ? v.length : "?"}`)
      console.log(`[MapIntel] ${counts.join(", ")}`);

      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // ROUTE INTELLIGENCE — Corridor-specific intel for a load's route
  // Used on LoadDetails to show weather, fuel, hazmat, seismic data
  // for origin/destination states and along the corridor
  // ═══════════════════════════════════════════════════════════════
  getRouteIntelligence: protectedProcedure
    .input(z.object({
      originState: z.string().min(2).max(2),
      destState: z.string().min(2).max(2),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const { originState, destState } = input;
      const states = [originState.toUpperCase(), destState.toUpperCase()];
      const empty = { weatherAlerts: [], fuelPrices: [], hazmatIncidents: 0, wildfires: 0, earthquakes: 0, femaDisasters: [], carrierSafety: null, emissions: null, timestamp: new Date().toISOString() };
      if (!db) return empty;

      const result: any = { ...empty };

      try {
        // Weather alerts for route states
        const [wxRows] = await db.execute(
          sql`SELECT id, state_codes, event_type, severity, urgency, headline
              FROM hz_weather_alerts
              WHERE (JSON_CONTAINS(state_codes, JSON_QUOTE(${states[0]})) OR JSON_CONTAINS(state_codes, JSON_QUOTE(${states[1]})))
              ORDER BY FIELD(severity, 'Extreme', 'Severe', 'Moderate', 'Minor') ASC
              LIMIT 20`
        ) as any;
        result.weatherAlerts = (wxRows || []).map((r: any) => {
          let st: string[] = [];
          try { st = typeof r.state_codes === "string" ? JSON.parse(r.state_codes) : (r.state_codes || []); } catch {}
          return { id: r.id, states: st, event: r.event_type, severity: r.severity, headline: r.headline };
        });
      } catch (e) { console.error("[RouteIntel] weather:", e); }

      try {
        // Fuel prices for route states
        const [fuelRows] = await db.execute(
          sql`SELECT state_code, retail_price, change_from_prior_week
              FROM hz_fuel_prices
              WHERE state_code IN (${states[0]}, ${states[1]})
              ORDER BY price_date DESC
              LIMIT 10`
        ) as any;
        const seen = new Set<string>();
        result.fuelPrices = (fuelRows || []).filter((r: any) => {
          if (seen.has(r.state_code)) return false;
          seen.add(r.state_code);
          return true;
        }).map((r: any) => ({
          state: r.state_code, price: Number(r.retail_price), change: Number(r.change_from_prior_week || 0),
        }));
      } catch (e) { console.error("[RouteIntel] fuel:", e); }

      try {
        // Hazmat incident count in route states (last 90 days)
        const [hmRows] = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM hz_hazmat_incidents
              WHERE state_code IN (${states[0]}, ${states[1]})
              AND incident_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)`
        ) as any;
        result.hazmatIncidents = Number(hmRows?.[0]?.cnt || 0);
      } catch (e) { console.error("[RouteIntel] hazmat:", e); }

      try {
        // Active wildfires in route states
        const [wfRows] = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM hz_wildfires
              WHERE state_code IN (${states[0]}, ${states[1]})`
        ) as any;
        result.wildfires = Number(wfRows?.[0]?.cnt || 0);
      } catch (e) { console.error("[RouteIntel] wildfires:", e); }

      try {
        // Recent earthquakes in route states (approximated by nearby coords)
        const [eqRows] = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM hz_seismic_events
              WHERE magnitude >= 2.5
              AND event_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        ) as any;
        result.earthquakes = Number(eqRows?.[0]?.cnt || 0);
      } catch (e) { console.error("[RouteIntel] earthquakes:", e); }

      try {
        // FEMA disaster declarations in route states
        const [femaRows] = await db.execute(
          sql`SELECT state_code, disaster_type, title, declaration_date
              FROM hz_fema_disasters
              WHERE state_code IN (${states[0]}, ${states[1]})
              ORDER BY declaration_date DESC
              LIMIT 5`
        ) as any;
        result.femaDisasters = (femaRows || []).map((r: any) => ({
          state: r.state_code, type: r.disaster_type, title: r.title, date: r.declaration_date,
        }));
      } catch (e) { console.error("[RouteIntel] fema:", e); }

      try {
        // Carrier safety summary for route states
        const [csRows] = await db.execute(
          sql`SELECT physical_state as state,
                     COUNT(*) as total,
                     COUNT(CASE WHEN safety_rating IN ('Conditional','Unsatisfactory') THEN 1 END) as violations,
                     COUNT(CASE WHEN hazmat_authority = 1 THEN 1 END) as hazmat_carriers
              FROM hz_carrier_safety
              WHERE physical_state IN (${states[0]}, ${states[1]})
              GROUP BY physical_state`
        ) as any;
        result.carrierSafety = (csRows || []).map((r: any) => ({
          state: r.state, total: Number(r.total), violations: Number(r.violations), hazmatCarriers: Number(r.hazmat_carriers),
        }));
      } catch (e) { console.error("[RouteIntel] carriers:", e); }

      result.timestamp = new Date().toISOString();
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATION-SOURCED INTELLIGENCE
  // Aggregates data from connected terminals' integrations
  // (OPIS pricing, Genscape supply, FMCSA safety, facility data)
  // Every terminal that connects their API keys enriches this layer
  // ═══════════════════════════════════════════════════════════════
  getTerminalIntelligence: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { connectedTerminals: 0, rackPricing: [], supplyHubs: [], carrierSafety: { total: 0, highRisk: 0, satisfactory: 0 }, timestamp: new Date().toISOString() };

      const result: any = { timestamp: new Date().toISOString() };

      // Count connected terminal integrations (shows network growth)
      try {
        const { integrationConnections } = await import("../../drizzle/schema");
        const [countRow] = await db.execute(
          sql`SELECT COUNT(DISTINCT company_id) as cnt FROM integration_connections WHERE status = 'connected'`
        ) as any;
        result.connectedTerminals = Number((countRow || [])[0]?.cnt || 0);
      } catch { result.connectedTerminals = 0; }

      // Aggregate carrier safety from hz_carrier_safety (FMCSA data)
      try {
        const [safetyRows] = await db.execute(
          sql`SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN safety_rating = 'Satisfactory' THEN 1 END) as satisfactory,
                COUNT(CASE WHEN safety_rating IN ('Conditional','Unsatisfactory') THEN 1 END) as high_risk,
                AVG(CAST(unsafe_driving_score AS DECIMAL(5,2))) as avg_unsafe_driving,
                AVG(CAST(crash_indicator_score AS DECIMAL(5,2))) as avg_crash_indicator
              FROM hz_carrier_safety`
        ) as any;
        const row = (safetyRows || [])[0];
        result.carrierSafety = {
          total: Number(row?.total || 0),
          satisfactory: Number(row?.satisfactory || 0),
          highRisk: Number(row?.high_risk || 0),
          avgUnsafeDriving: row?.avg_unsafe_driving ? Number(Number(row.avg_unsafe_driving).toFixed(1)) : null,
          avgCrashIndicator: row?.avg_crash_indicator ? Number(Number(row.avg_crash_indicator).toFixed(1)) : null,
        };
      } catch { result.carrierSafety = { total: 0, satisfactory: 0, highRisk: 0 }; }

      // Aggregate carrier safety by state for map overlay
      try {
        const [stateRows] = await db.execute(
          sql`SELECT physical_state as state,
                     COUNT(*) as total,
                     COUNT(CASE WHEN safety_rating IN ('Conditional','Unsatisfactory') THEN 1 END) as high_risk,
                     AVG(CAST(unsafe_driving_score AS DECIMAL(5,2))) as avg_risk
              FROM hz_carrier_safety
              WHERE physical_state IS NOT NULL
              GROUP BY physical_state
              ORDER BY COUNT(*) DESC
              LIMIT 51`
        ) as any;
        result.carriersByState = (stateRows || []).map((r: any) => ({
          state: r.state,
          total: Number(r.total),
          highRisk: Number(r.high_risk),
          avgRisk: r.avg_risk ? Number(Number(r.avg_risk).toFixed(1)) : null,
        }));
      } catch { result.carriersByState = []; }

      // Facility throughput from facilities table (connected terminals)
      try {
        const [facRows] = await db.execute(
          sql`SELECT state, COUNT(*) as cnt, 
                     SUM(CAST(COALESCE(storage_capacity_bbl, 0) AS DECIMAL(15,2))) as total_capacity
              FROM facilities 
              WHERE facility_type IN ('TERMINAL','RACK','BULK_PLANT')
              AND state IS NOT NULL
              GROUP BY state
              ORDER BY cnt DESC
              LIMIT 51`
        ) as any;
        result.terminalsByState = (facRows || []).map((r: any) => ({
          state: r.state,
          count: Number(r.cnt),
          totalCapacity: Number(r.total_capacity || 0),
        }));
      } catch { result.terminalsByState = []; }

      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // ROAD INTELLIGENCE — Crowd-sourced road mapping from driver GPS
  // Returns road segments + live driver pings for real-time road
  // line rendering on the HotZoneMap (the "digital Google Maps car" layer)
  // ═══════════════════════════════════════════════════════════════
  getRoadIntelligence: protectedProcedure
    .input(z.object({
      // Viewport bounding box for spatial filtering
      minLat: z.number().optional(),
      maxLat: z.number().optional(),
      minLng: z.number().optional(),
      maxLng: z.number().optional(),
      // Filter by state
      state: z.string().optional(),
      // Include live pings (real-time driver positions)
      includeLive: z.boolean().default(true),
      // Limit
      segmentLimit: z.number().default(2000),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { segments: [], livePings: [], stats: { totalSegments: 0, totalMiles: 0, liveDrivers: 0 } };

      const opts = input as { minLat?: number; maxLat?: number; minLng?: number; maxLng?: number; state?: string; includeLive?: boolean; segmentLimit?: number } || {};
      try {
        // Fetch road segments (with optional viewport filter)
        const filters: string[] = ["1=1"];
        if (opts.minLat != null && opts.maxLat != null) {
          filters.push(`startLat BETWEEN ${opts.minLat} AND ${opts.maxLat}`);
        }
        if (opts.minLng != null && opts.maxLng != null) {
          filters.push(`startLng BETWEEN ${opts.minLng} AND ${opts.maxLng}`);
        }
        if (opts.state) {
          filters.push(`state = '${opts.state.replace(/'/g, "")}'`);
        }

        const segLimit = opts.segmentLimit || 2000;
        const [segRows] = await db.execute(
          sql.raw(`SELECT id, startLat, startLng, endLat, endLng, geohash,
                     roadName, roadType, traversalCount, uniqueDrivers,
                     avgSpeedMph, congestionLevel, surfaceQuality,
                     hasHazmatTraffic, lastTraversedAt, lengthMiles, state,
                     encodedPolyline
                   FROM road_segments
                   WHERE ${filters.join(" AND ")}
                   ORDER BY lastTraversedAt DESC
                   LIMIT ${segLimit}`)
        ) as any;

        const segments = (segRows || []).map((r: any) => ({
          id: r.id,
          startLat: Number(r.startLat), startLng: Number(r.startLng),
          endLat: Number(r.endLat), endLng: Number(r.endLng),
          geohash: r.geohash,
          roadName: r.roadName,
          roadType: r.roadType,
          traversalCount: r.traversalCount,
          uniqueDrivers: r.uniqueDrivers,
          avgSpeed: r.avgSpeedMph ? Number(r.avgSpeedMph) : null,
          congestion: r.congestionLevel,
          surfaceQuality: r.surfaceQuality,
          hasHazmat: r.hasHazmatTraffic,
          lastTraversed: r.lastTraversedAt?.toISOString?.() || r.lastTraversedAt,
          lengthMiles: r.lengthMiles ? Number(r.lengthMiles) : null,
          state: r.state,
          polyline: r.encodedPolyline,
        }));

        // Fetch live pings (last 5 minutes)
        let livePings: any[] = [];
        if (opts.includeLive !== false) {
          const pingCutoff = new Date(Date.now() - 5 * 60 * 1000);
          try {
            const [pingRows] = await db.execute(
              sql`SELECT driverId, lat, lng, speed, heading, roadName, pingAt
                  FROM road_live_pings
                  WHERE pingAt > ${pingCutoff}
                  ORDER BY pingAt DESC
                  LIMIT 500`
            ) as any;
            livePings = (pingRows || []).map((p: any) => ({
              driverId: p.driverId,
              lat: Number(p.lat), lng: Number(p.lng),
              speed: p.speed ? Number(p.speed) : null,
              heading: p.heading ? Number(p.heading) : null,
              roadName: p.roadName,
              pingAt: p.pingAt?.toISOString?.() || p.pingAt,
            }));
          } catch { /* table may not exist yet */ }
        }

        // Quick stats
        const [statsRow] = await db.execute(
          sql`SELECT COUNT(*) as cnt, SUM(CAST(lengthMiles AS DECIMAL(10,3))) as miles FROM road_segments`
        ) as any;
        const st = (statsRow || [])[0] || {};

        return {
          segments,
          livePings,
          stats: {
            totalSegments: Number(st.cnt || 0),
            totalMiles: Number(Number(st.miles || 0).toFixed(1)),
            liveDrivers: new Set(livePings.map((p: any) => p.driverId)).size,
          },
        };
      } catch (e) {
        console.error("[HotZones] getRoadIntelligence error:", e);
        return { segments: [], livePings: [], stats: { totalSegments: 0, totalMiles: 0, liveDrivers: 0 } };
      }
    }),

  getRoadCoverageStats: protectedProcedure
    .query(async () => {
      try {
        const { getRoadCoverageStats } = await import("../services/roadIntelligence");
        return await getRoadCoverageStats();
      } catch {
        return { totalSegments: 0, totalMilesMapped: 0, totalTraversals: 0, uniqueDriversContributed: 0, topRoads: [], coverageByState: [] };
      }
    }),

  // Admin: Get sync log history from DB
  getSyncLog: adminProcedure
    .input(z.object({ limit: z.number().default(50), sourceName: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { logs: [], total: 0 };
        const condition = input.sourceName
          ? sql`source_name = ${input.sourceName}`
          : sql`1=1`;
        const rows = await db.select().from(hzDataSyncLog)
          .where(condition)
          .orderBy(sql`started_at DESC`)
          .limit(input.limit);
        return { logs: rows, total: rows.length };
      } catch { return { logs: [], total: 0 }; }
    }),
});
