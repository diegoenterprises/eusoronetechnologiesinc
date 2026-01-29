/**
 * LEADERBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Medal, Crown, Star, TrendingUp,
  TrendingDown, Minus, User
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [timeRange, setTimeRange] = useState("weekly");
  const [category, setCategory] = useState("overall");

  const leaderboardQuery = trpc.users.getLeaderboard.useQuery({ timeRange, category, limit: 50 });
  const myRankQuery = trpc.users.getMyRank.useQuery({ timeRange, category });

  const myRank = myRankQuery.data;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-slate-400">{rank}</span>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">See how you rank against others</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall</SelectItem>
              <SelectItem value="loads">Loads</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* My Rank Card */}
      {myRankQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : myRank && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
                  #{myRank.rank}
                </div>
                <div>
                  <p className="text-white text-xl font-bold">Your Ranking</p>
                  <p className="text-slate-400">Top {myRank.percentile}% of all users</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{myRank.score?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-sm">
                  {getTrendIcon(myRank.trend)}
                  <span className={cn(myRank.trend === "up" ? "text-green-400" : myRank.trend === "down" ? "text-red-400" : "text-slate-500")}>
                    {myRank.trendValue} from last {timeRange === "daily" ? "day" : timeRange === "weekly" ? "week" : "month"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {leaderboardQuery.isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
      ) : (leaderboardQuery.data?.length ?? 0) >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl mt-8">
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center mb-3">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-bold">{leaderboardQuery.data?.[1]?.name}</p>
              <p className="text-sm text-slate-400">{leaderboardQuery.data?.[1]?.score?.toLocaleString()} pts</p>
              <Badge className="mt-2 bg-slate-500/20 text-slate-300 border-0">2nd Place</Badge>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30 rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-3">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="text-white font-bold text-lg">{leaderboardQuery.data?.[0]?.name}</p>
              <p className="text-yellow-400 font-bold">{leaderboardQuery.data?.[0]?.score?.toLocaleString()} pts</p>
              <Badge className="mt-2 bg-yellow-500/20 text-yellow-400 border-0">1st Place</Badge>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl mt-8">
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-3">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-bold">{leaderboardQuery.data?.[2]?.name}</p>
              <p className="text-sm text-slate-400">{leaderboardQuery.data?.[2]?.score?.toLocaleString()} pts</p>
              <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-0">3rd Place</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboardQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : leaderboardQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No rankings available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
              {leaderboardQuery.data?.slice(3).map((user: any, idx: number) => (
                <div key={user.id} className={cn("p-4 flex items-center justify-between", user.isCurrentUser && "bg-cyan-500/10 border-l-2 border-cyan-500")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                      {getRankIcon(idx + 4)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      {user.avatar ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" /> : <User className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", user.isCurrentUser ? "text-cyan-400" : "text-white")}>{user.name}</p>
                        {user.isCurrentUser && <Badge className="bg-cyan-500/20 text-cyan-400 border-0">You</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">{user.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(user.trend)}
                      <span className={cn("text-sm", user.trend === "up" ? "text-green-400" : user.trend === "down" ? "text-red-400" : "text-slate-500")}>{user.trendValue}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{user.score?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">points</p>
                    </div>
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
