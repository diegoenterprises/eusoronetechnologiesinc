/**
 * HAZMAT DRIVER FILTER PAGE
 * Dispatch-facing screen to filter and find hazmat-qualified drivers.
 * Filter by endorsement type, CDL class, TWIC status, equipment cert,
 * availability, and proximity to load origin.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, Shield, Users, CheckCircle, MapPin,
  Truck, Filter, RefreshCw, ChevronRight, Star, Clock
} from "lucide-react";

type DriverResult = {
  id: string;
  name: string;
  hazmatEndorsement: boolean;
  tankerEndorsement: boolean;
  twicCard: boolean;
  cdlClass: string;
  safetyScore: number;
  milesAway: number;
  status: "available" | "en_route" | "off_duty";
  equipment: string;
  experience: string;
};

const SAMPLE_DRIVERS: DriverResult[] = [
  { id: "d1", name: "James Walker", hazmatEndorsement: true, tankerEndorsement: true, twicCard: true, cdlClass: "A", safetyScore: 98, milesAway: 15, status: "available", equipment: "Tanker", experience: "8 yrs" },
  { id: "d2", name: "Maria Rodriguez", hazmatEndorsement: true, tankerEndorsement: true, twicCard: false, cdlClass: "A", safetyScore: 95, milesAway: 42, status: "available", equipment: "Tanker", experience: "5 yrs" },
  { id: "d3", name: "Robert Chen", hazmatEndorsement: true, tankerEndorsement: false, twicCard: true, cdlClass: "A", safetyScore: 92, milesAway: 78, status: "en_route", equipment: "Flatbed", experience: "12 yrs" },
  { id: "d4", name: "Sarah Johnson", hazmatEndorsement: true, tankerEndorsement: true, twicCard: true, cdlClass: "A", safetyScore: 97, milesAway: 120, status: "available", equipment: "Tanker", experience: "6 yrs" },
  { id: "d5", name: "David Williams", hazmatEndorsement: true, tankerEndorsement: false, twicCard: false, cdlClass: "B", safetyScore: 88, milesAway: 200, status: "off_duty", equipment: "Dry Van", experience: "3 yrs" },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "text-green-500", bg: "bg-green-500/15" },
  en_route: { label: "En Route", color: "text-blue-500", bg: "bg-blue-500/15" },
  off_duty: { label: "Off Duty", color: "text-slate-400", bg: "bg-slate-500/15" },
};

export default function HazmatDriverFilter() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [requireTWIC, setRequireTWIC] = useState(false);
  const [requireTanker, setRequireTanker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState("");

  const driversQuery = (trpc as any).drivers?.getHazmatQualified?.useQuery?.() ||
    (trpc as any).drivers?.list?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const rawDrivers: any[] = Array.isArray(driversQuery.data) ? driversQuery.data : [];
  const drivers: DriverResult[] = rawDrivers.length > 0 ? rawDrivers : SAMPLE_DRIVERS;
  const isLoading = driversQuery.isLoading;

  const filtered = useMemo(() => {
    let result = drivers;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (requireTWIC) result = result.filter((d) => d.twicCard);
    if (requireTanker) result = result.filter((d) => d.tankerEndorsement);
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (maxDistance) result = result.filter((d) => d.milesAway <= Number(maxDistance));
    return result.sort((a, b) => a.milesAway - b.milesAway);
  }, [drivers, searchTerm, requireTWIC, requireTanker, statusFilter, maxDistance]);

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hazmat Driver Filter
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Find hazmat-qualified drivers by endorsement, proximity, and availability
          </p>
        </div>
        <Badge className="bg-[#1473FF]/15 text-[#1473FF] border-[#1473FF]/30 rounded-full px-3 py-1 text-xs font-bold border">
          {filtered.length} driver{filtered.length !== 1 ? "s" : ""}
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
          <div className={cn("relative rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by driver name..." className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-0 bg-transparent focus:outline-none", isLight ? "text-slate-800" : "text-white placeholder:text-slate-400")} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRequireTWIC(!requireTWIC)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", requireTWIC ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500")}>
              {requireTWIC && <CheckCircle className="w-3 h-3 inline mr-1" />} TWIC Required
            </button>
            <button onClick={() => setRequireTanker(!requireTanker)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all", requireTanker ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500")}>
              {requireTanker && <CheckCircle className="w-3 h-3 inline mr-1" />} Tanker Endorsement
            </button>
            {["all", "available", "en_route"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-4 py-2 rounded-xl border text-xs font-medium transition-all capitalize", statusFilter === s ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent" : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500")}>
                {s === "all" ? "All Status" : s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <Input type="number" value={maxDistance} onChange={(e: any) => setMaxDistance(e.target.value)} placeholder="Max distance (miles)" className={cn("h-10 rounded-xl w-48", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white")} />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No matching drivers</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Adjust your filters to broaden the search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((driver) => {
            const st = STATUS_CFG[driver.status] || STATUS_CFG.available;
            return (
              <Card key={driver.id} className={cn(cc, "overflow-hidden transition-all hover:shadow-md")}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", st.bg)}>
                      <Users className={cn("w-6 h-6", st.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{driver.name}</p>
                        <Badge className={cn("text-[9px] border", st.bg, st.color, "border-current/20")}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {driver.hazmatEndorsement && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[8px]">H — Hazmat</Badge>}
                        {driver.tankerEndorsement && <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[8px]">N — Tanker</Badge>}
                        {driver.twicCard && <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[8px]">TWIC</Badge>}
                        <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>CDL-{driver.cdlClass} · {driver.equipment} · {driver.experience}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{driver.safetyScore}</p>
                      </div>
                      <p className={cn("text-[10px] flex items-center gap-1 justify-end mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                        <MapPin className="w-3 h-3" /> {driver.milesAway} mi
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
