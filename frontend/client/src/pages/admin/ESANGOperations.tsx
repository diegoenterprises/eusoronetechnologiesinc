/**
 * ESANG AI OPERATIONS DASHBOARD (Phase 4 — Tasks 2.3.1, 2.3.2, 3.1.1-3.1.3)
 * Decision logging, Model performance, Auto-dispatch, Auto-approve, Compliance reminders
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Brain, Activity, Zap, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Clock, ToggleLeft, ToggleRight,
  RefreshCw, Shield, Bell, Truck, DollarSign, BarChart3
} from "lucide-react";

type AITab = "decisions" | "performance" | "auto_dispatch" | "auto_approve" | "reminders";

export default function ESANGOperations() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [tab, setTab] = useState<AITab>("decisions");

  const decisionsQuery = (trpc as any).esangAI?.decisions?.getRecent?.useQuery?.({ limit: 50 }) || { data: { decisions: [], total: 0 } };
  const metricsQuery = (trpc as any).esangAI?.modelPerformance?.getMetrics?.useQuery?.({}) || { data: null };
  const alertsQuery = (trpc as any).esangAI?.modelPerformance?.getAlerts?.useQuery?.() || { data: [] };
  const disabledQuery = (trpc as any).esangAI?.modelPerformance?.getDisabledTypes?.useQuery?.() || { data: [] };
  const dispatchConfigQuery = (trpc as any).esangAI?.autoDispatch?.getConfig?.useQuery?.() || { data: null };
  const dispatchLogQuery = (trpc as any).esangAI?.autoDispatch?.getLog?.useQuery?.({ limit: 20 }) || { data: [] };
  const thresholdsQuery = (trpc as any).esangAI?.autoApprove?.getThresholds?.useQuery?.() || { data: null };
  const remindersQuery = (trpc as any).esangAI?.complianceReminders?.getUpcoming?.useQuery?.({ daysAhead: 90 }) || { data: { items: [], total: 0 } };
  const reminderMetricsQuery = (trpc as any).esangAI?.complianceReminders?.getMetrics?.useQuery?.() || { data: null };

  const decisions: any[] = decisionsQuery.data?.decisions || [];
  const alerts: any[] = Array.isArray(alertsQuery.data) ? alertsQuery.data : [];
  const disabledTypes: string[] = Array.isArray(disabledQuery.data) ? disabledQuery.data : [];
  const dispatchLog: any[] = Array.isArray(dispatchLogQuery.data) ? dispatchLogQuery.data : [];
  const reminders: any[] = remindersQuery.data?.items || [];

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const tabs: { id: AITab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "decisions", label: "Decision Log", icon: <Brain className="w-4 h-4" />, badge: decisions.length },
    { id: "performance", label: "Model Performance", icon: <BarChart3 className="w-4 h-4" />, badge: alerts.length },
    { id: "auto_dispatch", label: "Auto-Dispatch", icon: <Truck className="w-4 h-4" /> },
    { id: "auto_approve", label: "Auto-Approve", icon: <DollarSign className="w-4 h-4" /> },
    { id: "reminders", label: "Compliance Reminders", icon: <Bell className="w-4 h-4" />, badge: reminders.length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">ESANG AI Operations</h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Decision audit trail, model performance, autonomous operations</p>
        </div>
        {disabledTypes.length > 0 && (
          <Badge className="bg-red-500/15 text-red-500 border-red-500/30 rounded-full px-3 py-1">
            <AlertTriangle className="w-3 h-3 mr-1" />{disabledTypes.length} model(s) disabled
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border", tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-md" : L ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600")}>
            {t.icon}{t.label}
            {t.badge ? <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Decision Log */}
      {tab === "decisions" && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Brain className="w-5 h-5 text-[#1473FF]" />AI Decision Audit Trail ({decisions.length})</CardTitle></CardHeader>
            <CardContent>
              {decisions.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className={cn("w-12 h-12 mx-auto mb-3", L ? "text-slate-300" : "text-slate-600")} />
                  <p className={cn("text-sm", L ? "text-slate-400" : "text-slate-500")}>No AI decisions recorded yet. Decisions will appear here as ESANG processes loads, pricing, and compliance checks.</p>
                </div>
              ) : decisions.map((d: any) => (
                <div key={d.decisionId} className={cn("flex items-center justify-between p-3 rounded-xl border mb-2", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", d.confidence > 0.9 ? "bg-green-500/15 text-green-500" : d.confidence > 0.7 ? "bg-amber-500/15 text-amber-500" : "bg-red-500/15 text-red-500")}>{Math.round(d.confidence * 100)}%</div>
                    <div>
                      <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{d.type?.replace(/_/g, " ")}</p>
                      <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{d.decisionId} · {d.modelVersion}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px]", d.status === "executed" ? "bg-green-500/15 text-green-500" : d.status === "overridden" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-500")}>{d.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Performance */}
      {tab === "performance" && (
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-2", L ? "bg-amber-50 border-amber-300" : "bg-amber-500/10 border-amber-500/30")}>
              <p className={cn("text-xs font-medium uppercase tracking-wider", L ? "text-amber-600" : "text-amber-400")}>Active Alerts</p>
              {alerts.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-4 h-4", a.severity === "critical" ? "text-red-500" : "text-amber-500")} />
                  <span className={cn("text-sm", L ? "text-slate-700" : "text-slate-300")}>{a.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metricsQuery.data && Object.entries(metricsQuery.data).map(([type, m]: [string, any]) => (
              <Card key={type} className={cc}>
                <CardContent className="p-4">
                  <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>{type.replace(/_/g, " ")}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <p className={cn("text-2xl font-bold", m.accuracy >= 90 ? (L ? "text-green-600" : "text-green-400") : m.accuracy >= 80 ? (L ? "text-amber-600" : "text-amber-400") : (L ? "text-red-600" : "text-red-400"))}>{m.accuracy?.toFixed(1)}%</p>
                    <span className={cn("text-xs mb-1", L ? "text-slate-400" : "text-slate-500")}>accuracy</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className={L ? "text-slate-500" : "text-slate-400"}>Override: {m.overrideRate?.toFixed(1)}%</span>
                    <span className={L ? "text-slate-500" : "text-slate-400"}>· {m.totalDecisions} decisions</span>
                  </div>
                  {disabledTypes.includes(type) && <Badge className="mt-2 bg-red-500/15 text-red-500 text-[10px]">DISABLED</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Dispatch */}
      {tab === "auto_dispatch" && (
        <div className="space-y-4">
          {dispatchConfigQuery.data && (
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Zap className="w-5 h-5 text-[#1473FF]" />Auto-Dispatch Configuration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={sc}>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {dispatchConfigQuery.data.enabled ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      <span className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{dispatchConfigQuery.data.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                  <div className={sc}>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>Confidence Threshold</p>
                    <p className={cn("text-lg font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{(dispatchConfigQuery.data.confidenceThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div className={sc}>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>Daily Quota</p>
                    <p className={cn("text-lg font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{(dispatchConfigQuery.data.dailyQuota * 100).toFixed(0)}%</p>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{dispatchConfigQuery.data.dailyUsed}/{dispatchConfigQuery.data.dailyTotal} used</p>
                  </div>
                  <div className={sc}>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>Override Window</p>
                    <p className={cn("text-lg font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{dispatchConfigQuery.data.overrideWindowHours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg", L ? "text-slate-800" : "text-white")}>Recent Auto-Dispatches</CardTitle></CardHeader>
            <CardContent>
              {dispatchLog.length === 0 ? <p className={cn("text-sm text-center py-8", L ? "text-slate-400" : "text-slate-500")}>No auto-dispatches yet</p> : dispatchLog.map((d: any) => (
                <div key={d.decisionId} className={cn("flex items-center justify-between p-3 rounded-xl border mb-2", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div>
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>Load {d.inputs?.loadId} → Driver {d.inputs?.driverId}</p>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{d.timestamp ? new Date(d.timestamp).toLocaleString() : ""} · {d.executionTimeMs}ms</p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-green-500/15 text-green-500")}>{Math.round((d.confidence || 0) * 100)}%</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auto-Approve */}
      {tab === "auto_approve" && thresholdsQuery.data && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><CheckCircle className="w-5 h-5 text-[#1473FF]" />Accessorial Auto-Approve Thresholds</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(thresholdsQuery.data).map(([type, threshold]: [string, any]) => (
                  <div key={type} className={sc}>
                    <p className={cn("text-xs font-medium capitalize", L ? "text-slate-700" : "text-white")}>{type.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full" style={{ width: `${(threshold as number) * 100}%` }} />
                      </div>
                      <span className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{((threshold as number) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Reminders */}
      {tab === "reminders" && (
        <div className="space-y-4">
          {reminderMetricsQuery.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Sent", value: reminderMetricsQuery.data.totalSent, icon: <Bell className="w-4 h-4" /> },
                { label: "Open Rate", value: `${reminderMetricsQuery.data.openRate}%`, icon: <Eye className="w-4 h-4" /> },
                { label: "Click-Through", value: `${reminderMetricsQuery.data.clickThroughRate}%`, icon: <Activity className="w-4 h-4" /> },
                { label: "Renewal Rate", value: `${reminderMetricsQuery.data.renewalRateAfterReminder}%`, icon: <CheckCircle className="w-4 h-4" /> },
              ].map((m, i) => (
                <Card key={i} className={cc}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", "bg-[#1473FF]/10 text-[#1473FF]")}>{m.icon}</div>
                    <div>
                      <p className={cn("text-[10px] uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>{m.label}</p>
                      <p className={cn("text-lg font-bold", L ? "text-slate-800" : "text-white")}>{m.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Bell className="w-5 h-5 text-[#1473FF]" />Upcoming Compliance Expirations ({reminders.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {reminders.map((r: any) => (
                <div key={r.id} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", r.urgency === "critical" ? "bg-red-500/15 text-red-500" : r.urgency === "warning" ? "bg-amber-500/15 text-amber-500" : "bg-green-500/15 text-green-500")}>{r.daysRemaining}d</div>
                    <div>
                      <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{r.item}</p>
                      <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{r.carrier} · Expires {new Date(r.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px]", r.urgency === "critical" ? "bg-red-500/15 text-red-500" : r.urgency === "warning" ? "bg-amber-500/15 text-amber-500" : "bg-green-500/15 text-green-500")}>{r.type?.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
