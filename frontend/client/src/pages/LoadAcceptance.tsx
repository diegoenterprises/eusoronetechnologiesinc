/**
 * LOAD ACCEPTANCE PAGE
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
  Package, MapPin, Clock, DollarSign, Truck,
  CheckCircle, XCircle, AlertTriangle, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoadAcceptance() {
  const pendingQuery = trpc.drivers.getPendingLoads.useQuery();
  const hosQuery = trpc.drivers.getHOSAvailability.useQuery();

  const acceptMutation = trpc.drivers.acceptLoad.useMutation({
    onSuccess: () => { toast.success("Load accepted"); pendingQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const declineMutation = trpc.drivers.declineLoad.useMutation({
    onSuccess: () => { toast.success("Load declined"); pendingQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const hos = hosQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Load Acceptance</h1>
          <p className="text-slate-400 text-sm mt-1">Review and accept assigned loads</p>
        </div>
      </div>

      {hosQuery.isLoading ? <Skeleton className="h-24 w-full rounded-xl" /> : hos && (
        <Card className={cn("rounded-xl", hos.canAccept ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", hos.canAccept ? "bg-green-500/20" : "bg-red-500/20")}>
                  <Clock className={cn("w-6 h-6", hos.canAccept ? "text-green-400" : "text-red-400")} />
                </div>
                <div>
                  <p className="text-white font-bold">HOS Availability</p>
                  <p className="text-sm text-slate-400">Driving: {hos.drivingRemaining}h | On-Duty: {hos.onDutyRemaining}h | Cycle: {hos.cycleRemaining}h</p>
                </div>
              </div>
              {hos.canAccept ? (
                <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />HOS Limit</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Pending Loads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {pendingQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
          ) : pendingQuery.data?.length === 0 ? (
            <div className="text-center py-16"><Package className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No pending loads</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {pendingQuery.data?.map((load: any) => (
                <div key={load.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 text-sm">#{load.loadNumber}</span>
                        <p className="text-white font-bold text-lg">{load.shipper}</p>
                        {load.hazmat && <Badge className="bg-orange-500/20 text-orange-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Hazmat</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{load.product} - {load.weight}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">${load.rate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">${load.ratePerMile}/mi</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 text-green-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Origin</span></div>
                      <p className="text-white text-sm">{load.origin}</p>
                      <p className="text-xs text-slate-500">{load.pickupDate} @ {load.pickupTime}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 text-red-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Destination</span></div>
                      <p className="text-white text-sm">{load.destination}</p>
                      <p className="text-xs text-slate-500">{load.deliveryDate} @ {load.deliveryTime}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 text-cyan-400 mb-1"><Navigation className="w-4 h-4" /><span className="text-xs">Distance</span></div>
                      <p className="text-white text-sm">{load.miles} miles</p>
                      <p className="text-xs text-slate-500">Est. {load.estimatedHours}h</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 text-purple-400 mb-1"><Truck className="w-4 h-4" /><span className="text-xs">Equipment</span></div>
                      <p className="text-white text-sm">{load.equipment}</p>
                      <p className="text-xs text-slate-500">{load.trailer || "Any trailer"}</p>
                    </div>
                  </div>

                  {!hos?.canAccept && load.estimatedHours > hos?.drivingRemaining && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-400">Insufficient HOS for this load. Estimated {load.estimatedHours}h driving required.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg" onClick={() => declineMutation.mutate({ loadId: load.id })}>
                      <XCircle className="w-4 h-4 mr-2" />Decline
                    </Button>
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={() => acceptMutation.mutate({ loadId: load.id })} disabled={!hos?.canAccept}>
                      <CheckCircle className="w-4 h-4 mr-2" />Accept Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
