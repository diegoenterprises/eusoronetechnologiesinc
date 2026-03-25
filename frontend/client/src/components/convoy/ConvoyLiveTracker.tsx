/**
 * CONVOY LIVE TRACKER (GAP-082 Task 5.1)
 * Real-time map view of convoy vehicle positions with:
 * - Live GPS positions for lead, load, and rear vehicles
 * - Auto-refresh every 5 seconds
 * - Separation distance indicators with alerts
 * - AI-optimal spacing overlay
 * - Speed/heading display per vehicle
 * - Formation health status
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Navigation, Truck, Shield, Eye, AlertTriangle, CheckCircle,
  Radio, Gauge, MapPin, Zap, RefreshCw, Wifi, WifiOff,
  ChevronDown, ChevronUp, Maximize2, Minimize2, Wind, Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvoyLiveTrackerProps {
  convoyId?: number;
  loadId?: number;
  className?: string;
  compact?: boolean;
}

const ROLE_META: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; markerColor: string }> = {
  lead: { label: "Lead Escort", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: <Navigation className="w-4 h-4" />, markerColor: "#3b82f6" },
  load: { label: "Load Vehicle", color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: <Truck className="w-4 h-4" />, markerColor: "#10b981" },
  rear: { label: "Rear Escort", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: <Eye className="w-4 h-4" />, markerColor: "#a855f7" },
};

function metersToDisplay(m: number): string {
  if (m < 500) return `${Math.round(m * 3.281)} ft`;
  return `${(m / 1609.34).toFixed(2)} mi`;
}

function speedBadge(speed: number) {
  if (speed <= 0) return <Badge variant="outline" className="text-xs border-slate-600 text-slate-500">Stopped</Badge>;
  if (speed < 25) return <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-400">{speed} mph</Badge>;
  if (speed < 45) return <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400">{speed} mph</Badge>;
  return <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">{speed} mph</Badge>;
}

function FormationHealth({ leadDist, rearDist, targetLead, targetRear }: {
  leadDist: number | null; rearDist: number | null; targetLead: number; targetRear: number;
}) {
  let score = 100;
  let status: "excellent" | "good" | "warning" | "critical" = "excellent";
  const issues: string[] = [];

  if (leadDist === null) { score -= 30; issues.push("Lead position unknown"); }
  else if (leadDist > targetLead * 1.5) { score -= 40; issues.push("Lead too far"); }
  else if (leadDist > targetLead) { score -= 15; issues.push("Lead spacing wide"); }

  if (rearDist === null) { /* rear is optional */ }
  else if (rearDist > targetRear * 1.5) { score -= 40; issues.push("Rear too far"); }
  else if (rearDist > targetRear) { score -= 15; issues.push("Rear spacing wide"); }

  score = Math.max(0, score);
  if (score >= 80) status = "excellent";
  else if (score >= 60) status = "good";
  else if (score >= 40) status = "warning";
  else status = "critical";

  const colors = {
    excellent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    good: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border", colors[status])}>
      {status === "excellent" ? <CheckCircle className="w-3.5 h-3.5" /> :
       status === "good" ? <Gauge className="w-3.5 h-3.5" /> :
       <AlertTriangle className="w-3.5 h-3.5" />}
      <span className="text-xs font-semibold">{score}%</span>
      <span className="text-xs opacity-80">{status === "excellent" ? "Tight Formation" : issues[0] || status}</span>
    </div>
  );
}

export default function ConvoyLiveTracker({ convoyId, loadId, className, compact = false }: ConvoyLiveTrackerProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [refreshRate, setRefreshRate] = useState(5000);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylineRef = useRef<any>(null);

  // Fetch convoy details
  const convoyQuery = (trpc as any).convoy?.getConvoy?.useQuery?.(
    { convoyId, loadId },
    { enabled: !!(convoyId || loadId), staleTime: 30_000 }
  ) || { data: null, isLoading: false };
  const convoy = convoyQuery.data;

  // Fetch real-time positions (auto-refresh)
  const positionsQuery = (trpc as any).convoy?.getConvoyPositions?.useQuery?.(
    { convoyId: convoy?.id || convoyId || 0 },
    {
      enabled: !!(convoy?.id || convoyId),
      refetchInterval: refreshRate,
      staleTime: refreshRate - 1000,
    }
  ) || { data: null, isLoading: false };
  const posData = positionsQuery.data;

  // AI spacing recommendation
  const spacingQuery = (trpc as any).convoy?.predictOptimalSpacing?.useQuery?.(
    {
      convoyId: convoy?.id || convoyId,
      loadId: convoy?.loadId || loadId,
      currentSpeed: posData?.positions?.find((p: any) => p.role === "load")?.speed || undefined,
    },
    {
      enabled: !!(convoy?.id || convoyId) && expanded,
      staleTime: 60_000,
    }
  ) || { data: null };
  const spacing = spacingQuery.data;

  // Track refresh timestamp
  useEffect(() => {
    if (posData) setLastRefresh(new Date());
  }, [posData]);

  // Initialize Google Map
  useEffect(() => {
    if (!expanded || !mapRef.current) return;
    const g = (window as any).google?.maps;
    if (!g || googleMapRef.current) return;

    googleMapRef.current = new g.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 8,
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#475569" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });
  }, [expanded]);

  // Update markers when positions change
  useEffect(() => {
    if (!googleMapRef.current || !posData?.positions) return;
    const g = (window as any).google?.maps;
    if (!g) return;

    const bounds = new g.LatLngBounds();
    const positions = posData.positions as Array<{
      userId: number; role: string; lat: number; lng: number; speed: number; heading: number; timestamp: string;
    }>;

    // Update or create markers
    for (const pos of positions) {
      const key = `${pos.role}-${pos.userId}`;
      const meta = ROLE_META[pos.role] || ROLE_META.load;
      const latLng = new g.LatLng(pos.lat, pos.lng);
      bounds.extend(latLng);

      if (markersRef.current.has(key)) {
        // Update existing marker position with animation
        const marker = markersRef.current.get(key);
        marker.setPosition(latLng);
      } else {
        // Create new marker
        const marker = new g.Marker({
          position: latLng,
          map: googleMapRef.current,
          title: meta.label,
          icon: {
            path: g.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: meta.markerColor,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: 7,
            rotation: pos.heading || 0,
          },
        });
        markersRef.current.set(key, marker);
      }

      // Update heading rotation
      const marker = markersRef.current.get(key);
      if (marker?.getIcon) {
        const icon = marker.getIcon();
        if (icon && typeof icon === "object") {
          icon.rotation = pos.heading || 0;
          marker.setIcon(icon);
        }
      }
    }

    // Draw polyline connecting vehicles in formation order
    const orderedPositions = ["lead", "load", "rear"]
      .map(role => positions.find(p => p.role === role))
      .filter(Boolean)
      .map(p => new g.LatLng(p!.lat, p!.lng));

    if (polylineRef.current) polylineRef.current.setMap(null);
    if (orderedPositions.length >= 2) {
      polylineRef.current = new g.Polyline({
        path: orderedPositions,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 3,
        map: googleMapRef.current,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
          offset: "0",
          repeat: "15px",
        }],
      });
    }

    // Fit map to bounds
    if (positions.length > 0) {
      googleMapRef.current.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
      // Don't zoom in too much for close vehicles
      const listener = g.event.addListenerOnce(googleMapRef.current, "idle", () => {
        if (googleMapRef.current.getZoom() > 16) googleMapRef.current.setZoom(16);
      });
    }
  }, [posData]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap?.(null));
      markersRef.current.clear();
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, []);

  if (!convoyId && !loadId) return null;

  if (convoyQuery.isLoading) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl", className)}>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-48 bg-slate-700/50" />
          <Skeleton className="h-48 w-full bg-slate-700/50 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!convoy) return null;

  const positions = (posData?.positions || []) as Array<{
    userId: number; role: string; lat: number; lng: number; speed: number; heading: number; timestamp: string;
  }>;

  const isActive = convoy.status === "active";
  const leadPos = positions.find(p => p.role === "lead");
  const loadPos = positions.find(p => p.role === "load");
  const rearPos = positions.find(p => p.role === "rear");

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Convoy Tracker</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-xs",
                  isActive ? "border-emerald-500/40 text-emerald-400" : "border-slate-600 text-slate-400"
                )}>
                  {isActive ? <><Wifi className="w-2.5 h-2.5 mr-1" />LIVE</> : convoy.status}
                </Badge>
                {lastRefresh && (
                  <span className="text-xs text-slate-500">
                    Updated {Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s ago
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <FormationHealth
                leadDist={posData?.leadDistance ?? null}
                rearDist={posData?.rearDistance ?? null}
                targetLead={convoy.targetLeadDistance || 800}
                targetRear={convoy.targetRearDistance || 500}
              />
            )}
            <Select value={String(refreshRate)} onValueChange={v => setRefreshRate(Number(v))}>
              <SelectTrigger className="w-20 h-7 text-xs bg-slate-700/50 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3000">3s</SelectItem>
                <SelectItem value="5000">5s</SelectItem>
                <SelectItem value="10000">10s</SelectItem>
                <SelectItem value="30000">30s</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white p-1">
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <CardContent className="p-4 space-y-4">
          {/* Map */}
          <div
            ref={mapRef}
            className="w-full h-64 md:h-80 rounded-lg bg-slate-900/50 border border-slate-700/30"
            style={{ minHeight: 240 }}
          />

          {/* Vehicle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { role: "lead", pos: leadPos, name: convoy.lead?.name },
              { role: "load", pos: loadPos, name: convoy.loadVehicle?.name },
              { role: "rear", pos: rearPos, name: convoy.rear?.name },
            ].filter(v => v.name).map(v => {
              const meta = ROLE_META[v.role];
              const hasSignal = !!v.pos;
              return (
                <div key={v.role} className={cn(
                  "p-3 rounded-xl border",
                  hasSignal ? `${meta.bgColor} border-current/10` : "bg-slate-900/30 border-slate-700/30"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={meta.color}>{meta.icon}</span>
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">{meta.label}</span>
                    </div>
                    {hasSignal ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                  </div>
                  <p className="text-xs text-white font-medium mb-1.5">{v.name}</p>
                  {v.pos ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {speedBadge(Math.round(v.pos.speed))}
                      <span className="text-xs text-slate-500">
                        {v.pos.lat.toFixed(4)}, {v.pos.lng.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">No position data</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Separation Distances */}
          {isActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-700/30 bg-slate-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500">Lead ↔ Load Distance</span>
                  {posData?.leadDistance != null && posData.leadDistance > (convoy.targetLeadDistance || 800) && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-lg font-bold font-mono",
                    posData?.leadDistance == null ? "text-slate-600" :
                    posData.leadDistance > (convoy.targetLeadDistance || 800) ? "text-red-400" :
                    "text-blue-400"
                  )}>
                    {posData?.leadDistance != null ? metersToDisplay(posData.leadDistance) : "—"}
                  </span>
                  <span className="text-xs text-slate-500">
                    target: {metersToDisplay(convoy.targetLeadDistance || 800)}
                  </span>
                </div>
                {/* Progress bar */}
                {posData?.leadDistance != null && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        posData.leadDistance > (convoy.targetLeadDistance || 800) * 1.2 ? "bg-red-500 animate-pulse" :
                        posData.leadDistance > (convoy.targetLeadDistance || 800) ? "bg-amber-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min((posData.leadDistance / ((convoy.targetLeadDistance || 800) * 1.5)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {convoy.rear && (
                <div className="p-3 rounded-xl border border-slate-700/30 bg-slate-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500">Load ↔ Rear Distance</span>
                    {posData?.rearDistance != null && posData.rearDistance > (convoy.targetRearDistance || 500) && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-lg font-bold font-mono",
                      posData?.rearDistance == null ? "text-slate-600" :
                      posData.rearDistance > (convoy.targetRearDistance || 500) ? "text-red-400" :
                      "text-purple-400"
                    )}>
                      {posData?.rearDistance != null ? metersToDisplay(posData.rearDistance) : "—"}
                    </span>
                    <span className="text-xs text-slate-500">
                      target: {metersToDisplay(convoy.targetRearDistance || 500)}
                    </span>
                  </div>
                  {posData?.rearDistance != null && (
                    <div className="mt-2 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          posData.rearDistance > (convoy.targetRearDistance || 500) * 1.2 ? "bg-red-500 animate-pulse" :
                          posData.rearDistance > (convoy.targetRearDistance || 500) ? "bg-amber-500" : "bg-purple-500"
                        )}
                        style={{ width: `${Math.min((posData.rearDistance / ((convoy.targetRearDistance || 500) * 1.5)) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Spacing Recommendation */}
          {spacing && (
            <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-medium">AI Optimal Spacing</span>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  {spacing.confidence}% confidence
                </Badge>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                  {spacing.model === "ml_blended" ? "ML Blended" : "Rule Based"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Lead Distance</p>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{metersToDisplay(spacing.recommendedLeadDistance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rear Distance</p>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{metersToDisplay(spacing.recommendedRearDistance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Max Speed</p>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{spacing.recommendedMaxSpeed} mph</p>
                </div>
              </div>
              {spacing.warnings?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {spacing.warnings.map((w: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
