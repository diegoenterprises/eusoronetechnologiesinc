/**
 * HOS TRACKER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, Play, Pause, Coffee, Moon, AlertTriangle,
  CheckCircle, MapPin, Truck, Calendar, Activity,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HOSTracker() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const statusQuery = trpc.hos.getCurrentStatus.useQuery({});
  const limitsQuery = trpc.hos.getLimits.useQuery({});
  const todayLogQuery = trpc.hos.getTodayLog.useQuery({});

  const changeStatusMutation = trpc.hos.changeStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); statusQuery.refetch(); todayLogQuery.refetch(); },
    onError: (error) => toast.error("Failed to update status", { description: error.message }),
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (statusQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading HOS data</p>
        <Button className="mt-4" onClick={() => statusQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const status = statusQuery.data;
  const limits = limitsQuery.data;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "driving": return "bg-green-500";
      case "on_duty": return "bg-blue-500";
      case "sleeper": return "bg-purple-500";
      case "off_duty": return "bg-slate-500";
      default: return "bg-slate-500";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "driving": return <Truck className="w-6 h-6" />;
      case "on_duty": return <Clock className="w-6 h-6" />;
      case "sleeper": return <Moon className="w-6 h-6" />;
      case "off_duty": return <Coffee className="w-6 h-6" />;
      default: return <Clock className="w-6 h-6" />;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    changeStatusMutation.mutate({ status: newStatus });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">HOS Tracker</h1>
          <p className="text-slate-400 text-sm">Hours of Service - Real-time tracking</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono text-white">{currentTime.toLocaleTimeString()}</p>
          <p className="text-sm text-slate-400">{currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Current Status Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {statusQuery.isLoading ? (
                <Skeleton className="w-20 h-20 rounded-full" />
              ) : (
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-white", getStatusColor(status?.currentStatus || ""))}>
                  {getStatusIcon(status?.currentStatus || "")}
                </div>
              )}
              <div>
                {statusQuery.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-6 w-48" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white capitalize">{status?.currentStatus?.replace("_", " ")}</h2>
                    <p className="text-slate-400">Since {status?.statusSince}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />{status?.currentLocation}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Status Buttons */}
            <div className="flex gap-2">
              <Button
                className={cn("flex-col h-16 w-16", status?.currentStatus === "driving" ? "bg-green-600" : "bg-slate-700 hover:bg-green-600")}
                onClick={() => handleStatusChange("driving")}
                disabled={changeStatusMutation.isPending}
              >
                <Truck className="w-5 h-5" />
                <span className="text-xs">Drive</span>
              </Button>
              <Button
                className={cn("flex-col h-16 w-16", status?.currentStatus === "on_duty" ? "bg-blue-600" : "bg-slate-700 hover:bg-blue-600")}
                onClick={() => handleStatusChange("on_duty")}
                disabled={changeStatusMutation.isPending}
              >
                <Clock className="w-5 h-5" />
                <span className="text-xs">On Duty</span>
              </Button>
              <Button
                className={cn("flex-col h-16 w-16", status?.currentStatus === "sleeper" ? "bg-purple-600" : "bg-slate-700 hover:bg-purple-600")}
                onClick={() => handleStatusChange("sleeper")}
                disabled={changeStatusMutation.isPending}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Sleeper</span>
              </Button>
              <Button
                className={cn("flex-col h-16 w-16", status?.currentStatus === "off_duty" ? "bg-slate-600" : "bg-slate-700 hover:bg-slate-600")}
                onClick={() => handleStatusChange("off_duty")}
                disabled={changeStatusMutation.isPending}
              >
                <Coffee className="w-5 h-5" />
                <span className="text-xs">Off Duty</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HOS Limits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {limitsQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card className={cn("border-slate-700", (limits?.driving?.remaining || 0) < 60 ? "bg-red-500/10 border-red-500/30" : "bg-slate-800/50")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">11-Hour Driving</span>
                  <span className={cn("font-bold", (limits?.driving?.remaining || 0) < 60 ? "text-red-400" : "text-green-400")}>
                    {formatDuration(limits?.driving?.remaining || 0)}
                  </span>
                </div>
                <Progress value={((limits?.driving?.used || 0) / 660) * 100} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{formatDuration(limits?.driving?.used || 0)} used</p>
              </CardContent>
            </Card>

            <Card className={cn("border-slate-700", (limits?.window?.remaining || 0) < 60 ? "bg-red-500/10 border-red-500/30" : "bg-slate-800/50")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">14-Hour Window</span>
                  <span className={cn("font-bold", (limits?.window?.remaining || 0) < 60 ? "text-red-400" : "text-blue-400")}>
                    {formatDuration(limits?.window?.remaining || 0)}
                  </span>
                </div>
                <Progress value={((limits?.window?.used || 0) / 840) * 100} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{formatDuration(limits?.window?.used || 0)} used</p>
              </CardContent>
            </Card>

            <Card className={cn("border-slate-700", limits?.breakRequired ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-800/50")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">30-Min Break</span>
                  <span className={cn("font-bold", limits?.breakRequired ? "text-yellow-400" : "text-green-400")}>
                    {limits?.breakRequired ? "Required" : "OK"}
                  </span>
                </div>
                <Progress value={limits?.breakRequired ? 100 : 0} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{limits?.timeSinceBreak ? `${formatDuration(limits.timeSinceBreak)} since break` : "Break taken"}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">70-Hour Cycle</span>
                  <span className="text-purple-400 font-bold">{formatDuration(limits?.cycle?.remaining || 0)}</span>
                </div>
                <Progress value={((limits?.cycle?.used || 0) / 4200) * 100} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{formatDuration(limits?.cycle?.used || 0)} used (8 days)</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Today's Log */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Today's Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Graph Placeholder */}
          <div className="h-32 bg-slate-700/30 rounded-lg mb-4 relative overflow-hidden">
            <div className="absolute inset-0 flex">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 border-r border-slate-600/30 relative">
                  {i % 4 === 0 && <span className="absolute bottom-0 left-0 text-xs text-slate-500">{i}:00</span>}
                </div>
              ))}
            </div>
            {/* Status bars would be rendered here based on todayLogQuery.data */}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-500" /><span className="text-sm text-slate-400">Off Duty</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500" /><span className="text-sm text-slate-400">Sleeper</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /><span className="text-sm text-slate-400">Driving</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500" /><span className="text-sm text-slate-400">On Duty</span></div>
          </div>

          {/* Log Entries */}
          {todayLogQuery.isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : todayLogQuery.data?.entries?.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No log entries today</p>
          ) : (
            <div className="space-y-2">
              {todayLogQuery.data?.entries?.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(entry.status))} />
                    <div>
                      <p className="text-white capitalize">{entry.status?.replace("_", " ")}</p>
                      <p className="text-xs text-slate-500">{entry.startTime} - {entry.endTime || "Current"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">{formatDuration(entry.duration)}</span>
                    {entry.location && <span className="text-sm text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{entry.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {todayLogQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{formatDuration(todayLogQuery.data?.summary?.driving || 0)}</p>
            )}
            <p className="text-xs text-slate-400">Driving Today</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {todayLogQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{formatDuration(todayLogQuery.data?.summary?.onDuty || 0)}</p>
            )}
            <p className="text-xs text-slate-400">On Duty Today</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {todayLogQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{formatDuration(todayLogQuery.data?.summary?.sleeper || 0)}</p>
            )}
            <p className="text-xs text-slate-400">Sleeper Today</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {todayLogQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-slate-400">{formatDuration(todayLogQuery.data?.summary?.offDuty || 0)}</p>
            )}
            <p className="text-xs text-slate-400">Off Duty Today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
