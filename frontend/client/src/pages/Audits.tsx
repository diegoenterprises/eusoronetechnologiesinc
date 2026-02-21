/**
 * AUDITS PAGE - Compliance Officer
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  ClipboardCheck, Search, Calendar, Clock, CheckCircle,
  AlertCircle, FileText, Plus, Building, User, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Audits() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const auditsQuery = (trpc as any).compliance.getAudits.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const statsQuery = (trpc as any).compliance.getAuditStats.useQuery();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "dot":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">DOT</Badge>;
      case "fmcsa":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">FMCSA</Badge>;
      case "internal":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Internal</Badge>;
      case "hazmat":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HazMat</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Audits
          </h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and manage compliance audits</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.scheduled || 0}</p>
                    <p className="text-xs text-slate-400">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.inProgress || 0}</p>
                    <p className="text-xs text-slate-400">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.passed || 0}</p>
                    <p className="text-xs text-slate-400">Passed This Year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.passRate || 0}%</p>
                    <p className="text-xs text-slate-400">Pass Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-400" />
              Audit Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search audits..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-white/[0.04] border-white/[0.06] rounded-lg w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-white/[0.04] border-white/[0.06] rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dot">DOT</SelectItem>
                  <SelectItem value="fmcsa">FMCSA</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="hazmat">HazMat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/[0.04] border-white/[0.06] rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (auditsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No audits found</p>
              <p className="text-slate-500 text-sm">Schedule an audit to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(auditsQuery.data as any)?.map((audit: any) => (
                <div
                  key={audit.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">{audit.name}</span>
                        {getTypeBadge(audit.type)}
                        {getStatusBadge(audit.status)}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{audit.description}</p>
                      
                      {audit.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{audit.progress}%</span>
                          </div>
                          <Progress value={audit.progress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(audit.scheduledDate).toLocaleDateString()}
                        </span>
                        {audit.auditor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {audit.auditor}
                          </span>
                        )}
                        {audit.location && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {audit.location}
                          </span>
                        )}
                        {audit.findings !== undefined && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {audit.findings} findings
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/[0.04] border-white/[0.06] hover:bg-slate-600/50 rounded-lg"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                      {audit.status === "scheduled" && (
                        <Button
                          size="sm"
                          className="bg-blue-600/80 hover:bg-blue-600 rounded-lg"
                        >
                          Start Audit
                        </Button>
                      )}
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
