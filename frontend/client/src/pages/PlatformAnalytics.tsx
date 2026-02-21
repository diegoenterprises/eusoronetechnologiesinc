/**
 * PLATFORM ANALYTICS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Users, Truck, DollarSign, TrendingUp,
  TrendingDown, Activity, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformAnalytics() {
  const [dateRange, setDateRange] = useState("30d");

  const metricsQuery = (trpc as any).admin.getPlatformMetrics.useQuery({ dateRange });
  const trendsQuery = (trpc as any).admin.getPlatformTrends.useQuery({ dateRange });
  const topQuery = (trpc as any).admin.getTopPerformers.useQuery({ dateRange, limit: 5 });

  const metrics = metricsQuery.data;

  const StatCard = ({ icon: Icon, iconColor, bgColor, title, value, change, changeType }: any) => (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full", bgColor)}>
              <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
            <div>
              {metricsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                <p className={cn("text-2xl font-bold", iconColor)}>{value}</p>
              )}
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>
          {change && (
            <div className={cn("flex items-center gap-1 text-sm", changeType === "up" ? "text-green-400" : "text-red-400")}>
              {changeType === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {change}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Platform Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor platform performance and metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} iconColor="text-blue-400" bgColor="bg-blue-500/20" title="Total Users" value={metrics?.totalUsers?.toLocaleString()} change={metrics?.usersChange} changeType={metrics?.usersChangeType} />
        <StatCard icon={Truck} iconColor="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" bgColor="bg-green-500/20" title="Total Loads" value={metrics?.totalLoads?.toLocaleString()} change={metrics?.loadsChange} changeType={metrics?.loadsChangeType} />
        <StatCard icon={DollarSign} iconColor="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" bgColor="bg-emerald-500/20" title="Revenue" value={`$${metrics?.revenue?.toLocaleString()}`} change={metrics?.revenueChange} changeType={metrics?.revenueChangeType} />
        <StatCard icon={Activity} iconColor="text-purple-400" bgColor="bg-purple-500/20" title="Active Sessions" value={metrics?.activeSessions?.toLocaleString()} change={metrics?.sessionsChange} changeType={metrics?.sessionsChangeType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Platform Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                {(trendsQuery.data as any)?.map((trend: any) => (
                  <div key={trend.label} className="p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{trend.label}</span>
                      <span className={cn("flex items-center gap-1", trend.changeType === "up" ? "text-green-400" : "text-red-400")}>
                        {trend.changeType === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {trend.change}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", trend.changeType === "up" ? "bg-green-500" : "bg-red-500")} style={{ width: `${trend.percentage}%` }} />
                      </div>
                      <span className="text-slate-400 text-sm">{trend.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(topQuery.data as any)?.map((performer: any, idx: number) => (
                  <div key={performer.id} className="p-4 flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", idx === 0 ? "bg-yellow-500/20 text-yellow-400" : idx === 1 ? "bg-slate-400/20 text-slate-300" : idx === 2 ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/50 text-slate-400")}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{performer.name}</p>
                      <p className="text-xs text-slate-500">{performer.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">{performer.metric}</p>
                      <p className="text-xs text-slate-500">{performer.metricLabel}</p>
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
