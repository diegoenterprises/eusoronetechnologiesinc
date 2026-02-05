/**
 * BROKER LOAD PROFITABILITY PAGE
 * 100% Dynamic - Analyze load-level profitability and margins
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
  DollarSign, Search, TrendingUp, TrendingDown, BarChart3,
  Truck, AlertTriangle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerLoadProfitability() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [marginFilter, setMarginFilter] = useState("all");

  const loadsQuery = trpc.brokers.getShippers.useQuery({ search: "" });
  const statsQuery = trpc.brokers.getDashboardStats.useQuery();
  const topLanesQuery = trpc.brokers.getShippers.useQuery({ search: "" });

  const loads = loadsQuery.data || [];
  const stats = statsQuery.data as any;
  const topLanes = topLanesQuery.data || [];

  const filteredLoads = loads.filter((l: any) =>
    l.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.shipper?.toLowerCase().includes(search.toLowerCase()) ||
    l.carrier?.toLowerCase().includes(search.toLowerCase())
  );

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-400";
    if (margin >= 10) return "text-yellow-400";
    if (margin >= 0) return "text-orange-400";
    return "text-red-400";
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 20) return "bg-green-500/20";
    if (margin >= 10) return "bg-yellow-500/20";
    if (margin >= 0) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Load Profitability
          </h1>
          <p className="text-slate-400 text-sm mt-1">Analyze margin and profit per load</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Total Profit</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalProfit?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats?.profitTrend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={cn("text-xs", stats?.profitTrend > 0 ? "text-green-400" : "text-red-400")}>
                    {Math.abs(stats?.profitTrend || 0)}% vs last period
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Avg Margin</span>
                </div>
                <p className={cn("text-2xl font-bold", getMarginColor(stats?.avgMargin || 0))}>
                  {stats?.avgMargin?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">High Margin</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.highMarginLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Low/Negative</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.lowMarginLoads || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Lanes */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Top Profitable Lanes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLanesQuery.isLoading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topLanes.slice(0, 3).map((lane: any, idx: number) => (
                <div key={lane.id} className="p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-500/20 text-green-400 border-0">#{idx + 1}</Badge>
                    <span className={cn("font-bold", getMarginColor(lane.avgMargin))}>
                      {lane.avgMargin?.toFixed(1)}% margin
                    </span>
                  </div>
                  <p className="text-white font-medium">{lane.origin} → {lane.destination}</p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-slate-400">{lane.loadCount} loads</span>
                    <span className="text-green-400">${lane.totalProfit?.toLocaleString()} profit</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={marginFilter} onValueChange={setMarginFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Margin Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Margins</SelectItem>
                <SelectItem value="high">High (20%+)</SelectItem>
                <SelectItem value="medium">Medium (10-20%)</SelectItem>
                <SelectItem value="low">Low (0-10%)</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads.map((load: any) => (
                <div key={load.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  load.margin < 0 && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", getMarginBgColor(load.margin))}>
                        <span className={cn("text-lg font-bold", getMarginColor(load.margin))}>
                          {load.margin?.toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{load.loadNumber}</p>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {load.equipmentType}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {load.origin} → {load.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Revenue</p>
                        <p className="text-white font-medium">${load.revenue?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Cost</p>
                        <p className="text-white">${load.cost?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Profit</p>
                        <p className={cn("font-bold", load.profit >= 0 ? "text-green-400" : "text-red-400")}>
                          {load.profit >= 0 ? "+" : ""}{load.profit?.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Margin</span>
                          <span className={getMarginColor(load.margin)}>{load.margin?.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.max(0, Math.min(100, load.margin * 2.5))} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">Shipper: <span className="text-white">{load.shipper}</span></span>
                      <span className="text-slate-400">Carrier: <span className="text-white">{load.carrier}</span></span>
                    </div>
                    <span className="text-slate-500">{load.deliveryDate}</span>
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
