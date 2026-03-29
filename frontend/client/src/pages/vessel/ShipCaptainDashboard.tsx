/**
 * SHIP CAPTAIN DASHBOARD — Bridge Command Center
 * The captain's digital bridge: navigation, weather, cargo, crew,
 * safety & compliance, ship logs, and communications — all at a glance.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Anchor,
  Ship,
  Navigation,
  Compass,
  Wind,
  Waves,
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Eye,
  Thermometer,
  Container,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  Clock,
  MapPin,
  ArrowRight,
  Radio,
  FileText,
  Plus,
  ChevronRight,
  Gauge,
  LifeBuoy,
  Flame,
  PersonStanding,
  BookOpen,
  Trash2,
  Droplets,
  Leaf,
  Phone,
  MessageSquare,
  Send,
  RefreshCw,
  Activity,
  Target,
  Globe,
  Milestone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ──────────────────────── MOCK DATA ──────────────────────── */
// The dashboard gracefully falls back to rich mock data when the API
// hasn't returned yet or doesn't have a captain-specific endpoint.

const MOCK_VESSEL = {
  name: "M/V EUSORONE VOYAGER",
  imo: "IMO 9876543",
  position: { lat: 36.8508, lng: -5.6174, label: "Strait of Gibraltar" },
  status: "At Sea" as const,
  flag: "Panama",
  mmsi: "354123456",
};

const MOCK_VOYAGE = {
  origin: "Rotterdam, Netherlands",
  originCode: "NLRTM",
  destination: "Singapore",
  destinationCode: "SGSIN",
  etd: "2026-03-25T08:00:00Z",
  eta: "2026-04-12T14:00:00Z",
  departedAt: "2026-03-25T09:12:00Z",
  speedKnots: 18.4,
  headingDeg: 142,
  distanceTotal: 8440,
  distanceRemaining: 6780,
  weatherSummary: "Moderate seas, SW wind 15kt, partly cloudy",
};

const MOCK_NAVIGATION = {
  nextWaypoint: "Suez Canal Approach — 31.2586N, 32.3152E",
  waypointEta: "2026-03-31T06:00:00Z",
  draftFore: 11.2,
  draftAft: 12.8,
  tidalWindow: "HW 06:42 / LW 13:18 (Suez Roads)",
  weatherRouting: "Route via Suez optimal. Avoid Mediterranean low-pressure system near Crete. ETA gain: +4hrs.",
};

const MOCK_CARGO = {
  totalContainers: 4218,
  loaded: 3894,
  empty: 282,
  reefer: 42,
  hazmat: [
    { imdg: "3", label: "Flammable Liquids", count: 18 },
    { imdg: "8", label: "Corrosives", count: 7 },
    { imdg: "2.1", label: "Flammable Gas", count: 3 },
  ],
  totalWeight: 52480,
  stowageCompliance: "compliant",
  reeferAlerts: [
    { container: "MSCU7284561", temp: -17.2, setpoint: -18.0, status: "warning" },
  ],
};

const MOCK_CREW = {
  totalOnBoard: 24,
  watches: {
    bridge: { current: ["Capt. J. Vasquez", "2/O M. Chen"], next: "04:00 — 08:00" },
    engine: { current: ["C/E R. Petrov", "3/E L. Santos"], next: "04:00 — 08:00" },
    deck: { current: ["Bosun K. Andersen", "AB T. Williams"], next: "04:00 — 08:00" },
  },
  restHourCompliance: 96,
  nonCompliantCrew: 1,
  nextDrill: { type: "Fire Drill", date: "2026-03-30T10:00:00Z" },
  officers: [
    { rank: "Master", name: "Capt. J. Vasquez" },
    { rank: "Chief Officer", name: "C/O S. Nakamura" },
    { rank: "Chief Engineer", name: "C/E R. Petrov" },
    { rank: "2nd Officer", name: "2/O M. Chen" },
  ],
};

const MOCK_SAFETY = {
  ismStatus: "compliant",
  ispsLevel: 1,
  lastPscResult: "No deficiencies",
  lastPscDate: "2026-02-14",
  lastPscPort: "Rotterdam",
  drills: {
    fire: { completed: 3, required: 3, lastDate: "2026-03-15" },
    abandonShip: { completed: 2, required: 3, lastDate: "2026-03-01" },
    manOverboard: { completed: 3, required: 3, lastDate: "2026-03-20" },
  },
  marpol: [
    { annex: "I", title: "Oil Pollution", status: "compliant" },
    { annex: "II", title: "Noxious Liquid Substances", status: "compliant" },
    { annex: "III", title: "Harmful Substances (Packaged)", status: "compliant" },
    { annex: "IV", title: "Sewage Pollution", status: "compliant" },
    { annex: "V", title: "Garbage Pollution", status: "warning" },
    { annex: "VI", title: "Air Pollution (SOx/NOx/GHG)", status: "compliant" },
  ],
};

const MOCK_WEATHER = {
  wind: { speed: 15, direction: "SW", beaufort: 4 },
  waves: { height: 1.8, period: 7 },
  visibility: "Good (>10 nm)",
  temp: 19,
  pressure: 1013,
  forecast24h: "Wind shifting W 12-18kt, seas 1.5-2.0m, scattered showers expected after 18:00 UTC.",
  stormWarnings: null as string | null,
};

const MOCK_LOGS = [
  { id: 1, time: "2026-03-29T02:00:00Z", entry: "Altered course to 142° to clear fishing fleet.", author: "2/O Chen" },
  { id: 2, time: "2026-03-28T18:30:00Z", entry: "Completed fire drill. All hands mustered in 4 min 12 sec.", author: "C/O Nakamura" },
  { id: 3, time: "2026-03-28T14:00:00Z", entry: "Bunkered 850 MT VLSFO at Gibraltar anchorage.", author: "C/E Petrov" },
  { id: 4, time: "2026-03-28T08:15:00Z", entry: "Visibility reduced to 2nm — fog. Radar watch doubled.", author: "Master" },
  { id: 5, time: "2026-03-27T22:00:00Z", entry: "Reefer MSCU7284561 temp deviation noted. Monitoring.", author: "C/O Nakamura" },
];

const MOCK_COMMS = {
  messages: [
    { id: 1, from: "Operator — Eusorone Shipping", time: "2026-03-29T01:00:00Z", subject: "Voyage instructions update: ETA Singapore berth window confirmed 12-Apr 14:00-18:00 LT." },
    { id: 2, from: "Charterer — MSC", time: "2026-03-28T16:00:00Z", subject: "Reefer pre-trip inspection reports requested for units loaded Rotterdam." },
    { id: 3, from: "Agent — Singapore", time: "2026-03-28T09:00:00Z", subject: "Pilot boarding at Eastern Boarding Ground. ETA confirmation required 48hrs prior." },
  ],
  gmdss: {
    vhf: "Operational",
    mfHf: "Operational",
    satC: "Operational",
    epirb: "Tested — OK",
    sart: "Tested — OK",
  },
  emergencyContacts: [
    { role: "DPA (Designated Person Ashore)", name: "A. Rodriguez", phone: "+1 832-555-0199" },
    { role: "P&I Club — Gard", name: "24hr Emergency", phone: "+47 22 45 34 56" },
    { role: "MRCC Singapore", name: "Maritime Rescue", phone: "+65 6325 2488" },
  ],
};

/* ──────────────────────── HELPERS ──────────────────────── */

function formatCountdown(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Arrived";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hrs}h`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function voyageProgress(total: number, remaining: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round(((total - remaining) / total) * 100));
}

/* ──────────────────────── SUB-COMPONENTS ──────────────────────── */

function StatusDot({ status }: { status: string }) {
  const color =
    status === "compliant" || status === "pass" || status === "valid" || status === "clear"
      ? "bg-emerald-400"
      : status === "warning" || status === "expiring_soon"
        ? "bg-amber-400"
        : "bg-red-400";
  return <span className={cn("inline-block w-2 h-2 rounded-full", color)} />;
}

function ComplianceIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "pass" || status === "valid" || status === "clear")
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning" || status === "expiring_soon")
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function LoadingSkeleton({ isLight }: { isLight: boolean }) {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className={cn("w-10 h-10 rounded-lg", isLight ? "bg-slate-200" : "bg-slate-700")} />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn("h-4 w-3/4", isLight ? "bg-slate-200" : "bg-slate-700")} />
            <Skeleton className={cn("h-3 w-1/2", isLight ? "bg-slate-200" : "bg-slate-700")} />
          </div>
        </div>
      ))}
    </div>
  );
}

const VESSEL_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  "At Sea": { bg: "bg-cyan-500/15", text: "text-cyan-400", dot: "bg-cyan-400" },
  "In Port": { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  "Anchored": { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  "Maneuvering": { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
};

const IMDG_COLORS: Record<string, string> = {
  "1": "bg-orange-500/20 text-orange-400",
  "2.1": "bg-red-500/20 text-red-400",
  "2.2": "bg-green-500/20 text-green-400",
  "3": "bg-red-600/20 text-red-400",
  "4": "bg-red-400/20 text-red-300",
  "5": "bg-yellow-500/20 text-yellow-400",
  "6": "bg-purple-500/20 text-purple-400",
  "7": "bg-yellow-300/20 text-yellow-300",
  "8": "bg-slate-500/20 text-slate-300",
  "9": "bg-slate-400/20 text-slate-300",
};

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */

export default function ShipCaptainDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Data queries — gracefully fall back to mock data
  const dashboardQ = (trpc as any).vesselShipments?.getVesselDashboard?.useQuery?.() ?? { data: null, isLoading: false };
  const complianceQ = (trpc as any).vesselShipments?.getVesselCompliance?.useQuery?.() ?? { data: null, isLoading: false };
  const crewQ = (trpc as any).vesselShipments?.getVesselCrew?.useQuery?.() ?? { data: null, isLoading: false };

  const loading = dashboardQ.isLoading || complianceQ.isLoading || crewQ.isLoading;

  // Log entry state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logEntry, setLogEntry] = useState("");

  // Merge API data with mocks
  const vessel = dashboardQ.data?.vessel ?? MOCK_VESSEL;
  const voyage = dashboardQ.data?.voyage ?? MOCK_VOYAGE;
  const nav = dashboardQ.data?.navigation ?? MOCK_NAVIGATION;
  const cargo = dashboardQ.data?.cargo ?? MOCK_CARGO;
  const crew = crewQ.data?.summary ?? MOCK_CREW;
  const safety = complianceQ.data?.safety ?? MOCK_SAFETY;
  const weather = dashboardQ.data?.weather ?? MOCK_WEATHER;
  const logs = dashboardQ.data?.logs ?? MOCK_LOGS;
  const comms = dashboardQ.data?.communications ?? MOCK_COMMS;

  const progress = voyageProgress(voyage.distanceTotal, voyage.distanceRemaining);
  const vesselStatus = VESSEL_STATUS_STYLES[vessel.status] ?? VESSEL_STATUS_STYLES["At Sea"];

  // Theme tokens
  const bg = isLight ? "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50" : "bg-[#060a14]";
  const cardBg = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-[#0c1425]/80 border-slate-700/40 backdrop-blur-sm";
  const cardHover = isLight
    ? "hover:shadow-md hover:border-blue-300/50"
    : "hover:border-cyan-500/30";
  const headingText = isLight ? "text-slate-900" : "text-white";
  const subText = isLight ? "text-slate-500" : "text-slate-400";
  const mutedText = isLight ? "text-slate-400" : "text-slate-500";
  const accentGradient = isLight
    ? "from-blue-600 to-cyan-600"
    : "from-cyan-400 to-teal-400";
  const labelText = isLight ? "text-slate-600" : "text-slate-300";
  const valueText = isLight ? "text-slate-900" : "text-white";
  const divider = isLight ? "border-slate-100" : "border-slate-700/40";
  const inputBg = isLight ? "bg-white border-slate-300" : "bg-slate-800/80 border-slate-600";

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8", bg)}>
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl",
              isLight
                ? "bg-gradient-to-br from-blue-100 to-cyan-100 shadow-sm"
                : "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 ring-1 ring-cyan-500/20"
            )}>
              <Anchor className={cn("w-8 h-8", isLight ? "text-blue-600" : "text-cyan-400")} />
            </div>
            <div>
              <h1 className={cn("text-2xl md:text-3xl font-bold tracking-tight", headingText)}>
                Bridge Command Center
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={cn("text-sm font-semibold", isLight ? "text-blue-700" : "text-cyan-300")}>
                  {vessel.name}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>
                  {vessel.imo}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm", isLight ? "bg-slate-100" : "bg-slate-800/60")}>
              <MapPin className={cn("w-3.5 h-3.5", subText)} />
              <span className={labelText}>
                {vessel.position.label ?? `${vessel.position.lat.toFixed(4)}N, ${Math.abs(vessel.position.lng).toFixed(4)}${vessel.position.lng >= 0 ? "E" : "W"}`}
              </span>
            </div>
            <Badge className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border-0", vesselStatus.bg, vesselStatus.text)}>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", vesselStatus.dot)} />
              {vessel.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* ═══════════════════ VOYAGE STATUS (HERO) ═══════════════════ */}
      <Card className={cn("border rounded-2xl mb-6 overflow-hidden", cardBg, cardHover, "transition-all")}>
        <div className={cn(
          "absolute inset-0 opacity-[0.03]",
          isLight ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-cyan-500 to-teal-500"
        )} />
        <CardHeader className="pb-2 relative">
          <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
            <Ship className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
            Voyage Status
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {loading ? <LoadingSkeleton isLight={isLight} /> : (
            <div className="space-y-5">
              {/* Route */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className={cn("text-xs uppercase tracking-wider mb-0.5", mutedText)}>From</div>
                  <div className={cn("text-lg font-bold", valueText)}>{voyage.origin}</div>
                  <div className={cn("text-xs", subText)}>ETD {formatDateTime(voyage.etd)}</div>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-3">
                  <div className={cn("w-8 h-px", isLight ? "bg-blue-300" : "bg-cyan-500/40")} />
                  <ArrowRight className={cn("w-5 h-5", isLight ? "text-blue-400" : "text-cyan-400")} />
                  <div className={cn("w-8 h-px", isLight ? "bg-blue-300" : "bg-cyan-500/40")} />
                </div>
                <div className="flex-1 sm:text-right">
                  <div className={cn("text-xs uppercase tracking-wider mb-0.5", mutedText)}>To</div>
                  <div className={cn("text-lg font-bold", valueText)}>{voyage.destination}</div>
                  <div className={cn("text-xs", subText)}>ETA {formatDateTime(voyage.eta)} ({formatCountdown(voyage.eta)})</div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={subText}>{(voyage.distanceTotal - voyage.distanceRemaining).toLocaleString()} nm sailed</span>
                  <span className={cn("font-semibold", isLight ? "text-blue-600" : "text-cyan-400")}>{progress}%</span>
                  <span className={subText}>{voyage.distanceRemaining.toLocaleString()} nm remaining</span>
                </div>
                <div className={cn("w-full h-3 rounded-full overflow-hidden", isLight ? "bg-blue-100" : "bg-slate-700/60")}>
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 bg-gradient-to-r", accentGradient)}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Speed / Heading / Weather row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Gauge className="w-4 h-4" />, label: "Speed", value: `${voyage.speedKnots} kts` },
                  { icon: <Compass className="w-4 h-4" />, label: "Heading", value: `${voyage.headingDeg}°` },
                  { icon: <Milestone className="w-4 h-4" />, label: "Distance", value: `${voyage.distanceTotal.toLocaleString()} nm` },
                  { icon: <Cloud className="w-4 h-4" />, label: "Conditions", value: voyage.weatherSummary.split(",")[0] },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "rounded-xl p-3 text-center border",
                    isLight ? "bg-blue-50/60 border-blue-100" : "bg-cyan-500/5 border-cyan-500/10"
                  )}>
                    <div className={cn("flex justify-center mb-1", isLight ? "text-blue-500" : "text-cyan-400")}>{item.icon}</div>
                    <div className={cn("text-sm font-bold", valueText)}>{item.value}</div>
                    <div className={cn("text-[10px] uppercase tracking-wider", mutedText)}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════ 3-COLUMN GRID ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── COLUMN 1 ─── */}
        <div className="space-y-6">

          {/* NAVIGATION */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Navigation className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* Position */}
                  <div className={cn("rounded-xl p-4 border", isLight ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100" : "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/10")}>
                    <div className={cn("text-xs uppercase tracking-wider mb-1", mutedText)}>Current Position</div>
                    <div className={cn("font-mono text-sm font-semibold", valueText)}>
                      {vessel.position.lat.toFixed(4)}°N, {Math.abs(vessel.position.lng).toFixed(4)}°{vessel.position.lng >= 0 ? "E" : "W"}
                    </div>
                    <div className={cn("text-xs mt-0.5", subText)}>{vessel.position.label}</div>
                  </div>

                  {/* Waypoint */}
                  <div className={cn("border-b pb-3", divider)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className={cn("w-3.5 h-3.5", isLight ? "text-blue-500" : "text-cyan-400")} />
                      <span className={cn("text-xs uppercase tracking-wider", mutedText)}>Next Waypoint</span>
                    </div>
                    <div className={cn("text-sm font-medium", valueText)}>{nav.nextWaypoint}</div>
                    <div className={cn("text-xs", subText)}>ETA: {formatDateTime(nav.waypointEta)}</div>
                  </div>

                  {/* Draft */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={cn("text-xs", mutedText)}>Draft Fore</div>
                      <div className={cn("text-lg font-bold", valueText)}>{nav.draftFore}m</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", mutedText)}>Draft Aft</div>
                      <div className={cn("text-lg font-bold", valueText)}>{nav.draftAft}m</div>
                    </div>
                  </div>

                  {/* Tidal */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Waves className={cn("w-3.5 h-3.5", isLight ? "text-blue-500" : "text-cyan-400")} />
                      <span className={cn("text-xs uppercase tracking-wider", mutedText)}>Tidal Window (Dest.)</span>
                    </div>
                    <div className={cn("text-sm", labelText)}>{nav.tidalWindow}</div>
                  </div>

                  {/* Weather routing */}
                  <div className={cn("rounded-xl p-3 border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/5 border-amber-500/15")}>
                    <div className="flex items-start gap-2">
                      <Compass className={cn("w-4 h-4 mt-0.5", isLight ? "text-amber-600" : "text-amber-400")} />
                      <div>
                        <div className={cn("text-xs font-semibold uppercase tracking-wider mb-0.5", isLight ? "text-amber-700" : "text-amber-400")}>Weather Routing</div>
                        <div className={cn("text-xs leading-relaxed", isLight ? "text-amber-800" : "text-amber-300/80")}>{nav.weatherRouting}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WEATHER */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Cloud className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* Current conditions grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <Wind className="w-4 h-4" />, label: "Wind", value: `${weather.wind.speed}kt ${weather.wind.direction}`, sub: `BF ${weather.wind.beaufort}` },
                      { icon: <Waves className="w-4 h-4" />, label: "Waves", value: `${weather.waves.height}m`, sub: `${weather.waves.period}s period` },
                      { icon: <Eye className="w-4 h-4" />, label: "Visibility", value: weather.visibility.split("(")[0], sub: weather.visibility.includes("(") ? weather.visibility.split("(")[1]?.replace(")", "") : "" },
                    ].map((item, i) => (
                      <div key={i} className={cn(
                        "rounded-xl p-3 text-center border",
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30"
                      )}>
                        <div className={cn("flex justify-center mb-1", isLight ? "text-blue-500" : "text-cyan-400")}>{item.icon}</div>
                        <div className={cn("text-sm font-bold", valueText)}>{item.value}</div>
                        <div className={cn("text-[10px] uppercase tracking-wider", mutedText)}>{item.label}</div>
                        {item.sub && <div className={cn("text-[9px]", mutedText)}>{item.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Temp / Pressure */}
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className={cn("w-4 h-4", subText)} />
                      <span className={cn("text-sm", labelText)}>{weather.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className={cn("w-4 h-4", subText)} />
                      <span className={cn("text-sm", labelText)}>{weather.pressure} hPa</span>
                    </div>
                  </div>

                  {/* 24h forecast */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-1", mutedText)}>24-Hour Forecast</div>
                    <p className={cn("text-sm leading-relaxed", labelText)}>{weather.forecast24h}</p>
                  </div>

                  {/* Storm warnings */}
                  {weather.stormWarnings && (
                    <div className={cn("rounded-xl p-3 border", "bg-red-500/10 border-red-500/20")}>
                      <div className="flex items-center gap-2">
                        <CloudLightning className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">Storm Warning</span>
                      </div>
                      <p className="text-xs text-red-300/80 mt-1">{weather.stormWarnings}</p>
                    </div>
                  )}

                  {!weather.stormWarnings && (
                    <div className={cn("rounded-xl p-3 border flex items-center gap-2", isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/15")}>
                      <Sun className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
                      <span className={cn("text-xs font-medium", isLight ? "text-emerald-700" : "text-emerald-400")}>No storm warnings in effect</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── COLUMN 2 ─── */}
        <div className="space-y-6">

          {/* CARGO STATUS */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Container className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Cargo Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* Container summary */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Loaded", value: cargo.loaded, color: isLight ? "text-blue-600" : "text-cyan-400" },
                      { label: "Empty", value: cargo.empty, color: isLight ? "text-slate-600" : "text-slate-400" },
                      { label: "Reefer", value: cargo.reefer, color: isLight ? "text-teal-600" : "text-teal-400" },
                    ].map((item, i) => (
                      <div key={i} className={cn(
                        "rounded-xl p-3 text-center border",
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30"
                      )}>
                        <div className={cn("text-xl font-bold", item.color)}>{item.value.toLocaleString()}</div>
                        <div className={cn("text-[10px] uppercase tracking-wider", mutedText)}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", labelText)}>Total Containers</span>
                    <span className={cn("text-lg font-bold", valueText)}>{cargo.totalContainers.toLocaleString()}</span>
                  </div>

                  {/* Hazmat */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Hazmat Containers (IMDG)</div>
                    <div className="flex flex-wrap gap-2">
                      {cargo.hazmat.map((h, i) => (
                        <Badge key={i} className={cn("text-xs px-2 py-1 border-0 font-medium", IMDG_COLORS[h.imdg] || "bg-slate-500/20 text-slate-400")}>
                          Class {h.imdg} — {h.count}
                        </Badge>
                      ))}
                    </div>
                    <div className={cn("text-xs mt-1", subText)}>
                      {cargo.hazmat.map(h => h.label).join(", ")}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", labelText)}>Total Cargo Weight</span>
                    <span className={cn("font-semibold", valueText)}>{cargo.totalWeight.toLocaleString()} MT</span>
                  </div>

                  {/* Stowage compliance */}
                  <div className={cn("rounded-xl p-3 border flex items-center justify-between",
                    cargo.stowageCompliance === "compliant"
                      ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/15")
                      : (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/15")
                  )}>
                    <div className="flex items-center gap-2">
                      <ComplianceIcon status={cargo.stowageCompliance} />
                      <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Stowage Plan</span>
                    </div>
                    <Badge className={cn("border-0 text-xs", cargo.stowageCompliance === "compliant" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                      {cargo.stowageCompliance === "compliant" ? "Compliant" : "Non-Compliant"}
                    </Badge>
                  </div>

                  {/* Reefer alerts */}
                  {cargo.reeferAlerts.length > 0 && (
                    <div className={cn("rounded-xl p-3 border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/5 border-amber-500/15")}>
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />
                        <span className={cn("text-xs font-semibold uppercase", isLight ? "text-amber-700" : "text-amber-400")}>Reefer Alerts</span>
                      </div>
                      {cargo.reeferAlerts.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className={cn("font-mono", labelText)}>{a.container}</span>
                          <span className={cn("font-medium", isLight ? "text-amber-700" : "text-amber-400")}>
                            {a.temp}°C (set: {a.setpoint}°C)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CREW STATUS */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Users className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Crew Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* Total and officers */}
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", labelText)}>Total On Board</span>
                    <span className={cn("text-2xl font-bold", valueText)}>{crew.totalOnBoard}</span>
                  </div>

                  {/* Officers */}
                  <div className={cn("rounded-xl p-3 border", isLight ? "bg-blue-50/60 border-blue-100" : "bg-cyan-500/5 border-cyan-500/10")}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Officers on Duty</div>
                    <div className="space-y-1.5">
                      {crew.officers.map((o: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className={cn("text-xs font-medium", isLight ? "text-blue-700" : "text-cyan-300")}>{o.rank}</span>
                          <span className={cn("text-xs", labelText)}>{o.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Watch schedule */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Current Watch</div>
                    {Object.entries(crew.watches).map(([dept, watch]: [string, any]) => (
                      <div key={dept} className={cn("flex items-start justify-between py-1.5 border-b last:border-b-0", divider)}>
                        <div>
                          <div className={cn("text-xs font-semibold capitalize", labelText)}>{dept}</div>
                          <div className={cn("text-xs", subText)}>{watch.current.join(", ")}</div>
                        </div>
                        <div className={cn("text-[10px] px-2 py-0.5 rounded-full", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>
                          Next: {watch.next}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rest hour compliance */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-xs", mutedText)}>Rest Hour Compliance (MLC 2006)</span>
                      <span className={cn("text-sm font-bold", crew.restHourCompliance >= 95 ? (isLight ? "text-emerald-600" : "text-emerald-400") : (isLight ? "text-amber-600" : "text-amber-400"))}>
                        {crew.restHourCompliance}%
                      </span>
                    </div>
                    <Progress value={crew.restHourCompliance} className={cn("h-2", isLight ? "bg-slate-100" : "bg-slate-700/60")} />
                    {crew.nonCompliantCrew > 0 && (
                      <div className={cn("text-xs mt-1 flex items-center gap-1", isLight ? "text-amber-600" : "text-amber-400")}>
                        <AlertTriangle className="w-3 h-3" />
                        {crew.nonCompliantCrew} crew member(s) approaching rest hour limit
                      </div>
                    )}
                  </div>

                  {/* Next drill */}
                  <div className={cn("rounded-xl p-3 border flex items-center justify-between",
                    isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/5 border-blue-500/15"
                  )}>
                    <div className="flex items-center gap-2">
                      <Clock className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
                      <div>
                        <div className={cn("text-xs font-semibold", isLight ? "text-blue-700" : "text-blue-300")}>Next Drill</div>
                        <div className={cn("text-xs", subText)}>{crew.nextDrill.type}</div>
                      </div>
                    </div>
                    <span className={cn("text-xs font-mono", labelText)}>{formatDateTime(crew.nextDrill.date)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── COLUMN 3 ─── */}
        <div className="space-y-6">

          {/* SAFETY & COMPLIANCE */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Shield className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Safety & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* ISM / ISPS / PSC */}
                  <div className="space-y-2">
                    {[
                      { label: "ISM Code", status: safety.ismStatus, value: safety.ismStatus === "compliant" ? "Compliant" : "Non-Compliant" },
                      { label: "ISPS Security Level", status: safety.ispsLevel <= 1 ? "compliant" : safety.ispsLevel === 2 ? "warning" : "critical", value: `Level ${safety.ispsLevel}` },
                    ].map((item, i) => (
                      <div key={i} className={cn("flex items-center justify-between py-1.5 border-b", divider)}>
                        <div className="flex items-center gap-2">
                          <ComplianceIcon status={item.status} />
                          <span className={cn("text-sm", labelText)}>{item.label}</span>
                        </div>
                        <Badge className={cn("border-0 text-xs",
                          item.status === "compliant" ? "bg-emerald-500/20 text-emerald-400"
                            : item.status === "warning" ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        )}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Last PSC */}
                  <div className={cn("rounded-xl p-3 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30")}>
                    <div className={cn("text-xs uppercase tracking-wider mb-1", mutedText)}>Last PSC Inspection</div>
                    <div className={cn("text-sm font-semibold", valueText)}>{safety.lastPscResult}</div>
                    <div className={cn("text-xs", subText)}>{safety.lastPscPort} — {formatDateShort(safety.lastPscDate)}</div>
                  </div>

                  {/* Drills */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Drills This Quarter</div>
                    <div className="space-y-2">
                      {[
                        { icon: <Flame className="w-3.5 h-3.5" />, label: "Fire Drill", data: safety.drills.fire },
                        { icon: <LifeBuoy className="w-3.5 h-3.5" />, label: "Abandon Ship", data: safety.drills.abandonShip },
                        { icon: <PersonStanding className="w-3.5 h-3.5" />, label: "Man Overboard", data: safety.drills.manOverboard },
                      ].map((drill, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(isLight ? "text-blue-500" : "text-cyan-400")}>{drill.icon}</span>
                            <span className={cn("text-xs", labelText)}>{drill.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-semibold",
                              drill.data.completed >= drill.data.required
                                ? (isLight ? "text-emerald-600" : "text-emerald-400")
                                : (isLight ? "text-amber-600" : "text-amber-400")
                            )}>
                              {drill.data.completed}/{drill.data.required}
                            </span>
                            <span className={cn("text-[10px]", mutedText)}>Last: {formatDateShort(drill.data.lastDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MARPOL */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>MARPOL Compliance (Annex I-VI)</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {safety.marpol.map((m, i) => (
                        <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs",
                          m.status === "compliant"
                            ? (isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/10 text-emerald-400")
                            : (isLight ? "bg-amber-50 text-amber-700" : "bg-amber-500/10 text-amber-400")
                        )}>
                          <StatusDot status={m.status} />
                          <span className="font-medium">Annex {m.annex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SHIP LOGS */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                  <BookOpen className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                  Ship Logs
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogForm(!showLogForm)}
                  className={cn("text-xs gap-1", isLight ? "text-blue-600 hover:bg-blue-50" : "text-cyan-400 hover:bg-cyan-500/10")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-3">
                  {/* Add entry form */}
                  {showLogForm && (
                    <div className={cn("rounded-xl p-3 border space-y-2", isLight ? "bg-blue-50 border-blue-200" : "bg-cyan-500/5 border-cyan-500/15")}>
                      <Textarea
                        placeholder="Enter log entry..."
                        value={logEntry}
                        onChange={(e) => setLogEntry(e.target.value)}
                        className={cn("text-sm min-h-[60px] resize-none", inputBg)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowLogForm(false); setLogEntry(""); }}>
                          Cancel
                        </Button>
                        <Button size="sm" className={cn("text-xs", isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white")}>
                          <Send className="w-3 h-3 mr-1" /> Submit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Log entries */}
                  {logs.map((log: any, i: number) => (
                    <div key={log.id} className={cn("pb-3 border-b last:border-b-0 last:pb-0", divider)}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn("text-xs font-semibold", isLight ? "text-blue-700" : "text-cyan-300")}>{log.author}</span>
                        <span className={cn("text-[10px] font-mono", mutedText)}>{formatDateTime(log.time)}</span>
                      </div>
                      <p className={cn("text-xs leading-relaxed", labelText)}>{log.entry}</p>
                    </div>
                  ))}

                  {/* Record book statuses */}
                  <div className={cn("border-t pt-3 space-y-1.5", divider)}>
                    {[
                      { icon: <Droplets className="w-3.5 h-3.5" />, label: "Oil Record Book", status: "Up to date" },
                      { icon: <Trash2 className="w-3.5 h-3.5" />, label: "Garbage Record", status: "Up to date" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(isLight ? "text-blue-500" : "text-cyan-400")}>{item.icon}</span>
                          <span className={cn("text-xs", labelText)}>{item.label}</span>
                        </div>
                        <Badge className="border-0 text-[10px] bg-emerald-500/20 text-emerald-400">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* COMMUNICATIONS */}
          <Card className={cn("border rounded-2xl transition-all", cardBg, cardHover)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-lg", headingText)}>
                <Radio className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton isLight={isLight} /> : (
                <div className="space-y-4">
                  {/* Messages */}
                  <div>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Recent Messages</div>
                    {comms.messages.map((msg: any, i: number) => (
                      <div key={msg.id} className={cn("pb-2.5 mb-2.5 border-b last:border-b-0 last:pb-0 last:mb-0", divider)}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn("text-xs font-semibold truncate max-w-[70%]", isLight ? "text-blue-700" : "text-cyan-300")}>{msg.from}</span>
                          <span className={cn("text-[10px] font-mono flex-shrink-0", mutedText)}>{formatDateTime(msg.time)}</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", labelText)}>{msg.subject}</p>
                      </div>
                    ))}
                  </div>

                  {/* GMDSS Equipment */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>GMDSS Equipment Status</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(comms.gmdss).map(([key, status]: [string, any]) => {
                        const labels: Record<string, string> = { vhf: "VHF DSC", mfHf: "MF/HF", satC: "INMARSAT-C", epirb: "EPIRB", sart: "SART" };
                        return (
                          <div key={key} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs",
                            isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            <CheckCircle className="w-3 h-3" />
                            <span className="font-medium">{labels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emergency contacts */}
                  <div className={cn("border-t pt-3", divider)}>
                    <div className={cn("text-xs uppercase tracking-wider mb-2", mutedText)}>Emergency Contacts</div>
                    <div className="space-y-2">
                      {comms.emergencyContacts.map((c: any, i: number) => (
                        <div key={i} className={cn("flex items-center justify-between py-1 border-b last:border-b-0", divider)}>
                          <div>
                            <div className={cn("text-xs font-semibold", labelText)}>{c.role}</div>
                            <div className={cn("text-[10px]", subText)}>{c.name}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className={cn("w-3 h-3", isLight ? "text-blue-500" : "text-cyan-400")} />
                            <span className={cn("text-[10px] font-mono", subText)}>{c.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className={cn("mt-8 pt-4 border-t text-center", divider)}>
        <p className={cn("text-xs", mutedText)}>
          Bridge Command Center — {vessel.name} — Last updated: {new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} UTC
        </p>
      </footer>
    </div>
  );
}
