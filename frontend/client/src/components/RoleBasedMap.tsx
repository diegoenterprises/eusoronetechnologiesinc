/**
 * ROLE-BASED MAP COMPONENT
 * Displays role-specific map views on dashboard
 * - Shipper: See truck locations
 * - Driver: See hauling job locations
 * - Broker: See both trucks and jobs
 * - Others: Role-appropriate view
 * 
 * PRODUCTION-READY: Uses tRPC queries with WebSocket real-time updates
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MapPin, AlertCircle, RefreshCw, Truck, Package, Building2, Warehouse } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useFleetTracking } from "@/hooks/useRealtimeEvents";

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: "truck" | "job" | "terminal" | "warehouse" | "driver";
  status: "active" | "pending" | "completed" | "idle";
  details?: string;
  vehicleId?: string;
  loadNumber?: string;
  speed?: number;
  heading?: number;
  updatedAt?: string;
}

interface RoleBasedMapProps {
  height?: string;
  onLocationClick?: (location: MapLocation) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function RoleBasedMap({ 
  height = "h-96", 
  onLocationClick,
  autoRefresh = true,
  refreshInterval = 30000,
}: RoleBasedMapProps) {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  const userRole = (user?.role || "SHIPPER") as string;
  const companyId = user?.companyId || null;

  // tRPC query for role-specific map locations
  const { 
    data: mapData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = trpc.tracking.getRoleMapLocations.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 15000,
  });

  // WebSocket real-time updates for fleet tracking
  const { vehicles: realtimeVehicles } = useFleetTracking(companyId);

  // Merge tRPC data with real-time WebSocket updates
  const locations: MapLocation[] = useCallback(() => {
    if (!mapData?.locations) return [];
    
    // Create a map of locations for easy lookup
    const locationMap = new Map(mapData.locations.map(loc => [loc.id, loc]));
    
    // Update with real-time positions from WebSocket
    realtimeVehicles.forEach(vehicle => {
      const existingKey = `vehicle-${vehicle.vehicleId}`;
      if (locationMap.has(existingKey)) {
        const existing = locationMap.get(existingKey)!;
        locationMap.set(existingKey, {
          ...existing,
          lat: (vehicle as any).latitude || vehicle.lat,
          lng: (vehicle as any).longitude || vehicle.lng,
          speed: vehicle.speed,
          heading: vehicle.heading,
          updatedAt: vehicle.timestamp,
        });
      }
    });
    
    return Array.from(locationMap.values());
  }, [mapData?.locations, realtimeVehicles])();

  const getMarkerColor = (type: string, status?: string): string => {
    if (status === "active") {
      if (type === "truck") return "bg-blue-500";
      if (type === "job") return "bg-green-500";
      if (type === "terminal") return "bg-purple-500";
      if (type === "driver") return "bg-cyan-500";
      return "bg-gray-500";
    }
    if (status === "pending") return "bg-yellow-500";
    if (status === "idle") return "bg-orange-500";
    if (status === "completed") return "bg-emerald-500";
    
    // Default hex colors for legend
    switch (type) {
      case "truck":
        return "#3B82F6";
      case "job":
        return "#10B981";
      case "terminal":
        return "#EC4899";
      case "warehouse":
        return "#F59E0B";
      case "driver":
        return "#06B6D4";
      default:
        return "#6B7280";
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "truck":
        return <Truck className="w-4 h-4 text-white" />;
      case "job":
        return <Package className="w-4 h-4 text-white" />;
      case "terminal":
        return <Building2 className="w-4 h-4 text-white" />;
      case "warehouse":
        return <Warehouse className="w-4 h-4 text-white" />;
      default:
        return <MapPin className="w-4 h-4 text-white" />;
    }
  };

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location);
    onLocationClick?.(location);
  };

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className={`${height} relative`}>
          <Skeleton className="w-full h-full bg-slate-700" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-400" size={32} />
            <p className="text-gray-400 text-sm">Loading map data...</p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700">
          <Skeleton className="h-4 w-32 mb-2 bg-slate-700" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full bg-slate-700" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className={`${height} relative flex flex-col items-center justify-center gap-4`}>
          <AlertCircle className="text-red-400" size={48} />
          <p className="text-red-400 text-sm">Failed to load map data</p>
          <p className="text-gray-500 text-xs">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <div ref={mapRef} className={`${height} relative bg-slate-900`}>
        {/* Map Header with Refresh */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="bg-slate-800/80 backdrop-blur border border-slate-700 text-white hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Map Background with Grid */}
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          {/* Grid lines for visual reference */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Empty state */}
          {locations.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <MapPin size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-500 text-sm mb-2">No active locations</p>
              <p className="text-gray-600 text-xs">
                Tracking data will appear here when available
              </p>
            </div>
          )}

          {/* Location Markers Overlay */}
          {locations.length > 0 && (
            <div className="absolute inset-0">
              {locations.map((location) => {
                // Calculate position based on lat/lng relative to US bounds
                // This is a simplified visualization - real implementation would use Google Maps
                const minLat = 24, maxLat = 50;
                const minLng = -125, maxLng = -66;
                const x = ((location.lng - minLng) / (maxLng - minLng)) * 100;
                const y = ((maxLat - location.lat) / (maxLat - minLat)) * 100;
                
                const isSelected = selectedLocation?.id === location.id;

                return (
                  <div
                    key={location.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-10"
                    style={{ 
                      left: `${Math.min(95, Math.max(5, x))}%`, 
                      top: `${Math.min(95, Math.max(5, y))}%` 
                    }}
                    onClick={() => handleLocationClick(location)}
                  >
                    {/* Pulse animation for active */}
                    {location.status === 'active' && (
                      <div className={`absolute inset-0 rounded-full ${getMarkerColor(location.type, location.status)} animate-ping opacity-30`} />
                    )}
                    
                    {/* Marker */}
                    <div
                      className={`w-10 h-10 rounded-full ${getMarkerColor(location.type, location.status)} 
                        flex items-center justify-center shadow-lg transform transition-all duration-200
                        ${isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'} 
                        border-2 border-white/50`}
                    >
                      {getMarkerIcon(location.type)}
                    </div>

                    {/* Speed indicator for moving vehicles */}
                    {location.speed && location.speed > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {Math.round(location.speed)}
                      </div>
                    )}

                    {/* Tooltip */}
                    <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-slate-900 border border-slate-600 
                      rounded-lg p-3 whitespace-nowrap text-xs text-white shadow-xl z-20
                      ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity pointer-events-none`}
                    >
                      <p className="font-semibold text-sm">{location.title}</p>
                      {location.details && <p className="text-gray-400 mt-1">{location.details}</p>}
                      {location.loadNumber && (
                        <p className="text-blue-400 mt-1">Load: {location.loadNumber}</p>
                      )}
                      {location.speed !== undefined && (
                        <p className="text-cyan-400 mt-1">Speed: {Math.round(location.speed)} mph</p>
                      )}
                      <p className="text-gray-500 mt-1 text-[10px]">
                        Updated: {formatLastUpdate(location.updatedAt)}
                      </p>
                      {/* Tooltip arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs space-y-1.5">
            <p className="text-white font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Legend
            </p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-400">Trucks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-400">Jobs/Loads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-400">Terminals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-400">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-400">Idle</span>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs">
            <p className="text-white font-semibold mb-1">{userRole} View</p>
            <p className="text-gray-400">{locations.length} locations</p>
            {mapData?.lastUpdated && (
              <p className="text-gray-500 text-[10px] mt-1">
                Last sync: {formatLastUpdate(mapData.lastUpdated)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="p-4 border-t border-slate-700 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
            <span>Active Locations ({locations.length})</span>
            {isRefetching && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
          </p>
          <div className="space-y-2">
            {locations.slice(0, 10).map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationClick(location)}
                className={`p-2 rounded border cursor-pointer transition-all text-xs
                  ${selectedLocation?.id === location.id 
                    ? 'bg-blue-500/20 border-blue-500' 
                    : 'bg-slate-700/50 border-slate-600 hover:border-blue-500/50'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getMarkerColor(location.type, location.status)} flex items-center justify-center`}>
                    {getMarkerIcon(location.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{location.title}</p>
                    {location.details && <p className="text-gray-400 text-xs truncate">{location.details}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        location.status === "active"
                          ? "bg-green-900/50 text-green-400"
                          : location.status === "pending"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : location.status === "idle"
                          ? "bg-orange-900/50 text-orange-400"
                          : "bg-gray-900/50 text-gray-400"
                      }`}
                    >
                      {location.status}
                    </span>
                    {location.speed !== undefined && location.speed > 0 && (
                      <span className="text-cyan-400 text-[10px]">{Math.round(location.speed)} mph</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {locations.length > 10 && (
              <p className="text-center text-gray-500 text-xs py-2">
                +{locations.length - 10} more locations
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

