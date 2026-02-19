/**
 * AUDIT LOGS PAGE
 * Frontend for auditLogs router — system audit trail, change history, user actions.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ScrollText, Search, Filter, Clock, User, Shield,
  FileText, Eye, AlertTriangle, Activity
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

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const logsQuery = (trpc as any).auditLogs.list.useQuery({
    search: searchTerm || undefined,
    limit: 100,
  });
  const statsQuery = (trpc as any).auditLogs.getStats.useQuery();

  const logs = logsQuery.data?.logs || logsQuery.data || [];
  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">System audit trail and change history</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total || 0, icon: <ScrollText className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
            { label: "Today", value: stats.today || 0, icon: <Clock className="w-5 h-5 text-cyan-400" />, color: "text-cyan-400" },
            { label: "Users Active", value: stats.activeUsers || 0, icon: <User className="w-5 h-5 text-green-400" />, color: "text-green-400" },
            { label: "Security Events", value: stats.securityEvents || 0, icon: <Shield className="w-5 h-5 text-red-400" />, color: "text-red-400" },
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

      {/* Search */}
      <div className="flex gap-2">
        <Input placeholder="Search audit logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white max-w-sm" />
        <Button onClick={() => logsQuery.refetch()} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"><Search className="w-4 h-4" /></Button>
      </div>

      {/* Logs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1473FF]" />Event Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center"><ScrollText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No audit logs found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(logs) ? logs : []).map((log: any, i: number) => (
                <div key={log.id || i} className="p-3 flex items-center justify-between hover:bg-slate-700/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center">
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
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {log.userName && <span>{log.userName}</span>}
                        {log.resource && <span>{log.resource}</span>}
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
