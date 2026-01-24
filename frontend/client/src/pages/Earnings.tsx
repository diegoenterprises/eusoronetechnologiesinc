/**
 * EARNINGS PAGE
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
  DollarSign, TrendingUp, Clock, CheckCircle, Download,
  ArrowUpRight, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Earnings() {
  const [activeTab, setActiveTab] = useState("all");
  const [period, setPeriod] = useState("week");

  const earningsQuery = trpc.earnings.getHistory.useQuery({ period });
  const summaryQuery = trpc.earnings.getSummary.useQuery({ period });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Processing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Earnings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your income and payment history</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Total Earnings Card */}
      <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Earnings ({period})</p>
              {summaryQuery.isLoading ? <Skeleton className="h-12 w-48" /> : (
                <p className="text-4xl font-bold text-white">${(summary?.total || 0).toLocaleString()}</p>
              )}
              {summary?.change && (
                <p className={cn("text-sm mt-2 flex items-center gap-1", summary.change >= 0 ? "text-green-400" : "text-red-400")}>
                  <ArrowUpRight className={cn("w-4 h-4", summary.change < 0 && "rotate-180")} />
                  {Math.abs(summary.change)}% from last {period}
                </p>
              )}
            </div>
            <div className="p-4 rounded-full bg-emerald-500/20">
              <DollarSign className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">${(summary?.paid || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.loadsCompleted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-purple-400">${(summary?.avgPerLoad || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Avg/Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {["week", "month", "year"].map((p) => (
          <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className={period === p ? "bg-cyan-600 hover:bg-cyan-700 rounded-lg" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg"} onClick={() => setPeriod(p)}>
            This {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Earnings History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Earnings History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {earningsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : earningsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No earnings yet</p>
              <p className="text-slate-500 text-sm mt-1">Complete loads to start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {earningsQuery.data?.map((earning: any) => (
                <div key={earning.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", earning.status === "paid" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                        <DollarSign className={cn("w-6 h-6", earning.status === "paid" ? "text-green-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{earning.loadNumber}</p>
                        <p className="text-sm text-slate-400">{earning.description}</p>
                        <p className="text-xs text-slate-500">{earning.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-xl">${earning.amount?.toLocaleString()}</p>
                      {getStatusBadge(earning.status)}
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
