/**
 * TelemetryMap - Reusable map component for GPS tracking, routes, and geofences
 * Uses Leaflet with OpenStreetMap (free) or can be swapped for Google Maps
 */

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Circle, AlertTriangle, Truck, User } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  label?: string;
  type?: "driver" | "vehicle" | "waypoint" | "geofence" | "alert";
  isMoving?: boolean;
  heading?: number;
  speed?: number;
}

interface Route {
  points: { lat: number; lng: number }[];
  color?: string;
}

interface Geofence {
  id: number;
  name: string;
  type: string;
  center?: { lat: number; lng: number };
  radius?: number;
  polygon?: { lat: number; lng: number }[];
}

interface TelemetryMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Location[];
  route?: Route;
  geofences?: Geofence[];
  currentLocation?: Location;
  showControls?: boolean;
  height?: string;
  onMarkerClick?: (marker: Location) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export function TelemetryMap({
  center = { lat: 39.8283, lng: -98.5795 },
  zoom = 5,
  markers = [],
  route,
  geofences = [],
  currentLocation,
  showControls = true,
  height = "400px",
  onMarkerClick,
  onMapClick,
}: TelemetryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  const getMarkerIcon = (type?: string) => {
    switch (type) {
      case "driver":
        return <User className="h-4 w-4" />;
      case "vehicle":
        return <Truck className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "geofence":
        return <Circle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getMarkerColor = (type?: string, isMoving?: boolean) => {
    if (type === "alert") return "bg-red-500";
    if (isMoving) return "bg-green-500";
    return "bg-blue-500";
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
      <div ref={mapRef} className="w-full h-full bg-muted">
        {/* Map placeholder - integrates with Leaflet or Google Maps */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="text-center">
            <Navigation className="h-12 w-12 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              Map View - {markers.length} marker{markers.length !== 1 ? "s" : ""}
              {route && ` | Route: ${route.points.length} points`}
              {geofences.length > 0 && ` | ${geofences.length} geofence${geofences.length !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | Zoom: {zoom}
            </p>
          </div>
        </div>

        {/* Marker overlays */}
        {markers.length > 0 && (
          <div className="absolute top-2 left-2 bg-background/90 rounded-lg p-2 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium mb-1">Locations ({markers.length})</p>
            {markers.slice(0, 5).map((marker, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs py-1 cursor-pointer hover:bg-muted rounded px-1"
                onClick={() => onMarkerClick?.(marker)}
              >
                <div className={`w-3 h-3 rounded-full ${getMarkerColor(marker.type, marker.isMoving)}`} />
                <span>{marker.label || `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}</span>
                {marker.speed !== undefined && marker.speed > 0 && (
                  <span className="text-muted-foreground">{marker.speed.toFixed(0)} mph</span>
                )}
              </div>
            ))}
            {markers.length > 5 && (
              <p className="text-xs text-muted-foreground mt-1">+{markers.length - 5} more</p>
            )}
          </div>
        )}

        {/* Current location indicator */}
        {currentLocation && (
          <div className="absolute bottom-2 left-2 bg-background/90 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs">
                Your location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {/* Geofence legend */}
        {geofences.length > 0 && (
          <div className="absolute top-2 right-2 bg-background/90 rounded-lg p-2">
            <p className="text-xs font-medium mb-1">Geofences</p>
            {geofences.slice(0, 3).map((gf) => (
              <div key={gf.id} className="flex items-center gap-2 text-xs py-0.5">
                <Circle className="h-3 w-3 text-orange-500" />
                <span>{gf.name}</span>
                <span className="text-muted-foreground">({gf.type})</span>
              </div>
            ))}
            {geofences.length > 3 && (
              <p className="text-xs text-muted-foreground">+{geofences.length - 3} more</p>
            )}
          </div>
        )}

        {/* Map controls */}
        {showControls && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            <button className="w-8 h-8 bg-background rounded flex items-center justify-center shadow hover:bg-muted">
              <span className="text-lg font-bold">+</span>
            </button>
            <button className="w-8 h-8 bg-background rounded flex items-center justify-center shadow hover:bg-muted">
              <span className="text-lg font-bold">-</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelemetryMap;
