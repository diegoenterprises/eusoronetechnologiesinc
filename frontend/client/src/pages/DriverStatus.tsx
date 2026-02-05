/**
 * DRIVER STATUS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Clock, Truck, Search, CheckCircle,
  AlertTriangle, Coffee, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverStatus() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const driversQuery = (trpc as any).dispatch.getDriverStatuses.useQuery({ filter, search }, { refetchInterval: 30000 });
  const statsQuery = (trpc as any).dispatch.getDriverStatusStats.useQuery();

  const stats = statsQuery.data;

  const getDutyBadge = (status: string) => {
    switch (status) {
      case "driving": return <Badge className="bg-green-500/20 text-green-400 border-0"><Navigation className="w-3 h-3 mr-1" />Driving</Badge>;
      case "on_duty": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />On Duty</Badge>;
      case "sleeper": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><Coffee className="w-3 h-3 mr-1" />Sleeper</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Off Duty</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Driver Status</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time driver HOS and availability</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Navigation className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.driving || 0}</p>}<p className="text-xs text-slate-400">Driving</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><CheckCircle className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.onDuty || 0}</p>}<p className="text-xs text-slate-400">On Duty</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Coffee className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.sleeper || 0}</p>}<p className="text-xs text-slate-400">Sleeper</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><User className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.available || 0}</p>}<p className="text-xs text-slate-400">Available</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="driving">Driving</SelectItem>
            <SelectItem value="on_duty">On Duty</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Driver List</CardTitle></CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (driversQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><User className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No drivers found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(driversQuery.data as any)?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.hosWarning && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">{driver.name?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getDutyBadge(driver.dutyStatus)}
                          {driver.hosWarning && <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />HOS Warning</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{driver.truck || "Unassigned"}</span>
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    </div>
                    {driver.currentLoad && <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Load #{driver.currentLoad}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">Driving</p>
                      <div className="flex items-center justify-between"><span className="text-white font-medium text-sm">{driver.drivingHours}h</span><span className="text-xs text-slate-500">/ 11h</span></div>
                      <Progress value={(driver.drivingHours / 11) * 100} className="h-1 mt-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">On-Duty</p>
                      <div className="flex items-center justify-between"><span className="text-white font-medium text-sm">{driver.onDutyHours}h</span><span className="text-xs text-slate-500">/ 14h</span></div>
                      <Progress value={(driver.onDutyHours / 14) * 100} className="h-1 mt-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">70hr Cycle</p>
                      <div className="flex items-center justify-between"><span className="text-white font-medium text-sm">{driver.cycleHours}h</span><span className="text-xs text-slate-500">/ 70h</span></div>
                      <Progress value={(driver.cycleHours / 70) * 100} className="h-1 mt-1" />
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
