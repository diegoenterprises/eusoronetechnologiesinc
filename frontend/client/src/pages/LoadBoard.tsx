/**
 * LOAD BOARD PAGE
 * Marketplace-style load board matching the My Loads premium design:
 * - Week date picker with day selector
 * - Filter pill tabs: All / Posted / Bidding / In Transit / Delivered
 * - Load cards with company branding, cargo animation, route line, equipment tags
 * - Bid / View action buttons
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
  Search, MapPin, Package, DollarSign, Truck, RefreshCw,
  Eye, Clock, Navigation, Building2, Droplets, FlaskConical,
  AlertTriangle, Gavel, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import LoadCargoAnimation from "@/components/LoadCargoAnimation";

type BoardFilter = "all" | "posted" | "bidding" | "in_transit" | "delivered";

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

export default function LoadBoard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<BoardFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const loadsQuery = (trpc as any).loadBoard.search.useQuery({ limit: 100 });

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + dir * 7);
    setWeekBase(d);
    setSelectedDate(d);
  };

  const allLoads = (loadsQuery.data as any)?.loads || [];
  const totalLoads = allLoads.length;
  const postedLoads = allLoads.filter((l: any) => l.status === "posted").length;
  const inTransit = allLoads.filter((l: any) => l.status === "in_transit").length;
  const totalValue = allLoads.reduce((s: number, l: any) => s + (l.rate || 0), 0);

  const filteredLoads = useMemo(() => {
    return allLoads.filter((load: any) => {
      const matchesSearch = !searchTerm ||
        load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all" || load.status === activeFilter;

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

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [allLoads, searchTerm, activeFilter, dateFilterActive, selectedDate]);

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      posted: { label: "Posted", bg: "bg-yellow-500/20", text: "text-yellow-500" },
      bidding: { label: "Bidding", bg: "bg-orange-500/20", text: "text-orange-500" },
      assigned: { label: "Assigned", bg: "bg-blue-500/20", text: "text-blue-500" },
      in_transit: { label: "In Transit", bg: "bg-green-500/20", text: "text-green-600" },
      delivered: { label: "Delivered", bg: "bg-emerald-500/20", text: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
    };
    return map[status] || { label: status, bg: "bg-slate-500/20", text: "text-slate-400" };
  };

  const getCargoIcon = (cargoType: string) => {
    if (cargoType === "petroleum" || cargoType === "liquid") return <Droplets className="w-4 h-4" />;
    if (cargoType === "chemicals" || cargoType === "hazmat") return <FlaskConical className="w-4 h-4" />;
    if (cargoType === "gas") return <AlertTriangle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const filterTabs: { id: BoardFilter; label: string }[] = [
    { id: "all", label: `All (${totalLoads})` },
    { id: "posted", label: "Posted" },
    { id: "bidding", label: "Bidding" },
    { id: "in_transit", label: "In Transit" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Load Board
        </h1>
        <Button
          variant="outline"
          className={cn("rounded-xl", isLight ? "border-slate-200" : "border-slate-600 hover:bg-slate-700")}
          onClick={() => loadsQuery.refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
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
          placeholder="Search by load #, origin, or destination..."
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

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeFilter === tab.id
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
          <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No loads found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoads.map((load: any) => {
            const statusCfg = getStatusConfig(load.status);
            const originCity = load.origin?.city || "Origin";
            const originState = load.origin?.state || "";
            const destCity = load.destination?.city || "Destination";
            const destState = load.destination?.state || "";
            const isActive = ["in_transit", "assigned"].includes(load.status);
            const canBid = load.status === "posted";
            const hazmat = isHazmatLoad(load);
            const companyName = load.companyName || load.shipperName || getLoadTitle(load);

            return (
              <Card key={load.id} className={cn(
                "rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg",
                isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
              )}>
                <CardContent className="p-0">
                  {/* ── Card Header: Company + Load # ── */}
                  <div className={cn("flex items-center justify-between px-5 pt-4 pb-3", isLight ? "border-b border-slate-100" : "border-b border-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      {(load.companyLogo || load.shipperProfilePicture) ? (
                        <img
                          src={load.companyLogo || load.shipperProfilePicture}
                          alt={load.companyName || load.shipperName || "Company"}
                          className="w-10 h-10 rounded-xl object-cover"
                          onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        load.cargoType === "petroleum" ? "bg-orange-500/15" :
                        load.cargoType === "chemicals" ? "bg-purple-500/15" :
                        load.cargoType === "gas" ? "bg-red-500/15" : "bg-blue-500/15",
                        (load.companyLogo || load.shipperProfilePicture) ? "hidden" : ""
                      )}>
                        {getCargoIcon(load.cargoType)}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>{companyName}</p>
                        <p className="text-xs text-slate-400">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : load.createdAt ? new Date(load.createdAt).toLocaleDateString() : "Recent"}</p>
                      </div>
                    </div>
                    <p className={cn("text-sm font-mono font-bold", isLight ? "text-slate-600" : "text-slate-300")}>
                      #{load.loadNumber || `LOAD-${String(load.id).slice(0, 6)}`}
                    </p>
                  </div>

                  {/* ── Equipment + Status + Tags Row ── */}
                  <div className="px-5 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>
                          {getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass)}
                        </span>
                        <span className="text-slate-400 text-xs">|</span>
                        <span className="text-xs text-slate-400">{(load.compartments || 1) > 1 ? `${load.compartments} compartments` : "Single compartment"}</span>
                      </div>
                      <Badge className={cn("border-0 text-xs font-bold px-3 py-1 rounded-md", statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Tags Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(load.commodity || load.commodityName) && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold border", isLight ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-blue-500/15 border-blue-500/30 text-blue-400")}>
                            {load.commodity || load.commodityName}
                          </span>
                        )}
                        {load.cargoType && load.cargoType !== "general" && (
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
                      </div>
                      <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                    </div>
                    {load.distance > 0 && load.rate > 0 && (
                      <p className="text-xs text-slate-400 text-right mt-0.5">${(load.rate / Math.max(load.distance, 1)).toFixed(2)}/mi</p>
                    )}
                  </div>

                  {/* ── Animated Cargo Graphic ── */}
                  <div className={cn("mx-5 mb-2 rounded-xl overflow-hidden", isLight ? "bg-slate-50/60" : "bg-slate-900/30")}>
                    <LoadCargoAnimation
                      equipmentType={load.equipmentType}
                      cargoType={load.cargoType}
                      hazmatClass={load.hazmatClass}
                      compartments={load.compartments || 1}
                      height={110}
                      isLight={isLight}
                    />
                  </div>

                  {/* ── Route Visualization ── */}
                  <div className={cn("px-5 py-4 mx-5 mb-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF] to-[#4A90FF] flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{originCity}{originState ? `, ${originState}` : ""}</p>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{destCity}{destState ? `, ${destState}` : ""}</p>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#BE01FF] flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="px-5 pb-4 flex justify-center gap-3">
                    {canBid ? (
                      <>
                        <Button
                          className="flex-1 max-w-[200px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm h-10"
                          onClick={() => setLocation(`/loads/${load.id}`)}
                        >
                          <Gavel className="w-4 h-4 mr-2" /> Place Bid
                        </Button>
                        <Button
                          variant="outline"
                          className={cn("flex-1 max-w-[200px] rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200" : "border-slate-600")}
                          onClick={() => setLocation(`/loads/${load.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </>
                    ) : isActive ? (
                      <Button
                        className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-xl font-bold text-sm h-10"
                        onClick={() => setLocation(`/loads/${load.id}`)}
                      >
                        Track
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className={cn("w-full max-w-xs rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200" : "border-slate-600")}
                        onClick={() => setLocation(`/loads/${load.id}`)}
                      >
                        View Details
                      </Button>
                    )}
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
