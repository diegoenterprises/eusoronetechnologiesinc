/**
 * ZEUN FLEET MAINTENANCE COMMAND CENTER
 * Comprehensive fleet maintenance and vehicle management dashboard.
 * Covers: PM scheduling, work orders, parts inventory, tire management,
 * vehicle lifecycle, DOT inspection prep, cost analysis, recall alerts.
 * Dark theme with orange/amber accents for maintenance.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  Wrench, AlertTriangle, Clock, CheckCircle, TrendingUp,
  TrendingDown, Package, DollarSign, Truck, Shield,
  FileCheck, Fuel, CircleDot, Calendar, Bell,
  Plus, Search, Filter, ChevronRight, Activity,
  BarChart3, Gauge, Settings, ClipboardCheck,
  ShoppingCart, Star, TriangleAlert, CircleAlert,
  Timer, Cog, Eye, ArrowUpRight, ArrowDownRight,
  XCircle, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ---------------------------------------------------------------------------
// Stat Card (orange/amber accent)
// ---------------------------------------------------------------------------

function StatCard({
  title, value, subtitle, icon: Icon, trend, trendValue, variant = "default", isLight,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "warning" | "danger" | "success";
  isLight?: boolean;
}) {
  const variantsDark = {
    default: "border-zinc-800 bg-zinc-900/60",
    warning: "border-amber-800/50 bg-amber-950/30",
    danger: "border-red-800/50 bg-red-950/30",
    success: "border-emerald-800/50 bg-emerald-950/30",
  };
  const variantsLight = {
    default: "bg-white border-slate-200 shadow-sm",
    warning: "bg-amber-50 border-amber-200 shadow-sm",
    danger: "bg-red-50 border-red-200 shadow-sm",
    success: "bg-emerald-50 border-emerald-200 shadow-sm",
  };
  const iconBgDark = {
    default: "bg-orange-500/15 text-orange-400",
    warning: "bg-amber-500/15 text-amber-400",
    danger: "bg-red-500/15 text-red-400",
    success: "bg-emerald-500/15 text-emerald-400",
  };
  const iconBgLight = {
    default: "bg-orange-50 text-orange-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
    success: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className={cn("border", isLight ? variantsLight[variant] : variantsDark[variant])}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-slate-500" : "text-zinc-400")}>{title}</p>
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-zinc-100")}>{value}</p>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", isLight ? iconBgLight[variant] : iconBgDark[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={cn("text-xs font-medium", trend === "up" ? "text-emerald-400" : "text-red-400")}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Status / Priority badge helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: "Open", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    in_progress: { label: "In Progress", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    awaiting_parts: { label: "Awaiting Parts", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "Cancelled", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    overdue: { label: "Overdue", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    due_soon: { label: "Due Soon", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    upcoming: { label: "Upcoming", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    on_track: { label: "On Track", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    expiring_soon: { label: "Expiring Soon", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    expired: { label: "Expired", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    pass: { label: "Pass", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    fail: { label: "Fail", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    needs_attention: { label: "Needs Attention", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    at_risk: { label: "At Risk", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  };
  const config = map[status] || { label: status, cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
  return <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 border", config.cls)}>{config.label}</Badge>;
}

function priorityBadge(priority: string) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: "Critical", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
    high: { label: "High", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    medium: { label: "Medium", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    low: { label: "Low", cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  };
  const config = map[priority] || { label: priority, cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
  return <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 border", config.cls)}>{config.label}</Badge>;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full bg-zinc-800/50 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------

function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data, isLoading } = trpc.fleetMaintenance.getMaintenanceDashboard.useQuery();

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!data) return <p className="text-zinc-500 text-sm">No dashboard data available.</p>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard title="Overdue PMs" value={data.overduePMs} icon={AlertTriangle} variant="danger" subtitle="Requires attention" />
        <StatCard title="Upcoming PMs (7d)" value={data.upcomingPMs7d} icon={Clock} variant="warning" />
        <StatCard title="Open Work Orders" value={data.openWorkOrders} icon={Wrench} subtitle={`${data.awaitingParts} awaiting parts`} />
        <StatCard title="Costs MTD" value={fmtCurrency(data.costMTD)} icon={DollarSign}
          trend={data.costTrend === "down" ? "down" : "up"} trendValue={`${data.costTrendPct}% vs last month`} />
        <StatCard title="Fleet Availability" value={`${data.fleetAvailability}%`} icon={Truck}
          variant={data.fleetAvailability >= 90 ? "success" : "warning"} subtitle={`${data.vehiclesInShop} in shop`} />
        <StatCard title="Compliance Score" value={`${data.complianceScore}%`} icon={Shield}
          variant={data.complianceScore >= 90 ? "success" : "warning"} />
      </div>

      {/* Cost by Category & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-400" /> Cost Breakdown (MTD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.costByCategory.map((cat: any) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-40 truncate">{cat.category}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    style={{ width: `${(cat.amount / data.costMTD) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-zinc-300 w-16 text-right">{fmtCurrency(cat.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentActivity?.slice(0, 6).map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                <div className="mt-0.5 p-1 rounded bg-orange-500/10">
                  <Activity className="h-3 w-3 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{act.description}</p>
                  <p className="text-[10px] text-zinc-500">{fmtDate(act.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Recall Alerts" value={data.recallAlerts} icon={Bell} variant={data.recallAlerts > 0 ? "danger" : "success"} />
        <StatCard title="Expiring Warranties" value={data.expiringWarranties} icon={Shield} variant="warning" />
        <StatCard title="Avg Repair Time" value={`${data.avgRepairTurnaroundHrs}h`} icon={Timer} />
        <StatCard title="Upcoming PMs (30d)" value={data.upcomingPMs30d} icon={Calendar} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Work Orders Tab
// ---------------------------------------------------------------------------

function WorkOrdersTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [newWo, setNewWo] = useState({
    vehicleUnit: "", title: "", description: "", type: "corrective" as const,
    priority: "medium" as const, estimatedCost: 0,
  });

  const { data, isLoading, refetch } = trpc.fleetMaintenance.getWorkOrders.useQuery({
    status: statusFilter as "completed" | "cancelled" | "open" | "in_progress" | "awaiting_parts" | undefined, priority: priorityFilter as "medium" | "low" | "high" | "critical" | undefined, page: 1, limit: 50,
  });

  const createMut = trpc.fleetMaintenance.createWorkOrder.useMutation({
    onSuccess: () => { toast.success("Work order created"); setShowCreate(false); refetch(); },
    onError: (err: any) => toast.error("Failed", { description: err.message }),
  });

  const updateMut = trpc.fleetMaintenance.updateWorkOrder.useMutation({
    onSuccess: () => { toast.success("Work order updated"); refetch(); },
    onError: (err: any) => toast.error("Failed", { description: err.message }),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className={cn("w-40 text-xs", isLight ? "bg-white border-slate-200 text-slate-600" : "bg-zinc-900 border-zinc-700 text-zinc-300")}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter || "all"} onValueChange={v => setPriorityFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className={cn("w-36 text-xs", isLight ? "bg-white border-slate-200 text-slate-600" : "bg-zinc-900 border-zinc-700 text-zinc-300")}>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className={cn("max-w-lg", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-900 border-zinc-700 text-zinc-200")}>
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Create Work Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Vehicle Unit (e.g. TRK-1001)" value={newWo.vehicleUnit}
                  onChange={e => setNewWo({ ...newWo, vehicleUnit: e.target.value })}
                  className={cn("text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-800 border-zinc-700 text-zinc-200")} />
                <Input placeholder="Title" value={newWo.title}
                  onChange={e => setNewWo({ ...newWo, title: e.target.value })}
                  className={cn("text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-800 border-zinc-700 text-zinc-200")} />
                <Textarea placeholder="Description" value={newWo.description}
                  onChange={e => setNewWo({ ...newWo, description: e.target.value })}
                  className={cn("text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-800 border-zinc-700 text-zinc-200")} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newWo.type} onValueChange={v => setNewWo({ ...newWo, type: v as any })}>
                    <SelectTrigger className={cn("text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-800 border-zinc-700 text-zinc-200")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newWo.priority} onValueChange={v => setNewWo({ ...newWo, priority: v as any })}>
                    <SelectTrigger className={cn("text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-zinc-800 border-zinc-700 text-zinc-200")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white" disabled={createMut.isPending}
                  onClick={() => createMut.mutate({
                    vehicleId: 1, vehicleUnit: newWo.vehicleUnit, type: newWo.type,
                    priority: newWo.priority, title: newWo.title, description: newWo.description,
                  })}>
                  {createMut.isPending ? "Creating..." : "Create Work Order"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSkeleton rows={8} /> : (
        <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs">ID</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Vehicle</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Title</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Type</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Priority</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Vendor</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Est. Cost</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Created</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((wo: any) => (
                  <TableRow key={wo.id} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                    <TableCell className="text-xs font-mono text-orange-400">{wo.id}</TableCell>
                    <TableCell className="text-xs text-zinc-300 font-medium">{wo.vehicleUnit}</TableCell>
                    <TableCell className="text-xs text-zinc-300 max-w-[200px] truncate">{wo.title}</TableCell>
                    <TableCell className="text-xs text-zinc-400 capitalize">{wo.type}</TableCell>
                    <TableCell>{priorityBadge(wo.priority)}</TableCell>
                    <TableCell>{statusBadge(wo.status)}</TableCell>
                    <TableCell className="text-xs text-zinc-400 max-w-[120px] truncate">{wo.assignedVendorName}</TableCell>
                    <TableCell className="text-xs text-zinc-300 text-right font-mono">{fmtCurrency(wo.estimatedCost)}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{fmtDate(wo.createdAt)}</TableCell>
                    <TableCell>
                      {wo.status === "open" && (
                        <Button variant="ghost" size="sm" className="text-[10px] text-orange-400 hover:text-orange-300 h-6 px-2"
                          onClick={() => updateMut.mutate({ workOrderId: wo.id, status: "in_progress" })}>
                          Start
                        </Button>
                      )}
                      {wo.status === "in_progress" && (
                        <Button variant="ghost" size="sm" className="text-[10px] text-emerald-400 hover:text-emerald-300 h-6 px-2"
                          onClick={() => updateMut.mutate({ workOrderId: wo.id, status: "completed" })}>
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data && (
            <div className="px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{data.total} work orders total</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PM Schedule Tab
// ---------------------------------------------------------------------------

function PMScheduleTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [dueSoonOnly, setDueSoonOnly] = useState(false);
  const { data, isLoading } = trpc.fleetMaintenance.getPreventiveSchedule.useQuery({
    dueSoon: dueSoonOnly, page: 1, limit: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant={dueSoonOnly ? "default" : "outline"}
          className={cn("text-xs", dueSoonOnly ? "bg-orange-600 hover:bg-orange-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}
          onClick={() => setDueSoonOnly(!dueSoonOnly)}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> {dueSoonOnly ? "Showing Due/Overdue" : "Show Due/Overdue Only"}
        </Button>
        <span className="text-xs text-zinc-500 ml-auto">{data?.total ?? 0} scheduled services</span>
      </div>

      {isLoading ? <LoadingSkeleton rows={10} /> : (
        <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs">Vehicle</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Service</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Miles Until Due</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Days Until Due</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Next Due Date</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Last Performed</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((pm: any) => (
                  <TableRow key={pm.id} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                    <TableCell className="text-xs text-zinc-300 font-medium">{pm.vehicleUnit}</TableCell>
                    <TableCell className="text-xs text-zinc-300">{pm.service}</TableCell>
                    <TableCell>{statusBadge(pm.status)}</TableCell>
                    <TableCell className={cn("text-xs text-right font-mono",
                      pm.milesUntilDue <= 0 ? "text-red-400" : pm.milesUntilDue <= 2000 ? "text-amber-400" : "text-zinc-300")}>
                      {pm.milesUntilDue <= 0 ? `${fmtNumber(Math.abs(pm.milesUntilDue))} over` : fmtNumber(pm.milesUntilDue)}
                    </TableCell>
                    <TableCell className={cn("text-xs text-right font-mono",
                      pm.daysUntilDue <= 0 ? "text-red-400" : pm.daysUntilDue <= 7 ? "text-amber-400" : "text-zinc-300")}>
                      {pm.daysUntilDue <= 0 ? `${Math.abs(pm.daysUntilDue)}d overdue` : `${pm.daysUntilDue}d`}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">{fmtDate(pm.nextDueDate)}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{fmtDate(pm.lastPerformedDate)}</TableCell>
                    <TableCell className="text-xs text-zinc-300 text-right font-mono">{fmtCurrency(pm.estimatedCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parts Inventory Tab
// ---------------------------------------------------------------------------

function PartsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = trpc.fleetMaintenance.getPartsInventory.useQuery({
    search: search || undefined, lowStock: lowStockOnly, category, page: 1, limit: 50,
  });

  const orderMut = trpc.fleetMaintenance.orderPart.useMutation({
    onSuccess: (res: any) => toast.success(`Purchase order ${res.purchaseOrderId} created`),
    onError: (err: any) => toast.error("Failed", { description: err.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 w-56 bg-zinc-900 border-zinc-700 text-zinc-300 text-xs h-8" />
        </div>
        <Button size="sm" variant={lowStockOnly ? "default" : "outline"}
          className={cn("text-xs h-8", lowStockOnly ? "bg-red-600 hover:bg-red-500 text-white" : "border-zinc-700 text-zinc-400")}
          onClick={() => setLowStockOnly(!lowStockOnly)}>
          Low Stock {data?.lowStockCount ? `(${data.lowStockCount})` : ""}
        </Button>
        <Select value={category || "all"} onValueChange={v => setCategory(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-zinc-300 text-xs h-8">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {data?.categories?.map((c: string) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-500 ml-auto">
          Inventory Value: <span className="font-semibold text-orange-400">{data ? fmtCurrency(data.totalInventoryValue) : "..."}</span>
        </span>
      </div>

      {isLoading ? <LoadingSkeleton rows={8} /> : (
        <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs">Part #</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Name</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Category</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">On Hand</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Reorder Pt</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Unit Cost</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Total Value</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((part: any) => (
                  <TableRow key={part.id} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                    <TableCell className="text-xs font-mono text-orange-400">{part.partNumber}</TableCell>
                    <TableCell className="text-xs text-zinc-300">{part.name}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{part.category}</TableCell>
                    <TableCell className={cn("text-xs text-right font-mono", part.isLowStock ? "text-red-400 font-semibold" : "text-zinc-300")}>
                      {part.qtyOnHand}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-zinc-500">{part.reorderPoint}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtCurrency(part.unitCost)}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtCurrency(part.totalValue)}</TableCell>
                    <TableCell>
                      {part.isLowStock ? (
                        <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {part.isLowStock && (
                        <Button variant="ghost" size="sm" className="text-[10px] text-orange-400 hover:text-orange-300 h-6 px-2 gap-1"
                          disabled={orderMut.isPending}
                          onClick={() => orderMut.mutate({ partNumber: part.partNumber, quantity: part.reorderQty })}>
                          <ShoppingCart className="h-3 w-3" /> Reorder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tire Management Tab
// ---------------------------------------------------------------------------

function TiresTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data, isLoading } = trpc.fleetMaintenance.getTireManagement.useQuery({ page: 1, limit: 100 });

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!data) return <p className="text-zinc-500 text-sm">No tire data available.</p>;

  const summary = data.summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Total Tires" value={summary.totalTires} icon={CircleDot} />
        <StatCard title="Critical Tread" value={summary.criticalTread} icon={AlertTriangle} variant="danger" />
        <StatCard title="Replace Soon" value={summary.replaceSoon} icon={RotateCcw} variant="warning" />
        <StatCard title="Low Pressure" value={summary.lowPressure} icon={Gauge} variant="warning" />
        <StatCard title="Avg Tread (32nds)" value={summary.avgTreadDepth} icon={Gauge} variant={summary.avgTreadDepth > 12 ? "success" : "warning"} />
      </div>

      <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Vehicle</TableHead>
                <TableHead className="text-zinc-400 text-xs">Position</TableHead>
                <TableHead className="text-zinc-400 text-xs">Brand / Model</TableHead>
                <TableHead className="text-zinc-400 text-xs">Size</TableHead>
                <TableHead className="text-zinc-400 text-xs text-center">Tread (32nds)</TableHead>
                <TableHead className="text-zinc-400 text-xs">Tread Status</TableHead>
                <TableHead className="text-zinc-400 text-xs text-center">PSI</TableHead>
                <TableHead className="text-zinc-400 text-xs">Pressure</TableHead>
                <TableHead className="text-zinc-400 text-xs">Installed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((tire: any) => (
                <TableRow key={tire.id} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                  <TableCell className="text-xs text-zinc-300 font-medium">{tire.vehicleUnit}</TableCell>
                  <TableCell className="text-xs font-mono text-orange-400">{tire.position}</TableCell>
                  <TableCell className="text-xs text-zinc-300">{tire.brand} {tire.model}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{tire.size}</TableCell>
                  <TableCell className={cn("text-xs text-center font-mono font-semibold",
                    tire.treadDepthStatus === "critical" ? "text-red-400" :
                    tire.treadDepthStatus === "replace_soon" ? "text-amber-400" :
                    tire.treadDepthStatus === "monitor" ? "text-yellow-400" : "text-emerald-400")}>
                    {tire.treadDepth32nds}
                  </TableCell>
                  <TableCell>{statusBadge(tire.treadDepthStatus)}</TableCell>
                  <TableCell className={cn("text-xs text-center font-mono",
                    tire.pressureStatus === "low" ? "text-red-400" : tire.pressureStatus === "high" ? "text-amber-400" : "text-zinc-300")}>
                    {tire.pressure}
                  </TableCell>
                  <TableCell>{statusBadge(tire.pressureStatus === "ok" ? "pass" : tire.pressureStatus === "low" ? "fail" : "needs_attention")}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{fmtDate(tire.installedDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vehicle Lifecycle Tab
// ---------------------------------------------------------------------------

function LifecycleTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data, isLoading } = trpc.fleetMaintenance.getVehicleLifecycle.useQuery({ page: 1, limit: 50 });

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!data) return <p className="text-zinc-500 text-sm">No vehicle lifecycle data.</p>;

  const summary = data.fleetSummary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Fleet Asset Value" value={fmtCurrency(summary.totalAssetValue)} icon={DollarSign} />
        <StatCard title="Total Acquisition" value={fmtCurrency(summary.totalAcquisitionCost)} icon={Truck} />
        <StatCard title="Avg Fleet Age" value={`${summary.avgAge} yrs`} icon={Calendar} />
        <StatCard title="Avg Cost/Mile" value={`$${summary.avgCostPerMile}`} icon={TrendingUp} />
        <StatCard title="End-of-Life Units" value={summary.endOfLifeCount} icon={AlertTriangle}
          variant={summary.endOfLifeCount > 0 ? "warning" : "success"} />
      </div>

      <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Unit</TableHead>
                <TableHead className="text-zinc-400 text-xs">Type</TableHead>
                <TableHead className="text-zinc-400 text-xs">Make / Model</TableHead>
                <TableHead className="text-zinc-400 text-xs">Year</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Acquisition</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Current Value</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Mileage</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Cost/Mile</TableHead>
                <TableHead className="text-zinc-400 text-xs">Phase</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Remaining Life</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((v: any) => (
                <TableRow key={v.id} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                  <TableCell className="text-xs text-zinc-300 font-medium">{v.unit}</TableCell>
                  <TableCell className="text-xs text-zinc-400 capitalize">{v.type}</TableCell>
                  <TableCell className="text-xs text-zinc-300">{v.make} {v.model}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{v.year}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtCurrency(v.acquisitionCost)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtCurrency(v.currentValue)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-400">{fmtNumber(v.currentMiles)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">${v.costPerMile}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 border",
                      v.lifecyclePhase === "new" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                      v.lifecyclePhase === "prime" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                      v.lifecyclePhase === "mature" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-red-500/15 text-red-400 border-red-500/30"
                    )}>
                      {v.lifecyclePhase.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-400">{v.estimatedRemainingLife} yrs</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOT Inspection Prep Tab
// ---------------------------------------------------------------------------

function InspectionPrepTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [vehicleId, setVehicleId] = useState(1);
  const { data, isLoading } = trpc.fleetMaintenance.getDotInspectionPrep.useQuery({ vehicleId });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={String(vehicleId)} onValueChange={v => setVehicleId(Number(v))}>
          <SelectTrigger className={cn("w-44 text-xs", isLight ? "bg-white border-slate-200 text-slate-600" : "bg-zinc-900 border-zinc-700 text-zinc-300")}>
            <SelectValue placeholder="Select Vehicle" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>TRK-{1001 + i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSkeleton rows={8} /> : data ? (
        <div className="space-y-4">
          {/* Readiness Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard title="Readiness Score" value={`${data.summary.readinessScore}%`} icon={ClipboardCheck}
              variant={data.summary.readinessScore >= 90 ? "success" : data.summary.readinessScore >= 70 ? "warning" : "danger"} />
            <StatCard title="Prediction" value={data.summary.prediction.toUpperCase()} icon={Shield}
              variant={data.summary.prediction === "pass" ? "success" : data.summary.prediction === "at_risk" ? "warning" : "danger"} />
            <StatCard title="Items Passing" value={data.summary.pass} icon={CheckCircle} variant="success" />
            <StatCard title="Items Failing" value={data.summary.fail} icon={XCircle} variant="danger" />
            <StatCard title="Est. Prep Cost" value={fmtCurrency(data.summary.estimatedPrepCost)} icon={DollarSign} />
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.byCategory.map((cat: any) => (
              <Card key={cat.category} className={cn("border", cat.fail > 0 ? "border-red-800/50 bg-red-950/20" : "border-zinc-800 bg-zinc-900/60")}>
                <CardContent className="py-3 px-4">
                  <p className="text-xs font-semibold text-zinc-300 mb-1">{cat.category}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-emerald-400">{cat.pass} pass</span>
                    {cat.fail > 0 && <span className="text-red-400">{cat.fail} fail</span>}
                    {cat.needsAttention > 0 && <span className="text-amber-400">{cat.needsAttention} attn</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Checklist */}
          <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-orange-400" /> Full DOT Inspection Checklist
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 text-xs">Category</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Inspection Item</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Critical</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Last Checked</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.checklist.map((item: any) => (
                    <TableRow key={item.id} className={cn("border-zinc-800/50",
                      item.status === "fail" ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-zinc-800/30")}>
                      <TableCell className="text-xs text-zinc-400">{item.category}</TableCell>
                      <TableCell className="text-xs text-zinc-300">{item.item}</TableCell>
                      <TableCell>
                        {item.critical && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Critical</Badge>}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{fmtDate(item.lastCheckedDate)}</TableCell>
                      <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">{item.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost Analysis Tab
// ---------------------------------------------------------------------------

function CostAnalysisTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data, isLoading } = trpc.fleetMaintenance.getMaintenanceCostAnalysis.useQuery({
    periodMonths: 12, groupBy: "category",
  });

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!data) return <p className="text-zinc-500 text-sm">No cost data available.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total (12mo)" value={fmtCurrency(data.totalCost)} icon={DollarSign} />
        <StatCard title="Avg Monthly" value={fmtCurrency(data.avgMonthlyCost)} icon={BarChart3} />
        <StatCard title="Cost Per Vehicle" value={fmtCurrency(data.costPerVehicle)} icon={Truck} />
        <StatCard title="Top Expense" value={data.topExpense?.category || "—"} icon={TrendingUp}
          subtitle={data.topExpense ? fmtCurrency(data.topExpense.amount) : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-400" /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.monthlyTrend.map((m: any) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 w-14">{m.label}</span>
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all"
                    style={{ width: `${(m.total / Math.max(...data.monthlyTrend.map((x: any) => x.total))) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-zinc-300 w-16 text-right">{fmtCurrency(m.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Category */}
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-400" /> Cost by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.byCategory.map((cat: any) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-32 truncate">{cat.category}</span>
                <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    style={{ width: `${cat.percentage}%` }} />
                </div>
                <span className="text-xs font-mono text-zinc-300 w-16 text-right">{fmtCurrency(cat.amount)}</span>
                <span className="text-[10px] text-zinc-500 w-8 text-right">{cat.percentage}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* By Vehicle */}
      <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
            <Truck className="h-4 w-4 text-orange-400" /> Cost by Vehicle
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Vehicle</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Total Cost</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Cost/Mile</TableHead>
                <TableHead className="text-zinc-400 text-xs">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byVehicle.map((v: any) => (
                <TableRow key={v.vehicleUnit} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                  <TableCell className="text-xs text-zinc-300 font-medium">{v.vehicleUnit}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtCurrency(v.amount)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-400">${v.costPerMile}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${(v.amount / data.byVehicle[0]?.amount) * 100}%` }} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recalls & Alerts Tab
// ---------------------------------------------------------------------------

function RecallsAlertsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recallsQuery = trpc.fleetMaintenance.getRecallAlerts.useQuery();
  const predictiveQuery = trpc.fleetMaintenance.getPredictiveAlerts.useQuery({ severity: "all", limit: 15 });
  const complianceQuery = trpc.fleetMaintenance.getComplianceCalendar.useQuery({ daysAhead: 60 });

  const isLoading = recallsQuery.isLoading || predictiveQuery.isLoading || complianceQuery.isLoading;

  if (isLoading) return <LoadingSkeleton rows={10} />;

  const recalls = recallsQuery.data;
  const predictive = predictiveQuery.data;
  const compliance = complianceQuery.data;

  return (
    <div className="space-y-4">
      {/* Recall Alerts */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
            <Bell className="h-4 w-4 text-red-400" /> Manufacturer Recalls
            {(recalls?.summary?.criticalUnresolved ?? 0) > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                {recalls?.summary?.criticalUnresolved} Critical
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recalls?.alerts?.map((recall: any) => (
            <div key={recall.id} className={cn("p-3 rounded-lg border",
              recall.severity === "critical" ? "border-red-800/50 bg-red-950/20" :
              recall.severity === "high" ? "border-orange-800/50 bg-orange-950/20" :
              "border-zinc-800 bg-zinc-800/30")}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-orange-400">{recall.nhtsa}</span>
                    {statusBadge(recall.severity === "critical" ? "fail" : recall.severity === "high" ? "needs_attention" : "pass")}
                  </div>
                  <p className="text-sm text-zinc-200 font-medium">{recall.campaign}</p>
                  <p className="text-xs text-zinc-400">{recall.manufacturer} — {recall.affectedModels.join(", ")}</p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-xs text-zinc-500">Deadline: {fmtDate(recall.deadline)}</p>
                  <div className="flex items-center gap-1.5">
                    <Progress value={recall.completionPct} className="h-1.5 w-20 bg-zinc-800"  />
                    <span className="text-[10px] text-zinc-400">{recall.completionPct}%</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {recall.unresolvedCount} of {recall.affectedVehiclesInFleet.length} unresolved
                  </p>
                </div>
              </div>
            </div>
          ))}
          {(!recalls?.alerts || recalls.alerts.length === 0) && (
            <p className="text-xs text-zinc-500 text-center py-4">No active recalls</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Predictive Alerts */}
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" /> Predictive Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {predictive?.alerts?.slice(0, 8).map((alert: any) => (
              <div key={alert.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                <div className={cn("p-1 rounded",
                  alert.severity === "critical" ? "bg-red-500/15" : alert.severity === "high" ? "bg-orange-500/15" : "bg-amber-500/15")}>
                  <TriangleAlert className={cn("h-3 w-3",
                    alert.severity === "critical" ? "text-red-400" : alert.severity === "high" ? "text-orange-400" : "text-amber-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{alert.recommendation}</p>
                  <p className="text-[10px] text-zinc-500">{alert.vehicleUnit} | {alert.confidenceScore}% confidence</p>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">
                  {alert.daysUntilFailure === 0 ? "NOW" : `${alert.daysUntilFailure}d`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance Calendar */}
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" /> Compliance Deadlines (60d)
              {(compliance?.summary?.overdue ?? 0) > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                  {compliance?.summary?.overdue} Overdue
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {compliance?.events?.slice(0, 8).map((evt: any) => (
              <div key={evt.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                {statusBadge(evt.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{evt.label}</p>
                  <p className="text-[10px] text-zinc-500">{evt.vehicleUnit} | Due: {fmtDate(evt.dueDate)}</p>
                </div>
                <span className={cn("text-[10px] shrink-0",
                  evt.status === "overdue" ? "text-red-400" : evt.status === "due_soon" ? "text-amber-400" : "text-zinc-400")}>
                  {evt.status === "overdue" ? "OVERDUE" : `${evt.daysUntilDue}d`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilization Tab
// ---------------------------------------------------------------------------

function UtilizationTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data, isLoading } = trpc.fleetMaintenance.getFleetUtilization.useQuery({ periodDays: 30 });
  const fuelQuery = trpc.fleetMaintenance.getFuelEfficiency.useQuery({ periodDays: 90 });
  const vendorQuery = trpc.fleetMaintenance.getVendorManagement.useQuery();

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!data) return <p className="text-zinc-500 text-sm">No utilization data.</p>;

  const fuel = fuelQuery.data;
  const vendors = vendorQuery.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Avg Utilization" value={`${data.fleetAvgUtilization}%`} icon={Gauge}
          variant={data.fleetAvgUtilization >= 50 ? "success" : "warning"} />
        <StatCard title="Total Revenue" value={fmtCurrency(data.totalRevenue)} icon={DollarSign} />
        <StatCard title="Total Miles" value={fmtNumber(data.totalMiles)} icon={Truck} />
        <StatCard title="Total Idle Hours" value={fmtNumber(data.totalIdleHours)} icon={Clock} variant="warning" />
        <StatCard title="Maintenance Hours" value={fmtNumber(data.totalMaintenanceHours)} icon={Wrench} />
      </div>

      {/* Utilization by Vehicle */}
      <Card className={cn("overflow-hidden", isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-orange-400" /> Vehicle Utilization (30d)
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Vehicle</TableHead>
                <TableHead className="text-zinc-400 text-xs">Utilization</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Driving Hrs</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Idle Hrs</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Maint. Hrs</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Miles</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Revenue</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Rev/Mile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vehicles.map((v: any) => (
                <TableRow key={v.vehicleUnit} className={cn(isLight ? "border-slate-100 hover:bg-slate-50" : "border-zinc-800/50 hover:bg-zinc-800/30")}>
                  <TableCell className="text-xs text-zinc-300 font-medium">{v.vehicleUnit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          v.utilizationRate >= 50 ? "bg-emerald-500" : v.utilizationRate >= 25 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${v.utilizationRate}%` }} />
                      </div>
                      <span className="text-xs font-mono text-zinc-300">{v.utilizationRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtNumber(v.drivingHours)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-400">{fmtNumber(v.idleHours)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-400">{fmtNumber(v.maintenanceHours)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">{fmtNumber(v.totalMiles)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-emerald-400">{fmtCurrency(v.revenue)}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-zinc-300">${v.revenuePerMile}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fuel Efficiency */}
        {fuel && (
          <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-orange-400" /> Fuel Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-zinc-400">Fleet Avg: <span className="text-zinc-200 font-semibold">{fuel.fleetAvgMpg} MPG</span></span>
                <span className="text-zinc-400">Benchmark: <span className="text-amber-400">{fuel.fleetBenchmark} MPG</span></span>
              </div>
              {fuel.vehicles?.slice(0, 8).map((v: any) => (
                <div key={v.vehicleUnit} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-20">{v.vehicleUnit}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      v.avgMpg >= fuel.fleetBenchmark ? "bg-emerald-500" : "bg-amber-500")}
                      style={{ width: `${(v.avgMpg / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-zinc-300 w-14 text-right">{v.avgMpg} mpg</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Vendor Directory */}
        {vendors && (
          <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "border-zinc-800 bg-zinc-900/60")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Cog className="h-4 w-4 text-orange-400" /> Maintenance Vendors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendors.vendors?.map((v: any) => (
                <div key={v.id} className="flex items-start gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 mt-0.5">
                    <Wrench className="h-3.5 w-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-200 font-medium">{v.name}</span>
                      {v.isPreferred && <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 px-1.5 py-0">Preferred</Badge>}
                    </div>
                    <p className="text-[10px] text-zinc-500">{v.specialty}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-amber-400" /> {v.rating}</span>
                      <span>{v.jobsCompleted} jobs</span>
                      <span>Avg {v.avgTurnaroundHours}h</span>
                      <span>{fmtCurrency(v.totalSpend)} total</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FleetMaintenance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 space-y-4" : "min-h-screen bg-zinc-950 p-4 md:p-6 space-y-4"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-bold flex items-center gap-2.5", isLight ? "text-slate-900" : "text-zinc-100")}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            Zeun Fleet Maintenance
          </h1>
          <p className={cn("text-xs mt-1 ml-11", isLight ? "text-slate-500" : "text-zinc-500")}>
            Preventive maintenance, work orders, parts, tires, DOT prep, and fleet lifecycle management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className={cn("border h-9 p-0.5 gap-0.5 w-fit", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900 border-zinc-800")}>
            <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="work-orders" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="pm-schedule" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              PM Schedule
            </TabsTrigger>
            <TabsTrigger value="parts" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Parts
            </TabsTrigger>
            <TabsTrigger value="tires" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Tires
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="dot-prep" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              DOT Prep
            </TabsTrigger>
            <TabsTrigger value="costs" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Costs
            </TabsTrigger>
            <TabsTrigger value="recalls" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Recalls & Alerts
            </TabsTrigger>
            <TabsTrigger value="utilization" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 h-8">
              Utilization
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
        <TabsContent value="work-orders" className="mt-4"><WorkOrdersTab /></TabsContent>
        <TabsContent value="pm-schedule" className="mt-4"><PMScheduleTab /></TabsContent>
        <TabsContent value="parts" className="mt-4"><PartsTab /></TabsContent>
        <TabsContent value="tires" className="mt-4"><TiresTab /></TabsContent>
        <TabsContent value="lifecycle" className="mt-4"><LifecycleTab /></TabsContent>
        <TabsContent value="dot-prep" className="mt-4"><InspectionPrepTab /></TabsContent>
        <TabsContent value="costs" className="mt-4"><CostAnalysisTab /></TabsContent>
        <TabsContent value="recalls" className="mt-4"><RecallsAlertsTab /></TabsContent>
        <TabsContent value="utilization" className="mt-4"><UtilizationTab /></TabsContent>
      </Tabs>
    </div>
  );
}
