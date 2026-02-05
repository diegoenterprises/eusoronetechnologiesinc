/**
 * DEADHEAD ANALYSIS PAGE
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
  TrendingDown, TrendingUp, Truck, MapPin, DollarSign,
  AlertTriangle, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeadheadAnalysis() {
  const [dateRange, setDateRange] = useState("month");

  const summaryQuery = (trpc as any).analytics.getDeadheadSummary.useQuery({ dateRange });
  const byDriverQuery = (trpc as any).analytics.getDeadheadByDriver.useQuery({ dateRange, limit: 10 });
  const byLaneQuery = (trpc as any).analytics.getDeadheadByLane.useQuery({ dateRange, limit: 10 });
  const trendsQuery = (trpc as any).analytics.getDeadheadTrends.useQuery({ dateRange });

  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Deadhead Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and reduce empty miles</p>
        </div>
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("rounded-xl", (summary?.deadheadPercentage ?? 0) > 15 ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30" : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.deadheadPercentage ?? 0) > 15 ? "bg-red-500/20" : "bg-green-500/20")}>
                <Truck className={cn("w-6 h-6", (summary?.deadheadPercentage ?? 0) > 15 ? "text-red-400" : "text-green-400")} />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (summary?.deadheadPercentage ?? 0) > 15 ? "text-red-400" : "text-green-400")}>{summary?.deadheadPercentage}%</p>
                )}
                <p className="text-xs text-slate-400">Deadhead Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.deadheadMiles?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Empty Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <DollarSign className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-red-400">${summary?.lostRevenue?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Lost Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.trend ?? 0) < 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {(summary?.trend ?? 0) < 0 ? <TrendingDown className="w-6 h-6 text-green-400" /> : <TrendingUp className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (summary?.trend ?? 0) < 0 ? "text-green-400" : "text-red-400")}>
                    {(summary?.trend ?? 0) > 0 ? "+" : ""}{summary?.trend}%
                  </p>
                )}
                <p className="text-xs text-slate-400">vs Last Period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Deadhead Reduction Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current: {summary?.deadheadPercentage}%</span>
                <span className="text-emerald-400">Target: {summary?.targetPercentage}%</span>
              </div>
              <Progress value={100 - (((summary?.deadheadPercentage ?? 0) - (summary?.targetPercentage ?? 10)) / (summary?.targetPercentage ?? 10)) * 100} className="h-3" />
              <p className="text-sm text-slate-500">
                {(summary?.deadheadPercentage ?? 0) <= (summary?.targetPercentage ?? 10) ? "Goal achieved!" : `Reduce by ${((summary?.deadheadPercentage ?? 0) - (summary?.targetPercentage ?? 10)).toFixed(1)}% to reach target`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Driver */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Deadhead by Driver</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byDriverQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(byDriverQuery.data as any)?.map((driver: any) => (
                  <div key={driver.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.deadheadMiles?.toLocaleString()} empty miles</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={driver.percentage} className={cn("w-24 h-2", driver.percentage > 15 && "[&>div]:bg-red-500")} />
                      <span className={cn("font-bold w-12 text-right", driver.percentage > 15 ? "text-red-400" : "text-green-400")}>{driver.percentage}%</span>
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
            <CardTitle className="text-white text-lg">High Deadhead Lanes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byLaneQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(byLaneQuery.data as any)?.map((lane: any) => (
                  <div key={lane.id} className={cn("p-4", lane.percentage > 20 && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{lane.origin} → {lane.destination}</p>
                      <Badge className={cn(lane.percentage > 20 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>{lane.percentage}%</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{lane.deadheadMiles?.toLocaleString()} empty miles • {lane.loads} loads</p>
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
