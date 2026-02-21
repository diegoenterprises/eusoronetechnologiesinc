/**
 * ELD INTEGRATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, User, Truck, CheckCircle, AlertTriangle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ELDIntegration() {
  const [filter, setFilter] = useState("all");

  const driversQuery = (trpc as any).eld.getDriverStatus.useQuery({ filter }, { refetchInterval: 60000 });
  const statsQuery = (trpc as any).eld.getStats.useQuery({}, { refetchInterval: 60000 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "driving": return <Badge className="bg-green-500/20 text-green-400 border-0">Driving</Badge>;
      case "on_duty": return <Badge className="bg-blue-500/20 text-blue-400 border-0">On Duty</Badge>;
      case "sleeper": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Sleeper</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Off Duty</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">ELD Integration</h1>
          <p className="text-slate-400 text-sm mt-1">Electronic Logging Device data</p>
        </div>
        <Button variant="outline" className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] rounded-lg" onClick={() => driversQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Sync
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><User className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalDrivers || 0}</p>}<p className="text-xs text-slate-400">Drivers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Truck className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.driving || 0}</p>}<p className="text-xs text-slate-400">Driving</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Clock className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.onDuty || 0}</p>}<p className="text-xs text-slate-400">On Duty</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>}<p className="text-xs text-slate-400">Violations</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><CheckCircle className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.complianceRate}%</p>}<p className="text-xs text-slate-400">Compliance</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="driving">Driving</SelectItem>
          <SelectItem value="on_duty">On Duty</SelectItem>
          <SelectItem value="sleeper">Sleeper</SelectItem>
          <SelectItem value="off_duty">Off Duty</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" />Driver HOS Status</CardTitle></CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : (driversQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><User className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No drivers</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(driversQuery.data as any)?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.violation && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">{driver.name?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getStatusBadge(driver.status)}
                          {driver.violation && <Badge className="bg-red-500 text-white border-0"><AlertTriangle className="w-3 h-3 mr-1" />Violation</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">{driver.truck} | Last update: {driver.lastUpdate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Driving</span><span className="text-xs text-white">{driver.drivingUsed}h / 11h</span></div>
                      <Progress value={(driver.drivingUsed / 11) * 100} className="h-1.5" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">On-Duty</span><span className="text-xs text-white">{driver.onDutyUsed}h / 14h</span></div>
                      <Progress value={(driver.onDutyUsed / 14) * 100} className="h-1.5" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Cycle</span><span className="text-xs text-white">{driver.cycleUsed}h / 70h</span></div>
                      <Progress value={(driver.cycleUsed / 70) * 100} className="h-1.5" />
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
