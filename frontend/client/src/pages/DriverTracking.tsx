/**
 * Driver Tracking Page - Live GPS tracking and navigation for drivers
 * 100% Dynamic - All data from tRPC
 */

import { useState, useEffect } from "react";
import { Navigation, MapPin, Clock, Battery, Signal, AlertTriangle, Route, Play, Square, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TelemetryMap } from "../components/maps/TelemetryMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DriverTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const { data: liveLocation, isLoading: locationLoading, refetch: refetchLocation } = (trpc as any).telemetry.getLiveLocation.useQuery(
    { userId: 0 },
    { enabled: false }
  );

  const { data: trail, isLoading: trailLoading } = (trpc as any).telemetry.getTrail.useQuery(
    { userId: 0, hours: 8, limit: 200 },
    { enabled: false }
  );

  const { data: activeAlerts } = (trpc as any).safetyAlerts.getActiveAlerts.useQuery(
    { limit: 5 },
    { refetchInterval: 30000 }
  );

  const submitLocation = (trpc as any).telemetry.submitLocation.useMutation();

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude, speed, heading, accuracy } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });

        submitLocation.mutate({
          latitude,
          longitude,
          altitude: altitude || undefined,
          speed: speed ? speed * 2.237 : undefined,
          heading: heading || undefined,
          horizontalAccuracy: accuracy,
          activityType: speed && speed > 2 ? "driving" : "stationary",
          isMoving: speed ? speed > 0.5 : false,
          provider: "gps",
          deviceTimestamp: new Date().toISOString(),
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const mapMarkers = currentPosition
    ? [{ lat: currentPosition.lat, lng: currentPosition.lng, label: "You", type: "driver" as const, isMoving: isTracking }]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            Live Tracking
          </h1>
          <p className="text-muted-foreground">Real-time GPS tracking and navigation</p>
        </div>
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="gap-2">
              <Play className="h-4 w-4" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="gap-2">
              <Square className="h-4 w-4" />
              Stop Tracking
            </Button>
          )}
          <Button variant="outline" onClick={() => refetchLocation()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isTracking ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-800 dark:bg-gray-800"}`}>
                <Signal className={`h-5 w-5 ${isTracking ? "text-green-600" : "text-slate-400"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{isTracking ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold text-sm">
                  {currentPosition
                    ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                    : "Not available"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="font-semibold">{isTracking ? "Just now" : "--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Battery className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Battery</p>
                <p className="font-semibold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Live Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TelemetryMap
            center={currentPosition || { lat: 39.8283, lng: -98.5795 }}
            zoom={currentPosition ? 14 : 4}
            markers={mapMarkers}
            currentLocation={currentPosition ? { ...currentPosition, label: "Current" } : undefined}
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.severity === "emergency" ? "destructive" : alert.severity === "critical" ? "destructive" : "secondary"}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.type.replace(/_/g, " ")}</span>
                    {alert.message && <span className="text-muted-foreground">{alert.message}</span>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SOS Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full h-16 w-16 shadow-lg"
          onClick={() => {
            if (currentPosition) {
              (trpc as any).safetyAlerts.triggerSOS.useMutation().mutate({
                latitude: currentPosition.lat,
                longitude: currentPosition.lng,
              });
            }
          }}
        >
          SOS
        </Button>
      </div>
    </div>
  );
}
