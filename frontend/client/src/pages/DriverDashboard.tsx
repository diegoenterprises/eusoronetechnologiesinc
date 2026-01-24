/**
 * DRIVER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, Truck, MapPin, Package, AlertTriangle,
  CheckCircle, Navigation, Phone, FileText, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function DriverDashboard() {
  const [, setLocation] = useLocation();

  const hosQuery = trpc.drivers.getMyHOS.useQuery();
  const currentLoadQuery = trpc.drivers.getCurrentLoad.useQuery();
  const alertsQuery = trpc.drivers.getAlerts.useQuery();

  const startDrivingMutation = trpc.drivers.startDriving.useMutation({
    onSuccess: () => { toast.success("Driving started"); hosQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stopDrivingMutation = trpc.drivers.stopDriving.useMutation({
    onSuccess: () => { toast.success("Driving stopped"); hosQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (hosQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading dashboard</p>
        <Button className="mt-4" onClick={() => hosQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const hos = hosQuery.data;
  const currentLoad = currentLoadQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving": return "bg-green-500/20 text-green-400 border-green-500";
      case "on_duty": return "bg-blue-500/20 text-blue-400 border-blue-500";
      case "sleeper": return "bg-purple-500/20 text-purple-400 border-purple-500";
      case "off_duty": return "bg-slate-500/20 text-slate-400 border-slate-500";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HOS Status */}
      <Card className={cn("border-2", getStatusColor(hos?.currentStatus || "off_duty"))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-400 text-sm">Current Status</p>
              {hosQuery.isLoading ? <Skeleton className="h-8 w-32" /> : (
                <p className="text-2xl font-bold text-white capitalize">{hos?.currentStatus?.replace("_", " ")}</p>
              )}
            </div>
            <div className="flex gap-2">
              {hos?.currentStatus === "driving" ? (
                <Button variant="outline" className="border-red-500 text-red-400" onClick={() => stopDrivingMutation.mutate()} disabled={stopDrivingMutation.isPending}>
                  {stopDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Stop Driving
                </Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => startDrivingMutation.mutate()} disabled={startDrivingMutation.isPending}>
                  {startDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Start Driving
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-sm">Driving</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white">{hos?.drivingHours || 0}h / 11h</span>
                )}
              </div>
              <Progress value={((hos?.drivingHours || 0) / 11) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-sm">On-Duty</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white">{hos?.onDutyHours || 0}h / 14h</span>
                )}
              </div>
              <Progress value={((hos?.onDutyHours || 0) / 14) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-sm">70hr Cycle</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white">{hos?.cycleHours || 0}h / 70h</span>
                )}
              </div>
              <Progress value={((hos?.cycleHours || 0) / 70) * 100} className="h-2" />
            </div>
          </div>

          {hos?.breakRequired && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                30-minute break required in {hos.breakDueIn}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Assignment */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />Current Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLoadQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-64" />
            </div>
          ) : !currentLoad ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No current assignment</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/loads/available")}>
                Find Available Loads
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{currentLoad.loadNumber}</p>
                  <p className="text-slate-400">{currentLoad.commodity}</p>
                </div>
                <Badge className={currentLoad.status === "in_transit" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}>
                  {currentLoad.status?.replace("_", " ")}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-slate-700/30">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="w-0.5 h-8 bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-white font-medium">{currentLoad.pickupLocation?.city}, {currentLoad.pickupLocation?.state}</p>
                      <p className="text-xs text-slate-500">{currentLoad.pickupDate} {currentLoad.pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-white font-medium">{currentLoad.deliveryLocation?.city}, {currentLoad.deliveryLocation?.state}</p>
                      <p className="text-xs text-slate-500">{currentLoad.deliveryDate} {currentLoad.deliveryTime}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{currentLoad.distance} miles</span>
                  <span className="text-slate-400">ETA: {currentLoad.eta}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Navigation className="w-4 h-4 mr-2" />Navigate
                </Button>
                <Button variant="outline" className="border-slate-600">
                  <Phone className="w-4 h-4 mr-2" />Contact
                </Button>
                <Button variant="outline" className="border-slate-600" onClick={() => setLocation(`/loads/${currentLoad.id}`)}>
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col border-slate-600" onClick={() => setLocation("/dvir")}>
          <FileText className="w-6 h-6 mb-2" />
          <span>DVIR</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col border-slate-600" onClick={() => setLocation("/hos")}>
          <Clock className="w-6 h-6 mb-2" />
          <span>HOS Logs</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col border-slate-600" onClick={() => setLocation("/earnings")}>
          <CheckCircle className="w-6 h-6 mb-2" />
          <span>Earnings</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col border-slate-600" onClick={() => setLocation("/messages")}>
          <Phone className="w-6 h-6 mb-2" />
          <span>Messages</span>
        </Button>
      </div>
    </div>
  );
}
