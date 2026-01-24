/**
 * DRIVER SCORECARD PAGE
 * Individual driver safety and performance metrics
 * For Safety Managers and Drivers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Award, TrendingUp, TrendingDown, Star, Shield, Clock,
  Truck, AlertTriangle, CheckCircle, Target, Users,
  ChevronLeft, ChevronRight, Calendar, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverScore {
  driverId: string;
  name: string;
  overallScore: number;
  rank: number;
  totalDrivers: number;
  trend: "up" | "down" | "stable";
  metrics: {
    safetyEvents: number;
    hardBraking: number;
    speeding: number;
    hosViolations: number;
    inspectionScore: number;
    onTimeDelivery: number;
    customerRating: number;
    milesThisMonth: number;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    date: string;
    description: string;
    impact: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    earnedDate: string;
    icon: string;
  }>;
}

const MOCK_DRIVER_SCORE: DriverScore = {
  driverId: "d1",
  name: "Mike Johnson",
  overallScore: 95,
  rank: 1,
  totalDrivers: 18,
  trend: "up",
  metrics: {
    safetyEvents: 0,
    hardBraking: 2,
    speeding: 1,
    hosViolations: 0,
    inspectionScore: 98,
    onTimeDelivery: 96,
    customerRating: 4.8,
    milesThisMonth: 7245,
  },
  recentEvents: [
    { id: "e1", type: "hard_braking", date: "2025-01-20", description: "Hard braking event on I-45", impact: -2 },
    { id: "e2", type: "speeding", date: "2025-01-18", description: "5 mph over limit for 2 min", impact: -1 },
    { id: "e3", type: "on_time", date: "2025-01-22", description: "Early delivery - Load #45918", impact: +1 },
  ],
  achievements: [
    { id: "a1", name: "Million Mile Safe Driver", earnedDate: "2024-06-15", icon: "award" },
    { id: "a2", name: "Perfect Inspection Record", earnedDate: "2024-12-01", icon: "shield" },
    { id: "a3", name: "Customer Favorite", earnedDate: "2025-01-10", icon: "star" },
  ],
};

const LEADERBOARD = [
  { rank: 1, name: "Mike Johnson", score: 95, trend: "up", miles: 7245 },
  { rank: 2, name: "Sarah Williams", score: 92, trend: "stable", miles: 6890 },
  { rank: 3, name: "Tom Brown", score: 88, trend: "down", miles: 5920 },
  { rank: 4, name: "Lisa Chen", score: 86, trend: "up", miles: 6450 },
  { rank: 5, name: "James Wilson", score: 84, trend: "stable", miles: 5780 },
];

export default function DriverScorecard() {
  const { user } = useAuth();
  const [driver] = useState<DriverScore>(MOCK_DRIVER_SCORE);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-green-900/30 to-emerald-900/30 border-green-500/30";
    if (score >= 75) return "from-yellow-900/30 to-orange-900/30 border-yellow-500/30";
    return "from-red-900/30 to-rose-900/30 border-red-500/30";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Scorecard</h1>
          <p className="text-slate-400 text-sm">Safety and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "quarter"].map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period as any)}
              className={selectedPeriod === period ? "bg-blue-600" : "border-slate-600"}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Score Card */}
      <Card className={cn("bg-gradient-to-br border", getScoreBg(driver.overallScore))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center border-4 border-green-500">
                <span className={cn("text-4xl font-bold", getScoreColor(driver.overallScore))}>
                  {driver.overallScore}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{driver.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-300">Rank #{driver.rank} of {driver.totalDrivers}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1",
                    driver.trend === "up" ? "text-green-400" : driver.trend === "down" ? "text-red-400" : "text-slate-400"
                  )}>
                    {driver.trend === "up" ? <TrendingUp className="w-4 h-4" /> : 
                     driver.trend === "down" ? <TrendingDown className="w-4 h-4" /> : null}
                    <span>{driver.trend === "up" ? "+3 pts" : driver.trend === "down" ? "-2 pts" : "No change"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">This Month</p>
              <p className="text-2xl font-bold text-white">{driver.metrics.milesThisMonth.toLocaleString()} mi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Safety Events", value: driver.metrics.safetyEvents, max: 5, inverse: true, color: "green" },
                { label: "Hard Braking Events", value: driver.metrics.hardBraking, max: 10, inverse: true, color: "yellow" },
                { label: "Speeding Events", value: driver.metrics.speeding, max: 10, inverse: true, color: "yellow" },
                { label: "HOS Violations", value: driver.metrics.hosViolations, max: 5, inverse: true, color: "green" },
                { label: "Inspection Score", value: driver.metrics.inspectionScore, max: 100, inverse: false, color: "green" },
                { label: "On-Time Delivery", value: driver.metrics.onTimeDelivery, max: 100, inverse: false, color: "green" },
              ].map((metric, idx) => {
                const percentage = metric.inverse 
                  ? ((metric.max - metric.value) / metric.max) * 100
                  : (metric.value / metric.max) * 100;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{metric.label}</span>
                      <span className={cn(
                        "font-medium",
                        metric.inverse 
                          ? (metric.value === 0 ? "text-green-400" : metric.value <= 2 ? "text-yellow-400" : "text-red-400")
                          : (metric.value >= 90 ? "text-green-400" : metric.value >= 75 ? "text-yellow-400" : "text-red-400")
                      )}>
                        {metric.inverse ? metric.value : `${metric.value}%`}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {driver.recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        event.impact > 0 ? "bg-green-500/20" : "bg-yellow-500/20"
                      )}>
                        {event.impact > 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm">{event.description}</p>
                        <p className="text-xs text-slate-500">{event.date}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      event.impact > 0 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {event.impact > 0 ? `+${event.impact}` : event.impact} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Achievements */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {driver.achievements.map(achievement => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      {achievement.icon === "award" && <Award className="w-5 h-5 text-yellow-400" />}
                      {achievement.icon === "shield" && <Shield className="w-5 h-5 text-yellow-400" />}
                      {achievement.icon === "star" && <Star className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{achievement.name}</p>
                      <p className="text-xs text-slate-500">{achievement.earnedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {LEADERBOARD.map(d => (
                  <div 
                    key={d.rank} 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      d.name === driver.name ? "bg-blue-500/20 border border-blue-500/30" : "bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        d.rank === 1 ? "bg-yellow-500 text-black" :
                        d.rank === 2 ? "bg-slate-400 text-black" :
                        d.rank === 3 ? "bg-orange-600 text-white" :
                        "bg-slate-600 text-white"
                      )}>
                        {d.rank}
                      </span>
                      <span className="text-white text-sm">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", getScoreColor(d.score))}>{d.score}</span>
                      {d.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
                      {d.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Rating */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Customer Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-2xl font-bold text-white">{driver.metrics.customerRating}</span>
                    <span className="text-slate-500">/ 5.0</span>
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      className={cn(
                        "w-4 h-4",
                        star <= Math.round(driver.metrics.customerRating) 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-slate-600"
                      )} 
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
