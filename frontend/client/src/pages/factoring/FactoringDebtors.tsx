/**
 * FACTORING DEBTORS + SHIPPER CREDIT CHECK (B-042)
 * Gold Standard — Debtor account management with integrated credit check.
 * Displays debtor list, credit scores, payment behavior, aging,
 * and one-click credit verification for shippers/brokers.
 * Theme-aware | Brand gradient | Jony Ive aesthetic
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Users, Search, Shield, CheckCircle, AlertTriangle, Clock,
  TrendingUp, TrendingDown, DollarSign, FileText, Building2,
  Star, Activity, ChevronRight, ShieldCheck, XCircle
} from "lucide-react";

interface Debtor {
  id: string;
  name: string;
  type: "shipper" | "broker";
  creditScore: number;
  creditRating: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  totalFactored: number;
  outstanding: number;
  avgDaysToPay: number;
  invoiceCount: number;
  lastPayment: string;
  trend: "up" | "down" | "stable";
  riskLevel: "low" | "medium" | "high";
}

export default function FactoringDebtors() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [creditCheckEntity, setCreditCheckEntity] = useState("");
  const [creditCheckResult, setCreditCheckResult] = useState<any>(null);

  // Real tRPC queries
  const debtorsQuery = (trpc as any).factoring.getDebtors.useQuery({ search: search || undefined });
  const statsQuery = (trpc as any).factoring.getDebtorStats.useQuery();
  const creditCheckMut = (trpc as any).factoring.runCreditCheck.useMutation({
    onSuccess: (data: any) => {
      setCreditCheckResult(data);
      toast.success("Credit check complete");
    },
    onError: () => toast.error("Credit check failed"),
  });

  const filtered: Debtor[] = (debtorsQuery.data || []).map((d: any) => ({
    ...d,
    creditRating: d.creditRating || "N/A",
  }));

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sub = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const getRatingColor = (rating: string) => {
    if (rating.startsWith("A")) return "text-green-500";
    if (rating.startsWith("B")) return "text-yellow-500";
    if (rating === "C") return "text-orange-500";
    return "text-red-500";
  };

  const getRatingBg = (rating: string) => {
    if (rating.startsWith("A")) return "bg-green-500/15 border-green-500/30";
    if (rating.startsWith("B")) return "bg-yellow-500/15 border-yellow-500/30";
    if (rating === "C") return "bg-orange-500/15 border-orange-500/30";
    return "bg-red-500/15 border-red-500/30";
  };

  const getRiskBadge = (risk: string) => {
    if (risk === "low") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (risk === "medium") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/15 text-red-500 border-red-500/30";
  };

  const checking = creditCheckMut.isPending;

  const runCreditCheck = () => {
    if (!creditCheckEntity.trim()) { toast.error("Enter a company name or MC/DOT number"); return; }
    creditCheckMut.mutate({ entityName: creditCheckEntity });
  };

  const totals = statsQuery.data || { outstanding: 0, factored: 0, avgDays: 0, highRisk: 0, totalDebtors: 0 };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Debtor Management
          </h1>
          <p className={sub}>Debtor accounts, credit scores & payment behavior</p>
        </div>
        <Badge className="rounded-full px-3 py-1 text-xs font-medium border bg-[#1473FF]/15 text-[#1473FF] border-[#1473FF]/30">
          {totals.totalDebtors || filtered.length} Active Debtors
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Outstanding", value: totals.outstanding >= 1000000 ? `$${(totals.outstanding / 1000000).toFixed(1)}M` : `$${(totals.outstanding / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-[#1473FF]", bg: "from-[#1473FF]/20 to-[#BE01FF]/20" },
          { label: "Total Factored", value: totals.factored >= 1000000 ? `$${(totals.factored / 1000000).toFixed(1)}M` : `$${(totals.factored / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-green-500", bg: "from-green-500/20 to-emerald-500/20" },
          { label: "Avg Days to Pay", value: `${totals.avgDays || 0}`, icon: Clock, color: "text-yellow-500", bg: "from-yellow-500/20 to-orange-500/20" },
          { label: "High Risk", value: `${totals.highRisk || 0}`, icon: AlertTriangle, color: "text-red-500", bg: "from-red-500/20 to-orange-500/20" },
        ].map((s) => (
          <Card key={s.label} className={cc}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold tabular-nums", isLight ? "text-slate-800" : "text-white")}>{s.value}</p>
                  <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debtor List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
            <Input
              placeholder="Search debtors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-9 rounded-xl h-11", isLight ? "border-slate-200" : "border-slate-700 bg-slate-800/50")}
            />
          </div>

          <div className="space-y-2">
            {filtered.map((d) => (
              <Card
                key={d.id}
                className={cn(cc, "cursor-pointer transition-all hover:shadow-md", selectedDebtor?.id === d.id && "ring-2 ring-[#1473FF]/50")}
                onClick={() => setSelectedDebtor(d)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border text-lg font-bold", getRatingBg(d.creditRating), getRatingColor(d.creditRating))}>
                        {d.creditRating}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>{d.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={cn("rounded-full px-2 py-0 text-[10px] border", d.type === "shipper" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20")}>
                            {d.type}
                          </Badge>
                          <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                            {d.invoiceCount} invoices
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={cn("text-sm font-semibold tabular-nums", isLight ? "text-slate-800" : "text-white")}>
                          ${(d.outstanding / 1000).toFixed(0)}K
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>outstanding</p>
                      </div>
                      <Badge className={cn("rounded-full px-2 py-0.5 text-[10px] border", getRiskBadge(d.riskLevel))}>
                        {d.riskLevel}
                      </Badge>
                      <ChevronRight className={cn("w-4 h-4", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar: Credit Check (B-042) + Debtor Detail */}
        <div className="space-y-4">
          {/* Shipper Credit Check */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                  <ShieldCheck className="w-4 h-4 text-[#1473FF]" />
                </div>
                <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
                  Credit Check
                </span>
              </div>
              <p className={cn("text-xs mb-3", isLight ? "text-slate-400" : "text-slate-500")}>
                Verify shipper or broker creditworthiness before factoring
              </p>
              <Input
                placeholder="Company name or MC/DOT #"
                value={creditCheckEntity}
                onChange={(e) => setCreditCheckEntity(e.target.value)}
                className={cn("rounded-xl h-10 mb-2", isLight ? "border-slate-200" : "border-slate-700 bg-slate-800/50")}
              />
              <Button
                onClick={runCreditCheck}
                disabled={checking}
                className="w-full rounded-xl h-10 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-blue-500/25"
              >
                {checking ? <Activity className="w-4 h-4 animate-spin mr-1.5" /> : <Search className="w-4 h-4 mr-1.5" />}
                {checking ? "Checking..." : "Run Credit Check"}
              </Button>

              {creditCheckResult && (
                <div className={cn("mt-4 p-4 rounded-xl space-y-2.5", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>{creditCheckResult.name}</span>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border text-sm font-bold", getRatingBg(creditCheckResult.rating), getRatingColor(creditCheckResult.rating))}>
                      {creditCheckResult.rating}
                    </div>
                  </div>
                  {[
                    { label: "Credit Score", value: creditCheckResult.score },
                    { label: "Avg Days to Pay", value: `${creditCheckResult.avgDaysToPay} days` },
                    { label: "Years in Business", value: creditCheckResult.yearsInBusiness },
                    { label: "Public Records", value: creditCheckResult.publicRecords },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>{row.label}</span>
                      <span className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{row.value}</span>
                    </div>
                  ))}
                  <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg mt-2 text-xs font-medium",
                    creditCheckResult.recommendation === "approve"
                      ? isLight ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"
                      : isLight ? "bg-yellow-50 text-yellow-700" : "bg-yellow-500/10 text-yellow-400"
                  )}>
                    {creditCheckResult.recommendation === "approve"
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Recommended for factoring</>
                      : <><AlertTriangle className="w-3.5 h-3.5" /> Manual review recommended</>
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Debtor Detail */}
          {selectedDebtor && (
            <Card className={cc}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                    <Building2 className="w-4 h-4 text-[#1473FF]" />
                  </div>
                  <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
                    Debtor Detail
                  </span>
                </div>
                <p className={cn("font-semibold mb-3", isLight ? "text-slate-800" : "text-white")}>{selectedDebtor.name}</p>
                <div className="space-y-2">
                  {[
                    { label: "Credit Score", value: selectedDebtor.creditScore },
                    { label: "Total Factored", value: `$${(selectedDebtor.totalFactored / 1000).toFixed(0)}K` },
                    { label: "Outstanding", value: `$${(selectedDebtor.outstanding / 1000).toFixed(0)}K` },
                    { label: "Avg Days to Pay", value: `${selectedDebtor.avgDaysToPay} days` },
                    { label: "Last Payment", value: selectedDebtor.lastPayment },
                    { label: "Invoice Count", value: selectedDebtor.invoiceCount },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>{row.label}</span>
                      <span className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {selectedDebtor.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                  {selectedDebtor.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                  {selectedDebtor.trend === "stable" && <Activity className="w-3.5 h-3.5 text-yellow-500" />}
                  <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                    Payment trend: {selectedDebtor.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
