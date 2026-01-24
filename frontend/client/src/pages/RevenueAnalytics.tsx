/**
 * REVENUE ANALYTICS PAGE
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
  DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart,
  Download, Calendar, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState("month");

  const revenueQuery = trpc.analytics.getRevenue.useQuery({ dateRange });
  const breakdownQuery = trpc.analytics.getRevenueBreakdown.useQuery({ dateRange });
  const trendsQuery = trpc.analytics.getRevenueTrends.useQuery({ dateRange });
  const goalsQuery = trpc.analytics.getRevenueGoals.useQuery();

  const revenue = revenueQuery.data;
  const breakdown = breakdownQuery.data;
  const goals = goalsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Revenue Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track revenue performance and trends</p>
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

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {revenueQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${revenue?.total?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {revenueQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">${revenue?.avgPerLoad?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Avg Per Load</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {revenueQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <div className="flex items-center gap-1">
                    <p className={cn("text-2xl font-bold", revenue?.growth > 0 ? "text-green-400" : "text-red-400")}>
                      {revenue?.growth > 0 ? "+" : ""}{revenue?.growth}%
                    </p>
                    {revenue?.growth > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  </div>
                )}
                <p className="text-xs text-slate-400">Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <PieChart className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {revenueQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{revenue?.margin}%</p>
                )}
                <p className="text-xs text-slate-400">Profit Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Goal */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Revenue Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goalsQuery.isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400">Current</p>
                  <p className="text-2xl font-bold text-white">${goals?.current?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Goal</p>
                  <p className="text-2xl font-bold text-emerald-400">${goals?.target?.toLocaleString()}</p>
                </div>
              </div>
              <Progress value={goals?.percentage || 0} className="h-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{goals?.percentage}% achieved</span>
                <span className="text-slate-400">${goals?.remaining?.toLocaleString()} remaining</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {breakdown?.byCategory?.map((cat: any) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{cat.name}</span>
                      <span className="text-emerald-400 font-bold">${cat.amount?.toLocaleString()}</span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">{cat.percentage}% of total</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Revenue Sources */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Top Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-3">
                {breakdown?.topSources?.map((source: any, idx: number) => (
                  <div key={source.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", idx === 0 ? "bg-amber-500 text-white" : idx === 1 ? "bg-slate-400 text-white" : idx === 2 ? "bg-amber-700 text-white" : "bg-slate-600 text-slate-300")}>
                        {idx + 1}
                      </span>
                      <span className="text-white font-medium">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">${source.revenue?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{source.loads} loads</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {trendsQuery.data?.map((month: any) => (
                <div key={month.month} className="text-center">
                  <div className="h-32 bg-slate-700/30 rounded-lg relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-cyan-500" style={{ height: `${month.percentage}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{month.month}</p>
                  <p className="text-xs text-emerald-400 font-medium">${(month.revenue / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
