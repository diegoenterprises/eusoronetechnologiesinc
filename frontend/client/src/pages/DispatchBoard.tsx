/**
 * DISPATCH BOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Users, Package, AlertTriangle, MapPin, ArrowRight,
  Clock, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function DispatchBoard() {
  const [, setLocation] = useLocation();

  const summaryQuery = trpc.dispatch.getSummary.useQuery();
  const loadsQuery = trpc.dispatch.getLoads.useQuery({ limit: 20 });
  const driversQuery = trpc.dispatch.getDrivers.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unassigned": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Unassigned</Badge>;
      case "assigned": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Assigned</Badge>;
      case "en_route": return <Badge className="bg-purple-500/20 text-purple-400 border-0">En Route</Badge>;
      case "loading": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Loading</Badge>;
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">In Transit</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Dispatch Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage load assignments and driver dispatch</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => { loadsQuery.refetch(); driversQuery.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.unassigned || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Truck className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.enRoute || 0}</p>
                )}
                <p className="text-xs text-slate-400">En Route</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Package className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inTransit || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.issues || 0}</p>
                )}
                <p className="text-xs text-slate-400">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Loads</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {loadsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : loadsQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No loads to dispatch</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {loadsQuery.data?.map((load: any) => (
                  <div key={load.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", load.status === "unassigned" && "bg-yellow-500/5 border-l-2 border-yellow-500")} onClick={() => setLocation(`/dispatch/load/${load.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber}</p>
                      {getStatusBadge(load.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.origin?.city}</span>
                      <ArrowRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.destination?.city}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{load.pickupDate} • {load.equipmentType}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {driversQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : driversQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No available drivers</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {driversQuery.data?.filter((d: any) => d.status === "available").map((driver: any) => (
                  <div key={driver.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500/20">
                          <Users className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.truckNumber} • HOS: {driver.hosRemaining}h</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
