/**
 * DRIVER SCORECARDS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Search, Award, TrendingUp, AlertTriangle,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverScorecards() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const driversQuery = trpc.safety.getDriverScorecards.useQuery({ search, sortBy });
  const statsQuery = trpc.safety.getScorecardStats.useQuery();

  const stats = statsQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black border-0"><Star className="w-3 h-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-slate-400 text-black border-0">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600 text-white border-0">3rd</Badge>;
    return <Badge className="bg-slate-500/20 text-slate-400 border-0">#{rank}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Driver Scorecards</h1>
          <p className="text-slate-400 text-sm mt-1">Driver performance rankings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><User className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalDrivers || 0}</p>}<p className="text-xs text-slate-400">Drivers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Award className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.avgScore}</p>}<p className="text-xs text-slate-400">Avg Score</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.improving || 0}</p>}<p className="text-xs text-slate-400">Improving</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.needsAttention || 0}</p>}<p className="text-xs text-slate-400">Attention</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">By Score</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
            <SelectItem value="miles">By Miles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Award className="w-5 h-5 text-cyan-400" />Driver Rankings</CardTitle></CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : driversQuery.data?.length === 0 ? (
            <div className="text-center py-16"><User className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No drivers found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {driversQuery.data?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.rank <= 3 && "bg-gradient-to-r from-yellow-500/5 to-transparent")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{driver.name?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{driver.name}</p>
                          {getRankBadge(driver.rank)}
                          {driver.needsAttention && <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3" /></Badge>}
                        </div>
                        <p className="text-sm text-slate-400">{driver.truck} | {driver.miles?.toLocaleString()} miles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-3xl font-bold", getScoreColor(driver.score))}>{driver.score}</p>
                      <p className="text-xs text-slate-500">Safety Score</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">HOS</span><span className="text-xs text-white">{driver.hosScore}%</span></div>
                      <Progress value={driver.hosScore} className="h-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Driving</span><span className="text-xs text-white">{driver.drivingScore}%</span></div>
                      <Progress value={driver.drivingScore} className="h-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Vehicle</span><span className="text-xs text-white">{driver.vehicleScore}%</span></div>
                      <Progress value={driver.vehicleScore} className="h-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Compliance</span><span className="text-xs text-white">{driver.complianceScore}%</span></div>
                      <Progress value={driver.complianceScore} className="h-1" />
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
