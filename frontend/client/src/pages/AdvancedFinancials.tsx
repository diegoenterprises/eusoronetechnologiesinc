/**
 * ADVANCED FINANCIALS DASHBOARD
 * Multi-currency, 1099 management, collections, factoring, fuel cards,
 * profitability analytics, budget vs actual, cash flow forecasting.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  BarChart3, Clock, AlertTriangle, FileText, CreditCard, RefreshCw,
  Fuel, ArrowRightLeft, Users, MapPin, Wallet, PieChart, Target,
  CalendarDays, ShieldCheck, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "@/hooks/useLocale";

// ── helpers ──

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "--";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "--";
  return `${(n * 100).toFixed(1)}%`;
}

type Tab = "overview" | "collections" | "tax1099" | "currency" | "profitability" | "factoring" | "fuelCards" | "budget";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "collections", label: "Collections", icon: <Clock className="w-4 h-4" /> },
  { key: "tax1099", label: "1099 / Tax", icon: <FileText className="w-4 h-4" /> },
  { key: "currency", label: "Currency", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "profitability", label: "Profitability", icon: <PieChart className="w-4 h-4" /> },
  { key: "factoring", label: "Factoring", icon: <Wallet className="w-4 h-4" /> },
  { key: "fuelCards", label: "Fuel Cards", icon: <Fuel className="w-4 h-4" /> },
  { key: "budget", label: "Budget", icon: <Target className="w-4 h-4" /> },
];

const STATUS_COLORS: Record<string, string> = {
  current: "bg-green-500/20 text-green-400",
  follow_up: "bg-yellow-500/20 text-yellow-400",
  at_risk: "bg-orange-500/20 text-orange-400",
  escalated: "bg-red-500/20 text-red-400",
  generated: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  pending_review: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  below_threshold: "bg-slate-500/20 text-slate-400",
  satisfied: "bg-green-500/20 text-green-400",
  partially_satisfied: "bg-yellow-500/20 text-yellow-400",
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-red-500/20 text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("text-[10px] font-medium border-0", STATUS_COLORS[status] || "bg-slate-500/20 text-slate-400")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ── KPI Card ──

function KPICard({ icon, label, value, sub, accent = "cyan", isLight = false }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string; isLight?: boolean }) {
  const accentCls = accent === "emerald" ? "text-emerald-400" : accent === "red" ? "text-red-400" : accent === "amber" ? "text-amber-400" : accent === "purple" ? "text-purple-400" : "text-cyan-400";
  const bgCls = accent === "emerald" ? "bg-emerald-500/20" : accent === "red" ? "bg-red-500/20" : accent === "amber" ? "bg-amber-500/20" : accent === "purple" ? "bg-purple-500/20" : "bg-cyan-500/20";
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", bgCls)}>{icon}</div>
          <div>
            <p className={cn("text-xl font-bold", accentCls)}>{value}</p>
            <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"} uppercase tracking-wide`}>{label}</p>
            {sub && <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"} mt-0.5`}>{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 bg-slate-700/30 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 bg-slate-700/30 rounded-xl" />
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function AdvancedFinancials() {
  const { t, formatCurrency } = useLocale();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          {t('advancedFinancials.title')}
        </h1>
        <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
          Multi-currency, tax compliance, collections, profitability, and cash flow management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
            className={cn(
              "gap-1.5 text-xs",
              tab === t.key
                ? "bg-cyan-600 hover:bg-cyan-700 text-white border-0"
                : isLight
                  ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            )}
          >
            {t.icon}
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && <OverviewTab isLight={isLight} />}
      {tab === "collections" && <CollectionsTab isLight={isLight} />}
      {tab === "tax1099" && <Tax1099Tab isLight={isLight} />}
      {tab === "currency" && <CurrencyTab isLight={isLight} />}
      {tab === "profitability" && <ProfitabilityTab isLight={isLight} />}
      {tab === "factoring" && <FactoringTab isLight={isLight} />}
      {tab === "fuelCards" && <FuelCardsTab isLight={isLight} />}
      {tab === "budget" && <BudgetTab isLight={isLight} />}
    </div>
  );
}

// ═══ OVERVIEW TAB ═══

function OverviewTab({ isLight = false }: { isLight?: boolean }) {
  const dashQ = trpc.advancedFinancials.getFinancialDashboard.useQuery();
  const cashFlowQ = trpc.advancedFinancials.getCashFlowForecast.useQuery({ days: "30" });
  const expensesQ = trpc.advancedFinancials.getExpenseCategories.useQuery({});

  const dash = dashQ.data;
  const cf = cashFlowQ.data;
  const exp = expensesQ.data;

  if (dashQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<DollarSign className="w-5 h-5 text-cyan-400" />} label="MTD Revenue" value={fmtUSD(dash.revenue.mtd)} sub={`YTD: ${fmtUSD(dash.revenue.ytd)}`} accent="cyan" />
          <KPICard icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="Gross Margin" value={fmtPct(dash.grossMargin.mtd)} sub={`Net: ${fmtPct(dash.netMargin.mtd)}`} accent="emerald" />
          <KPICard icon={<Wallet className="w-5 h-5 text-purple-400" />} label="Cash on Hand" value={fmtUSD(dash.cashFlow.cashOnHand)} sub={`Net change: ${fmtUSD(dash.cashFlow.netChange)}`} accent="purple" />
          <KPICard icon={<Activity className="w-5 h-5 text-amber-400" />} label="Avg Rev/Load" value={fmtUSD(dash.loadMetrics.avgRevenuePerLoad)} sub={`${dash.loadMetrics.totalLoads} loads MTD`} accent="amber" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {dash?.trends && (
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Revenue Trend (5 Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dash.trends.map((t: any) => {
                  const maxRev = Math.max(...dash.trends.map((x: any) => x.revenue));
                  const pct = (t.revenue / maxRev) * 100;
                  return (
                    <div key={t.month} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-16 shrink-0">{t.month}</span>
                      <div className={`flex-1 ${isLight ? "bg-slate-200" : "bg-slate-700/30"} rounded-full h-5 relative overflow-hidden`}>
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/60 to-emerald-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{fmtUSD(t.revenue)}</span>
                      </div>
                      <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0 shrink-0">{fmtPct(t.margin)}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Breakdown */}
        {exp && (
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exp.categories.map((c: any) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{c.category}</span>
                    <div className={`flex-1 ${isLight ? "bg-slate-200" : "bg-slate-700/30"} rounded-full h-4 relative overflow-hidden`}>
                      <div className="absolute inset-y-0 left-0 bg-red-500/40 rounded-full" style={{ width: `${c.percentage}%` }} />
                    </div>
                    <span className="text-xs text-slate-300 w-16 text-right shrink-0">{fmtUSD(c.amount)}</span>
                    <span className="text-[10px] text-slate-500 w-10 text-right shrink-0">{c.percentage.toFixed(1)}%</span>
                  </div>
                ))}
                <div className={`flex justify-between pt-2 ${isLight ? "border-t border-slate-200" : "border-t border-slate-700/50"}`}>
                  <span className="text-xs font-medium text-slate-300">Total</span>
                  <span className="text-xs font-bold text-slate-200">{fmtUSD(exp.totalExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cash Flow & Projections */}
      {dash && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Cash Flow</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Operating</span><span className="text-xs text-emerald-400">{fmtUSD(dash.cashFlow.operating)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Investing</span><span className="text-xs text-red-400">{fmtUSD(dash.cashFlow.investing)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Financing</span><span className="text-xs text-red-400">{fmtUSD(dash.cashFlow.financing)}</span></div>
              <div className={`flex justify-between pt-2 ${isLight ? "border-t border-slate-200" : "border-t border-slate-700/50"}`}>
                <span className="text-xs font-medium text-slate-300">Net Change</span>
                <span className="text-xs font-bold text-cyan-400">{fmtUSD(dash.cashFlow.netChange)}</span>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Receivables</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Total AR</span><span className="text-xs text-slate-200">{fmtUSD(dash.receivables.total)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Current</span><span className="text-xs text-emerald-400">{fmtUSD(dash.receivables.current)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Overdue</span><span className="text-xs text-red-400">{fmtUSD(dash.receivables.overdue)}</span></div>
            </CardContent>
          </Card>
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Projections (Next Mo)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Revenue</span><span className="text-xs text-cyan-400">{fmtUSD(dash.projections.nextMonth.revenue)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Expenses</span><span className="text-xs text-red-400">{fmtUSD(dash.projections.nextMonth.expenses)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Margin</span><span className="text-xs text-emerald-400">{fmtPct(dash.projections.nextMonth.margin)}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 30-day cash flow forecast mini */}
      {cf && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>30-Day Cash Flow Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-24">
              {cf.forecast.map((d: any, i: number) => {
                const maxBal = Math.max(...cf.forecast.map((x: any) => x.balance));
                const minBal = Math.min(...cf.forecast.map((x: any) => x.balance));
                const range = maxBal - minBal || 1;
                const h = ((d.balance - minBal) / range) * 80 + 16;
                return (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-t", d.netCash >= 0 ? "bg-emerald-500/50" : "bg-red-500/50")}
                    style={{ height: `${h}%` }}
                    title={`${d.date}: ${fmtUSD(d.balance)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-500">Start: {fmtUSD(cf.startingBalance)}</span>
              <span className="text-[10px] text-slate-500">Min: {fmtUSD(cf.minimumBalance)} ({cf.minimumBalanceDate})</span>
              <span className="text-[10px] text-slate-500">End: {fmtUSD(cf.endingBalance)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ COLLECTIONS TAB ═══

function CollectionsTab({ isLight = false }: { isLight?: boolean }) {
  const queueQ = trpc.advancedFinancials.getCollectionsQueue.useQuery({ sortBy: "priority" });
  const analyticsQ = trpc.advancedFinancials.getCollectionsAnalytics.useQuery();

  const queue = queueQ.data;
  const analytics = analyticsQ.data;

  if (queueQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Analytics KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<Clock className="w-5 h-5 text-cyan-400" />} label="DSO" value={`${analytics.dso} days`} sub={`Trend: ${analytics.dsoTrend > 0 ? "+" : ""}${analytics.dsoTrend}`} accent="cyan" />
          <KPICard icon={<DollarSign className="w-5 h-5 text-amber-400" />} label="Outstanding" value={fmtUSD(analytics.totalOutstanding)} accent="amber" />
          <KPICard icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="Recovery Rate" value={`${analytics.recoveryRate}%`} accent="emerald" />
          <KPICard icon={<Activity className="w-5 h-5 text-purple-400" />} label="Collection Index" value={`${analytics.collectionEfficiencyIndex}`} accent="purple" />
        </div>
      )}

      {/* Aging Buckets */}
      {analytics && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Aging Buckets</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {analytics.agingBuckets.map((b: any) => (
                <div key={b.label} className={`${isLight ? "bg-slate-100 rounded-lg p-3" : "bg-slate-700/30 rounded-lg p-3"} text-center`}>
                  <p className="text-[10px] text-slate-400 uppercase">{b.label}</p>
                  <p className="text-sm font-bold text-slate-200 mt-1">{fmtUSD(b.amount)}</p>
                  <p className="text-[10px] text-slate-500">{b.count} invoices ({b.percentage}%)</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Table */}
      {queue && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Collections Queue</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                    <th className="text-left pb-2 pr-3">Invoice</th>
                    <th className="text-left pb-2 pr-3">Customer</th>
                    <th className="text-right pb-2 pr-3">Balance</th>
                    <th className="text-right pb-2 pr-3">Days</th>
                    <th className="text-center pb-2 pr-3">Priority</th>
                    <th className="text-center pb-2 pr-3">Status</th>
                    <th className="text-center pb-2">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items.map((item: any) => (
                    <tr key={item.id} className={`${isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-slate-700/20 hover:bg-slate-700/20"}`}>
                      <td className="py-2 pr-3 text-cyan-400 font-mono">{item.id}</td>
                      <td className="py-2 pr-3 text-slate-300">{item.customer}</td>
                      <td className={`py-2 pr-3 text-right ${isLight ? "text-slate-900" : "text-slate-200"} font-medium`}>{fmtUSD(item.balance)}</td>
                      <td className="py-2 pr-3 text-right text-slate-300">{item.daysOverdue}</td>
                      <td className="py-2 pr-3 text-center">
                        <span className={cn("text-[10px] font-bold", item.priorityScore > 70 ? "text-red-400" : item.priorityScore > 40 ? "text-amber-400" : "text-emerald-400")}>
                          {item.priorityScore}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-center"><StatusBadge status={item.status} /></td>
                      <td className="py-2 text-center text-slate-400">{item.contactAttempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-slate-400">Total Outstanding: <span className={`${isLight ? "text-slate-900" : "text-slate-200"} font-medium`}>{fmtUSD(queue.totalOutstanding)}</span></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ 1099 / TAX TAB ═══

function Tax1099Tab({ isLight = false }: { isLight?: boolean }) {
  const [taxYear, setTaxYear] = useState(2025);
  const summaryQ = trpc.advancedFinancials.get1099Summary.useQuery({ taxYear });
  const generateM = trpc.advancedFinancials.generate1099.useMutation();
  const [genResult, setGenResult] = useState<any>(null);

  const summary = summaryQ.data;

  const handleGenerate = async () => {
    const result = await generateM.mutateAsync({ taxYear, formType: "1099-NEC" as const });
    setGenResult(result);
  };

  if (summaryQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Tax Year:</span>
        {[2023, 2024, 2025].map((y) => (
          <Button
            key={y}
            size="sm"
            variant={taxYear === y ? "default" : "outline"}
            onClick={() => { setTaxYear(y); setGenResult(null); }}
            className={cn("text-xs", taxYear === y ? "bg-cyan-600 border-0" : isLight ? "bg-white border-slate-200 text-slate-600" : "bg-slate-800/50 border-slate-700/50 text-slate-300")}
          >
            {y}
          </Button>
        ))}
      </div>

      {/* Summary */}
      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={<Users className="w-5 h-5 text-cyan-400" />} label="Contractors" value={String(summary.totalContractors)} sub={`${summary.contractorsAboveThreshold} above $600`} accent="cyan" />
            <KPICard icon={<DollarSign className="w-5 h-5 text-emerald-400" />} label="Total Paid" value={fmtUSD(summary.totalAmountPaid)} accent="emerald" />
            <KPICard icon={<FileText className="w-5 h-5 text-purple-400" />} label="Forms Generated" value={String(summary.formsGenerated)} sub={`${summary.formsPending} pending`} accent="purple" />
            <KPICard icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} label="TIN Issues" value={String(summary.formsWithTINIssues)} sub={`Deadline: ${summary.filingDeadline}`} accent="amber" />
          </div>

          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>1099-NEC Generation</CardTitle>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs gap-1" onClick={handleGenerate} disabled={generateM.isPending}>
                <FileText className="w-3 h-3" />
                {generateM.isPending ? "Generating..." : "Generate Forms"}
              </Button>
            </CardHeader>
            <CardContent>
              {genResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    Generated {genResult.totalForms} forms for {genResult.taxYear} | Total: {fmtUSD(genResult.totalAmount)}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                          <th className="text-left pb-2 pr-3">Contractor</th>
                          <th className="text-left pb-2 pr-3">TIN</th>
                          <th className="text-right pb-2 pr-3">Amount</th>
                          <th className="text-center pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genResult.contractors.map((c: any) => (
                          <tr key={c.contractorId} className="border-b border-slate-700/20">
                            <td className="py-1.5 pr-3 text-slate-300">{c.name}</td>
                            <td className="py-1.5 pr-3 text-slate-500 font-mono text-[10px]">
                              {c.tin} {c.tinValidated && <ShieldCheck className="inline w-3 h-3 text-emerald-400" />}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-slate-200">{fmtUSD(c.totalNonemployeeCompensation)}</td>
                            <td className="py-1.5 text-center"><StatusBadge status={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Click "Generate Forms" to create 1099-NEC forms for tax year {taxYear}.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ═══ CURRENCY TAB ═══

function CurrencyTab({ isLight = false }: { isLight?: boolean }) {
  const ratesQ = trpc.advancedFinancials.getMultiCurrencyRates.useQuery();
  const convertM = trpc.advancedFinancials.convertCurrency.useMutation();
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("MXN");
  const [convResult, setConvResult] = useState<any>(null);

  const rates = ratesQ.data;

  const handleConvert = async () => {
    const result = await convertM.mutateAsync({ amount: parseFloat(amount) || 0, from: from as "USD" | "CAD" | "MXN", to: to as "USD" | "CAD" | "MXN", margin: 0.015 });
    setConvResult(result);
  };

  if (ratesQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Rates Grid */}
      {rates && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Live Exchange Rates (with 1.5% margin)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rates.rates.map((r: any) => (
                <div key={`${r.from}-${r.to}`} className={`${isLight ? "bg-slate-100 rounded-lg p-3" : "bg-slate-700/30 rounded-lg p-3"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">{r.from}</span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-bold text-emerald-400">{r.to}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-200 mt-1">{r.appliedRate.toFixed(4)}</p>
                  <p className="text-[10px] text-slate-500">Mid: {r.midMarketRate.toFixed(4)} | Spread: {r.spreadBps}bps</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Converter */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Currency Converter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`block w-32 mt-1 ${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-slate-700/50 border border-slate-600 text-slate-200"} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">From</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={`block mt-1 ${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-slate-700/50 border border-slate-600 text-slate-200"} rounded-md px-3 py-1.5 text-sm`}>
                <option value="USD">USD</option><option value="CAD">CAD</option><option value="MXN">MXN</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">To</label>
              <select value={to} onChange={(e) => setTo(e.target.value)} className={`block mt-1 ${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-slate-700/50 border border-slate-600 text-slate-200"} rounded-md px-3 py-1.5 text-sm`}>
                <option value="USD">USD</option><option value="CAD">CAD</option><option value="MXN">MXN</option>
              </select>
            </div>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs gap-1" onClick={handleConvert} disabled={convertM.isPending}>
              <RefreshCw className="w-3 h-3" />Convert
            </Button>
          </div>
          {convResult && (
            <div className={`mt-4 ${isLight ? "bg-slate-100" : "bg-slate-700/30"} rounded-lg p-4`}>
              <p className="text-lg font-bold text-emerald-400">
                {convResult.convertedAmount.toLocaleString()} {convResult.targetCurrency}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Rate: {convResult.appliedRate.toFixed(4)} | Mid-market: {convResult.midMarketRate.toFixed(4)} | Audit: {convResult.auditId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══ PROFITABILITY TAB ═══

function ProfitabilityTab({ isLight = false }: { isLight?: boolean }) {
  const laneQ = trpc.advancedFinancials.getProfitabilityByLane.useQuery({ limit: 10 });
  const customerQ = trpc.advancedFinancials.getProfitabilityByCustomer.useQuery({ limit: 10 });
  const termsQ = trpc.advancedFinancials.getPaymentTermsOptimization.useQuery();

  const lanes = laneQ.data;
  const customers = customerQ.data;
  const terms = termsQ.data;

  if (laneQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Lane Profitability */}
      {lanes && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><MapPin className="w-4 h-4" /> Lane Profitability</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                    <th className="text-left pb-2 pr-3">Lane</th>
                    <th className="text-right pb-2 pr-3">Miles</th>
                    <th className="text-right pb-2 pr-3">Loads</th>
                    <th className="text-right pb-2 pr-3">Rev/Mi</th>
                    <th className="text-right pb-2 pr-3">Cost/Mi</th>
                    <th className="text-right pb-2 pr-3">Margin</th>
                    <th className="text-center pb-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {lanes.lanes.map((l: any) => (
                    <tr key={`${l.origin}-${l.destination}`} className={`${isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-slate-700/20 hover:bg-slate-700/20"}`}>
                      <td className="py-1.5 pr-3 text-slate-300">{l.origin} → {l.destination}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-400">{l.miles}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-400">{l.loadsCount}</td>
                      <td className="py-1.5 pr-3 text-right text-cyan-400">${l.revenuePerMile}</td>
                      <td className="py-1.5 pr-3 text-right text-red-400">${l.costPerMile}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <span className={cn("font-medium", l.avgMargin > 0.25 ? "text-emerald-400" : l.avgMargin > 0.15 ? "text-amber-400" : "text-red-400")}>
                          {fmtPct(l.avgMargin)}
                        </span>
                      </td>
                      <td className="py-1.5 text-center">
                        {l.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400 inline" />}
                        {l.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400 inline" />}
                        {l.trend === "stable" && <span className="text-[10px] text-slate-500">--</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Profitability */}
      {customers && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><Users className="w-4 h-4" /> Customer Profitability</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                    <th className="text-left pb-2 pr-3">Customer</th>
                    <th className="text-right pb-2 pr-3">Revenue</th>
                    <th className="text-right pb-2 pr-3">Profit</th>
                    <th className="text-right pb-2 pr-3">Margin</th>
                    <th className="text-right pb-2 pr-3">LTV</th>
                    <th className="text-right pb-2 pr-3">Avg Pay</th>
                    <th className="text-center pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.customers.map((c: any) => (
                    <tr key={c.id} className={`${isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-slate-700/20 hover:bg-slate-700/20"}`}>
                      <td className="py-1.5 pr-3 text-slate-300">{c.name}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-200">{fmtUSD(c.totalRevenue)}</td>
                      <td className="py-1.5 pr-3 text-right text-emerald-400">{fmtUSD(c.grossProfit)}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <span className={cn("font-medium", c.margin > 0.25 ? "text-emerald-400" : c.margin > 0.15 ? "text-amber-400" : "text-red-400")}>{fmtPct(c.margin)}</span>
                      </td>
                      <td className="py-1.5 pr-3 text-right text-cyan-400">{fmtUSD(c.lifetimeValue)}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-400">{c.avgPayDays}d</td>
                      <td className="py-1.5 text-center"><StatusBadge status={c.riskScore} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Terms Optimization */}
      {terms && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Payment Terms Optimization</CardTitle>
            <p className="text-[10px] text-emerald-400">Projected cash flow improvement: {fmtUSD(terms.totalProjectedCashFlowImprovement)} | DSO impact: {terms.avgDSOImpact} days</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {terms.recommendations.map((r: any) => (
              <div key={r.customerId} className={`${isLight ? "bg-slate-100 rounded-lg p-3" : "bg-slate-700/30 rounded-lg p-3"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{r.customer}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] bg-red-500/20 text-red-400 border-0">{r.currentTerms}</Badge>
                    <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                    <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0">{r.suggestedTerms}</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{r.reason}</p>
                <p className="text-[10px] text-cyan-400 mt-0.5">Impact: {fmtUSD(r.projectedImpact)}/mo</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ FACTORING TAB ═══

function FactoringTab({ isLight = false }: { isLight?: boolean }) {
  const offersQ = trpc.advancedFinancials.getFactoringOffers.useQuery({});
  const revenueQ = trpc.advancedFinancials.getRevenueRecognition.useQuery({});

  const offers = offersQ.data;
  const rev = revenueQ.data;

  if (offersQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Eligible Summary */}
      {offers && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard icon={<Wallet className="w-5 h-5 text-cyan-400" />} label="Eligible Invoices" value={String(offers.eligibleInvoices)} accent="cyan" />
          <KPICard icon={<DollarSign className="w-5 h-5 text-emerald-400" />} label="Eligible Amount" value={fmtUSD(offers.totalEligibleAmount)} accent="emerald" />
          <KPICard icon={<CreditCard className="w-5 h-5 text-purple-400" />} label="Providers" value={String(offers.offers.length)} accent="purple" />
        </div>
      )}

      {/* Provider Cards */}
      {offers && (
        <div className="grid md:grid-cols-2 gap-4">
          {offers.offers.map((o: any) => (
            <Card key={o.provider} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-200">{o.provider}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-400">{o.rating}</span>
                    <span className="text-[10px] text-slate-500">/5</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Advance:</span> <span className="text-emerald-400 font-medium">{(o.advanceRate * 100).toFixed(0)}%</span></div>
                  <div><span className="text-slate-400">Fee:</span> <span className="text-red-400 font-medium">{(o.fee * 100).toFixed(1)}%</span></div>
                  <div><span className="text-slate-400">Max Days:</span> <span className="text-slate-200">{o.maxDays}</span></div>
                  <div><span className="text-slate-400">Recourse:</span> <span className={o.recourse ? "text-red-400" : "text-emerald-400"}>{o.recourse ? "Yes" : "No"}</span></div>
                  <div><span className="text-slate-400">Min:</span> <span className="text-slate-200">{fmtUSD(o.minInvoice)}</span></div>
                  <div><span className="text-slate-400">Max:</span> <span className="text-slate-200">{fmtUSD(o.maxInvoice)}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revenue Recognition */}
      {rev && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Revenue Recognition (ASC 606)</CardTitle>
            <p className="text-[10px] text-slate-500">Period: {rev.period} | Recognized: {fmtUSD(rev.recognizedRevenue)} / {fmtUSD(rev.totalContractValue)}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {rev.performanceObligations.map((po: any) => (
              <div key={po.id} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-12 shrink-0">{po.id}</span>
                <span className="text-xs text-slate-300 flex-1 truncate">{po.description}</span>
                <div className={`w-24 ${isLight ? "bg-slate-200" : "bg-slate-700/30"} rounded-full h-3 relative overflow-hidden shrink-0`}>
                  <div className="absolute inset-y-0 left-0 bg-cyan-500/50 rounded-full" style={{ width: `${po.allocatedValue > 0 ? (po.recognizedAmount / po.allocatedValue) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-slate-200 w-16 text-right shrink-0">{fmtUSD(po.recognizedAmount)}</span>
                <StatusBadge status={po.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ FUEL CARDS TAB ═══

function FuelCardsTab({ isLight = false }: { isLight?: boolean }) {
  const txnQ = trpc.advancedFinancials.getFuelCardTransactions.useQuery({ limit: 20 });
  const data = txnQ.data;

  if (txnQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={<Fuel className="w-5 h-5 text-cyan-400" />} label="Total Spend" value={fmtUSD(data.totalSpend)} accent="cyan" />
            <KPICard icon={<CreditCard className="w-5 h-5 text-emerald-400" />} label="Transactions" value={String(data.transactions.length)} accent="emerald" />
            <KPICard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="Flagged" value={String(data.flaggedCount)} accent="red" />
            <KPICard icon={<RefreshCw className="w-5 h-5 text-amber-400" />} label="Unreconciled" value={String(data.unreconciledCount)} accent="amber" />
          </div>

          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Fuel Card Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                      <th className="text-left pb-2 pr-3">ID</th>
                      <th className="text-left pb-2 pr-3">Driver</th>
                      <th className="text-left pb-2 pr-3">Station</th>
                      <th className="text-right pb-2 pr-3">Gallons</th>
                      <th className="text-right pb-2 pr-3">$/Gal</th>
                      <th className="text-right pb-2 pr-3">Total</th>
                      <th className="text-center pb-2 pr-3">Fraud</th>
                      <th className="text-center pb-2">Recon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t: any) => (
                      <tr key={t.id} className={cn("border-b border-slate-700/20", t.flagged && "bg-red-500/5")}>
                        <td className="py-1.5 pr-3 text-cyan-400 font-mono">{t.id}</td>
                        <td className="py-1.5 pr-3 text-slate-300">{t.driverName}</td>
                        <td className="py-1.5 pr-3 text-slate-400 truncate max-w-[120px]">{t.station}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-200">{t.gallons}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-400">${t.pricePerGallon}</td>
                        <td className={`py-1.5 pr-3 text-right ${isLight ? "text-slate-900" : "text-slate-200"} font-medium`}>{fmtUSD(t.totalAmount)}</td>
                        <td className="py-1.5 pr-3 text-center">
                          {t.flagged ? (
                            <Badge className="text-[9px] bg-red-500/20 text-red-400 border-0">{t.fraudScore}</Badge>
                          ) : (
                            <span className="text-[10px] text-emerald-400">{t.fraudScore}</span>
                          )}
                        </td>
                        <td className="py-1.5 text-center">
                          {t.reconciled ? <ShieldCheck className="w-3 h-3 text-emerald-400 inline" /> : <span className="text-[10px] text-slate-500">--</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ═══ BUDGET TAB ═══

function BudgetTab({ isLight = false }: { isLight?: boolean }) {
  const budgetQ = trpc.advancedFinancials.getBudgetVsActual.useQuery({ year: 2026 });
  const data = budgetQ.data;

  if (budgetQ.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {data && (
        <>
          {/* YTD Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={<DollarSign className="w-5 h-5 text-cyan-400" />} label="YTD Revenue" value={fmtUSD(data.ytdActualRevenue)} sub={`Budget: ${fmtUSD(data.ytdBudgetRevenue)}`} accent="cyan" />
            <KPICard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Revenue Variance"
              value={fmtUSD(data.ytdActualRevenue - data.ytdBudgetRevenue)}
              sub={fmtPct((data.ytdActualRevenue - data.ytdBudgetRevenue) / (data.ytdBudgetRevenue || 1))}
              accent={data.ytdActualRevenue >= data.ytdBudgetRevenue ? "emerald" : "red"}
            />
            <KPICard icon={<ArrowDownLeft className="w-5 h-5 text-red-400" />} label="YTD Expenses" value={fmtUSD(data.ytdActualExpenses)} sub={`Budget: ${fmtUSD(data.ytdBudgetExpenses)}`} accent="red" />
            <KPICard
              icon={<Target className="w-5 h-5 text-purple-400" />}
              label="YTD Profit"
              value={fmtUSD((data.ytdActualRevenue - data.ytdActualExpenses))}
              accent="purple"
            />
          </div>

          {/* Monthly Table */}
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Monthly Budget vs Actual ({data.year})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${isLight ? "text-slate-500 border-b border-slate-200" : "text-slate-400 border-b border-slate-700/50"}`}>
                      <th className="text-left pb-2 pr-3">Month</th>
                      <th className="text-right pb-2 pr-3">Budget Rev</th>
                      <th className="text-right pb-2 pr-3">Actual Rev</th>
                      <th className="text-right pb-2 pr-3">Variance</th>
                      <th className="text-right pb-2 pr-3">Budget Exp</th>
                      <th className="text-right pb-2 pr-3">Actual Exp</th>
                      <th className="text-right pb-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.months.map((m: any) => (
                      <tr key={m.month} className={`${isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-slate-700/20 hover:bg-slate-700/20"}`}>
                        <td className="py-1.5 pr-3 text-slate-300">{m.month}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-400">{fmtUSD(m.budgetRevenue)}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-200">{m.actualRevenue != null ? fmtUSD(m.actualRevenue) : <span className="text-slate-600">--</span>}</td>
                        <td className="py-1.5 pr-3 text-right">
                          {m.revenueVariance != null ? (
                            <span className={m.revenueVariance >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {m.revenueVariance >= 0 ? "+" : ""}{fmtUSD(m.revenueVariance)}
                            </span>
                          ) : <span className="text-slate-600">--</span>}
                        </td>
                        <td className="py-1.5 pr-3 text-right text-slate-400">{fmtUSD(m.budgetExpenses)}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-200">{m.actualExpenses != null ? fmtUSD(m.actualExpenses) : <span className="text-slate-600">--</span>}</td>
                        <td className="py-1.5 text-right">
                          {m.actualProfit != null ? (
                            <span className={cn("font-medium", m.actualProfit >= 0 ? "text-emerald-400" : "text-red-400")}>{fmtUSD(m.actualProfit)}</span>
                          ) : <span className="text-slate-600">--</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
