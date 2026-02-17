/**
 * DRIVER POSITION CARD — Real-time driver position with speed, heading, load info
 * Wired to location.telemetry.getDriverLocation
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation2, Gauge, MapPin, Signal, Battery, Truck } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DriverPositionCardProps {
  driverId: number;
  driverName?: string;
  loadNumber?: string;
  compact?: boolean;
}

export default function DriverPositionCard({ driverId, driverName, loadNumber, compact = false }: DriverPositionCardProps) {
  const { data: position, isLoading } = trpc.location.telemetry.getDriverLocation.useQuery(
    { driverId },
    { enabled: !!driverId, refetchInterval: 10000 },
  );

  if (!position && !isLoading) {
    return compact ? null : (
      <Card>
        <CardContent className="p-3 text-center text-muted-foreground text-xs">
          <Signal className="h-4 w-4 mx-auto mb-1 opacity-30" />
          No GPS signal
        </CardContent>
      </Card>
    );
  }

  if (compact && position) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>{position.lat?.toFixed(4)}, {position.lng?.toFixed(4)}</span>
        {position.speed > 0 && <span className="text-muted-foreground">{Math.round(position.speed)} mph</span>}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Navigation2
                className="h-5 w-5 text-blue-500"
                style={{ transform: `rotate(${position?.heading || 0}deg)` }}
              />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div>
              {driverName && <p className="text-sm font-medium">{driverName}</p>}
              <p className="text-[10px] text-muted-foreground">
                {position?.lat?.toFixed(5)}, {position?.lng?.toFixed(5)}
              </p>
            </div>
          </div>
          <div className="text-right">
            {loadNumber && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" />
                {loadNumber}
              </div>
            )}
          </div>
        </div>

        {position && (
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="p-1.5 rounded-md bg-muted/50">
              <Gauge className="h-3.5 w-3.5 mx-auto text-blue-500" />
              <p className="text-xs font-semibold mt-0.5">{Math.round(position.speed)} mph</p>
              <p className="text-[9px] text-muted-foreground">Speed</p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/50">
              <Navigation2 className="h-3.5 w-3.5 mx-auto text-blue-500" style={{ transform: `rotate(${position.heading}deg)` }} />
              <p className="text-xs font-semibold mt-0.5">{Math.round(position.heading)}</p>
              <p className="text-[9px] text-muted-foreground">Heading</p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/50">
              <MapPin className="h-3.5 w-3.5 mx-auto text-blue-500" />
              <p className="text-xs font-semibold mt-0.5">
                {position.updatedAt ? new Date(position.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
              </p>
              <p className="text-[9px] text-muted-foreground">Updated</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
