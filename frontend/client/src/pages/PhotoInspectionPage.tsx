/**
 * PHOTO-BASED PRE-TRIP INSPECTION AI PAGE (GAP-164)
 * AI-powered vehicle inspection with photo analysis, defect detection, and reports.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Camera, CheckCircle, XCircle, AlertTriangle, Shield,
  Truck, Eye, Clock, BarChart3, Zap, ChevronRight,
  CircleDot, Gauge, History, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "inspect" | "report" | "history";

const CONDITION_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PASS: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-4 h-4" /> },
  MARGINAL: { color: "text-amber-400", bg: "bg-amber-500/10", icon: <AlertTriangle className="w-4 h-4" /> },
  FAIL: { color: "text-red-400", bg: "bg-red-500/10", icon: <XCircle className="w-4 h-4" /> },
};

const RESULT_CONFIG: Record<string, { color: string; label: string }> = {
  pass: { color: "text-emerald-400", label: "PASS" },
  marginal: { color: "text-amber-400", label: "MARGINAL" },
  fail: { color: "text-red-400", label: "FAIL" },
  oos: { color: "text-red-500", label: "OUT OF SERVICE" },
};

const SEVERITY_COLORS: Record<string, string> = {
  none: "text-emerald-400", minor: "text-amber-400", major: "text-orange-400", critical_oos: "text-red-500",
};

export default function PhotoInspectionPage() {
  const [tab, setTab] = useState<Tab>("inspect");
  const [report, setReport] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pointsQuery = (trpc as any).photoInspection?.getInspectionPoints?.useQuery?.() || { data: null, isLoading: false };
  const historyQuery = (trpc as any).photoInspection?.getHistory?.useQuery?.({}) || { data: null };
  const runInspection = (trpc as any).photoInspection?.runFullInspection?.useMutation?.({
    onSuccess: (data: any) => { setReport(data); setTab("report"); setAnalyzing(false); },
    onError: () => setAnalyzing(false),
  }) || { mutate: () => {} };

  const points = pointsQuery.data || [];
  const history = historyQuery.data || [];

  const categories = points.reduce((acc: Record<string, any[]>, p: any) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  const handleRunInspection = () => {
    setAnalyzing(true);
    runInspection.mutate({ vehicleId: "VEH-001", type: "pre_trip" });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            AI Photo Inspection
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered pre-trip vehicle inspection with photo analysis</p>
        </div>
        <Button onClick={handleRunInspection} disabled={analyzing} className="bg-cyan-600 hover:bg-cyan-700">
          {analyzing ? <><Zap className="w-4 h-4 mr-1.5 animate-pulse" />Analyzing...</> : <><Camera className="w-4 h-4 mr-1.5" />Run AI Inspection</>}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "inspect" as Tab, icon: <Camera className="w-3.5 h-3.5 mr-1" />, label: "Inspection Points", color: "bg-cyan-600" },
          { id: "report" as Tab, icon: <FileCheck className="w-3.5 h-3.5 mr-1" />, label: "Report", color: "bg-emerald-600" },
          { id: "history" as Tab, icon: <History className="w-3.5 h-3.5 mr-1" />, label: "History", color: "bg-purple-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-[11px]", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {pointsQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Inspection Points Tab ── */}
      {tab === "inspect" && (
        <div className="space-y-4">
          {(Object.entries(categories) as [string, any[]][]).map(([cat, items]) => (
            <Card key={cat} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-cyan-400" />{cat}
                  <Badge variant="outline" className="text-[7px] text-slate-400">{items.length} points</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  {items.map((point: any) => (
                    <div key={point.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/20 hover:bg-slate-900/30 transition-colors">
                      <Camera className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white">{point.name}</p>
                        <p className="text-[9px] text-slate-500">{point.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[8px]">
                        <Badge variant="outline" className="text-[7px] text-blue-400 border-blue-500/30">{point.regulation}</Badge>
                        <span className="text-slate-500">{point.requiredPhotos} photo</span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Report Tab ── */}
      {tab === "report" && report && (
        <div className="space-y-4">
          {/* Overall Summary */}
          <Card className={cn("rounded-xl border", report.overallResult === "pass" ? "border-emerald-500/30 bg-emerald-500/5" : report.overallResult === "oos" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-6 h-6", RESULT_CONFIG[report.overallResult]?.color)} />
                  <div>
                    <p className={cn("text-lg font-bold", RESULT_CONFIG[report.overallResult]?.color)}>
                      {RESULT_CONFIG[report.overallResult]?.label}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {report.safeToOperate ? "Vehicle safe to operate" : "Vehicle NOT safe to operate — do not dispatch"}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-white">{report.complianceScore}</p>
                  <p className="text-[8px] text-slate-500">Compliance Score</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Points", value: report.pointsTotal, color: "text-white" },
                  { label: "Passed", value: report.pointsPassed, color: "text-emerald-400" },
                  { label: "Failed", value: report.pointsFailed, color: "text-red-400" },
                  { label: "Defects", value: report.totalDefects, color: "text-amber-400" },
                  { label: "Critical", value: report.criticalDefects, color: "text-red-500" },
                ].map(kpi => (
                  <div key={kpi.label} className="p-2 rounded-lg bg-slate-900/30 text-center">
                    <p className={cn("text-lg font-bold font-mono", kpi.color)}>{kpi.value}</p>
                    <p className="text-[8px] text-slate-500">{kpi.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Individual Results */}
          <div className="space-y-1.5">
            {report.results.map((result: any) => {
              const cfg = CONDITION_CONFIG[result.condition] || CONDITION_CONFIG.FAIL;
              return (
                <Card key={result.pointId} className={cn("rounded-xl border", result.condition === "PASS" ? "bg-slate-800/50 border-slate-700/50" : result.condition === "MARGINAL" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5")}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg, cfg.color)}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-white">{result.pointName}</span>
                          <Badge variant="outline" className={cn("text-[7px]", cfg.color)}>{result.condition}</Badge>
                          <span className="text-[8px] text-slate-500">{result.category}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{result.aiNotes}</p>
                        {result.defects.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {result.defects.map((d: any, di: number) => (
                              <div key={di} className="flex items-center gap-2 text-[9px]">
                                <AlertTriangle className={cn("w-3 h-3", SEVERITY_COLORS[d.severity])} />
                                <span className="text-white">{d.description}</span>
                                <Badge variant="outline" className={cn("text-[6px]", SEVERITY_COLORS[d.severity])}>{d.severity.replace("_", " ")}</Badge>
                                <span className="text-slate-500">{d.regulationRef}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500">Confidence</p>
                        <p className="text-[11px] font-bold font-mono text-white">{Math.round(result.confidence * 100)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "report" && !report && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Camera className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-white font-semibold">No Report Yet</p>
            <p className="text-[10px] text-slate-500 mt-1">Click "Run AI Inspection" to analyze vehicle photos</p>
          </CardContent>
        </Card>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <History className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">No Inspection History</p>
              </CardContent>
            </Card>
          )}
          {history.map((h: any) => {
            const rc = RESULT_CONFIG[h.overallResult] || RESULT_CONFIG.fail;
            return (
              <Card key={h.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-white">{h.vehicleId}</span>
                          <Badge variant="outline" className="text-[7px] text-slate-400">{h.type.replace("_", " ")}</Badge>
                          <Badge variant="outline" className={cn("text-[7px]", rc.color)}>{rc.label}</Badge>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {h.completedAt ? new Date(h.completedAt).toLocaleString() : "—"} • {h.totalDefects} defects • Score: {h.complianceScore}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.safeToOperate
                        ? <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-0.5" />Safe</Badge>
                        : <Badge className="text-[8px] bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-0.5" />Unsafe</Badge>
                      }
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
