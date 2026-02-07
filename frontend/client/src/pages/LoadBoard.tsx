/**
 * LOAD BOARD PAGE
 * Marketplace-style load board matching the mobile-first design:
 * - Filter pill tabs: All / Posted / Bidding / In Transit / Delivered
 * - Load cards with company branding, route line, equipment tags
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
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, MapPin, Package, DollarSign, Truck, RefreshCw,
  Eye, Clock, Navigation, Building2, Droplets, FlaskConical,
  AlertTriangle, Gavel, TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";

type BoardFilter = "all" | "posted" | "bidding" | "assigned" | "in_transit" | "delivered";

export default function LoadBoard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<BoardFilter>("all");

  const loadsQuery = (trpc as any).loads.list.useQuery({ limit: 100 });

  const allLoads = (loadsQuery.data as any[]) || [];
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
      return matchesSearch && matchesFilter;
    });
  }, [allLoads, searchTerm, activeFilter]);

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      posted: { label: "Posted", bg: "bg-yellow-500/20", text: "text-yellow-500" },
      bidding: { label: "Bidding", bg: "bg-orange-500/20", text: "text-orange-500" },
      assigned: { label: "Assigned", bg: "bg-blue-500/20", text: "text-blue-500" },
      in_transit: { label: "In Transit", bg: "bg-green-500/20", text: "text-green-600" },
      delivered: { label: "Delivered", bg: "bg-emerald-500/20", text: "text-emerald-500" },
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Loads", value: totalLoads, icon: Package, color: "blue" },
          { label: "Posted", value: postedLoads, icon: Clock, color: "yellow" },
          { label: "In Transit", value: inTransit, icon: Truck, color: "green" },
          { label: "Total Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "emerald" },
        ].map((stat) => (
          <Card key={stat.label} className={cn(
            "rounded-xl border",
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-${stat.color}-500/15`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div>
                  {loadsQuery.isLoading ? <Skeleton className="h-7 w-12" /> : (
                    <p className={`text-xl font-bold text-${stat.color}-500`}>{stat.value}</p>
                  )}
                  <p className="text-[11px] text-slate-400">{stat.label}</p>
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
          placeholder="Search by load #, origin, or destination..."
          className={cn(
            "pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0",
            isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400"
          )}
        />
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
            const hazmat = load.hazmatClass || (["hazmat", "chemicals", "petroleum"].includes(load.cargoType) ? "Hazardous" : null);

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
                        <p className="text-xs text-slate-400">{load.createdAt || "Recent"}</p>
                      </div>
                    </div>
                    <p className={cn("text-sm font-mono font-bold", isLight ? "text-slate-600" : "text-slate-300")}>
                      #{load.loadNumber || `LOAD-${String(load.id).slice(0, 6)}`}
                    </p>
                  </div>

                  {/* Equipment + Status + Tags */}
                  <div className="px-5 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>
                          {load.equipmentType === "tanker" ? "Tanker Truck" : load.equipmentType === "flatbed" ? "Flatbed" : "Semi Truck"}
                        </span>
                      </div>
                      <Badge className={cn("border-0 text-xs font-bold px-3 py-1 rounded-md", statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </Badge>
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
                      <p className="text-xl font-bold text-green-500">${(load.rate || 0).toLocaleString()}</p>
                    </div>
                    {load.distance > 0 && load.rate > 0 && (
                      <p className="text-xs text-slate-400 text-right mt-0.5">${(load.rate / Math.max(load.distance, 1)).toFixed(2)}/mi</p>
                    )}
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("px-5 py-4 mx-5 mb-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{originCity}{originState ? `, ${originState}` : ""}</p>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                        <Navigation className={cn("w-4 h-4 mx-1 rotate-90", isActive ? "text-green-500" : "text-slate-400")} />
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{destCity}{destState ? `, ${destState}` : ""}</p>
                        <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
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
                        className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 rounded-xl font-bold text-sm h-10"
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
