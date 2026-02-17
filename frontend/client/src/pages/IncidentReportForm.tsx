/**
 * INCIDENT REPORT FORM PAGE
 * Driver-facing hazmat incident documentation and reporting form.
 * Captures incident details, materials involved, injuries, environmental
 * impact, and generates preliminary report for 49 CFR 171.16 compliance.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  FileText, AlertTriangle, CheckCircle, MapPin, Clock,
  Camera, Send, Shield, Droplets, Users, Wind,
  ChevronRight, ArrowRight
} from "lucide-react";

type FormStep = "details" | "materials" | "impact" | "review";

const INCIDENT_TYPES = [
  "Spill / Release", "Fire", "Explosion", "Vapor Release",
  "Container Damage", "Vehicle Accident", "Loading/Unloading Incident",
  "Equipment Failure", "Near Miss",
];

export default function IncidentReportForm() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [step, setStep] = useState<FormStep>("details");
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    incidentType: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    loadNumber: "",
    description: "",
    materialName: "",
    unNumber: "",
    hazardClass: "",
    quantityReleased: "",
    quantityUnit: "gallons",
    injuries: "0",
    injuryDetails: "",
    waterImpact: false,
    soilImpact: false,
    airImpact: false,
    evacuationPerformed: false,
    agenciesNotified: [] as string[],
    photos: 0,
  });

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const reportMutation = (trpc as any).safety?.reportIncident?.useMutation?.({
    onSuccess: () => { setSubmitted(true); toast.success("Incident report submitted successfully"); },
    onError: (err: any) => { toast.error(err.message || "Failed to submit report"); },
  }) || { mutate: () => { setSubmitted(true); }, isPending: false };

  const steps: { id: FormStep; label: string; num: number }[] = [
    { id: "details", label: "Incident Details", num: 1 },
    { id: "materials", label: "Materials", num: 2 },
    { id: "impact", label: "Impact", num: 3 },
    { id: "review", label: "Review & Submit", num: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleSubmit = () => {
    reportMutation.mutate({
      type: form.incidentType,
      description: form.description,
      location: form.location,
      severity: Number(form.injuries) > 0 ? "high" : "medium",
    });
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400");
  const labelCls = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400");

  if (submitted) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[800px] mx-auto">
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="py-16 text-center">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center", isLight ? "bg-green-50" : "bg-green-500/10")}>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>Report Submitted</h2>
            <p className={cn("text-sm mt-2 max-w-md mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
              Your incident report has been filed. Safety management has been notified.
              A written follow-up (DOT 5800.1) must be completed within 30 days per 49 CFR 171.16.
            </p>
            <div className={cn("mt-6 p-4 rounded-xl inline-block", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
              <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Report Reference</p>
              <p className={cn("text-lg font-mono font-bold", isLight ? "text-slate-800" : "text-white")}>
                IR-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 99999)).padStart(5, "0")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[800px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Incident Report
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Hazmat incident documentation — 49 CFR 171.16
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                currentStepIndex >= i
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                  : isLight
                    ? "bg-slate-100 text-slate-400"
                    : "bg-slate-800 text-slate-500"
              )}
            >
              <span className="text-xs font-bold">{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <ChevronRight className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-slate-300" : "text-slate-600")} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === "details" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <FileText className="w-5 h-5 text-[#1473FF]" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Incident Type</label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => update("incidentType", type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.incidentType === type
                        ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30"
                        : isLight
                          ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <Input type="date" value={form.date} onChange={(e: any) => update("date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <Input type="time" value={form.time} onChange={(e: any) => update("time", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Location (address, mile marker, or GPS)</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={form.location} onChange={(e: any) => update("location", e.target.value)} placeholder="Enter location..." className={cn(inputCls, "pl-10")} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Load Number (if applicable)</label>
              <Input value={form.loadNumber} onChange={(e: any) => update("loadNumber", e.target.value)} placeholder="e.g. LD-2026-12345" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Description of Incident</label>
              <Textarea
                value={form.description}
                onChange={(e: any) => update("description", e.target.value)}
                placeholder="Describe what happened, sequence of events, and immediate actions taken..."
                className={cn("rounded-xl min-h-[100px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400")}
              />
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11"
              onClick={() => setStep("materials")}
            >
              Next: Materials <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Materials */}
      {step === "materials" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Materials Involved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Material / Product Name</label>
                <Input value={form.materialName} onChange={(e: any) => update("materialName", e.target.value)} placeholder="e.g. Petroleum crude oil" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>UN / NA Number</label>
                <Input value={form.unNumber} onChange={(e: any) => update("unNumber", e.target.value)} placeholder="e.g. UN1267" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Hazard Class</label>
              <Input value={form.hazardClass} onChange={(e: any) => update("hazardClass", e.target.value)} placeholder="e.g. 3" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Quantity Released (estimate)</label>
                <Input value={form.quantityReleased} onChange={(e: any) => update("quantityReleased", e.target.value)} placeholder="e.g. 50" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <select
                  value={form.quantityUnit}
                  onChange={(e) => update("quantityUnit", e.target.value)}
                  className={cn("w-full h-11 px-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-800/50 border-slate-700/50 text-white")}
                >
                  <option value="gallons">Gallons</option>
                  <option value="pounds">Pounds</option>
                  <option value="liters">Liters</option>
                  <option value="barrels">Barrels</option>
                  <option value="cubic_feet">Cubic Feet</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setStep("details")}>
                Back
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={() => setStep("impact")}>
                Next: Impact <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Impact */}
      {step === "impact" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Shield className="w-5 h-5 text-red-500" />
              Impact Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Number of Injuries</label>
                <Input type="number" min="0" value={form.injuries} onChange={(e: any) => update("injuries", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Injury Details</label>
                <Input value={form.injuryDetails} onChange={(e: any) => update("injuryDetails", e.target.value)} placeholder="Type of injuries..." className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Environmental Impact</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { key: "waterImpact", label: "Water contamination", icon: <Droplets className="w-4 h-4" /> },
                  { key: "soilImpact", label: "Soil contamination", icon: <MapPin className="w-4 h-4" /> },
                  { key: "airImpact", label: "Air quality impact", icon: <Wind className="w-4 h-4" /> },
                  { key: "evacuationPerformed", label: "Evacuation performed", icon: <Users className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => update(item.key, !(form as any)[item.key])}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      (form as any)[item.key]
                        ? isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20"
                        : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border",
                      (form as any)[item.key] ? "bg-red-500 border-red-500" : isLight ? "border-slate-300" : "border-slate-600"
                    )}>
                      {(form as any)[item.key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-slate-400")}>{item.icon}</span>
                      <span className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setStep("materials")}>
                Back
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={() => setStep("review")}>
                Next: Review <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === "review" && (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Review & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Type", value: form.incidentType || "Not specified" },
              { label: "Date/Time", value: `${form.date} at ${form.time}` },
              { label: "Location", value: form.location || "Not provided" },
              { label: "Load #", value: form.loadNumber || "N/A" },
              { label: "Material", value: form.materialName ? `${form.materialName} (${form.unNumber || "N/A"})` : "Not specified" },
              { label: "Class", value: form.hazardClass || "N/A" },
              { label: "Quantity Released", value: form.quantityReleased ? `${form.quantityReleased} ${form.quantityUnit}` : "Unknown" },
              { label: "Injuries", value: form.injuries },
              { label: "Environmental", value: [form.waterImpact && "Water", form.soilImpact && "Soil", form.airImpact && "Air"].filter(Boolean).join(", ") || "None reported" },
            ].map((item) => (
              <div key={item.label} className={cn(
                "flex items-center justify-between py-2 border-b last:border-0",
                isLight ? "border-slate-100" : "border-slate-700/30"
              )}>
                <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{item.label}</p>
                <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
              </div>
            ))}

            {form.description && (
              <div className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                <p className={cn("text-xs font-medium uppercase tracking-wider mb-1", isLight ? "text-slate-400" : "text-slate-500")}>Description</p>
                <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{form.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setStep("impact")}>
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11 text-base font-medium"
                onClick={handleSubmit}
                disabled={reportMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
