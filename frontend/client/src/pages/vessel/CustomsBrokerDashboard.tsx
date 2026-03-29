/**
 * CUSTOMS BROKER DASHBOARD — Operations Center
 * Full-featured customs broker workspace: entry pipeline, ISF deadlines,
 * HTS classification, duty calculator, active entries, compliance programs,
 * and financial summary. Light/dark theme aware.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield, FileText, Clock, AlertTriangle, CheckCircle2,
  DollarSign, Search as SearchIcon, Ship, Anchor,
  Scale, Calculator, TrendingUp, BarChart3,
  ArrowRight, XCircle, Eye, Lock,
  Award, Globe, Warehouse, RefreshCw,
  ChevronRight, Ban, Sparkles, Info,
  CalendarClock, CircleDot, Package, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK DATA — will be replaced by tRPC queries in production
   ═══════════════════════════════════════════════════════════════════════════ */

const BROKER_INFO = {
  name: "Rodriguez & Associates Customs Brokerage",
  license: "CHB-29847",
  district: "Port of Los Angeles — District 2704",
};

type PipelineStage = "draft" | "filed" | "under_review" | "cbp_hold" | "released" | "liquidated";

interface EntryRecord {
  id: string;
  entryNumber: string;
  importer: string;
  commodity: string;
  htsCode: string;
  declaredValue: number;
  dutyAmount: number;
  status: PipelineStage;
  filedDate: string;
  portOfEntry: string;
  examType?: string;
  holdReason?: string;
}

const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "filed", label: "Filed" },
  { key: "under_review", label: "Under Review" },
  { key: "cbp_hold", label: "CBP Hold" },
  { key: "released", label: "Released" },
  { key: "liquidated", label: "Liquidated" },
];

const ENTRIES: EntryRecord[] = [
  { id: "E001", entryNumber: "ABI-2704-0039841", importer: "Pacific Rim Electronics", commodity: "Lithium-Ion Batteries", htsCode: "8507.60.0020", declaredValue: 284000, dutyAmount: 9940, status: "under_review", filedDate: "2026-03-27", portOfEntry: "LA/LB" },
  { id: "E002", entryNumber: "ABI-2704-0039842", importer: "Golden State Textiles", commodity: "Cotton Yarn (combed)", htsCode: "5205.11.0040", declaredValue: 126500, dutyAmount: 12145, status: "filed", filedDate: "2026-03-28", portOfEntry: "LA/LB" },
  { id: "E003", entryNumber: "ABI-2704-0039843", importer: "Sunrise Auto Parts", commodity: "Brake Assemblies", htsCode: "8708.30.5060", declaredValue: 197000, dutyAmount: 4925, status: "cbp_hold", filedDate: "2026-03-25", portOfEntry: "LA/LB", examType: "Intensive", holdReason: "Country of origin verification" },
  { id: "E004", entryNumber: "ABI-2704-0039844", importer: "West Coast Pharma", commodity: "Active Pharmaceutical Ingredients", htsCode: "2933.39.6100", declaredValue: 543000, dutyAmount: 34752, status: "released", filedDate: "2026-03-22", portOfEntry: "LA/LB" },
  { id: "E005", entryNumber: "ABI-2704-0039845", importer: "NovaTech Semiconductors", commodity: "Integrated Circuits", htsCode: "8542.31.0000", declaredValue: 1250000, dutyAmount: 0, status: "filed", filedDate: "2026-03-28", portOfEntry: "LA/LB" },
  { id: "E006", entryNumber: "ABI-2704-0039846", importer: "Heritage Furniture Co.", commodity: "Wooden Furniture (teak)", htsCode: "9403.60.8040", declaredValue: 89000, dutyAmount: 0, status: "draft", filedDate: "", portOfEntry: "LA/LB" },
  { id: "E007", entryNumber: "ABI-2704-0039847", importer: "EcoPlast Industries", commodity: "PET Resin Pellets", htsCode: "3907.61.0010", declaredValue: 175000, dutyAmount: 11375, status: "released", filedDate: "2026-03-20", portOfEntry: "LA/LB" },
  { id: "E008", entryNumber: "ABI-2704-0039848", importer: "Pacific Rim Electronics", commodity: "LED Display Panels", htsCode: "8529.90.1300", declaredValue: 412000, dutyAmount: 0, status: "under_review", filedDate: "2026-03-26", portOfEntry: "LA/LB" },
  { id: "E009", entryNumber: "ABI-2704-0039849", importer: "Horizon Foods Intl.", commodity: "Olive Oil (extra virgin)", htsCode: "1509.10.2000", declaredValue: 67000, dutyAmount: 3350, status: "liquidated", filedDate: "2026-02-28", portOfEntry: "LA/LB" },
  { id: "E010", entryNumber: "ABI-2704-0039850", importer: "Skyward Aerospace", commodity: "Titanium Alloy Bars", htsCode: "8108.90.3000", declaredValue: 890000, dutyAmount: 133500, status: "cbp_hold", filedDate: "2026-03-24", portOfEntry: "LA/LB", examType: "VACIS X-Ray", holdReason: "Anti-dumping duty investigation" },
  { id: "E011", entryNumber: "ABI-2704-0039851", importer: "GreenHarvest Organics", commodity: "Organic Quinoa", htsCode: "1008.50.0020", declaredValue: 42000, dutyAmount: 462, status: "draft", filedDate: "", portOfEntry: "LA/LB" },
  { id: "E012", entryNumber: "ABI-2704-0039852", importer: "UrbanStyle Apparel", commodity: "Men's Cotton Shirts", htsCode: "6205.20.2025", declaredValue: 155000, dutyAmount: 30225, status: "filed", filedDate: "2026-03-29", portOfEntry: "LA/LB" },
];

interface ISFDeadline {
  id: string;
  vesselName: string;
  voyage: string;
  eta: string;
  deadline: string;
  hoursRemaining: number;
  importer: string;
  status: "filed" | "pending" | "overdue";
}

const ISF_DEADLINES: ISFDeadline[] = [
  { id: "ISF001", vesselName: "MSC GULSUN", voyage: "GS-0429E", eta: "2026-04-02", deadline: "2026-03-30 14:00", hoursRemaining: 18, importer: "Pacific Rim Electronics", status: "pending" },
  { id: "ISF002", vesselName: "EVER GIVEN", voyage: "EG-1104W", eta: "2026-04-04", deadline: "2026-04-01 08:00", hoursRemaining: 56, importer: "UrbanStyle Apparel", status: "pending" },
  { id: "ISF003", vesselName: "COSCO GALAXY", voyage: "CG-8821E", eta: "2026-04-01", deadline: "2026-03-29 06:00", hoursRemaining: -4, importer: "Sunrise Auto Parts", status: "overdue" },
  { id: "ISF004", vesselName: "ONE HARMONY", voyage: "OH-3377W", eta: "2026-04-05", deadline: "2026-04-02 16:00", hoursRemaining: 82, importer: "Heritage Furniture Co.", status: "filed" },
  { id: "ISF005", vesselName: "HMM ALGECIRAS", voyage: "HA-2200E", eta: "2026-04-03", deadline: "2026-03-31 10:00", hoursRemaining: 38, importer: "NovaTech Semiconductors", status: "filed" },
  { id: "ISF006", vesselName: "MAERSK EDINBURGH", voyage: "ME-6654W", eta: "2026-04-06", deadline: "2026-04-03 12:00", hoursRemaining: 104, importer: "Skyward Aerospace", status: "pending" },
];

interface HTSClassification {
  id: string;
  htsCode: string;
  description: string;
  dutyRate: string;
  section: string;
  chapter: string;
  aiConfidence?: number;
  classifiedDate: string;
}

const RECENT_CLASSIFICATIONS: HTSClassification[] = [
  { id: "C001", htsCode: "8507.60.0020", description: "Lithium-ion storage batteries", dutyRate: "3.5%", section: "XVI", chapter: "85", aiConfidence: 96, classifiedDate: "2026-03-27" },
  { id: "C002", htsCode: "5205.11.0040", description: "Single cotton yarn, combed, >= 714 dtex", dutyRate: "9.6%", section: "XI", chapter: "52", aiConfidence: 92, classifiedDate: "2026-03-28" },
  { id: "C003", htsCode: "8708.30.5060", description: "Brakes & servo-brakes, parts thereof", dutyRate: "2.5%", section: "XVII", chapter: "87", aiConfidence: 89, classifiedDate: "2026-03-25" },
  { id: "C004", htsCode: "2933.39.6100", description: "Heterocyclic compounds, nitrogen hetero-atom(s)", dutyRate: "6.4%", section: "VI", chapter: "29", aiConfidence: 84, classifiedDate: "2026-03-22" },
  { id: "C005", htsCode: "8542.31.0000", description: "Electronic integrated circuits — processors/controllers", dutyRate: "Free", section: "XVI", chapter: "85", aiConfidence: 99, classifiedDate: "2026-03-28" },
  { id: "C006", htsCode: "6205.20.2025", description: "Men's/boys' cotton shirts", dutyRate: "19.5%", section: "XI", chapter: "62", classifiedDate: "2026-03-29" },
];

interface ComplianceProgram {
  name: string;
  code: string;
  status: "active" | "pending" | "expired" | "not_enrolled";
  expiryDate?: string;
  detail: string;
}

const COMPLIANCE_PROGRAMS: ComplianceProgram[] = [
  { name: "C-TPAT", code: "Tier III", status: "active", expiryDate: "2027-09-15", detail: "Tier III — Green Lane benefits active" },
  { name: "ACE Portal", code: "ACE", status: "active", detail: "Direct filing via ABI/ACS — 412 entries YTD" },
  { name: "FTZ Operator", code: "FTZ #202", status: "active", expiryDate: "2027-01-31", detail: "Foreign-Trade Zone 202 — inverted tariff savings" },
  { name: "Drawback Claims", code: "19 USC 1313", status: "pending", detail: "3 claims pending — $47,200 estimated recovery" },
  { name: "Trusted Trader (NEEC/MX)", code: "NEEC", status: "active", expiryDate: "2026-12-01", detail: "Mexico cross-border expedited clearance" },
  { name: "ISA Self-Assessment", code: "ISA", status: "not_enrolled", detail: "Importer Self-Assessment — eligible, not yet enrolled" },
];

const FINANCIAL_SUMMARY = {
  feesThisWeek: 18400,
  feesThisMonth: 72350,
  feesThisYear: 841200,
  outstandingDuties: 237284,
  bondsActive: 3,
  bondsTotal: 500000,
  bondsSurety: "Zurich North America",
  avgDaysToRelease: 2.3,
  entriesYTD: 412,
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function LoadingSkeleton({ isLight, rows = 4 }: { isLight: boolean; rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className={cn("h-10 w-10 rounded-lg", isLight ? "bg-slate-200" : "bg-slate-700")} />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn("h-4 w-3/4 rounded", isLight ? "bg-slate-200" : "bg-slate-700")} />
            <Skeleton className={cn("h-3 w-1/2 rounded", isLight ? "bg-slate-100" : "bg-slate-700/60")} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent, isLight }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string; isLight: boolean;
}) {
  const accentMap: Record<string, string> = {
    indigo: isLight ? "bg-indigo-50 text-indigo-600" : "bg-indigo-500/10 text-indigo-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    orange: isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400",
    teal: isLight ? "bg-teal-50 text-teal-600" : "bg-teal-500/10 text-teal-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-indigo-500/30",
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold tabular-nums", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {sub && <div className={cn("text-[11px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, icon, children, isLight, className, headerRight }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; isLight: boolean; className?: string; headerRight?: React.ReactNode;
}) {
  return (
    <Card className={cn(
      "border transition-all",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50",
      className,
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-base font-semibold",
            isLight ? "text-slate-900" : "text-white"
          )}>
            {icon}
            {title}
          </CardTitle>
          {headerRight}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatusBadge({ status, isLight }: { status: string; isLight: boolean }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft: {
      bg: isLight ? "bg-slate-100" : "bg-slate-600/30",
      text: isLight ? "text-slate-600" : "text-slate-400",
      label: "Draft",
    },
    filed: {
      bg: isLight ? "bg-blue-100" : "bg-blue-500/20",
      text: isLight ? "text-blue-700" : "text-blue-400",
      label: "Filed",
    },
    under_review: {
      bg: isLight ? "bg-amber-100" : "bg-amber-500/20",
      text: isLight ? "text-amber-700" : "text-amber-400",
      label: "Under Review",
    },
    cbp_hold: {
      bg: isLight ? "bg-red-100" : "bg-red-500/20",
      text: isLight ? "text-red-700" : "text-red-400",
      label: "CBP Hold",
    },
    released: {
      bg: isLight ? "bg-emerald-100" : "bg-emerald-500/20",
      text: isLight ? "text-emerald-700" : "text-emerald-400",
      label: "Released",
    },
    liquidated: {
      bg: isLight ? "bg-purple-100" : "bg-purple-500/20",
      text: isLight ? "text-purple-700" : "text-purple-400",
      label: "Liquidated",
    },
  };
  const s = map[status] || map.draft;
  return <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", s.bg, s.text)}>{s.label}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CustomsBrokerDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* state */
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStage | "all">("all");
  const [entrySearch, setEntrySearch] = useState("");
  const [htsSearch, setHtsSearch] = useState("");
  const [calcHTS, setCalcHTS] = useState("8507.60.0020");
  const [calcOrigin, setCalcOrigin] = useState("CN");
  const [calcValue, setCalcValue] = useState("284000");
  const [calcResult, setCalcResult] = useState<null | { duty: number; mpf: number; hmf: number; total: number; usmca: boolean }>(null);
  const [isLoading] = useState(false);

  /* tRPC query attempt — graceful fallback to mock data */
  const customsQuery = (trpc as any).vesselShipments?.getCustomsEntries?.useQuery?.() ?? { data: null, isLoading: false };
  const _apiEntries: any[] = customsQuery.data || [];

  /* pipeline counts */
  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = { draft: 0, filed: 0, under_review: 0, cbp_hold: 0, released: 0, liquidated: 0 };
    ENTRIES.forEach((e) => { counts[e.status]++; });
    return counts;
  }, []);

  /* filtered entries */
  const filteredEntries = useMemo(() => {
    let list = ENTRIES;
    if (pipelineFilter !== "all") list = list.filter((e) => e.status === pipelineFilter);
    if (entrySearch.trim()) {
      const q = entrySearch.toLowerCase();
      list = list.filter((e) =>
        e.entryNumber.toLowerCase().includes(q) ||
        e.importer.toLowerCase().includes(q) ||
        e.commodity.toLowerCase().includes(q) ||
        e.htsCode.includes(q)
      );
    }
    return list;
  }, [pipelineFilter, entrySearch]);

  /* filtered HTS classifications */
  const filteredClassifications = useMemo(() => {
    if (!htsSearch.trim()) return RECENT_CLASSIFICATIONS;
    const q = htsSearch.toLowerCase();
    return RECENT_CLASSIFICATIONS.filter((c) =>
      c.htsCode.includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [htsSearch]);

  /* duty calculator */
  function handleCalcDuty() {
    const value = parseFloat(calcValue) || 0;
    const dutyRate = 0.035; // fallback
    const matched = RECENT_CLASSIFICATIONS.find((c) => c.htsCode === calcHTS);
    const rate = matched ? parseFloat(matched.dutyRate) / 100 : dutyRate;
    const duty = value * rate;
    const mpf = Math.min(Math.max(value * 0.003464, 31.67), 614.35);
    const hmf = value * 0.00125;
    const usmcaCountries = ["MX", "CA"];
    const usmca = usmcaCountries.includes(calcOrigin.toUpperCase());
    setCalcResult({
      duty: usmca ? 0 : duty,
      mpf,
      hmf,
      total: (usmca ? 0 : duty) + mpf + hmf,
      usmca,
    });
  }

  /* quick stats */
  const filedToday = ENTRIES.filter((e) => e.filedDate === "2026-03-29").length;
  const pendingClearance = ENTRIES.filter((e) => ["filed", "under_review", "cbp_hold"].includes(e.status)).length;
  const isfUrgent = ISF_DEADLINES.filter((d) => d.hoursRemaining <= 24).length;

  /* style tokens */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const headerText = isLight ? "text-slate-900" : "text-white";
  const subText = isLight ? "text-slate-500" : "text-slate-400";
  const dimText = isLight ? "text-slate-400" : "text-slate-500";
  const inputBg = isLight
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    : "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500";
  const tableBorder = isLight ? "border-slate-100" : "border-slate-700/40";
  const tableRowHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30";

  /* pipeline stage colors */
  function pipelineStageColor(stage: PipelineStage) {
    const map: Record<PipelineStage, { bg: string; ring: string; count: string }> = {
      draft: {
        bg: isLight ? "bg-slate-100" : "bg-slate-700/40",
        ring: isLight ? "ring-slate-300" : "ring-slate-600",
        count: isLight ? "text-slate-700" : "text-slate-300",
      },
      filed: {
        bg: isLight ? "bg-blue-50" : "bg-blue-500/10",
        ring: isLight ? "ring-blue-300" : "ring-blue-500/40",
        count: isLight ? "text-blue-700" : "text-blue-400",
      },
      under_review: {
        bg: isLight ? "bg-amber-50" : "bg-amber-500/10",
        ring: isLight ? "ring-amber-300" : "ring-amber-500/40",
        count: isLight ? "text-amber-700" : "text-amber-400",
      },
      cbp_hold: {
        bg: isLight ? "bg-red-50" : "bg-red-500/10",
        ring: isLight ? "ring-red-300" : "ring-red-500/40",
        count: isLight ? "text-red-700" : "text-red-400",
      },
      released: {
        bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10",
        ring: isLight ? "ring-emerald-300" : "ring-emerald-500/40",
        count: isLight ? "text-emerald-700" : "text-emerald-400",
      },
      liquidated: {
        bg: isLight ? "bg-purple-50" : "bg-purple-500/10",
        ring: isLight ? "ring-purple-300" : "ring-purple-500/40",
        count: isLight ? "text-purple-700" : "text-purple-400",
      },
    };
    return map[stage];
  }

  if (isLoading) {
    return (
      <div className={cn("min-h-screen p-6", bg)}>
        <Skeleton className={cn("h-8 w-80 mb-6 rounded", isLight ? "bg-slate-200" : "bg-slate-700")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={cn("h-24 rounded-xl", isLight ? "bg-slate-200" : "bg-slate-700")} />
          ))}
        </div>
        <LoadingSkeleton isLight={isLight} rows={6} />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", bg)}>

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-indigo-100" : "bg-indigo-500/15")}>
            <Shield className={cn("w-7 h-7", isLight ? "text-indigo-600" : "text-indigo-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold tracking-tight", headerText)}>Customs Operations Center</h1>
            <p className={cn("text-sm", subText)}>
              {BROKER_INFO.name} &mdash; License #{BROKER_INFO.license}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", isLight ? "bg-indigo-100 text-indigo-700" : "bg-indigo-500/20 text-indigo-400")}>
            {BROKER_INFO.district}
          </Badge>
          <Badge className={cn("text-xs", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")}>
            <CircleDot className="w-3 h-3 mr-1" /> ACE Connected
          </Badge>
        </div>
      </div>

      {/* ═══════════════ QUICK STATS ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Entries Filed Today" value={filedToday} accent="blue" isLight={isLight} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Clearance" value={pendingClearance} accent="amber" isLight={isLight} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="ISF Deadlines (24h)" value={isfUrgent} sub="Urgent attention required" accent="red" isLight={isLight} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Entries YTD" value={FINANCIAL_SUMMARY.entriesYTD.toLocaleString()} sub={`Avg ${FINANCIAL_SUMMARY.avgDaysToRelease}d to release`} accent="emerald" isLight={isLight} />
      </div>

      {/* ═══════════════ ENTRY PIPELINE (HERO) ═══════════════ */}
      <SectionCard title="Entry Pipeline" icon={<ArrowRight className="w-5 h-5 text-indigo-400" />} isLight={isLight}
        headerRight={
          pipelineFilter !== "all" ? (
            <Button variant="ghost" size="sm" onClick={() => setPipelineFilter("all")}
              className={cn("text-xs", subText)}>
              Clear Filter
            </Button>
          ) : null
        }
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-0">
          {PIPELINE_STAGES.map((stage, idx) => {
            const colors = pipelineStageColor(stage.key);
            const isActive = pipelineFilter === stage.key;
            return (
              <React.Fragment key={stage.key}>
                <button
                  onClick={() => setPipelineFilter(pipelineFilter === stage.key ? "all" : stage.key)}
                  className={cn(
                    "flex flex-col items-center rounded-xl px-4 py-3 md:px-6 md:py-4 transition-all cursor-pointer ring-2",
                    colors.bg,
                    isActive ? colors.ring : "ring-transparent",
                    isActive ? "scale-105 shadow-lg" : "hover:scale-[1.03]",
                  )}
                >
                  <span className={cn("text-2xl md:text-3xl font-bold tabular-nums", colors.count)}>
                    {pipelineCounts[stage.key]}
                  </span>
                  <span className={cn("text-[11px] md:text-xs font-medium mt-1", isLight ? "text-slate-600" : "text-slate-400")}>
                    {stage.label}
                  </span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className={cn("w-4 h-4 hidden md:block shrink-0", dimText)} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className={cn("mt-3 text-xs", dimText)}>
          Total entries: {ENTRIES.length} &mdash; Click a stage to filter the Active Entries table below
        </div>
      </SectionCard>

      {/* ═══════════════ ISF DEADLINES (CRITICAL) ═══════════════ */}
      <SectionCard
        title="ISF 10+2 Filing Deadlines"
        icon={<CalendarClock className="w-5 h-5 text-amber-400" />}
        isLight={isLight}
        headerRight={
          <Badge className={cn("text-xs", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")}>
            <AlertTriangle className="w-3 h-3 mr-1" /> {ISF_DEADLINES.filter(d => d.status === "overdue").length} OVERDUE
          </Badge>
        }
      >
        {/* $5,000 penalty warning */}
        <div className={cn(
          "flex items-start gap-2 rounded-lg px-3 py-2 mb-4 text-xs border",
          isLight ? "bg-red-50 border-red-200 text-red-700" : "bg-red-500/10 border-red-500/30 text-red-400",
        )}>
          <Ban className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>$5,000 penalty per violation</strong> — ISF must be filed at least 24 hours before vessel lading at foreign port. Late filings result in CBP liquidated damages.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-xs", tableBorder, subText)}>
                <th className="text-left py-2 px-3 font-medium">Vessel / Voyage</th>
                <th className="text-left py-2 px-3 font-medium">Importer</th>
                <th className="text-left py-2 px-3 font-medium">ETA</th>
                <th className="text-left py-2 px-3 font-medium">Deadline</th>
                <th className="text-center py-2 px-3 font-medium">Hours Left</th>
                <th className="text-center py-2 px-3 font-medium">Status</th>
                <th className="text-right py-2 px-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ISF_DEADLINES.sort((a, b) => a.hoursRemaining - b.hoursRemaining).map((d) => {
                const isOverdue = d.status === "overdue";
                const isUrgent = d.hoursRemaining > 0 && d.hoursRemaining <= 24;
                return (
                  <tr key={d.id} className={cn(
                    "border-b transition-colors", tableBorder, tableRowHover,
                    isOverdue && (isLight ? "bg-red-50/60" : "bg-red-500/5"),
                    isUrgent && !isOverdue && (isLight ? "bg-amber-50/60" : "bg-amber-500/5"),
                  )}>
                    <td className={cn("py-2.5 px-3", headerText)}>
                      <div className="flex items-center gap-2">
                        <Ship className={cn("w-4 h-4", isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-blue-400")} />
                        <div>
                          <div className="font-medium">{d.vesselName}</div>
                          <div className={cn("text-xs", dimText)}>{d.voyage}</div>
                        </div>
                      </div>
                    </td>
                    <td className={cn("py-2.5 px-3", subText)}>{d.importer}</td>
                    <td className={cn("py-2.5 px-3 tabular-nums", subText)}>{d.eta}</td>
                    <td className={cn("py-2.5 px-3 tabular-nums", isOverdue ? (isLight ? "text-red-600 font-semibold" : "text-red-400 font-semibold") : subText)}>
                      {d.deadline}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                        isOverdue
                          ? (isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")
                          : isUrgent
                            ? (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                            : (isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"),
                      )}>
                        {isOverdue ? `${Math.abs(d.hoursRemaining)}h LATE` : `${d.hoursRemaining}h`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {d.status === "filed" && (
                        <Badge className={cn(isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Filed
                        </Badge>
                      )}
                      {d.status === "pending" && (
                        <Badge className={cn(isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")}>
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                      {d.status === "overdue" && (
                        <Badge className={cn(isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")}>
                          <XCircle className="w-3 h-3 mr-1" /> OVERDUE
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {d.status !== "filed" && (
                        <Button size="sm" variant={isOverdue ? "destructive" : "outline"}
                          className={cn("text-xs h-7",
                            !isOverdue && (isLight ? "border-blue-300 text-blue-700 hover:bg-blue-50" : "border-blue-500/40 text-blue-400 hover:bg-blue-500/10")
                          )}>
                          <FileText className="w-3 h-3 mr-1" />
                          File ISF
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══════════════ HTS CLASSIFICATION + DUTY CALCULATOR ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* HTS Classification */}
        <SectionCard title="HTS Classification" icon={<BookOpen className="w-5 h-5 text-cyan-400" />} isLight={isLight}
          headerRight={
            <Button size="sm" variant="outline"
              className={cn("text-xs h-7", isLight ? "border-cyan-300 text-cyan-700 hover:bg-cyan-50" : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10")}>
              <Sparkles className="w-3 h-3 mr-1" /> Classify New
            </Button>
          }
        >
          <div className="mb-3">
            <div className="relative">
              <SearchIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", dimText)} />
              <Input
                placeholder="Search HTS code or description..."
                value={htsSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHtsSearch(e.target.value)}
                className={cn("pl-9 text-sm h-9", inputBg)}
              />
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredClassifications.map((c) => (
              <div key={c.id} className={cn(
                "rounded-lg border p-3 transition-colors",
                isLight ? "bg-slate-50 border-slate-200 hover:border-cyan-300" : "bg-slate-700/30 border-slate-700/40 hover:border-cyan-500/30",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className={cn("text-sm font-mono font-semibold", isLight ? "text-cyan-700" : "text-cyan-400")}>{c.htsCode}</code>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        c.dutyRate === "Free"
                          ? (isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")
                          : (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400"),
                      )}>
                        {c.dutyRate}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-1 leading-relaxed", subText)}>{c.description}</p>
                    <div className={cn("flex items-center gap-3 mt-1 text-[11px]", dimText)}>
                      <span>Sec. {c.section}</span>
                      <span>Ch. {c.chapter}</span>
                      <span>{c.classifiedDate}</span>
                    </div>
                  </div>
                  {c.aiConfidence && (
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        c.aiConfidence >= 90
                          ? (isLight ? "text-emerald-600" : "text-emerald-400")
                          : c.aiConfidence >= 80
                            ? (isLight ? "text-amber-600" : "text-amber-400")
                            : (isLight ? "text-red-600" : "text-red-400"),
                      )}>
                        <Sparkles className="w-3 h-3" />
                        {c.aiConfidence}%
                      </div>
                      <div className={cn("text-[10px]", dimText)}>AI confidence</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Duty Calculator */}
        <SectionCard title="Duty Calculator" icon={<Calculator className="w-5 h-5 text-purple-400" />} isLight={isLight}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={cn("text-xs font-medium mb-1 block", subText)}>HTS Code</label>
                <Input
                  value={calcHTS}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcHTS(e.target.value)}
                  placeholder="8507.60.0020"
                  className={cn("text-sm h-9 font-mono", inputBg)}
                />
              </div>
              <div>
                <label className={cn("text-xs font-medium mb-1 block", subText)}>Country of Origin</label>
                <Input
                  value={calcOrigin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcOrigin(e.target.value)}
                  placeholder="CN, MX, DE..."
                  className={cn("text-sm h-9 uppercase", inputBg)}
                />
              </div>
              <div>
                <label className={cn("text-xs font-medium mb-1 block", subText)}>Declared Value (USD)</label>
                <Input
                  value={calcValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcValue(e.target.value)}
                  placeholder="100000"
                  className={cn("text-sm h-9 tabular-nums", inputBg)}
                />
              </div>
            </div>

            <Button onClick={handleCalcDuty}
              className={cn("w-full text-sm h-10",
                isLight ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-purple-600 text-white hover:bg-purple-500"
              )}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Duties & Fees
            </Button>

            {calcResult && (
              <div className={cn(
                "rounded-xl border p-4 space-y-3",
                isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/10 border-purple-500/30",
              )}>
                {calcResult.usmca && (
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border",
                    isLight ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                  )}>
                    <Globe className="w-4 h-4" />
                    USMCA Eligible — Duty reduced to $0.00 under trade agreement
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className={cn("text-[11px] font-medium mb-0.5", subText)}>Duty</div>
                    <div className={cn("text-lg font-bold tabular-nums", headerText)}>
                      ${calcResult.duty.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-[11px] font-medium mb-0.5", subText)}>MPF</div>
                    <div className={cn("text-lg font-bold tabular-nums", headerText)}>
                      ${calcResult.mpf.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={cn("text-[10px]", dimText)}>0.3464% (min $31.67 / max $614.35)</div>
                  </div>
                  <div>
                    <div className={cn("text-[11px] font-medium mb-0.5", subText)}>HMF</div>
                    <div className={cn("text-lg font-bold tabular-nums", headerText)}>
                      ${calcResult.hmf.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={cn("text-[10px]", dimText)}>0.125% harbor maintenance</div>
                  </div>
                  <div>
                    <div className={cn("text-[11px] font-medium mb-0.5", isLight ? "text-purple-600" : "text-purple-400")}>Total</div>
                    <div className={cn("text-xl font-extrabold tabular-nums", isLight ? "text-purple-700" : "text-purple-300")}>
                      ${calcResult.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* quick reference */}
            <div className={cn("rounded-lg border p-3 text-xs", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-700/40")}>
              <div className={cn("font-medium mb-1.5 flex items-center gap-1", subText)}>
                <Info className="w-3 h-3" /> Quick Reference
              </div>
              <div className={cn("grid grid-cols-2 gap-1", dimText)}>
                <span>MPF: Merchandise Processing Fee</span>
                <span>HMF: Harbor Maintenance Fee</span>
                <span>AD/CVD: Anti-dumping / Countervailing Duty</span>
                <span>USMCA: US-Mexico-Canada Agreement</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════ ACTIVE ENTRIES TABLE ═══════════════ */}
      <SectionCard title="Active Entries" icon={<Package className="w-5 h-5 text-blue-400" />} isLight={isLight}
        headerRight={
          <div className="flex items-center gap-2">
            {pipelineFilter !== "all" && (
              <Badge className={cn("text-xs", isLight ? "bg-indigo-100 text-indigo-700" : "bg-indigo-500/20 text-indigo-400")}>
                Filtered: {PIPELINE_STAGES.find(s => s.key === pipelineFilter)?.label}
              </Badge>
            )}
            <span className={cn("text-xs tabular-nums", dimText)}>{filteredEntries.length} entries</span>
          </div>
        }
      >
        <div className="mb-3">
          <div className="relative">
            <SearchIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", dimText)} />
            <Input
              placeholder="Search entry number, importer, commodity, HTS..."
              value={entrySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntrySearch(e.target.value)}
              className={cn("pl-9 text-sm h-9", inputBg)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-xs", tableBorder, subText)}>
                <th className="text-left py-2 px-3 font-medium">Entry Number</th>
                <th className="text-left py-2 px-3 font-medium">Importer</th>
                <th className="text-left py-2 px-3 font-medium">Commodity</th>
                <th className="text-left py-2 px-3 font-medium">HTS</th>
                <th className="text-right py-2 px-3 font-medium">Value</th>
                <th className="text-right py-2 px-3 font-medium">Duty</th>
                <th className="text-center py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className={cn("py-8 text-center text-sm", subText)}>
                    No entries match the current filter
                  </td>
                </tr>
              ) : filteredEntries.map((e) => {
                const isHold = e.status === "cbp_hold";
                return (
                  <tr key={e.id} className={cn(
                    "border-b transition-colors", tableBorder, tableRowHover,
                    isHold && (isLight ? "bg-red-50/50" : "bg-red-500/5"),
                  )}>
                    <td className={cn("py-2.5 px-3 font-mono text-xs", headerText)}>
                      {e.entryNumber}
                    </td>
                    <td className={cn("py-2.5 px-3", headerText)}>{e.importer}</td>
                    <td className={cn("py-2.5 px-3", subText)}>{e.commodity}</td>
                    <td className={cn("py-2.5 px-3 font-mono text-xs", isLight ? "text-cyan-700" : "text-cyan-400")}>
                      {e.htsCode}
                    </td>
                    <td className={cn("py-2.5 px-3 text-right tabular-nums", headerText)}>
                      ${e.declaredValue.toLocaleString()}
                    </td>
                    <td className={cn("py-2.5 px-3 text-right tabular-nums font-medium",
                      e.dutyAmount === 0
                        ? (isLight ? "text-emerald-600" : "text-emerald-400")
                        : headerText
                    )}>
                      {e.dutyAmount === 0 ? "Free" : `$${e.dutyAmount.toLocaleString()}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={e.status} isLight={isLight} />
                    </td>
                    <td className="py-2.5 px-3">
                      {isHold && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <div>
                            <div className={cn("text-xs font-medium", isLight ? "text-red-700" : "text-red-400")}>
                              {e.examType}
                            </div>
                            <div className={cn("text-[10px]", dimText)}>{e.holdReason}</div>
                          </div>
                        </div>
                      )}
                      {e.status === "draft" && (
                        <span className={cn("text-xs", dimText)}>Not yet submitted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══════════════ COMPLIANCE PROGRAMS + FINANCIAL ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Compliance Programs */}
        <SectionCard title="Compliance Programs" icon={<Award className="w-5 h-5 text-emerald-400" />} isLight={isLight}>
          <div className="space-y-2.5">
            {COMPLIANCE_PROGRAMS.map((p) => {
              const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
                active: {
                  bg: isLight ? "bg-emerald-100" : "bg-emerald-500/20",
                  text: isLight ? "text-emerald-700" : "text-emerald-400",
                  icon: <CheckCircle2 className="w-3 h-3" />,
                },
                pending: {
                  bg: isLight ? "bg-amber-100" : "bg-amber-500/20",
                  text: isLight ? "text-amber-700" : "text-amber-400",
                  icon: <Clock className="w-3 h-3" />,
                },
                expired: {
                  bg: isLight ? "bg-red-100" : "bg-red-500/20",
                  text: isLight ? "text-red-700" : "text-red-400",
                  icon: <XCircle className="w-3 h-3" />,
                },
                not_enrolled: {
                  bg: isLight ? "bg-slate-100" : "bg-slate-600/30",
                  text: isLight ? "text-slate-600" : "text-slate-400",
                  icon: <Info className="w-3 h-3" />,
                },
              };
              const st = statusMap[p.status] || statusMap.not_enrolled;
              return (
                <div key={p.code} className={cn(
                  "rounded-lg border p-3 flex items-start gap-3 transition-colors",
                  isLight ? "bg-slate-50 border-slate-200 hover:border-emerald-300" : "bg-slate-700/30 border-slate-700/40 hover:border-emerald-500/30",
                )}>
                  <div className={cn("p-1.5 rounded-lg shrink-0", st.bg)}>
                    {p.name === "C-TPAT" && <Shield className={cn("w-4 h-4", st.text)} />}
                    {p.name === "ACE Portal" && <Globe className={cn("w-4 h-4", st.text)} />}
                    {p.name === "FTZ Operator" && <Warehouse className={cn("w-4 h-4", st.text)} />}
                    {p.name === "Drawback Claims" && <RefreshCw className={cn("w-4 h-4", st.text)} />}
                    {p.name === "Trusted Trader (NEEC/MX)" && <Lock className={cn("w-4 h-4", st.text)} />}
                    {p.name === "ISA Self-Assessment" && <Eye className={cn("w-4 h-4", st.text)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", headerText)}>{p.name}</span>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", st.bg, st.text)}>
                        {st.icon}
                        {p.status === "not_enrolled" ? "Not Enrolled" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-0.5", subText)}>{p.detail}</p>
                    {p.expiryDate && (
                      <p className={cn("text-[10px] mt-0.5", dimText)}>Expires: {p.expiryDate}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Financial Summary */}
        <SectionCard title="Financial Summary" icon={<DollarSign className="w-5 h-5 text-teal-400" />} isLight={isLight}>
          <div className="space-y-5">
            {/* Fees earned */}
            <div>
              <div className={cn("text-xs font-medium mb-2 flex items-center gap-1", subText)}>
                <BarChart3 className="w-3.5 h-3.5" /> Brokerage Fees Earned
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "This Week", value: FINANCIAL_SUMMARY.feesThisWeek },
                  { label: "This Month", value: FINANCIAL_SUMMARY.feesThisMonth },
                  { label: "Year to Date", value: FINANCIAL_SUMMARY.feesThisYear },
                ].map((item) => (
                  <div key={item.label} className={cn(
                    "rounded-lg border p-3 text-center",
                    isLight ? "bg-teal-50 border-teal-200" : "bg-teal-500/10 border-teal-500/30",
                  )}>
                    <div className={cn("text-lg font-bold tabular-nums", isLight ? "text-teal-700" : "text-teal-400")}>
                      ${item.value.toLocaleString()}
                    </div>
                    <div className={cn("text-[10px] mt-0.5", dimText)}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outstanding duties */}
            <div className={cn(
              "rounded-lg border p-4",
              isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30",
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-xs font-medium", subText)}>Outstanding Duties to Collect</div>
                  <div className={cn("text-2xl font-bold tabular-nums mt-1", isLight ? "text-amber-700" : "text-amber-400")}>
                    ${FINANCIAL_SUMMARY.outstandingDuties.toLocaleString()}
                  </div>
                </div>
                <DollarSign className={cn("w-8 h-8", isLight ? "text-amber-300" : "text-amber-600")} />
              </div>
            </div>

            {/* Bonds */}
            <div>
              <div className={cn("text-xs font-medium mb-2 flex items-center gap-1", subText)}>
                <Lock className="w-3.5 h-3.5" /> Customs Bonds
              </div>
              <div className={cn(
                "rounded-lg border p-3 space-y-3",
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-700/40",
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", headerText)}>Active Continuous Bonds</span>
                  <span className={cn("text-sm font-bold", isLight ? "text-indigo-600" : "text-indigo-400")}>{FINANCIAL_SUMMARY.bondsActive}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", headerText)}>Total Bond Amount</span>
                  <span className={cn("text-sm font-bold tabular-nums", headerText)}>${FINANCIAL_SUMMARY.bondsTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", headerText)}>Surety Company</span>
                  <span className={cn("text-sm", subText)}>{FINANCIAL_SUMMARY.bondsSurety}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-xs", dimText)}>Bond utilization (estimated)</span>
                    <span className={cn("text-xs font-medium tabular-nums", subText)}>
                      {Math.round((FINANCIAL_SUMMARY.outstandingDuties / FINANCIAL_SUMMARY.bondsTotal) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.round((FINANCIAL_SUMMARY.outstandingDuties / FINANCIAL_SUMMARY.bondsTotal) * 100)}
                    className={cn("h-2", isLight ? "bg-slate-200" : "bg-slate-700")}
                  />
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "rounded-lg border p-3 text-center",
                isLight ? "bg-indigo-50 border-indigo-200" : "bg-indigo-500/10 border-indigo-500/30",
              )}>
                <div className={cn("text-2xl font-bold tabular-nums", isLight ? "text-indigo-700" : "text-indigo-400")}>
                  {FINANCIAL_SUMMARY.avgDaysToRelease}d
                </div>
                <div className={cn("text-[10px] mt-0.5", dimText)}>Avg. Days to Release</div>
              </div>
              <div className={cn(
                "rounded-lg border p-3 text-center",
                isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30",
              )}>
                <div className={cn("text-2xl font-bold tabular-nums", isLight ? "text-blue-700" : "text-blue-400")}>
                  {FINANCIAL_SUMMARY.entriesYTD}
                </div>
                <div className={cn("text-[10px] mt-0.5", dimText)}>Entries Filed YTD</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <div className={cn("text-center text-xs py-4", dimText)}>
        U.S. Customs & Border Protection &mdash; ACE/ABI Integration &mdash; Data refreshed at{" "}
        {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
