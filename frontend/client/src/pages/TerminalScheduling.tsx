/**
 * TERMINAL SCHEDULING PAGE
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
  Calendar, Clock, Truck, Fuel, AlertTriangle,
  CheckCircle, Plus, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalScheduling() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const racksQuery = trpc.terminals.getRacks.useQuery();
  const tanksQuery = trpc.terminals.getTanks.useQuery();
  const appointmentsQuery = trpc.terminals.getAppointments.useQuery({ date: selectedDate });
  const summaryQuery = trpc.terminals.getSummary.useQuery();

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Terminal Scheduling
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage rack appointments and inventory</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Fuel className="w-6 h-6 text-purple-400" />
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-slate-700 rounded-md">Schedule</TabsTrigger>
          <TabsTrigger value="racks" className="data-[state=active]:bg-slate-700 rounded-md">Racks</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700 rounded-md">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Appointments</CardTitle>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm" 
                />
              </div>
            </CardHeader>
            <CardContent>
              {appointmentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : appointmentsQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No appointments for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentsQuery.data?.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="text-center p-3 rounded-xl bg-slate-700/50 min-w-[60px]">
                          <p className="text-white font-bold">{appt.time}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{appt.carrierName}</p>
                          <p className="text-sm text-slate-400">{appt.truckNumber} - {appt.driverName}</p>
                          <p className="text-xs text-slate-500">{appt.product} | {appt.quantity} gal | Rack {appt.rackNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={appt.status === "completed" ? "bg-green-500/20 text-green-400 border-0" : appt.status === "loading" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
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

        <TabsContent value="racks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racksQuery.isLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              racksQuery.data?.map((rack) => (
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
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Tank Inventory</CardTitle></CardHeader>
            <CardContent>
              {tanksQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tanksQuery.data?.map((tank) => (
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
