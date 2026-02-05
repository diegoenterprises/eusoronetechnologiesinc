/**
 * DRIVER CHECK-IN PAGE
 * 100% Dynamic - Terminal/facility check-in with appointment verification
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  MapPin, Clock, CheckCircle, AlertTriangle, Truck,
  ChevronLeft, QrCode, Send, Building, Calendar,
  Package, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverCheckIn() {
  const [, navigate] = useLocation();
  const [checkInCode, setCheckInCode] = useState("");

  const loadQuery = (trpc as any).loads.getTrackedLoads.useQuery({ search: "" });
  const appointmentQuery = (trpc as any).appointments.getById.useQuery({ 
    id: (loadQuery.data as any)?.[0]?.id?.toString() || "" 
  }, { enabled: !!(loadQuery.data as any)?.[0]?.id });
  const facilityQuery = (trpc as any).facilities.getById.useQuery({ 
    id: ((loadQuery.data as any)?.[0] as any)?.originFacilityId?.toString() || "" 
  }, { enabled: !!((loadQuery.data as any)?.[0] as any)?.originFacilityId });

  const checkInMutation = (trpc as any).appointments.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in successful");
      navigate("/driver/dashboard");
    },
    onError: (error: any) => toast.error("Check-in failed", { description: error.message }),
  });

  const load = (loadQuery.data as any)?.[0];
  const appointment = appointmentQuery.data;
  const facility = facilityQuery.data;

  const isOnTime = appointment?.scheduledTime && new Date() <= new Date(appointment.scheduledTime);

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/driver/dashboard")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Facility Check-In
          </h1>
          <p className="text-slate-400 text-sm mt-1">{(load as any)?.currentStop?.type === "pickup" ? "Pickup" : "Delivery"}</p>
        </div>
      </div>

      {/* Facility Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-cyan-500/20">
              <Building className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">{facility?.name}</p>
              <p className="text-slate-400">{facility?.address?.street}</p>
              <p className="text-slate-400 text-sm">{facility?.address?.city}, {facility?.address?.state} {facility?.address?.zip}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />Appointment
              </p>
              <p className="text-white font-medium">{appointment?.scheduledTime || "Walk-in"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Package className="w-3 h-3" />Load #
              </p>
              <p className="text-white font-medium">{load?.loadNumber}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Truck className="w-3 h-3" />Gate
              </p>
              <p className="text-white font-medium">{(facility as any)?.checkInGate || "Main"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />Dock
              </p>
              <p className="text-white font-medium">{(appointment as any)?.assignedDock || "TBD"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Status */}
      <Card className={cn(
        "rounded-xl",
        isOnTime ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {isOnTime ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            )}
            <div>
              <p className={cn("font-medium", isOnTime ? "text-green-400" : "text-yellow-400")}>
                {isOnTime ? "On Time" : "Running Late"}
              </p>
              <p className="text-slate-300 text-sm">
                {isOnTime 
                  ? `Appointment at ${appointment?.scheduledTime}` 
                  : `Appointment was at ${appointment?.scheduledTime}`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {(facility as any)?.requirements && (facility as any).requirements.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Facility Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(facility as any).requirements.map((req: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">{req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-In Code Entry */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            Check-In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Enter Check-In Code (if provided)</label>
            <Input
              value={checkInCode}
              onChange={(e: any) => setCheckInCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              className="bg-slate-700/50 border-slate-600/50 rounded-lg text-center text-xl tracking-widest font-mono"
              maxLength={10}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code
            </Button>
            <Button
              onClick={() => checkInMutation.mutate({
                appointmentId: appointment?.id || "",
                notes: checkInCode || undefined,
              })}
              disabled={checkInMutation.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">1</span>
              <span>Pull up to the check-in gate and present your CDL and load documents</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">2</span>
              <span>Enter the check-in code provided by security or scan the QR code</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">3</span>
              <span>Wait for dock assignment - you will be notified in the app</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">4</span>
              <span>Proceed to assigned dock when notified</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Contact */}
      {facility?.contact?.phone && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Facility Contact</p>
                <p className="text-white font-medium">{facility.contact.phone}</p>
              </div>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                Call Facility
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
