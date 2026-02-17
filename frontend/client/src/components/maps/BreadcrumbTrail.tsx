/**
 * BREADCRUMB TRAIL — Historical GPS trail visualization for route replay
 * Displays breadcrumb points with color by speed, load state indicators
 * Wired to location.telemetry.getLoadBreadcrumbs
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Route, Play, Pause, SkipBack, SkipForward, Gauge, Clock, MapPin } from "lucide-react";
import { useBreadcrumbTrail } from "@/hooks/useLocationTracking";

interface BreadcrumbTrailProps {
  loadId: number;
}

function speedToColor(speed: number): string {
  if (speed <= 0) return "bg-gray-400";
  if (speed < 30) return "bg-yellow-500";
  if (speed < 55) return "bg-green-500";
  if (speed < 70) return "bg-blue-500";
  return "bg-red-500";
}

export default function BreadcrumbTrail({ loadId }: BreadcrumbTrailProps) {
  const { breadcrumbs, isLoading } = useBreadcrumbTrail(loadId);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <Route className="h-5 w-5 mx-auto mb-1 animate-pulse opacity-50" />
          Loading breadcrumbs...
        </CardContent>
      </Card>
    );
  }

  const totalPoints = breadcrumbs.length;
  const totalDistance = totalPoints > 1
    ? breadcrumbs.reduce((sum, p, i) => {
        if (i === 0) return 0;
        const prev = breadcrumbs[i - 1];
        const R = 3959;
        const dLat = (p.lat - prev.lat) * Math.PI / 180;
        const dLng = (p.lng - prev.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(prev.lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return sum + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }, 0)
    : 0;

  const avgSpeed = totalPoints > 0
    ? Math.round(breadcrumbs.reduce((sum, p) => sum + p.speed, 0) / totalPoints)
    : 0;

  const maxSpeed = totalPoints > 0
    ? Math.round(Math.max(...breadcrumbs.map(p => p.speed)))
    : 0;

  const selectedPoint = playbackIndex !== null ? breadcrumbs[playbackIndex] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4 text-blue-500" />
            Route Trail
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {totalPoints} points
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {totalPoints === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No breadcrumbs recorded</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-1.5 rounded-md bg-muted/50">
                <p className="text-xs font-semibold">{Math.round(totalDistance)} mi</p>
                <p className="text-[9px] text-muted-foreground">Distance</p>
              </div>
              <div className="p-1.5 rounded-md bg-muted/50">
                <p className="text-xs font-semibold">{avgSpeed} mph</p>
                <p className="text-[9px] text-muted-foreground">Avg Speed</p>
              </div>
              <div className="p-1.5 rounded-md bg-muted/50">
                <p className="text-xs font-semibold">{maxSpeed} mph</p>
                <p className="text-[9px] text-muted-foreground">Max Speed</p>
              </div>
            </div>

            {/* Speed legend */}
            <div className="flex items-center gap-2 mb-3 text-[9px] text-muted-foreground">
              <span>Speed:</span>
              <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-gray-400" /> 0</span>
              <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-yellow-500" /> &lt;30</span>
              <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-green-500" /> &lt;55</span>
              <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> &lt;70</span>
              <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-red-500" /> 70+</span>
            </div>

            {/* Trail visualization */}
            <div className="relative h-24 bg-muted/30 rounded-lg overflow-hidden mb-3">
              <div className="absolute inset-0 flex items-end gap-px px-1">
                {breadcrumbs.slice(0, 200).map((p, i) => {
                  const heightPct = Math.min(100, (p.speed / 80) * 100);
                  const isSelected = playbackIndex === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setPlaybackIndex(i)}
                      className={`flex-1 min-w-[1px] transition-all ${isSelected ? "ring-1 ring-white" : ""}`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    >
                      <div className={`w-full h-full rounded-t-sm ${speedToColor(p.speed)} ${isSelected ? "opacity-100" : "opacity-70"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPlaybackIndex(0)}
                disabled={totalPoints === 0}
              >
                <SkipBack className="h-3 w-3" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPlaybackIndex(prev => Math.max(0, (prev ?? 0) - 10))}
              >
                <Pause className="h-3 w-3" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPlaybackIndex(prev => Math.min(totalPoints - 1, (prev ?? 0) + 10))}
              >
                <Play className="h-3 w-3" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPlaybackIndex(totalPoints - 1)}
                disabled={totalPoints === 0}
              >
                <SkipForward className="h-3 w-3" />
              </Button>
            </div>

            {/* Selected point detail */}
            {selectedPoint && (
              <div className="mt-3 p-2 rounded-lg bg-muted/50 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <MapPin className="h-3 w-3 mx-auto text-blue-500" />
                    <p className="font-medium">{selectedPoint.lat.toFixed(5)}</p>
                    <p className="text-[9px] text-muted-foreground">{selectedPoint.lng.toFixed(5)}</p>
                  </div>
                  <div>
                    <Gauge className="h-3 w-3 mx-auto text-blue-500" />
                    <p className="font-medium">{Math.round(selectedPoint.speed)} mph</p>
                    <p className="text-[9px] text-muted-foreground">Speed</p>
                  </div>
                  <div>
                    <Clock className="h-3 w-3 mx-auto text-blue-500" />
                    <p className="font-medium">
                      {selectedPoint.timestamp ? new Date(selectedPoint.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Time</p>
                  </div>
                </div>
                {selectedPoint.loadState && (
                  <div className="text-center mt-1">
                    <Badge variant="outline" className="text-[9px] capitalize">{selectedPoint.loadState.replace(/_/g, " ")}</Badge>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
