/**
 * DRIVER COMPENSATION PAGE
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
  DollarSign, TrendingUp, Truck, Calendar,
  Clock, MapPin, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverCompensation() {
  const [period, setPeriod] = useState("week");

  const earningsQuery = (trpc as any).drivers.getEarnings.useQuery({ period: period as "week" | "month" | "quarter" | "year" });
  const tripsQuery = (trpc as any).drivers.getCompletedTrips.useQuery({ period, limit: 10 });
  const statsQuery = (trpc as any).drivers.getEarningsStats.useQuery({ period });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Compensation</h1>
          <p className="text-slate-400 text-sm mt-1">Track your earnings and trips</p>
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

      {earningsQuery.isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Earnings</p>
                <p className="text-4xl font-bold text-white">${(earningsQuery.data as any)?.total?.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  {(earningsQuery.data as any)?.trend === "up" ? (
                    <Badge className="bg-green-500/20 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent border-0"><TrendingUp className="w-3 h-3 mr-1" />+{(earningsQuery.data as any)?.trendPercent}%</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-0">{(earningsQuery.data as any)?.trendPercent}%</Badge>
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
              <div className="p-3 rounded-full bg-blue-500/20"><Truck className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.tripsCompleted || 0}</p>}<p className="text-xs text-slate-400">Trips</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><MapPin className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{(stats as any)?.distanceDriven?.toLocaleString() || stats?.milesDriven?.toLocaleString() || 0}</p>}<p className="text-xs text-slate-400">Miles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><DollarSign className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">${stats?.perMile || 0}</p>}<p className="text-xs text-slate-400">Per Mile</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Clock className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.hoursWorked}h</p>}<p className="text-xs text-slate-400">Hours</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Completed Trips</CardTitle></CardHeader>
        <CardContent className="p-0">
          {tripsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (tripsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No completed trips</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(tripsQuery.data as any)?.map((trip: any) => (
                <div key={trip.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/20"><Truck className="w-5 h-5 text-green-400" /></div>
                    <div>
                      <p className="text-white font-medium">Load #{trip.loadNumber}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{trip.origin} → {trip.destination}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.distance} mi</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.completedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${trip.earnings?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">${trip.perMile}/mi</p>
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
