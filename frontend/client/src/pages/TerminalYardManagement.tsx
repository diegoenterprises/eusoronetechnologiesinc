/**
 * TERMINAL YARD MANAGEMENT PAGE
 * 100% Dynamic - Manage yard operations and trailer positions
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
  Container, Search, MapPin, Truck, Clock,
  MoveRight, AlertTriangle, CheckCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalYardManagement() {
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const yardQuery = trpc.terminals.getYardStatus.useQuery({ zone: zoneFilter, status: statusFilter });
  const statsQuery = trpc.terminals.getYardStats.useQuery();
  const zonesQuery = trpc.terminals.getYardZones.useQuery();

  const moveTrailerMutation = trpc.terminals.moveTrailer.useMutation({
    onSuccess: () => {
      toast.success("Trailer moved");
      yardQuery.refetch();
      statsQuery.refetch();
    },
  });

  const trailers = yardQuery.data || [];
  const stats = statsQuery.data;
  const zones = zonesQuery.data || [];

  const filteredTrailers = trailers.filter((t: any) =>
    t.trailerNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.spotNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.carrierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Yard Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage yard operations and trailer positions</p>
        </div>
        <Button
          variant="outline"
          onClick={() => yardQuery.refetch()}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {statsQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Container className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Spots</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalSpots || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Available</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.availableSpots || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Container className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Occupied</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats?.occupiedSpots || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pendingMoves || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">At Doors</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.atDoors || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-400 text-sm">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-orange-400">{stats?.overdue || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Zone Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            Zone Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zonesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zones.map((zone: any) => (
                <div key={zone.id} className={cn(
                  "p-4 rounded-lg border",
                  zone.utilization > 90 ? "bg-red-500/10 border-red-500/30" :
                  zone.utilization > 75 ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-slate-700/30 border-slate-600/50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{zone.name}</p>
                    <Badge className={cn(
                      "border-0 text-xs",
                      zone.utilization > 90 ? "bg-red-500/20 text-red-400" :
                      zone.utilization > 75 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    )}>
                      {zone.utilization}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Occupied</span>
                    <span className="text-white">{zone.occupied}/{zone.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-400">Available</span>
                    <span className="text-green-400">{zone.available}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trailers or spots..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((z: any) => (
                  <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
                <SelectItem value="at_door">At Door</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trailers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yardQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredTrailers.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Container className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No trailers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTrailers.map((trailer: any) => (
            <Card key={trailer.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              trailer.isOverdue && "border-l-4 border-orange-500"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      trailer.status === "loaded" ? "bg-blue-500/20" :
                      trailer.status === "empty" ? "bg-slate-600/50" :
                      trailer.status === "at_door" ? "bg-purple-500/20" :
                      "bg-yellow-500/20"
                    )}>
                      <Container className={cn(
                        "w-5 h-5",
                        trailer.status === "loaded" ? "text-blue-400" :
                        trailer.status === "empty" ? "text-slate-400" :
                        trailer.status === "at_door" ? "text-purple-400" :
                        "text-yellow-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{trailer.trailerNumber}</p>
                      <p className="text-slate-400 text-sm">{trailer.carrierName}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0 text-xs",
                    trailer.status === "loaded" ? "bg-blue-500/20 text-blue-400" :
                    trailer.status === "empty" ? "bg-slate-500/20 text-slate-400" :
                    trailer.status === "at_door" ? "bg-purple-500/20 text-purple-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {trailer.status?.replace("_", " ")}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Spot:</span>
                    <span className="text-white font-medium">{trailer.spotNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Zone:</span>
                    <span className="text-white">{trailer.zoneName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Arrived:</span>
                    <span className="text-white">{trailer.arrivedAt}</span>
                  </div>
                  {trailer.dwellTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Dwell Time:</span>
                      <span className={cn(
                        "font-medium",
                        trailer.isOverdue ? "text-orange-400" : "text-white"
                      )}>
                        {trailer.dwellTime}
                      </span>
                    </div>
                  )}
                </div>

                {trailer.loadInfo && (
                  <div className="p-2 rounded-lg bg-slate-700/30 text-sm mb-3">
                    <p className="text-slate-400 text-xs mb-1">Load Info:</p>
                    <p className="text-white">{trailer.loadInfo}</p>
                  </div>
                )}

                {trailer.isOverdue && (
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm">Exceeded dwell time</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Select onValueChange={(spot) => moveTrailerMutation.mutate({ trailerId: trailer.id, toSpot: spot })}>
                    <SelectTrigger className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg text-sm">
                      <SelectValue placeholder="Move to spot..." />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.flatMap((z: any) => 
                        z.availableSpots?.map((s: string) => (
                          <SelectItem key={s} value={s}>{z.name} - {s}</SelectItem>
                        )) || []
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400"
                  >
                    <MoveRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
