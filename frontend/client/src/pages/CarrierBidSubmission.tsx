/**
 * CARRIER BID SUBMISSION
 * Interface for carriers to submit bids with profitability analysis
 * Based on 02_CARRIER_USER_JOURNEY.md
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  DollarSign, Truck, Clock, MapPin, AlertTriangle, Calculator,
  TrendingUp, TrendingDown, Fuel, Route, CheckCircle, Send,
  ChevronLeft, Info, Calendar, Package, Shield, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LoadDetails {
  id: string;
  loadNumber: string;
  shipperId: string;
  shipperName: string;
  shipperRating: number;
  commodity: string;
  hazmatClass?: string;
  weight: number;
  origin: {
    name: string;
    city: string;
    state: string;
    zip: string;
  };
  destination: {
    name: string;
    city: string;
    state: string;
    zip: string;
  };
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  postedRate?: number;
  rateType: "flat" | "per_mile" | "auction";
  miles: number;
  equipmentRequired: string;
  requirements: {
    hazmatEndorsement: boolean;
    tankEndorsement: boolean;
    twicRequired: boolean;
    minInsurance: number;
  };
  specialInstructions?: string;
  deadheadMiles: number;
}

interface ProfitabilityAnalysis {
  grossRevenue: number;
  fuelCost: number;
  driverPay: number;
  insurance: number;
  maintenance: number;
  tolls: number;
  otherCosts: number;
  netProfit: number;
  profitMargin: number;
  revenuePerMile: number;
  costPerMile: number;
}

const MOCK_LOAD: LoadDetails = {
  id: "load_001",
  loadNumber: "LD-2025-0847",
  shipperId: "shipper_001",
  shipperName: "Marathon Petroleum",
  shipperRating: 4.7,
  commodity: "Gasoline, Unleaded",
  hazmatClass: "3",
  weight: 42000,
  origin: {
    name: "Marathon Petroleum Terminal",
    city: "Texas City",
    state: "TX",
    zip: "77590",
  },
  destination: {
    name: "QuikTrip #4521",
    city: "Austin",
    state: "TX",
    zip: "78736",
  },
  pickupDate: "2025-01-24",
  pickupTime: "06:00",
  deliveryDate: "2025-01-24",
  deliveryTime: "14:00",
  postedRate: 1800,
  rateType: "auction",
  miles: 195,
  equipmentRequired: "MC-306 Tank Trailer",
  requirements: {
    hazmatEndorsement: true,
    tankEndorsement: true,
    twicRequired: true,
    minInsurance: 5000000,
  },
  specialInstructions: "Call 30 minutes before arrival. Use rear entrance.",
  deadheadMiles: 25,
};

const DEFAULT_COSTS = {
  fuelPricePerGallon: 3.45,
  mpg: 6.5,
  driverPayPerMile: 0.55,
  insurancePerMile: 0.08,
  maintenancePerMile: 0.12,
  tollEstimate: 15,
};

export default function CarrierBidSubmission() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [load] = useState<LoadDetails>(MOCK_LOAD);
  const [bidAmount, setBidAmount] = useState<number>(load.postedRate || 0);
  const [transitTime, setTransitTime] = useState<number>(4);
  const [message, setMessage] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [costs, setCosts] = useState(DEFAULT_COSTS);
  const [analysis, setAnalysis] = useState<ProfitabilityAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalMiles = load.miles + load.deadheadMiles;

  useEffect(() => {
    calculateProfitability();
  }, [bidAmount, costs, totalMiles]);

  const calculateProfitability = () => {
    const fuelCost = (totalMiles / costs.mpg) * costs.fuelPricePerGallon;
    const driverPay = totalMiles * costs.driverPayPerMile;
    const insurance = totalMiles * costs.insurancePerMile;
    const maintenance = totalMiles * costs.maintenancePerMile;
    const tolls = costs.tollEstimate;
    const otherCosts = bidAmount * 0.03; // 3% for factoring, admin, etc.
    
    const totalCosts = fuelCost + driverPay + insurance + maintenance + tolls + otherCosts;
    const netProfit = bidAmount - totalCosts;
    const profitMargin = bidAmount > 0 ? (netProfit / bidAmount) * 100 : 0;
    
    setAnalysis({
      grossRevenue: bidAmount,
      fuelCost,
      driverPay,
      insurance,
      maintenance,
      tolls,
      otherCosts,
      netProfit,
      profitMargin,
      revenuePerMile: bidAmount / load.miles,
      costPerMile: totalCosts / totalMiles,
    });
  };

  const handleSubmitBid = async () => {
    if (bidAmount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Bid submitted successfully!");
    navigate("/marketplace");
  };

  const getProfitIndicator = (margin: number) => {
    if (margin >= 20) return { color: "text-green-400", icon: TrendingUp, label: "Excellent" };
    if (margin >= 10) return { color: "text-yellow-400", icon: TrendingUp, label: "Good" };
    if (margin >= 0) return { color: "text-orange-400", icon: TrendingDown, label: "Low" };
    return { color: "text-red-400", icon: TrendingDown, label: "Loss" };
  };

  const MOCK_DRIVERS = [
    { id: "drv_001", name: "Mike Johnson", hasHazmat: true, hasTank: true, hasTwic: true, available: true },
    { id: "drv_002", name: "Sarah Williams", hasHazmat: true, hasTank: true, hasTwic: false, available: true },
    { id: "drv_003", name: "Tom Brown", hasHazmat: false, hasTank: true, hasTwic: true, available: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/marketplace")} className="text-slate-400">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Submit Bid</h1>
          <p className="text-slate-400 text-sm">{load.loadNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Load Info Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Load Details
                </CardTitle>
                {load.hazmatClass && (
                  <Badge className="bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Hazmat Class {load.hazmatClass}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Commodity</p>
                  <p className="text-white font-medium">{load.commodity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Weight</p>
                  <p className="text-white font-medium">{load.weight.toLocaleString()} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Equipment Required</p>
                  <p className="text-white font-medium">{load.equipmentRequired}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Miles</p>
                  <p className="text-white font-medium">{load.miles} mi (+{load.deadheadMiles} deadhead)</p>
                </div>
              </div>

              {/* Route */}
              <div className="p-4 rounded-lg bg-slate-700/30">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{load.origin.name}</p>
                    <p className="text-sm text-slate-400">{load.origin.city}, {load.origin.state}</p>
                    <p className="text-xs text-slate-500">{load.pickupDate} at {load.pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{load.destination.name}</p>
                    <p className="text-sm text-slate-400">{load.destination.city}, {load.destination.state}</p>
                    <p className="text-xs text-slate-500">{load.deliveryDate} at {load.deliveryTime}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Required Endorsements</p>
                <div className="flex flex-wrap gap-2">
                  {load.requirements.hazmatEndorsement && (
                    <Badge className="bg-red-500/20 text-red-400">Hazmat (H)</Badge>
                  )}
                  {load.requirements.tankEndorsement && (
                    <Badge className="bg-blue-500/20 text-blue-400">Tank (N)</Badge>
                  )}
                  {load.requirements.twicRequired && (
                    <Badge className="bg-purple-500/20 text-purple-400">TWIC</Badge>
                  )}
                  <Badge className="bg-slate-500/20 text-slate-400">
                    ${(load.requirements.minInsurance / 1000000)}M Min Insurance
                  </Badge>
                </div>
              </div>

              {/* Shipper Info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">{load.shipperName}</p>
                    <p className="text-sm text-slate-400">Verified Shipper</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">{load.shipperRating}</span>
                </div>
              </div>

              {load.specialInstructions && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-400 font-medium mb-1">SPECIAL INSTRUCTIONS</p>
                  <p className="text-sm text-blue-200">{load.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Your Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Bid Amount ($)</Label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-lg font-bold"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    ${(bidAmount / load.miles).toFixed(2)}/mi
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">Estimated Transit (hours)</Label>
                  <Input
                    type="number"
                    value={transitTime}
                    onChange={(e) => setTransitTime(Number(e.target.value))}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>

              {load.postedRate && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Posted rate: </span>
                  <span className="text-white font-medium">${load.postedRate.toLocaleString()}</span>
                  <span className={cn(
                    "ml-2",
                    bidAmount < load.postedRate ? "text-green-400" : "text-yellow-400"
                  )}>
                    ({bidAmount < load.postedRate ? "-" : "+"}${Math.abs(bidAmount - load.postedRate).toLocaleString()})
                  </span>
                </div>
              )}

              {/* Driver Selection */}
              <div>
                <Label className="text-slate-300 mb-2 block">Assign Driver</Label>
                <div className="space-y-2">
                  {MOCK_DRIVERS.map((driver) => {
                    const meetsRequirements = 
                      (!load.requirements.hazmatEndorsement || driver.hasHazmat) &&
                      (!load.requirements.tankEndorsement || driver.hasTank) &&
                      (!load.requirements.twicRequired || driver.hasTwic);
                    
                    return (
                      <label
                        key={driver.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedDriver === driver.id 
                            ? "border-blue-500 bg-blue-500/10" 
                            : "border-slate-600 hover:border-slate-500",
                          (!driver.available || !meetsRequirements) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <input
                          type="radio"
                          name="driver"
                          value={driver.id}
                          checked={selectedDriver === driver.id}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          disabled={!driver.available || !meetsRequirements}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">{driver.name}</p>
                          <div className="flex gap-2 mt-1">
                            {driver.hasHazmat && <Badge className="bg-red-500/20 text-red-400 text-xs">H</Badge>}
                            {driver.hasTank && <Badge className="bg-blue-500/20 text-blue-400 text-xs">N</Badge>}
                            {driver.hasTwic && <Badge className="bg-purple-500/20 text-purple-400 text-xs">TWIC</Badge>}
                          </div>
                        </div>
                        {!driver.available && (
                          <Badge className="bg-slate-500/20 text-slate-400">Unavailable</Badge>
                        )}
                        {driver.available && !meetsRequirements && (
                          <Badge className="bg-red-500/20 text-red-400">Missing Endorsements</Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-slate-300">Message to Shipper (optional)</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any notes about your bid..."
                  className="w-full mt-1 p-3 rounded-md bg-slate-700/50 border border-slate-600 text-white h-20 resize-none"
                />
              </div>

              <Button 
                onClick={handleSubmitBid}
                disabled={isSubmitting || !selectedDriver}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                {isSubmitting ? "Submitting..." : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Bid - ${bidAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profitability Analysis Sidebar */}
        <div className="space-y-6">
          {/* Profitability Card */}
          <Card className="bg-slate-800/50 border-slate-700 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                Profitability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis && (
                <>
                  {/* Profit Indicator */}
                  <div className={cn(
                    "p-4 rounded-lg text-center",
                    analysis.profitMargin >= 10 ? "bg-green-500/10" : 
                    analysis.profitMargin >= 0 ? "bg-yellow-500/10" : "bg-red-500/10"
                  )}>
                    <p className="text-sm text-slate-400 mb-1">Estimated Net Profit</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      getProfitIndicator(analysis.profitMargin).color
                    )}>
                      ${analysis.netProfit.toFixed(0)}
                    </p>
                    <p className={cn(
                      "text-sm font-medium",
                      getProfitIndicator(analysis.profitMargin).color
                    )}>
                      {analysis.profitMargin.toFixed(1)}% margin - {getProfitIndicator(analysis.profitMargin).label}
                    </p>
                  </div>

                  {/* Revenue */}
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Gross Revenue</span>
                      <span className="text-green-400 font-bold">${analysis.grossRevenue.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ${analysis.revenuePerMile.toFixed(2)}/mi (loaded)
                    </p>
                  </div>

                  {/* Costs Breakdown */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-medium">Cost Breakdown</p>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-300 text-sm">Fuel</span>
                      </div>
                      <span className="text-white">${analysis.fuelCost.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300 text-sm">Driver Pay</span>
                      </div>
                      <span className="text-white">${analysis.driverPay.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-300 text-sm">Insurance</span>
                      </div>
                      <span className="text-white">${analysis.insurance.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300 text-sm">Maintenance</span>
                      </div>
                      <span className="text-white">${analysis.maintenance.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <span className="text-slate-300 text-sm">Tolls & Other</span>
                      <span className="text-white">${(analysis.tolls + analysis.otherCosts).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Cost Per Mile */}
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-sm text-slate-400">Total Cost Per Mile</p>
                    <p className="text-white font-bold text-lg">${analysis.costPerMile.toFixed(2)}/mi</p>
                    <p className="text-xs text-slate-500">Based on {totalMiles} total miles</p>
                  </div>

                  {/* Adjust Costs */}
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-3">Adjust Cost Estimates</p>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-500">Fuel Price ($/gal)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costs.fuelPricePerGallon}
                          onChange={(e) => setCosts({ ...costs, fuelPricePerGallon: Number(e.target.value) })}
                          className="bg-slate-700/50 border-slate-600 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">MPG</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={costs.mpg}
                          onChange={(e) => setCosts({ ...costs, mpg: Number(e.target.value) })}
                          className="bg-slate-700/50 border-slate-600 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Driver Pay ($/mi)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costs.driverPayPerMile}
                          onChange={(e) => setCosts({ ...costs, driverPayPerMile: Number(e.target.value) })}
                          className="bg-slate-700/50 border-slate-600 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
