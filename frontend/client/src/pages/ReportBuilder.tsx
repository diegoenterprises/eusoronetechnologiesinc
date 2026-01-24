/**
 * REPORT BUILDER PAGE
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
  FileBarChart, Plus, Play, Clock, CheckCircle,
  Calendar, Download, Edit, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("financial");

  const reportsQuery = trpc.reports.list.useQuery({ limit: 20 });
  const scheduledQuery = trpc.reports.getScheduled.useQuery({ limit: 10 });

  const createMutation = trpc.reports.create.useMutation({
    onSuccess: () => { toast.success("Report created"); reportsQuery.refetch(); setReportName(""); },
    onError: (error) => toast.error("Failed to create report", { description: error.message }),
  });

  const runMutation = trpc.reports.run.useMutation({
    onSuccess: () => { toast.success("Report running"); reportsQuery.refetch(); },
    onError: (error) => toast.error("Failed to run report", { description: error.message }),
  });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => { toast.success("Report deleted"); reportsQuery.refetch(); },
    onError: (error) => toast.error("Failed to delete", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "running": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Running</Badge>;
      case "scheduled": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Report Builder
        </h1>
        <p className="text-slate-400 text-sm mt-1">Create and manage custom reports</p>
      </div>

      {/* Create Report */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Create New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Report name..." className="flex-1 min-w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg" />
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({ name: reportName, type: reportType })} disabled={!reportName || createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />Create Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">My Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reportsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : reportsQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <FileBarChart className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No reports yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {reportsQuery.data?.map((report: any) => (
                  <div key={report.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{report.name}</p>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-slate-400">{report.type} report</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => runMutation.mutate({ id: report.id })}>
                          <Play className="w-3 h-3 mr-1" />Run
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMutation.mutate({ id: report.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Last run: {report.lastRun || "Never"}</span>
                      <span>Created: {report.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {scheduledQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : scheduledQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No scheduled reports</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {scheduledQuery.data?.map((report: any) => (
                  <div key={report.id} className="p-4">
                    <p className="text-white font-medium mb-1">{report.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{report.schedule}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Next run: {report.nextRun}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
