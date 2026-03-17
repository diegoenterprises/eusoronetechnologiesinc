/**
 * CROSS-BORDER & INTERNATIONAL SHIPPING — Operations Center
 * Full cross-border operations: dashboard, border wait times, customs docs,
 * duties calculator, C-TPAT/FAST, eManifest, broker management,
 * export controls, cabotage, bonded carrier, analytics.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Globe, MapPin, Clock, ShieldCheck, FileText, Calculator, Truck,
  AlertTriangle, CheckCircle, XCircle, Search, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, BarChart3, DollarSign, Package,
  Ship, Zap, Star, ChevronRight, Activity, Eye, RefreshCw,
  Calendar, Building2, Lock, Landmark, BookOpen, Filter, Flag,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Globe },
  { id: "waitTimes", label: "Border Wait Times", icon: Clock },
  { id: "customs", label: "Customs Docs", icon: FileText },
  { id: "duties", label: "Duties Calculator", icon: Calculator },
  { id: "compliance", label: "C-TPAT / FAST", icon: ShieldCheck },
  { id: "emanifest", label: "eManifest", icon: Ship },
  { id: "brokers", label: "Brokers", icon: Users },
  { id: "exportControl", label: "Export Controls", icon: Lock },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Severity colors ─────────────────────────────────────────────────────────

function severityColor(s: string) {
  switch (s) {
    case "low": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "moderate": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-400",
    ACCEPTED: "bg-emerald-500/20 text-emerald-400",
    MATCHED: "bg-emerald-500/20 text-emerald-400",
    CLEARED: "bg-emerald-500/20 text-emerald-400",
    RELEASED: "bg-emerald-500/20 text-emerald-400",
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    CERTIFIED: "bg-teal-500/20 text-teal-400",
    COMPLIANT: "bg-teal-500/20 text-teal-400",
    IN_CUSTOMS: "bg-amber-500/20 text-amber-400",
    REVIEW: "bg-amber-500/20 text-amber-400",
    PENDING: "bg-amber-500/20 text-amber-400",
    PRE_ARRIVAL: "bg-blue-500/20 text-blue-400",
    AT_BORDER: "bg-cyan-500/20 text-cyan-400",
    IN_TRANSIT: "bg-blue-500/20 text-blue-400",
    EXPIRING_SOON: "bg-orange-500/20 text-orange-400",
    EXPIRED: "bg-red-500/20 text-red-400",
    DRAFT: "bg-slate-500/20 text-slate-400",
  };
  return map[s] || "bg-slate-500/20 text-slate-400";
}

// ─── Shared styles ───────────────────────────────────────────────────────────

type TabStyleProps = { isLight?: boolean; cardCls?: string; headerCls?: string; mutedCls?: string };

const accentGradient = "bg-gradient-to-r from-teal-500 to-emerald-500";
const accentText = "text-teal-400";

// ─── Component ───────────────────────────────────────────────────────────────

export default function CrossBorderShipping() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const cardCls = isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50 backdrop-blur-sm";
  const headerCls = isLight ? "text-slate-900 font-semibold" : "text-white font-semibold";
  const mutedCls = isLight ? "text-slate-500 text-sm" : "text-slate-400 text-sm";

  return (
    <div className={`${isLight ? "min-h-screen bg-slate-50 text-slate-900" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"} p-4 md:p-6 space-y-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", accentGradient)}>
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cross-Border Operations</h1>
            <p className={mutedCls}>US - Canada - Mexico international shipping management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
            <Activity className="w-3 h-3 mr-1" /> Live
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex overflow-x-auto gap-1 ${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-xl p-1`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : isLight
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "waitTimes" && <WaitTimesTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "customs" && <CustomsDocsTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "duties" && <DutiesCalculatorTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "compliance" && <ComplianceTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "emanifest" && <EManifestTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "brokers" && <BrokersTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "exportControl" && <ExportControlTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
      {activeTab === "analytics" && <AnalyticsTab isLight={isLight} cardCls={cardCls} headerCls={headerCls} mutedCls={mutedCls} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const dash = (trpc as any).crossBorderShipping?.getCrossBorderDashboard?.useQuery?.({}, { refetchInterval: 300_000 }) ?? { data: null, isLoading: true };
  const waitQ = (trpc as any).crossBorderShipping?.getBorderWaitTimes?.useQuery?.({}, { refetchInterval: 300_000 }) ?? { data: null, isLoading: true };
  const d = dash.data as any;
  const w = waitQ.data as any;

  if (dash.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={Truck} label="Active Crossings" value={d?.summary?.activeCrossings ?? 0} accent="teal" />
        <KpiCard icon={Clock} label="Avg Crossing Time" value={`${d?.summary?.averageCrossingTimeMinutes ?? 0}m`} accent="cyan" />
        <KpiCard icon={ShieldCheck} label="Compliance Rate" value={`${d?.summary?.complianceRate ?? 0}%`} accent="emerald" />
        <KpiCard icon={Package} label="Pending Clearance" value={d?.summary?.pendingClearance ?? 0} accent="amber" />
        <KpiCard icon={DollarSign} label="Duties Paid" value={`$${((d?.summary?.totalDutiesPaid ?? 0) / 1000).toFixed(0)}K`} accent="blue" />
        <KpiCard icon={Globe} label="Crossings (Period)" value={d?.summary?.totalCrossingsThisPeriod ?? 0} accent="purple" />
      </div>

      {/* Active Crossings */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
            <Truck className="w-5 h-5 text-teal-400" /> Active Crossings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {d?.activeCrossings?.map((cx: any) => (
              <div key={cx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-2 h-2 rounded-full", cx.status === "CLEARED" ? "bg-emerald-400" : cx.status === "AT_BORDER" ? "bg-cyan-400 animate-pulse" : cx.status === "IN_CUSTOMS" ? "bg-amber-400 animate-pulse" : "bg-blue-400")}>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{cx.loadId} — {cx.driver}</div>
                    <div className={cn(mutedCls, "truncate")}>{cx.origin} &rarr; {cx.destination}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusBadge(cx.status)}>{cx.status.replace(/_/g, " ")}</Badge>
                  <Badge className={cx.documentsComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                    {cx.documentsComplete ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Alerts + Compliance Snapshot */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Border Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d?.borderAlerts?.map((a: any) => (
              <div key={a.id} className={cn("p-3 rounded-lg border", severityColor(a.severity))}>
                <div className="text-sm font-medium">{a.message}</div>
                <div className="text-xs opacity-70 mt-1">{a.portOfEntry}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Compliance Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d?.complianceSnapshot && (
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="C-TPAT" value={d.complianceSnapshot.ctpatStatus} color="teal" />
                <MiniStat label="C-TPAT Tier" value={d.complianceSnapshot.ctpatTier} color="teal" />
                <MiniStat label="FAST Cards Active" value={d.complianceSnapshot.fastCardsActive} color="cyan" />
                <MiniStat label="FAST Expiring" value={d.complianceSnapshot.fastCardsExpiringSoon} color={d.complianceSnapshot.fastCardsExpiringSoon > 0 ? "amber" : "emerald"} />
                <MiniStat label="Bond Status" value={d.complianceSnapshot.bondedCarrierStatus} color="emerald" />
                <MiniStat label="Bond Amount" value={`$${(d.complianceSnapshot.bondAmount || 0).toLocaleString()}`} color="blue" />
                <MiniStat label="eManifests Pending" value={d.complianceSnapshot.eManifestsPending} color="amber" />
                <MiniStat label="eManifests Accepted" value={d.complianceSnapshot.eManifestsAccepted} color="emerald" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Wait Time Strip */}
      {w?.ports && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Clock className="w-5 h-5 text-cyan-400" /> Live Border Wait Times
              {w?.live && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2 text-[10px]">LIVE</Badge>}
              {w?.live === false && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2 text-[10px]">UNAVAILABLE</Badge>}
            </CardTitle>
            {w?.dataSource && <p className="text-[10px] text-slate-500 mt-0.5">{w.dataSource}</p>}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(w.ports as any[]).slice(0, 12).map((p: any) => (
                <div key={p.id} className={cn("p-3 rounded-lg border text-center", severityColor(p.severity))}>
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <div className="text-xl font-bold mt-1">{p.currentWaitMinutes}m</div>
                  <div className="text-[10px] opacity-70">{p.border}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BORDER WAIT TIMES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function WaitTimesTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [borderFilter, setBorderFilter] = useState<"ALL" | "US-CA" | "US-MX">("ALL");
  const q = (trpc as any).crossBorderShipping?.getBorderWaitTimes?.useQuery?.({ border: borderFilter }) ?? { data: null, isLoading: true };
  const seasonal = (trpc as any).crossBorderShipping?.getSeasonalBorderPatterns?.useQuery?.({ border: borderFilter }) ?? { data: null, isLoading: false };
  const ports = (q.data as any)?.ports ?? [];
  const patterns = (seasonal.data as any)?.patterns ?? [];

  if (q.isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {(["ALL", "US-CA", "US-MX"] as const).map(b => (
          <Button
            key={b}
            variant={borderFilter === b ? "default" : "outline"}
            size="sm"
            onClick={() => setBorderFilter(b)}
            className={cn(borderFilter === b ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400 hover:text-white")}
          >
            {b === "ALL" ? "All Borders" : b === "US-CA" ? "US-Canada" : "US-Mexico"}
          </Button>
        ))}
      </div>

      {/* Wait Time Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(ports as any[]).map((p: any) => (
          <Card key={p.id} className={cn(cardCls, "hover:border-teal-500/30 transition-colors")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  <div className={cn(mutedCls, "text-xs")}>{p.border} | {p.state}</div>
                </div>
                <Badge className={cn("text-xs", severityColor(p.severity))}>{p.severity}</Badge>
              </div>
              <div className="mt-4 flex items-end gap-4">
                <div>
                  <div className="text-xs text-slate-500">Current</div>
                  <div className="text-2xl font-bold text-white">{p.currentWaitMinutes}<span className="text-sm text-slate-400">min</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Average</div>
                  <div className="text-lg text-slate-300">{p.averageWaitMinutes}<span className="text-sm text-slate-400">min</span></div>
                </div>
                {p.fastLaneWaitMinutes !== null && (
                  <div>
                    <div className="text-xs text-teal-400">FAST</div>
                    <div className="text-lg text-teal-400">{p.fastLaneWaitMinutes}<span className="text-sm text-teal-500/70">min</span></div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {p.trend === "decreasing" ? (
                  <span className="text-emerald-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> Improving</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Increasing</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seasonal Patterns */}
      {patterns.length > 0 && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Calendar className="w-5 h-5 text-teal-400" /> Seasonal Crossing Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(patterns as any[]).map((p: any) => (
                <div key={p.month} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{p.month}</span>
                    <span className={cn("text-xs font-bold", p.volumeIndex >= 95 ? "text-red-400" : p.volumeIndex >= 85 ? "text-amber-400" : "text-emerald-400")}>
                      Vol: {p.volumeIndex}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Avg wait: {p.avgWaitMinutes}min</div>
                  <div className="text-xs text-slate-500 mt-1">{p.notes}</div>
                </div>
              ))}
            </div>
            {(seasonal.data as any)?.recommendations && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-teal-400">Optimization Tips</h4>
                {((seasonal.data as any).recommendations as string[]).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <ChevronRight className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMS DOCS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CustomsDocsTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [origin, setOrigin] = useState<"US" | "CA" | "MX">("US");
  const [destination, setDestination] = useState<"US" | "CA" | "MX">("CA");
  const [shipType, setShipType] = useState<"general" | "hazmat" | "perishable" | "oversize" | "livestock" | "controlled">("general");

  const q = (trpc as any).crossBorderShipping?.getCustomsDocumentation?.useQuery?.({ origin, destination, shipmentType: shipType }) ?? { data: null, isLoading: true };
  const compQ = (trpc as any).crossBorderShipping?.getCrossBorderCompliance?.useQuery?.({ origin, destination, shipmentType: shipType }) ?? { data: null, isLoading: false };
  const docs = q.data as any;
  const checklist = compQ.data as any;

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <Card className={cardCls}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Origin</label>
              <div className="flex gap-1">
                {(["US", "CA", "MX"] as const).map(c => (
                  <Button key={c} size="sm" variant={origin === c ? "default" : "outline"} onClick={() => setOrigin(c)}
                    className={cn(origin === c ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400")}>
                    <Flag className="w-3 h-3 mr-1" />{c}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Destination</label>
              <div className="flex gap-1">
                {(["US", "CA", "MX"] as const).map(c => (
                  <Button key={c} size="sm" variant={destination === c ? "default" : "outline"} onClick={() => setDestination(c)}
                    className={cn(destination === c ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400")}>
                    <Flag className="w-3 h-3 mr-1" />{c}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <div className="flex flex-wrap gap-1">
                {(["general", "hazmat", "perishable", "oversize", "controlled"] as const).map(t => (
                  <Button key={t} size="sm" variant={shipType === t ? "default" : "outline"} onClick={() => setShipType(t)}
                    className={cn("text-xs", shipType === t ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400")}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {q.isLoading ? <LoadingSkeleton rows={4} /> : docs && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Required Documents */}
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
                <FileText className="w-5 h-5 text-red-400" /> Required Documents ({docs.totalRequired})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {docs.requiredDocuments?.map((doc: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-sm font-medium text-white">{doc.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 ml-6">{doc.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Optional + Tips */}
          <div className="space-y-4">
            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
                  <BookOpen className="w-5 h-5 text-teal-400" /> Optional Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docs.optionalDocuments?.map((doc: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="text-sm font-medium text-white">{doc.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-6">{doc.description}</p>
                  </div>
                ))}
                {(!docs.optionalDocuments || docs.optionalDocuments.length === 0) && (
                  <p className={mutedCls}>No optional documents for this route/type.</p>
                )}
              </CardContent>
            </Card>

            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
                  <Zap className="w-5 h-5 text-amber-400" /> Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docs.tips?.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {tip}
                  </div>
                ))}
                <div className="mt-2 p-2 rounded bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                  Estimated prep time: {docs.estimatedPrepTimeHours} hours
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Compliance Checklist */}
      {checklist && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Compliance Checklist — {checklist.route} ({checklist.totalItems} items, {checklist.criticalItems} critical)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {checklist.checklist?.map((item: any, i: number) => (
                <div key={i} className={cn("p-2 rounded-lg border text-xs", item.critical ? "border-red-500/30 bg-red-500/5" : "border-slate-700/30 bg-slate-800/30")}>
                  <div className="flex items-center gap-2">
                    {item.critical ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /> : <CheckCircle className="w-3 h-3 text-slate-400 shrink-0" />}
                    <span className="text-white">{item.requirement}</span>
                  </div>
                  <div className="text-slate-500 ml-5">{item.category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUTIES CALCULATOR TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DutiesCalculatorTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [htsSearch, setHtsSearch] = useState("");
  const htsQ = (trpc as any).crossBorderShipping?.getHtsClassification?.useQuery?.({ query: htsSearch || undefined }) ?? { data: null, isLoading: false };
  const calcQ = (trpc as any).crossBorderShipping?.calculateDutiesAndTaxes?.useQuery?.({
    origin: "MX" as const, destination: "US" as const,
    commodities: [
      { htsCode: "8704.21", description: "Motor vehicles for transport", value: 45000, weight: 3200, quantity: 1 },
      { htsCode: "3901.10", description: "Polyethylene pellets", value: 12000, weight: 8000, quantity: 40 },
    ],
    usmcaCertified: true,
  }) ?? { data: null, isLoading: false };
  const currQ = (trpc as any).crossBorderShipping?.getCurrencyManagement?.useQuery?.({}) ?? { data: null, isLoading: false };

  const htsData = htsQ.data as any;
  const calcData = calcQ.data as any;
  const currData = currQ.data as any;

  return (
    <div className="space-y-6">
      {/* HTS Lookup */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
            <Search className="w-5 h-5 text-teal-400" /> HTS Classification Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by description or HTS code..."
              value={htsSearch}
              onChange={e => setHtsSearch(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          {htsData?.results && (
            <div className="space-y-2">
              {(htsData.results as any[]).map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div>
                    <span className="text-sm font-mono text-teal-400">{h.code}</span>
                    <span className="text-sm text-white ml-3">{h.description}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-400">Duty: <span className="text-white">{h.dutyRate}%</span></span>
                    {h.usmcaEligible && <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">USMCA Eligible</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Calculation */}
      {calcData && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Calculator className="w-5 h-5 text-emerald-400" /> Duties & Taxes Estimate — {calcData.route}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calcData.lineItems?.map((li: any) => (
                <div key={li.lineNumber} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white font-medium">{li.description}</span>
                      <span className="text-xs text-slate-400 ml-2">({li.htsCode})</span>
                    </div>
                    <span className="text-sm text-white">${li.declaredValue.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-slate-400">Duty: <span className="text-white">${li.dutyAmount.toLocaleString()}</span> ({li.dutyRate}%)</span>
                    <span className="text-slate-400">{li.taxName}: <span className="text-white">${li.taxAmount.toLocaleString()}</span></span>
                    {li.usmcaSavings > 0 && <span className="text-emerald-400">USMCA Savings: ${li.usmcaSavings.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
              {/* Summary */}
              <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-slate-400 text-xs block">Total Duties</span><span className="text-white font-bold">${calcData.summary.totalDuty.toLocaleString()}</span></div>
                  <div><span className="text-slate-400 text-xs block">Total Taxes</span><span className="text-white font-bold">${calcData.summary.totalTax.toLocaleString()}</span></div>
                  <div><span className="text-slate-400 text-xs block">Fees</span><span className="text-white font-bold">${(calcData.summary.merchandiseProcessingFee + calcData.summary.brokerageFee).toLocaleString()}</span></div>
                  <div><span className="text-teal-400 text-xs block">Grand Total</span><span className="text-teal-400 font-bold text-lg">${calcData.summary.grandTotal.toLocaleString()}</span></div>
                </div>
                {calcData.summary.usmcaSavings > 0 && (
                  <div className="mt-3 text-sm text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> USMCA savings: ${calcData.summary.usmcaSavings.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currency Management */}
      {currData && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <DollarSign className="w-5 h-5 text-blue-400" /> Exchange Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(currData.exchangeRates || {}).map(([cur, rate]) => (
                <div key={cur} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
                  <div className="text-xs text-slate-400">{currData.baseCurrency} &rarr; {cur}</div>
                  <div className="text-lg font-bold text-white">{(rate as number).toFixed(4)}</div>
                </div>
              ))}
            </div>
            {currData.recentInvoices && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-300">Recent Cross-Border Invoices</h4>
                {(currData.recentInvoices as any[]).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-slate-800/30 text-sm">
                    <span className="text-slate-400">{inv.loadId}</span>
                    <span className="text-white">{inv.currency} {inv.amount.toLocaleString()}</span>
                    <span className="text-teal-400">= USD {inv.baseAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// C-TPAT / FAST COMPLIANCE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ComplianceTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const ctpat = (trpc as any).crossBorderShipping?.getCtpatStatus?.useQuery?.({}) ?? { data: null, isLoading: true };
  const fast = (trpc as any).crossBorderShipping?.getFastCardManagement?.useQuery?.({}) ?? { data: null, isLoading: true };
  const bonded = (trpc as any).crossBorderShipping?.getBondedCarrierStatus?.useQuery?.({}) ?? { data: null, isLoading: true };
  const cabotage = (trpc as any).crossBorderShipping?.getCabotageCompliance?.useQuery?.({}) ?? { data: null, isLoading: true };
  const itBonds = (trpc as any).crossBorderShipping?.getInTransitBondTracking?.useQuery?.({}) ?? { data: null, isLoading: false };
  const naftaQ = (trpc as any).crossBorderShipping?.getNaftaCertificates?.useQuery?.({}) ?? { data: null, isLoading: false };

  const ct = ctpat.data as any;
  const ft = fast.data as any;
  const bd = bonded.data as any;
  const cb = cabotage.data as any;
  const it = itBonds.data as any;
  const na = naftaQ.data as any;

  if (ctpat.isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      {/* C-TPAT Status */}
      {ct && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <ShieldCheck className="w-5 h-5 text-teal-400" /> C-TPAT Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <div className="text-xs text-slate-400">Status</div>
                <Badge className={ct.certified ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                  {ct.certified ? "CERTIFIED" : "NOT CERTIFIED"}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-400">Tier</div>
                <span className="text-white font-semibold">{ct.tier}</span>
              </div>
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <span className={cn("text-lg font-bold", ct.complianceScore >= 90 ? "text-emerald-400" : "text-amber-400")}>{ct.complianceScore}/100</span>
              </div>
              <div>
                <div className="text-xs text-slate-400">Expiry</div>
                <span className="text-white text-sm">{new Date(ct.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
            {/* Requirements */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ct.requirements?.map((r: any) => (
                <div key={r.area} className={cn("p-3 rounded-lg border", r.status === "compliant" ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5")}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{r.area}</span>
                    <span className={cn("text-sm font-bold", r.score >= 90 ? "text-emerald-400" : "text-amber-400")}>{r.score}</span>
                  </div>
                  <Badge className={cn("mt-1 text-[10px]", r.status === "compliant" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
            {/* Benefits */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-teal-400 mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {ct.benefits?.map((b: string, i: number) => (
                  <Badge key={i} className="bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">{b}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAST Cards */}
      {ft && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Zap className="w-5 h-5 text-cyan-400" /> FAST Card Management ({ft.totalCards} cards)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <MiniStat label="Active" value={ft.activeCards} color="emerald" />
              <MiniStat label="Expiring Soon" value={ft.expiringSoon} color="amber" />
              <MiniStat label="Expired" value={ft.expired} color="red" />
              <MiniStat label="Pending Renewal" value={ft.pendingRenewal} color="blue" />
            </div>
            <div className="space-y-2">
              {ft.cards?.map((card: any) => (
                <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", card.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                      {card.driverName.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{card.driverName}</div>
                      <div className="text-xs text-slate-400">{card.border} | Exp: {new Date(card.expiryDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Badge className={statusBadge(card.status)}>{card.status.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonded Carrier + Cabotage */}
      <div className="grid md:grid-cols-2 gap-4">
        {bd && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
                <Landmark className="w-5 h-5 text-blue-400" /> Bonded Carrier Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Status" value={bd.status} color="emerald" />
                <MiniStat label="Bond Amount" value={`$${(bd.bondAmount || 0).toLocaleString()}`} color="blue" />
                <MiniStat label="Bond Type" value={bd.bondType} color="teal" />
                <MiniStat label="Surety" value={bd.surety} color="slate" />
                <MiniStat label="Annual Premium" value={`$${(bd.premiumAnnual || 0).toLocaleString()}`} color="amber" />
                <MiniStat label="Risk Level" value={bd.complianceHistory?.riskLevel} color="emerald" />
              </div>
              <div className="text-xs text-slate-400">
                Districts: {bd.customsDistricts?.join(", ")}
              </div>
            </CardContent>
          </Card>
        )}

        {cb && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Cabotage Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cb.rules?.map((rule: any) => (
                <div key={rule.country} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-medium text-white">{rule.country}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{rule.description}</p>
                  <p className="text-[10px] text-red-400 mt-1">Penalty: {rule.penalty}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* In-Transit Bonds */}
      {it && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Ship className="w-5 h-5 text-blue-400" /> In-Transit Bond Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {it.activeBonds?.map((bond: any) => (
                <div key={bond.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div>
                    <div className="text-sm text-white font-medium">{bond.loadId} — {bond.commodity}</div>
                    <div className="text-xs text-slate-400">{bond.entryPort} &rarr; {bond.exitPort} | Value: ${bond.value.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusBadge(bond.status)}>{bond.status.replace(/_/g, " ")}</Badge>
                    <Badge className={bond.custodyChain === "INTACT" || bond.custodyChain === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                      {bond.custodyChain}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* USMCA Certificates */}
      {na && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Globe className="w-5 h-5 text-teal-400" /> USMCA Certificates of Origin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {na.certificates?.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div>
                    <div className="text-sm text-white font-medium">{cert.goods}</div>
                    <div className="text-xs text-slate-400">{cert.exporter} &rarr; {cert.importer}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusBadge(cert.status)}>{cert.status}</Badge>
                    {cert.dutySavings > 0 && <span className="text-xs text-emerald-400">Saved ${cert.dutySavings.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// eMANIFEST TAB
// ═══════════════════════════════════════════════════════════════════════════════

function EManifestTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const aceQ = (trpc as any).crossBorderShipping?.getAceEmanifest?.useQuery?.({}) ?? { data: null, isLoading: true };
  const aciQ = (trpc as any).crossBorderShipping?.getAciEmanifest?.useQuery?.({}) ?? { data: null, isLoading: true };
  const parsQ = (trpc as any).crossBorderShipping?.getParsNumbers?.useQuery?.({}) ?? { data: null, isLoading: false };

  const ace = aceQ.data as any;
  const aci = aciQ.data as any;
  const pars = parsQ.data as any;

  if (aceQ.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* ACE (US) */}
      {ace && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Flag className="w-5 h-5 text-blue-400" /> ACE eManifest (US CBP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ace.manifests?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium">{m.loadId} — {m.carrier?.name}</div>
                    <div className="text-xs text-slate-400 truncate">Port: {m.portOfEntry} | SCAC: {m.carrier?.scac} | Shipments: {m.shipmentCount}</div>
                    <div className="text-xs text-slate-500">PAPS: {m.paps}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={statusBadge(m.status)}>{m.status}</Badge>
                    <Badge className={statusBadge(m.isfStatus)}>ISF: {m.isfStatus}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACI (Canada) */}
      {aci && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Flag className="w-5 h-5 text-red-400" /> ACI eManifest (CBSA Canada)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aci.manifests?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium">{m.loadId} — {m.carrier?.name}</div>
                    <div className="text-xs text-slate-400 truncate">Port: {m.portOfEntry} | CCN: {m.ccn}</div>
                    <div className="text-xs text-slate-500">PARS: {m.pars}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={statusBadge(m.status)}>{m.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PARS / PAPS */}
      {pars && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <Package className="w-5 h-5 text-teal-400" /> PARS / PAPS Number Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <h4 className="text-sm font-semibold text-red-400 mb-1">PARS (Canada)</h4>
                <p className="text-xs text-slate-400">{pars.guide?.PARS}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">PAPS (US)</h4>
                <p className="text-xs text-slate-400">{pars.guide?.PAPS}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {pars.numbers?.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div>
                    <Badge className={n.type === "PARS" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}>{n.type}</Badge>
                    <span className="text-xs text-slate-400 ml-2 font-mono">{n.number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{n.loadId}</span>
                    <Badge className={statusBadge(n.status)}>{n.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROKERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function BrokersTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [borderFilter, setBorderFilter] = useState<"ALL" | "US-CA" | "US-MX" | "BOTH">("ALL");
  const q = (trpc as any).crossBorderShipping?.getBrokerDirectory?.useQuery?.({ border: borderFilter }) ?? { data: null, isLoading: true };
  const brokers = (q.data as any)?.brokers ?? [];

  if (q.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["ALL", "US-CA", "US-MX", "BOTH"] as const).map(b => (
          <Button key={b} size="sm" variant={borderFilter === b ? "default" : "outline"} onClick={() => setBorderFilter(b)}
            className={cn(borderFilter === b ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400")}>
            {b === "ALL" ? "All" : b}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(brokers as any[]).map((broker: any) => (
          <Card key={broker.id} className={cn(cardCls, "hover:border-teal-500/30 transition-colors")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{broker.name}</h3>
                  <p className="text-xs text-slate-400">{broker.company}</p>
                </div>
                <Badge className={broker.available ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
                  {broker.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-sm text-white font-bold">{broker.rating}</span>
                </div>
                <span className="text-xs text-slate-400">{broker.totalClearances.toLocaleString()} clearances</span>
                <span className="text-xs text-slate-400">Avg {broker.avgClearanceHours}h</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {broker.specialties?.map((s: string) => (
                  <Badge key={s} className="bg-teal-500/10 text-teal-300 border-teal-500/20 text-[10px]">{s}</Badge>
                ))}
              </div>
              <div className="flex gap-2 text-[10px]">
                {broker.ctpatCertified && <Badge className="bg-emerald-500/10 text-emerald-400">C-TPAT</Badge>}
                {broker.fastCertified && <Badge className="bg-cyan-500/10 text-cyan-400">FAST</Badge>}
                {broker.hazmatCapable && <Badge className="bg-amber-500/10 text-amber-400">HAZMAT</Badge>}
              </div>
              <div className="mt-3 flex gap-2 text-xs text-slate-400">
                <span>Ports: {broker.portsServed?.join(", ")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT CONTROLS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ExportControlTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [entityInput, setEntityInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const ecQ = (trpc as any).crossBorderShipping?.getExportControls?.useQuery?.(
    { entityName: searchQuery || undefined },
    { enabled: searchQuery.length >= 2 }
  ) ?? { data: null, isLoading: false };
  const dgQ = (trpc as any).crossBorderShipping?.getDangerousGoodsCrossBorder?.useQuery?.({ origin: "US" as const, destination: "CA" as const }) ?? { data: null, isLoading: false };

  const ec = ecQ.data as any;
  const dg = dgQ.data as any;
  const sr = ec?.screeningResult;
  const hasMatches = sr?.matches?.length > 0;

  const riskColor = (risk: string) => {
    if (risk === "CRITICAL") return { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" };
    if (risk === "HIGH") return { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400" };
    if (risk === "MEDIUM") return { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" };
    if (risk === "LOW") return { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400" };
    return { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" };
  };

  const handleScreen = () => { if (entityInput.trim().length >= 2) setSearchQuery(entityInput.trim()); };

  return (
    <div className="space-y-6">
      {/* Entity Screening */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
            <Lock className="w-5 h-5 text-red-400" /> Export Control Screening
            {sr && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2 text-[10px]">LIVE OFAC</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter entity name to screen..."
              value={entityInput}
              onChange={e => setEntityInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScreen()}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button className={cn(accentGradient, "text-white border-0")} size="sm" onClick={handleScreen} disabled={ecQ.isLoading}>
              <Search className="w-4 h-4 mr-1" /> {ecQ.isLoading ? "Screening..." : "Screen"}
            </Button>
          </div>

          {ecQ.isLoading && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center text-sm text-slate-400">
              Screening against OFAC SDN + Consolidated lists...
            </div>
          )}

          {sr && !ecQ.isLoading && (
            <div className="space-y-3">
              {/* Risk Banner */}
              <div className={cn("flex items-center gap-3 p-4 rounded-lg border", riskColor(sr.overallRisk).bg)}>
                {hasMatches ? <AlertTriangle className={cn("w-6 h-6", riskColor(sr.overallRisk).text)} /> : <CheckCircle className="w-6 h-6 text-emerald-400" />}
                <div className="flex-1">
                  <div className={cn("text-sm font-semibold", riskColor(sr.overallRisk).text)}>
                    Risk: {sr.overallRisk} — &quot;{sr.entityName}&quot;
                  </div>
                  <div className="text-xs text-slate-400">
                    {hasMatches
                      ? `${sr.matches.length} potential match${sr.matches.length > 1 ? "es" : ""} found across ${sr.totalEntriesScreened?.toLocaleString() ?? 0} screened entities`
                      : `No matches found — screened against ${sr.totalEntriesScreened?.toLocaleString() ?? 0} entities`}
                  </div>
                </div>
              </div>

              {/* Matches */}
              {hasMatches && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-400">Potential Matches</h4>
                  {sr.matches.slice(0, 10).map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{m.name}</span>
                        <Badge className={cn("text-[10px]", m.score >= 95 ? "bg-red-500/20 text-red-400 border-red-500/30" : m.score >= 85 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30")}>
                          {m.score}% match
                        </Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-400">
                        {m.country && <span>Country: {m.country}</span>}
                        <span>Type: {m.type}</span>
                        <span>List: {m.listSource}</span>
                        <span>UID: {m.uid}</span>
                      </div>
                      {m.remarks && <div className="text-xs text-slate-500 mt-1 truncate">{m.remarks}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Lists Screened */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {sr.listsScreened?.map((list: any) => (
                  <div key={list.name} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-xs">
                    <div className="flex items-center gap-1">
                      {list.match ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <CheckCircle className="w-3 h-3 text-emerald-400" />}
                      <span className="text-white truncate">{list.name}</span>
                    </div>
                    <div className="text-slate-500 ml-4">{list.source}{list.entriesCount ? ` (${list.entriesCount.toLocaleString()})` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ec?.guidance && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-300">Guidance</h4>
              {ec.guidance.map((g: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <ChevronRight className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" />
                  {g}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DG Cross-Border */}
      {dg && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(headerCls, "flex items-center gap-2")}>
              <AlertTriangle className="w-5 h-5 text-amber-400" /> DG/HAZMAT Cross-Border: {dg.route}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/30">
                    <th className="text-left p-2 text-slate-400">Topic</th>
                    <th className="text-left p-2 text-blue-400">US (DOT)</th>
                    <th className="text-left p-2 text-red-400">Canada (TDG)</th>
                    <th className="text-left p-2 text-green-400">Mexico (NOM)</th>
                  </tr>
                </thead>
                <tbody>
                  {dg.keyDifferences?.map((diff: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="p-2 text-white font-medium">{diff.topic}</td>
                      <td className="p-2 text-slate-300">{diff.us}</td>
                      <td className="p-2 text-slate-300">{diff.ca}</td>
                      <td className="p-2 text-slate-300">{diff.mx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-amber-400">Cross-Border Requirements</h4>
              {dg.crossBorderRequirements?.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ isLight = false, cardCls = "", headerCls = "", mutedCls = "" }: TabStyleProps) {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const q = (trpc as any).crossBorderShipping?.getCrossBorderAnalytics?.useQuery?.({ period }) ?? { data: null, isLoading: true };
  const d = q.data as any;

  if (q.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {(["week", "month", "quarter", "year"] as const).map(p => (
          <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}
            className={cn(period === p ? accentGradient + " text-white border-0" : "border-slate-700 text-slate-400")}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {d && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <KpiCard icon={Globe} label="Total Crossings" value={d.kpis?.totalCrossings} accent="teal" />
            <KpiCard icon={Clock} label="Avg Time" value={`${d.kpis?.averageCrossingTimeMinutes}m`} accent="cyan" />
            <KpiCard icon={ShieldCheck} label="Compliance" value={`${d.kpis?.complianceRate}%`} accent="emerald" />
            <KpiCard icon={TrendingUp} label="On-Time" value={`${d.kpis?.onTimeRate}%`} accent="blue" />
            <KpiCard icon={DollarSign} label="Duties Paid" value={`$${((d.kpis?.dutiesPaid ?? 0) / 1000).toFixed(0)}K`} accent="amber" />
            <KpiCard icon={Zap} label="FAST Utilization" value={`${d.kpis?.fastLaneUtilization}%`} accent="cyan" />
          </div>

          {/* Trends */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrendCard label="Crossings" value={d.trends?.crossingsChange} />
            <TrendCard label="Costs" value={d.trends?.costChange} />
            <TrendCard label="Compliance" value={d.trends?.complianceChange} />
            <TrendCard label="Wait Times" value={d.trends?.waitTimeChange} inverted />
          </div>

          {/* Top Routes + Ports */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(headerCls, "flex items-center gap-2 text-sm")}>
                  <MapPin className="w-4 h-4 text-teal-400" /> Top Routes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.topRoutes?.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/20">
                    <div className="text-xs">
                      <span className="text-white">{r.origin}</span>
                      <span className="text-slate-500"> &rarr; </span>
                      <span className="text-white">{r.destination}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-400">{r.crossings} crossings</span>
                      <span className="text-teal-400">{r.compliance}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(headerCls, "flex items-center gap-2 text-sm")}>
                  <Building2 className="w-4 h-4 text-cyan-400" /> Top Ports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.topPorts?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/20">
                    <span className="text-xs text-white">{p.name}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-400">{p.crossings} crossings</span>
                      <span className="text-amber-400">{p.avgWait}m avg</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(headerCls, "flex items-center gap-2 text-sm")}>
                <DollarSign className="w-4 h-4 text-emerald-400" /> Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {d.costBreakdown && Object.entries(d.costBreakdown).map(([key, val]) => (
                  <div key={key} className={cn("p-3 rounded-lg text-center", key === "total" ? "bg-teal-500/10 border border-teal-500/20" : "bg-slate-800/50 border border-slate-700/30")}>
                    <div className="text-xs text-slate-400 capitalize">{key}</div>
                    <div className={cn("text-sm font-bold", key === "total" ? "text-teal-400" : "text-white")}>
                      ${((val as number) / 1000).toFixed(1)}K
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  const colors: Record<string, string> = {
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  const c = colors[accent] || colors.teal;
  return (
    <div className={cn("p-4 rounded-xl border", c)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const textMap: Record<string, string> = {
    teal: "text-teal-400", cyan: "text-cyan-400", emerald: "text-emerald-400",
    amber: "text-amber-400", blue: "text-blue-400", red: "text-red-400", slate: "text-slate-300",
  };
  return (
    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold", textMap[color] || "text-white")}>{value}</div>
    </div>
  );
}

function TrendCard({ label, value, inverted }: { label: string; value: number; inverted?: boolean }) {
  const positive = inverted ? value < 0 : value > 0;
  return (
    <div className={cn("p-3 rounded-xl border", positive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={cn("text-lg font-bold flex items-center gap-1", positive ? "text-emerald-400" : "text-red-400")}>
        {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(value)}%
      </div>
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full bg-slate-800/50 rounded-xl" />
      ))}
    </div>
  );
}
