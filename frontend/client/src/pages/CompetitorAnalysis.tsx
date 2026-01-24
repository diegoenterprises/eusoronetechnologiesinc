/**
 * COMPETITOR ANALYSIS PAGE
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
  Users, Search, TrendingUp, TrendingDown, DollarSign,
  Target, BarChart3, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CompetitorAnalysis() {
  const [searchTerm, setSearchTerm] = useState("");

  const competitorsQuery = trpc.analytics.getCompetitors.useQuery({ limit: 20 });
  const marketShareQuery = trpc.analytics.getMarketShare.useQuery();
  const benchmarkQuery = trpc.analytics.getBenchmarks.useQuery();

  const marketShare = marketShareQuery.data;

  const filteredCompetitors = competitorsQuery.data?.filter((comp: any) =>
    !searchTerm || comp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Competitor Analysis
        </h1>
        <p className="text-slate-400 text-sm mt-1">Market positioning and competitive insights</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {marketShareQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{marketShare?.ourShare}%</p>
                )}
                <p className="text-xs text-slate-400">Our Market Share</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {competitorsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{competitorsQuery.data?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Competitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", marketShare?.shareChange > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {marketShare?.shareChange > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {marketShareQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", marketShare?.shareChange > 0 ? "text-green-400" : "text-red-400")}>
                    {marketShare?.shareChange > 0 ? "+" : ""}{marketShare?.shareChange}%
                  </p>
                )}
                <p className="text-xs text-slate-400">Share Change</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {marketShareQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">#{marketShare?.marketRank}</p>
                )}
                <p className="text-xs text-slate-400">Market Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search competitors..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitors List */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Competitors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {competitorsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : filteredCompetitors?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No competitors found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredCompetitors?.map((comp: any, idx: number) => (
                  <div key={comp.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", idx === 0 ? "bg-amber-500/20 text-amber-400" : idx === 1 ? "bg-slate-400/20 text-slate-300" : idx === 2 ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/50 text-slate-400")}>{idx + 1}</span>
                        <p className="text-white font-medium">{comp.name}</p>
                      </div>
                      <Badge className={cn(comp.trend === "up" ? "bg-green-500/20 text-green-400" : comp.trend === "down" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400", "border-0")}>
                        {comp.trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : comp.trend === "down" ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                        {comp.marketShare}%
                      </Badge>
                    </div>
                    <Progress value={comp.marketShare} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benchmarks */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Performance Benchmarks</CardTitle>
          </CardHeader>
          <CardContent>
            {benchmarkQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {benchmarkQuery.data?.map((benchmark: any) => (
                  <div key={benchmark.metric} className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{benchmark.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold", benchmark.ourValue > benchmark.industryAvg ? "text-green-400" : "text-red-400")}>{benchmark.ourValue}</span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-slate-400">{benchmark.industryAvg}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(benchmark.ourValue / benchmark.industryAvg) * 50} className={cn("flex-1 h-2", benchmark.ourValue > benchmark.industryAvg && "[&>div]:bg-green-500")} />
                      <span className={cn("text-xs", benchmark.ourValue > benchmark.industryAvg ? "text-green-400" : "text-red-400")}>
                        {benchmark.ourValue > benchmark.industryAvg ? "+" : ""}{((benchmark.ourValue / benchmark.industryAvg - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
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
