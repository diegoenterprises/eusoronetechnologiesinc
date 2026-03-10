/**
 * REPORTING ENGINE — Comprehensive Reporting & Analytics Center
 * Custom report builder, scheduled reports, executive dashboards,
 * operational analytics, benchmark reporting, data export, regulatory reports.
 * 100% Dynamic | Dark theme with indigo/blue analytics accents
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart3, TrendingUp, DollarSign, Package, Truck, Users, ShieldCheck,
  FileText, Calendar, Download, ArrowUpRight, ArrowDownRight, Activity,
  Target, Clock, Award, Search, Star, Play, Settings, Mail,
  PieChart, AlertTriangle, GraduationCap, Route, Scale,
  Table, LayoutGrid, Filter, Plus, Bell, Share2, Eye,
  ChevronRight, CheckCircle, XCircle, Loader2, FileSpreadsheet,
  Bookmark, History, Gauge, Zap, Building2, ClipboardCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportTab =
  | "dashboard"
  | "catalog"
  | "executive"
  | "operational"
  | "financial"
  | "safety"
  | "compliance"
  | "driver"
  | "fleet"
  | "lane"
  | "customer"
  | "benchmark"
  | "trends"
  | "builder"
  | "scheduled"
  | "alerts"
  | "history";

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  change,
  target,
  icon: Icon,
  format = "number",
}: {
  label: string;
  value: number;
  change?: number;
  target?: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percent";
}) {
  const formatted =
    format === "currency"
      ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : value.toLocaleString();

  const isPositive = (change ?? 0) >= 0;
  const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;
  const progress = target && target > 0 ? Math.min(100, (value / target) * 100) : undefined;

  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 hover:border-indigo-300" : "bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/30"} transition-all`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Icon className="h-5 w-5 text-indigo-400" />
          </div>
          {change !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                isPositive
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-red-400 border-red-500/30 bg-red-500/10",
              )}
            >
              <Arrow className="h-3 w-3 mr-0.5" />
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} mb-1`}>{formatted}</p>
        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
        {progress !== undefined && (
          <div className="mt-3">
            <div className={`flex justify-between text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"} mb-1`}>
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className={`h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-700"} [&>div]:bg-indigo-500`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
      <div>
        <h2 className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{title}</h2>
        {description && <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} mt-0.5`}>{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-16 ${isLight ? "bg-slate-200" : "bg-slate-700/50"} rounded-xl`} />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Icon className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatNumber(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ---------------------------------------------------------------------------
// Tab Content Components
// ---------------------------------------------------------------------------

/** Dashboard Tab */
function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getReportsDashboard?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const d = data ?? { recentReports: [], scheduledReports: [], favorites: [], stats: { totalLoads: 0, totalRevenue: 0, activeDrivers: 0, activeVehicles: 0 } };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Loads" value={d.stats.totalLoads} icon={Package} />
        <KpiCard label="Total Revenue" value={d.stats.totalRevenue} icon={DollarSign} format="currency" />
        <KpiCard label="Active Drivers" value={d.stats.activeDrivers} icon={Users} />
        <KpiCard label="Active Vehicles" value={d.stats.activeVehicles} icon={Truck} />
      </div>

      {/* Favorites */}
      <div>
        <SectionHeader title="Favorites" description="Quick access to your most-used reports" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {d.favorites.map((f: any) => (
            <Card key={f.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} hover:border-indigo-500/40 cursor-pointer transition-all group`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <Star className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"} truncate`}>{f.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{f.type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <SectionHeader title="Recent Reports" description="Reports you have run recently" />
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {d.recentReports.map((r: any) => (
                <div key={r.id} className={`flex items-center justify-between px-5 py-3.5 ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-blue-500/10">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{r.name}</p>
                      <p className="text-xs text-slate-500">{new Date(r.ranAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"} uppercase`}>{r.format}</Badge>
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <div>
        <SectionHeader title="Scheduled Reports" description="Upcoming automated report deliveries" />
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {d.scheduledReports.map((s: any) => (
                <div key={s.id} className={`flex items-center justify-between px-5 py-3.5 ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-violet-500/10">
                      <Calendar className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{s.name}</p>
                      <p className="text-xs text-slate-500">Next run: {new Date(s.nextRun).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"} capitalize`}>{s.frequency}</Badge>
                    <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      {s.recipients}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Catalog Tab */
function CatalogTab({ onSelectReport }: { onSelectReport: (tab: ReportTab) => void }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const { data, isLoading } = (trpc as any).reportingEngine?.getReportCatalog?.useQuery?.({ search }) ?? { data: null, isLoading: false };

  const categoryIcons: Record<string, React.ElementType> = {
    executive: BarChart3,
    operational: Activity,
    financial: DollarSign,
    safety: ShieldCheck,
    compliance: ClipboardCheck,
    fleet: Truck,
    driver: Users,
    lane: Route,
    customer: Building2,
    benchmark: Scale,
  };

  const categoryTabs: Record<string, ReportTab> = {
    executive: "executive",
    operational: "operational",
    financial: "financial",
    safety: "safety",
    compliance: "compliance",
    fleet: "fleet",
    driver: "driver",
    lane: "lane",
    customer: "customer",
    benchmark: "benchmark",
  };

  const categories = data ?? [];

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`pl-10 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-800/50 border-slate-700/50 text-white"} placeholder:text-slate-500 focus:border-indigo-500/50`}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid gap-6">
          {(categories as any[]).map((cat: any) => {
            const CatIcon = categoryIcons[cat.category] || FileText;
            return (
              <div key={cat.category}>
                <div
                  className="flex items-center gap-2 mb-3 cursor-pointer group"
                  onClick={() => onSelectReport(categoryTabs[cat.category] || "dashboard")}
                >
                  <CatIcon className="h-5 w-5 text-indigo-400" />
                  <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"} group-hover:text-indigo-300 transition-colors`}>{cat.label}</h3>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mb-3">{cat.description}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.reports.map((r: any) => (
                    <Card
                      key={r.id}
                      className={`${isLight ? "bg-white border-slate-200 hover:border-indigo-300" : "bg-slate-800/40 border-slate-700/40 hover:border-indigo-500/40"} cursor-pointer transition-all group/card`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 group-hover/card:bg-indigo-500/20 transition-colors shrink-0">
                            <FileText className="h-4 w-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"} truncate`}>{r.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Executive Summary Tab */
function ExecutiveTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getExecutiveSummary?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <EmptyState icon={BarChart3} message="No executive data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Executive Summary" description="High-level KPIs and performance overview" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue" value={d.revenue.current} change={d.revenue.change} target={d.revenue.target} icon={DollarSign} format="currency" />
        <KpiCard label="Loads" value={d.loads.current} change={d.loads.change} target={d.loads.target} icon={Package} />
        <KpiCard label="Margin %" value={d.margin.current} change={d.margin.change} target={d.margin.target} icon={TrendingUp} format="percent" />
        <KpiCard label="Fleet Utilization" value={d.fleetUtilization.current} change={d.fleetUtilization.change} target={d.fleetUtilization.target} icon={Truck} format="percent" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Avg Rate/Mile</p>
            <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>${d.avgRatePerMile.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>On-Time Delivery</p>
            <p className="text-lg font-bold text-emerald-400">{d.onTimeDeliveryPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Empty Miles</p>
            <p className="text-lg font-bold text-amber-400">{d.emptyMilesPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Revenue Trend</p>
            <p className="text-lg font-bold text-indigo-400">{d.revenueByMonth.length} mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Month (simple bar visualization) */}
      {d.revenueByMonth.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {d.revenueByMonth.map((m: any, i: number) => {
                const maxRev = Math.max(...d.revenueByMonth.map((x: any) => x.revenue), 1);
                const h = (m.revenue / maxRev) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500">{formatCurrency(m.revenue)}</span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-blue-500 transition-all hover:from-indigo-500 hover:to-blue-400"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-500">{m.month.split("-")[1]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Operational Metrics Tab */
function OperationalTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getOperationalMetrics?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <EmptyState icon={Activity} message="No operational data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Operational Metrics" description="Day-to-day operational performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="On-Time Pickup" value={d.onTimePickupPct} icon={Clock} format="percent" />
        <KpiCard label="On-Time Delivery" value={d.onTimeDeliveryPct} icon={CheckCircle} format="percent" />
        <KpiCard label="Avg Transit Days" value={d.avgTransitDays} icon={Truck} />
        <KpiCard label="Loads/Day" value={d.loadsPerDay} icon={Package} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Empty Miles %</p>
            <p className="text-lg font-bold text-amber-400">{d.emptyMilesPct}%</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Avg Dwell Time</p>
            <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{d.avgDwellTimeMin} min</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Tender Accept %</p>
            <p className="text-lg font-bold text-emerald-400">{d.tenderAcceptancePct}%</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-4">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Claims Ratio</p>
            <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{d.claimsRatio}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Load Status Breakdown */}
      {d.loadsByStatus.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Loads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {d.loadsByStatus.map((s: any) => (
                <div key={s.status} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
                  <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{s.count}</p>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} capitalize`}>{s.status?.replace(/_/g, " ") || "Unknown"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Breakdown */}
      {d.loadsByEquipment.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Loads by Equipment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.loadsByEquipment.map((e: any) => {
                const maxCount = Math.max(...d.loadsByEquipment.map((x: any) => x.count), 1);
                const pctVal = (e.count / maxCount) * 100;
                return (
                  <div key={e.equipment} className="flex items-center gap-3">
                    <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} w-24 truncate`}>{e.equipment || "Unknown"}</span>
                    <div className={`flex-1 h-5 ${isLight ? "bg-slate-200" : "bg-slate-700/40"} rounded overflow-hidden`}>
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded"
                        style={{ width: `${pctVal}%` }}
                      />
                    </div>
                    <span className={`text-xs ${isLight ? "text-slate-900" : "text-white"} font-medium w-12 text-right`}>{e.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Financial Reports Tab */
function FinancialTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getFinancialReports?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <EmptyState icon={DollarSign} message="No financial data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Financial Reports" description="Revenue, expenses, and profitability" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-5">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(d.summary.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-5">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Total Expenses</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(d.summary.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardContent className="p-5">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Net Income</p>
            <p className={cn("text-2xl font-bold", d.summary.netIncome >= 0 ? "text-emerald-400" : "text-red-400")}>
              {formatCurrency(d.summary.netIncome)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Line Items */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-700/50">
            {d.lineItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      item.category === "Revenue"
                        ? "text-emerald-400 border-emerald-500/30"
                        : "text-red-400 border-red-500/30",
                    )}
                  >
                    {item.category}
                  </Badge>
                  <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{item.label}</span>
                </div>
                <span className={cn("text-sm font-medium", item.amount >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {item.amount >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AR Aging */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Accounts Receivable Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Current", value: d.arAging.current, color: "text-emerald-400" },
              { label: "30 Days", value: d.arAging.thirtyDays, color: "text-yellow-400" },
              { label: "60 Days", value: d.arAging.sixtyDays, color: "text-amber-400" },
              { label: "90 Days", value: d.arAging.ninetyDays, color: "text-orange-400" },
              { label: "90+ Days", value: d.arAging.overNinety, color: "text-red-400" },
            ].map((bucket) => (
              <div key={bucket.label} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
                <p className={cn("text-lg font-bold", bucket.color)}>{formatCurrency(bucket.value)}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{bucket.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Safety Reports Tab */
function SafetyTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getSafetyReports?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (!data) return <EmptyState icon={ShieldCheck} message="No safety data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Safety Reports" description="Accidents, violations, CSA scores, and inspections" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Accidents" value={d.accidentCount} icon={AlertTriangle} />
        <KpiCard label="Violations" value={d.violationCount} icon={XCircle} />
        <KpiCard label="Inspections" value={d.inspectionCount} icon={ClipboardCheck} />
      </div>

      {/* CSA Scores */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>CSA BASIC Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(d.csaScores).map(([key, value]) => {
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const numVal = Number(value);
              const threshold = 65;
              const pctVal = Math.min(100, (numVal / threshold) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{label}</span>
                    <span className={cn("font-medium", numVal > 50 ? "text-red-400" : numVal > 30 ? "text-amber-400" : "text-emerald-400")}>
                      {numVal.toFixed(1)}
                    </span>
                  </div>
                  <div className={`h-2 ${isLight ? "bg-slate-200" : "bg-slate-700/50"} rounded-full overflow-hidden`}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        numVal > 50 ? "bg-red-500" : numVal > 30 ? "bg-amber-500" : "bg-emerald-500",
                      )}
                      style={{ width: `${pctVal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inspection Results */}
      {d.inspectionResults.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Inspection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {d.inspectionResults.map((r: any) => (
                <div key={r.result} className={`p-4 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
                  <p className={cn("text-2xl font-bold", r.result === "passed" ? "text-emerald-400" : "text-red-400")}>
                    {r.count}
                  </p>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} capitalize`}>{r.result}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Compliance Tab */
function ComplianceTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getComplianceReports?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (!data) return <EmptyState icon={ClipboardCheck} message="No compliance data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Compliance Reports" description="HOS violations, drug testing, training status" />

      {/* HOS Violations */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>HOS Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {d.hosViolations.byType.map((v: any) => (
              <div key={v.type} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
                <p className={cn("text-xl font-bold", v.count > 0 ? "text-red-400" : "text-emerald-400")}>{v.count}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drug Testing */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Drug & Alcohol Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
              <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{d.drugTesting.totalDrivers}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Drivers</p>
            </div>
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
              <p className="text-xl font-bold text-blue-400">{d.drugTesting.testedThisQuarter}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Tested (Quarter)</p>
            </div>
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
              <p className="text-xl font-bold text-amber-400">{d.drugTesting.pendingTests}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Pending</p>
            </div>
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
              <p className={cn("text-xl font-bold", d.drugTesting.positiveResults > 0 ? "text-red-400" : "text-emerald-400")}>
                {d.drugTesting.positiveResults}
              </p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Positive</p>
            </div>
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"} text-center`}>
              <p className="text-xl font-bold text-emerald-400">{d.drugTesting.compliancePct}%</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Compliance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Training Compliance</CardTitle>
            <Badge variant="outline" className={cn("text-xs", d.training.compliancePct >= 90 ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30")}>
              {d.training.compliancePct}% Compliant
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={d.training.compliancePct} className={`h-3 ${isLight ? "bg-slate-200" : "bg-slate-700"} [&>div]:bg-emerald-500 mb-3`} />
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{d.training.totalRequired}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Required</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">{d.training.completed}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Completed</p>
            </div>
            <div className="text-center">
              <p className={cn("text-lg font-bold", d.training.overdue > 0 ? "text-red-400" : "text-emerald-400")}>{d.training.overdue}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Expiry */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Document Expiry Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
              <p className="text-xl font-bold text-emerald-400">{d.documentExpiry.upToDate}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Up to Date</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <p className="text-xl font-bold text-amber-400">{d.documentExpiry.expiringSoon}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Expiring Soon</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <p className="text-xl font-bold text-red-400">{d.documentExpiry.expired}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Expired</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Driver Performance Tab */
function DriverTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getDriverPerformanceReport?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data || data.drivers.length === 0) return <EmptyState icon={Users} message="No driver data available" />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Driver Performance Ranking"
        description={`${data.totalDrivers} active drivers ranked by multi-factor scoring`}
      />

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} overflow-hidden`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-800/80"}`}>
                  <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Rank</th>
                  <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Driver</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Overall</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Safety</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Efficiency</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Reliability</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Loads</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Revenue</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>On-Time %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.drivers.map((d: any, i: number) => (
                  <tr key={d.id} className={`${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-bold",
                        i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500",
                      )}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{d.name || `Driver #${d.id}`}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={cn(
                        "text-xs font-bold",
                        d.overallScore >= 90 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : d.overallScore >= 75 ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10",
                      )}>
                        {d.overallScore}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>{d.safetyScore}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>{d.efficiencyScore}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>{d.reliabilityScore}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>{d.loadCount}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(d.revenue)}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>{d.onTimePct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Fleet Utilization Tab */
function FleetTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getFleetUtilizationReport?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!data) return <EmptyState icon={Truck} message="No fleet data available" />;

  const d = data;

  return (
    <div className="space-y-8">
      <SectionHeader title="Fleet Utilization" description="Revenue miles vs dead miles analysis" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Avg Utilization" value={d.summary.avgUtilization} icon={Gauge} format="percent" />
        <KpiCard label="Revenue Miles" value={d.summary.totalRevenueMiles} icon={TrendingUp} />
        <KpiCard label="Dead Miles" value={d.summary.totalDeadMiles} icon={ArrowDownRight} />
        <KpiCard label="Total Vehicles" value={d.summary.totalVehicles} icon={Truck} />
      </div>

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} overflow-hidden`}>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-800/80"} sticky top-0 z-10`}>
                  <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Unit</th>
                  <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Type</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Rev. Miles</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Dead Miles</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Utilization</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>$/Mile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {d.vehicles.map((v: any) => (
                  <tr key={v.id} className={`${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                    <td className={`px-4 py-3 ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{v.unitNumber}</td>
                    <td className={`px-4 py-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.type}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{v.revenueMiles.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-400">{v.deadMiles.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        v.utilization >= 85 ? "text-emerald-400 border-emerald-500/30"
                          : v.utilization >= 70 ? "text-blue-400 border-blue-500/30"
                          : "text-amber-400 border-amber-500/30",
                      )}>
                        {v.utilization.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>${v.revenuePerMile.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/** Lane Analysis Tab */
function LaneTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getLaneAnalysisReport?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!data || data.lanes.length === 0) return <EmptyState icon={Route} message="No lane data available" />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Lane Analysis" description={`${data.totalLanes} lanes with profitability data`} />

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} overflow-hidden`}>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-800/80"} sticky top-0 z-10`}>
                  <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Lane</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Loads</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Revenue</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Avg Rate</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>$/Mile</th>
                  <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.lanes.map((l: any, i: number) => (
                  <tr key={i} className={`${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                    <td className="px-4 py-3">
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium text-xs`}>{l.lane}</p>
                    </td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>{l.loadCount}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(l.totalRevenue)}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>${l.avgRate.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>${l.avgRatePerMile.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        l.estimatedMargin >= 15 ? "text-emerald-400 border-emerald-500/30"
                          : l.estimatedMargin >= 10 ? "text-blue-400 border-blue-500/30"
                          : "text-amber-400 border-amber-500/30",
                      )}>
                        {l.estimatedMargin.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/** Customer Report Tab */
function CustomerTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getCustomerReport?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!data || data.customers.length === 0) return <EmptyState icon={Building2} message="No customer data available" />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Customer Performance" description={`${data.totalCustomers} customers analyzed`} />

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} overflow-hidden`}>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-800/80"}`}>
                <th className={`text-left text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Customer ID</th>
                <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Loads</th>
                <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Revenue</th>
                <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Avg Rate</th>
                <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>On-Time %</th>
                <th className={`text-right text-xs ${isLight ? "text-slate-500" : "text-slate-400"} font-medium px-4 py-3`}>Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {data.customers.map((c: any) => (
                <tr key={c.customerId} className={`${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                  <td className={`px-4 py-3 ${isLight ? "text-slate-900" : "text-white"} font-medium`}>#{c.customerId}</td>
                  <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>{c.loadCount}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(c.totalRevenue)}</td>
                  <td className={`px-4 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>${c.avgRate.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right ${isLight ? "text-slate-600" : "text-slate-300"}`}>{c.onTimePct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      c.estimatedMargin >= 15 ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30",
                    )}>
                      {c.estimatedMargin.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/** Benchmark Tab */
function BenchmarkTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getBenchmarkReport?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <EmptyState icon={Scale} message="No benchmark data available" />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Industry Benchmarks" description="Compare your performance against industry standards" />

      <div className="grid gap-4">
        {data.benchmarks.map((b: any, i: number) => (
          <Card key={i} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{b.metric}</h4>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  b.percentile >= 75 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : b.percentile >= 50 ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                    : b.percentile >= 25 ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : "text-red-400 border-red-500/30 bg-red-500/10",
                )}>
                  {b.percentile}th percentile
                </Badge>
              </div>
              <div className={`h-3 ${isLight ? "bg-slate-200" : "bg-slate-700/50"} rounded-full overflow-hidden mb-3`}>
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    b.percentile >= 75 ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : b.percentile >= 50 ? "bg-gradient-to-r from-blue-600 to-blue-400"
                      : b.percentile >= 25 ? "bg-gradient-to-r from-amber-600 to-amber-400"
                      : "bg-gradient-to-r from-red-600 to-red-400",
                  )}
                  style={{ width: `${b.percentile}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Yours</p>
                  <p className="text-sm font-bold text-white">{typeof b.yours === "number" ? formatNumber(b.yours) : b.yours}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Industry Avg</p>
                  <p className={`text-sm font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>{typeof b.industryAvg === "number" ? formatNumber(b.industryAvg) : b.industryAvg}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Top 25%</p>
                  <p className="text-sm font-medium text-indigo-400">{typeof b.top25 === "number" ? formatNumber(b.top25) : b.top25}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Trend Analysis Tab */
function TrendsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [metric, setMetric] = useState<string>("revenue");
  const [granularity, setGranularity] = useState<string>("day");

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }, []);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data, isLoading } = (trpc as any).reportingEngine?.getTrendAnalysis?.useQuery?.({
    metric,
    dateRange: { startDate: thirtyDaysAgo, endDate: today },
    granularity,
  }) ?? { data: null, isLoading: false };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trend Analysis"
        description="Analyze trends across key metrics"
        actions={
          <div className="flex items-center gap-2">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className={`w-48 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-800/50 border-slate-700/50 text-white"} text-sm`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-700"}>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="loads_per_day">Loads/Day</SelectItem>
                <SelectItem value="margin">Margin</SelectItem>
                <SelectItem value="on_time_pct">On-Time %</SelectItem>
                <SelectItem value="empty_miles_pct">Empty Miles %</SelectItem>
                <SelectItem value="fleet_utilization">Fleet Utilization</SelectItem>
                <SelectItem value="dwell_time_min">Dwell Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className={`w-32 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-800/50 border-slate-700/50 text-white"} text-sm`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-700"}>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
              <CardContent className="p-4">
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Average</p>
                <p className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{formatNumber(data.summary.avg)}</p>
              </CardContent>
            </Card>
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
              <CardContent className="p-4">
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Minimum</p>
                <p className="text-lg font-bold text-red-400">{formatNumber(data.summary.min)}</p>
              </CardContent>
            </Card>
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
              <CardContent className="p-4">
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Maximum</p>
                <p className="text-lg font-bold text-emerald-400">{formatNumber(data.summary.max)}</p>
              </CardContent>
            </Card>
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
              <CardContent className="p-4">
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>Trend</p>
                <div className="flex items-center gap-1">
                  {data.summary.trend === "up" && <ArrowUpRight className="h-5 w-5 text-emerald-400" />}
                  {data.summary.trend === "down" && <ArrowDownRight className="h-5 w-5 text-red-400" />}
                  {data.summary.trend === "flat" && <Activity className="h-5 w-5 text-slate-400" />}
                  <p className={cn(
                    "text-lg font-bold capitalize",
                    data.summary.trend === "up" ? "text-emerald-400" : data.summary.trend === "down" ? "text-red-400" : "text-slate-400",
                  )}>
                    {data.summary.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart (simple bar) */}
          {data.dataPoints.length > 0 && (
            <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
              <CardContent className="p-5">
                <div className="flex items-end gap-px h-48 overflow-hidden">
                  {data.dataPoints.slice(-60).map((dp: any, i: number) => {
                    const maxVal = Math.max(...data.dataPoints.map((d: any) => d.value), 1);
                    const h = (dp.value / maxVal) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 min-w-[3px] bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t hover:from-indigo-500 hover:to-blue-300 transition-colors"
                        style={{ height: `${Math.max(h, 2)}%` }}
                        title={`${dp.period}: ${formatNumber(dp.value)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500">{data.dataPoints[0]?.period}</span>
                  <span className="text-[10px] text-slate-500">{data.dataPoints[data.dataPoints.length - 1]?.period}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <EmptyState icon={TrendingUp} message="Select a metric and date range to see trends" />
      )}
    </div>
  );
}

/** Report Builder Tab */
function BuilderTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [name, setName] = useState("");
  const [dataSource, setDataSource] = useState("loads");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const { data: dictionary } = (trpc as any).reportingEngine?.getDataDictionary?.useQuery?.({}) ?? { data: null };

  const fields = dictionary?.[dataSource] ?? [];

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Custom Report Builder" description="Build your own report by selecting data source and fields" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} block mb-1`}>Report Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Custom Report"
                  className={`${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-700/50 border-slate-600/50 text-white"} placeholder:text-slate-500`}
                />
              </div>
              <div>
                <label className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} block mb-1`}>Data Source</label>
                <Select value={dataSource} onValueChange={(v) => { setDataSource(v); setSelectedFields([]); }}>
                  <SelectTrigger className={isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-700/50 border-slate-600/50 text-white"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-700"}>
                    <SelectItem value="loads">Loads</SelectItem>
                    <SelectItem value="drivers">Drivers</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="inspections">Inspections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className={isLight ? "bg-slate-200" : "bg-slate-700/50"} />
              <div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-2`}>Selected: {selectedFields.length} fields</p>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  disabled={!name || selectedFields.length === 0}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Field Selector */}
        <div className="lg:col-span-2">
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>Available Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {fields.map((f: any) => {
                  const isSelected = selectedFields.includes(f.key);
                  return (
                    <div
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer border transition-all",
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20"
                          : "bg-slate-700/20 border-slate-700/40 hover:border-slate-600",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className={cn("text-sm font-medium", isSelected ? "text-indigo-300" : "text-white")}>{f.label}</p>
                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-600">{f.type}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{f.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Scheduled Reports Tab */
function ScheduledTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getScheduledReports?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const schedules = data?.schedules ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Scheduled Reports"
        description="Manage recurring report deliveries"
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-3 w-3 mr-1" />
            New Schedule
          </Button>
        }
      />

      <div className="grid gap-4">
        {schedules.map((s: any) => (
          <Card key={s.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Calendar className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"} capitalize`}>{s.frequency}</Badge>
                      <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"} uppercase`}>{s.format}</Badge>
                      <span className="text-xs text-slate-500">
                        <Mail className="h-3 w-3 inline mr-0.5" />
                        {s.recipients.length} recipients
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Next: {new Date(s.nextRun).toLocaleDateString()}</span>
                      {s.lastRun && <span>Last: {new Date(s.lastRun).toLocaleDateString()}</span>}
                      {s.lastStatus && (
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          s.lastStatus === "completed" ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30",
                        )}>
                          {s.lastStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.enabled} className="data-[state=checked]:bg-indigo-500" />
                  <Button variant="ghost" size="sm" className={isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** KPI Alerts Tab */
function AlertsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getKpiAlerts?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const alerts = data?.alerts ?? [];

  const metricLabels: Record<string, string> = {
    on_time_pct: "On-Time %",
    empty_miles_pct: "Empty Miles %",
    revenue: "Revenue",
    csa_score: "CSA Score",
    dwell_time_min: "Dwell Time",
    margin: "Margin %",
    fleet_utilization: "Fleet Utilization",
    loads_per_day: "Loads/Day",
    avg_rate_per_mile: "Avg Rate/Mile",
    accidents_count: "Accidents",
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="KPI Alert Configuration"
        description="Set alerts when key metrics cross thresholds"
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-3 w-3 mr-1" />
            New Alert
          </Button>
        }
      />

      <div className="grid gap-4">
        {alerts.map((a: any) => (
          <Card key={a.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    a.enabled ? "bg-amber-500/10" : "bg-slate-700/30",
                  )}>
                    <Bell className={cn("h-5 w-5", a.enabled ? "text-amber-400" : "text-slate-500")} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>
                      {metricLabels[a.metric] || a.metric} {a.direction === "above" ? ">" : "<"} {a.threshold}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Alert when {metricLabels[a.metric] || a.metric} goes {a.direction} {a.threshold}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        <Mail className="h-3 w-3 inline mr-0.5" />
                        {a.recipients.length} recipient{a.recipients.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <Switch checked={a.enabled} className="data-[state=checked]:bg-amber-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Report History Tab */
function HistoryTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = (trpc as any).reportingEngine?.getReportHistory?.useQuery?.({}) ?? { data: null, isLoading: false };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const history = data?.history ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Report History" description="Previously generated reports" />

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} overflow-hidden`}>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700/50">
            {history.map((h: any) => (
              <div key={h.id} className={`flex items-center justify-between px-5 py-3.5 ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/20"} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-blue-500/10">
                    <History className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{h.reportName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{new Date(h.generatedAt).toLocaleString()}</span>
                      <span className="text-xs text-slate-500">{h.rowCount} rows</span>
                      <span className="text-xs text-slate-500">{h.fileSize}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500 border-slate-300" : "text-slate-400 border-slate-600"} uppercase`}>{h.format}</Badge>
                  <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className={isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const TABS: { key: ReportTab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "catalog", label: "Catalog", icon: FileText },
  { key: "executive", label: "Executive", icon: BarChart3 },
  { key: "operational", label: "Operations", icon: Activity },
  { key: "financial", label: "Financial", icon: DollarSign },
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "compliance", label: "Compliance", icon: ClipboardCheck },
  { key: "driver", label: "Drivers", icon: Users },
  { key: "fleet", label: "Fleet", icon: Truck },
  { key: "lane", label: "Lanes", icon: Route },
  { key: "customer", label: "Customers", icon: Building2 },
  { key: "benchmark", label: "Benchmarks", icon: Scale },
  { key: "trends", label: "Trends", icon: TrendingUp },
  { key: "builder", label: "Builder", icon: Zap },
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "history", label: "History", icon: History },
];

export default function ReportingEngine() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<ReportTab>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "catalog": return <CatalogTab onSelectReport={setActiveTab} />;
      case "executive": return <ExecutiveTab />;
      case "operational": return <OperationalTab />;
      case "financial": return <FinancialTab />;
      case "safety": return <SafetyTab />;
      case "compliance": return <ComplianceTab />;
      case "driver": return <DriverTab />;
      case "fleet": return <FleetTab />;
      case "lane": return <LaneTab />;
      case "customer": return <CustomerTab />;
      case "benchmark": return <BenchmarkTab />;
      case "trends": return <TrendsTab />;
      case "builder": return <BuilderTab />;
      case "scheduled": return <ScheduledTab />;
      case "alerts": return <AlertsTab />;
      case "history": return <HistoryTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 lg:p-8" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 p-4 md:p-6 lg:p-8"}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Reporting & Analytics</h1>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Comprehensive business intelligence and reporting center</p>
          </div>
        </div>
      </div>

      {/* Export toolbar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="outline" size="sm" className={isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm" className={isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}>
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
          Export Excel
        </Button>
        <Button variant="outline" size="sm" className={isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}>
          <Table className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className={isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}>
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Share
        </Button>
        <Button variant="outline" size="sm" className={isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}>
          <Bookmark className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
      </div>

      {/* Tab Navigation */}
      <ScrollArea className="mb-6">
        <div className="flex gap-1 pb-2 min-w-max">
          {TABS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all",
                activeTab === key
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
