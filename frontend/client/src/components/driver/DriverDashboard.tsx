/**
 * DRIVER DASHBOARD COMPONENT
 * Mobile-first dashboard for drivers
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, Clock, MapPin, Navigation, Phone, FileText,
  Camera, CheckCircle, AlertTriangle, DollarSign, Fuel,
  Thermometer, Package, ChevronRight, Play, Pause, Square, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Cargo type display labels including non-hazmat tanker types
const CARGO_LABELS: Record<string, string> = {
  liquid: "Liquid", gas: "Gas", chemicals: "Chemicals", petroleum: "Petroleum",
  hazmat: "Hazmat", general: "General", refrigerated: "Refrigerated", oversized: "Oversized",
  food_grade: "Food-Grade Liquid", water: "Water",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  posted: "Posted",
  bidding: "Bidding",
  assigned: "Assigned",
  en_route_pickup: "En Route to Pickup",
  at_pickup: "At Pickup",
  loading: "Loading",
  in_transit: "In Transit",
  en_route_delivery: "En Route to Delivery",
  at_delivery: "At Delivery",
  unloading: "Unloading",
  delivered: "Delivered",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const STATUS_COLORS = {
  driving: { bg: "bg-green-500", text: "text-green-400" },
  on_duty: { bg: "bg-blue-500", text: "text-blue-400" },
  off_duty: { bg: "bg-slate-500", text: "text-slate-400" },
  sleeper: { bg: "bg-purple-500", text: "text-purple-400" },
};

function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}h ${minutes}m`;
}

interface DriverDashboardProps {
  driverName?: string;
  vehicleNumber?: string;
}

export function DriverDashboard({ driverName, vehicleNumber }: DriverDashboardProps) {
  const { user } = useAuth();
  const name = driverName || user?.name || 'Driver';

  // Real tRPC queries
  const currentLoadQuery = trpc.drivers.getCurrentLoad.useQuery();
  const dashStatsQuery = trpc.drivers.getDashboardStats.useQuery();
  const hosQuery = trpc.drivers.getHOSStatus.useQuery();
  const updateStatusMut = trpc.dispatch.updateLoadStatus.useMutation();

  const currentLoad = currentLoadQuery.data || null;
  const dashStats = dashStatsQuery.data;
  const hosData = hosQuery.data;

  // Derive HOS in minutes for display
  const hosRemaining = {
    driving: Math.round((hosData?.hoursAvailable?.driving || hosData?.driving || 11) * 60),
    onDuty: Math.round((hosData?.hoursAvailable?.onDuty || hosData?.onDuty || 14) * 60),
    cycle: Math.round((hosData?.hoursAvailable?.cycle || hosData?.cycle || 70) * 60),
  };
  const breakDueIn = hosData?.nextBreakRequired ? Math.max(0, Math.round((new Date(hosData.nextBreakRequired).getTime() - Date.now()) / 60000)) : undefined;

  const [dutyStatus, setDutyStatus] = useState<"driving" | "on_duty" | "off_duty" | "sleeper">("off_duty");

  const handleStatusChange = (newStatus: "driving" | "on_duty" | "off_duty" | "sleeper") => {
    setDutyStatus(newStatus);
    toast.success(`Status changed to ${newStatus.replace("_", " ")}`);
  };

  const handleLoadStatusUpdate = (status: string) => {
    if (!currentLoad) return;
    updateStatusMut.mutate(
      { loadId: currentLoad.id, status: status as any },
      {
        onSuccess: () => {
          toast.success(`Load status updated to ${status.replace(/_/g, ' ')}`);
          currentLoadQuery.refetch();
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleAction = (action: string) => {
    toast.success(`${action} recorded`);
  };

  const isLoading = currentLoadQuery.isLoading || dashStatsQuery.isLoading;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{name}</h1>
          <p className="text-sm text-slate-400">{vehicleNumber ? `Unit #${vehicleNumber}` : dashStats?.currentStatus === 'on_load' ? 'On Load' : 'Available'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full animate-pulse", STATUS_COLORS[dutyStatus].bg)} />
          <span className={cn("text-sm font-medium capitalize", STATUS_COLORS[dutyStatus].text)}>
            {dutyStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* HOS Summary */}
      <Card className="bg-white/[0.02] border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Hours of Service</span>
            {hosQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          </div>

          <div className="space-y-3">
            {/* Driving Time */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Driving</span>
                <span className={hosRemaining.driving > 120 ? "text-green-400" : "text-yellow-400"}>
                  {formatMinutes(hosRemaining.driving)} left
                </span>
              </div>
              <Progress 
                value={(hosRemaining.driving / 660) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>

            {/* On-Duty Time */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">On-Duty</span>
                <span className="text-blue-400">{formatMinutes(hosRemaining.onDuty)} left</span>
              </div>
              <Progress 
                value={(hosRemaining.onDuty / 840) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>

            {/* 70-Hour Cycle */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">70-Hour Cycle</span>
                <span className="text-purple-400">{formatMinutes(hosRemaining.cycle)} left</span>
              </div>
              <Progress 
                value={(hosRemaining.cycle / 4200) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
          </div>

          {/* Break Warning */}
          {breakDueIn !== undefined && breakDueIn < 240 && (
            <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">
                30-min break required in {formatMinutes(breakDueIn)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duty Status Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {(["driving", "on_duty", "off_duty", "sleeper"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={dutyStatus === status ? "default" : "outline"}
            onClick={() => handleStatusChange(status)}
            className={cn(
              "flex flex-col h-16 text-xs",
              dutyStatus === status && STATUS_COLORS[status].bg,
              dutyStatus !== status && "border-slate-600"
            )}
          >
            {status === "driving" && <Play className="w-4 h-4 mb-1" />}
            {status === "on_duty" && <Truck className="w-4 h-4 mb-1" />}
            {status === "off_duty" && <Pause className="w-4 h-4 mb-1" />}
            {status === "sleeper" && <Square className="w-4 h-4 mb-1" />}
            <span className="capitalize">{status.replace("_", " ")}</span>
          </Button>
        ))}
      </div>

      {/* Current Load */}
      {currentLoad && (
        <Card className="bg-white/[0.02] border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                {currentLoad.loadNumber}
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400">
                {STATUS_LABELS[currentLoad.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Commodity — hazmat vs non-hazmat display */}
            {currentLoad.hazmatClass ? (
              <div className="flex items-center gap-3 p-3 rounded bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm text-white font-medium">{currentLoad.commodity}</p>
                  <p className="text-xs text-orange-400">
                    Class {currentLoad.hazmatClass} • {currentLoad.unNumber || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                <Package className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-white font-medium">{currentLoad.commodity}</p>
                  <p className="text-xs text-cyan-400">
                    {(CARGO_LABELS[currentLoad.cargoType || ''] || currentLoad.cargoType || 'General Freight')}
                  </p>
                </div>
              </div>
            )}

            {/* Route */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Pickup{currentLoad.pickupDate ? ` • ${new Date(currentLoad.pickupDate).toLocaleString()}` : ''}</p>
                  <p className="text-sm text-white">{currentLoad.origin.name}</p>
                  <p className="text-xs text-slate-500">
                    {currentLoad.origin.city}, {currentLoad.origin.state}
                  </p>
                </div>
                {['loading', 'in_transit', 'en_route_delivery', 'at_delivery', 'unloading', 'delivered'].includes(currentLoad.status) && (
                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>

              <div className="ml-3 border-l-2 border-dashed border-slate-600 h-4" />

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Delivery{currentLoad.deliveryDate ? ` • ${new Date(currentLoad.deliveryDate).toLocaleString()}` : ''}</p>
                  <p className="text-sm text-white">{currentLoad.destination.name}</p>
                  <p className="text-xs text-slate-500">
                    {currentLoad.destination.city}, {currentLoad.destination.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {currentLoad.specialInstructions && (
              <div className="p-2 rounded bg-white/[0.04] text-xs text-slate-300">
                <p className="text-slate-400 mb-1">Instructions:</p>
                {currentLoad.specialInstructions}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction("Navigate")}>
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              <Button variant="outline" className="border-slate-600" onClick={() => handleAction("Call")}>
                <Phone className="w-4 h-4 mr-2" />
                Call Shipper
              </Button>
            </div>

            {/* Load Status Progression Actions — Trailer-type-aware */}
            {(() => {
              const eq = (currentLoad.equipmentType || currentLoad.cargoType || "").toLowerCase();
              const isHaz = !!(currentLoad.hazmatClass || currentLoad.unNumber);
              const isRfr = eq.includes("reefer") || eq.includes("refrigerat");
              const isFlat = eq.includes("flatbed");
              const isTnk = eq.includes("tank") || eq.includes("tanker");
              const isBulk = eq.includes("hopper") || eq.includes("bulk") || eq.includes("pneumatic");
              const isFood = eq.includes("food") || (currentLoad.commodity || "").toLowerCase().match(/milk|juice|oil|wine|sugar|edible/);
              const isWater = eq.includes("water");

              // Trailer-specific labels per status
              const labels: Record<string, { label: string; hint?: string }> = {
                at_pickup: { label: "Start Loading" },
                loading: { label: "Loading Complete — Depart" },
                unloading: { label: "Unloading Complete — Delivered" },
              };
              if (isHaz) {
                labels.at_pickup = { label: "Begin Hazmat Loading", hint: "Verify placards, seal integrity, emergency packet" };
                labels.loading = { label: "Verify Seals & Depart", hint: "Confirm seal numbers, check for leaks" };
                labels.unloading = { label: "Hazmat Unload Complete", hint: "Verify all product discharged, retain papers" };
              } else if (isRfr) {
                labels.at_pickup = { label: "Begin Temp-Controlled Loading", hint: "Record pre-load temp (FSMA)" };
                labels.loading = { label: "Confirm Temp & Depart", hint: "Record post-load temp, verify door seals" };
                labels.unloading = { label: "Reefer Unload Complete", hint: "Record final temp, retain temp log" };
              } else if (isFlat) {
                labels.at_pickup = { label: "Begin Flatbed Loading", hint: "Position per 49 CFR 393.100" };
                labels.loading = { label: "Securement Complete — Depart", hint: "Verify tiedowns (1/10ft + 2 min)" };
                labels.unloading = { label: "Flatbed Unload Complete" };
              } else if (isTnk) {
                labels.at_pickup = { label: "Begin Tanker Loading", hint: "Ground trailer, connect loading arms" };
                labels.loading = { label: "Seal & Depart", hint: "Record gauge, seal valves, check leaks" };
                labels.unloading = { label: "Tanker Discharge Complete", hint: "Verify full discharge, drain lines" };
              } else if (isFood) {
                labels.at_pickup = { label: "Begin Food-Grade Loading", hint: "Present wash ticket (FSMA)" };
                labels.loading = { label: "Seal & Depart", hint: "Apply tamper-evident seals" };
                labels.unloading = { label: "Food-Grade Discharge Complete", hint: "Verify product quality" };
              } else if (isWater) {
                labels.at_pickup = { label: "Begin Water Loading", hint: "Verify source quality, connect sanitary hoses" };
                labels.loading = { label: "Seal & Depart", hint: "Seal fill ports, record volume" };
                labels.unloading = { label: "Water Discharge Complete", hint: "Verify delivery volume" };
              } else if (isBulk) {
                labels.at_pickup = { label: "Begin Pneumatic Loading", hint: "Connect pneumatic lines, verify grade" };
                labels.loading = { label: "Seal & Depart", hint: "Verify weight, seal hopper gates" };
                labels.unloading = { label: "Pneumatic Discharge Complete", hint: "Verify complete discharge" };
              }

              const hint = labels[currentLoad.status]?.hint;
              return (
                <div className="space-y-2">
                  {hint && (
                    <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-300/90 leading-relaxed">{hint}</p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {currentLoad.status === 'assigned' && (
                      <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleLoadStatusUpdate('en_route_pickup')}>
                        <Navigation className="w-3 h-3 mr-1" />En Route to Pickup
                      </Button>
                    )}
                    {currentLoad.status === 'en_route_pickup' && (
                      <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleLoadStatusUpdate('at_pickup')}>
                        <MapPin className="w-3 h-3 mr-1" />Arrived at Pickup
                      </Button>
                    )}
                    {currentLoad.status === 'at_pickup' && (
                      <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleLoadStatusUpdate('loading')}>
                        <Package className="w-3 h-3 mr-1" />{labels.at_pickup?.label || "Start Loading"}
                      </Button>
                    )}
                    {currentLoad.status === 'loading' && (
                      <Button size="sm" className="flex-1 bg-green-600" onClick={() => handleLoadStatusUpdate('in_transit')}>
                        <Truck className="w-3 h-3 mr-1" />{labels.loading?.label || "Loading Complete — Depart"}
                      </Button>
                    )}
                    {(currentLoad.status === 'in_transit' || (currentLoad.status as string) === 'en_route_delivery') && (
                      <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleLoadStatusUpdate('at_delivery')}>
                        <MapPin className="w-3 h-3 mr-1" />Arrived at Delivery
                      </Button>
                    )}
                    {currentLoad.status === 'at_delivery' && (
                      <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleLoadStatusUpdate('unloading')}>
                        <Package className="w-3 h-3 mr-1" />Start Unloading
                      </Button>
                    )}
                    {currentLoad.status === 'unloading' && (
                      <Button size="sm" className="flex-1 bg-green-600" onClick={() => handleLoadStatusUpdate('delivered')}>
                        <CheckCircle className="w-3 h-3 mr-1" />{labels.unloading?.label || "Unloading Complete — Delivered"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 border-slate-600" onClick={() => handleAction("Photo uploaded")}>
                <Camera className="w-3 h-3 mr-1" />Photo
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-slate-600" onClick={() => handleAction("Documents")}>
                <FileText className="w-3 h-3 mr-1" />Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings */}
      <Card className="bg-white/[0.02] border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Earnings</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400">This Week</p>
              <p className="text-lg font-bold text-green-400">${(dashStats?.weeklyEarnings || dashStats?.earningsThisWeek || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Loads</p>
              <p className="text-lg font-bold text-white">{dashStats?.loadsCompleted || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Safety</p>
              <p className="text-lg font-bold text-white">{dashStats?.safetyScore || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400">Miles this week</span>
            <span className="text-white">{(dashStats?.weeklyMiles || dashStats?.milesThisWeek || 0).toLocaleString()} mi</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Pre-trip inspection")}>
          <CheckCircle className="w-5 h-5 mb-1 text-green-400" />
          <span className="text-xs">Pre-Trip</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("DVIR")}>
          <FileText className="w-5 h-5 mb-1 text-blue-400" />
          <span className="text-xs">DVIR</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Fuel stop")}>
          <Fuel className="w-5 h-5 mb-1 text-yellow-400" />
          <span className="text-xs">Fuel Stop</span>
        </Button>
        <Button variant="outline" className="h-14 border-slate-600 flex-col" onClick={() => handleAction("Report issue")}>
          <AlertTriangle className="w-5 h-5 mb-1 text-red-400" />
          <span className="text-xs">Report Issue</span>
        </Button>
      </div>
    </div>
  );
}

export default DriverDashboard;
