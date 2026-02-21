/**
 * TANK VALVE PAGE
 * Driver-facing tank valve inspection checklist screen.
 * Covers all valve types on cargo tank motor vehicles:
 * internal valves, external valves, pressure relief devices,
 * emergency shutoffs, and loading/unloading valves.
 * Per 49 CFR 180.407 and 49 CFR 173.33.
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
  CheckCircle, AlertTriangle, Settings, Shield,
  Clock, ChevronRight, Send, XCircle, Droplets
} from "lucide-react";

type InspectionItem = {
  id: string;
  label: string;
  description: string;
  category: string;
};

const VALVE_CHECKLIST: InspectionItem[] = [
  { id: "iv_seal", label: "Internal valve seal integrity", description: "Check for leaks at the internal valve seat. No dripping when closed.", category: "Internal Valves" },
  { id: "iv_operation", label: "Internal valve opens/closes fully", description: "Cycle valve through full range. Must operate smoothly without binding.", category: "Internal Valves" },
  { id: "iv_remote", label: "Remote closure device functional", description: "Test thermal/manual remote shutoff. Must close internal valve from exterior.", category: "Internal Valves" },
  { id: "ev_condition", label: "External valve body condition", description: "No cracks, corrosion, or impact damage on external valve housing.", category: "External Valves" },
  { id: "ev_handle", label: "Valve handles present and secure", description: "All operating handles in place, not bent or damaged.", category: "External Valves" },
  { id: "ev_gaskets", label: "Gaskets and packing in good condition", description: "No leaks at packing glands or flange gaskets.", category: "External Valves" },
  { id: "prd_setting", label: "PRD set pressure within spec", description: "Pressure relief device must actuate at rated pressure +/- tolerance.", category: "Pressure Relief" },
  { id: "prd_vent", label: "PRD vent path unobstructed", description: "Relief vent must discharge to atmosphere without obstruction.", category: "Pressure Relief" },
  { id: "prd_seal", label: "PRD seal/tag intact", description: "Tamper seal and calibration tag present and legible.", category: "Pressure Relief" },
  { id: "es_cable", label: "Emergency shutoff cable condition", description: "Fusible link/cable not frayed, corroded, or improperly routed.", category: "Emergency Shutoff" },
  { id: "es_thermal", label: "Thermal activation device intact", description: "Fusible element rated correctly and not previously activated.", category: "Emergency Shutoff" },
  { id: "es_test", label: "Emergency shutoff function test", description: "Manually activate and verify full valve closure within 30 seconds.", category: "Emergency Shutoff" },
  { id: "lu_cap", label: "Loading/unloading caps secure", description: "Dust caps, blind flanges, and closure caps properly tightened.", category: "Loading/Unloading" },
  { id: "lu_adapter", label: "Adapters and fittings compatible", description: "Correct thread type and material compatibility for product.", category: "Loading/Unloading" },
  { id: "lu_grounding", label: "Grounding connection functional", description: "Grounding lug present, clean, and cable in good condition.", category: "Loading/Unloading" },
];

export default function TankValve() {
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
  const allChecked = totalChecked === VALVE_CHECKLIST.length;

  const categories = Array.from(new Set(VALVE_CHECKLIST.map((i) => i.category)));

  const handleSubmit = () => {
    if (!allChecked) { toast.error("Please inspect all items before submitting"); return; }
    setSubmitted(true);
    toast.success(totalFail > 0 ? "Inspection submitted — deficiencies noted" : "Inspection passed — all valves OK");
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
              {totalChecked - totalFail}/{VALVE_CHECKLIST.length} items passed · {totalFail} deficiencies
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
            Tank Valve Inspection
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Cargo tank valve inspection checklist — 49 CFR 180.407
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", allChecked ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30")}>
          {totalChecked}/{VALVE_CHECKLIST.length} Inspected
        </Badge>
      </div>

      {/* Progress */}
      <div className={cn("p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Inspection Progress</p>
          <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{Math.round((totalChecked / VALVE_CHECKLIST.length) * 100)}%</p>
        </div>
        <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
          <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${(totalChecked / VALVE_CHECKLIST.length) * 100}%` }} />
        </div>
        {totalFail > 0 && (
          <p className="text-xs text-red-500 font-medium mt-1.5">{totalFail} deficiency(ies) found</p>
        )}
      </div>

      {/* Checklist by category */}
      {categories.map((cat) => {
        const items = VALVE_CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Settings className="w-4 h-4 text-[#1473FF]" />
                {cat}
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
            <Droplets className="w-4 h-4 text-[#BE01FF]" />
            Inspector Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Additional observations, deficiency details, or follow-up actions..."
            className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400")}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className={cn(
          "w-full h-12 rounded-xl text-base font-medium",
          allChecked
            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20"
            : isLight ? "bg-slate-100 text-slate-400" : "bg-white/[0.04] text-slate-500"
        )}
        disabled={!allChecked}
        onClick={handleSubmit}
      >
        <Send className="w-5 h-5 mr-2" />
        {allChecked ? "Submit Inspection" : `Complete all ${VALVE_CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
