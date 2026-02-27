/**
 * TelemetryMap - Reusable map component for GPS tracking, routes, and geofences
 * Uses Google Maps JavaScript API (loaded in index.html)
 * Dark mode uses Google Maps built-in dark styling
 */

import { useEffect, useRef, useState } from "react";

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
  darkMode?: boolean;
  onMarkerClick?: (marker: Location) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Google Maps dark mode style — matches EusoTrip dark slate theme
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e40af" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1929" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f2818" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

function markerColor(type?: string, isMoving?: boolean): string {
  if (type === "alert") return "#ef4444";
  if (type === "driver" && isMoving) return "#22c55e";
  if (type === "driver") return "#3b82f6";
  if (type === "vehicle") return "#8b5cf6";
  return "#3b82f6";
}

function createMarkerIcon(color: string, pulse = false): google.maps.Icon | google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: pulse ? 10 : 8,
  };
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
  darkMode = false,
  onMarkerClick,
  onMapClick,
}: TelemetryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<(google.maps.Marker | google.maps.Polyline | google.maps.Circle | google.maps.Polygon | google.maps.InfoWindow)[]>([]);
  const [mapsReady, setMapsReady] = useState(false);

  // Wait for Google Maps API to be available
  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => {
      if (check()) { setMapsReady(true); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapsReady || !containerRef.current || mapRef.current) return;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom,
      disableDefaultUI: !showControls,
      zoomControl: showControls,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: darkMode ? DARK_MAP_STYLES : undefined,
      gestureHandling: "greedy",
    });

    mapRef.current = map;

    if (onMapClick) {
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) onMapClick(e.latLng.lat(), e.latLng.lng());
      });
    }

    return () => {
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // Update dark mode styles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ styles: darkMode ? DARK_MAP_STYLES : [] });
  }, [darkMode]);

  // Update center/zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat: center.lat, lng: center.lng });
    map.setZoom(zoom);
  }, [center.lat, center.lng, zoom]);

  // Update markers, route, geofences, currentLocation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing overlays
    overlaysRef.current.forEach(o => {
      if (o instanceof google.maps.Marker) o.setMap(null);
      else if (o instanceof google.maps.Polyline) o.setMap(null);
      else if (o instanceof google.maps.Circle) o.setMap(null);
      else if (o instanceof google.maps.Polygon) o.setMap(null);
    });
    overlaysRef.current = [];

    // Route polyline
    if (route && route.points.length > 1) {
      const polyline = new google.maps.Polyline({
        path: route.points.map(p => ({ lat: p.lat, lng: p.lng })),
        strokeColor: route.color || "#3b82f6",
        strokeWeight: 4,
        strokeOpacity: 0.8,
        map,
      });
      overlaysRef.current.push(polyline);
    }

    // Geofences
    geofences.forEach(gf => {
      if (gf.center && gf.radius) {
        const circle = new google.maps.Circle({
          center: { lat: gf.center.lat, lng: gf.center.lng },
          radius: gf.radius,
          strokeColor: "#f97316",
          strokeWeight: 2,
          fillColor: "#f97316",
          fillOpacity: 0.1,
          map,
        });
        overlaysRef.current.push(circle);

        const infoWindow = new google.maps.InfoWindow({
          content: `<b>${gf.name}</b><br/>${gf.type}`,
        });
        circle.addListener("click", () => {
          infoWindow.setPosition({ lat: gf.center!.lat, lng: gf.center!.lng });
          infoWindow.open(map);
        });
        overlaysRef.current.push(infoWindow);
      }
      if (gf.polygon && gf.polygon.length > 2) {
        const polygon = new google.maps.Polygon({
          paths: gf.polygon.map(p => ({ lat: p.lat, lng: p.lng })),
          strokeColor: "#f97316",
          strokeWeight: 2,
          fillColor: "#f97316",
          fillOpacity: 0.1,
          map,
        });
        overlaysRef.current.push(polygon);
      }
    });

    // Markers
    markers.forEach(m => {
      const color = markerColor(m.type, m.isMoving);
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        icon: createMarkerIcon(color, m.isMoving),
        title: m.label || "Location",
      });

      const speedStr = m.speed !== undefined && m.speed > 0 ? `<br/>Speed: ${m.speed.toFixed(0)} mph` : "";
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#1e293b"><b>${m.label || "Location"}</b>${speedStr}<br/>${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}</div>`,
      });
      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        if (onMarkerClick) onMarkerClick(m);
      });

      overlaysRef.current.push(marker);
      overlaysRef.current.push(infoWindow);
    });

    // Current location (pulsing green dot)
    if (currentLocation) {
      const marker = new google.maps.Marker({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        map,
        icon: createMarkerIcon("#22c55e", true),
        title: currentLocation.label || "Your Location",
        zIndex: 999,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#1e293b"><b>${currentLocation.label || "Your Location"}</b><br/>${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}</div>`,
      });
      marker.addListener("click", () => infoWindow.open(map, marker));

      // Pulsing animation via marker circle overlay
      const pulseCircle = new google.maps.Circle({
        center: { lat: currentLocation.lat, lng: currentLocation.lng },
        radius: 40,
        strokeColor: "#22c55e",
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.15,
        map,
      });

      overlaysRef.current.push(marker, infoWindow, pulseCircle);
    }
  }, [markers, route, geofences, currentLocation, onMarkerClick]);

  // Fallback if Google Maps not available
  if (!mapsReady) {
    return (
      <div
        className="relative rounded-lg overflow-hidden border border-border flex items-center justify-center bg-slate-900/50"
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height, isolation: "isolate", position: "relative", zIndex: 0 }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default TelemetryMap;
