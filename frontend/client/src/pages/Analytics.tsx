/**
 * ANALYTICS PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Shipper design standard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, DollarSign, Package, Truck, Users,
  Calendar, Download, ArrowUpRight, ArrowDownRight, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Analytics() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");

  const summaryQuery = (trpc as any).analytics.getSummary.useQuery({ period });
  const trendsQuery = (trpc as any).analytics.getTrends.useQuery({ period });
  const summary = summaryQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const periodTabs = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  const viewTabs = [
    { id: "overview", label: "Overview" },
    { id: "revenue", label: "Revenue" },
    { id: "loads", label: "Loads" },
  ];

  const ChangeIndicator = ({ value }: { value: number | undefined }) => {
    if (!value) return null;
    return (
      <span className={cn("flex items-center gap-0.5 text-xs font-bold", value >= 0 ? "text-green-500" : "text-red-500")}>
        {value >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Analytics</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Track performance and business metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {periodTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  period === tab.id
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                    : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button variant="outline" className={cn("rounded-xl text-sm", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `$${(summary?.revenue || 0).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-500/15", change: summary?.revenueChange },
          { label: "Loads", value: summary?.totalLoads || 0, icon: <Package className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/15", change: summary?.loadsChange },
          { label: "Miles", value: ((summary as any)?.distanceLogged || (summary as any)?.totalMiles || 0).toLocaleString(), icon: <Truck className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15", change: undefined },
          { label: "Avg $/Mile", value: `$${summary?.avgRatePerMile?.toFixed(2) || "0.00"}`, icon: <TrendingUp className="w-5 h-5" />, color: "text-cyan-500", bg: "bg-cyan-500/15", change: undefined },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <div>
                    {summaryQuery.isLoading ? (
                      <Skeleton className={cn("h-7 w-16 rounded-lg", isLight ? "bg-slate-200" : "")} />
                    ) : (
                      <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                    )}
                    <p className="text-[10px] text-slate-400 uppercase">{stat.label}</p>
                  </div>
                </div>
                <ChangeIndicator value={stat.change} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── View Tabs ── */}
      <div className="flex items-center gap-2">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <BarChart3 className="w-5 h-5 text-blue-500" />Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className={cn("h-12 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
              ) : (trendsQuery.data as any)?.length > 0 ? (
                <div className="space-y-3">
                  {(trendsQuery.data as any)?.map((trend: any, idx: number) => (
                    <div key={idx} className={cellCls}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-white")}>{trend.period}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-500 font-bold text-sm">${trend.revenue?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{trend.loads} loads</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <TrendingUp className="w-5 h-5 text-green-500" />Top Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "On-Time Delivery", value: summary?.onTimeRate || 0, gradient: "from-green-500 to-emerald-500", color: "text-green-500" },
                  { label: "Fleet Utilization", value: summary?.fleetUtilization || 0, gradient: "from-[#1473FF] to-[#BE01FF]", color: "text-blue-500" },
                  { label: "Customer Satisfaction", value: summary?.customerSatisfaction || 0, gradient: "from-purple-500 to-pink-500", color: "text-purple-500" },
                ].map((metric) => (
                  <div key={metric.label} className={cellCls}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{metric.label}</span>
                      <span className={cn("font-bold text-sm", metric.color)}>{metric.value}%</span>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                      <div className={cn("h-full rounded-full bg-gradient-to-r", metric.gradient)} style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Revenue Tab ── */}
      {activeTab === "revenue" && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <DollarSign className="w-5 h-5 text-emerald-500" />Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-500 mb-2">${(summary?.revenue || 0).toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Total Revenue This {period.charAt(0).toUpperCase() + period.slice(1)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Loads Tab ── */}
      {activeTab === "loads" && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Package className="w-5 h-5 text-blue-500" />Load Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Loads", value: summary?.totalLoads || 0, color: "text-blue-500" },
                { label: "Completed", value: summary?.completedLoads || 0, color: "text-green-500" },
                { label: "In Transit", value: summary?.inTransitLoads || 0, color: "text-cyan-500" },
                { label: "Pending", value: summary?.pendingLoads || 0, color: "text-yellow-500" },
              ].map((s) => (
                <div key={s.label} className={cn(cellCls, "text-center")}>
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
