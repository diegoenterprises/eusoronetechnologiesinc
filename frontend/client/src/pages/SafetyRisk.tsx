/**
 * SAFETY RISK ANALYTICS & MANAGEMENT PAGE
 * Comprehensive safety analytics: risk scoring, incident investigation,
 * near-miss reporting, behavioral safety, CSA BASIC scores, coaching.
 *
 * 100% Dynamic — No mock data. Dark theme with red/amber safety accents.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Activity,
  Users, Target, Eye, FileText, Calendar, Award, BookOpen,
  BarChart3, AlertCircle, CheckCircle, Clock, Zap, Search,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Plus,
  Brain, UserCheck, Clipboard, MapPin, Flame, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getRiskColor(level: string) {
  switch (level) {
    case "critical": return "text-red-400 bg-red-500/20 border-red-500/30";
    case "high": return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    case "medium": return "text-amber-400 bg-amber-500/20 border-amber-500/30";
    case "low": return "text-green-400 bg-green-500/20 border-green-500/30";
    default: return "text-slate-400 bg-slate-500/20 border-slate-500/30";
  }
}

function getRiskBadgeVariant(level: string): "destructive" | "secondary" | "default" | "outline" {
  if (level === "critical" || level === "high") return "destructive";
  if (level === "medium") return "secondary";
  return "default";
}

function ScoreGauge({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = pct >= 75 ? "text-red-400" : pct >= 50 ? "text-amber-400" : pct >= 25 ? "text-yellow-400" : "text-green-400";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className={isLight ? "text-slate-300" : "text-slate-700"} />
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
            className={color}
            strokeDasharray={`${pct * 1.76} 176`}
            strokeLinecap="round"
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", color)}>
          {score}
        </span>
      </div>
      <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} text-center leading-tight`}>{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color = "text-cyan-400", bgColor = "bg-cyan-500/20" }: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: { direction: "up" | "down" | "flat"; value: string };
  color?: string; bgColor?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", bgColor)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.direction === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="w-4 h-4 text-green-400" />
              ) : (
                <Minus className="w-4 h-4 text-slate-400" />
              )}
              <span className={cn("text-xs", trend.direction === "up" ? "text-red-400" : trend.direction === "down" ? "text-green-400" : "text-slate-400")}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashQuery = (trpc as any).safetyRisk.getSafetyDashboard.useQuery({ period: "30d" });
  const fleetQuery = (trpc as any).safetyRisk.getFleetRiskProfile.useQuery({ period: "30d" });
  const cultureQuery = (trpc as any).safetyRisk.getSafetyCultureScore.useQuery({ period: "90d" });

  const dash = dashQuery.data;
  const fleet = fleetQuery.data;
  const culture = cultureQuery.data;
  const loading = dashQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard icon={Activity} label="Incident Rate" value={dash?.incidentRate ?? 0}
              color="text-red-400" bgColor="bg-red-500/20"
              trend={{ direction: (dash?.riskTrend === "worsening" ? "up" : dash?.riskTrend === "improving" ? "down" : "flat"), value: dash?.riskTrend || "stable" }}
            />
            <StatCard icon={Shield} label="Fleet Risk Score" value={dash?.overallRiskScore ?? 0}
              color={dash?.overallRiskScore > 50 ? "text-red-400" : dash?.overallRiskScore > 25 ? "text-amber-400" : "text-green-400"}
              bgColor={dash?.overallRiskScore > 50 ? "bg-red-500/20" : dash?.overallRiskScore > 25 ? "bg-amber-500/20" : "bg-green-500/20"}
            />
            <StatCard icon={Search} label="Open Investigations" value={dash?.openInvestigations ?? 0}
              color="text-amber-400" bgColor="bg-amber-500/20"
            />
            <StatCard icon={Eye} label="Safety Culture" value={culture?.grade || "N/A"}
              color="text-cyan-400" bgColor="bg-cyan-500/20"
            />
          </>
        )}
      </div>

      {/* Severity Breakdown + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <AlertTriangle className="w-5 h-5 text-red-400" /> Incident Severity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <Skeleton className="h-20" /> : (
              <>
                {[
                  { label: "Critical", count: dash?.severityBreakdown?.critical || 0, color: "bg-red-500", textColor: "text-red-400" },
                  { label: "Major", count: dash?.severityBreakdown?.major || 0, color: "bg-orange-500", textColor: "text-orange-400" },
                  { label: "Minor", count: dash?.severityBreakdown?.minor || 0, color: "bg-amber-500", textColor: "text-amber-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className={cn("text-sm font-medium w-16", s.textColor)}>{s.label}</span>
                    <div className="flex-1">
                      <Progress value={Math.min(s.count * 10, 100)} className="h-3" />
                    </div>
                    <span className={cn("text-lg font-bold w-8 text-right", s.textColor)}>{s.count}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <Users className="w-5 h-5 text-cyan-400" /> Fleet Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fleetQuery.isLoading ? <Skeleton className="h-20" /> : (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Low", count: fleet?.riskDistribution?.low || 0, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
                  { label: "Medium", count: fleet?.riskDistribution?.medium || 0, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
                  { label: "High", count: fleet?.riskDistribution?.high || 0, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
                  { label: "Critical", count: fleet?.riskDistribution?.critical || 0, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
                ].map((d) => (
                  <div key={d.label} className={cn("text-center p-3 rounded-lg border", d.bg)}>
                    <p className={cn("text-2xl font-bold", d.color)}>{d.count}</p>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{d.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700"}`}>
              <div className="flex justify-between text-sm">
                <span className={isLight ? "text-slate-500" : "text-slate-400"}>Fleet Size</span>
                <span className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{fleet?.fleetSize || 0} drivers</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSA BASIC Scores */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <BarChart3 className="w-5 h-5 text-amber-400" /> CSA BASIC Scores
          </CardTitle>
          <CardDescription className={isLight ? "text-slate-500" : "text-slate-400"}>FMCSA Compliance, Safety, Accountability scores</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-24" /> : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <ScoreGauge score={dash?.csaScores?.unsafe_driving || 0} label="Unsafe Driving" />
              <ScoreGauge score={dash?.csaScores?.hos || 0} label="HOS" />
              <ScoreGauge score={dash?.csaScores?.vehicle_maintenance || 0} label="Vehicle Maint." />
              <ScoreGauge score={dash?.csaScores?.controlled_substances || 0} label="Controlled Sub." />
              <ScoreGauge score={dash?.csaScores?.hazmat || 0} label="HazMat" />
              <ScoreGauge score={dash?.csaScores?.crash_indicator || 0} label="Crash Indicator" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Risk Factors + Safety Culture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <Flame className="w-5 h-5 text-orange-400" /> Top Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <Skeleton className="h-16" /> : dash?.topRiskFactors?.length ? (
              dash.topRiskFactors.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("text-sm font-medium flex-1", f.weight > 70 ? "text-red-400" : f.weight > 40 ? "text-amber-400" : "text-slate-300")}>
                    {f.factor}
                  </span>
                  <Progress value={f.weight} className="w-24 h-2" />
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} w-8 text-right`}>{f.weight}%</span>
                </div>
              ))
            ) : (
              <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>No significant risk factors detected</p>
            )}
          </CardContent>
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <Brain className="w-5 h-5 text-purple-400" /> Safety Culture Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cultureQuery.isLoading ? <Skeleton className="h-24" /> : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Overall Score</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold",
                      (culture?.overallScore || 0) >= 80 ? "text-green-400" :
                      (culture?.overallScore || 0) >= 60 ? "text-amber-400" : "text-red-400"
                    )}>
                      {culture?.overallScore || 0}
                    </span>
                    <Badge variant="outline" className={cn(
                      (culture?.overallScore || 0) >= 80 ? "border-green-500/50 text-green-400" :
                      (culture?.overallScore || 0) >= 60 ? "border-amber-500/50 text-amber-400" : "border-red-500/50 text-red-400"
                    )}>
                      {culture?.grade || "N/A"}
                    </Badge>
                  </div>
                </div>
                {culture?.dimensions?.map((dim: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} flex-1 truncate`}>{dim.name}</span>
                    <Progress value={dim.score} className="w-20 h-1.5" />
                    <span className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"} w-6 text-right`}>{dim.score}</span>
                  </div>
                ))}
                {culture?.recommendations?.length > 0 && (
                  <div className={`mt-3 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                    <p className="text-xs text-amber-400 font-medium mb-1">Recommendations:</p>
                    {culture.recommendations.map((r: string, i: number) => (
                      <p key={i} className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} flex items-start gap-1`}>
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-amber-400" />{r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Trend Chart (simple bar representation) */}
      {dash?.incidentTrend?.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <TrendingUp className="w-5 h-5 text-red-400" /> Incident Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {dash.incidentTrend.map((pt: any, i: number) => {
                const maxCount = Math.max(...dash.incidentTrend.map((t: any) => t.count), 1);
                const heightPct = (pt.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{pt.count}</span>
                    <div
                      className="w-full bg-red-500/60 rounded-t"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-500 truncate w-full text-center">
                      {pt.date?.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RiskScoringTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const riskQuery = (trpc as any).safetyRisk.getDriverRiskScoring.useQuery({ page: 1, limit: 20 });
  const predictiveQuery = (trpc as any).safetyRisk.getPredictiveSafetyAnalytics.useQuery({});
  const rankingQuery = (trpc as any).safetyRisk.getFleetSafetyRanking.useQuery({ page: 1, limit: 10 });

  const drivers = riskQuery.data?.drivers || [];
  const predictions = predictiveQuery.data?.predictions || [];
  const rankings = rankingQuery.data?.rankings || [];

  return (
    <div className="space-y-6">
      {/* Predictive Header */}
      <Card className="bg-gradient-to-r from-red-900/30 to-amber-900/30 border-red-500/20 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Brain className="w-5 h-5 text-red-400" /> Predictive Safety Analytics
          </CardTitle>
          <CardDescription className={isLight ? "text-slate-500" : "text-slate-400"}>
            AI-powered accident probability predictions
            {predictiveQuery.data?.modelConfidence > 0 && (
              <Badge variant="outline" className={`ml-2 ${isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"}`}>
                Model confidence: {predictiveQuery.data.modelConfidence}%
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictiveQuery.isLoading ? <Skeleton className="h-20" /> : (
            <>
              {/* High-risk time windows */}
              {predictiveQuery.data?.highRiskTimeWindows?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-amber-400 font-medium mb-2">High-Risk Time Windows</p>
                  <div className="flex flex-wrap gap-2">
                    {predictiveQuery.data.highRiskTimeWindows.map((tw: any, i: number) => (
                      <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-300">
                        {tw.dayOfWeek} {tw.hourStart}:00-{tw.hourEnd}:00 ({tw.riskMultiplier}x)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Top predictions */}
              {predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.slice(0, 5).map((p: any) => (
                    <div key={p.entityId} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-8 rounded-full", p.riskLevel === "high" ? "bg-red-500" : p.riskLevel === "medium" ? "bg-amber-500" : "bg-green-500")} />
                        <div>
                          <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{p.entityName}</p>
                          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{p.factors.join(", ")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold", p.riskLevel === "high" ? "text-red-400" : p.riskLevel === "medium" ? "text-amber-400" : "text-green-400")}>
                          {(p.probability * 100).toFixed(1)}%
                        </p>
                        <Badge variant={getRiskBadgeVariant(p.riskLevel)} className="text-xs">
                          {p.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>No predictions available yet</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Driver Risk Heatmap */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Users className="w-5 h-5 text-amber-400" /> Driver Risk Scoring
          </CardTitle>
          <CardDescription className={isLight ? "text-slate-500" : "text-slate-400"}>{riskQuery.data?.total || 0} active drivers</CardDescription>
        </CardHeader>
        <CardContent>
          {riskQuery.isLoading ? <Skeleton className="h-40" /> : drivers.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {drivers.map((d: any) => (
                <div key={d.driverId} className={cn("flex items-center justify-between p-3 rounded-lg border", getRiskColor(d.riskLevel))}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      d.riskLevel === "critical" ? "bg-red-500/30 text-red-400" :
                      d.riskLevel === "high" ? "bg-orange-500/30 text-orange-400" :
                      d.riskLevel === "medium" ? "bg-amber-500/30 text-amber-400" :
                      "bg-green-500/30 text-green-400"
                    )}>
                      {d.riskScore}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium truncate`}>{d.driverName}</p>
                      <div className={`flex items-center gap-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        <span>{d.incidentCount} incidents</span>
                        <span>|</span>
                        <span>{d.inspectionFailures} insp. fails</span>
                        <span>|</span>
                        <span>{d.tenure}yr tenure</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getRiskBadgeVariant(d.riskLevel)}>{d.riskLevel}</Badge>
                    {d.contributingFactors?.length > 0 && (
                      <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>{d.contributingFactors.length} factor(s)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>No driver risk data available</p>
          )}
        </CardContent>
      </Card>

      {/* Fleet Safety Ranking */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Award className="w-5 h-5 text-green-400" /> Fleet Safety Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingQuery.isLoading ? <Skeleton className="h-32" /> : rankings.length > 0 ? (
            <div className="space-y-1">
              {rankings.map((r: any) => (
                <div key={r.driverId} className={`flex items-center gap-3 p-2 rounded-lg ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/30"}`}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    r.rank <= 3 ? "bg-amber-500/30 text-amber-400" : "bg-slate-600/50 text-slate-300"
                  )}>
                    {r.rank}
                  </span>
                  <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"} flex-1`}>{r.driverName}</span>
                  <span className={cn("text-sm font-bold",
                    r.safetyScore >= 80 ? "text-green-400" : r.safetyScore >= 50 ? "text-amber-400" : "text-red-400"
                  )}>
                    {r.safetyScore}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>No ranking data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvestigationsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const coachingQuery = (trpc as any).safetyRisk.getCoachingActions.useQuery({});
  const crashQuery = (trpc as any).safetyRisk.getCrashAnalytics.useQuery({ period: "1y" });
  const violationQuery = (trpc as any).safetyRisk.getViolationTrending.useQuery({ period: "1y" });

  const crash = crashQuery.data;
  const coaching = coachingQuery.data?.actions || [];

  return (
    <div className="space-y-6">
      {/* Crash Analytics Overview */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <AlertCircle className="w-5 h-5 text-red-400" /> Crash Analytics
          </CardTitle>
          <CardDescription className={isLight ? "text-slate-500" : "text-slate-400"}>Rolling 12-month analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {crashQuery.isLoading ? <Skeleton className="h-20" /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">{crash?.totalCrashes || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Crashes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-bold text-amber-400">{crash?.crashRate || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Rate per Driver</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-2xl font-bold text-orange-400">${((crash?.costEstimate || 0) / 1000).toFixed(0)}K</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Est. Cost</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-600/30 border border-slate-600/50"}`}>
                <p className={`text-2xl font-bold ${isLight ? "text-slate-600" : "text-slate-300"}`}>{violationQuery.data?.total || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Violations</p>
              </div>
            </div>
          )}

          {/* Crash severity breakdown */}
          {crash && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Fatal", val: crash.bySeverity?.fatal || 0, color: "text-red-400" },
                { label: "Injury", val: crash.bySeverity?.injury || 0, color: "text-orange-400" },
                { label: "Tow-Away", val: crash.bySeverity?.towaway || 0, color: "text-amber-400" },
                { label: "Property", val: crash.bySeverity?.property_damage || 0, color: "text-slate-300" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={cn("text-lg font-bold", s.color)}>{s.val}</span>
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crash trend */}
          {crash?.trend?.length > 0 && (
            <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700"}`}>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-2`}>Monthly Trend</p>
              <div className="flex items-end gap-1 h-20">
                {crash.trend.map((pt: any, i: number) => {
                  const maxCount = Math.max(...crash.trend.map((t: any) => t.count), 1);
                  const heightPct = (pt.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>{pt.count}</span>
                      <div className="w-full bg-red-500/50 rounded-t" style={{ height: `${Math.max(heightPct, 4)}%` }} />
                      <span className="text-[9px] text-slate-500">{pt.date?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coaching Recommendations */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <UserCheck className="w-5 h-5 text-cyan-400" /> Coaching Recommendations
          </CardTitle>
          <CardDescription className={isLight ? "text-slate-500" : "text-slate-400"}>{coaching.length} action(s) recommended</CardDescription>
        </CardHeader>
        <CardContent>
          {coachingQuery.isLoading ? <Skeleton className="h-20" /> : coaching.length > 0 ? (
            <div className="space-y-2">
              {coaching.map((a: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-700/30 border border-slate-600/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full",
                      a.priority === "high" ? "bg-red-500/20" : "bg-amber-500/20"
                    )}>
                      <Clipboard className={cn("w-4 h-4",
                        a.priority === "high" ? "text-red-400" : "text-amber-400"
                      )} />
                    </div>
                    <div>
                      <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{a.driverName}</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{a.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={a.priority === "high" ? "destructive" : "secondary"}>
                      {a.actionType.replace(/_/g, " ")}
                    </Badge>
                    <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>By {a.recommendedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">No coaching actions needed at this time</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NearMissTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const nearMissQuery = (trpc as any).safetyRisk.getNearMissReporting.useQuery({ period: "30d", page: 1, limit: 20 });
  const reportNearMiss = (trpc as any).safetyRisk.reportNearMiss.useMutation({
    onSuccess: () => nearMissQuery.refetch(),
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nearMissType: "other" as string,
    description: "",
    location: "",
    occurredAt: new Date().toISOString().slice(0, 16),
    severity: "minor" as string,
    weatherConditions: "",
    actionTaken: "",
  });

  const reports = nearMissQuery.data?.reports || [];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Near-Miss Reports</h3>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {nearMissQuery.data?.total || 0} reports | Rate: {nearMissQuery.data?.ratePerDriver || 0} per driver
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Report Near-Miss
            </Button>
          </DialogTrigger>
          <DialogContent className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"} max-w-lg`}>
            <DialogHeader>
              <DialogTitle>Report Near-Miss Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Type</Label>
                <Select value={formData.nearMissType} onValueChange={(v) => setFormData((p) => ({ ...p, nearMissType: v }))}>
                  <SelectTrigger className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}>
                    {["lane_departure", "hard_brake", "close_call", "distraction", "fatigue", "weather_related", "equipment_issue", "pedestrian", "rollover_risk", "other"].map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Description</Label>
                <Textarea className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="Describe the near-miss event..."
                  value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Location</Label>
                  <Input className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="Location"
                    value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>When</Label>
                  <Input type="datetime-local" className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}
                    value={formData.occurredAt} onChange={(e) => setFormData((p) => ({ ...p, occurredAt: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}><SelectValue /></SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Action Taken</Label>
                <Input className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="What action was taken?"
                  value={formData.actionTaken} onChange={(e) => setFormData((p) => ({ ...p, actionTaken: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"}>Cancel</Button>
              </DialogClose>
              <Button className="bg-red-600 hover:bg-red-700"
                disabled={!formData.description || reportNearMiss.isPending}
                onClick={() => {
                  reportNearMiss.mutate({
                    nearMissType: formData.nearMissType as any,
                    description: formData.description,
                    location: formData.location || undefined,
                    occurredAt: new Date(formData.occurredAt).toISOString(),
                    severity: formData.severity as any,
                    actionTaken: formData.actionTaken || undefined,
                  });
                  setShowForm(false);
                  setFormData({ nearMissType: "other", description: "", location: "", occurredAt: new Date().toISOString().slice(0, 16), severity: "minor", weatherConditions: "", actionTaken: "" });
                }}
              >
                {reportNearMiss.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Near-miss feed */}
      {nearMissQuery.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <Card key={r.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-full mt-0.5",
                      r.severity === "critical" ? "bg-red-500/20" : r.severity === "major" ? "bg-orange-500/20" : "bg-amber-500/20"
                    )}>
                      <AlertTriangle className={cn("w-4 h-4",
                        r.severity === "critical" ? "text-red-400" : r.severity === "major" ? "text-orange-400" : "text-amber-400"
                      )} />
                    </div>
                    <div>
                      <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{r.description}</p>
                      <div className={`flex items-center gap-3 mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {r.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.occurredAt).toLocaleDateString()}</span>
                        <Badge variant="outline" className={`text-[10px] ${isLight ? "border-slate-300" : "border-slate-600"}`}>{r.nearMissType?.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={r.severity === "critical" ? "destructive" : "secondary"}>{r.severity}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-8 text-center">
            <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>No near-miss reports in this period</p>
            <p className="text-xs text-slate-500 mt-1">Encourage drivers to report near-miss events to improve safety culture</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BehavioralSafetyTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const bbsQuery = (trpc as any).safetyRisk.getBehavioralSafety.useQuery({ period: "30d", page: 1, limit: 20 });
  const logObservation = (trpc as any).safetyRisk.logSafetyObservation.useMutation({
    onSuccess: () => bbsQuery.refetch(),
  });

  const [showForm, setShowForm] = useState(false);
  const [obsForm, setObsForm] = useState({
    driverId: 0,
    observationType: "safe" as string,
    category: "defensive_driving" as string,
    description: "",
    location: "",
    observedAt: new Date().toISOString().slice(0, 16),
    correctiveAction: "",
  });

  const observations = bbsQuery.data?.observations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Behavioral Safety Observations</h3>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>BBS Program — Safe: {bbsQuery.data?.safeRate || 0}% | At-Risk: {bbsQuery.data?.atRiskRate || 0}%</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Log Observation
            </Button>
          </DialogTrigger>
          <DialogContent className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"} max-w-lg`}>
            <DialogHeader>
              <DialogTitle>Log Safety Observation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Driver ID</Label>
                  <Input type="number" className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="Driver ID"
                    value={obsForm.driverId || ""} onChange={(e) => setObsForm((p) => ({ ...p, driverId: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Type</Label>
                  <Select value={obsForm.observationType} onValueChange={(v) => setObsForm((p) => ({ ...p, observationType: v }))}>
                    <SelectTrigger className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}><SelectValue /></SelectTrigger>
                    <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}>
                      <SelectItem value="safe">Safe Behavior</SelectItem>
                      <SelectItem value="at_risk">At-Risk Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Category</Label>
                <Select value={obsForm.category} onValueChange={(v) => setObsForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}><SelectValue /></SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}>
                    {["speed_management", "following_distance", "lane_discipline", "pre_trip_inspection", "ppe_usage",
                      "load_securement", "hours_compliance", "distraction_free", "defensive_driving", "communication", "other"
                    ].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Description</Label>
                <Textarea className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="Describe the observed behavior..."
                  value={obsForm.description} onChange={(e) => setObsForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Location</Label>
                  <Input className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}
                    value={obsForm.location} onChange={(e) => setObsForm((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>When</Label>
                  <Input type="datetime-local" className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"}
                    value={obsForm.observedAt} onChange={(e) => setObsForm((p) => ({ ...p, observedAt: e.target.value }))}
                  />
                </div>
              </div>
              {obsForm.observationType === "at_risk" && (
                <div>
                  <Label className={isLight ? "text-slate-600" : "text-slate-300"}>Corrective Action</Label>
                  <Textarea className={isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600"} placeholder="What corrective action was taken?"
                    value={obsForm.correctiveAction} onChange={(e) => setObsForm((p) => ({ ...p, correctiveAction: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"}>Cancel</Button>
              </DialogClose>
              <Button className={obsForm.observationType === "safe" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                disabled={!obsForm.description || !obsForm.driverId || logObservation.isPending}
                onClick={() => {
                  logObservation.mutate({
                    driverId: obsForm.driverId,
                    observationType: obsForm.observationType as any,
                    category: obsForm.category as any,
                    description: obsForm.description,
                    location: obsForm.location || undefined,
                    observedAt: new Date(obsForm.observedAt).toISOString(),
                    correctiveAction: obsForm.correctiveAction || undefined,
                  });
                  setShowForm(false);
                }}
              >
                {logObservation.isPending ? "Saving..." : "Save Observation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top at-risk behaviors */}
      {bbsQuery.data?.topAtRiskBehaviors?.length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-amber-400">Top At-Risk Behaviors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bbsQuery.data.topAtRiskBehaviors.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"} flex-1`}>{b.behavior}</span>
                <span className="text-sm text-amber-400 font-bold">{b.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Observations feed */}
      {bbsQuery.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : observations.length > 0 ? (
        <div className="space-y-2">
          {observations.map((obs: any) => (
            <Card key={obs.id} className={cn("rounded-xl border", obs.observationType === "safe" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}>
              <CardContent className="p-3 flex items-center gap-3">
                {obs.observationType === "safe" ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{obs.driverName} — {obs.category?.replace(/_/g, " ")}</p>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} truncate`}>{obs.description}</p>
                </div>
                <Badge variant={obs.observationType === "safe" ? "default" : "destructive"}>
                  {obs.observationType === "safe" ? "Safe" : "At-Risk"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-8 text-center">
            <Clipboard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>No behavioral observations recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Start logging observations to build your BBS program data</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProgramsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const programsQuery = (trpc as any).safetyRisk.getSafetyPrograms.useQuery({});
  const bonusQuery = (trpc as any).safetyRisk.getSafetyBonusProgram.useQuery({});
  const trainingQuery = (trpc as any).safetyRisk.getSafetyTrainingCompliance.useQuery({});
  const calendarQuery = (trpc as any).safetyRisk.getSafetyComplianceCalendar.useQuery({});

  return (
    <div className="space-y-6">
      {/* Safety Programs */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
              <Target className="w-5 h-5 text-green-400" /> Safety Programs
            </CardTitle>
            <Badge variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"}>
              {programsQuery.data?.totalActive || 0} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {programsQuery.isLoading ? <Skeleton className="h-16" /> : programsQuery.data?.programs?.length > 0 ? (
            <div className="space-y-3">
              {programsQuery.data.programs.map((p: any) => (
                <div key={p.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-700/30 border border-slate-600/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isLight ? "text-slate-900" : "text-white"} font-medium`}>{p.name}</span>
                    <Badge>{p.status}</Badge>
                  </div>
                  <div className={`flex items-center gap-4 mt-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    <span>{p.participantCount} participants</span>
                    <span>Effectiveness: {p.effectivenessScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>No safety programs configured. Create one to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Safety Bonus */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Award className="w-5 h-5 text-amber-400" /> Safety Bonus Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bonusQuery.isLoading ? <Skeleton className="h-16" /> : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={bonusQuery.data?.programActive ? "default" : "secondary"}>
                  {bonusQuery.data?.programActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {bonusQuery.data?.criteria && (
                <div className={`grid grid-cols-2 gap-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  <span>Min Safety Score: {bonusQuery.data.criteria.minSafetyScore}</span>
                  <span>Min Miles w/o Incident: {bonusQuery.data.criteria.minMilesWithoutIncident?.toLocaleString()}</span>
                  <span>No Preventable Accidents: {bonusQuery.data.criteria.noPreventableAccidents ? "Yes" : "No"}</span>
                  <span>Clean Inspections: {bonusQuery.data.criteria.cleanInspections ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Compliance */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <BookOpen className="w-5 h-5 text-purple-400" /> Training Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trainingQuery.isLoading ? <Skeleton className="h-16" /> : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Overall Completion Rate</span>
                <span className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{trainingQuery.data?.overallCompletionRate || 0}%</span>
              </div>
              <Progress value={trainingQuery.data?.overallCompletionRate || 0} className="h-2" />
              {trainingQuery.data?.overdueDrivers?.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                  <p className="text-xs text-red-400 font-medium mb-1">{trainingQuery.data.overdueDrivers.length} driver(s) overdue</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Calendar */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${isLight ? "text-slate-900" : "text-white"} flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-blue-400" /> Compliance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calendarQuery.isLoading ? <Skeleton className="h-16" /> : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xl font-bold text-red-400">{calendarQuery.data?.overdueCount || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Overdue</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xl font-bold text-amber-400">{calendarQuery.data?.upcomingThisWeek || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>This Week</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xl font-bold text-cyan-400">{calendarQuery.data?.upcomingThisMonth || 0}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>This Month</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function SafetyRisk() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isLight ? "bg-slate-50 text-slate-900" : ""}`}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
            Safety Analytics & Risk Management
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Predictive analytics, risk scoring, incident investigation, and safety culture
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-500/50 text-red-400">
            <Shield className="w-3 h-3 mr-1" /> Safety Module
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/80 border border-slate-700/50"}`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
            <Activity className="w-4 h-4 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
            <Target className="w-4 h-4 mr-1" /> Risk Scoring
          </TabsTrigger>
          <TabsTrigger value="investigations" className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400">
            <Search className="w-4 h-4 mr-1" /> Investigations
          </TabsTrigger>
          <TabsTrigger value="nearmiss" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-400">
            <AlertTriangle className="w-4 h-4 mr-1" /> Near-Miss
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400">
            <Eye className="w-4 h-4 mr-1" /> Behavioral
          </TabsTrigger>
          <TabsTrigger value="programs" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
            <BookOpen className="w-4 h-4 mr-1" /> Programs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="risk"><RiskScoringTab /></TabsContent>
        <TabsContent value="investigations"><InvestigationsTab /></TabsContent>
        <TabsContent value="nearmiss"><NearMissTab /></TabsContent>
        <TabsContent value="behavioral"><BehavioralSafetyTab /></TabsContent>
        <TabsContent value="programs"><ProgramsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
