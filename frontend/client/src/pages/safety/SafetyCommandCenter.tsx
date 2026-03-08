/**
 * SAFETY COMMAND CENTER — Consolidated
 * Merges: SafetyDashboard.tsx, SafetyMetrics.tsx, SafetyManagerDashboard.tsx → SafetyCommandCenter.tsx
 * Tabs: Overview | Metrics
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, User, TestTube, TrendingUp, TrendingDown,
  CheckCircle, Clock, FileText, Users, BarChart3, Activity, Target,
  Award, Truck, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Overview Tab ─────────────────────────────────────────────────── */
function OverviewTab() {
  const statsQuery = (trpc as any).safety.getDashboardStats.useQuery();
  const csaQuery = (trpc as any).safety.getCSAOverview.useQuery();
  const incidentsQuery = (trpc as any).safety.getRecentIncidents.useQuery({ limit: 5 });
  const driversQuery = (trpc as any).safety.getTopDrivers.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getScoreColor = (score: number, threshold: number) => {
    if (score <= threshold * 0.5) return "text-green-400";
    if (score <= threshold) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Safety Score Hero */}
      {statsQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", (stats?.safetyScore ?? 0) >= 90 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (stats?.safetyScore ?? 0) >= 70 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Safety Score</p>
                <p className={cn("text-5xl font-bold", (stats?.safetyScore ?? 0) >= 90 ? "text-green-400" : (stats?.safetyScore ?? 0) >= 70 ? "text-yellow-400" : "text-red-400")}>{stats?.safetyScore}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stats?.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  <span className="text-sm text-slate-400">{stats?.trendPercent}% from last month</span>
                </div>
              </div>
              <div className={cn("p-4 rounded-full", (stats?.safetyScore ?? 0) >= 90 ? "bg-green-500/20" : (stats?.safetyScore ?? 0) >= 70 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Shield className={cn("w-12 h-12", (stats?.safetyScore ?? 0) >= 90 ? "text-green-400" : (stats?.safetyScore ?? 0) >= 70 ? "text-yellow-400" : "text-red-400")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Drivers", value: stats?.activeDrivers, icon: <User className="w-6 h-6 text-cyan-400" />, bg: "bg-cyan-500/20", color: "text-cyan-400" },
          { label: "Incidents", value: stats?.openIncidents, icon: <AlertTriangle className="w-6 h-6 text-red-400" />, bg: "bg-red-500/20", color: "text-red-400" },
          { label: "Overdue", value: stats?.overdueItems, icon: <Clock className="w-6 h-6 text-yellow-400" />, bg: "bg-yellow-500/20", color: "text-yellow-400" },
          { label: "D&A Tests", value: stats?.pendingTests, icon: <TestTube className="w-6 h-6 text-green-400" />, bg: "bg-green-500/20", color: "text-green-400" },
          { label: "CSA Alerts", value: stats?.csaAlerts, icon: <AlertTriangle className="w-6 h-6 text-orange-400" />, bg: "bg-orange-500/20", color: "text-orange-400" },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", kpi.bg)}>{kpi.icon}</div>
                <div>
                  {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value || 0}</p>}
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CSA + Top Performers + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />CSA BASIC Scores</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {csaQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6, 7].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
            ) : (
              (csaQuery.data as any)?.basics?.map((basic: any) => (
                <div key={basic.name} className="p-2 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{basic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", getScoreColor(basic.score, basic.threshold))}>{basic.score}%</span>
                      <span className="text-xs text-slate-500">/ {basic.threshold}%</span>
                    </div>
                  </div>
                  <Progress value={(basic.score / basic.threshold) * 100} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Top Safety Performers</CardTitle></CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(driversQuery.data as any)?.map((driver: any, i: number) => (
                    <div key={driver.id} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white", i === 0 ? "bg-yellow-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-600" : "bg-slate-600")}>{i + 1}</div>
                        <div>
                          <p className="text-white text-sm font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.distance?.toLocaleString()} mi | {driver.daysWithoutIncident} days safe</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{driver.score}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Recent Incidents</CardTitle></CardHeader>
            <CardContent className="p-0">
              {incidentsQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (incidentsQuery.data as any)?.length === 0 ? (
                <div className="p-3 text-center text-green-400 text-sm flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />No recent incidents</div>
              ) : (
                <div className="divide-y divide-red-500/20">
                  {(incidentsQuery.data as any)?.map((incident: any) => (
                    <div key={incident.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{incident.type}</p>
                        <p className="text-xs text-slate-500">{incident.driver} | {incident.date}</p>
                      </div>
                      <Badge className={cn("border-0 text-xs", incident.severity === "major" ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-400")}>{incident.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Metrics Tab ──────────────────────────────────────────────────── */
function MetricsTab() {
  const [timeframe, setTimeframe] = useState("30d");

  const metricsQuery = (trpc as any).safety.getMetrics.useQuery({ timeframe });
  const csaScoresQuery = (trpc as any).safety.getCSAScores.useQuery();
  const trendsQuery = (trpc as any).safety.getTrends.useQuery({ timeframe });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };
  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-green-500/10 to-green-600/5 border-green-500/20";
    if (score >= 70) return "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20";
    return "from-red-500/10 to-red-600/5 border-red-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Timeframe selector */}
      <div className="flex items-center justify-end gap-2">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Timeframe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg">
          <FileText className="w-4 h-4 mr-2" />Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricsQuery.isLoading ? Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />) : (
          <>
            <Card className={cn("bg-gradient-to-br rounded-xl", getScoreBg((metricsQuery.data as any)?.overallScore || 0))}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Overall Safety Score</p>
                    <p className={cn("text-3xl font-bold", getScoreColor((metricsQuery.data as any)?.overallScore || 0))}>{(metricsQuery.data as any)?.overallScore || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20"><Shield className="w-6 h-6 text-green-400" /></div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {((metricsQuery.data as any)?.scoreTrend || 0) >= 0 ? (
                    <><TrendingUp className="w-3 h-3 text-green-400" /><span className="text-green-400">+{(metricsQuery.data as any)?.scoreTrend}%</span></>
                  ) : (
                    <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400">{(metricsQuery.data as any)?.scoreTrend}%</span></>
                  )}
                  <span className="text-slate-500">vs last period</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-slate-400 mb-1">Active Drivers</p><p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.activeDrivers || 0}</p></div>
                  <div className="p-3 rounded-lg bg-blue-500/20"><Users className="w-6 h-6 text-blue-400" /></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{(metricsQuery.data as any)?.driversInCompliance || 0} in full compliance</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-slate-400 mb-1">Open Incidents</p><p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.openIncidents || 0}</p></div>
                  <div className="p-3 rounded-lg bg-orange-500/20"><AlertTriangle className="w-6 h-6 text-orange-400" /></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{(metricsQuery.data as any)?.incidentsThisMonth || 0} this month</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-slate-400 mb-1">Days Without Incident</p><p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.daysWithoutIncident || 0}</p></div>
                  <div className="p-3 rounded-lg bg-purple-500/20"><Award className="w-6 h-6 text-purple-400" /></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Record: {(metricsQuery.data as any)?.recordDays || 0} days</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* CSA BASIC + Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" />CSA BASIC Scores</CardTitle></CardHeader>
          <CardContent>
            {csaScoresQuery.isLoading ? (
              <div className="space-y-4">{Array(7).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-4">
                {(csaScoresQuery.data as any)?.basics?.map((basic: any) => (
                  <div key={basic.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{basic.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-bold", getScoreColor(100 - basic.percentile))}>{basic.percentile}%</span>
                        {basic.alert && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Alert</Badge>}
                      </div>
                    </div>
                    <Progress
                      value={basic.percentile}
                      className={cn("h-2", basic.percentile > 75 ? "[&>div]:bg-red-500" : basic.percentile > 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")}
                    />
                    <p className="text-xs text-slate-500">Threshold: {basic.threshold}% | Inspections: {basic.inspections}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-[#1473FF]" />Safety Trends</CardTitle></CardHeader>
          <CardContent>
            {trendsQuery.isLoading ? (
              <div className="space-y-4">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-4">
                {(trendsQuery.data as any)?.map((trend: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{trend.metric}</span>
                      <div className="flex items-center gap-1">
                        {trend.change >= 0 ? <TrendingUp className={cn("w-4 h-4", trend.positive ? "text-green-400" : "text-red-400")} /> : <TrendingDown className={cn("w-4 h-4", trend.positive ? "text-green-400" : "text-red-400")} />}
                        <span className={cn("text-sm font-bold", trend.positive ? "text-green-400" : "text-red-400")}>{trend.change >= 0 ? "+" : ""}{trend.change}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Current: {trend.current}</span>
                      <span>Previous: {trend.previous}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Goals */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Target className="w-5 h-5 text-yellow-400" />Safety Goals Progress</CardTitle></CardHeader>
        <CardContent>
          {metricsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(metricsQuery.data as any)?.goals?.map((goal: any) => (
                <div key={goal.name} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{goal.name}</span>
                    {goal.achieved ? <CheckCircle className="w-5 h-5 text-green-400" /> : <span className="text-xs text-slate-400">{goal.progress}%</span>}
                  </div>
                  <Progress value={goal.progress} className="h-2 mb-2" />
                  <p className="text-xs text-slate-500">Target: {goal.target} | Current: {goal.current}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Consolidated Page ───────────────────────────────────────── */
export default function SafetyCommandCenter() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Safety Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet safety management, CSA monitoring, and performance metrics</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <FileText className="w-4 h-4 mr-2" />Safety Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="metrics"><BarChart3 className="w-4 h-4 mr-1.5" />Metrics & Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="metrics"><MetricsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
