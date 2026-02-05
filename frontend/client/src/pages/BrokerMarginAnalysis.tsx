/**
 * BROKER MARGIN ANALYSIS PAGE
 * 100% Dynamic - Analyze profit margins and commission tracking
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
  TrendingUp, Search, DollarSign, Percent, BarChart3,
  ArrowUp, ArrowDown, Calendar, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerMarginAnalysis() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [laneFilter, setLaneFilter] = useState("all");

  const marginsQuery = (trpc as any).brokers.getShippers.useQuery({ search: "" });
  const statsQuery = (trpc as any).brokers.getDashboardStats.useQuery();
  const trendsQuery = (trpc as any).brokers.getShippers.useQuery({ search: "" });

  const margins = marginsQuery.data || [];
  const stats = statsQuery.data as any;
  const trends = trendsQuery.data || [];

  const filteredMargins = margins.filter((m: any) =>
    m.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    m.lane?.toLowerCase().includes(search.toLowerCase())
  );

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "text-green-400";
    if (margin >= 10) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Margin Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track profit margins and commissions</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">${stats?.totalRevenue?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats?.revenueTrend >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={cn(
                    "text-xs",
                    stats?.revenueTrend >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {Math.abs(stats?.revenueTrend || 0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Gross Profit</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">${stats?.grossProfit?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats?.profitTrend >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={cn(
                    "text-xs",
                    stats?.profitTrend >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {Math.abs(stats?.profitTrend || 0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Avg Margin</span>
                </div>
                <p className={cn("text-2xl font-bold", getMarginColor(stats?.avgMargin || 0))}>
                  {stats?.avgMargin?.toFixed(1) || 0}%
                </p>
                <p className="text-slate-500 text-xs mt-1">Target: 12%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalLoads?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">
                  ${stats?.avgLoadValue?.toLocaleString() || 0} avg
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Commission</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalCommission?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {stats?.commissionRate || 0}% rate
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Lanes by Margin */}
      {trends.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Top Performing Lanes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trends.slice(0, 6).map((lane: any) => (
                <div key={lane.id} className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium truncate">{lane.lane}</p>
                    <Badge className={cn(
                      "border-0",
                      lane.margin >= 15 ? "bg-green-500/20 text-green-400" :
                      lane.margin >= 10 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {lane.margin}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{lane.loads} loads</span>
                    <span className="text-green-400">${lane.profit?.toLocaleString()}</span>
                  </div>
                  <Progress value={lane.margin * 5} className="h-1 mt-2" />
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search loads or lanes..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={laneFilter} onValueChange={setLaneFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="All Lanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lanes</SelectItem>
                {trends.map((t: any) => (
                  <SelectItem key={t.id} value={t.lane}>{t.lane}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {marginsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredMargins.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No margin data found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredMargins.map((m: any) => (
                <div key={m.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        m.margin >= 15 ? "bg-green-500/20" :
                        m.margin >= 10 ? "bg-yellow-500/20" : "bg-red-500/20"
                      )}>
                        <Percent className={cn(
                          "w-5 h-5",
                          m.margin >= 15 ? "text-green-400" :
                          m.margin >= 10 ? "text-yellow-400" : "text-red-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-white font-bold">#{m.loadNumber}</p>
                        <p className="text-slate-400 text-sm">{m.lane}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Revenue</p>
                        <p className="text-white font-medium">${m.revenue?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Cost</p>
                        <p className="text-white">${m.cost?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Profit</p>
                        <p className="text-green-400 font-bold">${m.profit?.toLocaleString()}</p>
                      </div>
                      <div className="text-center w-20">
                        <p className="text-slate-400 text-xs">Margin</p>
                        <p className={cn("font-bold text-lg", getMarginColor(m.margin))}>
                          {m.margin?.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-slate-300">{m.date}</p>
                      </div>
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
