/**
 * CARRIER SCORECARD PAGE
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

export default function CarrierScorecard() {
  const [searchTerm, setSearchTerm] = useState("");

  const carriersQuery = (trpc as any).carriers.getScorecards.useQuery({ limit: 50 });
  const topCarriersQuery = (trpc as any).carriers.getTopPerformers.useQuery({ limit: 5 });

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

  const filteredCarriers = (carriersQuery.data as any)?.filter((c: any) =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Carrier Scorecards
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
          {topCarriersQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(topCarriersQuery.data as any)?.map((carrier: any, idx: number) => (
                <div key={carrier.id} className="p-4 rounded-xl bg-slate-800/50 text-center relative">
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-500">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className={cn("text-3xl font-bold mb-1", getScoreColor(carrier.overallScore))}>{carrier.overallScore}</p>
                  <p className="text-white font-medium text-sm truncate">{carrier.name}</p>
                  <p className="text-xs text-slate-500">MC#{carrier.mcNumber}</p>
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
          placeholder="Search by carrier name or MC#..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Carrier Scorecards */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">All Carriers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredCarriers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No carriers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCarriers?.map((carrier: any) => (
                <div key={carrier.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", carrier.overallScore >= 75 ? "bg-green-500/20" : carrier.overallScore >= 60 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <Truck className={cn("w-6 h-6", carrier.overallScore >= 75 ? "text-green-400" : carrier.overallScore >= 60 ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{carrier.name}</p>
                          {getScoreBadge(carrier.overallScore)}
                        </div>
                        <p className="text-sm text-slate-400">MC#{carrier.mcNumber} • DOT#{carrier.dotNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-3xl font-bold", getScoreColor(carrier.overallScore))}>{carrier.overallScore}</p>
                      <div className={cn("flex items-center gap-1 text-xs", carrier.trend > 0 ? "text-green-400" : "text-red-400")}>
                        {carrier.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(carrier.trend)}% vs last month
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">On-Time</span>
                        <span className={cn("font-bold", getScoreColor(carrier.onTimeScore))}>{carrier.onTimeScore}%</span>
                      </div>
                      <Progress value={carrier.onTimeScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Safety</span>
                        <span className={cn("font-bold", getScoreColor(carrier.safetyScore))}>{carrier.safetyScore}%</span>
                      </div>
                      <Progress value={carrier.safetyScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Compliance</span>
                        <span className={cn("font-bold", getScoreColor(carrier.complianceScore))}>{carrier.complianceScore}%</span>
                      </div>
                      <Progress value={carrier.complianceScore} className="h-1.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Communication</span>
                        <span className={cn("font-bold", getScoreColor(carrier.communicationScore))}>{carrier.communicationScore}%</span>
                      </div>
                      <Progress value={carrier.communicationScore} className="h-1.5" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{carrier.loadsCompleted} loads</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{carrier.avgDeliveryTime} avg delivery</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{carrier.claimsRate}% claims rate</span>
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
