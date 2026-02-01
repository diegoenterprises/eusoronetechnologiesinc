/**
 * Fleet Tracking Page - Real-time fleet management for carriers
 * 100% Dynamic - All data from tRPC
 */

import { useState } from "react";
import { Truck, MapPin, Users, AlertTriangle, Circle, Filter, RefreshCw, Settings, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TelemetryMap } from "../components/maps/TelemetryMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function FleetTracking() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: fleetLocations, isLoading: fleetLoading, refetch: refetchFleet } = trpc.telemetry.getFleetLocations.useQuery(
    {},
    { refetchInterval: 10000 }
  );

  const { data: geofences, isLoading: geofencesLoading } = trpc.geofencing.getGeofences.useQuery(
    { activeOnly: true },
    { refetchInterval: 60000 }
  );

  const { data: activeAlerts } = trpc.safetyAlerts.getActiveAlerts.useQuery(
    { limit: 10 },
    { refetchInterval: 15000 }
  );

  const { data: activeConvoys } = trpc.convoy.getActiveConvoys.useQuery(
    { limit: 5 }
  );

  const filteredLocations = fleetLocations?.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const movingCount = filteredLocations.filter((l) => l.isMoving).length;
  const stationaryCount = filteredLocations.length - movingCount;

  const mapMarkers = filteredLocations.map((loc) => ({
    lat: loc.lat,
    lng: loc.lng,
    label: loc.name,
    type: "driver" as const,
    isMoving: loc.isMoving ?? undefined,
    speed: loc.speed ?? undefined,
    heading: loc.heading ?? undefined,
  }));

  const mapGeofences = geofences?.map((gf) => ({
    id: gf.id,
    name: gf.name,
    type: gf.type,
    center: gf.center as { lat: number; lng: number } | undefined,
    radius: gf.radiusMeters || (gf.radius ? gf.radius * 1609.34 : undefined),
    polygon: gf.polygon as { lat: number; lng: number }[] | undefined,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Fleet Tracking
          </h1>
          <p className="text-muted-foreground">Real-time fleet locations and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchFleet()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                {fleetLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-2xl font-bold">{filteredLocations.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moving</p>
                {fleetLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-2xl font-bold">{movingCount}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <MapPin className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stationary</p>
                {fleetLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-2xl font-bold">{stationaryCount}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Fleet Map
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs">Moving</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs">Stationary</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {fleetLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <TelemetryMap
                  markers={mapMarkers}
                  geofences={mapGeofences}
                  height="500px"
                  onMarkerClick={(marker) => {
                    const driver = filteredLocations.find(
                      (l) => l.lat === marker.lat && l.lng === marker.lng
                    );
                    if (driver) setSelectedDriver(driver.userId);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Driver List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Drivers
              </CardTitle>
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {fleetLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredLocations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No drivers found</p>
              ) : (
                <div className="space-y-2">
                  {filteredLocations.map((driver) => (
                    <div
                      key={driver.userId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDriver === driver.userId
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedDriver(driver.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${driver.isMoving ? "bg-green-500" : "bg-gray-400"}`} />
                          <span className="font-medium">{driver.name}</span>
                        </div>
                        <Badge variant={driver.isMoving ? "default" : "secondary"}>
                          {driver.isMoving ? `${driver.speed?.toFixed(0) || 0} mph` : "Stopped"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                      </p>
                      {driver.loadId && (
                        <p className="text-xs text-blue-600 mt-1">Load #{driver.loadId}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geofences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="h-5 w-5" />
                Geofences ({geofences?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[200px] overflow-y-auto">
              {geofencesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : geofences?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No geofences</p>
              ) : (
                <div className="space-y-2">
                  {geofences?.slice(0, 5).map((gf) => (
                    <div key={gf.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium text-sm">{gf.name}</p>
                        <p className="text-xs text-muted-foreground">{gf.type}</p>
                      </div>
                      <Badge variant="outline">{gf.shape}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={alert.severity === "emergency" || alert.severity === "critical" ? "destructive" : "secondary"}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <p className="font-medium">{alert.userName}</p>
                  <p className="text-sm text-muted-foreground">{alert.type.replace(/_/g, " ")}</p>
                  {alert.message && <p className="text-sm mt-1">{alert.message}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
