/**
 * REGULATORY COMPLIANCE PANEL
 * Universal compliance guidance for ALL load types — every trailer, every product.
 * Calls regulatory.checkLoadCompliance which resolves raw platform inputs
 * server-side via PRODUCT_CATALOG + COMPLIANCE_RULES + ERG + regulatory engine.
 *
 * Embedded in: LoadCreationWizard (all steps), LoadDetails (all loads)
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ShieldAlert, AlertTriangle, Ban, Info,
  Clock, FileText, ChevronDown, ChevronUp, Shield,
  Loader2, CheckCircle,
  GraduationCap, Wallet, ClipboardCheck, BadgeCheck,
  Scale, BookOpen, Building, Truck, Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegulatoryCompliancePanelProps {
  trailerType: string;
  productName?: string;
  productId?: string;
  hazmatClass?: string;
  unNumber?: string;
  originState?: string;
  destinationState?: string;
  transitStates?: string[];
  originCity?: string;
  destinationCity?: string;
  userRole?: string;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  CRITICAL:        { color: "from-red-500 to-red-700", bg: "bg-red-500/10", hover: "hover:bg-red-500/15", text: "text-red-400", icon: Ban, label: "Critical Compliance Issues", desc: "Missing critical documents or endorsements — load cannot proceed" },
  ACTION_REQUIRED: { color: "from-orange-500 to-amber-600", bg: "bg-orange-500/10", hover: "hover:bg-orange-500/15", text: "text-orange-400", icon: AlertTriangle, label: "Action Required", desc: "High-priority compliance items need attention before dispatch" },
  ADVISORY:        { color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10", hover: "hover:bg-blue-500/15", text: "text-blue-400", icon: Info, label: "Advisory", desc: "Compliance requirements identified — review before dispatch" },
  CLEAR:           { color: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10", hover: "hover:bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle, label: "Compliant", desc: "No compliance issues identified for this load configuration" },
};

const CATEGORY_CONFIG: Record<string, { icon: typeof ShieldAlert; label: string; color: string }> = {
  endorsement:   { icon: BadgeCheck,     label: "CDL Endorsements",    color: "text-purple-400" },
  permit:        { icon: FileText,       label: "Permits & Registration", color: "text-blue-400" },
  training:      { icon: GraduationCap,  label: "Training & Certification", color: "text-cyan-400" },
  insurance:     { icon: Wallet,         label: "Insurance Requirements", color: "text-green-400" },
  equipment:     { icon: Truck,          label: "Equipment Compliance", color: "text-orange-400" },
  inspection:    { icon: ClipboardCheck, label: "Inspections",         color: "text-yellow-400" },
  registration:  { icon: BookOpen,       label: "Registration",        color: "text-indigo-400" },
  documentation: { icon: FileText,       label: "Documentation",       color: "text-slate-400" },
  operational:   { icon: Building,       label: "Operational Rules",   color: "text-pink-400" },
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: "bg-red-500/8",    border: "border-red-500/20",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300" },
  high:     { bg: "bg-orange-500/8", border: "border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
  medium:   { bg: "bg-yellow-500/8", border: "border-yellow-500/20", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
  low:      { bg: "bg-blue-500/8",   border: "border-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300" },
  info:     { bg: "bg-slate-500/8",  border: "border-slate-500/20",  text: "text-slate-400",  badge: "bg-slate-500/20 text-slate-300" },
};

const CATEGORY_ORDER = ["endorsement", "permit", "training", "insurance", "equipment", "inspection", "registration", "documentation", "operational"];

export default function RegulatoryCompliancePanel({
  trailerType,
  productName,
  productId,
  hazmatClass,
  unNumber,
  originState,
  destinationState,
  transitStates = [],
  originCity,
  destinationCity,
  userRole = "driver",
  compact = false,
  className = "",
}: RegulatoryCompliancePanelProps) {
  const [expanded, setExpanded] = useState(!compact);

  // Build states array from all available state data
  const states: string[] = [];
  if (originState?.length === 2) states.push(originState.toUpperCase());
  if (destinationState?.length === 2 && !states.includes(destinationState.toUpperCase())) states.push(destinationState.toUpperCase());
  transitStates.forEach(s => { if (s.length === 2 && !states.includes(s.toUpperCase())) states.push(s.toUpperCase()); });

  // Build cities map
  const cities: Record<string, string> = {};
  if (originCity && originState) cities[originState.toUpperCase()] = originCity;
  if (destinationCity && destinationState) cities[destinationState.toUpperCase()] = destinationCity;

  const enabled = !!trailerType && states.length > 0;

  const query = (trpc as any).regulatory?.checkLoadCompliance?.useQuery?.(
    {
      trailerType,
      productName: productName || undefined,
      productId: productId || undefined,
      hazmatClass: hazmatClass || undefined,
      unNumber: unNumber || undefined,
      states: states.length > 0 ? states : ["TX"],
      cities: Object.keys(cities).length > 0 ? cities : undefined,
      userRole,
    },
    { enabled, staleTime: 300_000 }
  ) || { data: null, isLoading: false };

  const data = query.data as any;

  if (!enabled) return null;

  if (query.isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30", className)}>
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400">Checking regulatory compliance for {trailerType.replace(/_/g, " ")}...</span>
      </div>
    );
  }

  if (!data) return null;

  const statusKey = (data.status || "CLEAR") as keyof typeof STATUS_CONFIG;
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.CLEAR;
  const StatusIcon = statusCfg.icon;
  const byCategory = data.byCategory || {};
  const resolved = data.resolved || {};
  const summary = data.summary || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  const endorsements: string[] = data.endorsementsRequired || [];

  const borderColor = statusKey === "CRITICAL" ? "border-red-500/30"
    : statusKey === "ACTION_REQUIRED" ? "border-orange-500/20"
    : statusKey === "ADVISORY" ? "border-blue-500/20"
    : "border-emerald-500/20";

  return (
    <div className={cn("rounded-2xl border overflow-hidden", borderColor, className)}>
      {/* ── Status Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn("w-full px-4 py-3 flex items-center gap-3 transition-colors", statusCfg.bg, statusCfg.hover)}
      >
        <div className={cn("p-1.5 rounded-lg", statusCfg.bg)}>
          <StatusIcon className={cn("w-4 h-4", statusCfg.text)} />
        </div>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-semibold", statusCfg.text)}>{statusCfg.label}</p>
          <p className="text-[10px] text-slate-500">{statusCfg.desc}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {summary.critical > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">{summary.critical} critical</Badge>}
          {summary.high > 0 && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[9px]">{summary.high} high</Badge>}
          {summary.medium > 0 && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[9px]">{summary.medium} medium</Badge>}
          {summary.low > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[9px]">{summary.low} advisory</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="divide-y divide-slate-700/30">

          {/* Resolved Context Bar */}
          <div className="px-4 py-2 bg-slate-800/40 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Trailer</span>
              <Badge variant="outline" className="text-[9px] border-slate-600/50 text-slate-300">{resolved.trailerSpec || trailerType}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Product</span>
              <Badge variant="outline" className="text-[9px] border-slate-600/50 text-slate-300">
                {resolved.catalogProduct?.label || resolved.productCategory || "General"}
              </Badge>
            </div>
            {resolved.isHazmat && (
              <Badge className="bg-red-500/15 text-red-400 border-0 text-[9px]">
                <ShieldAlert className="w-2.5 h-2.5 mr-1" /> HAZMAT
              </Badge>
            )}
            {resolved.isTanker && (
              <Badge className="bg-cyan-500/15 text-cyan-400 border-0 text-[9px]">TANKER</Badge>
            )}
            {resolved.catalogProduct?.requiresTWIC && (
              <Badge className="bg-purple-500/15 text-purple-400 border-0 text-[9px]">
                <Fingerprint className="w-2.5 h-2.5 mr-1" /> TWIC
              </Badge>
            )}
            {resolved.catalogProduct?.temperatureControlled && (
              <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[9px]">TEMP CONTROLLED</Badge>
            )}
            <span className="text-[9px] text-slate-500 ml-auto">{states.join(", ")}</span>
          </div>

          {/* CDL Endorsements Required */}
          {endorsements.length > 0 && (
            <div className="px-4 py-2.5 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Required CDL Endorsements</span>
              </div>
              <div className="flex items-center gap-2">
                {endorsements.map((e: string) => (
                  <div key={e} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <span className="text-lg font-black text-purple-300">{e}</span>
                    <span className="text-[9px] text-purple-400">
                      {e === "H" ? "Hazmat" : e === "N" ? "Tanker" : e === "T" ? "Doubles/Triples" : e === "X" ? "Hazmat + Tanker" : e === "P" ? "Passenger" : e === "S" ? "School Bus" : e}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Groups */}
          {CATEGORY_ORDER.map(cat => {
            const findings = byCategory[cat];
            if (!findings || findings.length === 0) return null;
            const catCfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.documentation;
            const CatIcon = catCfg.icon;

            return (
              <div key={cat} className="px-4 py-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <CatIcon className={cn("w-3.5 h-3.5", catCfg.color)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", catCfg.color)}>{catCfg.label}</span>
                  <span className="text-[9px] text-slate-500 ml-auto">{findings.length}</span>
                </div>
                <div className="space-y-1.5">
                  {findings.map((f: any, idx: number) => {
                    const sev = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.info;
                    return (
                      <div key={`${cat}-${idx}`} className={cn("rounded-lg px-3 py-2 border", sev.bg, sev.border)}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[11px] font-semibold flex-1", sev.text)}>{f.title}</span>
                          <Badge className={cn("border-0 text-[8px] px-1.5 flex-shrink-0", sev.badge)}>{(f.severity || "info").toUpperCase()}</Badge>
                          {f.source && <span className="text-[8px] text-slate-500 flex-shrink-0">{f.source}</span>}
                        </div>
                        {f.description && f.description !== f.title && (
                          <p className="text-[10px] text-slate-400 leading-relaxed">{f.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {f.regulation && <span className="text-[9px] text-slate-500">{f.regulation}</span>}
                          {f.renewalPeriod && <span className="text-[9px] text-slate-600">Renew: {f.renewalPeriod}</span>}
                          {f.documentRequired && <span className="text-[9px] text-slate-600">Doc: {f.documentRequired}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800/30 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">
              Regulatory Engine — PRODUCT_CATALOG + COMPLIANCE_RULES + {states.length} state{states.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[9px] text-slate-500">
              {summary.total} finding{summary.total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
