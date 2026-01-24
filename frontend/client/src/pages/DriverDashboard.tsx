/**
 * DRIVER DASHBOARD
 * Mobile-optimized dashboard for drivers with HOS tracking, current load, and quick actions
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Truck, Clock, MapPin, Navigation, Phone, FileText,
  CheckCircle, AlertTriangle, Play, Pause, Square, Coffee,
  Fuel, Camera, MessageSquare, DollarSign, Shield, Star,
  ChevronRight, Thermometer, Gauge, Route, Calendar,
  ClipboardCheck, AlertCircle, Map, Bell, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HOSStatus {
  currentStatus: "driving" | "on_duty" | "sleeper" | "off_duty";
  driving: { used: number; available: number };
  onDuty: { used: number; available: number };
  cycle: { used: number; available: number };
  breakRequired: boolean;
  breakTimeRemaining: number;
  lastStatusChange: string;
}

interface CurrentLoad {
  id: string;
  loadNumber: string;
  status: "assigned" | "en_route_pickup" | "at_pickup" | "loaded" | "in_transit" | "at_delivery" | "delivered";
  commodity: string;
  hazmatClass?: string;
  weight: number;
  pickup: {
    name: string;
    address: string;
    city: string;
    state: string;
    appointmentTime: string;
  };
  delivery: {
    name: string;
    address: string;
    city: string;
    state: string;
    appointmentTime: string;
  };
  rate: number;
  miles: number;
  eta: string;
  specialInstructions?: string;
}

const MOCK_HOS: HOSStatus = {
  currentStatus: "driving",
  driving: { used: 6.5, available: 4.5 },
  onDuty: { used: 8.0, available: 6.0 },
  cycle: { used: 52.0, available: 18.0 },
  breakRequired: false,
  breakTimeRemaining: 90,
  lastStatusChange: "2025-01-23T10:30:00",
};

const MOCK_LOAD: CurrentLoad = {
  id: "load_001",
  loadNumber: "LD-2025-0847",
  status: "in_transit",
  commodity: "Gasoline, Unleaded",
  hazmatClass: "3",
  weight: 42000,
  pickup: {
    name: "Marathon Petroleum Terminal",
    address: "1200 Industrial Blvd",
    city: "Texas City",
    state: "TX",
    appointmentTime: "2025-01-23T06:00:00",
  },
  delivery: {
    name: "QuikTrip #4521",
    address: "8900 Highway 290",
    city: "Austin",
    state: "TX",
    appointmentTime: "2025-01-23T14:00:00",
  },
  rate: 1850,
  miles: 195,
  eta: "2025-01-23T13:45:00",
  specialInstructions: "Call 30 minutes before arrival. Use rear entrance.",
};

const STATUS_COLORS = {
  driving: "bg-green-500",
  on_duty: "bg-blue-500",
  sleeper: "bg-purple-500",
  off_duty: "bg-slate-500",
};

const STATUS_LABELS = {
  driving: "Driving",
  on_duty: "On Duty",
  sleeper: "Sleeper Berth",
  off_duty: "Off Duty",
};

const LOAD_STATUS_LABELS = {
  assigned: "Assigned",
  en_route_pickup: "En Route to Pickup",
  at_pickup: "At Pickup",
  loaded: "Loaded",
  in_transit: "In Transit",
  at_delivery: "At Delivery",
  delivered: "Delivered",
};

const LOAD_STATUS_COLORS = {
  assigned: "bg-blue-500/20 text-blue-400",
  en_route_pickup: "bg-yellow-500/20 text-yellow-400",
  at_pickup: "bg-orange-500/20 text-orange-400",
  loaded: "bg-purple-500/20 text-purple-400",
  in_transit: "bg-green-500/20 text-green-400",
  at_delivery: "bg-cyan-500/20 text-cyan-400",
  delivered: "bg-slate-500/20 text-slate-400",
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [hos, setHos] = useState<HOSStatus>(MOCK_HOS);
  const [currentLoad] = useState<CurrentLoad | null>(MOCK_LOAD);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleStatusChange = (newStatus: HOSStatus["currentStatus"]) => {
    setHos({ ...hos, currentStatus: newStatus, lastStatusChange: new Date().toISOString() });
    toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
  };

  const getProgressColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-slate-400 text-sm">Welcome back, {user?.name || "Driver"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* HOS Status Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Hours of Service
            </CardTitle>
            <Badge className={cn("text-white", STATUS_COLORS[hos.currentStatus])}>
              {STATUS_LABELS[hos.currentStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={hos.currentStatus === "driving" ? "default" : "outline"}
              className={cn(
                "flex flex-col h-auto py-3",
                hos.currentStatus === "driving" ? "bg-green-600 hover:bg-green-700" : "border-slate-600"
              )}
              onClick={() => handleStatusChange("driving")}
            >
              <Play className="w-5 h-5 mb-1" />
              <span className="text-xs">Driving</span>
            </Button>
            <Button
              variant={hos.currentStatus === "on_duty" ? "default" : "outline"}
              className={cn(
                "flex flex-col h-auto py-3",
                hos.currentStatus === "on_duty" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600"
              )}
              onClick={() => handleStatusChange("on_duty")}
            >
              <Pause className="w-5 h-5 mb-1" />
              <span className="text-xs">On Duty</span>
            </Button>
            <Button
              variant={hos.currentStatus === "sleeper" ? "default" : "outline"}
              className={cn(
                "flex flex-col h-auto py-3",
                hos.currentStatus === "sleeper" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600"
              )}
              onClick={() => handleStatusChange("sleeper")}
            >
              <Coffee className="w-5 h-5 mb-1" />
              <span className="text-xs">Sleeper</span>
            </Button>
            <Button
              variant={hos.currentStatus === "off_duty" ? "default" : "outline"}
              className={cn(
                "flex flex-col h-auto py-3",
                hos.currentStatus === "off_duty" ? "bg-slate-600 hover:bg-slate-500" : "border-slate-600"
              )}
              onClick={() => handleStatusChange("off_duty")}
            >
              <Square className="w-5 h-5 mb-1" />
              <span className="text-xs">Off Duty</span>
            </Button>
          </div>

          {/* HOS Clocks */}
          <div className="space-y-3">
            {/* Driving */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Driving (11hr)</span>
                <span className="text-white font-medium">
                  {formatHours(hos.driving.available)} remaining
                </span>
              </div>
              <Progress 
                value={(hos.driving.used / 11) * 100} 
                className={cn("h-3", `[&>div]:${getProgressColor(hos.driving.used, 11)}`)}
              />
            </div>
            
            {/* On Duty */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">On Duty (14hr)</span>
                <span className="text-white font-medium">
                  {formatHours(hos.onDuty.available)} remaining
                </span>
              </div>
              <Progress 
                value={(hos.onDuty.used / 14) * 100} 
                className={cn("h-3", `[&>div]:${getProgressColor(hos.onDuty.used, 14)}`)}
              />
            </div>
            
            {/* 70hr Cycle */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">70hr Cycle (8 days)</span>
                <span className="text-white font-medium">
                  {formatHours(hos.cycle.available)} remaining
                </span>
              </div>
              <Progress 
                value={(hos.cycle.used / 70) * 100} 
                className={cn("h-3", `[&>div]:${getProgressColor(hos.cycle.used, 70)}`)}
              />
            </div>
          </div>

          {/* Break Warning */}
          {hos.breakRequired && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200 text-sm">
                30-minute break required within {hos.breakTimeRemaining} minutes
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Load */}
      {currentLoad ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-400" />
                Current Assignment
              </CardTitle>
              <Badge className={LOAD_STATUS_COLORS[currentLoad.status]}>
                {LOAD_STATUS_LABELS[currentLoad.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Load Info */}
            <div className="p-4 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">{currentLoad.loadNumber}</span>
                {currentLoad.hazmatClass && (
                  <Badge className="bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Class {currentLoad.hazmatClass}
                  </Badge>
                )}
              </div>
              <p className="text-slate-300">{currentLoad.commodity}</p>
              <p className="text-sm text-slate-500">{currentLoad.weight.toLocaleString()} lbs</p>
            </div>

            {/* Route */}
            <div className="space-y-3">
              {/* Pickup */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-full bg-slate-600 my-1" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">PICKUP</p>
                  <p className="text-white font-medium">{currentLoad.pickup.name}</p>
                  <p className="text-sm text-slate-400">
                    {currentLoad.pickup.city}, {currentLoad.pickup.state}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(currentLoad.pickup.appointmentTime).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Delivery */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">DELIVERY</p>
                  <p className="text-white font-medium">{currentLoad.delivery.name}</p>
                  <p className="text-sm text-slate-400">
                    {currentLoad.delivery.city}, {currentLoad.delivery.state}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(currentLoad.delivery.appointmentTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* ETA & Miles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                <Route className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-bold">{currentLoad.miles}</p>
                <p className="text-xs text-slate-500">Miles</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold">
                  {new Date(currentLoad.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-500">ETA</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold">${currentLoad.rate}</p>
                <p className="text-xs text-slate-500">Rate</p>
              </div>
            </div>

            {/* Special Instructions */}
            {currentLoad.specialInstructions && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-400 font-medium mb-1">SPECIAL INSTRUCTIONS</p>
                <p className="text-sm text-blue-200">{currentLoad.specialInstructions}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              <Button variant="outline" className="border-slate-600">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Current Assignment</h3>
            <p className="text-slate-400 text-sm mb-4">
              Check the load board for available loads
            </p>
            <Button>
              <Map className="w-4 h-4 mr-2" />
              Find Loads
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <ClipboardCheck className="w-6 h-6 mb-2 text-green-400" />
              <span className="text-sm">Pre-Trip</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <Camera className="w-6 h-6 mb-2 text-blue-400" />
              <span className="text-sm">BOL Photo</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <Fuel className="w-6 h-6 mb-2 text-yellow-400" />
              <span className="text-sm">Fuel Stop</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <AlertCircle className="w-6 h-6 mb-2 text-red-400" />
              <span className="text-sm">Report Issue</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <FileText className="w-6 h-6 mb-2 text-purple-400" />
              <span className="text-sm">Documents</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <MessageSquare className="w-6 h-6 mb-2 text-cyan-400" />
              <span className="text-sm">Messages</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <Gauge className="w-6 h-6 mb-2 text-orange-400" />
              <span className="text-sm">Vehicle</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 border-slate-600 hover:bg-slate-700">
              <Shield className="w-6 h-6 mb-2 text-green-400" />
              <span className="text-sm">ERG Guide</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-2xl font-bold text-white">195</p>
              <p className="text-xs text-slate-500">Miles Driven</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-2xl font-bold text-green-400">$1,850</p>
              <p className="text-xs text-slate-500">Earnings</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-xs text-slate-500">Loads Completed</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-2xl font-bold text-blue-400">98%</p>
              <p className="text-xs text-slate-500">Safety Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Compensation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              This Week
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-400">
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="text-slate-400">Line Haul</span>
              <span className="text-white font-medium">$4,250.00</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="text-slate-400">Fuel Surcharge</span>
              <span className="text-white font-medium">$425.00</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="text-slate-400">Detention</span>
              <span className="text-white font-medium">$150.00</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <span className="text-green-400 font-medium">Total</span>
              <span className="text-green-400 font-bold text-lg">$4,825.00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
