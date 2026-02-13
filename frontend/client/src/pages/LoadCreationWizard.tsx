/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * Trailer-type-first flow: trailer choice determines product steps, animations, and ERG requirements
 * Google Maps Places Autocomplete for origin/destination
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
import RouteMap from "@/components/RouteMap";
import DatePicker from "@/components/DatePicker";

const ALL_STEPS = ["Trailer Type", "Product Classification", "SPECTRA-MATCH Verification", "Quantity & Weight", "Origin & Destination", "Carrier Requirements", "Pricing", "Review"];

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
  const [, navigate] = useLocation();
  const [step, setStepRaw] = useState(0);
  const stepHistoryRef = useRef<number[]>([0]);
  const isPopRef = useRef(false);

  // Browser history sync — back button goes to previous wizard step
  useEffect(() => {
    window.history.replaceState({ wizardStep: 0, idx: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      if (e.state?.wizardStep !== undefined) {
        isPopRef.current = true;
        setStepRaw(e.state.wizardStep);
        stepHistoryRef.current = stepHistoryRef.current.slice(0, (e.state.idx ?? 0) + 1);
      } else {
        navigate("/loads");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);

  // Warn on tab close when form has data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const setStep = useCallback((next: number) => {
    if (isPopRef.current) { isPopRef.current = false; return; }
    const idx = stepHistoryRef.current.length;
    stepHistoryRef.current.push(next);
    setStepRaw(next);
    window.history.pushState({ wizardStep: next, idx }, "");
  }, []);
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
  const [rateMode, setRateMode] = useState<"total" | "perMile">("total");
  const [compSearchQuery, setCompSearchQuery] = useState("");
  const [activeCompIdx, setActiveCompIdx] = useState<number | null>(null);
  const [showCompSuggestions, setShowCompSuggestions] = useState(false);
  const compDebounceRef = useRef<any>(null);
  const compSuggestRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const originACRef = useRef<any>(null);
  const destACRef = useRef<any>(null);
  // Map rendering handled by RouteMap component

  const selectedTrailer = TRAILER_TYPES.find(t => t.id === formData.trailerType);
  const isHazmat = selectedTrailer?.hazmat ?? false;
  const isLiquidOrGas = selectedTrailer?.animType === "liquid" || selectedTrailer?.animType === "gas";
  const isTanker = ["liquid_tank", "gas_tank", "cryogenic"].includes(formData.trailerType || "");

  // Correct quantity units per trailer type — NO gallons for pallets
  const getQuantityUnits = (trailerId: string) => {
    switch (trailerId) {
      case "liquid_tank": return ["Gallons", "Barrels", "Liters"];
      case "gas_tank": return ["Gallons", "Cubic Feet", "PSI Units"];
      case "cryogenic": return ["Gallons", "Liters", "Cubic Meters"];
      case "dry_van": return ["Pallets", "Units", "Cases", "Boxes"];
      case "reefer": return ["Pallets", "Units", "Cases", "Boxes"];
      case "flatbed": return ["Pieces", "Bundles", "Linear Feet", "Tons"];
      case "bulk_hopper": return ["Cubic Yards", "Cubic Feet", "Tons"];
      case "hazmat_van": return ["Drums", "Pallets", "Units", "Cases"];
      default: return ["Units", "Pallets", "Cases"];
    }
  };
  const getDefaultUnit = (trailerId: string) => getQuantityUnits(trailerId)[0];
  const getPlaceholder = (trailerId: string) => {
    switch (trailerId) {
      case "liquid_tank": return "8500";
      case "gas_tank": return "11000";
      case "cryogenic": return "10000";
      case "dry_van": return "24";
      case "reefer": return "22";
      case "flatbed": return "6";
      case "bulk_hopper": return "30";
      case "hazmat_van": return "48";
      default: return "24";
    }
  };
  const quantityUnits = getQuantityUnits(formData.trailerType || "");
  const currentUnit = formData.quantityUnit || getDefaultUnit(formData.trailerType || "");

  // Skip SPECTRA-MATCH step (index 2) for non-hazmat loads
  const STEPS = isHazmat ? ALL_STEPS : ALL_STEPS.filter((_, i) => i !== 2);
  const realStep = (logicalStep: number) => {
    if (isHazmat) return logicalStep;
    return logicalStep >= 2 ? logicalStep + 1 : logicalStep;
  };
  const rs = realStep(step);

  const ergSearch = (trpc as any).erg.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2, staleTime: 30000 }
  );
  const ergUNSearch = (trpc as any).erg.search.useQuery(
    { query: unSearchQuery, limit: 10 },
    { enabled: unSearchQuery.length >= 2, staleTime: 30000 }
  );
  const ergCompSearch = (trpc as any).erg.search.useQuery(
    { query: compSearchQuery, limit: 10 },
    { enabled: compSearchQuery.length >= 2, staleTime: 30000 }
  );

  // Detect Google Maps API loaded from index.html
  useEffect(() => {
    const check = () => !!(window as any).google?.maps?.places;
    if (check()) { setMapsLoaded(true); return; }
    // Poll for the async script from index.html to finish loading
    const interval = setInterval(() => {
      if (check()) { setMapsLoaded(true); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Attach Places Autocomplete when maps loaded and on step 3
  useEffect(() => {
    if (!mapsLoaded || rs !== 4) return;
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
  }, [mapsLoaded, rs]);

  // Route map rendering is now handled by the reusable RouteMap component

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (unSuggestRef.current && !unSuggestRef.current.contains(e.target as Node)) setShowUNSuggestions(false);
      if (compSuggestRef.current && !compSuggestRef.current.contains(e.target as Node)) setShowCompSuggestions(false);
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
      compartments: formData.compartments || 1,
      compartmentProducts: formData.compartmentProducts || undefined,
      rate: formData.rate,
      ratePerMile: formData.ratePerMile,
      minSafetyScore: formData.minSafetyScore,
      endorsements: formData.endorsements,
      apiGravity: formData.apiGravity,
      bsw: formData.bsw,
      sulfurContent: formData.sulfurContent,
      flashPoint: formData.flashPoint,
      viscosity: formData.viscosity,
      pourPoint: formData.pourPoint,
      reidVaporPressure: formData.reidVaporPressure,
      appearance: formData.appearance,
    });
  };

  const canProceed = () => {
    switch (rs) {
      case 0: return !!formData.trailerType;
      case 1: return formData.productName && (isHazmat ? formData.hazmatClass : true);
      case 2: return true; // SPECTRA-MATCH params are optional
      case 3: return formData.weight && formData.quantity;
      case 4: return formData.origin && formData.destination;
      case 5: return true;
      case 6: return formData.rate || formData.ratePerMile;
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
          {rs === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-white font-bold text-lg">Select Your Trailer Type</p>
              <p className="text-slate-400 text-sm">This determines product options, hazmat classification, and load visualization.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRAILER_TYPES.map((t) => (
                  <button key={t.id} onClick={() => { updateField("trailerType", t.id); updateField("equipment", t.equipment); updateField("quantityUnit", getDefaultUnit(t.id)); updateField("compartments", 1); updateField("compartmentProducts", undefined); }}
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
          {rs === 1 && (
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

          {/* STEP 2: SPECTRA-MATCH Verification (hazmat only) */}
          {rs === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <p className="text-white font-bold text-lg">SPECTRA-MATCH Parameters</p>
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 ml-auto">Product Verification</Badge>
              </div>
              <p className="text-slate-400 text-sm">Enter physical properties so SPECTRA-MATCH can verify product identity. All fields are optional but improve verification accuracy.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">API Gravity (degrees)</label>
                  <Input type="number" step="0.1" value={formData.apiGravity || ""} onChange={(e: any) => updateField("apiGravity", e.target.value)} placeholder="e.g., 35.5" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">BS&W (Basic Sediment & Water %)</label>
                  <Input type="number" step="0.01" value={formData.bsw || ""} onChange={(e: any) => updateField("bsw", e.target.value)} placeholder="e.g., 0.5" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Sulfur Content (%)</label>
                  <Input type="number" step="0.01" value={formData.sulfurContent || ""} onChange={(e: any) => updateField("sulfurContent", e.target.value)} placeholder="e.g., 1.2" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Flash Point (F)</label>
                  <Input type="number" value={formData.flashPoint || ""} onChange={(e: any) => updateField("flashPoint", e.target.value)} placeholder="e.g., -45" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Viscosity (cSt @ 40C)</label>
                  <Input type="number" step="0.1" value={formData.viscosity || ""} onChange={(e: any) => updateField("viscosity", e.target.value)} placeholder="e.g., 5.8" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Pour Point (F)</label>
                  <Input type="number" value={formData.pourPoint || ""} onChange={(e: any) => updateField("pourPoint", e.target.value)} placeholder="e.g., -20" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Reid Vapor Pressure (psi)</label>
                  <Input type="number" step="0.1" value={formData.reidVaporPressure || ""} onChange={(e: any) => updateField("reidVaporPressure", e.target.value)} placeholder="e.g., 8.5" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Color / Appearance</label>
                  <Select value={formData.appearance || ""} onValueChange={(v: any) => updateField("appearance", v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clear">Clear / Colorless</SelectItem>
                      <SelectItem value="Light">Light / Straw</SelectItem>
                      <SelectItem value="Amber">Amber</SelectItem>
                      <SelectItem value="Dark">Dark Brown</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="Green">Green / Olive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.spectraVerified && formData.productName && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex-shrink-0" />
                  <div>
                    <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-sm font-bold">ERG Match: {formData.productName}</p>
                    <p className="text-slate-400 text-[10px]">{formData.unNumber} -- Class {formData.hazmatClass} -- Guide {formData.ergGuide}</p>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-700/20 border border-slate-700/30">
                <div className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /><span className="text-slate-500 text-xs">These parameters feed into the SPECTRA-MATCH multi-parameter identification system to cross-verify the declared product against physical properties.</span></div>
              </div>
            </div>
          )}

          {/* STEP 3: Quantity & Weight */}
          {rs === 3 && (
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
                      placeholder={getPlaceholder(formData.trailerType || "")} className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                    <Select value={currentUnit} onValueChange={(v: any) => updateField("quantityUnit", v)}>
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {quantityUnits.map((u: string) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Compartment selector — ONLY for tanker types */}
              {isTanker && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Number of Compartments</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          updateField("compartments", n);
                          if (n > 1 && !formData.compartmentProducts) {
                            updateField("compartmentProducts", Array.from({ length: n }, () => ({ product: formData.productName || "", volume: "" })));
                          } else if (n > 1) {
                            const existing = formData.compartmentProducts || [];
                            updateField("compartmentProducts", Array.from({ length: n }, (_, i) => existing[i] || { product: "", volume: "" }));
                          } else {
                            updateField("compartmentProducts", undefined);
                          }
                        }}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                          (formData.compartments || 1) === n
                            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-lg"
                            : "bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-700"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{(formData.compartments || 1) > 1 ? `Multi-compartment: ${formData.compartments} separate cargo sections` : "Single compartment tanker"}</p>
                </div>
              )}

              {/* Per-compartment product selection for multi-comp tankers — with ERG auto-populate */}
              {isTanker && (formData.compartments || 1) > 1 && (
                <div className="space-y-3" ref={compSuggestRef}>
                  <label className="text-sm text-slate-400 block">Compartment Products & Volumes</label>
                  <p className="text-[10px] text-slate-500">Assign a product and volume to each compartment. Type to search the ERG 2020 database — same auto-populate as the hazmat product field.</p>
                  <div className="grid gap-2">
                    {Array.from({ length: formData.compartments || 1 }).map((_, i) => {
                      const cp = formData.compartmentProducts?.[i] || { product: "", volume: "" };
                      return (
                        <div key={i} className="relative flex items-center gap-2 p-3 rounded-xl bg-slate-700/20 border border-slate-700/30">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <Input
                              value={cp.product}
                              onChange={(e: any) => {
                                const val = e.target.value;
                                const arr = [...(formData.compartmentProducts || [])];
                                arr[i] = { ...arr[i], product: val };
                                updateField("compartmentProducts", arr);
                                setActiveCompIdx(i);
                                if (compDebounceRef.current) clearTimeout(compDebounceRef.current);
                                compDebounceRef.current = setTimeout(() => {
                                  if (val.trim().length >= 2) { setCompSearchQuery(val.trim()); setShowCompSuggestions(true); }
                                  else setShowCompSuggestions(false);
                                }, 200);
                              }}
                              onFocus={() => { setActiveCompIdx(i); if (compSearchQuery.length >= 2) setShowCompSuggestions(true); }}
                              placeholder={`Search product for comp ${i + 1}...`}
                              className="bg-slate-700/50 border-slate-600/50 rounded-lg text-sm pl-9"
                            />
                            {/* ERG Suggestions Dropdown for this compartment */}
                            {showCompSuggestions && activeCompIdx === i && ergCompSearch.data?.results?.length > 0 && (
                              <div className="absolute z-[100] left-0 right-0 bottom-full mb-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                                <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-700/50">ERG 2020 — Compartment {i + 1}</div>
                                {ergCompSearch.data.results.map((m: any, mi: number) => (
                                  <button key={`comp-${i}-${m.unNumber}-${mi}`} className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-700/20 last:border-0 transition-colors"
                                    onClick={() => {
                                      const arr = [...(formData.compartmentProducts || [])];
                                      arr[i] = { ...arr[i], product: m.name, unNumber: `UN${m.unNumber}`, hazardClass: m.hazardClass, guide: m.guide };
                                      updateField("compartmentProducts", arr);
                                      setShowCompSuggestions(false);
                                      toast.success(`Comp ${i + 1}: ${m.name}`, { description: `UN${m.unNumber} — Class ${m.hazardClass} — Guide ${m.guide}` });
                                    }}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-xs font-medium truncate">{m.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400">UN{m.unNumber}</Badge>
                                      <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">Class {m.hazardClass}</Badge>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {showCompSuggestions && activeCompIdx === i && compSearchQuery.length >= 2 && ergCompSearch.isLoading && (
                              <div className="absolute z-[100] left-0 right-0 bottom-full mb-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl p-2">
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><Sparkles className="w-3 h-3 animate-spin" />Searching ERG 2020...</div>
                              </div>
                            )}
                          </div>
                          <Input
                            type="number"
                            value={cp.volume}
                            onChange={(e: any) => {
                              const arr = [...(formData.compartmentProducts || [])];
                              arr[i] = { ...arr[i], volume: e.target.value };
                              updateField("compartmentProducts", arr);
                            }}
                            placeholder="Volume"
                            className="bg-slate-700/50 border-slate-600/50 rounded-lg text-sm w-28"
                          />
                          <span className="text-xs text-slate-500 w-10">{currentUnit === "Gallons" ? "gal" : currentUnit === "Barrels" ? "bbl" : currentUnit.toLowerCase().slice(0, 3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-cyan-400" /><span className="text-sm text-slate-400">Quick Reference -- {selectedTrailer?.name}</span></div>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  {selectedTrailer?.id === "liquid_tank" ? (<>
                    <div><p>Standard Tank: 7,000-9,500 gal</p><p>MC-306/DOT-406: 9,000-9,500 gal</p></div>
                    <div><p>Max Legal Weight: 80,000 lbs</p><p>Typical Fuel Load: 8,000-8,500 gal</p></div>
                  </>) : selectedTrailer?.id === "gas_tank" ? (<>
                    <div><p>MC-331 Capacity: 9,000-11,600 gal</p><p>Working Pressure: 100-300 PSI</p></div>
                    <div><p>Max Legal Weight: 80,000 lbs</p><p>Typical LPG Load: 9,000-10,000 gal</p></div>
                  </>) : selectedTrailer?.id === "cryogenic" ? (<>
                    <div><p>MC-338 Capacity: 8,000-12,000 gal</p><p>Operating Temp: -260°F to -320°F</p></div>
                    <div><p>Max Legal Weight: 80,000 lbs</p><p>Vacuum insulated double-wall</p></div>
                  </>) : selectedTrailer?.id === "reefer" ? (<>
                    <div><p>Standard Reefer: 40-53 ft</p><p>Floor Space: ~2,500 sq ft</p></div>
                    <div><p>Max Legal Weight: 44,000 lbs</p><p>Typical: 20-24 pallets</p></div>
                  </>) : selectedTrailer?.id === "flatbed" ? (<>
                    <div><p>Standard: 48-53 ft</p><p>Max Width: 8.5 ft (102 in)</p></div>
                    <div><p>Max Legal Weight: 48,000 lbs</p><p>Max Height: 8.5 ft from deck</p></div>
                  </>) : selectedTrailer?.id === "bulk_hopper" ? (<>
                    <div><p>Pneumatic Trailer: 1,000-1,700 cu ft</p><p>Bottom/side discharge</p></div>
                    <div><p>Max Legal Weight: 44,000 lbs</p><p>Typical: 25-30 tons dry bulk</p></div>
                  </>) : selectedTrailer?.id === "hazmat_van" ? (<>
                    <div><p>Standard Hazmat Van: 53 ft</p><p>Interior: 2,390 cu ft</p></div>
                    <div><p>Max Legal Weight: 44,000 lbs</p><p>Requires placarding per DOT</p></div>
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
                    unit={currentUnit === "Gallons" ? "gal" : currentUnit === "Barrels" ? "bbl" : currentUnit === "Cubic Feet" ? "cf" : currentUnit === "Cubic Yards" ? "cy" : currentUnit.toLowerCase().slice(0, 3)}
                    maxCapacityPerTruck={
                      currentUnit === "Barrels" ? 200 : currentUnit === "Pallets" ? 24 : currentUnit === "Units" ? 100 :
                      currentUnit === "Tons" ? 25 : currentUnit === "Pieces" ? 20 : currentUnit === "Drums" ? 80 :
                      currentUnit === "Cubic Yards" ? 35 : currentUnit === "Cubic Feet" ? 1700 : currentUnit === "Bundles" ? 12 :
                      currentUnit === "Linear Feet" ? 53 : currentUnit === "Boxes" ? 1000 : currentUnit === "Cases" ? 500 :
                      selectedTrailer?.maxGal || 8500
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Origin & Destination with Google Maps */}
          {rs === 4 && (
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
              {/* Route Map Preview */}
              {mapsLoaded && (
                <RouteMap
                  originLat={formData.originLat}
                  originLng={formData.originLng}
                  destLat={formData.destLat}
                  destLng={formData.destLng}
                  originLabel={formData.origin}
                  destLabel={formData.destination}
                  height="280px"
                  onDistanceCalculated={(miles) => setFormData((prev: any) => ({ ...prev, distance: miles }))}
                />
              )}
              {formData.distance && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div><p className="text-slate-400 text-xs">Route Distance</p><p className="text-white text-2xl font-bold">{formData.distance} miles</p></div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1473FF" }} />
                      <div className="w-16 h-1 rounded bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#BE01FF" }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 dark:text-slate-400 mb-1 block">Pickup Date</label><DatePicker value={formData.pickupDate || ""} onChange={(val) => updateField("pickupDate", val)} placeholder="Select pickup date" /></div>
                <div><label className="text-sm text-slate-400 dark:text-slate-400 mb-1 block">Delivery Date</label><DatePicker value={formData.deliveryDate || ""} onChange={(val) => updateField("deliveryDate", val)} placeholder="Select delivery date" /></div>
              </div>
              {!mapsLoaded && <div className="p-2 rounded-lg bg-slate-700/20 border border-slate-700/30"><p className="text-slate-500 text-[10px] flex items-center gap-1"><Info className="w-3 h-3" />Google Maps autocomplete &amp; route preview available when VITE_GOOGLE_MAPS_KEY is configured.</p></div>}
            </div>
          )}

          {/* STEP 5: Carrier Requirements */}
          {rs === 5 && (
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

          {/* STEP 6: Pricing — Total Rate or Rate Per Mile */}
          {rs === 6 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Rate Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-700/30 rounded-lg w-fit">
                <button onClick={() => setRateMode("total")}
                  className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all", rateMode === "total" ? "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white shadow" : "text-slate-400 hover:text-white")}>
                  Total Rate ($)
                </button>
                <button onClick={() => setRateMode("perMile")}
                  className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all", rateMode === "perMile" ? "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white shadow" : "text-slate-400 hover:text-white")}>
                  Rate Per Mile ($/mi)
                </button>
              </div>

              {rateMode === "total" ? (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Total Rate ($)</label>
                  <Input type="number" value={formData.rate || ""} onChange={(e: any) => {
                    const val = e.target.value;
                    updateField("rate", val);
                    if (formData.distance && Number(val) > 0) updateField("ratePerMile", (Number(val) / formData.distance).toFixed(2));
                  }} placeholder="e.g., 2500" className="bg-slate-700/50 border-slate-600/50 rounded-lg text-lg" />
                  {formData.distance && formData.rate && (
                    <p className="text-sm text-slate-500 mt-2">= <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${(Number(formData.rate) / formData.distance).toFixed(2)}/mi</span> over {formData.distance} miles</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Rate Per Mile ($/mi)</label>
                  <Input type="number" step="0.01" value={formData.ratePerMile || ""} onChange={(e: any) => {
                    const val = e.target.value;
                    updateField("ratePerMile", val);
                    if (formData.distance && Number(val) > 0) updateField("rate", String(Math.round(Number(val) * formData.distance)));
                  }} placeholder="e.g., 3.25" className="bg-slate-700/50 border-slate-600/50 rounded-lg text-lg" />
                  {formData.distance && formData.ratePerMile && (
                    <p className="text-sm text-slate-500 mt-2">= <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${Math.round(Number(formData.ratePerMile) * formData.distance).toLocaleString()} total</span> for {formData.distance} miles</p>
                  )}
                  {!formData.distance && <p className="text-sm text-amber-400/70 mt-2">Set origin &amp; destination first for auto-calculation of total rate.</p>}
                </div>
              )}

              {formData.distance && (formData.rate || formData.ratePerMile) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-slate-400 text-xs">Total Rate</p><p className="text-white text-xl font-bold">${Number(formData.rate || 0).toLocaleString()}</p></div>
                    <div><p className="text-slate-400 text-xs">Distance</p><p className="text-white text-xl font-bold">{formData.distance} mi</p></div>
                    <div><p className="text-slate-400 text-xs">Rate/Mile</p><p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-xl font-bold">${formData.ratePerMile || (Number(formData.rate) / formData.distance).toFixed(2)}</p></div>
                  </div>
                </div>
              )}

              {/* ESANG AI Rate Intelligence */}
              {formData.distance && (formData.rate || formData.ratePerMile) && (() => {
                const baseRate = selectedTrailer?.hazmat ? 4.20 : selectedTrailer?.equipment === "reefer" ? 3.10 : selectedTrailer?.equipment === "flatbed" ? 2.90 : 2.50;
                const distFactor = formData.distance < 200 ? 1.25 : formData.distance < 500 ? 1.0 : 0.85;
                const marketRPM = Math.round(baseRate * distFactor * 100) / 100;
                const marketLow = Math.round(marketRPM * 0.75 * 100) / 100;
                const marketHigh = Math.round(marketRPM * 1.30 * 100) / 100;
                const userRPM = Number(formData.ratePerMile || (Number(formData.rate) / formData.distance).toFixed(2));
                const marketTotal = Math.round(marketRPM * formData.distance);

                const ratio = userRPM / marketRPM;
                const clampedRatio = Math.max(0.5, Math.min(1.5, ratio));
                const gaugePercent = ((clampedRatio - 0.5) / 1.0) * 100;

                const ratingLabel = ratio < 0.80 ? "Too Low" : ratio < 0.95 ? "Below Market" : ratio <= 1.10 ? "Good Offer" : ratio <= 1.25 ? "Above Market" : "Too High";
                const ratingColor = ratio < 0.80 ? "#ef4444" : ratio < 0.95 ? "#f59e0b" : ratio <= 1.10 ? "#10b981" : ratio <= 1.25 ? "#f59e0b" : "#ef4444";

                const angle = -90 + (gaugePercent / 100) * 180;
                const needleRad = (angle * Math.PI) / 180;
                const nx = 100 + 65 * Math.cos(needleRad);
                const ny = 100 + 65 * Math.sin(needleRad);

                const pastelRatingColor = ratio < 0.80 ? "#f87171" : ratio < 0.95 ? "#fbbf24" : ratio <= 1.10 ? "#6ee7b7" : ratio <= 1.25 ? "#fbbf24" : "#f87171";

                return (
                  <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span className="text-sm font-bold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent">ESANG AI Rate Intelligence</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 200 115" className="w-52 h-32">
                        <defs>
                          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fca5a5" />
                            <stop offset="25%" stopColor="#fde68a" />
                            <stop offset="50%" stopColor="#6ee7b7" />
                            <stop offset="75%" stopColor="#fde68a" />
                            <stop offset="100%" stopColor="#fca5a5" />
                          </linearGradient>
                          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#BE01FF" />
                            <stop offset="100%" stopColor="#1473FF" />
                          </linearGradient>
                        </defs>
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
                        <line x1="100" y1="100" x2={nx} y2={ny} className="stroke-slate-700 dark:stroke-white" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="100" cy="100" r="5" fill={pastelRatingColor} className="stroke-slate-700 dark:stroke-white" strokeWidth="1.5" />
                        <text x="100" y="88" textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize="22" fontWeight="700" fontFamily="system-ui, sans-serif">
                          ${userRPM.toFixed(2)}
                        </text>
                      </svg>
                      <span className="text-xs font-semibold mt-0 bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent">/mile</span>

                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pastelRatingColor }} />
                        <span className="text-sm font-bold" style={{ color: ratingColor }}>{ratingLabel}</span>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4 px-2">
                      <button className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                        ratio < 0.80 ? "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400" : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500")}>
                        Too Low
                      </button>
                      <button className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                        ratio >= 0.90 && ratio <= 1.15 ? "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-purple-400" : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500")}>
                        Good Offer
                      </button>
                      <button className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                        ratio > 1.25 ? "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400" : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500")}>
                        Too High
                      </button>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300">ESANG Recommendation</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market Low</p><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">${marketLow}/mi</p></div>
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market Avg</p><p className="text-emerald-600 dark:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-xs font-bold">${marketRPM}/mi</p></div>
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market High</p><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">${marketHigh}/mi</p></div>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">Suggested total: <span className="text-purple-600 dark:text-purple-300 font-bold">${marketTotal.toLocaleString()}</span> for {formData.distance} mi</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 7: Review */}
          {rs === 7 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-white font-bold text-lg">Review Your Load</p>
              {formData.spectraVerified && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
                    <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-sm">SPECTRA-MATCH Verified</span>
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
                {isTanker && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Compartments</p><p className="text-white">{formData.compartments || 1}</p></div>}
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Origin</p><p className="text-white">{formData.origin}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Destination</p><p className="text-white">{formData.destination}</p></div>
                {formData.distance && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Distance</p><p className="text-white">{formData.distance} miles</p></div>}
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Pickup</p><p className="text-white">{formData.pickupDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Delivery</p><p className="text-white">{formData.deliveryDate || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rate</p><p className="text-white">${formData.rate}{formData.ratePerMile ? ` ($${formData.ratePerMile}/mi)` : ""}</p></div>
              </div>
              {/* ── Compartment Breakdown (multi-comp tankers) ── */}
              {(formData.compartments || 1) > 1 && formData.compartmentProducts?.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-bold text-sm">Compartment Breakdown — {formData.compartments} Compartments</span>
                  </div>
                  <div className="grid gap-2">
                    {(formData.compartmentProducts as any[]).map((cp: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{cp.product || "Not specified"}</p>
                          {cp.unNumber && <p className="text-slate-400 text-[10px]">{cp.unNumber} — Class {cp.hazardClass} — Guide {cp.guide}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-cyan-400 text-sm font-bold">{cp.volume || "—"}</p>
                          <p className="text-slate-500 text-[10px]">{currentUnit === "Gallons" ? "gal" : currentUnit === "Barrels" ? "bbl" : currentUnit.toLowerCase().slice(0, 3)}</p>
                        </div>
                      </div>
                    ))}
                    {/* Total volume across compartments */}
                    {(() => {
                      const totalVol = (formData.compartmentProducts as any[]).reduce((s: number, cp: any) => s + (Number(cp.volume) || 0), 0);
                      return totalVol > 0 ? (
                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-700/30">
                          <span className="text-slate-400 text-xs font-medium">Total Volume</span>
                          <span className="text-white text-sm font-bold">{totalVol.toLocaleString()} {currentUnit === "Gallons" ? "gal" : currentUnit === "Barrels" ? "bbl" : currentUnit.toLowerCase().slice(0, 3)}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
              {/* Route Map */}
              {formData.originLat && formData.destLat && (
                <RouteMap
                  originLat={formData.originLat}
                  originLng={formData.originLng}
                  destLat={formData.destLat}
                  destLng={formData.destLng}
                  originLabel={formData.origin}
                  destLabel={formData.destination}
                  height="280px"
                />
              )}
              {(formData.apiGravity || formData.bsw || formData.sulfurContent || formData.flashPoint) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-bold text-sm">SPECTRA-MATCH Parameters</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.apiGravity && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">API Gravity</p><p className="text-white text-sm">{formData.apiGravity}</p></div>}
                    {formData.bsw && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">BS&W</p><p className="text-white text-sm">{formData.bsw}%</p></div>}
                    {formData.sulfurContent && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Sulfur</p><p className="text-white text-sm">{formData.sulfurContent}%</p></div>}
                    {formData.flashPoint && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Flash Point</p><p className="text-white text-sm">{formData.flashPoint}F</p></div>}
                    {formData.viscosity && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Viscosity</p><p className="text-white text-sm">{formData.viscosity} cSt</p></div>}
                    {formData.pourPoint && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Pour Point</p><p className="text-white text-sm">{formData.pourPoint}F</p></div>}
                    {formData.reidVaporPressure && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">RVP</p><p className="text-white text-sm">{formData.reidVaporPressure} psi</p></div>}
                    {formData.appearance && <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500 uppercase">Appearance</p><p className="text-white text-sm">{formData.appearance}</p></div>}
                  </div>
                </div>
              )}
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
