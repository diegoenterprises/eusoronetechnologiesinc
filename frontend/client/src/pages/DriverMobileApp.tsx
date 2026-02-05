/**
 * DRIVER MOBILE APP PAGE (Web version of driver mobile interface)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Clock, MapPin, Phone, Navigation, CheckCircle,
  AlertTriangle, FileText, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverMobileApp() {
  const driverQuery = (trpc as any).drivers.getCurrentDriver.useQuery();
  const assignmentQuery = (trpc as any).drivers.getCurrentAssignment.useQuery();
  const hosQuery = (trpc as any).drivers.getHOSStatus.useQuery();

  const updateStatusMutation = (trpc as any).drivers.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); assignmentQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update status", { description: error.message }),
  });
  const currentDriverId = (driverQuery.data as any)?.id || "";

  const driver = driverQuery.data;
  const assignment = assignmentQuery.data;
  const hos = hosQuery.data;

  const getHOSColor = (hours: number, max: number) => {
    const percentage = (hours / max) * 100;
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 75) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Driver Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, {driver?.name || "Driver"}</p>
      </div>

      {/* HOS Status */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Hours of Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hosQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Driving Today</span>
                  <span className={cn("font-bold", getHOSColor(hos?.drivingToday || 0, 11))}>{hos?.drivingToday || 0}h / 11h</span>
                </div>
                <Progress value={((hos?.drivingToday || 0) / 11) * 100} className="h-2" />
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">On-Duty Today</span>
                  <span className={cn("font-bold", getHOSColor(hos?.onDutyToday || 0, 14))}>{hos?.onDutyToday || 0}h / 14h</span>
                </div>
                <Progress value={((hos?.onDutyToday || 0) / 14) * 100} className="h-2" />
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">70-Hour Cycle</span>
                  <span className={cn("font-bold", getHOSColor(hos?.cycleUsed || 0, 70))}>{hos?.cycleUsed || 0}h / 70h</span>
                </div>
                <Progress value={((hos?.cycleUsed || 0) / 70) * 100} className="h-2" />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className={cn("w-3 h-3 rounded-full", hos?.status === "driving" ? "bg-green-400 animate-pulse" : hos?.status === "on_duty" ? "bg-yellow-400" : "bg-slate-400")} />
                <span className="text-white font-medium capitalize">{hos?.status?.replace("_", " ") || "Off Duty"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Assignment */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Current Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !assignment ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Truck className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No active assignment</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-lg">{assignment.loadNumber}</p>
                <Badge className={cn("border-0", assignment.status === "in_transit" ? "bg-blue-500/20 text-blue-400" : assignment.status === "loading" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>
                  {assignment.status?.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{assignment.origin?.name}</p>
                    <p className="text-sm text-slate-400">{assignment.origin?.address}</p>
                    <p className="text-xs text-slate-500">Pickup: {assignment.pickupTime}</p>
                  </div>
                </div>
                <div className="ml-2 w-0.5 h-8 bg-slate-600" />
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{assignment.destination?.name}</p>
                    <p className="text-sm text-slate-400">{assignment.destination?.address}</p>
                    <p className="text-xs text-slate-500">Delivery: {assignment.deliveryTime}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white">{assignment.distance}</p>
                  <p className="text-xs text-slate-500">Miles</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-emerald-400">${assignment.rate?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => window.open(`tel:${assignment.dispatchPhone}`)}>
                  <Phone className="w-4 h-4 mr-2" />Dispatch
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl">
                  <Navigation className="w-4 h-4 mr-2" />Navigate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl" onClick={() => updateStatusMutation.mutate({ driverId: currentDriverId, status: "on_load" })}>
              <MapPin className="w-6 h-6 mb-1 text-cyan-400" />
              <span>Arrived</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl" onClick={() => updateStatusMutation.mutate({ driverId: currentDriverId, status: "on_load" })}>
              <Truck className="w-6 h-6 mb-1 text-yellow-400" />
              <span>Loading</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl" onClick={() => updateStatusMutation.mutate({ driverId: currentDriverId, status: "available" })}>
              <CheckCircle className="w-6 h-6 mb-1 text-green-400" />
              <span>Departed</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl">
              <Camera className="w-6 h-6 mb-1 text-purple-400" />
              <span>Upload BOL</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl">
              <FileText className="w-6 h-6 mb-1 text-blue-400" />
              <span>Pre-Trip</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-xl">
              <AlertTriangle className="w-6 h-6 mb-1 text-red-400" />
              <span>Report Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
