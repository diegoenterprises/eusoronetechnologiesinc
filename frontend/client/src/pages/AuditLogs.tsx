/**
 * AUDIT LOGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, User, Clock, Shield,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");

  const logsQuery = trpc.admin.getAuditLogs.useQuery({ search, action });
  const statsQuery = trpc.admin.getAuditStats.useQuery();

  const stats = statsQuery.data;

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create": return <Badge className="bg-green-500/20 text-green-400 border-0">Create</Badge>;
      case "update": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Update</Badge>;
      case "delete": return <Badge className="bg-red-500/20 text-red-400 border-0">Delete</Badge>;
      case "login": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Login</Badge>;
      case "logout": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Logout</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{action}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Audit Logs</h1>
          <p className="text-slate-400 text-sm mt-1">System activity tracking</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => logsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Shield className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.today || 0}</p>}<p className="text-xs text-slate-400">Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><User className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.uniqueUsers || 0}</p>}<p className="text-xs text-slate-400">Users</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><FileText className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.criticalActions || 0}</p>}<p className="text-xs text-slate-400">Critical</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Activity Logs</CardTitle></CardHeader>
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : logsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No logs found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {logsQuery.data?.map((log: any) => (
                <div key={log.id} className={cn("p-4 flex items-center justify-between", log.action === "delete" && "bg-red-500/5")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", log.action === "create" ? "bg-green-500/20" : log.action === "update" ? "bg-blue-500/20" : log.action === "delete" ? "bg-red-500/20" : "bg-purple-500/20")}>
                      <FileText className={cn("w-4 h-4", log.action === "create" ? "text-green-400" : log.action === "update" ? "text-blue-400" : log.action === "delete" ? "text-red-400" : "text-purple-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{log.description}</p>
                        {getActionBadge(log.action)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp}</span>
                        <span>IP: {log.ipAddress}</span>
                        <span>Resource: {log.resource}</span>
                      </div>
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
