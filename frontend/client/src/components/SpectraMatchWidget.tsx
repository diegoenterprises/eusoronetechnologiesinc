/**
 * SPECTRA-MATCH™ EMBEDDABLE WIDGET
 * Compact version of the crude oil identification system
 * for embedding into Load Creation, Terminal SCADA, BOL, Run Tickets, etc.
 * 
 * Usage:
 *   <SpectraMatchWidget 
 *     onIdentify={(result) => setOilType(result)}
 *     compact={true}
 *     loadId="LD-12345"
 *   />
 */

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, Droplets, Target, CheckCircle, ChevronDown, ChevronUp,
  Sparkles, Save, Flame, MapPin, Gauge, Thermometer, Beaker,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Product categories for SpectraMatch identification
type ProductCategory = "crude" | "refined" | "lpg" | "chemical" | "";

const CRUDE_KEYWORDS = ["crude", "condensate", "bitumen", "petroleum", "oil"];
const REFINED_KEYWORDS = ["diesel", "gasoline", "kerosene", "jet fuel", "fuel oil", "naphtha", "heating oil"];
const LPG_KEYWORDS = ["lpg", "propane", "butane", "natural gas", "lng", "ngl", "cng"];
const CHEMICAL_KEYWORDS = ["ethanol", "methanol", "toluene", "xylene", "benzene", "acetone"];

function detectCategory(productName: string): ProductCategory {
  const p = productName.toLowerCase();
  if (CRUDE_KEYWORDS.some(k => p.includes(k))) return "crude";
  if (REFINED_KEYWORDS.some(k => p.includes(k))) return "refined";
  if (LPG_KEYWORDS.some(k => p.includes(k))) return "lpg";
  if (CHEMICAL_KEYWORDS.some(k => p.includes(k))) return "chemical";
  return "";
}

// Source basins for crude oil identification
const SOURCE_BASINS = [
  { value: "", label: "Select Basin / Field" },
  { value: "permian", label: "Permian Basin (TX/NM)" },
  { value: "eagle_ford", label: "Eagle Ford Shale (TX)" },
  { value: "bakken", label: "Bakken (ND/MT)" },
  { value: "midland", label: "Midland Basin (TX)" },
  { value: "delaware", label: "Delaware Basin (TX/NM)" },
  { value: "dj_niobrara", label: "DJ / Niobrara (CO/WY)" },
  { value: "anadarko", label: "Anadarko (OK)" },
  { value: "scoop_stack", label: "SCOOP/STACK (OK)" },
  { value: "marcellus", label: "Marcellus/Utica (PA/WV/OH)" },
  { value: "haynesville", label: "Haynesville (LA/TX)" },
  { value: "gulf_coast", label: "Gulf Coast (TX/LA)" },
  { value: "williston", label: "Williston Basin (ND)" },
  { value: "appalachian", label: "Appalachian Basin" },
  { value: "san_joaquin", label: "San Joaquin (CA)" },
  { value: "canada_wcs", label: "Western Canadian Select" },
  { value: "canada_syncrude", label: "Syncrude (AB)" },
  { value: "other", label: "Other / Unknown" },
];

interface SpectraMatchResult {
  primaryMatch: {
    id: string;
    name: string;
    type: string;
    region: string;
    confidence: number;
    characteristics: string[];
  };
  parameterAnalysis: Record<string, any>;
  alternativeMatches: Array<{ id: string; name: string; type: string; confidence: number }>;
  esangAI?: {
    analysis: string;
    reasoning: string;
    safetyNotes: string[];
    marketContext: string;
    learningInsight: string;
    poweredBy: string;
  } | null;
  esangVerified?: boolean;
}

interface SpectraMatchWidgetProps {
  onIdentify?: (result: SpectraMatchResult) => void;
  onSaveToLoad?: (crudeId: string, confidence: number) => void;
  loadId?: string;
  compact?: boolean;
  showSaveButton?: boolean;
  defaultApiGravity?: number;
  defaultBsw?: number;
  productName?: string;
  className?: string;
}

export default function SpectraMatchWidget({
  onIdentify,
  onSaveToLoad,
  loadId,
  compact = false,
  showSaveButton = true,
  defaultApiGravity = 39.6,
  defaultBsw = 0.3,
  productName = "",
  className,
}: SpectraMatchWidgetProps) {
  const [category, setCategory] = useState<ProductCategory>(() => detectCategory(productName));
  const [apiGravity, setApiGravity] = useState(defaultApiGravity);
  const [bsw, setBsw] = useState(defaultBsw);
  const [sulfurType, setSulfurType] = useState<"sweet" | "sour">("sweet");
  const [sourceBasin, setSourceBasin] = useState("");
  const [fuelGrade, setFuelGrade] = useState("");
  const [flashPoint, setFlashPoint] = useState(100);
  const [vaporPressure, setVaporPressure] = useState(200);
  const [concentration, setConcentration] = useState(99);
  const [expanded, setExpanded] = useState(!compact);

  // Auto-detect category when productName changes
  useEffect(() => {
    if (productName) {
      const detected = detectCategory(productName);
      if (detected) setCategory(detected);
    }
  }, [productName]);

  const identifyMutation = (trpc as any).spectraMatch.identify.useMutation({
    onSuccess: (data: SpectraMatchResult) => {
      onIdentify?.(data);
      toast.success(`Identified: ${data.primaryMatch.name} (${data.primaryMatch.confidence}% confidence)`);
    },
    onError: (error: any) => {
      toast.error("Identification failed", { description: error.message });
    },
  });

  const saveToRunTicketMutation = (trpc as any).spectraMatch.saveToRunTicket.useMutation({
    onSuccess: () => {
      toast.success("SpectraMatch result saved to load");
    },
  });

  const handleIdentify = () => {
    identifyMutation.mutate({
      apiGravity,
      bsw,
      category,
      sulfurType,
      sourceBasin,
      fuelGrade,
      flashPoint,
      vaporPressure,
      concentration,
      productName,
    });
  };

  const handleSave = () => {
    if (!identifyMutation.data || !loadId) return;
    if (onSaveToLoad) {
      onSaveToLoad(identifyMutation.data.primaryMatch.id, identifyMutation.data.primaryMatch.confidence);
    } else {
      saveToRunTicketMutation.mutate({
        loadId,
        crudeId: identifyMutation.data.primaryMatch.id,
        productName: identifyMutation.data.primaryMatch.name,
        category: identifyMutation.data.primaryMatch.type || category,
        confidence: identifyMutation.data.primaryMatch.confidence,
        parameters: { apiGravity, bsw },
        esangVerified: identifyMutation.data.esangVerified || false,
      });
    }
  };

  const result = identifyMutation.data as SpectraMatchResult | undefined;

  return (
    <Card className={cn("bg-transparent border-transparent overflow-hidden", className)}>
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            SPECTRA-MATCH™
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px] px-1.5 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              AI
            </Badge>
          </CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white h-7 w-7 p-0"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Product Category */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs">Product Category</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "crude" as ProductCategory, label: "Crude Oil", icon: Droplets, color: "from-amber-500 to-orange-600" },
                { id: "refined" as ProductCategory, label: "Refined Fuel", icon: Flame, color: "from-red-500 to-rose-600" },
                { id: "lpg" as ProductCategory, label: "LPG / Gas", icon: Gauge, color: "from-blue-500 to-cyan-600" },
                { id: "chemical" as ProductCategory, label: "Chemical", icon: Beaker, color: "from-green-500 to-emerald-600" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all",
                    category === cat.id
                      ? `bg-gradient-to-br ${cat.color} border-white/30 text-white shadow-lg`
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                  )}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- CRUDE OIL FIELDS ---- */}
          {category === "crude" && (
            <div className="space-y-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] text-amber-400 font-medium">Run Ticket / Lab Analysis Values</p>
              {/* API Gravity + BS&W */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      API Gravity
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{apiGravity.toFixed(1)}</span>
                  </div>
                  <Slider value={[apiGravity]} onValueChange={(v: any) => setApiGravity(v[0])} min={10} max={70} step={0.1} className="py-1" />
                  <div className="flex justify-between text-[9px] text-slate-600"><span>10 Heavy</span><span>40 Light</span><span>70 Ultra</span></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-amber-400" />
                      BS&W %
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{bsw.toFixed(2)}%</span>
                  </div>
                  <Slider value={[bsw]} onValueChange={(v: any) => setBsw(v[0])} min={0} max={3} step={0.01} className="py-1" />
                  <div className="flex justify-between text-[9px] text-slate-600"><span>0% Clean</span><span>1% Typical</span><span>3% High</span></div>
                </div>
              </div>
              {/* Sulfur Type + Source Basin */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-yellow-400" />
                    Sulfur Content
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setSulfurType("sweet")}
                      className={cn("px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                        sulfurType === "sweet" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                      )}
                    >Sweet (&lt;0.5%)</button>
                    <button
                      onClick={() => setSulfurType("sour")}
                      className={cn("px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                        sulfurType === "sour" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                      )}
                    >Sour (&gt;0.5%)</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    Source Basin / Field
                  </Label>
                  <Select value={sourceBasin} onValueChange={setSourceBasin}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 h-8 text-xs">
                      <SelectValue placeholder="Select basin" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_BASINS.filter(b => b.value).map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ---- REFINED FUEL FIELDS ---- */}
          {category === "refined" && (
            <div className="space-y-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] text-red-400 font-medium">Fuel Grade / BOL Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-400" />
                    Grade
                  </Label>
                  <Select value={fuelGrade} onValueChange={setFuelGrade}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 h-8 text-xs">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular_87">Regular Unleaded (87)</SelectItem>
                      <SelectItem value="midgrade_89">Mid-Grade (89)</SelectItem>
                      <SelectItem value="premium_93">Premium (91-93)</SelectItem>
                      <SelectItem value="diesel_1">Diesel #1 (D1)</SelectItem>
                      <SelectItem value="diesel_2">Diesel #2 (D2)</SelectItem>
                      <SelectItem value="ulsd">ULSD (Ultra-Low Sulfur)</SelectItem>
                      <SelectItem value="jet_a">Jet A / Jet A-1</SelectItem>
                      <SelectItem value="kerosene">Kerosene (K-1)</SelectItem>
                      <SelectItem value="fuel_oil_2">Fuel Oil #2</SelectItem>
                      <SelectItem value="fuel_oil_6">Fuel Oil #6 (Bunker)</SelectItem>
                      <SelectItem value="naphtha">Naphtha</SelectItem>
                      <SelectItem value="e10">E10 (10% Ethanol)</SelectItem>
                      <SelectItem value="e85">E85 (85% Ethanol)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-400" />
                      Flash Point
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{flashPoint}°F</span>
                  </div>
                  <Slider value={[flashPoint]} onValueChange={(v: any) => setFlashPoint(v[0])} min={-50} max={300} step={1} className="py-1" />
                  <div className="flex justify-between text-[9px] text-slate-600"><span>-50°F Gas</span><span>100°F Diesel</span><span>300°F HFO</span></div>
                </div>
              </div>
              {/* API for refined products too */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    API Gravity (if known)
                  </Label>
                  <span className="text-xs font-bold text-cyan-400">{apiGravity.toFixed(1)}</span>
                </div>
                <Slider value={[apiGravity]} onValueChange={(v: any) => setApiGravity(v[0])} min={10} max={70} step={0.1} className="py-1" />
              </div>
            </div>
          )}

          {/* ---- LPG / GAS FIELDS ---- */}
          {category === "lpg" && (
            <div className="space-y-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-[10px] text-blue-400 font-medium">Gas Product Specifications</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-blue-400" />
                    Product Type
                  </Label>
                  <Select value={fuelGrade} onValueChange={setFuelGrade}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 h-8 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propane">Propane (HD-5)</SelectItem>
                      <SelectItem value="propane_comm">Propane (Commercial)</SelectItem>
                      <SelectItem value="butane">Butane (N-Butane)</SelectItem>
                      <SelectItem value="isobutane">Isobutane</SelectItem>
                      <SelectItem value="lpg_mix">LPG Mix (P/B Blend)</SelectItem>
                      <SelectItem value="ngl">NGL (Y-Grade)</SelectItem>
                      <SelectItem value="lng">LNG</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      Vapor Pressure
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{vaporPressure} psi</span>
                  </div>
                  <Slider value={[vaporPressure]} onValueChange={(v: any) => setVaporPressure(v[0])} min={20} max={350} step={1} className="py-1" />
                  <div className="flex justify-between text-[9px] text-slate-600"><span>20 Butane</span><span>190 Propane</span><span>350 CNG</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ---- CHEMICAL FIELDS ---- */}
          {category === "chemical" && (
            <div className="space-y-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-green-400 font-medium">Chemical Product Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Beaker className="w-3 h-3 text-green-400" />
                      Concentration
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{concentration}%</span>
                  </div>
                  <Slider value={[concentration]} onValueChange={(v: any) => setConcentration(v[0])} min={50} max={100} step={0.5} className="py-1" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-400" />
                      Flash Point
                    </Label>
                    <span className="text-xs font-bold text-cyan-400">{flashPoint}°F</span>
                  </div>
                  <Slider value={[flashPoint]} onValueChange={(v: any) => setFlashPoint(v[0])} min={-20} max={200} step={1} className="py-1" />
                </div>
              </div>
            </div>
          )}

          {/* No category selected hint */}
          {!category && (
            <div className="text-center py-3 text-slate-500 text-xs">
              Select a product category above to enter identification details
            </div>
          )}

          {/* Identify Button */}
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-8 text-xs"
            onClick={handleIdentify}
            disabled={identifyMutation.isPending || !category}
          >
            {identifyMutation.isPending ? "Analyzing..." : (
              <>
                <Target className="w-3 h-3 mr-1.5" />
                {category === "crude" ? "Identify Crude Origin" :
                 category === "refined" ? "Identify Fuel Type" :
                 category === "lpg" ? "Identify Gas Product" :
                 category === "chemical" ? "Identify Chemical" : "Identify Product"}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-sm">{result.primaryMatch.name}</div>
                  <div className="text-xs text-slate-400">{result.primaryMatch.type} • {result.primaryMatch.region}</div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-bold",
                    result.primaryMatch.confidence >= 90 ? "text-green-400" :
                    result.primaryMatch.confidence >= 75 ? "text-yellow-400" : "text-orange-400"
                  )}>
                    {result.primaryMatch.confidence}%
                  </div>
                  <div className="text-[10px] text-slate-500">Confidence</div>
                </div>
              </div>

              {/* Mini confidence bar */}
              <Progress value={result.primaryMatch.confidence} className="h-1.5" />

              {/* Characteristics */}
              <div className="flex flex-wrap gap-1">
                {result.primaryMatch.characteristics.slice(0, 3).map((c: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-slate-600 text-slate-400 text-[10px] px-1.5 py-0">
                    {c}
                  </Badge>
                ))}
              </div>

              {/* Alternatives */}
              {result.alternativeMatches.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {result.alternativeMatches.slice(0, 3).map((alt: any) => (
                    <div key={alt.id} className="flex-shrink-0 px-2 py-1 rounded bg-slate-800 text-[10px]">
                      <span className="text-slate-300">{alt.name.split(" ")[0]}</span>
                      <span className="text-cyan-400 ml-1">{alt.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ESANG AI Intelligence Layer */}
              {result.esangAI && (
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] text-purple-400 font-medium">ESANG AI Analysis</span>
                    {result.esangVerified && (
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-[9px] px-1 py-0 ml-auto">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.esangAI.reasoning}</p>
                  {result.esangAI.safetyNotes.length > 0 && (
                    <div className="space-y-1">
                      {result.esangAI.safetyNotes.slice(0, 2).map((note: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-yellow-400/80">
                          <Flame className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.esangAI.marketContext && (
                    <p className="text-[10px] text-cyan-400/70">{result.esangAI.marketContext}</p>
                  )}
                  {result.esangAI.learningInsight && (
                    <p className="text-[10px] text-slate-500 italic">{result.esangAI.learningInsight}</p>
                  )}
                </div>
              )}

              {/* Save button */}
              {showSaveButton && loadId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 text-xs"
                  onClick={handleSave}
                  disabled={saveToRunTicketMutation.isPending}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {saveToRunTicketMutation.isPending ? "Saving..." : "Save to Load"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}

      {/* Compact collapsed state */}
      {compact && !expanded && result && (
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">{result.primaryMatch.name}</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-bold text-sm">{result.primaryMatch.confidence}%</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
