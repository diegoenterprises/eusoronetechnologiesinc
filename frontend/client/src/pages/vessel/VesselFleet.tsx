/**
 * VESSEL FLEET — V5 Multi-Modal
 * Real vessel registry & AIS tracking with Google Maps
 * Data from vessels table via getVesselFleet tRPC query
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
  Ship,
  Search,
  MapPin,
  Anchor,
  RefreshCw,
  Map as MapIcon,
  List,
} from "lucide-react";
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
const OCEAN_CENTER = { lat: 20.0, lng: -30.0 };

const STATUS_BADGE: Record<string, string> = {
  at_sea: "bg-emerald-500/20 text-emerald-400",
  in_port: "bg-blue-500/20 text-blue-400",
  anchored: "bg-amber-500/20 text-amber-400",
  docked: "bg-blue-500/20 text-blue-400",
  loading: "bg-purple-500/20 text-purple-400",
  discharging: "bg-orange-500/20 text-orange-400",
  dry_dock: "bg-red-500/20 text-red-400",
  laid_up: "bg-slate-500/20 text-slate-400",
};

export default function VesselFleet() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const fleetQuery = (trpc as any).vesselShipments.getVesselFleet.useQuery(
    { search: search || undefined, limit: 50 },
    { refetchInterval: 30000 }
  );

  const allVessels: any[] = fleetQuery.data?.vessels || [];
  const filtered = allVessels.filter((v: any) =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.imoNumber?.includes(search)
  );

  useEffect(() => {
    const check = () => !!(window as any).google?.maps;
    if (check()) { setMapsReady(true); return; }
    const interval = setInterval(() => { if (check()) { setMapsReady(true); clearInterval(interval); } }, 300);
    return () => clearInterval(interval);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const withPos = filtered.filter((v: any) => v.currentPosition?.lat && v.currentPosition?.lng);
    if (withPos.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      withPos.forEach((v: any) => bounds.extend({ lat: v.currentPosition.lat, lng: v.currentPosition.lng }));
      map.fitBounds(bounds, 60);
    }
  }, [filtered]);

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-2xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className={cn("min-h-screen p-6 space-y-4", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10"><Ship className="w-6 h-6 text-cyan-400" /></div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Vessel Fleet</h1>
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{filtered.length} vessel{filtered.length !== 1 ? "s" : ""} {fleetQuery.isLoading ? "loading..." : "in registry"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => fleetQuery.refetch()} className={cn("rounded-lg", isLight ? "text-slate-500" : "text-slate-400")}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className={cn("flex p-0.5 rounded-lg border", isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800 border-slate-700")}>
            <button onClick={() => setView("map")} className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", view === "map" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "text-slate-500" : "text-slate-400")}><MapIcon className="w-3 h-3 inline mr-1" />Map</button>
            <button onClick={() => setView("list")} className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", view === "list" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "text-slate-500" : "text-slate-400")}><List className="w-3 h-3 inline mr-1" />List</button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
        <Input className={cn("pl-9 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")} placeholder="Search by vessel name or IMO..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Map View */}
      {view === "map" && (
        <Card className={cn(cardBg, "overflow-hidden")}>
          <div className="h-[500px] relative">
            {mapsReady ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={OCEAN_CENTER}
                zoom={2}
                onLoad={onMapLoad}
                options={{ styles: isLight ? undefined : MAP_DARK_STYLES, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
              >
                {filtered.filter((v: any) => v.currentPosition?.lat && v.currentPosition?.lng).map((v: any) => (
                  <Marker key={v.id} position={{ lat: v.currentPosition.lat, lng: v.currentPosition.lng }} title={v.name} onClick={() => setSelectedVessel(v)} />
                ))}
                {selectedVessel?.currentPosition?.lat && selectedVessel?.currentPosition?.lng && (
                  <InfoWindow position={{ lat: selectedVessel.currentPosition.lat, lng: selectedVessel.currentPosition.lng }} onCloseClick={() => setSelectedVessel(null)}>
                    <div className="p-1 min-w-[200px]">
                      <p className="font-bold text-sm text-slate-800">{selectedVessel.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">IMO {selectedVessel.imoNumber} — {selectedVessel.flag}</p>
                      <p className="text-xs text-cyan-600 font-medium mt-1">{selectedVessel.vesselType?.replace(/_/g, " ")} — {selectedVessel.status?.replace(/_/g, " ")}</p>
                      {selectedVessel.currentPosition.speed != null && <p className="text-xs text-slate-500 mt-0.5">{selectedVessel.currentPosition.speed} kn / {selectedVessel.currentPosition.heading}°</p>}
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

      {/* List View */}
      {view === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {fleetQuery.isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No vessels in registry</p>
            ) : filtered.map((v: any) => (
              <Card key={v.id} className={cn(cardBg, "cursor-pointer transition-colors", selectedVessel?.id === v.id && (isLight ? "ring-2 ring-cyan-400" : "ring-2 ring-cyan-500/50"))} onClick={() => setSelectedVessel(v)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Ship className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className={cn("font-semibold text-sm", isLight ? "text-slate-900" : "text-white")}>{v.name}</div>
                        <div className={cn("text-xs font-mono", isLight ? "text-slate-500" : "text-slate-400")}>IMO {v.imoNumber} — {v.flag || "Unknown"}</div>
                      </div>
                    </div>
                    <Badge className={STATUS_BADGE[v.status] || "bg-slate-500/20 text-slate-400"}>{v.status?.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><span className="text-slate-500">TEU: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{v.teuCapacity?.toLocaleString() || "—"}</span></div>
                    <div><span className="text-slate-500">GT: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{v.grossTonnage?.toLocaleString() || "—"}</span></div>
                    <div><span className="text-slate-500">Type: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{v.vesselType?.replace(/_/g, " ") || "—"}</span></div>
                    <div><span className="text-slate-500">Built: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{v.yearBuilt || "—"}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail Panel */}
          <div>
            {selectedVessel ? (
              <Card className={cn(cardBg, "sticky top-6")}>
                <CardHeader>
                  <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                    <Ship className="w-4 h-4 text-cyan-400" />{selectedVessel.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ["IMO", selectedVessel.imoNumber],
                    ["MMSI", selectedVessel.mmsiNumber],
                    ["Type", selectedVessel.vesselType?.replace(/_/g, " ")],
                    ["Flag", selectedVessel.flag],
                    ["Gross Tonnage", selectedVessel.grossTonnage?.toLocaleString()],
                    ["DWT", selectedVessel.deadweightTonnage?.toLocaleString()],
                    ["TEU Capacity", selectedVessel.teuCapacity?.toLocaleString()],
                    ["Year Built", selectedVessel.yearBuilt],
                    ["Length", selectedVessel.lengthMeters ? `${selectedVessel.lengthMeters}m` : null],
                    ["Beam", selectedVessel.beamMeters ? `${selectedVessel.beamMeters}m` : null],
                    ["Draft", selectedVessel.draftMeters ? `${selectedVessel.draftMeters}m` : null],
                    ["Speed", selectedVessel.currentPosition?.speed != null ? `${selectedVessel.currentPosition.speed} kn` : null],
                    ["Heading", selectedVessel.currentPosition?.heading != null ? `${selectedVessel.currentPosition.heading}°` : null],
                    ["Classification", selectedVessel.classificationSociety],
                    ["Last Update", selectedVessel.updatedAt ? new Date(selectedVessel.updatedAt).toLocaleString() : null],
                  ].filter(([, val]) => val != null).map(([k, val]) => (
                    <div key={String(k)} className="flex justify-between">
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span>
                      <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{val}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className={cardBg}>
                <CardContent className="p-8 text-center">
                  <Ship className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Select a vessel to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
