/**
 * CSA SCORES COMPONENT
 * FMCSA CSA BASIC scores visualization
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, AlertTriangle, TrendingUp, TrendingDown, 
  Minus, Info, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CSABasicScore {
  category: string;
  code: string;
  score: number;
  threshold: number;
  percentile: number;
  trend: "up" | "down" | "stable";
  inspections: number;
  violations: number;
  alert: boolean;
  description: string;
}

interface CSAScoresProps {
  carrierName: string;
  usdotNumber: string;
  lastUpdated: string;
  scores: CSABasicScore[];
  overallRating?: "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";
  outOfServiceRate: number;
  nationalAvgOOS: number;
}

const BASIC_CATEGORIES = {
  "Unsafe Driving": { color: "red", icon: "🚗" },
  "Hours-of-Service": { color: "orange", icon: "⏰" },
  "Driver Fitness": { color: "yellow", icon: "👤" },
  "Controlled Substances": { color: "purple", icon: "💊" },
  "Vehicle Maintenance": { color: "blue", icon: "🔧" },
  "Hazardous Materials": { color: "green", icon: "☢️" },
  "Crash Indicator": { color: "pink", icon: "💥" },
};

function getScoreColor(score: number, threshold: number, alert: boolean): string {
  if (alert) return "text-red-400";
  if (score >= threshold * 0.9) return "text-yellow-400";
  if (score >= threshold * 0.7) return "text-orange-400";
  return "text-green-400";
}

function getProgressColor(score: number, threshold: number, alert: boolean): string {
  if (alert) return "bg-red-500";
  if (score >= threshold * 0.9) return "bg-yellow-500";
  if (score >= threshold * 0.7) return "bg-orange-500";
  return "bg-green-500";
}

export function CSAScores({
  carrierName,
  usdotNumber,
  lastUpdated,
  scores,
  overallRating,
  outOfServiceRate,
  nationalAvgOOS,
}: CSAScoresProps) {
  const alertCount = scores.filter(s => s.alert).length;
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{carrierName}</h2>
              <p className="text-slate-400">USDOT# {usdotNumber}</p>
              <div className="flex items-center gap-3 mt-3">
                {overallRating && (
                  <Badge className={cn(
                    overallRating === "Satisfactory" && "bg-green-500/20 text-green-400",
                    overallRating === "Conditional" && "bg-yellow-500/20 text-yellow-400",
                    overallRating === "Unsatisfactory" && "bg-red-500/20 text-red-400",
                    overallRating === "None" && "bg-slate-500/20 text-slate-400"
                  )}>
                    {overallRating} Rating
                  </Badge>
                )}
                {alertCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {alertCount} Alert{alertCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Last Updated</p>
              <p className="text-white">{lastUpdated}</p>
              <a 
                href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${usdotNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 justify-end mt-2"
              >
                View on SAFER <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Out of Service Rate */}
          <div className="mt-6 p-4 rounded-lg bg-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Out-of-Service Rate</span>
              <span className={cn(
                "font-semibold",
                outOfServiceRate > nationalAvgOOS ? "text-red-400" : "text-green-400"
              )}>
                {outOfServiceRate.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-4 bg-slate-700 rounded">
              <div 
                className={cn(
                  "absolute h-full rounded transition-all",
                  outOfServiceRate > nationalAvgOOS ? "bg-red-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min(outOfServiceRate, 100)}%` }}
              />
              <div 
                className="absolute h-full w-0.5 bg-yellow-400"
                style={{ left: `${nationalAvgOOS}%` }}
                title={`National Average: ${nationalAvgOOS}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>National Avg: {nationalAvgOOS}%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BASIC Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {scores.map((basic) => {
          const scoreColor = getScoreColor(basic.score, basic.threshold, basic.alert);
          const progressColor = getProgressColor(basic.score, basic.threshold, basic.alert);
          
          return (
            <Card 
              key={basic.code} 
              className={cn(
                "bg-slate-800/50 border-slate-700",
                basic.alert && "border-red-500/50 ring-1 ring-red-500/20"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <span className="text-lg">{(BASIC_CATEGORIES as any)[basic.category]?.icon || "📊"}</span>
                    {basic.category}
                  </CardTitle>
                  {basic.alert && (
                    <Badge className="bg-red-500/20 text-red-400 text-xs">
                      ALERT
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Score */}
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className={cn("text-3xl font-bold", scoreColor)}>
                      {basic.score.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-sm ml-1">/ {basic.threshold}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {basic.trend === "up" && <TrendingUp className="w-4 h-4 text-red-400" />}
                    {basic.trend === "down" && <TrendingDown className="w-4 h-4 text-green-400" />}
                    {basic.trend === "stable" && <Minus className="w-4 h-4 text-slate-400" />}
                    <span className="text-xs text-slate-400">
                      {basic.percentile}th %ile
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-slate-700 rounded mb-3">
                  <div 
                    className={cn("absolute h-full rounded transition-all", progressColor)}
                    style={{ width: `${Math.min((basic.score / basic.threshold) * 100, 100)}%` }}
                  />
                  <div 
                    className="absolute h-full w-0.5 bg-white/50"
                    style={{ left: "100%" }}
                    title="Threshold"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className="text-slate-400">Inspections</p>
                    <p className="text-white font-medium">{basic.inspections}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30">
                    <p className="text-slate-400">Violations</p>
                    <p className={cn(
                      "font-medium",
                      basic.violations > 0 ? "text-yellow-400" : "text-green-400"
                    )}>{basic.violations}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {basic.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-1">About CSA BASIC Scores</p>
              <p>
                The FMCSA's Compliance, Safety, Accountability (CSA) program uses Behavior Analysis and 
                Safety Improvement Categories (BASICs) to measure motor carrier safety performance. 
                Scores are percentile-based (0-100), where higher percentiles indicate worse performance. 
                Carriers with scores at or above intervention thresholds may be subject to FMCSA investigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sample data generator for testing
export function getSampleCSAScores(): CSABasicScore[] {
  return [
    {
      category: "Unsafe Driving",
      code: "UD",
      score: 45.2,
      threshold: 65,
      percentile: 45,
      trend: "down",
      inspections: 28,
      violations: 12,
      alert: false,
      description: "Operation of commercial motor vehicles in a dangerous or careless manner."
    },
    {
      category: "Hours-of-Service",
      code: "HOS",
      score: 72.8,
      threshold: 65,
      percentile: 73,
      trend: "up",
      inspections: 28,
      violations: 18,
      alert: true,
      description: "Operating a CMV while ill, fatigued, or in non-compliance with HOS regulations."
    },
    {
      category: "Driver Fitness",
      code: "DF",
      score: 32.1,
      threshold: 80,
      percentile: 32,
      trend: "stable",
      inspections: 28,
      violations: 4,
      alert: false,
      description: "Operating a CMV by drivers who are unfit due to lack of training, experience, or medical qualifications."
    },
    {
      category: "Controlled Substances",
      code: "CS",
      score: 0,
      threshold: 80,
      percentile: 0,
      trend: "stable",
      inspections: 28,
      violations: 0,
      alert: false,
      description: "Operation of CMVs by drivers impaired due to alcohol, illegal drugs, and misuse of prescription or OTC medications."
    },
    {
      category: "Vehicle Maintenance",
      code: "VM",
      score: 58.4,
      threshold: 80,
      percentile: 58,
      trend: "up",
      inspections: 28,
      violations: 15,
      alert: false,
      description: "Failure to properly maintain CMVs and/or to ensure that loads are properly secured."
    },
    {
      category: "Hazardous Materials",
      code: "HM",
      score: 25.0,
      threshold: 80,
      percentile: 25,
      trend: "down",
      inspections: 12,
      violations: 2,
      alert: false,
      description: "Unsafe handling of hazardous materials on a CMV."
    },
    {
      category: "Crash Indicator",
      code: "CI",
      score: 42.0,
      threshold: 65,
      percentile: 42,
      trend: "stable",
      inspections: 28,
      violations: 3,
      alert: false,
      description: "Histories or patterns of high crash involvement, including frequency and severity."
    },
  ];
}

export default CSAScores;
