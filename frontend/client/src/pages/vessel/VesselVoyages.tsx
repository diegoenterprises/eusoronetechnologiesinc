/**
 * VESSEL VOYAGES — Voyage Management
 * For VESSEL_OPERATOR: active/scheduled/completed voyages,
 * port calls, cargo manifest, bunker consumption, P&L
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Navigation, Ship, Anchor, Container, MapPin,
  Clock, Calendar, DollarSign, Fuel, ChevronDown,
  ChevronUp, Search, RefreshCw, ArrowRight,
  TrendingUp, BarChart3, Package, Globe,
  CheckCircle2, AlertTriangle, Timer, Eye,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Status Maps ─── */
const VOYAGE_STATUS: Record<string, { bg: string; lightBg: string; label: string }> = {
  active: { bg: "bg-emerald-500/20 text-emerald-400", lightBg: "bg-emerald-100 text-emerald-700", label: "Active" },
  scheduled: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700", label: "Scheduled" },
  completed: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-200 text-slate-600", label: "Completed" },
  delayed: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700", label: "Delayed" },
  cancelled: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700", label: "Cancelled" },
};

const PORT_CALL_STATUS: Record<string, { bg: string; lightBg: string }> = {
  completed: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  current: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  upcoming: { bg: "bg-slate-500/20 text-slate-300", lightBg: "bg-slate-100 text-slate-600" },
  skipped: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
};

/* ─── Mock Data ─── */
const MOCK_VOYAGES = [
  {
    id: "VOY-001", voyage: "FA402E", vessel: "MSC AURORA", vesselImo: "9839174",
    route: "Los Angeles → Shanghai → Busan → Los Angeles",
    routeShort: "USWC → East Asia",
    etd: "2026-04-02", eta: "2026-05-10",
    status: "active", cargoUtil: 92, teuLoaded: 13616, teuCapacity: 14800,
    revenue: 4280000, expenses: 3100000,
    portCalls: [
      { port: "Los Angeles, CA", code: "USLAX", arrival: "2026-03-30", departure: "2026-04-02", status: "completed", cargoOps: "Loaded 8,200 TEU", stayDays: 3 },
      { port: "Shanghai, CN", code: "CNSHA", arrival: "2026-04-18", departure: "2026-04-21", status: "upcoming", cargoOps: "Discharge 6,100 TEU / Load 3,400 TEU", stayDays: 3 },
      { port: "Busan, KR", code: "KRPUS", arrival: "2026-04-24", departure: "2026-04-26", status: "upcoming", cargoOps: "Discharge 4,200 TEU / Load 2,800 TEU", stayDays: 2 },
      { port: "Los Angeles, CA", code: "USLAX", arrival: "2026-05-10", departure: "—", status: "upcoming", cargoOps: "Discharge remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Electronics", teu: 3200, weight: 28400, shipper: "TechCo Inc." },
      { commodity: "Auto Parts", teu: 2800, weight: 31200, shipper: "Pacific Auto" },
      { commodity: "Machinery", teu: 1800, weight: 25600, shipper: "HeavyInd Corp" },
      { commodity: "Consumer Goods", teu: 4200, weight: 22100, shipper: "RetailMax" },
      { commodity: "Chemicals (Non-DG)", teu: 1616, weight: 18900, shipper: "ChemShip LLC" },
    ],
    bunker: { startFuel: 8200, consumed: 3000, remaining: 5200, avgConsumption: 180, fuelType: "VLSFO" },
  },
  {
    id: "VOY-002", voyage: "FE418N", vessel: "CMA CGM MARCO POLO", vesselImo: "9454412",
    route: "Savannah → Hamburg → Rotterdam → Savannah",
    routeShort: "USEC → North Europe",
    etd: "2026-03-28", eta: "2026-04-28",
    status: "active", cargoUtil: 88, teuLoaded: 14098, teuCapacity: 16020,
    revenue: 5360000, expenses: 3800000,
    portCalls: [
      { port: "Savannah, GA", code: "USSAV", arrival: "2026-03-25", departure: "2026-03-28", status: "completed", cargoOps: "Loaded 10,200 TEU", stayDays: 3 },
      { port: "Hamburg, DE", code: "DEHAM", arrival: "2026-04-12", departure: "2026-04-15", status: "upcoming", cargoOps: "Discharge 7,400 TEU / Load 4,100 TEU", stayDays: 3 },
      { port: "Rotterdam, NL", code: "NLRTM", arrival: "2026-04-17", departure: "2026-04-19", status: "upcoming", cargoOps: "Discharge 3,800 TEU / Load 2,600 TEU", stayDays: 2 },
      { port: "Savannah, GA", code: "USSAV", arrival: "2026-04-28", departure: "—", status: "upcoming", cargoOps: "Discharge remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Machinery", teu: 4100, weight: 52000, shipper: "AmeriMach Corp" },
      { commodity: "Agricultural Products", teu: 3600, weight: 41200, shipper: "AgroExport LLC" },
      { commodity: "Automobiles", teu: 2800, weight: 18400, shipper: "AutoShip Int'l" },
      { commodity: "Textiles", teu: 2200, weight: 12100, shipper: "FashionFreight" },
      { commodity: "Chemicals (DG)", teu: 1398, weight: 16800, shipper: "GlobalChem" },
    ],
    bunker: { startFuel: 9000, consumed: 4200, remaining: 4800, avgConsumption: 210, fuelType: "VLSFO" },
  },
  {
    id: "VOY-003", voyage: "AT419N", vessel: "ZIM SAMSON", vesselImo: "9867220",
    route: "Charleston → Antwerp → Haifa → Charleston",
    routeShort: "USEC → Mediterranean",
    etd: "2026-03-22", eta: "2026-04-20",
    status: "active", cargoUtil: 85, teuLoaded: 7225, teuCapacity: 8500,
    revenue: 2540000, expenses: 1820000,
    portCalls: [
      { port: "Charleston, SC", code: "USCHS", arrival: "2026-03-19", departure: "2026-03-22", status: "completed", cargoOps: "Loaded 5,800 TEU", stayDays: 3 },
      { port: "Antwerp, BE", code: "BEANR", arrival: "2026-04-03", departure: "2026-04-05", status: "upcoming", cargoOps: "Discharge 3,200 TEU / Load 1,800 TEU", stayDays: 2 },
      { port: "Haifa, IL", code: "ILHFA", arrival: "2026-04-10", departure: "2026-04-12", status: "upcoming", cargoOps: "Discharge 2,400 TEU / Load 1,600 TEU", stayDays: 2 },
      { port: "Charleston, SC", code: "USCHS", arrival: "2026-04-20", departure: "—", status: "upcoming", cargoOps: "Discharge remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Textiles", teu: 2800, weight: 14200, shipper: "SouthernTex" },
      { commodity: "Furniture", teu: 1900, weight: 11400, shipper: "HomeFurnish Co" },
      { commodity: "Consumer Electronics", teu: 1500, weight: 9800, shipper: "ElecTrade LLC" },
      { commodity: "Food Products", teu: 1025, weight: 12600, shipper: "FreshExport" },
    ],
    bunker: { startFuel: 5200, consumed: 3100, remaining: 2100, avgConsumption: 140, fuelType: "LSMGO" },
  },
  {
    id: "VOY-004", voyage: "AE426W", vessel: "MAERSK SENTOSA", vesselImo: "9778210",
    route: "Long Beach → Rotterdam → Bremerhaven → Long Beach",
    routeShort: "USWC → North Europe",
    etd: "2026-04-05", eta: "2026-05-08",
    status: "scheduled", cargoUtil: 45, teuLoaded: 5940, teuCapacity: 13200,
    revenue: 0, expenses: 0,
    portCalls: [
      { port: "Long Beach, CA", code: "USLGB", arrival: "2026-04-02", departure: "2026-04-05", status: "current", cargoOps: "Loading in progress — 5,940 / 13,200 TEU", stayDays: 3 },
      { port: "Rotterdam, NL", code: "NLRTM", arrival: "2026-04-25", departure: "2026-04-28", status: "upcoming", cargoOps: "Discharge 5,800 TEU / Load 4,200 TEU", stayDays: 3 },
      { port: "Bremerhaven, DE", code: "DEBRV", arrival: "2026-04-30", departure: "2026-05-01", status: "upcoming", cargoOps: "Discharge 3,400 TEU / Load 2,000 TEU", stayDays: 1 },
      { port: "Long Beach, CA", code: "USLGB", arrival: "2026-05-08", departure: "—", status: "upcoming", cargoOps: "Discharge remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Machinery", teu: 2400, weight: 28800, shipper: "WestCoast Mach" },
      { commodity: "Wine & Spirits", teu: 1200, weight: 14400, shipper: "CalWine Exports" },
      { commodity: "Lumber", teu: 2340, weight: 32700, shipper: "PNW Timber LLC" },
    ],
    bunker: { startFuel: 7400, consumed: 0, remaining: 7400, avgConsumption: 185, fuelType: "VLSFO" },
  },
  {
    id: "VOY-005", voyage: "TA415E", vessel: "EVERGREEN TRITON", vesselImo: "9811002",
    route: "Newark → Felixstowe → Le Havre → Newark",
    routeShort: "USEC → UK / France",
    etd: "2026-03-15", eta: "2026-04-08",
    status: "completed", cargoUtil: 78, teuLoaded: 15697, teuCapacity: 20124,
    revenue: 6120000, expenses: 4200000,
    portCalls: [
      { port: "Newark, NJ", code: "USNYC", arrival: "2026-03-12", departure: "2026-03-15", status: "completed", cargoOps: "Loaded 12,200 TEU", stayDays: 3 },
      { port: "Felixstowe, UK", code: "GBFXT", arrival: "2026-03-25", departure: "2026-03-28", status: "completed", cargoOps: "Discharged 8,100 TEU / Loaded 5,200 TEU", stayDays: 3 },
      { port: "Le Havre, FR", code: "FRLEH", arrival: "2026-03-30", departure: "2026-04-01", status: "completed", cargoOps: "Discharged 4,600 TEU / Loaded 3,100 TEU", stayDays: 2 },
      { port: "Newark, NJ", code: "USNYC", arrival: "2026-04-08", departure: "—", status: "completed", cargoOps: "Discharged all remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Consumer Goods", teu: 6200, weight: 42100, shipper: "MegaRetail Inc" },
      { commodity: "Pharmaceuticals", teu: 2100, weight: 8400, shipper: "PharmaShip" },
      { commodity: "Electronics", teu: 3800, weight: 22800, shipper: "EuroTech GmbH" },
      { commodity: "Auto Parts", teu: 2200, weight: 26400, shipper: "MotorParts EU" },
      { commodity: "Chemicals", teu: 1397, weight: 18600, shipper: "ChemCo International" },
    ],
    bunker: { startFuel: 11500, consumed: 8200, remaining: 3300, avgConsumption: 240, fuelType: "VLSFO" },
  },
  {
    id: "VOY-006", voyage: "SA403S", vessel: "HAPAG BERLIN", vesselImo: "9870315",
    route: "Houston → Santos → Buenos Aires → Houston",
    routeShort: "USGC → South America",
    etd: "2026-04-08", eta: "2026-05-02",
    status: "scheduled", cargoUtil: 62, teuLoaded: 6510, teuCapacity: 10500,
    revenue: 0, expenses: 0,
    portCalls: [
      { port: "Houston, TX", code: "USHOU", arrival: "2026-04-05", departure: "2026-04-08", status: "current", cargoOps: "Loading in progress — 6,510 / 10,500 TEU", stayDays: 3 },
      { port: "Santos, BR", code: "BRSSZ", arrival: "2026-04-22", departure: "2026-04-24", status: "upcoming", cargoOps: "Discharge 4,200 TEU / Load 3,100 TEU", stayDays: 2 },
      { port: "Buenos Aires, AR", code: "ARBUE", arrival: "2026-04-27", departure: "2026-04-28", status: "upcoming", cargoOps: "Discharge 2,000 TEU / Load 1,400 TEU", stayDays: 1 },
      { port: "Houston, TX", code: "USHOU", arrival: "2026-05-02", departure: "—", status: "upcoming", cargoOps: "Discharge remaining", stayDays: 0 },
    ],
    manifest: [
      { commodity: "Agricultural Equipment", teu: 2800, weight: 36400, shipper: "AgriMach USA" },
      { commodity: "Perishables (Reefer)", teu: 1800, weight: 21600, shipper: "FreshCargo Int'l" },
      { commodity: "Industrial Chemicals", teu: 1910, weight: 24800, shipper: "GulfChem Corp" },
    ],
    bunker: { startFuel: 6500, consumed: 0, remaining: 6500, avgConsumption: 160, fuelType: "VLSFO" },
  },
];

/* ─── Helpers ─── */
function fmtCurrency(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}
function fmtDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                    */
/* ────────────────────────────────────────────────── */
export default function VesselVoyages() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [expandedVoyage, setExpandedVoyage] = useState<string | null>(null);

  /* Theme vars */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const tableBorder = isLight ? "border-slate-100" : "border-slate-700/50";
  const tableHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30";
  const inputBg = isLight
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    : "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500";

  /* Filter voyages */
  const filteredVoyages = useMemo(() => {
    let list = MOCK_VOYAGES;
    if (tab === "active") list = list.filter(v => v.status === "active" || v.status === "delayed");
    else if (tab === "scheduled") list = list.filter(v => v.status === "scheduled");
    else if (tab === "completed") list = list.filter(v => v.status === "completed");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.voyage.toLowerCase().includes(q) ||
        v.vessel.toLowerCase().includes(q) ||
        v.route.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, search]);

  /* Summary KPIs */
  const activeCount = MOCK_VOYAGES.filter(v => v.status === "active").length;
  const scheduledCount = MOCK_VOYAGES.filter(v => v.status === "scheduled").length;
  const completedCount = MOCK_VOYAGES.filter(v => v.status === "completed").length;
  const totalRevenue = MOCK_VOYAGES.reduce((s, v) => s + v.revenue, 0);

  return (
    <div className={cn("min-h-screen p-6 space-y-6", bg)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-cyan-100 to-blue-100" : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
          )}>
            <Navigation className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Voyage Management</h1>
            <p className={cn("text-sm", muted)}>
              Plan, track and analyze voyages &bull; {MOCK_VOYAGES.length} total voyages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
            <Input
              placeholder="Search voyages..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className={cn("pl-9 w-56 h-9 text-sm rounded-lg", inputBg)}
            />
          </div>
        </div>
      </div>

      {/* ─── Summary Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>{activeCount}</div>
          <div className={cn("text-xs", muted)}>Active Voyages</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-blue-600" : "text-blue-400")}>{scheduledCount}</div>
          <div className={cn("text-xs", muted)}>Scheduled</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-600" : "text-slate-300")}>{completedCount}</div>
          <div className={cn("text-xs", muted)}>Completed</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>{fmtCurrency(totalRevenue)}</div>
          <div className={cn("text-xs", muted)}>Total Revenue</div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("h-9", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="active" className="text-sm px-4 h-8">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="scheduled" className="text-sm px-4 h-8">Scheduled ({scheduledCount})</TabsTrigger>
          <TabsTrigger value="completed" className="text-sm px-4 h-8">Completed ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── Voyage List ─── */}
      <div className="space-y-4">
        {filteredVoyages.map(voyage => {
          const isExpanded = expandedVoyage === voyage.id;
          const st = VOYAGE_STATUS[voyage.status] || VOYAGE_STATUS.active;
          const profit = voyage.revenue - voyage.expenses;
          const profitPct = voyage.revenue > 0 ? Math.round((profit / voyage.revenue) * 100) : 0;

          return (
            <div key={voyage.id} className={cn(cardBg, "overflow-hidden")}>
              {/* Voyage Row */}
              <div
                className={cn("px-5 py-4 cursor-pointer transition-colors", tableHover)}
                onClick={() => setExpandedVoyage(isExpanded ? null : voyage.id)}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", isLight ? "bg-cyan-50" : "bg-cyan-500/10")}>
                      <Ship className={cn("w-5 h-5", isLight ? "text-cyan-600" : "text-cyan-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-base font-bold", text)}>{voyage.vessel}</span>
                        <span className={cn("font-mono text-xs", isLight ? "text-cyan-700" : "text-cyan-400")}>{voyage.voyage}</span>
                        <Badge className={cn("text-[10px]", isLight ? st.lightBg : st.bg)}>{st.label}</Badge>
                      </div>
                      <div className={cn("text-sm mt-0.5", muted)}>
                        {voyage.routeShort} &mdash; {voyage.route}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={cn("text-xs", muted)}>ETD / ETA</div>
                      <div className={cn("text-sm font-medium", text)}>{fmtDate(voyage.etd)} &rarr; {fmtDate(voyage.eta)}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-xs", muted)}>Cargo</div>
                      <div className={cn("text-sm font-medium", text)}>{voyage.cargoUtil}% ({voyage.teuLoaded.toLocaleString()} TEU)</div>
                    </div>
                    {voyage.revenue > 0 && (
                      <div className="text-right">
                        <div className={cn("text-xs", muted)}>Revenue</div>
                        <div className={cn("text-sm font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(voyage.revenue)}</div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className={cn("w-5 h-5", muted)} /> : <ChevronDown className={cn("w-5 h-5", muted)} />}
                  </div>
                </div>
                {/* Cargo utilization bar */}
                <div className="mt-3">
                  <div className={cn("w-full h-1.5 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                    <div
                      className={cn("h-full rounded-full transition-all", voyage.cargoUtil >= 85 ? "bg-emerald-500" : voyage.cargoUtil >= 60 ? "bg-blue-500" : "bg-amber-500")}
                      style={{ width: `${voyage.cargoUtil}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={cn("border-t", tableBorder)}>
                  <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x", tableBorder)}>
                    {/* Left: Port Calls */}
                    <div className="p-5">
                      <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text)}>
                        <MapPin className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
                        Port Calls ({voyage.portCalls.length})
                      </h3>
                      <div className="space-y-3">
                        {voyage.portCalls.map((pc, idx) => {
                          const pcSt = PORT_CALL_STATUS[pc.status] || PORT_CALL_STATUS.upcoming;
                          return (
                            <div key={idx} className="flex items-start gap-3">
                              {/* Timeline dot/line */}
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "w-3 h-3 rounded-full border-2",
                                  pc.status === "completed"
                                    ? (isLight ? "bg-green-500 border-green-500" : "bg-green-400 border-green-400")
                                    : pc.status === "current"
                                      ? (isLight ? "bg-blue-500 border-blue-500" : "bg-blue-400 border-blue-400")
                                      : (isLight ? "bg-slate-300 border-slate-300" : "bg-slate-600 border-slate-600")
                                )} />
                                {idx < voyage.portCalls.length - 1 && (
                                  <div className={cn("w-0.5 h-12", isLight ? "bg-slate-200" : "bg-slate-700")} />
                                )}
                              </div>
                              <div className="flex-1 -mt-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-sm font-medium", text)}>{pc.port}</span>
                                  <Badge className={cn("text-[9px]", isLight ? pcSt.lightBg : pcSt.bg)}>{pc.status}</Badge>
                                </div>
                                <div className={cn("text-xs mt-0.5", muted)}>
                                  Arr: {fmtDate(pc.arrival)} &bull; Dep: {pc.departure === "—" ? "—" : fmtDate(pc.departure)}
                                  {pc.stayDays > 0 && <span> &bull; {pc.stayDays}d stay</span>}
                                </div>
                                <div className={cn("text-xs mt-0.5", muted)}>{pc.cargoOps}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Manifest + Bunker + P&L */}
                    <div className={cn("p-5 border-t lg:border-t-0", tableBorder)}>
                      {/* Cargo Manifest */}
                      <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text)}>
                        <Package className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
                        Cargo Manifest
                      </h3>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={cn("border-b", tableBorder)}>
                              {["Commodity", "TEU", "Weight (MT)", "Shipper"].map(h => (
                                <th key={h} className={cn("px-2 py-1.5 text-left font-medium", muted)}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {voyage.manifest.map((m, i) => (
                              <tr key={i} className={cn("border-b", tableBorder)}>
                                <td className={cn("px-2 py-1.5 font-medium", text)}>{m.commodity}</td>
                                <td className={cn("px-2 py-1.5", text)}>{m.teu.toLocaleString()}</td>
                                <td className={cn("px-2 py-1.5", muted)}>{m.weight.toLocaleString()}</td>
                                <td className={cn("px-2 py-1.5", muted)}>{m.shipper}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Bunker Consumption */}
                      <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text)}>
                        <Fuel className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />
                        Bunker Consumption
                      </h3>
                      <div className={cn("p-3 rounded-lg border mb-4", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40")}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <div className={cn("text-[10px]", muted)}>Start</div>
                            <div className={cn("text-xs font-bold", text)}>{voyage.bunker.startFuel.toLocaleString()} MT</div>
                          </div>
                          <div>
                            <div className={cn("text-[10px]", muted)}>Consumed</div>
                            <div className={cn("text-xs font-bold", isLight ? "text-amber-700" : "text-amber-400")}>{voyage.bunker.consumed.toLocaleString()} MT</div>
                          </div>
                          <div>
                            <div className={cn("text-[10px]", muted)}>Remaining</div>
                            <div className={cn("text-xs font-bold", text)}>{voyage.bunker.remaining.toLocaleString()} MT</div>
                          </div>
                          <div>
                            <div className={cn("text-[10px]", muted)}>Avg/Day</div>
                            <div className={cn("text-xs font-bold", text)}>{voyage.bunker.avgConsumption} MT ({voyage.bunker.fuelType})</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className={cn("w-full h-1.5 rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")}>
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${Math.round((voyage.bunker.remaining / voyage.bunker.startFuel) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* P&L */}
                      {voyage.revenue > 0 && (
                        <>
                          <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text)}>
                            <DollarSign className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
                            Voyage P&amp;L
                          </h3>
                          <div className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40")}>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <div className={cn("text-[10px]", muted)}>Revenue</div>
                                <div className={cn("text-sm font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(voyage.revenue)}</div>
                              </div>
                              <div>
                                <div className={cn("text-[10px]", muted)}>Expenses</div>
                                <div className={cn("text-sm font-bold", isLight ? "text-red-600" : "text-red-400")}>{fmtCurrency(voyage.expenses)}</div>
                              </div>
                              <div>
                                <div className={cn("text-[10px]", muted)}>Profit ({profitPct}%)</div>
                                <div className={cn("text-sm font-bold", profit >= 0 ? (isLight ? "text-emerald-700" : "text-emerald-400") : (isLight ? "text-red-600" : "text-red-400"))}>
                                  {fmtCurrency(profit)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredVoyages.length === 0 && (
          <div className={cn(cardBg, "p-12 text-center")}>
            <Navigation className={cn("w-12 h-12 mx-auto mb-3", muted)} />
            <div className={cn("text-lg font-medium", text)}>No voyages found</div>
            <div className={cn("text-sm", muted)}>Try adjusting your search or tab filter</div>
          </div>
        )}
      </div>

      {/* ─── Voyage Analytics Summary ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <BarChart3 className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Voyage Analytics</h2>
          <span className={cn("text-xs ml-auto", muted)}>YTD Performance</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Avg Cargo Utilization", value: "84%", color: isLight ? "text-emerald-700" : "text-emerald-400" },
              { label: "Avg Voyage Duration", value: "28.5 days", color: isLight ? "text-blue-700" : "text-blue-400" },
              { label: "Revenue per TEU", value: "$1,420", color: isLight ? "text-cyan-700" : "text-cyan-400" },
              { label: "Profit Margin", value: "27.4%", color: isLight ? "text-emerald-700" : "text-emerald-400" },
            ].map(m => (
              <div key={m.label} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-lg font-bold", m.color)}>{m.value}</div>
                <div className={cn("text-xs", muted)}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Trade Lane Performance Table */}
          <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text)}>
            <Globe className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
            Revenue by Trade Lane
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Trade Lane", "Voyages", "TEU Carried", "Revenue", "Avg Util", "Avg Margin"].map(h => (
                    <th key={h} className={cn("px-3 py-2 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { lane: "USWC → East Asia", voyages: 8, teu: 102400, revenue: 34200000, util: 91, margin: 28.5 },
                  { lane: "USEC → North Europe", voyages: 7, teu: 98500, revenue: 37400000, util: 87, margin: 27.1 },
                  { lane: "USEC → Mediterranean", voyages: 6, teu: 42300, revenue: 15200000, util: 84, margin: 28.8 },
                  { lane: "USGC → South America", voyages: 5, teu: 45000, revenue: 13500000, util: 76, margin: 24.2 },
                  { lane: "USEC → UK / France", voyages: 6, teu: 84200, revenue: 28900000, util: 80, margin: 31.4 },
                  { lane: "USWC → SE Asia", voyages: 3, teu: 28600, revenue: 8100000, util: 72, margin: 22.0 },
                ].map(l => (
                  <tr key={l.lane} className={cn("border-b", tableBorder, tableHover)}>
                    <td className={cn("px-3 py-2 text-xs font-medium", text)}>{l.lane}</td>
                    <td className={cn("px-3 py-2 text-xs", text)}>{l.voyages}</td>
                    <td className={cn("px-3 py-2 text-xs", text)}>{l.teu.toLocaleString()}</td>
                    <td className={cn("px-3 py-2 text-xs font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(l.revenue)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-10 h-1 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                          <div className={cn("h-full rounded-full", l.util >= 85 ? "bg-emerald-500" : l.util >= 70 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${l.util}%` }} />
                        </div>
                        <span className={cn("text-xs", text)}>{l.util}%</span>
                      </div>
                    </td>
                    <td className={cn("px-3 py-2 text-xs font-medium", l.margin >= 28 ? (isLight ? "text-emerald-700" : "text-emerald-400") : l.margin >= 24 ? (isLight ? "text-blue-700" : "text-blue-400") : (isLight ? "text-amber-700" : "text-amber-400"))}>
                      {l.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Upcoming Port Calls Across All Voyages ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <MapPin className={cn("w-4 h-4", isLight ? "text-teal-600" : "text-teal-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Upcoming Port Calls</h2>
          <span className={cn("text-xs ml-auto", muted)}>Next 14 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-left", tableBorder)}>
                {["Vessel", "Voyage", "Port", "Event", "Date", "Cargo Ops"].map(h => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_VOYAGES
                .flatMap(v => v.portCalls
                  .filter(pc => pc.status === "upcoming" || pc.status === "current")
                  .map(pc => ({ vessel: v.vessel, voyage: v.voyage, ...pc }))
                )
                .sort((a, b) => new Date(a.arrival).getTime() - new Date(b.arrival).getTime())
                .slice(0, 10)
                .map((pc, idx) => {
                  const pcSt = PORT_CALL_STATUS[pc.status] || PORT_CALL_STATUS.upcoming;
                  return (
                    <tr key={idx} className={cn("border-b", tableBorder, tableHover)}>
                      <td className={cn("px-4 py-2.5 text-xs font-medium", text)}>{pc.vessel}</td>
                      <td className={cn("px-4 py-2.5 font-mono text-xs", isLight ? "text-cyan-700" : "text-cyan-400")}>{pc.voyage}</td>
                      <td className={cn("px-4 py-2.5 text-xs", text)}>{pc.port}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn("text-[10px]", isLight ? pcSt.lightBg : pcSt.bg)}>{pc.status}</Badge>
                      </td>
                      <td className={cn("px-4 py-2.5 text-xs", muted)}>{fmtDate(pc.arrival)}</td>
                      <td className={cn("px-4 py-2.5 text-xs max-w-[240px] truncate", muted)}>{pc.cargoOps}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className={cn("text-center text-xs py-4", muted)}>
        Voyage data synced from AIS &amp; terminal systems &bull; Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}