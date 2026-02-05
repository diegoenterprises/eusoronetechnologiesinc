/**
 * BID ANALYSIS PAGE (ESANG AI Bid Fairness)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Zap, DollarSign, TrendingUp, TrendingDown, CheckCircle,
  AlertTriangle, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BidAnalysis() {
  const [bidAmount, setBidAmount] = useState("");
  const [loadId, setLoadId] = useState("");

  const analyzeQuery = (trpc as any).esang.analyzeBid.useQuery(
    { loadId, bidAmount: parseFloat(bidAmount) || 0 },
    { enabled: !!loadId && !!bidAmount }
  );

  const recentQuery = (trpc as any).bids.getRecentAnalysis.useQuery({ limit: 5 });

  const analysis = analyzeQuery.data;

  const getFairnessColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getFairnessBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-400 border-0">Fair</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-0">Below Market</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-purple-500/20">
          <Zap className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            ESANG AI Bid Analysis
          </h1>
          <p className="text-slate-400 text-sm">AI-powered bid fairness evaluation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Analyze Bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Load ID</Label>
              <Input
                value={loadId}
                onChange={(e: any) => setLoadId(e.target.value)}
                placeholder="Enter load ID"
                className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400">Bid Amount ($)</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e: any) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl" disabled={!loadId || !bidAmount}>
              <Zap className="w-4 h-4 mr-2" />Analyze with ESANG AI
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!loadId || !bidAmount ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">Enter bid details to analyze</p>
              </div>
            ) : analyzeQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Fairness Score */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-center">
                  <p className="text-slate-400 text-sm mb-1">Fairness Score</p>
                  <p className={cn("text-5xl font-bold", getFairnessColor(analysis.fairnessScore))}>{analysis.fairnessScore}</p>
                  <div className="mt-2">{getFairnessBadge(analysis.fairnessScore)}</div>
                </div>

                {/* Recommendation */}
                <div className={cn("p-4 rounded-xl flex items-start gap-3", analysis.recommendation === "accept" ? "bg-green-500/10 border border-green-500/20" : analysis.recommendation === "negotiate" ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-red-500/10 border border-red-500/20")}>
                  {analysis.recommendation === "accept" ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  )}
                  <div>
                    <p className={cn("font-medium", analysis.recommendation === "accept" ? "text-green-400" : "text-yellow-400")}>
                      {analysis.recommendation === "accept" ? "Recommended to Accept" : "Consider Negotiating"}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">{analysis.reasoning}</p>
                  </div>
                </div>

                {/* Market Comparison */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-xs text-slate-500">Your Bid</p>
                    <p className="text-white font-bold">${parseFloat(bidAmount).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-xs text-slate-500">Market Avg</p>
                    <p className="text-cyan-400 font-bold">${analysis.marketAverage?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-xs text-slate-500">Difference</p>
                    <div className={cn("flex items-center justify-center gap-1 font-bold", analysis.difference > 0 ? "text-green-400" : "text-red-400")}>
                      {analysis.difference > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(analysis.difference)}%
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <p className="text-white font-medium mb-3">Analysis Factors</p>
                  <div className="space-y-2">
                    {analysis.factors?.map((factor: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                        <span className="text-slate-400">{factor.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", factor.impact === "positive" ? "text-green-400" : factor.impact === "negative" ? "text-red-400" : "text-slate-400")}>
                            {factor.value}
                          </span>
                          {factor.impact === "positive" ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : factor.impact === "negative" ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Unable to analyze bid</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Analysis */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (recentQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent analysis</p>
            ) : (
              <div className="space-y-3">
                {(recentQuery.data as any)?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-full", item.fairnessScore >= 80 ? "bg-green-500/20" : item.fairnessScore >= 60 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <BarChart3 className={cn("w-5 h-5", item.fairnessScore >= 80 ? "text-green-400" : item.fairnessScore >= 60 ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.loadNumber}</p>
                        <p className="text-sm text-slate-400">${item.bidAmount?.toLocaleString()} • {item.route}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn("font-bold", getFairnessColor(item.fairnessScore))}>{item.fairnessScore}</p>
                        <p className="text-xs text-slate-500">Score</p>
                      </div>
                      {getFairnessBadge(item.fairnessScore)}
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
