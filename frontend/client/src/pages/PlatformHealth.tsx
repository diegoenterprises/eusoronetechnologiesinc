/**
 * PLATFORM HEALTH PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, Server, Database, Cpu, HardDrive, Wifi,
  RefreshCw, CheckCircle, AlertTriangle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformHealth() {
  const healthQuery = trpc.admin.getPlatformHealth.useQuery();
  const servicesQuery = trpc.admin.getServicesStatus.useQuery();
  const metricsQuery = trpc.admin.getSystemMetrics.useQuery();

  const health = healthQuery.data;
  const services = servicesQuery.data;
  const metrics = metricsQuery.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "degraded": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "down": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-green-500/20 text-green-400 border-0">Healthy</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Degraded</Badge>;
      case "down": return <Badge className="bg-red-500/20 text-red-400 border-0">Down</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Platform Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">System status and performance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", health?.overallStatus === "healthy" ? "bg-green-500/20 border border-green-500/30" : health?.overallStatus === "degraded" ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-red-500/20 border border-red-500/30")}>
            {getStatusIcon(health?.overallStatus || "unknown")}
            <span className={cn("font-medium", health?.overallStatus === "healthy" ? "text-green-400" : health?.overallStatus === "degraded" ? "text-yellow-400" : "text-red-400")}>
              {health?.overallStatus === "healthy" ? "All Systems Operational" : health?.overallStatus === "degraded" ? "Degraded Performance" : "System Issues"}
            </span>
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => { healthQuery.refetch(); servicesQuery.refetch(); metricsQuery.refetch(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {metricsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{metrics?.cpuUsage || 0}%</p>
                )}
                <p className="text-xs text-slate-400">CPU Usage</p>
              </div>
            </div>
            <Progress value={metrics?.cpuUsage || 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Server className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {metricsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{metrics?.memoryUsage || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Memory</p>
              </div>
            </div>
            <Progress value={metrics?.memoryUsage || 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <HardDrive className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {metricsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{metrics?.diskUsage || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Disk</p>
              </div>
            </div>
            <Progress value={metrics?.diskUsage || 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <Wifi className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {metricsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{metrics?.uptime || "0"}%</p>
                )}
                <p className="text-xs text-slate-400">Uptime</p>
              </div>
            </div>
            <Progress value={parseFloat(metrics?.uptime || "0")} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Services Status</CardTitle>
        </CardHeader>
        <CardContent>
          {servicesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services?.map((service: any) => (
                <div key={service.name} className={cn("p-4 rounded-xl border-2", service.status === "healthy" ? "bg-green-500/10 border-green-500/30" : service.status === "degraded" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="text-white font-medium">{service.name}</span>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Response: {service.responseTime}ms</span>
                    <span>Last check: {service.lastCheck}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">Connections</p>
                <p className="text-2xl font-bold text-white">{health?.database?.connections || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">Query Time</p>
                <p className="text-2xl font-bold text-white">{health?.database?.avgQueryTime || 0}ms</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">Size</p>
                <p className="text-2xl font-bold text-white">{health?.database?.size || "0 GB"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health?.database?.status || "unknown")}
                  <span className={cn("font-medium", health?.database?.status === "healthy" ? "text-green-400" : "text-red-400")}>
                    {health?.database?.status || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
