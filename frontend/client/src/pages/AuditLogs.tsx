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
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, User, Clock, Search, Download, Filter,
  Eye, Edit, Trash2, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const logsQuery = trpc.admin.getAuditLogs.useQuery({ limit: 100 });
  const summaryQuery = trpc.admin.getAuditSummary.useQuery();

  const summary = summaryQuery.data;

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <Plus className="w-4 h-4 text-green-400" />;
      case "update": return <Edit className="w-4 h-4 text-blue-400" />;
      case "delete": return <Trash2 className="w-4 h-4 text-red-400" />;
      case "view": return <Eye className="w-4 h-4 text-slate-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create": return <Badge className="bg-green-500/20 text-green-400 border-0">Create</Badge>;
      case "update": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Update</Badge>;
      case "delete": return <Badge className="bg-red-500/20 text-red-400 border-0">Delete</Badge>;
      case "view": return <Badge className="bg-slate-500/20 text-slate-400 border-0">View</Badge>;
      case "login": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Login</Badge>;
      case "logout": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Logout</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{action}</Badge>;
    }
  };

  const filteredLogs = logsQuery.data?.filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">System activity and user action history</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalLogs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Plus className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.creates || 0}</p>
                )}
                <p className="text-xs text-slate-400">Creates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Edit className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.updates || 0}</p>
                )}
                <p className="text-xs text-slate-400">Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.deletes || 0}</p>
                )}
                <p className="text-xs text-slate-400">Deletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or resource..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="view">View</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLogs?.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-full", log.action === "create" ? "bg-green-500/20" : log.action === "update" ? "bg-blue-500/20" : log.action === "delete" ? "bg-red-500/20" : "bg-slate-700/50")}>
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{log.description}</p>
                          {getActionBadge(log.action)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.timestamp}
                          </span>
                          <span>Resource: {log.resource}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{log.ipAddress}</p>
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
