/**
 * APPOINTMENT SCHEDULER PAGE
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
  Calendar, Clock, Truck, MapPin, User, Plus,
  CheckCircle, AlertTriangle, Search, ChevronLeft, ChevronRight,
  Edit, RefreshCw, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AppointmentScheduler() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRack, setSelectedRack] = useState("all");

  const summaryQuery = (trpc as any).appointments.getSummary.useQuery({ date: selectedDate });
  const appointmentsQuery = (trpc as any).appointments.list.useQuery({
    date: selectedDate,
    rackId: selectedRack !== "all" ? selectedRack : undefined,
  });
  const racksQuery = (trpc as any).terminals.getRacks.useQuery({});

  const checkInMutation = (trpc as any).appointments.checkIn.useMutation({
    onSuccess: () => { toast.success("Driver checked in"); appointmentsQuery.refetch(); },
    onError: (error: any) => toast.error("Check-in failed", { description: error.message }),
  });

  const startLoadingMutation = (trpc as any).appointments.startLoading.useMutation({
    onSuccess: () => { toast.success("Loading started"); appointmentsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to start loading", { description: error.message }),
  });

  const completeMutation = (trpc as any).appointments.complete.useMutation({
    onSuccess: () => { toast.success("Appointment completed"); appointmentsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to complete", { description: error.message }),
  });

  if (summaryQuery.error || appointmentsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading appointments</p>
        <Button className="mt-4" onClick={() => { summaryQuery.refetch(); appointmentsQuery.refetch(); }}>Retry</Button>
      </div>
    );
  }

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "loading": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "checked_in": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "scheduled": return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "loading": return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "checked_in": return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Calendar className="w-4 h-4 text-slate-400" />;
    }
  };

  const timeSlots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  }

  const getAppointmentsForSlot = (time: string) => {
    return ((appointmentsQuery.data as any)?.appointments || []).filter((apt: any) => {
      const aptTime = new Date(apt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      return aptTime === time;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Appointment Scheduler</h1>
          <p className="text-slate-400 text-sm">Terminal loading appointments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-white">{(summaryQuery.data as any)?.todayTotal ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Today's Total</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-green-400">{(summaryQuery.data as any)?.completed ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-blue-400">{(summaryQuery.data as any)?.inProgress ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-yellow-400">{(summaryQuery.data as any)?.upcoming ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-red-400">{(summaryQuery.data as any)?.cancelled ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Date & Rack Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-white font-medium">
              {new Date(selectedDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateDate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}>
            Today
          </Button>
        </div>
        <Select value={selectedRack} onValueChange={setSelectedRack}>
          <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
            <SelectValue placeholder="All Racks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Racks</SelectItem>
            {(racksQuery.data as any)?.map((rack: any) => (
              <SelectItem key={rack.id} value={rack.id}>{rack.name} - {rack.product}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600">List View</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600">Timeline</TabsTrigger>
          <TabsTrigger value="rack" className="data-[state=active]:bg-blue-600">By Rack</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {appointmentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : (appointmentsQuery.data as any)?.appointments?.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No appointments scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {(appointmentsQuery.data as any)?.appointments?.map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          apt.status === "completed" ? "bg-green-500/20" :
                          apt.status === "loading" ? "bg-blue-500/20" :
                          apt.status === "checked_in" ? "bg-yellow-500/20" : "bg-slate-700"
                        )}>
                          {getStatusIcon(apt.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{apt.catalystName}</p>
                            <Badge className={getStatusColor(apt.status)}>{apt.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            {apt.loadNumber} - {apt.product} ({(apt as any).weight?.toLocaleString() || 0} gal)
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{apt.rackName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />{apt.truckNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />{apt.driverName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400"
                            onClick={() => checkInMutation.mutate({ appointmentId: apt.id })}
                            disabled={checkInMutation.isPending}>
                            {checkInMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check In"}
                          </Button>
                        )}
                        {apt.status === "checked_in" && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => startLoadingMutation.mutate({ appointmentId: apt.id })}
                            disabled={startLoadingMutation.isPending}>
                            {startLoadingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Loading"}
                          </Button>
                        )}
                        {apt.status === "loading" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700"
                            onClick={() => completeMutation.mutate({ appointmentId: apt.id })}
                            disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete"}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              {appointmentsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-2">
                  {timeSlots.map((time: any) => {
                    const slotAppointments = getAppointmentsForSlot(time);
                    return (
                      <div key={time} className="flex gap-4">
                        <div className="w-16 text-right">
                          <span className="text-sm text-slate-500">{time}</span>
                        </div>
                        <div className="flex-1 min-h-16 border-l-2 border-slate-700 pl-4">
                          {slotAppointments.length === 0 ? (
                            <div className="h-16 flex items-center">
                              <span className="text-xs text-slate-600">Available</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 py-2">
                              {slotAppointments.map((apt: any) => (
                                <div key={apt.id} className={cn("p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity", getStatusColor(apt.status))}>
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-xs">{apt.rackName}</Badge>
                                    {getStatusIcon(apt.status)}
                                  </div>
                                  <p className="text-white font-medium text-sm">{apt.catalystName}</p>
                                  <p className="text-xs text-slate-400">{apt.loadNumber}</p>
                                  <p className="text-xs text-slate-500 mt-1">{apt.product} - {apt.weight?.toLocaleString()} gal</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Rack Tab */}
        <TabsContent value="rack" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racksQuery.isLoading ? (
              [1, 2, 3, 4].map((i: any) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
              ))
            ) : (
              (racksQuery.data as any)?.map((rack: any) => {
                const rackAppointments = ((appointmentsQuery.data as any)?.appointments || []).filter((apt: any) => apt.rackId === rack.id);
                const currentApt = rackAppointments.find((apt: any) => apt.status === "loading");
                const nextApt = rackAppointments.find((apt: any) => apt.status === "checked_in" || apt.status === "scheduled");

                return (
                  <Card key={rack.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>{rack.name}</span>
                        <Badge className="bg-slate-600">{rack.product}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentApt ? (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                            <span className="text-blue-400 text-sm font-medium">Loading Now</span>
                          </div>
                          <p className="text-white font-medium">{currentApt.catalystName}</p>
                          <p className="text-xs text-slate-400">{currentApt.loadNumber}</p>
                          <p className="text-xs text-slate-500">{(currentApt as any).weight?.toLocaleString() || 0} gal</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Available</span>
                          </div>
                        </div>
                      )}

                      {nextApt && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Next Up:</p>
                          <div className="p-2 rounded bg-slate-700/50">
                            <p className="text-white text-sm">{nextApt.catalystName}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(nextApt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 mt-3">{rackAppointments.length} appointments today</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
