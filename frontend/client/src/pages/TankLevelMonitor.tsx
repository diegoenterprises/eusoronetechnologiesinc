/**
 * REAL-TIME TANK LEVEL MONITORING DASHBOARD (GAP-310)
 * Live tank gauging, alerts, trends, and demand forecasting.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Gauge, Droplets, Thermometer, AlertTriangle, TrendingDown, TrendingUp,
  Search, Bell, BarChart3, Calendar, Truck, ArrowDown, ArrowUp,
  Activity, Clock, Package, ShieldAlert, Fuel, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "readings" | "alerts" | "forecasts";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  normal: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Normal" },
  low: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Low" },
  critical_low: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Critical Low" },
  high: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "High" },
  overfill_risk: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Overfill Risk" },
  maintenance: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Maintenance" },
  offline: { color: "text-slate-500", bg: "bg-slate-600/10", border: "border-slate-600/20", label: "Offline" },
  leak_suspected: { color: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/30", label: "Leak Suspected" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  emergency: { color: "text-red-400", bg: "bg-red-500/10", icon: <ShieldAlert className="w-4 h-4" /> },
  critical: { color: "text-orange-400", bg: "bg-orange-500/10", icon: <AlertTriangle className="w-4 h-4" /> },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", icon: <Bell className="w-4 h-4" /> },
  info: { color: "text-blue-400", bg: "bg-blue-500/10", icon: <Activity className="w-4 h-4" /> },
};

function levelColor(pct: number): string {
  if (pct <= 10) return "bg-red-500";
  if (pct <= 20) return "bg-amber-500";
  if (pct <= 80) return "bg-emerald-500";
  if (pct <= 90) return "bg-blue-500";
  return "bg-red-400";
}

function levelTextColor(pct: number): string {
  if (pct <= 10) return "text-red-400";
  if (pct <= 20) return "text-amber-400";
  if (pct <= 80) return "text-emerald-400";
  if (pct <= 90) return "text-blue-400";
  return "text-red-400";
}

export default function TankLevelMonitor() {
  const [terminalId, setTerminalId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");
  const [tab, setTab] = useState<Tab>("readings");
  const [selectedTank, setSelectedTank] = useState<number | null>(null);

  const readingsQuery = (trpc as any).tankMonitor?.getTankReadings?.useQuery?.(
    { terminalId: terminalId! },
    { enabled: !!terminalId && tab === "readings", refetchInterval: 30000 }
  ) || { data: null, isLoading: false };

  const alertsQuery = (trpc as any).tankMonitor?.getTankAlerts?.useQuery?.(
    { terminalId: terminalId!, severityFilter: "all" as const },
    { enabled: !!terminalId && tab === "alerts" }
  ) || { data: null, isLoading: false };

  const forecastsQuery = (trpc as any).tankMonitor?.getTankForecasts?.useQuery?.(
    { terminalId: terminalId! },
    { enabled: !!terminalId && tab === "forecasts" }
  ) || { data: null, isLoading: false };

  const trendQuery = (trpc as any).tankMonitor?.getTankTrend?.useQuery?.(
    { terminalId: terminalId!, tankNumber: selectedTank!, hours: 24 },
    { enabled: !!terminalId && !!selectedTank }
  ) || { data: null, isLoading: false };

  const data = readingsQuery.data;
  const alerts = alertsQuery.data || [];
  const forecasts = forecastsQuery.data || [];
  const trend = trendQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Tank Level Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tank gauging, alerts & demand forecasting</p>
        </div>
        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 animate-pulse">
          <Activity className="w-3 h-3 mr-1" />LIVE
        </Badge>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Enter Terminal ID..."
            type="number"
            value={searchId}
            onChange={(e: any) => setSearchId(e.target.value)}
            onKeyDown={(e: any) => e.key === "Enter" && setTerminalId(parseInt(searchId))}
            className="bg-slate-900/50 border-slate-700 text-white max-w-xs"
          />
          <Button
            onClick={() => setTerminalId(parseInt(searchId))}
            disabled={!searchId}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Search className="w-4 h-4 mr-2" />Monitor
          </Button>
        </div>
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {([
            { key: "readings" as Tab, label: "Tank Levels", icon: <Gauge className="w-4 h-4 mr-1" /> },
            { key: "alerts" as Tab, label: "Alerts", icon: <Bell className="w-4 h-4 mr-1" /> },
            { key: "forecasts" as Tab, label: "Forecasts", icon: <BarChart3 className="w-4 h-4 mr-1" /> },
          ]).map(t => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? "default" : "ghost"}
              className={cn("rounded-md", tab === t.key ? "bg-cyan-600" : "text-slate-400")}
              onClick={() => setTab(t.key)}
            >
              {t.icon}{t.label}
              {t.key === "alerts" && alerts.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {(readingsQuery.isLoading || alertsQuery.isLoading || forecastsQuery.isLoading) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 bg-slate-700/30 rounded-xl" />)}
        </div>
      )}

      {/* ── Tab: Tank Readings ── */}
      {tab === "readings" && data && (
        <div className="space-y-4">
          {/* Terminal Summary */}
          {data.summary && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <Fuel className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{data.summary.terminalName}</p>
                      <p className="text-xs text-slate-500">{data.summary.totalTanks} tanks monitored</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase">Total Inventory</p>
                      <p className="text-lg font-bold font-mono text-white">
                        {(data.summary.totalInventory / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-slate-500">gallons</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase">Capacity</p>
                      <p className="text-lg font-bold font-mono text-slate-300">
                        {(data.summary.totalCapacity / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-slate-500">gallons</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase">Utilization</p>
                      <p className={cn("text-lg font-bold font-mono", levelTextColor(data.summary.overallUtilization))}>
                        {data.summary.overallUtilization}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.summary.alerts.critical > 0 && (
                        <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                          {data.summary.alerts.critical} critical
                        </Badge>
                      )}
                      {data.summary.alerts.warning > 0 && (
                        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                          {data.summary.alerts.warning} warnings
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Breakdown */}
                {data.summary.productBreakdown?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {data.summary.productBreakdown.map((p: any) => (
                      <div key={p.product} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/30 border border-slate-700/30">
                        <Droplets className={cn("w-3 h-3", levelTextColor(p.utilization))} />
                        <span className="text-xs text-slate-400 capitalize">{p.product.replace(/_/g, " ")}</span>
                        <span className={cn("text-xs font-bold font-mono", levelTextColor(p.utilization))}>{p.utilization}%</span>
                        <span className="text-xs text-slate-600">({p.tankCount})</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tank Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data.readings || []).map((tank: any) => {
              const sc = STATUS_CONFIG[tank.status] || STATUS_CONFIG.normal;
              const isSelected = selectedTank === tank.tankNumber;
              return (
                <Card
                  key={tank.tankId}
                  className={cn(
                    "bg-slate-800/50 rounded-xl transition-all cursor-pointer hover:border-cyan-500/30",
                    isSelected ? "border-cyan-500/50 ring-1 ring-cyan-500/20" : "border-slate-700/50",
                  )}
                  onClick={() => setSelectedTank(isSelected ? null : tank.tankNumber)}
                >
                  <CardContent className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Tank {tank.tankNumber}</span>
                        <Badge variant="outline" className={cn("text-xs", sc.color, sc.border)}>
                          {sc.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 capitalize">{tank.product.replace(/_/g, " ")}</span>
                    </div>

                    {/* Level Bar */}
                    <div className="relative mb-2">
                      <div className="h-8 rounded-lg bg-slate-900/50 border border-slate-700/30 overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-1000 rounded-lg", levelColor(tank.percentFull))}
                          style={{ width: `${tank.percentFull}%`, opacity: 0.6 }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-sm font-bold font-mono", levelTextColor(tank.percentFull))}>
                          {tank.percentFull}%
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      <div className="p-1.5 rounded-md bg-slate-900/30 text-center">
                        <p className="text-xs text-slate-500">Level</p>
                        <p className="text-xs font-mono font-bold text-white">
                          {(tank.currentLevelGallons / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div className="p-1.5 rounded-md bg-slate-900/30 text-center">
                        <p className="text-xs text-slate-500">Ullage</p>
                        <p className="text-xs font-mono font-bold text-slate-300">
                          {(tank.ullageGallons / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div className="p-1.5 rounded-md bg-slate-900/30 text-center">
                        <p className="text-xs text-slate-500">Rate</p>
                        <p className={cn("text-xs font-mono font-bold", tank.changeRateGPH >= 0 ? "text-emerald-400" : "text-amber-400")}>
                          {tank.changeRateGPH > 0 ? "+" : ""}{tank.changeRateGPH}
                        </p>
                      </div>
                    </div>

                    {/* Gauge & Temp Row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Gauge className="w-3 h-3" />
                        <span>{tank.gaugeFeet}'{tank.gaugeInches}"</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Thermometer className="w-3 h-3" />
                        <span>{tank.temperatureF}°F</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>API: {tank.apiGravity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{tank.daysSupplyRemaining}d supply</span>
                      </div>
                    </div>

                    {/* Flow indicator */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {tank.changeRateGPH < 0 ? (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="text-xs text-slate-500">
                        {Math.abs(tank.changeRateGPH)} GPH {tank.changeRateGPH < 0 ? "outflow" : "inflow"}
                      </span>
                      {tank.estimatedEmptyHours && (
                        <span className="text-xs text-amber-400 ml-auto">~{tank.estimatedEmptyHours}h to empty</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trend Detail (when tank selected) */}
          {trend && selectedTank && (
            <Card className="bg-slate-800/50 border-cyan-500/20 rounded-xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Tank {selectedTank} — 24h Trend
                  <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-400 capitalize ml-2">
                    {trend.reading?.product?.replace(/_/g, " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                {/* Mini sparkline using bars */}
                <div className="flex items-end gap-[2px] h-20 mb-2">
                  {(trend.trend || []).slice(-48).map((pt: any, i: number) => (
                    <div
                      key={i}
                      className={cn("flex-1 rounded-t-sm transition-all", levelColor(pt.percentFull))}
                      style={{ height: `${pt.percentFull}%`, opacity: 0.5 + (i / 96) }}
                      title={`${pt.percentFull}% at ${new Date(pt.timestamp).toLocaleTimeString()}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>24h ago</span>
                  <div className="flex items-center gap-3">
                    <span>Min: {Math.min(...(trend.trend || []).map((p: any) => p.percentFull))}%</span>
                    <span>Max: {Math.max(...(trend.trend || []).map((p: any) => p.percentFull))}%</span>
                    <span>Avg: {Math.round((trend.trend || []).reduce((s: number, p: any) => s + p.percentFull, 0) / Math.max((trend.trend || []).length, 1))}%</span>
                  </div>
                  <span>Now</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Alerts ── */}
      {tab === "alerts" && terminalId && (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <Bell className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-400 font-semibold">All Clear</p>
                <p className="text-xs text-slate-500">No active alerts for this terminal</p>
              </CardContent>
            </Card>
          )}
          {alerts.map((alert: any) => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            return (
              <Card key={alert.id} className={cn("bg-slate-800/50 rounded-xl border", `border-${alert.severity === "emergency" ? "red" : alert.severity === "critical" ? "orange" : alert.severity === "warning" ? "amber" : "blue"}-500/20`)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", sev.bg)}>
                      <span className={sev.color}>{sev.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-xs", sev.color)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-400">
                          {alert.type}
                        </Badge>
                        <span className="text-xs text-slate-500">Tank {alert.tankNumber}</span>
                        <span className="text-xs text-slate-600 capitalize">{alert.product.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-xs text-white">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(alert.triggeredAt).toLocaleTimeString()} — {alert.terminalName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Tab: Forecasts ── */}
      {tab === "forecasts" && terminalId && (
        <div className="space-y-3">
          {forecasts.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No forecast data available</p>
              </CardContent>
            </Card>
          )}
          {forecasts.map((fc: any) => (
            <Card key={fc.tankId} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">{fc.tankId}</span>
                    <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-400 capitalize">
                      {fc.product.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    {fc.confidence}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Daily Consumption</p>
                    <p className="text-sm font-bold font-mono text-white">{(fc.avgDailyConsumption / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-slate-500">gal/day</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Days to Reorder</p>
                    <p className={cn("text-sm font-bold font-mono", fc.daysUntilReorder <= 2 ? "text-red-400" : fc.daysUntilReorder <= 5 ? "text-amber-400" : "text-emerald-400")}>
                      {fc.daysUntilReorder}
                    </p>
                    <p className="text-xs text-slate-500">days</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Suggested Delivery</p>
                    <p className="text-sm font-bold font-mono text-cyan-400">{fc.suggestedDeliveryDate}</p>
                    <p className="text-xs text-slate-500">{(fc.suggestedDeliveryQty / 1000).toFixed(1)}K gal</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Days to Empty</p>
                    <p className={cn("text-sm font-bold font-mono", fc.daysUntilEmpty <= 3 ? "text-red-400" : "text-white")}>
                      {fc.daysUntilEmpty}
                    </p>
                    <p className="text-xs text-slate-500">days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!terminalId && !readingsQuery.isLoading && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Gauge className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-lg font-semibold text-white">Real-Time Tank Level Monitor</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Enter a Terminal ID to view live tank levels, gauge readings, alerts, and demand forecasts.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> Live gauging</div>
              <div className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400" /> Threshold alerts</div>
              <div className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-purple-400" /> Demand forecast</div>
              <div className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-red-400" /> Temperature</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
