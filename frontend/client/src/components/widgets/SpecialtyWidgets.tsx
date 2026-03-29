import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import {
  Sun, CloudRain, MapPin, Gauge, CheckCircle, Zap, CreditCard,
  Target, Route, DollarSign, Shield, Package, FileText, AlertTriangle,
  Truck, Navigation, Activity
} from "lucide-react";

// ---- WEATHER WIDGET (empty state — needs external API) ----

export const WeatherWidget: React.FC = () => (
  <ResponsiveWidget>{() => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Sun className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium text-white/60">Weather Data</p>
      <p className="text-xs text-gray-500 mt-1 text-center px-4">Connect an external weather API to display live conditions and 5-day forecast.</p>
    </div>
  )}</ResponsiveWidget>
);

// ---- WEATHER ALERTS WIDGET (empty state — needs external API) ----

export const WeatherAlertsSpecialtyWidget: React.FC = () => (
  <ResponsiveWidget>{() => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <CloudRain className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium text-white/60">Weather Alerts</p>
      <p className="text-xs text-gray-500 mt-1 text-center px-4">Connect a weather alerts API to show route-specific severe weather warnings.</p>
    </div>
  )}</ResponsiveWidget>
);

// ---- LIVE MAP WIDGET ----

export const LiveMapWidget: React.FC = () => (
  <ResponsiveWidget>{() => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <MapPin className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium text-white/60">Live Map</p>
      <p className="text-xs text-gray-500 mt-1 text-center px-4">Enable GPS tracking to view real-time fleet positions on an interactive map.</p>
    </div>
  )}</ResponsiveWidget>
);

// ---- CSA SCORES WIDGET ----

export const CSAScoresSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).csaScores.getScores.useQuery(undefined, { refetchInterval: 600000 });
  const s = data || { unsafeDriving: 0, hosCompliance: 0, vehicleMaintenance: 0, controlledSubstances: 0, driverFitness: 0, crashIndicator: 0, hazmat: 0 };
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-blue-400" /> : (
      <div className="space-y-2">
        <StatRow label="Unsafe Driving" value={`${s.unsafeDriving}%`} color={s.unsafeDriving > 65 ? "text-red-400" : "text-green-400"} />
        <StatRow label="HOS Compliance" value={`${s.hosCompliance}%`} color={s.hosCompliance > 65 ? "text-red-400" : "text-green-400"} />
        <StatRow label="Vehicle Maint." value={`${s.vehicleMaintenance}%`} color={s.vehicleMaintenance > 80 ? "text-red-400" : "text-green-400"} />
        {exp && <>
          <StatRow label="Controlled Substances" value={`${s.controlledSubstances}%`} color={s.controlledSubstances > 50 ? "text-red-400" : "text-green-400"} />
          <StatRow label="Driver Fitness" value={`${s.driverFitness}%`} color={s.driverFitness > 80 ? "text-red-400" : "text-green-400"} />
          <StatRow label="Crash Indicator" value={`${s.crashIndicator}%`} color={s.crashIndicator > 65 ? "text-red-400" : "text-green-400"} />
          <StatRow label="HazMat" value={`${s.hazmat}%`} color={s.hazmat > 80 ? "text-red-400" : "text-green-400"} />
        </>}
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- DOT NUMBER STATUS WIDGET ----

export const DOTNumberStatusSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).fmcsa.getDOTStatus.useQuery(undefined, { refetchInterval: 600000 });
  const d = data || { dotNumber: "N/A", status: "Unknown", authorityStatus: "Unknown", insuranceStatus: "Unknown", mcs150Date: "N/A" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="DOT Number" value={d.dotNumber} color="text-blue-400" />
        <StatRow label="Status" value={d.status} color={d.status === "Active" ? "text-green-400" : "text-red-400"} />
        <StatRow label="Authority" value={d.authorityStatus} color={d.authorityStatus === "Active" ? "text-green-400" : "text-amber-400"} />
        <StatRow label="Insurance" value={d.insuranceStatus} color={d.insuranceStatus === "Active" ? "text-green-400" : "text-red-400"} />
        <StatRow label="MCS-150 Date" value={d.mcs150Date} color="text-gray-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- SPECTRA MATCH WIDGET ----

export const SpectraMatchSpecialtyWidget: React.FC = () => (
  <ResponsiveWidget>{() => (
    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
      <Zap className="w-10 h-10 mb-3 text-purple-400 opacity-60" />
      <p className="text-sm font-medium text-white/80">SpectraMatch AI</p>
      <p className="text-xs text-gray-500 mt-1 text-center px-4">AI-powered load-to-catalyst matching engine. Analyzes lane history, equipment, and rates for optimal pairings.</p>
      <div className="mt-3 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">Premium Feature</div>
    </div>
  )}</ResponsiveWidget>
);

// ---- STRIPE CONNECT WIDGET ----

export const StripeConnectSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).billing.getStripeStatus.useQuery(undefined, { refetchInterval: 600000 });
  const s = data || { connected: false, accountId: null, payoutsEnabled: false, chargesEnabled: false };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <CreditCard className={`w-5 h-5 ${s.connected ? "text-green-400" : "text-gray-500"}`} />
          <div>
            <p className="text-sm font-medium text-white">{s.connected ? "Connected" : "Not Connected"}</p>
            <p className="text-xs text-gray-500">{s.accountId || "No Stripe account linked"}</p>
          </div>
        </div>
        {s.connected && <>
          <StatRow label="Payouts" value={s.payoutsEnabled ? "Enabled" : "Disabled"} color={s.payoutsEnabled ? "text-green-400" : "text-red-400"} />
          <StatRow label="Charges" value={s.chargesEnabled ? "Enabled" : "Disabled"} color={s.chargesEnabled ? "text-green-400" : "text-red-400"} />
        </>}
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- TERMINAL KPIS WIDGET ----

export const TerminalKPIsSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).terminal.getKPIs.useQuery(undefined, { refetchInterval: 120000 });
  const k = data || { throughput: 0, avgDwellTime: 0, utilization: 0, onTimeRate: 0, damageRate: 0 };
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-cyan-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Throughput", value: `${k.throughput}/hr`, color: "bg-blue-500/10" },
          { label: "On-Time", value: `${k.onTimeRate}%`, color: "bg-green-500/10" },
          { label: "Utilization", value: `${k.utilization}%`, color: "bg-cyan-500/10" },
        ]} />
        <StatRow label="Avg Dwell Time" value={`${k.avgDwellTime} min`} color="text-amber-400" />
        {exp && <StatRow label="Damage Rate" value={`${k.damageRate}%`} color={k.damageRate > 2 ? "text-red-400" : "text-green-400"} />}
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- LOAD MATCHING AI WIDGET ----

export const LoadMatchingAISpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).loads.getAIMatches.useQuery(undefined, { refetchInterval: 120000 });
  const matches = Array.isArray(data) ? data : data?.matches || [];
  const accuracy = data?.accuracy ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-purple-400" /> : (
      <div className="space-y-2">
        <StatRow label="AI Accuracy" value={`${accuracy}%`} color="text-purple-400" />
        <WidgetList items={matches.slice(0, exp ? 5 : 3)} renderItem={(m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Zap className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{m.lane || m.origin || `Match ${i + 1}`}</span>
            <span className="text-xs text-green-400 font-medium">{m.score || m.confidence || 0}%</span>
          </div>
        )} empty="No AI matches available" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- ROUTE OPTIMIZATION AI WIDGET ----

export const RouteOptimizationAISpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).loads.getRouteOptimization.useQuery(undefined, { refetchInterval: 300000 });
  const r = data || { optimizedRoutes: 0, milesSaved: 0, fuelSaved: 0, timeSaved: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-cyan-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Optimized", value: r.optimizedRoutes, color: "bg-cyan-500/10" },
          { label: "Miles Saved", value: r.milesSaved, color: "bg-green-500/10" },
          { label: "Fuel Saved", value: `$${r.fuelSaved}`, color: "bg-emerald-500/10" },
        ]} />
        <StatRow label="Time Saved" value={`${r.timeSaved} hrs`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- SAFETY ROI WIDGET ----

export const SafetyROISpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).safetyIncidents.getROI.useQuery(undefined, { refetchInterval: 600000 });
  const r = data || { totalSavings: 0, investmentCost: 0, roi: 0, incidentReduction: 0, claimsReduction: 0 };
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Savings", value: `$${(r.totalSavings / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "Investment", value: `$${(r.investmentCost / 1000).toFixed(0)}K`, color: "bg-blue-500/10" },
          { label: "ROI", value: `${r.roi}%`, color: r.roi >= 100 ? "bg-green-500/10" : "bg-amber-500/10" },
        ]} />
        {exp && <>
          <StatRow label="Incident Reduction" value={`${r.incidentReduction}%`} color="text-green-400" />
          <StatRow label="Claims Reduction" value={`${r.claimsReduction}%`} color="text-cyan-400" />
        </>}
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- SHIPMENT TRACKING WIDGET ----

export const ShipmentTrackingSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).loads.getTracking.useQuery(undefined, { refetchInterval: 60000 });
  const shipments = Array.isArray(data) ? data : data?.shipments || [];
  const inTransit = data?.inTransit ?? 0;
  const delivered = data?.delivered ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-blue-400" /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "In Transit", value: inTransit, color: "bg-blue-500/10" },
          { label: "Delivered", value: delivered, color: "bg-green-500/10" },
        ]} />
        <WidgetList items={shipments.slice(0, exp ? 5 : 3)} renderItem={(s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Truck className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{s.loadNumber || s.origin || `Load ${i + 1}`}</span>
            <span className="text-xs text-cyan-400">{s.status || "Tracking"}</span>
          </div>
        )} empty="No active shipments" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- POD DOCUMENTS WIDGET ----

export const PODDocumentsSpecialtyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).documents.getPODDocuments.useQuery(undefined, { refetchInterval: 300000 });
  const docs = Array.isArray(data) ? data : data?.documents || [];
  const pending = data?.pending ?? 0;
  const uploaded = data?.uploaded ?? 0;
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Uploaded", value: uploaded, color: "bg-green-500/10" },
          { label: "Pending", value: pending, color: "bg-amber-500/10" },
        ]} />
        <WidgetList items={docs.slice(0, exp ? 5 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{d.loadNumber || d.filename || `POD ${i + 1}`}</span>
            <span className="text-xs text-gray-400">{d.status || "Uploaded"}</span>
          </div>
        )} empty="No POD documents" />
      </div>
    )}</ResponsiveWidget>
  );
};
