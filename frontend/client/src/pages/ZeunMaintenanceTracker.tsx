/**
 * ZEUN MAINTENANCE TRACKER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Wrench, Truck, AlertTriangle, CheckCircle, Clock, Calendar,
  DollarSign, Search, Plus, Eye, FileText, TrendingUp,
  Activity, Settings, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ZeunMaintenanceTracker() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryQuery = (trpc as any).maintenance.getSummary.useQuery();
  const scheduledQuery = (trpc as any).maintenance.getScheduled.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm || undefined,
  });
  const historyQuery = (trpc as any).maintenance.getHistory.useQuery({ limit: 20 });
  const alertsQuery = (trpc as any).maintenance.getAlerts.useQuery();

  const completeMutation = (trpc as any).maintenance.complete.useMutation({
    onSuccess: () => { toast.success("Maintenance completed"); scheduledQuery.refetch(); summaryQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const scheduleMutation = (trpc as any).maintenance.schedule.useMutation({
    onSuccess: () => { toast.success("Maintenance scheduled"); scheduledQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading maintenance data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
      case "scheduled": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zeun Maintenance Tracker</h1>
          <p className="text-slate-400 text-sm">Predictive maintenance and service management</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />Schedule Maintenance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalVehicles || 0}</p>
            )}
            <p className="text-xs text-slate-400">Vehicles</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.upToDate || 0}</p>
            )}
            <p className="text-xs text-slate-400">Up to Date</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.dueSoon || 0}</p>
            )}
            <p className="text-xs text-slate-400">Due Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
            )}
            <p className="text-xs text-slate-400">Overdue</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">${(summary?.costMTD || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Cost MTD</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertsQuery.data.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">{alert.vehicleUnit} - {alert.type}</p>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-600">Scheduled</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">History</TabsTrigger>
          <TabsTrigger value="predictive" className="data-[state=active]:bg-blue-600">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Fleet Health Score</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  {summaryQuery.isLoading ? <Skeleton className="h-32 w-32 rounded-full" /> : (
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                          strokeDasharray={`${(summary?.healthScore || 0) * 3.52} 352`}
                          className={cn(
                            (summary?.healthScore || 0) >= 80 ? "text-green-400" :
                            (summary?.healthScore || 0) >= 60 ? "text-yellow-400" : "text-red-400"
                          )} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className={cn(
                            "text-3xl font-bold",
                            (summary?.healthScore || 0) >= 80 ? "text-green-400" :
                            (summary?.healthScore || 0) >= 60 ? "text-yellow-400" : "text-red-400"
                          )}>{summary?.healthScore || 0}%</p>
                          <p className="text-xs text-slate-500">Health</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-slate-400">Vehicles Inspected</span><span className="text-white">{summary?.inspectedThisWeek || 0} / {summary?.totalVehicles || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Avg Days Since Service</span><span className="text-white">{summary?.avgDaysSinceService || 0} days</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Compliance Rate</span><span className="text-green-400">{summary?.complianceRate || 0}%</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Upcoming Maintenance</CardTitle></CardHeader>
              <CardContent>
                {scheduledQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (scheduledQuery.data as any)?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">No upcoming maintenance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(scheduledQuery.data as any)?.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <div className="flex items-center gap-3">
                          <Wrench className={cn("w-5 h-5", item.status === "overdue" ? "text-red-400" : "text-yellow-400")} />
                          <div>
                            <p className="text-white font-medium">{item.vehicleUnit}</p>
                            <p className="text-sm text-slate-400">{item.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{item.scheduledDate}</p>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {scheduledQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (scheduledQuery.data as any)?.length === 0 ? (
                <div className="p-12 text-center">
                  <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No scheduled maintenance</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {(scheduledQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", item.status === "overdue" ? "bg-red-500/20" : item.status === "in_progress" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                          <Wrench className={cn("w-5 h-5", item.status === "overdue" ? "text-red-400" : item.status === "in_progress" ? "text-blue-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.vehicleUnit}</p>
                          <p className="text-sm text-slate-400">{item.type} - {item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{item.scheduledDate}</p>
                          <p className="text-sm text-slate-500">${item.estimatedCost?.toLocaleString()}</p>
                        </div>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        {item.status !== "completed" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => completeMutation.mutate({ id: item.id })} disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Maintenance History</CardTitle></CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (historyQuery.data as any)?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No maintenance history</p>
              ) : (
                <div className="space-y-3">
                  {(historyQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                        <div>
                          <p className="text-white font-medium">{item.vehicleUnit}</p>
                          <p className="text-sm text-slate-400">{item.type} - {item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${item.actualCost?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{item.completedDate}</p>
                        </div>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" />Predictive Maintenance</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered Predictions</h3>
                <p className="text-slate-400 max-w-md mx-auto">Zeun analyzes vehicle telemetry, usage patterns, and historical data to predict maintenance needs before failures occur.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
