/**
 * LOAD TRACKING PAGE
 * Real-time shipment tracking with:
 * - Search input with gradient Track button
 * - Recent shipments list (auto-populated)
 * - Status summary card with route visualization + progress bar
 * - Tracking timeline + shipment details
 * - Not-found state
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
import { useLocation } from "wouter";
import {
  MapPin, Truck, Clock, Search, Navigation, ArrowRight, Eye,
  CheckCircle, AlertTriangle, Package, Building2, XCircle,
  DollarSign, Weight, RefreshCw
} from "lucide-react";

export default function LoadTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [loadNumber, setLoadNumber] = useState("");
  const [trackedLoad, setTrackedLoad] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch user's recent shipments
  const recentQuery = (trpc as any).loads.getTrackedLoads.useQuery({ search: undefined });
  const recentLoads = (recentQuery.data as any[]) || [];

  const trackMutation = (trpc as any).loads.trackLoad.useMutation({
    onSuccess: (data: any) => {
      setHasSearched(true);
      if (data) {
        setTrackedLoad(data);
        setNotFound(false);
      } else {
        setTrackedLoad(null);
        setNotFound(true);
      }
    },
    onError: () => { setTrackedLoad(null); setNotFound(true); setHasSearched(true); },
  });

  const handleTrack = () => {
    if (loadNumber.trim()) {
      trackMutation.mutate({ loadNumber: loadNumber.trim() });
    }
  };

  const quickTrack = (num: string) => {
    setLoadNumber(num);
    trackMutation.mutate({ loadNumber: num });
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
      posted:         { label: "Posted",       bg: "bg-violet-500/15", text: "text-violet-500", border: "border-violet-500/30", icon: Package },
      bidding:        { label: "Bidding",      bg: "bg-amber-500/15",  text: "text-amber-500",  border: "border-amber-500/30",  icon: Clock },
      assigned:       { label: "Assigned",     bg: "bg-cyan-500/15",   text: "text-cyan-500",   border: "border-cyan-500/30",   icon: CheckCircle },
      en_route_pickup:{ label: "En Route",     bg: "bg-blue-500/15",   text: "text-blue-500",   border: "border-blue-500/30",   icon: Navigation },
      at_pickup:      { label: "At Pickup",    bg: "bg-blue-500/15",   text: "text-blue-500",   border: "border-blue-500/30",   icon: MapPin },
      loading:        { label: "Loading",      bg: "bg-indigo-500/15", text: "text-indigo-500", border: "border-indigo-500/30", icon: Package },
      in_transit:     { label: "In Transit",   bg: "bg-green-500/15",  text: "text-green-500",  border: "border-green-500/30",  icon: Truck },
      at_delivery:    { label: "At Delivery",  bg: "bg-teal-500/15",   text: "text-teal-500",   border: "border-teal-500/30",   icon: Building2 },
      unloading:      { label: "Unloading",    bg: "bg-teal-500/15",   text: "text-teal-500",   border: "border-teal-500/30",   icon: Package },
      delivered:      { label: "Delivered",    bg: "bg-emerald-500/15",text: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent",border: "border-emerald-500/30",icon: CheckCircle },
      cancelled:      { label: "Cancelled",   bg: "bg-red-500/15",    text: "text-red-500",    border: "border-red-500/30",    icon: XCircle },
    };
    return map[status] || { label: status, bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", icon: Package };
  };

  const cardClass = cn(
    "rounded-2xl border overflow-hidden",
    isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
  );

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Track Shipments
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Real-time tracking of your shipments
          </p>
        </div>
        <Button
          variant="outline"
          className={cn("rounded-lg", isLight ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")}
          onClick={() => recentQuery.refetch()}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", recentQuery.isRefetching ? "animate-spin" : "")} />Refresh
        </Button>
      </div>

      {/* ── Search Bar ── */}
      <Card className={cardClass}>
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
                placeholder="Enter load number (e.g. LOAD-1770530422120-GBJCL0)..."
                className={cn(
                  "pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0",
                  isLight ? "bg-transparent text-slate-800" : "bg-transparent text-white placeholder:text-slate-400"
                )}
                onKeyDown={(e: any) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-xl font-bold px-6 h-11"
              onClick={handleTrack}
              disabled={trackMutation.isPending || !loadNumber.trim()}
            >
              {trackMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading State ── */}
      {trackMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className={cn("h-40 w-full rounded-2xl", isLight ? "bg-slate-100" : "")} />
          <Skeleton className={cn("h-64 w-full rounded-2xl", isLight ? "bg-slate-100" : "")} />
        </div>
      )}

      {/* ── Not Found State ── */}
      {notFound && !trackMutation.isPending && (
        <Card className={cn(cardClass, "border-red-500/30")}>
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-2xl bg-red-500/10 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <p className={cn("text-lg font-semibold mb-1", isLight ? "text-slate-800" : "text-white")}>Load not found</p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              No shipment found with number "<span className="font-mono font-medium">{loadNumber}</span>". Double-check the load number and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Tracked Load Results ── */}
      {trackedLoad && !trackMutation.isPending && (
        <>
          {/* Status Summary Card */}
          {(() => {
            const sc = getStatusConfig(trackedLoad.status);
            return (
              <Card className={cn("rounded-2xl border overflow-hidden", sc.border, sc.bg)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={cn("text-xs mb-1", isLight ? "text-slate-500" : "text-slate-400")}>Load Number</p>
                      <p className={cn("font-bold text-2xl", isLight ? "text-slate-800" : "text-white")}>#{trackedLoad.loadNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {trackedLoad.hazmatClass && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[11px]">HAZMAT {trackedLoad.hazmatClass}</Badge>
                      )}
                      <Badge className={cn("border-0 text-sm font-bold px-4 py-1.5 rounded-xl", sc.bg, sc.text)}>
                        {sc.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("px-4 py-4 rounded-xl mb-4", isLight ? "bg-white/60 border border-slate-100" : "bg-slate-900/30")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#1473FF]" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{trackedLoad.origin}</p>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                        <Truck className="w-5 h-5 mx-2 text-[#8B5CF6]" />
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{trackedLoad.destination}</p>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#BE01FF]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {trackedLoad.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Delivery Progress</span>
                        <span className={cn("font-bold tabular-nums", isLight ? "text-slate-700" : "text-white")}>{trackedLoad.progress}%</span>
                      </div>
                      <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                        <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all duration-500" style={{ width: `${trackedLoad.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: "ETA", value: trackedLoad.eta },
                      { label: "Carrier", value: trackedLoad.carrier },
                      { label: "Driver", value: trackedLoad.driver },
                      { label: "Product", value: trackedLoad.product },
                      { label: "Rate", value: trackedLoad.rate > 0 ? `$${trackedLoad.rate.toLocaleString()}` : "N/A" },
                    ].map((item) => (
                      <div key={item.label} className={cn("p-3 rounded-xl", isLight ? "bg-white/70 border border-slate-100" : "bg-slate-800/50")}>
                        <p className="text-[11px] text-slate-400 mb-0.5">{item.label}</p>
                        <p className={cn("font-medium text-sm truncate", isLight ? "text-slate-800" : "text-white")}>{item.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Map + Timeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tracking History */}
            <Card className={cardClass}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Tracking Timeline</p>
                </div>
                {trackedLoad.history?.length > 0 ? (
                  <div className="max-h-[340px] overflow-y-auto pr-2">
                    <div className="relative pl-6">
                      {trackedLoad.history.map((event: any, i: number) => (
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No tracking events yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipment Details */}
            <Card className={cardClass}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-green-500" />
                  <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Shipment Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Load Number", value: trackedLoad.loadNumber },
                    { label: "Status", value: getStatusConfig(trackedLoad.status).label },
                    { label: "Product", value: trackedLoad.product },
                    { label: "Weight", value: trackedLoad.weight },
                    { label: "Equipment", value: trackedLoad.truck },
                    { label: "Last Updated", value: trackedLoad.lastUpdate },
                    { label: "Origin", value: trackedLoad.origin },
                    { label: "Destination", value: trackedLoad.destination },
                  ].map((item) => (
                    <div key={item.label} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50 border border-slate-100" : "bg-slate-900/40")}>
                      <p className="text-[11px] text-slate-400 mb-0.5">{item.label}</p>
                      <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{item.value || "N/A"}</p>
                    </div>
                  ))}
                </div>
                {trackedLoad.id && (
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
                    onClick={() => setLocation(`/load/${trackedLoad.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />View Full Load Details
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Recent Shipments (when not tracking a specific load) ── */}
      {!trackedLoad && !notFound && !trackMutation.isPending && (
        <Card className={cardClass}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-cyan-500" />
              <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Your Recent Shipments</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-400")}>
                {recentLoads.length} shipment{recentLoads.length !== 1 ? "s" : ""}
              </span>
            </div>

            {recentQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className={cn("h-16 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}
              </div>
            ) : recentLoads.length === 0 ? (
              <div className="text-center py-12">
                <div className={cn("p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                  <Navigation className="w-10 h-10 text-slate-400" />
                </div>
                <p className={cn("text-lg font-medium mb-1", isLight ? "text-slate-600" : "text-slate-300")}>No shipments yet</p>
                <p className="text-sm text-slate-400">Enter a load number above to track a shipment, or create a load first.</p>
              </div>
            ) : (
              <div className={cn("divide-y rounded-xl overflow-hidden border", isLight ? "divide-slate-100 border-slate-200" : "divide-slate-700/30 border-slate-700/50")}>
                {recentLoads.map((s: any) => {
                  const sc = getStatusConfig(s.status);
                  return (
                    <div
                      key={s.id}
                      className={cn("p-3.5 cursor-pointer transition-colors group", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]")}
                      onClick={() => quickTrack(s.loadNumber)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn("p-2 rounded-lg", sc.bg)}>
                            <Truck className={cn("w-4 h-4", sc.text)} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{s.loadNumber}</p>
                              <Badge className={cn("border-0 text-[10px]", sc.bg, sc.text)}>{sc.label}</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>{s.origin}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{s.destination}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Progress</p>
                            <p className={cn("font-bold text-sm tabular-nums", isLight ? "text-slate-700" : "text-white")}>{s.progress}%</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn("rounded-lg text-xs", isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")}
                          >
                            <Navigation className="w-3.5 h-3.5 mr-1" />Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
