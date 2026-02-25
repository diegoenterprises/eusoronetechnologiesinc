import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, Maximize2, Crosshair, Layers,
  TrendingUp, Truck, Flame, X, Navigation, MapPin,
  Droplet, Radio, AlertTriangle, CloudRain, Factory,
  Anchor, Biohazard, Fuel, Shield,
} from "lucide-react";

interface HotZoneMapProps {
  zones: any[];
  coldZones: any[];
  roleCtx: any;
  selectedZone: string | null;
  onSelectZone: (id: string | null) => void;
  isLight: boolean;
  activeLayers: string[];
  intel?: any;
  roadIntel?: {
    segments?: { id: number; startLat: number; startLng: number; endLat: number; endLng: number; roadName?: string; roadType?: string; traversalCount: number; avgSpeed?: number; congestion?: string; surfaceQuality?: string; hasHazmat?: boolean; lastTraversed?: string; state?: string }[];
    livePings?: { driverId: number; lat: number; lng: number; speed?: number; heading?: number; roadName?: string; pingAt?: string }[];
    stats?: { totalSegments: number; totalMiles: number; liveDrivers: number };
  };
}

// Projection: lng/lat → SVG coordinates fitted to state outline anchor points
// x: WA coast(105)↔ME coast(728) maps lng -124.5↔-67  |  y: ND top(16)↔FL tip(298) maps lat 49↔25
function proj(lng: number, lat: number): [number, number] {
  const x = ((lng + 124.5) / 57.5) * 623 + 105;
  const y = ((49 - lat) / 24) * 282 + 16;
  return [x, y];
}

// ── ROLE-ADAPTIVE VISUAL CONFIG ──
// Each role sees the map differently: different colors, sizing, primary metric, emphasis
interface RoleViz {
  dotLabel: (z: any) => string;       // what shows inside the dot
  sizeMetric: (z: any) => number;     // what drives dot size
  critColor: string; highColor: string; elevColor: string;
  glowColor: string;                  // dominant glow tint
  subtitle: string;                   // map subtitle
  emphasis: string;                   // what aspect matters most
}

function getRoleViz(perspective: string | undefined): RoleViz {
  // sizeMetric MUST return values in 6-14 range (clamped downstream)
  switch (perspective) {
    case "catalyst_availability": // SHIPPER — sees truck availability, green tones
      return {
        dotLabel: z => `${z.liveTrucks || 0}T`,
        sizeMetric: z => 7 + Math.min(7, (z.liveTrucks || 80) / 60),
        critColor: "#4ADE80", highColor: "#60A5FA", elevColor: "#C084FC",
        glowColor: "#4ADE80",
        subtitle: "Where catalysts are available for your loads",
        emphasis: "catalyst_count",
      };
    case "spread_opportunity": // BROKER — sees margin, emerald tones
      return {
        dotLabel: z => `+${((z.liveRate || 2) * (z.liveRatio || 1) * 0.15).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, ((z.liveRate || 2) * (z.liveRatio || 1) * 0.15) * 2),
        critColor: "#34D399", highColor: "#FBBF24", elevColor: "#818CF8",
        glowColor: "#34D399",
        subtitle: "Best arbitrage & margin zones",
        emphasis: "margin",
      };
    case "driver_opportunity": // DRIVER — sees earnings, amber/orange tones
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRate || 2) * 1.8),
        critColor: "#FBBF24", highColor: "#FB923C", elevColor: "#60A5FA",
        glowColor: "#FBBF24",
        subtitle: "Best loads and earning opportunities near you",
        emphasis: "earnings",
      };
    case "oversized_demand": // ESCORT — sees oversized corridors, purple tones
      return {
        dotLabel: z => z.oversizedFrequency === "VERY_HIGH" ? "OVS!" : z.oversizedFrequency === "HIGH" ? "OVS" : `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => z.oversizedFrequency === "VERY_HIGH" ? 14 : z.oversizedFrequency === "HIGH" ? 11 : 8,
        critColor: "#A78BFA", highColor: "#818CF8", elevColor: "#C4B5FD",
        glowColor: "#A78BFA",
        subtitle: "Oversized/overweight escort demand corridors",
        emphasis: "oversized",
      };
    case "dispatch_intelligence": // DISPATCH — sees L:T ratio, red/orange tones
      return {
        dotLabel: z => `${z.liveLoads || 0}/${z.liveTrucks || 0}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#22D3EE",
        glowColor: "#FB923C",
        subtitle: "Fleet positions + demand for optimal dispatch",
        emphasis: "ratio",
      };
    case "facility_throughput": // TERMINAL_MANAGER — sees volume, cyan tones
      return {
        dotLabel: z => `${z.liveLoads || 0}L`,
        sizeMetric: z => 7 + Math.min(7, (z.liveLoads || 100) / 100),
        critColor: "#22D3EE", highColor: "#60A5FA", elevColor: "#A78BFA",
        glowColor: "#22D3EE",
        subtitle: "Freight throughput near your facilities",
        emphasis: "volume",
      };
    case "invoice_intelligence": // FACTORING — sees invoice volume, orange tones
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveLoads || 100) / 80),
        critColor: "#FB923C", highColor: "#FBBF24", elevColor: "#4ADE80",
        glowColor: "#FB923C",
        subtitle: "Invoice volume & credit risk by geography",
        emphasis: "invoice_volume",
      };
    case "compliance_risk": // COMPLIANCE_OFFICER — sees risk scores, red tones
      return {
        dotLabel: z => { const sc = z.complianceRiskScore ?? Math.round(((z.weatherAlerts?.length || 0) * 20) + ((z.hazmatClasses?.length || 0) * 15)); return `R${sc}`; },
        sizeMetric: z => 7 + Math.min(7, (z.complianceRiskScore ?? 30) / 15),
        critColor: "#F87171", highColor: "#FBBF24", elevColor: "#4ADE80",
        glowColor: "#F87171",
        subtitle: "Regulatory compliance risk zones",
        emphasis: "compliance",
      };
    case "safety_risk": // SAFETY_MANAGER — sees safety scores, red/cyan tones
      return {
        dotLabel: z => { const ss = Math.max(0, 100 - Math.round(((z.weatherAlerts?.length || 0) * 15) + ((z.hazmatClasses?.length || 0) * 10))); return `S${ss}`; },
        sizeMetric: z => 7 + Math.min(7, ((z.hazmatClasses?.length || 0) + (z.weatherAlerts?.length || 0)) * 1.5),
        critColor: "#F87171", highColor: "#FBBF24", elevColor: "#22D3EE",
        glowColor: "#F87171",
        subtitle: "Safety risk zones & incident hotspots",
        emphasis: "safety",
      };
    case "platform_health": // ADMIN
    case "executive_intelligence": // SUPER_ADMIN
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#FBBF24",
        glowColor: "#1473FF",
        subtitle: "Platform-wide operational intelligence",
        emphasis: "overview",
      };
    default: // CATALYST / default freight view
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#FBBF24",
        glowColor: "#EF4444",
        subtitle: "Where freight demand is highest",
        emphasis: "demand",
      };
  }
}

// ── US STATE OUTLINES (projection-aligned — generated from real lat/lng through proj()) ──
const STATES: { id: string; d: string }[] = [
  { id:"WA", d:"M103,16L186,16L186,51L108,48Z" },
  { id:"OR", d:"M105,48L186,51L186,98L105,98Z" },
  { id:"CA", d:"M106,98L154,98L154,134L175,169L184,192L185,210L212,210L212,181L154,134Z" },
  { id:"NV", d:"M154,98L186,98L212,181L212,169L161,134Z" },
  { id:"ID", d:"M186,16L250,16L250,98L186,98L192,75L186,51Z" },
  { id:"MT", d:"M197,16L327,16L327,63L197,63Z" },
  { id:"WY", d:"M250,63L326,63L326,110L250,110Z" },
  { id:"UT", d:"M218,98L272,98L272,157L218,157Z" },
  { id:"CO", d:"M272,110L349,110L349,157L272,157Z" },
  { id:"AZ", d:"M210,157L272,157L272,224L210,210Z" },
  { id:"NM", d:"M272,157L338,157L338,216L272,216Z" },
  { id:"ND", d:"M326,16L407,16L407,52L326,52Z" },
  { id:"SD", d:"M326,52L408,52L408,92L326,87Z" },
  { id:"NE", d:"M326,87L421,87L421,122L326,110Z" },
  { id:"KS", d:"M348,122L429,122L429,157L348,157Z" },
  { id:"OK", d:"M338,157L431,157L431,197L411,197L370,163L338,163Z" },
  { id:"TX", d:"M299,163L337,163L370,163L411,197L435,197L435,245L403,286L373,286L337,220L299,216L299,163Z" },
  { id:"MN", d:"M401,16L484,16L484,81L408,81Z" },
  { id:"IA", d:"M407,81L478,81L478,117L407,115Z" },
  { id:"MO", d:"M416,115L489,115L489,169L416,163Z" },
  { id:"AR", d:"M430,163L483,163L483,204L430,204Z" },
  { id:"LA", d:"M434,204L490,204L490,251L468,251L438,245L434,204Z" },
  { id:"WI", d:"M447,40L513,40L513,92L447,92Z" },
  { id:"IL", d:"M463,92L506,92L506,157L487,158L463,139Z" },
  { id:"MS", d:"M460,181L499,181L499,237L483,237L460,228Z" },
  { id:"MI", d:"M505,51L561,51L561,102L539,102L505,92Z" },
  { id:"IN", d:"M500,101L535,101L535,148L500,148Z" },
  { id:"OH", d:"M535,98L582,98L582,141L535,141Z" },
  { id:"KY", d:"M484,134L565,134L565,163L484,163Z" },
  { id:"TN", d:"M476,161L570,161L570,181L476,181Z" },
  { id:"AL", d:"M495,181L534,181L534,237L495,237Z" },
  { id:"GA", d:"M526,181L578,181L578,235L526,235Z" },
  { id:"FL", d:"M505,228L565,228L587,263L585,297L568,304L565,275L533,239L505,236Z" },
  { id:"SC", d:"M550,181L602,181L602,216L550,215Z" },
  { id:"NC", d:"M541,162L636,162L636,192L541,181Z" },
  { id:"VA", d:"M547,128L639,128L639,163L547,162Z" },
  { id:"WV", d:"M559,115L612,115L612,155L559,155Z" },
  { id:"PA", d:"M582,95L645,95L645,125L582,125Z" },
  { id:"NY", d:"M589,63L675,63L675,116L652,116L589,98Z" },
  { id:"VT", d:"M659,63L679,63L679,90L659,90Z" },
  { id:"NH", d:"M667,59L688,59L688,90L667,90Z" },
  { id:"ME", d:"M684,34L728,34L728,87L684,87Z" },
  { id:"MA", d:"M658,88L697,88L697,108L658,108Z" },
  { id:"CT", d:"M655,97L676,97L676,110L655,110Z" },
  { id:"RI", d:"M675,98L684,98L684,109L675,109Z" },
  { id:"NJ", d:"M635,105L653,105L653,135L635,135Z" },
  { id:"DE", d:"M633,124L641,124L641,141L633,141Z" },
  { id:"MD", d:"M593,125L640,125L640,145L593,145Z" },
];

// ── INTERSTATE HIGHWAYS (23 major freight corridors, projection-aligned) ──
const HWY: { id: string; d: string }[] = [
  // East-West Corridors
  { id:"I-10", d:"M173,192 L240,199 L299,216 L370,233 L403,245 L420,242 L444,237 L468,233 L490,236 L504,233 L533,233 L565,235 L585,278" },
  { id:"I-20", d:"M370,210 L405,206 L430,210 L452,210 L479,212 L511,198 L539,195 L565,195 L576,192" },
  { id:"I-30", d:"M370,210 L398,198 L410,195 L430,192 L444,185 L460,175" },
  { id:"I-40", d:"M132,175 L175,192 L240,178 L273,178 L299,181 L327,181 L370,178 L398,175 L425,175 L457,176 L478,179 L506,169 L533,169 L555,169 L576,175 L598,175" },
  { id:"I-44", d:"M370,175 L398,160 L415,157 L430,157 L446,145 L467,140" },
  { id:"I-55", d:"M468,240 L470,225 L468,210 L463,192 L460,175 L463,157 L465,140 L468,120 L466,100 L463,81" },
  { id:"I-64", d:"M620,135 L600,140 L576,140 L560,140 L540,140 L520,140 L500,145 L480,148 L460,155 L440,155 L420,155" },
  { id:"I-70", d:"M240,134 L273,134 L316,125 L349,134 L370,134 L398,134 L425,134 L446,134 L477,138 L500,136 L520,124 L538,123 L565,122 L587,122 L620,128" },
  { id:"I-80", d:"M128,148 L154,136 L186,112 L240,110 L273,110 L305,110 L318,110 L349,110 L370,110 L414,110 L457,102 L479,104 L500,101 L544,103 L576,110 L587,110 L620,110 L650,112" },
  { id:"I-90", d:"M129,32 L186,31 L240,41 L273,56 L298,74 L327,75 L366,77 L403,78 L414,81 L443,75 L468,75 L490,87 L505,98 L519,102 L544,96 L569,95 L598,97 L630,87 L652,91 L663,92" },
  { id:"I-94", d:"M253,16 L298,25 L327,31 L366,36 L403,43 L430,51 L457,55 L475,62 L490,70 L505,81 L520,87 L536,75" },
  // North-South Corridors
  { id:"I-5", d:"M127,24 L126,48 L125,78 L126,98 L130,120 L135,148 L140,165 L148,180 L155,195 L165,210" },
  { id:"I-15", d:"M155,195 L173,175 L190,160 L212,148 L225,134 L233,118 L238,98 L240,75 L245,55 L250,38 L255,16" },
  { id:"I-25", d:"M305,210 L310,195 L318,175 L325,157 L330,140 L335,125 L340,110 L345,92 L350,75 L356,55 L360,35 L363,16" },
  { id:"I-35", d:"M398,275 L394,245 L403,236 L402,228 L403,208 L403,202 L398,175 L399,157 L414,139 L425,134 L435,110 L440,98 L443,75 L443,51 L444,16" },
  { id:"I-45", d:"M400,275 L398,260 L395,250 L393,240 L391,225 L389,210 L388,195" },
  { id:"I-65", d:"M504,233 L513,225 L517,211 L513,183 L513,166 L522,157 L524,143 L520,124 L511,103 L505,99" },
  { id:"I-69", d:"M390,260 L395,245 L400,230 L405,210 L415,195 L430,175 L445,157 L460,140 L475,120 L490,110 L505,100 L520,92 L536,80" },
  { id:"I-75", d:"M585,289 L576,280 L565,269 L565,251 L565,233 L548,222 L539,195 L544,181 L542,169 L538,141 L538,132 L546,122 L548,110 L555,95 L549,81 L536,57" },
  { id:"I-81", d:"M620,170 L624,155 L628,140 L632,128 L636,120 L640,112 L644,105 L648,100 L652,95 L656,87 L660,80 L663,72" },
  { id:"I-85", d:"M510,233 L525,218 L536,205 L544,192 L556,185 L570,175 L585,168 L598,165 L610,160 L624,150 L632,142" },
  { id:"I-95", d:"M585,289 L586,275 L573,251 L571,236 L575,215 L588,195 L599,175 L615,151 L624,131 L636,125 L645,119 L652,114 L661,110 L674,106 L685,95 L685,87 L687,84" },
];

// ── MAJOR PORTS (freight-critical, visible at med+ zoom) ──
const PORTS: { n: string; lat: number; lng: number; rank: number }[] = [
  { n:"Port of LA/LB", lat:33.74, lng:-118.27, rank:1 },
  { n:"Port of Savannah", lat:32.08, lng:-81.09, rank:2 },
  { n:"Port of Houston", lat:29.73, lng:-95.27, rank:3 },
  { n:"Port of Newark", lat:40.68, lng:-74.15, rank:4 },
  { n:"Port of Charleston", lat:32.78, lng:-79.92, rank:5 },
  { n:"Port of Tacoma", lat:47.27, lng:-122.42, rank:6 },
  { n:"Port of Norfolk", lat:36.85, lng:-76.33, rank:7 },
  { n:"Port of New Orleans", lat:29.93, lng:-90.06, rank:8 },
  { n:"Port of Oakland", lat:37.80, lng:-122.30, rank:9 },
  { n:"Port of Baltimore", lat:39.26, lng:-76.58, rank:10 },
  { n:"Port of Jacksonville", lat:30.40, lng:-81.59, rank:11 },
  { n:"Port of Mobile", lat:30.69, lng:-88.04, rank:12 },
  { n:"Port of Beaumont", lat:30.08, lng:-94.08, rank:13 },
];

// ── BORDER CROSSINGS (international freight gateways) ──
const BORDERS: { n: string; lat: number; lng: number; country: string }[] = [
  { n:"Laredo", lat:27.51, lng:-99.51, country:"MX" },
  { n:"El Paso", lat:31.76, lng:-106.44, country:"MX" },
  { n:"Otay Mesa", lat:32.55, lng:-117.06, country:"MX" },
  { n:"Nogales", lat:31.34, lng:-110.94, country:"MX" },
  { n:"Calexico", lat:32.68, lng:-115.50, country:"MX" },
  { n:"Detroit/Windsor", lat:42.31, lng:-83.05, country:"CA" },
  { n:"Buffalo/Niagara", lat:42.91, lng:-78.86, country:"CA" },
  { n:"Blaine/BC", lat:49.00, lng:-122.75, country:"CA" },
  { n:"Port Huron", lat:42.97, lng:-82.43, country:"CA" },
  { n:"Champlain", lat:44.99, lng:-73.45, country:"CA" },
];

// ── INTERMODAL TERMINALS (rail-truck transfer hubs) ──
const INTERMODAL: { n: string; lat: number; lng: number }[] = [
  { n:"BNSF Logistics Park Chicago", lat:41.55, lng:-88.16 },
  { n:"UP Global IV LA", lat:33.98, lng:-118.17 },
  { n:"Alliance TX (BNSF)", lat:32.98, lng:-97.32 },
  { n:"CSX NW Ohio", lat:41.00, lng:-83.97 },
  { n:"NS Atlanta (Austell)", lat:33.81, lng:-84.63 },
  { n:"UP Joliet (Global III)", lat:41.49, lng:-88.18 },
  { n:"KC SmartPort", lat:39.10, lng:-94.60 },
  { n:"Memphis Intermodal", lat:35.06, lng:-89.92 },
  { n:"Savannah Intermodal", lat:32.13, lng:-81.15 },
  { n:"Norfolk Heartland", lat:36.86, lng:-76.19 },
];

// ── WEIGH STATIONS / INSPECTION STATIONS (compliance & driver critical) ──
const WEIGH_STATIONS: { n: string; lat: number; lng: number; dir: string }[] = [
  { n:"San Onofre CHP", lat:33.38, lng:-117.57, dir:"I-5 NB/SB" },
  { n:"Truckee CA", lat:39.33, lng:-120.18, dir:"I-80 EB/WB" },
  { n:"Ehrenberg AZ", lat:33.60, lng:-114.52, dir:"I-10 EB" },
  { n:"Banning CA", lat:33.93, lng:-116.87, dir:"I-10 WB" },
  { n:"Joplin MO", lat:37.08, lng:-94.50, dir:"I-44 WB" },
  { n:"Fultondale AL", lat:33.60, lng:-86.79, dir:"I-65 NB" },
  { n:"Dandridge TN", lat:36.01, lng:-83.41, dir:"I-40 EB" },
  { n:"Hagerstown MD", lat:39.64, lng:-77.72, dir:"I-81 NB/SB" },
  { n:"Greenwich NJ", lat:40.65, lng:-75.17, dir:"I-78 WB" },
  { n:"Hammond IN", lat:41.60, lng:-87.49, dir:"I-80/94" },
  { n:"Wheeler Ridge CA", lat:34.93, lng:-118.95, dir:"I-5 NB" },
  { n:"Woodburn OR", lat:45.14, lng:-122.86, dir:"I-5 NB/SB" },
  { n:"Lamar CO", lat:38.09, lng:-102.62, dir:"US-50" },
  { n:"Sidney NE", lat:41.14, lng:-102.98, dir:"I-80 EB/WB" },
  { n:"Breezewood PA", lat:39.99, lng:-78.24, dir:"I-70/76" },
];

// ── MAJOR TRUCK STOPS (driver amenities & fuel) ──
const TRUCK_STOPS: { n: string; lat: number; lng: number; chain: string }[] = [
  { n:"Iowa 80", lat:41.63, lng:-90.39, chain:"World's Largest" },
  { n:"Buc-ee's New Braunfels", lat:29.72, lng:-98.09, chain:"Buc-ee's" },
  { n:"Buc-ee's Baytown", lat:29.77, lng:-94.96, chain:"Buc-ee's" },
  { n:"Petro Gary IN", lat:41.56, lng:-87.34, chain:"TA/Petro" },
  { n:"Pilot Knoxville TN", lat:35.92, lng:-83.97, chain:"Pilot/FJ" },
  { n:"Love's Oklahoma City", lat:35.40, lng:-97.60, chain:"Love's" },
  { n:"TA Ontario CA", lat:34.06, lng:-117.60, chain:"TA/Petro" },
  { n:"Pilot Laredo TX", lat:27.56, lng:-99.48, chain:"Pilot/FJ" },
  { n:"Love's Amarillo TX", lat:35.20, lng:-101.83, chain:"Love's" },
  { n:"TA Atlanta GA", lat:33.59, lng:-84.43, chain:"TA/Petro" },
  { n:"Pilot Dallas TX", lat:32.80, lng:-96.82, chain:"Pilot/FJ" },
  { n:"Love's Jacksonville FL", lat:30.32, lng:-81.65, chain:"Love's" },
];

// ── DISTRIBUTION / WAREHOUSE HUBS (shipper & broker critical) ──
const DIST_HUBS: { n: string; lat: number; lng: number }[] = [
  { n:"Inland Empire CA", lat:34.00, lng:-117.42 },
  { n:"Dallas/Ft Worth Hub", lat:32.85, lng:-97.05 },
  { n:"Chicago Logistics Corridor", lat:41.72, lng:-87.80 },
  { n:"Atlanta Industrial", lat:33.65, lng:-84.38 },
  { n:"Lehigh Valley PA", lat:40.62, lng:-75.37 },
  { n:"Memphis Logistics Hub", lat:35.10, lng:-89.97 },
  { n:"Columbus OH", lat:39.96, lng:-82.99 },
  { n:"Indianapolis Crossroads", lat:39.77, lng:-86.16 },
  { n:"Savannah/Effingham", lat:32.18, lng:-81.35 },
  { n:"Louisville/SDF Hub", lat:38.17, lng:-85.74 },
  { n:"Kansas City Hub", lat:39.05, lng:-94.58 },
  { n:"Reno/Sparks NV", lat:39.54, lng:-119.80 },
];

// ── HAZMAT CORRIDORS (compliance & safety, approximate freight-heavy segments) ──
const HAZMAT_CORRIDORS: { n: string; d: string }[] = [
  { n:"Gulf Coast Chem Belt", d:"M340,295 L362,296 L395,298 L430,296 L465,296 L490,294" },
  { n:"NJ Chemical Alley", d:"M650,155 L655,162 L660,168 L658,178" },
  { n:"Baton Rouge Corridor", d:"M430,298 L435,302 L440,306 L445,303" },
  { n:"Houston Ship Channel", d:"M400,296 L406,299 L412,300 L418,296" },
  { n:"Lake Charles Petrochemical", d:"M412,296 L420,300 L428,298" },
];

// ── REFINERIES / CHEMICAL PLANTS (hazmat load origins) ──
const REFINERIES: { n: string; lat: number; lng: number; type: string }[] = [
  { n:"Motiva Port Arthur", lat:29.90, lng:-93.93, type:"Refinery" },
  { n:"Marathon Galveston Bay", lat:29.36, lng:-94.91, type:"Refinery" },
  { n:"ExxonMobil Baytown", lat:29.76, lng:-95.01, type:"Refinery" },
  { n:"Valero Port Arthur", lat:29.87, lng:-93.96, type:"Refinery" },
  { n:"Phillips 66 Lake Charles", lat:30.23, lng:-93.26, type:"Refinery" },
  { n:"Marathon El Dorado", lat:33.21, lng:-92.67, type:"Refinery" },
  { n:"BP Whiting IN", lat:41.68, lng:-87.49, type:"Refinery" },
  { n:"Chevron El Segundo", lat:33.91, lng:-118.41, type:"Refinery" },
  { n:"Marathon Robinson IL", lat:39.00, lng:-87.74, type:"Refinery" },
  { n:"BASF Geismar LA", lat:30.22, lng:-91.01, type:"Chemical" },
  { n:"Dow Freeport TX", lat:28.95, lng:-95.36, type:"Chemical" },
  { n:"DuPont La Porte TX", lat:29.67, lng:-95.05, type:"Chemical" },
  { n:"Suncor Commerce City CO", lat:39.81, lng:-104.93, type:"Refinery" },
  { n:"PBF Paulsboro NJ", lat:39.83, lng:-75.24, type:"Refinery" },
  { n:"Citgo Lemont IL", lat:41.67, lng:-88.00, type:"Refinery" },
];

// ── STATE CENTERS (for labels at medium+ zoom) ──
const STATE_CENTERS: { id: string; lat: number; lng: number; name: string }[] = [
  { id:"WA", lat:47.40, lng:-120.50, name:"Washington" },
  { id:"OR", lat:43.80, lng:-120.55, name:"Oregon" },
  { id:"CA", lat:36.78, lng:-119.42, name:"California" },
  { id:"NV", lat:38.80, lng:-116.42, name:"Nevada" },
  { id:"ID", lat:44.07, lng:-114.74, name:"Idaho" },
  { id:"MT", lat:46.88, lng:-110.36, name:"Montana" },
  { id:"WY", lat:43.08, lng:-107.29, name:"Wyoming" },
  { id:"UT", lat:39.32, lng:-111.09, name:"Utah" },
  { id:"CO", lat:39.06, lng:-105.31, name:"Colorado" },
  { id:"AZ", lat:34.05, lng:-111.09, name:"Arizona" },
  { id:"NM", lat:34.52, lng:-105.87, name:"New Mexico" },
  { id:"ND", lat:47.53, lng:-100.47, name:"North Dakota" },
  { id:"SD", lat:43.97, lng:-99.90, name:"South Dakota" },
  { id:"NE", lat:41.49, lng:-99.90, name:"Nebraska" },
  { id:"KS", lat:38.50, lng:-98.77, name:"Kansas" },
  { id:"OK", lat:35.47, lng:-97.52, name:"Oklahoma" },
  { id:"TX", lat:31.97, lng:-99.90, name:"Texas" },
  { id:"MN", lat:46.73, lng:-94.69, name:"Minnesota" },
  { id:"IA", lat:41.88, lng:-93.10, name:"Iowa" },
  { id:"MO", lat:38.57, lng:-92.60, name:"Missouri" },
  { id:"AR", lat:34.97, lng:-92.37, name:"Arkansas" },
  { id:"LA", lat:30.98, lng:-91.96, name:"Louisiana" },
  { id:"WI", lat:43.78, lng:-88.79, name:"Wisconsin" },
  { id:"IL", lat:40.63, lng:-89.40, name:"Illinois" },
  { id:"MS", lat:32.35, lng:-89.40, name:"Mississippi" },
  { id:"MI", lat:44.31, lng:-85.60, name:"Michigan" },
  { id:"IN", lat:40.27, lng:-86.13, name:"Indiana" },
  { id:"OH", lat:40.42, lng:-82.91, name:"Ohio" },
  { id:"KY", lat:37.67, lng:-84.67, name:"Kentucky" },
  { id:"TN", lat:35.52, lng:-86.58, name:"Tennessee" },
  { id:"AL", lat:32.32, lng:-86.90, name:"Alabama" },
  { id:"GA", lat:33.04, lng:-83.64, name:"Georgia" },
  { id:"FL", lat:27.66, lng:-81.52, name:"Florida" },
  { id:"SC", lat:33.84, lng:-81.16, name:"South Carolina" },
  { id:"NC", lat:35.76, lng:-79.02, name:"North Carolina" },
  { id:"VA", lat:37.43, lng:-78.66, name:"Virginia" },
  { id:"WV", lat:38.60, lng:-80.45, name:"West Virginia" },
  { id:"PA", lat:41.20, lng:-77.19, name:"Pennsylvania" },
  { id:"NY", lat:42.17, lng:-74.95, name:"New York" },
  { id:"VT", lat:44.56, lng:-72.58, name:"Vermont" },
  { id:"NH", lat:43.19, lng:-71.57, name:"New Hampshire" },
  { id:"ME", lat:45.25, lng:-69.45, name:"Maine" },
  { id:"MA", lat:42.41, lng:-71.38, name:"Massachusetts" },
  { id:"CT", lat:41.60, lng:-72.76, name:"Connecticut" },
  { id:"RI", lat:41.58, lng:-71.48, name:"Rhode Island" },
  { id:"NJ", lat:40.06, lng:-74.41, name:"New Jersey" },
  { id:"DE", lat:39.16, lng:-75.52, name:"Delaware" },
  { id:"MD", lat:39.05, lng:-76.64, name:"Maryland" },
];

// ── MAJOR CITIES (120+ covering all 48 continental states) ──
// Tier 1: Top 30 freight hubs (always labeled)
// Tier 2: Major logistics/port cities (labeled at med+ zoom)
// Tier 3: State capitals & regional centers (labeled at hi zoom)
const CITIES: { n: string; lat: number; lng: number; tier: number; st: string }[] = [
  // ── TIER 1: Top 30 Freight Megahubs ──
  { n:"Los Angeles", lat:34.05, lng:-118.24, tier:1, st:"CA" },
  { n:"Chicago", lat:41.88, lng:-87.63, tier:1, st:"IL" },
  { n:"Houston", lat:29.76, lng:-95.37, tier:1, st:"TX" },
  { n:"Dallas", lat:32.78, lng:-96.80, tier:1, st:"TX" },
  { n:"Atlanta", lat:33.75, lng:-84.39, tier:1, st:"GA" },
  { n:"New York", lat:40.71, lng:-74.01, tier:1, st:"NY" },
  { n:"Miami", lat:25.76, lng:-80.19, tier:1, st:"FL" },
  { n:"Denver", lat:39.74, lng:-104.99, tier:1, st:"CO" },
  { n:"Phoenix", lat:33.45, lng:-112.07, tier:1, st:"AZ" },
  { n:"Seattle", lat:47.61, lng:-122.33, tier:1, st:"WA" },
  { n:"Memphis", lat:35.15, lng:-90.05, tier:1, st:"TN" },
  { n:"Kansas City", lat:39.10, lng:-94.58, tier:1, st:"MO" },
  { n:"Nashville", lat:36.16, lng:-86.78, tier:1, st:"TN" },
  { n:"Indianapolis", lat:39.77, lng:-86.16, tier:1, st:"IN" },
  { n:"Detroit", lat:42.33, lng:-83.05, tier:1, st:"MI" },
  { n:"Minneapolis", lat:44.98, lng:-93.27, tier:1, st:"MN" },
  { n:"St. Louis", lat:38.63, lng:-90.20, tier:1, st:"MO" },
  { n:"Philadelphia", lat:39.95, lng:-75.17, tier:1, st:"PA" },
  { n:"San Antonio", lat:29.42, lng:-98.49, tier:1, st:"TX" },
  { n:"Jacksonville", lat:30.33, lng:-81.66, tier:1, st:"FL" },
  { n:"Columbus", lat:39.96, lng:-82.99, tier:1, st:"OH" },
  { n:"Louisville", lat:38.25, lng:-85.76, tier:1, st:"KY" },
  { n:"Charlotte", lat:35.23, lng:-80.84, tier:1, st:"NC" },
  { n:"New Orleans", lat:29.95, lng:-90.07, tier:1, st:"LA" },
  { n:"Oklahoma City", lat:35.47, lng:-97.52, tier:1, st:"OK" },
  { n:"Portland", lat:45.52, lng:-122.68, tier:1, st:"OR" },
  { n:"Salt Lake City", lat:40.76, lng:-111.89, tier:1, st:"UT" },
  { n:"Pittsburgh", lat:40.44, lng:-79.99, tier:1, st:"PA" },
  { n:"Omaha", lat:41.26, lng:-95.94, tier:1, st:"NE" },
  { n:"El Paso", lat:31.76, lng:-106.44, tier:1, st:"TX" },
  // ── TIER 2: Major Logistics / Port / Border Cities ──
  { n:"San Francisco", lat:37.77, lng:-122.42, tier:2, st:"CA" },
  { n:"San Diego", lat:32.72, lng:-117.16, tier:2, st:"CA" },
  { n:"Oakland", lat:37.80, lng:-122.27, tier:2, st:"CA" },
  { n:"Sacramento", lat:38.58, lng:-121.49, tier:2, st:"CA" },
  { n:"Fresno", lat:36.74, lng:-119.77, tier:2, st:"CA" },
  { n:"Bakersfield", lat:35.37, lng:-119.02, tier:2, st:"CA" },
  { n:"Stockton", lat:37.96, lng:-121.29, tier:2, st:"CA" },
  { n:"Long Beach", lat:33.77, lng:-118.19, tier:2, st:"CA" },
  { n:"Tacoma", lat:47.25, lng:-122.44, tier:2, st:"WA" },
  { n:"Spokane", lat:47.66, lng:-117.43, tier:2, st:"WA" },
  { n:"Boise", lat:43.62, lng:-116.20, tier:2, st:"ID" },
  { n:"Las Vegas", lat:36.17, lng:-115.14, tier:2, st:"NV" },
  { n:"Reno", lat:39.53, lng:-119.81, tier:2, st:"NV" },
  { n:"Tucson", lat:32.22, lng:-110.93, tier:2, st:"AZ" },
  { n:"Albuquerque", lat:35.08, lng:-106.65, tier:2, st:"NM" },
  { n:"Fort Worth", lat:32.76, lng:-97.33, tier:2, st:"TX" },
  { n:"Austin", lat:30.27, lng:-97.74, tier:2, st:"TX" },
  { n:"Laredo", lat:27.51, lng:-99.51, tier:2, st:"TX" },
  { n:"Corpus Christi", lat:27.80, lng:-97.40, tier:2, st:"TX" },
  { n:"Midland", lat:32.00, lng:-102.08, tier:2, st:"TX" },
  { n:"Beaumont", lat:30.08, lng:-94.10, tier:2, st:"TX" },
  { n:"Amarillo", lat:35.22, lng:-101.83, tier:2, st:"TX" },
  { n:"Lubbock", lat:33.58, lng:-101.85, tier:2, st:"TX" },
  { n:"Tulsa", lat:36.15, lng:-95.99, tier:2, st:"OK" },
  { n:"Wichita", lat:37.69, lng:-97.34, tier:2, st:"KS" },
  { n:"Des Moines", lat:41.59, lng:-93.62, tier:2, st:"IA" },
  { n:"Sioux Falls", lat:43.55, lng:-96.70, tier:2, st:"SD" },
  { n:"Fargo", lat:46.88, lng:-96.79, tier:2, st:"ND" },
  { n:"Bismarck", lat:46.81, lng:-100.78, tier:2, st:"ND" },
  { n:"Billings", lat:45.78, lng:-108.50, tier:2, st:"MT" },
  { n:"Cheyenne", lat:41.14, lng:-104.82, tier:2, st:"WY" },
  { n:"Casper", lat:42.87, lng:-106.31, tier:2, st:"WY" },
  { n:"Colorado Springs", lat:38.83, lng:-104.82, tier:2, st:"CO" },
  { n:"Little Rock", lat:34.75, lng:-92.29, tier:2, st:"AR" },
  { n:"Baton Rouge", lat:30.45, lng:-91.19, tier:2, st:"LA" },
  { n:"Shreveport", lat:32.53, lng:-93.75, tier:2, st:"LA" },
  { n:"Lake Charles", lat:30.23, lng:-93.22, tier:2, st:"LA" },
  { n:"Jackson", lat:32.30, lng:-90.18, tier:2, st:"MS" },
  { n:"Birmingham", lat:33.52, lng:-86.80, tier:2, st:"AL" },
  { n:"Mobile", lat:30.70, lng:-88.04, tier:2, st:"AL" },
  { n:"Montgomery", lat:32.38, lng:-86.30, tier:2, st:"AL" },
  { n:"Savannah", lat:32.08, lng:-81.09, tier:2, st:"GA" },
  { n:"Tampa", lat:27.95, lng:-82.46, tier:2, st:"FL" },
  { n:"Orlando", lat:28.54, lng:-81.38, tier:2, st:"FL" },
  { n:"Ft. Lauderdale", lat:26.12, lng:-80.14, tier:2, st:"FL" },
  { n:"Charleston", lat:32.78, lng:-79.93, tier:2, st:"SC" },
  { n:"Columbia", lat:34.00, lng:-81.04, tier:2, st:"SC" },
  { n:"Raleigh", lat:35.78, lng:-78.64, tier:2, st:"NC" },
  { n:"Greensboro", lat:36.07, lng:-79.79, tier:2, st:"NC" },
  { n:"Wilmington NC", lat:34.23, lng:-77.95, tier:2, st:"NC" },
  { n:"Richmond", lat:37.54, lng:-77.44, tier:2, st:"VA" },
  { n:"Norfolk", lat:36.85, lng:-76.29, tier:2, st:"VA" },
  { n:"Baltimore", lat:39.29, lng:-76.61, tier:2, st:"MD" },
  { n:"Newark", lat:40.74, lng:-74.17, tier:2, st:"NJ" },
  { n:"Buffalo", lat:42.89, lng:-78.88, tier:2, st:"NY" },
  { n:"Albany", lat:42.65, lng:-73.76, tier:2, st:"NY" },
  { n:"Syracuse", lat:43.05, lng:-76.15, tier:2, st:"NY" },
  { n:"Boston", lat:42.36, lng:-71.06, tier:2, st:"MA" },
  { n:"Hartford", lat:41.76, lng:-72.68, tier:2, st:"CT" },
  { n:"Providence", lat:41.82, lng:-71.41, tier:2, st:"RI" },
  { n:"Cleveland", lat:41.50, lng:-81.69, tier:2, st:"OH" },
  { n:"Cincinnati", lat:39.10, lng:-84.51, tier:2, st:"OH" },
  { n:"Toledo", lat:41.65, lng:-83.54, tier:2, st:"OH" },
  { n:"Grand Rapids", lat:42.96, lng:-85.66, tier:2, st:"MI" },
  { n:"Milwaukee", lat:43.04, lng:-87.91, tier:2, st:"WI" },
  { n:"Green Bay", lat:44.51, lng:-88.02, tier:2, st:"WI" },
  { n:"Knoxville", lat:35.96, lng:-83.92, tier:2, st:"TN" },
  { n:"Chattanooga", lat:35.05, lng:-85.31, tier:2, st:"TN" },
  // ── TIER 3: State Capitals & Regional Centers ──
  { n:"Olympia", lat:47.04, lng:-122.90, tier:3, st:"WA" },
  { n:"Salem", lat:44.94, lng:-123.03, tier:3, st:"OR" },
  { n:"Eugene", lat:44.05, lng:-123.09, tier:3, st:"OR" },
  { n:"Helena", lat:46.60, lng:-112.04, tier:3, st:"MT" },
  { n:"Missoula", lat:46.87, lng:-114.00, tier:3, st:"MT" },
  { n:"Great Falls", lat:47.51, lng:-111.29, tier:3, st:"MT" },
  { n:"Twin Falls", lat:42.56, lng:-114.46, tier:3, st:"ID" },
  { n:"Idaho Falls", lat:43.47, lng:-112.04, tier:3, st:"ID" },
  { n:"Provo", lat:40.23, lng:-111.66, tier:3, st:"UT" },
  { n:"Flagstaff", lat:35.20, lng:-111.65, tier:3, st:"AZ" },
  { n:"Las Cruces", lat:32.32, lng:-106.76, tier:3, st:"NM" },
  { n:"Santa Fe", lat:35.69, lng:-105.94, tier:3, st:"NM" },
  { n:"Pueblo", lat:38.25, lng:-104.61, tier:3, st:"CO" },
  { n:"Grand Junction", lat:39.06, lng:-108.55, tier:3, st:"CO" },
  { n:"Topeka", lat:39.05, lng:-95.68, tier:3, st:"KS" },
  { n:"Lincoln", lat:40.81, lng:-96.70, tier:3, st:"NE" },
  { n:"Rapid City", lat:44.08, lng:-103.23, tier:3, st:"SD" },
  { n:"Pierre", lat:44.37, lng:-100.35, tier:3, st:"SD" },
  { n:"Williston", lat:48.15, lng:-103.63, tier:3, st:"ND" },
  { n:"Madison", lat:43.07, lng:-89.40, tier:3, st:"WI" },
  { n:"Duluth", lat:46.79, lng:-92.10, tier:3, st:"MN" },
  { n:"Rochester MN", lat:44.02, lng:-92.47, tier:3, st:"MN" },
  { n:"Cedar Rapids", lat:41.98, lng:-91.67, tier:3, st:"IA" },
  { n:"Davenport", lat:41.52, lng:-90.58, tier:3, st:"IA" },
  { n:"Springfield IL", lat:39.78, lng:-89.65, tier:3, st:"IL" },
  { n:"Rockford", lat:42.27, lng:-89.09, tier:3, st:"IL" },
  { n:"Peoria", lat:40.69, lng:-89.59, tier:3, st:"IL" },
  { n:"Evansville", lat:37.97, lng:-87.56, tier:3, st:"IN" },
  { n:"Fort Wayne", lat:41.08, lng:-85.14, tier:3, st:"IN" },
  { n:"Akron", lat:41.08, lng:-81.52, tier:3, st:"OH" },
  { n:"Dayton", lat:39.76, lng:-84.19, tier:3, st:"OH" },
  { n:"Youngstown", lat:41.10, lng:-80.65, tier:3, st:"OH" },
  { n:"Lexington", lat:38.04, lng:-84.50, tier:3, st:"KY" },
  { n:"Huntington", lat:38.42, lng:-82.44, tier:3, st:"WV" },
  { n:"Charleston WV", lat:38.35, lng:-81.63, tier:3, st:"WV" },
  { n:"Harrisburg", lat:40.27, lng:-76.88, tier:3, st:"PA" },
  { n:"Scranton", lat:41.41, lng:-75.66, tier:3, st:"PA" },
  { n:"Erie", lat:42.13, lng:-80.08, tier:3, st:"PA" },
  { n:"Allentown", lat:40.60, lng:-75.49, tier:3, st:"PA" },
  { n:"Wilmington DE", lat:39.74, lng:-75.55, tier:3, st:"DE" },
  { n:"Dover", lat:39.16, lng:-75.52, tier:3, st:"DE" },
  { n:"Annapolis", lat:38.98, lng:-76.49, tier:3, st:"MD" },
  { n:"Virginia Beach", lat:36.85, lng:-75.98, tier:3, st:"VA" },
  { n:"Roanoke", lat:37.27, lng:-79.94, tier:3, st:"VA" },
  { n:"Fayetteville NC", lat:35.05, lng:-78.88, tier:3, st:"NC" },
  { n:"Greenville SC", lat:34.85, lng:-82.40, tier:3, st:"SC" },
  { n:"Augusta", lat:33.47, lng:-81.97, tier:3, st:"GA" },
  { n:"Macon", lat:32.84, lng:-83.63, tier:3, st:"GA" },
  { n:"Tallahassee", lat:30.44, lng:-84.28, tier:3, st:"FL" },
  { n:"Pensacola", lat:30.44, lng:-87.22, tier:3, st:"FL" },
  { n:"Ft. Myers", lat:26.64, lng:-81.87, tier:3, st:"FL" },
  { n:"Huntsville", lat:34.73, lng:-86.59, tier:3, st:"AL" },
  { n:"Gulfport", lat:30.37, lng:-89.09, tier:3, st:"MS" },
  { n:"Hattiesburg", lat:31.33, lng:-89.29, tier:3, st:"MS" },
  { n:"Monroe", lat:32.51, lng:-92.12, tier:3, st:"LA" },
  { n:"Lafayette", lat:30.22, lng:-92.02, tier:3, st:"LA" },
  { n:"Fort Smith", lat:35.39, lng:-94.40, tier:3, st:"AR" },
  { n:"Jonesboro", lat:35.84, lng:-90.70, tier:3, st:"AR" },
  { n:"Springfield MO", lat:37.22, lng:-93.29, tier:3, st:"MO" },
  { n:"Joplin", lat:37.08, lng:-94.51, tier:3, st:"MO" },
  { n:"Burlington", lat:44.48, lng:-73.21, tier:3, st:"VT" },
  { n:"Montpelier", lat:44.26, lng:-72.58, tier:3, st:"VT" },
  { n:"Concord", lat:43.21, lng:-71.54, tier:3, st:"NH" },
  { n:"Manchester NH", lat:42.99, lng:-71.46, tier:3, st:"NH" },
  { n:"Portland ME", lat:43.66, lng:-70.26, tier:3, st:"ME" },
  { n:"Bangor", lat:44.80, lng:-68.77, tier:3, st:"ME" },
  { n:"Worcester", lat:42.26, lng:-71.80, tier:3, st:"MA" },
  { n:"Springfield MA", lat:42.10, lng:-72.59, tier:3, st:"MA" },
  { n:"New Haven", lat:41.31, lng:-72.92, tier:3, st:"CT" },
  { n:"Trenton", lat:40.22, lng:-74.76, tier:3, st:"NJ" },
  { n:"Camden", lat:39.93, lng:-75.12, tier:3, st:"NJ" },
];

export default function HotZoneMap({ zones, coldZones, roleCtx, selectedZone, onSelectZone, isLight, activeLayers, intel, roadIntel }: HotZoneMapProps) {
  const cRef = useRef<HTMLDivElement>(null);
  const [vb, setVb] = useState({ x: 0, y: 0, w: 800, h: 380 });
  const [panning, setPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ mx: 0, my: 0, vx: 0, vy: 0 });
  const rafRef = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ px: number; py: number; z: any } | null>(null);
  const [showHwy, setShowHwy] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showInfra, setShowInfra] = useState(true);
  const [showHazmat, setShowHazmat] = useState(true);
  const [showLidar, setShowLidar] = useState(false);
  // Live data layer toggles (from getMapIntelligence)
  const [showQuakes, setShowQuakes] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSpills, setShowSpills] = useState(false);
  const [showEpa, setShowEpa] = useState(false);
  const [showFema, setShowFema] = useState(false);
  const [showLocks, setShowLocks] = useState(false);
  const [showEmissions, setShowEmissions] = useState(false);
  const [showFuelMap, setShowFuelMap] = useState(false);
  const [intelTip, setIntelTip] = useState<{ px: number; py: number; data: any; type: string } | null>(null);

  const zoomPct = useMemo(() => Math.round((800 / vb.w) * 100), [vb.w]);
  const detail = vb.w <= 250 ? "hi" : vb.w <= 450 ? "med" : "lo";
  const rv = useMemo(() => getRoleViz(roleCtx?.perspective), [roleCtx?.perspective]);

  // clamp helper
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // ── ZOOM (firm, controlled — clamped factor prevents runaway zoom) ──
  const doZoom = useCallback((factor: number, cx?: number, cy?: number) => {
    const f = clamp(factor, 0.92, 1.08); // hard clamp: max 8% per tick
    setVb(p => {
      const pcx = cx ?? p.x + p.w / 2;
      const pcy = cy ?? p.y + p.h / 2;
      const nw = clamp(p.w / f, 120, 800); // min 120 (was 80) — prevents over-zoom
      const nh = nw * (380 / 800);
      return { x: clamp(pcx - nw / 2, -60, 860 - nw), y: clamp(pcy - nh / 2, -30, 410 - nh), w: nw, h: nh };
    });
  }, []);

  const resetView = useCallback(() => setVb({ x: 0, y: 0, w: 800, h: 380 }), []);

  const zoomToZone = useCallback((zone: any) => {
    const [zx, zy] = proj(zone.center?.lng || -95, zone.center?.lat || 38);
    const nw = 250, nh = nw * (380 / 800);
    setVb({ x: clamp(zx - nw / 2, -60, 640), y: clamp(zy - nh / 2, -30, 310), w: nw, h: nh });
    onSelectZone(zone.zoneId);
  }, [onSelectZone]);

  // ── WHEEL ZOOM (throttled + dampened — firm, not jumpy) ──
  const wheelThrottle = useRef(0);
  useEffect(() => {
    const el = cRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelThrottle.current < 40) return; // 25fps max — prevents rapid scroll cascade
      wheelThrottle.current = now;
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * vb.w + vb.x;
      const my = ((e.clientY - r.top) / r.height) * vb.h + vb.y;
      // Dampened: 1.03/0.97 per tick (was 1.05/0.95 — much smoother)
      doZoom(e.deltaY < 0 ? 1.03 : 0.97, mx, my);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [vb, doZoom]);

  // ── TOUCH PINCH ZOOM (dampened factor) ──
  const lastPinchDist = useRef<number | null>(null);
  useEffect(() => {
    const el = cRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist.current !== null) {
          // Dampen pinch: lerp toward 1.0 so it's not jumpy
          const raw = dist / lastPinchDist.current;
          const dampened = 1 + (raw - 1) * 0.5; // 50% dampening
          doZoom(dampened);
        }
        lastPinchDist.current = dist;
      }
    };
    const onTouchEnd = () => { lastPinchDist.current = null; };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => { el.removeEventListener("touchmove", onTouchMove); el.removeEventListener("touchend", onTouchEnd); };
  }, [doZoom]);

  // ── PAN ──
  const onPD = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    setPanOrigin({ mx: e.clientX, my: e.clientY, vx: vb.x, vy: vb.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [vb.x, vb.y]);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!panning || !cRef.current) return;
    const clientX = e.clientX, clientY = e.clientY;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cRef.current) return;
      const r = cRef.current.getBoundingClientRect();
      const dx = ((clientX - panOrigin.mx) / r.width) * vb.w;
      const dy = ((clientY - panOrigin.my) / r.height) * vb.h;
      setVb(p => ({ ...p, x: clamp(panOrigin.vx - dx, -100, 900), y: clamp(panOrigin.vy - dy, -50, 430) }));
    });
  }, [panning, panOrigin, vb.w, vb.h]);

  const onPU = useCallback(() => setPanning(false), []);

  // ── TOOLTIP ──
  const showTip = useCallback((e: React.MouseEvent, z: any) => {
    if (!cRef.current) return;
    const r = cRef.current.getBoundingClientRect();
    setTip({ px: e.clientX - r.left, py: e.clientY - r.top - 12, z });
    setHovered(z.zoneId);
  }, []);

  const showIntelTip = useCallback((e: React.MouseEvent, data: any, type: string) => {
    if (!cRef.current) return;
    const r = cRef.current.getBoundingClientRect();
    setIntelTip({ px: e.clientX - r.left, py: e.clientY - r.top - 12, data, type });
  }, []);

  // scale helper for zoom-dependent sizes
  const s = useCallback((base: number) => Math.max(base * 0.4, base * (800 / vb.w) * 0.5), [vb.w]);

  return (
    <div className="relative" style={{ height: 440 }}>
      {/* ── LEFT EDGE BRANDING ── */}
      <div className="absolute left-0 top-0 bottom-0 w-0 z-10 pointer-events-none select-none" aria-hidden>
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "4px",
            transform: "rotate(-90deg) translateX(-50%)",
            transformOrigin: "0 0",
            whiteSpace: "nowrap",
            letterSpacing: "0.18em",
            fontSize: "8px",
            fontWeight: 500,
            fontFamily: "'Gilroy-Light', system-ui, sans-serif",
            color: isLight ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.35)",
          }}
        >
          © DESIGNED BY EUSORONE TECHNOLOGIES, INC 2026
        </div>
      </div>

      {/* ── SVG MAP CONTAINER ── */}
      <div
        ref={cRef}
        className={`relative w-full h-full rounded-2xl border overflow-hidden select-none ${panning ? "cursor-grabbing" : "cursor-grab"} ${
          isLight ? "bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 border-slate-200/80" : "bg-gradient-to-br from-[#0a0a14] via-[#0e0e1c] to-[#0c1020] border-white/[0.06]"
        }`}
        style={{ willChange: "transform", contain: "layout style paint" }}
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerLeave={() => { onPU(); setTip(null); setHovered(null); setIntelTip(null); }}
      >
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ willChange: "viewBox" }}>
          <defs>
            <radialGradient id="gz-crit"><stop offset="0%" stopColor={rv.critColor} stopOpacity="0.7" /><stop offset="35%" stopColor={rv.critColor} stopOpacity="0.35" /><stop offset="100%" stopColor={rv.critColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-high"><stop offset="0%" stopColor={rv.highColor} stopOpacity="0.55" /><stop offset="40%" stopColor={rv.highColor} stopOpacity="0.22" /><stop offset="100%" stopColor={rv.highColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-elev"><stop offset="0%" stopColor={rv.elevColor} stopOpacity="0.4" /><stop offset="45%" stopColor={rv.elevColor} stopOpacity="0.15" /><stop offset="100%" stopColor={rv.elevColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-cold"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" /><stop offset="50%" stopColor="#3B82F6" stopOpacity="0.12" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-sel"><stop offset="0%" stopColor="#1473FF" stopOpacity="0.6" /><stop offset="40%" stopColor="#BE01FF" stopOpacity="0.25" /><stop offset="100%" stopColor="#BE01FF" stopOpacity="0" /></radialGradient>
            <filter id="mapGlow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="heatGlow"><feGaussianBlur stdDeviation="6" result="b" /><feColorMatrix in="b" type="saturate" values="1.8" result="s" /><feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <radialGradient id="gz-lidar"><stop offset="0%" stopColor="#1473FF" stopOpacity="0.5" /><stop offset="40%" stopColor="#BE01FF" stopOpacity="0.25" /><stop offset="100%" stopColor="#BE01FF" stopOpacity="0" /></radialGradient>
            <linearGradient id="eusoRoadGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1473FF" /><stop offset="100%" stopColor="#BE01FF" /></linearGradient>
            <filter id="lidarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feColorMatrix in="b" type="saturate" values="2" result="s" /><feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* State outlines */}
          {STATES.map(st => (
            <path key={st.id} d={st.d} fill={isLight ? "#e8ecf0" : "#161628"} stroke={isLight ? "#c8d0da" : "#252540"} strokeWidth={s(0.5)} opacity={0.8}>
              <title>{st.id}</title>
            </path>
          ))}

          {/* State labels at high zoom */}
          {detail === "hi" && STATES.map(st => {
            const m = st.d.match(/M([\d.]+),([\d.]+)/);
            if (!m) return null;
            return (
              <text key={`lbl-${st.id}`} x={Number(m[1]) + 15} y={Number(m[2]) + 18} fontSize={s(5)} fill={isLight ? "#94a3b8" : "#3a3a5a"} className="select-none pointer-events-none" textAnchor="middle">
                {st.id}
              </text>
            );
          })}

          {/* Interstate highways */}
          {showHwy && HWY.map(h => (
            <g key={h.id}>
              <path d={h.d} fill="none" stroke={isLight ? "#a0aec0" : "#2d2d4a"} strokeWidth={s(detail === "hi" ? 1.2 : 0.7)} strokeLinecap="round" opacity={0.5} />
              {detail !== "lo" && (() => {
                const m = h.d.match(/L([\d.]+),([\d.]+)/g);
                if (!m || m.length < 2) return null;
                const mid = m[Math.floor(m.length / 2)].match(/([\d.]+),([\d.]+)/);
                if (!mid) return null;
                return (
                  <text x={Number(mid[1])} y={Number(mid[2]) - 3} fontSize={s(4)} fill={isLight ? "#64748b" : "#4a4a6a"} opacity={0.5} textAnchor="middle" className="select-none pointer-events-none">
                    {h.id}
                  </text>
                );
              })()}
            </g>
          ))}

          {/* State center labels (abbreviation at med, full name at hi) */}
          {detail !== "lo" && STATE_CENTERS.map(sc => {
            const [sx, sy] = proj(sc.lng, sc.lat);
            return (
              <g key={`sc-${sc.id}`} className="select-none pointer-events-none">
                <text x={sx} y={sy} textAnchor="middle" fontSize={s(detail === "hi" ? 8 : 6)} fill={isLight ? "#cbd5e1" : "#1e1e3a"} fontWeight="700" opacity={detail === "hi" ? 0.35 : 0.2}>
                  {sc.id}
                </text>
                {detail === "hi" && (
                  <text x={sx} y={sy + s(7)} textAnchor="middle" fontSize={s(3.5)} fill={isLight ? "#94a3b8" : "#2a2a4a"} opacity={0.3}>
                    {sc.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* ═══ ROAD INTELLIGENCE LAYER — Crowd-sourced road mapping ═══ */}
          {/* Road segments render as gradient lines; intensity = traversal count */}
          {/* Live pings render as animated glowing dots moving along roads */}
          {showLidar && roadIntel?.segments && roadIntel.segments.length > 0 && (
            <g className="select-none pointer-events-none" opacity={0.85}>
              {roadIntel.segments.map((seg) => {
                const [x1, y1] = proj(seg.startLng, seg.startLat);
                const [x2, y2] = proj(seg.endLng, seg.endLat);
                // Intensity based on traversal count (more traversals = brighter)
                const intensity = Math.min(1, (seg.traversalCount || 1) / 50);
                // Width based on road type
                const baseWidth = seg.roadType === "interstate" ? 1.8 : seg.roadType === "us_highway" ? 1.4 : seg.roadType === "state_highway" ? 1.1 : 0.8;
                // Color based on congestion or hazmat
                const color = seg.hasHazmat ? "#FF6B35" : seg.congestion === "heavy" || seg.congestion === "stopped" ? "#EF4444" : seg.congestion === "moderate" ? "#FBBF24" : `hsl(${260 - intensity * 30}, 100%, ${55 + intensity * 15}%)`;
                const glowColor = seg.hasHazmat ? "#FF6B3540" : "rgba(20,115,255,0.19)";
                return (
                  <g key={`rs-${seg.id}`}>
                    {/* Glow underline */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={glowColor} strokeWidth={s(baseWidth * 3)} strokeLinecap="round"
                      opacity={0.3 + intensity * 0.4} filter="url(#lidarGlow)" />
                    {/* Main road line — gradient from dim to bright based on coverage */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={color} strokeWidth={s(baseWidth)} strokeLinecap="round"
                      opacity={0.4 + intensity * 0.55} />
                    {/* Road name label at high zoom */}
                    {detail === "hi" && seg.roadName && seg.traversalCount > 10 && (
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - s(2)} fontSize={s(3)} fill="#A855F7" opacity={0.6}
                        textAnchor="middle" fontWeight="600">{seg.roadName}</text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
          {/* Live driver pings — animated glowing dots showing active road mapping */}
          {showLidar && roadIntel?.livePings && roadIntel.livePings.length > 0 && (
            <g className="select-none pointer-events-none">
              {roadIntel.livePings.map((ping, i) => {
                const [px, py] = proj(ping.lng, ping.lat);
                return (
                  <g key={`lp-${ping.driverId}-${i}`}>
                    {/* Outer pulse ring */}
                    <circle cx={px} cy={py} r={s(4)} fill="none" stroke="#BE01FF" strokeWidth={s(0.4)} opacity={0.4}>
                      <animate attributeName="r" values={`${s(2)};${s(6)};${s(2)}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Inner dot — the driver position */}
                    <circle cx={px} cy={py} r={s(1.5)} fill="url(#eusoRoadGrad)" opacity={0.9} filter="url(#lidarGlow)">
                      <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Speed label at high zoom */}
                    {detail === "hi" && ping.speed != null && ping.speed > 0 && (
                      <text x={px + s(3)} y={py - s(2)} fontSize={s(3)} fill="#A855F7" opacity={0.7} fontWeight="600">
                        {Math.round(ping.speed)} mph
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
          {/* Road Intelligence stats badge */}
          {showLidar && roadIntel?.stats && (roadIntel.stats.totalSegments > 0 || roadIntel.stats.liveDrivers > 0) && (
            <g className="select-none pointer-events-none">
              <rect x={vb.x + s(8)} y={vb.y + vb.h - s(28)} width={s(60)} height={s(22)} rx={s(4)}
                fill={isLight ? "rgba(10,15,40,0.88)" : "rgba(8,10,30,0.92)"} stroke="#1473FF" strokeWidth={s(0.4)} opacity={0.9} />
              <text x={vb.x + s(12)} y={vb.y + vb.h - s(21)} fontSize={s(4)} fill="#1473FF" fontWeight="700">ROAD INTELLIGENCE</text>
              <text x={vb.x + s(12)} y={vb.y + vb.h - s(15)} fontSize={s(3.2)} fill="#A855F7" opacity={0.8}>
                {roadIntel.stats.totalSegments.toLocaleString()} segments • {roadIntel.stats.totalMiles.toLocaleString()} mi mapped
              </text>
              <text x={vb.x + s(12)} y={vb.y + vb.h - s(10)} fontSize={s(3.2)} fill="#A855F7" opacity={0.8}>
                {roadIntel.stats.liveDrivers} live driver{roadIntel.stats.liveDrivers !== 1 ? "s" : ""} mapping
              </text>
            </g>
          )}

          {/* City markers (120+ cities, tier-based visibility) */}
          {showCities && CITIES.map(c => {
            const [cx, cy] = proj(c.lng, c.lat);
            const showDot = detail === "hi" || (detail === "med" && c.tier <= 2) || (detail === "lo" && c.tier === 1);
            if (!showDot) return null;
            const showLbl = detail === "hi" || (detail === "med" && c.tier <= 2) || (detail === "lo" && c.tier === 1);
            const dotR = c.tier === 1 ? s(2) : c.tier === 2 ? s(1.4) : s(0.9);
            const lblSize = c.tier === 1 ? s(detail === "hi" ? 5.5 : 4.5) : c.tier === 2 ? s(detail === "hi" ? 4.5 : 3.5) : s(3.5);
            return (
              <g key={c.n}>
                <circle cx={cx} cy={cy} r={dotR} fill={isLight ? "#64748b" : "#4a4a6a"} opacity={c.tier === 1 ? 0.6 : c.tier === 2 ? 0.45 : 0.3} />
                {showLbl && (
                  <text x={cx + s(3)} y={cy - s(2)} fontSize={lblSize} fill={isLight ? "#475569" : "#7a7a9a"} opacity={c.tier === 1 ? 0.85 : c.tier === 2 ? 0.65 : 0.5} className="select-none pointer-events-none" fontWeight={c.tier === 1 ? "600" : "400"}>
                    {c.n}
                  </text>
                )}
              </g>
            );
          })}

          {/* Major Ports (anchor icons at med+ zoom) */}
          {showInfra && detail !== "lo" && PORTS.map(p => {
            const [px, py] = proj(p.lng, p.lat);
            return (
              <g key={`port-${p.n}`} className="select-none pointer-events-none">
                <rect x={px - s(2.5)} y={py - s(2.5)} width={s(5)} height={s(5)} rx={s(1.2)} fill={isLight ? "#0284C7" : "#0EA5E9"} opacity={0.7} />
                <text x={px} y={py + s(1.5)} textAnchor="middle" fontSize={s(3)} fill="white" fontWeight="700">P</text>
                {detail === "hi" && (
                  <text x={px} y={py + s(8)} textAnchor="middle" fontSize={s(3.5)} fill={isLight ? "#0284C7" : "#38BDF8"} fontWeight="600" opacity={0.7}>
                    {p.n.replace("Port of ", "")}
                  </text>
                )}
              </g>
            );
          })}

          {/* Border Crossings (diamond markers at med+ zoom) */}
          {showInfra && detail !== "lo" && BORDERS.map(b => {
            const [bx, by] = proj(b.lng, b.lat);
            const col = b.country === "MX" ? "#F59E0B" : "#22D3EE";
            return (
              <g key={`bdr-${b.n}`} className="select-none pointer-events-none">
                <polygon points={`${bx},${by - s(3.5)} ${bx + s(3)},${by} ${bx},${by + s(3.5)} ${bx - s(3)},${by}`} fill={col} opacity={0.7} />
                <text x={bx} y={by + s(1.2)} textAnchor="middle" fontSize={s(2.5)} fill="white" fontWeight="700">X</text>
                {detail === "hi" && (
                  <text x={bx} y={by + s(8)} textAnchor="middle" fontSize={s(3)} fill={col} fontWeight="600" opacity={0.7}>
                    {b.n} ({b.country})
                  </text>
                )}
              </g>
            );
          })}

          {/* Intermodal Terminals (rail icon at hi zoom) */}
          {showInfra && detail === "hi" && INTERMODAL.map(im => {
            const [ix, iy] = proj(im.lng, im.lat);
            return (
              <g key={`im-${im.n}`} className="select-none pointer-events-none">
                <rect x={ix - s(3)} y={iy - s(2)} width={s(6)} height={s(4)} rx={s(1)} fill={isLight ? "#7C3AED" : "#A78BFA"} opacity={0.6} />
                <text x={ix} y={iy + s(1)} textAnchor="middle" fontSize={s(2.5)} fill="white" fontWeight="700">IM</text>
                <text x={ix} y={iy + s(7)} textAnchor="middle" fontSize={s(2.8)} fill={isLight ? "#7C3AED" : "#A78BFA"} fontWeight="600" opacity={0.55}>
                  {im.n.length > 20 ? im.n.slice(0, 18) + ".." : im.n}
                </text>
              </g>
            );
          })}

          {/* Hazmat Corridors (compliance/safety — dashed orange lines at med+ zoom) */}
          {showHazmat && detail !== "lo" && HAZMAT_CORRIDORS.map(hc => (
            <path key={`haz-${hc.n}`} d={hc.d} fill="none" stroke={isLight ? "#F97316" : "#FB923C"} strokeWidth={s(1.8)} strokeDasharray={`${s(3)} ${s(2)}`} opacity={0.35} className="pointer-events-none">
              <title>{hc.n}</title>
            </path>
          ))}

          {/* Weigh Stations (compliance/driver — shield icon at med+ zoom) */}
          {showInfra && detail !== "lo" && WEIGH_STATIONS.map(ws => {
            const [wx, wy] = proj(ws.lng, ws.lat);
            return (
              <g key={`ws-${ws.n}`} className="select-none pointer-events-none">
                <polygon points={`${wx},${wy - s(3)} ${wx + s(2.5)},${wy - s(1)} ${wx + s(2.5)},${wy + s(2)} ${wx - s(2.5)},${wy + s(2)} ${wx - s(2.5)},${wy - s(1)}`} fill={isLight ? "#DC2626" : "#EF4444"} opacity={0.65} />
                <text x={wx} y={wy + s(0.8)} textAnchor="middle" fontSize={s(2.2)} fill="white" fontWeight="700">W</text>
                {detail === "hi" && (
                  <text x={wx} y={wy + s(6)} textAnchor="middle" fontSize={s(2.5)} fill={isLight ? "#DC2626" : "#F87171"} fontWeight="600" opacity={0.6}>
                    {ws.n}
                  </text>
                )}
              </g>
            );
          })}

          {/* Major Truck Stops (driver — fuel pump icon at hi zoom) */}
          {showInfra && detail === "hi" && TRUCK_STOPS.map(ts => {
            const [tx, ty] = proj(ts.lng, ts.lat);
            return (
              <g key={`ts-${ts.n}`} className="select-none pointer-events-none">
                <circle cx={tx} cy={ty} r={s(2.2)} fill={isLight ? "#059669" : "#34D399"} opacity={0.6} />
                <text x={tx} y={ty + s(0.9)} textAnchor="middle" fontSize={s(2)} fill="white" fontWeight="700">F</text>
                <text x={tx} y={ty + s(6)} textAnchor="middle" fontSize={s(2.5)} fill={isLight ? "#059669" : "#6EE7B7"} fontWeight="600" opacity={0.5}>
                  {ts.n.length > 18 ? ts.n.slice(0, 16) + ".." : ts.n}
                </text>
              </g>
            );
          })}

          {/* Distribution / Warehouse Hubs (shipper/broker — box icon at hi zoom) */}
          {showInfra && detail === "hi" && DIST_HUBS.map(dh => {
            const [dx, dy] = proj(dh.lng, dh.lat);
            return (
              <g key={`dh-${dh.n}`} className="select-none pointer-events-none">
                <rect x={dx - s(2.8)} y={dy - s(2)} width={s(5.6)} height={s(4)} rx={s(0.8)} fill={isLight ? "#D97706" : "#FBBF24"} opacity={0.5} />
                <text x={dx} y={dy + s(1)} textAnchor="middle" fontSize={s(2.2)} fill="white" fontWeight="700">DC</text>
                <text x={dx} y={dy + s(7)} textAnchor="middle" fontSize={s(2.5)} fill={isLight ? "#D97706" : "#FCD34D"} fontWeight="600" opacity={0.45}>
                  {dh.n.length > 22 ? dh.n.slice(0, 20) + ".." : dh.n}
                </text>
              </g>
            );
          })}

          {/* Refineries / Chemical Plants (hazmat load origins — hazmat toggle, med+ zoom) */}
          {showHazmat && detail !== "lo" && REFINERIES.map(rf => {
            const [rx, ry] = proj(rf.lng, rf.lat);
            const col = rf.type === "Chemical" ? "#E879F9" : "#F472B6";
            return (
              <g key={`rf-${rf.n}`} className="select-none pointer-events-none">
                <rect x={rx - s(2.5)} y={ry - s(2.5)} width={s(5)} height={s(5)} rx={s(0.5)} fill={col} opacity={0.6} stroke={col} strokeWidth={s(0.3)} />
                <text x={rx} y={ry + s(1.2)} textAnchor="middle" fontSize={s(2.2)} fill="white" fontWeight="700">{rf.type === "Chemical" ? "CH" : "RF"}</text>
                {detail === "hi" && (
                  <text x={rx} y={ry + s(7)} textAnchor="middle" fontSize={s(2.5)} fill={col} fontWeight="600" opacity={0.55}>
                    {rf.n.length > 20 ? rf.n.slice(0, 18) + ".." : rf.n}
                  </text>
                )}
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* LIVE DATA OVERLAYS — Real-time government data sources     */}
          {/* ═══════════════════════════════════════════════════════════ */}

          {/* FUEL PRICE STATE FILLS (EIA) — choropleth by diesel cost */}
          {showFuelMap && (intel?.fuelByState || []).length > 0 && (() => {
            const prices = intel.fuelByState as { state: string; diesel: number; change: number }[];
            const min = Math.min(...prices.map(p => p.diesel));
            const max = Math.max(...prices.map(p => p.diesel));
            const range = max - min || 1;
            const stateMap: Record<string, typeof prices[0]> = {};
            prices.forEach(p => { stateMap[p.state] = p; });
            return STATES.map(st => {
              const fp = stateMap[st.id];
              if (!fp) return null;
              const t = (fp.diesel - min) / range;
              const r = Math.round(200 + t * 55);
              const g = Math.round(200 - t * 160);
              const b = Math.round(50 - t * 30);
              return (
                <path key={`fuel-${st.id}`} d={st.d}
                  fill={`rgb(${r},${g},${b})`} opacity={0.35}
                  className="pointer-events-none" />
              );
            });
          })()}

          {/* FEMA DISASTER STATE HIGHLIGHTS */}
          {showFema && (intel?.femaDisasters || []).length > 0 && (() => {
            const femaStates = new Set((intel.femaDisasters as any[]).map(d => d.state));
            return STATES.filter(st => femaStates.has(st.id)).map(st => (
              <path key={`fema-${st.id}`} d={st.d}
                fill="#DC2626" opacity={0.15} stroke="#DC2626" strokeWidth={s(1.2)}
                strokeDasharray={`${s(3)} ${s(2)}`} className="pointer-events-none">
                <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2.5s" repeatCount="indefinite" />
              </path>
            ));
          })()}

          {/* WEATHER ALERT STATE HIGHLIGHTS (NWS) */}
          {showWeather && (intel?.weatherAlerts || []).length > 0 && (() => {
            const sevMap: Record<string, string> = {};
            for (const wa of (intel.weatherAlerts as any[])) {
              for (const st of (wa.states || [])) {
                const cur = sevMap[st];
                if (!cur || wa.severity === "Extreme" || (wa.severity === "Severe" && cur !== "Extreme")) {
                  sevMap[st] = wa.severity;
                }
              }
            }
            return STATES.filter(st => sevMap[st.id]).map(st => {
              const sev = sevMap[st.id];
              const col = sev === "Extreme" ? "#DC2626" : sev === "Severe" ? "#F59E0B" : "#3B82F6";
              return (
                <path key={`wx-${st.id}`} d={st.d}
                  fill={col} opacity={sev === "Extreme" ? 0.2 : 0.12}
                  className="pointer-events-none">
                  {sev === "Extreme" && <animate attributeName="opacity" values="0.15;0.25;0.15" dur="1.8s" repeatCount="indefinite" />}
                </path>
              );
            });
          })()}

          {/* EARTHQUAKE MARKERS (USGS) */}
          {showQuakes && (intel?.earthquakes || []).map((eq: any) => {
            const [ex, ey] = proj(eq.lng, eq.lat);
            const mag = eq.mag || 0;
            const r2 = s(Math.max(2, mag * 2));
            const col = mag >= 5 ? "#DC2626" : mag >= 4 ? "#F59E0B" : "#22D3EE";
            return (
              <g key={`eq-${eq.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, eq, "earthquake")}
                onMouseLeave={() => setIntelTip(null)}>
                <circle cx={ex} cy={ey} r={r2 * 2.5} fill={col} opacity={0.12}>
                  <animate attributeName="r" values={`${r2*2};${r2*3};${r2*2}`} dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={ex} cy={ey} r={r2} fill={col} opacity={0.75} stroke="white" strokeWidth={s(0.3)} />
                {detail !== "lo" && mag >= 4 && (
                  <text x={ex} y={ey - r2 - s(2)} textAnchor="middle" fontSize={s(3.5)} fill={col} fontWeight="700" className="select-none pointer-events-none">
                    M{mag.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* WILDFIRE MARKERS (NIFC) */}
          {showFires && (intel?.wildfires || []).map((wf: any) => {
            const [fx, fy] = proj(wf.lng, wf.lat);
            const acres = wf.acres || 0;
            const r2 = s(Math.max(2.5, Math.min(8, Math.sqrt(acres) / 30)));
            const contained = wf.contained || 0;
            const col = contained > 80 ? "#F59E0B" : contained > 50 ? "#F97316" : "#EF4444";
            return (
              <g key={`wf-${wf.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, wf, "wildfire")}
                onMouseLeave={() => setIntelTip(null)}>
                <circle cx={fx} cy={fy} r={r2 * 2} fill={col} opacity={0.15}>
                  {contained < 50 && <animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.5s" repeatCount="indefinite" />}
                </circle>
                <polygon
                  points={`${fx},${fy - r2} ${fx + r2 * 0.7},${fy + r2 * 0.5} ${fx - r2 * 0.7},${fy + r2 * 0.5}`}
                  fill={col} opacity={0.85} stroke="white" strokeWidth={s(0.2)} />
                {detail !== "lo" && acres >= 1000 && (
                  <text x={fx} y={fy + r2 + s(5)} textAnchor="middle" fontSize={s(3)} fill={col} fontWeight="600" className="select-none pointer-events-none">
                    {acres >= 10000 ? `${(acres/1000).toFixed(0)}k ac` : `${acres.toLocaleString()} ac`}
                  </text>
                )}
              </g>
            );
          })}

          {/* HAZMAT INCIDENT MARKERS (PHMSA/NRC) */}
          {showSpills && (intel?.hazmatIncidents || []).map((hm: any) => {
            const [hx, hy] = proj(hm.lng, hm.lat);
            const hasCasualties = (hm.fatalities || 0) > 0 || (hm.injuries || 0) > 0;
            const col = hasCasualties ? "#DC2626" : "#7C3AED";
            return (
              <g key={`hm-${hm.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, hm, "hazmat")}
                onMouseLeave={() => setIntelTip(null)}>
                <polygon
                  points={`${hx},${hy - s(3)} ${hx + s(2.5)},${hy} ${hx},${hy + s(3)} ${hx - s(2.5)},${hy}`}
                  fill={col} opacity={0.75} stroke="white" strokeWidth={s(0.2)} />
                {hasCasualties && (
                  <circle cx={hx + s(2.5)} cy={hy - s(2.5)} r={s(1.5)} fill="#DC2626" opacity={0.9} />
                )}
              </g>
            );
          })}

          {/* EPA FACILITY MARKERS (TRI + ECHO) */}
          {showEpa && (intel?.epaFacilities || []).map((ep: any) => {
            const [ex2, ey2] = proj(ep.lng, ep.lat);
            const col = ep.compliance === "Violation" ? "#EF4444" : ep.tri ? "#10B981" : "#6B7280";
            return (
              <g key={`epa-${ep.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, ep, "epa")}
                onMouseLeave={() => setIntelTip(null)}>
                <rect x={ex2 - s(2)} y={ey2 - s(2)} width={s(4)} height={s(4)} rx={s(0.6)}
                  fill={col} opacity={0.65} stroke="white" strokeWidth={s(0.2)} />
                {ep.compliance === "Violation" && detail !== "lo" && (
                  <text x={ex2} y={ey2 + s(0.8)} textAnchor="middle" fontSize={s(2)} fill="white" fontWeight="700" className="select-none pointer-events-none">!</text>
                )}
              </g>
            );
          })}

          {/* LOCK & WATERWAY MARKERS (USACE) */}
          {showLocks && (intel?.locks || []).map((lk: any) => {
            const [lx, ly] = proj(lk.lng, lk.lat);
            const col = lk.status === "Closed" ? "#DC2626" : lk.status === "Restricted" ? "#F59E0B" : "#0EA5E9";
            return (
              <g key={`lk-${lk.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, lk, "lock")}
                onMouseLeave={() => setIntelTip(null)}>
                <circle cx={lx} cy={ly} r={s(3)} fill={col} opacity={0.7} stroke="white" strokeWidth={s(0.3)} />
                <text x={lx} y={ly + s(1)} textAnchor="middle" fontSize={s(2.2)} fill="white" fontWeight="700" className="select-none pointer-events-none">L</text>
                {lk.status !== "Open" && detail !== "lo" && (
                  <text x={lx} y={ly + s(6)} textAnchor="middle" fontSize={s(2.5)} fill={col} fontWeight="600" className="select-none pointer-events-none">
                    {lk.status}
                  </text>
                )}
              </g>
            );
          })}

          {/* EMISSIONS FACILITY MARKERS (CAMPD) */}
          {showEmissions && (intel?.emissions || []).map((em: any) => {
            const [emx, emy] = proj(em.lng, em.lat);
            const co2k = (em.co2 || 0) / 1000;
            const col = co2k > 5000 ? "#DC2626" : co2k > 1000 ? "#F59E0B" : "#6B7280";
            return (
              <g key={`em-${em.id}`} className="cursor-pointer"
                onMouseMove={(e) => showIntelTip(e, em, "emission")}
                onMouseLeave={() => setIntelTip(null)}>
                <circle cx={emx} cy={emy} r={s(Math.max(1.5, Math.min(4, co2k / 2000)))} fill={col} opacity={0.5} />
                <circle cx={emx} cy={emy} r={s(1)} fill={col} opacity={0.8} />
              </g>
            );
          })}

          {/* FEMA DISASTER LABELS (on state centers) */}
          {showFema && detail !== "lo" && (intel?.femaDisasters || []).length > 0 && (() => {
            const byState: Record<string, any[]> = {};
            for (const d of (intel.femaDisasters as any[])) {
              if (!byState[d.state]) byState[d.state] = [];
              byState[d.state].push(d);
            }
            return STATE_CENTERS.filter(sc => byState[sc.id]).map(sc => {
              const disasters = byState[sc.id];
              const [cx2, cy2] = proj(sc.lng, sc.lat);
              return (
                <g key={`fema-lbl-${sc.id}`} className="select-none pointer-events-none">
                  <rect x={cx2 - s(14)} y={cy2 + s(8)} width={s(28)} height={s(8)} rx={s(2)}
                    fill={isLight ? "#FEE2E2" : "#7F1D1D"} opacity={0.9} stroke="#DC2626" strokeWidth={s(0.4)} />
                  <text x={cx2} y={cy2 + s(13.5)} textAnchor="middle" fontSize={s(3.5)} fill="#EF4444" fontWeight="700">
                    FEMA {disasters.length > 1 ? `x${disasters.length}` : disasters[0].type?.slice(0, 12) || ""}
                  </text>
                </g>
              );
            });
          })()}

          {/* WEATHER ALERT COUNT LABELS (on state centers) */}
          {showWeather && detail !== "lo" && (intel?.weatherAlerts || []).length > 0 && (() => {
            const byState: Record<string, { count: number; maxSev: string }> = {};
            for (const wa of (intel.weatherAlerts as any[])) {
              for (const st of (wa.states || [])) {
                if (!byState[st]) byState[st] = { count: 0, maxSev: "Minor" };
                byState[st].count++;
                if (wa.severity === "Extreme") byState[st].maxSev = "Extreme";
                else if (wa.severity === "Severe" && byState[st].maxSev !== "Extreme") byState[st].maxSev = "Severe";
              }
            }
            return STATE_CENTERS.filter(sc => byState[sc.id] && byState[sc.id].count > 0).map(sc => {
              const info = byState[sc.id];
              const [cx2, cy2] = proj(sc.lng, sc.lat);
              const col = info.maxSev === "Extreme" ? "#DC2626" : info.maxSev === "Severe" ? "#F59E0B" : "#3B82F6";
              return (
                <g key={`wx-lbl-${sc.id}`} className="select-none pointer-events-none">
                  <circle cx={cx2 + s(12)} cy={cy2 - s(6)} r={s(4)} fill={col} opacity={0.8} />
                  <text x={cx2 + s(12)} y={cy2 - s(4)} textAnchor="middle" fontSize={s(3)} fill="white" fontWeight="700">
                    {info.count}
                  </text>
                </g>
              );
            });
          })()}

          {/* FUEL PRICE LABELS (on state centers when fuel map active) */}
          {showFuelMap && detail !== "lo" && (intel?.fuelByState || []).length > 0 && (() => {
            const byState: Record<string, any> = {};
            for (const fp of (intel.fuelByState as any[])) byState[fp.state] = fp;
            return STATE_CENTERS.filter(sc => byState[sc.id]).map(sc => {
              const fp = byState[sc.id];
              const [cx2, cy2] = proj(sc.lng, sc.lat);
              const chgCol = fp.change > 0 ? "#EF4444" : fp.change < 0 ? "#22C55E" : (isLight ? "#64748b" : "#94a3b8");
              return (
                <g key={`fp-${sc.id}`} className="select-none pointer-events-none">
                  <text x={cx2} y={cy2 + s(4)} textAnchor="middle" fontSize={s(detail === "hi" ? 5 : 4)} fill={isLight ? "#92400E" : "#FCD34D"} fontWeight="700" opacity={0.85}>
                    ${fp.diesel.toFixed(2)}
                  </text>
                  {detail === "hi" && fp.change !== 0 && (
                    <text x={cx2} y={cy2 + s(9)} textAnchor="middle" fontSize={s(3)} fill={chgCol} fontWeight="600" opacity={0.7}>
                      {fp.change > 0 ? "+" : ""}{fp.change.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            });
          })()}

          {/* Cold zones */}
          {coldZones.map((cz: any) => {
            const [cx, cy] = proj(cz.center?.lng || -95, cz.center?.lat || 38);
            return (
              <g key={cz.id}>
                <circle cx={cx} cy={cy} r={s(18)} fill="url(#gz-cold)" />
                <circle cx={cx} cy={cy} r={s(4)} fill={isLight ? "#93C5FD" : "#3B82F6"} opacity={0.4} />
                {detail !== "lo" && (
                  <text x={cx} y={cy - s(6)} textAnchor="middle" fontSize={s(5)} fill={isLight ? "#3B82F6" : "#60A5FA"} opacity={0.55} className="select-none pointer-events-none">
                    {cz.zoneName?.split(",")[0] || cz.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── HOT ZONES ── */}
          {zones.map((z: any) => {
            const [zx, zy] = proj(z.center?.lng || -95, z.center?.lat || 38);
            const ratio = Number(z.liveRatio) || 2;
            const r = s(Math.max(6, Math.min(14, rv.sizeMetric(z))));
            const isSel = selectedZone === z.zoneId;
            const isHov = hovered === z.zoneId;
            const dCol = z.demandLevel === "CRITICAL" ? rv.critColor : z.demandLevel === "HIGH" ? rv.highColor : rv.elevColor;
            const gId = z.demandLevel === "CRITICAL" ? "gz-crit" : z.demandLevel === "HIGH" ? "gz-high" : "gz-elev";
            return (
              <g
                key={z.zoneId}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (isSel) onSelectZone(null); else zoomToZone(z); }}
                onMouseMove={(e) => showTip(e, z)}
                onMouseLeave={() => { setTip(null); setHovered(null); }}
              >
                {/* Outer glow */}
                <circle cx={zx} cy={zy} r={r * 5} fill={isSel ? "url(#gz-sel)" : `url(#${gId})`} filter={z.demandLevel === "CRITICAL" ? "url(#heatGlow)" : undefined}>
                  {z.demandLevel === "CRITICAL" && <animate attributeName="r" values={`${r*4.5};${r*5.5};${r*4.5}`} dur="3s" repeatCount="indefinite" />}
                  {z.demandLevel === "HIGH" && <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />}
                </circle>
                {/* Secondary heat ring for depth */}
                <circle cx={zx} cy={zy} r={r * 2.5} fill={isSel ? "url(#gz-sel)" : `url(#${gId})`} opacity={0.5} />
                {/* Selection ring */}
                {isSel && (
                  <circle cx={zx} cy={zy} r={r + s(5)} fill="none" stroke="#1473FF" strokeWidth={s(1.2)} opacity={0.7}>
                    <animate attributeName="r" values={`${r+s(4)};${r+s(7)};${r+s(4)}`} dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Hover ring */}
                {isHov && !isSel && (
                  <circle cx={zx} cy={zy} r={r + s(3)} fill="none" stroke={dCol} strokeWidth={s(0.8)} opacity={0.5} />
                )}
                {/* Main dot */}
                <circle cx={zx} cy={zy} r={r} fill={dCol} opacity={isHov || isSel ? 1 : 0.85} stroke={isSel ? "#1473FF" : isHov ? "#fff" : "none"} strokeWidth={isSel ? s(1.5) : s(0.8)} filter={z.demandLevel === "CRITICAL" ? "url(#mapGlow)" : undefined} />
                {/* Primary metric label inside dot — role-adaptive */}
                <text x={zx} y={zy + s(2.2)} textAnchor="middle" fontSize={s(5)} fill="white" fontWeight="700" className="select-none pointer-events-none">
                  {rv.dotLabel(z)}
                </text>
                {/* Zone name above */}
                <text x={zx} y={zy - r - s(3)} textAnchor="middle" fontSize={s(detail === "hi" ? 6 : 5)} fill={isLight ? "#1e293b" : "#e2e8f0"} fontWeight="600" opacity={isSel || isHov ? 1 : 0.7} className="select-none pointer-events-none">
                  {z.zoneName?.split("/")[0]?.split(",")[0]?.trim()}
                </text>
                {/* Demand badge below at high zoom */}
                {detail !== "lo" && (
                  <text x={zx} y={zy + r + s(8)} textAnchor="middle" fontSize={s(4)} fill={dCol} fontWeight="600" opacity={0.8} className="select-none pointer-events-none">
                    {z.demandLevel} {z.liveLoads}L/{z.liveTrucks}T
                  </text>
                )}
                {/* Equipment tags at highest zoom */}
                {detail === "hi" && (z.topEquipment?.length > 0) && (
                  <text x={zx} y={zy + r + s(14)} textAnchor="middle" fontSize={s(3.5)} fill={isLight ? "#64748b" : "#6a6a8a"} opacity={0.6} className="select-none pointer-events-none">
                    {(z.topEquipment || []).slice(0, 3).join(" · ")}
                  </text>
                )}

                {/* ── LAYER OVERLAYS ── */}
                {/* Fuel Prices layer */}
                {activeLayers.includes("fuel_prices") && z.fuelPrice != null && (
                  <g className="select-none pointer-events-none">
                    <rect x={zx + r + s(2)} y={zy - s(8)} width={s(28)} height={s(10)} rx={s(3)} fill={isLight ? "#FEF3C7" : "#78350F"} opacity={0.9} stroke="#A16207" strokeWidth={s(0.4)} />
                    <text x={zx + r + s(16)} y={zy - s(1.5)} textAnchor="middle" fontSize={s(5)} fill={isLight ? "#92400E" : "#FCD34D"} fontWeight="700">
                      F ${Number(z.fuelPrice).toFixed(2)}
                    </text>
                  </g>
                )}
                {/* Weather Risk layer */}
                {activeLayers.includes("weather_risk") && (z.weatherAlerts?.length > 0 || z.weatherRiskLevel === "HIGH") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx - r - s(5)} cy={zy - r - s(2)} r={s(5)} fill={z.weatherRiskLevel === "HIGH" ? "#DC2626" : "#F59E0B"} opacity={0.85} />
                    <text x={zx - r - s(5)} y={zy - r + s(1.5)} textAnchor="middle" fontSize={s(5)} fill="white" fontWeight="700">W</text>
                    {detail !== "lo" && (
                      <text x={zx - r - s(5)} y={zy - r - s(9)} textAnchor="middle" fontSize={s(3.5)} fill={z.weatherRiskLevel === "HIGH" ? "#FCA5A5" : "#FCD34D"} fontWeight="600">
                        {z.weatherAlerts?.length || 0} alert{(z.weatherAlerts?.length || 0) !== 1 ? "s" : ""}
                      </text>
                    )}
                  </g>
                )}
                {/* Catalyst Capacity layer */}
                {activeLayers.includes("catalyst_capacity") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx} cy={zy} r={r + s(6)} fill="none" stroke="#22C55E" strokeWidth={s(0.8)} strokeDasharray={`${s(3)} ${s(2)}`} opacity={0.6} />
                    <rect x={zx + r + s(2)} y={zy + s(2)} width={s(24)} height={s(9)} rx={s(3)} fill={isLight ? "#DCFCE7" : "#14532D"} opacity={0.9} stroke="#22C55E" strokeWidth={s(0.4)} />
                    <text x={zx + r + s(14)} y={zy + s(8.5)} textAnchor="middle" fontSize={s(4.5)} fill={isLight ? "#166534" : "#86EFAC"} fontWeight="700">
                      T {z.liveTrucks || 0}
                    </text>
                  </g>
                )}
                {/* Compliance Risk layer */}
                {activeLayers.includes("compliance_risk") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const score = z.complianceRiskScore ?? Math.round(((z.weatherAlerts?.length || 0) * 20) + ((z.hazmatClasses?.length || 0) * 15) + (ratio > 2.5 ? 20 : 0));
                      const cCol = score > 50 ? "#EF4444" : score > 25 ? "#F59E0B" : "#22C55E";
                      return (
                        <>
                          <rect x={zx - r - s(28)} y={zy + s(2)} width={s(24)} height={s(9)} rx={s(3)} fill={isLight ? "#FFF7ED" : "#431407"} opacity={0.9} stroke={cCol} strokeWidth={s(0.4)} />
                          <text x={zx - r - s(16)} y={zy + s(8.5)} textAnchor="middle" fontSize={s(4.5)} fill={cCol} fontWeight="700">
                            C {score}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
                {/* Rate Intelligence layer — color intensity ring */}
                {activeLayers.includes("rate_heat") && (
                  <circle cx={zx} cy={zy} r={r + s(8)} fill="none" stroke="#F59E0B" strokeWidth={s(Math.min(2, (z.liveRate || 2) / 2))} opacity={0.3} className="pointer-events-none" />
                )}
                {/* Safety Score layer — uses real FMCSA safetyScore when available */}
                {activeLayers.includes("safety_score") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const ss = z.safetyScore != null ? Math.round(z.safetyScore) : Math.max(0, 100 - Math.round(((z.weatherAlerts?.length || 0) * 15) + ((z.hazmatClasses?.length || 0) * 10)));
                      const ssCol = ss > 70 ? "#22D3EE" : ss > 40 ? "#F59E0B" : "#EF4444";
                      return detail !== "lo" ? (
                        <text x={zx + r + s(3)} y={zy - r + s(2)} fontSize={s(4.5)} fill={ssCol} fontWeight="700" className="select-none pointer-events-none">
                          S{ss}
                        </text>
                      ) : null;
                    })()}
                  </g>
                )}
                {/* Incident History layer — PHMSA hazmat incidents + hazmat classes */}
                {activeLayers.includes("incident_history") && ((z.hazmatClasses?.length || 0) > 0 || (z.recentHazmatIncidents || 0) > 0) && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx + r + s(3)} cy={zy + r + s(3)} r={s(4)} fill="#7C3AED" opacity={0.7} />
                    <text x={zx + r + s(3)} y={zy + r + s(5.2)} textAnchor="middle" fontSize={s(4)} fill="white" fontWeight="700">
                      {z.recentHazmatIncidents || z.hazmatClasses?.length || 0}
                    </text>
                  </g>
                )}
                {/* Freight Demand layer — load count badge */}
                {activeLayers.includes("freight_demand") && detail !== "lo" && (
                  <text x={zx} y={zy + r + s(detail === "hi" ? 20 : 14)} textAnchor="middle" fontSize={s(4)} fill="#EF4444" fontWeight="600" opacity={0.7} className="select-none pointer-events-none">
                    {z.liveLoads || 0} loads
                  </text>
                )}
                {/* Wildfire indicator — NIFC active fires */}
                {(z.activeWildfires || 0) > 0 && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx - r - s(6)} cy={zy + r + s(4)} r={s(4.5)} fill="#F97316" opacity={0.85}>
                      <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <text x={zx - r - s(6)} y={zy + r + s(6.2)} textAnchor="middle" fontSize={s(3.5)} fill="white" fontWeight="700">F</text>
                    {detail !== "lo" && (
                      <text x={zx - r - s(6)} y={zy + r + s(12)} textAnchor="middle" fontSize={s(3.5)} fill="#FB923C" fontWeight="600">
                        {z.activeWildfires} fire{z.activeWildfires !== 1 ? "s" : ""}
                      </text>
                    )}
                  </g>
                )}
                {/* FEMA disaster indicator */}
                {z.femaDisasterActive && (
                  <g className="select-none pointer-events-none">
                    <rect x={zx - r - s(30)} y={zy - s(4)} width={s(26)} height={s(9)} rx={s(3)} fill={isLight ? "#FEE2E2" : "#7F1D1D"} opacity={0.9} stroke="#DC2626" strokeWidth={s(0.5)}>
                      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <text x={zx - r - s(17)} y={zy + s(2.5)} textAnchor="middle" fontSize={s(4)} fill="#EF4444" fontWeight="700">
                      FEMA
                    </text>
                  </g>
                )}
                {/* Seismic risk indicator — USGS */}
                {z.seismicRiskLevel && z.seismicRiskLevel !== "Low" && detail !== "lo" && (
                  <text x={zx + r + s(3)} y={zy + r + s(14)} fontSize={s(3.5)} fill={z.seismicRiskLevel === "High" ? "#EF4444" : "#F59E0B"} fontWeight="600" className="select-none pointer-events-none">
                    Seismic: {z.seismicRiskLevel}
                  </text>
                )}
                {/* Spread/Margin Opportunity layer */}
                {activeLayers.includes("spread_opportunity") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const margin = Number(((z.liveRate || 2) * (z.liveRatio || 1) * 0.15).toFixed(2));
                      return detail !== "lo" ? (
                        <text x={zx - r - s(3)} y={zy + r + s(8)} textAnchor="end" fontSize={s(4.5)} fill="#10B981" fontWeight="700">
                          +${margin}/mi
                        </text>
                      ) : null;
                    })()}
                  </g>
                )}
                {/* Fuel Stations layer — density indicator */}
                {activeLayers.includes("fuel_stations") && z.fuelPrice != null && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx - r - s(8)} cy={zy + s(2)} r={s(4.5)} fill="#84CC16" opacity={0.75} />
                    <text x={zx - r - s(8)} y={zy + s(4.2)} textAnchor="middle" fontSize={s(4)} fill="white" fontWeight="700">
                      F
                    </text>
                    {detail !== "lo" && (
                      <text x={zx - r - s(8)} y={zy + s(11)} textAnchor="middle" fontSize={s(3)} fill="#84CC16" fontWeight="600" opacity={0.7}>
                        ${Number(z.fuelPrice).toFixed(2)}
                      </text>
                    )}
                  </g>
                )}
                {/* Terminal Throughput layer — facility volume */}
                {activeLayers.includes("terminal_throughput") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const hasTanker = (z.topEquipment || []).some((e: string) => ["TANKER","HAZMAT"].includes(e));
                      if (!hasTanker && detail === "lo") return null;
                      const vol = hasTanker ? z.liveLoads || 0 : Math.round((z.liveLoads || 0) * 0.3);
                      return (
                        <>
                          <rect x={zx - r - s(30)} y={zy + r + s(2)} width={s(26)} height={s(9)} rx={s(3)} fill={isLight ? "#ECFEFF" : "#083344"} opacity={0.9} stroke="#06B6D4" strokeWidth={s(0.4)} />
                          <text x={zx - r - s(17)} y={zy + r + s(8.5)} textAnchor="middle" fontSize={s(4.5)} fill={isLight ? "#0E7490" : "#22D3EE"} fontWeight="700">
                            V {vol}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
                {/* Escort Corridors layer — oversized demand markers */}
                {activeLayers.includes("escort_corridors") && (z.oversizedFrequency === "VERY_HIGH" || z.oversizedFrequency === "HIGH" || z.oversizedFrequency === "MODERATE") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx} cy={zy} r={r + s(10)} fill="none" stroke="#8B5CF6" strokeWidth={s(z.oversizedFrequency === "VERY_HIGH" ? 1.5 : 0.8)} strokeDasharray={`${s(4)} ${s(2)}`} opacity={0.55}>
                      {z.oversizedFrequency === "VERY_HIGH" && <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />}
                    </circle>
                    {detail !== "lo" && (
                      <text x={zx + r + s(12)} y={zy - r - s(2)} fontSize={s(3.5)} fill="#8B5CF6" fontWeight="700" className="select-none pointer-events-none">
                        {z.oversizedFrequency === "VERY_HIGH" ? "OVS!!" : z.oversizedFrequency === "HIGH" ? "OVS!" : "OVS"}
                      </text>
                    )}
                  </g>
                )}
                {/* Factoring Risk layer — credit risk indicator */}
                {activeLayers.includes("factoring_risk") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const riskLbl = (z.liveRatio || 1) > 2.5 ? "HI" : (z.liveRatio || 1) > 1.5 ? "MD" : "LO";
                      const riskCol = riskLbl === "HI" ? "#F97316" : riskLbl === "MD" ? "#FBBF24" : "#22C55E";
                      return detail !== "lo" ? (
                        <>
                          <circle cx={zx + r + s(10)} cy={zy + r + s(8)} r={s(5)} fill={riskCol} opacity={0.7} />
                          <text x={zx + r + s(10)} y={zy + r + s(10)} textAnchor="middle" fontSize={s(3.5)} fill="white" fontWeight="700">
                            {riskLbl}
                          </text>
                        </>
                      ) : null;
                    })()}
                  </g>
                )}
                {/* Driver HOS layer — availability ring */}
                {activeLayers.includes("driver_hos") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx} cy={zy} r={r + s(4)} fill="none" stroke="#A855F7" strokeWidth={s(1)} opacity={0.45} />
                    {detail !== "lo" && (
                      <text x={zx - r - s(3)} y={zy - r - s(6)} textAnchor="end" fontSize={s(3.5)} fill="#A855F7" fontWeight="600" opacity={0.7}>
                        {z.liveTrucks || 0} avail
                      </text>
                    )}
                  </g>
                )}
                {/* Crowd-Sourced LIDAR — driver mapping intelligence layer */}
                {showLidar && (() => {
                  const cf = typeof z.complianceFactors === "string" ? (() => { try { return JSON.parse(z.complianceFactors); } catch { return {}; } })() : (z.complianceFactors || {});
                  const density = cf.crowdDriverDensity || 0;
                  const avgSpd = cf.crowdAvgSpeed || 0;
                  const lanes = cf.crowdLanesLearned || 0;
                  const reports = cf.crowdRouteReports || 0;
                  const miles = cf.crowdTotalMiles || 0;
                  if (density === 0 && lanes === 0 && reports === 0) return null;
                  const intensity = Math.min(1, density / 200);
                  const lidarR = r + s(6 + intensity * 8);
                  return (
                    <g className="select-none pointer-events-none">
                      <circle cx={zx} cy={zy} r={lidarR} fill="url(#gz-lidar)" opacity={0.3 + intensity * 0.5} filter="url(#lidarGlow)">
                        <animate attributeName="opacity" values={`${0.2 + intensity * 0.3};${0.4 + intensity * 0.5};${0.2 + intensity * 0.3}`} dur="3s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={zx} cy={zy} r={r + s(3)} fill="none" stroke="#BE01FF" strokeWidth={s(0.6 + intensity)} strokeDasharray={`${s(2)} ${s(1.5)}`} opacity={0.6}>
                        <animate attributeName="stroke-dashoffset" values={`0;${s(7)}`} dur="4s" repeatCount="indefinite" />
                      </circle>
                      {detail !== "lo" && (
                        <>
                          <rect x={zx + r + s(14)} y={zy - s(16)} width={s(36)} height={s(32)} rx={s(3)} fill={isLight ? "rgba(10,15,40,0.88)" : "rgba(8,10,30,0.92)"} stroke="#1473FF" strokeWidth={s(0.4)} opacity={0.9} />
                          <text x={zx + r + s(16)} y={zy - s(9)} fontSize={s(3.5)} fill="#1473FF" fontWeight="700" opacity={0.9}>EUSO ROADS</text>
                          <text x={zx + r + s(16)} y={zy - s(4)} fontSize={s(3)} fill="#A855F7" opacity={0.75}>{density} pings</text>
                          <text x={zx + r + s(16)} y={zy + s(1)} fontSize={s(3)} fill="#A855F7" opacity={0.75}>{avgSpd > 0 ? `${avgSpd.toFixed(0)} mph avg` : "No speed"}</text>
                          <text x={zx + r + s(16)} y={zy + s(6)} fontSize={s(3)} fill="#A855F7" opacity={0.75}>{lanes} lanes</text>
                          <text x={zx + r + s(16)} y={zy + s(11)} fontSize={s(3)} fill="#A855F7" opacity={0.75}>{reports} routes</text>
                        </>
                      )}
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </svg>

        {/* ── TOOLTIP ── */}
        <AnimatePresence>
          {tip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`absolute z-50 pointer-events-none rounded-xl border px-3 py-2.5 shadow-2xl ${
                isLight ? "bg-white/95 border-slate-200 shadow-slate-200/50" : "bg-[#12122a]/95 border-white/10 shadow-black/40"
              }`}
              style={{ left: Math.min(tip.px, (cRef.current?.clientWidth || 600) - 220), top: Math.max(8, tip.py - 90), minWidth: 180, backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-2 h-2 rounded-full ${tip.z.demandLevel === "CRITICAL" ? "bg-red-500" : tip.z.demandLevel === "HIGH" ? "bg-orange-500" : "bg-amber-500"}`} />
                <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.zoneName}</span>
              </div>
              <div className={`grid grid-cols-3 gap-x-3 gap-y-1 text-[10px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
                {(tip.z.roleMetrics || []).map((m: any, mi: number) => (
                  <div key={mi}>
                    <span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">{m.label}</span>
                    <span className={`font-bold ${m.color === "red" ? "text-red-400" : m.color === "amber" ? "text-amber-400" : m.color === "green" ? "text-emerald-400" : isLight ? "text-slate-800" : "text-white"}`}>{m.value}</span>
                  </div>
                ))}
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Rate</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>${Number(tip.z.liveRate || 0).toFixed(2)}/mi</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Surge</span><span className={`font-bold ${(tip.z.liveSurge || 1) > 1.2 ? "text-red-400" : isLight ? "text-slate-800" : "text-white"}`}>{Number(tip.z.liveSurge || 1).toFixed(2)}x</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Demand</span><span className={`font-bold ${tip.z.demandLevel === "CRITICAL" ? "text-red-400" : tip.z.demandLevel === "HIGH" ? "text-orange-400" : "text-amber-400"}`}>{tip.z.demandLevel}</span></div>
              </div>
              {/* Layer-specific tooltip rows */}
              {activeLayers.length > 0 && (
                <div className={`mt-1.5 pt-1.5 border-t space-y-0.5 text-[10px] ${isLight ? "border-slate-100" : "border-white/5"}`}>
                  {activeLayers.includes("fuel_prices") && tip.z.fuelPrice != null && (
                    <div className="flex justify-between"><span className="text-amber-500">Fuel</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>${Number(tip.z.fuelPrice).toFixed(2)}/gal</span></div>
                  )}
                  {activeLayers.includes("weather_risk") && (tip.z.weatherAlerts?.length || 0) > 0 && (
                    <div className="flex justify-between"><span className="text-blue-400">Weather</span><span className="font-bold text-amber-400">{tip.z.weatherAlerts.length} alert{tip.z.weatherAlerts.length !== 1 ? "s" : ""}</span></div>
                  )}
                  {activeLayers.includes("catalyst_capacity") && (
                    <div className="flex justify-between"><span className="text-emerald-400">Trucks</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveTrucks || 0} available</span></div>
                  )}
                  {activeLayers.includes("compliance_risk") && (
                    <div className="flex justify-between"><span className="text-orange-400">Compliance</span><span className={`font-bold ${(tip.z.complianceRiskScore || 0) > 50 ? "text-red-400" : "text-emerald-400"}`}>{tip.z.complianceRiskScore ?? "N/A"}</span></div>
                  )}
                  {activeLayers.includes("freight_demand") && (
                    <div className="flex justify-between"><span className="text-red-400">Demand</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveLoads || 0} loads</span></div>
                  )}
                </div>
              )}
              {showLidar && (() => {
                const cf = typeof tip.z.complianceFactors === "string" ? (() => { try { return JSON.parse(tip.z.complianceFactors); } catch { return {}; } })() : (tip.z.complianceFactors || {});
                const d = cf.crowdDriverDensity || 0;
                const sp = cf.crowdAvgSpeed || 0;
                const ln = cf.crowdLanesLearned || 0;
                const rr = cf.crowdRouteReports || 0;
                const ml = cf.crowdTotalMiles || 0;
                if (d === 0 && ln === 0 && rr === 0) return null;
                return (
                  <div className={`mt-1.5 pt-1.5 border-t space-y-0.5 text-[10px] ${isLight ? "border-slate-100" : "border-white/5"}`}>
                    <div className="flex justify-between"><span style={{ color: "#1473FF" }}>Euso Pings</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{d.toLocaleString()}</span></div>
                    {sp > 0 && <div className="flex justify-between"><span style={{ color: "#A855F7" }}>Avg Speed</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{sp.toFixed(0)} mph</span></div>}
                    <div className="flex justify-between"><span style={{ color: "#A855F7" }}>Lanes Learned</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{ln}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#A855F7" }}>Route Reports</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{rr}</span></div>
                    {ml > 0 && <div className="flex justify-between"><span style={{ color: "#A855F7" }}>Miles Mapped</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{ml.toLocaleString()}</span></div>}
                  </div>
                );
              })()}
              {tip.z.peakHours && <div className={`mt-1.5 pt-1 border-t text-[9px] ${isLight ? "border-slate-100 text-slate-400" : "border-white/5 text-white/30"}`}>Peak: {tip.z.peakHours}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INTEL TOOLTIP (live data layers) ── */}
        <AnimatePresence>
          {intelTip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`absolute z-50 pointer-events-none rounded-xl border px-3 py-2.5 shadow-2xl ${
                isLight ? "bg-white/95 border-slate-200 shadow-slate-200/50" : "bg-[#12122a]/95 border-white/10 shadow-black/40"
              }`}
              style={{ left: Math.min(intelTip.px, (cRef.current?.clientWidth || 600) - 220), top: Math.max(8, intelTip.py - 70), minWidth: 170, backdropFilter: "blur(12px)" }}
            >
              {intelTip.type === "earthquake" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>M{intelTip.data.mag?.toFixed(1)} Earthquake</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.place}</div>
                    <div>Depth: {intelTip.data.depth?.toFixed(1)} km</div>
                    {intelTip.data.alert && <div className="font-semibold text-amber-400">Alert: {intelTip.data.alert}</div>}
                  </div>
                </div>
              )}
              {intelTip.type === "wildfire" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{intelTip.data.name}</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.state} · {intelTip.data.status}</div>
                    <div>{(intelTip.data.acres || 0).toLocaleString()} acres · {intelTip.data.contained || 0}% contained</div>
                    {intelTip.data.personnel && <div>{intelTip.data.personnel} personnel</div>}
                    {intelTip.data.evacuation && <div className="font-semibold text-red-400">Evacuations ordered</div>}
                  </div>
                </div>
              )}
              {intelTip.type === "hazmat" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Hazmat Incident</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.city}, {intelTip.data.state} · {intelTip.data.mode}</div>
                    {intelTip.data.name && <div>Material: {intelTip.data.name}</div>}
                    {intelTip.data.class && <div>Class: {intelTip.data.class}</div>}
                    {intelTip.data.qty > 0 && <div>Released: {intelTip.data.qty.toLocaleString()} {intelTip.data.unit}</div>}
                    {(intelTip.data.fatalities > 0 || intelTip.data.injuries > 0) && (
                      <div className="font-semibold text-red-400">{intelTip.data.fatalities} fatal · {intelTip.data.injuries} injured</div>
                    )}
                  </div>
                </div>
              )}
              {intelTip.type === "epa" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${intelTip.data.compliance === "Violation" ? "bg-red-500" : "bg-emerald-500"}`} />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{intelTip.data.name?.slice(0, 30)}</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.state} · {intelTip.data.sector?.slice(0, 25)}</div>
                    <div>Status: <span className={intelTip.data.compliance === "Violation" ? "text-red-400 font-semibold" : "text-emerald-400"}>{intelTip.data.compliance}</span></div>
                    {intelTip.data.releases > 0 && <div>Releases: {intelTip.data.releases.toLocaleString()} lbs</div>}
                    {intelTip.data.penalties > 0 && <div>Penalties: ${intelTip.data.penalties.toLocaleString()}</div>}
                  </div>
                </div>
              )}
              {intelTip.type === "lock" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${intelTip.data.status === "Closed" ? "bg-red-500" : intelTip.data.status === "Restricted" ? "bg-amber-500" : "bg-sky-500"}`} />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{intelTip.data.name}</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.river} · {intelTip.data.state}</div>
                    <div>Status: <span className={intelTip.data.status === "Closed" ? "text-red-400 font-semibold" : ""}>{intelTip.data.status}</span></div>
                    {intelTip.data.reason && <div>{intelTip.data.reason}</div>}
                    {intelTip.data.queueHrs > 0 && <div>Queue: {intelTip.data.queueHrs}h</div>}
                  </div>
                </div>
              )}
              {intelTip.type === "emission" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{intelTip.data.name?.slice(0, 30)}</span>
                  </div>
                  <div className={`text-[10px] space-y-0.5 ${isLight ? "text-slate-500" : "text-white/50"}`}>
                    <div>{intelTip.data.state} · {intelTip.data.category?.slice(0, 25)}</div>
                    {intelTip.data.co2 > 0 && <div>CO2: {(intelTip.data.co2 / 1000).toFixed(0)}k tons</div>}
                    {intelTip.data.nox > 0 && <div>NOx: {intelTip.data.nox.toFixed(0)} tons</div>}
                    {intelTip.data.so2 > 0 && <div>SO2: {intelTip.data.so2.toFixed(0)} tons</div>}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ZOOM CONTROLS ── */}
        <div className={`absolute top-3 right-3 flex flex-col gap-1 ${isLight ? "" : ""}`}>
          {[
            { icon: ZoomIn, action: () => doZoom(1.06), tip: "Zoom in" },
            { icon: ZoomOut, action: () => doZoom(0.94), tip: "Zoom out" },
            { icon: Maximize2, action: resetView, tip: "Reset view" },
          ].map(({ icon: Ic, action, tip: t }) => (
            <button key={t} onClick={action} title={t}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                isLight ? "bg-white/90 hover:bg-white text-slate-600 shadow-sm border border-slate-200/60" : "bg-white/[0.08] hover:bg-white/[0.14] text-white/60 border border-white/[0.06]"
              }`}>
              <Ic className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* ── ZOOM LEVEL ── */}
        <div className={`absolute top-3 right-14 px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums ${
          isLight ? "bg-white/90 text-slate-600 border border-slate-200/60" : "bg-white/[0.08] text-white/50 border border-white/[0.06]"
        }`}>
          {zoomPct}%
        </div>

        {/* ── MAP LAYER TOGGLES — two rows: base layers + intel layers ── */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
          {/* Row 1: Intel data layers */}
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg backdrop-blur-md ${
            isLight ? "bg-white/90 border border-slate-200/60" : "bg-white/[0.06] border border-white/[0.04]"
          }`}>
            {[
              { label: "Quakes", on: showQuakes, toggle: () => setShowQuakes(p => !p), color: "#22D3EE" },
              { label: "Fires", on: showFires, toggle: () => setShowFires(p => !p), color: "#EF4444" },
              { label: "Weather", on: showWeather, toggle: () => setShowWeather(p => !p), color: "#3B82F6" },
              { label: "Spills", on: showSpills, toggle: () => setShowSpills(p => !p), color: "#7C3AED" },
              { label: "EPA", on: showEpa, toggle: () => setShowEpa(p => !p), color: "#10B981" },
              { label: "FEMA", on: showFema, toggle: () => setShowFema(p => !p), color: "#DC2626" },
              { label: "Locks", on: showLocks, toggle: () => setShowLocks(p => !p), color: "#0EA5E9" },
              { label: "CO2", on: showEmissions, toggle: () => setShowEmissions(p => !p), color: "#F59E0B" },
              { label: "Fuel$", on: showFuelMap, toggle: () => setShowFuelMap(p => !p), color: "#D97706" },
            ].map(({ label, on, toggle, color }) => (
              <button key={label} onClick={toggle}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all leading-tight ${
                  on ? "" : isLight ? "text-slate-400 hover:text-slate-600" : "text-white/25 hover:text-white/50"
                }`}
                style={on ? { backgroundColor: color + "22", color, border: `1px solid ${color}55` } : {}}>
                {label}
              </button>
            ))}
          </div>
          {/* Row 2: Base map layers */}
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg backdrop-blur-md ${
            isLight ? "bg-white/90 border border-slate-200/60" : "bg-white/[0.06] border border-white/[0.04]"
          }`}>
            {[
              { label: "Highways", on: showHwy, toggle: () => setShowHwy(p => !p), color: "" },
              { label: "Cities", on: showCities, toggle: () => setShowCities(p => !p), color: "" },
              { label: "Infra", on: showInfra, toggle: () => setShowInfra(p => !p), color: "" },
              { label: "Hazmat", on: showHazmat, toggle: () => setShowHazmat(p => !p), color: "#F97316" },
              { label: "Euso Roads", on: showLidar, toggle: () => setShowLidar(p => !p), color: "#1473FF" },
            ].map(({ label, on, toggle, color }) => (
              <button key={label} onClick={toggle}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all leading-tight ${on
                  ? color ? "" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                  : isLight ? "text-slate-400 hover:text-slate-600" : "text-white/25 hover:text-white/50"
                }`}
                style={on && color ? { backgroundColor: color + "22", color, border: `1px solid ${color}55` } : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ROLE BADGE + SUBTITLE ── */}
        <div className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-lg backdrop-blur-md ${
          isLight ? "bg-white/90 border border-slate-200/60" : "bg-white/[0.08] border border-white/[0.06]"
        }`}>
          <div className={`text-[10px] font-semibold ${isLight ? "text-slate-600" : "text-white/50"}`}>
            {roleCtx?.perspective?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Demand View"}
          </div>
          <div className={`text-[8px] mt-0.5 ${isLight ? "text-slate-400" : "text-white/25"}`}>
            {rv.subtitle}
          </div>
        </div>

        {/* ── LEGEND ── */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md text-[8px] font-medium ${
          isLight ? "bg-white/90 text-slate-500 border border-slate-200/60" : "bg-white/[0.08] text-white/40 border border-white/[0.06]"
        }`}>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: rv.critColor }} />Crit</div>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: rv.highColor }} />High</div>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: rv.elevColor }} />Elev</div>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-50" />Cold</div>
          {showLidar && <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(135deg, #1473FF, #BE01FF)", boxShadow: "0 0 3px #BE01FF" }} />Euso Roads</div>}
        </div>

        {/* ── MINIMAP ── */}
        {zoomPct > 120 && (
          <div className={`absolute bottom-14 left-3 w-24 h-12 rounded-lg border overflow-hidden ${
            isLight ? "bg-white/80 border-slate-200/60" : "bg-[#0a0a14]/80 border-white/[0.08]"
          }`}>
            <svg viewBox="0 0 800 380" className="w-full h-full">
              {STATES.map(st => <path key={st.id} d={st.d} fill={isLight ? "#e0e5eb" : "#1a1a2e"} stroke={isLight ? "#d0d5dd" : "#222238"} strokeWidth="1" />)}
              {zones.map((z: any) => { const [zx,zy] = proj(z.center?.lng||-95, z.center?.lat||38); return <circle key={z.zoneId} cx={zx} cy={zy} r={4} fill={z.demandLevel==="CRITICAL"?rv.critColor:z.demandLevel==="HIGH"?rv.highColor:rv.elevColor} opacity={0.7} />; })}
              <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="none" stroke="#1473FF" strokeWidth="3" rx="2" opacity={0.8} />
            </svg>
          </div>
        )}

        {/* ── INSTRUCTIONS (top-right below zoom controls) ── */}
        <div className={`absolute top-[120px] right-3 text-[8px] text-right ${isLight ? "text-slate-400" : "text-white/15"}`}>
          Scroll to zoom<br/>Drag to pan<br/>Click zone to focus
        </div>
      </div>
    </div>
  );
}
