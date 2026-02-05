/**
 * ESCORT PAY HISTORY PAGE
 * 100% Dynamic - View escort earnings and payment history
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Calendar, Download, TrendingUp,
  Clock, MapPin, FileText, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortPayHistory() {
  const [periodFilter, setPeriodFilter] = useState("30d");

  const paymentsQuery = (trpc as any).escorts.getJobs.useQuery({});
  const summaryQuery = (trpc as any).escorts.getDashboardStats.useQuery();
  const pendingQuery = (trpc as any).escorts.getJobs.useQuery({});

  const payments = paymentsQuery.data || [];
  const summary = summaryQuery.data;
  const pending = pendingQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Pay History
          </h1>
          <p className="text-slate-400 text-sm mt-1">View your earnings and payment history</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Total Earned</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${(summary as any)?.totalEarned?.toLocaleString() || summary?.earnings?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs">+{(summary as any)?.percentChange || 0}% vs last period</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Jobs Completed</span>
                </div>
                <p className="text-2xl font-bold text-white">{(summary as any)?.jobsCompleted || summary?.completed || 0}</p>
                <p className="text-slate-500 text-xs mt-1">
                  ${(summary as any)?.avgPerJob?.toFixed(0) || 0} avg per job
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(summary as any)?.totalHours || 0}h</p>
                <p className="text-slate-500 text-xs mt-1">
                  ${(summary as any)?.avgPerHour?.toFixed(2) || 0}/hr avg
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${(summary as any)?.pendingAmount?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {pending.length} pending payments
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Pending Payments */}
      {pending.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Payments ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((payment: any) => (
                <div key={payment.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Route #{payment.routeNumber}</p>
                    <p className="text-slate-400 text-sm">{payment.completedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">${payment.amount?.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">Est. {payment.expectedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Payment History
          </CardTitle>
          <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
            <Download className="w-4 h-4 mr-1" />Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No payment history found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {payments.map((payment: any) => (
                <div key={payment.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        payment.status === "paid" ? "bg-green-500/20" : "bg-yellow-500/20"
                      )}>
                        <DollarSign className={cn(
                          "w-5 h-5",
                          payment.status === "paid" ? "text-green-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">Route #{payment.routeNumber}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            payment.status === "paid" ? "bg-green-500/20 text-green-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {payment.origin} to {payment.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Hours</p>
                        <p className="text-white">{payment.hours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-white">{payment.date}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Amount</p>
                        <p className="text-green-400 font-bold">${payment.amount?.toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {payment.breakdown && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-slate-500 text-xs">Base Pay</p>
                        <p className="text-white text-sm">${payment.breakdown.basePay}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-xs">Mileage</p>
                        <p className="text-white text-sm">${payment.breakdown.mileage}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-xs">Wait Time</p>
                        <p className="text-white text-sm">${payment.breakdown.waitTime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-xs">Bonus</p>
                        <p className="text-cyan-400 text-sm">${payment.breakdown.bonus || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
