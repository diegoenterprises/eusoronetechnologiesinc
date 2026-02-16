/**
 * ZEUN FLEET DASHBOARD
 * Fleet-wide breakdown & maintenance intelligence.
 * Theme-aware | Brand gradient | Premium UX.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { 
  Wrench, AlertTriangle, Truck, DollarSign,
  Clock, CheckCircle, RefreshCw, Download, BarChart3,
  Activity, Zap
} from "lucide-react";

export default function ZeunFleetDashboard() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "RESOLVED" | "ALL">("ALL");

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  const { data: breakdowns, isLoading: breakdownsLoading, refetch } = (trpc as any).zeunMechanics.getFleetBreakdowns.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const { data: costAnalytics, isLoading: costLoading } = (trpc as any).zeunMechanics.getFleetCostAnalytics.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const openBreakdowns = breakdowns?.filter((b: any) => !["RESOLVED", "CANCELLED"].includes(b.status)) || [];
  const resolvedBreakdowns = breakdowns?.filter((b: any) => b.status === "RESOLVED") || [];

  const getSeverityBadge = (severity: string) => {
    const m: Record<string, string> = {
      CRITICAL: "bg-red-500/15 text-red-500",
      HIGH: "bg-orange-500/15 text-orange-500",
      MEDIUM: "bg-yellow-500/15 text-yellow-500",
      LOW: "bg-green-500/15 text-green-500",
    };
    return m[severity] || "bg-slate-500/15 text-slate-400";
  };

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      RESOLVED: "bg-green-500/15 text-green-500",
      UNDER_REPAIR: "bg-blue-500/15 text-blue-500",
      WAITING_PARTS: "bg-yellow-500/15 text-yellow-500",
      REPORTED: "bg-orange-500/15 text-orange-500",
      DIAGNOSED: "bg-purple-500/15 text-purple-500",
    };
    return m[status] || "bg-slate-500/15 text-slate-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fleet Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">ZEUN</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Fleet-wide breakdown & maintenance intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: AlertTriangle, label: "Active Breakdowns", value: openBreakdowns.length, color: "orange", loading: breakdownsLoading },
          { icon: CheckCircle, label: "Resolved", value: resolvedBreakdowns.length, color: "green", loading: breakdownsLoading },
          { icon: DollarSign, label: "Total Repair Cost", value: `$${(costAnalytics?.totalCost || 0).toLocaleString()}`, color: "purple", loading: costLoading },
          { icon: Activity, label: "Breakdown Count", value: costAnalytics?.breakdownCount || 0, color: "blue", loading: costLoading },
        ].map((s) => {
          const colors: Record<string, string> = {
            orange: L ? "bg-orange-50 text-orange-500" : "bg-orange-500/10 text-orange-400",
            green: L ? "bg-green-50 text-green-500" : "bg-green-500/10 text-green-400",
            purple: L ? "bg-purple-50 text-purple-500" : "bg-purple-500/10 text-purple-400",
            blue: L ? "bg-blue-50 text-blue-500" : "bg-blue-500/10 text-blue-400",
          };
          return (
            <Card key={s.label} className={cc}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colors[s.color])}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[10px] font-medium uppercase tracking-wider", L ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
                    {s.loading ? <Skeleton className="h-7 w-16 mt-0.5" /> : (
                      <p className={cn("text-xl font-bold truncate", L ? "text-slate-800" : "text-white")}>{s.value}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <Card className={cc}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className={cn("text-[10px] font-medium uppercase tracking-wider block mb-1.5", L ? "text-slate-400" : "text-slate-500")}>Start Date</label>
              <Input type="date" value={dateRange.startDate} onChange={(e: any) => setDateRange({ ...dateRange, startDate: e.target.value })} className={cn("rounded-xl text-sm", L ? "" : "bg-slate-800/50 border-slate-700/50")} />
            </div>
            <div>
              <label className={cn("text-[10px] font-medium uppercase tracking-wider block mb-1.5", L ? "text-slate-400" : "text-slate-500")}>End Date</label>
              <Input type="date" value={dateRange.endDate} onChange={(e: any) => setDateRange({ ...dateRange, endDate: e.target.value })} className={cn("rounded-xl text-sm", L ? "" : "bg-slate-800/50 border-slate-700/50")} />
            </div>
            <div>
              <label className={cn("text-[10px] font-medium uppercase tracking-wider block mb-1.5", L ? "text-slate-400" : "text-slate-500")}>Status</label>
              <div className="flex gap-1.5">
                {(["ALL", "OPEN", "RESOLVED"] as const).map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      statusFilter === status
                        ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                        : L ? "border-slate-200 text-slate-500 hover:border-blue-300" : "border-slate-700 text-slate-400 hover:border-blue-500/50"
                    )}>{status}</button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cost by Category ── */}
      {costAnalytics?.byCategory && Object.keys(costAnalytics.byCategory).length > 0 && (
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className={cn("w-4 h-4", L ? "text-slate-500" : "text-slate-400")} />
              <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>Cost by Category</p>
            </div>
            <div className="space-y-3">
              {Object.entries(costAnalytics.byCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, cost]) => {
                  const percentage = costAnalytics.totalCost ? ((cost as number) / costAnalytics.totalCost) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>{category.replace(/_/g, " ")}</span>
                        <span className={cn("font-bold", L ? "text-slate-800" : "text-white")}>${(cost as number).toLocaleString()} <span className={cn(L ? "text-slate-400" : "text-slate-500")}>({percentage.toFixed(0)}%)</span></span>
                      </div>
                      <div className={cn("h-2 rounded-full overflow-hidden", L ? "bg-slate-100" : "bg-slate-700")}>
                        <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Breakdowns ── */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>Active Breakdowns</p>
            <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>— Requiring attention</span>
          </div>
          {breakdownsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : openBreakdowns.length > 0 ? (
            <div className="space-y-2">
              {openBreakdowns.map((b: any) => (
                <div key={b.id} className={cn("p-4 rounded-xl border transition-colors", L ? "bg-slate-50 border-slate-200 hover:bg-slate-100/80" : "bg-slate-800/50 border-slate-700/30 hover:bg-slate-800/70")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-bold", L ? "text-slate-400" : "text-slate-500")}>#{b.id}</span>
                        <Badge className={cn("border-0 text-[10px] font-bold", getSeverityBadge(b.severity))}>{b.severity}</Badge>
                        <Badge className={cn("border-0 text-[10px] font-bold", getStatusBadge(b.status))}>{b.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{b.issueCategory.replace(/_/g, " ")}</p>
                      <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>Driver: {b.driverName || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn("flex items-center gap-1 text-xs", L ? "text-slate-400" : "text-slate-500")}>
                        <Clock className="h-3 w-3" />
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                      {b.actualCost && (
                        <p className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">${b.actualCost.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", L ? "bg-green-50" : "bg-green-500/10")}>
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>All clear</p>
              <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>No active breakdowns</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recently Resolved ── */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>Recently Resolved</p>
          </div>
          {breakdownsLoading ? (
            <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : resolvedBreakdowns.length > 0 ? (
            <div className="space-y-2">
              {resolvedBreakdowns.slice(0, 5).map((b: any) => (
                <div key={b.id} className={cn("flex justify-between items-center p-3.5 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div>
                    <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{b.issueCategory.replace(/_/g, " ")}</p>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{b.driverName || "Unknown Driver"}</p>
                  </div>
                  <div className="text-right">
                    {b.actualCost ? (
                      <p className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${b.actualCost.toLocaleString()}</p>
                    ) : (
                      <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>No cost recorded</p>
                    )}
                    <p className={cn("text-[10px] mt-0.5", L ? "text-slate-400" : "text-slate-500")}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={cn("text-center py-6 text-sm", L ? "text-slate-400" : "text-slate-500")}>No resolved breakdowns in this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
