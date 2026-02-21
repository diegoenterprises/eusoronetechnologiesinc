/**
 * SETTLEMENT STATEMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, DollarSign, CheckCircle, Clock, Calendar,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettlementStatements() {
  const [period, setPeriod] = useState("current");

  const settlementsQuery = (trpc as any).payroll.getSettlements.useQuery({ period });
  const statsQuery = (trpc as any).payroll.getSettlementStats.useQuery({ period });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "finalized": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Finalized</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "disputed": return <Badge className="bg-red-500/20 text-red-400 border-0">Disputed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Settlement Statements</h1>
          <p className="text-slate-400 text-sm mt-1">Driver settlement details</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Statements</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${stats?.totalRevenue?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Revenue</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-purple-400">${stats?.totalSettled?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Settled</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Current Period</SelectItem>
          <SelectItem value="previous">Previous Period</SelectItem>
          <SelectItem value="all">All Periods</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Settlements</CardTitle></CardHeader>
        <CardContent className="p-0">
          {settlementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (settlementsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No settlements found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(settlementsQuery.data as any)?.map((settlement: any) => (
                <div key={settlement.id} className={cn("p-4 flex items-center justify-between", settlement.status === "disputed" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{settlement.driverName?.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{settlement.driverName}</p>
                        {getStatusBadge(settlement.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{settlement.period}</span>
                        <span>Loads: {settlement.loads}</span>
                        <span>Miles: {settlement.distance?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${settlement.revenue?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">-${settlement.deductions?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Deductions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">${settlement.netSettlement?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Net</p>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Download className="w-4 h-4" /></Button>
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
