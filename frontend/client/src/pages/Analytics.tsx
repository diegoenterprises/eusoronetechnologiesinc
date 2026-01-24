/**
 * ANALYTICS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, DollarSign, Package, Truck, Users,
  Calendar, Download, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");

  const summaryQuery = trpc.analytics.getSummary.useQuery({ period });
  const trendsQuery = trpc.analytics.getTrends.useQuery({ period });

  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track performance and business metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {["week", "month", "year"].map((p) => (
              <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className={period === p ? "bg-cyan-600 hover:bg-cyan-700 rounded-lg" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg"} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  {summaryQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <p className="text-2xl font-bold text-emerald-400">${(summary?.revenue || 0).toLocaleString()}</p>
                  )}
                  <p className="text-xs text-slate-400">Revenue</p>
                </div>
              </div>
              {summary?.revenueChange && (
                <div className={cn("flex items-center gap-1 text-sm", summary.revenueChange >= 0 ? "text-green-400" : "text-red-400")}>
                  {summary.revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(summary.revenueChange)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold text-blue-400">{summary?.totalLoads || 0}</p>
                  )}
                  <p className="text-xs text-slate-400">Loads</p>
                </div>
              </div>
              {summary?.loadsChange && (
                <div className={cn("flex items-center gap-1 text-sm", summary.loadsChange >= 0 ? "text-green-400" : "text-red-400")}>
                  {summary.loadsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(summary.loadsChange)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Truck className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-purple-400">{(summary?.milesLogged || 0).toLocaleString()}</p>
                  )}
                  <p className="text-xs text-slate-400">Miles</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyan-500/20">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-cyan-400">${summary?.avgRatePerMile?.toFixed(2) || "0.00"}</p>
                  )}
                  <p className="text-xs text-slate-400">Avg $/Mile</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700 rounded-md">Revenue</TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-slate-700 rounded-md">Loads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trendsQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {trendsQuery.data?.map((trend: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-cyan-500/20">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                          </div>
                          <span className="text-white">{trend.period}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">${trend.revenue?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{trend.loads} loads</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Top Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">On-Time Delivery</span>
                      <span className="text-green-400 font-bold">{summary?.onTimeRate || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${summary?.onTimeRate || 0}%` }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Fleet Utilization</span>
                      <span className="text-blue-400 font-bold">{summary?.fleetUtilization || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${summary?.fleetUtilization || 0}%` }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Customer Satisfaction</span>
                      <span className="text-purple-400 font-bold">{summary?.customerSatisfaction || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${summary?.customerSatisfaction || 0}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-emerald-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-emerald-400 mb-2">${(summary?.revenue || 0).toLocaleString()}</p>
                <p className="text-slate-400">Total Revenue This {period.charAt(0).toUpperCase() + period.slice(1)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loads" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Load Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalLoads || 0}</p>
                  <p className="text-xs text-slate-400">Total Loads</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-green-400">{summary?.completedLoads || 0}</p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inTransitLoads || 0}</p>
                  <p className="text-xs text-slate-400">In Transit</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pendingLoads || 0}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
