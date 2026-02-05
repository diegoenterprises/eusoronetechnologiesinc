import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import { Users, Route, DollarSign, Target, Package, TrendingUp, FileText, Award, CreditCard, Star } from "lucide-react";

export const CustomerAccountsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCustomerAccounts.useQuery(undefined, { refetchInterval: 300000 });
  const accounts = Array.isArray(data) ? data : data?.accounts || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total Accounts" value={accounts.length} color="text-blue-400" />
        <WidgetList items={accounts.slice(0, exp ? 5 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Users className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{a.name || `Account ${i+1}`}</span>
            <span className="text-[10px] text-green-400">${a.revenue?.toLocaleString() || 0}</span>
          </div>
        )} empty="No customer accounts" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RateTrendsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRateTrends.useQuery(undefined, { refetchInterval: 300000 });
  const t = data || { avgRate: 0, change: 0, high: 0, low: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">${t.avgRate.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Avg Rate/Mile</p>
        </div>
        <StatRow label="Change" value={`${t.change > 0 ? '+' : ''}${t.change}%`} color={t.change >= 0 ? "text-green-400" : "text-red-400"} />
        <StatRow label="Range" value={`$${t.low} - $${t.high}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const BidManagementWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getBidManagement.useQuery(undefined, { refetchInterval: 60000 });
  const b = data || { active: 0, won: 0, lost: 0, pending: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: b.active, color: "bg-blue-500/10" },
          { label: "Won", value: b.won, color: "bg-green-500/10" },
          { label: "Lost", value: b.lost, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Pending Review" value={b.pending} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CoverageMapWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCoverageMap.useQuery(undefined, { refetchInterval: 600000 });
  const lanes = Array.isArray(data) ? data : data?.lanes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Lanes" value={lanes.length} color="text-cyan-400" />
        <WidgetList items={lanes.slice(0, exp ? 5 : 3)} renderItem={(l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Route className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{l.origin || "A"} to {l.destination || "B"}</span>
            <span className="text-[10px] text-green-400">{l.volume || 0} loads</span>
          </div>
        )} empty="No lanes configured" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CommissionTrackerWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCommissionTracker.useQuery(undefined, { refetchInterval: 300000 });
  const c = data || { totalEarned: 0, pending: 0, thisMonth: 0, avgPerLoad: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${c.totalEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Earned</p>
        </div>
        <StatRow label="This Month" value={`$${c.thisMonth.toLocaleString()}`} color="text-cyan-400" />
        <StatRow label="Pending" value={`$${c.pending.toLocaleString()}`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ShipperPipelineWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getShipperPipeline.useQuery(undefined, { refetchInterval: 300000 });
  const p = data || { prospects: 0, qualified: 0, negotiating: 0, closed: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Prospects", value: p.prospects, color: "bg-blue-500/10" },
          { label: "Qualified", value: p.qualified, color: "bg-cyan-500/10" },
          { label: "Closed", value: p.closed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Negotiating" value={p.negotiating} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CarrierScorecardsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCarrierScorecards.useQuery(undefined, { refetchInterval: 300000 });
  const carriers = Array.isArray(data) ? data : data?.carriers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={carriers.slice(0, exp ? 5 : 3)} renderItem={(c: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Award className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{c.name || `Carrier ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${(c.score||0)>=90?"bg-green-500/20 text-green-400":(c.score||0)>=70?"bg-yellow-500/20 text-yellow-400":"bg-red-500/20 text-red-400"}`}>
            {c.score || 0}%
          </Badge>
        </div>
      )} empty="No scorecards" />
    )}</ResponsiveWidget>
  );
};

export const LoadMatchingAIWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getAILoadMatching.useQuery(undefined, { refetchInterval: 120000 });
  const matches = Array.isArray(data) ? data : data?.matches || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-white">{matches.length} AI Matches Found</span>
        </div>
        <WidgetList items={matches.slice(0, exp ? 4 : 2)} renderItem={(m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Package className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{m.loadNumber || `Match #${i+1}`}</p>
              <p className="text-[10px] text-gray-500">{m.lane || "N/A"}</p>
            </div>
            <span className="text-[10px] text-green-400">{m.confidence || 0}%</span>
          </div>
        )} empty="No AI matches" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PaymentStatusWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPaymentStatus.useQuery(undefined, { refetchInterval: 300000 });
  const p = data || { paid: 0, pending: 0, overdue: 0, totalOutstanding: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Paid", value: p.paid, color: "bg-green-500/10" },
          { label: "Pending", value: p.pending, color: "bg-yellow-500/10" },
          { label: "Overdue", value: p.overdue, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Outstanding" value={`$${p.totalOutstanding.toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LaneAnalysisWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLaneAnalysis.useQuery(undefined, { refetchInterval: 300000 });
  const lanes = Array.isArray(data) ? data : data?.lanes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={lanes.slice(0, exp ? 5 : 3)} renderItem={(l: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Route className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{l.lane || `Lane ${i+1}`}</span>
          <span className="text-[10px] text-green-400">${l.avgRate || 0}/mi</span>
        </div>
      )} empty="No lane data" />
    )}</ResponsiveWidget>
  );
};

export const ContractManagementWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getContractManagement.useQuery(undefined, { refetchInterval: 600000 });
  const c = data || { active: 0, expiringSoon: 0, pendingRenewal: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: c.active, color: "bg-green-500/10" },
          { label: "Expiring", value: c.expiringSoon, color: "bg-yellow-500/10" },
          { label: "Renewal", value: c.pendingRenewal, color: "bg-blue-500/10" },
        ]} />
        <StatRow label="Total Contracts" value={c.total} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const MarketIntelligenceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getMarketIntelligence.useQuery(undefined, { refetchInterval: 600000 });
  const m = data || { avgNationalRate: 0, rateChange: 0, trendDirection: "stable" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">${m.avgNationalRate.toFixed(2)}</p>
          <p className="text-xs text-gray-400">National Avg Rate</p>
        </div>
        <StatRow label="Trend" value={m.trendDirection} color={m.rateChange >= 0 ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};
