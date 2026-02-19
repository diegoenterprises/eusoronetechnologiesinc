/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * Trailer-type-first flow: trailer choice determines product steps, animations, and ERG requirements
 * Google Maps Places Autocomplete for origin/destination
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
  ArrowRight, ArrowLeft, AlertTriangle, Info, Search,
  Droplets, Wind, Box, Thermometer, Snowflake,
  Scale, Link2, Plus, Trash2, Calculator,
  GlassWater, MilkOff
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HazmatDecalPreview } from "@/components/HazmatDecal";
import { MultiTruckVisualization } from "@/components/TruckVisualization";
import RouteMap from "@/components/RouteMap";
import DatePicker from "@/components/DatePicker";

const ALL_STEPS = ["Trailer Type", "Product Classification", "SPECTRA-MATCH Verification", "Quantity & Weight", "Origin & Destination", "Catalyst Requirements", "Pricing", "Review"];

const TRAILER_TYPES = [
  { id: "liquid_tank", name: "Liquid Tank Trailer", desc: "MC-306/DOT-406 for petroleum, chemicals, liquid bulk", icon: "droplets", animType: "liquid" as const, hazmat: true, equipment: "tank", maxGal: 9500 },
  { id: "gas_tank", name: "Pressurized Gas Tank", desc: "MC-331 for LPG, ammonia, compressed gases", icon: "wind", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 11600 },
  { id: "dry_van", name: "Dry Van", desc: "General freight, palletized goods, packaged materials", icon: "box", animType: "solid" as const, hazmat: false, equipment: "dry-van", maxGal: 0 },
  { id: "reefer", name: "Refrigerated (Reefer)", desc: "Temperature-controlled: food, pharma, chemicals", icon: "thermometer", animType: "refrigerated" as const, hazmat: false, equipment: "reefer", maxGal: 0 },
  { id: "flatbed", name: "Flatbed", desc: "Oversized loads, heavy equipment, steel, lumber", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "flatbed", maxGal: 0 },
  { id: "bulk_hopper", name: "Dry Bulk / Hopper", desc: "Pneumatic: cement, lime, flour, plastic pellets", icon: "package", animType: "solid" as const, hazmat: false, equipment: "hopper", maxGal: 0 },
  { id: "hazmat_van", name: "Hazmat Box / Van", desc: "Packaged hazmat: batteries, chemicals, oxidizers", icon: "alert", animType: "hazmat" as const, hazmat: true, equipment: "dry-van", maxGal: 0 },
  { id: "cryogenic", name: "Cryogenic Tank", desc: "LNG, liquid nitrogen, liquid oxygen, liquid hydrogen", icon: "snowflake", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 10000 },
  { id: "food_grade_tank", name: "Food-Grade Liquid Tank", desc: "Milk, juice, cooking oil, wine, liquid sugar, edible oils", icon: "milkoff", animType: "liquid" as const, hazmat: false, equipment: "tank", maxGal: 6500 },
  { id: "water_tank", name: "Water Tank", desc: "Potable water, non-potable water, industrial water", icon: "glasswater", animType: "liquid" as const, hazmat: false, equipment: "tank", maxGal: 5500 },
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
  milkoff: <MilkOff className="w-8 h-8" />,
  glasswater: <GlassWater className="w-8 h-8" />,
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

  // Pre-fill from Hot Zones "Post Load" button query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill: Record<string, any> = {};
    if (params.get("origin")) prefill.origin = params.get("origin");
    if (params.get("suggestedRate")) prefill.rate = params.get("suggestedRate");
    if (params.get("equipment")) {
      const eq = params.get("equipment") || "";
      const match = TRAILER_TYPES.find(t => t.equipment === eq || t.id === eq);
      if (match) { prefill.trailerType = match.id; prefill.equipment = match.equipment; }
    }
    if (params.get("lat")) prefill.originLat = Number(params.get("lat"));
    if (params.get("lng")) prefill.originLng = Number(params.get("lng"));
    if (Object.keys(prefill).length > 0) {
      setFormData((prev: any) => ({ ...prev, ...prefill }));
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unSearchQuery, setUNSearchQuery] = useState("");
  const [showUNSuggestions, setShowUNSuggestions] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [productDropdownSearch, setProductDropdownSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const unSuggestRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
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

  // Multi-truck roster for variable capacity
  const [truckRoster, setTruckRoster] = useState<Array<{ id: string; name: string; capacity: number; fill: number }>>([]);
  const [usePerTruckCapacity, setUsePerTruckCapacity] = useState(false);
  const [linkedAgreementId, setLinkedAgreementId] = useState("");
  const removeTruckFromRoster = (id: string) => setTruckRoster(prev => prev.filter(t => t.id !== id));
  const updateTruckInRoster = (id: string, field: string, value: any) => setTruckRoster(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  // Agreement query for contract integration
  const agreementsQueryRaw = (trpc as any).agreements?.list?.useQuery?.(
    { status: "active" },
    { enabled: !!(formData.assignmentType === "direct_catalyst" || formData.assignmentType === "broker") }
  ) ?? { data: null, isLoading: false };
  const agreementsList: any[] = Array.isArray(agreementsQueryRaw.data) ? agreementsQueryRaw.data : (agreementsQueryRaw.data?.agreements ?? []);

  const selectedTrailer = TRAILER_TYPES.find(t => t.id === formData.trailerType);
  const isHazmat = selectedTrailer?.hazmat ?? false;
  const isLiquidOrGas = selectedTrailer?.animType === "liquid" || selectedTrailer?.animType === "gas";
  const isTanker = ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"].includes(formData.trailerType || "");

  // Unit-aware max capacity per truck (must match fleet calc unitMaxMap)
  const truckUnitDefaults = useMemo(() => {
    const unit = formData.quantityUnit || (isLiquidOrGas ? "Gallons" : "Pallets");
    const map: Record<string, { capacity: number; fill: number }> = {
      "Gallons": { capacity: selectedTrailer?.maxGal || 9500, fill: Math.round((selectedTrailer?.maxGal || 9500) * 0.9) },
      "Barrels": { capacity: 200, fill: 190 },
      "Liters": { capacity: 36000, fill: 34000 },
      "Pallets": { capacity: 24, fill: 22 },
      "Units": { capacity: 100, fill: 90 },
      "Cases": { capacity: 500, fill: 450 },
      "Boxes": { capacity: 1000, fill: 900 },
      "Pieces": { capacity: 20, fill: 18 },
      "Bundles": { capacity: 12, fill: 11 },
      "Linear Feet": { capacity: 53, fill: 48 },
      "Tons": { capacity: 25, fill: 23 },
      "Cubic Yards": { capacity: 35, fill: 32 },
      "Cubic Feet": { capacity: 1700, fill: 1500 },
      "Drums": { capacity: 80, fill: 72 },
      "PSI Units": { capacity: 300, fill: 270 },
      "Cubic Meters": { capacity: 40, fill: 36 },
    };
    return map[unit] || { capacity: 100, fill: 90 };
  }, [formData.quantityUnit, isLiquidOrGas, selectedTrailer]);

  const maxTrucksAllowed = useMemo(() => {
    const qty = Number(formData.quantity) || 0;
    if (qty <= 0) return 1;
    const avgFill = truckRoster.length > 0
      ? Math.max(truckRoster.reduce((s, t) => s + t.fill, 0) / truckRoster.length, 1)
      : truckUnitDefaults.fill;
    return Math.max(1, Math.ceil(qty / avgFill));
  }, [formData.quantity, truckRoster, truckUnitDefaults]);

  const addTruckToRoster = () => {
    if (truckRoster.length >= maxTrucksAllowed) return;
    setTruckRoster(prev => [...prev, {
      id: `t${Date.now()}`,
      name: `Truck ${prev.length + 1}`,
      capacity: truckUnitDefaults.capacity,
      fill: truckUnitDefaults.fill,
    }]);
  };

  // Fleet calculator — computes trucks needed, loads, costs
  const fleet = useMemo(() => {
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    const distance = formData.distance || 0;
    if (!selectedTrailer || qty <= 0) return null;

    const hasRoster = usePerTruckCapacity && truckRoster.length > 0;

    // Max capacity per truck based on unit type
    const unitMaxMap: Record<string, number> = {
      "Gallons": selectedTrailer.maxGal || 9000, "Barrels": 200, "Liters": 36000,
      "Pallets": 24, "Units": 100, "Cases": 500, "Boxes": 1000,
      "Pieces": 20, "Bundles": 12, "Linear Feet": 53, "Tons": 25,
      "Cubic Yards": 35, "Cubic Feet": 1700, "Drums": 80, "PSI Units": 300,
      "Cubic Meters": 40,
    };
    const unit = formData.quantityUnit || (isLiquidOrGas ? "Gallons" : "Pallets");
    const defaultMax = unitMaxMap[unit] || 100;

    let totalLoads = 0;
    let truckBreakdown: Array<{ name: string; capacity: number; fill: number; loads: number; volume: number }> = [];

    if (hasRoster) {
      let remaining = qty;
      const totalFill = truckRoster.reduce((s, t) => s + t.fill, 0);
      for (const t of truckRoster) {
        const proportion = totalFill > 0 ? t.fill / totalFill : 1 / truckRoster.length;
        const allocated = Math.min(remaining, qty * proportion);
        const loads = Math.ceil(allocated / t.fill);
        truckBreakdown.push({ name: t.name, capacity: t.capacity, fill: t.fill, loads, volume: loads * t.fill });
        totalLoads += loads;
        remaining -= allocated;
      }
      if (remaining > 0 && truckBreakdown.length > 0) {
        const extra = Math.ceil(remaining / truckRoster[0].fill);
        truckBreakdown[0].loads += extra;
        truckBreakdown[0].volume += extra * truckRoster[0].fill;
        totalLoads += extra;
      }
    } else {
      totalLoads = Math.ceil(qty / defaultMax);
    }

    const trucksNeeded = hasRoster ? truckRoster.length : totalLoads;
    const PLATFORM_FEE_PCT = 0.08;
    const totalJobCost = totalLoads * rate;
    const platformFee = totalJobCost * PLATFORM_FEE_PCT;
    const totalWithFee = totalJobCost + platformFee;

    return {
      totalLoads, trucksNeeded, unit, defaultMax,
      totalJobCost, platformFee, totalWithFee,
      hasRoster, truckBreakdown,
    };
  }, [formData.quantity, formData.quantityUnit, formData.rate, formData.distance, selectedTrailer, truckRoster, usePerTruckCapacity, isLiquidOrGas]);

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
      case "food_grade_tank": return ["Gallons", "Barrels", "Liters"];
      case "water_tank": return ["Gallons", "Barrels", "Liters"];
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
      case "food_grade_tank": return "6000";
      case "water_tank": return "5000";
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

  // Non-hazmat product dropdown — 50 products per trailer type
  const productListQuery = (trpc as any).trailerRegulatory?.getProductsByTrailerType?.useQuery?.(
    { trailerType: formData.trailerType || "", search: productDropdownSearch || undefined },
    { enabled: !!formData.trailerType && !isHazmat, staleTime: 60000 }
  ) ?? { data: null, isLoading: false };
  const productList: Array<{ id: string; name: string; category: string; notes?: string; freightClass?: string }> = productListQuery.data?.products || [];

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
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) setShowProductDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const createLoadMutation = (trpc as any).loads.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Load created successfully", { description: `Load ${data.loadNumber || ''} posted to marketplace` });
      // Post to loadBoard for enhanced matching
      if (data.loadId && selectedTrailer) {
        try {
          const isHz = selectedTrailer.hazmat && formData.hazmatClass;
          postToLoadBoardMutation.mutate({
            origin: { facility: "", address: formData.origin?.split(",")[0]?.trim() || "", city: formData.origin?.split(",")[0]?.trim() || "", state: formData.origin?.split(",")[1]?.trim() || "", zip: "", contact: "", phone: "" },
            destination: { facility: "", address: formData.destination?.split(",")[0]?.trim() || "", city: formData.destination?.split(",")[0]?.trim() || "", state: formData.destination?.split(",")[1]?.trim() || "", zip: "", contact: "", phone: "" },
            pickupDate: formData.pickupDate || new Date().toISOString(),
            deliveryDate: formData.deliveryDate || new Date().toISOString(),
            commodity: formData.productName || "General Freight",
            weight: Number(formData.weight) || 0,
            equipmentType: selectedTrailer.equipment || "dry-van",
            hazmat: !!isHz,
            hazmatClass: isHz ? formData.hazmatClass : undefined,
            unNumber: isHz ? formData.unNumber : undefined,
            rate: Number(formData.rate) || 0,
          });
        } catch (e) { /* non-blocking */ }
      }
      // Navigate to the new load detail page
      navigate(`/loads/${data.loadId || data.id}`);
    },
    onError: (error: any) => { setIsSubmitting(false); toast.error("Failed", { description: error.message }); },
  });

  // Also post to loadBoard for enhanced matching (hazmat-aware, trailer type enriched)
  const postToLoadBoardMutation = (trpc as any).loadBoard.postLoad.useMutation({
    onSuccess: () => console.log("[LoadCreationWizard] Load also posted to loadBoard"),
    onError: (e: any) => console.warn("[LoadCreationWizard] loadBoard.postLoad failed:", e.message),
  });

  // Fetch dynamic trailer types from loadBoard (20 types with DOT specs)
  const dynamicTrailerTypesQuery = (trpc as any).loadBoard.getTrailerTypes.useQuery({ category: "all" });
  const dynamicHazmatClassesQuery = (trpc as any).loadBoard.getHazmatClassRequirements.useQuery({});

  // Hot Zones-powered instant rate intelligence (fires on Step 6 when origin/dest available)
  const originParts = (formData.origin || "").split(",").map((s: string) => s.trim());
  const destParts = (formData.destination || "").split(",").map((s: string) => s.trim());
  const hzQuoteQuery = (trpc as any).quotes.getInstant.useQuery(
    {
      origin: { city: originParts[0] || "", state: originParts[1] || "", lat: formData.originLat || undefined, lng: formData.originLng || undefined },
      destination: { city: destParts[0] || "", state: destParts[1] || "", lat: formData.destLat || undefined, lng: formData.destLng || undefined },
      equipmentType: selectedTrailer?.equipment === "tank" ? "tanker" : selectedTrailer?.equipment || "dry_van",
      hazmat: !!(selectedTrailer?.hazmat && formData.hazmatClass),
      hazmatClass: formData.hazmatClass || undefined,
      pickupDate: formData.pickupDate || new Date().toISOString(),
    },
    { enabled: rs >= 6 && !!originParts[0] && !!destParts[0], staleTime: 120_000 }
  );

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
      originLat: formData.originLat || 0,
      originLng: formData.originLng || 0,
      destLat: formData.destLat || 0,
      destLng: formData.destLng || 0,
      distance: formData.distance || 0,
      pickupDate: formData.pickupDate,
      deliveryDate: formData.deliveryDate,
      equipment: selectedTrailer?.equipment || formData.equipment,
      trailerType: formData.trailerType,
      compartments: formData.compartments || 1,
      compartmentProducts: formData.compartmentProducts || undefined,
      rate: formData.rate,
      ratePerMile: formData.ratePerMile,
      assignmentType: formData.assignmentType || "open_market",
      linkedAgreementId: linkedAgreementId && linkedAgreementId !== "none" ? linkedAgreementId : undefined,
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
                      <EsangIcon className="w-4 h-4 mr-2" />ESANG AI
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
                      <div className="flex items-center gap-2 text-slate-400 text-sm"><EsangIcon className="w-4 h-4 animate-spin" />Searching ERG 2020 database...</div>
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
                  <div ref={productDropdownRef} className="relative">
                    <label className="text-sm text-slate-400 mb-1 block">Product / Commodity</label>
                    {isOtherProduct ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input value={formData.productName || ""} onChange={(e: any) => updateField("productName", e.target.value)}
                            placeholder="Type your product name..."
                            className="bg-slate-700/50 border-slate-600/50 rounded-lg pl-10" />
                        </div>
                        <Button variant="outline" size="sm" className="text-slate-400 border-slate-600/50 hover:bg-slate-700/50 rounded-lg"
                          onClick={() => { setIsOtherProduct(false); updateField("productName", ""); updateField("productId", ""); }}>
                          Back to list
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                        <Input
                          value={formData.productName && !showProductDropdown ? formData.productName : productDropdownSearch}
                          onChange={(e: any) => {
                            setProductDropdownSearch(e.target.value);
                            setShowProductDropdown(true);
                            if (!e.target.value) { updateField("productName", ""); updateField("productId", ""); }
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder={`Search ${productList.length || 50} products for ${selectedTrailer?.name || "this trailer"}...`}
                          className="bg-slate-700/50 border-slate-600/50 rounded-lg pl-10" />
                        {showProductDropdown && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-700/50 sticky top-0 bg-slate-800">
                              {selectedTrailer?.name} -- {productList.length} products {productDropdownSearch ? `matching "${productDropdownSearch}"` : ""}
                            </div>
                            {productListQuery.isLoading ? (
                              <div className="p-3 flex items-center gap-2 text-slate-400 text-sm">
                                <Search className="w-4 h-4 animate-spin" />Loading products...
                              </div>
                            ) : productList.length === 0 && productDropdownSearch ? (
                              <div className="p-3 text-slate-500 text-sm">No products match "{productDropdownSearch}"</div>
                            ) : null}
                            {productList.map((p: any) => (
                              <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-700/20 last:border-0 transition-colors"
                                onClick={() => {
                                  updateField("productName", p.name);
                                  updateField("productId", p.id);
                                  updateField("productCategory", p.category);
                                  updateField("freightClass", p.freightClass || "");
                                  setProductDropdownSearch("");
                                  setShowProductDropdown(false);
                                  if (p.notes) toast.info(p.name, { description: p.notes });
                                }}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                                  {p.notes && <p className="text-slate-500 text-[10px] truncate">{p.notes}</p>}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">{p.category}</Badge>
                                  {p.freightClass && <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">FC {p.freightClass}</Badge>}
                                </div>
                              </button>
                            ))}
                            <button className="w-full text-left px-3 py-2.5 hover:bg-purple-500/10 flex items-center gap-2 border-t border-slate-600/50 transition-colors"
                              onClick={() => { setIsOtherProduct(true); setShowProductDropdown(false); setProductDropdownSearch(""); updateField("productName", ""); updateField("productId", "other"); }}>
                              <Plus className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-400 text-sm font-medium">Other -- Type product name manually</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {formData.productName && !showProductDropdown && !isOtherProduct && (
                      <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div>
                            <p className="text-cyan-400 text-sm font-medium">{formData.productName}</p>
                            <p className="text-slate-500 text-[10px]">{formData.productCategory || ""}{formData.freightClass ? ` -- Freight Class ${formData.freightClass}` : ""}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white h-6 px-2" onClick={() => { updateField("productName", ""); updateField("productId", ""); updateField("productCategory", ""); updateField("freightClass", ""); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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
                  {(selectedTrailer?.id === "food_grade_tank" || selectedTrailer?.id === "water_tank") && (
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Required Temperature Range (optional)</label>
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
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /><span className="text-slate-500 text-xs">{selectedTrailer?.id === "food_grade_tank" ? "Food-grade liquid load -- requires food safety certification & tanker endorsement. No hazmat classification needed." : selectedTrailer?.id === "water_tank" ? "Water tanker load -- requires tanker endorsement. No hazmat classification needed." : `Non-hazmat load -- no ERG classification required for ${selectedTrailer?.name}.`}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SPECTRA-MATCH Verification (hazmat only) */}
          {rs === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <EsangIcon className="w-5 h-5 text-cyan-400" />
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
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><EsangIcon className="w-3 h-3 animate-spin" />Searching ERG 2020...</div>
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

              {/* Fleet Calculator Panel */}
              {fleet && fleet.totalLoads > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#1473FF]/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-[#1473FF]" />
                      <span className="text-white font-bold text-sm">Fleet Calculator</span>
                      <Badge variant="outline" className="text-[10px] border-[#BE01FF]/30 text-[#BE01FF]">{fleet.totalLoads} load{fleet.totalLoads !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setUsePerTruckCapacity(false); }} className={cn("px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors", !usePerTruckCapacity ? "bg-[#1473FF] text-white" : "bg-slate-700/50 text-slate-400")}>Uniform</button>
                      <button onClick={() => { setUsePerTruckCapacity(true); if (truckRoster.length === 0) addTruckToRoster(); }} className={cn("px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors", usePerTruckCapacity ? "bg-[#BE01FF] text-white" : "bg-slate-700/50 text-slate-400")}>Per Truck</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Total Loads</p><p className="text-white text-lg font-bold">{fleet.totalLoads}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Trucks Needed</p><p className="text-[#1473FF] text-lg font-bold">{fleet.trucksNeeded}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Max Per Truck</p><p className="text-[#BE01FF] text-lg font-bold">{fleet.defaultMax.toLocaleString()} {fleet.unit?.toLowerCase().slice(0, 3)}</p></div>
                  </div>

                  {/* Per-Truck Roster */}
                  {usePerTruckCapacity && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-700/30">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Variable Capacity Roster</p>
                      {truckRoster.map((t, i) => (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40">
                          <span className="text-[10px] font-mono text-slate-500 w-5 text-center">{i + 1}</span>
                          <Input value={t.name} onChange={e => updateTruckInRoster(t.id, "name", e.target.value)} className="h-7 text-xs bg-slate-700/50 border-slate-600/50 rounded w-24" />
                          <div className="flex items-center gap-1"><span className="text-[9px] text-slate-500">Max</span><Input type="number" value={t.capacity} onChange={e => updateTruckInRoster(t.id, "capacity", parseInt(e.target.value) || 0)} className="h-7 text-xs bg-slate-700/50 border-slate-600/50 rounded w-16" /></div>
                          <div className="flex items-center gap-1"><span className="text-[9px] text-slate-500">Fill</span><Input type="number" value={t.fill} onChange={e => updateTruckInRoster(t.id, "fill", parseInt(e.target.value) || 0)} className="h-7 text-xs bg-slate-700/50 border-slate-600/50 rounded w-16" /></div>
                          <Badge variant="outline" className={cn("text-[9px] border-0", t.fill > 0 && t.capacity > 0 ? "bg-green-500/15 text-green-400" : "bg-slate-500/15 text-slate-400")}>{t.capacity > 0 ? Math.round((t.fill / t.capacity) * 100) : 0}%</Badge>
                          <button onClick={() => removeTruckFromRoster(t.id)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {truckRoster.length >= maxTrucksAllowed ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-red-500/30 text-red-400/60 text-xs">
                          <AlertTriangle className="w-3 h-3" />Max {maxTrucksAllowed} truck{maxTrucksAllowed !== 1 ? "s" : ""} for {Number(formData.quantity).toLocaleString()} {fleet?.unit?.toLowerCase() || "units"}
                        </div>
                      ) : (
                        <button onClick={addTruckToRoster} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-600/50 text-slate-400 text-xs hover:bg-slate-800/30 transition-colors">
                          <Plus className="w-3 h-3" />Add Truck ({truckRoster.length}/{maxTrucksAllowed})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Per-truck load distribution */}
                  {fleet.hasRoster && fleet.truckBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Load Distribution</p>
                      {fleet.truckBreakdown.map((tb, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/30 text-xs">
                          <span className="text-white font-medium">{tb.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{tb.fill}/{tb.capacity}</span>
                            <Badge variant="outline" className="text-[9px] border-[#1473FF]/30 text-[#1473FF]">{tb.loads} loads</Badge>
                            <span className="text-slate-300 font-mono">{tb.volume.toLocaleString()} {fleet.unit?.toLowerCase().slice(0, 3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

          {/* STEP 5: Catalyst Requirements */}
          {rs === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div><label className="text-sm text-slate-400 mb-1 block">Minimum Safety Score</label><Input type="number" value={formData.minSafetyScore || ""} onChange={(e: any) => updateField("minSafetyScore", e.target.value)} placeholder="e.g., 80" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Required Endorsements</label><Input value={formData.endorsements || ""} onChange={(e: any) => updateField("endorsements", e.target.value)} placeholder={isHazmat ? "Hazmat, Tanker" : "e.g., Tanker, Doubles/Triples"} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              {isHazmat && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /><span className="text-orange-400 text-sm font-medium">Hazmat load requires HM endorsement on CDL</span></div>
                  <p className="text-slate-400 text-xs mt-1">Catalyst must have active hazmat endorsement and appropriate insurance coverage.</p>
                </div>
              )}

              {/* Assignment Type */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Assignment Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { v: "open_market", label: "Open Market", desc: "Post to all catalysts" },
                    { v: "direct_catalyst", label: "Direct Catalyst", desc: "Assign to specific catalyst" },
                    { v: "broker", label: "Via Broker", desc: "Let a broker coordinate" },
                    { v: "own_fleet", label: "Own Fleet", desc: "Use your own trucks" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => updateField("assignmentType", opt.v)}
                      className={cn("p-3 rounded-xl border text-left transition-all", formData.assignmentType === opt.v ? "border-[#1473FF] bg-[#1473FF]/10" : "border-slate-700 bg-slate-800/30 hover:border-slate-600")}>
                      <p className="text-white text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agreement/Contract Linking */}
              {(formData.assignmentType === "direct_catalyst" || formData.assignmentType === "broker") && (
                <div className="p-4 rounded-xl bg-[#1473FF]/5 border border-[#1473FF]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-[#1473FF]" />
                    <span className="text-white font-semibold text-sm">Link to Agreement</span>
                    <Badge variant="outline" className="text-[10px] border-[#1473FF]/30 text-[#1473FF]">Contract Integration</Badge>
                  </div>
                  <p className="text-slate-400 text-[10px] mb-2">Link this load to an existing agreement to auto-populate rate and payment terms.</p>
                  <Select value={linkedAgreementId} onValueChange={(v) => {
                    setLinkedAgreementId(v);
                    const ag = agreementsList.find((a: any) => String(a.id) === v);
                    if (ag?.baseRate) updateField("rate", String(parseFloat(ag.baseRate)));
                    if (ag?.ratePerMile) updateField("ratePerMile", String(parseFloat(ag.ratePerMile)));
                  }}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select an active agreement (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Agreement</SelectItem>
                      {agreementsList.map((ag: any) => (
                        <SelectItem key={ag.id} value={String(ag.id)}>
                          #{ag.agreementNumber || ag.id} - {ag.type?.replace(/_/g, " ")} - ${ag.baseRate ? parseFloat(ag.baseRate).toLocaleString() : "N/A"}/load
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {linkedAgreementId && linkedAgreementId !== "none" && (() => {
                    const ag = agreementsList.find((a: any) => String(a.id) === linkedAgreementId);
                    if (!ag) return null;
                    return (
                      <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium">Linked: #{ag.agreementNumber || ag.id}</p>
                          <p className="text-slate-400 text-[10px]">Rate: ${ag.baseRate ? parseFloat(ag.baseRate).toLocaleString() : "N/A"} / {ag.rateType?.replace(/_/g, " ") || "per load"}</p>
                        </div>
                      </div>
                    );
                  })()}
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

              {/* ESANG AI Rate Intelligence — Powered by Hot Zones */}
              {formData.distance && (formData.rate || formData.ratePerMile) && (() => {
                const hz = hzQuoteQuery.data;
                const hzRate = hz?.pricing?.ratePerMile || 0;
                const marketRPM = hzRate > 0 ? hzRate : (selectedTrailer?.hazmat ? 4.20 : selectedTrailer?.equipment === "reefer" ? 3.10 : selectedTrailer?.equipment === "flatbed" ? 2.90 : 2.50) * (formData.distance < 200 ? 1.25 : formData.distance < 500 ? 1.0 : 0.85);
                const marketLow = hz?.marketComparison ? Math.round((hz.marketComparison.low / Math.max(formData.distance, 1)) * 100) / 100 : Math.round(marketRPM * 0.85 * 100) / 100;
                const marketHigh = hz?.marketComparison ? Math.round((hz.marketComparison.high / Math.max(formData.distance, 1)) * 100) / 100 : Math.round(marketRPM * 1.18 * 100) / 100;
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

                const intel = hz?.intelligence;
                const demandColor = (d: string) => d === "VERY_HIGH" ? "text-red-400" : d === "HIGH" ? "text-orange-400" : d === "MODERATE" ? "text-yellow-400" : "text-slate-400";

                return (
                  <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2 mb-4">
                      <EsangIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span className="text-sm font-bold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent">ESANG AI Rate Intelligence</span>
                      {hzRate > 0 && <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-[8px] px-1.5 py-0 ml-auto">HOT ZONES</Badge>}
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

                    {/* Hot Zone demand + surge badges */}
                    {intel && (intel.originZone || intel.destZone || intel.originSurge > 1.05) && (
                      <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                        {intel.originZone && (
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/30", demandColor(intel.originDemand))}>
                            {intel.originZone}: {intel.originDemand.replace("_", " ")}
                          </span>
                        )}
                        {intel.destZone && (
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/30", demandColor(intel.destDemand))}>
                            {intel.destZone}: {intel.destDemand.replace("_", " ")}
                          </span>
                        )}
                        {(intel.originSurge > 1.05 || intel.destSurge > 1.05) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            Surge +{Math.round(((intel.originSurge + intel.destSurge) / 2 - 1) * 100)}%
                          </span>
                        )}
                      </div>
                    )}

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
                        <EsangIcon className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300">ESANG Recommendation</span>
                        {hz?.pricing?.fuelPricePerGal && <span className="text-[9px] text-slate-500 ml-auto">Diesel: ${hz.pricing.fuelPricePerGal}/gal</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market Low</p><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">${marketLow}/mi</p></div>
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market Avg</p><p className="text-emerald-600 dark:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-xs font-bold">${Math.round(marketRPM * 100) / 100}/mi</p></div>
                        <div><p className="text-[10px] text-slate-400 dark:text-slate-500">Market High</p><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">${marketHigh}/mi</p></div>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">Suggested total: <span className="text-purple-600 dark:text-purple-300 font-bold">${marketTotal.toLocaleString()}</span> for {formData.distance} mi</p>
                      {intel?.laneAvgRate && (
                        <p className="text-[10px] text-cyan-400 mt-1 text-center">Lane history: ${intel.laneAvgRate}/mi {intel.laneOnTimePercent ? `(${intel.laneOnTimePercent}% on-time)` : ""}</p>
                      )}
                    </div>

                    {/* Weather alerts */}
                    {intel?.weatherAlerts?.length > 0 && (
                      <div className="mt-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        {intel.weatherAlerts.map((a: string, i: number) => (
                          <p key={i} className="text-[10px] text-amber-400 leading-tight">{a}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Platform Fee & Total Job Cost */}
              {fleet && fleet.totalLoads > 1 && Number(formData.rate) > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#1473FF]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-[#BE01FF]" />
                    <span className="text-white font-bold text-sm">Multi-Load Job Cost</span>
                    <Badge variant="outline" className="text-[10px] border-[#BE01FF]/30 text-[#BE01FF]">{fleet.totalLoads} loads</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Rate / Load</p><p className="text-white text-sm font-bold">${Number(formData.rate).toLocaleString()}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Catalyst Payout</p><p className="text-white text-sm font-bold">${fleet.totalJobCost.toLocaleString()}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Platform Fee (8%)</p><p className="text-[#BE01FF] text-sm font-bold">${fleet.platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    <div className="p-2 rounded-lg bg-slate-800/50"><p className="text-[10px] text-slate-500">Total w/ Fee</p><p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-sm font-bold">${fleet.totalWithFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Review */}
          {rs === 7 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* ── Header ── */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Review Your Load</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Verify all details before posting to the market</p>
                </div>
                <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs px-3 py-1">
                  {formData.assignmentType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Open Market"}
                </Badge>
              </div>

              {/* ── SPECTRA-MATCH Verified Banner ── */}
              {formData.spectraVerified && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-sm">SPECTRA-MATCH Verified</span>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 ml-auto">ERG 2020</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Product</p><p className="text-white text-sm font-semibold truncate mt-0.5">{formData.productName}</p></div>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30"><p className="text-[10px] text-slate-500 uppercase tracking-wider">UN Number</p><p className="text-cyan-400 text-sm font-bold mt-0.5">{formData.unNumber}</p></div>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Hazmat Class</p><p className="text-purple-400 text-sm font-semibold mt-0.5">{formData.hazmatClass} - {formData.placardName}</p></div>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30"><p className="text-[10px] text-slate-500 uppercase tracking-wider">ERG Guide</p><p className="text-white text-sm font-semibold mt-0.5">Guide {formData.ergGuide}</p></div>
                  </div>
                  {(formData.isTIH || formData.isWR) && (
                    <div className="flex gap-2 mt-3">
                      {formData.isTIH && <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/25"><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-red-400 text-[10px] font-bold">TOXIC INHALATION HAZARD</span></div>}
                      {formData.isWR && <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/25"><AlertTriangle className="w-3 h-3 text-blue-400" /><span className="text-blue-400 text-[10px] font-bold">WATER-REACTIVE</span></div>}
                    </div>
                  )}
                </div>
              )}

              {/* ── Cargo Section ── */}
              <div className="rounded-2xl border border-slate-700/40 overflow-hidden">
                <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/40 flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Cargo Details</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Trailer</p><p className="text-white text-sm font-semibold">{selectedTrailer?.name}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Product</p><p className="text-white text-sm font-semibold">{formData.productName}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Volume</p><p className="text-white text-sm font-semibold">{formData.quantity} {formData.quantityUnit || (isLiquidOrGas ? "Gallons" : "Pallets")}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Weight</p><p className="text-white text-sm font-semibold">{formData.weight} {formData.weightUnit || "lbs"}</p></div>
                    {isTanker && <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Compartments</p><p className="text-white text-sm font-semibold">{formData.compartments || 1}</p></div>}
                    {formData.hazmatClass && !formData.spectraVerified && <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hazmat Class</p><p className="text-orange-400 text-sm font-semibold">{HAZMAT_CLASSES.find(c => c.id === formData.hazmatClass)?.name || formData.hazmatClass}</p></div>}
                    {formData.unNumber && !formData.spectraVerified && <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">UN Number</p><p className="text-cyan-400 text-sm font-semibold">{formData.unNumber}</p></div>}
                    {formData.ergGuide && !formData.spectraVerified && <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">ERG Guide</p><p className="text-white text-sm font-semibold">Guide {formData.ergGuide}</p></div>}
                  </div>
                </div>
              </div>

              {/* ── Route Section ── */}
              <div className="rounded-2xl border border-slate-700/40 overflow-hidden">
                <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/40 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Route</span>
                  {formData.distance && <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 ml-auto">{formData.distance} miles</Badge>}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><p className="text-[10px] text-slate-500 uppercase tracking-wider">Origin</p></div>
                      <p className="text-white text-sm font-semibold pl-[18px]">{formData.origin}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><p className="text-[10px] text-slate-500 uppercase tracking-wider">Destination</p></div>
                      <p className="text-white text-sm font-semibold pl-[18px]">{formData.destination}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pickup</p><p className="text-white text-sm font-semibold">{formData.pickupDate || "Flexible"}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Delivery</p><p className="text-white text-sm font-semibold">{formData.deliveryDate || "Flexible"}</p></div>
                  </div>
                  {/* Route Map Preview */}
                  {formData.originLat && formData.destLat && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/30">
                      <RouteMap originLat={formData.originLat} originLng={formData.originLng} destLat={formData.destLat} destLng={formData.destLng} originLabel={formData.origin} destLabel={formData.destination} height="220px" />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Pricing Section ── */}
              <div className="rounded-2xl border border-slate-700/40 overflow-hidden">
                <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/40 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Pricing</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Rate</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(formData.rate || 0).toLocaleString()}</p>
                    </div>
                    {formData.distance && formData.rate && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Rate / Mile</p>
                        <p className="text-2xl font-bold text-white">${(Number(formData.rate) / formData.distance).toFixed(2)}<span className="text-sm text-slate-400 font-normal">/mi</span></p>
                      </div>
                    )}
                    {formData.distance && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Distance</p>
                        <p className="text-2xl font-bold text-white">{formData.distance}<span className="text-sm text-slate-400 font-normal"> mi</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Fleet Summary (multi-load) ── */}
              {fleet && fleet.totalLoads > 1 && (
                <div className="rounded-2xl border border-[#1473FF]/30 bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-800/60 border-b border-[#1473FF]/20 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#1473FF]" />
                    <span className="text-sm font-semibold text-white">Fleet Summary</span>
                    <Badge variant="outline" className="text-[10px] border-[#BE01FF]/30 text-[#BE01FF] ml-auto">{fleet.totalLoads} loads</Badge>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Loads</p><p className="text-[#1473FF] text-xl font-bold mt-1">{fleet.totalLoads}</p></div>
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Trucks</p><p className="text-[#BE01FF] text-xl font-bold mt-1">{fleet.trucksNeeded}</p></div>
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Catalyst Payout</p><p className="text-white text-xl font-bold mt-1">${fleet.totalJobCost.toLocaleString()}</p></div>
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Total w/ Fee</p><p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-xl font-bold mt-1">${fleet.totalWithFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    </div>
                    {fleet.hasRoster && fleet.truckBreakdown.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-700/30 space-y-1.5">
                        {fleet.truckBreakdown.map((tb, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/30 text-xs">
                            <span className="text-white font-medium">{tb.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">{tb.fill}/{tb.capacity}</span>
                              <Badge variant="outline" className="text-[9px] border-[#1473FF]/30 text-[#1473FF]">{tb.loads} loads</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Linked Agreement ── */}
              {linkedAgreementId && linkedAgreementId !== "none" && (
                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">Linked Agreement</p>
                    <p className="text-slate-400 text-xs">Contract #{linkedAgreementId} — rates auto-applied</p>
                  </div>
                </div>
              )}

              {/* ── Compartment Breakdown (multi-comp tankers) ── */}
              {(formData.compartments || 1) > 1 && formData.compartmentProducts?.length > 0 && (
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-800/60 border-b border-blue-500/15 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Compartment Breakdown</span>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 ml-auto">{formData.compartments} comp.</Badge>
                  </div>
                  <div className="p-5 space-y-2">
                    {(formData.compartmentProducts as any[]).map((cp: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/20">
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
                    {(() => {
                      const totalVol = (formData.compartmentProducts as any[]).reduce((s: number, cp: any) => s + (Number(cp.volume) || 0), 0);
                      return totalVol > 0 ? (
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-700/30">
                          <span className="text-slate-400 text-xs font-medium">Total Volume</span>
                          <span className="text-white text-sm font-bold">{totalVol.toLocaleString()} {currentUnit === "Gallons" ? "gal" : currentUnit === "Barrels" ? "bbl" : currentUnit.toLowerCase().slice(0, 3)}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* ── SPECTRA-MATCH Parameters ── */}
              {(formData.apiGravity || formData.bsw || formData.sulfurContent || formData.flashPoint) && (
                <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-800/60 border-b border-purple-500/15 flex items-center gap-2">
                    <EsangIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">SPECTRA-MATCH Parameters</span>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.apiGravity && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">API Gravity</p><p className="text-white text-sm font-semibold mt-0.5">{formData.apiGravity}</p></div>}
                    {formData.bsw && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">BS&W</p><p className="text-white text-sm font-semibold mt-0.5">{formData.bsw}%</p></div>}
                    {formData.sulfurContent && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Sulfur</p><p className="text-white text-sm font-semibold mt-0.5">{formData.sulfurContent}%</p></div>}
                    {formData.flashPoint && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Flash Point</p><p className="text-white text-sm font-semibold mt-0.5">{formData.flashPoint}F</p></div>}
                    {formData.viscosity && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Viscosity</p><p className="text-white text-sm font-semibold mt-0.5">{formData.viscosity} cSt</p></div>}
                    {formData.pourPoint && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Pour Point</p><p className="text-white text-sm font-semibold mt-0.5">{formData.pourPoint}F</p></div>}
                    {formData.reidVaporPressure && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">RVP</p><p className="text-white text-sm font-semibold mt-0.5">{formData.reidVaporPressure} psi</p></div>}
                    {formData.appearance && <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/20"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Appearance</p><p className="text-white text-sm font-semibold mt-0.5">{formData.appearance}</p></div>}
                  </div>
                </div>
              )}
              {formData.hazmatClass && <div className="mt-2"><HazmatDecalPreview hazmatClass={formData.hazmatClass} unNumber={formData.unNumber} productName={formData.productName} /></div>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 rounded-lg" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
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
