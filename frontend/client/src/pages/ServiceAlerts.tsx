/**
 * SERVICE ALERTS PAGE
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
  Bell, AlertTriangle, CheckCircle, Clock, XCircle,
  RefreshCw, Eye, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ServiceAlerts() {
  const [severityFilter, setSeverityFilter] = useState("all");

  const alertsQuery = (trpc as any).alerts.list.useQuery({ severity: severityFilter === "all" ? undefined : severityFilter as "error" | "info" | "warning" | "critical", limit: 50 });
  const summaryQuery = (trpc as any).alerts.getSummary.useQuery();

  const acknowledgeMutation = (trpc as any).alerts.acknowledge.useMutation({
    onSuccess: () => { toast.success("Alert acknowledged"); alertsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to acknowledge", { description: error.message }),
  });

  const dismissMutation = (trpc as any).alerts.dismiss.useMutation({
    onSuccess: () => { toast.success("Alert dismissed"); alertsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to dismiss", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "info": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Info</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Service Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-1">System notifications and alerts</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => alertsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Alerts</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.critical || 0}</p>
                )}
                <p className="text-xs text-slate-400">Critical</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.unacknowledged || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unacknowledged</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.resolved || 0}</p>
                )}
                <p className="text-xs text-slate-400">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {alertsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (alertsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bell className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(alertsQuery.data as any)?.map((alert: any) => (
                <div key={alert.id} className={cn("p-4", alert.severity === "critical" && "bg-red-500/5 border-l-2 border-red-500", alert.severity === "warning" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{alert.title}</p>
                        {getSeverityBadge(alert.severity)}
                        {alert.acknowledged && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Acknowledged</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                    </div>
                    <p className="text-xs text-slate-500">{alert.timestamp}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Source: {alert.source}</span>
                      {alert.affectedEntity && <span>Affected: {alert.affectedEntity}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => acknowledgeMutation.mutate({ alertId: alert.id })}>
                          <Eye className="w-3 h-3 mr-1" />Acknowledge
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => dismissMutation.mutate({ alertId: alert.id })}>
                        <X className="w-4 h-4" />
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
