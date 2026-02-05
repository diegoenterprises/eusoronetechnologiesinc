/**
 * TOLL CALCULATOR PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Calculator, Route, Clock,
  ArrowRight, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TollCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("5_axle");

  const recentRoutesQuery = (trpc as any).tolls.getRecentRoutes.useQuery({ limit: 5 });
  const calculateMutation = (trpc as any).tolls.calculate.useMutation({
    onError: (error: any) => toast.error("Calculation failed", { description: error.message }),
  });

  const handleCalculate = () => {
    if (!origin || !destination) {
      toast.error("Please enter origin and destination");
      return;
    }
    calculateMutation.mutate({ origin, destination, vehicleType });
  };

  const result = calculateMutation.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Toll Calculator
        </h1>
        <p className="text-slate-400 text-sm mt-1">Calculate toll costs for your routes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Calculate Route Tolls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Origin</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                  <Input value={origin} onChange={(e: any) => setOrigin(e.target.value)} placeholder="City, State or ZIP" className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Destination</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                  <Input value={destination} onChange={(e: any) => setDestination(e.target.value)} placeholder="City, State or ZIP" className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2_axle">2 Axle</SelectItem>
                  <SelectItem value="3_axle">3 Axle</SelectItem>
                  <SelectItem value="4_axle">4 Axle</SelectItem>
                  <SelectItem value="5_axle">5 Axle (Standard Semi)</SelectItem>
                  <SelectItem value="6_axle">6+ Axle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleCalculate} disabled={calculateMutation.isPending}>
              {calculateMutation.isPending ? "Calculating..." : "Calculate Tolls"}
            </Button>

            {/* Results */}
            {result && (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Toll Cost</p>
                      <p className="text-3xl font-bold text-emerald-400">${result.totalTolls?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Distance</p>
                      <p className="text-xl font-bold text-white">{result.distance} miles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{result.estimatedTime}</span>
                    <span>${(result.totalTolls / result.distance).toFixed(3)}/mile in tolls</span>
                  </div>
                </div>

                {/* Toll Breakdown */}
                <div className="space-y-2">
                  <p className="text-white font-medium">Toll Breakdown</p>
                  {result.tollBreakdown?.map((toll: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{toll.name}</p>
                        <p className="text-xs text-slate-500">{toll.location}</p>
                      </div>
                      <p className="text-emerald-400 font-bold">${toll.cost?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Routes */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Route className="w-5 h-5 text-purple-400" />
              Recent Routes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentRoutesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (recentRoutesQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent routes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(recentRoutesQuery.data as any)?.map((route: any) => (
                  <div key={route.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => { setOrigin(route.origin); setDestination(route.destination); }}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white text-sm">{route.origin}</p>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <p className="text-white text-sm">{route.destination}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{route.distance} mi</span>
                      <span className="text-emerald-400 font-medium">${route.totalTolls?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toll Tips */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Toll Saving Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="p-2 rounded-lg bg-cyan-500/20 w-fit mb-3">
                <Truck className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white font-medium mb-1">Use Transponders</p>
              <p className="text-sm text-slate-400">E-ZPass and other transponders often offer discounted toll rates.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="p-2 rounded-lg bg-emerald-500/20 w-fit mb-3">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-white font-medium mb-1">Off-Peak Travel</p>
              <p className="text-sm text-slate-400">Some toll roads offer lower rates during off-peak hours.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="p-2 rounded-lg bg-purple-500/20 w-fit mb-3">
                <Route className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-white font-medium mb-1">Alternative Routes</p>
              <p className="text-sm text-slate-400">Consider toll-free alternatives when time permits.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
