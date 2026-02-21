/**
 * CRYOGENIC TANK PAGE
 * Driver-facing cryogenic cargo tank inspection and safety screen.
 * Covers MC-338 / DOT-4L spec tanks for LNG, LOX, LN2, LAR, CO2.
 * Displays vacuum integrity, hold time, pressure build coil status,
 * and cold-service specific inspection items.
 * Per 49 CFR 178.338 and 49 CFR 180.407.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Thermometer, AlertTriangle, CheckCircle, Clock, Shield,
  Gauge, Send, XCircle, Snowflake, Wind, Activity
} from "lucide-react";

type CryoItem = { id: string; label: string; description: string; category: string };

const CRYO_CHECKLIST: CryoItem[] = [
  { id: "vac_gauge", label: "Vacuum gauge reading within spec", description: "Annular vacuum must be < 50 microns. Higher readings indicate vacuum loss.", category: "Vacuum System" },
  { id: "vac_jacket", label: "Outer jacket — no dents or damage", description: "Inspect outer vessel for dents, corrosion, or impact damage that could compromise vacuum.", category: "Vacuum System" },
  { id: "vac_burst", label: "Vacuum annular burst disc intact", description: "Burst disc protects jacket from over-pressure if inner vessel leaks to annular space.", category: "Vacuum System" },
  { id: "pbc_valves", label: "Pressure build coil valves functional", description: "Economizer and pressure-build circuit valves cycle properly.", category: "Pressure Build" },
  { id: "pbc_coil", label: "Pressure build coil — no frost patterns", description: "Unusual frost indicates internal leak in coil assembly.", category: "Pressure Build" },
  { id: "pbc_reg", label: "Pressure build regulator set correctly", description: "Verify regulator set to product delivery pressure specification.", category: "Pressure Build" },
  { id: "prd_primary", label: "Primary PRD — tag & seal", description: "Primary relief set at MAWP. Calibration tag readable and seal intact.", category: "Relief Devices" },
  { id: "prd_secondary", label: "Secondary PRD — tag & seal", description: "Secondary relief (frangible disc) rated at 150% MAWP.", category: "Relief Devices" },
  { id: "prd_vent", label: "Relief vent stacks unobstructed", description: "Vent pipes must discharge vertically with no ice blockage.", category: "Relief Devices" },
  { id: "level_gauge", label: "Liquid level gauge accurate", description: "Differential pressure gauge reads correctly. Cross-check with load ticket.", category: "Instrumentation" },
  { id: "pressure_gauge", label: "Pressure gauge — inner vessel", description: "Inner vessel pressure gauge reads accurately and is not pegged.", category: "Instrumentation" },
  { id: "try_cock", label: "Try cock valves operational", description: "Manual liquid level verification valves open and close without leaking.", category: "Instrumentation" },
  { id: "fill_conn", label: "Fill connections — caps and gaskets", description: "All fill line caps in place with proper gaskets. No frost on closed connections.", category: "Connections" },
  { id: "discharge", label: "Discharge connections secure", description: "Bottom discharge valve, hose connections, and flex lines in good condition.", category: "Connections" },
  { id: "grounding", label: "Grounding/bonding lug present", description: "Grounding connection clean and accessible for static dissipation.", category: "Connections" },
];

export default function CryogenicTank() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [checked, setChecked] = useState<Record<string, "pass" | "fail">>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string, status: "pass" | "fail") => {
    setChecked((prev) => ({ ...prev, [id]: prev[id] === status ? undefined as any : status }));
  };

  const totalChecked = Object.keys(checked).filter((k) => checked[k]).length;
  const totalFail = Object.values(checked).filter((v) => v === "fail").length;
  const allChecked = totalChecked === CRYO_CHECKLIST.length;
  const categories = Array.from(new Set(CRYO_CHECKLIST.map((i) => i.category)));

  const handleSubmit = () => {
    if (!allChecked) { toast.error("Inspect all items before submitting"); return; }
    setSubmitted(true);
    toast.success(totalFail > 0 ? "Inspection submitted — deficiencies noted" : "Cryogenic tank inspection passed");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  if (submitted) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[800px] mx-auto">
        <Card className={cn(cc, "overflow-hidden")}>
          <div className={cn("h-1.5", totalFail > 0 ? "bg-red-500" : "bg-gradient-to-r from-green-500 to-emerald-500")} />
          <CardContent className="py-16 text-center">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center", totalFail > 0 ? (isLight ? "bg-red-50" : "bg-red-500/10") : (isLight ? "bg-green-50" : "bg-green-500/10"))}>
              {totalFail > 0 ? <AlertTriangle className="w-10 h-10 text-red-500" /> : <CheckCircle className="w-10 h-10 text-green-500" />}
            </div>
            <h2 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>
              {totalFail > 0 ? "Deficiencies Found" : "Inspection Passed"}
            </h2>
            <p className={cn("text-sm mt-2", isLight ? "text-slate-500" : "text-slate-400")}>
              {totalChecked - totalFail}/{CRYO_CHECKLIST.length} items passed · {totalFail} deficiencies
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Cryogenic Tank
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            MC-338 / DOT-4L cryogenic inspection — 49 CFR 178.338
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", allChecked ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30")}>
          {totalChecked}/{CRYO_CHECKLIST.length} Inspected
        </Badge>
      </div>

      {/* Safety Warning */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-blue-50 border-blue-300" : "bg-blue-500/10 border-blue-500/30"
      )}>
        <div className="p-3 rounded-xl bg-blue-500/20 flex-shrink-0">
          <Snowflake className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-blue-700" : "text-blue-400")}>Cryogenic Safety</p>
          <p className={cn("text-sm mt-1", isLight ? "text-blue-600" : "text-blue-400/80")}>
            Cryogenic liquids are extremely cold (-320°F / -196°C). Skin contact causes instant frostbite.
            Always wear cryogenic-rated PPE: face shield, insulated gloves, long sleeves, and safety boots.
            Never seal a cryogenic container without a functioning pressure relief device.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className={cn("p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Inspection Progress</p>
          <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{Math.round((totalChecked / CRYO_CHECKLIST.length) * 100)}%</p>
        </div>
        <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
          <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${(totalChecked / CRYO_CHECKLIST.length) * 100}%` }} />
        </div>
        {totalFail > 0 && <p className="text-xs text-red-500 font-medium mt-1.5">{totalFail} deficiency(ies) found</p>}
      </div>

      {/* Checklist */}
      {categories.map((cat) => {
        const items = CRYO_CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Snowflake className="w-4 h-4 text-[#1473FF]" /> {cat}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const status = checked[item.id];
                return (
                  <div key={item.id} className={cn(
                    "flex items-start justify-between p-4 rounded-xl border transition-colors",
                    status === "pass" ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20") :
                    status === "fail" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20") :
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                  )}>
                    <div className="flex-1 mr-3">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.label}</p>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{item.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggle(item.id, "pass")} className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors", status === "pass" ? "bg-green-500 border-green-500 text-white" : isLight ? "border-slate-200 text-slate-400 hover:border-green-300" : "border-slate-600 text-slate-500 hover:border-green-500")}>
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => toggle(item.id, "fail")} className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors", status === "fail" ? "bg-red-500 border-red-500 text-white" : isLight ? "border-slate-200 text-slate-400 hover:border-red-300" : "border-slate-600 text-slate-500 hover:border-red-500")}>
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Notes */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Activity className="w-4 h-4 text-[#BE01FF]" /> Inspector Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Vacuum readings, hold time observations, or deficiency details..." className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400")} />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button className={cn("w-full h-12 rounded-xl text-base font-medium", allChecked ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20" : isLight ? "bg-slate-100 text-slate-400" : "bg-white/[0.04] text-slate-500")} disabled={!allChecked} onClick={handleSubmit}>
        <Send className="w-5 h-5 mr-2" /> {allChecked ? "Submit Cryogenic Inspection" : `Complete ${CRYO_CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
