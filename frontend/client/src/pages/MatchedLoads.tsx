/**
 * MATCHED LOADS PAGE - CATALYST PROFILE
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
  Target, Search, MapPin, DollarSign, Truck,
  Clock, CheckCircle, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MatchedLoads() {
  const [search, setSearch] = useState("");

  const loadsQuery = (trpc as any).catalysts.getMatchedLoads.useQuery({ search });
  const statsQuery = (trpc as any).catalysts.getMatchStats.useQuery();

  const acceptMutation = (trpc as any).catalysts.acceptLoad.useMutation({
    onSuccess: () => { toast.success("Load accepted"); loadsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getMatchScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-0">{score}% Match</Badge>;
    if (score >= 75) return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{score}% Match</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">{score}% Match</Badge>;
    return <Badge className="bg-slate-500/20 text-slate-400 border-0">{score}% Match</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Matched Loads</h1>
          <p className="text-slate-400 text-sm mt-1">AI-matched opportunities based on your specializations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Target className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.matched || 0}</p>}<p className="text-xs text-slate-400">Matched</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.highMatch || 0}</p>}<p className="text-xs text-slate-400">90%+ Match</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.avgRate}</p>}<p className="text-xs text-slate-400">Avg Rate</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Zap className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.acceptRate}%</p>}<p className="text-xs text-slate-400">Accept Rate</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search loads..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400" />Matched Loads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
          ) : !loadsQuery.data || (Array.isArray(loadsQuery.data) && loadsQuery.data.length === 0) ? (
            <div className="text-center py-16"><Target className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No matched loads found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(loadsQuery.data) ? loadsQuery.data : []).map((load: any) => (
                <div key={load.id} className={cn("p-4", load.matchScore >= 90 && "bg-green-500/5 border-l-2 border-green-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">Load #{load.loadNumber}</p>
                        {getMatchScoreBadge(load.matchScore)}
                        <Badge className="bg-slate-500/20 text-slate-400 border-0">{load.equipmentType}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{load.commodity}</p>
                    </div>
                    <p className="text-green-400 font-bold text-xl">${load.rate?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Origin</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" />{load.origin}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" />{load.destination}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Distance</p>
                      <p className="text-white text-sm flex items-center gap-1"><Truck className="w-3 h-3" />{load.distance} mi</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="text-white text-sm flex items-center gap-1"><Clock className="w-3 h-3" />{load.pickupDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Matched: {load.matchedSpecializations?.join(", ")}</span>
                    </div>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => acceptMutation.mutate({ loadId: load.id })}>
                      <CheckCircle className="w-4 h-4 mr-1" />Accept
                    </Button>
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
