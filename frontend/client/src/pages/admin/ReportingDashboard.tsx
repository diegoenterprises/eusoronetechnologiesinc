/**
 * INVESTOR-READY REPORTING DASHBOARD
 * Combines reconciliation, user analytics, and revenue data.
 * Displays real data from platformFees and analytics procedures.
 */

import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/hooks/useLocale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function pct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function downloadCSV(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateCSV(data: Record<string, any>[], columns?: string[]): string {
  if (!data.length) return "";
  const cols = columns || Object.keys(data[0]);
  const header = cols.map((c) => `"${c}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  alert,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-red-500/50 bg-red-500/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${alert ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportingDashboard() {
  const { t } = useLocale();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const reconciliation = (trpc as any).platformFees.getReconciliation.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );
  const userAnalytics = (trpc as any).analytics.getUserAnalytics.useQuery();
  const revenueByType = (trpc as any).platformFees.getRevenueByType.useQuery({ months: 12 });

  const isLoading = reconciliation.isLoading || userAnalytics.isLoading || revenueByType.isLoading;
  const recon = reconciliation.data;
  const uAnalytics = userAnalytics.data;
  const revData = revenueByType.data;

  const exportReconciliation = () => {
    if (!recon) return;
    const csv = generateCSV([
      {
        Period: `${recon.period.start} to ${recon.period.end}`,
        "Paid In": recon.paidIn,
        "Paid Out": recon.paidOut,
        "Platform Fees": recon.platformFees,
        "Stripe Estimate": recon.stripeEstimate,
        "Net Margin": recon.netMargin,
        "Margin %": recon.marginPercent,
        Transactions: recon.transactionCount,
        Variance: recon.variance,
      },
    ]);
    downloadCSV(csv, `reconciliation-${startDate}-to-${endDate}.csv`);
  };

  const exportUserAnalytics = () => {
    if (!uAnalytics) return;
    const csv = generateCSV([
      {
        "Total Users": uAnalytics.totalUsers,
        "Active (30d)": uAnalytics.activeUsers30d,
        "Churned": uAnalytics.churnedUsers,
        "Churn Rate %": uAnalytics.churnRate,
      },
    ]);
    downloadCSV(csv, `user-analytics-${today}.csv`);
  };

  const exportRevenueByMonth = () => {
    if (!revData?.byMonth?.length) return;
    const csv = generateCSV(
      revData.byMonth.map((m: any) => ({
        Month: m.month,
        "Total Fees": Number(m.totalFees),
        Transactions: Number(m.count),
      }))
    );
    downloadCSV(csv, `revenue-by-month-${today}.csv`);
  };

  const exportRevenueByType = () => {
    if (!revData?.byType?.length) return;
    const csv = generateCSV(
      revData.byType.map((t: any) => ({
        "Transaction Type": t.transactionType,
        "Total Fees": Number(t.totalFees),
        Transactions: Number(t.count),
      }))
    );
    downloadCSV(csv, `revenue-by-type-${today}.csv`);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {t('reportingDashboard.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Auditable financial data -- reconciliation, user analytics, and revenue breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-md border bg-background text-sm"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-md border bg-background text-sm"
          />
        </div>
      </div>

      {/* Section 1: Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={fmt(revData?.grandTotal || 0)}
          subtitle={`${revData?.byType?.length || 0} fee types`}
          icon={DollarSign}
        />
        <StatCard
          title="Gross Volume"
          value={fmt(revData?.totalGrossVolume || 0)}
          subtitle="Total transaction volume"
          icon={TrendingUp}
        />
        <StatCard
          title="Effective Fee Rate"
          value={pct(revData?.effectiveFeeRate || 0)}
          subtitle="Revenue / gross volume"
          icon={BarChart3}
        />
        <StatCard
          title="Net Margin"
          value={recon ? fmt(recon.netMargin) : "--"}
          subtitle={recon ? `After ${fmt(recon.stripeEstimate)} Stripe est.` : ""}
          icon={Activity}
        />
      </div>

      {/* Section 2: Reconciliation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Settlement Reconciliation</CardTitle>
          <Button size="sm" variant="outline" onClick={exportReconciliation} disabled={!recon}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {recon ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Paid In</p>
                <p className="text-xl font-bold text-green-500">{fmt(recon.paidIn)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Paid Out</p>
                <p className="text-xl font-bold text-orange-500">{fmt(recon.paidOut)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Platform Fees</p>
                <p className="text-xl font-bold">{fmt(recon.platformFees)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Margin %</p>
                <p className="text-xl font-bold">{pct(recon.marginPercent)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Variance</p>
                <p className={`text-xl font-bold flex items-center gap-1 ${recon.varianceAlert ? "text-red-500" : "text-green-500"}`}>
                  {recon.varianceAlert && <AlertTriangle className="h-4 w-4" />}
                  {fmt(recon.variance)}
                </p>
                {recon.varianceAlert && (
                  <p className="text-xs text-red-400">Variance exceeds $1 threshold</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reconciliation data available for this period.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: User Analytics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">User Analytics</CardTitle>
          <Button size="sm" variant="outline" onClick={exportUserAnalytics} disabled={!uAnalytics}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {uAnalytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Total Users</p>
                  <p className="text-xl font-bold">{uAnalytics.totalUsers.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Active (30d)</p>
                  <p className="text-xl font-bold flex items-center gap-1 text-green-500">
                    <ArrowUpRight className="h-4 w-4" />
                    {uAnalytics.activeUsers30d.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Churned</p>
                  <p className="text-xl font-bold flex items-center gap-1 text-orange-500">
                    <ArrowDownRight className="h-4 w-4" />
                    {uAnalytics.churnedUsers.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Churn Rate</p>
                  <p className={`text-xl font-bold ${uAnalytics.churnRate > 10 ? "text-red-500" : ""}`}>
                    {pct(uAnalytics.churnRate)}
                  </p>
                </div>
              </div>

              {uAnalytics.usersByRole?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Users by Role</p>
                  <div className="flex flex-wrap gap-2">
                    {uAnalytics.usersByRole.map((r: any) => (
                      <span
                        key={r.role}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {r.role}: {r.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {uAnalytics.weeklySignups?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Weekly Signups (12 weeks)</p>
                  <div className="flex items-end gap-1 h-16">
                    {uAnalytics.weeklySignups.map((w: any, i: number) => {
                      const max = Math.max(...uAnalytics.weeklySignups.map((s: any) => Number(s.count)));
                      const height = max > 0 ? (Number(w.count) / max) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full bg-primary/30 rounded-t"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`Week ${w.week}: ${w.count} signups`}
                          />
                          <span className="text-[9px] text-muted-foreground">{w.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No user analytics data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Revenue by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Revenue by Month</CardTitle>
            <Button size="sm" variant="outline" onClick={exportRevenueByMonth} disabled={!revData?.byMonth?.length}>
              <Download className="h-4 w-4 mr-1.5" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            {revData?.byMonth?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Month</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Fees</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revData.byMonth.map((m: any) => (
                      <tr key={m.month} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-mono text-xs">{m.month}</td>
                        <td className="py-1.5 px-2 text-right font-medium">{fmt(Number(m.totalFees))}</td>
                        <td className="py-1.5 px-2 text-right text-muted-foreground">{Number(m.count).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No monthly revenue data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Revenue by Fee Type</CardTitle>
            <Button size="sm" variant="outline" onClick={exportRevenueByType} disabled={!revData?.byType?.length}>
              <Download className="h-4 w-4 mr-1.5" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            {revData?.byType?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Fees</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revData.byType.map((t: any) => (
                      <tr key={t.transactionType} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-mono text-xs">{t.transactionType}</td>
                        <td className="py-1.5 px-2 text-right font-medium">{fmt(Number(t.totalFees))}</td>
                        <td className="py-1.5 px-2 text-right text-muted-foreground">{Number(t.count).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td className="py-2 px-2">Grand Total</td>
                      <td className="py-2 px-2 text-right">{fmt(revData.grandTotal)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">
                        {revData.byType.reduce((s: number, t: any) => s + Number(t.count), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fee type data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
