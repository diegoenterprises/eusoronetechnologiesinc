/**
 * CARRIER LOAD HISTORY PAGE
 * 100% Dynamic - View historical load data and performance
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
  Package, Search, Calendar, DollarSign, MapPin,
  Clock, TrendingUp, Download, ChevronRight, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierLoadHistory() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadsQuery = (trpc as any).carriers.getLoadHistory.useQuery({});
  const statsQuery = (trpc as any).carriers.getDirectoryStats.useQuery();

  const loads = loadsQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredLoads = loads.filter((l: any) =>
    l.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.origin?.toLowerCase().includes(search.toLowerCase()) ||
    l.destination?.toLowerCase().includes(search.toLowerCase()) ||
    l.shipperName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Load History
          </h1>
          <p className="text-slate-400 text-sm mt-1">View completed loads and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalRevenue?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Miles</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalMiles?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">On-Time Rate</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  (stats?.onTimeRate || 0) >= 95 ? "text-green-400" :
                  (stats?.onTimeRate || 0) >= 90 ? "text-yellow-400" : "text-red-400"
                )}>
                  {stats?.onTimeRate || 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Avg Rate/Mile</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">${stats?.avgRatePerMile?.toFixed(2) || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads.map((load: any) => (
                <div key={load.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        load.status === "delivered" ? "bg-green-500/20" :
                        load.status === "cancelled" ? "bg-red-500/20" :
                        "bg-yellow-500/20"
                      )}>
                        <Package className={cn(
                          "w-6 h-6",
                          load.status === "delivered" ? "text-green-400" :
                          load.status === "cancelled" ? "text-red-400" :
                          "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{load.loadNumber}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            load.status === "delivered" ? "bg-green-500/20 text-green-400" :
                            load.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {load.status}
                          </Badge>
                          {load.hazmat && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">HAZMAT</Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {load.origin} → {load.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Shipper</p>
                        <p className="text-white font-medium">{load.shipperName}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Miles</p>
                        <p className="text-white">{load.distance?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Date</p>
                        <p className="text-white">{load.deliveryDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Revenue</p>
                        <p className="text-green-400 font-bold">${load.revenue?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-white">{load.rating || "-"}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {load.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-700/30 text-sm text-slate-400">
                      {load.notes}
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
