/**
 * TANK INVENTORY PAGE (Terminal Manager)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Droplet, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  Gauge, Thermometer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TankInventory() {
  const [selectedTerminal, setSelectedTerminal] = useState("");

  const terminalsQuery = trpc.terminal.list.useQuery();
  const tanksQuery = trpc.terminal.getTankInventory.useQuery({ terminalId: selectedTerminal }, { enabled: !!selectedTerminal });
  const summaryQuery = trpc.terminal.getInventorySummary.useQuery({ terminalId: selectedTerminal }, { enabled: !!selectedTerminal });

  const summary = summaryQuery.data;

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 75) return "text-yellow-400";
    if (percentage <= 20) return "text-orange-400";
    return "text-green-400";
  };

  const getCapacityBg = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage <= 20) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Tank Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tank levels and SCADA integration</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue placeholder="Select Terminal" />
            </SelectTrigger>
            <SelectContent>
              {terminalsQuery.data?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => tanksQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!selectedTerminal ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="py-16 text-center">
            <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Droplet className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg">Select a terminal to view inventory</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Droplet className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                      <p className="text-2xl font-bold text-blue-400">{summary?.totalCapacity?.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-slate-400">Total Capacity (bbl)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-cyan-500/20">
                    <Gauge className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                      <p className="text-2xl font-bold text-cyan-400">{summary?.currentInventory?.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-slate-400">Current (bbl)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-green-400">{summary?.utilizationRate}%</p>
                    )}
                    <p className="text-xs text-slate-400">Utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-orange-400">{summary?.lowInventoryTanks || 0}</p>
                    )}
                    <p className="text-xs text-slate-400">Low Inventory</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tank Grid */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Tank Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {tanksQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
              ) : tanksQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No tanks found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tanksQuery.data?.map((tank: any) => {
                    const percentage = (tank.currentLevel / tank.capacity) * 100;
                    return (
                      <div key={tank.id} className={cn("p-4 rounded-xl border-2", percentage >= 90 ? "bg-red-500/10 border-red-500/30" : percentage <= 20 ? "bg-orange-500/10 border-orange-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-bold">{tank.name}</p>
                            <p className="text-sm text-slate-400">{tank.product}</p>
                          </div>
                          {percentage >= 90 && <Badge className="bg-red-500/20 text-red-400 border-0">High</Badge>}
                          {percentage <= 20 && <Badge className="bg-orange-500/20 text-orange-400 border-0">Low</Badge>}
                        </div>

                        {/* Tank Visualization */}
                        <div className="relative h-24 bg-slate-800 rounded-lg overflow-hidden mb-3">
                          <div className={cn("absolute bottom-0 left-0 right-0 transition-all", getCapacityBg(percentage))} style={{ height: `${percentage}%`, opacity: 0.6 }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className={cn("text-3xl font-bold", getCapacityColor(percentage))}>{percentage.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            <p className="text-slate-500">Current</p>
                            <p className="text-white font-medium">{tank.currentLevel?.toLocaleString()} bbl</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            <p className="text-slate-500">Capacity</p>
                            <p className="text-white font-medium">{tank.capacity?.toLocaleString()} bbl</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-slate-500" />
                            <span className="text-white font-medium">{tank.temperature}°F</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            <p className="text-slate-500">Updated</p>
                            <p className="text-white font-medium">{tank.lastUpdate}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Summary */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Product Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  {summary?.productBreakdown?.map((product: any) => (
                    <div key={product.name} className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{product.name}</span>
                        <span className="text-slate-400">{product.volume?.toLocaleString()} bbl</span>
                      </div>
                      <Progress value={product.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
