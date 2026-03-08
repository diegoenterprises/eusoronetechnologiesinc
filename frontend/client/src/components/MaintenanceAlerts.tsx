/**
 * MAINTENANCE ALERTS COMPONENT (GAP-101 Task 1.2)
 * Displays predictive maintenance alerts for vehicles at critical/high risk.
 * Embeddable panel with severity filter, badge counts, and dismiss actions.
 * Theme-aware | Brand gradient | Premium UX.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Shield, Wrench, Clock, Truck,
  ChevronRight, Bell, BellOff, Cog, CircuitBoard,
  Disc3, Zap, X,
} from "lucide-react";

interface MaintenanceAlertsProps {
  compact?: boolean;
  maxAlerts?: number;
}

export default function MaintenanceAlerts({ compact = false, maxAlerts = 20 }: MaintenanceAlertsProps) {
  const { theme } = useTheme();
  const L = theme === "light";
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high">("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  const { data: alerts, isLoading } = (trpc as any).fleetMaintenance.getMaintenanceAlerts.useQuery({
    severity: severityFilter,
    limit: maxAlerts,
  }, { refetchInterval: 60_000 });

  const { data: alertCounts } = (trpc as any).fleetMaintenance.getAlertCounts.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  const visibleAlerts = (alerts || []).filter((a: any) => !dismissedIds.has(a.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const componentIcon = (comp: string) => {
    const m: Record<string, any> = { engine: Cog, transmission: CircuitBoard, brakes: Disc3, suspension: Truck, electrical: Zap };
    return m[comp] || Wrench;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact badge summary */}
        <div className="flex items-center gap-2">
          <Bell className={cn("w-4 h-4", (alertCounts?.critical || 0) > 0 ? "text-red-500 animate-pulse" : "text-slate-400")} />
          <span className={cn("text-xs font-bold", L ? "text-slate-700" : "text-slate-200")}>Maintenance Alerts</span>
          {(alertCounts?.total || 0) > 0 && (
            <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px] font-bold">{alertCounts.total}</Badge>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : visibleAlerts.length > 0 ? (
          visibleAlerts.slice(0, 3).map((a: any) => (
            <div key={a.id} className={cn("flex items-center gap-2 p-2 rounded-lg text-xs",
              a.severity === "critical"
                ? (L ? "bg-red-50 border border-red-200" : "bg-red-500/5 border border-red-500/20")
                : (L ? "bg-orange-50 border border-orange-200" : "bg-orange-500/5 border border-orange-500/20")
            )}>
              <AlertTriangle className={cn("w-3.5 h-3.5 flex-shrink-0", a.severity === "critical" ? "text-red-500" : "text-orange-500")} />
              <span className={cn("truncate", L ? "text-slate-700" : "text-slate-200")}>{a.message}</span>
            </div>
          ))
        ) : (
          <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>No active alerts</p>
        )}
      </div>
    );
  }

  return (
    <Card className={cc}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
              (alertCounts?.critical || 0) > 0
                ? (L ? "bg-red-50" : "bg-red-500/10")
                : (L ? "bg-blue-50" : "bg-blue-500/10")
            )}>
              <Bell className={cn("w-4 h-4",
                (alertCounts?.critical || 0) > 0 ? "text-red-500 animate-pulse" : "text-blue-500"
              )} />
            </div>
            <div>
              <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>Maintenance Alerts</p>
              <p className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>
                AI-predicted service needs
              </p>
            </div>
            {(alertCounts?.total || 0) > 0 && (
              <div className="flex gap-1.5 ml-2">
                {(alertCounts?.critical || 0) > 0 && (
                  <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px] font-bold animate-pulse">
                    {alertCounts.critical} Critical
                  </Badge>
                )}
                {(alertCounts?.high || 0) > 0 && (
                  <Badge className="bg-orange-500/15 text-orange-500 border-0 text-[10px] font-bold">
                    {alertCounts.high} High
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Severity filter */}
          <div className="flex gap-1">
            {(["all", "critical", "high"] as const).map((s) => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-bold transition-all border capitalize",
                  severityFilter === s
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                    : L ? "border-slate-200 text-slate-500 hover:border-blue-300" : "border-slate-700 text-slate-400 hover:border-blue-500/50"
                )}>{s}</button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : visibleAlerts.length > 0 ? (
          <div className="space-y-2">
            {visibleAlerts.map((alert: any) => {
              const Icon = componentIcon(alert.component);
              return (
                <div key={alert.id} className={cn("p-3.5 rounded-xl border transition-all",
                  alert.severity === "critical"
                    ? (L ? "bg-red-50/80 border-red-200 hover:bg-red-50" : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10")
                    : (L ? "bg-orange-50/80 border-orange-200 hover:bg-orange-50" : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10")
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      alert.severity === "critical"
                        ? (L ? "bg-red-100" : "bg-red-500/15")
                        : (L ? "bg-orange-100" : "bg-orange-500/15")
                    )}>
                      <Icon className={cn("w-4 h-4", alert.severity === "critical" ? "text-red-500" : "text-orange-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-xs font-bold", L ? "text-slate-700" : "text-slate-200")}>{alert.vehicleUnit}</span>
                        <Badge className={cn("border-0 text-[9px] font-bold capitalize",
                          alert.severity === "critical" ? "bg-red-500/15 text-red-500" : "bg-orange-500/15 text-orange-500"
                        )}>{alert.severity}</Badge>
                        <span className={cn("text-[10px] font-medium capitalize", L ? "text-slate-400" : "text-slate-500")}>{alert.component}</span>
                      </div>
                      <p className={cn("text-xs leading-relaxed", L ? "text-slate-600" : "text-slate-300")}>{alert.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>
                            {alert.daysRemaining <= 0 ? "Overdue" : `${alert.daysRemaining} days`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>
                            {alert.milesRemaining.toLocaleString()} mi
                          </span>
                        </div>
                        <span className={cn("text-[9px]", L ? "text-slate-400" : "text-slate-500")}>
                          {(alert.confidenceScore * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0",
                        L ? "hover:bg-slate-200/60 text-slate-400" : "hover:bg-slate-700/60 text-slate-500"
                      )}
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", L ? "bg-green-50" : "bg-green-500/10")}>
              <Shield className="h-7 w-7 text-green-500" />
            </div>
            <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>Fleet is healthy</p>
            <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>No critical or high-risk maintenance alerts</p>
          </div>
        )}

        {/* Dismissed count */}
        {dismissedIds.size > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed" style={{ borderColor: L ? "#e2e8f0" : "#334155" }}>
            <div className="flex items-center gap-1.5">
              <BellOff className="w-3 h-3 text-slate-400" />
              <span className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>{dismissedIds.size} dismissed</span>
            </div>
            <button
              onClick={() => setDismissedIds(new Set())}
              className={cn("text-[10px] font-bold", L ? "text-blue-500 hover:text-blue-600" : "text-blue-400 hover:text-blue-300")}
            >
              Show all
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
