/**
 * PLACARD GUIDE PAGE
 * Visual reference guide for all DOT hazmat placards.
 * Shows all 9 hazard classes with diamond placard visuals, colors,
 * UN number examples, and key transport requirements.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, Shield, AlertTriangle, Info, ChevronRight,
  Flame, Droplets, Zap, Wind, Package
} from "lucide-react";

type PlacardInfo = {
  code: string;
  name: string;
  placard: string;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: string[];
  threshold: string;
  keyRule: string;
};

const PLACARDS: PlacardInfo[] = [
  { code: "1.1", name: "Explosives — Mass Explosion", placard: "EXPLOSIVES 1.1", color: "#FF6600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500", examples: ["Dynamite", "TNT", "Detonators"], threshold: "Any quantity", keyRule: "Forbidden on passenger aircraft. No other hazmat may be loaded with Division 1.1." },
  { code: "2.1", name: "Flammable Gas", placard: "FLAMMABLE GAS", color: "#FF0000", bgColor: "bg-red-500/10", borderColor: "border-red-500", examples: ["Propane (UN1978)", "Butane (UN1011)", "Hydrogen (UN1049)"], threshold: "Any quantity", keyRule: "BLEVE risk if involved in fire. Keep away from ignition sources." },
  { code: "2.2", name: "Non-Flammable Gas", placard: "NON-FLAMMABLE", color: "#00AA00", bgColor: "bg-green-500/10", borderColor: "border-green-500", examples: ["Nitrogen (UN1066)", "CO2 (UN1013)", "Helium (UN1046)"], threshold: "1,001 lbs+", keyRule: "Asphyxiation hazard in confined spaces. May cause frostbite." },
  { code: "2.3", name: "Poison Gas", placard: "POISON GAS", color: "#FFFFFF", bgColor: "bg-slate-500/10", borderColor: "border-slate-500", examples: ["Chlorine (UN1017)", "Ammonia (UN1005)", "Phosgene (UN1076)"], threshold: "Any quantity", keyRule: "Inhalation hazard zone. Maximum isolation distance required." },
  { code: "3", name: "Flammable Liquid", placard: "FLAMMABLE", color: "#FF0000", bgColor: "bg-red-500/10", borderColor: "border-red-500", examples: ["Gasoline (UN1203)", "Crude Oil (UN1267)", "Diesel (UN1202)"], threshold: "PG I/II: any qty; PG III: 1,001 lbs+", keyRule: "Vapors heavier than air — can travel to ignition source and flash back." },
  { code: "4.1", name: "Flammable Solid", placard: "FLAMMABLE SOLID", color: "#FF0000", bgColor: "bg-red-400/10", borderColor: "border-red-400", examples: ["Matches", "Sulfur (UN1350)", "Naphthalene (UN1334)"], threshold: "1,001 lbs+", keyRule: "May burn with intense heat. Some self-reactive with risk of explosion." },
  { code: "4.2", name: "Spontaneously Combustible", placard: "SPONT. COMBUSTIBLE", color: "#FF0000", bgColor: "bg-red-600/10", borderColor: "border-red-600", examples: ["White phosphorus (UN1381)", "Aluminum alkyls (UN3394)"], threshold: "Any quantity", keyRule: "May ignite on contact with air. Do NOT use water." },
  { code: "4.3", name: "Dangerous When Wet", placard: "DANGEROUS WHEN WET", color: "#0000FF", bgColor: "bg-blue-500/10", borderColor: "border-blue-500", examples: ["Sodium (UN1428)", "Calcium carbide (UN1402)", "Lithium (UN1415)"], threshold: "Any quantity", keyRule: "Produces flammable hydrogen gas on contact with water. Keep absolutely dry." },
  { code: "5.1", name: "Oxidizer", placard: "OXIDIZER", color: "#FFFF00", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500", examples: ["Ammonium nitrate (UN1942)", "Hydrogen peroxide (UN2014)", "Calcium hypochlorite (UN2880)"], threshold: "1,001 lbs+", keyRule: "Intensifies fire. Segregate from flammables and organics." },
  { code: "5.2", name: "Organic Peroxide", placard: "ORGANIC PEROXIDE", color: "#FFFF00", bgColor: "bg-yellow-600/10", borderColor: "border-yellow-600", examples: ["Benzoyl peroxide (UN3102)", "Methyl ethyl ketone peroxide (UN3101)"], threshold: "Any quantity", keyRule: "May explode from heat, shock, or friction. Temperature controlled transport." },
  { code: "6.1", name: "Poison / Toxic", placard: "POISON", color: "#FFFFFF", bgColor: "bg-slate-500/10", borderColor: "border-slate-400", examples: ["Pesticides (UN2783)", "Arsenic (UN1558)", "Cyanide (UN1689)"], threshold: "PG I inhalation: any qty; others: 1,001 lbs+", keyRule: "Toxic by ingestion, inhalation, or skin absorption. Full PPE required." },
  { code: "7", name: "Radioactive", placard: "RADIOACTIVE", color: "#FFFF00", bgColor: "bg-yellow-400/10", borderColor: "border-yellow-400", examples: ["Uranium (UN2977)", "Cobalt-60 (UN2916)", "Medical isotopes (UN2915)"], threshold: "Any quantity (Yellow III)", keyRule: "Transport index determines placard. Time, distance, shielding principles apply." },
  { code: "8", name: "Corrosive", placard: "CORROSIVE", color: "#000000", bgColor: "bg-slate-600/10", borderColor: "border-slate-600", examples: ["Sulfuric acid (UN1830)", "Hydrochloric acid (UN1789)", "Sodium hydroxide (UN1824)"], threshold: "1,001 lbs+", keyRule: "Destroys skin tissue on contact. Produces toxic fumes when heated." },
  { code: "9", name: "Miscellaneous Dangerous Goods", placard: "CLASS 9", color: "#FFFFFF", bgColor: "bg-slate-400/10", borderColor: "border-slate-400", examples: ["Lithium batteries (UN3481)", "Dry ice (UN1845)", "Asbestos (UN2212)"], threshold: "1,001 lbs+", keyRule: "Does not fit other classes but still presents transport hazard." },
];

export default function PlacardGuide() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const hazardClassesQuery = (trpc as any).hazmat?.getHazardClasses?.useQuery?.() || { data: [], isLoading: false };

  const filtered = useMemo(() => {
    if (!searchTerm) return PLACARDS;
    const q = searchTerm.toLowerCase();
    return PLACARDS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.includes(q) || p.placard.toLowerCase().includes(q) ||
        p.examples.some((e) => e.toLowerCase().includes(q))
    );
  }, [searchTerm]);

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Placard Guide
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            DOT hazmat placard reference — 49 CFR 172 Subpart F
          </p>
        </div>
      </div>

      {/* Search */}
      <div className={cn("relative rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/[0.06]")}>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by class, name, material, or UN number..."
          className={cn("pl-10 pr-4 py-2.5 border-0 rounded-xl text-sm focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
        />
      </div>

      {/* Placard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => {
          const isExpanded = expandedCode === p.code;
          return (
            <Card
              key={p.code}
              className={cn(cc, "overflow-hidden cursor-pointer transition-all", isExpanded && "md:col-span-2")}
              onClick={() => setExpandedCode(isExpanded ? null : p.code)}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-5">
                  {/* Diamond placard */}
                  <div className={cn(
                    "w-16 h-16 rotate-45 rounded-lg border-3 flex items-center justify-center flex-shrink-0",
                    p.borderColor, p.bgColor
                  )}>
                    <div className="-rotate-45 text-center">
                      <p className={cn("text-lg font-black leading-none", isLight ? "text-slate-800" : "text-white")}>
                        {p.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-bold truncate", isLight ? "text-slate-800" : "text-white")}>{p.name}</p>
                    </div>
                    <p className={cn("text-xs font-mono mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                      {p.placard}
                    </p>
                    <p className={cn("text-[10px] mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                      Threshold: {p.threshold}
                    </p>
                  </div>

                  <ChevronRight className={cn("w-4 h-4 flex-shrink-0 transition-transform", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                </div>

                {isExpanded && (
                  <div className={cn("px-5 pb-5 pt-0 space-y-3", isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")}>
                    <div className="pt-3">
                      <p className={cn("text-[10px] uppercase tracking-wider font-medium mb-1.5", isLight ? "text-slate-400" : "text-slate-500")}>
                        Common Materials
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.examples.map((ex) => (
                          <Badge key={ex} className={cn("text-[10px] border", isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.04] text-slate-300 border-white/[0.06]")}>
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-start gap-3 p-3 rounded-xl",
                      isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20"
                    )}>
                      <AlertTriangle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", isLight ? "text-amber-600" : "text-amber-400")} />
                      <p className={cn("text-xs leading-relaxed", isLight ? "text-amber-700" : "text-amber-300")}>{p.keyRule}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No matching placards</p>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Try a different search term</p>
        </div>
      )}

      {/* Regulation note */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
      )}>
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">49 CFR 172.504 — Placarding Requirements</p>
          <p className="text-xs mt-0.5 opacity-80">
            Placards must be displayed on all four sides of the vehicle. Table 1 materials (Classes 1.1–1.3, 2.3, 4.3,
            6.1 PG I inhalation, 7) require placarding at any quantity. Table 2 materials require placarding at 1,001 lbs
            aggregate gross weight. The DANGEROUS placard may substitute for Table 2 materials when two or more classes are present.
          </p>
        </div>
      </div>
    </div>
  );
}
