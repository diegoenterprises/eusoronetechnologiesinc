/**
 * CONTAINER TRACKING — V5 Multi-Modal
 * Real-time container tracking: search by container number,
 * movement history timeline from DB, current location on Google Maps
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Container,
  Search,
  MapPin,
  Ship,
  TrainFront,
  Truck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  truck: <Truck className="w-4 h-4 text-orange-400" />,
  rail: <TrainFront className="w-4 h-4 text-blue-400" />,
  vessel: <Ship className="w-4 h-4 text-cyan-400" />,
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};

const MODE_COLORS: Record<string, string> = {
  truck: "bg-orange-500/20 border-orange-500/30",
  rail: "bg-blue-500/20 border-blue-500/30",
  vessel: "bg-cyan-500/20 border-cyan-500/30",
  TRUCK: "bg-orange-500/20 border-orange-500/30",
  RAIL: "bg-blue-500/20 border-blue-500/30",
  VESSEL: "bg-cyan-500/20 border-cyan-500/30",
};

const MODE_BADGE: Record<string, string> = {
  truck: "bg-orange-500/20 text-orange-400",
  rail: "bg-blue-500/20 text-blue-400",
  vessel: "bg-cyan-500/20 text-cyan-400",
  TRUCK: "bg-orange-500/20 text-orange-400",
  RAIL: "bg-blue-500/20 text-blue-400",
  VESSEL: "bg-cyan-500/20 text-cyan-400",
};

export default function ContainerTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const tracking = (trpc as any).vesselShipments.getContainerTracking.useQuery(
    { containerNumber: search },
    { enabled: searched && search.length > 3 }
  );

  const container = tracking.data?.container;
  const movements: any[] = tracking.data?.movements || [];
  const currentLoc = container?.currentLocation;

  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => { if (check()) { setMapsReady(true); clearInterval(interval); } }, 300);
    return () => clearInterval(interval);
  }, []);

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-2xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  const handleSearch = () => {
    if (search.length > 3) setSearched(true);
  };

  return (
    <div className={cn("min-h-screen p-6 space-y-4", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10"><Container className="w-6 h-6 text-cyan-400" /></div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Container Tracking</h1>
          <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Cross-modal container journey tracking</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          <Input
            className={cn("pl-9 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")}
            placeholder="Enter container number (e.g. MSCU1234567)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-xl" onClick={handleSearch}>Track</Button>
      </div>

      {/* Container Info + Map */}
      {container && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className={cardBg}>
            <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Container className="w-4 h-4 text-cyan-400" />{container.containerNumber}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Type", container.isoType],
                ["Size", container.sizeType?.replace(/_/g, " ")],
                ["Status", container.status?.replace(/_/g, " ")],
                ["Condition", container.condition],
                ["Owner", container.ownerCompany],
                ["Location", currentLoc?.description],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span>
                  <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {currentLoc?.lat && currentLoc?.lng && mapsReady && (
            <Card className={cn(cardBg, "overflow-hidden")}>
              <div className="h-[250px]">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{ lat: currentLoc.lat, lng: currentLoc.lng }}
                  zoom={6}
                  options={{ styles: isLight ? undefined : MAP_DARK_STYLES, disableDefaultUI: true, zoomControl: true }}
                >
                  <Marker position={{ lat: currentLoc.lat, lng: currentLoc.lng }} title={container.containerNumber} />
                </GoogleMap>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {tracking.isLoading && searched && (
        <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      )}

      {/* No results */}
      {searched && !tracking.isLoading && !container && (
        <Card className={cardBg}>
          <CardContent className="p-8 text-center">
            <Container className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
            <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No container found for "{search}"</p>
          </CardContent>
        </Card>
      )}

      {/* Not searched yet */}
      {!searched && (
        <Card className={cardBg}>
          <CardContent className="p-8 text-center">
            <Search className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
            <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Enter a container number above to track its journey</p>
          </CardContent>
        </Card>
      )}

      {/* Movement Timeline — real data from container_tracking table */}
      {movements.length > 0 && (
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
              <Clock className="w-4 h-4" /> Movement History ({movements.length} events)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className={cn("absolute left-[19px] top-0 bottom-0 w-0.5", isLight ? "bg-slate-200" : "bg-slate-700")} />
              <div className="space-y-4">
                {movements.map((m: any, i: number) => {
                  const mode = m.transportMode || m.eventType || "vessel";
                  return (
                    <div key={m.id || i} className="relative flex items-start gap-4">
                      <div className={cn("relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0", i === 0 ? "border-cyan-400 bg-cyan-500/20 animate-pulse" : MODE_COLORS[mode] || "border-slate-600 bg-slate-700/30")}>
                        {MODE_ICONS[mode] || <MapPin className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className={cn("flex-1 p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/20")}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{m.eventType?.replace(/_/g, " ") || "Event"}</span>
                            {mode && <Badge className={cn("text-xs px-1.5 py-0", MODE_BADGE[mode] || "bg-slate-500/20 text-slate-400")}>{mode.toLowerCase()}</Badge>}
                          </div>
                        </div>
                        {m.location && <div className={cn("flex items-center gap-1 text-xs", isLight ? "text-slate-500" : "text-slate-400")}><MapPin className="w-3 h-3" />{typeof m.location === "object" ? m.location.description || `${m.location.lat}, ${m.location.lng}` : m.location}</div>}
                        {m.notes && <div className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{m.notes}</div>}
                        {m.timestamp && <div className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>{new Date(m.timestamp).toLocaleString()}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
