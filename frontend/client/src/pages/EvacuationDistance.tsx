/**
 * EVACUATION DISTANCE PAGE
 * Driver-facing hazmat evacuation distance reference from ERG green pages.
 * Shows initial isolation and protective action distances by hazard class,
 * day vs night conditions, and small vs large spill scenarios.
 * Critical safety reference per DOT ERG 2024.
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
  Shield, AlertTriangle, Search, Wind, Sun, Moon as MoonIcon,
  ChevronRight, ArrowRight, Users, MapPin, Ruler,
  RefreshCw, Info, Droplets, Flame, Zap
} from "lucide-react";

type SpillSize = "small" | "large";
type TimeOfDay = "day" | "night";

const EVACUATION_DATA: {
  hazardClass: string;
  name: string;
  guideNumber: string;
  icon: React.ReactNode;
  color: string;
  smallSpill: { isolationFt: number; dayMi: number; nightMi: number };
  largeSpill: { isolationFt: number; dayMi: number; nightMi: number };
}[] = [
  {
    hazardClass: "2.1", name: "Flammable Gas", guideNumber: "115",
    icon: <Flame className="w-4 h-4" />, color: "text-red-500",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.2 },
    largeSpill: { isolationFt: 600, dayMi: 0.5, nightMi: 1.1 },
  },
  {
    hazardClass: "2.3", name: "Poison Gas", guideNumber: "119",
    icon: <AlertTriangle className="w-4 h-4" />, color: "text-purple-500",
    smallSpill: { isolationFt: 200, dayMi: 0.3, nightMi: 0.8 },
    largeSpill: { isolationFt: 1000, dayMi: 1.5, nightMi: 3.7 },
  },
  {
    hazardClass: "3", name: "Flammable Liquid", guideNumber: "128",
    icon: <Droplets className="w-4 h-4" />, color: "text-orange-500",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.1 },
    largeSpill: { isolationFt: 300, dayMi: 0.3, nightMi: 0.5 },
  },
  {
    hazardClass: "4.3", name: "Dangerous When Wet", guideNumber: "139",
    icon: <Droplets className="w-4 h-4" />, color: "text-blue-500",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.2 },
    largeSpill: { isolationFt: 500, dayMi: 0.5, nightMi: 1.2 },
  },
  {
    hazardClass: "5.1", name: "Oxidizer", guideNumber: "140",
    icon: <Zap className="w-4 h-4" />, color: "text-yellow-500",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.1 },
    largeSpill: { isolationFt: 500, dayMi: 0.3, nightMi: 0.5 },
  },
  {
    hazardClass: "6.1", name: "Poison / Toxic", guideNumber: "153",
    icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-600",
    smallSpill: { isolationFt: 200, dayMi: 0.2, nightMi: 0.5 },
    largeSpill: { isolationFt: 800, dayMi: 1.0, nightMi: 2.5 },
  },
  {
    hazardClass: "7", name: "Radioactive", guideNumber: "163",
    icon: <Zap className="w-4 h-4" />, color: "text-yellow-600",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.1 },
    largeSpill: { isolationFt: 300, dayMi: 0.5, nightMi: 0.5 },
  },
  {
    hazardClass: "8", name: "Corrosive", guideNumber: "154",
    icon: <Droplets className="w-4 h-4" />, color: "text-slate-500",
    smallSpill: { isolationFt: 100, dayMi: 0.1, nightMi: 0.1 },
    largeSpill: { isolationFt: 300, dayMi: 0.3, nightMi: 0.5 },
  },
];

export default function EvacuationDistance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [spillSize, setSpillSize] = useState<SpillSize>("small");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [searchTerm, setSearchTerm] = useState("");

  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 1 }) || { data: [], isLoading: false };
  const currentLoad = Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length > 0 ? shipmentsQuery.data[0] : null;

  const activeClass = currentLoad?.hazmatClass
    ? EVACUATION_DATA.find((d) => d.hazardClass === currentLoad.hazmatClass)
    : null;

  const filtered = useMemo(() => {
    if (!searchTerm) return EVACUATION_DATA;
    const q = searchTerm.toLowerCase();
    return EVACUATION_DATA.filter(
      (d) => d.name.toLowerCase().includes(q) || d.hazardClass.includes(q) || d.guideNumber.includes(q)
    );
  }, [searchTerm]);

  const getDistances = (item: typeof EVACUATION_DATA[0]) => {
    const spill = spillSize === "small" ? item.smallSpill : item.largeSpill;
    return {
      isolationFt: spill.isolationFt,
      protectiveMi: timeOfDay === "day" ? spill.dayMi : spill.nightMi,
    };
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Evacuation Distances
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            ERG initial isolation & protective action distances
          </p>
        </div>
      </div>

      {/* Active load highlight */}
      {activeClass && currentLoad && (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-red-600" : "text-red-400")}>
                Your Current Load
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-14 h-14 rotate-45 rounded-lg border-2 flex items-center justify-center flex-shrink-0",
                  "border-red-500 bg-red-500/10"
                )}>
                  <span className="-rotate-45 text-lg font-black text-red-500">{activeClass.hazardClass}</span>
                </div>
                <div>
                  <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
                    {activeClass.name}
                  </p>
                  <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                    Load #{currentLoad.loadNumber} &middot; ERG Guide #{activeClass.guideNumber}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={cn("p-3 rounded-xl text-center", isLight ? "bg-red-50" : "bg-red-500/10")}>
                  <p className={cn("text-2xl font-black tabular-nums", isLight ? "text-red-600" : "text-red-400")}>
                    {getDistances(activeClass).isolationFt}
                  </p>
                  <p className={cn("text-[10px] font-medium", isLight ? "text-red-500" : "text-red-400/70")}>
                    ft isolation
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl text-center", isLight ? "bg-orange-50" : "bg-orange-500/10")}>
                  <p className={cn("text-2xl font-black tabular-nums", isLight ? "text-orange-600" : "text-orange-400")}>
                    {getDistances(activeClass).protectiveMi}
                  </p>
                  <p className={cn("text-[10px] font-medium", isLight ? "text-orange-500" : "text-orange-400/70")}>
                    mi downwind
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Spill size toggle */}
        <div className={cn("flex rounded-xl overflow-hidden border", isLight ? "border-slate-200" : "border-slate-700")}>
          {(["small", "large"] as SpillSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setSpillSize(size)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-all",
                spillSize === size
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                  : isLight
                    ? "bg-white text-slate-500 hover:bg-slate-50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
              )}
            >
              {size === "small" ? "Small Spill" : "Large Spill"}
            </button>
          ))}
        </div>

        {/* Day/Night toggle */}
        <div className={cn("flex rounded-xl overflow-hidden border", isLight ? "border-slate-200" : "border-slate-700")}>
          {(["day", "night"] as TimeOfDay[]).map((tod) => (
            <button
              key={tod}
              onClick={() => setTimeOfDay(tod)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2",
                timeOfDay === tod
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                  : isLight
                    ? "bg-white text-slate-500 hover:bg-slate-50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
              )}
            >
              {tod === "day" ? <Sun className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
              {tod === "day" ? "Daytime" : "Nighttime"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={cn(
          "relative flex-1 rounded-xl border",
          isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
        )}>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search by class, name, or guide #..."
            className={cn(
              "pl-10 pr-4 py-2.5 border-0 rounded-xl text-sm focus-visible:ring-0",
              isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400"
            )}
          />
        </div>
      </div>

      {/* Night explanation */}
      {timeOfDay === "night" && (
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-xl text-xs",
          isLight ? "bg-indigo-50 border border-indigo-200 text-indigo-700" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
        )}>
          <MoonIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Nighttime distances are larger because atmospheric conditions (temperature inversions,
            less air mixing) allow toxic vapors to travel farther and remain concentrated.
          </p>
        </div>
      )}

      {/* Distance Table */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Ruler className="w-5 h-5 text-[#1473FF]" />
            {spillSize === "small" ? "Small Spill" : "Large Spill"} — {timeOfDay === "day" ? "Daytime" : "Nighttime"} Distances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Column headers */}
          <div className={cn(
            "grid grid-cols-12 gap-2 px-4 py-2 rounded-lg mb-2 text-[10px] uppercase tracking-wider font-medium",
            isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700/30 text-slate-500"
          )}>
            <div className="col-span-1">Class</div>
            <div className="col-span-4">Material</div>
            <div className="col-span-1 text-center">ERG</div>
            <div className="col-span-3 text-center">Initial Isolation</div>
            <div className="col-span-3 text-center">Protective Action</div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>No matching hazard classes</p>
              </div>
            ) : (
              filtered.map((item) => {
                const dist = getDistances(item);
                const isActive = activeClass?.hazardClass === item.hazardClass;
                return (
                  <div
                    key={item.hazardClass}
                    className={cn(
                      "grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl border transition-colors",
                      isActive
                        ? isLight
                          ? "bg-red-50 border-red-200 ring-1 ring-red-300"
                          : "bg-red-500/5 border-red-500/20 ring-1 ring-red-500/30"
                        : isLight
                          ? "bg-white border-slate-200 hover:border-slate-300"
                          : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                    )}
                  >
                    <div className="col-span-1">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", `${item.color} bg-current/10`)}>
                        <span className={item.color}>{item.hazardClass}</span>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                        {item.name}
                      </p>
                      {isActive && (
                        <Badge className="bg-red-500/15 text-red-500 border-0 text-[9px] mt-0.5">YOUR LOAD</Badge>
                      )}
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={cn("text-xs font-mono", isLight ? "text-slate-500" : "text-slate-400")}>
                        #{item.guideNumber}
                      </span>
                    </div>
                    <div className="col-span-3 text-center">
                      <p className={cn("text-lg font-bold tabular-nums", isLight ? "text-red-600" : "text-red-400")}>
                        {dist.isolationFt} ft
                      </p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>all directions</p>
                    </div>
                    <div className="col-span-3 text-center">
                      <p className={cn("text-lg font-bold tabular-nums", isLight ? "text-orange-600" : "text-orange-400")}>
                        {dist.protectiveMi} mi
                      </p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>downwind</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-lg flex-shrink-0", "bg-red-500/15")}>
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                  Initial Isolation Zone
                </p>
                <p className={cn("text-xs mt-1 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                  The area surrounding the incident in all directions where people may be exposed to
                  dangerous concentrations. Clear all persons from this zone immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-lg flex-shrink-0", "bg-orange-500/15")}>
                <Wind className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                  Protective Action Distance
                </p>
                <p className={cn("text-xs mt-1 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                  The downwind distance from the spill source where protective actions should be
                  implemented. Shelter-in-place or evacuate. Distance increases at night due to
                  atmospheric stability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
