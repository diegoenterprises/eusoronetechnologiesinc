/**
 * SHIPPER - CREATE LOAD PAGE
 * 7-step wizard: Hazmat → Quantity → Origin/Dest → Equipment → Carrier Req → Pricing → Review
 * 100% Dynamic - No mock data
 */
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Package, MapPin, Truck, Shield, DollarSign, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Loader2, Calendar, Repeat, Info, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

const STEPS = [
  { id: 1, title: "Product & Hazmat", icon: AlertTriangle },
  { id: 2, title: "Volume & Fleet", icon: Package },
  { id: 3, title: "Origin & Destination", icon: MapPin },
  { id: 4, title: "Equipment", icon: Truck },
  { id: 5, title: "Schedule", icon: Calendar },
  { id: 6, title: "Carrier Requirements", icon: Shield },
  { id: 7, title: "Pricing", icon: DollarSign },
  { id: 8, title: "Review & Submit", icon: CheckCircle },
];

export default function CreateLoad() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Product & Hazmat
    productName: "", hazmatClass: "", unNumber: "", packingGroup: "", isHazmat: false,
    // Step 2: Volume & Fleet Planning
    totalDemand: "", demandUnit: "barrels" as "barrels" | "gallons",
    tankerCapacity: "200", actualFill: "190",
    trucksNeeded: "", loadsPerTruckPerDay: "1", totalDays: "1",
    manualTruckOverride: false,
    // Step 3: Origin/Dest
    originName: "", originAddress: "", originCity: "", originState: "", originZip: "", originContact: "", originPhone: "",
    destName: "", destAddress: "", destCity: "", destState: "", destZip: "", destContact: "", destPhone: "",
    // Step 4: Equipment
    equipmentType: "", trailerLength: "", tempControl: false, tempMin: "", tempMax: "",
    compartments: "1",
    // Step 5: Schedule
    pickupDate: "", deliveryDate: "", scheduleType: "one_time" as "one_time" | "recurring" | "convoy",
    recurringDays: "1", convoySize: "1",
    // Step 6: Carrier Requirements
    twicRequired: false, hazmatEndorsement: false, tankerEndorsement: false, minRating: "",
    assignmentType: "open_market" as "open_market" | "direct_carrier" | "broker" | "own_fleet",
    // Step 7: Pricing
    ratePerLoad: "", paymentTerms: "30", notes: "",
  });

  const hazmatQuery = (trpc as any).esang.chat.useMutation();
  const createLoadMutation = (trpc as any).loads.create.useMutation({
    onSuccess: (data: any) => { toast.success(`Job created: ${data.loadCount || 1} load(s) posted`); navigate("/my-loads"); },
    onError: (err: any) => toast.error("Failed to create load", { description: err.message }),
  });

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const nextStep = () => step < 8 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  // Auto-calculate fleet requirements from demand
  const calc = useMemo(() => {
    const demand = parseFloat(formData.totalDemand) || 0;
    const capacity = parseFloat(formData.actualFill) || 190;
    const maxCap = parseFloat(formData.tankerCapacity) || 200;
    const loadsPerDay = parseInt(formData.loadsPerTruckPerDay) || 1;
    const days = parseInt(formData.totalDays) || 1;
    const ratePerLoad = parseFloat(formData.ratePerLoad) || 0;
    const convoySize = parseInt(formData.convoySize) || 1;

    // gallons conversion: 1 barrel = 42 gallons
    const demandBbl = formData.demandUnit === "gallons" ? demand / 42 : demand;
    const demandGal = formData.demandUnit === "barrels" ? demand * 42 : demand;
    const capacityBbl = capacity;
    const capacityGal = capacity * 42;

    // Total loads needed to move all product
    const totalLoads = demandBbl > 0 ? Math.ceil(demandBbl / capacityBbl) : 0;

    // With schedule: how many loads per day total
    const totalLoadsPerDay = Math.ceil(totalLoads / days);

    // Trucks needed (considering each truck does X loads/day)
    const trucksFromCalc = formData.manualTruckOverride
      ? parseInt(formData.trucksNeeded) || 1
      : Math.ceil(totalLoadsPerDay / loadsPerDay);

    // Actual loads per truck per day (may differ from input if truck override)
    const actualLoadsPerTruckPerDay = trucksFromCalc > 0 ? Math.ceil(totalLoadsPerDay / trucksFromCalc) : 0;

    // Total weight (approx 7.1 lbs/gal for crude, 6.6 for gasoline - use 7 avg)
    const totalWeightLbs = demandGal * 7;

    // Pricing totals
    const totalJobCost = totalLoads * ratePerLoad;
    const ratePerMile = 0; // needs distance input
    const utilizationPct = demandBbl > 0 ? Math.min(100, ((capacity / maxCap) * 100)) : 0;

    // For convoy mode
    const isConvoy = formData.scheduleType === "convoy";
    const effectiveTrucks = isConvoy ? convoySize : trucksFromCalc;

    return {
      demandBbl, demandGal, capacityBbl, capacityGal, totalLoads, totalLoadsPerDay,
      trucksNeeded: effectiveTrucks, actualLoadsPerTruckPerDay,
      totalWeightLbs, totalJobCost, ratePerMile, utilizationPct,
      isConvoy, maxCap,
    };
  }, [formData]);

  const handleSubmit = () => {
    const origin = [formData.originCity, formData.originState].filter(Boolean).join(", ");
    const dest = [formData.destCity, formData.destState].filter(Boolean).join(", ");
    createLoadMutation.mutate({
      productName: formData.productName,
      hazmatClass: formData.isHazmat ? formData.hazmatClass : undefined,
      unNumber: formData.isHazmat ? formData.unNumber : undefined,
      weight: String(Math.round(calc.totalWeightLbs / Math.max(calc.totalLoads, 1))),
      weightUnit: "lbs",
      quantity: String(parseFloat(formData.actualFill) || 0),
      quantityUnit: formData.demandUnit === "barrels" ? "Barrels" : "Gallons",
      origin: origin || "TBD",
      destination: dest || "TBD",
      pickupDate: formData.pickupDate || undefined,
      deliveryDate: formData.deliveryDate || undefined,
      equipment: formData.equipmentType,
      compartments: parseInt(formData.compartments) || 1,
      rate: formData.ratePerLoad || undefined,
      endorsements: [
        formData.twicRequired ? "TWIC" : "",
        formData.hazmatEndorsement ? "Hazmat" : "",
        formData.tankerEndorsement ? "Tanker" : "",
      ].filter(Boolean).join(", ") || undefined,
      minSafetyScore: formData.minRating || undefined,
    } as any);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Create New Load</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Step {step} of 8 {calc.totalLoads > 0 && <Badge className="ml-2 bg-[#1473FF]/20 text-[#1473FF] border-[#1473FF]/30">{calc.totalLoads} load{calc.totalLoads !== 1 ? "s" : ""} / {calc.trucksNeeded} truck{calc.trucksNeeded !== 1 ? "s" : ""}</Badge>}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button onClick={() => s.id < step && setStep(s.id)} className={cn("flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-lg transition-colors shrink-0", step === s.id ? "bg-[#1473FF]/20 text-[#1473FF]" : step > s.id ? "bg-[#BE01FF]/15 text-[#BE01FF] cursor-pointer hover:bg-[#BE01FF]/25" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800/50 text-slate-500")}>
              <s.icon className="w-4 h-4" />
              <span className="text-xs md:text-sm hidden md:inline">{s.title}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 w-4 md:w-8 shrink-0", step > s.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : isLight ? "bg-slate-200" : "bg-slate-700")} />}
          </React.Fragment>
        ))}
      </div>

      <Progress value={(step / 8) * 100} className="h-2 mb-6" />

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Product Name</Label><Input value={formData.productName} onChange={e => updateField("productName", e.target.value)} placeholder="Enter product name" className="bg-slate-700/50 border-slate-600/50" /></div>
                <div className="flex items-center gap-2 pt-6"><Checkbox checked={formData.isHazmat} onCheckedChange={v => updateField("isHazmat", v)} /><Label>This is a hazardous material</Label></div>
              </div>
              {formData.isHazmat && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div><Label>Hazmat Class</Label>{(hazmatQuery as any).isLoading || (hazmatQuery as any).isPending ? <Skeleton className="h-10" /> : <Select value={formData.hazmatClass} onValueChange={v => updateField("hazmatClass", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent><SelectItem value="1">Class 1 - Explosives</SelectItem><SelectItem value="2">Class 2 - Gases</SelectItem><SelectItem value="3">Class 3 - Flammable Liquids</SelectItem><SelectItem value="4">Class 4 - Flammable Solids</SelectItem><SelectItem value="5">Class 5 - Oxidizers</SelectItem><SelectItem value="6">Class 6 - Poisons</SelectItem><SelectItem value="7">Class 7 - Radioactive</SelectItem><SelectItem value="8">Class 8 - Corrosives</SelectItem><SelectItem value="9">Class 9 - Misc</SelectItem></SelectContent></Select>}</div>
                  <div><Label>UN Number</Label><Input value={formData.unNumber} onChange={e => updateField("unNumber", e.target.value)} placeholder="UN1234" className="bg-slate-700/50" /></div>
                  <div><Label>Packing Group</Label><Select value={formData.packingGroup} onValueChange={v => updateField("packingGroup", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="I">I - Great Danger</SelectItem><SelectItem value="II">II - Medium Danger</SelectItem><SelectItem value="III">III - Minor Danger</SelectItem></SelectContent></Select></div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-[#1473FF]" />
                <h3 className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>Total Volume Demand</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Total Volume Needed</Label><Input type="number" value={formData.totalDemand} onChange={e => updateField("totalDemand", e.target.value)} placeholder="e.g. 5000" className="bg-slate-700/50" /></div>
                <div><Label>Unit</Label><Select value={formData.demandUnit} onValueChange={v => updateField("demandUnit", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="barrels">Barrels (bbl)</SelectItem><SelectItem value="gallons">Gallons (gal)</SelectItem></SelectContent></Select></div>
                <div><Label>Days to Complete</Label><Input type="number" min="1" value={formData.totalDays} onChange={e => updateField("totalDays", e.target.value)} className="bg-slate-700/50" /></div>
              </div>

              <div className={cn("p-4 rounded-xl border", isLight ? "bg-blue-50 border-blue-200" : "bg-[#1473FF]/5 border-[#1473FF]/20")}>
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-[#BE01FF]" />
                  <h3 className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>Tanker Configuration</h3>
                  <Badge className="bg-[#BE01FF]/15 text-[#BE01FF] border-[#BE01FF]/30 text-[10px]">Variable Capacity</Badge>
                </div>
                <p className={cn("text-xs mb-3", isLight ? "text-slate-500" : "text-slate-400")}>Not all tankers are the same. Set the trailer max capacity and actual fill level for accurate calculations.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Tanker Max Capacity (bbl)</Label><Input type="number" value={formData.tankerCapacity} onChange={e => updateField("tankerCapacity", e.target.value)} placeholder="130-210" className="bg-slate-700/50" /><p className="text-[10px] text-slate-500 mt-1">Industry range: 130-210 bbl</p></div>
                  <div><Label>Actual Fill Per Load (bbl)</Label><Input type="number" value={formData.actualFill} onChange={e => updateField("actualFill", e.target.value)} placeholder="e.g. 190" className="bg-slate-700/50" /><p className="text-[10px] text-slate-500 mt-1">Operators rarely fill to max</p></div>
                  <div><Label>Loads Per Truck / Day</Label><Input type="number" min="1" value={formData.loadsPerTruckPerDay} onChange={e => updateField("loadsPerTruckPerDay", e.target.value)} className="bg-slate-700/50" /><p className="text-[10px] text-slate-500 mt-1">Round trips per truck daily</p></div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox checked={formData.manualTruckOverride} onCheckedChange={v => updateField("manualTruckOverride", v)} />
                  <Label className="text-sm">I want to specify exact truck count</Label>
                </div>
                {formData.manualTruckOverride && (
                  <div className="mt-2 w-48"><Label>Trucks</Label><Input type="number" min="1" value={formData.trucksNeeded} onChange={e => updateField("trucksNeeded", e.target.value)} className="bg-slate-700/50" /></div>
                )}
              </div>

              {calc.totalLoads > 0 && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30")}>
                  <h4 className={cn("font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                    <Info className="w-4 h-4 text-[#1473FF]" />Fleet Calculator Results
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-slate-400 text-xs">Total Loads</p><p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>{calc.totalLoads}</p></div>
                    <div><p className="text-slate-400 text-xs">Trucks Needed</p><p className="text-xl font-bold text-[#1473FF]">{calc.trucksNeeded}</p></div>
                    <div><p className="text-slate-400 text-xs">Loads/Truck/Day</p><p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>{calc.actualLoadsPerTruckPerDay}</p></div>
                    <div><p className="text-slate-400 text-xs">Fill Utilization</p><p className="text-xl font-bold text-[#BE01FF]">{calc.utilizationPct.toFixed(0)}%</p></div>
                    <div><p className="text-slate-400 text-xs">Total Volume</p><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{calc.demandBbl.toLocaleString()} bbl ({calc.demandGal.toLocaleString()} gal)</p></div>
                    <div><p className="text-slate-400 text-xs">Per Load</p><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{parseFloat(formData.actualFill || "0")} bbl ({(parseFloat(formData.actualFill || "0") * 42).toLocaleString()} gal)</p></div>
                    <div><p className="text-slate-400 text-xs">Est. Weight/Load</p><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{Math.round(calc.totalWeightLbs / calc.totalLoads).toLocaleString()} lbs</p></div>
                    <div><p className="text-slate-400 text-xs">Total Weight</p><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{Math.round(calc.totalWeightLbs).toLocaleString()} lbs</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("space-y-4 p-4 rounded-lg", isLight ? "bg-[#1473FF]/5 border border-[#1473FF]/20" : "bg-[#1473FF]/10 border border-[#1473FF]/30")}>
                <h3 className="text-[#1473FF] font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Origin / Pickup</h3>
                <Input value={formData.originName} onChange={e => updateField("originName", e.target.value)} placeholder="Facility Name" className="bg-slate-700/50" />
                <Input value={formData.originAddress} onChange={e => updateField("originAddress", e.target.value)} placeholder="Address" className="bg-slate-700/50" />
                <div className="grid grid-cols-3 gap-2"><Input value={formData.originCity} onChange={e => updateField("originCity", e.target.value)} placeholder="City" className="bg-slate-700/50" /><Input value={formData.originState} onChange={e => updateField("originState", e.target.value)} placeholder="State" className="bg-slate-700/50" /><Input value={formData.originZip} onChange={e => updateField("originZip", e.target.value)} placeholder="ZIP" className="bg-slate-700/50" /></div>
                <Input value={formData.originContact} onChange={e => updateField("originContact", e.target.value)} placeholder="Contact Name" className="bg-slate-700/50" />
                <Input value={formData.originPhone} onChange={e => updateField("originPhone", e.target.value)} placeholder="Phone" className="bg-slate-700/50" />
              </div>
              <div className={cn("space-y-4 p-4 rounded-lg", isLight ? "bg-[#BE01FF]/5 border border-[#BE01FF]/20" : "bg-[#BE01FF]/10 border border-[#BE01FF]/30")}>
                <h3 className="text-[#BE01FF] font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Destination / Drop-off</h3>
                <Input value={formData.destName} onChange={e => updateField("destName", e.target.value)} placeholder="Facility Name" className="bg-slate-700/50" />
                <Input value={formData.destAddress} onChange={e => updateField("destAddress", e.target.value)} placeholder="Address" className="bg-slate-700/50" />
                <div className="grid grid-cols-3 gap-2"><Input value={formData.destCity} onChange={e => updateField("destCity", e.target.value)} placeholder="City" className="bg-slate-700/50" /><Input value={formData.destState} onChange={e => updateField("destState", e.target.value)} placeholder="State" className="bg-slate-700/50" /><Input value={formData.destZip} onChange={e => updateField("destZip", e.target.value)} placeholder="ZIP" className="bg-slate-700/50" /></div>
                <Input value={formData.destContact} onChange={e => updateField("destContact", e.target.value)} placeholder="Contact Name" className="bg-slate-700/50" />
                <Input value={formData.destPhone} onChange={e => updateField("destPhone", e.target.value)} placeholder="Phone" className="bg-slate-700/50" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Equipment Type</Label><Select value={formData.equipmentType} onValueChange={v => updateField("equipmentType", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="dry_van">Dry Van</SelectItem><SelectItem value="reefer">Reefer</SelectItem><SelectItem value="flatbed">Flatbed</SelectItem><SelectItem value="tanker">Tanker</SelectItem><SelectItem value="step_deck">Step Deck</SelectItem><SelectItem value="lowboy">Lowboy</SelectItem></SelectContent></Select></div>
                <div><Label>Trailer Length</Label><Select value={formData.trailerLength} onValueChange={v => updateField("trailerLength", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="48">48 ft</SelectItem><SelectItem value="53">53 ft</SelectItem></SelectContent></Select></div>
                <div><Label>Compartments</Label><Input type="number" min="1" max="5" value={formData.compartments} onChange={e => updateField("compartments", e.target.value)} className="bg-slate-700/50" /></div>
              </div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.tempControl} onCheckedChange={v => updateField("tempControl", v)} /><Label>Temperature Controlled</Label></div>
              {formData.tempControl && <div className="grid grid-cols-2 gap-4"><div><Label>Min Temp (F)</Label><Input type="number" value={formData.tempMin} onChange={e => updateField("tempMin", e.target.value)} className="bg-slate-700/50" /></div><div><Label>Max Temp (F)</Label><Input type="number" value={formData.tempMax} onChange={e => updateField("tempMax", e.target.value)} className="bg-slate-700/50" /></div></div>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Pickup Date</Label><Input type="date" value={formData.pickupDate} onChange={e => updateField("pickupDate", e.target.value)} className="bg-slate-700/50" /></div>
                <div><Label>Delivery Date</Label><Input type="date" value={formData.deliveryDate} onChange={e => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50" /></div>
              </div>
              <div><Label>Schedule Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {[
                    { v: "one_time" as const, label: "One-Time Job", desc: "Single batch of loads posted at once" },
                    { v: "recurring" as const, label: "Recurring Schedule", desc: "Loads repeat over multiple days" },
                    { v: "convoy" as const, label: "Convoy", desc: "Multiple trucks travel together" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => updateField("scheduleType", opt.v)} className={cn("p-4 rounded-xl border text-left transition-all", formData.scheduleType === opt.v ? "border-[#1473FF] bg-[#1473FF]/10" : isLight ? "border-slate-200 bg-white hover:border-slate-300" : "border-slate-700 bg-slate-800/30 hover:border-slate-600")}>
                      <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{opt.label}</p>
                      <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {formData.scheduleType === "recurring" && (
                <div className="w-48"><Label>Recurring Days</Label><Input type="number" min="1" value={formData.recurringDays} onChange={e => { updateField("recurringDays", e.target.value); updateField("totalDays", e.target.value); }} className="bg-slate-700/50" /></div>
              )}
              {formData.scheduleType === "convoy" && (
                <div className="w-48"><Label>Convoy Size (trucks)</Label><Input type="number" min="2" value={formData.convoySize} onChange={e => updateField("convoySize", e.target.value)} className="bg-slate-700/50" /></div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Checkbox checked={formData.twicRequired} onCheckedChange={v => updateField("twicRequired", v)} /><Label>TWIC Card Required</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={formData.hazmatEndorsement} onCheckedChange={v => updateField("hazmatEndorsement", v)} /><Label>Hazmat Endorsement</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={formData.tankerEndorsement} onCheckedChange={v => updateField("tankerEndorsement", v)} /><Label>Tanker Endorsement</Label></div>
              </div>
              <div><Label>Minimum Safety Rating</Label><Select value={formData.minRating} onValueChange={v => updateField("minRating", v)}><SelectTrigger className="bg-slate-700/50 w-48"><SelectValue placeholder="Any" /></SelectTrigger><SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="satisfactory">Satisfactory</SelectItem><SelectItem value="conditional">Conditional or Better</SelectItem></SelectContent></Select></div>
              <div><Label>Assignment Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {[
                    { v: "open_market" as const, label: "Open Market", desc: "Post to all carriers" },
                    { v: "direct_carrier" as const, label: "Direct Carrier", desc: "Assign to specific carrier" },
                    { v: "broker" as const, label: "Via Broker", desc: "Let a broker coordinate" },
                    { v: "own_fleet" as const, label: "Own Fleet", desc: "Use your own trucks" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => updateField("assignmentType", opt.v)} className={cn("p-3 rounded-xl border text-left transition-all", formData.assignmentType === opt.v ? "border-[#1473FF] bg-[#1473FF]/10" : isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-800/30")}>
                      <p className={cn("font-semibold text-xs", isLight ? "text-slate-800" : "text-white")}>{opt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Rate Per Load ($)</Label><Input type="number" value={formData.ratePerLoad} onChange={e => updateField("ratePerLoad", e.target.value)} placeholder="Rate for a single truck load" className="bg-slate-700/50" /></div>
                <div><Label>Payment Terms</Label><Select value={formData.paymentTerms} onValueChange={v => updateField("paymentTerms", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="quick">Quick Pay (2%)</SelectItem><SelectItem value="15">Net 15</SelectItem><SelectItem value="30">Net 30</SelectItem></SelectContent></Select></div>
              </div>
              {calc.totalLoads > 0 && parseFloat(formData.ratePerLoad) > 0 && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30")}>
                  <h4 className={cn("font-semibold mb-3", isLight ? "text-slate-800" : "text-white")}>Total Job Cost Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-slate-400 text-xs">Rate / Load</p><p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${parseFloat(formData.ratePerLoad).toLocaleString()}</p></div>
                    <div><p className="text-slate-400 text-xs">Total Loads</p><p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{calc.totalLoads}</p></div>
                    <div><p className="text-slate-400 text-xs">Total Job Cost</p><p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${calc.totalJobCost.toLocaleString()}</p></div>
                  </div>
                </div>
              )}
              <div className="col-span-full"><Label>Special Instructions</Label><Textarea value={formData.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Loading instructions, safety notes, contact details..." className="bg-slate-700/50" /></div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              <h3 className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>Review Your Job</h3>

              <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30")}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div><p className="text-slate-400 text-xs">Total Loads</p><p className="text-2xl font-bold text-[#1473FF]">{calc.totalLoads}</p></div>
                  <div><p className="text-slate-400 text-xs">Trucks</p><p className="text-2xl font-bold text-[#BE01FF]">{calc.trucksNeeded}</p></div>
                  <div><p className="text-slate-400 text-xs">Volume</p><p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{calc.demandBbl.toLocaleString()} bbl</p></div>
                  <div><p className="text-slate-400 text-xs">Total Cost</p><p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${calc.totalJobCost.toLocaleString()}</p></div>
                </div>
              </div>

              <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700")}>
                <div><p className="text-slate-400 text-xs">Product</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.productName || "N/A"}</p></div>
                <div><p className="text-slate-400 text-xs">Hazmat</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.isHazmat ? `Class ${formData.hazmatClass} (${formData.unNumber})` : "No"}</p></div>
                <div><p className="text-slate-400 text-xs">Equipment</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.equipmentType || "N/A"}</p></div>
                <div><p className="text-slate-400 text-xs">Tanker Capacity</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.actualFill} bbl fill / {formData.tankerCapacity} bbl max ({calc.utilizationPct.toFixed(0)}%)</p></div>
                <div><p className="text-slate-400 text-xs">Weight Per Load</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{calc.totalLoads > 0 ? Math.round(calc.totalWeightLbs / calc.totalLoads).toLocaleString() : 0} lbs</p></div>
                <div><p className="text-slate-400 text-xs">Total Weight</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{Math.round(calc.totalWeightLbs).toLocaleString()} lbs</p></div>
                <div><p className="text-slate-400 text-xs">Origin</p><p className="font-medium text-[#1473FF]">{formData.originCity ? `${formData.originCity}, ${formData.originState}` : "N/A"}</p></div>
                <div><p className="text-slate-400 text-xs">Destination</p><p className="font-medium text-[#BE01FF]">{formData.destCity ? `${formData.destCity}, ${formData.destState}` : "N/A"}</p></div>
                <div><p className="text-slate-400 text-xs">Schedule</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.scheduleType === "convoy" ? `Convoy (${formData.convoySize} trucks)` : formData.scheduleType === "recurring" ? `Recurring (${formData.recurringDays} days)` : "One-Time"}</p></div>
                <div><p className="text-slate-400 text-xs">Loads/Truck/Day</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{calc.actualLoadsPerTruckPerDay}</p></div>
                <div><p className="text-slate-400 text-xs">Rate / Load</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>${parseFloat(formData.ratePerLoad || "0").toLocaleString()}</p></div>
                <div><p className="text-slate-400 text-xs">Assignment</p><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{formData.assignmentType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p></div>
              </div>

              {formData.notes && (
                <div className={cn("p-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700")}>
                  <p className="text-slate-400 text-xs mb-1">Special Instructions</p>
                  <p className={cn(isLight ? "text-slate-800" : "text-white")}>{formData.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1} className={cn(isLight ? "border-slate-200" : "bg-slate-800/50 border-slate-700/50")}><ChevronLeft className="w-4 h-4 mr-2" />Previous</Button>
        {step < 8 ? (
          <Button onClick={nextStep} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white">Next<ChevronRight className="w-4 h-4 ml-2" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createLoadMutation.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white">
            {createLoadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Post {calc.totalLoads > 1 ? `${calc.totalLoads} Loads` : "Load"} to Market
          </Button>
        )}
      </div>
    </div>
  );
}
