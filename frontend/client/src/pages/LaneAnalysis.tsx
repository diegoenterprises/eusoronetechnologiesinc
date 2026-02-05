/**
 * LANE ANALYSIS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, TrendingUp, DollarSign, Package, Search,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LaneAnalysis() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const lanesQuery = (trpc as any).rates.getLaneAnalysis.useQuery({ origin, destination });
  const statsQuery = (trpc as any).rates.getLaneStats.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Lane Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">Analyze shipping lanes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><MapPin className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalLanes || 0}</p>}<p className="text-xs text-slate-400">Total Lanes</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.avgRate}</p>}<p className="text-xs text-slate-400">Avg Rate/Mi</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Package className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.loadsThisMonth || 0}</p>}<p className="text-xs text-slate-400">Loads/Month</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><TrendingUp className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.topLaneVolume}</p>}<p className="text-xs text-slate-400">Top Lane</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
          <Input value={origin} onChange={(e: any) => setOrigin(e.target.value)} placeholder="Origin city/state..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <ArrowRight className="w-5 h-5 text-slate-500" />
        <div className="relative flex-1 max-w-xs">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          <Input value={destination} onChange={(e: any) => setDestination(e.target.value)} placeholder="Destination city/state..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Lane Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          {lanesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (lanesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No lanes found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(lanesQuery.data as any)?.map((lane: any) => (
                <div key={lane.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/20"><MapPin className="w-4 h-4 text-green-400" /></div>
                      <span className="text-white font-bold">{lane.origin}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <div className="p-2 rounded-lg bg-red-500/20"><MapPin className="w-4 h-4 text-red-400" /></div>
                      <span className="text-white font-bold">{lane.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Miles</p>
                      <p className="text-white font-bold">{lane.distance}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Loads</p>
                      <p className="text-cyan-400 font-bold">{lane.loadCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Avg Rate</p>
                      <p className="text-green-400 font-bold">${lane.avgRate}/mi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Trend</p>
                      <Badge className={cn("border-0", lane.trend === "up" ? "bg-green-500/20 text-green-400" : lane.trend === "down" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>
                        <TrendingUp className={cn("w-3 h-3 mr-1", lane.trend === "down" && "rotate-180")} />{lane.trendPercent}%
                      </Badge>
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
