/**
 * CARRIER SCORECARD PAGE
 * Frontend for carrierScorecard router — performance metrics, safety ratings,
 * hazmat qualification, and trend analysis for carriers.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Award, Shield, Truck, Clock, TrendingUp, AlertTriangle,
  CheckCircle, Search, Star, Flame, Package, FileText, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "from-green-500 to-emerald-500",
  B: "from-blue-500 to-cyan-500",
  C: "from-yellow-500 to-orange-500",
  D: "from-orange-500 to-red-500",
  F: "from-red-500 to-red-700",
};

export default function CarrierScorecardPage() {
  const [carrierId, setCarrierId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");

  const scorecardQuery = (trpc as any).carrierScorecard.getScorecard.useQuery(
    { carrierId: carrierId! },
    { enabled: !!carrierId }
  );
  const trendsQuery = (trpc as any).carrierScorecard.getTrends.useQuery(
    { carrierId: carrierId!, months: 6 },
    { enabled: !!carrierId }
  );
  const topCarriersQuery = (trpc as any).carrierScorecard.getTopCarriers.useQuery({ limit: 10 });

  const sc = scorecardQuery.data;
  const trends = trendsQuery.data || [];
  const topCarriers = topCarriersQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Carrier Scorecard</h1>
          <p className="text-slate-400 text-sm mt-1">Performance metrics, safety ratings, and hazmat qualification</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input placeholder="Enter Carrier ID..." type="number" value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white max-w-xs" />
        <Button onClick={() => setCarrierId(parseInt(searchId))} disabled={!searchId} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
          <Search className="w-4 h-4 mr-2" />Lookup
        </Button>
      </div>

      {/* Scorecard Detail */}
      {carrierId && sc && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl overflow-hidden">
            <div className={cn("h-2 bg-gradient-to-r", GRADE_COLORS[sc.grade] || GRADE_COLORS.C)} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{sc.companyName}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                    {sc.dotNumber && <span>DOT# {sc.dotNumber}</span>}
                    {sc.mcNumber && <span>MC# {sc.mcNumber}</span>}
                    {sc.hazmatAuthorized && <Badge className="bg-orange-500/20 text-orange-400 text-[9px]"><Flame className="w-3 h-3 mr-1" />Hazmat Authorized</Badge>}
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br", GRADE_COLORS[sc.grade] || GRADE_COLORS.C)}>
                    <span className="text-3xl font-black text-white">{sc.grade}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{sc.overallScore}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { ...sc.metrics.onTimeDelivery, icon: <Clock className="w-5 h-5 text-cyan-400" />, val: `${sc.metrics.onTimeDelivery.rate}%`, sub: `${sc.metrics.onTimeDelivery.totalDeliveries} deliveries`, color: "text-cyan-400" },
              { ...sc.metrics.safety, icon: <Shield className="w-5 h-5 text-green-400" />, val: `${sc.metrics.safety.score}`, sub: `${sc.metrics.safety.totalIncidents} incidents`, color: "text-green-400" },
              { ...sc.metrics.compliance, icon: <FileText className="w-5 h-5 text-purple-400" />, val: `${sc.metrics.compliance.score}`, sub: `${sc.metrics.compliance.activePolicies} policies`, color: "text-purple-400" },
              { ...sc.metrics.completionRate, icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, val: `${sc.metrics.completionRate.rate}%`, sub: `${sc.metrics.completionRate.completed}/${sc.metrics.completionRate.total} (${sc.metrics.completionRate.period})`, color: "text-emerald-400" },
              { ...sc.metrics.bidAcceptance, icon: <TrendingUp className="w-5 h-5 text-blue-400" />, val: `${sc.metrics.bidAcceptance.rate}%`, sub: `${sc.metrics.bidAcceptance.accepted}/${sc.metrics.bidAcceptance.totalBids} bids`, color: "text-blue-400" },
              { ...sc.metrics.hazmat, icon: <Flame className="w-5 h-5 text-orange-400" />, val: `${sc.metrics.hazmat.totalLoads}`, sub: `${sc.metrics.hazmat.delivered} delivered | HMSP: ${sc.metrics.hazmat.hmspActive ? "Active" : "None"}`, color: "text-orange-400" },
            ].map((m, i) => (
              <Card key={i} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">{m.icon}<span className="text-[10px] text-slate-400 uppercase">{m.label}</span></div>
                  <p className={cn("text-2xl font-bold", m.color)}>{m.val}</p>
                  <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fleet Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20"><Truck className="w-6 h-6 text-blue-400" /></div>
                <div><p className="text-2xl font-bold text-blue-400">{sc.fleet.vehicles}</p><p className="text-xs text-slate-400">Vehicles</p></div>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20"><Users className="w-6 h-6 text-purple-400" /></div>
                <div><p className="text-2xl font-bold text-purple-400">{sc.fleet.drivers}</p><p className="text-xs text-slate-400">Drivers</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Trends */}
          {trends.length > 0 && (
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#1473FF]" />Performance Trends (6 Mo)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {trends.map((t: any, i: number) => (
                    <div key={i} className="text-center p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                      <p className="text-[10px] text-slate-500">{t.period}</p>
                      <p className="text-sm font-bold text-white">{t.totalLoads}</p>
                      <p className="text-[10px] text-slate-400">loads</p>
                      <p className="text-sm font-bold text-cyan-400">{t.onTimeRate}%</p>
                      <p className="text-[10px] text-slate-400">on-time</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Carriers Leaderboard */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" />Top-Rated Carriers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topCarriersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : topCarriers.length === 0 ? (
            <div className="p-8 text-center"><Award className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No carriers ranked yet</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {topCarriers.map((c: any, i: number) => (
                <button key={c.carrierId} onClick={() => { setCarrierId(c.carrierId); setSearchId(String(c.carrierId)); }} className="w-full p-3 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", i < 3 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" : "bg-slate-700 text-slate-300")}>
                      {i + 1}
                    </span>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">{c.companyName}</p>
                      <p className="text-[10px] text-slate-500">DOT# {c.dotNumber} · {c.totalLoads} loads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.hazmatAuthorized && <Badge className="bg-orange-500/20 text-orange-400 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />HM</Badge>}
                    <div className={cn("px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r text-white", GRADE_COLORS[c.grade])}>{c.grade} · {c.score}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
