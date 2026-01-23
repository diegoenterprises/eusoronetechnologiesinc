/**
 * ROLE-BASED MAP COMPONENT
 * Displays role-specific map views on dashboard
 * - Shipper: See truck locations
 * - Driver: See hauling job locations
 * - Broker: See both trucks and jobs
 * - Others: Role-appropriate view
 */

import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: "truck" | "job" | "terminal" | "warehouse";
  status: "active" | "pending" | "completed";
  details?: string;
}

interface RoleBasedMapProps {
  height?: string;
  onLocationClick?: (location: MapLocation) => void;
}

export default function RoleBasedMap({ height = "h-96", onLocationClick }: RoleBasedMapProps) {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<MapLocation[]>([]);

  const userRole = (user?.role || "user") as string;

  // Get role-specific locations
  const getRoleLocations = (): MapLocation[] => {
    const baseLocations = {
      shipper: [
        { id: "truck-1", lat: 27.7749, lng: -81.4744, title: "Johnson Transport", type: "truck" as const, status: "active" as const, details: "In Transit - 2 hours ETA" },
        { id: "truck-2", lat: 28.5383, lng: -81.3792, title: "Swift Logistics", type: "truck" as const, status: "active" as const, details: "In Transit - 4 hours ETA" },
        { id: "warehouse-1", lat: 27.9506, lng: -82.4572, title: "Tampa Warehouse", type: "warehouse" as const, status: "active" as const, details: "Ready for pickup" },
      ],
      driver: [
        { id: "job-1", lat: 27.7749, lng: -81.4744, title: "Current Job", type: "job" as const, status: "active" as const, details: "Pickup: Orlando → Delivery: Tampa" },
        { id: "job-2", lat: 28.5383, lng: -81.3792, title: "Next Job", type: "job" as const, status: "pending" as const, details: "Miami → Jacksonville" },
        { id: "terminal-1", lat: 27.9506, lng: -82.4572, title: "Terminal", type: "terminal" as const, status: "active" as const, details: "Fuel & rest stop" },
      ],
      broker: [
        { id: "truck-1", lat: 27.7749, lng: -81.4744, title: "Johnson Transport", type: "truck" as const, status: "active" as const, details: "In Transit" },
        { id: "truck-2", lat: 28.5383, lng: -81.3792, title: "Swift Logistics", type: "truck" as const, status: "active" as const, details: "In Transit" },
        { id: "job-1", lat: 27.9506, lng: -82.4572, title: "Load #001", type: "job" as const, status: "pending" as const, details: "Awaiting pickup" },
        { id: "job-2", lat: 28.2735, lng: -81.7273, title: "Load #002", type: "job" as const, status: "active" as const, details: "In Transit" },
      ],
    };

    return baseLocations[userRole.toLowerCase() as keyof typeof baseLocations] || baseLocations.shipper;
  };

  useEffect(() => {
    // Simulate loading map data
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        const roleLocations = getRoleLocations();
        setLocations(roleLocations);
        setLoading(false);
      } catch (err) {
        setError("Failed to load map data");
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userRole]);

  const getMarkerColor = (type: string, status?: string): string => {
    if (status === "active") {
      if (type === "truck") return "bg-blue-500";
      if (type === "job") return "bg-green-500";
      if (type === "terminal") return "bg-purple-500";
      return "bg-gray-500";
    }
    if (status === "pending") return "bg-yellow-500";
    
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
      default:
        return "#6B7280";
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <div ref={mapRef} className={`${height} relative bg-slate-900 flex items-center justify-center`}>
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-400" size={32} />
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertCircle className="text-red-400" size={32} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="w-full h-full relative">
            {/* Simplified Map Background */}
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">Google Maps Integration Ready</p>
                <p className="text-gray-600 text-xs">
                  {locations.length} {userRole.toLowerCase()} locations detected
                </p>
              </div>
            </div>

            {/* Location Markers Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {locations.map((location) => {
                // Simple grid positioning for demo
                const gridX = (location.lng + 82.5) * 50;
                const gridY = (location.lat - 27) * 80;

                return (
                  <div
                    key={location.id}
                    className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${gridX}%`, top: `${gridY}%` }}
                    onClick={() => onLocationClick?.(location)}
                  >
                    {/* Marker */}
                    <div
                      className={`w-8 h-8 rounded-full ${getMarkerColor(
                        location.type,
                        location.status
                      )} flex items-center justify-center text-lg shadow-lg transform group-hover:scale-125 transition-transform border-2 border-white`}
                    >
                    </div>

                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-lg p-2 whitespace-nowrap text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                      <p className="font-semibold">{location.title}</p>
                      {location.details && <p className="text-gray-400 text-xs">{location.details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs space-y-1">
              <p className="text-white font-semibold mb-2">Legend</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-400">Trucks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400">Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-400">Terminals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-400">Pending</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Locations List */}
      {!loading && !error && locations.length > 0 && (
        <div className="p-4 border-t border-slate-700 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 mb-2">Active Locations</p>
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                onClick={() => onLocationClick?.(location)}
                className="p-2 bg-slate-700/50 rounded border border-slate-600 hover:border-blue-500 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor(location.type) }}></div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{location.title}</p>
                    {location.details && <p className="text-gray-400 text-xs">{location.details}</p>}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      location.status === "active"
                        ? "bg-green-900/30 text-green-400"
                        : location.status === "pending"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-gray-900/30 text-gray-400"
                    }`}
                  >
                    {location.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

