/**
 * FLEET MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Shipper design standard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Search, Plus, Wrench, CheckCircle,
  AlertTriangle, MapPin, Fuel, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function FleetManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const vehiclesQuery = (trpc as any).fleet.getVehicles.useQuery({ search, status });
  const statsQuery = (trpc as any).fleet.getFleetStats.useQuery();
  const stats = statsQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  const statusBadge = (s: string) => {
    const m: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      active: { cls: "bg-green-500/15 text-green-500 border-green-500/30", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Active" },
      maintenance: { cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", icon: <Wrench className="w-3 h-3 mr-1" />, label: "Maintenance" },
      out_of_service: { cls: "bg-red-500/15 text-red-500 border-red-500/30", icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: "Out of Service" },
    };
    const cfg = m[s] || { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: null, label: s };
    return <Badge className={cn("border text-xs font-bold", cfg.cls)}>{cfg.icon}{cfg.label}</Badge>;
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "maintenance", label: "Maintenance" },
    { id: "out_of_service", label: "Out of Service" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fleet Management</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Manage your vehicles and equipment</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" />Add Vehicle
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats?.total || 0, icon: <Truck className="w-5 h-5" />, color: "text-cyan-500", bg: "bg-cyan-500/15" },
          { label: "Active", value: stats?.active || 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
          { label: "Maintenance", value: stats?.maintenance || 0, icon: <Wrench className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
          { label: "Avg MPG", value: stats?.avgMpg || "—", icon: <Fuel className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  {statsQuery.isLoading ? (
                    <Skeleton className={cn("h-8 w-14 rounded-lg", isLight ? "bg-slate-200" : "")} />
                  ) : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={cn("relative flex-1 max-w-sm rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className={cn("pl-9 border-0 rounded-xl focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-1" />
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                status === tab.id
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                  : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vehicles List ── */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
            <Truck className="w-5 h-5 text-blue-500" />Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vehiclesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className={cn("h-20 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
          ) : (vehiclesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <Truck className="w-8 h-8 text-slate-400" />
              </div>
              <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No vehicles found</p>
              <p className="text-sm text-slate-400 mt-1">Add your first vehicle to get started</p>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {(vehiclesQuery.data as any)?.map((vehicle: any) => (
                <div key={vehicle.id} className={cn(
                  "p-4 flex items-center justify-between transition-colors",
                  vehicle.status === "out_of_service" && (isLight ? "bg-red-50/50 border-l-3 border-l-red-500" : "bg-red-500/5 border-l-3 border-l-red-500"),
                  isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl",
                      vehicle.status === "active" ? "bg-green-500/15" : vehicle.status === "maintenance" ? "bg-yellow-500/15" : "bg-red-500/15"
                    )}>
                      <Truck className={cn("w-5 h-5",
                        vehicle.status === "active" ? "text-green-500" : vehicle.status === "maintenance" ? "text-yellow-500" : "text-red-500"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>{vehicle.unitNumber}</p>
                        {statusBadge(vehicle.status)}
                      </div>
                      <p className="text-sm text-slate-400">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>VIN: {vehicle.vin}</span>
                        <span>{vehicle.mileage?.toLocaleString()} mi</span>
                        {vehicle.driver && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vehicle.driver}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-[10px] text-slate-400 uppercase">Next Service</p>
                    <p className={valCls}>{vehicle.nextService || "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
