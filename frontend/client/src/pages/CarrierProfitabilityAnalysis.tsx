/**
 * CARRIER PROFITABILITY ANALYSIS PAGE
 * 100% Dynamic - Analyze bid profitability before submission
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  DollarSign, TrendingUp, Fuel, Clock, Calculator,
  CheckCircle, AlertTriangle, ChevronLeft, Send,
  MapPin, Truck, Percent, PiggyBank
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierProfitabilityAnalysis() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/carrier/profitability/:loadId");
  const loadId = params?.loadId;

  const [bidAmount, setBidAmount] = useState("");
  const [fuelPrice, setFuelPrice] = useState(3.50);
  const [mpg, setMpg] = useState(6.5);
  const [driverPay, setDriverPay] = useState(0.55);

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const fuelQuery = (trpc as any).fuel.getSummary.useQuery();
  const analysisQuery = (trpc as any).carriers.getLoadHistory.useQuery({});

  const submitBidMutation = (trpc as any).bids.submit.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully");
      navigate("/carrier/marketplace");
    },
    onError: (error: any) => toast.error("Failed to submit bid", { description: error.message }),
  });

  const load = loadQuery.data as any;
  const analysis = analysisQuery.data as any;

  const miles = typeof load?.distance === 'number' ? load.distance : parseFloat(String(load?.distance)) || 0;
  const fuelCost = (miles / mpg) * fuelPrice;
  const driverCost = miles * driverPay;
  const fixedCosts = 150; // Insurance, maintenance, etc.
  const totalCosts = fuelCost + driverCost + fixedCosts;
  const revenue = parseFloat(bidAmount) || 0;
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const ratePerMile = Number(miles) > 0 ? revenue / Number(miles) : 0;

  const isProfitable = profit > 0;
  const isGoodMargin = margin >= 15;

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
          onClick={() => navigate("/carrier/marketplace")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Profitability Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
      </div>

      {/* Load Summary */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-xs">Route</p>
                <p className="text-white font-medium">{load?.origin?.city} → {load?.destination?.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-slate-400 text-xs">Miles</p>
                <p className="text-white font-medium">{miles.toLocaleString()} mi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-slate-400 text-xs">Est. Time</p>
                <p className="text-white font-medium">{load?.estimatedHours}h</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-xs">Target Rate</p>
                <p className="text-white font-medium">${load?.targetRate?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Calculate Your Bid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Your Bid Amount ($)</Label>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e: any) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg text-xl h-14"
              />
              {bidAmount && (
                <p className="text-slate-400 text-sm">
                  ${ratePerMile.toFixed(2)}/mile
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Fuel Price ($/gal)</Label>
                <span className="text-cyan-400 font-medium">${fuelPrice.toFixed(2)}</span>
              </div>
              <Slider
                value={[fuelPrice]}
                onValueChange={([v]) => setFuelPrice(v)}
                min={2.5}
                max={5.0}
                step={0.05}
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Fuel Efficiency (MPG)</Label>
                <span className="text-cyan-400 font-medium">{mpg.toFixed(1)}</span>
              </div>
              <Slider
                value={[mpg]}
                onValueChange={([v]) => setMpg(v)}
                min={4}
                max={10}
                step={0.1}
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Driver Pay ($/mile)</Label>
                <span className="text-cyan-400 font-medium">${driverPay.toFixed(2)}</span>
              </div>
              <Slider
                value={[driverPay]}
                onValueChange={([v]) => setDriverPay(v)}
                min={0.35}
                max={0.75}
                step={0.01}
                className="py-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className={cn(
          "rounded-xl",
          isProfitable
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30"
            : "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className={cn("w-5 h-5", isProfitable ? "text-green-400" : "text-red-400")} />
              Profitability Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue */}
            <div className="p-4 rounded-lg bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Revenue</span>
                <span className="text-white font-bold text-xl">${revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Costs Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300">Fuel Cost</span>
                </div>
                <span className="text-red-400">-${fuelCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">Driver Pay</span>
                </div>
                <span className="text-red-400">-${driverCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Fixed Costs</span>
                </div>
                <span className="text-red-400">-${fixedCosts.toFixed(2)}</span>
              </div>
            </div>

            {/* Profit */}
            <div className={cn(
              "p-4 rounded-lg",
              isProfitable ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isProfitable ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={cn("font-medium", isProfitable ? "text-green-400" : "text-red-400")}>
                    Net Profit
                  </span>
                </div>
                <span className={cn("font-bold text-2xl", isProfitable ? "text-green-400" : "text-red-400")}>
                  ${profit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-400 text-sm">Margin</span>
                <Badge className={cn(
                  "border-0",
                  isGoodMargin ? "bg-green-500/30 text-green-400" : "bg-yellow-500/30 text-yellow-400"
                )}>
                  <Percent className="w-3 h-3 mr-1" />
                  {margin.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Recommendation */}
            {bidAmount && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                isGoodMargin ? "bg-green-500/10 text-green-400" : margin > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
              )}>
                {isGoodMargin && "This load has a healthy profit margin. Good opportunity."}
                {!isGoodMargin && margin > 0 && "Marginal profit. Consider if you have backhaul options."}
                {margin <= 0 && "This bid would result in a loss. Consider a higher bid."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/carrier/marketplace")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => submitBidMutation.mutate({ loadId: loadId!, amount: parseFloat(bidAmount) })}
          disabled={!bidAmount || parseFloat(bidAmount) <= 0 || submitBidMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Bid
        </Button>
      </div>
    </div>
  );
}
