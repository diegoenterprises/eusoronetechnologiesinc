/**
 * GPS TRACKING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Navigation, Truck, Clock, RefreshCw,
  CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GPSTracking() {
  const [filter, setFilter] = useState("all");

  const vehiclesQuery = (trpc as any).fleet.getGPSLocations.useQuery({ filter }, { refetchInterval: 30000 });
  const statsQuery = (trpc as any).fleet.getGPSStats.useQuery({}, { refetchInterval: 30000 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "moving": return <Badge className="bg-green-500/20 text-green-400 border-0"><Navigation className="w-3 h-3 mr-1" />Moving</Badge>;
      case "stopped": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Stopped</Badge>;
      case "idle": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Idle</Badge>;
      case "offline": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Offline</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">GPS Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time fleet location</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => vehiclesQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Tracked</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Navigation className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.moving || 0}</p>}<p className="text-xs text-slate-400">Moving</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.stopped || 0}</p>}<p className="text-xs text-slate-400">Stopped</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.offline || 0}</p>}<p className="text-xs text-slate-400">Offline</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-2 h-[500px]">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Fleet Map</CardTitle></CardHeader>
          <CardContent className="h-[420px] flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Map integration placeholder</p>
              <p className="text-sm text-slate-500 mt-1">Real-time GPS updates every 30 seconds</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[500px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-green-400" />Vehicles</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[100px] bg-slate-700/50 border-slate-600/50 rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="moving">Moving</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[420px] overflow-y-auto">
            {vehiclesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (vehiclesQuery.data as any)?.length === 0 ? (
              <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No vehicles</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(vehiclesQuery.data as any)?.map((vehicle: any) => (
                  <div key={vehicle.id} className={cn("p-3 hover:bg-slate-700/20 cursor-pointer", vehicle.status === "offline" && "opacity-60")}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">{vehicle.unitNumber}</p>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <MapPin className="w-3 h-3" /><span className="truncate">{vehicle.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{vehicle.speed} mph</span>
                      <span>{vehicle.heading}</span>
                      <span>{vehicle.lastUpdate}</span>
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
