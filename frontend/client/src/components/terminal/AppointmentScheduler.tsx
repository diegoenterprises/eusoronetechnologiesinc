/**
 * APPOINTMENT SCHEDULER COMPONENT
 * Dock appointment scheduling for Terminal Managers
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, Clock, Truck, Package, User, 
  Plus, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DatePicker from "@/components/DatePicker";

export interface Appointment {
  id: string;
  loadId: string;
  catalystId: string;
  catalystName: string;
  driverName: string;
  truckNumber: string;
  dockNumber: string;
  appointmentType: "loading" | "unloading";
  commodity: string;
  quantity: string;
  scheduledTime: string;
  duration: number; // minutes
  status: "scheduled" | "checked_in" | "loading" | "completed" | "cancelled" | "no_show";
  notes?: string;
}

export interface Dock {
  id: string;
  name: string;
  type: "loading" | "unloading" | "both";
  status: "available" | "occupied" | "maintenance";
  currentAppointment?: Appointment;
  rackId?: string;
}

interface AppointmentSchedulerProps {
  docks: Dock[];
  appointments: Appointment[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCreateAppointment: (data: Partial<Appointment>) => void;
  onUpdateStatus: (appointmentId: string, status: Appointment["status"]) => void;
  onCancelAppointment: (appointmentId: string) => void;
}

const STATUS_CONFIG = {
  scheduled: { color: "bg-blue-500/20 text-blue-400", label: "Scheduled" },
  checked_in: { color: "bg-yellow-500/20 text-yellow-400", label: "Checked In" },
  loading: { color: "bg-green-500/20 text-green-400", label: "Loading" },
  completed: { color: "bg-emerald-500/20 text-emerald-400", label: "Completed" },
  cancelled: { color: "bg-slate-500/20 text-slate-400", label: "Cancelled" },
  no_show: { color: "bg-red-500/20 text-red-400", label: "No Show" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function AppointmentScheduler({
  docks,
  appointments,
  selectedDate,
  onDateChange,
  onCreateAppointment,
  onUpdateStatus,
  onCancelAppointment,
}: AppointmentSchedulerProps) {
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    appointmentType: "loading",
    duration: 60,
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    onDateChange(newDate);
  };

  const getAppointmentsForDockAndHour = (dockId: string, hour: number) => {
    return appointments.filter(apt => {
      if (apt.dockNumber !== dockId) return false;
      const aptHour = new Date(apt.scheduledTime).getHours();
      return aptHour === hour;
    });
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.dockNumber || !newAppointment.scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    onCreateAppointment(newAppointment);
    setShowNewAppointment(false);
    setNewAppointment({ appointmentType: "loading", duration: 60 });
    toast.success("Appointment scheduled");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateDate(-1)} className="border-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">{formatDate(selectedDate)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateDate(1)} className="border-slate-600">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())} className="border-slate-600">
            Today
          </Button>
        </div>
        <Button onClick={() => setShowNewAppointment(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Dock Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {docks.map((dock) => (
          <Card key={dock.id} className={cn(
            "bg-slate-800/50 border-slate-700",
            dock.status === "occupied" && "border-green-500/50",
            dock.status === "maintenance" && "border-yellow-500/50"
          )}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{dock.name}</span>
                <Badge className={cn(
                  "text-xs",
                  dock.status === "available" && "bg-green-500/20 text-green-400",
                  dock.status === "occupied" && "bg-blue-500/20 text-blue-400",
                  dock.status === "maintenance" && "bg-yellow-500/20 text-yellow-400"
                )}>
                  {dock.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {dock.type === "both" ? "Load/Unload" : dock.type}
              </p>
              {dock.currentAppointment && (
                <div className="mt-2 p-2 rounded bg-slate-700/30 text-xs">
                  <p className="text-white">{dock.currentAppointment.catalystName}</p>
                  <p className="text-slate-400">{dock.currentAppointment.truckNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Grid */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Schedule Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${docks.length}, 1fr)` }}>
                <div className="p-2 text-xs text-slate-400">Time</div>
                {docks.map((dock) => (
                  <div key={dock.id} className="p-2 text-center">
                    <span className="text-sm text-white font-medium">{dock.name}</span>
                    <Badge className={cn(
                      "text-xs ml-2",
                      dock.status === "available" && "bg-green-500/20 text-green-400",
                      dock.status === "occupied" && "bg-blue-500/20 text-blue-400",
                      dock.status === "maintenance" && "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {dock.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {HOURS.filter(h => h >= 6 && h <= 22).map((hour) => (
                <div 
                  key={hour} 
                  className="grid gap-1 border-t border-slate-700"
                  style={{ gridTemplateColumns: `80px repeat(${docks.length}, 1fr)` }}
                >
                  <div className="p-2 text-xs text-slate-400">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {docks.map((dock) => {
                    const dockAppointments = getAppointmentsForDockAndHour(dock.id, hour);
                    return (
                      <div 
                        key={`${dock.id}-${hour}`} 
                        className="p-1 min-h-[60px] bg-slate-700/20 hover:bg-slate-700/40 transition-colors rounded"
                      >
                        {dockAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={cn(
                              "p-2 rounded text-xs mb-1 cursor-pointer hover:opacity-80",
                              STATUS_CONFIG[apt.status].color
                            )}
                            onClick={() => {/* Open appointment details */}}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{apt.catalystName}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {apt.appointmentType === "loading" ? "L" : "U"}
                              </Badge>
                            </div>
                            <p className="text-slate-300 truncate">{apt.truckNumber}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            Today's Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No appointments scheduled for this date</p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      apt.appointmentType === "loading" ? "bg-blue-500/20" : "bg-green-500/20"
                    )}>
                      {apt.appointmentType === "loading" ? (
                        <Package className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Truck className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{apt.catalystName}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{apt.truckNumber}</span>
                        <span>•</span>
                        <span>{apt.driverName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{apt.duration} min</span>
                        <span>•</span>
                        <span>Dock {apt.dockNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_CONFIG[apt.status].color}>
                      {STATUS_CONFIG[apt.status].label}
                    </Badge>
                    {apt.status === "scheduled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(apt.id, "checked_in")}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Check In
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCancelAppointment(apt.id)}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {apt.status === "checked_in" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(apt.id, "loading")}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        Start {apt.appointmentType === "loading" ? "Loading" : "Unloading"}
                      </Button>
                    )}
                    {apt.status === "loading" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(apt.id, "completed")}
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Schedule Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Dock</Label>
                <Select 
                  value={newAppointment.dockNumber}
                  onValueChange={(v) => setNewAppointment({ ...newAppointment, dockNumber: v })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select dock" />
                  </SelectTrigger>
                  <SelectContent>
                    {docks.filter(d => d.status === "available").map((dock) => (
                      <SelectItem key={dock.id} value={dock.id}>{dock.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Date</Label>
                  <DatePicker value={selectedDate.toISOString().split('T')[0]} onChange={(v) => onDateChange(new Date(v + 'T00:00:00'))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Time</Label>
                  <Input
                    type="time"
                    onChange={(e) => setNewAppointment({ 
                      ...newAppointment, 
                      scheduledTime: `${selectedDate.toISOString().split('T')[0]}T${e.target.value}` 
                    })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select 
                  value={newAppointment.appointmentType}
                  onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentType: v as any })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loading">Loading</SelectItem>
                    <SelectItem value="unloading">Unloading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Catalyst Name</Label>
                <Input
                  value={newAppointment.catalystName || ""}
                  onChange={(e) => setNewAppointment({ ...newAppointment, catalystName: e.target.value })}
                  placeholder="ABC Trucking"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Truck #</Label>
                  <Input
                    value={newAppointment.truckNumber || ""}
                    onChange={(e) => setNewAppointment({ ...newAppointment, truckNumber: e.target.value })}
                    placeholder="TRK-101"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Duration (min)</Label>
                  <Input
                    type="number"
                    value={newAppointment.duration || 60}
                    onChange={(e) => setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewAppointment(false)} className="flex-1 border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleCreateAppointment} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AppointmentScheduler;
