/**
 * TRAINING, COMPLIANCE & REGULATORY MANAGEMENT
 * Compliance command center — LMS, certifications, permits, insurance,
 * drug/alcohol testing, CSA analysis, audit prep, IFTA/UCR/BOC filings.
 * 100% Dynamic | Theme-aware | Dark theme with blue/navy compliance accents.
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/hooks/useLocale";
import {
  Shield, BookOpen, Award, FileText, Landmark, Beaker, BarChart3,
  AlertTriangle, ClipboardCheck, Users, Truck, Calendar, ChevronRight,
  CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight, Target,
  GraduationCap, Search, Filter, Download, RefreshCw, TrendingUp,
  Activity, Eye, Play, Star, Gauge, MapPin, DollarSign, Building2,
  Scale, Pill, Heart, Zap, Globe, FileCheck, Flame,
} from "lucide-react";

// ── Types ──

type TabId =
  | "dashboard"
  | "training"
  | "certifications"
  | "permits"
  | "insurance"
  | "drugAlcohol"
  | "safety"
  | "regulatory"
  | "audit"
  | "dqFiles"
  | "filings";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

// ── Constants ──

const TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: Shield },
  { id: "training", label: "Training LMS", icon: GraduationCap },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "permits", label: "Permits", icon: MapPin },
  { id: "insurance", label: "Insurance", icon: Building2 },
  { id: "drugAlcohol", label: "Drug & Alcohol", icon: Beaker },
  { id: "safety", label: "Safety Scorecard", icon: BarChart3 },
  { id: "regulatory", label: "Regulatory", icon: Scale },
  { id: "audit", label: "Audit Prep", icon: ClipboardCheck },
  { id: "dqFiles", label: "DQ Files", icon: FileText },
  { id: "filings", label: "IFTA/UCR/BOC", icon: Landmark },
];

// ── Main Component ──

export default function TrainingCompliance() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const L = theme === "light";
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Style helpers
  const pageBg = L ? "bg-slate-50 min-h-screen" : "bg-[#0a0e1a] min-h-screen";
  const cardCls = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/90 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const titleCls = cn("text-sm font-semibold", L ? "text-slate-800" : "text-white");
  const subtitleCls = cn("text-xs", L ? "text-slate-500" : "text-slate-400");
  const accentBg = L ? "bg-blue-50 border-blue-200" : "bg-blue-900/20 border-blue-800/40";

  return (
    <div className={pageBg}>
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold", L ? "text-slate-900" : "text-white")}>
              {t('trainingCompliance.title')}
            </h1>
            <p className={subtitleCls}>
              Training, certifications, regulatory compliance, and audit readiness
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search compliance..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className={cn(
                  "pl-9 w-64",
                  L ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                )}
              />
            </div>
            <Button variant="outline" size="sm" className={L ? "" : "border-slate-700 text-slate-300 hover:bg-slate-800"}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={cn("flex gap-1 overflow-x-auto pb-1 scrollbar-hide rounded-xl p-1", L ? "bg-slate-100" : "bg-slate-800/60")}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? L ? "bg-white text-blue-700 shadow-sm" : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : L ? "text-slate-500 hover:text-slate-700 hover:bg-white/60" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && <DashboardTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} accentBg={accentBg} />}
        {activeTab === "training" && <TrainingTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} searchTerm={searchTerm} />}
        {activeTab === "certifications" && <CertificationsTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "permits" && <PermitsTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "insurance" && <InsuranceTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "drugAlcohol" && <DrugAlcoholTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "safety" && <SafetyTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "regulatory" && <RegulatoryTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "audit" && <AuditTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "dqFiles" && <DqFilesTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
        {activeTab === "filings" && <FilingsTab cardCls={cardCls} titleCls={titleCls} subtitleCls={subtitleCls} L={L} />}
      </div>
    </div>
  );
}

// ── Shared Sub-Components ──

interface TabProps {
  cardCls: string;
  titleCls: string;
  subtitleCls: string;
  L: boolean;
  accentBg?: string;
  searchTerm?: string;
}

function StatCard({ label, value, icon: Icon, trend, color, L }: { label: string; value: string | number; icon: React.ElementType; trend?: number; color: string; L: boolean }) {
  const colorMap: Record<string, string> = {
    blue: L ? "text-blue-600 bg-blue-50" : "text-blue-400 bg-blue-900/30",
    green: L ? "text-green-600 bg-green-50" : "text-green-400 bg-green-900/30",
    amber: L ? "text-amber-600 bg-amber-50" : "text-amber-400 bg-amber-900/30",
    red: L ? "text-red-600 bg-red-50" : "text-red-400 bg-red-900/30",
    purple: L ? "text-purple-600 bg-purple-50" : "text-purple-400 bg-purple-900/30",
    cyan: L ? "text-cyan-600 bg-cyan-50" : "text-cyan-400 bg-cyan-900/30",
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={cn("p-4 rounded-xl border", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", c)}><Icon className="w-4 h-4" /></div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-bold", trend >= 0 ? "text-green-500" : "text-red-500")}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={cn("text-xl font-bold", L ? "text-slate-900" : "text-white")}>{value}</p>
      <p className={cn("text-xs mt-0.5", L ? "text-slate-500" : "text-slate-400")}>{label}</p>
    </div>
  );
}

function RiskBadge({ level, L }: { level: string; L: boolean }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    low: "bg-green-500/10 text-green-500 border-green-500/30",
  };
  return (
    <Badge variant="outline" className={cn("text-xs uppercase font-bold border", colors[level] || colors.medium)}>
      {level}
    </Badge>
  );
}

function ProgressBar({ value, max, color, L }: { value: number; max: number; color: string; L: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    cyan: "bg-cyan-500",
  };
  return (
    <div className={cn("h-2 rounded-full w-full", L ? "bg-slate-100" : "bg-slate-700/50")}>
      <div className={cn("h-2 rounded-full transition-all", barColors[color] || "bg-blue-500")} style={{ width: `${pct}%` }} />
    </div>
  );
}

function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Dashboard
// ═══════════════════════════════════════════════════════════════════════════

function DashboardTab({ cardCls, titleCls, subtitleCls, L, accentBg }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getComplianceDashboard?.useQuery?.({}) ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={8} />;

  const scoreColor = (d?.overallComplianceScore ?? 0) >= 90 ? "green" : (d?.overallComplianceScore ?? 0) >= 75 ? "amber" : "red";

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Compliance Score" value={`${d?.overallComplianceScore ?? 0}%`} icon={Shield} color={scoreColor} L={L} trend={3} />
        <StatCard label="Total Drivers" value={d?.totalDrivers ?? 0} icon={Users} color="blue" L={L} />
        <StatCard label="Certs Expiring" value={d?.certExpiringSoon ?? 0} icon={AlertTriangle} color="amber" L={L} />
        <StatCard label="HOS Violations" value={d?.hosViolations ?? 0} icon={Clock} color="red" L={L} />
        <StatCard label="Audit Readiness" value={`${d?.auditReadiness ?? 0}%`} icon={ClipboardCheck} color="cyan" L={L} trend={5} />
        <StatCard label="Open Deficiencies" value={d?.openDeficiencies ?? 0} icon={XCircle} color="red" L={L} />
      </div>

      {/* Compliance Areas Heat Map */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Compliance Areas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(d?.areas || []).map((area: any) => {
              const color = area.score >= 90 ? "green" : area.score >= 80 ? "blue" : area.score >= 70 ? "amber" : "red";
              const bgColor = color === "green"
                ? L ? "bg-green-50 border-green-200" : "bg-green-900/20 border-green-800/40"
                : color === "blue"
                ? L ? "bg-blue-50 border-blue-200" : "bg-blue-900/20 border-blue-800/40"
                : color === "amber"
                ? L ? "bg-amber-50 border-amber-200" : "bg-amber-900/20 border-amber-800/40"
                : L ? "bg-red-50 border-red-200" : "bg-red-900/20 border-red-800/40";
              return (
                <div key={area.name} className={cn("p-3 rounded-xl border text-center", bgColor)}>
                  <p className={cn("text-2xl font-bold", `text-${color}-500`)}>{area.score}%</p>
                  <p className={cn("text-xs mt-1", L ? "text-slate-600" : "text-slate-300")}>{area.name}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Recent Alerts</h3>
          <div className="space-y-3">
            {(d?.recentAlerts || []).map((alert: any) => (
              <div key={alert.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", alert.severity === "high" ? "text-red-500" : alert.severity === "medium" ? "text-amber-500" : "text-blue-500")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", L ? "text-slate-800" : "text-white")}>{alert.message}</p>
                  <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{new Date(alert.date).toLocaleDateString()}</p>
                </div>
                <RiskBadge level={alert.severity} L={L} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Training LMS
// ═══════════════════════════════════════════════════════════════════════════

function TrainingTab({ cardCls, titleCls, subtitleCls, L, searchTerm }: TabProps) {
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<"all" | "safety" | "compliance" | "hazmat">("all");
  const q = (trpc as any).trainingCompliance?.getTrainingCatalog?.useQuery?.({ category, search: searchTerm }) ?? { data: null, isLoading: true };
  const statusQ = (trpc as any).trainingCompliance?.getDriverTrainingStatus?.useQuery?.({}) ?? { data: null, isLoading: false };
  const d = q.data;
  const st = statusQ.data;

  if (q.isLoading) return <LoadingGrid count={6} />;

  const catColors: Record<string, string> = {
    safety: L ? "bg-green-100 text-green-700" : "bg-green-900/30 text-green-400",
    compliance: L ? "bg-blue-100 text-blue-700" : "bg-blue-900/30 text-blue-400",
    hazmat: L ? "bg-orange-100 text-orange-700" : "bg-orange-900/30 text-orange-400",
  };
  const levelIcons: Record<string, React.ElementType> = {
    beginner: BookOpen,
    intermediate: Target,
    advanced: Star,
  };

  return (
    <div className="space-y-6">
      {/* Training Progress Summary */}
      {st && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Completed Courses" value={st.completedCourses} icon={CheckCircle} color="green" L={L} />
          <StatCard label="In Progress" value={st.inProgressCourses} icon={Play} color="blue" L={L} />
          <StatCard label="Required Courses" value={st.totalRequiredCourses} icon={FileText} color="amber" L={L} />
          <StatCard label="Completion" value={`${st.completionPercentage}%`} icon={Target} color="cyan" L={L} />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        {(["all", "safety", "compliance", "hazmat"] as const).map(cat => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className={cn(
              category !== cat && (L ? "" : "border-slate-700 text-slate-300 hover:bg-slate-800"),
              category === cat && !L && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
        <span className={subtitleCls}>{d?.courses?.length ?? 0} courses</span>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(d?.courses || []).map((course: any) => {
          const LevelIcon = levelIcons[course.level] || BookOpen;
          return (
            <Card key={course.id} className={cn(cardCls, "hover:border-blue-500/40 transition-all cursor-pointer group")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge className={cn("text-xs", catColors[course.category] || catColors.safety)}>{course.category}</Badge>
                  {course.required && <Badge variant="outline" className="text-xs border-red-500/30 text-red-500">Required</Badge>}
                </div>
                <h4 className={cn("text-sm font-semibold leading-tight", L ? "text-slate-800" : "text-white")}>{course.title}</h4>
                <p className={cn("text-xs line-clamp-2", L ? "text-slate-500" : "text-slate-400")}>{course.description}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={cn("flex items-center gap-1", L ? "text-slate-500" : "text-slate-400")}>
                    <Clock className="w-3 h-3" />{Math.floor(course.duration / 60)}h {course.duration % 60}m
                  </span>
                  <span className={cn("flex items-center gap-1", L ? "text-slate-500" : "text-slate-400")}>
                    <BookOpen className="w-3 h-3" />{course.modules} modules
                  </span>
                  <span className={cn("flex items-center gap-1", L ? "text-slate-500" : "text-slate-400")}>
                    <LevelIcon className="w-3 h-3" />{course.level}
                  </span>
                </div>
                <Button size="sm" className={cn("w-full", L ? "" : "bg-blue-600 hover:bg-blue-700 text-white")} onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/training-lms?course=${course.id}`); }}>
                  <Play className="w-3 h-3 mr-1" /> Start Course
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Certifications
// ═══════════════════════════════════════════════════════════════════════════

function CertificationsTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const [filter, setFilter] = useState<"all" | "expiring" | "expired" | "valid">("all");
  const q = (trpc as any).trainingCompliance?.getCertificationTracker?.useQuery?.({ filter }) ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Certifications" value={d?.summary?.total ?? 0} icon={Award} color="blue" L={L} />
        <StatCard label="Valid" value={d?.summary?.valid ?? 0} icon={CheckCircle} color="green" L={L} />
        <StatCard label="Expiring Soon" value={d?.summary?.expiringSoon ?? 0} icon={AlertTriangle} color="amber" L={L} />
        <StatCard label="Expired" value={d?.summary?.expired ?? 0} icon={XCircle} color="red" L={L} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "valid", "expiring", "expired"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className={cn(filter !== f && !L && "border-slate-700 text-slate-300 hover:bg-slate-800", filter === f && !L && "bg-blue-600 hover:bg-blue-700")}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Certification List */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <div className="space-y-2">
            <div className={cn("grid grid-cols-5 gap-4 px-3 py-2 text-xs font-semibold", L ? "text-slate-500" : "text-slate-400")}>
              <span>Driver</span><span>Type</span><span>Status</span><span>Expiry Date</span><span>Days Left</span>
            </div>
            {(d?.certifications || []).map((cert: any) => {
              const statusColor = cert.status === "valid" ? "text-green-500" : cert.status === "expiring_soon" ? "text-amber-500" : "text-red-500";
              return (
                <div key={cert.id} className={cn("grid grid-cols-5 gap-4 px-3 py-2.5 rounded-lg text-sm items-center", L ? "hover:bg-slate-50" : "hover:bg-slate-800/30")}>
                  <span className={L ? "text-slate-800" : "text-white"}>{cert.driverName}</span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>{cert.type}</span>
                  <span className={statusColor}>{cert.status.replace("_", " ")}</span>
                  <span className={L ? "text-slate-500" : "text-slate-400"}>{new Date(cert.expiryDate).toLocaleDateString()}</span>
                  <span className={cn("font-mono", cert.daysUntilExpiry < 0 ? "text-red-500" : cert.daysUntilExpiry < 30 ? "text-amber-500" : L ? "text-slate-600" : "text-slate-300")}>
                    {cert.daysUntilExpiry}d
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Permits
// ═══════════════════════════════════════════════════════════════════════════

function PermitsTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const [permitType, setPermitType] = useState<"all" | "oversize" | "overweight" | "trip" | "fuel">("all");
  const q = (trpc as any).trainingCompliance?.getPermitManagement?.useQuery?.({ type: permitType }) ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Permits" value={d?.summary?.active ?? 0} icon={CheckCircle} color="green" L={L} />
        <StatCard label="Pending" value={d?.summary?.pending ?? 0} icon={Clock} color="amber" L={L} />
        <StatCard label="Expired" value={d?.summary?.expired ?? 0} icon={XCircle} color="red" L={L} />
        <StatCard label="Total Cost" value={`$${(d?.summary?.totalCost ?? 0).toLocaleString()}`} icon={DollarSign} color="blue" L={L} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "oversize", "overweight", "trip", "fuel"] as const).map(t => (
          <Button key={t} variant={permitType === t ? "default" : "outline"} size="sm" onClick={() => setPermitType(t)}
            className={cn(permitType !== t && !L && "border-slate-700 text-slate-300 hover:bg-slate-800", permitType === t && !L && "bg-blue-600 hover:bg-blue-700")}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      <Card className={cardCls}>
        <CardContent className="p-5">
          <div className="space-y-2">
            <div className={cn("grid grid-cols-6 gap-3 px-3 py-2 text-xs font-semibold", L ? "text-slate-500" : "text-slate-400")}>
              <span>Permit #</span><span>State</span><span>Type</span><span>Status</span><span>Cost</span><span>Expires</span>
            </div>
            {(d?.permits || []).slice(0, 15).map((p: any) => {
              const sc = p.status === "active" ? "text-green-500" : p.status === "pending" ? "text-amber-500" : "text-red-500";
              return (
                <div key={p.id} className={cn("grid grid-cols-6 gap-3 px-3 py-2.5 rounded-lg text-sm items-center", L ? "hover:bg-slate-50" : "hover:bg-slate-800/30")}>
                  <span className={cn("font-mono text-xs", L ? "text-slate-700" : "text-slate-300")}>{p.permitNumber}</span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>{p.state}</span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>{p.type}</span>
                  <span className={sc}>{p.status}</span>
                  <span className={L ? "text-slate-700" : "text-slate-200"}>${p.cost}</span>
                  <span className={cn("text-xs", p.daysUntilExpiry < 0 ? "text-red-500" : p.daysUntilExpiry < 30 ? "text-amber-500" : L ? "text-slate-500" : "text-slate-400")}>
                    {new Date(p.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Insurance
// ═══════════════════════════════════════════════════════════════════════════

function InsuranceTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getInsuranceManagement?.useQuery?.({}) ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Policies" value={d?.summary?.totalPolicies ?? 0} icon={FileText} color="blue" L={L} />
        <StatCard label="Annual Premium" value={`$${(d?.summary?.totalPremium ?? 0).toLocaleString()}`} icon={DollarSign} color="amber" L={L} />
        <StatCard label="Total Coverage" value={`$${((d?.summary?.totalCoverage ?? 0) / 1000000).toFixed(1)}M`} icon={Shield} color="green" L={L} />
        <StatCard label="Active Claims" value={d?.summary?.activeClaims ?? 0} icon={AlertTriangle} color="red" L={L} />
        <StatCard label="Claims Amount" value={`$${(d?.summary?.totalClaimsAmount ?? 0).toLocaleString()}`} icon={Flame} color="red" L={L} />
      </div>

      {/* Policies */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Insurance Policies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(d?.policies || []).map((p: any) => (
              <div key={p.id} className={cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{p.type}</h4>
                  <Badge variant="outline" className={cn("text-xs", p.status === "active" ? "border-green-500/30 text-green-500" : "border-amber-500/30 text-amber-500")}>
                    {p.status}
                  </Badge>
                </div>
                <p className={cn("text-xs mb-1", L ? "text-slate-500" : "text-slate-400")}>{p.provider}</p>
                <p className={cn("text-xs font-mono mb-2", L ? "text-slate-400" : "text-slate-500")}>{p.policyNumber}</p>
                <div className="flex justify-between text-xs">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>Coverage</span>
                  <span className={cn("font-semibold", L ? "text-slate-700" : "text-white")}>${p.coverage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>Premium</span>
                  <span className={cn("font-semibold", L ? "text-slate-700" : "text-white")}>${p.premium.toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>Expires</span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>{new Date(p.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Claims */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Recent Claims</h3>
          <div className="space-y-2">
            {(d?.claims || []).map((c: any) => (
              <div key={c.id} className={cn("flex items-center gap-4 p-3 rounded-lg border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <div className={cn("p-2 rounded-lg", c.status === "open" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                  {c.status === "open" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{c.description}</p>
                  <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{c.policyType} - {new Date(c.date).toLocaleDateString()}</p>
                </div>
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>${c.amount.toLocaleString()}</span>
                <Badge variant="outline" className={cn("text-xs", c.status === "open" ? "border-red-500/30 text-red-500" : "border-green-500/30 text-green-500")}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Drug & Alcohol
// ═══════════════════════════════════════════════════════════════════════════

function DrugAlcoholTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getDrugAlcoholCompliance?.useQuery?.({}) ?? { data: null, isLoading: true };
  const resultsQ = (trpc as any).trainingCompliance?.getTestResults?.useQuery?.({}) ?? { data: null, isLoading: false };
  const d = q.data;
  const results = resultsQ.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overall Compliance" value={`${d?.overallCompliance ?? 0}%`} icon={Shield} color="green" L={L} />
        <StatCard label="Random Pool Size" value={d?.randomPool?.totalInPool ?? 0} icon={Users} color="blue" L={L} />
        <StatCard label="Tests Remaining" value={d?.randomPool?.testsRemaining ?? 0} icon={Beaker} color="amber" L={L} />
        <StatCard label="Clearinghouse Queries Due" value={d?.clearinghouseStatus?.annualQueriesDue ?? 0} icon={Globe} color="cyan" L={L} />
      </div>

      {/* Random Testing Pool */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Random Testing Pool Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={L ? "text-slate-600" : "text-slate-300"}>Completed: {d?.randomPool?.testsCompleted} / {d?.randomPool?.testsRequired}</span>
              <span className={cn("font-semibold", L ? "text-slate-800" : "text-white")}>{d?.randomPool?.complianceRate}%</span>
            </div>
            <ProgressBar value={d?.randomPool?.testsCompleted ?? 0} max={d?.randomPool?.testsRequired ?? 1} color="blue" L={L} />
            <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>
              Next selection: {d?.randomPool?.nextSelectionDate ? new Date(d.randomPool.nextSelectionDate).toLocaleDateString() : "TBD"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pre-Employment", data: d?.preEmployment, icon: Users, color: "blue" },
          { label: "Post-Accident", data: d?.postAccident, icon: AlertTriangle, color: "red" },
          { label: "Reasonable Suspicion", data: d?.reasonableSuspicion, icon: Eye, color: "amber" },
          { label: "Return to Duty", data: d?.returnToDuty, icon: RefreshCw, color: "green" },
        ].map(cat => (
          <Card key={cat.label} className={cardCls}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("p-2 rounded-lg", L ? `bg-${cat.color}-50` : `bg-${cat.color}-900/30`)}>
                  <cat.icon className={cn("w-4 h-4", `text-${cat.color}-500`)} />
                </div>
                <h4 className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{cat.label}</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>Pending</span>
                  <span className={L ? "text-slate-700" : "text-white"}>{cat.data?.pending ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={L ? "text-slate-500" : "text-slate-400"}>Completed</span>
                  <span className={L ? "text-slate-700" : "text-white"}>{cat.data?.completed ?? cat.data?.active ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results */}
      {results && (
        <Card className={cardCls}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className={titleCls}>Recent Test Results</h3>
              <Badge variant="outline" className={cn("text-xs", "border-green-500/30 text-green-500")}>
                {results.summary?.complianceRate}% Pass Rate
              </Badge>
            </div>
            <div className="space-y-2">
              <div className={cn("grid grid-cols-5 gap-4 px-3 py-2 text-xs font-semibold", L ? "text-slate-500" : "text-slate-400")}>
                <span>Driver</span><span>Type</span><span>Date</span><span>Result</span><span>Collection Site</span>
              </div>
              {(results.results || []).slice(0, 10).map((r: any) => (
                <div key={r.id} className={cn("grid grid-cols-5 gap-4 px-3 py-2 rounded-lg text-sm", L ? "hover:bg-slate-50" : "hover:bg-slate-800/30")}>
                  <span className={L ? "text-slate-800" : "text-white"}>{r.driverName}</span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>{r.testType.replace("_", " ")}</span>
                  <span className={L ? "text-slate-500" : "text-slate-400"}>{new Date(r.testDate).toLocaleDateString()}</span>
                  <span className={r.result === "negative" ? "text-green-500" : "text-red-500"}>{r.result}</span>
                  <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{r.collectionSite}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Safety Scorecard
// ═══════════════════════════════════════════════════════════════════════════

function SafetyTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getSafetyScorecard?.useQuery?.({}) ?? { data: null, isLoading: true };
  const csaQ = (trpc as any).trainingCompliance?.getCsaAnalysis?.useQuery?.() ?? { data: null, isLoading: false };
  const d = q.data;
  const csa = csaQ.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Safety Rating" value={d?.overallSafetyRating ?? "N/A"} icon={Shield} color={d?.overallSafetyRating === "Satisfactory" ? "green" : "amber"} L={L} />
        <StatCard label="ISS Score" value={d?.issScore ?? 0} icon={Gauge} color={d?.issLevel === "Low" ? "green" : d?.issLevel === "Medium" ? "amber" : "red"} L={L} />
        <StatCard label="Total Inspections" value={d?.totalInspections ?? 0} icon={ClipboardCheck} color="blue" L={L} />
        <StatCard label="Clean Inspections" value={d?.cleanInspections ?? 0} icon={CheckCircle} color="green" L={L} />
        <StatCard label="OOS Rate" value={`${d?.outOfServiceRate ?? 0}%`} icon={XCircle} color={(d?.outOfServiceRate ?? 0) > (d?.nationalAvgOOSRate ?? 5.5) ? "red" : "green"} L={L} />
      </div>

      {/* CSA BASICs Visualization */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>CSA BASIC Scores</h3>
          <div className="space-y-4">
            {(d?.csaBasics || []).map((basic: any) => {
              const overThreshold = basic.score >= basic.threshold;
              const barColor = overThreshold ? "red" : basic.score > basic.threshold * 0.7 ? "amber" : "green";
              return (
                <div key={basic.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", L ? "text-slate-700" : "text-slate-200")}>{basic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", overThreshold ? "text-red-500" : "text-green-500")}>{basic.score}%</span>
                      <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>/ {basic.threshold}%</span>
                      {overThreshold && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      <Badge variant="outline" className={cn("text-xs",
                        basic.trend === "improving" ? "border-green-500/30 text-green-500" : basic.trend === "worsening" ? "border-red-500/30 text-red-500" : "border-slate-500/30 text-slate-500"
                      )}>
                        {basic.trend}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <ProgressBar value={basic.score} max={100} color={barColor} L={L} />
                    <div className="absolute top-0 h-2 border-r-2 border-dashed border-red-400" style={{ left: `${basic.threshold}%` }} />
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className={L ? "text-slate-400" : "text-slate-500"}>{basic.inspections} inspections</span>
                    <span className={L ? "text-slate-400" : "text-slate-500"}>{basic.violations} violations</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DataQs Recommendations */}
      {csa && csa.totalDataQsOpportunities > 0 && (
        <Card className={cardCls}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className={titleCls}>DataQs Challenge Opportunities</h3>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">{csa.totalDataQsOpportunities} opportunities</Badge>
            </div>
            <p className={cn("text-xs mb-3", L ? "text-slate-500" : "text-slate-400")}>
              Estimated score improvement: <span className="text-green-500 font-semibold">{csa.estimatedScoreImprovement} points</span>
            </p>
            <div className="space-y-2">
              {csa.basics.flatMap((b: any) => b.dataQsRecommendations).slice(0, 8).map((rec: any, i: number) => (
                <div key={i} className={cn("flex items-center gap-3 p-2 rounded-lg text-xs", L ? "bg-slate-50" : "bg-slate-800/30")}>
                  <RiskBadge level={rec.priority} L={L} />
                  <span className={L ? "text-slate-700" : "text-slate-300"}>{rec.reason}</span>
                  <span className="ml-auto text-green-500 font-semibold">-{rec.estimatedPointReduction} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Regulatory Changes
// ═══════════════════════════════════════════════════════════════════════════

function RegulatoryTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getRegulatoryChanges?.useQuery?.() ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  const statusColors: Record<string, string> = {
    proposed: "border-blue-500/30 text-blue-500",
    final_rule: "border-amber-500/30 text-amber-500",
    enacted: "border-green-500/30 text-green-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Changes" value={d?.summary?.total ?? 0} icon={Scale} color="blue" L={L} />
        <StatCard label="High Impact" value={d?.summary?.highImpact ?? 0} icon={AlertTriangle} color="red" L={L} />
        <StatCard label="Medium Impact" value={d?.summary?.mediumImpact ?? 0} icon={Zap} color="amber" L={L} />
        <StatCard label="Upcoming Deadlines" value={d?.summary?.upcomingDeadlines ?? 0} icon={Calendar} color="cyan" L={L} />
      </div>

      {/* Timeline */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <h3 className={cn(titleCls, "mb-4")}>Regulatory Change Timeline</h3>
          <div className="space-y-4">
            {(d?.changes || []).map((change: any) => (
              <div key={change.id} className={cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={change.impactLevel} L={L} />
                    <Badge variant="outline" className={cn("text-xs", statusColors[change.status] || statusColors.proposed)}>
                      {change.status.replace("_", " ")}
                    </Badge>
                    <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{change.agency}</span>
                  </div>
                  <span className={cn("text-xs font-mono", L ? "text-slate-500" : "text-slate-400")}>
                    {new Date(change.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
                <h4 className={cn("text-sm font-semibold mb-1", L ? "text-slate-800" : "text-white")}>{change.title}</h4>
                <p className={cn("text-xs mb-2", L ? "text-slate-500" : "text-slate-400")}>{change.description}</p>
                <div className={cn("flex items-start gap-2 p-2 rounded-lg text-xs", L ? "bg-blue-50" : "bg-blue-900/20")}>
                  <Zap className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                  <span className={L ? "text-blue-700" : "text-blue-300"}><strong>Action:</strong> {change.actionRequired}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Audit Prep
// ═══════════════════════════════════════════════════════════════════════════

function AuditTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const q = (trpc as any).trainingCompliance?.getAuditPreparation?.useQuery?.() ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  const readinessColor = (d?.overallReadiness ?? 0) >= 90 ? "green" : (d?.overallReadiness ?? 0) >= 70 ? "amber" : "red";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Audit Readiness" value={`${d?.overallReadiness ?? 0}%`} icon={ClipboardCheck} color={readinessColor} L={L} />
        <StatCard label="Complete Items" value={d?.completeItems ?? 0} icon={CheckCircle} color="green" L={L} />
        <StatCard label="Incomplete Items" value={d?.incompleteItems ?? 0} icon={XCircle} color="amber" L={L} />
        <StatCard label="Critical Missing" value={d?.criticalIncomplete ?? 0} icon={AlertTriangle} color="red" L={L} />
      </div>

      {/* Overall Progress */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className={titleCls}>Overall Readiness</h3>
            <span className={cn("text-lg font-bold", `text-${readinessColor}-500`)}>{d?.overallReadiness}%</span>
          </div>
          <ProgressBar value={d?.overallReadiness ?? 0} max={100} color={readinessColor} L={L} />
          {d?.lastAuditDate && (
            <p className={cn("text-xs mt-2", L ? "text-slate-400" : "text-slate-500")}>
              Last audit: {new Date(d.lastAuditDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      {(d?.categories || []).map((cat: any) => {
        const catComplete = cat.items.filter((i: any) => i.status === "complete").length;
        const catTotal = cat.items.length;
        return (
          <Card key={cat.name} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className={titleCls}>{cat.name}</h3>
                <span className={cn("text-xs font-semibold", L ? "text-slate-600" : "text-slate-300")}>
                  {catComplete}/{catTotal} complete
                </span>
              </div>
              <div className="space-y-2">
                {cat.items.map((item: any) => (
                  <div key={item.id} className={cn("flex items-center gap-3 p-2 rounded-lg", L ? "hover:bg-slate-50" : "hover:bg-slate-800/30")}>
                    {item.status === "complete" ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className={cn("w-4 h-4 shrink-0", item.priority === "critical" ? "text-red-500" : "text-amber-500")} />
                    )}
                    <span className={cn("text-sm flex-1", L ? "text-slate-700" : "text-slate-300")}>{item.item}</span>
                    <Badge variant="outline" className={cn("text-xs",
                      item.priority === "critical" ? "border-red-500/30 text-red-500" : item.priority === "high" ? "border-amber-500/30 text-amber-500" : "border-slate-500/30 text-slate-500"
                    )}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: DQ Files
// ═══════════════════════════════════════════════════════════════════════════

function CoursesTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const [selectedDriver, setSelectedDriver] = useState(1);
  const q = (trpc as any).trainingCompliance?.getDriverQualificationFile?.useQuery?.({ driverId: selectedDriver }) ?? { data: null, isLoading: true };
  const d = q.data;

  if (q.isLoading) return <LoadingGrid count={4} />;

  const statusIcon = (status: string) => {
    if (status === "on_file") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "missing" || status === "pending") return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === "expiring_soon" || status === "expired" || status === "overdue") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Driver Selector */}
      <div className="flex items-center gap-3">
        <span className={cn("text-sm", L ? "text-slate-600" : "text-slate-300")}>Driver ID:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(id => (
            <Button key={id} size="sm" variant={selectedDriver === id ? "default" : "outline"}
              onClick={() => setSelectedDriver(id)}
              className={cn(selectedDriver !== id && !L && "border-slate-700 text-slate-300 hover:bg-slate-800", selectedDriver === id && !L && "bg-blue-600 hover:bg-blue-700")}
            >
              #{id}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="DQ File Completeness" value={`${d?.completeness ?? 0}%`} icon={FileCheck} color={(d?.completeness ?? 0) >= 90 ? "green" : "amber"} L={L} />
        <StatCard label="Documents on File" value={d?.completeDocuments ?? 0} icon={CheckCircle} color="green" L={L} />
        <StatCard label="Missing Documents" value={d?.missingDocuments ?? 0} icon={XCircle} color="red" L={L} />
        <StatCard label="Expiring/Overdue" value={d?.expiringDocuments ?? 0} icon={AlertTriangle} color="amber" L={L} />
      </div>

      {/* Compliance Status */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={titleCls}>DQ File Status</h3>
            <Badge variant="outline" className={cn("text-xs", d?.isCompliant ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500")}>
              {d?.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
            </Badge>
          </div>
          <ProgressBar value={d?.completeness ?? 0} max={100} color={(d?.completeness ?? 0) >= 90 ? "green" : "amber"} L={L} />
          <div className="space-y-2 mt-4">
            {(d?.documents || []).map((doc: any) => (
              <div key={doc.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                {statusIcon(doc.status)}
                <div className="flex-1">
                  <p className={cn("text-sm", L ? "text-slate-800" : "text-white")}>{doc.name}</p>
                  {doc.notes && <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{doc.notes}</p>}
                </div>
                {doc.required && <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-500">Required</Badge>}
                <Badge variant="outline" className={cn("text-xs",
                  doc.status === "on_file" ? "border-green-500/30 text-green-500"
                    : doc.status === "missing" || doc.status === "pending" ? "border-red-500/30 text-red-500"
                    : doc.status === "not_applicable" ? "border-slate-500/30 text-slate-500"
                    : "border-amber-500/30 text-amber-500"
                )}>
                  {doc.status.replace("_", " ")}
                </Badge>
                {doc.expiryDate && (
                  <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>
                    {new Date(doc.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: IFTA/UCR/BOC Filings
// ═══════════════════════════════════════════════════════════════════════════

function FilingsTab({ cardCls, titleCls, subtitleCls, L }: TabProps) {
  const iftaQ = (trpc as any).trainingCompliance?.getIftaReporting?.useQuery?.({}) ?? { data: null, isLoading: true };
  const ucrQ = (trpc as any).trainingCompliance?.getUcrFiling?.useQuery?.() ?? { data: null, isLoading: false };
  const bocQ = (trpc as any).trainingCompliance?.getBocFiling?.useQuery?.() ?? { data: null, isLoading: false };
  const mcsQ = (trpc as any).trainingCompliance?.getMcsCleaning?.useQuery?.() ?? { data: null, isLoading: false };

  const ifta = iftaQ.data;
  const ucr = ucrQ.data;
  const boc = bocQ.data;
  const mcs = mcsQ.data;

  if (iftaQ.isLoading) return <LoadingGrid count={4} />;

  const filingStatusColor = (s: string) =>
    s === "filed" || s === "active" || s === "current" ? "text-green-500"
    : s === "due" || s === "due_soon" || s === "pending" || s === "needs_update" ? "text-amber-500"
    : s === "overdue" ? "text-red-500"
    : L ? "text-slate-500" : "text-slate-400";

  return (
    <div className="space-y-6">
      {/* Filing Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cardCls}>
          <CardContent className="p-4 text-center">
            <Landmark className={cn("w-6 h-6 mx-auto mb-2", L ? "text-blue-600" : "text-blue-400")} />
            <h4 className={cn("text-sm font-semibold mb-1", L ? "text-slate-800" : "text-white")}>IFTA</h4>
            <p className={cn("text-xs", filingStatusColor(ifta?.quarters?.[2]?.filingStatus || ""))}>
              Q{ifta?.quarters?.[2]?.quarter}: {ifta?.quarters?.[2]?.filingStatus || "N/A"}
            </p>
            <p className={cn("text-xs mt-1", L ? "text-slate-500" : "text-slate-400")}>
              Net Tax: ${ifta?.summary?.totalTaxDue?.toLocaleString() ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardContent className="p-4 text-center">
            <FileText className={cn("w-6 h-6 mx-auto mb-2", L ? "text-purple-600" : "text-purple-400")} />
            <h4 className={cn("text-sm font-semibold mb-1", L ? "text-slate-800" : "text-white")}>UCR</h4>
            <p className={cn("text-xs", filingStatusColor(ucr?.status || ""))}>{ucr?.status || "N/A"}</p>
            <p className={cn("text-xs mt-1", L ? "text-slate-500" : "text-slate-400")}>Fee: ${ucr?.fee ?? 0}</p>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardContent className="p-4 text-center">
            <Globe className={cn("w-6 h-6 mx-auto mb-2", L ? "text-cyan-600" : "text-cyan-400")} />
            <h4 className={cn("text-sm font-semibold mb-1", L ? "text-slate-800" : "text-white")}>BOC-3</h4>
            <p className={cn("text-xs", filingStatusColor(boc?.status || ""))}>{boc?.status?.replace("_", " ") || "N/A"}</p>
            <p className={cn("text-xs mt-1", L ? "text-slate-500" : "text-slate-400")}>{boc?.processAgent?.name ?? ""}</p>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardContent className="p-4 text-center">
            <Truck className={cn("w-6 h-6 mx-auto mb-2", L ? "text-green-600" : "text-green-400")} />
            <h4 className={cn("text-sm font-semibold mb-1", L ? "text-slate-800" : "text-white")}>MCS-150</h4>
            <p className={cn("text-xs", filingStatusColor(mcs?.status || ""))}>{mcs?.status?.replace("_", " ") || "N/A"}</p>
            <p className={cn("text-xs mt-1", L ? "text-slate-500" : "text-slate-400")}>
              {mcs?.daysUntilDue != null ? `${mcs.daysUntilDue} days until due` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* IFTA Quarterly Detail */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={titleCls}>IFTA Quarterly Reporting - {ifta?.year}</h3>
            <div className="flex gap-3 text-xs">
              <span className={L ? "text-slate-500" : "text-slate-400"}>Total Miles: <strong className={L ? "text-slate-800" : "text-white"}>{ifta?.summary?.totalMiles?.toLocaleString()}</strong></span>
              <span className={L ? "text-slate-500" : "text-slate-400"}>MPG: <strong className={L ? "text-slate-800" : "text-white"}>{ifta?.summary?.mpg}</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(ifta?.quarters || []).map((quarter: any) => (
              <div key={quarter.quarter} className={cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Q{quarter.quarter}</h4>
                  <Badge variant="outline" className={cn("text-xs",
                    quarter.filingStatus === "filed" ? "border-green-500/30 text-green-500"
                    : quarter.filingStatus === "due" ? "border-amber-500/30 text-amber-500"
                    : "border-slate-500/30 text-slate-500"
                  )}>
                    {quarter.filingStatus}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className={L ? "text-slate-500" : "text-slate-400"}>Miles</span>
                    <span className={L ? "text-slate-700" : "text-white"}>{quarter.totalMiles.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={L ? "text-slate-500" : "text-slate-400"}>Gallons</span>
                    <span className={L ? "text-slate-700" : "text-white"}>{quarter.totalGallons.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={L ? "text-slate-500" : "text-slate-400"}>Net Tax</span>
                    <span className={cn("font-semibold", quarter.netTaxDue >= 0 ? "text-red-500" : "text-green-500")}>${quarter.netTaxDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={L ? "text-slate-500" : "text-slate-400"}>Due</span>
                    <span className={L ? "text-slate-600" : "text-slate-300"}>{quarter.dueDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MCS-150 Detail */}
      {mcs && (
        <Card className={cardCls}>
          <CardContent className="p-5">
            <h3 className={cn(titleCls, "mb-4")}>MCS-150 Biennial Update</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>DOT Number</span>
                <p className={cn("font-mono font-semibold", L ? "text-slate-800" : "text-white")}>{mcs.dotNumber}</p>
              </div>
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>Last Filed</span>
                <p className={L ? "text-slate-700" : "text-slate-200"}>{new Date(mcs.lastFiledDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>Next Due</span>
                <p className={cn("font-semibold", mcs.daysUntilDue < 0 ? "text-red-500" : mcs.daysUntilDue < 90 ? "text-amber-500" : "text-green-500")}>
                  {new Date(mcs.nextDueDate).toLocaleDateString()} ({mcs.daysUntilDue}d)
                </p>
              </div>
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>Fleet Size</span>
                <p className={L ? "text-slate-700" : "text-slate-200"}>{mcs.currentData.fleetSize} vehicles</p>
              </div>
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>Drivers</span>
                <p className={L ? "text-slate-700" : "text-slate-200"}>{mcs.currentData.driversCount}</p>
              </div>
              <div>
                <span className={L ? "text-slate-500" : "text-slate-400"}>Annual Mileage</span>
                <p className={L ? "text-slate-700" : "text-slate-200"}>{mcs.currentData.mileage.toLocaleString()}</p>
              </div>
            </div>
            <p className={cn("text-xs mt-3 p-2 rounded-lg", L ? "bg-amber-50 text-amber-700" : "bg-amber-900/20 text-amber-400")}>
              {mcs.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
