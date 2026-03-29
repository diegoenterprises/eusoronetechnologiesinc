/**
 * RFP CREATION & DISTRIBUTION PAGE (GAP-062)
 * RFP lifecycle management: create, publish, review bids, score, award.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText, Send, Users, MapPin, ArrowRight, Trophy,
  Clock, Shield, Truck, DollarSign, BarChart3, CheckCircle,
  AlertTriangle, Star, TrendingUp, Calendar, Package, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "rfps" | "scoring";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: "text-slate-400", bg: "bg-slate-500/10", label: "Draft" },
  published: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Published" },
  in_review: { color: "text-amber-400", bg: "bg-amber-500/10", label: "In Review" },
  awarded: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Awarded" },
  closed: { color: "text-slate-400", bg: "bg-slate-600/10", label: "Closed" },
  cancelled: { color: "text-red-400", bg: "bg-red-500/10", label: "Cancelled" },
};

const TIER_COLORS: Record<string, string> = {
  Gold: "text-amber-400", Silver: "text-slate-300", Bronze: "text-orange-400", Standard: "text-slate-500",
};

const REC_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  award: { color: "text-emerald-400", icon: <Trophy className="w-3.5 h-3.5" />, label: "Recommend Award" },
  shortlist: { color: "text-amber-400", icon: <Star className="w-3.5 h-3.5" />, label: "Shortlist" },
  decline: { color: "text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Decline" },
};

export default function RFPManagerPage() {
  const { theme } = useTheme(); const L = theme === "light";
  const [tab, setTab] = useState<Tab>("rfps");
  const [selectedRfp, setSelectedRfp] = useState<string | null>(null);

  const rfpsQuery = (trpc as any).rfpManager?.getRFPs?.useQuery?.() || { data: null, isLoading: false };
  const bidsQuery = (trpc as any).rfpManager?.getBidResponses?.useQuery?.(
    { rfpId: selectedRfp || "" },
    { enabled: !!selectedRfp && tab === "rfps" }
  ) || { data: null };
  const scoringQuery = (trpc as any).rfpManager?.scoreResponses?.useQuery?.(
    { rfpId: selectedRfp || "" },
    { enabled: !!selectedRfp && tab === "scoring" }
  ) || { data: null };
  const publishMutation = (trpc as any).rfpManager?.publishRFP?.useMutation?.() || { mutate: () => {} };
  const awardMutation = (trpc as any).rfpManager?.awardLane?.useMutation?.() || { mutate: () => {} };

  const rfps = rfpsQuery.data || [];
  const bids = bidsQuery.data || [];
  const scorecards = scoringQuery.data || [];
  const activeRfp = rfps.find((r: any) => r.id === selectedRfp);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            RFP Manager
          </h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Create, distribute & award carrier RFPs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn("flex gap-1 rounded-lg p-1 w-fit", L ? "bg-slate-100" : "bg-slate-800/50")}>
        <Button size="sm" variant={tab === "rfps" ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === "rfps" ? "bg-indigo-600" : "text-slate-400")} onClick={() => setTab("rfps")}>
          <FileText className="w-3.5 h-3.5 mr-1" />RFPs & Bids
        </Button>
        <Button size="sm" variant={tab === "scoring" ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === "scoring" ? "bg-purple-600" : "text-slate-400")} onClick={() => { setTab("scoring"); if (!selectedRfp && rfps.length > 0) setSelectedRfp(rfps[0].id); }}>
          <BarChart3 className="w-3.5 h-3.5 mr-1" />Scoring & Awards
        </Button>
      </div>

      {rfpsQuery.isLoading && <Skeleton className={cn("h-48 rounded-xl", L ? "bg-slate-200" : "bg-slate-700/30")} />}

      {/* ── RFPs & Bids Tab ── */}
      {tab === "rfps" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* RFP List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase">Your RFPs</p>
            {rfps.map((rfp: any) => {
              const sc = STATUS_CONFIG[rfp.status] || STATUS_CONFIG.draft;
              return (
                <Card key={rfp.id} onClick={() => setSelectedRfp(rfp.id)} className={cn("cursor-pointer rounded-xl transition-all", selectedRfp === rfp.id ? "border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-500/5" : L ? "bg-white border-slate-200 hover:border-indigo-400/30" : "bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/20")}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-mono text-slate-500">{rfp.id}</span>
                      <Badge variant="outline" className={cn("text-xs", sc.color, sc.bg)}>{sc.label}</Badge>
                    </div>
                    <p className={cn("text-xs font-semibold mb-1 line-clamp-2", L ? "text-slate-900" : "text-white")}>{rfp.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{rfp.lanes.length} lanes</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{rfp.distributedTo} carriers</span>
                      <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" />{rfp.responsesReceived} bids</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* RFP Detail + Bids */}
          <div className="lg:col-span-2 space-y-3">
            {activeRfp ? (
              <>
                {/* RFP Detail */}
                <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={cn("text-sm font-bold", L ? "text-slate-900" : "text-white")}>{activeRfp.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{activeRfp.description}</p>
                      </div>
                      {activeRfp.status === "draft" && (
                        <Button size="sm" className="bg-indigo-600 text-xs" onClick={() => publishMutation.mutate({ rfpId: activeRfp.id })}>
                          <Send className="w-3 h-3 mr-1" />Publish
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className={cn("p-2 rounded-lg", L ? "bg-slate-100" : "bg-slate-900/30")}><p className="text-xs text-slate-500">Deadline</p><p className={cn("text-xs font-mono", L ? "text-slate-900" : "text-white")}>{new Date(activeRfp.responseDeadline).toLocaleDateString()}</p></div>
                      <div className={cn("p-2 rounded-lg", L ? "bg-slate-100" : "bg-slate-900/30")}><p className="text-xs text-slate-500">Contract</p><p className={cn("text-xs font-mono", L ? "text-slate-900" : "text-white")}>{activeRfp.contractStartDate}</p></div>
                      <div className={cn("p-2 rounded-lg", L ? "bg-slate-100" : "bg-slate-900/30")}><p className="text-xs text-slate-500">Min Safety</p><p className="text-xs text-emerald-400 font-mono">{activeRfp.carrierRequirements.minSafetyScore}%</p></div>
                      <div className={cn("p-2 rounded-lg", L ? "bg-slate-100" : "bg-slate-900/30")}><p className="text-xs text-slate-500">Min On-Time</p><p className="text-xs text-blue-400 font-mono">{activeRfp.carrierRequirements.minOnTimeRate}%</p></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lanes */}
                <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardHeader className="pb-2"><CardTitle className={cn("text-xs flex items-center gap-2", L ? "text-slate-900" : "text-white")}><MapPin className="w-4 h-4 text-blue-400" />Lanes ({activeRfp.lanes.length})</CardTitle></CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-1.5">
                      {activeRfp.lanes.map((lane: any) => (
                        <div key={lane.id} className={cn("flex items-center gap-3 p-2 rounded-lg", L ? "bg-slate-50" : "bg-slate-900/20")}>
                          <span className="text-xs font-mono text-slate-500 w-14">{lane.id}</span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className={cn("text-xs truncate", L ? "text-slate-900" : "text-white")}>{lane.origin.city}, {lane.origin.state}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className={cn("text-xs truncate", L ? "text-slate-900" : "text-white")}>{lane.destination.city}, {lane.destination.state}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">{lane.estimatedDistance} mi</span>
                            <Badge variant="outline" className="text-xs text-cyan-400">{lane.equipmentRequired}</Badge>
                            {lane.hazmat && <Badge variant="outline" className="text-xs text-red-400">Hazmat</Badge>}
                            <span className="text-emerald-400 font-mono">${lane.targetRate?.toLocaleString()}</span>
                            <span className="text-slate-500">{lane.frequencyPerWeek}/wk</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bid Responses */}
                {bids.length > 0 && (
                  <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                    <CardHeader className="pb-2"><CardTitle className={cn("text-xs flex items-center gap-2", L ? "text-slate-900" : "text-white")}><Users className="w-4 h-4 text-amber-400" />Bid Responses ({bids.length})</CardTitle></CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2">
                        {bids.map((bid: any) => (
                          <div key={bid.id} className={cn("p-2.5 rounded-lg bg-slate-900/20 border", L ? "border-slate-200 bg-slate-50" : "border-slate-700/30")}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Truck className="w-3.5 h-3.5 text-slate-400" />
                                <span className={cn("text-xs font-semibold", L ? "text-slate-900" : "text-white")}>{bid.carrierName}</span>
                                <Badge variant="outline" className={cn("text-xs", TIER_COLORS[bid.carrierTier])}>{bid.carrierTier}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span><Shield className="w-3 h-3 inline" /> {bid.safetyScore}%</span>
                                <span><Clock className="w-3 h-3 inline" /> {bid.onTimeRate}%</span>
                                <span><Truck className="w-3 h-3 inline" /> {bid.fleetSize} trucks</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {bid.laneBids.map((lb: any) => (
                                <div key={lb.laneId} className={cn("p-1.5 rounded text-center", L ? "bg-slate-100" : "bg-slate-800/40")}>
                                  <p className="text-xs text-slate-500">{lb.laneId}</p>
                                  <p className="text-xs font-bold font-mono text-emerald-400">${Math.round(lb.bidRate).toLocaleString()}</p>
                                  <p className="text-xs text-slate-500">{lb.transitDays}d • {lb.capacityPerWeek}/wk</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-12 text-center">
                  <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className={cn("text-sm font-semibold", L ? "text-slate-900" : "text-white")}>Select an RFP</p>
                  <p className="text-xs text-slate-500 mt-1">Click an RFP from the left to view details and bids</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Scoring & Awards Tab ── */}
      {tab === "scoring" && (
        <div className="space-y-4">
          {/* RFP Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Scoring for:</span>
            {rfps.map((rfp: any) => (
              <Button key={rfp.id} size="sm" variant={selectedRfp === rfp.id ? "default" : "outline"} className={cn("text-xs", selectedRfp === rfp.id ? "bg-purple-600" : "border-slate-600 text-slate-400")} onClick={() => setSelectedRfp(rfp.id)}>
                {rfp.id}
              </Button>
            ))}
          </div>

          {/* Scorecards */}
          {scorecards.length > 0 && (
            <div className="space-y-2">
              {scorecards.map((sc: any, i: number) => {
                const rec = REC_CONFIG[sc.recommendation] || REC_CONFIG.decline;
                return (
                  <Card key={sc.carrierId} className={cn("rounded-xl border", i === 0 ? "border-emerald-500/30 bg-emerald-500/5" : L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", i === 0 ? "bg-emerald-500/20 text-emerald-400" : i < 3 ? "bg-amber-500/20 text-amber-400" : "bg-slate-700/50 text-slate-400")}>
                            #{i + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm font-semibold", L ? "text-slate-900" : "text-white")}>{sc.carrierName}</span>
                              <Badge variant="outline" className={cn("text-xs", TIER_COLORS[sc.carrierTier])}>{sc.carrierTier}</Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={rec.color}>{rec.icon}</span>
                              <span className={cn("text-xs font-semibold", rec.color)}>{rec.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className={cn("text-2xl font-bold font-mono", L ? "text-slate-900" : "text-white")}>{sc.overallScore}</p>
                            <p className="text-xs text-slate-500">Overall</p>
                          </div>
                          {sc.recommendation === "award" && (
                            <Button size="sm" className="bg-emerald-600 text-xs" onClick={() => awardMutation.mutate({ rfpId: selectedRfp!, laneId: "ALL", carrierId: sc.carrierId })}>
                              <Trophy className="w-3 h-3 mr-1" />Award
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "Rate", score: sc.rateScore, color: "bg-emerald-500" },
                          { label: "Service", score: sc.serviceLevelScore, color: "bg-blue-500" },
                          { label: "Safety", score: sc.safetyScore, color: "bg-purple-500" },
                          { label: "Capacity", score: sc.capacityScore, color: "bg-cyan-500" },
                          { label: "Experience", score: sc.experienceScore, color: "bg-amber-500" },
                        ].map(dim => (
                          <div key={dim.label} className="text-center">
                            <div className={cn("w-full h-1.5 rounded-full overflow-hidden mb-0.5", L ? "bg-slate-200" : "bg-slate-700/50")}>
                              <div className={cn("h-full rounded-full", dim.color)} style={{ width: `${dim.score}%` }} />
                            </div>
                            <p className="text-xs text-slate-500">{dim.label}</p>
                            <p className={cn("text-xs font-bold font-mono", L ? "text-slate-900" : "text-white")}>{dim.score}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {scorecards.length === 0 && selectedRfp && (
            <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className={cn("text-sm font-semibold", L ? "text-slate-900" : "text-white")}>No Bids to Score</p>
                <p className="text-xs text-slate-500">No carrier responses received for this RFP yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
