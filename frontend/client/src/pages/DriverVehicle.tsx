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
import { useTheme } from "@/contexts/ThemeContext";
import {
  Truck, Gauge, Fuel, Thermometer, AlertTriangle, CheckCircle,
  Wrench, Calendar, FileText, Camera, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverVehicle() {
  const { theme } = useTheme();
  const isLight = theme === "light";
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
        <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-12 text-center">
            <Truck className={cn("w-16 h-16 mx-auto mb-4", isLight ? "text-slate-300" : "text-slate-500")} />
            <h2 className={cn("text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>No Vehicle Assigned</h2>
            <p className={cn(isLight ? "text-slate-500" : "text-slate-400")}>You currently have no assigned vehicle. Contact dispatch for assignment.</p>
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
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Unit #{vehicle.unitNumber}</p>
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
        {[
          { icon: Gauge, value: vehicle.odometer?.toLocaleString(), label: "Odometer (mi)", color: "text-blue-500", bg: isLight ? "bg-blue-50" : "bg-blue-500/20" },
          { icon: Fuel, value: `${vehicle.fuelLevel}%`, label: "Fuel Level", color: "text-emerald-500", bg: isLight ? "bg-emerald-50" : "bg-green-500/20" },
          { icon: Thermometer, value: `${vehicle.defLevel}%`, label: "DEF Level", color: "text-cyan-500", bg: isLight ? "bg-cyan-50" : "bg-cyan-500/20" },
          { icon: Wrench, value: vehicle.daysToService, label: "Days to Service", color: "text-orange-500", bg: isLight ? "bg-orange-50" : "bg-orange-500/20" },
        ].map((s, i) => (
          <Card key={i} className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{s.value}</p>
                  <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <Truck className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Make", value: vehicle.make },
                  { label: "Model", value: vehicle.model },
                  { label: "Year", value: vehicle.year },
                  { label: "VIN", value: vehicle.vin, small: true },
                  { label: "License Plate", value: vehicle.licensePlate },
                  { label: "Equipment Type", value: vehicle.equipmentType },
                ].map((f, i) => (
                  <div key={i}>
                    <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{f.label}</p>
                    <p className={cn("font-medium", f.small ? "text-sm" : "", isLight ? "text-slate-900" : "text-white")}>{f.value}</p>
                  </div>
                ))}
              </div>

              {vehicle.trailer && (
                <div className={cn("mt-4 p-4 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                  <h4 className={cn("text-sm mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Attached Trailer</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Unit #", value: vehicle.trailer.unitNumber },
                      { label: "Type", value: vehicle.trailer.type },
                      { label: "Capacity", value: `${vehicle.trailer.capacity?.toLocaleString()} gal` },
                      { label: "Last Inspection", value: vehicle.trailer.lastInspection },
                    ].map((f, i) => (
                      <div key={i}>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{f.label}</p>
                        <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <Calendar className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Maintenance Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicle.maintenanceItems?.map((item: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{item.name}</span>
                      <Badge className={cn(
                        item.daysRemaining <= 0 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        item.daysRemaining <= 7 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-green-500/20 text-green-400 border-green-500/30"
                      )}>
                        {item.daysRemaining <= 0 ? "Overdue" : `${item.daysRemaining} days`}
                      </Badge>
                    </div>
                    <div className={cn("flex items-center justify-between text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
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
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <ClipboardCheck className={cn("w-5 h-5", isLight ? "text-emerald-600" : "text-green-400")} />
                Last DVIR
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspectionQuery.isLoading ? (
                <Skeleton className="h-32" />
              ) : inspectionQuery.data ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Date</span>
                    <span className={cn(isLight ? "text-slate-900" : "text-white")}>{inspectionQuery.data.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Type</span>
                    <span className={cn(isLight ? "text-slate-900" : "text-white")}>{inspectionQuery.data.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Result</span>
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
                <p className={cn("text-center py-4", isLight ? "text-slate-500" : "text-slate-400")}>No inspection records</p>
              )}
            </CardContent>
          </Card>

          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <CheckCircle className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-lg"
                onClick={() => startDVIRMutation.mutate({ type: "pre_trip" })}
                disabled={startDVIRMutation.isPending}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Pre-Trip Inspection
              </Button>
              <Button 
                className={cn("w-full rounded-lg", isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700")}
                onClick={() => startDVIRMutation.mutate({ type: "post_trip" })}
                disabled={startDVIRMutation.isPending}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Post-Trip Inspection
              </Button>
              <Button variant="outline" className={cn("w-full rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50")}>
                <Wrench className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <Button variant="outline" className={cn("w-full rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50")}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photos
              </Button>
              <Button variant="outline" className={cn("w-full rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50")}>
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
