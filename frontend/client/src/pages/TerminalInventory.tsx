/**
 * TERMINAL INVENTORY PAGE - Terminal Manager
 * 100% Dynamic - No mock data
 * Tank levels, commodity tracking, SCADA integration
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
  Database, Droplets, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Gauge, Thermometer, BarChart3, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalInventory() {
  const [productFilter, setProductFilter] = useState("all");

  const tanksQuery = (trpc as any).terminals.getTankInventory.useQuery({});
  const statsQuery = (trpc as any).terminals.getInventoryStats.useQuery();

  const getTankFillColor = (percent: number) => {
    if (percent >= 90) return "from-red-500 to-red-600";
    if (percent >= 75) return "from-yellow-500 to-yellow-600";
    if (percent <= 20) return "from-orange-500 to-orange-600";
    return "from-cyan-500 to-blue-500";
  };

  const getTankStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "receiving":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Receiving</Badge>;
      case "dispensing":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Dispensing</Badge>;
      case "maintenance":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Maintenance</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Tank Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tank levels and commodity tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="gasoline">Gasoline</SelectItem>
              <SelectItem value="jet_fuel">Jet Fuel</SelectItem>
              <SelectItem value="crude">Crude Oil</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
            onClick={() => tanksQuery.refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            EIA Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Database className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.totalCapacity?.toLocaleString() || 0}</p>
                    <p className="text-xs text-slate-400">Total Capacity (bbl)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.currentInventory?.toLocaleString() || 0}</p>
                    <p className="text-xs text-slate-400">Current Inventory (bbl)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Gauge className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.utilization || 0}%</p>
                    <p className="text-xs text-slate-400">Utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.lowLevelAlerts || 0}</p>
                    <p className="text-xs text-slate-400">Low Level Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Tank Farm Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tanksQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tanksQuery.data as any)?.map((tank: any) => (
                <div
                  key={tank.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-white font-bold">{tank.name}</span>
                      <p className="text-xs text-slate-400">{tank.product}</p>
                    </div>
                    {getTankStatusBadge(tank.status)}
                  </div>

                  <div className="relative h-24 bg-slate-800/50 rounded-lg mb-3 overflow-hidden">
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-500",
                        getTankFillColor(tank.fillPercent)
                      )}
                      style={{ height: `${tank.fillPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl drop-shadow-lg">
                        {tank.fillPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Droplets className="w-3 h-3" />
                      <span>{tank.currentVolume?.toLocaleString()} bbl</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Database className="w-3 h-3" />
                      <span>{tank.capacity?.toLocaleString()} bbl cap</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Thermometer className="w-3 h-3" />
                      <span>{tank.temperature}°F</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {tank.trend === "up" ? (
                        <><TrendingUp className="w-3 h-3 text-green-400" /><span className="text-green-400">+{tank.trendValue} bbl/hr</span></>
                      ) : tank.trend === "down" ? (
                        <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400">-{tank.trendValue} bbl/hr</span></>
                      ) : (
                        <span className="text-slate-400">Stable</span>
                      )}
                    </div>
                  </div>

                  {tank.fillPercent >= 90 && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        High level warning
                      </p>
                    </div>
                  )}
                  {tank.fillPercent <= 20 && (
                    <div className="mt-2 p-2 rounded bg-orange-500/10 border border-orange-500/30">
                      <p className="text-xs text-orange-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low level alert
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
