/**
 * HAZMAT ROUTE RESTRICTIONS COMPONENT
 * Displays tunnel, bridge, time-of-day, state permit, and routing
 * restrictions for hazmat loads. Powered by hazmat.getRouteRestrictions.
 * 
 * NO COMPETITOR shows this level of hazmat routing intelligence.
 * 
 * Embeddable in: Create Load wizard (review step), Load Detail page
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ShieldAlert, AlertTriangle, Ban, Info, MapPin,
  Clock, FileText, ChevronDown, ChevronUp, Shield,
  Loader2, CheckCircle, Mountain, Landmark, Siren,
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
}

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
}: HazmatRouteRestrictionsProps) {
  const [expanded, setExpanded] = useState(!compact);

  const enabled = !!hazmatClass && !!originState && !!destinationState;

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

  const data = query.data;

  if (!enabled) return null;

  if (query.isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30", className)}>
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400">Checking hazmat route restrictions...</span>
      </div>
    );
  }

  if (!data) return null;

  const status = STATUS_CONFIG[data.routeStatus] || STATUS_CONFIG.CLEAR;
  const StatusIcon = status.icon;

  const grouped = {
    blocked: data.restrictions.filter((r: any) => r.severity === "blocked"),
    restricted: data.restrictions.filter((r: any) => r.severity === "restricted"),
    advisory: data.restrictions.filter((r: any) => r.severity === "advisory"),
  };

  return (
    <div className={cn("rounded-2xl border overflow-hidden", data.routeStatus === "ROUTE_BLOCKED" ? "border-red-500/30" : data.routeStatus === "RESTRICTIONS_APPLY" ? "border-orange-500/20" : "border-emerald-500/20", className)}>
      {/* Status Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn("w-full px-4 py-3 flex items-center gap-3 transition-colors",
          data.routeStatus === "ROUTE_BLOCKED" ? "bg-red-500/10 hover:bg-red-500/15" :
          data.routeStatus === "RESTRICTIONS_APPLY" ? "bg-orange-500/10 hover:bg-orange-500/15" :
          "bg-emerald-500/10 hover:bg-emerald-500/15"
        )}
      >
        <div className={cn("p-1.5 rounded-lg", data.routeStatus === "ROUTE_BLOCKED" ? "bg-red-500/20" : data.routeStatus === "RESTRICTIONS_APPLY" ? "bg-orange-500/20" : "bg-emerald-500/20")}>
          <StatusIcon className={cn("w-4 h-4", data.routeStatus === "ROUTE_BLOCKED" ? "text-red-400" : data.routeStatus === "RESTRICTIONS_APPLY" ? "text-orange-400" : "text-emerald-400")} />
        </div>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-semibold", data.routeStatus === "ROUTE_BLOCKED" ? "text-red-400" : data.routeStatus === "RESTRICTIONS_APPLY" ? "text-orange-400" : "text-emerald-400")}>
            {status.text}
          </p>
          <p className="text-[10px] text-slate-500">{status.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.summary.blocked > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">{data.summary.blocked} blocked</Badge>}
          {data.summary.restricted > 0 && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[9px]">{data.summary.restricted} restricted</Badge>}
          {data.summary.advisory > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[9px]">{data.summary.advisory} advisory</Badge>}
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
          {data.ergProtectiveDistances && (
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

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800/30 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">{data.regulation}</span>
            <span className="text-[9px] text-slate-500">{data.restrictions.length} restriction{data.restrictions.length !== 1 ? "s" : ""} found</span>
          </div>
        </div>
      )}
    </div>
  );
}
