/**
 * BROKER ANALYTICS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package,
  Users, Target, FileText, Percent, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerAnalytics() {
  const [timeframe, setTimeframe] = useState("30d");

  const analyticsQuery = trpc.brokers.getAnalytics.useQuery({ timeframe });
  const commissionQuery = trpc.brokers.getCommissionSummary.useQuery({ timeframe });
  const performanceQuery = trpc.brokers.getPerformanceMetrics.useQuery({ timeframe });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Commission tracking and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analyticsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total Commission</p>
                    <p className="text-3xl font-bold text-green-400">
                      ${analyticsQuery.data?.totalCommission?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {(analyticsQuery.data?.commissionTrend || 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">+{analyticsQuery.data?.commissionTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">{analyticsQuery.data?.commissionTrend}%</span>
                    </>
                  )}
                  <span className="text-slate-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Loads Brokered</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {analyticsQuery.data?.loadsBrokered || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {(analyticsQuery.data?.loadsTrend || 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">+{analyticsQuery.data?.loadsTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">{analyticsQuery.data?.loadsTrend}%</span>
                    </>
                  )}
                  <span className="text-slate-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Avg Margin</p>
                    <p className="text-3xl font-bold text-cyan-400">
                      {analyticsQuery.data?.avgMarginPercent || 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <Percent className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  ${analyticsQuery.data?.avgMarginDollars || 0} per load
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Active Carriers</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {analyticsQuery.data?.activeCarriers || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {analyticsQuery.data?.newCarriers || 0} new this period
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissionQuery.isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {commissionQuery.data?.breakdown?.map((item: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{item.category}</span>
                      <span className="text-sm font-bold text-green-400">${item.amount?.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                    />
                    <p className="text-xs text-slate-500">{item.loads} loads • {item.percentage}% of total</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceQuery.isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {performanceQuery.data?.metrics?.map((metric: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{metric.name}</span>
                      <div className="flex items-center gap-1">
                        {metric.trend >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className={cn("text-sm font-bold", metric.trend >= 0 ? "text-green-400" : "text-red-400")}>
                          {metric.value}{metric.weightUnit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Target: {metric.target}{metric.weightUnit}</span>
                      <span>{metric.trend >= 0 ? "+" : ""}{metric.trend}% vs target</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Top Performing Lanes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analyticsQuery.data?.topLanes?.map((lane: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">#{i + 1}</Badge>
                    <span className="text-green-400 font-bold">${lane.totalCommission?.toLocaleString()}</span>
                  </div>
                  <p className="text-white font-medium text-sm mb-1">{lane.origin} → {lane.destination}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{lane.loads} loads</span>
                    <span>{lane.avgMargin}% avg margin</span>
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
