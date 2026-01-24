/**
 * REWARDS PAGE
 * Gamification rewards store and redemption
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Gift, Trophy, Star, Crown, Zap, Target, ShoppingBag,
  CreditCard, Truck, Fuel, Coffee, Shirt, Award, Clock,
  CheckCircle, ChevronRight, TrendingUp, Users, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  available: boolean;
  image?: string | null;
  stock?: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  reward: number;
  progress: number;
  target: number;
  endsAt: string;
  participants?: number;
}

export default function Rewards() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("store");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // tRPC queries
  const { data: profileData } = trpc.gamification.getProfile.useQuery({});
  const { data: rewardsData } = trpc.gamification.getRewardsCatalog.useQuery();
  const { data: challengesData } = trpc.gamification.getChallenges.useQuery();
  const { data: leaderboardData } = trpc.gamification.getLeaderboard.useQuery({ period: "month", category: "points" });
  const { data: historyData } = trpc.gamification.getPointsHistory.useQuery({ limit: 10 });

  const redeemMutation = trpc.gamification.redeemReward.useMutation({
    onSuccess: () => {
      toast.success("Reward redeemed successfully!", {
        description: "Your reward will be processed shortly.",
      });
    },
    onError: () => {
      toast.error("Failed to redeem reward");
    },
  });

  const profile = profileData || {
    level: 12,
    title: "Road Warrior",
    totalPoints: 4850,
    pointsToNextLevel: 150,
    rank: 15,
  };

  const defaultRewards: Reward[] = [
    { id: "r1", name: "EusoTrip Cap", description: "Official branded cap", category: "merchandise", pointsCost: 500, available: true, stock: 50 },
    { id: "r2", name: "EusoTrip T-Shirt", description: "Premium cotton t-shirt", category: "merchandise", pointsCost: 800, available: true, stock: 35 },
    { id: "r3", name: "EusoTrip Jacket", description: "Premium branded jacket", category: "merchandise", pointsCost: 3000, available: true, stock: 15 },
    { id: "r4", name: "$25 Fuel Card", description: "Pilot Flying J gift card", category: "gift_cards", pointsCost: 2500, available: true },
    { id: "r5", name: "$50 Fuel Card", description: "Pilot Flying J gift card", category: "gift_cards", pointsCost: 5000, available: true },
    { id: "r6", name: "$25 Amazon Card", description: "Amazon gift card", category: "gift_cards", pointsCost: 2500, available: true },
    { id: "r7", name: "$50 Amazon Card", description: "Amazon gift card", category: "gift_cards", pointsCost: 5000, available: true },
    { id: "r8", name: "Priority Dispatch", description: "1 week priority access to premium loads", category: "perks", pointsCost: 1000, available: true },
    { id: "r9", name: "Premium Badge", description: "Exclusive profile badge for 30 days", category: "perks", pointsCost: 500, available: true },
    { id: "r10", name: "Truck Wash", description: "Free truck wash at any partner location", category: "services", pointsCost: 750, available: true },
  ];

  const rewards: Reward[] = (rewardsData?.rewards as Reward[]) || defaultRewards;

  const challenges: Challenge[] = challengesData?.active || [
    { id: "c1", name: "January Sprint", description: "Complete 20 loads this month", type: "monthly", reward: 500, progress: 15, target: 20, endsAt: "2025-01-31T23:59:59Z", participants: 245 },
    { id: "c2", name: "Perfect Week", description: "100% on-time for 7 consecutive days", type: "weekly", reward: 200, progress: 5, target: 7, endsAt: "2025-01-26T23:59:59Z", participants: 180 },
    { id: "c3", name: "Fuel Efficiency", description: "Average 7+ MPG this week", type: "weekly", reward: 150, progress: 6.8, target: 7, endsAt: "2025-01-26T23:59:59Z", participants: 120 },
  ];

  const leaderboard = leaderboardData?.leaders || [
    { rank: 1, userId: "d5", name: "James Wilson", value: 5200, badge: "champion" },
    { rank: 2, userId: "d8", name: "Emily Martinez", value: 5150, badge: "gold" },
    { rank: 3, userId: "d2", name: "Sarah Williams", value: 5050, badge: "silver" },
    { rank: 4, userId: "d10", name: "Robert Davis", value: 4950, badge: "bronze" },
    { rank: 5, userId: "d1", name: "Mike Johnson", value: 4850 },
  ];

  const pointsHistory = historyData?.transactions || [
    { id: "pt1", type: "earned", amount: 50, reason: "On-time delivery bonus", date: "2025-01-23" },
    { id: "pt2", type: "earned", amount: 25, reason: "Customer 5-star rating", date: "2025-01-22" },
    { id: "pt3", type: "earned", amount: 100, reason: "Weekly streak bonus", date: "2025-01-21" },
    { id: "pt4", type: "redeemed", amount: -500, reason: "Reward: EusoTrip Cap", date: "2025-01-20" },
  ];

  const categories = [
    { id: "all", name: "All Rewards", icon: Gift },
    { id: "merchandise", name: "Merchandise", icon: Shirt },
    { id: "gift_cards", name: "Gift Cards", icon: CreditCard },
    { id: "perks", name: "Perks", icon: Star },
    { id: "services", name: "Services", icon: Truck },
  ];

  const filteredRewards = selectedCategory === "all" 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (profile.totalPoints >= reward.pointsCost) {
      redeemMutation.mutate({ rewardId: reward.id });
    } else {
      toast.error("Insufficient points", {
        description: `You need ${reward.pointsCost - profile.totalPoints} more points`,
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "merchandise": return Shirt;
      case "gift_cards": return CreditCard;
      case "perks": return Star;
      case "services": return Truck;
      default: return Gift;
    }
  };

  const getRankBadge = (badge?: string | null) => {
    switch (badge) {
      case "champion": return { icon: Crown, color: "text-yellow-400 bg-yellow-500/20" };
      case "gold": return { icon: Trophy, color: "text-yellow-400 bg-yellow-500/20" };
      case "silver": return { icon: Award, color: "text-slate-300 bg-slate-400/20" };
      case "bronze": return { icon: Award, color: "text-orange-400 bg-orange-500/20" };
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rewards Center</h1>
          <p className="text-slate-400 text-sm">Earn points, complete challenges, redeem rewards</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-400">Available Points</p>
            <p className="text-2xl font-bold text-purple-400 flex items-center gap-1">
              <Zap className="w-5 h-5" />
              {profile.totalPoints.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{profile.totalPoints}</p>
              <p className="text-xs text-slate-400">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">Level {profile.level}</p>
              <p className="text-xs text-slate-400">{profile.title}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{challenges.length}</p>
              <p className="text-xs text-slate-400">Active Challenges</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">#{profile.rank}</p>
              <p className="text-xs text-slate-400">Leaderboard Rank</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="store" className="data-[state=active]:bg-purple-600">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Rewards Store
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-purple-600">
            <Target className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Rewards Store */}
        <TabsContent value="store" className="mt-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    selectedCategory === cat.id 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRewards.map((reward) => {
              const Icon = getCategoryIcon(reward.category);
              const canAfford = profile.totalPoints >= reward.pointsCost;
              
              return (
                <Card key={reward.id} className={cn(
                  "bg-slate-800/50 border-slate-700 transition-all hover:border-slate-600",
                  !canAfford && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      {reward.stock && (
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {reward.stock} left
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-white font-medium mb-1">{reward.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">{reward.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-purple-400 font-bold">
                        <Zap className="w-4 h-4" />
                        {reward.pointsCost.toLocaleString()}
                      </div>
                      <Button
                        size="sm"
                        disabled={!canAfford || redeemMutation.isPending}
                        onClick={() => handleRedeem(reward)}
                        className={cn(
                          canAfford 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-slate-600 cursor-not-allowed"
                        )}
                      >
                        {canAfford ? "Redeem" : "Need More"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Challenges */}
        <TabsContent value="challenges" className="mt-6 space-y-4">
          {challenges.map((challenge) => {
            const progressPercent = (challenge.progress / challenge.target) * 100;
            const daysLeft = Math.ceil((new Date(challenge.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={challenge.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Target className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{challenge.name}</h3>
                          <p className="text-sm text-slate-400">{challenge.description}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{challenge.progress} / {challenge.target}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2 bg-slate-700" />
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysLeft} days left
                        </span>
                        {challenge.participants && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {challenge.participants} participants
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-400">Reward</p>
                      <p className="text-2xl font-bold text-purple-400 flex items-center gap-1 justify-end">
                        <Zap className="w-5 h-5" />
                        {challenge.reward}
                      </p>
                      <Badge className={cn(
                        challenge.type === "weekly" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                      )}>
                        {challenge.type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Monthly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const rankBadge = getRankBadge(entry.badge);
                  const isCurrentUser = entry.name === "Mike Johnson";
                  
                  return (
                    <div 
                      key={entry.userId} 
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg",
                        isCurrentUser ? "bg-purple-500/10 border border-purple-500/30" : "bg-slate-700/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                        entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                        entry.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                        entry.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                        "bg-slate-600/20 text-slate-400"
                      )}>
                        {entry.rank}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{entry.name}</span>
                          {isCurrentUser && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">You</Badge>
                          )}
                          {rankBadge && (
                            <rankBadge.icon className={cn("w-4 h-4", rankBadge.color.split(" ")[0])} />
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-white font-bold flex items-center gap-1">
                          <Zap className="w-4 h-4 text-purple-400" />
                          {entry.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pointsHistory.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        tx.type === "earned" ? "bg-green-500/20" : "bg-red-500/20"
                      )}>
                        {tx.type === "earned" ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <Gift className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm">{tx.reason}</p>
                        <p className="text-xs text-slate-500">{tx.date}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold",
                      tx.amount > 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
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
