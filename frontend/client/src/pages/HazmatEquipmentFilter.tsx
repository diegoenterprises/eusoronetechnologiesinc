/**
 * HAZMAT EQUIPMENT FILTER PAGE
 * Dispatch-facing screen to filter available equipment by hazmat capability.
 * Filter by tank spec, DOT rating, inspection status, capacity,
 * and product compatibility.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, Truck, CheckCircle, Filter, Settings,
  Shield, AlertTriangle, Calendar, MapPin, Gauge, Loader2
} from "lucide-react";

type Equipment = {
  id: string;
  unitNumber: string;
  type: string;
  spec: string;
  capacity: string;
  products: string[];
  inspectionStatus: "current" | "due_soon" | "overdue";
  lastInspection: string;
  nextInspection: string;
  location: string;
  available: boolean;
};

// No sample data — all equipment data comes from real tRPC queries

const INSP_CFG: Record<string, { label: string; color: string; bg: string }> = {
  current: { label: "Current", color: "text-green-500", bg: "bg-green-500/15" },
  due_soon: { label: "Due Soon", color: "text-yellow-500", bg: "bg-yellow-500/15" },
  overdue: { label: "Overdue", color: "text-red-500", bg: "bg-red-500/15" },
};

export default function HazmatEquipmentFilter() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [currentOnly, setCurrentOnly] = useState(false);

  const equipQuery = (trpc as any).equipment?.list?.useQuery?.() || { data: null, isLoading: false };
  const rawEquip: any[] = Array.isArray(equipQuery.data) ? equipQuery.data : [];
  const equipment: Equipment[] = rawEquip;

  const filtered = useMemo(() => {
    let result = equipment;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((e) => e.unitNumber.toLowerCase().includes(q) || e.products.some((p) => p.toLowerCase().includes(q)) || e.spec.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") result = result.filter((e) => e.type === typeFilter);
    if (availableOnly) result = result.filter((e) => e.available);
    if (currentOnly) result = result.filter((e) => e.inspectionStatus === "current");
    return result;
  }, [equipment, searchTerm, typeFilter, availableOnly, currentOnly]);

  const types = Array.from(new Set(equipment.map((e) => e.type)));
  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hazmat Equipment Filter
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Find hazmat-rated equipment by spec, product compatibility, and inspection status
          </p>
        </div>
        <Badge className="bg-[#1473FF]/15 text-[#1473FF] border-[#1473FF]/30 rounded-full px-3 py-1 text-xs font-bold border">
          {filtered.length} unit{filtered.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Filter className="w-4 h-4 text-[#1473FF]" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn("relative rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.06]")}>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by unit #, DOT spec, or product..." className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-0 bg-transparent focus:outline-none", isLight ? "text-slate-800" : "text-white placeholder:text-slate-400")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTypeFilter("all")} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", typeFilter === "all" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500")}>All Types</button>
            {types.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", typeFilter === t ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500")}>{t}</button>
            ))}
            <button onClick={() => setAvailableOnly(!availableOnly)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", availableOnly ? "bg-green-500/10 text-green-500 border-green-500/30" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500")}>
              {availableOnly && <CheckCircle className="w-3 h-3 inline mr-1" />} Available Only
            </button>
            <button onClick={() => setCurrentOnly(!currentOnly)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", currentOnly ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500")}>
              {currentOnly && <CheckCircle className="w-3 h-3 inline mr-1" />} Inspection Current
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <Truck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No matching equipment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((eq) => {
            const insp = INSP_CFG[eq.inspectionStatus];
            return (
              <Card key={eq.id} className={cn(cc, "overflow-hidden", eq.inspectionStatus === "overdue" && "ring-1 ring-red-500/30")}>
                {eq.inspectionStatus === "overdue" && <div className="h-1 bg-red-500" />}
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className={cn("w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2", eq.available ? "border-green-500/30 bg-green-500/10" : "border-slate-500/30 bg-slate-500/10")}>
                      <Truck className={cn("w-5 h-5", eq.available ? "text-green-500" : "text-slate-400")} />
                      <span className={cn("text-[8px] font-bold mt-0.5", eq.available ? "text-green-500" : "text-slate-400")}>{eq.unitNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{eq.unitNumber} — {eq.type}</p>
                        <Badge className={cn("text-[9px] border", eq.available ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30")}>{eq.available ? "Available" : "In Use"}</Badge>
                        <Badge className={cn("text-[9px] border", insp.bg, insp.color, "border-current/20")}>{insp.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] flex-wrap">
                        <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}><Settings className="w-3 h-3 inline mr-0.5" /> {eq.spec}</span>
                        <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}><Gauge className="w-3 h-3 inline mr-0.5" /> {eq.capacity}</span>
                        <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}><MapPin className="w-3 h-3 inline mr-0.5" /> {eq.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {eq.products.map((p) => (
                          <span key={p} className={cn("text-[9px] px-2 py-0.5 rounded-md", isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.04] text-slate-400")}>{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                        <Calendar className="w-3 h-3 inline mr-0.5" /> Next: {new Date(eq.nextInspection).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
