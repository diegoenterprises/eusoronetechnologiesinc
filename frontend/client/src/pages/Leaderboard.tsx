/**
 * LEADERBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Medal, Star, TrendingUp, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [period, setPeriod] = useState("month");

  const driversQuery = trpc.leaderboard.getDrivers.useQuery({ period });
  const carriersQuery = trpc.leaderboard.getCarriers.useQuery({ period });
  const myRankQuery = trpc.leaderboard.getMyRank.useQuery({ period });

  const myRank = myRankQuery.data;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <span className="text-slate-400 font-bold text-lg">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 border-yellow-500/30";
    if (rank === 2) return "bg-slate-400/20 border-slate-400/30";
    if (rank === 3) return "bg-orange-500/20 border-orange-500/30";
    return "bg-slate-700/30 border-slate-600/30";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Top performers and rankings</p>
        </div>
        <div className="flex items-center gap-1">
          {["week", "month", "year"].map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className={period === p ? "bg-cyan-600 hover:bg-cyan-700 rounded-lg" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg"} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <Card className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-cyan-500/20">
                  {getRankIcon(myRank.rank)}
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Your Rank</p>
                  <p className="text-3xl font-bold text-white">#{myRank.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Points</p>
                <p className="text-2xl font-bold text-cyan-400">{myRank.points?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{myRank?.rank || "N/A"}</p>
                <p className="text-xs text-slate-400">Your Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Star className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{myRank?.points?.toLocaleString() || 0}</p>
                <p className="text-xs text-slate-400">Your Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{myRank?.loadsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{driversQuery.data?.length || 0}</p>
                <p className="text-xs text-slate-400">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700 rounded-md">Top Drivers</TabsTrigger>
          <TabsTrigger value="carriers" className="data-[state=active]:bg-slate-700 rounded-md">Top Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No rankings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {driversQuery.data?.map((driver: any, idx: number) => (
                    <div key={driver.id} className={cn("p-4 flex items-center justify-between", idx < 3 && getRankBg(idx + 1))}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getRankIcon(idx + 1)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-sm text-slate-400">{driver.loadsCompleted} loads • {driver.onTimeRate}% on-time</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-bold text-lg">{driver.points?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {carriersQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : carriersQuery.data?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No rankings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {carriersQuery.data?.map((carrier: any, idx: number) => (
                    <div key={carrier.id} className={cn("p-4 flex items-center justify-between", idx < 3 && getRankBg(idx + 1))}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getRankIcon(idx + 1)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{carrier.name}</p>
                          <p className="text-sm text-slate-400">{carrier.loadsCompleted} loads • {carrier.rating} rating</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-bold text-lg">{carrier.points?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
