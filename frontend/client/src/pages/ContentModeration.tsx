/**
 * CONTENT MODERATION PAGE
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
  Shield, Flag, CheckCircle, XCircle, Eye,
  AlertTriangle, MessageSquare, Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ContentModeration() {
  const [typeFilter, setTypeFilter] = useState("all");

  const reportsQuery = trpc.admin.getContentReports.useQuery({ type: typeFilter === "all" ? undefined : typeFilter, limit: 50 });
  const summaryQuery = trpc.admin.getModerationSummary.useQuery();

  const approveMutation = trpc.admin.approveContent.useMutation({
    onSuccess: () => { toast.success("Content approved"); reportsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const removeMutation = trpc.admin.removeContent.useMutation({
    onSuccess: () => { toast.success("Content removed"); reportsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "image": return <Image className="w-5 h-5 text-purple-400" />;
      case "review": return <MessageSquare className="w-5 h-5 text-green-400" />;
      default: return <Flag className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge className="bg-red-500/20 text-red-400 border-0">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-green-500/20 text-green-400 border-0">Low</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Content Moderation
        </h1>
        <p className="text-slate-400 text-sm mt-1">Review and moderate reported content</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Flag className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending Review</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.approvedToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Approved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.removedToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Removed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.highSeverity || 0}</p>
                )}
                <p className="text-xs text-slate-400">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {reportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : reportsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-slate-400 text-lg">No reports to review</p>
              <p className="text-slate-500 text-sm">All content has been moderated</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {reportsQuery.data?.map((report: any) => (
                <div key={report.id} className={cn("p-4", report.severity === "high" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-700/50">
                        {getTypeIcon(report.contentType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{report.reason}</p>
                          {getSeverityBadge(report.severity)}
                        </div>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{report.contentPreview}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="capitalize">{report.contentType}</span>
                          <span>Reported by: {report.reportedBy}</span>
                          <span>{report.reportedAt}</span>
                          <span>{report.reportCount} reports</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => approveMutation.mutate({ reportId: report.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => removeMutation.mutate({ reportId: report.id })}>
                        <XCircle className="w-4 h-4 mr-1" />Remove
                      </Button>
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
