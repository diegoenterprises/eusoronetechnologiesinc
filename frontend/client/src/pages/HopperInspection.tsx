/**
 * HOPPER INSPECTION PAGE
 * Driver-facing hopper/pneumatic trailer inspection checklist.
 * Covers dry bulk hopper trailers (grain, sand, cement, chemical powder)
 * including gates, seals, aeration, and tarp systems.
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
  Package, AlertTriangle, CheckCircle,
  Send, XCircle, Activity, Wind
} from "lucide-react";

type InspItem = { id: string; label: string; description: string; category: string };

const CHECKLIST: InspItem[] = [
  { id: "body_cond", label: "Hopper body — no cracks or holes", description: "Inspect all compartments for cracks, weld failures, or corrosion holes.", category: "Body & Structure" },
  { id: "body_welds", label: "Weld seams intact", description: "No cracking at hopper cone weld joints or body-to-frame connections.", category: "Body & Structure" },
  { id: "body_liner", label: "Interior liner condition (if equipped)", description: "Poly or stainless liner not delaminated, torn, or missing sections.", category: "Body & Structure" },
  { id: "gate_oper", label: "Discharge gates open/close fully", description: "All hopper gates cycle through full range. No binding or sticking.", category: "Gates & Discharge" },
  { id: "gate_seal", label: "Gate seals — no leaking", description: "Rubber or UHMW seals seat properly. No product leaking when closed.", category: "Gates & Discharge" },
  { id: "gate_lock", label: "Gate locks/pins engaged", description: "Safety locks or pins in place preventing accidental gate opening.", category: "Gates & Discharge" },
  { id: "gate_slide", label: "Slide gate tracks clear", description: "Gate tracks free of product buildup, ice, or debris preventing closure.", category: "Gates & Discharge" },
  { id: "aer_pads", label: "Aeration pads functional", description: "Air pads inflate evenly. No holes or tears in pad membrane.", category: "Aeration System" },
  { id: "aer_lines", label: "Air lines — no leaks", description: "All pneumatic lines connected tightly. No audible air leaks.", category: "Aeration System" },
  { id: "aer_valves", label: "Aeration control valves", description: "Individual compartment air valves operate correctly.", category: "Aeration System" },
  { id: "tarp_cond", label: "Tarp system — no tears or holes", description: "Rolling tarp or flip tarp covers full opening. No product exposure.", category: "Tarp & Cover" },
  { id: "tarp_mech", label: "Tarp mechanism operates smoothly", description: "Crank, pull cable, or electric motor rolls tarp without binding.", category: "Tarp & Cover" },
  { id: "tarp_seal", label: "Tarp seals at edges", description: "Side rails and tarp edge create weather-tight seal.", category: "Tarp & Cover" },
  { id: "hatch_seal", label: "Fill hatches — gaskets intact", description: "Top fill hatch gaskets not cracked or hardened. Latches secure.", category: "Hatches & Manholes" },
  { id: "hatch_screen", label: "Hatch screens in place", description: "Product screens/filters present to prevent foreign object entry.", category: "Hatches & Manholes" },
  { id: "manhole_cond", label: "Manhole covers sealed", description: "Inspection manholes properly bolted with gaskets seated.", category: "Hatches & Manholes" },
  { id: "frame_crack", label: "Frame — no cracks at stress points", description: "Inspect frame rails at spring hangers, crossmembers, and king pin.", category: "Frame & Running Gear" },
  { id: "landing_gear", label: "Landing gear functional", description: "Crank operates smoothly. Pads not cracked. Cross-shaft not bent.", category: "Frame & Running Gear" },
];

export default function HopperInspection() {
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
    toast.success(totalFail > 0 ? "Inspection submitted — deficiencies noted" : "Hopper inspection passed");
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hopper Inspection
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Dry bulk hopper / pneumatic trailer inspection checklist
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

      {categories.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Wind className="w-4 h-4 text-[#1473FF]" /> {cat}
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

      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Activity className="w-4 h-4 text-[#BE01FF]" /> Inspector Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Product type, compartment weights, gate condition details..." className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400")} />
        </CardContent>
      </Card>

      <Button className={cn("w-full h-12 rounded-xl text-base font-medium", allChecked ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-700/50 text-slate-500")} disabled={!allChecked} onClick={handleSubmit}>
        <Send className="w-5 h-5 mr-2" /> {allChecked ? "Submit Hopper Inspection" : `Complete ${CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
