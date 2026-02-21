/**
 * EARNINGS PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Shipper design standard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, Clock, CheckCircle, Download,
  ArrowUpRight, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Earnings() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [period, setPeriod] = useState("week");

  const earningsQuery = (trpc as any).earnings.getHistory.useQuery({ period: period as "week" | "month" | "quarter" | "year" });
  const summaryQuery = (trpc as any).earnings.getSummary.useQuery({ period: period as "week" | "month" | "quarter" | "year" });
  const summary = summaryQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      paid: "bg-green-500/15 text-green-500 border-green-500/30",
      pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      processing: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    };
    return <Badge className={cn("border text-[10px] font-bold", m[s] || "bg-slate-500/15 text-slate-400 border-slate-500/30")}>{s?.charAt(0).toUpperCase() + s?.slice(1) || "Unknown"}</Badge>;
  };

  const periodTabs = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Earnings</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Track your income and payment history</p>
        </div>
        <Button variant="outline" className={cn("rounded-xl text-sm", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-white/[0.06]")}>
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* ── Total Earnings Hero ── */}
      <div className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-white/[0.03] border-white/[0.06]")}>
        <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Earnings ({period})</p>
              {summaryQuery.isLoading ? <Skeleton className={cn("h-12 w-48 rounded-xl mt-1", isLight ? "bg-slate-200" : "")} /> : (
                <p className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">${(summary?.total || 0).toLocaleString()}</p>
              )}
              {summary?.change && (
                <p className={cn("text-sm mt-2 flex items-center gap-1", summary.change >= 0 ? "text-green-500" : "text-red-500")}>
                  <ArrowUpRight className={cn("w-4 h-4", summary.change < 0 && "rotate-180")} />
                  {Math.abs(summary.change)}% from last {period}
                </p>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
              <DollarSign className="w-10 h-10 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Paid", value: `$${(summary?.paid || 0).toLocaleString()}`, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
          { label: "Pending", value: `$${(summary?.pending || 0).toLocaleString()}`, icon: <Clock className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
          { label: "Loads", value: summary?.loadsCompleted || 0, icon: <TrendingUp className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/15" },
          { label: "Avg/Load", value: `$${(summary?.avgPerLoad || 0).toLocaleString()}`, icon: <Calendar className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  {summaryQuery.isLoading ? (
                    <Skeleton className={cn("h-8 w-16 rounded-lg", isLight ? "bg-slate-200" : "")} />
                  ) : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Period Filter ── */}
      <div className="flex items-center gap-2">
        {periodTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              period === tab.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-white/[0.06]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Earnings History ── */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
            <DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {earningsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className={cn("h-16 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
          ) : (earningsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                <DollarSign className="w-8 h-8 text-slate-400" />
              </div>
              <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No earnings yet</p>
              <p className="text-sm text-slate-400 mt-1">Complete loads to start earning</p>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {(earningsQuery.data as any)?.map((earning: any) => (
                <div key={earning.id} className={cn("p-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.04]")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", earning.status === "paid" ? "bg-green-500/15" : "bg-yellow-500/15")}>
                        <DollarSign className={cn("w-5 h-5", earning.status === "paid" ? "text-green-500" : "text-yellow-500")} />
                      </div>
                      <div>
                        <p className={valCls}>{earning.loadNumber}</p>
                        <p className="text-sm text-slate-400">{earning.description}</p>
                        <p className="text-xs text-slate-400">{earning.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-xl">${earning.amount?.toLocaleString()}</p>
                      {statusBadge(earning.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
