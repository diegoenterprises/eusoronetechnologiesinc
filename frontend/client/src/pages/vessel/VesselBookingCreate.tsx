/**
 * VESSEL BOOKING CREATION WIZARD
 * 5-step multi-modal wizard for ocean freight bookings
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
import { Ship, Package, MapPin, FileText, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Anchor, Thermometer, Search } from "lucide-react";
import { toast } from "sonner";
import { VerticalSelector } from "@/components/VerticalFieldsPanel";
import { VERTICAL_VESSEL_MAP, VERTICAL_CONTAINER_MAP } from "@/lib/loadConstants";

const STEPS = ["Cargo", "Containers", "Route", "Terms", "Review"];
const STEP_ICONS = [Package, Ship, MapPin, FileText, CheckCircle];

const CARGO_TYPES = [
  "container", "bulk_dry", "bulk_liquid", "breakbulk", "ro_ro", "reefer", "project_cargo",
];

const CONTAINER_SIZES = ["20ft", "40ft", "40ft_hc", "45ft", "20ft_reefer", "40ft_reefer"];

const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];

const FREIGHT_TERMS = ["prepaid", "collect", "third_party"];

const IMDG_CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function VesselBookingCreate() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [imdgSearch, setImdgSearch] = useState("");
  const [imdgDebouncedSearch, setImdgDebouncedSearch] = useState("");
  const [showImdgSuggestions, setShowImdgSuggestions] = useState(false);
  const imdgDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    // Step 1: Cargo
    cargoType: "",
    commodity: "",
    isHazmat: false,
    imdgClass: "",
    unNumber: "",
    properShippingName: "",
    marinePollutant: false,
    // Step 2: Containers
    containerSize: "",
    numberOfContainers: "1",
    totalWeightKg: "",
    totalVolumeCBM: "",
    temperatureSetting: "",
    // Step 3: Route
    originPortId: "",
    destinationPortId: "",
    etd: "",
    eta: "",
    // Step 4: Terms
    incoterms: "",
    freightTerms: "",
    insuranceRequired: false,
  });

  // Fetch ports for dropdowns — using vessel shipments query to get port data
  const portsQuery = trpc.vesselShipments.getVesselShipments.useQuery(
    { limit: 1 },
    { enabled: false }
  );

  const create = trpc.vesselShipments.createVesselBooking.useMutation({
    onSuccess: (d) => {
      toast.success(`Booking ${d.bookingNumber} created`);
      navigate(`/vessel/bookings/${d.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  // IMDG/ERG hazmat lookup
  useEffect(() => {
    const timer = setTimeout(() => setImdgDebouncedSearch(imdgSearch), 300);
    return () => clearTimeout(timer);
  }, [imdgSearch]);

  // Try IMDG search first, fall back to ERG
  const imdgResults = (trpc as any).imdg?.search?.useQuery?.(
    { query: imdgDebouncedSearch, limit: 10 },
    { enabled: !!imdgDebouncedSearch && imdgDebouncedSearch.length >= 2 }
  );
  const ergFallbackResults = (trpc as any).erg?.search?.useQuery?.(
    { query: imdgDebouncedSearch, limit: 10 },
    { enabled: !!imdgDebouncedSearch && imdgDebouncedSearch.length >= 2 && !imdgResults }
  );
  const hazmatLookupResults = imdgResults || ergFallbackResults;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (imdgDropdownRef.current && !imdgDropdownRef.current.contains(e.target as Node)) {
        setShowImdgSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImdgSelect = (material: any) => {
    setForm((p) => ({
      ...p,
      imdgClass: material.hazardClass || material.hazmatClass || material.imdgClass || "",
      unNumber: material.unNumber || "",
      properShippingName: material.name || material.properShippingName || "",
      marinePollutant: material.marinePollutant || false,
    }));
    setImdgSearch(material.name || material.unNumber || "");
    setShowImdgSuggestions(false);
  };

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");
  const lbl = cn("text-sm font-medium mb-1.5 block", isLight ? "text-slate-700" : "text-slate-300");
  const textColor = isLight ? "text-slate-900" : "text-white";
  const mutedText = isLight ? "text-slate-500" : "text-slate-400";
  const isReefer = form.containerSize.includes("reefer") || form.cargoType === "reefer";

  const canNext = (): boolean => {
    if (step === 0) return !!form.cargoType && !!form.commodity;
    if (step === 1) return !!form.containerSize && Number(form.numberOfContainers) >= 1;
    if (step === 2) return !!form.originPortId && !!form.destinationPortId;
    return true;
  };

  const handleSubmit = () => {
    if (!form.originPortId || !form.destinationPortId) return toast.error("Select origin and destination ports");
    create.mutate({
      originPortId: Number(form.originPortId),
      destinationPortId: Number(form.destinationPortId),
      cargoType: (form.cargoType || undefined) as any,
      commodity: form.commodity || undefined,
      containerSize: (form.containerSize || undefined) as any,
      numberOfContainers: Number(form.numberOfContainers) || 1,
      totalWeightKg: form.totalWeightKg ? Number(form.totalWeightKg) : undefined,
      totalVolumeCBM: form.totalVolumeCBM ? Number(form.totalVolumeCBM) : undefined,
      temperatureSetting: form.temperatureSetting || undefined,
      hazmatClass: form.isHazmat ? form.imdgClass : undefined,
      imdgCode: form.isHazmat ? form.unNumber : undefined,
      incoterms: form.incoterms || undefined,
      freightTerms: (form.freightTerms || undefined) as any,
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
                  isComplete ? "bg-green-500 text-white" : isActive ? "bg-cyan-500 text-white" : isLight ? "bg-slate-200 text-slate-500" : "bg-slate-700 text-slate-400"
                )}
              >
                {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn("text-xs font-medium", isActive ? "text-cyan-500" : mutedText)}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 mt-[-1rem]", isComplete ? "bg-green-500" : isLight ? "bg-slate-200" : "bg-slate-700")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const filteredCargoTypes = selectedVertical && VERTICAL_VESSEL_MAP[selectedVertical]
    ? CARGO_TYPES.filter(t => VERTICAL_VESSEL_MAP[selectedVertical].includes(t))
    : CARGO_TYPES;

  const filteredContainerSizes = selectedVertical && VERTICAL_CONTAINER_MAP[selectedVertical]
    ? CONTAINER_SIZES.filter(s => VERTICAL_CONTAINER_MAP[selectedVertical].includes(s))
    : CONTAINER_SIZES;

  // Step 1: Cargo & Hazmat
  const renderStep0 = () => (
    <div className="space-y-4">
      <VerticalSelector selectedVertical={selectedVertical} onVerticalChange={(v) => { setSelectedVertical(v); set("cargoType", ""); set("containerSize", ""); }} />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className={lbl}>Cargo Type *</Label>
          {selectedVertical && (
            <button onClick={() => setSelectedVertical("")} className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors">Show all cargo types</button>
          )}
        </div>
        <Select value={form.cargoType} onValueChange={(v) => set("cargoType", v)}>
          <SelectTrigger><SelectValue placeholder="Select cargo type" /></SelectTrigger>
          <SelectContent>
            {filteredCargoTypes.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Commodity Name *</Label>
        <Input value={form.commodity} onChange={(e) => set("commodity", e.target.value)} placeholder="e.g. Electronics, Auto Parts, Textiles" />
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <Label className={lbl}>Hazmat Cargo?</Label>
          <Button
            variant={form.isHazmat ? "default" : "outline"}
            size="sm"
            onClick={() => set("isHazmat", !form.isHazmat)}
            className={form.isHazmat ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            {form.isHazmat ? "Yes — IMDG" : "No"}
          </Button>
        </div>
        {form.isHazmat && (
          <div className="pl-8 border-l-2 border-amber-500/30 space-y-4">
            {/* IMDG/ERG Search */}
            <div className="relative" ref={imdgDropdownRef}>
              <Label className={lbl}>Search IMDG / ERG Database</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={imdgSearch}
                  onChange={(e) => { setImdgSearch(e.target.value); setShowImdgSuggestions(true); }}
                  onFocus={() => { if (imdgSearch.length >= 2) setShowImdgSuggestions(true); }}
                  placeholder="Search by UN number or material name..."
                  className="pl-9"
                />
              </div>
              {showImdgSuggestions && hazmatLookupResults?.data?.materials?.length > 0 && (
                <div className={cn(
                  "absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600"
                )}>
                  {hazmatLookupResults.data.materials.map((m: any, idx: number) => (
                    <button
                      key={`${m.unNumber}-${idx}`}
                      type="button"
                      onClick={() => handleImdgSelect(m)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors",
                        isLight ? "hover:bg-slate-100 border-b border-slate-100" : "hover:bg-slate-700 border-b border-slate-700/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">{m.unNumber}</Badge>
                        <span className={cn("truncate", textColor)}>{m.name}</span>
                        {m.marinePollutant && <Badge className="bg-blue-600 text-white text-[10px] shrink-0">MP</Badge>}
                      </div>
                      <div className={cn("text-xs mt-0.5", mutedText)}>
                        IMDG Class {m.hazardClass || m.hazmatClass || m.imdgClass} | PG {m.packingGroup || "—"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showImdgSuggestions && imdgDebouncedSearch.length >= 2 && hazmatLookupResults?.isLoading && (
                <div className={cn(
                  "absolute z-50 w-full mt-1 rounded-lg border p-3 text-center text-sm",
                  isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-800 border-slate-600 text-slate-400"
                )}>
                  Searching hazmat database...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={lbl}>IMDG Class *</Label>
                <Select value={form.imdgClass} onValueChange={(v) => set("imdgClass", v)}>
                  <SelectTrigger><SelectValue placeholder="Select IMDG class" /></SelectTrigger>
                  <SelectContent>
                    {IMDG_CLASSES.map((c) => (
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
              <Input value={form.properShippingName} onChange={(e) => set("properShippingName", e.target.value)} placeholder="Auto-filled from IMDG lookup" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Label className={lbl}>Marine Pollutant</Label>
              <Button
                variant={form.marinePollutant ? "default" : "outline"}
                size="sm"
                onClick={() => set("marinePollutant", !form.marinePollutant)}
                className={form.marinePollutant ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {form.marinePollutant ? "Yes — Marine Pollutant" : "No"}
              </Button>
            </div>

            {form.imdgClass && (
              <div className={cn("flex items-center gap-3 p-3 rounded-lg", isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-900/20 border border-amber-800/30")}>
                <div className={cn(
                  "w-10 h-10 rounded flex items-center justify-center font-bold text-lg border-2",
                  "border-amber-500 text-amber-500"
                )}>
                  {form.imdgClass}
                </div>
                <div>
                  <span className={cn("text-sm font-medium", textColor)}>IMDG Class {form.imdgClass}</span>
                  {form.properShippingName && <p className={cn("text-xs", mutedText)}>{form.properShippingName}</p>}
                </div>
                {form.marinePollutant && <Badge className="bg-blue-600 text-white text-xs ml-auto">Marine Pollutant</Badge>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Step 2: Containers
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Container Size *</Label>
        <Select value={form.containerSize} onValueChange={(v) => set("containerSize", v)}>
          <SelectTrigger><SelectValue placeholder="Select container size" /></SelectTrigger>
          <SelectContent>
            {filteredContainerSizes.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Number of Containers *</Label>
        <Input type="number" min={1} value={form.numberOfContainers} onChange={(e) => set("numberOfContainers", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className={lbl}>Total Weight (kg)</Label>
          <Input type="number" value={form.totalWeightKg} onChange={(e) => set("totalWeightKg", e.target.value)} placeholder="Gross weight in kg" />
        </div>
        <div>
          <Label className={lbl}>Total Volume (CBM)</Label>
          <Input type="number" value={form.totalVolumeCBM} onChange={(e) => set("totalVolumeCBM", e.target.value)} placeholder="Volume in cubic meters" />
        </div>
      </div>
      {isReefer && (
        <div className={cn("p-4 rounded-lg border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-900/20 border-blue-800/30")}>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-blue-400" />
            <Label className={cn("text-sm font-medium", textColor)}>Reefer Settings</Label>
          </div>
          <div>
            <Label className={lbl}>Temperature Setting</Label>
            <Input
              value={form.temperatureSetting}
              onChange={(e) => set("temperatureSetting", e.target.value)}
              placeholder="e.g. -18°C or 2-4°C"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Route
  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Origin Port *</Label>
        <Input
          type="number"
          value={form.originPortId}
          onChange={(e) => set("originPortId", e.target.value)}
          placeholder="Origin Port ID (e.g. 1)"
        />
        <span className={cn("text-xs mt-1 block", mutedText)}>Enter the port ID for the loading port</span>
      </div>
      <div>
        <Label className={lbl}>Destination Port *</Label>
        <Input
          type="number"
          value={form.destinationPortId}
          onChange={(e) => set("destinationPortId", e.target.value)}
          placeholder="Destination Port ID (e.g. 5)"
        />
        <span className={cn("text-xs mt-1 block", mutedText)}>Enter the port ID for the discharge port</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className={lbl}>ETD (Estimated Departure)</Label>
          <Input type="date" value={form.etd} onChange={(e) => set("etd", e.target.value)} />
        </div>
        <div>
          <Label className={lbl}>ETA (Estimated Arrival)</Label>
          <Input type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} />
        </div>
      </div>
    </div>
  );

  // Step 4: Terms
  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label className={lbl}>Incoterms</Label>
        <Select value={form.incoterms} onValueChange={(v) => set("incoterms", v)}>
          <SelectTrigger><SelectValue placeholder="Select incoterm" /></SelectTrigger>
          <SelectContent>
            {INCOTERMS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={lbl}>Freight Terms</Label>
        <Select value={form.freightTerms} onValueChange={(v) => set("freightTerms", v)}>
          <SelectTrigger><SelectValue placeholder="Select freight terms" /></SelectTrigger>
          <SelectContent>
            {FREIGHT_TERMS.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <Label className={lbl}>Cargo Insurance</Label>
          <Button
            variant={form.insuranceRequired ? "default" : "outline"}
            size="sm"
            onClick={() => set("insuranceRequired", !form.insuranceRequired)}
            className={form.insuranceRequired ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {form.insuranceRequired ? "Required" : "Not Required"}
          </Button>
        </div>
        {form.insuranceRequired && (
          <p className={cn("text-xs mt-2 pl-2", mutedText)}>
            Insurance coverage will be arranged based on cargo value and terms. A certificate of insurance will be issued prior to sailing.
          </p>
        )}
      </div>
    </div>
  );

  // Step 5: Review
  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className={cn("text-lg font-semibold", textColor)}>Review Your Booking</h3>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-cyan-400" />
          <span className={cn("font-medium", textColor)}>Cargo</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Cargo Type:</span><span className={textColor}>{form.cargoType.replace(/_/g, " ") || "—"}</span>
          <span className={mutedText}>Commodity:</span><span className={textColor}>{form.commodity || "—"}</span>
          {form.isHazmat && (
            <>
              <span className={mutedText}>Hazmat:</span>
              <span><Badge variant="destructive" className="text-xs">IMDG {form.imdgClass} — UN {form.unNumber}</Badge></span>
              {form.properShippingName && (<><span className={mutedText}>Shipping Name:</span><span className={textColor}>{form.properShippingName}</span></>)}
              {form.marinePollutant && (<><span className={mutedText}>Marine Pollutant:</span><span><Badge className="bg-blue-600 text-white text-xs">Yes</Badge></span></>)}
            </>
          )}
        </div>
      </div>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <Ship className="w-4 h-4 text-cyan-400" />
          <span className={cn("font-medium", textColor)}>Containers</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Size:</span><span className={textColor}>{form.containerSize.replace(/_/g, " ").toUpperCase() || "—"}</span>
          <span className={mutedText}>Count:</span><span className={textColor}>{form.numberOfContainers}</span>
          <span className={mutedText}>Weight:</span><span className={textColor}>{form.totalWeightKg ? `${Number(form.totalWeightKg).toLocaleString()} kg` : "—"}</span>
          <span className={mutedText}>Volume:</span><span className={textColor}>{form.totalVolumeCBM ? `${form.totalVolumeCBM} CBM` : "—"}</span>
          {isReefer && form.temperatureSetting && (
            <><span className={mutedText}>Temperature:</span><span className={textColor}>{form.temperatureSetting}</span></>
          )}
        </div>
      </div>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className={cn("font-medium", textColor)}>Route</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Origin Port:</span><span className={textColor}>Port #{form.originPortId || "—"}</span>
          <span className={mutedText}>Destination Port:</span><span className={textColor}>Port #{form.destinationPortId || "—"}</span>
          {form.etd && (<><span className={mutedText}>ETD:</span><span className={textColor}>{form.etd}</span></>)}
          {form.eta && (<><span className={mutedText}>ETA:</span><span className={textColor}>{form.eta}</span></>)}
        </div>
      </div>

      <div className={cn("rounded-lg p-4 space-y-3", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700")}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className={cn("font-medium", textColor)}>Terms</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className={mutedText}>Incoterms:</span><span className={textColor}>{form.incoterms || "—"}</span>
          <span className={mutedText}>Freight Terms:</span><span className={textColor}>{form.freightTerms.replace(/_/g, " ") || "—"}</span>
          <span className={mutedText}>Insurance:</span>
          <span>{form.insuranceRequired ? <Badge className="bg-green-600 text-xs">Required</Badge> : <span className={textColor}>Not required</span>}</span>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={create.isPending} className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4">
        {create.isPending ? "Creating Booking..." : "Submit Vessel Booking"}
      </Button>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Ship className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", textColor)}>Create Vessel Booking</h1>
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
                className="bg-cyan-600 hover:bg-cyan-700"
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
