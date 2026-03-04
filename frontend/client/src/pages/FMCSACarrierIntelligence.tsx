/**
 * FMCSA Carrier Intelligence — Carrier411 Replacement
 * 
 * Full carrier vetting powered by FMCSA bulk data ETL.
 * Lookup by DOT#, MC#, or name. View safety scores, authority,
 * insurance, crashes, inspections, violations, OOS orders, and monitoring.
 */

import { useState, useRef, useEffect } from "react";
import {
  Search, Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle,
  CheckCircle, XCircle, Truck, FileText, Activity, Eye, Bell, BellOff,
  ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown, Loader2,
  Database, Clock, Building2, Phone, Mail, MapPin, Hash, Star,
  UserPlus, Send, Users, Fuel, Award, Globe, ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { InviteModal } from "@/components/InviteModal";
import type { InviteTarget } from "@/components/InviteModal";

// ============================================================================
// TYPES
// ============================================================================

type Tab = "overview" | "safety" | "authority" | "insurance" | "inspections" | "crashes" | "monitoring";

// ============================================================================
// SAFETY SCORE GAUGE
// ============================================================================

function ScoreGauge({ label, score, alert, max = 100 }: { label: string; score: number | null; alert: boolean; max?: number }) {
  const pct = score != null ? Math.min((score / max) * 100, 100) : 0;
  const color = alert ? "text-red-400" : score != null && score > 65 ? "text-yellow-400" : "text-emerald-400";
  const bgColor = alert ? "bg-red-500/20" : score != null && score > 65 ? "bg-yellow-500/20" : "bg-emerald-500/20";
  const barColor = alert ? "bg-red-500" : score != null && score > 65 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className={`rounded-lg p-3 ${bgColor} border border-white/5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        {alert && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
      </div>
      <div className={`text-xl font-bold ${color}`}>
        {score != null ? score.toFixed(1) : "N/A"}
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// CARRIER VERIFICATION BADGE
// ============================================================================

function VerificationBadge({ dotNumber }: { dotNumber: string }) {
  const { data, isLoading } = trpc.fmcsaData.verifyCarrierForLoad.useQuery(
    { dotNumber, loadType: "general" },
    { enabled: !!dotNumber }
  );

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
  if (!data) return null;

  const tier = (data as any).eligibilityTier || (data.verified ? "VERIFIED" : "BLOCKED");

  if (tier === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5" /> Verified
      </span>
    );
  }
  if (tier === "CONDITIONAL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
        <ShieldAlert className="w-3.5 h-3.5" /> Conditional
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
      <ShieldX className="w-3.5 h-3.5" /> Blocked
    </span>
  );
}

// ============================================================================
// HAZMAT DOCUMENT UPLOAD PANEL
// ============================================================================

function HazMatDocPanel({ dotNumber }: { dotNumber: string }) {
  const { data: verification } = trpc.fmcsaData.verifyCarrierForLoad.useQuery(
    { dotNumber, loadType: "hazmat" },
    { enabled: !!dotNumber }
  );
  const { data: hazmatDocs, refetch } = (trpc as any).fmcsaData.getHazmatDocs.useQuery(
    { dotNumber },
    { enabled: !!dotNumber }
  );
  const submitDoc = (trpc as any).fmcsaData.submitHazmatDoc.useMutation({
    onSuccess: () => refetch(),
  });

  const snap = (verification as any)?.snapshot;
  if (!snap?.hazmatClassified) return null;

  const requiredDocs = [
    { type: "HAZMAT_CDL", label: "HazMat CDL Endorsement", desc: "CDL with H or X endorsement" },
    { type: "TWIC_CARD", label: "TWIC Card", desc: "Transportation Worker ID Credential" },
    { type: "SECURITY_ASSESSMENT", label: "Security Threat Assessment", desc: "TSA security clearance" },
  ];

  const getDocStatus = (docType: string) => {
    if (!hazmatDocs?.docs) return null;
    return hazmatDocs.docs.find((d: any) => d.docType === docType);
  };

  const handleFileSelect = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    submitDoc.mutate({
      dotNumber,
      docType,
      fileUrl: `https://storage.eusotrip.com/hazmat-docs/${dotNumber}/${docType}/${file.name}`,
      fileName: file.name,
    });
  };

  return (
    <div className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Fuel className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-amber-400">HazMat Document Verification</h3>
        {hazmatDocs?.allVerified && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
            <CheckCircle className="w-3 h-3" /> All Verified
          </span>
        )}
      </div>
      <p className="text-[10px] text-amber-300/60 mb-3">
        HazMat carriers must upload endorsement documents for AI-powered verification before accessing hazmat loads.
      </p>
      <div className="space-y-2">
        {requiredDocs.map((doc) => {
          const existing = getDocStatus(doc.type);
          const status = existing?.status;
          return (
            <div key={doc.type} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                {status === "VERIFIED" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : status === "PENDING" ? (
                  <Clock className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />
                ) : status === "REJECTED" ? (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-gray-200 font-medium truncate">{doc.label}</p>
                  <p className="text-[10px] text-gray-500">{doc.desc}</p>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                {status === "VERIFIED" ? (
                  <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
                ) : status === "PENDING" ? (
                  <span className="text-[10px] text-yellow-400 font-medium">Reviewing...</span>
                ) : status === "REJECTED" ? (
                  <div className="text-right">
                    <span className="text-[10px] text-red-400 font-medium block">Rejected</span>
                    <label className="text-[10px] text-blue-400 cursor-pointer hover:underline">
                      Re-upload
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileSelect(doc.type, e)} />
                    </label>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium cursor-pointer hover:bg-amber-500/30 transition-colors">
                    Upload
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileSelect(doc.type, e)} />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VERIFICATION CHECKLIST PANEL
// ============================================================================

function VerificationChecklist({ dotNumber }: { dotNumber: string }) {
  const { data, isLoading } = trpc.fmcsaData.verifyCarrierForLoad.useQuery(
    { dotNumber, loadType: "general" },
    { enabled: !!dotNumber }
  );

  if (isLoading) return <div className="animate-pulse bg-white/5 rounded-lg h-40" />;
  if (!data) return null;

  const checks = (data as any).checks as Record<string, boolean | null> | undefined;
  const inspSum = (data as any).inspectionSummary as { total24mo: number; oosCount: number; oosRate: number } | undefined;
  const snap = (data as any).snapshot as any;
  const tier = (data as any).eligibilityTier || (data.verified ? "VERIFIED" : "BLOCKED");
  const score = (data as any).verificationScore || 0;
  const breakdown = snap?.scoreBreakdown as { coreCompliance: number; safetyPerformance: number; trustSignals: number } | null;
  const ptrust = snap?.platformTrust as { completedLoads: number; onTimeRate: number; isOnPlatform: boolean } | null;

  // ── Core Compliance Checks (60 pts) ──
  const coreChecks = [
    { label: "Operating Authority", key: "authority", detail: snap?.authorityStatus || "Unknown", weight: "15 pts" },
    { label: "Insurance (BIPD ≥$750K)", key: "insurance",
      detail: snap?.bipdCoverageAmount
        ? `$${(snap.bipdCoverageAmount / 1000).toFixed(0)}K — ${snap?.insuranceStatus || "Unknown"}`
        : snap?.insuranceStatus || "Unknown",
      weight: "15 pts",
    },
    { label: "BOC-3 Filing", key: "boc3", detail: snap?.hasBoc3 ? "On File" : "Not Found", weight: "10 pts" },
    { label: "MCS-150 Current", key: null,
      passed: snap?.mcs150Stale === false,
      detail: snap?.mcs150Stale ? "Outdated (>24mo)" : "Current",
      weight: "5 pts",
    },
    { label: "Carrier Age ≥18mo", key: null,
      passed: snap?.isNewEntrant === false,
      detail: snap?.isNewEntrant
        ? `New entrant (${snap?.carrierAgeDays ? Math.round(snap.carrierAgeDays / 30) + " mo" : "unknown"})`
        : snap?.carrierAgeDays ? `${Math.round(snap.carrierAgeDays / 365 * 10) / 10} yrs` : "Established",
      weight: "5 pts",
    },
    { label: "No Fatal/Injury Crashes (24mo)", key: null,
      passed: snap?.crashSeverity24mo ? snap.crashSeverity24mo.fatal === 0 && snap.crashSeverity24mo.injury === 0 : true,
      detail: snap?.crashSeverity24mo
        ? snap.crashSeverity24mo.fatal > 0
          ? `${snap.crashSeverity24mo.fatal} FATAL`
          : snap.crashSeverity24mo.injury > 0
            ? `${snap.crashSeverity24mo.injury} injury`
            : "Clear"
        : "N/A",
      weight: "5 pts",
    },
    { label: "SMS BASICs Below Threshold", key: null,
      passed: snap?.smsBasicBreaches?.length === 0,
      detail: snap?.smsBasicBreaches?.length > 0
        ? `Breaches: ${snap.smsBasicBreaches.join(", ")}`
        : "All clear",
      weight: "5 pts",
    },
  ];

  // ── Safety Performance Checks (25 pts) ──
  const safetyChecks = [
    { label: "No OOS Orders", key: "oosOrder", detail: snap?.oosOrder ? "ACTIVE OOS ORDER" : "Clear", weight: "8 pts" },
    { label: "Inspection OOS Rate", key: "inspections",
      detail: inspSum ? `${inspSum.oosRate}% (${inspSum.total24mo} inspections)` : "N/A",
      weight: "8 pts",
    },
    { label: "Violations/Power Unit", key: null,
      passed: (snap?.violationsPerUnit ?? 0) < 1.5,
      detail: snap?.violationsPerUnit != null ? `${snap.violationsPerUnit.toFixed(2)} per truck` : "N/A",
      weight: "4 pts",
    },
  ];

  const tierColors = {
    VERIFIED: { bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", icon: ShieldCheck },
    CONDITIONAL: { bg: "from-yellow-500/10 to-yellow-500/5", border: "border-yellow-500/30", text: "text-yellow-400", icon: ShieldAlert },
    BLOCKED: { bg: "from-red-500/10 to-red-500/5", border: "border-red-500/30", text: "text-red-400", icon: ShieldX },
  };
  const tc = tierColors[tier as keyof typeof tierColors] || tierColors.BLOCKED;
  const TierIcon = tc.icon;

  const scoreColor = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-blue-400" : score >= 50 ? "text-yellow-400" : "text-red-400";

  function CheckRow({ label, passed, pending, detail, weight }: { label: string; passed: boolean; pending: boolean; detail: string; weight: string }) {
    return (
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {pending ? (
            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          ) : passed ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className="text-gray-300 truncate">{label}</span>
          <span className="text-gray-600 text-[9px]">({weight})</span>
        </div>
        <span className={`font-medium shrink-0 ml-2 ${pending ? "text-gray-500" : passed ? "text-emerald-400" : "text-red-400"}`}>
          {detail}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-b ${tc.bg} border ${tc.border} rounded-xl p-4`}>
      {/* Header with tier + score */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TierIcon className={`w-5 h-5 ${tc.text}`} />
          <h3 className={`text-sm font-bold ${tc.text}`}>
            Platform Eligibility: {tier}
          </h3>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
          <span className="text-gray-500 text-xs">/100</span>
        </div>
      </div>

      {/* Score breakdown bar */}
      {breakdown && (
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3 bg-black/30">
          <div className="bg-blue-500 rounded-l-full transition-all" style={{ width: `${(breakdown.coreCompliance / 60) * 60}%` }}
               title={`Core Compliance: ${breakdown.coreCompliance}/60`} />
          <div className="bg-emerald-500 transition-all" style={{ width: `${(breakdown.safetyPerformance / 25) * 25}%` }}
               title={`Safety: ${breakdown.safetyPerformance}/25`} />
          <div className="bg-purple-500 rounded-r-full transition-all" style={{ width: `${(breakdown.trustSignals / 15) * 15}%` }}
               title={`Trust: ${breakdown.trustSignals}/15`} />
        </div>
      )}
      {breakdown && (
        <div className="flex justify-between text-[9px] text-gray-500 mb-3">
          <span>Core: <span className="text-blue-400">{breakdown.coreCompliance}</span>/60</span>
          <span>Safety: <span className="text-emerald-400">{breakdown.safetyPerformance}</span>/25</span>
          <span>Trust: <span className="text-purple-400">{breakdown.trustSignals}</span>/15</span>
        </div>
      )}

      {/* Core Compliance section */}
      <div className="mb-2">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Core Compliance</p>
        <div className="space-y-1.5">
          {coreChecks.map((item, i) => {
            const val = item.key ? checks?.[item.key] : undefined;
            const passed = item.key ? val === true : (item as any).passed ?? true;
            const pending = item.key ? val === null : false;
            return <CheckRow key={i} label={item.label} passed={passed} pending={pending} detail={item.detail} weight={item.weight} />;
          })}
        </div>
      </div>

      {/* Safety Performance section */}
      <div className="mb-2 pt-2 border-t border-white/5">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Safety Performance</p>
        <div className="space-y-1.5">
          {safetyChecks.map((item, i) => {
            const val = item.key ? checks?.[item.key] : undefined;
            const passed = item.key ? val === true : (item as any).passed ?? true;
            const pending = item.key ? val === null : false;
            return <CheckRow key={i} label={item.label} passed={passed} pending={pending} detail={item.detail} weight={item.weight} />;
          })}
        </div>
      </div>

      {/* Platform Trust section */}
      {ptrust?.isOnPlatform && (
        <div className="mb-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Platform Trust</p>
          <div className="flex gap-3 text-xs">
            <div>
              <span className="text-gray-500">Loads: </span>
              <span className="text-gray-200 font-medium">{ptrust.completedLoads}</span>
            </div>
            <div>
              <span className="text-gray-500">On-Time: </span>
              <span className={`font-medium ${ptrust.onTimeRate >= 90 ? "text-emerald-400" : ptrust.onTimeRate >= 75 ? "text-yellow-400" : "text-red-400"}`}>
                {ptrust.onTimeRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HazMat alert */}
      {snap?.hazmatClassified && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-xs">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-medium">HazMat Carrier</span>
            <span className="text-amber-300/70">
              {snap.hazmatDocsVerified ? "— Endorsement verified" : "— Documents required for platform access"}
            </span>
          </div>
        </div>
      )}

      {/* New entrant warning */}
      {snap?.isNewEntrant && (
        <div className="mt-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-400 font-medium">New Entrant Carrier</span>
            <span className="text-orange-300/70">— Registered &lt;18 months, elevated risk monitoring</span>
          </div>
        </div>
      )}

      {/* SMS BASIC breaches */}
      {snap?.smsBasicBreaches?.length > 0 && (
        <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 font-medium">FMCSA Intervention Threshold Exceeded</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {snap.smsBasicBreaches.map((b: string, i: number) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-medium">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.reason && (
        <p className="text-[10px] text-gray-500 mt-2">{data.reason}</p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function FMCSACarrierIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedDot, setSelectedDot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showInvite, setShowInvite] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search input — wait 400ms after user stops typing before querying
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget>({ name: "" });

  // Search — uses debounced query to avoid firing on every keystroke
  const searchEnabled = debouncedQuery.length >= 2;
  const searchResults = trpc.fmcsaData.search.useQuery(
    { query: debouncedQuery, limit: 15 },
    { enabled: searchEnabled, placeholderData: (prev: any) => prev, staleTime: 30_000 }
  );

  // Carrier detail queries (only when a DOT is selected)
  const snapshot = trpc.fmcsaData.getSnapshot.useQuery(
    { dotNumber: selectedDot! },
    { enabled: !!selectedDot }
  );
  const smsScores = trpc.fmcsaData.getSmsScores.useQuery(
    { dotNumber: selectedDot! },
    { enabled: !!selectedDot && (activeTab === "overview" || activeTab === "safety") }
  );
  const authority = trpc.fmcsaData.getAuthority.useQuery(
    { dotNumber: selectedDot! },
    { enabled: !!selectedDot && (activeTab === "overview" || activeTab === "authority") }
  );
  const insurance = trpc.fmcsaData.getInsurance.useQuery(
    { dotNumber: selectedDot! },
    { enabled: !!selectedDot && (activeTab === "overview" || activeTab === "insurance") }
  );
  const crashes = trpc.fmcsaData.getCrashes.useQuery(
    { dotNumber: selectedDot!, limit: 50 },
    { enabled: !!selectedDot && activeTab === "crashes" }
  );
  const inspections = trpc.fmcsaData.getInspections.useQuery(
    { dotNumber: selectedDot!, limit: 50 },
    { enabled: !!selectedDot && activeTab === "inspections" }
  );
  const verification = trpc.fmcsaData.verifyCarrierForLoad.useQuery(
    { dotNumber: selectedDot!, loadType: "general" },
    { enabled: !!selectedDot }
  );
  const dbStats = trpc.fmcsaData.getStats.useQuery(undefined, { staleTime: 60_000 });

  // Monitoring mutations
  const addMonitor = trpc.fmcsaData.addToMonitoring.useMutation();
  const removeMonitor = trpc.fmcsaData.removeFromMonitoring.useMutation();

  const selectCarrier = (dot: string) => {
    setSelectedDot(dot);
    setActiveTab("overview");
    setShowResults(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: Eye },
    { key: "safety", label: "Safety Scores", icon: Shield },
    { key: "authority", label: "Authority", icon: FileText },
    { key: "insurance", label: "Insurance", icon: Building2 },
    { key: "inspections", label: "Inspections", icon: Activity },
    { key: "crashes", label: "Crashes", icon: AlertTriangle },
    { key: "monitoring", label: "Monitor", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FMCSA Carrier Intelligence</h1>
                <p className="text-xs text-gray-400">
                  {dbStats.data ? (
                    <>
                      {(dbStats.data.records.census || 0).toLocaleString()} carriers · {(dbStats.data.records.inspections || 0).toLocaleString()} inspections · {(dbStats.data.records.monitoredCarriers || 0).toLocaleString()} monitored
                    </>
                  ) : "Powered by DOT Open Data Portal"}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search by DOT#, MC#, or company name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => { if (searchEnabled) setShowResults(true); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
            />
            {searchResults.isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400 z-10" />
            )}

            {/* Search Results Dropdown — inside searchRef so click-outside works */}
            {showResults && searchEnabled && searchResults.data && searchResults.data.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121a] border border-white/10 rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50">
              {searchResults.data.map((c) => (
                <button
                  key={c.dotNumber}
                  onClick={() => selectCarrier(c.dotNumber)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-left"
                >
                  <Truck className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{c.legalName}</span>
                      {c.oosOrder && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">OOS</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>DOT# {c.dotNumber}</span>
                      {c.mcNumber && <span>MC# {c.mcNumber}</span>}
                      <span>{c.city}, {c.state}</span>
                      <span>{c.powerUnits} trucks · {c.drivers} drivers</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      c.authorityStatus === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {c.authorityStatus}
                    </span>
                    {c.safetyAlerts.length > 0 && (
                      <span className="text-[10px] text-yellow-400">{c.safetyAlerts.length} alert{c.safetyAlerts.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedDot ? (
          /* No carrier selected — show DB stats */
          <div className="text-center py-20">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-300 mb-2">FMCSA Carrier Intelligence</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-lg mx-auto">
              Search any US carrier by DOT number, MC number, or company name.
              View authority status, insurance, safety scores, inspections, crashes, and set up real-time monitoring.
            </p>
            {dbStats.data && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {[
                  { label: "Carriers", value: dbStats.data.records.census },
                  { label: "Inspections", value: dbStats.data.records.inspections },
                  { label: "Violations", value: dbStats.data.records.violations },
                  { label: "SMS Scores", value: dbStats.data.records.smsScores },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-lg font-bold text-blue-400">{(s.value || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Carrier selected — show detail */
          <div>
            {/* Back button */}
            <button
              onClick={() => { setSelectedDot(null); setSearchQuery(""); }}
              className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
            >
              ← Back to search
            </button>

            {/* Carrier Header Card */}
            {snapshot.data && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold">{snapshot.data.legalName}</h2>
                      <VerificationBadge dotNumber={selectedDot} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> DOT# {selectedDot}</span>
                      {snapshot.data.authorityStatus && (
                        <span className={`flex items-center gap-1 font-medium ${
                          snapshot.data.authorityStatus === "ACTIVE" ? "text-emerald-400" : "text-red-400"
                        }`}>
                          <Shield className="w-3.5 h-3.5" /> {snapshot.data.authorityStatus}
                        </span>
                      )}
                      {snapshot.data.oosOrderActive && (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> OUT OF SERVICE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setInviteTarget({
                          name: snapshot.data?.legalName || "",
                          dot: selectedDot || undefined,
                          phone: snapshot.data?.telephone || undefined,
                          email: snapshot.data?.emailAddress || undefined,
                          fmcsaVerified: true,
                        });
                        setShowInvite(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 text-purple-300 text-xs font-medium hover:from-[#1473FF]/30 hover:to-[#BE01FF]/30 flex items-center gap-1 border border-purple-500/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite
                    </button>
                    <button
                      onClick={() => addMonitor.mutate({ dotNumber: selectedDot })}
                      disabled={addMonitor.isPending}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5" /> Monitor
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">Insurance</div>
                    <div className={`text-sm font-medium ${
                      snapshot.data.insuranceStatus === "VALID" ? "text-emerald-400" :
                      snapshot.data.insuranceStatus === "EXPIRING" ? "text-yellow-400" : "text-red-400"
                    }`}>{snapshot.data.insuranceStatus}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">BIPD on File</div>
                    <div className="text-sm font-medium text-gray-200">
                      {snapshot.data.bipdInsuranceOnFile ? `$${(snapshot.data.bipdInsuranceOnFile / 1000).toFixed(0)}K` : "N/A"}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">Common Auth</div>
                    <div className={`text-sm font-medium ${snapshot.data.commonAuthActive ? "text-emerald-400" : "text-red-400"}`}>
                      {snapshot.data.commonAuthActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">Unsafe Driving</div>
                    <div className={`text-sm font-medium ${snapshot.data.unsafeDrivingAlert ? "text-red-400" : "text-emerald-400"}`}>
                      {snapshot.data.unsafeDrivingScore?.toFixed(1) || "N/A"}
                      {snapshot.data.unsafeDrivingAlert && <AlertTriangle className="w-3 h-3 inline ml-0.5" />}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">OOS Order</div>
                    <div className={`text-sm font-medium ${snapshot.data.oosOrderActive ? "text-red-400" : "text-emerald-400"}`}>
                      {snapshot.data.oosOrderActive ? "ACTIVE" : "None"}
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="mt-4">
                  <VerificationChecklist dotNumber={selectedDot} />
                </div>

                {/* HazMat Document Upload (only shows for HazMat carriers) */}
                <div className="mt-4">
                  <HazMatDocPanel dotNumber={selectedDot} />
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    activeTab === tab.key
                      ? "bg-white/10 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && snapshot.data && (
              <div className="space-y-6">
                {/* Company Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5 space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" /> Company Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {snapshot.data.legalName && (
                        <div className="flex items-start gap-2">
                          <Globe className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                          <span className="text-gray-300">{snapshot.data.legalName}</span>
                        </div>
                      )}
                      {(snapshot.data.physicalAddress || snapshot.data.phyCity) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                          <span className="text-gray-400">
                            {snapshot.data.physicalAddress || ""}{snapshot.data.phyCity ? `, ${snapshot.data.phyCity}` : ""}{snapshot.data.phyState ? `, ${snapshot.data.phyState}` : ""} {snapshot.data.phyZip || ""}
                          </span>
                        </div>
                      )}
                      {snapshot.data.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-400">{snapshot.data.telephone}</span>
                        </div>
                      )}
                      {snapshot.data.emailAddress && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-400">{snapshot.data.emailAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/5 space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-400" /> Fleet & Operations
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500">Power Units</div>
                        <div className="text-lg font-bold text-white">{snapshot.data.powerUnits ?? "N/A"}</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500">Drivers</div>
                        <div className="text-lg font-bold text-white">{snapshot.data.driverTotal ?? "N/A"}</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500">Operation</div>
                        <div className="text-sm font-medium text-gray-300 capitalize">{(snapshot.data.carrierOperation || "N/A").toLowerCase()}</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500">HazMat Flag</div>
                        <div className={`text-sm font-medium ${snapshot.data.hmFlag === "Y" ? "text-amber-400" : "text-gray-400"}`}>
                          {snapshot.data.hmFlag === "Y" ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                    {snapshot.data.cargoCarried && Array.isArray(snapshot.data.cargoCarried) && snapshot.data.cargoCarried.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1.5">Cargo Types</div>
                        <div className="flex flex-wrap gap-1">
                          {snapshot.data.cargoCarried.map((cargo: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-medium border border-blue-500/20">
                              {cargo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invite CTA for non-platform carriers */}
                <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-purple-500/20 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-200">Invite this carrier to EusoTrip</p>
                    <p className="text-xs text-gray-400 mt-0.5">Send an invitation via email or SMS to connect and assign loads</p>
                  </div>
                  <button
                    onClick={() => {
                      setInviteTarget({
                        name: snapshot.data?.legalName || "",
                        dot: selectedDot || undefined,
                        phone: snapshot.data?.telephone || undefined,
                        email: snapshot.data?.emailAddress || undefined,
                        fmcsaVerified: true,
                      });
                      setShowInvite(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2 shrink-0"
                  >
                    <Send className="w-4 h-4" /> Send Invite
                  </button>
                </div>

                {/* SMS BASIC Scores Grid */}
                {smsScores.data && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> SMS BASIC Scores
                      <span className="text-xs text-gray-500">Run Date: {smsScores.data.runDate}</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      <ScoreGauge label="Unsafe Driving" score={smsScores.data.basics.unsafeDriving.score} alert={smsScores.data.basics.unsafeDriving.alert} />
                      <ScoreGauge label="HOS Compliance" score={smsScores.data.basics.hos.score} alert={smsScores.data.basics.hos.alert} />
                      <ScoreGauge label="Driver Fitness" score={smsScores.data.basics.driverFitness.score} alert={smsScores.data.basics.driverFitness.alert} />
                      <ScoreGauge label="Ctrl Substances" score={smsScores.data.basics.controlledSubstances.score} alert={smsScores.data.basics.controlledSubstances.alert} />
                      <ScoreGauge label="Vehicle Maint" score={smsScores.data.basics.vehicleMaintenance.score} alert={smsScores.data.basics.vehicleMaintenance.alert} />
                      <ScoreGauge label="HazMat" score={smsScores.data.basics.hazmat.score} alert={smsScores.data.basics.hazmat.alert} />
                      <ScoreGauge label="Crash Indicator" score={smsScores.data.basics.crashIndicator.score} alert={smsScores.data.basics.crashIndicator.alert} />
                    </div>
                  </div>
                )}

                {/* Authority Summary */}
                {authority.data && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Operating Authority
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Common Authority", active: authority.data.common.active, granted: authority.data.common.granted, revoked: authority.data.common.revoked },
                        { label: "Contract Authority", active: authority.data.contract.active, granted: authority.data.contract.granted, revoked: authority.data.contract.revoked },
                        { label: "Broker Authority", active: authority.data.broker.active, granted: authority.data.broker.granted, revoked: authority.data.broker.revoked },
                      ].map((a) => (
                        <div key={a.label} className={`rounded-lg p-3 border ${
                          a.active ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{a.label}</span>
                            {a.active ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div className={`text-sm font-medium ${a.active ? "text-emerald-400" : "text-gray-500"}`}>
                            {a.active ? "Active" : a.revoked ? "Revoked" : "Not Granted"}
                          </div>
                          {a.granted && <div className="text-[10px] text-gray-500 mt-0.5">Granted: {a.granted}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insurance Summary */}
                {insurance.data && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Active Insurance ({insurance.data.active.length} policies)
                    </h3>
                    {insurance.data.active.length > 0 ? (
                      <div className="space-y-2">
                        {insurance.data.active.slice(0, 5).map((p: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{p.type || "BIPD"}</div>
                              <div className="text-xs text-gray-400">{p.carrier} · Policy #{p.policyNumber}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-emerald-400">
                                {p.bipdLimit ? `$${(p.bipdLimit / 1000).toFixed(0)}K` : "On File"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {p.coverageFrom} → {p.coverageTo}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20 text-sm text-red-400">
                        No active insurance policies on file
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "safety" && smsScores.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  <ScoreGauge label="Unsafe Driving" score={smsScores.data.basics.unsafeDriving.score} alert={smsScores.data.basics.unsafeDriving.alert} />
                  <ScoreGauge label="HOS Compliance" score={smsScores.data.basics.hos.score} alert={smsScores.data.basics.hos.alert} />
                  <ScoreGauge label="Driver Fitness" score={smsScores.data.basics.driverFitness.score} alert={smsScores.data.basics.driverFitness.alert} />
                  <ScoreGauge label="Ctrl Substances" score={smsScores.data.basics.controlledSubstances.score} alert={smsScores.data.basics.controlledSubstances.alert} />
                  <ScoreGauge label="Vehicle Maint" score={smsScores.data.basics.vehicleMaintenance.score} alert={smsScores.data.basics.vehicleMaintenance.alert} />
                  <ScoreGauge label="HazMat" score={smsScores.data.basics.hazmat.score} alert={smsScores.data.basics.hazmat.alert} />
                  <ScoreGauge label="Crash Indicator" score={smsScores.data.basics.crashIndicator.score} alert={smsScores.data.basics.crashIndicator.alert} />
                </div>

                {/* Inspection Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">Total Inspections</div>
                    <div className="text-2xl font-bold">{smsScores.data.inspections.total}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">Driver OOS Rate</div>
                    <div className={`text-2xl font-bold ${(smsScores.data.oosRates.driver || 0) > 7 ? "text-red-400" : "text-emerald-400"}`}>
                      {smsScores.data.oosRates.driver?.toFixed(1) || "0"}%
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">Vehicle OOS Rate</div>
                    <div className={`text-2xl font-bold ${(smsScores.data.oosRates.vehicle || 0) > 21 ? "text-red-400" : "text-emerald-400"}`}>
                      {smsScores.data.oosRates.vehicle?.toFixed(1) || "0"}%
                    </div>
                  </div>
                </div>

                {/* Score History */}
                {smsScores.data.history.length > 1 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Score Trend (Last {smsScores.data.history.length} months)</h3>
                    <div className="bg-white/5 rounded-lg border border-white/5 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="px-3 py-2 text-left text-gray-400">Date</th>
                            <th className="px-3 py-2 text-right text-gray-400">Unsafe Driving</th>
                            <th className="px-3 py-2 text-right text-gray-400">HOS</th>
                            <th className="px-3 py-2 text-right text-gray-400">Vehicle Maint</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsScores.data.history.map((h: any, i: number) => (
                            <tr key={i} className="border-b border-white/5">
                              <td className="px-3 py-2 text-gray-300">{h.runDate}</td>
                              <td className="px-3 py-2 text-right">{h.unsafeDriving?.toFixed(1) || "—"}</td>
                              <td className="px-3 py-2 text-right">{h.hos?.toFixed(1) || "—"}</td>
                              <td className="px-3 py-2 text-right">{h.vehicleMaintenance?.toFixed(1) || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "authority" && authority.data && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">DOT Number:</span>
                      <span className="ml-2 font-medium">{authority.data.dotNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Docket Number:</span>
                      <span className="ml-2 font-medium">{authority.data.docketNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 font-medium ${authority.data.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`}>
                        {authority.data.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Common Authority", ...authority.data.common },
                    { label: "Contract Authority", ...authority.data.contract },
                    { label: "Broker Authority", ...authority.data.broker },
                  ].map((a: any) => (
                    <div key={a.label} className={`rounded-lg p-4 border ${a.active ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5"}`}>
                      <div className="text-sm font-medium mb-2">{a.label}</div>
                      <div className={`text-lg font-bold ${a.active ? "text-emerald-400" : "text-gray-500"}`}>
                        {a.active ? "ACTIVE" : a.revoked ? "REVOKED" : "—"}
                      </div>
                      {a.granted && <div className="text-xs text-gray-500 mt-1">Granted: {a.granted}</div>}
                      {a.revoked && <div className="text-xs text-red-400 mt-1">Revoked: {a.revoked}</div>}
                    </div>
                  ))}
                </div>

                {/* Insurance Requirements */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <h3 className="text-sm font-medium mb-3">Insurance Requirements</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">BIPD Required:</span>
                      <span className="ml-2">{authority.data.insurance.bipdRequired ? `$${(authority.data.insurance.bipdRequired / 1000).toFixed(0)}K` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">BIPD On File:</span>
                      <span className={`ml-2 font-medium ${authority.data.insurance.compliant ? "text-emerald-400" : "text-red-400"}`}>
                        {authority.data.insurance.bipdOnFile ? `$${(authority.data.insurance.bipdOnFile / 1000).toFixed(0)}K` : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Compliant:</span>
                      <span className={`ml-2 font-medium ${authority.data.insurance.compliant ? "text-emerald-400" : "text-red-400"}`}>
                        {authority.data.insurance.compliant ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "insurance" && insurance.data && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Active Policies ({insurance.data.active.length})</h3>
                {insurance.data.active.length > 0 ? (
                  <div className="space-y-2">
                    {insurance.data.active.map((p: any, i: number) => (
                      <div key={i} className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{p.type || "BIPD"} — {p.carrier}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Policy #{p.policyNumber}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-emerald-400">
                              {p.bipdLimit ? `$${(p.bipdLimit / 1000).toFixed(0)}K` : "Active"}
                            </div>
                            <div className="text-xs text-gray-500">{p.coverageFrom} → {p.coverageTo}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20 text-red-400">No active insurance policies</div>
                )}

                <h3 className="text-sm font-medium text-gray-300 mt-6">Insurance History ({insurance.data.history.length})</h3>
                {insurance.data.history.length > 0 ? (
                  <div className="bg-white/5 rounded-lg border border-white/5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-3 py-2 text-left text-gray-400">Type</th>
                          <th className="px-3 py-2 text-left text-gray-400">Carrier</th>
                          <th className="px-3 py-2 text-left text-gray-400">Policy #</th>
                          <th className="px-3 py-2 text-left text-gray-400">Cancel Date</th>
                          <th className="px-3 py-2 text-left text-gray-400">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insurance.data.history.map((p: any, i: number) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="px-3 py-2">{p.type}</td>
                            <td className="px-3 py-2">{p.carrier}</td>
                            <td className="px-3 py-2">{p.policyNumber}</td>
                            <td className="px-3 py-2">{p.cancelDate}</td>
                            <td className="px-3 py-2">{p.cancelMethod}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No cancelled policies found</div>
                )}
              </div>
            )}

            {activeTab === "inspections" && (
              <div>
                {inspections.isLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : inspections.isError ? (
                  <div className="text-center py-10 text-gray-500">No inspection records found</div>
                ) : inspections.data && inspections.data.length > 0 ? (
                  <div className="bg-white/5 rounded-lg border border-white/5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left text-gray-400">Date</th>
                          <th className="px-3 py-2 text-left text-gray-400">State</th>
                          <th className="px-3 py-2 text-center text-gray-400">Level</th>
                          <th className="px-3 py-2 text-center text-gray-400">Driver OOS</th>
                          <th className="px-3 py-2 text-center text-gray-400">Vehicle OOS</th>
                          <th className="px-3 py-2 text-center text-gray-400">Violations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.data.map((insp: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-3 py-2">{insp.inspectionDate}</td>
                            <td className="px-3 py-2">{insp.state}</td>
                            <td className="px-3 py-2 text-center">{insp.level}</td>
                            <td className="px-3 py-2 text-center">
                              {insp.driverOos ? <XCircle className="w-3.5 h-3.5 text-red-400 mx-auto" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto" />}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {insp.vehicleOos ? <XCircle className="w-3.5 h-3.5 text-red-400 mx-auto" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto" />}
                            </td>
                            <td className="px-3 py-2 text-center">{insp.totalViolations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">No inspection records found</div>
                )}
              </div>
            )}

            {activeTab === "crashes" && (
              <div>
                {crashes.isLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : crashes.isError ? (
                  <div className="text-center py-10 text-gray-500">No crash records found</div>
                ) : crashes.data && crashes.data.length > 0 ? (
                  <div className="bg-white/5 rounded-lg border border-white/5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left text-gray-400">Date</th>
                          <th className="px-3 py-2 text-left text-gray-400">Location</th>
                          <th className="px-3 py-2 text-center text-gray-400">Fatalities</th>
                          <th className="px-3 py-2 text-center text-gray-400">Injuries</th>
                          <th className="px-3 py-2 text-center text-gray-400">Tow Away</th>
                          <th className="px-3 py-2 text-center text-gray-400">HazMat</th>
                          <th className="px-3 py-2 text-right text-gray-400">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crashes.data.map((c: any, i: number) => (
                          <tr key={i} className={`border-b border-white/5 hover:bg-white/5 ${c.fatalities > 0 ? "bg-red-500/5" : ""}`}>
                            <td className="px-3 py-2">{c.reportDate}</td>
                            <td className="px-3 py-2">{c.city ? `${c.city}, ` : ""}{c.state}</td>
                            <td className={`px-3 py-2 text-center font-medium ${c.fatalities > 0 ? "text-red-400" : ""}`}>{c.fatalities}</td>
                            <td className={`px-3 py-2 text-center ${c.injuries > 0 ? "text-yellow-400" : ""}`}>{c.injuries}</td>
                            <td className="px-3 py-2 text-center">{c.towAway ? "Yes" : "No"}</td>
                            <td className="px-3 py-2 text-center">{c.hazmatReleased ? "Yes" : "No"}</td>
                            <td className="px-3 py-2 text-right">{c.severityWeight?.toFixed(1) || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">No crash records found</div>
                )}
              </div>
            )}

            {activeTab === "monitoring" && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Carrier Monitoring
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Monitor this carrier for changes in insurance, authority, safety scores, and out-of-service orders.
                    Get real-time alerts when compliance status changes.
                  </p>
                  <button
                    onClick={() => { try { addMonitor.mutate({ dotNumber: selectedDot! }); } catch {} }}
                    disabled={addMonitor.isPending}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {addMonitor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                    Add to Monitoring
                  </button>
                  {addMonitor.isSuccess && (
                    <p className="text-xs text-emerald-400 mt-2">Carrier added to monitoring successfully</p>
                  )}
                  {addMonitor.isError && (
                    <p className="text-xs text-red-400 mt-2">Failed to add carrier to monitoring. Please try again.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        context="CARRIER_SEARCH"
        target={inviteTarget}
      />
    </div>
  );
}
