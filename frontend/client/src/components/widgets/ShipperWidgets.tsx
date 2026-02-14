import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Calendar, FileText, MapPin, CheckCircle, Star,
  Package, Gauge, TrendingDown, PieChart, Users, BarChart3
} from "lucide-react";

export const DeliveryTimelineWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDeliveryTimeline.useQuery(undefined, { refetchInterval: 120000 });
  const items = Array.isArray(data) ? data : data?.deliveries || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Clock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{d.loadNumber || `Load #${i+1}`}</p>
              <p className="text-[10px] text-gray-500">{d.destination || "N/A"}</p>
            </div>
            <span className="text-[10px] text-cyan-400 whitespace-nowrap">{d.eta || "TBD"}</span>
          </div>
        )} empty="No upcoming deliveries" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CatalystNetworkWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCatalystNetwork.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { total: 0, active: 0, preferred: 0, new: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: s.total, color: "bg-blue-500/10" },
          { label: "Active", value: s.active, color: "bg-green-500/10" },
          { label: "Preferred", value: s.preferred, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="New This Month" value={s.new} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CostSavingsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCostSavings.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalSaved: 0, opportunities: 0, percentSaved: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.totalSaved || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Saved</p>
        </div>
        <StatRow label="Savings Rate" value={`${s.percentSaved}%`} color="text-green-400" />
        <StatRow label="Opportunities" value={s.opportunities} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ShippingCalendarWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getShippingCalendar.useQuery(undefined, { refetchInterval: 300000 });
  const events = Array.isArray(data) ? data : data?.events || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={events.slice(0, exp ? 6 : 3)} renderItem={(e: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Calendar className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{e.title || `Event #${i+1}`}</p>
              <p className="text-[10px] text-gray-500">{e.date || "TBD"}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px]">{e.type || "Pickup"}</Badge>
          </div>
        )} empty="No scheduled events" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PODDocumentsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPodDocuments.useQuery(undefined, { refetchInterval: 300000 });
  const docs = Array.isArray(data) ? data : data?.documents || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total Documents" value={docs.length} color="text-blue-400" />
        <WidgetList items={docs.slice(0, exp ? 5 : 2)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{d.name || `POD-${i+1}`}</span>
            <span className="text-[10px] text-gray-500">{d.date || ""}</span>
          </div>
        )} empty="No POD documents" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const FreightAuditWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getFreightAudit.useQuery(undefined, { refetchInterval: 300000 });
  const a = data || { totalInvoices: 0, discrepancies: 0, amountSaved: 0, pendingReview: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Invoices", value: a.totalInvoices, color: "bg-blue-500/10" },
          { label: "Issues", value: a.discrepancies, color: "bg-red-500/10" },
          { label: "Pending", value: a.pendingReview, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Amount Recovered" value={`$${(a.amountSaved || 0).toLocaleString()}`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CatalystCapacityWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCatalystCapacity.useQuery(undefined, { refetchInterval: 120000 });
  const c = data || { available: 0, booked: 0, utilization: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Available", value: c.available, color: "bg-green-500/10" },
          { label: "Booked", value: c.booked, color: "bg-blue-500/10" },
        ]} />
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Utilization</span>
            <span className="text-cyan-400">{c.utilization}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${c.utilization}%` }} />
          </div>
        </div>
      </div>
    )}</ResponsiveWidget>
  );
};

export const ShipmentAnalyticsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getShipmentAnalytics.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalShipments: 0, onTime: 0, late: 0, avgTransitDays: 0, topLane: "" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: s.totalShipments, color: "bg-blue-500/10" },
          { label: "On Time", value: s.onTime, color: "bg-green-500/10" },
          { label: "Late", value: s.late, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Avg Transit Days" value={s.avgTransitDays} color="text-cyan-400" />
        {s.topLane && <StatRow label="Top Lane" value={s.topLane} color="text-purple-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};
