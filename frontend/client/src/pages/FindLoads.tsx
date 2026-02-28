/**
 * EUSOBOARD — FIND LOADS MARKETPLACE
 * Premium load marketplace with KPI strip, compact/expanded views,
 * sort controls, earnings estimates, bookmarks, and market intelligence.
 * State-of-the-art | Theme-aware | Investor-grade.
 */

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getLoadTitle, getEquipmentLabel, isHazmatLoad } from "@/lib/loadUtils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, MapPin, Package, Truck, Eye, Navigation, Building2,
  Droplets, FlaskConical, AlertTriangle, Gavel, SlidersHorizontal,
  ChevronLeft, ChevronRight, RefreshCw, TrendingUp, DollarSign,
  ArrowUpDown, LayoutGrid, LayoutList, Bookmark, BookmarkCheck,
  Target, Flame, Clock, Star, ArrowUp, ArrowDown, Percent
} from "lucide-react";
import { useLocation } from "wouter";
import LoadCargoAnimation from "@/components/LoadCargoAnimation";

type EquipFilter = "all" | "tanker" | "flatbed" | "dry_van" | "reefer" | "hopper" | "cryogenic" | "hazmat" | "pneumatic" | "end_dump" | "intermodal_chassis" | "curtain_side";
type SortKey = "rate_desc" | "rate_asc" | "rpm_desc" | "distance_asc" | "distance_desc" | "newest" | "pickup";
type ViewMode = "expanded" | "compact";

const PLATFORM_FEE_PCT = 0.08;
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekDays(baseDate: Date) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) { const dd = new Date(monday); dd.setDate(monday.getDate() + i); days.push(dd); }
  return days;
}
function formatMonthYear(d: Date) { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export default function FindLoads() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [equipFilter, setEquipFilter] = useState<EquipFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("expanded");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const loadsQuery = (trpc as any).loadBoard.search.useQuery({ limit: 100 });
  const statsQuery = (trpc as any).loadBoard.getStats.useQuery();
  const mlDemand = (trpc as any).ml?.forecastDemand?.useQuery?.({}) || { data: null };
  const mlStatus = (trpc as any).ml?.getModelStatus?.useQuery?.() || { data: null };

  const allLoads = (loadsQuery.data as any)?.loads || [];
  const marketStats = (loadsQuery.data as any)?.marketStats;
  const boardStats = statsQuery.data as any;
  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);
  const shiftWeek = (dir: number) => { const d = new Date(weekBase); d.setDate(d.getDate() + dir * 7); setWeekBase(d); setSelectedDate(d); };
  const toggleBookmark = useCallback((id: string) => { setBookmarks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, []);

  const filteredLoads = useMemo(() => {
    let result = allLoads.filter((load: any) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || load.origin?.city?.toLowerCase().includes(s) || load.destination?.city?.toLowerCase().includes(s) || load.origin?.state?.toLowerCase().includes(s) || load.destination?.state?.toLowerCase().includes(s) || load.loadNumber?.toLowerCase().includes(s) || load.commodityName?.toLowerCase().includes(s);
      const matchesEquip = equipFilter === "all" || load.equipmentType === equipFilter || (equipFilter === "hazmat" && load.hazmat);
      let matchesDate = true;
      if (dateFilterActive) {
        const raw = load.pickupDate || load.createdAt;
        if (raw) { const ld = new Date(raw); matchesDate = isSameDay(ld, selectedDate); }
      }
      return matchesSearch && matchesEquip && matchesDate;
    });
    // Sort
    const rpm = (l: any) => l.distance > 0 && l.rate > 0 ? l.rate / l.distance : 0;
    result.sort((a: any, b: any) => {
      switch (sortKey) {
        case "rate_desc": return (b.rate || 0) - (a.rate || 0);
        case "rate_asc": return (a.rate || 0) - (b.rate || 0);
        case "rpm_desc": return rpm(b) - rpm(a);
        case "distance_asc": return (a.distance || 0) - (b.distance || 0);
        case "distance_desc": return (b.distance || 0) - (a.distance || 0);
        case "pickup": return new Date(a.pickupDate || a.createdAt || 0).getTime() - new Date(b.pickupDate || b.createdAt || 0).getTime();
        default: return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
    return result;
  }, [allLoads, searchTerm, equipFilter, dateFilterActive, selectedDate, sortKey]);

  const getCargoIcon = (ct: string) => {
    if (ct === "petroleum" || ct === "liquid") return <Droplets className="w-4 h-4" />;
    if (ct === "chemicals" || ct === "hazmat") return <FlaskConical className="w-4 h-4" />;
    if (ct === "gas") return <AlertTriangle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  // Derived market metrics
  const totalMarketValue = allLoads.reduce((s: number, l: any) => s + (l.rate || 0), 0);
  const avgRPM = allLoads.length > 0 ? allLoads.reduce((s: number, l: any) => s + (l.distance > 0 && l.rate > 0 ? l.rate / l.distance : 0), 0) / allLoads.length : 0;
  const hazmatCount = allLoads.filter((l: any) => l.hazmat).length;

  const equipTabs: { id: EquipFilter; label: string }[] = [
    { id: "all", label: `All (${allLoads.length})` },
    { id: "tanker", label: "Tanker" }, { id: "flatbed", label: "Flatbed" },
    { id: "dry_van", label: "Dry Van" }, { id: "reefer", label: "Reefer" },
    { id: "hopper", label: "Bulk/Hopper" }, { id: "pneumatic", label: "Pneumatic" },
    { id: "end_dump", label: "End Dump" }, { id: "cryogenic", label: "Cryogenic" },
    { id: "intermodal_chassis", label: "Intermodal" }, { id: "curtain_side", label: "Curtain Side" },
    { id: "hazmat", label: "Hazmat" },
  ];

  const sortOpts: { id: SortKey; label: string }[] = [
    { id: "newest", label: "Newest" }, { id: "rate_desc", label: "Rate: High→Low" },
    { id: "rate_asc", label: "Rate: Low→High" }, { id: "rpm_desc", label: "$/Mile: Best" },
    { id: "distance_asc", label: "Distance: Short" }, { id: "distance_desc", label: "Distance: Long" },
    { id: "pickup", label: "Pickup: Soonest" },
  ];

  const isLight = L;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              EusoBoard
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Target className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Marketplace</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>
            Discover and bid on available loads — real-time market intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border", L ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")}>
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500 text-sm font-bold">{filteredLoads.length} Available</span>
          </div>
          {bookmarks.size > 0 && (
            <div className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border", L ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30")}>
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-500 text-xs font-bold">{bookmarks.size}</span>
            </div>
          )}
          <Button variant="outline" size="sm" className={cn("rounded-lg", L ? "border-slate-200 hover:bg-slate-50" : "border-slate-600 hover:bg-slate-700")} onClick={() => loadsQuery.refetch()}>
            <RefreshCw className={cn("w-4 h-4", loadsQuery.isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Market KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Total Loads", v: allLoads.length, I: Package, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Market Value", v: `$${(totalMarketValue / 1000).toFixed(0)}K`, I: DollarSign, c: "text-emerald-500", b: "from-emerald-500/10 to-emerald-600/5" },
          { l: "Avg Rate", v: marketStats?.avgRate ? `$${marketStats.avgRate.toLocaleString()}` : "\u2014", I: TrendingUp, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
          { l: "Avg $/Mile", v: avgRPM > 0 ? `$${avgRPM.toFixed(2)}` : "\u2014", I: Percent, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
          { l: "Hazmat", v: hazmatCount, I: Flame, c: "text-red-500", b: "from-red-500/10 to-red-600/5" },
          { l: "Bids Placed", v: boardStats?.bidsReceived ?? "\u2014", I: Gavel, c: "text-amber-500", b: "from-amber-500/10 to-amber-600/5" },
        ].map((k) => (
          <div key={k.l} className={cn("rounded-2xl p-3 bg-gradient-to-br border", `${k.b} border-slate-200/60 dark:border-slate-700/30`)}>
            <k.I className={cn("w-4 h-4 mb-1", k.c)} />
            <p className={cn("text-xl font-bold", k.c)}>{k.v}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{k.l}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className={cn("relative rounded-xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search by origin, destination, commodity, or load #..." className={cn("pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0", L ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")} />
      </div>

      {/* ── Sort + View Controls ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {sortOpts.map((s) => (
            <button key={s.id} onClick={() => setSortKey(s.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all", sortKey === s.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode("expanded")} className={cn("p-2 rounded-lg transition-all", viewMode === "expanded" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : L ? "text-slate-400 hover:bg-slate-100" : "text-slate-400 hover:bg-slate-700")}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("compact")} className={cn("p-2 rounded-lg transition-all", viewMode === "compact" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : L ? "text-slate-400 hover:bg-slate-100" : "text-slate-400 hover:bg-slate-700")}>
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Week Date Picker ── */}
      <div className={cn("rounded-xl border p-4", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftWeek(-1)} className={cn("p-1.5 rounded-lg transition-colors", L ? "hover:bg-slate-100" : "hover:bg-slate-700")}>
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-semibold", L ? "text-slate-700" : "text-white")}>{formatMonthYear(selectedDate)}</p>
            {dateFilterActive ? (
              <button onClick={() => setDateFilterActive(false)} className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-medium">Show All</button>
            ) : (
              <button onClick={() => setDateFilterActive(true)} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", L ? "border-slate-300 text-slate-500 hover:bg-slate-100" : "border-slate-600 text-slate-400 hover:bg-slate-700")}>Showing All</button>
            )}
          </div>
          <button onClick={() => shiftWeek(1)} className={cn("p-1.5 rounded-lg transition-colors", L ? "hover:bg-slate-100" : "hover:bg-slate-700")}>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button key={i} onClick={() => { setSelectedDate(day); setDateFilterActive(true); }} className={cn("flex flex-col items-center py-2 rounded-xl transition-all text-center", isSelected ? "bg-gradient-to-b from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-purple-500/25" : isToday ? L ? "bg-slate-100 text-slate-800" : "bg-slate-700 text-white" : L ? "hover:bg-slate-50 text-slate-600" : "hover:bg-slate-700/50 text-slate-400")}>
                <span className="text-[10px] font-medium mb-0.5">{DAY_LABELS[day.getDay()]}</span>
                <span className={cn("text-base font-bold", isSelected ? "text-white" : "")}>{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Equipment Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
        {equipTabs.map((tab) => (
          <button key={tab.id} onClick={() => setEquipFilter(tab.id)} className={cn("px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all", equipFilter === tab.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ML Demand Intelligence ── */}
      {mlDemand.data && mlDemand.data.topLanes?.length > 0 && (
        <div className={cn("rounded-xl border p-4", L ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20")}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className={cn("text-xs font-bold uppercase tracking-wider", L ? "text-purple-600" : "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent")}>ESANG AI Demand Intelligence</span>
            {mlStatus.data && <span className="ml-auto text-[10px] text-slate-500">{mlStatus.data.totalLoadsAnalyzed} loads analyzed / {mlStatus.data.totalLanes} lanes</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mlDemand.data.topLanes.slice(0, 6).map((lane: any, i: number) => (
              <div key={i} className={cn("flex-shrink-0 px-3 py-2 rounded-lg border text-center min-w-[100px]", L ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/40")}>
                <p className={cn("text-xs font-bold", L ? "text-slate-700" : "text-white")}>{lane.lane}</p>
                <p className={cn("text-[10px]", L ? "text-slate-500" : "text-slate-400")}>{lane.volume} loads</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${lane.trend === "RISING" ? "bg-green-500/15 text-green-500" : lane.trend === "DECLINING" ? "bg-red-500/15 text-red-500" : "bg-slate-500/15 text-slate-400"}`}>
                  {lane.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Load Cards ── */}
      {loadsQuery.isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}</div>
      ) : filteredLoads.length === 0 ? (
        <div className={cn("text-center py-16 rounded-2xl border", L ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", L ? "bg-slate-100" : "bg-slate-700/50")}>
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", L ? "text-slate-600" : "text-slate-300")}>No loads available</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for new opportunities</p>
        </div>
      ) : viewMode === "compact" ? (
        /* ═══ COMPACT VIEW ═══ */
        <div className="space-y-2">
          {filteredLoads.map((load: any) => {
            const oc = load.origin?.city || "Origin";
            const os = load.origin?.state || "";
            const dc = load.destination?.city || "Dest";
            const ds = load.destination?.state || "";
            const rpm = load.distance > 0 && load.rate > 0 ? (load.rate / load.distance).toFixed(2) : null;
            const est = load.rate > 0 ? Math.round(load.rate * (1 - PLATFORM_FEE_PCT)) : 0;
            const bm = bookmarks.has(load.id);
            return (
              <div key={load.id} className={cn("rounded-xl border p-3 flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group", L ? "bg-white border-slate-200 hover:border-blue-300" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/40")} onClick={() => setLocation(`/load/${load.id}`)}>
                {/* Cargo Icon */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", load.hazmat ? "bg-red-500/15" : load.cargoType === "petroleum" ? "bg-orange-500/15" : "bg-blue-500/15")}>
                  {getCargoIcon(load.cargoType)}
                </div>
                {/* Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm font-bold truncate", L ? "text-slate-800" : "text-white")}>{oc}{os ? `, ${os}` : ""}</span>
                    <ArrowDown className="w-3 h-3 text-slate-400 rotate-[-90deg] flex-shrink-0" />
                    <span className={cn("text-sm font-bold truncate", L ? "text-slate-800" : "text-white")}>{dc}{ds ? `, ${ds}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">#{load.loadNumber || load.id.slice(0, 6)}</span>
                    {load.distance > 0 && <span className="text-[10px] text-slate-400">{load.distance} mi</span>}
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", L ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-300")}>{getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass)}</span>
                    {load.hazmatClass && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-500/15 text-red-500">HM {load.hazmatClass}</span>}
                  </div>
                </div>
                {/* Rate Column */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2 justify-end">
                    {rpm && <span className="text-[10px] font-semibold text-emerald-500">${rpm}/mi</span>}
                    {est > 0 && <span className="text-[10px] text-slate-400">~${est.toLocaleString()} net</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleBookmark(load.id)} className={cn("p-1.5 rounded-lg transition-all", bm ? "text-amber-500" : "text-slate-400 hover:text-amber-400")}>
                    {bm ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg text-xs h-8 px-3 font-bold" onClick={() => setLocation(`/bids/submit/${load.id}`)}>
                    <Gavel className="w-3 h-3 mr-1" /> Bid
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══ EXPANDED VIEW — Premium Load Cards ═══ */
        <div className="space-y-5">
          {filteredLoads.map((load: any) => {
            const oc = load.origin?.city || "Origin";
            const os = load.origin?.state || "";
            const dc = load.destination?.city || "Destination";
            const ds = load.destination?.state || "";
            const hazmat = isHazmatLoad(load);
            const rpm = load.distance > 0 && load.rate > 0 ? (load.rate / load.distance).toFixed(2) : null;
            const estNet = load.rate > 0 ? Math.round(load.rate * (1 - PLATFORM_FEE_PCT)) : 0;
            const platformFee = load.rate > 0 ? Math.round(load.rate * PLATFORM_FEE_PCT) : 0;
            const bm = bookmarks.has(load.id);
            const pickupStr = load.pickupDate ? new Date(load.pickupDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : load.createdAt ? new Date(load.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "TBD";

            return (
              <Card key={load.id} className={cn("rounded-2xl border overflow-hidden transition-all hover:shadow-xl group", L ? "bg-white border-slate-200 shadow-sm hover:border-blue-200" : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600")}>
                {/* Gradient Accent Bar */}
                <div className="h-[3px] bg-gradient-to-r from-[#1473FF] via-[#8B5CF6] to-[#BE01FF]" />

                <CardContent className="p-0">
                  {/* ── Card Header ── */}
                  <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center ring-2 ring-offset-2 transition-all",
                        load.cargoType === "petroleum" || load.cargoType === "liquid" ? "bg-gradient-to-br from-orange-500/20 to-orange-600/10 ring-orange-500/30" :
                        load.cargoType === "chemicals" || load.cargoType === "hazmat" ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10 ring-purple-500/30" :
                        load.cargoType === "gas" ? "bg-gradient-to-br from-red-500/20 to-red-600/10 ring-red-500/30" :
                        load.cargoType === "refrigerated" ? "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 ring-cyan-500/30" :
                        "bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-blue-500/30",
                        L ? "ring-offset-white" : "ring-offset-slate-800"
                      )}>
                        {getCargoIcon(load.cargoType)}
                      </div>
                      <div>
                        <p className={cn("font-bold text-base", L ? "text-slate-800" : "text-white")}>{getLoadTitle(load)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{pickupStr}</span>
                          </div>
                          <span className="text-slate-600">|</span>
                          <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span className={cn("text-xs font-medium", L ? "text-slate-500" : "text-slate-400")}>{getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleBookmark(load.id)} className={cn("p-2 rounded-xl transition-all", bm ? "text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20" : L ? "text-slate-300 hover:bg-slate-100 hover:text-amber-500" : "text-slate-500 hover:bg-slate-700 hover:text-amber-400")}>
                        {bm ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                      <div className={cn("text-right px-3 py-1.5 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/40")}>
                        <p className={cn("text-[11px] font-mono font-bold tracking-tight", L ? "text-slate-500" : "text-slate-400")}>#{load.loadNumber || `LD-${String(load.id).slice(0, 8)}`}</p>
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-[9px] font-bold uppercase tracking-wider">Available</Badge>
                      </div>
                    </div>
                  </div>

                  {/* ── Route Timeline ── */}
                  <div className={cn("mx-5 mb-3 p-4 rounded-2xl", L ? "bg-slate-50/80" : "bg-slate-900/40")}>
                    <div className="flex items-center gap-4">
                      {/* Origin */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1473FF] to-[#4A90FF] flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-bold truncate", L ? "text-slate-800" : "text-white")}>{oc}</p>
                          {os && <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{os}</p>}
                        </div>
                      </div>

                      {/* Route Line with Distance */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, #1473FF, #8B5CF6)' }} />
                          <div className={cn("px-2.5 py-1 rounded-lg", L ? "bg-white shadow-sm border border-slate-200" : "bg-slate-800 border border-slate-700/50")}>
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-[#8B5CF6]" />
                              <span className={cn("text-[10px] font-bold", L ? "text-slate-600" : "text-slate-300")}>{load.distance > 0 ? `${load.distance.toLocaleString()} mi` : "--"}</span>
                            </div>
                          </div>
                          <div className="w-10 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, #8B5CF6, #BE01FF)' }} />
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <div className="min-w-0 text-right">
                          <p className={cn("text-sm font-bold truncate", L ? "text-slate-800" : "text-white")}>{dc}</p>
                          {ds && <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{ds}</p>}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#BE01FF] flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Tags / Badges ── */}
                  <div className="px-5 mb-3 flex items-center gap-1.5 flex-wrap">
                    {(load.commodity || load.commodityName) && (
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-bold border", L ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-blue-500/15 border-blue-500/30 text-blue-400")}>{load.commodity || load.commodityName}</span>
                    )}
                    {load.cargoType && load.cargoType !== 'general' && (
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-medium border", L ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-purple-500/15 border-purple-500/30 text-purple-400")}>{load.cargoType.charAt(0).toUpperCase() + load.cargoType.slice(1)}</span>
                    )}
                    {load.hazmatClass && (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
                        <Flame className="w-3 h-3 inline mr-0.5 -mt-[1px]" />Hazmat Class {load.hazmatClass}
                      </span>
                    )}
                    {load.weight > 0 && (
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-medium border", L ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>{Number(load.weight).toLocaleString()} {load.weightUnit || "lbs"}</span>
                    )}
                  </div>

                  {/* ── Cargo Animation ── */}
                  <div className={cn("mx-5 mb-3 rounded-2xl overflow-hidden ring-1", L ? "bg-slate-50/60 ring-slate-200/50" : "bg-slate-900/30 ring-slate-700/30")}>
                    <LoadCargoAnimation equipmentType={load.equipmentType} cargoType={load.cargoType} hazmatClass={load.hazmatClass} compartments={1} height={100} isLight={L} isHazmat={!!load.hazmatClass || ["hazmat", "chemicals"].includes(load.cargoType)} />
                  </div>

                  {/* ── Earnings Panel ── */}
                  <div className={cn("mx-5 mb-4 p-4 rounded-2xl", L ? "bg-gradient-to-r from-blue-50/80 via-purple-50/60 to-pink-50/40 border border-blue-100/80" : "bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 border border-slate-700/40")}>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-extrabold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Total Rate</p>
                      </div>
                      <div className={cn("text-center border-x", L ? "border-slate-200/60" : "border-slate-700/40")}>
                        <p className={cn("text-2xl font-extrabold", rpm ? "text-emerald-500" : "text-slate-400")}>{rpm ? `$${rpm}` : "--"}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Per Mile</p>
                      </div>
                      <div className="text-center">
                        <p className={cn("text-2xl font-extrabold", estNet > 0 ? (L ? "text-slate-800" : "text-white") : "text-slate-400")}>{estNet > 0 ? `$${estNet.toLocaleString()}` : "--"}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Est. Net <span className="normal-case">({Math.round(PLATFORM_FEE_PCT * 100)}% fee)</span></p>
                      </div>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="px-5 pb-5 flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm h-11 shadow-lg shadow-purple-500/15 hover:shadow-purple-500/25 transition-all" onClick={() => setLocation(`/bids/submit/${load.id}`)}>
                      <Gavel className="w-4 h-4 mr-2" /> Place Bid
                    </Button>
                    <Button variant="outline" className={cn("flex-1 rounded-xl font-bold text-sm h-11 transition-all", L ? "border-slate-200 hover:bg-slate-50 hover:border-slate-300" : "border-slate-600 hover:bg-slate-700 hover:border-slate-500")} onClick={() => setLocation(`/load/${load.id}`)}>
                      <Eye className="w-4 h-4 mr-2" /> Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
