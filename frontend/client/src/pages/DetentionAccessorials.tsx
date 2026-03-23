/**
 * DETENTION, DEMURRAGE & ACCESSORIAL CHARGE MANAGEMENT
 * Comprehensive dashboard for detention tracking, demurrage calculations,
 * accessorial catalog, TONU management, layover, lumper fees, disputes, and billing.
 *
 * Wired to: detentionAccessorials.* tRPC router
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Timer, Clock, DollarSign, AlertTriangle, Building2, TrendingUp,
  FileText, Truck, Package, Search, RefreshCw, BarChart3,
  Scale, ShieldAlert, Receipt, Fuel, HandMetal, BedDouble,
  CalendarDays, Ban, ChevronRight, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, AlertCircle, Loader2, Send,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function statusColor(status: string) {
  switch (status) {
    case "submitted":
    case "pending_review":
    case "pending":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "approved":
    case "invoiced":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "paid":
    case "reimbursed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "disputed":
    case "under_review":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "denied":
    case "voided":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

function chargeTypeLabel(type: string) {
  const map: Record<string, string> = {
    detention: "Detention",
    demurrage: "Demurrage",
    tonu: "TONU",
    layover: "Layover",
    lumper: "Lumper",
    driver_assist: "Driver Assist",
    fuel_surcharge: "Fuel Surcharge",
    stop_off: "Stop-Off",
    inside_delivery: "Inside Delivery",
    liftgate: "Liftgate",
    reweigh: "Reweigh",
    reconsignment: "Reconsignment",
    tarping: "Tarping",
    tank_washout: "Tank Washout",
    pump_time: "Pump Time",
    pre_cool: "Pre-Cool",
    dry_run: "Dry Run",
    other: "Other",
  };
  return map[type] || type;
}

// ════════════════════════════════════════════════════════════════════════════
// LIVE TIMER COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function LiveDetentionTimer({ arrivalTime, freeTimeMinutes }: { arrivalTime: string; freeTimeMinutes: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const arrival = new Date(arrivalTime).getTime();
    const update = () => setElapsed(Math.max(0, Math.round((Date.now() - arrival) / 60000)));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [arrivalTime]);

  const billable = Math.max(0, elapsed - freeTimeMinutes);
  const pctFreeUsed = Math.min(100, Math.round((elapsed / freeTimeMinutes) * 100));
  const isBillable = billable > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Timer className={`h-4 w-4 ${isBillable ? "text-amber-400 animate-pulse" : "text-zinc-400"}`} />
        <span className={`text-sm font-mono font-bold ${isBillable ? "text-amber-400" : "text-zinc-300"}`}>
          {formatMinutes(elapsed)}
        </span>
        {isBillable && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            {formatMinutes(billable)} billable
          </Badge>
        )}
      </div>
      <Progress
        value={pctFreeUsed}
        className="h-1.5"
      />
      <p className="text-[10px] text-muted-foreground">
        Free time: {formatMinutes(freeTimeMinutes)} | {pctFreeUsed}% used
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════════════

function StatCard({
  title, value, subtitle, icon: Icon, trend, trendUp, accent = "amber", isLight = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  accent?: "amber" | "orange" | "red" | "green" | "blue";
  isLight?: boolean;
}) {
  const accentMap = {
    amber: "text-amber-400",
    orange: "text-orange-400",
    red: "text-red-400",
    green: "text-green-400",
    blue: "text-blue-400",
  };
  return (
    <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${accentMap[accent]}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Icon className={`h-5 w-5 ${accentMap[accent]} opacity-60`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendUp ? <ArrowUpRight className="h-3 w-3 text-green-400" /> : <ArrowDownRight className="h-3 w-3 text-red-400" />}
            <span className={`text-xs ${trendUp ? "text-green-400" : "text-red-400"}`}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DetentionAccessorials() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange] = useState({ from: "", to: "" });

  // ── tRPC queries ──
  const dashboardQuery = trpc.detentionAccessorials.getDetentionDashboard.useQuery(
    { dateFrom: dateRange.from || undefined, dateTo: dateRange.to || undefined },
    { refetchInterval: 60000 }
  );

  const activeDetentionsQuery = trpc.detentionAccessorials.getActiveDetentions.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const historyQuery = trpc.detentionAccessorials.getDetentionHistory.useQuery(
    { dateFrom: dateRange.from || undefined, dateTo: dateRange.to || undefined },
    { enabled: activeTab === "history" || activeTab === "dashboard" }
  );

  const facilityQuery = trpc.detentionAccessorials.getDetentionByFacility.useQuery(
    undefined,
    { enabled: activeTab === "facilities" || activeTab === "dashboard" }
  );

  const catalogQuery = trpc.detentionAccessorials.getAccessorialCatalog.useQuery(
    { search: searchQuery || undefined },
    { enabled: activeTab === "catalog" }
  );

  const tonuQuery = trpc.detentionAccessorials.getTonuManagement.useQuery(
    undefined,
    { enabled: activeTab === "tonu" }
  );

  const demurrageQuery = trpc.detentionAccessorials.getDemurrageTracking.useQuery(
    undefined,
    { enabled: activeTab === "demurrage" }
  );

  const disputesQuery = trpc.detentionAccessorials.getAccessorialDisputes.useQuery(
    undefined,
    { enabled: activeTab === "disputes" }
  );

  const billingQuery = trpc.detentionAccessorials.getAccessorialBilling.useQuery(
    undefined,
    { enabled: activeTab === "billing" }
  );

  const analyticsQuery = trpc.detentionAccessorials.getAccessorialAnalytics.useQuery(
    undefined,
    { enabled: activeTab === "analytics" }
  );

  const rulesQuery = trpc.detentionAccessorials.getAutoDetentionRules.useQuery(
    undefined,
    { enabled: activeTab === "rules" }
  );

  const dash = dashboardQuery.data;
  const isLoading = dashboardQuery.isLoading;

  return (
    <div className={cn("space-y-6 p-1", isLight ? "min-h-screen bg-slate-50 text-slate-900" : "")}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6 text-amber-400" />
            Detention & Accessorials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detention tracking, demurrage, TONU, lumper fees, and accessorial charge management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dash && dash.activeDetentions > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
              <Timer className="h-3 w-3 mr-1" />
              {dash.activeDetentions} Active
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dashboardQuery.refetch();
              activeDetentionsQuery.refetch();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
          <TabsTrigger value="dashboard" className="text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            <Timer className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Active
          </TabsTrigger>
          <TabsTrigger value="facilities" className="text-xs">
            <Building2 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="catalog" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="tonu" className="text-xs">
            <Ban className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            TONU
          </TabsTrigger>
          <TabsTrigger value="demurrage" className="text-xs">
            <Package className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Demurrage
          </TabsTrigger>
          <TabsTrigger value="disputes" className="text-xs">
            <ShieldAlert className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs">
            <Receipt className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">
            <Scale className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Rules
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD TAB                                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <span className="ml-2 text-muted-foreground">Loading detention data...</span>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Active Detentions"
                  value={dash?.activeDetentions || 0}
                  subtitle="Currently running"
                  icon={Timer}
                  accent="amber"
                />
                <StatCard
                  title="Avg Wait Time"
                  value={formatMinutes(dash?.avgWaitMinutes || 0)}
                  subtitle="Across all events"
                  icon={Clock}
                  accent="orange"
                />
                <StatCard
                  title="Total Charges"
                  value={formatCurrency(dash?.totalCharges || 0)}
                  subtitle={`${dash?.totalEvents || 0} events`}
                  icon={DollarSign}
                  accent="amber"
                />
                <StatCard
                  title="Disputed"
                  value={formatCurrency(dash?.disputedAmount || 0)}
                  subtitle="Under review"
                  icon={AlertTriangle}
                  accent="red"
                />
              </div>

              {/* Collection metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Billed"
                  value={formatCurrency(dash?.billedAmount || 0)}
                  icon={FileText}
                  accent="blue"
                />
                <StatCard
                  title="Collected"
                  value={formatCurrency(dash?.collectedAmount || 0)}
                  icon={CheckCircle2}
                  accent="green"
                />
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold mt-1 text-amber-400">
                      {dash?.billedAmount
                        ? `${Math.round((dash?.collectedAmount || 0) / dash.billedAmount * 100)}%`
                        : "N/A"}
                    </p>
                    <Progress
                      value={dash?.billedAmount ? (dash?.collectedAmount || 0) / dash.billedAmount * 100 : 0}
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Charges by type */}
              {dash?.chargesByType && dash.chargesByType.length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-amber-400" />
                      Charges by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dash.chargesByType.map((ct: any, i: number) => {
                        const maxAmount = Math.max(...dash.chargesByType.map((c: any) => c.totalAmount));
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24 truncate">
                              {chargeTypeLabel(ct.type)}
                            </span>
                            <div className="flex-1">
                              <div
                                className="h-5 rounded bg-amber-500/30 flex items-center px-2"
                                style={{ width: `${maxAmount > 0 ? (ct.totalAmount / maxAmount) * 100 : 0}%`, minWidth: "40px" }}
                              >
                                <span className="text-[10px] text-amber-300 font-medium">
                                  {formatCurrency(ct.totalAmount)}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">{ct.count}x</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Worst offender facilities */}
              {dash?.worstOffenders && dash.worstOffenders.length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-400" />
                      Top Detention Facilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                          <TableHead className="text-xs">Facility</TableHead>
                          <TableHead className="text-xs text-right">Events</TableHead>
                          <TableHead className="text-xs text-right">Avg Wait</TableHead>
                          <TableHead className="text-xs text-right">Total Charges</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dash.worstOffenders.slice(0, 5).map((f: any, i: number) => (
                          <TableRow key={i} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 font-bold text-xs w-5">#{i + 1}</span>
                                {f.facilityName}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-right">{f.eventCount}</TableCell>
                            <TableCell className="text-sm text-right text-orange-400">
                              {formatMinutes(f.avgWaitMinutes)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium text-amber-400">
                              {formatCurrency(f.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Recent events */}
              {dash?.recentEvents && dash.recentEvents.length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      Recent Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                          <TableHead className="text-xs">Load</TableHead>
                          <TableHead className="text-xs">Facility</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Wait</TableHead>
                          <TableHead className="text-xs text-right">Charge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dash.recentEvents.map((evt: any) => (
                          <TableRow key={evt.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                            <TableCell className="text-sm">#{evt.loadId}</TableCell>
                            <TableCell className="text-sm">{evt.facilityName}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${statusColor(evt.status)}`}>
                                {evt.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-right text-orange-400">
                              {formatMinutes(evt.totalMinutes)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium text-amber-400">
                              {formatCurrency(evt.totalCharge)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Empty state */}
              {!dash?.totalEvents && !isLoading && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Timer className="h-12 w-12 text-zinc-600 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-400">No Detention Events Yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                      Detention events will appear here as they are tracked through geofencing,
                      ELD data, or manual submissions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ACTIVE DETENTIONS TAB                                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-400 animate-pulse" />
              Live Detention Timers
            </h2>
            <Badge variant="outline" className="text-xs">
              {activeDetentionsQuery.data?.total || 0} active
            </Badge>
          </div>

          {activeDetentionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : (activeDetentionsQuery.data?.detentions || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-10 w-10 text-green-500/50 mb-3" />
                <p className="text-sm text-muted-foreground">No active detentions right now</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeDetentionsQuery.data?.detentions || []).map((det: any) => (
                <Card key={det.id} className={cn(isLight ? "bg-amber-50/50 border-amber-200" : "bg-zinc-900/60 border-amber-500/20")}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Load #{det.loadId}</span>
                      <Badge className={`text-[10px] ${statusColor(det.status)}`}>{det.locationType}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm text-zinc-300">{det.facilityName}</span>
                    </div>
                    <LiveDetentionTimer
                      arrivalTime={det.arrivalTime}
                      freeTimeMinutes={det.freeTimeMinutes}
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <span className="text-xs text-muted-foreground">{det.carrierName}</span>
                      <span className="text-sm font-bold text-amber-400">
                        {formatCurrency(det.currentCharge)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FACILITY SCOREBOARD TAB                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="facilities" className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-400" />
            Facility Detention Scoreboard
          </h2>

          {facilityQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
            </div>
          ) : (facilityQuery.data?.facilities || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-muted-foreground">No facility detention data available</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">Rank</TableHead>
                      <TableHead className="text-xs">Facility</TableHead>
                      <TableHead className="text-xs text-right">Events</TableHead>
                      <TableHead className="text-xs text-right">Avg Wait</TableHead>
                      <TableHead className="text-xs text-right">Max Wait</TableHead>
                      <TableHead className="text-xs text-right">Total Charges</TableHead>
                      <TableHead className="text-xs text-right">Avg Charge</TableHead>
                      <TableHead className="text-xs text-right">Disputes</TableHead>
                      <TableHead className="text-xs text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(facilityQuery.data?.facilities || []).map((f: any) => (
                      <TableRow key={f.rank} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell>
                          <span className={`text-sm font-bold ${f.rank <= 3 ? "text-red-400" : "text-zinc-400"}`}>
                            #{f.rank}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{f.facilityName}</TableCell>
                        <TableCell className="text-sm text-right">{f.eventCount}</TableCell>
                        <TableCell className="text-sm text-right text-orange-400">{formatMinutes(f.avgWaitMinutes)}</TableCell>
                        <TableCell className="text-sm text-right text-red-400">{formatMinutes(f.maxWaitMinutes)}</TableCell>
                        <TableCell className="text-sm text-right font-medium text-amber-400">{formatCurrency(f.totalCharges)}</TableCell>
                        <TableCell className="text-sm text-right">{formatCurrency(f.avgCharge)}</TableCell>
                        <TableCell className="text-sm text-right">
                          {f.disputeCount > 0 ? (
                            <Badge className="bg-red-500/20 text-red-400 text-[10px]">{f.disputeCount}</Badge>
                          ) : (
                            <span className="text-zinc-500">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={f.score} className="h-1.5 w-12" />
                            <span className={`text-xs font-medium ${f.score >= 70 ? "text-red-400" : f.score >= 40 ? "text-amber-400" : "text-green-400"}`}>
                              {f.score}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ACCESSORIAL CATALOG TAB                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              Accessorial Charge Catalog
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search charges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-9", isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-zinc-700")}
              />
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(catalogQuery.data?.items || []).map((item: any) => (
                <Card key={item.code} className={cn(isLight ? "bg-white border-slate-200 shadow-sm hover:border-amber-500/40" : "bg-zinc-900/60 border-zinc-800 hover:border-amber-500/30", "transition-colors")}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">{item.code}</Badge>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge className={`text-[10px] ${
                        item.category === "time" ? "bg-blue-500/20 text-blue-400" :
                        item.category === "flat" ? "bg-amber-500/20 text-amber-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <div className={cn("flex items-center justify-between pt-2 border-t", isLight ? "border-slate-200" : "border-zinc-800")}>
                      <span className="text-xs text-muted-foreground">Rate</span>
                      <span className={cn("text-sm font-bold", isLight ? "text-amber-600" : "text-amber-400")}>
                        {item.defaultRate > 0 ? `$${item.defaultRate}` : "Receipt"} / {item.unit}
                      </span>
                    </div>
                    {item.freeTime > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Free Time</span>
                        <span className={cn("text-xs", isLight ? "text-slate-700" : "text-zinc-300")}>{formatMinutes(item.freeTime)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TONU TAB                                                     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="tonu" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              TONU - Truck Order Not Used
            </h2>
            {tonuQuery.data?.summary && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {tonuQuery.data.summary.total} total
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {formatCurrency(tonuQuery.data.summary.totalAmount)}
                </Badge>
              </div>
            )}
          </div>

          {tonuQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-red-400" />
            </div>
          ) : (tonuQuery.data?.tonus || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ban className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-muted-foreground">No TONU charges recorded</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">Load</TableHead>
                      <TableHead className="text-xs">Carrier</TableHead>
                      <TableHead className="text-xs">Shipper</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tonuQuery.data?.tonus || []).map((t: any) => (
                      <TableRow key={t.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell className="text-sm">#{t.loadId}</TableCell>
                        <TableCell className="text-sm">{t.carrierName}</TableCell>
                        <TableCell className="text-sm">{t.shipperName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{t.reason}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusColor(t.status)}`}>{t.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-amber-400">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DEMURRAGE TAB                                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="demurrage" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-400" />
              Demurrage Tracking
            </h2>
            {demurrageQuery.data?.summary && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {demurrageQuery.data.summary.totalContainers} containers
                </Badge>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                  {formatCurrency(demurrageQuery.data.summary.totalCharges)}
                </Badge>
              </div>
            )}
          </div>

          {/* Demurrage summary cards */}
          {demurrageQuery.data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Containers" value={demurrageQuery.data.summary.totalContainers} icon={Package} accent="orange" />
              <StatCard title="Total Charges" value={formatCurrency(demurrageQuery.data.summary.totalCharges)} icon={DollarSign} accent="amber" />
              <StatCard title="Avg Days Held" value={demurrageQuery.data.summary.avgDaysHeld} icon={CalendarDays} accent="orange" />
              <StatCard title="Active" value={demurrageQuery.data.summary.activeCount} icon={Timer} accent="red" />
            </div>
          )}

          {demurrageQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
            </div>
          ) : (demurrageQuery.data?.containers || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-muted-foreground">No demurrage charges tracked</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">Container</TableHead>
                      <TableHead className="text-xs">Facility</TableHead>
                      <TableHead className="text-xs">Days Held</TableHead>
                      <TableHead className="text-xs">Per Diem</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(demurrageQuery.data?.containers || []).map((c: any) => (
                      <TableRow key={c.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell className="text-sm font-mono">{c.containerNumber}</TableCell>
                        <TableCell className="text-sm">{c.facilityName}</TableCell>
                        <TableCell className="text-sm text-orange-400">{c.daysHeld}d</TableCell>
                        <TableCell className="text-sm">{formatCurrency(c.perDiemRate)}/day</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-amber-400">
                          {formatCurrency(c.totalCharge)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DISPUTES TAB                                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="disputes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Charge Disputes
            </h2>
            {disputesQuery.data?.summary && (
              <div className="flex items-center gap-3">
                <Badge className="bg-red-500/20 text-red-400 text-xs">
                  {disputesQuery.data.summary.pendingCount} pending
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatCurrency(disputesQuery.data.summary.totalDisputedAmount)} disputed
                </Badge>
              </div>
            )}
          </div>

          {disputesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-red-400" />
            </div>
          ) : (disputesQuery.data?.disputes || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-10 w-10 text-green-500/50 mb-3" />
                <p className="text-sm text-muted-foreground">No active disputes</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Load</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Carrier</TableHead>
                      <TableHead className="text-xs">Shipper</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(disputesQuery.data?.disputes || []).map((d: any) => (
                      <TableRow key={d.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell className="text-sm">#{d.id}</TableCell>
                        <TableCell className="text-sm">#{d.loadId}</TableCell>
                        <TableCell className="text-sm">{chargeTypeLabel(d.type)}</TableCell>
                        <TableCell className="text-sm">{d.carrierName}</TableCell>
                        <TableCell className="text-sm">{d.shipperName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{d.reason}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusColor(d.status)}`}>{d.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-red-400">
                          {formatCurrency(d.disputedAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* BILLING TAB                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-400" />
              Accessorial Billing Batch
            </h2>
            {billingQuery.data?.batchSummary && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {billingQuery.data.batchSummary.totalItems} items
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  {formatCurrency(billingQuery.data.batchSummary.totalAmount)} ready
                </Badge>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Process Batch
                </Button>
              </div>
            )}
          </div>

          {/* Batch summary by type */}
          {billingQuery.data?.batchSummary?.byType && billingQuery.data.batchSummary.byType.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {billingQuery.data.batchSummary.byType.map((bt: any) => (
                <Card key={bt.type} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{chargeTypeLabel(bt.type)}</p>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(bt.total)}</p>
                    <p className="text-xs text-muted-foreground">{bt.count} charges</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {billingQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-green-400" />
            </div>
          ) : (billingQuery.data?.pendingCharges || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-10 w-10 text-green-500/50 mb-3" />
                <p className="text-sm text-muted-foreground">No charges ready for billing</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">Load</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Facility</TableHead>
                      <TableHead className="text-xs">Shipper</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(billingQuery.data?.pendingCharges || []).map((c: any) => (
                      <TableRow key={c.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell className="text-sm">#{c.loadId}</TableCell>
                        <TableCell className="text-sm">{chargeTypeLabel(c.type)}</TableCell>
                        <TableCell className="text-sm">{c.facilityName}</TableCell>
                        <TableCell className="text-sm">{c.shipperName}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-amber-400">
                          {formatCurrency(c.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ANALYTICS TAB                                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Accessorial Analytics
          </h2>

          {analyticsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={formatCurrency(analyticsQuery.data?.totalRevenue || 0)} icon={DollarSign} accent="amber" />
                <StatCard title="Total Charges" value={analyticsQuery.data?.totalCharges || 0} icon={FileText} accent="orange" />
                <StatCard title="Avg Charge" value={formatCurrency(analyticsQuery.data?.avgChargeAmount || 0)} icon={BarChart3} accent="amber" />
                <StatCard title="Collection Rate" value={`${analyticsQuery.data?.collectionRate || 0}%`} icon={CheckCircle2} accent="green" />
              </div>

              {/* By Type breakdown */}
              {(analyticsQuery.data?.byType || []).length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Revenue by Charge Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(analyticsQuery.data?.byType || []).map((t: any, i: number) => {
                        const maxAmt = Math.max(...(analyticsQuery.data?.byType || []).map((x: any) => x.totalAmount));
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-28 truncate">{chargeTypeLabel(t.type)}</span>
                            <div className="flex-1">
                              <div
                                className="h-6 rounded bg-gradient-to-r from-amber-500/40 to-orange-500/40 flex items-center px-2"
                                style={{ width: `${maxAmt > 0 ? (t.totalAmount / maxAmt) * 100 : 0}%`, minWidth: "60px" }}
                              >
                                <span className="text-[10px] text-amber-200 font-medium">{formatCurrency(t.totalAmount)}</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground w-16 text-right">{t.count} charges</span>
                            <span className="text-xs text-zinc-400 w-20 text-right">avg {formatCurrency(t.avgAmount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By Month trend */}
              {(analyticsQuery.data?.byMonth || []).length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Monthly Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {(analyticsQuery.data?.byMonth || []).map((m: any, i: number) => {
                        const maxAmt = Math.max(...(analyticsQuery.data?.byMonth || []).map((x: any) => x.totalAmount));
                        const height = maxAmt > 0 ? (m.totalAmount / maxAmt) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-amber-400">{formatCurrency(m.totalAmount)}</span>
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-amber-600/60 to-orange-500/40"
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            <span className="text-[9px] text-muted-foreground">{m.month?.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By status */}
              {(analyticsQuery.data?.byStatus || []).length > 0 && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(analyticsQuery.data?.byStatus || []).map((s: any, i: number) => (
                        <div key={i} className={cn("flex items-center gap-2 p-2 rounded", isLight ? "bg-slate-100" : "bg-zinc-800/50")}>
                          <Badge className={`text-[10px] ${statusColor(s.status)}`}>{s.status}</Badge>
                          <div>
                            <p className="text-sm font-medium">{s.count}</p>
                            <p className="text-[10px] text-muted-foreground">{formatCurrency(s.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dispute / collection rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Dispute Rate</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{analyticsQuery.data?.disputeRate || 0}%</p>
                    <Progress value={analyticsQuery.data?.disputeRate || 0} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{analyticsQuery.data?.collectionRate || 0}%</p>
                    <Progress value={analyticsQuery.data?.collectionRate || 0} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Empty state */}
              {!(analyticsQuery.data?.totalCharges) && (
                <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-10 w-10 text-zinc-600 mb-3" />
                    <p className="text-sm text-muted-foreground">No analytics data available yet</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RULES TAB                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="rules" className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-400" />
            Auto-Detention Rules
          </h2>

          {rulesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {(rulesQuery.data?.rules || []).map((rule: any) => (
                <Card key={rule.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? "bg-green-500" : "bg-zinc-600"}`} />
                        <div>
                          <p className="text-sm font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">{rule.triggerType}</Badge>
                        {rule.freeTimeMinutes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Free: {formatMinutes(rule.freeTimeMinutes)}
                          </span>
                        )}
                        {rule.autoCreateClaim && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Auto-claim</Badge>
                        )}
                        <Badge className={`text-[10px] ${rule.enabled ? "bg-green-500/20 text-green-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History tab just for completeness */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" />
            Detention History
          </h2>

          {historyQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : (historyQuery.data?.events || []).length === 0 ? (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-muted-foreground">No detention history found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/60 border-zinc-800")}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isLight ? "border-slate-200" : "border-zinc-800"}>
                      <TableHead className="text-xs">Load</TableHead>
                      <TableHead className="text-xs">Facility</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Wait Time</TableHead>
                      <TableHead className="text-xs">Billable</TableHead>
                      <TableHead className="text-xs">Billing</TableHead>
                      <TableHead className="text-xs text-right">Charge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(historyQuery.data?.events || []).map((evt: any) => (
                      <TableRow key={evt.id} className={isLight ? "border-slate-100" : "border-zinc-800/50"}>
                        <TableCell className="text-sm">#{evt.loadId}</TableCell>
                        <TableCell className="text-sm">{evt.facilityName}</TableCell>
                        <TableCell className="text-sm">{evt.locationType}</TableCell>
                        <TableCell className="text-sm text-orange-400">{formatMinutes(evt.totalMinutes)}</TableCell>
                        <TableCell className="text-sm text-amber-400">{formatMinutes(evt.billableMinutes)}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusColor(evt.billingStatus)}`}>{evt.billingStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-amber-400">
                          {formatCurrency(evt.totalCharge)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
