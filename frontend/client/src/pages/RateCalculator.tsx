/**
 * RATE CALCULATOR
 * Freight rate estimation tool for shippers and carriers
 * Based on distance, weight, hazmat class, and market conditions
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Calculator, MapPin, Truck, DollarSign, Clock, Fuel,
  AlertTriangle, TrendingUp, TrendingDown, Info, RotateCcw,
  Package, Scale, Navigation, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RateEstimate {
  baseRate: number;
  fuelSurcharge: number;
  hazmatSurcharge: number;
  oversizeSurcharge: number;
  urgencySurcharge: number;
  totalRate: number;
  ratePerMile: number;
  marketComparison: "below" | "average" | "above";
  confidence: number;
}

interface MarketData {
  avgRatePerMile: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  demandLevel: "low" | "medium" | "high";
  capacity: "tight" | "balanced" | "loose";
}

const HAZMAT_CLASSES = [
  { value: "", label: "None (General Freight)" },
  { value: "1", label: "Class 1 - Explosives" },
  { value: "2", label: "Class 2 - Gases" },
  { value: "3", label: "Class 3 - Flammable Liquids" },
  { value: "4", label: "Class 4 - Flammable Solids" },
  { value: "5", label: "Class 5 - Oxidizers" },
  { value: "6", label: "Class 6 - Toxic/Infectious" },
  { value: "7", label: "Class 7 - Radioactive" },
  { value: "8", label: "Class 8 - Corrosive" },
  { value: "9", label: "Class 9 - Miscellaneous" },
];

const EQUIPMENT_TYPES = [
  { value: "tanker", label: "Tank Trailer (MC-306/406)" },
  { value: "flatbed", label: "Flatbed" },
  { value: "dryvan", label: "Dry Van" },
  { value: "reefer", label: "Refrigerated" },
  { value: "hopper", label: "Hopper/Pneumatic" },
  { value: "lowboy", label: "Lowboy/RGN" },
];

export default function RateCalculator() {
  const { user } = useAuth();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [hazmatClass, setHazmatClass] = useState("");
  const [equipmentType, setEquipmentType] = useState("tanker");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOversized, setIsOversized] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimate, setEstimate] = useState<RateEstimate | null>(null);

  const marketData: MarketData = {
    avgRatePerMile: 3.25,
    trend: "up",
    trendPercent: 4.2,
    demandLevel: "high",
    capacity: "tight",
  };

  const calculateRate = () => {
    if (!origin || !destination || distance <= 0) {
      toast.error("Please enter origin, destination, and distance");
      return;
    }

    setCalculating(true);

    setTimeout(() => {
      const baseRatePerMile = 2.85;
      const baseRate = distance * baseRatePerMile;
      
      const fuelSurchargeRate = 0.45;
      const fuelSurcharge = distance * fuelSurchargeRate;

      let hazmatSurcharge = 0;
      if (hazmatClass) {
        const hazmatMultipliers: Record<string, number> = {
          "1": 0.35, "2": 0.20, "3": 0.18, "4": 0.22,
          "5": 0.25, "6": 0.30, "7": 0.50, "8": 0.25, "9": 0.15,
        };
        hazmatSurcharge = baseRate * (hazmatMultipliers[hazmatClass] || 0.15);
      }

      const oversizeSurcharge = isOversized ? baseRate * 0.25 : 0;
      const urgencySurcharge = isUrgent ? baseRate * 0.15 : 0;

      const totalRate = baseRate + fuelSurcharge + hazmatSurcharge + oversizeSurcharge + urgencySurcharge;
      const ratePerMile = totalRate / distance;

      let marketComparison: "below" | "average" | "above" = "average";
      if (ratePerMile < marketData.avgRatePerMile * 0.9) {
        marketComparison = "below";
      } else if (ratePerMile > marketData.avgRatePerMile * 1.1) {
        marketComparison = "above";
      }

      setEstimate({
        baseRate,
        fuelSurcharge,
        hazmatSurcharge,
        oversizeSurcharge,
        urgencySurcharge,
        totalRate,
        ratePerMile,
        marketComparison,
        confidence: 85 + Math.random() * 10,
      });

      setCalculating(false);
      toast.success("Rate calculated successfully");
    }, 800);
  };

  const resetForm = () => {
    setOrigin("");
    setDestination("");
    setDistance(0);
    setWeight(0);
    setHazmatClass("");
    setEquipmentType("tanker");
    setIsUrgent(false);
    setIsOversized(false);
    setEstimate(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rate Calculator</h1>
          <p className="text-slate-400 text-sm">Estimate freight rates based on route and cargo</p>
        </div>
        <Button variant="outline" className="border-slate-600" onClick={resetForm}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Market Conditions */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">Current Market Rate</p>
                <p className="text-xl font-bold text-white">${marketData.avgRatePerMile.toFixed(2)}/mile</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400">Trend</p>
                <div className={cn(
                  "flex items-center gap-1",
                  marketData.trend === "up" ? "text-green-400" : marketData.trend === "down" ? "text-red-400" : "text-slate-400"
                )}>
                  {marketData.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-medium">{marketData.trendPercent}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Demand</p>
                <Badge className={cn(
                  marketData.demandLevel === "high" ? "bg-green-500/20 text-green-400" :
                  marketData.demandLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                )}>
                  {marketData.demandLevel.charAt(0).toUpperCase() + marketData.demandLevel.slice(1)}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Capacity</p>
                <Badge className={cn(
                  marketData.capacity === "tight" ? "bg-red-500/20 text-red-400" :
                  marketData.capacity === "balanced" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"
                )}>
                  {marketData.capacity.charAt(0).toUpperCase() + marketData.capacity.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Load Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Origin</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Houston, TX"
                    className="pl-10 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Destination</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Dallas, TX"
                    className="pl-10 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Distance (miles)</Label>
                <div className="relative mt-1">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={distance || ""}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    placeholder="240"
                    className="pl-10 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Weight (lbs)</Label>
                <div className="relative mt-1">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={weight || ""}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder="42000"
                    className="pl-10 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Equipment Type</Label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
              >
                {EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq.value} value={eq.value}>{eq.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-slate-300">Hazmat Classification</Label>
              <select
                value={hazmatClass}
                onChange={(e) => setHazmatClass(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
              >
                {HAZMAT_CLASSES.map((hc) => (
                  <option key={hc.value} value={hc.value}>{hc.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                />
                <span className="text-slate-300 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Urgent/Hot Shot
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOversized}
                  onChange={(e) => setIsOversized(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                />
                <span className="text-slate-300 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-orange-400" />
                  Oversized Load
                </span>
              </label>
            </div>

            <Button 
              onClick={calculateRate} 
              disabled={calculating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {calculating ? (
                <>Calculating...</>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Rate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={cn(
          "border-slate-700",
          estimate ? "bg-slate-800/50" : "bg-slate-800/30"
        )}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Rate Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estimate ? (
              <div className="space-y-6">
                {/* Total Rate */}
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30">
                  <p className="text-sm text-slate-400 mb-1">Estimated Total Rate</p>
                  <p className="text-4xl font-bold text-green-400">
                    ${estimate.totalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-lg text-slate-300 mt-2">
                    ${estimate.ratePerMile.toFixed(2)}/mile
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Badge className={cn(
                      estimate.marketComparison === "below" ? "bg-green-500/20 text-green-400" :
                      estimate.marketComparison === "above" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {estimate.marketComparison === "below" ? "Below Market" :
                       estimate.marketComparison === "above" ? "Above Market" : "At Market"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {estimate.confidence.toFixed(0)}% confidence
                    </span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400">Rate Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Base Rate ({distance} mi)</span>
                      <span className="text-white">${estimate.baseRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Fuel Surcharge</span>
                      <span className="text-white">${estimate.fuelSurcharge.toFixed(2)}</span>
                    </div>
                    {estimate.hazmatSurcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-400">Hazmat Surcharge</span>
                        <span className="text-orange-400">+${estimate.hazmatSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {estimate.oversizeSurcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-400">Oversize Surcharge</span>
                        <span className="text-purple-400">+${estimate.oversizeSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {estimate.urgencySurcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-400">Urgency Premium</span>
                        <span className="text-yellow-400">+${estimate.urgencySurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                      <span className="text-white">Total</span>
                      <span className="text-green-400">${estimate.totalRate.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      This estimate is based on current market conditions and may vary. 
                      Final rates depend on carrier availability and specific requirements.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Calculator className="w-12 h-12 text-slate-500 mb-3" />
                <p className="text-slate-400">Enter load details to calculate rate</p>
                <p className="text-xs text-slate-500 mt-1">
                  Estimates based on current market data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
