/**
 * CATALYST RELIEF DRIVER PAGE
 * 100% Dynamic - Manage relief driver dispatch for HOS violations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  Clock, User, Truck, MapPin, ChevronLeft, Send,
  CheckCircle, AlertTriangle, Phone, Navigation,
  Calendar, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystReliefDriver() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/catalyst/relief/:loadId");
  const loadId = params?.loadId;

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const currentDriverQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const availableQuery = (trpc as any).drivers.getAvailable.useQuery({});

  const dispatchMutation = (trpc as any).catalysts.assignDriver.useMutation({
    onSuccess: () => {
      toast.success("Relief driver dispatched");
      navigate("/catalyst/dashboard");
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const load = loadQuery.data;
  const currentDriver = currentDriverQuery.data;
  const availableDrivers = availableQuery.data || [];

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
          onClick={() => navigate("/catalyst/dashboard")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Relief Driver
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
        <Badge className="bg-red-500/20 text-red-400 border-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          HOS Critical
        </Badge>
      </div>

      {/* Current Situation */}
      <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <Clock className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium">Driver Out of Hours</p>
              <p className="text-white font-bold text-xl">{(currentDriver as any)?.name || "Driver"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs">Driving Left</p>
              <p className="text-red-400 font-bold">{(currentDriver as any)?.hos?.drivingRemaining || "0:00"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs">On-Duty Left</p>
              <p className="text-red-400 font-bold">{(currentDriver as any)?.hos?.onDutyRemaining || "0:00"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs">Current Location</p>
              <p className="text-white font-medium text-sm">{(currentDriver as any)?.currentLocation?.city || "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs">Miles to Dest</p>
              <p className="text-white font-bold">{(load as any)?.remainingMiles || load?.distance} mi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Load Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-white font-bold">{load?.origin?.city}</p>
              <p className="text-slate-400 text-sm">{load?.origin?.state}</p>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-red-400" />
            <div className="text-center">
              <p className="text-white font-bold">{load?.destination?.city}</p>
              <p className="text-slate-400 text-sm">{load?.destination?.state}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Delivery Due</p>
              <p className="text-white">{load?.deliveryDate} {(load as any)?.deliveryTime || ""}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Product</p>
              <p className="text-white">{load?.product}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Shipper</p>
              <p className="text-white">{load?.shipper?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Relief Drivers */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Available Relief Drivers ({availableDrivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableQuery.isLoading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : availableDrivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No relief drivers available nearby</p>
              <p className="text-slate-500 text-sm mt-1">Try expanding search radius</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableDrivers.map((driver: any) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedDriver === driver.id
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{driver.distance} mi away
                          </span>
                          <span className="text-slate-400">ETA: {driver.eta}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Driving Avail</p>
                        <p className="text-green-400 font-bold">{driver.hos?.drivingAvailable}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Duty</p>
                        <p className="text-green-400 font-bold">{driver.hos?.onDutyAvailable}h</p>
                      </div>

                      {driver.hazmatCertified && (
                        <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                          Hazmat
                        </Badge>
                      )}

                      {selectedDriver === driver.id && (
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Phone className="w-3 h-3 mr-1" />Call
                    </Button>
                    <span className="text-slate-500 text-xs">{driver.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4 space-y-2">
          <label className="text-slate-300 text-sm">Dispatch Notes</label>
          <Textarea
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Add any special instructions for the relief driver..."
            className="bg-slate-700/50 border-slate-600/50 rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/catalyst/dashboard")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => dispatchMutation.mutate({
            loadId: loadId!,
            driverId: selectedDriver!,
            notes,
          } as any)}
          disabled={!selectedDriver || dispatchMutation.isPending}
          className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Dispatch Relief Driver
        </Button>
      </div>
    </div>
  );
}
