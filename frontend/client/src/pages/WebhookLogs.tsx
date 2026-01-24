/**
 * WEBHOOK LOGS PAGE
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
  Webhook, Search, RefreshCw, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronUp, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WebhookLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logsQuery = trpc.admin.getWebhookLogs.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const summaryQuery = trpc.admin.getWebhookSummary.useQuery();

  const retryMutation = trpc.admin.retryWebhook.useMutation({
    onSuccess: () => { toast.success("Webhook retried"); logsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string, statusCode?: number) => {
    if (status === "success") return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />{statusCode || 200}</Badge>;
    if (status === "failed") return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />{statusCode || "Failed"}</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
  };

  const filteredLogs = logsQuery.data?.filter((log: any) =>
    !searchTerm || log.url?.toLowerCase().includes(searchTerm.toLowerCase()) || log.event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Webhook Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track outgoing webhook deliveries</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => logsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Webhook className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalSent?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Sent (24h)</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.successRate}%</p>
                )}
                <p className="text-xs text-slate-400">Success Rate</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.failed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Failed (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.avgLatency}ms</p>
                )}
                <p className="text-xs text-slate-400">Avg Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by URL or event..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-16">
              <Webhook className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No webhook logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {filteredLogs?.map((log: any) => (
                <div key={log.id} className={cn("p-4 cursor-pointer", log.status === "failed" && "bg-red-500/5 border-l-2 border-red-500")} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", log.status === "success" ? "bg-green-500/20" : log.status === "failed" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                        <Webhook className={cn("w-5 h-5", log.status === "success" ? "text-green-400" : log.status === "failed" ? "text-red-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-slate-700/50 text-slate-300 border-0">{log.event}</Badge>
                          {getStatusBadge(log.status, log.statusCode)}
                        </div>
                        <p className="text-sm text-slate-400 font-mono truncate max-w-md">{log.url}</p>
                        <p className="text-xs text-slate-500 mt-1">{log.timestamp} - {log.duration}ms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.status === "failed" && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={(e) => { e.stopPropagation(); retryMutation.mutate({ webhookId: log.id }); }}>
                          <RefreshCw className="w-4 h-4 mr-1" />Retry
                        </Button>
                      )}
                      {expandedId === log.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {expandedId === log.id && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-500 mb-2">Request Payload</p>
                        <pre className="text-xs text-slate-400 overflow-x-auto">{JSON.stringify(log.payload, null, 2)}</pre>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-500 mb-2">Response</p>
                        <pre className="text-xs text-slate-400 overflow-x-auto">{log.response || "No response"}</pre>
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
