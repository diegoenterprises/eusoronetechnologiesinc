/**
 * AR AGING ALERTS — GAP-234
 * Real-time accounts receivable aging with alert thresholds, risk tiers,
 * visual breakdown by aging bucket, and Stripe + DB invoice data.
 * Wired to: accounting.getAgingReport, billing.getInvoiceStats, payments.getReceivables
 */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart3, Clock, AlertTriangle, DollarSign, TrendingDown,
  ShieldAlert, Bell, CheckCircle, AlertCircle, RefreshCw,
} from "lucide-react";

// ── Alert thresholds ──
const THRESHOLDS = {
  days31to60Warning: 5000,   // Warn if 31-60d bucket exceeds $5k
  days61to90Critical: 2000,  // Critical if 61-90d exceeds $2k
  over90Severe: 1000,        // Severe if 90+d exceeds $1k
  overdueCountAlert: 3,      // Alert if >3 overdue invoices
};

type RiskLevel = "low" | "moderate" | "high" | "critical";

function getRiskLevel(aging: any): RiskLevel {
  if (!aging) return "low";
  if (aging.over90?.amount > THRESHOLDS.over90Severe) return "critical";
  if (aging.days61to90?.amount > THRESHOLDS.days61to90Critical) return "high";
  if (aging.days31to60?.amount > THRESHOLDS.days31to60Warning) return "moderate";
  return "low";
}

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  low: { label: "Low Risk", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle className="w-4 h-4" /> },
  moderate: { label: "Moderate", bg: "bg-amber-500/20", text: "text-amber-400", icon: <AlertCircle className="w-4 h-4" /> },
  high: { label: "High Risk", bg: "bg-orange-500/20", text: "text-orange-400", icon: <AlertTriangle className="w-4 h-4" /> },
  critical: { label: "Critical", bg: "bg-red-500/20", text: "text-red-400", icon: <ShieldAlert className="w-4 h-4" /> },
};

export default function FactoringAging() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Real data from accounting + billing routers — auto-refresh every 60s
  const agingQuery = (trpc as any).accounting?.getAgingReport?.useQuery?.(undefined, {
    refetchInterval: 60_000,
  }) || { data: null, isLoading: false };

  const invoiceStatsQuery = (trpc as any).billing?.getInvoiceStats?.useQuery?.() ||
    { data: null, isLoading: false };

  const receivablesQuery = (trpc as any).payments?.getReceivables?.useQuery?.() ||
    { data: [], isLoading: false };

  const aging = agingQuery.data;
  const invStats = invoiceStatsQuery.data;
  const receivables = Array.isArray(receivablesQuery.data) ? receivablesQuery.data : [];

  const riskLevel = useMemo(() => getRiskLevel(aging), [aging]);
  const riskConfig = RISK_CONFIG[riskLevel];

  // Build aging buckets from real data
  const buckets = useMemo(() => [
    {
      label: "Current",
      range: "0-30 days",
      gradient: "from-emerald-500 to-green-600",
      barColor: "bg-emerald-500",
      amount: aging?.current?.amount || aging?.days1to30?.amount || 0,
      count: aging?.current?.count || aging?.days1to30?.count || 0,
      severity: "low" as const,
    },
    {
      label: "31-60 Days",
      range: "31-60 days",
      gradient: "from-amber-500 to-yellow-600",
      barColor: "bg-amber-500",
      amount: aging?.days31to60?.amount || 0,
      count: aging?.days31to60?.count || 0,
      severity: (aging?.days31to60?.amount || 0) > THRESHOLDS.days31to60Warning ? "moderate" as const : "low" as const,
    },
    {
      label: "61-90 Days",
      range: "61-90 days",
      gradient: "from-orange-500 to-red-500",
      barColor: "bg-orange-500",
      amount: aging?.days61to90?.amount || 0,
      count: aging?.days61to90?.count || 0,
      severity: (aging?.days61to90?.amount || 0) > THRESHOLDS.days61to90Critical ? "high" as const : "low" as const,
    },
    {
      label: "90+ Days",
      range: "Over 90 days",
      gradient: "from-red-500 to-red-700",
      barColor: "bg-red-500",
      amount: aging?.over90?.amount || 0,
      count: aging?.over90?.count || 0,
      severity: (aging?.over90?.amount || 0) > THRESHOLDS.over90Severe ? "critical" as const : "low" as const,
    },
  ], [aging]);

  const totalOutstanding = aging?.total?.amount || buckets.reduce((s, b) => s + b.amount, 0);
  const maxBucket = Math.max(...buckets.map(b => b.amount), 1);

  // Generate alert messages
  const alerts = useMemo(() => {
    const msgs: { level: RiskLevel; text: string }[] = [];
    if ((aging?.over90?.amount || 0) > THRESHOLDS.over90Severe)
      msgs.push({ level: "critical", text: `$${aging.over90.amount.toLocaleString()} in 90+ day receivables — immediate collection action recommended` });
    if ((aging?.days61to90?.amount || 0) > THRESHOLDS.days61to90Critical)
      msgs.push({ level: "high", text: `$${aging.days61to90.amount.toLocaleString()} in 61-90 day receivables — escalate collection efforts` });
    if ((aging?.days31to60?.amount || 0) > THRESHOLDS.days31to60Warning)
      msgs.push({ level: "moderate", text: `$${aging.days31to60.amount.toLocaleString()} in 31-60 day receivables — send payment reminders` });
    if ((invStats?.overdue || 0) > THRESHOLDS.overdueCountAlert)
      msgs.push({ level: "high", text: `${invStats.overdue} overdue invoices detected — review and follow up` });
    return msgs;
  }, [aging, invStats]);

  const isLoading = agingQuery.isLoading || invoiceStatsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            AR Aging Alerts
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Accounts receivable aging with automated alert thresholds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border-0 text-xs px-3 py-1", riskConfig.bg, riskConfig.text)}>
            {riskConfig.icon}
            <span className="ml-1">{riskConfig.label}</span>
          </Badge>
          <Badge className={cn("border-0 text-[10px] px-2 py-0.5", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>
            <RefreshCw className="w-3 h-3 mr-1" />Auto-refresh 60s
          </Badge>
        </div>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const ac = RISK_CONFIG[alert.level];
            return (
              <div key={i} className={cn(
                "rounded-xl p-3 flex items-center gap-3 border",
                alert.level === "critical" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20") :
                alert.level === "high" ? (isLight ? "bg-orange-50 border-orange-200" : "bg-orange-500/10 border-orange-500/20") :
                isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20"
              )}>
                <Bell className={cn("w-5 h-5 flex-shrink-0", ac.text)} />
                <p className={cn("text-sm font-medium flex-1", ac.text)}>{alert.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <DollarSign className="w-6 h-6 text-blue-400" />, label: "Total Outstanding", value: `$${totalOutstanding.toLocaleString()}`, color: "text-blue-400" },
          { icon: <AlertTriangle className="w-6 h-6 text-red-400" />, label: "Overdue Invoices", value: invStats?.overdue || 0, color: "text-red-400" },
          { icon: <Clock className="w-6 h-6 text-amber-400" />, label: "Pending Invoices", value: invStats?.pending || 0, color: "text-amber-400" },
          { icon: <TrendingDown className="w-6 h-6 text-emerald-400" />, label: "Paid This Period", value: invStats?.paid || 0, color: "text-emerald-400" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", stat.color.replace("text-", "bg-").replace("400", "500/20"))}>{stat.icon}</div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-20" /> : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aging bucket cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map((bucket) => (
          <Card key={bucket.label} className={cn(
            "rounded-xl border transition-all",
            bucket.severity !== "low" ? "ring-1" : "",
            bucket.severity === "critical" ? "ring-red-500/50" :
            bucket.severity === "high" ? "ring-orange-500/50" :
            bucket.severity === "moderate" ? "ring-amber-500/50" : "",
            isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bucket.gradient} flex items-center justify-center`}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{bucket.label}</p>
                  <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{bucket.range} · {bucket.count} invoices</p>
                </div>
                {bucket.severity !== "low" && (
                  <Badge className={cn("ml-auto border-0 text-[9px]", RISK_CONFIG[bucket.severity].bg, RISK_CONFIG[bucket.severity].text)}>
                    {RISK_CONFIG[bucket.severity].icon}
                  </Badge>
                )}
              </div>
              {isLoading ? <Skeleton className="h-6 w-24" /> : (
                <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>${bucket.amount.toLocaleString()}</p>
              )}
              {/* Progress bar relative to largest bucket */}
              <div className={cn("h-2 rounded-full mt-3 overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
                <div
                  className={cn("h-full rounded-full transition-all duration-500", bucket.barColor)}
                  style={{ width: `${totalOutstanding > 0 ? Math.max((bucket.amount / maxBucket) * 100, bucket.amount > 0 ? 4 : 0) : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue receivables list */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>
              Open Receivables
            </CardTitle>
            <Badge variant="outline" className="text-xs">{receivables.length} invoices</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {receivablesQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : receivables.length > 0 ? (
            <div className="space-y-2">
              {receivables.slice(0, 20).map((inv: any) => {
                const isOverdue = inv.status === "overdue";
                return (
                  <div key={inv.id} className={cn(
                    "rounded-lg p-3 flex items-center justify-between border",
                    isOverdue
                      ? (isLight ? "bg-red-50/50 border-red-200/50" : "bg-red-500/5 border-red-500/20")
                      : (isLight ? "bg-slate-50 border-slate-100" : "bg-slate-900/30 border-slate-700/30")
                  )}>
                    <div className="flex items-center gap-3">
                      {isOverdue
                        ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      }
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                          {inv.invoiceNumber || inv.id}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          {inv.customerName || inv.customer || "Unknown"} · Due: {inv.dueDate || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", isOverdue ? "text-red-400" : (isLight ? "text-slate-800" : "text-white"))}>
                        ${inv.amount?.toLocaleString() || "0"}
                      </span>
                      <Badge className={cn("border-0 text-[9px]",
                        isOverdue ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {isOverdue ? "Overdue" : "Outstanding"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BarChart3 className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
              <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>No open receivables</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
