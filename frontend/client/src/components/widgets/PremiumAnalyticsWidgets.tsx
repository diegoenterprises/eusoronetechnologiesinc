import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { MapPin, Target, Wrench, Route, Box, CheckCircle, BarChart3, Star, Truck, PieChart } from "lucide-react";

export const RevenueForecastingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRevenueForecast.useQuery(undefined, { refetchInterval: 600000 });
  const f = data || { current: 0, projected: 0, growth: 0, confidence: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${f.projected.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Projected Revenue</p>
        </div>
        <StatRow label="Current" value={`$${f.current.toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Growth" value={`${f.growth}%`} color={f.growth >= 0 ? "text-green-400" : "text-red-400"} />
        <StatRow label="Confidence" value={`${f.confidence}%`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RouteOptimizationAIWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRouteOptimizationAI.useQuery(undefined, { refetchInterval: 300000 });
  const o = data || { savings: 0, optimizedRoutes: 0, avgTimeSaved: 0, fuelSaved: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Routes", value: o.optimizedRoutes, color: "bg-purple-500/10" },
          { label: "Time Saved", value: `${o.avgTimeSaved}h`, color: "bg-cyan-500/10" },
        ]} />
        <StatRow label="Cost Savings" value={`$${o.savings.toLocaleString()}`} color="text-green-400" />
        <StatRow label="Fuel Saved" value={`${o.fuelSaved} gal`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PredictiveMaintenanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPredictiveMaintenance.useQuery(undefined, { refetchInterval: 600000 });
  const p = data || { predictions: 0, prevented: 0, savings: 0, accuracy: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Predictions", value: p.predictions, color: "bg-purple-500/10" },
          { label: "Prevented", value: p.prevented, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Savings" value={`$${p.savings.toLocaleString()}`} color="text-green-400" />
        <StatRow label="Accuracy" value={`${p.accuracy}%`} color="text-cyan-400" />
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
          <div key={i} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
  const f = data || { avgMpg: 0, totalGallons: 0, totalCost: 0, bestDriver: "" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">{f.avgMpg} MPG</p>
          <p className="text-xs text-gray-400">Fleet Average</p>
        </div>
        <StatRow label="Total Gallons" value={f.totalGallons.toLocaleString()} color="text-blue-400" />
        <StatRow label="Total Cost" value={`$${f.totalCost.toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LoadUtilizationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLoadUtilization.useQuery(undefined, { refetchInterval: 300000 });
  const l = data || { avgWeightUtil: 0, avgVolumeUtil: 0, emptyMiles: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Weight Utilization" value={`${l.avgWeightUtil}%`} color="text-blue-400" />
        <StatRow label="Volume Utilization" value={`${l.avgVolumeUtil}%`} color="text-cyan-400" />
        <StatRow label="Empty Miles" value={`${l.emptyMiles}%`} color={l.emptyMiles > 20 ? "text-red-400" : "text-green-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ComplianceScoreWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getComplianceScore.useQuery(undefined, { refetchInterval: 300000 });
  const c = data || { overall: 0, dq: 0, hos: 0, vehicle: 0, hazmat: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-3xl font-bold text-blue-400">{c.overall}%</p>
          <p className="text-xs text-gray-400">Compliance Score</p>
        </div>
        <StatRow label="DQ Files" value={`${c.dq}%`} color={c.dq >= 90 ? "text-green-400" : "text-red-400"} />
        <StatRow label="HOS" value={`${c.hos}%`} color={c.hos >= 90 ? "text-green-400" : "text-red-400"} />
        <StatRow label="Vehicle" value={`${c.vehicle}%`} color={c.vehicle >= 90 ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const AdvancedMarketRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getAdvancedMarketRates.useQuery(undefined, { refetchInterval: 300000 });
  const m = data || { national: 0, regional: 0, change7d: 0, change30d: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "National", value: `$${m.national}`, color: "bg-blue-500/10" },
          { label: "Regional", value: `$${m.regional}`, color: "bg-cyan-500/10" },
        ]} />
        <StatRow label="7-Day Change" value={`${m.change7d > 0 ? '+' : ''}${m.change7d}%`} color={m.change7d >= 0 ? "text-green-400" : "text-red-400"} />
        <StatRow label="30-Day Change" value={`${m.change30d > 0 ? '+' : ''}${m.change30d}%`} color={m.change30d >= 0 ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const BidWinRateWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getBidWinRate.useQuery(undefined, { refetchInterval: 300000 });
  const b = data || { winRate: 0, totalBids: 0, won: 0, avgMargin: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">{b.winRate}%</p>
          <p className="text-xs text-gray-400">Win Rate</p>
        </div>
        <StatRow label="Total Bids" value={b.totalBids} color="text-blue-400" />
        <StatRow label="Won" value={b.won} color="text-green-400" />
        <StatRow label="Avg Margin" value={`${b.avgMargin}%`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RealTimeTrackingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRealTimeTracking.useQuery(undefined, { refetchInterval: 30000 });
  const t = data || { activeShipments: 0, onTime: 0, delayed: 0, delivered: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: t.activeShipments, color: "bg-blue-500/10" },
          { label: "On Time", value: t.onTime, color: "bg-green-500/10" },
          { label: "Delayed", value: t.delayed, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Delivered Today" value={t.delivered} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CostBreakdownWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCostBreakdown.useQuery(undefined, { refetchInterval: 300000 });
  const c = data || { fuel: 0, labor: 0, maintenance: 0, insurance: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Fuel" value={`$${c.fuel.toLocaleString()}`} color="text-orange-400" />
        <StatRow label="Labor" value={`$${c.labor.toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Maintenance" value={`$${c.maintenance.toLocaleString()}`} color="text-purple-400" />
        <StatRow label="Insurance" value={`$${c.insurance.toLocaleString()}`} color="text-cyan-400" />
        <div className="p-2 rounded-lg bg-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Total</span>
            <span className="text-white font-bold">${c.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomerSatisfactionWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCustomerSatisfaction.useQuery(undefined, { refetchInterval: 600000 });
  const s = data || { score: 0, responses: 0, nps: 0, trend: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
          <p className="text-2xl font-bold text-yellow-400">{s.score}/5</p>
          <p className="text-xs text-gray-400">Satisfaction Score</p>
        </div>
        <StatRow label="Responses" value={s.responses} color="text-blue-400" />
        <StatRow label="NPS" value={s.nps} color={s.nps >= 50 ? "text-green-400" : "text-yellow-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};
