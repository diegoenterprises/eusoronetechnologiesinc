/**
 * CACHE MANAGEMENT PAGE
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
  Database, RefreshCw, Trash2, Zap, HardDrive,
  Clock, CheckCircle, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CacheManagement() {
  const cacheQuery = trpc.admin.getCacheStats.useQuery();
  const keysQuery = trpc.admin.getCacheKeys.useQuery({ limit: 20 });

  const clearAllMutation = trpc.admin.clearAllCache.useMutation({
    onSuccess: () => { toast.success("All cache cleared"); cacheQuery.refetch(); keysQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const clearKeyMutation = trpc.admin.clearCacheKey.useMutation({
    onSuccess: () => { toast.success("Cache key cleared"); keysQuery.refetch(); cacheQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = cacheQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Cache Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor and manage application cache</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => cacheQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => clearAllMutation.mutate({})}>
            <Trash2 className="w-4 h-4 mr-2" />Clear All
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {cacheQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.totalKeys?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <HardDrive className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {cacheQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.memoryUsed}</p>
                )}
                <p className="text-xs text-slate-400">Memory Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {cacheQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.hitRate}%</p>
                )}
                <p className="text-xs text-slate-400">Hit Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {cacheQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.requestsPerSec}</p>
                )}
                <p className="text-xs text-slate-400">Requests/sec</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Usage */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cacheQuery.isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">{stats?.memoryUsed} / {stats?.memoryLimit}</span>
                <span className={cn("font-bold", stats?.memoryPercentage > 80 ? "text-red-400" : stats?.memoryPercentage > 60 ? "text-yellow-400" : "text-green-400")}>{stats?.memoryPercentage}%</span>
              </div>
              <Progress value={stats?.memoryPercentage} className={cn("h-3", stats?.memoryPercentage > 80 && "[&>div]:bg-red-500")} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Keys */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Cache Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {keysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : keysQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No cache keys</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {keysQuery.data?.map((key: any) => (
                <div key={key.name} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-700/50">
                      <Database className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-mono text-sm">{key.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{key.size}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />TTL: {key.ttl}</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{key.hits} hits</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => clearKeyMutation.mutate({ key: key.name })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
