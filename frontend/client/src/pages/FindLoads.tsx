/**
 * FIND LOADS PAGE
 * Carrier-facing marketplace to discover available loads:
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
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, MapPin, Package, Truck, Eye,
  Navigation, Building2, Droplets, FlaskConical,
  AlertTriangle, Gavel, SlidersHorizontal
} from "lucide-react";
import { useLocation } from "wouter";

type EquipFilter = "all" | "tanker" | "flatbed" | "dry_van" | "reefer";

export default function FindLoads() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [equipFilter, setEquipFilter] = useState<EquipFilter>("all");

  const loadsQuery = (trpc as any).loads.list.useQuery({ status: "posted", limit: 50, marketplace: true });

  const allLoads = (loadsQuery.data as any[]) || [];

  const filteredLoads = useMemo(() => {
    return allLoads.filter((load: any) => {
      const matchesSearch = !searchTerm ||
        load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEquip = equipFilter === "all" || load.equipmentType === equipFilter;
      return matchesSearch && matchesEquip;
    });
  }, [allLoads, searchTerm, equipFilter]);

  const getCargoIcon = (cargoType: string) => {
    if (cargoType === "petroleum" || cargoType === "liquid") return <Droplets className="w-4 h-4" />;
    if (cargoType === "chemicals" || cargoType === "hazmat") return <FlaskConical className="w-4 h-4" />;
    if (cargoType === "gas") return <AlertTriangle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const equipTabs: { id: EquipFilter; label: string }[] = [
    { id: "all", label: `All (${allLoads.length})` },
    { id: "tanker", label: "Tanker" },
    { id: "flatbed", label: "Flatbed" },
    { id: "dry_van", label: "Dry Van" },
    { id: "reefer", label: "Reefer" },
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
            Browse available loads matching your equipment
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border",
          isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30"
        )}>
          <Package className="w-4 h-4 text-blue-500" />
          <span className="text-blue-500 text-sm font-bold">{allLoads.length} Available</span>
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
            const hazmat = load.hazmatClass || (["hazmat", "chemicals", "petroleum"].includes(load.cargoType) ? "Hazardous" : null);
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
                        load.cargoType === "petroleum" ? "bg-orange-500/15" :
                        load.cargoType === "chemicals" ? "bg-purple-500/15" : "bg-blue-500/15"
                      )}>
                        {getCargoIcon(load.cargoType)}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>
                          {load.cargoType === "petroleum" ? "Petroleum Load" : load.cargoType === "chemicals" ? "Chemical Load" : "General Cargo"}
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
                        {load.equipmentType === "tanker" ? "Tanker Truck" : load.equipmentType === "flatbed" ? "Flatbed" : load.equipmentType === "reefer" ? "Reefer" : "Semi Truck"}
                      </span>
                    </div>

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
                        {hazmat && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                            Hazardous
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(load.rate || 0).toLocaleString()}</p>
                        {ratePerMile && <p className="text-[11px] text-slate-400">${ratePerMile}/mi</p>}
                      </div>
                    </div>
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("px-5 py-4 mx-5 mb-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#1473FF]" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{originCity}{originState ? `, ${originState}` : ""}</p>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <svg className="flex-1 h-[3px]" preserveAspectRatio="none">
                          <defs><linearGradient id={`routeGrad-${load.id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1473FF" /><stop offset="100%" stopColor="#BE01FF" /></linearGradient></defs>
                          <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke={`url(#routeGrad-${load.id})`} strokeWidth="3" strokeDasharray="8 5" />
                        </svg>
                        <Navigation className="w-4 h-4 mx-1 rotate-90 text-purple-400" />
                        <svg className="flex-1 h-[3px]" preserveAspectRatio="none">
                          <use href={`#routeGrad-${load.id}`} />
                          <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke={`url(#routeGrad-${load.id})`} strokeWidth="3" strokeDasharray="8 5" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{destCity}{destState ? `, ${destState}` : ""}</p>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#BE01FF]" />
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
