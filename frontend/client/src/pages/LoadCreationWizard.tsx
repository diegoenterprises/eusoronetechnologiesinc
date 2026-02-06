/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useCallback } from "react";
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

const PRODUCT_DB: { keywords: string[]; unNumber: string; name: string; hazmatClass: string }[] = [
  { keywords: ["gasoline", "petrol", "motor fuel", "unleaded", "premium", "regular", "rbob", "motor spirit"], unNumber: "UN1203", name: "Gasoline / Motor Fuel", hazmatClass: "3" },
  { keywords: ["diesel", "ulsd", "gas oil", "heating oil", "diesel fuel", "no. 2 fuel"], unNumber: "UN1202", name: "Diesel Fuel", hazmatClass: "3" },
  { keywords: ["crude oil", "crude petroleum", "wti", "brent", "sweet crude", "light crude", "heavy crude", "condensate", "petroleum crude"], unNumber: "UN1267", name: "Petroleum Crude Oil", hazmatClass: "3" },
  { keywords: ["sour crude", "h2s crude"], unNumber: "UN3494", name: "Petroleum Sour Crude Oil", hazmatClass: "3" },
  { keywords: ["kerosene", "jet fuel", "jet a", "jet a-1", "jp-8", "jp-5"], unNumber: "UN1223", name: "Kerosene / Jet Fuel", hazmatClass: "3" },
  { keywords: ["aviation fuel", "turbine fuel"], unNumber: "UN1863", name: "Fuel, Aviation", hazmatClass: "3" },
  { keywords: ["naphtha", "petroleum naphtha"], unNumber: "UN1256", name: "Naphtha, Petroleum", hazmatClass: "3" },
  { keywords: ["propane", "lp-gas"], unNumber: "UN1978", name: "Propane", hazmatClass: "2.1" },
  { keywords: ["lpg", "liquefied petroleum gas"], unNumber: "UN1075", name: "Liquefied Petroleum Gas", hazmatClass: "2.1" },
  { keywords: ["butane", "n-butane"], unNumber: "UN1011", name: "Butane", hazmatClass: "2.1" },
  { keywords: ["isobutane"], unNumber: "UN1969", name: "Isobutane", hazmatClass: "2.1" },
  { keywords: ["natural gas", "cng", "methane compressed"], unNumber: "UN1971", name: "Natural Gas, Compressed", hazmatClass: "2.1" },
  { keywords: ["lng", "liquefied natural gas", "methane refrigerated"], unNumber: "UN1972", name: "LNG / Methane, Refrigerated", hazmatClass: "2.1" },
  { keywords: ["ethane"], unNumber: "UN1035", name: "Ethane", hazmatClass: "2.1" },
  { keywords: ["hydrogen compressed", "hydrogen gas"], unNumber: "UN1049", name: "Hydrogen, Compressed", hazmatClass: "2.1" },
  { keywords: ["hydrogen refrigerated", "liquid hydrogen"], unNumber: "UN1966", name: "Hydrogen, Refrigerated", hazmatClass: "2.1" },
  { keywords: ["acetylene"], unNumber: "UN1001", name: "Acetylene, Dissolved", hazmatClass: "2.1" },
  { keywords: ["ammonia", "anhydrous ammonia"], unNumber: "UN1005", name: "Ammonia, Anhydrous", hazmatClass: "2.3" },
  { keywords: ["chlorine"], unNumber: "UN1017", name: "Chlorine", hazmatClass: "2.3" },
  { keywords: ["oxygen", "oxygen compressed"], unNumber: "UN1072", name: "Oxygen, Compressed", hazmatClass: "2.2" },
  { keywords: ["nitrogen compressed"], unNumber: "UN1066", name: "Nitrogen, Compressed", hazmatClass: "2.2" },
  { keywords: ["nitrogen refrigerated", "liquid nitrogen"], unNumber: "UN1977", name: "Nitrogen, Refrigerated", hazmatClass: "2.2" },
  { keywords: ["carbon dioxide", "co2"], unNumber: "UN1013", name: "Carbon Dioxide", hazmatClass: "2.2" },
  { keywords: ["argon"], unNumber: "UN1006", name: "Argon, Compressed", hazmatClass: "2.2" },
  { keywords: ["helium"], unNumber: "UN1046", name: "Helium, Compressed", hazmatClass: "2.2" },
  { keywords: ["ethanol", "ethyl alcohol", "denatured alcohol"], unNumber: "UN1170", name: "Ethanol", hazmatClass: "3" },
  { keywords: ["methanol", "methyl alcohol", "wood alcohol"], unNumber: "UN1230", name: "Methanol", hazmatClass: "3" },
  { keywords: ["acetone"], unNumber: "UN1090", name: "Acetone", hazmatClass: "3" },
  { keywords: ["benzene", "benzol"], unNumber: "UN1114", name: "Benzene", hazmatClass: "3" },
  { keywords: ["toluene", "toluol", "methylbenzene"], unNumber: "UN1294", name: "Toluene", hazmatClass: "3" },
  { keywords: ["xylene", "xylenes", "xylol"], unNumber: "UN1307", name: "Xylenes", hazmatClass: "3" },
  { keywords: ["styrene"], unNumber: "UN2055", name: "Styrene Monomer", hazmatClass: "3" },
  { keywords: ["cyclohexane"], unNumber: "UN1145", name: "Cyclohexane", hazmatClass: "3" },
  { keywords: ["isopropanol", "isopropyl alcohol", "ipa", "rubbing alcohol"], unNumber: "UN1219", name: "Isopropanol", hazmatClass: "3" },
  { keywords: ["e85", "e10", "e15", "gasohol", "ethanol gasoline"], unNumber: "UN3475", name: "Ethanol-Gasoline Mixture", hazmatClass: "3" },
  { keywords: ["sulfuric acid", "battery acid", "sulphuric acid"], unNumber: "UN1830", name: "Sulfuric Acid", hazmatClass: "8" },
  { keywords: ["hydrochloric acid", "muriatic acid", "hcl"], unNumber: "UN1789", name: "Hydrochloric Acid", hazmatClass: "8" },
  { keywords: ["sodium hydroxide", "caustic soda", "lye", "naoh"], unNumber: "UN1823", name: "Sodium Hydroxide", hazmatClass: "8" },
  { keywords: ["bleach", "sodium hypochlorite", "hypochlorite"], unNumber: "UN1791", name: "Hypochlorite Solution", hazmatClass: "8" },
  { keywords: ["hydrogen sulfide", "h2s", "sour gas"], unNumber: "UN1053", name: "Hydrogen Sulfide", hazmatClass: "2.3" },
  { keywords: ["hydrogen peroxide"], unNumber: "UN2014", name: "Hydrogen Peroxide", hazmatClass: "5.1" },
  { keywords: ["asphalt", "bitumen", "hot asphalt"], unNumber: "UN3257", name: "Elevated Temperature Liquid", hazmatClass: "9" },
  { keywords: ["paint", "lacquer", "varnish"], unNumber: "UN1263", name: "Paint / Lacquer", hazmatClass: "3" },
  { keywords: ["turpentine"], unNumber: "UN1300", name: "Turpentine", hazmatClass: "3" },
  { keywords: ["phosgene"], unNumber: "UN1076", name: "Phosgene", hazmatClass: "2.3" },
  { keywords: ["hydrogen cyanide", "hcn", "prussic acid"], unNumber: "UN1051", name: "Hydrogen Cyanide", hazmatClass: "6.1" },
  { keywords: ["carbon monoxide", "co"], unNumber: "UN1016", name: "Carbon Monoxide", hazmatClass: "2.3" },
  { keywords: ["sulfur dioxide", "so2"], unNumber: "UN1079", name: "Sulfur Dioxide", hazmatClass: "2.3" },
  { keywords: ["lithium ion battery", "lithium battery"], unNumber: "UN3480", name: "Lithium Ion Batteries", hazmatClass: "9" },
  { keywords: ["fuel oil", "mineral spirits", "petroleum distillate"], unNumber: "UN1268", name: "Petroleum Distillates", hazmatClass: "3" },
];

const UN_LOOKUP: Record<string, { name: string; hazmatClass: string }> = {};
PRODUCT_DB.forEach(p => {
  const num = p.unNumber.replace(/^UN/, "");
  UN_LOOKUP[num] = { name: p.name, hazmatClass: p.hazmatClass };
});

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

  const lookupProductName = useCallback((name: string) => {
    const q = name.toLowerCase().trim();
    if (!q) return null;
    for (const entry of PRODUCT_DB) {
      for (const kw of entry.keywords) {
        if (q.includes(kw) || kw.includes(q)) return entry;
      }
    }
    return null;
  }, []);

  const lookupUNNumber = useCallback((un: string) => {
    const num = un.replace(/^un/i, "").trim();
    if (!num || num.length < 4) return null;
    return UN_LOOKUP[num] || null;
  }, []);

  const handleUNChange = useCallback((value: string) => {
    updateField("unNumber", value);
    const result = lookupUNNumber(value);
    if (result) {
      updateField("productName", result.name);
      updateField("hazmatClass", result.hazmatClass);
      toast.success("ERG Auto-Detect", { description: `Identified: ${result.name} (Class ${result.hazmatClass})` });
    }
  }, [lookupUNNumber]);

  const handleSuggest = () => {
    if (formData.productName) {
      const match = lookupProductName(formData.productName);
      if (match) {
        updateField("hazmatClass", match.hazmatClass);
        updateField("unNumber", match.unNumber);
        toast.success("ESANG AI Classification", { description: `Identified: ${match.name} -- ${match.unNumber} (Class ${match.hazmatClass})` });
      } else {
        toast.error("ESANG AI", { description: `Could not identify "${formData.productName}". Please select classification manually or enter UN number.` });
      }
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    createLoadMutation.mutate(formData);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.productName && formData.hazmatClass;
      case 1: return formData.weight && formData.quantity;
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
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                <label className="text-sm text-slate-400 mb-1 block">UN Number (optional -- auto-detects product)</label>
                <Input value={formData.unNumber || ""} onChange={(e: any) => handleUNChange(e.target.value)} placeholder="e.g., UN1203" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
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
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                    <Input type="number" value={formData.quantity || ""} onChange={(e: any) => updateField("quantity", e.target.value)} placeholder="8500" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={formData.quantityUnit || "Gallons"} onValueChange={(v: any) => updateField("quantityUnit", v)}>
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

              {formData.quantity && Number(formData.quantity) > 0 && (
                <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-sm text-slate-400 mb-4 text-center">Load Visualization</p>
                  <MultiTruckVisualization
                    materialType={getMaterialType()}
                    totalVolume={Number(formData.quantity) || 0}
                    unit={formData.quantityUnit === "Gallons" ? "gal" : formData.quantityUnit === "Barrels" ? "bbl" : formData.quantityUnit?.toLowerCase() || "gal"}
                    maxCapacityPerTruck={formData.quantityUnit === "Barrels" ? 200 : formData.quantityUnit === "Pallets" ? 24 : 8500}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-green-400" />Origin</label><Input value={formData.origin || ""} onChange={(e: any) => updateField("origin", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" />Destination</label><Input value={formData.destination || ""} onChange={(e: any) => updateField("destination", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">Pickup Date</label><Input type="date" value={formData.pickupDate || ""} onChange={(e: any) => updateField("pickupDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Delivery Date</label><Input type="date" value={formData.deliveryDate || ""} onChange={(e: any) => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block">Equipment Type</label>
                <Select value={formData.equipment || ""} onValueChange={(v: any) => updateField("equipment", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{EQUIPMENT_TYPES.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block">Minimum Safety Score</label><Input type="number" value={formData.minSafetyScore || ""} onChange={(e: any) => updateField("minSafetyScore", e.target.value)} placeholder="e.g., 80" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Required Endorsements</label><Input value={formData.endorsements || ""} onChange={(e: any) => updateField("endorsements", e.target.value)} placeholder="e.g., Hazmat, Tanker" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block">Rate ($)</label><Input type="number" value={formData.rate || ""} onChange={(e: any) => updateField("rate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Rate Per Mile ($)</label><Input type="number" step="0.01" value={formData.ratePerMile || ""} onChange={(e: any) => updateField("ratePerMile", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-white font-bold text-lg">Review Your Load</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Product</p><p className="text-white">{formData.productName}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Hazmat Class</p><p className="text-white">{HAZMAT_CLASSES.find(c => c.id === formData.hazmatClass)?.name || formData.hazmatClass}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">UN Number</p><p className="text-white">{formData.unNumber || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Volume</p><p className="text-white">{formData.quantity} {formData.quantityUnit || "Gallons"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Weight</p><p className="text-white">{formData.weight} {formData.weightUnit || "lbs"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Origin</p><p className="text-white">{formData.origin}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Destination</p><p className="text-white">{formData.destination}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Pickup</p><p className="text-white">{formData.pickupDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Delivery</p><p className="text-white">{formData.deliveryDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Equipment</p><p className="text-white">{EQUIPMENT_TYPES.find(e => e.id === formData.equipment)?.name || formData.equipment}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rate</p><p className="text-white">${formData.rate}{formData.ratePerMile ? ` ($${formData.ratePerMile}/mi)` : ""}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Safety Score</p><p className="text-white">{formData.minSafetyScore || "Any"}</p></div>
              </div>
              {formData.hazmatClass && (
                <div className="mt-4">
                  <HazmatDecalPreview hazmatClass={formData.hazmatClass} unNumber={formData.unNumber} productName={formData.productName} />
                </div>
              )}
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
