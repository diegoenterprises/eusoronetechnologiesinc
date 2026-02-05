/**
 * ESCORT ROUTE HISTORY PAGE
 * 100% Dynamic - View completed escort assignments history
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
  History, Search, MapPin, Calendar, Clock,
  DollarSign, Star, Download, TrendingUp, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortRouteHistory() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");

  const historyQuery = (trpc as any).escorts.getCompletedJobs.useQuery({});
  const statsQuery = (trpc as any).escorts.getDashboardStats.useQuery();

  const routes = historyQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredRoutes = routes.filter((r: any) =>
    r.routeNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.origin?.toLowerCase().includes(search.toLowerCase()) ||
    r.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Route History
          </h1>
          <p className="text-slate-400 text-sm mt-1">Completed escort assignments</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Routes</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.routeCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Miles</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalMiles?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Earnings</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalEarnings?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Avg Rating</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.avgRating?.toFixed(1) || 0}</p>
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
          placeholder="Search routes..."
          className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg"
        />
      </div>

      {/* Routes List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No route history found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredRoutes.map((route: any) => (
                <div key={route.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{route.routeNumber}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            route.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                          )}>
                            {route.status}
                          </Badge>
                          {route.rating && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <Star className="w-3 h-3 mr-1" />{route.rating}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-green-400" />
                          <span>{route.origin}</span>
                          <span className="text-slate-600">→</span>
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>{route.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Miles</p>
                        <p className="text-white font-medium">{route.distance?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Duration</p>
                        <p className="text-white">{route.duration}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Earned</p>
                        <p className="text-green-400 font-bold">${route.earnings?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-slate-300">{route.completedDate}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {route.loadDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 text-sm text-slate-400">
                      <span className="text-slate-500">Load:</span> {route.loadDetails.type} • {route.loadDetails.dimensions} • {route.loadDetails.weight}
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
