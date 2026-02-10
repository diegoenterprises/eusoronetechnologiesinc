import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Shield, Star, Wrench } from "lucide-react";

export const DriverAvailabilityWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDriverAvailability.useQuery(undefined, { refetchInterval: 60000 });
  const drivers = Array.isArray(data) ? data : data?.drivers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={drivers.slice(0, exp ? 6 : 3)} renderItem={(d: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Users className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{d.name || `Driver ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${d.available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {d.available ? "Available" : d.status || "Off Duty"}
          </Badge>
        </div>
      )} empty="No drivers found" />
    )}</ResponsiveWidget>
  );
};

export const DetentionTimeWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDetentionTime.useQuery(undefined, { refetchInterval: 300000 });
  const d = data || { avgHours: 0, totalCost: 0, worstFacility: "", incidents: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-orange-500/10">
          <p className="text-2xl font-bold text-orange-400">{d.avgHours}h</p>
          <p className="text-xs text-gray-400">Avg Detention</p>
        </div>
        <StatRow label="Total Cost" value={`$${(d.totalCost || 0).toLocaleString()}`} color="text-red-400" />
        <StatRow label="Incidents" value={d.incidents} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const InsuranceTrackerWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getInsuranceTracker.useQuery(undefined, { refetchInterval: 600000 });
  const s = data || { active: 0, expiringSoon: 0, expired: 0, totalPremium: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: s.active, color: "bg-green-500/10" },
          { label: "Expiring", value: s.expiringSoon, color: "bg-yellow-500/10" },
          { label: "Expired", value: s.expired, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Total Premium" value={`$${(s.totalPremium || 0).toLocaleString()}/yr`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const BrokerRelationshipsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getBrokerRelationships.useQuery(undefined, { refetchInterval: 300000 });
  const brokers = Array.isArray(data) ? data : data?.brokers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={brokers.slice(0, exp ? 5 : 3)} renderItem={(b: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{b.name || `Broker ${i+1}`}</span>
          <span className="text-[10px] text-green-400">{b.loads || 0} loads</span>
        </div>
      )} empty="No broker relationships" />
    )}</ResponsiveWidget>
  );
};
