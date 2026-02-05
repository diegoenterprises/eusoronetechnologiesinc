/**
 * HOT ZONES - Geographic Demand Intelligence & Surge Pricing
 * 
 * Real-time freight demand heatmap showing high-demand areas,
 * surge pricing multipliers, and driver opportunity recommendations.
 * 
 * 100% Dynamic - Uses tRPC queries
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame, MapPin, TrendingUp, TrendingDown, Zap, DollarSign,
  Truck, Clock, AlertTriangle, Navigation, Target, RefreshCw,
  ChevronRight, Activity, ThermometerSun, Snowflake, BarChart3,
  Eye, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const DEMAND_COLORS: Record<string, string> = {
  CRITICAL: "from-red-500 to-orange-500",
  HIGH: "from-orange-500 to-amber-500",
  ELEVATED: "from-yellow-500 to-amber-400",
};

const DEMAND_TEXT_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  ELEVATED: "text-yellow-400",
};

const DEMAND_BG_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/20 border-red-500/30",
  HIGH: "bg-orange-500/20 border-orange-500/30",
  ELEVATED: "bg-yellow-500/20 border-yellow-500/30",
};

export default function HotZones() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("map");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | undefined>();
  const [driverLat, setDriverLat] = useState(32.7767); // Default Dallas
  const [driverLng, setDriverLng] = useState(-96.7970);

  // Queries
  const zonesQuery = (trpc as any).hotZones.getActiveZones.useQuery({
    equipment: equipmentFilter,
  });

  const zoneDetailQuery = (trpc as any).hotZones.getZoneDetail.useQuery(
    { zoneId: selectedZoneId! },
    { enabled: !!selectedZoneId }
  );

  const opportunitiesQuery = (trpc as any).hotZones.getDriverOpportunities.useQuery({
    lat: driverLat,
    lng: driverLng,
    maxRadiusMiles: 500,
  });

  const zones = (zonesQuery.data?.hotZones || []) as any[];
  const coldZones = (zonesQuery.data?.coldZones || []) as any[];
  const summary = zonesQuery.data?.summary;
  const detail = zoneDetailQuery.data;
  const opportunities = (opportunitiesQuery.data?.opportunities || []) as any[];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hot Zones
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time freight demand intelligence & surge pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
            <Flame className="w-3 h-3 mr-1" />
            Live Demand
          </Badge>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" onClick={() => zonesQuery.refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {zonesQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : summary && (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Active Zones</span>
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalHotZones}</div>
                <div className="text-xs text-red-400">{summary.criticalZones} critical</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-slate-400">Avg Surge</span>
                </div>
                <div className="text-2xl font-bold text-orange-400">{summary.avgSurge}x</div>
                <div className="text-xs text-slate-400">multiplier</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Highest Surge</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{summary.highestSurge}x</div>
                <div className="text-xs text-slate-400">peak multiplier</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Open Loads</span>
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalOpenLoads.toLocaleString()}</div>
                <div className="text-xs text-slate-400">across all zones</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Available Trucks</span>
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalAvailableTrucks.toLocaleString()}</div>
                <div className="text-xs text-purple-400">in hot zones</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="map" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-1.5" />Hot Zones
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <Navigation className="w-4 h-4 mr-1.5" />Driver Opportunities
          </TabsTrigger>
          <TabsTrigger value="cold" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <Snowflake className="w-4 h-4 mr-1.5" />Cold Zones
          </TabsTrigger>
        </TabsList>

        {/* HOT ZONES TAB */}
        <TabsContent value="map" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <Select value={equipmentFilter || "ALL"} onValueChange={(v) => setEquipmentFilter(v === "ALL" ? undefined : v)}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Equipment</SelectItem>
                <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                <SelectItem value="REEFER">Reefer</SelectItem>
                <SelectItem value="FLATBED">Flatbed</SelectItem>
                <SelectItem value="TANKER">Tanker</SelectItem>
                <SelectItem value="HAZMAT">Hazmat</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">CRITICAL</Badge>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HIGH</Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">ELEVATED</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Zone list */}
            <div className="lg:col-span-2 space-y-3">
              {zonesQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : (
                zones.map((zone: any) => (
                  <Card
                    key={zone.id}
                    className={cn(
                      "bg-slate-800/50 border-slate-700/50 overflow-hidden cursor-pointer transition-all hover:border-slate-500",
                      selectedZoneId === zone.id && "border-purple-500/50 ring-1 ring-purple-500/20"
                    )}
                    onClick={() => setSelectedZoneId(zone.id)}
                  >
                    <div className={cn("h-1 bg-gradient-to-r", DEMAND_COLORS[zone.demandLevel])} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{zone.name}</h3>
                            <Badge className={cn("border text-xs", DEMAND_BG_COLORS[zone.demandLevel])}>
                              {zone.demandLevel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {zone.loadCount} loads / {zone.truckCount} trucks
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {zone.peakHours}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {zone.topEquipment.map((eq: string) => (
                              <Badge key={eq} variant="outline" className="border-slate-600 text-slate-400 text-[10px]">
                                {eq.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {zone.reasons.map((r: string, i: number) => (
                              <span key={i} className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right ml-4 flex-shrink-0">
                          <div className={cn("text-3xl font-bold", DEMAND_TEXT_COLORS[zone.demandLevel])}>
                            {zone.surgeMultiplier}x
                          </div>
                          <div className="text-xs text-slate-400">surge</div>
                          <div className="text-lg font-bold text-white mt-2">${zone.avgRate}/mi</div>
                          <div className="text-xs text-slate-400">avg rate</div>
                          <div className="text-sm font-semibold text-green-400 mt-2">
                            ${zone.estimatedEarnings}
                          </div>
                          <div className="text-[10px] text-slate-500">est. earnings</div>
                        </div>
                      </div>

                      {/* Load to truck ratio bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Load:Truck Ratio</span>
                          <span className={cn("font-bold", DEMAND_TEXT_COLORS[zone.demandLevel])}>{zone.loadToTruckRatio}:1</span>
                        </div>
                        <Progress value={Math.min(zone.urgencyScore, 100)} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Zone detail panel */}
            <div className="space-y-4">
              {selectedZoneId && detail ? (
                <>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        24-Hour Demand Curve
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {detail.hourlyDemand.filter((_: any, i: number) => i % 3 === 0).map((hour: any) => (
                        <div key={hour.hour} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 w-12">{hour.hour}</span>
                          <div className="flex-1 h-4 bg-slate-900/50 rounded overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded"
                              style={{ width: `${Math.min((hour.loads / 80) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-400 w-8 text-right">{hour.loads}</span>
                          <span className={cn("w-10 text-right font-medium",
                            hour.surgeMultiplier >= 1.3 ? "text-red-400" :
                            hour.surgeMultiplier >= 1.1 ? "text-orange-400" : "text-slate-400"
                          )}>
                            {hour.surgeMultiplier}x
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        Top Available Loads
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {detail.topLoads.map((load: any) => (
                        <div key={load.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/30 border border-slate-700/30">
                          <div>
                            <div className="text-white text-sm font-medium flex items-center gap-1">
                              {detail.zone.name.split(" ")[0]}
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              {load.destination.split(",")[0]}
                            </div>
                            <div className="text-xs text-slate-500">{load.miles} mi • {load.equipment}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-sm">${load.rate}/mi</div>
                            {load.urgency === "HOT" && (
                              <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">HOT</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* 7-day trend */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        7-Day Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {detail.weeklyTrend.map((day: any) => (
                        <div key={day.date} className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500 w-20">{day.date}</span>
                          <span className="text-white w-8">{day.loadCount}</span>
                          <span className="text-cyan-400 w-16">${day.avgRate}/mi</span>
                          <span className={cn("font-bold",
                            day.surgeMultiplier >= 1.3 ? "text-red-400" : "text-orange-400"
                          )}>
                            {day.surgeMultiplier}x
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="py-12 text-center">
                    <Target className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400 text-sm">Select a hot zone to see details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* DRIVER OPPORTUNITIES TAB */}
        <TabsContent value="opportunities" className="space-y-4 mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                Your Location (set current position)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-400 text-xs">Latitude</Label>
                  <Input type="number" value={driverLat} onChange={(e: any) => setDriverLat(Number(e.target.value))}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1" step={0.01} />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Longitude</Label>
                  <Input type="number" value={driverLng} onChange={(e: any) => setDriverLng(Number(e.target.value))}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1" step={0.01} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best opportunity banner */}
          {opportunitiesQuery.data?.bestOpportunity && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Best Opportunity</span>
                </div>
                <p className="text-white text-sm">{opportunitiesQuery.data.advice}</p>
              </CardContent>
            </Card>
          )}

          {/* Opportunities list */}
          <div className="space-y-3">
            {opportunitiesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              opportunities.map((opp: any, i: number) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                  <div className={cn("h-1 bg-gradient-to-r",
                    opp.recommendationLevel === "STRONGLY_RECOMMENDED" ? "from-green-500 to-emerald-500" :
                    opp.recommendationLevel === "RECOMMENDED" ? "from-blue-500 to-cyan-500" :
                    "from-slate-500 to-slate-400"
                  )} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{opp.zone.name}</h3>
                          <Badge className={cn("border text-xs", DEMAND_BG_COLORS[opp.zone.demandLevel])}>
                            {opp.zone.demandLevel}
                          </Badge>
                          <Badge className={cn("border-0 text-xs",
                            opp.recommendationLevel === "STRONGLY_RECOMMENDED" ? "bg-green-500/20 text-green-400" :
                            opp.recommendationLevel === "RECOMMENDED" ? "bg-blue-500/20 text-blue-400" :
                            "bg-slate-600/20 text-slate-400"
                          )}>
                            {opp.recommendationLevel.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{opp.distanceMiles} mi deadhead</span>
                          <span>{opp.loadCount} loads available</span>
                          <span>{opp.zone.surgeMultiplier}x surge</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">${opp.netOpportunity.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">net opportunity</div>
                        <div className="text-sm text-slate-300 mt-1">${opp.avgRate}/mi avg</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="p-2 rounded bg-slate-900/30 text-center">
                        <div className="text-xs text-slate-400">Revenue</div>
                        <div className="text-sm font-bold text-white">${opp.estimatedRevenue.toLocaleString()}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/30 text-center">
                        <div className="text-xs text-slate-400">Deadhead Cost</div>
                        <div className="text-sm font-bold text-red-400">-${opp.deadheadCost}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/30 text-center">
                        <div className="text-xs text-slate-400">Profitability</div>
                        <div className="text-sm font-bold text-cyan-400">{opp.profitabilityScore}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* COLD ZONES TAB */}
        <TabsContent value="cold" className="space-y-4 mt-4">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Avoid These Areas</span>
              </div>
              <p className="text-slate-400 text-sm">
                Cold zones have excess capacity and below-market rates. Deadheading to these areas 
                will likely result in lower earnings. Consider routing through hot zones instead.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coldZones.map((zone: any) => (
              <Card key={zone.id} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{zone.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{zone.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">{zone.surgeMultiplier}x</div>
                      <div className="text-xs text-slate-400">below market</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
