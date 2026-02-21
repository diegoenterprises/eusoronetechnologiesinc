/**
 * FLATBED SECUREMENT PAGE
 * Driver-facing flatbed cargo securement inspection checklist.
 * Covers FMCSA cargo securement rules (49 CFR 393 Subpart I),
 * tie-down working load limits, edge protection, blocking/bracing,
 * and commodity-specific securement methods.
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
  Package, AlertTriangle, CheckCircle, Shield,
  Send, XCircle, Truck, Activity, Lock
} from "lucide-react";

type InspItem = { id: string; label: string; description: string; category: string };

const CHECKLIST: InspItem[] = [
  { id: "wll_calc", label: "Working load limit meets 50% rule", description: "Aggregate WLL of tie-downs >= 50% of cargo weight (49 CFR 393.106).", category: "Tie-Down Requirements" },
  { id: "tiedown_count", label: "Minimum tie-down count met", description: "1 tie-down for <5ft, 2 for 5-10ft, plus 1 per additional 10ft of cargo.", category: "Tie-Down Requirements" },
  { id: "chain_grade", label: "Chain grade and condition verified", description: "Grade 70 transport chain minimum. No kinks, cracks, or stretched links.", category: "Tie-Down Requirements" },
  { id: "strap_cond", label: "Straps — no cuts, fraying, or UV damage", description: "Synthetic webbing free of cuts >10% width, knots, or sun degradation.", category: "Tie-Down Requirements" },
  { id: "binder_func", label: "Binders/ratchets functional", description: "Load binders engage fully. Ratchets lock and release properly.", category: "Tie-Down Requirements" },
  { id: "edge_protect", label: "Edge protection in place", description: "Corner protectors on all sharp edges contacting tie-downs (49 CFR 393.104).", category: "Edge & Surface Protection" },
  { id: "friction_mat", label: "Friction/anti-skid mats placed", description: "Rubber friction mats between cargo and deck to prevent sliding.", category: "Edge & Surface Protection" },
  { id: "deck_clear", label: "Deck clear of debris and ice", description: "Trailer deck swept clean. No ice, oil, or loose material under cargo.", category: "Edge & Surface Protection" },
  { id: "block_front", label: "Front-end blocking/headboard adequate", description: "Cargo blocked against forward movement. Headboard rated for cargo weight.", category: "Blocking & Bracing" },
  { id: "block_side", label: "Side blocking in place", description: "Cargo blocked or braced against lateral movement on both sides.", category: "Blocking & Bracing" },
  { id: "brace_rear", label: "Rear blocking/tail gate", description: "Cargo prevented from rearward movement by blocking, bracing, or tie-downs.", category: "Blocking & Bracing" },
  { id: "stack_stable", label: "Stacked cargo stable and interlocked", description: "Multiple tiers properly interlocked or individually secured.", category: "Blocking & Bracing" },
  { id: "coil_secure", label: "Coils/pipes — commodity-specific method", description: "Metal coils per 49 CFR 393.120. Pipes per 393.118. Proper cradles/chocks.", category: "Commodity-Specific" },
  { id: "lumber_secure", label: "Lumber/building materials secured", description: "Per 49 CFR 393.116. Proper tier stakes and cross-tie patterns.", category: "Commodity-Specific" },
  { id: "equip_secure", label: "Heavy equipment — 4-point minimum", description: "Per 49 CFR 393.130. Chains rated for equipment weight. All 4 corners.", category: "Commodity-Specific" },
  { id: "tarp_secure", label: "Tarp (if used) — secure and tight", description: "Tarp not flapping. All bungees/straps in place. No wind catch points.", category: "Final Checks" },
  { id: "flags_lights", label: "Oversize flags and lights (if applicable)", description: "Red flags on overhang >4ft. Wide load signs and amber lights if required.", category: "Final Checks" },
  { id: "recheck_plan", label: "First 50-mile recheck planned", description: "Driver will re-inspect all securement within first 50 miles (49 CFR 392.9).", category: "Final Checks" },
];

export default function FlatbedSecurement() {
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
    toast.success(totalFail > 0 ? "Securement check submitted — issues noted" : "Flatbed securement inspection passed");
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
              {totalFail > 0 ? "Issues Found" : "Securement Passed"}
            </h2>
            <p className={cn("text-sm mt-2", isLight ? "text-slate-500" : "text-slate-400")}>
              {totalChecked - totalFail}/{CHECKLIST.length} passed · {totalFail} issues · Recheck at 50 miles
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
            Flatbed Securement
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Cargo securement inspection — 49 CFR 393 Subpart I
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", allChecked ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30")}>
          {totalChecked}/{CHECKLIST.length} Inspected
        </Badge>
      </div>

      {/* 50% Rule Reminder */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-amber-50 border-amber-300" : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="p-3 rounded-xl bg-amber-500/20 flex-shrink-0">
          <Lock className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-amber-800" : "text-amber-300")}>50% Working Load Limit Rule</p>
          <p className={cn("text-sm mt-1", isLight ? "text-amber-600" : "text-amber-400/80")}>
            The aggregate working load limit of all tie-downs must equal or exceed 50% of the cargo weight.
            Each tie-down must be individually rated — do not exceed rated WLL of any single device.
          </p>
        </div>
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
        {totalFail > 0 && <p className="text-xs text-red-500 font-medium mt-1.5">{totalFail} issue(s)</p>}
      </div>

      {categories.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Package className="w-4 h-4 text-[#1473FF]" /> {cat}
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
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Cargo weight, tie-down WLL calculations, commodity details..." className={cn("rounded-xl min-h-[80px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400")} />
        </CardContent>
      </Card>

      <Button className={cn("w-full h-12 rounded-xl text-base font-medium", allChecked ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-700/50 text-slate-500")} disabled={!allChecked} onClick={handleSubmit}>
        <Send className="w-5 h-5 mr-2" /> {allChecked ? "Submit Securement Inspection" : `Complete ${CHECKLIST.length - totalChecked} remaining items`}
      </Button>
    </div>
  );
}
