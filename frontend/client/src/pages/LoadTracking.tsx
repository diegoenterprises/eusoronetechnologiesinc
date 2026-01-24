/**
 * LOAD TRACKING PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Truck, Clock, Package, Search, Eye,
  Navigation, Phone, AlertTriangle, CheckCircle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  const loadsQuery = trpc.loads.getTrackedLoads.useQuery({ search: searchTerm || undefined });
  const loadDetailsQuery = trpc.loads.getTrackingDetails.useQuery(
    { id: selectedLoadId! },
    { enabled: !!selectedLoadId, refetchInterval: 30000 }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500/20 text-green-400";
      case "in_transit": return "bg-blue-500/20 text-blue-400";
      case "at_pickup": case "at_delivery": return "bg-purple-500/20 text-purple-400";
      case "delayed": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const selectedLoad = loadDetailsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Tracking</h1>
          <p className="text-slate-400 text-sm">Real-time shipment tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loads List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search loads..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {loadsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : loadsQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No loads found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {loadsQuery.data?.map((load) => (
                  <div
                    key={load.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedLoadId === load.id ? "bg-blue-500/20 border border-blue-500" : "bg-slate-700/30 hover:bg-slate-700/50"
                    )}
                    onClick={() => setSelectedLoadId(load.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber}</p>
                      <Badge className={getStatusColor(load.status)}>{load.status?.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.origin?.city}</span>
                      <ChevronRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.destination?.city}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">ETA: {load.eta}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Placeholder */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
                {selectedLoadId ? (
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                    <p className="text-slate-400">Map View</p>
                    {selectedLoad?.currentLocation && (
                      <p className="text-xs text-slate-500 mt-1">
                        Current: {selectedLoad.currentLocation.city}, {selectedLoad.currentLocation.state}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Select a load to view tracking</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          {selectedLoadId && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Tracking Details</CardTitle>
              </CardHeader>
              <CardContent>
                {loadDetailsQuery.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-64" />
                  </div>
                ) : !selectedLoad ? (
                  <p className="text-slate-400">Load not found</p>
                ) : (
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-lg">{selectedLoad.loadNumber}</p>
                        <p className="text-slate-400">{selectedLoad.commodity}</p>
                      </div>
                      <Badge className={getStatusColor(selectedLoad.status)}>{selectedLoad.status?.replace("_", " ")}</Badge>
                    </div>

                    {/* Driver Info */}
                    {selectedLoad.driver && (
                      <div className="p-4 rounded-lg bg-slate-700/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{selectedLoad.driver.name}</p>
                              <p className="text-xs text-slate-500">{selectedLoad.driver.truckNumber}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-slate-600">
                            <Phone className="w-4 h-4 mr-1" />Call
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Route */}
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                          <div className="w-0.5 h-12 bg-slate-600" />
                          {selectedLoad.currentLocation && (
                            <>
                              <div className="w-3 h-3 rounded-full bg-blue-400" />
                              <div className="w-0.5 h-12 bg-slate-600" />
                            </>
                          )}
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-white">{selectedLoad.pickupLocation?.city}, {selectedLoad.pickupLocation?.state}</p>
                            <p className="text-xs text-slate-500">{selectedLoad.pickupDate}</p>
                          </div>
                          {selectedLoad.currentLocation && (
                            <div>
                              <p className="text-blue-400">Current: {selectedLoad.currentLocation.city}, {selectedLoad.currentLocation.state}</p>
                              <p className="text-xs text-slate-500">Updated: {selectedLoad.lastUpdate}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-white">{selectedLoad.deliveryLocation?.city}, {selectedLoad.deliveryLocation?.state}</p>
                            <p className="text-xs text-slate-500">ETA: {selectedLoad.eta}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{selectedLoad.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${selectedLoad.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{selectedLoad.milesCompleted} mi completed</span>
                        <span>{selectedLoad.milesRemaining} mi remaining</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {selectedLoad.timeline && selectedLoad.timeline.length > 0 && (
                      <div>
                        <p className="text-white font-medium mb-3">Timeline</p>
                        <div className="space-y-3">
                          {selectedLoad.timeline.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className={cn("w-2 h-2 rounded-full mt-1.5", event.completed ? "bg-green-400" : "bg-slate-600")} />
                              <div>
                                <p className={cn("text-sm", event.completed ? "text-white" : "text-slate-500")}>{event.description}</p>
                                <p className="text-xs text-slate-500">{event.timestamp}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
