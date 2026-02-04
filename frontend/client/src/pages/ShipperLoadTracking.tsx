/**
 * SHIPPER LOAD TRACKING PAGE - 100% Dynamic
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { MapPin, Truck, Clock, CheckCircle, ChevronLeft, Navigation, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperLoadTracking() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/shipper/track/:loadId");
  const loadId = params?.loadId;

  const loadQuery = trpc.loads.getById.useQuery({ id: loadId || "" });
  const trackingQuery = trpc.tracking.getLoadTracking.useQuery({ loadId: loadId || "" }, { refetchInterval: 30000 });
  const eventsQuery = trpc.tracking.getLoadEvents.useQuery({ loadId: loadId || "" });

  const load = loadQuery.data;
  const tracking = trackingQuery.data;
  const events = eventsQuery.data || [];

  if (loadQuery.isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shipper/loads")} className="text-slate-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex-1"><h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Track Load</h1><p className="text-slate-400 text-sm mt-1">#{load?.loadNumber}</p></div>
        <Badge className={cn("border-0", load?.status === "delivered" ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400")}>{load?.status}</Badge>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center"><div className="w-4 h-4 rounded-full bg-green-400 mx-auto mb-2" /><p className="text-white font-bold">{load?.origin?.city}</p></div>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full" />
            <div className="text-center"><div className="w-4 h-4 rounded-full bg-red-400 mx-auto mb-2" /><p className="text-white font-bold">{load?.destination?.city}</p></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-xs">Miles Left</p><p className="text-white font-bold">{tracking?.distanceRemaining || "—"}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-xs">ETA</p><p className="text-white font-bold">{tracking?.eta || "—"}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-xs">Last Update</p><p className="text-white font-bold">{tracking?.lastUpdate || "—"}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-xs">Speed</p><p className="text-white font-bold">{tracking?.speed || 0} mph</p></div>
          </div>
        </CardContent>
      </Card>

      {tracking?.currentLocation && (
        <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <MapPin className="w-6 h-6 text-cyan-400" />
            <div><p className="text-cyan-400 font-medium">Current Location</p><p className="text-white">{tracking.currentLocation.address}</p></div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-purple-400" />Driver & Carrier</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-sm">Driver</p><p className="text-white font-medium">{load?.driver?.name}</p><p className="text-cyan-400 text-sm">{load?.driver?.phone}</p></div>
            <div className="p-4 rounded-lg bg-slate-700/30"><p className="text-slate-400 text-sm">Carrier</p><p className="text-white font-medium">{load?.carrier?.name}</p><p className="text-slate-400 text-sm">MC# {load?.carrier?.mcNumber}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" />Events</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? <p className="text-slate-400 text-center py-4">No events yet</p> : (
            <div className="space-y-2">
              {events.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div><p className="text-white">{e.description}</p><p className="text-slate-500 text-xs">{e.timestamp}</p></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
