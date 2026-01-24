/**
 * PERFORMANCE MONITOR PAGE
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
  Activity, Cpu, HardDrive, Wifi, RefreshCw,
  Clock, TrendingUp, TrendingDown, Server
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformanceMonitor() {
  const [timeRange, setTimeRange] = useState("1h");

  const metricsQuery = trpc.admin.getPerformanceMetrics.useQuery({ timeRange });
  const endpointsQuery = trpc.admin.getSlowEndpoints.useQuery({ timeRange, limit: 10 });

  const metrics = metricsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Performance Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">System performance and health metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => metricsQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              {metricsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : (
                <span className={cn("text-lg font-bold", metrics?.cpu > 80 ? "text-red-400" : metrics?.cpu > 60 ? "text-yellow-400" : "text-green-400")}>{metrics?.cpu}%</span>
              )}
            </div>
            <p className="text-white font-medium">CPU Usage</p>
            {!metricsQuery.isLoading && <Progress value={metrics?.cpu} className={cn("h-2 mt-2", metrics?.cpu > 80 && "[&>div]:bg-red-500")} />}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Server className="w-5 h-5 text-purple-400" />
              </div>
              {metricsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : (
                <span className={cn("text-lg font-bold", metrics?.memory > 80 ? "text-red-400" : metrics?.memory > 60 ? "text-yellow-400" : "text-green-400")}>{metrics?.memory}%</span>
              )}
            </div>
            <p className="text-white font-medium">Memory Usage</p>
            {!metricsQuery.isLoading && <Progress value={metrics?.memory} className={cn("h-2 mt-2", metrics?.memory > 80 && "[&>div]:bg-red-500")} />}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <HardDrive className="w-5 h-5 text-green-400" />
              </div>
              {metricsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : (
                <span className={cn("text-lg font-bold", metrics?.disk > 80 ? "text-red-400" : metrics?.disk > 60 ? "text-yellow-400" : "text-green-400")}>{metrics?.disk}%</span>
              )}
            </div>
            <p className="text-white font-medium">Disk Usage</p>
            {!metricsQuery.isLoading && <Progress value={metrics?.disk} className={cn("h-2 mt-2", metrics?.disk > 80 && "[&>div]:bg-red-500")} />}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Wifi className="w-5 h-5 text-cyan-400" />
              </div>
              {metricsQuery.isLoading ? <Skeleton className="h-6 w-16" /> : (
                <span className="text-lg font-bold text-cyan-400">{metrics?.bandwidth}</span>
              )}
            </div>
            <p className="text-white font-medium">Bandwidth</p>
            <p className="text-xs text-slate-500 mt-2">{metrics?.bandwidthUsed} / {metrics?.bandwidthLimit}</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Times */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Response Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-3xl font-bold text-green-400">{metrics?.avgResponseTime}ms</p>
                <p className="text-sm text-slate-400">Average</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-3xl font-bold text-blue-400">{metrics?.p50ResponseTime}ms</p>
                <p className="text-sm text-slate-400">P50</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-3xl font-bold text-yellow-400">{metrics?.p95ResponseTime}ms</p>
                <p className="text-sm text-slate-400">P95</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-3xl font-bold text-red-400">{metrics?.p99ResponseTime}ms</p>
                <p className="text-sm text-slate-400">P99</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slow Endpoints */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Slowest Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {endpointsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : endpointsQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-slate-400">All endpoints performing well</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {endpointsQuery.data?.map((endpoint: any, idx: number) => (
                <div key={endpoint.path} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", idx < 3 ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-400")}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-mono text-sm">{endpoint.method} {endpoint.path}</p>
                      <p className="text-xs text-slate-500">{endpoint.calls?.toLocaleString()} calls</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold", endpoint.avgTime > 1000 ? "text-red-400" : endpoint.avgTime > 500 ? "text-yellow-400" : "text-green-400")}>{endpoint.avgTime}ms</p>
                    <div className="flex items-center gap-1 text-xs">
                      {endpoint.trend === "up" ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingDown className="w-3 h-3 text-green-400" />}
                      <span className={endpoint.trend === "up" ? "text-red-400" : "text-green-400"}>{endpoint.trendValue}</span>
                    </div>
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
