/**
 * LOAD DETAILS PAGE
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
  Package, MapPin, Truck, DollarSign, Calendar, ArrowLeft,
  Phone, Navigation, Clock, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";

const SPECTRA_KEYWORDS = ["crude", "oil", "petroleum", "condensate", "bitumen", "naphtha", "diesel", "gasoline", "kerosene", "fuel", "lpg", "propane", "butane", "ethanol", "methanol"];
function isSpectraQualified(commodity: string, hazmatClass?: string): boolean {
  const c = (commodity || "").toLowerCase();
  if (SPECTRA_KEYWORDS.some(k => c.includes(k))) return true;
  if (["2", "3"].includes(hazmatClass || "")) return true;
  return false;
}

export default function LoadDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const loadId = params.id as string;

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId });
  const load = loadQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Posted</Badge>;
      case "assigned": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Assigned</Badge>;
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Load not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/loads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Loads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/loads")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {load.loadNumber || `Load #${load.id?.slice(0, 6)}`}
              </h1>
              {getStatusBadge(load.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">Load Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Phone className="w-4 h-4 mr-2" />Contact
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Navigation className="w-4 h-4 mr-2" />Track
          </Button>
        </div>
      </div>

      {/* Rate Card */}
      <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Load Rate</p>
              <p className="text-4xl font-bold text-white">${(load.rate || 0).toLocaleString()}</p>
              <p className="text-emerald-400 text-sm mt-1">${((Number(load.rate) || 0) / Math.max(Number(load.distance) || 1, 1)).toFixed(2)}/mile</p>
            </div>
            <div className="p-4 rounded-full bg-emerald-500/20">
              <DollarSign className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-green-400" />
                <div className="w-0.5 h-16 bg-slate-600" />
                <div className="w-4 h-4 rounded-full bg-red-400" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-white font-medium">{load.origin?.city}, {load.origin?.state}</p>
                  <p className="text-sm text-slate-400">{load.origin?.address}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Pickup: {String(load.pickupDate || "")}</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium">{load.destination?.city}, {load.destination?.state}</p>
                  <p className="text-sm text-slate-400">{load.destination?.address}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Delivery: {String(load.deliveryDate || "")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-slate-700/30 text-center">
              <p className="text-slate-400 text-sm">Total Distance</p>
              <p className="text-white font-bold text-xl">{load.distance || 0} miles</p>
            </div>
          </CardContent>
        </Card>

        {/* Load Info */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Load Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Equipment</span>
                </div>
                <p className="text-white font-medium">{load.equipmentType || "N/A"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Weight</span>
                </div>
                <p className="text-white font-medium">{(load.weight || 0).toLocaleString()} lbs</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-sm">Commodity</span>
              </div>
              <p className="text-white font-medium">{load.commodity || "General Freight"}</p>
            </div>
            {load.notes && (
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-slate-400 text-sm mb-1">Notes</p>
                <p className="text-white">{load.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SPECTRA-MATCH™ Oil Identification - for drivers/catalysts/carriers */}
        {isSpectraQualified(load.commodity, load.hazmatClass) && (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <SpectraMatchWidget
                compact={true}
                loadId={loadId}
                showSaveButton={true}
                onIdentify={(result) => {
                  console.log("SpectraMatch result:", result);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Driver/Carrier Info */}
        {load.driver && (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Assigned Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyan-500/20">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{load.driver.name}</p>
                  <p className="text-sm text-slate-400">{load.driver.phone}</p>
                  <p className="text-xs text-slate-500">Truck: {load.driver.truckNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {load.timeline?.map((event: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-2", event.completed ? "bg-green-400" : "bg-slate-500")} />
                  <div>
                    <p className={cn("font-medium", event.completed ? "text-white" : "text-slate-500")}>{event.title}</p>
                    <p className="text-xs text-slate-500">{event.date}</p>
                  </div>
                </div>
              )) || (
                <p className="text-slate-400 text-center py-4">No timeline events</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
