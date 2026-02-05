/**
 * UTILIZATION REPORT PAGE
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
  Truck, TrendingUp, TrendingDown, Clock, Target,
  Download, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function UtilizationReport() {
  const [dateRange, setDateRange] = useState("month");

  const summaryQuery = (trpc as any).analytics.getUtilizationSummary.useQuery({ dateRange });
  const byVehicleQuery = (trpc as any).analytics.getUtilizationByVehicle.useQuery({ dateRange, limit: 10 });
  const byDriverQuery = (trpc as any).analytics.getUtilizationByDriver.useQuery({ dateRange, limit: 10 });
  const trendsQuery = (trpc as any).analytics.getUtilizationTrends.useQuery({ dateRange });

  const summary = summaryQuery.data;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 85) return "text-green-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Utilization Report
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track fleet and driver utilization</p>
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
        <Card className={cn("rounded-xl", (summary?.fleetUtilization ?? 0) >= 85 ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.fleetUtilization ?? 0) >= 85 ? "bg-green-500/20" : "bg-blue-500/20")}>
                <Truck className={cn("w-6 h-6", (summary?.fleetUtilization ?? 0) >= 85 ? "text-green-400" : "text-blue-400")} />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", getUtilizationColor(summary?.fleetUtilization || 0))}>{summary?.fleetUtilization}%</p>
                )}
                <p className="text-xs text-slate-400">Fleet Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgHoursPerDay}h</p>
                )}
                <p className="text-xs text-slate-400">Avg Hours/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.activeDays}</p>
                )}
                <p className="text-xs text-slate-400">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.trend ?? 0) > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {(summary?.trend ?? 0) > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (summary?.trend ?? 0) > 0 ? "text-green-400" : "text-red-400")}>
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
            Utilization Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current: {summary?.fleetUtilization}%</span>
                <span className="text-emerald-400">Target: {summary?.targetUtilization}%</span>
              </div>
              <Progress value={((summary?.fleetUtilization ?? 0) / (summary?.targetUtilization ?? 1)) * 100} className="h-3" />
              <p className="text-sm text-slate-500">
                {(summary?.fleetUtilization ?? 0) >= (summary?.targetUtilization ?? 0) ? "Target achieved!" : `${((summary?.targetUtilization ?? 0) - (summary?.fleetUtilization ?? 0)).toFixed(1)}% below target`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Vehicle */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Utilization by Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byVehicleQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(byVehicleQuery.data as any)?.map((vehicle: any) => (
                  <div key={vehicle.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{vehicle.unitNumber}</p>
                      <p className="text-xs text-slate-500">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={vehicle.utilization} className={cn("w-24 h-2", vehicle.utilization < 70 && "[&>div]:bg-red-500", vehicle.utilization >= 70 && vehicle.utilization < 85 && "[&>div]:bg-yellow-500")} />
                      <span className={cn("font-bold w-12 text-right", getUtilizationColor(vehicle.utilization))}>{vehicle.utilization}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Driver */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Utilization by Driver</CardTitle>
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
                      <p className="text-xs text-slate-500">{driver.hoursWorked}h worked • {driver.distanceLoaded?.toLocaleString()} mi loaded</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={driver.utilization} className={cn("w-24 h-2", driver.utilization < 70 && "[&>div]:bg-red-500", driver.utilization >= 70 && driver.utilization < 85 && "[&>div]:bg-yellow-500")} />
                      <span className={cn("font-bold w-12 text-right", getUtilizationColor(driver.utilization))}>{driver.utilization}%</span>
                    </div>
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
          <CardTitle className="text-white text-lg">Weekly Utilization Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="flex items-end gap-2 h-48">
              {(trendsQuery.data as any)?.map((week: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={cn("w-full rounded-t transition-all", week.utilization >= 85 ? "bg-gradient-to-t from-green-500 to-emerald-500" : week.utilization >= 70 ? "bg-gradient-to-t from-yellow-500 to-amber-500" : "bg-gradient-to-t from-red-500 to-orange-500")} style={{ height: `${week.utilization}%` }} />
                  <p className="text-xs text-slate-500 mt-2">{week.week}</p>
                  <p className={cn("text-xs font-medium", getUtilizationColor(week.utilization))}>{week.utilization}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
