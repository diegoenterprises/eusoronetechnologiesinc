/**
 * FLEET MAP — Real-time fleet tracking map for carriers and catalysts
 * Vehicle markers with color by status (green=moving, yellow=stopped, red=idle)
 * Click marker for driver card. Wired to location.tracking.getFleetMap
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck, MapPin, Navigation2, Search, RefreshCw, Clock,
  Gauge, User, Package, ChevronRight, Signal, Filter,
} from "lucide-react";
import { useFleetTracking } from "@/hooks/useLocationTracking";

const STATUS_COLORS: Record<string, string> = {
  moving: "bg-green-500",
  stopped: "bg-yellow-500",
  idle: "bg-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  moving: "Moving",
  stopped: "Stopped",
  idle: "Idle",
};

export default function FleetMap() {
  const { fleetMap, isLoading, refetch } = useFleetTracking({ refetchInterval: 15000 });
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const vehicles = (fleetMap.vehicles || []).filter((v: any) => {
    if (search && !v.unitNumber?.toLowerCase().includes(search.toLowerCase()) &&
        !v.driverName?.toLowerCase().includes(search.toLowerCase()) &&
        !v.loadNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    return true;
  });

  const selected = vehicles.find((v: any) => v.vehicleId === selectedVehicle);

  const stats = {
    total: fleetMap.vehicles?.length || 0,
    moving: fleetMap.vehicles?.filter((v: any) => v.status === "moving").length || 0,
    stopped: fleetMap.vehicles?.filter((v: any) => v.status === "stopped").length || 0,
    idle: fleetMap.vehicles?.filter((v: any) => v.status === "idle").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Fleet</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Moving</p>
              <p className="text-lg font-bold text-green-600">{stats.moving}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Stopped</p>
              <p className="text-lg font-bold text-yellow-600">{stats.stopped}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <div>
              <p className="text-xs text-muted-foreground">Idle</p>
              <p className="text-lg font-bold text-gray-500">{stats.idle}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Area */}
        <Card className="lg:col-span-2 min-h-[500px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Fleet Map
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg min-h-[400px] flex items-center justify-center overflow-hidden">
              {/* Map placeholder — renders vehicle dots positionally */}
              {vehicles.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No vehicles with active GPS</p>
                </div>
              ) : (
                <div className="absolute inset-4 grid grid-cols-6 grid-rows-4 gap-1">
                  {vehicles.map((v: any, i: number) => (
                    <button
                      key={v.vehicleId}
                      onClick={() => setSelectedVehicle(v.vehicleId)}
                      className={`relative flex flex-col items-center justify-center rounded-lg border transition-all
                        ${selectedVehicle === v.vehicleId
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-lg scale-105"
                          : "border-transparent hover:border-blue-300 hover:bg-white/50 dark:hover:bg-white/5"}
                      `}
                    >
                      <div className={`h-4 w-4 rounded-full ${STATUS_COLORS[v.status] || "bg-gray-400"} shadow-sm`} />
                      <span className="text-[9px] mt-0.5 font-medium truncate max-w-full px-1">
                        {v.unitNumber}
                      </span>
                      {v.speed > 0 && (
                        <span className="text-[8px] text-muted-foreground">{Math.round(v.speed)} mph</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                {fleetMap.lastUpdated ? `Updated: ${new Date(fleetMap.lastUpdated).toLocaleTimeString()}` : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vehicles</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs border rounded-md px-2"
              >
                <option value="all">All</option>
                <option value="moving">Moving</option>
                <option value="stopped">Stopped</option>
                <option value="idle">Idle</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="max-h-[450px] overflow-y-auto space-y-1">
            {vehicles.map((v: any) => (
              <button
                key={v.vehicleId}
                onClick={() => setSelectedVehicle(v.vehicleId)}
                className={`w-full text-left p-2 rounded-lg border transition-all text-xs
                  ${selectedVehicle === v.vehicleId
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
                    : "border-transparent hover:bg-muted/50"}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[v.status]}`} />
                    <span className="font-medium">{v.unitNumber}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {STATUS_LABELS[v.status] || v.status}
                  </Badge>
                </div>
                <div className="mt-1 text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {v.driverName}
                </div>
                {v.loadNumber && (
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {v.loadNumber}
                    {v.destination && <span className="ml-1">{v.destination}</span>}
                  </div>
                )}
                {v.speed > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <Gauge className="h-3 w-3" />
                    {Math.round(v.speed)} mph
                    <Navigation2 className="h-3 w-3 ml-1" style={{ transform: `rotate(${v.heading}deg)` }} />
                  </div>
                )}
              </button>
            ))}
            {vehicles.length === 0 && !isLoading && (
              <p className="text-center text-xs text-muted-foreground py-4">No vehicles found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Vehicle Detail */}
      {selected && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${STATUS_COLORS[selected.status]}`} />
                <div>
                  <h3 className="font-semibold">{selected.unitNumber}</h3>
                  <p className="text-sm text-muted-foreground">{selected.driverName}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                {selected.loadNumber && (
                  <p className="font-medium">Load {selected.loadNumber}</p>
                )}
                {selected.destination && (
                  <p className="text-muted-foreground">{selected.destination}</p>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-4 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Speed</p>
                <p className="font-bold">{Math.round(selected.speed)} mph</p>
              </div>
              <div>
                <p className="text-muted-foreground">Heading</p>
                <p className="font-bold">{Math.round(selected.heading)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lat</p>
                <p className="font-bold">{selected.lat?.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lng</p>
                <p className="font-bold">{selected.lng?.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
