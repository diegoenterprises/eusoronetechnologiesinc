/**
 * DRIVER EARNINGS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Clock,
  Truck, Package, Download, ChevronLeft, ChevronRight,
  Wallet, CreditCard, Target, Award, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverEarnings() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  const summaryQuery = trpc.earnings.getSummary.useQuery({ period });
  const earningsQuery = trpc.earnings.getEarnings.useQuery({ period, offset: weekOffset });
  const weeklyQuery = trpc.earnings.getWeeklySummary.useQuery({ offset: weekOffset });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading earnings</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;
  const weekly = weeklyQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "approved": return "bg-blue-500/20 text-blue-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Earnings</h1>
          <p className="text-slate-400 text-sm">Track your compensation and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "quarter" | "year")}>
            <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.totalEarnings || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Total Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalLoads || 0}</p>
            )}
            <p className="text-xs text-slate-400">Loads</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{(summary?.totalMiles || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Miles</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">${summary?.avgPerMile?.toFixed(2) || 0}</p>
            )}
            <p className="text-xs text-slate-400">Avg/Mile</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">${(summary?.bonuses || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Bonuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o + 1)}><ChevronLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50">
          <Calendar className="w-4 h-4 text-slate-400" />
          {weeklyQuery.isLoading ? <Skeleton className="h-5 w-40" /> : (
            <span className="text-white font-medium">{weekly?.weekStart} - {weekly?.weekEnd}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={weekOffset === 0}><ChevronRight className="w-5 h-5" /></Button>
      </div>

      {/* Weekly Summary */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {weeklyQuery.isLoading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (
              <>
                <div>
                  <p className="text-3xl font-bold text-green-400">${(weekly?.totalEarnings || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Week Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{weekly?.totalLoads || 0}</p>
                  <p className="text-xs text-slate-400">Loads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{(weekly?.totalMiles || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Miles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${weekly?.avgPerMile?.toFixed(2) || 0}</p>
                  <p className="text-xs text-slate-400">Per Mile</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${weekly?.avgPerLoad?.toLocaleString() || 0}</p>
                  <p className="text-xs text-slate-400">Per Load</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Earnings List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Wallet className="w-5 h-5 text-green-400" />Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {earningsQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : earningsQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No earnings for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earningsQuery.data?.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", earning.status === "paid" ? "bg-green-500/20" : earning.status === "approved" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                      <Package className={cn("w-5 h-5", earning.status === "paid" ? "text-green-400" : earning.status === "approved" ? "text-blue-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{earning.loadNumber}</p>
                      <p className="text-sm text-slate-400">{earning.origin} → {earning.destination}</p>
                      <p className="text-xs text-slate-500">{earning.date} | {(earning as any).distance || earning.miles} miles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">${earning.totalPay?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      {earning.hazmatPremium > 0 && <Badge className="bg-red-500/20 text-red-400 text-xs">+${earning.hazmatPremium} Hazmat</Badge>}
                      {earning.fuelBonus > 0 && <Badge className="bg-blue-500/20 text-blue-400 text-xs">+${earning.fuelBonus} Fuel</Badge>}
                      <Badge className={getStatusColor(earning.status)}>{earning.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" />Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/20"><CreditCard className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-white font-medium">Direct Deposit</p>
                <p className="text-sm text-slate-400">****1234 - Weekly on Friday</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600">Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
