/**
 * DRIVER SETTLEMENT PAGE
 * 100% Dynamic - View pay statements and earnings
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Download, Calendar, Truck, TrendingUp,
  FileText, CreditCard, Clock, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverSettlement() {
  const [periodFilter, setPeriodFilter] = useState("current");

  const settlementQuery = trpc.drivers.getSettlement.useQuery({ period: periodFilter });
  const historyQuery = trpc.drivers.getSettlementHistory.useQuery();

  const settlement = settlementQuery.data;
  const history = historyQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Settlement
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your earnings and pay statements</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Period</SelectItem>
            <SelectItem value="last">Last Period</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Earnings Summary */}
      {settlementQuery.isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-400 text-sm">Net Pay</p>
                <p className="text-4xl font-bold text-green-400">${settlement?.netPay?.toLocaleString()}</p>
              </div>
              <Badge className={cn(
                "border-0 text-sm px-3 py-1",
                settlement?.status === "paid" ? "bg-green-500/20 text-green-400" :
                settlement?.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-cyan-500/20 text-cyan-400"
              )}>
                {settlement?.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-900/30">
                <p className="text-slate-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Loads</p>
                <p className="text-white font-bold">{settlement?.loadCount || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30">
                <p className="text-slate-400 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" />Miles</p>
                <p className="text-white font-bold">{settlement?.totalMiles?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30">
                <p className="text-slate-400 text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" />Gross</p>
                <p className="text-white font-bold">${settlement?.grossPay?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30">
                <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pay Date</p>
                <p className="text-white font-bold">{settlement?.payDate || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settlementQuery.isLoading ? (
              <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {settlement?.earnings?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-300">{item.description}</span>
                    <span className="text-green-400 font-medium">+${item.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-green-400 font-medium">Total Earnings</span>
                  <span className="text-green-400 font-bold">${settlement?.totalEarnings?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-400" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settlementQuery.isLoading ? (
              <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {settlement?.deductions?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-300">{item.description}</span>
                    <span className="text-red-400 font-medium">-${item.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <span className="text-red-400 font-medium">Total Deductions</span>
                  <span className="text-red-400 font-bold">-${settlement?.totalDeductions?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Settlement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No settlement history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((stmt: any) => (
                <div key={stmt.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{stmt.periodLabel}</p>
                      <p className="text-slate-400 text-sm">{stmt.loadCount} loads • {stmt.distance?.toLocaleString()} miles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-green-400 font-bold">${stmt.netPay?.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">Paid: {stmt.paidDate}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <Download className="w-4 h-4" />
                    </Button>
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
