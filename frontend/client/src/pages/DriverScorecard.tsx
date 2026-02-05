/**
 * DRIVER SCORECARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Award, TrendingUp, TrendingDown, Star, Shield, Clock,
  Truck, AlertTriangle, CheckCircle, Target, ChevronLeft,
  ChevronRight, Calendar, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverScorecard() {
  const [period, setPeriod] = useState("month");

  const scorecardQuery = (trpc as any).drivers.getScorecard.useQuery({ period });
  const eventsQuery = (trpc as any).drivers.getRecentEvents.useQuery({ limit: 10 });
  const achievementsQuery = (trpc as any).gamification.getMyAchievements.useQuery();

  if (scorecardQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading scorecard</p>
        <Button className="mt-4" onClick={() => scorecardQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const scorecard = scorecardQuery.data;

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
          <h1 className="text-2xl font-bold text-white">Driver Scorecard</h1>
          <p className="text-slate-400 text-sm">Your performance and safety metrics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Score Card */}
      <Card className={cn("border", getScoreBg(scorecard?.overallScore || 0))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                {scorecardQuery.isLoading ? <Skeleton className="w-32 h-32 rounded-full" /> : (
                  <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <p className={cn("text-5xl font-bold", getScoreColor(scorecard?.overallScore || 0))}>{scorecard?.overallScore || 0}</p>
                      <p className="text-xs text-slate-500">Overall Score</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                {scorecardQuery.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white">{scorecard?.driverName}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className="bg-purple-500/20 text-purple-400">Rank #{scorecard?.rank} of {scorecard?.totalDrivers}</Badge>
                      {scorecard?.trend === "up" ? (
                        <Badge className="bg-green-500/20 text-green-400"><TrendingUp className="w-3 h-3 mr-1" />Improving</Badge>
                      ) : scorecard?.trend === "down" ? (
                        <Badge className="bg-red-500/20 text-red-400"><TrendingDown className="w-3 h-3 mr-1" />Declining</Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400">Stable</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {scorecardQuery.isLoading ? (
                [1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-24" />)
              ) : (
                <>
                  <div className="text-center p-3 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-blue-400">{(scorecard?.metrics as any)?.distanceThisMonth?.toLocaleString() || scorecard?.metrics?.milesThisMonth?.toLocaleString() || 0}</p>
                    <p className="text-xs text-slate-500">Miles</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-green-400">{scorecard?.metrics?.onTimeDelivery || 0}%</p>
                    <p className="text-xs text-slate-500">On-Time</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-yellow-400">{scorecard?.metrics?.customerRating || 0}</p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-purple-400">{scorecard?.metrics?.inspectionScore || 0}%</p>
                    <p className="text-xs text-slate-500">Inspection</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scorecardQuery.isLoading ? (
          [1, 2, 3, 4].map((i: any) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Safety Events</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{scorecard?.metrics?.safetyEvents || 0}</p>
                <Progress value={100 - (scorecard?.metrics?.safetyEvents || 0) * 10} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Hard Braking</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">{scorecard?.metrics?.hardBraking || 0}</p>
                <Progress value={100 - (scorecard?.metrics?.hardBraking || 0) * 5} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Speeding</span>
                  <Truck className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">{scorecard?.metrics?.speeding || 0}</p>
                <Progress value={100 - (scorecard?.metrics?.speeding || 0) * 5} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">HOS Violations</span>
                  <Clock className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white">{scorecard?.metrics?.hosViolations || 0}</p>
                <Progress value={100 - (scorecard?.metrics?.hosViolations || 0) * 20} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" />Recent Events</CardTitle></CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (eventsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No recent events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(eventsQuery.data as any)?.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="text-white">{event.type}</p>
                      <p className="text-sm text-slate-400">{event.description}</p>
                      <p className="text-xs text-slate-500">{event.date}</p>
                    </div>
                    <Badge className={event.impact > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                      {event.impact > 0 ? `-${event.impact}` : `+${Math.abs(event.impact)}`} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" />Achievements</CardTitle></CardHeader>
          <CardContent>
            {achievementsQuery.isLoading ? (
              <div className="grid grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (achievementsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No achievements yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(achievementsQuery.data as any)?.slice(0, 6).map((achievement: any) => (
                  <div key={achievement.id} className={cn("p-3 rounded-lg text-center", achievement.unlocked ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/30 opacity-50")}>
                    <Award className={cn("w-6 h-6 mx-auto mb-1", achievement.unlocked ? "text-yellow-400" : "text-slate-500")} />
                    <p className="text-xs text-white">{achievement.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
