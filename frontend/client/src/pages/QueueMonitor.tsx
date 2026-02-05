/**
 * QUEUE MONITOR PAGE
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
  Layers, RefreshCw, CheckCircle, Clock, AlertTriangle,
  Play, Pause, Trash2, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function QueueMonitor() {
  const queuesQuery = (trpc as any).admin.getQueues.useQuery();
  const jobsQuery = (trpc as any).admin.getRecentJobs.useQuery({ limit: 20 });

  const pauseMutation = (trpc as any).admin.pauseQueue.useMutation({
    onSuccess: () => { toast.success("Queue paused"); queuesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const resumeMutation = (trpc as any).admin.resumeQueue.useMutation({
    onSuccess: () => { toast.success("Queue resumed"); queuesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const clearMutation = (trpc as any).admin.clearQueue.useMutation({
    onSuccess: () => { toast.success("Queue cleared"); queuesQuery.refetch(); jobsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><Play className="w-3 h-3 mr-1" />Active</Badge>;
      case "paused": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Pause className="w-3 h-3 mr-1" />Paused</Badge>;
      case "completed": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Queue Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor background job queues</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => { queuesQuery.refetch(); jobsQuery.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queuesQuery.isLoading ? (
          [1, 2, 3].map((i: any) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : (
          (queuesQuery.data as any)?.map((queue: any) => (
            <Card key={queue.name} className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl", queue.status === "paused" && "border-yellow-500/30")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    {queue.name}
                  </CardTitle>
                  {getStatusBadge(queue.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-xl font-bold text-blue-400">{queue.waiting}</p>
                    <p className="text-xs text-slate-500">Waiting</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-xl font-bold text-yellow-400">{queue.active}</p>
                    <p className="text-xs text-slate-500">Active</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-xl font-bold text-red-400">{queue.failed}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-slate-400">Processing</span>
                    <span className="text-slate-400">{queue.processed?.toLocaleString()} / {queue.total?.toLocaleString()}</span>
                  </div>
                  <Progress value={(queue.processed / queue.total) * 100} className="h-2" />
                </div>
                <div className="flex gap-2">
                  {queue.status === "active" ? (
                    <Button size="sm" variant="outline" className="flex-1 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 rounded-lg" onClick={() => pauseMutation.mutate({ queueName: queue.name })}>
                      <Pause className="w-4 h-4 mr-1" />Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg" onClick={() => resumeMutation.mutate({ queueName: queue.name })}>
                      <Play className="w-4 h-4 mr-1" />Resume
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => clearMutation.mutate({ queueName: queue.name })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Jobs */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (jobsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No recent jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {(jobsQuery.data as any)?.map((job: any) => (
                <div key={job.id} className={cn("p-4 flex items-center justify-between", job.status === "failed" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", job.status === "completed" ? "bg-green-500/20" : job.status === "failed" ? "bg-red-500/20" : "bg-blue-500/20")}>
                      {job.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-400" /> : job.status === "failed" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{job.name}</p>
                      <p className="text-xs text-slate-500">{job.queue} - {job.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    <span className="text-sm text-slate-400">{job.duration}</span>
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
