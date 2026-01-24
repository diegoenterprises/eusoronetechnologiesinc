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
  Activity, Search, User, Clock, Download, Eye,
  Shield, FileText, Settings, AlertTriangle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [page, setPage] = useState(1);

  const logsQuery = trpc.audit.getLogs.useQuery({
    search: searchTerm || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    userId: userFilter !== "all" ? userFilter : undefined,
    page,
    limit: 50,
  });
  const usersQuery = trpc.audit.getUsers.useQuery();
  const summaryQuery = trpc.audit.getSummary.useQuery();

  if (logsQuery.error) {
    return (
      <div className="p-6 text-center">
        <div className="p-4 rounded-full bg-red-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">Error loading audit logs</p>
        <Button className="bg-slate-700 hover:bg-slate-600" onClick={() => logsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500/20 text-green-400";
      case "update": return "bg-blue-500/20 text-blue-400";
      case "delete": return "bg-red-500/20 text-red-400";
      case "login": return "bg-purple-500/20 text-purple-400";
      case "logout": return "bg-slate-500/20 text-slate-400";
      case "view": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return FileText;
      case "update": return Settings;
      case "delete": return AlertTriangle;
      case "login": case "logout": return User;
      case "view": return Eye;
      default: return Activity;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track all system activities and changes</p>
        </div>
        <Button className="bg-slate-700 hover:bg-slate-600 border border-slate-600">
          <Download className="w-4 h-4 mr-2" />Export Logs
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summaryQuery.data?.totalEvents?.toLocaleString() || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summaryQuery.data?.todayEvents || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summaryQuery.data?.activeUsers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summaryQuery.data?.securityEvents || 0}</p>
                )}
                <p className="text-xs text-slate-400">Security Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search logs..." 
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50" 
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="view">View</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue placeholder="User" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {usersQuery.data?.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : logsQuery.data?.logs?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No audit logs found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {logsQuery.data?.logs?.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-full", getActionColor(log.action))}>
                        <ActionIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white">{log.description}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userName}</span>
                          <span>{log.resource}</span>
                          {log.ipAddress && <span className="text-slate-500">{log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn("border-0", getActionColor(log.action))}>{log.action}</Badge>
                      <span className="text-sm text-slate-500">{log.timestamp}</span>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logsQuery.data?.totalPages && logsQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 rounded-lg" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-slate-400 px-4">Page {page} of {logsQuery.data.totalPages}</span>
          <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 rounded-lg" onClick={() => setPage(p => p + 1)} disabled={page >= logsQuery.data.totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
