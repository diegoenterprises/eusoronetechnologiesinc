/**
 * ACHIEVEMENTS & BADGES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Star, Award, Target, Lock,
  CheckCircle, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AchievementsBadges() {
  const achievementsQuery = (trpc as any).users.getAchievements.useQuery();
  const badgesQuery = (trpc as any).users.getBadges.useQuery();
  const statsQuery = (trpc as any).users.getAchievementStats.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Achievements & Badges
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your accomplishments</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.totalAchievements || 0}</p>
                )}
                <p className="text-xs text-slate-400">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.totalBadges || 0}</p>
                )}
                <p className="text-xs text-slate-400">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Star className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.totalPoints?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Points Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.completionRate}%</p>
                )}
                <p className="text-xs text-slate-400">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badgesQuery.isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">{[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (badgesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No badges earned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {(badgesQuery.data as any)?.map((badge: any) => (
                <div key={badge.id} className={cn("p-4 rounded-xl text-center transition-transform hover:scale-105", badge.earned ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30" : "bg-slate-700/30 opacity-50")}>
                  <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2", badge.earned ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-slate-600")}>
                    {badge.earned ? <Award className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className={cn("text-sm font-medium", badge.earned ? "text-white" : "text-slate-500")}>{badge.name}</p>
                  {badge.earned && <p className="text-xs text-slate-500 mt-1">{badge.earnedAt}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {achievementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (achievementsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No achievements yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(achievementsQuery.data as any)?.map((achievement: any) => (
                <div key={achievement.id} className={cn("p-4", achievement.completed && "bg-green-500/5 border-l-2 border-green-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", achievement.completed ? "bg-green-500/20" : "bg-slate-700/50")}>
                      {achievement.completed ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Target className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn("font-medium", achievement.completed ? "text-white" : "text-slate-400")}>{achievement.name}</p>
                        {achievement.completed && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>}
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Star className="w-3 h-3 mr-1" />{achievement.points} pts</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{achievement.description}</p>
                      {!achievement.completed && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-cyan-400">{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    {achievement.completed && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Completed</p>
                        <p className="text-sm text-slate-400">{achievement.completedAt}</p>
                      </div>
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
