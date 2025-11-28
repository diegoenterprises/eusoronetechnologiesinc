/**
 * FLEET PAGE - CARRIER ROLE
 * Vehicle fleet management with maintenance tracking and availability status
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Truck, Plus, Search, Filter, CheckCircle, AlertCircle,
  XCircle, Wrench, Calendar, MapPin, Activity, Eye,
  Edit, Trash2, FileText, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type VehicleStatus = "available" | "in_use" | "maintenance" | "out_of_service";

interface Vehicle {
  id: number;
  number: string;
  type: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: VehicleStatus;
  mileage: number;
  lastMaintenance: Date;
  nextMaintenance: number;
  currentDriver: string | null;
  location: string;
}

export default function FleetPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Mock fleet data - in production, fetch from database
  const vehicles: Vehicle[] = [
    {
      id: 1,
      number: "TRK-001",
      type: "Semi-Truck",
      make: "Freightliner",
      model: "Cascadia",
      year: 2022,
      vin: "1FUJGHDV8NLFK1234",
      status: "in_use",
      mileage: 45000,
      lastMaintenance: new Date(2024, 10, 1),
      nextMaintenance: 50000,
      currentDriver: "John Smith",
      location: "Houston, TX"
    },
    {
      id: 2,
      number: "TRK-002",
      type: "Semi-Truck",
      make: "Kenworth",
      model: "T680",
      year: 2023,
      vin: "1XKYDP9X5NJ123456",
      status: "available",
      mileage: 32000,
      lastMaintenance: new Date(2024, 10, 15),
      nextMaintenance: 40000,
      currentDriver: null,
      location: "Dallas, TX"
    },
    {
      id: 3,
      number: "TRK-003",
      type: "Box Truck",
      make: "International",
      model: "MV607",
      year: 2021,
      vin: "3HAMMAAR2ML123456",
      status: "maintenance",
      mileage: 67000,
      lastMaintenance: new Date(2024, 10, 20),
      nextMaintenance: 70000,
      currentDriver: null,
      location: "Service Center - Austin, TX"
    },
    {
      id: 4,
      number: "TRK-004",
      type: "Semi-Truck",
      make: "Peterbilt",
      model: "579",
      year: 2022,
      vin: "1XPBDP9X4ND123456",
      status: "in_use",
      mileage: 52000,
      lastMaintenance: new Date(2024, 9, 25),
      nextMaintenance: 60000,
      currentDriver: "Mike Johnson",
      location: "San Antonio, TX"
    },
  ];

  const getStatusBadge = (status: VehicleStatus) => {
    const badges: Record<VehicleStatus, { label: string; color: string; icon: any }> = {
      available: { label: "Available", color: "bg-green-600", icon: CheckCircle },
      in_use: { label: "In Use", color: "bg-blue-600", icon: Activity },
      maintenance: { label: "Maintenance", color: "bg-yellow-600", icon: Wrench },
      out_of_service: { label: "Out of Service", color: "bg-red-600", icon: XCircle },
    };
    return badges[status];
  };

  const getMaintenanceStatus = (vehicle: Vehicle): { status: string; color: string } => {
    const remaining = vehicle.nextMaintenance - vehicle.mileage;
    if (remaining < 1000) return { status: "Due Soon", color: "text-red-400" };
    if (remaining < 3000) return { status: "Upcoming", color: "text-yellow-400" };
    return { status: "On Schedule", color: "text-green-400" };
  };

  const handleAddVehicle = () => {
    toast.info("Add vehicle form (Feature coming soon)");
  };

  const handleEditVehicle = (vehicleId: number) => {
    toast.info(`Edit vehicle #${vehicleId} (Feature coming soon)`);
  };

  const handleScheduleMaintenance = (vehicleId: number) => {
    toast.success("Maintenance scheduled (Feature coming soon)");
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery === "" || 
      vehicle.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    available: vehicles.filter(v => v.status === "available").length,
    in_use: vehicles.filter(v => v.status === "in_use").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
    out_of_service: vehicles.filter(v => v.status === "out_of_service").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent mb-2">
                Fleet Management
              </h1>
              <p className="text-gray-400 text-lg">Manage your vehicle fleet and maintenance schedules</p>
            </div>
            <Button
              onClick={handleAddVehicle}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-green-900/20 border-green-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Available</p>
                  <p className="text-3xl font-bold text-green-400">{statusCounts.available}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="bg-blue-900/20 border-blue-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">In Use</p>
                  <p className="text-3xl font-bold text-blue-400">{statusCounts.in_use}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="bg-yellow-900/20 border-yellow-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Maintenance</p>
                  <p className="text-3xl font-bold text-yellow-400">{statusCounts.maintenance}</p>
                </div>
                <Wrench className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Fleet</p>
                  <p className="text-3xl font-bold text-white">{vehicles.length}</p>
                </div>
                <Truck className="w-8 h-8 text-gray-500" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by vehicle number, make, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="grid gap-4">
          {filteredVehicles.map((vehicle) => {
            const statusBadge = getStatusBadge(vehicle.status);
            const StatusIcon = statusBadge.icon;
            const maintenanceStatus = getMaintenanceStatus(vehicle);

            return (
              <Card key={vehicle.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-cyan-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg ${statusBadge.color}/20 flex items-center justify-center`}>
                      <Truck className={`w-8 h-8 ${statusBadge.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{vehicle.number}</h3>
                        <Badge className={`${statusBadge.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-gray-400">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-gray-500">{vehicle.type} • VIN: {vehicle.vin}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditVehicle(vehicle.id)}
                      className="border-gray-700 hover:border-cyan-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 hover:border-blue-500"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Current Mileage</p>
                    <p className="font-semibold text-lg">{vehicle.mileage.toLocaleString()} mi</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Next Maintenance</p>
                    <p className={`font-semibold text-lg ${maintenanceStatus.color}`}>
                      {vehicle.nextMaintenance.toLocaleString()} mi
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{maintenanceStatus.status}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Current Driver</p>
                    <p className="font-semibold">{vehicle.currentDriver || "Unassigned"}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </p>
                    <p className="font-semibold text-sm">{vehicle.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Last service: {vehicle.lastMaintenance.toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      {(vehicle.nextMaintenance - vehicle.mileage).toLocaleString()} mi until next service
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleScheduleMaintenance(vehicle.id)}
                    variant="outline"
                    className="border-gray-700 hover:border-yellow-500"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
