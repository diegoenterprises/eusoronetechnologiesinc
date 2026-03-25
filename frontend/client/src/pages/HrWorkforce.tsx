/**
 * HR WORKFORCE COMMAND CENTER
 *
 * Comprehensive HR management dashboard for trucking/logistics.
 * Tabs: Dashboard, Recruiting, Onboarding, Payroll, Time Tracking,
 *       Performance, Benefits, Compensation, Org Chart, Compliance.
 *
 * 100% Dynamic | Dark theme with violet/purple HR accents | shadcn components
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Briefcase,
  DollarSign,
  Clock,
  Star,
  Heart,
  ShieldCheck,
  Building2,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  Award,
  Target,
  BarChart3,
  Layers,
  ClipboardList,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  Truck,
  CircleDot,
  GraduationCap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  L,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  L: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 border transition-all hover:scale-[1.02]",
        L
          ? "bg-white/80 border-slate-200/80 shadow-sm"
          : "bg-slate-800/50 border-violet-500/20"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn("w-5 h-5", color)} />
        {change !== undefined && change !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-bold",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-xl font-bold",
          L ? "text-slate-800" : "text-white"
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-xs mt-1",
          L ? "text-slate-500" : "text-slate-400"
        )}
      >
        {label}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  L,
}: {
  status: string;
  L: boolean;
}) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    completed: {
      bg: L ? "bg-green-100" : "bg-green-500/20",
      text: "text-green-600",
      label: "Completed",
    },
    in_progress: {
      bg: L ? "bg-blue-100" : "bg-blue-500/20",
      text: "text-blue-500",
      label: "In Progress",
    },
    pending: {
      bg: L ? "bg-yellow-100" : "bg-amber-500/20",
      text: "text-amber-500",
      label: "Pending",
    },
    approved: {
      bg: L ? "bg-green-100" : "bg-green-500/20",
      text: "text-green-600",
      label: "Approved",
    },
    rejected: {
      bg: L ? "bg-red-100" : "bg-red-500/20",
      text: "text-red-500",
      label: "Rejected",
    },
    compliant: {
      bg: L ? "bg-green-100" : "bg-green-500/20",
      text: "text-green-600",
      label: "Compliant",
    },
    attention: {
      bg: L ? "bg-amber-100" : "bg-amber-500/20",
      text: "text-amber-500",
      label: "Needs Attention",
    },
    active: {
      bg: L ? "bg-violet-100" : "bg-violet-500/20",
      text: "text-violet-500",
      label: "Active",
    },
    investigating: {
      bg: L ? "bg-orange-100" : "bg-orange-500/20",
      text: "text-orange-500",
      label: "Investigating",
    },
    pending_review: {
      bg: L ? "bg-amber-100" : "bg-amber-500/20",
      text: "text-amber-500",
      label: "Pending Review",
    },
    draft: {
      bg: L ? "bg-slate-100" : "bg-slate-500/20",
      text: "text-slate-400",
      label: "Draft",
    },
  };
  const s = map[status] || {
    bg: L ? "bg-slate-100" : "bg-slate-600/20",
    text: "text-slate-400",
    label: status,
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
        s.bg,
        s.text
      )}
    >
      {s.label}
    </span>
  );
}

function SectionCard({
  title,
  children,
  L,
  action,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  L: boolean;
  action?: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <Card
      className={cn(
        "rounded-2xl border backdrop-blur-sm",
        L
          ? "bg-white/80 border-slate-200/80 shadow-sm"
          : "bg-slate-800/40 border-violet-500/15"
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className={cn(
                "w-4 h-4",
                L ? "text-violet-600" : "text-violet-400"
              )}
            />
          )}
          <CardTitle
            className={cn(
              "text-sm font-semibold",
              L ? "text-slate-800" : "text-white"
            )}
          >
            {title}
          </CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB COMPONENTS
// ---------------------------------------------------------------------------

function DashboardTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getHrDashboard?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const d = data || {
    headcount: 0,
    activeDrivers: 0,
    openPositions: 0,
    pendingOnboarding: 0,
    turnoverRate: 0,
    avgTenure: 0,
    newHiresThisMonth: 0,
    complianceScore: 0,
    overtimeHours: 0,
    absenteeismRate: 0,
    diversityIndex: 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Headcount" value={d.headcount} icon={Users} color="text-violet-500" L={L} change={5} />
        <StatCard label="Active Drivers" value={d.activeDrivers} icon={Truck} color="text-blue-500" L={L} change={3} />
        <StatCard label="Open Positions" value={d.openPositions} icon={Briefcase} color="text-amber-500" L={L} />
        <StatCard label="Pending Onboarding" value={d.pendingOnboarding} icon={UserPlus} color="text-green-500" L={L} />
        <StatCard label="Turnover Rate" value={`${d.turnoverRate}%`} icon={TrendingUp} color="text-red-400" L={L} change={-2} />
        <StatCard label="Compliance Score" value={`${d.complianceScore}%`} icon={ShieldCheck} color="text-emerald-500" L={L} change={1} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <SectionCard title="Workforce Summary" L={L} icon={Users}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>Avg Tenure</span>
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{d.avgTenure} years</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>New Hires (30d)</span>
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{d.newHiresThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>Diversity Index</span>
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{d.diversityIndex}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>Overtime Hours</span>
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{Math.round(d.overtimeHours)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>Absenteeism</span>
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{d.absenteeismRate}%</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions" L={L} icon={Target}>
          <div className="space-y-2">
            {[
              { label: "Post New Job", icon: Briefcase, color: "text-violet-500" },
              { label: "Start Onboarding", icon: UserPlus, color: "text-green-500" },
              { label: "Run Payroll", icon: DollarSign, color: "text-blue-500" },
              { label: "Schedule Review", icon: Star, color: "text-amber-500" },
              { label: "Compliance Check", icon: ShieldCheck, color: "text-emerald-500" },
            ].map((a) => (
              <button
                key={a.label}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                  L
                    ? "hover:bg-violet-50 text-slate-700"
                    : "hover:bg-violet-500/10 text-slate-300"
                )}
              >
                <a.icon className={cn("w-4 h-4", a.color)} />
                <span className="text-xs font-medium">{a.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Deadlines" L={L} icon={Calendar}>
          <div className="space-y-3">
            {/* TODO: Replace with trpc query for compliance deadlines (e.g. trpc.compliance.getUpcomingDeadlines) */}
            {([] as { label: string; date: string; urgency: string }[]).length === 0 && (
              <div className={cn("text-xs text-center py-4", L ? "text-slate-400" : "text-slate-500")}>
                No upcoming deadlines — connect compliance data source
              </div>
            )}
            {([] as { label: string; date: string; urgency: string }[]).map((dl) => (
              <div key={dl.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    dl.urgency === "high"
                      ? "bg-red-500"
                      : dl.urgency === "medium"
                      ? "bg-amber-500"
                      : "bg-green-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-xs font-medium truncate", L ? "text-slate-700" : "text-slate-200")}>
                    {dl.label}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                    {dl.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function RecruitingTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getRecruitingPipeline?.useQuery?.() || { data: null, isLoading: false };
  const jobsQ = (trpc as any).hrWorkforce?.getJobPostings?.useQuery?.() || { data: null, isLoading: false };
  const appQ = (trpc as any).hrWorkforce?.getApplicants?.useQuery?.({ jobPostingId: undefined, limit: 50 }) || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const pipeline = data;
  const jobs: any[] = Array.isArray(jobsQ.data) ? jobsQ.data : [];
  const applicants: any[] = appQ.data?.applicants || [];

  return (
    <div className="space-y-6">
      {/* Pipeline Funnel */}
      <SectionCard title="Recruiting Funnel" L={L} icon={Layers}>
        <div className="flex items-end gap-2 h-40">
          {(pipeline?.stages || []).map((stage: any) => {
            const maxCount = Math.max(
              ...(pipeline?.stages || []).map((s: any) => s.count),
              1
            );
            const pct = (stage.count / maxCount) * 100;
            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
                <span className={cn("text-lg font-bold", L ? "text-slate-800" : "text-white")}>
                  {stage.count}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(pct, 8)}%`,
                    backgroundColor: stage.color,
                    opacity: 0.85,
                  }}
                />
                <span className={cn("text-xs font-medium text-center", L ? "text-slate-600" : "text-slate-400")}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-4 pt-3 border-t border-slate-700/20">
          <div>
            <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Conversion</span>
            <div className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{pipeline?.conversionRate || 0}%</div>
          </div>
          <div>
            <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Avg Time to Hire</span>
            <div className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{pipeline?.avgTimeToHire || 0} days</div>
          </div>
          <div>
            <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Cost/Hire</span>
            <div className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{fmt$(pipeline?.costPerHire || 0)}</div>
          </div>
        </div>
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Job Postings */}
        <SectionCard title="Active Job Postings" L={L} icon={Briefcase}>
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className={cn(
                  "p-3 rounded-xl border",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {job.title}
                  </span>
                  <StatusBadge status="active" L={L} />
                </div>
                <div className={cn("text-xs mb-2", L ? "text-slate-500" : "text-slate-400")}>
                  {job.location} | {job.equipmentType} | {job.routeType?.toUpperCase()}
                </div>
                <div className="flex gap-4">
                  <span className="text-xs text-violet-500 font-medium">{job.applicantCount} applicants</span>
                  <span className="text-xs text-blue-400 font-medium">{job.interviewCount} interviews</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Applicants */}
        <SectionCard title="Recent Applicants" L={L} icon={UserPlus}>
          <div className="space-y-3">
            {applicants.map((app: any) => (
              <div
                key={app.id}
                className={cn(
                  "p-3 rounded-xl border",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {app.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-violet-500 font-bold">Score: {app.score}</span>
                    <StatusBadge status={app.stage} L={L} />
                  </div>
                </div>
                <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
                  CDL-{app.cdlClass} | {app.yearsExperience} yrs exp |{" "}
                  {app.endorsements?.join(", ") || "No endorsements"} | via {app.source}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Source Breakdown */}
      <SectionCard title="Candidate Sources" L={L} icon={BarChart3}>
        <div className="grid grid-cols-5 gap-3">
          {(pipeline?.sourceBreakdown || []).map((src: any) => (
            <div key={src.source} className={cn("p-3 rounded-xl text-center", L ? "bg-slate-50" : "bg-slate-700/30")}>
              <div className={cn("text-lg font-bold", L ? "text-slate-800" : "text-white")}>{src.count}</div>
              <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{src.source}</div>
              <div className="text-xs text-violet-500 font-semibold">{src.percentage}%</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function OnboardingTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getOnboardingWorkflow?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const workflow = data;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <SectionCard title="Onboarding Progress" L={L} icon={ClipboardList}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={cn("text-sm font-medium", L ? "text-slate-700" : "text-slate-300")}>
              Overall Completion
            </span>
            <span className="text-sm font-bold text-violet-500">
              {workflow?.completionPercentage || 0}%
            </span>
          </div>
          <Progress value={workflow?.completionPercentage || 0} className="h-2" />
        </div>
      </SectionCard>

      {/* Phases */}
      <div className="grid md:grid-cols-2 gap-4">
        {(workflow?.phases || []).map((phase: any) => {
          const completed = phase.tasks.filter(
            (t: any) => t.status === "completed"
          ).length;
          const total = phase.tasks.length;
          return (
            <SectionCard key={phase.id} title={phase.label} L={L} icon={FileText}>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>
                    {completed}/{total} complete
                  </span>
                  <span className="text-violet-500 font-semibold">
                    {total > 0 ? Math.round((completed / total) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={total > 0 ? (completed / total) * 100 : 0}
                  className="h-1.5"
                />
              </div>
              <div className="space-y-2">
                {phase.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg",
                      L ? "hover:bg-slate-50" : "hover:bg-slate-700/30"
                    )}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : task.status === "in_progress" ? (
                      <CircleDot className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 shrink-0",
                          L ? "border-slate-300" : "border-slate-600"
                        )}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-xs font-medium",
                          task.status === "completed"
                            ? L
                              ? "text-slate-400 line-through"
                              : "text-slate-500 line-through"
                            : L
                            ? "text-slate-700"
                            : "text-slate-200"
                        )}
                      >
                        {task.label}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          L ? "text-slate-400" : "text-slate-500"
                        )}
                      >
                        {task.assignee} | Due: {fmtDate(task.dueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}

function PayrollTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getPayrollDashboard?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const p = data || {
    totalPayroll: 0,
    nextRunDate: "",
    pendingApprovals: 0,
    processedThisMonth: 0,
    ytdTotal: 0,
    averagePay: 0,
    adjustments: [],
    upcomingRuns: [],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Payroll" value={fmt$(p.totalPayroll)} icon={DollarSign} color="text-violet-500" L={L} />
        <StatCard label="YTD Total" value={fmt$(p.ytdTotal)} icon={TrendingUp} color="text-blue-500" L={L} />
        <StatCard label="Avg Pay" value={fmt$(p.averagePay)} icon={Users} color="text-green-500" L={L} />
        <StatCard label="Pending Approvals" value={p.pendingApprovals} icon={Clock} color="text-amber-500" L={L} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Upcoming Payroll Runs" L={L} icon={Calendar}>
          <div className="space-y-3">
            {p.upcomingRuns.map((run: any) => (
              <div
                key={run.id}
                className={cn(
                  "p-3 rounded-xl border",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div className="flex justify-between mb-1">
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {run.id}
                  </span>
                  <StatusBadge status={run.status === "scheduled" ? "pending" : run.status} L={L} />
                </div>
                <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
                  {fmtDate(run.periodStart)} - {fmtDate(run.periodEnd)}
                </div>
                <div className="text-xs text-violet-500 font-semibold mt-1">
                  Est: {fmt$(run.estimatedTotal)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Adjustments" L={L} icon={FileText}>
          <div className="space-y-3">
            {p.adjustments.map((adj: any, i: number) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div>
                  <div className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>
                    {adj.description}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
                    {adj.driverCount} driver(s) affected
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold",
                    adj.amount >= 0 ? "text-green-500" : "text-red-400"
                  )}
                >
                  {adj.amount >= 0 ? "+" : ""}
                  {fmt$(adj.amount)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-center">
        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
          <DollarSign className="w-4 h-4 mr-2" />
          Process Payroll
        </Button>
      </div>
    </div>
  );
}

function TimeTrackingTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getTimeTracking?.useQuery?.({}) || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const tt = data || { records: [], summary: { totalDrivers: 0, pendingApproval: 0, violationCount: 0, avgDrivingHours: 0 } };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Drivers" value={tt.summary.totalDrivers} icon={Users} color="text-violet-500" L={L} />
        <StatCard label="Pending Approval" value={tt.summary.pendingApproval} icon={Clock} color="text-amber-500" L={L} />
        <StatCard label="Violations" value={tt.summary.violationCount} icon={AlertTriangle} color="text-red-400" L={L} />
        <StatCard label="Avg Driving Hours" value={`${tt.summary.avgDrivingHours}h`} icon={Truck} color="text-blue-500" L={L} />
      </div>

      <SectionCard title="Time Records" L={L} icon={Clock}>
        <div className="space-y-3">
          {tt.records.map((rec: any) => (
            <div
              key={rec.id}
              className={cn(
                "p-3 rounded-xl border",
                L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {rec.driverName}
                  </span>
                  <span className={cn("text-xs ml-2", L ? "text-slate-500" : "text-slate-400")}>
                    {rec.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {rec.violations > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {rec.violations} violation(s)
                    </Badge>
                  )}
                  <StatusBadge status={rec.status} L={L} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Driving", value: `${rec.driving}h`, color: "text-violet-500" },
                  { label: "On-Duty", value: `${rec.onDuty}h`, color: "text-blue-400" },
                  { label: "Off-Duty", value: `${rec.offDuty}h`, color: "text-green-500" },
                  { label: "Sleeper", value: `${rec.sleeper}h`, color: "text-amber-500" },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className={cn("text-xs font-bold", m.color)}>{m.value}</div>
                    <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function PerformanceTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getPerformanceReviews?.useQuery?.({}) || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const perf = data || { reviews: [], upcoming: [] };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Reviews" L={L} icon={Star}>
          <div className="space-y-3">
            {perf.reviews.map((rev: any) => (
              <div
                key={rev.id}
                className={cn(
                  "p-3 rounded-xl border",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                      {rev.employeeName}
                    </span>
                    <span className={cn("text-xs ml-2", L ? "text-slate-500" : "text-slate-400")}>
                      {rev.period} ({rev.type})
                    </span>
                  </div>
                  <StatusBadge status={rev.status} L={L} />
                </div>
                {rev.overallRating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-violet-500 font-bold">
                      Rating: {rev.overallRating}/5
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-3 h-3",
                            s <= Math.round(rev.overallRating)
                              ? "text-amber-400 fill-amber-400"
                              : L
                              ? "text-slate-300"
                              : "text-slate-600"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {rev.categories && Object.keys(rev.categories).length > 0 && (
                  <div className="grid grid-cols-5 gap-1">
                    {Object.entries(rev.categories).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-xs text-violet-400 font-bold">{v as number}</div>
                        <div className={cn("text-xs capitalize", L ? "text-slate-400" : "text-slate-500")}>
                          {k.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Reviews" L={L} icon={Calendar}>
          <div className="space-y-3">
            {perf.upcoming.map((up: any) => (
              <div
                key={up.employeeId}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div>
                  <div className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {up.employeeName}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
                    {up.type} | Due: {fmtDate(up.dueDate)}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-violet-500/50 text-violet-500 hover:bg-violet-500/10 text-xs">
                  Start Review
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function BenefitsTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getBenefitsAdmin?.useQuery?.() || { data: null, isLoading: false };
  const oeQ = (trpc as any).hrWorkforce?.getOpenEnrollment?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const ben = data || { enrollmentSummary: { totalEligible: 0, enrolled: 0, waived: 0, enrollmentRate: 0 }, plans: [], totalMonthlyCost: 0 };
  const oe = oeQ.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Eligible Employees" value={ben.enrollmentSummary.totalEligible} icon={Users} color="text-violet-500" L={L} />
        <StatCard label="Enrolled" value={ben.enrollmentSummary.enrolled} icon={UserCheck} color="text-green-500" L={L} />
        <StatCard label="Enrollment Rate" value={`${ben.enrollmentSummary.enrollmentRate}%`} icon={TrendingUp} color="text-blue-500" L={L} />
        <StatCard label="Monthly Cost" value={fmt$(ben.totalMonthlyCost)} icon={DollarSign} color="text-amber-500" L={L} />
      </div>

      <SectionCard title="Benefit Plans" L={L} icon={Heart}>
        <div className="space-y-3">
          {ben.plans.map((plan: any) => (
            <div
              key={plan.id}
              className={cn(
                "p-3 rounded-xl border",
                L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {plan.name}
                  </span>
                  <Badge className="ml-2 text-xs bg-violet-500/20 text-violet-400">{plan.type}</Badge>
                </div>
                <span className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>
                  {plan.enrolled} enrolled
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className={cn("text-xs font-bold", L ? "text-slate-700" : "text-slate-200")}>
                    {fmt$(plan.monthlyCost)}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                    Total/mo
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-green-500">
                    {fmt$(plan.employerContribution)}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                    Employer
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-amber-500">
                    {fmt$(plan.employeeContribution)}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                    Employee
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {oe && (
        <SectionCard title="Open Enrollment" L={L} icon={Calendar}>
          <div className={cn("p-3 rounded-xl border", L ? "bg-violet-50 border-violet-200" : "bg-violet-500/10 border-violet-500/20")}>
            <div className="flex items-center justify-between">
              <div>
                <div className={cn("text-sm font-semibold", L ? "text-violet-800" : "text-violet-300")}>
                  {oe.currentPeriod.id}
                </div>
                <div className={cn("text-xs", L ? "text-violet-600" : "text-violet-400")}>
                  {fmtDate(oe.currentPeriod.startDate)} - {fmtDate(oe.currentPeriod.endDate)}
                </div>
              </div>
              <StatusBadge status={oe.currentPeriod.status === "upcoming" ? "pending" : oe.currentPeriod.status} L={L} />
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function CompensationTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getCompensationBenchmark?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const comp = data || { positions: [], lastUpdated: "", dataSource: "" };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Compensation Benchmarking"
        L={L}
        icon={BarChart3}
        action={
          <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
            Source: {comp.dataSource} | Updated: {fmtDate(comp.lastUpdated)}
          </span>
        }
      >
        <div className="space-y-3">
          {comp.positions.map((pos: any) => (
            <div
              key={pos.title}
              className={cn(
                "p-3 rounded-xl border",
                L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                  {pos.title}
                </span>
                <Badge
                  className={cn(
                    "text-xs",
                    pos.percentile >= 70
                      ? "bg-green-500/20 text-green-500"
                      : pos.percentile >= 50
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-red-500/20 text-red-400"
                  )}
                >
                  {pos.percentile}th percentile
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Company Avg</div>
                  <div className="text-sm font-bold text-violet-500">
                    {pos.unit === "salary"
                      ? fmt$(pos.companyAvg)
                      : pos.unit === "hourly"
                      ? `$${pos.companyAvg}/hr`
                      : `$${pos.companyAvg}/mi`}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Market Avg</div>
                  <div className={cn("text-sm font-bold", L ? "text-slate-700" : "text-slate-300")}>
                    {pos.unit === "salary"
                      ? fmt$(pos.marketAvg)
                      : pos.unit === "hourly"
                      ? `$${pos.marketAvg}/hr`
                      : `$${pos.marketAvg}/mi`}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>Difference</div>
                  <div className={cn("text-sm font-bold", pos.companyAvg >= pos.marketAvg ? "text-green-500" : "text-red-400")}>
                    {pos.companyAvg >= pos.marketAvg ? "+" : ""}
                    {pos.unit === "salary"
                      ? fmt$(pos.companyAvg - pos.marketAvg)
                      : pos.unit === "hourly"
                      ? `$${(pos.companyAvg - pos.marketAvg).toFixed(2)}/hr`
                      : `$${(pos.companyAvg - pos.marketAvg).toFixed(2)}/mi`}
                  </div>
                </div>
              </div>
              {/* Percentile bar */}
              <div className="mt-2">
                <div className={cn("h-1.5 rounded-full", L ? "bg-slate-200" : "bg-slate-700")}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: `${pos.percentile}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function OrgChartTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getOrganizationChart?.useQuery?.() || { data: null, isLoading: false };
  const succQ = (trpc as any).hrWorkforce?.getSuccessionPlanning?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const org = data || { nodes: [], totalEmployees: 0, departments: [] };
  const succ = succQ.data;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Organization Overview" L={L} icon={Building2}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={cn("p-3 rounded-xl text-center", L ? "bg-slate-50" : "bg-slate-700/30")}>
              <div className={cn("text-2xl font-bold", L ? "text-slate-800" : "text-white")}>{org.totalEmployees}</div>
              <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>Total Employees</div>
            </div>
            <div className={cn("p-3 rounded-xl text-center", L ? "bg-slate-50" : "bg-slate-700/30")}>
              <div className={cn("text-2xl font-bold text-violet-500")}>{org.departments.length}</div>
              <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>Departments</div>
            </div>
          </div>
          <div className="space-y-2">
            {org.departments.map((dept: any) => (
              <div key={dept.name} className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-300")}>{dept.name}</span>
                <div className="flex items-center gap-2">
                  <div className={cn("h-1.5 rounded-full w-24", L ? "bg-slate-200" : "bg-slate-700")}>
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${org.totalEmployees > 0 ? (dept.count / org.totalEmployees) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className={cn("text-xs font-bold w-6 text-right", L ? "text-slate-600" : "text-slate-400")}>
                    {dept.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {succ && (
          <SectionCard title="Succession Planning" L={L} icon={GraduationCap}>
            <div className="space-y-3">
              {succ.positions.map((pos: any) => (
                <div
                  key={pos.role}
                  className={cn(
                    "p-3 rounded-xl border",
                    L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                        {pos.role}
                      </span>
                      <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
                        Current: {pos.currentHolder}
                      </div>
                    </div>
                    <StatusBadge
                      status={pos.readiness === "at_risk" ? "attention" : "compliant"}
                      L={L}
                    />
                  </div>
                  <div className="space-y-1">
                    {pos.successors.map((s: any) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between"
                      >
                        <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-300")}>
                          {s.name}
                        </span>
                        <Badge className="text-xs bg-violet-500/20 text-violet-400">
                          {s.readiness.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Employee List */}
      <SectionCard title="Team Members" L={L} icon={Users}>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {org.nodes.map((node: any) => (
              <div
                key={node.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg",
                  L ? "hover:bg-slate-50" : "hover:bg-slate-700/30"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    L ? "bg-violet-100 text-violet-700" : "bg-violet-500/20 text-violet-400"
                  )}
                >
                  {(node.name || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-xs font-medium truncate", L ? "text-slate-700" : "text-slate-200")}>
                    {node.name}
                  </div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                    {node.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SectionCard>
    </div>
  );
}

function ComplianceTab({ L }: { L: boolean }) {
  const { data, isLoading } = (trpc as any).hrWorkforce?.getLaborCompliance?.useQuery?.() || { data: null, isLoading: false };
  const erQ = (trpc as any).hrWorkforce?.getEmployeeRelations?.useQuery?.() || { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const comp = data || { overallScore: 0, categories: [], upcomingDeadlines: [] };
  const er = erQ.data || { activeCases: [], closedThisMonth: 0, avgResolutionDays: 0, satisfactionScore: 0 };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Compliance Score" value={`${comp.overallScore}%`} icon={ShieldCheck} color="text-emerald-500" L={L} change={1} />
        <StatCard label="Active ER Cases" value={er.activeCases.length} icon={AlertTriangle} color="text-amber-500" L={L} />
        <StatCard label="Avg Resolution" value={`${er.avgResolutionDays}d`} icon={Clock} color="text-blue-500" L={L} />
        <StatCard label="Satisfaction" value={`${er.satisfactionScore}/5`} icon={Star} color="text-violet-500" L={L} />
      </div>

      {/* Compliance Categories */}
      <SectionCard title="Labor Law Compliance" L={L} icon={ShieldCheck}>
        <div className="space-y-3">
          {comp.categories.map((cat: any) => (
            <div
              key={cat.id}
              className={cn(
                "p-3 rounded-xl border",
                L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {cat.name}
                  </span>
                  <Badge className="text-xs bg-slate-500/20 text-slate-400">{cat.id}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-500">{cat.score}%</span>
                  <StatusBadge status={cat.status} L={L} />
                </div>
              </div>
              <div className="space-y-1">
                {cat.items.map((item: any) => (
                  <div key={item.rule} className="flex items-center gap-2">
                    {item.status === "compliant" ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                    <span className={cn("text-xs", L ? "text-slate-600" : "text-slate-300")}>
                      {item.rule}
                    </span>
                  </div>
                ))}
              </div>
              <div className={cn("text-xs mt-1", L ? "text-slate-400" : "text-slate-500")}>
                Last audit: {fmtDate(cat.lastAudit)}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <SectionCard title="Upcoming Deadlines" L={L} icon={Calendar}>
          <div className="space-y-3">
            {comp.upcomingDeadlines.map((dl: any) => (
              <div
                key={dl.name}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div>
                  <div className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{dl.name}</div>
                  <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{fmtDate(dl.dueDate)}</div>
                </div>
                <StatusBadge status={dl.status} L={L} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Employee Relations */}
        <SectionCard title="Employee Relations Cases" L={L} icon={Users}>
          <div className="space-y-3">
            {er.activeCases.map((c: any) => (
              <div
                key={c.id}
                className={cn(
                  "p-3 rounded-xl border",
                  L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                    {c.id}
                  </span>
                  <StatusBadge status={c.status} L={L} />
                </div>
                <div className={cn("text-xs mb-1", L ? "text-slate-700" : "text-slate-300")}>
                  {c.subject}
                </div>
                <div className={cn("text-xs", L ? "text-slate-500" : "text-slate-500")}>
                  {c.type} | {c.priority} priority | {c.assignedTo} | Opened: {fmtDate(c.openedAt)}
                </div>
              </div>
            ))}
            {er.activeCases.length === 0 && (
              <div className={cn("text-xs text-center py-4", L ? "text-slate-400" : "text-slate-500")}>
                No active cases
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function HrWorkforce() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "recruiting", label: "Recruiting", icon: UserPlus },
    { id: "onboarding", label: "Onboarding", icon: ClipboardList },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "time", label: "Time Tracking", icon: Clock },
    { id: "performance", label: "Performance", icon: Star },
    { id: "benefits", label: "Benefits", icon: Heart },
    { id: "compensation", label: "Compensation", icon: TrendingUp },
    { id: "organization", label: "Org Chart", icon: Building2 },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              L ? "text-slate-900" : "text-white"
            )}
          >
            HR & Workforce Management
          </h1>
          <p
            className={cn(
              "text-sm",
              L ? "text-slate-600" : "text-slate-400"
            )}
          >
            Recruiting, onboarding, payroll, performance, benefits, and compliance command center
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "text-xs",
              L
                ? "border-slate-200"
                : "border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
            )}
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            New Hire
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={cn(
            "flex flex-wrap gap-1 h-auto p-1 rounded-xl",
            L
              ? "bg-slate-100"
              : "bg-slate-800/60 border border-violet-500/10"
          )}
        >
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg data-[state=active]:shadow-sm",
                L
                  ? "data-[state=active]:bg-white data-[state=active]:text-violet-700"
                  : "data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300"
              )}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab L={L} />
        </TabsContent>
        <TabsContent value="recruiting" className="mt-4">
          <RecruitingTab L={L} />
        </TabsContent>
        <TabsContent value="onboarding" className="mt-4">
          <OnboardingTab L={L} />
        </TabsContent>
        <TabsContent value="payroll" className="mt-4">
          <PayrollTab L={L} />
        </TabsContent>
        <TabsContent value="time" className="mt-4">
          <TimeTrackingTab L={L} />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab L={L} />
        </TabsContent>
        <TabsContent value="benefits" className="mt-4">
          <BenefitsTab L={L} />
        </TabsContent>
        <TabsContent value="compensation" className="mt-4">
          <CompensationTab L={L} />
        </TabsContent>
        <TabsContent value="organization" className="mt-4">
          <OrgChartTab L={L} />
        </TabsContent>
        <TabsContent value="compliance" className="mt-4">
          <ComplianceTab L={L} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
