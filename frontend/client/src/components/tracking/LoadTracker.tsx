/**
 * LOAD TRACKER COMPONENT
 * Real-time GPS tracking for active loads
 * Based on user journey documents - 30 second updates
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, Truck, Clock, Navigation, AlertTriangle,
  Phone, MessageSquare, RefreshCw, Thermometer, Fuel
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadTrackingData {
  loadId: string;
  loadNumber: string;
  status: "dispatched" | "at_pickup" | "loading" | "in_transit" | "at_delivery" | "unloading" | "delivered";
  commodity: string;
  origin: {
    city: string;
    state: string;
    address: string;
  };
  destination: {
    city: string;
    state: string;
    address: string;
  };
  currentLocation: {
    lat: number;
    lng: number;
    city: string;
    state: string;
    lastUpdate: string;
  };
  driver: {
    name: string;
    phone: string;
    hosRemaining: string;
    status: "driving" | "on_duty" | "off_duty" | "sleeper";
  };
  vehicle: {
    unitNumber: string;
    type: string;
    temperature?: number;
    fuelLevel?: number;
  };
  eta: {
    time: string;
    status: "on_time" | "early" | "delayed";
    delayReason?: string;
  };
  progress: number;
  milestones: {
    name: string;
    status: "completed" | "current" | "pending";
    time?: string;
  }[];
  alerts: {
    type: "warning" | "info" | "critical";
    message: string;
    time: string;
  }[];
}

interface LoadTrackerProps {
  data: LoadTrackingData;
  onRefresh?: () => void;
  onCallDriver?: () => void;
  onMessage?: () => void;
}

const STATUS_COLORS = {
  dispatched: "bg-blue-500/20 text-blue-400",
  at_pickup: "bg-yellow-500/20 text-yellow-400",
  loading: "bg-orange-500/20 text-orange-400",
  in_transit: "bg-green-500/20 text-green-400",
  at_delivery: "bg-purple-500/20 text-purple-400",
  unloading: "bg-pink-500/20 text-pink-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
};

const STATUS_LABELS = {
  dispatched: "Dispatched",
  at_pickup: "At Pickup",
  loading: "Loading",
  in_transit: "In Transit",
  at_delivery: "At Delivery",
  unloading: "Unloading",
  delivered: "Delivered",
};

export function LoadTracker({ data, onRefresh, onCallDriver, onMessage }: LoadTrackerProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate 30-second auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      onRefresh?.();
    }, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            {data.loadNumber}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[data.status]}>
              {STATUS_LABELS[data.status]}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onRefresh} className="text-slate-400">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-400">{data.commodity}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Route Summary */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400">Origin</p>
            <p className="text-white font-medium">{data.origin.city}, {data.origin.state}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-0.5 w-full bg-slate-600 relative">
              <div 
                className="absolute h-0.5 bg-green-500 left-0 transition-all"
                style={{ width: `${data.progress}%` }}
              />
              <div 
                className="absolute w-3 h-3 bg-green-500 rounded-full -top-1 transition-all"
                style={{ left: `${data.progress}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-slate-400">Destination</p>
            <p className="text-white font-medium">{data.destination.city}, {data.destination.state}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span>{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-2 bg-slate-700" />
        </div>

        {/* Current Location & ETA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-700/30">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Current Location</span>
            </div>
            <p className="text-white font-medium">{data.currentLocation.city}, {data.currentLocation.state}</p>
            <p className="text-xs text-slate-500">Updated {data.currentLocation.lastUpdate}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className={cn(
                "w-4 h-4",
                data.eta.status === "on_time" && "text-green-400",
                data.eta.status === "early" && "text-blue-400",
                data.eta.status === "delayed" && "text-yellow-400"
              )} />
              <span className="text-xs text-slate-400">ETA</span>
            </div>
            <p className="text-white font-medium">{data.eta.time}</p>
            <Badge variant="outline" className={cn(
              "text-xs mt-1",
              data.eta.status === "on_time" && "text-green-400 border-green-500/30",
              data.eta.status === "early" && "text-blue-400 border-blue-500/30",
              data.eta.status === "delayed" && "text-yellow-400 border-yellow-500/30"
            )}>
              {data.eta.status === "on_time" && "On Time"}
              {data.eta.status === "early" && "Early"}
              {data.eta.status === "delayed" && `Delayed: ${data.eta.delayReason}`}
            </Badge>
          </div>
        </div>

        {/* Driver Info */}
        <div className="p-3 rounded-lg bg-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Driver</p>
              <p className="text-white font-medium">{data.driver.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn(
                  "text-xs",
                  data.driver.status === "driving" && "text-green-400 border-green-500/30",
                  data.driver.status === "on_duty" && "text-blue-400 border-blue-500/30",
                  data.driver.status === "off_duty" && "text-slate-400 border-slate-500/30",
                  data.driver.status === "sleeper" && "text-purple-400 border-purple-500/30"
                )}>
                  {data.driver.status.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-400">
                  {data.driver.hosRemaining} HOS remaining
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCallDriver} className="border-slate-600">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onMessage} className="border-slate-600">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-slate-700/30 text-center">
            <Truck className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Unit</p>
            <p className="text-sm text-white font-medium">{data.vehicle.unitNumber}</p>
          </div>
          {data.vehicle.temperature !== undefined && (
            <div className="p-2 rounded-lg bg-slate-700/30 text-center">
              <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Temp</p>
              <p className="text-sm text-white font-medium">{data.vehicle.temperature}°F</p>
            </div>
          )}
          {data.vehicle.fuelLevel !== undefined && (
            <div className="p-2 rounded-lg bg-slate-700/30 text-center">
              <Fuel className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Fuel</p>
              <p className="text-sm text-white font-medium">{data.vehicle.fuelLevel}%</p>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Milestones</p>
          <div className="flex items-center gap-1">
            {data.milestones.map((milestone, idx) => (
              <React.Fragment key={milestone.name}>
                <div className={cn(
                  "flex-1 p-2 rounded text-center text-xs",
                  milestone.status === "completed" && "bg-green-500/20 text-green-400",
                  milestone.status === "current" && "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500",
                  milestone.status === "pending" && "bg-slate-700/30 text-slate-500"
                )}>
                  <p className="font-medium truncate">{milestone.name}</p>
                  {milestone.time && <p className="text-[10px] opacity-75">{milestone.time}</p>}
                </div>
                {idx < data.milestones.length - 1 && (
                  <Navigation className={cn(
                    "w-3 h-3 flex-shrink-0",
                    milestone.status === "completed" ? "text-green-400" : "text-slate-600"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Alerts</p>
            {data.alerts.map((alert, idx) => (
              <div key={idx} className={cn(
                "p-2 rounded-lg flex items-start gap-2 text-sm",
                alert.type === "critical" && "bg-red-500/10 border border-red-500/30",
                alert.type === "warning" && "bg-yellow-500/10 border border-yellow-500/30",
                alert.type === "info" && "bg-blue-500/10 border border-blue-500/30"
              )}>
                <AlertTriangle className={cn(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  alert.type === "critical" && "text-red-400",
                  alert.type === "warning" && "text-yellow-400",
                  alert.type === "info" && "text-blue-400"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    alert.type === "critical" && "text-red-300",
                    alert.type === "warning" && "text-yellow-300",
                    alert.type === "info" && "text-blue-300"
                  )}>{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Update */}
        <p className="text-xs text-slate-500 text-center">
          Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 30s
        </p>
      </CardContent>
    </Card>
  );
}

export default LoadTracker;
