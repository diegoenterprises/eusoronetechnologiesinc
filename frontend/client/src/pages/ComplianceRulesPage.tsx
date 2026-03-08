/**
 * TOP 5 COMPLIANCE RULES AUTOMATION PAGE (GAP-424)
 * Real-time compliance monitoring dashboard with auto-alerts and remediation.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  Activity, FileCheck, Truck, User, Pill, FileText,
  TrendingUp, Calendar, Zap, ChevronRight, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "rules" | "deadlines";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  compliant: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-4 h-4" />, label: "Compliant" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", icon: <AlertTriangle className="w-4 h-4" />, label: "Warning" },
  violation: { color: "text-orange-400", bg: "bg-orange-500/10", icon: <XCircle className="w-4 h-4" />, label: "Violation" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", icon: <XCircle className="w-4 h-4" />, label: "Critical" },
  unknown: { color: "text-slate-400", bg: "bg-slate-500/10", icon: <Clock className="w-4 h-4" />, label: "Unknown" },
};

const RULE_ICONS: Record<string, React.ReactNode> = {
  hos: <Clock className="w-5 h-5" />, dvir: <Truck className="w-5 h-5" />,
  cdl_medical: <User className="w-5 h-5" />, drug_alcohol: <Pill className="w-5 h-5" />,
  insurance_authority: <FileText className="w-5 h-5" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  violation: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  critical: "text-red-500 bg-red-500/10 border-red-500/20",
};

export default function ComplianceRulesPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const dashQuery = (trpc as any).complianceRules?.getDashboard?.useQuery?.() || { data: null, isLoading: false };
  const rulesQuery = (trpc as any).complianceRules?.getRules?.useQuery?.() || { data: null };

  const dash = dashQuery.data;
  const rules = rulesQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Compliance Automation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Top 5 FMCSA rules — real-time monitoring & auto-enforcement</p>
        </div>
        {dash && (
          <div className="flex items-center gap-2">
            <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2", STATUS_CONFIG[dash.overallStatus]?.bg)}>
              {STATUS_CONFIG[dash.overallStatus]?.icon}
              <span className={cn("text-sm font-bold", STATUS_CONFIG[dash.overallStatus]?.color)}>
                {dash.overallScore}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {[
          { id: "dashboard" as Tab, icon: <Shield className="w-3.5 h-3.5 mr-1" />, label: "Dashboard", color: "bg-emerald-600" },
          { id: "rules" as Tab, icon: <FileCheck className="w-3.5 h-3.5 mr-1" />, label: "Rule Details", color: "bg-blue-600" },
          { id: "deadlines" as Tab, icon: <Calendar className="w-3.5 h-3.5 mr-1" />, label: "Deadlines", color: "bg-purple-600" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} className={cn("rounded-md text-[11px]", tab === t.id ? t.color : "text-slate-400")} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {dashQuery.isLoading && <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />}

      {/* ── Dashboard Tab ── */}
      {tab === "dashboard" && dash && (
        <div className="space-y-4">
          {/* Alert Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Critical", count: dash.alertCount.critical, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "Violations", count: dash.alertCount.violation, color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Warnings", count: dash.alertCount.warning, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Audit Ready", count: `${dash.auditReadiness}%`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            ].map(a => (
              <Card key={a.label} className={cn("rounded-xl border-slate-700/50", a.bg)}>
                <CardContent className="p-3 text-center">
                  <p className={cn("text-2xl font-bold font-mono", a.color)}>{a.count}</p>
                  <p className="text-[9px] text-slate-500">{a.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rule Status Cards */}
          <div className="space-y-2">
            {dash.ruleResults.map((result: any) => {
              const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.unknown;
              const isExpanded = expandedRule === result.ruleId;
              return (
                <Card key={result.ruleId} className={cn("rounded-xl border transition-all cursor-pointer", isExpanded ? `${cfg.bg} border-${cfg.color.replace("text-", "")}/30` : "bg-slate-800/50 border-slate-700/50")} onClick={() => setExpandedRule(isExpanded ? null : result.ruleId)}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", cfg.bg, cfg.color)}>
                        {RULE_ICONS[result.ruleId]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-white">{result.ruleName}</span>
                          <Badge variant="outline" className={cn("text-[7px]", cfg.color)}>{cfg.label}</Badge>
                          {result.findings.length > 0 && (
                            <Badge variant="outline" className="text-[7px] text-slate-400">{result.findings.length} findings</Badge>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {result.affectedDrivers > 0 ? `${result.affectedDrivers} drivers affected` : ""}
                          {result.affectedDrivers > 0 && result.affectedVehicles > 0 ? " • " : ""}
                          {result.affectedVehicles > 0 ? `${result.affectedVehicles} vehicles affected` : ""}
                          {result.affectedDrivers === 0 && result.affectedVehicles === 0 ? "No issues detected" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn("text-xl font-bold font-mono", result.score >= 90 ? "text-emerald-400" : result.score >= 70 ? "text-amber-400" : "text-red-400")}>{result.score}</p>
                          <p className="text-[7px] text-slate-500">score</p>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </div>

                    {/* Expanded Findings */}
                    {isExpanded && result.findings.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-slate-700/30 pt-3">
                        {result.findings.map((f: any) => (
                          <div key={f.id} className={cn("p-2.5 rounded-lg border", SEVERITY_COLORS[f.severity])}>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-[10px] text-white font-semibold">{f.description}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">{f.regulation}</p>
                                {f.autoRemediation && (
                                  <div className="mt-1.5 flex items-start gap-1.5 p-1.5 rounded bg-slate-900/30">
                                    <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-amber-300">{f.autoRemediation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {result.recommendations.length > 0 && (
                          <div className="p-2 rounded-lg bg-slate-900/30">
                            <p className="text-[8px] text-slate-500 uppercase tracking-wide mb-1">Recommendations</p>
                            {result.recommendations.map((r: string, i: number) => (
                              <p key={i} className="text-[9px] text-slate-300">• {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 30-Day Trend */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" />30-Day Compliance Trend</CardTitle></CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-end gap-[2px] h-16">
                {dash.trendsLast30d.map((t: any, i: number) => {
                  const h = (t.score / 100) * 100;
                  const color = t.score >= 90 ? "bg-emerald-500" : t.score >= 70 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={i} className={cn("flex-1 rounded-t-sm transition-all", color)} style={{ height: `${h}%`, opacity: 0.4 + (i / 30) * 0.6 }} title={`${t.date}: ${t.score}%`} />
                  );
                })}
              </div>
              <div className="flex justify-between text-[7px] text-slate-500 mt-1">
                <span>30 days ago</span><span>Today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Rule Details Tab ── */}
      {tab === "rules" && (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <Card key={rule.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    {RULE_ICONS[rule.id]}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{rule.name}</p>
                    <Badge variant="outline" className="text-[7px] text-blue-400 border-blue-500/30">{rule.regulation}</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{rule.description}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-[8px] text-slate-500">Max Fine</p>
                    <p className="text-[11px] font-mono font-bold text-red-400">${rule.maxFine.toLocaleString()}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-[8px] text-slate-500">CSA BASIC</p>
                    <p className="text-[9px] font-semibold text-white">{rule.csa_basic}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900/30 text-center">
                    <p className="text-[8px] text-slate-500">Penalty</p>
                    <p className="text-[9px] text-amber-400">{rule.penalty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Deadlines Tab ── */}
      {tab === "deadlines" && dash && (
        <div className="space-y-2">
          {dash.upcomingDeadlines.map((dl: any, i: number) => {
            const urgent = dl.daysLeft <= 7;
            const soon = dl.daysLeft <= 14;
            return (
              <Card key={i} className={cn("rounded-xl border", urgent ? "border-red-500/20 bg-red-500/5" : soon ? "border-amber-500/20 bg-amber-500/5" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className={cn("w-4 h-4", urgent ? "text-red-400" : soon ? "text-amber-400" : "text-slate-400")} />
                      <div>
                        <p className="text-[11px] font-semibold text-white">{dl.description}</p>
                        <p className="text-[9px] text-slate-500">Due: {dl.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold font-mono", urgent ? "text-red-400" : soon ? "text-amber-400" : "text-slate-300")}>{dl.daysLeft}d</p>
                      <Badge variant="outline" className={cn("text-[7px]", dl.priority === "high" ? "text-red-400 border-red-500/30" : dl.priority === "medium" ? "text-amber-400 border-amber-500/30" : "text-slate-400 border-slate-500/30")}>{dl.priority}</Badge>
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
