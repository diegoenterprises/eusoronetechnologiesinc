/**
 * NRC REPORT PAGE
 * National Response Center hazmat incident reporting screen.
 * Guides drivers through the mandatory NRC phone report (49 CFR 171.15)
 * and prepares the information needed for the call. Also tracks
 * follow-up written report requirements (DOT 5800.1).
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Phone, AlertTriangle, CheckCircle, Clock, FileText,
  MapPin, Shield, ChevronRight, Copy, ExternalLink,
  Droplets, Users, Radio
} from "lucide-react";

const NRC_TRIGGERS = [
  "Death of a person",
  "Hospitalization of a person",
  "Estimated property damage > $50,000",
  "Evacuation of the general public",
  "Closure of a major transportation artery/facility for 1+ hour",
  "Fire, breakage, spillage, or suspected radioactive contamination",
  "Marine pollutant release exceeding reportable quantity",
  "Situation requiring public safety response (49 CFR 171.15(b))",
];

const CALL_CHECKLIST = [
  { id: "name", label: "Your name and callback number", placeholder: "Required" },
  { id: "company", label: "Carrier/company name and DOT number", placeholder: "Required" },
  { id: "datetime", label: "Date, time, and time zone of incident", placeholder: "Required" },
  { id: "location", label: "Location (road, mile marker, GPS, nearest city)", placeholder: "Required" },
  { id: "material", label: "Proper shipping name of material", placeholder: "e.g. Petroleum crude oil" },
  { id: "class", label: "Hazard class and UN/NA number", placeholder: "e.g. Class 3, UN1267" },
  { id: "quantity", label: "Estimated quantity released", placeholder: "e.g. 50 gallons" },
  { id: "injuries", label: "Number of injuries/fatalities", placeholder: "0" },
  { id: "environment", label: "Environmental impact (water, soil, air)", placeholder: "Describe" },
  { id: "actions", label: "Actions taken (containment, evacuation)", placeholder: "Describe" },
];

export default function NRCReport() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [callPrepared, setCallPrepared] = useState(false);

  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 1 }) || { data: [], isLoading: false };
  const currentLoad = Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length > 0 ? shipmentsQuery.data[0] : null;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const allChecked = CALL_CHECKLIST.every((item) => checkedItems.includes(item.id));

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            NRC Report
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            National Response Center — 49 CFR 171.15 mandatory reporting
          </p>
        </div>
        <a
          href="tel:18004248802"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-base transition-colors shadow-lg shadow-red-500/20"
        >
          <Phone className="w-5 h-5" />
          Call NRC: 1-800-424-8802
        </a>
      </div>

      {/* Emergency Banner */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="p-3 rounded-xl bg-red-500/20 flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-red-700" : "text-red-400")}>
            Mandatory Telephone Report
          </p>
          <p className={cn("text-sm mt-1", isLight ? "text-red-600" : "text-red-400/80")}>
            You must call the NRC at <strong>1-800-424-8802</strong> as soon as practical but no later than
            <strong> 12 hours</strong> after a reportable hazmat incident. Failure to report is a federal violation.
          </p>
        </div>
      </div>

      {/* When to Report */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <AlertTriangle className="w-5 h-5 text-red-500" />
            When Must You Report?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {NRC_TRIGGERS.map((trigger, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
            )}>
              <div className="w-6 h-6 rounded-md bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-red-500">{i + 1}</span>
              </div>
              <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-200")}>{trigger}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Call Preparation Checklist */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Phone className="w-5 h-5 text-[#1473FF]" />
              Call Preparation Checklist
            </CardTitle>
            <span className={cn("text-xs font-medium", isLight ? "text-slate-400" : "text-slate-500")}>
              {checkedItems.length}/{CALL_CHECKLIST.length} ready
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className={cn("text-sm mb-3", isLight ? "text-slate-500" : "text-slate-400")}>
            Gather this information before calling the NRC. Check off each item as you prepare it.
          </p>

          {/* Auto-fill from current load */}
          {currentLoad && (
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl mb-3",
              isLight ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20"
            )}>
              <Radio className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
              <p className={cn("text-xs", isLight ? "text-blue-700" : "text-blue-300")}>
                Active load data: #{currentLoad.loadNumber} — {currentLoad.commodityName || "Hazmat"} — Class {currentLoad.hazmatClass || "N/A"} — UN{currentLoad.unNumber || "N/A"}
              </p>
            </div>
          )}

          {CALL_CHECKLIST.map((item) => {
            const isChecked = checkedItems.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  isChecked
                    ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                    : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors",
                  isChecked ? "bg-green-500 border-green-500" : isLight ? "border-slate-300" : "border-slate-600"
                )}>
                  {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isChecked ? "text-green-600 line-through opacity-70" : isLight ? "text-slate-800" : "text-white"
                  )}>
                    {item.label}
                  </p>
                  <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{item.placeholder}</p>
                </div>
              </button>
            );
          })}

          <div className="pt-3">
            <a
              href="tel:18004248802"
              className={cn(
                "w-full flex items-center justify-center gap-2 h-12 rounded-xl text-base font-bold transition-all",
                allChecked
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : isLight
                    ? "bg-slate-100 text-slate-400 pointer-events-none"
                    : "bg-white/[0.04] text-slate-500 pointer-events-none"
              )}
            >
              <Phone className="w-5 h-5" />
              {allChecked ? "Call NRC Now: 1-800-424-8802" : "Complete checklist to enable call"}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Requirements */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <FileText className="w-5 h-5 text-[#BE01FF]" />
            Follow-Up Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn(
            "flex items-start gap-4 p-4 rounded-xl border",
            isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20"
          )}>
            <div className="p-2.5 rounded-lg bg-amber-500/15 flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className={cn("text-sm font-bold", isLight ? "text-amber-800" : "text-amber-300")}>
                DOT Form 5800.1 — Due Within 30 Days
              </p>
              <p className={cn("text-xs mt-1", isLight ? "text-amber-600" : "text-amber-400/80")}>
                A written Hazardous Materials Incident Report must be filed with PHMSA within 30 days.
                Your safety department will coordinate this filing. Keep all documentation from the incident.
              </p>
            </div>
          </div>

          <div className={cn(
            "flex items-start gap-4 p-4 rounded-xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
          )}>
            <div className="p-2.5 rounded-lg bg-blue-500/15 flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>Record Your NRC Report Number</p>
              <p className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                The NRC will give you a 6-digit report number. Write it down and provide it to your safety manager.
                This number is needed for the DOT 5800.1 written follow-up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
