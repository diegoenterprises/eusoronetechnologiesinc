/**
 * DISPATCH FLEET MAP PAGE — WS-DISPATCH-OVERHAUL Phase 3
 * Real Google Maps integration with layers (Traffic, Satellite)
 * Live fleet positions, marker clustering, InfoWindow popups
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, TrafficLayer } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Truck, Clock, AlertTriangle, Navigation,
  Phone, MessageSquare, RefreshCw, Layers, Maximize2,
  Satellite, Car, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 31.9686, lng: -99.9018 }; // Texas center
const DEFAULT_ZOOM = 6;

const MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

interface FleetVehicle {
  vehicleId: number;
  unitNumber: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: string;
  driverName: string;
  loadNumber: string | null;
  destination: string | null;
  updatedAt: string;
}

function getMarkerIcon(status: string, isSelected: boolean): string {
  const color = status === "moving" ? "%2322c55e" : status === "stopped" ? "%23f59e0b" : "%2364748b";
  const size = isSelected ? 14 : 10;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  )}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "moving": case "in_transit": return "bg-green-500";
    case "stopped": case "loading": case "unloading": return "bg-yellow-500";
    case "available": return "bg-emerald-500";
    case "off_duty": return "bg-slate-500";
    default: return "bg-slate-500";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "moving": return "Moving";
    case "stopped": return "Stopped";
    case "in_transit": return "In Transit";
    case "loading": return "Loading";
    case "unloading": return "Unloading";
    case "available": return "Available";
    case "off_duty": return "Off Duty";
    default: return status;
  }
}

export default function DispatchFleetMap() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [infoWindowVehicleId, setInfoWindowVehicleId] = useState<number | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("roadmap");
  const [showLabels, setShowLabels] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Google Maps is already loaded via index.html script tag — detect it
  const { isLoaded } = useJsApiLoader({
    id: "eusotrip-fleet-map",
    googleMapsApiKey: "", // Already loaded in index.html
  });

  // Also check if window.google is directly available (fallback)
  const [mapsReady, setMapsReady] = useState(false);
  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => {
      if (check()) { setMapsReady(true); clearInterval(interval); }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const mapAvailable = isLoaded || mapsReady;

  // ── Data Queries ──
  const fleetQuery = (trpc as any).location.tracking.getFleetMap.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );
  const statsQuery = (trpc as any).dispatchRole.getFleetStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const vehicles: FleetVehicle[] = useMemo(() => {
    const raw = (fleetQuery.data as any)?.vehicles || [];
    if (statusFilter === "all") return raw;
    return raw.filter((v: FleetVehicle) => v.status === statusFilter);
  }, [fleetQuery.data, statusFilter]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Fit bounds to all vehicles
    if (vehicles.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      vehicles.forEach((v: FleetVehicle) => bounds.extend({ lat: v.lat, lng: v.lng }));
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [vehicles]);

  const handleVehicleSelect = useCallback((vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setInfoWindowVehicleId(vehicleId);
    const v = vehicles.find((v: FleetVehicle) => v.vehicleId === vehicleId);
    if (v && mapRef.current) {
      mapRef.current.panTo({ lat: v.lat, lng: v.lng });
      mapRef.current.setZoom(12);
    }
  }, [vehicles]);

  const handleRefresh = () => {
    fleetQuery.refetch();
    statsQuery.refetch();
  };

  const selectedVehicle = vehicles.find((v: FleetVehicle) => v.vehicleId === infoWindowVehicleId);

  const statCounts = useMemo(() => {
    const all = (fleetQuery.data as any)?.vehicles || [];
    return {
      total: all.length,
      moving: all.filter((v: FleetVehicle) => v.status === "moving").length,
      stopped: all.filter((v: FleetVehicle) => v.status === "stopped").length,
    };
  }, [fleetQuery.data]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" aria-hidden="true" />
            Fleet Map
          </h1>
          <div className="hidden md:flex items-center gap-3 ml-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-400">Moving:</span>
              <span className="text-green-400 font-semibold">{statCounts.moving}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-slate-400">Stopped:</span>
              <span className="text-yellow-400 font-semibold">{statCounts.stopped}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total:</span>
              <span className="text-white font-semibold">{statCounts.total}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Toggles */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              size="sm"
              variant={showTraffic ? "default" : "outline"}
              className={cn("h-7 px-2 text-xs rounded-md", showTraffic ? "bg-green-600 hover:bg-green-500" : "border-white/[0.08] bg-white/[0.02]")}
              onClick={() => setShowTraffic(!showTraffic)}
              aria-label="Toggle traffic layer"
            >
              <Car className="w-3 h-3 mr-1" aria-hidden="true" />Traffic
            </Button>
            <Button
              size="sm"
              variant={mapType === "satellite" || mapType === "hybrid" ? "default" : "outline"}
              className={cn("h-7 px-2 text-xs rounded-md", mapType !== "roadmap" ? "bg-blue-600 hover:bg-blue-500" : "border-white/[0.08] bg-white/[0.02]")}
              onClick={() => setMapType(prev => prev === "roadmap" ? "hybrid" : "roadmap")}
              aria-label="Toggle satellite view"
            >
              <Satellite className="w-3 h-3 mr-1" aria-hidden="true" />Satellite
            </Button>
            <Button
              size="sm"
              variant={showLabels ? "default" : "outline"}
              className={cn("h-7 px-2 text-xs rounded-md", showLabels ? "bg-purple-600 hover:bg-purple-500" : "border-white/[0.08] bg-white/[0.02]")}
              onClick={() => setShowLabels(!showLabels)}
              aria-label="Toggle map labels"
            >
              {showLabels ? <Eye className="w-3 h-3 mr-1" aria-hidden="true" /> : <EyeOff className="w-3 h-3 mr-1" aria-hidden="true" />}
              Labels
            </Button>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-7 text-xs bg-white/[0.04] border-white/[0.08] rounded-md" aria-label="Filter by vehicle status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-md"
            onClick={handleRefresh}
            aria-label="Refresh fleet positions"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", fleetQuery.isFetching && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Map + Vehicle List */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {!mapAvailable || fleetQuery.isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-slate-400">Loading map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              onLoad={onMapLoad}
              mapTypeId={mapType}
              options={{
                styles: mapType === "roadmap" ? MAP_DARK_STYLES : undefined,
                disableDefaultUI: true,
                zoomControl: true,
                scaleControl: true,
                fullscreenControl: true,
                mapTypeControl: false,
              }}
            >
              {/* Traffic Layer */}
              {showTraffic && <TrafficLayer />}

              {/* Vehicle Markers */}
              {vehicles.map((v: FleetVehicle) => (
                <Marker
                  key={v.vehicleId}
                  position={{ lat: v.lat, lng: v.lng }}
                  icon={{
                    url: getMarkerIcon(v.status, selectedVehicleId === v.vehicleId),
                    scaledSize: new google.maps.Size(
                      selectedVehicleId === v.vehicleId ? 28 : 20,
                      selectedVehicleId === v.vehicleId ? 28 : 20
                    ),
                    anchor: new google.maps.Point(
                      selectedVehicleId === v.vehicleId ? 14 : 10,
                      selectedVehicleId === v.vehicleId ? 14 : 10
                    ),
                  }}
                  title={`${v.unitNumber} — ${v.driverName}`}
                  onClick={() => {
                    setSelectedVehicleId(v.vehicleId);
                    setInfoWindowVehicleId(v.vehicleId);
                  }}
                />
              ))}

              {/* InfoWindow */}
              {selectedVehicle && (
                <InfoWindow
                  position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                  onCloseClick={() => setInfoWindowVehicleId(null)}
                >
                  <div className="p-1 min-w-[180px]" style={{ color: "#1e293b" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(selectedVehicle.status))} />
                      <span className="font-bold text-sm">{selectedVehicle.unitNumber}</span>
                      <span className="text-xs text-gray-500 ml-auto">{getStatusLabel(selectedVehicle.status)}</span>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p><span className="text-gray-500">Driver:</span> {selectedVehicle.driverName}</p>
                      {selectedVehicle.speed > 0 && (
                        <p><span className="text-gray-500">Speed:</span> {selectedVehicle.speed} mph</p>
                      )}
                      {selectedVehicle.loadNumber && (
                        <p><span className="text-gray-500">Load:</span> {selectedVehicle.loadNumber}</p>
                      )}
                      {selectedVehicle.destination && (
                        <p><span className="text-gray-500">Dest:</span> {selectedVehicle.destination}</p>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Last Updated */}
          {(fleetQuery.data as any)?.lastUpdated && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-slate-400">
              <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Updated {new Date((fleetQuery.data as any).lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Vehicle Sidebar */}
        <div className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="p-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              Vehicles
              <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs ml-auto">{vehicles.length}</Badge>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fleetQuery.isLoading ? (
              Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No vehicles with GPS data</p>
              </div>
            ) : (
              vehicles.map((v: FleetVehicle) => (
                <div
                  key={v.vehicleId}
                  className={cn(
                    "p-2.5 rounded-lg border cursor-pointer transition-all",
                    selectedVehicleId === v.vehicleId
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                  onClick={() => handleVehicleSelect(v.vehicleId)}
                  role="button"
                  aria-label={`Select vehicle ${v.unitNumber}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(v.status))} />
                      <span className="text-xs font-medium text-white">{v.unitNumber}</span>
                    </div>
                    <Badge className={cn(
                      "border-0 text-xs px-1.5 py-0",
                      v.status === "moving" ? "bg-green-500/20 text-green-400"
                        : v.status === "stopped" ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-slate-500/20 text-slate-400"
                    )}>
                      {getStatusLabel(v.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="truncate">{v.driverName}</p>
                    {v.speed > 0 && <p>{v.speed} mph</p>}
                    {v.loadNumber && (
                      <p className="text-cyan-400 flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5" aria-hidden="true" />
                        {v.loadNumber}
                      </p>
                    )}
                    {v.destination && (
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                        {v.destination}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
