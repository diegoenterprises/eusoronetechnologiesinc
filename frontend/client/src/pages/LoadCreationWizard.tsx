/**
 * LOAD CREATION WIZARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, CheckCircle,
  ArrowRight, ArrowLeft, AlertTriangle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["Hazmat Classification", "Quantity", "Origin/Destination", "Equipment", "Carrier Requirements", "Pricing", "Review"];

export default function LoadCreationWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const hazmatQuery = trpc.loads.getHazmatClasses.useQuery();
  const equipmentQuery = trpc.loads.getEquipmentTypes.useQuery();
  const suggestMutation = trpc.esang.suggestClassification.useMutation();

  const createMutation = trpc.loads.createLoad.useMutation({
    onSuccess: () => { toast.success("Load created successfully"); setStep(0); setFormData({}); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const handleSuggest = () => {
    if (formData.productName) {
      suggestMutation.mutate({ productName: formData.productName }, {
        onSuccess: (data) => { updateField("hazmatClass", data.suggestedClass); updateField("unNumber", data.unNumber); }
      });
    }
  };

  const handleSubmit = () => createMutation.mutate(formData);

  const canProceed = () => {
    switch (step) {
      case 0: return formData.productName && formData.hazmatClass;
      case 1: return formData.quantity && formData.weight;
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Create Load</h1>
          <p className="text-slate-400 text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
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
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Product Name</label>
                <div className="flex gap-2">
                  <Input value={formData.productName || ""} onChange={(e) => updateField("productName", e.target.value)} placeholder="e.g., Gasoline, Diesel Fuel" className="bg-slate-700/50 border-slate-600/50 rounded-lg flex-1" />
                  <Button variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg" onClick={handleSuggest} disabled={suggestMutation.isPending}>
                    <Sparkles className="w-4 h-4 mr-2" />ESANG AI
                  </Button>
                </div>
              </div>
              {hazmatQuery.isLoading ? <Skeleton className="h-10 w-full" /> : (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Hazmat Classification</label>
                  <Select value={formData.hazmatClass || ""} onValueChange={(v) => updateField("hazmatClass", v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{hazmatQuery.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">UN Number (optional)</label>
                <Input value={formData.unNumber || ""} onChange={(e) => updateField("unNumber", e.target.value)} placeholder="e.g., UN1203" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Quantity (gallons)</label><Input type="number" value={formData.quantity || ""} onChange={(e) => updateField("quantity", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Weight (lbs)</label><Input type="number" value={formData.weight || ""} onChange={(e) => updateField("weight", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-green-400" />Origin</label><Input value={formData.origin || ""} onChange={(e) => updateField("origin", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" />Destination</label><Input value={formData.destination || ""} onChange={(e) => updateField("destination", e.target.value)} placeholder="City, State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">Pickup Date</label><Input type="date" value={formData.pickupDate || ""} onChange={(e) => updateField("pickupDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Delivery Date</label><Input type="date" value={formData.deliveryDate || ""} onChange={(e) => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {equipmentQuery.isLoading ? <Skeleton className="h-10 w-full" /> : (
                <div><label className="text-sm text-slate-400 mb-1 block">Equipment Type</label>
                  <Select value={formData.equipment || ""} onValueChange={(v) => updateField("equipment", v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                    <SelectContent>{equipmentQuery.data?.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Minimum Safety Score</label><Input type="number" value={formData.minSafetyScore || ""} onChange={(e) => updateField("minSafetyScore", e.target.value)} placeholder="e.g., 80" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Required Endorsements</label><Input value={formData.endorsements || ""} onChange={(e) => updateField("endorsements", e.target.value)} placeholder="e.g., Hazmat, Tanker" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Rate ($)</label><Input type="number" value={formData.rate || ""} onChange={(e) => updateField("rate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Rate Per Mile ($)</label><Input type="number" step="0.01" value={formData.ratePerMile || ""} onChange={(e) => updateField("ratePerMile", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-white font-bold text-lg">Review Your Load</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Product</p><p className="text-white">{formData.productName}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Hazmat Class</p><p className="text-white">{formData.hazmatClass}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Quantity</p><p className="text-white">{formData.quantity} gal</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Weight</p><p className="text-white">{formData.weight} lbs</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Origin</p><p className="text-white">{formData.origin}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Destination</p><p className="text-white">{formData.destination}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Equipment</p><p className="text-white">{formData.equipment}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rate</p><p className="text-white">${formData.rate}</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Next<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={handleSubmit} disabled={createMutation.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" />Create Load
          </Button>
        )}
      </div>
    </div>
  );
}
