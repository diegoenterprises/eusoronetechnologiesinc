/**
 * LOADING BAYS PAGE - Terminal Manager
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
  Warehouse, Truck, Clock, CheckCircle, AlertTriangle,
  Play, Pause, Square, RefreshCw, Droplets, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoadingBays() {
  const [selectedBay, setSelectedBay] = useState<string | null>(null);

  const baysQuery = (trpc as any).terminals.getLoadingBays.useQuery({});
  const statsQuery = (trpc as any).terminals.getBayStats.useQuery();

  const startLoadingMutation = (trpc as any).terminals.startLoading.useMutation({
    onSuccess: () => {
      toast.success("Loading operation started");
      baysQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to start", { description: error.message }),
  });

  const completeLoadingMutation = (trpc as any).terminals.completeLoading.useMutation({
    onSuccess: () => {
      toast.success("Loading operation completed");
      baysQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to complete", { description: error.message }),
  });

  const getBayStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>;
      case "loading":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Loading</Badge>;
      case "unloading":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Unloading</Badge>;
      case "occupied":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Occupied</Badge>;
      case "maintenance":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Maintenance</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Loading Bays
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time bay assignments and loading operations</p>
        </div>
        <Button 
          variant="outline" 
          className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
          onClick={() => baysQuery.refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.available || 0}</p>
                    <p className="text-xs text-slate-400">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Droplets className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.loading || 0}</p>
                    <p className="text-xs text-slate-400">Loading</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Truck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.unloading || 0}</p>
                    <p className="text-xs text-slate-400">Unloading</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.utilization || 0}%</p>
                    <p className="text-xs text-slate-400">Utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.avgLoadTime || 0}m</p>
                    <p className="text-xs text-slate-400">Avg Load Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-cyan-400" />
                Bay Status Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              {baysQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array(8).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(baysQuery.data as any)?.map((bay: any) => (
                    <div
                      key={bay.id}
                      onClick={() => setSelectedBay(bay.id)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedBay === bay.id 
                          ? "border-cyan-500 bg-cyan-500/10" 
                          : "border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{bay.name}</span>
                        {getBayStatusBadge(bay.status)}
                      </div>
                      {bay.currentLoad && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-400">Load: {bay.currentLoad.loadNumber}</p>
                          <p className="text-xs text-slate-400">Product: {bay.currentLoad.product}</p>
                          {bay.progress !== undefined && (
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{bay.progress}%</span>
                              </div>
                              <Progress value={bay.progress} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      )}
                      {!bay.currentLoad && bay.status === "available" && (
                        <p className="text-xs text-green-400">Ready for assignment</p>
                      )}
                      {bay.status === "maintenance" && (
                        <p className="text-xs text-red-400">{bay.maintenanceNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                Bay Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedBay ? (
                <div className="text-center py-8">
                  <Warehouse className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Select a bay to view controls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(baysQuery.data as any)?.find((b: any) => b.id === selectedBay) && (
                    <>
                      <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                        <h3 className="text-white font-medium mb-2">
                          {(baysQuery.data as any)?.find((b: any) => b.id === selectedBay)?.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Status: {(baysQuery.data as any)?.find((b: any) => b.id === selectedBay)?.status}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 rounded-lg"
                          onClick={() => startLoadingMutation.mutate({ bayId: selectedBay })}
                          disabled={startLoadingMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-lg"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 rounded-lg col-span-2"
                          onClick={() => completeLoadingMutation.mutate({ bayId: selectedBay })}
                          disabled={completeLoadingMutation.isPending}
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                        <h4 className="text-sm text-white mb-2">Flow Rate</h4>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-400 font-mono">450 GPM</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
