/**
 * CAPACITY PLANNING CENTER
 * Comprehensive capacity forecasting, fleet optimization, and demand planning.
 * Dark theme with indigo/violet planning accents. 100% dynamic — no mock data.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Truck, Users, Package, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle, MapPin, ArrowRight, Calendar,
  Gauge, Activity, Target, Layers, ArrowUpDown, Clock,
  Shield, DollarSign, Zap, RefreshCw, ChevronRight, Info,
  AlertCircle, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../contexts/ThemeContext";

// ─── Typed tRPC hook helper ──────────────────────────────────────────────────
const cp = (trpc as any).capacityPlanning;

// ─── Severity badge colors ───────────────────────────────────────────────────
function severityColor(s: string) {
  switch (s) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "warning": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "info": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function intensityBar(pct: number) {
  const color = pct > 85 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : pct > 50 ? "bg-indigo-500" : "bg-emerald-500";
  return (
    <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ─── KPI Gauge Card ──────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color, sub, loading, isLight = false }: {
  label: string; value: string | number; icon: any; color: string; sub?: string; loading?: boolean; isLight?: boolean;
}) {
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-indigo-500/30 transition-colors`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} truncate`}>{value}</p>
            )}
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} truncate`}>{label}</p>
            {sub && <p className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"} mt-0.5`}>{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Capacity Dashboard Tab ──────────────────────────────────────────────────
function DashboardTab({ isLight = false }: { isLight?: boolean }) {
  const dashboard = cp.getCapacityDashboard.useQuery({});
  const alerts = cp.getCapacityAlerts.useQuery({});
  const d = dashboard.data;
  const isLoading = dashboard.isLoading;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard label="Total Trucks" value={d?.totalTrucks || 0} icon={Truck} color="bg-indigo-500/20 text-indigo-400" loading={isLoading} />
        <KPICard label="Available" value={d?.availableTrucks || 0} icon={CheckCircle} color="bg-emerald-500/20 text-emerald-400" sub={`${d?.maintenanceTrucks || 0} in maintenance`} loading={isLoading} />
        <KPICard label="Active Loads" value={d?.activeLoads || 0} icon={Package} color="bg-violet-500/20 text-violet-400" sub={`${d?.pendingLoads || 0} pending`} loading={isLoading} />
        <KPICard label="Utilization" value={`${d?.utilizationPct || 0}%`} icon={Gauge} color="bg-cyan-500/20 text-cyan-400" loading={isLoading} />
        <KPICard label="Drivers" value={d?.totalDrivers || 0} icon={Users} color="bg-amber-500/20 text-amber-400" sub={`${d?.availableDrivers || 0} available`} loading={isLoading} />
        <KPICard label="Rev/Truck" value={`$${(d?.avgRevenuePerTruck || 0).toLocaleString()}`} icon={DollarSign} color="bg-green-500/20 text-green-400" sub="Last 30 days" loading={isLoading} />
      </div>

      {/* Status bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-20 w-full" /> : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Truck Utilization</span>
                  <span className="text-white font-medium">{d?.utilizationPct || 0}%</span>
                </div>
                {intensityBar(d?.utilizationPct || 0)}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Empty Miles</span>
                  <span className="text-white font-medium">{d?.emptyMilePct || 0}%</span>
                </div>
                {intensityBar(d?.emptyMilePct || 0)}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("border text-xs",
                    d?.demandTrend === "increasing" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                    d?.demandTrend === "decreasing" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                  )}>
                    {d?.demandTrend === "increasing" ? <TrendingUp className="w-3 h-3 mr-1" /> :
                     d?.demandTrend === "decreasing" ? <TrendingDown className="w-3 h-3 mr-1" /> :
                     <Minus className="w-3 h-3 mr-1" />}
                    Demand {d?.demandTrend || "stable"}
                  </Badge>
                  <Badge className={cn("border text-xs",
                    d?.capacityStatus === "tight" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                    d?.capacityStatus === "excess" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  )}>
                    Capacity {d?.capacityStatus || "balanced"}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Capacity Alerts
              {(alerts.data?.criticalCount || 0) > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs ml-auto">
                  {alerts.data?.criticalCount} critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[240px] overflow-y-auto">
            {alerts.isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (alerts.data?.alerts?.length || 0) === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No capacity alerts</p>
              </div>
            ) : (
              alerts.data?.alerts.map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  {alert.severity === "critical" ? <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> :
                   alert.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /> :
                   <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed loads in 30d */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20"><BarChart3 className="w-5 h-5 text-violet-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Completed Loads (30d)</p>
              {isLoading ? <Skeleton className="h-6 w-20" /> : <p className="text-xl font-bold text-white">{d?.completedLoads30d || 0}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20"><Users className="w-5 h-5 text-indigo-400" /></div>
            <div>
              <p className="text-sm text-slate-400">On-Load Drivers</p>
              {isLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-xl font-bold text-white">{d?.onLoadDrivers || 0}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Demand Forecast Tab ─────────────────────────────────────────────────────
function DemandForecastTab({ isLight = false }: { isLight?: boolean }) {
  const [period, setPeriod] = useState<"7" | "14" | "30" | "90">("30");
  const forecast = cp.getDemandForecast.useQuery({ period });
  const data = forecast.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {(["7", "14", "30", "90"] as const).map(p => (
          <Button key={p} size="sm" variant={period === p ? "default" : "outline"}
            className={cn(period === p ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-700 text-slate-300")}
            onClick={() => setPeriod(p)}>
            {p}d
          </Button>
        ))}
        <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          Confidence: {data?.confidence || 0}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Projected Loads" value={data?.totalProjected || 0} icon={Package} color="bg-indigo-500/20 text-indigo-400" sub={`Next ${period} days`} loading={forecast.isLoading} />
        <KPICard label="Top Region" value={data?.byRegion?.[0]?.region || "N/A"} icon={MapPin} color="bg-violet-500/20 text-violet-400" sub={`${data?.byRegion?.[0]?.loads || 0} loads`} loading={forecast.isLoading} />
        <KPICard label="Top Vertical" value={data?.byVertical?.[0]?.vertical || "N/A"} icon={Layers} color="bg-cyan-500/20 text-cyan-400" sub={`${data?.byVertical?.[0]?.loads || 0} loads`} loading={forecast.isLoading} />
      </div>

      {/* Daily forecast */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Daily Load Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forecast.isLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="grid grid-cols-7 md:grid-cols-10 gap-1">
              {data?.forecast?.slice(0, 20).map((day: any, i: number) => {
                const max = Math.max(...(data?.forecast?.map((d: any) => d.high) || [1]));
                const height = Math.max(10, (day.projected / max) * 80);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: 80 }}>
                      <div className="w-4 rounded-t bg-indigo-500/40 relative" style={{ height: `${height}%` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t" style={{ height: `${(day.projected / day.high) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{day.date?.slice(5)}</span>
                    <span className="text-xs text-indigo-400 font-medium">{day.projected}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Region */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" /> Demand by Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {forecast.isLoading ? <Skeleton className="h-32 w-full" /> : (
              data?.byRegion?.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-indigo-400">{r.loads} loads</span>
                    <span className="text-xs text-slate-500">${(r.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* By Vertical */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Demand by Cargo Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {forecast.isLoading ? <Skeleton className="h-32 w-full" /> : (
              data?.byVertical?.slice(0, 8).map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-300 capitalize">{v.vertical?.replace("_", " ")}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-cyan-400">{v.loads} loads</span>
                    <span className="text-xs text-slate-500">${(v.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Fleet Right-Sizing Tab ──────────────────────────────────────────────────
function FleetRightSizingTab({ isLight = false }: { isLight?: boolean }) {
  const fleet = cp.getFleetRightSizing.useQuery({});
  const data = fleet.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Current Fleet" value={data?.current?.total || 0} icon={Truck} color="bg-indigo-500/20 text-indigo-400" loading={fleet.isLoading} />
        <KPICard label="Optimal Size" value={data?.optimal?.total || 0} icon={Target} color="bg-violet-500/20 text-violet-400" loading={fleet.isLoading} />
        <KPICard label="Delta" value={data?.optimal?.delta || 0} icon={ArrowUpDown} color={cn((data?.optimal?.delta || 0) > 0 ? "bg-amber-500/20 text-amber-400" : (data?.optimal?.delta || 0) < 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400")} sub={(data?.optimal?.delta || 0) > 0 ? "Need more" : (data?.optimal?.delta || 0) < 0 ? "Excess units" : "Right-sized"} loading={fleet.isLoading} />
        <KPICard label="Avg Age" value={`${data?.current?.avgAge || 0} yr`} icon={Calendar} color="bg-cyan-500/20 text-cyan-400" sub={`${((data?.current?.avgMileage || 0) / 1000).toFixed(0)}k avg mi`} loading={fleet.isLoading} />
      </div>

      {/* Fleet by type */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" /> Fleet Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fleet.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="divide-y divide-slate-700/50">
              {data?.current?.byType?.map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Truck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-white font-medium capitalize">{v.type?.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-white font-bold">{v.count}</p>
                      <p className="text-xs text-slate-500">units</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-300">{v.avgAge}yr</p>
                      <p className="text-xs text-slate-500">avg age</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-300">{(v.avgMileage / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-slate-500">avg mi</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" /> Right-Sizing Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fleet.isLoading ? <Skeleton className="h-20 w-full" /> : (data?.recommendations?.length || 0) === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Fleet is optimally sized</p>
            </div>
          ) : (
            data?.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                <Badge className={cn("mt-0.5 shrink-0 border text-xs uppercase",
                  rec.action === "buy" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                  rec.action === "sell" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                )}>{rec.action}</Badge>
                <div>
                  <p className="text-sm text-white font-medium capitalize">{rec.count} x {rec.vehicleType?.replace("_", " ")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.reason}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Driver Optimizer Tab ────────────────────────────────────────────────────
function DriverOptimizerTab({ isLight = false }: { isLight?: boolean }) {
  const sched = cp.getDriverScheduleOptimizer.useQuery({});
  const homeTime = cp.getDriverHomeTimePlanning.useQuery({});
  const team = cp.getTeamDriverPlanning.useQuery({});
  const sd = sched.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Fleet Utilization" value={`${sd?.utilization || 0}%`} icon={Gauge} color="bg-indigo-500/20 text-indigo-400" loading={sched.isLoading} />
        <KPICard label="Home Time Compliance" value={`${homeTime.data?.homeTimeCompliance || 0}%`} icon={Clock} color="bg-violet-500/20 text-violet-400" sub={`${homeTime.data?.avgDaysOut || 0}d avg out`} loading={homeTime.isLoading} />
        <KPICard label="Team Eligible" value={team.data?.eligibleDrivers || 0} icon={Users} color="bg-cyan-500/20 text-cyan-400" sub={`${team.data?.currentTeams || 0} active teams`} loading={team.isLoading} />
        <KPICard label="Long-Haul Loads" value={team.data?.longHaulLoads || 0} icon={ArrowRight} color="bg-amber-500/20 text-amber-400" sub="500+ miles (30d)" loading={team.isLoading} />
      </div>

      {/* Driver list */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Driver Schedule Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sched.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {sd?.drivers?.map((driver: any) => (
                <div key={driver.id} className="flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full shrink-0",
                      driver.efficiency > 90 ? "bg-red-400" : driver.efficiency < 40 ? "bg-amber-400" : "bg-emerald-400"
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.recentLoads} loads / {driver.totalMiles.toLocaleString()} mi (30d)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-20">
                      {intensityBar(driver.efficiency)}
                      <p className="text-xs text-slate-500 text-center mt-0.5">{driver.efficiency}%</p>
                    </div>
                    <Badge className={cn("text-xs border",
                      driver.recommendedAction === "Optimal" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      driver.recommendedAction.includes("Reduce") ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    )}>{driver.recommendedAction}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {(sd?.recommendations?.length || 0) > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-4 space-y-2">
            {sd?.recommendations?.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Network Design Tab ──────────────────────────────────────────────────────
function NetworkDesignTab({ isLight = false }: { isLight?: boolean }) {
  const network = cp.getNetworkDesign.useQuery({});
  const relay = cp.getRelayPlanning.useQuery({});
  const nd = network.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Network Nodes" value={nd?.nodes?.length || 0} icon={MapPin} color="bg-indigo-500/20 text-indigo-400" loading={network.isLoading} />
        <KPICard label="Active Lanes" value={nd?.links?.length || 0} icon={ArrowRight} color="bg-violet-500/20 text-violet-400" loading={network.isLoading} />
        <KPICard label="Relay Lanes" value={relay.data?.relayLanes?.length || 0} icon={RefreshCw} color="bg-cyan-500/20 text-cyan-400" loading={relay.isLoading} />
        <KPICard label="Hours Saved" value={relay.data?.timesSaved || 0} icon={Clock} color="bg-emerald-500/20 text-emerald-400" sub="via relay ops" loading={relay.isLoading} />
      </div>

      {/* Top nodes */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" /> Network Nodes (by Volume)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {network.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {nd?.nodes?.slice(0, 12).map((node: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                  <p className="text-lg font-bold text-indigo-400">{node.id}</p>
                  <p className="text-xs text-slate-400">{node.region}</p>
                  <p className="text-sm font-medium text-white mt-1">{node.volume} loads</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top lanes */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-violet-400" /> Top Lanes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
            {nd?.links?.slice(0, 15).map((link: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-700/20">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{link.origin}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="text-white font-medium">{link.destination}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-indigo-400">{link.volume} loads</span>
                  <span className="text-slate-500">{link.avgDistance} mi</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relay suggestions */}
      {(nd?.suggestions?.length || 0) > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" /> Relay Point Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nd?.suggestions?.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900/30">
                <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">{s.lane} ({s.distance} mi, {s.volume} loads)</p>
                  <p className="text-xs text-slate-400">{s.suggestion}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Backhaul Matching Tab ───────────────────────────────────────────────────
function BackhaulTab({ isLight = false }: { isLight?: boolean }) {
  const backhaul = cp.getBackhaulOptimizer.useQuery({});
  const powerOnly = cp.getPowerOnlyMatching.useQuery({});
  const bh = backhaul.data;
  const po = powerOnly.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Backhaul Matches" value={bh?.opportunities?.length || 0} icon={RefreshCw} color="bg-indigo-500/20 text-indigo-400" loading={backhaul.isLoading} />
        <KPICard label="Potential Savings" value={`$${(bh?.potentialSavings || 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-500/20 text-emerald-400" loading={backhaul.isLoading} />
        <KPICard label="Empty Mi Saved" value={(bh?.emptyMileReduction || 0).toLocaleString()} icon={TrendingDown} color="bg-violet-500/20 text-violet-400" loading={backhaul.isLoading} />
        <KPICard label="Power-Only Saves" value={`$${(po?.savings || 0).toLocaleString()}`} icon={Zap} color="bg-amber-500/20 text-amber-400" sub={`${po?.tractorsAvailable || 0} tractors avail`} loading={powerOnly.isLoading} />
      </div>

      {/* Backhaul opportunities */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" /> Backhaul Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {backhaul.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (bh?.opportunities?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No backhaul matches found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[350px] overflow-y-auto">
              {bh?.opportunities?.map((opp: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-700/20">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Delivery:</span>
                      <span className="text-white font-medium">{opp.deliveryLoad}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-indigo-400 font-medium">{opp.backhaulLoad}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opp.fromState}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ${opp.estimatedSavings}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Power-only matches */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Power-Only Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          {powerOnly.isLoading ? <Skeleton className="h-20 w-full" /> : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-400">{po?.tractorsAvailable || 0}</p>
                <p className="text-xs text-slate-400">Available Tractors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-400">{po?.trailersNeedingPower || 0}</p>
                <p className="text-xs text-slate-400">Trailers Need Power</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{po?.matches?.length || 0}</p>
                <p className="text-xs text-slate-400">Possible Matches</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Heat Map Tab ────────────────────────────────────────────────────────────
function HeatMapTab({ isLight = false }: { isLight?: boolean }) {
  const heatmap = cp.getCapacityHeatmap.useQuery({});
  const balancing = cp.getLaneBalancing.useQuery({});
  const hm = heatmap.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Active Regions" value={hm?.regions?.length || 0} icon={MapPin} color="bg-indigo-500/20 text-indigo-400" loading={heatmap.isLoading} />
        <KPICard label="Imbalances" value={hm?.imbalances?.length || 0} icon={AlertTriangle} color="bg-amber-500/20 text-amber-400" loading={heatmap.isLoading} />
        <KPICard label="Lane Balance" value={`${balancing.data?.overallBalance || 0}%`} icon={ArrowUpDown} color="bg-violet-500/20 text-violet-400" loading={balancing.isLoading} />
      </div>

      {/* Geographic heat grid */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" /> Capacity Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heatmap.isLoading ? <Skeleton className="h-48 w-full" /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {hm?.regions?.slice(0, 18).map((r: any, i: number) => (
                <div key={i} className={cn("p-3 rounded-lg border text-center",
                  r.intensity === "high" ? "bg-red-500/10 border-red-500/30" :
                  r.intensity === "medium" ? "bg-amber-500/10 border-amber-500/30" :
                  "bg-slate-900/50 border-slate-700/30"
                )}>
                  <p className="text-lg font-bold text-white">{r.state}</p>
                  <p className="text-xs text-slate-400">{r.region}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-400">Out</span>
                      <span className="text-white">{r.outboundLoads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400">In</span>
                      <span className="text-white">{r.inboundLoads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Trucks</span>
                      <span className="text-white">{r.availableTrucks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Imbalances */}
      {(hm?.imbalances?.length || 0) > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Geographic Imbalances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hm?.imbalances?.map((imb: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                <Badge className={cn("shrink-0 border text-xs",
                  imb.type === "surplus" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                  "bg-red-500/20 text-red-400 border-red-500/30"
                )}>{imb.type}</Badge>
                <div>
                  <p className="text-sm text-white">{imb.state} ({imb.magnitude} loads)</p>
                  <p className="text-xs text-slate-400">{imb.recommendation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lane Balancing */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-violet-400" /> Lane Balancing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {balancing.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
              {balancing.data?.lanes?.slice(0, 15).map((lane: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-700/20">
                  <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{lane.lane}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400">{lane.headhaul}h</span>
                    <span className="text-cyan-400">{lane.backhaul}b</span>
                    <Badge className={cn("border text-xs",
                      lane.status === "balanced" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      lane.status === "moderate" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    )}>{lane.balance}%</Badge>
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

// ─── Contract vs Spot Tab ────────────────────────────────────────────────────
function ContractSpotTab({ isLight = false }: { isLight?: boolean }) {
  const analysis = cp.getContractVsSpotAnalysis.useQuery({});
  const spot = cp.getSpotMarketStrategy.useQuery({});
  const constraints = cp.getCapacityConstraints.useQuery({});
  const ad = analysis.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Contract Loads" value={ad?.contract?.loads || 0} icon={Shield} color="bg-indigo-500/20 text-indigo-400" sub={`$${(ad?.contract?.revenue || 0).toLocaleString()} rev`} loading={analysis.isLoading} />
        <KPICard label="Spot Loads" value={ad?.spot?.loads || 0} icon={Zap} color="bg-violet-500/20 text-violet-400" sub={`$${(ad?.spot?.revenue || 0).toLocaleString()} rev`} loading={analysis.isLoading} />
        <KPICard label="Market" value={spot.data?.marketCondition || "balanced"} icon={Activity} color={cn(spot.data?.marketCondition === "tight" ? "bg-red-500/20 text-red-400" : spot.data?.marketCondition === "loose" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400")} loading={spot.isLoading} />
        <KPICard label="Health Score" value={constraints.data?.score || 0} icon={Target} color={cn((constraints.data?.score || 0) > 70 ? "bg-emerald-500/20 text-emerald-400" : (constraints.data?.score || 0) > 40 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400")} loading={constraints.isLoading} />
      </div>

      {/* Contract vs Spot comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" /> Contract Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.isLoading ? <Skeleton className="h-20 w-full" /> : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Total Loads</span>
                  <span className="text-white font-bold">{ad?.contract?.loads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Revenue</span>
                  <span className="text-indigo-400 font-bold">${(ad?.contract?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Avg Rate</span>
                  <span className="text-white font-bold">${(ad?.contract?.avgRate || 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400">Optimal Mix</p>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 h-3 rounded-full bg-indigo-500/40 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ad?.optimalMix?.contractPct || 70}%` }} />
                    </div>
                    <span className="text-xs text-indigo-400">{ad?.optimalMix?.contractPct || 70}%</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Spot Market
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.isLoading ? <Skeleton className="h-20 w-full" /> : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Total Loads</span>
                  <span className="text-white font-bold">{ad?.spot?.loads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Revenue</span>
                  <span className="text-violet-400 font-bold">${(ad?.spot?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Avg Rate</span>
                  <span className="text-white font-bold">${(ad?.spot?.avgRate || 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400">Spot Strategy</p>
                  {spot.data?.strategy?.map((s: any, i: number) => (
                    <p key={i} className="text-xs text-slate-300 mt-1">{s.recommendation}</p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Capacity Constraints */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Capacity Constraints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {constraints.isLoading ? <Skeleton className="h-20 w-full" /> : (constraints.data?.constraints?.length || 0) === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No capacity constraints detected</p>
            </div>
          ) : (
            constraints.data?.constraints?.map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                <Badge className={cn("shrink-0 border text-xs", severityColor(c.severity))}>{c.severity}</Badge>
                <div>
                  <p className="text-sm text-white">{c.category}</p>
                  <p className="text-xs text-slate-400">{c.description}</p>
                </div>
                <span className="ml-auto text-xs text-slate-500">{c.impact}% impact</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Monthly trend */}
      {(ad?.monthlyTrend?.length || 0) > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 justify-around">
              {ad?.monthlyTrend?.map((m: any, i: number) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-slate-500">{m.month}</p>
                  <p className="text-sm font-medium text-white mt-1">{m.loads}</p>
                  <p className="text-xs text-indigo-400">${(m.revenue / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function CapacityPlanning() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Capacity Planning
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Demand forecasting, fleet optimization, and network design
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className={`${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} p-1 flex-wrap h-auto gap-1`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="demand" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Demand Forecast</TabsTrigger>
          <TabsTrigger value="fleet" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Fleet Sizing</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Driver Optimizer</TabsTrigger>
          <TabsTrigger value="network" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Network Design</TabsTrigger>
          <TabsTrigger value="backhaul" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Backhaul</TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Heat Map</TabsTrigger>
          <TabsTrigger value="contract" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Contract vs Spot</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab isLight={isLight} /></TabsContent>
        <TabsContent value="demand"><DemandForecastTab isLight={isLight} /></TabsContent>
        <TabsContent value="fleet"><FleetRightSizingTab isLight={isLight} /></TabsContent>
        <TabsContent value="drivers"><DriverOptimizerTab isLight={isLight} /></TabsContent>
        <TabsContent value="network"><NetworkDesignTab isLight={isLight} /></TabsContent>
        <TabsContent value="backhaul"><BackhaulTab isLight={isLight} /></TabsContent>
        <TabsContent value="heatmap"><HeatMapTab isLight={isLight} /></TabsContent>
        <TabsContent value="contract"><ContractSpotTab isLight={isLight} /></TabsContent>
      </Tabs>
    </div>
  );
}
