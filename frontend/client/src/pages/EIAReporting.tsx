/**
 * EIA REPORTING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Send, CheckCircle, Clock, AlertTriangle,
  Download, Calendar, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EIAReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  const reportsQuery = trpc.terminal.getEIAReports.useQuery({ period: selectedPeriod });
  const statsQuery = trpc.terminal.getEIAStats.useQuery();
  const pendingQuery = trpc.terminal.getPendingEIAData.useQuery();

  const submitMutation = trpc.terminal.submitEIAReport.useMutation({
    onSuccess: () => { toast.success("Report submitted to EIA"); reportsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "draft": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
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
          <p className="text-slate-400 text-sm mt-1">Energy Information Administration reports</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Calendar className="w-4 h-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Week</SelectItem>
            <SelectItem value="last">Last Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.submitted || 0}</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.overdue || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.totalVolume?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total BBL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Data */}
      {pendingQuery.data && pendingQuery.data.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Pending Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">The following data is ready for EIA submission:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {pendingQuery.data?.map((item: any) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-white font-medium">{item.product}</p>
                  <p className="text-sm text-slate-400">{item.volume?.toLocaleString()} BBL</p>
                  <p className="text-xs text-slate-500">{item.terminal}</p>
                </div>
              ))}
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => submitMutation.mutate({ period: selectedPeriod })}>
              <Send className="w-4 h-4 mr-2" />Submit to EIA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Report History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : reportsQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No reports for this period</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {reportsQuery.data?.map((report: any) => (
                <div key={report.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", report.status === "submitted" ? "bg-green-500/20" : report.status === "overdue" ? "bg-red-500/20" : "bg-slate-700/50")}>
                      <FileText className={cn("w-5 h-5", report.status === "submitted" ? "text-green-400" : report.status === "overdue" ? "text-red-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{report.reportType}</p>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-slate-400">Period: {report.period}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>{report.terminal}</span>
                        <span>{report.volume?.toLocaleString()} BBL</span>
                        {report.submittedAt && <span>Submitted: {report.submittedAt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                      <Download className="w-4 h-4 mr-1" />Download
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
