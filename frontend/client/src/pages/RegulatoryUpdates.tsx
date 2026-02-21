/**
 * REGULATORY UPDATES PAGE
 * Hazmat regulatory news feed and compliance update tracker.
 * Displays PHMSA final rules, FMCSA notices, EPA updates,
 * and industry advisories relevant to hazmat transportation.
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
  FileText, Search, Calendar, ExternalLink, Shield,
  AlertTriangle, CheckCircle, Clock, ChevronRight,
  RefreshCw, BookOpen, Bell
} from "lucide-react";

type UpdateCategory = "all" | "phmsa" | "fmcsa" | "epa" | "tsa";
type RegulatoryUpdate = {
  id: string;
  title: string;
  summary: string;
  agency: string;
  category: string;
  effectiveDate: string;
  publishedDate: string;
  impact: "high" | "medium" | "low";
  cfr: string;
  url?: string;
};

const UPDATES: RegulatoryUpdate[] = [
  { id: "RU-001", title: "HM-215Q: International Harmonization", summary: "Aligns DOT hazmat regulations with UN Recommendations on Transport of Dangerous Goods, 23rd revised edition. Updates classification criteria, packaging requirements, and shipping descriptions.", agency: "PHMSA", category: "phmsa", effectiveDate: "2026-01-01", publishedDate: "2025-09-15", impact: "high", cfr: "49 CFR Parts 171-180" },
  { id: "RU-002", title: "ELD Mandate Update — Software Version Requirements", summary: "Updated technical specifications for electronic logging devices. All ELDs must meet version 2.0 specifications by the effective date.", agency: "FMCSA", category: "fmcsa", effectiveDate: "2026-06-01", publishedDate: "2025-11-20", impact: "medium", cfr: "49 CFR Part 395" },
  { id: "RU-003", title: "PFAS Reporting Under CERCLA", summary: "Designates PFOA and PFOS as CERCLA hazardous substances. Requires reporting of releases meeting reportable quantities. Affects hazmat carriers transporting PFAS-containing materials.", agency: "EPA", category: "epa", effectiveDate: "2025-07-08", publishedDate: "2025-04-19", impact: "high", cfr: "40 CFR Part 302" },
  { id: "RU-004", title: "Lithium Battery Transport — Special Permit Expansion", summary: "Expands special permit SP-20936 for lithium battery shipments. New packaging options and quantity limitations for damaged/defective lithium batteries.", agency: "PHMSA", category: "phmsa", effectiveDate: "2026-03-01", publishedDate: "2025-12-10", impact: "medium", cfr: "49 CFR 173.185" },
  { id: "RU-005", title: "Drug & Alcohol Clearinghouse — Query Frequency Update", summary: "Employers must conduct full Clearinghouse queries annually instead of limited queries. Affects all motor carriers with CDL drivers.", agency: "FMCSA", category: "fmcsa", effectiveDate: "2025-11-18", publishedDate: "2025-06-01", impact: "high", cfr: "49 CFR Part 382" },
  { id: "RU-006", title: "TSA Hazmat Endorsement Threat Assessment", summary: "Updated background check procedures for hazmat CDL endorsement renewals. New biometric requirements and reduced processing timeline to 30 days.", agency: "TSA", category: "tsa", effectiveDate: "2026-04-01", publishedDate: "2025-10-05", impact: "low", cfr: "49 CFR Part 1572" },
  { id: "RU-007", title: "Cargo Tank Motor Vehicle Inspection — Updated Standards", summary: "Revised inspection criteria for MC-306/DOT-406 cargo tanks. New corrosion allowance calculations and weld inspection frequency.", agency: "PHMSA", category: "phmsa", effectiveDate: "2026-07-01", publishedDate: "2026-01-15", impact: "medium", cfr: "49 CFR 180.407" },
  { id: "RU-008", title: "RQ Adjustments for Petroleum Products", summary: "Adjusted reportable quantities for select petroleum crude oil and refined product classifications based on updated toxicity data.", agency: "EPA", category: "epa", effectiveDate: "2026-01-01", publishedDate: "2025-08-20", impact: "medium", cfr: "40 CFR 302.4" },
];

const AGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  phmsa: { label: "PHMSA", color: "text-blue-400", bg: "bg-blue-500/15" },
  fmcsa: { label: "FMCSA", color: "text-green-400", bg: "bg-green-500/15" },
  epa: { label: "EPA", color: "text-purple-400", bg: "bg-purple-500/15" },
  tsa: { label: "TSA", color: "text-orange-400", bg: "bg-orange-500/15" },
};

const IMPACT_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: "High Impact", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "Medium", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

export default function RegulatoryUpdates() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<UpdateCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = UPDATES;
    if (filter !== "all") result = result.filter((u) => u.category === filter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((u) => u.title.toLowerCase().includes(q) || u.summary.toLowerCase().includes(q) || u.cfr.toLowerCase().includes(q));
    }
    return result.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }, [filter, searchTerm]);

  const filters: { id: UpdateCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "phmsa", label: "PHMSA" },
    { id: "fmcsa", label: "FMCSA" },
    { id: "epa", label: "EPA" },
    { id: "tsa", label: "TSA" },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Regulatory Updates
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat transportation regulatory news and compliance changes
          </p>
        </div>
      </div>

      {/* Search */}
      <div className={cn("relative rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by title, CFR reference, or keyword..."
          className={cn("pl-10 pr-4 py-2.5 border-0 rounded-xl text-sm focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
        />
      </div>

      {/* Agency filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", filter === f.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Updates List */}
      {filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No matching updates</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((update) => {
            const agency = AGENCY_CONFIG[update.category] || AGENCY_CONFIG.phmsa;
            const impact = IMPACT_CONFIG[update.impact];
            const isExpanded = expandedId === update.id;
            const isUpcoming = new Date(update.effectiveDate) > new Date();

            return (
              <Card key={update.id} className={cn(cc, "overflow-hidden cursor-pointer transition-all")} onClick={() => setExpandedId(isExpanded ? null : update.id)}>
                <CardContent className="p-0">
                  <div className="flex items-start justify-between px-5 py-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn("p-2.5 rounded-lg flex-shrink-0 mt-0.5", agency.bg, agency.color)}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{update.title}</p>
                          <Badge className={cn("text-[9px] border", agency.bg, agency.color, "border-current/20")}>{agency.label}</Badge>
                          <Badge className={cn("text-[9px] border", impact.cls)}>{impact.label}</Badge>
                          {isUpcoming && <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[9px]">Upcoming</Badge>}
                        </div>
                        <p className={cn("text-xs line-clamp-2", isLight ? "text-slate-500" : "text-slate-400")}>{update.summary}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-[10px] flex items-center gap-1", isLight ? "text-slate-400" : "text-slate-500")}>
                            <Calendar className="w-3 h-3" /> Effective: {new Date(update.effectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className={cn("text-[10px] font-mono", isLight ? "text-blue-500" : "text-blue-400")}>{update.cfr}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 flex-shrink-0 mt-2 transition-transform", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>

                  {isExpanded && (
                    <div className={cn("px-5 pb-5 space-y-3", isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")}>
                      <div className="pt-3">
                        <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-slate-300")}>{update.summary}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { l: "Agency", v: update.agency },
                          { l: "CFR Reference", v: update.cfr },
                          { l: "Published", v: new Date(update.publishedDate).toLocaleDateString() },
                          { l: "Effective", v: new Date(update.effectiveDate).toLocaleDateString() },
                        ].map((d) => (
                          <div key={d.l} className={cn("p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                            <p className={cn("text-[9px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{d.l}</p>
                            <p className={cn("text-xs font-medium mt-0.5", isLight ? "text-slate-700" : "text-slate-200")}>{d.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
      )}>
        <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Stay Compliant</p>
          <p className="text-xs mt-0.5 opacity-80">
            Regulatory updates are sourced from the Federal Register, PHMSA advisories, and FMCSA bulletins.
            Always verify effective dates and consult your safety department before making operational changes.
            Non-compliance with new regulations can result in civil penalties up to $79,976 per violation.
          </p>
        </div>
      </div>
    </div>
  );
}
