/**
 * REWARDS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gift, Star, Trophy, Target, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Rewards() {
  const summaryQuery = (trpc as any).rewards.getSummary.useQuery();
  const rewardsQuery = (trpc as any).rewards.getAvailable.useQuery();
  const historyQuery = (trpc as any).rewards.getHistory.useQuery({ limit: 10 });

  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Rewards
          </h1>
          <p className="text-slate-400 text-sm mt-1">Earn points and redeem rewards</p>
        </div>
      </div>

      {/* Points Card */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Available Points</p>
              {summaryQuery.isLoading ? <Skeleton className="h-12 w-32" /> : (
                <p className="text-4xl font-bold text-white">{(summary?.points || 0).toLocaleString()}</p>
              )}
              <p className="text-purple-400 text-sm mt-2">{summary?.tier || "Bronze"} Member</p>
            </div>
            <div className="p-4 rounded-full bg-purple-500/20">
              <Star className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(summary?.totalEarned || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.redeemed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.rank || "N/A"}</p>
                )}
                <p className="text-xs text-slate-400">Rank</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.nextTierPoints || 0}</p>
                )}
                <p className="text-xs text-slate-400">To Next Tier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {summary?.nextTier && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">{summary.tier}</span>
              <span className="text-purple-400 font-medium">{summary.nextTier}</span>
            </div>
            <Progress value={summary.tierProgress || 0} className="h-3 mb-2" />
            <p className="text-xs text-slate-500 text-center">{summary.nextTierPoints} points to {summary.nextTier}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Rewards */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Available Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {rewardsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (rewardsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No rewards available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(rewardsQuery.data as any)?.map((reward: any) => (
                  <div key={reward.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-500/20">
                          <Gift className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{reward.name}</p>
                          <p className="text-xs text-slate-500">{reward.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">{reward.points} pts</p>
                        <Button size="sm" className="mt-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs" disabled={(summary?.points || 0) < reward.points}>
                          Redeem
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (historyQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Star className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(historyQuery.data as any)?.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", activity.type === "earned" ? "bg-green-400" : "bg-purple-400")} />
                      <div>
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-xs text-slate-500">{activity.date}</p>
                      </div>
                    </div>
                    <p className={cn("font-bold", activity.type === "earned" ? "text-green-400" : "text-purple-400")}>
                      {activity.type === "earned" ? "+" : "-"}{activity.points}
                    </p>
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
