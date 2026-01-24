/**
 * SAFETY DASHBOARD PAGE
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
  Truck, Clock, CheckCircle, Eye, Award, Activity, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = trpc.safety.getSummary.useQuery();
  const driversQuery = trpc.safety.getDriverSafetyCards.useQuery();
  const incidentsQuery = trpc.safety.getRecentIncidents.useQuery({ limit: 10 });
  const alertsQuery = trpc.safety.getAlerts.useQuery();

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading safety data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500/20 border-green-500/30";
    if (score >= 70) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Safety Dashboard</h1>
          <p className="text-slate-400 text-sm">Fleet safety monitoring and compliance</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Safety Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn("border", getScoreBg(summary?.overallScore || 0))}>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className={cn("text-2xl font-bold", getScoreColor(summary?.overallScore || 0))}>{summary?.overallScore || 0}</p>
            )}
            <p className="text-xs text-slate-400">Safety Score</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.cleanInspections || 0}</p>
            )}
            <p className="text-xs text-slate-400">Clean Inspections</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.incidents || 0}</p>
            )}
            <p className="text-xs text-slate-400">Incidents MTD</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.daysSinceIncident || 0}</p>
            )}
            <p className="text-xs text-slate-400">Days Safe</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Drivers</TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-blue-600">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Safety Metrics</CardTitle></CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-slate-400">Inspection Pass Rate</span><span className="text-white">{summary?.inspectionPassRate || 0}%</span></div>
                      <Progress value={summary?.inspectionPassRate || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-slate-400">HOS Compliance</span><span className="text-white">{summary?.hosCompliance || 0}%</span></div>
                      <Progress value={summary?.hosCompliance || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-slate-400">DVIR Completion</span><span className="text-white">{summary?.dvirCompletion || 0}%</span></div>
                      <Progress value={summary?.dvirCompletion || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-slate-400">Training Completion</span><span className="text-white">{summary?.trainingCompletion || 0}%</span></div>
                      <Progress value={summary?.trainingCompletion || 0} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Recent Incidents</CardTitle></CardHeader>
              <CardContent>
                {incidentsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : incidentsQuery.data?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">No recent incidents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidentsQuery.data?.slice(0, 5).map((incident) => (
                      <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <div>
                          <p className="text-white">{incident.type}</p>
                          <p className="text-xs text-slate-500">{incident.driverName} - {incident.date}</p>
                        </div>
                        <Badge className={incident.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {incident.severity}
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
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />Driver Safety Cards</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No driver data available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driversQuery.data?.map((driver) => (
                    <Card key={driver.id} className={cn("border", getScoreBg(driver.safetyScore))}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.truckNumber}</p>
                          </div>
                          <div className={cn("text-2xl font-bold", getScoreColor(driver.safetyScore))}>{driver.safetyScore}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div><p className="text-white font-medium">{driver.incidents}</p><p className="text-slate-500">Incidents</p></div>
                          <div><p className="text-white font-medium">{driver.violations}</p><p className="text-slate-500">Violations</p></div>
                          <div><p className="text-white font-medium">{driver.inspections}</p><p className="text-slate-500">Inspections</p></div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {driver.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : driver.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Activity className="w-4 h-4 text-slate-400" />}
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">All Incidents</CardTitle></CardHeader>
            <CardContent>
              {incidentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : incidentsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No incidents recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidentsQuery.data?.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", incident.severity === "critical" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                          <AlertTriangle className={cn("w-5 h-5", incident.severity === "critical" ? "text-red-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{incident.type}</p>
                          <p className="text-sm text-slate-400">{incident.driverName} - {incident.vehicleUnit}</p>
                          <p className="text-xs text-slate-500">{incident.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{incident.date}</p>
                          <Badge className={incident.status === "closed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{incident.status}</Badge>
                        </div>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
