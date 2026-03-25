/**
 * DISPATCH EXCEPTIONS — Unified Operations Alert Center
 * Integrates: Load exceptions + ZEUN Mechanics breakdowns + ELD HOS violations
 * 100% Dynamic — tRPC with live polling
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Wrench, Clock, Truck, Phone,
  CheckCircle, RefreshCw, MapPin, Package, Activity,
  ChevronDown, ChevronUp, Navigation, Timer, Zap,
  ShieldAlert, Eye, MessageSquare, ArrowRight, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

type UnifiedAlert = {
  id: string;
  source: "load" | "zeun" | "eld";
  type: string;
  severity: "critical" | "high" | "warning" | "info";
  title: string;
  description: string;
  driverName?: string;
  vehicle?: string;
  loadNumber?: string;
  location?: string;
  canDrive?: boolean;
  createdAt: string;
  status: string;
  raw?: any;
};

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25", label: "Critical" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/25", label: "High" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25", label: "Warning" },
  info: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/25", label: "Info" },
};

const SOURCE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  load: { icon: Package, label: "Load Exception", color: "text-violet-400", bg: "bg-violet-500/15" },
  zeun: { icon: Wrench, label: "ZEUN Mechanics", color: "text-orange-400", bg: "bg-orange-500/15" },
  eld: { icon: Activity, label: "ELD / HOS", color: "text-cyan-400", bg: "bg-cyan-500/15" },
};

export default function DispatchExceptions() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data sources
  const exceptionsQuery = (trpc as any).dispatch.getExceptions.useQuery({}, { refetchInterval: 30000 });
  const statsQuery = (trpc as any).dispatch.getExceptionStats.useQuery(undefined, { refetchInterval: 30000 });
  const breakdownsQuery = (trpc as any).zeunMechanics.getFleetBreakdowns.useQuery(
    { status: "OPEN", limit: 50 },
    { refetchInterval: 30000 }
  );
  const driversQuery = (trpc as any).eld?.getDriverStatus?.useQuery?.({}, { refetchInterval: 60000 });

  const resolveExceptionMutation = (trpc as any).dispatch.resolveException.useMutation({
    onSuccess: () => {
      toast.success("Exception resolved");
      exceptionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to resolve", { description: error.message }),
  });

  // Merge all data sources into unified alerts
  const buildAlerts = (): UnifiedAlert[] => {
    const alerts: UnifiedAlert[] = [];

    // 1. Load exceptions from dispatch router
    const loadExceptions: any[] = exceptionsQuery.data || [];
    for (const ex of loadExceptions) {
      alerts.push({
        id: `load-${ex.id}`,
        source: "load",
        type: ex.type || "delay",
        severity: ex.severity === "critical" ? "critical" : "warning",
        title: ex.loadNumber || "Load Exception",
        description: ex.message || "Operational exception detected",
        loadNumber: ex.loadNumber,
        createdAt: ex.createdAt || new Date().toISOString(),
        status: ex.status || "open",
        raw: ex,
      });
    }

    // 2. ZEUN Mechanics breakdowns
    const breakdowns: any[] = breakdownsQuery.data || [];
    for (const bd of breakdowns) {
      const severityMap: Record<string, "critical" | "high" | "warning"> = {
        CRITICAL: "critical", HIGH: "high", MEDIUM: "warning", LOW: "info" as any,
      };
      alerts.push({
        id: `zeun-${bd.id}`,
        source: "zeun",
        type: bd.issueCategory || "mechanical",
        severity: severityMap[bd.severity] || "warning",
        title: `Breakdown: ${(bd.issueCategory || "Unknown").replace(/_/g, " ")}`,
        description: bd.canDrive === false
          ? "Vehicle disabled — driver cannot continue. Immediate dispatch action needed."
          : "Driver reported mechanical issue — vehicle still operable.",
        driverName: bd.driverName || `Driver #${bd.driverId}`,
        vehicle: bd.vehicleVin || undefined,
        canDrive: bd.canDrive,
        location: bd.latitude && bd.longitude ? `${Number(bd.latitude).toFixed(4)}, ${Number(bd.longitude).toFixed(4)}` : undefined,
        createdAt: bd.createdAt || new Date().toISOString(),
        status: bd.status || "OPEN",
        raw: bd,
      });
    }

    // 3. ELD HOS violations
    const drivers: any[] = driversQuery?.data || [];
    for (const d of drivers) {
      if (d.hasViolation) {
        alerts.push({
          id: `eld-${d.driverId || d.id}`,
          source: "eld",
          type: "hos_violation",
          severity: "critical",
          title: "HOS Violation",
          description: `${d.name || "Driver"} has exceeded Hours of Service limits. Contact immediately to ensure FMCSA compliance.`,
          driverName: d.name || `Driver #${d.driverId}`,
          createdAt: d.lastUpdate || new Date().toISOString(),
          status: "open",
          raw: d,
        });
      }
      // Near-violation warning (drive time < 1h remaining)
      const driveRemaining = d.driveTimeRemaining ? d.driveTimeRemaining / 60 : null;
      if (driveRemaining !== null && driveRemaining < 60 && driveRemaining > 0 && !d.hasViolation) {
        alerts.push({
          id: `eld-warn-${d.driverId || d.id}`,
          source: "eld",
          type: "hos_warning",
          severity: "high",
          title: "HOS Warning — Low Drive Time",
          description: `${d.name || "Driver"} has < 1 hour drive time remaining (${Math.round(driveRemaining)} min). Plan accordingly.`,
          driverName: d.name || `Driver #${d.driverId}`,
          createdAt: d.lastUpdate || new Date().toISOString(),
          status: "open",
          raw: d,
        });
      }
    }

    return alerts;
  };

  const allAlerts = buildAlerts();

  // Filter
  const filtered = allAlerts.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      const match = [a.title, a.description, a.driverName, a.loadNumber, a.vehicle, a.type].filter(Boolean).join(" ").toLowerCase();
      if (!match.includes(q)) return false;
    }
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  // Sort by severity then recency
  const sevOrder: Record<string, number> = { critical: 0, high: 1, warning: 2, info: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const sd = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    if (sd !== 0) return sd;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats
  const criticalCount = allAlerts.filter(a => a.severity === "critical").length;
  const highCount = allAlerts.filter(a => a.severity === "high").length;
  const zeunCount = allAlerts.filter(a => a.source === "zeun").length;
  const hosCount = allAlerts.filter(a => a.source === "eld").length;
  const loadCount = allAlerts.filter(a => a.source === "load").length;

  const isLoading = exceptionsQuery.isLoading || breakdownsQuery.isLoading;

  const refetchAll = () => {
    exceptionsQuery.refetch();
    statsQuery.refetch();
    breakdownsQuery.refetch();
    driversQuery?.refetch?.();
  };

  const timeAgo = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h1 className="text-lg font-bold">Operations Alerts</h1>
          <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">{allAlerts.length} active</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 w-48 pl-8 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={refetchAll}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isLoading && "animate-spin")} />Sync
          </Button>
        </div>
      </div>

      {/* Stats Bar — 5 source/severity cards */}
      <div className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
        {[
          { label: "Critical", value: criticalCount, icon: AlertTriangle, color: "text-red-400", bgc: "bg-red-500/10", filter: "critical", filterType: "severity" },
          { label: "High", value: highCount, icon: ShieldAlert, color: "text-orange-400", bgc: "bg-orange-500/10", filter: "high", filterType: "severity" },
          { label: "Breakdowns", value: zeunCount, icon: Wrench, color: "text-amber-400", bgc: "bg-amber-500/10", filter: "zeun", filterType: "source" },
          { label: "HOS / ELD", value: hosCount, icon: Activity, color: "text-cyan-400", bgc: "bg-cyan-500/10", filter: "eld", filterType: "source" },
          { label: "Load Issues", value: loadCount, icon: Package, color: "text-violet-400", bgc: "bg-violet-500/10", filter: "load", filterType: "source" },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => {
              if (s.filterType === "severity") {
                setSeverityFilter(severityFilter === s.filter ? "all" : s.filter);
                setSourceFilter("all");
              } else {
                setSourceFilter(sourceFilter === s.filter ? "all" : s.filter);
                setSeverityFilter("all");
              }
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left",
              (sourceFilter === s.filter || severityFilter === s.filter)
                ? "bg-white/[0.04] border-white/[0.10]"
                : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]"
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bgc)}>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">{s.label}</div>
              <div className={cn("text-lg font-bold", s.value > 0 ? s.color : "text-slate-600")}>{s.value}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-slate-900/20">
        <Filter className="w-3 h-3 text-slate-500" />
        <span className="text-xs text-slate-500 uppercase">Source:</span>
        {[
          { label: "All", value: "all" },
          { label: "ZEUN Mechanics", value: "zeun" },
          { label: "ELD / HOS", value: "eld" },
          { label: "Load Ops", value: "load" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setSourceFilter(f.value)}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              sourceFilter === f.value ? "bg-orange-500/20 text-orange-400 font-semibold" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{sorted.length} alert{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading operations data...</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <CheckCircle className="w-12 h-12 mb-4 text-emerald-500/40" />
            <p className="text-sm font-semibold text-emerald-400">All Clear</p>
            <p className="text-xs text-slate-600 mt-1">No active alerts — all operations running smoothly</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {sorted.map(alert => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning;
              const src = SOURCE_CONFIG[alert.source] || SOURCE_CONFIG.load;
              const SrcIcon = src.icon;
              const isExpanded = expandedId === alert.id;

              return (
                <div key={alert.id}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left",
                      alert.severity === "critical" && "bg-red-500/[0.03] border-l-2 border-red-500",
                      alert.severity === "high" && "border-l-2 border-orange-500/50",
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    {/* Source icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", src.bg)}>
                      <SrcIcon className={cn("w-4 h-4", src.color)} />
                    </div>

                    {/* Alert content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={cn("border-0 text-xs font-bold", sev.bg, sev.text)}>{sev.label}</Badge>
                        <Badge className={cn("border-0 text-xs", src.bg, src.color)}>{src.label}</Badge>
                        <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {alert.driverName && <span className="flex items-center gap-1"><Truck className="w-2.5 h-2.5" />{alert.driverName}</span>}
                        {alert.loadNumber && <span className="flex items-center gap-1"><Package className="w-2.5 h-2.5" />{alert.loadNumber}</span>}
                        {alert.location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{alert.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(alert.createdAt)}</span>
                      </div>
                    </div>

                    {/* ZEUN: can drive indicator */}
                    {alert.source === "zeun" && (
                      <div className="shrink-0">
                        {alert.canDrive === false ? (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Disabled</Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">Can Drive</Badge>
                        )}
                      </div>
                    )}

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 bg-white/[0.01] border-b border-white/[0.04]">
                      <p className="text-xs text-slate-400 mb-3">{alert.description}</p>

                      {/* ZEUN-specific: breakdown details */}
                      {alert.source === "zeun" && alert.raw && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Issue Category</div>
                            <div className="text-xs font-semibold text-orange-400">{(alert.raw.issueCategory || "Unknown").replace(/_/g, " ")}</div>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Can Drive</div>
                            <div className={cn("text-xs font-semibold", alert.raw.canDrive ? "text-amber-400" : "text-red-400")}>
                              {alert.raw.canDrive ? "Yes — Operable" : "No — Disabled"}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Est. Cost</div>
                            <div className="text-xs font-semibold text-white">
                              {alert.raw.actualCost ? `$${Number(alert.raw.actualCost).toLocaleString()}` : "Pending"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ELD-specific: HOS details */}
                      {alert.source === "eld" && alert.raw && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Drive Time Left</div>
                            <div className={cn("text-xs font-semibold",
                              (alert.raw.driveTimeRemaining || 0) < 3600 ? "text-red-400" : "text-green-400"
                            )}>
                              {alert.raw.driveTimeRemaining ? `${Math.round(alert.raw.driveTimeRemaining / 60)} min` : "—"}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Current Status</div>
                            <div className="text-xs font-semibold text-cyan-400">{(alert.raw.currentStatus || alert.raw.status || "Unknown").replace(/_/g, " ")}</div>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">Violation</div>
                            <div className="text-xs font-semibold text-red-400">{alert.raw.hasViolation ? "Active Violation" : "Near Limit"}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {alert.source === "load" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-green-400 hover:text-green-300"
                            onClick={() => resolveExceptionMutation.mutate({ exceptionId: alert.raw?.id?.toString(), resolution: "Resolved by dispatcher" })}
                            disabled={resolveExceptionMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />Resolve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-cyan-400 hover:text-cyan-300">
                          <Phone className="w-3 h-3 mr-1" />Call Driver
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-violet-400 hover:text-violet-300">
                          <MessageSquare className="w-3 h-3 mr-1" />Message
                        </Button>
                        {alert.source === "zeun" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-orange-400 hover:text-orange-300"
                            onClick={() => navigate("/zeun-breakdown")}
                          >
                            <Wrench className="w-3 h-3 mr-1" />ZEUN Mechanics
                          </Button>
                        )}
                        {alert.source === "eld" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-cyan-400 hover:text-cyan-300"
                            onClick={() => navigate("/dispatch/eld")}
                          >
                            <Activity className="w-3 h-3 mr-1" />ELD Intelligence
                          </Button>
                        )}
                        {alert.loadNumber && (
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-slate-400 hover:text-slate-300"
                            onClick={() => navigate(`/loads/${alert.raw?.id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />View Load
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs text-slate-500 shrink-0">
        <div className="flex gap-4">
          {criticalCount > 0 && <span><span className="text-red-400 font-medium">{criticalCount}</span> critical</span>}
          {zeunCount > 0 && <span><span className="text-orange-400 font-medium">{zeunCount}</span> breakdowns</span>}
          {hosCount > 0 && <span><span className="text-cyan-400 font-medium">{hosCount}</span> HOS alerts</span>}
          {loadCount > 0 && <span><span className="text-violet-400 font-medium">{loadCount}</span> load issues</span>}
          {allAlerts.length === 0 && <span className="text-emerald-400">All systems nominal</span>}
        </div>
        <span>Auto-syncs every 30s · ZEUN + ELD + Load Ops</span>
      </div>
    </div>
  );
}
