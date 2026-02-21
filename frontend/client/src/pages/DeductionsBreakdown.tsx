/**
 * DEDUCTIONS BREAKDOWN PAGE
 * Driver-facing deductions detail screen showing all payroll deductions
 * including platform fees, insurance, fuel advances, equipment leases,
 * ELD fees, and other recurring or one-time charges.
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
  DollarSign, TrendingDown, FileText, Download, Calendar,
  RefreshCw, Shield, Truck, Fuel, CreditCard, Settings,
  ChevronRight, AlertTriangle, PieChart
} from "lucide-react";

type DeductionCategory = "all" | "recurring" | "one_time" | "advance";

const DEDUCTION_TYPES = [
  { id: "platform_fee", label: "Platform Fee", description: "EusoTrip transaction fee (3.5%)", category: "recurring", icon: <Settings className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/15" },
  { id: "insurance", label: "Insurance Deduction", description: "Cargo & liability coverage premium", category: "recurring", icon: <Shield className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-500/15" },
  { id: "fuel_advance", label: "Fuel Advance", description: "Pre-trip fuel card advance repayment", category: "advance", icon: <Fuel className="w-4 h-4" />, color: "text-orange-400", bg: "bg-orange-500/15" },
  { id: "equipment_lease", label: "Equipment Lease", description: "Vehicle/trailer lease payment", category: "recurring", icon: <Truck className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-500/15" },
  { id: "eld_fee", label: "ELD Service Fee", description: "Electronic logging device monthly charge", category: "recurring", icon: <CreditCard className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/15" },
  { id: "escrow", label: "Escrow Reserve", description: "Safety escrow deposit (refundable)", category: "recurring", icon: <DollarSign className="w-4 h-4" />, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  { id: "toll", label: "Toll Charges", description: "Transponder toll deductions", category: "one_time", icon: <CreditCard className="w-4 h-4" />, color: "text-slate-400", bg: "bg-slate-500/15" },
  { id: "maintenance", label: "Maintenance Charge", description: "Repair or service deduction", category: "one_time", icon: <Settings className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/15" },
];

export default function DeductionsBreakdown() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<DeductionCategory>("all");

  const walletQuery = (trpc as any).wallet?.getTransactions?.useQuery?.({ type: "deduction", limit: 50 }) ||
    (trpc as any).wallet?.getEarnings?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const transactions: any[] = Array.isArray(walletQuery.data) ? walletQuery.data :
    Array.isArray((walletQuery.data as any)?.transactions) ? (walletQuery.data as any).transactions : [];

  const deductions = transactions.filter((t: any) => t.type === "deduction" || t.type === "debit" || Number(t.amount) < 0);
  const isLoading = walletQuery.isLoading;

  const totalDeductions = deductions.reduce((sum: number, d: any) => sum + Math.abs(Number(d.amount || 0)), 0);
  const recurringTotal = deductions.filter((d: any) => d.category === "recurring" || d.recurring).reduce((sum: number, d: any) => sum + Math.abs(Number(d.amount || 0)), 0);

  const filteredTypes = DEDUCTION_TYPES.filter((dt) => filter === "all" || dt.category === filter);

  const filters: { id: DeductionCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "recurring", label: "Recurring" },
    { id: "one_time", label: "One-Time" },
    { id: "advance", label: "Advances" },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Deductions Breakdown
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Detailed view of all payroll deductions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")} onClick={() => walletQuery.refetch?.()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl" onClick={() => toast.info("Downloading deduction report...")}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <TrendingDown className="w-5 h-5 text-red-400" />, bg: "bg-red-500/15", value: `$${totalDeductions.toLocaleString()}`, label: "Total Deductions", color: "text-red-400" },
          { icon: <Settings className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: `$${recurringTotal.toLocaleString()}`, label: "Recurring", color: "text-blue-400" },
          { icon: <FileText className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: String(deductions.length), label: "Line Items", color: "text-purple-400" },
          { icon: <PieChart className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: DEDUCTION_TYPES.length.toString(), label: "Categories", color: "text-cyan-400" },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.02] border-white/[0.06]")}>
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

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === f.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-white/[0.06]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : (
        <>
          {/* Deduction Categories */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <TrendingDown className="w-5 h-5 text-red-500" />
                Deduction Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTypes.map((dt) => {
                const lineItems = deductions.filter((d: any) => d.deductionType === dt.id || d.category === dt.id);
                const subtotal = lineItems.reduce((sum: number, d: any) => sum + Math.abs(Number(d.amount || 0)), 0);

                return (
                  <div key={dt.id} className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                  )}>
                    <div className={cn("p-2.5 rounded-lg flex-shrink-0", dt.bg, dt.color)}>
                      {dt.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{dt.label}</p>
                        <Badge className={cn(
                          "text-[9px] border",
                          dt.category === "recurring" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                          dt.category === "advance" ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
                          "bg-slate-500/15 text-slate-400 border-slate-500/30"
                        )}>
                          {dt.category === "recurring" ? "Recurring" : dt.category === "advance" ? "Advance" : "One-Time"}
                        </Badge>
                      </div>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{dt.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-red-400">
                        {subtotal > 0 ? `-$${subtotal.toFixed(2)}` : "—"}
                      </p>
                      {lineItems.length > 0 && (
                        <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{lineItems.length} items</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent deduction transactions */}
          {deductions.length > 0 && (
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Calendar className="w-5 h-5 text-[#1473FF]" />
                  Recent Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deductions.slice(0, 10).map((d: any, i: number) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                          {d.description || d.deductionType || "Deduction"}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {d.date ? new Date(d.date).toLocaleDateString() : d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-red-400">
                      -${Math.abs(Number(d.amount || 0)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dispute notice */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          )}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Dispute a Deduction</p>
              <p className="text-xs mt-0.5 opacity-80">
                If you believe a deduction is incorrect, submit a dispute through the Support page
                within 30 days of the settlement date. Include the settlement number and deduction details.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
