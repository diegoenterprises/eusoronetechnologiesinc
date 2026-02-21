/**
 * SAFETY METRICS PAGE - Safety Manager
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Users, Truck, FileText, BarChart3, Activity, Target, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyMetrics() {
  const [timeframe, setTimeframe] = useState("30d");

  const metricsQuery = (trpc as any).safety.getMetrics.useQuery({ timeframe });
  const csaScoresQuery = (trpc as any).safety.getCSAScores.useQuery();
  const trendsQuery = (trpc as any).safety.getTrends.useQuery({ timeframe });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-green-500/10 to-green-600/5 border-green-500/20";
    if (score >= 70) return "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20";
    return "from-red-500/10 to-red-600/5 border-red-500/20";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Safety Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor safety performance and CSA scores</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40 bg-white/[0.04] border-white/[0.06] rounded-lg">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className={cn("bg-gradient-to-br rounded-xl", getScoreBg((metricsQuery.data as any)?.overallScore || 0))}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Overall Safety Score</p>
                    <p className={cn("text-3xl font-bold", getScoreColor((metricsQuery.data as any)?.overallScore || 0))}>
                      {(metricsQuery.data as any)?.overallScore || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {((metricsQuery.data as any)?.scoreTrend || 0) >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">+{(metricsQuery.data as any)?.scoreTrend}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">{(metricsQuery.data as any)?.scoreTrend}%</span>
                    </>
                  )}
                  <span className="text-slate-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Active Drivers</p>
                    <p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.activeDrivers || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {(metricsQuery.data as any)?.driversInCompliance || 0} in full compliance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Open Incidents</p>
                    <p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.openIncidents || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {(metricsQuery.data as any)?.incidentsThisMonth || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Days Without Incident</p>
                    <p className="text-3xl font-bold text-white">{(metricsQuery.data as any)?.daysWithoutIncident || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Record: {(metricsQuery.data as any)?.recordDays || 0} days
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              CSA BASIC Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {csaScoresQuery.isLoading ? (
              <div className="space-y-4">
                {Array(7).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {(csaScoresQuery.data as any)?.basics?.map((basic: any) => (
                  <div key={basic.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{basic.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-bold", getScoreColor(100 - basic.percentile))}>
                          {basic.percentile}%
                        </span>
                        {basic.alert && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Alert</Badge>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={basic.percentile} 
                      className={cn(
                        "h-2",
                        basic.percentile > 75 ? "[&>div]:bg-red-500" :
                        basic.percentile > 50 ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-green-500"
                      )}
                    />
                    <p className="text-xs text-slate-500">
                      Threshold: {basic.threshold}% | Inspections: {basic.inspections}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              Safety Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsQuery.isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {(trendsQuery.data as any)?.map((trend: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{trend.metric}</span>
                      <div className="flex items-center gap-1">
                        {trend.change >= 0 ? (
                          <TrendingUp className={cn("w-4 h-4", trend.positive ? "text-green-400" : "text-red-400")} />
                        ) : (
                          <TrendingDown className={cn("w-4 h-4", trend.positive ? "text-green-400" : "text-red-400")} />
                        )}
                        <span className={cn("text-sm font-bold", trend.positive ? "text-green-400" : "text-red-400")}>
                          {trend.change >= 0 ? "+" : ""}{trend.change}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Current: {trend.current}</span>
                      <span>Previous: {trend.previous}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            Safety Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(metricsQuery.data as any)?.goals?.map((goal: any) => (
                <div key={goal.name} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{goal.name}</span>
                    {goal.achieved ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <span className="text-xs text-slate-400">{goal.progress}%</span>
                    )}
                  </div>
                  <Progress value={goal.progress} className="h-2 mb-2" />
                  <p className="text-xs text-slate-500">
                    Target: {goal.target} | Current: {goal.current}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
