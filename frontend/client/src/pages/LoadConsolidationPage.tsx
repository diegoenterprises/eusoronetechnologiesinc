/**
 * MULTI-SHIPPER LOAD CONSOLIDATION PAGE (GAP-083)
 * Consolidation opportunities dashboard with cost sharing and route optimization.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Layers, Package, DollarSign, TrendingDown, Truck,
  MapPin, ArrowRight, ChevronRight, CheckCircle, XCircle,
  Weight, BarChart3, Clock, Users, Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "opportunities" | "corridors";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  proposed: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Proposed" },
  accepted: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Accepted" },
  partial: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Partial" },
  rejected: { color: "text-red-400", bg: "bg-red-500/10", label: "Rejected" },
  executed: { color: "text-purple-400", bg: "bg-purple-500/10", label: "Executed" },
};

export default function LoadConsolidationPage() {
  const { theme } = useTheme(); const L = theme === "light";
  const [tab, setTab] = useState<Tab>("opportunities");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const dashQuery = (trpc as any).loadConsolidation?.getDashboard?.useQuery?.() || { data: null, isLoading: false };
  const dash = dashQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Load Consolidation
          </h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Multi-shipper shipment consolidation for cost savings</p>
        </div>
        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400"><Layers className="w-3 h-3 mr-0.5" />AI Matching</Badge>
      </div>

      {/* KPIs */}
      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Groups", value: dash.totalGroups, color: L ? "text-slate-900" : "text-white", icon: <Layers className="w-4 h-4 text-blue-400" /> },
            { label: "Shipments", value: dash.totalShipments, color: L ? "text-slate-900" : "text-white", icon: <Package className="w-4 h-4 text-purple-400" /> },
            { label: "Total Savings", value: `$${dash.totalSavings.toLocaleString()}`, color: "text-emerald-400", icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
            { label: "Avg Savings", value: `${dash.avgSavingsPct}%`, color: "text-emerald-400", icon: <TrendingDown className="w-4 h-4 text-emerald-400" /> },
            { label: "Avg Capacity", value: `${dash.avgCapacityUtil}%`, color: "text-cyan-400", icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
          ].map(k => (
            <Card key={k.label} className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-3 flex items-center gap-2">
                {k.icon}
                <div>
                  <p className={cn("text-lg font-bold font-mono", k.color)}>{k.value}</p>
                  <p className="text-xs text-slate-500">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={cn("flex gap-1 rounded-lg p-1 w-fit", L ? "bg-slate-100" : "bg-slate-800/50")}>
        {[
          { id: "opportunities" as Tab, icon: <Layers className="w-3.5 h-3.5 mr-1" />, label: "Opportunities", color: "bg-blue-600" },
          { id: "corridors" as Tab, icon: <MapPin className="w-3.5 h-3.5 mr-1" />, label: "Top Corridors", color: "bg-indigo-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {dashQuery.isLoading && <Skeleton className={cn("h-48 rounded-xl", L ? "bg-slate-200" : "bg-slate-700/30")} />}

      {/* ── Opportunities Tab ── */}
      {tab === "opportunities" && dash && (
        <div className="space-y-3">
          {dash.groups.map((g: any) => {
            const stCfg = STATUS_CONFIG[g.status] || STATUS_CONFIG.proposed;
            const isExp = expandedGroup === g.groupId;
            return (
              <Card key={g.groupId} className={cn("rounded-xl border transition-all cursor-pointer", isExp ? "bg-blue-500/5 border-blue-500/20" : L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")} onClick={() => setExpandedGroup(isExp ? null : g.groupId)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold font-mono", L ? "text-slate-900" : "text-white")}>{g.groupId}</span>
                        <Badge variant="outline" className={cn("text-xs", stCfg.color)}>{stCfg.label}</Badge>
                        <span className="text-xs text-slate-400">{g.corridor}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs">
                        <span className="text-slate-500"><Package className="w-2.5 h-2.5 inline mr-0.5" />{g.shipments.length} shipments</span>
                        <span className="text-slate-500"><Weight className="w-2.5 h-2.5 inline mr-0.5" />{(g.totalWeight / 1000).toFixed(1)}K lbs</span>
                        <span className="text-slate-500"><Percent className="w-2.5 h-2.5 inline mr-0.5" />{g.capacityUtilization}% full</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-emerald-400 text-lg font-bold font-mono">-${g.savings.toLocaleString()}</p>
                      <p className="text-xs text-emerald-400">{g.savingsPct}% savings</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform", isExp && "rotate-90")} />
                  </div>

                  {/* Expanded */}
                  {isExp && (
                    <div className={cn("mt-3 space-y-3 border-t pt-3", L ? "border-slate-200" : "border-slate-700/30")} onClick={e => e.stopPropagation()}>
                      {/* Rate Comparison */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className={cn("p-2 rounded-lg text-center", L ? "bg-slate-100" : "bg-slate-900/30")}>
                          <p className="text-xs text-slate-500">Solo Total</p>
                          <p className="text-[12px] font-mono font-bold text-red-400 line-through">${g.soloTotalRate.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                          <p className="text-xs text-slate-500">Consolidated</p>
                          <p className="text-[12px] font-mono font-bold text-emerald-400">${g.consolidatedRate.toLocaleString()}</p>
                        </div>
                        <div className={cn("p-2 rounded-lg text-center", L ? "bg-slate-100" : "bg-slate-900/30")}>
                          <p className="text-xs text-slate-500">Miles Saved</p>
                          <p className="text-[12px] font-mono font-bold text-cyan-400">{g.distanceSaved} mi</p>
                        </div>
                      </div>

                      {/* Per-Shipper Savings */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Per-Shipper Breakdown</p>
                        <div className="space-y-1">
                          {g.perShipperSavings.map((ps: any) => (
                            <div key={ps.shipperId} className={cn("flex items-center justify-between p-2 rounded-lg", L ? "bg-slate-50" : "bg-slate-900/20")}>
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className={cn("text-xs", L ? "text-slate-900" : "text-white")}>{ps.shipperName}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-500 line-through">${ps.soloRate.toLocaleString()}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className={cn("font-mono", L ? "text-slate-900" : "text-white")}>${ps.consolidatedShare.toLocaleString()}</span>
                                <span className="text-emerald-400 font-bold">-${ps.savings.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipments */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Shipments in Group</p>
                        <div className="space-y-1">
                          {g.shipments.map((sh: any) => (
                            <div key={sh.loadId} className={cn("flex items-center justify-between p-1.5 rounded-lg text-xs", L ? "bg-slate-50" : "bg-slate-900/20")}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-blue-400">{sh.loadId}</span>
                                <span className="text-slate-400">{sh.commodity}</span>
                                {sh.hazmat && <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">HAZMAT</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-slate-400">
                                <span>{(sh.weight / 1000).toFixed(1)}K lbs</span>
                                <span>{sh.pallets} plt</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compatibility */}
                      <div className={cn("flex items-center gap-3 p-2 rounded-lg", L ? "bg-slate-100" : "bg-slate-900/30")}>
                        <span className="text-xs text-slate-500">Compatibility:</span>
                        <span className={cn("text-xs font-bold font-mono", g.compatibility.score >= 80 ? "text-emerald-400" : g.compatibility.score >= 60 ? "text-amber-400" : "text-red-400")}>{g.compatibility.score}%</span>
                        {g.compatibility.issues.map((issue: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs text-amber-400 border-amber-500/30">{issue}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Corridors Tab ── */}
      {tab === "corridors" && dash && (
        <div className="space-y-2">
          {dash.topCorridors.map((c: any, i: number) => (
            <Card key={i} className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", i < 3 ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700/50 text-slate-400")}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold", L ? "text-slate-900" : "text-white")}>{c.corridor}</p>
                      <p className="text-xs text-slate-500">{c.opportunities} consolidation opportunities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-lg font-bold font-mono">${c.potentialSavings.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">potential savings</p>
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
