/**
 * SETTLEMENT HISTORY PAGE
 * Driver-facing settlement statement history and detail viewer.
 * Shows weekly/bi-weekly settlement periods with gross, deductions, net,
 * and payment status. Integrates with wallet/billing data.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  DollarSign, FileText, Download, Calendar, CheckCircle,
  Clock, ChevronRight, RefreshCw, TrendingUp, ArrowRight,
  CreditCard, Truck
} from "lucide-react";

type PeriodFilter = "all" | "paid" | "pending" | "processing";

export default function SettlementHistory() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<PeriodFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const settlementsQuery = (trpc as any).wallet?.getSettlements?.useQuery?.() ||
    (trpc as any).billing?.getSettlements?.useQuery?.() ||
    { data: [], isLoading: false, refetch: () => {} };

  const earningsQuery = (trpc as any).wallet?.getEarnings?.useQuery?.() || { data: null, isLoading: false };

  const settlements: any[] = Array.isArray(settlementsQuery.data) ? settlementsQuery.data :
    Array.isArray((settlementsQuery.data as any)?.settlements) ? (settlementsQuery.data as any).settlements : [];

  const earnings = earningsQuery.data;
  const isLoading = settlementsQuery.isLoading;

  const filtered = settlements.filter((s: any) => {
    if (filter === "all") return true;
    return s.status === filter || s.paymentStatus === filter;
  });

  const totalPaid = settlements
    .filter((s: any) => s.status === "paid" || s.paymentStatus === "paid")
    .reduce((sum: number, s: any) => sum + Number(s.netAmount || s.amount || 0), 0);

  const totalPending = settlements
    .filter((s: any) => s.status === "pending" || s.paymentStatus === "pending")
    .reduce((sum: number, s: any) => sum + Number(s.netAmount || s.amount || 0), 0);

  const statusConfig = (status: string) => {
    switch (status) {
      case "paid": return { label: "Paid", cls: "bg-green-500/15 text-green-500 border-green-500/30" };
      case "processing": return { label: "Processing", cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" };
      case "pending": return { label: "Pending", cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" };
      default: return { label: status || "Unknown", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
    }
  };

  const filters: { id: PeriodFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "pending", label: "Pending" },
    { id: "processing", label: "Processing" },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Settlement History
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Payment statements and settlement periods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")}
            onClick={() => settlementsQuery.refetch?.()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl"
            onClick={() => toast.info("Downloading settlement report...")}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <DollarSign className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: `$${totalPaid.toLocaleString()}`, label: "Total Paid", color: "text-green-400" },
          { icon: <Clock className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: `$${totalPending.toLocaleString()}`, label: "Pending", color: "text-yellow-400" },
          { icon: <FileText className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(settlements.length), label: "Statements", color: "text-blue-400" },
          { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: settlements.length > 0 ? `$${Math.round(totalPaid / Math.max(1, settlements.filter((s: any) => s.status === "paid").length)).toLocaleString()}` : "$0", label: "Avg Settlement", color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                <div>
                  <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === f.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className={cn("font-medium text-lg", isLight ? "text-slate-600" : "text-slate-300")}>No Settlements Found</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
              Settlement statements will appear here after your first payment period
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((settlement: any, idx: number) => {
            const status = statusConfig(settlement.status || settlement.paymentStatus || "pending");
            const isExpanded = expandedId === idx;
            const gross = Number(settlement.grossAmount || settlement.amount || 0);
            const deductions = Number(settlement.deductions || 0);
            const net = Number(settlement.netAmount || gross - deductions);
            const periodStart = settlement.periodStart || settlement.startDate;
            const periodEnd = settlement.periodEnd || settlement.endDate;
            const tripCount = settlement.tripCount || settlement.loads || 0;

            return (
              <Card key={idx} className={cn(cc, "overflow-hidden cursor-pointer transition-all")} onClick={() => setExpandedId(isExpanded ? null : idx)}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        settlement.status === "paid" ? "bg-green-500/15" : "bg-blue-500/15"
                      )}>
                        {settlement.status === "paid"
                          ? <CheckCircle className="w-6 h-6 text-green-500" />
                          : <Clock className="w-6 h-6 text-blue-400" />
                        }
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                          {settlement.settlementNumber || settlement.referenceNumber || `Settlement #${idx + 1}`}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {periodStart ? new Date(periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}{" "}
                          {periodEnd ? `— ${new Date(periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                          {tripCount > 0 && ` · ${tripCount} trips`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn("text-lg font-bold tabular-nums", settlement.status === "paid" ? "text-green-500" : isLight ? "text-slate-800" : "text-white")}>
                          ${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Badge className={cn("text-[10px] border", status.cls)}>{status.label}</Badge>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={cn("px-5 py-4 space-y-2", isLight ? "bg-slate-50 border-t border-slate-100" : "bg-slate-800/30 border-t border-slate-700/30")}>
                      {[
                        { label: "Gross Earnings", amount: gross, positive: true },
                        { label: "Deductions", amount: -deductions, positive: false },
                        { label: "Net Settlement", amount: net, positive: true, bold: true },
                      ].map((line) => (
                        <div key={line.label} className={cn("flex items-center justify-between py-1", line.bold && "pt-2 border-t border-slate-200 dark:border-slate-700")}>
                          <p className={cn("text-sm", line.bold ? "font-bold" : "", isLight ? "text-slate-600" : "text-slate-300")}>{line.label}</p>
                          <p className={cn(
                            "text-sm tabular-nums",
                            line.bold ? "font-bold" : "font-medium",
                            line.positive ? isLight ? "text-slate-800" : "text-white" : "text-red-400"
                          )}>
                            {line.positive ? "" : "-"}${Math.abs(line.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}
                          onClick={(e: any) => { e.stopPropagation(); toast.info("Downloading settlement PDF..."); }}
                        >
                          <Download className="w-3 h-3 mr-1" /> PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
