/**
 * ROUTE MAP COMPONENT
 * Reusable Google Maps route display with:
 * - Purple-to-blue gradient polyline (#BE01FF → #1473FF)
 * - Light/dark mode map styles (auto-switches with theme)
 * - Origin (blue) and destination (purple) markers
 * - Directions API for real road routes
 * Use this component everywhere a route map is needed on the platform.
 */

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8892b0" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2d2d44" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a55" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a2b" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1f1f35" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f1f35" }] },
];

const LIGHT_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8d8f0" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d6f0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4edda" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
];

interface RouteMapProps {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  originLabel?: string;
  destLabel?: string;
  height?: string;
  className?: string;
  onDistanceCalculated?: (miles: number) => void;
}

export default function RouteMap({
  originLat,
  originLng,
  destLat,
  destLng,
  originLabel,
  destLabel,
  height = "300px",
  className = "",
  onDistanceCalculated,
}: RouteMapProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const segmentsRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // Poll for Google Maps availability
  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setReady(true); return; }
    const interval = setInterval(() => {
      if (check()) { setReady(true); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Update map styles when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({ styles: theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES });
  }, [theme]);

  // Render the map and route
  useEffect(() => {
    if (!ready || !mapContainerRef.current) return;
    const g = (window as any).google?.maps;
    if (!g) return;

    const hasCoords = originLat && originLng && destLat && destLng;
    const styles = theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;

    // Initialize map if not yet created
    if (!mapRef.current) {
      mapRef.current = new g.Map(mapContainerRef.current, {
        center: hasCoords
          ? { lat: (originLat + destLat) / 2, lng: (originLng + destLng) / 2 }
          : { lat: 39.8283, lng: -98.5795 },
        zoom: hasCoords ? 5 : 4,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        styles,
      });
    }

    if (!hasCoords) return;

    const origin = { lat: originLat, lng: originLng };
    const dest = { lat: destLat, lng: destLng };

    // Clear previous segments and markers
    segmentsRef.current.forEach((s: any) => s.setMap(null));
    segmentsRef.current = [];
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    // Use Directions API for real road route
    const directionsService = new g.DirectionsService();
    directionsService.route(
      { origin, destination: dest, travelMode: g.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status === "OK" && result) {
          const path = result.routes[0]?.overview_path || [];
          if (path.length > 1) {
            const totalPts = path.length;
            for (let i = 0; i < totalPts - 1; i++) {
              const t = i / (totalPts - 1);
              // Gradient from #BE01FF (purple) to #1473FF (blue)
              const r = Math.round(190 + (20 - 190) * t);
              const gr = Math.round(1 + (115 - 1) * t);
              const b = Math.round(255 + (255 - 255) * t);
              const color = `rgb(${r},${gr},${b})`;
              const seg = new g.Polyline({
                path: [path[i], path[i + 1]],
                strokeColor: color,
                strokeWeight: 5,
                strokeOpacity: 0.9,
                map: mapRef.current,
              });
              segmentsRef.current.push(seg);
            }

            // Origin marker (blue — end of gradient #1473FF)
            const originMarker = new g.Marker({
              position: origin,
              map: mapRef.current,
              icon: { path: g.SymbolPath.CIRCLE, scale: 10, fillColor: "#1473FF", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
              title: originLabel || "Origin",
            });
            markersRef.current.push(originMarker);

            // Destination marker (purple — start of gradient #BE01FF)
            const destMarker = new g.Marker({
              position: dest,
              map: mapRef.current,
              icon: { path: g.SymbolPath.CIRCLE, scale: 10, fillColor: "#BE01FF", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
              title: destLabel || "Destination",
            });
            markersRef.current.push(destMarker);

            // Fit bounds
            const bounds = new g.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(dest);
            mapRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });

            // Report distance
            const routeDistance = result.routes[0]?.legs?.[0]?.distance;
            if (routeDistance && onDistanceCalculated) {
              const miles = Math.round(routeDistance.value * 0.000621371);
              onDistanceCalculated(miles);
            }
          }
        }
      }
    );
  }, [ready, originLat, originLng, destLat, destLng, theme]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-xl overflow-hidden border ${theme === "dark" ? "border-white/[0.06]" : "border-slate-200"} ${className}`}
      style={{ height, width: "100%" }}
    />
  );
}

export { DARK_MAP_STYLES, LIGHT_MAP_STYLES };
