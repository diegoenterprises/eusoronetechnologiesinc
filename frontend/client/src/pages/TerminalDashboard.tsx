/**
 * TERMINAL DASHBOARD PAGE
 * Dashboard for Terminal Managers
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, Truck, Clock, Fuel, Database, Calendar,
  AlertTriangle, CheckCircle, RefreshCw, ChevronRight,
  Gauge, Droplet, ThermometerSun, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentScheduler, Appointment, Dock } from "@/components/terminal/AppointmentScheduler";

interface RackStatus {
  id: string;
  name: string;
  status: "available" | "loading" | "maintenance" | "offline";
  currentTruck?: string;
  carrier?: string;
  product?: string;
  startTime?: string;
  progress?: number;
  estimatedCompletion?: string;
}

interface TankInventory {
  id: string;
  name: string;
  product: string;
  capacity: number;
  currentLevel: number;
  temperature: number;
  lastUpdated: string;
}

const STATS = {
  todayAppointments: 24,
  trucksCheckedIn: 8,
  currentlyLoading: 3,
  rackUtilization: 75,
  inventoryAlerts: 2,
  avgLoadTime: 45,
};

const MOCK_RACKS: RackStatus[] = [
  { id: "r1", name: "Rack 1", status: "loading", currentTruck: "TRK-4521", carrier: "ABC Transport", product: "Gasoline", startTime: "10:15 AM", progress: 65, estimatedCompletion: "10:55 AM" },
  { id: "r2", name: "Rack 2", status: "available" },
  { id: "r3", name: "Rack 3", status: "loading", currentTruck: "TRK-7823", carrier: "XYZ Hazmat", product: "Diesel", startTime: "10:30 AM", progress: 30, estimatedCompletion: "11:15 AM" },
  { id: "r4", name: "Rack 4", status: "maintenance" },
  { id: "r5", name: "Rack 5", status: "available" },
  { id: "r6", name: "Rack 6", status: "loading", currentTruck: "TRK-9012", carrier: "SafeHaul Inc", product: "Jet Fuel", startTime: "10:45 AM", progress: 10, estimatedCompletion: "11:30 AM" },
  { id: "r7", name: "Rack 7", status: "available" },
  { id: "r8", name: "Rack 8", status: "offline" },
];

const MOCK_TANKS: TankInventory[] = [
  { id: "t1", name: "Tank 101", product: "Gasoline 87", capacity: 50000, currentLevel: 35000, temperature: 72, lastUpdated: "2 min ago" },
  { id: "t2", name: "Tank 102", product: "Gasoline 89", capacity: 50000, currentLevel: 42000, temperature: 71, lastUpdated: "2 min ago" },
  { id: "t3", name: "Tank 103", product: "Gasoline 93", capacity: 30000, currentLevel: 8500, temperature: 73, lastUpdated: "2 min ago" },
  { id: "t4", name: "Tank 201", product: "Diesel #2", capacity: 75000, currentLevel: 58000, temperature: 68, lastUpdated: "2 min ago" },
  { id: "t5", name: "Tank 301", product: "Jet-A", capacity: 40000, currentLevel: 32000, temperature: 65, lastUpdated: "2 min ago" },
];

const MOCK_DOCKS: Dock[] = [
  { id: "d1", name: "Dock 1", type: "loading", status: "available" },
  { id: "d2", name: "Dock 2", type: "loading", status: "occupied" },
  { id: "d3", name: "Dock 3", type: "both", status: "available" },
  { id: "d4", name: "Dock 4", type: "unloading", status: "maintenance" },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "a1", loadId: "L-001", carrierId: "c1", carrierName: "ABC Transport", driverName: "John Smith", truckNumber: "TRK-4521", dockNumber: "d1", appointmentType: "loading", commodity: "Gasoline", quantity: "8500 gal", scheduledTime: "2026-01-23T10:00:00", duration: 60, status: "loading" },
  { id: "a2", loadId: "L-002", carrierId: "c2", carrierName: "XYZ Hazmat", driverName: "Maria Garcia", truckNumber: "TRK-7823", dockNumber: "d2", appointmentType: "loading", commodity: "Diesel", quantity: "9000 gal", scheduledTime: "2026-01-23T11:00:00", duration: 60, status: "checked_in" },
  { id: "a3", loadId: "L-003", carrierId: "c3", carrierName: "SafeHaul Inc", driverName: "Robert Johnson", truckNumber: "TRK-9012", dockNumber: "d3", appointmentType: "loading", commodity: "Jet Fuel", quantity: "8000 gal", scheduledTime: "2026-01-23T12:00:00", duration: 45, status: "scheduled" },
];

const STATUS_COLORS = {
  available: "bg-green-500",
  loading: "bg-blue-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
  occupied: "bg-blue-500",
};

export default function TerminalDashboard() {
  const [racks] = useState<RackStatus[]>(MOCK_RACKS);
  const [tanks] = useState<TankInventory[]>(MOCK_TANKS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showScheduler, setShowScheduler] = useState(false);

  const lowInventoryTanks = tanks.filter(t => (t.currentLevel / t.capacity) < 0.25);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Terminal Dashboard</h1>
          <p className="text-slate-400">Houston Terminal #1 • Real-time Operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600" onClick={() => setShowScheduler(!showScheduler)}>
            <Calendar className="w-4 h-4 mr-2" />
            {showScheduler ? "Hide Scheduler" : "Appointments"}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh SCADA
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today's Appts</p>
                <p className="text-2xl font-bold text-white">{STATS.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Checked In</p>
                <p className="text-2xl font-bold text-green-400">{STATS.trucksCheckedIn}</p>
              </div>
              <Truck className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Loading Now</p>
                <p className="text-2xl font-bold text-blue-400">{STATS.currentlyLoading}</p>
              </div>
              <Fuel className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Rack Util.</p>
                <p className="text-2xl font-bold text-white">{STATS.rackUtilization}%</p>
              </div>
              <Gauge className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Inv. Alerts</p>
                <p className={cn(
                  "text-2xl font-bold",
                  STATS.inventoryAlerts > 0 ? "text-yellow-400" : "text-green-400"
                )}>{STATS.inventoryAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Load Time</p>
                <p className="text-2xl font-bold text-white">{STATS.avgLoadTime}m</p>
              </div>
              <Clock className="w-8 h-8 text-slate-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Inventory Alert */}
      {lowInventoryTanks.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Low Inventory Alert</p>
                <div className="mt-2 space-y-1 text-sm">
                  {lowInventoryTanks.map(tank => (
                    <p key={tank.id} className="text-slate-300">
                      <Badge className="bg-yellow-500/20 text-yellow-400 mr-2">Low</Badge>
                      {tank.name} ({tank.product}) - {Math.round((tank.currentLevel / tank.capacity) * 100)}% capacity
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Scheduler */}
      {showScheduler && (
        <AppointmentScheduler
          docks={MOCK_DOCKS}
          appointments={MOCK_APPOINTMENTS}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onCreateAppointment={(data) => console.log("Create:", data)}
          onUpdateStatus={(id, status) => console.log("Update:", id, status)}
          onCancelAppointment={(id) => console.log("Cancel:", id)}
        />
      )}

      {/* Rack Status Grid */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-blue-400" />
              Loading Rack Status
              <Badge variant="outline" className="text-xs text-slate-400 ml-2">
                <Database className="w-3 h-3 mr-1" />
                SCADA Connected
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", color)} />
                  <span className="text-slate-400 capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {racks.map((rack) => (
              <Card 
                key={rack.id}
                className={cn(
                  "bg-slate-700/30 border-slate-600",
                  rack.status === "loading" && "border-blue-500/50",
                  rack.status === "maintenance" && "border-yellow-500/50",
                  rack.status === "offline" && "border-red-500/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">{rack.name}</span>
                    <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[rack.status])} />
                  </div>

                  {rack.status === "loading" && rack.currentTruck ? (
                    <div className="space-y-2">
                      <div className="text-xs">
                        <p className="text-slate-400">Truck</p>
                        <p className="text-white">{rack.currentTruck}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-slate-400">Product</p>
                        <p className="text-white">{rack.product}</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-blue-400">{rack.progress}%</span>
                        </div>
                        <Progress value={rack.progress} className="h-2 bg-slate-600" />
                      </div>
                      <p className="text-xs text-slate-500">
                        Est. completion: {rack.estimatedCompletion}
                      </p>
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center">
                      <span className={cn(
                        "text-sm capitalize",
                        rack.status === "available" && "text-green-400",
                        rack.status === "maintenance" && "text-yellow-400",
                        rack.status === "offline" && "text-red-400"
                      )}>
                        {rack.status}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tank Inventory */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" />
              Tank Inventory Levels
            </CardTitle>
            <Badge variant="outline" className="text-xs text-slate-400">
              <Activity className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tanks.map((tank) => {
              const percentage = Math.round((tank.currentLevel / tank.capacity) * 100);
              const isLow = percentage < 25;
              const isCritical = percentage < 15;
              
              return (
                <div key={tank.id} className="p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{tank.name}</p>
                      <p className="text-sm text-slate-400">{tank.product}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        isCritical ? "text-red-400" : isLow ? "text-yellow-400" : "text-green-400"
                      )}>
                        {percentage}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {tank.currentLevel.toLocaleString()} / {tank.capacity.toLocaleString()} gal
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-4 bg-slate-600",
                        isCritical && "[&>div]:bg-red-500",
                        isLow && !isCritical && "[&>div]:bg-yellow-500",
                        !isLow && "[&>div]:bg-green-500"
                      )} 
                    />
                    {(percentage < 50 && percentage > 25) && (
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500" />
                    )}
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ThermometerSun className="w-3 h-3" />
                      {tank.temperature}°F
                    </span>
                    <span>Updated {tank.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "10:45 AM", event: "TRK-9012 started loading at Rack 6", type: "loading", carrier: "SafeHaul Inc" },
              { time: "10:30 AM", event: "TRK-7823 started loading at Rack 3", type: "loading", carrier: "XYZ Hazmat" },
              { time: "10:20 AM", event: "TRK-7823 checked in at gate", type: "checkin", carrier: "XYZ Hazmat" },
              { time: "10:15 AM", event: "TRK-4521 started loading at Rack 1", type: "loading", carrier: "ABC Transport" },
              { time: "10:05 AM", event: "TRK-4521 checked in at gate", type: "checkin", carrier: "ABC Transport" },
              { time: "09:45 AM", event: "TRK-3312 completed loading at Rack 2", type: "complete", carrier: "ProChem" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-2 rounded hover:bg-slate-700/30 transition-colors">
                <span className="text-xs text-slate-500 w-16">{activity.time}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activity.type === "loading" && "bg-blue-500",
                  activity.type === "checkin" && "bg-green-500",
                  activity.type === "complete" && "bg-emerald-500"
                )} />
                <span className="text-sm text-slate-300 flex-1">{activity.event}</span>
                <Badge variant="outline" className="text-xs text-slate-400">
                  {activity.carrier}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
