/**
 * EIA REPORTING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, BarChart3, CheckCircle, Clock, AlertTriangle,
  Download, Send, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EIAReporting() {
  const [period, setPeriod] = useState("current");

  const reportsQuery = trpc.terminal.getEIAReports.useQuery({ period });
  const summaryQuery = trpc.terminal.getEIASummary.useQuery();

  const submitMutation = trpc.terminal.submitEIAReport.useMutation({
    onSuccess: () => { toast.success("Report submitted to EIA"); reportsQuery.refetch(); },
    onError: (error) => toast.error("Submission failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted": return <Badge className="bg-green-500/20 text-green-400 border-0">Submitted</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "draft": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Draft</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            EIA Reporting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Energy Information Administration compliance reports</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Period</SelectItem>
            <SelectItem value="previous">Previous Period</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
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
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalReports || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.submitted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">EIA Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : reportsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {reportsQuery.data?.map((report: any) => (
                <div key={report.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", report.status === "overdue" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", report.status === "submitted" ? "bg-green-500/20" : report.status === "overdue" ? "bg-red-500/20" : "bg-blue-500/20")}>
                        <FileText className={cn("w-6 h-6", report.status === "submitted" ? "text-green-400" : report.status === "overdue" ? "text-red-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{report.reportType}</p>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-slate-400">{report.terminalName}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Period: {report.period}
                          </span>
                          <span>Due: {report.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-medium">{(report.totalVolume || 0).toLocaleString()} bbl</p>
                        <p className="text-xs text-slate-500">Total Volume</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </Button>
                        {report.status !== "submitted" && (
                          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => submitMutation.mutate({ reportId: report.id })} disabled={submitMutation.isPending}>
                            <Send className="w-4 h-4 mr-1" />Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Volume Breakdown */}
                  {report.products && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {report.products.map((product: any) => (
                        <div key={product.name} className="p-3 rounded-xl bg-slate-700/30">
                          <p className="text-xs text-slate-500">{product.name}</p>
                          <p className="text-white font-medium">{product.volume.toLocaleString()} bbl</p>
                        </div>
                      ))}
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
