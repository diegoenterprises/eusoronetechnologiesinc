/**
 * FIRE RESPONSE PAGE
 * Driver-facing hazmat fire emergency response guide.
 * Class-specific fire suppression guidance from ERG orange pages.
 * Covers extinguisher types, approach strategy, and when NOT to fight fire.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Flame, AlertTriangle, Phone, Shield, CheckCircle,
  XCircle, Wind, Droplets, Zap, Eye, Users
} from "lucide-react";

type FireClass = {
  hazardClass: string;
  name: string;
  fireAgent: string;
  doNot: string;
  evacuationFt: number;
  specialNote: string;
  color: string;
};

const FIRE_CLASSES: FireClass[] = [
  { hazardClass: "2.1", name: "Flammable Gas", fireAgent: "Dry chemical, CO2, water fog", doNot: "Do NOT use direct water stream on LPG/LNG leaks", evacuationFt: 2640, specialNote: "BLEVE risk — evacuate 0.5 mi if tank is involved in fire. Cool containers with water from maximum distance.", color: "text-red-500" },
  { hazardClass: "2.3", name: "Poison Gas", fireAgent: "Water spray, dry chemical", doNot: "Do NOT enter vapor cloud without SCBA", evacuationFt: 1600, specialNote: "Toxic vapors may be invisible. Wind direction is critical. Full protective equipment required.", color: "text-purple-500" },
  { hazardClass: "3", name: "Flammable Liquid", fireAgent: "Foam, dry chemical, CO2, water fog", doNot: "Do NOT use direct water stream — may spread fire", evacuationFt: 1000, specialNote: "Vapors may travel to ignition source and flash back. Petroleum fires produce thick black smoke.", color: "text-orange-500" },
  { hazardClass: "4.1", name: "Flammable Solid", fireAgent: "Water, foam", doNot: "Some may reignite after extinguishing", evacuationFt: 500, specialNote: "May burn with intense heat. Some metals produce hydrogen gas when wet.", color: "text-red-400" },
  { hazardClass: "4.2", name: "Spontaneously Combustible", fireAgent: "Dry sand, dry chemical — NO WATER", doNot: "Do NOT use water — may intensify reaction", evacuationFt: 1000, specialNote: "Material may reignite spontaneously on exposure to air after fire is out.", color: "text-orange-400" },
  { hazardClass: "4.3", name: "Dangerous When Wet", fireAgent: "Dry sand, dry chemical — NO WATER", doNot: "NEVER use water — produces flammable hydrogen gas", evacuationFt: 1600, specialNote: "Contact with water produces flammable/toxic gas. Use only dry extinguishing agents.", color: "text-blue-500" },
  { hazardClass: "5.1", name: "Oxidizer", fireAgent: "Copious water, foam", doNot: "Do NOT use dry chemical on strong oxidizers", evacuationFt: 1000, specialNote: "Oxidizers intensify fire. May cause other materials to ignite. Cool surrounding containers.", color: "text-yellow-500" },
  { hazardClass: "5.2", name: "Organic Peroxide", fireAgent: "Water spray ONLY — cool containers", doNot: "Do NOT attempt to fight advanced fire", evacuationFt: 2640, specialNote: "May explode from heat. Evacuate area if fire reaches cargo. Fight fire from maximum distance only.", color: "text-yellow-600" },
  { hazardClass: "8", name: "Corrosive", fireAgent: "Water spray, foam, dry chemical", doNot: "Avoid runoff entering waterways", evacuationFt: 500, specialNote: "Fire may produce toxic/corrosive fumes. Full PPE with SCBA required. Decontaminate after exposure.", color: "text-slate-500" },
];

export default function FireResponse() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 1 }) || { data: [], isLoading: false };
  const currentLoad = Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length > 0 ? shipmentsQuery.data[0] : null;

  const activeFireClass = currentLoad?.hazmatClass
    ? FIRE_CLASSES.find((fc) => fc.hazardClass === currentLoad.hazmatClass)
    : null;

  const displayClass = selectedClass
    ? FIRE_CLASSES.find((fc) => fc.hazardClass === selectedClass)
    : activeFireClass;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Fire Response
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat fire suppression guidance — ERG orange pages
          </p>
        </div>
        <a
          href="tel:911"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-red-500/20"
        >
          <Phone className="w-4 h-4" />
          Call 911
        </a>
      </div>

      {/* Critical warning */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="p-3 rounded-xl bg-red-500/20 flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-red-700" : "text-red-400")}>
            When in Doubt — DO NOT Fight the Fire
          </p>
          <p className={cn("text-sm mt-1", isLight ? "text-red-600" : "text-red-400/80")}>
            If cargo is fully involved, if you cannot identify the material, or if the fire is beyond the
            capacity of a portable extinguisher — evacuate immediately and let professionals handle it.
            Your life is more valuable than the cargo.
          </p>
        </div>
      </div>

      {/* Class selector pills */}
      <div className="flex flex-wrap gap-2">
        {FIRE_CLASSES.map((fc) => {
          const isActive = (selectedClass || activeFireClass?.hazardClass) === fc.hazardClass;
          const isCurrentLoad = activeFireClass?.hazardClass === fc.hazardClass && !selectedClass;
          return (
            <button
              key={fc.hazardClass}
              onClick={() => setSelectedClass(selectedClass === fc.hazardClass ? null : fc.hazardClass)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all relative",
                isActive
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                  : isLight
                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              {fc.hazardClass} {fc.name}
              {isCurrentLoad && !selectedClass && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected class detail */}
      {displayClass && (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rotate-45 rounded-lg border-3 flex items-center justify-center", "border-red-500 bg-red-500/10")}>
                <Flame className="-rotate-45 w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                  Class {displayClass.hazardClass} — {displayClass.name}
                </p>
                {activeFireClass?.hazardClass === displayClass.hazardClass && (
                  <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-[10px] mt-1">YOUR CURRENT LOAD</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fire Agent */}
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20")}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-bold text-green-600">USE</p>
                </div>
                <p className={cn("text-sm", isLight ? "text-green-700" : "text-green-300")}>{displayClass.fireAgent}</p>
              </div>

              {/* Do NOT */}
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20")}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-bold text-red-600">DO NOT</p>
                </div>
                <p className={cn("text-sm", isLight ? "text-red-700" : "text-red-300")}>{displayClass.doNot}</p>
              </div>
            </div>

            {/* Evacuation */}
            <div className={cn("p-4 rounded-xl border", isLight ? "bg-orange-50 border-orange-200" : "bg-orange-500/5 border-orange-500/20")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-bold text-orange-600">Evacuation Distance</p>
                </div>
                <p className={cn("text-2xl font-black tabular-nums", isLight ? "text-orange-600" : "text-orange-400")}>
                  {displayClass.evacuationFt.toLocaleString()} ft
                </p>
              </div>
              <p className={cn("text-xs", isLight ? "text-orange-600" : "text-orange-400/80")}>
                {(displayClass.evacuationFt / 5280).toFixed(2)} miles — evacuate all persons in all directions
              </p>
            </div>

            {/* Special note */}
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl",
              isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20"
            )}>
              <AlertTriangle className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isLight ? "text-amber-600" : "text-amber-400")} />
              <div>
                <p className={cn("text-sm font-medium", isLight ? "text-amber-800" : "text-amber-300")}>Special Considerations</p>
                <p className={cn("text-xs mt-0.5 leading-relaxed", isLight ? "text-amber-600" : "text-amber-400/80")}>{displayClass.specialNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General fire response steps */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Shield className="w-5 h-5 text-[#1473FF]" />
            Universal Fire Response Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, action: "Assess the situation from a safe distance upwind", icon: <Eye className="w-4 h-4" /> },
              { step: 2, action: "Call 911 and CHEMTREC (1-800-424-9300)", icon: <Phone className="w-4 h-4" /> },
              { step: 3, action: "Evacuate to the recommended distance for the hazard class", icon: <Users className="w-4 h-4" /> },
              { step: 4, action: "If safe: use appropriate extinguisher on small, contained fires only", icon: <Flame className="w-4 h-4" /> },
              { step: 5, action: "Provide shipping papers and ERG guide number to responders", icon: <Shield className="w-4 h-4" /> },
              { step: 6, action: "Account for all personnel — remain upwind and available for responders", icon: <Wind className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.step} className={cn(
                "flex items-center gap-4 p-4 rounded-xl border",
                isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  "bg-[#1473FF]/10 text-[#1473FF]"
                )}>
                  {item.step}
                </div>
                <p className={cn("text-sm font-medium flex-1", isLight ? "text-slate-700" : "text-slate-200")}>{item.action}</p>
                <div className={cn("p-2 rounded-lg", "bg-slate-500/10 text-slate-400")}>
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
