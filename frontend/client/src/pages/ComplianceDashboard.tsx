/**
 * COMPLIANCE DASHBOARD PAGE
 * State-of-the-art compliance engine powered by smart document resolution.
 * Resolves required documents based on company state, DOT/MC, ops type,
 * equipment, endorsements, and operating states.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, CheckCircle, AlertTriangle, Clock, FileText,
  Truck, ExternalLink, ChevronDown, ChevronRight, MapPin,
  XCircle, Upload, Eye, Lock, Fuel, Scale, Flame,
  Building2, Landmark, ScrollText, Wrench, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "Federal Authority": <Landmark className="w-4 h-4 text-blue-400" />,
  "Federal Compliance": <Shield className="w-4 h-4 text-indigo-400" />,
  "Insurance & Bonds": <Lock className="w-4 h-4 text-purple-400" />,
  "Tax & Financial": <Building2 className="w-4 h-4 text-emerald-400" />,
  "Hazmat Compliance": <Flame className="w-4 h-4 text-orange-400" />,
  "Equipment Compliance": <Wrench className="w-4 h-4 text-cyan-400" />,
  "Vehicle & Fleet": <Truck className="w-4 h-4 text-blue-400" />,
  "Safety Programs": <Shield className="w-4 h-4 text-green-400" />,
  "Legal Agreements": <ScrollText className="w-4 h-4 text-slate-400" />,
  "Operations": <BookOpen className="w-4 h-4 text-yellow-400" />,
  "CDL & Licensing": <FileText className="w-4 h-4 text-cyan-400" />,
  "Endorsements": <Scale className="w-4 h-4 text-amber-400" />,
  "Safety & Testing": <AlertTriangle className="w-4 h-4 text-red-400" />,
  "Employment": <Building2 className="w-4 h-4 text-teal-400" />,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VERIFIED: { label: "Verified", color: "text-green-400", bg: "bg-green-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  UPLOADED: { label: "Uploaded", color: "text-blue-400", bg: "bg-blue-500/20", icon: <Upload className="w-3.5 h-3.5" /> },
  PENDING_REVIEW: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: <Eye className="w-3.5 h-3.5" /> },
  EXPIRING_SOON: { label: "Expiring", color: "text-orange-400", bg: "bg-orange-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  EXPIRED: { label: "Expired", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  MISSING: { label: "Missing", color: "text-slate-400", bg: "bg-slate-500/10", icon: <FileText className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: "Critical", color: "text-red-400", bg: "bg-red-500/20" },
  HIGH: { label: "High", color: "text-orange-400", bg: "bg-orange-500/20" },
  MEDIUM: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  LOW: { label: "Low", color: "text-slate-400", bg: "bg-slate-500/20" },
};

function IRPComplianceSection() {
  const irpStatusQuery = (trpc as any).compliance?.getIRPStatus?.useQuery?.();
  const irpRegsQuery = (trpc as any).compliance?.getIRPRegistrations?.useQuery?.({ limit: 10 });
  const status = irpStatusQuery?.data || { cabCardStatus: "unknown", registeredStates: 0, renewalDue: null };
  const regs: any[] = irpRegsQuery?.data || [];

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          IRP Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400 mb-4">International Registration Plan -- apportioned vehicle registrations across jurisdictions</p>
        {irpStatusQuery?.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-20 w-full rounded-lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Cab Card Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {status.cabCardStatus === "active" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  <span className={status.cabCardStatus === "active" ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                    {status.cabCardStatus === "active" ? "Active" : status.cabCardStatus === "inactive" ? "Inactive" : "No Data"}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Registered States</p>
                <p className="text-2xl font-bold text-white mt-1">{status.registeredStates}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Renewal Due</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">
                    {status.renewalDue ? new Date(status.renewalDue).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {regs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">No IRP registrations found</div>
              ) : regs.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">{reg.state}</span>
                    <div>
                      <span className="text-white text-sm font-medium">Max Weight: {(reg.maxWeight || 80000).toLocaleString()} lbs</span>
                      <p className="text-xs text-slate-500">Distance %: {reg.distancePercent}%</p>
                    </div>
                  </div>
                  <Badge className={cn("border-0 text-xs", reg.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{reg.status}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const isDriver = user?.role === "DRIVER";
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const complianceQuery = isDriver
    ? (trpc as any).documentCenter.getDriverComplianceProfile.useQuery()
    : (trpc as any).documentCenter.getMyComplianceProfile.useQuery();

  const data = complianceQuery.data as any;
  const loading = complianceQuery.isLoading;

  const score = data?.complianceScore ?? 0;
  const ds = data?.documentStatus || {};
  const reqs: any[] = data?.requirements || [];

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of reqs) {
      if (filterStatus !== "ALL" && r.docStatus !== filterStatus) continue;
      const g = r.group || "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(r);
    }
    return map;
  }, [reqs, filterStatus]);

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  const getScoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-red-400";
  const getScoreBg = (s: number) => s >= 80 ? "bg-green-500/20" : s >= 50 ? "bg-yellow-500/20" : "bg-red-500/20";
  const getScoreBorder = (s: number) => s >= 80 ? "border-green-500/30" : s >= 50 ? "border-yellow-500/30" : "border-red-500/30";

  const stateGroups = useMemo(() => {
    const stateG: string[] = [];
    grouped.forEach((_, k) => { if (k.startsWith("State Compliance:")) stateG.push(k); });
    return stateG;
  }, [grouped]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Compliance Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.registeredState ? (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Registered State: <strong className="text-white">{data.registeredState}</strong> | Role: <strong className="text-white">{data.role}</strong></span>
            ) : "State-aware compliance resolution"}
          </p>
        </div>
        {data?.canOperate !== undefined && (
          <Badge className={cn("text-sm px-3 py-1.5 border-0", data.canOperate ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {data.canOperate ? <><CheckCircle className="w-4 h-4 mr-1.5" />Authorized to Operate</> : <><XCircle className="w-4 h-4 mr-1.5" />Cannot Operate -- Critical Docs Missing</>}
          </Badge>
        )}
      </div>

      {/* Score Card */}
      {loading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl bg-gradient-to-r", score >= 80 ? "from-green-500/10 to-emerald-500/10" : score >= 50 ? "from-yellow-500/10 to-orange-500/10" : "from-red-500/10 to-orange-500/10", getScoreBorder(score))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Compliance Score</p>
                <p className={cn("text-5xl font-bold tabular-nums", getScoreColor(score))}>{score}%</p>
                <p className="text-sm text-slate-400 mt-1">{data?.summary?.total || 0} documents resolved for your profile</p>
              </div>
              <div className={cn("p-4 rounded-full", getScoreBg(score))}>
                <Shield className={cn("w-12 h-12", getScoreColor(score))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Verified", count: ds.totalVerified, color: "text-green-400", bg: "bg-green-500/20", icon: <CheckCircle className="w-5 h-5" /> },
          { label: "Uploaded", count: ds.totalPending, color: "text-blue-400", bg: "bg-blue-500/20", icon: <Upload className="w-5 h-5" /> },
          { label: "Missing", count: ds.totalMissing, color: "text-slate-400", bg: "bg-slate-500/20", icon: <FileText className="w-5 h-5" /> },
          { label: "Critical", count: ds.criticalMissing, color: "text-red-400", bg: "bg-red-500/20", icon: <AlertTriangle className="w-5 h-5" /> },
          { label: "Expiring", count: ds.totalExpiring, color: "text-orange-400", bg: "bg-orange-500/20", icon: <Clock className="w-5 h-5" /> },
          { label: "Expired", count: ds.totalExpired, color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-5 h-5" /> },
          { label: "Rejected", count: ds.totalRejected, color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-5 h-5" /> },
        ].map(s => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.bg, s.color)}>{s.icon}</div>
              <div>
                {loading ? <Skeleton className="h-6 w-8" /> : <p className={cn("text-xl font-bold tabular-nums", s.color)}>{s.count ?? 0}</p>}
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "MISSING", "EXPIRED", "EXPIRING_SOON", "PENDING_REVIEW", "UPLOADED", "VERIFIED", "REJECTED"].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filterStatus === f ? "bg-[#1473FF] text-white" : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
            )}
          >
            {f === "ALL" ? "All" : (STATUS_CONFIG[f]?.label || f)} {f !== "ALL" && `(${reqs.filter(r => r.docStatus === f).length})`}
          </button>
        ))}
      </div>

      {/* Grouped Requirements */}
      {loading ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([group, items]) => {
            const isExpanded = expandedGroups.has(group);
            const isState = group.startsWith("State Compliance:");
            const groupVerified = items.filter((r: any) => r.docStatus === "VERIFIED").length;
            const groupTotal = items.length;
            const groupPct = groupTotal > 0 ? Math.round((groupVerified / groupTotal) * 100) : 0;
            const icon = isState ? <MapPin className="w-4 h-4 text-cyan-400" /> : (GROUP_ICONS[group] || <FileText className="w-4 h-4 text-slate-400" />);

            return (
              <Card key={group} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggleGroup(group)} className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <span className="text-white font-medium">{group}</span>
                      <span className="text-slate-500 text-xs ml-2">{groupVerified}/{groupTotal} complete</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 hidden sm:block">
                      <Progress value={groupPct} className="h-1.5" />
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums w-10 text-right", groupPct === 100 ? "text-green-400" : groupPct >= 50 ? "text-yellow-400" : "text-red-400")}>{groupPct}%</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700/30">
                    {items.map((req: any, idx: number) => {
                      const st = STATUS_CONFIG[req.docStatus] || STATUS_CONFIG.MISSING;
                      const pr = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.MEDIUM;
                      return (
                        <div key={`${req.documentTypeId}-${req.stateCode || ""}-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/10 transition-colors border-b border-slate-700/10 last:border-0">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.bg, st.color)}>{st.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-sm font-medium truncate">{req.shortName || req.name}</span>
                              {req.stateCode && <Badge className="border-0 bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0">{req.stateCode}</Badge>}
                              <Badge className={cn("border-0 text-[10px] px-1.5 py-0", pr.bg, pr.color)}>{pr.label}</Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{req.reason}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {req.statePortalUrl && (
                              <a href={req.statePortalUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors" title="State Portal">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {!req.statePortalUrl && req.downloadUrl && (
                              <a href={req.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors" title="Download Form">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {!req.statePortalUrl && !req.downloadUrl && req.sourceUrl && (
                              <a href={req.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors" title="More Info">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Badge className={cn("border-0 text-[10px] min-w-[60px] justify-center", st.bg, st.color)}>{st.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary by Group */}
      {data?.summary?.byGroup && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Requirements by Group</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.summary.byGroup as Record<string, number>).map(([g, count]: [string, number]) => {
              const groupItems = reqs.filter((r: any) => r.group === g);
              const verified = groupItems.filter((r: any) => r.docStatus === "VERIFIED").length;
              const pct = count > 0 ? Math.round((verified / count) * 100) : 0;
              const icon = g.startsWith("State Compliance:") ? <MapPin className="w-4 h-4 text-cyan-400" /> : (GROUP_ICONS[g] || <FileText className="w-4 h-4 text-slate-400" />);
              return (
                <div key={g} className="p-3 rounded-lg bg-slate-700/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-white text-sm font-medium">{g}</span>
                      <span className="text-slate-500 text-xs">{verified}/{count}</span>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", pct === 100 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400")}>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* State Compliance Summary */}
      {stateGroups.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />State-Specific Requirements ({stateGroups.length} states)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stateGroups.map(sg => {
                const stCode = sg.replace("State Compliance: ", "");
                const items = grouped.get(sg) || [];
                const ver = items.filter((r: any) => r.docStatus === "VERIFIED").length;
                const tot = items.length;
                const ok = ver === tot;
                return (
                  <button key={sg} onClick={() => toggleGroup(sg)} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors border", ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400")}>
                    <span className="font-bold">{stCode}</span> <span className="text-[10px] opacity-70">{ver}/{tot}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IRP Compliance Section (C-073) */}
      <IRPComplianceSection />
    </div>
  );
}
