/**
 * DOT 5800 FORM PAGE
 * Digital version of DOT Form 5800.1 — Hazardous Materials Incident Report.
 * Required within 30 days of a reportable hazmat incident per 49 CFR 171.16.
 * Multi-section form capturing incident, material, packaging, carrier,
 * and consequence details for PHMSA submission.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  FileText, AlertTriangle, CheckCircle, Clock, Send,
  ChevronRight, ArrowRight, Shield, Package, Truck,
  MapPin, Calendar, Users
} from "lucide-react";

type FormSection = "incident" | "material" | "packaging" | "carrier" | "consequences" | "review";

const SECTIONS: { id: FormSection; label: string; num: number }[] = [
  { id: "incident", label: "Incident", num: 1 },
  { id: "material", label: "Material", num: 2 },
  { id: "packaging", label: "Packaging", num: 3 },
  { id: "carrier", label: "Carrier", num: 4 },
  { id: "consequences", label: "Consequences", num: 5 },
  { id: "review", label: "Review", num: 6 },
];

export default function DOT5800Form() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [section, setSection] = useState<FormSection>("incident");
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    nrcReportNumber: "",
    incidentDate: "",
    incidentTime: "",
    incidentLocation: "",
    incidentCity: "",
    incidentState: "",
    incidentType: "",
    materialName: "",
    hazardClass: "",
    unNumber: "",
    packingGroup: "",
    quantityReleased: "",
    quantityUnit: "gallons",
    totalQuantityInPackage: "",
    packagingType: "",
    packagingSpec: "",
    packagingManufacturer: "",
    packagingFailureType: "",
    carrierName: "",
    carrierDOT: "",
    carrierMC: "",
    vehicleType: "",
    vehiclePlate: "",
    deaths: "0",
    majorInjuries: "0",
    minorInjuries: "0",
    propertyDamage: "",
    evacuationPerformed: "no",
    evacueeCount: "0",
    waterContamination: "no",
    description: "",
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const currentIdx = SECTIONS.findIndex((s) => s.id === section);

  const next = () => {
    if (currentIdx < SECTIONS.length - 1) setSection(SECTIONS[currentIdx + 1].id);
  };
  const prev = () => {
    if (currentIdx > 0) setSection(SECTIONS[currentIdx - 1].id);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("DOT 5800.1 form submitted to safety management");
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
            <h2 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>Form 5800.1 Submitted</h2>
            <p className={cn("text-sm mt-2 max-w-md mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
              Your written hazmat incident report has been submitted to safety management for
              review and PHMSA filing. Retain a copy for your records.
            </p>
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
          DOT Form 5800.1
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Hazardous Materials Incident Report — 49 CFR 171.16
        </p>
      </div>

      {/* Deadline warning */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl",
        isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20"
      )}>
        <Clock className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isLight ? "text-amber-600" : "text-amber-400")} />
        <div>
          <p className={cn("text-sm font-bold", isLight ? "text-amber-800" : "text-amber-300")}>
            Due Within 30 Days of Incident
          </p>
          <p className={cn("text-xs mt-0.5", isLight ? "text-amber-600" : "text-amber-400/80")}>
            This written report must be filed with PHMSA. Late submissions may result in civil penalties.
          </p>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                currentIdx >= i
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                  : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
              )}
            >
              <span className="font-bold">{s.num}</span> {s.label}
            </button>
            {i < SECTIONS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Section 1: Incident */}
      {section === "incident" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <MapPin className="w-5 h-5 text-[#1473FF]" /> Section 1: Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><label className={labelCls}>NRC Report Number</label><Input value={form.nrcReportNumber} onChange={(e: any) => update("nrcReportNumber", e.target.value)} placeholder="6-digit NRC number" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Date of Incident</label><DatePicker value={form.incidentDate} onChange={(v) => update("incidentDate", v)} /></div>
              <div><label className={labelCls}>Time of Incident</label><Input type="time" value={form.incidentTime} onChange={(e: any) => update("incidentTime", e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Location (address/mile marker)</label><Input value={form.incidentLocation} onChange={(e: any) => update("incidentLocation", e.target.value)} placeholder="Street address or mile marker" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>City</label><Input value={form.incidentCity} onChange={(e: any) => update("incidentCity", e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>State</label><Input value={form.incidentState} onChange={(e: any) => update("incidentState", e.target.value)} placeholder="TX" className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Type of Incident</label>
              <div className="flex flex-wrap gap-2">
                {["Spill/Release", "Fire", "Explosion", "Gas Dispersion", "Vehicle Accident", "Loading/Unloading", "In-Transit"].map((t) => (
                  <button key={t} onClick={() => update("incidentType", t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", form.incidentType === t ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30" : isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-800/50 border-slate-700/50 text-slate-400")}>{t}</button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={next}>Next: Material <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </CardContent>
        </Card>
      )}

      {/* Section 2: Material */}
      {section === "material" && (
        <Card className={cc}>
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><AlertTriangle className="w-5 h-5 text-orange-500" /> Section 2: Hazardous Material</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className={labelCls}>Proper Shipping Name</label><Input value={form.materialName} onChange={(e: any) => update("materialName", e.target.value)} placeholder="e.g. Petroleum crude oil" className={inputCls} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Hazard Class</label><Input value={form.hazardClass} onChange={(e: any) => update("hazardClass", e.target.value)} placeholder="3" className={inputCls} /></div>
              <div><label className={labelCls}>UN/NA Number</label><Input value={form.unNumber} onChange={(e: any) => update("unNumber", e.target.value)} placeholder="UN1267" className={inputCls} /></div>
              <div><label className={labelCls}>Packing Group</label><Input value={form.packingGroup} onChange={(e: any) => update("packingGroup", e.target.value)} placeholder="II" className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Quantity Released</label><Input value={form.quantityReleased} onChange={(e: any) => update("quantityReleased", e.target.value)} placeholder="50" className={inputCls} /></div>
              <div><label className={labelCls}>Unit</label><select value={form.quantityUnit} onChange={(e) => update("quantityUnit", e.target.value)} className={cn("w-full h-11 px-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white")}><option value="gallons">Gallons</option><option value="pounds">Pounds</option><option value="liters">Liters</option><option value="barrels">Barrels</option></select></div>
            </div>
            <div className="flex gap-3"><Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={prev}>Back</Button><Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={next}>Next: Packaging <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Packaging */}
      {section === "packaging" && (
        <Card className={cc}>
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Package className="w-5 h-5 text-purple-500" /> Section 3: Packaging</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className={labelCls}>Packaging Type</label><Input value={form.packagingType} onChange={(e: any) => update("packagingType", e.target.value)} placeholder="e.g. MC-306 Cargo Tank, Drum, Cylinder" className={inputCls} /></div>
            <div><label className={labelCls}>Specification / DOT Marking</label><Input value={form.packagingSpec} onChange={(e: any) => update("packagingSpec", e.target.value)} placeholder="e.g. DOT-406, UN 1A1" className={inputCls} /></div>
            <div><label className={labelCls}>Package Manufacturer</label><Input value={form.packagingManufacturer} onChange={(e: any) => update("packagingManufacturer", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Type of Failure</label>
              <div className="flex flex-wrap gap-2">
                {["Valve/Fitting Leak", "Body/Shell Puncture", "Weld Failure", "Corrosion", "Dropped/Fell", "Overturn", "Other"].map((t) => (
                  <button key={t} onClick={() => update("packagingFailureType", t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", form.packagingFailureType === t ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30" : isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-800/50 border-slate-700/50 text-slate-400")}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3"><Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={prev}>Back</Button><Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={next}>Next: Carrier <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Carrier */}
      {section === "carrier" && (
        <Card className={cc}>
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Truck className="w-5 h-5 text-blue-500" /> Section 4: Carrier Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className={labelCls}>Carrier Name</label><Input value={form.carrierName} onChange={(e: any) => update("carrierName", e.target.value)} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>USDOT Number</label><Input value={form.carrierDOT} onChange={(e: any) => update("carrierDOT", e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>MC Number</label><Input value={form.carrierMC} onChange={(e: any) => update("carrierMC", e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Vehicle Type</label><Input value={form.vehicleType} onChange={(e: any) => update("vehicleType", e.target.value)} placeholder="e.g. Tractor-Trailer" className={inputCls} /></div>
              <div><label className={labelCls}>License Plate</label><Input value={form.vehiclePlate} onChange={(e: any) => update("vehiclePlate", e.target.value)} className={inputCls} /></div>
            </div>
            <div className="flex gap-3"><Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={prev}>Back</Button><Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={next}>Next: Consequences <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Consequences */}
      {section === "consequences" && (
        <Card className={cc}>
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Users className="w-5 h-5 text-red-500" /> Section 5: Consequences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Deaths</label><Input type="number" min="0" value={form.deaths} onChange={(e: any) => update("deaths", e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Major Injuries</label><Input type="number" min="0" value={form.majorInjuries} onChange={(e: any) => update("majorInjuries", e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Minor Injuries</label><Input type="number" min="0" value={form.minorInjuries} onChange={(e: any) => update("minorInjuries", e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Est. Property Damage ($)</label><Input value={form.propertyDamage} onChange={(e: any) => update("propertyDamage", e.target.value)} placeholder="50000" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Evacuation?</label><select value={form.evacuationPerformed} onChange={(e) => update("evacuationPerformed", e.target.value)} className={cn("w-full h-11 px-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white")}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div><label className={labelCls}>People Evacuated</label><Input type="number" min="0" value={form.evacueeCount} onChange={(e: any) => update("evacueeCount", e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Water Contamination?</label><select value={form.waterContamination} onChange={(e) => update("waterContamination", e.target.value)} className={cn("w-full h-11 px-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white")}><option value="no">No</option><option value="yes">Yes</option></select></div>
            <div><label className={labelCls}>Description of Events</label><Textarea value={form.description} onChange={(e: any) => update("description", e.target.value)} placeholder="Describe the sequence of events, root cause, and corrective actions..." className={cn("rounded-xl min-h-[100px]", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400")} /></div>
            <div className="flex gap-3"><Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={prev}>Back</Button><Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11" onClick={next}>Review <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: Review */}
      {section === "review" && (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
          <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><CheckCircle className="w-5 h-5 text-green-500" /> Review & Submit</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { l: "NRC #", v: form.nrcReportNumber || "N/A" },
              { l: "Date/Time", v: `${form.incidentDate} ${form.incidentTime}` },
              { l: "Location", v: `${form.incidentLocation}, ${form.incidentCity}, ${form.incidentState}` },
              { l: "Type", v: form.incidentType || "N/A" },
              { l: "Material", v: `${form.materialName} (${form.unNumber})` },
              { l: "Class / PG", v: `Class ${form.hazardClass} / PG ${form.packingGroup}` },
              { l: "Quantity", v: `${form.quantityReleased} ${form.quantityUnit}` },
              { l: "Carrier", v: `${form.carrierName} (DOT ${form.carrierDOT})` },
              { l: "Deaths/Injuries", v: `${form.deaths} deaths, ${form.majorInjuries} major, ${form.minorInjuries} minor` },
              { l: "Damage", v: form.propertyDamage ? `$${Number(form.propertyDamage).toLocaleString()}` : "N/A" },
            ].map((r) => (
              <div key={r.l} className={cn("flex items-center justify-between py-2 border-b last:border-0", isLight ? "border-slate-100" : "border-slate-700/30")}>
                <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{r.l}</p>
                <p className={cn("text-sm font-medium text-right", isLight ? "text-slate-800" : "text-white")}>{r.v}</p>
              </div>
            ))}
            <div className="flex gap-3 pt-3">
              <Button variant="outline" className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={prev}>Back</Button>
              <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11 text-base font-medium" onClick={handleSubmit}>
                <Send className="w-4 h-4 mr-2" /> Submit Form 5800.1
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
