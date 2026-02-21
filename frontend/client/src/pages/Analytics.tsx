/**
 * ANALYTICS — Business Intelligence Dashboard
 * Premium metrics, trends, and performance insights.
 * 100% Dynamic | Theme-aware | Brand gradient.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, DollarSign, Package, Truck,
  Calendar, Download, ArrowUpRight, ArrowDownRight, BarChart3, Activity, Target, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Analytics() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");

  const summaryQuery = (trpc as any).analytics?.getSummary?.useQuery?.({ period }) || { data: null, isLoading: false };
  const trendsQuery = (trpc as any).analytics?.getTrends?.useQuery?.({ period }) || { data: null, isLoading: false };
  const summary = summaryQuery.data;

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const titleCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");
  const cellCls = cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const CI = ({ value }: { value: number | undefined }) => {
    if (!value) return null;
    return (
      <span className={cn("flex items-center gap-0.5 text-[10px] font-bold", value >= 0 ? "text-green-500" : "text-red-500")}>
        {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Analytics</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Activity className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Insights</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Business intelligence & performance metrics</p>
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

      {/* ── Pulse Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Revenue", v: `$${(summary?.revenue || 0).toLocaleString()}`, I: DollarSign, c: "text-emerald-500", b: "from-emerald-500/10 to-emerald-600/5", ch: summary?.revenueChange },
          { l: "Loads", v: summary?.totalLoads || 0, I: Package, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5", ch: summary?.loadsChange },
          { l: "Miles", v: ((summary as any)?.distanceLogged || (summary as any)?.totalMiles || 0).toLocaleString(), I: Truck, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
          { l: "Avg $/Mile", v: `$${summary?.avgRatePerMile?.toFixed(2) || "0.00"}`, I: TrendingUp, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
        ].map((s: any) => (
          <div key={s.l} className={cn("rounded-2xl p-4 bg-gradient-to-br border", L ? `${s.b} border-slate-200/60` : `${s.b} border-slate-700/30`)}>
            <div className="flex items-center justify-between mb-2">
              <s.I className={cn("w-4 h-4", s.c)} />
              {s.ch && <CI value={s.ch} />}
            </div>
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-20 rounded-lg" /> : (
              <p className={cn("text-2xl font-bold tracking-tight", s.c)}>{s.v}</p>
            )}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* ── View Tabs ── */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {[{ id: "overview", l: "Overview", I: BarChart3 }, { id: "revenue", l: "Revenue", I: DollarSign }, { id: "loads", l: "Loads", I: Package }].map((tab: any) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === tab.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><tab.I className="w-3.5 h-3.5" />{tab.l}</button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className={titleCls}>Performance Trends</span>
            </div>
            <CardContent className="p-4">
              {trendsQuery.isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map((i: number) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : (trendsQuery.data as any)?.length > 0 ? (
                <div className="space-y-2.5">
                  {(trendsQuery.data as any)?.map((trend: any, idx: number) => (
                    <div key={idx} className={cellCls}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <span className={cn("text-sm font-medium", L ? "text-slate-700" : "text-white")}>{trend.period}</span>
                        </div>
                        <div className="text-right">
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-sm">${trend.revenue?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{trend.loads} loads</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BarChart3 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-400">No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <Target className="w-4 h-4 text-green-500" />
              <span className={titleCls}>Performance Scorecard</span>
            </div>
            <CardContent className="p-4 space-y-4">
              {[
                { label: "On-Time Delivery", value: summary?.onTimeRate || 0, gradient: "from-green-500 to-emerald-500", color: "text-green-500" },
                { label: "Fleet Utilization", value: summary?.fleetUtilization || 0, gradient: "from-[#1473FF] to-[#BE01FF]", color: "text-blue-500" },
                { label: "Customer Satisfaction", value: summary?.customerSatisfaction || 0, gradient: "from-purple-500 to-pink-500", color: "text-purple-500" },
              ].map((m) => (
                <div key={m.label} className={cellCls}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>{m.label}</span>
                    <span className={cn("font-bold text-sm", m.color)}>{m.value}%</span>
                  </div>
                  <div className={cn("h-2 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                    <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", m.gradient)} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Revenue Tab ── */}
      {activeTab === "revenue" && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className={titleCls}>Revenue Breakdown</span>
          </div>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-1">${(summary?.revenue || 0).toLocaleString()}</p>
              <p className="text-sm text-slate-400">Total Revenue This {period.charAt(0).toUpperCase() + period.slice(1)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { l: "Gross", v: `$${(summary?.revenue || 0).toLocaleString()}`, c: "text-emerald-500" },
                { l: "Expenses", v: `$${(summary?.expenses || 0).toLocaleString()}`, c: "text-red-500" },
                { l: "Net Profit", v: `$${((summary?.revenue || 0) - (summary?.expenses || 0)).toLocaleString()}`, c: "text-blue-500" },
              ].map((r) => (
                <div key={r.l} className={cn(cellCls, "text-center")}>
                  <p className={cn("text-lg font-bold", r.c)}>{r.v}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">{r.l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Loads Tab ── */}
      {activeTab === "loads" && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <Package className="w-4 h-4 text-blue-500" />
            <span className={titleCls}>Load Statistics</span>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: "Total", v: summary?.totalLoads || 0, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
                { l: "Completed", v: summary?.completedLoads || 0, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
                { l: "In Transit", v: summary?.inTransitLoads || 0, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
                { l: "Pending", v: summary?.pendingLoads || 0, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
              ].map((s) => (
                <div key={s.l} className={cn("rounded-xl p-4 text-center bg-gradient-to-br border", L ? `${s.b} border-slate-200/60` : `${s.b} border-slate-700/30`)}>
                  <p className={cn("text-3xl font-bold", s.c)}>{s.v}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
