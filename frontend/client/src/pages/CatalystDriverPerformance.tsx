/**
 * CATALYST DRIVER PERFORMANCE PAGE
 * 100% Dynamic - Monitor and analyze driver performance metrics
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
  Users, Search, Star, TrendingUp, TrendingDown,
  Clock, Truck, DollarSign, Shield, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystDriverPerformance() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [sortBy, setSortBy] = useState("score");

  const driversQuery = trpc.catalysts.getDriverPerformance.useQuery({ period: periodFilter, sortBy });
  const statsQuery = trpc.catalysts.getPerformanceStats.useQuery({ period: periodFilter });

  const drivers = driversQuery.data || [];
  const stats = statsQuery.data;

  const filteredDrivers = drivers.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Performance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor driver metrics and rankings</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.activeDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Avg Score</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.avgScore || 0}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">On-Time Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.onTimeRate || 0}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalLoads?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalRevenue?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Performers */}
      {stats?.topPerformers && stats.topPerformers.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topPerformers.slice(0, 3).map((driver: any, idx: number) => (
                <div key={driver.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                    idx === 0 ? "bg-yellow-500/30 text-yellow-400" :
                    idx === 1 ? "bg-slate-400/30 text-slate-300" :
                    "bg-orange-500/30 text-orange-400"
                  )}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{driver.name}</p>
                    <p className="text-slate-400 text-sm">{driver.loads} loads • {driver.onTimeRate}% on-time</p>
                  </div>
                  <p className="text-green-400 font-bold">{driver.score}%</p>
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
                placeholder="Search drivers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="loads">Loads</SelectItem>
                <SelectItem value="ontime">On-Time Rate</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredDrivers.map((driver: any, idx: number) => (
                <div key={driver.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{driver.name}</p>
                          {driver.rank === 1 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <Award className="w-3 h-3 mr-1" />Top Performer
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {driver.truckNumber} • {driver.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Score</span>
                          <span className={getScoreColor(driver.score)}>{driver.score}%</span>
                        </div>
                        <Progress value={driver.score} className="h-2" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Loads</p>
                        <p className="text-white font-bold">{driver.loadsCompleted}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Time</p>
                        <p className={cn(
                          "font-bold",
                          driver.onTimeRate >= 95 ? "text-green-400" :
                          driver.onTimeRate >= 90 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {driver.onTimeRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Miles</p>
                        <p className="text-white">{driver.distance?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Revenue</p>
                        <p className="text-green-400 font-bold">${driver.revenue?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(driver.trend)}
                        <span className={cn(
                          "text-sm",
                          driver.trend === "up" ? "text-green-400" :
                          driver.trend === "down" ? "text-red-400" : "text-slate-500"
                        )}>
                          {driver.trendValue}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {driver.flags && driver.flags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                      {driver.flags.map((flag: any, fidx: number) => (
                        <Badge key={fidx} className={cn(
                          "border-0 text-xs",
                          flag.type === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          flag.type === "alert" ? "bg-red-500/20 text-red-400" :
                          "bg-green-500/20 text-green-400"
                        )}>
                          {flag.message}
                        </Badge>
                      ))}
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
