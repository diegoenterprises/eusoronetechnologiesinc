/**
 * MARKET INTELLIGENCE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, TrendingDown, Truck, DollarSign,
  MapPin, RefreshCw, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketIntelligence() {
  const [region, setRegion] = useState("national");
  const [timeframe, setTimeframe] = useState("week");

  const marketQuery = (trpc as any).market.getIntelligence.useQuery({ region, timeframe });
  const trendsQuery = (trpc as any).market.getTrends.useQuery({ region, timeframe });
  const hotLanesQuery = (trpc as any).market.getHotLanes.useQuery({ limit: 10 });
  const capacityQuery = (trpc as any).market.getCapacity.useQuery({ region });

  const market = marketQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Market Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time market data and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National</SelectItem>
              <SelectItem value="northeast">Northeast</SelectItem>
              <SelectItem value="southeast">Southeast</SelectItem>
              <SelectItem value="midwest">Midwest</SelectItem>
              <SelectItem value="southwest">Southwest</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => marketQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              </div>
              <div>
                {marketQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${market?.avgSpotRate?.toFixed(2)}</p>
                )}
                <p className="text-xs text-slate-400">Avg Spot Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {marketQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{market?.loadToTruckRatio?.toFixed(1)}</p>
                )}
                <p className="text-xs text-slate-400">Load/Truck Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (market?.rateChange ?? 0) > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {(market?.rateChange ?? 0) > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {marketQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (market?.rateChange ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
                    {(market?.rateChange ?? 0) > 0 ? "+" : ""}{market?.rateChange}%
                  </p>
                )}
                <p className="text-xs text-slate-400">Rate Change</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {marketQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{market?.totalLoads?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Available Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Lanes */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Hot Lanes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {hotLanesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(hotLanesQuery.data as any)?.map((lane: any) => (
                  <div key={lane.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-white">{lane.origin}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="text-white">{lane.destination}</span>
                      </div>
                      <Badge className={cn(lane.demand === "high" ? "bg-red-500/20 text-red-400" : lane.demand === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400", "border-0")}>{lane.demand}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{lane.loads} loads available</span>
                      <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${lane.avgRate?.toFixed(2)}/mi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capacity by Region */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              Capacity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capacityQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {(capacityQuery.data as any)?.regions?.map((region: any) => (
                  <div key={region.name} className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{region.name}</span>
                      <Badge className={cn(region.capacity === "tight" ? "bg-red-500/20 text-red-400" : region.capacity === "balanced" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400", "border-0")}>{region.capacity}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Trucks: {region.trucks?.toLocaleString()}</span>
                      <span>Loads: {region.loads?.toLocaleString()}</span>
                      <span>Ratio: {region.ratio?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rate Trends */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="flex items-end gap-2 h-48">
              {(trendsQuery.data as any)?.map((point: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={cn("w-full rounded-t transition-all", point.rate > trendsQuery.data[0]?.rate ? "bg-gradient-to-t from-green-500 to-emerald-500" : "bg-gradient-to-t from-cyan-500 to-blue-500")} style={{ height: `${(point.rate / Math.max(...trendsQuery.data.map((p: any) => p.rate))) * 100}%` }} />
                  <p className="text-xs text-slate-500 mt-2">{point.date}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
