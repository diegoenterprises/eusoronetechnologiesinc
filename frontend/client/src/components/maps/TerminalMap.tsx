/**
 * TERMINAL MAP — Approaching trucks for terminal managers
 * Show trucks within 30-mile radius with ETAs, gate arrival queue
 * Wired to location.tracking.getTerminalQueue
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck, Clock, MapPin, RefreshCw, ArrowDown, Gauge,
  User, Package, Building2,
} from "lucide-react";
import { useTerminalQueue } from "@/hooks/useLocationTracking";

interface TerminalMapProps {
  facilityLat: number;
  facilityLng: number;
  facilityName?: string;
  radiusMiles?: number;
}

export default function TerminalMap({ facilityLat, facilityLng, facilityName, radiusMiles = 30 }: TerminalMapProps) {
  const { queue, isLoading, refetch } = useTerminalQueue(facilityLat, facilityLng, radiusMiles);

  const approaching = queue.filter((t: any) => t.distanceMiles > 1);
  const atFacility = queue.filter((t: any) => t.distanceMiles <= 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="font-semibold">{facilityName || "Terminal"}</h2>
            <p className="text-xs text-muted-foreground">
              {queue.length} truck{queue.length !== 1 ? "s" : ""} within {radiusMiles} miles
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* At Facility */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              At Facility ({atFacility.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atFacility.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No trucks at facility</p>
            ) : (
              atFacility.map((t: any) => (
                <div key={t.loadId} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <div className="text-xs">
                      <p className="font-medium">{t.driverName}</p>
                      <p className="text-muted-foreground">Load {t.loadNumber}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">At Gate</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Approaching */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-blue-500" />
              Approaching ({approaching.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {approaching.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No trucks approaching</p>
            ) : (
              approaching.map((t: any) => (
                <div key={t.loadId} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <div className="text-xs">
                      <p className="font-medium">{t.driverName}</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>Load {t.loadNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="flex items-center gap-1 justify-end font-medium">
                      <Clock className="h-3 w-3 text-blue-500" />
                      {t.etaMinutes < 60
                        ? `${t.etaMinutes} min`
                        : `${Math.floor(t.etaMinutes / 60)}h ${t.etaMinutes % 60}m`}
                    </div>
                    <p className="text-muted-foreground">{t.distanceMiles} mi</p>
                    {t.speed > 0 && (
                      <p className="text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Gauge className="h-3 w-3" />
                        {Math.round(t.speed)} mph
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
