/**
 * MAINTENANCE SCHEDULE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Wrench, Calendar, Truck, CheckCircle, Clock,
  AlertTriangle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MaintenanceSchedule() {
  const [filter, setFilter] = useState("upcoming");

  const maintenanceQuery = (trpc as any).fleet.getMaintenanceSchedule.useQuery({ filter });
  const statsQuery = (trpc as any).fleet.getMaintenanceStats.useQuery();

  const completeMutation = (trpc as any).fleet.completeMaintenance.useMutation({
    onSuccess: () => { toast.success("Maintenance completed"); maintenanceQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "in_progress": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Wrench className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Maintenance Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">Manage vehicle maintenance</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Calendar className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.upcoming || 0}</p>}<p className="text-xs text-slate-400">Upcoming</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Wrench className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.inProgress || 0}</p>}<p className="text-xs text-slate-400">In Progress</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.overdue || 0}</p>}<p className="text-xs text-slate-400">Overdue</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completedThisMonth || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Wrench className="w-5 h-5 text-cyan-400" />Maintenance Tasks</CardTitle></CardHeader>
        <CardContent className="p-0">
          {maintenanceQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (maintenanceQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Wrench className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No maintenance tasks</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(maintenanceQuery.data as any)?.map((task: any) => (
                <div key={task.id} className={cn("p-4 flex items-center justify-between", task.status === "overdue" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", task.status === "completed" ? "bg-green-500/20" : task.status === "overdue" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                      <Wrench className={cn("w-5 h-5", task.status === "completed" ? "text-green-400" : task.status === "overdue" ? "text-red-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{task.type}</p>
                        {getStatusBadge(task.status)}
                        <span className={cn("text-xs font-medium", getPriorityColor(task.priority))}>{task.priority}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Truck className="w-3 h-3" /><span>{task.vehicle}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.scheduledDate}</span>
                        {task.estimatedCost && <span>Est: ${task.estimatedCost}</span>}
                      </div>
                    </div>
                  </div>
                  {task.status !== "completed" && (
                    <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg" onClick={() => completeMutation.mutate({ taskId: task.id })}>
                      <CheckCircle className="w-4 h-4 mr-1" />Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
