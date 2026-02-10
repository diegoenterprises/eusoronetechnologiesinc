import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { MapPin, Target, Wrench, Route, Box, CheckCircle, BarChart3, Star, Truck, PieChart } from "lucide-react";

export const RevenueForecastingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRevenueForecast.useQuery(undefined, { refetchInterval: 600000 });
  const f = data || { currentMonth: 0, projectedMonth: 0, growth: 0, confidence: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.12] to-green-600/[0.06] border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">${(f.projectedMonth || 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Projected Revenue</p>
        </div>
        <StatRow label="Current" value={`$${(f.currentMonth || 0).toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Growth" value={`${f.growth || 0}%`} color={(f.growth || 0) >= 0 ? "text-green-400" : "text-red-400"} />
        <StatRow label="Confidence" value={`${f.confidence || 0}%`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RouteOptimizationAIWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRouteOptimizationAI.useQuery(undefined, { refetchInterval: 300000 });
  const o = data || { costSavings: 0, optimizedRoutes: 0, timeSaved: 0, fuelSaved: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Routes", value: o.optimizedRoutes || 0, color: "bg-purple-500/10" },
          { label: "Time Saved", value: `${o.timeSaved || 0}h`, color: "bg-cyan-500/10" },
        ]} />
        <StatRow label="Cost Savings" value={`$${(o.costSavings || 0).toLocaleString()}`} color="text-green-400" />
        <StatRow label="Fuel Saved" value={`${o.fuelSaved || 0} gal`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PredictiveMaintenanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPredictiveMaintenance.useQuery(undefined, { refetchInterval: 600000 });
  const p = data || { vehiclesMonitored: 0, alertsActive: 0, uptime: 0, nextService: [] };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Monitored", value: p.vehiclesMonitored || 0, color: "bg-purple-500/10" },
          { label: "Alerts", value: p.alertsActive || 0, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Uptime" value={`${p.uptime || 0}%`} color="text-green-400" />
        <StatRow label="Next Service" value={p.nextService?.[0]?.vehicle || 'None'} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DemandHeatmapWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDemandHeatmap.useQuery(undefined, { refetchInterval: 60000 });
  const hotspots = Array.isArray(data) ? data : data?.hotspots || [];
  const maxDemand = Math.max(...hotspots.map((h: any) => h.demand || 0), 1);
  const levelColor = (l: string) => l === "CRITICAL" ? "text-red-400" : l === "HIGH" ? "text-orange-400" : "text-yellow-400";
  const barColor = (l: string) => l === "CRITICAL" ? "bg-red-500" : l === "HIGH" ? "bg-orange-500" : "bg-yellow-500";
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : hotspots.length === 0 ? (
      <div className="text-center py-6 text-gray-400 text-xs">No demand data</div>
    ) : (
      <div className="space-y-2">
        {hotspots.slice(0, exp ? 8 : 4).map((h: any, i: number) => (
          <div key={i} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className={`w-3 h-3 flex-shrink-0 ${levelColor(h.level)}`} />
              <span className="text-xs text-white flex-1 truncate font-medium">{h.region || `Region ${i+1}`}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${h.level === "CRITICAL" ? "bg-red-500/20 text-red-400" : h.level === "HIGH" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>{h.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor(h.level)} transition-all`} style={{ width: `${Math.round(((h.demand || 0) / maxDemand) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-orange-400 font-semibold w-16 text-right">{h.demand} loads</span>
              {h.surge && <span className="text-[9px] text-purple-400 font-bold">{h.surge}x</span>}
            </div>
          </div>
        ))}
      </div>
    )}</ResponsiveWidget>
  );
};

export const DriverPerformanceAnalyticsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDriverPerformanceAnalytics.useQuery(undefined, { refetchInterval: 300000 });
  const d = data || { avgScore: 0, topPerformers: 0, needsImprovement: 0, avgMilesPerDay: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Avg Score", value: d.avgScore, color: "bg-blue-500/10" },
          { label: "Top", value: d.topPerformers, color: "bg-green-500/10" },
          { label: "Improve", value: d.needsImprovement, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Avg Miles/Day" value={d.avgMilesPerDay} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FuelEfficiencyAnalyticsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getFuelEfficiencyAnalytics.useQuery(undefined, { refetchInterval: 300000 });
  const f = data || { avgMpg: 0, costPerMile: 0, totalGallons: 0, totalCost: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.12] to-cyan-600/[0.06] border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{f.avgMpg || 0} MPG</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Fleet Average</p>
        </div>
        <StatRow label="Total Gallons" value={(f.totalGallons || 0).toLocaleString()} color="text-blue-400" />
        <StatRow label="Total Cost" value={`$${(f.totalCost || 0).toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LoadUtilizationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLoadUtilization.useQuery(undefined, { refetchInterval: 300000 });
  const l = data || { avgUtilization: 0, fullLoads: 0, partialLoads: 0, emptyMiles: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Avg Utilization" value={`${l.avgUtilization || 0}%`} color="text-blue-400" />
        <StatRow label="Full Loads" value={l.fullLoads || 0} color="text-green-400" />
        <StatRow label="Empty Miles" value={`${l.emptyMiles || 0}%`} color={(l.emptyMiles || 0) > 20 ? "text-red-400" : "text-green-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ComplianceScoreWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getComplianceScore.useQuery(undefined, { refetchInterval: 300000 });
  const c = data || { overall: 0, fmcsa: 0, phmsa: 0, dot: 0, osha: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/[0.12] to-purple-600/[0.06] border border-blue-500/20">
          <p className="text-3xl font-bold text-blue-400 tabular-nums">{c.overall || 0}%</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Compliance Score</p>
        </div>
        <StatRow label="FMCSA" value={`${c.fmcsa || 0}%`} color={(c.fmcsa || 0) >= 90 ? "text-green-400" : "text-red-400"} />
        <StatRow label="DOT" value={`${c.dot || 0}%`} color={(c.dot || 0) >= 90 ? "text-green-400" : "text-red-400"} />
        <StatRow label="OSHA" value={`${c.osha || 0}%`} color={(c.osha || 0) >= 90 ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const AdvancedMarketRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getAdvancedMarketRates.useQuery(undefined, { refetchInterval: 300000 });
  const m = data || { avgRate: 0, rateChange: 0, topLanes: [] };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/[0.12] to-cyan-600/[0.06] border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400 tabular-nums">${m.avgRate || 0}/mi</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Average Market Rate</p>
        </div>
        <StatRow label="Rate Change" value={`${(m.rateChange || 0) > 0 ? '+' : ''}$${m.rateChange || 0}`} color={(m.rateChange || 0) >= 0 ? "text-green-400" : "text-red-400"} />
        {(m.topLanes || []).slice(0, 2).map((l: any, i: number) => (
          <StatRow key={i} label={l.route} value={`$${l.rate}/mi`} color="text-cyan-400" />
        ))}
      </div>
    )}</ResponsiveWidget>
  );
};

export const BidWinRateWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getBidWinRate.useQuery(undefined, { refetchInterval: 300000 });
  const b = data || { winRate: 0, totalBids: 0, won: 0, avgBidAmount: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.12] to-blue-600/[0.06] border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{b.winRate || 0}%</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Win Rate</p>
        </div>
        <StatRow label="Total Bids" value={b.totalBids || 0} color="text-blue-400" />
        <StatRow label="Won" value={b.won || 0} color="text-green-400" />
        <StatRow label="Avg Bid" value={`$${(b.avgBidAmount || 0).toLocaleString()}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RealTimeTrackingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRealTimeTracking.useQuery(undefined, { refetchInterval: 30000 });
  const t = data || { activeShipments: 0, onTime: 0, delayed: 0, earlyArrival: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: t.activeShipments || 0, color: "bg-blue-500/10" },
          { label: "On Time", value: t.onTime || 0, color: "bg-green-500/10" },
          { label: "Delayed", value: t.delayed || 0, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Early Arrival" value={t.earlyArrival || 0} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CostBreakdownWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCostBreakdown.useQuery(undefined, { refetchInterval: 300000 });
  const cats = data?.categories || [];
  const total = data?.total || 0;
  const getCat = (name: string) => cats.find((c: any) => c.name === name)?.amount || 0;
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Fuel" value={`$${getCat('Fuel').toLocaleString()}`} color="text-orange-400" />
        <StatRow label="Labor" value={`$${getCat('Labor').toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Maintenance" value={`$${getCat('Maintenance').toLocaleString()}`} color="text-purple-400" />
        <StatRow label="Insurance" value={`$${getCat('Insurance').toLocaleString()}`} color="text-cyan-400" />
        <div className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-300 font-semibold tracking-wide">Total</span>
            <span className="text-sm text-white font-bold tabular-nums">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomerSatisfactionWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCustomerSatisfaction.useQuery(undefined, { refetchInterval: 600000 });
  const s = data || { score: 0, totalReviews: 0, nps: 0, responseRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.12] to-yellow-600/[0.06] border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{s.score || 0}/5</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Satisfaction Score</p>
        </div>
        <StatRow label="Reviews" value={s.totalReviews || 0} color="text-blue-400" />
        <StatRow label="NPS" value={s.nps || 0} color={(s.nps || 0) >= 50 ? "text-green-400" : "text-yellow-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};
