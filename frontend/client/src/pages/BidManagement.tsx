/**
 * BID MANAGEMENT PAGE — EusoBid Command Center
 * Premium bid pipeline analytics, win/loss funnel, monthly trends,
 * quick bid, market intelligence, and comprehensive bid list.
 * State-of-the-art | Theme-aware | Investor-grade.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gavel, DollarSign, CheckCircle, XCircle, Clock,
  TrendingUp, Package, Search, Navigation, MapPin, Building2,
  Eye, FileText, Shield, Target, BarChart3, Award, Zap,
  ArrowUpRight, ArrowDownRight, Activity, Flame, Percent
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";

export default function BidManagement() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"pipeline" | "bids" | "analytics">("pipeline");

  const bidsQuery = (trpc as any).catalysts.getBids.useQuery({ filter });
  const statsQuery = (trpc as any).loadBidding.getStats.useQuery();
  const availableLoadsQuery = (trpc as any).loadBoard.search.useQuery({ limit: 5 });

  const submitBidMutation = (trpc as any).loadBoard.submitEnhancedBid.useMutation({
    onSuccess: (data: any) => {
      if (data?.autoAccepted) toast.success("Bid auto-accepted! Load assigned.");
      else if (data?.hazmatWarnings?.length > 0) toast.warning("Bid submitted with hazmat warnings", { description: data.hazmatWarnings.join("; ") });
      else toast.success("Bid submitted");
      bidsQuery.refetch(); availableLoadsQuery.refetch(); statsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const cancelBidMutation = (trpc as any).catalysts.cancelBid.useMutation({
    onSuccess: () => { toast.success("Bid cancelled"); bidsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Cannot cancel bid", { description: error.message }),
  });

  const analyzeMutation = (trpc as any).esang.analyzeBidFairness.useMutation();

  const mlDemand = (trpc as any).ml?.forecastDemand?.useQuery?.({}, { staleTime: 120_000 }) || { data: null };

  const stats = statsQuery.data as any;
  const ld = statsQuery.isLoading;
  const bidsByMonth: any[] = stats?.bidsByMonth || [];

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const cellCls = cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const titleCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");

  const statusBadge = (status: string) => {
    const m: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      pending: { cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", icon: <Clock className="w-3 h-3 mr-1" />, label: "Pending" },
      accepted: { cls: "bg-green-500/15 text-green-500 border-green-500/30", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Won" },
      auto_accepted: { cls: "bg-green-500/15 text-green-500 border-green-500/30", icon: <Zap className="w-3 h-3 mr-1" />, label: "Auto-Won" },
      rejected: { cls: "bg-red-500/15 text-red-500 border-red-500/30", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Lost" },
      countered: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Gavel className="w-3 h-3 mr-1" />, label: "Countered" },
      expired: { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: <Clock className="w-3 h-3 mr-1" />, label: "Expired" },
      withdrawn: { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Cancelled" },
    };
    const s = m[status] || { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: null, label: status };
    return <Badge className={cn("border text-xs font-bold", s.cls)}>{s.icon}{s.label}</Badge>;
  };

  // Pipeline funnel data
  const pipeline = [
    { l: "Submitted", v: stats?.submitted || 0, c: "text-blue-500", bg: "from-blue-500", w: 100 },
    { l: "Pending", v: stats?.pending || 0, c: "text-yellow-500", bg: "from-yellow-500", w: stats?.submitted ? Math.round(((stats?.pending || 0) / stats.submitted) * 100) : 0 },
    { l: "Countered", v: stats?.countered || 0, c: "text-cyan-500", bg: "from-cyan-500", w: stats?.submitted ? Math.round(((stats?.countered || 0) / stats.submitted) * 100) : 0 },
    { l: "Won", v: stats?.accepted || 0, c: "text-green-500", bg: "from-green-500", w: stats?.submitted ? Math.round(((stats?.accepted || 0) / stats.submitted) * 100) : 0 },
    { l: "Lost", v: stats?.rejected || 0, c: "text-red-500", bg: "from-red-500", w: stats?.submitted ? Math.round(((stats?.rejected || 0) / stats.submitted) * 100) : 0 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoBid</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Gavel className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Command Center</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Bid pipeline, win analytics, and market intelligence</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation("/marketplace")}>
          <Search className="w-4 h-4 mr-2" />Find Loads
        </Button>
      </div>

      {/* ── Top-Line KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Submitted", v: stats?.submitted || 0, I: Gavel, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Won", v: stats?.accepted || 0, I: CheckCircle, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
          { l: "Pending", v: stats?.pending || 0, I: Clock, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
          { l: "Win Rate", v: `${stats?.winRate || 0}%`, I: Target, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
          { l: "Avg Bid", v: `$${(stats?.avgBid || 0).toLocaleString()}`, I: DollarSign, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
          { l: "Won Value", v: `$${(stats?.totalWonValue || 0).toLocaleString()}`, I: TrendingUp, c: "text-emerald-500", b: "from-emerald-500/10 to-emerald-600/5" },
        ].map((k) => (
          <div key={k.l} className={cn("rounded-2xl p-3 bg-gradient-to-br border", L ? `${k.b} border-slate-200/60` : `${k.b} border-slate-700/30`)}>
            <k.I className={cn("w-4 h-4 mb-1", k.c)} />
            {ld ? <Skeleton className="h-6 w-10" /> : <p className={cn("text-xl font-bold", k.c)}>{k.v}</p>}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{k.l}</p>
          </div>
        ))}
      </div>

      {/* ── ESANG AI Market Intelligence ── */}
      {mlDemand.data && mlDemand.data.topLanes?.length > 0 && (
        <div className={cn("rounded-xl border p-3", L ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20")}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", L ? "text-purple-600" : "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent")}>ESANG AI Bid Intelligence</span>
            <span className={cn("ml-auto text-[10px]", L ? "text-slate-500" : "text-slate-500")}>
              Trend: <span className={mlDemand.data.trend === "RISING" ? "text-green-400 font-bold" : mlDemand.data.trend === "DECLINING" ? "text-red-400 font-bold" : "text-slate-400 font-bold"}>{mlDemand.data.trend}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mlDemand.data.topLanes.slice(0, 5).map((lane: any, i: number) => (
              <span key={i} className={cn("text-[10px] px-2 py-1 rounded-lg border", L ? "bg-white border-slate-200 text-slate-600" : "bg-slate-800/50 border-slate-700/30 text-slate-300")}>
                <span className="font-bold">{lane.lane}</span>
                <span className="text-slate-400 ml-1">{lane.volume} loads</span>
                <span className={`ml-1 ${lane.trend === "RISING" ? "text-green-400" : lane.trend === "DECLINING" ? "text-red-400" : "text-slate-400"}`}>{lane.trend === "RISING" ? "↑" : lane.trend === "DECLINING" ? "↓" : "→"}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {([
          { id: "pipeline" as const, l: "Pipeline", I: BarChart3 },
          { id: "bids" as const, l: "My Bids", I: Gavel },
          { id: "analytics" as const, l: "Analytics", I: Target },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><t.I className="w-3.5 h-3.5" />{t.l}</button>
        ))}
      </div>

      {/* ═══════════ PIPELINE TAB ═══════════ */}
      {tab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bid Funnel */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Bid Pipeline Funnel</span>
            </div>
            <CardContent className="p-4 space-y-3">
              {pipeline.map((s, idx) => (
                <div key={s.l} className={cellCls}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>{s.l}</span>
                    <span className={cn("font-bold text-sm", s.c)}>{s.v}</span>
                  </div>
                  <div className={cn("h-2 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                    <div className={cn("h-full rounded-full transition-all duration-700", `bg-gradient-to-r ${s.bg} to-transparent`)} style={{ width: `${Math.max(s.w, 3)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Bid */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Zap className="w-4 h-4 text-amber-500" />
              <span className={titleCls}>Quick Bid — Available Loads</span>
            </div>
            <CardContent className="p-4">
              {((availableLoadsQuery.data as any)?.loads?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {(availableLoadsQuery.data as any)?.loads?.slice(0, 4).map((load: any) => (
                    <div key={load.id} className={cn(cellCls, "flex flex-col gap-2")}>
                      <div className="flex items-center justify-between">
                        <p className={cn("font-bold text-xs", L ? "text-slate-800" : "text-white")}>#{load.loadNumber || `L-${String(load.id).slice(0,5)}`}</p>
                        <span className="text-xs text-slate-400">{load.distance || "—"} mi</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{typeof load.origin === "object" ? `${load.origin?.city || ""}, ${load.origin?.state || ""}` : load.origin} → {typeof load.destination === "object" ? `${load.destination?.city || ""}, ${load.destination?.state || ""}` : load.destination}</p>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="$" value={bidAmount[load.id] || ""} onChange={(e: any) => setBidAmount(prev => ({ ...prev, [load.id]: e.target.value }))} className={cn("flex-1 rounded-lg h-8 text-xs", L ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700")} />
                        <Button size="sm" variant="outline" className={cn("rounded-lg h-8 px-2", L ? "border-purple-200 text-purple-600" : "bg-purple-500/15 border-purple-500/30 text-purple-400")} onClick={() => analyzeMutation.mutate({ loadId: load.id, bidAmount: parseFloat(bidAmount[load.id] || "0") })}>
                          <EsangIcon className="w-3 h-3" />
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg h-8 font-bold text-xs px-3" onClick={() => submitBidMutation.mutate({ loadId: parseInt(load.id), bidAmount: parseFloat(bidAmount[load.id] || "0") })} disabled={!bidAmount[load.id]}>Bid</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No loads available right now</p>
                  <Button size="sm" className="mt-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs" onClick={() => setLocation("/marketplace")}>Browse Marketplace</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ BIDS TAB ═══════════ */}
      {tab === "bids" && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", l: "All" },
              { id: "pending", l: "Pending" },
              { id: "accepted", l: "Won" },
              { id: "rejected", l: "Lost" },
              { id: "countered", l: "Countered" },
            ].map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === f.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              )}>{f.l}</button>
            ))}
          </div>

          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Gavel className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>My Bids</span>
            </div>
            <CardContent className="p-0">
              {bidsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (bidsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-16">
                  <Gavel className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>No bids found</p>
                  <p className="text-sm text-slate-400 mt-1">Start bidding on loads from the marketplace</p>
                  <Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/marketplace")}>
                    <Search className="w-4 h-4 mr-2" />Find Loads
                  </Button>
                </div>
              ) : (
                <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/30")}>
                  {(bidsQuery.data as any)?.map((bid: any) => (
                    <div key={bid.id} className={cn("p-4 transition-colors cursor-pointer",
                      bid.status === "accepted" && (L ? "bg-green-50/50 border-l-[3px] border-l-green-500" : "bg-green-500/5 border-l-[3px] border-l-green-500"),
                      L ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                    )} onClick={() => bid.loadId && setLocation(`/load/${bid.loadId}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>Load #{bid.loadNumber}</p>
                            {statusBadge(bid.status)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span>{typeof bid.origin === "object" ? `${bid.origin?.city || ""}, ${bid.origin?.state || ""}` : bid.origin}</span>
                            <Navigation className="w-3 h-3 mx-1 rotate-90" />
                            <span>{typeof bid.destination === "object" ? `${bid.destination?.city || ""}, ${bid.destination?.state || ""}` : bid.destination}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Submitted: {bid.submittedAt}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <div className="text-right">
                            <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(bid.amount || bid.myBid || 0)?.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">${bid.perMile || 0}/mi</p>
                          </div>
                          {bid.status === "pending" && (
                            <Button size="sm" variant="outline" className={cn("rounded-xl font-bold text-xs h-9", L ? "border-red-200 text-red-600 hover:bg-red-50" : "border-red-500/30 text-red-400 hover:bg-red-500/10")}
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); cancelBidMutation.mutate({ bidId: bid.id }); }}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />Cancel
                            </Button>
                          )}
                          {bid.status === "accepted" && bid.loadId && (
                            <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs h-9"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLocation(`/contract/sign/${bid.loadId}`); }}>
                              <FileText className="w-3.5 h-3.5 mr-1" />Sign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════ ANALYTICS TAB ═══════════ */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Win/Loss Breakdown */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Target className="w-4 h-4 text-green-500" />
              <span className={titleCls}>Win / Loss Breakdown</span>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Total Bids", v: stats?.submitted || 0, c: "text-blue-500", I: Gavel },
                  { l: "Won", v: stats?.accepted || 0, c: "text-green-500", I: CheckCircle },
                  { l: "Lost", v: stats?.rejected || 0, c: "text-red-500", I: XCircle },
                  { l: "Countered", v: stats?.countered || 0, c: "text-cyan-500", I: Gavel },
                  { l: "Expired", v: stats?.expired || 0, c: "text-slate-400", I: Clock },
                  { l: "Auto-Won", v: stats?.autoAccepted || 0, c: "text-amber-500", I: Zap },
                ].map((k) => (
                  <div key={k.l} className={cellCls}>
                    <div className="flex items-center gap-2 mb-1">
                      <k.I className={cn("w-3.5 h-3.5", k.c)} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{k.l}</span>
                    </div>
                    {ld ? <Skeleton className="h-6 w-12 rounded" /> : <p className={cn("text-lg font-bold", k.c)}>{k.v}</p>}
                  </div>
                ))}
              </div>
              {/* Win Rate Gauge */}
              <div className={cn(cellCls, "mt-3")}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>Win Rate</span>
                  <span className="font-bold text-sm text-green-500">{stats?.winRate || 0}%</span>
                </div>
                <div className={cn("h-3 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700" style={{ width: `${stats?.winRate || 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Bid Trends */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className={titleCls}>Monthly Bid Activity</span>
            </div>
            <CardContent className="p-4">
              {bidsByMonth.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-end gap-2 h-32">
                    {bidsByMonth.map((m: any, i: number) => {
                      const maxC = Math.max(...bidsByMonth.map((x: any) => x.count || 0), 1);
                      const hTotal = Math.max(8, Math.round(((m.count || 0) / maxC) * 100));
                      const hWon = m.count > 0 ? Math.round(((m.won || 0) / m.count) * hTotal) : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-slate-400 font-bold">{m.count}</span>
                          <div className="w-full flex flex-col items-center">
                            <div className={cn("w-full rounded-t-md transition-all duration-500", L ? "bg-slate-200" : "bg-slate-700")} style={{ height: `${hTotal - hWon}%`, minHeight: "2px" }} />
                            <div className="w-full rounded-b-md bg-gradient-to-t from-green-500 to-emerald-400 transition-all duration-500" style={{ height: `${hWon}%`, minHeight: m.won > 0 ? "4px" : "0px" }} />
                          </div>
                          <span className="text-[8px] text-slate-500">{(m.month || "").slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5"><div className={cn("w-2.5 h-2.5 rounded-sm", L ? "bg-slate-200" : "bg-slate-700")} /><span className="text-[10px] text-slate-400">Total Bids</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span className="text-[10px] text-slate-400">Won</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No bid history yet</p>
                  <p className="text-xs text-slate-500 mt-1">Data will appear as you submit bids</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Intelligence */}
          <Card className={cn(cc, "lg:col-span-2")}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Award className="w-4 h-4 text-amber-500" />
              <span className={titleCls}>Bidding Intelligence Summary</span>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { l: "Total Won Value", v: `$${(stats?.totalWonValue || 0).toLocaleString()}`, c: "text-emerald-500", I: DollarSign },
                  { l: "Avg Bid Amount", v: `$${(stats?.avgBid || 0).toLocaleString()}`, c: "text-purple-500", I: DollarSign },
                  { l: "Bids Received", v: stats?.received || 0, c: "text-blue-500", I: Package },
                  { l: "Win Rate", v: `${stats?.winRate || 0}%`, c: "text-green-500", I: Percent },
                ].map((k) => (
                  <div key={k.l} className={cellCls}>
                    <div className="flex items-center gap-2 mb-1">
                      <k.I className={cn("w-3.5 h-3.5", k.c)} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{k.l}</span>
                    </div>
                    {ld ? <Skeleton className="h-6 w-16 rounded" /> : <p className={cn("text-lg font-bold", k.c)}>{k.v}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
