/**
 * MARKET INTELLIGENCE PAGE
 * Live data from FRED, EIA, Yahoo Finance, CommodityPriceAPI
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, TrendingDown, Truck, DollarSign,
  MapPin, RefreshCw, ArrowRight, Fuel, Flame, Wheat, Search,
  Activity, Zap, Globe, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export default function MarketIntelligence() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedSym, setExpandedSym] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResults, setRefreshResults] = useState<any[] | null>(null);
  const [showSources, setShowSources] = useState(false);

  const intelQ = (trpc as any).marketPricing?.getMarketIntelligence?.useQuery?.({}, { refetchInterval: 30_000, refetchIntervalInBackground: false }) || { data: null, isLoading: false };
  const commoditiesQ = (trpc as any).marketPricing?.getCommodities?.useQuery?.({ category: category === "ALL" ? undefined : category, search: search || undefined }, { refetchInterval: 30_000, refetchIntervalInBackground: false }) || { data: null, isLoading: false };
  const indicesQ = (trpc as any).marketPricing?.getIndices?.useQuery?.({}, { refetchInterval: 30_000, refetchIntervalInBackground: false }) || { data: null, isLoading: false };
  const lanesQ = (trpc as any).marketPricing?.getLaneBenchmarks?.useQuery?.({ limit: 10 }, { refetchInterval: 60_000, refetchIntervalInBackground: false }) || { data: null, isLoading: false };

  const intel = intelQ.data;
  const cData = commoditiesQ.data;
  const indices = indicesQ.data;
  const lanes = lanesQ.data;
  const commodities: any[] = cData?.commodities || [];
  const gainers: any[] = cData?.topGainers || [];
  const losers: any[] = cData?.topLosers || [];
  const categories: string[] = cData?.categories || ["Energy", "Metals", "Agriculture", "Freight", "Fuel"];
  const breadth = cData?.marketBreadth || { advancing: 0, declining: 0, unchanged: 0 };

  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const catIcon = (cat: string) => {
    switch (cat) {
      case "Energy": return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case "Metals": return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case "Agriculture": return <Wheat className="w-3.5 h-3.5 text-green-400" />;
      case "Freight": return <Truck className="w-3.5 h-3.5 text-blue-400" />;
      case "Fuel": return <Fuel className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Force refresh mutation — busts all server caches, triggers market + hot zones data sync
  const forceRefreshMutation = (trpc as any).marketPricing?.forceRefreshAll?.useMutation?.({
    onSuccess: (result: any) => {
      intelQ.refetch?.(); commoditiesQ.refetch?.(); indicesQ.refetch?.(); lanesQ.refetch?.();
      setRefreshResults(result.results || []);
      setShowSources(true);
      const cats = new Set((result.results || []).map((r: any) => r.category));
      toast.success(`Refreshed ${result.refreshed}/${result.total} data sources across ${cats.size} categories`, {
        description: `Market + Hot Zones + ${cats.size} gov feeds synced`,
      });
      setIsRefreshing(false);
    },
    onError: (err: any) => {
      intelQ.refetch?.(); commoditiesQ.refetch?.(); indicesQ.refetch?.(); lanesQ.refetch?.();
      toast.error("Refresh error", { description: err.message });
      setIsRefreshing(false);
    },
  });

  const refetchAll = () => {
    setIsRefreshing(true);
    if (forceRefreshMutation?.mutate) {
      forceRefreshMutation.mutate({});
    } else {
      intelQ.refetch?.(); commoditiesQ.refetch?.(); indicesQ.refetch?.(); lanesQ.refetch?.();
      toast.success("Data refreshed");
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Market Intelligence
          </h1>
          <div className="flex items-center gap-2.5 mt-1">
            {cData?.isLiveData ? (
              <>
                {/* Gradient live indicator — animated spinning ring */}
                <div className="relative w-5 h-5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full animate-spin" style={{ background: "conic-gradient(from 0deg, #1473FF, #BE01FF, #1473FF)", animationDuration: "2.5s" }} />
                  <div className={cn("absolute inset-[2px] rounded-full", isLight ? "bg-white" : "bg-slate-800/90")} />
                  <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-[#1473FF] to-[#BE01FF] animate-pulse" style={{ animationDuration: "1.8s" }} />
                  <div className="absolute inset-[5px] rounded-full bg-white/30 animate-ping" style={{ animationDuration: "3s" }} />
                </div>
                <span className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>
                  Live Data
                  <span className={cn("ml-1.5 text-xs font-normal", isLight ? "text-slate-400" : "text-slate-500")}>
                    {cData?.source} · Auto-refresh 30s
                  </span>
                </span>
                {cData?.lastUpdated && (
                  <span className={cn("text-[10px] ml-1", isLight ? "text-slate-300" : "text-slate-600")}>
                    {new Date(cData.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </>
            ) : (
              <>
                {/* Inactive indicator */}
                <div className="relative w-5 h-5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-400/30 animate-spin" style={{ animationDuration: "8s" }} />
                  <div className={cn("absolute inset-[3px] rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")} />
                </div>
                <span className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Seed data — configure API keys for live prices</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search commodities..." className={cn("pl-9 w-48 rounded-xl h-9", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white")} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={cn("w-[130px] rounded-xl h-9", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sectors</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className={cn("rounded-xl h-9", isRefreshing ? "opacity-60 cursor-wait" : "", isLight ? "border-slate-200" : "border-slate-700")} onClick={refetchAll} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing ? "animate-spin" : "")} />
          </Button>
        </div>
      </div>

      {/* Data Source Status Panel — shows after refresh */}
      {showSources && refreshResults && refreshResults.length > 0 && (
        <Card className={cn("rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Activity className="w-4 h-4 text-purple-400" />
                {refreshResults.filter((r: any) => r.success).length}/{refreshResults.length} Data Sources Synced
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  ({new Set(refreshResults.map((r: any) => r.category)).size} categories)
                </span>
              </CardTitle>
              <button onClick={() => setShowSources(false)} className={cn("text-xs px-2 py-1 rounded-lg", isLight ? "text-slate-400 hover:bg-slate-100" : "text-slate-500 hover:bg-slate-700/30")}>
                Dismiss
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
              {refreshResults.map((r: any, i: number) => (
                <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px]", r.success ? (isLight ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400") : (isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400"))}>
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", r.success ? "bg-green-400" : "bg-red-400")} />
                  <span className="truncate font-medium">{r.label || r.source}</span>
                </div>
              ))}
            </div>
            {refreshResults.some((r: any) => !r.success) && (
              <div className={cn("mt-2 pt-2 border-t text-[10px]", isLight ? "border-slate-200 text-slate-400" : "border-slate-700/30 text-slate-500")}>
                {refreshResults.filter((r: any) => !r.success).map((r: any, i: number) => (
                  <div key={i} className="flex gap-1"><span className="text-red-400 font-medium">{r.label}:</span> {r.error?.slice(0, 80)}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Breadth + Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={cn("rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")}>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-400">{breadth.advancing}</p>
            <p className="text-[10px] text-slate-400">Advancing</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl border", isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30")}>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-400">{breadth.declining}</p>
            <p className="text-[10px] text-slate-400">Declining</p>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-4 text-center">
            <Fuel className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${intel?.snapshot?.dieselNational?.price?.toFixed(3) || "—"}</p>
            <p className="text-[10px] text-slate-400">DOE Diesel Avg</p>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${intel?.snapshot?.crudeOilWTI?.price?.toFixed(2) || "—"}</p>
            <p className="text-[10px] text-slate-400">WTI Crude</p>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${indices?.fuel?.surchargePerMile?.toFixed(3) || "—"}</p>
            <p className="text-[10px] text-slate-400">Fuel Surcharge/Mi</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cc}>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <TrendingUp className="w-4 h-4 text-green-400" /> Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {gainers.map((g: any) => (
              <div key={g.symbol} className={cn("flex items-center justify-between px-4 py-2.5 border-t", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/30 hover:bg-slate-700/20")}>
                <div className="flex items-center gap-2">
                  {catIcon(g.category)}
                  <span className={cn("font-mono text-xs font-bold", isLight ? "text-slate-700" : "text-slate-300")}>{g.symbol}</span>
                  <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{g.name}</span>
                </div>
                <div className="text-right">
                  <span className={cn("font-mono text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{g.price >= 100 ? g.price.toFixed(2) : g.price.toFixed(4)}</span>
                  <span className="text-green-400 text-xs font-mono ml-2">+{g.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cc}>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <TrendingDown className="w-4 h-4 text-red-400" /> Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {losers.map((l: any) => (
              <div key={l.symbol} className={cn("flex items-center justify-between px-4 py-2.5 border-t", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/30 hover:bg-slate-700/20")}>
                <div className="flex items-center gap-2">
                  {catIcon(l.category)}
                  <span className={cn("font-mono text-xs font-bold", isLight ? "text-slate-700" : "text-slate-300")}>{l.symbol}</span>
                  <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{l.name}</span>
                </div>
                <div className="text-right">
                  <span className={cn("font-mono text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{l.price >= 100 ? l.price.toFixed(2) : l.price.toFixed(4)}</span>
                  <span className="text-red-400 text-xs font-mono ml-2">{l.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Full Commodity Table */}
      <Card className={cc}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <BarChart3 className="w-5 h-5 text-purple-400" /> Commodities & Freight Indices
            </CardTitle>
            <span className="text-[10px] text-slate-400">{commodities.length} instruments · Updated {cData?.lastUpdated ? new Date(cData.lastUpdated).toLocaleTimeString() : "—"}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className={cn("grid grid-cols-[1fr_80px_90px_70px_60px_80px] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider border-b", isLight ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-slate-900/30 text-slate-500 border-slate-700/30")}>
            <span>Instrument</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
            <span className="text-right">%</span>
            <span className="text-center">Signal</span>
            <span className="text-right">Volume</span>
          </div>
          {commoditiesQ.isLoading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : commodities.length === 0 ? (
            <div className="p-8 text-center"><p className={cn("text-sm", mt)}>No results found</p></div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              {commodities.map((c: any) => {
                const isUp = c.changePercent > 0;
                const isDown = c.changePercent < 0;
                const expanded = expandedSym === c.symbol;
                return (
                  <div key={c.symbol}>
                    <div
                      className={cn("grid grid-cols-[1fr_80px_90px_70px_60px_80px] px-4 py-2.5 border-b cursor-pointer transition-colors", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/20 hover:bg-slate-700/20", expanded && (isLight ? "bg-slate-50" : "bg-slate-700/20"))}
                      onClick={() => setExpandedSym(expanded ? null : c.symbol)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {catIcon(c.category)}
                        <span className={cn("font-mono text-xs font-bold shrink-0", isLight ? "text-slate-700" : "text-slate-300")}>{c.symbol}</span>
                        <span className={cn("text-xs truncate", isLight ? "text-slate-500" : "text-slate-400")}>{c.name}</span>
                      </div>
                      <span className={cn("font-mono text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>
                        {c.price >= 1000 ? c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c.price >= 10 ? c.price.toFixed(2) : c.price.toFixed(4)}
                      </span>
                      <span className={cn("font-mono text-xs text-right self-center", isUp ? "text-green-400" : isDown ? "text-red-400" : "text-slate-400")}>
                        {isUp ? "+" : ""}{c.change >= 100 ? c.change.toFixed(2) : c.change >= 1 ? c.change.toFixed(2) : c.change.toFixed(4)}
                      </span>
                      <span className={cn("font-mono text-xs text-right font-semibold self-center", isUp ? "text-green-400" : isDown ? "text-red-400" : "text-slate-400")}>
                        {isUp ? "+" : ""}{c.changePercent.toFixed(2)}%
                      </span>
                      <div className="flex justify-center self-center">
                        <Badge className={cn("border-0 text-[10px] px-1.5 py-0", c.intraday === "BULL" ? "bg-green-500/20 text-green-400" : c.intraday === "BEAR" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>
                          {c.intraday}
                        </Badge>
                      </div>
                      <span className={cn("text-xs text-right self-center", isLight ? "text-slate-500" : "text-slate-400")}>{c.volume}</span>
                    </div>
                    {expanded && (
                      <div className={cn("px-4 py-3 border-b grid grid-cols-2 md:grid-cols-4 gap-3 text-xs", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/30 border-slate-700/30")}>
                        <div><span className="text-slate-500">Prev Close</span><p className={cn("font-mono font-semibold", isLight ? "text-slate-700" : "text-white")}>{c.previousClose >= 100 ? c.previousClose.toFixed(2) : c.previousClose.toFixed(4)}</p></div>
                        <div><span className="text-slate-500">Open</span><p className={cn("font-mono font-semibold", isLight ? "text-slate-700" : "text-white")}>{c.open >= 100 ? c.open.toFixed(2) : c.open.toFixed(4)}</p></div>
                        <div><span className="text-slate-500">High</span><p className="font-mono font-semibold text-green-400">{c.high >= 100 ? c.high.toFixed(2) : c.high.toFixed(4)}</p></div>
                        <div><span className="text-slate-500">Low</span><p className="font-mono font-semibold text-red-400">{c.low >= 100 ? c.low.toFixed(2) : c.low.toFixed(4)}</p></div>
                        <div><span className="text-slate-500">Unit</span><p className={cn("font-semibold", isLight ? "text-slate-700" : "text-white")}>{c.unit}</p></div>
                        <div><span className="text-slate-500">Daily</span><Badge className={cn("border-0 text-[10px]", c.daily === "UP" ? "bg-green-500/20 text-green-400" : c.daily === "DOWN" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>{c.daily}</Badge></div>
                        <div><span className="text-slate-500">Weekly</span><Badge className={cn("border-0 text-[10px]", c.weekly === "UP" ? "bg-green-500/20 text-green-400" : c.weekly === "DOWN" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>{c.weekly}</Badge></div>
                        <div><span className="text-slate-500">Monthly</span><Badge className={cn("border-0 text-[10px]", c.monthly === "UP" ? "bg-green-500/20 text-green-400" : c.monthly === "DOWN" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400")}>{c.monthly}</Badge></div>
                        {/* Mini sparkline */}
                        {c.sparkline?.length > 0 && (
                          <div className="col-span-2 md:col-span-4 flex items-end gap-0.5 h-10">
                            {c.sparkline.map((v: number, i: number) => {
                              const min = Math.min(...c.sparkline);
                              const max = Math.max(...c.sparkline);
                              const range = max - min || 1;
                              const pct = ((v - min) / range) * 100;
                              return <div key={i} className={cn("flex-1 rounded-t-sm min-h-[2px]", isUp ? "bg-green-400/70" : isDown ? "bg-red-400/70" : "bg-slate-400/50")} style={{ height: `${Math.max(pct, 5)}%` }} />;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lane Benchmarks */}
      <Card className={cc}>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <MapPin className="w-5 h-5 text-orange-400" /> Lane Rate Benchmarks
            {lanes?.fuelSurcharge && <span className="text-xs font-normal text-slate-400 ml-2">FSC: ${lanes.fuelSurcharge.toFixed(3)}/mi</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lanesQ.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {(lanes?.lanes || []).map((lane: any, i: number) => (
                <div key={i} className={cn("px-4 py-3 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-green-400" />
                      <span className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{lane.origin}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{lane.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-0 text-[10px]", lane.volume === "VERY_HIGH" || lane.volume === "HIGH" ? "bg-red-500/20 text-red-400" : lane.volume === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>{lane.volume}</Badge>
                      {lane.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : lane.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{lane.miles} mi · {lane.equipment}</span>
                    <div className="flex items-center gap-3">
                      <span>Base: <span className="font-mono font-semibold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${lane.rate.toFixed(2)}/mi</span></span>
                      <span>+FSC: <span className="font-mono font-semibold text-cyan-400">${lane.rateWithFuel?.toFixed(2)}/mi</span></span>
                      <span>Total: <span className="font-mono font-semibold text-white">${lane.totalRate?.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Freight Rate Indices */}
      {indices && (
        <Card className={cc}>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Truck className="w-5 h-5 text-blue-400" /> Freight Rate Indices
              </CardTitle>
              <Badge className={cn("border-0 text-[10px]", indices.marketCondition === "TIGHT" ? "bg-red-500/20 text-red-400" : indices.marketCondition === "LOOSE" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                Market: {indices.marketCondition}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(indices.indices || {}).map(([key, val]: [string, any]) => (
                <div key={key} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/30 border-slate-700/30")}>
                  <p className={cn("text-xs font-semibold mb-2", isLight ? "text-slate-700" : "text-white")}>{key.replace(/_/g, " ")}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-400">National</span><p className="font-mono font-semibold text-blue-400">${val.national.current}</p></div>
                    <div><span className="text-slate-400">Spot</span><p className="font-mono font-semibold text-orange-400">${val.spot.current}</p></div>
                    <div><span className="text-slate-400">Contract</span><p className="font-mono font-semibold text-purple-400">${val.contract.current}</p></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Fuel Index */}
            <div className={cn("mt-3 p-3 rounded-xl border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div><span className="text-slate-400">DOE Diesel</span><p className="font-mono font-semibold text-cyan-400">${indices.fuel?.diesel?.current?.toFixed(3)}/gal</p></div>
                  <div><span className="text-slate-400">DEF</span><p className="font-mono font-semibold text-cyan-400">${indices.fuel?.def?.current?.toFixed(3)}/gal</p></div>
                  <div><span className="text-slate-400">FSC/Mile</span><p className="font-mono font-semibold text-cyan-400">${indices.fuel?.surchargePerMile?.toFixed(3)}</p></div>
                </div>
                <Badge className={cn("border-0 text-[10px]", indices.fuel?.isLive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                  {indices.fuel?.isLive ? "EIA Live" : "Default"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
