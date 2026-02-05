/**
 * COMPLIANCE HOS REVIEW PAGE
 * 100% Dynamic - Review and audit driver Hours of Service records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Clock, Search, AlertTriangle, CheckCircle, User,
  Calendar, FileText, TrendingUp, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceHOSReview() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7d");

  const logsQuery = (trpc as any).compliance.getDQDrivers.useQuery({});
  const statsQuery = (trpc as any).compliance.getHOSStats.useQuery();
  const violationsQuery = (trpc as any).compliance.getViolations.useQuery({ status: "open" });

  const logs = logsQuery.data || [];
  const stats = statsQuery.data;
  const violations = violationsQuery.data || [];

  const filteredLogs = logs.filter((l: any) =>
    l.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-500/20 text-green-400";
      case "violation": return "bg-red-500/20 text-red-400";
      case "warning": return "bg-yellow-500/20 text-yellow-400";
      case "review": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            HOS Review
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review driver Hours of Service compliance</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="14d">Last 14 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
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
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Compliant</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.compliant || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Violations</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.pendingReview || stats?.warnings || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Compliance Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.complianceRate || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Violations Alert */}
      {violations.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Violations ({violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.slice(0, 3).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">{v.driverName}</p>
                      <p className="text-slate-400 text-sm">{v.violationType} • {v.date}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-0">
                    {v.severity}
                  </Badge>
                </div>
              ))}
            </div>
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
                placeholder="Search by driver name..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="violation">Violation</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Driver HOS List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No HOS records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLogs.map((log: any) => (
                <div key={log.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  log.status === "violation" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        log.status === "compliant" ? "bg-green-500/20" :
                        log.status === "violation" ? "bg-red-500/20" :
                        log.status === "warning" ? "bg-yellow-500/20" : "bg-cyan-500/20"
                      )}>
                        {log.status === "compliant" ? <CheckCircle className="w-6 h-6 text-green-400" /> :
                         log.status === "violation" ? <AlertTriangle className="w-6 h-6 text-red-400" /> :
                         <Clock className="w-6 h-6 text-cyan-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{log.driverName}</p>
                          <Badge className={cn("border-0", getStatusColor(log.status))}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {log.truckNumber} • Last Updated: {log.lastUpdated}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Driving</p>
                        <p className="text-white font-bold">{log.drivingHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Duty</p>
                        <p className="text-white font-bold">{log.onDutyHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">70hr Cycle</p>
                        <p className={cn(
                          "font-bold",
                          log.cycleRemaining <= 10 ? "text-red-400" :
                          log.cycleRemaining <= 20 ? "text-yellow-400" : "text-green-400"
                        )}>
                          {log.cycleRemaining}h left
                        </p>
                      </div>
                      <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">11h</span>
                          <span className="text-white">{log.drivingHours}/11</span>
                        </div>
                        <Progress
                          value={(log.drivingHours / 11) * 100}
                          className={cn(
                            "h-2",
                            log.drivingHours >= 11 && "[&>div]:bg-red-500",
                            log.drivingHours >= 10 && log.drivingHours < 11 && "[&>div]:bg-yellow-500"
                          )}
                        />
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />View Log
                      </Button>
                    </div>
                  </div>

                  {log.violations && log.violations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex flex-wrap gap-2">
                        {log.violations.map((v: any, idx: number) => (
                          <Badge key={idx} className="bg-red-500/20 text-red-400 border-0 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />{v}
                          </Badge>
                        ))}
                      </div>
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
