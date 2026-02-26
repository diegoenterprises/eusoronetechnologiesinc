/**
 * ESCORT ACTIVE TRIP PAGE
 * Live operational view for the escort's current assignment.
 * Shows load details, convoy status, driver info, status controls, and route.
 * 100% Dynamic — powered by escorts.getActiveTrip + escorts.updateTripStatus
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, Phone, Mail, Navigation, Shield,
  Clock, CheckCircle, AlertTriangle, Truck,
  ChevronRight, Play, Pause, Square, RefreshCw,
  DollarSign, Weight, Route as RouteIcon, Package,
  Users, Radio, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  accepted: { label: "Accepted", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: CheckCircle },
  en_route: { label: "En Route to Pickup", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: Navigation },
  on_site: { label: "On Site", color: "text-orange-400", bgColor: "bg-orange-500/20", icon: MapPin },
  escorting: { label: "Escorting", color: "text-green-400", bgColor: "bg-green-500/20", icon: Car },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  accepted: ["en_route"],
  en_route: ["on_site"],
  on_site: ["escorting"],
  escorting: ["completed"],
};

const NEXT_LABEL: Record<string, string> = {
  en_route: "En Route to Pickup",
  on_site: "Arrived On Site",
  escorting: "Start Escorting",
  completed: "Complete Trip",
};

export default function EscortActiveTrip() {
  const utils = (trpc as any).useUtils();
  const tripQuery = (trpc as any).escorts.getActiveTrip.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const updateStatus = (trpc as any).escorts.updateTripStatus.useMutation({
    onSuccess: () => utils.escorts.getActiveTrip.invalidate(),
  });

  const [confirmComplete, setConfirmComplete] = useState(false);
  const trip = tripQuery.data;

  const handleStatusUpdate = (newStatus: string) => {
    if (newStatus === "completed" && !confirmComplete) {
      setConfirmComplete(true);
      return;
    }
    setConfirmComplete(false);
    updateStatus.mutate({ assignmentId: trip.assignmentId, status: newStatus });
  };

  if (tripQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-6 rounded-full bg-slate-800/50 mb-6">
            <Car className="w-12 h-12 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Trip</h2>
          <p className="text-slate-400 text-center max-w-md mb-6">
            You don't have an active escort assignment right now. Check the marketplace for available jobs or your upcoming schedule.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.href = "/escort/marketplace"}
              className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
            >
              <MapPin className="w-4 h-4 mr-2" />Find Jobs
            </Button>
            <Button
              onClick={() => window.location.href = "/escort/schedule"}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              <Clock className="w-4 h-4 mr-2" />View Schedule
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[trip.assignmentStatus] || STATUS_CONFIG.accepted;
  const StatusIcon = statusCfg.icon;
  const nextStatuses = STATUS_TRANSITIONS[trip.assignmentStatus] || [];
  const load = trip.load;
  const convoy = trip.convoy;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Active Trip
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">Load #{load?.loadNumber}</p>
            <Badge className={cn("border-0", statusCfg.bgColor, statusCfg.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusCfg.label}
            </Badge>
            <Badge className={cn("border-0", trip.position === "lead" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>
              {trip.position?.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg"
            onClick={() => tripQuery.refetch()}
            disabled={tripQuery.isFetching}
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", tripQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Trip Details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status Control Bar */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-full", statusCfg.bgColor)}>
                    <StatusIcon className={cn("w-6 h-6", statusCfg.color)} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{statusCfg.label}</p>
                    {trip.startedAt && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Started {new Date(trip.startedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {confirmComplete ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg"
                        onClick={() => setConfirmComplete(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        onClick={() => handleStatusUpdate("completed")}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />Confirm Complete
                      </Button>
                    </>
                  ) : (
                    nextStatuses.map((ns: string) => (
                      <Button
                        key={ns}
                        className={cn(
                          "rounded-lg",
                          ns === "completed"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700"
                        )}
                        onClick={() => handleStatusUpdate(ns)}
                        disabled={updateStatus.isPending}
                      >
                        {ns === "completed" ? <CheckCircle className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                        {NEXT_LABEL[ns] || ns}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <p className="text-white font-medium">{load?.origin?.city}, {load?.origin?.state}</p>
                  </div>
                  {load?.origin?.address && <p className="text-xs text-slate-500 ml-5">{load.origin.address}</p>}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <p className="text-white font-medium">{load?.destination?.city}, {load?.destination?.state}</p>
                  </div>
                  {load?.destination?.address && <p className="text-xs text-slate-500 ml-5">{load.destination.address}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Distance</p>
                  <p className="text-white font-bold">{load?.distance?.toLocaleString() || 0} mi</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Pickup</p>
                  <p className="text-white font-bold text-sm">{load?.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Delivery</p>
                  <p className="text-white font-bold text-sm">{load?.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />Load Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Cargo Type</p>
                  <p className="text-white font-medium text-sm">{load?.cargoType || '—'}</p>
                </div>
                {load?.hazmatClass && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">HazMat Class</p>
                    <p className="text-red-300 font-bold">{load.hazmatClass}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Weight</p>
                  <p className="text-white font-medium text-sm">{load?.weight ? `${load.weight.toLocaleString()} lbs` : '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Equipment</p>
                  <p className="text-white font-medium text-sm">{load?.equipmentType || '—'}</p>
                </div>
              </div>
              {load?.specialInstructions && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />Special Instructions
                  </p>
                  <p className="text-yellow-200 text-sm">{load.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convoy Status */}
          {convoy && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />Convoy Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge className={cn("border-0 mt-1",
                      convoy.status === "active" ? "bg-green-500/20 text-green-400" :
                      convoy.status === "forming" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>{convoy.status}</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Max Speed</p>
                    <p className="text-white font-bold">{convoy.maxSpeedMph || 45} mph</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Lead Distance</p>
                    <p className="text-white font-medium">{convoy.currentLeadDistance || convoy.targetLeadDistanceMeters || '—'}m</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Rear Distance</p>
                    <p className="text-white font-medium">{convoy.currentRearDistance || convoy.targetRearDistanceMeters || '—'}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Contacts & Pay */}
        <div className="space-y-4">

          {/* Pay Card */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400 mb-1">Your Pay</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                ${trip.rate?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">{trip.rateType === 'per_mile' ? 'Per Mile' : 'Flat Rate'}</p>
            </CardContent>
          </Card>

          {/* Driver Contact */}
          {trip.driver && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{trip.driver.name}</p>
                    <p className="text-xs text-slate-500">Driver</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {trip.driver.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                      onClick={() => window.open(`tel:${trip.driver.phone}`)}
                    >
                      <Phone className="w-3 h-3 mr-1" />Call
                    </Button>
                  )}
                  {trip.driver.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                      onClick={() => window.open(`mailto:${trip.driver.email}`)}
                    >
                      <Mail className="w-3 h-3 mr-1" />Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipper Contact */}
          {trip.shipper && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />Shipper
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{trip.shipper.name}</p>
                    <p className="text-xs text-slate-500">Shipper</p>
                  </div>
                </div>
                {trip.shipper.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                    onClick={() => window.open(`tel:${trip.shipper.phone}`)}
                  >
                    <Phone className="w-3 h-3 mr-1" />Call Shipper
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {trip.notes && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-slate-300 text-sm">{trip.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
