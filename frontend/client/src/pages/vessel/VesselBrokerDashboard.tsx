/**
 * VESSEL BROKER DASHBOARD — Ocean Freight Brokerage Command Center
 * A vessel broker matches ocean freight shippers with shipping lines/carriers.
 * Booking pipeline, rate shopping, carrier schedules, customer portfolio,
 * commission tracking, and full financial overview.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
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
  Users,
  BarChart3,
  Globe,
  Calendar,
  Container,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  Zap,
  Award,
  Briefcase,
  CircleDot,
  Navigation,
  Phone,
  Mail,
  Building2,
  Banknote,
  PieChart,
  Receipt,
  CreditCard,
  Wallet,
  Target,
  ThumbsUp,
  Percent,
  Hash,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ──────────────────────── TYPES ──────────────────────── */

type PipelineStage = "quote_requested" | "quoted" | "booked" | "in_transit" | "delivered";

interface PipelineItem {
  stage: PipelineStage;
  label: string;
  count: number;
  value: number;
  color: string;
  iconColor: string;
}

interface ShippingRate {
  carrier: string;
  logo: string;
  rate20ft: number;
  rate40ft: number;
  rate40hc: number;
  transitDays: number;
  validUntil: string;
  freeTime: number;
  reliability: number;
  isBestRate?: boolean;
}

interface CarrierSailing {
  id: string;
  carrier: string;
  vesselName: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  transitDays: number;
  spaceAvailable: number;
  totalCapacity: number;
  cutoffDate: string;
}

interface Booking {
  id: string;
  bookingRef: string;
  shipper: string;
  carrier: string;
  pol: string;
  pod: string;
  status: "confirmed" | "pending" | "shipped" | "delivered";
  containerCount: number;
  containerSize: string;
  commodity: string;
  value: number;
  etd: string;
  eta: string;
  commission: number;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  totalRevenue: number;
  bookingCount: number;
  avgBookingValue: number;
  satisfactionScore: number;
  lastBooking: string;
  status: "active" | "inactive" | "prospect";
  topLane: string;
}

interface RevenueLane {
  lane: string;
  revenue: number;
  bookings: number;
  avgMargin: number;
}

/* ──────────────────────── MOCK DATA ──────────────────────── */

const BROKER_INFO = {
  name: "Marcus Delgado",
  company: "Eusorone Maritime Brokerage",
  brokerId: "EMB-2024-0847",
  licenseNo: "FMC-027843",
  since: "2019",
};

const PIPELINE_DATA: PipelineItem[] = [
  { stage: "quote_requested", label: "Quote Requested", count: 23, value: 892400, color: "from-amber-500 to-orange-500", iconColor: "text-amber-400" },
  { stage: "quoted", label: "Quoted", count: 18, value: 1245000, color: "from-blue-500 to-indigo-500", iconColor: "text-blue-400" },
  { stage: "booked", label: "Booked", count: 31, value: 2180000, color: "from-emerald-500 to-teal-500", iconColor: "text-emerald-400" },
  { stage: "in_transit", label: "In Transit", count: 47, value: 4530000, color: "from-purple-500 to-violet-500", iconColor: "text-purple-400" },
  { stage: "delivered", label: "Delivered", count: 156, value: 12740000, color: "from-green-500 to-lime-500", iconColor: "text-green-400" },
];

const SHIPPING_RATES: ShippingRate[] = [
  { carrier: "Maersk", logo: "MK", rate20ft: 1850, rate40ft: 2950, rate40hc: 3150, transitDays: 28, validUntil: "2026-04-15", freeTime: 14, reliability: 94 },
  { carrier: "MSC", logo: "MS", rate20ft: 1720, rate40ft: 2780, rate40hc: 2980, transitDays: 30, validUntil: "2026-04-12", freeTime: 10, reliability: 89, isBestRate: true },
  { carrier: "CMA CGM", logo: "CM", rate20ft: 1900, rate40ft: 3020, rate40hc: 3220, transitDays: 26, validUntil: "2026-04-18", freeTime: 14, reliability: 92 },
  { carrier: "COSCO", logo: "CO", rate20ft: 1680, rate40ft: 2700, rate40hc: 2900, transitDays: 32, validUntil: "2026-04-10", freeTime: 7, reliability: 86 },
  { carrier: "Hapag-Lloyd", logo: "HL", rate20ft: 1950, rate40ft: 3100, rate40hc: 3300, transitDays: 27, validUntil: "2026-04-20", freeTime: 14, reliability: 96 },
  { carrier: "ONE", logo: "ON", rate20ft: 1790, rate40ft: 2880, rate40hc: 3080, transitDays: 29, validUntil: "2026-04-14", freeTime: 12, reliability: 91 },
  { carrier: "Evergreen", logo: "EV", rate20ft: 1760, rate40ft: 2820, rate40hc: 3020, transitDays: 31, validUntil: "2026-04-11", freeTime: 10, reliability: 88 },
  { carrier: "ZIM", logo: "ZM", rate20ft: 1640, rate40ft: 2650, rate40hc: 2850, transitDays: 34, validUntil: "2026-04-08", freeTime: 7, reliability: 82 },
];

const CARRIER_SAILINGS: CarrierSailing[] = [
  { id: "S001", carrier: "Maersk", vesselName: "M/V Maersk Emerald", voyage: "MA-426E", pol: "Shanghai (CNSHA)", pod: "Rotterdam (NLRTM)", etd: "2026-04-02", eta: "2026-04-30", transitDays: 28, spaceAvailable: 420, totalCapacity: 2200, cutoffDate: "2026-03-31" },
  { id: "S002", carrier: "MSC", vesselName: "MSC Splendida", voyage: "MS-891W", pol: "Shanghai (CNSHA)", pod: "Rotterdam (NLRTM)", etd: "2026-04-04", eta: "2026-05-04", transitDays: 30, spaceAvailable: 180, totalCapacity: 2800, cutoffDate: "2026-04-02" },
  { id: "S003", carrier: "CMA CGM", vesselName: "CMA CGM Antoine", voyage: "CG-334E", pol: "Shanghai (CNSHA)", pod: "Rotterdam (NLRTM)", etd: "2026-04-06", eta: "2026-05-02", transitDays: 26, spaceAvailable: 550, totalCapacity: 2400, cutoffDate: "2026-04-04" },
  { id: "S004", carrier: "COSCO", vesselName: "COSCO Galaxy", voyage: "CS-112E", pol: "Shanghai (CNSHA)", pod: "Rotterdam (NLRTM)", etd: "2026-04-08", eta: "2026-05-10", transitDays: 32, spaceAvailable: 90, totalCapacity: 1800, cutoffDate: "2026-04-06" },
  { id: "S005", carrier: "Hapag-Lloyd", vesselName: "Hamburg Express", voyage: "HL-207E", pol: "Shanghai (CNSHA)", pod: "Rotterdam (NLRTM)", etd: "2026-04-10", eta: "2026-05-07", transitDays: 27, spaceAvailable: 320, totalCapacity: 2100, cutoffDate: "2026-04-08" },
  { id: "S006", carrier: "ONE", vesselName: "ONE Magnificence", voyage: "ON-508E", pol: "Ningbo (CNNGB)", pod: "Long Beach (USLGB)", etd: "2026-04-03", eta: "2026-04-18", transitDays: 15, spaceAvailable: 250, totalCapacity: 2000, cutoffDate: "2026-04-01" },
  { id: "S007", carrier: "Evergreen", vesselName: "Ever Golden", voyage: "EG-224W", pol: "Busan (KRPUS)", pod: "Los Angeles (USLAX)", etd: "2026-04-05", eta: "2026-04-19", transitDays: 14, spaceAvailable: 380, totalCapacity: 2500, cutoffDate: "2026-04-03" },
  { id: "S008", carrier: "ZIM", vesselName: "ZIM Toscana", voyage: "ZM-019E", pol: "Haifa (ILHFA)", pod: "Savannah (USSAV)", etd: "2026-04-07", eta: "2026-04-25", transitDays: 18, spaceAvailable: 610, totalCapacity: 1600, cutoffDate: "2026-04-05" },
];

const MY_BOOKINGS: Booking[] = [
  { id: "B001", bookingRef: "EMB-2026-4201", shipper: "GlobalTex Industries", carrier: "Maersk", pol: "Shanghai", pod: "Rotterdam", status: "shipped", containerCount: 8, containerSize: "40HC", commodity: "Textiles", value: 184000, etd: "2026-03-15", eta: "2026-04-12", commission: 5520 },
  { id: "B002", bookingRef: "EMB-2026-4198", shipper: "Pacific Harvest Co", carrier: "CMA CGM", pol: "Ho Chi Minh", pod: "Hamburg", status: "confirmed", containerCount: 12, containerSize: "40RF", commodity: "Frozen Seafood", value: 312000, etd: "2026-04-02", eta: "2026-05-01", commission: 9360 },
  { id: "B003", bookingRef: "EMB-2026-4195", shipper: "Andean Metals Corp", carrier: "MSC", pol: "Callao", pod: "Antwerp", status: "shipped", containerCount: 20, containerSize: "20GP", commodity: "Copper Cathode", value: 980000, etd: "2026-03-10", eta: "2026-04-08", commission: 29400 },
  { id: "B004", bookingRef: "EMB-2026-4190", shipper: "EastWind Electronics", carrier: "Hapag-Lloyd", pol: "Shenzhen", pod: "Long Beach", status: "pending", containerCount: 6, containerSize: "40HC", commodity: "Consumer Electronics", value: 456000, etd: "2026-04-10", eta: "2026-04-28", commission: 13680 },
  { id: "B005", bookingRef: "EMB-2026-4188", shipper: "SugarCane Exports", carrier: "ONE", pol: "Santos", pod: "Jeddah", status: "delivered", containerCount: 30, containerSize: "20GP", commodity: "Raw Sugar", value: 420000, etd: "2026-02-20", eta: "2026-03-18", commission: 12600 },
  { id: "B006", bookingRef: "EMB-2026-4185", shipper: "Nordic Timber AB", carrier: "Evergreen", pol: "Gothenburg", pod: "Yokohama", status: "shipped", containerCount: 15, containerSize: "40OT", commodity: "Lumber", value: 225000, etd: "2026-03-12", eta: "2026-04-15", commission: 6750 },
  { id: "B007", bookingRef: "EMB-2026-4180", shipper: "Rhine Chemical GmbH", carrier: "ZIM", pol: "Rotterdam", pod: "Mumbai", status: "confirmed", containerCount: 4, containerSize: "20TK", commodity: "Industrial Chemicals", value: 168000, etd: "2026-04-05", eta: "2026-04-28", commission: 5040 },
  { id: "B008", bookingRef: "EMB-2026-4176", shipper: "AutoParts Direct", carrier: "COSCO", pol: "Busan", pod: "Savannah", status: "pending", containerCount: 10, containerSize: "40HC", commodity: "Auto Parts", value: 290000, etd: "2026-04-08", eta: "2026-04-26", commission: 8700 },
];

const CUSTOMERS: Customer[] = [
  { id: "C001", name: "James Wong", company: "GlobalTex Industries", totalRevenue: 2840000, bookingCount: 47, avgBookingValue: 60425, satisfactionScore: 4.8, lastBooking: "2026-03-28", status: "active", topLane: "CNSHA → NLRTM" },
  { id: "C002", name: "Maria Santos", company: "Pacific Harvest Co", totalRevenue: 1920000, bookingCount: 28, avgBookingValue: 68571, satisfactionScore: 4.6, lastBooking: "2026-03-25", status: "active", topLane: "VNSGN → DEHAM" },
  { id: "C003", name: "Roberto Alvarez", company: "Andean Metals Corp", totalRevenue: 4100000, bookingCount: 52, avgBookingValue: 78846, satisfactionScore: 4.9, lastBooking: "2026-03-27", status: "active", topLane: "PECLL → BEANR" },
  { id: "C004", name: "Li Wei Chen", company: "EastWind Electronics", totalRevenue: 3200000, bookingCount: 38, avgBookingValue: 84210, satisfactionScore: 4.5, lastBooking: "2026-03-22", status: "active", topLane: "CNSZX → USLGB" },
  { id: "C005", name: "Fatima Al-Rashid", company: "SugarCane Exports", totalRevenue: 1450000, bookingCount: 22, avgBookingValue: 65909, satisfactionScore: 4.7, lastBooking: "2026-03-20", status: "active", topLane: "BRSSZ → SAJED" },
  { id: "C006", name: "Erik Lindqvist", company: "Nordic Timber AB", totalRevenue: 890000, bookingCount: 15, avgBookingValue: 59333, satisfactionScore: 4.3, lastBooking: "2026-03-12", status: "active", topLane: "SEGOT → JPYOK" },
  { id: "C007", name: "Hans Mueller", company: "Rhine Chemical GmbH", totalRevenue: 670000, bookingCount: 11, avgBookingValue: 60909, satisfactionScore: 4.4, lastBooking: "2026-03-05", status: "inactive", topLane: "NLRTM → INMUN" },
  { id: "C008", name: "David Park", company: "AutoParts Direct", totalRevenue: 1100000, bookingCount: 19, avgBookingValue: 57894, satisfactionScore: 4.2, lastBooking: "2026-03-18", status: "active", topLane: "KRPUS → USSAV" },
];

const REVENUE_LANES: RevenueLane[] = [
  { lane: "CNSHA → NLRTM", revenue: 4280000, bookings: 89, avgMargin: 3.2 },
  { lane: "CNSZX → USLGB", revenue: 3650000, bookings: 64, avgMargin: 2.8 },
  { lane: "PECLL → BEANR", revenue: 2900000, bookings: 42, avgMargin: 3.5 },
  { lane: "VNSGN → DEHAM", revenue: 2100000, bookings: 38, avgMargin: 3.0 },
  { lane: "BRSSZ → SAJED", revenue: 1580000, bookings: 25, avgMargin: 2.6 },
  { lane: "KRPUS → USSAV", revenue: 1200000, bookings: 21, avgMargin: 3.1 },
];

const FINANCIAL = {
  commission: { week: 42800, month: 187500, quarter: 524000, year: 2140000 },
  receivables: { current: 128500, overdue30: 34200, overdue60: 12800, overdue90: 4500 },
  margins: { avg: 3.1, best: 4.2, worst: 1.8, trend: "up" as const },
  targets: { monthlyTarget: 250000, monthlyActual: 187500, yearlyTarget: 2500000, yearlyActual: 2140000 },
};

/* ──────────────────────── HELPERS ──────────────────────── */

const fmtCurrency = (val: number) =>
  val >= 1_000_000
    ? `$${(val / 1_000_000).toFixed(1)}M`
    : val >= 1_000
    ? `$${(val / 1_000).toFixed(0)}K`
    : `$${val.toLocaleString()}`;

const fmtCurrencyFull = (val: number) =>
  `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtDateFull = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const bookingStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: "Confirmed", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  shipped: { label: "Shipped", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: <Ship className="w-3 h-3" /> },
  delivered: { label: "Delivered", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
};

/* ──────────────────────── SKELETON ──────────────────────── */

function DashboardSkeleton({ isLight }: { isLight: boolean }) {
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  return (
    <div className={cn("min-h-screen p-6", isLight ? "bg-slate-50" : "bg-[#0a0a0a]")}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className={cn("h-14 w-14 rounded-xl", cardBg)} />
          <div className="space-y-2">
            <Skeleton className={cn("h-7 w-72", cardBg)} />
            <Skeleton className={cn("h-4 w-48", cardBg)} />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-28 rounded-xl", cardBg)} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-96 rounded-xl", cardBg)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */

export default function VesselBrokerDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* ── State ── */
  const [activePipelineStage, setActivePipelineStage] = useState<PipelineStage | null>(null);
  const [rateSearchPol, setRateSearchPol] = useState("Shanghai (CNSHA)");
  const [rateSearchPod, setRateSearchPod] = useState("Rotterdam (NLRTM)");
  const [rateSearchSize, setRateSearchSize] = useState<"20GP" | "40GP" | "40HC">("40HC");
  const [rateSearchCommodity, setRateSearchCommodity] = useState("General Cargo");
  const [rateSortBy, setRateSortBy] = useState<"rate" | "transit" | "reliability">("rate");
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [customerSort, setCustomerSort] = useState<"revenue" | "bookings" | "satisfaction">("revenue");
  const [financialTab, setFinancialTab] = useState<"commission" | "receivables" | "lanes" | "margins">("commission");
  const [isLoading, setIsLoading] = useState(false);

  /* ── tRPC queries (graceful fallback to mock) ── */
  const bookingsQuery = (trpc as any).vesselShipments?.searchVesselBookings?.useQuery?.({}, { enabled: true }) ?? { data: null, isLoading: false };
  const financialQuery = (trpc as any).vesselShipments?.getVesselFinancialSummary?.useQuery?.({}, { enabled: true }) ?? { data: null, isLoading: false };

  /* ── Derived data ── */
  const sortedRates = useMemo(() => {
    const rates = [...SHIPPING_RATES];
    if (rateSortBy === "rate") {
      rates.sort((a, b) => a.rate40hc - b.rate40hc);
    } else if (rateSortBy === "transit") {
      rates.sort((a, b) => a.transitDays - b.transitDays);
    } else {
      rates.sort((a, b) => b.reliability - a.reliability);
    }
    // Mark best rate
    const minRate = Math.min(...rates.map((r) => r.rate40hc));
    return rates.map((r) => ({ ...r, isBestRate: r.rate40hc === minRate }));
  }, [rateSortBy]);

  const filteredBookings = useMemo(() => {
    let bookings = [...MY_BOOKINGS];
    if (bookingFilter !== "all") {
      bookings = bookings.filter((b) => b.status === bookingFilter);
    }
    if (activePipelineStage) {
      const stageToStatus: Record<PipelineStage, string[]> = {
        quote_requested: ["pending"],
        quoted: ["pending"],
        booked: ["confirmed"],
        in_transit: ["shipped"],
        delivered: ["delivered"],
      };
      const allowed = stageToStatus[activePipelineStage];
      if (allowed) bookings = bookings.filter((b) => allowed.includes(b.status));
    }
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.bookingRef.toLowerCase().includes(q) ||
          b.shipper.toLowerCase().includes(q) ||
          b.commodity.toLowerCase().includes(q) ||
          b.carrier.toLowerCase().includes(q)
      );
    }
    return bookings;
  }, [bookingFilter, activePipelineStage, bookingSearch]);

  const sortedCustomers = useMemo(() => {
    const customers = [...CUSTOMERS];
    if (customerSort === "revenue") customers.sort((a, b) => b.totalRevenue - a.totalRevenue);
    else if (customerSort === "bookings") customers.sort((a, b) => b.bookingCount - a.bookingCount);
    else customers.sort((a, b) => b.satisfactionScore - a.satisfactionScore);
    return customers;
  }, [customerSort]);

  /* ── Theme tokens ── */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const cardBgHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/40";
  const text = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-700" : "text-slate-200";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const dimmed = isLight ? "text-slate-400" : "text-slate-500";
  const border = isLight ? "border-slate-200" : "border-slate-700/50";
  const inputBg = isLight ? "bg-slate-100 border-slate-200" : "bg-slate-700/50 border-slate-600/50";
  const rowBg = isLight ? "bg-slate-50/50" : "bg-slate-700/20";
  const rowHover = isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/40";
  const headerBg = isLight ? "bg-slate-100" : "bg-slate-700/30";
  const accentGradient = isLight
    ? "bg-gradient-to-br from-cyan-100 to-blue-100"
    : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20";

  if (isLoading) return <DashboardSkeleton isLight={isLight} />;

  /* ──────────────────────── Quick Stats ──────────────────────── */
  const quickStats = [
    { label: "Active Bookings", value: "78", icon: <Package className="w-5 h-5" />, color: "text-blue-400", bg: isLight ? "bg-blue-50" : "bg-blue-500/10" },
    { label: "Pending Quotes", value: "23", icon: <FileText className="w-5 h-5" />, color: "text-amber-400", bg: isLight ? "bg-amber-50" : "bg-amber-500/10" },
    { label: "Monthly Revenue", value: "$187.5K", icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400", bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10" },
    { label: "Commission MTD", value: "$42.8K", icon: <Wallet className="w-5 h-5" />, color: "text-purple-400", bg: isLight ? "bg-purple-50" : "bg-purple-500/10" },
    { label: "Active Clients", value: "34", icon: <Users className="w-5 h-5" />, color: "text-cyan-400", bg: isLight ? "bg-cyan-50" : "bg-cyan-500/10" },
  ];

  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ═══════════════════ HEADER ═══════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", accentGradient)}>
              <Ship className="w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h1 className={cn("text-2xl font-bold", text)}>Ocean Freight Brokerage</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={muted}>{BROKER_INFO.name}</span>
                <span className={dimmed}>|</span>
                <span className={muted}>{BROKER_INFO.company}</span>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-500">
                  FMC Licensed
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className={cn("gap-2", border)}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700">
              <Plus className="w-4 h-4" /> New Quote
            </Button>
          </div>
        </div>

        {/* ═══════════════════ QUICK STATS ═══════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickStats.map((stat) => (
            <Card key={stat.label} className={cn("border", cardBg)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className={cn("text-xs", muted)}>{stat.label}</p>
                    <p className={cn("text-lg font-bold", text)}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══════════════════ BOOKING PIPELINE (Hero) ═══════════════════ */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                <CardTitle className={cn("text-lg", text)}>Booking Pipeline</CardTitle>
              </div>
              {activePipelineStage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("text-xs", muted)}
                  onClick={() => setActivePipelineStage(null)}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PIPELINE_DATA.map((stage, idx) => {
                const isActive = activePipelineStage === stage.stage;
                return (
                  <button
                    key={stage.stage}
                    onClick={() => setActivePipelineStage(isActive ? null : stage.stage)}
                    className={cn(
                      "relative rounded-xl p-4 transition-all text-left border-2",
                      isActive
                        ? "border-cyan-500 ring-2 ring-cyan-500/20"
                        : isLight
                        ? "border-slate-200 hover:border-slate-300"
                        : "border-slate-700/50 hover:border-slate-600"
                    )}
                  >
                    {/* stage connector arrow */}
                    {idx < PIPELINE_DATA.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight className={cn("w-5 h-5", dimmed)} />
                      </div>
                    )}
                    <div className={cn("text-xs font-medium mb-2", muted)}>{stage.label}</div>
                    <div className={cn("text-2xl font-bold", text)}>{stage.count}</div>
                    <div className={cn("text-sm font-medium mt-1", stage.iconColor)}>
                      {fmtCurrency(stage.value)}
                    </div>
                    <div className={cn("mt-3 h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", stage.color)}
                        style={{ width: `${Math.min((stage.count / 156) * 100, 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Pipeline totals */}
            <div className={cn("mt-4 pt-4 border-t flex items-center justify-between", border)}>
              <div className="flex items-center gap-6">
                <div>
                  <span className={cn("text-xs", muted)}>Total Pipeline Value</span>
                  <p className={cn("text-lg font-bold", text)}>
                    {fmtCurrency(PIPELINE_DATA.reduce((s, p) => s + p.value, 0))}
                  </p>
                </div>
                <div>
                  <span className={cn("text-xs", muted)}>Total Bookings</span>
                  <p className={cn("text-lg font-bold", text)}>
                    {PIPELINE_DATA.reduce((s, p) => s + p.count, 0)}
                  </p>
                </div>
                <div>
                  <span className={cn("text-xs", muted)}>Conversion Rate</span>
                  <p className={cn("text-lg font-bold text-emerald-500")}>
                    68.4%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +12.3% vs last month
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════ RATE COMPARISON + CARRIER SCHEDULES ═══════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Rate Comparison ── */}
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <CardTitle className={cn("text-lg", text)}>Rate Comparison</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                  Live Rates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", muted)}>Port of Loading</label>
                  <Input
                    value={rateSearchPol}
                    onChange={(e) => setRateSearchPol(e.target.value)}
                    className={cn("text-sm h-9", inputBg, text)}
                    placeholder="POL..."
                  />
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", muted)}>Port of Discharge</label>
                  <Input
                    value={rateSearchPod}
                    onChange={(e) => setRateSearchPod(e.target.value)}
                    className={cn("text-sm h-9", inputBg, text)}
                    placeholder="POD..."
                  />
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", muted)}>Container Size</label>
                  <div className="flex gap-1">
                    {(["20GP", "40GP", "40HC"] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setRateSearchSize(size)}
                        className={cn(
                          "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                          rateSearchSize === size
                            ? "bg-cyan-600 text-white"
                            : isLight
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", muted)}>Commodity</label>
                  <Input
                    value={rateSearchCommodity}
                    onChange={(e) => setRateSearchCommodity(e.target.value)}
                    className={cn("text-sm h-9", inputBg, text)}
                    placeholder="Commodity..."
                  />
                </div>
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", muted)}>Sort by:</span>
                {([
                  { key: "rate", label: "Best Rate" },
                  { key: "transit", label: "Fastest" },
                  { key: "reliability", label: "Most Reliable" },
                ] as const).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setRateSortBy(s.key)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md font-medium transition-colors",
                      rateSortBy === s.key
                        ? "bg-cyan-600 text-white"
                        : isLight
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Rate table */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sortedRates.map((rate) => (
                  <div
                    key={rate.carrier}
                    className={cn(
                      "rounded-lg p-3 border transition-all",
                      rate.isBestRate
                        ? isLight
                          ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                          : "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                        : isLight
                        ? "border-slate-200 hover:border-slate-300"
                        : "border-slate-700/50 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                          isLight ? "bg-slate-100 text-slate-700" : "bg-slate-700 text-slate-200"
                        )}>
                          {rate.logo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-sm", text)}>{rate.carrier}</span>
                            {rate.isBestRate && (
                              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                <Zap className="w-2.5 h-2.5 mr-0.5" /> Best Rate
                              </Badge>
                            )}
                          </div>
                          <div className={cn("text-xs mt-0.5", muted)}>
                            {rate.transitDays} days transit | Free time: {rate.freeTime} days
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-lg font-bold", rate.isBestRate ? "text-emerald-500" : text)}>
                          {rateSearchSize === "20GP"
                            ? fmtCurrencyFull(rate.rate20ft)
                            : rateSearchSize === "40GP"
                            ? fmtCurrencyFull(rate.rate40ft)
                            : fmtCurrencyFull(rate.rate40hc)}
                        </div>
                        <div className={cn("text-xs", muted)}>per {rateSearchSize}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed" style={{ borderColor: isLight ? "#e2e8f0" : "#334155" }}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span className={cn("text-xs", muted)}>{rate.reliability}% reliability</span>
                        </div>
                        <span className={cn("text-xs", dimmed)}>Valid until {fmtDate(rate.validUntil)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                      >
                        Book <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Carrier Schedules ── */}
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <CardTitle className={cn("text-lg", text)}>Carrier Schedules</CardTitle>
                </div>
                <span className={cn("text-xs", muted)}>{CARRIER_SAILINGS.length} upcoming sailings</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {CARRIER_SAILINGS.map((sailing) => {
                  const spacePercent = (sailing.spaceAvailable / sailing.totalCapacity) * 100;
                  const spaceLow = spacePercent < 15;
                  const spaceMedium = spacePercent < 30;
                  return (
                    <div
                      key={sailing.id}
                      className={cn(
                        "rounded-lg p-3 border transition-colors",
                        isLight ? "border-slate-200 hover:border-slate-300" : "border-slate-700/50 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-sm", text)}>{sailing.vesselName}</span>
                            <Badge variant="outline" className={cn("text-[10px]", border, muted)}>
                              {sailing.voyage}
                            </Badge>
                          </div>
                          <span className={cn("text-xs", muted)}>{sailing.carrier}</span>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-medium",
                            spaceLow
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : spaceMedium
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {sailing.spaceAvailable} TEU avail
                        </Badge>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className={cn("text-xs font-medium", textSecondary)}>{sailing.pol}</span>
                        <ArrowRight className={cn("w-3 h-3 shrink-0", dimmed)} />
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className={cn("text-xs font-medium", textSecondary)}>{sailing.pod}</span>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <span className={cn("text-[10px] uppercase", dimmed)}>ETD</span>
                          <p className={cn("text-xs font-medium", text)}>{fmtDate(sailing.etd)}</p>
                        </div>
                        <div>
                          <span className={cn("text-[10px] uppercase", dimmed)}>ETA</span>
                          <p className={cn("text-xs font-medium", text)}>{fmtDate(sailing.eta)}</p>
                        </div>
                        <div>
                          <span className={cn("text-[10px] uppercase", dimmed)}>Transit</span>
                          <p className={cn("text-xs font-medium", text)}>{sailing.transitDays} days</p>
                        </div>
                      </div>

                      {/* Space bar + actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                spaceLow ? "bg-red-500" : spaceMedium ? "bg-amber-500" : "bg-emerald-500"
                              )}
                              style={{ width: `${100 - spacePercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={cn("text-[10px]", dimmed)}>
                              Cutoff: {fmtDate(sailing.cutoffDate)}
                            </span>
                            <span className={cn("text-[10px]", dimmed)}>
                              {Math.round(100 - spacePercent)}% booked
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════ MY BOOKINGS ═══════════════════ */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-purple-500" />
                <CardTitle className={cn("text-lg", text)}>My Bookings</CardTitle>
                <Badge variant="outline" className={cn("text-xs", border, muted)}>
                  {filteredBookings.length} results
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg", inputBg)}>
                  <Search className={cn("w-3.5 h-3.5", dimmed)} />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search bookings..."
                    className={cn("bg-transparent text-xs outline-none w-36", text)}
                  />
                </div>
                {(["all", "pending", "confirmed", "shipped", "delivered"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setBookingFilter(f)}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors capitalize",
                      bookingFilter === f
                        ? "bg-purple-600 text-white"
                        : isLight
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className={cn("grid grid-cols-12 gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-2", headerBg, muted)}>
              <div className="col-span-2">Booking Ref</div>
              <div className="col-span-2">Shipper</div>
              <div className="col-span-1">Carrier</div>
              <div className="col-span-2">Route</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-center">Containers</div>
              <div className="col-span-1 text-right">Value</div>
              <div className="col-span-1 text-right">Commission</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredBookings.map((booking) => {
                const statusCfg = bookingStatusConfig[booking.status];
                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg items-center transition-colors",
                      rowHover,
                      isLight ? "border border-slate-100" : "border border-slate-700/30"
                    )}
                  >
                    <div className="col-span-2">
                      <span className={cn("text-xs font-mono font-medium", text)}>{booking.bookingRef}</span>
                      <div className={cn("text-[10px]", dimmed)}>{booking.commodity}</div>
                    </div>
                    <div className="col-span-2">
                      <span className={cn("text-xs font-medium", textSecondary)}>{booking.shipper}</span>
                    </div>
                    <div className="col-span-1">
                      <span className={cn("text-xs", muted)}>{booking.carrier}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <span className={cn("text-xs", textSecondary)}>{booking.pol}</span>
                        <ArrowRight className={cn("w-3 h-3 shrink-0", dimmed)} />
                        <span className={cn("text-xs", textSecondary)}>{booking.pod}</span>
                      </div>
                      <div className={cn("text-[10px]", dimmed)}>
                        {fmtDate(booking.etd)} - {fmtDate(booking.eta)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Badge className={cn("text-[10px] gap-1", statusCfg.color)}>
                        {statusCfg.icon} {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={cn("text-xs font-medium", text)}>{booking.containerCount}x</span>
                      <span className={cn("text-[10px] ml-1", dimmed)}>{booking.containerSize}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={cn("text-xs font-medium", text)}>{fmtCurrency(booking.value)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-xs font-medium text-emerald-500">{fmtCurrencyFull(booking.commission)}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Track
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredBookings.length === 0 && (
                <div className={cn("text-center py-12", muted)}>
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No bookings match your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════ CUSTOMER PORTFOLIO + FINANCIAL ═══════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Customer Portfolio ── */}
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <CardTitle className={cn("text-lg", text)}>Customer Portfolio</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { key: "revenue", label: "Revenue" },
                    { key: "bookings", label: "Bookings" },
                    { key: "satisfaction", label: "Rating" },
                  ] as const).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCustomerSort(s.key)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md font-medium transition-colors",
                        customerSort === s.key
                          ? "bg-amber-600 text-white"
                          : isLight
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {sortedCustomers.map((customer, idx) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "rounded-lg p-3 border transition-colors",
                      isLight ? "border-slate-200 hover:border-slate-300" : "border-slate-700/50 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                          idx === 0
                            ? "bg-amber-500/20 text-amber-500"
                            : idx === 1
                            ? "bg-slate-400/20 text-slate-400"
                            : idx === 2
                            ? "bg-orange-500/20 text-orange-500"
                            : isLight
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-700 text-slate-300"
                        )}>
                          {idx < 3 ? <Award className="w-4 h-4" /> : `#${idx + 1}`}
                        </div>
                        <div>
                          <div className={cn("text-sm font-semibold", text)}>{customer.name}</div>
                          <div className={cn("text-xs", muted)}>{customer.company}</div>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          customer.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : customer.status === "inactive"
                            ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        )}
                      >
                        {customer.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className={cn("text-[10px] uppercase", dimmed)}>Revenue</span>
                        <p className={cn("text-xs font-bold", text)}>{fmtCurrency(customer.totalRevenue)}</p>
                      </div>
                      <div>
                        <span className={cn("text-[10px] uppercase", dimmed)}>Bookings</span>
                        <p className={cn("text-xs font-bold", text)}>{customer.bookingCount}</p>
                      </div>
                      <div>
                        <span className={cn("text-[10px] uppercase", dimmed)}>Avg Value</span>
                        <p className={cn("text-xs font-bold", text)}>{fmtCurrency(customer.avgBookingValue)}</p>
                      </div>
                      <div>
                        <span className={cn("text-[10px] uppercase", dimmed)}>Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className={cn("text-xs font-bold", text)}>{customer.satisfactionScore}</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn("flex items-center justify-between mt-2 pt-2 border-t border-dashed", border)}>
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-cyan-500" />
                        <span className={cn("text-xs", muted)}>Top lane: {customer.topLane}</span>
                      </div>
                      <span className={cn("text-[10px]", dimmed)}>Last: {fmtDate(customer.lastBooking)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Financial Overview ── */}
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <CardTitle className={cn("text-lg", text)}>Financial Overview</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { key: "commission", label: "Commission" },
                    { key: "receivables", label: "Receivables" },
                    { key: "lanes", label: "Top Lanes" },
                    { key: "margins", label: "Margins" },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setFinancialTab(t.key)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md font-medium transition-colors",
                        financialTab === t.key
                          ? "bg-green-600 text-white"
                          : isLight
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Commission Tab */}
              {financialTab === "commission" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "This Week", value: FINANCIAL.commission.week, icon: <Clock className="w-4 h-4" />, color: "text-blue-400", trend: "+8.2%" },
                      { label: "This Month", value: FINANCIAL.commission.month, icon: <Calendar className="w-4 h-4" />, color: "text-emerald-400", trend: "+15.4%" },
                      { label: "This Quarter", value: FINANCIAL.commission.quarter, icon: <BarChart3 className="w-4 h-4" />, color: "text-purple-400", trend: "+22.1%" },
                      { label: "Year to Date", value: FINANCIAL.commission.year, icon: <TrendingUp className="w-4 h-4" />, color: "text-amber-400", trend: "+31.7%" },
                    ]).map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-lg p-4 border",
                          isLight ? "border-slate-200 bg-slate-50/50" : "border-slate-700/50 bg-slate-700/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("text-xs", muted)}>{item.label}</span>
                          <span className={item.color}>{item.icon}</span>
                        </div>
                        <p className={cn("text-xl font-bold", text)}>{fmtCurrencyFull(item.value)}</p>
                        <div className="flex items-center gap-1 mt-1 text-emerald-500 text-xs">
                          <TrendingUp className="w-3 h-3" />
                          {item.trend}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly target progress */}
                  <div className={cn("rounded-lg p-4 border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-sm font-medium", text)}>Monthly Target</span>
                      <span className={cn("text-sm font-bold", text)}>
                        {fmtCurrencyFull(FINANCIAL.targets.monthlyActual)} / {fmtCurrencyFull(FINANCIAL.targets.monthlyTarget)}
                      </span>
                    </div>
                    <Progress
                      value={(FINANCIAL.targets.monthlyActual / FINANCIAL.targets.monthlyTarget) * 100}
                      className={cn("h-3", isLight ? "bg-slate-100" : "bg-slate-700/50")}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn("text-xs", muted)}>
                        {Math.round((FINANCIAL.targets.monthlyActual / FINANCIAL.targets.monthlyTarget) * 100)}% achieved
                      </span>
                      <span className={cn("text-xs", muted)}>
                        {fmtCurrencyFull(FINANCIAL.targets.monthlyTarget - FINANCIAL.targets.monthlyActual)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Yearly target */}
                  <div className={cn("rounded-lg p-4 border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-sm font-medium", text)}>Yearly Target</span>
                      <span className={cn("text-sm font-bold", text)}>
                        {fmtCurrency(FINANCIAL.targets.yearlyActual)} / {fmtCurrency(FINANCIAL.targets.yearlyTarget)}
                      </span>
                    </div>
                    <Progress
                      value={(FINANCIAL.targets.yearlyActual / FINANCIAL.targets.yearlyTarget) * 100}
                      className={cn("h-3", isLight ? "bg-slate-100" : "bg-slate-700/50")}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn("text-xs", muted)}>
                        {Math.round((FINANCIAL.targets.yearlyActual / FINANCIAL.targets.yearlyTarget) * 100)}% achieved
                      </span>
                      <span className="text-xs text-emerald-500">On track</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Receivables Tab */}
              {financialTab === "receivables" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "Current", value: FINANCIAL.receivables.current, color: "text-emerald-400", bgColor: isLight ? "bg-emerald-50" : "bg-emerald-500/10", status: "On time" },
                      { label: "30+ Days Overdue", value: FINANCIAL.receivables.overdue30, color: "text-amber-400", bgColor: isLight ? "bg-amber-50" : "bg-amber-500/10", status: "Follow up" },
                      { label: "60+ Days Overdue", value: FINANCIAL.receivables.overdue60, color: "text-orange-400", bgColor: isLight ? "bg-orange-50" : "bg-orange-500/10", status: "Escalated" },
                      { label: "90+ Days Overdue", value: FINANCIAL.receivables.overdue90, color: "text-red-400", bgColor: isLight ? "bg-red-50" : "bg-red-500/10", status: "Collections" },
                    ]).map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-lg p-4 border",
                          isLight ? "border-slate-200" : "border-slate-700/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("text-xs", muted)}>{item.label}</span>
                          <Badge className={cn("text-[10px]", item.bgColor, item.color)}>{item.status}</Badge>
                        </div>
                        <p className={cn("text-xl font-bold", item.color)}>{fmtCurrencyFull(item.value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className={cn("rounded-lg p-4 border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-sm font-medium", text)}>Total Outstanding</span>
                      <span className={cn("text-xl font-bold", text)}>
                        {fmtCurrencyFull(
                          FINANCIAL.receivables.current +
                          FINANCIAL.receivables.overdue30 +
                          FINANCIAL.receivables.overdue60 +
                          FINANCIAL.receivables.overdue90
                        )}
                      </span>
                    </div>
                    {/* Aging bar */}
                    <div className="flex h-4 rounded-full overflow-hidden">
                      {([
                        { value: FINANCIAL.receivables.current, color: "bg-emerald-500" },
                        { value: FINANCIAL.receivables.overdue30, color: "bg-amber-500" },
                        { value: FINANCIAL.receivables.overdue60, color: "bg-orange-500" },
                        { value: FINANCIAL.receivables.overdue90, color: "bg-red-500" },
                      ]).map((seg, i) => {
                        const total =
                          FINANCIAL.receivables.current +
                          FINANCIAL.receivables.overdue30 +
                          FINANCIAL.receivables.overdue60 +
                          FINANCIAL.receivables.overdue90;
                        return (
                          <div
                            key={i}
                            className={cn("h-full", seg.color)}
                            style={{ width: `${(seg.value / total) * 100}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className={cn("text-[10px]", muted)}>Current</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className={cn("text-[10px]", muted)}>30+</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className={cn("text-[10px]", muted)}>60+</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className={cn("text-[10px]", muted)}>90+</span></div>
                      </div>
                      <span className={cn("text-xs", muted)}>
                        DSO: 34 days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Revenue Lanes Tab */}
              {financialTab === "lanes" && (
                <div className="space-y-2">
                  {REVENUE_LANES.map((lane, idx) => {
                    const maxRevenue = REVENUE_LANES[0].revenue;
                    return (
                      <div
                        key={lane.lane}
                        className={cn(
                          "rounded-lg p-3 border transition-colors",
                          isLight ? "border-slate-200 hover:border-slate-300" : "border-slate-700/50 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              idx === 0 ? "bg-amber-500/20 text-amber-500" :
                              idx === 1 ? "bg-slate-400/20 text-slate-400" :
                              idx === 2 ? "bg-orange-500/20 text-orange-500" :
                              isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-400"
                            )}>
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-cyan-500" />
                              <span className={cn("text-sm font-semibold", text)}>{lane.lane}</span>
                            </div>
                          </div>
                          <span className={cn("text-sm font-bold", text)}>{fmtCurrency(lane.revenue)}</span>
                        </div>
                        <div className={cn("h-2 rounded-full overflow-hidden mb-2", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${(lane.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={cn("text-xs", muted)}>
                              <Hash className="w-3 h-3 inline mr-0.5" />{lane.bookings} bookings
                            </span>
                            <span className={cn("text-xs", muted)}>
                              Avg: {fmtCurrency(Math.round(lane.revenue / lane.bookings))}/booking
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">{lane.avgMargin}% margin</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Lane summary */}
                  <div className={cn("rounded-lg p-4 border mt-3", isLight ? "border-slate-200 bg-slate-50/50" : "border-slate-700/50 bg-slate-700/20")}>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className={cn("text-xs", muted)}>Total Lane Revenue</span>
                        <p className={cn("text-lg font-bold", text)}>
                          {fmtCurrency(REVENUE_LANES.reduce((s, l) => s + l.revenue, 0))}
                        </p>
                      </div>
                      <div>
                        <span className={cn("text-xs", muted)}>Total Bookings</span>
                        <p className={cn("text-lg font-bold", text)}>
                          {REVENUE_LANES.reduce((s, l) => s + l.bookings, 0)}
                        </p>
                      </div>
                      <div>
                        <span className={cn("text-xs", muted)}>Avg Margin</span>
                        <p className="text-lg font-bold text-emerald-500">
                          {(REVENUE_LANES.reduce((s, l) => s + l.avgMargin, 0) / REVENUE_LANES.length).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Margin Analysis Tab */}
              {financialTab === "margins" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className={cn("rounded-lg p-4 border text-center", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <span className={cn("text-xs", muted)}>Average Margin</span>
                      <p className={cn("text-2xl font-bold mt-1", text)}>{FINANCIAL.margins.avg}%</p>
                      <div className="flex items-center justify-center gap-1 mt-1 text-emerald-500 text-xs">
                        <TrendingUp className="w-3 h-3" /> Trending up
                      </div>
                    </div>
                    <div className={cn("rounded-lg p-4 border text-center", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <span className={cn("text-xs", muted)}>Best Margin</span>
                      <p className="text-2xl font-bold mt-1 text-emerald-500">{FINANCIAL.margins.best}%</p>
                      <span className={cn("text-[10px]", dimmed)}>PECLL - BEANR</span>
                    </div>
                    <div className={cn("rounded-lg p-4 border text-center", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <span className={cn("text-xs", muted)}>Worst Margin</span>
                      <p className="text-2xl font-bold mt-1 text-amber-500">{FINANCIAL.margins.worst}%</p>
                      <span className={cn("text-[10px]", dimmed)}>BRSSZ - SAJED</span>
                    </div>
                  </div>

                  {/* Margin by carrier */}
                  <div className={cn("rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className={cn("px-4 py-2 border-b", border)}>
                      <span className={cn("text-sm font-medium", text)}>Margin by Carrier</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {([
                        { carrier: "Hapag-Lloyd", margin: 3.8, bookings: 22, trend: "up" },
                        { carrier: "Maersk", margin: 3.5, bookings: 34, trend: "up" },
                        { carrier: "CMA CGM", margin: 3.2, bookings: 28, trend: "stable" },
                        { carrier: "MSC", margin: 2.9, bookings: 41, trend: "down" },
                        { carrier: "COSCO", margin: 2.7, bookings: 18, trend: "up" },
                        { carrier: "ONE", margin: 2.5, bookings: 15, trend: "stable" },
                        { carrier: "Evergreen", margin: 2.3, bookings: 12, trend: "down" },
                        { carrier: "ZIM", margin: 2.0, bookings: 8, trend: "stable" },
                      ]).map((c) => (
                        <div key={c.carrier} className="flex items-center gap-3">
                          <span className={cn("text-xs w-24 shrink-0", textSecondary)}>{c.carrier}</span>
                          <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                            <div
                              className={cn(
                                "h-full rounded-full",
                                c.margin >= 3.5 ? "bg-emerald-500" :
                                c.margin >= 2.5 ? "bg-cyan-500" :
                                "bg-amber-500"
                              )}
                              style={{ width: `${(c.margin / 4.2) * 100}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-medium w-10 text-right", text)}>{c.margin}%</span>
                          <span className={cn("text-[10px] w-8", dimmed)}>{c.bookings}bk</span>
                          {c.trend === "up" ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                          ) : c.trend === "down" ? (
                            <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
                          ) : (
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* P&L snapshot */}
                  <div className={cn("rounded-lg p-4 border", isLight ? "border-slate-200 bg-slate-50/50" : "border-slate-700/50 bg-slate-700/20")}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-sm font-medium", text)}>P&L Snapshot (MTD)</span>
                      <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">Profitable</Badge>
                    </div>
                    <div className="space-y-2">
                      {([
                        { label: "Gross Brokerage Revenue", value: 312000, color: text },
                        { label: "Carrier Costs", value: -245000, color: "text-red-400" },
                        { label: "Operating Expenses", value: -18500, color: "text-red-400" },
                        { label: "Net Commission Income", value: 48500, color: "text-emerald-500" },
                      ]).map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className={cn("text-xs", muted)}>{row.label}</span>
                          <span className={cn("text-xs font-bold", row.color)}>
                            {row.value < 0 ? `-${fmtCurrencyFull(Math.abs(row.value))}` : fmtCurrencyFull(row.value)}
                          </span>
                        </div>
                      ))}
                      <div className={cn("border-t pt-2 mt-2 flex items-center justify-between", border)}>
                        <span className={cn("text-xs font-medium", text)}>Net Margin</span>
                        <span className="text-sm font-bold text-emerald-500">15.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════ FOOTER STATS BAR ═══════════════════ */}
        <div className={cn("rounded-xl border p-4", cardBg)}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {([
              { label: "TEU Booked (MTD)", value: "1,247", icon: <Container className="w-4 h-4 text-cyan-500" /> },
              { label: "Avg Rate / TEU", value: "$2,840", icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
              { label: "Active Carriers", value: "12", icon: <Ship className="w-4 h-4 text-blue-500" /> },
              { label: "Unique Lanes", value: "38", icon: <Globe className="w-4 h-4 text-purple-500" /> },
              { label: "Quotes Sent", value: "142", icon: <FileText className="w-4 h-4 text-amber-500" /> },
              { label: "Win Rate", value: "68.4%", icon: <Target className="w-4 h-4 text-green-500" /> },
              { label: "Avg Transit", value: "26 days", icon: <Clock className="w-4 h-4 text-orange-500" /> },
              { label: "NPS Score", value: "72", icon: <ThumbsUp className="w-4 h-4 text-pink-500" /> },
            ]).map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                {stat.icon}
                <div>
                  <p className={cn("text-[10px] uppercase tracking-wider", dimmed)}>{stat.label}</p>
                  <p className={cn("text-sm font-bold", text)}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}