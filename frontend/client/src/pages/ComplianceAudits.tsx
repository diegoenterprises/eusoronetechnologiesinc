/**
 * COMPLIANCE AUDITS PAGE
 * 100% Dynamic - Manage compliance audits and findings
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
  ClipboardCheck, Search, Plus, Calendar, CheckCircle,
  AlertTriangle, Clock, FileText, User
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceAudits() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const auditsQuery = trpc.compliance.getAudits.useQuery({ status: statusFilter, type: typeFilter });
  const statsQuery = trpc.compliance.getAuditStats.useQuery();

  const audits = auditsQuery.data || [];
  const stats = statsQuery.data;

  const filteredAudits = audits.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.auditor?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-cyan-500/20 text-cyan-400";
      case "scheduled": return "bg-purple-500/20 text-purple-400";
      case "findings": return "bg-yellow-500/20 text-yellow-400";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Compliance Audits
          </h1>
          <p className="text-slate-400 text-sm mt-1">Audit management and findings</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Audit
        </Button>
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
                  <ClipboardCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || stats?.scheduled || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Passed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.passed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Findings</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.withFindings || stats?.failed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.scheduled || 0}</p>
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
                placeholder="Search audits..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dot">DOT Audit</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="findings">Has Findings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audits List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {auditsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No audits found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredAudits.map((audit: any) => (
                <div key={audit.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        audit.status === "completed" ? "bg-green-500/20" :
                        audit.status === "findings" ? "bg-yellow-500/20" : "bg-purple-500/20"
                      )}>
                        <ClipboardCheck className={cn(
                          "w-6 h-6",
                          audit.status === "completed" ? "text-green-400" :
                          audit.status === "findings" ? "text-yellow-400" : "text-purple-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{audit.name}</p>
                          <Badge className={cn("border-0", getStatusColor(audit.status))}>
                            {audit.status.replace("_", " ")}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {audit.type}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{audit.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {audit.score !== undefined && (
                        <div className="text-center w-24">
                          <p className="text-slate-400 text-xs mb-1">Score</p>
                          <Progress value={audit.score} className="h-2" />
                          <p className={cn(
                            "text-sm font-bold mt-1",
                            audit.score >= 90 ? "text-green-400" :
                            audit.score >= 70 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {audit.score}%
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-white">{audit.date}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><User className="w-3 h-3" />Auditor</p>
                        <p className="text-white">{audit.auditor}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Findings</p>
                        <p className={cn(
                          "font-bold",
                          audit.findingsCount > 0 ? "text-yellow-400" : "text-green-400"
                        )}>
                          {audit.findingsCount || 0}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
                  </div>

                  {audit.findings && audit.findings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Key Findings:</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.findings.slice(0, 3).map((finding: any, idx: number) => (
                          <Badge key={idx} className={cn(
                            "border-0 text-xs",
                            finding.severity === "critical" ? "bg-red-500/20 text-red-400" :
                            finding.severity === "major" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-cyan-500/20 text-cyan-400"
                          )}>
                            <AlertTriangle className="w-3 h-3 mr-1" />{finding.title}
                          </Badge>
                        ))}
                        {audit.findings.length > 3 && (
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            +{audit.findings.length - 3} more
                          </Badge>
                        )}
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
