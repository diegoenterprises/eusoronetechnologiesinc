/**
 * ON-TIME PERFORMANCE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, TrendingUp, TrendingDown, CheckCircle, AlertTriangle,
  Target, Download, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnTimePerformance() {
  const [dateRange, setDateRange] = useState("month");

  const summaryQuery = trpc.analytics.getOnTimeSummary.useQuery({ dateRange });
  const byCustomerQuery = trpc.analytics.getOnTimeByCustomer.useQuery({ dateRange, limit: 10 });
  const byLaneQuery = trpc.analytics.getOnTimeByLane.useQuery({ dateRange, limit: 10 });
  const trendsQuery = trpc.analytics.getOnTimeTrends.useQuery({ dateRange });

  const summary = summaryQuery.data;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-400";
    if (percentage >= 90) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            On-Time Performance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track delivery performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("rounded-xl", summary?.onTimeRate >= 95 ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", summary?.onTimeRate >= 95 ? "bg-green-500/20" : "bg-blue-500/20")}>
                <Clock className={cn("w-6 h-6", summary?.onTimeRate >= 95 ? "text-green-400" : "text-blue-400")} />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", getPerformanceColor(summary?.onTimeRate || 0))}>{summary?.onTimeRate}%</p>
                )}
                <p className="text-xs text-slate-400">On-Time Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.onTimeDeliveries}</p>
                )}
                <p className="text-xs text-slate-400">On-Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.lateDeliveries}</p>
                )}
                <p className="text-xs text-slate-400">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", summary?.trend > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {summary?.trend > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", summary?.trend > 0 ? "text-green-400" : "text-red-400")}>
                    {summary?.trend > 0 ? "+" : ""}{summary?.trend}%
                  </p>
                )}
                <p className="text-xs text-slate-400">vs Last Period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Progress */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Performance Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current: {summary?.onTimeRate}%</span>
                <span className="text-emerald-400">Target: {summary?.targetRate}%</span>
              </div>
              <Progress value={(summary?.onTimeRate / summary?.targetRate) * 100} className="h-3" />
              <p className="text-sm text-slate-500">
                {summary?.onTimeRate >= summary?.targetRate ? "Target achieved!" : `${(summary?.targetRate - summary?.onTimeRate).toFixed(1)}% below target`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Customer */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Performance by Customer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byCustomerQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {byCustomerQuery.data?.map((customer: any) => (
                  <div key={customer.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.deliveries} deliveries</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={customer.onTimeRate} className={cn("w-24 h-2", customer.onTimeRate < 90 && "[&>div]:bg-red-500", customer.onTimeRate >= 90 && customer.onTimeRate < 95 && "[&>div]:bg-yellow-500")} />
                      <span className={cn("font-bold w-12 text-right", getPerformanceColor(customer.onTimeRate))}>{customer.onTimeRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Lane */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Performance by Lane</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byLaneQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {byLaneQuery.data?.map((lane: any) => (
                  <div key={lane.id} className={cn("p-4", lane.onTimeRate < 90 && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{lane.origin} → {lane.destination}</p>
                      <span className={cn("font-bold", getPerformanceColor(lane.onTimeRate))}>{lane.onTimeRate}%</span>
                    </div>
                    <p className="text-xs text-slate-500">{lane.deliveries} deliveries • Avg delay: {lane.avgDelay}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Weekly Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="flex items-end gap-2 h-48">
              {trendsQuery.data?.map((week: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={cn("w-full rounded-t transition-all", week.onTimeRate >= 95 ? "bg-gradient-to-t from-green-500 to-emerald-500" : week.onTimeRate >= 90 ? "bg-gradient-to-t from-yellow-500 to-amber-500" : "bg-gradient-to-t from-red-500 to-orange-500")} style={{ height: `${week.onTimeRate}%` }} />
                  <p className="text-xs text-slate-500 mt-2">{week.week}</p>
                  <p className={cn("text-xs font-medium", getPerformanceColor(week.onTimeRate))}>{week.onTimeRate}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
