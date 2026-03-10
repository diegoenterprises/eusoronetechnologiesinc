/**
 * ROUTE OPTIMIZATION PAGE
 * Comprehensive route planning center with multi-stop optimizer,
 * route comparison, toll calculator, restriction checker, HOS planner,
 * weather overlay, and route performance analytics.
 * 100% Dynamic - No mock data. Dark theme with green/teal routing accents.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Navigation, Clock, Fuel, DollarSign, Route, Shield,
  Plus, Trash2, ArrowRight, AlertTriangle, CloudRain, Weight,
  Truck, BarChart3, Target, Zap, TrendingUp, ArrowUpDown,
  CheckCircle2, XCircle, Info, ChevronRight, Gauge, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "teal" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color?: "teal" | "green" | "amber" | "red" | "blue" | "purple";
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const colors = {
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <Card className={cn("border rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg border", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
            <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
            {sub && <p className="text-xs text-slate-500">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="mb-4">
      <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{title}</h2>
      <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{description}</p>
    </div>
  );
}

export default function RouteOptimization() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  // ── Multi-Stop State ────────────────────────────────────────────────────────
  const [msOrigin, setMsOrigin] = useState("");
  const [msStops, setMsStops] = useState<Array<{ location: string; name: string }>>([
    { location: "", name: "" },
  ]);

  // ── Route Comparison State ──────────────────────────────────────────────────
  const [rcOrigin, setRcOrigin] = useState("");
  const [rcDest, setRcDest] = useState("");
  const [rcWeight, setRcWeight] = useState("80000");
  const [rcHazmat, setRcHazmat] = useState(false);

  // ── Toll Calculator State ───────────────────────────────────────────────────
  const [tollOrigin, setTollOrigin] = useState("");
  const [tollDest, setTollDest] = useState("");

  // ── Restriction Checker State ───────────────────────────────────────────────
  const [restrictOrigin, setRestrictOrigin] = useState("");
  const [restrictDest, setRestrictDest] = useState("");
  const [restrictWeight, setRestrictWeight] = useState("80000");
  const [restrictHeight, setRestrictHeight] = useState("13.5");
  const [restrictMode, setRestrictMode] = useState<"weight" | "height" | "hazmat">("weight");
  const [restrictHazmatClass, setRestrictHazmatClass] = useState("3");

  // ── HOS Planner State ──────────────────────────────────────────────────────
  const [hosOrigin, setHosOrigin] = useState("");
  const [hosDest, setHosDest] = useState("");
  const [hosDriving, setHosDriving] = useState("0");
  const [hosDuty, setHosDuty] = useState("0");

  // ── Weather State ──────────────────────────────────────────────────────────
  const [wxOrigin, setWxOrigin] = useState("");
  const [wxDest, setWxDest] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const dashboardQuery = (trpc as any).routeOptimization.getRouteOptimizationDashboard.useQuery(
    { dateRange: "30d" },
    { staleTime: 60000 }
  );

  const multiStopQuery = (trpc as any).routeOptimization.optimizeMultiStop.useQuery(
    {
      origin: msOrigin,
      stops: msStops.filter((s: any) => s.location),
    },
    { enabled: !!msOrigin && msStops.some((s: any) => s.location) }
  );

  const routeComparisonQuery = (trpc as any).routeOptimization.getRouteComparison.useQuery(
    {
      origin: rcOrigin,
      destination: rcDest,
      grossWeightLbs: parseInt(rcWeight) || 80000,
      isHazmat: rcHazmat,
    },
    { enabled: !!rcOrigin && !!rcDest }
  );

  const tollQuery = (trpc as any).routeOptimization.getTollOptimization.useQuery(
    { origin: tollOrigin, destination: tollDest },
    { enabled: !!tollOrigin && !!tollDest }
  );

  const weightQuery = (trpc as any).routeOptimization.getWeightRestrictedRouting.useQuery(
    { origin: restrictOrigin, destination: restrictDest, grossWeightLbs: parseInt(restrictWeight) || 80000 },
    { enabled: !!restrictOrigin && !!restrictDest && restrictMode === "weight" }
  );

  const heightQuery = (trpc as any).routeOptimization.getHeightRestrictedRouting.useQuery(
    { origin: restrictOrigin, destination: restrictDest, vehicleHeightFeet: parseFloat(restrictHeight) || 13.5 },
    { enabled: !!restrictOrigin && !!restrictDest && restrictMode === "height" }
  );

  const hazmatQuery = (trpc as any).routeOptimization.getHazmatRouting.useQuery(
    { origin: restrictOrigin, destination: restrictDest, hazmatClass: restrictHazmatClass },
    { enabled: !!restrictOrigin && !!restrictDest && restrictMode === "hazmat" }
  );

  const hosQuery = (trpc as any).routeOptimization.getHosCompliantRouting.useQuery(
    {
      origin: hosOrigin,
      destination: hosDest,
      currentDrivingHours: parseFloat(hosDriving) || 0,
      currentDutyHours: parseFloat(hosDuty) || 0,
    },
    { enabled: !!hosOrigin && !!hosDest }
  );

  const weatherQuery = (trpc as any).routeOptimization.getWeatherAwareRouting.useQuery(
    { origin: wxOrigin, destination: wxDest },
    { enabled: !!wxOrigin && !!wxDest }
  );

  const etaQuery = (trpc as any).routeOptimization.getEtaAccuracy.useQuery(
    { dateRange: "30d" },
    { staleTime: 60000 }
  );

  const performanceQuery = (trpc as any).routeOptimization.getHistoricalRoutePerformance.useQuery(
    { dateRange: "90d", limit: 10 },
    { staleTime: 60000 }
  );

  const riskQuery = (trpc as any).routeOptimization.getRouteRiskScoring.useQuery(
    { origin: rcOrigin, destination: rcDest },
    { enabled: !!rcOrigin && !!rcDest }
  );

  const seasonalQuery = (trpc as any).routeOptimization.getSeasonalRouteAdjustments.useQuery(
    {},
    { staleTime: 300000 }
  );

  const db = dashboardQuery.data;

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isLight ? "bg-slate-50 text-slate-900" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Route Optimization Center
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Advanced routing intelligence, toll management, and compliance planning
          </p>
        </div>
        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
          <Zap className="w-3 h-3 mr-1" /> AI-Powered
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} p-1 flex-wrap h-auto gap-1`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="multi-stop" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <Route className="w-4 h-4 mr-1" /> Multi-Stop
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <ArrowUpDown className="w-4 h-4 mr-1" /> Compare
          </TabsTrigger>
          <TabsTrigger value="tolls" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <DollarSign className="w-4 h-4 mr-1" /> Tolls
          </TabsTrigger>
          <TabsTrigger value="restrictions" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <Shield className="w-4 h-4 mr-1" /> Restrictions
          </TabsTrigger>
          <TabsTrigger value="hos" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <Timer className="w-4 h-4 mr-1" /> HOS Planner
          </TabsTrigger>
          <TabsTrigger value="weather" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <CloudRain className="w-4 h-4 mr-1" /> Weather
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-teal-600/30 data-[state=active]:text-teal-300 text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 mr-1" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {dashboardQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className={`h-24 rounded-xl ${isLight ? "bg-slate-200" : "bg-slate-800/50"}`} />)}
            </div>
          ) : db ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Route} label="Routes Planned" value={db.summary.totalRoutesPlanned} color="teal" />
                <StatCard icon={Navigation} label="Miles Optimized" value={db.summary.totalMilesOptimized.toLocaleString()} color="green" />
                <StatCard icon={TrendingUp} label="Avg Miles Saved" value={db.summary.avgMilesSaved} sub="per route" color="blue" />
                <StatCard icon={Clock} label="Avg Time Saved" value={`${db.summary.avgTimeSavedMinutes}m`} sub="per route" color="purple" />
                <StatCard icon={DollarSign} label="Avg Toll Saved" value={`$${db.summary.avgTollSaved}`} sub="per route" color="amber" />
                <StatCard icon={Fuel} label="Avg Fuel Saved" value={`$${db.summary.avgFuelSaved}`} sub="per route" color="green" />
                <StatCard icon={Shield} label="HOS Violations Prevented" value={db.summary.hosViolationsPrevented} color="red" />
                <StatCard icon={CloudRain} label="Weather Reroutes" value={db.summary.weatherReroutesCount} color="blue" />
              </div>

              {/* Top Corridors */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                    <Target className="w-5 h-5 text-teal-400" /> Top Corridors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {db.topCorridors.map((c: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                        <div className="flex items-center gap-3">
                          <span className="text-teal-400 font-mono text-sm w-6">#{i + 1}</span>
                          <div>
                            <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{c.lane}</p>
                            <p className="text-slate-500 text-xs">{c.loads} loads | {c.avgMiles} avg miles</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm`}>${c.avgCostPerMile}/mi</p>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            c.onTime >= 95 ? "border-emerald-500/50 text-emerald-400" :
                            c.onTime >= 90 ? "border-amber-500/50 text-amber-400" :
                            "border-red-500/50 text-red-400"
                          )}>
                            {c.onTime}% on-time
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Optimizations */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                    <Zap className="w-5 h-5 text-emerald-400" /> Recent Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {db.recentOptimizations.map((opt: any) => (
                      <div key={opt.id} className={`flex items-center justify-between p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                        <div>
                          <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm`}>{opt.route}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(opt.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">{opt.milesSaved} mi saved</Badge>
                          <Badge className="bg-blue-500/20 text-blue-400 border-0">{opt.timeSaved}</Badge>
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">${opt.tollSaved} tolls</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MULTI-STOP TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="multi-stop" className="space-y-6 mt-4">
          <SectionHeader title="Multi-Stop Route Optimizer" description="Optimize stop order using TSP solver with time windows" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg`}>Configure Stops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin / Depot</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
                    <Input
                      value={msOrigin}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMsOrigin(e.target.value)}
                      placeholder="e.g. Houston, TX"
                      className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`}
                    />
                  </div>
                </div>

                {msStops.map((stop: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Stop {idx + 1}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                        <Input
                          value={stop.location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newStops = [...msStops];
                            newStops[idx] = { ...newStops[idx], location: e.target.value, name: e.target.value };
                            setMsStops(newStops);
                          }}
                          placeholder="Enter stop location"
                          className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`}
                        />
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setMsStops(msStops.filter((_: any, i: number) => i !== idx))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline" size="sm"
                  onClick={() => setMsStops([...msStops, { location: "", name: "" }])}
                  className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Stop
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                  <Route className="w-5 h-5 text-teal-400" /> Optimized Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                {multiStopQuery.isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className={`h-12 rounded-lg ${isLight ? "bg-slate-200" : "bg-slate-700/30"}`} />)}
                  </div>
                ) : multiStopQuery.data && !multiStopQuery.data.error ? (
                  <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 ${isLight ? "bg-teal-50 border border-teal-200" : "bg-slate-900/50 border border-teal-500/20"} rounded-lg`}>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Miles</p>
                        <p className="text-lg font-bold text-teal-400">{multiStopQuery.data.totalMiles.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 ${isLight ? "bg-emerald-50 border border-emerald-200" : "bg-slate-900/50 border border-emerald-500/20"} rounded-lg`}>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Time</p>
                        <p className="text-lg font-bold text-emerald-400">{multiStopQuery.data.totalDuration}</p>
                      </div>
                    </div>

                    {multiStopQuery.data.savings && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-400 font-medium">Optimization Savings</p>
                        <div className="flex gap-4 mt-1">
                          <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{multiStopQuery.data.savings.milesSaved} mi saved</span>
                          <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{multiStopQuery.data.savings.timeSaved} time</span>
                          <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>${multiStopQuery.data.savings.fuelCostSaved} fuel</span>
                        </div>
                      </div>
                    )}

                    {/* Optimized stop order */}
                    <div className="space-y-2">
                      <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} font-medium`}>Optimized Order</p>
                      <div className="flex items-center gap-2 text-xs text-teal-400">
                        <MapPin className="w-3 h-3" /> {msOrigin} (Depot)
                      </div>
                      {multiStopQuery.data.orderedStops?.map((stop: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 ml-4">
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <Badge className="bg-teal-500/20 text-teal-400 border-0 text-xs">{stop.sequence}</Badge>
                          <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{stop.name}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-xs text-teal-400 ml-4">
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <MapPin className="w-3 h-3" /> Return to Depot
                      </div>
                    </div>

                    {/* HOS warning */}
                    {multiStopQuery.data.hosWarning && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                        <p className="text-sm text-amber-300">{multiStopQuery.data.hosWarning}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Enter origin and at least one stop to optimize.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ROUTE COMPARISON TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="comparison" className="space-y-6 mt-4">
          <SectionHeader title="Route Comparison" description="Compare multiple route options side by side" />

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
                    <Input value={rcOrigin} onChange={(e: any) => setRcOrigin(e.target.value)} placeholder="e.g. Chicago, IL" className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Destination</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                    <Input value={rcDest} onChange={(e: any) => setRcDest(e.target.value)} placeholder="e.g. Atlanta, GA" className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Gross Weight (lbs)</Label>
                  <Input value={rcWeight} onChange={(e: any) => setRcWeight(e.target.value)} placeholder="80000" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="flex items-end">
                  <Button
                    variant={rcHazmat ? "default" : "outline"}
                    onClick={() => setRcHazmat(!rcHazmat)}
                    className={cn(
                      "w-full",
                      rcHazmat
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-slate-600 text-slate-400 hover:bg-slate-700/50"
                    )}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" /> HAZMAT {rcHazmat ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {routeComparisonQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className={`h-64 rounded-xl ${isLight ? "bg-slate-200" : "bg-slate-800/50"}`} />)}
            </div>
          ) : routeComparisonQuery.data?.routes ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routeComparisonQuery.data.routes.map((route: any, i: number) => {
                const isBest = route.name === routeComparisonQuery.data.bestByCost;
                return (
                  <Card key={i} className={cn(
                    "rounded-xl border",
                    isBest ? "bg-teal-500/10 border-teal-500/30" : "bg-slate-800/50 border-slate-700/50"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-base`}>{route.name}</CardTitle>
                        {isBest && <Badge className="bg-teal-500/20 text-teal-400 border-0 text-xs">Best Value</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>Distance</p>
                          <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{route.miles.toLocaleString()} mi</p>
                        </div>
                        <div>
                          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>Duration</p>
                          <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{route.duration}</p>
                        </div>
                        <div>
                          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>Toll Cost</p>
                          <p className="text-amber-400 font-medium">${route.tollCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>Fuel Cost</p>
                          <p className="text-emerald-400 font-medium">${route.fuelCost.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className={`pt-2 border-t ${isLight ? "border-slate-200" : "border-slate-700/30"}`}>
                        <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>Total Cost</p>
                        <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>${route.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        {route.highlights?.map((h: string, j: number) => (
                          <div key={j} className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> {h}
                          </div>
                        ))}
                        {route.warnings?.map((w: string, j: number) => (
                          <div key={j} className="flex items-center gap-1 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> {w}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : rcOrigin && rcDest ? null : (
            <p className="text-slate-500 text-sm text-center py-8">Enter origin and destination to compare routes.</p>
          )}

          {/* Risk Score (shows when comparison is active) */}
          {riskQuery.data && !riskQuery.data.error && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                  <Shield className="w-5 h-5 text-teal-400" /> Route Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div className={cn(
                    "text-4xl font-bold",
                    riskQuery.data.riskLevel === "low" ? "text-emerald-400" :
                    riskQuery.data.riskLevel === "moderate" ? "text-amber-400" : "text-red-400"
                  )}>
                    {riskQuery.data.overallScore}/10
                  </div>
                  <Badge className={cn(
                    "text-sm",
                    riskQuery.data.riskLevel === "low" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                    riskQuery.data.riskLevel === "moderate" ? "bg-amber-500/20 text-amber-400 border-0" :
                    "bg-red-500/20 text-red-400 border-0"
                  )}>
                    {riskQuery.data.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {riskQuery.data.riskFactors?.map((rf: any, i: number) => (
                    <div key={i} className={`p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{rf.category}</p>
                      <p className={cn(
                        "text-lg font-bold",
                        rf.score <= 3 ? "text-emerald-400" : rf.score <= 6 ? "text-amber-400" : "text-red-400"
                      )}>
                        {rf.score}/10
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{rf.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TOLL CALCULATOR TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="tolls" className="space-y-6 mt-4">
          <SectionHeader title="Toll Cost Calculator" description="Compare toll vs toll-free routes with cost/time tradeoff analysis" />

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
                    <Input value={tollOrigin} onChange={(e: any) => setTollOrigin(e.target.value)} placeholder="e.g. New York, NY" className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Destination</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                    <Input value={tollDest} onChange={(e: any) => setTollDest(e.target.value)} placeholder="e.g. Philadelphia, PA" className={`pl-9 ${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {tollQuery.isLoading ? (
            <Skeleton className={`h-64 rounded-xl ${isLight ? "bg-slate-200" : "bg-slate-800/50"}`} />
          ) : tollQuery.data && !tollQuery.data.error ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Toll Route */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-base flex items-center gap-2`}>
                    <DollarSign className="w-5 h-5 text-amber-400" /> Toll Route
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/50"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Distance</p>
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{tollQuery.data.tollRoute.miles.toLocaleString()} mi</p>
                    </div>
                    <div className={`p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/50"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Duration</p>
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{tollQuery.data.tollRoute.duration}</p>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <p className="text-xs text-amber-400">Toll Cost</p>
                      <p className="text-amber-400 font-bold">${tollQuery.data.tollRoute.tollCost.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <p className="text-xs text-emerald-400">Fuel Cost</p>
                      <p className="text-emerald-400 font-medium">${tollQuery.data.tollRoute.fuelCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={`pt-2 border-t ${isLight ? "border-slate-200" : "border-slate-700/30"}`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Cost</p>
                    <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>${tollQuery.data.tollRoute.totalCost.toFixed(2)}</p>
                  </div>
                  {tollQuery.data.tollRoute.tollPlazas?.length > 0 && (
                    <div className="space-y-1">
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium`}>Toll Plazas</p>
                      {tollQuery.data.tollRoute.tollPlazas.map((tp: any, i: number) => (
                        <div key={i} className={`flex justify-between text-xs py-1 border-b ${isLight ? "border-slate-200" : "border-slate-700/20"}`}>
                          <span className={isLight ? "text-slate-600" : "text-slate-300"}>{tp.name}</span>
                          <span className="text-amber-400">${tp.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Toll-Free Route */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-base flex items-center gap-2`}>
                    <Route className="w-5 h-5 text-emerald-400" /> Toll-Free Route
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/50"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Distance</p>
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{tollQuery.data.tollFreeRoute.miles.toLocaleString()} mi</p>
                    </div>
                    <div className={`p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/50"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Duration</p>
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{tollQuery.data.tollFreeRoute.duration}</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <p className="text-xs text-emerald-400">Toll Cost</p>
                      <p className="text-emerald-400 font-bold">$0.00</p>
                    </div>
                    <div className={`p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/50"} rounded-lg`}>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Fuel Cost</p>
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>${tollQuery.data.tollFreeRoute.fuelCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={`pt-2 border-t ${isLight ? "border-slate-200" : "border-slate-700/30"}`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Cost</p>
                    <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>${tollQuery.data.tollFreeRoute.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg text-xs">
                    <p className="text-blue-400">+{tollQuery.data.tollFreeRoute.additionalMiles} mi | +{tollQuery.data.tollFreeRoute.additionalTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Savings summary */}
              <Card className="md:col-span-2 bg-teal-500/10 border-teal-500/20 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-teal-400 font-medium">Recommendation</p>
                      <p className={isLight ? "text-slate-900" : "text-white"}>{tollQuery.data.recommendation}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Toll Savings</p>
                        <p className="text-lg font-bold text-emerald-400">${tollQuery.data.savings.tollSavings.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Extra Fuel</p>
                        <p className="text-lg font-bold text-amber-400">${tollQuery.data.savings.additionalFuelCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Net Savings</p>
                        <p className={cn("text-lg font-bold", tollQuery.data.savings.netSavings > 0 ? "text-emerald-400" : "text-red-400")}>
                          ${tollQuery.data.savings.netSavings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : tollOrigin && tollDest ? null : (
            <p className="text-slate-500 text-sm text-center py-8">Enter origin and destination to calculate toll costs.</p>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RESTRICTIONS TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="restrictions" className="space-y-6 mt-4">
          <SectionHeader title="Route Restriction Checker" description="Check weight, height, and HAZMAT restrictions along your route" />

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin</Label>
                  <Input value={restrictOrigin} onChange={(e: any) => setRestrictOrigin(e.target.value)} placeholder="e.g. New York, NY" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Destination</Label>
                  <Input value={restrictDest} onChange={(e: any) => setRestrictDest(e.target.value)} placeholder="e.g. Boston, MA" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Check Type</Label>
                  <div className="flex gap-2">
                    {(["weight", "height", "hazmat"] as const).map(mode => (
                      <Button
                        key={mode}
                        variant={restrictMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRestrictMode(mode)}
                        className={cn(
                          restrictMode === mode
                            ? "bg-teal-600 hover:bg-teal-700 text-white"
                            : "border-slate-600 text-slate-400 hover:bg-slate-700/50"
                        )}
                      >
                        {mode === "weight" && <Weight className="w-3 h-3 mr-1" />}
                        {mode === "height" && <ArrowUpDown className="w-3 h-3 mr-1" />}
                        {mode === "hazmat" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {restrictMode === "weight" && (
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Gross Weight (lbs)</Label>
                  <Input value={restrictWeight} onChange={(e: any) => setRestrictWeight(e.target.value)} placeholder="80000" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50 max-w-xs`} />
                </div>
              )}
              {restrictMode === "height" && (
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Vehicle Height (feet)</Label>
                  <Input value={restrictHeight} onChange={(e: any) => setRestrictHeight(e.target.value)} placeholder="13.5" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50 max-w-xs`} />
                </div>
              )}
              {restrictMode === "hazmat" && (
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>HAZMAT Class</Label>
                  <Input value={restrictHazmatClass} onChange={(e: any) => setRestrictHazmatClass(e.target.value)} placeholder="3" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50 max-w-xs`} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weight Results */}
          {restrictMode === "weight" && weightQuery.data && !weightQuery.data.error && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    weightQuery.data.routeCleared ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    {weightQuery.data.routeCleared
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      : <XCircle className="w-6 h-6 text-red-400" />}
                  </div>
                  <div>
                    <CardTitle className={isLight ? "text-slate-900" : "text-white"}>
                      {weightQuery.data.routeCleared ? "Route Cleared" : "Weight Restrictions Found"}
                    </CardTitle>
                    <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {(weightQuery.data.grossWeight / 1000).toFixed(0)}k lbs | Federal limit: {(weightQuery.data.federalBridgeLimit / 1000).toFixed(0)}k lbs
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {weightQuery.data.warnings?.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-300">{w}</p>
                  </div>
                ))}
                {weightQuery.data.restrictions?.filter((r: any) => r.violated).map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">{r.name} ({r.state})</p>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Max: {(r.maxWeightLbs / 1000).toFixed(0)}k lbs on {r.highway}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Height Results */}
          {restrictMode === "height" && heightQuery.data && !heightQuery.data.error && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    heightQuery.data.routeCleared ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    {heightQuery.data.routeCleared
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      : <XCircle className="w-6 h-6 text-red-400" />}
                  </div>
                  <div>
                    <CardTitle className={isLight ? "text-slate-900" : "text-white"}>
                      {heightQuery.data.routeCleared ? "Height Clearance OK" : "Height Restrictions Found"}
                    </CardTitle>
                    <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Vehicle: {heightQuery.data.vehicleHeight}' | Standard clearance: {heightQuery.data.standardClearance}'
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {heightQuery.data.warnings?.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-300">{w}</p>
                  </div>
                ))}
                {heightQuery.data.restrictions?.filter((r: any) => r.violated).map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">{r.name} ({r.state})</p>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Clearance: {r.maxHeightFeet}' on {r.highway} ({r.type})</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* HAZMAT Results */}
          {restrictMode === "hazmat" && hazmatQuery.data && !hazmatQuery.data.error && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    hazmatQuery.data.compliant ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    {hazmatQuery.data.compliant
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      : <XCircle className="w-6 h-6 text-red-400" />}
                  </div>
                  <div>
                    <CardTitle className={isLight ? "text-slate-900" : "text-white"}>
                      {hazmatQuery.data.compliant ? "HAZMAT Route Compliant" : "HAZMAT Restrictions Found"}
                    </CardTitle>
                    <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Class {hazmatQuery.data.hazmatClass} | {hazmatQuery.data.adjustedMiles} mi adjusted route</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hazmatQuery.data.warnings?.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-300">{w}</p>
                  </div>
                ))}
                {hazmatQuery.data.regulatoryNotes?.map((n: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{n}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HOS PLANNER TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hos" className="space-y-6 mt-4">
          <SectionHeader title="HOS-Compliant Route Planner" description="Plan routes with mandatory rest stops within HOS limits" />

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin</Label>
                  <Input value={hosOrigin} onChange={(e: any) => setHosOrigin(e.target.value)} placeholder="e.g. Houston, TX" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Destination</Label>
                  <Input value={hosDest} onChange={(e: any) => setHosDest(e.target.value)} placeholder="e.g. Chicago, IL" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Current Driving Hours</Label>
                  <Input value={hosDriving} onChange={(e: any) => setHosDriving(e.target.value)} placeholder="0" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Current Duty Hours</Label>
                  <Input value={hosDuty} onChange={(e: any) => setHosDuty(e.target.value)} placeholder="0" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {hosQuery.isLoading ? (
            <Skeleton className={`h-64 rounded-xl ${isLight ? "bg-slate-200" : "bg-slate-800/50"}`} />
          ) : hosQuery.data && !hosQuery.data.error ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Navigation} label="Total Miles" value={hosQuery.data.totalMiles?.toLocaleString()} color="teal" />
                <StatCard icon={Clock} label="Trip Duration" value={hosQuery.data.totalTripDuration} color="blue" />
                <StatCard icon={Timer} label="Driving Hours" value={`${hosQuery.data.totalDrivingHours}h`} color="green" />
                <StatCard
                  icon={hosQuery.data.compliant ? CheckCircle2 : XCircle}
                  label="HOS Compliance"
                  value={hosQuery.data.compliant ? "Compliant" : "Violation"}
                  color={hosQuery.data.compliant ? "green" : "red"}
                />
              </div>

              {/* Segment timeline */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                    <Timer className="w-5 h-5 text-teal-400" /> Trip Segments
                    <span className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} font-normal ml-2`}>
                      {hosQuery.data.summary?.driveSegments} drive | {hosQuery.data.summary?.mandatoryBreaks} breaks | {hosQuery.data.summary?.mandatoryRests} rests
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {hosQuery.data.segments?.map((seg: any, i: number) => (
                      <div key={i} className={cn(
                        "flex items-center gap-3 p-2 rounded-lg text-sm",
                        seg.type === "drive" ? "bg-slate-900/30" :
                        seg.type === "break" ? "bg-amber-500/10" :
                        seg.type === "rest" ? "bg-blue-500/10" :
                        "bg-emerald-500/10"
                      )}>
                        <Badge className={cn(
                          "text-xs w-16 justify-center border-0",
                          seg.type === "drive" ? "bg-teal-500/20 text-teal-400" :
                          seg.type === "break" ? "bg-amber-500/20 text-amber-400" :
                          seg.type === "rest" ? "bg-blue-500/20 text-blue-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {seg.type}
                        </Badge>
                        <span className={`${isLight ? "text-slate-900" : "text-white"} flex-1`}>{seg.note}</span>
                        <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-xs`}>
                          mi {seg.startMile}-{seg.endMile} | {seg.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Violations */}
              {hosQuery.data.violations?.length > 0 && (
                <div className="space-y-2">
                  {hosQuery.data.violations.map((v: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                      <p className="text-sm text-red-300">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : hosOrigin && hosDest ? null : (
            <p className="text-slate-500 text-sm text-center py-8">Enter origin and destination to plan HOS-compliant route.</p>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WEATHER TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="weather" className="space-y-6 mt-4">
          <SectionHeader title="Weather-Aware Routing" description="Check weather conditions and seasonal impacts along your route" />

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Origin</Label>
                  <Input value={wxOrigin} onChange={(e: any) => setWxOrigin(e.target.value)} placeholder="e.g. Denver, CO" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
                <div className="space-y-2">
                  <Label className={isLight ? "text-slate-500" : "text-slate-400"}>Destination</Label>
                  <Input value={wxDest} onChange={(e: any) => setWxDest(e.target.value)} placeholder="e.g. Salt Lake City, UT" className={`${isLight ? "bg-white border-slate-300" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-teal-500/50`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {weatherQuery.data && !weatherQuery.data.error && (
            <>
              {/* Risk Level Banner */}
              <Card className={cn(
                "rounded-xl border",
                weatherQuery.data.riskLevel === "low" ? "bg-emerald-500/10 border-emerald-500/20" :
                weatherQuery.data.riskLevel === "moderate" ? "bg-amber-500/10 border-amber-500/20" :
                "bg-red-500/10 border-red-500/20"
              )}>
                <CardContent className="p-4 flex items-center gap-4">
                  <CloudRain className={cn(
                    "w-10 h-10",
                    weatherQuery.data.riskLevel === "low" ? "text-emerald-400" :
                    weatherQuery.data.riskLevel === "moderate" ? "text-amber-400" : "text-red-400"
                  )} />
                  <div>
                    <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium text-lg`}>
                      Weather Risk: {weatherQuery.data.riskLevel.toUpperCase()}
                    </p>
                    <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {weatherQuery.data.route.miles} miles | Additional time: {weatherQuery.data.additionalTimeEstimate}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Weather Zones */}
              {weatherQuery.data.weatherZones?.length > 0 && (
                <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg`}>Active Weather Zones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {weatherQuery.data.weatherZones.map((zone: any, i: number) => (
                      <div key={i} className={cn(
                        "p-3 rounded-lg border",
                        zone.severity === "high" ? "bg-red-500/10 border-red-500/20" :
                        "bg-amber-500/10 border-amber-500/20"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium text-sm`}>{zone.zone}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            zone.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {zone.severity}
                          </Badge>
                        </div>
                        <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Hazard: {zone.hazard}</p>
                        <p className="text-xs text-slate-500 mt-1">{zone.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg`}>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weatherQuery.data.recommendations?.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                      <span className={isLight ? "text-slate-600" : "text-slate-300"}>{rec}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Seasonal Alerts */}
          {seasonalQuery.data && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                  <Gauge className="w-5 h-5 text-teal-400" /> Seasonal Alerts for {seasonalQuery.data.monthName}
                  {seasonalQuery.data.highSeverityCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                      {seasonalQuery.data.highSeverityCount} high severity
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {seasonalQuery.data.activeAdjustments?.map((adj: any, i: number) => (
                  <div key={i} className={cn(
                    "p-3 rounded-lg border",
                    adj.severity === "high" ? "bg-red-500/5 border-red-500/20" :
                    adj.severity === "moderate" ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-slate-900/50 border-slate-700/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{adj.region}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={`text-xs ${isLight ? "border-slate-300 text-slate-500" : "border-slate-600 text-slate-400"}`}>{adj.type}</Badge>
                        <Badge className={cn(
                          "border-0 text-xs",
                          adj.severity === "high" ? "bg-red-500/20 text-red-400" :
                          adj.severity === "moderate" ? "bg-amber-500/20 text-amber-400" :
                          "bg-slate-700/50 text-slate-400"
                        )}>
                          {adj.severity}
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>{adj.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Impact: {adj.impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ANALYTICS TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          <SectionHeader title="Route Performance Analytics" description="Historical performance data, ETA accuracy, and lane analytics" />

          {/* ETA Accuracy */}
          {etaQuery.data && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                  <Target className="w-5 h-5 text-teal-400" /> ETA Accuracy Metrics
                  {etaQuery.data.trend?.improving && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" /> +{etaQuery.data.trend.changePercent}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className={`p-3 ${isLight ? "bg-teal-50 border border-teal-200" : "bg-slate-900/50 border border-teal-500/20"} rounded-lg`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Avg Accuracy</p>
                    <p className="text-2xl font-bold text-teal-400">{etaQuery.data.metrics.avgAccuracyPercent}%</p>
                  </div>
                  <div className={`p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Within 15 min</p>
                    <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{etaQuery.data.metrics.within15Minutes}%</p>
                  </div>
                  <div className={`p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Within 1 hour</p>
                    <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{etaQuery.data.metrics.within1Hour}%</p>
                  </div>
                  <div className={`p-3 ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30"} rounded-lg`}>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Deliveries Tracked</p>
                    <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{etaQuery.data.metrics.totalDeliveriesTracked}</p>
                  </div>
                </div>

                {/* Accuracy by Distance */}
                <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} font-medium mb-2`}>Accuracy by Distance</p>
                <div className="space-y-2">
                  {etaQuery.data.accuracyByDistance?.map((row: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} w-28`}>{row.distanceRange}</span>
                      <div className={`flex-1 ${isLight ? "bg-slate-200" : "bg-slate-900/50"} rounded-full h-4 overflow-hidden`}>
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                          style={{ width: `${row.accuracy}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isLight ? "text-slate-900" : "text-white"} w-12 text-right`}>{row.accuracy}%</span>
                    </div>
                  ))}
                </div>

                {/* Top Delay Factors */}
                <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} font-medium mt-4 mb-2`}>Top Delay Factors</p>
                <div className="space-y-2">
                  {etaQuery.data.topDelayFactors?.map((factor: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between p-2 ${isLight ? "bg-slate-50" : "bg-slate-900/30"} rounded-lg`}>
                      <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{factor.factor}</span>
                      <div className="flex gap-3 text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>{factor.impact}% of delays</span>
                        <Badge variant="outline" className={`text-xs ${isLight ? "border-slate-300 text-slate-500" : "border-slate-600 text-slate-400"}`}>{factor.avgDelayMinutes}m avg</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lane Performance */}
          {performanceQuery.data && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                  <BarChart3 className="w-5 h-5 text-emerald-400" /> Lane Performance (90 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isLight ? "border-slate-200" : "border-slate-700/50"}`}>
                        <th className={`text-left ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 pr-4`}>Lane</th>
                        <th className={`text-right ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 px-2`}>Loads</th>
                        <th className={`text-right ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 px-2`}>Avg Mi</th>
                        <th className={`text-right ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 px-2`}>$/mi</th>
                        <th className={`text-right ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 px-2`}>On-Time</th>
                        <th className={`text-right ${isLight ? "text-slate-500" : "text-slate-400"} font-medium pb-2 pl-2`}>Avg Delay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceQuery.data.lanes?.map((lane: any, i: number) => (
                        <tr key={i} className={`border-b ${isLight ? "border-slate-200" : "border-slate-700/20"}`}>
                          <td className="py-2 pr-4">
                            <span className={isLight ? "text-slate-900" : "text-white"}>{lane.origin}</span>
                            <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                            <span className={isLight ? "text-slate-900" : "text-white"}>{lane.destination}</span>
                          </td>
                          <td className={`text-right py-2 px-2 ${isLight ? "text-slate-900" : "text-white"}`}>{lane.loads}</td>
                          <td className={`text-right py-2 px-2 ${isLight ? "text-slate-900" : "text-white"}`}>{lane.avgMiles}</td>
                          <td className={`text-right py-2 px-2 ${isLight ? "text-slate-900" : "text-white"}`}>${lane.avgCostPerMile}</td>
                          <td className="text-right py-2 px-2">
                            <span className={cn(
                              lane.onTimeRate >= 95 ? "text-emerald-400" :
                              lane.onTimeRate >= 90 ? "text-amber-400" : "text-red-400"
                            )}>
                              {lane.onTimeRate}%
                            </span>
                          </td>
                          <td className={`text-right py-2 pl-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{lane.avgDelayMinutes}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
