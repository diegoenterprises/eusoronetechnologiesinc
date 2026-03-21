/**
 * BROKER DASHBOARD PAGE — Enhanced (Task 4.5.1)
 * Absorbs: BrokerAnalytics (commission, performance, top lanes)
 * 100% Dynamic - No mock data
 * Tabs: Overview | Analytics
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Package, DollarSign, TrendingUp, TrendingDown, Users, Truck,
  Clock, CheckCircle, Plus, BarChart3, Target, Percent,
  ArrowUpRight, ArrowDownRight, FileText, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/hooks/useLocale";

export default function BrokerDashboard() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("30d");

  // ── Overview Queries ──
  const statsQuery = (trpc as any).brokers?.getDashboardStats?.useQuery?.() || { data: null, isLoading: false };
  const shipperLoadsQuery = (trpc as any).brokers?.getShipperLoads?.useQuery?.({ limit: 5 }) || { data: [], isLoading: false };
  const inProgressQuery = (trpc as any).brokers?.getLoadsInProgress?.useQuery?.({ limit: 5 }) || { data: [], isLoading: false };
  const capacityQuery = (trpc as any).brokers?.getCatalystCapacity?.useQuery?.({ limit: 5 }) || { data: [], isLoading: false };

  // ── Analytics Queries (absorbed from BrokerAnalytics) ──
  const analyticsQuery = (trpc as any).brokers?.getAnalytics?.useQuery?.({ timeframe }) || { data: null, isLoading: false };
  const commissionQuery = (trpc as any).brokers?.getCommissionSummary?.useQuery?.({ timeframe }) || { data: null, isLoading: false };
  const performanceQuery = (trpc as any).brokers?.getPerformanceMetrics?.useQuery?.({ timeframe }) || { data: null, isLoading: false };

  const stats = statsQuery.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{t('brokerDashboard.title')}</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Match shippers with catalysts — commission tracking & analytics</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Match
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: <Package className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/20", value: stats?.activeLoads || 0, label: "Active", color: "text-cyan-400" },
          { icon: <Clock className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/20", value: stats?.pendingMatches || 0, label: "Pending", color: "text-yellow-400" },
          { icon: <TrendingUp className="w-5 h-5 text-green-400" />, bg: "bg-green-500/20", value: stats?.weeklyVolume || 0, label: "Weekly", color: "text-green-400" },
          { icon: <DollarSign className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/20", value: `$${(stats?.commissionEarned || 0).toLocaleString()}`, label: "Commission", color: "text-purple-400" },
          { icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/20", value: `${stats?.marginAverage || 0}%`, label: "Avg Margin", color: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
        ].map(s => (
          <Card key={s.label} className={cc}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                <div>
                  {statsQuery.isLoading ? <Skeleton className="h-7 w-14" /> : <p className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</p>}
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs: Overview + Analytics ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW TAB ═══ */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipper Loads */}
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Package className="w-5 h-5 text-cyan-400" />Shipper Loads</CardTitle></CardHeader>
              <CardContent className="p-0">
                {shipperLoadsQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : !(shipperLoadsQuery.data as any[])?.length ? (
                  <div className="p-6 text-center"><Package className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No loads available</p></div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                    {(shipperLoadsQuery.data as any[])?.map((load: any) => (
                      <div key={load.id} className={cn("p-3", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>#{load.loadNumber}</p>
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">${load.rate}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{load.origin} → {load.destination}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Catalyst Capacity */}
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Truck className="w-5 h-5 text-green-400" />Catalyst Capacity</CardTitle></CardHeader>
              <CardContent className="p-0">
                {capacityQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : !(capacityQuery.data as any[])?.length ? (
                  <div className="p-6 text-center"><Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No capacity available</p></div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                    {(capacityQuery.data as any[])?.map((catalyst: any) => (
                      <div key={catalyst.id} className={cn("p-3", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{catalyst.name}</p>
                          <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{catalyst.availableTrucks} trucks</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{catalyst.location} | {catalyst.equipment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><CheckCircle className="w-5 h-5 text-purple-400" />In Progress</CardTitle></CardHeader>
              <CardContent className="p-0">
                {inProgressQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : !(inProgressQuery.data as any[])?.length ? (
                  <div className="p-6 text-center"><CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No loads in progress</p></div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                    {(inProgressQuery.data as any[])?.map((load: any) => (
                      <div key={load.id} className={cn("p-3", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>#{load.loadNumber}</p>
                          <Badge className={cn("border-0 text-xs", load.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400")}>{load.status?.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{load.shipper} → {load.catalyst}</p>
                        <p className="text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Commission: ${load.commission}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ ANALYTICS TAB (absorbed from BrokerAnalytics) ═══ */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Timeframe selector */}
            <div className="flex items-center justify-end gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className={cn("w-40 rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                <FileText className="w-4 h-4 mr-2" />Export
              </Button>
            </div>

            {/* Analytics stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analyticsQuery.isLoading ? (
                [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
              ) : (
                <>
                  <Card className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Total Commission</p>
                          <p className="text-2xl font-bold text-green-400">${((analyticsQuery.data as any)?.totalCommission || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-green-500/20"><DollarSign className="w-5 h-5 text-green-400" /></div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {((analyticsQuery.data as any)?.commissionTrend || 0) >= 0 ? (
                          <><ArrowUpRight className="w-3 h-3 text-green-400" /><span className="text-green-400">+{(analyticsQuery.data as any)?.commissionTrend}%</span></>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3 text-red-400" /><span className="text-red-400">{(analyticsQuery.data as any)?.commissionTrend}%</span></>
                        )}
                        <span className="text-slate-500">vs last period</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Loads Brokered</p>
                          <p className="text-2xl font-bold text-purple-400">{(analyticsQuery.data as any)?.loadsBrokered || 0}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-purple-500/20"><Package className="w-5 h-5 text-purple-400" /></div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {((analyticsQuery.data as any)?.loadsTrend || 0) >= 0 ? (
                          <><ArrowUpRight className="w-3 h-3 text-green-400" /><span className="text-green-400">+{(analyticsQuery.data as any)?.loadsTrend}%</span></>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3 text-red-400" /><span className="text-red-400">{(analyticsQuery.data as any)?.loadsTrend}%</span></>
                        )}
                        <span className="text-slate-500">vs last period</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Avg Margin</p>
                          <p className="text-2xl font-bold text-cyan-400">{(analyticsQuery.data as any)?.avgMarginPercent || 0}%</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-cyan-500/20"><Percent className="w-5 h-5 text-cyan-400" /></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">${(analyticsQuery.data as any)?.avgMarginDollars || 0} per load</p>
                    </CardContent>
                  </Card>
                  <Card className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Active Catalysts</p>
                          <p className="text-2xl font-bold text-orange-400">{(analyticsQuery.data as any)?.activeCatalysts || 0}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-orange-500/20"><Users className="w-5 h-5 text-orange-400" /></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{(analyticsQuery.data as any)?.newCatalysts || 0} new this period</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Commission Breakdown + Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={cc}>
                <CardHeader>
                  <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                    <DollarSign className="w-5 h-5 text-green-400" />Commission Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commissionQuery.isLoading ? (
                    <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
                  ) : !(commissionQuery.data as any)?.breakdown?.length ? (
                    <div className="text-center py-10"><DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No commission data for this period</p></div>
                  ) : (
                    <div className="space-y-4">
                      {(commissionQuery.data as any)?.breakdown?.map((item: any, i: number) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{item.category}</span>
                            <span className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${item.amount?.toLocaleString()}</span>
                          </div>
                          <Progress value={item.percentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" />
                          <p className="text-xs text-slate-500">{item.loads} loads • {item.percentage}% of total</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={cc}>
                <CardHeader>
                  <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                    <Target className="w-5 h-5 text-purple-400" />Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceQuery.isLoading ? (
                    <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                  ) : !(performanceQuery.data as any)?.metrics?.length ? (
                    <div className="text-center py-10"><Target className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No performance data for this period</p></div>
                  ) : (
                    <div className="space-y-4">
                      {(performanceQuery.data as any)?.metrics?.map((metric: any, i: number) => (
                        <div key={i} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn("text-sm", isLight ? "text-slate-700" : "text-white")}>{metric.name}</span>
                            <div className="flex items-center gap-1">
                              {metric.trend >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                              <span className={cn("text-sm font-bold", metric.trend >= 0 ? "text-green-400" : "text-red-400")}>{metric.value}{metric.weightUnit}</span>
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

            {/* Top Performing Lanes */}
            <Card className={cc}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <BarChart3 className="w-5 h-5 text-cyan-400" />Top Performing Lanes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsQuery.isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
                ) : !(analyticsQuery.data as any)?.topLanes?.length ? (
                  <div className="text-center py-10"><BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No lane data for this period</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(analyticsQuery.data as any)?.topLanes?.map((lane: any, i: number) => (
                      <div key={i} className={cn("p-4 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">#{i + 1}</Badge>
                          <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${lane.totalCommission?.toLocaleString()}</span>
                        </div>
                        <p className={cn("font-medium text-sm mb-1", isLight ? "text-slate-700" : "text-white")}>{lane.origin} → {lane.destination}</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
