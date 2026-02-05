/**
 * TERMINAL TANK INVENTORY PAGE
 * 100% Dynamic - Real-time tank levels with SCADA integration
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Droplets, Thermometer, Gauge, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Clock,
  RefreshCw, Download, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalTankInventory() {
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  const tanksQuery = trpc.terminals.getTanks.useQuery();
  const scadaQuery = trpc.terminals.getScadaStats.useQuery(undefined, { refetchInterval: 5000 });
  const movementQuery = trpc.terminals.getInventoryStats.useQuery();

  const tanks = tanksQuery.data || [];
  const scada = scadaQuery.data;
  const movement = movementQuery.data;

  const totalCapacity = tanks.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0);
  const totalVolume = tanks.reduce((sum: number, t: any) => sum + (t.currentVolume || 0), 0);
  const utilizationPercent = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;

  const getLevelColor = (percent: number) => {
    if (percent < 20) return { bg: "bg-red-500", text: "text-red-400", ring: "ring-red-500/30" };
    if (percent < 40) return { bg: "bg-yellow-500", text: "text-yellow-400", ring: "ring-yellow-500/30" };
    return { bg: "bg-green-500", text: "text-green-400", ring: "ring-green-500/30" };
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Tank Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time storage levels</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("border-0", (scada as any)?.connected || scada?.terminalsOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            <Activity className={cn("w-3 h-3 mr-1", (scada as any)?.syncing && "animate-pulse")} />
            SCADA {(scada as any)?.connected || scada?.terminalsOnline ? "Live" : "Offline"}
          </Badge>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="gasoline">Gasoline</SelectItem>
              <SelectItem value="jet">Jet Fuel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tanksQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Droplets className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Total Volume</span>
                </div>
                <p className="text-2xl font-bold text-white">{(totalVolume / 1000).toFixed(1)}K gal</p>
                <p className="text-slate-400 text-xs mt-1">of {(totalCapacity / 1000).toFixed(1)}K capacity</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Utilization</span>
                </div>
                <p className="text-2xl font-bold text-white">{utilizationPercent.toFixed(1)}%</p>
                <Progress value={utilizationPercent} className="h-1.5 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Received (24h)</span>
                </div>
                <p className="text-2xl font-bold text-green-400">+{(movement as any)?.received?.toLocaleString() || 0}</p>
                <p className="text-slate-400 text-xs mt-1">gallons</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Dispatched (24h)</span>
                </div>
                <p className="text-2xl font-bold text-red-400">-{(movement as any)?.dispatched?.toLocaleString() || 0}</p>
                <p className="text-slate-400 text-xs mt-1">gallons</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tank Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Storage Tanks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tanksQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tanks.map((tank: any) => {
                const percent = tank.capacity > 0 ? (tank.currentVolume / tank.capacity) * 100 : 0;
                const colors = getLevelColor(percent);
                
                return (
                  <div
                    key={tank.id}
                    className={cn(
                      "p-4 rounded-lg bg-slate-700/30 border-2 border-slate-600/30",
                      percent < 20 && "border-red-500/30 bg-red-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-bold">{tank.name}</span>
                      <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                        {tank.product}
                      </Badge>
                    </div>

                    {/* Visual Tank */}
                    <div className="relative h-24 w-full bg-slate-800 rounded-lg overflow-hidden mb-3">
                      <div
                        className={cn("absolute bottom-0 left-0 right-0 transition-all", colors.bg)}
                        style={{ height: `${percent}%`, opacity: 0.3 }}
                      />
                      <div
                        className={cn("absolute bottom-0 left-0 right-0 transition-all", colors.bg)}
                        style={{ height: `${percent}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("font-bold text-xl", colors.text)}>
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Volume</span>
                        <span className="text-white">{tank.currentVolume?.toLocaleString()} gal</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Capacity</span>
                        <span className="text-white">{tank.capacity?.toLocaleString()} gal</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />Temp
                        </span>
                        <span className="text-white">{tank.temperature}°F</span>
                      </div>
                    </div>

                    {percent < 20 && (
                      <div className="mt-3 p-2 rounded bg-red-500/10 flex items-center gap-2 text-red-400 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        Low level alert
                      </div>
                    )}

                    {tank.lastUpdated && (
                      <div className="mt-2 flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {tank.lastUpdated}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
