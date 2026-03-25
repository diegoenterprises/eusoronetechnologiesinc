/**
 * UPTIME DASHBOARD + BACKUP MANAGEMENT (Phase 4 — Tasks 2.2.1 + 2.2.2)
 * Service health, SLA tracking, backup snapshots, DR failover, incident history
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Server, Database, Activity, Shield, Clock, AlertTriangle,
  CheckCircle, XCircle, HardDrive, RefreshCw, Download,
  Zap, ArrowUpDown, Cloud, Lock, BarChart3
} from "lucide-react";

type InfraTab = "uptime" | "backup" | "incidents";

export default function UptimeDashboard() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [tab, setTab] = useState<InfraTab>("uptime");

  const uptimeQuery = (trpc as any).infrastructure?.uptime?.getDashboard?.useQuery?.() || { data: null };
  const trendQuery = (trpc as any).infrastructure?.uptime?.getUptimeTrend?.useQuery?.({ days: 30 }) || { data: [] };
  const incidentsQuery = (trpc as any).infrastructure?.uptime?.getIncidents?.useQuery?.({ limit: 30 }) || { data: [] };
  const slaQuery = (trpc as any).infrastructure?.uptime?.getSLACredits?.useQuery?.({}) || { data: null };
  const backupQuery = (trpc as any).infrastructure?.backup?.getStatus?.useQuery?.() || { data: null };
  const syntheticQuery = (trpc as any).infrastructure?.backup?.getSyntheticTests?.useQuery?.() || { data: null };
  const snapshotsQuery = (trpc as any).infrastructure?.backup?.getSnapshots?.useQuery?.({ limit: 10 }) || { data: [] };

  const services: any[] = uptimeQuery.data?.services || [];
  const incidents: any[] = Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [];
  const snapshots: any[] = Array.isArray(snapshotsQuery.data) ? snapshotsQuery.data : [];
  const trend: any[] = Array.isArray(trendQuery.data) ? trendQuery.data : [];

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const statusIcon = (s: string) => s === "UP" ? <CheckCircle className="w-4 h-4 text-green-500" /> : s === "DEGRADED" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-red-500" />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Infrastructure Health</h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Service uptime, SLA tracking, backup & disaster recovery</p>
        </div>
        {uptimeQuery.data && (
          <Badge className={cn("rounded-full px-3 py-1.5 text-sm font-medium", uptimeQuery.data.slaMet ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-red-500/15 text-red-500 border-red-500/30")}>
            {uptimeQuery.data.overallUptime?.toFixed(2)}% — SLA {uptimeQuery.data.slaMet ? "Met" : "Breached"}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: "uptime" as InfraTab, label: "Service Health", icon: <Activity className="w-4 h-4" /> },
          { id: "backup" as InfraTab, label: "Backup & DR", icon: <Database className="w-4 h-4" /> },
          { id: "incidents" as InfraTab, label: "Incidents", icon: <AlertTriangle className="w-4 h-4" />, badge: incidents.length },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border", tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-md" : L ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600")}>
            {t.icon}{t.label}
            {t.badge ? <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Service Health */}
      {tab === "uptime" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {services.map((svc: any) => (
              <Card key={svc.name} className={cc}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{svc.name}</p>
                    {statusIcon(svc.status)}
                  </div>
                  <p className={cn("text-2xl font-bold", svc.uptime30d >= 99.9 ? (L ? "text-green-600" : "text-green-400") : svc.uptime30d >= 99 ? (L ? "text-amber-600" : "text-amber-400") : (L ? "text-red-600" : "text-red-400"))}>{svc.uptime30d?.toFixed(2)}%</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className={L ? "text-slate-400" : "text-slate-500"}>P99: {svc.latencyP99}ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Uptime trend sparkline */}
          {trend.length > 0 && (
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><BarChart3 className="w-5 h-5 text-[#1473FF]" />30-Day Uptime Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-[2px] h-16">
                  {trend.map((d: any, i: number) => {
                    const h = Math.max(4, ((d.uptime - 97) / 3) * 64);
                    return <div key={i} className={cn("flex-1 rounded-t-sm", d.uptime >= 99.5 ? "bg-green-500" : d.uptime >= 99 ? "bg-amber-500" : "bg-red-500")} style={{ height: `${h}px` }} title={`${d.date}: ${d.uptime?.toFixed(2)}%`} />;
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{trend[0]?.date}</span>
                  <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{trend[trend.length - 1]?.date}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLA credit status */}
          {slaQuery.data && (
            <Card className={cc}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-5 h-5", slaQuery.data.slaMet ? "text-green-500" : "text-red-500")} />
                  <div>
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>SLA Status — {slaQuery.data.month}</p>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{slaQuery.data.note}</p>
                  </div>
                </div>
                <Badge className={slaQuery.data.slaMet ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>{slaQuery.data.uptimePercent?.toFixed(2)}%</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Backup & DR */}
      {tab === "backup" && (
        <div className="space-y-4">
          {backupQuery.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {backupQuery.data.providers?.map((p: any) => (
                  <Card key={p.provider} className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-5 h-5 text-[#1473FF]" />
                          <p className={cn("text-sm font-medium uppercase", L ? "text-slate-800" : "text-white")}>{p.provider} — {p.region}</p>
                        </div>
                        <Badge className={p.role === "primary" ? "bg-blue-500/15 text-blue-500" : "bg-slate-500/15 text-slate-500"}>{p.role}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Latest Snapshot</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{p.latestSnapshot ? new Date(p.latestSnapshot).toLocaleString() : "—"}</p></div>
                        <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Size</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{p.snapshotSize}</p></div>
                        <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Encrypted</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{p.encrypted ? "AES-256" : "None"}</p></div>
                        <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Replication Lag</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{p.replicationLag}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className={cc}>
                <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Shield className="w-5 h-5 text-[#1473FF]" />RPO / RTO</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>RPO Target</p><p className={cn("text-lg font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{backupQuery.data.sla?.rpoTarget}</p></div>
                    <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>RPO Actual</p><p className={cn("text-lg font-bold mt-0.5 text-green-500")}>{backupQuery.data.sla?.rpoActual}</p></div>
                    <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>RTO Target</p><p className={cn("text-lg font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{backupQuery.data.sla?.rtoTarget}</p></div>
                    <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>RTO Actual</p><p className={cn("text-lg font-bold mt-0.5 text-green-500")}>{backupQuery.data.sla?.rtoActual}</p></div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {syntheticQuery.data && (
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><RefreshCw className="w-5 h-5 text-[#1473FF]" />Synthetic Restore Tests</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Last Test</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{syntheticQuery.data.lastTest?.result}</p></div>
                  <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Avg Restore</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{syntheticQuery.data.averageRestoreTime}</p></div>
                  <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Success Rate</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{syntheticQuery.data.successRate}%</p></div>
                  <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Tests (30d)</p><p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{syntheticQuery.data.testsLast30Days}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {snapshots.length > 0 && (
            <Card className={cc}>
              <CardHeader className="pb-3"><CardTitle className={cn("text-lg", L ? "text-slate-800" : "text-white")}>Recent Snapshots</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {snapshots.slice(0, 8).map((s: any) => (
                  <div key={s.id} className={cn("flex items-center justify-between p-2.5 rounded-xl border text-xs", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      <span className={L ? "text-slate-700" : "text-white"}>{s.provider?.toUpperCase()}</span>
                      <Badge variant="outline" className="text-xs">{s.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={L ? "text-slate-400" : "text-slate-500"}>{s.size}</span>
                      <Lock className="w-3 h-3 text-green-500" />
                      <span className={L ? "text-slate-400" : "text-slate-500"}>{new Date(s.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Incidents */}
      {tab === "incidents" && (
        <Card className={cc}>
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><AlertTriangle className="w-5 h-5 text-amber-500" />Recent Incidents ({incidents.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {incidents.length === 0 ? <p className={cn("text-sm text-center py-8", L ? "text-slate-400" : "text-slate-500")}>No incidents to display</p> : incidents.map((inc: any) => (
              <div key={inc.id} className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {inc.type === "outage" ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{inc.service}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={inc.type === "outage" ? "bg-red-500/15 text-red-500 text-xs" : "bg-amber-500/15 text-amber-500 text-xs"}>{inc.type}</Badge>
                    <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{inc.duration}</span>
                  </div>
                </div>
                <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}><strong>Cause:</strong> {inc.cause}</p>
                <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}><strong>Impact:</strong> {inc.impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
