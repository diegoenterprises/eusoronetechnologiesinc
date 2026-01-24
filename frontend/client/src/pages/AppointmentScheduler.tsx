/**
 * APPOINTMENT SCHEDULER PAGE
 * Terminal appointment scheduling and management
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, Truck, MapPin, User, Phone, Plus,
  CheckCircle, XCircle, AlertTriangle, Search, Filter,
  ChevronLeft, ChevronRight, Edit, Trash2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AppointmentStatus = "scheduled" | "checked_in" | "loading" | "completed" | "cancelled" | "no_show";
type AppointmentType = "pickup" | "delivery";

interface Appointment {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledTime: string;
  duration: number;
  rack: string;
  carrier: {
    name: string;
    mcNumber: string;
  };
  driver: {
    name: string;
    phone: string;
  };
  truck: string;
  trailer: string;
  loadNumber: string;
  product: string;
  quantity: number;
  notes?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointments: Appointment[];
}

export default function AppointmentScheduler() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRack, setSelectedRack] = useState("all");
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const racks = [
    { id: "rack_1", name: "Rack 1", product: "Gasoline" },
    { id: "rack_2", name: "Rack 2", product: "Diesel" },
    { id: "rack_3", name: "Rack 3", product: "Jet Fuel" },
    { id: "rack_4", name: "Rack 4", product: "Ethanol" },
  ];

  const appointments: Appointment[] = [
    {
      id: "apt_001",
      type: "pickup",
      status: "completed",
      scheduledTime: "2025-01-24T06:00:00",
      duration: 45,
      rack: "Rack 1",
      carrier: { name: "ABC Transport", mcNumber: "MC-123456" },
      driver: { name: "Mike Johnson", phone: "(555) 123-4567" },
      truck: "TRK-4521",
      trailer: "TRL-8847",
      loadNumber: "LOAD-45860",
      product: "Gasoline",
      quantity: 8500,
    },
    {
      id: "apt_002",
      type: "pickup",
      status: "loading",
      scheduledTime: "2025-01-24T07:00:00",
      duration: 45,
      rack: "Rack 2",
      carrier: { name: "XYZ Hauling", mcNumber: "MC-789012" },
      driver: { name: "Sarah Williams", phone: "(555) 234-5678" },
      truck: "TRK-3892",
      trailer: "TRL-9921",
      loadNumber: "LOAD-45862",
      product: "Diesel",
      quantity: 7500,
    },
    {
      id: "apt_003",
      type: "pickup",
      status: "checked_in",
      scheduledTime: "2025-01-24T08:00:00",
      duration: 45,
      rack: "Rack 1",
      carrier: { name: "Fast Freight", mcNumber: "MC-345678" },
      driver: { name: "Tom Brown", phone: "(555) 345-6789" },
      truck: "TRK-5543",
      trailer: "TRL-7732",
      loadNumber: "LOAD-45865",
      product: "Gasoline",
      quantity: 8000,
    },
    {
      id: "apt_004",
      type: "pickup",
      status: "scheduled",
      scheduledTime: "2025-01-24T09:00:00",
      duration: 45,
      rack: "Rack 3",
      carrier: { name: "Jet Fuel Express", mcNumber: "MC-567890" },
      driver: { name: "Emily Davis", phone: "(555) 456-7890" },
      truck: "TRK-7821",
      trailer: "TRL-4456",
      loadNumber: "LOAD-45868",
      product: "Jet Fuel",
      quantity: 9000,
    },
    {
      id: "apt_005",
      type: "pickup",
      status: "scheduled",
      scheduledTime: "2025-01-24T10:00:00",
      duration: 45,
      rack: "Rack 1",
      carrier: { name: "ABC Transport", mcNumber: "MC-123456" },
      driver: { name: "Chris Taylor", phone: "(555) 567-8901" },
      truck: "TRK-4522",
      trailer: "TRL-8848",
      loadNumber: "LOAD-45870",
      product: "Gasoline",
      quantity: 8500,
    },
    {
      id: "apt_006",
      type: "pickup",
      status: "scheduled",
      scheduledTime: "2025-01-24T11:00:00",
      duration: 45,
      rack: "Rack 2",
      carrier: { name: "Diesel Direct", mcNumber: "MC-901234" },
      driver: { name: "Lisa Martinez", phone: "(555) 678-9012" },
      truck: "TRK-6654",
      trailer: "TRL-3321",
      loadNumber: "LOAD-45872",
      product: "Diesel",
      quantity: 7000,
    },
  ];

  const stats = {
    todayTotal: 24,
    completed: 8,
    inProgress: 2,
    upcoming: 12,
    cancelled: 2,
  };

  const timeSlots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "loading": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "checked_in": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "scheduled": return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "no_show": return "bg-red-600/20 text-red-400 border-red-600/50";
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "loading": return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "checked_in": return <Clock className="w-4 h-4 text-yellow-400" />;
      case "scheduled": return <Calendar className="w-4 h-4 text-slate-400" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-400" />;
      case "no_show": return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const checkInDriver = (aptId: string) => {
    toast.success("Driver checked in", {
      description: "Appointment status updated",
    });
  };

  const startLoading = (aptId: string) => {
    toast.success("Loading started", {
      description: "Timer started for this appointment",
    });
  };

  const completeAppointment = (aptId: string) => {
    toast.success("Appointment completed", {
      description: "Load marked as complete",
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    if (selectedRack !== "all" && apt.rack !== selectedRack) return false;
    return true;
  });

  const getAppointmentsForSlot = (time: string) => {
    return filteredAppointments.filter(apt => {
      const aptTime = new Date(apt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      return aptTime === time;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointment Scheduler</h1>
          <p className="text-slate-400 text-sm">Terminal loading appointments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewAppointment(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.todayTotal}</p>
            <p className="text-xs text-slate-400">Today's Total</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-slate-400">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{stats.upcoming}</p>
            <p className="text-xs text-slate-400">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.cancelled}</p>
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
            {racks.map(rack => (
              <SelectItem key={rack.id} value={rack.name}>{rack.name} - {rack.product}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-600">Timeline</TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600">List View</TabsTrigger>
          <TabsTrigger value="rack" className="data-[state=active]:bg-blue-600">By Rack</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="space-y-2">
                {timeSlots.map((time) => {
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
                            {slotAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className={cn(
                                  "p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity",
                                  getStatusColor(apt.status)
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {apt.rack}
                                  </Badge>
                                  {getStatusIcon(apt.status)}
                                </div>
                                <p className="text-white font-medium text-sm">{apt.carrier.name}</p>
                                <p className="text-xs text-slate-400">{apt.loadNumber}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {apt.product} - {apt.quantity.toLocaleString()} gal
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        apt.status === "completed" ? "bg-green-500/20" :
                        apt.status === "loading" ? "bg-blue-500/20" :
                        apt.status === "checked_in" ? "bg-yellow-500/20" :
                        "bg-slate-700"
                      )}>
                        {getStatusIcon(apt.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{apt.carrier.name}</p>
                          <Badge className={getStatusColor(apt.status)}>{apt.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          {apt.loadNumber} - {apt.product} ({apt.quantity.toLocaleString()} gal)
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {apt.rack}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {apt.truck}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {apt.driver.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.status === "scheduled" && (
                        <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400" onClick={() => checkInDriver(apt.id)}>
                          Check In
                        </Button>
                      )}
                      {apt.status === "checked_in" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => startLoading(apt.id)}>
                          Start Loading
                        </Button>
                      )}
                      {apt.status === "loading" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => completeAppointment(apt.id)}>
                          Complete
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Rack Tab */}
        <TabsContent value="rack" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racks.map((rack) => {
              const rackAppointments = appointments.filter(apt => apt.rack === rack.name);
              const currentApt = rackAppointments.find(apt => apt.status === "loading");
              const nextApt = rackAppointments.find(apt => apt.status === "checked_in" || apt.status === "scheduled");

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
                        <p className="text-white font-medium">{currentApt.carrier.name}</p>
                        <p className="text-xs text-slate-400">{currentApt.loadNumber}</p>
                        <p className="text-xs text-slate-500">{currentApt.quantity.toLocaleString()} gal</p>
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
                          <p className="text-white text-sm">{nextApt.carrier.name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(nextApt.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-3">
                      {rackAppointments.length} appointments today
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
