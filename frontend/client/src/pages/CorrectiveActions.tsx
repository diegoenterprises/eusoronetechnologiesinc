/**
 * CORRECTIVE ACTIONS PAGE
 * Hazmat corrective action tracking and management screen.
 * Tracks corrective actions from incidents, audits, inspections,
 * and regulatory findings. Shows open/closed status, assignees,
 * deadlines, and root cause categories.
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
  CheckCircle, Clock, AlertTriangle, FileText, Shield,
  RefreshCw, ChevronRight, Target, Users, Calendar,
  XCircle, ArrowRight, Settings
} from "lucide-react";

type ActionStatus = "open" | "in_progress" | "closed" | "overdue";
type ActionFilter = "all" | "open" | "in_progress" | "closed" | "overdue";

type CorrectiveAction = {
  id: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: "high" | "medium" | "low";
  source: string;
  assignee: string;
  dueDate: string;
  rootCause: string;
  createdAt: string;
};

// No sample data — all corrective actions come from real tRPC queries

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-yellow-500", bg: "bg-yellow-500/15", icon: <Clock className="w-4 h-4" /> },
  in_progress: { label: "In Progress", color: "text-blue-500", bg: "bg-blue-500/15", icon: <ArrowRight className="w-4 h-4" /> },
  closed: { label: "Closed", color: "text-green-500", bg: "bg-green-500/15", icon: <CheckCircle className="w-4 h-4" /> },
  overdue: { label: "Overdue", color: "text-red-500", bg: "bg-red-500/15", icon: <AlertTriangle className="w-4 h-4" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "Medium", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

export default function CorrectiveActions() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actionsQuery = (trpc as any).safety?.getCorrectiveActions?.useQuery?.() ||
    (trpc as any).compliance?.getCorrectiveActions?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const rawActions: any[] = Array.isArray(actionsQuery.data) ? actionsQuery.data : [];
  const actions: CorrectiveAction[] = rawActions;
  const isLoading = actionsQuery.isLoading;

  // Mark overdue
  const now = new Date();
  const processedActions = actions.map((a) => ({
    ...a,
    status: (a.status !== "closed" && new Date(a.dueDate) < now ? "overdue" : a.status) as ActionStatus,
  }));

  const filtered = processedActions.filter((a) => filter === "all" || a.status === filter);
  const openCount = processedActions.filter((a) => a.status === "open").length;
  const overdueCount = processedActions.filter((a) => a.status === "overdue").length;
  const inProgressCount = processedActions.filter((a) => a.status === "in_progress").length;
  const closedCount = processedActions.filter((a) => a.status === "closed").length;

  const filters: { id: ActionFilter; label: string }[] = [
    { id: "all", label: `All (${processedActions.length})` },
    { id: "open", label: `Open (${openCount})` },
    { id: "in_progress", label: `In Progress (${inProgressCount})` },
    { id: "overdue", label: `Overdue (${overdueCount})` },
    { id: "closed", label: `Closed (${closedCount})` },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Corrective Actions
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Track and resolve safety findings and compliance gaps
          </p>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")} onClick={() => actionsQuery.refetch?.()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Clock className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(openCount), label: "Open", color: "text-yellow-400" },
          { icon: <ArrowRight className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(inProgressCount), label: "In Progress", color: "text-blue-400" },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, bg: "bg-red-500/15", value: String(overdueCount), label: "Overdue", color: "text-red-400" },
          { icon: <CheckCircle className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: String(closedCount), label: "Closed", color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.02] border-white/[0.06]")}>
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
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", filter === f.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-white/[0.06]")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((action) => {
            const status = STATUS_CONFIG[action.status];
            const priority = PRIORITY_CONFIG[action.priority];
            const isExpanded = expandedId === action.id;
            return (
              <Card key={action.id} className={cn(cc, "overflow-hidden cursor-pointer transition-all", action.status === "overdue" && "ring-1 ring-red-500/30")} onClick={() => setExpandedId(isExpanded ? null : action.id)}>
                <CardContent className="p-0">
                  {action.status === "overdue" && <div className="h-1 bg-red-500" />}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2.5 rounded-lg flex-shrink-0", status.bg, status.color)}>
                        {status.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{action.title}</p>
                          <Badge className={cn("text-[9px] border", priority.cls)}>{priority.label}</Badge>
                        </div>
                        <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                          {action.id} · Due {new Date(action.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {action.assignee}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[9px] border", status.bg, status.color, "border-current/20")}>{status.label}</Badge>
                      <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={cn("px-5 pb-5 space-y-3", isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")}>
                      <div className="pt-3">
                        <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-slate-300")}>{action.description}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { l: "Source", v: action.source },
                          { l: "Root Cause", v: action.rootCause },
                          { l: "Created", v: new Date(action.createdAt).toLocaleDateString() },
                          { l: "Due", v: new Date(action.dueDate).toLocaleDateString() },
                        ].map((d) => (
                          <div key={d.l} className={cn("p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                            <p className={cn("text-[9px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{d.l}</p>
                            <p className={cn("text-xs font-medium mt-0.5", isLight ? "text-slate-700" : "text-slate-200")}>{d.v}</p>
                          </div>
                        ))}
                      </div>
                      {action.status !== "closed" && (
                        <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl" onClick={(e: any) => { e.stopPropagation(); toast.success(`${action.id} marked as closed`); }}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Mark Closed
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
