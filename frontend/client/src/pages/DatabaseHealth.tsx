/**
 * DATABASE HEALTH PAGE
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
  Database, RefreshCw, CheckCircle, AlertTriangle,
  Clock, HardDrive, Activity, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DatabaseHealth() {
  const healthQuery = trpc.admin.getDatabaseHealth.useQuery();
  const queriesQuery = trpc.admin.getSlowQueries.useQuery({ limit: 10 });

  const optimizeMutation = trpc.admin.optimizeDatabase.useMutation({
    onSuccess: () => { toast.success("Optimization started"); healthQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const health = healthQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "critical": return <Badge className="bg-red-500/20 text-red-400 border-0">Critical</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Database Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor database performance and health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => healthQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => optimizeMutation.mutate({})}>
            <Zap className="w-4 h-4 mr-2" />Optimize
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {healthQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", health?.status === "healthy" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : health?.status === "warning" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", health?.status === "healthy" ? "bg-green-500/20" : health?.status === "warning" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Database className={cn("w-8 h-8", health?.status === "healthy" ? "text-green-400" : health?.status === "warning" ? "text-yellow-400" : "text-red-400")} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-2xl font-bold">Database Status</p>
                  {getStatusBadge(health?.status || "")}
                </div>
                <p className="text-slate-400">Uptime: {health?.uptime} | Version: {health?.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{typeof health?.connections === 'object' ? `${(health.connections as any).active}/${(health.connections as any).max}` : health?.connections}</p>
                )}
                <p className="text-xs text-slate-400">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{health?.queriesPerSec}</p>
                )}
                <p className="text-xs text-slate-400">Queries/sec</p>
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
                {healthQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{health?.avgQueryTime}ms</p>
                )}
                <p className="text-xs text-slate-400">Avg Query Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <HardDrive className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {healthQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{health?.dbSize}</p>
                )}
                <p className="text-xs text-slate-400">Database Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {health?.tables?.map((table: any) => (
                <div key={table.name} className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{table.name}</span>
                    <span className="text-slate-400">{table.size} ({table.rows?.toLocaleString()} rows)</span>
                  </div>
                  <Progress value={table.percentage} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slow Queries */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Slow Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {queriesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : queriesQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-slate-400">No slow queries detected</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {queriesQuery.data?.map((query: any, idx: number) => (
                <div key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(query.duration > 5000 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>{query.duration}ms</Badge>
                    <span className="text-xs text-slate-500">{query.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-300 font-mono truncate">{query.sql}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
