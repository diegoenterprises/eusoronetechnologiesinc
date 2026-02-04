/**
 * HOS TRACKER PAGE
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
  Clock, AlertTriangle, CheckCircle, Play, Pause,
  Coffee, Moon, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HOSTracker() {
  const hosQuery = trpc.drivers.getMyHOS.useQuery();

  const startDrivingMutation = trpc.drivers.startDriving.useMutation({
    onSuccess: () => { toast.success("Driving started"); hosQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stopDrivingMutation = trpc.drivers.stopDriving.useMutation({
    onSuccess: () => { toast.success("Driving stopped"); hosQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const hos = hosQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving": return "from-green-500/20 to-green-500/10 border-green-500/30";
      case "on_duty": return "from-blue-500/20 to-blue-500/10 border-blue-500/30";
      case "sleeper": return "from-purple-500/20 to-purple-500/10 border-purple-500/30";
      case "off_duty": return "from-slate-500/20 to-slate-500/10 border-slate-500/30";
      default: return "from-slate-500/20 to-slate-500/10 border-slate-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "driving": return <Badge className="bg-green-500/20 text-green-400 border-0">Driving</Badge>;
      case "on_duty": return <Badge className="bg-blue-500/20 text-blue-400 border-0">On Duty</Badge>;
      case "sleeper": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Sleeper</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Off Duty</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            HOS Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hours of Service compliance tracking</p>
        </div>
      </div>

      {/* Current Status */}
      <Card className={cn("bg-gradient-to-r border-2 rounded-xl", getStatusColor(hos?.status || "off_duty"))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-slate-700/50">
                <Clock className="w-10 h-10 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Status</p>
                {hosQuery.isLoading ? <Skeleton className="h-10 w-32" /> : (
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-white capitalize">{hos?.status?.replace("_", " ")}</p>
                    {getStatusBadge(hos?.status || "off_duty")}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {hos?.status === "driving" ? (
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => stopDrivingMutation.mutate()} disabled={stopDrivingMutation.isPending}>
                  {stopDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  Stop Driving
                </Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => startDrivingMutation.mutate()} disabled={startDrivingMutation.isPending}>
                  {startDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Start Driving
                </Button>
              )}
            </div>
          </div>

          {/* HOS Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Driving Time</span>
                {hosQuery.isLoading ? <Skeleton className="h-5 w-16" /> : (
                  <span className="text-white font-bold">{hos?.drivingHours || 0}h / 11h</span>
                )}
              </div>
              <Progress value={((hos?.drivingHours || 0) / 11) * 100} className="h-3" />
              <p className="text-xs text-slate-500 mt-2">{11 - (hos?.drivingHours || 0)}h remaining</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">On-Duty Time</span>
                {hosQuery.isLoading ? <Skeleton className="h-5 w-16" /> : (
                  <span className="text-white font-bold">{hos?.onDutyHours || 0}h / 14h</span>
                )}
              </div>
              <Progress value={((hos?.onDutyHours || 0) / 14) * 100} className="h-3" />
              <p className="text-xs text-slate-500 mt-2">{14 - (hos?.onDutyHours || 0)}h remaining</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">70hr Cycle</span>
                {hosQuery.isLoading ? <Skeleton className="h-5 w-16" /> : (
                  <span className="text-white font-bold">{hos?.cycleHours || 0}h / 70h</span>
                )}
              </div>
              <Progress value={((hos?.cycleHours || 0) / 70) * 100} className="h-3" />
              <p className="text-xs text-slate-500 mt-2">{70 - (hos?.cycleHours || 0)}h remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {hos?.breakRequired && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Coffee className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 font-bold">Break Required</p>
                <p className="text-sm text-slate-400">30-minute break required in {hos.breakDueIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-green-500/20 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium">Driving</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-blue-500/20 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-white font-medium">On Duty</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-purple-500/20 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Moon className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-white font-medium">Sleeper</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-slate-500/20 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-white font-medium">Off Duty</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Today's Log</CardTitle>
        </CardHeader>
        <CardContent>
          {hosQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : hos?.todayLog?.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No log entries today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hos?.todayLog?.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", entry.status === "driving" ? "bg-green-400" : entry.status === "on_duty" ? "bg-blue-400" : entry.status === "sleeper" ? "bg-purple-400" : "bg-slate-400")} />
                    <span className="text-white capitalize">{entry.status?.replace("_", " ")}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">{entry.startTime} - {entry.endTime || "Now"}</p>
                    <p className="text-xs text-slate-500">{entry.duration}</p>
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
