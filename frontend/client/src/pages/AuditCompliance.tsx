/**
 * AUDIT & COMPLIANCE MANAGEMENT
 * Comprehensive audit trail, SOX compliance, regulatory filings,
 * compliance scoring, policy management, ethics hotline, risk register.
 *
 * Dark theme with navy/blue compliance accents.
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Scale,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  BookOpen,
  MessageSquareWarning,
  Target,
  GraduationCap,
  FileSearch,
  Plus,
  ChevronRight,
  RefreshCw,
  Send,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Severity / status badge helpers
// ---------------------------------------------------------------------------

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    critical: "bg-red-600/20 text-red-400 border-red-600/40",
    high: "bg-orange-600/20 text-orange-400 border-orange-600/40",
    medium: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    low: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    informational: "bg-slate-600/20 text-slate-400 border-slate-600/40",
  };
  return map[severity] || map.low;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-red-600/20 text-red-400 border-red-600/40",
    in_progress: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    pending_verification: "bg-purple-600/20 text-purple-400 border-purple-600/40",
    closed: "bg-green-600/20 text-green-400 border-green-600/40",
    overdue: "bg-red-700/30 text-red-300 border-red-700/50",
    scheduled: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    completed: "bg-green-600/20 text-green-400 border-green-600/40",
    submitted: "bg-green-600/20 text-green-400 border-green-600/40",
    pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    accepted: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
    rejected: "bg-red-600/20 text-red-400 border-red-600/40",
    active: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    draft: "bg-slate-600/20 text-slate-400 border-slate-600/40",
    under_review: "bg-purple-600/20 text-purple-400 border-purple-600/40",
    archived: "bg-gray-600/20 text-gray-400 border-gray-600/40",
    investigating: "bg-orange-600/20 text-orange-400 border-orange-600/40",
    resolved: "bg-green-600/20 text-green-400 border-green-600/40",
    dismissed: "bg-gray-600/20 text-gray-400 border-gray-600/40",
    remediated: "bg-green-600/20 text-green-400 border-green-600/40",
  };
  return map[status] || "bg-slate-600/20 text-slate-400 border-slate-600/40";
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-600/20 border-green-600/30";
  if (score >= 60) return "bg-yellow-600/20 border-yellow-600/30";
  return "bg-red-600/20 border-red-600/30";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, accent = "blue", isLight = false }: { label: string; value: string | number; icon: any; accent?: string; isLight?: boolean }) {
  const colors: Record<string, string> = {
    blue: "from-blue-600/20 to-blue-900/10 border-blue-700/30",
    green: "from-green-600/20 to-green-900/10 border-green-700/30",
    yellow: "from-yellow-600/20 to-yellow-900/10 border-yellow-700/30",
    red: "from-red-600/20 to-red-900/10 border-red-700/30",
    purple: "from-purple-600/20 to-purple-900/10 border-purple-700/30",
  };
  const iconColors: Record<string, string> = { blue: "text-blue-400", green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400", purple: "text-purple-400" };

  return (
    <Card className={`bg-gradient-to-br ${colors[accent]} border p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider`}>{label}</p>
          <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} mt-1`}>{value}</p>
        </div>
        <Icon size={24} className={iconColors[accent]} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------

function DashboardTab({ isLight = false }: { isLight?: boolean }) {
  const dashboardQuery = (trpc as any).auditCompliance.getAuditDashboard.useQuery();
  const scorecardQuery = (trpc as any).auditCompliance.getComplianceScorecard.useQuery();

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const d = dashboardQuery.data as any || {};
  const sc = scorecardQuery.data as any || {};

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <Card className={`${scoreBg(sc.overallScore || 0)} border p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-wider">Overall Compliance Score</p>
            <p className={`text-5xl font-bold mt-1 ${scoreColor(sc.overallScore || 0)}`}>{sc.overallScore || 0}%</p>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              {sc.trend === "improving" && <><TrendingUp size={14} className="text-green-400" /> Improving</>}
              {sc.trend === "stable" && <><BarChart3 size={14} className="text-yellow-400" /> Stable</>}
              {sc.trend === "declining" && <><TrendingDown size={14} className="text-red-400" /> Declining</>}
            </p>
          </div>
          <Shield size={48} className={scoreColor(sc.overallScore || 0)} />
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Scheduled Audits" value={d.scheduled || 0} icon={Calendar} accent="blue" />
        <StatCard label="In Progress" value={d.inProgress || 0} icon={Clock} accent="yellow" />
        <StatCard label="Open Findings" value={d.openFindings || 0} icon={AlertTriangle} accent="red" />
        <StatCard label="Open CAPAs" value={d.openCAPAs || 0} icon={ClipboardCheck} accent="purple" />
      </div>

      {/* Category scores */}
      {sc.categories && sc.categories.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-4`}>Compliance by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(sc.categories as any[]).map((cat: any) => (
              <div key={cat.name} className={`rounded-lg border p-3 ${scoreBg(cat.score)}`}>
                <p className="text-xs text-slate-400">{cat.name}</p>
                <p className={`text-xl font-bold ${scoreColor(cat.score)}`}>{cat.score}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent audits & upcoming deadlines */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>Recent Audits</h3>
          {(d.recentAudits || []).length === 0 ? (
            <p className="text-sm text-slate-500">No audits scheduled yet</p>
          ) : (
            <div className="space-y-2">
              {(d.recentAudits as any[]).map((a: any) => (
                <div key={a.id} className={`flex items-center justify-between py-2 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
                  <div>
                    <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{a.title}</p>
                    <p className="text-xs text-slate-500">{a.type} - {new Date(a.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`text-xs ${statusBadge(a.status)}`}>{a.status?.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>Upcoming Deadlines</h3>
          {(d.upcomingDeadlines || []).length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {(d.upcomingDeadlines as any[]).map((dl: any) => (
                <div key={dl.id} className={`flex items-center justify-between py-2 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
                  <div>
                    <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{dl.name}</p>
                    <p className="text-xs text-slate-500">{dl.agency} - Due {new Date(dl.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`text-xs ${statusBadge(dl.status)}`}>{dl.status?.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Findings Tab
// ---------------------------------------------------------------------------

function FindingsTab({ isLight = false }: { isLight?: boolean }) {
  const findingsQuery = (trpc as any).auditCompliance.getAuditFindings.useQuery({});

  if (findingsQuery.isLoading) return <Skeleton className="h-64" />;

  const findings = (findingsQuery.data || []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider`}>Audit Findings ({findings.length})</h3>
      </div>

      {findings.length === 0 ? (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-8 text-center`}>
          <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-slate-400">No audit findings recorded</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {findings.map((f: any) => (
            <Card key={f.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${severityBadge(f.severity)}`}>{f.severity}</Badge>
                    <Badge className={`text-xs ${statusBadge(f.status)}`}>{f.status?.replace("_", " ")}</Badge>
                    {f.category && <span className="text-xs text-slate-500">{f.category}</span>}
                  </div>
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{f.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{f.description}</p>
                  {f.recommendation && (
                    <p className="text-xs text-blue-400 mt-1">Recommendation: {f.recommendation}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500 ml-4 whitespace-nowrap">
                  {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAPA Tab
// ---------------------------------------------------------------------------

function CAPATab({ isLight = false }: { isLight?: boolean }) {
  const capasQuery = (trpc as any).auditCompliance.getCorrectiveActions.useQuery({});

  if (capasQuery.isLoading) return <Skeleton className="h-64" />;

  const capas = (capasQuery.data || []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider`}>Corrective Actions ({capas.length})</h3>
      </div>

      {capas.length === 0 ? (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-8 text-center`}>
          <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-slate-400">No corrective actions required</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {capas.map((c: any) => (
            <Card key={c.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${statusBadge(c.status)}`}>{c.status?.replace("_", " ")}</Badge>
                    <Badge className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/40">{c.actionType}</Badge>
                    <Badge className={`text-xs ${severityBadge(c.priority)}`}>{c.priority}</Badge>
                  </div>
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{c.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`flex-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-full h-2`}>
                      <div
                        className={`h-2 rounded-full ${(c.progress || 0) >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, c.progress || 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{c.progress || 0}%</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500">Due</p>
                  <p className={`text-xs ${c.dueDate && new Date(c.dueDate) < new Date() && c.status !== "closed" ? "text-red-400" : "text-slate-300"}`}>
                    {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regulatory Filings Tab
// ---------------------------------------------------------------------------

function FilingsTab({ isLight = false }: { isLight?: boolean }) {
  const filingsQuery = (trpc as any).auditCompliance.getRegulatoryFilings.useQuery({});
  const deadlinesQuery = (trpc as any).auditCompliance.getFilingDeadlines.useQuery({});
  const markComplete = (trpc as any).auditCompliance.markFilingComplete.useMutation({
    onSuccess: () => { filingsQuery.refetch(); deadlinesQuery.refetch(); },
  });

  if (filingsQuery.isLoading) return <Skeleton className="h-64" />;

  const filings = (filingsQuery.data || []) as any[];
  const deadlines = (deadlinesQuery.data || []) as any[];

  return (
    <div className="space-y-6">
      {/* Upcoming deadlines alerts */}
      {deadlines.length > 0 && (
        <Card className="bg-slate-900/60 border-yellow-700/40 p-5">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={16} /> Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {deadlines.slice(0, 5).map((dl: any) => (
              <div key={dl.id} className={`flex items-center justify-between py-2 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
                <div>
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{dl.name}</p>
                  <p className="text-xs text-slate-500">{dl.agency} - Due {new Date(dl.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${dl.alertLevel === "critical" ? "bg-red-600/20 text-red-400 border-red-600/40" : dl.alertLevel === "warning" ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/40" : "bg-blue-600/20 text-blue-400 border-blue-600/40"}`}>
                    {dl.daysLeft} days
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All filings */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>All Regulatory Filings ({filings.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                <th className="text-left py-2 pr-4">Filing</th>
                <th className="text-left py-2 pr-4">Agency</th>
                <th className="text-left py-2 pr-4">Due Date</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-right py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filings.map((f: any) => (
                <tr key={f.id} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-2 pr-4">
                    <p className="text-white">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.description}</p>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/40">{f.agency}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    <Badge className={`text-xs ${statusBadge(f.status)}`}>{f.status?.replace("_", " ")}</Badge>
                  </td>
                  <td className="py-2 text-right">
                    {!["submitted", "accepted"].includes(f.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-green-600/40 text-green-400 hover:bg-green-600/20"
                        onClick={() => markComplete.mutate({ id: f.id })}
                        disabled={markComplete.isPending}
                      >
                        <CheckCircle size={12} className="mr-1" /> Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SOX Compliance Tab
// ---------------------------------------------------------------------------

function SOXTab({ isLight = false }: { isLight?: boolean }) {
  const soxQuery = (trpc as any).auditCompliance.getSoxCompliance.useQuery();

  if (soxQuery.isLoading) return <Skeleton className="h-64" />;

  const sox = soxQuery.data as any || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="SOX Score" value={`${sox.overallScore || 0}%`} icon={Scale} accent="blue" />
        <StatCard label="Total Controls" value={(sox.controls || []).length} icon={Shield} accent="green" />
        <StatCard label="Deficiencies" value={sox.deficiencies || 0} icon={AlertTriangle} accent="red" />
        <StatCard label="Last Assessment" value={sox.lastAssessment ? new Date(sox.lastAssessment).toLocaleDateString() : "N/A"} icon={Calendar} accent="purple" />
      </div>

      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>Internal Controls</h3>
        <div className="space-y-2">
          {(sox.controls || []).map((ctrl: any) => {
            const effectivenessColor: Record<string, string> = {
              effective: "text-green-400 bg-green-600/20 border-green-600/40",
              needs_improvement: "text-yellow-400 bg-yellow-600/20 border-yellow-600/40",
              ineffective: "text-red-400 bg-red-600/20 border-red-600/40",
            };
            return (
              <div key={ctrl.id} className={`flex items-center justify-between py-3 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-mono">{ctrl.id}</span>
                    <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{ctrl.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{ctrl.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-slate-500">{ctrl.testFrequency}</span>
                  <Badge className={`text-xs ${effectivenessColor[ctrl.effectiveness] || effectivenessColor.effective}`}>
                    {ctrl.effectiveness?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy Management Tab
// ---------------------------------------------------------------------------

function PoliciesTab({ isLight = false }: { isLight?: boolean }) {
  const policiesQuery = (trpc as any).auditCompliance.getPolicyManagement.useQuery({});

  if (policiesQuery.isLoading) return <Skeleton className="h-64" />;

  const policies = (policiesQuery.data || []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider`}>Policy Library ({policies.length})</h3>
      </div>

      {policies.length === 0 ? (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-8 text-center`}>
          <BookOpen size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-slate-400">No policies created yet</p>
          <p className="text-xs text-slate-500 mt-1">Use the API to create company policies</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {policies.map((p: any) => (
            <Card key={p.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${statusBadge(p.status)}`}>{p.status}</Badge>
                    <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/40">{p.category}</Badge>
                  </div>
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{p.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-xs text-slate-500">v{p.version}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : ""}</p>
                </div>
              </div>
              {p.requiresAcknowledgment && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                  <Eye size={12} /> Requires acknowledgment
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ethics Hotline Tab
// ---------------------------------------------------------------------------

function EthicsTab({ isLight = false }: { isLight?: boolean }) {
  const ethicsQuery = (trpc as any).auditCompliance.getEthicsHotline.useQuery({});
  const submitReport = (trpc as any).auditCompliance.submitEthicsReport.useMutation({
    onSuccess: () => { ethicsQuery.refetch(); setShowForm(false); },
  });

  const [showForm, setShowForm] = useState(false);
  const [ethicsForm, setEthicsForm] = useState({
    category: "other" as string,
    description: "",
    isAnonymous: true,
    severity: "medium" as string,
  });

  if (ethicsQuery.isLoading) return <Skeleton className="h-64" />;

  const data = ethicsQuery.data as any || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Reports" value={data.totalReports || 0} icon={MessageSquareWarning} accent="blue" />
        <StatCard label="Open Reports" value={data.openReports || 0} icon={AlertCircle} accent="yellow" />
        <StatCard label="Avg Resolution" value={`${data.avgResolutionDays || 0}d`} icon={Clock} accent="green" />
      </div>

      <Card className="bg-blue-900/20 border-blue-700/30 p-5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-400 mt-0.5" />
          <div>
            <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>Anonymous & Confidential Reporting</p>
            <p className="text-xs text-slate-400 mt-1">
              Reports can be submitted anonymously. All submissions are encrypted and access is restricted to authorized investigators only.
              Retaliation against reporters is strictly prohibited.
            </p>
          </div>
        </div>
      </Card>

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={16} className="mr-2" /> Submit Ethics Report
        </Button>
      ) : (
        <Card className="bg-slate-900/60 border-blue-700/30 p-5">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Submit Ethics Report</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                className={`w-full ${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-slate-800 border border-slate-700 text-white"} rounded px-3 py-2 text-sm`}
                value={ethicsForm.category}
                onChange={e => setEthicsForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="fraud">Fraud</option>
                <option value="harassment">Harassment</option>
                <option value="safety_violation">Safety Violation</option>
                <option value="discrimination">Discrimination</option>
                <option value="conflicts_of_interest">Conflicts of Interest</option>
                <option value="data_privacy">Data Privacy</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white min-h-[100px]"
                placeholder="Describe the concern in detail..."
                value={ethicsForm.description}
                onChange={e => setEthicsForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Severity</label>
              <select
                className={`w-full ${isLight ? "bg-white border border-slate-300 text-slate-900" : "bg-slate-800 border border-slate-700 text-white"} rounded px-3 py-2 text-sm`}
                value={ethicsForm.severity}
                onChange={e => setEthicsForm(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={ethicsForm.isAnonymous}
                onChange={e => setEthicsForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="rounded border-slate-600"
              />
              <label htmlFor="anonymous" className="text-sm text-slate-300">Submit anonymously</label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submitReport.mutate(ethicsForm as any)}
                disabled={ethicsForm.description.length < 10 || submitReport.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send size={14} className="mr-2" /> Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reports list */}
      {(data.reports || []).length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
          <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>Reports</h3>
          <div className="space-y-2">
            {(data.reports as any[]).map((r: any) => (
              <div key={r.id} className={`flex items-center justify-between py-2 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${statusBadge(r.status)}`}>{r.status?.replace("_", " ")}</Badge>
                    <Badge className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/40">{r.category?.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Tracking: {r.trackingId}</p>
                </div>
                <span className="text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Register Tab
// ---------------------------------------------------------------------------

function RiskTab({ isLight = false }: { isLight?: boolean }) {
  const risksQuery = (trpc as any).auditCompliance.getRiskRegister.useQuery({});

  if (risksQuery.isLoading) return <Skeleton className="h-64" />;

  const risks = (risksQuery.data || []) as any[];

  function riskColor(score: number) {
    if (score >= 15) return "text-red-400 bg-red-600/20 border-red-600/40";
    if (score >= 10) return "text-orange-400 bg-orange-600/20 border-orange-600/40";
    if (score >= 5) return "text-yellow-400 bg-yellow-600/20 border-yellow-600/40";
    return "text-green-400 bg-green-600/20 border-green-600/40";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider`}>Enterprise Risk Register ({risks.length})</h3>
      </div>

      {risks.length === 0 ? (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-8 text-center`}>
          <Target size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-slate-400">No risks registered yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {risks.map((r: any) => (
            <Card key={r.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs font-mono ${riskColor(r.score)}`}>Score: {r.score}</Badge>
                    <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/40">{r.category}</Badge>
                  </div>
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{r.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Likelihood: <span className="text-slate-300">{r.likelihood?.replace("_", " ")}</span></span>
                    <span>Impact: <span className="text-slate-300">{r.impact}</span></span>
                    {r.owner && <span>Owner: <span className="text-slate-300">{r.owner}</span></span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Training Tab
// ---------------------------------------------------------------------------

function TrainingTab({ isLight = false }: { isLight?: boolean }) {
  const trainingQuery = (trpc as any).auditCompliance.getComplianceTraining.useQuery();

  if (trainingQuery.isLoading) return <Skeleton className="h-64" />;

  const data = trainingQuery.data as any || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Overall Completion" value={`${data.overallCompletion || 0}%`} icon={GraduationCap} accent="blue" />
        <StatCard label="Total Courses" value={(data.courses || []).length} icon={BookOpen} accent="green" />
        <StatCard label="Overdue" value={data.overdueCount || 0} icon={AlertTriangle} accent="red" />
      </div>

      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50"} p-5`}>
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-3`}>Compliance Training Courses</h3>
        <div className="space-y-3">
          {(data.courses || []).map((course: any) => (
            <div key={course.id} className={`flex items-center justify-between py-2 ${isLight ? "border-b border-slate-200" : "border-b border-slate-800"} last:border-0`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{course.name}</p>
                  {course.required && <Badge className="text-xs bg-red-600/20 text-red-400 border-red-600/40">Required</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex-1 max-w-[200px] ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-full h-2`}>
                    <div
                      className={`h-2 rounded-full ${course.completionRate >= 100 ? "bg-green-500" : course.completionRate >= 70 ? "bg-blue-500" : "bg-yellow-500"}`}
                      style={{ width: `${Math.min(100, course.completionRate || 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{course.completionRate || 0}%</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <Badge className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/40">{course.frequency}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AuditCompliancePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-3`}>
            <Shield size={28} className="text-blue-400" />
            Audit & Compliance
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>
            SOX compliance, audit management, regulatory filings, ethics, and risk register
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-900/80 border border-slate-700/50"} p-1 flex-wrap h-auto`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <BarChart3 size={14} className="mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="findings" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <AlertTriangle size={14} className="mr-1" /> Findings
          </TabsTrigger>
          <TabsTrigger value="capa" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <ClipboardCheck size={14} className="mr-1" /> CAPA
          </TabsTrigger>
          <TabsTrigger value="filings" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <FileText size={14} className="mr-1" /> Filings
          </TabsTrigger>
          <TabsTrigger value="sox" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <Scale size={14} className="mr-1" /> SOX
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <BookOpen size={14} className="mr-1" /> Policies
          </TabsTrigger>
          <TabsTrigger value="ethics" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <MessageSquareWarning size={14} className="mr-1" /> Ethics
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <Target size={14} className="mr-1" /> Risk
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300 text-xs">
            <GraduationCap size={14} className="mr-1" /> Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab isLight={isLight} /></TabsContent>
        <TabsContent value="findings"><FindingsTab isLight={isLight} /></TabsContent>
        <TabsContent value="capa"><CAPATab isLight={isLight} /></TabsContent>
        <TabsContent value="filings"><FilingsTab isLight={isLight} /></TabsContent>
        <TabsContent value="sox"><SOXTab isLight={isLight} /></TabsContent>
        <TabsContent value="policies"><PoliciesTab isLight={isLight} /></TabsContent>
        <TabsContent value="ethics"><EthicsTab isLight={isLight} /></TabsContent>
        <TabsContent value="risk"><RiskTab isLight={isLight} /></TabsContent>
        <TabsContent value="training"><TrainingTab isLight={isLight} /></TabsContent>
      </Tabs>
    </div>
  );
}
