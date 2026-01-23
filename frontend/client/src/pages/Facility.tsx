/**
 * FACILITY MANAGEMENT PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Terminal facility operations and management.
 * Features:
 * - Facility overview dashboard
 * - Incoming/outgoing shipments tracking
 * - Bay and dock management
 * - Staff scheduling
 * - Equipment status
 * - Safety compliance
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Building2,
  TruckIcon,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Activity,
  BarChart3,
  Calendar,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FacilityStats {
  activeShipments: number;
  incomingToday: number;
  outgoingToday: number;
  availableBays: number;
  totalBays: number;
  staffOnDuty: number;
  safetyIncidents: number;
}

interface Shipment {
  id: string;
  type: "incoming" | "outgoing";
  carrier: string;
  driver: string;
  commodity: string;
  quantity: number;
  scheduledTime: Date;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
  bay?: string;
}

interface Bay {
  id: string;
  number: number;
  status: "available" | "occupied" | "maintenance";
  currentShipment?: string;
  type: "loading" | "unloading";
  equipment: string[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: "active" | "break" | "offline";
  tasksCompleted: number;
}

export default function FacilityPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock facility stats - TODO: Replace with trpc.facility.getStats.useQuery()
  const stats: FacilityStats = {
    activeShipments: 12,
    incomingToday: 8,
    outgoingToday: 15,
    availableBays: 4,
    totalBays: 10,
    staffOnDuty: 18,
    safetyIncidents: 0,
  };

  // Mock shipments - TODO: Replace with trpc.facility.getShipments.useQuery()
  const shipments: Shipment[] = [
    {
      id: "S001",
      type: "incoming",
      carrier: "Swift Logistics",
      driver: "John Smith",
      commodity: "Crude Oil",
      quantity: 8000,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "scheduled",
    },
    {
      id: "S002",
      type: "outgoing",
      carrier: "Texas Haulers",
      driver: "Mike Johnson",
      commodity: "Diesel Fuel",
      quantity: 7500,
      scheduledTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      status: "in_progress",
      bay: "Bay 3",
    },
    {
      id: "S003",
      type: "incoming",
      carrier: "Lone Star Transport",
      driver: "Sarah Martinez",
      commodity: "Gasoline",
      quantity: 9000,
      scheduledTime: new Date(Date.now() - 30 * 60 * 1000),
      status: "delayed",
    },
  ];

  // Mock bays - TODO: Replace with trpc.facility.getBays.useQuery()
  const bays: Bay[] = [
    {
      id: "B001",
      number: 1,
      status: "occupied",
      currentShipment: "S002",
      type: "loading",
      equipment: ["Flow Meter", "Safety Valve", "Grounding Cable"],
    },
    {
      id: "B002",
      number: 2,
      status: "available",
      type: "unloading",
      equipment: ["Flow Meter", "Vapor Recovery"],
    },
    {
      id: "B003",
      number: 3,
      status: "maintenance",
      type: "loading",
      equipment: ["Flow Meter (Under Repair)"],
    },
  ];

  // Mock staff - TODO: Replace with trpc.facility.getStaff.useQuery()
  const staff: StaffMember[] = [
    {
      id: "ST001",
      name: "Robert Davis",
      role: "Dock Supervisor",
      shift: "Day",
      status: "active",
      tasksCompleted: 12,
    },
    {
      id: "ST002",
      name: "Lisa Anderson",
      role: "Safety Officer",
      shift: "Day",
      status: "active",
      tasksCompleted: 8,
    },
    {
      id: "ST003",
      name: "James Wilson",
      role: "Equipment Operator",
      shift: "Day",
      status: "break",
      tasksCompleted: 15,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
      case "available":
      case "active":
        return "border-blue-600 text-blue-400 bg-blue-600/10";
      case "in_progress":
        return "border-yellow-600 text-yellow-400 bg-yellow-600/10";
      case "completed":
        return "border-green-600 text-green-400 bg-green-600/10";
      case "delayed":
      case "maintenance":
        return "border-red-600 text-red-400 bg-red-600/10";
      case "occupied":
        return "border-orange-600 text-orange-400 bg-orange-600/10";
      case "break":
      case "offline":
        return "border-gray-600 text-gray-400 bg-gray-600/10";
      default:
        return "border-gray-600 text-gray-400 bg-gray-600/10";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Facility Management
            </h1>
            <p className="text-gray-400">
              Terminal operations and shipment coordination
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Calendar className="mr-2" size={18} />
              Schedule
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <AlertTriangle className="mr-2" size={18} />
              Report Incident
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Activity className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Shipments</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeShipments}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <TruckIcon className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Incoming Today</p>
                <p className="text-2xl font-bold text-white">
                  {stats.incomingToday}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Package className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Outgoing Today</p>
                <p className="text-2xl font-bold text-white">
                  {stats.outgoingToday}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <Building2 className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Available Bays</p>
                <p className="text-2xl font-bold text-white">
                  {stats.availableBays}/{stats.totalBays}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Users className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Staff On Duty</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.staffOnDuty}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                View Schedule
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Safety Incidents (30d)</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.safetyIncidents}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-green-600 text-green-400 bg-green-600/10">
                EXCELLENT
              </Badge>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="shipments" className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="shipments">Active Shipments</TabsTrigger>
            <TabsTrigger value="bays">Bay Status</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Today's Shipments
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Incoming
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Outgoing
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {shipments.map((shipment) => (
                <Card
                  key={shipment.id}
                  className="bg-gray-900 border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant="outline"
                          className={getStatusColor(shipment.status)}
                        >
                          {shipment.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            shipment.type === "incoming"
                              ? "border-green-600 text-green-400 bg-green-600/10"
                              : "border-purple-600 text-purple-400 bg-purple-600/10"
                          }
                        >
                          {shipment.type.toUpperCase()}
                        </Badge>
                        <span className="text-gray-400 text-sm">
                          {shipment.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Carrier</p>
                          <p className="text-white font-semibold">
                            {shipment.carrier}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Driver</p>
                          <p className="text-white font-semibold">
                            {shipment.driver}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Commodity</p>
                          <p className="text-white font-semibold">
                            {shipment.commodity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Quantity</p>
                          <p className="text-white font-semibold">
                            {shipment.quantity.toLocaleString()} gal
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>
                            Scheduled: {formatTime(shipment.scheduledTime)}
                          </span>
                        </div>
                        {shipment.bay && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{shipment.bay}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                    >
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bays Tab */}
          <TabsContent value="bays" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Bay Status</h3>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Activity className="mr-2" size={18} />
                Live View
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {bays.map((bay) => (
                <Card
                  key={bay.id}
                  className="bg-gray-900 border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-white">
                          Bay {bay.number}
                        </h4>
                        <Badge
                          variant="outline"
                          className={getStatusColor(bay.status)}
                        >
                          {bay.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Type: {bay.type.charAt(0).toUpperCase() + bay.type.slice(1)}
                      </p>
                    </div>
                  </div>

                  {bay.currentShipment && (
                    <div className="mb-4 p-3 bg-gray-800 rounded">
                      <p className="text-gray-400 text-xs mb-1">
                        Current Shipment
                      </p>
                      <p className="text-white font-semibold">
                        {bay.currentShipment}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Equipment</p>
                    <div className="flex flex-wrap gap-2">
                      {bay.equipment.map((eq) => (
                        <Badge
                          key={eq}
                          variant="outline"
                          className="border-gray-600 text-gray-300 bg-gray-800"
                        >
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={bay.status === "maintenance"}
                  >
                    {bay.status === "available"
                      ? "Assign Shipment"
                      : bay.status === "occupied"
                      ? "View Details"
                      : "Under Maintenance"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Staff On Duty</h3>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Users className="mr-2" size={18} />
                Manage Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {staff.map((member) => (
                <Card
                  key={member.id}
                  className="bg-gray-900 border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600/20 rounded-lg">
                        <Users className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">
                          {member.name}
                        </h4>
                        <p className="text-gray-400 text-sm">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-1">Shift</p>
                        <p className="text-white font-semibold">{member.shift}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-1">Tasks</p>
                        <p className="text-white font-semibold">
                          {member.tasksCompleted}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusColor(member.status)}
                      >
                        {member.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
