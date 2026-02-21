/**
 * ROUTE PLANNING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Navigation, Clock, Fuel, DollarSign, Route,
  Plus, Trash2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RoutePlanning() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<string[]>([]);

  const routeQuery = (trpc as any).routing.calculateRoute.useQuery(
    { origin, destination, stops },
    { enabled: !!origin && !!destination }
  );

  const savedRoutesQuery = (trpc as any).routing.getSavedRoutes.useQuery({ limit: 10 });

  const saveRouteMutation = (trpc as any).routing.saveRoute.useMutation({
    onSuccess: () => { toast.success("Route saved"); savedRoutesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to save route", { description: error.message }),
  });

  const route = routeQuery.data;

  const addStop = () => {
    setStops([...stops, ""]);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Route Planning
          </h1>
          <p className="text-slate-400 text-sm mt-1">Plan and optimize your routes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Input */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Plan Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Origin</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                <Input
                  value={origin}
                  onChange={(e: any) => setOrigin(e.target.value)}
                  placeholder="Enter origin city, state"
                  className="pl-9 bg-slate-700/30 border-white/[0.06] rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Stops */}
            {stops.map((stop: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <Label className="text-slate-400">Stop {idx + 1}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
                    <Input
                      value={stop}
                      onChange={(e: any) => updateStop(idx, e.target.value)}
                      placeholder="Enter stop location"
                      className="pl-9 bg-slate-700/30 border-white/[0.06] rounded-lg focus:border-cyan-500/50"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => removeStop(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full bg-slate-700/30 border-white/[0.06] hover:bg-white/[0.04] rounded-lg" onClick={addStop}>
              <Plus className="w-4 h-4 mr-2" />Add Stop
            </Button>

            <div className="space-y-2">
              <Label className="text-slate-400">Destination</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                <Input
                  value={destination}
                  onChange={(e: any) => setDestination(e.target.value)}
                  placeholder="Enter destination city, state"
                  className="pl-9 bg-slate-700/30 border-white/[0.06] rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>

            {route && (
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => saveRouteMutation.mutate({ origin, destination, stops })} disabled={saveRouteMutation.isPending}>
                Save Route
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Route Results */}
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Route Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!origin || !destination ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-white/[0.04] w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Route className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">Enter origin and destination</p>
                <p className="text-slate-500 text-sm mt-1">Route details will appear here</p>
              </div>
            ) : routeQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : route ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <div className="p-2 rounded-full bg-blue-500/20 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{route.distance || 0}</p>
                    <p className="text-xs text-slate-500">Miles</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <div className="p-2 rounded-full bg-purple-500/20 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-purple-400">{route.duration || "0h"}</p>
                    <p className="text-xs text-slate-500">Drive Time</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <div className="p-2 rounded-full bg-orange-500/20 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold text-orange-400">{route.fuelCost || 0}</p>
                    <p className="text-xs text-slate-500">Est. Fuel ($)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <div className="p-2 rounded-full bg-green-500/20 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{route.tollCost || 0}</p>
                    <p className="text-xs text-slate-500">Est. Tolls ($)</p>
                  </div>
                </div>

                {/* Route Segments */}
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm font-medium">Route Segments</p>
                  {route.segments?.map((segment: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", idx === 0 ? "bg-green-500" : idx === route.segments.length - 1 ? "bg-red-500" : "bg-yellow-500")}>
                          <span className="text-white text-sm font-bold">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{segment.from}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <ArrowRight className="w-3 h-3" />
                            <span>{segment.to}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{segment.distance} mi</p>
                          <p className="text-xs text-slate-500">{segment.duration}</p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{origin}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <ArrowRight className="w-3 h-3" />
                            <span>{destination}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{route.distance} mi</p>
                          <p className="text-xs text-slate-500">{route.duration}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">Unable to calculate route</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Routes */}
        <Card className="lg:col-span-3 bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Saved Routes</CardTitle>
          </CardHeader>
          <CardContent>
            {savedRoutesQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : (savedRoutesQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No saved routes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(savedRoutesQuery.data as any)?.map((savedRoute: any) => (
                  <div key={savedRoute.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => { setOrigin(savedRoute.origin); setDestination(savedRoute.destination); setStops(savedRoute.stops || []); }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">{savedRoute.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-white font-medium">{savedRoute.destination}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>{savedRoute.distance} mi</span>
                      <span>{savedRoute.duration}</span>
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
