/**
 * RAIL YARD TRACK MANAGEMENT — V5 Multi-Modal
 * Yard track assignments, capacity, utilization, inbound queue, industry tracks,
 * maintenance windows, and historical analytics for RAIL_DISPATCHER & RAIL_CATALYST
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  TrainFront,
  ArrowDownToLine,
  Factory,
  Wrench,
  BarChart3,
  Gauge,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  ChevronRight,
  ArrowRight,
  Hash,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Timer,
  MapPin,
  Calendar,
  Shield,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Track type colors ─── */
const TRACK_TYPE_COLORS: Record<string, string> = {
  classification: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  departure: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  arrival: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  storage: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  industry: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const TRACK_TYPE_LABELS: Record<string, string> = {
  classification: "Classification",
  departure: "Departure",
  arrival: "Arrival",
  storage: "Storage",
  industry: "Industry",
};

const UTILIZATION_COLOR = (pct: number) =>
  pct >= 90 ? "text-red-400" : pct >= 75 ? "text-amber-400" : "text-emerald-400";

const UTIL_BAR_COLOR = (pct: number) =>
  pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";

/* ─── Mock data generators ─── */
function generateTracks() {
  const defs: Array<{
    id: string; name: string; type: string; lengthFt: number;
    capacity: number; currentCars: number; cars: string[];
  }> = [];
  const configs: Array<[string, string, string, number, number]> = [
    ["CL-01", "Class Track 1", "classification", 3200, 18],
    ["CL-02", "Class Track 2", "classification", 3200, 18],
    ["CL-03", "Class Track 3", "classification", 2800, 16],
    ["CL-04", "Class Track 4", "classification", 2800, 16],
    ["CL-05", "Class Track 5", "classification", 2400, 14],
    ["CL-06", "Class Track 6", "classification", 2400, 14],
    ["DP-01", "Departure 1", "departure", 5000, 28],
    ["DP-02", "Departure 2", "departure", 5000, 28],
    ["DP-03", "Departure 3", "departure", 4500, 25],
    ["AR-01", "Arrival A", "arrival", 5500, 32],
    ["AR-02", "Arrival B", "arrival", 5500, 32],
    ["AR-03", "Arrival C", "arrival", 4800, 27],
    ["ST-01", "Storage East", "storage", 2000, 12],
    ["ST-02", "Storage West", "storage", 2000, 12],
    ["IN-01", "Cargill Siding", "industry", 1500, 8],
    ["IN-02", "Nucor Steel Spur", "industry", 1800, 10],
    ["IN-03", "ADM Grain Elev.", "industry", 1200, 6],
    ["IN-04", "Marathon Refinery", "industry", 2000, 12],
  ];
  const railroads = ["BNSF", "UP", "CSX", "NS", "CN", "CP", "KCS"];
  configs.forEach(([id, name, type, lengthFt, capacity]) => {
    const occ = Math.floor(Math.random() * (capacity + 1));
    const cars: string[] = [];
    for (let c = 0; c < occ; c++) {
      cars.push(`${railroads[c % railroads.length]} ${100000 + Math.floor(Math.random() * 900000)}`);
    }
    defs.push({ id, name, type, lengthFt, capacity, currentCars: occ, cars });
  });
  return defs;
}

function generateInboundQueue() {
  const trains = [
    { symbol: "Q-CHISTL", origin: "Chicago, IL", cars: 92, eta: 15, hazmat: 3, priority: "high" as const },
    { symbol: "Z-LACCHI", origin: "Los Angeles, CA", cars: 118, eta: 42, hazmat: 0, priority: "normal" as const },
    { symbol: "M-KCSBIR", origin: "Kansas City, MO", cars: 74, eta: 68, hazmat: 7, priority: "urgent" as const },
    { symbol: "Q-ATLMEM", origin: "Atlanta, GA", cars: 56, eta: 95, hazmat: 1, priority: "normal" as const },
    { symbol: "Z-SEAPTL", origin: "Seattle, WA", cars: 105, eta: 130, hazmat: 0, priority: "low" as const },
    { symbol: "M-HOUDAL", origin: "Houston, TX", cars: 83, eta: 185, hazmat: 12, priority: "high" as const },
  ];
  return trains.map((t, i) => ({
    id: `IB-${5000 + i}`,
    ...t,
    status: t.eta < 30 ? "arriving" : t.eta < 90 ? "en_route" : "scheduled",
    etaTime: new Date(Date.now() + t.eta * 60000).toISOString(),
    assignedTrack: t.eta < 30 ? "AR-01" : null,
  }));
}

function generateIndustryTracks() {
  return [
    { trackId: "IN-01", shipper: "Cargill Inc.", commodity: "Grain", carsSpotted: 5, capacity: 8, expectedRelease: "2026-03-29T18:00:00Z", status: "loading" },
    { trackId: "IN-02", shipper: "Nucor Steel", commodity: "Steel Coil", carsSpotted: 8, capacity: 10, expectedRelease: "2026-03-29T22:00:00Z", status: "loading" },
    { trackId: "IN-03", shipper: "ADM Grain Elevator", commodity: "Soybeans", carsSpotted: 6, capacity: 6, expectedRelease: "2026-03-29T14:00:00Z", status: "ready" },
    { trackId: "IN-04", shipper: "Marathon Petroleum", commodity: "Crude Oil", carsSpotted: 9, capacity: 12, expectedRelease: "2026-03-30T06:00:00Z", status: "loading" },
    { trackId: "IN-01", shipper: "Cargill Inc.", commodity: "Ethanol (Empties)", carsSpotted: 0, capacity: 8, expectedRelease: "—", status: "awaiting" },
    { trackId: "IN-02", shipper: "Nucor Steel", commodity: "Scrap Iron", carsSpotted: 2, capacity: 10, expectedRelease: "2026-03-30T10:00:00Z", status: "unloading" },
  ];
}

function generateMaintenanceWindows() {
  return [
    { trackId: "CL-03", reason: "Rail replacement — worn switch point", start: "2026-03-30T02:00:00Z", end: "2026-03-30T10:00:00Z", status: "scheduled", crew: "MOW Alpha" },
    { trackId: "ST-02", reason: "Derail device inspection", start: "2026-03-29T22:00:00Z", end: "2026-03-30T01:00:00Z", status: "scheduled", crew: "MOW Bravo" },
    { trackId: "DP-03", reason: "Signal relay replacement", start: "2026-03-29T08:00:00Z", end: "2026-03-29T12:00:00Z", status: "completed", crew: "Signal Team" },
    { trackId: "AR-03", reason: "Ballast tamping & surfacing", start: "2026-03-31T00:00:00Z", end: "2026-03-31T08:00:00Z", status: "scheduled", crew: "MOW Charlie" },
    { trackId: "CL-06", reason: "Joint bar replacement", start: "2026-03-29T06:00:00Z", end: "2026-03-29T09:00:00Z", status: "completed", crew: "MOW Alpha" },
  ];
}

function generateHistoricalData() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  return hours.map((h) => {
    const hour = parseInt(h);
    const base = hour >= 6 && hour <= 20 ? 72 : 45;
    return { hour: h, utilization: Math.min(98, base + Math.floor(Math.random() * 20)), movements: Math.floor(Math.random() * 15) + (hour >= 8 && hour <= 18 ? 10 : 2) };
  });
}

/* ─── Component ─── */
export default function RailYardTracks() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assignSource, setAssignSource] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);

  /* Data */
  const tracks = useMemo(() => generateTracks(), []);
  const inbound = useMemo(() => generateInboundQueue(), []);
  const industryData = useMemo(() => generateIndustryTracks(), []);
  const maintenance = useMemo(() => generateMaintenanceWindows(), []);
  const historical = useMemo(() => generateHistoricalData(), []);

  /* Derived */
  const totalTracks = tracks.length;
  const totalCapacity = tracks.reduce((s, t) => s + t.capacity, 0);
  const totalOccupied = tracks.reduce((s, t) => s + t.currentCars, 0);
  const overallUtil = Math.round((totalOccupied / totalCapacity) * 100);

  const filteredTracks = tracks.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const nearCapacity = tracks.filter((t) => (t.currentCars / t.capacity) * 100 >= 75);
  const availableByType = Object.entries(
    tracks.reduce<Record<string, { total: number; avail: number }>>((acc, t) => {
      if (!acc[t.type]) acc[t.type] = { total: 0, avail: 0 };
      acc[t.type].total += t.capacity;
      acc[t.type].avail += t.capacity - t.currentCars;
      return acc;
    }, {})
  );

  const peakHour = historical.reduce((max, h) => (h.utilization > max.utilization ? h : max), historical[0]);
  const avgUtil = Math.round(historical.reduce((s, h) => s + h.utilization, 0) / historical.length);

  /* Theme styles */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-500" : "text-slate-400";
  const textMuted = isLight ? "text-slate-400" : "text-slate-500";
  const inputBg = isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700";
  const tableBorder = isLight ? "border-slate-200" : "border-slate-700/50";
  const tableRowHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30";
  const tableHeaderBg = isLight ? "bg-slate-100" : "bg-slate-800/80";

  /* Helpers */
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const fmtDate = (iso: string) => {
    if (iso === "—") return "—";
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };
  const minsFromNow = (iso: string) => Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));

  const handleAssign = () => {
    if (assignSource && assignTarget) {
      alert(`Assigned car ${assignSource} to track ${assignTarget}`);
      setAssignSource(null);
      setAssignTarget(null);
    }
  };

  /* ─── Render ─── */
  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <LayoutGrid className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", textPrimary)}>Yard Track Management</h1>
            <p className={cn("text-sm", textSecondary)}>
              Roseville Yard &mdash; {totalTracks} tracks &middot; {totalCapacity} car capacity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm px-3 py-1", overallUtil >= 80 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400")}>
            <Gauge className="w-3.5 h-3.5 mr-1" />
            {overallUtil}% Yard Utilization
          </Badge>
          <Button variant="outline" size="sm" className={cn("gap-1.5", isLight ? "border-slate-300" : "border-slate-600")}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={cn("flex-wrap h-auto gap-1 p-1", isLight ? "bg-slate-100" : "bg-slate-800/60")}>
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm"><LayoutGrid className="w-3.5 h-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="assign" className="gap-1.5 text-xs sm:text-sm"><ArrowRight className="w-3.5 h-3.5" />Assignment</TabsTrigger>
          <TabsTrigger value="capacity" className="gap-1.5 text-xs sm:text-sm"><Gauge className="w-3.5 h-3.5" />Capacity</TabsTrigger>
          <TabsTrigger value="inbound" className="gap-1.5 text-xs sm:text-sm"><ArrowDownToLine className="w-3.5 h-3.5" />Inbound</TabsTrigger>
          <TabsTrigger value="industry" className="gap-1.5 text-xs sm:text-sm"><Factory className="w-3.5 h-3.5" />Industry</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5 text-xs sm:text-sm"><Wrench className="w-3.5 h-3.5" />Maintenance</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="w-3.5 h-3.5" />Analytics</TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB: Yard Overview ═══════════ */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textMuted)} />
              <Input
                placeholder="Search tracks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn("pl-9", inputBg)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={cn("w-48", inputBg)}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="departure">Departure</SelectItem>
                <SelectItem value="arrival">Arrival</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Track Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTracks.map((track) => {
              const utilPct = Math.round((track.currentCars / track.capacity) * 100);
              return (
                <Card key={track.id} className={cn(cardBg, "overflow-hidden")}>
                  <CardContent className="p-4 space-y-3">
                    {/* Track header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-bold text-sm", textPrimary)}>{track.id}</span>
                        <Badge variant="outline" className={cn("text-[10px]", TRACK_TYPE_COLORS[track.type])}>
                          {TRACK_TYPE_LABELS[track.type]}
                        </Badge>
                      </div>
                      <span className={cn("text-xs font-medium", UTILIZATION_COLOR(utilPct))}>{utilPct}%</span>
                    </div>

                    {/* Name & length */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm", textSecondary)}>{track.name}</span>
                      <span className={cn("text-xs font-mono", textMuted)}>{track.lengthFt.toLocaleString()} ft</span>
                    </div>

                    {/* Utilization bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={textMuted}>{track.currentCars} / {track.capacity} cars</span>
                        <span className={textMuted}>{track.capacity - track.currentCars} avail</span>
                      </div>
                      <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                        <div
                          className={cn("h-full rounded-full transition-all", UTIL_BAR_COLOR(utilPct))}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Visual car blocks */}
                    <div className="flex flex-wrap gap-0.5">
                      {Array.from({ length: track.capacity }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-4 h-3 rounded-sm text-[7px] flex items-center justify-center font-mono",
                            i < track.currentCars
                              ? (isLight ? "bg-indigo-200 text-indigo-700" : "bg-indigo-500/40 text-indigo-300")
                              : (isLight ? "bg-slate-200" : "bg-slate-700/60")
                          )}
                          title={i < track.currentCars ? track.cars[i] : "Empty"}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════ TAB: Track Assignment ═══════════ */}
        <TabsContent value="assign" className="space-y-4">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                <ArrowRight className="w-5 h-5 text-indigo-400" /> Assign Cars to Tracks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={cn("text-sm", textSecondary)}>
                Select a car from the available pool, then choose a destination track to assign it.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Car selection */}
                <div className="space-y-2">
                  <label className={cn("text-sm font-medium", textPrimary)}>Source Car</label>
                  <Select value={assignSource || ""} onValueChange={setAssignSource}>
                    <SelectTrigger className={inputBg}>
                      <SelectValue placeholder="Select a car..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.flatMap((t) => t.cars).slice(0, 20).map((car) => (
                        <SelectItem key={car} value={car}>{car}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target track */}
                <div className="space-y-2">
                  <label className={cn("text-sm font-medium", textPrimary)}>Destination Track</label>
                  <Select value={assignTarget || ""} onValueChange={setAssignTarget}>
                    <SelectTrigger className={inputBg}>
                      <SelectValue placeholder="Select a track..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.filter((t) => t.currentCars < t.capacity).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.id} — {t.name} ({t.capacity - t.currentCars} avail)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleAssign}
                    disabled={!assignSource || !assignTarget}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" /> Assign Car
                  </Button>
                </div>
              </div>

              {/* Current assignments table */}
              <div className="mt-6">
                <h3 className={cn("text-sm font-semibold mb-3", textPrimary)}>Recent Assignments</h3>
                <div className={cn("rounded-lg border overflow-x-auto", tableBorder)}>
                  <table className="w-full text-sm">
                    <thead className={tableHeaderBg}>
                      <tr>
                        <th className={cn("text-left px-4 py-2 font-medium", textSecondary)}>Car</th>
                        <th className={cn("text-left px-4 py-2 font-medium", textSecondary)}>From</th>
                        <th className={cn("text-left px-4 py-2 font-medium", textSecondary)}>To</th>
                        <th className={cn("text-left px-4 py-2 font-medium", textSecondary)}>Time</th>
                        <th className={cn("text-left px-4 py-2 font-medium", textSecondary)}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { car: "BNSF 723401", from: "AR-01", to: "CL-02", time: "08:42", status: "completed" },
                        { car: "UP 584920", from: "AR-01", to: "CL-05", time: "08:38", status: "completed" },
                        { car: "CSX 319744", from: "CL-01", to: "DP-01", time: "08:31", status: "in_progress" },
                        { car: "NS 502218", from: "AR-02", to: "IN-02", time: "08:25", status: "in_progress" },
                        { car: "CN 771503", from: "CL-04", to: "DP-02", time: "08:18", status: "completed" },
                        { car: "CP 445817", from: "ST-01", to: "CL-06", time: "08:10", status: "completed" },
                        { car: "KCS 623190", from: "AR-03", to: "CL-03", time: "07:55", status: "completed" },
                        { car: "BNSF 981205", from: "IN-01", to: "DP-01", time: "07:42", status: "completed" },
                      ].map((r, i) => (
                        <tr key={i} className={cn("border-t", tableBorder, tableRowHover)}>
                          <td className={cn("px-4 py-2 font-mono font-medium", textPrimary)}>{r.car}</td>
                          <td className={cn("px-4 py-2 font-mono", textSecondary)}>{r.from}</td>
                          <td className={cn("px-4 py-2 font-mono", textSecondary)}>
                            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" />{r.to}</span>
                          </td>
                          <td className={cn("px-4 py-2", textMuted)}>{r.time}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className={cn("text-[10px]",
                              r.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                            )}>
                              {r.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: Capacity Dashboard ═══════════ */}
        <TabsContent value="capacity" className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Overall Utilization", value: `${overallUtil}%`, icon: Gauge, color: UTILIZATION_COLOR(overallUtil) },
              { label: "Total Cars", value: totalOccupied.toString(), icon: Package, color: "text-blue-400" },
              { label: "Available Spots", value: (totalCapacity - totalOccupied).toString(), icon: Maximize2, color: "text-emerald-400" },
              { label: "Tracks Near Capacity", value: nearCapacity.length.toString(), icon: AlertTriangle, color: nearCapacity.length > 3 ? "text-red-400" : "text-amber-400" },
            ].map((kpi, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", kpi.color.replace("text-", "bg-").replace("400", "500/10"))}>
                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                  </div>
                  <div>
                    <p className={cn("text-xs", textMuted)}>{kpi.label}</p>
                    <p className={cn("text-xl font-bold", textPrimary)}>{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tracks near capacity */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-base flex items-center gap-2", textPrimary)}>
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Tracks Near Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nearCapacity.length === 0 ? (
                <p className={cn("text-sm", textSecondary)}>All tracks have adequate capacity.</p>
              ) : (
                <div className="space-y-3">
                  {nearCapacity.sort((a, b) => (b.currentCars / b.capacity) - (a.currentCars / a.capacity)).map((t) => {
                    const pct = Math.round((t.currentCars / t.capacity) * 100);
                    return (
                      <div key={t.id} className={cn("flex items-center gap-4 p-3 rounded-lg border", tableBorder)}>
                        <div className="flex-shrink-0 w-16">
                          <span className={cn("font-mono font-bold text-sm", textPrimary)}>{t.id}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={textSecondary}>{t.name}</span>
                            <span className={UTILIZATION_COLOR(pct)}>{pct}% — {t.currentCars}/{t.capacity}</span>
                          </div>
                          <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                            <div className={cn("h-full rounded-full", UTIL_BAR_COLOR(pct))} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", TRACK_TYPE_COLORS[t.type])}>
                          {TRACK_TYPE_LABELS[t.type]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available space by type */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-base flex items-center gap-2", textPrimary)}>
                <BarChart3 className="w-4 h-4 text-blue-400" /> Available Space by Track Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableByType.map(([type, data]) => {
                  const usedPct = Math.round(((data.total - data.avail) / data.total) * 100);
                  return (
                    <div key={type} className={cn("p-3 rounded-lg border", tableBorder)}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={cn("text-[10px]", TRACK_TYPE_COLORS[type])}>
                          {TRACK_TYPE_LABELS[type]}
                        </Badge>
                        <span className={cn("text-xs font-medium", UTILIZATION_COLOR(usedPct))}>{usedPct}% used</span>
                      </div>
                      <div className={cn("h-2 rounded-full overflow-hidden mb-2", isLight ? "bg-slate-200" : "bg-slate-700")}>
                        <div className={cn("h-full rounded-full", UTIL_BAR_COLOR(usedPct))} style={{ width: `${usedPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={textSecondary}>{data.avail} spots available</span>
                        <span className={textMuted}>{data.total} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: Inbound Queue ═══════════ */}
        <TabsContent value="inbound" className="space-y-4">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                <ArrowDownToLine className="w-5 h-5 text-purple-400" /> Inbound Train Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inbound.map((train) => {
                  const mins = minsFromNow(train.etaTime);
                  const isUrgent = train.priority === "urgent" || train.priority === "high";
                  return (
                    <div
                      key={train.id}
                      className={cn(
                        "p-4 rounded-lg border flex flex-col md:flex-row md:items-center gap-3",
                        tableBorder,
                        isUrgent && "border-l-4 border-l-amber-500"
                      )}
                    >
                      {/* Symbol & origin */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TrainFront className={cn("w-4 h-4", train.status === "arriving" ? "text-emerald-400" : "text-blue-400")} />
                          <span className={cn("font-mono font-bold text-sm", textPrimary)}>{train.symbol}</span>
                          <Badge variant="outline" className={cn("text-[10px]",
                            train.priority === "urgent" ? "bg-red-500/20 text-red-400" :
                            train.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                            train.priority === "low" ? "bg-slate-500/20 text-slate-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>
                            {train.priority}
                          </Badge>
                          {train.hazmat > 0 && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                              <Flame className="w-3 h-3 mr-0.5" /> {train.hazmat} hazmat
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={textSecondary}>
                            <MapPin className="w-3 h-3 inline mr-0.5" />{train.origin}
                          </span>
                          <span className={textMuted}>{train.cars} cars</span>
                        </div>
                      </div>

                      {/* ETA */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn("text-xs", textMuted)}>ETA</p>
                          <p className={cn("text-sm font-medium", mins < 30 ? "text-emerald-400" : textPrimary)}>
                            <Timer className="w-3 h-3 inline mr-0.5" />
                            {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xs", textMuted)}>Assigned</p>
                          <p className={cn("text-sm font-mono", train.assignedTrack ? "text-emerald-400" : "text-amber-400")}>
                            {train.assignedTrack || "Unassigned"}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]",
                          train.status === "arriving" ? "bg-emerald-500/20 text-emerald-400" :
                          train.status === "en_route" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {train.status}
                        </Badge>
                        {!train.assignedTrack && (
                          <Button size="sm" variant="outline" className="text-xs gap-1 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                            Assign Track
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: Industry Tracks ═══════════ */}
        <TabsContent value="industry" className="space-y-4">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                <Factory className="w-5 h-5 text-cyan-400" /> Industry Tracks &amp; Customer Sidings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("rounded-lg border overflow-x-auto", tableBorder)}>
                <table className="w-full text-sm">
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Track</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Shipper</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Commodity</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Cars Spotted</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Capacity</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Expected Release</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industryData.map((row, i) => (
                      <tr key={i} className={cn("border-t", tableBorder, tableRowHover)}>
                        <td className={cn("px-4 py-2.5 font-mono font-medium", textPrimary)}>{row.trackId}</td>
                        <td className={cn("px-4 py-2.5", textPrimary)}>{row.shipper}</td>
                        <td className={cn("px-4 py-2.5", textSecondary)}>{row.commodity}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={cn("font-medium", textPrimary)}>{row.carsSpotted}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={textMuted}>{row.capacity}</span>
                        </td>
                        <td className={cn("px-4 py-2.5", textSecondary)}>{fmtDate(row.expectedRelease)}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn("text-[10px]",
                            row.status === "ready" ? "bg-emerald-500/20 text-emerald-400" :
                            row.status === "loading" ? "bg-blue-500/20 text-blue-400" :
                            row.status === "unloading" ? "bg-purple-500/20 text-purple-400" :
                            "bg-amber-500/20 text-amber-400"
                          )}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: "Total Spotted", value: industryData.reduce((s, r) => s + r.carsSpotted, 0), color: "text-blue-400" },
                  { label: "Ready for Pull", value: industryData.filter((r) => r.status === "ready").reduce((s, r) => s + r.carsSpotted, 0), color: "text-emerald-400" },
                  { label: "Still Loading", value: industryData.filter((r) => r.status === "loading").reduce((s, r) => s + r.carsSpotted, 0), color: "text-amber-400" },
                  { label: "Awaiting Spot", value: industryData.filter((r) => r.status === "awaiting").length, color: "text-red-400" },
                ].map((s, i) => (
                  <div key={i} className={cn("p-3 rounded-lg border text-center", tableBorder)}>
                    <p className={cn("text-xs mb-1", textMuted)}>{s.label}</p>
                    <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: Track Maintenance ═══════════ */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                <Wrench className="w-5 h-5 text-orange-400" /> Track Maintenance Windows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenance.map((m, i) => {
                  const isCompleted = m.status === "completed";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-lg border flex flex-col md:flex-row md:items-center gap-3",
                        tableBorder,
                        isCompleted && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-shrink-0 w-20">
                        <span className={cn("font-mono font-bold text-sm", textPrimary)}>{m.trackId}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", textPrimary)}>{m.reason}</p>
                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className={textSecondary}>
                            <Calendar className="w-3 h-3 inline mr-0.5" />
                            {fmtDate(m.start)} — {fmtTime(m.end)}
                          </span>
                          <span className={textMuted}>Crew: {m.crew}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]",
                        isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {isCompleted ? <CheckCircle className="w-3 h-3 mr-0.5" /> : <Clock className="w-3 h-3 mr-0.5" />}
                        {m.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Maintenance summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <div className={cn("p-3 rounded-lg border text-center", tableBorder)}>
                  <p className={cn("text-xs mb-1", textMuted)}>Tracks Out of Service</p>
                  <p className={cn("text-2xl font-bold text-red-400")}>
                    {maintenance.filter((m) => m.status === "scheduled").length}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg border text-center", tableBorder)}>
                  <p className={cn("text-xs mb-1", textMuted)}>Completed Today</p>
                  <p className={cn("text-2xl font-bold text-emerald-400")}>
                    {maintenance.filter((m) => m.status === "completed").length}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg border text-center", tableBorder)}>
                  <p className={cn("text-xs mb-1", textMuted)}>Next Window</p>
                  <p className={cn("text-sm font-medium", textPrimary)}>
                    {(() => {
                      const next = maintenance.filter((m) => m.status === "scheduled").sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
                      return next ? `${next.trackId} @ ${fmtDate(next.start)}` : "None";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: Historical Analytics ═══════════ */}
        <TabsContent value="analytics" className="space-y-4">
          {/* KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Avg Utilization (24h)", value: `${avgUtil}%`, icon: TrendingUp, color: "text-blue-400" },
              { label: "Peak Utilization", value: `${peakHour.utilization}%`, icon: TrendingUp, color: "text-red-400" },
              { label: "Peak Hour", value: peakHour.hour, icon: Clock, color: "text-amber-400" },
              { label: "Total Movements (24h)", value: historical.reduce((s, h) => s + h.movements, 0).toString(), icon: ArrowRight, color: "text-emerald-400" },
            ].map((kpi, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", kpi.color.replace("text-", "bg-").replace("400", "500/10"))}>
                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                  </div>
                  <div>
                    <p className={cn("text-xs", textMuted)}>{kpi.label}</p>
                    <p className={cn("text-xl font-bold", textPrimary)}>{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Utilization chart (ASCII-style bar chart) */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-base flex items-center gap-2", textPrimary)}>
                <BarChart3 className="w-4 h-4 text-blue-400" /> 24-Hour Utilization Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {historical.map((h) => (
                  <div key={h.hour} className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-mono w-10 text-right flex-shrink-0", textMuted)}>{h.hour}</span>
                    <div className={cn("flex-1 h-4 rounded-sm overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-800")}>
                      <div
                        className={cn("h-full rounded-sm transition-all", UTIL_BAR_COLOR(h.utilization))}
                        style={{ width: `${h.utilization}%` }}
                        title={`${h.utilization}% utilization, ${h.movements} movements`}
                      />
                    </div>
                    <span className={cn("text-[10px] font-mono w-8 flex-shrink-0", UTILIZATION_COLOR(h.utilization))}>
                      {h.utilization}%
                    </span>
                    <span className={cn("text-[10px] font-mono w-6 flex-shrink-0 text-right", textMuted)}>
                      {h.movements}mv
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bottleneck identification */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-base flex items-center gap-2", textPrimary)}>
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Bottleneck Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    track: "CL-01",
                    issue: "Classification Track 1 consistently over 85% during 08:00-14:00",
                    severity: "high",
                    recommendation: "Consider re-routing overflow to CL-05/CL-06 during peak hours",
                  },
                  {
                    track: "AR-01",
                    issue: "Arrival A track dwell time averaging 4.2 hours (target: 2h)",
                    severity: "medium",
                    recommendation: "Increase classification crew staffing during morning arrival window",
                  },
                  {
                    track: "DP-01",
                    issue: "Departure 1 experiencing 35-min average delay in train builds",
                    severity: "medium",
                    recommendation: "Pre-stage power to reduce departure preparation time",
                  },
                  {
                    track: "IN-02",
                    issue: "Nucor Steel spur frequently at 100% — customer requesting additional spot days",
                    severity: "low",
                    recommendation: "Negotiate expanded unloading window or additional spur construction",
                  },
                ].map((b, i) => (
                  <div key={i} className={cn("p-4 rounded-lg border", tableBorder, b.severity === "high" && "border-l-4 border-l-red-500")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("font-mono font-bold text-sm", textPrimary)}>{b.track}</span>
                      <Badge variant="outline" className={cn("text-[10px]",
                        b.severity === "high" ? "bg-red-500/20 text-red-400" :
                        b.severity === "medium" ? "bg-amber-500/20 text-amber-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}>
                        {b.severity}
                      </Badge>
                    </div>
                    <p className={cn("text-sm", textSecondary)}>{b.issue}</p>
                    <p className={cn("text-xs mt-1.5 flex items-center gap-1", "text-indigo-400")}>
                      <Shield className="w-3 h-3" /> {b.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Track type usage breakdown */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={cn("text-base flex items-center gap-2", textPrimary)}>
                <Hash className="w-4 h-4 text-teal-400" /> Track Type Usage Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("rounded-lg border overflow-x-auto", tableBorder)}>
                <table className="w-full text-sm">
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Type</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Tracks</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Total Cap</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>In Use</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Avg Util</th>
                      <th className={cn("text-center px-4 py-2.5 font-medium", textSecondary)}>Avg Dwell</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", textSecondary)}>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableByType.map(([type, data]) => {
                      const used = data.total - data.avail;
                      const pct = Math.round((used / data.total) * 100);
                      const trackCount = tracks.filter((t) => t.type === type).length;
                      const dwellHours = type === "arrival" ? "3.8h" : type === "classification" ? "1.2h" : type === "departure" ? "2.1h" : type === "storage" ? "18.5h" : "36.2h";
                      return (
                        <tr key={type} className={cn("border-t", tableBorder, tableRowHover)}>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={cn("text-[10px]", TRACK_TYPE_COLORS[type])}>
                              {TRACK_TYPE_LABELS[type]}
                            </Badge>
                          </td>
                          <td className={cn("px-4 py-2.5 text-center font-medium", textPrimary)}>{trackCount}</td>
                          <td className={cn("px-4 py-2.5 text-center", textSecondary)}>{data.total}</td>
                          <td className={cn("px-4 py-2.5 text-center font-medium", textPrimary)}>{used}</td>
                          <td className={cn("px-4 py-2.5 text-center font-medium", UTILIZATION_COLOR(pct))}>{pct}%</td>
                          <td className={cn("px-4 py-2.5 text-center font-mono text-xs", textSecondary)}>{dwellHours}</td>
                          <td className="px-4 py-2.5 w-40">
                            <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                              <div className={cn("h-full rounded-full", UTIL_BAR_COLOR(pct))} style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
