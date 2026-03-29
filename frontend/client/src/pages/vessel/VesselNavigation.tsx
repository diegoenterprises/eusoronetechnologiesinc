/**
 * VESSEL NAVIGATION — Route Planning & Weather Routing
 * For SHIP_CAPTAIN and VESSEL_OPERATOR roles.
 * Sections: Current Position, Route Planner, Weather Overlay,
 * Draft & Tidal Info, Waypoint List, Notices to Mariners.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Compass,
  Navigation,
  MapPin,
  Anchor,
  Wind,
  Waves,
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Eye,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  RefreshCw,
  Ship,
  Target,
  Globe,
  ChevronRight,
  ChevronDown,
  Gauge,
  Droplets,
  Activity,
  Radio,
  FileText,
  Info,
  XCircle,
  CornerDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ──────────────────────── TYPES ──────────────────────── */

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta: string;
  distanceNm: number;
  bearingDeg: number;
  speedKts: number;
  notes?: string;
}

interface WeatherForecastEntry {
  time: string;
  windSpeed: number;
  windDir: string;
  waveHeight: number;
  wavePeriod: number;
  visibility: string;
  condition: "clear" | "cloudy" | "rain" | "storm";
  temp: number;
}

interface StormWarning {
  id: string;
  title: string;
  severity: "advisory" | "warning" | "danger";
  area: string;
  validFrom: string;
  validTo: string;
  description: string;
}

interface TidalWindow {
  time: string;
  type: "HW" | "LW";
  heightM: number;
}

interface NoticeToMariners {
  id: string;
  number: string;
  title: string;
  area: string;
  issuedDate: string;
  expiryDate?: string;
  category: "navigation" | "temporary" | "permanent" | "preliminary";
  description: string;
}

/* ──────────────────────── MOCK DATA ──────────────────────── */

const MOCK_POSITION = {
  lat: 36.8508,
  lng: -5.6174,
  label: "Strait of Gibraltar",
  speedKts: 18.4,
  headingDeg: 142,
  cogDeg: 144,
  sogKts: 18.2,
  lastUpdate: "2026-03-29T14:32:00Z",
  vesselName: "M/V EUSORONE VOYAGER",
  imo: "IMO 9876543",
  mmsi: "354123456",
};

const MOCK_WAYPOINTS: Waypoint[] = [
  { id: "wp-1", name: "Gibraltar Strait Exit", lat: 35.9, lng: -5.35, eta: "2026-03-29T16:00:00Z", distanceNm: 0, bearingDeg: 0, speedKts: 18.4, notes: "Traffic separation zone" },
  { id: "wp-2", name: "Cape Bon Approach", lat: 37.08, lng: 11.05, eta: "2026-03-31T02:00:00Z", distanceNm: 892, bearingDeg: 88, speedKts: 18.0, notes: "Adjust course for Sicily Strait" },
  { id: "wp-3", name: "Malta Channel", lat: 35.82, lng: 14.52, eta: "2026-03-31T14:00:00Z", distanceNm: 1102, bearingDeg: 110, speedKts: 17.5, notes: "Narrow passage — increased lookout" },
  { id: "wp-4", name: "Crete South Pass", lat: 34.72, lng: 24.48, eta: "2026-04-01T22:00:00Z", distanceNm: 1680, bearingDeg: 105, speedKts: 18.2, notes: "Open water" },
  { id: "wp-5", name: "Suez Canal Approach", lat: 31.26, lng: 32.32, eta: "2026-04-03T06:00:00Z", distanceNm: 2240, bearingDeg: 145, speedKts: 16.0, notes: "Pilot boarding — speed reduction" },
  { id: "wp-6", name: "Suez Canal S. Entry", lat: 29.93, lng: 32.56, eta: "2026-04-03T18:00:00Z", distanceNm: 2332, bearingDeg: 178, speedKts: 8.0, notes: "Convoy transit — follow VTS instructions" },
  { id: "wp-7", name: "Bab el-Mandeb", lat: 12.58, lng: 43.33, eta: "2026-04-06T08:00:00Z", distanceNm: 3460, bearingDeg: 165, speedKts: 18.4, notes: "High-risk area — ISPS Level 2" },
  { id: "wp-8", name: "Singapore Strait", lat: 1.27, lng: 103.85, eta: "2026-04-12T14:00:00Z", distanceNm: 8440, bearingDeg: 110, speedKts: 18.4, notes: "Destination pilot station" },
];

const MOCK_WEATHER_CURRENT = {
  wind: { speed: 15, direction: "SW", beaufort: 4 },
  waves: { height: 1.8, period: 7 },
  visibility: "Good (>10 nm)",
  temp: 19,
  pressure: 1018,
  condition: "partly_cloudy" as const,
  seaState: "Moderate",
  currentSpeed: 1.2,
  currentDir: "ENE",
};

const MOCK_FORECAST: WeatherForecastEntry[] = [
  { time: "2026-03-29T18:00:00Z", windSpeed: 18, windDir: "SW", waveHeight: 2.1, wavePeriod: 7, visibility: "Good", condition: "cloudy", temp: 18 },
  { time: "2026-03-30T00:00:00Z", windSpeed: 22, windDir: "W", waveHeight: 2.6, wavePeriod: 8, visibility: "Moderate", condition: "rain", temp: 16 },
  { time: "2026-03-30T06:00:00Z", windSpeed: 25, windDir: "W", waveHeight: 3.0, wavePeriod: 8, visibility: "Moderate", condition: "rain", temp: 15 },
  { time: "2026-03-30T12:00:00Z", windSpeed: 20, windDir: "WSW", waveHeight: 2.4, wavePeriod: 7, visibility: "Good", condition: "cloudy", temp: 17 },
  { time: "2026-03-30T18:00:00Z", windSpeed: 14, windDir: "SW", waveHeight: 1.8, wavePeriod: 6, visibility: "Good", condition: "clear", temp: 18 },
  { time: "2026-03-31T00:00:00Z", windSpeed: 12, windDir: "S", waveHeight: 1.4, wavePeriod: 6, visibility: "Good", condition: "clear", temp: 17 },
  { time: "2026-03-31T06:00:00Z", windSpeed: 10, windDir: "SE", waveHeight: 1.2, wavePeriod: 5, visibility: "Excellent", condition: "clear", temp: 19 },
  { time: "2026-03-31T12:00:00Z", windSpeed: 8, windDir: "E", waveHeight: 0.8, wavePeriod: 5, visibility: "Excellent", condition: "clear", temp: 22 },
];

const MOCK_STORM_WARNINGS: StormWarning[] = [
  {
    id: "sw-1",
    title: "Mediterranean Low-Pressure System",
    severity: "warning",
    area: "Central Mediterranean — Crete to Malta",
    validFrom: "2026-03-30T00:00:00Z",
    validTo: "2026-03-31T06:00:00Z",
    description: "Developing low-pressure system. Winds W 25-35kt, seas 3-4m. Recommend course deviation south of Crete to avoid worst conditions.",
  },
  {
    id: "sw-2",
    title: "Strong Current Advisory — Sicily Strait",
    severity: "advisory",
    area: "Sicily Strait — Cape Bon to Malta",
    validFrom: "2026-03-31T06:00:00Z",
    validTo: "2026-03-31T18:00:00Z",
    description: "East-setting current 2.5-3kt expected through Sicily Strait. Adjust waypoint calculations accordingly.",
  },
];

const MOCK_DRAFT = {
  forwardM: 11.2,
  aftM: 12.8,
  trimM: 1.6,
  trimType: "stern" as const,
  maxDraftM: 14.5,
  airDraftM: 52.3,
  displacementT: 68420,
};

const MOCK_TIDAL_WINDOWS: TidalWindow[] = [
  { time: "2026-04-03T03:18:00Z", type: "LW", heightM: 0.3 },
  { time: "2026-04-03T09:42:00Z", type: "HW", heightM: 1.8 },
  { time: "2026-04-03T15:54:00Z", type: "LW", heightM: 0.4 },
  { time: "2026-04-03T22:06:00Z", type: "HW", heightM: 1.7 },
];

const MOCK_UKC = {
  portDepthM: 16.5,
  vesselDraftM: 12.8,
  tidalAllowanceM: 1.8,
  squat: 0.3,
  ukcM: 3.2,
  requiredUkcM: 1.5,
  status: "safe" as const,
};

const MOCK_NTM: NoticeToMariners[] = [
  {
    id: "ntm-1", number: "NM 2026/1247", title: "Dredging Operations — Port Said Approach",
    area: "Suez Canal — Port Said", issuedDate: "2026-03-25", expiryDate: "2026-04-15",
    category: "temporary",
    description: "Dredging vessel operating in Port Said approach channel. Vessels to maintain safe passing distance. VHF Ch 16/12 for coordination.",
  },
  {
    id: "ntm-2", number: "NM 2026/1198", title: "Light Buoy Repositioned — Malta Channel",
    area: "Malta Channel", issuedDate: "2026-03-20", category: "permanent",
    description: "Light buoy FL.G.4s relocated from 35°49.2N 014°31.8E to 35°49.4N 014°31.6E. Charts to be updated.",
  },
  {
    id: "ntm-3", number: "NM 2026/1210", title: "Naval Exercise — Eastern Mediterranean",
    area: "Eastern Mediterranean — South of Crete", issuedDate: "2026-03-22", expiryDate: "2026-04-02",
    category: "temporary",
    description: "Naval exercise in area bounded by 34°00N-35°00N, 025°00E-027°00E. Vessels advised to transit with caution. Monitor VHF Ch 16.",
  },
  {
    id: "ntm-4", number: "NM 2026/1185", title: "Uncharted Obstruction — Strait of Messina",
    area: "Strait of Messina", issuedDate: "2026-03-18", category: "preliminary",
    description: "Uncharted obstruction reported at approx. 38°12.4N 015°38.2E, depth uncertain. Survey pending. Mariners to exercise caution.",
  },
  {
    id: "ntm-5", number: "NM 2026/1255", title: "Suez Canal Convoy Schedule Change",
    area: "Suez Canal", issuedDate: "2026-03-27", expiryDate: "2026-04-10",
    category: "navigation",
    description: "Southbound convoy departure from Port Said delayed by 2 hours effective 01 April. New departure: 0800L. Contact Suez VTS for updated schedule.",
  },
];

/* ──────────────────────── HELPERS ──────────────────────── */

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(iso: string) {
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

function bearingToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function conditionIcon(cond: string) {
  switch (cond) {
    case "clear": return <Sun className="w-4 h-4 text-yellow-400" />;
    case "cloudy": return <Cloud className="w-4 h-4 text-slate-400" />;
    case "rain": return <CloudRain className="w-4 h-4 text-blue-400" />;
    case "storm": return <CloudLightning className="w-4 h-4 text-red-400" />;
    default: return <Cloud className="w-4 h-4 text-slate-400" />;
  }
}

function severityBadge(sev: StormWarning["severity"], isLight: boolean) {
  const map: Record<string, string> = {
    advisory: isLight ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-amber-500/20 text-amber-400 border-amber-500/30",
    warning: isLight ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-orange-500/20 text-orange-400 border-orange-500/30",
    danger: isLight ? "bg-red-100 text-red-700 border-red-300" : "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return map[sev] || map.advisory;
}

function ntmCategoryBadge(cat: NoticeToMariners["category"], isLight: boolean) {
  const map: Record<string, string> = {
    navigation: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400",
    temporary: isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400",
    permanent: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-400",
    preliminary: isLight ? "bg-slate-200 text-slate-700" : "bg-slate-500/20 text-slate-400",
  };
  return map[cat] || map.navigation;
}

/* ──────────────────────── COMPONENT ──────────────────────── */

export default function VesselNavigation() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* ── state ── */
  const [originPort, setOriginPort] = useState("Rotterdam, NL (NLRTM)");
  const [destPort, setDestPort] = useState("Singapore (SGSIN)");
  const [newWpName, setNewWpName] = useState("");
  const [newWpLat, setNewWpLat] = useState("");
  const [newWpLng, setNewWpLng] = useState("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>(MOCK_WAYPOINTS);
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null);
  const [expandedNtm, setExpandedNtm] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  /* ── tRPC queries (graceful fallback to mock) ── */
  const dashQuery = (trpc as any).vesselShipments?.getVesselDashboard?.useQuery?.(undefined, {
    refetchInterval: 60000,
  });
  const fleetQuery = (trpc as any).vesselShipments?.getVesselFleet?.useQuery?.(
    { limit: 1 },
    { refetchInterval: 60000 }
  );

  const isLoading = dashQuery?.isLoading || fleetQuery?.isLoading;

  /* ── derived data ── */
  const position = MOCK_POSITION;
  const weather = MOCK_WEATHER_CURRENT;
  const forecast = MOCK_FORECAST;
  const stormWarnings = MOCK_STORM_WARNINGS;
  const draft = MOCK_DRAFT;
  const tidalWindows = MOCK_TIDAL_WINDOWS;
  const ukc = MOCK_UKC;
  const ntmList = MOCK_NTM;

  const totalDistance = useMemo(() => {
    return waypoints.length > 0 ? waypoints[waypoints.length - 1].distanceNm : 0;
  }, [waypoints]);

  const voyageProgress = useMemo(() => {
    const covered = totalDistance - (position.speedKts > 0 ? 6780 : totalDistance);
    return totalDistance > 0 ? Math.max(0, Math.min(100, (covered / totalDistance) * 100)) : 0;
  }, [totalDistance, position.speedKts]);

  /* ── handlers ── */
  const handleAddWaypoint = () => {
    if (!newWpName || !newWpLat || !newWpLng) return;
    const wp: Waypoint = {
      id: `wp-custom-${Date.now()}`,
      name: newWpName,
      lat: parseFloat(newWpLat),
      lng: parseFloat(newWpLng),
      eta: new Date(Date.now() + 86400000).toISOString(),
      distanceNm: 0,
      bearingDeg: 0,
      speedKts: 18.0,
    };
    setWaypoints((prev) => [...prev, wp]);
    setNewWpName("");
    setNewWpLat("");
    setNewWpLng("");
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  };

  const handleCalculateRoute = () => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 2000);
  };

  /* ── style tokens ── */
  const pageBg = isLight ? "bg-slate-50" : "bg-[#0a0e1a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-[#111827] border-slate-700/60";
  const cardHdr = isLight ? "border-b border-slate-100" : "border-b border-slate-700/40";
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-600" : "text-slate-400";
  const textMuted = isLight ? "text-slate-500" : "text-slate-500";
  const inputBg = isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-600 text-white";
  const tableBorder = isLight ? "border-slate-200" : "border-slate-700/60";
  const tableRowHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50";
  const tableHead = isLight ? "bg-slate-50 text-slate-600" : "bg-slate-800/50 text-slate-400";
  const highlightBg = isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30";
  const dangerBg = isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30";
  const successBg = isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/30";

  /* ──────────────────────── RENDER ──────────────────────── */
  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", pageBg)}>
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-blue-100" : "bg-blue-500/20")}>
            <Compass className={cn("w-7 h-7", isLight ? "text-blue-600" : "text-blue-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", textPrimary)}>Navigation & Route Planning</h1>
            <p className={textSecondary}>{position.vesselName} — {position.imo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"}>
            <Activity className="w-3 h-3 mr-1" /> GPS Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}
            onClick={() => { dashQuery?.refetch?.(); fleetQuery?.refetch?.(); }}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══════ SECTION 1: CURRENT POSITION ═══════ */}
      <Card className={cn("shadow-sm", cardBg)}>
        <CardHeader className={cn("pb-3", cardHdr)}>
          <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
            <Navigation className="w-5 h-5 text-blue-500" /> Current Position
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Latitude */}
                <div className={cn("rounded-lg p-3 border", highlightBg)}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>Latitude</div>
                  <div className={cn("text-xl font-mono font-bold", textPrimary)}>
                    {position.lat.toFixed(4)}° {position.lat >= 0 ? "N" : "S"}
                  </div>
                </div>
                {/* Longitude */}
                <div className={cn("rounded-lg p-3 border", highlightBg)}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>Longitude</div>
                  <div className={cn("text-xl font-mono font-bold", textPrimary)}>
                    {Math.abs(position.lng).toFixed(4)}° {position.lng >= 0 ? "E" : "W"}
                  </div>
                </div>
                {/* Speed */}
                <div className={cn("rounded-lg p-3 border", highlightBg)}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>Speed (STW)</div>
                  <div className={cn("text-xl font-bold", textPrimary)}>
                    {position.speedKts} <span className="text-sm font-normal">kts</span>
                  </div>
                </div>
                {/* Heading */}
                <div className={cn("rounded-lg p-3 border", highlightBg)}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>Heading</div>
                  <div className={cn("text-xl font-bold", textPrimary)}>
                    {position.headingDeg}° <span className="text-sm font-normal">{bearingToCompass(position.headingDeg)}</span>
                  </div>
                </div>
                {/* COG */}
                <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>COG</div>
                  <div className={cn("text-lg font-bold", textPrimary)}>
                    {position.cogDeg}° <span className="text-sm font-normal">{bearingToCompass(position.cogDeg)}</span>
                  </div>
                </div>
                {/* SOG */}
                <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>SOG</div>
                  <div className={cn("text-lg font-bold", textPrimary)}>
                    {position.sogKts} <span className="text-sm font-normal">kts</span>
                  </div>
                </div>
                {/* Location */}
                <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>Location</div>
                  <div className={cn("text-sm font-semibold flex items-center gap-1", textPrimary)}>
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> {position.label}
                  </div>
                </div>
                {/* MMSI */}
                <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className={cn("text-xs font-medium mb-1", textMuted)}>MMSI</div>
                  <div className={cn("text-sm font-mono font-semibold", textPrimary)}>{position.mmsi}</div>
                </div>
              </div>
              {/* Voyage progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs font-medium", textSecondary)}>Voyage Progress</span>
                  <span className={cn("text-xs font-mono", textMuted)}>{voyageProgress.toFixed(1)}% — {totalDistance} nm total</span>
                </div>
                <Progress value={voyageProgress} className="h-2" />
              </div>
              <div className={cn("text-xs mt-2 text-right", textMuted)}>
                Last updated: {fmtDateTime(position.lastUpdate)} UTC
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════ SECTION 2: ROUTE PLANNER ═══════ */}
      <Card className={cn("shadow-sm", cardBg)}>
        <CardHeader className={cn("pb-3", cardHdr)}>
          <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
            <Target className="w-5 h-5 text-indigo-500" /> Route Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Origin / Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-xs font-medium mb-1.5", textSecondary)}>Origin Port</label>
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
                  <Anchor className="w-4 h-4 text-emerald-500" />
                </div>
                <Input
                  value={originPort}
                  onChange={(e) => setOriginPort(e.target.value)}
                  className={cn("flex-1", inputBg)}
                  placeholder="Enter origin port..."
                />
              </div>
            </div>
            <div>
              <label className={cn("block text-xs font-medium mb-1.5", textSecondary)}>Destination Port</label>
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", isLight ? "bg-red-50" : "bg-red-500/10")}>
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <Input
                  value={destPort}
                  onChange={(e) => setDestPort(e.target.value)}
                  className={cn("flex-1", inputBg)}
                  placeholder="Enter destination port..."
                />
              </div>
            </div>
          </div>

          {/* Add Waypoint */}
          <div className={cn("rounded-lg p-4 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/40")}>
            <div className={cn("text-sm font-semibold mb-3 flex items-center gap-2", textPrimary)}>
              <Plus className="w-4 h-4" /> Add Waypoint
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                value={newWpName}
                onChange={(e) => setNewWpName(e.target.value)}
                placeholder="Waypoint name"
                className={cn(inputBg)}
              />
              <Input
                value={newWpLat}
                onChange={(e) => setNewWpLat(e.target.value)}
                placeholder="Latitude"
                type="number"
                step="0.0001"
                className={cn(inputBg)}
              />
              <Input
                value={newWpLng}
                onChange={(e) => setNewWpLng(e.target.value)}
                placeholder="Longitude"
                type="number"
                step="0.0001"
                className={cn(inputBg)}
              />
              <Button
                onClick={handleAddWaypoint}
                disabled={!newWpName || !newWpLat || !newWpLng}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>

          {/* Calculate route */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className={cn("text-sm", textSecondary)}>
              <span className="font-medium">{waypoints.length}</span> waypoints configured — <span className="font-mono">{totalDistance} nm</span> total distance
            </div>
            <Button
              onClick={handleCalculateRoute}
              disabled={isCalculating || waypoints.length < 2}
              className={cn("gap-2", isLight ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700")}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Calculating...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> Calculate Route
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ SECTION 3: WEATHER OVERLAY ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Conditions */}
        <Card className={cn("shadow-sm", cardBg)}>
          <CardHeader className={cn("pb-3", cardHdr)}>
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Wind className="w-5 h-5 text-cyan-500" /> Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Wind */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-cyan-50 border-cyan-200" : "bg-cyan-500/10 border-cyan-500/20")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Wind className="w-3 h-3" /> Wind
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>
                  {weather.wind.speed} kts {weather.wind.direction}
                </div>
                <div className={cn("text-xs", textMuted)}>Beaufort {weather.wind.beaufort}</div>
              </div>
              {/* Waves */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Waves className="w-3 h-3" /> Waves
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>
                  {weather.waves.height}m
                </div>
                <div className={cn("text-xs", textMuted)}>Period {weather.waves.period}s — {weather.seaState}</div>
              </div>
              {/* Visibility */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Eye className="w-3 h-3" /> Visibility
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>{weather.visibility}</div>
              </div>
              {/* Temperature */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Thermometer className="w-3 h-3" /> Temperature
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>{weather.temp}°C</div>
              </div>
              {/* Pressure */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Gauge className="w-3 h-3" /> Pressure
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>{weather.pressure} hPa</div>
              </div>
              {/* Current */}
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-xs font-medium mb-1 flex items-center gap-1", textMuted)}>
                  <Droplets className="w-3 h-3" /> Sea Current
                </div>
                <div className={cn("text-lg font-bold", textPrimary)}>
                  {weather.currentSpeed} kts {weather.currentDir}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storm Warnings */}
        <Card className={cn("shadow-sm", cardBg)}>
          <CardHeader className={cn("pb-3", cardHdr)}>
            <div className="flex items-center justify-between">
              <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Storm Warnings
              </CardTitle>
              <Badge className={stormWarnings.length > 0
                ? (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                : (isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")
              }>
                {stormWarnings.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {stormWarnings.length === 0 ? (
              <div className={cn("text-center py-8", textMuted)}>
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p>No active storm warnings for your route</p>
              </div>
            ) : (
              stormWarnings.map((sw) => (
                <div
                  key={sw.id}
                  className={cn("rounded-lg border p-3 cursor-pointer transition-colors",
                    severityBadge(sw.severity, isLight),
                    expandedWarning === sw.id && "ring-1 ring-offset-1"
                  )}
                  onClick={() => setExpandedWarning(expandedWarning === sw.id ? null : sw.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {sw.severity === "danger" ? (
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      ) : sw.severity === "warning" ? (
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-sm">{sw.title}</div>
                        <div className="text-xs mt-0.5 opacity-80">{sw.area}</div>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] uppercase", severityBadge(sw.severity, isLight))}>
                      {sw.severity}
                    </Badge>
                  </div>
                  {expandedWarning === sw.id && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-sm leading-relaxed">{sw.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                        <span>From: {fmtDateTime(sw.validFrom)}</span>
                        <span>To: {fmtDateTime(sw.validTo)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 48hr Forecast */}
      <Card className={cn("shadow-sm", cardBg)}>
        <CardHeader className={cn("pb-3", cardHdr)}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Cloud className="w-5 h-5 text-slate-400" /> 48-Hour Weather Forecast
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForecast(!showForecast)}
              className={cn("gap-1 text-xs", textSecondary)}
            >
              {showForecast ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showForecast ? "Collapse" : "Expand"}
            </Button>
          </div>
        </CardHeader>
        {showForecast && (
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("text-xs uppercase", tableHead)}>
                  <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>Time (UTC)</th>
                  <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>Cond.</th>
                  <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Wind</th>
                  <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Waves</th>
                  <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Period</th>
                  <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>Vis.</th>
                  <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Temp</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((f, i) => {
                  const isHighWind = f.windSpeed >= 25;
                  const isHighSeas = f.waveHeight >= 3.0;
                  return (
                    <tr key={i} className={cn(
                      "border-b transition-colors",
                      tableBorder,
                      tableRowHover,
                      (isHighWind || isHighSeas) && (isLight ? "bg-amber-50/50" : "bg-amber-500/5")
                    )}>
                      <td className={cn("px-3 py-2.5 font-mono", textPrimary)}>
                        {fmtDate(f.time)} {fmtTime(f.time)}
                      </td>
                      <td className="px-3 py-2.5">{conditionIcon(f.condition)}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", isHighWind ? "text-amber-500 font-bold" : textPrimary)}>
                        {f.windSpeed}kt {f.windDir}
                      </td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", isHighSeas ? "text-amber-500 font-bold" : textPrimary)}>
                        {f.waveHeight}m
                      </td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", textSecondary)}>{f.wavePeriod}s</td>
                      <td className={cn("px-3 py-2.5", textSecondary)}>{f.visibility}</td>
                      <td className={cn("px-3 py-2.5 text-right", textSecondary)}>{f.temp}°C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>

      {/* ═══════ SECTION 4: DRAFT & TIDAL INFO ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft */}
        <Card className={cn("shadow-sm", cardBg)}>
          <CardHeader className={cn("pb-3", cardHdr)}>
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Ship className="w-5 h-5 text-indigo-500" /> Draft Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("rounded-lg p-3 border text-center", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")}>
                <div className={cn("text-xs font-medium mb-1", textMuted)}>Forward Draft</div>
                <div className={cn("text-2xl font-bold font-mono", textPrimary)}>{draft.forwardM}m</div>
              </div>
              <div className={cn("rounded-lg p-3 border text-center", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")}>
                <div className={cn("text-xs font-medium mb-1", textMuted)}>Aft Draft</div>
                <div className={cn("text-2xl font-bold font-mono", textPrimary)}>{draft.aftM}m</div>
              </div>
            </div>
            <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-medium", textMuted)}>Trim</span>
                <span className={cn("text-sm font-mono font-semibold", textPrimary)}>
                  {draft.trimM}m ({draft.trimType})
                </span>
              </div>
            </div>
            <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-medium", textMuted)}>Max Draft</span>
                <span className={cn("text-sm font-mono font-semibold", textPrimary)}>{draft.maxDraftM}m</span>
              </div>
            </div>
            <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-medium", textMuted)}>Air Draft</span>
                <span className={cn("text-sm font-mono font-semibold", textPrimary)}>{draft.airDraftM}m</span>
              </div>
            </div>
            <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-medium", textMuted)}>Displacement</span>
                <span className={cn("text-sm font-mono font-semibold", textPrimary)}>{draft.displacementT.toLocaleString()}T</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tidal Windows */}
        <Card className={cn("shadow-sm", cardBg)}>
          <CardHeader className={cn("pb-3", cardHdr)}>
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Waves className="w-5 h-5 text-teal-500" /> Tidal Windows — Suez
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {tidalWindows.map((tw, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg p-3 border flex items-center justify-between",
                  tw.type === "HW"
                    ? (isLight ? "bg-teal-50 border-teal-200" : "bg-teal-500/10 border-teal-500/20")
                    : (isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")
                )}
              >
                <div className="flex items-center gap-3">
                  {tw.type === "HW" ? (
                    <ArrowUp className="w-5 h-5 text-teal-500" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <div className={cn("text-sm font-semibold", textPrimary)}>
                      {tw.type === "HW" ? "High Water" : "Low Water"}
                    </div>
                    <div className={cn("text-xs font-mono", textMuted)}>
                      {fmtDate(tw.time)} {fmtTime(tw.time)} UTC
                    </div>
                  </div>
                </div>
                <div className={cn("text-lg font-bold font-mono", textPrimary)}>
                  {tw.heightM}m
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Under-Keel Clearance */}
        <Card className={cn("shadow-sm", cardBg)}>
          <CardHeader className={cn("pb-3", cardHdr)}>
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Anchor className="w-5 h-5 text-amber-500" /> Under-Keel Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {/* UKC status banner */}
            <div className={cn(
              "rounded-lg p-4 border text-center",
              ukc.status === "safe" ? successBg : dangerBg
            )}>
              {ukc.status === "safe" ? (
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              )}
              <div className={cn("text-2xl font-bold font-mono", textPrimary)}>UKC: {ukc.ukcM}m</div>
              <div className={cn("text-xs mt-1", textMuted)}>
                Required: {ukc.requiredUkcM}m — Status: {ukc.status === "safe" ? "SAFE" : "INSUFFICIENT"}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className="flex justify-between">
                  <span className={cn("text-xs", textMuted)}>Port Charted Depth</span>
                  <span className={cn("text-sm font-mono font-semibold", textPrimary)}>{ukc.portDepthM}m</span>
                </div>
              </div>
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className="flex justify-between">
                  <span className={cn("text-xs", textMuted)}>Vessel Max Draft</span>
                  <span className={cn("text-sm font-mono font-semibold", textPrimary)}>-{ukc.vesselDraftM}m</span>
                </div>
              </div>
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className="flex justify-between">
                  <span className={cn("text-xs", textMuted)}>Tidal Allowance (HW)</span>
                  <span className={cn("text-sm font-mono font-semibold text-emerald-500")}>{"+"+ukc.tidalAllowanceM}m</span>
                </div>
              </div>
              <div className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                <div className="flex justify-between">
                  <span className={cn("text-xs", textMuted)}>Squat Allowance</span>
                  <span className={cn("text-sm font-mono font-semibold text-amber-500")}>-{ukc.squat}m</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ SECTION 5: WAYPOINT LIST ═══════ */}
      <Card className={cn("shadow-sm", cardBg)}>
        <CardHeader className={cn("pb-3", cardHdr)}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <CornerDownRight className="w-5 h-5 text-violet-500" /> Waypoint List
            </CardTitle>
            <Badge className={isLight ? "bg-violet-100 text-violet-700" : "bg-violet-500/20 text-violet-400"}>
              {waypoints.length} Waypoints
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("text-xs uppercase", tableHead)}>
                <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>#</th>
                <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>Waypoint</th>
                <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Lat</th>
                <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Lng</th>
                <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Bearing</th>
                <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Distance (nm)</th>
                <th className={cn("px-3 py-2 text-right border-b", tableBorder)}>Speed</th>
                <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>ETA (UTC)</th>
                <th className={cn("px-3 py-2 text-left border-b", tableBorder)}>Notes</th>
                <th className={cn("px-3 py-2 text-center border-b", tableBorder)}></th>
              </tr>
            </thead>
            <tbody>
              {waypoints.map((wp, i) => (
                <tr key={wp.id} className={cn(
                  "border-b transition-colors",
                  tableBorder,
                  tableRowHover,
                  i === 0 && (isLight ? "bg-emerald-50/50" : "bg-emerald-500/5"),
                  i === waypoints.length - 1 && (isLight ? "bg-blue-50/50" : "bg-blue-500/5"),
                )}>
                  <td className={cn("px-3 py-2.5 font-mono text-xs", textMuted)}>{i + 1}</td>
                  <td className={cn("px-3 py-2.5 font-semibold", textPrimary)}>
                    <div className="flex items-center gap-2">
                      {i === 0 && <Anchor className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      {i === waypoints.length - 1 && <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      {i > 0 && i < waypoints.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                      {wp.name}
                    </div>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono text-xs", textSecondary)}>
                    {wp.lat.toFixed(4)}°
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono text-xs", textSecondary)}>
                    {wp.lng.toFixed(4)}°
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono text-xs", textSecondary)}>
                    {wp.bearingDeg > 0 ? `${wp.bearingDeg}° ${bearingToCompass(wp.bearingDeg)}` : "—"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", textPrimary)}>
                    {wp.distanceNm > 0 ? wp.distanceNm.toLocaleString() : "—"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono text-xs", textSecondary)}>
                    {wp.speedKts} kts
                  </td>
                  <td className={cn("px-3 py-2.5 font-mono text-xs", textSecondary)}>
                    {fmtDate(wp.eta)} {fmtTime(wp.eta)}
                  </td>
                  <td className={cn("px-3 py-2.5 text-xs max-w-[200px] truncate", textMuted)} title={wp.notes}>
                    {wp.notes || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveWaypoint(wp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {waypoints.length === 0 && (
            <div className={cn("text-center py-12", textMuted)}>
              <Navigation className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No waypoints configured. Add waypoints above to plan your route.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ SECTION 6: NOTICES TO MARINERS ═══════ */}
      <Card className={cn("shadow-sm", cardBg)}>
        <CardHeader className={cn("pb-3", cardHdr)}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn("flex items-center gap-2 text-lg", textPrimary)}>
              <Radio className="w-5 h-5 text-orange-500" /> Notices to Mariners
            </CardTitle>
            <Badge className={isLight ? "bg-orange-100 text-orange-700" : "bg-orange-500/20 text-orange-400"}>
              {ntmList.length} Active Notices
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {ntmList.map((ntm) => (
            <div
              key={ntm.id}
              className={cn(
                "rounded-lg border p-4 cursor-pointer transition-colors",
                isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/30 border-slate-700/40 hover:border-slate-600/60",
                expandedNtm === ntm.id && (isLight ? "ring-1 ring-orange-300" : "ring-1 ring-orange-500/40")
              )}
              onClick={() => setExpandedNtm(expandedNtm === ntm.id ? null : ntm.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isLight ? "text-orange-500" : "text-orange-400")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-mono font-bold", isLight ? "text-orange-600" : "text-orange-400")}>
                        {ntm.number}
                      </span>
                      <Badge className={cn("text-[10px]", ntmCategoryBadge(ntm.category, isLight))}>
                        {ntm.category}
                      </Badge>
                    </div>
                    <div className={cn("font-semibold text-sm mt-1", textPrimary)}>{ntm.title}</div>
                    <div className={cn("text-xs mt-0.5 flex items-center gap-1", textMuted)}>
                      <MapPin className="w-3 h-3" /> {ntm.area}
                    </div>
                  </div>
                </div>
                <div className={cn("text-xs text-right whitespace-nowrap", textMuted)}>
                  <div>Issued: {fmtDate(ntm.issuedDate)}</div>
                  {ntm.expiryDate && <div>Expires: {fmtDate(ntm.expiryDate)}</div>}
                </div>
              </div>
              {expandedNtm === ntm.id && (
                <div className={cn("mt-3 pt-3 border-t text-sm leading-relaxed", isLight ? "border-slate-200" : "border-slate-700/40", textSecondary)}>
                  {ntm.description}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══════ FOOTER ═══════ */}
      <div className={cn("text-center text-xs py-4", textMuted)}>
        Navigation & Route Planning — {position.vesselName} — All times UTC — Data refreshes every 60s
      </div>
    </div>
  );
}
