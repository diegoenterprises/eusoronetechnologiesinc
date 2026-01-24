/**
 * LANE ANALYSIS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, TrendingUp, TrendingDown, DollarSign, Package,
  Search, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LaneAnalysis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("volume");

  const lanesQuery = trpc.analytics.getLanes.useQuery({ sortBy, limit: 50 });
  const summaryQuery = trpc.analytics.getLaneSummary.useQuery();
  const topLanesQuery = trpc.analytics.getTopLanes.useQuery({ limit: 5 });

  const summary = summaryQuery.data;

  const filteredLanes = lanesQuery.data?.filter((lane: any) =>
    !searchTerm || lane.origin?.toLowerCase().includes(searchTerm.toLowerCase()) || lane.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Lane Analysis
        </h1>
        <p className="text-slate-400 text-sm mt-1">Analyze freight lanes and market trends</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalLanes || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Lanes</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
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
              <div className="p-3 rounded-full bg-purple-500/20">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.totalVolume?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Volume</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.growingLanes || 0}</p>
                )}
                <p className="text-xs text-slate-400">Growing Lanes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Lanes */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Top Performing Lanes</CardTitle>
        </CardHeader>
        <CardContent>
          {topLanesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topLanesQuery.data?.map((lane: any, idx: number) => (
                <div key={lane.id} className="p-4 rounded-xl bg-slate-800/50 text-center">
                  <p className="text-xs text-slate-400 mb-2">#{idx + 1}</p>
                  <p className="text-white font-medium text-sm">{lane.origin}</p>
                  <ArrowRight className="w-4 h-4 text-slate-500 mx-auto my-1" />
                  <p className="text-white font-medium text-sm">{lane.destination}</p>
                  <p className="text-emerald-400 font-bold mt-2">${lane.avgRate?.toFixed(2)}/mi</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search lanes..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="rate">Rate</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lanes List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {lanesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredLanes?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No lanes found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLanes?.map((lane: any) => (
                <div key={lane.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{lane.origin}</p>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                          <p className="text-white font-medium">{lane.destination}</p>
                        </div>
                        <p className="text-sm text-slate-400">{lane.distance} miles • {lane.avgTransitTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">${lane.avgRate?.toFixed(2)}/mi</p>
                        <div className={cn("flex items-center gap-1 text-xs", lane.rateChange > 0 ? "text-green-400" : "text-red-400")}>
                          {lane.rateChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(lane.rateChange)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{lane.volume}</p>
                        <p className="text-xs text-slate-500">loads/mo</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">Market Share</span>
                    <div className="flex-1">
                      <Progress value={lane.marketShare} className="h-1.5" />
                    </div>
                    <span className="text-xs text-slate-400">{lane.marketShare}%</span>
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
