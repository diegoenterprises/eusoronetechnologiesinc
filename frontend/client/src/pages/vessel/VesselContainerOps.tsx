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

/* ─── Mock Data ─── */
const MOCK_TRACKING = [
  { number: "MSKU4821093", size: "40HC", type: "Dry", status: "in_transit", mode: "vessel", vessel: "MSC AURORA", voyage: "FA402E", booking: "BK-240901", origin: "Los Angeles, CA", destination: "Shanghai, CN", lastEvent: "Loaded on vessel — departed LA", lastPort: "Los Angeles", eventTime: "2026-04-02 14:30", eta: "2026-04-18", shipper: "TechCo Inc.", commodity: "Electronics" },
  { number: "MSKU4821094", size: "40HC", type: "Dry", status: "in_transit", mode: "vessel", vessel: "MSC AURORA", voyage: "FA402E", booking: "BK-240901", origin: "Los Angeles, CA", destination: "Shanghai, CN", lastEvent: "At sea — Pacific crossing", lastPort: "Los Angeles", eventTime: "2026-04-03 08:00", eta: "2026-04-18", shipper: "TechCo Inc.", commodity: "Electronics" },
  { number: "CMAU7283641", size: "40HC", type: "Dry", status: "in_transit", mode: "vessel", vessel: "CMA CGM MARCO POLO", voyage: "FE418N", booking: "BK-240903", origin: "Savannah, GA", destination: "Hamburg, DE", lastEvent: "Mid-Atlantic transit", lastPort: "Savannah", eventTime: "2026-03-29 06:00", eta: "2026-04-12", shipper: "AmeriMach Corp", commodity: "Machinery" },
  { number: "OOLU9381205", size: "40HC", type: "Dry", status: "at_port", mode: "truck", vessel: "EVERGREEN TRITON", voyage: "TA421E", booking: "BK-240905", origin: "Newark, NJ", destination: "Felixstowe, UK", lastEvent: "Discharged — awaiting pickup", lastPort: "Felixstowe", eventTime: "2026-04-05 08:00", eta: "—", shipper: "MegaRetail Inc", commodity: "Consumer Goods" },
  { number: "OOLU9381206", size: "40HC", type: "Dry", status: "customs_hold", mode: "vessel", vessel: "EVERGREEN TRITON", voyage: "TA421E", booking: "BK-240905", origin: "Newark, NJ", destination: "Felixstowe, UK", lastEvent: "Customs exam — document review", lastPort: "Felixstowe", eventTime: "2026-04-05 10:30", eta: "—", shipper: "MegaRetail Inc", commodity: "Consumer Goods" },
  { number: "ZIMU6420173", size: "40HC", type: "Dry", status: "customs_hold", mode: "vessel", vessel: "ZIM SAMSON", voyage: "AT419N", booking: "BK-240907", origin: "Charleston, SC", destination: "Antwerp, BE", lastEvent: "Customs hold — physical exam required", lastPort: "Antwerp", eventTime: "2026-04-03 14:00", eta: "—", shipper: "SouthernTex", commodity: "Textiles" },
  { number: "HLCU3928571", size: "20ST", type: "Dry", status: "on_rail", mode: "rail", vessel: "—", voyage: "—", booking: "BK-240910", origin: "Los Angeles, CA", destination: "Chicago, IL", lastEvent: "Rail transit — BNSF intermodal", lastPort: "Barstow", eventTime: "2026-04-04 12:00", eta: "2026-04-07", shipper: "MidwestDist LLC", commodity: "General Cargo" },
  { number: "EISU5820194", size: "40RF", type: "Reefer", status: "on_vessel", mode: "vessel", vessel: "HAPAG BERLIN", voyage: "SA403S", booking: "BK-240904", origin: "Houston, TX", destination: "Santos, BR", lastEvent: "Loaded — reefer set to -18C", lastPort: "Houston", eventTime: "2026-04-07 16:00", eta: "2026-04-22", shipper: "FreshCargo Int'l", commodity: "Perishables" },
  { number: "TCLU8401735", size: "20TK", type: "Tank", status: "at_yard", mode: "truck", vessel: "—", voyage: "—", booking: "BK-240912", origin: "Houston, TX", destination: "Houston, TX", lastEvent: "At terminal yard — cleaning scheduled", lastPort: "Houston", eventTime: "2026-04-02 09:00", eta: "—", shipper: "GulfChem Corp", commodity: "Industrial Chemicals" },
  { number: "NYKU7293815", size: "40HC", type: "Dry", status: "on_truck", mode: "truck", vessel: "—", voyage: "—", booking: "BK-240915", origin: "Newark, NJ", destination: "Edison, NJ", lastEvent: "On truck — last mile delivery", lastPort: "Newark", eventTime: "2026-04-05 07:00", eta: "2026-04-05", shipper: "EastCoast Retail", commodity: "Consumer Electronics" },
];

const MOCK_INVENTORY = [
  { type: "20ST", ownership: "owned", total: 12500, available: 3200, inUse: 8400, maintenance: 400, offHire: 500, avgAge: 6.2 },
  { type: "40HC", ownership: "owned", total: 18200, available: 4800, inUse: 12200, maintenance: 600, offHire: 600, avgAge: 4.8 },
  { type: "40RF", ownership: "owned", total: 3400, available: 800, inUse: 2400, maintenance: 120, offHire: 80, avgAge: 3.5 },
  { type: "20ST", ownership: "leased", total: 5000, available: 1200, inUse: 3500, maintenance: 150, offHire: 150, avgAge: 8.1 },
  { type: "40HC", ownership: "leased", total: 8600, available: 2100, inUse: 6000, maintenance: 250, offHire: 250, avgAge: 7.2 },
  { type: "40RF", ownership: "leased", total: 1800, available: 400, inUse: 1300, maintenance: 60, offHire: 40, avgAge: 5.4 },
  { type: "20TK", ownership: "pool", total: 800, available: 200, inUse: 540, maintenance: 30, offHire: 30, avgAge: 4.0 },
  { type: "40OT", ownership: "pool", total: 600, available: 150, inUse: 400, maintenance: 20, offHire: 30, avgAge: 5.8 },
  { type: "20FL", ownership: "pool", total: 400, available: 100, inUse: 270, maintenance: 15, offHire: 15, avgAge: 6.5 },
];

const MOCK_RETURNS = [
  { number: "MSKU3871024", size: "40HC", returnTo: "Los Angeles — APM Terminal", status: "scheduled", scheduledDate: "2026-04-06", lastCargo: "Electronics", condition: "good", notes: "" },
  { number: "CMAU5192837", size: "40HC", returnTo: "Savannah — GPA Garden City", status: "in_transit", scheduledDate: "2026-04-05", lastCargo: "Textiles", condition: "good", notes: "Drayage by JB Hunt" },
  { number: "OOLU2847193", size: "20ST", returnTo: "Newark — APM Maher Terminal", status: "returned", scheduledDate: "2026-04-03", lastCargo: "General Cargo", condition: "good", notes: "" },
  { number: "ZIMU4019283", size: "40HC", returnTo: "Charleston — Wando Welch Terminal", status: "scheduled", scheduledDate: "2026-04-08", lastCargo: "Furniture", condition: "minor_damage", notes: "Dent on left panel — repair needed" },
  { number: "HLCU9281374", size: "20ST", returnTo: "Houston — Barbours Cut Terminal", status: "overdue", scheduledDate: "2026-04-01", lastCargo: "Chemicals", condition: "needs_cleaning", notes: "Tank wash required before return" },
  { number: "EISU7382041", size: "40RF", returnTo: "Long Beach — ITS Terminal", status: "in_transit", scheduledDate: "2026-04-06", lastCargo: "Perishables", condition: "good", notes: "Reefer unit to be inspected on return" },
  { number: "TCLU2938174", size: "20TK", returnTo: "Houston — Enterprise Terminal", status: "returned", scheduledDate: "2026-04-02", lastCargo: "Industrial Solvents", condition: "needs_cleaning", notes: "Cleaned and steam-washed" },
  { number: "NYKU8291034", size: "40HC", returnTo: "Newark — PNCT Terminal", status: "scheduled", scheduledDate: "2026-04-09", lastCargo: "Consumer Electronics", condition: "good", notes: "" },
];

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

const MOCK_DEMURRAGE = [
  { container: "OOLU9381205", booking: "BK-240905", port: "Felixstowe, UK", type: "demurrage", freeTimeStart: "2026-04-05", freeTimeEnd: "2026-04-12", daysUsed: 4, freeDays: 7, dailyRate: 150, accrued: 0, status: "within_free", customer: "MegaRetail Inc" },
  { container: "OOLU9381206", booking: "BK-240905", port: "Felixstowe, UK", type: "demurrage", freeTimeStart: "2026-04-05", freeTimeEnd: "2026-04-12", daysUsed: 4, freeDays: 7, dailyRate: 150, accrued: 0, status: "within_free", customer: "MegaRetail Inc" },
  { container: "ZIMU6420173", booking: "BK-240907", port: "Antwerp, BE", type: "demurrage", freeTimeStart: "2026-03-30", freeTimeEnd: "2026-04-04", daysUsed: 9, freeDays: 5, dailyRate: 175, accrued: 700, status: "accruing", customer: "SouthernTex" },
  { container: "HLCU9281374", booking: "BK-240910", port: "Houston, TX", type: "detention", freeTimeStart: "2026-03-28", freeTimeEnd: "2026-04-01", daysUsed: 10, freeDays: 4, dailyRate: 125, accrued: 750, status: "accruing", customer: "MidwestDist LLC" },
  { container: "MSKU3871024", booking: "BK-240901", port: "Los Angeles, CA", type: "detention", freeTimeStart: "2026-04-02", freeTimeEnd: "2026-04-08", daysUsed: 3, freeDays: 6, dailyRate: 140, accrued: 0, status: "within_free", customer: "TechCo Inc." },
  { container: "CMAU5192837", booking: "BK-240903", port: "Savannah, GA", type: "detention", freeTimeStart: "2026-03-25", freeTimeEnd: "2026-03-30", daysUsed: 11, freeDays: 5, dailyRate: 130, accrued: 780, status: "invoiced", customer: "AmeriMach Corp" },
  { container: "NYKU8291034", booking: "BK-240915", port: "Newark, NJ", type: "demurrage", freeTimeStart: "2026-04-03", freeTimeEnd: "2026-04-10", daysUsed: 2, freeDays: 7, dailyRate: 160, accrued: 0, status: "within_free", customer: "EastCoast Retail" },
  { container: "EISU5820194", booking: "BK-240904", port: "Houston, TX", type: "detention", freeTimeStart: "2026-04-07", freeTimeEnd: "2026-04-13", daysUsed: 1, freeDays: 6, dailyRate: 175, accrued: 0, status: "within_free", customer: "FreshCargo Int'l" },
];

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
    let list = MOCK_TRACKING;
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
    if (inventoryFilter === "all") return MOCK_INVENTORY;
    return MOCK_INVENTORY.filter(i => i.ownership === inventoryFilter);
  }, [inventoryFilter]);

  const filteredReturns = useMemo(() => {
    let list = MOCK_RETURNS;
    if (returnFilter !== "all") list = list.filter(r => r.status === returnFilter);
    if (search && tab === "returns") {
      const q = search.toLowerCase();
      list = list.filter(r => r.number.toLowerCase().includes(q) || r.returnTo.toLowerCase().includes(q));
    }
    return list;
  }, [returnFilter, search, tab]);

  const filteredDemurrage = useMemo(() => {
    let list = MOCK_DEMURRAGE;
    if (demurrageFilter !== "all") {
      if (demurrageFilter === "demurrage") list = list.filter(d => d.type === "demurrage");
      else if (demurrageFilter === "detention") list = list.filter(d => d.type === "detention");
      else list = list.filter(d => d.status === demurrageFilter);
    }
    return list;
  }, [demurrageFilter]);

  /* Summary KPIs */
  const totalTracked = MOCK_TRACKING.length;
  const totalInventory = MOCK_INVENTORY.reduce((s, i) => s + i.total, 0);
  const pendingReturns = MOCK_RETURNS.filter(r => r.status !== "returned").length;
  const totalDemurrage = MOCK_DEMURRAGE.reduce((s, d) => s + d.accrued, 0);

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
              Available: {MOCK_INVENTORY.reduce((s, i) => s + i.available, 0).toLocaleString()}
            </span>
            <span className={cn("text-xs", isLight ? "text-amber-600" : "text-amber-400")}>
              Maintenance: {MOCK_INVENTORY.reduce((s, i) => s + i.maintenance, 0).toLocaleString()}
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
                {MOCK_RETURNS.filter(r => r.status === "overdue").length} overdue
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className={cn("w-3.5 h-3.5", isLight ? "text-green-600" : "text-green-400")} />
              <span className={cn("text-xs", muted)}>
                {MOCK_RETURNS.filter(r => r.status === "returned").length} returned
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-amber-600" : "text-amber-400")} />
              <span className={cn("text-xs", muted)}>
                {MOCK_RETURNS.filter(r => r.condition !== "good").length} need attention
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
                Demurrage: {fmtCurrency(MOCK_DEMURRAGE.filter(d => d.type === "demurrage").reduce((s, d) => s + d.accrued, 0))}
              </div>
              <div className={cn("text-xs", muted)}>
                Detention: {fmtCurrency(MOCK_DEMURRAGE.filter(d => d.type === "detention").reduce((s, d) => s + d.accrued, 0))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", muted)}>
                {MOCK_DEMURRAGE.filter(d => d.status === "accruing").length} actively accruing
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