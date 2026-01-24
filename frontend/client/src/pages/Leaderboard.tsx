/**
 * LEADERBOARD PAGE
 * Company-wide driver rankings and performance comparisons
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Medal, Award, Crown, Star, TrendingUp, TrendingDown,
  Zap, Shield, Clock, Truck, Users, ChevronUp, ChevronDown,
  Flame, Target, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  name: string;
  avatar?: string;
  value: number;
  badge?: string;
  streak?: number;
  trend: "up" | "down" | "stable";
  stats?: {
    loads?: number;
    onTime?: number;
    safety?: number;
    miles?: number;
  };
}

type Period = "week" | "month" | "quarter" | "year" | "all";
type Category = "points" | "loads" | "safety" | "miles" | "rating";

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [category, setCategory] = useState<Category>("points");

  // tRPC query
  const { data: leaderboardData } = trpc.gamification.getLeaderboard.useQuery({
    period,
    category,
    limit: 50,
  });

  const defaultLeaders: LeaderboardEntry[] = [
    { rank: 1, previousRank: 1, userId: "d5", name: "James Wilson", value: 5200, badge: "champion", streak: 15, trend: "stable", stats: { loads: 32, onTime: 98, safety: 100, miles: 12500 } },
    { rank: 2, previousRank: 4, userId: "d8", name: "Emily Martinez", value: 5150, badge: "gold", streak: 12, trend: "up", stats: { loads: 30, onTime: 97, safety: 98, miles: 11800 } },
    { rank: 3, previousRank: 2, userId: "d2", name: "Sarah Williams", value: 5050, badge: "silver", streak: 8, trend: "down", stats: { loads: 29, onTime: 96, safety: 99, miles: 11200 } },
    { rank: 4, previousRank: 3, userId: "d10", name: "Robert Davis", value: 4950, badge: "bronze", streak: 5, trend: "down", stats: { loads: 28, onTime: 95, safety: 97, miles: 10900 } },
    { rank: 5, previousRank: 6, userId: "d1", name: "Mike Johnson", value: 4850, streak: 10, trend: "up", stats: { loads: 27, onTime: 96, safety: 98, miles: 10500 } },
    { rank: 6, previousRank: 5, userId: "d3", name: "David Brown", value: 4720, trend: "down", stats: { loads: 26, onTime: 94, safety: 96, miles: 10200 } },
    { rank: 7, previousRank: 8, userId: "d7", name: "Jennifer Lee", value: 4680, trend: "up", stats: { loads: 25, onTime: 95, safety: 97, miles: 9800 } },
    { rank: 8, previousRank: 7, userId: "d4", name: "Chris Taylor", value: 4550, trend: "down", stats: { loads: 24, onTime: 93, safety: 95, miles: 9500 } },
    { rank: 9, previousRank: 10, userId: "d6", name: "Amanda White", value: 4480, trend: "up", stats: { loads: 23, onTime: 94, safety: 96, miles: 9200 } },
    { rank: 10, previousRank: 9, userId: "d9", name: "Kevin Anderson", value: 4350, trend: "down", stats: { loads: 22, onTime: 92, safety: 94, miles: 8900 } },
  ];

  const leaders = (leaderboardData?.leaders as unknown as LeaderboardEntry[]) || defaultLeaders;
  const myRank = leaderboardData?.myRank || 5;
  const totalParticipants = leaderboardData?.totalParticipants || 450;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-slate-300" />;
      case 3: return <Medal className="w-6 h-6 text-orange-400" />;
      default: return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50";
      case 2: return "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/50";
      case 3: return "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/50";
      default: return "bg-slate-800/50 border-slate-700";
    }
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case "champion": return { icon: Crown, color: "text-yellow-400 bg-yellow-500/20" };
      case "gold": return { icon: Trophy, color: "text-yellow-400 bg-yellow-500/20" };
      case "silver": return { icon: Award, color: "text-slate-300 bg-slate-400/20" };
      case "bronze": return { icon: Award, color: "text-orange-400 bg-orange-500/20" };
      default: return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "points": return "Total Points";
      case "loads": return "Loads Completed";
      case "safety": return "Safety Score";
      case "ontime": return "On-Time Rate";
      case "miles": return "Miles Driven";
      default: return cat;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "points": return Zap;
      case "loads": return Truck;
      case "safety": return Shield;
      case "ontime": return Clock;
      case "miles": return Target;
      default: return Trophy;
    }
  };

  const formatValue = (value: number, cat: string) => {
    switch (cat) {
      case "points": return value.toLocaleString();
      case "loads": return value.toString();
      case "safety": return `${value}%`;
      case "ontime": return `${value}%`;
      case "miles": return value.toLocaleString();
      default: return value.toString();
    }
  };

  const CategoryIcon = getCategoryIcon(category);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400 text-sm">See how you rank against other drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
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
      </div>

      {/* Your Rank Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-400">#{myRank}</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Your Current Rank</p>
                <p className="text-slate-400 text-sm">
                  Top {((myRank / totalParticipants) * 100).toFixed(1)}% of {totalParticipants} drivers
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-400">
                {leaders.find(l => l.rank === myRank)?.value.toLocaleString() || "4,850"}
              </p>
              <p className="text-sm text-slate-400">{getCategoryLabel(category)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
        <TabsList className="bg-slate-800 border border-slate-700 flex-wrap h-auto p-1">
          <TabsTrigger value="points" className="data-[state=active]:bg-purple-600">
            <Zap className="w-4 h-4 mr-2" />
            Points
          </TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-purple-600">
            <Truck className="w-4 h-4 mr-2" />
            Loads
          </TabsTrigger>
          <TabsTrigger value="safety" className="data-[state=active]:bg-purple-600">
            <Shield className="w-4 h-4 mr-2" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="ontime" className="data-[state=active]:bg-purple-600">
            <Clock className="w-4 h-4 mr-2" />
            On-Time
          </TabsTrigger>
          <TabsTrigger value="miles" className="data-[state=active]:bg-purple-600">
            <Target className="w-4 h-4 mr-2" />
            Miles
          </TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-6">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 2nd Place */}
            <Card className={cn("transition-all", getRankBg(2))}>
              <CardContent className="p-4 text-center">
                <div className="mt-6">
                  {getRankIcon(2)}
                  <div className="w-16 h-16 mx-auto my-3 rounded-full bg-slate-600 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-white font-bold">{leaders[1]?.name}</p>
                  <p className="text-2xl font-bold text-slate-300 mt-1">
                    {formatValue(leaders[1]?.value || 0, category)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 1st Place */}
            <Card className={cn("transition-all -mt-4", getRankBg(1))}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center">{getRankIcon(1)}</div>
                <div className="w-20 h-20 mx-auto my-3 rounded-full bg-yellow-500/20 flex items-center justify-center ring-4 ring-yellow-500/30">
                  <Users className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-white font-bold text-lg">{leaders[0]?.name}</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">
                  {formatValue(leaders[0]?.value || 0, category)}
                </p>
                {leaders[0]?.streak && (
                  <Badge className="mt-2 bg-orange-500/20 text-orange-400">
                    <Flame className="w-3 h-3 mr-1" />
                    {leaders[0].streak} day streak
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className={cn("transition-all", getRankBg(3))}>
              <CardContent className="p-4 text-center">
                <div className="mt-6">
                  {getRankIcon(3)}
                  <div className="w-16 h-16 mx-auto my-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-white font-bold">{leaders[2]?.name}</p>
                  <p className="text-2xl font-bold text-orange-400 mt-1">
                    {formatValue(leaders[2]?.value || 0, category)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Leaderboard */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CategoryIcon className="w-5 h-5 text-purple-400" />
                {getCategoryLabel(category)} Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaders.map((entry, idx) => {
                  const isCurrentUser = entry.rank === myRank;
                  const badgeInfo = getBadgeIcon(entry.badge);
                  const rankChange = entry.previousRank ? entry.previousRank - entry.rank : 0;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-all",
                        isCurrentUser
                          ? "bg-purple-500/10 border border-purple-500/30"
                          : "bg-slate-700/30 hover:bg-slate-700/50"
                      )}
                    >
                      {/* Rank */}
                      <div className="w-12 text-center">
                        {entry.rank <= 3 ? (
                          getRankIcon(entry.rank)
                        ) : (
                          <span className={cn(
                            "text-xl font-bold",
                            isCurrentUser ? "text-purple-400" : "text-slate-400"
                          )}>
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Rank Change */}
                      <div className="w-8">
                        {rankChange > 0 && (
                          <div className="flex items-center text-green-400 text-sm">
                            <ChevronUp className="w-4 h-4" />
                            <span>{rankChange}</span>
                          </div>
                        )}
                        {rankChange < 0 && (
                          <div className="flex items-center text-red-400 text-sm">
                            <ChevronDown className="w-4 h-4" />
                            <span>{Math.abs(rankChange)}</span>
                          </div>
                        )}
                        {rankChange === 0 && entry.previousRank && (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>

                      {/* Name & Badge */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            isCurrentUser ? "text-purple-300" : "text-white"
                          )}>
                            {entry.name}
                          </span>
                          {isCurrentUser && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">You</Badge>
                          )}
                          {badgeInfo && (
                            <badgeInfo.icon className={cn("w-4 h-4", badgeInfo.color.split(" ")[0])} />
                          )}
                        </div>
                        {entry.streak && entry.streak > 5 && (
                          <p className="text-xs text-orange-400 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {entry.streak} day streak
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      {entry.stats && (
                        <div className="hidden md:flex items-center gap-6 text-xs">
                          <div className="text-center">
                            <p className="text-white font-medium">{entry.stats.loads}</p>
                            <p className="text-slate-500">Loads</p>
                          </div>
                          <div className="text-center">
                            <p className="text-green-400 font-medium">{entry.stats.onTime}%</p>
                            <p className="text-slate-500">On-Time</p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-400 font-medium">{entry.stats.safety}%</p>
                            <p className="text-slate-500">Safety</p>
                          </div>
                        </div>
                      )}

                      {/* Value */}
                      <div className="text-right">
                        <p className={cn(
                          "text-xl font-bold",
                          isCurrentUser ? "text-purple-400" : "text-white"
                        )}>
                          {formatValue(entry.value, category)}
                        </p>
                        <p className="text-xs text-slate-500">{getCategoryLabel(category)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {leaders.length >= 10 && (
                <div className="text-center mt-4">
                  <Button variant="outline" className="border-slate-600">
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
