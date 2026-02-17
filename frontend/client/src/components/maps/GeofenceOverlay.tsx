/**
 * GEOFENCE OVERLAY — Displays active geofences for a load
 * Shows pickup/delivery approach zones and facility zones with event indicators
 * Wired to location.geofences.getForLoad + location.geofences.getEventsForLoad
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, MapPin, Circle, ArrowDownToLine, ArrowUpFromLine, Clock, AlertTriangle } from "lucide-react";
import { useGeofenceEvents } from "@/hooks/useLocationTracking";

interface GeofenceOverlayProps {
  loadId: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  pickup: { label: "Pickup", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  delivery: { label: "Delivery", color: "text-green-500 bg-green-50 dark:bg-green-950/30" },
  waypoint: { label: "Waypoint", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
  state_boundary: { label: "State Border", color: "text-gray-500 bg-gray-50 dark:bg-gray-950/30" },
  hazmat_restricted: { label: "Hazmat Zone", color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
  custom: { label: "Custom", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  enter: ArrowDownToLine,
  exit: ArrowUpFromLine,
  dwell: Clock,
  approach: MapPin,
};

export default function GeofenceOverlay({ loadId }: GeofenceOverlayProps) {
  const { geofences, events, isLoading } = useGeofenceEvents(loadId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            Geofences
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {geofences.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {geofences.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No active geofences</p>
        ) : (
          <div className="space-y-2">
            {geofences.map((gf: any) => {
              const typeInfo = TYPE_LABELS[gf.type] || TYPE_LABELS.custom;
              const gfEvents = events.filter((e: any) => e.geofenceId === gf.id);
              const center = gf.center as { lat: number; lng: number } | null;

              return (
                <div key={gf.id} className="p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${typeInfo.color}`}>
                        <Circle className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{gf.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {gf.radiusMeters ? `${gf.radiusMeters}m radius` : "Polygon"} | {gf.shape}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {gf.alertOnEnter && <Badge variant="outline" className="text-[8px]">Enter</Badge>}
                      {gf.alertOnExit && <Badge variant="outline" className="text-[8px]">Exit</Badge>}
                      {gf.alertOnDwell && <Badge variant="outline" className="text-[8px]">Dwell</Badge>}
                    </div>
                  </div>

                  {center && (
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {center.lat?.toFixed(4)}, {center.lng?.toFixed(4)}
                    </p>
                  )}

                  {/* Recent events for this geofence */}
                  {gfEvents.length > 0 && (
                    <div className="mt-1.5 border-t pt-1.5 space-y-0.5">
                      {gfEvents.slice(0, 3).map((e: any) => {
                        const Icon = EVENT_ICONS[e.eventType] || Circle;
                        return (
                          <div key={e.id} className="flex items-center gap-1.5 text-[10px]">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="capitalize font-medium">{e.eventType}</span>
                            <span className="text-muted-foreground">
                              {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                            {e.dwellSeconds && e.dwellSeconds > 0 && (
                              <span className="text-amber-500">{Math.round(e.dwellSeconds / 60)} min</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
