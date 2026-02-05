/**
 * TERMINAL APPOINTMENT SCHEDULE PAGE
 * 100% Dynamic - Manage loading/unloading appointments
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Truck, CheckCircle, XCircle,
  AlertTriangle, Plus, ChevronLeft, ChevronRight, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function TerminalAppointmentSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRack, setSelectedRack] = useState("all");

  const appointmentsQuery = trpc.terminals.getAppointments.useQuery({ date: selectedDate } as any);
  const racksQuery = trpc.terminals.getRacks.useQuery();
  const statsQuery = trpc.terminals.getAppointmentStats.useQuery({ date: selectedDate });

  const cancelMutation = trpc.terminals.cancelAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment cancelled");
      appointmentsQuery.refetch();
    },
  });

  const appointments = appointmentsQuery.data || [];
  const racks = racksQuery.data || [];
  const stats = statsQuery.data;

  const getAppointmentForSlot = (rack: string, time: string) => {
    return appointments.find((a: any) => a.rackId === rack && a.time === time);
  };

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Appointment Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage loading appointments</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.scheduled || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Cancelled</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.cancelled || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Date Navigation */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-0 text-white font-bold text-lg text-center cursor-pointer"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <Select value={selectedRack} onValueChange={setSelectedRack}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Racks</SelectItem>
                {racks.map((rack: any) => (
                  <SelectItem key={rack.id} value={rack.id}>{rack.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {appointmentsQuery.isLoading ? (
            <div className="p-4"><Skeleton className="h-96 w-full" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="p-3 text-left text-slate-400 text-sm font-medium sticky left-0 bg-slate-800/50">Time</th>
                    {(selectedRack === "all" ? racks : racks.filter((r: any) => r.id === selectedRack)).map((rack: any) => (
                      <th key={rack.id} className="p-3 text-center text-slate-400 text-sm font-medium min-w-[150px]">
                        {rack.name}
                        <Badge className={cn(
                          "ml-2 border-0 text-xs",
                          rack.status === "available" ? "bg-green-500/20 text-green-400" :
                          rack.status === "occupied" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {rack.status}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="p-3 text-white font-medium sticky left-0 bg-slate-800/50">{time}</td>
                      {(selectedRack === "all" ? racks : racks.filter((r: any) => r.id === selectedRack)).map((rack: any) => {
                        const apt = getAppointmentForSlot(rack.id, time);
                        return (
                          <td key={rack.id} className="p-2">
                            {apt ? (
                              <div className={cn(
                                "p-2 rounded-lg text-sm cursor-pointer transition-all hover:ring-2 ring-white/20",
                                apt.status === "completed" ? "bg-green-500/20" :
                                apt.status === "in_progress" ? "bg-yellow-500/20" :
                                apt.status === "cancelled" ? "bg-red-500/20 opacity-50" :
                                "bg-cyan-500/20"
                              )}>
                                <div className="flex items-center gap-1 mb-1">
                                  <Truck className="w-3 h-3" />
                                  <span className="text-white font-medium truncate">{apt.carrier}</span>
                                </div>
                                <p className="text-slate-400 text-xs truncate">{apt.product}</p>
                                <p className="text-slate-500 text-xs">{apt.driverName}</p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg border border-dashed border-slate-600/50 text-center text-slate-500 text-xs hover:border-cyan-500/50 cursor-pointer">
                                Available
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

      {/* Today's Appointments List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Today's Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No appointments scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-cyan-400 font-bold">{apt.time}</p>
                    </div>
                    <div>
                      <p className="text-white font-medium">{apt.carrier}</p>
                      <p className="text-slate-400 text-sm">{apt.product} • {apt.rackName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "border-0",
                      apt.status === "scheduled" ? "bg-cyan-500/20 text-cyan-400" :
                      apt.status === "checked_in" ? "bg-yellow-500/20 text-yellow-400" :
                      apt.status === "loading" ? "bg-purple-500/20 text-purple-400" :
                      apt.status === "completed" ? "bg-green-500/20 text-green-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {apt.status}
                    </Badge>
                    {apt.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate({ appointmentId: apt.id })}
                        className="text-red-400"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
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
