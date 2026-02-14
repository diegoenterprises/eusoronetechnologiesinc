/**
 * RATE CALCULATOR / PROFITABILITY COMPONENT
 * For Carriers to calculate profitability on loads
 * Based on 02_CARRIER_USER_JOURNEY.md
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, DollarSign, Fuel, Clock, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle,
  MapPin, Truck, Info
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";

interface LoadDetails {
  loadNumber: string;
  origin: string;
  destination: string;
  distance: number;
  offeredRate: number;
  commodity: string;
  pickupDate: string;
  estimatedHours: number;
}

interface CostInputs {
  fuelPrice: number;
  mpg: number;
  driverPayPerMile: number;
  insurancePerMile: number;
  maintenancePerMile: number;
  dispatchFee: number;
  factorFee: number;
  otherCosts: number;
  deadheadMiles: number;
}

interface RateCalculatorProps {
  load: LoadDetails;
  onBidSubmit?: (amount: number) => void;
}

const DEFAULT_COSTS: CostInputs = {
  fuelPrice: 3.89,
  mpg: 6.5,
  driverPayPerMile: 0.55,
  insurancePerMile: 0.08,
  maintenancePerMile: 0.12,
  dispatchFee: 5,
  factorFee: 3,
  otherCosts: 0,
  deadheadMiles: 0,
};

export function RateCalculator({ load, onBidSubmit }: RateCalculatorProps) {
  const [costs, setCosts] = useState<CostInputs>(DEFAULT_COSTS);
  const [bidAmount, setBidAmount] = useState<number>(load.offeredRate);
  const [showDetails, setShowDetails] = useState(false);

  const totalMiles = load.distance + costs.deadheadMiles;
  
  const fuelCost = (totalMiles / costs.mpg) * costs.fuelPrice;
  const driverPay = totalMiles * costs.driverPayPerMile;
  const insuranceCost = totalMiles * costs.insurancePerMile;
  const maintenanceCost = totalMiles * costs.maintenancePerMile;
  const dispatchFeeCost = (bidAmount * costs.dispatchFee) / 100;
  const factorFeeCost = (bidAmount * costs.factorFee) / 100;
  
  const totalCosts = fuelCost + driverPay + insuranceCost + maintenanceCost + 
                     dispatchFeeCost + factorFeeCost + costs.otherCosts;
  
  const grossProfit = bidAmount - totalCosts;
  const profitMargin = (grossProfit / bidAmount) * 100;
  const ratePerMile = bidAmount / load.distance;
  const costPerMile = totalCosts / totalMiles;
  const profitPerMile = grossProfit / load.distance;
  const profitPerHour = grossProfit / load.estimatedHours;

  const isProfitable = grossProfit > 0;
  const isGoodMargin = profitMargin >= 15;

  const aiSuggestedMin = load.offeredRate * 0.95;
  const aiSuggestedMax = load.offeredRate * 1.10;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-400" />
            Rate Calculator
          </CardTitle>
          <Badge variant="outline" className="text-slate-400">
            {load.loadNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Load Summary */}
        <div className="p-4 rounded-lg bg-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-400">Route</p>
              <p className="text-white">{load.origin} → {load.destination}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Distance</p>
              <p className="text-white font-bold">{load.distance} mi</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{load.commodity}</span>
            <span className="text-slate-400">{load.pickupDate}</span>
            <span className="text-slate-400">~{load.estimatedHours} hrs</span>
          </div>
        </div>

        {/* Bid Amount */}
        <div>
          <Label className="text-slate-300">Your Bid Amount</Label>
          <div className="flex items-center gap-3 mt-2">
            <div className="relative flex-1">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                className="pl-9 bg-slate-700/50 border-slate-600 text-white text-lg"
              />
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-bold",
                ratePerMile >= 3 ? "text-green-400" : ratePerMile >= 2.5 ? "text-yellow-400" : "text-red-400"
              )}>
                ${ratePerMile.toFixed(2)}/mi
              </p>
            </div>
          </div>
          
          {/* AI Suggestion */}
          <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <EsangIcon className="w-3 h-3" />
              AI Suggested Range: ${aiSuggestedMin.toFixed(0)} - ${aiSuggestedMax.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Profitability Summary */}
        <div className={cn(
          "p-4 rounded-lg border",
          isProfitable && isGoodMargin ? "bg-green-500/10 border-green-500/30" :
          isProfitable ? "bg-yellow-500/10 border-yellow-500/30" :
          "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isProfitable && isGoodMargin ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : isProfitable ? (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={cn(
                "font-medium",
                isProfitable && isGoodMargin ? "text-green-400" :
                isProfitable ? "text-yellow-400" : "text-red-400"
              )}>
                {isProfitable && isGoodMargin ? "Good Profit" :
                 isProfitable ? "Low Margin" : "Unprofitable"}
              </span>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-2xl font-bold",
                grossProfit >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {grossProfit >= 0 ? "+" : ""}${grossProfit.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">Gross Profit</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className={cn(
                "text-lg font-bold",
                profitMargin >= 15 ? "text-green-400" : profitMargin >= 10 ? "text-yellow-400" : "text-red-400"
              )}>
                {profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400">Margin</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">${profitPerMile.toFixed(2)}</p>
              <p className="text-xs text-slate-400">Profit/Mile</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">${profitPerHour.toFixed(0)}</p>
              <p className="text-xs text-slate-400">Profit/Hour</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">${costPerMile.toFixed(2)}</p>
              <p className="text-xs text-slate-400">Cost/Mile</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-slate-400 hover:text-white"
        >
          <Info className="w-4 h-4 mr-2" />
          {showDetails ? "Hide" : "Show"} Cost Breakdown
        </Button>

        {/* Detailed Cost Inputs */}
        {showDetails && (
          <div className="space-y-4 p-4 rounded-lg bg-slate-700/30">
            <h4 className="text-sm font-medium text-slate-300">Operating Costs</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Fuel */}
              <div>
                <Label className="text-xs text-slate-400">Fuel Price ($/gal)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.fuelPrice}
                  onChange={(e) => setCosts({...costs, fuelPrice: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">MPG</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={costs.mpg}
                  onChange={(e) => setCosts({...costs, mpg: parseFloat(e.target.value) || 1})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>

              {/* Driver Pay */}
              <div>
                <Label className="text-xs text-slate-400">Driver Pay ($/mile)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.driverPayPerMile}
                  onChange={(e) => setCosts({...costs, driverPayPerMile: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Insurance ($/mile)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.insurancePerMile}
                  onChange={(e) => setCosts({...costs, insurancePerMile: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>

              {/* Maintenance & Deadhead */}
              <div>
                <Label className="text-xs text-slate-400">Maintenance ($/mile)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.maintenancePerMile}
                  onChange={(e) => setCosts({...costs, maintenancePerMile: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Deadhead Miles</Label>
                <Input
                  type="number"
                  value={costs.deadheadMiles}
                  onChange={(e) => setCosts({...costs, deadheadMiles: parseInt(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>

              {/* Fees */}
              <div>
                <Label className="text-xs text-slate-400">Dispatch Fee (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={costs.dispatchFee}
                  onChange={(e) => setCosts({...costs, dispatchFee: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Factor Fee (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={costs.factorFee}
                  onChange={(e) => setCosts({...costs, factorFee: parseFloat(e.target.value) || 0})}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="mt-4 pt-4 border-t border-slate-600 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Fuel ({totalMiles} mi ÷ {costs.mpg} mpg × ${costs.fuelPrice})</span>
                <span className="text-white">${fuelCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Pay ({totalMiles} mi × ${costs.driverPayPerMile})</span>
                <span className="text-white">${driverPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance</span>
                <span className="text-white">${insuranceCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maintenance</span>
                <span className="text-white">${maintenanceCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dispatch Fee ({costs.dispatchFee}%)</span>
                <span className="text-white">${dispatchFeeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Factor Fee ({costs.factorFee}%)</span>
                <span className="text-white">${factorFeeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-600 font-medium">
                <span className="text-white">Total Costs</span>
                <span className="text-red-400">${totalCosts.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onBidSubmit && (
          <Button
            onClick={() => onBidSubmit(bidAmount)}
            className={cn(
              "w-full",
              isProfitable ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"
            )}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Submit Bid: ${bidAmount.toLocaleString()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default RateCalculator;
