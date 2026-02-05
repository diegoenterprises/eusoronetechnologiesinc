/**
 * TANK INVENTORY PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Database, Droplets, AlertTriangle, TrendingUp,
  TrendingDown, MapPin, RefreshCw, Thermometer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TankInventory() {
  const [selectedTerminal, setSelectedTerminal] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const tanksQuery = (trpc as any).terminals.getTankInventory.useQuery({ terminalId: selectedTerminal === "all" ? undefined : selectedTerminal, product: selectedProduct === "all" ? undefined : selectedProduct }, { refetchInterval: 60000 });
  const terminalsQuery = (trpc as any).terminals.getTerminals.useQuery();
  const productsQuery = (trpc as any).terminals.getProducts.useQuery();
  const statsQuery = (trpc as any).terminals.getInventoryStats.useQuery();

  const stats = statsQuery.data;

  const getLevelColor = (percentage: number) => {
    if (percentage < 20) return "text-red-400";
    if (percentage < 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getLevelBg = (percentage: number) => {
    if (percentage < 20) return "[&>div]:bg-red-500";
    if (percentage < 40) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-green-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Tank Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tank levels and inventory</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <MapPin className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terminals</SelectItem>
              {(terminalsQuery.data as any)?.map((terminal: any) => (
                <SelectItem key={terminal.id} value={terminal.id}>{terminal.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <Droplets className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {(productsQuery.data as any)?.map((product: any) => (
                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => tanksQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.totalTanks || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Tanks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Droplets className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.totalVolume?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total BBL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.lowLevel || 0}</p>
                )}
                <p className="text-xs text-slate-400">Low Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.avgFillLevel}%</p>
                )}
                <p className="text-xs text-slate-400">Avg Fill</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tanks Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Storage Tanks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tanksQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i: any) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
          ) : (tanksQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No tanks found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(tanksQuery.data as any)?.map((tank: any) => (
                <div key={tank.id} className={cn("p-4 rounded-xl border", tank.fillPercentage < 20 ? "bg-red-500/5 border-red-500/30" : tank.fillPercentage < 40 ? "bg-yellow-500/5 border-yellow-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold">{tank.name}</p>
                    {tank.fillPercentage < 20 && <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{tank.terminalName}</p>

                  {/* Tank Visual */}
                  <div className="relative h-24 bg-slate-800/50 rounded-lg overflow-hidden mb-3">
                    <div className={cn("absolute bottom-0 left-0 right-0 transition-all", tank.fillPercentage < 20 ? "bg-red-500/30" : tank.fillPercentage < 40 ? "bg-yellow-500/30" : "bg-cyan-500/30")} style={{ height: `${tank.fillPercentage}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn("text-2xl font-bold", getLevelColor(tank.fillPercentage))}>{tank.fillPercentage}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Product</span>
                      <span className="text-slate-300">{tank.product}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Volume</span>
                      <span className="text-slate-300">{tank.currentVolume?.toLocaleString()} / {tank.capacity?.toLocaleString()} BBL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Thermometer className="w-3 h-3" />Temp</span>
                      <span className="text-slate-300">{tank.temperature}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trend</span>
                      <span className={cn("flex items-center gap-1", tank.trend === "up" ? "text-green-400" : tank.trend === "down" ? "text-red-400" : "text-slate-400")}>
                        {tank.trend === "up" ? <TrendingUp className="w-3 h-3" /> : tank.trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                        {tank.trendValue}
                      </span>
                    </div>
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
