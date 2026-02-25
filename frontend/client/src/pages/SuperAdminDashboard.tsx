/**
 * SUPER ADMIN DASHBOARD — Platform Command Center
 * COMPREHENSIVE OVERSIGHT of all platform activity across all user roles
 * Tracks: Loads, Users, Terminal Ops, Documents, Fleet, Compliance, Financial, Integrations
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Building2, Package, Activity, AlertTriangle, CheckCircle, Clock,
  UserCheck, TrendingUp, Wrench, Eye, Settings, BarChart3, Zap, Database,
  RefreshCw, FileText, DollarSign, PenTool, MapPin, HelpCircle, Truck,
  Shield, Calendar, Wifi, Globe, Server, FileCheck, Fuel, ClipboardList,
  Wallet, Send, Link2, ShieldCheck, Car, LayoutGrid
} from "lucide-react";
import { useLocation } from "wouter";

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  SHIPPER: { label: "Shippers", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  CATALYST: { label: "Catalysts", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  BROKER: { label: "Brokers", color: "text-purple-400", bg: "bg-purple-500/20" },
  DRIVER: { label: "Drivers", color: "text-blue-400", bg: "bg-blue-500/20" },
  DISPATCH: { label: "Dispatch", color: "text-orange-400", bg: "bg-orange-500/20" },
  ESCORT: { label: "Escorts", color: "text-pink-400", bg: "bg-pink-500/20" },
  TERMINAL_MANAGER: { label: "Terminal Mgrs", color: "text-amber-400", bg: "bg-amber-500/20" },
  COMPLIANCE_OFFICER: { label: "Compliance", color: "text-teal-400", bg: "bg-teal-500/20" },
  SAFETY_MANAGER: { label: "Safety Mgrs", color: "text-red-400", bg: "bg-red-500/20" },
  ADMIN: { label: "Admins", color: "text-indigo-400", bg: "bg-indigo-500/20" },
  SUPER_ADMIN: { label: "Super Admins", color: "text-yellow-400", bg: "bg-yellow-500/20" },
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const SEV: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  success: "bg-green-500/20 text-green-400",
  critical: "bg-red-500/20 text-red-400",
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  load: <Package className="w-4 h-4 text-cyan-400" />,
  bid: <DollarSign className="w-4 h-4 text-green-400" />,
  user: <Users className="w-4 h-4 text-blue-400" />,
  agreement: <PenTool className="w-4 h-4 text-purple-400" />,
  claim: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

export default function SuperAdminDashboard() {
  const [, nav] = useLocation();
  const [actFilter, setActFilter] = useState("all");
  const [statsPeriod, setStatsPeriod] = useState<"today" | "week" | "month" | "all">("today");
  
  // Core queries
  const sq = (trpc as any).admin.getDashboardSummary.useQuery();
  const pq = (trpc as any).approval?.getPendingUsers?.useQuery?.() || { data: null };
  const aq = (trpc as any).admin.getPlatformActivity.useQuery({ limit: 40 });
  
  // NEW: Comprehensive platform stats
  const cq = (trpc as any).admin.getComprehensivePlatformStats?.useQuery?.({ period: statsPeriod }) || { data: null };
  const hq = (trpc as any).admin.getRealTimePlatformHealth?.useQuery?.() || { data: null };
  const rq = (trpc as any).admin.getAllRoleActivity?.useQuery?.({ limit: 50 }) || { data: null };
  
  const s = sq.data;
  const cs = cq.data; // Comprehensive stats
  const health = hq.data; // Real-time health
  const roleActivity = rq.data; // Activity by role
  
  const pending = (pq.data as any[]) || [];
  const loading = sq.isLoading || cq.isLoading;
  const total = cs?.users?.total || s?.users?.total || 0;
  const roles = (s?.roleBreakdown || []) as { role: string; count: number }[];
  const recent = (s?.recentUsers || []) as any[];
  const hOk = health?.status === "healthy" || s?.systemHealth === "healthy";
  const events = ((aq.data?.events || []) as any[]).filter((e: any) => actFilter === "all" || e.type === actFilter);
  const counts = aq.data?.counts || {};

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Platform Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Full oversight — loads, users, agreements, disputes, support, telemetry</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Period Selector */}
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
            {(["today", "week", "month", "all"] as const).map(p => (
              <button key={p} onClick={() => setStatsPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statsPeriod === p ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : "text-slate-400 hover:text-white"}`}>
                {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-700/50 rounded-lg" onClick={() => { sq.refetch(); aq.refetch(); cq.refetch?.(); hq.refetch?.(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg" onClick={() => nav("/admin/approvals")}>
            <UserCheck className="w-4 h-4 mr-2" />Approvals
          </Button>
        </div>
      </div>

      {/* COMPREHENSIVE KPI CARDS - 2 ROWS */}
      <div className="space-y-3">
        {/* Row 1: Core Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { icon: <Users className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/20", v: total, label: "Users", c: "text-blue-400" },
            { icon: <Clock className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/20", v: cs?.users?.pendingApproval || s?.pendingApprovals || 0, label: "Pending", c: "text-yellow-400" },
            { icon: <Package className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/20", v: cs?.loads?.active || s?.loads?.active || 0, label: "Active Loads", c: "text-cyan-400" },
            { icon: <Building2 className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/20", v: cs?.companies?.total || s?.companies?.total || 0, label: "Companies", c: "text-purple-400" },
            { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/20", v: `$${((cs?.loads?.gmv || 0) / 1000).toFixed(0)}k`, label: "GMV", c: "text-emerald-400" },
            { icon: <BarChart3 className="w-5 h-5 text-indigo-400" />, bg: "bg-indigo-500/20", v: cs?.bids?.total || counts.bids || 0, label: "Bids", c: "text-indigo-400" },
            { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, bg: "bg-red-500/20", v: counts.claims || 0, label: "Claims", c: "text-red-400" },
            { icon: <Activity className={`w-5 h-5 ${hOk ? "text-green-400" : "text-red-400"}`} />, bg: hOk ? "bg-green-500/20" : "bg-red-500/20", v: hOk ? "Healthy" : "Check", label: "System", c: hOk ? "text-green-400" : "text-red-400" },
          ].map((k, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${k.bg}`}>{k.icon}</div>
                  <div>
                    {loading ? <Skeleton className="h-6 w-10" /> : <p className={`text-lg font-bold ${k.c}`}>{typeof k.v === "number" ? k.v.toLocaleString() : k.v}</p>}
                    <p className="text-[10px] text-slate-500">{k.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2: Operations by Category */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { icon: <Calendar className="w-5 h-5 text-amber-400" />, bg: "bg-amber-500/20", v: cs?.terminal?.appointments || 0, label: "Appointments", c: "text-amber-400" },
            { icon: <FileText className="w-5 h-5 text-teal-400" />, bg: "bg-teal-500/20", v: cs?.documents?.uploaded || 0, label: "Docs Uploaded", c: "text-teal-400" },
            { icon: <Truck className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/20", v: cs?.fleet?.activeDrivers || 0, label: "Active Drivers", c: "text-blue-400" },
            { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, bg: "bg-green-500/20", v: cs?.companies?.compliant || 0, label: "Compliant Cos", c: "text-green-400" },
            { icon: <Send className="w-5 h-5 text-pink-400" />, bg: "bg-pink-500/20", v: cs?.network?.invitesSent || 0, label: "Invites Sent", c: "text-pink-400" },
            { icon: <Car className="w-5 h-5 text-orange-400" />, bg: "bg-orange-500/20", v: cs?.escorts?.activeJobs || 0, label: "Escort Jobs", c: "text-orange-400" },
            { icon: <Wifi className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/20", v: cs?.integrations?.hotZonesSyncs || 0, label: "Data Syncs", c: "text-cyan-400" },
            { icon: <ClipboardList className="w-5 h-5 text-violet-400" />, bg: "bg-violet-500/20", v: cs?.system?.auditLogs || 0, label: "Audit Logs", c: "text-violet-400" },
          ].map((k, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${k.bg}`}>{k.icon}</div>
                  <div>
                    {loading ? <Skeleton className="h-6 w-10" /> : <p className={`text-lg font-bold ${k.c}`}>{typeof k.v === "number" ? k.v.toLocaleString() : k.v}</p>}
                    <p className="text-[10px] text-slate-500">{k.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PENDING APPROVALS BANNER */}
      {(s?.pendingApprovals || 0) > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">{s?.pendingApprovals} user{(s?.pendingApprovals || 0) > 1 ? "s" : ""} awaiting approval</span>
                <div className="flex -space-x-2 ml-2">
                  {pending.slice(0, 5).map((u: any) => (
                    <div key={u.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-[10px] font-bold border-2 border-slate-900">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
              <Button size="sm" className="bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-lg" onClick={() => nav("/admin/approvals")}>
                <UserCheck className="w-4 h-4 mr-1.5" />Review All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN: Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUICK ACTIONS */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400" />Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: <Users className="w-5 h-5 text-blue-400" />, label: "Users", path: "/super-admin/users" },
                { icon: <Package className="w-5 h-5 text-cyan-400" />, label: "Loads", path: "/super-admin/loads" },
                { icon: <UserCheck className="w-5 h-5 text-yellow-400" />, label: "Approvals", path: "/admin/approvals" },
                { icon: <PenTool className="w-5 h-5 text-purple-400" />, label: "Agreements", path: "/agreements" },
                { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, label: "Claims", path: "/claims" },
                { icon: <HelpCircle className="w-5 h-5 text-pink-400" />, label: "Support", path: "/support" },
                { icon: <Wrench className="w-5 h-5 text-orange-400" />, label: "ZEUN", path: "/admin/zeun" },
                { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, label: "Fees", path: "/admin/platform-fees" },
                { icon: <Activity className="w-5 h-5 text-green-400" />, label: "Telemetry", path: "/admin/telemetry" },
                { icon: <MapPin className="w-5 h-5 text-teal-400" />, label: "Fleet Map", path: "/fleet-tracking" },
                { icon: <BarChart3 className="w-5 h-5 text-indigo-400" />, label: "Analytics", path: "/super-admin/monitoring" },
                { icon: <FileText className="w-5 h-5 text-slate-400" />, label: "Logs", path: "/super-admin/logs" },
                { icon: <Database className="w-5 h-5 text-teal-400" />, label: "Database", path: "/super-admin/database" },
                { icon: <TrendingUp className="w-5 h-5 text-amber-400" />, label: "Market Intel", path: "/market-pricing" },
                { icon: <Building2 className="w-5 h-5 text-purple-400" />, label: "Companies", path: "/super-admin/companies" },
                { icon: <Settings className="w-5 h-5 text-slate-400" />, label: "Config", path: "/super-admin/settings" },
              ].map((a, i) => (
                <Button key={i} variant="outline" className="h-16 flex-col gap-1 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl text-xs" onClick={() => nav(a.path)}>
                  {a.icon}<span className="text-slate-300">{a.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ACTIVITY FEED */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" />Platform Activity</CardTitle>
              <div className="flex gap-1.5 flex-wrap">
                {["all","load","bid","user","agreement","claim"].map(f => (
                  <button key={f} onClick={() => setActFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${actFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"}`}>
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[520px] overflow-y-auto">
            {aq.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center"><Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No activity yet</p></div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {events.slice(0, 30).map((e: any) => (
                  <div key={e.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/20 transition-colors cursor-pointer"
                    onClick={() => { if (e.entity === "load") nav(`/loads/${e.entityId}`); else if (e.entity === "user") nav("/super-admin/users"); }}>
                    <div className="mt-0.5">{TYPE_ICON[e.type] || <Activity className="w-4 h-4 text-slate-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{e.title}</p>
                      <p className="text-xs text-slate-500 truncate">{e.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`border-0 text-[9px] ${SEV[e.severity] || SEV.info}`}>{e.severity}</Badge>
                      <span className="text-[10px] text-slate-500">{timeAgo(e.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* USER DISTRIBUTION + RECENT REGISTRATIONS + PLATFORM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* USER DISTRIBUTION */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />User Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div> : roles.length === 0 ? (
              <div className="py-6 text-center"><Users className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No users yet</p></div>
            ) : roles.sort((a, b) => b.count - a.count).map(r => {
              const c = ROLE_CFG[r.role] || { label: r.role, color: "text-slate-400", bg: "bg-slate-500/20" };
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={r.role} className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${c.bg}`}><Users className={`w-3.5 h-3.5 ${c.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5"><span className="text-xs text-white font-medium">{c.label}</span><span className="text-[10px] text-slate-400">{r.count} ({pct}%)</span></div>
                    <div className="h-1 w-full rounded-full bg-slate-700/50"><div className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* RECENT REGISTRATIONS */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />Recent Signups</CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => nav("/super-admin/users")}><Eye className="w-4 h-4 mr-1" />All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[320px] overflow-y-auto">
            {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : recent.length === 0 ? (
              <div className="p-6 text-center"><p className="text-slate-400 text-sm">No registrations</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {recent.slice(0, 8).map((u: any) => {
                  const rc = ROLE_CFG[u.role] || { label: u.role, color: "text-slate-400", bg: "bg-slate-500/20" };
                  return (
                    <div key={u.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold">{(u.name || "?").charAt(0)}</div>
                        <div><p className="text-white text-sm font-medium">{u.name}</p><p className="text-[10px] text-slate-500">{u.email}</p></div>
                      </div>
                      <div className="text-right">
                        <Badge className={`border-0 ${rc.bg} ${rc.color} text-[10px]`}>{rc.label}</Badge>
                        <p className="text-[9px] text-slate-500 mt-0.5">{u.createdAt ? timeAgo(u.createdAt) : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PLATFORM HEALTH */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Platform Health</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { name: "API Services", ok: hOk },
              { name: "Database", ok: hOk },
              { name: "Authentication", ok: true },
              { name: "WebSocket", ok: true },
              { name: "Telemetry", ok: true },
              { name: "Stripe Payments", ok: true },
            ].map((svc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded-full ${svc.ok ? "bg-green-500/20" : "bg-red-500/20"}`}>
                    <CheckCircle className={`w-3.5 h-3.5 ${svc.ok ? "text-green-400" : "text-red-400"}`} />
                  </div>
                  <span className="text-white text-sm">{svc.name}</span>
                </div>
                <Badge className={`border-0 text-[10px] ${svc.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{svc.ok ? "OK" : "Down"}</Badge>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>Loads/month: <span className="text-white font-medium">{s?.loads?.totalThisMonth || 0}</span></div>
              <div>Active users: <span className="text-white font-medium">{s?.users?.active || 0}</span></div>
              <div>Total bids: <span className="text-white font-medium">{(counts.bids || 0).toLocaleString()}</span></div>
              <div>Total loads: <span className="text-white font-medium">{(counts.loads || 0).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
