/**
 * DRIVER ASSIGNMENT COMPONENT
 * For Dispatch (Dispatchers) to assign drivers to loads
 * Based on 05_DISPATCH_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Portal } from "@/components/ui/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  User, Truck, Clock, MapPin, CheckCircle, AlertTriangle,
  Search, Star, Shield, Phone, ChevronRight,
  Package, Navigation, Calendar, Filter, X
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Load {
  id: string;
  loadNumber: string;
  commodity: string;
  hazmatClass?: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  pickupDate: string;
  pickupTime: string;
  distance: number;
  rate: number;
  equipmentRequired: string;
  specialRequirements: string[];
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "available" | "driving" | "on_duty" | "off_duty" | "sleeper";
  currentLocation: { city: string; state: string };
  distanceToPickup?: number;
  vehicle?: { unitNumber: string; type: string };
  trailer?: { unitNumber: string; type: string };
  hosRemaining: { driving: number; onDuty: number; cycle: number };
  safetyScore: number;
  hazmatEndorsement: boolean;
  twicCard: boolean;
  completedLoads: number;
  onTimeRate: number;
  aiMatchScore?: number;
  aiReason?: string;
}

interface DriverAssignmentProps {
  load: Load;
  availableDrivers: Driver[];
  onAssign: (loadId: string, driverId: string) => void;
  onCancel: () => void;
}

const STATUS_COLORS = {
  available: "bg-green-500/20 text-green-400",
  driving: "bg-blue-500/20 text-blue-400",
  on_duty: "bg-yellow-500/20 text-yellow-400",
  off_duty: "bg-slate-500/20 text-slate-400",
  sleeper: "bg-purple-500/20 text-purple-400",
};

function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}h ${minutes}m`;
}

export function DriverAssignment({ load, availableDrivers, onAssign, onCancel }: DriverAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "distance" | "safety" | "hos">("match");

  const filteredDrivers = availableDrivers
    .filter(driver => {
      const matchesSearch = !searchTerm || 
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle?.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "match": return (b.aiMatchScore || 0) - (a.aiMatchScore || 0);
        case "distance": return (a.distanceToPickup || 999) - (b.distanceToPickup || 999);
        case "safety": return b.safetyScore - a.safetyScore;
        case "hos": return b.hosRemaining.driving - a.hosRemaining.driving;
        default: return 0;
      }
    });

  const handleAssign = () => {
    if (selectedDriver) {
      onAssign(load.id, selectedDriver.id);
      toast.success(`${selectedDriver.name} assigned to ${load.loadNumber}`, {
        description: "Driver has been notified of the assignment.",
      });
    }
  };

  const canAssign = (driver: Driver): { can: boolean; reason?: string } => {
    if (driver.status !== "available" && driver.status !== "off_duty") {
      return { can: false, reason: "Driver not available" };
    }
    if (driver.hosRemaining.driving < 60) {
      return { can: false, reason: "Insufficient HOS remaining" };
    }
    if (load.hazmatClass && !driver.hazmatEndorsement) {
      return { can: false, reason: "Hazmat endorsement required" };
    }
    if (load.specialRequirements.includes("TWIC Required") && !driver.twicCard) {
      return { can: false, reason: "TWIC card required" };
    }
    return { can: true };
  };

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/50 overflow-y-auto z-[9999]" onClick={onCancel}>
      <div className="flex min-h-full items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl flex flex-col" onClick={(e: any) => e.stopPropagation()}>
        <CardHeader className="border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Assign Driver to {load.loadNumber}
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {load.origin.city}, {load.origin.state} → {load.destination.city}, {load.destination.state}
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel} className="text-slate-400">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Driver List */}
          <div className="w-1/2 border-r border-slate-700 flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 border-b border-slate-700 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search drivers..."
                  className="pl-9 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-700 border-slate-600 text-white text-sm rounded px-2 py-1"
                >
                  <option value="match">Best Match</option>
                  <option value="distance">Nearest</option>
                  <option value="safety">Safety Score</option>
                  <option value="hos">HOS Available</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm rounded px-2 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="off_duty">Off Duty</option>
                </select>
              </div>
            </div>

            {/* Driver List */}
            <div className="flex-1 overflow-y-auto">
              {filteredDrivers.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No matching drivers found</p>
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const { can, reason } = canAssign(driver);
                  const isSelected = selectedDriver?.id === driver.id;

                  return (
                    <div
                      key={driver.id}
                      onClick={() => can && setSelectedDriver(driver)}
                      className={cn(
                        "p-4 border-b border-slate-700/50 cursor-pointer transition-all",
                        isSelected ? "bg-blue-500/20 border-l-2 border-l-blue-500" : 
                        can ? "hover:bg-slate-700/30" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            STATUS_COLORS[driver.status]
                          )}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{driver.name}</span>
                              {driver.aiMatchScore && driver.aiMatchScore >= 90 && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                  <EsangIcon className="w-3 h-3 mr-1" />
                                  AI Pick
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {driver.vehicle?.unitNumber} • {driver.currentLocation.city}, {driver.currentLocation.state}
                            </p>
                            {driver.distanceToPickup && (
                              <p className="text-xs text-slate-500">
                                {driver.distanceToPickup} mi to pickup
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {driver.aiMatchScore && (
                            <div className={cn(
                              "text-lg font-bold",
                              driver.aiMatchScore >= 90 ? "text-green-400" :
                              driver.aiMatchScore >= 70 ? "text-yellow-400" : "text-slate-400"
                            )}>
                              {driver.aiMatchScore}%
                            </div>
                          )}
                          <Badge className={STATUS_COLORS[driver.status]}>
                            {driver.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Shield className={driver.safetyScore >= 90 ? "w-3 h-3 text-green-400" : "w-3 h-3 text-yellow-400"} />
                          {driver.safetyScore}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatMinutes(driver.hosRemaining.driving)}
                        </span>
                        {driver.hazmatEndorsement && (
                          <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-[10px]">
                            Hazmat
                          </Badge>
                        )}
                        {driver.twicCard && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-[10px]">
                            TWIC
                          </Badge>
                        )}
                      </div>

                      {!can && reason && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          {reason}
                        </div>
                      )}

                      {driver.aiReason && can && (
                        <div className="mt-2 p-2 rounded bg-purple-500/10 text-xs text-purple-300">
                          <EsangIcon className="w-3 h-3 inline mr-1" />
                          {driver.aiReason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Driver Details */}
          <div className="w-1/2 flex flex-col">
            {selectedDriver ? (
              <>
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-white font-medium mb-1">Selected Driver</h3>
                  <p className="text-sm text-slate-400">{selectedDriver.name}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Driver Info */}
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{selectedDriver.name}</p>
                        <p className="text-sm text-slate-400">{selectedDriver.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded bg-slate-700/50">
                        <p className="text-xs text-slate-400">Safety Score</p>
                        <p className={cn(
                          "text-lg font-bold",
                          selectedDriver.safetyScore >= 90 ? "text-green-400" : "text-yellow-400"
                        )}>{selectedDriver.safetyScore}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-700/50">
                        <p className="text-xs text-slate-400">On-Time Rate</p>
                        <p className="text-lg font-bold text-white">{selectedDriver.onTimeRate}%</p>
                      </div>
                      <div className="p-2 rounded bg-slate-700/50">
                        <p className="text-xs text-slate-400">Completed Loads</p>
                        <p className="text-lg font-bold text-white">{selectedDriver.completedLoads}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-700/50">
                        <p className="text-xs text-slate-400">Distance to Pickup</p>
                        <p className="text-lg font-bold text-white">{selectedDriver.distanceToPickup || "—"} mi</p>
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  {selectedDriver.vehicle && (
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-sm text-slate-400 mb-2">Equipment</p>
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white">{selectedDriver.vehicle.unitNumber}</p>
                          <p className="text-xs text-slate-500">{selectedDriver.vehicle.type}</p>
                        </div>
                      </div>
                      {selectedDriver.trailer && (
                        <div className="flex items-center gap-3 mt-2">
                          <Package className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-white">{selectedDriver.trailer.unitNumber}</p>
                            <p className="text-xs text-slate-500">{selectedDriver.trailer.type}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* HOS */}
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-sm text-slate-400 mb-3">Hours of Service</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Driving</span>
                        <span className={selectedDriver.hosRemaining.driving > 120 ? "text-green-400" : "text-yellow-400"}>
                          {formatMinutes(selectedDriver.hosRemaining.driving)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">On-Duty</span>
                        <span className="text-white">{formatMinutes(selectedDriver.hosRemaining.onDuty)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">70-Hour Cycle</span>
                        <span className="text-white">{formatMinutes(selectedDriver.hosRemaining.cycle)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-sm text-slate-400 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDriver.hazmatEndorsement && (
                        <Badge className="bg-orange-500/20 text-orange-400">Hazmat Endorsement</Badge>
                      )}
                      {selectedDriver.twicCard && (
                        <Badge className="bg-blue-500/20 text-blue-400">TWIC Card</Badge>
                      )}
                      <Badge className="bg-green-500/20 text-green-400">CDL Class A</Badge>
                      <Badge className="bg-purple-500/20 text-purple-400">Tanker</Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-slate-700 flex gap-3">
                  <Button variant="outline" className="flex-1 border-slate-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </Button>
                  <Button onClick={handleAssign} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Assign Driver
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Select a driver to view details</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Drivers are sorted by AI match score
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      </div>
    </div>
    </Portal>
  );
}

export default DriverAssignment;
