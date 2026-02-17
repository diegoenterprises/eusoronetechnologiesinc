/**
 * LOCATION INTELLIGENCE DASHBOARD
 * Central hub for GPS, fleet tracking, geofencing, ETA, detention, compliance
 * Wired to location.* tRPC router via useLocationTracking hooks
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  MapPin, Truck, Navigation2, Package, Clock, Shield, Route,
  AlertTriangle, Timer, Search, RefreshCw, Gauge, Signal,
  Building2, CheckCircle2, ChevronRight, Eye,
} from "lucide-react";
import FleetMap from "@/components/maps/FleetMap";
import LoadTrackingMap from "@/components/maps/LoadTrackingMap";
import GeofenceOverlay from "@/components/maps/GeofenceOverlay";
import BreadcrumbTrail from "@/components/maps/BreadcrumbTrail";
import HazmatZoneLayer from "@/components/maps/HazmatZoneLayer";
import LoadStatusTimeline from "@/components/tracking/LoadStatusTimeline";
import ETADisplay from "@/components/tracking/ETADisplay";
import DetentionClockDisplay from "@/components/tracking/DetentionClockDisplay";
import DriverPositionCard from "@/components/tracking/DriverPositionCard";
import { useActiveLoads } from "@/hooks/useLocationTracking";
import { trpc } from "@/lib/trpc";

export default function LocationIntelligence() {
  const [activeTab, setActiveTab] = useState("fleet");
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);
  const [loadSearch, setLoadSearch] = useState("");

  const { loads: activeLoads, isLoading: loadsLoading } = useActiveLoads({ refetchInterval: 30000 });

  const filteredLoads = activeLoads.filter((l: any) => {
    if (!loadSearch) return true;
    const q = loadSearch.toLowerCase();
    return l.loadNumber?.toLowerCase().includes(q) ||
           l.driverName?.toLowerCase().includes(q) ||
           l.origin?.toLowerCase().includes(q) ||
           l.destination?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-500" />
            Location Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time fleet tracking, geofencing, ETA, and compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Signal className="h-3 w-3 mr-1 text-green-500" />
            {activeLoads.length} Active Load{activeLoads.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="fleet" className="text-xs">
            <Truck className="h-3.5 w-3.5 mr-1" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="load" className="text-xs">
            <Package className="h-3.5 w-3.5 mr-1" />
            Load Track
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="detention" className="text-xs">
            <Timer className="h-3.5 w-3.5 mr-1" />
            Detention
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FLEET TAB */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="fleet" className="mt-4">
          <FleetMap />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* LOAD TRACKING TAB */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="load" className="mt-4">
          {!selectedLoadId ? (
            <div className="space-y-4">
              {/* Load selector */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Select a Load to Track
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by load number, driver, origin, destination..."
                      value={loadSearch}
                      onChange={(e) => setLoadSearch(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
                  {loadsLoading ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Loading active loads...</p>
                  ) : filteredLoads.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">No active loads found</p>
                  ) : (
                    filteredLoads.map((load: any) => (
                      <button
                        key={load.loadId}
                        onClick={() => setSelectedLoadId(load.loadId)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">Load {load.loadNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {load.origin} <ChevronRight className="inline h-3 w-3" /> {load.destination}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {load.status?.replace(/_/g, " ")}
                            </Badge>
                            {load.driverName && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{load.driverName}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedLoadId(null)}>
                <ChevronRight className="h-3.5 w-3.5 mr-1 rotate-180" />
                Back to Load List
              </Button>

              <LoadTrackingMap loadId={selectedLoadId} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ETADisplay loadId={selectedLoadId} />
                <LoadStatusTimeline loadId={selectedLoadId} />
                <div className="space-y-4">
                  <GeofenceOverlay loadId={selectedLoadId} />
                  <BreadcrumbTrail loadId={selectedLoadId} />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* COMPLIANCE TAB */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="compliance" className="mt-4">
          <div className="space-y-4">
            {selectedLoadId ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Compliance for Load #{selectedLoadId}</h3>
                  <Button variant="outline" size="sm" onClick={() => setSelectedLoadId(null)}>
                    Change Load
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <HazmatZoneLayer loadId={selectedLoadId} />
                  <GeofenceOverlay loadId={selectedLoadId} />
                </div>
                <BreadcrumbTrail loadId={selectedLoadId} />
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a load from the Load Track tab</p>
                  <p className="text-xs mt-1">Compliance data is load-specific</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab("load")}>
                    Go to Load Track
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* DETENTION TAB */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="detention" className="mt-4">
          <div className="space-y-4">
            {selectedLoadId ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Detention for Load #{selectedLoadId}</h3>
                  <Button variant="outline" size="sm" onClick={() => setSelectedLoadId(null)}>
                    Change Load
                  </Button>
                </div>
                <DetentionClockDisplay loadId={selectedLoadId} />
              </>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Timer className="h-4 w-4 text-orange-500" />
                      Active Detention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeLoads.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No active loads</p>
                    ) : (
                      <div className="space-y-2">
                        {activeLoads.slice(0, 10).map((load: any) => (
                          <button
                            key={load.loadId}
                            onClick={() => { setSelectedLoadId(load.loadId); }}
                            className="w-full text-left p-2 rounded-lg border hover:bg-muted/50 transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Load {load.loadNumber}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {load.status?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
