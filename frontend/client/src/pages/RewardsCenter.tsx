/**
 * REWARDS CENTER PAGE
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
  Gift, Star, Trophy, Zap, Clock,
  CheckCircle, Lock, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RewardsCenter() {
  const rewardsQuery = trpc.users.getRewardsInfo.useQuery();
  const availableQuery = trpc.users.getAvailableRewards.useQuery();
  const historyQuery = trpc.users.getRewardsHistory.useQuery({ limit: 10 });

  const redeemMutation = trpc.users.redeemReward.useMutation({
    onSuccess: () => { toast.success("Reward redeemed!"); rewardsQuery.refetch(); availableQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rewards = rewardsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Rewards Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Earn and redeem rewards</p>
        </div>
      </div>

      {/* Points Balance */}
      {rewardsQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-purple-500/20">
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Your Points Balance</p>
                  <p className="text-4xl font-bold text-white">{rewards?.points?.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Current Tier</p>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-lg px-4 py-1">
                  <Trophy className="w-4 h-4 mr-2" />{rewards?.tier}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">{rewards?.pointsToNextTier?.toLocaleString()} points to {rewards?.nextTier}</span>
                <span className="text-purple-400">{rewards?.tierProgress}%</span>
              </div>
              <Progress value={rewards?.tierProgress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {rewardsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{rewards?.pointsEarnedThisMonth?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Earned This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Gift className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {rewardsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{rewards?.rewardsRedeemed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rewards Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {rewardsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{rewards?.streakDays || 0}</p>
                )}
                <p className="text-xs text-slate-400">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {rewardsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{rewards?.lifetimePoints?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Lifetime Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          ) : availableQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No rewards available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableQuery.data?.map((reward: any) => (
                <div key={reward.id} className={cn("p-4 rounded-xl border transition-colors", reward.canRedeem ? "bg-slate-700/30 border-slate-600/50 hover:border-cyan-500/50" : "bg-slate-800/30 border-slate-700/30 opacity-60")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-lg", reward.canRedeem ? "bg-cyan-500/20" : "bg-slate-700/50")}>
                      <Gift className={cn("w-5 h-5", reward.canRedeem ? "text-cyan-400" : "text-slate-500")} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{reward.name}</p>
                      <p className="text-xs text-slate-500">{reward.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/20 text-purple-400 border-0">
                      <Star className="w-3 h-3 mr-1" />{reward.pointsCost?.toLocaleString()} pts
                    </Badge>
                    <Button size="sm" className={cn("rounded-lg", reward.canRedeem ? "bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700" : "bg-slate-700")} onClick={() => redeemMutation.mutate({ rewardId: reward.id })} disabled={!reward.canRedeem}>
                      {reward.canRedeem ? <><CheckCircle className="w-4 h-4 mr-1" />Redeem</> : <><Lock className="w-4 h-4 mr-1" />Locked</>}
                    </Button>
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
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {historyQuery.data?.map((activity: any) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", activity.type === "earned" ? "bg-green-500/20" : "bg-blue-500/20")}>
                      {activity.type === "earned" ? <Zap className="w-4 h-4 text-green-400" /> : <Gift className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.timestamp}</p>
                    </div>
                  </div>
                  <span className={cn("font-bold", activity.type === "earned" ? "text-green-400" : "text-blue-400")}>
                    {activity.type === "earned" ? "+" : "-"}{activity.points?.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
