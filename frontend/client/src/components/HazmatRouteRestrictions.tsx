/**
 * HAZMAT ROUTE RESTRICTIONS COMPONENT
 * Displays tunnel, bridge, time-of-day, state permit, and routing
 * restrictions for hazmat loads. Powered by hazmat.getRouteRestrictions.
 * 
 * REGULATORY ENGINE INTEGRATION: Also queries regulatory.checkCompliance
 * to surface state/city-level permits, endorsements, training, insurance,
 * and operational requirements inline with route restriction data.
 * 
 * NO COMPETITOR shows this level of hazmat routing intelligence.
 * 
 * Embeddable in: Create Load wizard (review step), Load Detail page
 */

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ShieldAlert, AlertTriangle, Ban, Info, MapPin,
  Clock, FileText, ChevronDown, ChevronUp, Shield,
  Loader2, CheckCircle, Mountain, Landmark, Siren,
  GraduationCap, Wallet, ClipboardCheck, BadgeCheck,
  Scale, BookOpen, Building, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HazmatRouteRestrictionsProps {
  hazmatClass: string;
  unNumber?: string;
  originState: string;
  destinationState: string;
  transitStates?: string[];
  isTIH?: boolean;
  isRadioactive?: boolean;
  weight?: number;
  compact?: boolean;
  className?: string;
  trailerType?: string;
  productCategory?: string;
  originCity?: string;
  destinationCity?: string;
}

// Map platform trailer IDs to regulatory engine TrailerSpec enum
const TRAILER_TO_REG: Record<string, string> = {
  liquid_tank: "DOT-406", gas_tank: "MC-331", cryogenic: "MC-338",
  hazmat_van: "DRY_VAN", dry_van: "DRY_VAN", reefer: "REEFER",
  flatbed: "FLATBED", bulk_hopper: "HOPPER", food_grade_tank: "DOT-407",
  water_tank: "DOT-406",
};

// Map hazmat class to product category for regulatory engine
const HAZCLASS_TO_PRODUCT: Record<string, string> = {
  "1": "explosives", "1.1": "explosives", "1.2": "explosives", "1.3": "explosives",
  "2": "lpg", "2.1": "lpg", "2.2": "lpg", "2.3": "anhydrous_ammonia",
  "3": "crude_oil", "4": "general_hazmat", "5": "ammonium_nitrate",
  "5.1": "ammonium_nitrate", "6": "general_hazmat", "6.1": "chlorine",
  "7": "radioactive", "8": "sulfuric_acid", "9": "general_hazmat",
};

const REG_CATEGORY_ICONS: Record<string, typeof ShieldAlert> = {
  permit: FileText, endorsement: BadgeCheck, training: GraduationCap,
  insurance: Wallet, equipment: Truck, inspection: ClipboardCheck,
  registration: BookOpen, documentation: FileText, operational: Building,
};

const REG_SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: "bg-red-500/8", border: "border-red-500/20", text: "text-red-400", badge: "bg-red-500/20 text-red-300" },
  high: { bg: "bg-orange-500/8", border: "border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
  medium: { bg: "bg-yellow-500/8", border: "border-yellow-500/20", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
  low: { bg: "bg-blue-500/8", border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  info: { bg: "bg-slate-500/8", border: "border-slate-500/20", text: "text-slate-400", badge: "bg-slate-500/20 text-slate-300" },
};

const SEVERITY_CONFIG = {
  blocked: { icon: Ban, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "BLOCKED" },
  restricted: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "RESTRICTED" },
  advisory: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "ADVISORY" },
};

const TYPE_ICONS: Record<string, typeof ShieldAlert> = {
  tunnel: Mountain,
  time_of_day: Clock,
  state_permit: FileText,
  explosives_routing: Siren,
  radioactive_routing: ShieldAlert,
  tih_routing: ShieldAlert,
  erg_isolation: Shield,
  general: MapPin,
};

const STATUS_CONFIG = {
  ROUTE_BLOCKED: { color: "from-red-500 to-red-700", text: "Route Blocked", icon: Ban, desc: "One or more restrictions completely block this route" },
  RESTRICTIONS_APPLY: { color: "from-orange-500 to-amber-600", text: "Restrictions Apply", icon: AlertTriangle, desc: "Route is passable but has restrictions" },
  CLEAR: { color: "from-emerald-500 to-green-600", text: "Route Clear", icon: CheckCircle, desc: "No known hazmat restrictions on this route" },
};

export default function HazmatRouteRestrictions({
  hazmatClass,
  unNumber,
  originState,
  destinationState,
  transitStates = [],
  isTIH = false,
  isRadioactive = false,
  weight,
  compact = false,
  className = "",
  trailerType,
  productCategory,
  originCity,
  destinationCity,
}: HazmatRouteRestrictionsProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [regExpanded, setRegExpanded] = useState(!compact);

  const enabled = !!hazmatClass && !!originState && !!destinationState;

  // ── Existing hazmat route restriction query ──
  const query = (trpc as any).hazmat.getRouteRestrictions.useQuery(
    {
      hazmatClass,
      unNumber: unNumber || undefined,
      originState,
      destinationState,
      transitStates,
      isTIH,
      isRadioactive,
      isExplosive: hazmatClass.startsWith("1"),
      weight,
    },
    { enabled, staleTime: 300_000 }
  );

  // ── Regulatory engine compliance check ──
  const regTrailer = TRAILER_TO_REG[trailerType || ""] || "DOT-406";
  const regProduct = productCategory || HAZCLASS_TO_PRODUCT[hazmatClass] || "general_hazmat";
  const allStates = useMemo(() => {
    const s = new Set<string>();
    if (originState?.length === 2) s.add(originState.toUpperCase());
    if (destinationState?.length === 2) s.add(destinationState.toUpperCase());
    transitStates.forEach(st => { if (st.length === 2) s.add(st.toUpperCase()); });
    return Array.from(s);
  }, [originState, destinationState, transitStates]);

  const regCities = useMemo(() => {
    const c: Record<string, string> = {};
    if (originCity && originState) c[originState.toUpperCase()] = originCity;
    if (destinationCity && destinationState) c[destinationState.toUpperCase()] = destinationCity;
    return c;
  }, [originCity, originState, destinationCity, destinationState]);

  const regQuery = (trpc as any).regulatory?.checkCompliance?.useQuery?.(
    {
      trailerType: regTrailer,
      userRole: "driver",
      productCategory: regProduct,
      states: allStates.length > 0 ? allStates : ["TX"],
      cities: Object.keys(regCities).length > 0 ? regCities : undefined,
    },
    { enabled: enabled && allStates.length > 0, staleTime: 300_000 }
  ) || { data: null, isLoading: false };

  // ── Flatten regulatory requirements and group by category ──
  const regData = regQuery.data as any;
  const allRegReqs = useMemo(() => {
    if (!regData || !Array.isArray(regData)) return [];
    return regData.flatMap((stateResult: any) =>
      (stateResult.requirements || []).map((r: any) => ({
        ...r,
        source: stateResult.state || stateResult.stateName || "Federal",
        sourceType: stateResult.level || "federal",
      }))
    );
  }, [regData]);

  const regByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const req of allRegReqs) {
      const cat = req.category || "operational";
      if (!groups[cat]) groups[cat] = [];
      // Dedupe by ID
      if (!groups[cat].some((r: any) => r.id === req.id)) groups[cat].push(req);
    }
    return groups;
  }, [allRegReqs]);

  const regCategoryOrder = ["endorsement", "permit", "training", "insurance", "equipment", "inspection", "registration", "documentation", "operational"];

  const data = query.data;

  if (!enabled) return null;

  if (query.isLoading || regQuery.isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30", className)}>
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400">Checking hazmat route restrictions & regulatory compliance...</span>
      </div>
    );
  }

  if (!data && allRegReqs.length === 0) return null;

  const status = data ? ((STATUS_CONFIG as any)[data.routeStatus] || STATUS_CONFIG.CLEAR) : STATUS_CONFIG.CLEAR;
  const StatusIcon = status.icon;

  // Escalate status if regulatory engine found critical/high requirements
  const hasCriticalReg = allRegReqs.some((r: any) => r.severity === "critical");
  const hasHighReg = allRegReqs.some((r: any) => r.severity === "high");
  const effectiveStatus = data?.routeStatus === "ROUTE_BLOCKED" ? "ROUTE_BLOCKED" :
    (data?.routeStatus === "RESTRICTIONS_APPLY" || hasCriticalReg || hasHighReg) ? "RESTRICTIONS_APPLY" :
    data?.routeStatus || "CLEAR";

  const grouped = data ? {
    blocked: data.restrictions.filter((r: any) => r.severity === "blocked"),
    restricted: data.restrictions.filter((r: any) => r.severity === "restricted"),
    advisory: data.restrictions.filter((r: any) => r.severity === "advisory"),
  } : { blocked: [], restricted: [], advisory: [] };

  const effectiveStatusConfig = (STATUS_CONFIG as any)[effectiveStatus] || STATUS_CONFIG.CLEAR;
  const EffectiveIcon = effectiveStatusConfig.icon;

  return (
    <div className={cn("rounded-2xl border overflow-hidden", effectiveStatus === "ROUTE_BLOCKED" ? "border-red-500/30" : effectiveStatus === "RESTRICTIONS_APPLY" ? "border-orange-500/20" : "border-emerald-500/20", className)}>
      {/* Status Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn("w-full px-4 py-3 flex items-center gap-3 transition-colors",
          effectiveStatus === "ROUTE_BLOCKED" ? "bg-red-500/10 hover:bg-red-500/15" :
          effectiveStatus === "RESTRICTIONS_APPLY" ? "bg-orange-500/10 hover:bg-orange-500/15" :
          "bg-emerald-500/10 hover:bg-emerald-500/15"
        )}
      >
        <div className={cn("p-1.5 rounded-lg", effectiveStatus === "ROUTE_BLOCKED" ? "bg-red-500/20" : effectiveStatus === "RESTRICTIONS_APPLY" ? "bg-orange-500/20" : "bg-emerald-500/20")}>
          <EffectiveIcon className={cn("w-4 h-4", effectiveStatus === "ROUTE_BLOCKED" ? "text-red-400" : effectiveStatus === "RESTRICTIONS_APPLY" ? "text-orange-400" : "text-emerald-400")} />
        </div>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-semibold", effectiveStatus === "ROUTE_BLOCKED" ? "text-red-400" : effectiveStatus === "RESTRICTIONS_APPLY" ? "text-orange-400" : "text-emerald-400")}>
            {effectiveStatusConfig.text}
          </p>
          <p className="text-[10px] text-slate-500">{effectiveStatusConfig.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          {(data?.summary?.blocked || 0) > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">{data.summary.blocked} blocked</Badge>}
          {(data?.summary?.restricted || 0) > 0 && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[9px]">{data.summary.restricted} restricted</Badge>}
          {(data?.summary?.advisory || 0) > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[9px]">{data.summary.advisory} advisory</Badge>}
          {allRegReqs.length > 0 && <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[9px]">{allRegReqs.length} regulatory</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Expanded Restrictions List */}
      {expanded && (
        <div className="divide-y divide-slate-700/30">
          {/* Blocked restrictions first */}
          {grouped.blocked.map((r: any, i: number) => {
            const sev = SEVERITY_CONFIG.blocked;
            const TypeIcon = TYPE_ICONS[r.type] || MapPin;
            return (
              <div key={`b-${i}`} className={cn("px-4 py-3", sev.bg)}>
                <div className="flex items-start gap-3">
                  <TypeIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", sev.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-xs font-bold", sev.color)}>{r.location}</span>
                      <Badge className="bg-red-500/30 text-red-300 border-0 text-[8px] px-1.5">{sev.label}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[9px] text-slate-500">{r.regulation}</span>
                      {r.alternatives && <span className="text-[9px] text-emerald-400">{r.alternatives}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Restricted */}
          {grouped.restricted.map((r: any, i: number) => {
            const sev = SEVERITY_CONFIG.restricted;
            const TypeIcon = TYPE_ICONS[r.type] || MapPin;
            return (
              <div key={`r-${i}`} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <TypeIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", sev.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-xs font-semibold", sev.color)}>{r.location}</span>
                      <Badge className="bg-orange-500/20 text-orange-300 border-0 text-[8px] px-1.5">{sev.label}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[9px] text-slate-500">{r.regulation}</span>
                      {r.alternatives && <span className="text-[9px] text-emerald-400">{r.alternatives}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Advisory */}
          {grouped.advisory.map((r: any, i: number) => {
            const sev = SEVERITY_CONFIG.advisory;
            const TypeIcon = TYPE_ICONS[r.type] || MapPin;
            return (
              <div key={`a-${i}`} className="px-4 py-2.5">
                <div className="flex items-start gap-3">
                  <TypeIcon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", sev.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">{r.location}</span>
                      <Badge className="bg-blue-500/15 text-blue-300 border-0 text-[8px] px-1.5">{sev.label}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{r.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ERG Protective Distances */}
          {data?.ergProtectiveDistances && (
            <div className="px-4 py-3 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">ERG Protective Action Distances</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                {data.ergProtectiveDistances.smallSpill && (
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 uppercase">Small Spill</p>
                    <p className="text-[11px] text-white font-medium">
                      {data.ergProtectiveDistances.smallSpill.day} (day) / {data.ergProtectiveDistances.smallSpill.night} (night)
                    </p>
                  </div>
                )}
                {data.ergProtectiveDistances.largeSpill && (
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 uppercase">Large Spill</p>
                    <p className="text-[11px] text-white font-medium">
                      {data.ergProtectiveDistances.largeSpill.day} (day) / {data.ergProtectiveDistances.largeSpill.night} (night)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              REGULATORY ENGINE — State/City Compliance Requirements
             ══════════════════════════════════════════════════════════ */}
          {allRegReqs.length > 0 && (
            <div className="border-t border-slate-700/30">
              <button
                onClick={() => setRegExpanded(!regExpanded)}
                className="w-full px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/15 hover:to-purple-500/15 transition-colors"
              >
                <Scale className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex-1 text-left">
                  Regulatory Compliance — {allStates.join(", ")}
                </span>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[9px]">
                  {allRegReqs.length} requirement{allRegReqs.length !== 1 ? "s" : ""}
                </Badge>
                {regExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {regExpanded && (
                <div className="divide-y divide-slate-700/20">
                  {regCategoryOrder.map(cat => {
                    const reqs = regByCategory[cat];
                    if (!reqs || reqs.length === 0) return null;
                    const CatIcon = REG_CATEGORY_ICONS[cat] || ClipboardCheck;
                    const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);

                    return (
                      <div key={cat} className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <CatIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{catLabel}</span>
                          <span className="text-[9px] text-slate-500 ml-auto">{reqs.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {reqs.map((req: any, idx: number) => {
                            const sevStyle = REG_SEVERITY_STYLES[req.severity] || REG_SEVERITY_STYLES.info;
                            return (
                              <div key={`${cat}-${idx}`} className={cn("rounded-lg px-3 py-2 border", sevStyle.bg, sevStyle.border)}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={cn("text-[11px] font-semibold", sevStyle.text)}>{req.title}</span>
                                  <Badge className={cn("border-0 text-[8px] px-1.5", sevStyle.badge)}>{req.severity?.toUpperCase()}</Badge>
                                  {req.source && <span className="text-[8px] text-slate-500 ml-auto">{req.source}</span>}
                                </div>
                                {req.description && <p className="text-[10px] text-slate-400 leading-relaxed">{req.description}</p>}
                                <div className="flex items-center gap-3 mt-1">
                                  {req.regulation && <span className="text-[9px] text-slate-500">{req.regulation}</span>}
                                  {req.renewalPeriod && <span className="text-[9px] text-slate-600">Renew: {req.renewalPeriod}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800/30 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">{data?.regulation || "Regulatory Engine"}</span>
            <span className="text-[9px] text-slate-500">
              {(data?.restrictions?.length || 0) + allRegReqs.length} total finding{((data?.restrictions?.length || 0) + allRegReqs.length) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
