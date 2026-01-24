/**
 * TERMINAL SCHEDULING PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Truck, Fuel, AlertTriangle,
  CheckCircle, Plus, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalScheduling() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const racksQuery = trpc.terminal.getRacks.useQuery();
  const tanksQuery = trpc.terminal.getTanks.useQuery();
  const appointmentsQuery = trpc.terminal.getAppointments.useQuery({ date: selectedDate });
  const summaryQuery = trpc.terminal.getSummary.useQuery();

  const createAppointmentMutation = trpc.terminal.createAppointment.useMutation({
    onSuccess: () => { toast.success("Appointment created"); appointmentsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getRackStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "loading": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "offline": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getTankLevelColor = (level: number) => {
    if (level >= 70) return "bg-green-500";
    if (level >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Terminal Scheduling</h1>
          <p className="text-slate-400 text-sm">Manage rack appointments and inventory</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.todayAppointments || 0}</p>
            )}
            <p className="text-xs text-slate-400">Today's Appts</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.checkedIn || 0}</p>
            )}
            <p className="text-xs text-slate-400">Checked In</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.loading || 0}</p>
            )}
            <p className="text-xs text-slate-400">Loading</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.rackUtilization || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Rack Utilization</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{(summary?.totalInventory || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Total BBL</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-600">Schedule</TabsTrigger>
          <TabsTrigger value="racks" className="data-[state=active]:bg-blue-600">Racks</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-blue-600">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Appointments</CardTitle>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded px-3 py-1 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {appointmentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : appointmentsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No appointments for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentsQuery.data?.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="text-center p-2 rounded-lg bg-slate-700">
                          <p className="text-white font-bold">{appt.time}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{appt.carrierName}</p>
                          <p className="text-sm text-slate-400">{appt.truckNumber} - {appt.driverName}</p>
                          <p className="text-xs text-slate-500">{appt.product} | {appt.quantity} gal | Rack {appt.rackNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={appt.status === "completed" ? "bg-green-500/20 text-green-400" : appt.status === "loading" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {appt.status}
                        </Badge>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : (
              racksQuery.data?.map((rack) => (
                <Card key={rack.id} className={cn("border", getRackStatusColor(rack.status))}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">Rack {rack.number}</p>
                      <Badge className={getRackStatusColor(rack.status)}>{rack.status}</Badge>
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Tank Inventory</CardTitle></CardHeader>
            <CardContent>
              {tanksQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tanksQuery.data?.map((tank) => (
                    <Card key={tank.id} className="bg-slate-700/30 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white font-bold">Tank {tank.number}</p>
                          <Badge className="bg-slate-500/20 text-slate-400">{tank.product}</Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Level</span>
                            <span className="text-white">{tank.level}%</span>
                          </div>
                          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all", getTankLevelColor(tank.level))} style={{ width: `${tank.level}%` }} />
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
