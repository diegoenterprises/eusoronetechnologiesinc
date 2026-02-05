/**
 * FUEL TRACKING PAGE
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
  Fuel, DollarSign, TrendingUp, Truck, MapPin,
  Calendar, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FuelTracking() {
  const [period, setPeriod] = useState("month");

  const transactionsQuery = (trpc as any).fleet.getFuelTransactions.useQuery({ period });
  const statsQuery = (trpc as any).fleet.getFuelStats.useQuery({ period });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fuel Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor fuel consumption</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Add Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Fuel className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalGallons?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Gallons</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.totalCost?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Total Cost</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.avgMpg}</p>}<p className="text-xs text-slate-400">Avg MPG</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><DollarSign className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.avgPricePerGallon}</p>}<p className="text-xs text-slate-400">Avg $/Gal</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Fuel className="w-5 h-5 text-cyan-400" />Fuel Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {transactionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (transactionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Fuel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No fuel transactions</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(transactionsQuery.data as any)?.map((tx: any) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                      <Fuel className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{tx.gallons} gallons</p>
                        <Badge className="bg-slate-500/20 text-slate-400 border-0">{tx.fuelType}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Truck className="w-3 h-3" /><span>{tx.vehicle}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tx.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{tx.date}</span>
                        <span>{tx.odometer?.toLocaleString()} mi</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">${tx.totalCost?.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">${tx.pricePerGallon}/gal</p>
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
