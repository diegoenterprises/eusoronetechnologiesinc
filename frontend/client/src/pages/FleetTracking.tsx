/**
 * FLEET TRACKING — Premium Real-Time Fleet Intelligence
 * Jony Ive-inspired: frosted glass, purposeful motion, clean data.
 * 100% Dynamic — tRPC with 10s live polling.
 */

import { useState } from "react";
import { Truck, MapPin, Users, AlertTriangle, Circle, RefreshCw, Activity, Search, Navigation, Gauge, Radio, Shield, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TelemetryMap } from "../components/maps/TelemetryMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function FleetTracking() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "moving" | "stopped">("all");

  const { data: fleetLocations, isLoading: fleetLoading, refetch: refetchFleet } = (trpc as any).telemetry.getFleetLocations.useQuery(
    {},
    { refetchInterval: 10000 }
  );

  const { data: geofences, isLoading: geofencesLoading } = (trpc as any).geofencing.getGeofences.useQuery(
    { activeOnly: true },
    { refetchInterval: 60000 }
  );

  const { data: activeAlerts } = (trpc as any).safetyAlerts.getActiveAlerts.useQuery(
    { limit: 10 },
    { refetchInterval: 15000 }
  );

  const { data: activeConvoys } = (trpc as any).convoy.getActiveConvoys.useQuery(
    { limit: 5 }
  );

  const allLocations = fleetLocations?.filter((loc: any) =>
    loc.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredLocations = viewFilter === "all" ? allLocations
    : viewFilter === "moving" ? allLocations.filter((l: any) => l.isMoving)
    : allLocations.filter((l: any) => !l.isMoving);

  const movingCount = allLocations.filter((l: any) => l.isMoving).length;
  const stationaryCount = allLocations.length - movingCount;
  const avgSpeed = movingCount > 0 ? Math.round(allLocations.filter((l: any) => l.isMoving).reduce((s: number, l: any) => s + (l.speed || 0), 0) / movingCount) : 0;
  const alertCount = activeAlerts?.length || 0;
  const selectedData = selectedDriver ? allLocations.find((l: any) => l.userId === selectedDriver) : null;

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  const mapMarkers = filteredLocations.map((loc: any) => ({
    lat: loc.lat,
    lng: loc.lng,
    label: loc.name,
    type: "driver" as const,
    isMoving: loc.isMoving ?? undefined,
    speed: loc.speed ?? undefined,
    heading: loc.heading ?? undefined,
  }));

  const mapGeofences = geofences?.map((gf: any) => ({
    id: gf.id,
    name: gf.name,
    type: gf.type,
    center: gf.center as { lat: number; lng: number } | undefined,
    radius: gf.radiusMeters || (gf.radius ? gf.radius * 1609.34 : undefined),
    polygon: gf.polygon as { lat: number; lng: number }[] | undefined,
  })) || [];

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fleet Tracking</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Real-time fleet intelligence — 10s refresh</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={() => refetchFleet()}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      {/* ── Pulse Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: "Fleet Size", v: allLocations.length, I: Users, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Moving", v: movingCount, I: Navigation, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
          { l: "Stopped", v: stationaryCount, I: MapPin, c: "text-slate-400", b: "from-slate-500/5 to-slate-600/5" },
          { l: "Avg Speed", v: avgSpeed, I: Gauge, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5", suffix: " mph" },
          { l: "Alerts", v: alertCount, I: AlertTriangle, c: alertCount > 0 ? "text-red-500" : "text-slate-400", b: alertCount > 0 ? "from-red-500/10 to-red-600/5" : "from-slate-500/5 to-slate-600/5" },
        ].map((s: any) => (
          <div key={s.l} className={cn("rounded-2xl p-3.5 bg-gradient-to-br border", L ? `${s.b} border-slate-200/60` : `${s.b} border-slate-700/30`)}>
            <s.I className={cn("w-4 h-4 mb-1.5", s.c)} />
            {fleetLoading ? <Skeleton className="h-7 w-10 rounded-lg" /> : (
              <p className={cn("text-2xl font-bold tracking-tight", s.c)}>{s.v}{s.suffix || ""}</p>
            )}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* ── Map Filter Tabs ── */}
      <div className="flex items-center gap-2">
        {(["all", "moving", "stopped"] as const).map((f) => (
          <button key={f} onClick={() => setViewFilter(f)} className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
            viewFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
          )}>
            {f === "all" ? `All (${allLocations.length})` : f === "moving" ? `Moving (${movingCount})` : `Stopped (${stationaryCount})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Map Panel ── */}
        <div className="lg:col-span-2">
          <Card className={cn(cc, "overflow-hidden")}>
            <div className={cn("px-4 py-3 flex items-center justify-between border-b", L ? "border-slate-100" : "border-slate-700/30")}>
              <div className="flex items-center gap-2">
                <MapPin className={cn("w-4 h-4", L ? "text-slate-600" : "text-slate-300")} />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Fleet Map</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] text-slate-400">Moving</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] text-slate-400">Stopped</span></div>
              </div>
            </div>
            <CardContent className="p-0">
              {fleetLoading ? (
                <Skeleton className="h-[520px] w-full" />
              ) : (
                <TelemetryMap
                  markers={mapMarkers}
                  geofences={mapGeofences}
                  height="520px"
                  onMarkerClick={(marker) => {
                    const driver = filteredLocations.find(
                      (l: any) => l.lat === marker.lat && l.lng === marker.lng
                    );
                    if (driver) setSelectedDriver(driver.userId);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar: Drivers + Geofences ── */}
        <div className="space-y-4">
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Drivers ({filteredLocations.length})</span>
              </div>
              <div className={cn("relative rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.06]")}>
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs border-0 bg-transparent rounded-xl focus-visible:ring-0" />
              </div>
            </div>
            <CardContent className="p-0 max-h-[420px] overflow-y-auto">
              {fleetLoading ? (
                <div className="p-3 space-y-2">{[1,2,3,4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : filteredLocations.length === 0 ? (
                <p className={cn("text-center py-8 text-sm", L ? "text-slate-400" : "text-slate-500")}>No drivers found</p>
              ) : (
                <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/20")}>
                  {filteredLocations.map((driver: any) => (
                    <div key={driver.userId} onClick={() => setSelectedDriver(driver.userId)}
                      className={cn("px-4 py-3 cursor-pointer transition-all", selectedDriver === driver.userId
                        ? L ? "bg-blue-50/80 border-l-2 border-l-blue-500" : "bg-blue-500/10 border-l-2 border-l-blue-500"
                        : L ? "hover:bg-slate-50" : "hover:bg-white/[0.04]"
                      )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-2 h-2 rounded-full", driver.isMoving ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                          <span className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{driver.name}</span>
                        </div>
                        <Badge className={cn("border-0 text-[10px] font-bold", driver.isMoving ? "bg-green-500/15 text-green-500" : "bg-slate-500/15 text-slate-400")}>
                          {driver.isMoving ? `${driver.speed?.toFixed(0) || 0} mph` : "Stopped"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span>{driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}</span>
                        {driver.loadId && <span className="text-blue-500 font-medium">Load #{driver.loadId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Geofences ── */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center justify-between", L ? "border-slate-100" : "border-slate-700/30")}>
              <div className="flex items-center gap-2">
                <Circle className={cn("w-4 h-4", L ? "text-slate-500" : "text-slate-400")} />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Geofences</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{geofences?.length || 0}</span>
            </div>
            <CardContent className="p-0 max-h-[180px] overflow-y-auto">
              {geofencesLoading ? <div className="p-3"><Skeleton className="h-16 w-full rounded-xl" /></div>
              : !geofences?.length ? <p className="text-center py-6 text-xs text-slate-400">No geofences</p>
              : (
                <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/20")}>
                  {geofences.slice(0, 5).map((gf: any) => (
                    <div key={gf.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <p className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-200")}>{gf.name}</p>
                        <p className="text-[10px] text-slate-400">{gf.type}</p>
                      </div>
                      <Badge className="border-0 bg-slate-500/10 text-slate-400 text-[10px]">{gf.shape}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Selected Driver Detail ── */}
      {selectedData && (
        <Card className={cn(cc, "border-blue-500/30")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedData.isMoving ? "bg-green-500/15" : "bg-slate-500/15")}>
                  <Truck className={cn("w-5 h-5", selectedData.isMoving ? "text-green-500" : "text-slate-400")} />
                </div>
                <div>
                  <p className={cn("font-semibold", L ? "text-slate-800" : "text-white")}>{selectedData.name}</p>
                  <p className="text-xs text-slate-400">{selectedData.lat?.toFixed(5)}, {selectedData.lng?.toFixed(5)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="text-xs text-slate-400 hover:text-slate-600">Dismiss</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={cn("rounded-xl p-3 text-center", L ? "bg-slate-50" : "bg-white/[0.02]")}>
                <p className="text-lg font-bold text-green-500">{selectedData.speed?.toFixed(0) || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase">mph</p>
              </div>
              <div className={cn("rounded-xl p-3 text-center", L ? "bg-slate-50" : "bg-white/[0.02]")}>
                <p className="text-lg font-bold text-blue-500">{selectedData.heading ? `${Math.round(selectedData.heading)}°` : "—"}</p>
                <p className="text-[10px] text-slate-400 uppercase">Heading</p>
              </div>
              <div className={cn("rounded-xl p-3 text-center", L ? "bg-slate-50" : "bg-white/[0.02]")}>
                <p className={cn("text-lg font-bold", selectedData.isMoving ? "text-green-500" : "text-slate-400")}>{selectedData.isMoving ? "En Route" : "Idle"}</p>
                <p className="text-[10px] text-slate-400 uppercase">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Alerts ── */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Active Alerts</span>
            <Badge className="border-0 bg-red-500/15 text-red-500 text-[10px] font-bold ml-auto">{activeAlerts.length}</Badge>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeAlerts.map((alert: any) => (
                <div key={alert.id} className={cn("p-3.5 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn("border-0 text-[10px] font-bold uppercase",
                      alert.severity === "emergency" || alert.severity === "critical" ? "bg-red-500/15 text-red-500" : "bg-yellow-500/15 text-yellow-500"
                    )}>{alert.severity}</Badge>
                    <span className="text-[10px] text-slate-400">{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ""}</span>
                  </div>
                  <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{alert.userName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.type?.replace(/_/g, " ")}</p>
                  {alert.message && <p className={cn("text-xs mt-1.5", L ? "text-slate-600" : "text-slate-300")}>{alert.message}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
