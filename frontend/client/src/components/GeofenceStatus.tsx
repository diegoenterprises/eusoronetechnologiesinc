/**
 * GEOFENCE STATUS — Driver-facing geofence proximity & status panel
 * 
 * Shows:
 *   - Current GPS/sensor status with signal indicator
 *   - Nearest geofence with distance + approach/inside indicators
 *   - All active geofences for current load with enter/exit state
 *   - Offline mode indicator + pending event count
 *   - Device sensor fallback status
 * 
 * Theme-aware: light & dark mode via useTheme
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Navigation, Wifi, WifiOff, Compass,
  Radio, CheckCircle, AlertTriangle, Clock,
  RefreshCw, Loader2, Shield, Truck, CircleDot,
  ArrowUp, Signal, SignalLow, SignalZero,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useOfflineGeofence, OfflineGeofenceOptions } from "@/hooks/useOfflineGeofence";
import type { GeofenceState } from "@/lib/offlineGeofence";
import { toast } from "sonner";

interface GeofenceStatusProps {
  loadId?: number;
  compact?: boolean;
  className?: string;
  onGeofenceEnter?: (gf: GeofenceState) => void;
  onGeofenceExit?: (gf: GeofenceState) => void;
}

export default function GeofenceStatus({
  loadId,
  compact = false,
  className,
  onGeofenceEnter,
  onGeofenceExit,
}: GeofenceStatusProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [syncing, setSyncing] = useState(false);

  const {
    position,
    geofenceStates,
    nearestGeofence,
    insideGeofences,
    isOffline,
    isTracking,
    gpsStatus,
    sensorsFallbackActive,
    cachedGeofenceCount,
    pendingEventCount,
    lastSyncAt,
    forceSync,
    refreshGeofences,
  } = useOfflineGeofence({
    loadId,
    enabled: true,
    downloadRadiusMeters: 5000,
    checkIntervalMs: 3000,
    onEnter: (gf) => {
      toast.success(`Entered ${gf.name}`, { description: `${gf.type} zone` });
      onGeofenceEnter?.(gf);
    },
    onExit: (gf) => {
      toast.info(`Exited ${gf.name}`, { description: `${gf.type} zone` });
      onGeofenceExit?.(gf);
    },
    onApproach: (gf) => {
      toast(`Approaching ${gf.name}`, { description: `${Math.round(gf.distance)}m away` });
    },
    onDwell: (gf, seconds) => {
      toast.warning(`Dwell alert: ${gf.name}`, { description: `Stationary for ${Math.floor(seconds / 60)}m ${seconds % 60}s` });
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forceSync();
      await refreshGeofences();
      toast.success("Synced successfully");
    } catch {
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  // Shared styles
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");
  const vl = isLight ? "text-slate-800" : "text-white";
  const mt = "text-slate-400";

  // Signal icon based on GPS status
  const SignalIcon = gpsStatus === "tracking"
    ? Signal
    : gpsStatus === "loading"
      ? SignalLow
      : SignalZero;

  const signalColor = gpsStatus === "tracking"
    ? "text-green-400"
    : gpsStatus === "loading"
      ? "text-yellow-400"
      : "text-red-400";

  // Source label
  const sourceLabel = {
    gps: "GPS",
    sensors: "Sensors",
    dead_reckoning: "Dead Reckoning",
    cached: "Cached",
    none: "No Signal",
  }[position.source];

  // ─── Compact View ────────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isOffline ? (isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/30") : (isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"), className)}>
        {/* Signal */}
        <div className={cn("flex items-center gap-1.5")}>
          <SignalIcon className={cn("w-4 h-4", signalColor)} />
          <span className={cn("text-[10px] font-medium", signalColor)}>{sourceLabel}</span>
        </div>

        {/* Nearest geofence */}
        {nearestGeofence ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <CircleDot className={cn("w-3.5 h-3.5 shrink-0", nearestGeofence.inside ? "text-green-400" : "text-blue-400")} />
            <span className={cn("text-xs truncate", vl)}>{nearestGeofence.name}</span>
            <Badge className={cn("text-[9px] px-1 py-0 shrink-0", nearestGeofence.inside ? "bg-green-500/20 text-green-400 border-0" : "bg-blue-500/20 text-blue-400 border-0")}>
              {nearestGeofence.inside ? "Inside" : nearestGeofence.distanceFormatted}
            </Badge>
          </div>
        ) : (
          <span className={cn("text-xs", mt)}>No geofences nearby</span>
        )}

        {/* Offline indicator */}
        {isOffline && (
          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[9px] px-1.5 py-0 shrink-0">
            <WifiOff className="w-2.5 h-2.5 mr-0.5" />Offline
          </Badge>
        )}

        {/* Pending events */}
        {pendingEventCount > 0 && (
          <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[9px] px-1.5 py-0 shrink-0">
            {pendingEventCount} queued
          </Badge>
        )}
      </div>
    );
  }

  // ─── Full View ───────────────────────────────────────────────────────────

  return (
    <Card className={cn(cc, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-base flex items-center gap-2", vl)}>
            <Radio className="w-4 h-4 text-blue-500" />
            Geofence Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                <WifiOff className="w-3 h-3 mr-1" />Offline
              </Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]">
                <Wifi className="w-3 h-3 mr-1" />Online
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleSync}
              disabled={syncing || isOffline}
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GPS Status Bar */}
        <div className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-700/30")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SignalIcon className={cn("w-4 h-4", signalColor)} />
              <span className={cn("text-xs font-medium", vl)}>Position Source</span>
            </div>
            <Badge className={cn("text-[10px] px-1.5 py-0 border-0",
              position.source === "gps" ? "bg-green-500/20 text-green-400"
                : position.source === "dead_reckoning" ? "bg-amber-500/20 text-amber-400"
                  : position.source === "sensors" ? "bg-blue-500/20 text-blue-400"
                    : "bg-red-500/20 text-red-400"
            )}>
              {sourceLabel}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className={cn("text-[10px]", mt)}>Lat</p>
              <p className={cn("text-xs font-mono", vl)}>{position.lat?.toFixed(5) ?? "--"}</p>
            </div>
            <div>
              <p className={cn("text-[10px]", mt)}>Lng</p>
              <p className={cn("text-xs font-mono", vl)}>{position.lng?.toFixed(5) ?? "--"}</p>
            </div>
            <div>
              <p className={cn("text-[10px]", mt)}>Speed</p>
              <p className={cn("text-xs font-mono", vl)}>{position.speed != null ? `${(position.speed * 2.237).toFixed(0)} mph` : "--"}</p>
            </div>
            <div>
              <p className={cn("text-[10px]", mt)}>Heading</p>
              <p className={cn("text-xs font-mono", vl)}>{position.heading != null ? `${Math.round(position.heading)}°` : "--"}</p>
            </div>
          </div>

          {/* Sensor fallback indicator */}
          {sensorsFallbackActive && (
            <div className={cn("mt-2 flex items-center gap-2 p-2 rounded-md", isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20")}>
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-medium">Sensor fallback active — GPS signal lost, using compass + accelerometer</span>
            </div>
          )}
        </div>

        {/* Nearest Geofence */}
        {nearestGeofence && (
          <div className={cn("p-3 rounded-lg border",
            nearestGeofence.inside
              ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")
              : nearestGeofence.distance < nearestGeofence.distance * 1.5
                ? (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")
                : (isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-700/30")
          )}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <MapPin className={cn("w-4 h-4", nearestGeofence.inside ? "text-green-400" : "text-blue-400")} />
                <span className={cn("text-sm font-medium", vl)}>{nearestGeofence.name}</span>
              </div>
              <Badge className={cn("text-[10px] px-1.5 py-0 border-0",
                nearestGeofence.inside ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {nearestGeofence.inside ? "Inside" : nearestGeofence.distanceFormatted}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={cn("text-[9px] px-1.5 py-0 border",
                isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-slate-800 text-slate-400 border-slate-700"
              )}>
                {nearestGeofence.type}
              </Badge>
              {nearestGeofence.inside && nearestGeofence.dwellSeconds > 0 && (
                <span className={cn("text-[10px]", mt)}>
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  Dwell: {Math.floor(nearestGeofence.dwellSeconds / 60)}m {nearestGeofence.dwellSeconds % 60}s
                </span>
              )}
            </div>
            {/* Proximity bar */}
            {!nearestGeofence.inside && nearestGeofence.distance < 2000 && (
              <div className="mt-2">
                <Progress value={Math.max(0, 100 - (nearestGeofence.distance / 2000) * 100)} className="h-1.5" />
                <p className={cn("text-[9px] mt-1", mt)}>Approaching — {nearestGeofence.distanceFormatted} to boundary</p>
              </div>
            )}
          </div>
        )}

        {/* Active Geofences List */}
        {geofenceStates.length > 0 && (
          <div className="space-y-2">
            <p className={cn("text-xs font-medium", mt)}>Active Geofences ({geofenceStates.length})</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {geofenceStates
                .sort((a, b) => a.distance - b.distance)
                .map((gf) => (
                  <div
                    key={gf.geofenceId}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs",
                      gf.inside
                        ? (isLight ? "bg-green-50 border border-green-200" : "bg-green-500/10 border border-green-500/20")
                        : (isLight ? "bg-slate-50 border border-slate-100" : "bg-slate-900/30 border border-slate-800")
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {gf.inside
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        : <CircleDot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      }
                      <span className={cn("truncate", vl)}>{gf.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn("text-[9px] px-1 py-0 border-0",
                        gf.type === "pickup" ? "bg-blue-500/15 text-blue-400"
                          : gf.type === "delivery" ? "bg-purple-500/15 text-purple-400"
                            : "bg-slate-500/15 text-slate-400"
                      )}>
                        {gf.type}
                      </Badge>
                      <span className={cn("text-[10px] font-mono tabular-nums", gf.inside ? "text-green-400" : mt)}>
                        {gf.inside ? "0m" : gf.distance < 1000 ? `${Math.round(gf.distance)}m` : `${(gf.distance / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* System Status Footer */}
        <div className={cn("flex items-center justify-between pt-2 border-t", isLight ? "border-slate-200" : "border-slate-700/50")}>
          <div className="flex items-center gap-3">
            <span className={cn("text-[10px]", mt)}>
              <Shield className="w-3 h-3 inline mr-0.5" />
              {cachedGeofenceCount} cached
            </span>
            {pendingEventCount > 0 && (
              <span className="text-[10px] text-amber-400">
                <ArrowUp className="w-3 h-3 inline mr-0.5" />
                {pendingEventCount} pending
              </span>
            )}
          </div>
          {lastSyncAt && (
            <span className={cn("text-[10px]", mt)}>
              Synced {Math.floor((Date.now() - lastSyncAt) / 1000)}s ago
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
