/**
 * PERFORMANCE REPORTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Truck,
  Clock, CheckCircle, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformanceReports() {
  const [period, setPeriod] = useState("month");

  const metricsQuery = (trpc as any).reports.getPerformanceMetrics.useQuery({ period });
  const trendsQuery = (trpc as any).reports.getTrends.useQuery({ period });
  const topPerformersQuery = (trpc as any).reports.getTopPerformers.useQuery({ period, limit: 10 });

  const metrics = metricsQuery.data;
  const trends = trendsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Performance Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Analyze operational performance and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              </div>
              {trends?.revenue !== 0 && (
                <div className={cn("flex items-center gap-1 text-sm", (trends?.revenue ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
                  {(trends?.revenue ?? 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(trends?.revenue || 0)}%
                </div>
              )}
            </div>
            {metricsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
              <p className="text-2xl font-bold text-white">${(metrics?.revenue || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              {trends?.loads !== 0 && (
                <div className={cn("flex items-center gap-1 text-sm", (trends?.loads ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
                  {(trends?.loads ?? 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(trends?.loads || 0)}%
                </div>
              )}
            </div>
            {metricsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold text-white">{metrics?.loadsCompleted || 0}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Loads Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              {trends?.onTime !== 0 && (
                <div className={cn("flex items-center gap-1 text-sm", (trends?.onTime ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
                  {(trends?.onTime ?? 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(trends?.onTime || 0)}%
                </div>
              )}
            </div>
            {metricsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold text-white">{metrics?.onTimeRate || 0}%</p>
            )}
            <p className="text-xs text-slate-400 mt-1">On-Time Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              {trends?.avgDelivery !== 0 && (
                <div className={cn("flex items-center gap-1 text-sm", (trends?.avgDelivery ?? 0) < 0 ? "text-green-400" : "text-red-400")}>
                  {(trends?.avgDelivery ?? 0) < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(trends?.avgDelivery || 0)}%
                </div>
              )}
            </div>
            {metricsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold text-white">{metrics?.avgDeliveryTime || 0}h</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Avg Delivery Time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Load Acceptance Rate</span>
                    <span className="text-white font-bold">{metrics?.acceptanceRate || 0}%</span>
                  </div>
                  <Progress value={metrics?.acceptanceRate || 0} className="h-2" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Customer Satisfaction</span>
                    <span className="text-white font-bold">{metrics?.satisfaction || 0}%</span>
                  </div>
                  <Progress value={metrics?.satisfaction || 0} className="h-2" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Fleet Utilization</span>
                    <span className="text-white font-bold">{metrics?.fleetUtilization || 0}%</span>
                  </div>
                  <Progress value={metrics?.fleetUtilization || 0} className="h-2" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Driver Retention</span>
                    <span className="text-white font-bold">{metrics?.driverRetention || 0}%</span>
                  </div>
                  <Progress value={metrics?.driverRetention || 0} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformersQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : (topPerformersQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(topPerformersQuery.data as any)?.map((performer: any, idx: number) => (
                  <div key={performer.id} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold", idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-slate-400 text-black" : idx === 2 ? "bg-orange-600 text-white" : "bg-slate-600 text-white")}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{performer.name}</p>
                        <p className="text-xs text-slate-500">{performer.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">{performer.score}</p>
                      <p className="text-xs text-slate-500">{performer.loads} loads</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics?.revenueByCategory?.map((cat: any) => (
                  <div key={cat.name} className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-2xl font-bold text-white">${(cat.amount || 0).toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-1">{cat.name}</p>
                    <Badge className={cn("mt-2 border-0", cat.change > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                      {cat.change > 0 ? "+" : ""}{cat.change}%
                    </Badge>
                  </div>
                )) || <p className="text-slate-400 col-span-4 text-center py-4">No data available</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
