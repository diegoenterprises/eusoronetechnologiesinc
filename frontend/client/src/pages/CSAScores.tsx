/**
 * CSA SCORES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CSAScores() {
  const [selectedCarrier, setSelectedCarrier] = useState("current");

  const scoresQuery = trpc.safety.getCSAScores.useQuery({ carrierId: selectedCarrier === "current" ? undefined : selectedCarrier });
  const carriersQuery = trpc.carrier.getCarriers.useQuery({ limit: 50 });
  const historyQuery = trpc.safety.getCSAHistory.useQuery({ carrierId: selectedCarrier === "current" ? undefined : selectedCarrier, limit: 12 });

  const scores = scoresQuery.data;

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.75) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreBg = (score: number, threshold: number) => {
    if (score >= threshold) return "[&>div]:bg-red-500";
    if (score >= threshold * 0.75) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-green-500";
  };

  const basicCategories = [
    { key: "unsafeDriving", name: "Unsafe Driving", threshold: 65 },
    { key: "hoursOfService", name: "Hours of Service", threshold: 65 },
    { key: "driverFitness", name: "Driver Fitness", threshold: 80 },
    { key: "controlledSubstances", name: "Controlled Substances", threshold: 80 },
    { key: "vehicleMaintenance", name: "Vehicle Maintenance", threshold: 80 },
    { key: "hazmat", name: "Hazardous Materials", threshold: 80 },
    { key: "crashIndicator", name: "Crash Indicator", threshold: 65 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            CSA BASIC Scores
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compliance, Safety, Accountability metrics</p>
        </div>
        <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
          <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">My Company</SelectItem>
            {carriersQuery.data?.map((carrier: any) => (
              <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overall Status */}
      {scoresQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", scores?.alertStatus === "none" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", scores?.alertStatus === "none" ? "bg-green-500/20" : "bg-red-500/20")}>
                <Shield className={cn("w-8 h-8", scores?.alertStatus === "none" ? "text-green-400" : "text-red-400")} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-2xl font-bold">{scores?.carrierName}</p>
                  {scores?.alertStatus === "none" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />No Alerts</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />{scores?.alertCount} Alerts</Badge>
                  )}
                </div>
                <p className="text-slate-400">DOT: {scores?.dotNumber} | MC: {scores?.mcNumber}</p>
                <p className="text-xs text-slate-500 mt-1">Last updated: {scores?.lastUpdated}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Safety Rating</p>
                <p className={cn("text-2xl font-bold", scores?.safetyRating === "Satisfactory" ? "text-green-400" : scores?.safetyRating === "Conditional" ? "text-yellow-400" : "text-red-400")}>
                  {scores?.safetyRating || "Not Rated"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BASIC Scores Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            BASIC Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scoresQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {basicCategories.map((category) => {
                const score = scores?.basics?.[category.key] || 0;
                const isAlert = score >= category.threshold;
                return (
                  <div key={category.key} className={cn("p-4 rounded-xl border", isAlert ? "bg-red-500/5 border-red-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{category.name}</p>
                        {isAlert && <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3" /></Badge>}
                      </div>
                      <span className={cn("text-2xl font-bold", getScoreColor(score, category.threshold))}>{score}%</span>
                    </div>
                    <Progress value={score} className={cn("h-2", getScoreBg(score, category.threshold))} />
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>Threshold: {category.threshold}%</span>
                      <span className="flex items-center gap-1">
                        {scores?.basicsTrend?.[category.key] === "up" ? <TrendingUp className="w-3 h-3 text-red-400" /> : scores?.basicsTrend?.[category.key] === "down" ? <TrendingDown className="w-3 h-3 text-green-400" /> : null}
                        {scores?.basicsTrend?.[category.key] === "up" ? "Increasing" : scores?.basicsTrend?.[category.key] === "down" ? "Decreasing" : "Stable"}
                      </span>
                    </div>
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
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No history available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {historyQuery.data?.map((entry: any) => (
                <div key={entry.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{entry.period}</p>
                    <p className="text-xs text-slate-500">{entry.inspections} inspections, {entry.violations} violations</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {entry.alertCount > 0 ? (
                      <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />{entry.alertCount} Alerts</Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Clear</Badge>
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
