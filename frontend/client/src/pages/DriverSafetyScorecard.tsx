/**
 * DRIVER SAFETY SCORECARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, User, AlertTriangle, CheckCircle, TrendingUp,
  TrendingDown, Search, Star, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverSafetyScorecard() {
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const driversQuery = (trpc as any).safety.getDriverScores.useQuery({ search });
  const driverDetailQuery = (trpc as any).safety.getDriverScoreDetail.useQuery({ driverId: selectedDriver! }, { enabled: !!selectedDriver });
  const statsQuery = (trpc as any).safety.getDriverSafetyStats.useQuery();

  const stats = statsQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-0"><Star className="w-3 h-3 mr-1" />Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500/20 text-orange-400 border-0">Fair</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Poor</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Driver Safety Scorecard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Individual driver safety performance</p>
        </div>
        {selectedDriver && (
          <Button variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg" onClick={() => setSelectedDriver(null)}>
            Back to List
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.excellent || 0}</p>
                )}
                <p className="text-xs text-slate-400">Excellent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Shield className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.good || 0}</p>
                )}
                <p className="text-xs text-slate-400">Good</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.needsImprovement || 0}</p>
                )}
                <p className="text-xs text-slate-400">Needs Work</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Star className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.avgScore || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Detail */}
      {selectedDriver ? (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          {driverDetailQuery.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
                    {(driverDetailQuery.data as any)?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xl font-bold">{(driverDetailQuery.data as any)?.name}</p>
                      {getScoreBadge((driverDetailQuery.data as any)?.overallScore || 0)}
                    </div>
                    <p className="text-slate-400">{(driverDetailQuery.data as any)?.licenseNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-4xl font-bold", getScoreColor((driverDetailQuery.data as any)?.overallScore || 0))}>{(driverDetailQuery.data as any)?.overallScore}</p>
                    <p className="text-sm text-slate-500">Overall Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(driverDetailQuery.data as any)?.categories?.map((cat: any) => (
                    <div key={cat.name} className="p-4 rounded-xl bg-slate-700/30">
                      <p className="text-sm text-slate-400 mb-2">{cat.name}</p>
                      <p className={cn("text-2xl font-bold", getScoreColor(cat.score))}>{cat.score}</p>
                      <Progress value={cat.score} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-white font-medium mb-3">Recent Events</p>
                  {(driverDetailQuery.data as any)?.recentEvents?.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent events</p>
                  ) : (
                    <div className="space-y-2">
                      {(driverDetailQuery.data as any)?.recentEvents?.map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            {event.type === "positive" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                            <span className="text-sm text-slate-300">{event.description}</span>
                          </div>
                          <span className="text-xs text-slate-500">{event.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
          </div>

          {/* Drivers List */}
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Driver Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (driversQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {(driversQuery.data as any)?.map((driver: any, idx: number) => (
                    <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setSelectedDriver(driver.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-slate-500">#{idx + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">
                          {driver.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.totalMiles?.toLocaleString()} miles | {driver.inspections} inspections</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {driver.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : driver.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-400" /> : null}
                        </div>
                        {getScoreBadge(driver.score)}
                        <span className={cn("text-2xl font-bold", getScoreColor(driver.score))}>{driver.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
