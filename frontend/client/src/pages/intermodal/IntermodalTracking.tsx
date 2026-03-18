/**
 * INTERMODAL TRACKING — V5 Multi-Modal
 * Cross-modal container tracking: real data from intermodal_shipments
 * and intermodal_segments tables via tRPC queries
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Layers,
  Search,
  Truck,
  TrainFront,
  Ship,
  MapPin,
  Clock,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MODE_ICON: Record<string, React.ReactNode> = {
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};

const MODE_BG: Record<string, string> = {
  TRUCK: "bg-orange-500/20 border-orange-500/30",
  RAIL: "bg-blue-500/20 border-blue-500/30",
  VESSEL: "bg-cyan-500/20 border-cyan-500/30",
};

const MODE_BADGE: Record<string, string> = {
  TRUCK: "bg-orange-500/20 text-orange-400",
  RAIL: "bg-blue-500/20 text-blue-400",
  VESSEL: "bg-cyan-500/20 text-cyan-400",
};

export default function IntermodalTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const shipmentsQuery = (trpc as any).intermodal.getIntermodalShipments.useQuery(
    { limit: 50 },
    { refetchInterval: 30000 }
  );

  const detailQuery = (trpc as any).intermodal.getIntermodalShipmentDetail.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const allShipments: any[] = shipmentsQuery.data?.shipments || [];
  const filtered = allShipments.filter((s: any) =>
    !search ||
    s.intermodalNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.commodity?.toLowerCase().includes(search.toLowerCase())
  );

  const detail = detailQuery.data;
  const segments: any[] = detail?.segments || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-2xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className={cn("min-h-screen p-6 space-y-4", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10"><Activity className="w-6 h-6 text-violet-400" /></div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Intermodal Tracking</h1>
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{filtered.length} shipment{filtered.length !== 1 ? "s" : ""} {shipmentsQuery.isLoading ? "loading..." : "tracked"}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => shipmentsQuery.refetch()} className={cn("rounded-lg", isLight ? "text-slate-500" : "text-slate-400")}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
        <Input className={cn("pl-9 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")} placeholder="Search by shipment # or commodity..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List */}
        <div className="space-y-3">
          {shipmentsQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-sm">No intermodal shipments found</p>
          ) : filtered.map((s: any) => (
            <Card key={s.id} className={cn(cardBg, "cursor-pointer transition-colors", selectedId === s.id && (isLight ? "ring-2 ring-violet-400" : "ring-2 ring-violet-500/50"))} onClick={() => setSelectedId(s.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-semibold text-sm", isLight ? "text-slate-900" : "text-white")}>{s.intermodalNumber}</span>
                  <Badge className={s.status === "delivered" || s.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"}>{s.status?.replace(/_/g, " ")}</Badge>
                </div>
                {s.commodity && <div className={cn("text-xs mb-1", isLight ? "text-slate-500" : "text-slate-400")}>{s.commodity}</div>}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>{s.originType}</span>
                  {s.numberOfSegments > 1 && <><ArrowRight className="w-3 h-3 text-slate-500" /><span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>{s.numberOfSegments} legs</span></>}
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>{s.destinationType}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Journey Detail */}
        <div className="lg:col-span-2">
          {selectedId && detailQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          ) : detail ? (
            <Card className={cardBg}>
              <CardHeader>
                <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                  <Layers className="w-4 h-4 text-violet-400" />{detail.shipment?.intermodalNumber} — Journey Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Current Status */}
                <div className={cn("flex items-center gap-3 p-4 rounded-lg mb-6", isLight ? "bg-violet-50" : "bg-violet-500/10")}>
                  <Layers className="w-5 h-5 text-violet-400" />
                  <div>
                    <div className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{detail.shipment?.status?.replace(/_/g, " ") || "Unknown"}</div>
                    <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                      {detail.shipment?.commodity && `Commodity: ${detail.shipment.commodity}`}
                      {detail.shipment?.totalRate && ` — Rate: $${parseFloat(detail.shipment.totalRate).toLocaleString()}`}
                      {detail.shipment?.numberOfSegments && ` — ${detail.shipment.numberOfSegments} segment${detail.shipment.numberOfSegments > 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {segments.length > 0 ? (
                  <div className="relative">
                    <div className={cn("absolute left-[19px] top-0 bottom-0 w-0.5", isLight ? "bg-slate-200" : "bg-slate-700")} />
                    <div className="space-y-6">
                      {segments.map((seg: any, i: number) => (
                        <div key={seg.id || i} className="relative flex items-start gap-4">
                          <div className={cn("relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            seg.status === "in_progress" || seg.status === "in_transit" ? "border-violet-400 bg-violet-500/20 animate-pulse" :
                            seg.status === "completed" || seg.status === "delivered" ? MODE_BG[seg.mode] || "bg-emerald-500/20 border-emerald-500/30" :
                            "border-slate-600 bg-slate-700/30"
                          )}>
                            {MODE_ICON[seg.mode] || <MapPin className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className={cn("flex-1 p-4 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/20")}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>Leg {seg.legNumber || i + 1}: {seg.mode}</span>
                                <Badge className={cn(MODE_BADGE[seg.mode] || "bg-slate-500/20 text-slate-400", "text-[10px] px-1.5 py-0")}>{seg.mode}</Badge>
                              </div>
                              <Badge className={
                                seg.status === "completed" || seg.status === "delivered" ? "bg-emerald-500/20 text-emerald-400 text-[10px]" :
                                seg.status === "in_progress" || seg.status === "in_transit" ? "bg-violet-500/20 text-violet-400 text-[10px]" :
                                "bg-slate-500/20 text-slate-400 text-[10px]"
                              }>
                                {seg.status === "in_progress" || seg.status === "in_transit" ? "● Active" : seg.status?.replace(/_/g, " ") || "pending"}
                              </Badge>
                            </div>
                            <div className={cn("flex items-center gap-2 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                              <MapPin className="w-3 h-3" />{seg.originDescription || "Origin"}<ArrowRight className="w-3 h-3" />{seg.destinationDescription || "Destination"}
                            </div>
                            {seg.rate && <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Rate: ${parseFloat(seg.rate).toLocaleString()}</div>}
                            {seg.actualArrival && <div className={cn("flex items-center gap-1 text-[10px] mt-1", isLight ? "text-slate-400" : "text-slate-500")}><Clock className="w-2.5 h-2.5" />{new Date(seg.actualArrival).toLocaleString()}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={cn("text-sm text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No segments recorded yet</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className={cardBg}>
              <CardContent className="p-12 text-center">
                <Layers className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Select a shipment to view its journey</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
