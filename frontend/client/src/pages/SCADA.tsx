/**
 * SCADA PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, Gauge, Thermometer, Droplets, AlertTriangle,
  CheckCircle, Power, Settings, RefreshCw, TrendingUp,
  TrendingDown, Clock, Zap, Eye, Bell, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SCADA() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTerminal, setSelectedTerminal] = useState<string>("all");
  const [refreshInterval, setRefreshInterval] = useState(30);

  const terminalsQuery = (trpc as any).scada.getTerminals.useQuery();
  const overviewQuery = (trpc as any).scada.getOverview.useQuery({ terminalId: selectedTerminal !== "all" ? selectedTerminal : undefined }, { refetchInterval: refreshInterval * 1000 });
  const tanksQuery = (trpc as any).scada.getTanks.useQuery({ terminalId: selectedTerminal !== "all" ? selectedTerminal : undefined }, { refetchInterval: refreshInterval * 1000 });
  const alarmsQuery = (trpc as any).scada.getAlarms.useQuery({ terminalId: selectedTerminal !== "all" ? selectedTerminal : "all" }, { refetchInterval: refreshInterval * 1000 });
  const historyQuery = (trpc as any).scada.getAlarms.useQuery({ terminalId: selectedTerminal !== "all" ? selectedTerminal : "all" });

  const acknowledgeAlarmMutation = (trpc as any).scada.acknowledgeAlarm.useMutation({
    onSuccess: () => { toast.success("Alarm acknowledged"); alarmsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (overviewQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading SCADA data</p>
        <Button className="mt-4" onClick={() => overviewQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const overview = overviewQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500/20 text-green-400";
      case "offline": return "bg-red-500/20 text-red-400";
      case "warning": return "bg-yellow-500/20 text-yellow-400";
      case "maintenance": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getTankLevelColor = (level: number) => {
    if (level >= 80) return "text-green-400";
    if (level >= 50) return "text-blue-400";
    if (level >= 25) return "text-yellow-400";
    return "text-red-400";
  };

  const getAlarmSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SCADA Monitoring</h1>
          <p className="text-slate-400 text-sm">Real-time terminal and tank monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600">
              <SelectValue placeholder="All Terminals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terminals</SelectItem>
              {(terminalsQuery.data as any)?.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={refreshInterval.toString()} onValueChange={(v: any) => setRefreshInterval(parseInt(v))}>
            <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sec</SelectItem>
              <SelectItem value="30">30 sec</SelectItem>
              <SelectItem value="60">1 min</SelectItem>
              <SelectItem value="300">5 min</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600" onClick={() => { overviewQuery.refetch(); tanksQuery.refetch(); alarmsQuery.refetch(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Active Alarms Banner */}
      {alarmsQuery.data && (alarmsQuery.data as any)?.alarms?.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                <div>
                  <p className="text-red-400 font-bold">{(alarmsQuery.data as any)?.alarms?.length} Active Alarm{(alarmsQuery.data as any)?.alarms?.length > 1 ? "s" : ""}</p>
                  <p className="text-sm text-slate-400">{(alarmsQuery.data as any)?.alarms?.filter((a: any) => a.severity === "critical").length} critical</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-red-500/50 text-red-400">View All</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Power className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {overviewQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{overview?.terminalsOnline || 0}</p>
            )}
            <p className="text-xs text-slate-400">Terminals Online</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Droplets className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {overviewQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{overview?.totalTanks || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Tanks</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Gauge className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {overviewQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{overview?.totalInventory?.toLocaleString() || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Gallons</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {overviewQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{overview?.activeFlows || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Flows</p>
          </CardContent>
        </Card>
        <Card className={cn("border-slate-700", ((alarmsQuery.data as any)?.alarms?.length || 0) > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30")}>
          <CardContent className="p-4 text-center">
            <Bell className={cn("w-6 h-6 mx-auto mb-2", ((alarmsQuery.data as any)?.alarms?.length || 0) > 0 ? "text-red-400" : "text-green-400")} />
            {alarmsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className={cn("text-2xl font-bold", ((alarmsQuery.data as any)?.alarms?.length || 0) > 0 ? "text-red-400" : "text-green-400")}>{(alarmsQuery.data as any)?.alarms?.length || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Alarms</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="tanks" className="data-[state=active]:bg-blue-600">Tanks</TabsTrigger>
          <TabsTrigger value="alarms" className="data-[state=active]:bg-blue-600">Alarms ({(alarmsQuery.data as any)?.alarms?.length || 0})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {terminalsQuery.isLoading ? (
              [1, 2].map((i: any) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>)
            ) : (
              (terminalsQuery.data as any)?.map((terminal: any) => (
                <Card key={terminal.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{terminal.name}</CardTitle>
                      <Badge className={getStatusColor(terminal.status)}>{terminal.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-slate-700/30">
                        <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                        <p className="text-lg font-bold text-white">{terminal.tankCount}</p>
                        <p className="text-xs text-slate-500">Tanks</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-700/30">
                        <Gauge className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                        <p className="text-lg font-bold text-white">{terminal.avgLevel}%</p>
                        <p className="text-xs text-slate-500">Avg Level</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-700/30">
                        <Activity className="w-5 h-5 mx-auto mb-1 text-green-400" />
                        <p className="text-lg font-bold text-white">{terminal.activeFlows}</p>
                        <p className="text-xs text-slate-500">Active Flows</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Last Update: {terminal.lastUpdate}</span>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" />Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tanks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanksQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i: any) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>)
            ) : (tanksQuery.data as any)?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Droplets className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No tanks found</p>
              </div>
            ) : (
              (tanksQuery.data as any)?.map((tank: any) => (
                <Card key={tank.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-bold">{tank.name}</p>
                        <p className="text-xs text-slate-500">{tank.product}</p>
                      </div>
                      <Badge className={getStatusColor(tank.status)}>{tank.status}</Badge>
                    </div>

                    <div className="relative h-24 bg-slate-700/50 rounded-lg overflow-hidden mb-3">
                      <div
                        className={cn("absolute bottom-0 left-0 right-0 transition-all", tank.level >= 80 ? "bg-green-500/50" : tank.level >= 50 ? "bg-blue-500/50" : tank.level >= 25 ? "bg-yellow-500/50" : "bg-red-500/50")}
                        style={{ height: `${tank.level}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className={cn("text-3xl font-bold", getTankLevelColor(tank.level))}>{tank.level}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">{tank.volume?.toLocaleString()} gal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">{tank.temperature}°F</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alarms" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Active Alarms</CardTitle></CardHeader>
            <CardContent>
              {alarmsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (alarmsQuery.data as any)?.alarms?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No active alarms</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(alarmsQuery.data as any)?.alarms?.map((alarm: any) => (
                    <div key={alarm.id} className={cn("flex items-center justify-between p-4 rounded-lg border", getAlarmSeverityColor(alarm.severity))}>
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={cn("w-6 h-6", alarm.severity === "critical" ? "text-red-400 animate-pulse" : "text-yellow-400")} />
                        <div>
                          <p className="text-white font-medium">{alarm.message}</p>
                          <p className="text-sm text-slate-400">{alarm.source} - {alarm.terminal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={getAlarmSeverityColor(alarm.severity)}>{alarm.severity}</Badge>
                          <p className="text-xs text-slate-500 mt-1">{alarm.timestamp}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-slate-600" onClick={() => acknowledgeAlarmMutation.mutate({ alarmId: alarm.id })} disabled={acknowledgeAlarmMutation.isPending}>
                          {acknowledgeAlarmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Acknowledge"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Alarm History</CardTitle></CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (historyQuery.data as any)?.alarms?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No alarm history</p>
              ) : (
                <div className="space-y-2">
                  {(historyQuery.data as any)?.alarms?.map((alarm: any) => (
                    <div key={alarm.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", alarm.severity === "critical" ? "bg-red-500" : alarm.severity === "high" ? "bg-orange-500" : "bg-yellow-500")} />
                        <div>
                          <p className="text-white">{alarm.message}</p>
                          <p className="text-xs text-slate-500">{alarm.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={(alarm as any).resolved ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                          {(alarm as any).resolved ? "Resolved" : "Acknowledged"}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{alarm.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
