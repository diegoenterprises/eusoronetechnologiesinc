/**
 * AUDIT LOGS PAGE — Consolidated
 * Merges: AuditLog.tsx, AuditLogs.tsx, Audits.tsx → AuditLogsPage.tsx
 * Tabs: Activity Log | Compliance Audits
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ScrollText, Search, Clock, User, Shield, FileText, Eye, AlertTriangle,
  Activity, ClipboardCheck, Calendar, CheckCircle, Plus, BarChart3,
  Building, RefreshCw, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/20 text-green-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  login: "bg-cyan-500/20 text-cyan-400",
  logout: "bg-slate-500/20 text-slate-400",
  view: "bg-purple-500/20 text-purple-400",
  export: "bg-yellow-500/20 text-yellow-400",
};

/* ─── Activity Log Tab ─────────────────────────────────────────────── */
function ActivityLogTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logsQuery = (trpc as any).auditLogs.list.useQuery({ search: searchTerm || undefined, limit: 100 });
  const statsQuery = (trpc as any).auditLogs.getStats.useQuery();

  const logs = logsQuery.data?.logs || logsQuery.data || [];
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total || 0, icon: <ScrollText className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
            { label: "Today", value: stats.today || 0, icon: <Clock className="w-5 h-5 text-cyan-400" />, color: "text-cyan-400" },
            { label: "Users Active", value: stats.activeUsers || stats.uniqueUsers || 0, icon: <User className="w-5 h-5 text-green-400" />, color: "text-green-400" },
            { label: "Security Events", value: stats.securityEvents || stats.criticalActions || 0, icon: <Shield className="w-5 h-5 text-red-400" />, color: "text-red-400" },
          ].map(s => (
            <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-700/30">{s.icon}</div>
                  <div><p className={cn("text-xl font-bold", s.color)}>{s.value}</p><p className="text-[10px] text-slate-400 uppercase">{s.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search audit logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => logsQuery.refetch()}>
          <RefreshCw className={cn("w-4 h-4", logsQuery.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-[#1473FF]" />Event Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center"><ScrollText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No audit logs found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(logs) ? logs : []).map((log: any, i: number) => (
                <div key={log.id || i}>
                  <div
                    className="p-3 flex items-center justify-between hover:bg-slate-700/20 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === (log.id || String(i)) ? null : (log.id || String(i)))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center shrink-0">
                        {log.action === "delete" ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                         log.action === "login" ? <User className="w-4 h-4 text-cyan-400" /> :
                         log.action === "view" ? <Eye className="w-4 h-4 text-purple-400" /> :
                         <FileText className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white text-sm font-medium">{log.description || log.action}</span>
                          <Badge className={cn("text-[9px]", ACTION_COLORS[log.action] || "bg-slate-500/20 text-slate-400")}>{log.action}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          {log.userName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userName}</span>}
                          {log.resource && <span>{log.resource}</span>}
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : log.timestamp || ""}</span>
                      {expandedId === (log.id || String(i)) ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>
                  {expandedId === (log.id || String(i)) && (
                    <div className="px-14 pb-3 text-xs">
                      <pre className="bg-slate-900/50 p-3 rounded-lg text-slate-300 overflow-auto max-h-40">
                        {JSON.stringify(log.details || log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Compliance Audits Tab ────────────────────────────────────────── */
function ComplianceAuditsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const auditsQuery = (trpc as any).compliance.getAudits.useQuery({
    search, status: statusFilter !== "all" ? statusFilter : undefined, type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const statsQuery = (trpc as any).compliance.getAuditStats.useQuery();

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { scheduled: "bg-blue-500/20 text-blue-400", in_progress: "bg-yellow-500/20 text-yellow-400", completed: "bg-green-500/20 text-green-400", failed: "bg-red-500/20 text-red-400" };
    return <Badge className={cn("border-0", map[status] || "bg-slate-500/20 text-slate-400")}>{status === "in_progress" ? "In Progress" : status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
  };
  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = { dot: "bg-purple-500/20 text-purple-400", fmcsa: "bg-cyan-500/20 text-cyan-400", internal: "bg-slate-500/20 text-slate-400", hazmat: "bg-orange-500/20 text-orange-400" };
    return <Badge className={cn("border-0", map[type] || "bg-slate-500/20 text-slate-400")}>{type?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
          <>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/20"><Calendar className="w-5 h-5 text-blue-400" /></div><div><p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.scheduled || 0}</p><p className="text-xs text-slate-400">Scheduled</p></div></div></CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/20"><Clock className="w-5 h-5 text-yellow-400" /></div><div><p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.inProgress || 0}</p><p className="text-xs text-slate-400">In Progress</p></div></div></CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div><div><p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.passed || 0}</p><p className="text-xs text-slate-400">Passed</p></div></div></CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/20"><BarChart3 className="w-5 h-5 text-purple-400" /></div><div><p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.passRate || 0}%</p><p className="text-xs text-slate-400">Pass Rate</p></div></div></CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-purple-400" />Audit Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search audits..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dot">DOT</SelectItem>
                  <SelectItem value="fmcsa">FMCSA</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="hazmat">HazMat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditsQuery.isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : (auditsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12"><ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No audits found</p><p className="text-slate-500 text-sm">Schedule an audit to get started</p></div>
          ) : (
            <div className="space-y-3">
              {(auditsQuery.data as any)?.map((audit: any) => (
                <div key={audit.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">{audit.name}</span>
                        {getTypeBadge(audit.type)}
                        {getStatusBadge(audit.status)}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{audit.description}</p>
                      {audit.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span>{audit.progress}%</span></div>
                          <Progress value={audit.progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(audit.scheduledDate).toLocaleDateString()}</span>
                        {audit.auditor && <span className="flex items-center gap-1"><User className="w-3 h-3" />{audit.auditor}</span>}
                        {audit.location && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{audit.location}</span>}
                        {audit.findings !== undefined && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{audit.findings} findings</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"><FileText className="w-4 h-4 mr-1" />Report</Button>
                      {audit.status === "scheduled" && <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 rounded-lg">Start Audit</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Consolidated Page ───────────────────────────────────────── */
export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Audit & Compliance</h1>
          <p className="text-slate-400 text-sm mt-1">System audit trail, change history, and compliance audits</p>
        </div>
        {activeTab === "audits" && (
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Schedule Audit
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activity"><Activity className="w-4 h-4 mr-1.5" />Activity Log</TabsTrigger>
          <TabsTrigger value="audits"><ClipboardCheck className="w-4 h-4 mr-1.5" />Compliance Audits</TabsTrigger>
        </TabsList>
        <TabsContent value="activity"><ActivityLogTab /></TabsContent>
        <TabsContent value="audits"><ComplianceAuditsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
