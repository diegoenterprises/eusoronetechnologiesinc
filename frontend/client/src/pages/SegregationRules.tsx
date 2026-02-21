/**
 * SEGREGATION RULES PAGE
 * Hazmat cargo segregation compatibility reference — 49 CFR 177.848.
 * Interactive segregation table showing which hazard classes can be
 * loaded together and which are incompatible. Drivers and dispatchers
 * use this before co-loading hazardous materials.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle, XCircle, Shield, Info,
  Package, RefreshCw, Search, Truck, HelpCircle
} from "lucide-react";

const CLASSES = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "6.2", "7", "8", "9"];
const CLASS_NAMES: Record<string, string> = {
  "1.1": "Explosives (Mass)", "1.2": "Explosives (Projection)", "1.3": "Explosives (Fire)",
  "1.4": "Explosives (Minor)", "1.5": "Explosives (Insensitive)", "1.6": "Explosives (Ext. Insensitive)",
  "2.1": "Flammable Gas", "2.2": "Non-Flam Gas", "2.3": "Poison Gas",
  "3": "Flammable Liquid", "4.1": "Flammable Solid", "4.2": "Spont. Combustible",
  "4.3": "Dangerous When Wet", "5.1": "Oxidizer", "5.2": "Organic Peroxide",
  "6.1": "Poison/Toxic", "6.2": "Infectious", "7": "Radioactive", "8": "Corrosive", "9": "Misc. Dangerous",
};

// Simplified segregation table: X = incompatible, O = compatible, * = special conditions
const SEG_TABLE: Record<string, Record<string, string>> = {
  "2.1": { "2.3": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X" },
  "2.3": { "2.1": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "8": "X" },
  "3": { "2.3": "X", "4.2": "X", "4.3": "X", "5.1": "*", "5.2": "X" },
  "4.1": { "2.3": "X", "5.2": "X" },
  "4.2": { "2.1": "X", "2.3": "X", "3": "X", "5.1": "X", "5.2": "X", "8": "X" },
  "4.3": { "2.1": "X", "2.3": "X", "3": "X", "5.1": "X", "5.2": "X", "8": "X" },
  "5.1": { "2.1": "X", "2.3": "X", "3": "*", "4.2": "X", "4.3": "X", "5.2": "X", "8": "X" },
  "5.2": { "2.1": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "8": "X" },
  "8": { "2.3": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X" },
};

function getCompatibility(a: string, b: string): string {
  if (a === b) return "=";
  return SEG_TABLE[a]?.[b] || SEG_TABLE[b]?.[a] || "O";
}

type CheckerPair = { classA: string; classB: string } | null;

export default function SegregationRules() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [checkerPair, setCheckerPair] = useState<CheckerPair>(null);
  const [classA, setClassA] = useState("");
  const [classB, setClassB] = useState("");

  const checkSegQuery = (trpc as any).hazmat?.checkSegregation?.useQuery?.(
    checkerPair ? { materials: [{ hazmatClass: checkerPair.classA }, { hazmatClass: checkerPair.classB }] } : undefined,
    { enabled: !!checkerPair }
  ) || { data: null, isLoading: false };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  const handleCheck = () => {
    if (!classA || !classB) {
      toast.error("Select both hazard classes to check compatibility");
      return;
    }
    setCheckerPair({ classA, classB });
  };

  const result = checkerPair ? getCompatibility(checkerPair.classA, checkerPair.classB) : null;

  // Reduced classes for the interactive table (most common for oil & gas)
  const COMMON_CLASSES = ["2.1", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "8", "9"];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Segregation Rules
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat cargo compatibility — 49 CFR 177.848
          </p>
        </div>
      </div>

      {/* Quick Compatibility Checker */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Search className="w-5 h-5 text-[#1473FF]" />
            Quick Compatibility Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className={cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400")}>
                Material A — Hazard Class
              </label>
              <select
                value={classA}
                onChange={(e) => { setClassA(e.target.value); setCheckerPair(null); }}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm",
                  isLight ? "bg-white border-slate-200 text-slate-800" : "bg-white/[0.02] border-white/[0.06] text-white"
                )}
              >
                <option value="">Select class...</option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>Class {c} — {CLASS_NAMES[c]}</option>
                ))}
              </select>
            </div>
            <div className={cn("flex items-center justify-center w-10 h-11 text-lg font-bold", isLight ? "text-slate-300" : "text-slate-600")}>
              +
            </div>
            <div className="flex-1">
              <label className={cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400")}>
                Material B — Hazard Class
              </label>
              <select
                value={classB}
                onChange={(e) => { setClassB(e.target.value); setCheckerPair(null); }}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm",
                  isLight ? "bg-white border-slate-200 text-slate-800" : "bg-white/[0.02] border-white/[0.06] text-white"
                )}
              >
                <option value="">Select class...</option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>Class {c} — {CLASS_NAMES[c]}</option>
                ))}
              </select>
            </div>
            <Button
              className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11 px-6"
              onClick={handleCheck}
            >
              Check
            </Button>
          </div>

          {/* Result */}
          {checkerPair && (
            <div className={cn(
              "p-4 rounded-xl border-2 flex items-center gap-4",
              result === "X"
                ? isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
                : result === "*"
                  ? isLight ? "bg-yellow-50 border-yellow-300" : "bg-yellow-500/10 border-yellow-500/30"
                  : isLight ? "bg-green-50 border-green-300" : "bg-green-500/10 border-green-500/30"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                result === "X" ? "bg-red-500/20" : result === "*" ? "bg-yellow-500/20" : "bg-green-500/20"
              )}>
                {result === "X"
                  ? <XCircle className="w-6 h-6 text-red-500" />
                  : result === "*"
                    ? <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    : <CheckCircle className="w-6 h-6 text-green-500" />
                }
              </div>
              <div>
                <p className={cn("text-base font-bold", result === "X" ? "text-red-600" : result === "*" ? "text-yellow-600" : "text-green-600")}>
                  {result === "X" ? "INCOMPATIBLE — Do Not Load Together" : result === "*" ? "CONDITIONAL — Special Requirements Apply" : "COMPATIBLE — May Be Loaded Together"}
                </p>
                <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>
                  Class {checkerPair.classA} ({CLASS_NAMES[checkerPair.classA]}) + Class {checkerPair.classB} ({CLASS_NAMES[checkerPair.classB]})
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Segregation Table */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Package className="w-5 h-5 text-[#BE01FF]" />
            Segregation Table (49 CFR 177.848)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={cn("p-2 text-left font-medium sticky left-0 z-10", isLight ? "bg-white text-slate-500" : "bg-white/[0.03] text-slate-400")}>
                    Class
                  </th>
                  {COMMON_CLASSES.map((c) => (
                    <th
                      key={c}
                      className={cn(
                        "p-2 text-center font-bold cursor-pointer transition-colors whitespace-nowrap",
                        selectedClass === c
                          ? "bg-[#1473FF]/10 text-[#1473FF]"
                          : isLight ? "text-slate-600 hover:bg-slate-50" : "text-slate-300 hover:bg-white/[0.06]/30"
                      )}
                      onClick={() => setSelectedClass(selectedClass === c ? null : c)}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMON_CLASSES.map((row) => (
                  <tr key={row}>
                    <td className={cn(
                      "p-2 font-bold whitespace-nowrap sticky left-0 z-10 cursor-pointer transition-colors",
                      selectedClass === row
                        ? "bg-[#1473FF]/10 text-[#1473FF]"
                        : isLight ? "bg-white text-slate-700 hover:bg-slate-50" : "bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]/30"
                    )} onClick={() => setSelectedClass(selectedClass === row ? null : row)}>
                      <div>
                        <span>{row}</span>
                        <span className={cn("block text-[9px] font-normal", isLight ? "text-slate-400" : "text-slate-500")}>
                          {CLASS_NAMES[row]?.substring(0, 12)}
                        </span>
                      </div>
                    </td>
                    {COMMON_CLASSES.map((col) => {
                      const compat = getCompatibility(row, col);
                      const isHighlighted = selectedClass === row || selectedClass === col;
                      return (
                        <td
                          key={col}
                          className={cn(
                            "p-2 text-center transition-colors",
                            isHighlighted && compat !== "="
                              ? compat === "X" ? "bg-red-500/15" : compat === "*" ? "bg-yellow-500/15" : "bg-green-500/10"
                              : ""
                          )}
                        >
                          {compat === "=" ? (
                            <span className="text-slate-400">—</span>
                          ) : compat === "X" ? (
                            <span className="text-red-500 font-bold">X</span>
                          ) : compat === "*" ? (
                            <span className="text-yellow-500 font-bold">*</span>
                          ) : (
                            <span className="text-green-500 font-bold">O</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold text-sm">O</span>
              <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Compatible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold text-sm">X</span>
              <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Incompatible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 font-bold text-sm">*</span>
              <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Conditional / Special requirements</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key segregation rules */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Shield className="w-5 h-5 text-[#1473FF]" />
            Key Segregation Principles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Oxidizers + Flammables", detail: "Class 5.1 Oxidizers must never be loaded with Class 3 Flammable Liquids without proper segregation (physical separation or approved barrier).", color: "bg-red-500/10 text-red-400" },
            { title: "Corrosives + Organics", detail: "Class 8 Corrosives react violently with Class 5.2 Organic Peroxides. Must be separated by full compartment width.", color: "bg-orange-500/10 text-orange-400" },
            { title: "Water-Reactive Materials", detail: "Class 4.3 materials must be kept away from all water sources and most other hazard classes during transport.", color: "bg-blue-500/10 text-blue-400" },
            { title: "Poison Gas Isolation", detail: "Class 2.3 Poison Gas is incompatible with most other classes. Requires maximum segregation.", color: "bg-purple-500/10 text-purple-400" },
          ].map((rule, i) => (
            <div key={i} className={cn(
              "flex items-start gap-4 p-4 rounded-xl border",
              isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
            )}>
              <div className={cn("p-2.5 rounded-lg flex-shrink-0", rule.color)}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{rule.title}</p>
                <p className={cn("text-xs mt-1 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>{rule.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
