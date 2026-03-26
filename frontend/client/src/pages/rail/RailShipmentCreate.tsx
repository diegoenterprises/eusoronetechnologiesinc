/**
 * RAIL SHIPMENT CREATION WIZARD
 * 5-step multi-modal wizard for rail freight
 */
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { TrainFront, Package, MapPin, FileText, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { VerticalSelector } from "@/components/VerticalFieldsPanel";
import { VERTICAL_RAIL_MAP } from "@/lib/loadConstants";

const STEPS = ["Commodity", "Equipment", "Route", "Requirements", "Review"];
const STEP_ICONS = [Package, TrainFront, MapPin, FileText, CheckCircle];

const CAR_TYPES = [
  "tankcar", "boxcar", "hopper", "flatcar", "gondola",
  "intermodal", "covered_hopper", "open_hopper", "centerbeam", "autorack", "coilcar", "reefer",
];

const HAZMAT_CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function RailShipmentCreate() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [ergSearch, setErgSearch] = useState("");
  const [ergDebouncedSearch, setErgDebouncedSearch] = useState("");
  const [showErgSuggestions, setShowErgSuggestions] = useState(false);
  const ergDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    commodity: "",
    stccCode: "",
    isHazmat: false,
    hazmatClass: "",
    unNumber: "",
    properShippingName: "",
    packingGroup: "",
    ergGuide: "",
    weightLbs: "",
    carType: "",
    numberOfCars: "1",
    equipmentNotes: "",
    originYardId: "",
    destinationYardId: "",
    carrierPreference: "",
    specialInstructions: "",
    temperatureRequirements: "",
    estimatedPickupDate: "",
  });

  const yards = trpc.railShipments.getRailYards.useQuery({ limit: 100 });
  const create = trpc.railShipments.createRailShipment.useMutation({
    onSuccess: (d) => {
      toast.success(`Shipment ${d.shipmentNumber} created`);
      navigate(`/rail/shipments/${d.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  // ERG hazmat lookup
  useEffect(() => {
    const timer = setTimeout(() => setErgDebouncedSearch(ergSearch), 300);
    return () => clearTimeout(timer);
  }, [ergSearch]);

  const ergResults = (trpc as any).erg?.search?.useQuery?.(
    { query: ergDebouncedSearch, limit: 10 },
    { enabled: !!ergDebouncedSearch && ergDebouncedSearch.length >= 2 }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ergDropdownRef.current && !ergDropdownRef.current.contains(e.target as Node)) {
        setShowErgSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleErgSelect = (material: any) => {
    setForm((p) => ({
      ...p,
      hazmatClass: material.hazardClass || material.hazmatClass || "",
      unNumber: material.unNumber || "",
      properShippingName: material.name || material.properShippingName || "",
      packingGroup: material.packingGroup || "",
      ergGuide: material.ergGuide || "",
    }));
    setErgSearch(material.name || material.unNumber || "");
    setShowErgSuggestions(false);
  };

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");
  const lbl = cn("text-sm font-medium mb-1.5 block", isLight ? "text-slate-700" : "text-slate-300");
  const textColor = isLight ? "text-slate-900" : "text-white";
  const mutedText = isLight ? "text-slate-500" : "text-slate-400";

  const canNext = (): boolean => {
    if (step === 0) return !!form.commodity && !!form.weightLbs;
    if (step === 1) return !!form.carType && Number(form.numberOfCars) >= 1;
    if (step === 2) return !!form.originYardId && !!form.destinationYardId;
    return true;
  };

  const handleSubmit = () => {
    if (!form.originYardId || !form.destinationYardId) return toast.error("Select origin and destination yards");
    create.mutate({
      originYardId: Number(form.originYardId),
      destinationYardId: Number(form.destinationYardId),
      carType: (form.carType || undefined) as any,
      commodity: form.commodity || undefined,
      weight: form.weightLbs ? Number(form.weightLbs) : undefined,
      hazmatClass: form.isHazmat ? form.hazmatClass : undefined,
      unNumber: form.isHazmat ? form.unNumber || undefined : undefined,
      numberOfCars: Number(form.numberOfCars) || 1,
      specialInstructions: form.specialInstructions || undefined,
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const Icon = STEP_ICONS[i];
        const isActive = i === step;
        const isComplete = i < step;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isComplete ? "bg-green-500 text-white" : isActive ? "bg-blue-500 text-white" : isLight ? "bg-slate-200 text-slate-500" : "bg-slate-700 text-slate-400"
                )}
              >
                {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn("text-xs font-medium", isActive ? "text-blue-500" : mutedText)}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 mt-[-1rem]", isComplete ? "bg-green-500" : isLight ? "bg-slate-200" : "bg-slate-700")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Commodity Name *</Label>
        <Input value={form.commodity} onChange={(e) => set("commodity", e.target.value)} placeholder="e.g. Grain, Coal, Chemicals" />
      </div>
      <div>
        <Label className={lbl}>STCC Code (optional)</Label>
        <Input value={form.stccCode} onChange={(e) => set("stccCode", e.target.value)} placeholder="e.g. 01131" />
      </div>
      <div>
        <Label className={lbl}>Weight (lbs) *</Label>
        <Input type="number" value={form.weightLbs} onChange={(e) => set("weightLbs", e.target.value)} placeholder="Total shipment weight" />
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <Label className={lbl}>Hazmat Shipment?</Label>
          <Button
            variant={form.isHazmat ? "default" : "outline"}
            size="sm"
            onClick={() => set("isHazmat", !form.isHazmat)}
            className={form.isHazmat ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            {form.isHazmat ? "Yes — Hazmat" : "No"}
          </Button>
        </div>
        {form.isHazmat && (
          <div className="pl-8 border-l-2 border-amber-500/30 space-y-4">
            {/* ERG Search */}
            <div className="relative" ref={ergDropdownRef}>
              <Label className={lbl}>Search ERG Database</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={ergSearch}
                  onChange={(e) => { setErgSearch(e.target.value); setShowErgSuggestions(true); }}
                  onFocus={() => { if (ergSearch.length >= 2) setShowErgSuggestions(true); }}
                  placeholder="Search by UN number or material name..."
                  className="pl-9"
                />
              </div>
              {showErgSuggestions && ergResults?.data?.materials?.length > 0 && (
                <div className={cn(
                  "absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600"
                )}>
                  {ergResults.data.materials.map((m: any, idx: number) => (
                    <button
                      key={`${m.unNumber}-${idx}`}
                      type="button"
                      onClick={() => handleErgSelect(m)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors",
                        isLight ? "hover:bg-slate-100 border-b border-slate-100" : "hover:bg-slate-700 border-b border-slate-700/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">{m.unNumber}</Badge>
                        <span className={cn("truncate", textColor)}>{m.name}</span>
                      </div>
                      <div className={cn("text-xs mt-0.5", mutedText)}>
                        Class {m.hazardClass || m.hazmatClass} | PG {m.packingGroup || "—"} | Guide {m.ergGuide || "—"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showErgSuggestions && ergDebouncedSearch.length >= 2 && ergResults?.isLoading && (
                <div className={cn(
                  "absolute z-50 w-full mt-1 rounded-lg border p-3 text-center text-sm",
                  isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-800 border-slate-600 text-slate-400"
                )}>
                  Searching ERG database...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={lbl}>Hazmat Class *</Label>
                <Select value={form.hazmatClass} onValueChange={(v) => set("hazmatClass", v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {HAZMAT_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={lbl}>UN Number</Label>
                <Input value={form.unNumber} onChange={(e) => set("unNumber", e.target.value)} placeholder="e.g. UN1203" />
              </div>
            </div>

            <div>
              <Label className={lbl}>Proper Shipping Name</Label>
              <Input value={form.properShippingName} onChange={(e) => set("properShippingName", e.target.value)} placeholder="Auto-filled from ERG lookup" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={lbl}>Packing Group</Label>
                <Input value={form.packingGroup} onChange={(e) => set("packingGroup", e.target.value)} placeholder="e.g. I, II, III" />
              </div>
              <div>
                <Label className={lbl}>ERG Guide #</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.ergGuide} onChange={(e) => set("ergGuide", e.target.value)} placeholder="e.g. 128" />
                  {form.ergGuide && (
                    <Badge className="bg-orange-600 text-white shrink-0">Guide {form.ergGuide}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const filteredCarTypes = selectedVertical && VERTICAL_RAIL_MAP[selectedVertical]
    ? CAR_TYPES.filter(t => VERTICAL_RAIL_MAP[selectedVertical].includes(t))
    : CAR_TYPES;

  const renderStep1 = () => (
    <div className="space-y-4">
      <VerticalSelector selectedVertical={selectedVertical} onVerticalChange={(v) => { setSelectedVertical(v); set("carType", ""); }} />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className={lbl}>Car Type *</Label>
          {selectedVertical && (
            <button onClick={() => setSelectedVertical("")} className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors">Show all car types</button>
          )}
        </div>
        <Select value={form.carType} onValueChange={(v) => set("carType", v)}>
          <SelectTrigger><SelectValue placeholder="Select car type" /></SelectTrigger>
          <SelectContent>
            {filteredCarTypes.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Number of Cars * (1-100)</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={form.numberOfCars}
          onChange={(e) => set("numberOfCars", e.target.value)}
        />
      </div>
      <div>
        <Label className={lbl}>Special Equipment Notes</Label>
        <Textarea
          value={form.equipmentNotes}
          onChange={(e) => set("equipmentNotes", e.target.value)}
          placeholder="Any special equipment requirements or notes..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Origin Yard *</Label>
        <Select value={form.originYardId} onValueChange={(v) => set("originYardId", v)}>
          <SelectTrigger><SelectValue placeholder="Select origin yard" /></SelectTrigger>
          <SelectContent>
            {(yards.data || []).map((y: any) => (
              <SelectItem key={y.id} value={String(y.id)}>{y.name} — {y.city}, {y.state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Destination Yard *</Label>
        <Select value={form.destinationYardId} onValueChange={(v) => set("destinationYardId", v)}>
          <SelectTrigger><SelectValue placeholder="Select destination yard" /></SelectTrigger>
          <SelectContent>
            {(yards.data || []).map((y: any) => (
              <SelectItem key={y.id} value={String(y.id)}>{y.name} — {y.city}, {y.state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Carrier Preference (optional)</Label>
        <Input value={form.carrierPreference} onChange={(e) => set("carrierPreference", e.target.value)} placeholder="e.g. BNSF, Union Pacific, CSX" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Special Instructions</Label>
        <Textarea
          value={form.specialInstructions}
          onChange={(e) => set("specialInstructions", e.target.value)}
          placeholder="Loading/unloading requirements, access instructions, etc."
          rows={4}
        />
      </div>
      <div>
        <Label className={lbl}>Temperature Requirements</Label>
        <Input
          value={form.temperatureRequirements}
          onChange={(e) => set("temperatureRequirements", e.target.value)}
          placeholder="e.g. Maintain 35-40°F"
        />
      </div>
      <div>
        <Label className={lbl}>Estimated Pickup Date</Label>
        <Input type="date" value={form.estimatedPickupDate} onChange={(e) => set("estimatedPickupDate", e.target.value)} />
      </div>
    </div>
  );

  const originYard = (yards.data || []).find((y: any) => String(y.id) === form.originYardId);
  const destYard = (yards.data || []).find((y: any) => String(y.id) === form.destinationYardId);

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className={cn("text-lg font-semibold", textColor)}>Review Your Shipment</h3>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-blue-400" />
          <span className={cn("font-medium", textColor)}>Commodity</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Commodity:</span><span className={textColor}>{form.commodity || "—"}</span>
          <span className={mutedText}>STCC:</span><span className={textColor}>{form.stccCode || "—"}</span>
          <span className={mutedText}>Weight:</span><span className={textColor}>{form.weightLbs ? `${Number(form.weightLbs).toLocaleString()} lbs` : "—"}</span>
          {form.isHazmat && (
            <>
              <span className={mutedText}>Hazmat:</span>
              <span><Badge variant="destructive" className="text-xs">Class {form.hazmatClass} — UN {form.unNumber}</Badge></span>
              {form.properShippingName && (<><span className={mutedText}>Shipping Name:</span><span className={textColor}>{form.properShippingName}</span></>)}
              {form.packingGroup && (<><span className={mutedText}>Packing Group:</span><span className={textColor}>{form.packingGroup}</span></>)}
              {form.ergGuide && (<><span className={mutedText}>ERG Guide:</span><span><Badge className="bg-orange-600 text-white text-xs">Guide {form.ergGuide}</Badge></span></>)}
            </>
          )}
        </div>
      </div>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <TrainFront className="w-4 h-4 text-blue-400" />
          <span className={cn("font-medium", textColor)}>Equipment</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Car Type:</span><span className={textColor}>{form.carType.replace(/_/g, " ") || "—"}</span>
          <span className={mutedText}>Cars:</span><span className={textColor}>{form.numberOfCars}</span>
          {form.equipmentNotes && (<><span className={mutedText}>Notes:</span><span className={textColor}>{form.equipmentNotes}</span></>)}
        </div>
      </div>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className={cn("font-medium", textColor)}>Route</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Origin:</span><span className={textColor}>{originYard ? `${(originYard as any).name} — ${(originYard as any).city}, ${(originYard as any).state}` : "—"}</span>
          <span className={mutedText}>Destination:</span><span className={textColor}>{destYard ? `${(destYard as any).name} — ${(destYard as any).city}, ${(destYard as any).state}` : "—"}</span>
          {form.carrierPreference && (<><span className={mutedText}>Carrier:</span><span className={textColor}>{form.carrierPreference}</span></>)}
        </div>
      </div>

      {(form.specialInstructions || form.temperatureRequirements || form.estimatedPickupDate) && (
        <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className={cn("font-medium", textColor)}>Requirements</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {form.specialInstructions && (<><span className={mutedText}>Instructions:</span><span className={textColor}>{form.specialInstructions}</span></>)}
            {form.temperatureRequirements && (<><span className={mutedText}>Temperature:</span><span className={textColor}>{form.temperatureRequirements}</span></>)}
            {form.estimatedPickupDate && (<><span className={mutedText}>Pickup Date:</span><span className={textColor}>{form.estimatedPickupDate}</span></>)}
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={create.isPending} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
        {create.isPending ? "Creating Shipment..." : "Submit Rail Shipment"}
      </Button>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <TrainFront className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", textColor)}>Create Rail Shipment</h1>
          <p className={cn("text-sm", mutedText)}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      <Card className={cn("border max-w-2xl", cardBg)}>
        <CardHeader>
          {renderStepIndicator()}
          <CardTitle className={cn(textColor)}>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {stepRenderers[step]()}

          {step < 4 && (
            <div className="flex justify-between mt-6 pt-4 border-t border-slate-700/30">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canNext()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="flex justify-start mt-4 pt-4 border-t border-slate-700/30">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
