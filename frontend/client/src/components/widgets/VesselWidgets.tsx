import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import {
  Ship, Anchor, Package, Container, FileText, Shield, DollarSign,
  Calendar, Users, Wrench, Fuel, Navigation, Gauge, Map, Clock,
  BarChart3, Waves, Compass, Radio, Route, AlertCircle, Sun,
  Truck, Train, Store, Search, TrendingUp, CheckCircle, Boxes, Globe
} from "lucide-react";

// ============================================================================
// VESSEL SHIPPER WIDGETS (15)
// ============================================================================

export const VesselActiveShipmentsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getActiveBookings.useQuery(undefined, { refetchInterval: 60000 });
  const items = Array.isArray(data) ? data : data?.bookings || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Bookings" value={items.length} color="text-cyan-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(b: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{b.bookingRef || `BK-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{b.vessel || "N/A"} &rarr; {b.destination || "N/A"}</p>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{b.status || "Active"}</Badge>
          </div>
        )} empty="No active bookings" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselContainersWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getContainerStatus.useQuery(undefined, { refetchInterval: 60000 });
  const items = Array.isArray(data) ? data : data?.containers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total Containers" value={items.length} color="text-blue-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Container className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.containerId || `CNTR-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{c.type || "20ft"} - {c.location || "In Transit"}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{c.status || "Loaded"}</Badge>
          </div>
        )} empty="No containers tracked" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselPortStatusWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortStatus.useQuery(undefined, { refetchInterval: 120000 });
  const ports = Array.isArray(data) ? data : data?.ports || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={ports.slice(0, exp ? 6 : 3)} renderItem={(p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Anchor className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{p.portName || `Port ${i + 1}`}</p>
              <p className="text-xs text-gray-500">Wait: {p.waitTime || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${p.congestion === "High" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{p.congestion || "Normal"}</Badge>
          </div>
        )} empty="No port data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselBOLWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBillsOfLading.useQuery(undefined, { refetchInterval: 120000 });
  const docs = Array.isArray(data) ? data : data?.bols || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total BOLs" value={docs.length} color="text-purple-400" />
        <WidgetList items={docs.slice(0, exp ? 6 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{d.bolNumber || `BOL-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{d.shipper || "N/A"}</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">{d.status || "Draft"}</Badge>
          </div>
        )} empty="No bills of lading" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselCustomsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCustomsStatus.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { pending: 0, cleared: 0, held: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Pending", value: s.pending, color: "bg-yellow-500/10" },
          { label: "Cleared", value: s.cleared, color: "bg-green-500/10" },
          { label: "Held", value: s.held, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Total Entries" value={s.total} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselIncotermsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getIncoterms.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.terms || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={items.slice(0, exp ? 8 : 4)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-bold text-white">{t.code || "FOB"}</span>
            <span className="text-xs text-gray-500 flex-1 truncate">{t.description || "Free On Board"}</span>
            <span className="text-xs text-indigo-400">{t.usageCount || 0}</span>
          </div>
        )} empty="No incoterms data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getOceanRates.useQuery(undefined, { refetchInterval: 300000 });
  const rates = Array.isArray(data) ? data : data?.rates || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-2">
        <WidgetList items={rates.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.lane || `Lane ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.carrier || "N/A"}</p>
            </div>
            <span className="text-xs font-semibold text-green-400">${(r.rate || 0).toLocaleString()}</span>
          </div>
        )} empty="No rate quotes" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselBookingsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBookings.useQuery(undefined, { refetchInterval: 60000 });
  const items = Array.isArray(data) ? data : data?.bookings || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total Bookings" value={items.length} color="text-cyan-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(b: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Calendar className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{b.reference || `BKG-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{b.origin || "N/A"} &rarr; {b.destination || "N/A"}</p>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{b.status || "Confirmed"}</Badge>
          </div>
        )} empty="No bookings" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselAnalyticsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getAnalytics.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalShipments: 0, onTime: 0, avgTransit: 0, costPerTEU: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Shipments", value: s.totalShipments, color: "bg-blue-500/10" },
          { label: "On-Time %", value: `${s.onTime}%`, color: "bg-green-500/10" },
          { label: "Avg Transit", value: `${s.avgTransit}d`, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Cost/TEU" value={`$${(s.costPerTEU || 0).toLocaleString()}`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselConsolidationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getConsolidation.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { lclShipments: 0, consolidated: 0, savings: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "LCL Shipments", value: s.lclShipments, color: "bg-blue-500/10" },
          { label: "Consolidated", value: s.consolidated, color: "bg-green-500/10" },
          { label: "Savings", value: `$${(s.savings || 0).toLocaleString()}`, color: "bg-emerald-500/10" },
        ]} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselInsuranceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCargoInsurance.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { activePolicies: 0, totalCoverage: 0, pendingClaims: 0, premium: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Policies", value: s.activePolicies, color: "bg-blue-500/10" },
          { label: "Coverage", value: `$${(s.totalCoverage / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "Claims", value: s.pendingClaims, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Monthly Premium" value={`$${(s.premium || 0).toLocaleString()}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselOriginPortsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getOriginPorts.useQuery(undefined, { refetchInterval: 300000 });
  const ports = Array.isArray(data) ? data : data?.ports || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={ports.slice(0, exp ? 6 : 3)} renderItem={(p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Anchor className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{p.name || `Port ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{p.country || "N/A"}</p>
            </div>
            <span className="text-xs text-teal-400">{p.shipments || 0} loads</span>
          </div>
        )} empty="No origin ports" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselDestPortsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getDestPorts.useQuery(undefined, { refetchInterval: 300000 });
  const ports = Array.isArray(data) ? data : data?.ports || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={ports.slice(0, exp ? 6 : 3)} renderItem={(p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Anchor className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{p.name || `Port ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{p.country || "N/A"}</p>
            </div>
            <span className="text-xs text-orange-400">{p.shipments || 0} loads</span>
          </div>
        )} empty="No destination ports" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselCarrierRelsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCarrierRelations.useQuery(undefined, { refetchInterval: 300000 });
  const carriers = Array.isArray(data) ? data : data?.carriers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Shipping Lines" value={carriers.length} color="text-blue-400" />
        <WidgetList items={carriers.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.name || `Carrier ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{c.contact || "N/A"}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{c.tier || "Standard"}</Badge>
          </div>
        )} empty="No carrier relations" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselFreightCostsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getFreightCosts.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { oceanFreight: 0, baf: 0, thc: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.total || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Freight Cost</p>
        </div>
        <StatRow label="Ocean Freight" value={`$${(s.oceanFreight || 0).toLocaleString()}`} color="text-blue-400" />
        <StatRow label="BAF Surcharge" value={`$${(s.baf || 0).toLocaleString()}`} color="text-yellow-400" />
        <StatRow label="THC" value={`$${(s.thc || 0).toLocaleString()}`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// VESSEL OPERATOR WIDGETS (15)
// ============================================================================

export const VesselFleetWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getFleet.useQuery(undefined, { refetchInterval: 60000 });
  const vessels = Array.isArray(data) ? data : data?.vessels || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Fleet Size" value={vessels.length} color="text-cyan-400" />
        <WidgetList items={vessels.slice(0, exp ? 6 : 3)} renderItem={(v: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{v.name || `Vessel ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{v.type || "Container"} - {v.capacity || 0} TEU</p>
            </div>
            <Badge className={`border-0 text-xs ${v.status === "At Sea" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>{v.status || "At Sea"}</Badge>
          </div>
        )} empty="No vessels in fleet" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselPortScheduleWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortSchedule.useQuery(undefined, { refetchInterval: 120000 });
  const calls = Array.isArray(data) ? data : data?.portCalls || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={calls.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Calendar className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.port || `Port ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{c.vessel || "N/A"}</p>
            </div>
            <span className="text-xs text-purple-400">{c.eta || "TBD"}</span>
          </div>
        )} empty="No scheduled port calls" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselContainerInvWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getContainerInventory.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { total: 0, loaded: 0, empty: 0, damaged: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: s.total, color: "bg-blue-500/10" },
          { label: "Loaded", value: s.loaded, color: "bg-green-500/10" },
          { label: "Empty", value: s.empty, color: "bg-gray-500/10" },
        ]} />
        <StatRow label="Damaged" value={s.damaged} color="text-red-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselVoyageRevenueWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getVoyageRevenue.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalRevenue: 0, voyages: 0, avgPerVoyage: 0, margin: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Revenue</p>
        </div>
        <StatRow label="Voyages" value={s.voyages} color="text-blue-400" />
        <StatRow label="Avg/Voyage" value={`$${(s.avgPerVoyage || 0).toLocaleString()}`} color="text-cyan-400" />
        <StatRow label="Margin" value={`${s.margin}%`} color="text-emerald-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselBunkerFuelWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBunkerFuel.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { totalCapacity: 0, currentLevel: 0, dailyConsumption: 0, daysRemaining: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Level", value: `${s.currentLevel}%`, color: s.currentLevel > 30 ? "bg-green-500/10" : "bg-red-500/10" },
          { label: "Daily Use", value: `${s.dailyConsumption}t`, color: "bg-blue-500/10" },
          { label: "Days Left", value: s.daysRemaining, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Tank Capacity" value={`${(s.totalCapacity || 0).toLocaleString()} MT`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselCrewWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCrewManagement.useQuery(undefined, { refetchInterval: 300000 });
  const crew = Array.isArray(data) ? data : data?.members || [];
  const s = data || { total: crew.length, onBoard: 0, onLeave: 0 };
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Total", value: s.total || crew.length, color: "bg-blue-500/10" },
          { label: "On Board", value: s.onBoard, color: "bg-green-500/10" },
          { label: "On Leave", value: s.onLeave, color: "bg-yellow-500/10" },
        ]} />
        <WidgetList items={crew.slice(0, exp ? 4 : 2)} renderItem={(m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{m.name || `Crew ${i + 1}`}</span>
            <span className="text-xs text-gray-500">{m.rank || "Seaman"}</span>
          </div>
        )} empty="No crew data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselCargoManifestWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCargoManifest.useQuery(undefined, { refetchInterval: 120000 });
  const items = Array.isArray(data) ? data : data?.cargo || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Cargo Items" value={items.length} color="text-orange-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Package className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.description || `Cargo ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{c.weight || "N/A"} - Hold {c.hold || i + 1}</p>
            </div>
            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">{c.type || "General"}</Badge>
          </div>
        )} empty="No cargo manifest data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselOpRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getOperatorRates.useQuery(undefined, { refetchInterval: 300000 });
  const rates = Array.isArray(data) ? data : data?.rates || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-2">
        <WidgetList items={rates.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.route || `Route ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.containerType || "20ft"}</p>
            </div>
            <span className="text-xs font-semibold text-green-400">${(r.rate || 0).toLocaleString()}</span>
          </div>
        )} empty="No rate data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselOpShippersWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getShipperAccounts.useQuery(undefined, { refetchInterval: 300000 });
  const shippers = Array.isArray(data) ? data : data?.shippers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Shipper Accounts" value={shippers.length} color="text-blue-400" />
        <WidgetList items={shippers.slice(0, exp ? 6 : 3)} renderItem={(s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{s.company || `Shipper ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{s.volume || 0} TEU/yr</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{s.tier || "Standard"}</Badge>
          </div>
        )} empty="No shipper accounts" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselMaintenanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getMaintenanceSchedule.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.tasks || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Open Tasks" value={items.filter((t: any) => t.status !== "Complete").length} color="text-yellow-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Wrench className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{t.task || `Task ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{t.vessel || "N/A"} - {t.dueDate || "TBD"}</p>
            </div>
            <Badge className={`border-0 text-xs ${t.status === "Overdue" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{t.status || "Pending"}</Badge>
          </div>
        )} empty="No maintenance tasks" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselWeatherRoutingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getWeatherRouting.useQuery(undefined, { refetchInterval: 120000 });
  const routes = Array.isArray(data) ? data : data?.routes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={routes.slice(0, exp ? 5 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Navigation className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.route || `Route ${i + 1}`}</p>
              <p className="text-xs text-gray-500">ETA: {r.eta || "N/A"} - Wind: {r.windForce || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${r.risk === "High" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{r.risk || "Low"}</Badge>
          </div>
        )} empty="No route data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselCanalWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCanalTransit.useQuery(undefined, { refetchInterval: 300000 });
  const transits = Array.isArray(data) ? data : data?.transits || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={transits.slice(0, exp ? 5 : 3)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Waves className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{t.canal || "Panama Canal"}</p>
              <p className="text-xs text-gray-500">{t.vessel || "N/A"} - {t.date || "TBD"}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{t.status || "Scheduled"}</Badge>
          </div>
        )} empty="No canal transits" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselUtilizationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getFleetUtilization.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { avgUtilization: 0, maxUtilization: 0, teuCapacity: 0, teuUsed: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">{s.avgUtilization}%</p>
          <p className="text-xs text-gray-400">Avg Utilization</p>
        </div>
        <StatRow label="Peak Utilization" value={`${s.maxUtilization}%`} color="text-green-400" />
        <StatRow label="TEU Used / Capacity" value={`${(s.teuUsed || 0).toLocaleString()} / ${(s.teuCapacity || 0).toLocaleString()}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselOpCostsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getOperatingCosts.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { fuel: 0, crew: 0, port: 0, maintenance: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-red-500/10">
          <p className="text-2xl font-bold text-red-400">${(s.total || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Operating Costs</p>
        </div>
        <StatRow label="Fuel" value={`$${(s.fuel || 0).toLocaleString()}`} color="text-orange-400" />
        <StatRow label="Crew" value={`$${(s.crew || 0).toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Port Fees" value={`$${(s.port || 0).toLocaleString()}`} color="text-purple-400" />
        <StatRow label="Maintenance" value={`$${(s.maintenance || 0).toLocaleString()}`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VesselNetworkMapWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getNetworkMap.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { routes: 0, ports: 0, regions: 0, vessels: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Routes", value: s.routes, color: "bg-cyan-500/10" },
          { label: "Ports", value: s.ports, color: "bg-teal-500/10" },
          { label: "Regions", value: s.regions, color: "bg-blue-500/10" },
        ]} />
        <StatRow label="Active Vessels" value={s.vessels} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// PORT MASTER WIDGETS (15)
// ============================================================================

export const PortYardInventoryWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getYardInventory.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { total: 0, import: 0, export: 0, empty: 0, utilization: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: s.total, color: "bg-blue-500/10" },
          { label: "Import", value: s.import, color: "bg-green-500/10" },
          { label: "Export", value: s.export, color: "bg-orange-500/10" },
        ]} />
        <StatRow label="Empty" value={s.empty} color="text-gray-400" />
        <StatRow label="Yard Utilization" value={`${s.utilization}%`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortArrivalsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getVesselArrivals.useQuery(undefined, { refetchInterval: 60000 });
  const vessels = Array.isArray(data) ? data : data?.arrivals || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Expected Arrivals" value={vessels.length} color="text-green-400" />
        <WidgetList items={vessels.slice(0, exp ? 6 : 3)} renderItem={(v: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{v.vesselName || `Vessel ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{v.origin || "N/A"} - {v.containers || 0} TEU</p>
            </div>
            <span className="text-xs text-green-400">{v.eta || "TBD"}</span>
          </div>
        )} empty="No arrivals expected" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortDeparturesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getVesselDepartures.useQuery(undefined, { refetchInterval: 60000 });
  const vessels = Array.isArray(data) ? data : data?.departures || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Departing Vessels" value={vessels.length} color="text-orange-400" />
        <WidgetList items={vessels.slice(0, exp ? 6 : 3)} renderItem={(v: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{v.vesselName || `Vessel ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{v.destination || "N/A"} - {v.containers || 0} TEU</p>
            </div>
            <span className="text-xs text-orange-400">{v.etd || "TBD"}</span>
          </div>
        )} empty="No departures scheduled" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortCranesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCraneOperations.useQuery(undefined, { refetchInterval: 60000 });
  const cranes = Array.isArray(data) ? data : data?.cranes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Cranes" value={cranes.filter((c: any) => c.status === "Active").length} color="text-green-400" />
        <WidgetList items={cranes.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Wrench className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.name || `Crane ${i + 1}`}</p>
              <p className="text-xs text-gray-500">Moves: {c.movesPerHour || 0}/hr</p>
            </div>
            <Badge className={`border-0 text-xs ${c.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{c.status || "Idle"}</Badge>
          </div>
        )} empty="No crane data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortBerthsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBerthStatus.useQuery(undefined, { refetchInterval: 60000 });
  const berths = Array.isArray(data) ? data : data?.berths || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Total", value: berths.length, color: "bg-blue-500/10" },
          { label: "Occupied", value: berths.filter((b: any) => b.occupied).length, color: "bg-red-500/10" },
          { label: "Available", value: berths.filter((b: any) => !b.occupied).length, color: "bg-green-500/10" },
        ]} />
        <WidgetList items={berths.slice(0, exp ? 4 : 2)} renderItem={(b: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Anchor className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{b.name || `Berth ${i + 1}`}</span>
            <Badge className={`border-0 text-xs ${b.occupied ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{b.occupied ? b.vessel || "Occupied" : "Free"}</Badge>
          </div>
        )} empty="No berth data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortContainerMovementWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getContainerMovement.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { loaded: 0, discharged: 0, shifted: 0, gateIn: 0, gateOut: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Loaded", value: s.loaded, color: "bg-green-500/10" },
          { label: "Discharged", value: s.discharged, color: "bg-blue-500/10" },
          { label: "Shifted", value: s.shifted, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Gate In" value={s.gateIn} color="text-green-400" />
        <StatRow label="Gate Out" value={s.gateOut} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortDwellTimeWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getDwellTime.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { avgImport: 0, avgExport: 0, avgEmpty: 0, overDwell: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Import", value: `${s.avgImport}d`, color: "bg-blue-500/10" },
          { label: "Export", value: `${s.avgExport}d`, color: "bg-green-500/10" },
          { label: "Empty", value: `${s.avgEmpty}d`, color: "bg-gray-500/10" },
        ]} />
        <StatRow label="Over-Dwell Containers" value={s.overDwell} color="text-red-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortDeconsolidationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getDeconsolidation.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { pending: 0, inProgress: 0, completed: 0, totalPieces: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Pending", value: s.pending, color: "bg-yellow-500/10" },
          { label: "In Progress", value: s.inProgress, color: "bg-blue-500/10" },
          { label: "Completed", value: s.completed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Total Pieces" value={s.totalPieces} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortConsolidationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortConsolidation.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { stuffingJobs: 0, containersStuffed: 0, pending: 0, utilization: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Jobs", value: s.stuffingJobs, color: "bg-blue-500/10" },
          { label: "Stuffed", value: s.containersStuffed, color: "bg-green-500/10" },
          { label: "Pending", value: s.pending, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Stuffing Utilization" value={`${s.utilization}%`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortRailConnectionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortRailConnections.useQuery(undefined, { refetchInterval: 120000 });
  const trains = Array.isArray(data) ? data : data?.trains || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Rail Moves Today" value={trains.length} color="text-purple-400" />
        <WidgetList items={trains.slice(0, exp ? 5 : 3)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Train className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{t.trainId || `Train ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{t.destination || "N/A"} - {t.containers || 0} units</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">{t.status || "Loading"}</Badge>
          </div>
        )} empty="No rail connections" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortTruckGateWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getTruckGate.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { gateIn: 0, gateOut: 0, inQueue: 0, avgTurnTime: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Gate In", value: s.gateIn, color: "bg-green-500/10" },
          { label: "Gate Out", value: s.gateOut, color: "bg-orange-500/10" },
          { label: "In Queue", value: s.inQueue, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Avg Turn Time" value={`${s.avgTurnTime} min`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortHazmatWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getHazmatStorage.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { total: 0, imdgClasses: 0, overdue: 0, capacity: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Hazmat", value: s.total, color: "bg-red-500/10" },
          { label: "IMDG Classes", value: s.imdgClasses, color: "bg-orange-500/10" },
          { label: "Overdue", value: s.overdue, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Storage Capacity" value={`${s.capacity}%`} color="text-red-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortStorageCostsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getStorageRevenue.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalRevenue: 0, demurrage: 0, detention: 0, storage: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Storage Revenue</p>
        </div>
        <StatRow label="Demurrage" value={`$${(s.demurrage || 0).toLocaleString()}`} color="text-orange-400" />
        <StatRow label="Detention" value={`$${(s.detention || 0).toLocaleString()}`} color="text-yellow-400" />
        <StatRow label="Storage" value={`$${(s.storage || 0).toLocaleString()}`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortCustomsCheckpointWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCustomsCheckpoint.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { inspections: 0, cleared: 0, held: 0, examRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Inspections", value: s.inspections, color: "bg-blue-500/10" },
          { label: "Cleared", value: s.cleared, color: "bg-green-500/10" },
          { label: "Held", value: s.held, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Exam Rate" value={`${s.examRate}%`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const PortMetricsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortMetrics.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { throughput: 0, berthOccupancy: 0, craneProductivity: 0, truckTurns: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Throughput", value: `${(s.throughput || 0).toLocaleString()}`, color: "bg-blue-500/10" },
          { label: "Berth Occ.", value: `${s.berthOccupancy}%`, color: "bg-green-500/10" },
          { label: "Crane MPH", value: s.craneProductivity, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Truck Turns/Day" value={s.truckTurns} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// SHIP CAPTAIN WIDGETS (15)
// ============================================================================

export const CaptainVoyageWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCurrentVoyage.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { voyageNo: "N/A", origin: "N/A", destination: "N/A", progress: 0, eta: "N/A", speed: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-cyan-500/10">
          <p className="text-lg font-bold text-cyan-400">{s.voyageNo}</p>
          <p className="text-xs text-gray-400">{s.origin} &rarr; {s.destination}</p>
        </div>
        <StatRow label="Progress" value={`${s.progress}%`} color="text-green-400" />
        <StatRow label="ETA" value={s.eta} color="text-blue-400" />
        <StatRow label="Speed" value={`${s.speed} kts`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainNavChartWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getNavigationChart.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { lat: 0, lon: 0, heading: 0, depth: 0, nextWaypoint: "N/A", distToWP: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Latitude", value: s.lat?.toFixed(4) || "0", color: "bg-blue-500/10" },
          { label: "Longitude", value: s.lon?.toFixed(4) || "0", color: "bg-blue-500/10" },
          { label: "Heading", value: `${s.heading}\u00B0`, color: "bg-cyan-500/10" },
        ]} />
        <StatRow label="Depth" value={`${s.depth}m`} color="text-teal-400" />
        <StatRow label="Next Waypoint" value={s.nextWaypoint} color="text-purple-400" />
        <StatRow label="Dist to WP" value={`${s.distToWP} nm`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainCargoWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCaptainCargo.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { totalTEU: 0, loaded: 0, reefer: 0, hazmat: 0, stability: "Good" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total TEU", value: s.totalTEU, color: "bg-blue-500/10" },
          { label: "Reefer", value: s.reefer, color: "bg-cyan-500/10" },
          { label: "Hazmat", value: s.hazmat, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Loaded" value={s.loaded} color="text-green-400" />
        <StatRow label="Stability" value={s.stability} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainCrewWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCaptainCrew.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { total: 0, onWatch: 0, offWatch: 0, watchSchedule: "N/A" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: s.total, color: "bg-blue-500/10" },
          { label: "On Watch", value: s.onWatch, color: "bg-green-500/10" },
          { label: "Off Watch", value: s.offWatch, color: "bg-gray-500/10" },
        ]} />
        <StatRow label="Current Watch" value={s.watchSchedule} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainSafetyDrillsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getSafetyDrills.useQuery(undefined, { refetchInterval: 300000 });
  const drills = Array.isArray(data) ? data : data?.drills || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Scheduled Drills" value={drills.length} color="text-yellow-400" />
        <WidgetList items={drills.slice(0, exp ? 5 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{d.type || `Drill ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{d.scheduledDate || "TBD"}</p>
            </div>
            <Badge className={`border-0 text-xs ${d.status === "Completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{d.status || "Pending"}</Badge>
          </div>
        )} empty="No drills scheduled" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainEngineWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getEngineRoom.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { mainEngine: "Normal", rpm: 0, oilPressure: 0, temp: 0, generatorStatus: "Online" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-lg font-bold text-green-400">{s.mainEngine}</p>
          <p className="text-xs text-gray-400">Main Engine Status</p>
        </div>
        <StatRow label="RPM" value={s.rpm} color="text-cyan-400" />
        <StatRow label="Oil Pressure" value={`${s.oilPressure} bar`} color="text-yellow-400" />
        <StatRow label="Temperature" value={`${s.temp}\u00B0C`} color="text-orange-400" />
        <StatRow label="Generator" value={s.generatorStatus} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainWeatherWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getMarineWeather.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { windSpeed: 0, windDir: "N/A", waveHeight: 0, visibility: 0, seaState: "Calm", barometer: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Wind", value: `${s.windSpeed} kts`, color: "bg-blue-500/10" },
          { label: "Waves", value: `${s.waveHeight}m`, color: "bg-cyan-500/10" },
          { label: "Visibility", value: `${s.visibility} nm`, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Wind Direction" value={s.windDir} color="text-blue-400" />
        <StatRow label="Sea State" value={s.seaState} color="text-teal-400" />
        <StatRow label="Barometer" value={`${s.barometer} mb`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainFuelWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCaptainFuel.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { hfo: 0, mdo: 0, freshWater: 0, daysRange: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "HFO", value: `${s.hfo}%`, color: s.hfo > 30 ? "bg-green-500/10" : "bg-red-500/10" },
          { label: "MDO", value: `${s.mdo}%`, color: s.mdo > 30 ? "bg-green-500/10" : "bg-red-500/10" },
          { label: "Fresh Water", value: `${s.freshWater}%`, color: "bg-blue-500/10" },
        ]} />
        <StatRow label="Range Remaining" value={`${s.daysRange} days`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainPortApproachWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPortApproach.useQuery(undefined, { refetchInterval: 120000 });
  const s = data || { port: "N/A", eta: "N/A", pilotBoarding: "N/A", berth: "N/A", draft: 0, tides: "N/A" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-teal-500/10">
          <p className="text-lg font-bold text-teal-400">{s.port}</p>
          <p className="text-xs text-gray-400">Next Port</p>
        </div>
        <StatRow label="ETA" value={s.eta} color="text-blue-400" />
        <StatRow label="Pilot Boarding" value={s.pilotBoarding} color="text-purple-400" />
        <StatRow label="Berth Assigned" value={s.berth} color="text-cyan-400" />
        <StatRow label="Draft" value={`${s.draft}m`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainCommsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getShipComms.useQuery(undefined, { refetchInterval: 60000 });
  const msgs = Array.isArray(data) ? data : data?.messages || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Messages" value={msgs.length} color="text-blue-400" />
        <WidgetList items={msgs.slice(0, exp ? 5 : 3)} renderItem={(m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Radio className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{m.from || `Station ${i + 1}`}</p>
              <p className="text-xs text-gray-500 truncate">{m.message || "N/A"}</p>
            </div>
            <span className="text-xs text-gray-500">{m.time || ""}</span>
          </div>
        )} empty="No messages" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainMaintenanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCaptainMaintenance.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.tasks || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Open Items" value={items.filter((t: any) => t.status !== "Complete").length} color="text-yellow-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Wrench className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{t.item || `Item ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{t.system || "N/A"} - {t.priority || "Normal"}</p>
            </div>
            <Badge className={`border-0 text-xs ${t.status === "Overdue" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{t.status || "Pending"}</Badge>
          </div>
        )} empty="No maintenance items" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainVoyagePlanWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getVoyagePlan.useQuery(undefined, { refetchInterval: 300000 });
  const waypoints = Array.isArray(data) ? data : data?.waypoints || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Waypoints" value={waypoints.length} color="text-purple-400" />
        <WidgetList items={waypoints.slice(0, exp ? 6 : 3)} renderItem={(w: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Route className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{w.name || `WP ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{w.lat?.toFixed(2) || 0}, {w.lon?.toFixed(2) || 0}</p>
            </div>
            <span className="text-xs text-purple-400">{w.eta || ""}</span>
          </div>
        )} empty="No voyage plan" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainSpeedCourseWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getSpeedCourse.useQuery(undefined, { refetchInterval: 30000 });
  const s = data || { speed: 0, course: 0, orderedSpeed: 0, rpm: 0, slip: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Speed", value: `${s.speed} kts`, color: "bg-cyan-500/10" },
          { label: "Course", value: `${s.course}\u00B0`, color: "bg-blue-500/10" },
          { label: "RPM", value: s.rpm, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Ordered Speed" value={`${s.orderedSpeed} kts`} color="text-green-400" />
        <StatRow label="Slip" value={`${s.slip}%`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainAnchorWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getAnchorWatch.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { status: "Not Anchored", position: "N/A", depth: 0, chainOut: 0, swingRadius: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-teal-500/10">
          <p className="text-lg font-bold text-teal-400">{s.status}</p>
          <p className="text-xs text-gray-400">Anchor Status</p>
        </div>
        <StatRow label="Position" value={s.position} color="text-blue-400" />
        <StatRow label="Depth" value={`${s.depth}m`} color="text-cyan-400" />
        <StatRow label="Chain Out" value={`${s.chainOut} shackles`} color="text-yellow-400" />
        <StatRow label="Swing Radius" value={`${s.swingRadius}m`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CaptainBridgeAlertsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBridgeAlerts.useQuery(undefined, { refetchInterval: 30000 });
  const alerts = Array.isArray(data) ? data : data?.alerts || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Alerts" value={alerts.filter((a: any) => !a.acknowledged).length} color="text-red-400" />
        <WidgetList items={alerts.slice(0, exp ? 6 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <AlertCircle className={`w-3 h-3 flex-shrink-0 ${a.severity === "Critical" ? "text-red-400" : "text-yellow-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{a.message || `Alert ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{a.source || "N/A"} - {a.time || ""}</p>
            </div>
            <Badge className={`border-0 text-xs ${a.severity === "Critical" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{a.severity || "Warning"}</Badge>
          </div>
        )} empty="No active alerts" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// VESSEL BROKER WIDGETS (15)
// ============================================================================

export const VbrkMarketplaceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getOceanMarketplace.useQuery(undefined, { refetchInterval: 120000 });
  const listings = Array.isArray(data) ? data : data?.listings || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Listings" value={listings.length} color="text-cyan-400" />
        <WidgetList items={listings.slice(0, exp ? 6 : 3)} renderItem={(l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Store className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{l.route || `Route ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{l.carrier || "N/A"} - {l.space || 0} TEU</p>
            </div>
            <span className="text-xs font-semibold text-green-400">${(l.rate || 0).toLocaleString()}</span>
          </div>
        )} empty="No marketplace listings" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkBookingsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokeredBookings.useQuery(undefined, { refetchInterval: 60000 });
  const items = Array.isArray(data) ? data : data?.bookings || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Brokered Bookings" value={items.length} color="text-blue-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(b: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{b.reference || `BK-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{b.shipper || "N/A"} &rarr; {b.destination || "N/A"}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{b.status || "Active"}</Badge>
          </div>
        )} empty="No brokered bookings" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkShippingLinesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getShippingLines.useQuery(undefined, { refetchInterval: 300000 });
  const lines = Array.isArray(data) ? data : data?.carriers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Shipping Lines" value={lines.length} color="text-blue-400" />
        <WidgetList items={lines.slice(0, exp ? 6 : 3)} renderItem={(l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{l.name || `Line ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{l.routes || 0} routes</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{l.tier || "Standard"}</Badge>
          </div>
        )} empty="No shipping lines" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerRates.useQuery(undefined, { refetchInterval: 300000 });
  const rates = Array.isArray(data) ? data : data?.rates || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-2">
        <WidgetList items={rates.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.lane || `Lane ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.carrier || "N/A"}</p>
            </div>
            <span className="text-xs font-semibold text-green-400">${(r.rate || 0).toLocaleString()}/TEU</span>
          </div>
        )} empty="No rate data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkLanesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getTradeLanes.useQuery(undefined, { refetchInterval: 300000 });
  const lanes = Array.isArray(data) ? data : data?.lanes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={lanes.slice(0, exp ? 6 : 3)} renderItem={(l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Route className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{l.origin || "N/A"} &rarr; {l.destination || "N/A"}</p>
              <p className="text-xs text-gray-500">{l.transitDays || 0} days - {l.volume || 0} TEU</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">{l.trend || "Stable"}</Badge>
          </div>
        )} empty="No trade lanes" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkCommissionWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerCommission.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalEarned: 0, pending: 0, avgRate: 0, bookingsThisMonth: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.totalEarned || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Commission</p>
        </div>
        <StatRow label="Pending" value={`$${(s.pending || 0).toLocaleString()}`} color="text-yellow-400" />
        <StatRow label="Avg Rate" value={`${s.avgRate}%`} color="text-cyan-400" />
        <StatRow label="Bookings This Month" value={s.bookingsThisMonth} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkShippersWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerShippers.useQuery(undefined, { refetchInterval: 300000 });
  const shippers = Array.isArray(data) ? data : data?.shippers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Shipper Accounts" value={shippers.length} color="text-blue-400" />
        <WidgetList items={shippers.slice(0, exp ? 6 : 3)} renderItem={(s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{s.company || `Shipper ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{s.volume || 0} TEU/yr</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{s.status || "Active"}</Badge>
          </div>
        )} empty="No shipper accounts" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkCapacityWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCapacitySearch.useQuery(undefined, { refetchInterval: 120000 });
  const results = Array.isArray(data) ? data : data?.results || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Available Spaces" value={results.length} color="text-green-400" />
        <WidgetList items={results.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Search className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.vessel || `Vessel ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.route || "N/A"} - {r.available || 0} TEU</p>
            </div>
            <span className="text-xs text-green-400">{r.sailing || "TBD"}</span>
          </div>
        )} empty="No capacity available" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkMarketRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getMarketRates.useQuery(undefined, { refetchInterval: 300000 });
  const rates = Array.isArray(data) ? data : data?.rates || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={rates.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <TrendingUp className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.lane || `Lane ${i + 1}`}</p>
              <p className="text-xs text-gray-500">Avg: ${(r.avgRate || 0).toLocaleString()}</p>
            </div>
            <Badge className={`border-0 text-xs ${r.trend === "Up" ? "bg-green-500/20 text-green-400" : r.trend === "Down" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>{r.trend || "Flat"}</Badge>
          </div>
        )} empty="No market rate data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkConfirmationsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBookingConfirmations.useQuery(undefined, { refetchInterval: 120000 });
  const items = Array.isArray(data) ? data : data?.confirmations || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Pending Confirmation" value={items.filter((c: any) => c.status === "Pending").length} color="text-yellow-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.bookingRef || `Conf-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{c.shipper || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${c.status === "Confirmed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.status || "Pending"}</Badge>
          </div>
        )} empty="No confirmations" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkDocsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerDocs.useQuery(undefined, { refetchInterval: 300000 });
  const docs = Array.isArray(data) ? data : data?.documents || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Documents" value={docs.length} color="text-purple-400" />
        <WidgetList items={docs.slice(0, exp ? 6 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{d.name || `Doc ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{d.type || "BOL"} - {d.date || ""}</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">{d.status || "Draft"}</Badge>
          </div>
        )} empty="No documents" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkSettlementsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerSettlements.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalPaid: 0, pending: 0, overdue: 0, thisMonth: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Paid", value: `$${(s.totalPaid / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "Pending", value: `$${(s.pending / 1000).toFixed(0)}K`, color: "bg-yellow-500/10" },
          { label: "Overdue", value: `$${(s.overdue / 1000).toFixed(0)}K`, color: "bg-red-500/10" },
        ]} />
        <StatRow label="This Month" value={`$${(s.thisMonth || 0).toLocaleString()}`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkPerformanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getBrokerPerformance.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { bookings: 0, revenue: 0, avgMargin: 0, onTimeRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Bookings", value: s.bookings, color: "bg-blue-500/10" },
          { label: "Revenue", value: `$${(s.revenue / 1000).toFixed(0)}K`, color: "bg-green-500/10" },
          { label: "On-Time", value: `${s.onTimeRate}%`, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Avg Margin" value={`${s.avgMargin}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkTradeRoutesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getTradeRoutes.useQuery(undefined, { refetchInterval: 300000 });
  const routes = Array.isArray(data) ? data : data?.routes || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Trade Routes" value={routes.length} color="text-teal-400" />
        <WidgetList items={routes.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Map className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.name || `Route ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.ports || 0} ports - {r.transitDays || 0}d</p>
            </div>
            <Badge className="bg-teal-500/20 text-teal-400 border-0 text-xs">{r.frequency || "Weekly"}</Badge>
          </div>
        )} empty="No trade routes" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VbrkNewsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getMaritimeNews.useQuery(undefined, { refetchInterval: 600000 });
  const articles = Array.isArray(data) ? data : data?.articles || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={articles.slice(0, exp ? 5 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{a.title || `Article ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{a.source || "Maritime"} - {a.date || ""}</p>
            </div>
          </div>
        )} empty="No maritime news" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// CUSTOMS BROKER WIDGETS (15)
// ============================================================================

export const CustomsPendingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPendingEntries.useQuery(undefined, { refetchInterval: 60000 });
  const entries = Array.isArray(data) ? data : data?.entries || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Pending Entries" value={entries.length} color="text-yellow-400" />
        <WidgetList items={entries.slice(0, exp ? 6 : 3)} renderItem={(e: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{e.entryNumber || `Entry-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{e.importer || "N/A"} - {e.port || "N/A"}</p>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">{e.type || "Informal"}</Badge>
          </div>
        )} empty="No pending entries" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsProcessingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getProcessingEntries.useQuery(undefined, { refetchInterval: 60000 });
  const s = data || { inProcess: 0, avgProcessTime: 0, fastTrack: 0, standard: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "In Process", value: s.inProcess, color: "bg-blue-500/10" },
          { label: "Fast Track", value: s.fastTrack, color: "bg-green-500/10" },
          { label: "Standard", value: s.standard, color: "bg-gray-500/10" },
        ]} />
        <StatRow label="Avg Process Time" value={`${s.avgProcessTime}h`} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsTariffWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getTariffLookup.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.tariffs || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Search className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{t.htsCode || `HTS-${i + 1}`}</p>
              <p className="text-xs text-gray-500 truncate">{t.description || "N/A"}</p>
            </div>
            <span className="text-xs text-green-400">{t.dutyRate || "0%"}</span>
          </div>
        )} empty="No tariff data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsDutyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getDutyCalculator.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { totalDuty: 0, totalTax: 0, totalFees: 0, entries: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${(s.totalDuty || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Duties</p>
        </div>
        <StatRow label="Taxes" value={`$${(s.totalTax || 0).toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Fees" value={`$${(s.totalFees || 0).toLocaleString()}`} color="text-purple-400" />
        <StatRow label="Entries" value={s.entries} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsCBPHoldsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCBPHolds.useQuery(undefined, { refetchInterval: 60000 });
  const holds = Array.isArray(data) ? data : data?.holds || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Holds" value={holds.length} color="text-red-400" />
        <WidgetList items={holds.slice(0, exp ? 6 : 3)} renderItem={(h: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{h.entryNumber || `Hold-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{h.reason || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${h.type === "Exam" ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"}`}>{h.type || "Hold"}</Badge>
          </div>
        )} empty="No CBP holds" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsDocStatusWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getDocumentStatus.useQuery(undefined, { refetchInterval: 120000 });
  const docs = Array.isArray(data) ? data : data?.documents || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Total Documents" value={docs.length} color="text-purple-400" />
        <WidgetList items={docs.slice(0, exp ? 6 : 3)} renderItem={(d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{d.name || `Doc-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{d.entry || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${d.status === "Complete" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{d.status || "Pending"}</Badge>
          </div>
        )} empty="No entry documents" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsStatementsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getPeriodicStatements.useQuery(undefined, { refetchInterval: 300000 });
  const stmts = Array.isArray(data) ? data : data?.statements || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={stmts.slice(0, exp ? 5 : 3)} renderItem={(s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{s.period || `Statement ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{s.entries || 0} entries</p>
            </div>
            <span className="text-xs font-semibold text-green-400">${(s.amount || 0).toLocaleString()}</span>
          </div>
        )} empty="No periodic statements" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsEntryTypesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getEntryTypes.useQuery(undefined, { refetchInterval: 300000 });
  const types = Array.isArray(data) ? data : data?.types || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={types.slice(0, exp ? 6 : 4)} renderItem={(t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <BarChart3 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-white flex-1 truncate">{t.name || `Type ${i + 1}`}</span>
            <span className="text-xs font-semibold text-indigo-400">{t.count || 0}</span>
          </div>
        )} empty="No entry type data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsTradeAgreementsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getTradeAgreements.useQuery(undefined, { refetchInterval: 300000 });
  const agreements = Array.isArray(data) ? data : data?.agreements || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <WidgetList items={agreements.slice(0, exp ? 6 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Globe className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{a.name || `Agreement ${i + 1}`}</p>
              <p className="text-xs text-gray-500">{a.countries || "N/A"}</p>
            </div>
            <Badge className="bg-teal-500/20 text-teal-400 border-0 text-xs">{a.savings || "0%"} savings</Badge>
          </div>
        )} empty="No trade agreements" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsCargoManifestWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCustomsCargoManifest.useQuery(undefined, { refetchInterval: 120000 });
  const items = Array.isArray(data) ? data : data?.manifests || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Import Manifests" value={items.length} color="text-orange-400" />
        <WidgetList items={items.slice(0, exp ? 6 : 3)} renderItem={(m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Package className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{m.manifestNo || `MF-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{m.vessel || "N/A"} - {m.bills || 0} BOLs</p>
            </div>
            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">{m.status || "Filed"}</Badge>
          </div>
        )} empty="No cargo manifests" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsCarriersWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCustomsCarriers.useQuery(undefined, { refetchInterval: 300000 });
  const carriers = Array.isArray(data) ? data : data?.carriers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Carriers" value={carriers.length} color="text-blue-400" />
        <WidgetList items={carriers.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Ship className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{c.name || `Carrier ${i + 1}`}</p>
              <p className="text-xs text-gray-500">SCAC: {c.scac || "N/A"}</p>
            </div>
            <span className="text-xs text-blue-400">{c.entries || 0} entries</span>
          </div>
        )} empty="No carrier data" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsSuretyWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getSuretyBond.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { bondAmount: 0, suretyCompany: "N/A", expiresAt: "N/A", status: "Active", usedAmount: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">${(s.bondAmount || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Bond Amount</p>
        </div>
        <StatRow label="Surety Company" value={s.suretyCompany} color="text-cyan-400" />
        <StatRow label="Used" value={`$${(s.usedAmount || 0).toLocaleString()}`} color="text-yellow-400" />
        <StatRow label="Expires" value={s.expiresAt} color="text-purple-400" />
        <StatRow label="Status" value={s.status} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsAppealsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getAppealsProtests.useQuery(undefined, { refetchInterval: 300000 });
  const appeals = Array.isArray(data) ? data : data?.appeals || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Appeals" value={appeals.length} color="text-orange-400" />
        <WidgetList items={appeals.slice(0, exp ? 5 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <FileText className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{a.protestNumber || `Protest-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{a.reason || "N/A"} - ${(a.amount || 0).toLocaleString()}</p>
            </div>
            <Badge className={`border-0 text-xs ${a.status === "Approved" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>{a.status || "Filed"}</Badge>
          </div>
        )} empty="No appeals or protests" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsReleasesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCargoReleases.useQuery(undefined, { refetchInterval: 60000 });
  const releases = Array.isArray(data) ? data : data?.releases || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Releases Today" value={releases.length} color="text-green-400" />
        <WidgetList items={releases.slice(0, exp ? 6 : 3)} renderItem={(r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{r.entryNumber || `Release-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{r.importer || "N/A"}</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{r.status || "Released"}</Badge>
          </div>
        )} empty="No cargo releases" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CustomsAuditsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).vesselShipments.getCustomsAudits.useQuery(undefined, { refetchInterval: 300000 });
  const audits = Array.isArray(data) ? data : data?.audits || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <StatRow label="Active Audits" value={audits.length} color="text-red-400" />
        <WidgetList items={audits.slice(0, exp ? 5 : 3)} renderItem={(a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Shield className="w-3 h-3 text-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{a.auditId || `Audit-${i + 1}`}</p>
              <p className="text-xs text-gray-500">{a.type || "Focused"} - {a.period || "N/A"}</p>
            </div>
            <Badge className={`border-0 text-xs ${a.status === "Closed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{a.status || "Open"}</Badge>
          </div>
        )} empty="No audits" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// WIDGET MAP — maps widget IDs to components
// ============================================================================

export const VESSEL_WIDGET_MAP: Record<string, React.FC> = {
  // Vessel Shipper (15)
  vessel_active_shipments: VesselActiveShipmentsWidget,
  vessel_containers: VesselContainersWidget,
  vessel_port_status: VesselPortStatusWidget,
  vessel_bol: VesselBOLWidget,
  vessel_customs: VesselCustomsWidget,
  vessel_incoterms: VesselIncotermsWidget,
  vessel_rates: VesselRatesWidget,
  vessel_bookings: VesselBookingsWidget,
  vessel_consolidation: VesselConsolidationWidget,
  vessel_insurance: VesselInsuranceWidget,
  vessel_origin_ports: VesselOriginPortsWidget,
  vessel_dest_ports: VesselDestPortsWidget,
  vessel_carrier_rels: VesselCarrierRelsWidget,
  vessel_freight_costs: VesselFreightCostsWidget,
  vessel_analytics: VesselAnalyticsWidget,

  // Vessel Operator (15)
  vessel_fleet: VesselFleetWidget,
  vessel_port_schedule: VesselPortScheduleWidget,
  vessel_container_inv: VesselContainerInvWidget,
  vessel_voyage_revenue: VesselVoyageRevenueWidget,
  vessel_bunker_fuel: VesselBunkerFuelWidget,
  vessel_crew: VesselCrewWidget,
  vessel_cargo_manifest: VesselCargoManifestWidget,
  vessel_op_rates: VesselOpRatesWidget,
  vessel_op_shippers: VesselOpShippersWidget,
  vessel_maintenance: VesselMaintenanceWidget,
  vessel_weather_routing: VesselWeatherRoutingWidget,
  vessel_canal: VesselCanalWidget,
  vessel_utilization: VesselUtilizationWidget,
  vessel_op_costs: VesselOpCostsWidget,
  vessel_network_map: VesselNetworkMapWidget,

  // Port Master (15)
  port_yard_inventory: PortYardInventoryWidget,
  port_arrivals: PortArrivalsWidget,
  port_departures: PortDeparturesWidget,
  port_cranes: PortCranesWidget,
  port_berths: PortBerthsWidget,
  port_container_movement: PortContainerMovementWidget,
  port_dwell_time: PortDwellTimeWidget,
  port_deconsolidation: PortDeconsolidationWidget,
  port_consolidation: PortConsolidationWidget,
  port_rail_connections: PortRailConnectionsWidget,
  port_truck_gate: PortTruckGateWidget,
  port_hazmat: PortHazmatWidget,
  port_storage_costs: PortStorageCostsWidget,
  port_customs_checkpoint: PortCustomsCheckpointWidget,
  port_metrics: PortMetricsWidget,

  // Ship Captain (15)
  captain_voyage: CaptainVoyageWidget,
  captain_nav_chart: CaptainNavChartWidget,
  captain_cargo: CaptainCargoWidget,
  captain_crew: CaptainCrewWidget,
  captain_safety_drills: CaptainSafetyDrillsWidget,
  captain_engine: CaptainEngineWidget,
  captain_weather: CaptainWeatherWidget,
  captain_fuel: CaptainFuelWidget,
  captain_port_approach: CaptainPortApproachWidget,
  captain_comms: CaptainCommsWidget,
  captain_maintenance: CaptainMaintenanceWidget,
  captain_voyage_plan: CaptainVoyagePlanWidget,
  captain_speed_course: CaptainSpeedCourseWidget,
  captain_anchor: CaptainAnchorWidget,
  captain_bridge_alerts: CaptainBridgeAlertsWidget,

  // Vessel Broker (15)
  vbrk_marketplace: VbrkMarketplaceWidget,
  vbrk_bookings: VbrkBookingsWidget,
  vbrk_shipping_lines: VbrkShippingLinesWidget,
  vbrk_rates: VbrkRatesWidget,
  vbrk_lanes: VbrkLanesWidget,
  vbrk_commission: VbrkCommissionWidget,
  vbrk_shippers: VbrkShippersWidget,
  vbrk_capacity: VbrkCapacityWidget,
  vbrk_market_rates: VbrkMarketRatesWidget,
  vbrk_confirmations: VbrkConfirmationsWidget,
  vbrk_docs: VbrkDocsWidget,
  vbrk_settlements: VbrkSettlementsWidget,
  vbrk_performance: VbrkPerformanceWidget,
  vbrk_trade_routes: VbrkTradeRoutesWidget,
  vbrk_news: VbrkNewsWidget,

  // Customs Broker (15)
  customs_pending: CustomsPendingWidget,
  customs_processing: CustomsProcessingWidget,
  customs_tariff: CustomsTariffWidget,
  customs_duty: CustomsDutyWidget,
  customs_cbp_holds: CustomsCBPHoldsWidget,
  customs_doc_status: CustomsDocStatusWidget,
  customs_statements: CustomsStatementsWidget,
  customs_entry_types: CustomsEntryTypesWidget,
  customs_trade_agreements: CustomsTradeAgreementsWidget,
  customs_cargo_manifest: CustomsCargoManifestWidget,
  customs_carriers: CustomsCarriersWidget,
  customs_surety: CustomsSuretyWidget,
  customs_appeals: CustomsAppealsWidget,
  customs_releases: CustomsReleasesWidget,
  customs_audits: CustomsAuditsWidget,
};
