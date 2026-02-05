/**
 * SCHEDULED TASKS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, Play, Pause, RefreshCw, CheckCircle,
  AlertTriangle, Calendar, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ScheduledTasks() {
  const tasksQuery = (trpc as any).admin.getScheduledTasks.useQuery();
  const historyQuery = (trpc as any).admin.getTaskHistory.useQuery({ limit: 10 });

  const toggleMutation = (trpc as any).admin.toggleScheduledTask.useMutation({
    onSuccess: () => { toast.success("Task updated"); tasksQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const runNowMutation = (trpc as any).admin.runTaskNow.useMutation({
    onSuccess: () => { toast.success("Task started"); historyQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "paused": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Pause className="w-3 h-3 mr-1" />Paused</Badge>;
      case "running": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
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
            Scheduled Tasks
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage cron jobs and scheduled tasks</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => tasksQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Tasks List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Scheduled Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tasksQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (tasksQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No scheduled tasks</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(tasksQuery.data as any)?.map((task: any) => (
                <div key={task.id} className={cn("p-4", task.status === "failed" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", task.enabled ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <Clock className={cn("w-5 h-5", task.enabled ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{task.name}</p>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-sm text-slate-400">{task.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.schedule}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Next: {task.nextRun}</span>
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Last: {task.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => runNowMutation.mutate({ taskId: task.id })} disabled={task.status === "running"}>
                        <Play className="w-4 h-4 mr-1" />Run Now
                      </Button>
                      <Switch checked={task.enabled} onCheckedChange={(checked) => toggleMutation.mutate({ taskId: task.id, enabled: checked })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : (historyQuery.data as any)?.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No execution history</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {(historyQuery.data as any)?.map((execution: any) => (
                <div key={execution.id} className={cn("p-4 flex items-center justify-between", execution.status === "failed" && "bg-red-500/5")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", execution.status === "success" ? "bg-green-500/20" : "bg-red-500/20")}>
                      {execution.status === "success" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{execution.taskName}</p>
                      <p className="text-xs text-slate-500">{execution.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(execution.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400", "border-0")}>{execution.status}</Badge>
                    <span className="text-sm text-slate-400">{execution.duration}</span>
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
