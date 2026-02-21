/**
 * SAFETY MANAGER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, User, AlertTriangle, TestTube, TrendingUp,
  CheckCircle, Clock, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyManagerDashboard() {
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
          <p className="text-slate-400 text-sm mt-1">Fleet safety management</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <FileText className="w-4 h-4 mr-2" />Safety Report
        </Button>
      </div>

      {statsQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", (stats?.safetyScore ?? 0) >= 90 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (stats?.safetyScore ?? 0) >= 70 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Safety Score</p>
                <p className={cn("text-5xl font-bold", (stats?.safetyScore ?? 0) >= 90 ? "text-green-400" : (stats?.safetyScore ?? 0) >= 70 ? "text-yellow-400" : "text-red-400")}>{stats?.safetyScore}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stats?.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />}
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><User className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeDrivers || 0}</p>}<p className="text-xs text-slate-400">Drivers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.openIncidents || 0}</p>}<p className="text-xs text-slate-400">Incidents</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.overdueItems || 0}</p>}<p className="text-xs text-slate-400">Overdue</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><TestTube className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.pendingTests || 0}</p>}<p className="text-xs text-slate-400">D&A Tests</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20"><AlertTriangle className="w-6 h-6 text-orange-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-orange-400">{stats?.csaAlerts || 0}</p>}<p className="text-xs text-slate-400">CSA Alerts</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />CSA BASIC Scores</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {csaQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6, 7].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
            ) : (
              (csaQuery.data as any)?.basics?.map((basic: any) => (
                <div key={basic.name} className="p-2 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{basic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", getScoreColor(basic.score, basic.threshold))}>{basic.score}%</span>
                      <span className="text-xs text-slate-500">/ {basic.threshold}%</span>
                    </div>
                  </div>
                  <Progress value={(basic.score / basic.threshold) * 100} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Top Performers</CardTitle></CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {(driversQuery.data as any)?.map((driver: any, i: number) => (
                    <div key={driver.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs", i === 0 ? "bg-yellow-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-slate-600 text-white")}>{i + 1}</div>
                        <div>
                          <p className="text-white text-sm">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.daysWithoutIncident} days safe</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{driver.score}</Badge>
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
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (incidentsQuery.data as any)?.length === 0 ? (
                <div className="p-3 text-center text-green-400 text-sm flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />No incidents</div>
              ) : (
                <div className="divide-y divide-red-500/20">
                  {(incidentsQuery.data as any)?.map((incident: any) => (
                    <div key={incident.id} className="p-2 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{incident.type}</p>
                        <p className="text-xs text-slate-500">{incident.driver} | {incident.date}</p>
                      </div>
                      <Badge className={cn("border-0 text-xs", incident.severity === "major" ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-400")}>{incident.severity}</Badge>
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
