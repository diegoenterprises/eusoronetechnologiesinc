/**
 * SYSTEM HEALTH PAGE
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
  CheckCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SystemHealth() {
  const healthQuery = trpc.admin.getSystemHealth.useQuery({}, { refetchInterval: 30000 });
  const servicesQuery = trpc.admin.getServiceStatus.useQuery({}, { refetchInterval: 30000 });

  const health = healthQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case "down": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Down</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-400";
    if (usage >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">System Health</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor system performance</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => { healthQuery.refetch(); servicesQuery.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Activity className="w-6 h-6 text-cyan-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.uptime || 0))}>{health?.uptime}%</p>}<p className="text-xs text-slate-400">Uptime</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Cpu className="w-6 h-6 text-green-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.cpuUsage || 0))}>{health?.cpuUsage}%</p>}<p className="text-xs text-slate-400">CPU</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Server className="w-6 h-6 text-purple-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.memoryUsage || 0))}>{health?.memoryUsage}%</p>}<p className="text-xs text-slate-400">Memory</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><HardDrive className="w-6 h-6 text-yellow-400" /></div>
              <div>{healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", getUsageColor(health?.diskUsage || 0))}>{health?.diskUsage}%</p>}<p className="text-xs text-slate-400">Disk</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Server className="w-5 h-5 text-cyan-400" />Resource Usage</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {healthQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">CPU Usage</span><span className={cn("text-sm font-bold", getUsageColor(health?.cpuUsage || 0))}>{health?.cpuUsage}%</span></div>
                  <Progress value={health?.cpuUsage} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">Memory Usage</span><span className={cn("text-sm font-bold", getUsageColor(health?.memoryUsage || 0))}>{health?.memoryUsage}%</span></div>
                  <Progress value={health?.memoryUsage} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">Disk Usage</span><span className={cn("text-sm font-bold", getUsageColor(health?.diskUsage || 0))}>{health?.diskUsage}%</span></div>
                  <Progress value={health?.diskUsage} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">Network I/O</span><span className="text-sm font-bold text-cyan-400">{health?.networkIO}</span></div>
                  <Progress value={health?.networkUsage} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Database className="w-5 h-5 text-purple-400" />Services</CardTitle></CardHeader>
          <CardContent className="p-0">
            {servicesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {servicesQuery.data?.map((service: any) => (
                  <div key={service.id} className={cn("p-4 flex items-center justify-between", service.status === "down" && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", service.status === "healthy" ? "bg-green-400" : service.status === "degraded" ? "bg-yellow-400" : "bg-red-400")} />
                      <div>
                        <p className="text-white font-medium">{service.name}</p>
                        <p className="text-xs text-slate-500">Response: {service.responseTime}ms</p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
