/**
 * SHIPPER LANE ANALYSIS PAGE
 * 100% Dynamic - Analyze shipping lane performance and costs
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, MapPin, DollarSign, Truck,
  Clock, BarChart3, Search, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperLaneAnalysis() {
  const [timeRange, setTimeRange] = useState("90d");
  const [search, setSearch] = useState("");

  const lanesQuery = trpc.shippers.getLaneAnalysis.useQuery({ timeRange });
  const statsQuery = trpc.shippers.getLaneStats.useQuery({ timeRange });

  const lanes = lanesQuery.data || [];
  const stats = statsQuery.data;

  const filteredLanes = lanes.filter((l: any) =>
    l.origin?.toLowerCase().includes(search.toLowerCase()) ||
    l.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Lane Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Shipping lane performance insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="180d">Last 6 Months</SelectItem>
            <SelectItem value="365d">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Lanes</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.activeLanes || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm">Avg Rate/Mile</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.avgRatePerMile?.toFixed(2) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Transit</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.avgTransitDays?.toFixed(1) || 0} days</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">On-Time Rate</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.onTimeRate || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lanes by origin or destination..."
          className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg"
        />
      </div>

      {/* Lane List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {lanesQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredLanes.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No lanes found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLanes.map((lane: any) => (
                <div key={lane.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-white font-bold">{lane.origin}</p>
                          <p className="text-slate-400 text-sm">{lane.originState}</p>
                        </div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
                        <div className="text-center">
                          <p className="text-white font-bold">{lane.destination}</p>
                          <p className="text-slate-400 text-sm">{lane.destinationState}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-600/50 text-slate-300 border-0">
                        {lane.miles} mi
                      </Badge>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Load Count</p>
                        <p className="text-white font-bold">{lane.loadCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Avg Rate</p>
                        <p className="text-green-400 font-bold">${lane.avgRate?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rate/Mile</p>
                        <div className="flex items-center gap-1">
                          <span className="text-white font-bold">${lane.ratePerMile?.toFixed(2)}</span>
                          {lane.rateTrend > 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-400" />
                          ) : lane.rateTrend < 0 ? (
                            <TrendingDown className="w-4 h-4 text-green-400" />
                          ) : null}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Time</p>
                        <p className={cn(
                          "font-bold",
                          lane.onTimeRate >= 95 ? "text-green-400" :
                          lane.onTimeRate >= 85 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {lane.onTimeRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Carriers</p>
                        <p className="text-white font-bold">{lane.carrierCount}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Details
                      </Button>
                    </div>
                  </div>

                  {lane.topCarriers && lane.topCarriers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Top carriers:</span>
                      {lane.topCarriers.slice(0, 3).map((c: string, idx: number) => (
                        <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{c}</Badge>
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
