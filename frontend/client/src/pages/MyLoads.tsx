/**
 * MY LOADS PAGE
 * Redesigned to match the mobile-first inspiration:
 * - Week date picker with day selector
 * - Filter tabs: All / Pending / Scheduled / In Progress / Past
 * - Load cards with company branding, route line, equipment tags
 * - Track / Post a Job action buttons
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Package, Plus, Search, MapPin, Truck, ChevronLeft, ChevronRight,
  AlertTriangle, Navigation, Building2, Droplets, FlaskConical,
  Eye, MessageSquare, Phone, ExternalLink, ArrowRight, Clock,
  DollarSign, Weight, Route, RefreshCw, User, X
} from "lucide-react";
import { useLocation } from "wouter";
import LoadCargoAnimation from "@/components/LoadCargoAnimation";
import { useAuth } from "@/_core/hooks/useAuth";

type LoadFilter = "all" | "pending" | "scheduled" | "in_progress" | "past";

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

export default function MyLoads() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<LoadFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());

  const [previewLoad, setPreviewLoad] = useState<any>(null);

  // Format selected date as YYYY-MM-DD for DB query
  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  // Filter by selected date by default — user can toggle "Show All" to see everything
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const loadsQuery = (trpc as any).loadBoard.getMyPostedLoads.useQuery({ status: "all" });

  // Message catalyst/driver
  const createConversation = (trpc as any).messages?.createConversation?.useMutation?.({
    onSuccess: (data: any) => { toast.success(data?.existing ? "Opened conversation" : "Conversation started"); setLocation("/messages"); },
    onError: () => { toast.error("Could not start conversation"); setLocation("/messages"); },
  }) || { mutate: () => {} };

  const handleContact = (load: any) => {
    const contactId = load.driverId || load.catalystId;
    if (contactId) { createConversation.mutate({ participantIds: [contactId], type: "direct" }); }
    else { toast.info("No catalyst or driver assigned yet"); }
  };

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + dir * 7);
    setWeekBase(d);
    setSelectedDate(d);
  };

  // Status mapping to filter groups
  const getFilterGroup = (status: string): LoadFilter => {
    if (["draft", "posted", "bidding"].includes(status)) return "pending";
    if (["assigned", "en_route_pickup", "at_pickup", "loading"].includes(status)) return "scheduled";
    if (["in_transit", "at_delivery", "unloading"].includes(status)) return "in_progress";
    if (["delivered", "cancelled", "disputed"].includes(status)) return "past";
    return "pending";
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      draft: { label: "Draft", bg: "bg-slate-500/20", text: "text-slate-400" },
      posted: { label: "Posted", bg: "bg-yellow-500/20", text: "text-yellow-500" },
      bidding: { label: "Bidding", bg: "bg-orange-500/20", text: "text-orange-500" },
      assigned: { label: "Scheduled", bg: "bg-blue-500/20", text: "text-blue-500" },
      en_route_pickup: { label: "En Route", bg: "bg-blue-500/20", text: "text-blue-500" },
      in_transit: { label: "In Progress", bg: "bg-green-500/20", text: "text-green-600" },
      at_delivery: { label: "At Delivery", bg: "bg-green-500/20", text: "text-green-600" },
      delivered: { label: "Delivered", bg: "bg-emerald-500/20", text: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
      cancelled: { label: "Cancelled", bg: "bg-red-500/20", text: "text-red-500" },
      pending: { label: "Pending", bg: "bg-red-500/20", text: "text-red-500" },
    };
    return map[status] || { label: status, bg: "bg-slate-500/20", text: "text-slate-400" };
  };

  const filteredLoads = useMemo(() => {
    return ((loadsQuery.data as any[]) || []).filter((load: any) => {
      const matchesSearch = !searchTerm ||
        load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all" || getFilterGroup(load.status) === activeFilter;

      // Date filtering: compare against pickupDate, fallback to createdAt
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
  }, [loadsQuery.data, searchTerm, activeFilter, dateFilterActive, selectedDate]);

  // Active load stats
  const allLoads = (loadsQuery.data as any[]) || [];
  const inTransitCount = allLoads.filter((l: any) => l.status === "in_transit").length;
  const assignedCount = allLoads.filter((l: any) => ["assigned", "picked_up", "en_route_pickup"].includes(l.status)).length;
  const postedCount = allLoads.filter((l: any) => ["posted", "bidding"].includes(l.status)).length;
  const delayedCount = allLoads.filter((l: any) => l.status === "delayed").length;

  const filterTabs: { id: LoadFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "scheduled", label: "Scheduled" },
    { id: "in_progress", label: "In Progress" },
    { id: "past", label: "Past" },
  ];

  const getCargoIcon = (cargoType: string) => {
    if (cargoType === "petroleum" || cargoType === "liquid") return <Droplets className="w-4 h-4" />;
    if (cargoType === "chemicals" || cargoType === "hazmat") return <FlaskConical className="w-4 h-4" />;
    if (cargoType === "gas") return <AlertTriangle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const { user: authUser } = useAuth();
  const isCatalyst = (authUser?.role || "").toUpperCase() === "CATALYST";
  const isDriver = (authUser?.role || "").toUpperCase() === "DRIVER";
  const canCreateLoads = !isCatalyst && !isDriver;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          {isCatalyst ? "Assigned Loads" : "My Loads"}
        </h1>
        <div className="flex items-center gap-2">
          {canCreateLoads && (
            <Button
              className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl px-5"
              onClick={() => setLocation("/loads/create")}
            >
              <Plus className="w-4 h-4 mr-2" /> Create New Load
            </Button>
          )}
          <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => loadsQuery.refetch()}>
            <RefreshCw className={cn("w-4 h-4", loadsQuery.isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { count: inTransitCount, label: "In Transit", icon: <Truck className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", color: "text-blue-400" },
          { count: assignedCount, label: "Assigned", icon: <Package className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", color: "text-cyan-400" },
          { count: postedCount, label: "Posted", icon: <Clock className="w-5 h-5 text-violet-400" />, bg: "bg-violet-500/15", color: "text-violet-400" },
          { count: delayedCount, label: "Delayed", icon: <AlertTriangle className="w-5 h-5 text-red-400" />, bg: "bg-red-500/15", color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                <div>
                  <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.count}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
          placeholder="Search..."
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
        {/* Month/Year Header */}
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
        {/* Day Pills */}
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
          <p className="text-sm text-slate-400 mt-1">
            {isCatalyst ? "No assigned loads yet. Browse the marketplace to find and bid on loads." : "Create your first load to get started"}
          </p>
          {canCreateLoads ? (
            <Button
              className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl"
              onClick={() => setLocation("/loads/create")}
            >
              <Plus className="w-4 h-4 mr-2" /> Create New Load
            </Button>
          ) : (
            <Button
              className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl"
              onClick={() => setLocation("/marketplace")}
            >
              <Search className="w-4 h-4 mr-2" /> Find Loads
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoads.map((load: any) => {
            const statusCfg = getStatusConfig(load.status);
            const isActive = ["in_transit", "at_delivery", "assigned", "en_route_pickup"].includes(load.status);
            const isPending = ["draft", "posted", "bidding"].includes(load.status);
            const originCity = load.origin?.city || "Origin";
            const originState = load.origin?.state || "";
            const destCity = load.destination?.city || "Destination";
            const destState = load.destination?.state || "";
            const hazmatClass = load.hazmatClass || (load.cargoType === "hazmat" || load.cargoType === "chemicals" || load.cargoType === "petroleum" ? "Hazardous" : null);
            const productName = load.specialInstructions?.split("\n")?.find((l: string) => l.startsWith("Product:"))?.replace("Product: ", "") || (load.cargoType === "petroleum" ? "Petroleum crude oil" : load.cargoType === "chemicals" ? "Chemical Load" : "General Cargo");
            const companyName = load.companyName || load.shipperName || productName;

            return (
              <Card key={load.id} className={cn(
                "rounded-2xl border overflow-hidden",
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
                        <p className="text-xs text-slate-400">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : load.createdAt ? new Date(load.createdAt).toLocaleDateString() : "Recent"}</p>
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
                          {load.equipmentType === "tank" || load.equipmentType === "liquid_tank" ? "Liquid Tank Trailer"
                            : load.equipmentType === "tanker" || load.equipmentType === "gas_tank" ? "Gas Tank Trailer"
                            : load.equipmentType === "flatbed" ? "Flatbed"
                            : load.equipmentType === "reefer" ? "Refrigerated (Reefer)"
                            : load.equipmentType === "dry-van" || load.equipmentType === "dry_van" ? "Dry Van"
                            : load.equipmentType === "hopper" ? "Dry Bulk / Hopper"
                            : load.equipmentType === "cryogenic" ? "Cryogenic Tank"
                            : load.equipmentType === "food_grade_tank" ? "Food-Grade Liquid Tank"
                            : load.equipmentType === "water_tank" ? "Water Tank"
                            : "Semi Truck"}
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
                        {load.distance > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>
                            {load.distance} miles
                          </span>
                        )}
                        {load.weight > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>
                            {Number(load.weight).toLocaleString()} {load.weightUnit || "lbs"}
                          </span>
                        )}
                        {hazmatClass && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                            Hazardous
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                    </div>

                    {/* Assignment Info */}
                    {isActive && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-purple-400 font-medium">Pilot Dispatch Assigned</span>
                        <span className="text-xs text-blue-400 font-medium">Driver Assigned</span>
                      </div>
                    )}
                  </div>

                  {/* ── Animated Cargo Graphic ── */}
                  <div className={cn("mx-5 mb-2 rounded-xl overflow-hidden", isLight ? "bg-slate-50/60" : "bg-slate-900/30")}>
                    <LoadCargoAnimation
                      equipmentType={load.equipmentType}
                      cargoType={load.cargoType}
                      compartments={load.compartments || 1}
                      height={110}
                      isLight={isLight}
                    />
                  </div>

                  {/* ── Route Visualization ── */}
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

                      {/* Dashed Route Line — gradient blue→purple */}
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

                  {/* ── Action Buttons ── */}
                  <div className="px-5 pb-4 flex items-center gap-2">
                    {isActive ? (
                      <Button
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-xl font-bold text-sm h-10"
                        onClick={() => setLocation(`/loads/${load.id}`)}
                      >
                        <Navigation className="w-4 h-4 mr-1.5" />Track
                      </Button>
                    ) : isPending && canCreateLoads ? (
                      <>
                        <Button
                          className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm h-10"
                          onClick={() => setLocation(`/loads/${load.id}/bids`)}
                        >
                          <DollarSign className="w-4 h-4 mr-1.5" />Review Bids
                        </Button>
                        <Button
                          variant="outline"
                          className={cn("rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200" : "border-slate-600")}
                          onClick={() => setLocation(`/loads/${load.id}`)}
                        >
                          Details
                        </Button>
                      </>
                    ) : isPending ? (
                      <Button
                        className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 rounded-xl font-bold text-sm h-10"
                        onClick={() => setLocation(`/loads/${load.id}`)}
                      >
                        View Load
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className={cn("flex-1 rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200" : "border-slate-600")}
                        onClick={() => setLocation(`/loads/${load.id}`)}
                      >
                        View Details
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className={cn("rounded-xl h-10 px-3", isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700" : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white")}
                      onClick={() => setPreviewLoad(load)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className={cn("rounded-xl h-10 px-3", isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700" : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white")}
                      onClick={() => handleContact(load)}
                      title={load.driverName ? `Message ${load.driverName}` : load.catalystName ? `Message ${load.catalystName}` : "Message"}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Load Preview Modal ═══ */}
      <Dialog open={!!previewLoad} onOpenChange={(open) => { if (!open) setPreviewLoad(null); }}>
        <DialogContent
          className={cn("sm:max-w-2xl rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          {previewLoad && (
            <>
              <div className="p-5 pb-0">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <DialogTitle className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                      {previewLoad.loadNumber || `#LOAD-${String(previewLoad.id).slice(0, 6)}`}
                    </DialogTitle>
                    <Badge className={cn("border-0 text-xs font-bold", getStatusConfig(previewLoad.status).bg, getStatusConfig(previewLoad.status).text)}>
                      {getStatusConfig(previewLoad.status).label}
                    </Badge>
                    {previewLoad.hazmatClass && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">HAZMAT</Badge>}
                  </div>
                </DialogHeader>
              </div>
              <div className="p-5 space-y-4">
                {/* Route */}
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center"><MapPin className="w-4 h-4 text-[#1473FF]" /></div>
                      <div><p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{previewLoad.origin?.city}{previewLoad.origin?.state ? `, ${previewLoad.origin.state}` : ""}</p><p className="text-[11px] text-slate-500">{previewLoad.origin?.address || "Origin"}</p></div>
                    </div>
                    <div className="flex-1 mx-4 flex items-center"><div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} /><Truck className="w-5 h-5 mx-2 text-[#8B5CF6]" /><div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} /></div>
                    <div className="flex items-center gap-2">
                      <div><p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{previewLoad.destination?.city}{previewLoad.destination?.state ? `, ${previewLoad.destination.state}` : ""}</p><p className="text-[11px] text-slate-500 text-right">{previewLoad.destination?.address || "Destination"}</p></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE01FF]/20 to-[#1473FF]/20 flex items-center justify-center"><Building2 className="w-4 h-4 text-[#BE01FF]" /></div>
                    </div>
                  </div>
                </div>
                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Rate", value: previewLoad.rate > 0 ? `$${previewLoad.rate.toLocaleString()}` : "N/A", gradient: true },
                    { label: "Weight", value: previewLoad.weight > 0 ? `${Number(previewLoad.weight).toLocaleString()} lbs` : "N/A" },
                    { label: "Distance", value: previewLoad.distance > 0 ? `${previewLoad.distance.toLocaleString()} mi` : "N/A" },
                    { label: "Commodity", value: previewLoad.commodity || "General" },
                    { label: "Pickup", value: previewLoad.pickupDate ? new Date(previewLoad.pickupDate).toLocaleDateString() : "TBD" },
                    { label: "Delivery", value: previewLoad.deliveryDate ? new Date(previewLoad.deliveryDate).toLocaleDateString() : "TBD" },
                    { label: "Catalyst", value: previewLoad.catalystName || "Unassigned" },
                    { label: "Driver", value: previewLoad.driverName || "Unassigned" },
                  ].map((item: any) => (
                    <div key={item.label} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                      <p className={item.gradient && previewLoad.rate > 0 ? "font-bold text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {/* Contact Info */}
                {(previewLoad.catalystCompanyName || previewLoad.driverPhone) && (
                  <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                    <p className="text-xs text-slate-500 mb-2 font-medium">Contact Information</p>
                    <div className="flex items-center gap-4">
                      {previewLoad.catalystCompanyName && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /><span className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{previewLoad.catalystCompanyName}</span></div>}
                      {previewLoad.driverPhone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><a href={`tel:${previewLoad.driverPhone}`} className="text-sm text-cyan-400 hover:underline">{previewLoad.driverPhone}</a></div>}
                    </div>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg" onClick={() => { setPreviewLoad(null); setLocation(`/loads/${previewLoad.id}`); }}>
                    <ExternalLink className="w-4 h-4 mr-2" />Full Details
                  </Button>
                  <Button variant="outline" className={cn("flex-1 rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => { setPreviewLoad(null); handleContact(previewLoad); }}>
                    <MessageSquare className="w-4 h-4 mr-2" />{previewLoad.driverName ? `Message ${previewLoad.driverName}` : previewLoad.catalystName ? `Message ${previewLoad.catalystName}` : "Message"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
