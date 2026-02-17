/**
 * LOAD TRACKING MAP — Single load tracking for shippers and brokers
 * Route polyline, current position marker, pickup/delivery markers,
 * geofence circles, ETA display. Wired to location.tracking.getLoadTracking
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Navigation2, Clock, Truck, Package, CheckCircle2,
  Circle, ArrowRight, RefreshCw, Shield, AlertTriangle, Timer,
} from "lucide-react";
import { useLoadTracking } from "@/hooks/useLocationTracking";

interface LoadTrackingMapProps {
  loadId: number;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  posted: { color: "text-gray-500", bg: "bg-gray-100", label: "Posted" },
  bidding: { color: "text-blue-500", bg: "bg-blue-100", label: "Bidding" },
  assigned: { color: "text-indigo-500", bg: "bg-indigo-100", label: "Assigned" },
  en_route_pickup: { color: "text-cyan-500", bg: "bg-cyan-100", label: "En Route to Pickup" },
  approaching_pickup: { color: "text-teal-500", bg: "bg-teal-100", label: "Approaching Pickup" },
  at_pickup: { color: "text-orange-500", bg: "bg-orange-100", label: "At Pickup" },
  loading: { color: "text-amber-500", bg: "bg-amber-100", label: "Loading" },
  in_transit: { color: "text-green-500", bg: "bg-green-100", label: "In Transit" },
  approaching_delivery: { color: "text-teal-500", bg: "bg-teal-100", label: "Approaching Delivery" },
  at_delivery: { color: "text-orange-500", bg: "bg-orange-100", label: "At Delivery" },
  unloading: { color: "text-amber-500", bg: "bg-amber-100", label: "Unloading" },
  delivered: { color: "text-green-600", bg: "bg-green-100", label: "Delivered" },
  completed: { color: "text-emerald-600", bg: "bg-emerald-100", label: "Completed" },
};

export default function LoadTrackingMap({ loadId }: LoadTrackingMapProps) {
  const { tracking, position, eta, isLoading, refetch } = useLoadTracking(loadId, { refetchInterval: 10000 });

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
          <p className="text-sm">Loading tracking data...</p>
        </div>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card className="min-h-[200px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Load not found</p>
        </div>
      </Card>
    );
  }

  const statusStyle = STATUS_STYLES[tracking.status] || STATUS_STYLES.posted;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="font-semibold">Load {tracking.loadNumber}</h2>
            <p className="text-sm text-muted-foreground">
              {tracking.origin?.city}, {tracking.origin?.state} <ArrowRight className="inline h-3 w-3" /> {tracking.destination?.city}, {tracking.destination?.state}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusStyle.bg} ${statusStyle.color} border-0`}>
            {statusStyle.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className="lg:col-span-2 min-h-[400px]">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg min-h-[400px] flex items-center justify-center">
              {/* Route visualization */}
              <div className="absolute inset-6 flex flex-col justify-between">
                {/* Origin */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 rounded-lg p-2 self-start">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <div className="text-xs">
                    <p className="font-medium">Pickup</p>
                    <p className="text-muted-foreground">{tracking.origin?.city}, {tracking.origin?.state}</p>
                  </div>
                </div>

                {/* Current Position */}
                {position && (
                  <div className="flex items-center gap-2 bg-white/90 dark:bg-black/50 rounded-lg p-3 self-center shadow-lg border border-blue-200">
                    <Navigation2 className="h-5 w-5 text-blue-600" style={{
                      transform: `rotate(${position.heading || 0}deg)`,
                    }} />
                    <div className="text-xs">
                      <p className="font-medium text-blue-600">Current Position</p>
                      <p className="text-muted-foreground">
                        {position.lat?.toFixed(4)}, {position.lng?.toFixed(4)}
                      </p>
                      {position.speed > 0 && (
                        <p className="text-muted-foreground">{Math.round(position.speed)} mph</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Destination */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 rounded-lg p-2 self-end">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div className="text-xs">
                    <p className="font-medium">Delivery</p>
                    <p className="text-muted-foreground">{tracking.destination?.city}, {tracking.destination?.state}</p>
                  </div>
                </div>
              </div>

              {/* Geofence indicators */}
              {tracking.geofences?.length > 0 && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" />
                    {tracking.geofences.length} Geofences Active
                  </Badge>
                </div>
              )}

              {/* Route info */}
              {tracking.route && (
                <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-white/80 dark:bg-black/40 rounded px-2 py-1">
                  {tracking.route.distanceMiles} mi | {Math.round(tracking.route.durationSeconds / 60)} min
                  {tracking.route.isHazmatCompliant && (
                    <span className="ml-1 text-amber-600 font-medium">HAZMAT</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* ETA Card */}
          {(eta || tracking.eta) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Estimated Arrival
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(eta?.predictedEta || tracking.eta?.predictedEta)
                      ? new Date(eta?.predictedEta || tracking.eta!.predictedEta!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "--:--"
                    }
                  </p>
                  {(eta?.remainingMinutes || tracking.eta?.remainingMinutes) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round((eta?.remainingMinutes || tracking.eta!.remainingMinutes!) / 60)}h {(eta?.remainingMinutes || tracking.eta!.remainingMinutes!) % 60}m remaining
                    </p>
                  )}
                  {(eta?.remainingMiles || tracking.eta?.remainingMiles) && (
                    <p className="text-xs text-muted-foreground">
                      {eta?.remainingMiles || tracking.eta!.remainingMiles} miles
                    </p>
                  )}
                  {(eta?.confidence || tracking.eta?.confidence) && (
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      Confidence: {(eta?.confidence || tracking.eta!.confidence)?.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detention */}
          {tracking.detention && tracking.detention.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  Detention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tracking.detention.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{d.locationType}</span>
                    <div className="text-right">
                      <span className="font-medium">{d.totalDwellMinutes || 0} min</span>
                      {d.isBillable && (
                        <Badge variant="destructive" className="ml-1 text-[9px]">
                          ${d.detentionCharge?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Geotag Timeline */}
          {tracking.geotags && tracking.geotags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {tracking.geotags.map((tag: any) => (
                    <div key={tag.id} className="flex items-start gap-2 text-xs">
                      <div className="mt-0.5">
                        <Circle className="h-2.5 w-2.5 text-blue-400 fill-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize">
                          {tag.eventType.replace(/_/g, " ")}
                        </p>
                        <p className="text-muted-foreground">
                          {tag.timestamp ? new Date(tag.timestamp).toLocaleString() : ""}
                        </p>
                      </div>
                      {tag.tamperedFlag && (
                        <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
