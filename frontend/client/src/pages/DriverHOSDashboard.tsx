/**
 * DRIVER HOS DASHBOARD PAGE
 * 100% Dynamic - Detailed Hours of Service management with ELD sync
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Clock, AlertTriangle, CheckCircle, Coffee, Truck,
  Moon, Play, Square, FileText, RefreshCw, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const dutyStatuses = [
  { value: "driving", label: "Driving", icon: Truck, color: "text-green-400", bg: "bg-green-500/20" },
  { value: "on_duty", label: "On Duty (Not Driving)", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  { value: "sleeper", label: "Sleeper Berth", icon: Moon, color: "text-purple-400", bg: "bg-purple-500/20" },
  { value: "off_duty", label: "Off Duty", icon: Coffee, color: "text-slate-400", bg: "bg-slate-500/20" },
];

export default function DriverHOSDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const hosQuery = trpc.hos.getCurrentStatus.useQuery({ driverId: "current" });
  const logsQuery = trpc.hos.getStatus.useQuery();
  const violationsQuery = trpc.hos.getViolations.useQuery({ driverId: "current" });
  const eldQuery = trpc.eld.getDevices.useQuery();

  const changeStatusMutation = trpc.drivers.changeHOSStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      hosQuery.refetch();
      logsQuery.refetch();
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const hos = hosQuery.data;
  const logs = logsQuery.data || [];
  const violations = violationsQuery.data || [];
  const eld = eldQuery.data;

  const getProgressColor = (remaining: number, total: number) => {
    const percent = (remaining / total) * 100;
    if (percent > 50) return "bg-green-500";
    if (percent > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Hours of Service
          </h1>
          <p className="text-slate-400 text-sm mt-1">ELD Compliance Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("border-0", eld?.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            <RefreshCw className={cn("w-3 h-3 mr-1", eld?.status === "syncing" && "animate-spin")} />
            ELD {eld?.status === "connected" ? "Connected" : "Disconnected"}
          </Badge>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      {/* Current Status */}
      <Card className={cn(
        "rounded-xl border-2",
        hos?.currentStatus === "driving" ? "bg-green-500/10 border-green-500/30" :
        hos?.currentStatus === "on_duty" ? "bg-cyan-500/10 border-cyan-500/30" :
        hos?.currentStatus === "sleeper" ? "bg-purple-500/10 border-purple-500/30" :
        "bg-slate-800/50 border-slate-700/50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", dutyStatuses.find(s => s.value === hos?.currentStatus)?.bg)}>
                {React.createElement(dutyStatuses.find(s => s.value === hos?.currentStatus)?.icon || Clock, {
                  className: cn("w-8 h-8", dutyStatuses.find(s => s.value === hos?.currentStatus)?.color)
                })}
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Status</p>
                <p className="text-white font-bold text-2xl">
                  {dutyStatuses.find(s => s.value === hos?.currentStatus)?.label || "Unknown"}
                </p>
                <p className="text-slate-400 text-sm">Since {hos?.statusStartTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dutyStatuses.map((status) => (
                <Button
                  key={status.value}
                  variant="outline"
                  onClick={() => changeStatusMutation.mutate({ driverId: "current", status: status.value })}
                  disabled={hos?.currentStatus === status.value}
                  className={cn(
                    "rounded-lg",
                    hos?.currentStatus === status.value
                      ? `${status.bg} border-transparent`
                      : "bg-slate-700/50 border-slate-600/50"
                  )}
                >
                  {React.createElement(status.icon, { className: cn("w-4 h-4 mr-2", status.color) })}
                  {status.label.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HOS Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hosQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">11-Hour Driving</span>
                  </div>
                  <span className="text-white font-bold text-xl">{hos?.limits?.driving?.remaining || 0}h</span>
                </div>
                <Progress
                  value={((hos?.limits?.driving?.remaining || 0) / 11) * 100}
                  className="h-3"
                />
                <p className="text-slate-400 text-xs mt-2">
                  {hos?.limits?.driving?.used || 0}h used of 11h limit
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-300">14-Hour Window</span>
                  </div>
                  <span className="text-white font-bold text-xl">{hos?.onDutyRemaining}h</span>
                </div>
                <Progress
                  value={(parseFloat(hos?.onDutyRemaining || "0") / 14) * 100}
                  className="h-3"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Window ends at {(hos as any)?.windowEnds || "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="text-slate-300">70-Hour Cycle</span>
                  </div>
                  <span className="text-white font-bold text-xl">{hos?.cycleRemaining}h</span>
                </div>
                <Progress
                  value={(hos?.cycleRemaining / 70) * 100}
                  className="h-3"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Resets {hos?.cycleResetDate}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Break Status */}
      <Card className={cn(
        "rounded-xl",
        hos?.breakRequired ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-800/50 border-slate-700/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Coffee className={cn("w-6 h-6", hos?.breakRequired ? "text-yellow-400" : "text-green-400")} />
              <div>
                <p className="text-white font-medium">30-Minute Break</p>
                <p className="text-slate-400 text-sm">
                  {hos?.breakRequired
                    ? `Required - ${hos?.breakDueIn} remaining`
                    : `Next break due after ${hos?.nextBreakAfter} of driving`}
                </p>
              </div>
            </div>
            {hos?.breakRequired && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Break Required
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              HOS Violations ({violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((v: any) => (
                <div key={v.id} className="p-3 rounded-lg bg-slate-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{v.type}</p>
                    <p className="text-slate-400 text-sm">{v.description}</p>
                  </div>
                  <span className="text-slate-500 text-sm">{v.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Log */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Daily Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No log entries for this date</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => {
                const status = dutyStatuses.find(s => s.value === log.status);
                return (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", status?.bg)}>
                      {status && React.createElement(status.icon, { className: cn("w-4 h-4", status.color) })}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{status?.label}</p>
                      {log.location && <p className="text-slate-400 text-sm">{log.location}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white">{log.startTime} - {log.endTime || "Now"}</p>
                      <p className="text-slate-400 text-sm">{log.duration}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
