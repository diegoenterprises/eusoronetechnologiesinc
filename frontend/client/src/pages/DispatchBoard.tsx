/**
 * DISPATCH BOARD
 * Catalyst/Dispatcher dashboard for managing loads and driver assignments
 * Based on 05_CATALYST_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Truck, Clock, MapPin, AlertTriangle, User, Phone,
  CheckCircle, XCircle, Search, Filter, ChevronRight,
  Package, Route, Fuel, Shield, Star, Radio, X, Send,
  Play, Pause, AlertCircle, MessageSquare, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LoadStatus = "unassigned" | "assigned" | "en_route" | "loading" | "in_transit" | "delivering" | "completed" | "issue";
type DriverStatus = "available" | "driving" | "on_duty" | "off_duty" | "sleeper";

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  currentLocation: string;
  truckNumber: string;
  trailerNumber?: string;
  hos: {
    driving: number;
    onDuty: number;
    cycle: number;
  };
  hasHazmat: boolean;
  hasTank: boolean;
  hasTwic: boolean;
  rating: number;
  currentLoadId?: string;
}

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  commodity: string;
  hazmatClass?: string;
  weight: number;
  origin: { city: string; state: string; facility: string };
  destination: { city: string; state: string; facility: string };
  pickupTime: string;
  deliveryTime: string;
  miles: number;
  rate: number;
  assignedDriverId?: string;
  priority: "normal" | "high" | "urgent";
  notes?: string;
}

const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv_001",
    name: "Mike Johnson",
    phone: "(555) 123-4567",
    status: "available",
    currentLocation: "Houston, TX",
    truckNumber: "TRK-4521",
    trailerNumber: "TRL-8847",
    hos: { driving: 4.5, onDuty: 6.0, cycle: 18.0 },
    hasHazmat: true,
    hasTank: true,
    hasTwic: true,
    rating: 4.8,
  },
  {
    id: "drv_002",
    name: "Sarah Williams",
    phone: "(555) 234-5678",
    status: "driving",
    currentLocation: "San Antonio, TX",
    truckNumber: "TRK-4522",
    trailerNumber: "TRL-8848",
    hos: { driving: 2.0, onDuty: 3.5, cycle: 22.0 },
    hasHazmat: true,
    hasTank: true,
    hasTwic: false,
    rating: 4.9,
    currentLoadId: "load_003",
  },
  {
    id: "drv_003",
    name: "Tom Brown",
    phone: "(555) 345-6789",
    status: "on_duty",
    currentLocation: "Austin, TX",
    truckNumber: "TRK-4523",
    trailerNumber: "TRL-8849",
    hos: { driving: 8.0, onDuty: 10.0, cycle: 45.0 },
    hasHazmat: true,
    hasTank: true,
    hasTwic: true,
    rating: 4.6,
    currentLoadId: "load_002",
  },
  {
    id: "drv_004",
    name: "Lisa Chen",
    phone: "(555) 456-7890",
    status: "off_duty",
    currentLocation: "Dallas, TX",
    truckNumber: "TRK-4524",
    hos: { driving: 0, onDuty: 0, cycle: 35.0 },
    hasHazmat: false,
    hasTank: true,
    hasTwic: true,
    rating: 4.7,
  },
];

const MOCK_LOADS: Load[] = [
  {
    id: "load_001",
    loadNumber: "LD-2025-0851",
    status: "unassigned",
    commodity: "Gasoline, Unleaded",
    hazmatClass: "3",
    weight: 42000,
    origin: { city: "Texas City", state: "TX", facility: "Marathon Terminal" },
    destination: { city: "Austin", state: "TX", facility: "QuikTrip #4521" },
    pickupTime: "2025-01-24T06:00:00",
    deliveryTime: "2025-01-24T14:00:00",
    miles: 195,
    rate: 1850,
    priority: "high",
  },
  {
    id: "load_002",
    loadNumber: "LD-2025-0852",
    status: "loading",
    commodity: "Diesel #2",
    hazmatClass: "3",
    weight: 40000,
    origin: { city: "Houston", state: "TX", facility: "Shell Terminal" },
    destination: { city: "San Antonio", state: "TX", facility: "HEB Fuel Center" },
    pickupTime: "2025-01-24T08:00:00",
    deliveryTime: "2025-01-24T15:00:00",
    miles: 200,
    rate: 1750,
    assignedDriverId: "drv_003",
    priority: "normal",
  },
  {
    id: "load_003",
    loadNumber: "LD-2025-0853",
    status: "in_transit",
    commodity: "Jet Fuel A",
    hazmatClass: "3",
    weight: 45000,
    origin: { city: "Beaumont", state: "TX", facility: "Valero Terminal" },
    destination: { city: "DFW Airport", state: "TX", facility: "Fuel Farm" },
    pickupTime: "2025-01-24T05:00:00",
    deliveryTime: "2025-01-24T12:00:00",
    miles: 275,
    rate: 2200,
    assignedDriverId: "drv_002",
    priority: "urgent",
  },
  {
    id: "load_004",
    loadNumber: "LD-2025-0854",
    status: "unassigned",
    commodity: "Propane",
    hazmatClass: "2.1",
    weight: 38000,
    origin: { city: "Corpus Christi", state: "TX", facility: "NGL Terminal" },
    destination: { city: "Laredo", state: "TX", facility: "Propane Depot" },
    pickupTime: "2025-01-25T07:00:00",
    deliveryTime: "2025-01-25T14:00:00",
    miles: 150,
    rate: 1400,
    priority: "normal",
  },
  {
    id: "load_005",
    loadNumber: "LD-2025-0855",
    status: "issue",
    commodity: "Gasoline, Premium",
    hazmatClass: "3",
    weight: 42000,
    origin: { city: "Galveston", state: "TX", facility: "Port Terminal" },
    destination: { city: "Houston", state: "TX", facility: "Costco #1234" },
    pickupTime: "2025-01-24T09:00:00",
    deliveryTime: "2025-01-24T12:00:00",
    miles: 50,
    rate: 650,
    priority: "urgent",
    notes: "Truck breakdown - waiting for roadside assistance",
  },
];

const STATUS_CONFIG: Record<LoadStatus, { color: string; label: string }> = {
  unassigned: { color: "bg-slate-500/20 text-slate-400", label: "Unassigned" },
  assigned: { color: "bg-blue-500/20 text-blue-400", label: "Assigned" },
  en_route: { color: "bg-yellow-500/20 text-yellow-400", label: "En Route to Pickup" },
  loading: { color: "bg-orange-500/20 text-orange-400", label: "Loading" },
  in_transit: { color: "bg-green-500/20 text-green-400", label: "In Transit" },
  delivering: { color: "bg-cyan-500/20 text-cyan-400", label: "Delivering" },
  completed: { color: "bg-slate-500/20 text-slate-400", label: "Completed" },
  issue: { color: "bg-red-500/20 text-red-400", label: "Issue" },
};

const DRIVER_STATUS_CONFIG: Record<DriverStatus, { color: string; label: string }> = {
  available: { color: "bg-green-500", label: "Available" },
  driving: { color: "bg-blue-500", label: "Driving" },
  on_duty: { color: "bg-yellow-500", label: "On Duty" },
  off_duty: { color: "bg-slate-500", label: "Off Duty" },
  sleeper: { color: "bg-purple-500", label: "Sleeper" },
};

export default function DispatchBoard() {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>(MOCK_LOADS);
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusCounts = () => {
    return {
      unassigned: loads.filter(l => l.status === "unassigned").length,
      en_route: loads.filter(l => l.status === "en_route").length,
      loading: loads.filter(l => l.status === "loading").length,
      in_transit: loads.filter(l => l.status === "in_transit").length,
      issue: loads.filter(l => l.status === "issue").length,
    };
  };

  const counts = getStatusCounts();

  const filteredLoads = loads.filter(load => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!load.loadNumber.toLowerCase().includes(q) && 
          !load.commodity.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterStatus !== "all" && load.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const getAvailableDrivers = (load: Load) => {
    return drivers.filter(d => {
      if (d.status === "off_duty" || d.status === "sleeper") return false;
      if (d.currentLoadId) return false;
      if (load.hazmatClass && !d.hasHazmat) return false;
      if (d.hos.driving < 4) return false;
      return true;
    });
  };

  const assignDriver = (loadId: string, driverId: string) => {
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        return { ...load, status: "assigned" as LoadStatus, assignedDriverId: driverId };
      }
      return load;
    }));
    toast.success("Driver assigned successfully");
    setShowAssignModal(false);
    setSelectedLoad(null);
  };

  const getDriver = (driverId?: string) => {
    return drivers.find(d => d.id === driverId);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dispatch Board</h1>
          <p className="text-slate-400 text-sm">Manage loads and driver assignments</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-400">{counts.unassigned}</p>
            <p className="text-sm text-slate-500">Unassigned</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{counts.en_route}</p>
            <p className="text-sm text-yellow-500/70">En Route</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{counts.loading}</p>
            <p className="text-sm text-orange-500/70">Loading</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{counts.in_transit}</p>
            <p className="text-sm text-green-500/70">In Transit</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{counts.issue}</p>
            <p className="text-sm text-red-500/70">Issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search loads..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "unassigned", "in_transit", "issue"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "bg-blue-600" : "border-slate-600"}
                  size="sm"
                >
                  {status === "all" ? "All" : STATUS_CONFIG[status as LoadStatus]?.label || status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loads List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Active Loads</h2>
          {filteredLoads.map((load) => {
            const driver = getDriver(load.assignedDriverId);
            return (
              <Card 
                key={load.id}
                className={cn(
                  "bg-slate-800/50 border-slate-700 cursor-pointer transition-colors hover:border-slate-500",
                  load.priority === "urgent" && "border-l-4 border-l-red-500",
                  load.priority === "high" && "border-l-4 border-l-orange-500"
                )}
                onClick={() => { setSelectedLoad(load); setShowAssignModal(true); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{load.loadNumber}</span>
                        {load.hazmatClass && (
                          <Badge className="bg-red-500/20 text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Class {load.hazmatClass}
                          </Badge>
                        )}
                        {load.priority === "urgent" && (
                          <Badge className="bg-red-500 text-white">URGENT</Badge>
                        )}
                        {load.priority === "high" && (
                          <Badge className="bg-orange-500 text-white">HIGH</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{load.commodity}</p>
                    </div>
                    <Badge className={STATUS_CONFIG[load.status].color}>
                      {STATUS_CONFIG[load.status].label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{load.origin.city}, {load.origin.state}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>{load.destination.city}, {load.destination.state}</span>
                    <span className="text-slate-500">({load.miles} mi)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-slate-400">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(load.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-green-400 font-medium">
                        ${load.rate.toLocaleString()}
                      </div>
                    </div>
                    {driver ? (
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", DRIVER_STATUS_CONFIG[driver.status].color)} />
                        <span className="text-white text-sm">{driver.name}</span>
                      </div>
                    ) : (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Assign Driver
                      </Button>
                    )}
                  </div>

                  {load.notes && (
                    <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {load.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Drivers Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Driver Status</h2>
          {drivers.map((driver) => (
            <Card key={driver.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-sm text-slate-400">{driver.truckNumber}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-white", DRIVER_STATUS_CONFIG[driver.status].color)}>
                    {DRIVER_STATUS_CONFIG[driver.status].label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{driver.currentLocation}</span>
                </div>

                {/* HOS */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Driving</span>
                    <span className={cn(
                      driver.hos.driving >= 9 ? "text-red-400" : 
                      driver.hos.driving >= 7 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {driver.hos.driving}h remaining
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        driver.hos.driving >= 9 ? "bg-red-500" : 
                        driver.hos.driving >= 7 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${(driver.hos.driving / 11) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Endorsements */}
                <div className="flex gap-1 mb-3">
                  {driver.hasHazmat && <Badge className="bg-red-500/20 text-red-400 text-xs">H</Badge>}
                  {driver.hasTank && <Badge className="bg-blue-500/20 text-blue-400 text-xs">N</Badge>}
                  {driver.hasTwic && <Badge className="bg-purple-500/20 text-purple-400 text-xs">TWIC</Badge>}
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-white">{driver.rating}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedLoad && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Assign Driver</CardTitle>
                  <p className="text-slate-400 text-sm">{selectedLoad.loadNumber}</p>
                </div>
                <Button variant="ghost" onClick={() => { setShowAssignModal(false); setSelectedLoad(null); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Load Summary */}
              <div className="p-4 rounded-lg bg-slate-700/30 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">{selectedLoad.commodity}</span>
                  {selectedLoad.hazmatClass && (
                    <Badge className="bg-red-500/20 text-red-400">Class {selectedLoad.hazmatClass}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{selectedLoad.origin.city}, {selectedLoad.origin.state}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{selectedLoad.destination.city}, {selectedLoad.destination.state}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-400">{selectedLoad.miles} miles</span>
                  <span className="text-green-400 font-medium">${selectedLoad.rate.toLocaleString()}</span>
                </div>
              </div>

              {/* Available Drivers */}
              <h4 className="text-white font-medium mb-4">Available Drivers</h4>
              <div className="space-y-3">
                {getAvailableDrivers(selectedLoad).length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No available drivers match requirements</p>
                  </div>
                ) : (
                  getAvailableDrivers(selectedLoad).map((driver) => (
                    <div 
                      key={driver.id}
                      className="p-4 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-sm text-slate-400">{driver.currentLocation}</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => assignDriver(selectedLoad.id, driver.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Assign
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">HOS Available</p>
                          <p className="text-white">{driver.hos.driving}h driving</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Equipment</p>
                          <p className="text-white">{driver.truckNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-white">{driver.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-3">
                        {driver.hasHazmat && <Badge className="bg-red-500/20 text-red-400 text-xs">Hazmat</Badge>}
                        {driver.hasTank && <Badge className="bg-blue-500/20 text-blue-400 text-xs">Tank</Badge>}
                        {driver.hasTwic && <Badge className="bg-purple-500/20 text-purple-400 text-xs">TWIC</Badge>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
