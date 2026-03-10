/**
 * MULTI-MODAL & INTERMODAL TRANSPORTATION PAGE
 * Comprehensive intermodal operations: dashboard, bookings, containers, chassis,
 * rail coordination, port ops, drayage, transloading, per diem/demurrage, analytics.
 * Dark theme with orange/amber EusoTrip brand accents.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Ship, Train, Truck, Plane, Container, Anchor, MapPin, Clock,
  AlertTriangle, CheckCircle, XCircle, Package, DollarSign,
  TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight,
  Search, RefreshCw, Plus, Eye, Filter, Calendar,
  Box, Layers, Activity, Target, Percent, Scale,
  ChevronLeft, ChevronRight, Navigation, Timer, Gauge,
  FileText, ShieldAlert, CircleDollarSign, Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ── Accent utilities ──
const amber = (isLight: boolean) => isLight ? "text-amber-600" : "text-amber-400";
const amberBg = (isLight: boolean) => isLight ? "bg-amber-50" : "bg-amber-500/10";
const orangeBg = (isLight: boolean) => isLight ? "bg-orange-50" : "bg-orange-500/10";
const orange = (isLight: boolean) => isLight ? "text-orange-600" : "text-orange-400";

function KpiCard({ icon, label, value, trend, isLight, accent }: {
  icon: React.ReactNode; label: string; value: string | number; trend?: number; isLight: boolean; accent?: string;
}) {
  const cc = cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  return (
    <div className={cc}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", accent || amberBg(isLight))}>{icon}</div>
        {trend !== undefined && (
          <div className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-500" : "text-red-400")}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const modeIcon = (mode: string, className: string) => {
  switch (mode) {
    case "rail": return <Train className={className} />;
    case "ocean": return <Ship className={className} />;
    case "air": return <Plane className={className} />;
    case "intermodal": return <Layers className={className} />;
    default: return <Truck className={className} />;
  }
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-500/20 text-emerald-400",
    in_transit: "bg-blue-500/20 text-blue-400",
    pending: "bg-amber-500/20 text-amber-400",
    completed: "bg-slate-500/20 text-slate-400",
    cancelled: "bg-red-500/20 text-red-400",
    draft: "bg-zinc-500/20 text-zinc-400",
    en_route: "bg-blue-500/20 text-blue-400",
    at_ramp: "bg-cyan-500/20 text-cyan-400",
    loaded: "bg-emerald-500/20 text-emerald-400",
    empty_return: "bg-slate-500/20 text-slate-300",
    delayed: "bg-red-500/20 text-red-400",
    available: "bg-emerald-500/20 text-emerald-400",
    in_use: "bg-blue-500/20 text-blue-400",
    maintenance: "bg-amber-500/20 text-amber-400",
    out_of_service: "bg-red-500/20 text-red-400",
    cleared: "bg-emerald-500/20 text-emerald-400",
    hold: "bg-red-500/20 text-red-400",
    filed: "bg-blue-500/20 text-blue-400",
    under_review: "bg-amber-500/20 text-amber-400",
  };
  return (
    <Badge className={cn("text-xs border-0 capitalize", map[status] || "bg-slate-500/20 text-slate-400")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

// ── Tab: Dashboard ──
function DashboardTab({ isLight }: { isLight: boolean }) {
  const dashQ = (trpc as any).multiModal?.getMultiModalDashboard?.useQuery?.({}) || { data: null, isLoading: false };
  const d = dashQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (dashQ.isLoading) return <SectionSkeleton />;

  const summary = d?.summary || {};
  const kpis = d?.kpis || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Layers className={cn("w-5 h-5", amber(isLight))} />} label="Active Shipments" value={summary.activeShipments || 0} trend={5} isLight={isLight} />
        <KpiCard icon={<Container className={cn("w-5 h-5", orange(isLight))} />} label="Containers Tracked" value={summary.containersTracked || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<Box className={cn("w-5 h-5", amber(isLight))} />} label="Chassis In Use" value={summary.chassisInUse || 0} isLight={isLight} />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="Active Alerts" value={summary.alertCount || 0} isLight={isLight} accent="bg-red-500/10" />
      </div>

      {/* Mode Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className={cn("w-4 h-4", amber(isLight))} />Shipments by Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.byMode && Object.entries(summary.byMode).map(([mode, count]: [string, any]) => (
              <div key={mode} className="flex items-center gap-3">
                {modeIcon(mode, cn("w-4 h-4", amber(isLight)))}
                <span className={cn("text-sm capitalize w-24", isLight ? "text-slate-600" : "text-slate-300")}>{mode}</span>
                <div className="flex-1">
                  <Progress value={(count / (summary.activeShipments || 1)) * 100} className="h-2" />
                </div>
                <span className="text-sm font-semibold w-10 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className={cn("w-4 h-4", orange(isLight))} />On-Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kpis.onTimeRate && Object.entries(kpis.onTimeRate).map(([mode, rate]: [string, any]) => (
              <div key={mode} className="flex items-center gap-3">
                {modeIcon(mode, cn("w-4 h-4", orange(isLight)))}
                <span className={cn("text-sm capitalize w-24", isLight ? "text-slate-600" : "text-slate-300")}>{mode}</span>
                <div className="flex-1">
                  <Progress value={rate} className="h-2" />
                </div>
                <Badge className={cn("text-xs border-0", rate >= 90 ? "bg-emerald-500/20 text-emerald-400" : rate >= 80 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400")}>
                  {rate}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cost per Mile + Dwell Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className={cn("w-4 h-4", amber(isLight))} />Cost per Mile by Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpis.costPerMile && Object.entries(kpis.costPerMile).map(([mode, cost]: [string, any]) => (
              <div key={mode} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modeIcon(mode, "w-4 h-4 text-slate-400")}
                  <span className={cn("text-sm capitalize", isLight ? "text-slate-600" : "text-slate-300")}>{mode}</span>
                </div>
                <span className="font-semibold text-amber-500">${cost.toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className={cn("w-4 h-4", orange(isLight))} />Average Dwell Time (hours)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpis.avgDwellHours && Object.entries(kpis.avgDwellHours).map(([loc, hours]: [string, any]) => (
              <div key={loc} className="flex items-center justify-between">
                <span className={cn("text-sm capitalize", isLight ? "text-slate-600" : "text-slate-300")}>{loc}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{hours}h</span>
                  <Badge className={cn("text-xs border-0", hours <= 12 ? "bg-emerald-500/20 text-emerald-400" : hours <= 36 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400")}>
                    {hours <= 12 ? "Good" : hours <= 36 ? "Watch" : "High"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className={cc}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className={cn("w-4 h-4", amber(isLight))} />Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(d?.recentActivity || []).map((a: any) => (
            <div key={a.id} className={cn("flex items-center gap-3 p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/80")}>
              {modeIcon(a.mode, cn("w-4 h-4", amber(isLight)))}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.ref}</span>
                  {statusBadge(a.type.replace(/_/g, " "))}
                </div>
                <div className={cn("text-xs truncate", isLight ? "text-slate-500" : "text-slate-400")}>{a.detail}</div>
              </div>
              <span className={cn("text-xs whitespace-nowrap", isLight ? "text-slate-400" : "text-slate-500")}>
                {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Bookings ──
function BookingsTab({ isLight }: { isLight: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const bookingsQ = (trpc as any).multiModal?.getIntermodalBooking?.useQuery?.({
    page,
    limit: 15,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }) || { data: null, isLoading: false };

  const data = bookingsQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (bookingsQ.isLoading) return <SectionSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>
          Intermodal Bookings ({data?.total || 0})
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={cn("pl-9 w-52", isLight ? "bg-white" : "bg-slate-800 border-slate-700")}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className={cn("w-36", isLight ? "bg-white" : "bg-slate-800 border-slate-700")}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
            <Plus className="w-4 h-4 mr-1" />New Booking
          </Button>
        </div>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Booking #</th>
                  <th className="text-center px-4 py-3 font-medium">Mode</th>
                  <th className="text-left px-4 py-3 font-medium">Origin</th>
                  <th className="text-left px-4 py-3 font-medium">Destination</th>
                  <th className="text-center px-4 py-3 font-medium">Railroad</th>
                  <th className="text-center px-4 py-3 font-medium">Container</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Pickup</th>
                </tr>
              </thead>
              <tbody>
                {(data?.bookings || []).map((b: any, i: number) => (
                  <tr key={b.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.bookingNumber}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{b.commodity}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {modeIcon(b.mode, "w-4 h-4 text-amber-500")}
                        <span className="text-xs capitalize">{b.mode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{b.origin?.city}, {b.origin?.state}</td>
                    <td className="px-4 py-3 text-sm">{b.destination?.city}, {b.destination?.state}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{b.railroad}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-xs">{b.containerNumber}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{b.containerSize}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${(b.rate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3 text-center text-xs">{b.pickupDate}</td>
                  </tr>
                ))}
                {(!data?.bookings || data.bookings.length === 0) && (
                  <tr><td colSpan={9} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Containers ──
function ContainersTab({ isLight }: { isLight: boolean }) {
  const [search, setSearch] = useState("");
  const containersQ = (trpc as any).multiModal?.getContainerManagement?.useQuery?.({
    page: 1,
    limit: 25,
    search: search || undefined,
  }) || { data: null, isLoading: false };

  const data = containersQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (containersQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Container className={cn("w-5 h-5", amber(isLight))} />} label="Total Containers" value={summary.total || 0} isLight={isLight} />
        <KpiCard icon={<Navigation className="w-5 h-5 text-blue-400" />} label="In Transit" value={summary.inTransit || 0} isLight={isLight} accent="bg-blue-500/10" />
        <KpiCard icon={<Anchor className={cn("w-5 h-5", orange(isLight))} />} label="At Port" value={summary.atPort || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="Overdue" value={summary.overdue || 0} isLight={isLight} accent="bg-red-500/10" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search containers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-9", isLight ? "bg-white" : "bg-slate-800 border-slate-700")}
          />
        </div>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Container #</th>
                  <th className="text-center px-4 py-3 font-medium">Size</th>
                  <th className="text-center px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Shipping Line</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Last Free Day</th>
                  <th className="text-center px-4 py-3 font-medium">Customs</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.containers || []).map((c: any, i: number) => (
                  <tr key={c.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium font-mono">{c.containerNumber}</td>
                    <td className="px-4 py-3 text-center text-xs">{c.size}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-slate-500/20 text-slate-300 border-0 text-xs capitalize">{c.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.shippingLine}</td>
                    <td className="px-4 py-3 text-sm">{c.currentLocation || "Unknown"}</td>
                    <td className="px-4 py-3 text-center">
                      {c.lastFreeDay ? (
                        <Badge className={cn("text-xs border-0",
                          c.lfdDaysRemaining <= 0 ? "bg-red-500/20 text-red-400" :
                            c.lfdDaysRemaining <= 2 ? "bg-amber-500/20 text-amber-400" :
                              "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {c.lfdDaysRemaining <= 0 ? "PAST DUE" : `${c.lfdDaysRemaining}d left`}
                        </Badge>
                      ) : <span className="text-slate-500">--</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(c.customsStatus || "not_filed")}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(c.status)}</td>
                  </tr>
                ))}
                {(!data?.containers || data.containers.length === 0) && (
                  <tr><td colSpan={8} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No containers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Chassis ──
function ChassisTab({ isLight }: { isLight: boolean }) {
  const chassisQ = (trpc as any).multiModal?.getChassisManagement?.useQuery?.({
    page: 1,
    limit: 25,
  }) || { data: null, isLoading: false };

  const availQ = (trpc as any).multiModal?.getChassisAvailability?.useQuery?.({}) || { data: null, isLoading: false };

  const data = chassisQ.data;
  const avail = availQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (chassisQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Truck className={cn("w-5 h-5", amber(isLight))} />} label="Total Chassis" value={summary.total || 0} isLight={isLight} />
        <KpiCard icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} label="Available" value={summary.available || 0} isLight={isLight} accent="bg-emerald-500/10" />
        <KpiCard icon={<Activity className="w-5 h-5 text-blue-400" />} label="In Use" value={summary.inUse || 0} isLight={isLight} accent="bg-blue-500/10" />
        <KpiCard icon={<AlertTriangle className={cn("w-5 h-5", orange(isLight))} />} label="Maintenance" value={summary.maintenance || 0} isLight={isLight} accent={orangeBg(isLight)} />
      </div>

      {/* Availability by pool */}
      {avail?.pools && avail.pools.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className={cn("w-4 h-4", amber(isLight))} />Chassis Pool Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avail.pools.map((pool: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{pool.poolName}</span>
                  <span className={cn("text-xs ml-2", isLight ? "text-slate-400" : "text-slate-500")}>{pool.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <Progress value={(pool.available / Math.max(pool.total, 1)) * 100} className="h-2" />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{pool.available}/{pool.total}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className={cc}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className={cn("w-4 h-4", amber(isLight))} />Chassis Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Chassis ID</th>
                  <th className="text-center px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Pool</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Condition</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Days Out</th>
                </tr>
              </thead>
              <tbody>
                {(data?.chassis || []).map((ch: any, i: number) => (
                  <tr key={ch.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium font-mono">{ch.chassisId}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs capitalize">{(ch.type || "standard").replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{ch.pool || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{ch.location || "Unknown"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0",
                        ch.condition === "good" ? "bg-emerald-500/20 text-emerald-400" :
                          ch.condition === "fair" ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                      )}>{ch.condition || "good"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(ch.status)}</td>
                    <td className="px-4 py-3 text-center">{ch.daysOut || 0}</td>
                  </tr>
                ))}
                {(!data?.chassis || data.chassis.length === 0) && (
                  <tr><td colSpan={7} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No chassis data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Rail ──
function RailTab({ isLight }: { isLight: boolean }) {
  const [railroadFilter, setRailroadFilter] = useState<string>("all");
  const railQ = (trpc as any).multiModal?.getRailOperations?.useQuery?.({
    page: 1,
    limit: 20,
    railroad: railroadFilter !== "all" ? railroadFilter : undefined,
  }) || { data: null, isLoading: false };

  const schedQ = (trpc as any).multiModal?.getRailSchedules?.useQuery?.({}) || { data: null, isLoading: false };

  const data = railQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (railQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Train className={cn("w-5 h-5", amber(isLight))} />} label="Active Rail Shipments" value={summary.active || 0} isLight={isLight} />
        <KpiCard icon={<Navigation className="w-5 h-5 text-blue-400" />} label="En Route" value={summary.enRoute || 0} isLight={isLight} accent="bg-blue-500/10" />
        <KpiCard icon={<MapPin className={cn("w-5 h-5", orange(isLight))} />} label="At Ramp" value={summary.atRamp || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="Delayed" value={summary.delayed || 0} isLight={isLight} accent="bg-red-500/10" />
      </div>

      <div className="flex items-center gap-2">
        <Select value={railroadFilter} onValueChange={setRailroadFilter}>
          <SelectTrigger className={cn("w-40", isLight ? "bg-white" : "bg-slate-800 border-slate-700")}>
            <SelectValue placeholder="Railroad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Railroads</SelectItem>
            <SelectItem value="BNSF">BNSF</SelectItem>
            <SelectItem value="UP">Union Pacific</SelectItem>
            <SelectItem value="NS">Norfolk Southern</SelectItem>
            <SelectItem value="CSX">CSX</SelectItem>
            <SelectItem value="CN">CN</SelectItem>
            <SelectItem value="CP">CP</SelectItem>
            <SelectItem value="KCS">KCS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Train ID</th>
                  <th className="text-center px-4 py-3 font-medium">Railroad</th>
                  <th className="text-left px-4 py-3 font-medium">Origin Ramp</th>
                  <th className="text-left px-4 py-3 font-medium">Dest. Ramp</th>
                  <th className="text-center px-4 py-3 font-medium">Containers</th>
                  <th className="text-center px-4 py-3 font-medium">ETA</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.trains || []).map((t: any, i: number) => (
                  <tr key={t.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium font-mono">{t.trainId}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{t.railroad}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{t.originRamp}</td>
                    <td className="px-4 py-3 text-sm">{t.destinationRamp}</td>
                    <td className="px-4 py-3 text-center font-medium">{t.containerCount || 0}</td>
                    <td className="px-4 py-3 text-center text-xs">{t.eta || "TBD"}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(t.status)}</td>
                  </tr>
                ))}
                {(!data?.trains || data.trains.length === 0) && (
                  <tr><td colSpan={7} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No rail shipments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rail Schedules */}
      {schedQ.data?.schedules && schedQ.data.schedules.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className={cn("w-4 h-4", amber(isLight))} />Upcoming Rail Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedQ.data.schedules.slice(0, 8).map((s: any, i: number) => (
              <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/80")}>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">{s.railroad}</Badge>
                  <span className="font-medium text-sm">{s.trainSymbol}</span>
                </div>
                <div className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                  {s.origin} to {s.destination}
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium">{s.departureDay}</div>
                  <div className={cn(isLight ? "text-slate-400" : "text-slate-500")}>{s.transitDays}d transit</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Port Ops ──
function PortOpsTab({ isLight }: { isLight: boolean }) {
  const portQ = (trpc as any).multiModal?.getPortOperations?.useQuery?.({ page: 1, limit: 25 }) || { data: null, isLoading: false };
  const vesselQ = (trpc as any).multiModal?.getVesselSchedules?.useQuery?.({}) || { data: null, isLoading: false };
  const customsQ = (trpc as any).multiModal?.getCustomsClearance?.useQuery?.({ page: 1, limit: 15 }) || { data: null, isLoading: false };

  const data = portQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (portQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Anchor className={cn("w-5 h-5", amber(isLight))} />} label="Port Activities" value={summary.total || 0} isLight={isLight} />
        <KpiCard icon={<Ship className={cn("w-5 h-5", orange(isLight))} />} label="Vessels In Port" value={summary.vesselsInPort || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<ShieldAlert className="w-5 h-5 text-amber-500" />} label="Customs Holds" value={summary.customsHolds || 0} isLight={isLight} />
        <KpiCard icon={<Timer className="w-5 h-5 text-blue-400" />} label="Avg Dwell (hrs)" value={summary.avgDwellHours || 0} isLight={isLight} accent="bg-blue-500/10" />
      </div>

      {/* Vessel Schedule */}
      {vesselQ.data?.vessels && vesselQ.data.vessels.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ship className={cn("w-4 h-4", amber(isLight))} />Vessel Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                    <th className="text-left px-4 py-3 font-medium">Vessel</th>
                    <th className="text-left px-4 py-3 font-medium">Voyage</th>
                    <th className="text-left px-4 py-3 font-medium">Port</th>
                    <th className="text-center px-4 py-3 font-medium">ETA</th>
                    <th className="text-center px-4 py-3 font-medium">Containers</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vesselQ.data.vessels.slice(0, 10).map((v: any, i: number) => (
                    <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <td className="px-4 py-3 font-medium">{v.vesselName}</td>
                      <td className="px-4 py-3 text-sm">{v.voyage}</td>
                      <td className="px-4 py-3 text-sm">{v.port}</td>
                      <td className="px-4 py-3 text-center text-xs">{v.eta}</td>
                      <td className="px-4 py-3 text-center">{v.containerCount || 0}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(v.status || "en_route")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customs Clearance */}
      {customsQ.data?.clearances && customsQ.data.clearances.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className={cn("w-4 h-4", orange(isLight))} />Customs Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                    <th className="text-left px-4 py-3 font-medium">Container</th>
                    <th className="text-left px-4 py-3 font-medium">Entry #</th>
                    <th className="text-left px-4 py-3 font-medium">Port</th>
                    <th className="text-center px-4 py-3 font-medium">Filed</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customsQ.data.clearances.map((c: any, i: number) => (
                    <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <td className="px-4 py-3 font-mono text-sm">{c.containerNumber}</td>
                      <td className="px-4 py-3 text-sm">{c.entryNumber || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">{c.port}</td>
                      <td className="px-4 py-3 text-center text-xs">{c.filedDate || "--"}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          <Eye className="w-3 h-3 mr-1" />Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Drayage ──
function DrayageTab({ isLight }: { isLight: boolean }) {
  const [search, setSearch] = useState("");
  const drayQ = (trpc as any).multiModal?.getDrayageManagement?.useQuery?.({
    page: 1,
    limit: 20,
    search: search || undefined,
  }) || { data: null, isLoading: false };

  const data = drayQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (drayQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Truck className={cn("w-5 h-5", amber(isLight))} />} label="Active Drayage" value={summary.active || 0} isLight={isLight} />
        <KpiCard icon={<Clock className={cn("w-5 h-5", orange(isLight))} />} label="Pending Pickup" value={summary.pendingPickup || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} label="Delivered Today" value={summary.deliveredToday || 0} isLight={isLight} accent="bg-emerald-500/10" />
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", amber(isLight))} />} label="Avg Rate" value={`$${summary.avgRate || 0}`} trend={-3} isLight={isLight} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search drayage orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-9", isLight ? "bg-white" : "bg-slate-800 border-slate-700")}
          />
        </div>
        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
          <Plus className="w-4 h-4 mr-1" />New Drayage
        </Button>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Order #</th>
                  <th className="text-center px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Container</th>
                  <th className="text-left px-4 py-3 font-medium">Port/Ramp</th>
                  <th className="text-left px-4 py-3 font-medium">Delivery</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-center px-4 py-3 font-medium">Driver</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o: any, i: number) => (
                  <tr key={o.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0 capitalize",
                        o.type === "import" ? "bg-blue-500/20 text-blue-400" :
                          o.type === "export" ? "bg-purple-500/20 text-purple-400" :
                            "bg-slate-500/20 text-slate-400"
                      )}>{o.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{o.containerNumber}</td>
                    <td className="px-4 py-3 text-sm">{o.portOrRamp}</td>
                    <td className="px-4 py-3 text-sm">{o.deliveryLocation || "TBD"}</td>
                    <td className="px-4 py-3 text-right font-medium">${(o.rate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-sm">{o.driver || "Unassigned"}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(o.status)}</td>
                  </tr>
                ))}
                {(!data?.orders || data.orders.length === 0) && (
                  <tr><td colSpan={8} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No drayage orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Transload ──
function TransloadTab({ isLight }: { isLight: boolean }) {
  const transQ = (trpc as any).multiModal?.getTransloading?.useQuery?.({ page: 1, limit: 20 }) || { data: null, isLoading: false };
  const data = transQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (transQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Warehouse className={cn("w-5 h-5", amber(isLight))} />} label="Active Transloads" value={summary.active || 0} isLight={isLight} />
        <KpiCard icon={<Package className={cn("w-5 h-5", orange(isLight))} />} label="Units Processed" value={summary.unitsProcessed || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<Timer className="w-5 h-5 text-blue-400" />} label="Avg Turnaround" value={`${summary.avgTurnaroundHours || 0}h`} isLight={isLight} accent="bg-blue-500/10" />
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", amber(isLight))} />} label="Avg Cost" value={`$${summary.avgCost || 0}`} isLight={isLight} />
      </div>

      <div className="flex items-center justify-end">
        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
          <Plus className="w-4 h-4 mr-1" />New Transload
        </Button>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Order #</th>
                  <th className="text-left px-4 py-3 font-medium">Warehouse</th>
                  <th className="text-left px-4 py-3 font-medium">Inbound Mode</th>
                  <th className="text-left px-4 py-3 font-medium">Outbound Mode</th>
                  <th className="text-center px-4 py-3 font-medium">Units</th>
                  <th className="text-right px-4 py-3 font-medium">Cost</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o: any, i: number) => (
                  <tr key={o.id || i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{o.warehouse}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {modeIcon(o.inboundMode || "ocean", "w-3.5 h-3.5 text-blue-400")}
                        <span className="text-xs capitalize">{o.inboundMode || "ocean"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {modeIcon(o.outboundMode || "truck", "w-3.5 h-3.5 text-amber-400")}
                        <span className="text-xs capitalize">{o.outboundMode || "truck"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{o.units || 0}</td>
                    <td className="px-4 py-3 text-right font-medium">${(o.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(o.status)}</td>
                  </tr>
                ))}
                {(!data?.orders || data.orders.length === 0) && (
                  <tr><td colSpan={7} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No transload orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Per Diem / Demurrage ──
function PerDiemTab({ isLight }: { isLight: boolean }) {
  const perDiemQ = (trpc as any).multiModal?.getPerDiemTracking?.useQuery?.({ page: 1, limit: 20 }) || { data: null, isLoading: false };
  const demurrQ = (trpc as any).multiModal?.getDemurrageDetention?.useQuery?.({ page: 1, limit: 20 }) || { data: null, isLoading: false };
  const lfdQ = (trpc as any).multiModal?.getLastFreeDayAlerts?.useQuery?.({}) || { data: null, isLoading: false };
  const freeTimeQ = (trpc as any).multiModal?.getFreeTimeManagement?.useQuery?.({}) || { data: null, isLoading: false };

  const perDiem = perDiemQ.data;
  const demurr = demurrQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (perDiemQ.isLoading) return <SectionSkeleton />;

  const pdSummary = perDiem?.summary || {};
  const dmSummary = demurr?.summary || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<CircleDollarSign className="w-5 h-5 text-red-400" />} label="Per Diem Charges" value={`$${(pdSummary.totalCharges || 0).toLocaleString()}`} isLight={isLight} accent="bg-red-500/10" />
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", orange(isLight))} />} label="Demurrage Total" value={`$${(dmSummary.totalDemurrage || 0).toLocaleString()}`} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} label="Containers at Risk" value={pdSummary.atRisk || 0} isLight={isLight} />
        <KpiCard icon={<Clock className={cn("w-5 h-5", amber(isLight))} />} label="Avg Days Over Free" value={pdSummary.avgDaysOver || 0} isLight={isLight} />
      </div>

      {/* Last Free Day Alerts */}
      {lfdQ.data?.alerts && lfdQ.data.alerts.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />Last Free Day Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lfdQ.data.alerts.slice(0, 8).map((a: any, i: number) => (
              <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/80")}>
                <div className="flex items-center gap-3">
                  <Badge className={cn("text-xs border-0",
                    a.daysRemaining <= 0 ? "bg-red-500/20 text-red-400" :
                      a.daysRemaining <= 1 ? "bg-amber-500/20 text-amber-400" :
                        "bg-blue-500/20 text-blue-400"
                  )}>
                    {a.daysRemaining <= 0 ? "OVERDUE" : `${a.daysRemaining}d left`}
                  </Badge>
                  <span className="font-mono text-sm">{a.containerNumber}</span>
                </div>
                <div className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                  LFD: {a.lastFreeDay} | {a.port}
                </div>
                <span className="text-sm font-medium text-red-400">
                  ${a.dailyRate || 0}/day
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per Diem Tracking Table */}
      <Card className={cc}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CircleDollarSign className={cn("w-4 h-4", amber(isLight))} />Per Diem Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Container</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Free Days</th>
                  <th className="text-center px-4 py-3 font-medium">Days Used</th>
                  <th className="text-right px-4 py-3 font-medium">Daily Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Accrued</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(perDiem?.tracking || []).map((t: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-mono text-sm">{t.containerNumber}</td>
                    <td className="px-4 py-3 text-sm">{t.location}</td>
                    <td className="px-4 py-3 text-center">{t.freeDays}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={t.daysUsed > t.freeDays ? "text-red-400 font-semibold" : ""}>{t.daysUsed}</span>
                    </td>
                    <td className="px-4 py-3 text-right">${t.dailyRate || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-400">
                      ${(t.accruedCharges || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0",
                        t.daysUsed <= t.freeDays ? "bg-emerald-500/20 text-emerald-400" :
                          t.daysUsed <= t.freeDays + 3 ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                      )}>
                        {t.daysUsed <= t.freeDays ? "Within Free" : "Accruing"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!perDiem?.tracking || perDiem.tracking.length === 0) && (
                  <tr><td colSpan={7} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No per diem data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Free Time Summary */}
      {freeTimeQ.data?.lines && freeTimeQ.data.lines.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className={cn("w-4 h-4", orange(isLight))} />Free Time by Shipping Line
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {freeTimeQ.data.lines.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{l.shippingLine}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{l.freeDays} free days</span>
                  <span className="text-sm font-medium">${l.dailyRate}/day after</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Analytics ──
function AnalyticsTab({ isLight }: { isLight: boolean }) {
  const optQ = (trpc as any).multiModal?.getModeOptimization?.useQuery?.({}) || { data: null, isLoading: false };
  const costQ = (trpc as any).multiModal?.getCostByMode?.useQuery?.({}) || { data: null, isLoading: false };
  const transitQ = (trpc as any).multiModal?.getTransitTimeComparison?.useQuery?.({}) || { data: null, isLoading: false };
  const analyticsQ = (trpc as any).multiModal?.getMultiModalAnalytics?.useQuery?.({}) || { data: null, isLoading: false };

  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (optQ.isLoading) return <SectionSkeleton />;

  const opt = optQ.data;
  const cost = costQ.data;
  const transit = transitQ.data;
  const analytics = analyticsQ.data;

  return (
    <div className="space-y-6">
      {/* Analytics KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<BarChart3 className={cn("w-5 h-5", amber(isLight))} />} label="Total Shipments" value={analytics.totalShipments || 0} trend={12} isLight={isLight} />
          <KpiCard icon={<DollarSign className={cn("w-5 h-5", orange(isLight))} />} label="Total Spend" value={`$${((analytics.totalSpend || 0) / 1000).toFixed(0)}k`} isLight={isLight} accent={orangeBg(isLight)} />
          <KpiCard icon={<Target className="w-5 h-5 text-emerald-500" />} label="On-Time Overall" value={`${analytics.overallOnTime || 0}%`} isLight={isLight} accent="bg-emerald-500/10" />
          <KpiCard icon={<TrendingUp className={cn("w-5 h-5", amber(isLight))} />} label="Cost Savings" value={`$${((analytics.costSavings || 0) / 1000).toFixed(0)}k`} trend={8} isLight={isLight} />
        </div>
      )}

      {/* Mode Optimization Recommendations */}
      {opt?.recommendations && opt.recommendations.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className={cn("w-4 h-4", amber(isLight))} />Mode Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {opt.recommendations.map((r: any, i: number) => (
              <div key={i} className={cn("p-4 rounded-lg border", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {modeIcon(r.currentMode, "w-4 h-4 text-slate-400")}
                    <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Current: {r.currentMode}</span>
                    <span className="text-slate-500 mx-1">to</span>
                    {modeIcon(r.recommendedMode, "w-4 h-4 text-amber-500")}
                    <span className="font-medium text-sm capitalize">{r.recommendedMode}</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    Save ${(r.estimatedSavings || 0).toLocaleString()}
                  </Badge>
                </div>
                <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>{r.reason}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className={isLight ? "text-slate-400" : "text-slate-500"}>Lane: {r.lane}</span>
                  <span className={isLight ? "text-slate-400" : "text-slate-500"}>Volume: {r.volume} loads/mo</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cost by Mode */}
      {cost?.modes && cost.modes.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className={cn("w-4 h-4", orange(isLight))} />Cost Comparison by Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Mode</th>
                  <th className="text-right px-4 py-3 font-medium">Total Spend</th>
                  <th className="text-right px-4 py-3 font-medium">Avg per Load</th>
                  <th className="text-right px-4 py-3 font-medium">Cost/Mile</th>
                  <th className="text-center px-4 py-3 font-medium">Volume</th>
                  <th className="text-center px-4 py-3 font-medium">On-Time %</th>
                </tr>
              </thead>
              <tbody>
                {cost.modes.map((m: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100" : "border-slate-700/50")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {modeIcon(m.mode, cn("w-4 h-4", amber(isLight)))}
                        <span className="capitalize font-medium">{m.mode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">${(m.totalSpend || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${(m.avgPerLoad || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-500">${(m.costPerMile || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{m.volume}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0",
                        m.onTimeRate >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                          m.onTimeRate >= 80 ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                      )}>{m.onTimeRate}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Transit Time Comparison */}
      {transit?.lanes && transit.lanes.length > 0 && (
        <Card className={cc}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className={cn("w-4 h-4", amber(isLight))} />Transit Time Comparison by Lane
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transit.lanes.slice(0, 8).map((l: any, i: number) => (
              <div key={i} className={cn("p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/80")}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                    {l.origin} to {l.destination}
                  </span>
                  <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{l.distance} mi</span>
                </div>
                <div className="flex items-center gap-4">
                  {l.modes && Object.entries(l.modes).map(([mode, data]: [string, any]) => (
                    <div key={mode} className="flex items-center gap-1.5">
                      {modeIcon(mode, "w-3.5 h-3.5 text-slate-400")}
                      <span className="text-xs capitalize">{mode}:</span>
                      <span className="text-xs font-medium">{data.days}d</span>
                      <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>(${data.cost})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
export default function MultiModal() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Multi-Modal & Intermodal
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Rail, ocean, drayage, transloading, container tracking, chassis management & mode optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-0 px-3 py-1">
            <Layers className="w-3 h-3 mr-1" />Intermodal Module
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("flex flex-wrap h-auto gap-1 p-1 rounded-xl", isLight ? "bg-slate-100" : "bg-slate-800/80")}>
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="containers" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Containers
          </TabsTrigger>
          <TabsTrigger value="chassis" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Chassis
          </TabsTrigger>
          <TabsTrigger value="rail" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Rail
          </TabsTrigger>
          <TabsTrigger value="port-ops" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Port Ops
          </TabsTrigger>
          <TabsTrigger value="drayage" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Drayage
          </TabsTrigger>
          <TabsTrigger value="transload" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Transload
          </TabsTrigger>
          <TabsTrigger value="per-diem" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Per Diem/Demurrage
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab isLight={isLight} /></TabsContent>
        <TabsContent value="bookings"><BookingsTab isLight={isLight} /></TabsContent>
        <TabsContent value="containers"><ContainersTab isLight={isLight} /></TabsContent>
        <TabsContent value="chassis"><ChassisTab isLight={isLight} /></TabsContent>
        <TabsContent value="rail"><RailTab isLight={isLight} /></TabsContent>
        <TabsContent value="port-ops"><PortOpsTab isLight={isLight} /></TabsContent>
        <TabsContent value="drayage"><DrayageTab isLight={isLight} /></TabsContent>
        <TabsContent value="transload"><TransloadTab isLight={isLight} /></TabsContent>
        <TabsContent value="per-diem"><PerDiemTab isLight={isLight} /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab isLight={isLight} /></TabsContent>
      </Tabs>
    </div>
  );
}
