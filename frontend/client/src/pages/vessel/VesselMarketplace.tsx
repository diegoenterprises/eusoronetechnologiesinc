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

/* ──────────────────────── MOCK DATA ──────────────────────── */

const MOCK_RATES: TradeRate[] = [
  { id: "r1", carrier: "Maersk Line", carrierCode: "MAEU", pol: "Shanghai", polCode: "CNSHA", pod: "Los Angeles", podCode: "USLAX", containerSize: "40", equipmentType: "dry", rate: 2450, currency: "USD", transitDays: 14, freeTimeDays: 7, validFrom: "2026-03-25", validTo: "2026-04-10", spaceAvailable: 120, reliability: 94, surcharges: 380, allInRate: 2830 },
  { id: "r2", carrier: "MSC", carrierCode: "MSCU", pol: "Shanghai", polCode: "CNSHA", pod: "Los Angeles", podCode: "USLAX", containerSize: "40", equipmentType: "dry", rate: 2320, currency: "USD", transitDays: 16, freeTimeDays: 5, validFrom: "2026-03-25", validTo: "2026-04-15", spaceAvailable: 85, reliability: 89, surcharges: 410, allInRate: 2730 },
  { id: "r3", carrier: "CMA CGM", carrierCode: "CMDU", pol: "Ningbo", polCode: "CNNGB", pod: "Rotterdam", podCode: "NLRTM", containerSize: "40HC", equipmentType: "dry", rate: 1980, currency: "USD", transitDays: 28, freeTimeDays: 10, validFrom: "2026-03-20", validTo: "2026-04-20", spaceAvailable: 200, reliability: 91, surcharges: 320, allInRate: 2300 },
  { id: "r4", carrier: "Hapag-Lloyd", carrierCode: "HLCU", pol: "Busan", polCode: "KRPUS", pod: "Hamburg", podCode: "DEHAM", containerSize: "40", equipmentType: "reefer", rate: 4200, currency: "USD", transitDays: 32, freeTimeDays: 7, validFrom: "2026-03-28", validTo: "2026-04-12", spaceAvailable: 40, reliability: 96, surcharges: 550, allInRate: 4750 },
  { id: "r5", carrier: "COSCO", carrierCode: "COSU", pol: "Shenzhen", polCode: "CNSZX", pod: "Long Beach", podCode: "USLGB", containerSize: "20", equipmentType: "dry", rate: 1450, currency: "USD", transitDays: 15, freeTimeDays: 7, validFrom: "2026-03-22", validTo: "2026-04-05", spaceAvailable: 300, reliability: 87, surcharges: 280, allInRate: 1730 },
  { id: "r6", carrier: "ONE", carrierCode: "ONEY", pol: "Tokyo", polCode: "JPTYO", pod: "Seattle", podCode: "USSEA", containerSize: "40HC", equipmentType: "dry", rate: 2100, currency: "USD", transitDays: 12, freeTimeDays: 5, validFrom: "2026-03-26", validTo: "2026-04-10", spaceAvailable: 65, reliability: 92, surcharges: 350, allInRate: 2450 },
  { id: "r7", carrier: "Evergreen", carrierCode: "EGLV", pol: "Kaohsiung", polCode: "TWKHH", pod: "Savannah", podCode: "USSAV", containerSize: "45", equipmentType: "dry", rate: 2680, currency: "USD", transitDays: 22, freeTimeDays: 7, validFrom: "2026-03-24", validTo: "2026-04-08", spaceAvailable: 50, reliability: 90, surcharges: 420, allInRate: 3100 },
  { id: "r8", carrier: "Yang Ming", carrierCode: "YMLU", pol: "Ho Chi Minh", polCode: "VNSGN", pod: "New York", podCode: "USNYC", containerSize: "40", equipmentType: "flat", rate: 3100, currency: "USD", transitDays: 30, freeTimeDays: 5, validFrom: "2026-03-27", validTo: "2026-04-11", spaceAvailable: 25, reliability: 85, surcharges: 480, allInRate: 3580 },
];

const MOCK_SAILINGS: Sailing[] = [
  { id: "s1", vesselName: "Maersk Enshi", imo: "9632058", carrier: "Maersk", service: "AE7", pol: "Shanghai", pod: "Los Angeles", etd: "2026-04-02", eta: "2026-04-16", transitDays: 14, cutOffDate: "2026-03-31", cutOffTime: "16:00", siCutOff: "2026-03-30", availableTeu: 120, totalTeu: 14000, containerSizes: ["20", "40", "40HC"], equipmentTypes: ["dry", "reefer"], rate: 2450, status: "open" },
  { id: "s2", vesselName: "MSC Isabella", imo: "9839284", carrier: "MSC", service: "Jade", pol: "Ningbo", pod: "Rotterdam", etd: "2026-04-05", eta: "2026-05-03", transitDays: 28, cutOffDate: "2026-04-03", cutOffTime: "12:00", siCutOff: "2026-04-02", availableTeu: 85, totalTeu: 23756, containerSizes: ["20", "40", "40HC", "45"], equipmentTypes: ["dry", "reefer", "flat"], rate: 1980, status: "open" },
  { id: "s3", vesselName: "CMA CGM Antoine", imo: "9454412", carrier: "CMA CGM", service: "FAL1", pol: "Busan", pod: "Hamburg", etd: "2026-04-08", eta: "2026-05-10", transitDays: 32, cutOffDate: "2026-04-06", cutOffTime: "18:00", siCutOff: "2026-04-05", availableTeu: 40, totalTeu: 16020, containerSizes: ["20", "40", "40HC"], equipmentTypes: ["dry", "reefer", "open_top"], rate: 4200, status: "limited" },
  { id: "s4", vesselName: "COSCO Universe", imo: "9795645", carrier: "COSCO", service: "CEN", pol: "Shenzhen", pod: "Long Beach", etd: "2026-04-01", eta: "2026-04-16", transitDays: 15, cutOffDate: "2026-03-30", cutOffTime: "14:00", siCutOff: "2026-03-29", availableTeu: 300, totalTeu: 19100, containerSizes: ["20", "40", "40HC"], equipmentTypes: ["dry"], rate: 1450, status: "open" },
  { id: "s5", vesselName: "ONE Apus", imo: "9806079", carrier: "ONE", service: "PS3", pol: "Tokyo", pod: "Seattle", etd: "2026-04-03", eta: "2026-04-15", transitDays: 12, cutOffDate: "2026-04-01", cutOffTime: "16:00", siCutOff: "2026-03-31", availableTeu: 65, totalTeu: 14052, containerSizes: ["20", "40", "40HC"], equipmentTypes: ["dry", "reefer"], rate: 2100, status: "open" },
  { id: "s6", vesselName: "Evergreen Ace", imo: "9811000", carrier: "Evergreen", service: "CIX", pol: "Kaohsiung", pod: "Savannah", etd: "2026-04-10", eta: "2026-05-02", transitDays: 22, cutOffDate: "2026-04-08", cutOffTime: "10:00", siCutOff: "2026-04-07", availableTeu: 50, totalTeu: 12000, containerSizes: ["20", "40", "40HC", "45"], equipmentTypes: ["dry", "flat"], rate: 2680, status: "limited" },
];

const MOCK_SPOT_DEALS: SpotDeal[] = [
  { id: "d1", carrier: "MSC", pol: "Shanghai", pod: "Los Angeles", containerSize: "40", equipmentType: "dry", originalRate: 2320, spotRate: 1850, discount: 20, expiresAt: "2026-03-30T23:59:59Z", remainingSlots: 15, sailDate: "2026-04-02", vesselName: "MSC Gulsun", tag: "flash_sale" },
  { id: "d2", carrier: "CMA CGM", pol: "Rotterdam", pod: "Shanghai", containerSize: "40HC", equipmentType: "dry", originalRate: 1200, spotRate: 680, discount: 43, expiresAt: "2026-03-31T12:00:00Z", remainingSlots: 40, sailDate: "2026-04-05", vesselName: "CMA CGM Thalassa", tag: "backhaul" },
  { id: "d3", carrier: "Hapag-Lloyd", pol: "Hamburg", pod: "New York", containerSize: "20", equipmentType: "dry", originalRate: 1800, spotRate: 1440, discount: 20, expiresAt: "2026-04-01T06:00:00Z", remainingSlots: 8, sailDate: "2026-04-01", vesselName: "Berlin Express", tag: "last_minute" },
  { id: "d4", carrier: "COSCO", pol: "Shenzhen", pod: "Long Beach", containerSize: "40", equipmentType: "dry", originalRate: 2200, spotRate: 1760, discount: 20, expiresAt: "2026-04-03T18:00:00Z", remainingSlots: 50, sailDate: "2026-04-08", vesselName: "COSCO Faith", tag: "bulk_discount" },
  { id: "d5", carrier: "ONE", pol: "Tokyo", pod: "Vancouver", containerSize: "40HC", equipmentType: "reefer", originalRate: 4800, spotRate: 3600, discount: 25, expiresAt: "2026-03-30T18:00:00Z", remainingSlots: 5, sailDate: "2026-04-01", vesselName: "ONE Owl", tag: "last_minute" },
  { id: "d6", carrier: "Evergreen", pol: "Kaohsiung", pod: "Felixstowe", containerSize: "40", equipmentType: "dry", originalRate: 2100, spotRate: 1680, discount: 20, expiresAt: "2026-04-02T23:59:59Z", remainingSlots: 30, sailDate: "2026-04-10", vesselName: "Ever Ace", tag: "flash_sale" },
];

const MOCK_QUOTES: Quote[] = [
  { id: "q1", refNumber: "QTE-2026-0341", pol: "Shanghai", pod: "Los Angeles", containerSize: "40HC", equipmentType: "dry", quantity: 10, requestedDate: "2026-04-05", status: "received", responses: [{ carrier: "Maersk", rate: 2380, transitDays: 14, freeTime: 7, validUntil: "2026-04-02", notes: "Priority loading" }, { carrier: "MSC", rate: 2250, transitDays: 16, freeTime: 5, validUntil: "2026-04-03", notes: "Subject to space" }, { carrier: "COSCO", rate: 2180, transitDays: 15, freeTime: 7, validUntil: "2026-04-01", notes: "" }], createdAt: "2026-03-25" },
  { id: "q2", refNumber: "QTE-2026-0342", pol: "Busan", pod: "Hamburg", containerSize: "40", equipmentType: "reefer", quantity: 5, requestedDate: "2026-04-12", status: "pending", responses: [], createdAt: "2026-03-28" },
  { id: "q3", refNumber: "QTE-2026-0340", pol: "Ho Chi Minh", pod: "Savannah", containerSize: "20", equipmentType: "dry", quantity: 20, requestedDate: "2026-03-20", status: "accepted", responses: [{ carrier: "Yang Ming", rate: 1580, transitDays: 28, freeTime: 5, validUntil: "2026-03-22", notes: "Accepted — booking BK-91203" }], createdAt: "2026-03-18" },
  { id: "q4", refNumber: "QTE-2026-0338", pol: "Ningbo", pod: "Rotterdam", containerSize: "40HC", equipmentType: "dry", quantity: 15, requestedDate: "2026-03-15", status: "expired", responses: [{ carrier: "CMA CGM", rate: 2050, transitDays: 28, freeTime: 10, validUntil: "2026-03-20", notes: "Expired" }], createdAt: "2026-03-12" },
];

const MOCK_TRADE_LANES: TradeLane[] = [
  { lane: "Asia — US West Coast", code: "ASWC", avgRate20: 1480, avgRate40: 2380, change7d: -3.2, change30d: -8.5, volume: 42500, trend: [2600, 2550, 2500, 2480, 2430, 2400, 2380] },
  { lane: "Asia — US East Coast", code: "ASEC", avgRate20: 2100, avgRate40: 3250, change7d: 1.8, change30d: -2.1, volume: 28300, trend: [3300, 3280, 3200, 3220, 3240, 3260, 3250] },
  { lane: "Asia — Europe", code: "ASEU", avgRate20: 1320, avgRate40: 2050, change7d: -5.1, change30d: -12.4, volume: 56200, trend: [2350, 2280, 2200, 2150, 2100, 2080, 2050] },
  { lane: "Transatlantic", code: "TRAT", avgRate20: 1150, avgRate40: 1800, change7d: 0.5, change30d: 2.3, volume: 18400, trend: [1760, 1770, 1780, 1790, 1785, 1795, 1800] },
  { lane: "Asia — Mediterranean", code: "ASMD", avgRate20: 1280, avgRate40: 1950, change7d: -2.0, change30d: -6.8, volume: 22100, trend: [2100, 2080, 2040, 2000, 1980, 1960, 1950] },
  { lane: "Asia — Middle East", code: "ASME", avgRate20: 980, avgRate40: 1520, change7d: 3.1, change30d: 5.4, volume: 15800, trend: [1440, 1460, 1470, 1490, 1500, 1510, 1520] },
];

const MOCK_CARRIERS: CarrierInfo[] = [
  { name: "Maersk Line", code: "MAEU", country: "Denmark", fleetSize: 708, services: ["AE7", "AE2", "TP6", "TP12"], reliability: 94, avgTransit: 14, rateIndex: 102, coverage: ["Asia", "Europe", "N. America", "Africa", "Oceania"], rating: 4.7 },
  { name: "MSC", code: "MSCU", country: "Switzerland", fleetSize: 760, services: ["Jade", "Griffin", "Swan", "Lion"], reliability: 89, avgTransit: 16, rateIndex: 96, coverage: ["Asia", "Europe", "N. America", "S. America", "Africa"], rating: 4.3 },
  { name: "CMA CGM", code: "CMDU", country: "France", fleetSize: 590, services: ["FAL1", "FAL3", "NWX", "ASIA-MED"], reliability: 91, avgTransit: 18, rateIndex: 98, coverage: ["Asia", "Europe", "N. America", "S. America", "Mediterranean"], rating: 4.5 },
  { name: "COSCO Shipping", code: "COSU", country: "China", fleetSize: 510, services: ["CEN", "CPNW", "AAC"], reliability: 87, avgTransit: 15, rateIndex: 89, coverage: ["Asia", "Europe", "N. America"], rating: 4.1 },
  { name: "Hapag-Lloyd", code: "HLCU", country: "Germany", fleetSize: 260, services: ["AL3", "AL5", "EC5"], reliability: 96, avgTransit: 20, rateIndex: 108, coverage: ["Asia", "Europe", "N. America", "S. America"], rating: 4.8 },
  { name: "ONE", code: "ONEY", country: "Japan", fleetSize: 210, services: ["PS3", "PS7", "FP2"], reliability: 92, avgTransit: 13, rateIndex: 100, coverage: ["Asia", "N. America", "Europe"], rating: 4.4 },
  { name: "Evergreen", code: "EGLV", country: "Taiwan", fleetSize: 200, services: ["CIX", "CEM", "NUE"], reliability: 90, avgTransit: 17, rateIndex: 94, coverage: ["Asia", "Europe", "N. America", "S. America"], rating: 4.2 },
  { name: "Yang Ming", code: "YMLU", country: "Taiwan", fleetSize: 90, services: ["CPS", "CPI", "TA2"], reliability: 85, avgTransit: 22, rateIndex: 88, coverage: ["Asia", "Europe", "N. America"], rating: 3.9 },
];

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
    let data = [...MOCK_RATES];
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
    let data = [...MOCK_SAILINGS];
    if (searchPol) data = data.filter((s) => s.pol.toLowerCase().includes(searchPol.toLowerCase()));
    if (searchPod) data = data.filter((s) => s.pod.toLowerCase().includes(searchPod.toLowerCase()));
    if (selectedContainer) data = data.filter((s) => s.containerSizes.includes(selectedContainer));
    if (selectedEquipment) data = data.filter((s) => s.equipmentTypes.includes(selectedEquipment));
    return data;
  }, [searchPol, searchPod, selectedContainer, selectedEquipment]);

  const filteredSpotDeals = useMemo(() => {
    let data = [...MOCK_SPOT_DEALS];
    if (searchPol) data = data.filter((d) => d.pol.toLowerCase().includes(searchPol.toLowerCase()));
    if (searchPod) data = data.filter((d) => d.pod.toLowerCase().includes(searchPod.toLowerCase()));
    if (selectedContainer) data = data.filter((d) => d.containerSize === selectedContainer);
    if (selectedEquipment) data = data.filter((d) => d.equipmentType === selectedEquipment);
    return data;
  }, [searchPol, searchPod, selectedContainer, selectedEquipment]);

  const totalListings = MOCK_RATES.length + MOCK_SAILINGS.length + MOCK_SPOT_DEALS.length;

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
            <span className="font-medium">{MOCK_CARRIERS.length}</span> carriers
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
      { key: "quotes", label: "My Quotes", icon: <FileText className="w-4 h-4" />, count: MOCK_QUOTES.length },
      { key: "analytics", label: "Trade Lanes", icon: <BarChart3 className="w-4 h-4" /> },
      { key: "carriers", label: "Carriers", icon: <Building2 className="w-4 h-4" />, count: MOCK_CARRIERS.length },
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
          const count = MOCK_QUOTES.filter((q) => q.status === status).length;
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
        {MOCK_QUOTES.map((q) => (
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
          { label: "Avg 40' Rate", value: fmtUsd(Math.round(MOCK_TRADE_LANES.reduce((s, l) => s + l.avgRate40, 0) / MOCK_TRADE_LANES.length)), change: -4.2, icon: <DollarSign className="w-5 h-5 text-cyan-500" /> },
          { label: "Total Volume", value: `${(MOCK_TRADE_LANES.reduce((s, l) => s + l.volume, 0) / 1000).toFixed(0)}K TEU`, change: 2.1, icon: <Package className="w-5 h-5 text-blue-500" /> },
          { label: "Lanes Tracked", value: MOCK_TRADE_LANES.length.toString(), change: 0, icon: <Globe className="w-5 h-5 text-emerald-500" /> },
          { label: "Lowest Rate", value: fmtUsd(Math.min(...MOCK_TRADE_LANES.map((l) => l.avgRate40))), change: -6.8, icon: <TrendingDown className="w-5 h-5 text-green-500" /> },
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
            {MOCK_TRADE_LANES.map((lane) => (
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
        {MOCK_CARRIERS.filter((c) => !searchGeneral || c.name.toLowerCase().includes(searchGeneral.toLowerCase()) || c.code.toLowerCase().includes(searchGeneral.toLowerCase()))
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
                    {MOCK_RATES.filter((r) => r.carrier === carrier.name || r.carrierCode === carrier.code).length > 0 ? (
                      <div className="space-y-2">
                        {MOCK_RATES.filter((r) => r.carrier === carrier.name || r.carrierCode === carrier.code).map((r) => (
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
