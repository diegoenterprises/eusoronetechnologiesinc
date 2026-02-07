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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import {
  Flame, MapPin, TrendingUp, TrendingDown, Truck, DollarSign,
  AlertTriangle, Clock, RefreshCw, ChevronRight, Layers,
  Droplets, Gauge, BarChart3, Eye, X, Zap, Target, Navigation,
  Filter, Maximize2, Minimize2
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

const US_BOUNDS = { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 };

function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * width;
  const y = ((US_BOUNDS.maxLat - lat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * height;
  return { x, y };
}

function getDemandColor(level: string): string {
  switch (level) {
    case "CRITICAL": return "#EF4444";
    case "HIGH": return "#F97316";
    case "ELEVATED": return "#EAB308";
    default: return "#6B7280";
  }
}

function getDemandBg(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-500/20 border-red-500/40 text-red-400";
    case "HIGH": return "bg-orange-500/20 border-orange-500/40 text-orange-400";
    case "ELEVATED": return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
    default: return "bg-gray-500/20 border-gray-500/40 text-gray-400";
  }
}

interface HeatMapCanvasProps {
  zones: any[];
  coldZones: any[];
  selectedZone: string | null;
  onZoneClick: (zoneId: string) => void;
  radius: number;
  opacity: number;
  intensity: number;
}

function HeatMapCanvas({ zones, coldZones, selectedZone, onZoneClick, radius, opacity, intensity }: HeatMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 400), height: Math.max(height, 300) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Draw US outline (simplified polygon)
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const outline = [
      [-124.7, 48.4], [-123.0, 48.4], [-123.0, 46.2], [-124.2, 43.0], [-124.4, 40.0],
      [-120.0, 34.5], [-117.1, 32.5], [-114.6, 32.7], [-111.0, 31.3], [-108.2, 31.8],
      [-106.6, 31.8], [-103.0, 29.0], [-99.0, 26.0], [-97.1, 25.9], [-97.1, 27.8],
      [-94.0, 29.5], [-89.6, 29.0], [-89.0, 30.2], [-85.0, 30.0], [-82.0, 25.0],
      [-80.0, 25.0], [-80.5, 31.0], [-81.0, 32.0], [-78.5, 33.8], [-75.5, 35.2],
      [-75.0, 38.0], [-74.0, 39.7], [-73.7, 40.7], [-71.8, 41.3], [-70.0, 41.7],
      [-67.0, 44.8], [-67.0, 47.3], [-69.0, 47.4], [-75.0, 45.0], [-79.0, 43.2],
      [-82.5, 41.7], [-83.5, 46.1], [-84.8, 46.8], [-88.0, 48.0], [-89.5, 48.0],
      [-95.2, 49.0], [-123.3, 49.0], [-124.7, 48.4],
    ];
    outline.forEach(([lng, lat], i) => {
      const { x, y } = latLngToXY(lat, lng, width, height);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
    ctx.fill();

    // Draw heat spots for hot zones
    zones.forEach((zone) => {
      const { x, y } = latLngToXY(zone.center.lat, zone.center.lng, width, height);
      const baseRadius = (radius / 100) * (zone.radius * 1.8);
      const intensityFactor = (intensity / 100) * zone.surgeMultiplier;

      // Outer glow
      const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, baseRadius * 2);
      if (zone.demandLevel === "CRITICAL") {
        outerGrad.addColorStop(0, `rgba(239, 68, 68, ${0.6 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(0.3, `rgba(249, 115, 22, ${0.35 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(0.6, `rgba(234, 179, 8, ${0.15 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (zone.demandLevel === "HIGH") {
        outerGrad.addColorStop(0, `rgba(249, 115, 22, ${0.5 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(0.4, `rgba(234, 179, 8, ${0.25 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        outerGrad.addColorStop(0, `rgba(234, 179, 8, ${0.35 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(0.5, `rgba(163, 230, 53, ${0.15 * (opacity / 100) * intensityFactor})`);
        outerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(x, y, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      const innerGrad = ctx.createRadialGradient(x, y, 0, x, y, baseRadius * 0.8);
      innerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.25 * (opacity / 100)})`);
      innerGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.3 * (opacity / 100)})`);
      innerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(x, y, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw cold zones (blue)
    coldZones.forEach((zone) => {
      const { x, y } = latLngToXY(zone.center.lat, zone.center.lng, width, height);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 30);
      grad.addColorStop(0, `rgba(59, 130, 246, ${0.3 * (opacity / 100)})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [zones, coldZones, dimensions, radius, opacity, intensity]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Interactive zone markers */}
      {zones.map((zone) => {
        const xPct = ((zone.center.lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * 100;
        const yPct = ((US_BOUNDS.maxLat - zone.center.lat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * 100;
        const isSelected = selectedZone === zone.id;
        return (
          <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            onClick={() => onZoneClick(zone.id)}
          >
            {zone.demandLevel === "CRITICAL" && (
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" style={{ width: 28, height: 28, margin: -2 }} />
            )}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-200 
              ${isSelected ? "scale-150 ring-2 ring-white" : "group-hover:scale-125"}
              ${zone.demandLevel === "CRITICAL" ? "bg-red-500 border-red-300" :
                zone.demandLevel === "HIGH" ? "bg-orange-500 border-orange-300" :
                "bg-yellow-500 border-yellow-300"}`}
            >
              <Flame className="w-3 h-3 text-white" />
            </div>
            {/* Tooltip */}
            <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900/95 border border-slate-600 
              rounded-lg p-2.5 whitespace-nowrap text-xs text-white shadow-xl z-30
              ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity pointer-events-none`}>
              <p className="font-bold text-sm">{zone.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-[10px] px-1.5 py-0 ${getDemandBg(zone.demandLevel)}`}>{zone.demandLevel}</Badge>
                <span className="text-emerald-400 font-bold">{zone.surgeMultiplier}x</span>
              </div>
              <p className="text-gray-400 mt-1">{zone.loadCount} loads · ${zone.avgRate}/mi</p>
            </div>
          </div>
        );
      })}
      {/* Cold zone markers */}
      {coldZones.map((zone) => {
        const xPct = ((zone.center.lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * 100;
        const yPct = ((US_BOUNDS.maxLat - zone.center.lat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * 100;
        return (
          <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-blue-500/60 border border-blue-400/50 flex items-center justify-center">
              <TrendingDown className="w-2.5 h-2.5 text-blue-200" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900/95 border border-slate-600 rounded-lg p-2 whitespace-nowrap text-xs text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
              <p className="font-semibold text-blue-300">{zone.name}</p>
              <p className="text-gray-400">{zone.surgeMultiplier}x · {zone.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HotZones() {
  const [equipment, setEquipment] = useState("ALL");
  const [demandLevel, setDemandLevel] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [radius, setRadius] = useState([65]);
  const [mapOpacity, setMapOpacity] = useState([75]);
  const [intensity, setIntensity] = useState([80]);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zonesQuery = trpc.hotZones.getActiveZones.useQuery({
    equipment: equipment !== "ALL" ? equipment : undefined,
    minDemandLevel: demandLevel !== "ALL" ? demandLevel as any : undefined,
  }, { refetchInterval: 60000 });

  const detailQuery = trpc.hotZones.getZoneDetail.useQuery(
    { zoneId: selectedZone! },
    { enabled: !!selectedZone }
  );

  const zones = zonesQuery.data?.hotZones || [];
  const coldZones = zonesQuery.data?.coldZones || [];
  const summary = zonesQuery.data?.summary;
  const detail = detailQuery.data;

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => zonesQuery.refetch()} disabled={zonesQuery.isRefetching}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${zonesQuery.isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in-up">
          {[
            { label: "Active Hot Zones", value: summary.totalHotZones, icon: Flame, color: "text-orange-400", bg: "from-orange-500/10 to-red-500/10" },
            { label: "Critical Zones", value: summary.criticalZones, icon: AlertTriangle, color: "text-red-400", bg: "from-red-500/10 to-rose-500/10" },
            { label: "Avg Surge", value: `${summary.avgSurge}x`, icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-500/10 to-green-500/10" },
            { label: "Open Loads", value: summary.totalOpenLoads.toLocaleString(), icon: Truck, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/10" },
            { label: "Available Trucks", value: summary.totalAvailableTrucks.toLocaleString(), icon: Navigation, color: "text-purple-400", bg: "from-purple-500/10 to-violet-500/10" },
          ].map((stat) => (
            <div key={stat.label} className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${stat.bg} border border-white/10`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
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

              {zonesQuery.isLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Skeleton className="w-full h-full bg-slate-700" />
                </div>
              ) : (
                <div className="h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <HeatMapCanvas
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

          {/* Zone Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {zones.map((zone, idx) => (
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
