/**
 * TERMINAL OPERATIONS REPORTS
 * Jony Ive design — every element intentional.
 * 100% Dynamic — tRPC backed, timeframe selectable.
 *
 * Shows: trucks processed, loads completed, dwell time, utilization,
 * incidents, dock status grid, performance bars, recent activity log.
 */

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Activity, CheckCircle, Clock, AlertTriangle,
  Truck, Package, Gauge, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalOperations() {
  const [timeframe, setTimeframe] = useState("today");

  const operationsQuery = (trpc as any).terminals.getOperations.useQuery({ timeframe });
  const statsQuery = (trpc as any).terminals.getOperationStats.useQuery({ timeframe });
  const docksQuery = (trpc as any).terminals.getDockStatus.useQuery();

  const stats = statsQuery.data;
  const cell = "rounded-2xl border border-white/[0.04] bg-white/[0.02]";

  const getDockStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-400";
      case "loading": return "bg-[#1473FF]";
      case "unloading": return "bg-purple-400";
      case "idle": return "bg-slate-600";
      case "maintenance": return "bg-red-400";
      default: return "bg-slate-600";
    }
  };

  if (statsQuery.isLoading) return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1200px] mx-auto">
      <Skeleton className="h-10 w-56 rounded-xl" />
      <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      <Skeleton className="h-[300px] w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1200px] mx-auto">

      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Operations Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Terminal performance, dock utilization, and activity log</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03]">
          {["today", "week", "month"].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              timeframe === t ? "bg-[#1473FF]/15 text-[#1473FF]" : "text-slate-500 hover:text-slate-300"
            )}>{t === "today" ? "Today" : t === "week" ? "This Week" : "This Month"}</button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: <Truck className="w-5 h-5 text-[#1473FF]" />, value: stats?.trucksProcessed || 0, label: "Processed", color: "text-[#1473FF]" },
          { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, value: stats?.loadsCompleted || 0, label: "Completed", color: "text-emerald-400" },
          { icon: <Clock className="w-5 h-5 text-amber-400" />, value: `${stats?.avgDwellTime || 0}m`, label: "Avg Dwell", color: "text-amber-400" },
          { icon: <Gauge className="w-5 h-5 text-purple-400" />, value: `${stats?.utilization || 0}%`, label: "Utilization", color: "text-purple-400" },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, value: stats?.incidents || 0, label: "Incidents", color: "text-red-400" },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("p-5 text-center", cell)}>
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">{kpi.icon}</div>
            <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Dock Status + Performance ─── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dock Status */}
        <div className={cn("p-6", cell)}>
          <div className="flex items-center gap-2 mb-5"><Package className="w-4 h-4 text-[#1473FF]" /><span className="text-sm font-medium text-white">Dock Status</span></div>
          {docksQuery.isLoading ? (
            <div className="grid grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : (docksQuery.data as any)?.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {(docksQuery.data as any).map((dock: any) => (
                <div key={dock.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                  <div className={cn("w-2.5 h-2.5 rounded-full mx-auto mb-2", getDockStatusColor(dock.status))} />
                  <p className="text-xs font-semibold text-white">{dock.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{dock.status}</p>
                  {dock.currentLoad && <p className="text-[10px] text-[#1473FF] mt-1 font-mono">#{dock.currentLoad}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">No dock data available</p>
            </div>
          )}
        </div>

        {/* Performance */}
        <div className={cn("p-6", cell)}>
          <div className="flex items-center gap-2 mb-5"><BarChart3 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">Performance</span></div>
          <div className="space-y-4">
            {[
              { label: "On-Time Departures", value: stats?.onTimeDepartures || 0, color: "#34d399" },
              { label: "Dock Efficiency", value: stats?.dockEfficiency || 0, color: "#1473FF" },
              { label: "Labor Utilization", value: stats?.laborUtilization || 0, color: "#a855f7" },
              { label: "Safety Score", value: stats?.safetyScore || 0, color: "#fbbf24" },
            ].map(perf => (
              <div key={perf.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{perf.label}</span>
                  <span className="text-xs font-semibold text-white">{perf.value}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(perf.value, 100)}%`, backgroundColor: perf.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Recent Activity ─── */}
      <div className={cell}>
        <div className="px-6 pt-6 pb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1473FF]" />
          <span className="text-sm font-medium text-white">Recent Activity</span>
        </div>
        {operationsQuery.isLoading ? (
          <div className="px-6 pb-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : !operationsQuery.data || (Array.isArray(operationsQuery.data) && operationsQuery.data.length === 0) ? (
          <div className="text-center py-16 pb-8">
            <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-600">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {(Array.isArray(operationsQuery.data) ? operationsQuery.data : []).map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    activity.type === "arrival" ? "bg-emerald-500/10" : activity.type === "departure" ? "bg-[#1473FF]/10" : "bg-amber-500/10"
                  )}>
                    {activity.type === "arrival" ? <Truck className="w-4 h-4 text-emerald-400" /> : activity.type === "departure" ? <Truck className="w-4 h-4 text-[#1473FF]" /> : <Package className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{activity.description}</p>
                    <p className="text-[10px] text-slate-600 truncate">{activity.details}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-4">
                  <p className="text-[11px] text-slate-500">{activity.time}</p>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md",
                    activity.type === "arrival" ? "text-emerald-400 bg-emerald-400/10" : activity.type === "departure" ? "text-[#1473FF] bg-[#1473FF]/10" : "text-amber-400 bg-amber-400/10"
                  )}>{activity.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
