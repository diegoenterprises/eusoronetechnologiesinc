/**
 * COMPETITIVE INTELLIGENCE & GROWTH PLANNING DASHBOARD
 * Strategic intelligence: market overview, competitor analysis, lane opportunities,
 * customer acquisition/churn, fleet expansion modeling, territory analysis,
 * growth scorecard, SWOT analysis, and AI-generated recommendations.
 * Dark theme with purple/indigo accents | shadcn components | 100% dynamic.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TrendingUp, TrendingDown, BarChart3, Target, Users, MapPin,
  Shield, Crosshair, Globe, Truck, DollarSign, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ChevronRight, Lightbulb, Layers,
  Activity, PieChart, Radar, Zap, Building2, Scale, FileText,
  Calculator, Eye, Star, UserMinus, ShoppingCart, Award, Gauge,
  ArrowRight, CheckCircle, XCircle, Clock, Info,
} from "lucide-react";

// ─── Tab Definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Market Overview", icon: Globe },
  { id: "competitors", label: "Competitors", icon: Crosshair },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "customers", label: "Customers", icon: Users },
  { id: "fleet", label: "Fleet Planning", icon: Truck },
  { id: "territory", label: "Territory", icon: MapPin },
  { id: "scorecard", label: "Scorecard", icon: Gauge },
  { id: "strategy", label: "Strategy", icon: Lightbulb },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, style: "currency" | "number" | "percent" = "number"): string {
  if (n === undefined || n === null) return "--";
  if (style === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  if (style === "percent") return `${n.toFixed(1)}%`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function statusColor(status: string): string {
  switch (status) {
    case "on_track": case "low": case "excellent": case "go": return "text-emerald-400";
    case "at_risk": case "medium": case "good": return "text-amber-400";
    case "behind": case "high": case "critical": return "text-red-400";
    default: return "text-slate-400";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "on_track": case "low": case "go": return "bg-emerald-500/10 border-emerald-500/20";
    case "at_risk": case "medium": return "bg-amber-500/10 border-amber-500/20";
    case "behind": case "high": case "critical": return "bg-red-500/10 border-red-500/20";
    default: return "bg-slate-500/10 border-slate-500/20";
  }
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

const cardCls = "rounded-2xl border backdrop-blur-sm bg-slate-800/40 border-slate-700/40";
const titleCls = "text-sm font-semibold text-white";
const subtitleCls = "text-xs text-slate-400";
const cellCls = "p-3 rounded-xl border bg-slate-800/50 border-slate-700/30";
const accentGradient = "from-purple-500 to-indigo-500";

// ─── Skeleton Loader ────────────────────────────────────────────────────────

function SectionLoader({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-700/30" />
      ))}
    </div>
  );
}

// ─── Trend Indicator ────────────────────────────────────────────────────────

function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", positive ? "text-emerald-400" : "text-red-400")}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CompetitiveIntelligence() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [fleetTrucks, setFleetTrucks] = useState(10);
  const [fleetDrivers, setFleetDrivers] = useState(10);
  const [fleetTerminals, setFleetTerminals] = useState(0);

  // ─── tRPC Queries ─────────────────────────────────────────────────────────
  const marketQ = (trpc as any).competitiveIntel?.getMarketOverview?.useQuery?.({}) ?? { data: null, isLoading: false };
  const competitorQ = (trpc as any).competitiveIntel?.getCompetitorAnalysis?.useQuery?.({}) ?? { data: null, isLoading: false };
  const shareQ = (trpc as any).competitiveIntel?.getMarketShareEstimate?.useQuery?.() ?? { data: null, isLoading: false };
  const rateCompQ = (trpc as any).competitiveIntel?.getRateComparison?.useQuery?.({}) ?? { data: null, isLoading: false };
  const laneOppQ = (trpc as any).competitiveIntel?.getLaneOpportunities?.useQuery?.() ?? { data: null, isLoading: false };
  const pipelineQ = (trpc as any).competitiveIntel?.getCustomerAcquisitionPipeline?.useQuery?.() ?? { data: null, isLoading: false };
  const churnQ = (trpc as any).competitiveIntel?.getCustomerChurnRisk?.useQuery?.() ?? { data: null, isLoading: false };
  const clvQ = (trpc as any).competitiveIntel?.getCustomerLifetimeValue?.useQuery?.() ?? { data: null, isLoading: false };
  const fleetQ = (trpc as any).competitiveIntel?.getFleetExpansionModel?.useQuery?.({ newTrucks: fleetTrucks, newDrivers: fleetDrivers, newTerminals: fleetTerminals }) ?? { data: null, isLoading: false };
  const territoryQ = (trpc as any).competitiveIntel?.getTerritoryAnalysis?.useQuery?.() ?? { data: null, isLoading: false };
  const gapQ = (trpc as any).competitiveIntel?.getServiceGapAnalysis?.useQuery?.() ?? { data: null, isLoading: false };
  const scorecardQ = (trpc as any).competitiveIntel?.getGrowthScorecard?.useQuery?.() ?? { data: null, isLoading: false };
  const bidQ = (trpc as any).competitiveIntel?.getBidAnalytics?.useQuery?.() ?? { data: null, isLoading: false };
  const renewalQ = (trpc as any).competitiveIntel?.getContractRenewalForecast?.useQuery?.() ?? { data: null, isLoading: false };
  const benchmarkQ = (trpc as any).competitiveIntel?.getIndustryBenchmarks?.useQuery?.() ?? { data: null, isLoading: false };
  const stratQ = (trpc as any).competitiveIntel?.getStrategicRecommendations?.useQuery?.() ?? { data: null, isLoading: false };
  const swotQ = (trpc as any).competitiveIntel?.getSWOTAnalysis?.useQuery?.() ?? { data: null, isLoading: false };
  const regulatoryQ = (trpc as any).competitiveIntel?.getRegulatoryImpactForecast?.useQuery?.() ?? { data: null, isLoading: false };

  const market = marketQ.data;
  const competitors: any[] = Array.isArray(competitorQ.data) ? competitorQ.data : [];
  const share = shareQ.data;
  const rateComps: any[] = Array.isArray(rateCompQ.data) ? rateCompQ.data : [];
  const laneOpps: any[] = Array.isArray(laneOppQ.data) ? laneOppQ.data : [];
  const pipeline = pipelineQ.data;
  const churnRisks: any[] = Array.isArray(churnQ.data) ? churnQ.data : [];
  const clvData: any[] = Array.isArray(clvQ.data) ? clvQ.data : [];
  const fleetModel = fleetQ.data;
  const territories: any[] = Array.isArray(territoryQ.data) ? territoryQ.data : [];
  const serviceGaps: any[] = Array.isArray(gapQ.data) ? gapQ.data : [];
  const scorecard = scorecardQ.data;
  const bidData = bidQ.data;
  const renewals: any[] = Array.isArray(renewalQ.data) ? renewalQ.data : [];
  const benchmarks = benchmarkQ.data;
  const recommendations: any[] = Array.isArray(stratQ.data) ? stratQ.data : [];
  const swot = swotQ.data;
  const regulations: any[] = Array.isArray(regulatoryQ.data) ? regulatoryQ.data : [];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", accentGradient)}>
              <Radar className="w-6 h-6 text-white" />
            </div>
            Competitive Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">Market analysis, growth planning, and strategic intelligence</p>
        </div>
        {scorecard && (
          <div className={cn("px-5 py-3 rounded-2xl border flex items-center gap-4", cardCls)}>
            <div className="text-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{scorecard.overallScore}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Growth Score</div>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{scorecard.quarterlyGoalProgress}%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Q Goal</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg",
                "data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-700/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Market Overview Tab ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {marketQ.isLoading ? <SectionLoader rows={3} /> : market && (
            <>
              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Market Size", value: fmt(market.marketSize, "currency"), icon: DollarSign, color: "text-purple-400" },
                  { label: "Growth Rate", value: `${market.growthRate}%`, icon: TrendingUp, color: "text-emerald-400" },
                  { label: "Active Carriers", value: fmt(market.totalCarriers), icon: Truck, color: "text-indigo-400" },
                  { label: "Avg Rate/Mile", value: `$${market.avgRatePerMile}`, icon: BarChart3, color: "text-amber-400" },
                ].map((m, i) => (
                  <Card key={i} className={cardCls}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <m.icon className={cn("w-4 h-4", m.color)} />
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">Live</Badge>
                      </div>
                      <div className="text-xl font-bold text-white">{m.value}</div>
                      <div className={subtitleCls}>{m.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Market Trends */}
              <Card className={cardCls}>
                <CardContent className="p-5">
                  <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                    <Activity className="w-4 h-4 text-purple-400" />
                    Market Trends
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {(market.trends || []).map((t: any, i: number) => (
                      <div key={i} className={cellCls}>
                        <div className="flex items-center gap-2 mb-1">
                          {t.direction === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                          <span className="text-xs font-medium text-white">{t.label}</span>
                        </div>
                        <TrendBadge value={t.delta} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Share + Rate Comparison side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Market Share by Region */}
                <Card className={cardCls}>
                  <CardContent className="p-5">
                    <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                      <PieChart className="w-4 h-4 text-indigo-400" />
                      Market Share by Region
                    </h3>
                    {shareQ.isLoading ? <SectionLoader rows={3} /> : share && (
                      <div className="space-y-2">
                        {(share.byRegion || []).slice(0, 6).map((r: any, i: number) => (
                          <div key={i} className={cellCls}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-slate-300">{r.region}</span>
                              <span className="text-xs font-bold text-purple-400">{r.share}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                              <div className={cn("h-full rounded-full bg-gradient-to-r", accentGradient)} style={{ width: `${Math.min(r.share * 4, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rate Comparison */}
                <Card className={cardCls}>
                  <CardContent className="p-5">
                    <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                      <Scale className="w-4 h-4 text-amber-400" />
                      Rate Benchmarking ($/mile)
                    </h3>
                    {rateCompQ.isLoading ? <SectionLoader rows={4} /> : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {rateComps.slice(0, 8).map((r: any, i: number) => (
                          <div key={i} className={cn(cellCls, "flex items-center justify-between")}>
                            <div>
                              <div className="text-xs font-medium text-white">{r.lane}</div>
                              <div className="text-xs text-slate-500">Market: ${r.marketAvg} | Range: ${r.marketLow}-${r.marketHigh}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-white">${r.ourRate}</div>
                              <Badge variant="outline" className={cn("text-xs",
                                r.position === "competitive" ? "border-emerald-500/30 text-emerald-400" :
                                r.position === "above_market" ? "border-amber-500/30 text-amber-400" :
                                "border-blue-500/30 text-blue-400"
                              )}>
                                {r.delta > 0 ? "+" : ""}{r.delta}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {rateComps.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No rate data yet — rates populate as loads are booked</div>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Competitors Tab ──────────────────────────────────────────────── */}
        <TabsContent value="competitors" className="mt-4 space-y-4">
          {competitorQ.isLoading ? <SectionLoader rows={5} /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {competitors.map((c: any, i: number) => (
                  <Card key={i} className={cn(cardCls, "hover:border-purple-500/30 transition-colors")}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{c.name}</div>
                          <div className="text-xs text-slate-500">DOT: {c.dotNumber} | {c.mcNumber}</div>
                        </div>
                        <Badge variant="outline" className={cn("text-xs",
                          c.threatLevel === "high" ? "border-red-500/30 text-red-400" :
                          c.threatLevel === "medium" ? "border-amber-500/30 text-amber-400" :
                          "border-emerald-500/30 text-emerald-400"
                        )}>
                          {c.threatLevel} threat
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-xs font-bold text-purple-400">{fmt(c.fleetSize)}</div>
                          <div className="text-xs text-slate-500">Fleet</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-indigo-400">{fmt(c.estimatedRevenue, "currency")}</div>
                          <div className="text-xs text-slate-500">Est. Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-amber-400">{c.operatingRatio}%</div>
                          <div className="text-xs text-slate-500">OR</div>
                        </div>
                      </div>
                      <div className="border-t border-slate-700/30 pt-2">
                        <div className="text-xs text-slate-500 mb-1">Strengths</div>
                        <div className="flex flex-wrap gap-1">
                          {(c.strengths || []).slice(0, 3).map((s: string, j: number) => (
                            <Badge key={j} variant="outline" className="text-xs border-emerald-500/20 text-emerald-400">{s}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Weaknesses</div>
                        <div className="flex flex-wrap gap-1">
                          {(c.weaknesses || []).slice(0, 2).map((w: string, j: number) => (
                            <Badge key={j} variant="outline" className="text-xs border-red-500/20 text-red-400">{w}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        <MapPin className="w-3 h-3 inline mr-1" />{c.serviceArea}
                        <span className="mx-2">|</span>
                        <Shield className="w-3 h-3 inline mr-1" />{c.safetyRating}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Opportunities Tab ────────────────────────────────────────────── */}
        <TabsContent value="opportunities" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lane Opportunities */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <Target className="w-4 h-4 text-purple-400" />
                  Lane Opportunities
                </h3>
                {laneOppQ.isLoading ? <SectionLoader rows={5} /> : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {laneOpps.map((opp: any, i: number) => (
                      <div key={i} className={cn(cellCls, "flex items-center justify-between")}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{opp.lane}</span>
                            <Badge variant="outline" className={cn("text-xs",
                              opp.competitionLevel === "low" ? "border-emerald-500/30 text-emerald-400" :
                              opp.competitionLevel === "medium" ? "border-amber-500/30 text-amber-400" :
                              "border-red-500/30 text-red-400"
                            )}>
                              {opp.competitionLevel} comp.
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{opp.recommendation}</div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{opp.demandScore}</div>
                          <div className="text-xs text-slate-500">demand score</div>
                        </div>
                      </div>
                    ))}
                    {laneOpps.length === 0 && <div className="text-xs text-slate-500 text-center py-4">Analyzing lane data...</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Gaps */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Service Gap Analysis
                </h3>
                {gapQ.isLoading ? <SectionLoader rows={5} /> : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {serviceGaps.map((gap: any, i: number) => (
                      <div key={i} className={cellCls}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">{gap.capability}</span>
                          <Badge variant="outline" className={cn("text-xs",
                            gap.priority === "critical" ? "border-red-500/30 text-red-400" :
                            gap.priority === "high" ? "border-amber-500/30 text-amber-400" :
                            "border-slate-500/30 text-slate-400"
                          )}>
                            {gap.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                              <span>Current: {gap.currentCapability}%</span>
                              <span>Demand: {gap.marketDemand}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-700 overflow-hidden relative">
                              <div className="h-full rounded-full bg-indigo-600/60 absolute" style={{ width: `${gap.currentCapability}%` }} />
                              <div className="h-full rounded-full border-r-2 border-purple-400 absolute" style={{ width: `${gap.marketDemand}%` }} />
                            </div>
                          </div>
                          <div className="text-xs font-bold text-red-400 whitespace-nowrap">-{gap.gap}%</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Investment: {fmt(gap.investment, "currency")} | Timeline: {gap.timeToClose}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bid Analytics */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Bid Win/Loss Analysis
              </h3>
              {bidQ.isLoading ? <SectionLoader rows={2} /> : bidData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{bidData.totalBids}</div>
                        <div className="text-xs text-slate-500">Total Bids</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{bidData.wonBids}</div>
                        <div className="text-xs text-slate-500">Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{bidData.lostBids}</div>
                        <div className="text-xs text-slate-500">Lost</div>
                      </div>
                    </div>
                    <div className={cellCls}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{bidData.winRate}%</div>
                        <div className="text-xs text-slate-500">Win Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-300 mb-1">Loss Reasons</div>
                    {(bidData.lossReasons || []).map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                            <span>{r.reason}</span>
                            <span>{r.percentage}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full bg-red-500/60" style={{ width: `${r.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-300 mb-1">Competitive Insights</div>
                    {(bidData.competitiveInsights || []).map((insight: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-400">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Customers Tab ────────────────────────────────────────────────── */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Acquisition Funnel */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <ShoppingCart className="w-4 h-4 text-purple-400" />
                  Acquisition Funnel
                </h3>
                {pipelineQ.isLoading ? <SectionLoader rows={5} /> : pipeline && (
                  <div className="space-y-2">
                    {(pipeline.funnel || []).map((stage: any, i: number) => {
                      const widthPct = i === 0 ? 100 : (stage.count / (pipeline.funnel[0]?.count || 1)) * 100;
                      return (
                        <div key={i} className="relative">
                          <div
                            className="rounded-lg p-3 transition-all"
                            style={{
                              width: `${Math.max(widthPct, 30)}%`,
                              background: `linear-gradient(135deg, rgba(139,92,246,${0.15 + i * 0.05}) 0%, rgba(99,102,241,${0.1 + i * 0.05}) 100%)`,
                              border: "1px solid rgba(139,92,246,0.2)",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white">{stage.stage}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-purple-300">{fmt(stage.count)}</span>
                                {i > 0 && <span className="text-xs text-slate-400">{stage.conversionRate}%</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                      <span className="text-xs text-slate-400">Overall Conversion</span>
                      <span className="text-sm font-bold text-emerald-400">{pipeline.overallConversion}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className={cellCls}>
                        <div className="text-xs font-bold text-white">{pipeline.avgDealCycle} days</div>
                        <div className="text-xs text-slate-500">Avg Deal Cycle</div>
                      </div>
                      <div className={cellCls}>
                        <div className="text-xs font-bold text-white">{fmt(pipeline.pipelineValue, "currency")}</div>
                        <div className="text-xs text-slate-500">Pipeline Value</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Churn Risk Alerts */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <UserMinus className="w-4 h-4 text-red-400" />
                  Churn Risk Alerts
                  {churnRisks.length > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 text-xs">{churnRisks.length} at risk</Badge>
                  )}
                </h3>
                {churnQ.isLoading ? <SectionLoader rows={5} /> : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {churnRisks.map((c: any, i: number) => (
                      <div key={i} className={cn(cellCls, "border-l-2",
                        c.riskLevel === "critical" ? "border-l-red-500" :
                        c.riskLevel === "high" ? "border-l-amber-500" : "border-l-yellow-500"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{c.name}</span>
                          <Badge variant="outline" className={cn("text-xs",
                            c.riskLevel === "critical" ? "border-red-500/30 text-red-400" :
                            c.riskLevel === "high" ? "border-amber-500/30 text-amber-400" : "border-yellow-500/30 text-yellow-400"
                          )}>
                            {c.churnProbability}% risk
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mb-1">
                          Last load: {c.lastLoadDate} | Volume drop: {c.loadFrequencyDrop}% | At-risk revenue: {fmt(c.estimatedRevenueLoss, "currency")}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-400">
                          <Lightbulb className="w-3 h-3" />
                          {c.intervention}
                        </div>
                      </div>
                    ))}
                    {churnRisks.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No churn risks detected</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Customer Lifetime Value */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <Star className="w-4 h-4 text-amber-400" />
                Customer Lifetime Value by Segment
              </h3>
              {clvQ.isLoading ? <SectionLoader rows={2} /> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {clvData.map((seg: any, i: number) => (
                    <div key={i} className={cn(cellCls, "text-center space-y-2")}>
                      <div className="text-xs font-medium text-slate-300">{seg.segment}</div>
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                        {fmt(seg.avgCLV, "currency")}
                      </div>
                      <div className="text-xs text-slate-500">Avg CLV</div>
                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/30">
                        <div>
                          <div className="text-xs font-bold text-white">{seg.customerCount}</div>
                          <div className="text-xs text-slate-500">Customers</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{seg.avgTenureMonths}mo</div>
                          <div className="text-xs text-slate-500">Avg Tenure</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-400">{seg.retentionRate}%</div>
                          <div className="text-xs text-slate-500">Retention</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Renewals */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <FileText className="w-4 h-4 text-purple-400" />
                Upcoming Contract Renewals
              </h3>
              {renewalQ.isLoading ? <SectionLoader rows={3} /> : (
                <div className="space-y-2">
                  {renewals.map((r: any, i: number) => (
                    <div key={i} className={cn(cellCls, "flex items-center justify-between")}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{r.customer}</span>
                          <Badge variant="outline" className={cn("text-xs",
                            r.daysUntilExpiry <= 30 ? "border-red-500/30 text-red-400" :
                            r.daysUntilExpiry <= 60 ? "border-amber-500/30 text-amber-400" :
                            "border-slate-500/30 text-slate-400"
                          )}>
                            {r.daysUntilExpiry}d
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {fmt(r.annualValue, "currency")}/yr | Renewal probability: {r.renewalProbability}%
                        </div>
                        {r.riskFactors.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {r.riskFactors[0]}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-xs text-indigo-400">{r.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Fleet Planning Tab ───────────────────────────────────────────── */}
        <TabsContent value="fleet" className="mt-4 space-y-4">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <Calculator className="w-4 h-4 text-purple-400" />
                Fleet Expansion ROI Calculator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={cellCls}>
                  <label className="text-xs text-slate-400 block mb-1">New Trucks</label>
                  <input
                    type="range" min="1" max="100" value={fleetTrucks}
                    onChange={e => setFleetTrucks(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="text-center text-sm font-bold text-purple-400">{fleetTrucks}</div>
                </div>
                <div className={cellCls}>
                  <label className="text-xs text-slate-400 block mb-1">New Drivers</label>
                  <input
                    type="range" min="1" max="100" value={fleetDrivers}
                    onChange={e => setFleetDrivers(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="text-center text-sm font-bold text-indigo-400">{fleetDrivers}</div>
                </div>
                <div className={cellCls}>
                  <label className="text-xs text-slate-400 block mb-1">New Terminals</label>
                  <input
                    type="range" min="0" max="10" value={fleetTerminals}
                    onChange={e => setFleetTerminals(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="text-center text-sm font-bold text-amber-400">{fleetTerminals}</div>
                </div>
              </div>

              {fleetQ.isLoading ? <SectionLoader rows={3} /> : fleetModel && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                      { label: "Capital Investment", value: fmt(fleetModel.totalCapitalInvestment, "currency"), color: "text-red-400" },
                      { label: "Monthly Revenue", value: fmt(fleetModel.monthlyProjectedRevenue, "currency"), color: "text-emerald-400" },
                      { label: "Monthly Profit", value: fmt(fleetModel.monthlyProjectedProfit, "currency"), color: "text-purple-400" },
                      { label: "Break-Even", value: `${fleetModel.breakEvenMonths} mo`, color: "text-amber-400" },
                      { label: "ROI", value: `${fleetModel.roi}%`, color: fleetModel.roi > 0 ? "text-emerald-400" : "text-red-400" },
                    ].map((m, i) => (
                      <div key={i} className={cellCls}>
                        <div className={cn("text-lg font-bold", m.color)}>{m.value}</div>
                        <div className="text-xs text-slate-500">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Projection Chart (text-based) */}
                  <div className={cellCls}>
                    <div className="text-xs font-medium text-slate-300 mb-3">Cumulative Profit Projection</div>
                    <div className="flex items-end gap-1 h-32">
                      {(fleetModel.projections || []).map((p: any, i: number) => {
                        const maxAbs = Math.max(...(fleetModel.projections || []).map((pp: any) => Math.abs(pp.cumulativeProfit)), 1);
                        const heightPct = Math.abs(p.cumulativeProfit) / maxAbs * 100;
                        const isPositive = p.cumulativeProfit >= 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div
                              className={cn("w-full rounded-t-sm", isPositive ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-gradient-to-t from-red-600 to-red-400")}
                              style={{ height: `${Math.max(heightPct, 2)}%` }}
                              title={`Month ${p.month}: ${fmt(p.cumulativeProfit, "currency")}`}
                            />
                            {i % 3 === 0 && <span className="text-xs text-slate-500 mt-1">M{p.month}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="mt-4">
                    <div className="text-xs font-medium text-slate-300 mb-2">Risk Assessment</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(fleetModel.risks || []).map((r: any, i: number) => (
                        <div key={i} className={cn(cellCls, "flex items-start gap-2")}>
                          <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0",
                            r.probability === "high" ? "text-red-400" : r.probability === "medium" ? "text-amber-400" : "text-slate-400"
                          )} />
                          <div>
                            <div className="text-xs font-medium text-white">{r.risk}</div>
                            <div className="text-xs text-slate-500">{r.impact}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Territory Tab ────────────────────────────────────────────────── */}
        <TabsContent value="territory" className="mt-4 space-y-4">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <MapPin className="w-4 h-4 text-purple-400" />
                Territory Penetration Analysis
              </h3>
              {territoryQ.isLoading ? <SectionLoader rows={6} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {territories.map((t: any, i: number) => (
                    <div key={i} className={cn(cellCls, "space-y-2")}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{t.region}</span>
                        <Badge variant="outline" className={cn("text-xs",
                          t.growthPotential === "high" ? "border-emerald-500/30 text-emerald-400" :
                          t.growthPotential === "medium" ? "border-amber-500/30 text-amber-400" :
                          "border-slate-500/30 text-slate-400"
                        )}>
                          {t.growthPotential} potential
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-xs font-bold text-purple-400">{fmt(t.loadCount)}</div>
                          <div className="text-xs text-slate-500">Loads</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-indigo-400">{fmt(t.revenue, "currency")}</div>
                          <div className="text-xs text-slate-500">Revenue</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-400">{t.penetration}%</div>
                          <div className="text-xs text-slate-500">Penetration</div>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className={cn("h-full rounded-full bg-gradient-to-r", accentGradient)} style={{ width: `${Math.min(t.penetration * 3, 100)}%` }} />
                      </div>
                      {t.topLanes && t.topLanes.length > 0 && (
                        <div className="text-xs text-slate-500">
                          Top lanes: {t.topLanes.join(", ")}
                        </div>
                      )}
                      <div className="text-xs text-indigo-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {t.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Scorecard Tab ────────────────────────────────────────────────── */}
        <TabsContent value="scorecard" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Growth KPIs */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <Gauge className="w-4 h-4 text-purple-400" />
                  Growth KPIs
                </h3>
                {scorecardQ.isLoading ? <SectionLoader rows={6} /> : scorecard && (
                  <div className="space-y-2">
                    {(scorecard.kpis || []).map((kpi: any, i: number) => {
                      const progress = kpi.target > 0 ? Math.min((kpi.actual / kpi.target) * 100, 100) : 0;
                      return (
                        <div key={i} className={cellCls}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{kpi.metric}</span>
                            <div className="flex items-center gap-2">
                              <TrendBadge value={kpi.trend} />
                              <Badge variant="outline" className={cn("text-xs",
                                kpi.status === "on_track" ? "border-emerald-500/30 text-emerald-400" :
                                kpi.status === "at_risk" ? "border-amber-500/30 text-amber-400" :
                                "border-red-500/30 text-red-400"
                              )}>
                                {kpi.status === "on_track" ? "On Track" : kpi.status === "at_risk" ? "At Risk" : kpi.status === "behind" ? "Behind" : kpi.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Actual: {kpi.unit === "USD" ? fmt(kpi.actual, "currency") : `${kpi.actual} ${kpi.unit}`}</span>
                            <span>Target: {kpi.unit === "USD" ? fmt(kpi.target, "currency") : `${kpi.target} ${kpi.unit}`}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all",
                              kpi.status === "on_track" ? "bg-emerald-500" : kpi.status === "at_risk" ? "bg-amber-500" : "bg-red-500"
                            )} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Industry Benchmarks */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                  <Award className="w-4 h-4 text-indigo-400" />
                  Industry Benchmarks
                </h3>
                {benchmarkQ.isLoading ? <SectionLoader rows={6} /> : benchmarks && (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {(benchmarks.benchmarks || []).map((b: any, i: number) => (
                      <div key={i} className={cellCls}>
                        <div className="text-xs font-medium text-white mb-1">{b.metric}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-xs text-emerald-400 font-bold">{b.top25}{b.unit === "%" ? "%" : ""}</div>
                            <div className="text-xs text-slate-500">Top 25%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-white font-bold">{b.industryAvg}{b.unit === "%" ? "%" : ""}</div>
                            <div className="text-xs text-slate-500">Average</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-red-400 font-bold">{b.bottom25}{b.unit === "%" ? "%" : ""}</div>
                            <div className="text-xs text-slate-500">Bottom 25%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {benchmarks.source && (
                      <div className="text-xs text-slate-600 text-center pt-2">{benchmarks.source}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Strategy Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="strategy" className="mt-4 space-y-4">
          {/* SWOT Analysis */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <Radar className="w-4 h-4 text-purple-400" />
                SWOT Analysis
              </h3>
              {swotQ.isLoading ? <SectionLoader rows={4} /> : swot && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className={cn("rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5")}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Strengths</span>
                    </div>
                    <div className="space-y-2">
                      {(swot.strengths || []).map((s: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-white">{s.item}</div>
                            <div className="text-xs text-slate-400">{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className={cn("rounded-xl p-4 border border-red-500/20 bg-red-500/5")}>
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">Weaknesses</span>
                    </div>
                    <div className="space-y-2">
                      {(swot.weaknesses || []).map((w: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-white">{w.item}</div>
                            <div className="text-xs text-slate-400">{w.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className={cn("rounded-xl p-4 border border-purple-500/20 bg-purple-500/5")}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-400">Opportunities</span>
                    </div>
                    <div className="space-y-2">
                      {(swot.opportunities || []).map((o: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-white">{o.item}</div>
                            <div className="text-xs text-slate-400">{o.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threats */}
                  <div className={cn("rounded-xl p-4 border border-amber-500/20 bg-amber-500/5")}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">Threats</span>
                    </div>
                    <div className="space-y-2">
                      {(swot.threats || []).map((t: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-white">{t.item}</div>
                            <div className="text-xs text-slate-400">{t.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Recommendations */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <Lightbulb className="w-4 h-4 text-amber-400" />
                AI-Generated Strategic Recommendations
              </h3>
              {stratQ.isLoading ? <SectionLoader rows={4} /> : (
                <div className="space-y-3">
                  {recommendations.map((rec: any, i: number) => (
                    <div key={i} className={cn(cellCls, "space-y-2")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs",
                            rec.priority === "critical" ? "border-red-500/30 text-red-400" :
                            rec.priority === "high" ? "border-amber-500/30 text-amber-400" :
                            "border-slate-500/30 text-slate-400"
                          )}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">{rec.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="text-xs text-slate-500">Confidence:</div>
                          <div className={cn("text-xs font-bold", rec.confidence > 80 ? "text-emerald-400" : rec.confidence > 60 ? "text-amber-400" : "text-slate-400")}>
                            {rec.confidence}%
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-white">{rec.title}</div>
                      <div className="text-xs text-slate-400">{rec.description}</div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/30">
                        <div>
                          <div className="text-xs text-slate-500">Impact</div>
                          <div className="text-xs font-medium text-emerald-400">{rec.expectedImpact}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Investment</div>
                          <div className="text-xs font-medium text-amber-400">{rec.investmentRequired}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Timeline</div>
                          <div className="text-xs font-medium text-indigo-400">{rec.timeframe}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regulatory Impact */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(titleCls, "mb-4 flex items-center gap-2")}>
                <Shield className="w-4 h-4 text-indigo-400" />
                Regulatory Impact Forecast
              </h3>
              {regulatoryQ.isLoading ? <SectionLoader rows={3} /> : (
                <div className="space-y-3">
                  {regulations.map((reg: any, i: number) => (
                    <div key={i} className={cn(cellCls, "border-l-2",
                      reg.severity === "high" ? "border-l-red-500" :
                      reg.severity === "medium" ? "border-l-amber-500" : "border-l-emerald-500"
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-white">{reg.regulation}</div>
                          <div className="text-xs text-slate-500">Effective: {reg.effectiveDate} | Status: {reg.status}</div>
                        </div>
                        <Badge variant="outline" className={cn("text-xs",
                          reg.severity === "high" ? "border-red-500/30 text-red-400" :
                          reg.severity === "medium" ? "border-amber-500/30 text-amber-400" :
                          "border-emerald-500/30 text-emerald-400"
                        )}>
                          {reg.severity} impact
                        </Badge>
                      </div>
                      <div className="flex gap-4 mb-2">
                        <div>
                          <div className="text-xs text-slate-500">Annual Cost Impact</div>
                          <div className={cn("text-xs font-bold", reg.financialImpact.annualCost >= 0 ? "text-red-400" : "text-emerald-400")}>
                            {reg.financialImpact.annualCost >= 0 ? "+" : ""}{fmt(reg.financialImpact.annualCost, "currency")}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Capital Required</div>
                          <div className="text-xs font-bold text-amber-400">{fmt(reg.financialImpact.capitalRequired, "currency")}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">Preparation Steps:</div>
                      <div className="space-y-0.5">
                        {(reg.preparationSteps || []).slice(0, 3).map((step: string, j: number) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs text-slate-400">
                            <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
