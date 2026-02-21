/**
 * COMMISSION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, Package, Download, Clock, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Commission() {
  const [period, setPeriod] = useState("month");

  const summaryQuery = (trpc as any).brokers.getCommissionSummary.useQuery({ period });
  const historyQuery = (trpc as any).brokers.getCommissionHistory.useQuery({ period, limit: 20 });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Commission
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your broker commissions and earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {["week", "month", "year"].map((p: any) => (
              <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className={period === p ? "bg-cyan-600 hover:bg-cyan-700 rounded-lg" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg"} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Total Commission Card */}
      <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Commission ({period})</p>
              {summaryQuery.isLoading ? <Skeleton className="h-12 w-48" /> : (
                <p className="text-4xl font-bold text-white">${(summary?.totalCommission || 0).toLocaleString()}</p>
              )}
            </div>
            <div className="p-4 rounded-full bg-emerald-500/20">
              <DollarSign className="w-10 h-10 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(summary?.paid || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${(summary?.pending || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.loadsMatched || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loads Matched</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgMargin || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Commission History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (historyQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-white/[0.04] w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No commission history</p>
              <p className="text-slate-500 text-sm mt-1">Match loads to start earning commissions</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(historyQuery.data as any)?.map((commission: any) => (
                <div key={commission.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", commission.status === "paid" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                        <DollarSign className={cn("w-6 h-6", commission.status === "paid" ? "text-green-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{commission.loadNumber}</p>
                        <p className="text-sm text-slate-400">{commission.shipperName} → {commission.catalystName}</p>
                        <p className="text-xs text-slate-500">{commission.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-lg">${commission.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{commission.margin}% margin</p>
                      {getStatusBadge(commission.status)}
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
