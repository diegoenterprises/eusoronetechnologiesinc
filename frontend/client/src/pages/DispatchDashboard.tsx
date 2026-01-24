/**
 * DISPATCH DASHBOARD PAGE
 * Main dashboard for Catalysts (Dispatchers)
 * Based on 05_CATALYST_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Users, Package, AlertTriangle, Clock, MapPin,
  Phone, MessageSquare, ChevronRight, Search, Filter,
  RefreshCw, Sparkles, CheckCircle, XCircle, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HOSMonitor, HOSData } from "@/components/driver/HOSMonitor";

// Mock data
const STATS = {
  active: 12,
  unassigned: 5,
  enRoute: 8,
  loading: 2,
  inTransit: 6,
  issues: 3,
};

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "available" | "driving" | "on_duty" | "off_duty" | "sleeper";
  currentLoad?: string;
  location: string;
  hosRemaining: string;
  equipment: string;
  lastUpdate: string;
}

interface Load {
  id: string;
  loadNumber: string;
  shipper: string;
  origin: string;
  destination: string;
  commodity: string;
  pickupTime: string;
  status: "unassigned" | "assigned" | "en_route" | "at_pickup" | "loading" | "in_transit" | "delivered";
  assignedDriver?: string;
  priority: "normal" | "urgent" | "critical";
  rate: number;
}

const MOCK_DRIVERS: Driver[] = [
  { id: "d1", name: "John Smith", phone: "(555) 123-4567", status: "driving", currentLoad: "LOAD-45901", location: "I-10 near Houston, TX", hosRemaining: "8h 30m", equipment: "MC-306", lastUpdate: "2 min ago" },
  { id: "d2", name: "Maria Garcia", phone: "(555) 234-5678", status: "available", location: "Dallas Terminal", hosRemaining: "11h 00m", equipment: "MC-306", lastUpdate: "5 min ago" },
  { id: "d3", name: "Robert Johnson", phone: "(555) 345-6789", status: "on_duty", currentLoad: "LOAD-45898", location: "Beaumont, TX", hosRemaining: "6h 15m", equipment: "MC-407", lastUpdate: "1 min ago" },
  { id: "d4", name: "Sarah Williams", phone: "(555) 456-7890", status: "sleeper", location: "San Antonio, TX", hosRemaining: "0h 00m", equipment: "MC-306", lastUpdate: "30 min ago" },
  { id: "d5", name: "Michael Brown", phone: "(555) 567-8901", status: "available", location: "Austin, TX", hosRemaining: "10h 45m", equipment: "MC-331", lastUpdate: "3 min ago" },
];

const MOCK_LOADS: Load[] = [
  { id: "l1", loadNumber: "LOAD-45905", shipper: "Shell Oil", origin: "Houston, TX", destination: "Dallas, TX", commodity: "Gasoline", pickupTime: "Today 14:00", status: "unassigned", priority: "urgent", rate: 2800 },
  { id: "l2", loadNumber: "LOAD-45906", shipper: "Exxon", origin: "Beaumont, TX", destination: "San Antonio, TX", commodity: "Diesel", pickupTime: "Today 16:00", status: "unassigned", priority: "normal", rate: 3200 },
  { id: "l3", loadNumber: "LOAD-45901", shipper: "Chevron", origin: "Houston, TX", destination: "Austin, TX", commodity: "Jet Fuel", pickupTime: "Today 08:00", status: "in_transit", assignedDriver: "John Smith", priority: "normal", rate: 2500 },
  { id: "l4", loadNumber: "LOAD-45898", shipper: "Valero", origin: "Port Arthur, TX", destination: "Houston, TX", commodity: "Crude Oil", pickupTime: "Today 06:00", status: "loading", assignedDriver: "Robert Johnson", priority: "critical", rate: 4500 },
  { id: "l5", loadNumber: "LOAD-45907", shipper: "Marathon", origin: "Galveston, TX", destination: "Corpus Christi, TX", commodity: "Ethanol", pickupTime: "Tomorrow 08:00", status: "unassigned", priority: "normal", rate: 3800 },
];

const STATUS_COLORS = {
  available: "bg-green-500",
  driving: "bg-blue-500",
  on_duty: "bg-yellow-500",
  off_duty: "bg-slate-500",
  sleeper: "bg-purple-500",
};

const LOAD_STATUS_COLORS = {
  unassigned: "bg-red-500/20 text-red-400",
  assigned: "bg-blue-500/20 text-blue-400",
  en_route: "bg-cyan-500/20 text-cyan-400",
  at_pickup: "bg-yellow-500/20 text-yellow-400",
  loading: "bg-orange-500/20 text-orange-400",
  in_transit: "bg-green-500/20 text-green-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
};

const PRIORITY_COLORS = {
  normal: "text-slate-400",
  urgent: "text-yellow-400",
  critical: "text-red-400",
};

export default function DispatchDashboard() {
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [loads] = useState<Load[]>(MOCK_LOADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const unassignedLoads = loads.filter(l => l.status === "unassigned");
  const availableDrivers = drivers.filter(d => d.status === "available");

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Active Loads", value: STATS.active, color: "text-blue-400", icon: Package },
          { label: "Unassigned", value: STATS.unassigned, color: "text-red-400", icon: AlertTriangle },
          { label: "En Route", value: STATS.enRoute, color: "text-cyan-400", icon: Navigation },
          { label: "Loading", value: STATS.loading, color: "text-orange-400", icon: Truck },
          { label: "In Transit", value: STATS.inTransit, color: "text-green-400", icon: MapPin },
          { label: "Issues", value: STATS.issues, color: "text-yellow-400", icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                </div>
                <stat.icon className={cn("w-8 h-8 opacity-50", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Loads */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-red-400" />
                Unassigned Loads ({unassignedLoads.length})
              </CardTitle>
              <Button variant="outline" size="sm" className="border-slate-600">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedLoads.map((load) => (
                <div
                  key={load.id}
                  className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{load.loadNumber}</span>
                        <Badge className={LOAD_STATUS_COLORS[load.status]}>
                          {load.status.replace("_", " ")}
                        </Badge>
                        {load.priority !== "normal" && (
                          <Badge variant="outline" className={PRIORITY_COLORS[load.priority]}>
                            {load.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{load.shipper} • {load.commodity}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{load.origin}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{load.destination}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-slate-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {load.pickupTime}
                        </span>
                        <span className="text-green-400 font-medium">${load.rate.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Assign
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        Manual
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Drivers */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Available Drivers ({availableDrivers.length})
              </CardTitle>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableDrivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors",
                    selectedDriver?.id === driver.id
                      ? "bg-blue-500/20 border border-blue-500/50"
                      : "bg-slate-700/30 hover:bg-slate-700/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[driver.status])} />
                      <div>
                        <p className="text-white font-medium text-sm">{driver.name}</p>
                        <p className="text-xs text-slate-400">{driver.equipment}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-400">{driver.hosRemaining} HOS</p>
                      <p className="text-xs text-slate-500">{driver.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Status Grid */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              All Drivers ({drivers.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search drivers..."
                  className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                  <th className="pb-2 pr-4">Driver</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Current Load</th>
                  <th className="pb-2 pr-4">Location</th>
                  <th className="pb-2 pr-4">HOS</th>
                  <th className="pb-2 pr-4">Equipment</th>
                  <th className="pb-2 pr-4">Last Update</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers
                  .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((driver) => (
                  <tr key={driver.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[driver.status])} />
                        <span className="text-white font-medium">{driver.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        driver.status === "available" && "text-green-400 border-green-500/30",
                        driver.status === "driving" && "text-blue-400 border-blue-500/30",
                        driver.status === "on_duty" && "text-yellow-400 border-yellow-500/30",
                        driver.status === "off_duty" && "text-slate-400 border-slate-500/30",
                        driver.status === "sleeper" && "text-purple-400 border-purple-500/30"
                      )}>
                        {driver.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {driver.currentLoad ? (
                        <span className="text-blue-400">{driver.currentLoad}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-300">{driver.location}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "text-sm font-medium",
                        parseFloat(driver.hosRemaining) > 4 ? "text-green-400" : 
                        parseFloat(driver.hosRemaining) > 1 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {driver.hosRemaining}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-400">{driver.equipment}</td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{driver.lastUpdate}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <MapPin className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Loads */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Active Loads
            </CardTitle>
            <div className="flex gap-2">
              {["all", "en_route", "loading", "in_transit"].map((filter) => (
                <Button key={filter} size="sm" variant="outline" className="border-slate-600 capitalize">
                  {filter.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loads.filter(l => l.status !== "unassigned" && l.status !== "delivered").map((load) => (
              <div
                key={load.id}
                className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{load.loadNumber}</span>
                      <Badge className={LOAD_STATUS_COLORS[load.status]}>
                        {load.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-slate-400">• {load.shipper}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-300">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {load.origin} → {load.destination}
                      </span>
                      {load.assignedDriver && (
                        <span className="text-blue-400">
                          <Users className="w-3 h-3 inline mr-1" />
                          {load.assignedDriver}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-slate-600">
                      Track
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
