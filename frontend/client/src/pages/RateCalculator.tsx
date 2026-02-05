/**
 * RATE CALCULATOR PAGE
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
  Calculator, DollarSign, MapPin, Truck, Fuel, TrendingUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RateCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [weight, setWeight] = useState("");

  const calculateQuery = (trpc as any).rates.calculate.useQuery(
    { origin, destination, equipmentType, weight: parseFloat(weight) || 0 },
    { enabled: !!origin && !!destination && !!equipmentType }
  );

  const marketRatesQuery = (trpc as any).rates.getMarketRates.useQuery({ originState: origin || "TX", destState: destination || "TX", equipment: equipmentType as "tanker" | "flatbed" | "reefer" | "van" | "specialized" });

  const result = calculateQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Rate Calculator
        </h1>
        <p className="text-slate-400 text-sm mt-1">Calculate freight rates and profitability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Calculate Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Origin</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                <Input
                  value={origin}
                  onChange={(e: any) => setOrigin(e.target.value)}
                  placeholder="City, State"
                  className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400">Destination</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                <Input
                  value={destination}
                  onChange={(e: any) => setDestination(e.target.value)}
                  placeholder="City, State"
                  className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400">Equipment Type</Label>
              <Select value={equipmentType} onValueChange={setEquipmentType}>
                <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry_van">Dry Van</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="step_deck">Step Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400">Weight (lbs)</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e: any) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="bg-slate-700/30 border-slate-600/50 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Rate Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            {!origin || !destination || !equipmentType ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">Enter route details to calculate rate</p>
              </div>
            ) : calculateQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Recommended Rate */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-center">
                  <p className="text-slate-400 text-sm mb-1">Recommended Rate</p>
                  <p className="text-4xl font-bold text-emerald-400">${result.recommendedRate?.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 mt-1">${result.ratePerMile?.toFixed(2)}/mile</p>
                </div>

                {/* Route Info */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white">{origin}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-white">{destination}</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <p className="text-xs text-slate-500">Distance</p>
                    <p className="text-white font-medium">{result.distance} miles</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <p className="text-xs text-slate-500">Est. Drive Time</p>
                    <p className="text-white font-medium">{result.driveTime}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <p className="text-xs text-slate-500">Est. Fuel Cost</p>
                    <p className="text-orange-400 font-medium">${result.fuelCost?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <p className="text-xs text-slate-500">Est. Profit</p>
                    <p className="text-green-400 font-medium">${result.estimatedProfit?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Rate Range */}
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-sm text-slate-400 mb-3">Market Rate Range</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-red-400 font-medium">${result.lowRate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Low</p>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
                      <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 -translate-y-1/2" style={{ left: `${((result.recommendedRate - result.lowRate) / (result.highRate - result.lowRate)) * 100}%` }} />
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-medium">${result.highRate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">High</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Unable to calculate rate</p>
            )}
          </CardContent>
        </Card>

        {/* Market Rates */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Current Market Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketRatesQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(marketRatesQuery.data as any)?.history?.map((rate: any) => (
                  <div key={rate.lane} className="p-4 rounded-xl bg-slate-700/30">
                    <p className="text-white font-medium mb-1">{rate.lane}</p>
                    <p className="text-2xl font-bold text-emerald-400">${rate.avgRate?.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">/mile</p>
                    <div className={cn("flex items-center gap-1 mt-2 text-xs", rate.change > 0 ? "text-green-400" : "text-red-400")}>
                      <TrendingUp className={cn("w-3 h-3", rate.change < 0 && "rotate-180")} />
                      {Math.abs(rate.change)}% vs last week
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
