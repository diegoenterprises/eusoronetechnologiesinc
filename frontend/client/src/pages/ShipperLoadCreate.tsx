/**
 * SHIPPER LOAD CREATE PAGE
 * 100% Dynamic - Multi-step load creation wizard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Package, MapPin, Truck, DollarSign, Calendar,
  ChevronRight, ChevronLeft, Check, AlertTriangle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Product", icon: Package },
  { id: 2, title: "Origin & Dest", icon: MapPin },
  { id: 3, title: "Equipment", icon: Truck },
  { id: 4, title: "Pricing", icon: DollarSign },
  { id: 5, title: "Review", icon: Check },
];

export default function ShipperLoadCreate() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    productName: "",
    hazmatClass: "",
    unNumber: "",
    quantity: "",
    unit: "gallons",
    originCity: "",
    originState: "",
    originFacility: "",
    destCity: "",
    destState: "",
    destFacility: "",
    pickupDate: "",
    pickupTime: "",
    deliveryDate: "",
    deliveryTime: "",
    equipment: "tanker",
    specialRequirements: [] as string[],
    rateType: "flat",
    rate: "",
    notes: "",
  });

  const classifyMutation = trpc.esang.classifyHazmat.useMutation();
  const classifyData = classifyMutation.data;
  const rateQuery = trpc.esang.getLoadRecommendations.useQuery({
    loadId: "",
  }, { enabled: currentStep === 4 && !!formData.originCity && !!formData.destCity });

  const createMutation = trpc.loads.create.useMutation({
    onSuccess: (data) => {
      toast.success("Load created successfully");
      navigate(`/shipper/loads/${data.id}`);
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Product Name</label>
              <Input
                value={formData.productName}
                onChange={(e) => updateField("productName", e.target.value)}
                placeholder="e.g., Diesel Fuel, Gasoline"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>

            {classifyData && (
              <Card className="bg-purple-500/10 border-purple-500/30 rounded-lg">
                <CardContent className="p-4 flex items-center gap-4">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="text-purple-400 font-medium">ESANG AI Suggestion</p>
                    <p className="text-white">Class {classifyData.hazmatClass} - {classifyData.description}</p>
                  </div>
                  <Button size="sm" onClick={() => {
                    updateField("hazmatClass", classifyData.hazmatClass);
                    updateField("unNumber", classifyData.unNumber);
                  }} className="ml-auto bg-purple-600">Apply</Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">Hazmat Class</label>
                <Select value={formData.hazmatClass} onValueChange={(v) => updateField("hazmatClass", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Class 3 - Flammable Liquid</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosive</SelectItem>
                    <SelectItem value="9">Class 9 - Misc</SelectItem>
                    <SelectItem value="none">Non-Hazmat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">UN Number</label>
                <Input value={formData.unNumber} onChange={(e) => updateField("unNumber", e.target.value)} placeholder="e.g., UN1203" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">Quantity</label>
                <Input type="number" value={formData.quantity} onChange={(e) => updateField("quantity", e.target.value)} placeholder="0" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">Unit</label>
                <Select value={formData.unit} onValueChange={(v) => updateField("unit", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="barrels">Barrels</SelectItem>
                    <SelectItem value="lbs">Pounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-white font-medium mb-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400" />Origin</p>
              <div className="grid grid-cols-2 gap-4">
                <Input value={formData.originCity} onChange={(e) => updateField("originCity", e.target.value)} placeholder="City" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                <Input value={formData.originState} onChange={(e) => updateField("originState", e.target.value)} placeholder="State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <Input value={formData.originFacility} onChange={(e) => updateField("originFacility", e.target.value)} placeholder="Facility Name" className="mt-2 bg-slate-700/50 border-slate-600/50 rounded-lg" />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input type="date" value={formData.pickupDate} onChange={(e) => updateField("pickupDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                <Input type="time" value={formData.pickupTime} onChange={(e) => updateField("pickupTime", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </div>

            <div>
              <p className="text-white font-medium mb-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400" />Destination</p>
              <div className="grid grid-cols-2 gap-4">
                <Input value={formData.destCity} onChange={(e) => updateField("destCity", e.target.value)} placeholder="City" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                <Input value={formData.destState} onChange={(e) => updateField("destState", e.target.value)} placeholder="State" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <Input value={formData.destFacility} onChange={(e) => updateField("destFacility", e.target.value)} placeholder="Facility Name" className="mt-2 bg-slate-700/50 border-slate-600/50 rounded-lg" />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input type="date" value={formData.deliveryDate} onChange={(e) => updateField("deliveryDate", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
                <Input type="time" value={formData.deliveryTime} onChange={(e) => updateField("deliveryTime", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Equipment Type</label>
              <Select value={formData.equipment} onValueChange={(v) => updateField("equipment", v)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="van">Dry Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Special Requirements</label>
              <div className="grid grid-cols-2 gap-2">
                {["Hazmat Endorsed", "TWIC Required", "Tank Wash", "Dedicated Clean"].map((req) => (
                  <Button
                    key={req}
                    variant="outline"
                    onClick={() => {
                      const current = formData.specialRequirements;
                      updateField("specialRequirements", current.includes(req) ? current.filter(r => r !== req) : [...current, req]);
                    }}
                    className={cn(
                      "justify-start rounded-lg",
                      formData.specialRequirements.includes(req) ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-slate-700/50 border-slate-600/50"
                    )}
                  >
                    {req}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Notes</label>
              <Textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Additional instructions..." className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {rateQuery.data && (
              <Card className="bg-purple-500/10 border-purple-500/30 rounded-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-purple-400 font-medium">ESANG AI Rate Suggestion</p>
                      <p className="text-white text-xl font-bold">${rateQuery.data.lowEstimate} - ${rateQuery.data.highEstimate}</p>
                    </div>
                    <Button size="sm" onClick={() => updateField("rate", rateQuery.data.midEstimate?.toString())} className="ml-auto bg-purple-600">Use Mid</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">Rate Type</label>
                <Select value={formData.rateType} onValueChange={(v) => updateField("rateType", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="per_mile">Per Mile</SelectItem>
                    <SelectItem value="bid">Open to Bids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">{formData.rateType === "bid" ? "Max Budget" : "Rate"}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  <Input type="number" value={formData.rate} onChange={(e) => updateField("rate", e.target.value)} placeholder="0.00" className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Card className="bg-slate-700/30 border-slate-600/50 rounded-lg">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Product</span><span className="text-white">{formData.productName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Quantity</span><span className="text-white">{formData.weight} {formData.weightUnit}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Hazmat</span><span className="text-white">Class {formData.hazmatClass} • {formData.unNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Route</span><span className="text-white">{formData.originCity}, {formData.originState} → {formData.destCity}, {formData.destState}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Pickup</span><span className="text-white">{formData.pickupDate} {formData.pickupTime}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Delivery</span><span className="text-white">{formData.deliveryDate} {formData.deliveryTime}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Equipment</span><span className="text-white">{formData.equipment}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Rate</span><span className="text-green-400 font-bold">${formData.rate}</span></div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Create Load</h1>

      {/* Progress */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                currentStep >= step.id ? "bg-cyan-500" : "bg-slate-700"
              )}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <span className={cn("text-xs mt-1", currentStep >= step.id ? "text-cyan-400" : "text-slate-500")}>{step.title}</span>
            </div>
            {idx < steps.length - 1 && <div className={cn("flex-1 h-0.5 mx-2", currentStep > step.id ? "bg-cyan-500" : "bg-slate-700")} />}
          </React.Fragment>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">{renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-slate-700/50 border-slate-600/50 rounded-lg">
          <ChevronLeft className="w-4 h-4 mr-1" />Back
        </Button>
        {currentStep < 5 ? (
          <Button onClick={nextStep} className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
            Next<ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => createMutation.mutate(formData as any)} disabled={createMutation.isPending} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-8">
            <Check className="w-4 h-4 mr-2" />Post Load
          </Button>
        )}
      </div>
    </div>
  );
}
