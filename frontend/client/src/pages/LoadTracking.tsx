/**
 * LOAD TRACKING PAGE
 * Real-time shipment tracking with:
 * - Search input with gradient Track button
 * - Status summary card with route visualization
 * - Live map placeholder + tracking timeline
 * - Shipment details grid
 * Theme-aware | Brand gradient
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MapPin, Truck, Clock, Search, Navigation,
  CheckCircle, AlertTriangle, Package, Building2
} from "lucide-react";

export default function LoadTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [loadNumber, setLoadNumber] = useState("");
  const [trackedLoad, setTrackedLoad] = useState<any>(null);

  const trackMutation = (trpc as any).loads.trackLoad.useMutation({
    onSuccess: (data: any) => setTrackedLoad(data),
    onError: () => setTrackedLoad(null),
  });

  const handleTrack = () => {
    if (loadNumber) {
      trackMutation.mutate({ loadNumber });
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      picked_up: { label: "Picked Up", bg: "bg-blue-500/15", text: "text-blue-500", border: "border-blue-500/30" },
      in_transit: { label: "In Transit", bg: "bg-green-500/15", text: "text-green-500", border: "border-green-500/30" },
      delivered: { label: "Delivered", bg: "bg-emerald-500/15", text: "text-emerald-500", border: "border-emerald-500/30" },
      delayed: { label: "Delayed", bg: "bg-red-500/15", text: "text-red-500", border: "border-red-500/30" },
    };
    return map[status] || { label: status, bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30" };
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
        Load Tracking
      </h1>
      <p className={cn("text-sm -mt-3", isLight ? "text-slate-500" : "text-slate-400")}>
        Track your shipments in real-time
      </p>

      {/* ── Search Bar ── */}
      <Card className={cn(
        "rounded-2xl border overflow-hidden",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative flex-1 rounded-xl border",
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/40 border-slate-700"
            )}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={loadNumber}
                onChange={(e: any) => setLoadNumber(e.target.value)}
                placeholder="Enter load number..."
                className={cn(
                  "pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0",
                  isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400"
                )}
                onKeyDown={(e: any) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-xl font-bold px-6 h-11"
              onClick={handleTrack}
              disabled={trackMutation.isPending}
            >
              <Navigation className="w-4 h-4 mr-2" /> Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading State ── */}
      {trackMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {/* ── Tracked Load Results ── */}
      {trackedLoad && (
        <>
          {/* Status Summary Card */}
          {(() => {
            const sc = getStatusConfig(trackedLoad.status);
            return (
              <Card className={cn("rounded-2xl border overflow-hidden", sc.border, sc.bg)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Load Number</p>
                      <p className={cn("font-bold text-2xl", isLight ? "text-slate-800" : "text-white")}>#{trackedLoad.loadNumber}</p>
                    </div>
                    <Badge className={cn("border-0 text-sm font-bold px-4 py-1.5 rounded-xl", sc.bg, sc.text)}>
                      {sc.label}
                    </Badge>
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("px-4 py-4 rounded-xl mb-4", isLight ? "bg-white/60" : "bg-slate-900/30")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{trackedLoad.origin}</p>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                        <Navigation className="w-4 h-4 mx-1 rotate-90 text-green-500" />
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{trackedLoad.destination}</p>
                        <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Origin", value: trackedLoad.origin },
                      { label: "Destination", value: trackedLoad.destination },
                      { label: "ETA", value: trackedLoad.eta },
                      { label: "Carrier", value: trackedLoad.carrier },
                    ].map((item) => (
                      <div key={item.label} className={cn("p-3 rounded-xl", isLight ? "bg-white/70" : "bg-slate-800/50")}>
                        <p className="text-[11px] text-slate-400 mb-0.5">{item.label}</p>
                        <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Map + Timeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Live Location */}
            <Card className={cn(
              "rounded-2xl border h-[400px]",
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
            )}>
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-cyan-500" />
                  <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Live Location</p>
                </div>
                <div className={cn("flex-1 rounded-xl flex items-center justify-center", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className={cn("font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Map integration</p>
                    <p className="text-xs text-slate-400 mt-1">Last update: {trackedLoad.lastUpdate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking History */}
            <Card className={cn(
              "rounded-2xl border",
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
            )}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Tracking History</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  <div className="relative pl-6">
                    {trackedLoad.history?.map((event: any, i: number) => (
                      <div key={i} className="relative pb-5 last:pb-0">
                        <div className={cn(
                          "absolute left-0 w-3.5 h-3.5 rounded-full -translate-x-1/2 border-2",
                          i === 0
                            ? "bg-gradient-to-br from-[#1473FF] to-[#BE01FF] border-transparent"
                            : isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-500"
                        )} />
                        {i < trackedLoad.history.length - 1 && (
                          <div className={cn("absolute left-0 top-4 w-0.5 h-full -translate-x-1/2", isLight ? "bg-slate-200" : "bg-slate-700")} />
                        )}
                        <div className="pl-5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{event.status}</p>
                            <span className="text-[11px] text-slate-400">{event.timestamp}</span>
                          </div>
                          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>{event.location}</p>
                          {event.notes && <p className="text-xs text-slate-400 mt-0.5">{event.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipment Details */}
          <Card className={cn(
            "rounded-2xl border",
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
          )}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-green-500" />
                <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Shipment Details</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Product", value: trackedLoad.product },
                  { label: "Weight", value: trackedLoad.weight },
                  { label: "Driver", value: trackedLoad.driver },
                  { label: "Truck", value: trackedLoad.truck },
                ].map((item) => (
                  <div key={item.label} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <p className="text-[11px] text-slate-400 mb-0.5">{item.label}</p>
                    <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Empty State ── */}
      {!trackMutation.isPending && !trackedLoad && (
        <Card className={cn(
          "rounded-2xl border",
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
        )}>
          <CardContent className="p-12 text-center">
            <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>Track your shipment</p>
            <p className="text-sm text-slate-400 mt-1">Enter a load number above to see real-time tracking</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
