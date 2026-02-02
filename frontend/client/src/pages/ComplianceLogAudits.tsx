/**
 * COMPLIANCE LOG AUDITS PAGE
 * 100% Dynamic - Review and audit driver ELD logs
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
  FileSearch, Search, AlertTriangle, CheckCircle, Clock,
  User, Calendar, FileText, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComplianceLogAudits() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [periodFilter, setPeriodFilter] = useState("7d");

  const auditsQuery = trpc.compliance.getLogAudits.useQuery({ status: statusFilter, period: periodFilter });
  const statsQuery = trpc.compliance.getAuditStats.useQuery();

  const approveAuditMutation = trpc.compliance.approveAudit.useMutation({
    onSuccess: () => {
      toast.success("Audit approved");
      auditsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const flagAuditMutation = trpc.compliance.flagAudit.useMutation({
    onSuccess: () => {
      toast.success("Audit flagged for review");
      auditsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const audits = auditsQuery.data || [];
  const stats = statsQuery.data;

  const filteredAudits = audits.filter((a: any) =>
    a.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    a.logId?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "flagged": return "bg-red-500/20 text-red-400";
      case "reviewing": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Log Audits
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and audit driver ELD logs</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSearch className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Logs</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalLogs || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Flagged</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.flagged || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-400 text-sm">Violations</span>
                </div>
                <p className="text-2xl font-bold text-orange-400">{stats?.violations || 0}</p>
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
                placeholder="Search drivers or log IDs..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audits List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {auditsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-16">
              <FileSearch className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No audits found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredAudits.map((audit: any) => (
                <div key={audit.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  audit.hasViolations && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        audit.status === "approved" ? "bg-green-500/20" :
                        audit.status === "flagged" ? "bg-red-500/20" :
                        "bg-yellow-500/20"
                      )}>
                        <FileText className={cn(
                          "w-6 h-6",
                          audit.status === "approved" ? "text-green-400" :
                          audit.status === "flagged" ? "text-red-400" :
                          "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">Log #{audit.logId}</p>
                          <Badge className={cn("border-0", getStatusColor(audit.status))}>
                            {audit.status}
                          </Badge>
                          {audit.hasViolations && (
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                              {audit.violationCount} Violations
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <User className="w-3 h-3" />
                          <span>{audit.driverName}</span>
                          <span className="text-slate-600">•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{audit.logDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Driving</p>
                        <p className="text-white font-medium">{audit.drivingHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On Duty</p>
                        <p className="text-white">{audit.onDutyHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Off Duty</p>
                        <p className="text-white">{audit.offDutyHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Edits</p>
                        <p className={cn(
                          "font-medium",
                          audit.editCount > 3 ? "text-red-400" :
                          audit.editCount > 0 ? "text-yellow-400" : "text-green-400"
                        )}>
                          {audit.editCount}
                        </p>
                      </div>

                      {audit.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => flagAuditMutation.mutate({ auditId: audit.id })}
                            className="bg-red-500/20 border-red-500/50 text-red-400 rounded-lg"
                          >
                            <XCircle className="w-4 h-4 mr-1" />Flag
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveAuditMutation.mutate({ auditId: audit.id })}
                            className="bg-green-600 hover:bg-green-700 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {audit.violations && audit.violations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Violations:</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.violations.map((v: any, idx: number) => (
                          <Badge key={idx} className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />{v.type}: {v.description}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {audit.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-700/30 text-sm text-slate-400">
                      <span className="text-slate-500">Notes: </span>{audit.notes}
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
