/**
 * SHIPPER - CREATE LOAD PAGE
 * 7-step wizard: Hazmat → Quantity → Origin/Dest → Equipment → Carrier Req → Pricing → Review
 * 100% Dynamic - No mock data
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Package, MapPin, Truck, Shield, DollarSign, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

const STEPS = [
  { id: 1, title: "Product & Hazmat", icon: AlertTriangle },
  { id: 2, title: "Quantity", icon: Package },
  { id: 3, title: "Origin & Destination", icon: MapPin },
  { id: 4, title: "Equipment", icon: Truck },
  { id: 5, title: "Carrier Requirements", icon: Shield },
  { id: 6, title: "Pricing", icon: DollarSign },
  { id: 7, title: "Review & Submit", icon: CheckCircle },
];

export default function CreateLoad() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: "", hazmatClass: "", unNumber: "", packingGroup: "", isHazmat: false,
    weight: "", units: "lbs", pallets: "", pieces: "",
    originName: "", originAddress: "", originCity: "", originState: "", originZip: "", originContact: "", originPhone: "",
    destName: "", destAddress: "", destCity: "", destState: "", destZip: "", destContact: "", destPhone: "",
    equipmentType: "", trailerLength: "", tempControl: false, tempMin: "", tempMax: "",
    twicRequired: false, hazmatEndorsement: false, tankerEndorsement: false, minRating: "",
    targetRate: "", maxBudget: "", paymentTerms: "30", notes: "",
  });

  const hazmatQuery = (trpc as any).esang.chat.useMutation();
  const createLoadMutation = (trpc as any).loads.createLoad.useMutation({
    onSuccess: (data: any) => { toast.success("Load created successfully"); navigate(`/shipper/loads/${data.id}`); },
    onError: (err: any) => toast.error("Failed to create load", { description: err.message }),
  });

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const nextStep = () => step < 7 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = () => {
    createLoadMutation.mutate({
      ...formData,
      weight: parseFloat(formData.weight) || 0,
    } as any);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Create New Load</h1>
          <p className="text-slate-400 text-sm mt-1">Step {step} of 7</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-colors", step === s.id ? "bg-cyan-500/20 text-cyan-400" : step > s.id ? "bg-green-500/20 text-green-400" : "bg-slate-800/50 text-slate-500")}>
              <s.icon className="w-4 h-4" />
              <span className="text-sm hidden md:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 w-8", step > s.id ? "bg-green-500" : "bg-slate-700")} />}
          </React.Fragment>
        ))}
      </div>

      <Progress value={(step / 7) * 100} className="h-2 mb-6" />

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Weight</Label><div className="flex gap-2"><Input type="number" value={formData.weight} onChange={e => updateField("weight", e.target.value)} className="bg-slate-700/50" /><Select value={formData.units} onValueChange={v => updateField("units", v)}><SelectTrigger className="w-24 bg-slate-700/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lbs">lbs</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent></Select></div></div>
              <div><Label>Pallets</Label><Input type="number" value={formData.pallets} onChange={e => updateField("pallets", e.target.value)} className="bg-slate-700/50" /></div>
              <div><Label>Pieces</Label><Input type="number" value={formData.pieces} onChange={e => updateField("pieces", e.target.value)} className="bg-slate-700/50" /></div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <h3 className="text-green-400 font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Origin</h3>
                <Input value={formData.originName} onChange={e => updateField("originName", e.target.value)} placeholder="Facility Name" className="bg-slate-700/50" />
                <Input value={formData.originAddress} onChange={e => updateField("originAddress", e.target.value)} placeholder="Address" className="bg-slate-700/50" />
                <div className="grid grid-cols-3 gap-2"><Input value={formData.originCity} onChange={e => updateField("originCity", e.target.value)} placeholder="City" className="bg-slate-700/50" /><Input value={formData.originState} onChange={e => updateField("originState", e.target.value)} placeholder="State" className="bg-slate-700/50" /><Input value={formData.originZip} onChange={e => updateField("originZip", e.target.value)} placeholder="ZIP" className="bg-slate-700/50" /></div>
                <Input value={formData.originContact} onChange={e => updateField("originContact", e.target.value)} placeholder="Contact Name" className="bg-slate-700/50" />
                <Input value={formData.originPhone} onChange={e => updateField("originPhone", e.target.value)} placeholder="Phone" className="bg-slate-700/50" />
              </div>
              <div className="space-y-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <h3 className="text-red-400 font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Destination</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Equipment Type</Label><Select value={formData.equipmentType} onValueChange={v => updateField("equipmentType", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="dry_van">Dry Van</SelectItem><SelectItem value="reefer">Reefer</SelectItem><SelectItem value="flatbed">Flatbed</SelectItem><SelectItem value="tanker">Tanker</SelectItem><SelectItem value="step_deck">Step Deck</SelectItem><SelectItem value="lowboy">Lowboy</SelectItem></SelectContent></Select></div>
                <div><Label>Trailer Length</Label><Select value={formData.trailerLength} onValueChange={v => updateField("trailerLength", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="48">48 ft</SelectItem><SelectItem value="53">53 ft</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.tempControl} onCheckedChange={v => updateField("tempControl", v)} /><Label>Temperature Controlled</Label></div>
              {formData.tempControl && <div className="grid grid-cols-2 gap-4"><div><Label>Min Temp (°F)</Label><Input type="number" value={formData.tempMin} onChange={e => updateField("tempMin", e.target.value)} className="bg-slate-700/50" /></div><div><Label>Max Temp (°F)</Label><Input type="number" value={formData.tempMax} onChange={e => updateField("tempMax", e.target.value)} className="bg-slate-700/50" /></div></div>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Checkbox checked={formData.twicRequired} onCheckedChange={v => updateField("twicRequired", v)} /><Label>TWIC Card Required</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={formData.hazmatEndorsement} onCheckedChange={v => updateField("hazmatEndorsement", v)} /><Label>Hazmat Endorsement</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={formData.tankerEndorsement} onCheckedChange={v => updateField("tankerEndorsement", v)} /><Label>Tanker Endorsement</Label></div>
              </div>
              <div><Label>Minimum Safety Rating</Label><Select value={formData.minRating} onValueChange={v => updateField("minRating", v)}><SelectTrigger className="bg-slate-700/50 w-48"><SelectValue placeholder="Any" /></SelectTrigger><SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="satisfactory">Satisfactory</SelectItem><SelectItem value="conditional">Conditional or Better</SelectItem></SelectContent></Select></div>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Target Rate ($)</Label><Input type="number" value={formData.targetRate} onChange={e => updateField("targetRate", e.target.value)} className="bg-slate-700/50" /></div>
              <div><Label>Maximum Budget ($)</Label><Input type="number" value={formData.maxBudget} onChange={e => updateField("maxBudget", e.target.value)} className="bg-slate-700/50" /></div>
              <div><Label>Payment Terms</Label><Select value={formData.paymentTerms} onValueChange={v => updateField("paymentTerms", v)}><SelectTrigger className="bg-slate-700/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="quick">Quick Pay (2%)</SelectItem><SelectItem value="15">Net 15</SelectItem><SelectItem value="30">Net 30</SelectItem></SelectContent></Select></div>
              <div className="col-span-full"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => updateField("notes", e.target.value)} className="bg-slate-700/50" /></div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Review Your Load</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">Product:</span> <span className="text-white">{formData.productName}</span></div>
                <div><span className="text-slate-400">Hazmat:</span> <span className="text-white">{formData.isHazmat ? `Yes - Class ${formData.hazmatClass}` : "No"}</span></div>
                <div><span className="text-slate-400">Weight:</span> <span className="text-white">{formData.weight} {formData.units}</span></div>
                <div><span className="text-slate-400">Equipment:</span> <span className="text-white">{formData.equipmentType}</span></div>
                <div><span className="text-slate-400">Origin:</span> <span className="text-white">{formData.originCity}, {formData.originState}</span></div>
                <div><span className="text-slate-400">Destination:</span> <span className="text-white">{formData.destCity}, {formData.destState}</span></div>
                <div><span className="text-slate-400">Target Rate:</span> <span className="text-white">${formData.targetRate}</span></div>
                <div><span className="text-slate-400">Max Budget:</span> <span className="text-white">${formData.maxBudget}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1} className="bg-slate-800/50 border-slate-700/50"><ChevronLeft className="w-4 h-4 mr-2" />Previous</Button>
        {step < 7 ? <Button onClick={nextStep} className="bg-gradient-to-r from-cyan-600 to-emerald-600">Next<ChevronRight className="w-4 h-4 ml-2" /></Button> : <Button onClick={handleSubmit} disabled={createLoadMutation.isPending} className="bg-gradient-to-r from-cyan-600 to-emerald-600">{createLoadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}Create Load</Button>}
      </div>
    </div>
  );
}
