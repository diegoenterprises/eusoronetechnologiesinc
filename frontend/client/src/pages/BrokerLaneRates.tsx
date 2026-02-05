/**
 * BROKER LANE RATES PAGE
 * 100% Dynamic - Manage and analyze lane-specific rates
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
  DollarSign, MapPin, TrendingUp, TrendingDown, Search,
  Plus, BarChart3, Sparkles, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerLaneRates() {
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("30d");

  const ratesQuery = (trpc as any).brokers.getLaneRates.useQuery({ search });
  const marketQuery = (trpc as any).brokers.getMarketRates.useQuery({});

  const addRateMutation = (trpc as any).brokers.addLaneRate.useMutation({
    onSuccess: () => {
      toast.success("Rate added");
      ratesQuery.refetch();
    },
  });

  const rates = ratesQuery.data || [];
  const market = marketQuery.data as any;

  const filteredRates = rates.filter((r: any) =>
    r.origin?.toLowerCase().includes(search.toLowerCase()) ||
    r.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Lane Rates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track lane pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Add Rate
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm">Avg Rate/Mile</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${market?.avgRatePerMile?.toFixed(2) || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  {market?.trendDirection === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  )}
                  <span className={cn("text-sm", market?.trendDirection === 'up' ? "text-red-400" : "text-green-400")}>
                    {Math.abs(market?.trendPercent || 0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Lanes</span>
                </div>
                <p className="text-2xl font-bold text-white">{market?.activeLanes || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Volume</span>
                </div>
                <p className="text-2xl font-bold text-white">{market?.totalLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Avg Margin</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{market?.avgMargin || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          placeholder="Search lanes by origin or destination..."
          className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg"
        />
      </div>

      {/* Rates Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {ratesQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No lane rates found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredRates.map((rate: any) => (
                <div key={rate.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-white font-bold">{rate.origin}</p>
                          <p className="text-slate-400 text-sm">{rate.originState}</p>
                        </div>
                        <div className="w-12 h-0.5 bg-gradient-to-r from-green-400 to-cyan-400" />
                        <div className="text-center">
                          <p className="text-white font-bold">{rate.destination}</p>
                          <p className="text-slate-400 text-sm">{rate.destinationState}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-600/50 text-slate-300 border-0">
                        {rate.distance} mi
                      </Badge>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Your Rate</p>
                        <p className="text-green-400 font-bold text-lg">${rate.yourRate?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Market Rate</p>
                        <p className="text-white font-bold">${rate.marketRate?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">$/Mile</p>
                        <p className="text-white font-bold">${rate.ratePerMile?.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Margin</p>
                        <p className={cn(
                          "font-bold",
                          rate.margin >= 15 ? "text-green-400" :
                          rate.margin >= 10 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {rate.margin}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Trend</p>
                        <div className="flex items-center gap-1">
                          {rate.trend > 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-400" />
                          ) : rate.trend < 0 ? (
                            <TrendingDown className="w-4 h-4 text-green-400" />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {rate.trend !== 0 && (
                            <span className={cn("text-sm", rate.trend > 0 ? "text-red-400" : "text-green-400")}>
                              {Math.abs(rate.trend)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Edit
                      </Button>
                    </div>
                  </div>

                  {rate.aiSuggestion && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">ESANG suggests: ${rate.aiSuggestion.toLocaleString()}</span>
                      <Badge className={cn(
                        "border-0 text-xs",
                        rate.aiSuggestion > rate.yourRate ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {rate.aiSuggestion > rate.yourRate ? "Increase opportunity" : "Competitive"}
                      </Badge>
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
