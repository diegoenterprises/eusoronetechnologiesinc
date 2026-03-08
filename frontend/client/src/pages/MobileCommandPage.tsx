/**
 * DRIVER & ESCORT MOBILE COMMAND CENTER PAGE (Task 21.1)
 * Mobile-optimized dashboard with quick actions, mission tracking, HOS, and earnings.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Smartphone, MapPin, Truck, Coffee, AlertTriangle, Fuel,
  Camera, Clock, DollarSign, FileCheck, Package, ArrowRight,
  CheckCircle, XCircle, Navigation, Gauge, TrendingUp,
  ChevronRight, Activity, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "mission" | "hos" | "docs" | "earnings";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  MapPin: <MapPin className="w-5 h-5" />, Truck: <Truck className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />, AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  Fuel: <Fuel className="w-5 h-5" />, Camera: <Camera className="w-5 h-5" />,
};

const ACTION_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

const HOS_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  driving: { color: "text-emerald-400", label: "Driving" },
  on_duty: { color: "text-blue-400", label: "On Duty" },
  sleeper: { color: "text-purple-400", label: "Sleeper" },
  off_duty: { color: "text-slate-400", label: "Off Duty" },
};

export default function MobileCommandPage() {
  const [tab, setTab] = useState<Tab>("mission");

  const dataQuery = (trpc as any).mobileCommand?.getData?.useQuery?.({}, { refetchInterval: 30000 }) || { data: null, isLoading: false };
  const data = dataQuery.data;

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-emerald-400 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-slate-400 text-[10px] mt-0.5">Mobile-optimized driver operations</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.alerts?.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[7px] text-white font-bold flex items-center justify-center">{data.alerts.length}</span>
            </div>
          )}
          <Smartphone className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* Alerts Banner */}
      {data?.alerts?.map((alert: any) => (
        <div key={alert.id} className={cn("p-2.5 rounded-lg border text-[10px]", alert.severity === "urgent" ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300")}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{alert.message}</span>
          </div>
        </div>
      ))}

      {dataQuery.isLoading && <Skeleton className="h-32 bg-slate-700/30 rounded-xl" />}

      {/* Quick Actions Grid */}
      {data && (
        <div className="grid grid-cols-3 gap-2">
          {data.quickActions.map((action: any) => (
            <button key={action.id} disabled={!action.enabled} className={cn("p-3 rounded-xl border text-center transition-all active:scale-95", action.enabled ? ACTION_COLORS[action.color] : "bg-slate-800/30 text-slate-600 border-slate-700/30 cursor-not-allowed")}>
              <div className="flex justify-center mb-1">{ACTION_ICONS[action.icon]}</div>
              <p className="text-[10px] font-semibold">{action.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {[
          { id: "mission" as Tab, icon: <Navigation className="w-3 h-3 mr-0.5" />, label: "Mission" },
          { id: "hos" as Tab, icon: <Clock className="w-3 h-3 mr-0.5" />, label: "HOS" },
          { id: "docs" as Tab, icon: <FileCheck className="w-3 h-3 mr-0.5" />, label: "Docs" },
          { id: "earnings" as Tab, icon: <DollarSign className="w-3 h-3 mr-0.5" />, label: "Earnings" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("flex-1 rounded-md text-[10px]", tab === t.id ? "bg-blue-600" : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {/* ── Mission Tab ── */}
      {tab === "mission" && data && (
        <div className="space-y-3">
          {data.activeMission ? (
            <>
              {/* Active Load Card */}
              <Card className="bg-blue-500/5 border-blue-500/20 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span className="text-[12px] font-bold font-mono text-white">{data.activeMission.loadId}</span>
                      <Badge variant="outline" className="text-[7px] text-blue-400">{data.activeMission.status.replace(/_/g, " ")}</Badge>
                    </div>
                    {data.activeMission.hazmat && <Badge variant="outline" className="text-[7px] text-red-400 border-red-500/30">HAZMAT</Badge>}
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-center">
                      <MapPin className="w-3 h-3 text-emerald-400 mx-auto" />
                      <p className="text-[8px] text-slate-500">{data.activeMission.origin.city}</p>
                    </div>
                    <div className="flex-1 h-1 bg-slate-700 rounded-full relative">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" style={{ width: `${data.activeMission.progressPct}%` }} />
                      <Truck className="w-3 h-3 text-white absolute top-1/2 -translate-y-1/2" style={{ left: `${data.activeMission.progressPct}%` }} />
                    </div>
                    <div className="text-center">
                      <MapPin className="w-3 h-3 text-blue-400 mx-auto" />
                      <p className="text-[8px] text-slate-500">{data.activeMission.destination.city}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-1 rounded bg-slate-900/30">
                      <p className="text-[10px] font-mono font-bold text-white">{data.activeMission.progressPct}%</p>
                      <p className="text-[6px] text-slate-500">Progress</p>
                    </div>
                    <div className="p-1 rounded bg-slate-900/30">
                      <p className="text-[10px] font-mono font-bold text-white">{data.activeMission.nextStop?.milesRemaining || 0}</p>
                      <p className="text-[6px] text-slate-500">Miles Left</p>
                    </div>
                    <div className="p-1 rounded bg-slate-900/30">
                      <p className="text-[10px] font-mono font-bold text-emerald-400">${data.activeMission.rate.toLocaleString()}</p>
                      <p className="text-[6px] text-slate-500">Rate</p>
                    </div>
                    <div className="p-1 rounded bg-slate-900/30">
                      <p className="text-[10px] font-mono font-bold text-white">{(data.activeMission.weight / 1000).toFixed(0)}K</p>
                      <p className="text-[6px] text-slate-500">Lbs</p>
                    </div>
                  </div>

                  {/* Next Stop */}
                  {data.activeMission.nextStop && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-900/30 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <div className="flex-1">
                        <p className="text-[9px] text-white font-semibold">{data.activeMission.nextStop.name}</p>
                        <p className="text-[8px] text-slate-500">ETA: {new Date(data.activeMission.nextStop.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming */}
              {data.upcoming.length > 0 && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1.5">Upcoming</p>
                  {data.upcoming.map((u: any) => (
                    <Card key={u.loadId} className="bg-slate-800/50 border-slate-700/50 rounded-xl mb-1.5">
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <span className="text-[10px] font-mono text-white">{u.loadId}</span>
                              <p className="text-[8px] text-slate-500">{u.origin.city} → {u.destination.city} • {u.distance} mi</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">${u.rate.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-6 text-center">
                <Truck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Active Mission</p>
                <p className="text-[10px] text-slate-500">Check upcoming assignments or contact dispatch</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── HOS Tab ── */}
      {tab === "hos" && data && (
        <div className="space-y-3">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-white font-semibold">Hours of Service</span>
                <Badge variant="outline" className={cn("text-[8px]", HOS_STATUS_CONFIG[data.hos.status]?.color)}>
                  {HOS_STATUS_CONFIG[data.hos.status]?.label}
                </Badge>
              </div>

              {/* Driving Hours */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-400">Driving Hours Left</span>
                  <span className={cn("text-[12px] font-bold font-mono", data.hos.drivingHoursLeft < 2 ? "text-red-400" : data.hos.drivingHoursLeft < 4 ? "text-amber-400" : "text-emerald-400")}>{data.hos.drivingHoursLeft}h</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", data.hos.drivingHoursLeft < 2 ? "bg-red-500" : data.hos.drivingHoursLeft < 4 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${(data.hos.drivingHoursLeft / 11) * 100}%` }} />
                </div>
              </div>

              {/* On Duty Hours */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-400">On-Duty Hours Left</span>
                  <span className="text-[12px] font-bold font-mono text-blue-400">{data.hos.onDutyHoursLeft}h</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.hos.onDutyHoursLeft / 14) * 100}%` }} />
                </div>
              </div>

              {/* 70hr Cycle */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-400">70-Hour Cycle</span>
                  <span className="text-[10px] font-mono text-white">{data.hos.cycleHoursUsed}h / {data.hos.cycleLimit}h</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", data.hos.cycleHoursUsed > 60 ? "bg-amber-500" : "bg-cyan-500")} style={{ width: `${(data.hos.cycleHoursUsed / data.hos.cycleLimit) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                  <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                  <p className="text-[9px] text-white font-semibold">Next Break</p>
                  <p className="text-[10px] font-mono text-amber-400">{new Date(data.hos.nextBreakDue).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                  <Activity className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-[9px] text-white font-semibold">Violations</p>
                  <p className={cn("text-[10px] font-mono font-bold", data.hos.violations > 0 ? "text-red-400" : "text-emerald-400")}>{data.hos.violations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Docs Tab ── */}
      {tab === "docs" && data && (
        <div className="space-y-3">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-white font-semibold">Document Checklist</span>
                <span className={cn("text-[11px] font-bold font-mono", data.documents.completionPct === 100 ? "text-emerald-400" : data.documents.completionPct >= 70 ? "text-amber-400" : "text-red-400")}>{data.documents.completionPct}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div className={cn("h-full rounded-full transition-all", data.documents.completionPct === 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${data.documents.completionPct}%` }} />
              </div>

              <div className="space-y-1">
                {data.documents.items.map((doc: any) => (
                  <div key={doc.id} className={cn("flex items-center justify-between p-2 rounded-lg", doc.completed ? "bg-emerald-500/5" : "bg-slate-900/30")}>
                    <div className="flex items-center gap-2">
                      {doc.completed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-500" />}
                      <div>
                        <p className={cn("text-[10px]", doc.completed ? "text-slate-400 line-through" : "text-white font-semibold")}>{doc.name}</p>
                        <p className="text-[7px] text-slate-500">{doc.category.replace("_", " ")}{doc.required ? " • Required" : ""}</p>
                      </div>
                    </div>
                    {doc.completed && doc.completedAt && (
                      <span className="text-[7px] text-slate-500">{new Date(doc.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Earnings Tab ── */}
      {tab === "earnings" && data && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Today", value: `$${data.earnings.today.toLocaleString()}`, color: "text-white" },
              { label: "This Week", value: `$${data.earnings.thisWeek.toLocaleString()}`, color: "text-emerald-400" },
              { label: "This Month", value: `$${data.earnings.thisMonth.toLocaleString()}`, color: "text-cyan-400" },
            ].map(k => (
              <Card key={k.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-2.5 text-center">
                  <p className={cn("text-lg font-bold font-mono", k.color)}>{k.value}</p>
                  <p className="text-[7px] text-slate-500">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Loads Today", value: data.earnings.loadsToday, icon: <Package className="w-3.5 h-3.5 text-blue-400" /> },
                  { label: "Loads This Week", value: data.earnings.loadsThisWeek, icon: <Package className="w-3.5 h-3.5 text-purple-400" /> },
                  { label: "Miles Today", value: data.earnings.milesToday.toLocaleString(), icon: <Truck className="w-3.5 h-3.5 text-slate-400" /> },
                  { label: "Miles This Week", value: data.earnings.milesThisWeek.toLocaleString(), icon: <Truck className="w-3.5 h-3.5 text-cyan-400" /> },
                  { label: "Avg RPM", value: `$${data.earnings.rpmAvg}`, icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> },
                  { label: "Pending Settlement", value: `$${data.earnings.pendingSettlement.toLocaleString()}`, icon: <DollarSign className="w-3.5 h-3.5 text-amber-400" /> },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/30">
                    {s.icon}
                    <div>
                      <p className="text-[10px] font-mono font-bold text-white">{s.value}</p>
                      <p className="text-[7px] text-slate-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
