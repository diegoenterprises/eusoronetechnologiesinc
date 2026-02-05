/**
 * LOAD WIZARD PAGE (Multi-step load creation)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, Calendar, ArrowRight,
  ArrowLeft, CheckCircle, Loader2, AlertTriangle, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

const STEPS = [
  { id: 1, title: "Hazmat Classification", icon: AlertTriangle },
  { id: 2, title: "Quantity & Weight", icon: Package },
  { id: 3, title: "Origin", icon: MapPin },
  { id: 4, title: "Destination", icon: MapPin },
  { id: 5, title: "Equipment", icon: Truck },
  { id: 6, title: "Carrier Requirements", icon: CheckCircle },
  { id: 7, title: "Pricing", icon: DollarSign },
];

export default function LoadWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: "",
    hazmatClass: "",
    unNumber: "",
    packingGroup: "",
    quantity: "",
    weight: "",
    originCity: "",
    originState: "",
    originAddress: "",
    pickupDate: "",
    destinationCity: "",
    destinationState: "",
    destinationAddress: "",
    deliveryDate: "",
    equipmentType: "",
    specialRequirements: [] as string[],
    minRating: "",
    minLoads: "",
    rate: "",
    rateType: "flat",
    notes: "",
  });

  const classifyMutation = (trpc as any).esang.classifyHazmat.useMutation({
    onSuccess: (data: any) => {
      if (data.hazmatClass) {
        setFormData((prev: any) => ({
          ...prev,
          hazmatClass: data.hazmatClass,
          unNumber: data.unNumber || "",
          packingGroup: data.packingGroup || "",
        }));
        toast.success("ESANG AI classified your product");
      }
    },
  });

  const createMutation = (trpc as any).loads.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Load created successfully");
      setLocation(`/loads/${data.id}`);
    },
    onError: (error: any) => toast.error("Failed to create load", { description: error.message }),
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClassify = () => {
    if (formData.productName) {
      classifyMutation.mutate({ productName: formData.productName });
    }
  };

  const handleSubmit = () => {
    createMutation.mutate({
      cargoType: "hazmat" as const,
      pickupLocation: { address: formData.originAddress, city: formData.originCity, state: formData.originState, zipCode: "", lat: 0, lng: 0 },
      deliveryLocation: { address: formData.destinationAddress, city: formData.destinationCity, state: formData.destinationState, zipCode: "", lat: 0, lng: 0 },
      pickupDate: new Date(formData.pickupDate),
      deliveryDate: new Date(formData.deliveryDate),
      weight: parseFloat(formData.weight) || 0,
      rate: parseFloat(formData.rate) || 0,
    } as any);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-400">Product Name</Label>
              <div className="flex gap-2">
                <Input value={formData.productName} onChange={(e: any) => setFormData({ ...formData, productName: e.target.value })} placeholder="Enter product name" className="flex-1 bg-slate-700/30 border-slate-600/50 rounded-lg" />
                <Button variant="outline" className="bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30 text-purple-400 rounded-lg" onClick={handleClassify} disabled={classifyMutation.isPending}>
                  {classifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
                  Classify
                </Button>
              </div>
              <p className="text-xs text-slate-500">ESANG AI will suggest hazmat classification</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Hazmat Class</Label>
                <Select value={formData.hazmatClass} onValueChange={(v: any) => setFormData({ ...formData, hazmatClass: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="2">Class 2 - Gases</SelectItem>
                    <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="5">Class 5 - Oxidizers</SelectItem>
                    <SelectItem value="6">Class 6 - Toxic</SelectItem>
                    <SelectItem value="7">Class 7 - Radioactive</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosive</SelectItem>
                    <SelectItem value="9">Class 9 - Misc</SelectItem>
                    <SelectItem value="none">Non-Hazmat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">UN Number</Label>
                <Input value={formData.unNumber} onChange={(e: any) => setFormData({ ...formData, unNumber: e.target.value })} placeholder="UN1234" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Packing Group</Label>
                <Select value={formData.packingGroup} onValueChange={(v: any) => setFormData({ ...formData, packingGroup: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">PG I - High Danger</SelectItem>
                    <SelectItem value="II">PG II - Medium Danger</SelectItem>
                    <SelectItem value="III">PG III - Low Danger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-400">Quantity (gallons)</Label>
              <Input type="number" value={formData.weight} onChange={(e: any) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Enter quantity" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Weight (lbs)</Label>
              <Input type="number" value={formData.weight} onChange={(e: any) => setFormData({ ...formData, weight: e.target.value })} placeholder="Enter weight" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">City</Label>
                <Input value={formData.originCity} onChange={(e: any) => setFormData({ ...formData, originCity: e.target.value })} placeholder="City" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.originState} onChange={(e: any) => setFormData({ ...formData, originState: e.target.value })} placeholder="State" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Address</Label>
              <Input value={formData.originAddress} onChange={(e: any) => setFormData({ ...formData, originAddress: e.target.value })} placeholder="Full address" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Pickup Date</Label>
              <Input type="date" value={formData.pickupDate} onChange={(e: any) => setFormData({ ...formData, pickupDate: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">City</Label>
                <Input value={formData.destinationCity} onChange={(e: any) => setFormData({ ...formData, destinationCity: e.target.value })} placeholder="City" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.destinationState} onChange={(e: any) => setFormData({ ...formData, destinationState: e.target.value })} placeholder="State" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Address</Label>
              <Input value={formData.destinationAddress} onChange={(e: any) => setFormData({ ...formData, destinationAddress: e.target.value })} placeholder="Full address" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Delivery Date</Label>
              <Input type="date" value={formData.deliveryDate} onChange={(e: any) => setFormData({ ...formData, deliveryDate: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-2">
            <Label className="text-slate-400">Equipment Type</Label>
            <Select value={formData.equipmentType} onValueChange={(v: any) => setFormData({ ...formData, equipmentType: v })}>
              <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select equipment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="dry_van">Dry Van</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="reefer">Reefer</SelectItem>
                <SelectItem value="step_deck">Step Deck</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-400">Minimum Rating</Label>
              <Input type="number" value={formData.minRating} onChange={(e: any) => setFormData({ ...formData, minRating: e.target.value })} placeholder="e.g., 4.0" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Minimum Loads Completed</Label>
              <Input type="number" value={formData.minLoads} onChange={(e: any) => setFormData({ ...formData, minLoads: e.target.value })} placeholder="e.g., 50" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Rate ($)</Label>
                <Input type="number" value={formData.rate} onChange={(e: any) => setFormData({ ...formData, rate: e.target.value })} placeholder="Enter rate" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Rate Type</Label>
                <Select value={formData.rateType} onValueChange={(v: any) => setFormData({ ...formData, rateType: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="per_mile">Per Mile</SelectItem>
                    <SelectItem value="per_gallon">Per Gallon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Notes</Label>
              <Textarea value={formData.notes} onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." className="bg-slate-700/30 border-slate-600/50 rounded-lg min-h-[100px]" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Create Load
        </h1>
        <p className="text-slate-400 text-sm mt-1">Step {currentStep} of {STEPS.length}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step: any, idx: number) => (
          <React.Fragment key={step.id}>
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", currentStep === step.id ? "bg-cyan-500/20 text-cyan-400" : currentStep > step.id ? "bg-green-500/20 text-green-400" : "bg-slate-700/30 text-slate-500")}>
              {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              <span className="text-sm hidden md:inline">{step.title}</span>
            </div>
            {idx < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Form */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">{STEPS[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={handleBack} disabled={currentStep === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        {currentStep < STEPS.length ? (
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleNext}>
            Next<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Create Load
          </Button>
        )}
      </div>
    </div>
  );
}
