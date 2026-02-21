/**
 * EMERGENCY NOTIFICATION PAGE
 * Driver-facing emergency alert and notification center.
 * Displays active weather alerts, road closures, hazmat advisories,
 * company emergency broadcasts, and SOS beacon status.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  AlertTriangle, Bell, Phone, Shield, Radio,
  Cloud, MapPin, Clock, CheckCircle, ChevronRight,
  RefreshCw, Volume2, Eye, XCircle
} from "lucide-react";

type AlertSeverity = "critical" | "warning" | "info";
type AlertFilter = "all" | "critical" | "warning" | "info";

type EmergencyAlert = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  timestamp: string;
  read: boolean;
  location?: string;
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/15", icon: <AlertTriangle className="w-5 h-5" /> },
  warning: { label: "Warning", color: "text-orange-500", bg: "bg-orange-500/15", icon: <AlertTriangle className="w-5 h-5" /> },
  info: { label: "Info", color: "text-blue-500", bg: "bg-blue-500/15", icon: <Bell className="w-5 h-5" /> },
};

export default function EmergencyNotification() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  const alertsQuery = (trpc as any).notifications?.getAlerts?.useQuery?.() ||
    (trpc as any).safety?.getAlerts?.useQuery?.() ||
    { data: [], isLoading: false, refetch: () => {} };

  const weatherQuery = (trpc as any).weather?.getAlerts?.useQuery?.() ||
    { data: [], isLoading: false };

  const rawAlerts: any[] = Array.isArray(alertsQuery.data) ? alertsQuery.data : [];
  const weatherAlerts: any[] = Array.isArray(weatherQuery.data) ? weatherQuery.data : [];

  // Combine and normalize alerts
  const alerts: EmergencyAlert[] = [
    ...rawAlerts.map((a: any) => ({
      id: String(a.id),
      title: a.title || a.subject || "Alert",
      message: a.message || a.body || a.description || "",
      severity: (a.severity || a.priority || "info") as AlertSeverity,
      source: a.source || "System",
      timestamp: a.createdAt || a.timestamp || new Date().toISOString(),
      read: a.read || readAlerts.has(String(a.id)),
      location: a.location,
    })),
    ...weatherAlerts.map((w: any, i: number) => ({
      id: `weather-${i}`,
      title: w.headline || w.event || "Weather Alert",
      message: w.description || w.summary || "",
      severity: (w.severity === "Extreme" || w.severity === "Severe" ? "critical" : w.severity === "Moderate" ? "warning" : "info") as AlertSeverity,
      source: "NWS Weather",
      timestamp: w.effective || w.onset || new Date().toISOString(),
      read: readAlerts.has(`weather-${i}`),
      location: w.areaDesc,
    })),
  ].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const filtered = alerts.filter((a) => filter === "all" || a.severity === filter);
  const unreadCount = alerts.filter((a) => !a.read && !readAlerts.has(a.id)).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  const markRead = (id: string) => {
    setReadAlerts((prev) => { const next = new Set(Array.from(prev)); next.add(id); return next; });
  };

  const markAllRead = () => {
    setReadAlerts(new Set(alerts.map((a) => a.id)));
    toast.success("All alerts marked as read");
  };

  const isLoading = alertsQuery.isLoading;

  const filters: { id: AlertFilter; label: string }[] = [
    { id: "all", label: `All (${alerts.length})` },
    { id: "critical", label: `Critical (${alerts.filter((a) => a.severity === "critical").length})` },
    { id: "warning", label: `Warning (${alerts.filter((a) => a.severity === "warning").length})` },
    { id: "info", label: `Info (${alerts.filter((a) => a.severity === "info").length})` },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Emergency Alerts
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Active alerts, weather advisories, and emergency broadcasts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className={cn("rounded-xl text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={markAllRead}>
              <CheckCircle className="w-3 h-3 mr-1" /> Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => alertsQuery.refetch?.()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Emergency Contacts */}
      {criticalCount > 0 && (
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border-2 animate-pulse",
          isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className={cn("text-sm font-bold", isLight ? "text-red-700" : "text-red-400")}>
                {criticalCount} Critical Alert{criticalCount > 1 ? "s" : ""} Active
              </p>
              <p className={cn("text-xs", isLight ? "text-red-600" : "text-red-400/80")}>
                Immediate attention required
              </p>
            </div>
          </div>
          <a href="tel:911" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
            <Phone className="w-4 h-4" /> 911
          </a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Bell className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(alerts.length), label: "Total Alerts", color: "text-blue-400" },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, bg: "bg-red-500/15", value: String(criticalCount), label: "Critical", color: "text-red-400" },
          { icon: <Eye className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(unreadCount), label: "Unread", color: "text-yellow-400" },
          { icon: <Cloud className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: String(weatherAlerts.length), label: "Weather", color: "text-cyan-400" },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                <div>
                  <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === f.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-green-50" : "bg-green-500/10")}>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className={cn("font-medium text-lg", isLight ? "text-slate-600" : "text-slate-300")}>All Clear</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>No active emergency alerts at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const sev = SEVERITY_CONFIG[alert.severity];
            const isRead = alert.read || readAlerts.has(alert.id);
            return (
              <Card
                key={alert.id}
                className={cn(
                  cc, "overflow-hidden cursor-pointer transition-all",
                  !isRead && alert.severity === "critical" && "ring-1 ring-red-500/30"
                )}
                onClick={() => markRead(alert.id)}
              >
                <CardContent className="p-0">
                  {alert.severity === "critical" && <div className="h-1 bg-red-500" />}
                  <div className="flex items-start gap-4 p-5">
                    <div className={cn("p-2.5 rounded-lg flex-shrink-0 mt-0.5", sev.bg, sev.color)}>
                      {sev.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{alert.title}</p>
                        <Badge className={cn("text-[9px] border", sev.bg, sev.color, "border-current/20")}>{sev.label}</Badge>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className={cn("text-xs leading-relaxed line-clamp-2", isLight ? "text-slate-500" : "text-slate-400")}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn("text-[10px] flex items-center gap-1", isLight ? "text-slate-400" : "text-slate-500")}>
                          <Radio className="w-3 h-3" /> {alert.source}
                        </span>
                        <span className={cn("text-[10px] flex items-center gap-1", isLight ? "text-slate-400" : "text-slate-500")}>
                          <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                        {alert.location && (
                          <span className={cn("text-[10px] flex items-center gap-1", isLight ? "text-slate-400" : "text-slate-500")}>
                            <MapPin className="w-3 h-3" /> {alert.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
