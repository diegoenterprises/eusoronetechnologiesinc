/**
 * TERMINAL SCHEDULING
 * Appointment scheduling grid for terminal managers with rack utilization
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Calendar, Clock, Truck, Fuel, CheckCircle, XCircle, 
  AlertTriangle, Plus, ChevronLeft, ChevronRight, X,
  Gauge, Droplets, BarChart3, RefreshCw, Phone, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AppointmentStatus = "scheduled" | "checked_in" | "loading" | "completed" | "cancelled" | "no_show";
type RackStatus = "available" | "in_use" | "maintenance" | "reserved";

interface Appointment {
  id: string;
  carrierName: string;
  driverName: string;
  driverPhone: string;
  truckNumber: string;
  trailerNumber: string;
  product: string;
  quantity: number;
  quantityUnit: "gallons" | "barrels";
  rackId: string;
  scheduledTime: string;
  estimatedDuration: number;
  status: AppointmentStatus;
  checkInTime?: string;
  loadStartTime?: string;
  loadEndTime?: string;
  bolNumber?: string;
}

interface Rack {
  id: string;
  name: string;
  status: RackStatus;
  products: string[];
  flowRate: number;
  currentAppointment?: string;
  lastMaintenance: string;
}

interface Tank {
  id: string;
  name: string;
  product: string;
  capacity: number;
  currentLevel: number;
  unit: "gallons" | "barrels";
}

const MOCK_RACKS: Rack[] = [
  { id: "rack_1", name: "Rack 1", status: "in_use", products: ["Gasoline 87", "Gasoline 89", "Gasoline 93"], flowRate: 600, currentAppointment: "apt_002", lastMaintenance: "2025-01-15" },
  { id: "rack_2", name: "Rack 2", status: "available", products: ["Gasoline 87", "Diesel #2"], flowRate: 550, lastMaintenance: "2025-01-10" },
  { id: "rack_3", name: "Rack 3", status: "available", products: ["Diesel #2", "Diesel DEF"], flowRate: 500, lastMaintenance: "2025-01-12" },
  { id: "rack_4", name: "Rack 4", status: "maintenance", products: ["Jet Fuel A"], flowRate: 450, lastMaintenance: "2025-01-20" },
  { id: "rack_5", name: "Rack 5", status: "reserved", products: ["Gasoline 87", "Gasoline 89"], flowRate: 600, lastMaintenance: "2025-01-18" },
];

const MOCK_TANKS: Tank[] = [
  { id: "tank_1", name: "Tank 101", product: "Gasoline 87", capacity: 500000, currentLevel: 385000, unit: "gallons" },
  { id: "tank_2", name: "Tank 102", product: "Gasoline 89", capacity: 300000, currentLevel: 210000, unit: "gallons" },
  { id: "tank_3", name: "Tank 103", product: "Gasoline 93", capacity: 200000, currentLevel: 125000, unit: "gallons" },
  { id: "tank_4", name: "Tank 201", product: "Diesel #2", capacity: 400000, currentLevel: 320000, unit: "gallons" },
  { id: "tank_5", name: "Tank 301", product: "Jet Fuel A", capacity: 250000, currentLevel: 180000, unit: "gallons" },
];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const generateMockAppointments = (): Appointment[] => [
  {
    id: "apt_001",
    carrierName: "SafeHaul Transport",
    driverName: "Mike Johnson",
    driverPhone: "(555) 123-4567",
    truckNumber: "TRK-4521",
    trailerNumber: "TRL-8847",
    product: "Gasoline 87",
    quantity: 8500,
    quantityUnit: "gallons",
    rackId: "rack_1",
    scheduledTime: "2025-01-24T06:00:00",
    estimatedDuration: 45,
    status: "completed",
    checkInTime: "2025-01-24T05:45:00",
    loadStartTime: "2025-01-24T06:05:00",
    loadEndTime: "2025-01-24T06:48:00",
    bolNumber: "BOL-2025-0847",
  },
  {
    id: "apt_002",
    carrierName: "Texas Fuel Haulers",
    driverName: "Sarah Williams",
    driverPhone: "(555) 234-5678",
    truckNumber: "TRK-4522",
    trailerNumber: "TRL-8848",
    product: "Gasoline 89",
    quantity: 8000,
    quantityUnit: "gallons",
    rackId: "rack_1",
    scheduledTime: "2025-01-24T08:00:00",
    estimatedDuration: 40,
    status: "loading",
    checkInTime: "2025-01-24T07:50:00",
    loadStartTime: "2025-01-24T08:05:00",
  },
  {
    id: "apt_003",
    carrierName: "Gulf Coast Carriers",
    driverName: "Tom Brown",
    driverPhone: "(555) 345-6789",
    truckNumber: "TRK-4523",
    trailerNumber: "TRL-8849",
    product: "Diesel #2",
    quantity: 7500,
    quantityUnit: "gallons",
    rackId: "rack_3",
    scheduledTime: "2025-01-24T09:00:00",
    estimatedDuration: 35,
    status: "checked_in",
    checkInTime: "2025-01-24T08:45:00",
  },
  {
    id: "apt_004",
    carrierName: "Lone Star Trucking",
    driverName: "Lisa Chen",
    driverPhone: "(555) 456-7890",
    truckNumber: "TRK-4524",
    trailerNumber: "TRL-8850",
    product: "Gasoline 87",
    quantity: 8500,
    quantityUnit: "gallons",
    rackId: "rack_2",
    scheduledTime: "2025-01-24T10:00:00",
    estimatedDuration: 45,
    status: "scheduled",
  },
  {
    id: "apt_005",
    carrierName: "Premier Transport",
    driverName: "James Wilson",
    driverPhone: "(555) 567-8901",
    truckNumber: "TRK-4525",
    trailerNumber: "TRL-8851",
    product: "Diesel #2",
    quantity: 7000,
    quantityUnit: "gallons",
    rackId: "rack_3",
    scheduledTime: "2025-01-24T11:00:00",
    estimatedDuration: 35,
    status: "scheduled",
  },
];

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; label: string }> = {
  scheduled: { color: "bg-blue-500/20 text-blue-400", label: "Scheduled" },
  checked_in: { color: "bg-yellow-500/20 text-yellow-400", label: "Checked In" },
  loading: { color: "bg-green-500/20 text-green-400", label: "Loading" },
  completed: { color: "bg-slate-500/20 text-slate-400", label: "Completed" },
  cancelled: { color: "bg-red-500/20 text-red-400", label: "Cancelled" },
  no_show: { color: "bg-orange-500/20 text-orange-400", label: "No Show" },
};

const RACK_STATUS_CONFIG: Record<RackStatus, { color: string; label: string }> = {
  available: { color: "bg-green-500", label: "Available" },
  in_use: { color: "bg-blue-500", label: "In Use" },
  maintenance: { color: "bg-red-500", label: "Maintenance" },
  reserved: { color: "bg-yellow-500", label: "Reserved" },
};

export default function TerminalScheduling() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(generateMockAppointments());
  const [racks] = useState<Rack[]>(MOCK_RACKS);
  const [tanks] = useState<Tank[]>(MOCK_TANKS);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "inventory">("schedule");

  const getAppointmentsForSlot = (rackId: string, timeSlot: string) => {
    return appointments.filter(apt => {
      const aptTime = new Date(apt.scheduledTime);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      return apt.rackId === rackId && aptTime.getHours() === slotHour;
    });
  };

  const updateAppointmentStatus = (aptId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(apt => {
      if (apt.id === aptId) {
        const updates: Partial<Appointment> = { status: newStatus };
        if (newStatus === "checked_in") updates.checkInTime = new Date().toISOString();
        if (newStatus === "loading") updates.loadStartTime = new Date().toISOString();
        if (newStatus === "completed") updates.loadEndTime = new Date().toISOString();
        return { ...apt, ...updates };
      }
      return apt;
    }));
    toast.success(`Appointment status updated to ${STATUS_CONFIG[newStatus].label}`);
  };

  const getTodayStats = () => {
    const todayApts = appointments;
    return {
      total: todayApts.length,
      completed: todayApts.filter(a => a.status === "completed").length,
      inProgress: todayApts.filter(a => a.status === "loading" || a.status === "checked_in").length,
      scheduled: todayApts.filter(a => a.status === "scheduled").length,
    };
  };

  const stats = getTodayStats();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Terminal Scheduling</h1>
          <p className="text-slate-400 text-sm">Manage loading appointments and rack utilization</p>
        </div>
        <Button onClick={() => setShowNewAppointment(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500">Today's Appointments</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-xs text-green-500/70">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
            <p className="text-xs text-yellow-500/70">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
            <p className="text-xs text-blue-500/70">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "schedule" ? "default" : "outline"}
          onClick={() => setActiveTab("schedule")}
          className={activeTab === "schedule" ? "bg-blue-600" : "border-slate-600"}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Grid
        </Button>
        <Button
          variant={activeTab === "inventory" ? "default" : "outline"}
          onClick={() => setActiveTab("inventory")}
          className={activeTab === "inventory" ? "bg-blue-600" : "border-slate-600"}
        >
          <Droplets className="w-4 h-4 mr-2" />
          Tank Inventory
        </Button>
      </div>

      {activeTab === "schedule" ? (
        <>
          {/* Rack Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Rack Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {racks.map((rack) => (
                  <div 
                    key={rack.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      rack.status === "available" ? "border-green-500/30 bg-green-500/10" :
                      rack.status === "in_use" ? "border-blue-500/30 bg-blue-500/10" :
                      rack.status === "maintenance" ? "border-red-500/30 bg-red-500/10" :
                      "border-yellow-500/30 bg-yellow-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{rack.name}</span>
                      <div className={cn("w-3 h-3 rounded-full", RACK_STATUS_CONFIG[rack.status].color)} />
                    </div>
                    <p className="text-xs text-slate-400">{RACK_STATUS_CONFIG[rack.status].label}</p>
                    <p className="text-xs text-slate-500 mt-1">{rack.flowRate} GPM</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Schedule Grid</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 w-40"
                  />
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left text-slate-400 text-sm p-2 w-20">Time</th>
                    {racks.filter(r => r.status !== "maintenance").map((rack) => (
                      <th key={rack.id} className="text-center text-slate-400 text-sm p-2">
                        {rack.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot} className="border-t border-slate-700">
                      <td className="text-slate-300 text-sm p-2 font-medium">{slot}</td>
                      {racks.filter(r => r.status !== "maintenance").map((rack) => {
                        const slotApts = getAppointmentsForSlot(rack.id, slot);
                        return (
                          <td key={`${rack.id}-${slot}`} className="p-1">
                            {slotApts.length > 0 ? (
                              slotApts.map((apt) => (
                                <div
                                  key={apt.id}
                                  onClick={() => setSelectedAppointment(apt)}
                                  className={cn(
                                    "p-2 rounded cursor-pointer text-xs transition-colors",
                                    apt.status === "completed" ? "bg-slate-700/50 text-slate-400" :
                                    apt.status === "loading" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                                    apt.status === "checked_in" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                                    "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  )}
                                >
                                  <p className="font-medium truncate">{apt.carrierName}</p>
                                  <p className="text-[10px] opacity-70">{apt.quantity} gal</p>
                                </div>
                              ))
                            ) : (
                              <div className="h-12 rounded bg-slate-700/20 border border-dashed border-slate-600" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Inventory Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tanks.map((tank) => {
            const percentage = (tank.currentLevel / tank.capacity) * 100;
            return (
              <Card key={tank.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{tank.name}</p>
                      <p className="text-sm text-slate-400">{tank.product}</p>
                    </div>
                    <Droplets className={cn(
                      "w-6 h-6",
                      percentage > 50 ? "text-green-400" :
                      percentage > 25 ? "text-yellow-400" : "text-red-400"
                    )} />
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Level</span>
                      <span className={cn(
                        "font-medium",
                        percentage > 50 ? "text-green-400" :
                        percentage > 25 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          percentage > 50 ? "bg-green-500" :
                          percentage > 25 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Current</p>
                      <p className="text-white font-medium">
                        {tank.currentLevel.toLocaleString()} gal
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Capacity</p>
                      <p className="text-white font-medium">
                        {tank.capacity.toLocaleString()} gal
                      </p>
                    </div>
                  </div>

                  {percentage < 25 && (
                    <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Low inventory - resupply needed
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Appointment Details</CardTitle>
                  <Badge className={STATUS_CONFIG[selectedAppointment.status].color}>
                    {STATUS_CONFIG[selectedAppointment.status].label}
                  </Badge>
                </div>
                <Button variant="ghost" onClick={() => setSelectedAppointment(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Carrier</p>
                  <p className="text-white font-medium">{selectedAppointment.carrierName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Driver</p>
                  <p className="text-white font-medium">{selectedAppointment.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Truck / Trailer</p>
                  <p className="text-white">{selectedAppointment.truckNumber} / {selectedAppointment.trailerNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Product</p>
                  <p className="text-white">{selectedAppointment.product}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Quantity</p>
                  <p className="text-white">{selectedAppointment.quantity.toLocaleString()} {selectedAppointment.quantityUnit}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Scheduled</p>
                  <p className="text-white">{new Date(selectedAppointment.scheduledTime).toLocaleTimeString()}</p>
                </div>
              </div>

              {selectedAppointment.bolNumber && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-400">BOL: {selectedAppointment.bolNumber}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAppointment.status === "scheduled" && (
                    <Button 
                      onClick={() => { updateAppointmentStatus(selectedAppointment.id, "checked_in"); setSelectedAppointment(null); }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Check In
                    </Button>
                  )}
                  {selectedAppointment.status === "checked_in" && (
                    <Button 
                      onClick={() => { updateAppointmentStatus(selectedAppointment.id, "loading"); setSelectedAppointment(null); }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Loading
                    </Button>
                  )}
                  {selectedAppointment.status === "loading" && (
                    <Button 
                      onClick={() => { updateAppointmentStatus(selectedAppointment.id, "completed"); setSelectedAppointment(null); }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Complete
                    </Button>
                  )}
                  {(selectedAppointment.status === "scheduled" || selectedAppointment.status === "checked_in") && (
                    <Button 
                      variant="outline"
                      onClick={() => { updateAppointmentStatus(selectedAppointment.id, "cancelled"); setSelectedAppointment(null); }}
                      className="border-red-500 text-red-400"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button variant="outline" className="border-slate-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">New Appointment</CardTitle>
                <Button variant="ghost" onClick={() => setShowNewAppointment(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-300">Carrier Name</Label>
                  <Input className="bg-slate-700/50 border-slate-600" placeholder="Enter carrier name" />
                </div>
                <div>
                  <Label className="text-slate-300">Driver Name</Label>
                  <Input className="bg-slate-700/50 border-slate-600" placeholder="Driver name" />
                </div>
                <div>
                  <Label className="text-slate-300">Driver Phone</Label>
                  <Input className="bg-slate-700/50 border-slate-600" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <Label className="text-slate-300">Truck #</Label>
                  <Input className="bg-slate-700/50 border-slate-600" placeholder="TRK-0000" />
                </div>
                <div>
                  <Label className="text-slate-300">Trailer #</Label>
                  <Input className="bg-slate-700/50 border-slate-600" placeholder="TRL-0000" />
                </div>
                <div>
                  <Label className="text-slate-300">Product</Label>
                  <select className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white">
                    <option>Gasoline 87</option>
                    <option>Gasoline 89</option>
                    <option>Gasoline 93</option>
                    <option>Diesel #2</option>
                    <option>Jet Fuel A</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Quantity (gal)</Label>
                  <Input type="number" className="bg-slate-700/50 border-slate-600" placeholder="8500" />
                </div>
                <div>
                  <Label className="text-slate-300">Date</Label>
                  <Input type="date" className="bg-slate-700/50 border-slate-600" />
                </div>
                <div>
                  <Label className="text-slate-300">Time</Label>
                  <Input type="time" className="bg-slate-700/50 border-slate-600" />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-300">Rack</Label>
                  <select className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white">
                    {racks.filter(r => r.status !== "maintenance").map((rack) => (
                      <option key={rack.id} value={rack.id}>{rack.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { toast.success("Appointment created"); setShowNewAppointment(false); }}>
                  Create Appointment
                </Button>
                <Button variant="outline" className="border-slate-600" onClick={() => setShowNewAppointment(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
