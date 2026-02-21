/**
 * PRESSURIZED TANK INSPECTION PAGE
 * Driver-facing pressurized cargo tank inspection screen.
 * Covers DOT-407 (MC-307) and DOT-412 (MC-312) spec tanks
 * for corrosives, acids, and pressurized chemicals.
 * Per 49 CFR 180.407, 178.346, 178.347.
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
  Gauge, AlertTriangle, CheckCircle, Clock,
  Send, XCircle, Shield, Activity
} from "lucide-react";

type InspItem = { id: string; label: string; description: string; category: string };

const CHECKLIST: InspItem[] = [
  { id: "shell_thick", label: "Shell thickness — minimum wall verified", description: "Ultrasonic thickness readings at test points meet minimum design spec.", category: "Shell & Vessel" },
  { id: "shell_dent", label: "No dents exceeding allowable depth", description: "Dents must not exceed limits per 49 CFR 180.407(d)(2). Measure depth and diameter.", category: "Shell & Vessel" },
  { id: "shell_lining", label: "Internal lining intact (if lined)", description: "Rubber, FRP, or polyethylene lining shows no delamination, blistering, or cracks.", category: "Shell & Vessel" },
  { id: "head_cond", label: "Heads — no distortion or cracks", description: "Front and rear heads inspected for dishing, cracks at weld junctions.", category: "Shell & Vessel" },
  { id: "ring_stiff", label: "Ring stiffeners and doublers secure", description: "External ring stiffeners welded solidly. No cracking at attachment welds.", category: "Shell & Vessel" },
  { id: "prd_set", label: "PRD set pressure verified", description: "Relief device set within +/- 3 PSI of rated set pressure for vessel MAWP.", category: "Pressure Relief" },
  { id: "prd_disc", label: "Rupture disc intact (if equipped)", description: "Frangible disc not bulging, corroded, or previously activated.", category: "Pressure Relief" },
  { id: "prd_vent", label: "Relief vent path clear", description: "Vent pipe unobstructed, properly oriented, and rain cap in place.", category: "Pressure Relief" },
  { id: "mh_torque", label: "Manhole bolts properly torqued", description: "All manhole cover bolts at specified torque. Star pattern tightening used.", category: "Manholes & Closures" },
  { id: "mh_gasket", label: "Manhole gasket — correct material", description: "Gasket compatible with product. PTFE for acids, Buna-N for organics.", category: "Manholes & Closures" },
  { id: "mh_hinge", label: "Manhole hinge and latch mechanism", description: "Hinge pin not worn. Latch engages fully and holds under pressure.", category: "Manholes & Closures" },
  { id: "iv_air", label: "Internal valve — air-operated test", description: "Cycle air-operated internal valve. Must open fully and seat completely.", category: "Valves & Piping" },
  { id: "iv_remote", label: "Remote shutoff — thermal fusible", description: "Fusible element not degraded. Remote cable actuates valve closure.", category: "Valves & Piping" },
  { id: "pipe_press", label: "External piping pressure test", description: "Manifold piping holds rated pressure with no leaks at joints or fittings.", category: "Valves & Piping" },
  { id: "pipe_support", label: "Pipe supports and brackets intact", description: "All pipe hangers and brackets secure. No vibration-induced cracking.", category: "Valves & Piping" },
  { id: "frame_mount", label: "Tank-to-frame mounting bolts", description: "Mounting pads and U-bolts secure. No cracks in saddle welds.", category: "Frame & Mounting" },
  { id: "frame_walk", label: "Walkway and ladder condition", description: "Non-slip surface intact. Handrails secure. Ladder rungs not bent.", category: "Frame & Mounting" },
  { id: "frame_fender", label: "Fenders and splash guards", description: "Fenders not bent into tires. Splash guards present and secure.", category: "Frame & Mounting" },
];

export default function PressurizedTankInspection() {
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
    toast.success(totalFail > 0 ? "Inspection submitted — deficiencies noted" : "Pressurized tank inspection passed");
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
              {totalChecked - totalFail}/{CHECKLIST.length} passed · {totalFail} deficiencies
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Pressurized Tank Inspection
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            DOT-407 / DOT-412 cargo tank — 49 CFR 178.346/347
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", allChecked ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30")}>
          {totalChecked}/{CHECKLIST.length} Inspected
        </Badge>
      </div>

      {/* Progress */}
      <div className={cn("p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Inspection Progress</p>
          <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{Math.round((totalChecked / CHECKLIST.length) * 100)}%</p>
        </div>
        <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
          <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${(totalChecked / CHECKLIST.length) * 100}%` }} />
        </div>
        {totalFail > 0 && <p className="text-xs text-red-500 font-medium mt-1.5">{totalFail} deficiency(ies)</p>}
      </div>

      {categories.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Gauge className="w-4 h-4 text-[#1473FF]" /> {cat}
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

      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Activity className="w-4 h-4 text-[#BE01FF]" /> Inspector Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="UT readings, lining condition, pressure test results..." className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400")} />
        </CardContent>
      </Card>

      <Button className={cn("w-full h-12 rounded-xl text-base font-medium", allChecked ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20" : isLight ? "bg-slate-100 text-slate-400" : "bg-white/[0.04] text-slate-500")} disabled={!allChecked} onClick={handleSubmit}>
        <Send className="w-5 h-5 mr-2" /> {allChecked ? "Submit Pressurized Tank Inspection" : `Complete ${CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
