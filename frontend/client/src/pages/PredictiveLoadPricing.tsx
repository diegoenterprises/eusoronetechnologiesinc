/**
 * GAP-346: Predictive Load Pricing Page
 * Surfaces ML-powered rate predictions, dynamic pricing, demand forecasts,
 * market intelligence, and lane analytics.
 * Tabs: Rate Predictor | Dynamic Pricing | Demand Forecast | Market Intel | Lane History
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, TrendingDown, Target, BarChart3,
  Zap, Search, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
  Activity, Percent, MapPin, Truck, Package, Calendar, Brain,
  Gauge, Shield, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const EQUIPMENT_TYPES = [
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer", label: "Reefer" },
  { value: "flatbed", label: "Flatbed" },
  { value: "tanker", label: "Tanker" },
  { value: "step_deck", label: "Step Deck" },
  { value: "lowboy", label: "Lowboy" },
  { value: "hopper", label: "Hopper" },
  { value: "pneumatic", label: "Pneumatic" },
];

const CARGO_TYPES = [
  { value: "general", label: "General" },
  { value: "hazmat", label: "Hazmat" },
  { value: "petroleum", label: "Petroleum" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "chemicals", label: "Chemicals" },
  { value: "oversized", label: "Oversized" },
  { value: "liquid", label: "Liquid" },
  { value: "gas", label: "Gas" },
];

export default function PredictiveLoadPricing() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("predictor");

  // ── Rate Predictor Form State ──
  const [originState, setOriginState] = useState("");
  const [destState, setDestState] = useState("");
  const [distance, setDistance] = useState("");
  const [equipment, setEquipment] = useState("dry_van");
  const [cargo, setCargo] = useState("general");
  const [urgency, setUrgency] = useState<"LOW" | "NORMAL" | "HIGH" | "CRITICAL">("NORMAL");
  const [weight, setWeight] = useState("");
  const [showPrediction, setShowPrediction] = useState(false);

  // ── Queries ──
  const engineStatus = (trpc as any).predictivePricing?.getEngineStatus?.useQuery?.() ?? { data: null, isLoading: false };
  const marketSnapshot = (trpc as any).predictivePricing?.getMarketSnapshot?.useQuery?.() ?? { data: null, isLoading: false };
  const topLanes = (trpc as any).predictivePricing?.getTopLanes?.useQuery?.({ limit: 12 }) ?? { data: [], isLoading: false };

  const predictionEnabled = originState.length >= 2 && destState.length >= 2 && Number(distance) > 0;

  const ratePrediction = (trpc as any).predictivePricing?.predictRate?.useQuery?.(
    { originState, destState, distance: Number(distance), weight: weight ? Number(weight) : undefined, equipmentType: equipment, cargoType: cargo, urgency },
    { enabled: predictionEnabled && showPrediction }
  ) ?? { data: null, isLoading: false };

  const dynamicPrice = (trpc as any).predictivePricing?.getDynamicPrice?.useQuery?.(
    { originState, destState, distance: Number(distance), weight: weight ? Number(weight) : undefined, equipmentType: equipment, cargoType: cargo, urgency },
    { enabled: predictionEnabled && showPrediction }
  ) ?? { data: null, isLoading: false };

  const demandForecast = (trpc as any).predictivePricing?.forecastDemand?.useQuery?.(
    { originState: originState || undefined, destState: destState || undefined },
    { enabled: showPrediction }
  ) ?? { data: null, isLoading: false };

  const laneHistory = (trpc as any).predictivePricing?.getLaneHistory?.useQuery?.(
    { originState, destState, limit: 30 },
    { enabled: predictionEnabled && showPrediction }
  ) ?? { data: [], isLoading: false };

  const anomalies = (trpc as any).predictivePricing?.detectAnomalies?.useQuery?.(
    { rate: ratePrediction.data?.predictedSpotRate || 0, distance: Number(distance), originState, destState },
    { enabled: predictionEnabled && showPrediction && !!ratePrediction.data?.predictedSpotRate }
  ) ?? { data: [], isLoading: false };

  const handlePredict = () => {
    if (!predictionEnabled) {
      toast.error("Enter origin state, destination state, and distance");
      return;
    }
    setShowPrediction(true);
  };

  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");
  const pred = ratePrediction.data;
  const dynPrice = dynamicPrice.data;
  const forecast = demandForecast.data;
  const snap = marketSnapshot.data;

  const marketConditionColor = (mc: string) => {
    if (mc === "SELLER") return "text-red-400";
    if (mc === "BUYER") return "text-green-400";
    return "text-cyan-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Predictive Load Pricing
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            ML-powered rate predictions, dynamic pricing & market intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-xs px-3 py-1", engineStatus.data?.ready ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30")}>
            <Activity className="w-3 h-3 mr-1" />
            {engineStatus.data?.ready ? "ML Engine Active" : "ML Engine Training"}
          </Badge>
        </div>
      </div>

      {/* Input Form */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Search className="w-5 h-5 text-cyan-400" />Rate Prediction Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Origin State</Label>
              <Select value={originState} onValueChange={v => { setOriginState(v); setShowPrediction(false); }}>
                <SelectTrigger className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dest State</Label>
              <Select value={destState} onValueChange={v => { setDestState(v); setShowPrediction(false); }}>
                <SelectTrigger className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Distance (mi)</Label>
              <Input type="number" value={distance} onChange={e => { setDistance(e.target.value); setShowPrediction(false); }} placeholder="500" className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Equipment</Label>
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{EQUIPMENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{CARGO_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Urgency</Label>
              <Select value={urgency} onValueChange={v => setUrgency(v as any)}>
                <SelectTrigger className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight (lbs)</Label>
              <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="40000" className={cn("h-9 rounded-lg text-xs", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} />
            </div>
            <div className="flex items-end">
              <Button onClick={handlePredict} disabled={!predictionEnabled} className="w-full h-9 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg text-xs">
                <Zap className="w-3.5 h-3.5 mr-1" />Predict
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="predictor"><DollarSign className="w-4 h-4 mr-1.5" />Rate Predictor</TabsTrigger>
          <TabsTrigger value="dynamic"><Zap className="w-4 h-4 mr-1.5" />Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="demand"><BarChart3 className="w-4 h-4 mr-1.5" />Demand Forecast</TabsTrigger>
          <TabsTrigger value="market"><TrendingUp className="w-4 h-4 mr-1.5" />Market Intel</TabsTrigger>
          <TabsTrigger value="lanes"><MapPin className="w-4 h-4 mr-1.5" />Top Lanes</TabsTrigger>
        </TabsList>

        {/* ═══ RATE PREDICTOR ═══ */}
        <TabsContent value="predictor">
          {!showPrediction ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className={cn("text-lg font-medium mb-2", isLight ? "text-slate-700" : "text-slate-300")}>Enter lane details above and click Predict</p>
                <p className="text-sm text-slate-500">The ML engine analyzes historical rates, seasonal patterns, and market conditions</p>
              </CardContent>
            </Card>
          ) : ratePrediction.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Prediction Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Spot Rate</p>
                    <p className="text-3xl font-bold text-green-400">${pred?.predictedSpotRate?.toLocaleString() || "—"}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      ${Number(distance) > 0 ? (pred?.predictedSpotRate / Number(distance)).toFixed(2) : "0"}/mi
                    </p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Contract Rate</p>
                    <p className="text-3xl font-bold text-purple-400">${pred?.predictedContractRate?.toLocaleString() || "—"}</p>
                    <p className="text-xs text-slate-500 mt-1">+6% premium vs spot</p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <p className="text-3xl font-bold text-cyan-400">{pred?.confidence || 0}%</p>
                    <Progress value={pred?.confidence || 0} className="h-1.5 mt-2 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500" />
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Market Condition</p>
                    <p className={cn("text-2xl font-bold", marketConditionColor(pred?.marketCondition || "BALANCED"))}>
                      {pred?.marketCondition || "BALANCED"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{pred?.basedOnSamples || 0} samples</p>
                  </CardContent>
                </Card>
              </div>

              {/* Price Range + Factors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Gauge className="w-5 h-5 text-cyan-400" />Price Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn("p-4 rounded-lg border mb-4", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-green-400 font-medium">${pred?.priceRange?.low?.toLocaleString()}</span>
                        <span className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${pred?.predictedSpotRate?.toLocaleString()}</span>
                        <span className="text-sm text-red-400 font-medium">${pred?.priceRange?.high?.toLocaleString()}</span>
                      </div>
                      <div className="relative h-4 rounded-full bg-slate-600/30 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-cyan-500/30 to-red-500/30 rounded-full" />
                        {pred?.predictedSpotRate && pred?.priceRange?.low && pred?.priceRange?.high && (
                          <div
                            className="absolute top-0 h-full w-2 bg-white rounded-full shadow-lg"
                            style={{ left: `${Math.min(100, Math.max(0, ((pred.predictedSpotRate - pred.priceRange.low) / (pred.priceRange.high - pred.priceRange.low)) * 100))}%` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">Low</span>
                        <span className="text-xs text-slate-500">Predicted</span>
                        <span className="text-xs text-slate-500">High</span>
                      </div>
                    </div>
                    <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{pred?.recommendation}</p>
                  </CardContent>
                </Card>

                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Target className="w-5 h-5 text-purple-400" />Price Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!pred?.factors?.length ? (
                      <div className="text-center py-8"><Info className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-slate-400 text-sm">No significant factors detected</p></div>
                    ) : (
                      <div className="space-y-3">
                        {pred.factors.map((f: any, i: number) => (
                          <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                            <div className="flex items-center gap-2">
                              {f.direction === "up" ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownRight className="w-4 h-4 text-green-400" />}
                              <span className={cn("text-sm", isLight ? "text-slate-700" : "text-white")}>{f.name}</span>
                            </div>
                            <Badge className={cn("text-xs", f.direction === "up" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30")}>
                              {f.impact > 0 ? "+" : ""}{f.impact}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Anomalies */}
              {(anomalies.data as any[])?.length > 0 && (
                <Card className={cn(cc, "border-yellow-500/30")}>
                  <CardHeader>
                    <CardTitle className="text-yellow-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />Rate Anomalies Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(anomalies.data as any[]).map((a: any, i: number) => (
                        <div key={i} className={cn("p-3 rounded-lg border", a.severity === "CRITICAL" ? "border-red-500/30 bg-red-500/10" : a.severity === "WARNING" ? "border-yellow-500/30 bg-yellow-500/10" : "border-slate-600/30 bg-slate-700/20")}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{a.message}</span>
                            <Badge className={cn("text-xs", a.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : a.severity === "WARNING" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400")}>{a.severity}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">{a.details}</p>
                          <p className="text-xs text-cyan-400 mt-1">{a.suggestedAction}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ DYNAMIC PRICING ═══ */}
        <TabsContent value="dynamic">
          {!showPrediction ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4 opacity-50" />
                <p className={cn("text-lg font-medium mb-2", isLight ? "text-slate-700" : "text-slate-300")}>Enter lane details and click Predict for dynamic pricing</p>
                <p className="text-sm text-slate-500">Real-time rate recommendations accounting for demand, season, and urgency</p>
              </CardContent>
            </Card>
          ) : dynamicPrice.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cc}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Recommended Rate</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                          ${dynPrice?.recommendedRate?.toLocaleString() || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/20"><Zap className="w-6 h-6 text-purple-400" /></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">${dynPrice?.ratePerMile?.toFixed(2) || "0"}/mi</p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Competitive Position</p>
                        <p className={cn("text-2xl font-bold", dynPrice?.competitivePosition === "BELOW_MARKET" ? "text-green-400" : dynPrice?.competitivePosition === "ABOVE_MARKET" ? "text-red-400" : "text-cyan-400")}>
                          {dynPrice?.competitivePosition?.replace("_", " ") || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-cyan-500/20"><Target className="w-6 h-6 text-cyan-400" /></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Savings: ${dynPrice?.savingsVsMarket?.toLocaleString() || 0}</p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-5">
                    <p className="text-xs text-slate-500 mb-2">Multipliers</p>
                    <div className="space-y-2">
                      {[
                        { label: "Urgency", value: dynPrice?.urgencyMultiplier, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                        { label: "Demand", value: dynPrice?.demandMultiplier, icon: <TrendingUp className="w-3.5 h-3.5" /> },
                        { label: "Seasonal", value: dynPrice?.seasonalMultiplier, icon: <Calendar className="w-3.5 h-3.5" /> },
                      ].map(m => (
                        <div key={m.label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">{m.icon}{m.label}</span>
                          <Badge className={cn("text-xs", (m.value || 1) > 1 ? "bg-red-500/20 text-red-400" : (m.value || 1) < 1 ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                            {(m.value || 1).toFixed(2)}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {dynPrice?.explanation && (
                <Card className={cc}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{dynPrice.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ DEMAND FORECAST ═══ */}
        <TabsContent value="demand">
          {demandForecast.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Current Week Volume</p>
                    <p className="text-2xl font-bold text-cyan-400">{forecast?.currentWeekVolume || 0}</p>
                    <p className="text-xs text-slate-500">loads</p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Next Week Forecast</p>
                    <p className="text-2xl font-bold text-purple-400">{forecast?.nextWeekForecast || 0}</p>
                    <p className="text-xs text-slate-500">loads predicted</p>
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Trend</p>
                    <p className={cn("text-2xl font-bold", forecast?.trend === "RISING" ? "text-green-400" : forecast?.trend === "DECLINING" ? "text-red-400" : "text-cyan-400")}>
                      {forecast?.trend || "STABLE"}
                    </p>
                    {forecast?.trend === "RISING" ? <TrendingUp className="w-4 h-4 text-green-400 mt-1" /> : forecast?.trend === "DECLINING" ? <TrendingDown className="w-4 h-4 text-red-400 mt-1" /> : <Activity className="w-4 h-4 text-cyan-400 mt-1" />}
                  </CardContent>
                </Card>
                <Card className={cc}>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">Seasonal Factor</p>
                    <p className="text-2xl font-bold text-orange-400">{forecast?.seasonalFactor?.toFixed(2) || "1.00"}x</p>
                    <p className="text-xs text-slate-500">Confidence: {forecast?.confidence || 0}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* 4-Week Forecast */}
              {forecast?.next4WeekForecast?.length > 0 && (
                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <BarChart3 className="w-5 h-5 text-cyan-400" />4-Week Volume Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {forecast.next4WeekForecast.map((vol: number, i: number) => (
                        <div key={i} className={cn("p-4 rounded-lg border text-center", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                          <p className="text-xs text-slate-500 mb-1">Week {i + 1}</p>
                          <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{vol}</p>
                          <p className="text-xs text-slate-500">loads</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Demand Lanes */}
              {forecast?.topLanes?.length > 0 && (
                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <MapPin className="w-5 h-5 text-green-400" />Top Demand Lanes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {forecast.topLanes.map((lane: any, i: number) => (
                        <div key={i} className={cn("p-3 rounded-lg border flex items-center justify-between", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                          <div>
                            <p className={cn("font-medium text-sm", isLight ? "text-slate-700" : "text-white")}>{lane.lane}</p>
                            <p className="text-xs text-slate-500">{lane.volume} loads/week</p>
                          </div>
                          <Badge className={cn("text-xs", lane.trend === "RISING" ? "bg-green-500/20 text-green-400" : lane.trend === "DECLINING" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>
                            {lane.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ MARKET INTEL ═══ */}
        <TabsContent value="market">
          {marketSnapshot.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2].map(i => <Skeleton key={i} className="h-60 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seasonal Factors */}
                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Calendar className="w-5 h-5 text-orange-400" />Seasonal Rate Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(snap?.seasonalFactors || {}).map(([m, f]) => {
                        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                        const factor = f as number;
                        const isCurrent = Number(m) === snap?.currentMonth;
                        return (
                          <div key={m} className={cn("p-2 rounded-lg border text-center", isCurrent ? "border-cyan-500/50 bg-cyan-500/10" : isLight ? "bg-slate-50 border-slate-100" : "bg-slate-700/30 border-slate-600/30")}>
                            <p className={cn("text-xs font-medium", isCurrent ? "text-cyan-400" : "text-slate-500")}>{monthNames[Number(m) - 1]}</p>
                            <p className={cn("text-sm font-bold", factor > 1.05 ? "text-red-400" : factor < 0.98 ? "text-green-400" : isLight ? "text-slate-700" : "text-white")}>
                              {factor.toFixed(2)}x
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Multipliers */}
                <Card className={cc}>
                  <CardHeader>
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Truck className="w-5 h-5 text-purple-400" />Equipment Rate Multipliers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(snap?.equipmentMultipliers || {}).map(([eq, mul]) => (
                        <div key={eq} className="flex items-center justify-between">
                          <span className={cn("text-sm capitalize", isLight ? "text-slate-600" : "text-slate-300")}>{eq.replace("_", " ")}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={((mul as number) / 1.25) * 100} className="w-24 h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
                            <Badge className={cn("text-xs w-14 justify-center", (mul as number) > 1 ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-400")}>
                              {(mul as number).toFixed(2)}x
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engine Status */}
              <Card className={cc}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", snap?.engineReady ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      <Brain className={cn("w-5 h-5", snap?.engineReady ? "text-green-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>
                        ML Engine: {snap?.engineReady ? "Trained & Active" : "Training in Progress"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {snap?.engineReady ? "Predictions use learned lane data, seasonal patterns, and carrier behavior" : "Submit loads and bids to build lane intelligence — predictions improve with more data"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══ TOP LANES ═══ */}
        <TabsContent value="lanes">
          {topLanes.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : !(topLanes.data as any[])?.length ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <p className={cn("text-lg font-medium", isLight ? "text-slate-700" : "text-slate-300")}>No lane data yet</p>
                <p className="text-sm text-slate-500">Create loads to build lane intelligence</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(topLanes.data as any[]).map((lane: any, i: number) => (
                <Card key={i} className={cc}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">#{i + 1}</Badge>
                      <span className="text-xs text-slate-500">{lane.loadCount} loads</span>
                    </div>
                    <p className={cn("font-bold text-lg mb-1", isLight ? "text-slate-800" : "text-white")}>
                      {lane.originState} → {lane.destState}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400 font-medium">${Number(lane.avgRate).toLocaleString()} avg</span>
                      <span className="text-slate-500">{lane.avgDistance} mi</span>
                      <span className="text-purple-400">${lane.avgRatePerMile}/mi</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Lane History Table */}
          {showPrediction && predictionEnabled && (
            <Card className={cn(cc, "mt-6")}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Package className="w-5 h-5 text-cyan-400" />
                  Historical Rates: {originState} → {destState}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {laneHistory.isLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                ) : !(laneHistory.data as any[])?.length ? (
                  <p className="text-slate-400 text-sm text-center py-6">No historical loads for this lane</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700")}>
                          <th className="text-left py-2 px-3 text-slate-500">Date</th>
                          <th className="text-left py-2 px-3 text-slate-500">Origin</th>
                          <th className="text-left py-2 px-3 text-slate-500">Dest</th>
                          <th className="text-right py-2 px-3 text-slate-500">Rate</th>
                          <th className="text-right py-2 px-3 text-slate-500">Distance</th>
                          <th className="text-right py-2 px-3 text-slate-500">$/mi</th>
                          <th className="text-center py-2 px-3 text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(laneHistory.data as any[]).slice(0, 15).map((load: any, i: number) => (
                          <tr key={i} className={cn("border-b", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20")}>
                            <td className="py-2 px-3 text-slate-500">{load.createdAt ? new Date(load.createdAt).toLocaleDateString() : "—"}</td>
                            <td className={cn("py-2 px-3", isLight ? "text-slate-700" : "text-white")}>{load.originCity || load.originState}</td>
                            <td className={cn("py-2 px-3", isLight ? "text-slate-700" : "text-white")}>{load.destCity || load.destState}</td>
                            <td className="py-2 px-3 text-right text-green-400 font-medium">${Number(load.rate).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400">{load.distance} mi</td>
                            <td className="py-2 px-3 text-right text-purple-400">${load.distance > 0 ? (load.rate / load.distance).toFixed(2) : "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge className={cn("text-xs", load.status === "delivered" ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400")}>{load.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
