/**
 * ADMIN SYSTEM LOGS PAGE
 * 100% Dynamic - View and analyze system activity logs
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
  FileText, Search, Download, AlertTriangle, Info,
  AlertCircle, Clock, User, Server, Filter, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSystemLogs() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const logsQuery = trpc.admin.getSystemLogs.useQuery({ level: levelFilter, source: sourceFilter });
  const statsQuery = trpc.admin.getLogStats.useQuery();

  const logs = logsQuery.data || [];
  const stats = statsQuery.data;

  const filteredLogs = logs.filter((l: any) =>
    l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.userId?.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "bg-red-500/20 text-red-400";
      case "warning": return "bg-yellow-500/20 text-yellow-400";
      case "info": return "bg-cyan-500/20 text-cyan-400";
      case "debug": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "info": return <Info className="w-4 h-4 text-cyan-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            System Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor system activity and events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => logsQuery.refetch()}
            className="bg-slate-800/50 border-slate-700/50 rounded-lg"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", logsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total (24h)</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total24h?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Errors</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.errors || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Warnings</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.warnings || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Services</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.activeServices || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="scheduler">Scheduler</SelectItem>
                <SelectItem value="integrations">Integrations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-2">{Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 font-mono text-sm">
              {filteredLogs.map((log: any) => (
                <div key={log.id} className={cn(
                  "p-4 hover:bg-slate-700/20 transition-colors",
                  log.level === "error" && "bg-red-500/5"
                )}>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      {getLevelIcon(log.level)}
                      <Badge className={cn("border-0 text-xs uppercase", getLevelColor(log.level))}>
                        {log.level}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white break-words">{log.message}</p>
                      {log.details && (
                        <pre className="text-slate-500 text-xs mt-1 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {log.source}
                      </span>
                      {log.userId && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.userId}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      {filteredLogs.length >= 50 && (
        <div className="text-center">
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            Load More Logs
          </Button>
        </div>
      )}
    </div>
  );
}
