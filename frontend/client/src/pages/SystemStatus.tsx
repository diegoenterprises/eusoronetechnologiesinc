/**
 * SYSTEM STATUS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, CheckCircle, AlertTriangle, XCircle,
  Server, Database, Globe, RefreshCw, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SystemStatus() {
  const statusQuery = trpc.system.getStatus.useQuery();
  const incidentsQuery = trpc.system.getIncidents.useQuery({ limit: 10 });
  const uptimeQuery = trpc.system.getUptime.useQuery();

  const status = statusQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Operational</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case "outage": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Outage</Badge>;
      case "maintenance": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Maintenance</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "api": return <Server className="w-5 h-5" />;
      case "database": return <Database className="w-5 h-5" />;
      case "web": return <Globe className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            System Status
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time system health monitoring</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => statusQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {statusQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", status?.overall === "operational" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : status?.overall === "degraded" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", status?.overall === "operational" ? "bg-green-500/20" : status?.overall === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                {status?.overall === "operational" ? <CheckCircle className="w-8 h-8 text-green-400" /> : status?.overall === "degraded" ? <AlertTriangle className="w-8 h-8 text-yellow-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
              </div>
              <div>
                <p className="text-white text-2xl font-bold">
                  {status?.overall === "operational" ? "All Systems Operational" : status?.overall === "degraded" ? "Partial System Degradation" : "System Outage"}
                </p>
                <p className="text-slate-400">Last updated: {status?.lastUpdated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Status */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Services</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statusQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {status?.services?.map((service: any) => (
                <div key={service.name} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", service.status === "operational" ? "bg-green-500/20 text-green-400" : service.status === "degraded" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
                      {getServiceIcon(service.type)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Uptime (Last 90 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uptimeQuery.isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-green-400">{uptimeQuery.data?.percentage}%</span>
                  <span className="text-slate-400">{uptimeQuery.data?.downtime} downtime</span>
                </div>
                <div className="flex gap-0.5">
                  {uptimeQuery.data?.days?.map((day: any, idx: number) => (
                    <div key={idx} className={cn("flex-1 h-8 rounded-sm", day.status === "up" ? "bg-green-500" : day.status === "partial" ? "bg-yellow-500" : "bg-red-500")} title={day.date} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {incidentsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : incidentsQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-slate-400">No recent incidents</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
                {incidentsQuery.data?.map((incident: any) => (
                  <div key={incident.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{incident.title}</p>
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-slate-400">{incident.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{incident.date}</p>
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
