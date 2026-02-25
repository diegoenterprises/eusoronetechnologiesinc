/**
 * DRIVER HOURS OF SERVICE PAGE
 * Dedicated HOS compliance screen — Jony Ive design, theme-aware
 * Shows driving/on-duty/cycle clocks, violations, today's log, break info
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Clock, AlertTriangle, CheckCircle, Shield, Activity,
  Coffee, Timer, TrendingDown, Gauge, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; lightBg: string }> = {
  driving:  { label: "Driving",  color: "text-emerald-500", bg: "bg-emerald-500",  lightBg: "bg-emerald-100" },
  on_duty:  { label: "On Duty",  color: "text-blue-500",    bg: "bg-blue-500",     lightBg: "bg-blue-100" },
  off_duty: { label: "Off Duty", color: "text-slate-400",   bg: "bg-slate-400",    lightBg: "bg-slate-200" },
  sleeper:  { label: "Sleeper",  color: "text-purple-500",  bg: "bg-purple-500",   lightBg: "bg-purple-100" },
};

function parseHours(str: string | undefined): number {
  if (!str) return 0;
  const m = str.match(/(\d+)h\s*(\d+)m/);
  return m ? parseInt(m[1]) + parseInt(m[2]) / 60 : 0;
}

export default function DriverHOS() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const dashQuery = (trpc as any).drivers.getDriverDashboard.useQuery(undefined, { refetchInterval: 30000, staleTime: 15000 });
  const hos = dashQuery.data?.hos;
  const isLoading = dashQuery.isLoading;

  const status = STATUS_MAP[hos?.status || "off_duty"] || STATUS_MAP.off_duty;

  // Card + text helpers
  const card = cn("rounded-2xl border backdrop-blur-sm", isLight ? "bg-white/80 border-slate-200/60 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const subcard = cn("rounded-xl p-4", isLight ? "bg-slate-50/80 border border-slate-100" : "bg-white/[0.03] border border-white/[0.04]");
  const heading = cn("font-semibold", isLight ? "text-slate-900" : "text-white");
  const muted = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const label = cn("text-[11px] font-medium tracking-wide uppercase", isLight ? "text-slate-400" : "text-slate-500");

  // Driving progress
  const drivingUsed = 11 - parseHours(hos?.drivingRemaining);
  const onDutyUsed = 14 - parseHours(hos?.onDutyRemaining);
  const cycleUsed = 70 - parseHours(hos?.cycleRemaining);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hours of Service
          </h1>
          <p className={muted}>FMCSA HOS compliance & clocks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border", isLight ? "bg-white border-slate-200" : "bg-white/[0.04] border-white/[0.06]")}>
            <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", status.bg)} />
            <span className={cn("text-sm font-semibold", status.color)}>{status.label}</span>
          </div>
          {hos?.canDrive ? (
            <Badge className={cn("border-0 text-xs font-bold px-3 py-1", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" />Can Drive
            </Badge>
          ) : (
            <Badge className={cn("border-0 text-xs font-bold px-3 py-1", isLight ? "bg-red-100 text-red-700" : "bg-red-500/15 text-red-400")}>
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />Cannot Drive
            </Badge>
          )}
        </div>
      </div>

      {/* Main Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Driving Clock */}
        <div className={cn(card, "p-5 space-y-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
                <Gauge className="w-4.5 h-4.5 text-emerald-500" />
              </div>
              <span className={cn("text-sm font-semibold", heading)}>Driving</span>
            </div>
            <span className={label}>11h limit</span>
          </div>
          <div className="text-center py-2">
            <p className={cn("text-4xl font-bold tracking-tight", hos?.canDrive ? (isLight ? "text-emerald-600" : "text-emerald-400") : "text-red-500")}>
              {hos?.drivingRemaining || "11h 00m"}
            </p>
            <p className={cn("text-xs mt-1", muted)}>remaining</p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={muted}>{drivingUsed.toFixed(1)}h used</span>
              <span className={muted}>11h total</span>
            </div>
            <Progress value={Math.min((drivingUsed / 11) * 100, 100)} className="h-2" />
          </div>
        </div>

        {/* On-Duty Clock */}
        <div className={cn(card, "p-5 space-y-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
                <Timer className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <span className={cn("text-sm font-semibold", heading)}>On-Duty</span>
            </div>
            <span className={label}>14h window</span>
          </div>
          <div className="text-center py-2">
            <p className={cn("text-4xl font-bold tracking-tight", isLight ? "text-blue-600" : "text-blue-400")}>
              {hos?.onDutyRemaining || "14h 00m"}
            </p>
            <p className={cn("text-xs mt-1", muted)}>remaining</p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={muted}>{onDutyUsed.toFixed(1)}h used</span>
              <span className={muted}>14h total</span>
            </div>
            <Progress value={Math.min((onDutyUsed / 14) * 100, 100)} className="h-2" />
          </div>
        </div>

        {/* 70h Cycle */}
        <div className={cn(card, "p-5 space-y-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-purple-50" : "bg-purple-500/10")}>
                <Calendar className="w-4.5 h-4.5 text-purple-500" />
              </div>
              <span className={cn("text-sm font-semibold", heading)}>70h Cycle</span>
            </div>
            <span className={label}>8-day rolling</span>
          </div>
          <div className="text-center py-2">
            <p className={cn("text-4xl font-bold tracking-tight", isLight ? "text-purple-600" : "text-purple-400")}>
              {hos?.cycleRemaining || "70h 00m"}
            </p>
            <p className={cn("text-xs mt-1", muted)}>remaining</p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={muted}>{cycleUsed.toFixed(1)}h used</span>
              <span className={muted}>70h total</span>
            </div>
            <Progress value={Math.min((cycleUsed / 70) * 100, 100)} className="h-2" />
          </div>
        </div>
      </div>

      {/* Break & Compliance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Break Status */}
        <div className={cn(card, "p-5 space-y-4")}>
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-amber-50" : "bg-amber-500/10")}>
              <Coffee className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <span className={cn("text-sm font-semibold", heading)}>Break Status</span>
          </div>
          <div className="space-y-3">
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>30-min break required</span>
                {hos?.breakRequired ? (
                  <Badge className="bg-amber-500/15 text-amber-500 border-0 text-[10px] font-bold">Required</Badge>
                ) : (
                  <Badge className={cn("border-0 text-[10px] font-bold", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>Clear</Badge>
                )}
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Break due in</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.breakDueIn || "—"}</span>
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Last break</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.lastBreak || "—"}</span>
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Next break required</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.nextBreakRequired || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className={cn(card, "p-5 space-y-4")}>
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-cyan-50" : "bg-cyan-500/10")}>
              <Activity className="w-4.5 h-4.5 text-cyan-500" />
            </div>
            <span className={cn("text-sm font-semibold", heading)}>Today's Summary</span>
          </div>
          <div className="space-y-3">
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Driving today</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.drivingToday != null ? `${hos.drivingToday.toFixed(1)}h` : "0h"}</span>
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>On-duty today</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.onDutyToday != null ? `${hos.onDutyToday.toFixed(1)}h` : "0h"}</span>
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Cycle used (8-day)</span>
                <span className={cn("text-sm font-semibold", heading)}>{hos?.cycleUsed != null ? `${hos.cycleUsed.toFixed(1)}h` : "0h"}</span>
              </div>
            </div>
            <div className={subcard}>
              <div className="flex items-center justify-between">
                <span className={muted}>Can accept load</span>
                {hos?.canAcceptLoad ? (
                  <Badge className={cn("border-0 text-[10px] font-bold", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>
                    <CheckCircle className="w-3 h-3 mr-1" />Yes
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 mr-1" />No
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violations */}
      {hos?.violations && hos.violations.length > 0 && (
        <div className={cn(card, "overflow-hidden")}>
          <div className={cn("px-5 py-3 flex items-center gap-2", isLight ? "bg-red-50/60 border-b border-red-100" : "bg-red-500/[0.06] border-b border-red-500/10")}>
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className={cn("text-sm font-semibold text-red-500")}>HOS Violations ({hos.violations.length})</span>
          </div>
          <div className="divide-y" style={{ borderColor: isLight ? "#fef2f2" : "rgba(239,68,68,0.06)" }}>
            {hos.violations.map((v: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLight ? "bg-red-50" : "bg-red-500/10")}>
                    <Shield className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", heading)}>{v.type?.replace(/_/g, " ") || "Violation"}</p>
                    <p className={cn("text-xs", muted)}>{v.description || v.message || "HOS violation detected"}</p>
                  </div>
                </div>
                <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px] font-bold">{v.severity || "Warning"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No violations */}
      {(!hos?.violations || hos.violations.length === 0) && (
        <div className={cn(card, "p-6 text-center")}>
          <div className={cn("w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <p className={cn("font-semibold mb-1", heading)}>No Violations</p>
          <p className={cn("text-sm", muted)}>You're in full HOS compliance. Keep it up!</p>
        </div>
      )}
    </div>
  );
}
