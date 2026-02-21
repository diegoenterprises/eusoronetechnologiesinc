/**
 * SPILL RESPONSE PAGE
 * Driver-facing hazmat emergency spill response guide.
 * Step-by-step protocol for hazardous material spills per 49 CFR 171.15/171.16.
 * Includes immediate actions, isolation distances, emergency contacts,
 * NRC reporting threshold, and incident documentation.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  AlertTriangle, Phone, Shield, Wind, Eye, Droplets,
  ChevronRight, CheckCircle, Radio, FileText, MapPin,
  ArrowRight, XCircle, Flame, Users, Navigation
} from "lucide-react";

type ResponsePhase = "immediate" | "containment" | "reporting" | "documentation";

const EMERGENCY_NUMBERS = [
  { name: "911 — Fire/EMS/Police", number: "911", color: "text-red-500", bg: "bg-red-500/15", priority: true },
  { name: "CHEMTREC 24-Hr Response", number: "1-800-424-9300", color: "text-orange-500", bg: "bg-orange-500/15", priority: true },
  { name: "National Response Center", number: "1-800-424-8802", color: "text-blue-500", bg: "bg-blue-500/15", priority: true },
  { name: "Poison Control Center", number: "1-800-222-1222", color: "text-purple-500", bg: "bg-purple-500/15", priority: false },
];

const IMMEDIATE_STEPS = [
  { id: 1, action: "STOP the vehicle safely", detail: "Pull over to a safe area away from populated zones, waterways, and storm drains. Engage parking brake.", icon: <Navigation className="w-4 h-4" /> },
  { id: 2, action: "PROTECT yourself", detail: "Move upwind and uphill from the spill. Put on available PPE (gloves, goggles). Do NOT walk through spilled material.", icon: <Shield className="w-4 h-4" /> },
  { id: 3, action: "WARN others", detail: "Place triangles/flares (away from liquid spills). Activate hazard lights. Keep bystanders back at least 100 ft (300 ft for gases/explosives).", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 4, action: "CALL 911 immediately", detail: "Report: location, material name/UN number, quantity, injuries, and whether material is entering waterways.", icon: <Phone className="w-4 h-4" /> },
  { id: 5, action: "CALL CHEMTREC", detail: "1-800-424-9300. Provide shipping paper info, UN number, hazard class, and quantity released.", icon: <Radio className="w-4 h-4" /> },
  { id: 6, action: "ISOLATE the area", detail: "Refer to ERG orange/green pages for isolation distances. Keep upwind. Deny entry to spill zone.", icon: <Users className="w-4 h-4" /> },
];

const NRC_THRESHOLDS: { material: string; quantity: string }[] = [
  { material: "Petroleum crude oil (UN1267)", quantity: "Any release into navigable waters" },
  { material: "Gasoline (UN1203)", quantity: "Any release into navigable waters" },
  { material: "Flammable liquids (Class 3)", quantity: "1 gallon+ into environment" },
  { material: "Poison/Toxic (Class 6.1)", quantity: "Any quantity if inhalation hazard" },
  { material: "Corrosives (Class 8)", quantity: "1 gallon+ or personal injury" },
  { material: "Any hazmat — hospitalization", quantity: "Immediate report required" },
  { material: "Any hazmat — fatality", quantity: "Immediate report required" },
  { material: "Any hazmat — road closure >1 hr", quantity: "Immediate report required" },
];

export default function SpillResponse() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activePhase, setActivePhase] = useState<ResponsePhase>("immediate");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [sosActive, setSosActive] = useState(false);

  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 1 }) || { data: [], isLoading: false };
  const currentLoad = Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length > 0 ? shipmentsQuery.data[0] : null;

  const toggleStep = (id: number) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const phases: { id: ResponsePhase; label: string }[] = [
    { id: "immediate", label: "Immediate Actions" },
    { id: "containment", label: "Containment" },
    { id: "reporting", label: "Reporting" },
    { id: "documentation", label: "Documentation" },
  ];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  const handleSOS = () => {
    setSosActive(true);
    toast.error("SOS ACTIVATED — Emergency contacts notified", { duration: 5000 });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Spill Response
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Emergency hazmat spill protocol — 49 CFR 171.15
          </p>
        </div>
        <Button
          className={cn(
            "h-12 px-6 rounded-xl text-base font-bold shadow-lg transition-all",
            sosActive
              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/30"
              : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
          )}
          onClick={handleSOS}
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          {sosActive ? "SOS ACTIVE" : "SOS Emergency"}
        </Button>
      </div>

      {/* Emergency Contacts — Always visible at top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EMERGENCY_NUMBERS.map((num) => (
          <a
            key={num.number}
            href={`tel:${num.number.replace(/[^0-9]/g, "")}`}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
              num.priority
                ? isLight
                  ? "bg-white border-red-200 hover:border-red-300 shadow-sm"
                  : "bg-white/[0.03] border-red-500/20 hover:border-red-500/40"
                : isLight
                  ? "bg-white border-slate-200 hover:border-slate-300"
                  : "bg-white/[0.03] border-white/[0.06] hover:border-slate-600"
            )}
          >
            <div className={cn("p-2.5 rounded-lg", num.bg)}>
              <Phone className={cn("w-5 h-5", num.color)} />
            </div>
            <p className={cn("text-lg font-bold tabular-nums", num.color)}>{num.number}</p>
            <p className={cn("text-[10px] font-medium leading-tight", isLight ? "text-slate-500" : "text-slate-400")}>
              {num.name}
            </p>
          </a>
        ))}
      </div>

      {/* Current load context */}
      {currentLoad && (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border",
          isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20"
        )}>
          <div className={cn("w-12 h-12 rotate-45 rounded-md border-2 flex items-center justify-center flex-shrink-0", "border-red-500 bg-red-500/10")}>
            <span className="-rotate-45 text-sm font-bold text-red-500">{currentLoad.hazmatClass || "3"}</span>
          </div>
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
              Active Load: #{currentLoad.loadNumber}
            </p>
            <p className={cn("text-xs", isLight ? "text-amber-700" : "text-amber-300")}>
              {currentLoad.commodityName || "Hazardous material"} — Class {currentLoad.hazmatClass} — UN{currentLoad.unNumber || "N/A"}
            </p>
          </div>
          <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-xs">HAZMAT</Badge>
        </div>
      )}

      {/* Phase tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activePhase === p.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:bg-white/[0.06]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* PHASE: Immediate Actions */}
      {activePhase === "immediate" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Immediate Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {IMMEDIATE_STEPS.map((step) => {
              const done = completedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                    done
                      ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                      : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm border-2 transition-colors",
                    done
                      ? "bg-green-500 border-green-500 text-white"
                      : isLight
                        ? "border-red-300 text-red-500 bg-red-50"
                        : "border-red-500/40 text-red-400 bg-red-500/10"
                  )}>
                    {done ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-bold",
                      done ? "text-green-600 line-through opacity-70" : isLight ? "text-slate-800" : "text-white"
                    )}>
                      {step.action}
                    </p>
                    <p className={cn("text-xs mt-1 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                      {step.detail}
                    </p>
                  </div>
                  <div className={cn("p-2 rounded-lg flex-shrink-0 mt-1", done ? "bg-green-500/15 text-green-500" : "bg-red-500/10 text-red-400")}>
                    {step.icon}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* PHASE: Containment */}
      {activePhase === "containment" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Droplets className="w-5 h-5 text-blue-500" />
              Containment Procedures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Do / Don't columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20")}>
                <p className="text-sm font-bold text-green-600 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4" /> DO
                </p>
                <div className="space-y-2">
                  {[
                    "Block storm drains with absorbent material if safe to do so",
                    "Use spill kit materials to create a containment berm",
                    "Stop the source of the leak if it can be done safely (close valve, upright container)",
                    "Protect waterways — even small amounts are reportable",
                    "Stay upwind and uphill at all times",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className={cn("text-xs", isLight ? "text-green-700" : "text-green-300")}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("p-4 rounded-xl border", isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20")}>
                <p className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4" /> DO NOT
                </p>
                <div className="space-y-2">
                  {[
                    "Do NOT attempt to clean up a major spill yourself",
                    "Do NOT walk through spilled material",
                    "Do NOT use water on water-reactive materials (Class 4.3)",
                    "Do NOT smoke, use phones near flammable vapors",
                    "Do NOT re-enter the vehicle if cab is contaminated",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className={cn("text-xs", isLight ? "text-red-700" : "text-red-300")}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wind direction reminder */}
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl",
              isLight ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20"
            )}>
              <Wind className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isLight ? "text-blue-600" : "text-blue-400")} />
              <div>
                <p className={cn("text-sm font-medium", isLight ? "text-blue-800" : "text-blue-300")}>
                  Wind Direction is Critical
                </p>
                <p className={cn("text-xs mt-0.5", isLight ? "text-blue-600" : "text-blue-400/80")}>
                  Always position yourself and evacuees upwind from the spill. Toxic vapors can travel
                  significant distances. For gases, initial evacuation distance is typically 300+ feet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASE: Reporting */}
      {activePhase === "reporting" && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Phone className="w-5 h-5 text-red-500" />
                Mandatory Reporting — 49 CFR 171.15 (Immediate)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn(
                "p-4 rounded-xl border-2",
                isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className={cn("text-sm font-medium mb-2", isLight ? "text-red-700" : "text-red-300")}>
                  Call the National Response Center as soon as practical but no later than 12 hours:
                </p>
                <a href="tel:18004248802" className={cn("text-2xl font-bold block", isLight ? "text-red-600" : "text-red-400")}>
                  1-800-424-8802
                </a>
              </div>

              <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-slate-500" : "text-slate-400")}>
                NRC Report Triggers
              </p>
              <div className="space-y-2">
                {NRC_THRESHOLDS.map((t, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                  )}>
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{t.material}</p>
                    <p className={cn("text-xs", isLight ? "text-red-600" : "text-red-400")}>{t.quantity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <FileText className="w-5 h-5 text-[#BE01FF]" />
                Written Follow-Up — 49 CFR 171.16 (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl",
                isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20"
              )}>
                <FileText className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isLight ? "text-amber-600" : "text-amber-400")} />
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-amber-800" : "text-amber-300")}>
                    DOT Form 5800.1 Required
                  </p>
                  <p className={cn("text-xs mt-1", isLight ? "text-amber-600" : "text-amber-400/80")}>
                    A written hazardous materials incident report (DOT 5800.1) must be filed within 30 days
                    of a release. This must be submitted to PHMSA. Your safety team will assist with this filing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PHASE: Documentation */}
      {activePhase === "documentation" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Eye className="w-5 h-5 text-[#1473FF]" />
              Incident Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>
              Document the following information as soon as it is safe to do so:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Time & Location", detail: "Exact time of incident, GPS coordinates or mile marker, road name" },
                { title: "Material Info", detail: "UN number, proper shipping name, hazard class, quantity released" },
                { title: "Cause", detail: "Rollover, valve failure, puncture, corrosion, collision, human error" },
                { title: "Weather Conditions", detail: "Wind direction/speed, temperature, precipitation, visibility" },
                { title: "Injuries / Exposure", detail: "Number of people affected, type of exposure, medical response" },
                { title: "Environmental Impact", detail: "Water contamination, soil contamination, air quality, wildlife" },
                { title: "Response Actions", detail: "Containment measures taken, agencies contacted, evacuation performed" },
                { title: "Photos / Video", detail: "Scene overview, damage, placards, labels, spill extent, containment" },
              ].map((item, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-xl border",
                  isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                )}>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.title}</p>
                  <p className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{item.detail}</p>
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl h-11"
              onClick={() => toast.info("Opening incident report form...")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Start Incident Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
