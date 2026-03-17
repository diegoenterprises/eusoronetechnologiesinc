/**
 * WELLNESS & RETENTION DASHBOARD
 * Comprehensive wellness, fatigue monitoring, retention analytics,
 * career development, benefits, incentives, and peer recognition for all roles.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Heart, Brain, AlertTriangle, TrendingUp, Shield,
  Award, BookOpen, Gift, Users, Home, Activity,
  Coffee, Moon, Smile, Frown, ThumbsUp, Star,
  ChevronRight, Phone, Clock, Target, DollarSign,
  Stethoscope, Armchair, Trophy, Send, MessageCircle,
  GraduationCap, Briefcase, HeartPulse, Zap,
} from "lucide-react";

// ── Tab definitions ──
type TabId = "overview" | "fatigue" | "mental" | "retention" | "career" | "training" | "benefits" | "incentives" | "recognition" | "hometime" | "health";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Heart className="w-4 h-4" /> },
  { id: "fatigue", label: "Fatigue", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "mental", label: "Mental Health", icon: <Brain className="w-4 h-4" /> },
  { id: "retention", label: "Retention", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "career", label: "Career", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "training", label: "Training", icon: <BookOpen className="w-4 h-4" /> },
  { id: "benefits", label: "Benefits", icon: <Briefcase className="w-4 h-4" /> },
  { id: "incentives", label: "Incentives", icon: <Gift className="w-4 h-4" /> },
  { id: "recognition", label: "Recognition", icon: <Users className="w-4 h-4" /> },
  { id: "hometime", label: "Home Time", icon: <Home className="w-4 h-4" /> },
  { id: "health", label: "Physical", icon: <HeartPulse className="w-4 h-4" /> },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative w-20 h-20 rounded-full flex items-center justify-center border-4", color)}>
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { className: string; label: string }> = {
    low: { className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Low Risk" },
    moderate: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Moderate" },
    elevated: { className: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Elevated" },
    high: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "High Risk" },
    critical: { className: "bg-red-600/30 text-red-300 border-red-500/50", label: "Critical" },
  };
  const c = config[level] || config.moderate;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

// ══════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════════
function OverviewTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const wellnessScore = (trpc as any).driverWellness.getWellnessScore.useQuery();
  const dashboard = (trpc as any).driverWellness.getWellnessDashboard.useQuery();
  const history = (trpc as any).driverWellness.getWellnessHistory.useQuery({ days: 14 });

  if (wellnessScore.isLoading) return <LoadingSkeleton />;

  const ws = wellnessScore.data;
  const db = dashboard.data;

  return (
    <div className="space-y-6">
      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("rounded-xl md:col-span-1", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
            <div className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center border-4",
              ws?.composite >= 80 ? "border-emerald-400" : ws?.composite >= 60 ? "border-yellow-400" : "border-red-400"
            )}>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{ws?.composite || 0}</p>
                <p className="text-xs text-slate-400">/ 100</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Wellness Score</p>
              <Badge variant="outline" className={cn(
                ws?.grade === "A" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                ws?.grade === "B" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
                ws?.grade === "C" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              )}>
                Grade {ws?.grade}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("rounded-xl md:col-span-2", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Component Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">HOS Compliance</span>
                <span className="text-sm font-semibold text-emerald-400">{ws?.hosCompliance}%</span>
              </div>
              <Progress value={ws?.hosCompliance || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">Driving Patterns</span>
                <span className="text-sm font-semibold text-cyan-400">{ws?.drivingPatterns}%</span>
              </div>
              <Progress value={ws?.drivingPatterns || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">Rest Quality</span>
                <span className="text-sm font-semibold text-purple-400">{ws?.restQuality}%</span>
              </div>
              <Progress value={ws?.restQuality || 0} className="h-2" />
            </div>

            {/* Trend mini-chart */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-2">12-Month Trend</p>
              <div className="flex items-end gap-1 h-16">
                {ws?.trend?.map((t: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn("w-full rounded-sm", t.score >= 80 ? "bg-emerald-500/60" : t.score >= 60 ? "bg-yellow-500/60" : "bg-red-500/60")}
                      style={{ height: `${Math.max(8, (t.score - 40) * 1.1)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-600">Jan</span>
                <span className="text-[10px] text-slate-600">Dec</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Stats */}
      {db && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-emerald-500/20">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{db.fleetAverageScore}</p>
                <p className="text-xs text-slate-400">Fleet Avg Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-cyan-500/20">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{db.totalDrivers}</p>
                <p className="text-xs text-slate-400">Total Drivers</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{db.driversAtRisk}</p>
                <p className="text-xs text-slate-400">At Risk</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">+{db.monthOverMonthChange}%</p>
                <p className="text-xs text-slate-400">MoM Change</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Concerns */}
      {db?.topConcerns && (
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Top Fleet Wellness Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {db.topConcerns.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full",
                      c.severity === "high" ? "bg-red-400" : c.severity === "moderate" ? "bg-yellow-400" : "bg-emerald-400"
                    )} />
                    <span className="text-sm text-slate-300">{c.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{c.count}</span>
                    <Badge variant="outline" className={cn("text-[10px]",
                      c.severity === "high" ? "text-red-400 border-red-500/30" :
                      c.severity === "moderate" ? "text-yellow-400 border-yellow-500/30" :
                      "text-emerald-400 border-emerald-500/30"
                    )}>{c.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {history.data?.history && (
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Recent Wellness Check-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.data.history.slice(0, 7).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg">
                  <span className="text-xs text-slate-400">{h.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {h.mood === "excellent" || h.mood === "good" ? <Smile className="w-3.5 h-3.5 text-emerald-400" /> : <Frown className="w-3.5 h-3.5 text-yellow-400" />}
                      <span className="text-xs text-slate-300 capitalize">{h.mood}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs text-slate-300">{h.sleepHours}h</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">{h.stressLevel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FATIGUE TAB
// ══════════════════════════════════════════════════════════════════
function FatigueTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const assessment = (trpc as any).driverWellness.getFatigueRiskAssessment.useQuery();
  const alerts = (trpc as any).driverWellness.getFatigueAlerts.useQuery();

  if (assessment.isLoading) return <LoadingSkeleton />;
  const a = assessment.data;

  return (
    <div className="space-y-6">
      {/* Personal fatigue assessment */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Your Fatigue Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center border-4",
                a?.riskLevel === "low" ? "border-emerald-400" :
                a?.riskLevel === "moderate" ? "border-yellow-400" :
                a?.riskLevel === "elevated" ? "border-orange-400" : "border-red-400"
              )}>
                <span className="text-3xl font-bold text-white">{a?.riskScore}</span>
              </div>
              <RiskBadge level={a?.riskLevel || "low"} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500">Hours On Duty</p>
                  <p className="text-lg font-semibold text-white">{a?.factors.hoursOnDuty}h</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500">Hours Since Rest</p>
                  <p className="text-lg font-semibold text-white">{a?.factors.hoursSinceRest}h</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500">Time of Day Risk</p>
                  <p className="text-sm font-semibold text-white capitalize">{a?.factors.timeOfDayFactor}</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500">Route Difficulty</p>
                  <p className="text-sm font-semibold text-white capitalize">{a?.factors.routeDifficulty}</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-emerald-300">{a?.recommendation}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Next mandatory break: {a?.nextMandatoryBreak ? new Date(a.nextMandatoryBreak).toLocaleTimeString() : "N/A"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Fatigue Alerts */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">Fleet Fatigue Alerts ({alerts.data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.data?.alerts?.map((alert: any) => (
              <div key={alert.id} className={cn(
                "p-3 rounded-lg border",
                alert.riskLevel === "critical" ? "bg-red-500/10 border-red-500/20" :
                alert.riskLevel === "elevated" ? "bg-orange-500/10 border-orange-500/20" :
                "bg-yellow-500/10 border-yellow-500/20"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{alert.driverName}</span>
                    <RiskBadge level={alert.riskLevel} />
                  </div>
                  <span className="text-lg font-bold text-white">{alert.riskScore}</span>
                </div>
                <p className="text-xs text-slate-400">{alert.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{alert.route}</span>
                  {alert.acknowledged && <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Acknowledged</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MENTAL HEALTH TAB
// ══════════════════════════════════════════════════════════════════
function MentalHealthTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const resources = (trpc as any).driverWellness.getMentalHealthResources.useQuery();

  if (resources.isLoading) return <LoadingSkeleton />;
  const r = resources.data;

  return (
    <div className="space-y-6">
      {/* EAP Contact */}
      <Card className={cn("rounded-xl", isLight ? "bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-200 shadow-sm" : "bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/20")}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-cyan-500/20">
              <Phone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{r?.eapContact.name}</h3>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{r?.eapContact.phone}</p>
              <p className="text-sm text-slate-400 mt-1">{r?.eapContact.available}</p>
              <p className="text-xs text-slate-500 mt-2">{r?.eapContact.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Lines */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-400" /> Crisis Lines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {r?.crisisLines.map((line: any, i: number) => (
              <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <p className="text-sm font-semibold text-white">{line.name}</p>
                <p className="text-lg font-bold text-emerald-400">{line.phone}</p>
                <p className="text-xs text-slate-500">{line.available}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">Wellness Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {r?.resources.map((res: any) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg",
                    res.type === "video" ? "bg-purple-500/20" :
                    res.type === "audio" ? "bg-cyan-500/20" :
                    res.type === "guide" ? "bg-emerald-500/20" : "bg-slate-700/50"
                  )}>
                    <BookOpen className={cn("w-4 h-4",
                      res.type === "video" ? "text-purple-400" :
                      res.type === "audio" ? "text-cyan-400" :
                      res.type === "guide" ? "text-emerald-400" : "text-slate-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm text-white">{res.title}</p>
                    <p className="text-xs text-slate-500">{res.type} - {res.readTime}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RETENTION TAB
// ══════════════════════════════════════════════════════════════════
function RetentionTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const score = (trpc as any).driverWellness.getRetentionScore.useQuery();
  const dashboard = (trpc as any).driverWellness.getRetentionDashboard.useQuery();
  const recommendations = (trpc as any).driverWellness.getRetentionRecommendations.useQuery();

  if (score.isLoading) return <LoadingSkeleton />;
  const s = score.data;
  const db = dashboard.data;

  return (
    <div className="space-y-6">
      {/* Retention Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-6 flex flex-col items-center gap-3">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center border-4",
              s?.riskLevel === "low" ? "border-emerald-400" :
              s?.riskLevel === "moderate" ? "border-yellow-400" : "border-red-400"
            )}>
              <span className="text-3xl font-bold text-white">{s?.retentionScore}</span>
            </div>
            <p className="text-sm text-slate-300">Retention Score</p>
            <RiskBadge level={s?.riskLevel || "low"} />
          </CardContent>
        </Card>

        <Card className={cn("rounded-xl md:col-span-2", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Retention Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s?.factors && Object.entries(s.factors).map(([key, value]: [string, any]) => {
              const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c: string) => c.toUpperCase());
              const numVal = typeof value === "number" ? value : 0;
              const isPercent = numVal > 10;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-semibold text-slate-300">{isPercent ? `${numVal}%` : numVal}</span>
                  </div>
                  {isPercent && <Progress value={Math.min(100, numVal)} className="h-1.5" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Fleet Retention Dashboard */}
      {db && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Fleet Retention</p>
              <p className="text-2xl font-bold text-emerald-400">{db.fleetRetentionRate}%</p>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Avg Tenure</p>
              <p className="text-2xl font-bold text-cyan-400">{db.averageTenureMonths}mo</p>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Annual Turnover</p>
              <p className="text-2xl font-bold text-yellow-400">{db.annualTurnoverRate}%</p>
            </CardContent>
          </Card>
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Est. Savings</p>
              <p className="text-2xl font-bold text-emerald-400">${(db.estimatedAnnualSavings / 1000).toFixed(0)}k</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">Retention Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.data?.recommendations?.map((rec: any) => (
              <div key={rec.id} className={cn(
                "p-3 rounded-lg border",
                rec.priority === "high" ? "bg-red-500/5 border-red-500/20" :
                rec.priority === "medium" ? "bg-yellow-500/5 border-yellow-500/20" :
                "bg-slate-900/30 border-slate-700/30"
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{rec.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]",
                        rec.priority === "high" ? "text-red-400 border-red-500/30" :
                        rec.priority === "medium" ? "text-yellow-400 border-yellow-500/30" :
                        "text-slate-400 border-slate-600"
                      )}>{rec.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{rec.description}</p>
                  </div>
                  {rec.estimatedCost > 0 && (
                    <span className="text-xs text-slate-500">${rec.estimatedCost.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CAREER TAB
// ══════════════════════════════════════════════════════════════════
function CareerTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const career = (trpc as any).driverWellness.getCareerDevelopment.useQuery();

  if (career.isLoading) return <LoadingSkeleton />;
  const c = career.data;

  return (
    <div className="space-y-6">
      {/* Career Progress */}
      <Card className={cn("rounded-xl", isLight ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 shadow-sm" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20")}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Current Level</p>
              <p className="text-xl font-bold text-white">{c?.currentLevel}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
            <div className="text-right">
              <p className="text-xs text-slate-500">Next Level</p>
              <p className="text-xl font-bold text-emerald-400">{c?.nextLevel}</p>
            </div>
          </div>
          <Progress value={c?.progressPercent || 0} className="h-3" />
          <p className="text-xs text-slate-400 mt-2">{c?.progressPercent}% complete</p>
          <div className="flex gap-4 mt-4 text-sm text-slate-400">
            <span>{c?.yearsExperience} years experience</span>
            <span>{(c?.totalMiles || 0).toLocaleString()} miles driven</span>
            <span>Endorsements: {c?.endorsements?.join(", ")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Career Paths */}
      {c?.paths?.map((path: any) => (
        <Card key={path.id} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-cyan-400" /> {path.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {path.milestones.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    m.status === "completed" ? "bg-emerald-500/30 text-emerald-400" :
                    m.status === "in_progress" ? "bg-cyan-500/30 text-cyan-400" :
                    "bg-slate-700 text-slate-500"
                  )}>
                    {m.status === "completed" ? "\u2713" : m.status === "in_progress" ? "\u25CF" : (i + 1)}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm", m.status === "completed" ? "text-slate-400 line-through" : "text-white")}>{m.name}</p>
                  </div>
                  {m.completedDate && <span className="text-xs text-emerald-400">{m.completedDate}</span>}
                  {m.targetDate && m.status !== "completed" && <span className="text-xs text-cyan-400">Target: {m.targetDate}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TRAINING TAB
// ══════════════════════════════════════════════════════════════════
function TrainingTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [category, setCategory] = useState<string>("all");
  const programs = (trpc as any).driverWellness.getTrainingPrograms.useQuery({ category });

  if (programs.isLoading) return <LoadingSkeleton />;
  const p = programs.data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{p?.totalAvailable}</p>
            <p className="text-xs text-slate-400">Available</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{p?.totalEnrolled}</p>
            <p className="text-xs text-slate-400">Enrolled</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{p?.totalCompleted}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{p?.totalCreditsEarned}</p>
            <p className="text-xs text-slate-400">Credits Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "safety", "compliance", "skills", "wellness", "leadership"].map(cat => (
          <Button key={cat} size="sm" variant={category === cat ? "default" : "outline"}
            className={cn("text-xs capitalize", category === cat ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-slate-400")}
            onClick={() => setCategory(cat)}
          >{cat}</Button>
        ))}
      </div>

      {/* Programs */}
      <div className="space-y-3">
        {p?.programs?.map((prog: any) => (
          <Card key={prog.id} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{prog.title}</h3>
                    <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30 capitalize">{prog.category}</Badge>
                    {prog.status === "completed" && <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Completed</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">{prog.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>{prog.duration}</span>
                    <span className="capitalize">{prog.format}</span>
                    <span>{prog.credits} credits</span>
                  </div>
                </div>
                {prog.enrolled && prog.status !== "completed" && (
                  <div className="w-24 text-center">
                    <Progress value={prog.completionRate} className="h-2 mb-1" />
                    <span className="text-xs text-slate-400">{prog.completionRate}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BENEFITS TAB
// ══════════════════════════════════════════════════════════════════
function BenefitsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const overview = (trpc as any).driverWellness.getBenefitsOverview.useQuery();
  const enrollment = (trpc as any).driverWellness.getBenefitsEnrollment.useQuery();

  if (overview.isLoading) return <LoadingSkeleton />;
  const o = overview.data;
  const e = enrollment.data;

  return (
    <div className="space-y-6">
      {/* PTO Card */}
      {o?.pto && (
        <Card className={cn("rounded-xl", isLight ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 shadow-sm" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20")}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Paid Time Off Available</p>
              <p className="text-3xl font-bold text-emerald-400">{o.pto.available} days</p>
              <p className="text-xs text-slate-500">{o.pto.used} used / {o.pto.accrued} accrued</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Max Carryover: {o.pto.maxCarryover} days</p>
              <p className="text-xs text-slate-500">Next Accrual: {o.pto.nextAccrual}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Summary */}
      {e && (
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm text-slate-400">Monthly Deductions</CardTitle>
              <span className="text-lg font-bold text-white">${e.totalMonthlyDeduction}/mo</span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Benefits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {o?.benefits?.map((b: any) => (
          <Card key={b.id} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg",
                  b.type === "health" ? "bg-red-500/20" :
                  b.type === "dental" ? "bg-cyan-500/20" :
                  b.type === "vision" ? "bg-purple-500/20" :
                  b.type === "retirement" ? "bg-emerald-500/20" :
                  "bg-slate-700/50"
                )}>
                  <Shield className={cn("w-4 h-4",
                    b.type === "health" ? "text-red-400" :
                    b.type === "dental" ? "text-cyan-400" :
                    b.type === "vision" ? "text-purple-400" :
                    b.type === "retirement" ? "text-emerald-400" :
                    "text-slate-400"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.plan} - {b.provider}</p>
                  <p className="text-xs text-slate-500">{b.coverage}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-slate-400">You: ${b.monthlyCost}/mo</span>
                    <span className="text-emerald-400">Employer: ${b.employerContribution}/mo</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">{b.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INCENTIVES TAB
// ══════════════════════════════════════════════════════════════════
function IncentivesTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const programs = (trpc as any).driverWellness.getIncentivePrograms.useQuery();
  const earnings = (trpc as any).driverWellness.getIncentiveEarnings.useQuery();

  if (programs.isLoading) return <LoadingSkeleton />;
  const p = programs.data;
  const e = earnings.data;

  return (
    <div className="space-y-6">
      {/* Earnings Summary */}
      {e && (
        <Card className={cn("rounded-xl", isLight ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 shadow-sm" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20")}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Incentive Earnings</p>
              <p className="text-3xl font-bold text-emerald-400">${(e.totalEarnings || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Pending: ${(e.pendingPayouts || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Next Payout: {e.nextPayoutDate}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Programs */}
      <div className="space-y-3">
        {p?.programs?.map((prog: any) => (
          <Card key={prog.id} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{prog.name}</h3>
                  <p className="text-xs text-slate-400">{prog.description}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{prog.reward}</span>
              </div>
              <Progress value={prog.currentProgress} className="h-2 mb-1" />
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">{prog.targetMetric}</span>
                <span className="text-xs text-slate-400">{prog.currentProgress}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Incentive Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {p?.leaderboard?.map((entry: any) => (
              <div key={entry.rank} className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  entry.rank === 1 ? "bg-yellow-500/30 text-yellow-400" :
                  entry.rank === 2 ? "bg-slate-400/30 text-slate-300" :
                  entry.rank === 3 ? "bg-orange-500/30 text-orange-400" :
                  "bg-slate-700 text-slate-400"
                )}>
                  #{entry.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{entry.name}</p>
                  <p className="text-xs text-slate-500">Safety: {entry.safetyScore} | MPG: {entry.fuelEfficiency}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">${entry.totalEarnings.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RECOGNITION TAB
// ══════════════════════════════════════════════════════════════════
function RecognitionTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const feed = (trpc as any).driverWellness.getPeerRecognition.useQuery();

  if (feed.isLoading) return <LoadingSkeleton />;
  const f = feed.data;

  return (
    <div className="space-y-6">
      {/* Top Recognized */}
      <div className="grid grid-cols-3 gap-4">
        {f?.topRecognized?.map((dr: any, i: number) => (
          <Card key={dr.driverId} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4 text-center">
              <div className={cn("w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2",
                i === 0 ? "bg-yellow-500/30" : i === 1 ? "bg-slate-400/30" : "bg-orange-500/30"
              )}>
                <Star className={cn("w-5 h-5",
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-orange-400"
                )} />
              </div>
              <p className="text-sm font-semibold text-white">{dr.name}</p>
              <p className="text-xs text-slate-400">{dr.count} recognitions</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recognition Feed */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm text-slate-400">Recognition Feed</CardTitle>
            <span className="text-xs text-slate-500">{f?.totalThisMonth} this month</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {f?.recognitions?.map((rec: any) => (
              <div key={rec.id} className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-emerald-500/20">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-white">{rec.fromName}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-sm text-emerald-400">{rec.toName}</span>
                  <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30 capitalize ml-auto">{rec.category.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-slate-400 ml-8">{rec.message}</p>
                <div className="flex items-center gap-2 mt-2 ml-8">
                  <ThumbsUp className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">{rec.kudosCount}</span>
                  <span className="text-xs text-slate-600 ml-auto">{new Date(rec.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOME TIME TAB
// ══════════════════════════════════════════════════════════════════
function HomeTimeTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const homeTime = (trpc as any).driverWellness.getHomeTimeOptimization.useQuery();

  if (homeTime.isLoading) return <LoadingSkeleton />;
  const h = homeTime.data;

  return (
    <div className="space-y-6">
      {/* Current vs Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Current Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{h?.currentSchedule.pattern}</p>
            <p className="text-xs text-slate-400">{h?.currentSchedule.daysOut} days out / {h?.currentSchedule.daysHome} days home</p>
            <div className="mt-3">
              <p className="text-xs text-slate-500">Home Time: {h?.averageHomeTimePercentage}%</p>
              <Progress value={h?.averageHomeTimePercentage || 0} className="h-2 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 shadow-sm" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400">Optimized Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{h?.optimizedSchedule.pattern}</p>
            <p className="text-xs text-slate-400">{h?.optimizedSchedule.daysOut} days out / {h?.optimizedSchedule.daysHome} days home</p>
            <div className="mt-3">
              <p className="text-xs text-slate-500">Target: {h?.targetHomeTimePercentage}%</p>
              <Progress value={h?.targetHomeTimePercentage || 0} className="h-2 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Home Date */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-cyan-500/20">
              <Home className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Next Home Date</p>
              <p className="text-lg font-bold text-white">{h?.nextHomeDate}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">{h?.homeLocation}</p>
        </CardContent>
      </Card>

      {/* Route Suggestions */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">Optimized Route Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {h?.potentialRoutes?.map((route: any) => (
              <div key={route.id} className="p-3 bg-slate-900/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{route.route}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < Math.floor(route.rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>{route.distance} mi</span>
                  <span>{route.estimatedHomeTime}</span>
                  <span className={route.payImpact >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {route.payImpact >= 0 ? "+" : ""}${route.payImpact}/wk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PHYSICAL HEALTH TAB
// ══════════════════════════════════════════════════════════════════
function PhysicalHealthTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const health = (trpc as any).driverWellness.getPhysicalHealthMetrics.useQuery();
  const ergonomics = (trpc as any).driverWellness.getErgonomicRecommendations.useQuery();

  if (health.isLoading) return <LoadingSkeleton />;
  const h = health.data;
  const e = ergonomics.data;

  return (
    <div className="space-y-6">
      {/* DOT Medical Card */}
      <Card className={cn("rounded-xl border",
        (h?.dotMedicalCard?.daysUntilExpiry || 0) > 90 ? "bg-emerald-500/5 border-emerald-500/20" :
        (h?.dotMedicalCard?.daysUntilExpiry || 0) > 30 ? "bg-yellow-500/5 border-yellow-500/20" :
        "bg-red-500/5 border-red-500/20"
      )}>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-500/20">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">DOT Medical Card</p>
              <p className="text-lg font-bold text-white capitalize">{h?.dotMedicalCard?.status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Expires: {h?.dotMedicalCard?.expirationDate}</p>
            <p className="text-xs text-emerald-400">{h?.dotMedicalCard?.daysUntilExpiry} days remaining</p>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{h?.fitness?.bmi}</p>
            <p className="text-xs text-slate-400">BMI</p>
            <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/30 mt-1">{h?.fitness?.bmiCategory}</Badge>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{h?.fitness?.bloodPressure}</p>
            <p className="text-xs text-slate-400">Blood Pressure</p>
            <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/30 mt-1">{h?.fitness?.bloodPressureCategory}</Badge>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{h?.fitness?.restingHeartRate}</p>
            <p className="text-xs text-slate-400">Resting HR</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{h?.weeklyActivity?.stepsAverage?.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Avg Daily Steps</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Recommendations */}
      <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">Health Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {h?.recommendations?.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-slate-900/30 rounded-lg">
                <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ergonomic Equipment */}
      {e?.equipmentRecommendations && (
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Armchair className="w-4 h-4" /> Ergonomic Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {e.equipmentRecommendations.map((eq: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/30 rounded-lg">
                  <p className="text-sm font-semibold text-white">{eq.item}</p>
                  <p className="text-xs text-slate-400">{eq.description}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-cyan-400">{eq.estimatedCost}</span>
                    <span className="text-xs text-emerald-400">{eq.benefit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function DriverWellness() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className={cn("p-4 md:p-6 space-y-6", isLight ? "min-h-screen bg-slate-50 text-slate-900" : "")}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Wellness & Retention
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Comprehensive wellness monitoring, retention analytics, and career development
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={cn("flex gap-1 overflow-x-auto pb-2 scrollbar-thin", isLight ? "scrollbar-thumb-slate-300" : "scrollbar-thumb-slate-700")}>
        {TABS.map(tab => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "default" : "ghost"}
            className={cn(
              "flex items-center gap-1.5 text-xs whitespace-nowrap",
              activeTab === tab.id
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "fatigue" && <FatigueTab />}
      {activeTab === "mental" && <MentalHealthTab />}
      {activeTab === "retention" && <RetentionTab />}
      {activeTab === "career" && <CareerTab />}
      {activeTab === "training" && <TrainingTab />}
      {activeTab === "benefits" && <BenefitsTab />}
      {activeTab === "incentives" && <IncentivesTab />}
      {activeTab === "recognition" && <RecognitionTab />}
      {activeTab === "hometime" && <HomeTimeTab />}
      {activeTab === "health" && <PhysicalHealthTab />}
    </div>
  );
}
