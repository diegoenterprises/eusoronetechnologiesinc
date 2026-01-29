/**
 * ACTIVE CONVOYS PAGE - ESCORT PROFILE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Car, Search, MapPin, Clock, CheckCircle,
  Truck, Users, Phone, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActiveConvoys() {
  const [search, setSearch] = useState("");

  const convoysQuery = trpc.escorts.getActiveConvoys.useQuery({ search });
  const statsQuery = trpc.escorts.getConvoyStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Navigation className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "staging": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Staging</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "lead": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Lead</Badge>;
      case "chase": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Chase</Badge>;
      case "side": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Side</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{position}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Active Convoys</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor your active escort assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Car className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeConvoys || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.scheduledToday || 0}</p>}<p className="text-xs text-slate-400">Staging</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completedToday || 0}</p>}<p className="text-xs text-slate-400">Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Truck className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.escortsDeployed || 0}</p>}<p className="text-xs text-slate-400">Escorts</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search convoys..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Car className="w-5 h-5 text-cyan-400" />Convoys</CardTitle></CardHeader>
        <CardContent className="p-0">
          {convoysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}</div>
          ) : !convoysQuery.data || (Array.isArray(convoysQuery.data) && convoysQuery.data.length === 0) ? (
            <div className="text-center py-16"><Car className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No active convoys</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(convoysQuery.data) ? convoysQuery.data : []).map((convoy: any) => (
                <div key={convoy.id} className={cn("p-4", convoy.status === "in_progress" && "bg-cyan-500/5 border-l-2 border-cyan-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">Convoy #{convoy.convoyNumber}</p>
                        {getStatusBadge(convoy.status)}
                        {getPositionBadge(convoy.myPosition)}
                      </div>
                      <p className="text-sm text-slate-400">{convoy.loadDescription}</p>
                    </div>
                    <p className="text-green-400 font-bold text-lg">${convoy.pay?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Origin</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" />{convoy.origin}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" />{convoy.destination}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Load Dimensions</p>
                      <p className="text-white text-sm">{convoy.dimensions}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Driver</p>
                      <p className="text-white text-sm">{convoy.driverName}</p>
                    </div>
                  </div>

                  {convoy.status === "in_progress" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Progress</span>
                        <span className="text-xs text-cyan-400">{convoy.progress}%</span>
                      </div>
                      <Progress value={convoy.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{convoy.escortCount} escorts</span>
                      <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{convoy.miles} miles</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />ETA: {convoy.eta}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <Phone className="w-4 h-4 mr-1" />Contact
                      </Button>
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                        <Navigation className="w-4 h-4 mr-1" />Navigate
                      </Button>
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
