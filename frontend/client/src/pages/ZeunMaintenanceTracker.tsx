/**
 * ZEUN MAINTENANCE TRACKER
 * Predictive maintenance & service management.
 * Theme-aware | Brand gradient | Premium UX.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Wrench, Truck, AlertTriangle, CheckCircle, Clock,
  DollarSign, Search, Plus, Eye,
  Activity, Loader2, Zap, RefreshCw, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ZeunMaintenanceTracker() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

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

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className={cn("w-12 h-12 mx-auto mb-4", L ? "text-red-500" : "text-red-400")} />
        <p className={cn(L ? "text-red-600" : "text-red-400")}>Error loading maintenance data</p>
        <Button className="mt-4 rounded-xl" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      completed: "bg-green-500/15 text-green-500",
      in_progress: "bg-blue-500/15 text-blue-500",
      scheduled: "bg-yellow-500/15 text-yellow-500",
      overdue: "bg-red-500/15 text-red-500",
    };
    return m[status] || "bg-slate-500/15 text-slate-400";
  };

  const getPriorityBadge = (priority: string) => {
    const m: Record<string, string> = {
      critical: "bg-red-500/15 text-red-500",
      high: "bg-orange-500/15 text-orange-500",
      medium: "bg-yellow-500/15 text-yellow-500",
      low: "bg-green-500/15 text-green-500",
    };
    return m[priority] || "bg-slate-500/15 text-slate-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Maintenance Tracker</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Predictive</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Predictive maintenance & service management</p>
        </div>
        <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Schedule Maintenance
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Truck, label: "Vehicles", value: summary?.totalVehicles || 0, color: "blue" },
          { icon: CheckCircle, label: "Up to Date", value: summary?.upToDate || 0, color: "green" },
          { icon: Clock, label: "Due Soon", value: summary?.dueSoon || 0, color: "yellow" },
          { icon: AlertTriangle, label: "Overdue", value: summary?.overdue || 0, color: "red" },
          { icon: DollarSign, label: "Cost MTD", value: `$${(summary?.costMTD || 0).toLocaleString()}`, color: "purple" },
        ].map((s) => {
          const colors: Record<string, string> = {
            blue: L ? "bg-blue-50 text-blue-500" : "bg-blue-500/10 text-blue-400",
            green: L ? "bg-green-50 text-green-500" : "bg-green-500/10 text-green-400",
            yellow: L ? "bg-yellow-50 text-yellow-600" : "bg-yellow-500/10 text-yellow-400",
            red: L ? "bg-red-50 text-red-500" : "bg-red-500/10 text-red-400",
            purple: L ? "bg-purple-50 text-purple-500" : "bg-purple-500/10 text-purple-400",
          };
          return (
            <Card key={s.label} className={cc}>
              <CardContent className="p-4 text-center">
                <div className={cn("w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center", colors[s.color])}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                {summaryQuery.isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : (
                  <p className={cn("text-xl font-bold", L ? "text-slate-800" : "text-white")}>{s.value}</p>
                )}
                <p className={cn("text-[10px] font-medium uppercase tracking-wider mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Alerts ── */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className={cn("rounded-2xl border", L ? "bg-red-50/80 border-red-200" : "bg-red-500/5 border-red-500/20")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className={cn("text-sm font-bold", L ? "text-red-700" : "text-red-400")}>Maintenance Alerts</span>
            </div>
            <div className="space-y-2">
              {alertsQuery.data.map((alert: any) => (
                <div key={alert.id} className={cn("flex items-center justify-between p-3 rounded-xl", L ? "bg-white border border-red-100" : "bg-slate-800/50 border border-red-500/10")}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div>
                      <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{alert.vehicleUnit} — {alert.type}</p>
                      <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{alert.message}</p>
                    </div>
                  </div>
                  <Badge className={cn("border-0 text-[10px] font-bold", getPriorityBadge(alert.priority))}>{alert.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("rounded-xl p-1", L ? "bg-slate-100" : "bg-slate-800 border border-slate-700")}>
          {["overview", "scheduled", "history", "predictive"].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className={cn("rounded-lg text-xs font-semibold capitalize data-[state=active]:shadow-sm",
                L ? "data-[state=active]:bg-white" : "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white"
              )}>{tab}</TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Fleet Health Score */}
            <Card className={cc}>
              <CardContent className="p-5">
                <p className={cn("text-sm font-bold mb-4", L ? "text-slate-800" : "text-white")}>Fleet Health Score</p>
                <div className="flex items-center justify-center mb-5">
                  {summaryQuery.isLoading ? <Skeleton className="h-32 w-32 rounded-full" /> : (
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className={L ? "text-slate-200" : "text-slate-700"} />
                        <circle cx="64" cy="64" r="56" stroke="url(#brandGrad)" strokeWidth="8" fill="none" strokeLinecap="round"
                          strokeDasharray={`${(summary?.healthScore || 0) * 3.52} 352`} />
                        <defs><linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1473FF" /><stop offset="100%" stopColor="#BE01FF" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{summary?.healthScore || 0}%</p>
                          <p className={cn("text-[10px] uppercase tracking-wider", L ? "text-slate-400" : "text-slate-500")}>Health</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Vehicles Inspected", value: `${summary?.inspectedThisWeek || 0} / ${summary?.totalVehicles || 0}` },
                    { label: "Avg Days Since Service", value: `${summary?.avgDaysSinceService || 0} days` },
                    { label: "Compliance Rate", value: `${summary?.complianceRate || 0}%`, gradient: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>{row.label}</span>
                      <span className={cn("text-sm font-semibold", row.gradient ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : L ? "text-slate-800" : "text-white")}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card className={cc}>
              <CardContent className="p-5">
                <p className={cn("text-sm font-bold mb-4", L ? "text-slate-800" : "text-white")}>Upcoming Maintenance</p>
                {scheduledQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                ) : (scheduledQuery.data as any)?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className={cn("text-sm", L ? "text-slate-500" : "text-slate-400")}>No upcoming maintenance</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(scheduledQuery.data as any)?.slice(0, 5).map((item: any) => (
                      <div key={item.id} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                        <div className="flex items-center gap-3">
                          <Wrench className={cn("w-4 h-4", item.status === "overdue" ? "text-red-500" : "text-yellow-500")} />
                          <div>
                            <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{item.vehicleUnit}</p>
                            <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{item.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>{item.scheduledDate}</p>
                          <Badge className={cn("border-0 text-[10px] font-bold mt-0.5", getStatusBadge(item.status))}>{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SCHEDULED */}
        <TabsContent value="scheduled" className="mt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search vehicles..." className={cn("pl-9 rounded-xl", L ? "" : "bg-slate-800/50 border-slate-700/50")} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-36 rounded-xl", L ? "" : "bg-slate-800/50 border-slate-700/50")}><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className={cc}>
            <CardContent className="p-0">
              {scheduledQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : (scheduledQuery.data as any)?.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center", L ? "bg-slate-100" : "bg-slate-700/50")}>
                    <Wrench className={cn("w-7 h-7", L ? "text-slate-400" : "text-slate-500")} />
                  </div>
                  <p className={cn("font-medium", L ? "text-slate-500" : "text-slate-400")}>No scheduled maintenance</p>
                </div>
              ) : (
                <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/30")}>
                  {(scheduledQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className={cn("flex items-center justify-between p-4 transition-colors", L ? "hover:bg-slate-50" : "hover:bg-slate-800/30")}>
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl",
                          item.status === "overdue" ? (L ? "bg-red-50" : "bg-red-500/10") :
                          item.status === "in_progress" ? (L ? "bg-blue-50" : "bg-blue-500/10") :
                          (L ? "bg-yellow-50" : "bg-yellow-500/10")
                        )}>
                          <Wrench className={cn("w-4 h-4",
                            item.status === "overdue" ? "text-red-500" :
                            item.status === "in_progress" ? "text-blue-500" : "text-yellow-500"
                          )} />
                        </div>
                        <div>
                          <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{item.vehicleUnit}</p>
                          <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{item.type} — {item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-300")}>{item.scheduledDate}</p>
                          <p className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>${item.estimatedCost?.toLocaleString()}</p>
                        </div>
                        <Badge className={cn("border-0 text-[10px] font-bold", getStatusBadge(item.status))}>{item.status}</Badge>
                        {item.status !== "completed" && (
                          <Button size="sm" className="rounded-xl bg-green-500 hover:bg-green-600 text-white h-8 w-8 p-0" onClick={() => completeMutation.mutate({ id: item.id })} disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
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

        {/* HISTORY */}
        <TabsContent value="history" className="mt-5">
          <Card className={cc}>
            <CardContent className="p-5">
              <p className={cn("text-sm font-bold mb-4", L ? "text-slate-800" : "text-white")}>Maintenance History</p>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : (historyQuery.data as any)?.length === 0 ? (
                <p className={cn("text-center py-8 text-sm", L ? "text-slate-400" : "text-slate-500")}>No maintenance history</p>
              ) : (
                <div className="space-y-2">
                  {(historyQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className={cn("flex items-center justify-between p-3.5 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-xl", L ? "bg-green-50" : "bg-green-500/10")}>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{item.vehicleUnit}</p>
                          <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{item.type} — {item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${item.actualCost?.toLocaleString()}</p>
                          <p className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>{item.completedDate}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-xl"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREDICTIVE */}
        <TabsContent value="predictive" className="mt-5">
          <Card className={cc}>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center">
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className={cn("text-xl font-bold mb-2", L ? "text-slate-800" : "text-white")}>AI-Powered Predictions</h3>
              <p className={cn("text-sm max-w-md mx-auto", L ? "text-slate-500" : "text-slate-400")}>
                ZEUN analyzes vehicle telemetry, usage patterns, and historical data to predict maintenance needs before failures occur.
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] border-0">
                  <Zap className="w-3 h-3 mr-1" />ESANG AI Powered
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
