/**
 * DISPATCH ASSIGNMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Users, Package, MapPin, ArrowRight, Clock,
  CheckCircle, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function DispatchAssignment() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const loadId = params.loadId as string;
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId });
  const driversQuery = (trpc as any).dispatch.getAvailableDrivers.useQuery({ loadId });
  const recommendationsQuery = (trpc as any).dispatch.getRecommendations.useQuery({ loadId });

  const assignMutation = (trpc as any).dispatch.assignDriver.useMutation({
    onSuccess: () => { toast.success("Driver assigned successfully"); setLocation("/dispatch"); },
    onError: (error: any) => toast.error("Failed to assign driver", { description: error.message }),
  });

  const load = loadQuery.data;

  const handleAssign = () => {
    if (!selectedDriver) {
      toast.error("Please select a driver");
      return;
    }
    assignMutation.mutate({ loadId, driverId: selectedDriver });
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Assign Driver
          </h1>
          <p className="text-slate-400 text-sm mt-1">Select a driver for {load?.loadNumber}</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleAssign} disabled={!selectedDriver || assignMutation.isPending}>
          <CheckCircle className="w-4 h-4 mr-2" />Confirm Assignment
        </Button>
      </div>

      {/* Load Summary */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{load?.loadNumber}</p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-3 h-3 text-green-400" />
                  <span>{load?.origin?.city}, {load?.origin?.state}</span>
                  <ArrowRight className="w-3 h-3" />
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span>{load?.destination?.city}, {load?.destination?.state}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-xl">${(load?.rate || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">{load?.distance} miles • {load?.equipmentType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              ESANG AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendationsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (recommendationsQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recommendations available</p>
            ) : (
              <div className="space-y-3">
                {(recommendationsQuery.data as any)?.map((rec: any, idx: number) => (
                  <div 
                    key={rec.driverId} 
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all",
                      selectedDriver === rec.driverId 
                        ? "bg-purple-500/20 border-purple-500" 
                        : "bg-slate-700/30 border-transparent hover:border-purple-500/50"
                    )}
                    onClick={() => setSelectedDriver(rec.driverId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400 border-0">#{idx + 1}</Badge>
                        <p className="text-white font-medium">{rec.driverName}</p>
                      </div>
                      <p className="text-purple-400 font-bold">{rec.score}%</p>
                    </div>
                    <p className="text-xs text-slate-400">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Drivers */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {driversQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (driversQuery.data as any)?.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">No available drivers</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(driversQuery.data as any)?.map((driver: any) => (
                  <div 
                    key={driver.id} 
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      selectedDriver === driver.id 
                        ? "bg-cyan-500/10 border-l-4 border-cyan-500" 
                        : "hover:bg-slate-700/20"
                    )}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-full", selectedDriver === driver.id ? "bg-cyan-500/20" : "bg-green-500/20")}>
                          <Users className={cn("w-5 h-5", selectedDriver === driver.id ? "text-cyan-400" : "text-green-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-sm text-slate-400">{driver.truckNumber}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {driver.currentLocation?.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              HOS: {driver.hosRemaining}h
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{driver.distanceToPickup} mi</p>
                        <p className="text-xs text-slate-500">to pickup</p>
                        <Badge className="mt-1 bg-green-500/20 text-green-400 border-0">Available</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
