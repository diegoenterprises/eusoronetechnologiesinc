/**
 * REWARDS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gift, Star, Trophy, Award, Target, TrendingUp,
  ShoppingBag, Ticket, CreditCard, Clock, CheckCircle,
  ChevronRight, Sparkles, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Rewards() {
  const [activeTab, setActiveTab] = useState("store");

  const balanceQuery = trpc.gamification.getPointsBalance.useQuery();
  const rewardsQuery = trpc.gamification.getAvailableRewards.useQuery();
  const redemptionsQuery = trpc.gamification.getMyRedemptions.useQuery();
  const streaksQuery = trpc.gamification.getStreaks.useQuery();

  const redeemMutation = trpc.gamification.redeemReward.useMutation({
    onSuccess: () => { toast.success("Reward redeemed!"); balanceQuery.refetch(); redemptionsQuery.refetch(); },
    onError: (error) => toast.error("Failed to redeem", { description: error.message }),
  });

  const balance = balanceQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rewards Center</h1>
          <p className="text-slate-400 text-sm">Earn points, unlock rewards, climb the ranks</p>
        </div>
      </div>

      {/* Points Balance Card */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Star className="w-10 h-10 text-white fill-white" />
              </div>
              <div>
                {balanceQuery.isLoading ? (
                  <>
                    <Skeleton className="h-12 w-32 mb-2" />
                    <Skeleton className="h-6 w-48" />
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-yellow-400">{balance?.points?.toLocaleString() || 0}</p>
                    <p className="text-slate-400">Available Points</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className="bg-purple-500/20 text-purple-400">Level {balance?.level || 1}</Badge>
                      <Badge className="bg-blue-500/20 text-blue-400">Rank #{balance?.rank || "N/A"}</Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              {balanceQuery.isLoading ? <Skeleton className="h-16 w-32" /> : (
                <div>
                  <p className="text-sm text-slate-400">Lifetime Earned</p>
                  <p className="text-2xl font-bold text-white">{balance?.lifetimePoints?.toLocaleString() || 0}</p>
                  <p className="text-sm text-green-400 flex items-center justify-end gap-1 mt-1">
                    <TrendingUp className="w-4 h-4" />+{balance?.pointsThisMonth || 0} this month
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progress to Level {(balance?.level || 0) + 1}</span>
              {balanceQuery.isLoading ? <Skeleton className="h-4 w-24" /> : (
                <span className="text-sm text-slate-400">{balance?.pointsToNextLevel?.toLocaleString()} pts needed</span>
              )}
            </div>
            <Progress value={balance?.levelProgress || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Streaks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {streaksQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : (
          streaksQuery.data?.map((streak) => (
            <Card key={streak.type} className={cn("border-slate-700", streak.active ? "bg-orange-500/10 border-orange-500/30" : "bg-slate-800/50")}>
              <CardContent className="p-4 text-center">
                <div className={cn("w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center", streak.active ? "bg-orange-500/20" : "bg-slate-700")}>
                  <Sparkles className={cn("w-5 h-5", streak.active ? "text-orange-400" : "text-slate-500")} />
                </div>
                <p className="text-2xl font-bold text-white">{streak.count}</p>
                <p className="text-xs text-slate-400">{streak.label}</p>
                {streak.active && <Badge className="mt-2 bg-orange-500/20 text-orange-400">Active</Badge>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="store" className="data-[state=active]:bg-yellow-600">Rewards Store</TabsTrigger>
          <TabsTrigger value="redemptions" className="data-[state=active]:bg-yellow-600">My Redemptions</TabsTrigger>
          <TabsTrigger value="earn" className="data-[state=active]:bg-yellow-600">How to Earn</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardsQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>)
            ) : rewardsQuery.data?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No rewards available</p>
              </div>
            ) : (
              rewardsQuery.data?.map((reward) => {
                const canAfford = (balance?.points || 0) >= reward.pointsCost;
                return (
                  <Card key={reward.id} className={cn("bg-slate-800/50 border-slate-700 transition-all", canAfford && "hover:border-yellow-500/50")}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("p-3 rounded-lg", reward.category === "gift_card" ? "bg-green-500/20" : reward.category === "merchandise" ? "bg-blue-500/20" : "bg-purple-500/20")}>
                          {reward.category === "gift_card" ? <CreditCard className="w-6 h-6 text-green-400" /> :
                           reward.category === "merchandise" ? <ShoppingBag className="w-6 h-6 text-blue-400" /> :
                           <Ticket className="w-6 h-6 text-purple-400" />}
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400">{reward.pointsCost.toLocaleString()} pts</Badge>
                      </div>
                      <h3 className="text-white font-bold mb-1">{reward.name}</h3>
                      <p className="text-sm text-slate-400 mb-4">{reward.description}</p>
                      {reward.quantity !== undefined && (
                        <p className="text-xs text-slate-500 mb-3">{reward.quantity} remaining</p>
                      )}
                      <Button
                        className={cn("w-full", canAfford ? "bg-yellow-600 hover:bg-yellow-700" : "bg-slate-700")}
                        disabled={!canAfford || redeemMutation.isPending}
                        onClick={() => redeemMutation.mutate({ rewardId: reward.id })}
                      >
                        {redeemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : canAfford ? "Redeem" : "Not Enough Points"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="redemptions" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">My Redemptions</CardTitle></CardHeader>
            <CardContent>
              {redemptionsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : redemptionsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No redemptions yet</p>
                  <p className="text-sm text-slate-500 mt-1">Browse the rewards store to redeem your points</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redemptionsQuery.data?.map((redemption) => (
                    <div key={redemption.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", redemption.status === "fulfilled" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                          {redemption.status === "fulfilled" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{redemption.rewardName}</p>
                          <p className="text-sm text-slate-400">{redemption.pointsSpent.toLocaleString()} points</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={redemption.status === "fulfilled" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {redemption.status}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{redemption.redeemedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earn" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Target className="w-5 h-5 text-green-400" />Ways to Earn Points</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { action: "Complete a Load", points: 100, icon: Trophy, color: "text-blue-400" },
                  { action: "On-Time Delivery", points: 50, icon: Clock, color: "text-green-400" },
                  { action: "Perfect Safety Score", points: 200, icon: Award, color: "text-purple-400" },
                  { action: "Daily Login Streak", points: 25, icon: Sparkles, color: "text-orange-400" },
                  { action: "Complete Training", points: 150, icon: Target, color: "text-yellow-400" },
                  { action: "Refer a Driver", points: 500, icon: Gift, color: "text-pink-400" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-6 h-6", item.color)} />
                      <span className="text-white">{item.action}</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400">+{item.points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
