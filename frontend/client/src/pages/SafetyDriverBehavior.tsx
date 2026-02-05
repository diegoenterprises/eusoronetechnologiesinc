/**
 * SAFETY DRIVER BEHAVIOR PAGE
 * 100% Dynamic - Monitor and analyze driver safety behavior
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Activity, Search, AlertTriangle, TrendingUp, TrendingDown,
  User, Shield, Clock, Gauge, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyDriverBehavior() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [riskFilter, setRiskFilter] = useState("all");

  const driversQuery = (trpc as any).safety.getDriverScores.useQuery();
  const statsQuery = (trpc as any).safety.getDashboardStats.useQuery();
  const eventsQuery = (trpc as any).safety.getIncidents.useQuery({});

  const drivers = driversQuery.data || [];
  const stats = statsQuery.data;
  const events = eventsQuery.data || [];

  const filteredDrivers = drivers.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-500/20 text-green-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "high": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Driver Behavior
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor driver safety metrics and behavior</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalDrivers || stats?.activeDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Avg Score</span>
                </div>
                <p className={cn("text-2xl font-bold", getScoreColor((stats as any)?.avgScore || stats?.safetyScore || 0))}>
                  {(stats as any)?.avgScore || stats?.safetyScore || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">High Risk</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.highRisk || stats?.csaAlerts || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Events Today</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.eventsToday || stats?.openIncidents || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Improved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.improved || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Events Alert */}
      {events.filter((e: any) => e.severity === "high").length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Events ({events.filter((e: any) => e.severity === "high").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.filter((e: any) => e.severity === "high").slice(0, 3).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">{event.driverName}</p>
                      <p className="text-slate-400 text-sm">{event.eventType} • {event.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search drivers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No driver data found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredDrivers.map((driver: any) => (
                <div key={driver.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  driver.riskLevel === "high" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl",
                        driver.score >= 90 ? "bg-green-500/20 text-green-400" :
                        driver.score >= 75 ? "bg-yellow-500/20 text-yellow-400" :
                        driver.score >= 60 ? "bg-orange-500/20 text-orange-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {driver.score}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{driver.name}</p>
                          <Badge className={cn("border-0", getRiskColor(driver.riskLevel))}>
                            {driver.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {driver.truckNumber} • {driver.distanceThisPeriod?.toLocaleString()} miles this period
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {driver.trend === "up" ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm">+{driver.trendValue}</span>
                        </div>
                      ) : driver.trend === "down" ? (
                        <div className="flex items-center gap-1 text-red-400">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-sm">-{Math.abs(driver.trendValue)}</span>
                        </div>
                      ) : null}
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-400 text-xs">Speeding</span>
                      </div>
                      <p className={cn("text-lg font-bold", driver.speedingScore >= 90 ? "text-green-400" : driver.speedingScore >= 75 ? "text-yellow-400" : "text-red-400")}>
                        {driver.speedingScore}
                      </p>
                      <Progress value={driver.speedingScore} className="h-1 mt-2" />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-400 text-xs">Hard Braking</span>
                      </div>
                      <p className={cn("text-lg font-bold", driver.brakingScore >= 90 ? "text-green-400" : driver.brakingScore >= 75 ? "text-yellow-400" : "text-red-400")}>
                        {driver.brakingScore}
                      </p>
                      <Progress value={driver.brakingScore} className="h-1 mt-2" />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-400 text-xs">Acceleration</span>
                      </div>
                      <p className={cn("text-lg font-bold", driver.accelerationScore >= 90 ? "text-green-400" : driver.accelerationScore >= 75 ? "text-yellow-400" : "text-red-400")}>
                        {driver.accelerationScore}
                      </p>
                      <Progress value={driver.accelerationScore} className="h-1 mt-2" />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-slate-400 text-xs">HOS Compliance</span>
                      </div>
                      <p className={cn("text-lg font-bold", driver.hosScore >= 90 ? "text-green-400" : driver.hosScore >= 75 ? "text-yellow-400" : "text-red-400")}>
                        {driver.hosScore}
                      </p>
                      <Progress value={driver.hosScore} className="h-1 mt-2" />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-400 text-xs">Events</span>
                      </div>
                      <p className="text-lg font-bold text-white">{driver.eventCount}</p>
                      <p className="text-slate-500 text-xs mt-1">{driver.criticalEvents} critical</p>
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
