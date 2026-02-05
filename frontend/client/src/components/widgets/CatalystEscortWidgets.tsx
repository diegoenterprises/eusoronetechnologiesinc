import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import {
  Box, MapPin, Shield, MessageSquare, AlertCircle, CheckCircle,
  DollarSign, Navigation, Phone, Clock, FileText
} from "lucide-react";

// ---- CATALYST WIDGETS ----

export const OversizedLoadsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getOversizedLoads.useQuery(undefined, { refetchInterval: 120000 });
  const loads = Array.isArray(data) ? data : data?.loads || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <div className="space-y-2">
        <StatRow label="Active Oversized" value={loads.length} color="text-orange-400" />
        <WidgetList items={loads.slice(0, exp ? 4 : 2)} renderItem={(l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5">
            <Box className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{l.loadNumber || `Load ${i+1}`}</p>
              <p className="text-[10px] text-gray-500">{l.dimensions || "Oversized"}</p>
            </div>
          </div>
        )} empty="No oversized loads" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CoordinationMapWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCoordinationMap.useQuery(undefined, { refetchInterval: 60000 });
  const v = data || { total: 0, escorts: 0, drivers: 0, enRoute: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-cyan-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: v.total, color: "bg-blue-500/10" },
          { label: "Escorts", value: v.escorts, color: "bg-cyan-500/10" },
          { label: "En Route", value: v.enRoute, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Active Drivers" value={v.drivers} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const SafetyProtocolsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyProtocols.useQuery(undefined, { refetchInterval: 600000 });
  const protocols = Array.isArray(data) ? data : data?.protocols || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <WidgetList items={protocols.slice(0, exp ? 6 : 3)} renderItem={(p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Shield className={`w-3 h-3 flex-shrink-0 ${p.status === "complete" ? "text-green-400" : "text-yellow-400"}`} />
          <span className="text-xs text-white flex-1 truncate">{p.name || `Protocol ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${p.status === "complete" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {p.status || "Pending"}
          </Badge>
        </div>
      )} empty="No protocols" />
    )}</ResponsiveWidget>
  );
};

export const CommunicationHubWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCommunicationHub.useQuery(undefined, { refetchInterval: 30000 });
  const channels = Array.isArray(data) ? data : data?.channels || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={channels.slice(0, exp ? 5 : 3)} renderItem={(c: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <MessageSquare className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{c.name || `Channel ${i+1}`}</span>
          {(c.unread || 0) > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px]">{c.unread}</span>
          )}
        </div>
      )} empty="No channels" />
    )}</ResponsiveWidget>
  );
};

export const IncidentReportsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getIncidentReports.useQuery(undefined, { refetchInterval: 300000 });
  const incidents = Array.isArray(data) ? data : data?.incidents || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : incidents.length === 0 ? (
      <div className="text-center p-3 rounded-lg bg-green-500/10">
        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-green-400">No incidents</p>
      </div>
    ) : (
      <WidgetList items={incidents.slice(0, exp ? 4 : 2)} renderItem={(inc: any, i: number) => (
        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${inc.severity === "critical" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
          <AlertCircle className={`w-3 h-3 flex-shrink-0 ${inc.severity === "critical" ? "text-red-400" : "text-yellow-400"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{inc.title || `Incident ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{inc.date || ""}</p>
          </div>
        </div>
      )} />
    )}</ResponsiveWidget>
  );
};

export const EquipmentChecklistWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEquipmentChecklist.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.items || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Equipment Check</span>
          <span className="text-green-400">{items.filter((i: any) => i.checked).length}/{items.length}</span>
        </div>
        <WidgetList items={items.slice(0, exp ? 8 : 4)} renderItem={(item: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <CheckCircle className={`w-3 h-3 flex-shrink-0 ${item.checked ? "text-green-400" : "text-gray-600"}`} />
            <span className={`text-xs ${item.checked ? "text-gray-500" : "text-white"}`}>{item.name || `Item ${i+1}`}</span>
          </div>
        )} empty="No checklist items" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RouteRestrictionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRouteRestrictions.useQuery(undefined, { refetchInterval: 300000 });
  const restrictions = Array.isArray(data) ? data : data?.restrictions || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <WidgetList items={restrictions.slice(0, exp ? 5 : 3)} renderItem={(r: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5">
          <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{r.location || `Restriction ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{r.type || "Height"}: {r.limit || "N/A"}</p>
          </div>
        </div>
      )} empty="No restrictions on route" />
    )}</ResponsiveWidget>
  );
};

export const EscortEarningsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEscortEarnings.useQuery(undefined, { refetchInterval: 300000 });
  const e = data || { total: 0, thisWeek: 0, pending: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${e.total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Earnings</p>
        </div>
        <StatRow label="This Week" value={`$${e.thisWeek.toLocaleString()}`} color="text-cyan-400" />
        <StatRow label="Pending" value={`$${e.pending.toLocaleString()}`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- ESCORT WIDGETS ----

export const RouteNavigationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRouteNavigation.useQuery(undefined, { refetchInterval: 30000 });
  const r = data || { nextTurn: "N/A", distance: 0, eta: "N/A", progress: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-cyan-400" /> : (
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-cyan-500/10 text-center">
          <Navigation className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{r.nextTurn}</p>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${r.progress}%` }} />
        </div>
        <StatRow label="ETA" value={r.eta} color="text-cyan-400" />
        <StatRow label="Remaining" value={`${r.distance} mi`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LoadDimensionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLoadDimensions.useQuery(undefined, { refetchInterval: 300000 });
  const d = data || { length: 0, width: 0, height: 0, weight: 0, overhang: "" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Length", value: `${d.length}'`, color: "bg-blue-500/10" },
          { label: "Width", value: `${d.width}'`, color: "bg-cyan-500/10" },
          { label: "Height", value: `${d.height}'`, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Weight" value={`${d.weight.toLocaleString()} lbs`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ClearanceAlertsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getClearanceAlerts.useQuery(undefined, { refetchInterval: 120000 });
  const alerts = Array.isArray(data) ? data : data?.alerts || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : alerts.length === 0 ? (
      <div className="text-center p-3 rounded-lg bg-green-500/10">
        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-green-400">All clearances OK</p>
      </div>
    ) : (
      <WidgetList items={alerts.slice(0, exp ? 4 : 2)} renderItem={(a: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{a.location || `Point ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">Clearance: {a.clearance || "N/A"}</p>
          </div>
        </div>
      )} />
    )}</ResponsiveWidget>
  );
};

export const EscortChecklistWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEscortChecklist.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.items || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Safety Checklist</span>
          <span className="text-green-400">{items.filter((i: any) => i.done).length}/{items.length}</span>
        </div>
        <WidgetList items={items.slice(0, exp ? 8 : 4)} renderItem={(item: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <CheckCircle className={`w-3 h-3 flex-shrink-0 ${item.done ? "text-green-400" : "text-gray-600"}`} />
            <span className={`text-xs ${item.done ? "text-gray-500" : "text-white"}`}>{item.name || `Check ${i+1}`}</span>
          </div>
        )} empty="No checklist items" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DriverCommunicationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDriverCommunication.useQuery(undefined, { refetchInterval: 30000 });
  const c = data || { driverName: "N/A", driverPhone: "", lastMessage: "", connected: false };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
          <div className={`w-3 h-3 rounded-full ${c.connected ? "bg-green-400" : "bg-red-400"}`} />
          <div>
            <p className="text-sm text-white">{c.driverName}</p>
            <p className="text-[10px] text-gray-500">{c.connected ? "Connected" : "Offline"}</p>
          </div>
        </div>
        {c.driverPhone && <StatRow label="Phone" value={c.driverPhone} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const EmergencyContactsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEmergencyContacts.useQuery(undefined, { refetchInterval: 600000 });
  const contacts = Array.isArray(data) ? data : data?.contacts || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <WidgetList items={contacts.slice(0, exp ? 6 : 3)} renderItem={(c: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Phone className="w-3 h-3 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{c.name || `Contact ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{c.role || "Emergency"}</p>
          </div>
          <span className="text-[10px] text-cyan-400">{c.phone || ""}</span>
        </div>
      )} empty="No contacts" />
    )}</ResponsiveWidget>
  );
};

export const TripLogWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTripLog.useQuery(undefined, { refetchInterval: 300000 });
  const entries = Array.isArray(data) ? data : data?.entries || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={entries.slice(0, exp ? 6 : 3)} renderItem={(e: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{e.event || `Event ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{e.time || ""} - {e.location || ""}</p>
          </div>
        </div>
      )} empty="No trip log entries" />
    )}</ResponsiveWidget>
  );
};

export const PermitVerificationWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPermitVerification.useQuery(undefined, { refetchInterval: 600000 });
  const permits = Array.isArray(data) ? data : data?.permits || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={permits.slice(0, exp ? 5 : 3)} renderItem={(p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{p.state || `Permit ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${p.valid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {p.valid ? "Valid" : "Invalid"}
          </Badge>
        </div>
      )} empty="No permits" />
    )}</ResponsiveWidget>
  );
};

export const EscortPayWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEscortPay.useQuery(undefined, { refetchInterval: 300000 });
  const p = data || { thisTrip: 0, thisWeek: 0, hourlyRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">${p.thisTrip.toLocaleString()}</p>
          <p className="text-xs text-gray-400">This Trip</p>
        </div>
        <StatRow label="This Week" value={`$${p.thisWeek.toLocaleString()}`} color="text-cyan-400" />
        <StatRow label="Hourly Rate" value={`$${p.hourlyRate}/hr`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};
