/**
 * ADMIN AUDIT TRAIL PAGE
 * 100% Dynamic - View and search system audit logs
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
  History, Search, User, Calendar, Shield, AlertTriangle,
  FileText, Download, Eye, Filter, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAuditTrail() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7d");

  const auditQuery = (trpc as any).admin.getAuditLogs.useQuery({
    action: actionFilter === 'all' ? undefined : actionFilter,
    limit: 100,
  });
  const statsQuery = (trpc as any).admin.getAuditStats.useQuery();

  const auditLogs = auditQuery.data || [];
  const stats = statsQuery.data;

  const filteredLogs = auditLogs.filter((log: any) =>
    log.userName?.toLowerCase().includes(search.toLowerCase()) ||
    log.description?.toLowerCase().includes(search.toLowerCase()) ||
    log.resourceId?.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500/20 text-green-400";
      case "update": return "bg-blue-500/20 text-blue-400";
      case "delete": return "bg-red-500/20 text-red-400";
      case "login": return "bg-cyan-500/20 text-cyan-400";
      case "logout": return "bg-slate-500/20 text-slate-400";
      case "export": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">View and search system audit logs</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Events</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Creates</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.today || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Updates</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats?.uniqueUsers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Deletes</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.criticalActions || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Active Users</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.uniqueUsers || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Security Events */}
      {(stats?.criticalActions || 0) > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Security Events ({stats?.criticalActions || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : (
              <div className="flex flex-wrap gap-3">
                {auditLogs
                  .filter((log: any) => log.isSecurityEvent)
                  .slice(0, 5)
                  .map((log: any) => (
                    <div key={log.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{log.description}</p>
                        <p className="text-slate-400 text-sm">{log.userName} - {log.timestamp}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="loads">Loads</SelectItem>
                <SelectItem value="drivers">Drivers</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <div className="space-y-3">
        {auditQuery.isLoading ? (
          Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : filteredLogs.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No audit logs found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log: any) => (
            <Card key={log.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              log.isSecurityEvent && "border-l-4 border-red-500"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{log.userName}</p>
                        <Badge className={cn("border-0", getActionColor(log.action))}>
                          {log.action}
                        </Badge>
                        {log.isSecurityEvent && (
                          <Badge className="bg-red-500/20 text-red-400 border-0">
                            Security
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{log.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-slate-300 text-sm flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {log.timestamp}
                      </p>
                      <p className="text-slate-500 text-xs">{log.ipAddress}</p>
                    </div>
                    <Badge className="bg-slate-600/50 text-slate-300 border-0">
                      {log.module}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-cyan-400">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {log.details && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="p-2 rounded bg-slate-700/30 text-sm">
                      <p className="text-slate-400">
                        <span className="text-slate-500">Resource:</span> {log.resourceType} ({log.resourceId})
                      </p>
                      {log.changes && (
                        <p className="text-slate-400 mt-1">
                          <span className="text-slate-500">Changes:</span> {log.changes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
