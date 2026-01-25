/**
 * TERMINAL APPOINTMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Truck, MapPin, Plus,
  CheckCircle, XCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalAppointments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTerminal, setSelectedTerminal] = useState("all");

  const appointmentsQuery = trpc.terminals.getAppointments.useQuery({ date: selectedDate, terminalId: selectedTerminal === "all" ? undefined : selectedTerminal });
  const terminalsQuery = trpc.terminals.getTerminals.useQuery();
  const statsQuery = trpc.terminals.getAppointmentStats.useQuery({ date: selectedDate });

  const cancelMutation = trpc.terminals.cancelAppointment.useMutation({
    onSuccess: () => { toast.success("Appointment cancelled"); appointmentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const reschedMutation = trpc.terminals.rescheduleAppointment.useMutation({
    onSuccess: () => { toast.success("Appointment rescheduled"); appointmentsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case "completed": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "late": return <Badge className="bg-orange-500/20 text-orange-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Late</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Terminal Appointments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage loading and unloading schedules</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.confirmed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Truck className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg" />
        <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
          <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <MapPin className="w-4 h-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terminals</SelectItem>
            {terminalsQuery.data?.map((terminal: any) => (
              <SelectItem key={terminal.id} value={terminal.id}>{terminal.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => appointmentsQuery.refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Appointments List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointmentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : appointmentsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No appointments for this date</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {appointmentsQuery.data?.map((appointment: any) => (
                <div key={appointment.id} className={cn("p-4", appointment.status === "late" && "bg-orange-500/5 border-l-2 border-orange-500")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", appointment.type === "loading" ? "bg-blue-500/20" : "bg-green-500/20")}>
                        <Truck className={cn("w-5 h-5", appointment.type === "loading" ? "text-blue-400" : "text-green-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{appointment.carrierName}</p>
                          {getStatusBadge(appointment.status)}
                          <Badge className={cn("border-0", appointment.type === "loading" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400")}>
                            {appointment.type === "loading" ? "Loading" : "Unloading"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{appointment.product} - {appointment.quantity}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appointment.scheduledTime}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{appointment.terminalName} - Rack {appointment.rack}</span>
                          <span>Driver: {appointment.driverName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => reschedMutation.mutate({ appointmentId: appointment.id })}>
                            <RefreshCw className="w-4 h-4 mr-1" />Reschedule
                          </Button>
                          <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => cancelMutation.mutate({ appointmentId: appointment.id })}>
                            <XCircle className="w-4 h-4 mr-1" />Cancel
                          </Button>
                        </>
                      )}
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
