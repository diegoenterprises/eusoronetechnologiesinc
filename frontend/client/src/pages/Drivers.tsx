/**
 * DRIVERS PAGE - CARRIER ROLE
 * Driver roster management with assignments, performance tracking, and availability
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  User, Plus, Search, Phone, MessageSquare, Star,
  CheckCircle, XCircle, Clock, TrendingUp, Award,
  MapPin, Package, Edit, Eye, Calendar, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type DriverStatus = "available" | "on_route" | "off_duty" | "inactive";

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  rating: number;
  completedLoads: number;
  onTimeDelivery: number;
  currentLoad: string | null;
  location: string;
  licenseExpiry: Date;
  medicalCertExpiry: Date;
}

export default function DriversPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Mock driver data - in production, fetch from database
  const drivers: Driver[] = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@carrier.com",
      phone: "(555) 123-4567",
      status: "on_route",
      rating: 4.8,
      completedLoads: 245,
      onTimeDelivery: 96,
      currentLoad: "LD-2024-087",
      location: "Houston, TX",
      licenseExpiry: new Date(2025, 5, 15),
      medicalCertExpiry: new Date(2025, 2, 20)
    },
    {
      id: 2,
      name: "Mike Johnson",
      email: "mike.johnson@carrier.com",
      phone: "(555) 234-5678",
      status: "on_route",
      rating: 4.6,
      completedLoads: 198,
      onTimeDelivery: 94,
      currentLoad: "LD-2024-089",
      location: "San Antonio, TX",
      licenseExpiry: new Date(2025, 8, 10),
      medicalCertExpiry: new Date(2025, 6, 5)
    },
    {
      id: 3,
      name: "Sarah Williams",
      email: "sarah.williams@carrier.com",
      phone: "(555) 345-6789",
      status: "available",
      rating: 4.9,
      completedLoads: 312,
      onTimeDelivery: 98,
      currentLoad: null,
      location: "Dallas, TX",
      licenseExpiry: new Date(2026, 1, 25),
      medicalCertExpiry: new Date(2025, 11, 15)
    },
    {
      id: 4,
      name: "David Brown",
      email: "david.brown@carrier.com",
      phone: "(555) 456-7890",
      status: "off_duty",
      rating: 4.7,
      completedLoads: 267,
      onTimeDelivery: 95,
      currentLoad: null,
      location: "Austin, TX",
      licenseExpiry: new Date(2025, 10, 5),
      medicalCertExpiry: new Date(2025, 7, 30)
    },
  ];

  const getStatusBadge = (status: DriverStatus) => {
    const badges: Record<DriverStatus, { label: string; color: string; icon: any }> = {
      available: { label: "Available", color: "bg-green-600", icon: CheckCircle },
      on_route: { label: "On Route", color: "bg-blue-600", icon: Activity },
      off_duty: { label: "Off Duty", color: "bg-gray-600", icon: Clock },
      inactive: { label: "Inactive", color: "bg-red-600", icon: XCircle },
    };
    return badges[status];
  };

  const getCertificationStatus = (expiryDate: Date): { status: string; color: string } => {
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 30) return { status: "Expiring Soon", color: "text-red-400" };
    if (daysUntilExpiry < 90) return { status: "Renewal Due", color: "text-yellow-400" };
    return { status: "Valid", color: "text-green-400" };
  };

  const handleAddDriver = () => {
    toast.info("Add driver form (Feature coming soon)");
  };

  const handleAssignLoad = (driverId: number) => {
    toast.info(`Assign load to driver #${driverId} (Feature coming soon)`);
  };

  const handleContactDriver = (driver: Driver) => {
    toast.info(`Calling ${driver.name} at ${driver.phone}...`);
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = searchQuery === "" || 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    available: drivers.filter(d => d.status === "available").length,
    on_route: drivers.filter(d => d.status === "on_route").length,
    off_duty: drivers.filter(d => d.status === "off_duty").length,
    inactive: drivers.filter(d => d.status === "inactive").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
                Driver Management
              </h1>
              <p className="text-gray-400 text-lg">Manage your driver roster and assignments</p>
            </div>
            <Button
              onClick={handleAddDriver}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
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
                  <p className="text-gray-400 text-sm mb-1">On Route</p>
                  <p className="text-3xl font-bold text-blue-400">{statusCounts.on_route}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Off Duty</p>
                  <p className="text-3xl font-bold text-gray-400">{statusCounts.off_duty}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Drivers</p>
                  <p className="text-3xl font-bold text-white">{drivers.length}</p>
                </div>
                <User className="w-8 h-8 text-gray-500" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or email..."
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
              <option value="on_route">On Route</option>
              <option value="off_duty">Off Duty</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Driver List */}
        <div className="grid gap-4">
          {filteredDrivers.map((driver) => {
            const statusBadge = getStatusBadge(driver.status);
            const StatusIcon = statusBadge.icon;
            const licenseStatus = getCertificationStatus(driver.licenseExpiry);
            const medicalStatus = getCertificationStatus(driver.medicalCertExpiry);

            return (
              <Card key={driver.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-orange-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${statusBadge.color}/20 flex items-center justify-center`}>
                      <User className={`w-8 h-8 ${statusBadge.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{driver.name}</h3>
                        <Badge className={`${statusBadge.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{driver.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">{driver.email}</p>
                      <p className="text-gray-500 text-sm">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {driver.status === "available" && (
                      <Button
                        size="sm"
                        onClick={() => handleAssignLoad(driver.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Assign Load
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactDriver(driver)}
                      className="border-gray-700 hover:border-orange-500"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 hover:border-blue-500"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Completed Loads</p>
                    <p className="font-semibold text-lg">{driver.completedLoads}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">On-Time Delivery</p>
                    <p className="font-semibold text-lg text-green-400">{driver.onTimeDelivery}%</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Current Load</p>
                    <p className="font-semibold">{driver.currentLoad || "None"}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </p>
                    <p className="font-semibold text-sm">{driver.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">CDL License</p>
                      <p className={licenseStatus.color}>
                        {driver.licenseExpiry.toLocaleDateString()} • {licenseStatus.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Medical Cert</p>
                      <p className={medicalStatus.color}>
                        {driver.medicalCertExpiry.toLocaleDateString()} • {medicalStatus.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
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
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
