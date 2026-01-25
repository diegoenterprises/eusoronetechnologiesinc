/**
 * ALERT MANAGEMENT PAGE
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
  Bell, AlertTriangle, CheckCircle, Clock, X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AlertManagement() {
  const [filter, setFilter] = useState("all");

  const alertsQuery = trpc.alerts.getAll.useQuery({ filter });
  const statsQuery = trpc.alerts.getStats.useQuery();

  const dismissMutation = trpc.alerts.dismiss.useMutation({
    onSuccess: () => { toast.success("Alert dismissed"); alertsQuery.refetch(); statsQuery.refetch(); },
  });

  const dismissAllMutation = trpc.alerts.dismissAll.useMutation({
    onSuccess: () => { toast.success("All alerts dismissed"); alertsQuery.refetch(); statsQuery.refetch(); },
  });

  const stats = statsQuery.data;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge className="bg-red-500 text-white border-0"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "info": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Info</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Alert Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => dismissAllMutation.mutate()}>
            <CheckCircle className="w-4 h-4 mr-2" />Dismiss All
          </Button>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg">
            <Settings className="w-4 h-4 mr-2" />Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Bell className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.critical || 0}</p>}<p className="text-xs text-slate-400">Critical</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.warnings || 0}</p>}<p className="text-xs text-slate-400">Warnings</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.dismissed || 0}</p>}<p className="text-xs text-slate-400">Dismissed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Alerts</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="warning">Warnings</SelectItem>
          <SelectItem value="info">Info</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-cyan-400" />Alerts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {alertsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : alertsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><p className="text-slate-400">No alerts</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {alertsQuery.data?.map((alert: any) => (
                <div key={alert.id} className={cn("p-4 flex items-start gap-4", alert.severity === "critical" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className={cn("p-2 rounded-full mt-1", alert.severity === "critical" ? "bg-red-500/20" : alert.severity === "warning" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                    <AlertTriangle className={cn("w-4 h-4", alert.severity === "critical" ? "text-red-400" : alert.severity === "warning" ? "text-yellow-400" : "text-blue-400")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{alert.title}</p>
                      {getSeverityBadge(alert.severity)}
                      <Badge className="bg-slate-500/20 text-slate-400 border-0">{alert.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-400">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.timestamp}</span>
                      {alert.source && <span>Source: {alert.source}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-slate-500 hover:text-white" onClick={() => dismissMutation.mutate({ id: alert.id })}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
