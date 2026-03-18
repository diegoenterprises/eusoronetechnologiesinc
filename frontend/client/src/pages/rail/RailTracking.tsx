/**
 * RAIL TRACKING — V5 Multi-Modal
 * Google Maps integration for railcar position visualization
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MapPin, Search, TrainFront, Map as MapIcon, List, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // US center

export default function RailTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const railcarsQuery = (trpc as any).railShipments.getRailcars.useQuery(
    { status: "in_transit", limit: 100 },
    { refetchInterval: 30000 }
  );
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-2xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");
  const allCars: any[] = railcarsQuery.data?.railcars || [];
  const items = allCars.filter((t: any) => !search || t.railcarNumber?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => { if (check()) { setMapsReady(true); clearInterval(interval); } }, 300);
    return () => clearInterval(interval);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (items.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      items.forEach((t: any) => { if (t.currentLocation?.lat && t.currentLocation?.lng) bounds.extend({ lat: t.currentLocation.lat, lng: t.currentLocation.lng }); });
      if (!bounds.isEmpty()) map.fitBounds(bounds, 60);
    }
  }, [items]);

  return (
    <div className={cn("min-h-screen p-6 space-y-4", bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10"><TrainFront className="w-6 h-6 text-blue-400" /></div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Rail Tracking</h1>
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{items.length} railcar{items.length !== 1 ? "s" : ""} {railcarsQuery.isLoading ? "loading..." : "tracked"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => railcarsQuery.refetch()} className={cn("rounded-lg", isLight ? "text-slate-500" : "text-slate-400")}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className={cn("flex p-0.5 rounded-lg border", isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800 border-slate-700")}>
            <button onClick={() => setView("map")} className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", view === "map" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "text-slate-500" : "text-slate-400")}><MapIcon className="w-3 h-3 inline mr-1" />Map</button>
            <button onClick={() => setView("list")} className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", view === "list" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "text-slate-500" : "text-slate-400")}><List className="w-3 h-3 inline mr-1" />List</button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
        <Input className={cn("pl-9 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")} placeholder="Search by car number..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {view === "map" && (
        <Card className={cn(cardBg, "overflow-hidden")}>
          <div className="h-[500px] relative">
            {mapsReady ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={DEFAULT_CENTER}
                zoom={4}
                onLoad={onMapLoad}
                options={{ styles: isLight ? undefined : MAP_DARK_STYLES, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
              >
                {items.filter((t: any) => t.currentLocation?.lat && t.currentLocation?.lng).map((t: any, i: number) => (
                  <Marker key={t.id || i} position={{ lat: t.currentLocation.lat, lng: t.currentLocation.lng }} title={t.railcarNumber || `Car #${t.id}`} onClick={() => setSelectedCar(t)} />
                ))}
                {selectedCar?.currentLocation?.lat && selectedCar?.currentLocation?.lng && (
                  <InfoWindow position={{ lat: selectedCar.currentLocation.lat, lng: selectedCar.currentLocation.lng }} onCloseClick={() => setSelectedCar(null)}>
                    <div className="p-1 min-w-[180px]">
                      <p className="font-bold text-sm text-slate-800">{selectedCar.railcarNumber}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedCar.currentLocation.description || "Position tracked"}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">{selectedCar.carType} — {selectedCar.status?.replace(/_/g, " ")}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className={cn("w-8 h-8 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {view === "list" && (
        <Card className={cardBg}>
          <CardHeader><CardTitle className={cn("text-lg", isLight ? "text-slate-900" : "text-white")}>Active Railcars</CardTitle></CardHeader>
          <CardContent>
            {railcarsQuery.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div> : items.length === 0 ? (
              <p className="text-sm text-center py-12 text-slate-500">No railcars currently in transit</p>
            ) : (
              <div className="space-y-2">{items.map((t: any) => (
                <div key={t.id} className={cn("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors", isLight ? "bg-slate-50 hover:bg-slate-100" : "bg-slate-700/20 hover:bg-slate-700/30")} onClick={() => { setSelectedCar(t); if (t.currentLocation?.lat) setView("map"); }}>
                  <div className="flex items-center gap-3">
                    <TrainFront className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{t.railcarNumber}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{t.currentLocation?.description || t.carType?.replace(/_/g, " ") || "Location pending"}</div>
                    </div>
                  </div>
                  <Badge className={t.status === "in_transit" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>{t.status?.replace(/_/g, " ") || "tracked"}</Badge>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
