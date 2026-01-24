/**
 * CSA SCORES DASHBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Users,
  Truck, Clock, Wrench, Activity, Eye, Award, RefreshCw, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CSAScoresDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const basicsQuery = trpc.csa.getBasicScores.useQuery();
  const driversQuery = trpc.csa.getDriverScores.useQuery({ limit: 20 });
  const alertsQuery = trpc.csa.getAlerts.useQuery();
  const trendsQuery = trpc.csa.getTrends.useQuery();

  const refreshMutation = trpc.csa.refreshScores.useMutation({
    onSuccess: () => { toast.success("Scores refreshed"); basicsQuery.refetch(); },
    onError: (error) => toast.error("Refresh failed", { description: error.message }),
  });

  if (basicsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading CSA data</p>
        <Button className="mt-4" onClick={() => basicsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.75) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreBg = (score: number, threshold: number) => {
    if (score >= threshold) return "bg-red-500/20 border-red-500/50";
    if (score >= threshold * 0.75) return "bg-yellow-500/20 border-yellow-500/50";
    return "bg-green-500/20 border-green-500/50";
  };

  const getBasicIcon = (basicId: string) => {
    switch (basicId) {
      case "unsafe_driving": return Truck;
      case "hos_fatigue": return Clock;
      case "driver_fitness": return Users;
      case "vehicle_maintenance": return Wrench;
      case "controlled_substances": return Shield;
      case "hazmat": return AlertTriangle;
      case "crash_indicator": return Activity;
      default: return Shield;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CSA BASIC Scores</h1>
          <p className="text-slate-400 text-sm">Compliance, Safety, Accountability monitoring</p>
        </div>
        <Button variant="outline" className="border-slate-600" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          {refreshMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Scores
        </Button>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BASIC Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {basicsQuery.isLoading ? (
          [1, 2, 3, 4, 5, 6, 7].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>)
        ) : (
          basicsQuery.data?.map((basic) => {
            const BasicIcon = getBasicIcon(basic.id);
            return (
              <Card key={basic.id} className={cn("border", getScoreBg(basic.score, basic.threshold))}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BasicIcon className={cn("w-5 h-5", getScoreColor(basic.score, basic.threshold))} />
                      <span className="text-white font-medium text-sm">{basic.name}</span>
                    </div>
                    {basic.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : basic.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-green-400" />
                    ) : null}
                  </div>
                  <div className="text-center mb-3">
                    <p className={cn("text-4xl font-bold", getScoreColor(basic.score, basic.threshold))}>{basic.score}%</p>
                    <p className="text-xs text-slate-500">Threshold: {basic.threshold}%</p>
                  </div>
                  <Progress value={basic.score} max={100} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{basic.inspections} inspections</span>
                    <span>{basic.violations} violations</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Driver Scores</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Score Summary</CardTitle></CardHeader>
              <CardContent>
                {basicsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {basicsQuery.data?.map((basic) => (
                      <div key={basic.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <span className="text-slate-400">{basic.name}</span>
                        <div className="flex items-center gap-3">
                          <span className={cn("font-bold", getScoreColor(basic.score, basic.threshold))}>{basic.score}%</span>
                          <Badge className={basic.score >= basic.threshold ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                            {basic.score >= basic.threshold ? "Alert" : "OK"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Recent Inspections</CardTitle></CardHeader>
              <CardContent>
                {trendsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {trendsQuery.data?.recentInspections?.map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <div>
                          <p className="text-white">{inspection.driverName}</p>
                          <p className="text-xs text-slate-500">{inspection.date} - {inspection.location}</p>
                        </div>
                        <Badge className={inspection.violations === 0 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {inspection.violations} violations
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />Driver Safety Scores</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No driver scores available</p>
              ) : (
                <div className="space-y-3">
                  {driversQuery.data?.map((driver, idx) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">{idx + 1}</div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.inspections} inspections | {driver.violations} violations</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn("text-xl font-bold", driver.score >= 90 ? "text-green-400" : driver.score >= 70 ? "text-yellow-400" : "text-red-400")}>{driver.score}</p>
                          <p className="text-xs text-slate-500">Score</p>
                        </div>
                        {driver.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : driver.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-400" /> : null}
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Score Trends (12 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
                <Activity className="w-12 h-12 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
