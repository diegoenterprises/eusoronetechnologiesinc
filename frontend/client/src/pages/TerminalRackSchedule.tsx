/**
 * TERMINAL RACK SCHEDULE PAGE
 * 100% Dynamic - View and manage loading rack appointments
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Truck, Droplet, CheckCircle,
  AlertTriangle, ChevronLeft, ChevronRight, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalRackSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [rackFilter, setRackFilter] = useState("all");

  const scheduleQuery = trpc.terminal.getRackSchedule.useQuery({ date: selectedDate, rack: rackFilter });
  const racksQuery = trpc.terminal.getRacks.useQuery();
  const statsQuery = trpc.terminal.getScheduleStats.useQuery({ date: selectedDate });

  const confirmSlotMutation = trpc.terminal.confirmAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment confirmed");
      scheduleQuery.refetch();
      statsQuery.refetch();
    },
  });

  const schedule = scheduleQuery.data || [];
  const racks = racksQuery.data || [];
  const stats = statsQuery.data;

  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  const navigateDate = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const getSlotStatus = (slot: any) => {
    if (!slot) return { color: "bg-slate-700/30", text: "Available" };
    switch (slot.status) {
      case "confirmed": return { color: "bg-green-500/30 border-green-500/50", text: "Confirmed" };
      case "pending": return { color: "bg-yellow-500/30 border-yellow-500/50", text: "Pending" };
      case "loading": return { color: "bg-cyan-500/30 border-cyan-500/50", text: "Loading" };
      case "completed": return { color: "bg-slate-600/30", text: "Completed" };
      default: return { color: "bg-slate-700/30", text: "Available" };
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Rack Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Loading rack appointment schedule</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Slots</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalSlots || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Confirmed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.confirmed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Volume (gal)</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalVolume?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Date Navigation & Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)} className="text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-medium text-lg">
                  {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigateDate(1)} className="text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Select value={rackFilter} onValueChange={setRackFilter}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="All Racks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Racks</SelectItem>
                  {racks.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {scheduleQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="p-3 text-left text-slate-400 text-sm font-medium w-20">Time</th>
                    {(rackFilter === "all" ? racks : racks.filter((r: any) => r.id === rackFilter)).map((rack: any) => (
                      <th key={rack.id} className="p-3 text-center text-slate-400 text-sm font-medium min-w-[160px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            rack.status === "online" ? "bg-green-400" :
                            rack.status === "maintenance" ? "bg-yellow-400" : "bg-red-400"
                          )} />
                          {rack.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="p-3 text-slate-400 text-sm font-medium">{time}</td>
                      {(rackFilter === "all" ? racks : racks.filter((r: any) => r.id === rackFilter)).map((rack: any) => {
                        const slot = schedule.find((s: any) => s.rackId === rack.id && s.time === time);
                        const status = getSlotStatus(slot);
                        return (
                          <td key={rack.id} className="p-2">
                            {slot ? (
                              <div className={cn(
                                "p-3 rounded-lg border transition-colors cursor-pointer",
                                status.color
                              )}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-medium text-sm">{slot.carrierName}</span>
                                  <Badge className={cn(
                                    "border-0 text-xs",
                                    slot.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                                    slot.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                    slot.status === "loading" ? "bg-cyan-500/20 text-cyan-400" :
                                    "bg-slate-500/20 text-slate-400"
                                  )}>
                                    {status.text}
                                  </Badge>
                                </div>
                                <p className="text-slate-400 text-xs">{slot.product} • {slot.volume?.toLocaleString()} gal</p>
                                <p className="text-slate-500 text-xs">Truck #{slot.truckNumber}</p>
                                {slot.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => confirmSlotMutation.mutate({ appointmentId: slot.id })}
                                    className="mt-2 w-full bg-green-600 hover:bg-green-700 text-xs h-7 rounded"
                                  >
                                    Confirm
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-slate-700/20 border border-dashed border-slate-600/50 text-center">
                                <span className="text-slate-500 text-xs">Available</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
