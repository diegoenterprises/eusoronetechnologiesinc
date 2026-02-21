/**
 * HAZMAT ROUTE RESTRICTION PAGE
 * Driver-facing hazmat route restriction reference screen.
 * Displays tunnel restrictions, bridge weight limits,
 * city/state hazmat routing rules, and NRHM preferred routes.
 * Per 49 CFR 397 and FHWA hazmat routing designations.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, MapPin, AlertTriangle, Shield, ChevronRight,
  Clock, Truck, Navigation, XCircle, CheckCircle
} from "lucide-react";

type RestrictionType = "tunnel" | "bridge" | "city" | "state" | "time";

type RouteRestriction = {
  id: string;
  name: string;
  type: RestrictionType;
  location: string;
  restriction: string;
  classes: string[];
  severity: "prohibited" | "restricted" | "conditional";
  details: string;
};

const RESTRICTIONS: RouteRestriction[] = [
  { id: "r1", name: "Lincoln Tunnel", type: "tunnel", location: "New York, NY — New Jersey", restriction: "No hazmat allowed", classes: ["All"], severity: "prohibited", details: "All hazardous materials prohibited. Use George Washington Bridge or other designated crossings." },
  { id: "r2", name: "Holland Tunnel", type: "tunnel", location: "New York, NY — New Jersey", restriction: "No hazmat allowed", classes: ["All"], severity: "prohibited", details: "Complete hazmat prohibition. Commercial vehicles must use alternate crossings." },
  { id: "r3", name: "Eisenhower Tunnel (I-70)", type: "tunnel", location: "Colorado", restriction: "Escort required for certain classes", classes: ["1.1", "1.2", "1.3", "2.3", "6.1 PIH"], severity: "restricted", details: "Division 1.1/1.2/1.3 explosives, poison gas (2.3), and PIH materials require escort. Call CDOT for scheduling." },
  { id: "r4", name: "Chesapeake Bay Bridge-Tunnel", type: "bridge", location: "Virginia", restriction: "Time restrictions apply", classes: ["1.1", "1.2", "1.3", "2.3"], severity: "conditional", details: "Highway route-controlled quantities allowed only during off-peak hours (9PM-5AM). Escort required." },
  { id: "r5", name: "City of Boston", type: "city", location: "Massachusetts", restriction: "Designated routes only", classes: ["All bulk hazmat"], severity: "restricted", details: "Hazmat vehicles must use designated routes through Boston. I-93, I-90, and Route 1 are approved." },
  { id: "r6", name: "City of Houston", type: "city", location: "Texas", restriction: "Beltway 8 preferred route", classes: ["NRHM"], severity: "conditional", details: "Non-radioactive hazmat (NRHM) preferred route is Beltway 8. I-610 restricted for bulk hazmat." },
  { id: "r7", name: "State of California", type: "state", location: "California", restriction: "Prop 65 placarding + CARB compliance", classes: ["All"], severity: "conditional", details: "Additional Prop 65 signage may be required. CARB truck and bus regulation applies to all commercial vehicles." },
  { id: "r8", name: "NYC — All Boroughs", type: "city", location: "New York, NY", restriction: "No hazmat on parkways/bridges", classes: ["All"], severity: "prohibited", details: "No commercial vehicles or hazmat on parkways. Designated hazmat routes only via major expressways." },
  { id: "r9", name: "Downtown Chicago", type: "city", location: "Illinois", restriction: "Time-of-day restrictions", classes: ["Bulk flammable"], severity: "conditional", details: "Bulk flammable liquids restricted in downtown 7AM-9AM and 4PM-6PM on weekdays." },
  { id: "r10", name: "I-81 Tunnel (VA)", type: "tunnel", location: "Virginia", restriction: "Placard required, no PIH", classes: ["2.3", "6.1 PIH"], severity: "restricted", details: "Poison inhalation hazard materials prohibited. All other hazmat must be placarded and use right lane." },
];

const TYPE_CFG: Record<RestrictionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  tunnel: { label: "Tunnel", color: "text-red-500", bg: "bg-red-500/15", icon: <Navigation className="w-4 h-4" /> },
  bridge: { label: "Bridge", color: "text-orange-500", bg: "bg-orange-500/15", icon: <Navigation className="w-4 h-4" /> },
  city: { label: "City", color: "text-blue-500", bg: "bg-blue-500/15", icon: <MapPin className="w-4 h-4" /> },
  state: { label: "State", color: "text-purple-500", bg: "bg-purple-500/15", icon: <Shield className="w-4 h-4" /> },
  time: { label: "Time", color: "text-cyan-500", bg: "bg-cyan-500/15", icon: <Clock className="w-4 h-4" /> },
};

const SEV_CFG: Record<string, { label: string; color: string; bg: string }> = {
  prohibited: { label: "Prohibited", color: "text-red-500", bg: "bg-red-500/15" },
  restricted: { label: "Restricted", color: "text-orange-500", bg: "bg-orange-500/15" },
  conditional: { label: "Conditional", color: "text-yellow-500", bg: "bg-yellow-500/15" },
};

export default function HazmatRouteRestriction() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = RESTRICTIONS;
    if (typeFilter !== "all") result = result.filter((r) => r.type === typeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.restriction.toLowerCase().includes(q));
    }
    return result;
  }, [searchTerm, typeFilter]);

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Route Restrictions
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Hazmat routing restrictions — 49 CFR 397
        </p>
      </div>

      {/* Search */}
      <div className={cn("relative rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/[0.06]")}>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search by location, tunnel, bridge, or city..." className={cn("pl-10 pr-4 py-2.5 border-0 rounded-xl text-sm focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")} />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setTypeFilter("all")} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", typeFilter === "all" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>All ({RESTRICTIONS.length})</button>
        {(Object.keys(TYPE_CFG) as RestrictionType[]).map((t) => {
          const cfg = TYPE_CFG[t];
          const count = RESTRICTIONS.filter((r) => r.type === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", typeFilter === t ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className={cc}><CardContent className="py-16 text-center"><Search className="w-10 h-10 text-slate-400 mx-auto mb-3" /><p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No matching restrictions</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const typeCfg = TYPE_CFG[r.type];
            const sevCfg = SEV_CFG[r.severity];
            const isExpanded = expandedId === r.id;
            return (
              <Card key={r.id} className={cn(cc, "overflow-hidden cursor-pointer transition-all", r.severity === "prohibited" && "ring-1 ring-red-500/20")} onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                {r.severity === "prohibited" && <div className="h-1 bg-red-500" />}
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2.5 rounded-lg flex-shrink-0", typeCfg.bg, typeCfg.color)}>{typeCfg.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{r.name}</p>
                          <Badge className={cn("text-[9px] border", typeCfg.bg, typeCfg.color, "border-current/20")}>{typeCfg.label}</Badge>
                          <Badge className={cn("text-[9px] border", sevCfg.bg, sevCfg.color, "border-current/20")}>{sevCfg.label}</Badge>
                        </div>
                        <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{r.location} — {r.restriction}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 transition-transform flex-shrink-0", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>
                  {isExpanded && (
                    <div className={cn("px-5 pb-5 space-y-3", isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")}>
                      <div className="pt-3"><p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-slate-300")}>{r.details}</p></div>
                      <div className="flex flex-wrap gap-1">
                        <span className={cn("text-[10px] font-medium mr-1", isLight ? "text-slate-500" : "text-slate-400")}>Affected classes:</span>
                        {r.classes.map((c) => (<span key={c} className={cn("text-[9px] px-2 py-0.5 rounded-md", isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400")}>{c}</span>))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Regulation note */}
      <div className={cn("flex items-start gap-3 p-4 rounded-xl text-sm", isLight ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-amber-500/10 border border-amber-500/20 text-amber-300")}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">49 CFR 397 Compliance</p>
          <p className="text-xs mt-0.5 opacity-80">
            Drivers of placarded hazmat vehicles must use preferred routes designated by states and municipalities.
            Operating off designated routes without cause is a federal violation. Always check local regulations
            before deviating from planned routes.
          </p>
        </div>
      </div>
    </div>
  );
}
