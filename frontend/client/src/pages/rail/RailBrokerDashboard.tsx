/**
 * RAIL BROKER DASHBOARD — Brokerage Command Center
 * A rail broker matches shippers with railroad carriers.
 * Market rates, available capacity, shipment bidding, commission tracking,
 * carrier network, and intermodal opportunities.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  MapPin,
  Train,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Gavel,
  Users,
  Building2,
  BarChart3,
  Flame,
  Globe,
  Container,
  Truck,
  ArrowUpRight,
  Activity,
  Star,
  Shield,
  FileText,
  Percent,
  RefreshCw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface MarketListing {
  id: string;
  originYard: string;
  originCity: string;
  destYard: string;
  destCity: string;
  commodity: string;
  carType: string;
  carCount: number;
  rateMin: number;
  rateMax: number;
  deadline: string;
  railroad: string;
  region: string;
  postedAt: string;
  urgency: "normal" | "hot" | "critical";
}

interface Bid {
  id: string;
  listingId: string;
  route: string;
  commodity: string;
  bidAmount: number;
  carCount: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  submittedAt: string;
  respondedAt?: string;
}

interface Carrier {
  id: string;
  name: string;
  classType: "I" | "II" | "III";
  territory: string[];
  agreementsOnFile: number;
  onTimeRate: number;
  activeShipments: number;
}

interface Commission {
  lane: string;
  railroad: string;
  amount: number;
  status: "paid" | "pending" | "processing";
  date: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data (replaced by tRPC queries when endpoints exist)          */
/* ------------------------------------------------------------------ */
const MOCK_LISTINGS: MarketListing[] = [
  { id: "RL-4401", originYard: "CHI-Corwith", originCity: "Chicago, IL", destYard: "LAX-ICTF", destCity: "Los Angeles, CA", commodity: "Grain", carType: "Covered Hopper", carCount: 45, rateMin: 4200, rateMax: 4800, deadline: "2026-04-02", railroad: "BNSF", region: "West", postedAt: "2h ago", urgency: "hot" },
  { id: "RL-4402", originYard: "HOU-Englewood", originCity: "Houston, TX", destYard: "ATL-Inman", destCity: "Atlanta, GA", commodity: "Chemicals", carType: "Tank Car", carCount: 22, rateMin: 5100, rateMax: 5600, deadline: "2026-04-05", railroad: "CSX", region: "Southeast", postedAt: "4h ago", urgency: "normal" },
  { id: "RL-4403", originYard: "KC-Argentine", originCity: "Kansas City, MO", destYard: "SEA-SIG", destCity: "Seattle, WA", commodity: "Coal", carType: "Open Hopper", carCount: 110, rateMin: 3800, rateMax: 4100, deadline: "2026-04-01", railroad: "UP", region: "Northwest", postedAt: "30m ago", urgency: "critical" },
  { id: "RL-4404", originYard: "PHL-Greenwich", originCity: "Philadelphia, PA", destYard: "CHI-59th St", destCity: "Chicago, IL", commodity: "Intermodal", carType: "Well Car", carCount: 60, rateMin: 2800, rateMax: 3200, deadline: "2026-04-04", railroad: "NS", region: "Northeast", postedAt: "1h ago", urgency: "normal" },
  { id: "RL-4405", originYard: "MEM-Johnston", originCity: "Memphis, TN", destYard: "DAL-Zacha", destCity: "Dallas, TX", commodity: "Lumber", carType: "Centerbeam Flat", carCount: 30, rateMin: 3500, rateMax: 3900, deadline: "2026-04-03", railroad: "BNSF", region: "South Central", postedAt: "6h ago", urgency: "hot" },
  { id: "RL-4406", originYard: "DEN-North Yard", originCity: "Denver, CO", destYard: "STL-Dupo", destCity: "St. Louis, MO", commodity: "Autos", carType: "Autorack", carCount: 18, rateMin: 6200, rateMax: 6800, deadline: "2026-04-06", railroad: "UP", region: "Central", postedAt: "8h ago", urgency: "normal" },
];

const MOCK_BIDS: Bid[] = [
  { id: "BID-701", listingId: "RL-4390", route: "Chicago → Los Angeles", commodity: "Grain", bidAmount: 4500, carCount: 45, status: "accepted", submittedAt: "2026-03-25", respondedAt: "2026-03-26" },
  { id: "BID-702", listingId: "RL-4388", route: "Houston → Atlanta", commodity: "Chemicals", bidAmount: 5350, carCount: 22, status: "pending", submittedAt: "2026-03-28" },
  { id: "BID-703", listingId: "RL-4385", route: "KC → Seattle", commodity: "Coal", bidAmount: 3950, carCount: 110, status: "rejected", submittedAt: "2026-03-24", respondedAt: "2026-03-25" },
  { id: "BID-704", listingId: "RL-4392", route: "Memphis → Dallas", commodity: "Lumber", bidAmount: 3700, carCount: 30, status: "accepted", submittedAt: "2026-03-22", respondedAt: "2026-03-23" },
  { id: "BID-705", listingId: "RL-4395", route: "Denver → St. Louis", commodity: "Autos", bidAmount: 6500, carCount: 18, status: "pending", submittedAt: "2026-03-28" },
  { id: "BID-706", listingId: "RL-4382", route: "Philadelphia → Chicago", commodity: "Intermodal", bidAmount: 3050, carCount: 60, status: "expired", submittedAt: "2026-03-20", respondedAt: "2026-03-22" },
];

const MOCK_CARRIERS: Carrier[] = [
  { id: "C1", name: "BNSF Railway", classType: "I", territory: ["West", "Southwest", "Midwest"], agreementsOnFile: 14, onTimeRate: 92, activeShipments: 38 },
  { id: "C2", name: "Union Pacific", classType: "I", territory: ["West", "Central", "South"], agreementsOnFile: 11, onTimeRate: 89, activeShipments: 27 },
  { id: "C3", name: "CSX Transportation", classType: "I", territory: ["East", "Southeast", "Midwest"], agreementsOnFile: 9, onTimeRate: 91, activeShipments: 22 },
  { id: "C4", name: "Norfolk Southern", classType: "I", territory: ["East", "Southeast", "Midwest"], agreementsOnFile: 8, onTimeRate: 88, activeShipments: 19 },
  { id: "C5", name: "Kansas City Southern", classType: "I", territory: ["Central", "South", "Mexico"], agreementsOnFile: 5, onTimeRate: 87, activeShipments: 11 },
  { id: "C6", name: "Florida East Coast", classType: "II", territory: ["Southeast"], agreementsOnFile: 3, onTimeRate: 94, activeShipments: 6 },
  { id: "C7", name: "Montana Rail Link", classType: "II", territory: ["Northwest"], agreementsOnFile: 2, onTimeRate: 90, activeShipments: 4 },
  { id: "C8", name: "Genesee & Wyoming", classType: "III", territory: ["Northeast", "Southeast"], agreementsOnFile: 4, onTimeRate: 85, activeShipments: 8 },
];

const MOCK_COMMISSIONS: Commission[] = [
  { lane: "CHI → LAX (Grain)", railroad: "BNSF", amount: 8_640, status: "paid", date: "2026-03-25" },
  { lane: "HOU → ATL (Chemicals)", railroad: "CSX", amount: 4_718, status: "pending", date: "2026-03-28" },
  { lane: "KC → SEA (Coal)", railroad: "UP", amount: 17_380, status: "processing", date: "2026-03-27" },
  { lane: "MEM → DAL (Lumber)", railroad: "BNSF", amount: 4_440, status: "paid", date: "2026-03-23" },
  { lane: "DEN → STL (Autos)", railroad: "UP", amount: 4_680, status: "pending", date: "2026-03-28" },
  { lane: "PHL → CHI (Intermodal)", railroad: "NS", amount: 7_320, status: "paid", date: "2026-03-20" },
];

/* ------------------------------------------------------------------ */
/*  Helper: KPI stat card                                              */
/* ------------------------------------------------------------------ */
function KpiCard({ icon, label, value, subtitle, isLight, accent = "blue" }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  isLight: boolean;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/30"
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {subtitle && <div className={cn("text-xs mt-0.5 font-medium", isLight ? "text-slate-400" : "text-slate-500")}>{subtitle}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Skeleton rows                                              */
/* ------------------------------------------------------------------ */
function SkeletonRows({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Urgency badge                                              */
/* ------------------------------------------------------------------ */
function UrgencyBadge({ urgency, isLight }: { urgency: string; isLight: boolean }) {
  const map: Record<string, { cls: string; label: string }> = {
    normal: { cls: isLight ? "bg-slate-100 text-slate-600 border-slate-300" : "bg-slate-700/40 text-slate-400 border-slate-600", label: "Normal" },
    hot: { cls: "bg-amber-500/20 text-amber-500 border-amber-500/30", label: "Hot" },
    critical: { cls: "bg-red-500/20 text-red-500 border-red-500/30", label: "Urgent" },
  };
  const { cls, label } = map[urgency] || map.normal;
  return <Badge className={cn("text-[10px] border", cls)}>{urgency === "critical" && <Flame className="w-3 h-3 mr-0.5" />}{label}</Badge>;
}

/* ------------------------------------------------------------------ */
/*  Helper: Bid status badge                                           */
/* ------------------------------------------------------------------ */
const BID_STATUS_MAP: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  accepted: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-500 border-red-500/30",
  expired: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const COMMISSION_STATUS_MAP: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
};

/* ------------------------------------------------------------------ */
/*  Sub: Market Overview Hero                                          */
/* ------------------------------------------------------------------ */
function MarketOverview({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const rateTrends = [
    { commodity: "Grain", avgRate: 4_520, change: 3.2 },
    { commodity: "Chemicals", avgRate: 5_380, change: -1.4 },
    { commodity: "Coal", avgRate: 3_950, change: -5.8 },
    { commodity: "Intermodal", avgRate: 3_020, change: 6.1 },
    { commodity: "Lumber", avgRate: 3_720, change: 2.0 },
    { commodity: "Autos", avgRate: 6_480, change: 1.7 },
  ];

  const capacityByRegion = [
    { region: "West", available: 340, demand: 420, pct: 81 },
    { region: "Midwest", available: 510, demand: 480, pct: 106 },
    { region: "Southeast", available: 280, demand: 350, pct: 80 },
    { region: "Northeast", available: 190, demand: 240, pct: 79 },
    { region: "South Central", available: 220, demand: 200, pct: 110 },
  ];

  const hotLanes = [
    { route: "Chicago → Los Angeles", volume: 285, change: 12 },
    { route: "Houston → Atlanta", volume: 198, change: 8 },
    { route: "Kansas City → Seattle", volume: 176, change: -3 },
    { route: "Memphis → Dallas", volume: 152, change: 15 },
    { route: "Philadelphia → Chicago", volume: 143, change: 5 },
  ];

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <BarChart3 className="w-5 h-5 text-blue-500" /> Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Trends */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Avg $/Car by Commodity
            </h4>
            <div className="space-y-2.5">
              {rateTrends.map((r) => (
                <div key={r.commodity} className="flex items-center justify-between">
                  <span className={cn("text-sm", muted)}>{r.commodity}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", text)}>
                      ${r.avgRate.toLocaleString()}
                    </span>
                    <span className={cn(
                      "text-xs font-medium flex items-center gap-0.5",
                      r.change >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {r.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(r.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity by Region */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <Train className="w-4 h-4 text-cyan-500" /> Capacity by Region
            </h4>
            <div className="space-y-3">
              {capacityByRegion.map((c) => {
                const tight = c.pct < 85;
                return (
                  <div key={c.region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={muted}>{c.region}</span>
                      <span className={cn("font-medium", tight ? "text-amber-500" : "text-emerald-500")}>
                        {c.available} avail / {c.demand} demand
                      </span>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700/60")}>
                      <div
                        className={cn("h-full rounded-full transition-all", tight ? "bg-amber-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min(c.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hot Lanes */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <Flame className="w-4 h-4 text-orange-500" /> Hot Lanes (Weekly Volume)
            </h4>
            <div className="space-y-2.5">
              {hotLanes.map((lane, idx) => (
                <div key={lane.route} className={cn(
                  "flex items-center gap-3 p-2 rounded-lg",
                  isLight ? "bg-slate-50" : "bg-slate-700/30"
                )}>
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    idx === 0 ? "bg-amber-500/20 text-amber-500" :
                    idx === 1 ? "bg-slate-400/20 text-slate-400" :
                    idx === 2 ? "bg-orange-500/20 text-orange-500" :
                    isLight ? "bg-slate-200 text-slate-500" : "bg-slate-600 text-slate-400"
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium truncate", text)}>{lane.route}</div>
                    <div className={cn("text-xs", muted)}>{lane.volume} cars/wk</div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    lane.change >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {lane.change >= 0 ? "+" : ""}{lane.change}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub: Shipment Marketplace                                          */
/* ------------------------------------------------------------------ */
function ShipmentMarketplace({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [searchQ, setSearchQ] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterRailroad, setFilterRailroad] = useState("all");
  const [filterCarType, setFilterCarType] = useState("all");

  // In production, this would be a tRPC query
  // const listingsQuery = (trpc as any).railBroker.getMarketplaceListings.useQuery({ ... });
  const listings = MOCK_LISTINGS;
  const loading = false;

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (searchQ && !(
        l.originCity.toLowerCase().includes(searchQ.toLowerCase()) ||
        l.destCity.toLowerCase().includes(searchQ.toLowerCase()) ||
        l.commodity.toLowerCase().includes(searchQ.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQ.toLowerCase())
      )) return false;
      if (filterCommodity !== "all" && l.commodity !== filterCommodity) return false;
      if (filterRegion !== "all" && l.region !== filterRegion) return false;
      if (filterRailroad !== "all" && l.railroad !== filterRailroad) return false;
      if (filterCarType !== "all" && l.carType !== filterCarType) return false;
      return true;
    });
  }, [listings, searchQ, filterCommodity, filterRegion, filterRailroad, filterCarType]);

  const commodities = [...new Set(listings.map((l) => l.commodity))];
  const regions = [...new Set(listings.map((l) => l.region))];
  const railroads = [...new Set(listings.map((l) => l.railroad))];
  const carTypes = [...new Set(listings.map((l) => l.carType))];

  const inputCls = cn(
    "h-9 text-sm",
    isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
  );
  const selectCls = cn(
    "h-9 text-sm rounded-md border px-2 outline-none",
    isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-700/50 border-slate-600 text-white"
  );

  const handlePlaceBid = (listing: MarketListing) => {
    toast.success(`Bid dialog opened for ${listing.id}: ${listing.originCity} → ${listing.destCity}`);
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <Gavel className="w-5 h-5 text-purple-500" /> Shipment Marketplace
            <Badge className="bg-purple-500/20 text-purple-400 ml-1">{filtered.length} available</Badge>
          </CardTitle>
          <div className="relative">
            <Search className={cn("absolute left-2.5 top-2.5 w-4 h-4", muted)} />
            <Input
              placeholder="Search origin, dest, commodity..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className={cn(inputCls, "pl-8 w-64")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <Filter className={cn("w-4 h-4", muted)} />
            <span className={cn("text-xs font-medium", muted)}>Filters:</span>
          </div>
          <select className={selectCls} value={filterCommodity} onChange={(e) => setFilterCommodity(e.target.value)}>
            <option value="all">All Commodities</option>
            {commodities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={selectCls} value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            <option value="all">All Regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={selectCls} value={filterRailroad} onChange={(e) => setFilterRailroad(e.target.value)}>
            <option value="all">All Railroads</option>
            {railroads.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={selectCls} value={filterCarType} onChange={(e) => setFilterCarType(e.target.value)}>
            <option value="all">All Car Types</option>
            {carTypes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <SkeletonRows rows={5} cols={6} /> : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className={cn("text-center py-8", muted)}>No listings match your filters.</div>
            )}
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className={cn(
                  "rounded-xl border p-4 transition-all hover:scale-[1.005]",
                  listing.urgency === "critical"
                    ? isLight ? "border-red-300 bg-red-50/50" : "border-red-500/30 bg-red-500/5"
                    : listing.urgency === "hot"
                      ? isLight ? "border-amber-300 bg-amber-50/50" : "border-amber-500/30 bg-amber-500/5"
                      : isLight ? "border-slate-200 bg-white" : "border-slate-700/50 bg-slate-800/40"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Route */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-mono font-semibold", isLight ? "text-blue-600" : "text-blue-400")}>{listing.id}</span>
                      <UrgencyBadge urgency={listing.urgency} isLight={isLight} />
                      <Badge className={cn("text-[10px]", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700 text-slate-300")}>{listing.railroad}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className={cn("text-sm font-semibold", text)}>{listing.originCity}</div>
                        <div className={cn("text-xs", muted)}>{listing.originYard}</div>
                      </div>
                      <ArrowRight className={cn("w-4 h-4 flex-shrink-0", muted)} />
                      <div className="min-w-0">
                        <div className={cn("text-sm font-semibold", text)}>{listing.destCity}</div>
                        <div className={cn("text-xs", muted)}>{listing.destYard}</div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className={cn("text-xs", muted)}>Commodity</div>
                      <div className={cn("font-medium", text)}>{listing.commodity}</div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs", muted)}>Car Type</div>
                      <div className={cn("font-medium", text)}>{listing.carType}</div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs", muted)}>Cars</div>
                      <div className={cn("font-semibold", text)}>{listing.carCount}</div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs", muted)}>Rate Range</div>
                      <div className={cn("font-semibold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                        ${listing.rateMin.toLocaleString()} – ${listing.rateMax.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs", muted)}>Deadline</div>
                      <div className={cn("font-medium flex items-center gap-1", text)}>
                        <Clock className="w-3 h-3" />{listing.deadline}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    onClick={() => handlePlaceBid(listing)}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                  >
                    <Gavel className="w-4 h-4 mr-1" /> Place Bid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub: My Bids                                                       */
/* ------------------------------------------------------------------ */
function MyBids({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const bids = MOCK_BIDS;
  const loading = false;

  const accepted = bids.filter((b) => b.status === "accepted").length;
  const total = bids.filter((b) => b.status !== "expired").length;
  const winRate = total > 0 ? ((accepted / total) * 100).toFixed(0) : "0";
  const avgBid = bids.reduce((sum, b) => sum + b.bidAmount, 0) / bids.length;

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <FileText className="w-5 h-5 text-cyan-500" /> My Bids
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={cn("rounded-lg p-3 text-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
            <div className={cn("text-2xl font-bold", text)}>{bids.filter(b => b.status === "pending").length}</div>
            <div className={cn("text-xs", muted)}>Pending</div>
          </div>
          <div className={cn("rounded-lg p-3 text-center", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
            <div className={cn("text-2xl font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>{winRate}%</div>
            <div className={cn("text-xs", muted)}>Win Rate</div>
          </div>
          <div className={cn("rounded-lg p-3 text-center", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
            <div className={cn("text-2xl font-bold", isLight ? "text-blue-600" : "text-blue-400")}>${avgBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className={cn("text-xs", muted)}>Avg Bid</div>
          </div>
        </div>

        {loading ? <SkeletonRows rows={4} cols={4} /> : (
          <div className="space-y-2">
            {bids.map((bid) => (
              <div key={bid.id} className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border",
                isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-xs font-mono", isLight ? "text-blue-600" : "text-blue-400")}>{bid.id}</span>
                    <Badge className={cn("text-[10px] border", BID_STATUS_MAP[bid.status])}>
                      {bid.status === "accepted" && <CheckCircle className="w-3 h-3 mr-0.5" />}
                      {bid.status === "rejected" && <XCircle className="w-3 h-3 mr-0.5" />}
                      {bid.status === "pending" && <Clock className="w-3 h-3 mr-0.5" />}
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </Badge>
                  </div>
                  <div className={cn("text-sm font-medium", text)}>{bid.route}</div>
                  <div className={cn("text-xs", muted)}>{bid.commodity} | {bid.carCount} cars</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-bold", text)}>${bid.bidAmount.toLocaleString()}/car</div>
                  <div className={cn("text-xs", muted)}>Submitted {bid.submittedAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub: Carrier Network                                               */
/* ------------------------------------------------------------------ */
function CarrierNetwork({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const carriers = MOCK_CARRIERS;
  const loading = false;

  const classICt = carriers.filter((c) => c.classType === "I").length;
  const classIICt = carriers.filter((c) => c.classType === "II").length;
  const classIIICt = carriers.filter((c) => c.classType === "III").length;

  const classColors: Record<string, string> = {
    I: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    II: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
    III: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <Building2 className="w-5 h-5 text-amber-500" /> Carrier Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Class breakdown */}
        <div className="flex gap-4 mb-4">
          {[
            { label: "Class I", count: classICt, color: "blue" },
            { label: "Class II", count: classIICt, color: "cyan" },
            { label: "Class III", count: classIIICt, color: "slate" },
          ].map((g) => (
            <div key={g.label} className={cn("flex items-center gap-1.5 text-sm", muted)}>
              <div className={cn("w-3 h-3 rounded-full", `bg-${g.color}-500`)} />
              <span className={cn("font-medium", text)}>{g.count}</span> {g.label}
            </div>
          ))}
        </div>

        {loading ? <SkeletonRows rows={4} cols={4} /> : (
          <div className="space-y-2">
            {carriers.map((carrier) => (
              <div key={carrier.id} className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border",
                isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-sm font-semibold", text)}>{carrier.name}</span>
                    <Badge className={cn("text-[10px] border", classColors[carrier.classType])}>
                      Class {carrier.classType}
                    </Badge>
                  </div>
                  <div className={cn("text-xs flex flex-wrap gap-1", muted)}>
                    <Globe className="w-3 h-3 mr-0.5" />
                    {carrier.territory.join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className={cn("font-semibold", text)}>{carrier.agreementsOnFile}</div>
                    <div className={cn("text-[10px]", muted)}>Agreements</div>
                  </div>
                  <div className="text-center">
                    <div className={cn("font-semibold", carrier.onTimeRate >= 90 ? "text-emerald-500" : "text-amber-500")}>
                      {carrier.onTimeRate}%
                    </div>
                    <div className={cn("text-[10px]", muted)}>On-Time</div>
                  </div>
                  <div className="text-center">
                    <div className={cn("font-semibold", text)}>{carrier.activeShipments}</div>
                    <div className={cn("text-[10px]", muted)}>Active</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub: Financial / Commission Tracking                               */
/* ------------------------------------------------------------------ */
function FinancialCard({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const commissions = MOCK_COMMISSIONS;
  const loading = false;

  const weekEarned = 13_078;
  const monthEarned = 47_178;
  const yearEarned = 412_900;
  const pending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  // Revenue by railroad
  const revenueByRR = useMemo(() => {
    const map: Record<string, number> = {};
    commissions.forEach((c) => {
      map[c.railroad] = (map[c.railroad] || 0) + c.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [commissions]);

  const maxRev = Math.max(...revenueByRR.map(([, v]) => v));

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <DollarSign className="w-5 h-5 text-emerald-500" /> Commission Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Time-based earnings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "This Week", value: weekEarned, accent: "emerald" },
            { label: "This Month", value: monthEarned, accent: "blue" },
            { label: "Year-to-Date", value: yearEarned, accent: "purple" },
            { label: "Pending", value: pending, accent: "amber" },
          ].map((item) => (
            <div key={item.label} className={cn(
              "rounded-lg p-3 text-center",
              isLight ? "bg-slate-50" : "bg-slate-700/30"
            )}>
              <div className={cn(
                "text-xl font-bold",
                item.accent === "emerald" ? (isLight ? "text-emerald-600" : "text-emerald-400") :
                item.accent === "blue" ? (isLight ? "text-blue-600" : "text-blue-400") :
                item.accent === "purple" ? (isLight ? "text-purple-600" : "text-purple-400") :
                isLight ? "text-amber-600" : "text-amber-400"
              )}>
                ${item.value.toLocaleString()}
              </div>
              <div className={cn("text-xs", muted)}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue by Railroad */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3", text)}>Revenue by Railroad</h4>
            <div className="space-y-2.5">
              {revenueByRR.map(([rr, amount]) => (
                <div key={rr}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={muted}>{rr}</span>
                    <span className={cn("font-semibold", text)}>${amount.toLocaleString()}</span>
                  </div>
                  <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700/60")}>
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(amount / maxRev) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Revenue Lanes */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3", text)}>Recent Commissions</h4>
            {loading ? <SkeletonRows rows={4} cols={3} /> : (
              <div className="space-y-2">
                {commissions.map((c, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border",
                    isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
                  )}>
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-sm font-medium truncate", text)}>{c.lane}</div>
                      <div className={cn("text-xs", muted)}>{c.railroad} | {c.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                        ${c.amount.toLocaleString()}
                      </span>
                      <Badge className={cn("text-[10px]", COMMISSION_STATUS_MAP[c.status])}>
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub: Intermodal Opportunities                                      */
/* ------------------------------------------------------------------ */
function IntermodalOpportunities({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const containers = [
    { type: "TOFC (Trailer-on-Flatcar)", available: 142, region: "Midwest / West", rate: 2_850, trend: 4.2 },
    { type: "COFC (Container-on-Flatcar)", available: 98, region: "Northeast / Southeast", rate: 2_420, trend: -1.8 },
    { type: "Domestic Containers (53ft)", available: 215, region: "National", rate: 2_680, trend: 6.1 },
    { type: "ISO Containers (40ft)", available: 67, region: "Port Regions", rate: 3_100, trend: 2.5 },
  ];

  const handoffs = [
    { origin: "Chicago ICTF", dest: "Regional Distribution", mode: "Rail → Truck", nextSlot: "Apr 1, 06:00", capacity: 45 },
    { origin: "LA Port", dest: "Phoenix Hub", mode: "Ship → Rail → Truck", nextSlot: "Apr 2, 14:00", capacity: 30 },
    { origin: "Savannah Port", dest: "Atlanta ILC", mode: "Ship → Rail", nextSlot: "Apr 1, 22:00", capacity: 55 },
  ];

  const rateComparisons = [
    { lane: "Chicago → Los Angeles", rail: 2_850, truck: 4_200, intermodal: 3_100, savings: 26 },
    { lane: "New York → Atlanta", rail: 2_100, truck: 3_400, intermodal: 2_500, savings: 26 },
    { lane: "Houston → Memphis", rail: 1_800, truck: 2_600, intermodal: 2_050, savings: 21 },
  ];

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <Container className="w-5 h-5 text-indigo-500" /> Intermodal Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Container Availability */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <Package className="w-4 h-4 text-indigo-400" /> Container Availability
            </h4>
            <div className="space-y-2.5">
              {containers.map((c) => (
                <div key={c.type} className={cn(
                  "p-3 rounded-lg border",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
                )}>
                  <div className={cn("text-sm font-medium mb-1", text)}>{c.type}</div>
                  <div className="flex items-center justify-between">
                    <div className={cn("text-xs", muted)}>{c.region}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", isLight ? "text-indigo-600" : "text-indigo-400")}>
                        {c.available} units
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        c.trend >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {c.trend >= 0 ? "+" : ""}{c.trend}%
                      </span>
                    </div>
                  </div>
                  <div className={cn("text-xs mt-1", muted)}>Avg rate: ${c.rate.toLocaleString()}/unit</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rail-to-Truck Handoff */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <Truck className="w-4 h-4 text-amber-400" /> Handoff Scheduling
            </h4>
            <div className="space-y-2.5">
              {handoffs.map((h, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg border",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
                )}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge className={cn("text-[10px]", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")}>
                      {h.mode}
                    </Badge>
                  </div>
                  <div className={cn("text-sm font-medium", text)}>{h.origin}</div>
                  <div className="flex items-center gap-1 my-0.5">
                    <ChevronRight className={cn("w-3 h-3", muted)} />
                    <span className={cn("text-sm", text)}>{h.dest}</span>
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className={cn("text-xs flex items-center gap-1", muted)}>
                      <Clock className="w-3 h-3" /> {h.nextSlot}
                    </span>
                    <span className={cn("text-xs font-medium", isLight ? "text-blue-600" : "text-blue-400")}>
                      {h.capacity} slots open
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Comparisons */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", text)}>
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Multi-Modal Rate Compare
            </h4>
            <div className="space-y-2.5">
              {rateComparisons.map((r) => (
                <div key={r.lane} className={cn(
                  "p-3 rounded-lg border",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
                )}>
                  <div className={cn("text-sm font-medium mb-2", text)}>{r.lane}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className={cn("text-xs", muted)}>Rail</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-blue-600" : "text-blue-400")}>
                        ${r.rail.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs", muted)}>Intermodal</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-indigo-600" : "text-indigo-400")}>
                        ${r.intermodal.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs", muted)}>Truck</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-slate-600" : "text-slate-400")}>
                        ${r.truck.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={cn("text-center text-xs font-medium mt-2", "text-emerald-500")}>
                    Rail saves ~{r.savings}% vs. truck
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailBrokerDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const cardBg = isLight
    ? "bg-white border-slate-200 shadow-sm"
    : "bg-slate-800/60 border-slate-700/50";

  // tRPC queries — gracefully fall back to mock data when endpoints don't exist
  const statsQuery = (trpc as any).railShipments?.getRailDashboardStats?.useQuery?.() ?? { data: null, isLoading: false };
  const shipmentsQuery = (trpc as any).railShipments?.getRailShipments?.useQuery?.({ status: "all", limit: 10 }) ?? { data: null, isLoading: false };

  const loading = statsQuery.isLoading || shipmentsQuery.isLoading;

  // Broker profile (mocked — would come from auth context in production)
  const brokerName = "Marcus Rivera";
  const brokerCompany = "Eusorone Rail Brokerage LLC";

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", isLight ? "bg-slate-50" : "bg-slate-900")}>
      {/* --------------------------------------------------------- */}
      {/*  HEADER                                                    */}
      {/* --------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isLight ? "bg-purple-100" : "bg-purple-500/15"
          )}>
            <Briefcase className={cn("w-7 h-7", isLight ? "text-purple-600" : "text-purple-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl md:text-3xl font-bold tracking-tight", text)}>
              Rail Brokerage Center
            </h1>
            <div className={cn("text-sm mt-0.5", muted)}>
              {brokerName} &middot; {brokerCompany}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className={cn(
            "gap-1.5",
            isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700"
          )}
          onClick={() => toast.info("Refreshing market data...")}
        >
          <RefreshCw className="w-4 h-4" /> Refresh Market
        </Button>
      </div>

      {/* --------------------------------------------------------- */}
      {/*  QUICK STATS (KPIs)                                        */}
      {/* --------------------------------------------------------- */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={<Gavel className="w-5 h-5" />} label="Active Deals" value={12} subtitle="4 closing this week" isLight={isLight} accent="purple" />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="Pending Bids" value={MOCK_BIDS.filter(b => b.status === "pending").length} subtitle="Avg response: 18h" isLight={isLight} accent="amber" />
          <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Monthly Commission" value="$47.2K" subtitle="+8.3% vs. last month" isLight={isLight} accent="emerald" />
          <KpiCard icon={<Percent className="w-5 h-5" />} label="Win Rate" value="40%" subtitle="Above avg (32%)" isLight={isLight} accent="cyan" />
          <KpiCard icon={<Train className="w-5 h-5" />} label="Carrier Partners" value={MOCK_CARRIERS.length} subtitle="5 Class I railroads" isLight={isLight} accent="blue" />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="Market Listings" value={MOCK_LISTINGS.length} subtitle="2 critical urgency" isLight={isLight} accent="red" />
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/*  MARKET OVERVIEW (Hero)                                    */}
      {/* --------------------------------------------------------- */}
      <MarketOverview isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* --------------------------------------------------------- */}
      {/*  SHIPMENT MARKETPLACE (Prominent)                          */}
      {/* --------------------------------------------------------- */}
      <ShipmentMarketplace isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* --------------------------------------------------------- */}
      {/*  MY BIDS + CARRIER NETWORK (2 col)                         */}
      {/* --------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MyBids isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        <CarrierNetwork isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* --------------------------------------------------------- */}
      {/*  FINANCIAL / COMMISSION TRACKING                           */}
      {/* --------------------------------------------------------- */}
      <FinancialCard isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* --------------------------------------------------------- */}
      {/*  INTERMODAL OPPORTUNITIES                                  */}
      {/* --------------------------------------------------------- */}
      <IntermodalOpportunities isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
    </div>
  );
}
