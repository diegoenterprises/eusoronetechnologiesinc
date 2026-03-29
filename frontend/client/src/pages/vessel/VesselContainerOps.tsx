/**
 * VESSEL CONTAINER OPS — Container Operations Center
 * For VESSEL_OPERATOR & PORT_MASTER: tracking, inventory,
 * empty returns, demurrage/detention accrual management
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Container, Search, MapPin, Ship, Clock,
  Package, ArrowRight, RefreshCw, Filter,
  CheckCircle2, AlertTriangle, XCircle, Eye,
  DollarSign, Timer, Calendar, TrendingUp,
  ArrowUpRight, ArrowDownRight, BarChart3,
  Truck, TrainFront, Globe, Warehouse,
  RotateCcw, ChevronRight, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Status Maps ─── */
const CONTAINER_STATUS: Record<string, { bg: string; lightBg: string; label: string }> = {
  in_transit: { bg: "bg-emerald-500/20 text-emerald-400", lightBg: "bg-emerald-100 text-emerald-700", label: "In Transit" },
  at_port: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700", label: "At Port" },
  on_vessel: { bg: "bg-cyan-500/20 text-cyan-400", lightBg: "bg-cyan-100 text-cyan-700", label: "On Vessel" },
  on_rail: { bg: "bg-purple-500/20 text-purple-400", lightBg: "bg-purple-100 text-purple-700", label: "On Rail" },
  on_truck: { bg: "bg-orange-500/20 text-orange-400", lightBg: "bg-orange-100 text-orange-700", label: "On Truck" },
  at_yard: { bg: "bg-teal-500/20 text-teal-400", lightBg: "bg-teal-100 text-teal-700", label: "At Yard" },
  customs_hold: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700", label: "Customs Hold" },
  empty_available: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-200 text-slate-600", label: "Empty Available" },
  empty_returned: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700", label: "Returned" },
  damaged: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700", label: "Damaged" },
};

const OWNERSHIP_TYPE: Record<string, { bg: string; lightBg: string }> = {
  owned: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  leased: { bg: "bg-purple-500/20 text-purple-400", lightBg: "bg-purple-100 text-purple-700" },
  pool: { bg: "bg-teal-500/20 text-teal-400", lightBg: "bg-teal-100 text-teal-700" },
  shipper_owned: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700" },
};

const DEMURRAGE_STATUS: Record<string, { bg: string; lightBg: string }> = {
  within_free: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  accruing: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
  invoiced: { bg: "bg-purple-500/20 text-purple-400", lightBg: "bg-purple-100 text-purple-700" },
  paid: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-200 text-slate-600" },
  disputed: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700" },
};

/* ─── Empty Defaults ─── */
const EMPTY_TRACKING: any[] = [];
const EMPTY_INVENTORY: any[] = [];
const EMPTY_RETURNS: any[] = [];

const RETURN_STATUS: Record<string, { bg: string; lightBg: string }> = {
  scheduled: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  in_transit: { bg: "bg-cyan-500/20 text-cyan-400", lightBg: "bg-cyan-100 text-cyan-700" },
  returned: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  overdue: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
};

const CONDITION_STATUS: Record<string, { bg: string; lightBg: string }> = {
  good: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  minor_damage: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700" },
  needs_cleaning: { bg: "bg-orange-500/20 text-orange-400", lightBg: "bg-orange-100 text-orange-700" },
  major_damage: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
};

const EMPTY_DEMURRAGE: any[] = [];

/* ─── Helpers ─── */
function fmtCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function daysUntil(d: string) {
  if (!d) return 999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  vessel: <Ship className="w-3.5 h-3.5 text-cyan-400" />,
  rail: <TrainFront className="w-3.5 h-3.5 text-blue-400" />,
  truck: <Truck className="w-3.5 h-3.5 text-orange-400" />,
};

/* ────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                    */
/* ────────────────────────────────────────────────── */
export default function VesselContainerOps() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("tracking");
  const [search, setSearch] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("all");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [returnFilter, setReturnFilter] = useState("all");
  const [demurrageFilter, setDemurrageFilter] = useState("all");

  /* tRPC queries */
  const containerQ = (trpc as any).vesselShipments?.getContainerTracking?.useQuery?.() ?? { data: null, isLoading: false };
  const demurrageQ = (trpc as any).vesselShipments?.getVesselDemurrage?.useQuery?.() ?? { data: null, isLoading: false };

  const trackingData = containerQ.data?.containers ?? EMPTY_TRACKING;
  const inventoryData = containerQ.data?.inventory ?? EMPTY_INVENTORY;
  const returnsData = containerQ.data?.returns ?? EMPTY_RETURNS;
  const demurrageData = demurrageQ.data?.demurrage ?? EMPTY_DEMURRAGE;

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

  /* Filtered data */
  const filteredTracking = useMemo(() => {
    let list = trackingData;
    if (trackingFilter !== "all") list = list.filter(c => c.status === trackingFilter);
    if (search && tab === "tracking") {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.number.toLowerCase().includes(q) ||
        c.vessel?.toLowerCase().includes(q) ||
        c.booking?.toLowerCase().includes(q) ||
        c.shipper?.toLowerCase().includes(q) ||
        c.commodity?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [trackingFilter, search, tab]);

  const filteredInventory = useMemo(() => {
    if (inventoryFilter === "all") return inventoryData;
    return inventoryData.filter(i => i.ownership === inventoryFilter);
  }, [inventoryFilter]);

  const filteredReturns = useMemo(() => {
    let list = returnsData;
    if (returnFilter !== "all") list = list.filter(r => r.status === returnFilter);
    if (search && tab === "returns") {
      const q = search.toLowerCase();
      list = list.filter(r => r.number.toLowerCase().includes(q) || r.returnTo.toLowerCase().includes(q));
    }
    return list;
  }, [returnFilter, search, tab]);

  const filteredDemurrage = useMemo(() => {
    let list = demurrageData;
    if (demurrageFilter !== "all") {
      if (demurrageFilter === "demurrage") list = list.filter(d => d.type === "demurrage");
      else if (demurrageFilter === "detention") list = list.filter(d => d.type === "detention");
      else list = list.filter(d => d.status === demurrageFilter);
    }
    return list;
  }, [demurrageFilter]);

  /* Summary KPIs */
  const totalTracked = trackingData.length;
  const totalInventory = inventoryData.reduce((s, i) => s + i.total, 0);
  const pendingReturns = returnsData.filter(r => r.status !== "returned").length;
  const totalDemurrage = demurrageData.reduce((s, d) => s + d.accrued, 0);

  return (
    <div className={cn("min-h-screen p-6 space-y-6", bg)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-teal-100 to-cyan-100" : "bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
          )}>
            <Container className="w-7 h-7 text-teal-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Container Operations</h1>
            <p className={cn("text-sm", muted)}>
              Equipment tracking, inventory &amp; demurrage management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
            <Input
              placeholder="Search containers..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className={cn("pl-9 w-56 h-9 text-sm rounded-lg", inputBg)}
            />
          </div>
        </div>
      </div>

      {/* ─── Summary KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-cyan-600" : "text-cyan-400")}>{totalTracked}</div>
          <div className={cn("text-xs", muted)}>Containers Tracked</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-blue-600" : "text-blue-400")}>{totalInventory.toLocaleString()}</div>
          <div className={cn("text-xs", muted)}>Total Equipment</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", isLight ? "text-amber-600" : "text-amber-400")}>{pendingReturns}</div>
          <div className={cn("text-xs", muted)}>Pending Returns</div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("text-2xl font-bold", totalDemurrage > 0 ? (isLight ? "text-red-600" : "text-red-400") : text)}>{fmtCurrency(totalDemurrage)}</div>
          <div className={cn("text-xs", muted)}>Demurrage/Detention</div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("h-9", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="tracking" className="text-sm px-4 h-8">Tracking</TabsTrigger>
          <TabsTrigger value="inventory" className="text-sm px-4 h-8">Inventory</TabsTrigger>
          <TabsTrigger value="returns" className="text-sm px-4 h-8">Returns</TabsTrigger>
          <TabsTrigger value="demurrage" className="text-sm px-4 h-8">Demurrage</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── TAB: Tracking ─── */}
      {tab === "tracking" && (
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
            <div className="flex items-center gap-2">
              <Globe className={cn("w-4 h-4", isLight ? "text-cyan-600" : "text-cyan-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Container Tracking</h2>
              <Badge variant="secondary" className="text-xs">{filteredTracking.length}</Badge>
            </div>
            <select
              value={trackingFilter}
              onChange={e => setTrackingFilter(e.target.value)}
              className={cn("text-xs rounded-lg px-3 py-1.5 border", isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300")}
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="on_vessel">On Vessel</option>
              <option value="at_port">At Port</option>
              <option value="on_rail">On Rail</option>
              <option value="on_truck">On Truck</option>
              <option value="customs_hold">Customs Hold</option>
              <option value="at_yard">At Yard</option>
            </select>
          </div>
          <div className="p-4 space-y-3">
            {filteredTracking.map(c => {
              const st = CONTAINER_STATUS[c.status] || CONTAINER_STATUS.in_transit;
              return (
                <div key={c.number} className={cn(
                  "p-4 rounded-lg border transition-colors cursor-pointer",
                  c.status === "customs_hold"
                    ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/30")
                    : (isLight ? "bg-white border-slate-100 hover:border-blue-200" : "bg-slate-800/40 border-slate-700/40 hover:border-cyan-500/30")
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={cn("font-mono text-sm font-bold", isLight ? "text-blue-700" : "text-blue-400")}>{c.number}</span>
                      <Badge className={cn("text-[10px]", isLight ? st.lightBg : st.bg)}>{st.label}</Badge>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-800 border-slate-700 text-slate-400")}>
                        {c.size} {c.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {MODE_ICONS[c.mode]}
                      <span className={cn("text-xs capitalize", muted)}>{c.mode}</span>
                    </div>
                  </div>
                  <div className={cn("text-xs mb-2", muted)}>{c.lastEvent}</div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <MapPin className="w-3 h-3" /> {c.origin} <ArrowRight className="w-3 h-3 mx-0.5" /> {c.destination}
                    </div>
                    {c.vessel !== "—" && (
                      <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                        <Ship className="w-3 h-3" /> {c.vessel} / {c.voyage}
                      </div>
                    )}
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <Clock className="w-3 h-3" /> ETA: {c.eta}
                    </div>
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <Package className="w-3 h-3" /> {c.commodity}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredTracking.length === 0 && (
              <div className={cn("text-center py-8", muted)}>No containers match your criteria</div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Inventory ─── */}
      {tab === "inventory" && (
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
            <div className="flex items-center gap-2">
              <Warehouse className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Equipment Inventory</h2>
            </div>
            <select
              value={inventoryFilter}
              onChange={e => setInventoryFilter(e.target.value)}
              className={cn("text-xs rounded-lg px-3 py-1.5 border", isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300")}
            >
              <option value="all">All Ownership</option>
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
              <option value="pool">Pool</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Type", "Ownership", "Total", "Available", "In Use", "Maintenance", "Off-Hire", "Avg Age (yr)", "Utilization"].map(h => (
                    <th key={h} className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, i) => {
                  const utilPct = Math.round((item.inUse / item.total) * 100);
                  const ownSt = OWNERSHIP_TYPE[item.ownership] || OWNERSHIP_TYPE.owned;
                  return (
                    <tr key={i} className={cn("border-b", tableBorder, tableHover)}>
                      <td className={cn("px-4 py-3 font-mono text-xs font-bold", text)}>{item.type}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] capitalize", isLight ? ownSt.lightBg : ownSt.bg)}>{item.ownership}</Badge>
                      </td>
                      <td className={cn("px-4 py-3 font-bold", text)}>{item.total.toLocaleString()}</td>
                      <td className={cn("px-4 py-3 font-medium", isLight ? "text-green-600" : "text-green-400")}>{item.available.toLocaleString()}</td>
                      <td className={cn("px-4 py-3", text)}>{item.inUse.toLocaleString()}</td>
                      <td className={cn("px-4 py-3", item.maintenance > 0 ? (isLight ? "text-amber-600" : "text-amber-400") : muted)}>{item.maintenance}</td>
                      <td className={cn("px-4 py-3", item.offHire > 0 ? (isLight ? "text-red-600" : "text-red-400") : muted)}>{item.offHire}</td>
                      <td className={cn("px-4 py-3", muted)}>{item.avgAge}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-16 h-1.5 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                            <div
                              className={cn("h-full rounded-full", utilPct >= 80 ? "bg-emerald-500" : utilPct >= 60 ? "bg-blue-500" : "bg-amber-500")}
                              style={{ width: `${utilPct}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-medium", text)}>{utilPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn("px-5 py-3 border-t flex items-center gap-6", tableBorder)}>
            <span className={cn("text-xs font-medium", text)}>
              Total: {totalInventory.toLocaleString()} units
            </span>
            <span className={cn("text-xs", isLight ? "text-green-600" : "text-green-400")}>
              Available: {inventoryData.reduce((s, i) => s + i.available, 0).toLocaleString()}
            </span>
            <span className={cn("text-xs", isLight ? "text-amber-600" : "text-amber-400")}>
              Maintenance: {inventoryData.reduce((s, i) => s + i.maintenance, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* ─── TAB: Returns ─── */}
      {tab === "returns" && (
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
            <div className="flex items-center gap-2">
              <RotateCcw className={cn("w-4 h-4", isLight ? "text-teal-600" : "text-teal-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Empty Returns</h2>
              <Badge variant="secondary" className="text-xs">{filteredReturns.length}</Badge>
            </div>
            <select
              value={returnFilter}
              onChange={e => setReturnFilter(e.target.value)}
              className={cn("text-xs rounded-lg px-3 py-1.5 border", isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300")}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_transit">In Transit</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Container", "Size", "Return To", "Status", "Scheduled", "Last Cargo", "Condition", "Notes"].map(h => (
                    <th key={h} className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map(r => {
                  const retSt = RETURN_STATUS[r.status] || RETURN_STATUS.scheduled;
                  const condSt = CONDITION_STATUS[r.condition] || CONDITION_STATUS.good;
                  return (
                    <tr key={r.number} className={cn(
                      "border-b",
                      tableBorder,
                      r.status === "overdue"
                        ? (isLight ? "bg-red-50" : "bg-red-500/5")
                        : "",
                      tableHover
                    )}>
                      <td className={cn("px-4 py-3 font-mono text-xs font-bold", text)}>{r.number}</td>
                      <td className={cn("px-4 py-3 text-xs", muted)}>{r.size}</td>
                      <td className={cn("px-4 py-3 text-xs", text)}>{r.returnTo}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px]", isLight ? retSt.lightBg : retSt.bg)}>{r.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-xs",
                        r.status === "overdue" ? (isLight ? "text-red-600 font-medium" : "text-red-400 font-medium") : muted
                      )}>
                        {fmtDate(r.scheduledDate)}
                        {r.status === "overdue" && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </td>
                      <td className={cn("px-4 py-3 text-xs", muted)}>{r.lastCargo}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px]", isLight ? condSt.lightBg : condSt.bg)}>{r.condition.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className={cn("px-4 py-3 text-xs max-w-[200px] truncate", muted)}>{r.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn("px-5 py-3 border-t flex items-center gap-4", tableBorder)}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-red-600" : "text-red-400")} />
              <span className={cn("text-xs", muted)}>
                {returnsData.filter(r => r.status === "overdue").length} overdue
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className={cn("w-3.5 h-3.5", isLight ? "text-green-600" : "text-green-400")} />
              <span className={cn("text-xs", muted)}>
                {returnsData.filter(r => r.status === "returned").length} returned
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-amber-600" : "text-amber-400")} />
              <span className={cn("text-xs", muted)}>
                {returnsData.filter(r => r.condition !== "good").length} need attention
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Demurrage ─── */}
      {tab === "demurrage" && (
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
            <div className="flex items-center gap-2">
              <DollarSign className={cn("w-4 h-4", isLight ? "text-red-600" : "text-red-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Demurrage &amp; Detention</h2>
              {totalDemurrage > 0 && (
                <Badge className={cn("text-[10px]", isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")}>
                  {fmtCurrency(totalDemurrage)} accrued
                </Badge>
              )}
            </div>
            <select
              value={demurrageFilter}
              onChange={e => setDemurrageFilter(e.target.value)}
              className={cn("text-xs rounded-lg px-3 py-1.5 border", isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300")}
            >
              <option value="all">All</option>
              <option value="demurrage">Demurrage Only</option>
              <option value="detention">Detention Only</option>
              <option value="accruing">Accruing</option>
              <option value="within_free">Within Free Time</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Container", "Type", "Customer", "Port", "Free Time", "Days Used", "Daily Rate", "Accrued", "Status"].map(h => (
                    <th key={h} className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDemurrage.map((d, i) => {
                  const dmSt = DEMURRAGE_STATUS[d.status] || DEMURRAGE_STATUS.within_free;
                  const overFree = d.daysUsed > d.freeDays;
                  return (
                    <tr key={i} className={cn(
                      "border-b",
                      tableBorder,
                      d.status === "accruing"
                        ? (isLight ? "bg-red-50" : "bg-red-500/5")
                        : "",
                      tableHover
                    )}>
                      <td className={cn("px-4 py-3 font-mono text-xs font-bold", text)}>{d.container}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          "text-[10px] capitalize",
                          d.type === "demurrage"
                            ? (isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-400")
                            : (isLight ? "bg-orange-100 text-orange-700" : "bg-orange-500/20 text-orange-400")
                        )}>
                          {d.type}
                        </Badge>
                      </td>
                      <td className={cn("px-4 py-3 text-xs", text)}>{d.customer}</td>
                      <td className={cn("px-4 py-3 text-xs", muted)}>{d.port}</td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", muted)}>
                        {fmtDate(d.freeTimeStart)} — {fmtDate(d.freeTimeEnd)} ({d.freeDays}d)
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-xs font-medium",
                        overFree ? (isLight ? "text-red-600" : "text-red-400") : text
                      )}>
                        {d.daysUsed}d {overFree && <span className="text-[10px]">({d.daysUsed - d.freeDays}d over)</span>}
                      </td>
                      <td className={cn("px-4 py-3 text-xs", muted)}>{fmtCurrency(d.dailyRate)}/day</td>
                      <td className={cn(
                        "px-4 py-3 text-xs font-bold",
                        d.accrued > 0 ? (isLight ? "text-red-600" : "text-red-400") : text
                      )}>
                        {fmtCurrency(d.accrued)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px]", isLight ? dmSt.lightBg : dmSt.bg)}>{d.status.replace(/_/g, " ")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn("px-5 py-3 border-t flex items-center justify-between flex-wrap gap-4", tableBorder)}>
            <div className="flex items-center gap-4">
              <div className={cn("text-xs font-medium", isLight ? "text-red-700" : "text-red-400")}>
                Total Accrued: {fmtCurrency(totalDemurrage)}
              </div>
              <div className={cn("text-xs", muted)}>
                Demurrage: {fmtCurrency(demurrageData.filter(d => d.type === "demurrage").reduce((s, d) => s + d.accrued, 0))}
              </div>
              <div className={cn("text-xs", muted)}>
                Detention: {fmtCurrency(demurrageData.filter(d => d.type === "detention").reduce((s, d) => s + d.accrued, 0))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", muted)}>
                {demurrageData.filter(d => d.status === "accruing").length} actively accruing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div className={cn("text-center text-xs py-4", muted)}>
        Container data synced from terminal &amp; carrier systems &bull; Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}