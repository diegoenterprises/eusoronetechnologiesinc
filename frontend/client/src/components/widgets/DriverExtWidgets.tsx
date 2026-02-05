import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertCircle, CheckCircle, MessageSquare, FileText, Gauge, Award } from "lucide-react";

export const NextDeliveryWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getNextDelivery.useQuery(undefined, { refetchInterval: 60000 });
  const d = data || { destination: "N/A", eta: "N/A", distance: 0, loadNumber: "" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-cyan-500/10 text-center">
          <MapPin className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{d.destination}</p>
          <p className="text-[10px] text-gray-400">{d.loadNumber}</p>
        </div>
        <StatRow label="ETA" value={d.eta} color="text-cyan-400" />
        <StatRow label="Distance" value={`${d.distance} mi`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RestAreasWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRestAreas.useQuery(undefined, { refetchInterval: 300000 });
  const areas = Array.isArray(data) ? data : data?.areas || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={areas.slice(0, exp ? 5 : 3)} renderItem={(a: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{a.name || `Rest Area ${i+1}`}</span>
          <span className="text-[10px] text-cyan-400">{a.distance || "?"} mi</span>
        </div>
      )} empty="No rest areas nearby" />
    )}</ResponsiveWidget>
  );
};

export const TripSummaryWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTripSummary.useQuery(undefined, { refetchInterval: 120000 });
  const t = data || { miles: 0, hours: 0, avgSpeed: 0, fuelUsed: 0, stops: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Miles", value: t.miles, color: "bg-blue-500/10" },
          { label: "Hours", value: t.hours, color: "bg-cyan-500/10" },
          { label: "Stops", value: t.stops, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Avg Speed" value={`${t.avgSpeed} mph`} color="text-cyan-400" />
        <StatRow label="Fuel Used" value={`${t.fuelUsed} gal`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const WeatherAlertsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getWeatherAlerts.useQuery(undefined, { refetchInterval: 300000 });
  const alerts = Array.isArray(data) ? data : data?.alerts || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-yellow-400" /> : alerts.length === 0 ? (
      <div className="text-center p-3 rounded-lg bg-green-500/10">
        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-green-400">No weather alerts</p>
      </div>
    ) : (
      <WidgetList items={alerts.slice(0, exp ? 4 : 2)} renderItem={(a: any, i: number) => (
        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${a.severity === "high" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
          <AlertCircle className={`w-3 h-3 flex-shrink-0 ${a.severity === "high" ? "text-red-400" : "text-yellow-400"}`} />
          <span className="text-xs text-white flex-1 truncate">{a.message || `Alert ${i+1}`}</span>
        </div>
      )} />
    )}</ResponsiveWidget>
  );
};

export const TrafficUpdatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTrafficUpdates.useQuery(undefined, { refetchInterval: 120000 });
  const updates = Array.isArray(data) ? data : data?.updates || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <WidgetList items={updates.slice(0, exp ? 4 : 2)} renderItem={(u: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{u.location || `Route ${i+1}`}</p>
            <p className="text-[10px] text-gray-500">{u.description || "Traffic delay"}</p>
          </div>
          <span className="text-[10px] text-orange-400">+{u.delay || 0}min</span>
        </div>
      )} empty="No traffic issues" />
    )}</ResponsiveWidget>
  );
};

export const DeliveryChecklistWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDeliveryChecklist.useQuery(undefined, { refetchInterval: 300000 });
  const items = Array.isArray(data) ? data : data?.items || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Completed</span>
          <span className="text-green-400">{items.filter((i: any) => i.completed).length}/{items.length}</span>
        </div>
        <WidgetList items={items.slice(0, exp ? 8 : 4)} renderItem={(item: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <CheckCircle className={`w-3 h-3 flex-shrink-0 ${item.completed ? "text-green-400" : "text-gray-600"}`} />
            <span className={`text-xs ${item.completed ? "text-gray-500 line-through" : "text-white"}`}>{item.title || `Item ${i+1}`}</span>
          </div>
        )} empty="No checklist items" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DispatcherChatWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDispatcherChat.useQuery(undefined, { refetchInterval: 30000 });
  const messages = Array.isArray(data) ? data : data?.messages || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-white">{messages.length} messages</span>
        </div>
        <WidgetList items={messages.slice(-(exp ? 5 : 3))} renderItem={(m: any, i: number) => (
          <div key={i} className={`p-2 rounded-lg ${m.fromDispatcher ? "bg-blue-500/10 ml-2" : "bg-white/5 mr-2"}`}>
            <p className="text-[10px] text-gray-500">{m.sender || (m.fromDispatcher ? "Dispatch" : "You")}</p>
            <p className="text-xs text-white">{m.text || ""}</p>
          </div>
        )} empty="No messages" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const MileageTrackerWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getMileageTracker.useQuery(undefined, { refetchInterval: 120000 });
  const m = data || { today: 0, thisWeek: 0, thisMonth: 0, fuelEfficiency: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Today", value: m.today, color: "bg-blue-500/10" },
          { label: "Week", value: m.thisWeek, color: "bg-cyan-500/10" },
          { label: "Month", value: m.thisMonth, color: "bg-purple-500/10" },
        ]} />
        <StatRow label="Fuel Efficiency" value={`${m.fuelEfficiency} mpg`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const LoadDocumentsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getLoadDocuments.useQuery(undefined, { refetchInterval: 300000 });
  const docs = Array.isArray(data) ? data : data?.documents || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={docs.slice(0, exp ? 5 : 3)} renderItem={(d: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{d.name || `Doc ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${d.status === "signed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {d.status || "Pending"}
          </Badge>
        </div>
      )} empty="No documents" />
    )}</ResponsiveWidget>
  );
};

export const PerformanceScoreWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPerformanceScore.useQuery(undefined, { refetchInterval: 300000 });
  const s = data || { overall: 0, onTime: 0, safety: 0, customerRating: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-3xl font-bold text-blue-400">{s.overall}</p>
          <p className="text-xs text-gray-400">Overall Score</p>
        </div>
        <StatRow label="On-Time" value={`${s.onTime}%`} color="text-green-400" />
        <StatRow label="Safety" value={`${s.safety}%`} color="text-cyan-400" />
        <StatRow label="Rating" value={`${s.customerRating}/5`} color="text-yellow-400" />
      </div>
    )}</ResponsiveWidget>
  );
};
