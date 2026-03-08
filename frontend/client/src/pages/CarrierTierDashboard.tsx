/**
 * CARRIER TIER DASHBOARD (GAP-063)
 * Gold / Silver / Bronze carrier tier management page.
 * Shows tier status, score breakdown, promotion path, benefits, and distribution.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Crown, Award, Medal, Truck, Search, TrendingUp, Shield,
  Star, Zap, ChevronRight, Target, BarChart3, Gift,
  AlertTriangle, CheckCircle, ArrowUpRight, Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CarrierTierBadge from "@/components/carrier/CarrierTierBadge";

const TIER_ICONS: Record<string, React.ReactNode> = {
  gold: <Crown className="w-6 h-6" />,
  silver: <Award className="w-6 h-6" />,
  bronze: <Medal className="w-6 h-6" />,
  standard: <Truck className="w-6 h-6" />,
};

const TIER_GRADIENTS: Record<string, string> = {
  gold: "from-yellow-500/20 via-amber-500/10 to-yellow-600/20",
  silver: "from-slate-300/20 via-slate-400/10 to-slate-300/20",
  bronze: "from-orange-500/20 via-amber-600/10 to-orange-500/20",
  standard: "from-slate-600/20 via-slate-700/10 to-slate-600/20",
};

const TIER_COLORS: Record<string, { text: string; border: string; bg: string; ring: string }> = {
  gold: { text: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", ring: "ring-yellow-500/30" },
  silver: { text: "text-slate-300", border: "border-slate-400/30", bg: "bg-slate-300/10", ring: "ring-slate-400/30" },
  bronze: { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", ring: "ring-orange-500/30" },
  standard: { text: "text-slate-500", border: "border-slate-600/30", bg: "bg-slate-600/10", ring: "ring-slate-600/30" },
};

export default function CarrierTierDashboard() {
  const [carrierId, setCarrierId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");

  const tierQuery = (trpc as any).carrierTier?.getCarrierTier?.useQuery?.(
    { carrierId: carrierId! },
    { enabled: !!carrierId }
  ) || { data: null, isLoading: false };

  const tierDefsQuery = (trpc as any).carrierTier?.getTierDefinitions?.useQuery?.() || { data: null };
  const distributionQuery = (trpc as any).carrierTier?.getTierDistribution?.useQuery?.() || { data: null };

  const tier = tierQuery.data;
  const tierDefs = tierDefsQuery.data || [];
  const dist = distributionQuery.data;

  const colors = tier ? TIER_COLORS[tier.tier] : TIER_COLORS.standard;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-slate-300 to-orange-400 bg-clip-text text-transparent">
            Carrier Tier System
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gold / Silver / Bronze performance classification</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter Carrier ID..."
          type="number"
          value={searchId}
          onChange={(e: any) => setSearchId(e.target.value)}
          className="bg-slate-900/50 border-slate-700 text-white max-w-xs"
        />
        <Button
          onClick={() => setCarrierId(parseInt(searchId))}
          disabled={!searchId}
          className="bg-gradient-to-r from-yellow-500 to-amber-600"
        >
          <Search className="w-4 h-4 mr-2" />Lookup Tier
        </Button>
      </div>

      {/* Tier Definitions Overview */}
      {!tier && !tierQuery.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["gold", "silver", "bronze", "standard"].map(t => {
            const def = tierDefs.find((d: any) => d.id === t);
            const tc = TIER_COLORS[t];
            return (
              <Card key={t} className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden")}>
                <div className={cn("bg-gradient-to-r px-4 py-3", TIER_GRADIENTS[t])}>
                  <div className="flex items-center gap-2">
                    <span className={tc.text}>{TIER_ICONS[t]}</span>
                    <span className={cn("text-sm font-bold", tc.text)}>{def?.name || `${t.charAt(0).toUpperCase() + t.slice(1)} Partner`}</span>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Score Range</span>
                    <span className={cn("text-xs font-mono font-bold", tc.text)}>
                      {def?.minScore || 0}–{def?.maxScore || 100}
                    </span>
                  </div>
                  {def?.benefits?.slice(0, 3).map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle className={cn("w-3 h-3 mt-0.5 flex-shrink-0", tc.text)} />
                      <span className="text-[10px] text-slate-400">{b}</span>
                    </div>
                  ))}
                  {def?.benefits?.length > 3 && (
                    <span className="text-[9px] text-slate-600">+{def.benefits.length - 3} more benefits</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Distribution Card */}
      {dist && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { tier: "gold", count: dist.gold, icon: <Crown className="w-4 h-4" />, color: TIER_COLORS.gold },
                { tier: "silver", count: dist.silver, icon: <Award className="w-4 h-4" />, color: TIER_COLORS.silver },
                { tier: "bronze", count: dist.bronze, icon: <Medal className="w-4 h-4" />, color: TIER_COLORS.bronze },
                { tier: "standard", count: dist.standard, icon: <Truck className="w-4 h-4" />, color: TIER_COLORS.standard },
              ].map(d => {
                const pct = dist.total > 0 ? Math.round((d.count / dist.total) * 100) : 0;
                return (
                  <div key={d.tier} className={cn("p-3 rounded-xl border", d.color.border, d.color.bg)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={d.color.text}>{d.icon}</span>
                      <span className={cn("text-lg font-bold font-mono", d.color.text)}>{d.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 capitalize">{d.tier}</span>
                      <span className="text-[10px] text-slate-500">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className={cn("h-full rounded-full", d.color.bg)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {tierQuery.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full bg-slate-700/30 rounded-xl" />
          <Skeleton className="h-60 w-full bg-slate-700/30 rounded-xl" />
        </div>
      )}

      {/* Tier Result */}
      {tier && (
        <>
          {/* Main Tier Card */}
          <Card className={cn("bg-slate-800/50 rounded-xl overflow-hidden", colors.border, "border")}>
            <div className={cn("bg-gradient-to-r px-6 py-5", TIER_GRADIENTS[tier.tier])}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", colors.bg, "ring-2", colors.ring)}>
                    <span className={colors.text}>{TIER_ICONS[tier.tier]}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{tier.companyName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CarrierTierBadge tier={tier.tier} score={tier.compositeScore} size="md" showScore />
                      {tier.dotNumber && (
                        <span className="text-[10px] text-slate-500">DOT# {tier.dotNumber}</span>
                      )}
                      {tier.mcNumber && (
                        <span className="text-[10px] text-slate-500">MC# {tier.mcNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Ring */}
                <div className="text-center">
                  <div className={cn("relative w-20 h-20 rounded-full flex items-center justify-center ring-4", colors.ring, colors.bg)}>
                    <span className={cn("text-2xl font-bold font-mono", colors.text)}>{tier.compositeScore}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Composite Score</p>
                </div>
              </div>
            </div>

            <CardContent className="p-5 space-y-5">
              {/* Flags */}
              {tier.flags.length > 0 && (
                <div className="space-y-1.5">
                  {tier.flags.map((flag: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-[10px] text-red-300">{flag}</span>
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
                  {(tier.breakdown || []).map((b: any) => (
                    <div key={b.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">{b.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">×{(b.weight * 100).toFixed(0)}%</span>
                          <span className={cn("text-[10px] font-mono font-bold",
                            b.rawScore >= 80 ? "text-emerald-400" :
                            b.rawScore >= 60 ? "text-blue-400" :
                            b.rawScore >= 40 ? "text-amber-400" : "text-red-400"
                          )}>
                            {b.rawScore}
                          </span>
                          <span className="text-[9px] text-slate-600">→ +{b.weightedScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            b.rawScore >= 80 ? "bg-emerald-500" :
                            b.rawScore >= 60 ? "bg-blue-500" :
                            b.rawScore >= 40 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${b.rawScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <Gift className={cn("w-4 h-4", colors.text)} />Your {tier.tierDefinition.name} Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tier.tierDefinition.benefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/30">
                      <CheckCircle className={cn("w-3 h-3 mt-0.5 flex-shrink-0", colors.text)} />
                      <span className="text-[10px] text-slate-300">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Fee Discount</p>
                  <p className={cn("text-lg font-bold font-mono", colors.text)}>{tier.tierDefinition.platformFeeDiscount}%</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Dispatch Boost</p>
                  <p className={cn("text-lg font-bold font-mono", colors.text)}>+{tier.tierDefinition.priorityMatchBoost}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Analytics</p>
                  <p className="text-sm font-semibold text-white capitalize">{tier.tierDefinition.analyticsAccess}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Load Access</p>
                  <p className="text-sm font-semibold text-white capitalize">{tier.tierDefinition.loadAccessTier}</p>
                </div>
              </div>

              {/* Promotion Path */}
              {tier.promotionPath && (
                <div className={cn("p-4 rounded-xl border", colors.border, "bg-gradient-to-r", TIER_GRADIENTS[tier.tier])}>
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpRight className={cn("w-4 h-4", colors.text)} />
                    <span className="text-xs font-semibold text-white">Path to {tier.promotionPath.nextTier}</span>
                    <Badge variant="outline" className={cn("text-[9px]", colors.border, colors.text)}>
                      +{tier.promotionPath.pointsNeeded} points needed
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {tier.promotionPath.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Target className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] text-slate-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
