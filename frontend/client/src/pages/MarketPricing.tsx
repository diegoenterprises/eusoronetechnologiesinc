/**
 * MARKET PRICING - Bloomberg-Style Commodity Market Dashboard
 * 
 * Real-time commodity prices for freight & energy logistics:
 * - Energy: Crude Oil, Natural Gas, Diesel, Gasoline, Heating Oil
 * - Metals: Gold, Silver, Copper, Aluminum, Steel, Nickel
 * - Agriculture: Corn, Soybeans, Wheat, Cotton, Sugar, Coffee, Cattle, Lumber
 * - Freight Indices: Dry Van, Reefer, Flatbed, Tanker, Hazmat, Oversize
 * - Fuel Index: DOE Diesel, DEF, Fuel Surcharge
 * 
 * Color-coded cells (green=up, red=down), mini sparklines, intraday/daily/weekly/monthly trends
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, BarChart3,
  Flame, Droplets, Wheat, CircleDot, Fuel, ArrowUp, ArrowDown,
  Minus, DollarSign, Activity, Zap
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  Energy: Flame,
  Metals: CircleDot,
  Agriculture: Wheat,
  Freight: BarChart3,
  Fuel: Fuel,
};

const CATEGORY_COLORS: Record<string, string> = {
  Energy: "from-orange-500/20 to-red-500/20 border-orange-500/30",
  Metals: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  Agriculture: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  Freight: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  Fuel: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
};

const CATEGORY_HEADER_COLORS: Record<string, string> = {
  Energy: "bg-orange-600",
  Metals: "bg-yellow-600",
  Agriculture: "bg-green-600",
  Freight: "bg-blue-600",
  Fuel: "bg-purple-600",
};

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
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
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = trpc.marketPricing.getCommodities.useQuery(
    {
      category: activeCategory !== "ALL" ? activeCategory : undefined,
      search: searchQuery || undefined,
    },
    { refetchInterval: 60000 }
  );

  // Live government data feed (FRED, EIA, BLS)
  const intelQuery = trpc.marketPricing.getMarketIntelligence.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const intel = intelQuery.data;
  const liveOverrides: Record<string, any> = (intel?.liveOverrides as Record<string, any>) || {};

  // Merge seed commodities with live data overrides
  const rawCommodities = data?.commodities || [];
  const commodities = useMemo(() => {
    return rawCommodities.map((c: any) => {
      const override = liveOverrides[c.symbol as string];
      if (override) {
        const newPrice = override.price ?? c.price;
        const newChange = override.change ?? c.change;
        const newChangePct = override.changePercent ?? c.changePercent;
        return {
          ...c,
          price: newPrice,
          change: newChange,
          changePercent: newChangePct,
          intraday: newChangePct > 0 ? "BULL" : newChangePct < 0 ? "BEAR" : "FLAT",
          daily: newChangePct > 0 ? "UP" : newChangePct < 0 ? "DOWN" : "FLAT",
        };
      }
      return c;
    });
  }, [rawCommodities, liveOverrides]);

  const categories = data?.categories || [];
  const breadth = useMemo(() => ({
    advancing: commodities.filter((c: any) => c.changePercent > 0).length,
    declining: commodities.filter((c: any) => c.changePercent < 0).length,
    unchanged: commodities.filter((c: any) => c.changePercent === 0).length,
  }), [commodities]);
  const gainers = useMemo(() => [...commodities].sort((a: any, b: any) => b.changePercent - a.changePercent).slice(0, 5), [commodities]);
  const losers = useMemo(() => [...commodities].sort((a: any, b: any) => a.changePercent - b.changePercent).slice(0, 5), [commodities]);

  // Group commodities by category for the column layout
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    commodities.forEach((c: any) => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, [commodities]);

  const selected = commodities.find((c: any) => c.symbol === selectedCommodity);

  return (
    <div className="p-4 md:p-6 space-y-5 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            Market Pricing
          </h1>
          <p className="text-slate-400 text-sm mt-1">Commodity & freight rate intelligence — real-time market data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commodity..."
              className="pl-8 h-8 w-48 text-xs bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetch(); intelQuery.refetch(); }} disabled={isRefetching}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Source Indicator */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${intel?.isLive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
        <div className={`w-2 h-2 rounded-full ${intel?.isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
        <span className={`text-[10px] font-bold ${intel?.isLive ? "text-emerald-400" : "text-amber-400"}`}>
          {intel?.isLive ? "LIVE" : "SEED"}
        </span>
        <span className="text-[10px] text-slate-500 truncate">{intel?.source || "Loading..."}</span>
        {intel?.isLive && intel.dieselByRegion?.length > 0 && (
          <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0">
            Diesel: {intel.dieselByRegion.map((r: any) => `${r.regionName} $${r.price}`).join(" · ")}
          </span>
        )}
      </div>

      {/* Market Breadth Bar */}
      {breadth && (
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">MARKET BREADTH</span>
          </div>
          <div className="flex-1 flex items-center gap-1 h-2.5 rounded-full overflow-hidden bg-slate-700">
            <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${(breadth.advancing / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
            <div className="h-full bg-slate-500 transition-all" style={{ width: `${(breadth.unchanged / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
            <div className="h-full bg-red-500 rounded-r-full transition-all" style={{ width: `${(breadth.declining / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1"><ArrowUp className="w-3 h-3" />{breadth.advancing}</span>
            <span className="text-slate-400 font-bold flex items-center gap-1"><Minus className="w-3 h-3" />{breadth.unchanged}</span>
            <span className="text-red-400 font-bold flex items-center gap-1"><ArrowDown className="w-3 h-3" />{breadth.declining}</span>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap
            ${activeCategory === "ALL" ? "bg-white/15 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
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
                ${activeCategory === cat ? "bg-white/15 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Columns by Category (Bloomberg-style, auto-scrolling) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-96 bg-slate-700 rounded-xl" />)}
        </div>
      ) : activeCategory === "ALL" ? (
        /* Category Columns View — continuous vertical scroll */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {Object.entries(grouped).map(([cat, items]) => {
            const Icon = CATEGORY_ICONS[cat] || BarChart3;
            const scrollDuration = Math.max(12, items.length * 6);
            const renderCard = (c: any, keyPrefix = "") => {
              const isUp = c.changePercent > 0;
              const isSelected = selectedCommodity === c.symbol;
              return (
                <div
                  key={`${keyPrefix}${c.symbol}`}
                  onClick={() => setSelectedCommodity(isSelected ? null : c.symbol)}
                  className={`px-3 py-2.5 cursor-pointer transition-all hover:bg-white/5 border-b border-slate-800/50
                    ${isSelected ? "bg-white/10 ring-1 ring-inset ring-cyan-500/30" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.symbol}</span>
                    </div>
                    <MiniSparkline data={c.sparkline} positive={isUp} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{formatPrice(c.price)}</span>
                    <span className={`text-xs font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? "+" : ""}{Number(c.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <DirectionBadge dir={c.intraday} />
                    <DirectionBadge dir={c.daily} />
                    <DirectionBadge dir={c.weekly} />
                    <DirectionBadge dir={c.monthly} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-slate-600">Intraday</span>
                    <span className="text-[9px] text-slate-600">Daily</span>
                    <span className="text-[9px] text-slate-600">Weekly</span>
                    <span className="text-[9px] text-slate-600">Monthly</span>
                  </div>
                </div>
              );
            };
            return (
              <div key={cat} className="space-y-0">
                {/* Category Header */}
                <div className={`px-3 py-2 rounded-t-xl ${CATEGORY_HEADER_COLORS[cat] || "bg-slate-600"} flex items-center gap-2`}>
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase">{cat}</span>
                  <span className="text-[10px] text-white/60 ml-auto">{items.length}</span>
                </div>
                {/* Auto-scrolling commodity rows */}
                <div className="border border-slate-700/50 border-t-0 rounded-b-xl overflow-hidden h-[420px] relative group">
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
                return (
                  <tr key={c.symbol} className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedCommodity(selectedCommodity === c.symbol ? null : c.symbol)}>
                    <td className="px-4 py-3 text-xs font-bold text-cyan-400">{c.symbol}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatPrice(c.price)} <span className="text-[10px] text-slate-500">{c.unit}</span></td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${isUp ? "text-emerald-400" : "text-red-400"}`}>
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

      {/* Detail Panel for Selected Commodity */}
      {selected && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl animate-fade-in-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-3">
                  {selected.name}
                  <Badge className="text-[10px] bg-slate-700 text-cyan-400 border-slate-600">{selected.symbol}</Badge>
                  <Badge className={`text-[10px] border ${selected.changePercent > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                    {selected.changePercent > 0 ? "+" : ""}{Number(selected.changePercent || 0).toFixed(2)}%
                  </Badge>
                </CardTitle>
                <p className="text-slate-500 text-xs mt-1">{selected.category} · {selected.unit} · Vol: {selected.volume}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{formatPrice(selected.price)}</p>
                <p className={`text-sm font-bold ${selected.change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {selected.change > 0 ? "+" : ""}{Number(selected.change || 0).toFixed(selected.price > 100 ? 2 : 4)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  {item.badge ? (
                    <DirectionBadge dir={item.badge} />
                  ) : (
                    <p className={`text-sm font-bold ${item.color || "text-white"}`}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Movers: Gainers + Losers side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
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
                <div>
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{c.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">{formatPrice(c.price)}</span>
                  <span className="text-xs font-bold text-emerald-400 w-16 text-right">+{Number(c.changePercent || 0).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
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
                <div>
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{c.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">{formatPrice(c.price)}</span>
                  <span className="text-xs font-bold text-red-400 w-16 text-right">{Number(c.changePercent || 0).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
