/**
 * AI-OPTIMIZED MISSION BALANCING PAGE (GAP-438)
 * Fleet mission optimization dashboard with workload balancing and assignment suggestions.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Target, Truck, User, MapPin, Clock, DollarSign,
  BarChart3, Zap, CheckCircle, ArrowRight, RefreshCw,
  Gauge, TrendingDown, AlertTriangle, ChevronRight, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "balance" | "assignments" | "drivers";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-orange-400", F: "text-red-500",
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  standard: { color: "text-slate-400", bg: "bg-slate-500/10" },
  hot: { color: "text-amber-400", bg: "bg-amber-500/10" },
  critical: { color: "text-red-400", bg: "bg-red-500/10" },
};

export default function MissionBalancerPage() {
  const [tab, setTab] = useState<Tab>("balance");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  const dashQuery = (trpc as any).missionBalancer?.getDashboard?.useQuery?.() || { data: null, isLoading: false };
  const dash = dashQuery.data;
  const fb = dash?.fleetBalance;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
            Mission Balancer
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-optimized load distribution & fleet workload balancing</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => dashQuery.refetch?.()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />Re-optimize
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "balance" as Tab, icon: <BarChart3 className="w-3.5 h-3.5 mr-1" />, label: "Fleet Balance", color: "bg-purple-600" },
          { id: "assignments" as Tab, icon: <Target className="w-3.5 h-3.5 mr-1" />, label: "Assignments", color: "bg-blue-600" },
          { id: "drivers" as Tab, icon: <User className="w-3.5 h-3.5 mr-1" />, label: "Driver Status", color: "bg-emerald-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {dashQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Fleet Balance Tab ── */}
      {tab === "balance" && fb && (
        <div className="space-y-4">
          {/* Grade + KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl col-span-1">
              <CardContent className="p-3 text-center">
                <p className={cn("text-4xl font-bold font-mono", GRADE_COLORS[fb.balanceGrade])}>{fb.balanceGrade}</p>
                <p className="text-xs text-slate-500">Balance Grade</p>
              </CardContent>
            </Card>
            {[
              { label: "Avg Utilization", value: `${fb.avgUtilization}%`, color: fb.avgUtilization > 70 ? "text-emerald-400" : "text-amber-400" },
              { label: "Util Std Dev", value: `${fb.utilizationStdDev}%`, color: fb.utilizationStdDev < 15 ? "text-emerald-400" : "text-red-400" },
              { label: "Avg Revenue/Driver", value: `$${fb.avgRevenuePerDriver.toLocaleString()}`, color: "text-white" },
              { label: "Deadhead Ratio", value: `${Math.round(fb.deadheadRatio * 100)}%`, color: fb.deadheadRatio < 0.15 ? "text-emerald-400" : "text-red-400" },
              { label: "Total Deadhead", value: `${fb.totalDeadheadMiles.toLocaleString()} mi`, color: "text-slate-300" },
            ].map(k => (
              <Card key={k.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <p className={cn("text-lg font-bold font-mono", k.color)}>{k.value}</p>
                  <p className="text-xs text-slate-500">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Optimization Summary */}
          {dash?.optimizationSummary && (
            <Card className="bg-purple-500/5 border-purple-500/20 rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-purple-400 flex items-center gap-2"><Zap className="w-4 h-4" />AI Optimization Impact</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Deadhead Saved", value: `${dash.optimizationSummary.estimatedDeadheadSaved} mi`, icon: <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> },
                    { label: "Revenue Lift", value: `$${dash.optimizationSummary.estimatedRevenueLift.toLocaleString()}`, icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> },
                    { label: "Balance Improvement", value: `+${dash.optimizationSummary.driverBalanceImprovement}%`, icon: <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> },
                    { label: "HOS Util Gain", value: `+${dash.optimizationSummary.hosUtilizationGain}%`, icon: <Clock className="w-3.5 h-3.5 text-cyan-400" /> },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg bg-slate-900/30 flex items-center gap-2">
                      {s.icon}
                      <div>
                        <p className="text-xs font-bold font-mono text-white">{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imbalance Areas */}
          {fb.imbalanceAreas.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Imbalance Areas</CardTitle></CardHeader>
              <CardContent className="pb-3 space-y-1.5">
                {fb.imbalanceAreas.map((area: any, i: number) => (
                  <div key={i} className={cn("p-2.5 rounded-lg border", area.severity === "high" ? "border-red-500/20 bg-red-500/5" : area.severity === "medium" ? "border-amber-500/20 bg-amber-500/5" : "border-slate-700/30 bg-slate-900/20")}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("w-3.5 h-3.5", area.severity === "high" ? "text-red-400" : "text-amber-400")} />
                      <span className="text-xs font-semibold text-white">{area.area}</span>
                      <Badge variant="outline" className={cn("text-xs", area.severity === "high" ? "text-red-400" : "text-amber-400")}>{area.severity}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-5">{area.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Recommendations</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {fb.recommendations.map((r: string, i: number) => (
                <p key={i} className="text-xs text-slate-300 py-1">• {r}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Assignments Tab ── */}
      {tab === "assignments" && dash && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{dash.suggestedAssignments.length} AI-optimized assignments for {dash.pendingLoads.length} pending loads</p>
          {dash.suggestedAssignments.map((a: any) => {
            const load = dash.pendingLoads.find((l: any) => l.loadId === a.loadId);
            const isExp = expandedAssignment === a.loadId;
            const pCfg = PRIORITY_CONFIG[load?.priority || "standard"];
            return (
              <Card key={a.loadId} className={cn("rounded-xl border transition-all cursor-pointer", isExp ? "bg-blue-500/5 border-blue-500/20" : "bg-slate-800/50 border-slate-700/50")} onClick={() => setExpandedAssignment(isExp ? null : a.loadId)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-white">{a.loadId}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-blue-400 font-semibold">{a.driverName}</span>
                        {load && <Badge variant="outline" className={cn("text-xs", pCfg.color)}>{load.priority}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {load ? `${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state}` : ""}
                        {` • ${a.deadheadMiles} mi deadhead • $${a.estimatedRevenue.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold font-mono text-white">{a.balanceScore}</p>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                  </div>

                  {isExp && (
                    <div className="mt-3 space-y-2 border-t border-slate-700/30 pt-3" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Deadhead", value: `${a.deadheadMiles} mi` },
                          { label: "Total Miles", value: `${a.totalMiles} mi` },
                          { label: "Revenue", value: `$${a.estimatedRevenue.toLocaleString()}` },
                          { label: "RPM", value: `$${a.revenuePerMile}` },
                        ].map(m => (
                          <div key={m.label} className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                            <p className="text-xs font-mono font-bold text-white">{m.value}</p>
                            <p className="text-xs text-slate-500">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900/30">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Why This Driver</p>
                        {a.reasoning.map((r: string, i: number) => (
                          <p key={i} className="text-xs text-emerald-300 py-0.5">- {r}</p>
                        ))}
                      </div>

                      {a.alternativeDrivers.length > 0 && (
                        <div className="p-2 rounded-lg bg-slate-900/30">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Alternatives</p>
                          {a.alternativeDrivers.map((alt: any) => (
                            <div key={alt.driverId} className="flex items-center justify-between py-0.5">
                              <span className="text-xs text-slate-300">{alt.name}</span>
                              <span className="text-xs font-mono text-slate-400">Score: {alt.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Drivers Tab ── */}
      {tab === "drivers" && dash && (
        <div className="space-y-2">
          {dash.drivers.sort((a: any, b: any) => a.utilizationPct - b.utilizationPct).map((d: any) => (
            <Card key={d.driverId} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", d.fatigueScore > 70 ? "bg-red-500/10 text-red-400" : d.fatigueScore > 40 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{d.driverName}</span>
                      <Badge variant="outline" className="text-xs text-slate-400">{d.equipmentType}</Badge>
                      <span className="text-xs text-slate-500"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{d.currentLocation.city}, {d.currentLocation.state}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-slate-500">Util: <span className={cn("font-mono font-bold", d.utilizationPct > 80 ? "text-red-400" : d.utilizationPct > 50 ? "text-amber-400" : "text-emerald-400")}>{d.utilizationPct}%</span></span>
                      <span className="text-slate-500">HOS: <span className="text-white font-mono">{d.hoursAvailable.toFixed(1)}h left</span></span>
                      <span className="text-slate-500">Loads: <span className="text-white font-mono">{d.loadsThisWeek}</span></span>
                      <span className="text-slate-500">Revenue: <span className="text-emerald-400 font-mono">${d.revenueThisWeek.toLocaleString()}</span></span>
                      <span className="text-slate-500">DH: <span className={cn("font-mono", d.deadheadMilesThisWeek > 300 ? "text-red-400" : "text-white")}>{d.deadheadMilesThisWeek} mi</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Gauge className={cn("w-5 h-5", d.fatigueScore > 70 ? "text-red-400" : d.fatigueScore > 40 ? "text-amber-400" : "text-emerald-400")} />
                    <p className="text-xs text-slate-500">Fatigue {d.fatigueScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
