/**
 * DRIVER COMPENSATION PAGE
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
  DollarSign, TrendingUp, Truck, Calendar, Download,
  Clock, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverCompensation() {
  const [dateRange, setDateRange] = useState("week");

  const compensationQuery = trpc.drivers.getCompensation.useQuery({ dateRange });
  const tripsQuery = trpc.drivers.getCompensationTrips.useQuery({ dateRange, limit: 20 });

  const compensation = compensationQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            My Compensation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your earnings and trip pay</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Earnings Summary */}
      <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              {compensationQuery.isLoading ? <Skeleton className="h-10 w-24 mx-auto" /> : (
                <p className="text-4xl font-bold text-emerald-400">${compensation?.totalEarnings?.toLocaleString()}</p>
              )}
              <p className="text-sm text-slate-400 mt-1">Total Earnings</p>
            </div>
            <div className="text-center">
              {compensationQuery.isLoading ? <Skeleton className="h-10 w-20 mx-auto" /> : (
                <p className="text-4xl font-bold text-cyan-400">{compensation?.totalMiles?.toLocaleString()}</p>
              )}
              <p className="text-sm text-slate-400 mt-1">Miles Driven</p>
            </div>
            <div className="text-center">
              {compensationQuery.isLoading ? <Skeleton className="h-10 w-16 mx-auto" /> : (
                <p className="text-4xl font-bold text-purple-400">{compensation?.totalTrips}</p>
              )}
              <p className="text-sm text-slate-400 mt-1">Trips Completed</p>
            </div>
            <div className="text-center">
              {compensationQuery.isLoading ? <Skeleton className="h-10 w-16 mx-auto" /> : (
                <p className="text-4xl font-bold text-blue-400">${compensation?.avgPerMile?.toFixed(2)}</p>
              )}
              <p className="text-sm text-slate-400 mt-1">Avg Per Mile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {compensationQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">${compensation?.mileagePay?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Mileage Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {compensationQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-blue-400">${compensation?.detentionPay?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Detention Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {compensationQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-purple-400">${compensation?.bonuses?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Bonuses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Trip Pay History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tripsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : tripsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No trips found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {tripsQuery.data?.map((trip: any) => (
                <div key={trip.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <Truck className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{trip.loadNumber}</p>
                          <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.origin} → {trip.destination}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">${trip.totalPay?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{trip.miles} mi @ ${trip.ratePerMile}/mi</p>
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
