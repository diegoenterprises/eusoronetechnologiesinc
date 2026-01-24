/**
 * DRIVER SAFETY SCORECARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Users, Star, TrendingUp, TrendingDown, Search,
  Award, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function DriverSafetyScorecard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const driversQuery = trpc.safety.getDriverScores.useQuery({ limit: 50 });
  const summaryQuery = trpc.safety.getScoresSummary.useQuery();

  const summary = summaryQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500/20";
    if (score >= 70) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-0">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500/20 text-orange-400 border-0">Fair</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-0">Needs Improvement</Badge>;
  };

  const filteredDrivers = driversQuery.data?.filter((driver: any) => {
    return !searchTerm || driver.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Safety Scorecard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor and track driver safety performance</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.avgScore || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.excellentDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Excellent</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.needsImprovement || 0}</p>
                )}
                <p className="text-xs text-slate-400">Needs Work</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search drivers..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Drivers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Driver Scores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredDrivers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredDrivers?.map((driver: any, idx: number) => (
                <div key={driver.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(`/drivers/${driver.id}`)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                        {idx + 1}
                      </div>
                      <div className={cn("p-3 rounded-xl", getScoreBg(driver.overallScore))}>
                        <Shield className={cn("w-6 h-6", getScoreColor(driver.overallScore))} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getScoreBadge(driver.overallScore)}
                        </div>
                        <p className="text-sm text-slate-400">{driver.truckNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={cn("text-3xl font-bold", getScoreColor(driver.overallScore))}>{driver.overallScore}</p>
                        <p className="text-xs text-slate-500">Overall</p>
                      </div>
                      {driver.trend !== 0 && (
                        <div className={cn("flex items-center gap-1", driver.trend > 0 ? "text-green-400" : "text-red-400")}>
                          {driver.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-medium">{Math.abs(driver.trend)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">Driving</span>
                        <span className={cn("text-sm font-bold", getScoreColor(driver.drivingScore))}>{driver.drivingScore}</span>
                      </div>
                      <Progress value={driver.drivingScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">HOS</span>
                        <span className={cn("text-sm font-bold", getScoreColor(driver.hosScore))}>{driver.hosScore}</span>
                      </div>
                      <Progress value={driver.hosScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">Inspection</span>
                        <span className={cn("text-sm font-bold", getScoreColor(driver.inspectionScore))}>{driver.inspectionScore}</span>
                      </div>
                      <Progress value={driver.inspectionScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">Compliance</span>
                        <span className={cn("text-sm font-bold", getScoreColor(driver.complianceScore))}>{driver.complianceScore}</span>
                      </div>
                      <Progress value={driver.complianceScore} className="h-1.5" />
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
