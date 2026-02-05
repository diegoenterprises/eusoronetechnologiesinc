/**
 * SCADA MONITOR PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, Gauge, Thermometer, Droplets, AlertTriangle,
  CheckCircle, RefreshCw, Fuel
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SCADAMonitor() {
  const [selectedTerminal, setSelectedTerminal] = useState("all");

  const terminalsQuery = (trpc as any).terminals.getTerminals.useQuery();
  const racksQuery = (trpc as any).terminals.getRackStatus.useQuery({ terminal: selectedTerminal }, { refetchInterval: 10000 });
  const tanksQuery = (trpc as any).terminals.getTankLevels.useQuery({ terminal: selectedTerminal }, { refetchInterval: 10000 });
  const alertsQuery = (trpc as any).terminals.getActiveAlerts.useQuery({ terminal: selectedTerminal });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-400";
      case "idle": return "text-yellow-400";
      case "maintenance": return "text-orange-400";
      case "offline": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20";
      case "idle": return "bg-yellow-500/20";
      case "maintenance": return "bg-orange-500/20";
      case "offline": return "bg-red-500/20";
      default: return "bg-slate-700/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">SCADA Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time terminal operations</p>
        </div>
        <div className="flex items-center gap-2">
          {terminalsQuery.isLoading ? <Skeleton className="h-10 w-[180px]" /> : (
            <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terminals</SelectItem>
                {(terminalsQuery.data as any)?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => { racksQuery.refetch(); tanksQuery.refetch(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {((alertsQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Active Alerts ({(alertsQuery.data as any)?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(alertsQuery.data as any)?.map((alert: any) => (
              <div key={alert.id} className="p-3 rounded-lg bg-red-500/10 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.location} | {alert.timestamp}</p>
                </div>
                <Badge className={cn("border-0", alert.severity === "critical" ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-400")}>{alert.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400" />Rack Status</CardTitle></CardHeader>
        <CardContent>
          {racksQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (racksQuery.data as any)?.length === 0 ? (
            <div className="text-center py-8"><Gauge className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No racks found</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(racksQuery.data as any)?.map((rack: any) => (
                <div key={rack.id} className={cn("p-4 rounded-xl border", getStatusBg(rack.status), rack.status === "active" ? "border-green-500/30" : rack.status === "offline" ? "border-red-500/30" : "border-slate-600/50")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{rack.name}</p>
                    <div className={cn("w-3 h-3 rounded-full", rack.status === "active" ? "bg-green-400 animate-pulse" : rack.status === "offline" ? "bg-red-400" : "bg-yellow-400")} />
                  </div>
                  <p className={cn("text-sm font-medium capitalize", getStatusColor(rack.status))}>{rack.status}</p>
                  {rack.currentLoad && (
                    <div className="mt-2 text-xs text-slate-500">
                      <p>Load: #{rack.currentLoad}</p>
                      <p>Product: {rack.product}</p>
                    </div>
                  )}
                  {rack.flowRate && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500">Flow Rate</p>
                      <p className="text-white font-medium">{rack.flowRate} GPM</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Fuel className="w-5 h-5 text-purple-400" />Tank Inventory</CardTitle></CardHeader>
        <CardContent>
          {tanksQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          ) : (tanksQuery.data as any)?.length === 0 ? (
            <div className="text-center py-8"><Fuel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No tanks found</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(tanksQuery.data as any)?.map((tank: any) => (
                <div key={tank.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">{tank.name}</p>
                      <p className="text-sm text-slate-400">{tank.product}</p>
                    </div>
                    <Badge className={cn("border-0", tank.level > 75 ? "bg-green-500/20 text-green-400" : tank.level > 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{tank.level}%</Badge>
                  </div>
                  <div className="h-24 bg-slate-800/50 rounded-lg relative overflow-hidden mb-3">
                    <div className={cn("absolute bottom-0 left-0 right-0 transition-all", tank.level > 75 ? "bg-gradient-to-t from-green-500/50 to-green-500/20" : tank.level > 25 ? "bg-gradient-to-t from-yellow-500/50 to-yellow-500/20" : "bg-gradient-to-t from-red-500/50 to-red-500/20")} style={{ height: `${tank.level}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white font-bold text-2xl">{tank.currentVolume?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-400"><Droplets className="w-3 h-3" /><span>Cap: {tank.capacity?.toLocaleString()} gal</span></div>
                    <div className="flex items-center gap-1 text-slate-400"><Thermometer className="w-3 h-3" /><span>{tank.temperature}°F</span></div>
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
