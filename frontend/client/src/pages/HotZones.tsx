/**
 * HOT ZONES - Geographic Demand Intelligence & Surge Pricing
 * 
 * Interactive heat map showing freight rate activity across the US.
 * - Heat intensity driven by load-to-truck ratio and surge multipliers
 * - Criteria filters: equipment type, demand level, state
 * - SPECTRA-MATCH integration for oil/gas product regions
 * - Zone detail panels with hourly demand curves and top loads
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import {
  Flame, TrendingUp, Truck, AlertTriangle, RefreshCw, Layers,
  Droplets, X, Zap, Navigation, Filter, ChevronLeft, ChevronRight
} from "lucide-react";

const EQUIPMENT_TYPES = [
  { value: "ALL", label: "All Equipment" },
  { value: "DRY_VAN", label: "Dry Van" },
  { value: "REEFER", label: "Reefer" },
  { value: "FLATBED", label: "Flatbed" },
  { value: "TANKER", label: "Tanker" },
  { value: "HAZMAT", label: "Hazmat" },
];

const DEMAND_LEVELS = [
  { value: "ALL", label: "All Levels" },
  { value: "ELEVATED", label: "Elevated" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function getDemandBg(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-500/20 border-red-500/40 text-red-400";
    case "HIGH": return "bg-orange-500/20 border-orange-500/40 text-orange-400";
    case "ELEVATED": return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
    default: return "bg-gray-500/20 border-gray-500/40 text-gray-400";
  }
}

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#374151" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#1e3a2f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
];

const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4edda" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8d8f0" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d6f0" }] },
];

interface GoogleHeatMapProps {
  zones: any[];
  coldZones: any[];
  selectedZone: string | null;
  onZoneClick: (zoneId: string) => void;
  radius: number;
  opacity: number;
  intensity: number;
}

function GoogleHeatMap({ zones, coldZones, selectedZone, onZoneClick, radius, opacity, intensity }: GoogleHeatMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const waitForGoogle = () => {
      if (typeof google === "undefined" || !google.maps) {
        setTimeout(waitForGoogle, 200);
        return;
      }
      const isDark = document.documentElement.classList.contains("dark");
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 39.0, lng: -98.0 },
        zoom: 4,
        styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        backgroundColor: isDark ? "#0f172a" : "#f5f5f5",
      });
      googleMapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
      setMapReady(true);
    };
    waitForGoogle();

    return () => {
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      markersRef.current.forEach(m => (m as any).setMap?.(null));
    };
  }, []);

  // Update map styles when theme changes
  useEffect(() => {
    if (!googleMapRef.current) return;
    googleMapRef.current.setOptions({
      styles: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      backgroundColor: theme === "dark" ? "#0f172a" : "#f5f5f5",
    });
  }, [theme]);

  // Build heatmap data and markers when zones change
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    const map = googleMapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => (m as any).setMap?.(null));
    markersRef.current = [];

    // Build weighted heatmap data points
    // Each zone generates multiple points weighted by demand
    const heatData: google.maps.visualization.WeightedLocation[] = [];
    zones.forEach((zone) => {
      const weight = zone.loadToTruckRatio * zone.surgeMultiplier * (intensity / 100);
      const spreadCount = Math.ceil(zone.loadCount / 30);
      // Center point (highest weight)
      heatData.push({
        location: new google.maps.LatLng(zone.center.lat, zone.center.lng),
        weight: weight * 5,
      });
      // Spread points around the zone for realistic heat coverage
      for (let i = 0; i < spreadCount; i++) {
        const angle = (Math.PI * 2 * i) / spreadCount;
        const dist = (zone.radius / 69) * (0.3 + Math.random() * 0.7); // Convert miles to approx degrees
        heatData.push({
          location: new google.maps.LatLng(
            zone.center.lat + Math.cos(angle) * dist,
            zone.center.lng + Math.sin(angle) * dist * 1.3
          ),
          weight: weight * (1.5 + Math.random()),
        });
      }
    });

    // Update or create heatmap layer
    if (heatmapRef.current) {
      heatmapRef.current.setData(heatData);
    } else {
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatData,
        map,
        gradient: [
          "rgba(0, 0, 0, 0)",
          "rgba(0, 80, 200, 0.4)",
          "rgba(0, 200, 100, 0.5)",
          "rgba(234, 179, 8, 0.6)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(239, 68, 68, 0.85)",
          "rgba(220, 38, 38, 0.95)",
          "rgba(185, 28, 28, 1)",
        ],
      });
    }

    // Add zone markers
    zones.forEach((zone) => {
      const isSelected = selectedZone === zone.id;
      const color = zone.demandLevel === "CRITICAL" ? "#EF4444" : zone.demandLevel === "HIGH" ? "#F97316" : "#EAB308";

      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <div style="
          width: ${isSelected ? 36 : 28}px; height: ${isSelected ? 36 : 28}px;
          background: ${color}; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px ${color}80, 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer; transition: transform 0.2s;
          ${isSelected ? 'transform: scale(1.3); box-shadow: 0 0 20px ' + color + ', 0 0 40px ' + color + '60;' : ''}
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </div>
        ${zone.demandLevel === "CRITICAL" ? '<div style="position:absolute;inset:0;border-radius:50%;background:' + color + ';opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;width:28px;height:28px;"></div>' : ''}
      `;

      // Use the older Marker API which is more universally supported
      const marker = new google.maps.Marker({
        position: { lat: zone.center.lat, lng: zone.center.lng },
        map,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/><path d="M12.5 18.5A2.5 2.5 0 0 0 15 16c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="white" stroke-width="1.5" transform="translate(-2,-2) scale(0.8)"/></svg>`)}`,
          scaledSize: new google.maps.Size(isSelected ? 40 : 30, isSelected ? 40 : 30),
          anchor: new google.maps.Point(isSelected ? 20 : 15, isSelected ? 20 : 15),
        },
        title: zone.name,
        zIndex: zone.demandLevel === "CRITICAL" ? 10 : 5,
      });

      marker.addListener("click", () => {
        onZoneClick(zone.id);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="background:#1e293b;color:white;padding:12px;border-radius:10px;min-width:200px;font-family:Gilroy,sans-serif;">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${zone.name}</div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                <span style="background:${color}30;color:${color};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;border:1px solid ${color}50;">${zone.demandLevel}</span>
                <span style="color:#34d399;font-weight:700;font-size:13px;">${zone.surgeMultiplier}x surge</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
                <div><div style="color:#94a3b8;font-size:9px;">LOADS</div><div style="font-weight:700;color:#60a5fa;">${zone.loadCount}</div></div>
                <div><div style="color:#94a3b8;font-size:9px;">RATE/MI</div><div style="font-weight:700;">$${zone.avgRate}</div></div>
                <div><div style="color:#94a3b8;font-size:9px;">TRUCKS</div><div style="font-weight:700;color:#c084fc;">${zone.truckCount}</div></div>
              </div>
              <div style="margin-top:8px;font-size:10px;color:#64748b;">${zone.reasons?.[0] || ''}</div>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker as any);
    });

    // Cold zone markers (blue, smaller)
    coldZones.forEach((zone) => {
      const marker = new google.maps.Marker({
        position: { lat: zone.center.lat, lng: zone.center.lng },
        map,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#3B82F680" stroke="#60A5FA" stroke-width="1.5"/><path d="M10 6v8M6 10h8" stroke="#93C5FD" stroke-width="1.5" stroke-linecap="round"/></svg>`)}`,
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10),
        },
        title: `${zone.name} (Cold Zone)`,
        zIndex: 1,
      });

      marker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="background:#1e293b;color:white;padding:10px;border-radius:8px;font-family:Gilroy,sans-serif;">
              <div style="font-weight:700;font-size:13px;color:#93C5FD;">${zone.name}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">${zone.surgeMultiplier}x · ${zone.reason}</div>
              <div style="font-size:10px;color:#3B82F6;margin-top:4px;">❄️ Low demand zone</div>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker as any);
    });
  }, [zones, coldZones, selectedZone, mapReady, intensity]);

  // Update heatmap properties when controls change
  useEffect(() => {
    if (!heatmapRef.current) return;
    heatmapRef.current.set("radius", Math.round((radius / 100) * 80 + 20));
    heatmapRef.current.set("opacity", opacity / 100);
  }, [radius, opacity]);

  // Pan to selected zone
  useEffect(() => {
    if (!googleMapRef.current || !selectedZone) return;
    const zone = zones.find((z) => z.id === selectedZone);
    if (zone) {
      googleMapRef.current.panTo({ lat: zone.center.lat, lng: zone.center.lng });
      googleMapRef.current.setZoom(7);
    }
  }, [selectedZone, zones]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-b-2xl" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading Google Maps...</span>
          </div>
        </div>
      )}
    </div>
  );
}

const CARDS_PER_PAGE = 6;

export default function HotZones() {
  const [equipment, setEquipment] = useState("ALL");
  const [demandLevel, setDemandLevel] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [radius, setRadius] = useState([65]);
  const [mapOpacity, setMapOpacity] = useState([75]);
  const [intensity, setIntensity] = useState([80]);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cardPage, setCardPage] = useState(0);

  // Live rate feed — refreshes every 10 seconds for real-time feel
  const feedQuery = trpc.hotZones.getRateFeed.useQuery(
    { equipment: equipment !== "ALL" ? equipment : undefined },
    { refetchInterval: 10000 }
  );

  // Static zone detail for selected zone
  const detailQuery = trpc.hotZones.getZoneDetail.useQuery(
    { zoneId: selectedZone! },
    { enabled: !!selectedZone }
  );

  // Map feed data to the format the map and cards expect
  const feedZones = feedQuery.data?.zones || [];
  const feedColdZones = feedQuery.data?.coldZones || [];
  const pulse = feedQuery.data?.marketPulse;
  const detail = detailQuery.data;

  // Convert feed zones to map-compatible format
  const zones = feedZones.map((z: any) => ({
    id: z.zoneId,
    name: z.zoneName,
    center: z.center,
    state: z.state,
    demandLevel: z.demandLevel,
    surgeMultiplier: z.liveSurge,
    avgRate: z.liveRate,
    loadCount: z.liveLoads,
    truckCount: z.liveTrucks,
    loadToTruckRatio: z.liveRatio,
    topEquipment: z.topEquipment,
    reasons: z.reasons,
    radius: z.radius,
    rateChange: z.rateChange,
    rateChangePercent: z.rateChangePercent,
    topLanes: z.topLanes,
    equipmentDemand: z.equipmentDemand,
    peakHours: z.peakHours,
  }));

  const coldZones = feedColdZones.map((z: any) => ({
    id: z.id,
    name: z.name,
    center: z.center,
    surgeMultiplier: z.liveSurge || z.surgeMultiplier,
    reason: z.reason,
  }));

  // Auto-advance zone card batches every 10 seconds
  const totalPages = Math.max(1, Math.ceil(zones.length / CARDS_PER_PAGE));
  useEffect(() => {
    const interval = setInterval(() => {
      setCardPage(prev => (prev + 1) % totalPages);
    }, 10000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const visibleZones = zones.slice(cardPage * CARDS_PER_PAGE, (cardPage + 1) * CARDS_PER_PAGE);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            Hot Zones
          </h1>
          <p className="text-slate-400 text-sm mt-1">Geographic demand intelligence & surge pricing heatmap</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">LIVE FEED</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => feedQuery.refetch()} disabled={feedQuery.isRefetching}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${feedQuery.isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats — Live Pulse */}
      {pulse && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Active Hot Zones", value: zones.length, icon: Flame, color: "text-orange-400", bg: "from-orange-500/10 to-red-500/10" },
            { label: "Critical Zones", value: pulse.criticalZones, icon: AlertTriangle, color: "text-red-400", bg: "from-red-500/10 to-rose-500/10" },
            { label: "Avg Rate/mi", value: `$${pulse.avgRate}`, icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-500/10 to-green-500/10" },
            { label: "Open Loads", value: pulse.totalLoads.toLocaleString(), icon: Truck, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/10" },
            { label: "Available Trucks", value: pulse.totalTrucks.toLocaleString(), icon: Navigation, color: "text-purple-400", bg: "from-purple-500/10 to-violet-500/10" },
          ].map((stat) => (
            <div key={stat.label} className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${stat.bg} border border-white/10 transition-all duration-500`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className={`grid ${selectedZone ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
        {/* Heat Map */}
        <div className={selectedZone ? "lg:col-span-2" : ""}>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" />
                  Freight Demand Heatmap
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filters */}
                  <Select value={equipment} onValueChange={setEquipment}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={demandLevel} onValueChange={setDemandLevel}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMAND_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setShowControls(!showControls)}
                    className="text-gray-400 hover:text-white h-8 px-2">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              {/* Heat Map Controls Panel */}
              {showControls && (
                <div className="absolute top-2 left-2 z-20 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 w-52 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Heat Map Controls</p>
                    <button onClick={() => setShowControls(false)} className="p-0.5 hover:bg-white/10 rounded">
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Radius</span>
                      <span className="text-[10px] text-white font-bold">{radius[0]}%</span>
                    </div>
                    <Slider value={radius} onValueChange={setRadius} min={20} max={100} step={5} className="w-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Opacity</span>
                      <span className="text-[10px] text-white font-bold">{mapOpacity[0]}%</span>
                    </div>
                    <Slider value={mapOpacity} onValueChange={setMapOpacity} min={20} max={100} step={5} className="w-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Intensity</span>
                      <span className="text-[10px] text-white font-bold">{intensity[0]}%</span>
                    </div>
                    <Slider value={intensity} onValueChange={setIntensity} min={20} max={100} step={5} className="w-full" />
                  </div>
                  {/* Gradient Legend */}
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-[10px] text-gray-400 mb-2">Gradient</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-red-500" />
                          <span className="text-[10px] text-red-400 font-semibold">DENSE</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-orange-500" />
                          <span className="text-[10px] text-orange-400 font-semibold">MEDIUM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                          <span className="text-[10px] text-yellow-400 font-semibold">LIGHT</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
                          <span className="text-[10px] text-blue-400 font-semibold">COLD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {feedQuery.isLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Skeleton className="w-full h-full bg-slate-700" />
                </div>
              ) : (
                <div className="h-[500px]">
                  <GoogleHeatMap
                    zones={zones}
                    coldZones={coldZones}
                    selectedZone={selectedZone}
                    onZoneClick={(id) => setSelectedZone(selectedZone === id ? null : id)}
                    radius={radius[0]}
                    opacity={mapOpacity[0]}
                    intensity={intensity[0]}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zone Cards — Paginated Carousel */}
          <div className="mt-4">
            {/* Pagination Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">
                Showing {cardPage * CARDS_PER_PAGE + 1}–{Math.min((cardPage + 1) * CARDS_PER_PAGE, zones.length)} of {zones.length} zones
              </span>
              <div className="flex items-center gap-2">
                {/* Page Dots */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCardPage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === cardPage ? "bg-orange-400 w-5" : "bg-slate-600 hover:bg-slate-500"}`} />
                  ))}
                </div>
                {/* Arrows */}
                <button onClick={() => setCardPage((cardPage - 1 + totalPages) % totalPages)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => setCardPage((cardPage + 1) % totalPages)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleZones.map((zone: any, idx: number) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-fade-in-up
                    ${selectedZone === zone.id 
                      ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 ring-1 ring-orange-500/30" 
                      : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white text-sm">{zone.name}</p>
                      <p className="text-[10px] text-slate-500">{zone.state}</p>
                    </div>
                    <Badge className={`text-[10px] px-1.5 py-0 border ${getDemandBg(zone.demandLevel)}`}>
                      {zone.demandLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[10px] text-slate-500">Surge</p>
                      <p className="text-sm font-bold text-emerald-400">{zone.surgeMultiplier}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Rate/mi</p>
                      <p className="text-sm font-bold text-white">${zone.avgRate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Loads</p>
                      <p className="text-sm font-bold text-blue-400">{zone.loadCount}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {zone.topEquipment.map((eq: string) => (
                      <span key={eq} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{eq.replace("_", " ")}</span>
                    ))}
                  </div>
                  {zone.reasons && (
                    <p className="text-[10px] text-slate-500 mt-2 truncate">{zone.reasons[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Detail Panel */}
        {selectedZone && detail && (
          <div className="space-y-4 animate-slide-in-right">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{detail.zone.name}</CardTitle>
                  <button onClick={() => setSelectedZone(null)} className="p-1 rounded-full hover:bg-white/10">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] border ${getDemandBg(detail.zone.demandLevel)}`}>{detail.zone.demandLevel}</Badge>
                  <span className="text-xs text-slate-400">{detail.zone.state}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">{detail.zone.peakHours}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <p className="text-[10px] text-slate-500 uppercase">Surge</p>
                    <p className="text-2xl font-bold text-emerald-400">{detail.zone.surgeMultiplier}x</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-slate-500 uppercase">Avg Rate</p>
                    <p className="text-2xl font-bold text-blue-400">${detail.zone.avgRate}/mi</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                    <p className="text-[10px] text-slate-500 uppercase">Load:Truck</p>
                    <p className="text-2xl font-bold text-orange-400">{detail.zone.loadToTruckRatio}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                    <p className="text-[10px] text-slate-500 uppercase">Est. Earnings</p>
                    <p className="text-2xl font-bold text-purple-400">${Math.round(detail.zone.avgRate * detail.zone.surgeMultiplier * 450)}</p>
                  </div>
                </div>

                {/* Reasons */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">DEMAND DRIVERS</p>
                  <div className="space-y-1.5">
                    {detail.zone.reasons.map((reason: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 24hr Demand Curve */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">24-HOUR DEMAND</p>
                  <div className="flex items-end gap-[2px] h-20">
                    {detail.hourlyDemand.map((h: any, i: number) => {
                      const maxLoads = Math.max(...detail.hourlyDemand.map((d: any) => d.loads));
                      const pct = (h.loads / maxLoads) * 100;
                      const isPeak = h.surgeMultiplier > detail.zone.surgeMultiplier;
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end group relative" title={`${h.hour}: ${h.loads} loads`}>
                          <div
                            className={`w-full rounded-t-sm transition-all ${isPeak ? "bg-gradient-to-t from-red-500 to-orange-400" : "bg-gradient-to-t from-slate-600 to-slate-500"}`}
                            style={{ height: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-600">12am</span>
                    <span className="text-[9px] text-slate-600">6am</span>
                    <span className="text-[9px] text-slate-600">12pm</span>
                    <span className="text-[9px] text-slate-600">6pm</span>
                    <span className="text-[9px] text-slate-600">12am</span>
                  </div>
                </div>

                {/* Top Loads */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">TOP AVAILABLE LOADS</p>
                  <div className="space-y-2">
                    {detail.topLoads.map((load: any) => (
                      <div key={load.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                        <div>
                          <p className="text-xs font-semibold text-white">{load.destination}</p>
                          <p className="text-[10px] text-slate-500">{load.miles} mi · {load.equipment.replace("_", " ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-400">${load.rate}/mi</p>
                          {load.urgency === "HOT" && (
                            <Badge className="text-[9px] px-1 py-0 bg-red-500/20 text-red-400 border-red-500/30">HOT</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SPECTRA-MATCH Integration for oil zones */}
                {detail.nearbyTerminals.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      SPECTRA-MATCH™ TERMINALS
                    </p>
                    <div className="space-y-1.5">
                      {detail.nearbyTerminals.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                          <div>
                            <p className="text-xs font-semibold text-white">{t.name}</p>
                            <p className="text-[10px] text-slate-500">{t.type}</p>
                          </div>
                          <span className="text-xs text-cyan-400 font-bold">{t.distance} mi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Trend */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">7-DAY TREND</p>
                  <div className="flex items-end gap-1 h-16">
                    {detail.weeklyTrend.map((d: any, i: number) => {
                      const maxRate = Math.max(...detail.weeklyTrend.map((t: any) => t.avgRate));
                      const pct = (d.avgRate / maxRate) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                          <div
                            className="w-full rounded-t-sm bg-gradient-to-t from-purple-600 to-purple-400"
                            style={{ height: `${Math.max(pct, 10)}%` }}
                          />
                          <span className="text-[8px] text-slate-600">{new Date(d.date).toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
