/**
 * ADMIN AUDIT LOGS PAGE
 * 100% Dynamic - View system audit trail
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
  FileText, Search, User, Clock, Filter,
  Download, Eye, Shield, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  const logsQuery = trpc.admin.getAuditLogs.useQuery({ 
    search, action: actionFilter, userId: userFilter
  });
  const usersQuery = trpc.admin.getUsers.useQuery({});

  const logs = logsQuery.data || [];
  const users = usersQuery.data || [];

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-green-500/20 text-green-400";
    if (action.includes("update")) return "bg-cyan-500/20 text-cyan-400";
    if (action.includes("delete")) return "bg-red-500/20 text-red-400";
    if (action.includes("login")) return "bg-purple-500/20 text-purple-400";
    return "bg-slate-500/20 text-slate-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">System activity history</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.slice(0, 20).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
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
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{log.description}</p>
                          <Badge className={cn("border-0 text-xs", getActionColor(log.action))}>
                            {log.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />{log.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{log.timestamp}
                          </span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <Eye className="w-4 h-4" />
                    </Button>
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
