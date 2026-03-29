/**
 * VESSEL MARKETPLACE — Ocean Freight Spot Market
 * The central marketplace for ocean freight capacity: live rates, available sailings,
 * spot deals, quote management, trade lane analytics, and carrier directory.
 * Used by VESSEL_SHIPPER, VESSEL_BROKER, and VESSEL_OPERATOR roles.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Store,
  Ship,
  Anchor,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Search,
  Filter,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  BarChart3,
  Globe,
  Calendar,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  Zap,
  Award,
  Navigation,
  Building2,
  Percent,
  Plus,
  Thermometer,
  Box,
  Layers,
  Flame,
  Timer,
  Shield,
  BookOpen,
  Send,
  MessageSquare,
  ThumbsUp,
  Hash,
  CircleDot,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ──────────────────────── TYPES ──────────────────────── */

type ContainerSize = "20" | "40" | "40HC" | "45";
type EquipmentType = "dry" | "reefer" | "flat" | "open_top" | "tank";
type QuoteStatus = "pending" | "received" | "accepted" | "expired" | "declined";
type MarketplaceTab = "rates" | "sailings" | "spot" | "quotes" | "analytics" | "carriers";

interface TradeRate {
  id: string;
  carrier: string;
  carrierCode: string;
  pol: string;
  polCode: string;
  pod: string;
  podCode: string;
  containerSize: ContainerSize;
  equipmentType: EquipmentType;
  rate: number;
  currency: string;
  transitDays: number;
  freeTimeDays: number;
  validFrom: string;
  validTo: string;
  spaceAvailable: number;
  reliability: number;
  surcharges: number;
  allInRate: number;
}

interface Sailing {
  id: string;
  vesselName: string;
  imo: string;
  carrier: string;
  service: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  transitDays: number;
  cutOffDate: string;
  cutOffTime: string;
  siCutOff: string;
  availableTeu: number;
  totalTeu: number;
  containerSizes: ContainerSize[];
  equipmentTypes: EquipmentType[];
  rate: number;
  status: "open" | "limited" | "closed";
}

interface SpotDeal {
  id: string;
  carrier: string;
  pol: string;
  pod: string;
  containerSize: ContainerSize;
  equipmentType: EquipmentType;
  originalRate: number;
  spotRate: number;
  discount: number;
  expiresAt: string;
  remainingSlots: number;
  sailDate: string;
  vesselName: string;
  tag: "flash_sale" | "last_minute" | "bulk_discount" | "backhaul";
}

interface Quote {
  id: string;
  refNumber: string;
  pol: string;
  pod: string;
  containerSize: ContainerSize;
  equipmentType: EquipmentType;
  quantity: number;
  requestedDate: string;
  status: QuoteStatus;
  responses: QuoteResponse[];
  createdAt: string;
}

interface QuoteResponse {
  carrier: string;
  rate: number;
  transitDays: number;
  freeTime: number;
  validUntil: string;
  notes: string;
}

interface TradeLane {
  lane: string;
  code: string;
  avgRate20: number;
  avgRate40: number;
  change7d: number;
  change30d: number;
  volume: number;
  trend: number[];
}

interface CarrierInfo {
  name: string;
  code: string;
  country: string;
  fleetSize: number;
  services: string[];
  reliability: number;
  avgTransit: number;
  rateIndex: number;
  coverage: string[];
  rating: number;
}

/* ──────────────────────── EMPTY DEFAULTS ──────────────────────── */
// No mock data — pages show empty states until real data arrives from tRPC.

const EMPTY_RATES: TradeRate[] = [];

const EMPTY_SAILINGS: Sailing[] = [];

const EMPTY_SPOT_DEALS: SpotDeal[] = [];

const EMPTY_QUOTES: Quote[] = [];

const EMPTY_TRADE_LANES: TradeLane[] = [];

const EMPTY_CARRIERS: CarrierInfo[] = [];

const CONTAINER_SIZES: { value: ContainerSize; label: string }[] = [
  { value: "20", label: "20' Standard" },
  { value: "40", label: "40' Standard" },
  { value: "40HC", label: "40' High Cube" },
  { value: "45", label: "45' High Cube" },
];

const EQUIPMENT_TYPES: { value: EquipmentType; label: string; icon: React.ReactNode }[] = [
  { value: "dry", label: "Dry", icon: <Box className="w-3.5 h-3.5" /> },
  { value: "reefer", label: "Reefer", icon: <Thermometer className="w-3.5 h-3.5" /> },
  { value: "flat", label: "Flat Rack", icon: <Layers className="w-3.5 h-3.5" /> },
  { value: "open_top", label: "Open Top", icon: <Package className="w-3.5 h-3.5" /> },
  { value: "tank", label: "Tank", icon: <CircleDot className="w-3.5 h-3.5" /> },
];

/* ──────────────────────── HELPERS ──────────────────────── */

function fmtUsd(v: number): string {
  return "$" + v.toLocaleString("en-US");
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateTime(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function tagLabel(tag: SpotDeal["tag"]): string {
  const map: Record<string, string> = { flash_sale: "Flash Sale", last_minute: "Last Minute", bulk_discount: "Bulk Discount", backhaul: "Backhaul" };
  return map[tag] ?? tag;
}

function tagColor(tag: SpotDeal["tag"]): string {
  const map: Record<string, string> = {
    flash_sale: "bg-amber-500/20 text-amber-400",
    last_minute: "bg-red-500/20 text-red-400",
    bulk_discount: "bg-blue-500/20 text-blue-400",
    backhaul: "bg-emerald-500/20 text-emerald-400",
  };
  return map[tag] ?? "bg-slate-500/20 text-slate-400";
}

function quoteStatusColor(s: QuoteStatus): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    received: "bg-blue-500/20 text-blue-400",
    accepted: "bg-green-500/20 text-green-400",
    expired: "bg-slate-500/20 text-slate-400",
    declined: "bg-red-500/20 text-red-400",
  };
  return map[s] ?? "bg-slate-500/20 text-slate-400";
}

function sailingStatusColor(s: Sailing["status"]): string {
  const map: Record<string, string> = {
    open: "bg-green-500/20 text-green-400",
    limited: "bg-amber-500/20 text-amber-400",
    closed: "bg-red-500/20 text-red-400",
  };
  return map[s] ?? "bg-slate-500/20 text-slate-400";
}

function miniSparkline(data: number[], isLight: boolean): React.ReactNode {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#22c55e" : "#ef4444";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */

export default function VesselMarketplace() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* ── State ── */
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("rates");
  const [searchPol, setSearchPol] = useState("");
  const [searchPod, setSearchPod] = useState("");
  const [selectedContainer, setSelectedContainer] = useState<ContainerSize | "">("");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | "">("");
  const [searchGeneral, setSearchGeneral] = useState("");
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);
  const [sortRateBy, setSortRateBy] = useState<"rate" | "transit" | "reliability">("rate");

  /* ── Styles ── */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cardBgAlt = cn("border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/40 border-slate-700/50");
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-600" : "text-slate-400";
  const textMuted = isLight ? "text-slate-500" : "text-slate-500";
  const inputBg = isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-700";
  const hoverBg = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/40";
  const tableBorder = isLight ? "border-slate-200" : "border-slate-700/50";
  const tableHeaderBg = isLight ? "bg-slate-50" : "bg-slate-800/80";

  /* ── Filtered Data ── */
  const filteredRates = useMemo(() => {
    let data = [...EMPTY_RATES];
    if (searchPol) data = data.filter((r) => r.pol.toLowerCase().includes(searchPol.toLowerCase()) || r.polCode.toLowerCase().includes(searchPol.toLowerCase()));
    if (searchPod) data = data.filter((r) => r.pod.toLowerCase().includes(searchPod.toLowerCase()) || r.podCode.toLowerCase().includes(searchPod.toLowerCase()));
    if (selectedContainer) data = data.filter((r) => r.containerSize === selectedContainer);
    if (selectedEquipment) data = data.filter((r) => r.equipmentType === selectedEquipment);
    if (sortRateBy === "rate") data.sort((a, b) => a.allInRate - b.allInRate);
    else if (sortRateBy === "transit") data.sort((a, b) => a.transitDays - b.transitDays);
    else data.sort((a, b) => b.reliability - a.reliability);
    return data;
  }, [searchPol, searchPod, selectedContainer, selectedEquipment, sortRateBy]);

  const filteredSailings = useMemo(() => {
    let data = [...EMPTY_SAILINGS];
    if (searchPol) data = data.filter((s) => s.pol.toLowerCase().includes(searchPol.toLowerCase()));
    if (searchPod) data = data.filter((s) => s.pod.toLowerCase().includes(searchPod.toLowerCase()));
    if (selectedContainer) data = data.filter((s) => s.containerSizes.includes(selectedContainer));
    if (selectedEquipment) data = data.filter((s) => s.equipmentTypes.includes(selectedEquipment));
    return data;
  }, [searchPol, searchPod, selectedContainer, selectedEquipment]);

  const filteredSpotDeals = useMemo(() => {
    let data = [...EMPTY_SPOT_DEALS];
    if (searchPol) data = data.filter((d) => d.pol.toLowerCase().includes(searchPol.toLowerCase()));
    if (searchPod) data = data.filter((d) => d.pod.toLowerCase().includes(searchPod.toLowerCase()));
    if (selectedContainer) data = data.filter((d) => d.containerSize === selectedContainer);
    if (selectedEquipment) data = data.filter((d) => d.equipmentType === selectedEquipment);
    return data;
  }, [searchPol, searchPod, selectedContainer, selectedEquipment]);

  const totalListings = EMPTY_RATES.length + EMPTY_SAILINGS.length + EMPTY_SPOT_DEALS.length;

  /* ──────────────────────── SECTION: Header ──────────────────────── */
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-cyan-100" : "bg-cyan-500/10")}>
          <Store className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", textPrimary)}>Ocean Freight Marketplace</h1>
          <p className={textSecondary}>
            <span className="font-medium text-cyan-500">{totalListings}</span> live listings across{" "}
            <span className="font-medium">{EMPTY_CARRIERS.length}</span> carriers
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className={cn("gap-1.5", isLight ? "border-slate-300" : "border-slate-600")}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
        <Button size="sm" className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="w-4 h-4" /> Request Quote
        </Button>
      </div>
    </div>
  );

  /* ──────────────────────── SECTION: Search & Filters ──────────────────────── */
  const renderFilters = () => (
    <Card className={cn(cardBg, "mb-6")}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className={cn("w-4 h-4", textSecondary)} />
          <span className={cn("text-sm font-medium", textSecondary)}>Search & Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* POL */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", textMuted)}>Port of Loading</label>
            <div className="relative">
              <MapPin className={cn("absolute left-2.5 top-2.5 w-4 h-4", textMuted)} />
              <Input
                value={searchPol}
                onChange={(e) => setSearchPol(e.target.value)}
                placeholder="e.g. Shanghai"
                className={cn("pl-9 h-9 text-sm", inputBg)}
              />
            </div>
          </div>
          {/* POD */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", textMuted)}>Port of Discharge</label>
            <div className="relative">
              <Anchor className={cn("absolute left-2.5 top-2.5 w-4 h-4", textMuted)} />
              <Input
                value={searchPod}
                onChange={(e) => setSearchPod(e.target.value)}
                placeholder="e.g. Los Angeles"
                className={cn("pl-9 h-9 text-sm", inputBg)}
              />
            </div>
          </div>
          {/* Container Size */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", textMuted)}>Container Size</label>
            <select
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value as ContainerSize | "")}
              className={cn("w-full h-9 rounded-md px-3 text-sm border", inputBg, textPrimary)}
            >
              <option value="">All Sizes</option>
              {CONTAINER_SIZES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {/* Equipment Type */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", textMuted)}>Equipment Type</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value as EquipmentType | "")}
              className={cn("w-full h-9 rounded-md px-3 text-sm border", inputBg, textPrimary)}
            >
              <option value="">All Types</option>
              {EQUIPMENT_TYPES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          {/* Date Range placeholder */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", textMuted)}>Sailing Date</label>
            <div className="relative">
              <Calendar className={cn("absolute left-2.5 top-2.5 w-4 h-4", textMuted)} />
              <Input type="date" className={cn("pl-9 h-9 text-sm", inputBg)} />
            </div>
          </div>
        </div>
        {/* Active filter tags */}
        {(searchPol || searchPod || selectedContainer || selectedEquipment) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={cn("text-xs", textMuted)}>Active:</span>
            {searchPol && (
              <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setSearchPol("")}>
                POL: {searchPol} <XCircle className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {searchPod && (
              <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setSearchPod("")}>
                POD: {searchPod} <XCircle className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {selectedContainer && (
              <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedContainer("")}>
                {selectedContainer}' <XCircle className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {selectedEquipment && (
              <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedEquipment("")}>
                {selectedEquipment} <XCircle className="w-3 h-3 ml-1" />
              </Badge>
            )}
            <button
              onClick={() => { setSearchPol(""); setSearchPod(""); setSelectedContainer(""); setSelectedEquipment(""); }}
              className="text-xs text-cyan-500 hover:text-cyan-400 ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  /* ──────────────────────── SECTION: Tab Navigation ──────────────────────── */
  const renderTabs = () => {
    const tabs: { key: MarketplaceTab; label: string; icon: React.ReactNode; count?: number }[] = [
      { key: "rates", label: "Rate Board", icon: <DollarSign className="w-4 h-4" />, count: filteredRates.length },
      { key: "sailings", label: "Sailings", icon: <Ship className="w-4 h-4" />, count: filteredSailings.length },
      { key: "spot", label: "Spot Market", icon: <Zap className="w-4 h-4" />, count: filteredSpotDeals.length },
      { key: "quotes", label: "My Quotes", icon: <FileText className="w-4 h-4" />, count: EMPTY_QUOTES.length },
      { key: "analytics", label: "Trade Lanes", icon: <BarChart3 className="w-4 h-4" /> },
      { key: "carriers", label: "Carriers", icon: <Building2 className="w-4 h-4" />, count: EMPTY_CARRIERS.length },
    ];
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-cyan-600 text-white shadow-md"
                : cn(isLight ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50")
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.count !== undefined && (
              <span className={cn("text-xs rounded-full px-1.5 py-0.5", activeTab === t.key ? "bg-white/20" : isLight ? "bg-slate-100" : "bg-slate-700")}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  /* ──────────────────────── TAB: Rate Board ──────────────────────── */
  const renderRateBoard = () => (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", textPrimary)}>Live Market Rates</h2>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", textMuted)}>Sort by:</span>
          {(["rate", "transit", "reliability"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortRateBy(s)}
              className={cn(
                "text-xs px-3 py-1 rounded-full transition-colors",
                sortRateBy === s
                  ? "bg-cyan-600 text-white"
                  : cn(isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")
              )}
            >
              {s === "rate" ? "Lowest Rate" : s === "transit" ? "Fastest" : "Most Reliable"}
            </button>
          ))}
        </div>
      </div>

      {/* Rate table */}
      <div className={cn("rounded-xl overflow-hidden border", tableBorder)}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeaderBg}>
                <th className={cn("text-left px-4 py-3 font-medium", textSecondary)}>Carrier</th>
                <th className={cn("text-left px-4 py-3 font-medium", textSecondary)}>Route</th>
                <th className={cn("text-left px-4 py-3 font-medium", textSecondary)}>Container</th>
                <th className={cn("text-right px-4 py-3 font-medium", textSecondary)}>Base Rate</th>
                <th className={cn("text-right px-4 py-3 font-medium", textSecondary)}>All-In</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Transit</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Free Time</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Space</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Reliability</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Validity</th>
                <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((r, idx) => (
                <tr key={r.id} className={cn("border-t transition-colors", tableBorder, hoverBg, idx === 0 && "ring-1 ring-inset ring-cyan-500/30")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", isLight ? "bg-slate-100 text-slate-700" : "bg-slate-700 text-slate-200")}>
                        {r.carrierCode.substring(0, 2)}
                      </div>
                      <div>
                        <div className={cn("font-medium text-sm", textPrimary)}>{r.carrier}</div>
                        <div className={cn("text-xs", textMuted)}>{r.carrierCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-medium", textPrimary)}>{r.polCode}</span>
                      <ArrowRight className={cn("w-3 h-3", textMuted)} />
                      <span className={cn("font-medium", textPrimary)}>{r.podCode}</span>
                    </div>
                    <div className={cn("text-xs", textMuted)}>{r.pol} → {r.pod}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{r.containerSize}' {r.equipmentType}</Badge>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-mono", textSecondary)}>{fmtUsd(r.rate)}</td>
                  <td className={cn("px-4 py-3 text-right font-mono font-bold", textPrimary)}>
                    {fmtUsd(r.allInRate)}
                    <div className={cn("text-xs font-normal", textMuted)}>+{fmtUsd(r.surcharges)} surcharge</div>
                  </td>
                  <td className={cn("px-4 py-3 text-center", textPrimary)}>{r.transitDays}d</td>
                  <td className={cn("px-4 py-3 text-center", textSecondary)}>{r.freeTimeDays}d</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("font-medium", r.spaceAvailable < 50 ? "text-amber-500" : "text-green-500")}>{r.spaceAvailable}</span>
                    <span className={cn("text-xs", textMuted)}> TEU</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-12">
                        <Progress value={r.reliability} className="h-1.5" />
                      </div>
                      <span className={cn("text-xs font-medium", r.reliability >= 90 ? "text-green-500" : "text-amber-500")}>{r.reliability}%</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-center text-xs", textMuted)}>
                    {fmtDate(r.validFrom)} — {fmtDate(r.validTo)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">
                      Book
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRates.length === 0 && (
          <div className={cn("text-center py-12", textMuted)}>
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No rates match your filters</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ──────────────────────── TAB: Available Sailings ──────────────────────── */
  const renderSailings = () => (
    <div className="space-y-4">
      <h2 className={cn("text-lg font-semibold", textPrimary)}>Available Sailings</h2>
      <div className="grid gap-4">
        {filteredSailings.map((s) => (
          <Card key={s.id} className={cn(cardBg, "overflow-hidden")}>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Vessel info */}
                <div className={cn("lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r", tableBorder)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-cyan-50" : "bg-cyan-500/10")}>
                      <Ship className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <div className={cn("font-semibold", textPrimary)}>{s.vesselName}</div>
                      <div className={cn("text-xs", textMuted)}>IMO {s.imo} | {s.carrier}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{s.service}</Badge>
                    <Badge className={cn("text-xs", sailingStatusColor(s.status))}>
                      {s.status === "open" ? "Space Available" : s.status === "limited" ? "Limited Space" : "Closed"}
                    </Badge>
                  </div>
                </div>

                {/* Route */}
                <div className={cn("lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r", tableBorder)}>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className={cn("text-xs", textMuted)}>POL</div>
                      <div className={cn("font-semibold", textPrimary)}>{s.pol}</div>
                      <div className={cn("text-xs", textMuted)}>ETD {fmtDate(s.etd)}</div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className={cn("flex-1 h-px", isLight ? "bg-slate-300" : "bg-slate-600")} />
                      <div className={cn("mx-2 text-xs font-medium px-2 py-0.5 rounded-full", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700 text-slate-300")}>
                        {s.transitDays}d
                      </div>
                      <div className={cn("flex-1 h-px", isLight ? "bg-slate-300" : "bg-slate-600")} />
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs", textMuted)}>POD</div>
                      <div className={cn("font-semibold", textPrimary)}>{s.pod}</div>
                      <div className={cn("text-xs", textMuted)}>ETA {fmtDate(s.eta)}</div>
                    </div>
                  </div>
                </div>

                {/* Cut-offs & Capacity */}
                <div className={cn("lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r", tableBorder)}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={cn("text-xs", textMuted)}>Cargo Cut-off</div>
                      <div className={cn("text-sm font-medium", textPrimary)}>{fmtDate(s.cutOffDate)} {s.cutOffTime}</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", textMuted)}>SI Cut-off</div>
                      <div className={cn("text-sm font-medium", textPrimary)}>{fmtDate(s.siCutOff)}</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", textMuted)}>Available</div>
                      <div className={cn("text-sm font-medium", s.availableTeu < 50 ? "text-amber-500" : "text-green-500")}>{s.availableTeu} TEU</div>
                    </div>
                    <div>
                      <div className={cn("text-xs", textMuted)}>Equipment</div>
                      <div className="flex flex-wrap gap-1">
                        {s.equipmentTypes.map((e) => (
                          <span key={e} className={cn("text-xs px-1.5 py-0.5 rounded", isLight ? "bg-slate-100" : "bg-slate-700")}>{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rate + Action */}
                <div className="lg:col-span-3 p-4 flex flex-col items-center justify-center">
                  <div className="text-center mb-3">
                    <div className={cn("text-xs", textMuted)}>From</div>
                    <div className={cn("text-2xl font-bold", textPrimary)}>{fmtUsd(s.rate)}</div>
                    <div className={cn("text-xs", textMuted)}>per container</div>
                  </div>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5">
                    <BookOpen className="w-4 h-4" /> Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSailings.length === 0 && (
          <div className={cn("text-center py-16", textMuted)}>
            <Ship className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No sailings match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ──────────────────────── TAB: Spot Market ──────────────────────── */
  const renderSpotMarket = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-lg font-semibold", textPrimary)}>Spot Market Deals</h2>
          <p className={cn("text-sm", textSecondary)}>Urgent, discounted, and last-minute capacity offers</p>
        </div>
        <Badge className="bg-red-500/20 text-red-400 gap-1">
          <Flame className="w-3.5 h-3.5" /> {filteredSpotDeals.length} Active Deals
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSpotDeals.map((d) => (
          <Card key={d.id} className={cn(cardBg, "overflow-hidden relative")}>
            {/* Discount ribbon */}
            <div className="absolute top-3 right-3">
              <Badge className={cn("text-xs font-bold", tagColor(d.tag))}>
                {tagLabel(d.tag)}
              </Badge>
            </div>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", isLight ? "bg-slate-100 text-slate-700" : "bg-slate-700 text-slate-200")}>
                  {d.carrier.substring(0, 2)}
                </div>
                <div>
                  <div className={cn("font-medium text-sm", textPrimary)}>{d.carrier}</div>
                  <div className={cn("text-xs", textMuted)}>{d.vesselName}</div>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                <span className={cn("text-sm font-medium", textPrimary)}>{d.pol}</span>
                <ArrowRight className={cn("w-3 h-3", textMuted)} />
                <span className={cn("text-sm font-medium", textPrimary)}>{d.pod}</span>
              </div>

              {/* Container info */}
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="text-xs">{d.containerSize}' {d.equipmentType}</Badge>
                <Badge variant="outline" className="text-xs">Sail: {fmtDate(d.sailDate)}</Badge>
              </div>

              {/* Pricing */}
              <div className={cn("rounded-lg p-3 mb-3", cardBgAlt)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-xs", textMuted)}>Original Rate</span>
                  <span className={cn("text-sm line-through", textMuted)}>{fmtUsd(d.originalRate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-medium", textPrimary)}>Spot Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-500">{fmtUsd(d.spotRate)}</span>
                    <Badge className="bg-green-500/20 text-green-400 text-xs">-{d.discount}%</Badge>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  <span className={cn(textMuted)}>Expires: {timeRemaining(d.expiresAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={cn(d.remainingSlots <= 10 ? "text-red-500 font-medium" : textMuted)}>{d.remainingSlots} slots left</span>
                </div>
              </div>

              <Button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-1.5">
                <Zap className="w-4 h-4" /> Grab Deal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredSpotDeals.length === 0 && (
        <div className={cn("text-center py-16", textMuted)}>
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No spot deals available</p>
        </div>
      )}
    </div>
  );

  /* ──────────────────────── TAB: My Quotes ──────────────────────── */
  const renderQuotes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", textPrimary)}>My Quote Requests</h2>
        <Button size="sm" className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white">
          <Send className="w-4 h-4" /> New Quote Request
        </Button>
      </div>

      {/* Quote summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "received", "accepted", "expired"] as const).map((status) => {
          const count = EMPTY_QUOTES.filter((q) => q.status === status).length;
          const icons: Record<string, React.ReactNode> = {
            pending: <Clock className="w-5 h-5 text-yellow-500" />,
            received: <MessageSquare className="w-5 h-5 text-blue-500" />,
            accepted: <CheckCircle className="w-5 h-5 text-green-500" />,
            expired: <XCircle className="w-5 h-5 text-slate-400" />,
          };
          return (
            <Card key={status} className={cardBg}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                {icons[status]}
                <div>
                  <div className={cn("text-xl font-bold", textPrimary)}>{count}</div>
                  <div className={cn("text-xs capitalize", textMuted)}>{status}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quote list */}
      <div className="space-y-3">
        {EMPTY_QUOTES.map((q) => (
          <Card key={q.id} className={cn(cardBg)}>
            <CardContent className="pt-4 pb-3">
              {/* Quote header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Hash className={cn("w-4 h-4", textMuted)} />
                  <span className={cn("font-mono font-medium text-sm", textPrimary)}>{q.refNumber}</span>
                  <Badge className={cn("text-xs capitalize", quoteStatusColor(q.status))}>{q.status}</Badge>
                </div>
                <button
                  onClick={() => setExpandedQuote(expandedQuote === q.id ? null : q.id)}
                  className={cn("flex items-center gap-1 text-xs", textMuted, "hover:text-cyan-500")}
                >
                  {q.responses.length} response{q.responses.length !== 1 ? "s" : ""}
                  {expandedQuote === q.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Quote details row */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                <div>
                  <div className={cn("text-xs", textMuted)}>Route</div>
                  <div className={cn("font-medium", textPrimary)}>{q.pol} → {q.pod}</div>
                </div>
                <div>
                  <div className={cn("text-xs", textMuted)}>Container</div>
                  <div className={cn("font-medium", textPrimary)}>{q.containerSize}' {q.equipmentType}</div>
                </div>
                <div>
                  <div className={cn("text-xs", textMuted)}>Quantity</div>
                  <div className={cn("font-medium", textPrimary)}>{q.quantity} units</div>
                </div>
                <div>
                  <div className={cn("text-xs", textMuted)}>Requested Date</div>
                  <div className={cn("font-medium", textPrimary)}>{fmtDate(q.requestedDate)}</div>
                </div>
                <div>
                  <div className={cn("text-xs", textMuted)}>Created</div>
                  <div className={cn("font-medium", textPrimary)}>{fmtDate(q.createdAt)}</div>
                </div>
                <div>
                  <div className={cn("text-xs", textMuted)}>Responses</div>
                  <div className={cn("font-medium", q.responses.length > 0 ? "text-cyan-500" : textMuted)}>{q.responses.length}</div>
                </div>
              </div>

              {/* Expanded responses — comparison view */}
              {expandedQuote === q.id && q.responses.length > 0 && (
                <div className={cn("mt-4 rounded-lg border overflow-hidden", tableBorder)}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={tableHeaderBg}>
                        <th className={cn("text-left px-4 py-2 font-medium text-xs", textSecondary)}>Carrier</th>
                        <th className={cn("text-right px-4 py-2 font-medium text-xs", textSecondary)}>Rate / Unit</th>
                        <th className={cn("text-right px-4 py-2 font-medium text-xs", textSecondary)}>Total ({q.quantity}x)</th>
                        <th className={cn("text-center px-4 py-2 font-medium text-xs", textSecondary)}>Transit</th>
                        <th className={cn("text-center px-4 py-2 font-medium text-xs", textSecondary)}>Free Time</th>
                        <th className={cn("text-center px-4 py-2 font-medium text-xs", textSecondary)}>Valid Until</th>
                        <th className={cn("text-left px-4 py-2 font-medium text-xs", textSecondary)}>Notes</th>
                        <th className={cn("text-center px-4 py-2 font-medium text-xs", textSecondary)}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.responses
                        .slice()
                        .sort((a, b) => a.rate - b.rate)
                        .map((resp, i) => (
                          <tr key={i} className={cn("border-t", tableBorder, i === 0 && "bg-green-500/5")}>
                            <td className={cn("px-4 py-2 font-medium", textPrimary)}>
                              {resp.carrier}
                              {i === 0 && <Badge className="ml-2 text-[10px] bg-green-500/20 text-green-400">Best Rate</Badge>}
                            </td>
                            <td className={cn("px-4 py-2 text-right font-mono", textPrimary)}>{fmtUsd(resp.rate)}</td>
                            <td className={cn("px-4 py-2 text-right font-mono font-bold", textPrimary)}>{fmtUsd(resp.rate * q.quantity)}</td>
                            <td className={cn("px-4 py-2 text-center", textSecondary)}>{resp.transitDays}d</td>
                            <td className={cn("px-4 py-2 text-center", textSecondary)}>{resp.freeTime}d</td>
                            <td className={cn("px-4 py-2 text-center text-xs", textMuted)}>{fmtDate(resp.validUntil)}</td>
                            <td className={cn("px-4 py-2 text-xs", textMuted)}>{resp.notes || "—"}</td>
                            <td className="px-4 py-2 text-center">
                              {q.status === "received" && (
                                <Button size="sm" className="h-6 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">Accept</Button>
                              )}
                              {q.status === "accepted" && <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {expandedQuote === q.id && q.responses.length === 0 && (
                <div className={cn("mt-4 py-6 text-center rounded-lg", cardBgAlt)}>
                  <Clock className={cn("w-6 h-6 mx-auto mb-1", textMuted)} />
                  <p className={cn("text-sm", textMuted)}>Awaiting carrier responses...</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  /* ──────────────────────── TAB: Trade Lane Analytics ──────────────────────── */
  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-lg font-semibold", textPrimary)}>Trade Lane Analytics</h2>
          <p className={cn("text-sm", textSecondary)}>Rate trends across major ocean trade lanes</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(textMuted)}>Period:</span>
          {["7D", "30D", "90D"].map((p) => (
            <button key={p} className={cn("px-2.5 py-1 rounded-full", p === "7D" ? "bg-cyan-600 text-white" : cn(isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-400"))}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg 40' Rate", value: fmtUsd(Math.round(EMPTY_TRADE_LANES.reduce((s, l) => s + l.avgRate40, 0) / EMPTY_TRADE_LANES.length)), change: -4.2, icon: <DollarSign className="w-5 h-5 text-cyan-500" /> },
          { label: "Total Volume", value: `${(EMPTY_TRADE_LANES.reduce((s, l) => s + l.volume, 0) / 1000).toFixed(0)}K TEU`, change: 2.1, icon: <Package className="w-5 h-5 text-blue-500" /> },
          { label: "Lanes Tracked", value: EMPTY_TRADE_LANES.length.toString(), change: 0, icon: <Globe className="w-5 h-5 text-emerald-500" /> },
          { label: "Lowest Rate", value: fmtUsd(Math.min(...EMPTY_TRADE_LANES.map((l) => l.avgRate40))), change: -6.8, icon: <TrendingDown className="w-5 h-5 text-green-500" /> },
        ].map((stat, i) => (
          <Card key={i} className={cardBg}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                {stat.icon}
                {stat.change !== 0 && (
                  <span className={cn("text-xs font-medium flex items-center gap-0.5", stat.change > 0 ? "text-red-500" : "text-green-500")}>
                    {stat.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stat.change)}%
                  </span>
                )}
              </div>
              <div className={cn("text-xl font-bold", textPrimary)}>{stat.value}</div>
              <div className={cn("text-xs", textMuted)}>{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trade lane table */}
      <div className={cn("rounded-xl overflow-hidden border", tableBorder)}>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeaderBg}>
              <th className={cn("text-left px-4 py-3 font-medium", textSecondary)}>Trade Lane</th>
              <th className={cn("text-right px-4 py-3 font-medium", textSecondary)}>Avg 20' Rate</th>
              <th className={cn("text-right px-4 py-3 font-medium", textSecondary)}>Avg 40' Rate</th>
              <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>7D Change</th>
              <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>30D Change</th>
              <th className={cn("text-right px-4 py-3 font-medium", textSecondary)}>Volume (TEU)</th>
              <th className={cn("text-center px-4 py-3 font-medium", textSecondary)}>7D Trend</th>
            </tr>
          </thead>
          <tbody>
            {EMPTY_TRADE_LANES.map((lane) => (
              <tr key={lane.code} className={cn("border-t transition-colors", tableBorder, hoverBg)}>
                <td className="px-4 py-3">
                  <div className={cn("font-medium", textPrimary)}>{lane.lane}</div>
                  <div className={cn("text-xs", textMuted)}>{lane.code}</div>
                </td>
                <td className={cn("px-4 py-3 text-right font-mono", textSecondary)}>{fmtUsd(lane.avgRate20)}</td>
                <td className={cn("px-4 py-3 text-right font-mono font-bold", textPrimary)}>{fmtUsd(lane.avgRate40)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-sm font-medium flex items-center justify-center gap-0.5", lane.change7d > 0 ? "text-red-500" : lane.change7d < 0 ? "text-green-500" : textMuted)}>
                    {lane.change7d > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : lane.change7d < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                    {lane.change7d > 0 ? "+" : ""}{lane.change7d}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-sm font-medium flex items-center justify-center gap-0.5", lane.change30d > 0 ? "text-red-500" : lane.change30d < 0 ? "text-green-500" : textMuted)}>
                    {lane.change30d > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : lane.change30d < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                    {lane.change30d > 0 ? "+" : ""}{lane.change30d}%
                  </span>
                </td>
                <td className={cn("px-4 py-3 text-right font-mono", textSecondary)}>{lane.volume.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">{miniSparkline(lane.trend, isLight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ──────────────────────── TAB: Carrier Directory ──────────────────────── */
  const renderCarriers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", textPrimary)}>Carrier Directory</h2>
        <div className="relative w-60">
          <Search className={cn("absolute left-2.5 top-2.5 w-4 h-4", textMuted)} />
          <Input
            value={searchGeneral}
            onChange={(e) => setSearchGeneral(e.target.value)}
            placeholder="Search carriers..."
            className={cn("pl-9 h-9 text-sm", inputBg)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {EMPTY_CARRIERS.filter((c) => !searchGeneral || c.name.toLowerCase().includes(searchGeneral.toLowerCase()) || c.code.toLowerCase().includes(searchGeneral.toLowerCase()))
          .map((carrier) => (
            <Card key={carrier.code} className={cn(cardBg)}>
              <CardContent className="pt-5">
                {/* Carrier header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold", isLight ? "bg-cyan-50 text-cyan-700" : "bg-cyan-500/10 text-cyan-400")}>
                      {carrier.code.substring(0, 2)}
                    </div>
                    <div>
                      <div className={cn("font-semibold text-base", textPrimary)}>{carrier.name}</div>
                      <div className={cn("text-xs flex items-center gap-1.5", textMuted)}>
                        <Globe className="w-3 h-3" /> {carrier.country}
                        <span className="mx-1">|</span>
                        {carrier.code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className={cn("text-sm font-medium", textPrimary)}>{carrier.rating}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className={cn("rounded-lg p-2 text-center", cardBgAlt)}>
                    <div className={cn("text-xs", textMuted)}>Fleet</div>
                    <div className={cn("text-sm font-bold", textPrimary)}>{carrier.fleetSize}</div>
                  </div>
                  <div className={cn("rounded-lg p-2 text-center", cardBgAlt)}>
                    <div className={cn("text-xs", textMuted)}>Reliability</div>
                    <div className={cn("text-sm font-bold", carrier.reliability >= 90 ? "text-green-500" : "text-amber-500")}>{carrier.reliability}%</div>
                  </div>
                  <div className={cn("rounded-lg p-2 text-center", cardBgAlt)}>
                    <div className={cn("text-xs", textMuted)}>Avg Transit</div>
                    <div className={cn("text-sm font-bold", textPrimary)}>{carrier.avgTransit}d</div>
                  </div>
                  <div className={cn("rounded-lg p-2 text-center", cardBgAlt)}>
                    <div className={cn("text-xs", textMuted)}>Rate Index</div>
                    <div className={cn("text-sm font-bold", carrier.rateIndex <= 95 ? "text-green-500" : carrier.rateIndex >= 105 ? "text-red-500" : textPrimary)}>
                      {carrier.rateIndex}
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-3">
                  <div className={cn("text-xs font-medium mb-1.5", textMuted)}>Services</div>
                  <div className="flex flex-wrap gap-1.5">
                    {carrier.services.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>

                {/* Coverage */}
                <div className="mb-4">
                  <div className={cn("text-xs font-medium mb-1.5", textMuted)}>Coverage</div>
                  <div className="flex flex-wrap gap-1.5">
                    {carrier.coverage.map((c) => (
                      <span key={c} className={cn("text-xs px-2 py-0.5 rounded-full", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700 text-slate-300")}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* Expanded details */}
                <button
                  onClick={() => setExpandedCarrier(expandedCarrier === carrier.code ? null : carrier.code)}
                  className={cn("w-full text-center text-xs py-2 rounded-lg transition-colors", hoverBg, textMuted)}
                >
                  {expandedCarrier === carrier.code ? "Show less" : "View rate details"}
                  {expandedCarrier === carrier.code ? <ChevronDown className="w-3.5 h-3.5 inline ml-1" /> : <ChevronRight className="w-3.5 h-3.5 inline ml-1" />}
                </button>

                {expandedCarrier === carrier.code && (
                  <div className={cn("mt-3 rounded-lg border p-3", tableBorder)}>
                    <div className={cn("text-xs font-medium mb-2", textMuted)}>Available Rates from this Carrier</div>
                    {EMPTY_RATES.filter((r) => r.carrier === carrier.name || r.carrierCode === carrier.code).length > 0 ? (
                      <div className="space-y-2">
                        {EMPTY_RATES.filter((r) => r.carrier === carrier.name || r.carrierCode === carrier.code).map((r) => (
                          <div key={r.id} className={cn("flex items-center justify-between text-sm py-1.5 border-b last:border-0", tableBorder)}>
                            <div>
                              <span className={cn("font-medium", textPrimary)}>{r.polCode} → {r.podCode}</span>
                              <span className={cn("text-xs ml-2", textMuted)}>{r.containerSize}' {r.equipmentType}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn("font-mono font-bold", textPrimary)}>{fmtUsd(r.allInRate)}</span>
                              <Button size="sm" className="h-6 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">Book</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={cn("text-xs text-center py-3", textMuted)}>No rates currently listed. Request a quote for this carrier.</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className={cn("flex-1 gap-1 text-xs", isLight ? "border-slate-300" : "border-slate-600")}>
                    <Eye className="w-3.5 h-3.5" /> Profile
                  </Button>
                  <Button size="sm" className="flex-1 gap-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Send className="w-3.5 h-3.5" /> Request Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  /* ──────────────────────── RENDER ──────────────────────── */
  return (
    <div className={cn("min-h-screen p-4 sm:p-6", bg)}>
      {renderHeader()}
      {renderFilters()}
      {renderTabs()}

      {activeTab === "rates" && renderRateBoard()}
      {activeTab === "sailings" && renderSailings()}
      {activeTab === "spot" && renderSpotMarket()}
      {activeTab === "quotes" && renderQuotes()}
      {activeTab === "analytics" && renderAnalytics()}
      {activeTab === "carriers" && renderCarriers()}
    </div>
  );
}
