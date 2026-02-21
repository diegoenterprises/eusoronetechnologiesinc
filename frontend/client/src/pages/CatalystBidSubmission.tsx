/**
 * CATALYST BID SUBMISSION WIZARD
 * Multi-step bid flow — matches the shipper's LoadCreationWizard design standard.
 * Steps: Load Review → Your Bid (with ESANG Rate Intelligence) → Equipment & Driver → Schedule → Review & Submit
 * Theme-aware | Brand gradient | ESANG AI Rate Gauge | Animations
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Truck, AlertTriangle, CheckCircle, Calendar,
  Package, ArrowRight, ArrowLeft, Navigation, Building2,
  User, Clock, Shield, FileText, Loader2, Gavel, Droplets, FlaskConical
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import DatePicker from "@/components/DatePicker";

const STEPS = ["Load Review", "Your Bid", "Equipment & Driver", "Schedule & Notes", "Review & Submit"];

const SPECTRA_CARGO_TYPES = ["hazmat", "liquid", "gas", "chemicals", "petroleum"];
const SPECTRA_KEYWORDS = ["crude", "oil", "petroleum", "condensate", "bitumen", "naphtha", "diesel", "gasoline", "kerosene", "fuel", "lpg", "propane", "butane", "ethanol", "methanol"];
function isSpectraQualified(cargoType?: string, commodity?: string, hazmatClass?: string): boolean {
  if (cargoType && SPECTRA_CARGO_TYPES.includes(cargoType)) return true;
  if (["2", "3"].includes(hazmatClass || "")) return true;
  if (cargoType && ["refrigerated", "oversized", "general"].includes(cargoType)) return false;
  const c = (commodity || "").toLowerCase();
  if (SPECTRA_KEYWORDS.some(k => c.includes(k))) return true;
  return false;
}

function getCargoIcon(cargoType: string) {
  if (cargoType === "petroleum" || cargoType === "liquid") return <Droplets className="w-5 h-5" />;
  if (cargoType === "chemicals" || cargoType === "hazmat") return <FlaskConical className="w-5 h-5" />;
  return <Package className="w-5 h-5" />;
}

export default function CatalystBidSubmission() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const loadId = params.loadId || params.id;

  const [step, setStep] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [rateMode, setRateMode] = useState<"total" | "perMile">("total");
  const [ratePerMileInput, setRatePerMileInput] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [estimatedPickup, setEstimatedPickup] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [bidStrategy, setBidStrategy] = useState<"AGGRESSIVE" | "COMPETITIVE" | "PREMIUM">("COMPETITIVE");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId! }, { enabled: !!loadId });
  const driversQuery = (trpc as any).drivers.getAvailable.useQuery();
  const fleetQuery = (trpc as any).fleet?.getVehicles?.useQuery?.() || { data: [], isLoading: false };

  const submitBidMutation = (trpc as any).loads.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully!", { description: "You'll be notified when the shipper responds." });
      setLocation("/bids");
    },
    onError: (error: any) => toast.error("Failed to submit bid", { description: error.message }),
  });

  const load = loadQuery.data;
  const distance = Number(load?.distance) || 0;
  const targetRate = Number(load?.rate) || 0;

  const ratePerMile = useMemo(() => {
    const amt = parseFloat(bidAmount);
    if (!amt || !distance) return "0.00";
    return (amt / distance).toFixed(2);
  }, [bidAmount, distance]);

  // ML Bid Optimizer — suggests optimal bid amount based on lane history
  const mlOriginState = ((load?.pickupLocation as any)?.state || "").toUpperCase().substring(0, 2);
  const mlDestState = ((load?.deliveryLocation as any)?.state || "").toUpperCase().substring(0, 2);
  const mlBidOptimizer = (trpc as any).ml?.optimizeBid?.useQuery?.(
    { originState: mlOriginState, destState: mlDestState, distance, postedRate: targetRate || undefined, cargoType: load?.cargoType || "general", equipmentType: load?.equipmentType || "dry_van", strategy: bidStrategy },
    { enabled: !!load && distance > 0 && !!mlOriginState && !!mlDestState, staleTime: 120_000 }
  ) || { data: null };
  const mlETA = (trpc as any).ml?.predictETA?.useQuery?.(
    { originState: mlOriginState, destState: mlDestState, distance, equipmentType: load?.equipmentType || "dry_van", cargoType: load?.cargoType || "general" },
    { enabled: !!load && distance > 0 && !!mlOriginState && !!mlDestState, staleTime: 120_000 }
  ) || { data: null };

  // ESANG AI Rate Intelligence calculations
  const rateIntel = useMemo(() => {
    if (!distance || (!bidAmount && !ratePerMileInput)) return null;
    const isHazmat = isSpectraQualified(load?.cargoType, load?.commodity, load?.hazmatClass);
    const isReefer = load?.equipmentType === "reefer";
    const isFlatbed = load?.equipmentType === "flatbed";
    const baseRate = isHazmat ? 4.20 : isReefer ? 3.10 : isFlatbed ? 2.90 : 2.50;
    const distFactor = distance < 200 ? 1.25 : distance < 500 ? 1.0 : 0.85;
    const marketRPM = Math.round(baseRate * distFactor * 100) / 100;
    const marketLow = Math.round(marketRPM * 0.75 * 100) / 100;
    const marketHigh = Math.round(marketRPM * 1.30 * 100) / 100;
    const userRPM = Number(ratePerMile);
    const marketTotal = Math.round(marketRPM * distance);
    const ratio = userRPM / marketRPM;
    const clampedRatio = Math.max(0.5, Math.min(1.5, ratio));
    const gaugePercent = ((clampedRatio - 0.5) / 1.0) * 100;
    const ratingLabel = ratio < 0.80 ? "Below Market" : ratio < 0.95 ? "Competitive" : ratio <= 1.10 ? "Sweet Spot" : ratio <= 1.25 ? "Above Market" : "Premium";
    const ratingColor = ratio < 0.80 ? "#ef4444" : ratio < 0.95 ? "#f59e0b" : ratio <= 1.10 ? "#10b981" : ratio <= 1.25 ? "#f59e0b" : "#ef4444";
    const pastelColor = ratio < 0.80 ? "#f87171" : ratio < 0.95 ? "#fbbf24" : ratio <= 1.10 ? "#6ee7b7" : ratio <= 1.25 ? "#fbbf24" : "#f87171";
    const angle = -90 + (gaugePercent / 100) * 180;
    const needleRad = (angle * Math.PI) / 180;
    const nx = 100 + 65 * Math.cos(needleRad);
    const ny = 100 + 65 * Math.sin(needleRad);
    return { marketRPM, marketLow, marketHigh, userRPM, marketTotal, ratio, ratingLabel, ratingColor, pastelColor, nx, ny };
  }, [bidAmount, ratePerMileInput, distance, load]);

  const canProceed = () => {
    switch (step) {
      case 0: return !!load;
      case 1: return !!bidAmount && parseFloat(bidAmount) > 0;
      case 2: return true; // Driver optional
      case 3: return true; // Schedule optional
      case 4: return acceptedTerms;
      default: return true;
    }
  };

  const handleSubmit = () => {
    if (!bidAmount || isNaN(parseFloat(bidAmount))) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    submitBidMutation.mutate({
      loadId: Number(loadId),
      amount: parseFloat(bidAmount),
      notes: [notes, selectedDriver ? `Driver: ${selectedDriver}` : '', estimatedPickup ? `Pickup: ${estimatedPickup}` : '', estimatedDelivery ? `Delivery: ${estimatedDelivery}` : ''].filter(Boolean).join(' | ') || undefined,
    });
  };

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (loadQuery.error || !load) {
    return (
      <div className="p-4 md:p-6 max-w-[900px] mx-auto">
        <div className={cn("text-center py-16 rounded-2xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-red-50" : "bg-red-500/10")}>
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-800" : "text-white")}>Load not found</p>
          <p className="text-sm text-slate-400 mt-1">This load may have been removed or is no longer available.</p>
          <Button className="mt-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setLocation("/marketplace")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const originCity = load.origin?.city || load.pickupLocation?.city || "Origin";
  const originState = load.origin?.state || load.pickupLocation?.state || "";
  const destCity = load.destination?.city || load.deliveryLocation?.city || "Destination";
  const destState = load.destination?.state || load.deliveryLocation?.state || "";
  const hazmat = load.hazmatClass || (isSpectraQualified(load.cargoType, load.commodity, load.hazmatClass) ? "Hazardous" : null);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[900px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Place Bid
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            {load.loadNumber || `Load #${String(load.id).slice(0, 8)}`} — {originCity} to {destCity}
          </p>
        </div>
        <Button variant="ghost" className={cn("rounded-xl", isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")} onClick={() => setLocation("/marketplace")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Marketplace
        </Button>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                i === step
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg"
                  : i < step
                    ? isLight ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-emerald-500/15 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent border border-emerald-500/30"
                    : isLight ? "bg-slate-100 text-slate-400 border border-slate-200" : "bg-slate-800 text-slate-500 border border-slate-700/50"
              )}
            >
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>}
              <span className="hidden md:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 rounded-full", i < step ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : isLight ? "bg-slate-200" : "bg-slate-700")} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Wizard Card ── */}
      <Card className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-slate-800/60 border-slate-700/50")}>
        <CardContent className="p-6">

          {/* STEP 0: Load Review */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isLight ? "bg-blue-50" : "bg-blue-500/15")}>
                  {getCargoIcon(load.cargoType || "general")}
                </div>
                <div>
                  <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>
                    {load.cargoType === "petroleum" ? "Petroleum Load" : load.cargoType === "chemicals" ? "Chemical Load" : load.commodity || "General Cargo"}
                  </p>
                  <p className="text-xs text-slate-400">{load.equipmentType ? `${load.equipmentType.charAt(0).toUpperCase() + load.equipmentType.slice(1)} Required` : "Standard Equipment"}</p>
                </div>
                {hazmat && <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 ml-auto">Hazmat</Badge>}
              </div>

              {/* Route Visualization */}
              <div className={cn("p-5 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#1473FF]" />
                    </div>
                    <div>
                      <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{originCity}{originState ? `, ${originState}` : ""}</p>
                      <p className="text-xs text-slate-400">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : "Pickup TBD"}</p>
                    </div>
                  </div>
                  <div className="flex-1 mx-4 flex items-center">
                    <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#BE01FF]/20 mx-2">
                      <span className="text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{distance} mi</span>
                    </div>
                    <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{destCity}{destState ? `, ${destState}` : ""}</p>
                      <p className="text-xs text-slate-400">{load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : "Delivery TBD"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#BE01FF]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Weight", value: `${Number(load.weight || 0).toLocaleString()} ${load.weightUnit || "lbs"}`, icon: <Package className="w-4 h-4" />, color: "blue" },
                  { label: "Equipment", value: load.equipmentType || "Standard", icon: <Truck className="w-4 h-4" />, color: "purple" },
                  { label: "Target Rate", value: `$${targetRate.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color: "green" },
                  { label: "Rate/Mile", value: targetRate && distance ? `$${(targetRate / distance).toFixed(2)}` : "—", icon: <Navigation className="w-4 h-4" />, color: "cyan" },
                ].map((stat) => (
                  <div key={stat.label} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2",
                      stat.color === "blue" ? "bg-blue-500/15 text-blue-500" :
                      stat.color === "purple" ? "bg-purple-500/15 text-purple-500" :
                      stat.color === "green" ? "bg-emerald-500/15 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : "bg-cyan-500/15 text-cyan-500"
                    )}>
                      {stat.icon}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className={cn("text-sm font-bold mt-0.5", isLight ? "text-slate-800" : "text-white")}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Shipper Requirements */}
              {(load.minSafetyScore || load.endorsements || hazmat) && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className={cn("text-sm font-bold", isLight ? "text-amber-700" : "text-amber-400")}>Shipper Requirements</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {load.minSafetyScore && <p className="text-slate-500">Min Safety Score: <span className={cn("font-medium", isLight ? "text-slate-700" : "text-white")}>{load.minSafetyScore}%</span></p>}
                    {load.endorsements && <p className="text-slate-500">Endorsements: <span className={cn("font-medium", isLight ? "text-slate-700" : "text-white")}>{load.endorsements}</span></p>}
                    {hazmat && <p className="text-slate-500">Hazmat CDL endorsement required <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px] ml-1">HM</Badge></p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Your Bid with ESANG AI Rate Intelligence */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Rate Mode Toggle */}
              <div className={cn("flex items-center gap-2 p-1 rounded-lg w-fit", isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                <button onClick={() => setRateMode("total")}
                  className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all", rateMode === "total" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow" : isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")}>
                  Total Rate ($)
                </button>
                <button onClick={() => setRateMode("perMile")}
                  className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all", rateMode === "perMile" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow" : isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")}>
                  Rate Per Mile ($/mi)
                </button>
              </div>

              {/* ML Bid Optimizer */}
              {mlBidOptimizer.data && distance > 0 && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-purple-50 border-purple-200" : "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20")}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-purple-600" : "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent")}>ML Bid Optimizer</span>
                    <span className={cn("ml-auto text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>{mlBidOptimizer.data.winProbability}% win probability</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {(["AGGRESSIVE", "COMPETITIVE", "PREMIUM"] as const).map(s => (
                      <button key={s} onClick={() => setBidStrategy(s)}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", bidStrategy === s ? "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white shadow" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50")}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className={cn("text-[10px] uppercase", isLight ? "text-slate-500" : "text-slate-500")}>Suggested Bid</p>
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${mlBidOptimizer.data.suggestedBid.toLocaleString()}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>${mlBidOptimizer.data.bidPerMile}/mi</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-[10px] uppercase", isLight ? "text-slate-500" : "text-slate-500")}>Market Avg</p>
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-600" : "text-slate-300")}>${mlBidOptimizer.data.marketAvg.toLocaleString()}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>${(mlBidOptimizer.data.marketAvg / Math.max(distance, 1)).toFixed(2)}/mi</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-[10px] uppercase", isLight ? "text-slate-500" : "text-slate-500")}>Win Prob</p>
                      <p className={`text-lg font-bold ${mlBidOptimizer.data.winProbability >= 60 ? "text-green-400" : mlBidOptimizer.data.winProbability >= 35 ? "text-yellow-400" : "text-red-400"}`}>{mlBidOptimizer.data.winProbability}%</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>{mlBidOptimizer.data.strategy}</p>
                    </div>
                  </div>
                  <button onClick={() => { setBidAmount(String(mlBidOptimizer.data.suggestedBid)); setRatePerMileInput(String(mlBidOptimizer.data.bidPerMile)); }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white hover:opacity-90 transition-opacity">
                    Use Suggested Bid: ${mlBidOptimizer.data.suggestedBid.toLocaleString()}
                  </button>
                  <p className={cn("text-[10px] mt-2 italic", isLight ? "text-slate-500" : "text-slate-500")}>{mlBidOptimizer.data.reasoning}</p>
                </div>
              )}

              {/* ML ETA Prediction */}
              {mlETA.data && distance > 0 && (
                <div className={cn("p-3 rounded-lg flex items-center gap-4", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-800/50 border border-slate-700/30")}>
                  <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="flex-1">
                    <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>ML Transit Estimate</p>
                    <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{mlETA.data.estimatedDays} days ({mlETA.data.estimatedHours}h)</p>
                  </div>
                  <div className={cn("px-2 py-1 rounded text-[10px] font-bold", mlETA.data.riskLevel === "HIGH" ? "bg-red-500/20 text-red-400" : mlETA.data.riskLevel === "MODERATE" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400")}>
                    {mlETA.data.riskLevel}
                  </div>
                </div>
              )}

              {rateMode === "total" ? (
                <div>
                  <label className={cn("text-sm mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Your Bid Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e: any) => {
                        setBidAmount(e.target.value);
                        if (distance && Number(e.target.value) > 0) setRatePerMileInput((Number(e.target.value) / distance).toFixed(2));
                      }}
                      placeholder="e.g., 2500"
                      className={cn("pl-10 text-xl font-bold rounded-xl h-14 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/50 border-slate-600/50")}
                    />
                  </div>
                  {distance > 0 && bidAmount && (
                    <p className="text-sm text-slate-500 mt-2">= <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${ratePerMile}/mi</span> over {distance} miles</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className={cn("text-sm mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Rate Per Mile ($/mi)</label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={ratePerMileInput}
                      onChange={(e: any) => {
                        setRatePerMileInput(e.target.value);
                        if (distance && Number(e.target.value) > 0) setBidAmount(String(Math.round(Number(e.target.value) * distance)));
                      }}
                      placeholder="e.g., 3.25"
                      className={cn("pl-10 text-xl font-bold rounded-xl h-14 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/50 border-slate-600/50")}
                    />
                  </div>
                  {distance > 0 && ratePerMileInput && (
                    <p className="text-sm text-slate-500 mt-2">= <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${Number(bidAmount).toLocaleString()} total</span> for {distance} miles</p>
                  )}
                </div>
              )}

              {/* Rate Summary Card */}
              {bidAmount && distance > 0 && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20")}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-[10px] text-slate-400 uppercase">Your Bid</p><p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>${Number(bidAmount).toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase">Distance</p><p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>{distance} mi</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase">Rate/Mile</p><p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${ratePerMile}</p></div>
                  </div>
                </div>
              )}

              {/* ESANG AI Rate Intelligence Gauge */}
              {rateIntel && (
                <div className={cn("p-5 rounded-xl border shadow-sm", isLight ? "bg-white border-slate-200" : "bg-slate-900 border-purple-500/20")}>
                  <div className="flex items-center gap-2 mb-4">
                    <EsangIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent">ESANG AI Rate Intelligence</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 200 115" className="w-52 h-32">
                      <defs>
                        <linearGradient id="bidGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fca5a5" />
                          <stop offset="25%" stopColor="#fde68a" />
                          <stop offset="50%" stopColor="#6ee7b7" />
                          <stop offset="75%" stopColor="#fde68a" />
                          <stop offset="100%" stopColor="#fca5a5" />
                        </linearGradient>
                      </defs>
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className={isLight ? "stroke-slate-100" : "stroke-slate-800"} strokeWidth="12" strokeLinecap="round" />
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#bidGaugeGrad)" strokeWidth="12" strokeLinecap="round" />
                      <line x1="100" y1="100" x2={rateIntel.nx} y2={rateIntel.ny} className={isLight ? "stroke-slate-700" : "stroke-white"} strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="5" fill={rateIntel.pastelColor} className={isLight ? "stroke-slate-700" : "stroke-white"} strokeWidth="1.5" />
                      <text x="100" y="88" textAnchor="middle" className={isLight ? "fill-slate-900" : "fill-white"} fontSize="22" fontWeight="700" fontFamily="system-ui, sans-serif">
                        ${rateIntel.userRPM.toFixed(2)}
                      </text>
                    </svg>
                    <span className="text-xs font-semibold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent">/mile</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rateIntel.pastelColor }} />
                      <span className="text-sm font-bold" style={{ color: rateIntel.ratingColor }}>{rateIntel.ratingLabel}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 px-2">
                    {["Below Market", "Sweet Spot", "Premium"].map((label) => (
                      <span key={label} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                        rateIntel.ratingLabel === label
                          ? label === "Sweet Spot" ? "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-purple-400"
                            : "border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : isLight ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-700/50 bg-slate-800/30 text-slate-500"
                      )}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className={cn("mt-4 p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <div className="flex items-center gap-2 mb-2">
                      <EsangIcon className="w-3 h-3 text-purple-500" />
                      <span className={cn("text-[11px] font-bold", isLight ? "text-purple-600" : "text-purple-300")}>ESANG Recommendation</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-[10px] text-slate-400">Market Low</p><p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-slate-300")}>${rateIntel.marketLow}/mi</p></div>
                      <div><p className="text-[10px] text-slate-400">Market Avg</p><p className="text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rateIntel.marketRPM}/mi</p></div>
                      <div><p className="text-[10px] text-slate-400">Market High</p><p className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-slate-300")}>${rateIntel.marketHigh}/mi</p></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">Suggested total: <span className="text-purple-500 font-bold">${rateIntel.marketTotal.toLocaleString()}</span> for {distance} mi</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Equipment & Driver */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className={cn("text-sm font-medium mb-2 block flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-300")}>
                  <User className="w-4 h-4 text-blue-500" />Assign Driver
                </label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className={cn("rounded-xl h-12 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                    <SelectValue placeholder="Select a driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversQuery.isLoading ? (
                      <SelectItem value="loading" disabled>Loading drivers...</SelectItem>
                    ) : !(driversQuery.data as any)?.length ? (
                      <SelectItem value="none" disabled>No available drivers — assign later</SelectItem>
                    ) : (
                      (driversQuery.data as any)?.map((driver: any) => (
                        <SelectItem key={driver.id} value={String(driver.id)}>
                          {driver.firstName} {driver.lastName} — {driver.hoursAvailable}h available
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">You can assign a driver after your bid is accepted</p>
              </div>

              <div>
                <label className={cn("text-sm font-medium mb-2 block flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-300")}>
                  <Truck className="w-4 h-4 text-purple-500" />Assign Truck
                </label>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger className={cn("rounded-xl h-12 border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                    <SelectValue placeholder="Select a vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {!(fleetQuery.data as any)?.length ? (
                      <SelectItem value="none" disabled>No vehicles — assign later</SelectItem>
                    ) : (
                      (fleetQuery.data as any)?.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.make} {v.model} — {v.licensePlate || v.unitNumber}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">Optional — helps shipper assess your capacity</p>
              </div>

              {/* Equipment Confirmation */}
              {load.equipmentType && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")}>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span className={cn("text-sm font-medium", isLight ? "text-blue-700" : "text-blue-400")}>
                      This load requires: <span className="font-bold">{load.equipmentType === "tanker" ? "Tanker Truck" : load.equipmentType === "flatbed" ? "Flatbed" : load.equipmentType === "reefer" ? "Reefer" : "Standard Truck"}</span>
                    </span>
                  </div>
                  {hazmat && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500 font-medium">Hazmat endorsement + placard required</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Schedule & Notes */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("text-sm font-medium mb-2 block flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-300")}>
                    <Calendar className="w-4 h-4 text-green-500" />Estimated Pickup
                  </label>
                  <DatePicker
                    value={estimatedPickup}
                    onChange={setEstimatedPickup}
                    placeholder="Select pickup date"
                    className={cn("rounded-xl h-12", isLight ? "" : "")}
                  />
                </div>
                <div>
                  <label className={cn("text-sm font-medium mb-2 block flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-300")}>
                    <Calendar className="w-4 h-4 text-red-500" />Estimated Delivery
                  </label>
                  <DatePicker
                    value={estimatedDelivery}
                    onChange={setEstimatedDelivery}
                    placeholder="Select delivery date"
                    className={cn("rounded-xl h-12", isLight ? "" : "")}
                  />
                </div>
              </div>

              {/* Shipper's requested dates */}
              {(load.pickupDate || load.deliveryDate) && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Shipper's Requested Dates</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-slate-400">Pickup</p><p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-white")}>{String(load.pickupDate || "Flexible")}</p></div>
                    <div><p className="text-xs text-slate-400">Delivery</p><p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-white")}>{String(load.deliveryDate || "Flexible")}</p></div>
                  </div>
                </div>
              )}

              <div>
                <label className={cn("text-sm font-medium mb-2 block flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-300")}>
                  <FileText className="w-4 h-4 text-slate-400" />Additional Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="Any relevant information for the shipper — special equipment, availability windows, certifications..."
                  className={cn("rounded-xl border min-h-[120px]", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/50 border-slate-600/50")}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className={cn("font-bold text-lg", isLight ? "text-slate-800" : "text-white")}>Review Your Bid</p>

              {/* Bid Summary */}
              <div className={cn("p-5 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#BE01FF]/20")}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Your Bid</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(bidAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Rate/Mile</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${ratePerMile}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Distance</p>
                    <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{distance} mi</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Load", value: load.loadNumber || `#${String(load.id).slice(0, 8)}` },
                  { label: "Route", value: `${originCity} → ${destCity}` },
                  { label: "Equipment", value: load.equipmentType || "Standard" },
                  { label: "Commodity", value: load.commodity || load.cargoType || "General" },
                  { label: "Target Rate", value: `$${targetRate.toLocaleString()}` },
                  { label: "Your Bid vs Target", value: targetRate > 0 ? `${((parseFloat(bidAmount) / targetRate) * 100).toFixed(0)}%` : "—" },
                  ...(selectedDriver ? [{ label: "Driver", value: (driversQuery.data as any)?.find((d: any) => String(d.id) === selectedDriver)?.firstName || "Assigned" }] : []),
                  ...(estimatedPickup ? [{ label: "Est. Pickup", value: estimatedPickup }] : []),
                  ...(estimatedDelivery ? [{ label: "Est. Delivery", value: estimatedDelivery }] : []),
                ].map((item) => (
                  <div key={item.label} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-400 uppercase">{item.label}</p>
                    <p className={cn("text-sm font-medium mt-0.5", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
                  </div>
                ))}
              </div>

              {notes && (
                <div className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <p className="text-[10px] text-slate-400 uppercase">Notes</p>
                  <p className={cn("text-sm mt-0.5", isLight ? "text-slate-700" : "text-slate-300")}>{notes}</p>
                </div>
              )}

              {/* Terms */}
              <label className={cn("flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                acceptedTerms
                  ? isLight ? "bg-emerald-50 border-emerald-300" : "bg-emerald-500/10 border-emerald-500/30"
                  : isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
              )}>
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-emerald-500 w-4 h-4" />
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>I confirm this bid is binding</p>
                  <p className="text-xs text-slate-400 mt-0.5">By submitting, you agree that this bid is a firm offer. If accepted, you commit to transporting this load at the stated rate per EusoTrip platform terms.</p>
                </div>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700")}
          onClick={() => step === 0 ? setLocation("/marketplace") : setStep(s => s - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-xl text-white font-bold"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
          >
            Next<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-xl text-white font-bold px-8"
            onClick={handleSubmit}
            disabled={!acceptedTerms || submitBidMutation.isPending}
          >
            {submitBidMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Gavel className="w-4 h-4 mr-2" />
            )}
            Submit Bid
          </Button>
        )}
      </div>
    </div>
  );
}
