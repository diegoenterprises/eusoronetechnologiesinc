/**
 * RATE LIMITING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gauge, Shield, AlertTriangle, Clock, RefreshCw,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RateLimiting() {
  const configQuery = (trpc as any).admin.getRateLimitConfig.useQuery();
  const statsQuery = (trpc as any).admin.getRateLimitStats.useQuery();

  const updateMutation = (trpc as any).admin.updateRateLimitConfig.useMutation({
    onSuccess: () => { toast.success("Configuration updated"); configQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const config = configQuery.data;
  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Rate Limiting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure API rate limits</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => statsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh Stats
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Gauge className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.totalRequests?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Requests (1h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.blockedRequests?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Blocked (1h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.avgLatency}ms</p>
                )}
                <p className="text-xs text-slate-400">Avg Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.activeUsers?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Configuration */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Rate Limit Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configQuery.isLoading ? (
            [1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enable Rate Limiting</p>
                  <p className="text-xs text-slate-500">Protect API from abuse</p>
                </div>
                <Switch checked={config?.enabled} onCheckedChange={(checked) => updateMutation.mutate({ enabled: checked })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-white font-medium mb-2">Requests per Minute (Anonymous)</p>
                  <Input type="number" value={config?.anonymousRpm || 60} onChange={(e: any) => updateMutation.mutate({ anonymousRpm: parseInt(e.target.value) })} className="bg-slate-800/50 border-slate-600/50 rounded-lg" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-white font-medium mb-2">Requests per Minute (Authenticated)</p>
                  <Input type="number" value={config?.authenticatedRpm || 300} onChange={(e: any) => updateMutation.mutate({ authenticatedRpm: parseInt(e.target.value) })} className="bg-slate-800/50 border-slate-600/50 rounded-lg" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-white font-medium mb-2">Burst Limit</p>
                  <Input type="number" value={config?.burstLimit || 50} onChange={(e: any) => updateMutation.mutate({ burstLimit: parseInt(e.target.value) })} className="bg-slate-800/50 border-slate-600/50 rounded-lg" />
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-white font-medium mb-2">Block Duration (seconds)</p>
                  <Input type="number" value={config?.blockDuration || 300} onChange={(e: any) => updateMutation.mutate({ blockDuration: parseInt(e.target.value) })} className="bg-slate-800/50 border-slate-600/50 rounded-lg" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Rate Limited IPs */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Top Rate Limited IPs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : stats?.topBlockedIps?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-slate-400">No rate limited IPs</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {stats?.topBlockedIps?.map((ip: any, idx: number) => (
                <div key={ip.address} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", idx === 0 ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-400")}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-mono">{ip.address}</p>
                      <p className="text-xs text-slate-500">{ip.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{ip.blockedCount?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">blocked requests</p>
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
