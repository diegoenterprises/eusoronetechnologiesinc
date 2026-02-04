/**
 * TERMINAL WEIGH SCALES PAGE
 * 100% Dynamic - Manage terminal weigh scale operations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Scale, Search, CheckCircle, AlertTriangle, Truck,
  Clock, FileText, RefreshCw, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalWeighScales() {
  const [search, setSearch] = useState("");
  const [scaleFilter, setScaleFilter] = useState("all");

  const scalesQuery = trpc.terminals.getBays.useQuery();
  const weightsQuery = trpc.terminals.getAppointments.useQuery({});
  const statsQuery = trpc.terminals.getStats.useQuery();

  const recordWeightMutation = trpc.terminals.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Weight recorded");
      weightsQuery.refetch();
    },
  });

  const scales = scalesQuery.data || [];
  const weights = weightsQuery.data || [];
  const stats = statsQuery.data;

  const filteredWeights = weights.filter((w: any) =>
    w.truckNumber?.toLowerCase().includes(search.toLowerCase()) ||
    w.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "within_limit": return "bg-green-500/20 text-green-400";
      case "overweight": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Weigh Scales
          </h1>
          <p className="text-slate-400 text-sm mt-1">Terminal weight management</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Scale className="w-4 h-4 mr-2" />Record Weight
        </Button>
      </div>

      {/* Scale Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scalesQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          scales.map((scale: any) => (
            <Card key={scale.id} className={cn(
              "rounded-xl border",
              scale.status === "online" ? "bg-green-500/10 border-green-500/30" :
              scale.status === "offline" ? "bg-red-500/10 border-red-500/30" :
              "bg-slate-800/50 border-slate-700/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scale className={cn(
                      "w-5 h-5",
                      scale.status === "online" ? "text-green-400" : "text-red-400"
                    )} />
                    <span className="text-white font-medium">{scale.name}</span>
                  </div>
                  <Badge className={cn(
                    "border-0 text-xs",
                    scale.status === "online" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {scale.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Current</span>
                    <span className="text-white font-bold">{scale.currentReading?.toLocaleString() || 0} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Capacity</span>
                    <span className="text-slate-300">{scale.capacity?.toLocaleString()} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Last Cal</span>
                    <span className="text-slate-300">{scale.lastCalibration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Weighed Today</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.weighedToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Within Limit</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.withinLimit || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Overweight</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.overweight || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Weight</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.avgWeight?.toLocaleString() || 0} lbs</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by truck or driver..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={scaleFilter} onValueChange={setScaleFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scales</SelectItem>
                {scales.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weight Records */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Recent Weights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weightsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredWeights.length === 0 ? (
            <div className="text-center py-16">
              <Scale className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No weight records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredWeights.map((weight: any) => (
                <div key={weight.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        weight.status === "within_limit" ? "bg-green-500/20" :
                        weight.status === "overweight" ? "bg-red-500/20" : "bg-yellow-500/20"
                      )}>
                        <Truck className={cn(
                          "w-6 h-6",
                          weight.status === "within_limit" ? "text-green-400" :
                          weight.status === "overweight" ? "text-red-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{weight.truckNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(weight.status))}>
                            {weight.status === "within_limit" ? "OK" : weight.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{weight.driverName} • {weight.carrierName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Gross</p>
                        <p className="text-white font-bold">{weight.grossWeight?.toLocaleString()} lbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Tare</p>
                        <p className="text-slate-300">{weight.tareWeight?.toLocaleString()} lbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Net</p>
                        <p className={cn(
                          "font-bold",
                          weight.status === "overweight" ? "text-red-400" : "text-green-400"
                        )}>
                          {weight.netWeight?.toLocaleString()} lbs
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Time</p>
                        <p className="text-slate-300">{weight.timestamp}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Scale</p>
                        <p className="text-slate-300">{weight.scaleName}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {weight.status === "overweight" && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Over by {weight.overweightAmount?.toLocaleString()} lbs - Requires adjustment
                      </p>
                    </div>
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
