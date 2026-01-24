/**
 * LOAD TRACKING PAGE
 * Real-time GPS tracking for shipments
 * Based on multiple user journey documents
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, Truck, Clock, Phone, MessageSquare, Navigation,
  Search, Filter, RefreshCw, AlertTriangle, CheckCircle,
  Package, ChevronRight, Thermometer, Gauge, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadTracker } from "@/components/tracking/LoadTracker";

interface TrackedLoad {
  id: string;
  loadNumber: string;
  status: "dispatched" | "en_route_pickup" | "at_pickup" | "loading" | "en_route_delivery" | "at_delivery" | "unloading" | "delivered";
  carrier: string;
  driver: string;
  driverPhone: string;
  vehicle: string;
  trailer: string;
  commodity: string;
  hazmatClass?: string;
  origin: { city: string; state: string; address: string };
  destination: { city: string; state: string; address: string };
  currentLocation: { city: string; state: string; lat: number; lng: number };
  eta: string;
  progress: number;
  lastUpdate: string;
  alerts: string[];
  temperature?: number;
  speed?: number;
}

const MOCK_TRACKED_LOADS: TrackedLoad[] = [
  {
    id: "l1", loadNumber: "LOAD-45901", status: "en_route_delivery",
    carrier: "ABC Transport", driver: "John Smith", driverPhone: "(555) 123-4567",
    vehicle: "TRK-101", trailer: "TRL-201", commodity: "Gasoline", hazmatClass: "3",
    origin: { city: "Houston", state: "TX", address: "Shell Terminal, 1234 Industrial Blvd" },
    destination: { city: "Dallas", state: "TX", address: "Distribution Center, 5678 Commerce St" },
    currentLocation: { city: "Waco", state: "TX", lat: 31.5493, lng: -97.1467 },
    eta: "4:30 PM", progress: 65, lastUpdate: "2 min ago", alerts: [],
    temperature: 72, speed: 62
  },
  {
    id: "l2", loadNumber: "LOAD-45902", status: "loading",
    carrier: "XYZ Hazmat", driver: "Maria Garcia", driverPhone: "(555) 234-5678",
    vehicle: "TRK-205", trailer: "TRL-310", commodity: "Diesel Fuel", hazmatClass: "3",
    origin: { city: "Beaumont", state: "TX", address: "Exxon Refinery, Port Access Rd" },
    destination: { city: "San Antonio", state: "TX", address: "SA Terminal, Loop 410" },
    currentLocation: { city: "Beaumont", state: "TX", lat: 30.0802, lng: -94.1266 },
    eta: "8:00 PM", progress: 15, lastUpdate: "5 min ago", alerts: ["Loading in progress"],
    speed: 0
  },
  {
    id: "l3", loadNumber: "LOAD-45903", status: "dispatched",
    carrier: "SafeHaul Inc", driver: "Robert Johnson", driverPhone: "(555) 345-6789",
    vehicle: "TRK-312", trailer: "TRL-415", commodity: "Jet Fuel", hazmatClass: "3",
    origin: { city: "Port Arthur", state: "TX", address: "Valero Terminal" },
    destination: { city: "Austin", state: "TX", address: "Austin-Bergstrom Airport" },
    currentLocation: { city: "Port Arthur", state: "TX", lat: 29.8850, lng: -93.9400 },
    eta: "Tomorrow 6:00 AM", progress: 0, lastUpdate: "10 min ago", 
    alerts: ["Driver assigned - awaiting dispatch confirmation"]
  },
  {
    id: "l4", loadNumber: "LOAD-45900", status: "at_delivery",
    carrier: "ProChem Transport", driver: "Sarah Williams", driverPhone: "(555) 456-7890",
    vehicle: "TRK-418", trailer: "TRL-520", commodity: "Ethanol", hazmatClass: "3",
    origin: { city: "Corpus Christi", state: "TX", address: "Citgo Terminal" },
    destination: { city: "Houston", state: "TX", address: "Houston Terminal" },
    currentLocation: { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
    eta: "Arrived", progress: 95, lastUpdate: "1 min ago", alerts: ["Awaiting unload dock assignment"],
    temperature: 70, speed: 0
  },
];

const STATUS_LABELS: Record<string, string> = {
  dispatched: "Dispatched",
  en_route_pickup: "En Route to Pickup",
  at_pickup: "At Pickup",
  loading: "Loading",
  en_route_delivery: "En Route to Delivery",
  at_delivery: "At Delivery",
  unloading: "Unloading",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  dispatched: "bg-blue-500/20 text-blue-400",
  en_route_pickup: "bg-cyan-500/20 text-cyan-400",
  at_pickup: "bg-yellow-500/20 text-yellow-400",
  loading: "bg-orange-500/20 text-orange-400",
  en_route_delivery: "bg-green-500/20 text-green-400",
  at_delivery: "bg-purple-500/20 text-purple-400",
  unloading: "bg-pink-500/20 text-pink-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
};

export default function LoadTracking() {
  const [trackedLoads] = useState<TrackedLoad[]>(MOCK_TRACKED_LOADS);
  const [selectedLoad, setSelectedLoad] = useState<TrackedLoad | null>(MOCK_TRACKED_LOADS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const filteredLoads = trackedLoads.filter(load =>
    load.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.destination.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Tracking</h1>
          <p className="text-slate-400">Real-time GPS tracking for active shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" className="border-slate-600" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">In Transit</p>
                <p className="text-2xl font-bold text-green-400">
                  {trackedLoads.filter(l => l.status.includes("en_route")).length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">At Location</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {trackedLoads.filter(l => l.status.includes("at_") || l.status === "loading" || l.status === "unloading").length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Dispatched</p>
                <p className="text-2xl font-bold text-blue-400">
                  {trackedLoads.filter(l => l.status === "dispatched").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Alerts</p>
                <p className="text-2xl font-bold text-red-400">
                  {trackedLoads.reduce((sum, l) => sum + l.alerts.length, 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Active Shipments</CardTitle>
              <Badge variant="outline" className="text-slate-400">
                {filteredLoads.length}
              </Badge>
            </div>
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search loads..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-700/50">
              {filteredLoads.map((load) => (
                <div
                  key={load.id}
                  onClick={() => setSelectedLoad(load)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    selectedLoad?.id === load.id ? "bg-blue-500/10" : "hover:bg-slate-700/30",
                    load.alerts.length > 0 && "border-l-2 border-l-yellow-500"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-white">{load.loadNumber}</span>
                    <Badge className={STATUS_COLORS[load.status]}>
                      {STATUS_LABELS[load.status]}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3 h-3" />
                      {load.carrier} • {load.driver}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {load.currentLocation.city}, {load.currentLocation.state}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      ETA: {load.eta}
                    </div>
                  </div>

                  {load.alerts.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                      <AlertTriangle className="w-3 h-3" />
                      {load.alerts[0]}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${load.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLoad ? (
            <>
              {/* Map Placeholder */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-0">
                  <div className="h-64 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                    <div className="text-center z-10">
                      <Navigation className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-pulse" />
                      <p className="text-slate-400">Interactive Map View</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedLoad.currentLocation.city}, {selectedLoad.currentLocation.state}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Lat: {selectedLoad.currentLocation.lat.toFixed(4)}, Lng: {selectedLoad.currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                    
                    {/* Simulated route line */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{selectedLoad.origin.city}</span>
                        <span>{selectedLoad.destination.city}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full mt-1 relative">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                          style={{ width: `${selectedLoad.progress}%` }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 rounded-full -top-1 border-2 border-white shadow-lg"
                          style={{ left: `calc(${selectedLoad.progress}% - 8px)` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Load Details */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-400" />
                        {selectedLoad.loadNumber}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedLoad.commodity}
                        {selectedLoad.hazmatClass && (
                          <Badge className="ml-2 bg-orange-500/20 text-orange-400">
                            Class {selectedLoad.hazmatClass}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <Badge className={cn("text-sm px-3 py-1", STATUS_COLORS[selectedLoad.status])}>
                      {STATUS_LABELS[selectedLoad.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Driver Info */}
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedLoad.driver}</p>
                          <p className="text-sm text-slate-400">{selectedLoad.carrier}</p>
                          <p className="text-xs text-slate-500">{selectedLoad.vehicle} / {selectedLoad.trailer}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Origin</p>
                      <p className="text-white font-medium">{selectedLoad.origin.city}, {selectedLoad.origin.state}</p>
                      <p className="text-xs text-slate-500">{selectedLoad.origin.address}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Destination</p>
                      <p className="text-white font-medium">{selectedLoad.destination.city}, {selectedLoad.destination.state}</p>
                      <p className="text-xs text-slate-500">{selectedLoad.destination.address}</p>
                    </div>
                  </div>

                  {/* Telemetry */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">ETA</p>
                      <p className="text-white font-medium">{selectedLoad.eta}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <Activity className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Progress</p>
                      <p className="text-white font-medium">{selectedLoad.progress}%</p>
                    </div>
                    {selectedLoad.speed !== undefined && (
                      <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                        <Gauge className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">Speed</p>
                        <p className="text-white font-medium">{selectedLoad.speed} mph</p>
                      </div>
                    )}
                    {selectedLoad.temperature !== undefined && (
                      <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                        <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">Temp</p>
                        <p className="text-white font-medium">{selectedLoad.temperature}°F</p>
                      </div>
                    )}
                  </div>

                  {/* Last Update */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
                    <span>Last GPS update: {selectedLoad.lastUpdate}</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live tracking active
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Select a load to view tracking details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
