/**
 * SHIPPER CARRIER SCORECARD PAGE
 * 100% Dynamic - View and compare carrier performance scorecards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Search, Star, TrendingUp, TrendingDown,
  Clock, Shield, Truck, Award, Building
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperCarrierScorecard() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("90d");
  const [sortBy, setSortBy] = useState("overall");

  const scorecardsQuery = (trpc as any).shippers.getCarrierPerformance.useQuery({ period: periodFilter as any });
  const statsQuery = (trpc as any).shippers.getStats.useQuery();

  const scorecards = scorecardsQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredScorecards = scorecards.filter((s: any) =>
    s.carrierName?.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500/20";
    if (score >= 75) return "bg-yellow-500/20";
    if (score >= 60) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Carrier Scorecards
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compare carrier performance metrics</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="180d">Last 6 Months</SelectItem>
            <SelectItem value="365d">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Carriers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.activeCarriers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Avg Score</span>
                </div>
                <p className={cn("text-2xl font-bold", getScoreColor(stats?.avgScore || 0))}>
                  {stats?.avgScore || 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Top Performers</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.topPerformers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalLoads?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search carriers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Score</SelectItem>
                <SelectItem value="ontime">On-Time Performance</SelectItem>
                <SelectItem value="safety">Safety Rating</SelectItem>
                <SelectItem value="claims">Claims Rate</SelectItem>
                <SelectItem value="volume">Load Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scorecards */}
      <div className="space-y-4">
        {scorecardsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredScorecards.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carrier scorecards found</p>
            </CardContent>
          </Card>
        ) : (
          filteredScorecards.map((scorecard: any, idx: number) => (
            <Card key={scorecard.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl",
                      getScoreBgColor(scorecard.overallScore),
                      getScoreColor(scorecard.overallScore)
                    )}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-lg">{scorecard.carrierName}</p>
                        {scorecard.isPreferred && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                            <Star className="w-3 h-3 mr-1" />Preferred
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        MC# {scorecard.mcNumber} • {scorecard.loadsCompleted} loads completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={cn("text-3xl font-bold", getScoreColor(scorecard.overallScore))}>
                        {scorecard.overallScore}%
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {getTrendIcon(scorecard.trend)}
                        <span className={cn(
                          "text-xs",
                          scorecard.trend === "up" ? "text-green-400" :
                          scorecard.trend === "down" ? "text-red-400" : "text-slate-500"
                        )}>
                          {scorecard.trendValue}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-400 text-xs">On-Time</span>
                    </div>
                    <p className={cn("text-xl font-bold", getScoreColor(scorecard.onTimeScore))}>
                      {scorecard.onTimeScore}%
                    </p>
                    <Progress value={scorecard.onTimeScore} className="h-1 mt-2" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-slate-400 text-xs">Safety</span>
                    </div>
                    <p className={cn("text-xl font-bold", getScoreColor(scorecard.safetyScore))}>
                      {scorecard.safetyScore}%
                    </p>
                    <Progress value={scorecard.safetyScore} className="h-1 mt-2" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-400 text-xs">Claims</span>
                    </div>
                    <p className={cn("text-xl font-bold", scorecard.claimsRate <= 1 ? "text-green-400" : scorecard.claimsRate <= 3 ? "text-yellow-400" : "text-red-400")}>
                      {scorecard.claimsRate}%
                    </p>
                    <Progress value={100 - (scorecard.claimsRate * 10)} className="h-1 mt-2" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-400 text-xs">Service</span>
                    </div>
                    <p className={cn("text-xl font-bold", getScoreColor(scorecard.serviceScore))}>
                      {scorecard.serviceScore}%
                    </p>
                    <Progress value={scorecard.serviceScore} className="h-1 mt-2" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-orange-400" />
                      <span className="text-slate-400 text-xs">Capacity</span>
                    </div>
                    <p className={cn("text-xl font-bold", getScoreColor(scorecard.capacityScore))}>
                      {scorecard.capacityScore}%
                    </p>
                    <Progress value={scorecard.capacityScore} className="h-1 mt-2" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {scorecard.certifications?.map((cert: string, cidx: number) => (
                      <Badge key={cidx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
