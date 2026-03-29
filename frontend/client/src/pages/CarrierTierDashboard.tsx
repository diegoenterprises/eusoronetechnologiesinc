/**
 * CARRIER TIER DASHBOARD (GAP-063) — SUPER_ADMIN
 * Full admin control: carrier list table, search, tier filter,
 * manual tier override, distribution analytics, and detailed lookup.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Crown, Award, Medal, Truck, Search, BarChart3,
  AlertTriangle, CheckCircle, ArrowUpRight, Gauge,
  ChevronRight, Target, Gift, RefreshCw, ArrowLeft,
  Shield, Star, Eye, Pencil, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import CarrierTierBadge from "@/components/carrier/CarrierTierBadge";

const TIER_ICONS: Record<string, React.ReactNode> = {
  gold: <Crown className="w-5 h-5" />,
  silver: <Award className="w-5 h-5" />,
  bronze: <Medal className="w-5 h-5" />,
  standard: <Truck className="w-5 h-5" />,
};

const TIER_ICONS_SM: Record<string, React.ReactNode> = {
  gold: <Crown className="w-4 h-4" />,
  silver: <Award className="w-4 h-4" />,
  bronze: <Medal className="w-4 h-4" />,
  standard: <Truck className="w-4 h-4" />,
};

const TIER_COLORS: Record<string, { text: string; border: string; bg: string; ring: string }> = {
  gold: { text: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", ring: "ring-yellow-500/30" },
  silver: { text: "text-slate-300", border: "border-slate-400/30", bg: "bg-slate-300/10", ring: "ring-slate-400/30" },
  bronze: { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", ring: "ring-orange-500/30" },
  standard: { text: "text-slate-500", border: "border-slate-600/30", bg: "bg-slate-600/10", ring: "ring-slate-600/30" },
};

const TIER_GRADIENTS: Record<string, string> = {
  gold: "from-yellow-500/20 via-amber-500/10 to-yellow-600/20",
  silver: "from-slate-300/20 via-slate-400/10 to-slate-300/20",
  bronze: "from-orange-500/20 via-amber-600/10 to-orange-500/20",
  standard: "from-slate-600/20 via-slate-700/10 to-slate-600/20",
};

type TabView = "list" | "detail";

export default function CarrierTierDashboard() {
  const [view, setView] = useState<TabView>("list");
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "gold" | "silver" | "bronze" | "standard">("all");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{ id: number; name: string } | null>(null);
  const [overrideTier, setOverrideTierVal] = useState<"gold" | "silver" | "bronze" | "standard">("gold");

  const listQuery = (trpc as any).carrierTier?.listAllCarrierTiers?.useQuery?.(
    { search: search || undefined, tierFilter: tierFilter !== "all" ? tierFilter : undefined },
    { refetchInterval: 60_000 }
  ) || { data: null, isLoading: false, refetch: () => {} };
  const distributionQuery = (trpc as any).carrierTier?.getTierDistribution?.useQuery?.() || { data: null, refetch: () => {} };
  const detailQuery = (trpc as any).carrierTier?.getCarrierTier?.useQuery?.(
    { carrierId: selectedCarrierId! },
    { enabled: !!selectedCarrierId && view === "detail" }
  ) || { data: null, isLoading: false };
  const overrideMutation = (trpc as any).carrierTier?.overrideTier?.useMutation?.({
    onSuccess: () => { toast.success(`Tier overridden to ${overrideTier}`); setOverrideTarget(null); listQuery.refetch?.(); distributionQuery.refetch?.(); },
    onError: (e: any) => toast.error("Override failed"),
  }) || { mutate: () => {}, isPending: false };

  const carriers = (listQuery.data as any[]) || [];
  const dist = distributionQuery.data;
  const detail = detailQuery.data;
  const colors = detail ? TIER_COLORS[detail.tier] || TIER_COLORS.standard : TIER_COLORS.standard;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === "detail" && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-white" onClick={() => setView("list")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-slate-300 to-orange-400 bg-clip-text text-transparent">Carrier Tier System</h1>
            <p className="text-slate-400 text-xs mt-0.5">{view === "list" ? `${carriers.length} carriers · Gold / Silver / Bronze` : "Detailed tier breakdown"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs border-white/[0.08] text-slate-400" onClick={() => { listQuery.refetch?.(); distributionQuery.refetch?.(); }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
        </Button>
      </div>

      {view === "list" && (
        <>
          {/* Distribution Filter Cards */}
          {dist && (
            <div className="grid grid-cols-4 gap-3">
              {(["gold", "silver", "bronze", "standard"] as const).map(t => {
                const count = dist[t] || 0;
                const pct = dist.total > 0 ? Math.round((count / dist.total) * 100) : 0;
                const tc = TIER_COLORS[t];
                const active = tierFilter === t;
                return (
                  <button key={t} onClick={() => setTierFilter(active ? "all" : t)}
                    className={cn("p-3 rounded-xl border transition-all text-left", active ? cn(tc.border, tc.bg, "ring-1", tc.ring) : "border-slate-700/30 bg-slate-800/50 hover:border-slate-600/50")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={tc.text}>{TIER_ICONS_SM[t]}</span>
                      <span className={cn("text-lg font-bold font-mono", tc.text)}>{count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 capitalize">{t}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search by name, DOT#, MC#..." value={search} onChange={(e: any) => setSearch(e.target.value)}
                className="h-8 pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500" />
            </div>
            {tierFilter !== "all" && (
              <Badge className={cn("text-xs cursor-pointer", TIER_COLORS[tierFilter].text, TIER_COLORS[tierFilter].bg)} onClick={() => setTierFilter("all")}>
                {tierFilter} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Carrier Table */}
          {listQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/[0.04]" />)}</div>
          ) : carriers.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">No Carriers Found</p>
                <p className="text-xs text-slate-500 mt-1">{search ? "Try a different search" : "No carriers with DOT numbers"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_70px_70px_70px_70px_90px] gap-2 px-4 py-2 border-b border-white/[0.06] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Carrier</span><span>Tier</span><span className="text-right">Score</span><span className="text-right">Loads</span><span className="text-right">On-Time</span><span className="text-right">Tenure</span><span className="text-center">Actions</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {carriers.map((c: any) => {
                  const tc = TIER_COLORS[c.tier] || TIER_COLORS.standard;
                  return (
                    <div key={c.id} className="grid grid-cols-[1fr_90px_70px_70px_70px_70px_90px] gap-2 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white truncate block">{c.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.dotNumber && <span className="text-xs text-slate-500">DOT# {c.dotNumber}</span>}
                          {c.mcNumber && <span className="text-xs text-slate-500">MC# {c.mcNumber}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={tc.text}>{TIER_ICONS_SM[c.tier]}</span>
                        <span className={cn("text-xs font-bold capitalize", tc.text)}>{c.tier}</span>
                      </div>
                      <span className={cn("text-xs font-bold font-mono text-right", c.compositeScore >= 85 ? "text-yellow-400" : c.compositeScore >= 70 ? "text-slate-300" : c.compositeScore >= 55 ? "text-orange-400" : "text-slate-500")}>{c.compositeScore}</span>
                      <span className="text-xs font-mono text-slate-300 text-right">{c.totalLoads}</span>
                      <span className={cn("text-xs font-mono text-right", c.onTimeRate >= 90 ? "text-emerald-400" : c.onTimeRate >= 70 ? "text-amber-400" : "text-red-400")}>{c.onTimeRate}%</span>
                      <span className="text-xs text-slate-400 text-right">{c.tenureMonths}mo</span>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-cyan-400 hover:bg-cyan-500/10" onClick={() => { setSelectedCarrierId(c.id); setView("detail"); }}>
                          <Eye className="w-3 h-3 mr-0.5" />View
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-amber-400 hover:bg-amber-500/10" onClick={() => { setOverrideTarget({ id: c.id, name: c.name }); setOverrideTierVal(c.tier); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Override Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Override Tier: {overrideTarget.name}</h2>
              <button onClick={() => setOverrideTarget(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(["gold", "silver", "bronze", "standard"] as const).map(t => {
                const tc = TIER_COLORS[t];
                return (
                  <button key={t} onClick={() => setOverrideTierVal(t)}
                    className={cn("p-3 rounded-lg border text-center transition-all", overrideTier === t ? cn(tc.border, tc.bg, "ring-1", tc.ring) : "border-slate-700/30 hover:border-slate-600")}>
                    <span className={tc.text}>{TIER_ICONS[t]}</span>
                    <p className={cn("text-xs font-bold capitalize mt-1", tc.text)}>{t}</p>
                  </button>
                );
              })}
            </div>
            <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs" disabled={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate({ carrierId: overrideTarget.id, tier: overrideTier })}>
              {overrideMutation.isPending ? "Overriding..." : `Set to ${overrideTier.charAt(0).toUpperCase() + overrideTier.slice(1)}`}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      {view === "detail" && (
        <>
          {detailQuery.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full bg-slate-700/30 rounded-xl" />
              <Skeleton className="h-60 w-full bg-slate-700/30 rounded-xl" />
            </div>
          )}
          {detail && (
            <Card className={cn("bg-slate-800/50 rounded-xl overflow-hidden", colors.border, "border")}>
              <div className={cn("bg-gradient-to-r px-6 py-5", TIER_GRADIENTS[detail.tier])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", colors.bg, "ring-2", colors.ring)}>
                      <span className={colors.text}>{TIER_ICONS[detail.tier]}</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{detail.companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CarrierTierBadge tier={detail.tier} score={detail.compositeScore} size="md" showScore />
                        {detail.dotNumber && <span className="text-xs text-slate-500">DOT# {detail.dotNumber}</span>}
                        {detail.mcNumber && <span className="text-xs text-slate-500">MC# {detail.mcNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => { setOverrideTarget({ id: selectedCarrierId!, name: detail.companyName }); setOverrideTierVal(detail.tier); }}>
                      <Pencil className="w-3 h-3 mr-1" />Override Tier
                    </Button>
                    <div className="text-center">
                      <div className={cn("relative w-16 h-16 rounded-full flex items-center justify-center ring-4", colors.ring, colors.bg)}>
                        <span className={cn("text-xl font-bold font-mono", colors.text)}>{detail.compositeScore}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Score</p>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-5 space-y-5">
                {detail.flags?.length > 0 && (
                  <div className="space-y-1.5">
                    {detail.flags.map((flag: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-xs text-red-300">{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Score Breakdown */}
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-400" />Score Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {(detail.breakdown || []).map((b: any) => (
                      <div key={b.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">{b.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{(b.weight * 100).toFixed(0)}%</span>
                            <span className={cn("text-xs font-mono font-bold", b.rawScore >= 80 ? "text-emerald-400" : b.rawScore >= 60 ? "text-blue-400" : b.rawScore >= 40 ? "text-amber-400" : "text-red-400")}>{b.rawScore}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                          <div className={cn("h-full rounded-full", b.rawScore >= 80 ? "bg-emerald-500" : b.rawScore >= 60 ? "bg-blue-500" : b.rawScore >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${b.rawScore}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Benefits */}
                {detail.tierDefinition?.benefits && (
                  <div>
                    <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                      <Gift className={cn("w-4 h-4", colors.text)} />{detail.tierDefinition.name} Benefits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {detail.tierDefinition.benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/30">
                          <CheckCircle className={cn("w-3 h-3 mt-0.5 flex-shrink-0", colors.text)} />
                          <span className="text-xs text-slate-300">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Key Metrics */}
                {detail.tierDefinition && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Fee Discount</p>
                      <p className={cn("text-lg font-bold font-mono", colors.text)}>{detail.tierDefinition.platformFeeDiscount}%</p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Dispatch Boost</p>
                      <p className={cn("text-lg font-bold font-mono", colors.text)}>+{detail.tierDefinition.priorityMatchBoost}</p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Analytics</p>
                      <p className="text-sm font-semibold text-white capitalize">{detail.tierDefinition.analyticsAccess}</p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Load Access</p>
                      <p className="text-sm font-semibold text-white capitalize">{detail.tierDefinition.loadAccessTier}</p>
                    </div>
                  </div>
                )}
                {/* Promotion Path */}
                {detail.promotionPath && (
                  <div className={cn("p-4 rounded-xl border", colors.border, "bg-gradient-to-r", TIER_GRADIENTS[detail.tier])}>
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUpRight className={cn("w-4 h-4", colors.text)} />
                      <span className="text-xs font-semibold text-white">Path to {detail.promotionPath.nextTier}</span>
                      <Badge variant="outline" className={cn("text-xs", colors.border, colors.text)}>+{detail.promotionPath.pointsNeeded} pts needed</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {detail.promotionPath.suggestions.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Target className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {!detail && !detailQuery.isLoading && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Carrier not found or no data available</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
