/**
 * SAFETY DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, User, TestTube, Truck,
  TrendingUp, TrendingDown, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyDashboard() {
  const statsQuery = (trpc as any).safety.getDashboardStats.useQuery();
  const csaQuery = (trpc as any).safety.getCSAOverview.useQuery();
  const incidentsQuery = (trpc as any).safety.getRecentIncidents.useQuery({ limit: 5 });
  const driversQuery = (trpc as any).safety.getTopDrivers.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getScoreColor = (score: number, threshold: number) => {
    if (score <= threshold * 0.5) return "text-green-400";
    if (score <= threshold) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Safety Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet safety overview</p>
        </div>
      </div>

      {statsQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", (stats?.safetyScore ?? 0) >= 90 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (stats?.safetyScore ?? 0) >= 70 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Safety Score</p>
                <p className={cn("text-5xl font-bold", (stats?.safetyScore ?? 0) >= 90 ? "text-green-400" : (stats?.safetyScore ?? 0) >= 70 ? "text-yellow-400" : "text-red-400")}>{stats?.safetyScore}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stats?.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  <span className="text-sm text-slate-400">{stats?.trendPercent}% from last month</span>
                </div>
              </div>
              <div className={cn("p-4 rounded-full", (stats?.safetyScore ?? 0) >= 90 ? "bg-green-500/20" : (stats?.safetyScore ?? 0) >= 70 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Shield className={cn("w-12 h-12", (stats?.safetyScore ?? 0) >= 90 ? "text-green-400" : (stats?.safetyScore ?? 0) >= 70 ? "text-yellow-400" : "text-red-400")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><User className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeDrivers || 0}</p>}<p className="text-xs text-slate-400">Active Drivers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.openIncidents || 0}</p>}<p className="text-xs text-slate-400">Open Incidents</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><TestTube className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pendingTests || 0}</p>}<p className="text-xs text-slate-400">D&A Tests</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20"><AlertTriangle className="w-6 h-6 text-orange-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-orange-400">{stats?.csaAlerts || 0}</p>}<p className="text-xs text-slate-400">CSA Alerts</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />CSA BASIC Scores</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {csaQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5, 6, 7].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              (csaQuery.data as any)?.basics?.map((basic: any) => (
                <div key={basic.name} className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{basic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getScoreColor(basic.score, basic.threshold))}>{basic.score}%</span>
                      <span className="text-xs text-slate-500">/ {basic.threshold}%</span>
                    </div>
                  </div>
                  <Progress value={(basic.score / basic.threshold) * 100} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Top Safety Performers</CardTitle></CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(driversQuery.data as any)?.map((driver: any, i: number) => (
                    <div key={driver.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-white", i === 0 ? "bg-yellow-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-600" : "bg-slate-600")}>{i + 1}</div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.distance?.toLocaleString()} miles | {driver.daysWithoutIncident} days safe</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0">{driver.score}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Recent Incidents</CardTitle></CardHeader>
            <CardContent className="p-0">
              {incidentsQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (incidentsQuery.data as any)?.length === 0 ? (
                <div className="p-4 text-center text-green-400 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />No recent incidents</div>
              ) : (
                <div className="divide-y divide-red-500/20">
                  {(incidentsQuery.data as any)?.map((incident: any) => (
                    <div key={incident.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{incident.type}</p>
                        <p className="text-xs text-slate-500">{incident.driver} | {incident.date}</p>
                      </div>
                      <Badge className={cn("border-0", incident.severity === "major" ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-400")}>{incident.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
