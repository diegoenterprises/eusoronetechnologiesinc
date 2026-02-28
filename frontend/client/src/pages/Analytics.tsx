/**
 * ANALYTICS — Business Intelligence Dashboard
 * Role-aware real metrics, KPIs, trends, and performance insights.
 * 100% Dynamic | Theme-aware | Brand gradient.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  TrendingUp, DollarSign, Package, Truck, Users, Handshake, ShieldCheck, FileText,
  Calendar, Download, ArrowUpRight, ArrowDownRight, BarChart3, Activity, Target,
  MapPin, Clock, CheckCircle, XCircle, Gauge, Award, Building2, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const ROLE_META: Record<string, { label: string; desc: string }> = {
  catalyst: { label: "Carrier Analytics", desc: "Fleet performance, revenue, and operational KPIs" },
  shipper: { label: "Shipper Analytics", desc: "Shipment performance, spend, and carrier KPIs" },
  broker: { label: "Broker Analytics", desc: "Brokerage performance, margins, and carrier metrics" },
  driver: { label: "Driver Analytics", desc: "Driving performance, safety, and earnings overview" },
  dispatch: { label: "Dispatch Analytics", desc: "Dispatch efficiency, load management, and operations" },
  escort: { label: "Escort Analytics", desc: "Escort operations, load coverage, and compliance" },
  terminal_manager: { label: "Terminal Analytics", desc: "Terminal throughput, facility utilization, and operations" },
  safety_manager: { label: "Safety Analytics", desc: "Fleet safety, compliance scores, and incident metrics" },
  factoring: { label: "Factoring Analytics", desc: "Invoice volume, advances, and portfolio health" },
  compliance_officer: { label: "Compliance Analytics", desc: "Regulatory compliance, audit readiness, and risk scores" },
};

export default function Analytics() {
  const { theme } = useTheme();
  const L = theme === "light";
  const { user } = useAuth();
  const userRole = ((user as any)?.role || "").toLowerCase();
  const rm = ROLE_META[userRole] || { label: "Analytics", desc: "Business intelligence & performance metrics" };
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");

  const summaryQuery = (trpc as any).analytics?.getSummary?.useQuery?.({ period }) || { data: null, isLoading: false };
  const trendsQuery = (trpc as any).analytics?.getTrends?.useQuery?.({ period }) || { data: null, isLoading: false };
  const s = summaryQuery.data;
  const trends: any[] = Array.isArray(trendsQuery.data) ? trendsQuery.data : [];
  const ld = summaryQuery.isLoading;

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const titleCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");
  const cellCls = cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const valCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");

  const CI = ({ value }: { value: number | undefined | null }) => {
    if (value === undefined || value === null || value === 0) return null;
    return (
      <span className={cn("flex items-center gap-0.5 text-[10px] font-bold", value >= 0 ? "text-green-500" : "text-red-500")}>
        {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  const PB = ({ value, gradient, label, color }: { value: number; gradient: string; label: string; color: string }) => (
    <div className={cellCls}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>{label}</span>
        <span className={cn("font-bold text-sm", color)}>{value}%</span>
      </div>
      <div className={cn("h-2 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", gradient)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );

  const Metric = ({ label, value, icon: I, color, bg, change }: any) => (
    <div className={cn("rounded-2xl p-4 bg-gradient-to-br border", L ? `${bg} border-slate-200/60` : `${bg} border-slate-700/30`)}>
      <div className="flex items-center justify-between mb-2">
        <I className={cn("w-4 h-4", color)} />
        {change !== undefined && <CI value={change} />}
      </div>
      {ld ? <Skeleton className="h-7 w-20 rounded-lg" /> : <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>}
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );

  const tabs = [
    { id: "overview", l: "Overview", I: BarChart3 },
    { id: "performance", l: "Performance", I: Target },
    { id: "loads", l: "Loads", I: Package },
    { id: "account", l: "Account", I: User },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{rm.label}</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Activity className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>{rm.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1 p-1 rounded-xl", L ? "bg-slate-100" : "bg-slate-800/60")}>
            {["week", "month", "year"].map((t) => (
              <button key={t} onClick={() => setPeriod(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === t ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500" : "text-slate-400"
              )}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="rounded-xl"><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>
        </div>
      </div>

      {/* ── Top-Line Pulse Metrics (role-aware) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Revenue" value={`$${(s?.revenue || 0).toLocaleString()}`} icon={DollarSign} color="text-emerald-500" bg="from-emerald-500/10 to-emerald-600/5" change={s?.revenueChange} />
        <Metric label="Loads" value={s?.totalLoads || 0} icon={Package} color="text-blue-500" bg="from-blue-500/10 to-blue-600/5" change={s?.loadsChange} />
        <Metric label="Miles" value={(s?.milesLogged || 0).toLocaleString()} icon={MapPin} color="text-purple-500" bg="from-purple-500/10 to-purple-600/5" />
        <Metric label="Avg $/Mile" value={`$${s?.avgRatePerMile?.toFixed(2) || "0.00"}`} icon={TrendingUp} color="text-cyan-500" bg="from-cyan-500/10 to-cyan-600/5" />
      </div>

      {/* ── Secondary KPIs Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { l: "Completed", v: s?.completedLoads || 0, I: CheckCircle, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
          { l: "In Transit", v: s?.inTransitLoads || 0, I: Truck, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
          { l: "Pending", v: s?.pendingLoads || 0, I: Clock, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
          { l: "Cancelled", v: s?.cancelledLoads || 0, I: XCircle, c: "text-red-500", b: "from-red-500/10 to-red-600/5" },
          { l: "Vehicles", v: s?.vehicleCount || 0, I: Truck, c: "text-indigo-500", b: "from-indigo-500/10 to-indigo-600/5" },
          { l: "Drivers", v: s?.driverCount || 0, I: Users, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Partners", v: s?.partnerCount || 0, I: Handshake, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
          { l: "Agreements", v: s?.agreementCount || 0, I: FileText, c: "text-amber-500", b: "from-amber-500/10 to-amber-600/5" },
        ].map((k) => (
          <div key={k.l} className={cn("rounded-2xl p-3 bg-gradient-to-br border", L ? `${k.b} border-slate-200/60` : `${k.b} border-slate-700/30`)}>
            <k.I className={cn("w-4 h-4 mb-1", k.c)} />
            {ld ? <Skeleton className="h-6 w-8" /> : <p className={cn("text-xl font-bold", k.c)}>{k.v}</p>}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{k.l}</p>
          </div>
        ))}
      </div>

      {/* ── View Tabs ── */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === tab.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><tab.I className="w-3.5 h-3.5" />{tab.l}</button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Trend Chart */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Monthly Trends</span>
            </div>
            <CardContent className="p-4">
              {trendsQuery.isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : trends.length > 0 ? (
                <div className="space-y-2">
                  {trends.map((t: any, idx: number) => {
                    const maxRev = Math.max(...trends.map((x: any) => x.revenue || 0), 1);
                    const pct = Math.round(((t.revenue || 0) / maxRev) * 100);
                    return (
                      <div key={idx} className={cellCls}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-white")}>{t.period}</span>
                          </div>
                          <div className="text-right">
                            <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-sm">${(t.revenue || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 ml-2">{t.loads} loads · {(t.miles || 0).toLocaleString()} mi</span>
                          </div>
                        </div>
                        <div className={cn("h-1.5 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                          <div className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BarChart3 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-400">No trend data yet</p>
                  <p className="text-xs text-slate-500 mt-1">Data will appear as loads are completed</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className={titleCls}>Revenue This {period.charAt(0).toUpperCase() + period.slice(1)}</span>
            </div>
            <CardContent className="p-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-1">
                  {ld ? "—" : `$${(s?.revenue || 0).toLocaleString()}`}
                </p>
                {s?.revenueChange !== undefined && s?.revenueChange !== 0 && (
                  <span className={cn("text-xs font-bold", (s?.revenueChange || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                    {(s?.revenueChange || 0) >= 0 ? "▲" : "▼"} {Math.abs(s?.revenueChange || 0)}% vs prior period
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className={cn(cellCls, "text-center")}>
                  <p className="text-lg font-bold text-emerald-500">{ld ? "—" : `$${(s?.revenue || 0).toLocaleString()}`}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Gross</p>
                </div>
                <div className={cn(cellCls, "text-center")}>
                  <p className="text-lg font-bold text-blue-500">{ld ? "—" : `$${(s?.avgLoadValue || 0).toLocaleString()}`}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Avg / Load</p>
                </div>
                <div className={cn(cellCls, "text-center")}>
                  <p className="text-lg font-bold text-purple-500">{ld ? "—" : `$${s?.avgRatePerMile?.toFixed(2) || "0.00"}`}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Avg / Mile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ PERFORMANCE TAB ═══════════ */}
      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Scorecard */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Target className="w-4 h-4 text-green-500" />
              <span className={titleCls}>Performance Scorecard</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <PB label="On-Time Delivery" value={s?.onTimeRate || 0} gradient="from-green-500 to-emerald-500" color="text-green-500" />
              <PB label="Fleet Utilization" value={s?.fleetUtilization || 0} gradient="from-[#1473FF] to-[#BE01FF]" color="text-blue-500" />
              <PB label="Customer Satisfaction" value={s?.customerSatisfaction || 0} gradient="from-purple-500 to-pink-500" color="text-purple-500" />
              <PB label="Bid Acceptance Rate" value={s?.bidAcceptanceRate || 0} gradient="from-amber-500 to-orange-500" color="text-amber-500" />
              <PB label="Safety Score" value={s?.safetyScore || 0} gradient="from-cyan-500 to-blue-500" color="text-cyan-500" />
            </CardContent>
          </Card>

          {/* Operational KPIs */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Gauge className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Operational KPIs</span>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Avg Load Value", v: `$${(s?.avgLoadValue || 0).toLocaleString()}`, I: DollarSign, c: "text-emerald-500" },
                  { l: "Avg Rate / Mile", v: `$${s?.avgRatePerMile?.toFixed(2) || "0.00"}`, I: TrendingUp, c: "text-cyan-500" },
                  { l: "Total Miles", v: (s?.milesLogged || 0).toLocaleString(), I: MapPin, c: "text-purple-500" },
                  { l: "Completed Loads", v: s?.completedLoads || 0, I: CheckCircle, c: "text-green-500" },
                  { l: "Active Vehicles", v: s?.vehicleCount || 0, I: Truck, c: "text-indigo-500" },
                  { l: "Active Drivers", v: s?.driverCount || 0, I: Users, c: "text-blue-500" },
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

      {/* ═══════════ LOADS TAB ═══════════ */}
      {activeTab === "loads" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l: "Total", v: s?.totalLoads || 0, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
              { l: "Completed", v: s?.completedLoads || 0, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
              { l: "In Transit", v: s?.inTransitLoads || 0, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
              { l: "Pending", v: s?.pendingLoads || 0, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
              { l: "Cancelled", v: s?.cancelledLoads || 0, c: "text-red-500", b: "from-red-500/10 to-red-600/5" },
            ].map((k) => (
              <div key={k.l} className={cn("rounded-xl p-4 text-center bg-gradient-to-br border", L ? `${k.b} border-slate-200/60` : `${k.b} border-slate-700/30`)}>
                {ld ? <Skeleton className="h-8 w-12 mx-auto rounded" /> : <p className={cn("text-3xl font-bold", k.c)}>{k.v}</p>}
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{k.l}</p>
              </div>
            ))}
          </div>

          {/* Load trend mini chart */}
          {trends.length > 0 && (
            <Card className={cc}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
                <Package className="w-4 h-4 text-blue-500" />
                <span className={titleCls}>Load Volume by Month</span>
              </div>
              <CardContent className="p-4">
                <div className="flex items-end gap-1.5 h-28">
                  {trends.map((t: any, i: number) => {
                    const maxLoads = Math.max(...trends.map((x: any) => x.loads || 0), 1);
                    const h = Math.max(8, Math.round(((t.loads || 0) / maxLoads) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-bold">{t.loads}</span>
                        <div className="w-full rounded-t-md bg-gradient-to-t from-[#1473FF] to-[#BE01FF] transition-all duration-500" style={{ height: `${h}%` }} />
                        <span className="text-[8px] text-slate-500">{(t.period || "").slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ ACCOUNT TAB ═══════════ */}
      {activeTab === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Account Profile */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <User className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Account Overview</span>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center text-white text-lg font-bold">
                  {((user as any)?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={valCls}>{(user as any)?.name || "User"}</p>
                  <p className="text-xs text-slate-400">{(user as any)?.email || ""}</p>
                  <Badge className="mt-1 border-0 text-[10px] bg-blue-500/15 text-blue-400 uppercase">{userRole.replace(/_/g, " ")}</Badge>
                </div>
              </div>
              <div className={cn("border-t pt-4 space-y-3", L ? "border-slate-200" : "border-slate-700/30")}>
                {[
                  { l: "Company", v: s?.companyName || "—", I: Building2 },
                  { l: "Member Since", v: s?.memberSince ? new Date(s.memberSince).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—", I: Calendar },
                  { l: "Role", v: (s?.role || userRole).replace(/_/g, " "), I: ShieldCheck },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-3">
                    <r.I className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{r.l}</p>
                      <p className={cn("text-sm font-medium capitalize", L ? "text-slate-700" : "text-white")}>{r.v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All-Time Stats */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Award className="w-4 h-4 text-amber-500" />
              <span className={titleCls}>Lifetime Stats</span>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Total Revenue", v: `$${(s?.revenue || 0).toLocaleString()}`, c: "text-emerald-500", I: DollarSign },
                  { l: "Total Miles", v: `${(s?.milesLogged || 0).toLocaleString()} mi`, c: "text-purple-500", I: MapPin },
                  { l: "Total Loads", v: s?.totalLoads || 0, c: "text-blue-500", I: Package },
                  { l: "Completed Loads", v: s?.completedLoads || 0, c: "text-green-500", I: CheckCircle },
                  { l: "Active Partners", v: s?.partnerCount || 0, c: "text-purple-500", I: Handshake },
                  { l: "Active Agreements", v: s?.agreementCount || 0, c: "text-amber-500", I: FileText },
                  { l: "Fleet Size", v: s?.vehicleCount || 0, c: "text-indigo-500", I: Truck },
                  { l: "Team Size", v: s?.driverCount || 0, c: "text-blue-500", I: Users },
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
