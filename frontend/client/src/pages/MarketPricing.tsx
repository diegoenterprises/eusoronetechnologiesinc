/**
 * MARKET PRICING - Bloomberg-Style Commodity Market Dashboard
 * 
 * Real-time commodity prices powered by multi-source cross-referencing engine:
 * - CommodityPriceAPI (60-sec updates, 130+ commodities) — PRIMARY
 * - Yahoo Finance (real-time futures) — SECONDARY
 * - FRED + EIA + BLS (government data) — AUTHORITATIVE
 * 
 * Features: Live search/lookup, category filters, market breadth, top movers,
 * detail panels with source verification, auto-scrolling ticker columns
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, BarChart3,
  Flame, Wheat, CircleDot, Fuel, ArrowUp, ArrowDown,
  Minus, Activity, X, ExternalLink, Layers, Radio, ChevronRight
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  Energy: Flame,
  Metals: CircleDot,
  Agriculture: Wheat,
  Freight: BarChart3,
  Fuel: Fuel,
};

const CATEGORY_HEADER_COLORS: Record<string, string> = {
  Energy: "bg-gradient-to-r from-orange-600 to-red-600",
  Metals: "bg-gradient-to-r from-amber-600 to-yellow-600",
  Agriculture: "bg-gradient-to-r from-emerald-600 to-green-600",
  Freight: "bg-gradient-to-r from-blue-600 to-cyan-600",
  Fuel: "bg-gradient-to-r from-purple-600 to-violet-600",
};

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-70">
      <polyline points={points} fill="none" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TrendDot({ dir }: { dir: string }) {
  const color = dir === "UP" || dir === "BULL" ? "bg-emerald-400" : dir === "DOWN" || dir === "BEAR" ? "bg-red-400" : "bg-slate-500";
  const label = dir === "BULL" ? "B" : dir === "BEAR" ? "B" : dir === "UP" ? "↑" : dir === "DOWN" ? "↓" : "—";
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold text-white ${color}`} title={dir}>
      {label}
    </span>
  );
}

function DirectionBadge({ dir }: { dir: string }) {
  if (dir === "UP" || dir === "BULL") {
    return <span className="inline-flex items-center justify-center w-[52px] px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/90 text-white">
      {dir === "BULL" ? "BULL" : "UP"}
    </span>;
  }
  if (dir === "DOWN" || dir === "BEAR") {
    return <span className="inline-flex items-center justify-center w-[52px] px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/90 text-white">
      {dir === "BEAR" ? "BEAR" : "DOWN"}
    </span>;
  }
  return <span className="inline-flex items-center justify-center w-[52px] px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-600 text-slate-300">FLAT</span>;
}

function formatPrice(price: number | string | undefined | null): string {
  const p = Number(price);
  if (!isFinite(p)) return "—";
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 10) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(4);
}

export default function MarketPricing() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const lookupRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch, isRefetching } = trpc.marketPricing.getCommodities.useQuery(
    {
      category: activeCategory !== "ALL" ? activeCategory : undefined,
      search: searchQuery || undefined,
    },
    { refetchInterval: 60000 }
  );

  const intelQuery = trpc.marketPricing.getMarketIntelligence.useQuery(undefined, {
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Live search/lookup via CommodityPriceAPI
  const lookupResults = (trpc as any).marketPricing?.searchCommodity?.useQuery(
    { query: lookupQuery },
    { enabled: lookupQuery.length >= 2, staleTime: 30000 }
  );

  // Detail panel for selected commodity (cross-referenced from all sources)
  const quoteQuery = (trpc as any).marketPricing?.getQuote?.useQuery(
    { symbol: selectedCommodity },
    { enabled: !!selectedCommodity, staleTime: 30000 }
  );

  const intel = intelQuery.data;
  const liveOverrides: Record<string, any> = (intel?.liveOverrides as Record<string, any>) || {};

  const rawCommodities = data?.commodities || [];
  const commodities = useMemo(() => {
    return rawCommodities.map((c: any) => {
      const override = liveOverrides[c.symbol as string];
      if (override) {
        const newPrice = override.price ?? c.price;
        const newChangePct = override.changePercent ?? c.changePercent;
        return {
          ...c,
          price: newPrice,
          change: override.change ?? c.change,
          changePercent: newChangePct,
          intraday: newChangePct > 0 ? "BULL" : newChangePct < 0 ? "BEAR" : "FLAT",
          daily: newChangePct > 0 ? "UP" : newChangePct < 0 ? "DOWN" : "FLAT",
        };
      }
      return c;
    });
  }, [rawCommodities, liveOverrides]);

  const categories = data?.categories || [];
  const total = commodities.length;
  const breadth = useMemo(() => ({
    advancing: commodities.filter((c: any) => c.changePercent > 0).length,
    declining: commodities.filter((c: any) => c.changePercent < 0).length,
    unchanged: commodities.filter((c: any) => c.changePercent === 0).length,
  }), [commodities]);
  const gainers = useMemo(() => [...commodities].sort((a: any, b: any) => b.changePercent - a.changePercent).slice(0, 5), [commodities]);
  const losers = useMemo(() => [...commodities].sort((a: any, b: any) => a.changePercent - b.changePercent).slice(0, 5), [commodities]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    commodities.forEach((c: any) => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, [commodities]);

  const selected = commodities.find((c: any) => c.symbol === selectedCommodity);
  const quoteData = quoteQuery?.data;

  // Close lookup dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (lookupRef.current && !lookupRef.current.contains(e.target as Node)) setShowLookup(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLookupSelect = useCallback((sym: string) => {
    setSelectedCommodity(sym);
    setShowLookup(false);
    setLookupQuery("");
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-page-enter">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-3">
            Market Pricing
          </h1>
          <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">Commodity & freight rate intelligence — multi-source real-time data</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search within loaded commodities */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter..."
              className="pl-8 h-8 w-32 text-xs bg-slate-800 dark:bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>
          {/* Live Lookup via CommodityPriceAPI */}
          <div className="relative" ref={lookupRef}>
            <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={lookupQuery}
              onChange={(e) => { setLookupQuery(e.target.value); setShowLookup(true); }}
              onFocus={() => lookupQuery.length >= 2 && setShowLookup(true)}
              placeholder="Search any commodity..."
              className="pl-8 h-8 w-52 text-xs bg-slate-800 dark:bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
            {lookupQuery && (
              <button onClick={() => { setLookupQuery(""); setShowLookup(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-slate-500 hover:text-white" />
              </button>
            )}
            {/* Lookup Dropdown */}
            {showLookup && lookupQuery.length >= 2 && (
              <div className="absolute top-full mt-1 left-0 w-80 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50">
                {lookupResults?.isLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500">Searching CommodityPriceAPI...</div>
                ) : lookupResults?.data?.results?.length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] text-slate-500 font-semibold border-b border-slate-800 flex justify-between">
                      <span>{lookupResults.data.totalLocal} local · {lookupResults.data.totalApi} API</span>
                      <span>Click to view</span>
                    </div>
                    {lookupResults.data.results.map((r: any) => (
                      <button
                        key={r.symbol}
                        onClick={() => handleLookupSelect(r.symbol)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white">{r.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">{r.symbol}</span>
                          {r.source === "api" && <span className="text-[9px] text-purple-400 ml-1">[API]</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.price > 0 && <span className="text-xs font-bold text-white">{formatPrice(r.price)}</span>}
                          {r.changePercent !== 0 && (
                            <span className={`text-[10px] font-bold ${r.changePercent > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {r.changePercent > 0 ? "+" : ""}{Number(r.changePercent).toFixed(2)}%
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No results for "{lookupQuery}"</div>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetch(); intelQuery.refetch(); }} disabled={isRefetching}
            className="bg-slate-800 dark:bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── DATA SOURCE BANNER ─────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${intel?.isLive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
        <div className="flex items-center gap-2">
          <Radio className={`w-3 h-3 ${intel?.isLive ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${intel?.isLive ? "text-emerald-400" : "text-amber-400"}`}>
            {intel?.isLive ? "LIVE" : "SEED"}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 truncate">{intel?.source || data?.source || "Loading..."}</span>
        {data?.isLiveData && (
          <span className="text-[10px] text-slate-600 ml-auto flex-shrink-0">Updated {new Date(data.lastUpdated).toLocaleTimeString()}</span>
        )}
        {intel?.isLive && intel.dieselByRegion?.length > 0 && (
          <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0 hidden md:inline">
            Diesel: {intel.dieselByRegion.map((r: any) => `${r.regionName} $${r.price}`).join(" · ")}
          </span>
        )}
      </div>

      {/* ── MARKET BREADTH ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-slate-800/50 dark:bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">MARKET BREADTH</span>
        </div>
        <div className="flex-1 flex items-center h-3 rounded-full overflow-hidden bg-slate-700">
          <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${(breadth.advancing / (total || 1)) * 100}%` }} />
          <div className="h-full bg-slate-500 transition-all" style={{ width: `${(breadth.unchanged / (total || 1)) * 100}%` }} />
          <div className="h-full bg-red-500 rounded-r-full transition-all" style={{ width: `${(breadth.declining / (total || 1)) * 100}%` }} />
        </div>
        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="text-emerald-400 font-bold flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />{breadth.advancing}</span>
          <span className="text-slate-400 font-bold flex items-center gap-0.5"><Minus className="w-3 h-3" />{breadth.unchanged}</span>
          <span className="text-red-400 font-bold flex items-center gap-0.5"><ArrowDown className="w-3 h-3" />{breadth.declining}</span>
        </div>
      </div>

      {/* ── CATEGORY TABS ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap
            ${activeCategory === "ALL" ? "bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 text-white border border-[#1473FF]/30" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
        >
          All Markets
        </button>
        {categories.map((cat: string) => {
          const Icon = CATEGORY_ICONS[cat] || BarChart3;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5
                ${activeCategory === cat ? "bg-white/15 text-white border border-white/20" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-96 bg-slate-700 rounded-xl" />)}
        </div>
      ) : activeCategory === "ALL" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {Object.entries(grouped).map(([cat, items]) => {
            const Icon = CATEGORY_ICONS[cat] || BarChart3;
            const scrollDuration = Math.max(14, items.length * 7);
            const renderCard = (c: any, keyPrefix = "") => {
              const isUp = c.changePercent > 0;
              const isDown = c.changePercent < 0;
              const isSelected = selectedCommodity === c.symbol;
              return (
                <div
                  key={`${keyPrefix}${c.symbol}`}
                  onClick={() => setSelectedCommodity(isSelected ? null : c.symbol)}
                  className={`px-3 py-3 cursor-pointer transition-all hover:bg-white/5 border-b border-slate-800/30
                    ${isSelected ? "bg-white/10 ring-1 ring-inset ring-[#1473FF]/40" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-white block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.symbol}</span>
                    </div>
                    <MiniSparkline data={c.sparkline} positive={isUp} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-white tabular-nums">{formatPrice(c.price)}</span>
                    <span className={`text-xs font-bold tabular-nums ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-slate-400"}`}>
                      {isUp ? "+" : ""}{Number(c.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendDot dir={c.intraday} />
                      <TrendDot dir={c.daily} />
                      <TrendDot dir={c.weekly} />
                      <TrendDot dir={c.monthly} />
                    </div>
                    <span className="text-[8px] text-slate-600 tracking-wider">I · D · W · M</span>
                  </div>
                </div>
              );
            };
            return (
              <div key={cat} className="space-y-0 rounded-xl overflow-hidden border border-slate-700/40">
                <div className={`px-3 py-2.5 ${CATEGORY_HEADER_COLORS[cat] || "bg-slate-600"} flex items-center gap-2`}>
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-[11px] font-bold text-white tracking-wide uppercase">{cat}</span>
                  <span className="text-[10px] text-white/50 ml-auto">{items.length}</span>
                </div>
                <div className="bg-slate-900/50 dark:bg-slate-900/50 overflow-hidden h-[440px] relative group">
                  <div
                    className="animate-market-scroll group-hover:[animation-play-state:paused]"
                    style={{ animationDuration: `${scrollDuration}s` }}
                  >
                    {items.map((c: any) => renderCard(c))}
                    {items.map((c: any) => renderCard(c, "dup-"))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single Category Table View */
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${CATEGORY_HEADER_COLORS[activeCategory] || "bg-slate-700"}`}>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-white/90">Symbol</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-white/90">Name</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold text-white/90">Price</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold text-white/90">Chg %</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-white/90">Intraday</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-white/90">Daily</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-white/90">Weekly</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-white/90">Monthly</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-white/90">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {commodities.map((c: any) => {
                const isUp = c.changePercent > 0;
                const isDown = c.changePercent < 0;
                return (
                  <tr key={c.symbol} className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedCommodity(selectedCommodity === c.symbol ? null : c.symbol)}>
                    <td className="px-4 py-3 text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{c.symbol}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right tabular-nums">{formatPrice(c.price)} <span className="text-[10px] text-slate-500">{c.unit}</span></td>
                    <td className={`px-4 py-3 text-sm font-bold text-right tabular-nums ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-slate-400"}`}>
                      {isUp ? "+" : ""}{Number(c.changePercent || 0).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center"><DirectionBadge dir={c.intraday} /></td>
                    <td className="px-4 py-3 text-center"><DirectionBadge dir={c.daily} /></td>
                    <td className="px-4 py-3 text-center"><DirectionBadge dir={c.weekly} /></td>
                    <td className="px-4 py-3 text-center"><DirectionBadge dir={c.monthly} /></td>
                    <td className="px-4 py-3 text-center"><MiniSparkline data={c.sparkline} positive={isUp} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DETAIL PANEL ───────────────────────────────────────────── */}
      {selected && (
        <Card className="bg-slate-800/50 dark:bg-slate-800/50 border-slate-700/50 rounded-2xl animate-fade-in-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-3">
                  {selected.name}
                  <Badge className="text-[10px] bg-slate-700 text-cyan-400 border-slate-600">{selected.symbol}</Badge>
                  <Badge className={`text-[10px] border ${selected.changePercent > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : selected.changePercent < 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                    {selected.changePercent > 0 ? "+" : ""}{Number(selected.changePercent || 0).toFixed(2)}%
                  </Badge>
                </CardTitle>
                <p className="text-slate-500 text-xs mt-1">{selected.category} · {selected.unit} · Vol: {selected.volume}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white tabular-nums">{formatPrice(selected.price)}</p>
                <p className={`text-sm font-bold tabular-nums ${selected.change > 0 ? "text-emerald-400" : selected.change < 0 ? "text-red-400" : "text-slate-400"}`}>
                  {selected.change > 0 ? "+" : ""}{Number(selected.change || 0).toFixed(selected.price > 100 ? 2 : 4)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "Open", value: formatPrice(selected.open) },
                { label: "High", value: formatPrice(selected.high), color: "text-emerald-400" },
                { label: "Low", value: formatPrice(selected.low), color: "text-red-400" },
                { label: "Prev Close", value: formatPrice(selected.previousClose) },
                { label: "Intraday", badge: selected.intraday },
                { label: "Daily", badge: selected.daily },
                { label: "Weekly", badge: selected.weekly },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">{item.label}</p>
                  {item.badge ? <DirectionBadge dir={item.badge} /> : <p className={`text-sm font-bold tabular-nums ${item.color || "text-white"}`}>{item.value}</p>}
                </div>
              ))}
            </div>
            {/* Source Cross-Reference Panel */}
            {quoteData?.sources && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 border border-[#1473FF]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-3.5 h-3.5 text-[#1473FF]" />
                  <span className="text-[10px] font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent uppercase tracking-wider">Cross-Reference Sources</span>
                  <Badge className="text-[9px] bg-slate-700 border-slate-600 text-white ml-auto">{quoteData.bestSource}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "CommodityPriceAPI", value: quoteData.sources.commodityPriceAPI, color: "text-purple-400" },
                    { label: "Yahoo Finance", value: quoteData.sources.yahooFinance, color: "text-blue-400" },
                    { label: "FRED / EIA", value: quoteData.sources.fredEia, color: "text-emerald-400" },
                    { label: "Seed Data", value: quoteData.sources.seed, color: "text-slate-400" },
                  ].map(src => (
                    <div key={src.label} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-[10px] text-slate-500">{src.label}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${src.value ? src.color : "text-slate-700"}`}>
                        {src.value ? formatPrice(src.value) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TOP MOVERS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 dark:bg-slate-800/50 border-slate-700/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {gainers.map((c: any) => (
              <div key={c.symbol} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                onClick={() => setSelectedCommodity(c.symbol)}>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{c.symbol}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold text-white tabular-nums">{formatPrice(c.price)}</span>
                  <span className="text-xs font-bold text-emerald-400 w-16 text-right tabular-nums">+{Number(c.changePercent || 0).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 dark:bg-slate-800/50 border-slate-700/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {losers.map((c: any) => (
              <div key={c.symbol} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors cursor-pointer"
                onClick={() => setSelectedCommodity(c.symbol)}>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{c.symbol}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold text-white tabular-nums">{formatPrice(c.price)}</span>
                  <span className="text-xs font-bold text-red-400 w-16 text-right tabular-nums">{Number(c.changePercent || 0).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
