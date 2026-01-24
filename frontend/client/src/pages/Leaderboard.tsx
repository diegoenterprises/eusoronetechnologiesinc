/**
 * LEADERBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Medal, Star, TrendingUp, TrendingDown, User,
  Crown, Award, Target, Truck, Shield, Clock, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");
  const [timePeriod, setTimePeriod] = useState("month");

  const leaderboardQuery = trpc.gamification.getLeaderboard.useQuery({ category: activeTab, period: timePeriod });
  const myRankQuery = trpc.gamification.getMyRank.useQuery({ category: activeTab, period: timePeriod });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <span className="text-lg font-bold text-slate-400">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50";
    if (rank === 2) return "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/50";
    if (rank === 3) return "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50";
    return "bg-slate-800/50 border-slate-700";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <div className="w-4 h-4 border-t-2 border-slate-400" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safety": return Shield;
      case "loads": return Truck;
      case "ontime": return Clock;
      case "points": return Star;
      default: return Trophy;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400 text-sm">Compete with your peers and climb the ranks</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="alltime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* My Rank Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Your Rank</p>
                {myRankQuery.isLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-bold text-white">#{myRankQuery.data?.rank || "N/A"}</p>
                    {myRankQuery.data?.trend && getTrendIcon(myRankQuery.data.trend)}
                    {myRankQuery.data?.change && (
                      <span className={cn("text-sm", myRankQuery.data.change > 0 ? "text-green-400" : "text-red-400")}>
                        {myRankQuery.data.change > 0 ? "+" : ""}{myRankQuery.data.change}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8">
              {myRankQuery.isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-20" />)
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{myRankQuery.data?.points?.toLocaleString() || 0}</p>
                    <p className="text-xs text-slate-400">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{myRankQuery.data?.loadsCompleted || 0}</p>
                    <p className="text-xs text-slate-400">Loads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{myRankQuery.data?.safetyScore || 0}</p>
                    <p className="text-xs text-slate-400">Safety</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overall" className="data-[state=active]:bg-yellow-600">
            <Trophy className="w-4 h-4 mr-2" />Overall
          </TabsTrigger>
          <TabsTrigger value="points" className="data-[state=active]:bg-yellow-600">
            <Star className="w-4 h-4 mr-2" />Points
          </TabsTrigger>
          <TabsTrigger value="safety" className="data-[state=active]:bg-yellow-600">
            <Shield className="w-4 h-4 mr-2" />Safety
          </TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-yellow-600">
            <Truck className="w-4 h-4 mr-2" />Loads
          </TabsTrigger>
          <TabsTrigger value="ontime" className="data-[state=active]:bg-yellow-600">
            <Clock className="w-4 h-4 mr-2" />On-Time
          </TabsTrigger>
        </TabsList>

        {["overall", "points", "safety", "loads", "ontime"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {leaderboardQuery.isLoading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center"><Skeleton className="h-32 w-full" /></CardContent>
                  </Card>
                ))
              ) : (
                <>
                  {/* 2nd Place */}
                  <Card className={cn("border", getRankBg(2))}>
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-400/20 flex items-center justify-center">
                        <Medal className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-white font-bold">{leaderboardQuery.data?.[1]?.name || "---"}</p>
                      <p className="text-2xl font-bold text-slate-300 mt-2">{leaderboardQuery.data?.[1]?.score?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">2nd Place</p>
                    </CardContent>
                  </Card>

                  {/* 1st Place */}
                  <Card className={cn("border transform scale-105", getRankBg(1))}>
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Crown className="w-10 h-10 text-yellow-400" />
                      </div>
                      <p className="text-white font-bold text-lg">{leaderboardQuery.data?.[0]?.name || "---"}</p>
                      <p className="text-3xl font-bold text-yellow-400 mt-2">{leaderboardQuery.data?.[0]?.score?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Champion</p>
                      {leaderboardQuery.data?.[0]?.streak && (
                        <Badge className="mt-2 bg-orange-500/20 text-orange-400">
                          <Flame className="w-3 h-3 mr-1" />{leaderboardQuery.data[0].streak} day streak
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* 3rd Place */}
                  <Card className={cn("border", getRankBg(3))}>
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Medal className="w-8 h-8 text-orange-400" />
                      </div>
                      <p className="text-white font-bold">{leaderboardQuery.data?.[2]?.name || "---"}</p>
                      <p className="text-2xl font-bold text-orange-400 mt-2">{leaderboardQuery.data?.[2]?.score?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">3rd Place</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Full Leaderboard */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Full Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : leaderboardQuery.data?.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No rankings available</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboardQuery.data?.map((entry, idx) => {
                      const isMe = entry.isCurrentUser;
                      return (
                        <div key={entry.id} className={cn(
                          "flex items-center justify-between p-4 rounded-lg transition-colors",
                          isMe ? "bg-purple-500/20 border border-purple-500/30" : "bg-slate-700/30 hover:bg-slate-700/50"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center">
                              {getRankIcon(idx + 1)}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={cn("font-medium", isMe ? "text-purple-400" : "text-white")}>{entry.name}</p>
                                {isMe && <Badge className="bg-purple-500/20 text-purple-400 text-xs">You</Badge>}
                              </div>
                              <p className="text-xs text-slate-500">{entry.company}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                              {getTrendIcon(entry.trend)}
                              {entry.change !== 0 && (
                                <span className={cn("text-sm", entry.change > 0 ? "text-green-400" : "text-red-400")}>
                                  {entry.change > 0 ? "+" : ""}{entry.change}
                                </span>
                              )}
                            </div>
                            <div className="text-right w-24">
                              <p className="text-xl font-bold text-white">{entry.score?.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">{tab === "overall" ? "points" : tab}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
