/**
 * TRUCK POSTING BOARD PAGE
 * Frontend for truckPosting router — carriers post available trucks,
 * shippers/brokers search for capacity with hazmat-class-aware matching.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Flame, Shield, Search, Package,
  TrendingUp, BarChart3, CheckCircle, Star, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";

const MARKET_COLORS: Record<string, string> = {
  tight: "text-red-400 bg-red-500/20",
  balanced: "text-yellow-400 bg-yellow-500/20",
  loose: "text-green-400 bg-green-500/20",
};

export default function TruckPostingBoard() {
  const [hazmatFilter, setHazmatFilter] = useState(false);
  const [equipFilter, setEquipFilter] = useState<string>("");

  const capacityQuery = (trpc as any).truckPosting.getCapacityStats.useQuery();
  const searchQuery = (trpc as any).truckPosting.searchTrucks.useQuery({
    hazmatRequired: hazmatFilter || undefined,
    equipmentType: equipFilter || undefined,
    limit: 50,
  });
  const myFleetQuery = (trpc as any).truckPosting.getMyFleetAvailability.useQuery();

  const cap = capacityQuery.data;
  const trucks = searchQuery.data?.trucks || [];
  const myFleet = myFleetQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Truck Posting Board</h1>
          <p className="text-slate-400 text-sm mt-1">Find available capacity or post your trucks</p>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Available Trucks", value: cap?.availableTrucks || 0, icon: <Truck className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
          { label: "Posted Loads", value: cap?.postedLoads || 0, icon: <Package className="w-5 h-5 text-cyan-400" />, color: "text-cyan-400" },
          { label: "Load-to-Truck", value: cap?.ratio?.toFixed(2) || "0", icon: <BarChart3 className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
          { label: "Market", value: cap?.market || "N/A", icon: <TrendingUp className="w-5 h-5 text-yellow-400" />, color: cap?.market ? MARKET_COLORS[cap.market]?.split(" ")[0] || "text-slate-400" : "text-slate-400" },
          { label: "Hazmat Trucks", value: cap?.hazmatTrucks || 0, icon: <Flame className="w-5 h-5 text-orange-400" />, color: "text-orange-400" },
          { label: "Hazmat Loads", value: cap?.hazmatLoads || 0, icon: <Flame className="w-5 h-5 text-red-400" />, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              {capacityQuery.isLoading ? <Skeleton className="h-6 w-10 mx-auto" /> : <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>}
              <p className="text-[9px] text-slate-400 uppercase">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={hazmatFilter ? "default" : "outline"} onClick={() => setHazmatFilter(!hazmatFilter)}
          className={hazmatFilter ? "bg-orange-600 hover:bg-orange-700" : "border-slate-600 text-slate-300"}>
          <Flame className="w-3 h-3 mr-1" />Hazmat Only
        </Button>
        {["", "tanker", "dry_van", "flatbed", "refrigerated"].map(eq => (
          <Button key={eq} size="sm" variant={equipFilter === eq ? "default" : "outline"} onClick={() => setEquipFilter(eq)}
            className={equipFilter === eq ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {eq || "All Types"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Trucks */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-[#1473FF]" />Available Trucks
              <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{trucks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {searchQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : trucks.length === 0 ? (
              <div className="p-8 text-center"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No trucks available</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {trucks.map((t: any) => (
                  <div key={t.vehicleId} className="p-3 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium text-sm">{t.make} {t.model} {t.year}</span>
                        <Badge variant="outline" className="text-[9px] border-slate-600">{t.vehicleType}</Badge>
                      </div>
                      {t.hazmat?.fullyQualified && <Badge className="bg-orange-500/20 text-orange-400 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />Hazmat Qualified</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{t.company?.name}</span>
                      {t.company?.dotNumber && <span>DOT# {t.company.dotNumber}</span>}
                      {t.capacity > 0 && <span>{t.capacity.toLocaleString()} capacity</span>}
                    </div>
                    {t.driver && <p className="text-xs text-slate-400 mt-1"><Navigation className="w-3 h-3 inline mr-1" />{t.driver.name}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Fleet */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />My Fleet Availability
              <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{myFleet.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {myFleetQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : myFleet.length === 0 ? (
              <div className="p-8 text-center"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No vehicles in your fleet</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {myFleet.map((v: any) => (
                  <div key={v.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{v.make} {v.model} {v.year}</p>
                        <p className="text-xs text-slate-500">{v.vehicleType} · {v.licensePlate || v.vin}</p>
                      </div>
                      <Badge className={cn("text-[9px]", v.status === "available" ? "bg-green-500/20 text-green-400" : v.status === "in_use" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400")}>{v.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
