/**
 * SHIPPER CARRIER PERFORMANCE PAGE
 * 100% Dynamic - Analyze carrier performance metrics and ratings
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
  Star, TrendingUp, Clock, Package, AlertTriangle,
  CheckCircle, Truck, BarChart3, Award, ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperCarrierPerformance() {
  const [timeRange, setTimeRange] = useState("90d");
  const [sortBy, setSortBy] = useState("rating");

  const carriersQuery = (trpc as any).shippers.getCarrierPerformance.useQuery({ period: timeRange as any });
  const summaryQuery = (trpc as any).shippers.getStats.useQuery();

  const carriers = carriersQuery.data || [];
  const summary = summaryQuery.data as any;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 3.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Carrier Performance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and compare carrier metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700/50 rounded-lg">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Truck className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Active Carriers</span>
                </div>
                <p className="text-2xl font-bold text-white">{summary?.activeCarriers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Avg On-Time</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{summary?.avgOnTime || 0}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Avg Rating</span>
                </div>
                <p className="text-2xl font-bold text-white">{summary?.avgRating?.toFixed(1) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{summary?.totalLoads?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Sort by:</span>
        {[
          { value: "rating", label: "Rating" },
          { value: "onTime", label: "On-Time %" },
          { value: "loads", label: "Load Count" },
          { value: "spend", label: "Total Spend" },
        ].map((option: any) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            onClick={() => setSortBy(option.value)}
            className={cn(
              "rounded-lg",
              sortBy === option.value
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                : "bg-slate-700/50 border-slate-600/50"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Carrier List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : carriers.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carrier data available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {carriers.map((carrier: any, idx: number) => (
                <div key={carrier.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{carrier.name}</p>
                          {carrier.preferred && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <Award className="w-3 h-3 mr-1" />Preferred
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">MC# {carrier.mcNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Rating */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s: any) => (
                            <Star
                              key={s}
                              className={cn(
                                "w-4 h-4",
                                s <= Math.round(carrier.rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-600"
                              )}
                            />
                          ))}
                        </div>
                        <p className={cn("font-bold", getRatingColor(carrier.rating))}>
                          {carrier.rating?.toFixed(1)}
                        </p>
                      </div>

                      {/* On-Time */}
                      <div className="text-center w-24">
                        <p className="text-slate-400 text-xs mb-1">On-Time</p>
                        <div className="flex items-center gap-2">
                          <Progress value={carrier.onTimeRate} className="h-2 flex-1" />
                          <span className={cn(
                            "font-medium text-sm",
                            carrier.onTimeRate >= 95 ? "text-green-400" :
                            carrier.onTimeRate >= 85 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {carrier.onTimeRate}%
                          </span>
                        </div>
                      </div>

                      {/* Loads */}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Loads</p>
                        <p className="text-white font-bold">{carrier.loadCount}</p>
                      </div>

                      {/* Total Spend */}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Total Spend</p>
                        <p className="text-green-400 font-bold">${carrier.totalSpend?.toLocaleString()}</p>
                      </div>

                      {/* Claims */}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Claims</p>
                        <p className={cn(
                          "font-medium",
                          carrier.claims === 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {carrier.claims}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Breakdown */}
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400 text-xs">Communication</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s: any) => (
                          <Star key={s} className={cn("w-3 h-3", s <= carrier.communicationRating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                        ))}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400 text-xs">Professionalism</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s: any) => (
                          <Star key={s} className={cn("w-3 h-3", s <= carrier.professionalismRating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                        ))}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400 text-xs">Equipment</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s: any) => (
                          <Star key={s} className={cn("w-3 h-3", s <= carrier.equipmentRating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                        ))}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400 text-xs">Would Use Again</p>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className={cn("w-4 h-4", carrier.wouldUseAgainRate >= 80 ? "text-green-400" : "text-slate-400")} />
                        <span className="text-white text-sm">{carrier.wouldUseAgainRate}%</span>
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
