/**
 * DRIVER DASHBOARD COMPONENT
 * Mobile-first dashboard for drivers
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, Clock, MapPin, Navigation, Phone, FileText,
  Camera, CheckCircle, AlertTriangle, DollarSign, Fuel,
  Thermometer, Package, ChevronRight, Play, Pause, Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CurrentLoad {
  id: string;
  loadNumber: string;
  status: "assigned" | "en_route_pickup" | "at_pickup" | "loading" | "en_route_delivery" | "at_delivery" | "unloading";
  shipper: string;
  commodity: string;
  hazmatClass: string;
  unNumber: string;
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  pickupTime: string;
  deliveryTime: string;
  rate: number;
  miles: number;
  specialInstructions?: string;
}

interface DriverStats {
  hosRemaining: {
    driving: number;
    onDuty: number;
    cycle: number;
  };
  currentStatus: "driving" | "on_duty" | "off_duty" | "sleeper";
  statusSince: string;
  breakRequired: boolean;
  breakDueIn?: number;
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  milesThisWeek: number;
}

const MOCK_LOAD: CurrentLoad = {
  id: "l1",
  loadNumber: "LOAD-45901",
  status: "en_route_delivery",
  shipper: "Shell Oil Company",
  commodity: "Gasoline",
  hazmatClass: "3",
  unNumber: "UN1203",
  origin: {
    name: "Shell Houston Terminal",
    address: "1234 Industrial Blvd",
    city: "Houston",
    state: "TX",
  },
  destination: {
    name: "Dallas Distribution Center",
    address: "5678 Commerce St",
    city: "Dallas",
    state: "TX",
  },
  pickupTime: "08:00 AM",
  deliveryTime: "4:00 PM",
  rate: 850,
  miles: 250,
  specialInstructions: "Check in at gate 3. Unload at rack 12.",
};

const MOCK_STATS: DriverStats = {
  hosRemaining: {
    driving: 510, // 8h 30m in minutes
    onDuty: 720, // 12h
    cycle: 3600, // 60h
  },
  currentStatus: "driving",
  statusSince: "08:15 AM",
  breakRequired: false,
  breakDueIn: 180, // 3 hours
  earnings: {
    today: 850,
    week: 3400,
    month: 12500,
  },
  milesThisWeek: 1250,
};

const STATUS_LABELS = {
  assigned: "Assigned",
  en_route_pickup: "En Route to Pickup",
  at_pickup: "At Pickup",
  loading: "Loading",
  en_route_delivery: "En Route to Delivery",
  at_delivery: "At Delivery",
  unloading: "Unloading",
};

const STATUS_COLORS = {
  driving: { bg: "bg-green-500", text: "text-green-400" },
  on_duty: { bg: "bg-blue-500", text: "text-blue-400" },
  off_duty: { bg: "bg-slate-500", text: "text-slate-400" },
  sleeper: { bg: "bg-purple-500", text: "text-purple-400" },
};

function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}h ${minutes}m`;
}

interface DriverDashboardProps {
  driverName: string;
  vehicleNumber: string;
}

export function DriverDashboard({ driverName, vehicleNumber }: DriverDashboardProps) {
  const [currentLoad] = useState<CurrentLoad | null>(MOCK_LOAD);
  const [stats] = useState<DriverStats>(MOCK_STATS);
  const [dutyStatus, setDutyStatus] = useState<DriverStats["currentStatus"]>(stats.currentStatus);

  const handleStatusChange = (newStatus: DriverStats["currentStatus"]) => {
    setDutyStatus(newStatus);
    toast.success(`Status changed to ${newStatus.replace("_", " ")}`);
  };

  const handleAction = (action: string) => {
    toast.success(`${action} recorded`);
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{driverName}</h1>
          <p className="text-sm text-slate-400">Unit #{vehicleNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full animate-pulse", STATUS_COLORS[dutyStatus].bg)} />
          <span className={cn("text-sm font-medium capitalize", STATUS_COLORS[dutyStatus].text)}>
            {dutyStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* HOS Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Hours of Service</span>
            <Badge variant="outline" className="text-xs text-slate-400">
              Since {stats.statusSince}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Driving Time */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Driving</span>
                <span className={stats.hosRemaining.driving > 120 ? "text-green-400" : "text-yellow-400"}>
                  {formatMinutes(stats.hosRemaining.driving)} left
                </span>
              </div>
              <Progress 
                value={(stats.hosRemaining.driving / 660) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>

            {/* On-Duty Time */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">On-Duty</span>
                <span className="text-blue-400">{formatMinutes(stats.hosRemaining.onDuty)} left</span>
              </div>
              <Progress 
                value={(stats.hosRemaining.onDuty / 840) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>

            {/* 70-Hour Cycle */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">70-Hour Cycle</span>
                <span className="text-purple-400">{formatMinutes(stats.hosRemaining.cycle)} left</span>
              </div>
              <Progress 
                value={(stats.hosRemaining.cycle / 4200) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
          </div>

          {/* Break Warning */}
          {stats.breakDueIn && stats.breakDueIn < 240 && (
            <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">
                30-min break required in {formatMinutes(stats.breakDueIn)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duty Status Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {(["driving", "on_duty", "off_duty", "sleeper"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={dutyStatus === status ? "default" : "outline"}
            onClick={() => handleStatusChange(status)}
            className={cn(
              "flex flex-col h-16 text-xs",
              dutyStatus === status && STATUS_COLORS[status].bg,
              dutyStatus !== status && "border-slate-600"
            )}
          >
            {status === "driving" && <Play className="w-4 h-4 mb-1" />}
            {status === "on_duty" && <Truck className="w-4 h-4 mb-1" />}
            {status === "off_duty" && <Pause className="w-4 h-4 mb-1" />}
            {status === "sleeper" && <Square className="w-4 h-4 mb-1" />}
            <span className="capitalize">{status.replace("_", " ")}</span>
          </Button>
        ))}
      </div>

      {/* Current Load */}
      {currentLoad && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                {currentLoad.loadNumber}
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400">
                {STATUS_LABELS[currentLoad.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Commodity */}
            <div className="flex items-center gap-3 p-3 rounded bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-white font-medium">{currentLoad.commodity}</p>
                <p className="text-xs text-orange-400">
                  Class {currentLoad.hazmatClass} • {currentLoad.unNumber}
                </p>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Pickup • {currentLoad.pickupTime}</p>
                  <p className="text-sm text-white">{currentLoad.origin.name}</p>
                  <p className="text-xs text-slate-500">
                    {currentLoad.origin.city}, {currentLoad.origin.state}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              </div>

              <div className="ml-3 border-l-2 border-dashed border-slate-600 h-4" />

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Delivery • {currentLoad.deliveryTime}</p>
                  <p className="text-sm text-white">{currentLoad.destination.name}</p>
                  <p className="text-xs text-slate-500">
                    {currentLoad.destination.city}, {currentLoad.destination.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {currentLoad.specialInstructions && (
              <div className="p-2 rounded bg-slate-700/50 text-xs text-slate-300">
                <p className="text-slate-400 mb-1">Instructions:</p>
                {currentLoad.specialInstructions}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction("Navigate")}>
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              <Button variant="outline" className="border-slate-600" onClick={() => handleAction("Call")}>
                <Phone className="w-4 h-4 mr-2" />
                Call Shipper
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 border-slate-600"
                onClick={() => handleAction("Arrived at Delivery")}
              >
                <MapPin className="w-3 h-3 mr-1" />
                Arrived
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 border-slate-600"
                onClick={() => handleAction("Photo uploaded")}
              >
                <Camera className="w-3 h-3 mr-1" />
                Photo
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 border-slate-600"
                onClick={() => handleAction("Documents")}
              >
                <FileText className="w-3 h-3 mr-1" />
                Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Earnings</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400">Today</p>
              <p className="text-lg font-bold text-green-400">${stats.earnings.today}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">This Week</p>
              <p className="text-lg font-bold text-white">${stats.earnings.week.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">This Month</p>
              <p className="text-lg font-bold text-white">${stats.earnings.month.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400">Miles this week</span>
            <span className="text-white">{stats.milesThisWeek.toLocaleString()} mi</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Pre-trip inspection")}>
          <CheckCircle className="w-5 h-5 mb-1 text-green-400" />
          <span className="text-xs">Pre-Trip</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("DVIR")}>
          <FileText className="w-5 h-5 mb-1 text-blue-400" />
          <span className="text-xs">DVIR</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Fuel stop")}>
          <Fuel className="w-5 h-5 mb-1 text-yellow-400" />
          <span className="text-xs">Fuel Stop</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Report issue")}>
          <AlertTriangle className="w-5 h-5 mb-1 text-red-400" />
          <span className="text-xs">Report Issue</span>
        </Button>
      </div>
    </div>
  );
}

export default DriverDashboard;
