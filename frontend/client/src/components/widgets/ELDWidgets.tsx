import React from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Activity, Radio, Wifi, WifiOff, Truck, Shield, AlertTriangle,
  CheckCircle, Clock, Users, TrendingUp, Zap, Navigation, Mountain,
  MapPin, ChevronRight, Gauge,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// ELD FLEET PULSE WIDGET
// Compact fleet ELD health dashboard for the PremiumDashboard widget system.
// Shows: devices online/offline, HOS compliance, live fleet count, violations.
// ============================================================================
export function ELDFleetPulseWidget() {
  const [, navigate] = useLocation();
  const healthQ = (trpc as any).eld?.getFleetHealthDashboard?.useQuery?.(undefined, {
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const data = healthQ?.data;
  const loading = healthQ?.isLoading;

  if (loading) {
    return (
      <div className="h-full p-3 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const eld = data?.eld || { connected: false, totalDevices: 0, activeDevices: 0, offlineDevices: 0, complianceRate: 0 };
  const fleet = data?.fleet || { totalDrivers: 0, driving: 0, violations: 0 };
  const hos = data?.hos || { complianceScore: 0, violationsThisWeek: 0 };
  const live = data?.liveFleet || { count: 0, avgSpeedMph: 0 };

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1473FF]" />
          <span className="text-xs font-semibold text-slate-300">ELD Fleet Pulse</span>
        </div>
        <Badge className={`border-0 text-xs font-bold ${eld.connected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {eld.connected ? <><Wifi className="w-2.5 h-2.5 mr-1" />Connected</> : <><WifiOff className="w-2.5 h-2.5 mr-1" />Offline</>}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Truck className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-slate-500">Devices</span>
          </div>
          <p className="text-lg font-bold text-white">{eld.activeDevices}<span className="text-xs text-slate-500 font-normal">/{eld.totalDevices}</span></p>
          <p className="text-xs text-slate-500">{eld.offlineDevices} offline</p>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-slate-500">HOS Compliance</span>
          </div>
          <p className="text-lg font-bold text-emerald-400">{hos.complianceScore}%</p>
          <Progress value={hos.complianceScore} className="h-1 mt-1" />
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-slate-500">Live Fleet</span>
          </div>
          <p className="text-lg font-bold text-white">{live.count}</p>
          <p className="text-xs text-slate-500">{fleet.driving} driving · {live.avgSpeedMph} mph avg</p>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-slate-500">Violations</span>
          </div>
          <p className={`text-lg font-bold ${hos.violationsThisWeek > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {hos.violationsThisWeek}
          </p>
          <p className="text-xs text-slate-500">this week</p>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs text-[#1473FF] hover:bg-[#1473FF]/10"
        onClick={() => navigate("/eld")}
      >
        Open ELD Intelligence <ChevronRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}

// ============================================================================
// ELD NETWORK EFFECT WIDGET
// Shows the platform-wide ELD network strength, road miles mapped,
// LiDAR coverage, and benefits unlocked. Drives organic "connect ELD" CTAs.
// ============================================================================
export function ELDNetworkEffectWidget() {
  const [, navigate] = useLocation();
  const netQ = (trpc as any).eld?.getELDNetworkStats?.useQuery?.(undefined, {
    staleTime: 120000,
  });
  const data = netQ?.data;
  const loading = netQ?.isLoading;

  if (loading) {
    return (
      <div className="h-full p-3 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    );
  }

  const strengthColors: Record<string, string> = {
    building: "from-slate-500 to-slate-600",
    growing: "from-blue-500 to-cyan-500",
    strong: "from-emerald-500 to-cyan-500",
    dominant: "from-[#1473FF] to-[#BE01FF]",
  };
  const strength = data?.networkStrength || "building";

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-[#BE01FF]" />
        <span className="text-xs font-semibold text-slate-300">ELD Network Effect</span>
        <Badge className={`ml-auto border-0 text-xs font-bold bg-gradient-to-r ${strengthColors[strength]} text-white`}>
          {strength.toUpperCase()}
        </Badge>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-sm font-bold text-white">{data?.totalDevicesConnected || 0}</p>
          <p className="text-xs text-slate-500">Devices</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-sm font-bold text-white">{data?.totalDriversTracked || 0}</p>
          <p className="text-xs text-slate-500">Drivers</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-sm font-bold text-white">{data?.roadMilesMapped || 0}</p>
          <p className="text-xs text-slate-500">Road Miles</p>
        </div>
      </div>

      {/* Benefits */}
      {(data?.benefitsUnlocked?.length || 0) > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium">Benefits Unlocked</p>
          <div className="flex flex-wrap gap-1">
            {data?.benefitsUnlocked?.slice(0, 5).map((b: string, i: number) => (
              <Badge key={i} className="border-0 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                <CheckCircle className="w-2 h-2 mr-0.5" />{b}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* LiDAR coverage */}
      {(data?.lidarSegmentsEnriched || 0) > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
          <Mountain className="w-3.5 h-3.5 text-purple-400" />
          <div>
            <p className="text-xs text-purple-300 font-medium">{data?.lidarSegmentsEnriched} LiDAR Segments</p>
            <p className="text-xs text-slate-500">Road surface analysis powered by fleet GPS</p>
          </div>
        </div>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 mt-auto text-xs text-[#BE01FF] hover:bg-[#BE01FF]/10"
        onClick={() => navigate("/eld")}
      >
        Explore ELD Intelligence <ChevronRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}

// ============================================================================
// ELD ROAD INTELLIGENCE WIDGET
// Compact LiDAR road intelligence from fleet ELD GPS enrichment.
// Shows: total road segments, LiDAR coverage %, avg truck risk, high-risk count.
// ============================================================================
export function ELDRoadIntelligenceWidget() {
  const [, navigate] = useLocation();
  const healthQ = (trpc as any).eld?.getFleetHealthDashboard?.useQuery?.(undefined, {
    staleTime: 60000,
  });
  const roads = healthQ?.data?.roads;
  const loading = healthQ?.isLoading;

  if (loading) {
    return (
      <div className="h-full p-3 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const r = roads || { totalSegments: 0, totalMiles: 0, lidarEnriched: 0, coveragePct: 0, avgTruckRisk: null, highRiskSegments: 0 };
  const riskColor = (r.avgTruckRisk || 0) > 60 ? "text-red-400" : (r.avgTruckRisk || 0) > 35 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-auto">
      <div className="flex items-center gap-2">
        <Navigation className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-300">EusoRoads Intelligence</span>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-slate-500">Road Segments</span>
          </div>
          <p className="text-lg font-bold text-white">{r.totalSegments.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{r.totalMiles} mi mapped</p>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-slate-500">LiDAR Coverage</span>
          </div>
          <p className="text-lg font-bold text-purple-400">{r.coveragePct}%</p>
          <p className="text-xs text-slate-500">{r.lidarEnriched} enriched</p>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-slate-500">Avg Truck Risk</span>
          </div>
          <p className={`text-lg font-bold ${riskColor}`}>{r.avgTruckRisk ?? "—"}</p>
          <p className="text-xs text-slate-500">out of 100</p>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-slate-500">High Risk</span>
          </div>
          <p className={`text-lg font-bold ${r.highRiskSegments > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {r.highRiskSegments}
          </p>
          <p className="text-xs text-slate-500">segments &gt;60 risk</p>
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs text-cyan-400 hover:bg-cyan-500/10"
        onClick={() => navigate("/hot-zones")}
      >
        View on Satellite Map <ChevronRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}
