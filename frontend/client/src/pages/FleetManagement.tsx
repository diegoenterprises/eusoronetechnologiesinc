/**
 * FLEET MANAGEMENT PAGE
 * For Carriers to manage trucks, trailers, and drivers
 * Based on 02_CARRIER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, Users, Wrench, MapPin, Clock, AlertTriangle,
  Search, Filter, Plus, ChevronRight, CheckCircle, XCircle,
  Fuel, Activity, Calendar, FileText, Shield, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  unitNumber: string;
  type: "tractor" | "trailer";
  trailerType?: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  state: string;
  status: "active" | "maintenance" | "out_of_service" | "available";
  currentDriver?: string;
  currentLocation?: string;
  lastInspection: string;
  nextPM: string;
  mileage: number;
  fuelLevel?: number;
  alerts: string[];
}

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  cdlState: string;
  cdlExpiration: string;
  medicalExpiration: string;
  hazmatEndorsement: boolean;
  twicExpiration?: string;
  status: "driving" | "on_duty" | "off_duty" | "sleeper" | "inactive";
  currentVehicle?: string;
  currentLoad?: string;
  safetyScore: number;
  hosRemaining: number;
  phone: string;
}

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1", unitNumber: "TRK-101", type: "tractor", make: "Peterbilt", model: "389", year: 2023,
    vin: "1XPWD49X1PD123456", licensePlate: "ABC-1234", state: "TX", status: "active",
    currentDriver: "John Smith", currentLocation: "Houston, TX", lastInspection: "Jan 15, 2026",
    nextPM: "Feb 15, 2026", mileage: 145000, fuelLevel: 75, alerts: []
  },
  {
    id: "v2", unitNumber: "TRK-102", type: "tractor", make: "Kenworth", model: "T680", year: 2022,
    vin: "1XKYD49X2ND654321", licensePlate: "DEF-5678", state: "TX", status: "available",
    lastInspection: "Jan 10, 2026", nextPM: "Jan 25, 2026", mileage: 198000, fuelLevel: 45,
    alerts: ["PM Due Soon"]
  },
  {
    id: "v3", unitNumber: "TRK-103", type: "tractor", make: "Freightliner", model: "Cascadia", year: 2024,
    vin: "3AKJHHDR5PSAA7890", licensePlate: "GHI-9012", state: "TX", status: "maintenance",
    lastInspection: "Jan 5, 2026", nextPM: "Mar 1, 2026", mileage: 52000, alerts: ["In Shop - Brake Repair"]
  },
  {
    id: "t1", unitNumber: "TRL-201", type: "trailer", trailerType: "MC-306", make: "Heil", model: "9200", year: 2021,
    vin: "1H9TC4522LS123456", licensePlate: "TRL-2345", state: "TX", status: "active",
    currentDriver: "John Smith", currentLocation: "Houston, TX", lastInspection: "Jan 12, 2026",
    nextPM: "Apr 12, 2026", mileage: 89000, alerts: []
  },
  {
    id: "t2", unitNumber: "TRL-202", type: "trailer", trailerType: "MC-306", make: "Tremcar", model: "DOT-406", year: 2022,
    vin: "2T9TC4523MS654321", licensePlate: "TRL-6789", state: "TX", status: "available",
    lastInspection: "Jan 8, 2026", nextPM: "Apr 8, 2026", mileage: 67000, alerts: []
  },
];

const MOCK_DRIVERS: Driver[] = [
  {
    id: "d1", name: "John Smith", cdlNumber: "12345678", cdlState: "TX", cdlExpiration: "Dec 15, 2027",
    medicalExpiration: "Jun 15, 2026", hazmatEndorsement: true, twicExpiration: "Aug 20, 2028",
    status: "driving", currentVehicle: "TRK-101", currentLoad: "LOAD-45901", safetyScore: 95,
    hosRemaining: 510, phone: "(555) 123-4567"
  },
  {
    id: "d2", name: "Maria Garcia", cdlNumber: "87654321", cdlState: "TX", cdlExpiration: "Mar 20, 2028",
    medicalExpiration: "Sep 10, 2026", hazmatEndorsement: true, twicExpiration: "Nov 15, 2027",
    status: "off_duty", safetyScore: 92, hosRemaining: 660, phone: "(555) 234-5678"
  },
  {
    id: "d3", name: "Robert Johnson", cdlNumber: "11223344", cdlState: "TX", cdlExpiration: "Jul 5, 2026",
    medicalExpiration: "Feb 28, 2026", hazmatEndorsement: true, twicExpiration: "Apr 10, 2026",
    status: "on_duty", currentVehicle: "TRK-102", safetyScore: 78, hosRemaining: 420,
    phone: "(555) 345-6789"
  },
];

const STATS = {
  totalTrucks: 12,
  activeTrucks: 8,
  totalTrailers: 15,
  activeTrailers: 10,
  totalDrivers: 14,
  activeDrivers: 9,
  maintenanceAlerts: 3,
  complianceAlerts: 2,
};

const STATUS_COLORS = {
  active: "bg-green-500/20 text-green-400",
  available: "bg-blue-500/20 text-blue-400",
  maintenance: "bg-yellow-500/20 text-yellow-400",
  out_of_service: "bg-red-500/20 text-red-400",
  driving: "bg-green-500/20 text-green-400",
  on_duty: "bg-blue-500/20 text-blue-400",
  off_duty: "bg-slate-500/20 text-slate-400",
  sleeper: "bg-purple-500/20 text-purple-400",
  inactive: "bg-red-500/20 text-red-400",
};

export default function FleetManagement() {
  const [vehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [activeTab, setActiveTab] = useState("trucks");
  const [searchTerm, setSearchTerm] = useState("");

  const trucks = vehicles.filter(v => v.type === "tractor");
  const trailers = vehicles.filter(v => v.type === "trailer");

  const filteredTrucks = trucks.filter(t => 
    t.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.currentDriver?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrailers = trailers.filter(t => 
    t.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.trailerType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cdlNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-slate-400">Manage your trucks, trailers, and drivers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{STATS.totalTrucks}</p>
            <p className="text-xs text-slate-400">Trucks</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{STATS.activeTrucks}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{STATS.totalTrailers}</p>
            <p className="text-xs text-slate-400">Trailers</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{STATS.activeTrailers}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{STATS.totalDrivers}</p>
            <p className="text-xs text-slate-400">Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{STATS.activeDrivers}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Wrench className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{STATS.maintenanceAlerts}</p>
            <p className="text-xs text-slate-400">Maint.</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{STATS.complianceAlerts}</p>
            <p className="text-xs text-slate-400">Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fleet..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-600">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="trucks">Trucks ({trucks.length})</TabsTrigger>
          <TabsTrigger value="trailers">Trailers ({trailers.length})</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trucks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrucks.map((truck) => (
              <Card key={truck.id} className={cn(
                "bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer",
                truck.alerts.length > 0 && "border-yellow-500/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">{truck.unitNumber}</p>
                      <p className="text-sm text-slate-400">{truck.year} {truck.make} {truck.model}</p>
                    </div>
                    <Badge className={STATUS_COLORS[truck.status]}>
                      {truck.status}
                    </Badge>
                  </div>

                  {truck.currentDriver && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded bg-slate-700/30">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">{truck.currentDriver}</span>
                    </div>
                  )}

                  {truck.currentLocation && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {truck.currentLocation}
                    </div>
                  )}

                  {truck.fuelLevel !== undefined && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Fuel className="w-3 h-3" /> Fuel
                        </span>
                        <span className={truck.fuelLevel < 25 ? "text-red-400" : "text-slate-300"}>
                          {truck.fuelLevel}%
                        </span>
                      </div>
                      <Progress value={truck.fuelLevel} className="h-1.5 bg-slate-600" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Mileage</p>
                      <p className="text-white">{truck.mileage.toLocaleString()} mi</p>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Next PM</p>
                      <p className="text-white">{truck.nextPM}</p>
                    </div>
                  </div>

                  {truck.alerts.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {truck.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-yellow-400">
                          <AlertTriangle className="w-3 h-3" />
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400">
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trailers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrailers.map((trailer) => (
              <Card key={trailer.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">{trailer.unitNumber}</p>
                      <p className="text-sm text-slate-400">{trailer.trailerType} - {trailer.make}</p>
                    </div>
                    <Badge className={STATUS_COLORS[trailer.status]}>
                      {trailer.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Year</p>
                      <p className="text-white">{trailer.year}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Plate</p>
                      <p className="text-white">{trailer.licensePlate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Last Inspection</p>
                      <p className="text-white">{trailer.lastInspection}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Next PM</p>
                      <p className="text-white">{trailer.nextPM}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400">
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">{driver.name}</p>
                      <p className="text-sm text-slate-400">CDL: {driver.cdlNumber}</p>
                    </div>
                    <Badge className={STATUS_COLORS[driver.status]}>
                      {driver.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Shield className={driver.safetyScore >= 90 ? "w-4 h-4 text-green-400" : "w-4 h-4 text-yellow-400"} />
                      <span className="text-sm font-medium text-white">{driver.safetyScore}</span>
                    </div>
                    {driver.hazmatEndorsement && (
                      <Badge className="bg-orange-500/20 text-orange-400 text-xs">Hazmat</Badge>
                    )}
                    {driver.twicExpiration && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">TWIC</Badge>
                    )}
                  </div>

                  {driver.currentVehicle && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded bg-slate-700/30">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">{driver.currentVehicle}</span>
                      {driver.currentLoad && (
                        <Badge variant="outline" className="ml-auto text-xs text-slate-400">
                          {driver.currentLoad}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> HOS Remaining
                      </span>
                      <span className={driver.hosRemaining < 120 ? "text-red-400" : "text-green-400"}>
                        {Math.floor(driver.hosRemaining / 60)}h {driver.hosRemaining % 60}m
                      </span>
                    </div>
                    <Progress value={(driver.hosRemaining / 660) * 100} className="h-1.5 bg-slate-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">CDL Expires</p>
                      <p className="text-white">{driver.cdlExpiration}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-700/30">
                      <p className="text-slate-400">Medical</p>
                      <p className="text-white">{driver.medicalExpiration}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400">
                    View Profile <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
