/**
 * LIQUID TANK INSPECTION PAGE
 * Driver-facing DOT-406 / MC-306 liquid cargo tank inspection screen.
 * Covers shell, heads, baffles, overturn protection, rollover damage,
 * manhole assemblies, and bottom loading valves for petroleum and
 * chemical liquid tank trailers.
 * Per 49 CFR 180.407 and 49 CFR 178.345/346.
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
  Droplets, AlertTriangle, CheckCircle, Clock,
  Send, XCircle, Shield, Settings, Activity
} from "lucide-react";

type InspItem = { id: string; label: string; description: string; category: string };

const CHECKLIST: InspItem[] = [
  { id: "shell_cond", label: "Shell condition — no dents or bulges", description: "Inspect tank shell for dents > 1 inch deep, bulges, or deformation.", category: "Shell & Structure" },
  { id: "shell_corr", label: "Shell corrosion within limits", description: "No pitting or general corrosion reducing wall thickness below minimum.", category: "Shell & Structure" },
  { id: "shell_welds", label: "Weld seams — no cracks or porosity", description: "Inspect all visible weld seams for cracking, undercutting, or porosity.", category: "Shell & Structure" },
  { id: "head_cond", label: "Head condition — front and rear", description: "Both tank heads free of dents, cracks, or distortion.", category: "Shell & Structure" },
  { id: "baffle_sound", label: "Baffles/bulkheads — no rattling", description: "Tap test or listen during braking. Loose baffles indicate weld failure.", category: "Shell & Structure" },
  { id: "mh_cover", label: "Manhole covers — sealed and bolted", description: "All manhole covers properly seated with gaskets intact. Bolts torqued.", category: "Manholes & Vents" },
  { id: "mh_gaskets", label: "Manhole gaskets — no leaks", description: "Gaskets not cracked, hardened, or showing product weep.", category: "Manholes & Vents" },
  { id: "mh_vent", label: "Vapor recovery / vent valves", description: "Vent valves operational. Vapor recovery fittings in good condition.", category: "Manholes & Vents" },
  { id: "mh_overfill", label: "Overfill protection functional", description: "Overfill probe, float, or optic sensor responds correctly.", category: "Manholes & Vents" },
  { id: "bl_valve", label: "Bottom loading valves — no leaks", description: "API adapter valves seat properly. No drips when closed.", category: "Valves & Piping" },
  { id: "bl_caps", label: "Dust caps on all unused connections", description: "All API couplers and unused fittings capped and chained.", category: "Valves & Piping" },
  { id: "iv_function", label: "Internal valves close on command", description: "Test each compartment internal valve via remote and manual shutoff.", category: "Valves & Piping" },
  { id: "piping_cond", label: "External piping — no cracks/leaks", description: "All manifold piping, crossovers, and fittings free of leaks.", category: "Valves & Piping" },
  { id: "ot_protect", label: "Overturn protection device intact", description: "Rollover protection for top fittings not bent, cracked, or missing.", category: "Safety Systems" },
  { id: "er_shutoff", label: "Emergency remote shutoff tested", description: "Pull cable/fusible link actuates all internal valves within 30 seconds.", category: "Safety Systems" },
  { id: "ground_reel", label: "Grounding reel/cable operational", description: "Static grounding reel retracts. Cable and clamp in good condition.", category: "Safety Systems" },
  { id: "placards", label: "Placard holders — all 4 sides", description: "Placard brackets present and functional on front, rear, and both sides.", category: "Safety Systems" },
  { id: "lights_ref", label: "Lights, reflectors, and conspicuity", description: "All DOT-required lights functional. Reflective tape intact.", category: "Safety Systems" },
];

export default function LiquidTankInspection() {
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
  const allChecked = totalChecked === CHECKLIST.length;
  const categories = Array.from(new Set(CHECKLIST.map((i) => i.category)));

  const handleSubmit = () => {
    if (!allChecked) { toast.error("Inspect all items before submitting"); return; }
    setSubmitted(true);
    toast.success(totalFail > 0 ? "Inspection submitted — deficiencies noted" : "Liquid tank inspection passed");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

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
              {totalChecked - totalFail}/{CHECKLIST.length} passed · {totalFail} deficiencies
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
            Liquid Tank Inspection
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            DOT-406 / MC-306 cargo tank — 49 CFR 180.407
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", allChecked ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30")}>
          {totalChecked}/{CHECKLIST.length} Inspected
        </Badge>
      </div>

      {/* Progress */}
      <div className={cn("p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-800/50")}>
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Inspection Progress</p>
          <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{Math.round((totalChecked / CHECKLIST.length) * 100)}%</p>
        </div>
        <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
          <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${(totalChecked / CHECKLIST.length) * 100}%` }} />
        </div>
        {totalFail > 0 && <p className="text-xs text-red-500 font-medium mt-1.5">{totalFail} deficiency(ies)</p>}
      </div>

      {/* Checklist by category */}
      {categories.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Droplets className="w-4 h-4 text-[#1473FF]" /> {cat}
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
                    isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
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
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Shell thickness readings, compartment details, or deficiency notes..." className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400")} />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button className={cn("w-full h-12 rounded-xl text-base font-medium", allChecked ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-700/50 text-slate-500")} disabled={!allChecked} onClick={handleSubmit}>
        <Send className="w-5 h-5 mr-2" /> {allChecked ? "Submit Liquid Tank Inspection" : `Complete ${CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
