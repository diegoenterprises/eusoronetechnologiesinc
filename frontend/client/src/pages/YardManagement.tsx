import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Warehouse, Clock, Truck, ArrowRightLeft, Calendar,
  CheckCircle, LogIn, LogOut, AlertTriangle, BarChart3, RefreshCw,
  ChevronRight, Timer,
  Users, Loader2, ArrowUpDown, Activity,
  Wrench, Shield, X, Grid3X3,
  DoorOpen, ClipboardList, Hash, Gauge,
} from "lucide-react";

// ─── Tab types ──────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "map"
  | "docks"
  | "trailers"
  | "crossdock"
  | "moves"
  | "gate"
  | "detention"
  | "analytics";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <Gauge className="w-4 h-4" /> },
  { key: "map", label: "Yard Map", icon: <Grid3X3 className="w-4 h-4" /> },
  { key: "docks", label: "Dock Schedule", icon: <DoorOpen className="w-4 h-4" /> },
  { key: "trailers", label: "Trailer Pool", icon: <Truck className="w-4 h-4" /> },
  { key: "crossdock", label: "Cross-Dock", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "moves", label: "Yard Moves", icon: <ArrowUpDown className="w-4 h-4" /> },
  { key: "gate", label: "Gate Log", icon: <ClipboardList className="w-4 h-4" /> },
  { key: "detention", label: "Detention", icon: <Timer className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

// ─── Status badge helper ────────────────────────────────────────────────────

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "xs" }) {
  const colors: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    occupied: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    loaded: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    empty: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    reserved: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    in_repair: "bg-red-500/15 text-red-400 border-red-500/20",
    maintenance: "bg-red-500/15 text-red-400 border-red-500/20",
    out_of_service: "bg-red-500/15 text-red-400 border-red-500/20",
    in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    planned: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    assigned: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    cancelled: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    critical: "bg-red-500/15 text-red-400 border-red-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    normal: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    busy: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    break: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    dropped: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    awaiting_pickup: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    loaded_waiting: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    empty_waiting: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    on_chassis: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    grounded: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    in_transit: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    at_port: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    in_use: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    cleaning: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    detained: "bg-red-500/15 text-red-400 border-red-500/20",
    entry: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    exit: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    urgent: "bg-red-500/15 text-red-400 border-red-500/20",
    high: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  const c = colors[status] || "bg-slate-500/15 text-slate-400 border-slate-500/20";
  const textSize = size === "xs" ? "text-xs" : "text-xs";
  const pad = size === "xs" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  return (
    <span className={cn("rounded-full border font-medium whitespace-nowrap", c, textSize, pad)}>
      {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

// ─── Capacity gauge ─────────────────────────────────────────────────────────

function CapacityGauge({ label, used, total, color = "amber" }: { label: string; used: number; total: number; color?: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const barColor = pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={isLight ? "text-slate-500" : "text-slate-400"}>{label}</span>
        <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{used}/{total} <span className="text-slate-500">({pct}%)</span></span>
      </div>
      <div className={`h-2 rounded-full ${isLight ? "bg-slate-200" : "bg-white/[0.06]"} overflow-hidden`}>
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent = "amber" }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const accentBorder = accent === "amber" ? "border-amber-500/20" : accent === "blue" ? "border-blue-500/20" : accent === "red" ? "border-red-500/20" : "border-emerald-500/20";
  const accentBg = accent === "amber" ? "text-amber-400" : accent === "blue" ? "text-blue-400" : accent === "red" ? "text-red-400" : "text-emerald-400";
  return (
    <div className={cn(isLight ? "bg-white border" : "bg-white/[0.03] border", "rounded-xl p-4 space-y-2", accentBorder)}>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
        <span className={accentBg}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Format helpers ─────────────────────────────────────────────────────────

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--";
  }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "--";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "--";
  }
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function YardManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedLocation, setSelectedLocation] = useState<string>("LOC-1");

  // ── Data queries ──────────────────────────────────────────────────────
  const dashboard = trpc.yardManagement.getYardDashboard.useQuery({ locationId: selectedLocation }, { refetchInterval: 30000 });
  const locations = trpc.yardManagement.getYardLocations.useQuery(undefined, { staleTime: 60000 });

  return (
    <div className={`min-h-screen ${isLight ? "text-slate-900 bg-slate-50" : "text-white"} px-4 py-6 max-w-[1600px] mx-auto`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight flex items-center gap-2 ${isLight ? "text-slate-900" : ""}`}>
            <Warehouse className="w-6 h-6 text-amber-400" />
            Yard Management
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>
            Command center for yard, dock, warehouse, and cross-dock operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Location selector */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className={`${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-white/[0.06] border border-white/[0.08] text-white"} rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500/40`}
          >
            {(locations.data?.locations || []).map((loc: any) => (
              <option key={loc.id} value={loc.id} className={isLight ? "bg-white" : "bg-slate-900"}>{loc.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeTab === tab.key
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : isLight
                  ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && <DashboardTab locationId={selectedLocation} data={dashboard.data} isLoading={dashboard.isLoading} />}
      {activeTab === "map" && <YardMapTab locationId={selectedLocation} />}
      {activeTab === "docks" && <DockScheduleTab locationId={selectedLocation} />}
      {activeTab === "trailers" && <TrailerPoolTab />}
      {activeTab === "crossdock" && <CrossDockTab />}
      {activeTab === "moves" && <YardMovesTab />}
      {activeTab === "gate" && <GateLogTab />}
      {activeTab === "detention" && <DetentionTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════

function DashboardTab({ locationId, data, isLoading }: { locationId: string; data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState message="No dashboard data available." />;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Yard Capacity" value={`${data.capacity.utilizationPct}%`} sub={`${data.capacity.occupied}/${data.capacity.total} spots`} icon={<Gauge className="w-4 h-4" />} accent="amber" />
        <StatCard label="Active Trailers" value={data.trailerSummary.total} sub={`${data.trailerSummary.loaded} loaded`} icon={<Truck className="w-4 h-4" />} accent="blue" />
        <StatCard label="Dock Doors" value={`${data.dockSummary.occupied}/${data.dockSummary.total}`} sub={`${data.dockSummary.available} available`} icon={<DoorOpen className="w-4 h-4" />} accent="emerald" />
        <StatCard label="Pending Moves" value={data.activeMoves} sub="Yard move queue" icon={<ArrowUpDown className="w-4 h-4" />} accent="amber" />
        <StatCard label="Avg Dwell Time" value={`${data.avgDwellTimeHours}h`} sub="Per trailer" icon={<Timer className="w-4 h-4" />} accent="blue" />
        <StatCard label="Detention Alerts" value={data.detentionAlerts} sub="Active warnings" icon={<AlertTriangle className="w-4 h-4" />} accent="red" />
      </div>

      {/* Capacity gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5 space-y-4`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Gauge className="w-4 h-4 text-amber-400" />
            Capacity Overview
          </h3>
          <CapacityGauge label="Yard Spots" used={data.capacity.occupied} total={data.capacity.total} />
          <CapacityGauge label="Dock Doors" used={data.dockSummary.occupied} total={data.dockSummary.total} />
          <CapacityGauge label="Loaded Trailers" used={data.trailerSummary.loaded} total={data.trailerSummary.total} />
        </div>

        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5 space-y-3`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Activity className="w-4 h-4 text-amber-400" />
            Trailer Status Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Loaded", count: data.trailerSummary.loaded, color: "text-blue-400" },
              { label: "Empty", count: data.trailerSummary.empty, color: "text-slate-400" },
              { label: "In Repair", count: data.trailerSummary.inRepair, color: "text-red-400" },
              { label: "Reserved", count: data.trailerSummary.reserved, color: "text-purple-400" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2 p-2 ${isLight ? "bg-slate-50" : "bg-white/[0.02]"} rounded-lg`}>
                <div className={cn("w-2 h-2 rounded-full", item.color.replace("text-", "bg-"))} />
                <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{item.label}</span>
                <span className={cn("text-sm font-bold ml-auto", item.color)}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-3 flex items-center gap-2`}>
            <LogIn className="w-4 h-4 text-emerald-400" />
            Gate Activity Today
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{data.todayGateEntries}</p>
              <p className="text-xs text-slate-500">Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{data.todayGateExits}</p>
              <p className="text-xs text-slate-500">Exits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{data.pendingCheckIns}</p>
              <p className="text-xs text-slate-500">Pending Check-Ins</p>
            </div>
          </div>
        </div>

        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-3 flex items-center gap-2`}>
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            Cross-Dock
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-amber-400">{data.crossDockActive}</p>
              <p className="text-xs text-slate-500">Active Operations</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{data.avgTurnTimeMinutes}</p>
              <p className="text-xs text-slate-500">Avg Turn (min)</p>
            </div>
          </div>
        </div>

        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-3 flex items-center gap-2`}>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Check-Out Queue
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-orange-400">{data.pendingCheckOuts}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// YARD MAP TAB
// ═══════════════════════════════════════════════════════════════════════════

function YardMapTab({ locationId }: { locationId: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const yardMap = trpc.yardManagement.getYardMap.useQuery({ locationId }, { refetchInterval: 15000 });
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  if (yardMap.isLoading) return <LoadingState />;
  const map = yardMap.data;
  if (!map) return <EmptyState message="No yard map data." />;

  const spotColors: Record<string, string> = {
    empty: "bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30",
    occupied: "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30",
    reserved: "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30",
    maintenance: "bg-red-500/20 border-red-500/30 hover:bg-red-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
          <Grid3X3 className="w-4 h-4 text-amber-400" />
          Interactive Yard Map
        </h3>
        <div className="flex items-center gap-3 text-xs">
          {[
            { label: "Empty", color: "bg-emerald-500" },
            { label: "Occupied", color: "bg-amber-500" },
            { label: "Reserved", color: "bg-purple-500" },
            { label: "Maintenance", color: "bg-red-500" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
              <span className={isLight ? "text-slate-500" : "text-slate-400"}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 overflow-x-auto`}>
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${map.cols}, minmax(56px, 1fr))` }}>
          {map.spots.map((spot: any) => (
            <button
              key={spot.id}
              onClick={() => setSelectedSpot(spot)}
              className={cn(
                "relative h-12 rounded-md border text-xs font-mono flex flex-col items-center justify-center transition-all cursor-pointer",
                spotColors[spot.status] || spotColors.empty,
                selectedSpot?.id === spot.id && "ring-2 ring-amber-400"
              )}
              title={`${spot.label} - ${spot.status}${spot.trailerNumber ? ` (${spot.trailerNumber})` : ""}`}
            >
              <span className="font-semibold text-white/80">{spot.label}</span>
              {spot.trailerNumber && (
                <span className="text-xs text-white/50 truncate max-w-full px-0.5">{spot.trailerNumber}</span>
              )}
              {spot.type === "dock" && <DoorOpen className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white/30" />}
              {spot.type === "repair" && <Wrench className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white/30" />}
            </button>
          ))}
        </div>
      </div>

      {/* Selected spot detail */}
      {selectedSpot && (
        <div className={`${isLight ? "bg-white border border-amber-200" : "bg-white/[0.03] border border-amber-500/20"} rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Spot {selectedSpot.label}</h4>
            <button onClick={() => setSelectedSpot(null)} className={isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-500 hover:text-white"}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><span className="text-slate-500">Type:</span> <span className={`${isLight ? "text-slate-900" : "text-white"} ml-1`}>{selectedSpot.type}</span></div>
            <div><span className="text-slate-500">Status:</span> <StatusBadge status={selectedSpot.status} size="xs" /></div>
            <div><span className="text-slate-500">Trailer:</span> <span className={`${isLight ? "text-slate-900" : "text-white"} ml-1`}>{selectedSpot.trailerNumber || "None"}</span></div>
            <div><span className="text-slate-500">Position:</span> <span className={`${isLight ? "text-slate-900" : "text-white"} ml-1`}>Row {selectedSpot.row + 1}, Col {selectedSpot.col + 1}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK SCHEDULE TAB
// ═══════════════════════════════════════════════════════════════════════════

function DockScheduleTab({ locationId }: { locationId: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const dockSchedule = trpc.yardManagement.getDockSchedule.useQuery({ locationId, date: scheduleDate }, { refetchInterval: 30000 });

  if (dockSchedule.isLoading) return <LoadingState />;
  const schedule = dockSchedule.data;
  if (!schedule) return <EmptyState message="No dock schedule data." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
          <Calendar className="w-4 h-4 text-amber-400" />
          Dock Door Schedule
        </h3>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          className={`${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-white/[0.06] border border-white/[0.08] text-white"} rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-500/40`}
        />
      </div>

      <div className="space-y-3">
        {schedule.docks.map((dock: any) => (
          <div key={dock.dockId} className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{dock.dockName}</span>
                <span className="text-xs text-slate-500 uppercase">{dock.type}</span>
              </div>
              <StatusBadge status={dock.status} size="xs" />
            </div>

            {dock.appointments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No appointments scheduled</p>
            ) : (
              <div className="space-y-2">
                {dock.appointments.map((apt: any) => (
                  <div key={apt.id} className={`flex items-center gap-3 p-2 ${isLight ? "bg-slate-50" : "bg-white/[0.02]"} rounded-lg text-xs`}>
                    <div className={cn("w-1 h-8 rounded-full", apt.type === "inbound" ? "bg-emerald-500" : "bg-orange-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"} truncate`}>{apt.carrierName}</span>
                        <StatusBadge status={apt.status} size="xs" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{fmtTime(apt.scheduledStart)} - {fmtTime(apt.scheduledEnd)}</span>
                        <span className="text-slate-600">|</span>
                        <span>{apt.trailerNumber}</span>
                        {apt.loadId && <><span className="text-slate-600">|</span><span>{apt.loadId}</span></>}
                      </div>
                    </div>
                    <span className={cn("text-xs uppercase font-medium px-1.5 py-0.5 rounded", apt.type === "inbound" ? "text-emerald-400 bg-emerald-500/10" : "text-orange-400 bg-orange-500/10")}>
                      {apt.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAILER POOL TAB
// ═══════════════════════════════════════════════════════════════════════════

function TrailerPoolTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const trailerPool = trpc.yardManagement.getTrailerPool.useQuery(undefined, { refetchInterval: 30000 });

  if (trailerPool.isLoading) return <LoadingState />;
  const pool = trailerPool.data;
  if (!pool) return <EmptyState message="No trailer pool data." />;

  const filtered = statusFilter === "all" ? pool.trailers : pool.trailers.filter((t: any) => t.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: "Total", count: pool.summary.total, color: "text-white", filter: "all" },
          { label: "Available", count: pool.summary.available, color: "text-emerald-400", filter: "available" },
          { label: "Loaded", count: pool.summary.loaded, color: "text-blue-400", filter: "loaded" },
          { label: "Empty", count: pool.summary.empty, color: "text-slate-400", filter: "empty" },
          { label: "In Repair", count: pool.summary.inRepair, color: "text-red-400", filter: "in_repair" },
          { label: "Reserved", count: pool.summary.reserved, color: "text-purple-400", filter: "reserved" },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => setStatusFilter(s.filter)}
            className={cn(
              "p-3 rounded-xl border text-center transition-all",
              statusFilter === s.filter
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
            )}
          >
            <p className={cn("text-xl font-bold", s.color)}>{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Trailer grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((trailer: any) => (
          <div key={trailer.id} className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 hover:border-amber-500/20 transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{trailer.trailerNumber}</span>
              <StatusBadge status={trailer.status} size="xs" />
            </div>
            <div className={`space-y-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              <div className="flex justify-between"><span>Type:</span><span className={isLight ? "text-slate-900" : "text-white"}>{trailer.type.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between"><span>Make:</span><span className={isLight ? "text-slate-900" : "text-white"}>{trailer.make} ({trailer.year})</span></div>
              <div className="flex justify-between"><span>Length:</span><span className={isLight ? "text-slate-900" : "text-white"}>{trailer.length}ft</span></div>
              <div className="flex justify-between"><span>Spot:</span><span className={isLight ? "text-slate-900" : "text-white"}>{trailer.spotId}</span></div>
              <div className="flex justify-between"><span>Condition:</span><StatusBadge status={trailer.condition} size="xs" /></div>
              {trailer.loadId && <div className="flex justify-between"><span>Load:</span><span className="text-amber-400">{trailer.loadId}</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-DOCK TAB
// ═══════════════════════════════════════════════════════════════════════════

function CrossDockTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const crossDock = trpc.yardManagement.getCrossDockOperations.useQuery(undefined, { refetchInterval: 15000 });

  if (crossDock.isLoading) return <LoadingState />;
  const data = crossDock.data;
  if (!data) return <EmptyState message="No cross-dock data." />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Operations" value={data.summary.total} icon={<ArrowRightLeft className="w-4 h-4" />} accent="amber" />
        <StatCard label="In Progress" value={data.summary.inProgress} icon={<Activity className="w-4 h-4" />} accent="blue" />
        <StatCard label="Planned" value={data.summary.planned} icon={<Calendar className="w-4 h-4" />} accent="emerald" />
        <StatCard label="Avg Transfer" value={`${data.summary.avgTransferTimeMinutes}m`} icon={<Timer className="w-4 h-4" />} accent="amber" />
      </div>

      {/* Operations list */}
      <div className="space-y-3">
        {data.operations.map((op: any) => (
          <div key={op.id} className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{op.id}</span>
                <StatusBadge status={op.status} size="xs" />
                {op.priority === "high" && <StatusBadge status="urgent" size="xs" />}
              </div>
              {op.status === "in_progress" && (
                <span className="text-xs text-slate-500">
                  {op.palletsTransferred}/{op.palletCount} pallets
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Inbound */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium mb-1 uppercase">Inbound</p>
                <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{op.inboundCarrier}</p>
                <p className="text-slate-500">Trailer: {op.inboundTrailer}</p>
                <p className="text-slate-500">Dock: {op.inboundDock}</p>
              </div>

              {/* Transfer */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">{op.palletCount}</p>
                    <p className="text-xs text-slate-500">pallets</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              {/* Outbound */}
              <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                <p className="text-xs text-orange-400 font-medium mb-1 uppercase">Outbound</p>
                <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{op.outboundCarrier}</p>
                <p className="text-slate-500">Trailer: {op.outboundTrailer}</p>
                <p className="text-slate-500">Dock: {op.outboundDock}</p>
              </div>
            </div>

            {op.status === "in_progress" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((op.palletsTransferred / op.palletCount) * 100)}%</span>
                </div>
                <div className={`h-1.5 rounded-full ${isLight ? "bg-slate-200" : "bg-white/[0.06]"} overflow-hidden`}>
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${(op.palletsTransferred / op.palletCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// YARD MOVES TAB
// ═══════════════════════════════════════════════════════════════════════════

function YardMovesTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const moves = trpc.yardManagement.getYardMoveQueue.useQuery(undefined, { refetchInterval: 10000 });

  if (moves.isLoading) return <LoadingState />;
  const data = moves.data;
  if (!data) return <EmptyState message="No yard move data." />;

  return (
    <div className="space-y-4">
      {/* Summary + Hostlers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Pending" value={data.summary.pending} icon={<Clock className="w-4 h-4" />} accent="amber" />
          <StatCard label="Assigned" value={data.summary.assigned} icon={<Users className="w-4 h-4" />} accent="blue" />
          <StatCard label="In Progress" value={data.summary.inProgress} icon={<Activity className="w-4 h-4" />} accent="emerald" />
          <StatCard label="Avg Time" value={`${data.summary.avgCompletionMinutes}m`} icon={<Timer className="w-4 h-4" />} accent="amber" />
        </div>

        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4`}>
          <h4 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-3 flex items-center gap-2`}>
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Hostlers / Spotters
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {data.hostlers.map((h: any) => (
              <div key={h.id} className={`flex items-center gap-2 p-2 ${isLight ? "bg-slate-50" : "bg-white/[0.02]"} rounded-lg`}>
                <div className={cn("w-2 h-2 rounded-full", h.status === "available" ? "bg-emerald-400" : h.status === "busy" ? "bg-amber-400" : "bg-slate-400")} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isLight ? "text-slate-900" : "text-white"} truncate`}>{h.name}</p>
                  <p className="text-xs text-slate-500">{h.movesCompleted} moves today</p>
                </div>
                <StatusBadge status={h.status} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Move queue */}
      <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Move ID</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Trailer</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">From</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">To</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Assigned To</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Reason</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Est.</th>
              </tr>
            </thead>
            <tbody>
              {data.moves.map((move: any) => (
                <tr key={move.id} className={`border-b ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-white/[0.04] hover:bg-white/[0.02]"}`}>
                  <td className="py-3 px-4 font-mono text-amber-400">{move.id}</td>
                  <td className={`py-3 px-4 ${isLight ? "text-slate-900" : "text-white"}`}>{move.trailerNumber}</td>
                  <td className="py-3 px-4 text-slate-300">{move.fromSpot}</td>
                  <td className="py-3 px-4 text-slate-300">{move.toSpot}</td>
                  <td className="py-3 px-4"><StatusBadge status={move.priority} size="xs" /></td>
                  <td className="py-3 px-4"><StatusBadge status={move.status} size="xs" /></td>
                  <td className="py-3 px-4 text-slate-300">{move.assignedTo || "--"}</td>
                  <td className={`py-3 px-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{move.reason.replace(/_/g, " ")}</td>
                  <td className={`py-3 px-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{move.estimatedMinutes}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE LOG TAB
// ═══════════════════════════════════════════════════════════════════════════

function GateLogTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [gateFilter, setGateFilter] = useState<"all" | "entry" | "exit">("all");
  const gateLog = trpc.yardManagement.getGateLog.useQuery({ type: gateFilter }, { refetchInterval: 15000 });

  if (gateLog.isLoading) return <LoadingState />;
  const data = gateLog.data;
  if (!data) return <EmptyState message="No gate log data." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <ClipboardList className="w-4 h-4 text-amber-400" />
            Gate Activity Log
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-medium">{data.summary.totalEntries} entries</span>
            <span className="text-slate-600">|</span>
            <span className="text-orange-400 font-medium">{data.summary.totalExits} exits</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["all", "entry", "exit"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setGateFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-all",
                gateFilter === f ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-white border border-transparent"
              )}
            >
              {f === "all" ? "All" : f === "entry" ? "Entries" : "Exits"}
            </button>
          ))}
        </div>
      </div>

      <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Time</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Gate</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Driver</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Carrier</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Trailer</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Tractor</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Purpose</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Load</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry: any) => (
                <tr key={entry.id} className={`border-b ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-white/[0.04] hover:bg-white/[0.02]"}`}>
                  <td className="py-3 px-4 text-slate-300">{fmtDateTime(entry.timestamp)}</td>
                  <td className="py-3 px-4">
                    <span className={cn("flex items-center gap-1", entry.type === "entry" ? "text-emerald-400" : "text-orange-400")}>
                      {entry.type === "entry" ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {entry.type}
                    </span>
                  </td>
                  <td className={`py-3 px-4 ${isLight ? "text-slate-900" : "text-white"}`}>{entry.gate}</td>
                  <td className={`py-3 px-4 ${isLight ? "text-slate-900" : "text-white"}`}>{entry.driverName}</td>
                  <td className="py-3 px-4 text-slate-300">{entry.carrierName}</td>
                  <td className="py-3 px-4 text-slate-300">{entry.trailerNumber}</td>
                  <td className="py-3 px-4 text-slate-300">{entry.tractorNumber || "--"}</td>
                  <td className="py-3 px-4"><StatusBadge status={entry.purpose} size="xs" /></td>
                  <td className="py-3 px-4 text-amber-400 font-mono">{entry.loadId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETENTION TAB
// ═══════════════════════════════════════════════════════════════════════════

function DetentionTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const detention = trpc.yardManagement.getDetentionTracking.useQuery(undefined, { refetchInterval: 30000 });

  if (detention.isLoading) return <LoadingState />;
  const data = detention.data;
  if (!data) return <EmptyState message="No detention data." />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Detentions" value={data.summary.activeDetentions} icon={<Timer className="w-4 h-4" />} accent="amber" />
        <StatCard label="Total Charges" value={fmtCurrency(data.summary.totalAccruedCharges)} icon={<Hash className="w-4 h-4" />} accent="red" />
        <StatCard label="Avg Detention" value={`${data.summary.avgDetentionHours}h`} icon={<Clock className="w-4 h-4" />} accent="amber" />
        <StatCard label="Critical" value={data.summary.criticalCount} icon={<AlertTriangle className="w-4 h-4" />} accent="red" />
      </div>

      {/* Detention records */}
      <div className="space-y-3">
        {data.records.map((rec: any) => (
          <div key={rec.id} className={cn(
            "bg-white/[0.03] border rounded-xl p-4",
            rec.status === "critical" ? "border-red-500/30" : rec.status === "warning" ? "border-amber-500/20" : "border-white/[0.06]"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className={cn("w-4 h-4", rec.status === "critical" ? "text-red-400" : rec.status === "warning" ? "text-amber-400" : "text-emerald-400")} />
                <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{rec.trailerNumber}</span>
                <StatusBadge status={rec.status} size="xs" />
                <span className="text-xs text-slate-500 uppercase">{rec.type}</span>
              </div>
              <span className="text-sm font-bold text-red-400">{fmtCurrency(rec.accruedCharge)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div><span className="text-slate-500">Carrier:</span><br /><span className={isLight ? "text-slate-900" : "text-white"}>{rec.carrierName}</span></div>
              <div><span className="text-slate-500">Arrival:</span><br /><span className={isLight ? "text-slate-900" : "text-white"}>{fmtDateTime(rec.arrivalTime)}</span></div>
              <div><span className="text-slate-500">Free Time:</span><br /><span className={isLight ? "text-slate-900" : "text-white"}>{rec.freeTimeHours}h</span></div>
              <div><span className="text-slate-500">Total Time:</span><br /><span className={isLight ? "text-slate-900" : "text-white"}>{rec.totalTimeHours}h</span></div>
              <div><span className="text-slate-500">Detention:</span><br /><span className="text-red-400 font-bold">{rec.detentionHours}h @ {fmtCurrency(rec.rate)}/hr</span></div>
            </div>

            {/* Detention time bar */}
            <div className="mt-3">
              <div className={`h-2 rounded-full ${isLight ? "bg-slate-200" : "bg-white/[0.06]"} overflow-hidden flex`}>
                <div className="h-full bg-emerald-500" style={{ width: `${(rec.freeTimeHours / rec.totalTimeHours) * 100}%` }} />
                <div className={cn("h-full", rec.status === "critical" ? "bg-red-500" : "bg-amber-500")} style={{ width: `${(rec.detentionHours / rec.totalTimeHours) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>Free time</span>
                <span>Detention</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const analytics = trpc.yardManagement.getYardAnalytics.useQuery({ period }, { staleTime: 30000 });
  const compliance = trpc.yardManagement.getAppointmentCompliance.useQuery({ period }, { staleTime: 30000 });

  if (analytics.isLoading) return <LoadingState />;
  const aData = analytics.data;
  const cData = compliance.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Yard Analytics
        </h3>
        <div className="flex gap-1">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-all capitalize",
                period === p ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-white border border-transparent"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregated KPIs */}
      {aData?.aggregated && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Avg Dwell Time" value={`${aData.aggregated.avgDwellTimeMinutes}m`} icon={<Timer className="w-4 h-4" />} accent="amber" />
          <StatCard label="Avg Turn Time" value={`${aData.aggregated.avgTurnTimeMinutes}m`} icon={<RefreshCw className="w-4 h-4" />} accent="blue" />
          <StatCard label="Yard Utilization" value={`${aData.aggregated.avgYardUtilization}%`} icon={<Gauge className="w-4 h-4" />} accent="amber" />
          <StatCard label="Dock Utilization" value={`${aData.aggregated.avgDockUtilization}%`} icon={<DoorOpen className="w-4 h-4" />} accent="emerald" />
          <StatCard label="On-Time Appt" value={`${aData.aggregated.avgOnTimeAppointmentPct}%`} icon={<CheckCircle className="w-4 h-4" />} accent="emerald" />
        </div>
      )}

      {/* Daily metrics chart (bar representation) */}
      {aData?.dailyMetrics && (
        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h4 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-4`}>Daily Yard Utilization</h4>
          <div className="flex items-end gap-2 h-40">
            {aData.dailyMetrics.map((day: any, i: number) => {
              const pct = day.yardUtilizationPct;
              const barColor = pct > 85 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{pct}%</span>
                  <div className="w-full rounded-t-sm bg-white/[0.04] flex-1 relative">
                    <div className={cn("absolute bottom-0 left-0 right-0 rounded-t-sm", barColor)} style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-600">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Totals row */}
      {aData?.aggregated && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold text-emerald-400">{aData.aggregated.totalGateEntries}</p>
            <p className="text-xs text-slate-500">Gate Entries</p>
          </div>
          <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold text-orange-400">{aData.aggregated.totalGateExits}</p>
            <p className="text-xs text-slate-500">Gate Exits</p>
          </div>
          <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold text-amber-400">{aData.aggregated.totalYardMoves}</p>
            <p className="text-xs text-slate-500">Yard Moves</p>
          </div>
          <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold text-red-400">{aData.aggregated.totalDetentionIncidents}</p>
            <p className="text-xs text-slate-500">Detention Incidents</p>
          </div>
        </div>
      )}

      {/* Appointment Compliance */}
      {cData && (
        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h4 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-4 flex items-center gap-2`}>
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Appointment Compliance by Carrier
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Carrier</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Scheduled</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">On Time</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Early</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Late</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">No Show</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {cData.carrierBreakdown.map((c: any) => (
                  <tr key={c.carrierName} className={`border-b ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-white/[0.04] hover:bg-white/[0.02]"}`}>
                    <td className={`py-2.5 px-3 ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{c.carrierName}</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{c.scheduled}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">{c.onTime}</td>
                    <td className="py-2.5 px-3 text-center text-sky-400">{c.early}</td>
                    <td className="py-2.5 px-3 text-center text-amber-400">{c.late}</td>
                    <td className="py-2.5 px-3 text-center text-red-400">{c.noShow}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("font-bold", c.compliancePct >= 90 ? "text-emerald-400" : c.compliancePct >= 80 ? "text-amber-400" : "text-red-400")}>
                        {c.compliancePct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall Compliance</span>
            <span className="text-lg font-bold text-amber-400">{cData.overallCompliancePct}%</span>
          </div>
        </div>
      )}

      {/* Peak hours */}
      {cData?.peakHours && (
        <div className={`${isLight ? "bg-white border border-slate-200" : "bg-white/[0.03] border border-white/[0.06]"} rounded-xl p-5`}>
          <h4 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-white"} mb-4`}>Appointment Distribution by Hour</h4>
          <div className="flex items-end gap-3 h-24">
            {cData.peakHours.map((ph: any, i: number) => {
              const maxCount = Math.max(...cData.peakHours.map((p: any) => p.count));
              const pct = maxCount > 0 ? (ph.count / maxCount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-amber-400 font-medium">{ph.count}</span>
                  <div className="w-full rounded-t-sm bg-white/[0.04] flex-1 relative">
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-amber-500/60" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap">{ph.hour.split("-")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function LoadingState() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      <span className={`ml-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Loading yard data...</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
      <Warehouse className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
