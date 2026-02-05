/**
 * TRACK SHIPMENTS PAGE
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

export default function TrackShipments() {
  const [searchTerm, setSearchTerm] = useState("");

  const shipmentsQuery = (trpc as any).loads.getTrackedLoads.useQuery({ search: searchTerm || undefined });

  const activeCount = (shipmentsQuery.data as any)?.filter((s: any) => s.status === "in_transit").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      case "in_transit": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Transit</Badge>;
      case "picked_up": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Picked Up</Badge>;
      case "delayed": return <Badge className="bg-red-500/20 text-red-400 border-0">Delayed</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Track Shipments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tracking of your shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">Active</span>
            <span className="text-blue-400 font-bold">{activeCount}</span>
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => shipmentsQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by load number, origin, or destination..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Shipments List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {shipmentsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (shipmentsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No shipments to track</p>
              <p className="text-slate-500 text-sm mt-1">Your active shipments will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(shipmentsQuery.data as any)?.map((shipment: any) => (
                <div key={shipment.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", shipment.status === "in_transit" ? "bg-blue-500/20" : shipment.status === "delivered" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                        <Truck className={cn("w-6 h-6", shipment.status === "in_transit" ? "text-blue-400" : shipment.status === "delivered" ? "text-green-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{shipment.loadNumber}</p>
                          {getStatusBadge(shipment.status)}
                        </div>
                        <p className="text-sm text-slate-400">{shipment.commodity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">ETA</p>
                      <p className="text-white font-medium">{shipment.eta}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="p-4 rounded-xl bg-slate-700/30 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <div className="w-0.5 h-8 bg-slate-600" />
                        {shipment.currentLocation && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-cyan-400" />
                            <div className="w-0.5 h-8 bg-slate-600" />
                          </>
                        )}
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">{shipment.origin?.city}, {shipment.origin?.state}</p>
                            <p className="text-xs text-slate-500">{shipment.pickupDate}</p>
                          </div>
                          {shipment.status !== "in_transit" && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        {shipment.currentLocation && (
                          <div>
                            <p className="text-cyan-400">Current: {shipment.currentLocation.city}, {shipment.currentLocation.state}</p>
                            <p className="text-xs text-slate-500">Updated: {shipment.lastUpdate}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">{shipment.destination?.city}, {shipment.destination?.state}</p>
                            <p className="text-xs text-slate-500">{shipment.deliveryDate}</p>
                          </div>
                          {shipment.status === "delivered" && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  {shipment.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white font-medium">{shipment.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all" style={{ width: `${shipment.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                      <Navigation className="w-4 h-4 mr-1" />Track
                    </Button>
                    <Button variant="outline" size="sm" className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
