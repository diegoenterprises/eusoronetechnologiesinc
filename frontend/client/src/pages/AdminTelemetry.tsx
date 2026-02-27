/**
 * Admin Telemetry Dashboard - System-wide tracking overview
 * 100% Dynamic - All data from tRPC
 */

import { useState } from "react";
import { Activity, MapPin, Users, AlertTriangle, Circle, Clock, TrendingUp, Gauge, RefreshCw, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TelemetryMap } from "../components/maps/TelemetryMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";

export default function AdminTelemetry() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: fleetLocations, isLoading: fleetLoading, refetch } = (trpc as any).telemetry.getFleetLocations.useQuery(
    {},
    { refetchInterval: 15000 }
  );

  const { data: geofences } = (trpc as any).geofencing.getGeofences.useQuery({ activeOnly: true });

  const { data: activeAlerts } = (trpc as any).safetyAlerts.getActiveAlerts.useQuery(
    { limit: 20 },
    { refetchInterval: 10000 }
  );

  const { data: alertStats } = (trpc as any).safetyAlerts.getAlertStats.useQuery({ days: 30 });

  const { data: speedEvents } = (trpc as any).safetyAlerts.getSpeedEvents.useQuery({ limit: 20 });

  const totalDrivers = fleetLocations?.length || 0;
  const movingDrivers = fleetLocations?.filter((l: any) => l.isMoving).length || 0;
  const stationaryDrivers = totalDrivers - movingDrivers;

  const mapMarkers = fleetLocations?.map((loc: any) => ({
    lat: loc.lat,
    lng: loc.lng,
    label: loc.name,
    type: "driver" as const,
    isMoving: loc.isMoving ?? undefined,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Telemetry Dashboard
          </h1>
          <p className="text-muted-foreground">System-wide tracking and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                {fleetLoading ? <Skeleton className="h-7 w-12" /> : (
                  <p className="text-2xl font-bold">{totalDrivers}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Motion</p>
                {fleetLoading ? <Skeleton className="h-7 w-12" /> : (
                  <p className="text-2xl font-bold">{movingDrivers}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-800 dark:bg-gray-800">
                <MapPin className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stationary</p>
                {fleetLoading ? <Skeleton className="h-7 w-12" /> : (
                  <p className="text-2xl font-bold">{stationaryDrivers}</p>
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

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Circle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Geofences</p>
                <p className="text-2xl font-bold">{geofences?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({activeAlerts?.length || 0})</TabsTrigger>
          <TabsTrigger value="speed">Speed Events</TabsTrigger>
          <TabsTrigger value="geofences">Geofences</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>System-Wide Map</CardTitle>
                </CardHeader>
                <CardContent>
                  {fleetLoading ? (
                    <Skeleton className="h-[500px] w-full" />
                  ) : (
                    <TelemetryMap
                      markers={mapMarkers}
                      geofences={geofences?.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                        type: g.type,
                        center: g.center as { lat: number; lng: number } | undefined,
                        radius: g.radiusMeters ?? undefined,
                      })) || []}
                      height="500px"
                      darkMode={theme === "dark"}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alert Summary (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {alertStats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Alerts</span>
                        <span className="font-bold">{alertStats.total}</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(alertStats.bySeverity || {}).map(([severity, count]) => (
                          <div key={severity} className="flex justify-between items-center">
                            <Badge variant={severity === "emergency" || severity === "critical" ? "destructive" : "secondary"}>
                              {severity}
                            </Badge>
                            <span>{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-32 w-full" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {activeAlerts?.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className="py-2 border-b last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={alert.severity === "emergency" ? "destructive" : "secondary"} className="mb-1">
                            {alert.type.replace(/_/g, " ")}
                          </Badge>
                          <p className="text-sm">{alert.userName}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No active alerts</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active alerts</p>
              ) : (
                <div className="space-y-2">
                  {activeAlerts?.map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Badge variant={alert.severity === "emergency" || alert.severity === "critical" ? "destructive" : "secondary"}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.userName}</p>
                          <p className="text-sm text-muted-foreground">{alert.type.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ""}</p>
                        {alert.latitude && alert.longitude && (
                          <p className="text-xs text-muted-foreground">
                            {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Speed Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {speedEvents?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No speed events recorded</p>
              ) : (
                <div className="space-y-2">
                  {speedEvents?.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Badge variant={event.severity === "severe" ? "destructive" : event.severity === "moderate" ? "secondary" : "outline"}>
                          {event.severity}
                        </Badge>
                        <div>
                          <p className="font-medium">{event.recordedSpeed} mph</p>
                          {event.speedLimit && (
                            <p className="text-sm text-muted-foreground">
                              Limit: {event.speedLimit} mph | Over by {event.overage} mph
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{event.roadName || "Unknown road"}</p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {event.durationSeconds}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geofences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="h-5 w-5" />
                Active Geofences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {geofences?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No geofences configured</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {geofences?.map((gf: any) => (
                    <div key={gf.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{gf.name}</p>
                        <Badge variant="outline">{gf.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Shape: {gf.shape}</p>
                      {gf.radiusMeters && <p className="text-sm text-muted-foreground">Radius: {gf.radiusMeters}m</p>}
                      <div className="flex gap-2 mt-2">
                        {gf.alertOnEnter && <Badge variant="secondary">Entry</Badge>}
                        {gf.alertOnExit && <Badge variant="secondary">Exit</Badge>}
                        {gf.alertOnDwell && <Badge variant="secondary">Dwell</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
