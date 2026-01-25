/**
 * SYSTEM STATUS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, CheckCircle, AlertTriangle, XCircle,
  Server, Database, Globe, Clock, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SystemStatus() {
  const statusQuery = trpc.system.getStatus.useQuery(undefined, { refetchInterval: 30000 });
  const incidentsQuery = trpc.system.getIncidents.useQuery({ limit: 10 });
  const uptimeQuery = trpc.system.getUptime.useQuery();

  const status = statusQuery.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "degraded": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "outage": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-500/20 text-green-400";
      case "degraded": return "bg-yellow-500/20 text-yellow-400";
      case "outage": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getOverallStatus = () => {
    if (!status?.services) return "unknown";
    const hasOutage = status.services.some((s: any) => s.status === "outage");
    const hasDegraded = status.services.some((s: any) => s.status === "degraded");
    if (hasOutage) return "outage";
    if (hasDegraded) return "degraded";
    return "operational";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            System Status
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time platform health</p>
        </div>
      </div>

      {/* Overall Status */}
      {statusQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", getOverallStatus() === "operational" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : getOverallStatus() === "degraded" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", getOverallStatus() === "operational" ? "bg-green-500/20" : getOverallStatus() === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                {getStatusIcon(getOverallStatus())}
              </div>
              <div>
                <p className="text-white text-2xl font-bold">
                  {getOverallStatus() === "operational" ? "All Systems Operational" : getOverallStatus() === "degraded" ? "Degraded Performance" : "System Outage"}
                </p>
                <p className="text-slate-400">Last updated: {status?.lastUpdated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uptime Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {uptimeQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{uptimeQuery.data?.last24h}%</p>
                )}
                <p className="text-xs text-slate-400">24h Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {uptimeQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{uptimeQuery.data?.last7d}%</p>
                )}
                <p className="text-xs text-slate-400">7d Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {uptimeQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{uptimeQuery.data?.last30d}%</p>
                )}
                <p className="text-xs text-slate-400">30d Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Server className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {uptimeQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{uptimeQuery.data?.responseTime}ms</p>
                )}
                <p className="text-xs text-slate-400">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statusQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {status?.services?.map((service: any) => (
                <div key={service.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", service.status === "operational" ? "bg-green-500/20" : service.status === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      {service.icon === "server" ? <Server className={cn("w-5 h-5", service.status === "operational" ? "text-green-400" : service.status === "degraded" ? "text-yellow-400" : "text-red-400")} /> : service.icon === "database" ? <Database className={cn("w-5 h-5", service.status === "operational" ? "text-green-400" : service.status === "degraded" ? "text-yellow-400" : "text-red-400")} /> : <Globe className={cn("w-5 h-5", service.status === "operational" ? "text-green-400" : service.status === "degraded" ? "text-yellow-400" : "text-red-400")} />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">{service.uptime}% uptime</p>
                      <Progress value={service.uptime} className="h-1 w-24" />
                    </div>
                    <Badge className={cn("border-0", getStatusColor(service.status))}>
                      {getStatusIcon(service.status)}
                      <span className="ml-1 capitalize">{service.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {incidentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : incidentsQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-slate-400">No recent incidents</p>
              <p className="text-sm text-slate-500 mt-1">All systems running smoothly</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {incidentsQuery.data?.map((incident: any) => (
                <div key={incident.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg mt-1", incident.resolved ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      {incident.resolved ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{incident.title}</p>
                        <Badge className={cn("border-0", incident.resolved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                          {incident.resolved ? "Resolved" : "Investigating"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{incident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{incident.startedAt}</span>
                        {incident.resolved && <span>Duration: {incident.duration}</span>}
                        <span>Affected: {incident.affectedServices?.join(", ")}</span>
                      </div>
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
