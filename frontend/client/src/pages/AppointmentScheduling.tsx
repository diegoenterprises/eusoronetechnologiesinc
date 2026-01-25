/**
 * APPOINTMENT SCHEDULING PAGE
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
  Calendar, Clock, MapPin, Truck, CheckCircle,
  Plus, XCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AppointmentScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTerminal, setSelectedTerminal] = useState("all");

  const appointmentsQuery = trpc.terminal.getAppointments.useQuery({ date: selectedDate, terminal: selectedTerminal });
  const terminalsQuery = trpc.terminal.getTerminals.useQuery();
  const slotsQuery = trpc.terminal.getAvailableSlots.useQuery({ date: selectedDate, terminal: selectedTerminal }, { enabled: selectedTerminal !== "all" });
  const statsQuery = trpc.terminal.getAppointmentStats.useQuery({ date: selectedDate });

  const bookMutation = trpc.terminal.bookAppointment.useMutation({
    onSuccess: () => { toast.success("Appointment booked"); appointmentsQuery.refetch(); slotsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const cancelMutation = trpc.terminal.cancelAppointment.useMutation({
    onSuccess: () => { toast.success("Appointment cancelled"); appointmentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case "completed": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Appointment Scheduling</h1>
          <p className="text-slate-400 text-sm mt-1">Terminal loading appointments</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Calendar className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.confirmed || 0}</p>}<p className="text-xs text-slate-400">Confirmed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Truck className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.checkedIn || 0}</p>}<p className="text-xs text-slate-400">Checked In</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg" />
        {terminalsQuery.isLoading ? <Skeleton className="h-10 w-[200px]" /> : (
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terminals</SelectItem>
              {terminalsQuery.data?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedTerminal !== "all" && slotsQuery.data?.length > 0 && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" />Available Slots</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {slotsQuery.data?.map((slot: any) => (
                <Button key={slot.time} size="sm" variant="outline" className={cn("rounded-lg", slot.available ? "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30" : "bg-slate-700/50 border-slate-600/50 text-slate-500 cursor-not-allowed")} onClick={() => slot.available && bookMutation.mutate({ date: selectedDate, terminal: selectedTerminal, time: slot.time })} disabled={!slot.available}>
                  {slot.time} {slot.available ? `(${slot.rackAvailable} racks)` : "(Full)"}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400" />Appointments</CardTitle></CardHeader>
        <CardContent className="p-0">
          {appointmentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : appointmentsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No appointments for this date</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {appointmentsQuery.data?.map((apt: any) => (
                <div key={apt.id} className={cn("p-4", apt.status === "pending" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-700/50">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{apt.time}</p>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.terminal}</span>
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{apt.carrier}</span>
                          <span>Rack: {apt.rack}</span>
                          <span>Product: {apt.product}</span>
                        </div>
                      </div>
                    </div>
                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                      <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg" onClick={() => cancelMutation.mutate({ appointmentId: apt.id })}>
                        <XCircle className="w-4 h-4 mr-1" />Cancel
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
