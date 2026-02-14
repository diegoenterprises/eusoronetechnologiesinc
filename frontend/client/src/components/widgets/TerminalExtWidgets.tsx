import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Truck, Box, TrendingUp, AlertCircle, CheckCircle, DollarSign, ArrowRight, Shield, Target } from "lucide-react";

export const OutboundShipmentsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getOutboundShipments.useQuery(undefined, { refetchInterval: 120000 });
  const shipments = Array.isArray(data) ? data : data?.shipments || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Outbound Today" value={shipments.length} color="text-blue-400" />
        <WidgetList items={shipments.slice(0, exp ? 4 : 2)} renderItem={(s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Truck className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{s.catalyst || `Shipment ${i+1}`}</span>
            <span className="text-[10px] text-cyan-400">{s.status || "Loading"}</span>
          </div>
        )} empty="No outbound shipments" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const EquipmentInventoryWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEquipmentInventory.useQuery(undefined, { refetchInterval: 300000 });
  const e = data || { forklifts: 0, pallets: 0, trailers: 0, available: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Forklifts", value: e.forklifts, color: "bg-blue-500/10" },
          { label: "Pallets", value: e.pallets, color: "bg-cyan-500/10" },
          { label: "Trailers", value: e.trailers, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Available" value={e.available} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LoadingEfficiencyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLoadingEfficiency.useQuery(undefined, { refetchInterval: 300000 });
  const e = data || { avgLoadTime: 0, avgUnloadTime: 0, throughput: 0, utilization: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Avg Load Time" value={`${e.avgLoadTime} min`} color="text-cyan-400" />
        <StatRow label="Avg Unload Time" value={`${e.avgUnloadTime} min`} color="text-blue-400" />
        <StatRow label="Throughput" value={`${e.throughput}/hr`} color="text-green-400" />
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Utilization</span>
            <span className="text-cyan-400">{e.utilization}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${e.utilization}%` }} />
          </div>
        </div>
      </div>
    )}</ResponsiveWidget>
  );
};

export const DamageReportsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDamageReports.useQuery(undefined, { refetchInterval: 300000 });
  const reports = Array.isArray(data) ? data : data?.reports || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : reports.length === 0 ? (
      <div className="text-center p-3 rounded-lg bg-green-500/10">
        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-green-400">No damage reports</p>
      </div>
    ) : (
      <WidgetList items={reports.slice(0, exp ? 4 : 2)} renderItem={(r: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{r.description || `Report ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{r.date || ""}</p>
          </div>
          <span className="text-[10px] text-red-400">${r.cost || 0}</span>
        </div>
      )} />
    )}</ResponsiveWidget>
  );
};

export const StorageCapacityWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getStorageCapacity.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { total: 0, used: 0, available: 0, utilization: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Storage Usage</span>
            <span className={s.utilization > 90 ? "text-red-400" : "text-cyan-400"}>{s.utilization}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${s.utilization > 90 ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`} style={{ width: `${s.utilization}%` }} />
          </div>
        </div>
        <StatRow label="Total Capacity" value={s.total} color="text-blue-400" />
        <StatRow label="Available" value={s.available} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CrossDockOperationsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCrossDockOps.useQuery(undefined, { refetchInterval: 120000 });
  const o = data || { active: 0, completed: 0, avgTransferTime: 0, efficiency: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: o.active, color: "bg-blue-500/10" },
          { label: "Done", value: o.completed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Avg Transfer" value={`${o.avgTransferTime} min`} color="text-cyan-400" />
        <StatRow label="Efficiency" value={`${o.efficiency}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const SafetyIncidentsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTerminalSafetyIncidents.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { total: 0, thisMonth: 0, daysWithout: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">{s.daysWithout}</p>
          <p className="text-xs text-gray-400">Days Without Incident</p>
        </div>
        <StatRow label="This Month" value={s.thisMonth} color="text-yellow-400" />
        <StatRow label="Total YTD" value={s.total} color="text-red-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DetentionChargesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDetentionCharges.useQuery(undefined, { refetchInterval: 300000 });
  const c = data || { totalCharged: 0, avgPerIncident: 0, incidents: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-orange-500/10">
          <p className="text-2xl font-bold text-orange-400">${(c.totalCharged || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Detention Charges</p>
        </div>
        <StatRow label="Incidents" value={c.incidents} color="text-yellow-400" />
        <StatRow label="Avg/Incident" value={`$${c.avgPerIncident}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const InventoryAccuracyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getInventoryAccuracy.useQuery(undefined, { refetchInterval: 300000 });
  const a = data || { accuracy: 0, discrepancies: 0, lastAudit: "N/A", itemsTracked: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">{a.accuracy}%</p>
          <p className="text-xs text-gray-400">Inventory Accuracy</p>
        </div>
        <StatRow label="Discrepancies" value={a.discrepancies} color={a.discrepancies > 0 ? "text-red-400" : "text-green-400"} />
        <StatRow label="Items Tracked" value={(a.itemsTracked || 0).toLocaleString()} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const TerminalKPIsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTerminalKPIs.useQuery(undefined, { refetchInterval: 300000 });
  const k = data || { throughput: 0, onTimePickup: 0, dockUtilization: 0, laborEfficiency: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Throughput" value={`${k.throughput}/day`} color="text-blue-400" />
        <StatRow label="On-Time Pickup" value={`${k.onTimePickup}%`} color="text-green-400" />
        <StatRow label="Dock Utilization" value={`${k.dockUtilization}%`} color="text-cyan-400" />
        <StatRow label="Labor Efficiency" value={`${k.laborEfficiency}%`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};
