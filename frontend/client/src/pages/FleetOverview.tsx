/**
 * FLEET OVERVIEW PAGE
 * Comprehensive fleet management dashboard
 * Based on 02_CARRIER_USER_JOURNEY.md and 05_CATALYST_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck, MapPin, Fuel, Wrench, AlertTriangle, CheckCircle,
  Clock, Calendar, User, Search, Filter, Plus, Eye,
  Navigation, Thermometer, Activity, TrendingUp, Settings,
  FileText, Shield, DollarSign, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type VehicleStatus = "active" | "idle" | "maintenance" | "out_of_service";
type VehicleType = "tractor" | "trailer" | "tanker" | "flatbed" | "reefer";

interface Vehicle {
  id: string;
  unitNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  currentLocation?: string;
  assignedDriver?: string;
  currentLoad?: string;
  mileage: number;
  fuelLevel: number;
  nextService: string;
  lastInspection: string;
  insuranceExpiry: string;
  registrationExpiry: string;
}

interface FleetStats {
  totalVehicles: number;
  active: number;
  idle: number;
  maintenance: number;
  outOfService: number;
  utilization: number;
  avgMileage: number;
  fuelCostMTD: number;
  maintenanceCostMTD: number;
}

export default function FleetOverview() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const stats: FleetStats = {
    totalVehicles: 45,
    active: 32,
    idle: 8,
    maintenance: 4,
    outOfService: 1,
    utilization: 71,
    avgMileage: 485000,
    fuelCostMTD: 48500,
    maintenanceCostMTD: 12800,
  };

  const vehicles: Vehicle[] = [
    {
      id: "v_001",
      unitNumber: "TRK-4521",
      type: "tractor",
      status: "active",
      make: "Peterbilt",
      model: "579",
      year: 2022,
      vin: "1XPWD40X1ED123456",
      licensePlate: "TX-ABC-1234",
      currentLocation: "I-45 N near Dallas, TX",
      assignedDriver: "Mike Johnson",
      currentLoad: "LOAD-45850",
      mileage: 125000,
      fuelLevel: 72,
      nextService: "2025-02-15",
      lastInspection: "2025-01-10",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_002",
      unitNumber: "TRK-4522",
      type: "tractor",
      status: "active",
      make: "Kenworth",
      model: "T680",
      year: 2023,
      vin: "1XKYD49X2JD789012",
      licensePlate: "TX-DEF-5678",
      currentLocation: "Houston Terminal",
      assignedDriver: "Sarah Williams",
      currentLoad: "LOAD-45852",
      mileage: 85000,
      fuelLevel: 45,
      nextService: "2025-03-01",
      lastInspection: "2025-01-15",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_003",
      unitNumber: "TRK-4523",
      type: "tractor",
      status: "idle",
      make: "Freightliner",
      model: "Cascadia",
      year: 2021,
      vin: "3AKJHHDR5LSLA3456",
      licensePlate: "TX-GHI-9012",
      currentLocation: "Austin Yard",
      mileage: 210000,
      fuelLevel: 88,
      nextService: "2025-01-28",
      lastInspection: "2025-01-05",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_004",
      unitNumber: "TRK-4524",
      type: "tractor",
      status: "maintenance",
      make: "Peterbilt",
      model: "389",
      year: 2020,
      vin: "1XPWD40X0LD654321",
      licensePlate: "TX-JKL-3456",
      currentLocation: "Shop - Engine Repair",
      mileage: 380000,
      fuelLevel: 25,
      nextService: "In Progress",
      lastInspection: "2024-12-20",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_005",
      unitNumber: "TRL-8847",
      type: "tanker",
      status: "active",
      make: "Heil",
      model: "MC-306",
      year: 2021,
      vin: "1H9TC4528MN123456",
      licensePlate: "TX-TRL-1111",
      currentLocation: "I-45 N near Dallas, TX",
      assignedDriver: "Mike Johnson",
      currentLoad: "LOAD-45850",
      mileage: 95000,
      fuelLevel: 0,
      nextService: "2025-02-20",
      lastInspection: "2025-01-10",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_006",
      unitNumber: "TRL-8848",
      type: "tanker",
      status: "idle",
      make: "Polar",
      model: "DOT-407",
      year: 2022,
      vin: "1P9TC4528NN654321",
      licensePlate: "TX-TRL-2222",
      currentLocation: "Houston Terminal",
      mileage: 65000,
      fuelLevel: 0,
      nextService: "2025-03-10",
      lastInspection: "2025-01-12",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
    {
      id: "v_007",
      unitNumber: "TRK-4525",
      type: "tractor",
      status: "out_of_service",
      make: "International",
      model: "LT",
      year: 2019,
      vin: "3HSDJSJR5KN987654",
      licensePlate: "TX-MNO-7890",
      currentLocation: "Awaiting Parts",
      mileage: 520000,
      fuelLevel: 10,
      nextService: "Pending",
      lastInspection: "2024-11-15",
      insuranceExpiry: "2025-06-30",
      registrationExpiry: "2025-12-31",
    },
  ];

  const upcomingMaintenance = [
    { vehicle: "TRK-4523", type: "Oil Change", due: "2025-01-28", miles: 5000 },
    { vehicle: "TRK-4521", type: "DOT Inspection", due: "2025-02-15", miles: null },
    { vehicle: "TRL-8847", type: "Tank Inspection", due: "2025-02-20", miles: null },
    { vehicle: "TRK-4522", type: "Brake Service", due: "2025-03-01", miles: 15000 },
  ];

  const expiringDocuments = [
    { vehicle: "TRK-4524", document: "Annual Inspection", expires: "2025-01-25", daysLeft: 2 },
    { vehicle: "TRL-8849", document: "Tank Test", expires: "2025-01-30", daysLeft: 7 },
    { vehicle: "TRK-4526", document: "Registration", expires: "2025-02-15", daysLeft: 23 },
  ];

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "idle": return "bg-blue-500/20 text-blue-400";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400";
      case "out_of_service": return "bg-red-500/20 text-red-400";
    }
  };

  const getTypeIcon = (type: VehicleType) => {
    switch (type) {
      case "tractor": return Truck;
      case "trailer": case "tanker": case "flatbed": case "reefer": return Truck;
      default: return Truck;
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (searchTerm && !v.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !v.make.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (typeFilter !== "all" && v.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Overview</h1>
          <p className="text-slate-400 text-sm">Manage vehicles, maintenance, and compliance</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.totalVehicles}</p>
            <p className="text-xs text-slate-400">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.idle}</p>
            <p className="text-xs text-slate-400">Idle</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{stats.maintenance}</p>
            <p className="text-xs text-slate-400">Maintenance</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{stats.utilization}%</p>
            <p className="text-xs text-slate-400">Utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Fuel className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Fuel Cost MTD</p>
                  <p className="text-xs text-slate-500">Month to date</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-400">${stats.fuelCostMTD.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Wrench className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Maintenance Cost MTD</p>
                  <p className="text-xs text-slate-500">Month to date</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-400">${stats.maintenanceCostMTD.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-blue-600">Vehicles</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-600">Maintenance</TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-blue-600">Compliance</TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-blue-600">Fleet Map</TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vehicles..."
                className="pl-9 bg-slate-700/50 border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tractor">Tractors</SelectItem>
                <SelectItem value="tanker">Tankers</SelectItem>
                <SelectItem value="trailer">Trailers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredVehicles.map((vehicle) => {
              const TypeIcon = getTypeIcon(vehicle.type);
              return (
                <Card key={vehicle.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          vehicle.status === "active" ? "bg-green-500/20" :
                          vehicle.status === "idle" ? "bg-blue-500/20" :
                          vehicle.status === "maintenance" ? "bg-yellow-500/20" :
                          "bg-red-500/20"
                        )}>
                          <TypeIcon className={cn(
                            "w-6 h-6",
                            vehicle.status === "active" ? "text-green-400" :
                            vehicle.status === "idle" ? "text-blue-400" :
                            vehicle.status === "maintenance" ? "text-yellow-400" :
                            "text-red-400"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{vehicle.unitNumber}</p>
                            <Badge className={getStatusColor(vehicle.status)}>
                              {vehicle.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          {vehicle.currentLocation && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {vehicle.currentLocation}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Fuel Level */}
                        {vehicle.type === "tractor" && (
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Fuel className="w-4 h-4 text-orange-400" />
                              <span className={cn(
                                "font-medium",
                                vehicle.fuelLevel < 25 ? "text-red-400" :
                                vehicle.fuelLevel < 50 ? "text-yellow-400" :
                                "text-green-400"
                              )}>
                                {vehicle.fuelLevel}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Fuel</p>
                          </div>
                        )}

                        {/* Mileage */}
                        <div className="text-center">
                          <p className="text-white font-medium">{(vehicle.mileage / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-slate-500">Miles</p>
                        </div>

                        {/* Driver */}
                        {vehicle.assignedDriver && (
                          <div className="text-center">
                            <p className="text-white font-medium">{vehicle.assignedDriver}</p>
                            <p className="text-xs text-slate-500">Driver</p>
                          </div>
                        )}

                        {/* Actions */}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-yellow-400" />
                  Upcoming Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMaintenance.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">{item.vehicle}</p>
                        <p className="text-sm text-slate-400">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{item.due}</p>
                        {item.miles && (
                          <p className="text-xs text-slate-500">or {item.miles.toLocaleString()} mi</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  In Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicles.filter(v => v.status === "maintenance" || v.status === "out_of_service").map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          vehicle.status === "maintenance" ? "bg-yellow-500/20" : "bg-red-500/20"
                        )}>
                          <Wrench className={cn(
                            "w-4 h-4",
                            vehicle.status === "maintenance" ? "text-yellow-400" : "text-red-400"
                          )} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{vehicle.unitNumber}</p>
                          <p className="text-sm text-slate-400">{vehicle.currentLocation}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Expiring Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      doc.daysLeft <= 7 ? "bg-red-500/10 border border-red-500/30" :
                      doc.daysLeft <= 30 ? "bg-yellow-500/10 border border-yellow-500/30" :
                      "bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={cn(
                        "w-5 h-5",
                        doc.daysLeft <= 7 ? "text-red-400" :
                        doc.daysLeft <= 30 ? "text-yellow-400" :
                        "text-slate-400"
                      )} />
                      <div>
                        <p className="text-white font-medium">{doc.vehicle}</p>
                        <p className="text-sm text-slate-400">{doc.document}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{doc.expires}</p>
                      <Badge className={cn(
                        doc.daysLeft <= 7 ? "bg-red-500/20 text-red-400" :
                        doc.daysLeft <= 30 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-slate-500/20 text-slate-400"
                      )}>
                        {doc.daysLeft} days left
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                Fleet Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-slate-700/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Interactive fleet map</p>
                  <p className="text-sm text-slate-500">Real-time vehicle locations</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-400">Active ({stats.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-400">Idle ({stats.idle})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-slate-400">Maintenance ({stats.maintenance})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-400">Out of Service ({stats.outOfService})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
