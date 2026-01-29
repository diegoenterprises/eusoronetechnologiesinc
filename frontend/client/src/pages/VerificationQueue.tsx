/**
 * VERIFICATION QUEUE PAGE
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
  Shield, CheckCircle, XCircle, Clock, Eye,
  Building, User, Truck, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VerificationQueue() {
  const [typeFilter, setTypeFilter] = useState("all");

  const queueQuery = trpc.admin.getVerificationQueue.useQuery({ type: typeFilter === "all" ? undefined : typeFilter as "user" | "all" | "company" | "document", limit: 50 });
  const summaryQuery = trpc.admin.getVerificationSummary.useQuery();

  const approveMutation = trpc.admin.approveVerification.useMutation({
    onSuccess: () => { toast.success("Approved"); queueQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.admin.rejectVerification.useMutation({
    onSuccess: () => { toast.success("Rejected"); queueQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "company": return <Building className="w-5 h-5" />;
      case "driver": return <User className="w-5 h-5" />;
      case "vehicle": return <Truck className="w-5 h-5" />;
      case "document": return <FileText className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500/20 text-red-400 border-0">High Priority</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-green-500/20 text-green-400 border-0">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Verification Queue
        </h1>
        <p className="text-slate-400 text-sm mt-1">Review and approve pending verifications</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-2xl font-bold text-red-400">{summary?.rejectedToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rejected Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgWaitTime}</p>
                )}
                <p className="text-xs text-slate-400">Avg Wait Time</p>
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
            <SelectItem value="company">Companies</SelectItem>
            <SelectItem value="driver">Drivers</SelectItem>
            <SelectItem value="vehicle">Vehicles</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {queueQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : queueQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-slate-400 text-lg">Queue is empty</p>
              <p className="text-slate-500 text-sm">All verifications have been processed</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {queueQuery.data?.map((item: any) => (
                <div key={item.id} className={cn("p-4", item.priority === "high" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-700/50">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{item.name}</p>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="capitalize">{item.type}</span>
                          <span>Submitted: {item.submittedAt}</span>
                          <span>Waiting: {item.waitTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => approveMutation.mutate({ id: item.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => rejectMutation.mutate({ id: item.id })}>
                        <XCircle className="w-4 h-4 mr-1" />Reject
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
