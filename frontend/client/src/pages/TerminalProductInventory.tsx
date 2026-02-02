/**
 * TERMINAL PRODUCT INVENTORY PAGE
 * 100% Dynamic - Track product inventory levels and movements
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Database, Search, AlertTriangle, TrendingUp, TrendingDown,
  Droplet, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalProductInventory() {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const inventoryQuery = trpc.terminal.getProductInventory.useQuery({ product: productFilter });
  const tanksQuery = trpc.terminal.getTanks.useQuery();
  const movementsQuery = trpc.terminal.getInventoryMovements.useQuery();
  const alertsQuery = trpc.terminal.getInventoryAlerts.useQuery();

  const inventory = inventoryQuery.data || [];
  const tanks = tanksQuery.data || [];
  const movements = movementsQuery.data || [];
  const alerts = alertsQuery.data || [];

  const filteredTanks = tanks.filter((t: any) =>
    t.product?.toLowerCase().includes(search.toLowerCase()) ||
    t.tankNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getCapacityColor = (percentage: number) => {
    if (percentage <= 20) return "text-red-400";
    if (percentage <= 40) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Product Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor tank levels and product movements</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            inventoryQuery.refetch();
            tanksQuery.refetch();
          }}
          className="bg-slate-800/50 border-slate-700/50 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", (inventoryQuery.isFetching || tanksQuery.isFetching) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {inventoryQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          inventory.slice(0, 4).map((product: any) => (
            <Card key={product.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">{product.name}</span>
                  <Droplet className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {(product.currentVolume / 1000).toFixed(0)}K
                  <span className="text-slate-400 text-sm font-normal ml-1">gal</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {product.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={cn(
                    "text-xs",
                    product.trend === "up" ? "text-green-400" : "text-red-400"
                  )}>
                    {product.trendValue}% from yesterday
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Low Inventory Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Inventory Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{alert.tankNumber}</p>
                    <p className="text-slate-400 text-sm">{alert.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{alert.levelPercent}%</p>
                    <p className="text-slate-400 text-xs">{alert.volume?.toLocaleString()} gal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tanks or products..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {inventory.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tank List */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Tank Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tanksQuery.isLoading ? (
                <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              ) : filteredTanks.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No tanks found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredTanks.map((tank: any) => (
                    <div key={tank.id} className={cn(
                      "p-4 hover:bg-slate-700/20 transition-colors",
                      tank.levelPercent <= 20 && "border-l-4 border-red-500"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            tank.levelPercent <= 20 ? "bg-red-500/20" :
                            tank.levelPercent <= 40 ? "bg-yellow-500/20" : "bg-green-500/20"
                          )}>
                            <Droplet className={cn(
                              "w-5 h-5",
                              tank.levelPercent <= 20 ? "text-red-400" :
                              tank.levelPercent <= 40 ? "text-yellow-400" : "text-green-400"
                            )} />
                          </div>
                          <div>
                            <p className="text-white font-bold">{tank.tankNumber}</p>
                            <p className="text-slate-400 text-sm">{tank.product}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xl font-bold", getCapacityColor(tank.levelPercent))}>
                            {tank.levelPercent}%
                          </p>
                          <p className="text-slate-400 text-sm">
                            {tank.currentVolume?.toLocaleString()} / {tank.capacity?.toLocaleString()} gal
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={tank.levelPercent}
                        className={cn(
                          "h-3",
                          tank.levelPercent <= 20 && "[&>div]:bg-red-500",
                          tank.levelPercent > 20 && tank.levelPercent <= 40 && "[&>div]:bg-yellow-500"
                        )}
                      />
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>Last gauged: {tank.lastGauged}</span>
                        {tank.ullage && <span>Ullage: {tank.ullage?.toLocaleString()} gal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements */}
        <div>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Recent Movements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {movementsQuery.isLoading ? (
                <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm">No recent movements</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
                  {movements.slice(0, 10).map((movement: any) => (
                    <div key={movement.id} className="p-3 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          movement.type === "receipt" ? "bg-green-500/20" : "bg-red-500/20"
                        )}>
                          {movement.type === "receipt" ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{movement.product}</p>
                          <p className="text-slate-400 text-xs">{movement.tankNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-medium",
                            movement.type === "receipt" ? "text-green-400" : "text-red-400"
                          )}>
                            {movement.type === "receipt" ? "+" : "-"}{movement.volume?.toLocaleString()}
                          </p>
                          <p className="text-slate-500 text-xs">{movement.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
