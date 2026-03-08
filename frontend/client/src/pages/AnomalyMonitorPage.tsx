/**
 * ESANG AI ANOMALY MONITORING PAGE (GAP-367)
 * AI-powered anomaly detection dashboard with real-time alerts and risk forecasting.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Brain, AlertTriangle, CheckCircle, XCircle, TrendingUp,
  TrendingDown, Truck, DollarSign, Shield, Activity,
  BarChart3, Target, Eye, Clock, Zap, ChevronRight,
  Wallet, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "anomalies" | "risks";
type CategoryFilter = "all" | "delivery" | "pricing" | "safety" | "compliance" | "operational" | "financial";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  low: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  delivery: <Truck className="w-4 h-4" />, pricing: <DollarSign className="w-4 h-4" />,
  safety: <Shield className="w-4 h-4" />, compliance: <CheckCircle className="w-4 h-4" />,
  operational: <Package className="w-4 h-4" />, financial: <Wallet className="w-4 h-4" />,
};

const CAT_COLORS: Record<string, string> = {
  delivery: "text-blue-400", pricing: "text-amber-400", safety: "text-red-400",
  compliance: "text-cyan-400", operational: "text-purple-400", financial: "text-emerald-400",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  worsening: <TrendingUp className="w-3 h-3 text-red-400" />,
  stable: <Target className="w-3 h-3 text-slate-400" />,
  improving: <TrendingDown className="w-3 h-3 text-emerald-400" />,
};

export default function AnomalyMonitorPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dashQuery = (trpc as any).anomalyMonitor?.getDashboard?.useQuery?.() || { data: null, isLoading: false };
  const dash = dashQuery.data;

  const filteredAnomalies = dash?.anomalies?.filter(
    (a: any) => catFilter === "all" || a.category === catFilter
  ) || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Anomaly Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">ESANG AI-powered anomaly detection across all operations</p>
        </div>
        {dash && (
          <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2", dash.healthScore >= 80 ? "bg-emerald-500/10" : dash.healthScore >= 60 ? "bg-amber-500/10" : "bg-red-500/10")}>
            <Brain className={cn("w-5 h-5", dash.healthScore >= 80 ? "text-emerald-400" : dash.healthScore >= 60 ? "text-amber-400" : "text-red-400")} />
            <div>
              <p className={cn("text-lg font-bold font-mono", dash.healthScore >= 80 ? "text-emerald-400" : dash.healthScore >= 60 ? "text-amber-400" : "text-red-400")}>{dash.healthScore}%</p>
              <p className="text-[7px] text-slate-500">Health Score</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "overview" as Tab, icon: <BarChart3 className="w-3.5 h-3.5 mr-1" />, label: "Overview", color: "bg-orange-600" },
          { id: "anomalies" as Tab, icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />, label: "Anomalies", color: "bg-red-600" },
          { id: "risks" as Tab, icon: <Eye className="w-3.5 h-3.5 mr-1" />, label: "Risk Forecast", color: "bg-purple-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-[11px]", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {dashQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Overview Tab ── */}
      {tab === "overview" && dash && (
        <div className="space-y-4">
          {/* Severity KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Critical", count: dash.bySeverity.critical, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "High", count: dash.bySeverity.high, color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Medium", count: dash.bySeverity.medium, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Low", count: dash.bySeverity.low, color: "text-slate-400", bg: "bg-slate-500/10" },
              { label: "Total Active", count: dash.totalActive, color: "text-white", bg: "bg-slate-700/50" },
            ].map(k => (
              <Card key={k.label} className={cn("rounded-xl border-slate-700/50", k.bg)}>
                <CardContent className="p-3 text-center">
                  <p className={cn("text-2xl font-bold font-mono", k.color)}>{k.count}</p>
                  <p className="text-[8px] text-slate-500">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* By Category */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Anomalies by Category</CardTitle></CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {(["delivery", "pricing", "safety", "compliance", "operational", "financial"] as const).map(cat => (
                  <div key={cat} className="p-2 rounded-lg bg-slate-900/30 text-center cursor-pointer hover:bg-slate-900/50 transition-colors" onClick={() => { setTab("anomalies"); setCatFilter(cat); }}>
                    <div className={cn("w-6 h-6 mx-auto mb-1 flex items-center justify-center", CAT_COLORS[cat])}>
                      {CAT_ICONS[cat]}
                    </div>
                    <p className="text-lg font-bold font-mono text-white">{dash.byCategory[cat] || 0}</p>
                    <p className="text-[7px] text-slate-500 capitalize">{cat}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Trend */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400" />7-Day Anomaly Trend</CardTitle></CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-end gap-1 h-16">
                {dash.trendsLast7d.map((t: any, i: number) => {
                  const maxCount = Math.max(...dash.trendsLast7d.map((x: any) => x.count), 1);
                  const h = (t.count / maxCount) * 100;
                  const color = t.avgSeverity > 3.5 ? "bg-red-500" : t.avgSeverity > 2.5 ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-slate-400 font-mono">{t.count}</span>
                      <div className={cn("w-full rounded-t-sm transition-all", color)} style={{ height: `${h}%` }} />
                      <span className="text-[7px] text-slate-500">{t.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Anomalies Preview */}
          <div className="space-y-1.5">
            {dash.anomalies.slice(0, 3).map((a: any) => {
              const sev = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low;
              return (
                <Card key={a.id} className={cn("rounded-xl border cursor-pointer", sev.bg, sev.border)} onClick={() => { setTab("anomalies"); setExpandedId(a.id); }}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", sev.bg, CAT_COLORS[a.category])}>
                        {CAT_ICONS[a.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-white truncate">{a.title}</span>
                          <Badge variant="outline" className={cn("text-[7px]", sev.color)}>{a.severity}</Badge>
                        </div>
                        <p className="text-[9px] text-slate-500 truncate">{a.description}</p>
                      </div>
                      <div className="flex items-center gap-1">{TREND_ICONS[a.trend]}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Anomalies Tab ── */}
      {tab === "anomalies" && dash && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-1 flex-wrap">
            {(["all", "delivery", "pricing", "safety", "compliance", "operational", "financial"] as const).map(cat => (
              <Button key={cat} size="sm" variant={catFilter === cat ? "default" : "ghost"} className={cn("text-[10px] rounded-md", catFilter === cat ? "bg-slate-700" : "text-slate-400")} onClick={() => setCatFilter(cat)}>
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                {cat !== "all" && <span className="ml-1 text-[8px] opacity-60">({dash.byCategory[cat] || 0})</span>}
              </Button>
            ))}
          </div>

          {/* Anomaly Cards */}
          {filteredAnomalies.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Anomalies</p>
                <p className="text-[10px] text-slate-500">All clear in this category</p>
              </CardContent>
            </Card>
          )}
          {filteredAnomalies.map((a: any) => {
            const sev = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low;
            const isExpanded = expandedId === a.id;
            return (
              <Card key={a.id} className={cn("rounded-xl border transition-all cursor-pointer", sev.border, isExpanded ? sev.bg : "bg-slate-800/50")} onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", sev.bg, CAT_COLORS[a.category])}>
                      {CAT_ICONS[a.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-white">{a.title}</span>
                        <Badge variant="outline" className={cn("text-[7px]", sev.color)}>{a.severity}</Badge>
                        <Badge variant="outline" className="text-[7px] text-slate-400">{a.status}</Badge>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{a.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end mb-0.5">
                        {TREND_ICONS[a.trend]}
                        <span className="text-[8px] text-slate-500">{a.trend}</span>
                      </div>
                      <p className="text-[9px] text-slate-500">AI: {a.aiConfidence}%</p>
                      <ChevronRight className={cn("w-3 h-3 text-slate-500 transition-transform ml-auto", isExpanded && "rotate-90")} />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-slate-700/30 pt-3" onClick={e => e.stopPropagation()}>
                      {/* Metric Deviation */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                          <p className="text-[8px] text-slate-500">Expected</p>
                          <p className="text-[11px] font-mono font-bold text-white">{a.expected}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                          <p className="text-[8px] text-slate-500">Actual</p>
                          <p className={cn("text-[11px] font-mono font-bold", a.deviationPct > 0 ? "text-red-400" : "text-emerald-400")}>{a.actual}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/30 text-center">
                          <p className="text-[8px] text-slate-500">Deviation</p>
                          <p className={cn("text-[11px] font-mono font-bold", a.deviationPct > 0 ? "text-red-400" : "text-emerald-400")}>
                            {a.deviationPct > 0 ? "+" : ""}{a.deviationPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Affected Entities */}
                      {a.affectedEntities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {a.affectedEntities.map((e: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-[8px] text-slate-300">{e.name}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Suggested Actions */}
                      <div className="p-2 rounded-lg bg-slate-900/30">
                        <p className="text-[8px] text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />Suggested Actions</p>
                        {a.suggestedActions.map((action: string, i: number) => (
                          <p key={i} className="text-[9px] text-slate-300 py-0.5">• {action}</p>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-[8px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        Detected: {new Date(a.detectedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Risk Forecast Tab ── */}
      {tab === "risks" && dash && (
        <div className="space-y-3">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-2"><Eye className="w-4 h-4 text-purple-400" />Predicted Risks</CardTitle></CardHeader>
            <CardContent className="pb-3">
              <p className="text-[10px] text-slate-400 mb-3">AI-forecasted risks based on current anomaly patterns and historical data</p>
              <div className="space-y-2">
                {dash.topRisks.map((risk: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center", CAT_COLORS[risk.category])}>
                          {CAT_ICONS[risk.category]}
                        </div>
                        <Badge variant="outline" className="text-[7px] text-slate-400 capitalize">{risk.category}</Badge>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold font-mono", risk.probability > 60 ? "text-red-400" : risk.probability > 40 ? "text-amber-400" : "text-slate-400")}>{risk.probability}%</p>
                        <p className="text-[7px] text-slate-500">probability</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white">{risk.risk}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", risk.probability > 60 ? "bg-red-500" : risk.probability > 40 ? "bg-amber-500" : "bg-slate-500")} style={{ width: `${risk.probability}%` }} />
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
