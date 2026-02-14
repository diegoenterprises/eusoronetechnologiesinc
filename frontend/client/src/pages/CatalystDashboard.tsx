/**
 * CATALYST DASHBOARD PAGE
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
  Truck, Package, DollarSign, Users, Shield,
  Clock, CheckCircle, AlertTriangle, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystDashboard() {
  const statsQuery = (trpc as any).catalysts.getDashboardStats.useQuery();
  const driversQuery = (trpc as any).catalysts.getMyDrivers.useQuery({ limit: 5 });
  const activeLoadsQuery = (trpc as any).catalysts.getActiveLoads.useQuery({ limit: 5 });
  const alertsQuery = (trpc as any).catalysts.getAlerts.useQuery();

  const stats = statsQuery.data;

  const getHOSBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>;
      case "driving": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Driving</Badge>;
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Catalyst Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet and operations overview</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Search className="w-4 h-4 mr-2" />Find Loads
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Package className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeLoads || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Truck className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.availableCapacity || 0}</p>}<p className="text-xs text-slate-400">Available</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.weeklyRevenue?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Weekly</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Truck className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.fleetUtilization}%</p>}<p className="text-xs text-slate-400">Utilization</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><Shield className="w-6 h-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{stats?.safetyScore}</p>}<p className="text-xs text-slate-400">Safety</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {((alertsQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" />Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(alertsQuery.data as any)?.map((alert: any) => (
              <div key={alert.id} className={cn("p-3 rounded-lg flex items-center gap-3", alert.severity === "critical" ? "bg-red-500/10" : "bg-yellow-500/10")}>
                <AlertTriangle className={cn("w-5 h-5", alert.severity === "critical" ? "text-red-400" : "text-yellow-400")} />
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" />My Drivers</CardTitle></CardHeader>
          <CardContent className="p-0">
            {driversQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (driversQuery.data as any)?.length === 0 ? (
              <div className="p-8 text-center"><Users className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No drivers</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(driversQuery.data as any)?.map((driver: any) => (
                  <div key={driver.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm">{driver.name?.charAt(0)}</div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.truck}</p>
                        </div>
                      </div>
                      {getHOSBadge(driver.hosStatus)}
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
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-green-400" />Active Loads</CardTitle></CardHeader>
          <CardContent className="p-0">
            {activeLoadsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (activeLoadsQuery.data as any)?.length === 0 ? (
              <div className="p-8 text-center"><Package className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No active loads</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(activeLoadsQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">#{load.loadNumber}</p>
                        <Badge className={cn("border-0", load.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400")}>{load.status?.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{load.origin} → {load.destination}</p>
                      <p className="text-xs text-slate-500">Driver: {load.driver}</p>
                    </div>
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-medium">${load.rate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">ETA: {load.eta}</p>
                    </div>
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
