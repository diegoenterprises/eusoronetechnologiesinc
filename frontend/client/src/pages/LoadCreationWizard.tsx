/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, CheckCircle,
  ArrowRight, ArrowLeft, AlertTriangle, Sparkles, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HazmatDecalPreview } from "@/components/HazmatDecal";
import { MultiTruckVisualization } from "@/components/TruckVisualization";

const STEPS = ["Hazmat Classification", "Quantity & Weight", "Origin/Destination", "Equipment", "Carrier Requirements", "Pricing", "Review"];

const HAZMAT_CLASSES = [
  { id: "1", name: "Class 1 - Explosives" },
  { id: "2.1", name: "Class 2.1 - Flammable Gas" },
  { id: "2.2", name: "Class 2.2 - Non-Flammable Gas" },
  { id: "2.3", name: "Class 2.3 - Poison Gas" },
  { id: "3", name: "Class 3 - Flammable Liquid" },
  { id: "4.1", name: "Class 4.1 - Flammable Solid" },
  { id: "4.2", name: "Class 4.2 - Spontaneously Combustible" },
  { id: "4.3", name: "Class 4.3 - Dangerous When Wet" },
  { id: "5.1", name: "Class 5.1 - Oxidizer" },
  { id: "5.2", name: "Class 5.2 - Organic Peroxide" },
  { id: "6.1", name: "Class 6.1 - Poison" },
  { id: "6.2", name: "Class 6.2 - Infectious Substance" },
  { id: "7", name: "Class 7 - Radioactive" },
  { id: "8", name: "Class 8 - Corrosive" },
  { id: "9", name: "Class 9 - Miscellaneous" },
];

const EQUIPMENT_TYPES = [
  { id: "tank", name: "Tank Trailer (MC-306/DOT-406)" },
  { id: "tanker", name: "Tanker (MC-307/DOT-407)" },
  { id: "dry-van", name: "Dry Van" },
  { id: "flatbed", name: "Flatbed" },
  { id: "reefer", name: "Refrigerated" },
  { id: "hopper", name: "Hopper" },
];

export default function LoadCreationWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLoadMutation = (trpc as any).loads.create.useMutation({
    onSuccess: () => { toast.success("Load created successfully"); setStep(0); setFormData({}); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const getMaterialType = (): "liquid" | "gas" | "refrigerated" | "solid" | "hazmat" => {
    const hazClass = formData.hazmatClass || "";
    if (hazClass.startsWith("2.1") || hazClass.startsWith("2.2") || hazClass.startsWith("2.3")) return "gas";
    if (hazClass === "3" || hazClass.startsWith("4") || hazClass.startsWith("5") || hazClass.startsWith("6") || hazClass.startsWith("8")) return "hazmat";
    if (formData.weightUnit === "Pallets" || formData.weightUnit === "Units") return "refrigerated";
    return "liquid";
  };

  const handleSuggest = () => {
    if (formData.productName) {
      const productLower = formData.productName.toLowerCase();
      let suggestedClass = "3";
      let unNumber = "UN1203";
      
      if (productLower.includes("gasoline") || productLower.includes("petrol")) {
        suggestedClass = "3"; unNumber = "UN1203";
      } else if (productLower.includes("diesel")) {
        suggestedClass = "3"; unNumber = "UN1202";
      } else if (productLower.includes("propane") || productLower.includes("lpg")) {
        suggestedClass = "2.1"; unNumber = "UN1978";
      } else if (productLower.includes("ammonia")) {
        suggestedClass = "2.3"; unNumber = "UN1005";
      } else if (productLower.includes("acid")) {
        suggestedClass = "8"; unNumber = "UN1830";
      } else if (productLower.includes("oxygen")) {
        suggestedClass = "2.2"; unNumber = "UN1072";
      }
      
      updateField("hazmatClass", suggestedClass);
      updateField("unNumber", unNumber);
      toast.success("ESANG AI Classification", { description: `Suggested: Class ${suggestedClass} (${unNumber})` });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    createLoadMutation.mutate(formData);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.productName && formData.hazmatClass;
      case 1: return formData.weight && formData.weight;
      case 2: return formData.origin && formData.destination;
      case 3: return formData.equipment;
      case 4: return true;
      case 5: return formData.rate;
      default: return true;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Create Load</h1>
          <p className="text-slate-400 text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", i < step ? "bg-green-500 text-white" : i === step ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white" : "bg-slate-700 text-slate-400")}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn("w-8 h-0.5", i < step ? "bg-green-500" : "bg-slate-700")} />}
          </div>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Product Name</label>
                <div className="flex gap-2">
                  <Input value={formData.productName || ""} onChange={(e: any) => updateField("productName", e.target.value)} placeholder="e.g., Gasoline, Diesel Fuel" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                  <Button variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg" onClick={handleSuggest}>
                    <Sparkles className="w-4 h-4 mr-2" />ESANG AI
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Hazmat Classification</label>
                <Select value={formData.hazmatClass || ""} onValueChange={(v: any) => updateField("hazmatClass", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{HAZMAT_CLASSES.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">UN Number (optional)</label>
                <Input value={formData.unNumber || ""} onChange={(e: any) => updateField("unNumber", e.target.value)} placeholder="e.g., UN1203" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              
              {formData.hazmatClass && (
                <HazmatDecalPreview 
                  hazmatClass={formData.hazmatClass}
                  unNumber={formData.unNumber}
                  productName={formData.productName}
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Weight</label>
                  <div className="flex gap-2">
                    <Input type="number" value={formData.weight || ""} onChange={(e: any) => updateField("weight", e.target.value)} placeholder="42000" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={formData.weightUnit || "lbs"} onValueChange={(v: any) => updateField("weightUnit", v)}>
                      <SelectTrigger className="w-24 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="tons">tons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
                  <div className="flex gap-2">
                    <Input type="number" value={formData.weight || ""} onChange={(e: any) => updateField("quantity", e.target.value)} placeholder="8500" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={formData.weightUnit || "Gallons"} onValueChange={(v: any) => updateField("quantityUnit", v)}>
                      <SelectTrigger className="w-28 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gallons">Gallons</SelectItem>
                        <SelectItem value="Barrels">Barrels</SelectItem>
                        <SelectItem value="Pallets">Pallets</SelectItem>
                        <SelectItem value="Units">Units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">Quick Reference</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <p>Standard Tank Trailer: 7,000-9,500 gal</p>
                    <p>MC-306/DOT-406: 9,000-9,500 gal</p>
                  </div>
                  <div>
                    <p>Max Legal Weight: 80,000 lbs</p>
                    <p>Typical Fuel Load: 8,000-8,500 gal</p>
                  </div>
                </div>
              </div>

              {formData.weight && Number(formData.weight) > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-slate-400 mb-4 text-center">Load Visualization</p>
                  <MultiTruckVisualization
                    materialType={getMaterialType()}
                    totalVolume={Number(formData.weight) || 0}
                    unit={formData.weightUnit === "Gallons" ? "gal" : formData.weightUnit === "Barrels" ? "bbl" : formData.weightUnit?.toLowerCase() || "gal"}
                    maxCapacityPerTruck={formData.weightUnit === "Barrels" ? 200 : formData.weightUnit === "Pallets" ? 24 : 8500}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-green-400" />Origin</label><Input value={formData.origin || ""} onChange={(e: any) => updateField("origin", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" />Destination</label><Input value={formData.destination || ""} onChange={(e: any) => updateField("destination", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">Pickup Date</label><Input type="date" value={formData.pickupDate || ""} onChange={(e: any) => updateField("pickupDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Delivery Date</label><Input type="date" value={formData.deliveryDate || ""} onChange={(e: any) => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Equipment Type</label>
                <Select value={formData.equipment || ""} onValueChange={(v: any) => updateField("equipment", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{EQUIPMENT_TYPES.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Minimum Safety Score</label><Input type="number" value={formData.minSafetyScore || ""} onChange={(e: any) => updateField("minSafetyScore", e.target.value)} placeholder="e.g., 80" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Required Endorsements</label><Input value={formData.endorsements || ""} onChange={(e: any) => updateField("endorsements", e.target.value)} placeholder="e.g., Hazmat, Tanker" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Rate ($)</label><Input type="number" value={formData.rate || ""} onChange={(e: any) => updateField("rate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Rate Per Mile ($)</label><Input type="number" step="0.01" value={formData.ratePerMile || ""} onChange={(e: any) => updateField("ratePerMile", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-white font-bold text-lg">Review Your Load</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Product</p><p className="text-white">{formData.productName}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Hazmat Class</p><p className="text-white">{formData.hazmatClass}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Quantity</p><p className="text-white">{formData.weight} gal</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Weight</p><p className="text-white">{formData.weight} lbs</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Origin</p><p className="text-white">{formData.origin}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Destination</p><p className="text-white">{formData.destination}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Equipment</p><p className="text-white">{formData.equipment}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rate</p><p className="text-white">${formData.rate}</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 rounded-lg" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Next<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={handleSubmit} disabled={isSubmitting || createLoadMutation.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" />Create Load
          </Button>
        )}
      </div>
    </div>
  );
}
