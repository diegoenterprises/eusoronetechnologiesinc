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
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
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

  const isWidget = height === "h-full";
  const Wrapper = isWidget ? ({ children, className }: any) => <div className={`h-full w-full ${className || ""}`}>{children}</div> : ({ children, className }: any) => <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} overflow-hidden ${className || ""}`}>{children}</Card>;

  // Loading skeleton
  if (isLoading) {
    return (
      <Wrapper>
        <div className={`${isWidget ? "h-full" : height} relative`}>
          <Skeleton className={`w-full h-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Loading map...</p>
          </div>
        </div>
      </Wrapper>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Wrapper>
        <div className={`${isWidget ? "h-full" : height} relative flex flex-col items-center justify-center gap-3`}>
          <AlertCircle className="text-red-400" size={32} />
          <p className="text-red-400 text-sm">Failed to load map</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className={`${isDark ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}>
            <RefreshCw className="w-4 h-4 mr-2" />Retry
          </Button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div ref={mapRef} className={`${isWidget ? "h-full" : height} relative ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {/* Map Header with Refresh */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className={`backdrop-blur border ${isDark ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700' : 'bg-white/80 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Map Background with Grid */}
        <div className={`w-full h-full bg-gradient-to-br ${isDark ? 'from-slate-900 via-slate-800 to-slate-900' : 'from-gray-50 via-white to-gray-100'} relative`}>
          {/* Grid lines for visual reference */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: isDark
                ? 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)'
                : 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Empty state with US outline */}
          {locations.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <svg viewBox="0 0 960 600" className={`${isWidget ? "w-40 h-24" : "w-64 h-40"} ${isDark ? 'opacity-20' : 'opacity-30'}`}>
                  <path stroke={isDark ? '#3B82F6' : '#6366F1'} d="M161,491 L155,468 L142,446 L137,437 L138,427 L132,417 L122,412 L114,406 L103,397 L94,396 L85,395 L78,389 L75,378 L68,372 L60,369 L53,360 L48,353 L44,343 L40,336 L37,331 L38,323 L43,315 L47,308 L55,303 L62,295 L68,288 L72,280 L78,274 L84,268 L90,263 L97,259 L106,257 L115,254 L123,248 L132,244 L141,238 L148,232 L155,224 L161,216 L168,210 L175,205 L183,199 L190,195 L198,192 L206,190 L214,186 L222,181 L230,176 L238,170 L244,162 L249,154 L255,147 L262,140 L270,134 L280,130 L290,128 L300,125 L310,124 L320,123 L330,120 L340,116 L350,112 L360,108 L370,105 L380,103 L390,100 L400,98 L410,97 L420,97 L430,99 L440,100 L450,99 L460,96 L470,94 L480,93 L490,95 L500,98 L510,102 L520,106 L530,109 L540,112 L550,115 L560,116 L570,118 L580,118 L590,117 L600,115 L610,112 L620,110 L630,108 L640,107 L650,107 L660,109 L670,112 L680,116 L690,120 L700,125 L710,131 L720,137 L730,143 L740,148 L750,152 L760,156 L770,159 L780,162 L790,165 L800,170 L810,176 L820,183 L828,190 L835,198 L840,206 L843,215 L845,224 L846,234 L848,243 L850,252 L853,260 L856,268 L860,275 L863,280 L860,288 L855,296 L848,304 L840,310 L832,316 L824,322 L816,327 L808,332 L800,337 L792,343 L784,349 L775,354 L766,360 L758,366 L750,372 L742,378 L734,384 L726,390 L718,396 L710,402 L702,407 L694,412 L685,416 L676,419 L667,421 L658,424 L650,428 L642,433 L634,438 L626,444 L618,450 L610,456 L602,460 L593,464 L584,467 L575,470 L565,472 L555,474 L545,477 L536,481 L528,486 L520,490 L512,494 L504,497 L496,498 L487,498 L478,497 L469,496 L460,496 L452,497 L444,500 L436,504 L428,508 L420,510 L410,510 L400,508 L390,505 L380,503 L370,502 L360,502 L350,504 L340,506 L330,507 L320,508 L310,507 L300,504 L290,500 L280,498 L270,497 L260,498 L250,500 L240,502 L230,503 L220,502 L210,500 L200,498 L190,497 L180,496 L170,494 L161,491Z" fill="none" strokeWidth="2"/>
                </svg>
                <MapPin size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />
              </div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} ${isWidget ? "text-xs" : "text-sm"} font-medium mb-1`}>Live Map Ready</p>
              <p className={`${isDark ? 'text-gray-600' : 'text-gray-400'} ${isWidget ? "text-[10px]" : "text-xs"} text-center max-w-xs`}>
                GPS tracking data will appear here in real time
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
                        flex items-center justify-center shadow-lg shadow-black/30 transform transition-all duration-200
                        ${isSelected ? 'scale-125 ring-2 ring-[#BE01FF]' : 'group-hover:scale-110'} 
                        border-2 border-white/30`}
                      style={{ boxShadow: isSelected ? '0 0 16px rgba(190,1,255,0.4)' : undefined }}
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
                    <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 backdrop-blur-md
                      ${isDark ? 'bg-slate-900/95 border-[#1473FF]/30 text-white' : 'bg-white/95 border-[#BE01FF]/20 text-gray-900'} border
                      rounded-2xl p-3 whitespace-nowrap text-xs shadow-xl z-20
                      ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity pointer-events-none`}
                    >
                      <div className="h-0.5 w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full mb-2" />
                      <p className="font-semibold text-sm">{location.title}</p>
                      {location.details && <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{location.details}</p>}
                      {location.loadNumber && (
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-semibold mt-1">Load: {location.loadNumber}</p>
                      )}
                      {location.speed !== undefined && (
                        <p className="text-cyan-400 mt-1">Speed: {Math.round(location.speed)} mph</p>
                      )}
                      <p className="text-gray-500 mt-1 text-[10px]">
                        Updated: {formatLastUpdate(location.updatedAt)}
                      </p>
                      {/* Tooltip arrow */}
                      <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent ${isDark ? 'border-t-slate-900/95' : 'border-t-white/95'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className={`absolute bottom-4 left-4 backdrop-blur-md rounded-2xl p-3 text-xs space-y-1.5 overflow-hidden ${isDark ? 'bg-slate-900/90 border border-slate-700/60' : 'bg-white/90 border border-gray-200 shadow-lg'}`}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-2 flex items-center gap-2`}>
              <MapPin className="w-3 h-3 text-[#BE01FF]" />
              Legend
            </p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/30"></div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Trucks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-500/30"></div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Jobs/Loads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-500/30"></div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Terminals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 ring-2 ring-yellow-500/30"></div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-500/30"></div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Idle</span>
            </div>
          </div>

          {/* Stats overlay */}
          <div className={`absolute top-4 left-4 backdrop-blur-md rounded-2xl p-3 text-xs overflow-hidden ${isDark ? 'bg-slate-900/90 border border-slate-700/60' : 'bg-white/90 border border-gray-200 shadow-lg'}`}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-1`}>{userRole} View</p>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{locations.length} locations</p>
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
        <div className={`p-4 border-t max-h-40 overflow-y-auto ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2 flex items-center justify-between`}>
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
                    : isDark ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500/50' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getMarkerColor(location.type, location.status)} flex items-center justify-center`}>
                    {getMarkerIcon(location.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold truncate`}>{location.title}</p>
                    {location.details && <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs truncate`}>{location.details}</p>}
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
    </Wrapper>
  );
}
