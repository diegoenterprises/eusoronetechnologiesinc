/**
 * CATALYST SCORECARD PAGE
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
  Award, TrendingUp, TrendingDown, Clock, Package, Shield,
  Search, Star, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystScorecard() {
  const [searchTerm, setSearchTerm] = useState("");

  const catalystsQuery = (trpc as any).catalysts.getScorecards.useQuery({ limit: 50 });
  const topCatalystsQuery = (trpc as any).catalysts.getTopPerformers.useQuery({ limit: 5 });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-0">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Good</Badge>;
    if (score >= 60) return <Badge className="bg-orange-500/20 text-orange-400 border-0">Fair</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-0">Poor</Badge>;
  };

  const filteredCatalysts = (catalystsQuery.data as any)?.filter((c: any) =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Catalyst Scorecards
        </h1>
        <p className="text-slate-400 text-sm mt-1">Performance metrics and rankings</p>
      </div>

      {/* Top Performers */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCatalystsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(topCatalystsQuery.data as any)?.map((catalyst: any, idx: number) => (
                <div key={catalyst.id} className="p-4 rounded-xl bg-slate-800/50 text-center relative">
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-500">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className={cn("text-3xl font-bold mb-1", getScoreColor(catalyst.overallScore))}>{catalyst.overallScore}</p>
                  <p className="text-white font-medium text-sm truncate">{catalyst.name}</p>
                  <p className="text-xs text-slate-500">MC#{catalyst.mcNumber}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by catalyst name or MC#..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Catalyst Scorecards */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">All Catalysts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {catalystsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredCatalysts?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No catalysts found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCatalysts?.map((catalyst: any) => (
                <div key={catalyst.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", catalyst.overallScore >= 75 ? "bg-green-500/20" : catalyst.overallScore >= 60 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <Truck className={cn("w-6 h-6", catalyst.overallScore >= 75 ? "text-green-400" : catalyst.overallScore >= 60 ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{catalyst.name}</p>
                          {getScoreBadge(catalyst.overallScore)}
                        </div>
                        <p className="text-sm text-slate-400">MC#{catalyst.mcNumber} • DOT#{catalyst.dotNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-3xl font-bold", getScoreColor(catalyst.overallScore))}>{catalyst.overallScore}</p>
                      <div className={cn("flex items-center gap-1 text-xs", catalyst.trend > 0 ? "text-green-400" : "text-red-400")}>
                        {catalyst.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(catalyst.trend)}% vs last month
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">On-Time</span>
                        <span className={cn("font-bold", getScoreColor(catalyst.onTimeScore))}>{catalyst.onTimeScore}%</span>
                      </div>
                      <Progress value={catalyst.onTimeScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Safety</span>
                        <span className={cn("font-bold", getScoreColor(catalyst.safetyScore))}>{catalyst.safetyScore}%</span>
                      </div>
                      <Progress value={catalyst.safetyScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Compliance</span>
                        <span className={cn("font-bold", getScoreColor(catalyst.complianceScore))}>{catalyst.complianceScore}%</span>
                      </div>
                      <Progress value={catalyst.complianceScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Communication</span>
                        <span className={cn("font-bold", getScoreColor(catalyst.communicationScore))}>{catalyst.communicationScore}%</span>
                      </div>
                      <Progress value={catalyst.communicationScore} className="h-1.5" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{catalyst.loadsCompleted} loads</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{catalyst.avgDeliveryTime} avg delivery</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{catalyst.claimsRate}% claims rate</span>
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
