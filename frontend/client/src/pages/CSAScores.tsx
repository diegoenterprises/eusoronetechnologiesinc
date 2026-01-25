/**
 * CSA SCORES PAGE
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
  Shield, AlertTriangle, CheckCircle, TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CSAScores() {
  const scoresQuery = trpc.safety.getCSAScores.useQuery();
  const historyQuery = trpc.safety.getCSAHistory.useQuery();

  const scores = scoresQuery.data;

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.75) return "text-yellow-400";
    return "text-green-400";
  };

  const getProgressColor = (score: number, threshold: number) => {
    if (score >= threshold) return "bg-red-500";
    if (score >= threshold * 0.75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const basicCategories = [
    { key: "unsafeDriving", name: "Unsafe Driving", threshold: 65 },
    { key: "hosFatigue", name: "HOS Compliance", threshold: 65 },
    { key: "driverFitness", name: "Driver Fitness", threshold: 80 },
    { key: "controlledSubstances", name: "Controlled Substances", threshold: 80 },
    { key: "vehicleMaintenance", name: "Vehicle Maintenance", threshold: 80 },
    { key: "hazmat", name: "Hazmat Compliance", threshold: 80 },
    { key: "crashIndicator", name: "Crash Indicator", threshold: 65 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">CSA Scores</h1>
          <p className="text-slate-400 text-sm mt-1">Compliance, Safety, Accountability</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Shield className="w-6 h-6 text-cyan-400" /></div>
              <div>{scoresQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{scores?.overallScore}</p>}<p className="text-xs text-slate-400">Overall</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{scoresQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{scores?.categoriesPassing}</p>}<p className="text-xs text-slate-400">Passing</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{scoresQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{scores?.alerts || 0}</p>}<p className="text-xs text-slate-400">Alerts</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">{scores?.trend === "up" ? <TrendingUp className="w-6 h-6 text-red-400" /> : <TrendingDown className="w-6 h-6 text-green-400" />}</div>
              <div>{scoresQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", scores?.trend === "up" ? "text-red-400" : "text-green-400")}>{scores?.trendPercent}%</p>}<p className="text-xs text-slate-400">Trend</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />BASIC Categories</CardTitle></CardHeader>
        <CardContent>
          {scoresQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-4">
              {basicCategories.map((category) => {
                const score = scores?.categories?.[category.key] || 0;
                const isAlert = score >= category.threshold;
                return (
                  <div key={category.key} className={cn("p-4 rounded-xl", isAlert ? "bg-red-500/10 border border-red-500/30" : "bg-slate-700/30")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{category.name}</p>
                        {isAlert && <Badge className="bg-red-500 text-white border-0"><AlertTriangle className="w-3 h-3 mr-1" />Alert</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xl font-bold", getScoreColor(score, category.threshold))}>{score}%</span>
                        <span className="text-xs text-slate-500">/ {category.threshold}%</span>
                      </div>
                    </div>
                    <Progress value={score} className={cn("h-2", getProgressColor(score, category.threshold))} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" />Score History</CardTitle></CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-8"><Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No history</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {historyQuery.data?.map((entry: any) => (
                <div key={entry.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{entry.date}</p>
                    <p className="text-xs text-slate-500">{entry.inspections} inspections | {entry.violations} violations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-lg font-bold", entry.score <= 50 ? "text-green-400" : entry.score <= 75 ? "text-yellow-400" : "text-red-400")}>{entry.score}</span>
                    {entry.change !== 0 && (
                      <Badge className={cn("border-0", entry.change < 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                        {entry.change > 0 ? "+" : ""}{entry.change}
                      </Badge>
                    )}
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
