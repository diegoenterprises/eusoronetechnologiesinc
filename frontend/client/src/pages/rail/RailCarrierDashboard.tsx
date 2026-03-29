/**
 * RAIL CARRIER DASHBOARD — Railroad Operations Command Center
 * For RAIL_CATALYST role: Full railroad carrier operations dashboard
 * KPIs, fleet overview, active trains, crew status, yard summary,
 * revenue analytics, and FRA compliance tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  TrainFront, Package, MapPin, DollarSign, TrendingUp,
  ArrowUpRight, Clock, CheckCircle, AlertTriangle, Plus,
  Eye, Users, Gauge, Bell, Zap, Shield, Radio, Layers,
  Fuel, Wrench, Truck, Hash, Award, UserCheck, HardHat,
  BarChart3, ArrowRight, Calendar, FileText, Search,
  RefreshCw, ChevronDown, ChevronUp, Activity, Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

/* ─── KPI Card ─── */
function KpiCard({ icon, label, value, subtitle, trend, isLight, accent = "blue" }: {
  icon: React.ReactNode; label: string; value: string | number; subtitle?: string;
  trend?: { value: string; up: boolean }; isLight: boolean; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    orange: isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", accentMap[accent])}>{icon}</div>
        {trend && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5",
            trend.up ? "text-emerald-500" : "text-red-500"
          )}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {subtitle && <div className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{subtitle}</div>}
    </div>
  );
}

/* ─── Status Badge Map ─── */
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  in_transit: "bg-cyan-500/20 text-cyan-400",
  at_yard: "bg-blue-500/20 text-blue-400",
  loading: "bg-amber-500/20 text-amber-400",
  unloading: "bg-orange-500/20 text-orange-400",
  maintenance: "bg-red-500/20 text-red-400",
  idle: "bg-slate-500/20 text-slate-400",
  available: "bg-green-500/20 text-green-400",
  on_duty: "bg-emerald-500/20 text-emerald-400",
  resting: "bg-blue-500/20 text-blue-400",
  off_duty: "bg-slate-500/20 text-slate-400",
  departed: "bg-cyan-500/20 text-cyan-400",
  arrived: "bg-teal-500/20 text-teal-400",
  valid: "bg-green-500/20 text-green-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  overdue: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

/* ─── Car Type Icons ─── */
const CAR_TYPES = [
  { type: "tankcar", label: "Tank Cars", icon: <Fuel className="w-4 h-4" /> },
  { type: "boxcar", label: "Box Cars", icon: <Box className="w-4 h-4" /> },
  { type: "hopper", label: "Hoppers", icon: <Package className="w-4 h-4" /> },
  { type: "flatcar", label: "Flat Cars", icon: <Layers className="w-4 h-4" /> },
  { type: "gondola", label: "Gondolas", icon: <Truck className="w-4 h-4" /> },
  { type: "intermodal", label: "Intermodal", icon: <Hash className="w-4 h-4" /> },
];

/* ─── Mock Data (until backend endpoints exist) ─── */
const MOCK_RAILROAD = { name: "Eusorone Short Line Railroad", reportingMark: "ESLX" };

const MOCK_FLEET = {
  tankcar: { total: 245, inService: 218, utilization: 89 },
  boxcar: { total: 312, inService: 287, utilization: 92 },
  hopper: { total: 189, inService: 161, utilization: 85 },
  flatcar: { total: 134, inService: 119, utilization: 89 },
  gondola: { total: 98, inService: 82, utilization: 84 },
  intermodal: { total: 567, inService: 534, utilization: 94 },
};

const MOCK_TRAINS = [
  { id: "T-4401", symbol: "Q401", origin: "Chicago, IL", dest: "Kansas City, MO", cars: 87, crew: "J. Martinez / R. Chen", eta: "14:30 CST", status: "in_transit", speed: 42, milePost: 218 },
  { id: "T-4402", symbol: "M502", origin: "St. Louis, MO", dest: "Memphis, TN", cars: 62, crew: "D. Johnson / S. Park", eta: "18:15 CST", status: "in_transit", speed: 38, milePost: 145 },
  { id: "T-4403", symbol: "Z103", origin: "Dallas, TX", dest: "Houston, TX", cars: 44, crew: "A. Williams / B. Lee", eta: "11:00 CST", status: "departed", speed: 55, milePost: 42 },
  { id: "T-4404", symbol: "L780", origin: "Denver, CO", dest: "Omaha, NE", cars: 105, crew: "M. Davis / K. Wilson", eta: "22:45 MST", status: "in_transit", speed: 48, milePost: 310 },
  { id: "T-4405", symbol: "Q922", origin: "Atlanta, GA", dest: "Jacksonville, FL", cars: 53, crew: "P. Brown / T. Garcia", eta: "16:00 EST", status: "loading", speed: 0, milePost: 0 },
  { id: "T-4406", symbol: "Z211", origin: "Portland, OR", dest: "Seattle, WA", cars: 38, crew: "H. Thompson / R. Patel", eta: "09:30 PST", status: "arrived", speed: 0, milePost: 180 },
];

const MOCK_CREW = {
  engineers: { onDuty: 24, available: 8, resting: 12, total: 44 },
  conductors: { onDuty: 22, available: 10, resting: 14, total: 46 },
};

const MOCK_YARDS = [
  { name: "Chicago Terminal", code: "CHIC", carCount: 342, avgDwell: 18.4, capacity: 500, utilization: 68 },
  { name: "Kansas City Hub", code: "KCHY", carCount: 187, avgDwell: 14.2, capacity: 350, utilization: 53 },
  { name: "St. Louis Yard", code: "STLS", carCount: 221, avgDwell: 22.1, capacity: 400, utilization: 55 },
  { name: "Memphis Intermodal", code: "MEMP", carCount: 156, avgDwell: 11.8, capacity: 250, utilization: 62 },
  { name: "Dallas Terminal", code: "DLLS", carCount: 198, avgDwell: 16.5, capacity: 300, utilization: 66 },
  { name: "Houston Yard", code: "HSTX", carCount: 267, avgDwell: 20.3, capacity: 450, utilization: 59 },
];

const MOCK_REVENUE = {
  mtd: 4_872_340,
  commodities: [
    { name: "Chemicals", revenue: 1_234_000, pct: 25 },
    { name: "Grain", revenue: 987_500, pct: 20 },
    { name: "Intermodal", revenue: 876_200, pct: 18 },
    { name: "Coal/Minerals", revenue: 743_100, pct: 15 },
    { name: "Automotive", revenue: 542_800, pct: 11 },
    { name: "Other", revenue: 488_740, pct: 11 },
  ],
  lanes: [
    { lane: "Chicago - Kansas City", revenue: 892_000, loads: 134 },
    { lane: "St. Louis - Memphis", revenue: 654_000, loads: 98 },
    { lane: "Dallas - Houston", revenue: 543_000, loads: 87 },
    { lane: "Denver - Omaha", revenue: 478_000, loads: 72 },
    { lane: "Atlanta - Jacksonville", revenue: 412_000, loads: 65 },
  ],
  shippers: [
    { name: "Dow Chemical", revenue: 876_000, carloads: 142 },
    { name: "Cargill Inc.", revenue: 654_000, carloads: 231 },
    { name: "Amazon Logistics", revenue: 543_000, carloads: 312 },
    { name: "Arch Coal", revenue: 432_000, carloads: 178 },
    { name: "General Motors", revenue: 387_000, carloads: 95 },
  ],
};

const MOCK_COMPLIANCE = {
  safetyScore: 94.2,
  inspections: { current: 187, due: 12, overdue: 3 },
  hazmatPermits: { active: 34, expiringSoon: 4, expired: 1 },
  crewCerts: { valid: 82, expiringSoon: 6, expired: 2 },
};

/* ─── Fleet Overview Section ─── */
function FleetOverviewSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const totalCars = Object.values(MOCK_FLEET).reduce((a, b) => a + b.total, 0);
  const inServiceCars = Object.values(MOCK_FLEET).reduce((a, b) => a + b.inService, 0);
  const overallUtil = Math.round((inServiceCars / totalCars) * 100);

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
          <Truck className="w-5 h-5 text-blue-400" /> Fleet Overview
          <Badge className="ml-auto bg-blue-500/20 text-blue-400">{totalCars} total cars</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className={muted}>Overall Utilization</span>
              <span className={cn("font-semibold", text)}>{overallUtil}%</span>
            </div>
            <Progress value={overallUtil} className="h-2.5" />
          </div>
          <div className={cn("text-sm font-medium", text)}>{inServiceCars} in service</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CAR_TYPES.map((ct) => {
            const data = MOCK_FLEET[ct.type as keyof typeof MOCK_FLEET];
            return (
              <div key={ct.type} className={cn(
                "rounded-lg border p-3 text-center transition-all hover:scale-[1.02]",
                isLight ? "border-slate-200 hover:border-blue-300" : "border-slate-700/50 hover:border-blue-500/30"
              )}>
                <div className={cn("p-2 rounded-lg w-fit mx-auto mb-2",
                  isLight ? "bg-slate-100" : "bg-slate-700/50"
                )}>{ct.icon}</div>
                <div className={cn("text-lg font-bold", text)}>{data.total}</div>
                <div className={cn("text-xs", muted)}>{ct.label}</div>
                <div className={cn("text-xs mt-1 font-medium",
                  data.utilization >= 90 ? "text-emerald-500" : data.utilization >= 80 ? "text-amber-500" : "text-red-500"
                )}>{data.utilization}% util</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Active Trains Section ─── */
function ActiveTrainsSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const activeTrains = MOCK_TRAINS.filter((t) => ["in_transit", "departed", "loading"].includes(t.status));

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
            <TrainFront className="w-5 h-5 text-cyan-400" /> Active Trains
            <Badge className="ml-2 bg-cyan-500/20 text-cyan-400">{activeTrains.length} running</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {MOCK_TRAINS.map((train) => (
            <div key={train.id} className={cn(
              "rounded-lg border transition-all",
              isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20",
              expandedId === train.id && (isLight ? "bg-slate-50" : "bg-slate-700/20")
            )}>
              <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === train.id ? null : train.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("p-1.5 rounded-lg",
                    train.status === "in_transit" ? "bg-cyan-500/10" : train.status === "departed" ? "bg-blue-500/10" : "bg-amber-500/10"
                  )}>
                    <TrainFront className={cn("w-4 h-4",
                      train.status === "in_transit" ? "text-cyan-400" : train.status === "departed" ? "text-blue-400" : "text-amber-400"
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", text)}>{train.symbol}</span>
                      <Badge className={STATUS_COLORS[train.status] || "bg-slate-500/20 text-slate-400"}>
                        {train.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className={cn("text-xs mt-0.5", muted)}>
                      {train.origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {train.dest}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className={cn("text-xs font-medium", text)}>{train.cars} cars</div>
                    <div className={cn("text-xs", muted)}>{train.crew}</div>
                  </div>
                  <div>
                    <div className={cn("text-xs font-medium", text)}>ETA {train.eta}</div>
                    <div className={cn("text-xs", muted)}>{train.speed > 0 ? `${train.speed} mph` : "Stationary"}</div>
                  </div>
                  {expandedId === train.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {expandedId === train.id && (
                <div className={cn("px-3 pb-3 pt-1 border-t",
                  isLight ? "border-slate-200" : "border-slate-700/50"
                )}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className={cn("text-xs", muted)}>Mile Post</div>
                      <div className={cn("text-sm font-medium", text)}>MP {train.milePost}</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", muted)}>Speed</div>
                      <div className={cn("text-sm font-medium", text)}>{train.speed} mph</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", muted)}>Crew</div>
                      <div className={cn("text-sm font-medium", text)}>{train.crew}</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", muted)}>Train ID</div>
                      <div className={cn("text-sm font-medium", text)}>{train.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Eye className="w-3 h-3" /> Track
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Radio className="w-3 h-3" /> Contact Crew
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <FileText className="w-3 h-3" /> Consist Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Crew Status Section ─── */
function CrewStatusSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const crewQuery = (trpc as any).railShipments?.getRailCrew?.useQuery?.({ limit: 50 });
  const liveCrew: any[] = crewQuery?.data || [];
  const engineers = liveCrew.filter((c: any) => c.role === "engineer");
  const conductors = liveCrew.filter((c: any) => c.role === "conductor");

  const engStats = liveCrew.length > 0 ? {
    onDuty: engineers.filter((c: any) => c.status === "on_duty").length,
    available: engineers.filter((c: any) => c.status === "available").length,
    resting: engineers.filter((c: any) => c.status === "resting").length,
    total: engineers.length,
  } : MOCK_CREW.engineers;

  const condStats = liveCrew.length > 0 ? {
    onDuty: conductors.filter((c: any) => c.status === "on_duty").length,
    available: conductors.filter((c: any) => c.status === "available").length,
    resting: conductors.filter((c: any) => c.status === "resting").length,
    total: conductors.length,
  } : MOCK_CREW.conductors;

  const crewGroups = [
    { label: "Engineers", stats: engStats, icon: <HardHat className="w-5 h-5 text-amber-400" /> },
    { label: "Conductors", stats: condStats, icon: <UserCheck className="w-5 h-5 text-indigo-400" /> },
  ];

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
          <Users className="w-5 h-5 text-indigo-400" /> Crew Status
          <Badge className="ml-auto bg-emerald-500/20 text-emerald-400">
            {engStats.onDuty + condStats.onDuty} on duty
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crewGroups.map((group) => (
            <div key={group.label} className={cn(
              "rounded-lg border p-4",
              isLight ? "border-slate-200" : "border-slate-700/50"
            )}>
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <span className={cn("font-semibold", text)}>{group.label}</span>
                <Badge className="ml-auto bg-slate-500/20 text-slate-400">{group.stats.total} total</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className={cn("rounded-lg p-2 text-center",
                  isLight ? "bg-emerald-50" : "bg-emerald-500/10"
                )}>
                  <div className={cn("text-lg font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                    {group.stats.onDuty}
                  </div>
                  <div className="text-xs text-emerald-500">On Duty</div>
                </div>
                <div className={cn("rounded-lg p-2 text-center",
                  isLight ? "bg-cyan-50" : "bg-cyan-500/10"
                )}>
                  <div className={cn("text-lg font-bold", isLight ? "text-cyan-600" : "text-cyan-400")}>
                    {group.stats.available}
                  </div>
                  <div className="text-xs text-cyan-500">Available</div>
                </div>
                <div className={cn("rounded-lg p-2 text-center",
                  isLight ? "bg-blue-50" : "bg-blue-500/10"
                )}>
                  <div className={cn("text-lg font-bold", isLight ? "text-blue-600" : "text-blue-400")}>
                    {group.stats.resting}
                  </div>
                  <div className="text-xs text-blue-500">Resting</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className={muted}>Duty Coverage</span>
                  <span className={cn("font-medium", text)}>
                    {Math.round(((group.stats.onDuty + group.stats.available) / group.stats.total) * 100)}%
                  </span>
                </div>
                <Progress
                  value={((group.stats.onDuty + group.stats.available) / group.stats.total) * 100}
                  className="h-2"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Yard Summary Section ─── */
function YardSummarySection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const yardsQuery = (trpc as any).railShipments?.getRailYards?.useQuery?.({ limit: 50 });
  const liveYards: any[] = yardsQuery?.data || [];
  const yards = liveYards.length > 0 ? liveYards.map((y: any) => ({
    name: y.name || y.yardName,
    code: y.code || y.yardCode || "---",
    carCount: y.carCount || y.totalCars || 0,
    avgDwell: y.avgDwell || y.dwellTime || 0,
    capacity: y.capacity || 300,
    utilization: y.utilization || Math.round(((y.carCount || 0) / (y.capacity || 300)) * 100),
  })) : MOCK_YARDS;

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
            <MapPin className="w-5 h-5 text-amber-400" /> Yard Summary
          </CardTitle>
          <Link href="/rail/yards">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Eye className="w-3 h-3" /> All Yards
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700/50")}>
                <th className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>Yard</th>
                <th className={cn("text-right py-2 px-3 text-xs font-medium", muted)}>Cars</th>
                <th className={cn("text-right py-2 px-3 text-xs font-medium", muted)}>Avg Dwell (hr)</th>
                <th className={cn("text-right py-2 px-3 text-xs font-medium", muted)}>Capacity</th>
                <th className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {yards.map((yard: any) => (
                <tr key={yard.code} className={cn(
                  "border-b transition-colors",
                  isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-800 hover:bg-slate-700/20"
                )}>
                  <td className="py-2.5 px-3">
                    <div className={cn("font-medium", text)}>{yard.name}</div>
                    <div className={cn("text-xs", muted)}>{yard.code}</div>
                  </td>
                  <td className={cn("text-right py-2.5 px-3 font-semibold", text)}>{yard.carCount}</td>
                  <td className={cn("text-right py-2.5 px-3", text)}>
                    <span className={yard.avgDwell > 20 ? "text-red-500" : yard.avgDwell > 15 ? "text-amber-500" : "text-emerald-500"}>
                      {typeof yard.avgDwell === "number" ? yard.avgDwell.toFixed(1) : yard.avgDwell}
                    </span>
                  </td>
                  <td className={cn("text-right py-2.5 px-3", muted)}>{yard.capacity}</td>
                  <td className="py-2.5 px-3 w-36">
                    <div className="flex items-center gap-2">
                      <Progress value={yard.utilization} className="h-2 flex-1" />
                      <span className={cn("text-xs font-medium w-8 text-right", text)}>{yard.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Revenue Section ─── */
function RevenueSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [revenueTab, setRevenueTab] = useState("commodity");
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
            <DollarSign className="w-5 h-5 text-emerald-400" /> Revenue Analytics
          </CardTitle>
          <Badge className="bg-emerald-500/20 text-emerald-400">
            MTD: ${(MOCK_REVENUE.mtd / 1_000_000).toFixed(2)}M
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={revenueTab} onValueChange={setRevenueTab}>
          <TabsList className={cn("mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
            <TabsTrigger value="commodity">By Commodity</TabsTrigger>
            <TabsTrigger value="lane">By Lane</TabsTrigger>
            <TabsTrigger value="shipper">By Shipper</TabsTrigger>
          </TabsList>

          <TabsContent value="commodity">
            <div className="space-y-3">
              {MOCK_REVENUE.commodities.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className={cn("w-28 text-sm font-medium truncate", text)}>{c.name}</div>
                  <div className="flex-1">
                    <div className={cn(
                      "h-6 rounded-md flex items-center px-2 text-xs font-medium text-white",
                      isLight ? "bg-blue-500" : "bg-blue-600"
                    )} style={{ width: `${c.pct}%`, minWidth: "40px" }}>
                      {fmt(c.revenue)}
                    </div>
                  </div>
                  <div className={cn("text-xs w-10 text-right", muted)}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lane">
            <div className="space-y-2">
              {MOCK_REVENUE.lanes.map((l) => (
                <div key={l.lane} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isLight ? "border-slate-200" : "border-slate-700/50"
                )}>
                  <div>
                    <div className={cn("text-sm font-medium", text)}>{l.lane}</div>
                    <div className={cn("text-xs", muted)}>{l.loads} carloads</div>
                  </div>
                  <div className={cn("text-sm font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                    {fmt(l.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shipper">
            <div className="space-y-2">
              {MOCK_REVENUE.shippers.map((s) => (
                <div key={s.name} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isLight ? "border-slate-200" : "border-slate-700/50"
                )}>
                  <div>
                    <div className={cn("text-sm font-medium", text)}>{s.name}</div>
                    <div className={cn("text-xs", muted)}>{s.carloads} carloads</div>
                  </div>
                  <div className={cn("text-sm font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                    {fmt(s.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ─── Compliance Section ─── */
function ComplianceSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const fraQuery = (trpc as any).railShipments?.getFRASafetyCompliance?.useQuery?.(
    { railroadCode: "ALL" },
    { staleTime: 300_000 }
  );
  const fraData = fraQuery?.data;

  const safetyScore = fraData?.safetyScore ?? fraData?.overallScore ?? MOCK_COMPLIANCE.safetyScore;
  const inspections = {
    current: fraData?.inspectionsYTD ?? fraData?.inspectionCount ?? MOCK_COMPLIANCE.inspections.current,
    due: MOCK_COMPLIANCE.inspections.due,
    overdue: fraData?.openDefects ?? MOCK_COMPLIANCE.inspections.overdue,
  };

  const sections = [
    {
      title: "FRA Inspections",
      icon: <Shield className="w-4 h-4 text-blue-400" />,
      items: [
        { label: "Completed YTD", value: inspections.current, color: "emerald" },
        { label: "Due This Month", value: inspections.due, color: "amber" },
        { label: "Overdue", value: inspections.overdue, color: "red" },
      ],
    },
    {
      title: "Hazmat Permits",
      icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
      items: [
        { label: "Active", value: MOCK_COMPLIANCE.hazmatPermits.active, color: "emerald" },
        { label: "Expiring Soon", value: MOCK_COMPLIANCE.hazmatPermits.expiringSoon, color: "amber" },
        { label: "Expired", value: MOCK_COMPLIANCE.hazmatPermits.expired, color: "red" },
      ],
    },
    {
      title: "Crew Certifications",
      icon: <Award className="w-4 h-4 text-purple-400" />,
      items: [
        { label: "Valid", value: MOCK_COMPLIANCE.crewCerts.valid, color: "emerald" },
        { label: "Expiring Soon", value: MOCK_COMPLIANCE.crewCerts.expiringSoon, color: "amber" },
        { label: "Expired", value: MOCK_COMPLIANCE.crewCerts.expired, color: "red" },
      ],
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: isLight ? "text-emerald-600" : "text-emerald-400",
    amber: isLight ? "text-amber-600" : "text-amber-400",
    red: isLight ? "text-red-600" : "text-red-400",
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
            <Shield className="w-5 h-5 text-emerald-400" /> Compliance & Safety
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs", muted)}>Safety Score</span>
            <Badge className={
              safetyScore >= 90 ? "bg-emerald-500/20 text-emerald-400" :
              safetyScore >= 75 ? "bg-amber-500/20 text-amber-400" :
              "bg-red-500/20 text-red-400"
            }>
              {safetyScore}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div key={section.title} className={cn(
              "rounded-lg border p-4",
              isLight ? "border-slate-200" : "border-slate-700/50"
            )}>
              <div className="flex items-center gap-2 mb-3">
                {section.icon}
                <span className={cn("font-semibold text-sm", text)}>{section.title}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>{item.label}</span>
                    <span className={cn("text-sm font-bold", colorMap[item.color])}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Alert Feed ─── */
function AlertFeed({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const alerts = [
    { id: 1, type: "warning", title: "Train Q401 behind schedule", desc: "Delayed 45 min at MP 218 due to congestion", time: "12 min ago" },
    { id: 2, type: "critical", title: "3 FRA inspections overdue", desc: "Cars ESLX-4421, ESLX-5512, ESLX-6678 need immediate inspection", time: "1 hr ago" },
    { id: 3, type: "info", title: "Crew cert expiring: J. Martinez", desc: "FRA Part 240 certification expires in 14 days", time: "2 hr ago" },
    { id: 4, type: "success", title: "Train Z103 departed on time", desc: "Dallas Terminal to Houston Yard, 44 cars", time: "3 hr ago" },
    { id: 5, type: "warning", title: "Chicago Terminal at 68% capacity", desc: "342 cars — consider expediting departures", time: "4 hr ago" },
    { id: 6, type: "info", title: "Hazmat permit renewal due", desc: "4 permits expiring within 30 days", time: "5 hr ago" },
  ];

  const typeStyles: Record<string, { icon: React.ReactNode; bg: string }> = {
    warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, bg: isLight ? "bg-amber-50" : "bg-amber-500/5" },
    critical: { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, bg: isLight ? "bg-red-50" : "bg-red-500/5" },
    info: { icon: <Bell className="w-4 h-4 text-blue-400" />, bg: isLight ? "bg-blue-50" : "bg-blue-500/5" },
    success: { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: isLight ? "bg-emerald-50" : "bg-emerald-500/5" },
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
          <Bell className="w-5 h-5 text-amber-400" /> Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alerts.map((alert) => {
            const style = typeStyles[alert.type];
            return (
              <div key={alert.id} className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                style.bg,
                isLight ? "border-slate-200" : "border-slate-700/50"
              )}>
                <div className="mt-0.5">{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-medium", text)}>{alert.title}</div>
                  <div className={cn("text-xs mt-0.5", muted)}>{alert.desc}</div>
                </div>
                <span className={cn("text-xs whitespace-nowrap", muted)}>{alert.time}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function RailCarrierDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Try to fetch real data from tRPC
  const statsQuery = (trpc as any).railShipments?.getRailDashboardStats?.useQuery?.();
  const shipmentsQuery = (trpc as any).railShipments?.getRailShipments?.useQuery?.({ limit: 50 });

  const stats = statsQuery?.data;
  const shipments = shipmentsQuery?.data?.shipments || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const totalFleetCars = Object.values(MOCK_FLEET).reduce((a, b) => a + b.total, 0);
  const activeConsists = MOCK_TRAINS.filter((t) => ["in_transit", "departed"].includes(t.status)).length;
  const crewOnDuty = MOCK_CREW.engineers.onDuty + MOCK_CREW.conductors.onDuty;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-blue-100 to-cyan-100" : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
          )}>
            <TrainFront className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Railroad Operations</h1>
            <p className={cn("text-sm", muted)}>
              {MOCK_RAILROAD.name} ({MOCK_RAILROAD.reportingMark}) — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/rail/fleet-management">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Truck className="w-3.5 h-3.5" /> Fleet
            </Button>
          </Link>
          <Link href="/rail/crew-management">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Crew
            </Button>
          </Link>
          <Link href="/rail/shipments/create">
            <Button size="sm" className={cn(
              "gap-1.5 text-xs",
              isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600/90 hover:bg-blue-600 text-white"
            )}>
              <Plus className="w-3.5 h-3.5" /> New Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          icon={<TrainFront className="w-5 h-5" />}
          label="Active Consists"
          value={stats?.activeConsists ?? activeConsists}
          subtitle="Currently running"
          trend={{ value: "+2", up: true }}
          isLight={isLight}
          accent="cyan"
        />
        <KpiCard
          icon={<Package className="w-5 h-5" />}
          label="Cars in Fleet"
          value={stats?.totalCars ?? totalFleetCars.toLocaleString()}
          subtitle={`${Object.values(MOCK_FLEET).reduce((a, b) => a + b.inService, 0)} in service`}
          isLight={isLight}
          accent="blue"
        />
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Crew on Duty"
          value={crewOnDuty}
          subtitle={`${MOCK_CREW.engineers.total + MOCK_CREW.conductors.total} total crew`}
          trend={{ value: "Full coverage", up: true }}
          isLight={isLight}
          accent="purple"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Revenue MTD"
          value={`$${(MOCK_REVENUE.mtd / 1_000_000).toFixed(2)}M`}
          subtitle="Month to date"
          trend={{ value: "+8.3%", up: true }}
          isLight={isLight}
          accent="emerald"
        />
        <KpiCard
          icon={<Shield className="w-5 h-5" />}
          label="Safety Score"
          value={MOCK_COMPLIANCE.safetyScore}
          subtitle="FRA composite"
          trend={{ value: "+1.2", up: true }}
          isLight={isLight}
          accent="amber"
        />
      </div>

      {/* Fleet Overview */}
      <div className="mb-6">
        <FleetOverviewSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* Active Trains + Crew Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ActiveTrainsSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        <CrewStatusSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* Yard Summary */}
      <div className="mb-6">
        <YardSummarySection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* Revenue + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <RevenueSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        <AlertFeed isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* Compliance */}
      <div className="mb-6">
        <ComplianceSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>
    </div>
  );
}
