/**
 * MILEAGE CALCULATOR PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Calculator, Route, Clock, Fuel,
  ArrowRight, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function MileageCalculator() {
  const [stops, setStops] = useState([{ id: 1, location: "" }, { id: 2, location: "" }]);

  const recentCalculationsQuery = (trpc as any).mileage.getRecent.useQuery({ limit: 5 });
  const calculateMutation = (trpc as any).mileage.calculate.useMutation({
    onError: (error: any) => toast.error("Calculation failed", { description: error.message }),
  });

  const addStop = () => {
    setStops([...stops, { id: Date.now(), location: "" }]);
  };

  const removeStop = (id: number) => {
    if (stops.length > 2) {
      setStops(stops.filter(s => s.id !== id));
    }
  };

  const updateStop = (id: number, location: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, location } : s));
  };

  const handleCalculate = () => {
    const locations = stops.map(s => s.location).filter(l => l.trim());
    if (locations.length < 2) {
      toast.error("Please enter at least 2 locations");
      return;
    }
    calculateMutation.mutate({ stops: locations });
  };

  const result = calculateMutation.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Mileage Calculator
        </h1>
        <p className="text-slate-400 text-sm mt-1">Calculate distances between locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Calculate Route Distance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stops.map((stop: any, idx: number) => (
              <div key={stop.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-green-500/20 text-green-400" : idx === stops.length - 1 ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 relative">
                  <MapPin className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${idx === 0 ? "text-green-400" : idx === stops.length - 1 ? "text-red-400" : "text-blue-400"}`} />
                  <Input
                    value={stop.location}
                    onChange={(e: any) => updateStop(stop.id, e.target.value)}
                    placeholder={idx === 0 ? "Origin" : idx === stops.length - 1 ? "Destination" : `Stop ${idx}`}
                    className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg"
                  />
                </div>
                {stops.length > 2 && (
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => removeStop(stop.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full bg-slate-700/30 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={addStop}>
              <Plus className="w-4 h-4 mr-2" />Add Stop
            </Button>

            <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleCalculate} disabled={calculateMutation.isPending}>
              {calculateMutation.isPending ? "Calculating..." : "Calculate Distance"}
            </Button>

            {/* Results */}
            {result && (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-slate-400 text-sm">Total Distance</p>
                      <p className="text-2xl font-bold text-emerald-400">{result.totalMiles?.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Est. Drive Time</p>
                      <p className="text-2xl font-bold text-white">{result.estimatedTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Est. Fuel</p>
                      <p className="text-2xl font-bold text-cyan-400">{result.estimatedFuel} gal</p>
                    </div>
                  </div>
                </div>

                {/* Leg Breakdown */}
                {result.legs?.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-white font-medium">Route Breakdown</p>
                    {result.legs?.map((leg: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{leg.from}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-white text-sm">{leg.to}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-400">{leg.distance} mi</span>
                          <span className="text-slate-500">{leg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calculations */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Route className="w-5 h-5 text-purple-400" />
              Recent Calculations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentCalculationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (recentCalculationsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent calculations</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(recentCalculationsQuery.data as any)?.map((calc: any) => (
                  <div key={calc.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setStops(calc.stops.map((s: string, i: number) => ({ id: i, location: s })))}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {calc.stops?.map((stop: string, idx: number) => (
                        <React.Fragment key={idx}>
                          <span className="text-white text-sm">{stop}</span>
                          {idx < calc.stops.length - 1 && <ArrowRight className="w-3 h-3 text-slate-500" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{calc.calculatedAt}</span>
                      <span className="text-emerald-400 font-medium">{calc.totalMiles?.toLocaleString()} mi</span>
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
