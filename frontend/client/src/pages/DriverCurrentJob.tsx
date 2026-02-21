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
  const jobQuery = (trpc as any).drivers.getCurrentAssignment.useQuery();
  const hosQuery = (trpc as any).drivers.getMyHOSStatus.useQuery();

  const updateStatusMutation = (trpc as any).drivers.updateLoadStatus.useMutation({
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
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
                      <p className="text-2xl font-bold text-green-400">{(hosQuery.data as any)?.drivingRemaining}</p>
                      <p className="text-xs text-slate-400">Drive Time Left</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-blue-400">{(hosQuery.data as any)?.onDutyRemaining}</p>
                      <p className="text-xs text-slate-400">On-Duty Left</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{(hosQuery.data as any)?.cycleRemaining}</p>
                      <p className="text-xs text-slate-400">70hr Cycle</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-2xl font-bold text-purple-400">{(hosQuery.data as any)?.breakRemaining}</p>
                      <p className="text-xs text-slate-400">Until Break</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "w-full justify-center py-2",
                    (hosQuery.data as any)?.status === "driving" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                    (hosQuery.data as any)?.status === "on_duty" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    (hosQuery.data as any)?.status === "sleeper" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                  )}>
                    Current: {(hosQuery.data as any)?.status?.replace("_", " ").toUpperCase()}
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
                Load Status Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status timeline pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {['assigned', 'en_route_pickup', 'at_pickup', 'loading', 'in_transit', 'at_delivery', 'unloading', 'delivered'].map((s, idx, arr) => {
                  const isCurrent = job.status === s;
                  const isPast = arr.indexOf(job.status) > idx;
                  return (
                    <React.Fragment key={s}>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                        isCurrent ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent" :
                        isPast ? "bg-green-500/15 text-green-400 border-green-500/30" :
                        "bg-slate-800 text-slate-500 border-slate-700"
                      )}>
                        {s.replace(/_/g, ' ')}
                      </div>
                      {idx < arr.length - 1 && <span className="text-slate-600 text-[8px]">&rarr;</span>}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Trailer-type-aware sequential progression — only show NEXT valid step */}
              {(() => {
                const eq = (job.equipmentType || job.cargoType || "").toLowerCase();
                const isHaz = !!(job.hazmatClass || job.unNumber || job.hazmat);
                const isRfr = eq.includes("reefer") || eq.includes("refrigerat");
                const isFlat = eq.includes("flatbed");
                const isTnk = eq.includes("tank") || eq.includes("tanker");
                const isBulk = eq.includes("hopper") || eq.includes("bulk") || eq.includes("pneumatic");
                const isFood = eq.includes("food") || (job.commodity || "").toLowerCase().match(/milk|juice|oil|wine|sugar|edible/);
                const isWater = eq.includes("water");

                type Step = { next: string; label: string; color: string; hint?: string };
                const chain: Record<string, Step> = {
                  assigned: { next: 'en_route_pickup', label: 'Start Route to Pickup', color: 'bg-blue-600 hover:bg-blue-700' },
                  en_route_pickup: { next: 'at_pickup', label: 'Arrived at Pickup', color: 'bg-blue-600 hover:bg-blue-700' },
                  at_pickup: { next: 'loading', label: 'Start Loading', color: 'bg-cyan-600 hover:bg-cyan-700' },
                  loading: { next: 'in_transit', label: 'Loading Complete — Depart', color: 'bg-green-600 hover:bg-green-700' },
                  in_transit: { next: 'at_delivery', label: 'Arrived at Delivery', color: 'bg-blue-600 hover:bg-blue-700' },
                  at_delivery: { next: 'unloading', label: 'Start Unloading', color: 'bg-purple-600 hover:bg-purple-700' },
                  unloading: { next: 'delivered', label: 'Unloading Complete — Delivered', color: 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF]' },
                };

                // Trailer-specific label + hint overlays
                if (isHaz) {
                  chain.assigned.hint = "Verify placards, shipping papers (49 CFR 172.200), tanker endorsement";
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Hazmat Loading", hint: "Confirm placard placement, seal integrity, emergency info packet" };
                  chain.loading = { ...chain.loading, label: "Verify Seals & Depart", hint: "Confirm seal numbers, check for leaks, verify papers match cargo" };
                  chain.in_transit.hint = "Monitor for spills/leaks, keep shipping papers accessible";
                  chain.at_delivery.hint = "Present shipping papers, confirm consignee identity";
                  chain.unloading = { ...chain.unloading, label: "Hazmat Unload Complete", hint: "Verify all product discharged, remove placards if empty" };
                } else if (isRfr) {
                  chain.assigned.hint = "Pre-cool unit to required temperature before loading";
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Temp-Controlled Loading", hint: "Record pre-load temp reading (FSMA)" };
                  chain.loading = { ...chain.loading, label: "Confirm Temp & Depart", hint: "Record post-load temp, verify door seals" };
                  chain.in_transit.hint = "Monitor reefer temp continuously (FSMA 21 CFR 1.908)";
                  chain.at_delivery.hint = "Record arrival temp before opening doors";
                  chain.unloading = { ...chain.unloading, label: "Reefer Unload Complete", hint: "Record final temp, retain temp log" };
                } else if (isFlat) {
                  chain.assigned.hint = "Inspect chains, binders, straps, and tarps";
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Flatbed Loading", hint: "Position per 49 CFR 393.100" };
                  chain.loading = { ...chain.loading, label: "Securement Complete — Depart", hint: "Verify tiedowns (1/10ft + 2 min)" };
                  chain.in_transit.hint = "Re-check securement within first 50 miles, then every 150 mi / 3 hrs";
                } else if (isTnk) {
                  chain.assigned.hint = "Verify tanker endorsement, inspect valves and gaskets";
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Tanker Loading", hint: "Ground trailer, connect loading arms" };
                  chain.loading = { ...chain.loading, label: "Seal & Depart", hint: "Record gauge, seal valves, check for leaks" };
                  chain.in_transit.hint = "Monitor for surge, maintain safe speed on curves";
                  chain.unloading = { ...chain.unloading, label: "Tanker Discharge Complete", hint: "Verify full discharge, drain lines" };
                } else if (isFood) {
                  chain.assigned.hint = "Verify wash ticket from last 3 loads (FSMA)";
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Food-Grade Loading", hint: "Present wash ticket to shipper" };
                  chain.loading = { ...chain.loading, label: "Seal & Depart", hint: "Apply tamper-evident seals" };
                  chain.unloading = { ...chain.unloading, label: "Food-Grade Discharge Complete", hint: "Verify product quality" };
                } else if (isWater) {
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Water Loading", hint: "Verify source quality, connect sanitary hoses" };
                  chain.loading = { ...chain.loading, label: "Seal & Depart", hint: "Seal fill ports, record volume" };
                  chain.unloading = { ...chain.unloading, label: "Water Discharge Complete", hint: "Verify delivery volume" };
                } else if (isBulk) {
                  chain.at_pickup = { ...chain.at_pickup, label: "Begin Pneumatic Loading", hint: "Connect pneumatic lines, verify grade" };
                  chain.loading = { ...chain.loading, label: "Seal & Depart", hint: "Verify weight (80,000 lb GVW max), seal hopper gates" };
                  chain.unloading = { ...chain.unloading, label: "Pneumatic Discharge Complete", hint: "Verify complete discharge" };
                }

                const step = chain[job.status];
                if (!step) return null;

                return (
                  <div className="space-y-2">
                    {step.hint && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-300/90 leading-relaxed">{step.hint}</p>
                      </div>
                    )}
                    <Button
                      className={cn("w-full rounded-lg font-bold", step.color)}
                      onClick={() => updateStatusMutation.mutate({ status: step.next })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {step.label}
                    </Button>
                  </div>
                );
              })()}

              {job.status === 'delivered' && (
                <div className="text-center py-3">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium text-sm">Load Delivered</p>
                </div>
              )}

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
