/**
 * LANE RATES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Route, Search, Plus, DollarSign, TrendingUp,
  TrendingDown, MapPin, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LaneRates() {
  const [searchTerm, setSearchTerm] = useState("");

  const lanesQuery = (trpc as any).laneRates.list.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).laneRates.getSummary.useQuery();
  const topLanesQuery = (trpc as any).laneRates.getTopLanes.useQuery({ limit: 5 });

  const summary = summaryQuery.data;

  const filteredLanes = (lanesQuery.data as any)?.filter((lane: any) =>
    !searchTerm || lane.origin?.toLowerCase().includes(searchTerm.toLowerCase()) || lane.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Lane Rates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Market rates and lane pricing</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Lane
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Route className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalLanes || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Lanes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${summary?.avgRate?.toFixed(2)}</p>
                )}
                <p className="text-xs text-slate-400">Avg Rate/Mile</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.rateChange ?? 0) > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {(summary?.rateChange ?? 0) > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (summary?.rateChange ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
                    {(summary?.rateChange ?? 0) > 0 ? "+" : ""}{summary?.rateChange}%
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
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgMiles}</p>
                )}
                <p className="text-xs text-slate-400">Avg Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search lanes..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Lanes */}
        <Card className="lg:col-span-1 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Top Performing Lanes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topLanesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(topLanesQuery.data as any)?.map((lane: any, idx: number) => (
                  <div key={lane.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                        <span className="text-white text-sm">{lane.origin}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-white text-sm">{lane.destination}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lane.loads} loads</span>
                      <span className="text-emerald-400 font-bold">${lane.avgRate?.toFixed(2)}/mi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Lanes */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">All Lanes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lanesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : filteredLanes?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Route className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No lanes found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
                {filteredLanes?.map((lane: any) => (
                  <div key={lane.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">{lane.origin}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span className="text-white font-medium">{lane.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">${lane.currentRate?.toFixed(2)}/mi</p>
                        <div className={cn("flex items-center gap-1 text-xs", lane.rateChange > 0 ? "text-green-400" : "text-red-400")}>
                          {lane.rateChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {lane.rateChange > 0 ? "+" : ""}{lane.rateChange}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{lane.distance} miles</span>
                      <span>{lane.loadsThisMonth} loads this month</span>
                      <span>Market: ${lane.marketRate?.toFixed(2)}/mi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
