/**
 * RACK STATUS PAGE (Terminal)
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
  Fuel, Activity, CheckCircle, AlertTriangle, Wrench,
  RefreshCw, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RackStatus() {
  const racksQuery = trpc.terminal.getRacks.useQuery();
  const summaryQuery = trpc.terminal.getRackSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>;
      case "in_use": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Use</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Maintenance</Badge>;
      case "offline": return <Badge className="bg-red-500/20 text-red-400 border-0">Offline</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 border-green-500/30";
      case "in_use": return "bg-blue-500/20 border-blue-500/30";
      case "maintenance": return "bg-yellow-500/20 border-yellow-500/30";
      case "offline": return "bg-red-500/20 border-red-500/30";
      default: return "bg-slate-500/20 border-slate-500/30";
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => racksQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Fuel className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalRacks || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Racks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.available || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inUse || 0}</p>
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
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.maintenance || 0}</p>
                )}
                <p className="text-xs text-slate-400">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Racks Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Loading Racks</CardTitle>
        </CardHeader>
        <CardContent>
          {racksQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : racksQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Fuel className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No racks configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {racksQuery.data?.map((rack: any) => (
                <Card key={rack.id} className={cn("border-2 rounded-xl transition-all hover:scale-105", getStatusColor(rack.status))}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold text-lg">{rack.name}</p>
                      {getStatusBadge(rack.status)}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Product</p>
                        <p className="text-white">{rack.productType || "N/A"}</p>
                      </div>
                      
                      {rack.status === "in_use" && rack.currentLoad && (
                        <>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Current Load</p>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-cyan-400" />
                              <p className="text-white text-sm">{rack.currentLoad.truckNumber}</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Progress</span>
                              <span className="text-white">{rack.currentLoad.progress}%</span>
                            </div>
                            <Progress value={rack.currentLoad.progress} className="h-2" />
                          </div>
                        </>
                      )}
                      
                      {rack.status === "available" && (
                        <div className="pt-2">
                          <p className="text-green-400 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Ready for loading
                          </p>
                        </div>
                      )}
                      
                      {rack.status === "maintenance" && (
                        <div className="pt-2">
                          <p className="text-yellow-400 text-sm flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {rack.maintenanceReason || "Under maintenance"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tank Inventory */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Tank Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {racksQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {summary?.tanks?.map((tank: any) => (
                <div key={tank.id} className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{tank.name}</p>
                      <p className="text-sm text-slate-400">{tank.productType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{(tank.currentLevel || 0).toLocaleString()} gal</p>
                      <p className="text-xs text-slate-500">of {(tank.capacity || 0).toLocaleString()} gal</p>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", tank.levelPercent > 75 ? "bg-green-500" : tank.levelPercent > 25 ? "bg-yellow-500" : "bg-red-500")} 
                      style={{ width: `${tank.levelPercent || 0}%` }} 
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{tank.levelPercent || 0}% full</p>
                </div>
              )) || <p className="text-slate-400 text-center py-4">No tank data available</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
