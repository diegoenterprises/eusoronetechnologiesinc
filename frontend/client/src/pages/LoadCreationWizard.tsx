/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * Trailer-type-first flow: trailer choice determines product steps, animations, and ERG requirements
 * Google Maps Places Autocomplete for origin/destination
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, CheckCircle,
  ArrowRight, ArrowLeft, AlertTriangle, Sparkles, Info, Search,
  Droplets, Wind, Box, Thermometer, Snowflake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HazmatDecalPreview } from "@/components/HazmatDecal";
import { MultiTruckVisualization } from "@/components/TruckVisualization";

const STEPS = ["Trailer Type", "Product Classification", "Quantity & Weight", "Origin & Destination", "Carrier Requirements", "Pricing", "Review"];

const TRAILER_TYPES = [
  { id: "liquid_tank", name: "Liquid Tank Trailer", desc: "MC-306/DOT-406 for petroleum, chemicals, liquid bulk", icon: "droplets", animType: "liquid" as const, hazmat: true, equipment: "tank", maxGal: 9500 },
  { id: "gas_tank", name: "Pressurized Gas Tank", desc: "MC-331 for LPG, ammonia, compressed gases", icon: "wind", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 11600 },
  { id: "dry_van", name: "Dry Van", desc: "General freight, palletized goods, packaged materials", icon: "box", animType: "solid" as const, hazmat: false, equipment: "dry-van", maxGal: 0 },
  { id: "reefer", name: "Refrigerated (Reefer)", desc: "Temperature-controlled: food, pharma, chemicals", icon: "thermometer", animType: "refrigerated" as const, hazmat: false, equipment: "reefer", maxGal: 0 },
  { id: "flatbed", name: "Flatbed", desc: "Oversized loads, heavy equipment, steel, lumber", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "flatbed", maxGal: 0 },
  { id: "bulk_hopper", name: "Dry Bulk / Hopper", desc: "Pneumatic: cement, lime, flour, plastic pellets", icon: "package", animType: "solid" as const, hazmat: false, equipment: "hopper", maxGal: 0 },
  { id: "hazmat_van", name: "Hazmat Box / Van", desc: "Packaged hazmat: batteries, chemicals, oxidizers", icon: "alert", animType: "hazmat" as const, hazmat: true, equipment: "dry-van", maxGal: 0 },
  { id: "cryogenic", name: "Cryogenic Tank", desc: "LNG, liquid nitrogen, liquid oxygen, liquid hydrogen", icon: "snowflake", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 10000 },
];

const TRAILER_ICON: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-8 h-8" />,
  wind: <Wind className="w-8 h-8" />,
  box: <Box className="w-8 h-8" />,
  thermometer: <Thermometer className="w-8 h-8" />,
  truck: <Truck className="w-8 h-8" />,
  package: <Package className="w-8 h-8" />,
  alert: <AlertTriangle className="w-8 h-8" />,
  snowflake: <Snowflake className="w-8 h-8" />,
};

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

function getClassesForTrailer(id: string) {
  if (id === "liquid_tank") return HAZMAT_CLASSES.filter(c => ["3", "5.1", "5.2", "6.1", "8"].includes(c.id));
  if (id === "gas_tank" || id === "cryogenic") return HAZMAT_CLASSES.filter(c => c.id.startsWith("2"));
  return HAZMAT_CLASSES;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function LoadCreationWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unSearchQuery, setUNSearchQuery] = useState("");
  const [showUNSuggestions, setShowUNSuggestions] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const unSuggestRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const unDebounceRef = useRef<any>(null);
  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const originACRef = useRef<any>(null);
  const destACRef = useRef<any>(null);

  const selectedTrailer = TRAILER_TYPES.find(t => t.id === formData.trailerType);
  const isHazmat = selectedTrailer?.hazmat ?? false;
  const isLiquidOrGas = selectedTrailer?.animType === "liquid" || selectedTrailer?.animType === "gas";

  const ergSearch = (trpc as any).erg.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2, staleTime: 30000 }
  );
  const ergUNSearch = (trpc as any).erg.search.useQuery(
    { query: unSearchQuery, limit: 10 },
    { enabled: unSearchQuery.length >= 2, staleTime: 30000 }
  );

  // Load Google Maps Places API
  useEffect(() => {
    const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY;
    if ((window as any).google?.maps?.places) { setMapsLoaded(true); return; }
    if (!key) return;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.onload = () => setMapsLoaded(true);
    document.head.appendChild(s);
  }, []);

  // Attach Places Autocomplete when maps loaded and on step 3
  useEffect(() => {
    if (!mapsLoaded || step !== 3) return;
    const g = (window as any).google?.maps?.places;
    if (!g) return;
    const opts = { types: ["geocode", "establishment"], componentRestrictions: { country: "us" }, fields: ["formatted_address", "geometry"] };
    if (originRef.current && !originACRef.current) {
      originACRef.current = new g.Autocomplete(originRef.current, opts);
      originACRef.current.addListener("place_changed", () => {
        const p = originACRef.current.getPlace();
        if (p?.geometry) {
          const addr = p.formatted_address || "";
          const lat = p.geometry.location.lat();
          const lng = p.geometry.location.lng();
          setFormData((prev: any) => {
            const next = { ...prev, origin: addr, originLat: lat, originLng: lng };
            if (prev.destLat && prev.destLng) next.distance = haversineDistance(lat, lng, prev.destLat, prev.destLng);
            return next;
          });
        }
      });
    }
    if (destRef.current && !destACRef.current) {
      destACRef.current = new g.Autocomplete(destRef.current, opts);
      destACRef.current.addListener("place_changed", () => {
        const p = destACRef.current.getPlace();
        if (p?.geometry) {
          const addr = p.formatted_address || "";
          const lat = p.geometry.location.lat();
          const lng = p.geometry.location.lng();
          setFormData((prev: any) => {
            const next = { ...prev, destination: addr, destLat: lat, destLng: lng };
            if (prev.originLat && prev.originLng) next.distance = haversineDistance(prev.originLat, prev.originLng, lat, lng);
            return next;
          });
        }
      });
    }
  }, [mapsLoaded, step]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (unSuggestRef.current && !unSuggestRef.current.contains(e.target as Node)) setShowUNSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const createLoadMutation = (trpc as any).loads.create.useMutation({
    onSuccess: () => { toast.success("Load created successfully"); setStep(0); setFormData({}); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const getMaterialType = () => selectedTrailer?.animType || "liquid";

  const selectMaterial = useCallback((material: any) => {
    updateField("productName", material.name);
    updateField("hazmatClass", material.hazardClass);
    updateField("unNumber", `UN${material.unNumber}`);
    updateField("ergGuide", material.guide);
    updateField("isTIH", !!material.isTIH);
    updateField("isWR", !!material.isWR);
    updateField("placardName", material.placardName || "");
    updateField("spectraVerified", true);
    setShowSuggestions(false);
    setShowUNSuggestions(false);
    toast.success("SPECTRA-MATCH Verified", {
      description: `${material.name} -- UN${material.unNumber} (Class ${material.hazardClass}) Guide ${material.guide}`,
    });
  }, []);

  const handleProductNameChange = useCallback((value: string) => {
    updateField("productName", value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) { setSearchQuery(value.trim()); setShowSuggestions(true); }
      else setShowSuggestions(false);
    }, 200);
  }, []);

  const handleUNChange = useCallback((value: string) => {
    updateField("unNumber", value);
    if (unDebounceRef.current) clearTimeout(unDebounceRef.current);
    unDebounceRef.current = setTimeout(() => {
      const cleaned = value.replace(/^un/i, "").trim();
      if (cleaned.length >= 2) { setUNSearchQuery(cleaned); setShowUNSuggestions(true); }
      else setShowUNSuggestions(false);
    }, 200);
  }, []);

  const handleSuggest = () => {
    if (formData.productName) {
      setSearchQuery(formData.productName.trim());
      setShowSuggestions(true);
      if (ergSearch.data?.results?.length > 0) selectMaterial(ergSearch.data.results[0]);
      else toast.info("ESANG AI", { description: "Searching ERG database..." });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    createLoadMutation.mutate({
      productName: formData.productName,
      hazmatClass: formData.hazmatClass,
      unNumber: formData.unNumber,
      ergGuide: formData.ergGuide ? Number(formData.ergGuide) : undefined,
      isTIH: formData.isTIH || false,
      isWR: formData.isWR || false,
      placardName: formData.placardName,
      weight: formData.weight,
      weightUnit: formData.weightUnit,
      quantity: formData.quantity,
      quantityUnit: formData.quantityUnit,
      origin: formData.origin,
      destination: formData.destination,
      pickupDate: formData.pickupDate,
      deliveryDate: formData.deliveryDate,
      equipment: selectedTrailer?.equipment || formData.equipment,
      rate: formData.rate,
      ratePerMile: formData.ratePerMile,
      minSafetyScore: formData.minSafetyScore,
      endorsements: formData.endorsements,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!formData.trailerType;
      case 1: return formData.productName && (isHazmat ? formData.hazmatClass : true);
      case 2: return formData.weight && formData.quantity;
      case 3: return formData.origin && formData.destination;
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
          {/* STEP 0: Trailer Type Selection */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-white font-bold text-lg">Select Your Trailer Type</p>
              <p className="text-slate-400 text-sm">This determines product options, hazmat classification, and load visualization.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRAILER_TYPES.map((t) => (
                  <button key={t.id} onClick={() => { updateField("trailerType", t.id); updateField("equipment", t.equipment); }}
                    className={cn("p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02]",
                      formData.trailerType === t.id ? "bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border-cyan-500/50 ring-2 ring-cyan-500/30" : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                    )}>
                    <div className={cn("mb-2", formData.trailerType === t.id ? "text-cyan-400" : "text-slate-400")}>{TRAILER_ICON[t.icon]}</div>
                    <p className="text-white text-sm font-bold">{t.name}</p>
                    <p className="text-slate-500 text-[10px] mt-1 leading-tight">{t.desc}</p>
                    {t.hazmat && <Badge variant="outline" className="text-[8px] mt-2 border-orange-500/30 text-orange-400">HAZMAT</Badge>}
                  </button>
                ))}
              </div>
              {selectedTrailer && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-cyan-400 text-sm font-bold">{selectedTrailer.name}</p>
                    <p className="text-slate-400 text-[10px]">{isHazmat ? "Next: Product Classification with ERG 2020 search" : "Next: Product / Commodity Description"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Product Classification (driven by trailer type) */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {isHazmat ? (<>
                <div ref={suggestRef} className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Product Name</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input value={formData.productName || ""} onChange={(e: any) => handleProductNameChange(e.target.value)} onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
                        placeholder={selectedTrailer?.id === "liquid_tank" ? "e.g., Gasoline, Diesel, Sulfuric Acid..." : selectedTrailer?.id === "gas_tank" ? "e.g., Propane, Ammonia, Chlorine..." : "Search ERG 2020 materials..."}
                        className="bg-slate-700/50 border-slate-600/50 rounded-lg pl-10" />
                    </div>
                    <Button variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg" onClick={handleSuggest}>
                      <Sparkles className="w-4 h-4 mr-2" />ESANG AI
                    </Button>
                  </div>
                  {showSuggestions && ergSearch.data?.results?.length > 0 && (
                    <div className="absolute z-50 left-0 right-16 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-700/50">ERG 2020 -- {ergSearch.data.count} results from 1,980 materials</div>
                      {ergSearch.data.results.map((m: any, i: number) => (
                        <button key={`${m.unNumber}-${i}`} className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-700/20 last:border-0 transition-colors" onClick={() => selectMaterial(m)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{m.name}</p>
                            {m.alternateNames?.length > 0 && <p className="text-slate-500 text-[10px] truncate">Also: {m.alternateNames.slice(0, 2).join(", ")}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">UN{m.unNumber}</Badge>
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Class {m.hazardClass}</Badge>
                            <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">Guide {m.guide}</Badge>
                            {m.isTIH && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">TIH</Badge>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSuggestions && searchQuery.length >= 2 && ergSearch.isLoading && (
                    <div className="absolute z-50 left-0 right-16 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-sm"><Sparkles className="w-4 h-4 animate-spin" />Searching ERG 2020 database...</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Hazmat Classification</label>
                  <Select value={formData.hazmatClass || ""} onValueChange={(v: any) => updateField("hazmatClass", v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{getClassesForTrailer(formData.trailerType).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div ref={unSuggestRef} className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">UN Number (auto-detects product as you type)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input value={formData.unNumber || ""} onChange={(e: any) => handleUNChange(e.target.value)} onFocus={() => { if (unSearchQuery.length >= 2) setShowUNSuggestions(true); }}
                      placeholder="e.g., 1203, UN1223" className="bg-slate-700/50 border-slate-600/50 rounded-lg pl-10" />
                  </div>
                  {showUNSuggestions && ergUNSearch.data?.results?.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-700/50">ERG 2020 -- UN Number Matches</div>
                      {ergUNSearch.data.results.map((m: any, i: number) => (
                        <button key={`un-${m.unNumber}-${i}`} className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-700/20 last:border-0 transition-colors" onClick={() => selectMaterial(m)}>
                          <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{m.name}</p></div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">UN{m.unNumber}</Badge>
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Class {m.hazardClass}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formData.hazmatClass && <HazmatDecalPreview hazmatClass={formData.hazmatClass} unNumber={formData.unNumber} productName={formData.productName} />}
              </>) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Product / Commodity</label>
                    <Input value={formData.productName || ""} onChange={(e: any) => updateField("productName", e.target.value)}
                      placeholder={selectedTrailer?.id === "dry_van" ? "e.g., Electronics, Furniture, Packaged Goods..." : selectedTrailer?.id === "reefer" ? "e.g., Frozen Foods, Pharmaceuticals, Produce..." : selectedTrailer?.id === "flatbed" ? "e.g., Steel Beams, Lumber, Heavy Equipment..." : selectedTrailer?.id === "bulk_hopper" ? "e.g., Cement, Lime, Flour, Plastic Pellets..." : "Describe your product..."}
                      className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                  </div>
                  {selectedTrailer?.id === "reefer" && (
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Required Temperature Range</label>
                      <div className="flex gap-2">
                        <Input type="number" value={formData.tempMin || ""} onChange={(e: any) => updateField("tempMin", e.target.value)} placeholder="Min" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                        <Input type="number" value={formData.tempMax || ""} onChange={(e: any) => updateField("tempMax", e.target.value)} placeholder="Max" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                        <Select value={formData.tempUnit || "F"} onValueChange={(v: any) => updateField("tempUnit", v)}>
                          <SelectTrigger className="w-16 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="F">F</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-slate-700/20 border border-slate-700/30">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /><span className="text-slate-500 text-xs">Non-hazmat load -- no ERG classification required for {selectedTrailer?.name}.</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Quantity & Weight */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Weight</label>
                  <div className="flex gap-2">
                    <Input type="number" value={formData.weight || ""} onChange={(e: any) => updateField("weight", e.target.value)} placeholder="42000" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={formData.weightUnit || "lbs"} onValueChange={(v: any) => updateField("weightUnit", v)}>
                      <SelectTrigger className="w-24 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="lbs">lbs</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="tons">tons</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
                  <div className="flex gap-2">
                    <Input type="number" value={formData.quantity || ""} onChange={(e: any) => updateField("quantity", e.target.value)}
                      placeholder={isLiquidOrGas ? "8500" : "24"} className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={formData.quantityUnit || (isLiquidOrGas ? "Gallons" : "Pallets")} onValueChange={(v: any) => updateField("quantityUnit", v)}>
                      <SelectTrigger className="w-28 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {isLiquidOrGas
                          ? <><SelectItem value="Gallons">Gallons</SelectItem><SelectItem value="Barrels">Barrels</SelectItem><SelectItem value="Liters">Liters</SelectItem></>
                          : <><SelectItem value="Pallets">Pallets</SelectItem><SelectItem value="Units">Units</SelectItem><SelectItem value="Cases">Cases</SelectItem><SelectItem value="Tons">Tons</SelectItem></>
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-cyan-400" /><span className="text-sm text-slate-400">Quick Reference -- {selectedTrailer?.name}</span></div>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  {isLiquidOrGas ? (<>
                    <div><p>Standard Tank: 7,000-9,500 gal</p><p>MC-306/DOT-406: 9,000-9,500 gal</p></div>
                    <div><p>Max Legal Weight: 80,000 lbs</p><p>Typical Fuel Load: 8,000-8,500 gal</p></div>
                  </>) : selectedTrailer?.id === "reefer" ? (<>
                    <div><p>Standard Reefer: 40-53 ft</p><p>Floor Space: ~2,500 sq ft</p></div>
                    <div><p>Max Legal Weight: 44,000 lbs</p><p>Typical: 20-24 pallets</p></div>
                  </>) : selectedTrailer?.id === "flatbed" ? (<>
                    <div><p>Standard: 48-53 ft</p><p>Max Width: 8.5 ft (102 in)</p></div>
                    <div><p>Max Legal Weight: 48,000 lbs</p><p>Max Height: 8.5 ft from deck</p></div>
                  </>) : (<>
                    <div><p>Standard Dry Van: 53 ft</p><p>Interior: 2,390 cu ft</p></div>
                    <div><p>Max Legal Weight: 44,000-45,000 lbs</p><p>Typical: 22-26 pallets</p></div>
                  </>)}
                </div>
              </div>
              {formData.quantity && Number(formData.quantity) > 0 && (
                <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-sm text-slate-400 mb-4 text-center">Load Visualization -- {selectedTrailer?.name}</p>
                  <MultiTruckVisualization
                    materialType={getMaterialType()}
                    totalVolume={Number(formData.quantity) || 0}
                    unit={formData.quantityUnit === "Gallons" ? "gal" : formData.quantityUnit === "Barrels" ? "bbl" : formData.quantityUnit?.toLowerCase() || "gal"}
                    maxCapacityPerTruck={formData.quantityUnit === "Barrels" ? 200 : formData.quantityUnit === "Pallets" ? 24 : formData.quantityUnit === "Units" ? 100 : formData.quantityUnit === "Tons" ? 25 : selectedTrailer?.maxGal || 8500}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Origin & Destination with Google Maps */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-green-400" />Origin / Pickup</label>
                <Input ref={originRef} value={formData.origin || ""} onChange={(e: any) => updateField("origin", e.target.value)}
                  placeholder={mapsLoaded ? "Start typing an address..." : "City, State or full address"} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" />Destination / Drop-off</label>
                <Input ref={destRef} value={formData.destination || ""} onChange={(e: any) => updateField("destination", e.target.value)}
                  placeholder={mapsLoaded ? "Start typing an address..." : "City, State or full address"} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              {formData.distance && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div><p className="text-slate-400 text-xs">Estimated Distance</p><p className="text-white text-2xl font-bold">{formData.distance} miles</p></div>
                    <Truck className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">Pickup Date</label><Input type="date" value={formData.pickupDate || ""} onChange={(e: any) => updateField("pickupDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Delivery Date</label><Input type="date" value={formData.deliveryDate || ""} onChange={(e: any) => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              </div>
              {!mapsLoaded && <div className="p-2 rounded-lg bg-slate-700/20 border border-slate-700/30"><p className="text-slate-500 text-[10px] flex items-center gap-1"><Info className="w-3 h-3" />Google Maps autocomplete available when VITE_GOOGLE_MAPS_KEY is configured.</p></div>}
            </div>
          )}

          {/* STEP 4: Carrier Requirements */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block">Minimum Safety Score</label><Input type="number" value={formData.minSafetyScore || ""} onChange={(e: any) => updateField("minSafetyScore", e.target.value)} placeholder="e.g., 80" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Required Endorsements</label><Input value={formData.endorsements || ""} onChange={(e: any) => updateField("endorsements", e.target.value)} placeholder={isHazmat ? "Hazmat, Tanker" : "e.g., Tanker, Doubles/Triples"} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              {isHazmat && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /><span className="text-orange-400 text-sm font-medium">Hazmat load requires HM endorsement on CDL</span></div>
                  <p className="text-slate-400 text-xs mt-1">Carrier must have active hazmat endorsement and appropriate insurance coverage.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Pricing */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Rate ($)</label>
                <Input type="number" value={formData.rate || ""} onChange={(e: any) => {
                  updateField("rate", e.target.value);
                  if (formData.distance && Number(e.target.value) > 0) updateField("ratePerMile", (Number(e.target.value) / formData.distance).toFixed(2));
                }} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              {formData.distance && formData.rate && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-slate-400 text-xs">Total Rate</p><p className="text-white text-xl font-bold">${Number(formData.rate).toLocaleString()}</p></div>
                    <div><p className="text-slate-400 text-xs">Distance</p><p className="text-white text-xl font-bold">{formData.distance} mi</p></div>
                    <div><p className="text-slate-400 text-xs">Rate/Mile</p><p className="text-emerald-400 text-xl font-bold">${(Number(formData.rate) / formData.distance).toFixed(2)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-white font-bold text-lg">Review Your Load</p>
              {formData.spectraVerified && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold text-sm">SPECTRA-MATCH Verified</span>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 ml-auto">ERG 2020</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Product</p><p className="text-white text-sm font-medium truncate">{formData.productName}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">UN Number</p><p className="text-cyan-400 text-sm font-bold">{formData.unNumber}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Hazmat Class</p><p className="text-purple-400 text-sm font-medium">{formData.hazmatClass} - {formData.placardName}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">ERG Guide</p><p className="text-white text-sm font-medium">Guide {formData.ergGuide}</p></div>
                  </div>
                  {(formData.isTIH || formData.isWR) && (
                    <div className="flex gap-2 mt-2">
                      {formData.isTIH && <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/30"><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-red-400 text-[10px] font-bold">TOXIC INHALATION HAZARD</span></div>}
                      {formData.isWR && <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30"><AlertTriangle className="w-3 h-3 text-blue-400" /><span className="text-blue-400 text-[10px] font-bold">WATER-REACTIVE</span></div>}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2">Visible to all users: carriers, drivers, brokers, compliance officers.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Trailer</p><p className="text-white">{selectedTrailer?.name}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Product</p><p className="text-white">{formData.productName}</p></div>
                {formData.hazmatClass && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Hazmat Class</p><p className="text-white">{HAZMAT_CLASSES.find(c => c.id === formData.hazmatClass)?.name || formData.hazmatClass}</p></div>}
                {formData.unNumber && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">UN Number</p><p className="text-white">{formData.unNumber}</p></div>}
                {formData.ergGuide && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">ERG Guide</p><p className="text-white">Guide {formData.ergGuide}</p></div>}
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Volume</p><p className="text-white">{formData.quantity} {formData.quantityUnit || (isLiquidOrGas ? "Gallons" : "Pallets")}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Weight</p><p className="text-white">{formData.weight} {formData.weightUnit || "lbs"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Origin</p><p className="text-white">{formData.origin}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Destination</p><p className="text-white">{formData.destination}</p></div>
                {formData.distance && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Distance</p><p className="text-white">{formData.distance} miles</p></div>}
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Pickup</p><p className="text-white">{formData.pickupDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Delivery</p><p className="text-white">{formData.deliveryDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rate</p><p className="text-white">${formData.rate}{formData.ratePerMile ? ` ($${formData.ratePerMile}/mi)` : ""}</p></div>
              </div>
              {formData.hazmatClass && <div className="mt-4"><HazmatDecalPreview hazmatClass={formData.hazmatClass} unNumber={formData.unNumber} productName={formData.productName} /></div>}
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
