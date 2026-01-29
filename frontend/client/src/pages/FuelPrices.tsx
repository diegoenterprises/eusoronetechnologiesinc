/**
 * FUEL PRICES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Fuel, TrendingUp, TrendingDown, MapPin, Search,
  RefreshCw, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FuelPrices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fuelType, setFuelType] = useState("diesel");

  const pricesQuery = trpc.fuel.getPrices.useQuery({ fuelType });
  const averagesQuery = trpc.fuel.getAverages.useQuery({ fuelType });
  const stationsQuery = trpc.fuel.getNearbyStations.useQuery({ fuelType, limit: 20 });
  const trendsQuery = trpc.fuel.getTrends.useQuery({ fuelType, days: 30 });

  const averages = averagesQuery.data;

  const filteredStations = stationsQuery.data?.filter((station: any) =>
    !searchTerm || station.name?.toLowerCase().includes(searchTerm.toLowerCase()) || station.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Fuel Prices
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track fuel prices and find best rates</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={fuelType} onValueChange={setFuelType}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="def">DEF</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => pricesQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {averagesQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${averages?.national?.toFixed(3)}</p>
                )}
                <p className="text-xs text-slate-400">National Avg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <TrendingDown className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {averagesQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">${averages?.lowest?.toFixed(3)}</p>
                )}
                <p className="text-xs text-slate-400">Lowest Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <TrendingUp className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {averagesQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-red-400">${averages?.highest?.toFixed(3)}</p>
                )}
                <p className="text-xs text-slate-400">Highest Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", (averages?.weekChange ?? 0) < 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {(averages?.weekChange ?? 0) < 0 ? <TrendingDown className="w-6 h-6 text-green-400" /> : <TrendingUp className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                {averagesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className={cn("text-2xl font-bold", (averages?.weekChange ?? 0) < 0 ? "text-green-400" : "text-red-400")}>
                    {(averages?.weekChange ?? 0) > 0 ? "+" : ""}{averages?.weekChange?.toFixed(1)}%
                  </p>
                )}
                <p className="text-xs text-slate-400">Week Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search stations..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nearby Stations */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Fuel className="w-5 h-5 text-cyan-400" />
              Nearby Fuel Stations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : filteredStations?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Fuel className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No stations found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
                {filteredStations?.map((station: any, idx: number) => (
                  <div key={station.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", idx === 0 && "bg-green-500/5 border-l-2 border-green-500")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{station.name}</p>
                          {idx === 0 && <Badge className="bg-green-500/20 text-green-400 border-0">Best Price</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{station.address}, {station.city}, {station.state}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{station.distance} miles away</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", idx === 0 ? "text-green-400" : "text-white")}>${station.price?.toFixed(3)}</p>
                        <p className="text-xs text-slate-500">per gallon</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price by Region */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Price by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {pricesQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-3">
                {pricesQuery.data?.regions?.map((region: any) => (
                  <div key={region.name} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{region.name}</p>
                      <div className={cn("flex items-center gap-1 text-xs", region.change < 0 ? "text-green-400" : "text-red-400")}>
                        {region.change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {region.change > 0 ? "+" : ""}{region.change?.toFixed(1)}% this week
                      </div>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">${region.avgPrice?.toFixed(3)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Trend */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">30-Day Price Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="flex items-end gap-1 h-48">
              {trendsQuery.data?.map((day: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-cyan-500 to-emerald-500 rounded-t" style={{ height: `${(day.price / trendsQuery.data[0]?.price) * 100}%` }} />
                  {idx % 5 === 0 && <p className="text-xs text-slate-500 mt-1">{day.date}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
