/**
 * CSA BASIC SCORES DASHBOARD
 * Safety Manager dashboard for CSA BASIC scores visualization
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Users,
  Truck, Clock, FlaskConical, Wrench, AlertCircle, Activity,
  ChevronRight, Calendar, FileText, Eye, Star, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CSABasic {
  id: string;
  name: string;
  shortName: string;
  score: number;
  percentile: number;
  threshold: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
  inspections: number;
  violations: number;
  lastUpdated: string;
  icon: React.ElementType;
  description: string;
}

interface DriverSafetyScore {
  id: string;
  name: string;
  employeeId: string;
  overallScore: number;
  incidents: number;
  violations: number;
  inspections: number;
  cleanInspections: number;
  lastIncident?: string;
  trend: "up" | "down" | "stable";
}

const MOCK_CSA_BASICS: CSABasic[] = [
  {
    id: "unsafe_driving",
    name: "Unsafe Driving",
    shortName: "UD",
    score: 32,
    percentile: 32,
    threshold: 65,
    trend: "down",
    trendValue: -5,
    inspections: 45,
    violations: 8,
    lastUpdated: "2025-01-20",
    icon: Truck,
    description: "Speeding, reckless driving, improper lane change, failure to use seat belt",
  },
  {
    id: "hos_compliance",
    name: "HOS Compliance",
    shortName: "HOS",
    score: 48,
    percentile: 48,
    threshold: 65,
    trend: "up",
    trendValue: 3,
    inspections: 45,
    violations: 12,
    lastUpdated: "2025-01-20",
    icon: Clock,
    description: "Hours of service violations, log falsification, form & manner violations",
  },
  {
    id: "driver_fitness",
    name: "Driver Fitness",
    shortName: "DF",
    score: 15,
    percentile: 15,
    threshold: 80,
    trend: "stable",
    trendValue: 0,
    inspections: 45,
    violations: 2,
    lastUpdated: "2025-01-20",
    icon: Users,
    description: "CDL requirements, medical certification, driver disqualifications",
  },
  {
    id: "controlled_substances",
    name: "Controlled Substances/Alcohol",
    shortName: "D&A",
    score: 0,
    percentile: 0,
    threshold: 80,
    trend: "stable",
    trendValue: 0,
    inspections: 45,
    violations: 0,
    lastUpdated: "2025-01-20",
    icon: FlaskConical,
    description: "Drug/alcohol testing violations, possession, use while on duty",
  },
  {
    id: "vehicle_maintenance",
    name: "Vehicle Maintenance",
    shortName: "VM",
    score: 58,
    percentile: 58,
    threshold: 80,
    trend: "up",
    trendValue: 8,
    inspections: 45,
    violations: 15,
    lastUpdated: "2025-01-20",
    icon: Wrench,
    description: "Brake, lighting, and other vehicle defects",
  },
  {
    id: "hazmat_compliance",
    name: "Hazmat Compliance",
    shortName: "HM",
    score: 22,
    percentile: 22,
    threshold: 80,
    trend: "down",
    trendValue: -3,
    inspections: 28,
    violations: 4,
    lastUpdated: "2025-01-20",
    icon: AlertTriangle,
    description: "Placarding, shipping papers, packaging, loading/unloading",
  },
  {
    id: "crash_indicator",
    name: "Crash Indicator",
    shortName: "CI",
    score: 28,
    percentile: 28,
    threshold: 65,
    trend: "down",
    trendValue: -2,
    inspections: 0,
    violations: 0,
    lastUpdated: "2025-01-20",
    icon: AlertCircle,
    description: "State-reported crashes including severity weight",
  },
];

const MOCK_DRIVER_SCORES: DriverSafetyScore[] = [
  { id: "drv_001", name: "Mike Johnson", employeeId: "EMP-4521", overallScore: 95, incidents: 0, violations: 1, inspections: 12, cleanInspections: 11, trend: "up" },
  { id: "drv_002", name: "Sarah Williams", employeeId: "EMP-4522", overallScore: 88, incidents: 1, violations: 3, inspections: 10, cleanInspections: 7, lastIncident: "2024-11-15", trend: "stable" },
  { id: "drv_003", name: "Tom Brown", employeeId: "EMP-4523", overallScore: 98, incidents: 0, violations: 0, inspections: 15, cleanInspections: 15, trend: "up" },
  { id: "drv_004", name: "Lisa Chen", employeeId: "EMP-4524", overallScore: 72, incidents: 2, violations: 5, inspections: 8, cleanInspections: 3, lastIncident: "2025-01-10", trend: "down" },
  { id: "drv_005", name: "James Wilson", employeeId: "EMP-4525", overallScore: 91, incidents: 0, violations: 2, inspections: 11, cleanInspections: 9, trend: "stable" },
];

export default function CSAScoresDashboard() {
  const { user } = useAuth();
  const [csaBasics] = useState<CSABasic[]>(MOCK_CSA_BASICS);
  const [driverScores] = useState<DriverSafetyScore[]>(MOCK_DRIVER_SCORES);
  const [selectedBasic, setSelectedBasic] = useState<CSABasic | null>(null);

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.8) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreBgColor = (score: number, threshold: number) => {
    if (score >= threshold) return "bg-red-500";
    if (score >= threshold * 0.8) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getOverallSafetyScore = () => {
    const avgScore = csaBasics.reduce((sum, b) => sum + b.score, 0) / csaBasics.length;
    return Math.round(100 - avgScore);
  };

  const getAlertCount = () => {
    return csaBasics.filter(b => b.score >= b.threshold).length;
  };

  const getDriverScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CSA BASIC Scores</h1>
          <p className="text-slate-400 text-sm">Safety performance metrics and driver scorecards</p>
        </div>
        <Badge className={cn(
          "text-lg px-4 py-2",
          getAlertCount() > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        )}>
          {getAlertCount() > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              {getAlertCount()} Alert{getAlertCount() > 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              All Clear
            </>
          )}
        </Badge>
      </div>

      {/* Overall Safety Score */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-slate-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-slate-400 text-sm mb-1">Overall Safety Score</h2>
              <p className={cn(
                "text-5xl font-bold",
                getOverallSafetyScore() >= 80 ? "text-green-400" :
                getOverallSafetyScore() >= 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {getOverallSafetyScore()}
              </p>
              <p className="text-slate-500 text-sm mt-1">out of 100</p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{driverScores.length}</p>
                <p className="text-xs text-slate-500">Active Drivers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">
                  {csaBasics.reduce((sum, b) => sum + b.inspections, 0)}
                </p>
                <p className="text-xs text-slate-500">Total Inspections</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {csaBasics.reduce((sum, b) => sum + b.violations, 0)}
                </p>
                <p className="text-xs text-slate-500">Total Violations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSA BASIC Scores Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">CSA BASIC Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {csaBasics.map((basic) => {
            const Icon = basic.icon;
            const isAlert = basic.score >= basic.threshold;
            const isWarning = basic.score >= basic.threshold * 0.8 && !isAlert;
            
            return (
              <Card 
                key={basic.id}
                className={cn(
                  "cursor-pointer transition-all hover:scale-[1.02]",
                  isAlert ? "bg-red-500/10 border-red-500/50" :
                  isWarning ? "bg-yellow-500/10 border-yellow-500/50" :
                  "bg-slate-800/50 border-slate-700"
                )}
                onClick={() => setSelectedBasic(basic)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isAlert ? "bg-red-500/20" :
                      isWarning ? "bg-yellow-500/20" :
                      "bg-green-500/20"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        isAlert ? "text-red-400" :
                        isWarning ? "text-yellow-400" :
                        "text-green-400"
                      )} />
                    </div>
                    {basic.trend !== "stable" && (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        basic.trend === "up" ? "text-red-400" : "text-green-400"
                      )}>
                        {basic.trend === "up" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{Math.abs(basic.trendValue)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-white font-medium text-sm mb-1">{basic.name}</h3>
                  
                  <div className="flex items-end justify-between mb-2">
                    <p className={cn(
                      "text-3xl font-bold",
                      getScoreColor(basic.score, basic.threshold)
                    )}>
                      {basic.score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Threshold: {basic.threshold}%
                    </p>
                  </div>

                  <Progress 
                    value={basic.score} 
                    className="h-2"
                  />
                  <div 
                    className={cn(
                      "h-2 -mt-2 rounded-full opacity-50",
                      getScoreBgColor(basic.score, basic.threshold)
                    )}
                    style={{ width: `${basic.score}%` }}
                  />

                  <div className="flex justify-between mt-3 text-xs text-slate-500">
                    <span>{basic.inspections} inspections</span>
                    <span>{basic.violations} violations</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Driver Safety Scorecards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Driver Safety Scorecards</h2>
          <Button variant="outline" className="border-slate-600">
            View All Drivers
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {driverScores.slice(0, 6).map((driver, index) => (
            <Card key={driver.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      {index < 3 && (
                        <div className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                          index === 0 ? "bg-yellow-500 text-black" :
                          index === 1 ? "bg-slate-400 text-black" :
                          "bg-orange-700 text-white"
                        )}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.employeeId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-2xl font-bold", getDriverScoreColor(driver.overallScore))}>
                      {driver.overallScore}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {driver.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
                      {driver.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                      {driver.trend === "stable" && <Activity className="w-3 h-3 text-slate-400" />}
                      <span className="text-xs text-slate-500">{driver.trend}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className="text-white font-medium">{driver.inspections}</p>
                    <p className="text-[10px] text-slate-500">Inspections</p>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className="text-green-400 font-medium">{driver.cleanInspections}</p>
                    <p className="text-[10px] text-slate-500">Clean</p>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className="text-yellow-400 font-medium">{driver.violations}</p>
                    <p className="text-[10px] text-slate-500">Violations</p>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className={driver.incidents > 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                      {driver.incidents}
                    </p>
                    <p className="text-[10px] text-slate-500">Incidents</p>
                  </div>
                </div>

                {driver.lastIncident && (
                  <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Last incident: {new Date(driver.lastIncident).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* BASIC Detail Modal */}
      {selectedBasic && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(selectedBasic.icon, { 
                    className: cn(
                      "w-6 h-6",
                      selectedBasic.score >= selectedBasic.threshold ? "text-red-400" :
                      selectedBasic.score >= selectedBasic.threshold * 0.8 ? "text-yellow-400" :
                      "text-green-400"
                    )
                  })}
                  <div>
                    <CardTitle className="text-white">{selectedBasic.name}</CardTitle>
                    <p className="text-slate-400 text-sm">{selectedBasic.description}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedBasic(null)}>
                  <span className="text-xl">&times;</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Score Display */}
              <div className="flex items-center justify-between p-6 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-slate-400 text-sm">Current Score</p>
                  <p className={cn(
                    "text-5xl font-bold",
                    getScoreColor(selectedBasic.score, selectedBasic.threshold)
                  )}>
                    {selectedBasic.score}%
                  </p>
                  <p className="text-slate-500 text-sm">Percentile rank</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Intervention Threshold</p>
                  <p className="text-3xl font-bold text-white">{selectedBasic.threshold}%</p>
                  <Badge className={cn(
                    selectedBasic.score >= selectedBasic.threshold 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-green-500/20 text-green-400"
                  )}>
                    {selectedBasic.score >= selectedBasic.threshold ? "Above Threshold" : "Below Threshold"}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white">{selectedBasic.inspections}</p>
                  <p className="text-xs text-slate-500">Inspections</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{selectedBasic.violations}</p>
                  <p className="text-xs text-slate-500">Violations</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <div className={cn(
                    "flex items-center justify-center gap-1",
                    selectedBasic.trend === "up" ? "text-red-400" : 
                    selectedBasic.trend === "down" ? "text-green-400" : "text-slate-400"
                  )}>
                    {selectedBasic.trend === "up" && <TrendingUp className="w-5 h-5" />}
                    {selectedBasic.trend === "down" && <TrendingDown className="w-5 h-5" />}
                    {selectedBasic.trend === "stable" && <Activity className="w-5 h-5" />}
                    <span className="text-2xl font-bold">
                      {selectedBasic.trend === "stable" ? "0" : `${selectedBasic.trendValue > 0 ? "+" : ""}${selectedBasic.trendValue}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">30-Day Trend</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-sm text-white">{new Date(selectedBasic.lastUpdated).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">Last Updated</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Improvement Recommendations
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>- Review recent violations with affected drivers</li>
                  <li>- Schedule refresher training for common violations</li>
                  <li>- Implement pre-trip inspection audits</li>
                  <li>- Monitor high-risk drivers more closely</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  View Violations
                </Button>
                <Button variant="outline" className="flex-1 border-slate-600">
                  <Eye className="w-4 h-4 mr-2" />
                  View Inspections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
