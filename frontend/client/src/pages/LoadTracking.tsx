/**
 * LOAD TRACKING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Truck, Clock, Search, Navigation,
  CheckCircle, AlertTriangle, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadTracking() {
  const [loadNumber, setLoadNumber] = useState("");
  const [trackedLoad, setTrackedLoad] = useState<any>(null);

  const trackMutation = (trpc as any).loads.trackLoad.useMutation({
    onSuccess: (data: any) => setTrackedLoad(data),
    onError: () => setTrackedLoad(null),
  });

  const handleTrack = () => {
    if (loadNumber) {
      trackMutation.mutate({ loadNumber });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "picked_up": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Package className="w-3 h-3 mr-1" />Picked Up</Badge>;
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Truck className="w-3 h-3 mr-1" />In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case "delayed": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Delayed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Load Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Track your shipments in real-time</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={loadNumber} onChange={(e: any) => setLoadNumber(e.target.value)} placeholder="Enter load number..." className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg" onKeyDown={(e: any) => e.key === "Enter" && handleTrack()} />
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleTrack} disabled={trackMutation.isPending}>
              <Navigation className="w-4 h-4 mr-2" />Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {trackMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {trackedLoad && (
        <>
          <Card className={cn("rounded-xl", trackedLoad.status === "delivered" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : trackedLoad.status === "delayed" ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30" : "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Load Number</p>
                  <p className="text-white font-bold text-2xl">#{trackedLoad.loadNumber}</p>
                </div>
                {getStatusBadge(trackedLoad.status)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Origin</p>
                  <p className="text-white font-medium">{trackedLoad.origin}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="text-white font-medium">{trackedLoad.destination}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">ETA</p>
                  <p className="text-white font-medium">{trackedLoad.eta}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Carrier</p>
                  <p className="text-white font-medium">{trackedLoad.carrier}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[400px]">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Live Location</CardTitle></CardHeader>
              <CardContent className="h-[320px] flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Map integration placeholder</p>
                  <p className="text-sm text-slate-500 mt-1">Last update: {trackedLoad.lastUpdate}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-purple-400" />Tracking History</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-[340px] overflow-y-auto">
                <div className="relative pl-6">
                  {trackedLoad.history?.map((event: any, i: number) => (
                    <div key={i} className="relative pb-4 last:pb-0">
                      <div className={cn("absolute left-0 w-3 h-3 rounded-full -translate-x-1/2", i === 0 ? "bg-cyan-500" : "bg-slate-600")} />
                      {i < trackedLoad.history.length - 1 && <div className="absolute left-0 top-3 w-0.5 h-full bg-slate-700 -translate-x-1/2" />}
                      <div className="pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium text-sm">{event.status}</p>
                          <span className="text-xs text-slate-500">{event.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-400">{event.location}</p>
                        {event.notes && <p className="text-xs text-slate-500 mt-1">{event.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-green-400" />Shipment Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Product</p>
                  <p className="text-white font-medium">{trackedLoad.product}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Weight</p>
                  <p className="text-white font-medium">{trackedLoad.weight}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Driver</p>
                  <p className="text-white font-medium">{trackedLoad.driver}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Truck</p>
                  <p className="text-white font-medium">{trackedLoad.truck}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!trackMutation.isPending && !trackedLoad && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Enter a load number to track your shipment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
