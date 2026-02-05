/**
 * CSA SCORES DASHBOARD PAGE
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
  Shield, AlertTriangle, TrendingUp, TrendingDown, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CSAScoresDashboard() {
  const scoresQuery = (trpc as any).safety.getCSAScoresList.useQuery();
  const summaryQuery = (trpc as any).safety.getCSASummary.useQuery();

  const summary = summaryQuery.data;

  const getScoreColor = (percentile: number) => {
    if (percentile <= 50) return "text-green-400";
    if (percentile <= 65) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (percentile: number) => {
    if (percentile <= 50) return "bg-green-500/20";
    if (percentile <= 65) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const getProgressColor = (percentile: number) => {
    if (percentile <= 50) return "from-green-500 to-emerald-500";
    if (percentile <= 65) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            CSA Scores Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compliance, Safety, Accountability BASIC scores</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => scoresQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className={cn("rounded-xl border-2", (summary?.overallScore || 0) <= 50 ? "bg-green-500/10 border-green-500/30" : (summary?.overallScore || 0) <= 65 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", getScoreBg(summary?.overallScore || 0))}>
                <Shield className={cn("w-10 h-10", getScoreColor(summary?.overallScore || 0))} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Overall CSA Score</p>
                {summaryQuery.isLoading ? <Skeleton className="h-12 w-24" /> : (
                  <p className={cn("text-4xl font-bold", getScoreColor(summary?.overallScore || 0))}>{summary?.overallScore || 0}%</p>
                )}
              </div>
            </div>
            <div className="text-right">
              {summary?.trend && (
                <div className={cn("flex items-center gap-1", summary.trend >= 0 ? "text-red-400" : "text-green-400")}>
                  {summary.trend >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="font-bold">{Math.abs(summary.trend)}%</span>
                </div>
              )}
              <p className="text-xs text-slate-500">vs last month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.satisfactory || 0}</p>
                )}
                <p className="text-xs text-slate-400">Satisfactory</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.conditional || 0}</p>
                )}
                <p className="text-xs text-slate-400">Conditional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.unsatisfactory || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unsatisfactory</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.inspections || 0}</p>
                )}
                <p className="text-xs text-slate-400">Inspections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BASIC Scores */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">BASIC Scores (7 Categories)</CardTitle>
        </CardHeader>
        <CardContent>
          {scoresQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3, 4, 5, 6, 7].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {(scoresQuery.data as any)?.map((score: any) => (
                <div key={score.id} className={cn("p-4 rounded-xl border", score.percentile <= 50 ? "bg-green-500/10 border-green-500/30" : score.percentile <= 65 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", getScoreBg(score.percentile))}>
                        <Shield className={cn("w-5 h-5", getScoreColor(score.percentile))} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{score.name}</p>
                        <p className="text-xs text-slate-500">{score.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold", getScoreColor(score.percentile))}>{score.percentile}%</p>
                      <Badge className={score.percentile <= 50 ? "bg-green-500/20 text-green-400 border-0" : score.percentile <= 65 ? "bg-yellow-500/20 text-yellow-400 border-0" : "bg-red-500/20 text-red-400 border-0"}>
                        {score.percentile <= 50 ? "Good" : score.percentile <= 65 ? "Warning" : "Alert"}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={cn("h-full bg-gradient-to-r transition-all", getProgressColor(score.percentile))} style={{ width: `${score.percentile}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Threshold: {score.threshold}%</span>
                    <span>Violations: {score.violations}</span>
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
