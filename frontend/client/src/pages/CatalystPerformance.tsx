/**
 * CATALYST PERFORMANCE PAGE
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
  BarChart3, TrendingUp, Star, Award, Target,
  CheckCircle, Clock, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystPerformance() {
  const statsQuery = (trpc as any).catalysts.getPerformanceStats.useQuery();
  const metricsQuery = (trpc as any).catalysts.getPerformanceMetrics.useQuery();
  const historyQuery = (trpc as any).catalysts.getPerformanceHistory.useQuery({ limit: 10 });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Performance</h1>
          <p className="text-slate-400 text-sm mt-1">Your success metrics and analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Target className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.loadsCompleted || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.successRate}%</p>}<p className="text-xs text-slate-400">Success</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Star className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.rating}</p>}<p className="text-xs text-slate-400">Rating</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Clock className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.onTimeRate}%</p>}<p className="text-xs text-slate-400">On-Time</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><DollarSign className="w-6 h-6 text-emerald-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-emerald-400">${stats?.totalEarnings?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Earnings</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" />Performance Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {metricsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <>
                {(metricsQuery.data as any)?.map((metric: any) => (
                  <div key={metric.id} className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">{metric.name}</span>
                      <span className={cn("text-sm font-bold", metric.value >= metric.target ? "text-green-400" : "text-yellow-400")}>{metric.value}{metric.weightUnit}</span>
                    </div>
                    <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">Target: {metric.target}{metric.weightUnit}</p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" />Achievements</CardTitle></CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {stats?.achievements?.map((achievement: any) => (
                  <div key={achievement.id} className={cn("p-3 rounded-lg text-center", achievement.unlocked ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/30 opacity-50")}>
                    <Award className={cn("w-8 h-8 mx-auto mb-2", achievement.unlocked ? "text-yellow-400" : "text-slate-500")} />
                    <p className="text-white text-sm font-medium">{achievement.name}</p>
                    <p className="text-xs text-slate-500">{achievement.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />Recent Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : !historyQuery.data || (Array.isArray(historyQuery.data) && historyQuery.data.length === 0) ? (
            <div className="text-center py-16"><BarChart3 className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No performance history</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(historyQuery.data) ? historyQuery.data : []).map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", item.rating >= 4.5 ? "bg-green-500/20" : item.rating >= 4 ? "bg-cyan-500/20" : "bg-yellow-500/20")}>
                      <Star className={cn("w-5 h-5", item.rating >= 4.5 ? "text-green-400" : item.rating >= 4 ? "text-cyan-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Load #{item.loadNumber}</p>
                      <p className="text-xs text-slate-500">{item.route} - {item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-bold">{item.rating}</span>
                    </div>
                    <p className="text-xs text-green-400">${item.earnings?.toLocaleString()}</p>
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
