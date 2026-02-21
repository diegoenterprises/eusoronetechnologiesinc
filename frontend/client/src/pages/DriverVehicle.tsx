/**
 * DRIVER VEHICLE PAGE
 * 100% Dynamic - No mock data
 * Vehicle info, inspections, maintenance status
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Truck, Gauge, Fuel, Thermometer, AlertTriangle, CheckCircle,
  Wrench, Calendar, FileText, Camera, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverVehicle() {
  const vehicleQuery = (trpc as any).drivers.getAssignedVehicle.useQuery();
  const inspectionQuery = (trpc as any).drivers.getLastInspection.useQuery();

  const startDVIRMutation = (trpc as any).drivers.startDVIR.useMutation({
    onSuccess: () => {
      toast.success("DVIR started");
    },
    onError: (error: any) => toast.error("Failed to start DVIR", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operational</Badge>;
      case "needs_service":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Service Due</Badge>;
      case "out_of_service":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Out of Service</Badge>;
      case "in_shop":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">In Shop</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  if (vehicleQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!vehicleQuery.data) {
    return (
      <div className="p-4 md:p-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Vehicle Assigned</h2>
            <p className="text-slate-400">You currently have no assigned vehicle. Contact dispatch for assignment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicle = vehicleQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            My Vehicle
          </h1>
          <p className="text-slate-400 text-sm mt-1">Unit #{vehicle.unitNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(vehicle.status)}
          {vehicle.hazmatCertified && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              HazMat Certified
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Gauge className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{vehicle.odometer?.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Odometer (mi)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Fuel className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{vehicle.fuelLevel}%</p>
                <p className="text-xs text-slate-400">Fuel Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Thermometer className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{vehicle.defLevel}%</p>
                <p className="text-xs text-slate-400">DEF Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Wrench className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{vehicle.daysToService}</p>
                <p className="text-xs text-slate-400">Days to Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Make</p>
                  <p className="text-white font-medium">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Model</p>
                  <p className="text-white font-medium">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Year</p>
                  <p className="text-white font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">VIN</p>
                  <p className="text-white font-medium text-sm">{vehicle.vin}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">License Plate</p>
                  <p className="text-white font-medium">{vehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Equipment Type</p>
                  <p className="text-white font-medium">{vehicle.equipmentType}</p>
                </div>
              </div>

              {vehicle.trailer && (
                <div className="mt-4 p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <h4 className="text-sm text-slate-400 mb-2">Attached Trailer</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Unit #</p>
                      <p className="text-white font-medium">{vehicle.trailer.unitNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-white font-medium">{vehicle.trailer.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Capacity</p>
                      <p className="text-white font-medium">{vehicle.trailer.capacity?.toLocaleString()} gal</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Last Inspection</p>
                      <p className="text-white font-medium">{vehicle.trailer.lastInspection}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Maintenance Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicle.maintenanceItems?.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.name}</span>
                      <Badge className={cn(
                        item.daysRemaining <= 0 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        item.daysRemaining <= 7 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-green-500/20 text-green-400 border-green-500/30"
                      )}>
                        {item.daysRemaining <= 0 ? "Overdue" : `${item.daysRemaining} days`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Last: {item.lastCompleted}</span>
                      <span>Due: {item.nextDue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-green-400" />
                Last DVIR
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspectionQuery.isLoading ? (
                <Skeleton className="h-32" />
              ) : inspectionQuery.data ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date</span>
                    <span className="text-white">{inspectionQuery.data.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="text-white">{inspectionQuery.data.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Result</span>
                    <Badge className={cn(
                      inspectionQuery.data.passed 
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    )}>
                      {inspectionQuery.data.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                  {inspectionQuery.data.defects > 0 && (
                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-xs text-yellow-400">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {inspectionQuery.data.defects} defect(s) noted
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">No inspection records</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 rounded-lg"
                onClick={() => startDVIRMutation.mutate({ type: "pre_trip" })}
                disabled={startDVIRMutation.isPending}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Pre-Trip Inspection
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                onClick={() => startDVIRMutation.mutate({ type: "post_trip" })}
                disabled={startDVIRMutation.isPending}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Post-Trip Inspection
              </Button>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 rounded-lg">
                <Wrench className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 rounded-lg">
                <Camera className="w-4 h-4 mr-2" />
                Take Photos
              </Button>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 rounded-lg">
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
