/**
 * VESSEL SHIPPER DASHBOARD — Ocean Freight Command Center
 * For VESSEL_SHIPPER role: booking management, container tracking,
 * customs status, rate trends, demurrage alerts, document management
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Ship, Container, Anchor, DollarSign, ArrowUpRight,
  AlertTriangle, Clock, Globe, Shield, TrendingUp,
  FileText, Search, CheckCircle2, XCircle, Eye,
  BarChart3, Bell, MapPin, Package, Navigation,
  RefreshCw, ChevronRight, Calendar, Timer,
  ArrowDown, ArrowUp, Minus, Filter, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── KPI Card ─── */
function KpiCard({ icon, label, value, sub, isLight, accent = "cyan" }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; isLight: boolean; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    teal: isLight ? "bg-teal-50 text-teal-600" : "bg-teal-500/10 text-teal-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/30"
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {sub && <div className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{sub}</div>}
    </div>
  );
}

/* ─── Status Badge Map ─── */
const BOOKING_STATUS: Record<string, { bg: string; lightBg: string }> = {
  booking_requested: { bg: "bg-yellow-500/20 text-yellow-400", lightBg: "bg-yellow-100 text-yellow-700" },
  booking_confirmed: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  in_transit: { bg: "bg-emerald-500/20 text-emerald-400", lightBg: "bg-emerald-100 text-emerald-700" },
  departed: { bg: "bg-cyan-500/20 text-cyan-400", lightBg: "bg-cyan-100 text-cyan-700" },
  arrived: { bg: "bg-teal-500/20 text-teal-400", lightBg: "bg-teal-100 text-teal-700" },
  delivered: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  customs_hold: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
  cancelled: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
  pending: { bg: "bg-yellow-500/20 text-yellow-400", lightBg: "bg-yellow-100 text-yellow-700" },
};

const CUSTOMS_STATUS: Record<string, { bg: string; lightBg: string }> = {
  filed: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  cleared: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  hold: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
  pending: { bg: "bg-yellow-500/20 text-yellow-400", lightBg: "bg-yellow-100 text-yellow-700" },
  exam: { bg: "bg-orange-500/20 text-orange-400", lightBg: "bg-orange-100 text-orange-700" },
  released: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
};

/* ─── Mock Data ─── */
const MOCK_BOOKINGS = [
  { id: "BK-240901", bookingRef: "MSKU-2024-09012", pol: "Los Angeles, CA (USLAX)", pod: "Shanghai, CN (CNSHA)", containers: 4, containerType: "40HC", commodity: "Electronics", vessel: "MSC AURORA", voyage: "FA402E", etd: "2026-04-02", eta: "2026-04-18", status: "in_transit", totalCost: 14200 },
  { id: "BK-240902", bookingRef: "HLCU-2024-09025", pol: "Long Beach, CA (USLGB)", pod: "Rotterdam, NL (NLRTM)", containers: 2, containerType: "20ST", commodity: "Auto Parts", vessel: "MAERSK SENTOSA", voyage: "AE426W", etd: "2026-04-05", eta: "2026-04-25", status: "booking_confirmed", totalCost: 6800 },
  { id: "BK-240903", bookingRef: "CMAU-2024-08843", pol: "Savannah, GA (USSAV)", pod: "Hamburg, DE (DEHAM)", containers: 6, containerType: "40HC", commodity: "Machinery", vessel: "CMA CGM MARCO POLO", voyage: "FE418N", etd: "2026-03-28", eta: "2026-04-12", status: "departed", totalCost: 22500 },
  { id: "BK-240904", bookingRef: "EISU-2024-09108", pol: "Houston, TX (USHOU)", pod: "Santos, BR (BRSSZ)", containers: 3, containerType: "40RF", commodity: "Perishables", vessel: "HAPAG BERLIN", voyage: "SA403S", etd: "2026-04-08", eta: "2026-04-22", status: "booking_requested", totalCost: 12600 },
  { id: "BK-240905", bookingRef: "OOLU-2024-08927", pol: "Newark, NJ (USNYC)", pod: "Felixstowe, UK (GBFXT)", containers: 8, containerType: "40HC", commodity: "Consumer Goods", vessel: "EVERGREEN TRITON", voyage: "TA421E", etd: "2026-03-25", eta: "2026-04-05", status: "arrived", totalCost: 28400 },
  { id: "BK-240906", bookingRef: "NYKU-2024-09201", pol: "Seattle, WA (USSEA)", pod: "Busan, KR (KRPUS)", containers: 2, containerType: "20ST", commodity: "Chemicals", vessel: "ONE COMMITMENT", voyage: "PA405W", etd: "2026-04-10", eta: "2026-04-28", status: "pending", totalCost: 5200 },
  { id: "BK-240907", bookingRef: "ZIMU-2024-09045", pol: "Charleston, SC (USCHS)", pod: "Antwerp, BE (BEANR)", containers: 5, containerType: "40HC", commodity: "Textiles", vessel: "ZIM SAMSON", voyage: "AT419N", etd: "2026-03-22", eta: "2026-04-03", status: "customs_hold", totalCost: 18750 },
];

const MOCK_CONTAINERS = [
  { number: "MSKU4821093", booking: "BK-240901", size: "40HC", status: "in_transit", vessel: "MSC AURORA", lastEvent: "Loaded on vessel", lastPort: "Los Angeles", eventTime: "2026-04-02 14:30", eta: "2026-04-18" },
  { number: "MSKU4821094", booking: "BK-240901", size: "40HC", status: "in_transit", vessel: "MSC AURORA", lastEvent: "Departed port", lastPort: "Los Angeles", eventTime: "2026-04-02 18:00", eta: "2026-04-18" },
  { number: "MSKU4821095", booking: "BK-240901", size: "40HC", status: "in_transit", vessel: "MSC AURORA", lastEvent: "Departed port", lastPort: "Los Angeles", eventTime: "2026-04-02 18:00", eta: "2026-04-18" },
  { number: "MSKU4821096", booking: "BK-240901", size: "40HC", status: "in_transit", vessel: "MSC AURORA", lastEvent: "Departed port", lastPort: "Los Angeles", eventTime: "2026-04-02 18:00", eta: "2026-04-18" },
  { number: "CMAU7283641", booking: "BK-240903", size: "40HC", status: "departed", vessel: "CMA CGM MARCO POLO", lastEvent: "Vessel at sea — mid-Atlantic", lastPort: "Savannah", eventTime: "2026-03-29 06:00", eta: "2026-04-12" },
  { number: "CMAU7283642", booking: "BK-240903", size: "40HC", status: "departed", vessel: "CMA CGM MARCO POLO", lastEvent: "Vessel at sea — mid-Atlantic", lastPort: "Savannah", eventTime: "2026-03-29 06:00", eta: "2026-04-12" },
  { number: "OOLU9381205", booking: "BK-240905", size: "40HC", status: "arrived", vessel: "EVERGREEN TRITON", lastEvent: "Discharged at port", lastPort: "Felixstowe", eventTime: "2026-04-05 08:00", eta: "—" },
  { number: "OOLU9381206", booking: "BK-240905", size: "40HC", status: "arrived", vessel: "EVERGREEN TRITON", lastEvent: "Awaiting customs clearance", lastPort: "Felixstowe", eventTime: "2026-04-05 10:30", eta: "—" },
  { number: "ZIMU6420173", booking: "BK-240907", size: "40HC", status: "customs_hold", vessel: "ZIM SAMSON", lastEvent: "Customs hold — exam required", lastPort: "Antwerp", eventTime: "2026-04-03 14:00", eta: "—" },
];

const MOCK_RATE_TRENDS = [
  { lane: "USWC → East Asia", current: 3550, prev: 3800, unit: "per FEU", trend: "down" },
  { lane: "USEC → North Europe", current: 4200, prev: 3900, unit: "per FEU", trend: "up" },
  { lane: "USGC → South America", current: 4100, prev: 4300, unit: "per FEU", trend: "down" },
  { lane: "USEC → Mediterranean", current: 3800, prev: 3600, unit: "per FEU", trend: "up" },
  { lane: "USWC → SE Asia", current: 2950, prev: 3100, unit: "per FEU", trend: "down" },
  { lane: "USEC → UK / Ireland", current: 3200, prev: 3050, unit: "per FEU", trend: "up" },
];

const MOCK_CUSTOMS = [
  { entry: "ISF-2026-04120", booking: "BK-240901", type: "ISF 10+2", status: "filed", filedDate: "2026-03-30", dueDate: "2026-04-01", filer: "ABC Customs Broker" },
  { entry: "CE-2026-04121", booking: "BK-240905", type: "Customs Entry", status: "cleared", filedDate: "2026-04-05", dueDate: "2026-04-07", filer: "Pacific Customs" },
  { entry: "ISF-2026-04122", booking: "BK-240903", type: "ISF 10+2", status: "filed", filedDate: "2026-03-26", dueDate: "2026-03-28", filer: "ABC Customs Broker" },
  { entry: "CE-2026-04123", booking: "BK-240907", type: "Customs Entry", status: "hold", filedDate: "2026-04-03", dueDate: "2026-04-05", filer: "Atlantic Customs LLC" },
  { entry: "ISF-2026-04124", booking: "BK-240904", type: "ISF 10+2", status: "pending", filedDate: "", dueDate: "2026-04-06", filer: "Pending assignment" },
  { entry: "CE-2026-04125", booking: "BK-240905", type: "Exam Notice", status: "exam", filedDate: "2026-04-05", dueDate: "2026-04-08", filer: "Pacific Customs" },
];

const MOCK_DEMURRAGE = [
  { container: "OOLU9381205", booking: "BK-240905", port: "Felixstowe", freeTimeExpiry: "2026-04-09", daysUsed: 4, freeDays: 7, dailyRate: 150, accrued: 0, status: "within_free" },
  { container: "OOLU9381206", booking: "BK-240905", port: "Felixstowe", freeTimeExpiry: "2026-04-09", daysUsed: 4, freeDays: 7, dailyRate: 150, accrued: 0, status: "within_free" },
  { container: "ZIMU6420173", booking: "BK-240907", port: "Antwerp", freeTimeExpiry: "2026-04-06", daysUsed: 7, freeDays: 5, dailyRate: 175, accrued: 350, status: "accruing" },
  { container: "OOLU9381207", booking: "BK-240905", port: "Felixstowe", freeTimeExpiry: "2026-04-07", daysUsed: 6, freeDays: 5, dailyRate: 150, accrued: 150, status: "accruing" },
  { container: "CMAU7283643", booking: "BK-240903", port: "Hamburg", freeTimeExpiry: "2026-04-15", daysUsed: 0, freeDays: 7, dailyRate: 160, accrued: 0, status: "not_started" },
];

const MOCK_DOCUMENTS = [
  { id: "DOC-001", name: "Bill of Lading — BK-240901", type: "BOL", booking: "BK-240901", status: "draft", dueDate: "2026-04-03" },
  { id: "DOC-002", name: "ISF Filing — BK-240901", type: "ISF", booking: "BK-240901", status: "submitted", dueDate: "2026-04-01" },
  { id: "DOC-003", name: "Commercial Invoice — BK-240903", type: "Invoice", booking: "BK-240903", status: "approved", dueDate: "2026-03-27" },
  { id: "DOC-004", name: "Packing List — BK-240903", type: "PackingList", booking: "BK-240903", status: "approved", dueDate: "2026-03-27" },
  { id: "DOC-005", name: "Bill of Lading — BK-240905", type: "BOL", booking: "BK-240905", status: "final", dueDate: "2026-04-02" },
  { id: "DOC-006", name: "Customs Entry — BK-240907", type: "CustomsEntry", booking: "BK-240907", status: "pending", dueDate: "2026-04-05" },
  { id: "DOC-007", name: "ISF Filing — BK-240904", type: "ISF", booking: "BK-240904", status: "not_filed", dueDate: "2026-04-06" },
  { id: "DOC-008", name: "Certificate of Origin — BK-240901", type: "CertOrigin", booking: "BK-240901", status: "submitted", dueDate: "2026-04-03" },
  { id: "DOC-009", name: "Dangerous Goods Declaration — BK-240906", type: "DGD", booking: "BK-240906", status: "draft", dueDate: "2026-04-08" },
];

const DOC_STATUS: Record<string, { bg: string; lightBg: string }> = {
  draft: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-100 text-slate-600" },
  submitted: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  approved: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  final: { bg: "bg-emerald-500/20 text-emerald-400", lightBg: "bg-emerald-100 text-emerald-700" },
  pending: { bg: "bg-yellow-500/20 text-yellow-400", lightBg: "bg-yellow-100 text-yellow-700" },
  not_filed: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
};

/* ─── Helpers ─── */
function fmtCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function daysUntil(d: string) {
  if (!d) return 999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                    */
/* ────────────────────────────────────────────────── */
export default function VesselShipperDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [docTab, setDocTab] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");

  /* ── tRPC queries (graceful fallback to mock) ── */
  const dashQuery = (trpc as any).vesselShipments?.getVesselDashboard?.useQuery?.() ?? { data: null, isLoading: false };
  const bookingsQuery = (trpc as any).vesselShipments?.getVesselShipments?.useQuery?.({ limit: 20 }) ?? { data: null, isLoading: false };

  /* Merge real + mock data */
  const bookings = bookingsQuery.data?.shipments?.length
    ? bookingsQuery.data.shipments
    : MOCK_BOOKINGS;

  /* KPIs */
  const activeBookings = bookings.filter((b: any) =>
    ["booking_requested", "booking_confirmed", "in_transit", "departed"].includes(b.status)
  ).length;
  const containersInTransit = MOCK_CONTAINERS.filter(c => ["in_transit", "departed"].includes(c.status)).length;
  const monthlySpend = bookings.reduce((s: number, b: any) => s + (b.totalCost || 0), 0);
  const onTimeCount = bookings.filter((b: any) => b.status !== "customs_hold" && b.status !== "cancelled").length;
  const onTimeRate = bookings.length > 0 ? Math.round((onTimeCount / bookings.length) * 100) : 0;

  /* Filtered bookings */
  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (bookingFilter !== "all") list = list.filter((b: any) => b.status === bookingFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b: any) =>
        b.bookingRef?.toLowerCase().includes(q) ||
        b.pol?.toLowerCase().includes(q) ||
        b.pod?.toLowerCase().includes(q) ||
        b.commodity?.toLowerCase().includes(q) ||
        b.vessel?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, bookingFilter, search]);

  /* Filtered documents */
  const filteredDocs = useMemo(() => {
    if (docTab === "all") return MOCK_DOCUMENTS;
    if (docTab === "pending") return MOCK_DOCUMENTS.filter(d => ["draft", "pending", "not_filed"].includes(d.status));
    if (docTab === "submitted") return MOCK_DOCUMENTS.filter(d => d.status === "submitted");
    if (docTab === "approved") return MOCK_DOCUMENTS.filter(d => ["approved", "final"].includes(d.status));
    return MOCK_DOCUMENTS;
  }, [docTab]);

  /* Demurrage alerts — sorted by urgency */
  const demurrageAlerts = useMemo(() => {
    return [...MOCK_DEMURRAGE].sort((a, b) => daysUntil(a.freeTimeExpiry) - daysUntil(b.freeTimeExpiry));
  }, []);

  /* ── Theme vars ── */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const tableBorder = isLight ? "border-slate-100" : "border-slate-700/50";
  const tableHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30";
  const inputBg = isLight
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    : "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500";

  return (
    <div className={cn("min-h-screen p-6 space-y-6", bg)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-cyan-100 to-blue-100" : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
          )}>
            <Ship className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Ocean Freight Dashboard</h1>
            <p className={cn("text-sm", muted)}>
              Container shipment management &bull; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
            <Input
              placeholder="Search bookings..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className={cn("pl-9 w-64 h-9 text-sm rounded-lg", inputBg)}
            />
          </div>
          <Button size="sm" className={cn(
            "gap-1.5",
            isLight ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-cyan-600/90 hover:bg-cyan-600 text-white"
          )}>
            <Package className="w-3.5 h-3.5" /> New Booking
          </Button>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Ship className="w-5 h-5" />}
          label="Active Bookings"
          value={activeBookings}
          sub={`${bookings.length} total`}
          isLight={isLight}
          accent="cyan"
        />
        <KpiCard
          icon={<Container className="w-5 h-5" />}
          label="Containers in Transit"
          value={containersInTransit}
          sub={`${MOCK_CONTAINERS.length} total tracked`}
          isLight={isLight}
          accent="blue"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Monthly Spend"
          value={fmtCurrency(monthlySpend)}
          sub="All active bookings"
          isLight={isLight}
          accent="emerald"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="On-Time Rate"
          value={`${onTimeRate}%`}
          sub="Last 30 days"
          isLight={isLight}
          accent="teal"
        />
      </div>

      {/* ─── Active Bookings Table ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
          <div className="flex items-center gap-2">
            <Ship className={cn("w-4 h-4", isLight ? "text-cyan-600" : "text-cyan-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Active Bookings</h2>
            <Badge variant="secondary" className="text-xs">{filteredBookings.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bookingFilter}
              onChange={e => setBookingFilter(e.target.value)}
              className={cn(
                "text-xs rounded-lg px-3 py-1.5 border",
                isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300"
              )}
            >
              <option value="all">All Statuses</option>
              <option value="booking_requested">Requested</option>
              <option value="booking_confirmed">Confirmed</option>
              <option value="in_transit">In Transit</option>
              <option value="departed">Departed</option>
              <option value="arrived">Arrived</option>
              <option value="customs_hold">Customs Hold</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-left", tableBorder)}>
                {["Booking #", "POL", "POD", "Containers", "Commodity", "Vessel / Voyage", "ETD", "ETA", "Cost", "Status"].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b: any) => {
                const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                return (
                  <tr key={b.id} className={cn("border-b transition-colors cursor-pointer", tableBorder, tableHover)}>
                    <td className={cn("px-4 py-3 font-mono text-xs font-medium", isLight ? "text-cyan-700" : "text-cyan-400")}>{b.bookingRef}</td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", text)}>{b.pol?.split("(")[0]?.trim()}</td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", text)}>{b.pod?.split("(")[0]?.trim()}</td>
                    <td className={cn("px-4 py-3", text)}>{b.containers} x {b.containerType}</td>
                    <td className={cn("px-4 py-3", muted)}>{b.commodity}</td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", text)}>
                      <span className="font-medium">{b.vessel}</span>
                      <span className={cn("text-xs ml-1", muted)}>/ {b.voyage}</span>
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", muted)}>{fmtDate(b.etd)}</td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", muted)}>{fmtDate(b.eta)}</td>
                    <td className={cn("px-4 py-3 font-medium", text)}>{fmtCurrency(b.totalCost)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] uppercase", isLight ? st.lightBg : st.bg)}>
                        {b.status?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className={cn("text-center py-8", muted)}>No bookings match your criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Rate Trends + Container Tracking (side by side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Trends */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <BarChart3 className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Rate Trends</h2>
            <span className={cn("text-xs ml-auto", muted)}>Last 30 days</span>
          </div>
          <div className="p-4 space-y-3">
            {MOCK_RATE_TRENDS.map(r => {
              const diff = r.current - r.prev;
              const pct = ((diff / r.prev) * 100).toFixed(1);
              const TrendIcon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus;
              const trendColor = diff > 0
                ? (isLight ? "text-red-600" : "text-red-400")
                : diff < 0
                  ? (isLight ? "text-green-600" : "text-green-400")
                  : muted;
              return (
                <div key={r.lane} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40"
                )}>
                  <div>
                    <div className={cn("text-sm font-medium", text)}>{r.lane}</div>
                    <div className={cn("text-xs", muted)}>{r.unit}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn("text-lg font-bold", text)}>{fmtCurrency(r.current)}</div>
                    <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(Number(pct))}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Container Tracking */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <Container className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Container Tracking</h2>
            <Badge variant="secondary" className="text-xs ml-auto">{MOCK_CONTAINERS.length} tracked</Badge>
          </div>
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {MOCK_CONTAINERS.map(c => {
              const st = BOOKING_STATUS[c.status] || BOOKING_STATUS.pending;
              return (
                <div key={c.number} className={cn(
                  "p-3 rounded-lg border transition-colors cursor-pointer",
                  isLight ? "bg-white border-slate-100 hover:border-blue-200" : "bg-slate-800/40 border-slate-700/40 hover:border-cyan-500/30"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-mono text-xs font-bold", isLight ? "text-blue-700" : "text-blue-400")}>{c.number}</span>
                    <Badge className={cn("text-[10px]", isLight ? st.lightBg : st.bg)}>{c.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className={cn("text-xs", muted)}>{c.lastEvent}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <Ship className="w-3 h-3" /> {c.vessel}
                    </div>
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <MapPin className="w-3 h-3" /> {c.lastPort}
                    </div>
                    <div className={cn("flex items-center gap-1 text-[10px]", muted)}>
                      <Clock className="w-3 h-3" /> ETA: {c.eta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Customs Status + Demurrage Alerts (side by side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customs Status */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <Shield className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Customs Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Entry #", "Type", "Booking", "Status", "Filed", "Due"].map(h => (
                    <th key={h} className={cn("px-4 py-2.5 text-xs font-medium", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CUSTOMS.map(c => {
                  const st = CUSTOMS_STATUS[c.status] || CUSTOMS_STATUS.pending;
                  return (
                    <tr key={c.entry} className={cn("border-b", tableBorder, tableHover)}>
                      <td className={cn("px-4 py-2.5 font-mono text-xs", text)}>{c.entry}</td>
                      <td className={cn("px-4 py-2.5 text-xs", muted)}>{c.type}</td>
                      <td className={cn("px-4 py-2.5 text-xs font-medium", isLight ? "text-cyan-700" : "text-cyan-400")}>{c.booking}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn("text-[10px] uppercase", isLight ? st.lightBg : st.bg)}>{c.status}</Badge>
                      </td>
                      <td className={cn("px-4 py-2.5 text-xs", muted)}>{fmtDate(c.filedDate)}</td>
                      <td className={cn("px-4 py-2.5 text-xs", muted)}>{fmtDate(c.dueDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn("px-5 py-3 border-t flex items-center justify-between", tableBorder)}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={cn("w-3.5 h-3.5", isLight ? "text-green-600" : "text-green-400")} />
                <span className={cn("text-xs", muted)}>
                  {MOCK_CUSTOMS.filter(c => c.status === "cleared" || c.status === "released").length} Cleared
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-red-600" : "text-red-400")} />
                <span className={cn("text-xs", muted)}>
                  {MOCK_CUSTOMS.filter(c => c.status === "hold" || c.status === "exam").length} Holds/Exams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Demurrage Alerts */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <AlertTriangle className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Demurrage Alerts</h2>
            {MOCK_DEMURRAGE.filter(d => d.status === "accruing").length > 0 && (
              <Badge className={cn("text-[10px] ml-auto", isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")}>
                {MOCK_DEMURRAGE.filter(d => d.status === "accruing").length} Accruing
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-3">
            {demurrageAlerts.map(d => {
              const daysLeft = daysUntil(d.freeTimeExpiry);
              const isUrgent = daysLeft <= 2;
              const isAccruing = d.status === "accruing";
              return (
                <div key={d.container} className={cn(
                  "p-3 rounded-lg border",
                  isAccruing
                    ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30")
                    : isUrgent
                      ? (isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30")
                      : (isLight ? "bg-white border-slate-100" : "bg-slate-800/40 border-slate-700/40")
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-mono text-xs font-bold", text)}>{d.container}</span>
                    <Badge className={cn(
                      "text-[10px]",
                      isAccruing
                        ? (isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")
                        : (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400")
                    )}>
                      {isAccruing ? "ACCRUING" : `${daysLeft}d left`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className={cn("text-xs", muted)}>
                      <span className="font-medium">Port:</span> {d.port}
                    </div>
                    <div className={cn("text-xs", muted)}>
                      <span className="font-medium">Free time:</span> {d.freeDays}d ({d.daysUsed}d used)
                    </div>
                    <div className={cn("text-xs", muted)}>
                      <span className="font-medium">Rate:</span> {fmtCurrency(d.dailyRate)}/day
                    </div>
                  </div>
                  {isAccruing && (
                    <div className={cn(
                      "mt-2 pt-2 border-t flex items-center justify-between",
                      isLight ? "border-red-200" : "border-red-500/30"
                    )}>
                      <span className={cn("text-xs font-medium", isLight ? "text-red-700" : "text-red-400")}>
                        Accrued: {fmtCurrency(d.accrued)}
                      </span>
                      <span className={cn("text-xs", muted)}>
                        Expiry: {fmtDate(d.freeTimeExpiry)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={cn("px-5 py-3 border-t", tableBorder)}>
            <div className={cn("text-xs font-medium", isLight ? "text-amber-700" : "text-amber-400")}>
              Total Demurrage Accrued: {fmtCurrency(demurrageAlerts.reduce((s, d) => s + d.accrued, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Documents ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3", tableBorder)}>
          <div className="flex items-center gap-2">
            <FileText className={cn("w-4 h-4", isLight ? "text-teal-600" : "text-teal-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Documents</h2>
          </div>
          <Tabs value={docTab} onValueChange={setDocTab}>
            <TabsList className={cn(
              "h-8",
              isLight ? "bg-slate-100" : "bg-slate-800"
            )}>
              <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3 h-7">Pending</TabsTrigger>
              <TabsTrigger value="submitted" className="text-xs px-3 h-7">Submitted</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs px-3 h-7">Approved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-left", tableBorder)}>
                {["Document", "Type", "Booking", "Status", "Due Date", ""].map(h => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-medium", muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(d => {
                const st = DOC_STATUS[d.status] || DOC_STATUS.draft;
                const urgent = daysUntil(d.dueDate) <= 2 && !["approved", "final"].includes(d.status);
                return (
                  <tr key={d.id} className={cn("border-b", tableBorder, tableHover)}>
                    <td className={cn("px-4 py-2.5 text-xs font-medium", text)}>{d.name}</td>
                    <td className={cn("px-4 py-2.5 text-xs", muted)}>{d.type}</td>
                    <td className={cn("px-4 py-2.5 text-xs font-medium", isLight ? "text-cyan-700" : "text-cyan-400")}>{d.booking}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={cn("text-[10px] uppercase", isLight ? st.lightBg : st.bg)}>{d.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs", urgent ? (isLight ? "text-red-600 font-medium" : "text-red-400 font-medium") : muted)}>
                      {fmtDate(d.dueDate)}
                      {urgent && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Eye className={cn("w-3.5 h-3.5", muted)} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn("text-center py-6", muted)}>No documents in this category</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={cn("px-5 py-3 border-t flex items-center gap-6", tableBorder)}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-amber-600" : "text-amber-400")} />
            <span className={cn("text-xs", muted)}>
              {MOCK_DOCUMENTS.filter(d => ["draft", "pending", "not_filed"].includes(d.status)).length} require action
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={cn("w-3.5 h-3.5", isLight ? "text-green-600" : "text-green-400")} />
            <span className={cn("text-xs", muted)}>
              {MOCK_DOCUMENTS.filter(d => ["approved", "final"].includes(d.status)).length} complete
            </span>
          </div>
        </div>
      </div>

      {/* ─── Shipment Timeline / Recent Activity ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Clock className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Recent Activity</h2>
          <span className={cn("text-xs ml-auto", muted)}>Last 7 days</span>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {[
              { time: "Today, 08:30", event: "Container MSKU4821093 loaded on MSC AURORA at Los Angeles", type: "loading", booking: "BK-240901" },
              { time: "Today, 06:15", event: "ISF filing submitted for booking BK-240901 — awaiting CBP acceptance", type: "customs", booking: "BK-240901" },
              { time: "Yesterday, 22:00", event: "Booking BK-240902 confirmed by MAERSK SENTOSA — 2x20ST allocated", type: "booking", booking: "BK-240902" },
              { time: "Yesterday, 14:30", event: "Container OOLU9381205 discharged at Felixstowe — pending pickup", type: "discharge", booking: "BK-240905" },
              { time: "Mar 28, 10:00", event: "CMA CGM MARCO POLO departed Savannah with 6 containers for BK-240903", type: "departure", booking: "BK-240903" },
              { time: "Mar 27, 16:45", event: "Customs hold placed on ZIMU6420173 at Antwerp — exam required", type: "alert", booking: "BK-240907" },
              { time: "Mar 27, 09:00", event: "Rate quote received for USEC → Mediterranean lane — $3,800/FEU", type: "rate", booking: "" },
              { time: "Mar 26, 11:30", event: "Demurrage free time warning: OOLU9381207 — 1 day remaining at Felixstowe", type: "demurrage", booking: "BK-240905" },
              { time: "Mar 25, 18:00", event: "EVERGREEN TRITON arrived at Felixstowe with 8 containers for BK-240905", type: "arrival", booking: "BK-240905" },
              { time: "Mar 25, 08:00", event: "Booking BK-240906 request submitted for Seattle → Busan — awaiting confirmation", type: "booking", booking: "BK-240906" },
            ].map((item, idx) => {
              const iconMap: Record<string, React.ReactNode> = {
                loading: <Package className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />,
                customs: <Shield className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />,
                booking: <FileText className={cn("w-4 h-4", isLight ? "text-cyan-600" : "text-cyan-400")} />,
                discharge: <Container className={cn("w-4 h-4", isLight ? "text-teal-600" : "text-teal-400")} />,
                departure: <Ship className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />,
                alert: <AlertTriangle className={cn("w-4 h-4", isLight ? "text-red-600" : "text-red-400")} />,
                rate: <DollarSign className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />,
                demurrage: <Timer className={cn("w-4 h-4", isLight ? "text-orange-600" : "text-orange-400")} />,
                arrival: <Navigation className={cn("w-4 h-4", isLight ? "text-green-600" : "text-green-400")} />,
              };
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isLight ? "bg-slate-100" : "bg-slate-800"
                    )}>
                      {iconMap[item.type] || <Clock className="w-4 h-4" />}
                    </div>
                    {idx < 9 && <div className={cn("w-0.5 h-8 mt-1", isLight ? "bg-slate-200" : "bg-slate-700")} />}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <div className={cn("text-sm", text)}>{item.event}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px]", muted)}>{item.time}</span>
                      {item.booking && (
                        <span className={cn("text-[10px] font-mono", isLight ? "text-cyan-600" : "text-cyan-400")}>{item.booking}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Spend Breakdown + Carrier Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Trade Lane */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <DollarSign className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Spend by Trade Lane</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { lane: "USWC → East Asia", spend: 42500, bookings: 3, pctOfTotal: 38 },
              { lane: "USEC → North Europe", spend: 28750, bookings: 2, pctOfTotal: 26 },
              { lane: "USGC → South America", spend: 17800, bookings: 2, pctOfTotal: 16 },
              { lane: "USEC → Mediterranean", spend: 12600, bookings: 1, pctOfTotal: 11 },
              { lane: "USEC → UK / Ireland", spend: 10200, bookings: 1, pctOfTotal: 9 },
            ].map(item => (
              <div key={item.lane} className={cn(
                "p-3 rounded-lg border",
                isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40"
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className={cn("text-sm font-medium", text)}>{item.lane}</div>
                    <div className={cn("text-[10px]", muted)}>{item.bookings} booking{item.bookings !== 1 ? "s" : ""}</div>
                  </div>
                  <div className={cn("text-sm font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>
                    {fmtCurrency(item.spend)}
                  </div>
                </div>
                <div className={cn("w-full h-1.5 rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")}>
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${item.pctOfTotal}%` }}
                  />
                </div>
                <div className={cn("text-[10px] mt-1", muted)}>{item.pctOfTotal}% of total spend</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier Performance */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <BarChart3 className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Carrier Performance</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { carrier: "MSC", bookings: 2, onTime: 95, avgTransit: 16, reliability: "high" },
              { carrier: "CMA CGM", bookings: 1, onTime: 92, avgTransit: 14, reliability: "high" },
              { carrier: "Maersk", bookings: 1, onTime: 88, avgTransit: 20, reliability: "medium" },
              { carrier: "Evergreen", bookings: 1, onTime: 91, avgTransit: 10, reliability: "high" },
              { carrier: "ZIM", bookings: 1, onTime: 78, avgTransit: 11, reliability: "low" },
              { carrier: "ONE", bookings: 1, onTime: 85, avgTransit: 18, reliability: "medium" },
            ].map(c => (
              <div key={c.carrier} className={cn(
                "p-3 rounded-lg border flex items-center justify-between",
                isLight ? "bg-white border-slate-100" : "bg-slate-800/40 border-slate-700/40"
              )}>
                <div>
                  <div className={cn("text-sm font-bold", text)}>{c.carrier}</div>
                  <div className={cn("text-[10px]", muted)}>{c.bookings} booking{c.bookings !== 1 ? "s" : ""} &bull; Avg {c.avgTransit}d transit</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={cn("text-sm font-bold", c.onTime >= 90 ? (isLight ? "text-green-600" : "text-green-400") : c.onTime >= 80 ? (isLight ? "text-amber-600" : "text-amber-400") : (isLight ? "text-red-600" : "text-red-400"))}>
                      {c.onTime}%
                    </div>
                    <div className={cn("text-[10px]", muted)}>On-Time</div>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    c.reliability === "high"
                      ? (isLight ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400")
                      : c.reliability === "medium"
                        ? (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                        : (isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")
                  )}>
                    {c.reliability}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Footer Note ─── */}
      <div className={cn("text-center text-xs py-4", muted)}>
        Data refreshes automatically &bull; Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}