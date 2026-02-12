/**
 * COMMISSION TRACKING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, Package, Calendar,
  CheckCircle, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommissionTracking() {
  const [period, setPeriod] = useState("month");

  const commissionsQuery = (trpc as any).brokers.getCommissions.useQuery({ period });
  const statsQuery = (trpc as any).brokers.getCommissionStats.useQuery({ period });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Processing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Commission Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Track your broker commissions</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {statsQuery.isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Commissions</p>
                <p className="text-4xl font-bold text-white">${stats?.total?.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stats?.trend === "up" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-0"><TrendingUp className="w-3 h-3 mr-1" />+{stats?.trendPercent}%</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-0">{stats?.trendPercent}%</Badge>
                  )}
                  <span className="text-xs text-slate-500">vs last {period}</span>
                </div>
              </div>
              <div className="p-4 rounded-full bg-green-500/20"><DollarSign className="w-10 h-10 text-green-400" /></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${stats?.paid?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Paid</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.pending?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Package className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.loadsCompleted || 0}</p>}<p className="text-xs text-slate-400">Loads</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.avgPerLoad || 0}</p>}<p className="text-xs text-slate-400">Avg/Load</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />Commission History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {commissionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (commissionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No commissions found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(commissionsQuery.data as any)?.map((commission: any) => (
                <div key={commission.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", commission.status === "paid" ? "bg-green-500/20" : "bg-slate-700/50")}>
                      <Package className={cn("w-5 h-5", commission.status === "paid" ? "text-green-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">Load #{commission.loadNumber}</p>
                        {getStatusBadge(commission.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{commission.shipper} → {commission.carrier}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{commission.completedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${commission.amount?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{commission.marginPercent}% margin</p>
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
