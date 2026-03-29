/**
 * VESSEL ENVIRONMENTAL COMPLIANCE — V5 Multi-Modal
 * MARPOL environmental compliance dashboard for VESSEL_OPERATOR & SHIP_CAPTAIN
 * Covers all 6 MARPOL Annexes, Oil Record Book, Garbage Record Book,
 * Ballast Water Management, Emissions Tracking, and Certificate management.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Leaf,
  Droplets,
  Wind,
  Trash2,
  Waves,
  Fuel,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Ship,
  Gauge,
  ThermometerSun,
  FlaskConical,
  Package,
  CalendarClock,
  CloudCog,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ───────────────────── static reference data ───────────────────── */

const MARPOL_ANNEXES = [
  {
    annex: "I",
    title: "Oil Pollution Prevention",
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    bgLight: "from-blue-100 to-cyan-100",
    description: "Oily water separator, oil record book, IOPP certificate",
    keyRequirements: ["15 ppm max discharge", "Oil Record Book Part I & II", "Shipboard Oil Pollution Emergency Plan"],
  },
  {
    annex: "II",
    title: "Noxious Liquid Substances",
    icon: FlaskConical,
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-fuchsia-500/20",
    bgLight: "from-purple-100 to-fuchsia-100",
    description: "Cargo residue handling, prewash, NLS discharge criteria",
    keyRequirements: ["Procedures & Arrangements Manual", "Prewash requirements", "Cargo record book"],
  },
  {
    annex: "III",
    title: "Harmful Packaged Goods",
    icon: Package,
    color: "text-orange-400",
    bgColor: "from-orange-500/20 to-amber-500/20",
    bgLight: "from-orange-100 to-amber-100",
    description: "IMDG Code, marking, labeling, stowage, documentation",
    keyRequirements: ["IMDG Code compliance", "Proper stowage/segregation", "Documentation & manifests"],
  },
  {
    annex: "IV",
    title: "Sewage Pollution",
    icon: Waves,
    color: "text-teal-400",
    bgColor: "from-teal-500/20 to-emerald-500/20",
    bgLight: "from-teal-100 to-emerald-100",
    description: "Sewage treatment plant, holding tank, discharge distance",
    keyRequirements: ["Sewage treatment plant approved", "Discharge >12nm from land", "Holding tank capacity"],
  },
  {
    annex: "V",
    title: "Garbage Pollution",
    icon: Trash2,
    color: "text-lime-400",
    bgColor: "from-lime-500/20 to-green-500/20",
    bgLight: "from-lime-100 to-green-100",
    description: "Garbage management plan, record book, placards",
    keyRequirements: ["Garbage Management Plan", "Garbage Record Book", "No plastics discharge"],
  },
  {
    annex: "VI",
    title: "Air Pollution & GHG",
    icon: Wind,
    color: "text-sky-400",
    bgColor: "from-sky-500/20 to-indigo-500/20",
    bgLight: "from-sky-100 to-indigo-100",
    description: "SOx/NOx limits, EEDI, CII rating, fuel quality",
    keyRequirements: ["0.50% sulphur cap global", "NOx Tier III in ECAs", "SEEMP Part III (CII)"],
  },
];

type AnnexStatus = "compliant" | "warning" | "non_compliant";

const ANNEX_STATUS_DEFAULTS: Record<string, AnnexStatus> = {
  I: "compliant",
  II: "compliant",
  III: "compliant",
  IV: "warning",
  V: "compliant",
  VI: "warning",
};

/* Oil Record Book mock entries */
const OIL_RECORD_ENTRIES = [
  { id: 1, date: "2026-03-28", code: "C-11.1", operation: "Ballast of fuel oil tank", tank: "5P", quantity: "142 m³", officer: "2/E Rodriguez" },
  { id: 2, date: "2026-03-27", code: "C-12.1", operation: "Discharge of dirty ballast", tank: "5P", quantity: "138 m³", officer: "2/E Rodriguez" },
  { id: 3, date: "2026-03-25", code: "D-13", operation: "OWS operation — discharge overboard", tank: "Bilge", quantity: "2.8 m³", officer: "C/E Park" },
  { id: 4, date: "2026-03-24", code: "C-11.3", operation: "Internal transfer of oil residue", tank: "Slop to Settling", quantity: "6.1 m³", officer: "2/E Rodriguez" },
  { id: 5, date: "2026-03-22", code: "D-15", operation: "OWS — 15 ppm alarm test", tank: "N/A", quantity: "N/A", officer: "C/E Park" },
  { id: 6, date: "2026-03-20", code: "C-11.1", operation: "Ballast of fuel oil tank", tank: "3S", quantity: "98 m³", officer: "2/E Rodriguez" },
];

/* Garbage categories per MARPOL Annex V */
const GARBAGE_CATEGORIES = [
  { cat: "A", name: "Plastics", rule: "No discharge", icon: "🚫", total: 0, unit: "m³" },
  { cat: "B", name: "Food waste", rule: ">12nm (ground)", icon: "🍽️", total: 2.4, unit: "m³" },
  { cat: "C", name: "Domestic waste", rule: ">12nm", icon: "🏠", total: 1.1, unit: "m³" },
  { cat: "D", name: "Cooking oil", rule: ">12nm", icon: "🛢️", total: 0.3, unit: "m³" },
  { cat: "E", name: "Incinerator ashes", rule: ">12nm", icon: "🔥", total: 0.5, unit: "m³" },
  { cat: "F", name: "Operational waste", rule: ">12nm", icon: "⚙️", total: 0.8, unit: "m³" },
  { cat: "I", name: "E-waste", rule: "Port reception only", icon: "💻", total: 0.1, unit: "m³" },
];

const GARBAGE_DISPOSAL_LOG = [
  { id: 1, date: "2026-03-28", category: "B", method: "Discharged to sea", quantity: "0.8 m³", position: "24°15'N 036°42'E", officer: "Bosun Lee" },
  { id: 2, date: "2026-03-27", category: "C", method: "Landed ashore — Jeddah", quantity: "1.1 m³", position: "Port", officer: "Bosun Lee" },
  { id: 3, date: "2026-03-25", category: "E", method: "Incinerated", quantity: "0.3 m³", position: "22°08'N 038°50'E", officer: "3/E Tanaka" },
  { id: 4, date: "2026-03-22", category: "A", method: "Landed ashore — Yanbu", quantity: "0.4 m³", position: "Port", officer: "Bosun Lee" },
];

/* Ballast water */
const BALLAST_TANKS = [
  { tank: "FP", capacity: 620, filled: 580, status: "exchanged", lastExchange: "2026-03-26", salinity: 34.2 },
  { tank: "1P", capacity: 1200, filled: 0, status: "empty", lastExchange: "—", salinity: 0 },
  { tank: "1S", capacity: 1200, filled: 1150, status: "exchanged", lastExchange: "2026-03-26", salinity: 33.8 },
  { tank: "2P", capacity: 1400, filled: 1380, status: "treated", lastExchange: "2026-03-25", salinity: 34.5 },
  { tank: "2S", capacity: 1400, filled: 1400, status: "treated", lastExchange: "2026-03-25", salinity: 34.1 },
  { tank: "AP", capacity: 480, filled: 460, status: "exchanged", lastExchange: "2026-03-27", salinity: 33.9 },
];

/* Emissions */
const EMISSION_DATA = {
  sox: { current: 0.42, limit: 0.50, unit: "% S", status: "compliant" as const },
  nox: { current: 3.2, limit: 3.4, unit: "g/kWh", status: "compliant" as const },
  co2: { current: 12840, unit: "mt/yr", cii: "B", eedi: 5.82, eexi: 6.10 },
  pm: { current: 0.18, limit: 0.25, unit: "g/kWh", status: "compliant" as const },
};

const FUEL_CONSUMPTION = [
  { type: "HFO (IFO 380)", quantity: 42.1, unit: "mt/day", sulphur: "3.50%", zone: "Non-ECA only" },
  { type: "VLSFO", quantity: 38.6, unit: "mt/day", sulphur: "0.48%", zone: "Global" },
  { type: "MGO/MDO", quantity: 4.2, unit: "mt/day", sulphur: "0.08%", zone: "ECA / Port" },
  { type: "LNG", quantity: 0, unit: "mt/day", sulphur: "0.00%", zone: "N/A" },
];

const CII_HISTORY = [
  { year: 2023, rating: "C", attained: 7.12, required: 7.50 },
  { year: 2024, rating: "B", attained: 6.34, required: 7.20 },
  { year: 2025, rating: "B", attained: 5.98, required: 6.90 },
  { year: 2026, rating: "B", attained: 5.82, required: 6.60 },
];

/* Certificates */
const CERTIFICATES = [
  { name: "IOPP Certificate", code: "IOPP", issuer: "ClassNK", issued: "2024-06-15", expiry: "2029-06-14", status: "valid" },
  { name: "IAPP Certificate", code: "IAPP", issuer: "ClassNK", issued: "2024-06-15", expiry: "2029-06-14", status: "valid" },
  { name: "BWM Certificate", code: "BWM", issuer: "ClassNK", issued: "2023-11-20", expiry: "2028-11-19", status: "valid" },
  { name: "AFS Certificate", code: "AFS", issuer: "ClassNK", issued: "2024-03-10", expiry: "2029-03-09", status: "valid" },
  { name: "IEE Certificate", code: "IEE", issuer: "ClassNK", issued: "2024-06-15", expiry: "N/A", status: "valid" },
  { name: "SEEMP (Part I-III)", code: "SEEMP", issuer: "ClassNK", issued: "2025-01-01", expiry: "2025-12-31", status: "expiring_soon" },
  { name: "Sewage Certificate (ISPP)", code: "ISPP", issuer: "ClassNK", issued: "2024-06-15", expiry: "2029-06-14", status: "valid" },
  { name: "Garbage Management Plan", code: "GMP", issuer: "Flag State", issued: "2024-01-01", expiry: "N/A", status: "valid" },
];

/* ───────────────────── helper components ───────────────────── */

function StatusBadge({ status, isLight }: { status: string; isLight: boolean }) {
  const map: Record<string, string> = {
    compliant: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400",
    valid: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400",
    exchanged: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400",
    treated: isLight ? "bg-cyan-100 text-cyan-700" : "bg-cyan-500/20 text-cyan-400",
    warning: isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400",
    expiring_soon: isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400",
    non_compliant: isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400",
    empty: isLight ? "bg-slate-100 text-slate-500" : "bg-slate-600/30 text-slate-400",
  };
  const cls = map[status] || (isLight ? "bg-slate-100 text-slate-600" : "bg-slate-600/30 text-slate-400");
  return <Badge className={cn("text-xs font-medium capitalize", cls)}>{status.replace(/_/g, " ")}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "valid" || status === "exchanged" || status === "treated")
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning" || status === "expiring_soon")
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function daysUntil(dateStr: string): number {
  if (!dateStr || dateStr === "N/A") return 9999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function certStatus(expiry: string): string {
  const d = daysUntil(expiry);
  if (d < 0) return "expired";
  if (d < 90) return "expiring_soon";
  return "valid";
}

/* ───────────────────── MAIN COMPONENT ───────────────────── */

export default function VesselEnvironmental() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("overview");
  const [showOilForm, setShowOilForm] = useState(false);
  const [showGarbageForm, setShowGarbageForm] = useState(false);
  const [expandedAnnex, setExpandedAnnex] = useState<string | null>(null);

  // Oil form state
  const [oilCode, setOilCode] = useState("");
  const [oilOperation, setOilOperation] = useState("");
  const [oilTank, setOilTank] = useState("");
  const [oilQuantity, setOilQuantity] = useState("");

  // Garbage form state
  const [garbageCat, setGarbageCat] = useState("B");
  const [garbageMethod, setGarbageMethod] = useState("Discharged to sea");
  const [garbageQty, setGarbageQty] = useState("");

  // tRPC — fetch vessel compliance (graceful fallback)
  const complianceQuery = (trpc as any).vesselShipments?.getVesselCompliance?.useQuery?.({}) ?? { data: null, isLoading: false };

  const annexStatuses: Record<string, AnnexStatus> = useMemo(() => {
    if (complianceQuery.data?.marpolStatuses) return complianceQuery.data.marpolStatuses;
    return ANNEX_STATUS_DEFAULTS;
  }, [complianceQuery.data]);

  /* theme helpers */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const inputCls = cn(
    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
    isLight
      ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
      : "bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
  );
  const btnPrimary = cn(
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
    isLight ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-500"
  );
  const btnSecondary = cn(
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border",
    isLight ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
  );

  const compliantCount = Object.values(annexStatuses).filter((s) => s === "compliant").length;
  const warningCount = Object.values(annexStatuses).filter((s) => s === "warning").length;
  const nonCompliantCount = Object.values(annexStatuses).filter((s) => s === "non_compliant").length;

  const overallScore = Math.round((compliantCount / 6) * 100);

  /* ─── render ─── */
  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>
      {/* ════════ HEADER ════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-emerald-100 to-green-100" : "bg-gradient-to-br from-emerald-500/20 to-green-500/20")}>
            <Leaf className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Environmental Compliance</h1>
            <p className={cn("text-sm", muted)}>MARPOL 73/78 regulatory compliance & environmental management</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <div className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>
            Score: {overallScore}%
          </div>
          <div className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/15 text-blue-400")}>
            CII Rating: {EMISSION_DATA.co2.cii}
          </div>
        </div>
      </div>

      {/* ════════ TABS ════════ */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className={cn("flex flex-wrap gap-1 mb-6 p-1 rounded-xl", isLight ? "bg-slate-100" : "bg-slate-800/80")}>
          {[
            { value: "overview", label: "MARPOL Overview", icon: <Leaf className="w-4 h-4" /> },
            { value: "oil", label: "Oil Record", icon: <Droplets className="w-4 h-4" /> },
            { value: "garbage", label: "Garbage Record", icon: <Trash2 className="w-4 h-4" /> },
            { value: "ballast", label: "Ballast Water", icon: <Waves className="w-4 h-4" /> },
            { value: "emissions", label: "Emissions", icon: <Wind className="w-4 h-4" /> },
            { value: "certificates", label: "Certificates", icon: <FileCheck className="w-4 h-4" /> },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-colors",
                tab === t.value
                  ? isLight ? "bg-white shadow text-emerald-700" : "bg-slate-700 text-emerald-400"
                  : isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: MARPOL OVERVIEW                            */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Compliant", value: compliantCount, icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, accent: "text-emerald-400" },
              { label: "Warnings", value: warningCount, icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, accent: "text-amber-400" },
              { label: "Non-Compliant", value: nonCompliantCount, icon: <XCircle className="w-5 h-5 text-red-400" />, accent: "text-red-400" },
              { label: "Overall Score", value: `${overallScore}%`, icon: <Gauge className="w-5 h-5 text-blue-400" />, accent: "text-blue-400" },
            ].map((s) => (
              <Card key={s.label} className={cardBg}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/50")}>{s.icon}</div>
                  <div>
                    <p className={cn("text-xs", muted)}>{s.label}</p>
                    <p className={cn("text-xl font-bold", s.accent)}>{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Annex cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MARPOL_ANNEXES.map((a) => {
              const Icon = a.icon;
              const status = annexStatuses[a.annex] || "compliant";
              const isExpanded = expandedAnnex === a.annex;
              return (
                <Card key={a.annex} className={cn(cardBg, "overflow-hidden transition-all")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-gradient-to-br", isLight ? a.bgLight : a.bgColor)}>
                          <Icon className={cn("w-5 h-5", a.color)} />
                        </div>
                        <div>
                          <CardTitle className={cn("text-sm font-semibold", text)}>Annex {a.annex}</CardTitle>
                          <p className={cn("text-xs", muted)}>{a.title}</p>
                        </div>
                      </div>
                      <StatusBadge status={status} isLight={isLight} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <p className={cn("text-xs mb-3", muted)}>{a.description}</p>
                    <button
                      onClick={() => setExpandedAnnex(isExpanded ? null : a.annex)}
                      className={cn("flex items-center gap-1 text-xs font-medium transition-colors", isLight ? "text-emerald-600 hover:text-emerald-700" : "text-emerald-400 hover:text-emerald-300")}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Key Requirements
                    </button>
                    {isExpanded && (
                      <ul className={cn("mt-2 space-y-1 text-xs", muted)}>
                        {a.keyRequirements.map((r) => (
                          <li key={r} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: OIL RECORD BOOK                           */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="oil" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn("text-lg font-semibold", text)}>Oil Record Book — Part I (Machinery Space)</h2>
              <p className={cn("text-sm", muted)}>MARPOL Annex I — Regulation 17</p>
            </div>
            <button onClick={() => setShowOilForm(!showOilForm)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>

          {/* Add entry form */}
          {showOilForm && (
            <Card className={cardBg}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-sm font-semibold", text)}>New Oil Record Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Code</label>
                    <input value={oilCode} onChange={(e) => setOilCode(e.target.value)} placeholder="e.g. C-11.1" className={inputCls} />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Operation</label>
                    <input value={oilOperation} onChange={(e) => setOilOperation(e.target.value)} placeholder="Describe operation" className={inputCls} />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Tank</label>
                    <input value={oilTank} onChange={(e) => setOilTank(e.target.value)} placeholder="e.g. 5P" className={inputCls} />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Quantity</label>
                    <input value={oilQuantity} onChange={(e) => setOilQuantity(e.target.value)} placeholder="e.g. 142 m³" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={btnPrimary}>Save Entry</button>
                  <button onClick={() => setShowOilForm(false)} className={btnSecondary}>Cancel</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* OWS Status card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className={cn("text-sm font-medium", text)}>OWS Status</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", muted)}>Oil content monitor</span>
                  <StatusBadge status="compliant" isLight={isLight} />
                </div>
                <p className={cn("text-xs mt-1", muted)}>Last reading: 8.2 ppm (limit: 15 ppm)</p>
                <Progress value={54} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span className={cn("text-sm font-medium", text)}>Sludge Tank</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", muted)}>Capacity: 28 m³</span>
                  <span className={cn("text-xs font-medium", text)}>68% full</span>
                </div>
                <Progress value={68} className="mt-2 h-1.5" />
                <p className={cn("text-xs mt-1", muted)}>Est. next discharge: Jeddah (Mar 31)</p>
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="w-4 h-4 text-orange-400" />
                  <span className={cn("text-sm font-medium", text)}>Bilge Tank</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", muted)}>Capacity: 18 m³</span>
                  <span className={cn("text-xs font-medium", text)}>42% full</span>
                </div>
                <Progress value={42} className="mt-2 h-1.5" />
                <p className={cn("text-xs mt-1", muted)}>OWS last run: Mar 25</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent entries table */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700")}>
                    {["Date", "Code", "Operation", "Tank", "Qty", "Officer"].map((h) => (
                      <th key={h} className={cn("text-left py-2 px-3 font-medium", muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OIL_RECORD_ENTRIES.map((e) => (
                    <tr key={e.id} className={cn("border-b transition-colors", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <td className={cn("py-2 px-3", text)}>{e.date}</td>
                      <td className={cn("py-2 px-3 font-mono", muted)}>{e.code}</td>
                      <td className={cn("py-2 px-3", text)}>{e.operation}</td>
                      <td className={cn("py-2 px-3 font-mono", muted)}>{e.tank}</td>
                      <td className={cn("py-2 px-3", text)}>{e.quantity}</td>
                      <td className={cn("py-2 px-3", muted)}>{e.officer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: GARBAGE RECORD BOOK                       */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="garbage" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn("text-lg font-semibold", text)}>Garbage Record Book</h2>
              <p className={cn("text-sm", muted)}>MARPOL Annex V — Regulation 10</p>
            </div>
            <button onClick={() => setShowGarbageForm(!showGarbageForm)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Log Disposal
            </button>
          </div>

          {/* Add garbage form */}
          {showGarbageForm && (
            <Card className={cardBg}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-sm font-semibold", text)}>Log Garbage Disposal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Category</label>
                    <select value={garbageCat} onChange={(e) => setGarbageCat(e.target.value)} className={inputCls}>
                      {GARBAGE_CATEGORIES.map((c) => (
                        <option key={c.cat} value={c.cat}>Cat {c.cat} — {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Method</label>
                    <select value={garbageMethod} onChange={(e) => setGarbageMethod(e.target.value)} className={inputCls}>
                      <option>Discharged to sea</option>
                      <option>Landed ashore</option>
                      <option>Incinerated</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", muted)}>Quantity (m³)</label>
                    <input value={garbageQty} onChange={(e) => setGarbageQty(e.target.value)} placeholder="0.0" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={btnPrimary}>Save Entry</button>
                  <button onClick={() => setShowGarbageForm(false)} className={btnSecondary}>Cancel</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {GARBAGE_CATEGORIES.map((c) => (
              <Card key={c.cat} className={cardBg}>
                <CardContent className="p-3 text-center">
                  <span className="text-2xl">{c.icon}</span>
                  <p className={cn("text-xs font-semibold mt-1", text)}>Cat {c.cat}</p>
                  <p className={cn("text-[10px]", muted)}>{c.name}</p>
                  <p className={cn("text-sm font-bold mt-1", text)}>
                    {c.total} {c.unit}
                  </p>
                  <p className={cn("text-[10px]", muted)}>{c.rule}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Disposal log table */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>Disposal Log</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700")}>
                    {["Date", "Category", "Method", "Quantity", "Position", "Officer"].map((h) => (
                      <th key={h} className={cn("text-left py-2 px-3 font-medium", muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GARBAGE_DISPOSAL_LOG.map((e) => (
                    <tr key={e.id} className={cn("border-b transition-colors", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <td className={cn("py-2 px-3", text)}>{e.date}</td>
                      <td className={cn("py-2 px-3 font-mono", muted)}>Cat {e.category}</td>
                      <td className={cn("py-2 px-3", text)}>{e.method}</td>
                      <td className={cn("py-2 px-3", text)}>{e.quantity}</td>
                      <td className={cn("py-2 px-3 font-mono text-[11px]", muted)}>{e.position}</td>
                      <td className={cn("py-2 px-3", muted)}>{e.officer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: BALLAST WATER MANAGEMENT                  */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="ballast" className="space-y-6">
          <div>
            <h2 className={cn("text-lg font-semibold", text)}>Ballast Water Management</h2>
            <p className={cn("text-sm", muted)}>BWM Convention D-2 standard compliance</p>
          </div>

          {/* BWM system status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CloudCog className="w-4 h-4 text-cyan-400" />
                  <span className={cn("text-sm font-medium", text)}>BWM System</span>
                </div>
                <p className={cn("text-xs", muted)}>Type: UV Treatment (Alfa Laval PureBallast 3)</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="compliant" isLight={isLight} />
                  <span className={cn("text-xs", muted)}>Last serviced: 2026-02-15</span>
                </div>
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Anchor className="w-4 h-4 text-blue-400" />
                  <span className={cn("text-sm font-medium", text)}>Total Ballast Capacity</span>
                </div>
                <p className={cn("text-xl font-bold", text)}>6,300 m³</p>
                <p className={cn("text-xs mt-1", muted)}>
                  Current: {BALLAST_TANKS.reduce((a, t) => a + t.filled, 0).toLocaleString()} m³ ({Math.round((BALLAST_TANKS.reduce((a, t) => a + t.filled, 0) / 6300) * 100)}%)
                </p>
                <Progress value={Math.round((BALLAST_TANKS.reduce((a, t) => a + t.filled, 0) / 6300) * 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="w-4 h-4 text-teal-400" />
                  <span className={cn("text-sm font-medium", text)}>Port Discharge</span>
                </div>
                <p className={cn("text-xs", muted)}>Next port: Jeddah (KSA)</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="compliant" isLight={isLight} />
                  <span className={cn("text-xs", muted)}>Pre-arrival approval obtained</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tank details */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>Ballast Tank Status</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700")}>
                    {["Tank", "Capacity (m³)", "Filled (m³)", "Fill %", "Status", "Last Exchange", "Salinity (PSU)"].map((h) => (
                      <th key={h} className={cn("text-left py-2 px-3 font-medium", muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BALLAST_TANKS.map((t) => {
                    const pct = t.capacity > 0 ? Math.round((t.filled / t.capacity) * 100) : 0;
                    return (
                      <tr key={t.tank} className={cn("border-b transition-colors", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                        <td className={cn("py-2 px-3 font-mono font-semibold", text)}>{t.tank}</td>
                        <td className={cn("py-2 px-3", muted)}>{t.capacity.toLocaleString()}</td>
                        <td className={cn("py-2 px-3", text)}>{t.filled.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 w-16" />
                            <span className={cn("text-xs", muted)}>{pct}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3"><StatusBadge status={t.status} isLight={isLight} /></td>
                        <td className={cn("py-2 px-3", muted)}>{t.lastExchange}</td>
                        <td className={cn("py-2 px-3 font-mono", muted)}>{t.salinity > 0 ? t.salinity.toFixed(1) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Exchange records */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>Recent Exchange / Treatment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "2026-03-27", action: "Sequential exchange — Tank AP", position: "24°50'N 036°20'E", depth: "2,800m", volume: "480 m³", method: "Exchange" },
                  { date: "2026-03-26", action: "Sequential exchange — Tanks FP & 1S", position: "23°15'N 037°45'E", depth: "3,100m", volume: "1,770 m³", method: "Exchange" },
                  { date: "2026-03-25", action: "UV treatment — Tanks 2P & 2S", position: "22°08'N 038°50'E", depth: "N/A", volume: "2,780 m³", method: "Treatment" },
                ].map((r, i) => (
                  <div key={i} className={cn("flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
                      <span className={cn("text-xs font-mono", muted)}>{r.date}</span>
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-xs font-medium", text)}>{r.action}</p>
                      <p className={cn("text-[11px]", muted)}>Position: {r.position} | Depth: {r.depth} | Volume: {r.volume}</p>
                    </div>
                    <Badge className={cn("text-[10px]", r.method === "Treatment" ? (isLight ? "bg-cyan-100 text-cyan-700" : "bg-cyan-500/20 text-cyan-400") : (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400"))}>
                      {r.method}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: EMISSIONS TRACKING                        */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="emissions" className="space-y-6">
          <div>
            <h2 className={cn("text-lg font-semibold", text)}>Emissions Tracking</h2>
            <p className={cn("text-sm", muted)}>MARPOL Annex VI — SOx, NOx, CO2, PM & energy efficiency</p>
          </div>

          {/* Emission gauges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "SOx", value: EMISSION_DATA.sox.current, limit: EMISSION_DATA.sox.limit, unit: EMISSION_DATA.sox.unit, color: "text-yellow-400", bgCol: isLight ? "bg-yellow-100" : "bg-yellow-500/15" },
              { label: "NOx", value: EMISSION_DATA.nox.current, limit: EMISSION_DATA.nox.limit, unit: EMISSION_DATA.nox.unit, color: "text-orange-400", bgCol: isLight ? "bg-orange-100" : "bg-orange-500/15" },
              { label: "CO2", value: EMISSION_DATA.co2.current, limit: null, unit: "mt/yr", color: "text-red-400", bgCol: isLight ? "bg-red-100" : "bg-red-500/15" },
              { label: "PM", value: EMISSION_DATA.pm.current, limit: EMISSION_DATA.pm.limit, unit: EMISSION_DATA.pm.unit, color: "text-purple-400", bgCol: isLight ? "bg-purple-100" : "bg-purple-500/15" },
            ].map((em) => {
              const pct = em.limit ? Math.round((em.value / em.limit) * 100) : null;
              return (
                <Card key={em.label} className={cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-xs font-medium", muted)}>{em.label}</span>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", em.bgCol, em.color)}>
                        {em.limit ? "Compliant" : "Tracked"}
                      </span>
                    </div>
                    <p className={cn("text-2xl font-bold", text)}>
                      {em.value.toLocaleString()} <span className={cn("text-xs font-normal", muted)}>{em.unit}</span>
                    </p>
                    {em.limit && (
                      <>
                        <p className={cn("text-xs mt-1", muted)}>Limit: {em.limit} {em.unit}</p>
                        <Progress value={pct!} className="mt-2 h-1.5" />
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CII Rating History */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>CII Rating History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CII_HISTORY.map((c) => {
                  const ratingColor: Record<string, string> = {
                    A: "text-emerald-400",
                    B: "text-green-400",
                    C: "text-yellow-400",
                    D: "text-orange-400",
                    E: "text-red-400",
                  };
                  const ratingBg: Record<string, string> = {
                    A: isLight ? "bg-emerald-100" : "bg-emerald-500/20",
                    B: isLight ? "bg-green-100" : "bg-green-500/20",
                    C: isLight ? "bg-yellow-100" : "bg-yellow-500/20",
                    D: isLight ? "bg-orange-100" : "bg-orange-500/20",
                    E: isLight ? "bg-red-100" : "bg-red-500/20",
                  };
                  return (
                    <div key={c.year} className={cn("p-4 rounded-xl text-center", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                      <p className={cn("text-xs font-medium", muted)}>{c.year}</p>
                      <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full my-2 text-xl font-bold", ratingBg[c.rating], ratingColor[c.rating])}>
                        {c.rating}
                      </div>
                      <p className={cn("text-xs", muted)}>Attained: {c.attained}</p>
                      <p className={cn("text-xs", muted)}>Required: {c.required}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* EEDI / EEXI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThermometerSun className="w-4 h-4 text-emerald-400" />
                  <span className={cn("text-sm font-medium", text)}>Energy Efficiency</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>EEDI (Attained)</span>
                    <span className={cn("text-sm font-semibold", text)}>{EMISSION_DATA.co2.eedi} gCO2/t·nm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>EEXI (Required ≤)</span>
                    <span className={cn("text-sm font-semibold", text)}>{EMISSION_DATA.co2.eexi} gCO2/t·nm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>Status</span>
                    <StatusBadge status={EMISSION_DATA.co2.eedi <= EMISSION_DATA.co2.eexi ? "compliant" : "non_compliant"} isLight={isLight} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <span className={cn("text-sm font-medium", text)}>Current CII</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>2026 Attained CII</span>
                    <span className={cn("text-sm font-semibold", text)}>5.82 gCO2/t·nm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>2026 Required CII</span>
                    <span className={cn("text-sm font-semibold", text)}>6.60 gCO2/t·nm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", muted)}>Rating</span>
                    <Badge className={cn("text-sm font-bold", isLight ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400")}>B</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fuel consumption table */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold", text)}>Fuel Consumption by Type</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700")}>
                    {["Fuel Type", "Consumption", "Sulphur Content", "Usage Zone"].map((h) => (
                      <th key={h} className={cn("text-left py-2 px-3 font-medium", muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FUEL_CONSUMPTION.map((f) => (
                    <tr key={f.type} className={cn("border-b transition-colors", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <td className={cn("py-2 px-3 font-medium", text)}>{f.type}</td>
                      <td className={cn("py-2 px-3", text)}>{f.quantity} {f.unit}</td>
                      <td className={cn("py-2 px-3 font-mono", muted)}>{f.sulphur}</td>
                      <td className={cn("py-2 px-3", muted)}>{f.zone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: CERTIFICATES                              */}
        {/* ════════════════════════════════════════════════ */}
        <TabsContent value="certificates" className="space-y-6">
          <div>
            <h2 className={cn("text-lg font-semibold", text)}>Environmental Certificates</h2>
            <p className={cn("text-sm", muted)}>IOPP, IAPP, BWM, AFS, IEE & SEEMP certificate tracking</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const valid = CERTIFICATES.filter((c) => certStatus(c.expiry) === "valid").length;
              const expiring = CERTIFICATES.filter((c) => certStatus(c.expiry) === "expiring_soon").length;
              const expired = CERTIFICATES.filter((c) => certStatus(c.expiry) === "expired").length;
              return [
                { label: "Total Certificates", value: CERTIFICATES.length, icon: <FileCheck className="w-5 h-5 text-blue-400" />, accent: "text-blue-400" },
                { label: "Valid", value: valid, icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, accent: "text-emerald-400" },
                { label: "Expiring Soon", value: expiring, icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, accent: "text-amber-400" },
                { label: "Expired", value: expired, icon: <XCircle className="w-5 h-5 text-red-400" />, accent: "text-red-400" },
              ];
            })().map((s) => (
              <Card key={s.label} className={cardBg}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/50")}>{s.icon}</div>
                  <div>
                    <p className={cn("text-xs", muted)}>{s.label}</p>
                    <p className={cn("text-xl font-bold", s.accent)}>{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Certificate cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CERTIFICATES.map((c) => {
              const status = certStatus(c.expiry);
              const remaining = daysUntil(c.expiry);
              return (
                <Card key={c.code} className={cn(cardBg, "overflow-hidden")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck className={cn("w-4 h-4", status === "valid" ? "text-emerald-400" : status === "expiring_soon" ? "text-amber-400" : "text-red-400")} />
                        <div>
                          <p className={cn("text-sm font-semibold", text)}>{c.name}</p>
                          <p className={cn("text-[11px] font-mono", muted)}>{c.code}</p>
                        </div>
                      </div>
                      <StatusBadge status={status} isLight={isLight} />
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div>
                        <p className={cn("text-[11px]", muted)}>Issuer</p>
                        <p className={cn("font-medium", text)}>{c.issuer}</p>
                      </div>
                      <div>
                        <p className={cn("text-[11px]", muted)}>Issued</p>
                        <p className={cn("font-medium", text)}>{c.issued}</p>
                      </div>
                      <div>
                        <p className={cn("text-[11px]", muted)}>Expiry</p>
                        <p className={cn("font-medium", text)}>{c.expiry}</p>
                      </div>
                      <div>
                        <p className={cn("text-[11px]", muted)}>Remaining</p>
                        <p className={cn("font-medium", remaining < 90 ? "text-amber-400" : (isLight ? "text-slate-900" : "text-white"))}>
                          {c.expiry === "N/A" ? "Perpetual" : remaining > 0 ? `${remaining} days` : "EXPIRED"}
                        </p>
                      </div>
                    </div>
                    {c.expiry !== "N/A" && remaining > 0 && (
                      <Progress
                        value={Math.min(100, Math.round(((daysUntil(c.issued) * -1) / (daysUntil(c.issued) * -1 + remaining)) * 100))}
                        className="mt-3 h-1"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
