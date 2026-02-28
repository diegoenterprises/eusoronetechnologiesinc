/**
 * Driver Tracking Page - Live GPS tracking and navigation for drivers
 * 100% Dynamic - All data from tRPC
 */

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Navigation, MapPin, Clock, Battery, Signal, AlertTriangle, Route, Play, Square, RefreshCw, Phone, User, Shield, ExternalLink, X, CheckCircle, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TelemetryMap } from "../components/maps/TelemetryMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DriverTracking() {
  const { theme } = useTheme();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const { data: liveLocation, isLoading: locationLoading, refetch: refetchLocation } = (trpc as any).telemetry.getLiveLocation.useQuery(
    { userId: 0 },
    { enabled: false }
  );

  const { data: trail, isLoading: trailLoading } = (trpc as any).telemetry.getTrail.useQuery(
    { userId: 0, hours: 8, limit: 200 },
    { enabled: false }
  );

  const { data: activeAlerts, refetch: refetchAlerts } = (trpc as any).safetyAlerts.getActiveAlerts.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 }
  );

  const acknowledgeAlert = (trpc as any).safetyAlerts.acknowledgeAlert.useMutation({
    onSuccess: () => { toast.success("Alert acknowledged"); refetchAlerts(); setExpandedAlert(null); },
    onError: (err: any) => toast.error("Failed", { description: err.message }),
  });
  const resolveAlert = (trpc as any).safetyAlerts.resolveAlert.useMutation({
    onSuccess: () => { toast.success("Alert resolved"); refetchAlerts(); setExpandedAlert(null); },
    onError: (err: any) => toast.error("Failed", { description: err.message }),
  });

  const submitLocation = (trpc as any).telemetry.submitLocation.useMutation();
  const triggerSOS = (trpc as any).safetyAlerts.triggerSOS.useMutation({
    onSuccess: (data: any) => {
      toast.success(data?.emergencyContactNotified
        ? "SOS sent — emergency contact notified via SMS and email"
        : "SOS alert sent — help is on the way");
      window.location.href = "/zeun-breakdown?sos=true";
    },
    onError: (err: any) => toast.error("SOS failed", { description: err.message }),
  });

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
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

      {/* Map + SOS Button (SOS anchored to map, not viewport) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Live Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <TelemetryMap
              center={currentPosition || { lat: 39.8283, lng: -98.5795 }}
              zoom={currentPosition ? 14 : 4}
              markers={mapMarkers}
              currentLocation={currentPosition ? { ...currentPosition, label: "Current" } : undefined}
              height="400px"
              darkMode={theme === "dark"}
            />
            {/* SOS Button — pinned to left-center of the map */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ zIndex: 10 }}>
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full h-16 w-16 shadow-lg shadow-red-900/40 text-lg font-bold animate-pulse hover:animate-none"
                onClick={() => {
                  if (currentPosition) {
                    triggerSOS.mutate({
                      latitude: currentPosition.lat,
                      longitude: currentPosition.lng,
                    });
                  } else {
                    toast.error("Location not available — start tracking first");
                  }
                }}
              >
                SOS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Active Alerts
              </CardTitle>
              <Badge variant="destructive" className="text-xs">{activeAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeAlerts.map((alert: any) => {
                const isExpanded = expandedAlert === alert.id;
                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border transition-all cursor-pointer ${
                      isExpanded
                        ? "bg-red-500/10 border-red-500/30 col-span-full"
                        : "bg-muted/50 border-border hover:border-red-500/30 hover:bg-red-500/5"
                    }`}
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  >
                    {/* Alert Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={alert.severity === "emergency" ? "destructive" : "secondary"} className="uppercase text-[10px] font-bold">
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="font-semibold text-sm">{alert.userName}</p>
                          <p className="text-xs text-muted-foreground">{alert.type?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div className="px-4 pb-2">
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-red-500/20 space-y-4" onClick={(e) => e.stopPropagation()}>
                        {/* Person Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
                            <User className="w-4 h-4 text-blue-500 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Person</p>
                              <p className="text-sm font-semibold">{alert.userName}</p>
                              {alert.userRole && <p className="text-[10px] text-muted-foreground capitalize">{alert.userRole.replace(/_/g, " ")}</p>}
                            </div>
                          </div>
                          {alert.userPhone && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
                              <Phone className="w-4 h-4 text-green-500 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                                <a href={`tel:${alert.userPhone}`} className="text-sm font-semibold text-green-500 hover:underline">{alert.userPhone}</a>
                              </div>
                            </div>
                          )}
                          {alert.latitude && alert.longitude && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
                              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Location</p>
                                <a
                                  href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-blue-500 hover:underline flex items-center gap-1"
                                >
                                  {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Emergency Contact */}
                        {alert.emergencyContact && (
                          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-4 h-4 text-amber-500" />
                              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Emergency Contact</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Name</p>
                                <p className="text-sm font-semibold">{alert.emergencyContact.name}</p>
                                {alert.emergencyContact.relationship && <p className="text-[10px] text-muted-foreground capitalize">{alert.emergencyContact.relationship}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Phone</p>
                                <a href={`tel:${alert.emergencyContact.phone}`} className="text-sm font-semibold text-green-500 hover:underline">{alert.emergencyContact.phone}</a>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Email</p>
                                <a href={`mailto:${alert.emergencyContact.email}`} className="text-sm font-semibold text-blue-500 hover:underline">{alert.emergencyContact.email}</a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timestamp + Load */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Unknown"}</span>
                          {alert.loadId && <span className="flex items-center gap-1"><Route className="w-3 h-3" />Load #{alert.loadId}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs"
                            disabled={acknowledgeAlert.isPending}
                            onClick={() => acknowledgeAlert.mutate({ alertId: alert.id })}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
                            disabled={resolveAlert.isPending}
                            onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                          >
                            <Shield className="w-3.5 h-3.5 mr-1" />Resolve
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
