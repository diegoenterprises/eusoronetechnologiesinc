/**
 * CSA SCORES PAGE
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
  Shield, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CSA_BASICS = [
  { key: "unsafe_driving", name: "Unsafe Driving", threshold: 65 },
  { key: "hos_compliance", name: "HOS Compliance", threshold: 65 },
  { key: "driver_fitness", name: "Driver Fitness", threshold: 80 },
  { key: "controlled_substances", name: "Controlled Substances", threshold: 80 },
  { key: "vehicle_maintenance", name: "Vehicle Maintenance", threshold: 80 },
  { key: "hazmat_compliance", name: "Hazmat Compliance", threshold: 80 },
  { key: "crash_indicator", name: "Crash Indicator", threshold: 65 },
];

export default function CSAScores() {
  const scoresQuery = trpc.safety.getCSAScores.useQuery();
  const historyQuery = trpc.safety.getCSAHistory.useQuery({ months: 12 });

  const refreshMutation = trpc.safety.refreshCSAScores.useMutation({
    onSuccess: () => { toast.success("CSA scores refreshed"); scoresQuery.refetch(); },
    onError: (error) => toast.error("Refresh failed", { description: error.message }),
  });

  const scores = scoresQuery.data;

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.75) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreBg = (score: number, threshold: number) => {
    if (score >= threshold) return "bg-red-500/20";
    if (score >= threshold * 0.75) return "bg-yellow-500/20";
    return "bg-green-500/20";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            CSA Scores
          </h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA Compliance, Safety, Accountability</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshMutation.isPending && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Overall Safety Rating</p>
              {scoresQuery.isLoading ? <Skeleton className="h-12 w-32" /> : (
                <div className="flex items-center gap-4">
                  <p className={cn("text-5xl font-bold", scores?.overallRating === "Satisfactory" ? "text-green-400" : scores?.overallRating === "Conditional" ? "text-yellow-400" : "text-red-400")}>
                    {scores?.overallRating || "N/A"}
                  </p>
                  {scores?.trend !== 0 && (
                    <div className={cn("flex items-center gap-1", scores?.trend < 0 ? "text-green-400" : "text-red-400")}>
                      {scores?.trend < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                      <span className="font-medium">{Math.abs(scores?.trend || 0)}%</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">Last updated: {scores?.lastUpdated || "N/A"}</p>
            </div>
            <div className="p-4 rounded-full bg-cyan-500/20">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BASIC Scores */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">BASIC Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {scoresQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CSA_BASICS.map((basic) => {
                const score = scores?.basics?.[basic.key] || 0;
                const isAlert = score >= basic.threshold;
                
                return (
                  <div key={basic.key} className={cn("p-4 rounded-xl border-2", isAlert ? "bg-red-500/10 border-red-500/30" : "bg-slate-700/30 border-transparent")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isAlert ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        <span className="text-white font-medium">{basic.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-2xl font-bold", getScoreColor(score, basic.threshold))}>{score}</span>
                        <span className="text-xs text-slate-500">/ {basic.threshold}</span>
                      </div>
                    </div>
                    <Progress value={(score / 100) * 100} className={cn("h-2", isAlert ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500")} />
                    {isAlert && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Above intervention threshold
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Score History (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : historyQuery.data?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No history available</p>
          ) : (
            <div className="space-y-3">
              {historyQuery.data?.map((entry: any) => (
                <div key={entry.month} className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{entry.month}</p>
                    <p className="text-xs text-slate-500">{entry.inspections} inspections</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {entry.alerts > 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        {entry.alerts} alerts
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      {entry.change !== 0 && (
                        <span className={cn("flex items-center text-sm", entry.change < 0 ? "text-green-400" : "text-red-400")}>
                          {entry.change < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          {Math.abs(entry.change)}%
                        </span>
                      )}
                    </div>
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
