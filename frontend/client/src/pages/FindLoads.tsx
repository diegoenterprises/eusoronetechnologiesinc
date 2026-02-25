/**
 * FIND LOADS PAGE
 * Catalyst-facing marketplace to discover available loads:
 * - Equipment type filter pills
 * - Load cards with route visualization, tags, Place Bid
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
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
  Search, MapPin, Package, Truck, Eye,
  Navigation, Building2, Droplets, FlaskConical,
  AlertTriangle, Gavel, SlidersHorizontal,
  ChevronLeft, ChevronRight, RefreshCw, TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import LoadCargoAnimation from "@/components/LoadCargoAnimation";

type EquipFilter = "all" | "tanker" | "flatbed" | "dry_van" | "reefer" | "hopper" | "cryogenic" | "hazmat";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekDays(baseDate: Date) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    days.push(dd);
  }
  return days;
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function FindLoads() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [equipFilter, setEquipFilter] = useState<EquipFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const loadsQuery = (trpc as any).loadBoard.search.useQuery({ limit: 100 });
  const statsQuery = (trpc as any).loadBoard.getStats.useQuery();

  // ML Engine — demand forecast + model status for market intelligence
  const mlDemand = (trpc as any).ml?.forecastDemand?.useQuery?.({}) || { data: null };
  const mlStatus = (trpc as any).ml?.getModelStatus?.useQuery?.() || { data: null };

  const allLoads = (loadsQuery.data as any)?.loads || [];

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + dir * 7);
    setWeekBase(d);
    setSelectedDate(d);
  };

  const filteredLoads = useMemo(() => {
    return allLoads.filter((load: any) => {
      const matchesSearch = !searchTerm ||
        load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEquip = equipFilter === "all" ||
        load.equipmentType === equipFilter ||
        (equipFilter === "hazmat" && load.hazmat);

      let matchesDate = true;
      if (dateFilterActive) {
        const loadDateRaw = load.pickupDate || load.createdAt;
        if (loadDateRaw) {
          const loadDate = new Date(loadDateRaw);
          matchesDate = loadDate.getFullYear() === selectedDate.getFullYear()
            && loadDate.getMonth() === selectedDate.getMonth()
            && loadDate.getDate() === selectedDate.getDate();
        }
      }

      return matchesSearch && matchesEquip && matchesDate;
    });
  }, [allLoads, searchTerm, equipFilter, dateFilterActive, selectedDate]);

  const getCargoIcon = (cargoType: string) => {
    if (cargoType === "petroleum" || cargoType === "liquid") return <Droplets className="w-4 h-4" />;
    if (cargoType === "chemicals" || cargoType === "hazmat") return <FlaskConical className="w-4 h-4" />;
    if (cargoType === "gas") return <AlertTriangle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const marketStats = (loadsQuery.data as any)?.marketStats;
  const boardStats = statsQuery.data;

  const equipTabs: { id: EquipFilter; label: string }[] = [
    { id: "all", label: `All (${allLoads.length})` },
    { id: "tanker", label: "Tanker" },
    { id: "flatbed", label: "Flatbed" },
    { id: "dry_van", label: "Dry Van" },
    { id: "reefer", label: "Reefer" },
    { id: "hopper", label: "Bulk/Hopper" },
    { id: "cryogenic", label: "Cryogenic" },
    { id: "hazmat", label: "Hazmat" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Find Loads
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Browse available loads posted by shippers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border",
            isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30"
          )}>
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500 text-sm font-bold">{filteredLoads.length} Available</span>
          </div>
          <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-600 hover:bg-slate-700")} onClick={() => loadsQuery.refetch()}>
            <RefreshCw className={cn("w-4 h-4", loadsQuery.isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={cn(
        "relative rounded-xl border",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
      )}>
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by origin, destination, or load #..."
          className={cn(
            "pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0",
            isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400"
          )}
        />
      </div>

      {/* ── Week Date Picker ── */}
      <div className={cn(
        "rounded-xl border p-4",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
      )}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftWeek(-1)} className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")}>
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>
              {formatMonthYear(selectedDate)}
            </p>
            {dateFilterActive ? (
              <button onClick={() => setDateFilterActive(false)} className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-medium">
                Show All
              </button>
            ) : (
              <button onClick={() => setDateFilterActive(true)} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", isLight ? "border-slate-300 text-slate-500 hover:bg-slate-100" : "border-slate-600 text-slate-400 hover:bg-slate-700")}>
                Showing All
              </button>
            )}
          </div>
          <button onClick={() => shiftWeek(1)} className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")}>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(day); setDateFilterActive(true); }}
                className={cn(
                  "flex flex-col items-center py-2 rounded-xl transition-all text-center",
                  isSelected
                    ? "bg-gradient-to-b from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-purple-500/25"
                    : isToday
                      ? isLight ? "bg-slate-100 text-slate-800" : "bg-slate-700 text-white"
                      : isLight ? "hover:bg-slate-50 text-slate-600" : "hover:bg-slate-700/50 text-slate-400"
                )}
              >
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
          <button
            key={tab.id}
            onClick={() => setEquipFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              equipFilter === tab.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ML Demand Intelligence ── */}
      {mlDemand.data && mlDemand.data.topLanes?.length > 0 && (
        <div className={cn("rounded-xl border p-4", isLight ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20")}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-purple-600" : "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent")}>ESANG AI Demand Intelligence</span>
            {mlStatus.data && <span className={cn("ml-auto text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>{mlStatus.data.totalLoadsAnalyzed} loads analyzed / {mlStatus.data.totalLanes} lanes</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mlDemand.data.topLanes.slice(0, 6).map((lane: any, i: number) => (
              <div key={i} className={cn("flex-shrink-0 px-3 py-2 rounded-lg border text-center min-w-[100px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/40")}>
                <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{lane.lane}</p>
                <p className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>{lane.volume} loads</p>
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
        <div className={cn(
          "text-center py-16 rounded-2xl border",
          isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
        )}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No loads available</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for new opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoads.map((load: any) => {
            const originCity = load.origin?.city || "Origin";
            const originState = load.origin?.state || "";
            const destCity = load.destination?.city || "Destination";
            const destState = load.destination?.state || "";
            const hazmat = isHazmatLoad(load);
            const ratePerMile = load.distance > 0 && load.rate > 0 ? (load.rate / load.distance).toFixed(2) : null;

            return (
              <Card key={load.id} className={cn(
                "rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg",
                isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
              )}>
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className={cn("flex items-center justify-between px-5 pt-4 pb-3", isLight ? "border-b border-slate-100" : "border-b border-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        load.cargoType === "petroleum" || load.cargoType === "liquid" ? "bg-orange-500/15" :
                        load.cargoType === "chemicals" || load.cargoType === "hazmat" ? "bg-purple-500/15" :
                        load.cargoType === "gas" ? "bg-red-500/15" :
                        load.cargoType === "refrigerated" ? "bg-cyan-500/15" : "bg-blue-500/15"
                      )}>
                        {getCargoIcon(load.cargoType)}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>
                          {getLoadTitle(load)}
                        </p>
                        <p className="text-xs text-slate-400">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : load.createdAt ? new Date(load.createdAt).toLocaleDateString() : "Pickup TBD"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-mono font-bold", isLight ? "text-slate-600" : "text-slate-300")}>
                        #{load.loadNumber || `LOAD-${String(load.id).slice(0, 6)}`}
                      </p>
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-0 text-[10px] font-bold">Posted</Badge>
                    </div>
                  </div>

                  {/* Equipment + Tags */}
                  <div className="px-5 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>
                        {getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(load.commodity || load.commodityName) && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold border", isLight ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-blue-500/15 border-blue-500/30 text-blue-400")}>
                            {load.commodity || load.commodityName}
                          </span>
                        )}
                        {load.cargoType && load.cargoType !== 'general' && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-purple-500/15 border-purple-500/30 text-purple-400")}>
                            {load.cargoType.charAt(0).toUpperCase() + load.cargoType.slice(1)}
                          </span>
                        )}
                        {load.hazmatClass && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                            Hazmat Class {load.hazmatClass}
                          </span>
                        )}
                        {load.weight > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>
                            {Number(load.weight).toLocaleString()} {load.weightUnit || "lbs"}
                          </span>
                        )}
                        {load.distance > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>
                            {load.distance} miles
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                        {ratePerMile && <p className="text-[11px] text-slate-400">${ratePerMile}/mi</p>}
                      </div>
                    </div>
                  </div>

                  {/* Animated Cargo Graphic */}
                  <div className={cn("mx-5 mb-2 rounded-xl overflow-hidden", isLight ? "bg-slate-50/60" : "bg-slate-900/30")}>
                    <LoadCargoAnimation
                      equipmentType={load.equipmentType}
                      cargoType={load.cargoType}
                      hazmatClass={load.hazmatClass}
                      compartments={1}
                      height={110}
                      isLight={isLight}
                      isHazmat={!!load.hazmatClass || ["hazmat", "chemicals"].includes(load.cargoType)}
                    />
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("px-5 py-4 mx-5 mb-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      {/* Origin */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF] to-[#4A90FF] flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{originCity}{originState ? `, ${originState}` : ""}</p>
                        </div>
                      </div>

                      {/* Dashed Route Line — gradient blue to purple */}
                      <div className="flex-1 mx-4 flex items-center">
                        <div
                          className="flex-1 h-[2px] rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #1473FF, #BE01FF)',
                            WebkitMaskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)',
                            maskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)',
                          }}
                        />
                        <Navigation className="w-4 h-4 mx-1 rotate-90 text-[#8B5CF6]" />
                        <div
                          className="flex-1 h-[2px] rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #6C47FF, #BE01FF)',
                            WebkitMaskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)',
                            maskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)',
                          }}
                        />
                      </div>

                      {/* Destination */}
                      <div className="flex items-center gap-2">
                        <div>
                          <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{destCity}{destState ? `, ${destState}` : ""}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#BE01FF] flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 pb-4 flex justify-center gap-3">
                    <Button
                      className="flex-1 max-w-[200px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm h-10"
                      onClick={() => setLocation(`/bids/submit/${load.id}`)}
                    >
                      <Gavel className="w-4 h-4 mr-2" /> Place Bid
                    </Button>
                    <Button
                      variant="outline"
                      className={cn("flex-1 max-w-[200px] rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200" : "border-slate-600")}
                      onClick={() => setLocation(`/load/${load.id}`)}
                    >
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
