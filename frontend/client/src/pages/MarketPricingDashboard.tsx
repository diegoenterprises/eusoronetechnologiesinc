/**
 * MARKET PRICING DASHBOARD - Platts/Argus-Style Freight Rate Intelligence
 * 
 * Comprehensive pricing system for all user roles.
 * Real-time freight indices, lane benchmarks, rate calculator,
 * trend analysis, and fuel surcharge tracking.
 * 
 * 100% Dynamic - Uses tRPC queries
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp, TrendingDown, DollarSign, Fuel, BarChart3,
  MapPin, ArrowRight, Calculator, Activity, Truck,
  RefreshCw, Clock, Flame, Minus, Package, AlertTriangle,
  Zap, Users, ChevronRight, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const EQUIPMENT_LABELS: Record<string, string> = {
  DRY_VAN: "Dry Van",
  REEFER: "Reefer",
  FLATBED: "Flatbed",
  TANKER: "Tanker",
  HAZMAT: "Hazmat",
  OVERSIZE: "Oversize",
};

export default function MarketPricingDashboard() {
  const { user } = useAuth();
  const userRole = (user as any)?.role || "SHIPPER";
  const [activeTab, setActiveTab] = useState("indices");
  const [selectedEquipment, setSelectedEquipment] = useState("DRY_VAN");
  const [trendPeriod, setTrendPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Calculator state
  const [calcOriginCity, setCalcOriginCity] = useState("");
  const [calcOriginState, setCalcOriginState] = useState("");
  const [calcDestCity, setCalcDestCity] = useState("");
  const [calcDestState, setCalcDestState] = useState("");
  const [calcMiles, setCalcMiles] = useState(500);
  const [calcEquipment, setCalcEquipment] = useState("DRY_VAN");
  const [calcHazmat, setCalcHazmat] = useState(false);
  const [calcExpedited, setCalcExpedited] = useState(false);

  // Queries
  const indicesQuery = (trpc as any).marketPricing.getIndices.useQuery({});
  const lanesQuery = (trpc as any).marketPricing.getLaneBenchmarks.useQuery({ equipment: selectedEquipment !== "ALL" ? selectedEquipment : undefined });
  const trendsQuery = (trpc as any).marketPricing.getRateTrends.useQuery({ equipment: selectedEquipment, period: trendPeriod });
  const summaryQuery = (trpc as any).marketPricing.getMarketSummary.useQuery();

  // Calculator mutation
  const calculateMutation = (trpc as any).marketPricing.calculateRate.useMutation();

  const handleCalculate = () => {
    if (!calcOriginCity || !calcDestCity || !calcMiles) return;
    calculateMutation.mutate({
      originCity: calcOriginCity,
      originState: calcOriginState,
      destinationCity: calcDestCity,
      destinationState: calcDestState,
      miles: calcMiles,
      equipment: calcEquipment,
      hazmat: calcHazmat,
      expedited: calcExpedited,
    });
  };

  const calcResult = calculateMutation.data;

  // Role-specific insight key
  const roleKey = userRole === "CARRIER" ? "carrier" : userRole === "BROKER" ? "broker" : userRole === "DRIVER" ? "driver" : "shipper";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Market Pricing Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platts/Argus-style freight rate benchmarks & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" onClick={() => {
            indicesQuery.refetch(); lanesQuery.refetch(); summaryQuery.refetch();
          }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20"><DollarSign className="w-4 h-4 text-blue-400" /></div>
                  <span className="text-xs text-slate-400">National Avg</span>
                </div>
                <div className="text-2xl font-bold text-white">${summaryQuery.data?.overview.avgNationalRate}/mi</div>
                <div className="text-xs text-green-400 mt-1">All equipment types</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/20"><Zap className="w-4 h-4 text-orange-400" /></div>
                  <span className="text-xs text-slate-400">Spot Rate Avg</span>
                </div>
                <div className="text-2xl font-bold text-white">${summaryQuery.data?.overview.avgSpotRate}/mi</div>
                <div className="text-xs text-orange-400 mt-1">Spot market premium</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20"><BarChart3 className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-xs text-slate-400">Load:Truck Ratio</span>
                </div>
                <div className="text-2xl font-bold text-white">{summaryQuery.data?.overview.loadToTruckRatio}:1</div>
                <div className={cn("text-xs mt-1",
                  summaryQuery.data?.overview.loadToTruckRatio > 5 ? "text-red-400" : "text-green-400"
                )}>
                  {summaryQuery.data?.overview.marketCondition}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/20"><Fuel className="w-4 h-4 text-red-400" /></div>
                  <span className="text-xs text-slate-400">Diesel Price</span>
                </div>
                <div className="text-2xl font-bold text-white">${summaryQuery.data?.overview.dieselPrice}</div>
                <div className="text-xs text-slate-400 mt-1">EIA national avg</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20"><Globe className="w-4 h-4 text-purple-400" /></div>
                  <span className="text-xs text-slate-400">Market</span>
                </div>
                <div className="text-2xl font-bold text-white">{summaryQuery.data?.overview.marketCondition}</div>
                <div className="text-xs text-purple-400 mt-1">Current condition</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="indices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-1.5" />Rate Indices
          </TabsTrigger>
          <TabsTrigger value="lanes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-1.5" />Lane Benchmarks
          </TabsTrigger>
          <TabsTrigger value="calculator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <Calculator className="w-4 h-4 mr-1.5" />Rate Calculator
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-1.5" />Trends
          </TabsTrigger>
        </TabsList>

        {/* INDICES TAB */}
        <TabsContent value="indices" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
            ) : (
              Object.entries(indicesQuery.data?.indices || {}).map(([key, data]: [string, any]) => (
                <Card key={key} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-slate-400" />
                        <span className="text-white font-semibold">{EQUIPMENT_LABELS[key] || key}</span>
                      </div>
                      <Badge className={cn(
                        "border-0 text-xs",
                        data.national.change > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {data.national.change > 0 ? "+" : ""}{data.national.change}%
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50">
                        <span className="text-slate-400 text-sm">National Avg</span>
                        <span className="text-white font-bold text-lg">${data.national.current}/mi</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Zap className="w-3 h-3 text-orange-400" />Spot
                        </span>
                        <span className="text-orange-400 font-bold">${data.spot.current}/mi</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-400" />Contract
                        </span>
                        <span className="text-blue-400 font-bold">${data.contract.current}/mi</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Fuel Index */}
          {indicesQuery.data?.fuel && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Fuel className="w-5 h-5 text-red-400" />
                  Fuel Price Index
                  <Badge className="bg-slate-700 text-slate-300 border-0 text-xs ml-2">
                    <Clock className="w-3 h-3 mr-1" />Updated: {new Date(indicesQuery.data.fuel.lastUpdated).toLocaleDateString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Current Diesel</div>
                    <div className="text-xl font-bold text-white">${indicesQuery.data.fuel.diesel.current}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Previous</div>
                    <div className="text-xl font-bold text-slate-300">${indicesQuery.data.fuel.diesel.previous}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Week Ago</div>
                    <div className="text-xl font-bold text-slate-300">${indicesQuery.data.fuel.diesel.weekAgo}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Month Ago</div>
                    <div className="text-xl font-bold text-slate-300">${indicesQuery.data.fuel.diesel.monthAgo}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Surcharge/Mi</div>
                    <div className="text-xl font-bold text-cyan-400">${indicesQuery.data.fuel.surchargePerMile}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Condition & Season */}
          {indicesQuery.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-5">
                  <div className="text-slate-400 text-sm mb-2">Market Condition</div>
                  <div className={cn("text-2xl font-bold",
                    indicesQuery.data.marketCondition === "TIGHT" ? "text-red-400" :
                    indicesQuery.data.marketCondition === "LOOSE" ? "text-green-400" : "text-yellow-400"
                  )}>
                    {indicesQuery.data.marketCondition}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {indicesQuery.data.marketCondition === "TIGHT" ? "High demand, limited capacity. Expect higher spot rates." :
                     indicesQuery.data.marketCondition === "LOOSE" ? "Excess capacity available. Negotiate lower rates." :
                     "Supply and demand are balanced. Rates at normal levels."}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-5">
                  <div className="text-slate-400 text-sm mb-2">Seasonal Factor</div>
                  <div className="text-2xl font-bold text-white">{indicesQuery.data.seasonalFactor}x</div>
                  <p className="text-xs text-slate-500 mt-2">
                    {indicesQuery.data.seasonalFactor > 1.05 ? "Peak season - rates above annual average" :
                     indicesQuery.data.seasonalFactor < 0.96 ? "Off-peak - rates below annual average" :
                     "Normal seasonal pricing"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* LANES TAB */}
        <TabsContent value="lanes" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-0">
              {lanesQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-slate-400 font-medium">
                    <div className="col-span-4">Lane</div>
                    <div className="col-span-1 text-right">Miles</div>
                    <div className="col-span-2 text-right">Rate/Mi</div>
                    <div className="col-span-2 text-right">All-In/Mi</div>
                    <div className="col-span-1 text-center">Volume</div>
                    <div className="col-span-2 text-right">Change</div>
                  </div>
                  {(lanesQuery.data?.lanes || []).map((lane: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-700/20 transition items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-white font-medium">{lane.origin.split(",")[0]}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-white font-medium">{lane.destination.split(",")[0]}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{EQUIPMENT_LABELS[lane.equipment] || lane.equipment}</div>
                      </div>
                      <div className="col-span-1 text-right text-sm text-slate-300">{lane.miles}</div>
                      <div className="col-span-2 text-right">
                        <span className="text-white font-bold">${lane.rate.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-cyan-400 font-semibold">${lane.rateWithFuel}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <Badge className={cn("border-0 text-[10px]",
                          lane.volume === "VERY_HIGH" ? "bg-red-500/20 text-red-400" :
                          lane.volume === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                          "bg-slate-600/30 text-slate-400"
                        )}>
                          {lane.volume}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={cn("text-sm font-medium flex items-center justify-end gap-1",
                          lane.changePercent > 0 ? "text-green-400" :
                          lane.changePercent < 0 ? "text-red-400" : "text-slate-400"
                        )}>
                          {lane.changePercent > 0 ? <TrendingUp className="w-3 h-3" /> :
                           lane.changePercent < 0 ? <TrendingDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          {lane.changePercent > 0 ? "+" : ""}{lane.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role-specific insight */}
          {lanesQuery.data && (
            <Card className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 font-medium text-sm">
                    {roleKey === "driver" ? "Driver Insight" :
                     roleKey === "carrier" ? "Carrier Insight" :
                     roleKey === "broker" ? "Broker Insight" : "Shipper Insight"}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  {roleKey === "driver" ? `Average driver pay: $${(lanesQuery.data.averageRate * 0.72).toFixed(2)}/mi. Fuel surcharge adds $${lanesQuery.data.fuelSurcharge}/mi to total compensation.` :
                   roleKey === "carrier" ? `Avg lane rate: $${lanesQuery.data.averageRate}/mi. Estimated profit margin: 18% after fuel and operating costs.` :
                   roleKey === "broker" ? `Avg margin opportunity: $${(lanesQuery.data.averageRate * 0.12).toFixed(2)}/mi. Buy at contract, sell at spot for maximum spread.` :
                   `Avg shipping cost: $${lanesQuery.data.averageRate}/mi + $${lanesQuery.data.fuelSurcharge}/mi fuel surcharge. Consider contract rates for 10-15% savings.`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CALCULATOR TAB */}
        <TabsContent value="calculator" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                  Rate Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs">Origin City</Label>
                    <Input value={calcOriginCity} onChange={(e: any) => setCalcOriginCity(e.target.value)}
                      placeholder="Houston" className="bg-slate-900/50 border-slate-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Origin State</Label>
                    <Input value={calcOriginState} onChange={(e: any) => setCalcOriginState(e.target.value)}
                      placeholder="TX" className="bg-slate-900/50 border-slate-700 text-white mt-1" maxLength={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs">Destination City</Label>
                    <Input value={calcDestCity} onChange={(e: any) => setCalcDestCity(e.target.value)}
                      placeholder="Chicago" className="bg-slate-900/50 border-slate-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Destination State</Label>
                    <Input value={calcDestState} onChange={(e: any) => setCalcDestState(e.target.value)}
                      placeholder="IL" className="bg-slate-900/50 border-slate-700 text-white mt-1" maxLength={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs">Distance (miles)</Label>
                    <Input type="number" value={calcMiles} onChange={(e: any) => setCalcMiles(Number(e.target.value))}
                      className="bg-slate-900/50 border-slate-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Equipment</Label>
                    <Select value={calcEquipment} onValueChange={setCalcEquipment}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={calcHazmat} onCheckedChange={setCalcHazmat} />
                    <Label className="text-slate-400 text-xs">Hazmat</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={calcExpedited} onCheckedChange={setCalcExpedited} />
                    <Label className="text-slate-400 text-xs">Expedited</Label>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD]"
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending || !calcOriginCity || !calcDestCity}
                >
                  {calculateMutation.isPending ? "Calculating..." : (
                    <><Calculator className="w-4 h-4 mr-2" />Calculate Rate</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {calcResult ? (
              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                  <CardContent className="p-5">
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-white">${calcResult.allInRate.toLocaleString()}</div>
                      <div className="text-slate-400 text-sm">All-in rate ({calcMiles} miles)</div>
                      <div className="text-lg font-semibold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">
                        ${calcResult.allInPerMile}/mi
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Line Haul</span>
                        <span className="text-white">${calcResult.breakdown.lineHaul.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Fuel Surcharge</span>
                        <span className="text-white">${calcResult.breakdown.fuelSurcharge.toLocaleString()}</span>
                      </div>
                      {calcResult.breakdown.hazmatPremium > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Hazmat Premium</span>
                          <span className="text-orange-400">+${calcResult.breakdown.hazmatPremium.toLocaleString()}</span>
                        </div>
                      )}
                      {calcResult.breakdown.expeditedPremium > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Expedited Premium</span>
                          <span className="text-orange-400">+${calcResult.breakdown.expeditedPremium.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <Badge className={cn("border-0",
                        calcResult.marketPosition === "ABOVE_MARKET" ? "bg-red-500/20 text-red-400" :
                        calcResult.marketPosition === "BELOW_MARKET" ? "bg-green-500/20 text-green-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}>
                        {calcResult.marketPosition.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Role-specific insights */}
                <Card className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="text-purple-300 font-medium text-sm mb-2">
                      {roleKey === "driver" ? "Your Earnings" :
                       roleKey === "carrier" ? "Carrier Revenue" :
                       roleKey === "broker" ? "Broker Margin" : "Shipping Cost"}
                    </div>
                    {roleKey === "driver" && calcResult.roleInsights.driver && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Take-Home</div>
                          <div className="text-lg font-bold text-green-400">${calcResult.roleInsights.driver.estimatedEarnings.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Per Diem</div>
                          <div className="text-lg font-bold text-cyan-400">${calcResult.roleInsights.driver.perDiem}</div>
                        </div>
                      </div>
                    )}
                    {roleKey === "carrier" && calcResult.roleInsights.carrier && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Est. Profit</div>
                          <div className="text-lg font-bold text-green-400">${calcResult.roleInsights.carrier.estimatedProfit.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Margin</div>
                          <div className="text-lg font-bold text-cyan-400">{calcResult.roleInsights.carrier.profitMargin}</div>
                        </div>
                      </div>
                    )}
                    {roleKey === "broker" && calcResult.roleInsights.broker && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Commission</div>
                          <div className="text-lg font-bold text-green-400">${calcResult.roleInsights.broker.commission.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900/50">
                          <div className="text-xs text-slate-400">Buy Rate</div>
                          <div className="text-lg font-bold text-cyan-400">${calcResult.roleInsights.broker.buyRate}/mi</div>
                        </div>
                      </div>
                    )}
                    {roleKey === "shipper" && calcResult.roleInsights.shipper && (
                      <div>
                        <div className="text-slate-300 text-sm">{calcResult.roleInsights.shipper.budgetImpact}</div>
                        {calcResult.roleInsights.shipper.savingOpportunity && (
                          <div className="text-green-400 text-sm mt-1">{calcResult.roleInsights.shipper.savingOpportunity}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700/50 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">Enter lane details and click Calculate</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TRENDS TAB */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {(["7d", "30d", "90d", "1y"] as const).map(p => (
                <Button key={p} size="sm" variant={trendPeriod === p ? "default" : "outline"}
                  className={cn(
                    trendPeriod === p ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0" : "border-slate-600 text-slate-400"
                  )}
                  onClick={() => setTrendPeriod(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {trendsQuery.isLoading ? (
            <Skeleton className="h-64" />
          ) : trendsQuery.data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-slate-400">Spot High</div>
                    <div className="text-lg font-bold text-red-400">${trendsQuery.data.summary.spotHigh}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-slate-400">Spot Low</div>
                    <div className="text-lg font-bold text-green-400">${trendsQuery.data.summary.spotLow}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-slate-400">Spot Avg</div>
                    <div className="text-lg font-bold text-white">${trendsQuery.data.summary.spotAvg}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-slate-400">Volatility</div>
                    <div className="text-lg font-bold text-orange-400">${trendsQuery.data.summary.volatility}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-slate-400">Direction</div>
                    <div className={cn("text-lg font-bold flex items-center justify-center gap-1",
                      trendsQuery.data.summary.trendDirection === "RISING" ? "text-green-400" : "text-red-400"
                    )}>
                      {trendsQuery.data.summary.trendDirection === "RISING" ?
                        <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {trendsQuery.data.summary.trendDirection}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rate data table */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  <div className="divide-y divide-slate-700/50">
                    <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-slate-400 font-medium sticky top-0 bg-slate-800">
                      <div>Date</div>
                      <div className="text-right">Spot</div>
                      <div className="text-right">Contract</div>
                      <div className="text-right">National</div>
                    </div>
                    {trendsQuery.data.trends.slice(-30).map((point: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2 text-sm hover:bg-slate-700/20">
                        <div className="text-slate-300">{point.date}</div>
                        <div className="text-right text-orange-400 font-medium">${point.spotRate}</div>
                        <div className="text-right text-blue-400">${point.contractRate}</div>
                        <div className="text-right text-white">${point.nationalAvg}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Top Movers */}
          {summaryQuery.data?.topMovers && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Flame className="w-5 h-5 text-orange-400" />
                  Top Movers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summaryQuery.data.topMovers.map((mover: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm w-5">{i + 1}</span>
                        <span className="text-white font-medium text-sm">{mover.lane}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">${mover.rate}/mi</span>
                        <span className={cn("text-sm font-medium flex items-center gap-0.5",
                          mover.change > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {mover.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {mover.change > 0 ? "+" : ""}{mover.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
