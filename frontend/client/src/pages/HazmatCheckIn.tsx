/**
 * HAZMAT CHECK-IN PAGE
 * Driver-facing hazmat facility check-in screen.
 * Used at shipper/consignee facilities to confirm arrival,
 * verify documentation, PPE compliance, and complete
 * site-specific safety requirements before loading/unloading.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  CheckCircle, AlertTriangle, MapPin, Clock, Shield,
  FileText, Send, User, Truck, XCircle, Eye
} from "lucide-react";

type CheckInItem = { id: string; label: string; required: boolean };

const CHECKIN_ITEMS: CheckInItem[] = [
  { id: "arrival", label: "Arrived at facility — GPS confirmed", required: true },
  { id: "guard", label: "Checked in with guard/gate attendant", required: true },
  { id: "shipping_papers", label: "Shipping papers presented and verified", required: true },
  { id: "cdl_hazmat", label: "CDL with hazmat endorsement verified", required: true },
  { id: "ppe_hardhat", label: "Hard hat on", required: true },
  { id: "ppe_glasses", label: "Safety glasses on", required: true },
  { id: "ppe_vest", label: "High-visibility vest on", required: true },
  { id: "ppe_boots", label: "Steel-toe boots on", required: true },
  { id: "ppe_gloves", label: "Chemical-resistant gloves available", required: true },
  { id: "ppe_fr", label: "FR clothing (if required by site)", required: false },
  { id: "vehicle_inspect", label: "Vehicle pre-entry inspection completed", required: true },
  { id: "placards", label: "Placards correct and visible — all 4 sides", required: true },
  { id: "grounding", label: "Grounding cable accessible", required: true },
  { id: "spill_kit", label: "Spill kit on vehicle", required: true },
  { id: "fire_ext", label: "Fire extinguisher charged and accessible", required: true },
  { id: "site_orientation", label: "Site safety orientation acknowledged", required: false },
  { id: "no_phone", label: "Cell phone silenced / no use in hazmat zone", required: true },
  { id: "no_smoking", label: "No smoking — confirmed", required: true },
];

export default function HazmatCheckIn() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [facilityName, setFacilityName] = useState("");
  const [loadNumber, setLoadNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const requiredItems = CHECKIN_ITEMS.filter((i) => i.required);
  const allRequiredChecked = requiredItems.every((i) => checked.has(i.id));

  const handleSubmit = () => {
    if (!facilityName.trim()) { toast.error("Enter facility name"); return; }
    if (!allRequiredChecked) { toast.error("Complete all required check-in items"); return; }
    setSubmitted(true);
    toast.success("Hazmat check-in completed");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400");

  if (submitted) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[800px] mx-auto">
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="py-16 text-center">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center", isLight ? "bg-green-50" : "bg-green-500/10")}>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>Checked In</h2>
            <p className={cn("text-sm mt-2", isLight ? "text-slate-500" : "text-slate-400")}>
              {facilityName} · {checked.size}/{CHECKIN_ITEMS.length} items verified
            </p>
            <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
              {new Date().toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Hazmat Check-In
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Facility arrival verification and safety checklist
        </p>
      </div>

      {/* Facility info */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400")}>Facility Name</label><Input value={facilityName} onChange={(e: any) => setFacilityName(e.target.value)} placeholder="e.g. Permian Basin Terminal" className={inputCls} /></div>
            <div><label className={cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400")}>Load Number</label><Input value={loadNumber} onChange={(e: any) => setLoadNumber(e.target.value)} placeholder="LD-4521" className={inputCls} /></div>
          </div>
          <div className={cn("flex items-center gap-2 p-3 rounded-xl", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
            <Clock className="w-4 h-4 text-blue-500" />
            <p className={cn("text-sm", isLight ? "text-blue-700" : "text-blue-300")}>
              Arrival: {new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className={cn("p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-800/50")}>
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Check-In Progress</p>
          <p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{checked.size}/{CHECKIN_ITEMS.length}</p>
        </div>
        <div className={cn("h-2.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
          <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${(checked.size / CHECKIN_ITEMS.length) * 100}%` }} />
        </div>
      </div>

      {/* Checklist */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Shield className="w-4 h-4 text-[#1473FF]" /> Safety Check-In Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKIN_ITEMS.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  isChecked
                    ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                    : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors",
                  isChecked ? "bg-green-500 border-green-500" : isLight ? "border-slate-300" : "border-slate-600"
                )}>
                  {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <p className={cn("text-sm", isChecked ? "text-green-600" : isLight ? "text-slate-700" : "text-slate-200")}>{item.label}</p>
                {item.required && !isChecked && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[8px] ml-auto">Required</Badge>}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className={cn(
          "w-full h-12 rounded-xl text-base font-medium",
          allRequiredChecked && facilityName.trim()
            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20"
            : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-700/50 text-slate-500"
        )}
        disabled={!allRequiredChecked || !facilityName.trim()}
        onClick={handleSubmit}
      >
        <Send className="w-5 h-5 mr-2" /> Complete Check-In
      </Button>
    </div>
  );
}
