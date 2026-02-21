/**
 * COMMISSION ENGINE PAGE
 * Frontend for commissionEngine router — dynamic platform fee calculation,
 * commodity-indexed pricing, gamification bonuses, and driver commissions.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Calculator, DollarSign, TrendingUp, Percent, Zap,
  BarChart3, Flame, Truck, Package, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommissionEnginePage() {
  const [grossRate, setGrossRate] = useState("3500");
  const [distance, setDistance] = useState("750");
  const [cargoType, setCargoType] = useState("liquid");
  const [hazmatClass, setHazmatClass] = useState("3");
  const [driverScore, setDriverScore] = useState("85");

  const calcQuery = (trpc as any).commissionEngine.calculate.useQuery({
    grossRate: parseFloat(grossRate) || 0,
    distanceMiles: parseFloat(distance) || 0,
    cargoType,
    hazmatClass: hazmatClass || undefined,
    driverGamificationScore: parseFloat(driverScore) || 0,
  }, { enabled: parseFloat(grossRate) > 0 });

  const indexQuery = (trpc as any).commissionEngine.getCommodityIndexes.useQuery();

  const result = calcQuery.data;
  const indexes = indexQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Commission Engine</h1>
        <p className="text-slate-400 text-sm mt-1">Dynamic platform fee calculation with commodity indexing</p>
      </div>

      {/* Formula Card */}
      <Card className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30 rounded-xl">
        <CardContent className="p-4">
          <p className="text-xs text-slate-400 mb-2">Fee Formula</p>
          <p className="text-sm text-white font-mono">PLATFORM_FEE = BASE(8%) * (1 + RISK - GAMIFICATION_BONUS) * COMMODITY_FACTOR</p>
          <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
            <span>Range: 5% - 15%</span>
            <span>Driver Commission: 25%</span>
            <span>Hazmat Premium: +2%</span>
            <span>Long-haul Premium: +1% (&gt;1500mi)</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#1473FF]" />Fee Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Gross Rate ($)</label>
              <Input type="number" value={grossRate} onChange={e => setGrossRate(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Distance (miles)</label>
              <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Cargo Type</label>
              <div className="flex gap-1 flex-wrap">
                {["general", "liquid", "petroleum", "gas", "chemicals", "hazmat"].map(t => (
                  <Button key={t} size="sm" variant={cargoType === t ? "default" : "outline"} onClick={() => setCargoType(t)}
                    className={cn("text-xs h-7", cargoType === t ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300")}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Hazmat Class</label>
                <Input value={hazmatClass} onChange={e => setHazmatClass(e.target.value)} placeholder="e.g. 3" className="bg-slate-900/50 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Driver Score (0-100)</label>
                <Input type="number" value={driverScore} onChange={e => setDriverScore(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calcQuery.isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : result ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Gross Rate</span>
                  <span className="text-lg font-bold text-white">${Number(result.grossRate || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-[#1473FF]" /><span className="text-sm text-slate-400">Platform Fee ({((result.feeRate || 0) * 100).toFixed(1)}%)</span></div>
                  <span className="text-lg font-bold text-[#1473FF]">-${Number(result.platformFee || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-purple-400" /><span className="text-sm text-slate-400">Driver Commission (25%)</span></div>
                  <span className="text-lg font-bold text-purple-400">-${Number(result.driverCommission || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#1473FF]/30 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Net to Catalyst</span>
                  <span className="text-2xl font-black bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(result.netToCatalyst || 0).toLocaleString()}</span>
                </div>
                {result.factors && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {result.factors.riskFactor > 0 && <Badge className="bg-red-500/20 text-red-400 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />Risk +{(result.factors.riskFactor * 100).toFixed(1)}%</Badge>}
                    {result.factors.gamificationBonus > 0 && <Badge className="bg-green-500/20 text-green-400 text-[9px]"><Zap className="w-3 h-3 mr-0.5" />Bonus -{(result.factors.gamificationBonus * 100).toFixed(1)}%</Badge>}
                    {result.factors.commodityFactor !== 1 && <Badge className="bg-blue-500/20 text-blue-400 text-[9px]"><Activity className="w-3 h-3 mr-0.5" />Commodity x{result.factors.commodityFactor?.toFixed(2)}</Badge>}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center"><Calculator className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">Enter values to calculate</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commodity Indexes */}
      {indexes && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" />Live Commodity Indexes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(indexes).map(([key, val]: [string, any]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 text-center">
                  <p className="text-[10px] text-slate-400 uppercase">{key}</p>
                  <p className="text-lg font-bold text-white">{typeof val === "number" ? val.toFixed(2) : String(val)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
