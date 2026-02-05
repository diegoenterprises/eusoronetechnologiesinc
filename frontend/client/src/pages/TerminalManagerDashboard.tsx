/**
 * TERMINAL MANAGER DASHBOARD PAGE
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
  Building, Calendar, Truck, Gauge, Fuel,
  Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalManagerDashboard() {
  const statsQuery = (trpc as any).terminals.getDashboardStats.useQuery();
  const appointmentsQuery = (trpc as any).terminals.getTodayAppointments.useQuery({ limit: 5 });
  const racksQuery = (trpc as any).terminals.getRackStatus.useQuery({});
  const inventoryQuery = (trpc as any).terminals.getInventorySummary.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Terminal Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Terminal operations overview</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Calendar className="w-4 h-4 mr-2" />Schedule
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Calendar className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.todayAppointments || 0}</p>}<p className="text-xs text-slate-400">Appointments</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Truck className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.checkedIn || 0}</p>}<p className="text-xs text-slate-400">Checked In</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Gauge className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.loading || 0}</p>}<p className="text-xs text-slate-400">Loading</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Gauge className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.rackUtilization}%</p>}<p className="text-xs text-slate-400">Rack Util</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Fuel className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-blue-400">{stats?.inventoryLevel}%</p>}<p className="text-xs text-slate-400">Inventory</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400" />Rack Status</CardTitle></CardHeader>
          <CardContent>
            {racksQuery.isLoading ? (
              <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {(racksQuery.data as any)?.map((rack: any) => (
                  <div key={rack.id} className={cn("p-3 rounded-lg border text-center", rack.status === "active" ? "bg-green-500/10 border-green-500/30" : rack.status === "idle" ? "bg-yellow-500/10 border-yellow-500/30" : rack.status === "maintenance" ? "bg-orange-500/10 border-orange-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                    <p className="text-white font-bold">{rack.name}</p>
                    <p className={cn("text-xs capitalize", rack.status === "active" ? "text-green-400" : rack.status === "idle" ? "text-yellow-400" : rack.status === "maintenance" ? "text-orange-400" : "text-slate-400")}>{rack.status}</p>
                    {rack.currentLoad && <p className="text-xs text-slate-500 mt-1">#{rack.currentLoad}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-400" />Today's Schedule</CardTitle></CardHeader>
          <CardContent className="p-0">
            {appointmentsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : (appointmentsQuery.data as any)?.length === 0 ? (
              <div className="p-6 text-center"><Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No appointments today</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(appointmentsQuery.data as any)?.map((apt: any) => (
                  <div key={apt.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium text-sm">{apt.time}</p>
                        <Badge className={cn("border-0 text-xs", apt.status === "confirmed" ? "bg-green-500/20 text-green-400" : apt.status === "checked_in" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400")}>{apt.status?.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{apt.carrier} | {apt.product}</p>
                    </div>
                    <p className="text-xs text-slate-400">Rack {apt.rack}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Fuel className="w-5 h-5 text-blue-400" />Tank Inventory</CardTitle></CardHeader>
        <CardContent>
          {inventoryQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(inventoryQuery.data as any)?.tanks?.map((tank: any) => (
                <div key={tank.id} className="p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{tank.name}</p>
                    <Badge className={cn("border-0", tank.level > 75 ? "bg-green-500/20 text-green-400" : tank.level > 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{tank.level}%</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{tank.product}</p>
                  <Progress value={tank.level} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">{tank.currentVolume?.toLocaleString()} / {tank.capacity?.toLocaleString()} gal</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
