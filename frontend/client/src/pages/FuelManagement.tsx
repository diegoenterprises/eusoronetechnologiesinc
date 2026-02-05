/**
 * FUEL MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Fuel, DollarSign, TrendingUp, TrendingDown, MapPin,
  Search, Truck, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FuelManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const transactionsQuery = (trpc as any).fuel.getTransactions.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).fuel.getSummary.useQuery();
  const pricesQuery = (trpc as any).fuel.getCurrentPrices.useQuery();

  const summary = summaryQuery.data;

  const filteredTransactions = (transactionsQuery.data as any)?.filter((tx: any) => {
    return !searchTerm || 
      tx.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.truckNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Fuel Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track fuel consumption and costs</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-400">{(summary?.totalGallons || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Gallons MTD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${(summary?.totalSpent || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Spent MTD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Fuel className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.avgMpg?.toFixed(1) || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg MPG</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">${Number(summary?.avgPricePerGallon || 0).toFixed(2)}</p>
                )}
                <p className="text-xs text-slate-400">Avg $/Gal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Prices */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Current Fuel Prices</CardTitle>
          </CardHeader>
          <CardContent>
            {pricesQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-3">
                {(pricesQuery.data as any)?.map((price: any) => (
                  <div key={price.region} className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{price.region}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">${price.price.toFixed(2)}</span>
                        {price.change !== 0 && (
                          <span className={cn("flex items-center text-xs", price.change > 0 ? "text-red-400" : "text-green-400")}>
                            {price.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(price.change)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Updated: {price.updatedAt}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Recent Transactions</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {transactionsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : filteredTransactions?.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Fuel className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredTransactions?.map((tx: any) => (
                  <div key={tx.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-500/20">
                          <Fuel className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.driverName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Truck className="w-3 h-3" />
                            <span>{tx.truckNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{tx.location}</span>
                            <Calendar className="w-3 h-3 ml-2" />
                            <span>{tx.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{tx.gallons.toFixed(1)} gal</p>
                        <p className="text-emerald-400 font-medium">${tx.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">${tx.pricePerGallon.toFixed(2)}/gal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
