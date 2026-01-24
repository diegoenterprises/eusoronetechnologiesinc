/**
 * RATE CALCULATOR PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calculator, DollarSign, MapPin, Truck, Fuel, Clock,
  TrendingUp, TrendingDown, AlertTriangle, Save, History,
  ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RateCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("dry_van");
  const [weight, setWeight] = useState("");
  const [hazmat, setHazmat] = useState(false);
  const [expedited, setExpedited] = useState(false);

  const marketRatesQuery = trpc.rates.getMarketRates.useQuery({ equipment });
  const historyQuery = trpc.rates.getHistory.useQuery({ limit: 10 });

  const calculateMutation = trpc.rates.calculate.useMutation({
    onSuccess: (data) => {
      toast.success("Rate calculated");
    },
    onError: (error) => toast.error("Calculation failed", { description: error.message }),
  });

  const saveQuoteMutation = trpc.rates.saveQuote.useMutation({
    onSuccess: () => { toast.success("Quote saved"); historyQuery.refetch(); },
    onError: (error) => toast.error("Failed to save", { description: error.message }),
  });

  const handleCalculate = () => {
    if (!origin || !destination) {
      toast.error("Please enter origin and destination");
      return;
    }
    calculateMutation.mutate({
      origin,
      destination,
      equipment,
      weight: weight ? parseInt(weight) : undefined,
      hazmat,
      expedited,
    });
  };

  const result = calculateMutation.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rate Calculator</h1>
          <p className="text-slate-400 text-sm">Calculate freight rates based on market data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />Calculate Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Origin</Label>
                  <div className="relative mt-1">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                    <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="City, State" className="pl-9 bg-slate-700/50 border-slate-600" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Destination</Label>
                  <div className="relative mt-1">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City, State" className="pl-9 bg-slate-700/50 border-slate-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Equipment Type</Label>
                  <Select value={equipment} onValueChange={setEquipment}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry_van">Dry Van</SelectItem>
                      <SelectItem value="reefer">Reefer</SelectItem>
                      <SelectItem value="flatbed">Flatbed</SelectItem>
                      <SelectItem value="step_deck">Step Deck</SelectItem>
                      <SelectItem value="tanker">Tanker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-400">Weight (lbs)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional" className="mt-1 bg-slate-700/50 border-slate-600" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={hazmat} onCheckedChange={setHazmat} />
                  <Label className="text-slate-400">Hazmat</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={expedited} onCheckedChange={setExpedited} />
                  <Label className="text-slate-400">Expedited</Label>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCalculate} disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                Calculate Rate
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white">Rate Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <p className="text-3xl font-bold text-green-400">${result.recommendedRate?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Recommended Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-blue-400">${result.ratePerMile?.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">Per Mile</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-purple-400">{result.distance}</p>
                    <p className="text-xs text-slate-400">Miles</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <p className="text-2xl font-bold text-orange-400">{result.transitTime}</p>
                    <p className="text-xs text-slate-400">Transit Time</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">Low Estimate</span>
                    <span className="text-white font-medium">${result.lowRate?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">High Estimate</span>
                    <span className="text-white font-medium">${result.highRate?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">Fuel Surcharge</span>
                    <span className="text-white font-medium">${result.fuelSurcharge?.toLocaleString()}</span>
                  </div>
                  {result.hazmatFee && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <span className="text-red-400">Hazmat Fee</span>
                      <span className="text-red-400 font-medium">${result.hazmatFee?.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 border-slate-600" onClick={() => saveQuoteMutation.mutate({ ...result, origin, destination })} disabled={saveQuoteMutation.isPending}>
                    {saveQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Quote
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <DollarSign className="w-4 h-4 mr-2" />Create Load
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Rates */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />Market Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketRatesQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-400">National Avg</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">${marketRatesQuery.data?.nationalAvg?.toFixed(2)}/mi</span>
                      {marketRatesQuery.data?.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-400">Spot Rate</span>
                    <span className="text-white font-bold">${marketRatesQuery.data?.spotRate?.toFixed(2)}/mi</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-400">Contract Rate</span>
                    <span className="text-white font-bold">${marketRatesQuery.data?.contractRate?.toFixed(2)}/mi</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-400 flex items-center gap-1"><Fuel className="w-3 h-3" />Diesel Avg</span>
                    <span className="text-white font-bold">${marketRatesQuery.data?.dieselPrice?.toFixed(2)}/gal</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quotes */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />Recent Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : historyQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No saved quotes</p>
              ) : (
                <div className="space-y-3">
                  {historyQuery.data?.map((quote) => (
                    <div key={quote.id} className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                        <span>{quote.origin}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{quote.destination}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-bold">${quote.rate?.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">{quote.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
