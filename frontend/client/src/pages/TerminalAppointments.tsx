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
  Calendar, Clock, Truck, MapPin, Plus, Search, CheckCircle,
  XCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalAppointments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTerminal, setSelectedTerminal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const appointmentsQuery = trpc.terminal.getAppointments.useQuery({ date: selectedDate, terminalId: selectedTerminal });
  const terminalsQuery = trpc.terminal.list.useQuery();
  const summaryQuery = trpc.terminal.getAppointmentSummary.useQuery({ date: selectedDate });
  const racksQuery = trpc.terminal.getRackStatus.useQuery({ terminalId: selectedTerminal }, { enabled: !!selectedTerminal });

  const checkInMutation = trpc.terminal.checkIn.useMutation({
    onSuccess: () => { toast.success("Checked in successfully"); appointmentsQuery.refetch(); },
    onError: (error) => toast.error("Check-in failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Scheduled</Badge>;
      case "checked_in": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Checked In</Badge>;
      case "loading": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Loading</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0">Completed</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 border-0">Cancelled</Badge>;
      case "no_show": return <Badge className="bg-slate-500/20 text-slate-400 border-0">No Show</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredAppointments = appointmentsQuery.data?.filter((apt: any) =>
    !searchTerm || apt.carrierName?.toLowerCase().includes(searchTerm.toLowerCase()) || apt.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Terminal Appointments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage loading rack appointments</p>
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
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.checkedIn || 0}</p>
                )}
                <p className="text-xs text-slate-400">Checked In</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.loading || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loading</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.noShow || 0}</p>
                )}
                <p className="text-xs text-slate-400">No Show</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto bg-slate-800/50 border-slate-700/50 rounded-lg" />
        <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
          <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="All Terminals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Terminals</SelectItem>
            {terminalsQuery.data?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search carrier or load..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
      </div>

      {/* Rack Status */}
      {selectedTerminal && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Rack Status</CardTitle>
          </CardHeader>
          <CardContent>
            {racksQuery.isLoading ? (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {racksQuery.data?.map((rack: any) => (
                  <div key={rack.id} className={cn("p-3 rounded-xl text-center", rack.status === "available" ? "bg-green-500/20 border border-green-500/30" : rack.status === "occupied" ? "bg-red-500/20 border border-red-500/30" : "bg-yellow-500/20 border border-yellow-500/30")}>
                    <p className="text-white font-bold">{rack.name}</p>
                    <p className={cn("text-xs capitalize", rack.status === "available" ? "text-green-400" : rack.status === "occupied" ? "text-red-400" : "text-yellow-400")}>{rack.status}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointmentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredAppointments?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No appointments found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredAppointments?.map((apt: any) => (
                <div key={apt.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <Truck className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{apt.loadNumber}</p>
                          {getStatusBadge(apt.status)}
                        </div>
                        <p className="text-sm text-slate-400">{apt.carrierName} - {apt.driverName}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.scheduledTime}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Rack {apt.rackNumber}</span>
                          <span>{apt.product} - {apt.quantity} gal</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === "scheduled" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => checkInMutation.mutate({ appointmentId: apt.id })}>
                          <CheckCircle className="w-4 h-4 mr-1" />Check In
                        </Button>
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
