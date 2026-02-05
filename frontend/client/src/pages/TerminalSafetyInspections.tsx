/**
 * TERMINAL SAFETY INSPECTIONS PAGE
 * 100% Dynamic - Manage terminal safety inspections and audits
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
  Shield, Search, Plus, CheckCircle, AlertTriangle,
  Calendar, FileText, User, Clock, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalSafetyInspections() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const inspectionsQuery = (trpc as any).terminals.getAppointments.useQuery({});
  const statsQuery = (trpc as any).terminals.getOperationStats.useQuery({});

  const inspections = inspectionsQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredInspections = inspections.filter((i: any) =>
    i.area?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspector?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "bg-green-500/20 text-green-400";
      case "failed": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "scheduled": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Safety Inspections
          </h1>
          <p className="text-slate-400 text-sm mt-1">Terminal safety audits and inspections</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Inspection
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
                  <ClipboardCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
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
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.failed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.scheduled || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pass Rate</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.passRate || 0}%</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search inspections..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {inspectionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No inspections found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInspections.map((inspection: any) => (
                <div key={inspection.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        inspection.status === "passed" ? "bg-green-500/20" :
                        inspection.status === "failed" ? "bg-red-500/20" : "bg-yellow-500/20"
                      )}>
                        <Shield className={cn(
                          "w-6 h-6",
                          inspection.status === "passed" ? "text-green-400" :
                          inspection.status === "failed" ? "text-red-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{inspection.area}</p>
                          <Badge className={cn("border-0", getStatusColor(inspection.status))}>
                            {inspection.status}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {inspection.type}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{inspection.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Score</p>
                        <p className={cn(
                          "font-bold text-lg",
                          inspection.score >= 90 ? "text-green-400" :
                          inspection.score >= 70 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {inspection.score || "—"}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Date</p>
                        <p className="text-white">{inspection.date}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><User className="w-3 h-3" />Inspector</p>
                        <p className="text-white">{inspection.inspector}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Findings</p>
                        <p className={cn(
                          "font-bold",
                          inspection.findings > 0 ? "text-yellow-400" : "text-green-400"
                        )}>
                          {inspection.findings || 0}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />Report
                      </Button>
                    </div>
                  </div>

                  {inspection.findings > 0 && inspection.criticalFindings && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Critical Findings:</p>
                      <div className="flex flex-wrap gap-2">
                        {inspection.criticalFindings.map((finding: string, idx: number) => (
                          <Badge key={idx} className="bg-red-500/20 text-red-400 border-0 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />{finding}
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
