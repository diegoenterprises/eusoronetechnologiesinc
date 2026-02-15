import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Flame, BarChart3, RefreshCw,
  Search, Filter, Fuel, Wheat, Gem, Truck, ChevronDown,
  ArrowUpRight, ArrowDownRight, Minus, Activity, MapPin,
  X, ExternalLink, Loader2, Globe, Database, Zap,
} from "lucide-react";
import HotZones from "./HotZones";

// ── CATEGORY CONFIG ──
const CATEGORIES: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  Energy: { label: "Energy", icon: Flame, color: "#EF4444" },
  Metals: { label: "Metals", icon: Gem, color: "#F59E0B" },
  Agriculture: { label: "Agriculture", icon: Wheat, color: "#22C55E" },
  Freight: { label: "Freight", icon: Truck, color: "#3B82F6" },
  Fuel: { label: "Fuel", icon: Fuel, color: "#8B5CF6" },
};

// ── SPARKLINE ──
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── SIGNAL DOTS ──
function SignalDots({ signals, isLight }: { signals: { intraday: string; daily: string; weekly: string; monthly: string }; isLight: boolean }) {
  const dotColor = (s: string) => s === "UP" || s === "BULL" ? "bg-emerald-500" : s === "DOWN" || s === "BEAR" ? "bg-red-500" : isLight ? "bg-slate-300" : "bg-white/20";
  return (
    <div className="flex items-center gap-1">
      {["intraday", "daily", "weekly", "monthly"].map(k => (
        <div key={k} className={`w-1.5 h-1.5 rounded-full ${dotColor((signals as any)[k])}`} title={`${k}: ${(signals as any)[k]}`} />
      ))}
    </div>
  );
}

// ── FORMAT HELPERS ──
function fmtPrice(price: number | string | undefined, unit: string): string {
  const p = Number(price) || 0;
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 10) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(4);
}

function fmtChange(val: number | string | undefined, pct: number | string | undefined): { text: string; color: string; Icon: typeof TrendingUp } {
  const p = Number(pct) || 0;
  if (p > 0) return { text: `+${p.toFixed(2)}%`, color: "text-emerald-500", Icon: TrendingUp };
  if (p < 0) return { text: `${p.toFixed(2)}%`, color: "text-red-400", Icon: TrendingDown };
  return { text: "0.00%", color: "text-white/40", Icon: Minus };
}

export default function MarketPricing() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeView, setActiveView] = useState<"rates" | "hotzones">("rates");
  const [activeCategory, setActiveCategory] = useState("All Markets");
  const [search, setSearch] = useState("");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedQuoteSymbol, setSelectedQuoteSymbol] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search input for API calls (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isLoading, refetch } = trpc.marketPricing.getCommodities.useQuery(
    { category: activeCategory !== "All Markets" ? activeCategory : undefined, search: search || undefined },
    { refetchInterval: 15000 }
  );

  const { data: intel } = trpc.marketPricing.getMarketIntelligence.useQuery(undefined, { refetchInterval: 30000 });

  // Universal ticker search — calls searchCommodity which queries CommodityPriceAPI + local
  const searchQuery = (trpc as any).marketPricing?.searchCommodity?.useQuery?.(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length >= 2, staleTime: 30000, retry: 1 }
  );
  const searchResults = searchQuery?.data?.results || [];
  const searchTotalApi = searchQuery?.data?.totalApi || 0;

  // Quote detail for selected symbol
  const quoteQuery = (trpc as any).marketPricing?.getQuote?.useQuery?.(
    { symbol: selectedQuoteSymbol || "" },
    { enabled: !!selectedQuoteSymbol, staleTime: 15000 }
  );
  const quoteData = quoteQuery?.data;

  const commodities = data?.commodities || [];
  const breadth = data?.marketBreadth;
  const gainers = data?.topGainers || [];
  const losers = data?.topLosers || [];
  const isLive = data?.isLiveData || false;
  const source = data?.source || "Loading...";

  const categories = ["All Markets", ...Object.keys(CATEGORIES)];

  return (
    <div className={`min-h-screen ${isLight ? "bg-slate-50" : "bg-[#0a0a0f]"}`}>
      {/* ── HEADER — frosted glass ── */}
      <div className={`sticky top-0 z-30 backdrop-blur-2xl border-b ${isLight ? "bg-white/80 border-slate-200/60" : "bg-[#0a0a0f]/80 border-white/[0.04]"}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          {/* Top row: title + controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center shadow-lg shadow-[#1473FF]/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Market Intelligence</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/40"}`}>{source}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div ref={searchRef} className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? "text-slate-400" : "text-white/30"}`} />
                <input
                  type="text" value={search}
                  onChange={e => { setSearch(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => { if (search.length >= 2) setShowSearchResults(true); }}
                  placeholder="Search any ticker, stock, or commodity..."
                  className={`pl-9 pr-8 py-2 rounded-xl text-xs w-56 transition-all focus:w-80 outline-none ${isLight
                    ? "bg-slate-100 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#1473FF]/30"
                    : "bg-white/[0.06] text-white/80 placeholder:text-white/30 focus:bg-white/[0.1] focus:ring-1 focus:ring-[#1473FF]/30"
                  }`}
                />
                {search && (
                  <button onClick={() => { setSearch(""); setShowSearchResults(false); setSelectedQuoteSymbol(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className={`w-3 h-3 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60"}`} />
                  </button>
                )}

                {/* Universal Search Results Dropdown */}
                {showSearchResults && debouncedSearch.length >= 2 && (
                  <div className={`absolute right-0 top-full mt-2 w-96 max-h-[420px] overflow-y-auto rounded-2xl border shadow-2xl z-50 ${isLight ? "bg-white border-slate-200 shadow-slate-200/50" : "bg-[#12121a] border-white/[0.08] shadow-black/40"}`}>
                    <div className={`sticky top-0 px-4 py-2.5 border-b flex items-center justify-between ${isLight ? "bg-white/95 border-slate-100 backdrop-blur" : "bg-[#12121a]/95 border-white/[0.04] backdrop-blur"}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>
                        {searchQuery?.isLoading ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
                        {searchTotalApi > 0 && <span className="text-[#1473FF]"> · {searchTotalApi} from API</span>}
                      </span>
                      {searchQuery?.isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#1473FF]" />}
                    </div>
                    {searchResults.length === 0 && !searchQuery?.isLoading ? (
                      <div className="py-8 text-center">
                        <Search className={`w-6 h-6 mx-auto mb-2 ${isLight ? "text-slate-300" : "text-white/15"}`} />
                        <p className={`text-xs ${isLight ? "text-slate-400" : "text-white/30"}`}>No results for "{debouncedSearch}"</p>
                        <p className={`text-[10px] mt-1 ${isLight ? "text-slate-300" : "text-white/20"}`}>Try a ticker symbol like AAPL, TSLA, GC, CL</p>
                      </div>
                    ) : (
                      searchResults.map((r: any, idx: number) => (
                        <button key={`${r.symbol}-${idx}`}
                          onClick={() => { setSelectedQuoteSymbol(r.symbol); setShowSearchResults(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.04]"} ${idx > 0 ? (isLight ? "border-t border-slate-50" : "border-t border-white/[0.03]") : ""}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.source === "api" ? "bg-[#1473FF]/10" : isLight ? "bg-slate-100" : "bg-white/[0.06]"}`}>
                            {r.source === "api" ? <Globe className="w-3.5 h-3.5 text-[#1473FF]" /> : <Database className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-white/90"}`}>{r.name}</span>
                              {r.source === "api" && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#1473FF]/10 text-[#1473FF] uppercase">API</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/30"}`}>{r.symbol}</span>
                              <span className={`text-[10px] ${isLight ? "text-slate-300" : "text-white/20"}`}>·</span>
                              <span className={`text-[10px] ${isLight ? "text-slate-300" : "text-white/20"}`}>{r.category}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {r.price > 0 && <span className={`text-xs font-bold tabular-nums ${isLight ? "text-slate-800" : "text-white/80"}`}>${r.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: r.price >= 100 ? 2 : 4 })}</span>}
                            {r.changePercent !== 0 && <div className={`text-[10px] font-semibold tabular-nums ${r.changePercent > 0 ? "text-emerald-500" : "text-red-400"}`}>{r.changePercent > 0 ? "+" : ""}{Number(r.changePercent).toFixed(2)}%</div>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => refetch()}
                className={`p-2 rounded-xl transition-all ${isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Market Breadth bar */}
          {breadth && (
            <div className={`flex items-center gap-4 mt-4 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.04]"}`}>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${isLight ? "text-slate-400" : "text-white/30"}`}>Market Breadth</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(breadth.advancing / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
                <div className={`h-full transition-all duration-500 ${isLight ? "bg-slate-200" : "bg-white/10"}`} style={{ width: `${(breadth.unchanged / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
                <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(breadth.declining / (breadth.advancing + breadth.declining + breadth.unchanged)) * 100}%` }} />
              </div>
              <div className="flex items-center gap-3 text-[11px] tabular-nums">
                <span className="text-emerald-500 font-medium">+{breadth.advancing}</span>
                <span className={isLight ? "text-slate-400" : "text-white/30"}>{breadth.unchanged}</span>
                <span className="text-red-400 font-medium">-{breadth.declining}</span>
              </div>
            </div>
          )}

          {/* View toggle: Rates vs Hot Zones */}
          <div className="flex items-center gap-1 mt-3">
            <button onClick={() => setActiveView("rates")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeView === "rates"
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-[#1473FF]/25"
                  : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"
              }`}>
              <BarChart3 className="w-3.5 h-3.5" /> Rates & Commodities
            </button>
            <button onClick={() => setActiveView("hotzones")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeView === "hotzones"
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-[#1473FF]/25"
                  : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"
              }`}>
              <MapPin className="w-3.5 h-3.5" /> Hot Zones
            </button>
          </div>

          {/* Category tabs (only for rates view) */}
          {activeView === "rates" && <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar">
            {categories.map(cat => {
              const cfg = CATEGORIES[cat];
              const active = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${active
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm shadow-[#1473FF]/20"
                    : isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/40 hover:bg-white/[0.06]"
                  }`}>
                  {cfg && <cfg.icon className="w-3 h-3" />}
                  {cfg?.label || cat}
                </button>
              );
            })}
          </div>}
        </div>
      </div>

      {/* ── SELECTED QUOTE DETAIL CARD ── */}
      {selectedQuoteSymbol && quoteData && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className={`rounded-2xl border p-5 relative ${isLight ? "bg-white border-[#1473FF]/20 shadow-lg shadow-[#1473FF]/5" : "bg-white/[0.04] border-[#1473FF]/30 shadow-lg shadow-[#1473FF]/5"}`}>
            <button onClick={() => setSelectedQuoteSymbol(null)} className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]"}`}>
              <X className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-white/30"}`} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center shadow-lg shadow-[#1473FF]/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{quoteData.name}</h2>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.06] text-white/40"}`}>{quoteData.symbol}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${quoteData.category === "External" ? "bg-[#1473FF]/10 text-[#1473FF]" : isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.06] text-white/40"}`}>{quoteData.category}</span>
                </div>
                <div className="flex items-end gap-4 mt-2">
                  <span className={`text-3xl font-bold tabular-nums ${isLight ? "text-slate-900" : "text-white"}`}>
                    {quoteData.price != null ? `$${Number(quoteData.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: quoteData.price >= 100 ? 2 : 4 })}` : "N/A"}
                  </span>
                  <span className={`text-[10px] mb-1 ${isLight ? "text-slate-400" : "text-white/30"}`}>{quoteData.unit}</span>
                  {quoteData.changePercent !== 0 && (
                    <span className={`text-sm font-bold tabular-nums mb-0.5 ${quoteData.changePercent > 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {quoteData.changePercent > 0 ? "+" : ""}{Number(quoteData.changePercent).toFixed(2)}%
                    </span>
                  )}
                </div>
                {/* Detail grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
                  {[
                    { label: "Open", value: quoteData.open },
                    { label: "High", value: quoteData.high },
                    { label: "Low", value: quoteData.low },
                    { label: "Prev Close", value: quoteData.previousClose },
                    { label: "Volume", value: quoteData.volume },
                    { label: "Change", value: quoteData.change },
                  ].map(d => (
                    <div key={d.label}>
                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isLight ? "text-slate-400" : "text-white/25"}`}>{d.label}</p>
                      <p className={`text-xs font-semibold tabular-nums mt-0.5 ${isLight ? "text-slate-700" : "text-white/70"}`}>
                        {typeof d.value === "number" ? (d.value >= 100 ? d.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(d.value).toFixed(4)) : d.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Source badges */}
                {quoteData.sources && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[9px] uppercase tracking-wider font-medium ${isLight ? "text-slate-400" : "text-white/25"}`}>Sources:</span>
                    {quoteData.sources.commodityPriceAPI && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#1473FF]/10 text-[#1473FF]">CommodityPriceAPI ${Number(quoteData.sources.commodityPriceAPI).toFixed(2)}</span>}
                    {quoteData.sources.yahooFinance && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400">Yahoo ${Number(quoteData.sources.yahooFinance).toFixed(2)}</span>}
                    {quoteData.sources.fredEia && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">FRED/EIA ${Number(quoteData.sources.fredEia).toFixed(2)}</span>}
                    {quoteData.sources.seed && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.06] text-white/30"}`}>Seed ${Number(quoteData.sources.seed).toFixed(2)}</span>}
                    <span className={`text-[10px] ml-auto ${isLight ? "text-slate-400" : "text-white/20"}`}>Best: {quoteData.bestSource}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── HOT ZONES VIEW ── */}
      {activeView === "hotzones" && <HotZones />}

      {/* ── RATES MAIN BODY ── */}
      {activeView === "rates" && (
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-[#1473FF]/30 border-t-[#1473FF] animate-spin" />
          </div>
        ) : (
          <>
            {/* Commodity cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {commodities.map((c: any, idx: number) => {
                const ch = fmtChange(c.change, c.changePercent);
                const isExpanded = expandedSymbol === c.symbol;
                const sparkColor = c.changePercent >= 0 ? "#22c55e" : "#ef4444";
                const catCfg = CATEGORIES[c.category];
                return (
                  <motion.div
                    key={c.symbol}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setExpandedSymbol(isExpanded ? null : c.symbol)}
                    className={`group relative cursor-pointer rounded-2xl border transition-all duration-300 ${isExpanded
                      ? isLight ? "border-[#1473FF]/30 bg-white shadow-xl shadow-[#1473FF]/10 ring-1 ring-[#1473FF]/20" : "border-[#1473FF]/40 bg-white/[0.06] shadow-xl shadow-[#1473FF]/10 ring-1 ring-[#1473FF]/20"
                      : isLight ? "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg" : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1]"
                    }`}
                  >
                    <div className="p-4">
                      {/* Top row: name + symbol */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-semibold tracking-tight truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                              {c.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/30"}`}>{c.symbol}</span>
                            {catCfg && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: catCfg.color + "15", color: catCfg.color }}>
                                {c.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <Sparkline data={c.sparkline} color={sparkColor} width={64} height={24} />
                      </div>

                      {/* Price + change */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className={`text-xl font-bold tabular-nums tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                            {fmtPrice(c.price, c.unit)}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isLight ? "text-slate-400" : "text-white/30"}`}>{c.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${ch.color}`}>
                            <ch.Icon className="w-3.5 h-3.5" />
                            {ch.text}
                          </div>
                          <SignalDots signals={{ intraday: c.intraday, daily: c.daily, weekly: c.weekly, monthly: c.monthly }} isLight={isLight} />
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className={`mt-3 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.06]"}`}>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: "Open", value: fmtPrice(c.open, c.unit) },
                                  { label: "Prev Close", value: fmtPrice(c.previousClose, c.unit) },
                                  { label: "High", value: fmtPrice(c.high, c.unit) },
                                  { label: "Low", value: fmtPrice(c.low, c.unit) },
                                  { label: "Volume", value: c.volume },
                                  { label: "Change", value: `${Number(c.change) >= 0 ? "+" : ""}${Number(c.change || 0).toFixed(Number(c.price) >= 100 ? 2 : 4)}` },
                                ].map(row => (
                                  <div key={row.label} className="flex items-center justify-between">
                                    <span className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>{row.label}</span>
                                    <span className={`text-xs font-semibold tabular-nums ${isLight ? "text-slate-700" : "text-white/80"}`}>{row.value}</span>
                                  </div>
                                ))}
                              </div>
                              <div className={`flex items-center gap-2 mt-3 text-[10px] ${isLight ? "text-slate-400" : "text-white/20"}`}>
                                <Activity className="w-3 h-3" />
                                {intel?.source || source}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom accent bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${c.changePercent >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(Math.abs(c.changePercent) * 10, 100)}%`, opacity: Math.abs(c.changePercent) > 0.5 ? 0.7 : 0.2 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── TOP GAINERS + LOSERS ── */}
            {(gainers.length > 0 || losers.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {/* Gainers */}
                <div className={`rounded-2xl border p-5 ${isLight ? "bg-white border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"}`}>
                  <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? "text-slate-700" : "text-white/70"}`}>
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Gainers
                  </h2>
                  <div className="space-y-2">
                    {gainers.map((g: any) => (
                      <div key={g.symbol} className={`flex items-center justify-between py-1.5 ${isLight ? "" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-white/90"}`}>{g.name}</span>
                          <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/30"}`}>{g.symbol}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{fmtPrice(g.price, g.unit)}</span>
                          <span className="text-xs font-semibold tabular-nums text-emerald-500">+{Number(g.changePercent || 0).toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                <div className={`rounded-2xl border p-5 ${isLight ? "bg-white border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"}`}>
                  <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? "text-slate-700" : "text-white/70"}`}>
                    <TrendingDown className="w-4 h-4 text-red-400" /> Top Losers
                  </h2>
                  <div className="space-y-2">
                    {losers.map((l: any) => (
                      <div key={l.symbol} className={`flex items-center justify-between py-1.5 ${isLight ? "" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-white/90"}`}>{l.name}</span>
                          <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/30"}`}>{l.symbol}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{fmtPrice(l.price, l.unit)}</span>
                          <span className="text-xs font-semibold tabular-nums text-red-400">{Number(l.changePercent || 0).toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
