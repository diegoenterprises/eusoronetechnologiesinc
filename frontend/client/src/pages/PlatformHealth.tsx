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
  Activity, Server, Database, Cpu, HardDrive,
  CheckCircle, AlertTriangle, RefreshCw, Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformHealth() {
  const healthQuery = (trpc as any).admin.getPlatformHealth.useQuery({}, { refetchInterval: 30000 });
  const servicesQuery = (trpc as any).admin.getServiceStatus.useQuery({}, { refetchInterval: 30000 });

  const health = healthQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case "down": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Down</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-red-400";
    if (percent >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Platform Health</h1>
          <p className="text-slate-400 text-sm mt-1">System monitoring and status</p>
        </div>
        <Button variant="outline" className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] rounded-lg" onClick={() => { healthQuery.refetch(); servicesQuery.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {healthQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", health?.overallStatus === "healthy" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : health?.overallStatus === "degraded" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Status</p>
                <p className="text-3xl font-bold text-white capitalize">{health?.overallStatus}</p>
                <p className="text-sm text-slate-400 mt-1">Uptime: {health?.uptime}</p>
              </div>
              <div className={cn("p-4 rounded-full", health?.overallStatus === "healthy" ? "bg-green-500/20" : health?.overallStatus === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Activity className={cn("w-10 h-10", health?.overallStatus === "healthy" ? "text-green-400" : health?.overallStatus === "degraded" ? "text-yellow-400" : "text-red-400")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-blue-500/20"><Cpu className="w-6 h-6 text-blue-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.cpu || 0))}>{health?.cpu}%</p>}<p className="text-xs text-slate-400">CPU</p></div>
            </div>
            <Progress value={health?.cpu || 0} className="h-2" />
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-purple-500/20"><Server className="w-6 h-6 text-purple-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.memory || 0))}>{health?.memory}%</p>}<p className="text-xs text-slate-400">Memory</p></div>
            </div>
            <Progress value={health?.memory || 0} className="h-2" />
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-cyan-500/20"><HardDrive className="w-6 h-6 text-cyan-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.disk || 0))}>{health?.disk}%</p>}<p className="text-xs text-slate-400">Disk</p></div>
            </div>
            <Progress value={health?.disk || 0} className="h-2" />
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-green-500/20"><Wifi className="w-6 h-6 text-green-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">{health?.latency}ms</p>}<p className="text-xs text-slate-400">Latency</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Server className="w-5 h-5 text-cyan-400" />Services</CardTitle></CardHeader>
        <CardContent className="p-0">
          {servicesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(servicesQuery.data as any)?.map((service: any) => (
                <div key={service.name} className={cn("p-4 flex items-center justify-between", service.status === "down" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", service.status === "healthy" ? "bg-green-500/20" : service.status === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Database className={cn("w-5 h-5", service.status === "healthy" ? "text-green-400" : service.status === "degraded" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">{service.responseTime}ms</p>
                      <p className="text-xs text-slate-500">Last check: {service.lastCheck}</p>
                    </div>
                    {getStatusBadge(service.status)}
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
