/**
 * CARRIER CAPACITY CALENDAR & FIND SIMILAR CARRIERS (GAP-063 Task 6.2)
 * Two-tab dashboard:
 * 1. Capacity Calendar — weekly availability grid for a carrier
 * 2. Find Similar — AI-powered carrier similarity matching
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Search, Truck, Users, ArrowRight, Target, Shield,
  CheckCircle, AlertTriangle, Crown, Award, Medal, Gauge,
  MapPin, Clock, Package, TrendingUp, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CarrierTierBadge from "@/components/carrier/CarrierTierBadge";

type Tab = "calendar" | "similar";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Available" },
  partial: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Partial" },
  booked: { bg: "bg-red-500/20", text: "text-red-400", label: "Booked" },
  unavailable: { bg: "bg-slate-600/20", text: "text-slate-500", label: "N/A" },
};

export default function CarrierCapacityPage() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [carrierId, setCarrierId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");

  // Calendar query
  const calendarQuery = (trpc as any).carrierCapacity?.getCapacityCalendar?.useQuery?.(
    { carrierId: carrierId!, weeks: 4 },
    { enabled: !!carrierId && tab === "calendar" }
  ) || { data: null, isLoading: false };

  // Similar carriers query
  const similarQuery = (trpc as any).carrierCapacity?.findSimilarCarriers?.useQuery?.(
    { carrierId: carrierId!, topK: 10 },
    { enabled: !!carrierId && tab === "similar" }
  ) || { data: null, isLoading: false };

  const cal = calendarQuery.data;
  const sim = similarQuery.data;

  const handleSearch = () => {
    const id = parseInt(searchId);
    if (!isNaN(id)) setCarrierId(id);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Carrier Capacity & Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Capacity calendar, availability search & similar carrier AI</p>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Enter Carrier ID..."
            type="number"
            value={searchId}
            onChange={(e: any) => setSearchId(e.target.value)}
            onKeyDown={(e: any) => e.key === "Enter" && handleSearch()}
            className="bg-slate-900/50 border-slate-700 text-white max-w-xs"
          />
          <Button onClick={handleSearch} disabled={!searchId} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Search className="w-4 h-4 mr-2" />Lookup
          </Button>
        </div>
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={tab === "calendar" ? "default" : "ghost"}
            className={cn("rounded-md", tab === "calendar" ? "bg-cyan-600" : "text-slate-400")}
            onClick={() => setTab("calendar")}
          >
            <Calendar className="w-4 h-4 mr-1" />Capacity Calendar
          </Button>
          <Button
            size="sm"
            variant={tab === "similar" ? "default" : "ghost"}
            className={cn("rounded-md", tab === "similar" ? "bg-blue-600" : "text-slate-400")}
            onClick={() => setTab("similar")}
          >
            <Users className="w-4 h-4 mr-1" />Find Similar
          </Button>
        </div>
      </div>

      {/* Loading */}
      {(calendarQuery.isLoading || similarQuery.isLoading) && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full bg-slate-700/30 rounded-xl" />
          <Skeleton className="h-60 w-full bg-slate-700/30 rounded-xl" />
        </div>
      )}

      {/* ── Tab 1: Capacity Calendar ── */}
      {tab === "calendar" && cal && (
        <div className="space-y-4">
          {/* Carrier Header */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Truck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{cal.companyName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cal.dotNumber && <span className="text-[10px] text-slate-500">DOT# {cal.dotNumber}</span>}
                      <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400">
                        {cal.fleetSize} vehicles
                      </Badge>
                      {cal.hazmatAuthorized && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">Hazmat</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cal.equipmentTypes.map((eq: string) => (
                    <Badge key={eq} variant="outline" className="text-[9px] border-slate-600/50 text-slate-400 capitalize">
                      {eq.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Calendar Grids */}
          {(cal.weeks || []).map((week: any, wi: number) => (
            <Card key={wi} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Week of {week.weekStart}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-emerald-400">{week.summary.availableDays}d avail</span>
                    <span className="text-[9px] text-amber-400">{week.summary.partialDays}d partial</span>
                    <span className="text-[9px] text-red-400">{week.summary.bookedDays}d booked</span>
                    <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400">
                      {week.totalAvailableTruckDays} truck-days
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-7 gap-1.5">
                  {(week.slots || []).map((slot: any, si: number) => {
                    const sc = STATUS_COLORS[slot.status] || STATUS_COLORS.unavailable;
                    return (
                      <div key={si} className={cn("p-2 rounded-lg border border-slate-700/30", sc.bg)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-slate-500">{slot.dayOfWeek.substring(0, 3)}</span>
                          <span className={cn("text-[9px] font-bold", sc.text)}>{slot.availableTrucks}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{slot.date.substring(5)}</p>
                        <Badge variant="outline" className={cn("text-[8px] mt-1", sc.text, `border-${sc.text.replace("text-", "")}/30`)}>
                          {sc.label}
                        </Badge>
                        {slot.hazmatAvailable && (
                          <span className="block text-[8px] text-amber-500 mt-0.5">HM OK</span>
                        )}
                        {slot.notes && <span className="block text-[8px] text-slate-600 mt-0.5">{slot.notes}</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab 2: Find Similar Carriers ── */}
      {tab === "similar" && sim && (
        <div className="space-y-4">
          {/* Reference Carrier */}
          {sim.reference && (
            <Card className="bg-slate-800/50 border-blue-500/20 rounded-xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />Reference Carrier
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{sim.reference.companyName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CarrierTierBadge tier={sim.reference.tier} size="sm" />
                        {sim.reference.dotNumber && (
                          <span className="text-[10px] text-slate-500">DOT# {sim.reference.dotNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="text-center">
                      <p className="text-slate-500">Fleet</p>
                      <p className="font-bold text-white">{sim.reference.fleetSize}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Loads</p>
                      <p className="font-bold text-white">{sim.reference.totalLoads}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">On-Time</p>
                      <p className="font-bold text-emerald-400">{sim.reference.onTimeRate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Rate/Mi</p>
                      <p className="font-bold text-cyan-400">${sim.reference.avgRatePerMile.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Safety</p>
                      <p className="font-bold text-blue-400">{sim.reference.safetyScore}</p>
                    </div>
                  </div>
                </div>
                {/* Top Lanes */}
                {sim.reference.topLanes.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 flex-wrap">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {sim.reference.topLanes.slice(0, 5).map((l: any) => (
                      <Badge key={l.lane} variant="outline" className="text-[8px] border-slate-600/50 text-slate-400">
                        {l.lane} ({l.count})
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Similar Carriers Results */}
          {sim.similar?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                {sim.similar.length} Similar Carriers Found
              </h3>
              {sim.similar.map((result: any, idx: number) => (
                <Card key={result.carrier.carrierId} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-blue-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          idx < 3 ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"
                        )}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{result.carrier.companyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <CarrierTierBadge tier={result.carrier.tier} size="sm" />
                            {result.carrier.dotNumber && (
                              <span className="text-[10px] text-slate-500">DOT# {result.carrier.dotNumber}</span>
                            )}
                            {result.carrier.hazmatAuthorized && (
                              <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400">Hazmat</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Similarity Score */}
                      <div className="text-center">
                        <div className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center ring-2 font-mono text-lg font-bold",
                          result.similarityScore >= 70 ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                          result.similarityScore >= 50 ? "ring-blue-500/30 bg-blue-500/10 text-blue-400" :
                          result.similarityScore >= 30 ? "ring-amber-500/30 bg-amber-500/10 text-amber-400" :
                          "ring-slate-600/30 bg-slate-600/10 text-slate-400"
                        )}>
                          {result.similarityScore}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">Match</p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                        <p className="text-[9px] text-slate-500">Fleet</p>
                        <p className="text-[11px] font-bold text-white">{result.carrier.fleetSize}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                        <p className="text-[9px] text-slate-500">Loads</p>
                        <p className="text-[11px] font-bold text-white">{result.carrier.totalLoads}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                        <p className="text-[9px] text-slate-500">On-Time</p>
                        <p className={cn("text-[11px] font-bold", result.carrier.onTimeRate >= 90 ? "text-emerald-400" : "text-amber-400")}>
                          {result.carrier.onTimeRate}%
                        </p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                        <p className="text-[9px] text-slate-500">Rate/Mi</p>
                        <p className="text-[11px] font-bold text-cyan-400">${result.carrier.avgRatePerMile.toFixed(2)}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                        <p className="text-[9px] text-slate-500">Safety</p>
                        <p className={cn("text-[11px] font-bold", result.carrier.safetyScore >= 80 ? "text-emerald-400" : "text-amber-400")}>
                          {result.carrier.safetyScore}
                        </p>
                      </div>
                    </div>

                    {/* Match Dimensions */}
                    <div className="mt-3 grid grid-cols-5 gap-1">
                      {(result.matchDimensions || []).slice(0, 5).map((dim: any) => (
                        <div key={dim.dimension} className="text-center">
                          <div className="h-1 rounded-full bg-slate-700/50 overflow-hidden mb-1">
                            <div
                              className={cn("h-full rounded-full",
                                dim.score >= 70 ? "bg-emerald-500" :
                                dim.score >= 40 ? "bg-blue-500" : "bg-amber-500"
                              )}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-slate-500">{dim.dimension}</span>
                        </div>
                      ))}
                    </div>

                    {/* Advantages & Tradeoffs */}
                    {(result.advantages.length > 0 || result.tradeoffs.length > 0) && (
                      <div className="mt-3 flex gap-3">
                        {result.advantages.length > 0 && (
                          <div className="flex-1 space-y-1">
                            {result.advantages.slice(0, 2).map((a: string, i: number) => (
                              <div key={i} className="flex items-start gap-1">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span className="text-[9px] text-emerald-300">{a}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {result.tradeoffs.length > 0 && (
                          <div className="flex-1 space-y-1">
                            {result.tradeoffs.slice(0, 2).map((t: string, i: number) => (
                              <div key={i} className="flex items-start gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-[9px] text-amber-300">{t}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Top Lanes */}
                    {result.carrier.topLanes.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-2.5 h-2.5 text-slate-600" />
                        {result.carrier.topLanes.slice(0, 4).map((l: any) => (
                          <Badge key={l.lane} variant="outline" className="text-[7px] border-slate-700/50 text-slate-500">
                            {l.lane}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {sim && !sim.similar?.length && sim.reference && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No similar carriers found</p>
                <p className="text-[10px] text-slate-600 mt-1">Try a carrier with more load history for better matching</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!carrierId && !calendarQuery.isLoading && !similarQuery.isLoading && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Calendar className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-lg font-semibold text-white">Carrier Capacity Intelligence</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Enter a Carrier ID to view their capacity calendar or find similar carriers using AI-powered multi-dimensional matching.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Weekly availability</div>
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Similar carrier AI</div>
              <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-emerald-400" /> 10-dimension scoring</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
