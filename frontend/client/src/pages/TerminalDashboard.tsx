/**
 * TERMINAL DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Fuel, Truck, Calendar, Clock, AlertTriangle,
  CheckCircle, Eye, Activity, Beaker, Target
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = (trpc as any).terminals.getSummary.useQuery();
  const racksQuery = (trpc as any).terminals.getRacks.useQuery();
  const tanksQuery = (trpc as any).terminals.getTanks.useQuery();
  const appointmentsQuery = (trpc as any).terminals.getTodayAppointments.useQuery();
  const alertsQuery = (trpc as any).terminals.getAlerts.useQuery();

  const summary = summaryQuery.data;

  const getRackStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "loading": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "offline": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getTankLevelColor = (level: number) => {
    if (level >= 70) return "from-green-500 to-green-400";
    if (level >= 30) return "from-yellow-500 to-yellow-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Terminal Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">SCADA monitoring and operations</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPECTRA-MATCH Quick Access */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/30">
                <Beaker className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  SPECTRA-MATCH™
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                    <EsangIcon className="w-3 h-3 mr-1" />AI
                  </Badge>
                </p>
                <p className="text-sm text-slate-400">Crude/fuel product identification system</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              onClick={() => window.location.href = '/terminal/scada'}
            >
              <Target className="w-4 h-4 mr-2" />
              Open Oil ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.todayAppointments || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today's Appts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.checkedIn || 0}</p>
                )}
                <p className="text-xs text-slate-400">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Fuel className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.loading || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loading</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.rackUtilization || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-400">{(summary?.totalInventory || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total BBL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="racks" className="data-[state=active]:bg-slate-700 rounded-md">Racks</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700 rounded-md">Inventory</TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-slate-700 rounded-md">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rack Status */}
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Rack Status</CardTitle></CardHeader>
              <CardContent>
                {racksQuery.isLoading ? (
                  <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(racksQuery.data as any)?.slice(0, 4).map((rack: any) => (
                      <div key={rack.id} className={cn("p-4 rounded-xl border", getRackStatusColor(rack.status))}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">Rack {rack.number}</span>
                          <Badge className={cn("border-0", getRackStatusColor(rack.status))}>{rack.status}</Badge>
                        </div>
                        {rack.currentTruck && <p className="text-xs text-slate-400">{rack.currentTruck}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tank Levels */}
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Tank Levels</CardTitle></CardHeader>
              <CardContent>
                {tanksQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {(tanksQuery.data as any)?.slice(0, 4).map((tank: any) => (
                      <div key={tank.id} className="p-3 rounded-xl bg-slate-700/30">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Tank {tank.number} - {tank.product}</span>
                          <span className="text-white font-medium">{tank.level}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full bg-gradient-to-r transition-all", getTankLevelColor(tank.level))} style={{ width: `${tank.level}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="racks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racksQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              (racksQuery.data as any)?.map((rack: any) => (
                <Card key={rack.id} className={cn("border rounded-xl", getRackStatusColor(rack.status))}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">Rack {rack.number}</p>
                      <Badge className={cn("border-0", getRackStatusColor(rack.status))}>{rack.status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Product</span>
                        <span className="text-white">{rack.product || "N/A"}</span>
                      </div>
                      {rack.currentTruck && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Truck</span>
                          <span className="text-white">{rack.currentTruck}</span>
                        </div>
                      )}
                      {rack.eta && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">ETA</span>
                          <span className="text-white">{rack.eta}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanksQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              (tanksQuery.data as any)?.map((tank: any) => (
                <Card key={tank.id} className="bg-slate-700/30 border-slate-600/30 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">Tank {tank.number}</p>
                      <Badge className="bg-slate-500/20 text-slate-400 border-0">{tank.product}</Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Level</span>
                        <span className="text-white font-medium">{tank.level}%</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-gradient-to-r transition-all", getTankLevelColor(tank.level))} style={{ width: `${tank.level}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Current</span>
                        <p className="text-white">{tank.currentVolume?.toLocaleString()} bbl</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Capacity</span>
                        <p className="text-white">{tank.capacity?.toLocaleString()} bbl</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Today's Appointments</CardTitle></CardHeader>
            <CardContent>
              {appointmentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (appointmentsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-white/[0.04] w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(appointmentsQuery.data as any)?.map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="text-center p-3 rounded-xl bg-white/[0.04] min-w-[60px]">
                          <p className="text-white font-bold">{appt.time}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{appt.catalystName}</p>
                          <p className="text-sm text-slate-400">{appt.truckNumber} - {appt.driverName}</p>
                          <p className="text-xs text-slate-500">{appt.product} | {(appt as any).weight || appt.quantity} gal | Rack {appt.rackNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={appt.status === "completed" ? "bg-green-500/20 text-green-400 border-0" : (appt as any).status === "loading" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
                          {appt.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
