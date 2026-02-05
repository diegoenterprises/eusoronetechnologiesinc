/**
 * TERMINAL LOADING SCHEDULE PAGE
 * 100% Dynamic - Manage terminal loading bay schedules
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Truck,
  CheckCircle, AlertTriangle, Plus, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalLoadingSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [rackFilter, setRackFilter] = useState("all");

  const scheduleQuery = (trpc as any).terminals.getAppointments.useQuery({});
  const racksQuery = (trpc as any).terminals.getRacks.useQuery({});
  const statsQuery = (trpc as any).terminals.getSummary.useQuery();

  const schedule = scheduleQuery.data || [];
  const racks = racksQuery.data || [];
  const stats = statsQuery.data as any;

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "in_progress": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "delayed": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Loading Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage bay assignments and schedules</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Appointment
        </Button>
      </div>

      {/* Date Navigation & Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl flex-1">
          <CardContent className="p-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigateDate("prev")} className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-bold text-lg">
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
            <Button variant="ghost" onClick={() => navigateDate("next")} className="text-slate-400">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsQuery.isLoading ? (
            Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <p className="text-slate-400 text-xs">Scheduled</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats?.scheduled || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <p className="text-slate-400 text-xs">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.inProgress || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <p className="text-slate-400 text-xs">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <p className="text-slate-400 text-xs">Utilization</p>
                  <p className="text-2xl font-bold text-purple-400">{stats?.utilization || 0}%</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Rack Filter */}
      <div className="flex items-center gap-4">
        <Select value={rackFilter} onValueChange={setRackFilter}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="All Racks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Racks</SelectItem>
            {racks.map((rack: any) => (
              <SelectItem key={rack.id} value={rack.id}>{rack.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => scheduleQuery.refetch()}
          className="bg-slate-800/50 border-slate-700/50 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", scheduleQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Schedule Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {scheduleQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(8).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="p-3 text-left text-slate-400 text-sm font-medium w-24">Time</th>
                    {(rackFilter === "all" ? racks : racks.filter((r: any) => r.id === rackFilter)).map((rack: any) => (
                      <th key={rack.id} className="p-3 text-center text-slate-400 text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <span>{rack.name}</span>
                          <Badge className={cn(
                            "border-0 text-xs",
                            rack.status === "active" ? "bg-green-500/20 text-green-400" :
                            rack.status === "maintenance" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {rack.status}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.slice(6, 22).map((time: any) => {
                    const slotSchedules = schedule.filter((s: any) => s.startTime?.startsWith(time.split(":")[0]));
                    return (
                      <tr key={time} className="border-b border-slate-700/30 hover:bg-slate-700/10">
                        <td className="p-3 text-slate-500 text-sm">{time}</td>
                        {(rackFilter === "all" ? racks : racks.filter((r: any) => r.id === rackFilter)).map((rack: any) => {
                          const appointment = slotSchedules.find((s: any) => s.rackId === rack.id);
                          return (
                            <td key={rack.id} className="p-2">
                              {appointment ? (
                                <div className={cn(
                                  "p-2 rounded-lg border cursor-pointer transition-all hover:scale-105",
                                  getStatusColor(appointment.status)
                                )}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Truck className="w-3 h-3" />
                                    <span className="text-xs font-medium truncate">{appointment.carrierName}</span>
                                  </div>
                                  <p className="text-xs opacity-80 truncate">{appointment.product}</p>
                                  <p className="text-xs opacity-60">{(appointment as any).volume || appointment.quantity} gal</p>
                                </div>
                              ) : (
                                <div className="h-16 border border-dashed border-slate-700/30 rounded-lg" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {schedule.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No appointments scheduled</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {schedule.map((appt: any) => (
                <div key={appt.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        appt.status === "completed" ? "bg-green-500/20" :
                        appt.status === "in_progress" ? "bg-yellow-500/20" :
                        appt.status === "delayed" ? "bg-red-500/20" : "bg-cyan-500/20"
                      )}>
                        {appt.status === "completed" ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                         appt.status === "delayed" ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                         <Truck className="w-5 h-5 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{appt.carrierName}</p>
                        <p className="text-slate-400 text-sm">{appt.product} • {appt.volume?.toLocaleString()} gal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rack</p>
                        <p className="text-white font-medium">{appt.rackName}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Time</p>
                        <p className="text-white">{appt.startTime} - {appt.endTime}</p>
                      </div>
                      <Badge className={cn("border", getStatusColor(appt.status))}>
                        {appt.status?.replace("_", " ")}
                      </Badge>
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
