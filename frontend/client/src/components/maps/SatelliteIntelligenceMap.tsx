/**
 * SATELLITE INTELLIGENCE MAP — EusoTrip Spatial Intelligence
 *
 * Google Maps Satellite imagery + real-time freight data fusion.
 * Reverse-engineered from spatial intelligence platforms for logistics.
 *
 * Layers:
 *  1. Demand Heat (HeatmapLayer)
 *  2. Hot Zone Circles (severity-coded with pulsing)
 *  3. Facility Markers (terminals, refineries, ports)
 *  4. Live Fleet Pings (from roadIntel)
 *  5. Weather Events (from map intel)
 *  6. Natural Hazards (earthquakes, wildfires, hazmat)
 *
 * Per-Role Defaults:
 *  SHIPPER      → demand heat + facilities + fleet
 *  CATALYST     → rate heat + fleet + weather
 *  DRIVER       → rate heat + weather + fuel
 *  BROKER       → spread heat + facilities
 *  DISPATCH     → fleet + weather + demand
 *  TERMINAL_MGR → facilities + fleet + demand
 *  SAFETY       → hazards + weather + compliance
 *  COMPLIANCE   → hazards + EPA + FEMA
 *  ESCORT       → demand heat + facilities
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Satellite, Map, Mountain, Eye, EyeOff, Flame, Truck, Factory,
  CloudRain, AlertTriangle, Radio, Crosshair, Maximize2,
  Thermometer, Droplet, Zap, Navigation,
} from "lucide-react";

// ── TYPES ──
interface SatelliteIntelligenceMapProps {
  zones: any[];
  coldZones: any[];
  roleCtx: any;
  selectedZone: string | null;
  onSelectZone: (id: string | null) => void;
  isLight: boolean;
  activeLayers: string[];
  intel?: any;
  fmcsaIntel?: any;
  roadIntel?: {
    segments?: any[];
    livePings?: { driverId: number; lat: number; lng: number; speed?: number; heading?: number; roadName?: string; pingAt?: string }[];
    stats?: { totalSegments: number; totalMiles: number; liveDrivers: number };
  };
}

// ── SEVERITY COLORS ──
const SEVERITY: Record<string, { fill: string; stroke: string; weight: number }> = {
  CRITICAL: { fill: "#EF444440", stroke: "#EF4444", weight: 10 },
  HIGH:     { fill: "#F9731640", stroke: "#F97316", weight: 7 },
  ELEVATED: { fill: "#EAB30840", stroke: "#EAB308", weight: 4 },
  MODERATE: { fill: "#22C55E30", stroke: "#22C55E", weight: 2 },
};

// ── DARK MAP STYLE (for non-satellite modes) ──
const DARK_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1929" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ── KEY LOGISTICS FACILITIES (lat/lng for satellite overlay) ──
const FACILITIES: { name: string; lat: number; lng: number; type: "port" | "refinery" | "terminal" | "intermodal" }[] = [
  // Major ports
  { name: "Port of Houston", lat: 29.7260, lng: -95.2690, type: "port" },
  { name: "Port of Long Beach", lat: 33.7540, lng: -118.2160, type: "port" },
  { name: "Port of New York/NJ", lat: 40.6680, lng: -74.0450, type: "port" },
  { name: "Port of Savannah", lat: 32.0835, lng: -81.0998, type: "port" },
  { name: "Port of New Orleans", lat: 29.9352, lng: -90.0565, type: "port" },
  { name: "Port of Charleston", lat: 32.7876, lng: -79.9404, type: "port" },
  // Major refineries
  { name: "Baytown Refinery (ExxonMobil)", lat: 29.7355, lng: -94.9774, type: "refinery" },
  { name: "Port Arthur Refinery (Motiva)", lat: 29.8850, lng: -93.9700, type: "refinery" },
  { name: "Whiting Refinery (BP)", lat: 41.6815, lng: -87.4903, type: "refinery" },
  { name: "Beaumont Refinery", lat: 30.0849, lng: -94.1016, type: "refinery" },
  { name: "Baton Rouge Refinery (ExxonMobil)", lat: 30.5005, lng: -91.1900, type: "refinery" },
  { name: "Joliet Refinery (ExxonMobil)", lat: 41.5106, lng: -88.1512, type: "refinery" },
  { name: "Lima Refinery (Cenovus)", lat: 40.7420, lng: -84.0970, type: "refinery" },
  { name: "Wood River Refinery (Phillips 66)", lat: 38.8590, lng: -90.0710, type: "refinery" },
  // Major intermodal terminals
  { name: "Chicago Intermodal (BNSF)", lat: 41.7130, lng: -87.5280, type: "intermodal" },
  { name: "Alliance TX Intermodal", lat: 32.9870, lng: -97.3170, type: "intermodal" },
  { name: "Memphis Intermodal", lat: 35.1495, lng: -90.0490, type: "intermodal" },
  { name: "Kansas City Intermodal", lat: 39.1043, lng: -94.5753, type: "intermodal" },
  { name: "Atlanta Intermodal", lat: 33.7490, lng: -84.3880, type: "intermodal" },
  // Major terminals
  { name: "Cushing Oil Hub", lat: 35.9849, lng: -96.7675, type: "terminal" },
  { name: "LOOP Terminal (LA)", lat: 28.8864, lng: -90.0250, type: "terminal" },
  { name: "Enterprise Mont Belvieu", lat: 29.8486, lng: -94.9085, type: "terminal" },
  { name: "Magellan East Houston", lat: 29.7810, lng: -95.2250, type: "terminal" },
  { name: "Kinder Morgan Pasadena", lat: 29.6910, lng: -95.1550, type: "terminal" },
];

const FACILITY_ICONS: Record<string, { color: string; label: string }> = {
  port:       { color: "#0EA5E9", label: "P" },
  refinery:   { color: "#F97316", label: "R" },
  terminal:   { color: "#8B5CF6", label: "T" },
  intermodal: { color: "#10B981", label: "I" },
};

// ── MAP TYPE OPTIONS ──
const MAP_TYPES = [
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "hybrid", label: "Hybrid", icon: Eye },
  { id: "terrain", label: "Terrain", icon: Mountain },
  { id: "roadmap", label: "Road", icon: Map },
] as const;

// ── LAYER DEFINITIONS ──
const SAT_LAYERS = [
  { id: "heat", label: "Demand Heat", icon: Flame, color: "#EF4444" },
  { id: "zones", label: "Zone Circles", icon: Crosshair, color: "#F97316" },
  { id: "facilities", label: "Facilities", icon: Factory, color: "#8B5CF6" },
  { id: "fleet", label: "Fleet Pings", icon: Truck, color: "#22C55E" },
  { id: "weather", label: "Weather", icon: CloudRain, color: "#3B82F6" },
  { id: "hazards", label: "Hazards", icon: AlertTriangle, color: "#EF4444" },
] as const;

// ── ROLE → DEFAULT LAYERS ──
function getDefaultLayers(perspective?: string): string[] {
  switch (perspective) {
    case "freight_demand":       return ["heat", "zones", "facilities", "fleet"];
    case "catalyst_availability": return ["heat", "fleet", "weather", "zones"];
    case "driver_opportunity":    return ["heat", "weather", "fleet", "zones"];
    case "spread_opportunity":    return ["heat", "zones", "facilities"];
    case "dispatch_intelligence": return ["fleet", "weather", "zones", "heat"];
    case "facility_throughput":   return ["facilities", "fleet", "zones", "heat"];
    case "safety_risk":           return ["hazards", "weather", "zones"];
    case "compliance_risk":       return ["hazards", "zones", "facilities"];
    case "oversized_demand":      return ["heat", "zones", "facilities"];
    default:                      return ["heat", "zones", "facilities", "fleet"];
  }
}

// ── COMPONENT ──
export default function SatelliteIntelligenceMap({
  zones,
  coldZones,
  roleCtx,
  selectedZone,
  onSelectZone,
  isLight,
  activeLayers: _parentLayers,
  intel,
  roadIntel,
}: SatelliteIntelligenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const hoverInfoRef = useRef<any>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapType, setMapType] = useState<string>("hybrid");
  const [visibleLayers, setVisibleLayers] = useState<string[]>(() => getDefaultLayers(roleCtx?.perspective));
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [dataPoints, setDataPoints] = useState(0);

  // ── INJECT CSS for Google Maps InfoWindow theme overrides ──
  useEffect(() => {
    const id = "sat-intel-iw-styles";
    if (document.getElementById(id)) { document.getElementById(id)!.remove(); }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = isLight ? `
      .sat-map-light .gm-style-iw-c {
        background: #ffffff !important;
        border-radius: 14px !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06) !important;
        padding: 0 !important;
        border: 1px solid #e2e8f0 !important;
      }
      .sat-map-light .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
      .sat-map-light .gm-style-iw-tc::after { background: #ffffff !important; }
      .sat-map-light .gm-ui-hover-effect > span { background-color: #64748b !important; }
    ` : `
      .sat-map-dark .gm-style-iw-c {
        background: #0c1222 !important;
        border-radius: 14px !important;
        box-shadow: 0 4px 30px rgba(0,0,0,0.6), 0 0 20px rgba(20,115,255,0.08) !important;
        padding: 0 !important;
        border: 1px solid rgba(20,115,255,0.15) !important;
      }
      .sat-map-dark .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
      .sat-map-dark .gm-style-iw-tc::after { background: #0c1222 !important; }
      .sat-map-dark .gm-ui-hover-effect > span { background-color: #94a3b8 !important; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, [isLight]);

  // Wait for Google Maps
  useEffect(() => {
    const check = () => !!(window as any).google?.maps?.visualization;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => { if (check()) { setMapsReady(true); clearInterval(interval); } }, 200);
    return () => clearInterval(interval);
  }, []);

  // Set defaults when role changes
  useEffect(() => {
    if (roleCtx?.perspective) setVisibleLayers(getDefaultLayers(roleCtx.perspective));
  }, [roleCtx?.perspective]);

  // Initialize map once
  useEffect(() => {
    if (!mapsReady || !containerRef.current || mapRef.current) return;
    const g = (window as any).google.maps;
    const map = new g.Map(containerRef.current, {
      center: { lat: 39.0, lng: -98.0 },
      zoom: 5,
      mapTypeId: mapType,
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: "greedy",
      tilt: 0,
      styles: mapType === "roadmap" && !isLight ? DARK_STYLE : undefined,
    });
    mapRef.current = map;

    // Track cursor position for coordinate readout
    map.addListener("mousemove", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) setCursorPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });

    return () => { mapRef.current = null; };
  }, [mapsReady]);

  // Update map type
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setMapTypeId(mapType);
    map.setOptions({ styles: mapType === "roadmap" && !isLight ? DARK_STYLE : undefined });
  }, [mapType, isLight]);

  const toggleLayer = useCallback((id: string) => {
    setVisibleLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  }, []);

  const resetView = useCallback(() => {
    mapRef.current?.panTo({ lat: 39.0, lng: -98.0 });
    mapRef.current?.setZoom(5);
  }, []);

  // ── RENDER ALL DATA LAYERS ──
  useEffect(() => {
    const map = mapRef.current;
    const g = (window as any).google?.maps;
    if (!map || !g) return;

    // Clear previous overlays
    overlaysRef.current.forEach(o => {
      if (typeof o.close === "function") o.close();
      else if ("setMap" in o) (o as any).setMap(null);
    });
    overlaysRef.current = [];
    let pointCount = 0;

    // ── 1. DEMAND HEATMAP ──
    if (visibleLayers.includes("heat") && zones.length > 0) {
      const heatData = zones.map((z: any) => {
        const sev = SEVERITY[z.demandLevel] || SEVERITY.MODERATE;
        return {
          location: new g.LatLng(z.center?.lat || 38, z.center?.lng || -95),
          weight: sev.weight * (z.liveRatio || 1),
        };
      });
      // Add cold zones with low weight
      coldZones.forEach((z: any) => {
        heatData.push({
          location: new g.LatLng(z.center?.lat || 38, z.center?.lng || -95),
          weight: 0.5,
        });
      });
      const heatmap = new g.visualization.HeatmapLayer({
        data: heatData,
        map,
        radius: 60,
        opacity: 0.65,
        gradient: [
          "rgba(0,0,0,0)",
          "rgba(20,115,255,0.3)",   // EusoTrip blue
          "rgba(100,50,255,0.5)",   // purple
          "rgba(190,1,255,0.6)",    // EusoTrip purple
          "rgba(255,100,0,0.7)",    // orange
          "rgba(239,68,68,0.85)",   // red
          "rgba(255,255,255,0.95)", // white-hot
        ],
      });
      overlaysRef.current.push(heatmap);
      pointCount += heatData.length;
    }

    // ── 2. ZONE CIRCLES ──
    if (visibleLayers.includes("zones")) {
      zones.forEach((z: any) => {
        const sev = SEVERITY[z.demandLevel] || SEVERITY.MODERATE;
        const lat = z.center?.lat;
        const lng = z.center?.lng;
        if (!lat || !lng) return;

        const isSelected = selectedZone === z.zoneId;
        const circle = new g.Circle({
          center: { lat, lng },
          radius: (z.demandLevel === "CRITICAL" ? 80000 : z.demandLevel === "HIGH" ? 65000 : 50000) * (isSelected ? 1.2 : 1),
          fillColor: sev.stroke,
          fillOpacity: isSelected ? 0.25 : 0.1,
          strokeColor: sev.stroke,
          strokeWeight: isSelected ? 3 : 1.5,
          strokeOpacity: isSelected ? 1 : 0.6,
          map,
          clickable: true,
          zIndex: isSelected ? 10 : 1,
        });

        // Hover → rich tooltip (matches SVG map intel)
        circle.addListener("mouseover", () => {
          if (hoverInfoRef.current) hoverInfoRef.current.close();
          const availCount = (z.liveLoads || 0);
          // Theme-aware colors
          const bg = isLight ? "#ffffff" : "#0c1222";
          const cardBg = isLight ? "#f1f5f9" : "#162032";
          const tp = isLight ? "#0f172a" : "#f1f5f9";
          const ts = isLight ? "#64748b" : "#94a3b8";
          const tm = isLight ? "#94a3b8" : "#475569";
          const bdr = isLight ? "#e2e8f0" : "#1e3a5f";
          const info = new g.InfoWindow({
            position: { lat, lng },
            content: `
              <div style="font-family:'Inter',system-ui,-apple-system,sans-serif;padding:10px 12px;min-width:220px;max-width:280px;background:${bg};border-radius:10px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <strong style="font-size:13px;color:${tp};line-height:1.2">${z.zoneName}</strong>
                  <span style="font-size:9px;font-weight:700;color:#fff;background:${sev.stroke};padding:3px 8px;border-radius:8px;text-transform:uppercase;letter-spacing:0.6px;margin-left:8px;white-space:nowrap">${z.demandLevel}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:10px;color:${ts}">
                  <div style="text-align:center;padding:6px 4px;background:${cardBg};border-radius:8px">
                    <div style="font-size:16px;font-weight:800;color:${tp};line-height:1">${z.liveLoads || 0}</div>
                    <div style="margin-top:2px;font-size:9px">Loads</div>
                  </div>
                  <div style="text-align:center;padding:6px 4px;background:${cardBg};border-radius:8px">
                    <div style="font-size:16px;font-weight:800;color:#1473FF;line-height:1">$${Number(z.liveRate || 0).toFixed(2)}<span style="font-size:9px;font-weight:500">/mi</span></div>
                    <div style="margin-top:2px;font-size:9px">Rate</div>
                  </div>
                  <div style="text-align:center;padding:6px 4px;background:${cardBg};border-radius:8px">
                    <div style="font-size:16px;font-weight:800;color:${tp};line-height:1">${z.liveTrucks || 0}</div>
                    <div style="margin-top:2px;font-size:9px">Trucks</div>
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;padding:0 2px;font-size:10px;color:${ts}">
                  <span>Surge: <strong style="color:${tp}">${Number(z.liveSurge || 1).toFixed(2)}x</strong></span>
                  <span>L:T Ratio: <strong style="color:${sev.stroke}">${Number(z.liveRatio || 1).toFixed(1)}x</strong></span>
                </div>
                <div style="margin-top:8px;padding-top:7px;border-top:1px solid ${bdr};display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:9px;color:${tm}">Peak: ${z.peakHours || "N/A"} · Fuel: $${Number(z.fuelPrice || 0).toFixed(2)}/gal</span>
                  <span style="font-size:10px;font-weight:700;color:#22C55E">${availCount} avail</span>
                </div>
              </div>
            `,
            disableAutoPan: true,
          });
          info.open(map);
          hoverInfoRef.current = info;
        });

        circle.addListener("mouseout", () => {
          if (hoverInfoRef.current) { hoverInfoRef.current.close(); hoverInfoRef.current = null; }
        });

        // Click → select zone + fly to
        circle.addListener("click", () => {
          onSelectZone(selectedZone === z.zoneId ? null : z.zoneId);
        });

        overlaysRef.current.push(circle);
        pointCount++;
      });

      // Cold zones — blue translucent
      coldZones.forEach((z: any) => {
        const lat = z.center?.lat;
        const lng = z.center?.lng;
        if (!lat || !lng) return;
        const circle = new g.Circle({
          center: { lat, lng },
          radius: 40000,
          fillColor: "#3B82F6",
          fillOpacity: 0.06,
          strokeColor: "#3B82F6",
          strokeWeight: 1,
          strokeOpacity: 0.3,
          map,
        });
        overlaysRef.current.push(circle);
        pointCount++;
      });
    }

    // ── 3. FACILITY MARKERS ──
    if (visibleLayers.includes("facilities")) {
      FACILITIES.forEach(fac => {
        const cfg = FACILITY_ICONS[fac.type];
        const marker = new g.Marker({
          position: { lat: fac.lat, lng: fac.lng },
          map,
          icon: {
            path: g.SymbolPath.CIRCLE,
            fillColor: cfg.color,
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8,
          },
          title: fac.name,
          zIndex: 5,
        });

        // Hover tooltip for facilities
        marker.addListener("mouseover", () => {
          if (hoverInfoRef.current) hoverInfoRef.current.close();
          const bg = isLight ? "#ffffff" : "#0c1222";
          const tp = isLight ? "#0f172a" : "#f1f5f9";
          const ts = isLight ? "#64748b" : "#94a3b8";
          const info = new g.InfoWindow({
            content: `
              <div style="font-family:'Inter',system-ui,sans-serif;padding:8px 10px;min-width:170px;background:${bg};border-radius:8px">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
                  <span style="width:10px;height:10px;border-radius:50%;background:${cfg.color};display:inline-block;box-shadow:0 0 6px ${cfg.color}60"></span>
                  <strong style="font-size:12px;color:${tp}">${fac.name}</strong>
                </div>
                <div style="font-size:9px;color:${ts};text-transform:uppercase;letter-spacing:0.6px;font-weight:600;margin-left:17px">${fac.type}</div>
              </div>
            `,
            disableAutoPan: true,
          });
          info.open(map, marker);
          hoverInfoRef.current = info;
        });
        marker.addListener("mouseout", () => {
          if (hoverInfoRef.current) { hoverInfoRef.current.close(); hoverInfoRef.current = null; }
        });

        overlaysRef.current.push(marker);
        pointCount++;
      });
    }

    // ── 4. LIVE FLEET PINGS ──
    if (visibleLayers.includes("fleet") && roadIntel?.livePings) {
      roadIntel.livePings.forEach(ping => {
        if (!ping.lat || !ping.lng) return;
        const marker = new g.Marker({
          position: { lat: ping.lat, lng: ping.lng },
          map,
          icon: {
            path: g.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: "#22C55E",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
            scale: 5,
            rotation: ping.heading || 0,
          },
          title: `Driver #${ping.driverId}${ping.speed ? ` · ${ping.speed.toFixed(0)} mph` : ""}`,
          zIndex: 8,
        });

        // Hover tooltip for fleet pings
        marker.addListener("mouseover", () => {
          if (hoverInfoRef.current) hoverInfoRef.current.close();
          const bg = isLight ? "#ffffff" : "#0c1222";
          const tp = isLight ? "#0f172a" : "#f1f5f9";
          const ts = isLight ? "#64748b" : "#94a3b8";
          const info = new g.InfoWindow({
            content: `
              <div style="font-family:'Inter',system-ui,sans-serif;padding:8px 10px;background:${bg};border-radius:8px">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="width:8px;height:8px;border-radius:50%;background:#22C55E;display:inline-block;box-shadow:0 0 6px #22C55E60"></span>
                  <strong style="font-size:12px;color:${tp}">Driver #${ping.driverId}</strong>
                </div>
                ${ping.speed ? `<div style="font-size:13px;color:#22C55E;font-weight:800;margin-top:3px;margin-left:14px">${ping.speed.toFixed(0)} mph</div>` : ""}
                ${ping.roadName ? `<div style="font-size:10px;color:${ts};margin-left:14px">${ping.roadName}</div>` : ""}
                ${ping.pingAt ? `<div style="font-size:9px;color:${ts};margin-left:14px;opacity:0.6">${new Date(ping.pingAt).toLocaleTimeString()}</div>` : ""}
              </div>
            `,
            disableAutoPan: true,
          });
          info.open(map, marker);
          hoverInfoRef.current = info;
        });
        marker.addListener("mouseout", () => {
          if (hoverInfoRef.current) { hoverInfoRef.current.close(); hoverInfoRef.current = null; }
        });

        overlaysRef.current.push(marker);
        pointCount++;
      });
    }

    // ── 5. WEATHER EVENTS ──
    if (visibleLayers.includes("weather") && intel?.weatherAlerts) {
      intel.weatherAlerts.forEach((w: any) => {
        if (!w.lat || !w.lng) return;
        const severity = w.severity === "Extreme" ? "#EF4444" : w.severity === "Severe" ? "#F97316" : "#FBBF24";
        const marker = new g.Marker({
          position: { lat: w.lat, lng: w.lng },
          map,
          icon: {
            path: g.SymbolPath.CIRCLE,
            fillColor: severity,
            fillOpacity: 0.8,
            strokeColor: "#fff",
            strokeWeight: 1.5,
            scale: 7,
          },
          title: `${w.event || "Weather Alert"} — ${w.headline || ""}`,
          zIndex: 6,
        });

        // Affected radius circle
        const circle = new g.Circle({
          center: { lat: w.lat, lng: w.lng },
          radius: 50000,
          fillColor: severity,
          fillOpacity: 0.06,
          strokeColor: severity,
          strokeWeight: 1,
          strokeOpacity: 0.3,
          map,
        });

        overlaysRef.current.push(marker, circle);
        pointCount++;
      });
    }

    // ── 6. NATURAL HAZARDS (earthquakes, wildfires, hazmat) ──
    if (visibleLayers.includes("hazards")) {
      // Earthquakes
      if (intel?.earthquakes) {
        intel.earthquakes.forEach((eq: any) => {
          if (!eq.lat || !eq.lng) return;
          const mag = eq.mag || 0;
          const marker = new g.Marker({
            position: { lat: eq.lat, lng: eq.lng },
            map,
            icon: {
              path: g.SymbolPath.CIRCLE,
              fillColor: "#22D3EE",
              fillOpacity: 0.8,
              strokeColor: "#fff",
              strokeWeight: 1.5,
              scale: 4 + mag * 1.5,
            },
            title: `M${mag.toFixed(1)} — ${eq.place || "Unknown"}`,
            zIndex: 7,
          });
          overlaysRef.current.push(marker);
          pointCount++;
        });
      }

      // Wildfires
      if (intel?.wildfires) {
        intel.wildfires.forEach((fire: any) => {
          if (!fire.lat || !fire.lng) return;
          const marker = new g.Marker({
            position: { lat: fire.lat, lng: fire.lng },
            map,
            icon: {
              path: g.SymbolPath.CIRCLE,
              fillColor: "#EF4444",
              fillOpacity: 0.85,
              strokeColor: "#fff",
              strokeWeight: 1.5,
              scale: 6 + Math.min(6, (fire.acres || 0) / 10000),
            },
            title: `${fire.name || "Wildfire"} — ${(fire.acres || 0).toLocaleString()} acres`,
            zIndex: 7,
          });
          overlaysRef.current.push(marker);
          pointCount++;
        });
      }

      // Hazmat spills
      if (intel?.hazmatSpills) {
        intel.hazmatSpills.forEach((haz: any) => {
          if (!haz.lat || !haz.lng) return;
          const marker = new g.Marker({
            position: { lat: haz.lat, lng: haz.lng },
            map,
            icon: {
              path: g.SymbolPath.CIRCLE,
              fillColor: "#7C3AED",
              fillOpacity: 0.8,
              strokeColor: "#fff",
              strokeWeight: 1.5,
              scale: 6,
            },
            title: `HazMat: ${haz.name || haz.city || "Unknown"} (${haz.mode || ""})`,
            zIndex: 7,
          });
          overlaysRef.current.push(marker);
          pointCount++;
        });
      }
    }

    setDataPoints(pointCount);
  }, [zones, coldZones, visibleLayers, selectedZone, intel, roadIntel, onSelectZone, isLight]);

  // ── SELECTED ZONE FLY-TO ──
  useEffect(() => {
    if (!mapRef.current || !selectedZone) return;
    const zone = zones.find((z: any) => z.zoneId === selectedZone);
    if (zone?.center?.lat && zone?.center?.lng) {
      mapRef.current.panTo({ lat: zone.center.lat, lng: zone.center.lng });
      mapRef.current.setZoom(7);
    }
  }, [selectedZone, zones]);

  // Perspective label
  const perspectiveLabel = useMemo(() => {
    const p = roleCtx?.perspective;
    if (!p) return "Spatial Intelligence";
    return p.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  }, [roleCtx?.perspective]);

  // Loading state
  if (!mapsReady) {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden border ${isLight ? "border-slate-200 bg-slate-50" : "border-white/[0.06] bg-slate-900"}`} style={{ height: 520 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#1473FF]/30 border-t-[#1473FF] animate-spin" />
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>Initializing Satellite Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border ${isLight ? "border-slate-200" : "border-white/[0.06]"}`} style={{ height: 560 }}>
      {/* ── MAP CONTAINER ── */}
      <div ref={containerRef} className={`w-full h-full ${isLight ? "sat-map-light" : "sat-map-dark"}`} />

      {/* ── SCANLINE OVERLAY (subtle satellite aesthetic) ── */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,115,255,0.015) 2px, rgba(20,115,255,0.015) 4px)",
      }} />

      {/* ── TOP-LEFT: SPATIAL INTEL BADGE ── */}
      <div className={`absolute top-3 left-3 z-10 backdrop-blur-xl rounded-xl px-3 py-2 border ${
        isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? "text-slate-600" : "text-white/60"}`}>
            Spatial Intel
          </span>
          <span className="text-[9px] font-mono text-[#1473FF]">LIVE</span>
        </div>
        <div className={`text-[10px] mt-1 ${isLight ? "text-slate-500" : "text-white/35"}`}>
          {perspectiveLabel} · {dataPoints} data points
        </div>
      </div>

      {/* ── TOP-RIGHT: MAP TYPE + ZOOM ── */}
      <div className={`absolute top-3 right-3 z-10 flex flex-col gap-1.5`}>
        {/* Map type selector */}
        <div className={`backdrop-blur-xl rounded-xl border overflow-hidden ${
          isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
        }`}>
          {MAP_TYPES.map(mt => {
            const Icon = mt.icon;
            const active = mapType === mt.id;
            return (
              <button key={mt.id} onClick={() => setMapType(mt.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium transition-all w-full ${
                  active
                    ? isLight ? "bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-[#1473FF] font-semibold" : "bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 text-white"
                    : isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/40 hover:bg-white/[0.06]"
                }`}>
                <Icon className="w-3 h-3" />
                {mt.label}
              </button>
            );
          })}
        </div>
        {/* Zoom controls */}
        <div className={`backdrop-blur-xl rounded-xl border overflow-hidden ${
          isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
        }`}>
          <button onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 5) + 1)}
            className={`w-full p-2 ${isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/50 hover:bg-white/[0.06]"}`}>
            <span className="text-sm font-bold">+</span>
          </button>
          <button onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 5) - 1)}
            className={`w-full p-2 border-t ${isLight ? "text-slate-500 hover:bg-slate-100 border-slate-200" : "text-white/50 hover:bg-white/[0.06] border-white/[0.06]"}`}>
            <span className="text-sm font-bold">−</span>
          </button>
          <button onClick={resetView}
            className={`w-full p-2 border-t ${isLight ? "text-slate-500 hover:bg-slate-100 border-slate-200" : "text-white/50 hover:bg-white/[0.06] border-white/[0.06]"}`}>
            <Maximize2 className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>
      </div>

      {/* ── LEFT: LAYER PANEL ── */}
      <div className={`absolute top-20 left-3 z-10 transition-all duration-300 ${showPanel ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className={`backdrop-blur-xl rounded-xl border p-2.5 space-y-1 ${
          isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[9px] font-bold tracking-widest uppercase ${isLight ? "text-slate-500" : "text-white/40"}`}>
              Layers
            </span>
            <button onClick={() => setShowPanel(false)} className={`p-0.5 rounded ${isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]"}`}>
              <EyeOff className={`w-3 h-3 ${isLight ? "text-slate-400" : "text-white/30"}`} />
            </button>
          </div>
          {SAT_LAYERS.map(layer => {
            const Icon = layer.icon;
            const active = visibleLayers.includes(layer.id);
            return (
              <button key={layer.id} onClick={() => toggleLayer(layer.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  active
                    ? ""
                    : isLight ? "text-slate-400 hover:bg-slate-100" : "text-white/25 hover:bg-white/[0.04]"
                }`}
                style={active ? { backgroundColor: layer.color + "18", color: layer.color, border: `1px solid ${layer.color}33` } : {}}>
                <Icon className="w-3 h-3" />
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Show panel button when hidden */}
      {!showPanel && (
        <button onClick={() => setShowPanel(true)}
          className={`absolute top-20 left-3 z-10 p-2 rounded-xl backdrop-blur-xl border ${
            isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
          }`}>
          <Eye className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-white/40"}`} />
        </button>
      )}

      {/* ── BOTTOM-LEFT: LEGEND ── */}
      <div className={`absolute bottom-3 left-3 z-10 backdrop-blur-xl rounded-xl border px-3 py-2 ${
        isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
      }`}>
        <div className={`text-[8px] font-bold tracking-widest uppercase mb-1.5 ${isLight ? "text-slate-500" : "text-white/35"}`}>
          Demand Severity
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "Critical", color: "#EF4444" },
            { label: "High", color: "#F97316" },
            { label: "Elevated", color: "#EAB308" },
            { label: "Cold", color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
              <span className={`text-[9px] ${isLight ? "text-slate-500" : "text-white/40"}`}>{s.label}</span>
            </div>
          ))}
        </div>
        {visibleLayers.includes("facilities") && (
          <div className={`flex items-center gap-3 mt-1.5 pt-1.5 border-t ${isLight ? "border-slate-200/60" : "border-white/[0.04]"}`}>
            {Object.entries(FACILITY_ICONS).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className={`text-[9px] capitalize ${isLight ? "text-slate-500" : "text-white/40"}`}>{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM-RIGHT: COORDINATE READOUT ── */}
      <div className={`absolute bottom-3 right-3 z-10 backdrop-blur-xl rounded-lg border px-2.5 py-1.5 ${
        isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
      }`}>
        <div className="flex items-center gap-2">
          <Navigation className={`w-3 h-3 ${isLight ? "text-slate-400" : "text-white/30"}`} />
          <span className={`text-[10px] font-mono tabular-nums ${isLight ? "text-slate-500" : "text-white/40"}`}>
            {cursorPos ? `${cursorPos.lat.toFixed(4)}°N ${Math.abs(cursorPos.lng).toFixed(4)}°W` : "—"}
          </span>
        </div>
      </div>

      {/* ── BOTTOM-CENTER: FLEET STATS (if fleet layer active) ── */}
      {visibleLayers.includes("fleet") && roadIntel?.stats && (
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 backdrop-blur-xl rounded-xl border px-4 py-2 ${
          isLight ? "bg-white/90 border-slate-200/60" : "bg-slate-900/85 border-white/[0.08]"
        }`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-[10px] font-semibold ${isLight ? "text-slate-600" : "text-white/60"}`}>
                {roadIntel.stats.liveDrivers} live drivers
              </span>
            </div>
            <div className={`text-[10px] ${isLight ? "text-slate-400" : "text-white/30"}`}>
              {roadIntel.stats.totalSegments.toLocaleString()} segments · {roadIntel.stats.totalMiles.toLocaleString()} mi mapped
            </div>
          </div>
        </div>
      )}

      {/* ── GRADIENT BORDER (brand accent) ── */}
      <div className="absolute inset-0 pointer-events-none z-[2] rounded-2xl" style={{
        boxShadow: isLight
          ? "inset 0 0 0 1px rgba(20,115,255,0.1)"
          : "inset 0 0 0 1px rgba(20,115,255,0.15), inset 0 0 30px rgba(20,115,255,0.03)",
      }} />
    </div>
  );
}
