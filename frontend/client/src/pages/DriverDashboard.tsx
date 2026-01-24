/**
 * DRIVER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
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
        <div className="p-4 rounded-full bg-red-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">Error loading dashboard</p>
        <Button className="bg-slate-700 hover:bg-slate-600" onClick={() => hosQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const hos = hosQuery.data;
  const currentLoad = currentLoadQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving": return "from-green-500/20 to-green-500/10 border-green-500/30";
      case "on_duty": return "from-blue-500/20 to-blue-500/10 border-blue-500/30";
      case "sleeper": return "from-purple-500/20 to-purple-500/10 border-purple-500/30";
      case "off_duty": return "from-slate-500/20 to-slate-500/10 border-slate-500/30";
      default: return "from-slate-500/20 to-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your daily overview and assignments</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HOS Status */}
      <Card className={cn("bg-gradient-to-r border-2 rounded-xl", getStatusColor(hos?.currentStatus || "off_duty"))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-slate-700/50">
                <Clock className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Status</p>
                {hosQuery.isLoading ? <Skeleton className="h-8 w-32" /> : (
                  <p className="text-2xl font-bold text-white capitalize">{hos?.currentStatus?.replace("_", " ")}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {hos?.currentStatus === "driving" ? (
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => stopDrivingMutation.mutate()} disabled={stopDrivingMutation.isPending}>
                  {stopDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Stop Driving
                </Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => startDrivingMutation.mutate()} disabled={startDrivingMutation.isPending}>
                  {startDrivingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Start Driving
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Driving</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white font-medium">{hos?.drivingHours || 0}h / 11h</span>
                )}
              </div>
              <Progress value={((hos?.drivingHours || 0) / 11) * 100} className="h-2" />
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">On-Duty</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white font-medium">{hos?.onDutyHours || 0}h / 14h</span>
                )}
              </div>
              <Progress value={((hos?.onDutyHours || 0) / 14) * 100} className="h-2" />
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">70hr Cycle</span>
                {hosQuery.isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <span className="text-white font-medium">{hos?.cycleHours || 0}h / 70h</span>
                )}
              </div>
              <Progress value={((hos?.cycleHours || 0) / 70) * 100} className="h-2" />
            </div>
          </div>

          {hos?.breakRequired && (
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                30-minute break required in {hos.breakDueIn}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Assignment */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />Current Assignment
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
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No current assignment</p>
              <p className="text-slate-500 text-sm mt-1">Check the load board for available loads</p>
              <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/loads/available")}>
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
                <Badge className={currentLoad.status === "in_transit" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
                  {currentLoad.status?.replace("_", " ")}
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30">
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
                <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  <Navigation className="w-4 h-4 mr-2" />Navigate
                </Button>
                <Button variant="outline" className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                  <Phone className="w-4 h-4 mr-2" />Contact
                </Button>
                <Button variant="outline" className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg" onClick={() => setLocation(`/loads/${currentLoad.id}`)}>
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/dvir")}>
          <FileText className="w-6 h-6 mb-2 text-blue-400" />
          <span className="text-slate-300">DVIR</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/hos")}>
          <Clock className="w-6 h-6 mb-2 text-purple-400" />
          <span className="text-slate-300">HOS Logs</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/earnings")}>
          <CheckCircle className="w-6 h-6 mb-2 text-green-400" />
          <span className="text-slate-300">Earnings</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/messages")}>
          <Phone className="w-6 h-6 mb-2 text-orange-400" />
          <span className="text-slate-300">Messages</span>
        </Button>
      </div>
    </div>
  );
}
