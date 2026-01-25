/**
 * RACK STATUS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gauge, Droplets, AlertTriangle, CheckCircle,
  Clock, MapPin, RefreshCw, Thermometer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RackStatus() {
  const [selectedTerminal, setSelectedTerminal] = useState("all");

  const racksQuery = trpc.terminal.getRackStatus.useQuery({ terminalId: selectedTerminal === "all" ? undefined : selectedTerminal }, { refetchInterval: 30000 });
  const terminalsQuery = trpc.terminal.getTerminals.useQuery();
  const statsQuery = trpc.terminal.getRackStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case "in_use": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />In Use</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case "offline": return <Badge className="bg-red-500/20 text-red-400 border-0">Offline</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Rack Status
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time loading rack monitoring</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <MapPin className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terminals</SelectItem>
              {terminalsQuery.data?.map((terminal: any) => (
                <SelectItem key={terminal.id} value={terminal.id}>{terminal.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => racksQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.available || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Droplets className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.inUse || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.maintenance || 0}</p>
                )}
                <p className="text-xs text-slate-400">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Gauge className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.utilization}%</p>
                )}
                <p className="text-xs text-slate-400">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Racks Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Loading Racks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {racksQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          ) : racksQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <Gauge className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No racks found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {racksQuery.data?.map((rack: any) => (
                <div key={rack.id} className={cn("p-4 rounded-xl border transition-colors", rack.status === "available" ? "bg-green-500/5 border-green-500/30" : rack.status === "in_use" ? "bg-blue-500/5 border-blue-500/30" : rack.status === "maintenance" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold">{rack.name}</p>
                    {getStatusBadge(rack.status)}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{rack.terminalName}</p>

                  {rack.status === "in_use" && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-cyan-400">{rack.loadProgress}%</span>
                      </div>
                      <Progress value={rack.loadProgress} className="h-2" />
                      <p className="text-xs text-slate-500">{rack.currentCarrier}</p>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3 h-3" />
                      <span>{rack.product || "Multi-product"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-3 h-3" />
                      <span>{rack.temperature || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{rack.lastActivity}</span>
                    </div>
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
