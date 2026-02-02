/**
 * SHIPPER SPEND ANALYTICS PAGE
 * 100% Dynamic - Cost per mile, carrier spend, accessorial breakdown
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
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  PieChart, MapPin, Truck, Calendar, Download,
  ArrowUpRight, ArrowDownRight, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperSpendAnalytics() {
  const [period, setPeriod] = useState("month");
  const [view, setView] = useState("overview");

  const statsQuery = trpc.analytics.getShipperSpendStats.useQuery({ period });
  const laneQuery = trpc.analytics.getLaneCosts.useQuery({ period });
  const carrierQuery = trpc.analytics.getCarrierSpend.useQuery({ period });
  const accessorialQuery = trpc.analytics.getAccessorialBreakdown.useQuery({ period });
  const trendQuery = trpc.analytics.getSpendTrend.useQuery({ period });

  const stats = statsQuery.data;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Spend Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track transportation costs and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <Badge className={cn("border-0", (stats?.spendChange ?? 0) >= 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                    {(stats?.spendChange ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(stats?.spendChange ?? 0)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.totalSpend ?? 0)}</p>
                <p className="text-xs text-slate-400">Total Spend</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <Badge className={cn("border-0", (stats?.cpmChange ?? 0) >= 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                    {(stats?.cpmChange ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(stats?.cpmChange ?? 0)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white">${stats?.costPerMile?.toFixed(2) ?? "0.00"}</p>
                <p className="text-xs text-slate-400">Cost Per Mile</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Truck className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalLoads ?? 0}</p>
                <p className="text-xs text-slate-400">Total Loads</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.budgetUtilization ?? 0}%</p>
                <p className="text-xs text-slate-400">Budget Used</p>
                <Progress value={stats?.budgetUtilization ?? 0} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Lane Costs */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Cost by Lane
          </CardTitle>
        </CardHeader>
        <CardContent>
          {laneQuery.isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : laneQuery.data?.length === 0 ? (
            <div className="text-center py-8"><MapPin className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400">No lane data</p></div>
          ) : (
            <div className="space-y-3">
              {laneQuery.data?.map((lane: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium">{lane.origin} → {lane.destination}</div>
                      <Badge className="bg-slate-600/50 text-slate-300 border-0">{lane.loadCount} loads</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(lane.totalSpend)}</p>
                      <p className="text-slate-400 text-sm">${lane.avgCostPerMile?.toFixed(2)}/mi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{lane.avgMiles} avg miles</span>
                    <span className={cn(lane.trend > 0 ? "text-red-400" : "text-green-400")}>
                      {lane.trend > 0 ? "+" : ""}{lane.trend}% vs last period
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrier Spend */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-400" />
              Top Carriers by Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carrierQuery.isLoading ? (
              <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-3">
                {carrierQuery.data?.map((carrier: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{carrier.name}</p>
                        <p className="text-slate-400 text-xs">{carrier.loadCount} loads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(carrier.spend)}</p>
                      <p className="text-slate-400 text-xs">{carrier.percentOfTotal}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accessorial Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-yellow-400" />
              Accessorial Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accessorialQuery.isLoading ? (
              <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-3">
                {accessorialQuery.data?.map((item: any, index: number) => {
                  const colors = ["bg-cyan-500", "bg-purple-500", "bg-yellow-500", "bg-green-500", "bg-pink-500"];
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 text-sm">{item.type}</span>
                        <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", colors[index % colors.length])}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
