/**
 * DRIVER CURRENT JOB PAGE
 * 100% Dynamic - No mock data
 * Active load details, HazMat info, delivery progress
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Clock, Package, AlertTriangle, Phone,
  Navigation, CheckCircle, FileText, Thermometer, Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverCurrentJob() {
  const jobQuery = trpc.drivers.getCurrentAssignment.useQuery();
  const hosQuery = trpc.drivers.getMyHOSStatus.useQuery();

  const updateStatusMutation = trpc.drivers.updateLoadStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      jobQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to update status", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Assigned</Badge>;
      case "en_route_pickup":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En Route to Pickup</Badge>;
      case "at_pickup":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">At Pickup</Badge>;
      case "loading":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Loading</Badge>;
      case "in_transit":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">In Transit</Badge>;
      case "at_delivery":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">At Delivery</Badge>;
      case "unloading":
        return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">Unloading</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  if (jobQuery.isLoading) {
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

  if (!jobQuery.data) {
    return (
      <div className="p-4 md:p-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Active Assignment</h2>
            <p className="text-slate-400">You currently have no assigned loads. Check the available loads or contact dispatch.</p>
            <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg">
              View Available Loads
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = jobQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Current Job
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{job.loadNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(job.status)}
          {job.hazmat && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              HazMat Class {job.hazmatClass}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Load Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Commodity</p>
                  <p className="text-white font-medium">{job.commodity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Weight</p>
                  <p className="text-white font-medium">{job.weight?.toLocaleString()} lbs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Quantity</p>
                  <p className="text-white font-medium">{job.weight?.toLocaleString()} {(job as any).weightUnit || "lbs"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Equipment</p>
                  <p className="text-white font-medium">{job.equipmentType}</p>
                </div>
              </div>

              {job.hazmat && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-400 font-medium">Hazmat Information</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">UN Number</p>
                      <p className="text-white">{job.unNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Hazmat Class</p>
                      <p className="text-white">{job.hazmatClass}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Packing Group</p>
                      <p className="text-white">{job.packingGroup}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">ERG Guide</p>
                      <p className="text-white">{job.ergGuide}</p>
                    </div>
                  </div>
                </div>
              )}

              {job.temperature && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Thermometer className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Temperature Requirement</p>
                    <p className="text-white font-medium">{job.temperature.min}°F - {job.temperature.max}°F</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-sm text-slate-400">Current</p>
                    <p className={cn(
                      "font-bold",
                      job.temperature.current >= job.temperature.min && job.temperature.current <= job.temperature.max
                        ? "text-green-400"
                        : "text-red-400"
                    )}>
                      {job.temperature.current}°F
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-400">Pickup</span>
                  </div>
                  <p className="text-white font-medium">{job.origin?.name}</p>
                  <p className="text-sm text-slate-400">{job.origin?.address}</p>
                  <p className="text-sm text-slate-400">{job.origin?.city}, {job.origin?.state}</p>
                  <p className="text-xs text-cyan-400 mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {job.pickupTime}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-400">Delivery</span>
                  </div>
                  <p className="text-white font-medium">{job.destination?.name}</p>
                  <p className="text-sm text-slate-400">{job.destination?.address}</p>
                  <p className="text-sm text-slate-400">{job.destination?.city}, {job.destination?.state}</p>
                  <p className="text-xs text-cyan-400 mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {job.deliveryTime}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Progress</span>
                  <span className="text-white font-medium">{(job as any).distanceCompleted || 0} / {job.totalMiles} miles</span>
                </div>
                <Progress 
                  value={((job as any).distanceCompleted || 0) / (job.totalMiles || 1) * 100} 
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>ETA: {job.eta}</span>
                  <span>{job.remainingTime} remaining</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg">
                <Navigation className="w-4 h-4 mr-2" />
                Open Navigation
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                HOS Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hosQuery.isLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-green-400">{hosQuery.data?.drivingRemaining}</p>
                      <p className="text-xs text-slate-400">Drive Time Left</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-blue-400">{hosQuery.data?.onDutyRemaining}</p>
                      <p className="text-xs text-slate-400">On-Duty Left</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{hosQuery.data?.cycleRemaining}</p>
                      <p className="text-xs text-slate-400">70hr Cycle</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-purple-400">{hosQuery.data?.breakRemaining}</p>
                      <p className="text-xs text-slate-400">Until Break</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "w-full justify-center py-2",
                    hosQuery.data?.status === "driving" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                    hosQuery.data?.status === "on_duty" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    hosQuery.data?.status === "sleeper" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                  )}>
                    Current: {hosQuery.data?.status?.replace("_", " ").toUpperCase()}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-400" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <p className="text-xs text-slate-500">Dispatch</p>
                <p className="text-white">{job.dispatch?.name}</p>
                <p className="text-sm text-cyan-400">{job.dispatch?.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <p className="text-xs text-slate-500">Shipper</p>
                <p className="text-white">{job.shipper?.name}</p>
                <p className="text-sm text-cyan-400">{job.shipper?.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <p className="text-xs text-slate-500">Receiver</p>
                <p className="text-white">{job.receiver?.name}</p>
                <p className="text-sm text-cyan-400">{job.receiver?.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                onClick={() => updateStatusMutation.mutate({ status: "at_pickup" })}
                disabled={updateStatusMutation.isPending}
              >
                Arrived at Pickup
              </Button>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg"
                onClick={() => updateStatusMutation.mutate({ status: "loading" })}
                disabled={updateStatusMutation.isPending}
              >
                Start Loading
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 rounded-lg"
                onClick={() => updateStatusMutation.mutate({ status: "in_transit" })}
                disabled={updateStatusMutation.isPending}
              >
                Depart - In Transit
              </Button>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 rounded-lg"
                onClick={() => updateStatusMutation.mutate({ status: "at_delivery" })}
                disabled={updateStatusMutation.isPending}
              >
                Arrived at Delivery
              </Button>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 rounded-lg">
                <FileText className="w-4 h-4 mr-2" />
                View BOL
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
