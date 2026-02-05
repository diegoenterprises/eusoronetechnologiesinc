/**
 * SAFETY CSA SCORES PAGE
 * 100% Dynamic - Monitor CSA BASIC scores and alerts
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
  Shield, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Truck, FileText, ExternalLink, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const basicCategories = [
  { id: "unsafe_driving", name: "Unsafe Driving", threshold: 65, icon: AlertTriangle },
  { id: "hos", name: "HOS Compliance", threshold: 65, icon: Clock },
  { id: "driver_fitness", name: "Driver Fitness", threshold: 80, icon: Shield },
  { id: "controlled_substances", name: "Controlled Substances", threshold: 80, icon: AlertTriangle },
  { id: "vehicle_maintenance", name: "Vehicle Maintenance", threshold: 80, icon: Truck },
  { id: "hazmat", name: "Hazmat Compliance", threshold: 80, icon: AlertTriangle },
  { id: "crash_indicator", name: "Crash Indicator", threshold: 65, icon: AlertTriangle },
];

export default function SafetyCSAScores() {
  const [selectedCarrier, setSelectedCarrier] = useState("company");

  const scoresQuery = trpc.safety.getCSAScores.useQuery();
  const historyQuery = trpc.safety.getCSAHistory.useQuery({ months: 12 });
  const inspectionsQuery = trpc.safety.getVehicleInspections.useQuery({ vehicleId: "all" });
  const carriersQuery = trpc.carriers.list.useQuery({});

  const scores = scoresQuery.data as any;
  const history = (historyQuery.data as any) || [];
  const inspections = inspectionsQuery.data || [];
  const carriers = carriersQuery.data || [];

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return { text: "text-red-400", bg: "bg-red-500", bar: "bg-red-500" };
    if (score >= threshold - 15) return { text: "text-yellow-400", bg: "bg-yellow-500", bar: "bg-yellow-500" };
    return { text: "text-green-400", bg: "bg-green-500", bar: "bg-green-500" };
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            CSA Scores
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compliance, Safety, Accountability</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Our Company</SelectItem>
              {carriers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <ExternalLink className="w-4 h-4 mr-2" />
            FMCSA Portal
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={cn(
        "rounded-xl",
        (scores?.alerts?.length === 0) ? "bg-green-500/10 border-green-500/30" :
        (scores?.alerts && scores.alerts.length <= 2) ? "bg-yellow-500/10 border-yellow-500/30" :
        "bg-red-500/10 border-red-500/30"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-4 rounded-full",
                (scores?.alerts?.length === 0) ? "bg-green-500/20" :
                (scores?.alerts?.length || 0) <= 2 ? "bg-yellow-500/20" : "bg-red-500/20"
              )}>
                <Shield className={cn(
                  "w-10 h-10",
                  (scores?.alerts?.length === 0) ? "text-green-400" :
                  (scores?.alerts?.length || 0) <= 2 ? "text-yellow-400" : "text-red-400"
                )} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Safety Rating</p>
                <p className="text-white font-bold text-2xl capitalize">{(scores as any)?.safetyRating || "Satisfactory"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Alert Status</p>
              <Badge className={cn(
                "border-0 text-lg px-4 py-1",
                (scores?.alerts?.length === 0) ? "bg-green-500/20 text-green-400" :
                (scores?.alerts?.length || 0) <= 2 ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              )}>
                {scores?.alertsCount || 0} Alerts
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BASIC Scores */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            BASIC Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scoresQuery.isLoading ? (
            <div className="space-y-4">{Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-4">
              {basicCategories.map((category) => {
                const score = scores?.basics?.[category.id] || 0;
                const colors = getScoreColor(score, category.threshold);
                const Icon = category.icon;
                const isAlert = score >= category.threshold;

                return (
                  <div key={category.id} className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-5 h-5", colors.text)} />
                        <span className="text-white font-medium">{category.name}</span>
                        {isAlert && (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />Alert
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-xl", colors.text)}>{score}%</span>
                        <span className="text-slate-500 text-sm">/ {category.threshold}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={cn("absolute inset-y-0 left-0 transition-all", colors.bar)}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                      <div
                        className="absolute inset-y-0 w-0.5 bg-white/50"
                        style={{ left: `${category.threshold}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Threshold: {category.threshold}% | {score >= category.threshold ? "Above" : "Below"} intervention threshold
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Recent Roadside Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspectionsQuery.isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No recent inspections</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inspections.map((inspection: any) => (
                <div key={inspection.id} className="p-4 rounded-lg bg-slate-700/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{inspection.location}</p>
                      <Badge className={cn(
                        "border-0 text-xs",
                        inspection.level === 1 ? "bg-purple-500/20 text-purple-400" :
                        inspection.level === 2 ? "bg-cyan-500/20 text-cyan-400" :
                        "bg-slate-500/20 text-slate-400"
                      )}>
                        Level {inspection.level}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{inspection.date} • {inspection.driverName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {inspection.violations > 0 ? (
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        {inspection.violations} Violations
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-0">
                        Clean
                      </Badge>
                    )}
                    {inspection.oos && (
                      <Badge className="bg-red-600 text-white border-0">OOS</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Trend */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Score Trends (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No historical data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {basicCategories.slice(0, 3).map((category) => {
                const current = scores?.basics?.[category.id] || 0;
                const previous = history[0]?.basics?.[category.id] || current;
                const trend = current - previous;

                return (
                  <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-white">{category.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{current}%</span>
                      {trend !== 0 && (
                        <Badge className={cn(
                          "border-0",
                          trend > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        )}>
                          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(trend)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
