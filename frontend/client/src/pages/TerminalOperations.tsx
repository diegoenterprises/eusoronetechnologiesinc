/**
 * TERMINAL OPERATIONS PAGE - TERMINAL MANAGER
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Activity, CheckCircle, Clock, AlertTriangle,
  Truck, Package, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalOperations() {
  const [timeframe, setTimeframe] = useState("today");

  const operationsQuery = (trpc as any).terminals.getOperations.useQuery({ timeframe });
  const statsQuery = (trpc as any).terminals.getOperationStats.useQuery({ timeframe });
  const docksQuery = (trpc as any).terminals.getDockStatus.useQuery();

  const stats = statsQuery.data;

  const getDockStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "loading": return "bg-cyan-500";
      case "unloading": return "bg-blue-500";
      case "idle": return "bg-slate-500";
      case "maintenance": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Terminal Operations</h1>
          <p className="text-slate-400 text-sm mt-1">Daily operations overview</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.trucksProcessed || 0}</p>}<p className="text-xs text-slate-400">Processed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.loadsCompleted || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.avgDwellTime}m</p>}<p className="text-xs text-slate-400">Avg Dwell</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Gauge className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.utilization}%</p>}<p className="text-xs text-slate-400">Utilization</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.incidents || 0}</p>}<p className="text-xs text-slate-400">Incidents</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Dock Status</CardTitle></CardHeader>
          <CardContent>
            {docksQuery.isLoading ? (
              <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {(docksQuery.data as any)?.map((dock: any) => (
                  <div key={dock.id} className={cn("p-3 rounded-lg text-center border", dock.status === "active" ? "bg-green-500/10 border-green-500/30" : dock.status === "maintenance" ? "bg-red-500/10 border-red-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                    <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", getDockStatusColor(dock.status))} />
                    <p className="text-white font-bold text-sm">{dock.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{dock.status}</p>
                    {dock.currentLoad && <p className="text-xs text-cyan-400 mt-1">#{dock.currentLoad}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" />Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {statsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">On-Time Departures</span>
                    <span className="text-sm font-bold text-green-400">{stats?.onTimeDepartures}%</span>
                  </div>
                  <Progress value={stats?.onTimeDepartures || 0} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Dock Efficiency</span>
                    <span className="text-sm font-bold text-cyan-400">{stats?.dockEfficiency}%</span>
                  </div>
                  <Progress value={stats?.dockEfficiency || 0} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Labor Utilization</span>
                    <span className="text-sm font-bold text-purple-400">{stats?.laborUtilization}%</span>
                  </div>
                  <Progress value={stats?.laborUtilization || 0} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Safety Score</span>
                    <span className="text-sm font-bold text-yellow-400">{stats?.safetyScore}%</span>
                  </div>
                  <Progress value={stats?.safetyScore || 0} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" />Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {operationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : !operationsQuery.data || (Array.isArray(operationsQuery.data) && operationsQuery.data.length === 0) ? (
            <div className="text-center py-16"><Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No recent activity</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(operationsQuery.data) ? operationsQuery.data : []).map((activity: any) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", activity.type === "arrival" ? "bg-green-500/20" : activity.type === "departure" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                      {activity.type === "arrival" ? <Truck className="w-5 h-5 text-green-400" /> : activity.type === "departure" ? <Truck className="w-5 h-5 text-blue-400" /> : <Package className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">{activity.time}</p>
                    <Badge className={cn("border-0 text-xs", activity.type === "arrival" ? "bg-green-500/20 text-green-400" : activity.type === "departure" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400")}>{activity.type}</Badge>
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
