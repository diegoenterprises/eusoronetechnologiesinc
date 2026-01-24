/**
 * SAFETY DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Shield, AlertTriangle, Users, FileText, TrendingUp,
  Eye, Clock, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function SafetyDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = trpc.safety.getSummary.useQuery();
  const incidentsQuery = trpc.safety.getIncidents.useQuery({ limit: 10 });
  const driversQuery = trpc.safety.getDriverScores.useQuery();

  const summary = summaryQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Safety Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor fleet safety and compliance</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/incidents/report")}>
          <FileText className="w-4 h-4 mr-2" />Report Incident
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn("rounded-xl border", (summary?.safetyScore || 0) >= 90 ? "bg-green-500/10 border-green-500/30" : (summary?.safetyScore || 0) >= 70 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (summary?.safetyScore || 0) >= 90 ? "bg-green-500/20" : (summary?.safetyScore || 0) >= 70 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Shield className="w-6 h-6" style={{ color: (summary?.safetyScore || 0) >= 90 ? '#4ade80' : (summary?.safetyScore || 0) >= 70 ? '#facc15' : '#f87171' }} />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className={cn("text-2xl font-bold", getScoreColor(summary?.safetyScore || 0))}>{summary?.safetyScore || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Safety Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.activeDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.openIncidents || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.overdueItems || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.pendingTests || 0}</p>
                )}
                <p className="text-xs text-slate-400">D&A Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-slate-700 rounded-md">Incidents</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700 rounded-md">Driver Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">CSA BASIC Scores</CardTitle></CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {summary?.csaScores?.map((score: any) => (
                      <div key={score.name} className="p-3 rounded-xl bg-slate-700/30">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">{score.name}</span>
                          <span className={cn("font-bold", getScoreColor(100 - score.percentile))}>{score.percentile}%</span>
                        </div>
                        <Progress value={100 - score.percentile} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Recent Incidents</CardTitle></CardHeader>
              <CardContent>
                {incidentsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : incidentsQuery.data?.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-slate-400">No recent incidents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidentsQuery.data?.slice(0, 4).map((incident: any) => (
                      <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-full", incident.severity === "high" ? "bg-red-500/20" : incident.severity === "medium" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                            <AlertTriangle className={cn("w-4 h-4", incident.severity === "high" ? "text-red-400" : incident.severity === "medium" ? "text-yellow-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{incident.type}</p>
                            <p className="text-xs text-slate-500">{incident.date} • {incident.driverName}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">All Incidents</CardTitle></CardHeader>
            <CardContent>
              {incidentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : incidentsQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-slate-400">No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidentsQuery.data?.map((incident: any) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", incident.severity === "high" ? "bg-red-500/20" : incident.severity === "medium" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                          <AlertTriangle className={cn("w-5 h-5", incident.severity === "high" ? "text-red-400" : incident.severity === "medium" ? "text-yellow-400" : "text-blue-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{incident.type}</p>
                          <p className="text-sm text-slate-400">{incident.description}</p>
                          <p className="text-xs text-slate-500">{incident.date} • {incident.driverName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={incident.status === "resolved" ? "bg-green-500/20 text-green-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
                          {incident.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Driver Safety Scores</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No driver data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driversQuery.data?.map((driver: any) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-500/20">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.incidents} incidents • {driver.violations} violations</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={cn("text-xl font-bold", getScoreColor(driver.score))}>{driver.score}%</p>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
