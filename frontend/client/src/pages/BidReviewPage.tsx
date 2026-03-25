/**
 * BID REVIEW & AWARD PROCESS PAGE (GAP-062 Task 11.2)
 * Side-by-side bid comparison, counter-offers, awards, and analytics.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Trophy, ArrowRight, DollarSign, Users, Shield,
  Clock, TrendingDown, TrendingUp, CheckCircle, XCircle,
  MessageSquare, Award, Target, Layers, Truck, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "comparison" | "counters" | "awards" | "analytics";

const TIER_COLORS: Record<string, string> = {
  Gold: "text-amber-400 border-amber-500/30", Silver: "text-slate-300 border-slate-400/30",
  Bronze: "text-orange-400 border-orange-500/30", Standard: "text-slate-500 border-slate-600/30",
};

export default function BidReviewPage() {
  const [tab, setTab] = useState<Tab>("comparison");
  const rfpId = "RFP-001"; // Default to first published RFP

  const comparisonsQuery = (trpc as any).bidReview?.getBidComparisons?.useQuery?.({ rfpId }) || { data: null, isLoading: false };
  const countersQuery = (trpc as any).bidReview?.getCounterOffers?.useQuery?.({ rfpId }) || { data: null };
  const awardsQuery = (trpc as any).bidReview?.getAwards?.useQuery?.({ rfpId }) || { data: null };
  const analyticsQuery = (trpc as any).bidReview?.getAnalytics?.useQuery?.({ rfpId }) || { data: null };

  const comparisons = comparisonsQuery.data || [];
  const counters = countersQuery.data || [];
  const awards = awardsQuery.data || [];
  const analytics = analyticsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Bid Review & Awards
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compare bids, negotiate, and award lanes</p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">{rfpId}</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "comparison" as Tab, icon: <Layers className="w-3.5 h-3.5 mr-1" />, label: "Comparison", color: "bg-blue-600" },
          { id: "counters" as Tab, icon: <MessageSquare className="w-3.5 h-3.5 mr-1" />, label: "Counter-Offers", color: "bg-orange-600" },
          { id: "awards" as Tab, icon: <Trophy className="w-3.5 h-3.5 mr-1" />, label: "Awards", color: "bg-emerald-600" },
          { id: "analytics" as Tab, icon: <BarChart3 className="w-3.5 h-3.5 mr-1" />, label: "Analytics", color: "bg-purple-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {comparisonsQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Comparison Tab ── */}
      {tab === "comparison" && comparisons.length > 0 && (
        <div className="space-y-4">
          {comparisons.map((comp: any) => (
            <Card key={comp.laneId} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />{comp.laneLabel}
                    <Badge variant="outline" className="text-xs text-slate-400">{comp.laneId}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">Target: <span className="text-emerald-400 font-mono">${comp.targetRate?.toLocaleString()}</span></span>
                    <span className="text-slate-500">Avg: <span className="text-white font-mono">${comp.averageBid?.toLocaleString()}</span></span>
                    <span className="text-slate-500">Spread: <span className="text-amber-400 font-mono">{comp.spreadPct}%</span></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  {comp.bids.map((bid: any) => {
                    const isOver = bid.deltaPct > 0;
                    return (
                      <div key={bid.carrierId} className={cn("flex items-center gap-3 p-2 rounded-lg", bid.isLowest ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-900/20")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", bid.rank === 1 ? "bg-emerald-500/20 text-emerald-400" : bid.rank === 2 ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400")}>
                          #{bid.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{bid.carrierName}</span>
                            <Badge variant="outline" className={cn("text-xs", TIER_COLORS[bid.carrierTier])}>{bid.carrierTier}</Badge>
                            {bid.isLowest && <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Lowest</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-400">{bid.transitDays}d transit</span>
                          <span className="text-slate-400">{bid.capacityPerWeek}/wk</span>
                          <span className={cn("font-mono font-bold", isOver ? "text-red-400" : "text-emerald-400")}>
                            {isOver ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {isOver ? "+" : ""}{bid.deltaPct}%
                          </span>
                          <span className="text-lg font-bold font-mono text-white">${bid.bidRate.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Counter-Offers Tab ── */}
      {tab === "counters" && (
        <div className="space-y-3">
          {counters.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Counter-Offers</p>
                <p className="text-xs text-slate-500">Use the comparison tab to identify bids and send counter-offers</p>
              </CardContent>
            </Card>
          )}
          {counters.map((co: any) => {
            const isPending = co.status === "pending";
            const isAccepted = co.status === "accepted";
            return (
              <Card key={co.id} className={cn("rounded-xl border", isAccepted ? "border-emerald-500/20 bg-emerald-500/5" : isPending ? "border-orange-500/20 bg-orange-500/5" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-white">{co.carrierName}</span>
                      <Badge variant="outline" className="text-xs text-slate-400">{co.laneId}</Badge>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", isAccepted ? "text-emerald-400 border-emerald-500/30" : isPending ? "text-orange-400 border-orange-500/30" : "text-red-400 border-red-500/30")}>
                      {isAccepted ? <CheckCircle className="w-3 h-3 mr-0.5" /> : isPending ? <Clock className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                      {co.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                      <p className="text-xs text-slate-500">Original Bid</p>
                      <p className="text-sm font-bold font-mono text-red-400">${co.originalRate.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-center"><ArrowRight className="w-4 h-4 text-slate-500" /></div>
                    <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                      <p className="text-xs text-slate-500">Counter Rate</p>
                      <p className="text-sm font-bold font-mono text-emerald-400">${co.counterRate.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic">"{co.counterMessage}"</p>
                  {co.carrierResponse && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-emerald-400 font-semibold">Carrier Response:</p>
                      <p className="text-xs text-slate-300">"{co.carrierResponse}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Awards Tab ── */}
      {tab === "awards" && (
        <div className="space-y-3">
          {awards.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Awards Yet</p>
                <p className="text-xs text-slate-500">Review bids and score carriers to make award decisions</p>
              </CardContent>
            </Card>
          )}
          {awards.map((award: any) => (
            <Card key={`${award.laneId}-${award.carrierId}`} className="bg-emerald-500/5 border-emerald-500/20 rounded-xl border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">{award.carrierName}</span>
                    <Badge variant="outline" className={cn("text-xs", TIER_COLORS[award.carrierTier])}>{award.carrierTier}</Badge>
                    <Badge variant="outline" className="text-xs text-slate-400">{award.laneId}</Badge>
                  </div>
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle className="w-3 h-3 mr-0.5" />Awarded
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Awarded Rate</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">${award.awardedRate.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Annual Value</p>
                    <p className="text-xs font-bold font-mono text-white">${(award.annualValue / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Savings vs Target</p>
                    <p className="text-xs font-bold font-mono text-green-400">${award.savingsVsTarget}/load</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-xs text-slate-500">Contract</p>
                    <p className="text-xs font-mono text-white">{award.contractStartDate}</p>
                  </div>
                </div>
                {award.notes && <p className="text-xs text-slate-500 mt-2 italic">{award.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && analytics && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Bids", value: analytics.totalBidsReceived, icon: <Users className="w-4 h-4 text-blue-400" />, color: "text-white" },
              { label: "Avg vs Target", value: `${analytics.avgBidVsTarget > 0 ? "+" : ""}${analytics.avgBidVsTarget}%`, icon: <Target className="w-4 h-4 text-amber-400" />, color: analytics.avgBidVsTarget > 0 ? "text-red-400" : "text-emerald-400" },
              { label: "Annual Value", value: `$${(analytics.totalAnnualValue / 1000000).toFixed(1)}M`, icon: <DollarSign className="w-4 h-4 text-emerald-400" />, color: "text-emerald-400" },
              { label: "Projected Savings", value: `$${analytics.projectedSavings.toLocaleString()}/yr`, icon: <TrendingDown className="w-4 h-4 text-green-400" />, color: "text-green-400" },
            ].map(kpi => (
              <Card key={kpi.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <div className="flex justify-center mb-1">{kpi.icon}</div>
                  <p className={cn("text-lg font-bold font-mono", kpi.color)}>{kpi.value}</p>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coverage & Negotiation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Lane Coverage</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-emerald-400">{analytics.lanesCovered}</p>
                    <p className="text-xs text-slate-500">Covered</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-red-400">{analytics.lanesUncovered}</p>
                    <p className="text-xs text-slate-500">Uncovered</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-amber-400">{analytics.negotiationSuccessRate}%</p>
                    <p className="text-xs text-slate-500">Negotiation Win</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Bids by Carrier Tier</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  {analytics.bidsByTier.map((t: any) => (
                    <div key={t.tier} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/20">
                      <div className="flex items-center gap-2">
                        <Star className={cn("w-3.5 h-3.5", t.tier === "Gold" ? "text-amber-400" : t.tier === "Silver" ? "text-slate-300" : "text-orange-400")} />
                        <span className="text-xs text-white">{t.tier}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">{t.count} bids</span>
                        <span className="text-white font-mono font-bold">${t.avgRate.toLocaleString()} avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
