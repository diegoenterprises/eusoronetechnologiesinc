/**
 * LOAD TRACKING PAGE (Real-time shipment tracking)
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
  MapPin, Truck, Clock, Package, Search, RefreshCw,
  Navigation, Phone, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchedLoad, setSearchedLoad] = useState<string | null>(null);

  const loadQuery = trpc.loads.track.useQuery(
    { trackingNumber: searchedLoad! },
    { enabled: !!searchedLoad }
  );

  const recentQuery = trpc.loads.getRecentTracking.useQuery({ limit: 5 });

  const load = loadQuery.data;

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      setSearchedLoad(trackingNumber.trim());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "picked_up": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Picked Up</Badge>;
      case "in_transit": return <Badge className="bg-purple-500/20 text-purple-400 border-0">In Transit</Badge>;
      case "out_for_delivery": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Out for Delivery</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Load Tracking
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your shipment in real-time</p>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter load number or tracking ID..."
                className="pl-12 py-6 text-lg bg-slate-700/30 border-slate-600/50 rounded-xl focus:border-cyan-500/50"
              />
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-xl px-8" onClick={handleSearch}>
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {searchedLoad && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Tracking Details</CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => loadQuery.refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : !load ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">Load not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Load Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-bold text-xl">{load.loadNumber}</p>
                      <p className="text-sm text-slate-400">{load.productName}</p>
                    </div>
                    {getStatusBadge(load.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">ETA</p>
                      <p className="text-white font-medium">{load.eta}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Distance Remaining</p>
                      <p className="text-white font-medium">{load.distanceRemaining} mi</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Driver</p>
                      <p className="text-white font-medium">{load.driverName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Carrier</p>
                      <p className="text-white font-medium">{load.carrierName}</p>
                    </div>
                  </div>
                </div>

                {/* Current Location */}
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Navigation className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Current Location</p>
                      <p className="text-sm text-slate-400">{load.currentLocation?.city}, {load.currentLocation?.state}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Last updated: {load.lastUpdate}</p>
                </div>

                {/* Route */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-green-400" />
                      <div className="w-0.5 h-16 bg-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{load.origin?.name}</p>
                      <p className="text-sm text-slate-400">{load.origin?.address}</p>
                      <p className="text-xs text-slate-500 mt-1">Picked up: {load.pickupTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-4 h-4 rounded-full", load.status === "delivered" ? "bg-green-400" : "bg-red-400")} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{load.destination?.name}</p>
                      <p className="text-sm text-slate-400">{load.destination?.address}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {load.status === "delivered" ? `Delivered: ${load.deliveryTime}` : `Expected: ${load.eta}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-white font-medium mb-3">Tracking History</p>
                  <div className="space-y-3">
                    {load.timeline?.map((event: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/30">
                        <div className={cn("w-2 h-2 rounded-full mt-2", idx === 0 ? "bg-green-400" : "bg-slate-500")} />
                        <div>
                          <p className="text-white font-medium">{event.status}</p>
                          <p className="text-sm text-slate-400">{event.location}</p>
                          <p className="text-xs text-slate-500">{event.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">
                    <Phone className="w-4 h-4 mr-2" />Contact Driver
                  </Button>
                  <Button variant="outline" className="flex-1 bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-xl">
                    <Phone className="w-4 h-4 mr-2" />Contact Carrier
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Tracking */}
      {!searchedLoad && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : recentQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent tracking history</p>
            ) : (
              <div className="space-y-3">
                {recentQuery.data?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors" onClick={() => { setTrackingNumber(item.loadNumber); setSearchedLoad(item.loadNumber); }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-cyan-500/20">
                          <Truck className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.loadNumber}</p>
                          <p className="text-sm text-slate-400">{item.origin} → {item.destination}</p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
