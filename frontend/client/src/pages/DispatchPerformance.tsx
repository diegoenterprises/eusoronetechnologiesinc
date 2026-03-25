/**
 * DISPATCH PERFORMANCE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Star, Award, Target,
  CheckCircle, Clock, DollarSign, Truck, AlertTriangle, Zap,
  Shield, Flame, Trophy, MapPin, ArrowRight, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DispatchPerformance() {
  const statsQuery = (trpc as any).dispatchRole.getPerformanceStats.useQuery();
  const metricsQuery = (trpc as any).dispatchRole.getPerformanceMetrics.useQuery();
  const historyQuery = (trpc as any).dispatchRole.getPerformanceHistory.useQuery({ limit: 20 });

  const stats = statsQuery.data;
  const trendIcon = stats?.trend === 'up' ? TrendingUp : stats?.trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const handleRefresh = () => {
    statsQuery.refetch();
    metricsQuery.refetch();
    historyQuery.refetch();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-3">
            <Trophy className="w-8 h-8 text-cyan-400" />
            Performance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your success metrics and analytics — all data from real loads</p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.trend && (
            <Badge className={cn("text-xs gap-1 border-0",
              stats.trend === 'up' ? "bg-green-500/20 text-green-400" :
              stats.trend === 'down' ? "bg-red-500/20 text-red-400" :
              "bg-slate-500/20 text-slate-400"
            )}>
              <TrendIcon className="w-3 h-3" />
              {stats.trend === 'up' ? 'Trending Up' : stats.trend === 'down' ? 'Needs Attention' : 'Stable'}
            </Badge>
          )}
          <button onClick={handleRefresh} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <RefreshCw className={cn("w-4 h-4 text-slate-400", statsQuery.isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Completed", value: stats?.loadsCompleted, icon: Target, color: "text-cyan-400", bg: "bg-cyan-500/20", format: (v: any) => String(v || 0) },
          { label: "Success Rate", value: stats?.successRate, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20", format: (v: any) => `${v || 0}%` },
          { label: "Rating", value: stats?.rating, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/20", format: (v: any) => v ? `${v}/5` : "0" },
          { label: "On-Time", value: stats?.onTimeRate, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/20", format: (v: any) => `${v || 0}%` },
          { label: "Earnings", value: stats?.totalEarnings, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/20", format: (v: any) => `$${(v || 0).toLocaleString()}` },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", kpi.bg)}>
                  <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                </div>
                <div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-8 w-16 bg-slate-700" />
                  ) : (
                    <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.format(kpi.value)}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics + Achievements */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg bg-slate-700" />)}</div>
            ) : !metricsQuery.data || (metricsQuery.data as any[]).length === 0 ? (
              <div className="text-center py-10">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Complete loads to see metrics</p>
                <p className="text-xs text-slate-600 mt-1">Metrics are calculated from delivered loads</p>
              </div>
            ) : (
              (metricsQuery.data as any[]).map((metric: any) => {
                const pct = metric.target > 0 ? Math.min((metric.value / metric.target) * 100, 100) : 0;
                const atTarget = metric.value >= metric.target;
                return (
                  <div key={metric.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">{metric.name}</span>
                      <span className={cn("text-sm font-bold", atTarget ? "text-green-400" : pct >= 60 ? "text-cyan-400" : "text-yellow-400")}>
                        {metric.weightUnit === '$' ? `$${metric.value.toLocaleString()}` : `${metric.value.toLocaleString()}${metric.weightUnit}`}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500",
                          atTarget ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                          pct >= 60 ? "bg-gradient-to-r from-cyan-500 to-blue-400" :
                          "bg-gradient-to-r from-yellow-500 to-orange-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Target: {metric.weightUnit === '$' ? `$${metric.target.toLocaleString()}` : `${metric.target.toLocaleString()}${metric.weightUnit}`}
                      {atTarget && <span className="text-green-400 ml-2">Target met!</span>}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />Achievements
              {stats?.achievements && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs ml-2">
                  {stats.achievements.filter((a: any) => a.unlocked).length}/{stats.achievements.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg bg-slate-700" />)}</div>
            ) : !stats?.achievements || stats.achievements.length === 0 ? (
              <div className="text-center py-10">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No achievements yet</p>
                <p className="text-xs text-slate-600 mt-1">Complete deliveries to unlock achievements</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {stats.achievements.map((a: any) => {
                  const icons: Record<string, any> = {
                    'first-delivery': Truck, 'ten-loads': Zap, 'on-time-pro': Clock,
                    'revenue-50k': DollarSign, 'hazmat-specialist': Flame, 'elite-dispatcher': Shield,
                  };
                  const AchIcon = icons[a.id] || Award;
                  return (
                    <div key={a.id} className={cn(
                      "p-3 rounded-lg text-center transition-all duration-300",
                      a.unlocked
                        ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 hover:border-yellow-400/50"
                        : "bg-white/[0.02] border border-white/[0.04] opacity-40"
                    )}>
                      <AchIcon className={cn("w-7 h-7 mx-auto mb-2", a.unlocked ? "text-yellow-400" : "text-slate-600")} />
                      <p className={cn("text-xs font-semibold", a.unlocked ? "text-white" : "text-slate-500")}>{a.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />Recent Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg bg-slate-700" />)}</div>
          ) : !historyQuery.data || (Array.isArray(historyQuery.data) && historyQuery.data.length === 0) ? (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No deliveries yet</p>
              <p className="text-xs text-slate-500 mt-1">Completed loads will appear here with performance ratings</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(Array.isArray(historyQuery.data) ? historyQuery.data : []).map((item: any) => (
                <div key={item.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn("p-2 rounded-lg shrink-0",
                      item.onTime ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      {item.onTime ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{item.loadNumber}</p>
                        {item.cargoType === 'hazmat' && (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs px-1">HM</Badge>
                        )}
                        <Badge className={cn("border-0 text-xs px-1.5",
                          item.onTime ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                        )}>
                          {item.onTime ? 'On Time' : 'Late'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{item.route}</span>
                        {item.date && <span className="shrink-0 ml-1 text-slate-600">· {item.date}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-white font-bold text-sm">{item.rating}</span>
                    </div>
                    <p className="text-xs font-semibold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                      ${item.earnings?.toLocaleString()}
                    </p>
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
