/**
 * LANE CONTRACTS PAGE — EusoLane
 * Premium contracted lane management with volume fulfillment gauges,
 * performance visualization, expiring alerts, and procurement intelligence.
 * State-of-the-art | Theme-aware | Investor-grade.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Route, DollarSign, Clock, CheckCircle, AlertTriangle,
  MapPin, Package, TrendingUp, Calendar, ChevronRight, Flame,
  BarChart3, Target, Shield, Truck, ArrowRight, ArrowUpRight,
  ArrowDownRight, Gauge, Handshake, X, Activity, Zap, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-500/15", text: "text-green-500", label: "Active" },
  expired: { bg: "bg-red-500/15", text: "text-red-500", label: "Expired" },
  pending: { bg: "bg-yellow-500/15", text: "text-yellow-500", label: "Pending" },
  suspended: { bg: "bg-orange-500/15", text: "text-orange-500", label: "Suspended" },
  terminated: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Terminated" },
};

export default function LaneContractsPage() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"lanes" | "expiring" | "performance">("lanes");

  const statsQuery = (trpc as any).laneContracts.getStats.useQuery();
  const listQuery = (trpc as any).laneContracts.list.useQuery({ status: statusFilter || undefined, limit: 50 });
  const expiringQuery = (trpc as any).laneContracts.getExpiring.useQuery({ daysAhead: 30 });
  const detailQuery = (trpc as any).laneContracts.getById.useQuery({ id: selectedId! }, { enabled: !!selectedId });

  const stats = statsQuery.data;
  const lanes = listQuery.data?.lanes || [];
  const expiring = expiringQuery.data || [];
  const detail = detailQuery.data;
  const ld = statsQuery.isLoading;

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const cellCls = cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const titleCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");

  const VolGauge = ({ filled, total, period }: { filled: number; total: number; period?: string }) => {
    const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
    const r = 32; const c = 2 * Math.PI * r; const offset = c - (pct / 100) * c;
    const color = pct >= 90 ? "text-green-500" : pct >= 50 ? "text-blue-500" : pct >= 25 ? "text-yellow-500" : "text-red-500";
    const stroke = pct >= 90 ? "#22c55e" : pct >= 50 ? "#3b82f6" : pct >= 25 ? "#eab308" : "#ef4444";
    return (
      <div className="flex flex-col items-center">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke={L ? "#e2e8f0" : "#334155"} strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 40 40)" className="transition-all duration-700" />
          <text x="40" y="38" textAnchor="middle" className={cn("text-sm font-bold fill-current", color)}>{pct}%</text>
          <text x="40" y="50" textAnchor="middle" className="text-[8px] fill-slate-400">{filled}/{total}</text>
        </svg>
        {period && <span className="text-[9px] text-slate-400 mt-0.5 capitalize">{period}</span>}
      </div>
    );
  };

  const st = (s: string) => STATUS_MAP[s] || STATUS_MAP.pending;

  const activeLanes = lanes.filter((l: any) => l.status === "active");
  const totalContractedValue = activeLanes.reduce((s: number, l: any) => s + Number(l.totalRevenue || 0), 0);
  const avgRate = activeLanes.length > 0 ? activeLanes.reduce((s: number, l: any) => s + Number(l.contractedRate || 0), 0) / activeLanes.length : 0;

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoLane</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Contracted</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Lane procurement, rate commitments, and performance tracking</p>
        </div>
      </div>

      {/* ── Premium KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Total Lanes", v: stats?.total || 0, I: Route, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Active", v: stats?.active || 0, I: CheckCircle, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
          { l: "Expired", v: stats?.expired || 0, I: Clock, c: "text-red-500", b: "from-red-500/10 to-red-600/5" },
          { l: "Expiring Soon", v: expiring.length, I: AlertTriangle, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
          { l: "Avg Rate", v: `$${Math.round(avgRate).toLocaleString()}`, I: DollarSign, c: "text-emerald-500", b: "from-emerald-500/10 to-emerald-600/5" },
          { l: "Contract Value", v: `$${Math.round(totalContractedValue).toLocaleString()}`, I: TrendingUp, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
        ].map((k) => (
          <div key={k.l} className={cn("rounded-2xl p-3 bg-gradient-to-br border", L ? `${k.b} border-slate-200/60` : `${k.b} border-slate-700/30`)}>
            <k.I className={cn("w-4 h-4 mb-1", k.c)} />
            {ld ? <Skeleton className="h-6 w-10" /> : <p className={cn("text-xl font-bold", k.c)}>{k.v}</p>}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{k.l}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {([
          { id: "lanes" as const, l: "Lane Contracts", I: Route },
          { id: "expiring" as const, l: `Expiring (${expiring.length})`, I: AlertTriangle },
          { id: "performance" as const, l: "Performance", I: BarChart3 },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><t.I className="w-3.5 h-3.5" />{t.l}</button>
        ))}
      </div>

      {/* ══════ DETAIL PANEL ══════ */}
      {selectedId && detail && (
        <Card className={cc}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between", L ? "border-slate-100" : "border-slate-700/30")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
                <Route className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>{detail.originCity}, {detail.originState} → {detail.destinationCity}, {detail.destinationState}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={cn("border text-[9px] font-bold", st(detail.status).bg, st(detail.status).text)}>{st(detail.status).label}</Badge>
                  {detail.hazmatRequired && <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/30 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />Hazmat</Badge>}
                  {detail.equipmentType && <span className="text-[10px] text-slate-400">{detail.equipmentType}</span>}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setSelectedId(null)}><X className="w-4 h-4" /></Button>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: KPI Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: "Contracted Rate", v: `$${Number(detail.contractedRate || 0).toLocaleString()}`, sub: detail.rateType, c: "from-[#1473FF] to-[#BE01FF]", tc: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
                  { l: "Total Loads", v: detail.totalLoadsBooked || 0, sub: "lifetime", c: "from-cyan-500/10 to-cyan-600/5", tc: "text-cyan-500" },
                  { l: "Revenue", v: `$${Number(detail.totalRevenue || 0).toLocaleString()}`, sub: "lifetime", c: "from-green-500/10 to-green-600/5", tc: "text-green-500" },
                  { l: "Est. Miles", v: detail.estimatedMiles ? `${Number(detail.estimatedMiles).toLocaleString()} mi` : "—", sub: "per trip", c: "from-purple-500/10 to-purple-600/5", tc: "text-purple-500" },
                ].map((k) => (
                  <div key={k.l} className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{k.l}</p>
                    <p className={cn("text-lg font-bold", k.tc)}>{k.v}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{k.sub}</p>
                  </div>
                ))}
                {/* Contract period */}
                <div className={cn(cellCls, "col-span-2")}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Contract Period</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-white")}>{detail.effectiveDate ? new Date(detail.effectiveDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-white")}>{detail.expirationDate ? new Date(detail.expirationDate).toLocaleDateString() : "—"}</span>
                    </div>
                    {detail.expirationDate && (() => {
                      const d = Math.ceil((new Date(detail.expirationDate).getTime() - Date.now()) / 86400000);
                      return d > 0 ? <Badge className="ml-auto bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px]">{d} days left</Badge> : <Badge className="ml-auto bg-red-500/15 text-red-400 border border-red-500/30 text-[9px]">Expired</Badge>;
                    })()}
                  </div>
                </div>
                {/* Parties */}
                <div className={cn(cellCls, "col-span-2")}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Parties</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {detail.shipper && <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 text-[10px] font-bold">{detail.shipper.name?.charAt(0)}</div><span className={cn("text-xs", L ? "text-slate-700" : "text-white")}>{detail.shipper.name}</span><Badge className="text-[8px] bg-blue-500/10 text-blue-400 border-0">Shipper</Badge></div>}
                    {detail.catalyst && <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg bg-green-500/15 flex items-center justify-center text-green-500 text-[10px] font-bold">{detail.catalyst.name?.charAt(0)}</div><span className={cn("text-xs", L ? "text-slate-700" : "text-white")}>{detail.catalyst.name}</span><Badge className="text-[8px] bg-green-500/10 text-green-400 border-0">Carrier</Badge></div>}
                    {detail.broker && <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500 text-[10px] font-bold">{detail.broker.name?.charAt(0)}</div><span className={cn("text-xs", L ? "text-slate-700" : "text-white")}>{detail.broker.name}</span><Badge className="text-[8px] bg-purple-500/10 text-purple-400 border-0">Broker</Badge></div>}
                  </div>
                </div>
                {/* Fuel Surcharge */}
                {detail.fuelSurchargeType && detail.fuelSurchargeType !== "none" && (
                  <div className={cn(cellCls, "col-span-2")}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Fuel Surcharge</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] capitalize">{detail.fuelSurchargeType}</Badge>
                      {detail.fuelSurchargeValue && <span className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{detail.fuelSurchargeType === "percentage" ? `${detail.fuelSurchargeValue}%` : `$${detail.fuelSurchargeValue}`}</span>}
                    </div>
                  </div>
                )}
              </div>
              {/* Right: Volume Fulfillment */}
              <div className={cellCls}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 text-center">Volume Fulfillment</p>
                <div className="flex justify-center">
                  <VolGauge filled={detail.volumeFulfilled || 0} total={detail.volumeCommitment || 0} period={detail.volumePeriod} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Commitment</span>
                    <span className={cn("font-bold", L ? "text-slate-800" : "text-white")}>{detail.volumeCommitment || 0} loads</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Fulfilled</span>
                    <span className="font-bold text-green-500">{detail.volumeFulfilled || 0} loads</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining</span>
                    <span className="font-bold text-yellow-500">{Math.max(0, (detail.volumeCommitment || 0) - (detail.volumeFulfilled || 0))} loads</span>
                  </div>
                  {detail.onTimePercentage !== undefined && detail.onTimePercentage !== null && (
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-700/20">
                      <span className="text-slate-400">On-Time</span>
                      <span className="font-bold text-blue-500">{Number(detail.onTimePercentage || 0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════ LANES TAB ══════ */}
      {tab === "lanes" && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-2">
            {["", "active", "expired", "pending", "suspended"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                statusFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              )}>{f ? f.charAt(0).toUpperCase() + f.slice(1) : "All"}</button>
            ))}
            <Badge className={cn("ml-auto border text-[10px]", L ? "border-slate-200 text-slate-500" : "border-slate-600 text-slate-400")}>{listQuery.data?.total || 0} total</Badge>
          </div>

          {/* Lane Cards Grid */}
          {listQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
          ) : lanes.length === 0 ? (
            <div className={cn("text-center py-16 rounded-2xl border", L ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
              <Route className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>No lane contracts found</p>
              <p className="text-sm text-slate-400 mt-1">Create your first lane contract to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lanes.map((l: any) => {
                const s = st(l.status);
                const volPct = (l.volumeCommitment || 0) > 0 ? Math.min(Math.round(((l.volumeFulfilled || 0) / l.volumeCommitment) * 100), 100) : 0;
                const daysLeft = l.expirationDate ? Math.ceil((new Date(l.expirationDate).getTime() - Date.now()) / 86400000) : null;
                return (
                  <Card key={l.id} className={cn(cc, "cursor-pointer hover:shadow-lg transition-shadow")} onClick={() => setSelectedId(l.id)}>
                    <CardContent className="p-4">
                      {/* Route header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", L ? "bg-blue-50" : "bg-blue-500/15")}>
                            <MapPin className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{l.originCity}, {l.originState}</p>
                            <p className="text-[10px] text-slate-400">Origin</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-[2px] w-8 rounded-full", "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]")} />
                          <Truck className="w-3.5 h-3.5 text-purple-400" />
                          <div className={cn("h-[2px] w-8 rounded-full", "bg-gradient-to-r from-[#BE01FF] to-[#1473FF]")} />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div>
                              <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{l.destinationCity}, {l.destinationState}</p>
                              <p className="text-[10px] text-slate-400 text-right">Destination</p>
                            </div>
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", L ? "bg-purple-50" : "bg-purple-500/15")}>
                              <MapPin className="w-4 h-4 text-purple-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className={cn("border text-[9px] font-bold", s.bg, s.text)}>{s.label}</Badge>
                        {l.hazmatRequired && <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/30 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />Hazmat</Badge>}
                        {l.equipmentType && <Badge className={cn("border text-[9px]", L ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>{l.equipmentType}</Badge>}
                        {l.estimatedMiles && <span className="text-[10px] text-slate-400">{Number(l.estimatedMiles).toLocaleString()} mi</span>}
                        {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && <Badge className="bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 text-[9px]">{daysLeft}d left</Badge>}
                      </div>
                      {/* Bottom metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className={cn("p-2 rounded-lg text-center", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(l.contractedRate || 0).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 uppercase">{l.rateType || "flat"}</p>
                        </div>
                        <div className={cn("p-2 rounded-lg text-center", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <p className="text-lg font-bold text-cyan-500">{l.totalLoadsBooked || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase">Loads</p>
                        </div>
                        <div className={cn("p-2 rounded-lg", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-slate-400">Vol</span>
                            <span className={cn("text-[9px] font-bold", volPct >= 75 ? "text-green-500" : volPct >= 40 ? "text-blue-500" : "text-yellow-500")}>{volPct}%</span>
                          </div>
                          <div className={cn("h-1.5 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                            <div className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-500" style={{ width: `${volPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════ EXPIRING TAB ══════ */}
      {tab === "expiring" && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className={titleCls}>Contracts Expiring Within 30 Days</span>
            <Badge className="ml-auto bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 text-[10px]">{expiring.length}</Badge>
          </div>
          <CardContent className="p-4">
            {expiring.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>All contracts healthy</p>
                <p className="text-sm text-slate-400 mt-1">No contracts expiring in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiring.map((l: any) => {
                  const daysLeft = Math.ceil((new Date(l.expirationDate).getTime() - Date.now()) / 86400000);
                  const urgent = daysLeft <= 7;
                  return (
                    <div key={l.id} onClick={() => { setSelectedId(l.id); setTab("lanes"); }} className={cn("p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md", urgent ? (L ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20") : cellCls)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", urgent ? "bg-red-500/15" : "bg-yellow-500/15")}>
                            {urgent ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div>
                            <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{l.originCity}, {l.originState} → {l.destinationCity}, {l.destinationState}</p>
                            <p className="text-[10px] text-slate-400">${Number(l.contractedRate || 0).toLocaleString()} {l.rateType} · {l.totalLoadsBooked || 0} loads booked</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", urgent ? "text-red-500" : "text-yellow-500")}>{daysLeft} days</p>
                          <p className="text-[10px] text-slate-400">{new Date(l.expirationDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════ PERFORMANCE TAB ══════ */}
      {tab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Lane Performance Overview */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Award className="w-4 h-4 text-amber-500" />
              <span className={titleCls}>Portfolio Overview</span>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Active Lanes", v: stats?.active || 0, c: "text-green-500", I: Route },
                  { l: "Total Contracted", v: `$${Math.round(avgRate).toLocaleString()}`, c: "text-blue-500", I: DollarSign },
                  { l: "Total Revenue", v: `$${Math.round(totalContractedValue).toLocaleString()}`, c: "text-emerald-500", I: TrendingUp },
                  { l: "Avg Loads/Lane", v: activeLanes.length > 0 ? Math.round(activeLanes.reduce((s: number, l: any) => s + (l.totalLoadsBooked || 0), 0) / activeLanes.length) : 0, c: "text-cyan-500", I: Package },
                ].map((k) => (
                  <div key={k.l} className={cellCls}>
                    <div className="flex items-center gap-2 mb-1">
                      <k.I className={cn("w-3.5 h-3.5", k.c)} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{k.l}</span>
                    </div>
                    <p className={cn("text-lg font-bold", k.c)}>{k.v}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Volume Fulfillment Grid */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Target className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Volume Fulfillment</span>
            </div>
            <CardContent className="p-4">
              {activeLanes.filter((l: any) => l.volumeCommitment > 0).length === 0 ? (
                <div className="text-center py-8">
                  <Gauge className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No volume commitments set</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                  {activeLanes.filter((l: any) => l.volumeCommitment > 0).slice(0, 6).map((l: any) => (
                    <div key={l.id} className="text-center cursor-pointer" onClick={() => { setSelectedId(l.id); setTab("lanes"); }}>
                      <VolGauge filled={l.volumeFulfilled || 0} total={l.volumeCommitment || 0} period={l.volumePeriod} />
                      <p className={cn("text-[10px] font-medium mt-1 max-w-[80px] truncate", L ? "text-slate-600" : "text-slate-300")}>{l.originState}→{l.destinationState}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Lanes by Revenue */}
          <Card className={cn(cc, "lg:col-span-2")}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className={titleCls}>Top Lanes by Revenue</span>
            </div>
            <CardContent className="p-4">
              {activeLanes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No active lanes</p>
              ) : (
                <div className="space-y-2">
                  {[...activeLanes].sort((a: any, b: any) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0)).slice(0, 8).map((l: any, idx: number) => {
                    const maxRev = Math.max(...activeLanes.map((x: any) => Number(x.totalRevenue || 0)), 1);
                    const pct = Math.round((Number(l.totalRevenue || 0) / maxRev) * 100);
                    return (
                      <div key={l.id} className={cn(cellCls, "cursor-pointer hover:shadow-sm transition-shadow")} onClick={() => { setSelectedId(l.id); setTab("lanes"); }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-bold w-5 text-center", idx < 3 ? "text-amber-500" : "text-slate-400")}>#{idx + 1}</span>
                            <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-white")}>{l.originCity}, {l.originState} → {l.destinationCity}, {l.destinationState}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-green-500">${Number(l.totalRevenue || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 ml-2">{l.totalLoadsBooked || 0} loads</span>
                          </div>
                        </div>
                        <div className={cn("h-1.5 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                          <div className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
