/**
 * CATALYST LOAD BOARD PAGE
 * 100% Dynamic - Real-time load board for dispatchers
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
  Package, Search, MapPin, Clock, DollarSign,
  Truck, AlertTriangle, RefreshCw, Filter, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystLoadBoard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const loadsQuery = (trpc as any).catalysts.getMatchedLoads.useQuery({});
  const statsQuery = (trpc as any).catalysts.getPerformanceStats.useQuery();

  const assignMutation = (trpc as any).catalysts.assignDriver.useMutation({
    onSuccess: () => {
      toast.success("Load assigned");
      loadsQuery.refetch();
    },
  });

  const loads = loadsQuery.data || [];
  const stats = statsQuery.data;

  const filteredLoads = loads.filter((l: any) =>
    l.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.origin?.toLowerCase().includes(search.toLowerCase()) ||
    l.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "assigned": return "bg-cyan-500/20 text-cyan-400";
      case "in_transit": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "normal": return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Load Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time load management</p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadsQuery.refetch()}
          className="bg-slate-800/50 border-slate-700/50 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loadsQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || stats?.loadsCompleted || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Urgent</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.urgent || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Unassigned</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.unassigned || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">In Transit</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.inTransit || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">${(stats as any)?.totalRevenue?.toLocaleString() || stats?.totalEarnings?.toLocaleString() || 0}</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="van">Dry Van</SelectItem>
                <SelectItem value="reefer">Reefer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Load List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads.map((load: any) => (
                <div key={load.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  load.priority === "urgent" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        load.status === "available" ? "bg-green-500/20" :
                        load.status === "in_transit" ? "bg-purple-500/20" : "bg-yellow-500/20"
                      )}>
                        <Package className={cn(
                          "w-6 h-6",
                          load.status === "available" ? "text-green-400" :
                          load.status === "in_transit" ? "text-purple-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{load.loadNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(load.status))}>
                            {load.status.replace("_", " ")}
                          </Badge>
                          <Badge className={cn("border", getPriorityColor(load.priority))}>
                            {load.priority}
                          </Badge>
                          {load.hazmat && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />Hazmat
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-green-400" />
                          <span>{load.origin}</span>
                          <span className="text-slate-600">→</span>
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>{load.destination}</span>
                          <span className="text-slate-600">•</span>
                          <span>{load.distance} mi</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Equipment</p>
                        <p className="text-white">{load.equipment}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pickup</p>
                        <p className={cn(
                          load.pickupUrgent ? "text-red-400" : "text-white"
                        )}>
                          {load.pickupDate}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rate</p>
                        <p className="text-green-400 font-bold">${load.rate?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">$/Mile</p>
                        <p className="text-white">${load.ratePerMile?.toFixed(2)}</p>
                      </div>
                      {load.status === "available" && (
                        <Button
                          size="sm"
                          onClick={() => assignMutation.mutate({ loadId: load.id, driverId: "" } as any)}
                          className="bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                        >
                          Assign
                        </Button>
                      )}
                      {load.assignedDriver && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Driver</p>
                          <p className="text-white">{load.assignedDriver}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {load.aiSuggestion && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">ESANG: {load.aiSuggestion}</span>
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
