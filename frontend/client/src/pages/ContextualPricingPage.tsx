/**
 * CONTEXTUAL INTELLIGENCE LAYER FOR DYNAMIC PRICING PAGE (Task 13.1)
 * Real-time contextual signals, lane intelligence, and enriched pricing.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Zap, TrendingUp, TrendingDown, Cloud, Truck, Calendar,
  Shield, Fuel, Users, BarChart3, AlertTriangle, ArrowRight,
  DollarSign, Activity, Target, Clock, Layers, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "pricing" | "signals" | "hotlanes";

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  weather: <Cloud className="w-3.5 h-3.5" />, capacity: <Truck className="w-3.5 h-3.5" />,
  event: <Calendar className="w-3.5 h-3.5" />, regulatory: <Shield className="w-3.5 h-3.5" />,
  fuel: <Fuel className="w-3.5 h-3.5" />, competitor: <Users className="w-3.5 h-3.5" />,
  pattern: <Activity className="w-3.5 h-3.5" />,
};

const SIGNAL_COLORS: Record<string, string> = {
  weather: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  capacity: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  event: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  regulatory: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  fuel: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  competitor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  pattern: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const STRENGTH_COLORS: Record<string, string> = {
  low: "text-slate-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-500",
};

const PHASE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  buyers: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Buyer's Market" },
  balanced: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Balanced" },
  sellers: { color: "text-orange-400", bg: "bg-orange-500/10", label: "Seller's Market" },
  disrupted: { color: "text-red-500", bg: "bg-red-500/10", label: "Disrupted" },
};

export default function ContextualPricingPage() {
  const [tab, setTab] = useState<Tab>("pricing");
  const [originState, setOriginState] = useState("TX");
  const [destState, setDestState] = useState("LA");
  const [distance, setDistance] = useState(350);

  const priceQuery = (trpc as any).contextualPricing?.getContextualPrice?.useQuery?.(
    { originState: originState.toUpperCase(), destState: destState.toUpperCase(), distance },
    { enabled: originState.length === 2 && destState.length === 2 && distance > 0 }
  ) || { data: null, isLoading: false };

  const laneQuery = (trpc as any).contextualPricing?.getLaneIntelligence?.useQuery?.(
    { originState: originState.toUpperCase(), destState: destState.toUpperCase(), distance },
    { enabled: originState.length === 2 && destState.length === 2 && distance > 0 }
  ) || { data: null };

  const hotLanesQuery = (trpc as any).contextualPricing?.getHotLanes?.useQuery?.({ limit: 12 }) || { data: null };

  const price = priceQuery.data;
  const lane = laneQuery.data;
  const hotLanes = hotLanesQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Contextual Pricing Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-enriched dynamic pricing with real-time market signals</p>
        </div>
        <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400"><Zap className="w-3 h-3 mr-0.5" />Live Signals</Badge>
      </div>

      {/* Lane Input */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Globe className="w-4 h-4 text-slate-500" />
              <Input placeholder="Origin State" value={originState} onChange={e => setOriginState(e.target.value.toUpperCase().slice(0, 2))} className="w-20 bg-slate-900/50 border-slate-700 text-sm text-center" />
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <Input placeholder="Dest State" value={destState} onChange={e => setDestState(e.target.value.toUpperCase().slice(0, 2))} className="w-20 bg-slate-900/50 border-slate-700 text-sm text-center" />
              <Input type="number" placeholder="Miles" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-24 bg-slate-900/50 border-slate-700 text-sm text-center" />
              <span className="text-[10px] text-slate-500">miles</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "pricing" as Tab, icon: <DollarSign className="w-3.5 h-3.5 mr-1" />, label: "Smart Pricing", color: "bg-amber-600" },
          { id: "signals" as Tab, icon: <Activity className="w-3.5 h-3.5 mr-1" />, label: "Active Signals", color: "bg-blue-600" },
          { id: "hotlanes" as Tab, icon: <BarChart3 className="w-3.5 h-3.5 mr-1" />, label: "Hot Lanes", color: "bg-red-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-[11px]", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {priceQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Smart Pricing Tab ── */}
      {tab === "pricing" && price && (
        <div className="space-y-4">
          {/* Main Rate Card */}
          <Card className={cn("rounded-xl border", PHASE_CONFIG[price.marketPhase]?.bg, `border-${PHASE_CONFIG[price.marketPhase]?.color.replace("text-", "")}/30`)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Contextual Rate</p>
                  <p className="text-3xl font-bold font-mono text-white">${price.contextualRate.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">${(price.contextualRate / Math.max(distance, 1)).toFixed(2)}/mi</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={cn("text-[8px] mb-1", PHASE_CONFIG[price.marketPhase]?.color)}>
                    {PHASE_CONFIG[price.marketPhase]?.label}
                  </Badge>
                  <div className="flex items-center gap-1 justify-end">
                    {price.adjustmentPct > 0
                      ? <TrendingUp className="w-4 h-4 text-red-400" />
                      : price.adjustmentPct < 0
                        ? <TrendingDown className="w-4 h-4 text-emerald-400" />
                        : <Target className="w-4 h-4 text-blue-400" />
                    }
                    <span className={cn("text-lg font-bold font-mono", price.adjustmentPct > 0 ? "text-red-400" : price.adjustmentPct < 0 ? "text-emerald-400" : "text-blue-400")}>
                      {price.adjustmentPct > 0 ? "+" : ""}{price.adjustmentPct}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500">vs base ${price.baseRate.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-300 italic mb-3">"{price.recommendation}"</p>

              <div className="flex items-center gap-3 text-[9px]">
                <span className="text-slate-500">Confidence: <span className="text-white font-mono">{price.confidenceLevel}%</span></span>
                <span className="text-slate-500">Signals: <span className="text-amber-400 font-mono">{price.signals.length}</span></span>
                <span className="text-slate-500">Valid until: <span className="text-white">{new Date(price.validUntil).toLocaleTimeString()}</span></span>
              </div>
            </CardContent>
          </Card>

          {/* Rate Breakdown */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Rate Breakdown</CardTitle></CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-1.5">
                {[
                  { label: "Base Line Haul", value: price.rateBreakdown.baseLineHaul, color: "text-white" },
                  { label: "Weather Adjustment", value: price.rateBreakdown.weatherAdjustment, color: "text-blue-400" },
                  { label: "Capacity Adjustment", value: price.rateBreakdown.capacityAdjustment, color: "text-orange-400" },
                  { label: "Event Adjustment", value: price.rateBreakdown.eventAdjustment, color: "text-purple-400" },
                  { label: "Regulatory Adjustment", value: price.rateBreakdown.regulatoryAdjustment, color: "text-cyan-400" },
                  { label: "Fuel Adjustment", value: price.rateBreakdown.fuelAdjustment, color: "text-amber-400" },
                  { label: "Pattern Adjustment", value: price.rateBreakdown.patternAdjustment, color: "text-slate-400" },
                ].filter(r => r.value !== 0 || r.label === "Base Line Haul").map(row => (
                  <div key={row.label} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/20">
                    <span className="text-[10px] text-slate-400">{row.label}</span>
                    <span className={cn("text-[11px] font-mono font-bold", row.color)}>
                      {row.value > 0 ? "+" : ""}{row.value === 0 && row.label !== "Base Line Haul" ? "—" : `$${row.value.toLocaleString()}`}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-semibold text-amber-400">Contextual Total</span>
                  <span className="text-sm font-bold font-mono text-amber-400">${price.contextualRate.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lane Intelligence */}
          {lane && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Lane Intelligence: {lane.lane}</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {[
                    { label: "Spot Rate", value: `$${lane.currentSpotRate.toLocaleString()}`, color: "text-white" },
                    { label: "W/W Change", value: `${lane.weekOverWeekChange > 0 ? "+" : ""}${lane.weekOverWeekChange}%`, color: lane.weekOverWeekChange > 0 ? "text-red-400" : "text-emerald-400" },
                    { label: "Truck:Load", value: `${lane.truckToLoadRatio}:1`, color: lane.truckToLoadRatio < 2.5 ? "text-red-400" : "text-emerald-400" },
                    { label: "Volatility", value: `${lane.volatilityIndex}`, color: lane.volatilityIndex > 6 ? "text-red-400" : "text-emerald-400" },
                  ].map(kpi => (
                    <div key={kpi.label} className="p-2 rounded-lg bg-slate-900/30 text-center">
                      <p className={cn("text-sm font-bold font-mono", kpi.color)}>{kpi.value}</p>
                      <p className="text-[8px] text-slate-500">{kpi.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/20">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-300">{lane.bestTimeToBook}</span>
                  <Badge variant="outline" className={cn("text-[7px] ml-auto", lane.forecastDirection === "rising" ? "text-red-400 border-red-500/30" : lane.forecastDirection === "falling" ? "text-emerald-400 border-emerald-500/30" : "text-blue-400 border-blue-500/30")}>
                    {lane.forecastDirection === "rising" ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : lane.forecastDirection === "falling" ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : <Target className="w-2.5 h-2.5 mr-0.5" />}
                    {lane.forecastDirection}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Active Signals Tab ── */}
      {tab === "signals" && price && (
        <div className="space-y-2">
          {price.signals.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Active Signals</p>
                <p className="text-[10px] text-slate-500">Market conditions are stable for this lane</p>
              </CardContent>
            </Card>
          )}
          {price.signals.map((signal: any) => {
            const sigColor = SIGNAL_COLORS[signal.category] || SIGNAL_COLORS.pattern;
            return (
              <Card key={signal.id} className={cn("rounded-xl border", sigColor)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", sigColor)}>
                      {SIGNAL_ICONS[signal.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-white">{signal.name}</span>
                        <Badge variant="outline" className={cn("text-[7px]", STRENGTH_COLORS[signal.strength])}>{signal.strength}</Badge>
                        <Badge variant="outline" className="text-[7px] text-slate-400">{signal.category}</Badge>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{signal.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[8px]">
                        <span className="text-slate-500">Source: {signal.source}</span>
                        <span className="text-slate-500">Confidence: {signal.confidence}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold font-mono", signal.impact > 0 ? "text-red-400" : "text-emerald-400")}>
                        {signal.impact > 0 ? "+" : ""}{signal.impact}%
                      </p>
                      <p className="text-[8px] text-slate-500">rate impact</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Hot Lanes Tab ── */}
      {tab === "hotlanes" && (
        <div className="space-y-2">
          {hotLanes.map((hl: any, i: number) => {
            const phCfg = PHASE_CONFIG[hl.marketPhase] || PHASE_CONFIG.balanced;
            return (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold", i < 3 ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-400")}>
                        #{i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold font-mono text-white">{hl.lane}</span>
                          <Badge variant="outline" className={cn("text-[7px]", phCfg.color)}>{phCfg.label}</Badge>
                        </div>
                        <p className="text-[9px] text-slate-500">{hl.signals} active signals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500">Spot Rate</p>
                        <p className="text-[11px] font-mono text-white">${hl.spotRate.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold font-mono", hl.adjustment > 0 ? "text-red-400" : "text-emerald-400")}>
                          {hl.adjustment > 0 ? "+" : ""}{hl.adjustment}%
                        </p>
                        <p className="text-[8px] text-slate-500">context adj</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
