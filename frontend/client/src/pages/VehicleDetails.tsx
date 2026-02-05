/**
 * VEHICLE DETAILS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Wrench, Fuel, MapPin, ArrowLeft, Calendar,
  FileText, AlertTriangle, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";

export default function VehicleDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const vehicleId = params.id as string;

  const vehicleQuery = (trpc as any).fleet.getById.useQuery({ id: vehicleId });
  const maintenanceQuery = (trpc as any).fleet.getMaintenanceHistory.useQuery({ vehicleId, limit: 5 });
  const inspectionsQuery = (trpc as any).fleet.getInspections.useQuery({ vehicleId, limit: 5 });

  const vehicle = vehicleQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Maintenance</Badge>;
      case "inactive": return <Badge className="bg-red-500/20 text-red-400 border-0">Inactive</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (vehicleQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Truck className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Vehicle not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/fleet")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/fleet")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {vehicle.unitNumber}
              </h1>
              {getStatusBadge(vehicle.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">{vehicle.make} {vehicle.model} {vehicle.year}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Wrench className="w-4 h-4 mr-2" />Schedule Maintenance
          </Button>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <MapPin className="w-4 h-4 mr-2" />Track
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{(vehicle.mileage || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Mileage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">{vehicle.fuelLevel || 0}%</p>
                <p className="text-xs text-slate-400">Fuel Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{vehicle.loadsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{vehicle.nextServiceIn || 0}</p>
                <p className="text-xs text-slate-400">Days to Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Info */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">VIN</p>
                <p className="text-white font-medium">{vehicle.vin}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">License Plate</p>
                <p className="text-white font-medium">{vehicle.licensePlate}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Type</p>
                <p className="text-white font-medium">{vehicle.type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Capacity</p>
                <p className="text-white font-medium">{vehicle.capacity?.toLocaleString()} lbs</p>
              </div>
            </div>
            {vehicle.currentLocation && (
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Current Location</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {vehicle.currentLocation.city}, {vehicle.currentLocation.state}
                </p>
              </div>
            )}
            {vehicle.assignedDriver && (
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Assigned Driver</p>
                <p className="text-white font-medium">{typeof vehicle.assignedDriver === "object" ? vehicle.assignedDriver.name : vehicle.assignedDriver}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance History */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (maintenanceQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No maintenance records</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(maintenanceQuery.data as any)?.map((record: any) => (
                  <div key={record.id} className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{record.type}</p>
                        <p className="text-xs text-slate-500">{record.date}</p>
                      </div>
                      <p className="text-emerald-400 font-bold">${record.cost?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            {inspectionsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (inspectionsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No inspection records</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(inspectionsQuery.data as any)?.map((inspection: any) => (
                  <div key={inspection.id} className={cn("p-4 rounded-xl border", inspection.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{inspection.type}</p>
                      {inspection.passed ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0">Passed</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{inspection.inspector}</p>
                    <p className="text-xs text-slate-500">{inspection.date}</p>
                    {inspection.defects > 0 && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {inspection.defects} defects found
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
