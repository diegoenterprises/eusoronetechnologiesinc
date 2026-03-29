import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import {
  FileText, DollarSign, Clock, AlertCircle, CheckCircle, Users,
  TrendingUp, CreditCard, Activity, Wallet, BarChart3, Shield
} from "lucide-react";

// ---- FACTORING WIDGETS ----

export const FactoringPendingInvoicesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getPendingInvoices.useQuery(undefined, { refetchInterval: 60000 });
  const invoices = Array.isArray(data) ? data : data?.invoices || [];
  const total = data?.total ?? invoices.length;
  const totalValue = data?.totalValue ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Pending", value: total, color: "bg-amber-500/10" },
          { label: "Value", value: `$${(totalValue / 1000).toFixed(0)}K`, color: "bg-blue-500/10" },
        ]} />
        <WidgetList items={invoices.slice(0, exp ? 5 : 3)} renderItem={(inv: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{inv.invoiceNumber || inv.catalyst || `INV-${i + 1}`}</span>
            <span className="text-xs text-green-400 font-medium">${(inv.amount ?? 0).toLocaleString()}</span>
          </div>
        )} empty="No pending invoices" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringFundedWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getFundedInvoices.useQuery(undefined, { refetchInterval: 120000 });
  const funded = Array.isArray(data) ? data : data?.invoices || [];
  const totalFunded = data?.totalFunded ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Funded", value: funded.length, color: "bg-green-500/10" },
          { label: "Total", value: `$${(totalFunded / 1000).toFixed(0)}K`, color: "bg-emerald-500/10" },
        ]} />
        <WidgetList items={funded.slice(0, exp ? 5 : 3)} renderItem={(inv: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{inv.invoiceNumber || inv.catalyst || `INV-${i + 1}`}</span>
            <span className="text-xs text-emerald-400 font-medium">${(inv.amount ?? 0).toLocaleString()}</span>
          </div>
        )} empty="No funded invoices" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringAgingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getAgingReport.useQuery(undefined, { refetchInterval: 300000 });
  const a = data || { current: 0, thirtyDay: 0, sixtyDay: 0, ninetyDay: 0, overNinety: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Current", value: `$${(a.current / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "30 Days", value: `$${(a.thirtyDay / 1000).toFixed(0)}K`, color: "bg-yellow-500/10" },
          { label: "60 Days", value: `$${(a.sixtyDay / 1000).toFixed(0)}K`, color: "bg-orange-500/10" },
        ]} />
        <StatRow label="90 Days" value={`$${(a.ninetyDay / 1000).toFixed(0)}K`} color="text-red-400" />
        <StatRow label="90+ Days" value={`$${(a.overNinety / 1000).toFixed(0)}K`} color="text-red-500" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringRiskWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getRiskAssessment.useQuery(undefined, { refetchInterval: 300000 });
  const r = data || { lowRisk: 0, mediumRisk: 0, highRisk: 0, score: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Low", value: r.lowRisk, color: "bg-green-500/10" },
          { label: "Medium", value: r.mediumRisk, color: "bg-yellow-500/10" },
          { label: "High", value: r.highRisk, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Risk Score" value={`${r.score}/100`} color={r.score > 70 ? "text-red-400" : r.score > 40 ? "text-yellow-400" : "text-green-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringCollectionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getCollections.useQuery(undefined, { refetchInterval: 120000 });
  const collections = Array.isArray(data) ? data : data?.collections || [];
  const outstanding = data?.outstanding ?? 0;
  const collected = data?.collected ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Outstanding", value: `$${(outstanding / 1000).toFixed(0)}K`, color: "bg-red-500/10" },
          { label: "Collected", value: `$${(collected / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
        ]} />
        <WidgetList items={collections.slice(0, exp ? 5 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <DollarSign className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{c.debtor || c.company || `Account ${i + 1}`}</span>
            <span className="text-xs text-red-400 font-medium">${(c.amount ?? 0).toLocaleString()}</span>
          </div>
        )} empty="No outstanding collections" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringChargebacksWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getChargebacks.useQuery(undefined, { refetchInterval: 300000 });
  const chargebacks = Array.isArray(data) ? data : data?.chargebacks || [];
  const totalAmount = data?.totalAmount ?? 0;
  const count = data?.count ?? chargebacks.length;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Chargebacks", value: count, color: "bg-red-500/10" },
          { label: "Total", value: `$${(totalAmount / 1000).toFixed(0)}K`, color: "bg-orange-500/10" },
        ]} />
        <WidgetList items={chargebacks.slice(0, exp ? 4 : 2)} renderItem={(cb: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{cb.reason || cb.invoice || `CB-${i + 1}`}</span>
            <span className="text-xs text-red-400 font-medium">${(cb.amount ?? 0).toLocaleString()}</span>
          </div>
        )} empty="No chargebacks" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringCatalystPortfolioWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getCatalystPortfolio.useQuery(undefined, { refetchInterval: 300000 });
  const catalysts = Array.isArray(data) ? data : data?.catalysts || [];
  const totalAccounts = data?.totalAccounts ?? catalysts.length;
  const activeAccounts = data?.activeAccounts ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Total", value: totalAccounts, color: "bg-purple-500/10" },
          { label: "Active", value: activeAccounts, color: "bg-green-500/10" },
        ]} />
        <WidgetList items={catalysts.slice(0, exp ? 5 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Users className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{c.name || c.company || `Catalyst ${i + 1}`}</span>
            <span className="text-xs text-cyan-400 font-medium">{c.status || "Active"}</span>
          </div>
        )} empty="No catalyst accounts" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringRatesFeesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getRatesFees.useQuery(undefined, { refetchInterval: 600000 });
  const r = data || { advanceRate: 0, factoringFee: 0, achFee: 0, wireFee: 0, monthlyMin: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Advance Rate" value={`${r.advanceRate}%`} color="text-blue-400" />
        <StatRow label="Factoring Fee" value={`${r.factoringFee}%`} color="text-purple-400" />
        <StatRow label="ACH Fee" value={`$${r.achFee}`} color="text-cyan-400" />
        <StatRow label="Wire Fee" value={`$${r.wireFee}`} color="text-amber-400" />
        <StatRow label="Monthly Min" value={`$${r.monthlyMin}`} color="text-gray-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringAdvanceRateWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getAdvanceRate.useQuery(undefined, { refetchInterval: 300000 });
  const a = data || { currentRate: 0, avgRate: 0, minRate: 0, maxRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Current", value: `${a.currentRate}%`, color: "bg-green-500/10" },
          { label: "Average", value: `${a.avgRate}%`, color: "bg-blue-500/10" },
        ]} />
        <StatRow label="Min Rate" value={`${a.minRate}%`} color="text-gray-400" />
        <StatRow label="Max Rate" value={`${a.maxRate}%`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringApprovalRateWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getApprovalRate.useQuery(undefined, { refetchInterval: 300000 });
  const a = data || { approvalRate: 0, approved: 0, denied: 0, pending: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-emerald-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Approved", value: a.approved, color: "bg-green-500/10" },
          { label: "Denied", value: a.denied, color: "bg-red-500/10" },
          { label: "Pending", value: a.pending, color: "bg-amber-500/10" },
        ]} />
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Approval Rate</span>
            <span className="text-emerald-400">{a.approvalRate}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: `${a.approvalRate}%` }} />
          </div>
        </div>
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringCashFlowWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getCashFlow.useQuery(undefined, { refetchInterval: 120000 });
  const c = data || { inflow: 0, outflow: 0, net: 0, todayFunded: 0, todayCollected: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-blue-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Inflow", value: `$${(c.inflow / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "Outflow", value: `$${(c.outflow / 1000).toFixed(0)}K`, color: "bg-red-500/10" },
          { label: "Net", value: `$${(c.net / 1000).toFixed(0)}K`, color: c.net >= 0 ? "bg-blue-500/10" : "bg-red-500/10" },
        ]} />
        <StatRow label="Funded Today" value={`$${(c.todayFunded / 1000).toFixed(0)}K`} color="text-green-400" />
        <StatRow label="Collected Today" value={`$${(c.todayCollected / 1000).toFixed(0)}K`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringDefaultRiskWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getDefaultRisk.useQuery(undefined, { refetchInterval: 300000 });
  const d = data || { defaultRate: 0, atRiskAccounts: 0, totalExposure: 0, avgDaysPastDue: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Default Rate", value: `${d.defaultRate}%`, color: "bg-red-500/10" },
          { label: "At Risk", value: d.atRiskAccounts, color: "bg-orange-500/10" },
        ]} />
        <StatRow label="Total Exposure" value={`$${(d.totalExposure / 1000).toFixed(0)}K`} color="text-red-400" />
        <StatRow label="Avg Days Past Due" value={d.avgDaysPastDue} color="text-amber-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringHistoryWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getFundingHistory.useQuery(undefined, { refetchInterval: 300000 });
  const history = Array.isArray(data) ? data : data?.history || [];
  const totalFunded = data?.totalFunded ?? 0;
  const totalTransactions = data?.totalTransactions ?? history.length;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Transactions", value: totalTransactions, color: "bg-blue-500/10" },
          { label: "Total Funded", value: `$${(totalFunded / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
        ]} />
        <WidgetList items={history.slice(0, exp ? 5 : 3)} renderItem={(h: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <BarChart3 className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{h.date || h.period || `Period ${i + 1}`}</span>
            <span className="text-xs text-green-400 font-medium">${(h.amount ?? 0).toLocaleString()}</span>
          </div>
        )} empty="No funding history" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringPortfolioWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getPortfolio.useQuery(undefined, { refetchInterval: 300000 });
  const p = data || { totalValue: 0, activeInvoices: 0, avgInvoiceSize: 0, growthRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Portfolio", value: `$${(p.totalValue / 1000).toFixed(0)}K`, color: "bg-purple-500/10" },
          { label: "Active", value: p.activeInvoices, color: "bg-blue-500/10" },
          { label: "Growth", value: `${p.growthRate}%`, color: p.growthRate >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
        ]} />
        <StatRow label="Avg Invoice Size" value={`$${(p.avgInvoiceSize).toLocaleString()}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FactoringReserveWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).factoring.getReserveAccount.useQuery(undefined, { refetchInterval: 300000 });
  const r = data || { balance: 0, held: 0, released: 0, pendingRelease: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-amber-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Balance", value: `$${(r.balance / 1000).toFixed(0)}K`, color: "bg-amber-500/10" },
          { label: "Held", value: `$${(r.held / 1000).toFixed(0)}K`, color: "bg-orange-500/10" },
          { label: "Released", value: `$${(r.released / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Pending Release" value={`$${(r.pendingRelease / 1000).toFixed(0)}K`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};
