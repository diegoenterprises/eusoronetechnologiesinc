/**
 * CATALYST DRIVER ASSIGNMENT PAGE
 * 100% Dynamic - AI-assisted driver assignment with HOS checking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  User, Truck, Clock, MapPin, CheckCircle, AlertTriangle,
  ChevronLeft, Sparkles, Navigation, Star, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystDriverAssignment() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/catalyst/assign/:loadId");
  const loadId = params?.loadId;

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const driversQuery = (trpc as any).catalysts.getAvailableDrivers.useQuery({ loadId: loadId || "" });
  const aiQuery = (trpc as any).catalysts.getAvailableDrivers.useQuery({ loadId: loadId || "" });

  const assignMutation = (trpc as any).catalysts.assignDriver.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned successfully");
      navigate("/catalyst/dispatch");
    },
    onError: (error: any) => toast.error("Assignment failed", { description: error.message }),
  });

  const load = loadQuery.data;
  const drivers = driversQuery.data || [];
  const aiRecommendations = aiQuery.data || [];

  const filteredDrivers = drivers.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

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
          onClick={() => navigate("/catalyst/dispatch")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Assign Driver
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
      </div>

      {/* Load Summary */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-slate-400 text-xs">Route</p>
              <p className="text-white font-medium">{load?.origin?.city} → {load?.destination?.city}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Distance</p>
              <p className="text-white font-medium">{load?.distance} mi</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Est. Time</p>
              <p className="text-white font-medium">{(load as any)?.estimatedHours || "N/A"}h</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Pickup</p>
              <p className="text-white font-medium">{(load as any)?.pickupDate ? new Date((load as any).pickupDate).toLocaleDateString() : "TBD"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Equipment</p>
              <Badge className="bg-slate-600/50 text-slate-300 border-0">{(load as any)?.equipment || load?.cargoType}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {aiQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : aiRecommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              ESANG AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiRecommendations.slice(0, 3).map((rec: any, index: number) => (
                <div
                  key={rec.driverId}
                  onClick={() => setSelectedDriver(rec.driverId)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedDriver === rec.driverId
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{rec.driverName}</p>
                      <p className="text-purple-400 text-sm">{rec.matchScore}% match</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Available Drivers
            </CardTitle>
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search drivers..."
              className="w-64 bg-slate-700/50 border-slate-600/50 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          {driversQuery.isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No available drivers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map((driver: any) => {
                const hosOk = driver.drivingRemaining >= ((load as any)?.estimatedHours || 0);
                return (
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
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <User className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{driver.name}</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s: any) => (
                                <Star
                                  key={s}
                                  className={cn("w-3 h-3", s <= driver.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-400 text-sm">Truck #{driver.truckNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">HOS Available</p>
                          <p className={cn("font-medium", hosOk ? "text-green-400" : "text-red-400")}>
                            {driver.drivingRemaining}h
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Distance</p>
                          <p className="text-white font-medium">{driver.distanceFromPickup} mi</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Status</p>
                          <Badge className={cn(
                            "border-0",
                            driver.status === "available" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {driver.status}
                          </Badge>
                        </div>

                        {!hosOk && (
                          <Badge className="bg-red-500/20 text-red-400 border-0">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            HOS
                          </Badge>
                        )}

                        {selectedDriver === driver.id && (
                          <CheckCircle className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/catalyst/dispatch")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => assignMutation.mutate({ loadId: loadId!, driverId: selectedDriver! })}
          disabled={!selectedDriver || assignMutation.isPending}
          className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Assign Driver
        </Button>
      </div>
    </div>
  );
}
