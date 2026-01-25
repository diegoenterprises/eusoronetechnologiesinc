/**
 * CATALYST (DISPATCHER) DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Package, AlertTriangle, Clock, MapPin,
  Navigation, User, CheckCircle, Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystDashboard() {
  const statsQuery = trpc.dispatch.getDashboardStats.useQuery();
  const driversQuery = trpc.dispatch.getDriverStatuses.useQuery({ limit: 6 });
  const issuesQuery = trpc.dispatch.getActiveIssues.useQuery();
  const unassignedQuery = trpc.dispatch.getUnassignedLoads.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "driving": return <Badge className="bg-green-500/20 text-green-400 border-0"><Navigation className="w-3 h-3 mr-1" />Driving</Badge>;
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Dispatch Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet operations center</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-500/20"><Package className="w-5 h-5 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-cyan-400">{stats?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20"><Clock className="w-5 h-5 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-yellow-400">{stats?.unassigned || 0}</p>}<p className="text-xs text-slate-400">Unassigned</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20"><Truck className="w-5 h-5 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-blue-400">{stats?.enRoute || 0}</p>}<p className="text-xs text-slate-400">En Route</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20"><MapPin className="w-5 h-5 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-purple-400">{stats?.loading || 0}</p>}<p className="text-xs text-slate-400">Loading</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20"><Navigation className="w-5 h-5 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-green-400">{stats?.inTransit || 0}</p>}<p className="text-xs text-slate-400">In Transit</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/20"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold text-red-400">{stats?.issues || 0}</p>}<p className="text-xs text-slate-400">Issues</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {issuesQuery.data?.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Active Issues</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {issuesQuery.data?.map((issue: any) => (
              <div key={issue.id} className={cn("p-3 rounded-lg flex items-center justify-between", issue.type === "breakdown" ? "bg-red-500/10" : "bg-yellow-500/10")}>
                <div className="flex items-center gap-3">
                  {issue.type === "breakdown" ? <Wrench className="w-5 h-5 text-red-400" /> : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <p className="text-white font-medium">{issue.description}</p>
                    <p className="text-xs text-slate-500">Load #{issue.loadNumber} | {issue.driver}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">Resolve</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Driver Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            {driversQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {driversQuery.data?.map((driver: any) => (
                  <div key={driver.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm">{driver.name?.charAt(0)}</div>
                        <div>
                          <p className="text-white font-medium text-sm">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.truck}</p>
                        </div>
                      </div>
                      {getStatusBadge(driver.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(driver.drivingHours / 11) * 100} className="h-1 flex-1" />
                      <span className="text-xs text-slate-500">{driver.drivingHours}/11h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-yellow-400" />Unassigned Loads</CardTitle></CardHeader>
          <CardContent className="p-0">
            {unassignedQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : unassignedQuery.data?.length === 0 ? (
              <div className="p-6 text-center"><CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">All loads assigned</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {unassignedQuery.data?.map((load: any) => (
                  <div key={load.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">#{load.loadNumber}</p>
                      <p className="text-xs text-slate-500">{load.origin} → {load.destination}</p>
                      <p className="text-xs text-slate-500">Pickup: {load.pickupTime}</p>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">Assign</Button>
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
